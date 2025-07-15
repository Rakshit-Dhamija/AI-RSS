// Define ResumeWorkExperience locally
export type ResumeWorkExperience = {
  company: string;
  jobTitle: string;
  date: string;
  descriptions: string[];
};
import type {
  TextItem,
  FeatureSet,
  ResumeSectionToLines,
} from "../types";
import { getSectionLinesByKeywords } from "./lib/get-section-lines";
import {
  DATE_FEATURE_SETS,
  isBold,
  getHasText,
} from "./lib/common-features";
import { divideSectionIntoSubsections } from "./lib/subsections";
import { getTextWithHighestFeatureScore } from "./lib/feature-scoring-system";
import {
  getBulletPointsFromLines,
  getDescriptionsLineIdx,
} from "./lib/bullet-points";

// prettier-ignore
const WORK_EXPERIENCE_KEYWORDS_LOWERCASE = [
  'work',
  'experience',
  'employment',
  'history',
  'job',
  'professional',
  'career',
  'positions',
  'roles',
  'projects',
  'internship',
  'internships',
  'practice',
  'background',
  'positions held',
  'appointments',
  'assignments',
  'service',
  'contributions',
  'leadership',
  'management',
  'consulting',
  'teaching',
  'academic',
  'faculty',
  'staff',
  'volunteer',
  'extracurricular',
  'activities',
  'engagement',
  'involvement',
  'participation',
  'collaboration',
  'collaborations',
  'project experience',
  'work history',
  'professional experience',
  'employment history',
  'job history',
  'work experience',
  'career history',
  'positions of responsibility',
  'work placements',
  'work assignment',
  'work assignments',
  'work record',
  'work background',
  'work summary',
  'work profile',
  'work details',
  'work description',
  'work overview',
  'work highlights',
  'work accomplishments',
  'work achievements',
  'work contributions',
  'work skills',
  'work expertise',
  'work knowledge',
  'work abilities',
  'work strengths',
  'work competencies',
  'work qualifications',
  'work credentials',
  'work certifications',
  'work licenses',
  'work permits',
  'work authorizations',
  'work clearances',
  'work eligibility',
  'work status',
  'work availability',
  'work preferences',
  'work interests',
  'work goals',
  'work objectives',
  'work aspirations',
  'work ambitions',
  'work motivations',
  'work values',
  'work attitudes',
  'work behaviors',
  'work habits',
  'work styles',
];

const hasJobTitle = (item: TextItem) =>
  [
    'Accountant', 'Administrator', 'Advisor', 'Agent', 'Analyst', 'Apprentice', 'Architect', 'Assistant', 'Associate', 'Auditor', 'Bartender', 'Biologist', 'Bookkeeper', 'Buyer', 'Carpenter', 'Cashier', 'CEO', 'Clerk', 'Co-op', 'Co-Founder', 'Consultant', 'Coordinator', 'CTO', 'Developer', 'Designer', 'Director', 'Driver', 'Editor', 'Electrician', 'Engineer', 'Extern', 'Founder', 'Freelancer', 'Head', 'Intern', 'Janitor', 'Journalist', 'Laborer', 'Lawyer', 'Lead', 'Manager', 'Mechanic', 'Member', 'Nurse', 'Officer', 'Operator', 'Operation', 'Photographer', 'President', 'Producer', 'Recruiter', 'Representative', 'Researcher', 'Sales', 'Server', 'Scientist', 'Specialist', 'Supervisor', 'Teacher', 'Technician', 'Trader', 'Trainee', 'Treasurer', 'Tutor', 'Vice', 'VP', 'Volunteer', 'Webmaster', 'Worker'
  ].some((jobTitle) =>
    item.text.split(/\s/).some((word) => word === jobTitle)
  );
const hasMoreThan5Words = (item: TextItem) => item.text.split(/\s/).length > 5;
const JOB_TITLE_FEATURE_SET: FeatureSet[] = [
  [hasJobTitle, 4],
  [hasMoreThan5Words, -2],
];

export const extractWorkExperience = (sections: ResumeSectionToLines) => {
  const workSectionNames = [
    "workExperience", "work experience", "professional experience", "work history", "employment", "employment history", "job history", "career", "positions", "roles", "internship", "internships"
  ];
  let lines: any[] = [];
  for (const key of workSectionNames) {
    if (sections[key]) lines = lines.concat(sections[key]);
  }
  const workExperiences: ResumeWorkExperience[] = [];
  const workExperiencesScores = [];
  const subsections = divideSectionIntoSubsections(lines);

  for (const subsectionLines of subsections) {
    const descriptionsLineIdx = getDescriptionsLineIdx(subsectionLines) ?? 2;
    const subsectionInfoTextItems = subsectionLines
      .slice(0, descriptionsLineIdx)
      .flat();
    const [date, dateScores] = getTextWithHighestFeatureScore(
      subsectionInfoTextItems,
      DATE_FEATURE_SETS,
      false
    );
    const [jobTitle, jobTitleScores] = getTextWithHighestFeatureScore(
      subsectionInfoTextItems,
      JOB_TITLE_FEATURE_SET,
      false
    );
    const COMPANY_FEATURE_SET: FeatureSet[] = [
      [isBold, 2],
      [getHasText(date), -4],
      [getHasText(jobTitle), -4],
    ];
    let [company, companyScores] = getTextWithHighestFeatureScore(
      subsectionInfoTextItems,
      COMPANY_FEATURE_SET,
      false
    );
    company = company.replace(/^[\W]+|[\W]+$/g, '').replace(/^\s+|\s+$/g, '');
    const cleanJobTitle = jobTitle.replace(/^[\W]+|[\W]+$/g, '').replace(/^\s+|\s+$/g, '');
    if (!company && cleanJobTitle) {
      company = cleanJobTitle;
    }
    if (!company && !cleanJobTitle && !date) continue;

    const subsectionDescriptionsLines = subsectionLines.slice(descriptionsLineIdx);
    let descriptions = getBulletPointsFromLines(subsectionDescriptionsLines).filter(Boolean);
    if (descriptions.length === 0) {
      // Fallback: concatenate all lines as a single description
      descriptions = [subsectionLines.flat().map((item: TextItem) => item.text).join(' ')];
    }
    descriptions = Array.from(new Set(descriptions)).filter(Boolean);
    workExperiences.push({ company, jobTitle: cleanJobTitle, date, descriptions });
    workExperiencesScores.push({
      companyScores,
      jobTitleScores,
      dateScores,
    });
  }
  const filtered = workExperiences.filter(
    (exp, idx, arr) =>
      exp.company || exp.jobTitle || exp.date || (exp.descriptions && exp.descriptions.length > 0)
  );
  return { workExperiences: filtered, workExperiencesScores };
};
