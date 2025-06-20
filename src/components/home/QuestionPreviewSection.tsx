"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { questions } from "../data/questions";
import { useState } from "react";

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const QuestionPreviewSection = () => {
  const [activeTab, setActiveTab] = useState("Biology");
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState<Record<number, boolean>>({});
  
  const handleOptionClick = (questionId: number, optionId: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
    setShowResults(prev => ({ ...prev, [questionId]: true }));
  };

  const handleTryAgain = (questionId: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: "" }));
    setShowResults(prev => ({ ...prev, [questionId]: false }));
  };
  
  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Practice NEET-Style Questions That Mirror the Real Exam​</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Get exam-ready with expert-crafted practice questions that follow the NEET format. Build familiarity with question types, difficulty levels, and time management.​

More previous year questions are coming soon. Stay tuned!​</p>
        </motion.div>
        
        {/* Subject Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            {["Biology", "Physics", "Chemistry"].map((subject) => (
              <button
                key={subject}
                onClick={() => setActiveTab(subject)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === subject
                    ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-300 shadow-sm"
                    : "text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
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
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 mr-2">
                      NEET {q.year}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 mr-2">
                      {q.topic}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      q.difficulty === "Easy" ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" :
                      q.difficulty === "Medium" ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200" :
                      "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                    }`}>
                      {q.difficulty}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{q.stats}</span>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{q.question}</h3>
                
                <div className="space-y-3 mb-4">
                  {q.options.map((option) => {
                    const isSelected = selectedAnswers[q.id] === option.id;
                    const showResult = showResults[q.id];
                    const isCorrect = option.correct;
                    
                    let optionClasses = "p-3 border rounded-md cursor-pointer transition-all ";
                    
                    if (showResult) {
                      if (isSelected && isCorrect) {
                        optionClasses += "border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/30 text-gray-900 dark:text-gray-100";
                      } else if (isSelected && !isCorrect) {
                        optionClasses += "border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/30 text-gray-900 dark:text-gray-100";
                      } else if (isCorrect) {
                        optionClasses += "border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/30 text-gray-900 dark:text-gray-100";
                      } else {
                        optionClasses += "border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 opacity-60";
                      }
                    } else {
                      optionClasses += "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-800 dark:text-gray-200";
                    }
                    
                    return (
                      <div 
                        key={option.id}
                        onClick={() => !showResult && handleOptionClick(q.id, option.id)}
                        className={optionClasses}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option.id}. {option.text}</span>
                          {showResult && (
                            <span className="ml-2">
                              {isSelected && isCorrect && "✓"}
                              {isSelected && !isCorrect && "✗"}
                              {!isSelected && isCorrect && "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex justify-between items-center">
                  <button 
                    onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                    className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center"
                  >
                    {expandedQuestion === q.id ? "Hide Explanation" : "Show Explanation"}
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 transition-transform ${expandedQuestion === q.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showResults[q.id] && (
                    <button 
                      onClick={() => handleTryAgain(q.id)}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              </div>
              
              {/* Explanation Section */}
              {expandedQuestion === q.id && (
                <div className="bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 p-6">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Explanation</h4>
                  <p className="text-gray-700 dark:text-gray-300">{q.explanation}</p>
                </div>
              )}
            </motion.div>
          ))}
          
          {/* View More Button */}
          <div className="text-center mt-8">
            <Link href="/biology" className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all transform hover:-translate-y-1">
              View All Biology Questions
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}