// File: src/components/dashboard/TopicMasteryCard.jsx
export default function TopicMasteryCard({ topic }) {
    return (
      <div className="bg-gray-50 p-3 rounded-md">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">{topic.topic_name}</h3>
          <span 
            className="text-xs px-2 py-0.5 rounded-full" 
            style={{ 
              backgroundColor: getMasteryColor(topic.mastery_level),
              color: topic.mastery_level === 'notStarted' ? '#6b7280' : '#1f2937'
            }}
          >
            {topic.mastery_level.charAt(0).toUpperCase() + topic.mastery_level.slice(1)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-emerald-600 h-2 rounded-full" 
            style={{ width: `${topic.accuracy_percentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Accuracy: {topic.accuracy_percentage}%</span>
          <span>{topic.questions_attempted} questions</span>
        </div>
      </div>
    );
  }