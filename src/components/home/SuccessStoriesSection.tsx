import { motion } from "framer-motion";
import Link from "next/link";
import { stats } from "../data/stats";

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

  export const SuccessStoriesSection = () => {
    return (
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
    );

  }