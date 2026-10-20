import { useCallback, useMemo, useState } from 'react';
import { buildLocalAnalysis, buildLocalMatch, buildLocalRewrite } from '@/services/resumeAnalysis';
import { countWords, detectSections, extractTextFromFile, normalizeText } from '@/services/parsing';
import type { AiRewriteResult, AnalysisResult, MatchResult, ParsedResume, ResumeSection } from '@/types/resume';

type StatusType = 'idle' | 'busy' | 'success' | 'error';

interface ResumeState {
  file: File | null;
  originalText: string;
  text: string;
  sections: ResumeSection[];
  analysis: AnalysisResult | null;
  match: MatchResult | null;
  rewrite: AiRewriteResult | null;
  selectedSectionTitle: string;
  status: StatusType;
  statusMessage: string;
  jobDescription: string;
  isBusy: boolean;
  error: string | null;
}

const initialState: ResumeState = {
  file: null,
  originalText: '',
  text: '',
  sections: [],
  analysis: null,
  match: null,
  rewrite: null,
  selectedSectionTitle: '',
  status: 'idle',
  statusMessage: 'Upload a resume to start.',
  jobDescription: '',
  isBusy: false,
  error: null,
};

export function useResumeAssistant() {
  const [state, setState] = useState<ResumeState>(initialState);

  const setStatus = useCallback((status: StatusType, statusMessage: string, error: string | null = null) => {
    setState((current) => ({
      ...current,
      status,
      statusMessage,
      error,
    }));
  }, []);

  const setBusy = useCallback(
    (isBusy: boolean, statusMessage = '') => {
      setState((current) => ({
        ...current,
        isBusy,
      }));
      if (statusMessage) {
        setStatus(isBusy ? 'busy' : 'idle', statusMessage);
      }
    },
    [setStatus],
  );

  const loadResume = useCallback(
    async (file: File) => {
      try {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !['pdf', 'docx'].includes(ext)) {
          throw new Error('Use a PDF or DOCX file.');
        }

        setBusy(true, `Reading ${file.name}...`);

        const rawText = await extractTextFromFile(file);
        const text = normalizeText(rawText);

        if (!text) {
          throw new Error('No text found in the file.');
        }

        const sections = detectSections(text);
        const analysis = buildLocalAnalysis(text, sections, state.jobDescription);
        const rewritePreview = buildLocalEntireRewrite(text, sections, analysis, null);

        setState((current) => ({
          ...current,
          file,
          originalText: text,
          text,
          sections,
          analysis,
          match: null,
          rewrite: rewritePreview,
          selectedSectionTitle: sections[0]?.title ?? '',
          status: 'success',
          statusMessage: `Read ${countWords(text)} words. ATS score updated.`,
          isBusy: false,
          error: null,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Something went wrong.';
        setState((current) => ({
          ...current,
          file: null,
          originalText: '',
          text: '',
          sections: [],
          analysis: null,
          match: null,
          rewrite: null,
          selectedSectionTitle: '',
          status: 'error',
          statusMessage: message,
          isBusy: false,
          error: message,
        }));
      } finally {
        setState((current) => ({ ...current, isBusy: false }));
      }
    },
    [setBusy, state.jobDescription],
  );

  const analyze = useCallback(() => {
    if (!state.text) {
      setStatus('error', 'Upload a file first.', 'Upload a file first.');
      return;
    }

    setBusy(true, 'Analyzing resume...');
    try {
      const analysis = buildLocalAnalysis(state.text, state.sections, state.jobDescription);
      setState((current) => ({
        ...current,
        analysis,
        status: 'success',
        statusMessage: 'Analysis done.',
        error: null,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      setStatus('error', message, message);
    } finally {
      setState((current) => ({ ...current, isBusy: false }));
    }
  }, [setBusy, setStatus, state.sections, state.text]);

  const setJobDescription = useCallback((jobDescription: string) => {
    setState((current) => ({ ...current, jobDescription }));
  }, []);

  const match = useCallback(() => {
    if (!state.text) {
      setStatus('error', 'Upload a file first.', 'Upload a file first.');
      return;
    }
    if (!state.jobDescription.trim()) {
      setStatus('error', 'Paste a job description first.', 'Paste a job description first.');
      return;
    }

    setBusy(true, 'Checking match...');
    try {
      const matchResult = buildLocalMatch(state.text, state.jobDescription);
      const analysis = buildLocalAnalysis(state.text, state.sections, state.jobDescription);
      setState((current) => ({
        ...current,
        analysis,
        match: matchResult,
        status: 'success',
        statusMessage: 'Match done.',
        error: null,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      setStatus('error', message, message);
    } finally {
      setState((current) => ({ ...current, isBusy: false }));
    }
  }, [setBusy, setStatus, state.jobDescription, state.text]);

  const setSelectedSectionTitle = useCallback((selectedSectionTitle: string) => {
    setState((current) => ({
      ...current,
      selectedSectionTitle,
    }));
  }, []);

  const rewriteSelectedSection = useCallback(async () => {
    if (!state.text) {
      setStatus('error', 'Upload a file first.', 'Upload a file first.');
      return;
    }

    const section = findSectionByTitle(state.sections, state.selectedSectionTitle);
    if (!section) {
      setStatus('error', 'Pick a section first.', 'Pick a section first.');
      return;
    }

    setBusy(true, 'Fixing the selected section...');
    const rewrite = buildLocalSectionRewrite(state.text, state.sections, section.title, state.analysis, state.match);
    setState((current) => ({
      ...current,
      rewrite,
      status: 'success',
      statusMessage: 'Selected section improved locally.',
      isBusy: false,
      error: null,
    }));
  }, [setBusy, setStatus, state.analysis, state.jobDescription, state.match, state.sections, state.selectedSectionTitle, state.text]);

  const improveEntireResume = useCallback(async () => {
    if (!state.text) {
      setStatus('error', 'Upload a file first.', 'Upload a file first.');
      return;
    }

    setBusy(true, 'Improving the full resume...');
    const rewrite = buildLocalEntireRewrite(state.text, state.sections, state.analysis, state.match);
    setState((current) => ({
      ...current,
      rewrite,
      status: 'success',
      statusMessage: 'Full resume improved locally.',
      isBusy: false,
      error: null,
    }));
  }, [setBusy, setStatus, state.analysis, state.jobDescription, state.match, state.sections, state.text]);

  const applyChanges = useCallback(() => {
    const rewrite = state.rewrite;
    if (!rewrite) return;

    let nextText = state.text;
    if (rewrite.mode === 'entire') {
      nextText = rewrite.improvedText;
    } else if (rewrite.sectionTitle) {
      nextText = replaceSectionText(state.sections, rewrite.sectionTitle, rewrite.improvedText);
    }

    const nextSections = detectSections(nextText);
    const nextAnalysis = buildLocalAnalysis(nextText, nextSections, state.jobDescription);
    setState((current) => ({
      ...current,
      text: nextText,
      sections: nextSections,
      analysis: nextAnalysis,
      rewrite: null,
      selectedSectionTitle: nextSections[0]?.title ?? '',
      status: 'success',
      statusMessage: 'Changes applied and ATS score updated.',
      error: null,
    }));
  }, [state.rewrite, state.sections, state.text]);

  const rejectChanges = useCallback(() => {
    setState((current) => ({
      ...current,
      text: current.originalText,
      sections: detectSections(current.originalText),
      analysis: buildLocalAnalysis(current.originalText, detectSections(current.originalText), current.jobDescription),
      rewrite: null,
      selectedSectionTitle: detectSections(current.originalText)[0]?.title ?? '',
      status: 'success',
      statusMessage: 'Changes rejected.',
      error: null,
    }));
  }, []);

  const copyImprovedText = useCallback(async () => {
    const improvedText = state.rewrite?.improvedText;
    if (!improvedText) return;
    await navigator.clipboard.writeText(improvedText);
    setStatus('success', 'Improved resume text copied to clipboard.', null);
  }, [setStatus, state.rewrite?.improvedText]);

  const parsedResume: ParsedResume | null = useMemo(() => {
    if (!state.file) return null;
    return {
      file: state.file,
      text: state.text,
      sections: state.sections,
      wordCount: countWords(state.text),
    };
  }, [state.file, state.sections, state.text]);

  return {
    file: state.file,
    originalText: state.originalText,
    text: state.text,
    sections: state.sections,
    analysis: state.analysis,
    matchResult: state.match,
    rewriteResult: state.rewrite,
    selectedSectionTitle: state.selectedSectionTitle,
    status: state.status,
    statusMessage: state.statusMessage,
    jobDescription: state.jobDescription,
    isBusy: state.isBusy,
    error: state.error,
    parsedResume,
    loadResume,
    analyze,
    setJobDescription,
    match,
    setSelectedSectionTitle,
    rewriteSelectedSection,
    improveEntireResume,
    applyChanges,
    rejectChanges,
    copyImprovedText,
    wordCount: countWords(state.text),
  };
}

function buildLocalSectionRewrite(
  text: string,
  sections: ResumeSection[],
  sectionTitle: string,
  analysis: AnalysisResult | null,
  match: MatchResult | null,
): AiRewriteResult {
  const local = buildLocalRewrite(text, sections, analysis, match);
  const selected = local.rewrittenSections.find((section) => section.section.toLowerCase() === sectionTitle.toLowerCase()) ?? local.rewrittenSections[0];

  return {
    mode: 'section',
    sectionTitle: selected?.section ?? sectionTitle,
    originalText: selected?.original ?? '',
    improvedText: selected?.improved ?? '',
    summary: 'Local rewrite generated in the browser.',
    changes: selected
      ? [
          {
            section: selected.section,
            originalText: selected.original,
            improvedText: selected.improved,
            reason: 'Improved the selected section with clearer wording and ATS-friendly phrasing.',
            atsImpact: 'Medium',
          },
        ]
      : [],
    warnings: [],
  };
}

function buildLocalEntireRewrite(
  text: string,
  sections: ResumeSection[],
  analysis: AnalysisResult | null,
  match: MatchResult | null,
): AiRewriteResult {
  const local = buildLocalRewrite(text, sections, analysis, match);
  return {
    mode: 'entire',
    sectionTitle: null,
    originalText: text,
    improvedText: local.rewrittenResume,
    summary: 'Local full-resume rewrite generated in the browser.',
    changes: local.rewrittenSections.map((section) => ({
      section: section.section,
      originalText: section.original,
      improvedText: section.improved,
      reason: 'Improved clarity, structure, and ATS-friendly wording.',
      atsImpact: 'Medium' as const,
    })),
    warnings: [],
  };
}

function findSectionByTitle(sections: ResumeSection[], title: string) {
  return sections.find((section) => section.title.toLowerCase() === title.toLowerCase()) ?? sections[0] ?? null;
}

function replaceSectionText(sections: ResumeSection[], sectionTitle: string, improvedText: string) {
  const updatedSections = sections.map((section) =>
    section.title.toLowerCase() === sectionTitle.toLowerCase()
      ? { ...section, content: improvedText }
      : section,
  );

  return updatedSections.map((section) => `${section.title}\n${section.content}`.trim()).join('\n\n').trim();
}
