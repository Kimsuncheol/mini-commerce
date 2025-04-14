function getNGrams(str: string, n: number): Set<string> {
  const nGrams = new Set<string>();
  if (!str || str.length < n) {
    return nGrams;
  }
  const source = str.toLowerCase();
  for (let i = 0; i <= source.length - n; i++) {
    nGrams.add(source.substring(i, i + n));
  }
  return nGrams;
}

export function ngramSimilarity(str1: string, str2: string, n: number = 2): number {
  if (!str1 || !str2) {
    return 0;
  }
  
  const nGrams1 = getNGrams(str1, n);
  const nGrams2 = getNGrams(str2, n);

  if (nGrams1.size === 0 || nGrams2.size === 0) {
    return 0;
  }

  let intersectionSize = 0;
  nGrams1.forEach(gram => {
    if (nGrams2.has(gram)) {
      intersectionSize++;
    }
  });

  // Jaccard index variation for n-grams
  return intersectionSize / (nGrams1.size + nGrams2.size - intersectionSize);
} 