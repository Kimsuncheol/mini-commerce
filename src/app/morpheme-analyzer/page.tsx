import MorphemeAnalyzer from '../component/MorphemeAnalyzer';

export const metadata = {
  title: 'Morpheme Analyzer | ShopSmart',
  description: 'Analyze morphemes in text using spaCy API',
};

export default function MorphemeAnalyzerPage() {
  return (
    <div className="container py-8 mx-auto">
      <h1 className="mb-6 text-3xl font-bold text-center text-gray-800 dark:text-white">
        Morpheme Analysis
      </h1>
      <MorphemeAnalyzer />
      
      <div className="max-w-4xl p-6 mx-auto mt-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">About Morpheme Analysis</h2>
        <div className="prose dark:prose-invert">
          <p>
            Morphemes are the smallest meaningful units in a language. For example, the word "unhappiness" 
            consists of three morphemes: the prefix "un-", the root "happy", and the suffix "-ness".
          </p>
          <p>
            This analyzer uses spaCy and custom rules to break down words into their component morphemes. 
            The analysis shows:
          </p>
          <ul>
            <li><strong>Prefixes:</strong> Word beginnings that modify meaning (e.g., "un-", "re-", "pre-")</li>
            <li><strong>Roots:</strong> The core part of the word that carries the main meaning</li>
            <li><strong>Suffixes:</strong> Word endings that modify grammatical function or meaning (e.g., "-ing", "-ed", "-ly")</li>
          </ul>
          <p>
            The analyzer also provides additional linguistic information from spaCy, including:
          </p>
          <ul>
            <li><strong>Lemma:</strong> The base or dictionary form of the word</li>
            <li><strong>POS:</strong> Part of speech (noun, verb, adjective, etc.)</li>
            <li><strong>Tag:</strong> A more detailed part-of-speech tag</li>
            <li><strong>Morph:</strong> Morphological features like tense, number, and person</li>
          </ul>
          <p className="text-sm text-gray-500">
            Note: This is a simplified morpheme analysis using rules for common English patterns. 
            A comprehensive morphological analysis would require more sophisticated linguistic methods.
          </p>
        </div>
      </div>
    </div>
  );
} 