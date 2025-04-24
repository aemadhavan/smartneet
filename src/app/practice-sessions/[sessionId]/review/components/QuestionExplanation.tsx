interface QuestionExplanationProps {
    explanation: string;
  }
  
  export default function QuestionExplanation({ explanation }: QuestionExplanationProps) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Explanation</h3>
        <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
          {explanation || "No explanation available for this question."}
        </div>
      </div>
    );
  }