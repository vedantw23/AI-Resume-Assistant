import { describe, expect, it } from 'vitest';
import { buildLocalAnalysis, buildLocalMatch } from '@/services/resumeAnalysis';
import { detectSections } from '@/services/parsing';

describe('resume analysis helpers', () => {
  it('returns a bounded ATS score', () => {
    const text = `John Doe
john@example.com
1234567890
SKILLS
HTML CSS JavaScript React
EXPERIENCE
Built a dashboard and improved speed by 30%.
PROJECTS
Created a resume assistant.`;

    const analysis = buildLocalAnalysis(text, detectSections(text));
    expect(analysis.atsScore).toBeGreaterThanOrEqual(0);
    expect(analysis.atsScore).toBeLessThanOrEqual(100);
    expect(analysis.bestSectors.length).toBeGreaterThan(0);
  });

  it('builds a useful job match result', () => {
    const resume = 'HTML CSS JavaScript React Node';
    const job = 'Looking for a React developer with JavaScript and CSS skills.';

    const match = buildLocalMatch(resume, job);
    expect(match.matchPercentage).toBeGreaterThan(0);
    expect(match.matchedSkills.length).toBeGreaterThan(0);
    expect(match.suggestedKeywords.length).toBeGreaterThan(0);
  });

  it('produces different ATS scores for weak and strong resumes', () => {
    const weak = buildLocalAnalysis('A short profile.', detectSections('A short profile.'));
    const strongText = `Jane Doe
jane@example.com
+1 555 123 4567

SUMMARY
Frontend engineer
SKILLS
TypeScript React Node SQL Git
EXPERIENCE
Built and optimized a React dashboard, improving load time by 35%.
PROJECTS
Created an analytics platform used by 500 users.
EDUCATION
B.Tech Computer Science`;
    const strong = buildLocalAnalysis(strongText, detectSections(strongText));

    expect(strong.atsScore).toBeGreaterThan(weak.atsScore);
  });

  it('includes job-description relevance in the ATS score', () => {
    const resume = 'SKILLS\nReact TypeScript\nPROJECTS\nBuilt a web dashboard.';
    const sections = detectSections(resume);
    const unrelated = buildLocalAnalysis(resume, sections, 'Senior accountant with tax reporting experience');
    const relevant = buildLocalAnalysis(resume, sections, 'React TypeScript frontend developer');

    expect(relevant.atsScore).toBeGreaterThan(unrelated.atsScore);
  });
});
