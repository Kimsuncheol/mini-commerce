/**
 * Utility for morpheme analysis using spaCy API
 */

export interface MorphemeInfo {
  type: 'prefix' | 'root' | 'suffix';
  text: string;
}

export interface TokenAnalysis {
  text: string;
  lemma: string;
  pos: string;
  tag: string;
  morph: string;
  is_stop: boolean;
  morphemes: MorphemeInfo[];
}

/**
 * Analyzes text to break it down into morphemes using our spaCy API
 * @param text The text to analyze
 * @returns An array of token analyses with morpheme breakdowns
 */
export const analyzeMorphemes = async (text: string): Promise<TokenAnalysis[]> => {
  try {
    // The API URL - adjust according to your deployment
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${apiUrl}/api/morpheme-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Unknown error during morpheme analysis');
    }
    
    return data.result;
  } catch (error) {
    console.error('Error analyzing morphemes:', error);
    throw error;
  }
};

/**
 * Utility function to highlight morphemes with different colors based on type
 * @param morphemes Array of morpheme information
 * @returns HTML string with color-coded morphemes
 */
export const getColorCodedMorphemes = (morphemes: MorphemeInfo[]): string => {
  return morphemes.map(morpheme => {
    let color: string;
    
    switch (morpheme.type) {
      case 'prefix':
        color = 'blue';
        break;
      case 'suffix':
        color = 'green';
        break;
      case 'root':
      default:
        color = 'red';
        break;
    }
    
    return `<span style="color: ${color};">${morpheme.text}</span>`;
  }).join('');
};

/**
 * Get a simple text representation of the morpheme breakdown
 * @param morphemes Array of morpheme information
 * @returns String with morphemes separated by hyphens
 */
export const getMorphemeText = (morphemes: MorphemeInfo[]): string => {
  return morphemes.map(m => m.text).join('-');
}; 