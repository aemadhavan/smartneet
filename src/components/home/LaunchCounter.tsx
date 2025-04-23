// File: src/components/home/LaunchCounter.tsx
import React, { useState, useEffect } from 'react';

/**
 * Launch Countdown Component
 * 
 * Displays a countdown timer for the platform's full launch in 3 days.
 * This component is positioned fixed at the bottom right corner of the screen.
 */
const LaunchCounter = () => {
  // Set the launch date to 3 days from now
  const calculateLaunchDate = () => {
    const now = new Date();
    const launchDate = new Date(now);
    launchDate.setDate(now.getDate() + 3);
    // Set time to midnight
    launchDate.setHours(0, 0, 0, 0);
    return launchDate;
  };

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const launchDate = calculateLaunchDate();
    
    const timer = setInterval(() => {
      const now = new Date();
      const difference = launchDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        // Launch time has passed
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);
    
    // Cleanup
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="bg-indigo-600 text-white px-4 py-2 font-semibold text-center">
        🚀 Full Launch Countdown
      </div>
      <div className="p-4 flex items-center justify-center space-x-4">
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-indigo-700">{timeLeft.days}</div>
          <div className="text-xs text-gray-500">DAYS</div>
        </div>
        <div className="text-xl font-bold text-gray-400">:</div>
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-indigo-700">{timeLeft.hours.toString().padStart(2, '0')}</div>
          <div className="text-xs text-gray-500">HOURS</div>
        </div>
        <div className="text-xl font-bold text-gray-400">:</div>
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-indigo-700">{timeLeft.minutes.toString().padStart(2, '0')}</div>
          <div className="text-xs text-gray-500">MINUTES</div>
        </div>
        <div className="text-xl font-bold text-gray-400">:</div>
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-indigo-700">{timeLeft.seconds.toString().padStart(2, '0')}</div>
          <div className="text-xs text-gray-500">SECONDS</div>
        </div>
      </div>
      <div className="bg-gray-100 px-4 py-2 text-center">
        <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors">
          Get Early Access
        </button>
      </div>
    </div>
  );
};

export default LaunchCounter;