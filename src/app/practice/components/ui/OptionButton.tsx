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
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-200 hover:bg-gray-50'
        }`}
        onClick={onClick}
      >
        <div className="flex items-start">
          <span className="font-medium mr-2">{option.option_number.toUpperCase()}.</span>
          <div dangerouslySetInnerHTML={{ __html: option.option_text }} />
        </div>
      </div>
    );
  }