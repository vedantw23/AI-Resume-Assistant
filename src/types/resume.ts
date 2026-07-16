export interface ResumeSection {
  title: string;
  content: string;
}

export interface SuggestionItem {
  section: string;
  issue: string;
  whyItIsWrong: string;
  howToFix: string;
  example: string;
}

export interface SectionNote {
  section: string;
  score: number;
  note: string;
}

export interface AnalysisResult {
  atsScore: number;
  bestSectors: string[];
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  suggestions: SuggestionItem[];
  sectionNotes: SectionNote[];
  summary: string;
}

export interface MatchResult {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  suggestedKeywords: string[];
  summary: string;
}

export interface RewrittenSection {
  section: string;
  original: string;
  improved: string;
}

export interface RewriteResult {
  originalSummary: string;
  rewrittenResume: string;
  rewrittenSections: RewrittenSection[];
}

export type AtsImpact = 'Low' | 'Medium' | 'High';

export interface ResumeChange {
  section: string;
  originalText: string;
  improvedText: string;
  reason: string;
  atsImpact: AtsImpact;
}

export interface AiRewriteResult {
  mode: 'section' | 'entire';
  sectionTitle: string | null;
  originalText: string;
  improvedText: string;
  summary: string;
  changes: ResumeChange[];
  warnings: string[];
}

export interface ParsedResume {
  file: File;
  text: string;
  sections: ResumeSection[];
  wordCount: number;
}
