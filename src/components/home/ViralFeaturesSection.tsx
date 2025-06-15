import { motion, Variants } from "framer-motion";

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

const heroImageAnimate: Variants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      transition: { 
        type: "spring" as const,
        stiffness: 50,
        delay: 0.2 
      } 
    }
};
  
export const ViralFeaturesSection = () => {
    return (
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Makes SmarterNEET Different</h2>
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
                        <span className="font-bold text-lg mr-2">SmarterNEET</span>
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
         
    );

  }