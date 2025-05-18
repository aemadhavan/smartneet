import React from 'react';

const AboutUs = () => {
  return (
    <div className="bg-gradient-to-b from-purple-100 to-white min-h-screen py-12">
      <section 
        id="about-us" 
        className="font-sans px-4 sm:px-8 max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden"
      >
        {/* Hero Section with Purple Theme */}
        <div className="bg-purple-900 text-white p-8 sm:p-10 rounded-t-xl">
          <h1 className="text-4xl sm:text-5xl font-bold">
            About Us
          </h1>
          <h2 className="text-xl sm:text-2xl text-purple-200 mt-4 font-light">
            Learn Smarter. Dream Bigger. Succeed Anywhere.
          </h2>
        </div>
        
        {/* Main Content */}
        <div className="p-8 sm:p-10">
          <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500 mb-8">
            <p className="text-lg leading-relaxed">
              At <span className="font-bold text-purple-700">SmarterNeet</span>, we believe every NEET aspirant deserves access to high-quality preparation—no matter where they live or what their background is. That&apos;s why we&apos;ve built an AI-powered, self-learning platform that levels the playing field for all.
            </p>
          </div>
          
          <p className="text-lg leading-relaxed mb-8">
            Rooted in the vision of <em className="text-purple-600 font-medium">democratizing NEET preparation</em>, SmarterNeet is more than just another test platform. It&apos;s a smart, affordable, and deeply personalized way to practice, improve, and succeed—with the help of data-driven insights and a growing NEET-aligned question bank.
          </p>
          
          {/* Decorative Divider */}
          <div className="flex items-center my-10">
            <div className="flex-grow h-px bg-purple-200"></div>
            <div className="mx-4 text-purple-500 font-medium">OUR CORE VALUES</div>
            <div className="flex-grow h-px bg-purple-200"></div>
          </div>
          
          {/* Vision & Mission - Card Layout */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-purple-100 to-purple-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-2xl font-bold text-purple-800 mb-4 flex items-center">
                <span className="inline-block w-10 h-10 bg-purple-800 text-white rounded-full mr-3 flex items-center justify-center text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
                Our Vision
              </h3>
              <p className="text-lg leading-relaxed">
                To <strong>empower every NEET aspirant</strong> by making world-class test readiness available to all—<em>bridging the learning gap</em> with intelligent tools that adapt to each learner&apos;s journey.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-100 to-purple-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-2xl font-bold text-indigo-800 mb-4 flex items-center">
                <span className="inline-block w-10 h-10 bg-indigo-800 text-white rounded-full mr-3 flex items-center justify-center text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
                Our Mission
              </h3>
              <p className="text-lg leading-relaxed">
                We&apos;re on a mission to make NEET success achievable for every student in India through <strong>AI-powered question generation</strong>, <strong>personalized practice routines</strong>, and <strong>real-time performance analytics</strong>.
              </p>
            </div>
          </div>
          
          {/* What Makes Us Different - Enhanced Cards */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-purple-800 mb-6 pb-2 border-b-2 border-purple-100">
              What Makes Us Different?
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100 hover:shadow-md transition-shadow duration-300 hover:border-purple-200">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl">🧠</span>
                  </div>
                  <h4 className="font-bold text-gray-800 mb-2">AI-Generated Practice</h4>
                  <p>Thousands of NEET-modeled questions sorted by topic and difficulty.</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100 hover:shadow-md transition-shadow duration-300 hover:border-purple-200">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl">🎯</span>
                  </div>
                  <h4 className="font-bold text-gray-800 mb-2">Personalized Learning</h4>
                  <p>Adaptive paths that focus on your strengths and gaps.</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100 hover:shadow-md transition-shadow duration-300 hover:border-purple-200">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl">📊</span>
                  </div>
                  <h4 className="font-bold text-gray-800 mb-2">Performance Insights</h4>
                  <p>Topic-wise accuracy, time tracking, and progress analytics.</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100 hover:shadow-md transition-shadow duration-300 hover:border-purple-200">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl">💸</span>
                  </div>
                  <h4 className="font-bold text-gray-800 mb-2">Affordable Access</h4>
                  <p>Start free, unlock everything for just ₹100/month or ₹1000/year.</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100 hover:shadow-md transition-shadow duration-300 hover:border-purple-200">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl">🌍</span>
                  </div>
                  <h4 className="font-bold text-gray-800 mb-2">Inclusive by Design</h4>
                  <p>Built for learners in every corner of India.</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100 hover:shadow-md transition-shadow duration-300 hover:border-purple-200">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl">🚀</span>
                  </div>
                  <h4 className="font-bold text-gray-800 mb-2">Rapid Improvement</h4>
                  <p>Smart feedback that accelerates your learning journey.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Who We're For - Enhanced Section */}
          <div className="mt-12 bg-gradient-to-r from-purple-50 to-indigo-50 p-8 rounded-lg">
            <h3 className="text-2xl font-bold text-purple-800 mb-6 text-center">Who We&apos;re For</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                  </div>
                  <h4 className="font-bold text-purple-900 mb-3">Students</h4>
                  <p>Preparing for NEET who want smarter practice and clear feedback</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                  </div>
                  <h4 className="font-bold text-purple-900 mb-3">Schools & Coaching Centers</h4>
                  <p>Seeking a scalable, digital test platform for their students</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                  </div>
                  <h4 className="font-bold text-purple-900 mb-3">Parents</h4>
                  <p>Who want affordable, quality support for their child&apos;s NEET dreams</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Call to Action - Enhanced */}
          <div className="mt-12 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8 rounded-lg text-center">
            <h3 className="text-2xl font-bold mb-4">Join the Movement</h3>
            <p className="text-lg mb-4">
              We&apos;re not just building a product—we&apos;re building a movement. A future where <strong>any student with a dream can become a doctor</strong>, regardless of circumstances.
            </p>
            <p className="text-lg mb-6">
              Whether you&apos;re a student, parent, educator, or partner—<strong>let&apos;s democratize NEET success, together.</strong>
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-white text-purple-700 font-bold py-3 px-8 rounded-full hover:bg-purple-50 transition-colors duration-300">
                Get Started Free
              </button>              
            </div>
          </div>          
        </div>
      </section>
    </div>
  );
};

export default AboutUs;