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


  export const InteractiveDemoSection = () => {
    return (
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
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Experience SmarterNEET in Action</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">Try our interactive demo and explore how SmarterNEET helps you practice smarter, track progress, and prepare with confidence.​</p>
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
                                <p className="text-gray-600">Practice with 200 NEET-style questions tailored to your strengths and improvement areas. Question sets update daily to help reinforce learning.​</p>
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
                                <p className="text-gray-600">Get real-time feedback on accuracy, completion, and consistency across subjects. Spot your strong and weak areas at a glance.​</p>
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
                                <p className="text-gray-600">Visualize NEET topics as interactive concept maps—coming soon to help you make better connections and revise faster.​</p>
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
                                <p className="text-gray-600">Full-length mock tests with time tracking and post-test feedback are on the way. Practice under pressure and analyze your performance afterward.​</p>
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
                                  <div className="ml-2 text-xs text-gray-500">dashboard.smarterneet.com</div>
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
    );

  }