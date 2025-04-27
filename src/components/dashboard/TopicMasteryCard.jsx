import { useState } from 'react';
import { ChevronRight, AlertCircle, CheckCircle2, Clock, Award } from 'lucide-react';

const getMasteryColor = (level) => {
  switch(level) {
    case 'notStarted': return '#f3f4f6'; // gray-100
    case 'beginner': return '#fee2e2'; // red-100
    case 'intermediate': return '#fef3c7'; // yellow-100
    case 'advanced': return '#dbeafe'; // blue-100
    case 'mastered': return '#d1fae5'; // green-100
    default: return '#f3f4f6'; // gray-100
  }
};

const getMasteryIcon = (level) => {
  switch(level) {
    case 'notStarted': return <Clock size={16} className="text-gray-500" />;
    case 'beginner': return <AlertCircle size={16} className="text-red-500" />;
    case 'intermediate': return <Clock size={16} className="text-yellow-500" />;
    case 'advanced': return <CheckCircle2 size={16} className="text-blue-500" />;
    case 'mastered': return <Award size={16} className="text-emerald-500" />;
    default: return <Clock size={16} className="text-gray-500" />;
  }
};

const TopicMasteryCard = ({ topic, showDetails = false }) => {
  const [expanded, setExpanded] = useState(showDetails);
  
  // Calculate some metrics for the expanded view
  const successRate = topic.questions_attempted > 0 
    ? Math.round((topic.accuracy_percentage / 100) * topic.questions_attempted)
    : 0;
  
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {getMasteryIcon(topic.mastery_level)}
            <h3 className="font-medium text-gray-800">{topic.topic_name}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: getMasteryColor(topic.mastery_level),
                color: topic.mastery_level === 'notStarted' ? '#6b7280' : '#1f2937'
              }}
            >
              {topic.mastery_level.charAt(0).toUpperCase() + topic.mastery_level.slice(1)}
            </span>
            <ChevronRight 
              size={16} 
              className={`text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} 
            />
          </div>
        </div>
        
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full"
              style={{ 
                width: `${topic.accuracy_percentage}%`,
                backgroundColor: topic.mastery_level === 'mastered' ? '#10b981' : '#3b82f6' 
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Accuracy: {topic.accuracy_percentage}%</span>
            <span>{topic.questions_attempted} questions</span>
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50 rounded-b-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-white p-2 rounded border border-gray-100">
              <div className="text-xs text-gray-500">Questions</div>
              <div className="font-semibold">{topic.questions_attempted}</div>
            </div>
            <div className="bg-white p-2 rounded border border-gray-100">
              <div className="text-xs text-gray-500">Correct</div>
              <div className="font-semibold">{successRate}</div>
            </div>
            <div className="bg-white p-2 rounded border border-gray-100 col-span-2">
              <div className="text-xs text-gray-500">Mastery Progress</div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div
                  className="h-1.5 rounded-full bg-emerald-500"
                  style={{ 
                    width: topic.mastery_level === 'notStarted' ? '0%' :
                           topic.mastery_level === 'beginner' ? '25%' :
                           topic.mastery_level === 'intermediate' ? '50%' :
                           topic.mastery_level === 'advanced' ? '75%' : '100%'
                  }}
                ></div>
              </div>
            </div>
          </div>
          <div className="mt-2 flex justify-end">
            <button className="text-xs text-indigo-600 font-medium hover:text-indigo-800">
              Practice this topic
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicMasteryCard;