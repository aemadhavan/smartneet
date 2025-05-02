// File: src/app/practice/components/ui/OptionButton.tsx
interface OptionButtonProps {
  option: {
    option_number?: string | number; // Make option_number optional and allow number
    option_text: string;
  };
  isSelected: boolean;
  onClick: () => void;
}

export function OptionButton({ option, isSelected, onClick }: OptionButtonProps) {
  // Convert option_number to string and uppercase, with fallback
  const optionLabel = option.option_number != null 
    ? String(option.option_number).toUpperCase() 
    : '';

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
        {optionLabel && (
          <span className="font-medium mr-2 text-gray-900 dark:text-gray-100">
            {optionLabel}.
          </span>
        )}
        <div 
          className="text-gray-800 dark:text-gray-100"
          dangerouslySetInnerHTML={{ __html: option.option_text }} 
        />
      </div>
    </div>
  );
}