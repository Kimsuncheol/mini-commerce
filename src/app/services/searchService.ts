/**
 * Search utility functions for n-gram generation and search correction
 */

/**
 * Generates n-grams from a string
 * @param text The input text to generate n-grams from
 * @param n The size of each n-gram (default: 3)
 * @returns Array of n-grams
 */
export const generateNgrams = (text: string, n: number = 3): string[] => {
  if (!text || n < 1) return [];
  
  // Normalize text: lowercase and remove special characters
  const normalizedText = text.toLowerCase().replace(/[^\w\s]/g, '');
  
  // If text is shorter than n, return the whole text as a single n-gram
  if (normalizedText.length <= n) {
    return [normalizedText];
  }
  
  const ngrams: string[] = [];
  // Generate n-grams
  for (let i = 0; i <= normalizedText.length - n; i++) {
    ngrams.push(normalizedText.slice(i, i + n));
  }
  
  return ngrams;
};

/**
 * Calculates Jaccard similarity between two sets of n-grams
 * @param ngrams1 First set of n-grams
 * @param ngrams2 Second set of n-grams
 * @returns Similarity score between 0 and 1
 */
export const calculateJaccardSimilarity = (ngrams1: string[], ngrams2: string[]): number => {
  if (ngrams1.length === 0 && ngrams2.length === 0) return 1;
  if (ngrams1.length === 0 || ngrams2.length === 0) return 0;
  
  // Create sets for faster intersection/union calculation
  const set1 = new Set(ngrams1);
  const set2 = new Set(ngrams2);
  
  // Calculate intersection
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  
  // Calculate union
  const union = new Set([...set1, ...set2]);
  
  // Jaccard similarity is the size of intersection divided by size of union
  return intersection.size / union.size;
};

/**
 * Finds the most similar term in a list of terms to the query
 * @param query The search query
 * @param terms Array of possible terms to match against
 * @param ngramSize Size of n-grams to use (default: 3)
 * @param threshold Minimum similarity threshold to consider a match (default: 0.3)
 * @returns The most similar term if above threshold, or null if none found
 */
export const findMostSimilarTerm = (
  query: string, 
  terms: string[], 
  ngramSize: number = 3, 
  threshold: number = 0.3
): string | null => {
  if (!query || !terms || terms.length === 0) return null;
  
  const queryNgrams = generateNgrams(query, ngramSize);
  let bestMatch: string | null = null;
  let bestScore = threshold; // Use threshold as minimum score
  
  for (const term of terms) {
    const termNgrams = generateNgrams(term, ngramSize);
    const similarity = calculateJaccardSimilarity(queryNgrams, termNgrams);
    
    if (similarity > bestScore) {
      bestScore = similarity;
      bestMatch = term;
    }
  }
  
  return bestMatch;
};

/**
 * Corrects a search query based on a dictionary of terms
 * @param query The search query to correct
 * @param dictionary Dictionary of valid terms
 * @param ngramSize Size of n-grams to use
 * @param threshold Minimum similarity threshold
 * @returns Object containing corrected query and whether correction was made
 */
export const correctSearchQuery = (
  query: string,
  dictionary: string[],
  ngramSize: number = 3,
  threshold: number = 0.3
): { corrected: string, wasCorrection: boolean } => {
  if (!query) return { corrected: '', wasCorrection: false };
  
  // Split query into words
  const words = query.split(/\s+/);
  let wasCorrection = false;
  
  // Correct each word if needed
  const correctedWords = words.map(word => {
    // Skip very short words
    if (word.length < 3) return word;
    
    const correction = findMostSimilarTerm(word, dictionary, ngramSize, threshold);
    if (correction && correction !== word) {
      wasCorrection = true;
      return correction;
    }
    return word;
  });
  
  return {
    corrected: correctedWords.join(' '),
    wasCorrection
  };
};

/**
 * Suggests related search terms based on a query
 * @param query The search query
 * @param dictionary Dictionary of valid terms
 * @param maxSuggestions Maximum number of suggestions to return
 * @param ngramSize Size of n-grams to use
 * @returns Array of suggested terms
 */
export const suggestSearchTerms = (
  query: string,
  dictionary: string[],
  maxSuggestions: number = 5,
  ngramSize: number = 3
): string[] => {
  if (!query || !dictionary || dictionary.length === 0) return [];
  
  const queryNgrams = generateNgrams(query, ngramSize);
  const similarities: Array<{ term: string; score: number }> = [];
  
  for (const term of dictionary) {
    if (term === query) continue; // Skip exact match
    
    const termNgrams = generateNgrams(term, ngramSize);
    const similarity = calculateJaccardSimilarity(queryNgrams, termNgrams);
    
    if (similarity > 0.1) { // Use a lower threshold for suggestions
      similarities.push({ term, score: similarity });
    }
  }
  
  // Sort by similarity score descending
  similarities.sort((a, b) => b.score - a.score);
  
  // Return top N terms
  return similarities.slice(0, maxSuggestions).map(item => item.term);
}; 