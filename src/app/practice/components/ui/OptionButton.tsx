// File: src/app/practice/components/ui/OptionButton.tsx
interface OptionButtonProps {
  option: {
    option_number: string;
    option_text: string;
  };
  isSelected: boolean;
  onClick: () => void;
}

export function OptionButton({ option, isSelected, onClick }: OptionButtonProps) {
  return (
    <div
      className={`border rounded-md p-4 cursor-pointer ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900 dark:border-indigo-400'
          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start">
        <span className="font-medium mr-2 text-gray-900 dark:text-gray-100">
          {option.option_number.toUpperCase()}.
        </span>
        <div 
          className="text-gray-800 dark:text-gray-100"
          dangerouslySetInnerHTML={{ __html: option.option_text }} 
        />
      </div>
    </div>
  );
}