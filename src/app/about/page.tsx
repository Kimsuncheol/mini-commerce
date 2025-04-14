'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { fadeIn } from '@/utils/animations'
import BackButton from '../component/ui/BackButton'

function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className='min-h-screen transition-colors duration-300 bg-white dark:bg-gray-900'>
      {/* Back Button */}
      <div className="p-4 md:p-6">
        <BackButton destination="/" />
      </div>
      
      {/* Hero Section */}
      <section className="relative h-[50vh] md:h-[60vh] w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 px-4 text-center">
          <motion.h1 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-4 text-4xl font-bold text-white md:text-6xl"
          >
            About Our Shop
          </motion.h1>
          <motion.p 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-2xl mx-auto text-xl text-gray-100 md:text-2xl"
          >
            Delivering quality products and exceptional experiences since 2020
          </motion.p>
        </div>
      </section>

      {/* Mission & Values */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        className="px-4 py-16 mx-auto md:px-8 max-w-7xl"
      >
        <div className="mb-16 text-center">
          <h2 className="mb-6 text-3xl font-bold text-gray-800 dark:text-gray-100 md:text-4xl">Our Mission & Values</h2>
          <div className="w-24 h-1 mx-auto bg-indigo-600"></div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="p-8 transition-shadow duration-300 bg-white border border-gray-100 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700 hover:shadow-xl">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-indigo-100 rounded-full dark:bg-indigo-900">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-indigo-600 dark:text-indigo-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
            </div>
            <h3 className="mb-4 text-xl font-semibold text-center text-gray-800 dark:text-gray-100">Quality</h3>
            <p className="text-center text-gray-600 dark:text-gray-300">We are committed to providing the highest quality products that meet and exceed our customers' expectations.</p>
          </div>

          <div className="p-8 transition-shadow duration-300 bg-white border border-gray-100 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700 hover:shadow-xl">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-indigo-100 rounded-full dark:bg-indigo-900">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-indigo-600 dark:text-indigo-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            </div>
            <h3 className="mb-4 text-xl font-semibold text-center text-gray-800 dark:text-gray-100">Customer First</h3>
            <p className="text-center text-gray-600 dark:text-gray-300">Every decision we make starts with our customers in mind. Your satisfaction is our priority.</p>
          </div>

          <div className="p-8 transition-shadow duration-300 bg-white border border-gray-100 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700 hover:shadow-xl">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-indigo-100 rounded-full dark:bg-indigo-900">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-indigo-600 dark:text-indigo-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            </div>
            <h3 className="mb-4 text-xl font-semibold text-center text-gray-800 dark:text-gray-100">Sustainability</h3>
            <p className="text-center text-gray-600 dark:text-gray-300">We're committed to environmental responsibility in our operations and product sourcing.</p>
          </div>
        </div>
      </motion.section>

      {/* Our Story */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        className="py-16 transition-colors duration-300 bg-gray-50 dark:bg-gray-800"
      >
        <div className="px-4 mx-auto max-w-7xl md:px-8">
          <div className="flex flex-col items-center gap-12 md:flex-row">
            <div className="md:w-1/2">
              <div className="relative h-[400px] w-full rounded-lg overflow-hidden shadow-xl">
                <Image 
                  src="/images/store.jpg" 
                  alt="Our store" 
                  fill 
                  style={{ objectFit: 'cover' }} 
                  className="rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1604719312566-8912e9c8a213?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1674&q=80";
                  }}
                />
              </div>
            </div>
            <div className="mt-8 md:w-1/2 md:mt-0">
              <h2 className="mb-6 text-3xl font-bold text-gray-800 dark:text-white md:text-4xl">Our Story</h2>
              <div className="w-24 h-1 mb-6 bg-indigo-600"></div>
              <p className="mb-4 text-gray-600 dark:text-gray-300">Our journey began in 2020 with a simple idea: to create a shopping experience that combines quality products with exceptional service. What started as a small online store has grown into a trusted brand with a loyal customer base.</p>
              <p className="mb-4 text-gray-600 dark:text-gray-300">We believe that shopping should be more than just a transaction; it should be an experience that brings joy and satisfaction. Our team works tirelessly to curate high-quality products that meet the needs and preferences of our diverse customer base.</p>
              <p className="text-gray-600 dark:text-gray-300">As we continue to grow, we remain committed to our founding principles of quality, integrity, and customer satisfaction. We're grateful for the support of our customers and are excited about the future ahead.</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Team Section */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        className="px-4 py-16 mx-auto md:px-8 max-w-7xl"
      >
        <div className="mb-16 text-center">
          <h2 className="mb-6 text-3xl font-bold text-gray-800 dark:text-white md:text-4xl">Our Team</h2>
          <div className="w-24 h-1 mx-auto mb-6 bg-indigo-600"></div>
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300">Meet the dedicated professionals who make our shop what it is today. Our diverse team brings together expertise from various fields to deliver an exceptional shopping experience.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: 'Emma Johnson', title: 'Founder & CEO', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80' },
            { name: 'Daniel Smith', title: 'Chief Product Officer', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80' },
            { name: 'Sophia Chen', title: 'Head of Marketing', image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80' },
            { name: 'Michael Brown', title: 'Customer Experience', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80' }
          ].map((member, index) => (
            <div key={index} className="overflow-hidden transition-shadow duration-300 bg-white border border-gray-100 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700 hover:shadow-xl">
              <div className="relative h-64">
                <Image 
                  src={member.image} 
                  alt={member.name} 
                  fill 
                  style={{ objectFit: 'cover' }} 
                />
              </div>
              <div className="p-6 text-center">
                <h3 className="mb-1 text-xl font-semibold text-gray-800 dark:text-white">{member.name}</h3>
                <p className="text-indigo-600 dark:text-indigo-400">{member.title}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Contact CTA */}
      <section className="px-4 py-16 transition-colors duration-300 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-800 dark:to-purple-900 md:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">Have Questions?</h2>
          <p className="max-w-2xl mx-auto mb-10 text-xl text-indigo-100">We're here to help! Contact our friendly team for any inquiries about our products or services.</p>
          <a href="/contact" className="inline-block px-8 py-4 text-lg font-semibold text-indigo-600 transition-colors duration-300 bg-white rounded-lg hover:bg-indigo-50 dark:bg-gray-100 dark:text-indigo-700 dark:hover:bg-white">Get In Touch</a>
        </div>
      </section>
    </div>
  )
}

export default AboutPage