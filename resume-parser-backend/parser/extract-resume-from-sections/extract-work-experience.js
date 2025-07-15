const { getSectionLinesByKeywords } = require("./lib/get-section-lines");
const { DATE_FEATURE_SETS, isBold } = require("./lib/common-features");
const { divideSectionIntoSubsections } = require("./lib/subsections");
const { getTextWithHighestFeatureScore } = require("./lib/feature-scoring-system");
const { getBulletPointsFromLines, getDescriptionsLineIdx } = require("./lib/bullet-points");

// prettier-ignore
const WORK_EXPERIENCE_KEYWORDS_LOWERCASE = ['work', 'experience', 'employment', 'history', 'job'];
// prettier-ignore
const JOB_TITLES = ['Accountant', 'Administrator', 'Advisor', 'Agent', 'Analyst', 'Apprentice', 'Architect', 'Assistant', 'Associate', 'Auditor', 'Bartender', 'Biologist', 'Bookkeeper', 'Buyer', 'Carpenter', 'Cashier', 'CEO', 'Clerk', 'Co-op', 'Co-Founder', 'Consultant', 'Coordinator', 'CTO', 'Developer', 'Designer', 'Director', 'Driver', 'Editor', 'Electrician', 'Engineer', 'Extern', 'Founder', 'Freelancer', 'Head', 'Intern', 'Janitor', 'Journalist', 'Laborer', 'Lawyer', 'Lead', 'Manager', 'Mechanic', 'Member', 'Nurse', 'Officer', 'Operator', 'Operation', 'Photographer', 'President', 'Producer', 'Recruiter', 'Representative', 'Researcher', 'Sales', 'Server', 'Scientist', 'Specialist', 'Supervisor', 'Teacher', 'Technician', 'Trader', 'Trainee', 'Treasurer', 'Tutor', 'Vice', 'VP', 'Volunteer', 'Webmaster', 'Worker'];

const hasJobTitle = (item) =>
  JOB_TITLES.some((jobTitle) =>
    item.text.split(/\s/).some((word) => word === jobTitle)
  );
const hasMoreThan5Words = (item) => item.text.split(/\s/).length > 5;
const JOB_TITLE_FEATURE_SET = [
  [hasJobTitle, 4],
  [hasMoreThan5Words, -2],
];

function getHasText(text) {
  return (item) => item.text === text;
}

const extractWorkExperience = (sections) => {
  const workExperiences = [];
  const workExperiencesScores = [];
  const lines = getSectionLinesByKeywords(
    sections,
    WORK_EXPERIENCE_KEYWORDS_LOWERCASE
  );
  const subsections = divideSectionIntoSubsections(lines);

  let lastValidIdx = -1;
  for (const subsectionLines of subsections) {
    const descriptionsLineIdx = getDescriptionsLineIdx(subsectionLines) ?? 2;
    const subsectionInfoTextItems = subsectionLines
      .slice(0, descriptionsLineIdx)
      .flat();
    const [date, dateScores] = getTextWithHighestFeatureScore(
      subsectionInfoTextItems,
      DATE_FEATURE_SETS
    );
    const [jobTitle, jobTitleScores] = getTextWithHighestFeatureScore(
      subsectionInfoTextItems,
      JOB_TITLE_FEATURE_SET
    );
    const COMPANY_FEATURE_SET = [
      [isBold, 2],
      [getHasText(date), -4],
      [getHasText(jobTitle), -4],
    ];
    let [company, companyScores] = getTextWithHighestFeatureScore(
      subsectionInfoTextItems,
      COMPANY_FEATURE_SET,
      false
    );
    // Clean up company and jobTitle artifacts
    company = company.replace(/^\W+|\W+$/g, '').replace(/^\s+|\s+$/g, '');
    const cleanJobTitle = jobTitle.replace(/^\W+|\W+$/g, '').replace(/^\s+|\s+$/g, '');
    // If company is empty but jobTitle looks like a company, swap
    if (!company && cleanJobTitle) {
      company = cleanJobTitle;
    }
    // If both are empty, skip
    if (!company && !cleanJobTitle && !date) continue;

    const subsectionDescriptionsLines = subsectionLines.slice(descriptionsLineIdx);
    let descriptions = getBulletPointsFromLines(subsectionDescriptionsLines).filter(Boolean);
    // Fallback: if descriptions are empty but next subsection is only descriptions, merge
    if (descriptions.length === 0 && workExperiences.length > 0) {
      const prev = workExperiences[workExperiences.length - 1];
      if (prev && prev.descriptions.length === 0) {
        prev.descriptions = descriptions;
        continue;
      }
    }
    // Remove duplicates and empty entries
    descriptions = Array.from(new Set(descriptions)).filter(Boolean);
    workExperiences.push({ company, jobTitle: cleanJobTitle, date, descriptions });
    workExperiencesScores.push({
      companyScores,
      jobTitleScores,
      dateScores,
    });
  }
  // Remove empty/duplicate work experiences
  const filtered = workExperiences.filter(
    (exp, idx, arr) =>
      exp.company || exp.jobTitle || exp.date || (exp.descriptions && exp.descriptions.length > 0)
  );
  return { workExperiences: filtered, workExperiencesScores };
};

module.exports = { extractWorkExperience }; 