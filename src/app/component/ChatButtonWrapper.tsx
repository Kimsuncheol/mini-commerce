'use client';

import dynamic from 'next/dynamic';

// Dynamically import the chatbot component with SSR disabled
const FloatingActionButton = dynamic(
  () => import('./Home/ui/FloatingActionButtonForChattingWithAIChatbot'),
  { ssr: false }
);

export default function ChatButtonWrapper() {
  return <FloatingActionButton />;
} 