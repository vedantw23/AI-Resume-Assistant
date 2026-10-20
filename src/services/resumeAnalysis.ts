import type { AnalysisResult, MatchResult, RewrittenSection, RewriteResult, ResumeSection } from '@/types/resume';
import { countWords, normalizeText } from '@/services/parsing';

export function buildLocalAnalysis(text: string, sections: ResumeSection[], jobDescription = ''): AnalysisResult {
  const normalized = text.toLowerCase();
  const wordCount = countWords(text);
  const skillHits = scoreSkillKeywords(normalized);
  const sectionPresence = scoreSectionPresence(sections);
  const contactPresence = scoreContactPresence(text);
  const hasProjects = /projects?/i.test(text);
  const hasExperience = /experience|internship|employment|work history/i.test(text);
  const hasEducation = /education|college|school|university|btech|b\.tech|diploma/i.test(text);
  const hasMetrics = /\b\d+(?:\.\d+)?%?\b/.test(text) || /\b\d+\+\b/.test(text);
  const hasActionVerbs = /\b(led|built|created|developed|designed|implemented|improved|managed|solved|optimized|analyzed|collaborated|delivered)\b/i.test(text);

  const sectorMatches = getSectorMatches(normalized, skillHits);
  const sectorNames = sectorMatches.length ? sectorMatches.slice(0, 3).map((item) => item.name) : ['General Technology'];
  const highestSector = sectorMatches[0] || { name: 'General Technology', score: 50, keywords: [] as string[] };

  const keywordScore = scoreKeywordDepth(skillHits, sectorsFromMatches(sectorMatches));
  const impactScore = scoreImpact(text, hasMetrics, hasActionVerbs, hasExperience, hasProjects);
  const structureScore = scoreStructure(wordCount, sections, sectionPresence, contactPresence);
  const foundationScore = scoreFoundation(sectionPresence, contactPresence, hasEducation);

  // Normalize each raw component before combining it. The helpers use different
  // ranges; combining their raw values makes most resumes converge on one score.
  const baseScore =
    (foundationScore / 68) * 25 +
    (keywordScore / 80) * 30 +
    (impactScore / 48) * 25 +
    (structureScore / 33) * 20;
  const jobMatchScore = jobDescription.trim() ? buildLocalMatch(text, jobDescription).matchPercentage : null;
  const score = clampScore(jobMatchScore === null ? baseScore : baseScore * 0.65 + jobMatchScore * 0.35);

  const missingKeywords = findMissingKeywords(normalized, sectorMatches);
  const strengths = buildStrengths(hasExperience, hasProjects, hasEducation, hasMetrics, hasActionVerbs, skillHits, sections);
  const weaknesses = buildWeaknesses(hasMetrics, hasActionVerbs, missingKeywords, wordCount, sections);
  const suggestions = buildSuggestions(missingKeywords, highestSector, hasMetrics, hasActionVerbs);

  return {
    atsScore: score,
    bestSectors: sectorNames,
    strengths,
    weaknesses,
    missingKeywords,
    suggestions,
    sectionNotes: buildSectionNotes(sections, score),
    summary: buildScoreSummary(score, sectorNames[0], sectionPresence, contactPresence, hasMetrics, hasActionVerbs),
  };
}

export function buildLocalMatch(resumeText: string, jobDescription: string): MatchResult {
  const resumeTokens = extractMeaningfulTokens(resumeText);
  const jobTokens = extractMeaningfulTokens(jobDescription);
  const resumeSet = new Set(resumeTokens);
  const matched: string[] = [];
  const missing: string[] = [];

  jobTokens.forEach((token) => {
    if (resumeSet.has(token)) {
      matched.push(token);
    } else {
      missing.push(token);
    }
  });

  const matchedSkills = dedupeReadable(matched);
  const missingSkills = dedupeReadable(missing);
  const matchPercentage = clampScore(jobTokens.length ? Math.round((matchedSkills.length / Math.max(1, jobTokens.length)) * 100) : 0);
  const suggestedKeywords = missingSkills.slice(0, 12);

  return {
    matchPercentage,
    matchedSkills,
    missingSkills,
    suggestedKeywords,
    summary:
      matchPercentage > 70
        ? 'Good match. Your resume covers most of the job terms.'
        : matchPercentage > 40
          ? 'Medium match. Add a few more job terms.'
          : 'Low match. Add more job keywords and project details.',
  };
}

