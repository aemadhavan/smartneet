import { motion } from "framer-motion";
import Link from "next/link";

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


  export const FeaturesSection = () => {
    return (
            <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div 
                      className="text-center mb-16"
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: "-100px" }}
                      variants={fadeIn}
                    >
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why NEET Students Are Switching to SmarterNEET</h2>
                      <p className="text-xl text-gray-600 max-w-2xl mx-auto">An intelligent, focused approach to NEET prep — powered by expert-crafted questions, real-time insights, and personalized learning.</p>
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
                        <h3 className="text-xl font-bold text-gray-900 mb-3">500 NEET-Style Questions</h3>
                        <p className="text-gray-600 mb-4">Kickstart your prep with a carefully curated bank of 500 high-quality questions, crafted by subject experts and designed to match NEET standards.​</p>
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
                        <p className="text-gray-600 mb-4">Track your performance with smart analytics. Get insights on accuracy, time taken, and weak areas — and receive improvement tips with every test.​</p>
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
                        <p className="text-gray-600 mb-4">Our system recommends practice topics based on your latest performance and learning trends — helping you focus where it matters most.​</p>
                        <Link href="#" className="text-purple-600 font-medium hover:text-purple-800 inline-flex items-center">
                          Try Personalized Quiz
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </motion.div>
                    </motion.div>
                  </section>
    );

  }
  
