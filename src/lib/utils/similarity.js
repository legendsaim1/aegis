export function getShingles(text, n = 1) {
  if (!text) return [];
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (words.length < n) return words.length > 0 ? [words.join(' ')] : [];
  
  const shingles = [];
  for (let i = 0; i <= words.length - n; i++) {
    shingles.push(words.slice(i, i + n).join(' '));
  }
  return shingles;
}

export function buildTfIdfVectors(answersTexts, n = 1) {
  const numDocs = answersTexts.length;
  if (numDocs === 0) return [];

  const docsShingles = answersTexts.map(text => getShingles(text, n));
  
  const df = {};
  docsShingles.forEach(shingles => {
    const uniqueShingles = new Set(shingles);
    uniqueShingles.forEach(shingle => {
      df[shingle] = (df[shingle] || 0) + 1;
    });
  });

  const vectors = docsShingles.map(shingles => {
    const tf = {};
    shingles.forEach(shingle => {
      tf[shingle] = (tf[shingle] || 0) + 1;
    });

    const vector = {};
    for (const [shingle, count] of Object.entries(tf)) {
      const termFrequency = count / (shingles.length || 1);
      // Ensure IDF is always > 0 even if term is in all docs
      const inverseDocumentFrequency = 1 + Math.log(numDocs / df[shingle]);
      vector[shingle] = termFrequency * inverseDocumentFrequency;
    }
    return vector;
  });

  return vectors;
}

export function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const [key, valA] of Object.entries(vecA)) {
    normA += valA * valA;
    if (vecB[key]) {
      dotProduct += valA * vecB[key];
    }
  }

  for (const valB of Object.values(vecB)) {
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function computeHybridSimilarity(unigramVecA, unigramVecB, bigramVecA, bigramVecB, trigramVecA, trigramVecB) {
  const unigramScore = cosineSimilarity(unigramVecA, unigramVecB);
  const bigramScore = cosineSimilarity(bigramVecA, bigramVecB);
  const trigramScore = cosineSimilarity(trigramVecA, trigramVecB);
  
  // 20% unigram, 30% bigram, 50% trigram weighted combination
  return (unigramScore * 0.2) + (bigramScore * 0.3) + (trigramScore * 0.5);
}

/**
 * Computes the pairwise similarity matrix for all answers to a specific question.
 * @param {Array} answers - Array of answer objects, e.g., { id: '...', extracted_text: '...', student_id: '...' }
 * @returns {Array} - Array of pair objects { studentA, studentB, answerIdA, answerIdB, score }
 */
export function computeSimilarityMatrix(answers) {
  if (!answers || answers.length < 2) return [];

  const answersTexts = answers.map(a => a.extracted_text || '');
  const unigramVectors = buildTfIdfVectors(answersTexts, 1); // 1-word shingles (unigrams)
  const bigramVectors = buildTfIdfVectors(answersTexts, 2);  // 2-word shingles (bigrams)
  const trigramVectors = buildTfIdfVectors(answersTexts, 3); // 3-word shingles (trigrams)
  
  const results = [];
  
  for (let i = 0; i < answers.length; i++) {
    for (let j = i + 1; j < answers.length; j++) {
      const score = computeHybridSimilarity(
        unigramVectors[i], unigramVectors[j],
        bigramVectors[i], bigramVectors[j],
        trigramVectors[i], trigramVectors[j]
      );
      results.push({
        studentA: answers[i].student_id,
        studentB: answers[j].student_id,
        answerIdA: answers[i].id,
        answerIdB: answers[j].id,
        score
      });
    }
  }

  // Sort descending by score
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Computes the unigram TF-IDF cosine similarity between two arbitrary strings.
 * @param {string} textA
 * @param {string} textB
 * @returns {number}
 */
export function getTextSimilarity(textA, textB) {
  if (!textA || !textB) return 0;
  const unigramVectors = buildTfIdfVectors([textA, textB], 1);
  const bigramVectors = buildTfIdfVectors([textA, textB], 2);
  const trigramVectors = buildTfIdfVectors([textA, textB], 3);
  return computeHybridSimilarity(
    unigramVectors[0], unigramVectors[1],
    bigramVectors[0], bigramVectors[1],
    trigramVectors[0], trigramVectors[1]
  );
}
