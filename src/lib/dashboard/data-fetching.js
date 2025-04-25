// File: src/lib/dashboard/data-fetching.js

/**
 * Helper to derive subject performance from sessions
 * @param {Array} sessions - Session data
 * @returns {Array} Subject performance data
 */
const deriveSubjectPerformance = (sessions) => {
  // Group sessions by subject and calculate average accuracy
  const subjectMap = new Map();
  
  sessions.forEach(session => {
    if (!session.subject_name) return;
    
    const current = subjectMap.get(session.subject_name) || {totalAccuracy: 0, count: 0};
    subjectMap.set(session.subject_name, {
      totalAccuracy: current.totalAccuracy + session.accuracy,
      count: current.count + 1
    });
  });
  
  // Convert to array of objects for chart
  return Array.from(subjectMap.entries()).map(([subject, data]) => ({
    subject,
    accuracy: Math.round(data.totalAccuracy / data.count)
  }));
};

/**
 * Helper to derive performance over time data
 * @param {Array} sessions - Session data
 * @returns {Array} Performance over time data
 */
const derivePerformanceData = (sessions) => {
  // Sort sessions by date and take the last 7
  const sortedSessions = [...sessions]
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(-7);
  
  return sortedSessions.map(session => {
    const date = new Date(session.start_time);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      accuracy: Math.round(session.accuracy),
      score: session.score || 0
    };
  });
};

/**
 * Identify focus areas (low performance topics)
 * @param {Array} topicMastery - Topic mastery data
 * @returns {Array} Focus areas data
 */
const generateFocusAreas = (topicMastery) => {
  return [...topicMastery]
    .filter(topic => topic.accuracy_percentage < 70)
    .sort((a, b) => a.accuracy_percentage - b.accuracy_percentage)
    .slice(0, 3)
    .map(topic => ({
      name: topic.topic_name,
      accuracy: topic.accuracy_percentage
    }));
};

/**
 * Identify strong areas (high performance topics)
 * @param {Array} topicMastery - Topic mastery data
 * @returns {Array} Strong areas data
 */
const generateStrongAreas = (topicMastery) => {
  return [...topicMastery]
    .filter(topic => topic.accuracy_percentage >= 80)
    .sort((a, b) => b.accuracy_percentage - a.accuracy_percentage)
    .slice(0, 3)
    .map(topic => ({
      name: topic.topic_name,
      accuracy: topic.accuracy_percentage
    }));
};

/**
 * Fetches all dashboard data
 * @returns {Promise<Object>} Dashboard data
 */
export const fetchDashboardData = async () => {
  try {
    // Use Promise.all to fetch data in parallel
    const [sessionsData, topicData, statsData, typesData] = await Promise.all([
      fetchRecentSessions(),
      fetchTopicMastery(),
      fetchUserStats(),
      fetchQuestionTypes()
    ]);
    
    // Derive additional visualization data
    const subjectData = deriveSubjectPerformance(sessionsData);
    const performanceData = derivePerformanceData(sessionsData);
    const focusAreas = generateFocusAreas(topicData);
    const strongAreas = generateStrongAreas(topicData);
    
    return {
      recentSessions: sessionsData,
      topicMastery: topicData,
      stats: statsData,
      questionTypeData: typesData,
      subjectPerformance: subjectData,
      performanceOverTime: performanceData,
      focusAreas,
      strongAreas
    };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    // Return empty default data
    return {
      recentSessions: [],
      topicMastery: [],
      stats: {
        totalSessions: 0,
        totalQuestionsAttempted: 0,
        totalCorrectAnswers: 0,
        averageAccuracy: 0,
        totalDurationMinutes: 0,
        streakCount: 0,
        masteredTopics: 0
      },
      questionTypeData: [],
      subjectPerformance: [],
      performanceOverTime: [],
      focusAreas: [],
      strongAreas: []
    };
  }
};

/**
 * Fetch recent practice sessions
 * @returns {Promise<Array>} Array of session data
 */
