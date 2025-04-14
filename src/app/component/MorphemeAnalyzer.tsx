'use client';

import React, { useState } from 'react';
import { analyzeMorphemes, TokenAnalysis, getColorCodedMorphemes, getMorphemeText } from '@/utils/morphemeAnalysis';

const MorphemeAnalyzer: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [analysis, setAnalysis] = useState<TokenAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Please enter text to analyze');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await analyzeMorphemes(text);
      setAnalysis(result);
    } catch (err) {
      console.error('Error analyzing morphemes:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze morphemes');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl p-6 mx-auto bg-white rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">Morpheme Analyzer</h2>
      <p className="mb-4 text-gray-600 dark:text-gray-300">
        Enter text below to analyze its morphological structure using spaCy.
      </p>

      <div className="mb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-3 text-gray-700 border border-gray-300 rounded dark:text-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Enter text to analyze (e.g., 'The unhappiness of the children was noticeable')"
        />
      </div>

      <div className="mb-6">
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Morphemes'}
        </button>
      </div>

      {error && (
        <div className="p-3 mb-4 text-red-700 bg-red-100 border border-red-200 rounded dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          {error}
        </div>
      )}

      {analysis.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-xl font-semibold text-gray-800 dark:text-white">Analysis Results</h3>
          
          <div className="mb-4 overflow-hidden border border-gray-200 rounded-lg dark:border-gray-700">
            <div className="flex gap-2 p-3 text-lg font-medium text-gray-800 bg-gray-100 dark:text-white dark:bg-gray-700">
              {analysis.map((token, index) => (
                <div key={index} 
                  className="border-b-2 border-blue-500 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 px-1"
                  title={`POS: ${token.pos}, Tag: ${token.tag}, Morphology: ${token.morph}`}
                >
                  <div dangerouslySetInnerHTML={{ __html: getColorCodedMorphemes(token.morphemes) }} />
                </div>
              ))}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-auto">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="p-2 text-left border dark:border-gray-600">Token</th>
                  <th className="p-2 text-left border dark:border-gray-600">Lemma</th>
                  <th className="p-2 text-left border dark:border-gray-600">Part of Speech</th>
                  <th className="p-2 text-left border dark:border-gray-600">Morphemes</th>
                  <th className="p-2 text-left border dark:border-gray-600">Full Details</th>
                </tr>
              </thead>
              <tbody>
                {analysis.map((token, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-2 border dark:border-gray-600">{token.text}</td>
                    <td className="p-2 border dark:border-gray-600">{token.lemma}</td>
                    <td className="p-2 border dark:border-gray-600">{token.pos} ({token.tag})</td>
                    <td className="p-2 border dark:border-gray-600">
                      <div dangerouslySetInnerHTML={{ __html: getColorCodedMorphemes(token.morphemes) }} />
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {getMorphemeText(token.morphemes)}
                      </div>
                    </td>
                    <td className="p-2 border dark:border-gray-600">
                      <details>
                        <summary className="cursor-pointer">Show details</summary>
                        <pre className="p-2 mt-2 overflow-x-auto text-xs bg-gray-100 rounded dark:bg-gray-700 dark:text-white">
                          {JSON.stringify(token, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <p className="mb-1">Color legend:</p>
            <ul className="list-disc list-inside">
              <li><span className="text-blue-600 dark:text-blue-400">Blue</span>: Prefix</li>
              <li><span className="text-red-600 dark:text-red-400">Red</span>: Root</li>
              <li><span className="text-green-600 dark:text-green-400">Green</span>: Suffix</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MorphemeAnalyzer; 