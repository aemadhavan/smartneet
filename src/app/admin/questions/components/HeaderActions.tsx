// src/app/admin/questions/components/HeaderActions.tsx
type HeaderActionsProps = {
    onJsonUpload: () => void;
    onCreateQuestion: () => void;
    isQuestionCreationDisabled: boolean;
  };
  
  export const HeaderActions: React.FC<HeaderActionsProps> = ({
    onJsonUpload,
    onCreateQuestion,
    isQuestionCreationDisabled
  }) => {
    return (
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Questions Management</h1>
        <div className="flex space-x-4">
          <button 
            onClick={onJsonUpload}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add Questions from JSON
          </button>
          <button 
            onClick={onCreateQuestion}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={isQuestionCreationDisabled}
          >
            Add New Question
          </button>
        </div>
      </div>
    );
  };