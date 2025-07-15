// Define ResumeKey locally (update as needed for your sections)
type ResumeKey = 'profile' | 'education' | 'workExperience' | 'projects' | 'skills' | string;
import type {
  Line,
  Lines,
  ResumeSectionToLines,
} from "./types";
import {
  hasLetterAndIsAllUpperCase,
  hasOnlyLettersSpacesAmpersands,
  isBold,
} from "./extract-resume-from-sections/lib/common-features";

export const PROFILE_SECTION: ResumeKey = "profile";

/**
 * Step 3. Group lines into sections
 *
 * Every section (except the profile section) starts with a section title that
 * takes up the entire line. This is a common pattern not just in resumes but
 * also in books and blogs. The resume parser uses this pattern to group lines
 * into the closest section title above these lines.
 */
// Add a mapping from section title variants to canonical keys
const SECTION_TITLE_CANONICAL_MAP: { [key: string]: ResumeKey } = {
  // Profile
  "about me": "profile",
  "profile": "profile",
  "personal information": "profile",
  "contact": "profile",
  "contacts": "profile",
  "bio data": "profile",
  "summary": "profile",
  "objective": "profile",
  "about": "profile",
  // Education
  "education": "education",
  "education and training": "education",
  "academic qualifications": "education",
  "educational background": "education",
  "education background": "education",
  "academic": "education",
  // Work Experience
  "work experience": "workExperience",
  "professional experience": "workExperience",
  "work history": "workExperience",
  "employment": "workExperience",
  "employment history": "workExperience",
  "job history": "workExperience",
  "career": "workExperience",
  "positions": "workExperience",
  "roles": "workExperience",
  "internship": "workExperience",
  "internships": "workExperience",
  "projects": "projects",
  "project experience": "projects",
  "project": "projects",
  // Skills
  "skills": "skills",
  "technical skills": "skills",
  "core competencies": "skills",
  "competencies": "skills",
  "technologies": "skills",
  "tools": "skills",
  // Add more as needed
};

function canonicalizeSectionTitle(text: string): ResumeKey {
  const lower = text.trim().toLowerCase();
  for (const key in SECTION_TITLE_CANONICAL_MAP) {
    if (lower === key || lower.includes(key)) {
      return SECTION_TITLE_CANONICAL_MAP[key];
    }
  }
  return lower;
}

export const groupLinesIntoSections = (lines: Lines) => {
  let sections: ResumeSectionToLines = {};
  let sectionName: string = PROFILE_SECTION;
  let sectionLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const text = line[0]?.text.trim();
    if (isSectionTitle(line, i)) {
      sections[canonicalizeSectionTitle(sectionName)] = [...sectionLines];
      sectionName = text;
      sectionLines = [];
    } else {
      sectionLines.push(line);
    }
  }
  if (sectionLines.length > 0) {
    sections[canonicalizeSectionTitle(sectionName)] = [...sectionLines];
  }
  return sections;
};

const SECTION_TITLE_PRIMARY_KEYWORDS = [
  "experience",
  "education",
  "project",
  "skill",
];
const SECTION_TITLE_SECONDARY_KEYWORDS = [
  "job",
  "course",
  "extracurricular",
  "objective",
  "summary", // LinkedIn generated resume has a summary section
  "award",
  "honor",
  "project",
];
const SECTION_TITLE_EXTRA_KEYWORDS = [
  "professional experience", "work history", "employment", "academic", "education background", "educational background", "internship", "internships", "profile", "personal information", "contact", "contacts", "summary", "objective", "about", "bio", "biography", "background", "projects", "project experience", "skills", "technical skills", "core competencies", "competencies", "technologies", "tools", "certifications", "certification", "awards", "honors", "extracurricular", "activities", "interests", "languages", "language", "references", "referees"
];
const SECTION_TITLE_KEYWORDS = [
  ...SECTION_TITLE_PRIMARY_KEYWORDS,
  ...SECTION_TITLE_SECONDARY_KEYWORDS,
  ...SECTION_TITLE_EXTRA_KEYWORDS,
];

function isLikelySectionTitle(text: string) {
  // Accept if contains any known keyword
  if (SECTION_TITLE_KEYWORDS.some((keyword) => text.toLowerCase().includes(keyword))) {
    return true;
  }
  // Accept if 1-5 words and at least 60% of chars are uppercase or non-lowercase
  const words = text.split(/\s+/);
  if (words.length >= 1 && words.length <= 5) {
    const upperCount = text.replace(/[^A-Z]/g, "").length;
    const nonLowerCount = text.replace(/[a-z]/g, "").length;
    if (upperCount / text.length > 0.5 || nonLowerCount / text.length > 0.6) {
      return true;
    }
  }
  // Accept if 1-5 words and at least 80% of words start with uppercase
  if (words.length >= 1 && words.length <= 5) {
    const capWords = words.filter(w => w[0] && w[0] === w[0].toUpperCase());
    if (capWords.length / words.length > 0.8) {
      return true;
    }
  }
  return false;
}

const isSectionTitle = (line: Line, lineNumber: number) => {
  const isFirstTwoLines = lineNumber < 2;
  const hasMoreThanOneItemInLine = line.length > 1;
  const hasNoItemInLine = line.length === 0;
  if (isFirstTwoLines || hasMoreThanOneItemInLine || hasNoItemInLine) {
    return false;
  }

  const textItem = line[0];
  const text = textItem.text.trim();

  // Main heuristic: bold and all uppercase
  if (isBold(textItem) && hasLetterAndIsAllUpperCase(textItem)) {
    return true;
  }

  // Fuzzy/robust fallback
  if (isLikelySectionTitle(text)) {
    return true;
  }

  // Original fallback
  const textHasAtMost2Words =
    text.split(" ").filter((s) => s !== "&").length <= 2;
  const startsWithCapitalLetter = /[A-Z]/.test(text.slice(0, 1));

  if (
    textHasAtMost2Words &&
    hasOnlyLettersSpacesAmpersands(textItem) &&
    startsWithCapitalLetter &&
    SECTION_TITLE_KEYWORDS.some((keyword) =>
      text.toLowerCase().includes(keyword)
    )
  ) {
    return true;
  }

  return false;
};
