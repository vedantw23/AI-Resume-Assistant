import { useMemo, useState, type ChangeEvent, type DragEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpenText,
  CheckCircle2,
  ClipboardList,
  Layers3,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Panel } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { StatCard } from '@/components/ui/StatCard';
import { useResumeAssistant } from '@/hooks/useResumeAssistant';
import type { SuggestionItem } from '@/types/resume';

export function App() {
  const assistant = useResumeAssistant();
  const [dragActive, setDragActive] = useState(false);

  const hasResume = Boolean(assistant.parsedResume);
  const sectionCount = assistant.parsedResume?.sections.length ?? 0;
  const atsScore = assistant.analysis?.atsScore ?? 0;
  const trustPills = useMemo(() => ['Quick score', 'PDF and DOCX support', 'Simple tips'], []);

  const handleFileInput = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await assistant.loadResume(file);
  };

  const handleDrop = async (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await assistant.loadResume(file);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.08),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#eef4ff_46%,_#f8fafc_100%)] text-text-primary">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white px-4 py-2 shadow-sm">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium text-text-secondary">Simple resume help</span>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
                Check your resume, find problems, and make it better.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-text-secondary">
                Upload a resume, see a score, compare it with a job post, and get easy fixes in a few clicks.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {trustPills.map((pill) => (
                <Badge key={pill} className="bg-white">
                  {pill}
                </Badge>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="ATS score" value={hasResume ? `${atsScore}` : '--'} />
              <StatCard label="Sections found" value={hasResume ? `${sectionCount}` : '--'} />
              <StatCard label="Status" value={assistant.status === 'idle' ? 'Ready' : assistant.status} />
            </div>
          </div>

          <Panel className="relative overflow-hidden bg-white">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(37,99,235,0.08),_rgba(16,185,129,0.04),_transparent_60%)]" />
            <div className="relative space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">What you get</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-text-primary">Fast checks, clear results</h2>
                </div>
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>

              <div className="grid gap-3">
                {['See a simple score and clear feedback.', 'Find missing skills and weak points.', 'Use PDF or DOCX files.'].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-border bg-slate-50 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                    <p className="text-sm leading-6 text-text-secondary">{item}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border bg-white p-4">
                <p className="text-sm font-semibold text-text-primary">How it works</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                  {['Upload', 'Check', 'Match', 'Fix', 'Copy'].map((step, index) => (
                    <div key={step} className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                      {index < 4 ? <ArrowRight className="h-4 w-4 text-border" aria-hidden="true" /> : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Panel className="space-y-5">
            <SectionHeading
              eyebrow="01. Upload"
              title="Upload your resume"
              description="Drop a PDF or DOCX file here. The app will show the text below."
            />

            <label
              className={`group flex min-h-64 cursor-pointer flex-col justify-center rounded-[18px] border-2 border-dashed p-6 text-center transition ${
                dragActive ? 'border-primary bg-primary/5 shadow-[0_0_0_6px_rgba(37,99,235,0.08)]' : 'border-border bg-slate-50'
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <input
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                id="resumeFile"
                type="file"
                onChange={handleFileInput}
              />
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                <UploadCloud className="h-7 w-7" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Drag and drop your file</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-secondary">
                Click to browse or drop your resume here. PDF and DOCX work best.
              </p>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard label="File" value={assistant.file?.name ?? 'No file loaded'} />
              <StatCard label="Words" value={assistant.wordCount > 0 ? `${assistant.wordCount}` : '0'} />
              <StatCard label="Sections" value={hasResume ? `${sectionCount}` : '0'} />
              <StatCard label="Type" value={assistant.file?.type || 'Unknown'} />
            </div>

            <div className="space-y-3 rounded-[18px] border border-border bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text-primary">Status</p>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    assistant.status === 'error'
                      ? 'bg-danger/10 text-danger'
                      : assistant.status === 'success'
                        ? 'bg-success/10 text-success'
                        : assistant.status === 'busy'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-slate-100 text-text-secondary'
                  }`}
                >
                  {assistant.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm leading-6 text-text-secondary">{assistant.statusMessage}</p>
              <AnimatePresence>
                {assistant.error ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{assistant.error}</span>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

          </Panel>

          <Panel className="space-y-5">
            <SectionHeading
              eyebrow="02. Preview"
              title="Resume preview"
              description="See the extracted text and the main sections we found."
            />

            <div className="flex flex-wrap gap-2">
              {assistant.sections.length ? (
                assistant.sections.slice(0, 6).map((section) => <Badge key={section.title}>{section.title}</Badge>)
              ) : (
                <Badge>No sections detected yet</Badge>
              )}
            </div>

            {assistant.sections.length ? (
              <div className="grid gap-3">
                {assistant.sections.slice(0, 4).map((section) => (
                  <motion.article key={section.title} whileHover={{ y: -2 }} className="rounded-[18px] border border-border bg-slate-50 p-4">
                    <h3 className="font-semibold text-text-primary">{section.title}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">
                      {section.content.slice(0, 260) || 'No text detected for this section.'}
                    </p>
                  </motion.article>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<ClipboardList className="h-5 w-5" aria-hidden="true" />}
                title="Upload a resume to preview the text"
                description="Your text, sections, and layout will appear here."
              />
            )}

            <div className="rounded-[18px] border border-border bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-primary">Extracted text</p>
                  <p className="text-xs text-text-secondary">Easy-to-read text</p>
                </div>
                <Badge className="bg-slate-50">Clean view</Badge>
              </div>
              <pre className="max-h-[26rem] overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-sm leading-7 text-slate-100">
                {assistant.text || 'Your extracted resume text will appear here.'}
              </pre>
            </div>
          </Panel>
        </section>

        <section className="mt-6 grid gap-6">
          <Panel className="space-y-5">
            <SectionHeading
              eyebrow="03. Analysis"
              title="ATS score and improvement ideas"
              description="See your score, strong points, weak points, and missing keywords."
            />

            <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-[18px] border border-border bg-white p-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">ATS score</p>
                    <p className="mt-1 text-5xl font-bold tracking-tight text-text-primary">{assistant.analysis ? atsScore : '--'}</p>
                  </div>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    ATS
                  </div>
                </div>
                <div className="mt-5">
                  <ProgressBar value={assistant.analysis ? atsScore : 0} />
                </div>
                <p className="mt-4 text-sm leading-6 text-text-secondary">
                  {assistant.analysis?.summary ?? 'Run analysis to see the score and tips.'}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[18px] border border-border bg-white p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                    <h3 className="font-semibold text-text-primary">Strengths</h3>
                  </div>
                  <ul className="space-y-2 text-sm leading-6 text-text-secondary">
                    {assistant.analysis?.strengths.length ? assistant.analysis.strengths.map((item) => <li key={item}>- {item}</li>) : <li>No result yet.</li>}
                  </ul>
                </div>

                <div className="rounded-[18px] border border-border bg-white p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-warning" aria-hidden="true" />
                    <h3 className="font-semibold text-text-primary">Weaknesses</h3>
                  </div>
                  <ul className="space-y-2 text-sm leading-6 text-text-secondary">
                    {assistant.analysis?.weaknesses.length ? assistant.analysis.weaknesses.map((item) => <li key={item}>- {item}</li>) : <li>No result yet.</li>}
                  </ul>
                </div>

                <div className="rounded-[18px] border border-border bg-white p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Layers3 className="h-4 w-4 text-primary" aria-hidden="true" />
                    <h3 className="font-semibold text-text-primary">Missing keywords</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {assistant.analysis?.missingKeywords.length ? (
                      assistant.analysis.missingKeywords.map((keyword) => <Badge key={keyword}>{keyword}</Badge>)
                    ) : (
                      <Badge>No result yet</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[18px] border border-border bg-white p-4">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                <h3 className="font-semibold text-text-primary">Suggestions</h3>
              </div>
              {assistant.analysis?.suggestions.length ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {assistant.analysis.suggestions.map((suggestion) => (
                    <SuggestionCard key={`${suggestion.section}-${suggestion.issue}`} suggestion={suggestion} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<BookOpenText className="h-5 w-5" aria-hidden="true" />}
                  title="No suggestions yet"
                  description="Analyze the resume to see simple fixes, examples, and keyword help."
                />
              )}
            </div>
          </Panel>

        </section>
      </main>

      <Footer />
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: SuggestionItem }) {
  return (
    <motion.article whileHover={{ y: -2 }} className="rounded-[18px] border border-border bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" aria-hidden="true" />
        <h4 className="font-semibold text-text-primary">{suggestion.section}</h4>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-6 text-text-secondary">
        <p>
          <span className="font-semibold text-text-primary">Issue: </span>
          {suggestion.issue}
        </p>
        <p>
          <span className="font-semibold text-text-primary">Why it is wrong: </span>
          {suggestion.whyItIsWrong}
        </p>
        <p>
          <span className="font-semibold text-text-primary">How to fix: </span>
          {suggestion.howToFix}
        </p>
        <p>
          <span className="font-semibold text-text-primary">Example: </span>
          {suggestion.example}
        </p>
      </div>
    </motion.article>
  );
}

function DiffText({
  text,
  compareText,
  mode,
  tooltip,
}: {
  text: string;
  compareText: string;
  mode: 'added' | 'removed';
  tooltip?: string;
}) {
  const compareTokens = new Set(tokenize(compareText));

  return (
    <>
      {text.split(/(\s+)/).map((part, index) => {
        if (!part.trim()) {
          return <span key={`${mode}-${index}`}>{part}</span>;
        }

        const token = normalizeDiffToken(part);
        const highlighted = token && !compareTokens.has(token);
        if (highlighted) {
          return (
            <mark
              key={`${mode}-${index}`}
              title={tooltip}
              className={`rounded px-1 py-0.5 ${
                mode === 'added' ? 'bg-emerald-400/25 text-emerald-100' : 'bg-rose-400/25 text-rose-100 line-through'
              }`}
            >
              {part}
            </mark>
          );
        }

        return <span key={`${mode}-${index}`}>{part}</span>;
      })}
    </>
  );
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function normalizeDiffToken(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#.]/g, '')
    .trim();
}

function ResumePane({
  title,
  subtitle,
  text,
  compareText,
  tone,
  emptyText,
}: {
  title: string;
  subtitle: string;
  text: string;
  compareText: string;
  tone: 'added' | 'removed';
  emptyText: string;
}) {
  return (
    <article className="overflow-hidden rounded-[18px] border border-border bg-white shadow-sm">
      <div className="border-b border-border bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-text-primary">{title}</h3>
            <p className="text-xs text-text-secondary">{subtitle}</p>
          </div>
          <Badge className="bg-white">{tone === 'added' ? 'Enhanced' : 'Original'}</Badge>
        </div>
      </div>
      <ResumeTextViewer
        text={text}
        compareText={compareText}
        tone={tone}
        emptyText={emptyText}
        className="max-h-[34rem]"
      />
    </article>
  );
}

function ResumeTextViewer({
  text,
  compareText,
  tone,
  emptyText,
  className = '',
}: {
  text: string;
  compareText: string;
  tone: 'added' | 'removed';
  emptyText: string;
  className?: string;
}) {
  if (!text.trim()) {
    return <div className="p-5 text-sm text-text-secondary">{emptyText}</div>;
  }

  const explanation =
    tone === 'added'
      ? 'Improved wording, stronger action verbs, and better ATS keywords.'
      : 'Text removed from the original version or replaced with stronger wording.';

  return (
    <div className={`overflow-auto bg-slate-950 p-5 text-sm leading-7 text-slate-100 ${className}`}>
      <pre className="whitespace-pre-wrap font-sans">
        <DiffText text={text} compareText={compareText} mode={tone} tooltip={explanation} />
      </pre>
    </div>
  );
}