export function buildLocalRewrite(resumeText: string, sections: ResumeSection[], analysis?: AnalysisResult | null, match?: MatchResult | null): RewriteResult {
  const cleaned = normalizeText(resumeText);
  const sectionMap = new Map<string, string>();

  sections.forEach((section) => {
    sectionMap.set(section.title.toLowerCase(), section.content.trim());
  });

  const bestSector = analysis?.bestSectors?.[0] || 'General Technology';
  const keywords = match?.suggestedKeywords?.slice(0, 6) || [];
  const improvedLines = [
    'PROFESSIONAL SUMMARY',
    `Focused resume for ${bestSector}.`,
    keywords.length ? `Keywords: ${keywords.join(', ')}.` : 'Keywords: add role-related terms.',
    '',
    'IMPROVED VERSION',
  ];

  ['summary', 'skills', 'experience', 'projects', 'education'].forEach((sectionName) => {
    const sectionText = findSectionText(sectionMap, sectionName);
    if (!sectionText) return;
    improvedLines.push(sectionName.toUpperCase());
    improvedLines.push(improveSectionText(sectionName, sectionText, keywords));
    improvedLines.push('');
  });

  if (!improvedLines.some((line) => line.includes('IMPROVED VERSION'))) {
    improvedLines.push('IMPROVED VERSION');
  }

  const rewrittenSections: RewrittenSection[] = sections.slice(0, 6).map((section) => ({
    section: section.title,
    original: section.content.slice(0, 250),
    improved: improveSectionText(section.title, section.content, keywords).slice(0, 250),
  }));

  return {
    originalSummary: `Original resume has ${countWords(cleaned)} words.`,
    rewrittenResume: improvedLines.join('\n').trim(),
    rewrittenSections,
  };
}

function scoreSkillKeywords(text: string) {
  const groups = {
    web: ['html', 'css', 'javascript', 'typescript', 'react', 'node', 'express', 'frontend', 'backend', 'full stack', 'web'],
    data: ['python', 'sql', 'pandas', 'numpy', 'power bi', 'tableau', 'excel', 'analytics', 'data'],
    software: ['java', 'c++', 'c#', 'git', 'github', 'oop', 'dsa', 'api', 'database', 'dbms'],
    mobile: ['android', 'flutter', 'kotlin', 'swift', 'mobile'],
    cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'devops'],
    cyber: ['cyber', 'security', 'network', 'firewall', 'penetration', 'linux'],
    design: ['figma', 'ui', 'ux', 'photoshop', 'illustrator', 'design'],
    business: ['communication', 'presentation', 'sales', 'marketing', 'finance', 'management', 'leadership'],
  } as const;

  const hits: Record<string, number> = {};
  let total = 0;
  Object.entries(groups).forEach(([name, list]) => {
    const count = list.reduce((sum, keyword) => sum + (text.includes(keyword) ? 1 : 0), 0);
    hits[name] = count;
    total += count;
  });

  return { ...hits, total };
}

