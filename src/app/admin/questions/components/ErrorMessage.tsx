// src/app/admin/questions/components/ErrorMessage.tsx
type ErrorMessageProps = {
    message: string;
  };
  
  export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
        <p>{message}</p>
      </div>
    );
  };
  