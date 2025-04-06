import { motion } from "framer-motion";


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
  

  export const CTASection = () => {
    return (
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
            <p className="text-xl text-indigo-100 mb-10">Join thousands of successful students who achieved their dream medical college seats with SmarterNEET.</p>
            
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
                  <div className="text-sm text-indigo-200">Trust SmarterNEET</div>
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
    );

  }