function getSectorMatches(text: string, skillHits: { total: number }) {
  const sectors = [
    { name: 'Software Development', score: 0, keywords: ['java', 'c++', 'python', 'git', 'api', 'database', 'software'] },
    { name: 'Web Development', score: 0, keywords: ['html', 'css', 'javascript', 'react', 'node', 'frontend', 'backend', 'web'] },
    { name: 'Data Analytics', score: 0, keywords: ['sql', 'python', 'excel', 'tableau', 'power bi', 'analytics', 'data'] },
    { name: 'Cloud / DevOps', score: 0, keywords: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'devops'] },
    { name: 'Cybersecurity', score: 0, keywords: ['security', 'network', 'linux', 'penetration', 'firewall'] },
    { name: 'UI / UX Design', score: 0, keywords: ['figma', 'ui', 'ux', 'design', 'photoshop'] },
    { name: 'Marketing / Business', score: 0, keywords: ['marketing', 'sales', 'communication', 'leadership', 'management', 'finance'] },
    { name: 'Mobile App Development', score: 0, keywords: ['android', 'flutter', 'kotlin', 'swift', 'mobile'] },
  ];

  sectors.forEach((sector) => {
    sector.score = sector.keywords.reduce((sum, keyword) => sum + (text.includes(keyword) ? 12 : 0), 0);
  });

  if (skillHits.total >= 6) {
    sectors[0].score += 8;
  }
  if (text.includes('html') || text.includes('css') || text.includes('javascript')) {
    sectors[1].score += 20;
  }
  if (text.includes('python') && text.includes('sql')) {
    sectors[2].score += 16;
  }

  return sectors.filter((sector) => sector.score > 0).sort((a, b) => b.score - a.score);
}

function findMissingKeywords(text: string, sectorMatches: Array<{ keywords?: string[] }>) {
  const baseKeywords = ['resume', 'project', 'team', 'communication', 'problem solving', 'leadership'];
  const sectorKeywords = sectorMatches.flatMap((sector) => sector.keywords || []);
  const allKeywords = [...new Set([...baseKeywords, ...sectorKeywords])];
  const missing = allKeywords.filter((keyword) => !text.includes(keyword));
  return missing.slice(0, 12).map((item) => item.replace(/\b\w/g, (c) => c.toUpperCase()));
}

function buildStrengths(hasExperience: boolean, hasProjects: boolean, hasEducation: boolean, hasMetrics: boolean, hasActionVerbs: boolean, skillHits: { total: number }, sections: ResumeSection[]) {
  const strengths: string[] = [];
  if (skillHits.total >= 5) strengths.push('Good mix of technical skills.');
  if (hasExperience) strengths.push('Work experience is included.');
  if (hasProjects) strengths.push('Projects section is present.');
  if (hasEducation) strengths.push('Education details are included.');
  if (hasMetrics) strengths.push('You use numbers in the resume.');
  if (hasActionVerbs) strengths.push('You use strong action words.');
  if (sections.length >= 4) strengths.push('The resume has a clear structure.');
  return strengths.length ? strengths : ['Basic resume structure is present.'];
}

function buildWeaknesses(hasMetrics: boolean, hasActionVerbs: boolean, missingKeywords: string[], wordCount: number, sections: ResumeSection[]) {
  const weaknesses: string[] = [];
  if (!hasMetrics) weaknesses.push('Add numbers to show impact.');
  if (!hasActionVerbs) weaknesses.push('Use stronger action words.');
  if (missingKeywords.length) weaknesses.push('Add more job-related keywords.');
  if (wordCount < 200) weaknesses.push('The resume is short. Add more detail.');
  if (sections.length < 4) weaknesses.push('Add clear sections like Skills, Projects, and Experience.');
  return weaknesses.length ? weaknesses : ['The resume is already fairly structured.'];
}

