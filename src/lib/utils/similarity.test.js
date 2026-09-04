import { describe, it, expect } from 'vitest';
import { computeSimilarityMatrix, getShingles, computeHybridSimilarity } from './similarity';

describe('TF-IDF Similarity Engine', () => {
  it('should tokenize short text into smaller shingles', () => {
    const shingles = getShingles('hello world');
    expect(shingles).toEqual(['hello', 'world']);
  });

  it('should generate 1-word shingles correctly', () => {
    const shingles = getShingles('the quick brown fox jumps');
    expect(shingles).toEqual(['the', 'quick', 'brown', 'fox', 'jumps']);
  });

  it('should return high similarity for exact copies', () => {
    const answers = [
      { id: '1', student_id: 's1', extracted_text: 'The mitochondria is the powerhouse of the cell and produces ATP.' },
      { id: '2', student_id: 's2', extracted_text: 'The mitochondria is the powerhouse of the cell and produces ATP.' },
      { id: '3', student_id: 's3', extracted_text: 'Chloroplasts are responsible for photosynthesis in plant cells.' }
    ];

    const results = computeSimilarityMatrix(answers);
    
    // Exact match should be ~1.0
    const copyPair = results.find(r => (r.studentA === 's1' && r.studentB === 's2'));
    expect(copyPair.score).toBeGreaterThan(0.99);

    // Completely different should be 0
    const diffPair = results.find(r => (r.studentA === 's1' && r.studentB === 's3'));
    expect(diffPair.score).toBe(0);
  });

  it('should return moderate similarity for partial copies', () => {
    const answers = [
      { id: '1', student_id: 's1', extracted_text: 'Newton stated that an object in motion stays in motion unless acted upon by an outside force.' },
      { id: '2', student_id: 's2', extracted_text: 'An object in motion stays in motion unless acted upon by an outside force, as stated by Newton.' }
    ];

    const results = computeSimilarityMatrix(answers);
    expect(results[0].score).toBeGreaterThan(0.5); // overlapping shingles exist
    expect(results[0].score).toBeLessThan(1.0);
  });

  it('should handle empty answers gracefully', () => {
    const answers = [
      { id: '1', student_id: 's1', extracted_text: '' },
      { id: '2', student_id: 's2', extracted_text: '' }
    ];

    const results = computeSimilarityMatrix(answers);
    expect(results[0].score).toBe(0);
  });

  it('should generate higher bigram scores for phrase-level copies vs word-level overlap', () => {
    // Both phrase-level and word-level have exact same unigrams (words), but phrase-level has them in the exact same order (bigrams).
    const answersPhrase = [
      { id: '1', student_id: 's1', extracted_text: 'The quick brown fox jumps over the lazy dog.' },
      { id: '2', student_id: 's2', extracted_text: 'The quick brown fox jumps over the lazy dog.' }
    ];
    
    // Scrambled order -> word-level overlap only (unigrams match, bigrams don't)
    const answersWord = [
      { id: '1', student_id: 's1', extracted_text: 'The quick brown fox jumps over the lazy dog.' },
      { id: '2', student_id: 's2', extracted_text: 'dog lazy the over jumps fox brown quick The.' }
    ];

    const resultsPhrase = computeSimilarityMatrix(answersPhrase);
    const resultsWord = computeSimilarityMatrix(answersWord);

    // Hybrid uses 20% unigram, 30% bigram and 50% trigram.
    // Phrase-level copy has 100% bigram/trigram match, Word-level has 0% bigram/trigram match.
    expect(resultsPhrase[0].score).toBeGreaterThan(resultsWord[0].score);
    // Phrase match should be near 1.0
    expect(resultsPhrase[0].score).toBeGreaterThan(0.99);
    // Word match should be exactly 0.20 (because unigrams match 100%, bigrams 0%, trigrams 0%, 0.2*1 + 0.3*0 + 0.5*0 = 0.2)
    expect(resultsWord[0].score).toBeCloseTo(0.20, 1);
  });
});
