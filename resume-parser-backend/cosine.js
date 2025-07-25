// cosine.js
function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    throw new Error('Embeddings must be arrays of the same length');
  }
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Weighted cosine similarity: skills are the first N dims, weight them more
function weightedCosineSimilarity(a, b, skillDims = 128, skillWeight = 2.0) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    throw new Error('Embeddings must be arrays of the same length');
  }
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    const w = i < skillDims ? skillWeight : 1;
    dot += w * a[i] * b[i];
    normA += w * a[i] * a[i];
    normB += w * b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

module.exports = { cosineSimilarity, weightedCosineSimilarity }; 