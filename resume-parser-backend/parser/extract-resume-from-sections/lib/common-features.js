const isTextItemBold = (fontName) =>
  fontName.toLowerCase().includes("bold");
const isBold = (item) => isTextItemBold(item.fontName);
const hasLetter = (item) => /[a-zA-Z]/.test(item.text);
const hasNumber = (item) => /[0-9]/.test(item.text);
const hasComma = (item) => item.text.includes(",");
const getHasText = (text) => (item) => item.text.includes(text);
const hasOnlyLettersSpacesAmpersands = (item) => /^[A-Za-z\s&]+$/.test(item.text);
const hasLetterAndIsAllUpperCase = (item) => hasLetter(item) && item.text.toUpperCase() === item.text;
// Date Features
const hasYear = (item) => /(?:19|20)\d{2}/.test(item.text);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const hasMonth = (item) =>
  MONTHS.some(
    (month) =>
      item.text.includes(month) || item.text.includes(month.slice(0, 4))
  );
const SEASONS = ["Summer", "Fall", "Spring", "Winter"];
const hasSeason = (item) =>
  SEASONS.some((season) => item.text.includes(season));
const hasPresent = (item) => item.text.includes("Present");
const DATE_FEATURE_SETS = [
  [hasYear, 1],
  [hasMonth, 1],
  [hasSeason, 1],
  [hasPresent, 1],
  [hasComma, -1],
];
module.exports = {
  isBold,
  hasLetter,
  hasNumber,
  hasComma,
  getHasText,
  hasOnlyLettersSpacesAmpersands,
  hasLetterAndIsAllUpperCase,
  DATE_FEATURE_SETS,
}; 