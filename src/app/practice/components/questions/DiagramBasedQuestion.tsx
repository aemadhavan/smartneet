// File: src/app/practice/components/questions/DiagramBasedQuestion.tsx
import { OptionButton, DiagramDisplay } from '@/app/practice/components/ui';
import { QuestionOption } from '@/app/practice/types';
import { normalizeDiagramBasedDetails, extractDiagramLabelsFromText } from '@/app/practice/utils/questionUtils';

interface DiagramBasedQuestionProps {
  details: string | Record<string, unknown>;
  imageUrl?: string | null;
  questionText?: string;
  selectedOption: string | null;
  onOptionSelect: (option: string) => void;
}

export function DiagramBasedQuestion({ 
  details, 
  imageUrl,
  questionText = '',
  selectedOption, 
  onOptionSelect 
}: DiagramBasedQuestionProps) {
  // Debug the inputs to help diagnose issues
  console.log('DiagramBasedQuestion inputs:', { 
    hasDetails: !!details, 
    imageUrl,
    questionTextLength: questionText?.length
  });

  // Generate a default image URL for certain question types if one is not provided
  // This is a fallback mechanism for questions that should have images but don't
  const generateDefaultImageUrl = () => {
    if (!imageUrl && questionText) {
      // For cell component questions
      if (questionText.toLowerCase().includes('component') && 
          (questionText.toLowerCase().includes('cell') || 
           questionText.toLowerCase().includes('wall'))) {
        return '/images/diagrams/cell-components.jpg';
      }
      
      // For seed questions
      if (questionText.toLowerCase().includes('seed')) {
        return '/images/diagrams/seed-structure.jpg';
      }
    }
    
    return null;
  };

  // Try to use the provided imageUrl, or fall back to a generated one
  const effectiveImageUrl = imageUrl || generateDefaultImageUrl();
  
  // Normalize details to ensure they're in the correct format
  const normalizedDetails = normalizeDiagramBasedDetails(details, effectiveImageUrl, questionText);
  
  // Check if normalization was successful
  if (!normalizedDetails || !normalizedDetails.diagram_url || !Array.isArray(normalizedDetails.options)) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-md border border-yellow-200 dark:border-yellow-700">
        <p className="text-yellow-700 dark:text-yellow-200">Invalid diagram question details format.</p>
        <pre className="mt-2 text-xs overflow-auto max-h-40 bg-gray-100 dark:bg-gray-800 p-2 rounded text-gray-800 dark:text-gray-200">
          {JSON.stringify(details, null, 2)}
        </pre>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Image URL: {imageUrl || 'Not provided'}</p>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Question type: Diagram-based</p>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Question text preview: {questionText?.substring(0, 100)}...</p>
      </div>
    );
  }

  // If questionText is provided and labels aren't already in the details, try to extract them
  let labels = normalizedDetails.labels;
  if (questionText && (!labels || labels.length === 0) && typeof extractDiagramLabelsFromText === 'function') {
    try {
      const extractedLabels = extractDiagramLabelsFromText(questionText);
      if (extractedLabels && extractedLabels.length > 0) {
        labels = extractedLabels;
      }
    } catch (e) {
      console.error('Error extracting labels from question text:', e);
    }
  }

  // For cell component questions, add default labels if none were extracted
  if (questionText && (!labels || labels.length === 0) && 
      questionText.toLowerCase().includes('component') && 
      questionText.toLowerCase().includes('wall')) {
    labels = [
      { label_id: 'A', label_text: 'Cell Wall' },
      { label_id: 'B', label_text: 'Cell Membrane' },
      { label_id: 'C', label_text: 'Cytoplasm' },
      { label_id: 'D', label_text: 'Vacuole' }
    ];
  }

  return (
    <div>
      {normalizedDetails.diagram_details?.description && (
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          {normalizedDetails.diagram_details.description}
        </p>
      )}
      <div className="mb-6">
        {/* Use our reusable DiagramDisplay component */}
        <DiagramDisplay 
          imageUrl={normalizedDetails.diagram_url}
          labels={labels}
          altText="Question diagram"
        />
      </div>
      
      {/* Answer options */}
      <div className="space-y-3">
        {normalizedDetails.options.map((option: QuestionOption, index: number) => (
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
