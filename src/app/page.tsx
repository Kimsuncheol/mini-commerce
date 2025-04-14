'use client';

import { useState } from 'react';
import Navbar from './component/layout/Navbar';
import Footer from './component/layout/Footer';
import HeroSection from './component/Home/HeroSection';
import CategoryGrid from './component/Home/CategoryGrid';
import ProductGrid from './component/Home/ProductGrid';
import PromotionBanner from './component/Home/PromotionBanner';
import FloatingActionButtonForChattingWithAIChatbot from './component/Home/ui/FloatingActionButtonForChattingWithAIChatbot';

export default function Home() {
  const [chatPosition, setChatPosition] = useState({ x: 0, y: 0 });

  const handleChatPositionChange = (newPosition: { x: number; y: number }) => {
    setChatPosition(newPosition);
  };

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      <main>
        <HeroSection />
        <CategoryGrid />
        <PromotionBanner />
        <ProductGrid />
      </main>
      <Footer />
      
      <FloatingActionButtonForChattingWithAIChatbot 
        onChatPositionChange={handleChatPositionChange} 
      />
    </div>
  );
}
