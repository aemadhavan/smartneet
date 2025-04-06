import { motion } from "framer-motion";
import Link from "next/link";
import { questions } from "../data/questions";
import { useState } from "react";

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

  export const QuestionPreviewSection = () => {
    const [activeTab, setActiveTab] = useState("Biology");
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
    return (
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
    );

  }
  
