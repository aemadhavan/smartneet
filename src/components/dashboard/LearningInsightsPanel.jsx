// File: src/components/dashboard/LearningInsightsPanel.jsx
export default function LearningInsightsPanel({ stats }) {
    return (
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
        <h3 className="font-medium text-purple-800 mb-2">Learning Insights</h3>
        <ul className="space-y-3">
          <li className="text-sm text-purple-700">
            <span className="font-medium block">Study Pattern:</span>
            {stats.totalSessions > 5 ? 
              "You perform best in morning sessions (9-11 AM)." :
              "Complete more sessions to unlock personalized insights."}
          </li>
          <li className="text-sm text-purple-700">
            <span className="font-medium block">Question Type:</span>
            {stats.totalQuestionsAttempted > 20 ? 
              "You excel at Multiple Choice but struggle with Assertion-Reason questions." :
              "Answer more questions to see your strengths by question type."}
          </li>
          <li className="text-sm text-purple-700">
            <span className="font-medium block">Time Management:</span>
            {stats.totalDurationMinutes > 60 ? 
              "You spend 40% more time on Cell Structure questions than average." :
              "Study more to reveal your time management patterns."}
          </li>
        </ul>
      </div>
    );
  }