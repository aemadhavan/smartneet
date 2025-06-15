import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { stats } from "../data/stats";

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

const numberCounter: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 1
      }
    }
};

export const HeroSection = () => {
    return (
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
                    Crack NEET with <span className="text-emerald-400">SmarterNEET</span> - Your Ultimate Practice Partner </motion.h1>
                
                <motion.p 
                    className="text-lg md:text-xl text-indigo-100 mb-8 max-w-xl"
                    variants={fadeIn}
                >
                    Access high-quality NEET questions, AI-driven performance insights, and a personalized learning journey—all tailored to help you succeed.
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
                            
                            {/* Student Performance Dashboard */}
                            <div className="bg-white rounded-md p-4">
                                <div className="flex justify-between items-center mb-4">
                                <h3 className="text-indigo-800 font-semibold">Your NEET Success Journey</h3>
                                <div className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                    +23% this month
                                </div>
                                </div>
                                
                                {/* Progress Graph */}
                                <div className="mb-4 h-32 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg p-2 flex items-end">
                                {[35, 42, 38, 50, 65, 72, 78, 85].map((height, i) => (
                                    <div key={i} className="relative flex-1 mx-0.5">
                                    <div 
                                        className="absolute bottom-0 left-0 right-0 bg-indigo-600 rounded-t-sm transition-all duration-500" 
                                        style={{height: `${height}%`}}
                                    ></div>
                                    </div>
                                ))}
                                </div>
                                
                                {/* Analytics Summary */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="bg-purple-50 p-2 rounded-md">
                                    <div className="text-2xl font-bold text-purple-700">87%</div>
                                    <div className="text-xs text-gray-500">Biology Mastery</div>
                                </div>
                                <div className="bg-emerald-50 p-2 rounded-md">
                                    <div className="text-2xl font-bold text-emerald-600">94%</div>
                                    <div className="text-xs text-gray-500">Test Completion</div>
                                </div>
                                </div>
                                
                                {/* Recommendation */}
                                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                <div className="flex items-start">
                                    <div className="text-yellow-500 mr-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zm4.657 2.757a1 1 0 10-1.414-1.414l-.707.707a1 1 0 101.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zm3 6v-1h4v1a2 2 0 11-4 0z" />
                                    </svg>
                                    </div>
                                    <div>
                                    <p className="text-xs font-medium text-gray-700">Focus on Photosynthesis today to boost your Biology score by 7%</p>
                                    </div>
                                </div>
                                </div>
                            </div>
                            </div>
                        </div>
                        
                        {/* Floating badges */}
                        <div className="absolute -right-4 top-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-12">
                            AI Powered
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
    );

  }
  
