// File: src/app/practice/components/questions/DiagramBasedQuestion.tsx
import { OptionButton, DiagramDisplay } from '@/app/practice/components/ui';
import { DiagramBasedDetails, QuestionOption } from '@/app/practice/types';

interface DiagramBasedQuestionProps {
  details: DiagramBasedDetails;
  selectedOption: string | null;
  onOptionSelect: (option: string) => void;
}

export function DiagramBasedQuestion({ 
  details, 
  selectedOption, 
  onOptionSelect 
}: DiagramBasedQuestionProps) {
  // Check if details has the expected structure
  if (!details || !details.diagram_url || !Array.isArray(details.options)) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
        <p className="text-yellow-700">Invalid diagram question details format.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        {/* Use our reusable DiagramDisplay component */}
        <DiagramDisplay 
          imageUrl={details.diagram_url}
          labels={details.labels}
          altText="Question diagram"
        />
      </div>
      
      {/* Answer options */}
      <div className="space-y-3">
        {details.options.map((option: QuestionOption, index: number) => (
          <OptionButton
            key={index}
            option={option}
            isSelected={selectedOption === option.option_number}
            onClick={() => onOptionSelect(option.option_number)}
          />
        ))}
      </div>
    </div>
  );
}