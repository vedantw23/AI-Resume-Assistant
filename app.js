const state = {
  file: null,
  text: '',
  sections: [],
  analysis: null,
  match: null,
  rewrite: null,
  isBusy: false,
};

const els = {};

document.addEventListener('DOMContentLoaded', init);

function init() {
  cacheElements();
  setupLibraries();
  bindEvents();
  renderInitialState();
}

function cacheElements() {
  const ids = [
    'analysisStatusDot',
    'dropzone',
    'resumeFile',
    'fileName',
    'wordCount',
    'sectionCount',
    'fileType',
    'analyzeBtn',
    'matchBtn',
    'fixBtn',
    'runMatchBtn',
    'copyImprovedBtn',
    'statusMessage',
    'sectionPills',
    'detectedSections',
    'resumeText',
    'originalText',
    'improvedText',
    'atsScore',
    'atsProgress',
    'atsRing',
    'scoreCaption',
    'strengthsList',
    'weaknessesList',
    'keywordsList',
    'sectorList',
    'suggestionsList',
    'jobDescription',
    'matchScore',
    'matchedSkillsCount',
    'missingSkillsCount',
    'missingSkillsList',
    'suggestedKeywordsList',
  ];

  ids.forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function setupLibraries() {
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
}

function bindEvents() {
  els.resumeFile.addEventListener('change', onFileChosen);
  els.dropzone.addEventListener('dragover', (event) => {
    event.preventDefault();
    els.dropzone.classList.add('dragover');
  });
  els.dropzone.addEventListener('dragleave', () => els.dropzone.classList.remove('dragover'));
  els.dropzone.addEventListener('drop', onFileDropped);

  els.analyzeBtn.addEventListener('click', () => runResumeAnalysis().catch(handleError));
  els.matchBtn.addEventListener('click', () => runJobMatch().catch(handleError));
  els.runMatchBtn.addEventListener('click', () => runJobMatch().catch(handleError));
  els.fixBtn.addEventListener('click', () => rewriteResume().catch(handleError));
  els.copyImprovedBtn.addEventListener('click', copyImprovedText);
}

function renderInitialState() {
  updateLoadingState(false);
  updateButtons();
}

function updateButtons() {
  const hasText = Boolean(state.text);
  els.analyzeBtn.disabled = !(hasText && !state.isBusy);
  els.matchBtn.disabled = !(hasText && !state.isBusy);
  els.runMatchBtn.disabled = !(hasText && !state.isBusy);
  els.fixBtn.disabled = !(hasText && !state.isBusy);
}

function setBusy(isBusy, message = '') {
  state.isBusy = isBusy;
  els.analysisStatusDot.classList.toggle('busy', isBusy);
  els.analysisStatusDot.classList.toggle('ready', !isBusy && Boolean(state.text));
  if (message) {
    showStatus(message, isBusy ? 'busy' : 'info');
  }
  updateButtons();
}

function updateLoadingState(isLoading) {
  document.body.classList.toggle('loading', isLoading);
  setBusy(isLoading, isLoading ? 'Working...' : 'Ready.');
}

function showStatus(message, type = 'info') {
  els.statusMessage.textContent = message;
  els.statusMessage.dataset.type = type;
}

function handleError(error) {
  const message = error?.message || 'Something went wrong.';
  showStatus(message, 'error');
  setBusy(false, message);
  console.error(error);
}

async function onFileChosen(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  await loadResume(file);
}

async function onFileDropped(event) {
  event.preventDefault();
  els.dropzone.classList.remove('dragover');
  const file = event.dataTransfer.files?.[0];
  if (!file) return;
  await loadResume(file);
}

async function loadResume(file) {
  try {
    validateFile(file);
    setBusy(true, `Reading ${file.name}...`);
    state.file = file;
    state.analysis = null;
    state.match = null;
    state.rewrite = null;

    const buffer = await file.arrayBuffer();
    const text = await extractTextFromFile(file, buffer);
    state.text = normalizeText(text);
    if (!state.text) {
      throw new Error('No text found in the file.');
    }

    state.sections = detectSections(state.text);
    renderFileMeta();
    renderPreview();
    renderAnalysisPlaceholders();
    renderMatchPlaceholders();
    renderRewritePlaceholders();
    showStatus(`Read ${countWords(state.text)} words.`, 'success');
    setBusy(false);
  } catch (error) {
    state.file = null;
    state.text = '';
    state.sections = [];
    renderFileMeta();
    renderPreview();
    renderAnalysisPlaceholders();
    renderMatchPlaceholders();
    renderRewritePlaceholders();
    handleError(error);
  }
}

function validateFile(file) {
  if (!file) {
    throw new Error('Upload a file first.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  const allowed = ['pdf', 'docx'];
  if (!allowed.includes(ext)) {
    throw new Error('Use a PDF or DOCX file.');
  }
}

async function extractTextFromFile(file, buffer) {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') {
    return extractPdfText(buffer);
  }
  if (ext === 'docx') {
    return extractDocxText(buffer);
  }
  throw new Error('Use a PDF or DOCX file.');
}

async function extractPdfText(buffer) {
  if (!window.pdfjsLib) {
    throw new Error('pdf.js failed to load.');
  }

  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  const chunks = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent({ normalizeWhitespace: true });
    const line = content.items
      .map((item) => {
        const text = item.str || '';
        return item.hasEOL ? `${text}\n` : `${text} `;
      })
      .join('');
    chunks.push(line);
  }

  return chunks.join('\n\n');
}

async function extractDocxText(buffer) {
  if (!window.mammoth) {
    throw new Error('mammoth.js failed to load.');
  }

  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value || '';
}

function normalizeText(text) {
  return text
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function detectSections(text) {
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

  const sections = [];
  let current = { title: 'Full Resume', lines: [] };

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

function isHeadingLike(original, normalized, recognizedSet) {
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

function prettyHeading(text) {
  return text
    .replace(/[:\-–]+$/, '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderFileMeta() {
  els.fileName.textContent = state.file?.name || 'No file loaded';
  els.wordCount.textContent = state.text ? countWords(state.text).toLocaleString() : '0';
  els.sectionCount.textContent = String(state.sections.length);
  els.fileType.textContent = state.file ? state.file.type || state.file.name.split('.').pop().toUpperCase() : 'Unknown';
  els.resumeText.textContent = state.text || 'Your extracted resume text will appear here.';
  els.originalText.textContent = state.text || 'Upload a resume to see the source text.';
}

function renderPreview() {
  renderSectionPills();
  renderDetectedSections();
  updateButtons();
}

function renderSectionPills() {
  els.sectionPills.innerHTML = '';

  if (!state.sections.length) {
    els.sectionPills.innerHTML = '<span class="chip">No sections detected yet</span>';
    return;
  }

  state.sections.slice(0, 8).forEach((section) => {
    const pill = document.createElement('span');
    pill.className = 'chip';
    pill.textContent = section.title;
    els.sectionPills.appendChild(pill);
  });
}

function renderDetectedSections() {
  if (!state.sections.length) {
    els.detectedSections.innerHTML = '<div class="empty-state">Upload a file to see sections.</div>';
    return;
  }

  els.detectedSections.innerHTML = '';
  state.sections.slice(0, 8).forEach((section) => {
    const card = document.createElement('article');
    card.className = 'section-card';
    const preview = section.content.split('\n').slice(0, 6).join('\n').trim();
    card.innerHTML = `
      <h4>${escapeHtml(section.title)}</h4>
      <p>${escapeHtml(preview || 'No text detected for this section.')}</p>
    `;
    els.detectedSections.appendChild(card);
  });
}

function renderAnalysisPlaceholders() {
  els.atsScore.textContent = '--';
  els.atsProgress.style.width = '0%';
  els.atsRing.style.background = 'conic-gradient(var(--accent) 0deg, rgba(255,255,255,0.08) 0deg)';
  els.scoreCaption.textContent = 'Run analysis to see the score and tips.';
  els.sectorList.innerHTML = '<span class="empty-state">No result yet.</span>';
  els.strengthsList.innerHTML = '<li class="empty-state">No result yet.</li>';
  els.weaknessesList.innerHTML = '<li class="empty-state">No result yet.</li>';
  els.keywordsList.innerHTML = '<span class="empty-state">No result yet.</span>';
  els.suggestionsList.innerHTML = '<div class="empty-state">Tips will appear here.</div>';
}

function renderMatchPlaceholders() {
  els.matchScore.textContent = '--';
  els.matchedSkillsCount.textContent = '0';
  els.missingSkillsCount.textContent = '0';
  els.missingSkillsList.innerHTML = '<li class="empty-state">Paste a job description and check match.</li>';
  els.suggestedKeywordsList.innerHTML = '<span class="empty-state">No keywords yet.</span>';
}

function renderRewritePlaceholders() {
  els.improvedText.textContent = state.rewrite?.rewrittenResume || 'Click "Fix Resume" after uploading a resume.';
  els.copyImprovedBtn.disabled = !state.rewrite?.rewrittenResume;
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

async function runResumeAnalysis() {
  if (!state.text) {
    throw new Error('Upload a file first.');
  }

  setBusy(true, 'Analyzing resume...');
  try {
    const localAnalysis = buildLocalAnalysis(state.text, state.sections);
    state.analysis = localAnalysis;
    renderAnalysis(localAnalysis);
    showStatus('Analysis done.', 'success');
  } finally {
    setBusy(false);
  }
}

function renderAnalysis(data) {
  const score = clampScore(data.atsScore);
  els.atsScore.textContent = String(score);
  els.atsProgress.style.width = `${score}%`;
  els.atsRing.style.background = `conic-gradient(var(--accent) ${score * 3.6}deg, rgba(255,255,255,0.08) 0deg)`;
  els.scoreCaption.textContent = data.summary || 'Analysis completed.';

  els.sectorList.innerHTML = renderChips(data.bestSectors || []);
  els.strengthsList.innerHTML = renderListItems(data.strengths);
  els.weaknessesList.innerHTML = renderListItems(data.weaknesses);
  els.keywordsList.innerHTML = renderChips(data.missingKeywords);
  els.suggestionsList.innerHTML = renderSuggestions(data.suggestions);
}

async function runJobMatch() {
  if (!state.text) {
    throw new Error('Upload a file first.');
  }

  const jobDescription = els.jobDescription.value.trim();
  if (!jobDescription) {
    throw new Error('Paste a job description first.');
  }

  setBusy(true, 'Checking match...');
  try {
    const localMatch = buildLocalMatch(state.text, jobDescription);
    state.match = localMatch;
    renderMatch(localMatch);
    showStatus('Match done.', 'success');
  } finally {
    setBusy(false);
  }
}

function renderMatch(data) {
  const score = clampScore(data.matchPercentage);
  els.matchScore.textContent = `${score}%`;
  els.matchedSkillsCount.textContent = String((data.matchedSkills || []).length);
  els.missingSkillsCount.textContent = String((data.missingSkills || []).length);
  els.missingSkillsList.innerHTML = renderListItems(data.missingSkills);
  els.suggestedKeywordsList.innerHTML = renderChips(data.suggestedKeywords);
}

async function rewriteResume() {
  if (!state.text) {
    throw new Error('Upload a file first.');
  }

  setBusy(true, 'Rewriting resume...');
  try {
    const localRewrite = buildLocalRewrite(state.text, state.sections, state.match);
    state.rewrite = localRewrite;
    els.improvedText.textContent = localRewrite.rewrittenResume || 'No rewrite returned.';
    els.copyImprovedBtn.disabled = !localRewrite.rewrittenResume;
    showStatus('Rewrite done.', 'success');
  } finally {
    setBusy(false);
  }
}

async function copyImprovedText() {
  if (!state.rewrite?.rewrittenResume) return;
  await navigator.clipboard.writeText(state.rewrite.rewrittenResume);
  showStatus('Improved resume text copied to clipboard.', 'success');
}

function renderListItems(items = []) {
  if (!Array.isArray(items) || !items.length) {
    return '<li class="empty-state">No items.</li>';
  }
  return items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('');
}

function renderChips(items = []) {
  if (!Array.isArray(items) || !items.length) {
    return '<span class="empty-state">No items.</span>';
  }
  return items.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join('');
}

function renderSuggestions(items = []) {
  if (!Array.isArray(items) || !items.length) {
    return '<div class="empty-state">No suggestions returned.</div>';
  }

  return items
    .map(
      (item) => `
        <article class="suggestion-card">
          <h4>${escapeHtml(item.section || 'General')}</h4>
          <div class="suggestion-meta">
            <div><span>Issue:</span> ${escapeHtml(item.issue || '')}</div>
            <div><span>Why it is wrong:</span> ${escapeHtml(item.whyItIsWrong || '')}</div>
            <div><span>How to fix:</span> ${escapeHtml(item.howToFix || '')}</div>
            <div><span>Improved example:</span> ${escapeHtml(item.example || '')}</div>
          </div>
        </article>
      `,
    )
    .join('');
}

function buildLocalAnalysis(text, sections = []) {
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
  const highestSector = sectorMatches[0] || { name: 'General Technology', score: 50, keywords: [] };

  const keywordScore = scoreKeywordDepth(skillHits, sectorsFromMatches(sectorMatches));
  const impactScore = scoreImpact(text, hasMetrics, hasActionVerbs, hasExperience, hasProjects);
  const structureScore = scoreStructure(wordCount, sections, sectionPresence, contactPresence);
  const foundationScore = scoreFoundation(sectionPresence, contactPresence, hasEducation);

  const score = clampScore(
    foundationScore * 0.25 +
    keywordScore * 0.3 +
    impactScore * 0.25 +
    structureScore * 0.2,
  );

  const missingKeywords = findMissingKeywords(normalized, sectorMatches);
  const strengths = buildStrengths(hasExperience, hasProjects, hasEducation, hasMetrics, hasActionVerbs, skillHits, sections);
  const weaknesses = buildWeaknesses(hasMetrics, hasActionVerbs, missingKeywords, wordCount, sections);
  const suggestions = buildSuggestions(weaknesses, missingKeywords, highestSector, hasMetrics, hasActionVerbs);

  return {
    atsScore: score,
    bestSectors: sectorNames,
    strengths,
    weaknesses,
    missingKeywords,
    suggestions,
    sectionNotes: buildSectionNotes(sections, score, sectionPresence, contactPresence),
    summary: buildScoreSummary(score, sectorNames[0], sectionPresence, contactPresence, hasMetrics, hasActionVerbs),
  };
}

function scoreSkillKeywords(text) {
  const groups = {
    web: ['html', 'css', 'javascript', 'typescript', 'react', 'node', 'express', 'frontend', 'backend', 'full stack', 'web'],
    data: ['python', 'sql', 'pandas', 'numpy', 'power bi', 'tableau', 'excel', 'analytics', 'data'],
    software: ['java', 'c++', 'c#', 'git', 'github', 'oop', 'dsa', 'api', 'database', 'dbms'],
    mobile: ['android', 'flutter', 'kotlin', 'swift', 'mobile'],
    cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'devops'],
    cyber: ['cyber', 'security', 'network', 'firewall', 'penetration', 'linux'],
    design: ['figma', 'ui', 'ux', 'photoshop', 'illustrator', 'design'],
    business: ['communication', 'presentation', 'sales', 'marketing', 'finance', 'management', 'leadership'],
  };

  const hits = {};
  let total = 0;
  Object.entries(groups).forEach(([name, list]) => {
    const count = list.reduce((sum, keyword) => sum + (text.includes(keyword) ? 1 : 0), 0);
    hits[name] = count;
    total += count;
  });

  return { ...hits, total };
}

function getSectorMatches(text, skillHits) {
  const sectors = [
    {
      name: 'Software Development',
      score: 0,
      keywords: ['java', 'c++', 'python', 'git', 'api', 'database', 'software'],
    },
    {
      name: 'Web Development',
      score: 0,
      keywords: ['html', 'css', 'javascript', 'react', 'node', 'frontend', 'backend', 'web'],
    },
    {
      name: 'Data Analytics',
      score: 0,
      keywords: ['sql', 'python', 'excel', 'tableau', 'power bi', 'analytics', 'data'],
    },
    {
      name: 'Cloud / DevOps',
      score: 0,
      keywords: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'devops'],
    },
    {
      name: 'Cybersecurity',
      score: 0,
      keywords: ['security', 'network', 'linux', 'penetration', 'firewall'],
    },
    {
      name: 'UI / UX Design',
      score: 0,
      keywords: ['figma', 'ui', 'ux', 'design', 'photoshop'],
    },
    {
      name: 'Marketing / Business',
      score: 0,
      keywords: ['marketing', 'sales', 'communication', 'leadership', 'management', 'finance'],
    },
    {
      name: 'Mobile App Development',
      score: 0,
      keywords: ['android', 'flutter', 'kotlin', 'swift', 'mobile'],
    },
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

  return sectors
    .filter((sector) => sector.score > 0)
    .sort((a, b) => b.score - a.score);
}

function findMissingKeywords(text, sectorMatches) {
  const baseKeywords = ['resume', 'project', 'team', 'communication', 'problem solving', 'leadership'];
  const sectorKeywords = sectorMatches.flatMap((sector) => sector.keywords || []);
  const allKeywords = [...new Set([...baseKeywords, ...sectorKeywords])];
  const missing = allKeywords.filter((keyword) => !text.includes(keyword));
  return missing.slice(0, 12).map((item) => item.replace(/\b\w/g, (c) => c.toUpperCase()));
}

function buildStrengths(hasExperience, hasProjects, hasEducation, hasMetrics, hasActionVerbs, skillHits, sections) {
  const strengths = [];
  if (skillHits.total >= 5) strengths.push('Good mix of technical skills.');
  if (hasExperience) strengths.push('Work experience is included.');
  if (hasProjects) strengths.push('Projects section is present.');
  if (hasEducation) strengths.push('Education details are included.');
  if (hasMetrics) strengths.push('You use numbers in the resume.');
  if (hasActionVerbs) strengths.push('You use strong action words.');
  if (sections.length >= 4) strengths.push('The resume has a clear structure.');
  return strengths.length ? strengths : ['Basic resume structure is present.'];
}

function buildWeaknesses(hasMetrics, hasActionVerbs, missingKeywords, wordCount, sections) {
  const weaknesses = [];
  if (!hasMetrics) weaknesses.push('Add numbers to show impact.');
  if (!hasActionVerbs) weaknesses.push('Use stronger action words.');
  if (missingKeywords.length) weaknesses.push('Add more job-related keywords.');
  if (wordCount < 200) weaknesses.push('The resume is short. Add more detail.');
  if (sections.length < 4) weaknesses.push('Add clear sections like Skills, Projects, and Experience.');
  return weaknesses.length ? weaknesses : ['The resume is already fairly structured.'];
}

function buildSuggestions(weaknesses, missingKeywords, highestSector, hasMetrics, hasActionVerbs) {
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

function buildSectionNotes(sections, score, sectionPresence, contactPresence) {
  return sections.slice(0, 6).map((section, index) => {
    const lengthScore = section.content.length > 200 ? 8 : section.content.length > 80 ? 4 : 0;
    return {
      section: section.title,
      score: clampScore(score - index * 3 + lengthScore),
      note: section.content ? 'Section found.' : 'Add more detail here.',
    };
  });
}

function scoreContactPresence(text) {
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

function scoreSectionPresence(sections) {
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

function sectorsFromMatches(sectorMatches) {
  return sectorMatches.map((item) => item.name);
}

function scoreKeywordDepth(skillHits, sectors) {
  const uniqueSkillGroups = Object.entries(skillHits)
    .filter(([key, value]) => key !== 'total' && value > 0)
    .length;
  const sectorBonus = Math.min(10, sectors.length * 2);
  const totalKeywords = Math.min(18, skillHits.total * 2);
  return clampScore(10 + totalKeywords + uniqueSkillGroups * 3 + sectorBonus);
}

function scoreImpact(text, hasMetrics, hasActionVerbs, hasExperience, hasProjects) {
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

function scoreStructure(wordCount, sections, sectionPresence, contactPresence) {
  const sectionCount = sections.length;
  const lengthScore = wordCount >= 180 && wordCount <= 900 ? 10 : wordCount > 900 ? 6 : wordCount >= 100 ? 8 : 3;
  const sectionScore = Math.min(10, sectionCount * 2);
  const contactScore = contactPresence.score > 0 ? 8 : 0;
  const headerScore = sectionPresence.hasSummary ? 5 : 0;
  return clampScore(lengthScore + sectionScore + contactScore + headerScore);
}

function scoreFoundation(sectionPresence, contactPresence, hasEducation) {
  const contactScore = contactPresence.score;
  const sectionScore = sectionPresence.score;
  const educationScore = hasEducation ? 6 : 0;
  const base = 20;
  return clampScore(base + contactScore + sectionScore + educationScore);
}

function buildScoreSummary(score, bestSector, sectionPresence, contactPresence, hasMetrics, hasActionVerbs) {
  const parts = [];
  if (!contactPresence.hasEmail || !contactPresence.hasPhone) {
    parts.push('Add clear contact details.');
  }
  if (!sectionPresence.hasSkills) {
    parts.push('Add a Skills section.');
  }
  if (!sectionPresence.hasExperience && !sectionPresence.hasProjects) {
    parts.push('Add Experience or Projects.');
  }
  if (!hasMetrics) {
    parts.push('Add numbers to show impact.');
  }
  if (!hasActionVerbs) {
    parts.push('Use stronger action words.');
  }

  let label = 'Needs work';
  if (score >= 80) label = 'Strong resume';
  else if (score >= 65) label = 'Good resume';
  else if (score >= 45) label = 'Average resume';

  const tipText = parts.length ? ` ${parts.slice(0, 3).join(' ')}` : ' Keep it focused and clear.';
  return `${label}. Best fit: ${bestSector}.${tipText}`;
}

function buildLocalMatch(resumeText, jobDescription) {
  const resumeTokens = extractMeaningfulTokens(resumeText);
  const jobTokens = extractMeaningfulTokens(jobDescription);
  const resumeSet = new Set(resumeTokens);
  const matched = [];
  const missing = [];

  jobTokens.forEach((token) => {
    if (resumeSet.has(token)) {
      matched.push(token);
    } else {
      missing.push(token);
    }
  });

  const matchedSkills = dedupeReadable(matched);
  const missingSkills = dedupeReadable(missing);
  const matchPercentage = clampScore(
    jobTokens.length ? Math.round((matchedSkills.length / Math.max(1, jobTokens.length)) * 100) : 0,
  );
  const suggestedKeywords = missingSkills.slice(0, 12);

  return {
    matchPercentage,
    matchedSkills,
    missingSkills,
    suggestedKeywords,
    summary: matchPercentage > 70
      ? 'Good match. Your resume covers most of the job terms.'
      : matchPercentage > 40
        ? 'Medium match. Add a few more job terms.'
        : 'Low match. Add more job keywords and project details.',
  };
}

function buildLocalRewrite(resumeText, sections = [], match = null) {
  const cleaned = normalizeText(resumeText);
  const lines = cleaned.split('\n').map((line) => line.trim()).filter(Boolean);
  const sectionMap = new Map();

  sections.forEach((section) => {
    sectionMap.set(section.title.toLowerCase(), section.content.trim());
  });

  const bestSector = state.analysis?.bestSectors?.[0] || 'General Technology';
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

  const rewrittenSections = sections.slice(0, 6).map((section) => ({
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

function findSectionText(sectionMap, name) {
  for (const [key, value] of sectionMap.entries()) {
    if (key.includes(name)) return value;
  }
  return '';
}

function improveSectionText(title, text, keywords = []) {
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

function extractMeaningfulTokens(text) {
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'your', 'you', 'are', 'have', 'has', 'had',
    'job', 'role', 'skills', 'skill', 'resume', 'work', 'using', 'used', 'need', 'required', 'preferred',
    'will', 'can', 'our', 'their', 'its', 'about', 'based', 'able', 'more', 'less', 'good', 'best', 'team',
    'experience', 'project', 'projects', 'education', 'responsibilities', 'responsibility',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#. ]+/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function dedupeReadable(tokens) {
  return [...new Set(tokens)]
    .map((token) => token.replace(/\b\w/g, (c) => c.toUpperCase()))
    .slice(0, 12);
}

function clampScore(score) {
  const num = Number(score);
  if (Number.isNaN(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
