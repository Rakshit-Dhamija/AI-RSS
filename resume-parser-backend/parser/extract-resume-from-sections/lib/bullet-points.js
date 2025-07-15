const BULLET_POINTS = [
  "\u22c5",
  "\u2219",
  "\ud83d\udf84",
  "\u2022",
  "\u2981",
  "\u26ab\ufe0e",
  "\u25cf",
  "\u2b24",
  "\u26ac",
  "\u25cb",
];

const getBulletPointsFromLines = (lines) => {
  const firstBulletPointLineIndex = getFirstBulletPointLineIdx(lines);
  if (firstBulletPointLineIndex === undefined) {
    return lines.map((line) => line.map((item) => item.text).join(" "));
  }
  let lineStr = "";
  for (let item of lines.flat()) {
    const text = item.text;
    if (!lineStr.endsWith(" ") && !text.startsWith(" ")) {
      lineStr += " ";
    }
    lineStr += text;
  }
  const commonBulletPoint = getMostCommonBulletPoint(lineStr);
  const firstBulletPointIndex = lineStr.indexOf(commonBulletPoint);
  if (firstBulletPointIndex !== -1) {
    lineStr = lineStr.slice(firstBulletPointIndex);
  }
  return lineStr
    .split(commonBulletPoint)
    .map((text) => text.trim())
    .filter((text) => !!text);
};

const getMostCommonBulletPoint = (str) => {
  const bulletToCount = BULLET_POINTS.reduce(
    (acc, cur) => {
      acc[cur] = 0;
      return acc;
    },
    {}
  );
  let bulletWithMostCount = BULLET_POINTS[0];
  let bulletMaxCount = 0;
  for (let char of str) {
    if (bulletToCount.hasOwnProperty(char)) {
      bulletToCount[char]++;
      if (bulletToCount[char] > bulletMaxCount) {
        bulletWithMostCount = char;
      }
    }
  }
  return bulletWithMostCount;
};

const getFirstBulletPointLineIdx = (lines) => {
  for (let i = 0; i < lines.length; i++) {
    for (let item of lines[i]) {
      if (BULLET_POINTS.some((bullet) => item.text.includes(bullet))) {
        return i;
      }
    }
  }
  return undefined;
};

const isWord = (str) => /^[^0-9]+$/.test(str);
const hasAtLeast8Words = (item) =>
  item.text.split(/\s/).filter(isWord).length >= 8;

const getDescriptionsLineIdx = (lines) => {
  let idx = getFirstBulletPointLineIdx(lines);
  if (idx === undefined) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.length === 1 && hasAtLeast8Words(line[0])) {
        idx = i;
        break;
      }
    }
  }
  return idx;
};

module.exports = {
  BULLET_POINTS,
  getBulletPointsFromLines,
  getDescriptionsLineIdx,
}; 