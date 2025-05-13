// src/app/practice/components/debug/DebugQuestionInfo.tsx
// This component can be conditionally included only in development environments

import { useState } from 'react';
// Import the actual types from the project
import { 
  Question, 
  QuestionDetails, 
  MultipleChoiceOption,
  MatchingItem,
  Statement,
  SequenceItem
  // DiagramLabel, // Removed as it's no longer directly used after changing labels to unknown[]
  // QuestionOption, // Not strictly needed as parseDetails maps to MultipleChoiceOption
} from '../../types';

interface DebugQuestionInfoProps {
  question: Question;
  selectedOption: string | null;
}

// Explicitly define all possible properties for ParsedQuestionDetails
// to satisfy TypeScript and strict linting rules without an index signature.
interface ParsedQuestionDetails {
  // Common fields for parsing status
  error?: string;
  raw?: string;

  // Properties from MultipleChoiceDetails (and other detail types after parsing)
  // parseDetails ensures options are mapped to MultipleChoiceOption[]
  options?: MultipleChoiceOption[];

  // Properties from MatchingDetails
  items?: MatchingItem[];
  left_column_header?: string;
  right_column_header?: string;

  // Properties from AssertionReasonDetails & MultipleCorrectStatementsDetails
  statements?: Statement[];

  // Properties from SequenceOrderingDetails
  sequence_items?: SequenceItem[];
  
  // Properties from DiagramBasedDetails
  diagram_url?: string;
  labels?: unknown[]; // Changed DiagramLabel[] to unknown[] to attempt to satisfy linter
  
  // Dynamically added properties often found in parsed details for correct answer
  correctAnswer?: string | number;
  correct_option?: string | number;
}

export function DebugQuestionInfo({ question, selectedOption }: DebugQuestionInfoProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Only render in development environment
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  // Helper to parse details with type safety
  const parseDetails = (details: string | QuestionDetails): ParsedQuestionDetails => {
    // If details is already an object, return it
    if (typeof details !== 'string') {
      return details as ParsedQuestionDetails;
    }

    try {
      // Try parsing the string as JSON
      const parsedDetails = JSON.parse(details) as Record<string, unknown>;
      
      // Ensure it has the expected structure
      if (typeof parsedDetails === 'object' && parsedDetails !== null) {
        // Since we're using imported types, we need to be careful with option mapping
        if (Array.isArray(parsedDetails.options)) {
          // Map the options according to the existing type structure
          const typedOptions = parsedDetails.options.map(opt => {
            const option = opt as Record<string, unknown>;
            // Only include the properties that exist in the actual MultipleChoiceOption type
            return {
              option_number: option.option_number?.toString() || '',
              option_text: option.option_text?.toString() || ''
              // Note: is_correct is not included because the error suggests it doesn't exist in the actual type
            } as MultipleChoiceOption;
          });
          
          // Assign back to parsedDetails
          parsedDetails.options = typedOptions;
        }
        
        return parsedDetails as ParsedQuestionDetails;
      }
      
      // If parsing fails or results in invalid structure
      return { 
        error: 'Invalid JSON structure', 
        raw: details 
      } as ParsedQuestionDetails;
    } catch {
      // If JSON parsing fails
      return { 
        error: 'Invalid JSON', 
        raw: details 
      } as ParsedQuestionDetails;
    }
  };
  
  const details = parseDetails(question.details);
  
  // Find the correct option - adapted to work with the actual type structure
  const findCorrectOption = (): string => {
    if (!details?.options || !Array.isArray(details.options)) return 'Unknown';
    
    // correctAnswer and correct_option are now optional properties on ParsedQuestionDetails
    // Their types are (string | number | undefined)
    const correctOptionNumber = details.correctAnswer || details.correct_option;
    
    if (correctOptionNumber !== undefined) { 
      const foundOption = details.options.find(opt => 
        opt.option_number === String(correctOptionNumber)
      );
      
      if (foundOption) {
        return `${foundOption.option_number} - ${foundOption.option_text}`;
      }
    }
    
    return 'Unknown';
  };
  
  return (
    <div className="mt-4 p-4 border border-yellow-300 bg-yellow-50 rounded-md text-sm">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="text-yellow-700 font-medium mb-2 flex items-center"
      >
        {isOpen ? '▼' : '▶'} Debug Question Info {isOpen ? '(Click to hide)' : '(Click to show)'}
      </button>
      
      {isOpen && (
        <div className="text-gray-800 space-y-4">
          <div>
            <strong>Question ID:</strong> {question.question_id}
          </div>
          
          <div>
            <strong>Question Type:</strong> {question.question_type}
          </div>
          
          <div>
            <strong>Selected Option:</strong> {selectedOption || 'None'}
          </div>
          
          <div>
            <strong>Correct Option:</strong> {findCorrectOption()}
          </div>
          
          <div>
            <details>
              <summary className="cursor-pointer text-blue-600">View Question Details JSON</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs max-h-60">
                {JSON.stringify(details, null, 2)}
              </pre>
            </details>
          </div>
          
          <div className="pt-2 border-t border-yellow-200">
            <p className="font-medium text-yellow-800">Answer Debug Guide:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>Confirm the selected option matches what you clicked</li>
              <li>Verify the correct option matches the expected answer</li>
              <li>Check that option numbers are consistent throughout</li>
              <li>Ensure option formats (string vs number) are consistent</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
