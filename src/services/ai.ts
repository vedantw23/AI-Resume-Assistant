import type { AiRewriteResult } from '@/types/resume';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function requestJson<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || 'AI service is unavailable right now.');
  }

  return response.json() as Promise<T>;
}

export async function extractResumeText(file: File): Promise<{ text: string }> {
  const formData = new FormData();
  formData.append('resume', file);

  const response = await fetch(`${API_BASE}/resume/extract`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || 'Could not read the file.');
  }

  return response.json() as Promise<{ text: string }>;
}

export async function rewriteSection(payload: {
  resumeText: string;
  sectionTitle: string;
  sectionText: string;
  jobDescription?: string;
}): Promise<AiRewriteResult> {
  return requestJson<AiRewriteResult>('/resume/rewrite-section', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function rewriteEntireResume(payload: {
  resumeText: string;
  jobDescription?: string;
}): Promise<AiRewriteResult> {
  return requestJson<AiRewriteResult>('/resume/rewrite-entire', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