export const fetchRecentSessions = async () => {
  try {
    const response = await fetch('/api/practice-sessions?limit=10');
    if (!response.ok) {
      throw new Error('Failed to fetch recent sessions');
    }
    
    const responseData = await response.json();
    
    // Handle different response formats
    let sessionsArray = [];
    
    if (Array.isArray(responseData)) {
      // If the response is already an array
      sessionsArray = responseData;
    } else if (responseData && typeof responseData === 'object') {
      // If the response is an object, look for common array properties
      const possibleArrayProps = ['data', 'sessions', 'results', 'items'];
      
      for (const prop of possibleArrayProps) {
        if (responseData[prop] && Array.isArray(responseData[prop])) {
          sessionsArray = responseData[prop];
          break;
        }
      }
      
      // If we still don't have an array, log the response structure
      if (sessionsArray.length === 0) {
        console.error('Expected array but got object with properties:', Object.keys(responseData));
        return [];
      }
    } else {
      console.error('Expected array or object but got:', typeof responseData);
      return [];
    }
    
    // Transform data to include calculated accuracy
    return sessionsArray.map((session) => {
      const questionsAttempted = session.questions_attempted ?? 0;
      const questionsCorrect = session.questions_correct ?? 0;
      
      return {
        ...session,
        accuracy: questionsAttempted > 0 
          ? (questionsCorrect / questionsAttempted) * 100 
          : 0
      };
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
};

/**
 * Fetch topic mastery data
 * @returns {Promise<Array>} Array of topic mastery data
 */
export const fetchTopicMastery = async () => {
  try {
    const response = await fetch('/api/topic-mastery');
    if (!response.ok) {
      throw new Error('Failed to fetch topic mastery');
    }
    
    const responseData = await response.json();
    
    // Handle different response formats
    let masteryArray = [];
    
    if (Array.isArray(responseData)) {
      // If the response is already an array
      masteryArray = responseData;
    } else if (responseData && typeof responseData === 'object') {
      // If the response is an object, look for common array properties
      const possibleArrayProps = ['data', 'topics', 'mastery', 'results', 'items'];
      
      for (const prop of possibleArrayProps) {
        if (responseData[prop] && Array.isArray(responseData[prop])) {
          masteryArray = responseData[prop];
          break;
        }
      }
      
      // If we still don't have an array, log the response structure
      if (masteryArray.length === 0) {
        console.error('Expected array for topic mastery but got object with properties:', Object.keys(responseData));
        return [];
      }
    } else {
      console.error('Expected array or object for topic mastery but got:', typeof responseData);
      return [];
    }
    
    return masteryArray;
  } catch (error) {
    console.error('Error fetching topic mastery:', error);
    return [];
  }
};

/**
 * Fetch user statistics
 * @returns {Promise<Object>} User statistics
 */
export const fetchUserStats = async () => {
  try {
    const response = await fetch('/api/user-stats');
    if (!response.ok) {
      throw new Error('Failed to fetch user stats');
    }
    
    const responseData = await response.json();
    
    // Default stats to return if we can't find valid data
    const defaultStats = {
      totalSessions: 0,
      totalQuestionsAttempted: 0,
      totalCorrectAnswers: 0,
      averageAccuracy: 0,
      totalDurationMinutes: 0,
      streakCount: 0,
      masteredTopics: 0
    };
    
    // Handle different response formats
    let statsData = null;
    
    if (responseData && typeof responseData === 'object') {
      // If the response is already the stats object
      if ('totalSessions' in responseData || 
          'totalQuestionsAttempted' in responseData || 
          'averageAccuracy' in responseData) {
        statsData = responseData;
      } else {
        // If the response is an object with a nested stats object
        const possibleStatsProps = ['data', 'stats', 'userStats', 'results'];
        
        for (const prop of possibleStatsProps) {
          if (responseData[prop] && typeof responseData[prop] === 'object') {
            statsData = responseData[prop];
            break;
          }
        }
        
        // If we still don't have stats data, log the response structure
        if (!statsData) {
          console.error('Expected object with stats but got object with properties:', Object.keys(responseData));
          return defaultStats;
        }
      }
    } else {
      console.error('Expected object for user stats but got:', typeof responseData);
      return defaultStats;
    }
    
    // Return with defaults for any missing properties
    return {
      totalSessions: statsData.totalSessions || 0,
      totalQuestionsAttempted: statsData.totalQuestionsAttempted || 0,
      totalCorrectAnswers: statsData.totalCorrectAnswers || 0,
      averageAccuracy: statsData.averageAccuracy || 0,
      totalDurationMinutes: statsData.totalDurationMinutes || 0,
      streakCount: statsData.streakCount || 0,
      masteredTopics: statsData.masteredTopics || 0
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      totalSessions: 0,
      totalQuestionsAttempted: 0,
      totalCorrectAnswers: 0,
      averageAccuracy: 0,
      totalDurationMinutes: 0,
      streakCount: 0,
      masteredTopics: 0
    };
  }
};

/**
 * Fetch question type distribution data
 * @returns {Promise<Array>} Array of question type data
 */
export const fetchQuestionTypes = async () => {
  try {
    const response = await fetch('/api/question-types');
    if (!response.ok) {
      throw new Error('Failed to fetch question type distribution');
    }
    
    const responseData = await response.json();
    
    // Default data to return if we can't find a valid array
    const defaultData = [
      { name: 'Multiple Choice', value: 65 },
      { name: 'Multiple Correct', value: 15 },
      { name: 'Assertion-Reason', value: 10 },
      { name: 'Matching', value: 5 },
      { name: 'Sequence', value: 5 }
    ];
    
    // Handle different response formats
    let typesArray = [];
    
    if (Array.isArray(responseData)) {
      // If the response is already an array
      typesArray = responseData;
    } else if (responseData && typeof responseData === 'object') {
      // If the response is an object, look for common array properties
      const possibleArrayProps = ['data', 'types', 'questionTypes', 'distribution', 'results', 'items'];
      
      for (const prop of possibleArrayProps) {
        if (responseData[prop] && Array.isArray(responseData[prop])) {
          typesArray = responseData[prop];
          break;
        }
      }
      
      // If we still don't have an array, log the response structure
      if (typesArray.length === 0) {
        console.error('Expected array for question types but got object with properties:', Object.keys(responseData));
        return defaultData;
      }
    } else {
      console.error('Expected array or object for question types but got:', typeof responseData);
      return defaultData;
    }
    
    return typesArray;
  } catch (error) {
    console.error('Error fetching question types:', error);
    // Return default data in case of error
    return [
      { name: 'Multiple Choice', value: 65 },
      { name: 'Multiple Correct', value: 15 },
      { name: 'Assertion-Reason', value: 10 },
      { name: 'Matching', value: 5 },
      { name: 'Sequence', value: 5 }
    ];
  }
};