function buildSuggestions(missingKeywords: string[], highestSector: { name: string }, hasMetrics: boolean, hasActionVerbs: boolean) {
  const suggestions = [];
  if (!hasActionVerbs) {
    suggestions.push({
      section: 'Experience',
      issue: 'Bullet points are weak',
      whyItIsWrong: 'Weak lines do not show clear impact.',
      howToFix: 'Start bullets with strong action words.',
      example: 'Built a student dashboard that reduced manual work by 30%.',
    });
  }
  if (!hasMetrics) {
    suggestions.push({
      section: 'Experience',
      issue: 'No numbers in results',
      whyItIsWrong: 'ATS and recruiters look for proof of impact.',
      howToFix: 'Add percentages, counts, time saved, or growth numbers.',
      example: 'Improved page load time by 25% and handled 1,000+ users.',
    });
  }
  if (missingKeywords.length) {
    suggestions.push({
      section: 'Skills',
      issue: 'Missing keywords',
      whyItIsWrong: 'The resume does not match common job terms well enough.',
      howToFix: 'Add the most important skill words naturally in skills and projects.',
      example: `Add terms like ${missingKeywords.slice(0, 4).join(', ')}.`,
    });
  }
  suggestions.push({
    section: 'Best sector',
    issue: 'Target is not clear',
    whyItIsWrong: 'A focused resume usually fits one main role better.',
    howToFix: `Aim the resume for ${highestSector.name}.`,
    example: `Use projects and skills that match ${highestSector.name}.`,
  });
  return suggestions.slice(0, 4);
}

function buildSectionNotes(sections: ResumeSection[], score: number) {
  return sections.slice(0, 6).map((section, index) => {
    const lengthScore = section.content.length > 200 ? 8 : section.content.length > 80 ? 4 : 0;
    return {
      section: section.title,
      score: clampScore(score - index * 3 + lengthScore),
      note: section.content ? 'Section found.' : 'Add more detail here.',
    };
  });
}

function scoreContactPresence(text: string) {
  const hasEmail = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text);
  const hasPhone = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)\d{3}[\s-]?\d{4}/.test(text);
  const hasLinkedIn = /linkedin\.com/i.test(text);
  const hasGitHub = /github\.com/i.test(text);
  return {
    hasEmail,
    hasPhone,
    hasLinkedIn,
    hasGitHub,
    score: (hasEmail ? 8 : 0) + (hasPhone ? 8 : 0) + (hasLinkedIn ? 2 : 0) + (hasGitHub ? 2 : 0),
  };
}

function scoreSectionPresence(sections: ResumeSection[]) {
  const names = sections.map((section) => section.title.toLowerCase());
  const hasSkills = names.some((name) => name.includes('skill'));
  const hasExperience = names.some((name) => name.includes('experience') || name.includes('work'));
  const hasEducation = names.some((name) => name.includes('education'));
  const hasProjects = names.some((name) => name.includes('project'));
  const hasSummary = names.some((name) => name.includes('summary') || name.includes('profile'));
  const hasContact = names.some((name) => name.includes('contact') || name.includes('profile'));

  return {
    hasSkills,
    hasExperience,
    hasEducation,
    hasProjects,
    hasSummary,
    hasContact,
    score: (hasSkills ? 5 : 0) + (hasExperience ? 5 : 0) + (hasEducation ? 4 : 0) + (hasProjects ? 4 : 0) + (hasSummary ? 2 : 0) + (hasContact ? 2 : 0),
  };
}

function sectorsFromMatches(sectorMatches: Array<{ name: string }>) {
  return sectorMatches.map((item) => item.name);
}

function scoreKeywordDepth(skillHits: { total: number }, sectors: string[]) {
  const uniqueSkillGroups = Object.entries(skillHits).filter(([key, value]) => key !== 'total' && Number(value) > 0).length;
  const sectorBonus = Math.min(10, sectors.length * 2);
  const totalKeywords = Math.min(18, skillHits.total * 2);
  return clampScore(10 + totalKeywords + uniqueSkillGroups * 3 + sectorBonus);
}

function scoreImpact(text: string, hasMetrics: boolean, hasActionVerbs: boolean, hasExperience: boolean, hasProjects: boolean) {
  const bulletCount = (text.match(/^[\s>*-•]/gm) || []).length;
  const sentenceCount = Math.max(1, text.split(/[.!?]+/).filter(Boolean).length);
  const metricBonus = hasMetrics ? 12 : 0;
  const actionBonus = hasActionVerbs ? 10 : 0;
  const experienceBonus = hasExperience ? 8 : 0;
  const projectBonus = hasProjects ? 8 : 0;
  const bulletBonus = Math.min(6, bulletCount / 2);
  const conciseBonus = sentenceCount > 6 ? 4 : 2;
  return clampScore(metricBonus + actionBonus + experienceBonus + projectBonus + bulletBonus + conciseBonus);
}

