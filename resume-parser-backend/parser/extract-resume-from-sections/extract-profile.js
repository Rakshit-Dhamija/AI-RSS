const { getSectionLinesByKeywords } = require('./lib/get-section-lines');
const { isBold, hasNumber, hasComma, hasLetter, hasLetterAndIsAllUpperCase } = require('./lib/common-features');
const { getTextWithHighestFeatureScore } = require('./lib/feature-scoring-system');

// Name
const matchOnlyLetterSpaceOrPeriod = (item) => item.text.match(/^[a-zA-Z\s\.]+$/);
// Email
const matchEmail = (item) => item.text.match(/\S+@\S+\.\S+/);
const hasAt = (item) => item.text.includes("@");
// Phone
const matchPhone = (item) => item.text.match(/\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/);
const hasParenthesis = (item) => /\([0-9]+\)/.test(item.text);
// Location
const matchCityAndState = (item) => item.text.match(/[A-Z][a-zA-Z\s]+, [A-Z]{2}/);
// Url
const matchUrl = (item) => item.text.match(/\S+\.[a-z]+\/\S+/);
const matchUrlHttpFallback = (item) => item.text.match(/https?:\/\/\S+\.\S+/);
const matchUrlWwwFallback = (item) => item.text.match(/www\.\S+\.\S+/);
const hasSlash = (item) => item.text.includes("/");
// Summary
const has4OrMoreWords = (item) => item.text.split(" ").length >= 4;

const NAME_FEATURE_SETS = [
  [matchOnlyLetterSpaceOrPeriod, 3, true],
  [isBold, 2],
  [hasLetterAndIsAllUpperCase, 2],
  [hasAt, -4],
  [hasNumber, -4],
  [hasParenthesis, -4],
  [hasComma, -4],
  [hasSlash, -4],
  [has4OrMoreWords, -2],
];
const EMAIL_FEATURE_SETS = [
  [matchEmail, 4, true],
  [isBold, -1],
  [hasLetterAndIsAllUpperCase, -1],
  [hasParenthesis, -4],
  [hasComma, -4],
  [hasSlash, -4],
  [has4OrMoreWords, -4],
];
const PHONE_FEATURE_SETS = [
  [matchPhone, 4, true],
  [hasLetter, -4],
];
const LOCATION_FEATURE_SETS = [
  [matchCityAndState, 4, true],
  [isBold, -1],
  [hasAt, -4],
  [hasParenthesis, -3],
  [hasSlash, -4],
];
const URL_FEATURE_SETS = [
  [matchUrl, 4, true],
  [matchUrlHttpFallback, 3, true],
  [matchUrlWwwFallback, 3, true],
  [isBold, -1],
  [hasAt, -4],
  [hasParenthesis, -3],
  [hasComma, -4],
  [has4OrMoreWords, -4],
];
const SUMMARY_FEATURE_SETS = [
  [has4OrMoreWords, 4],
  [isBold, -1],
  [hasAt, -4],
  [hasParenthesis, -3],
  [matchCityAndState, -4, false],
];

const extractProfile = (sections) => {
  const lines = sections.profile || [];
  const textItems = lines.flat();
  const [name, nameScores] = getTextWithHighestFeatureScore(textItems, NAME_FEATURE_SETS);
  const [email, emailScores] = getTextWithHighestFeatureScore(textItems, EMAIL_FEATURE_SETS);
  const [phone, phoneScores] = getTextWithHighestFeatureScore(textItems, PHONE_FEATURE_SETS);
  const [location, locationScores] = getTextWithHighestFeatureScore(textItems, LOCATION_FEATURE_SETS);
  const [url, urlScores] = getTextWithHighestFeatureScore(textItems, URL_FEATURE_SETS);
  const [summary, summaryScores] = getTextWithHighestFeatureScore(textItems, SUMMARY_FEATURE_SETS, undefined, true);
  const summaryLines = getSectionLinesByKeywords(sections, ["summary"]);
  const summarySection = summaryLines.flat().map((textItem) => textItem.text).join(" ");
  const objectiveLines = getSectionLinesByKeywords(sections, ["objective"]);
  const objectiveSection = objectiveLines.flat().map((textItem) => textItem.text).join(" ");
  return {
    profile: {
      name,
      email,
      phone,
      location,
      url,
      summary: summarySection || objectiveSection || summary,
    },
    profileScores: {
      name: nameScores,
      email: emailScores,
      phone: phoneScores,
      location: locationScores,
      url: urlScores,
      summary: summaryScores,
    },
  };
};

module.exports = { extractProfile }; 