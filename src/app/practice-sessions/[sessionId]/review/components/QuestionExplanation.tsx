interface QuestionExplanationProps {
  explanation: string | null;
}

export default function QuestionExplanation({ explanation }: QuestionExplanationProps) {
  if (!explanation) {
    return null; // or return a placeholder like: <div>No explanation available</div>
  }

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Explanation</h3>
      <div className="prose dark:prose-invert max-w-none prose-a:text-blue-600 dark:prose-a:text-blue-400" 
           dangerouslySetInnerHTML={{ __html: explanation }} 
      />
    </div>
  );
}