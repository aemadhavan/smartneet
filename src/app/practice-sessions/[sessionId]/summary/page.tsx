"use client";

import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Clock, Award, CheckCircle, XCircle, BookOpen, BarChart2 } from 'lucide-react';

// Define interfaces for our data structure
interface TopicPerformance {
  topicId: number;
  topicName: string;
  questionsCorrect: number;
  questionsTotal: number;
  accuracy: number;
}

interface SessionSummary {
  sessionId: number;
  userId: string;
  totalQuestions: number;
  questionsAttempted: number;
  questionsCorrect: number;
  questionsIncorrect: number;
  score: number;
  maxScore: number;
  accuracy: number;
  timeTakenMinutes: number;
  topicPerformance: TopicPerformance[];
}

// This component uses the data available from the current API
const PracticeSessionSummary = () => {
  const [sessionData, setSessionData] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [navigating, setNavigating] = useState<string | null>(null);

  useEffect(() => {
    // Extract session ID from URL
    const pathParts = window.location.pathname.split('/');
    const sessionId = pathParts[pathParts.length - 2]; // Assuming URL format is /practice-sessions/[id]/summary

    const fetchSessionSummary = async () => {
      try {
        const response = await fetch(`/api/practice-sessions/${sessionId}/summary`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch session data');
        }
        
        const data = await response.json();
        setSessionData(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching session data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
          <XCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h3 className="text-xl font-semibold text-red-800">Error Loading Summary</h3>
          <p className="mt-2 text-red-600">{error || "Unable to load session data"}</p>
        </div>
      </div>
    );
  }

  // Data for pie chart
  const pieData = [
    { name: "Correct", value: sessionData.questionsCorrect, color: "#4ade80" },
    { name: "Incorrect", value: sessionData.questionsIncorrect, color: "#f87171" }
  ];

  // Format topic data for bar chart
  const topicChartData = sessionData.topicPerformance.map((topic: TopicPerformance) => ({
    name: topic.topicName,
    accuracy: topic.accuracy,
    correct: topic.questionsCorrect,
    total: topic.questionsTotal
  }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg p-6 text-white mb-8">
        <h1 className="text-3xl font-bold mb-2">Practice Session Summary</h1>
        <p className="text-blue-100">Session #{sessionData.sessionId}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-4 flex items-center">
            <Clock className="mr-3 text-blue-200" />
            <div>
              <p className="text-blue-100 text-sm">Duration</p>
              <p className="text-xl font-semibold">{sessionData.timeTakenMinutes} minutes</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 flex items-center">
            <Award className="mr-3 text-blue-200" />
            <div>
              <p className="text-blue-100 text-sm">Score</p>
              <p className="text-xl font-semibold">{sessionData.score}/{sessionData.maxScore}</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 flex items-center">
            <CheckCircle className="mr-3 text-blue-200" />
            <div>
              <p className="text-blue-100 text-sm">Accuracy</p>
              <p className="text-xl font-semibold">{sessionData.accuracy}%</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 flex items-center">
            <BookOpen className="mr-3 text-blue-200" />
            <div>
              <p className="text-blue-100 text-sm">Questions</p>
              <p className="text-xl font-semibold">{sessionData.totalQuestions} total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Performance Overview Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <BarChart2 className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Performance Overview</h2>
          </div>
          
          <div className="flex justify-center mb-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} questions`, null]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Total Questions</p>
              <p className="text-xl font-bold text-blue-600">{sessionData.totalQuestions}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Correct</p>
              <p className="text-xl font-bold text-green-600">{sessionData.questionsCorrect}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Incorrect</p>
              <p className="text-xl font-bold text-red-600">{sessionData.questionsIncorrect}</p>
            </div>
          </div>
        </div>

        {/* Score Breakdown Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
              <Award className="h-6 w-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Score Details</h2>
          </div>
          
          <div className="mb-6">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">Your Score</p>
              <div className="flex justify-center items-center">
                <span className="text-4xl font-bold text-indigo-600">{sessionData.score}</span>
                <span className="text-xl text-gray-400 ml-2">/ {sessionData.maxScore}</span>
              </div>
              <p className="text-lg font-medium text-gray-700 mt-2">{Math.round((sessionData.score / sessionData.maxScore) * 100)}% achieved</p>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div 
                className="h-4 rounded-full bg-indigo-600" 
                style={{ width: `${Math.round((sessionData.score / sessionData.maxScore) * 100)}%` }}
              ></div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mt-8">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-600 text-sm">Time Spent</p>
                    <p className="font-semibold">{sessionData.timeTakenMinutes} minutes</p>
                  </div>
                  <Clock className="text-indigo-500 h-5 w-5" />
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-600 text-sm">Avg. Time per Question</p>
                    <p className="font-semibold">{Math.round((sessionData.timeTakenMinutes * 60) / sessionData.totalQuestions)} seconds</p>
                  </div>
                  <Clock className="text-indigo-500 h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Topic Performance Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Topic Performance</h2>
        
        <div className="mb-8">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={topicChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={70} 
              />
              <YAxis 
                label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }} 
                domain={[0, 100]} 
              />
              <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
              <Legend />
              <Bar dataKey="accuracy" name="Accuracy (%)" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correct</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessionData.topicPerformance.map((topic: TopicPerformance) => (
                <tr key={topic.topicId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{topic.topicName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{topic.questionsCorrect}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{topic.questionsTotal}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{topic.accuracy}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      topic.accuracy >= 80 ? 'bg-green-100 text-green-800' :
                      topic.accuracy >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {topic.accuracy >= 80 ? 'Excellent' :
                       topic.accuracy >= 60 ? 'Good' :
                       'Needs Improvement'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights Section */}
      <div className="bg-indigo-50 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-indigo-800 mb-4">Session Insights</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-lg text-indigo-700 mb-3">Strengths</h3>
            <ul className="space-y-2">
              {sessionData.topicPerformance
                .filter(topic => topic.accuracy >= 80)
                .slice(0, 3)
                .map((topic: TopicPerformance) => (
                  <li key={topic.topicId} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{topic.topicName} ({topic.accuracy}% accuracy)</span>
                  </li>
                ))}
              
              {sessionData.topicPerformance.filter(topic => topic.accuracy >= 80).length === 0 && (
                <li className="text-gray-500 italic">No strong topics identified yet. Keep practicing!</li>
              )}
            </ul>
          </div>
          
          {/* Areas for Improvement */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-lg text-indigo-700 mb-3">Areas for Improvement</h3>
            <ul className="space-y-2">
              {sessionData.topicPerformance
                .filter(topic => topic.accuracy < 60)
                .slice(0, 3)
                .map((topic: TopicPerformance) => (
                  <li key={topic.topicId} className="flex items-start">
                    <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{topic.topicName} ({topic.accuracy}% accuracy)</span>
                  </li>
                ))}
              
              {sessionData.topicPerformance.filter(topic => topic.accuracy < 60).length === 0 && (
                <li className="text-gray-500 italic">No weak areas identified. Great job!</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-end">
        <button 
          onClick={() => {
            setNavigating('dashboard');
            window.location.href = '/dashboard';
          }}
          disabled={navigating !== null}
          className={`px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200 ${
            navigating === 'dashboard' ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {navigating === 'dashboard' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 inline-block mr-2"></div>
              Loading...
            </>
          ) : (
            'Back to Dashboard'
          )}
        </button>
        
        <button 
          onClick={() => {
            setNavigating('practice');
            window.location.href = '/practice/';
          }}
          disabled={navigating !== null}
          className={`px-4 py-2 bg-indigo-600 rounded-md text-white font-medium hover:bg-indigo-700 transition-colors duration-200 ${
            navigating === 'practice' ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {navigating === 'practice' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
              Loading...
            </>
          ) : (
            'Start New Practice'
          )}
        </button>
      </div>
    </div>
  );
};

export default PracticeSessionSummary;