"use client"

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
//import Image from 'next/image';
import Link from 'next/link';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const heroImageAnimate = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1, 
    transition: { 
      type: "spring",
      stiffness: 50,
      delay: 0.2 
    } 
  }
};

const numberCounter = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 1
    }
  }
};

const HomePage = () => {
  const [activeTab, setActiveTab] = useState("Biology");
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  // Mock data for students who secured top ranks
  const topStudents = [
    {
      name: "Priya Sharma",
      rank: "AIR 342",
      year: "2023",
      image: "/student1.jpg",
      quote: "SmartNEET helped me identify my weak areas in Biology. After 3 months of focused practice, I improved my score by 15%."
    },
    {
      name: "Rahul Patel",
      rank: "AIR 518",
      year: "2022",
      image: "/student2.jpg",
      quote: "The detailed explanations and interactive question bank transformed my NEET preparation journey."
    },
    {
      name: "Amit Verma",
      rank: "AIR 724",
      year: "2023",
      image: "/student3.jpg",
      quote: "Practicing with actual NEET questions from previous years built my confidence and time management skills."
    }
  ];

  // Stats
  const stats = [
    { number: "10K+", label: "Questions" },
    { number: "60K+", label: "Students" },
    { number: "85%", label: "Success Rate" },
    { number: "10", label: "Years of Papers" }
  ];

  // Sample questions
  const questions = [
    {
      id: 1,
      year: "2023",
      subject: "Biology",
      topic: "Human Physiology",
      difficulty: "Medium",
      question: "Which of the following statements about the human respiratory system is incorrect?",
      options: [
        { id: "A", text: "The partial pressure of O₂ in alveolar air is about 104 mm Hg" },
        { id: "B", text: "The partial pressure of CO₂ in alveolar air is about 40 mm Hg" },
        { id: "C", text: "Oxyhaemoglobin dissociation curve is sigmoid in shape", correct: true },
        { id: "D", text: "The enzyme carbonic anhydrase is present in the plasma of blood" }
      ],
      explanation: "The correct statement is that oxyhaemoglobin dissociation curve is sigmoid in shape. The incorrect statement is option D: The enzyme carbonic anhydrase is present in RBCs, not in the plasma of blood.",
      stats: "75% answered correctly"
    },
    {
      id: 2,
      year: "2022",
      subject: "Biology",
      topic: "Cell Biology",
      difficulty: "Hard",
      question: "Which of the following statements is incorrect regarding mitochondria?",
      options: [
        { id: "A", text: "Inner membrane is convoluted with infoldings" },
        { id: "B", text: "Matrix contains single circular DNA molecule" },
        { id: "C", text: "Outer membrane is porous due to presence of VDAC" },
        { id: "D", text: "Inner membrane is permeable to all kinds of molecules", correct: true }
      ],
      explanation: "The inner mitochondrial membrane is selectively permeable, not permeable to all kinds of molecules. It contains specific transporters for the regulated movement of metabolites.",
      stats: "62% answered correctly"
    },
    {
      id: 3,
      year: "2021",
      subject: "Biology",
      topic: "Genetics",
      difficulty: "Easy",
      question: "Which enzyme is responsible for the conversion of RNA to DNA?",
      options: [
        { id: "A", text: "DNA polymerase" },
        { id: "B", text: "Reverse transcriptase", correct: true },
        { id: "C", text: "RNA polymerase" },
        { id: "D", text: "Primase" }
      ],
      explanation: "Reverse transcriptase is the enzyme that catalyzes the formation of DNA from an RNA template, a process termed as reverse transcription. It is found in retroviruses like HIV.",
      stats: "89% answered correctly"
    }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Head>
        <title>SmartNEET - Advanced NEET Exam Preparation Platform</title>
        <meta name="description" content="Master your NEET preparation with 10 years of previous questions, AI-powered practice tests, and personalized analytics" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        {/* Animated background elements */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 right-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-12 right-12 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-12 md:space-y-0 md:space-x-8">
            <motion.div 
              className="md:w-1/2"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6"
                variants={fadeIn}
              >
                Ace Your <span className="text-emerald-400">NEET</span> With Smarter Preparation
              </motion.h1>
              
              <motion.p 
                className="text-lg md:text-xl text-indigo-100 mb-8 max-w-xl"
                variants={fadeIn}
              >
                Access 10 years of previous NEET questions, AI-powered practice tests, and personalized analytics to maximize your exam performance.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4"
                variants={fadeIn}
              >
                <Link href="#" className="px-8 py-4 bg-white text-indigo-600 font-medium rounded-xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 text-center">
                  Start Free Practice
                </Link>
                <Link href="#" className="px-8 py-4 bg-transparent border border-white text-white font-medium rounded-xl hover:bg-white/10 transition-all text-center">
                  Take Demo Test
                </Link>
              </motion.div>
              
              {/* Stats counter */}
              <motion.div 
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 mb-16" // Add margin-bottom for spacing
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {stats.map((stat, index) => (
                  <motion.div 
                    key={index} 
                    className="text-center"
                    variants={numberCounter}
                  >
                    <p className="text-3xl md:text-4xl font-bold text-white">{stat.number}</p>
                    <p className="text-indigo-200 text-sm md:text-base">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            
            {/* Hero Image */}
            <motion.div 
              className="md:w-1/2 flex justify-center"
              variants={heroImageAnimate}
              initial="hidden"
              animate="visible"
            >
              <div className="relative w-full max-w-md">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-cyan-300 rounded-lg blur opacity-50"></div>
                <div className="relative bg-white rounded-lg shadow-xl overflow-hidden">
                  <div className="p-3 bg-gradient-to-r from-indigo-50 to-cyan-50">
                    <div className="flex items-center space-x-1 mb-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="bg-white rounded-md p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-indigo-800 font-medium">Biology Practice Test</h3>
                          <p className="text-xs text-gray-500">NEET 2023 | Question 12 of 50</p>
                        </div>
                        <div className="text-sm px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                          12:45 left
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-gray-800 font-medium">Which of the following cellular organelles is responsible for protein synthesis?</p>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="p-3 border border-gray-200 rounded-md hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all text-gray-800">
                          A. Mitochondria
                        </div>
                        <div className="p-3 border border-indigo-500 bg-indigo-50 rounded-md text-gray-800 flex items-center">
                          B. Ribosome
                        </div>
                        <div className="p-3 border border-gray-200 rounded-md hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all text-gray-800">
                          C. Lysosome
                        </div>
                        <div className="p-3 border border-gray-200 rounded-md hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all text-gray-800">
                          D. Golgi apparatus
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Previous</button>
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Next</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Wave SVG divider */}
        <div className="absolute bottom-0 left-0 right-0 z-0"> {/* Ensure lower z-index */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 200">
            <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,154.7C384,149,480,107,576,90.7C672,75,768,85,864,101.3C960,117,1056,139,1152,138.7C1248,139,1344,117,1392,106.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Top NEET Aspirants Choose SmartNEET</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Our innovative approach combines past NEET questions with advanced technology to supercharge your preparation.</p>
        </motion.div>
        
        <motion.div 
          className="grid md:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div 
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100"
            variants={fadeIn}
          >
            <div className="w-14 h-14 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">10 Years of Questions</h3>
            <p className="text-gray-600 mb-4">Comprehensive database of NEET questions from the past decade, organized by topic and difficulty level for targeted practice.</p>
            <Link href="#" className="text-indigo-600 font-medium hover:text-indigo-800 inline-flex items-center">
              Explore Question Bank
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </motion.div>
          
          <motion.div 
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100"
            variants={fadeIn}
          >
            <div className="w-14 h-14 bg-emerald-100 rounded-lg flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Analytics</h3>
            <p className="text-gray-600 mb-4">Track your progress with detailed analytics that identify your strengths and pinpoint specific areas that need improvement.</p>
            <Link href="#" className="text-emerald-600 font-medium hover:text-emerald-800 inline-flex items-center">
              See How It Works
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </motion.div>
          
          <motion.div 
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100"
            variants={fadeIn}
          >
            <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Personalized Learning</h3>
            <p className="text-gray-600 mb-4">Our smart algorithm adapts to your performance and creates customized practice sessions tailored to your learning needs.</p>
            <Link href="#" className="text-purple-600 font-medium hover:text-purple-800 inline-flex items-center">
              Try Personalized Quiz
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Question Preview Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Practice Real NEET Questions</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Get familiar with the actual exam pattern by practicing with previous years&apos; questions.</p>
          </motion.div>
          
          {/* Subject Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 bg-gray-100 rounded-lg">
              {["Biology", "Physics", "Chemistry"].map((subject) => (
                <button
                  key={subject}
                  onClick={() => setActiveTab(subject)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeTab === subject
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  } transition-all`}
                >
                  {subject} {subject !== "Biology" && "(Coming Soon)"}
                </button>
              ))}
            </div>
          </div>
          
          {/* Questions */}
          <motion.div 
            className="space-y-6 max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {questions.map((q) => (
              <motion.div 
                key={q.id}
                variants={fadeIn}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mr-2">
                        NEET {q.year}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                        {q.topic}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        q.difficulty === "Easy" ? "bg-green-100 text-green-800" :
                        q.difficulty === "Medium" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {q.difficulty}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">{q.stats}</span>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{q.question}</h3>
                  
                  <div className="space-y-3 mb-4">
                    {q.options.map((option) => (
                      <div 
                        key={option.id}
                        className={`p-3 border rounded-md cursor-pointer transition-all ${
                          option.correct && expandedQuestion === q.id
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                        }`}
                      >
                        {option.id}. {option.text}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <button 
                      onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                      className="text-indigo-600 font-medium hover:text-indigo-800 inline-flex items-center"
                    >
                      {expandedQuestion === q.id ? "Hide Explanation" : "Show Explanation"}
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 transition-transform ${expandedQuestion === q.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-md hover:bg-indigo-200 text-sm font-medium">
                      Save Question
                    </button>
                  </div>
                </div>
                
                {/* Explanation Section */}
                {expandedQuestion === q.id && (
                  <div className="bg-gray-50 border-t border-gray-200 p-6">
                    <h4 className="font-medium text-gray-900 mb-2">Explanation</h4>
                    <p className="text-gray-700">{q.explanation}</p>
                  </div>
                )}
              </motion.div>
            ))}
            
            {/* View More Button */}
            <div className="text-center mt-8">
              <Link href="#" className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all transform hover:-translate-y-1">
                View All Biology Questions
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-50 to-purple-50 overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Experience SmartNEET in Action</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Try our interactive demo to see how our platform makes NEET preparation effective and engaging.</p>
          </motion.div>
          
          <motion.div 
            className="flex flex-col lg:flex-row items-center justify-between gap-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {/* Interactive Features */}
            <motion.div 
              className="lg:w-1/2"
              variants={fadeIn}
            >
              <ul className="space-y-6">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Adaptive Question Bank</h3>
                    <p className="text-gray-600">Our intelligent system adjusts question difficulty based on your performance, ensuring optimal learning efficiency.</p>
                  </div>
                </li>
                
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Performance Analytics Dashboard</h3>
                    <p className="text-gray-600">Visual breakdown of your progress across topics, identifying strengths and suggesting improvement areas.</p>
                  </div>
                </li>
                
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Smart Concept Mapping</h3>
                    <p className="text-gray-600">Interactive concept maps connect related topics, helping you understand relationships between different NEET concepts.</p>
                  </div>
                </li>
                
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 bg-pink-100 rounded-full flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Timed Mock Tests</h3>
                    <p className="text-gray-600">Full-length NEET mock exams with realistic timing and comprehensive post-test analysis to improve your test-taking strategy.</p>
                  </div>
                </li>
              </ul>
              
              <motion.div
                className="mt-8"
                variants={fadeIn}
              >
                <Link href="#" className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all transform hover:-translate-y-1">
                  Try Free Demo
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </motion.div>
            </motion.div>
            
            {/* Interactive Demo Preview */}
            <motion.div 
              className="lg:w-1/2"
              variants={heroImageAnimate}
            >
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-30"></div>
                <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                  <div className="p-2 bg-gray-50">
                    <div className="flex items-center space-x-1 mb-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      <div className="ml-2 text-xs text-gray-500">dashboard.smartneet.com</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Performance Dashboard</h3>
                        <span className="text-sm px-3 py-1 bg-green-100 text-green-800 rounded-full">
                          Last Updated: Today
                        </span>
                      </div>
                      
                      {/* Mock Analytics Dashboard */}
                      <div className="space-y-6">
                        {/* Progress Bars */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Biology</span>
                            <span className="text-sm font-medium text-indigo-600">78%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-indigo-600 h-2.5 rounded-full" style={{width: '78%'}}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Physics</span>
                            <span className="text-sm font-medium text-indigo-600">65%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-indigo-600 h-2.5 rounded-full" style={{width: '65%'}}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Chemistry</span>
                            <span className="text-sm font-medium text-indigo-600">72%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-indigo-600 h-2.5 rounded-full" style={{width: '72%'}}></div>
                          </div>
                        </div>
                        
                        {/* Mock Charts - Represented as colored boxes */}
                        <div className="grid grid-cols-2 gap-4 mt-6">
                          <div className="bg-indigo-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Strength Areas</h4>
                            <div className="space-y-1">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                                <span className="text-xs text-gray-600">Human Physiology</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                                <span className="text-xs text-gray-600">Genetics</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                                <span className="text-xs text-gray-600">Ecology</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-indigo-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Improvement Areas</h4>
                            <div className="space-y-1">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                <span className="text-xs text-gray-600">Plant Physiology</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                <span className="text-xs text-gray-600">Biomolecules</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                <span className="text-xs text-gray-600">Cell Division</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Recent Activity */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Activity</h4>
                          <div className="space-y-2">
                            <div className="flex items-center text-xs">
                              <span className="text-gray-500 w-24">Today, 10:30 AM</span>
                              <span className="text-gray-700">Completed Biology Mock Test #8</span>
                            </div>
                            <div className="flex items-center text-xs">
                              <span className="text-gray-500 w-24">Yesterday</span>
                              <span className="text-gray-700">Revised 45 Genetics questions</span>
                            </div>
                            <div className="flex items-center text-xs">
                              <span className="text-gray-500 w-24">April 4, 2025</span>
                              <span className="text-gray-700">Completed Full NEET Mock Test</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Success Stories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
          >
            <span className="px-3 py-1 text-sm font-medium bg-indigo-100 text-indigo-800 rounded-full inline-block mb-4">SUCCESS STORIES</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Meet Our Top Achievers</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Hear directly from students who cracked NEET with SmartNEET&apos;s help.</p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {topStudents.map((student, index) => (
              <motion.div 
                key={index}
                variants={fadeIn}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-2"
              >
                <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
                    {/* Avatar placeholder */}
                    <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold text-xl">
                      {student.name.charAt(0)}
                    </div>
                  </div>
                </div>
                
                <div className="pt-16 p-6 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{student.name}</h3>
                  <div className="flex justify-center items-center space-x-2 mb-4">
                    <span className="text-sm font-medium text-indigo-600">{student.rank}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="text-sm text-gray-500">NEET {student.year}</span>
                  </div>
                  
                  <p className="text-gray-600 italic mb-6">&quot;{student.quote}&quot;</p>
                  
                  <button className="text-indigo-600 font-medium hover:text-indigo-800 inline-flex items-center">
                    Read Full Story
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      
      {/* Viral Features Section with 3D Effects */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white to-transparent"></div>
        
        {/* 3D Elements - Decorative */}
        <div className="absolute left-0 top-1/4 w-64 h-64 bg-gradient-to-br from-indigo-300/20 to-purple-300/20 rounded-full blur-2xl"></div>
        <div className="absolute right-0 bottom-1/4 w-80 h-80 bg-gradient-to-tr from-emerald-300/20 to-blue-300/20 rounded-full blur-2xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
          >
            <span className="px-3 py-1 text-sm font-medium bg-emerald-100 text-emerald-800 rounded-full inline-block mb-4">VIRAL FEATURES</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Makes SmartNEET Different</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Innovative features that transform how you prepare for NEET.</p>
          </motion.div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="space-y-8"
            >
              <motion.div 
                variants={fadeIn}
                className="flex items-start"
              >
                <div className="flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Powered Question Recommendations</h3>
                  <p className="text-gray-600">Our advanced algorithms analyze your performance patterns to recommend the most effective questions for your learning style.</p>
                </div>
              </motion.div>
              
              <motion.div 
                variants={fadeIn}
                className="flex items-start"
              >
                <div className="flex-shrink-0 h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Streak Rewards System</h3>
                  <p className="text-gray-600">Stay motivated with our gamified learning approach. Earn points, unlock achievements, and compete on leaderboards with friends.</p>
                </div>
              </motion.div>
              
              <motion.div 
                variants={fadeIn}
                className="flex items-start"
              >
                <div className="flex-shrink-0 h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Personalized Study Scheduler</h3>
                  <p className="text-gray-600">Our smart calendar optimizes your study plan based on your learning pace, exam timeline, and topic mastery levels.</p>
                </div>
              </motion.div>
              
              <motion.div 
                variants={fadeIn}
                className="flex items-start"
              >
                <div className="flex-shrink-0 h-12 w-12 bg-pink-100 rounded-full flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Doubt Solving Community</h3>
                  <p className="text-gray-600">Connect with peers and mentors to get your doubts resolved in real-time, enhancing collaborative learning.</p>
                </div>
              </motion.div>
            </motion.div>
            
            {/* 3D Animated App Showcase */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={heroImageAnimate}
              className="relative"
            >
              {/* 3D effect container */}
              <div className="relative w-full max-w-md mx-auto">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl blur opacity-40"></div>
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                  {/* App header */}
                  <div className="bg-indigo-600 p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="font-bold text-lg mr-2">SmartNEET</span>
                        <span className="text-xs px-2 py-0.5 bg-indigo-800 rounded-full">BETA</span>
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                    <p className="text-sm text-indigo-200">Concept Mastery Visualization</p>
                  </div>
                  
                  {/* App content */}
                  <div className="p-4">
                    {/* Topic cluster visualization */}
                    <div className="bg-indigo-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Biology Concept Network</h4>
                      <div className="relative h-60 w-full">
                        {/* Simulating an interactive concept map with circles and connections */}
                        <div className="absolute left-1/4 top-1/4 w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-medium shadow-lg">
                          Cell Biology
                        </div>
                        <div className="absolute right-1/4 top-1/5 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-medium shadow-lg">
                          Genetics
                        </div>
                        <div className="absolute left-1/3 bottom-1/4 w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium shadow-lg">
                          Physiology
                        </div>
                        <div className="absolute right-1/3 bottom-1/3 w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-medium shadow-lg">
                          Evolution
                        </div>
                        
                        {/* Connection lines */}
                        <svg className="absolute inset-0 w-full h-full" style={{zIndex: 0}}>
                          <line x1="35%" y1="30%" x2="65%" y2="25%" stroke="#9f7aea" strokeWidth="2" />
                          <line x1="35%" y1="30%" x2="36%" y2="70%" stroke="#9f7aea" strokeWidth="2" />
                          <line x1="35%" y1="30%" x2="63%" y2="60%" stroke="#9f7aea" strokeWidth="2" />
                          <line x1="65%" y1="25%" x2="36%" y2="70%" stroke="#9f7aea" strokeWidth="2" />
                          <line x1="65%" y1="25%" x2="63%" y2="60%" stroke="#9f7aea" strokeWidth="2" />
                          <line x1="36%" y1="70%" x2="63%" y2="60%" stroke="#9f7aea" strokeWidth="2" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">87%</div>
                        <div className="text-xs text-gray-500">Concept Mastery</div>
                      </div>
                      <div className="bg-emerald-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-600">92%</div>
                        <div className="text-xs text-gray-500">Question Accuracy</div>
                      </div>
                    </div>
                    
                    {/* Progress tracker */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-sm font-medium text-gray-700">Review Recommended</h4>
                        <span className="text-xs text-gray-500">3 topics</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center text-xs">
                          <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                          <span>Mitochondrial Inheritance</span>
                        </div>
                        <div className="flex items-center text-xs">
                          <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                          <span>Recombinant DNA Technology</span>
                        </div>
                        <div className="flex items-center text-xs">
                          <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                          <span>Photophosphorylation</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Buttons */}
                    <div className="flex space-x-2">
                      <button className="flex-1 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium">
                        Practice Now
                      </button>
                      <button className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating badges */}
              <div className="absolute -right-4 -top-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-12">
                New Feature!
              </div>
              <div className="absolute -left-4 -bottom-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform -rotate-12">
                95% Success Rate
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
              <path 
                fill="none" 
                stroke="rgba(255,255,255,0.1)" 
                strokeWidth="0.5"
                d="M0,0 L100,100" 
              />
              <path 
                fill="none" 
                stroke="rgba(255,255,255,0.1)" 
                strokeWidth="0.5"
                d="M100,0 L0,100" 
              />
              {Array.from({length: 10}).map((_, i) => (
                <path 
                  key={i}
                  fill="none" 
                  stroke="rgba(255,255,255,0.1)" 
                  strokeWidth="0.3"
                  d={`M${i*10},0 L${i*10},100`} 
                />
              ))}
              {Array.from({length: 10}).map((_, i) => (
                <path 
                  key={i}
                  fill="none" 
                  stroke="rgba(255,255,255,0.1)" 
                  strokeWidth="0.3"
                  d={`M0,${i*10} L100,${i*10}`} 
                />
              ))}
            </svg>
          </div>
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-12 right-12 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Transform Your NEET Preparation?</h2>
            <p className="text-xl text-indigo-100 mb-10">Join thousands of successful students who achieved their dream medical college seats with SmartNEET.</p>
            
            <motion.div 
              className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6"
              variants={staggerContainer}
            >
              <motion.a
                href="#" 
                variants={fadeIn}
                className="px-8 py-4 bg-white text-indigo-600 font-medium rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                Start Free Trial
              </motion.a>
              <motion.a 
                href="#" 
                variants={fadeIn}
                className="px-8 py-4 bg-transparent border border-white text-white font-medium rounded-xl hover:bg-white/10 transition-all"
              >
                Explore Plans
              </motion.a>
            </motion.div>
            
            <motion.div 
              className="mt-12 flex flex-col sm:flex-row items-center justify-center space-y-6 sm:space-y-0 sm:space-x-8"
              variants={fadeIn}
            >
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-indigo-600 flex items-center justify-center bg-gradient-to-br from-indigo-${300+i*100} to-purple-${300+i*100} text-white font-medium`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div className="ml-4">
                  <div className="font-medium">60,000+ Students</div>
                  <div className="text-sm text-indigo-200">Trust SmartNEET</div>
                </div>
              </div>
              
              <div className="h-12 w-px bg-indigo-400/30 hidden sm:block"></div>
              
              <div className="flex items-center">
                <div className="mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">4.8/5 Rating</div>
                  <div className="text-sm text-indigo-200">Based on 2,500+ reviews</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer 
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <h3 className="text-2xl font-bold text-white mb-4">Smart<span className="text-emerald-400">NEET</span></h3>
              <p className="text-gray-400 mb-4 max-w-md">Your ultimate companion for NEET exam preparation. Access 10 years of previous questions, AI-powered analytics, and personalized learning paths.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">YouTube</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Home</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Biology</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Physics</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Chemistry</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Previous Papers</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Study Material</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Mock Tests</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">NEET Syllabus</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Important Dates</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Exam Pattern</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Team</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Testimonials</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">&copy; 2025 SmartNEET.com. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>*/}
    </div>
  );
};

export default HomePage;