function scoreStructure(wordCount: number, sections: ResumeSection[], sectionPresence: { hasSummary: boolean }, contactPresence: { score: number }) {
  const sectionCount = sections.length;
  const lengthScore = wordCount >= 180 && wordCount <= 900 ? 10 : wordCount > 900 ? 6 : wordCount >= 100 ? 8 : 3;
  const sectionScore = Math.min(10, sectionCount * 2);
  const contactScore = contactPresence.score > 0 ? 8 : 0;
  const headerScore = sectionPresence.hasSummary ? 5 : 0;
  return clampScore(lengthScore + sectionScore + contactScore + headerScore);
}

function scoreFoundation(sectionPresence: { score: number }, contactPresence: { score: number }, hasEducation: boolean) {
  const contactScore = contactPresence.score;
  const sectionScore = sectionPresence.score;
  const educationScore = hasEducation ? 6 : 0;
  const base = 20;
  return clampScore(base + contactScore + sectionScore + educationScore);
}

function buildScoreSummary(score: number, bestSector: string, sectionPresence: { hasSkills: boolean; hasExperience: boolean; hasProjects: boolean }, contactPresence: { hasEmail: boolean; hasPhone: boolean }, hasMetrics: boolean, hasActionVerbs: boolean) {
  const parts: string[] = [];
  if (!contactPresence.hasEmail || !contactPresence.hasPhone) parts.push('Add clear contact details.');
  if (!sectionPresence.hasSkills) parts.push('Add a Skills section.');
  if (!sectionPresence.hasExperience && !sectionPresence.hasProjects) parts.push('Add Experience or Projects.');
  if (!hasMetrics) parts.push('Add numbers to show impact.');
  if (!hasActionVerbs) parts.push('Use stronger action words.');

  let label = 'Needs work';
  if (score >= 80) label = 'Strong resume';
  else if (score >= 65) label = 'Good resume';
  else if (score >= 45) label = 'Average resume';

  const tipText = parts.length ? ` ${parts.slice(0, 3).join(' ')}` : ' Keep it focused and clear.';
  return `${label}. Best fit: ${bestSector}.${tipText}`;
}

function extractMeaningfulTokens(text: string) {
  const stopWords = new Set([
    'the',
    'and',
    'for',
    'with',
    'that',
    'this',
    'from',
    'into',
    'your',
    'you',
    'are',
    'have',
    'has',
    'had',
    'job',
    'role',
    'skills',
    'skill',
    'resume',
    'work',
    'using',
    'used',
    'need',
    'required',
    'preferred',
    'will',
    'can',
    'our',
    'their',
    'its',
    'about',
    'based',
    'able',
    'more',
    'less',
    'good',
    'best',
    'team',
    'experience',
    'project',
    'projects',
    'education',
    'responsibilities',
    'responsibility',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#. ]+/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function dedupeReadable(tokens: string[]) {
  return [...new Set(tokens)].map((token) => token.replace(/\b\w/g, (c) => c.toUpperCase())).slice(0, 12);
}

function findSectionText(sectionMap: Map<string, string>, name: string) {
  for (const [key, value] of sectionMap.entries()) {
    if (key.includes(name)) return value;
  }
  return '';
}

function improveSectionText(title: string, text: string, keywords: string[] = []) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const updated = lines.map((line) => {
    if (/^[-•*]/.test(line)) return line;
    if (title.toLowerCase().includes('experience') && line.length > 20) {
      return `- ${line.replace(/^worked on\s+/i, 'Worked on ')}${keywords[0] ? ` using ${keywords[0]}` : ''}`;
    }
    if (title.toLowerCase().includes('skills')) {
      return line.replace(/\s+/g, ', ');
    }
    return line;
  });
  return updated.join('\n');
}

function clampScore(score: number) {
  const num = Number(score);
  if (Number.isNaN(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}
