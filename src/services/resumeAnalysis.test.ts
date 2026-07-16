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
});
