import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import type { ResumeSection } from '@/types/resume';

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function normalizeText(text: string): string {
  return text
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const buffer = await file.arrayBuffer();

  if (ext === 'pdf') {
    return extractPdfText(buffer);
  }

  if (ext === 'docx') {
    return extractDocxText(buffer);
  }

  throw new Error('Use a PDF or DOCX file.');
}

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const document = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const chunks: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent({ normalizeWhitespace: true });
    const line = content.items
      .map((item) => {
        const text = 'str' in item ? item.str : '';
        return 'hasEOL' in item && item.hasEOL ? `${text}\n` : `${text} `;
      })
      .join('');
    chunks.push(line);
  }

  return chunks.join('\n\n');
}

async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value || '';
}

export function detectSections(text: string): ResumeSection[] {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const recognized = new Set([
    'summary',
    'professional summary',
    'profile',
    'skills',
    'technical skills',
    'core competencies',
    'experience',
    'work experience',
    'professional experience',
    'employment history',
    'education',
    'projects',
    'certifications',
    'achievements',
    'awards',
  ]);

  const sections: Array<{ title: string; lines: string[] }> = [];
  let current = { title: 'Full Resume', lines: [] as string[] };

  for (const line of lines) {
    const normalized = line.toLowerCase().replace(/[:\-–]+$/, '').trim();
    const headingLike = isHeadingLike(line, normalized, recognized);
    if (headingLike) {
      if (current.lines.length) {
        sections.push(current);
      }
      current = { title: prettyHeading(line), lines: [] };
    } else {
      current.lines.push(line);
    }
  }

  if (current.lines.length) {
    sections.push(current);
  }

  if (!sections.length) {
    return [{ title: 'Full Resume', content: text }];
  }

  return sections.map((section) => ({
    title: section.title,
    content: section.lines.join('\n'),
  }));
}

function isHeadingLike(original: string, normalized: string, recognizedSet: Set<string>): boolean {
  if (recognizedSet.has(normalized)) return true;
  if (recognizedSet.has(normalized.replace(/\s+/g, ' '))) return true;
  if (normalized.length <= 40 && /^[a-z][a-z\s/&+-]*$/.test(normalized) && /experience|education|skills|projects|summary|certifications|achievements|awards/i.test(normalized)) {
    return true;
  }
  if (original === original.toUpperCase() && original.length <= 48 && /[A-Z]/.test(original)) {
    return true;
  }
  return false;
}

function prettyHeading(text: string): string {
  return text
    .replace(/[:\-–]+$/, '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
