'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import productVectorStore from '@/utils/vectorStore';
import { processAIChat } from '@/app/services/aiService';

export default function RAGAdminPage() {
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [productCount, setProductCount] = useState(0);
  const [testQuery, setTestQuery] = useState('');
  const [queryResults, setQueryResults] = useState<string>('');
  const [responseLoading, setResponseLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  // Check if vector store is already initialized
  useEffect(() => {
    const checkInitialization = async () => {
      try {
        // Try to search for something to trigger initialization if needed
        const results = await productVectorStore.search('test', 1);
        setInitialized(true);
        setProductCount(results.length > 0 ? results.length : 0);
      } catch (error) {
        console.error('Error checking vector store initialization:', error);
        setInitialized(false);
      }
    };

    checkInitialization();
  }, []);

  const handleInitialize = async () => {
    setLoading(true);
    try {
      await productVectorStore.initialize();
      const results = await productVectorStore.search('', 5); // Get first 5 products
      setInitialized(true);
      setProductCount(results.length);
    } catch (error) {
      console.error('Error initializing vector store:', error);
      alert('Failed to initialize: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleTestSearch = async () => {
    if (!testQuery.trim()) return;
    
    setResponseLoading(true);
    try {
      // Test the product search
      const results = await productVectorStore.search(testQuery, 5);
      setQueryResults(productVectorStore.formatProductsForContext(results));
      
      // Test the AI response with RAG
      const response = await processAIChat(testQuery, '');
      setAiResponse(response);
    } catch (error) {
      console.error('Error testing search:', error);
      setQueryResults('Error performing search: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setAiResponse('Error generating AI response');
    } finally {
      setResponseLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">RAG System Administration</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vector Store Status */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Vector Store Status</h2>
          <div className="mb-4">
            <p className="mb-2">
              Status: <span className={initialized ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                {initialized ? 'Initialized' : 'Not Initialized'}
              </span>
            </p>
            {initialized && (
              <p>Products in store: {productCount}</p>
            )}
          </div>
          
          <button
            onClick={handleInitialize}
            disabled={loading || initialized}
            className={`px-4 py-2 rounded ${
              loading || initialized 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white font-medium`}
          >
            {loading ? 'Initializing...' : initialized ? 'Already Initialized' : 'Initialize RAG System'}
          </button>
        </div>
        
        {/* Test RAG */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Test RAG Search</h2>
          <div className="mb-4">
            <label htmlFor="testQuery" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Test Query
            </label>
            <input
              type="text"
              id="testQuery"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="e.g., show me smartphone products"
              className="w-full px-4 py-2 border rounded-md dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <button
            onClick={handleTestSearch}
            disabled={responseLoading || !initialized || !testQuery.trim()}
            className={`px-4 py-2 rounded ${
              responseLoading || !initialized || !testQuery.trim()
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white font-medium`}
          >
            {responseLoading ? 'Searching...' : 'Test Search'}
          </button>
        </div>
      </div>
      
      {/* Search Results */}
      {queryResults && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Product Search Results</h2>
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto max-h-96 whitespace-pre-wrap text-sm">
            {queryResults}
          </pre>
        </div>
      )}
      
      {/* AI Response */}
      {aiResponse && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">AI Response with RAG</h2>
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="whitespace-pre-wrap">{aiResponse}</p>
          </div>
        </div>
      )}
      
      <div className="mt-6">
        <Link href="/admin/seed" className="text-indigo-600 dark:text-indigo-400 hover:underline">
          ← Go to Seed Page
        </Link>
        {' | '}
        <Link href="/products" className="text-indigo-600 dark:text-indigo-400 hover:underline">
          Go to Products Page
        </Link>
      </div>
    </div>
  );
} 