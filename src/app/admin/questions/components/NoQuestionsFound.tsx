
// src/app/admin/questions/components/NoQuestionsFound.tsx
export const NoQuestionsFound: React.FC = () => {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="text-yellow-700">No questions found with the current filters.</p>
      </div>
    );
  };