"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Define hero slides with different content and background images
  const slides = [
    {
      id: 1,
      title: "Summer Collection 2023",
      description: "Discover our new arrivals and exclusive deals. Refresh your wardrobe with the latest trends.",
      image: "/hero-background.jpg",
      primaryButtonText: "Shop Now",
      primaryButtonLink: "/products",
      secondaryButtonText: "View Collection",
      secondaryButtonLink: "/collections",
      gradient: "from-purple-800 to-indigo-900",
    },
    {
      id: 2,
      title: "Fall Essentials",
      description: "Get ready for the cooler seasons with our comfortable and stylish fall essentials.",
      image: "/fall-essentials.jpg", // Add this image to public folder
      primaryButtonText: "Explore Now",
      primaryButtonLink: "/products?category=fall",
      secondaryButtonText: "New Arrivals",
      secondaryButtonLink: "/new-arrivals",
      gradient: "from-amber-700 to-orange-800",
    },
    {
      id: 3,
      title: "Limited Edition Collection",
      description: "Exclusive designs that won't last long. Get your hands on our limited edition items today.",
      image: "/limited-edition.jpg", // Add this image to public folder
      primaryButtonText: "Shop Limited",
      primaryButtonLink: "/products?tag=limited",
      secondaryButtonText: "Learn More",
      secondaryButtonLink: "/about-collections",
      gradient: "from-emerald-800 to-teal-900",
    }
  ];

  // Function to handle next slide
  const nextSlide = useCallback(() => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
      setTimeout(() => setIsTransitioning(false), 500);
    }
  }, [isTransitioning, slides.length]);

  // Function to handle previous slide
  const prevSlide = useCallback(() => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
      setTimeout(() => setIsTransitioning(false), 500);
    }
  }, [isTransitioning, slides.length]);

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 6000); // Change slide every 6 seconds

    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <div 
      className="relative overflow-hidden h-[500px] md:h-[600px] lg:h-[700px]"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Slides */}
      {slides.map((slide, index) => (
        <div 
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out z-0
            ${index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          {/* Background Gradient */}
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient} opacity-90 dark:opacity-80 z-10`}></div>
          
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src={slide.image}
              alt={`${slide.title} background`}
              fill
              className="object-cover"
              priority={index === 0}
            />
          </div>

          {/* Content */}
          <div className="relative z-20 flex items-center h-full px-4 py-24 mx-auto max-w-7xl sm:px-6 lg:px-8 md:py-32 lg:py-40">
            <div className="md:w-2/3 lg:w-1/2">
              <h1 className="text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl">
                {slide.title}
              </h1>
              <p className="max-w-3xl mt-6 text-xl text-indigo-100">
                {slide.description}
              </p>
              <div className="flex flex-col gap-4 mt-10 sm:flex-row">
                <Link href={slide.primaryButtonLink} 
                  className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-indigo-700 transition-colors duration-200 bg-white border border-transparent rounded-md hover:bg-indigo-50">
                  {slide.primaryButtonText}
                </Link>
                <Link href={slide.secondaryButtonLink} 
                  className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white transition-colors duration-200 bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700">
                  {slide.secondaryButtonText}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows - only visible on hover */}
      <div 
        className={`absolute inset-y-0 left-0 z-30 flex items-center transition-opacity duration-300 ${
          isHovering ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button 
          onClick={prevSlide}
          className="p-2 ml-2 text-white transition-all duration-200 bg-white/30 hover:bg-white/50 rounded-r-md backdrop-blur-sm"
          aria-label="Previous slide"
        >
          <FiChevronLeft className="w-6 h-6" />
        </button>
      </div>
      <div 
        className={`absolute inset-y-0 right-0 z-30 flex items-center transition-opacity duration-300 ${
          isHovering ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button 
          onClick={nextSlide}
          className="p-2 mr-2 text-white transition-all duration-200 bg-white/30 hover:bg-white/50 rounded-l-md backdrop-blur-sm"
          aria-label="Next slide"
        >
          <FiChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute left-0 right-0 z-30 flex justify-center gap-2 bottom-5">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (!isTransitioning) {
                setIsTransitioning(true);
                setCurrentSlide(index);
                setTimeout(() => setIsTransitioning(false), 500);
              }
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              currentSlide === index ? 'w-8 bg-white' : 'w-2 bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Wave effect at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
          <path 
            fill="#ffffff" 
            fillOpacity="1" 
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,149.3C960,160,1056,160,1152,138.7C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            className="dark:fill-gray-900"
          ></path>
        </svg>
      </div>
    </div>
  );
}
