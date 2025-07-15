// Define ResumeSkills and initialFeaturedSkills locally
export type ResumeSkillItem = {
  skill: string;
};
export type ResumeSkills = {
  featuredSkills: ResumeSkillItem[];
  descriptions: string[];
};
export const initialFeaturedSkills: ResumeSkillItem[] = [
  { skill: "" },
  { skill: "" },
  { skill: "" },
  { skill: "" },
  { skill: "" },
  { skill: "" },
];
import type { ResumeSectionToLines, TextItem } from "../types";
import { deepClone } from "./lib/deep-clone";
import { getSectionLinesByKeywords } from "./lib/get-section-lines";
import {
  getBulletPointsFromLines,
  getDescriptionsLineIdx,
} from "./lib/bullet-points";

const SKILL_SECTION_KEYWORDS = [
  "skill", "skills", "technical skills", "core competencies", "competencies", "technologies", "tools"
];

function splitSkillsFromDescriptions(descriptions: string[]): string[] {
  const splitRegex = /[\/,|•;\n]+/;
  return descriptions
    .flatMap(desc => desc.split(splitRegex))
    .map(s => s.trim())
    .filter(Boolean);
}

export const extractSkills = (sections: ResumeSectionToLines) => {
  const lines = getSectionLinesByKeywords(sections, SKILL_SECTION_KEYWORDS);
  const descriptionsLineIdx = getDescriptionsLineIdx(lines) ?? 0;
  const descriptionsLines = lines.slice(descriptionsLineIdx);
  const descriptions = getBulletPointsFromLines(descriptionsLines);

  const featuredSkills = deepClone(initialFeaturedSkills);
  if (descriptionsLineIdx !== 0) {
    const featuredSkillsLines = lines.slice(0, descriptionsLineIdx);
    const featuredSkillsTextItems = featuredSkillsLines
      .flat()
      .filter((item: TextItem) => item.text.trim())
      .slice(0, 6);
    for (let i = 0; i < featuredSkillsTextItems.length; i++) {
      featuredSkills[i].skill = featuredSkillsTextItems[i].text;
    }
  }

  // Split and flatten all skills from descriptions
  const allSkills = splitSkillsFromDescriptions(descriptions);

  const skills: ResumeSkills = {
    featuredSkills,
    descriptions: allSkills,
  };

  return { skills };
};
