import type {
  TextItem,
  FeatureSet,
  ResumeSectionToLines,
} from "../types";
// Define ResumeEducation locally
export type ResumeEducation = {
  school: string;
  degree: string;
  gpa: string;
  date: string;
  descriptions: string[];
};
import { getSectionLinesByKeywords } from "./lib/get-section-lines";
import { divideSectionIntoSubsections } from "./lib/subsections";
import {
  DATE_FEATURE_SETS,
  getHasText,
  isBold,
} from "./lib/common-features";
import { getTextWithHighestFeatureScore } from "./lib/feature-scoring-system";
import {
  getBulletPointsFromLines,
  getDescriptionsLineIdx,
} from "./lib/bullet-points";

/**
 *              Unique Attribute
 * School       Has school
 * Degree       Has degree
 * GPA          Has number
 */

// prettier-ignore
const SCHOOLS = ['College', 'University', 'Institute', 'School', 'Academy', 'BASIS', 'Magnet', 'Polytechnic', 'Faculty', 'Department', 'Campus', 'High School', 'Secondary School', 'Lyceum', 'Gymnasium', 'Conservatory', 'Conservatoire', 'Technical School', 'Vocational School'];
const hasSchool = (item: TextItem) =>
  SCHOOLS.some((school) => item.text.toLowerCase().includes(school.toLowerCase()));
// prettier-ignore
const DEGREES = ["Associate", "Bachelor", "Master", "PhD", "Ph.", "BSc", "BA", "MSc", "MA", "MBA", "BEng", "MEng", "LLB", "LLM", "MD", "DDS", "DVM", "EdD", "JD", "Diploma", "Certificate", "Certification", "Degree", "Honours", "Honors", "Hons", "Postgraduate", "Undergraduate"];
const hasDegree = (item: TextItem) =>
  DEGREES.some((degree) => item.text.toLowerCase().includes(degree.toLowerCase())) ||
  /[ABM][A-Z\.]/.test(item.text); // Match AA, B.S., MBA, etc.
const matchGPA = (item: TextItem) => item.text.match(/[0-4]\.\d{1,2}/);
const matchGrade = (item: TextItem) => {
  const grade = parseFloat(item.text);
  if (Number.isFinite(grade) && grade <= 110) {
    return [String(grade)] as RegExpMatchArray;
  }
  return null;
};

const SCHOOL_FEATURE_SETS: FeatureSet[] = [
  [hasSchool, 4],
  [hasDegree, -4],
];

const DEGREE_FEATURE_SETS: FeatureSet[] = [
  [hasDegree, 4],
  [hasSchool, -4],
];

const GPA_FEATURE_SETS: FeatureSet[] = [
  [matchGPA, 4, true],
  [matchGrade, 3, true],
  [isBold, -4],
];

export const extractEducation = (sections: ResumeSectionToLines) => {
  const educationSectionNames = [
    "education", "education and training", "academic qualifications", "educational background", "education background", "academic"
  ];
  let lines: any[] = [];
  for (const key of educationSectionNames) {
    if (sections[key]) lines = lines.concat(sections[key]);
  }
  const educations: ResumeEducation[] = [];
  const educationsScores = [];
  const subsections = divideSectionIntoSubsections(lines);
  for (const subsectionLines of subsections) {
    const textItems = subsectionLines.flat();
    const [school, schoolScores] = getTextWithHighestFeatureScore(
      textItems,
      SCHOOL_FEATURE_SETS,
      false // fallback: accept zero/negative if nothing else
    );
    const [degree, degreeScores] = getTextWithHighestFeatureScore(
      textItems,
      DEGREE_FEATURE_SETS,
      false
    );
    const [gpa, gpaScores] = getTextWithHighestFeatureScore(
      textItems,
      GPA_FEATURE_SETS,
      false
    );
    const [date, dateScores] = getTextWithHighestFeatureScore(
      textItems,
      DATE_FEATURE_SETS,
      false
    );

    let descriptions: string[] = [];
    const descriptionsLineIdx = getDescriptionsLineIdx(subsectionLines);
    if (descriptionsLineIdx !== undefined) {
      const descriptionsLines = subsectionLines.slice(descriptionsLineIdx);
      descriptions = getBulletPointsFromLines(descriptionsLines);
    } else {
      // Fallback: concatenate all lines as a single description
      descriptions = [subsectionLines.flat().map((item: TextItem) => item.text).join(' ')];
    }

    educations.push({ school, degree, gpa, date, descriptions });
    educationsScores.push({
      schoolScores,
      degreeScores,
      gpaScores,
      dateScores,
    });
  }

  if (educations.length !== 0) {
    const coursesLines = getSectionLinesByKeywords(sections, ["course"]);
    if (coursesLines.length !== 0) {
      educations[0].descriptions.push(
        "Courses: " +
          coursesLines
            .flat()
            .map((item: TextItem) => item.text)
            .join(" ")
      );
    }
  }

  return {
    educations,
    educationsScores,
  };
};
