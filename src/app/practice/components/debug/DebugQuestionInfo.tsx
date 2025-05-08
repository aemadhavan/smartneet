// src/app/practice/components/debug/DebugQuestionInfo.tsx
// This component can be conditionally included only in development environments

import { useState } from 'react';
import { Question } from '@/app/practice/types';

interface DebugQuestionInfoProps {
  question: Question;
  selectedOption: string | null;
}

export function DebugQuestionInfo({ question, selectedOption }: DebugQuestionInfoProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Only render in development environment
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  // Helper to parse details if they're stored as a string
  const parseDetails = (details: string | any): any => {
    if (typeof details === 'string') {
      try {
        return JSON.parse(details);
      } catch (e) {
        return { error: 'Invalid JSON', raw: details };
      }
    }
    return details;
  };
  
  const details = parseDetails(question.details);
  
  // Find the correct option
  const findCorrectOption = () => {
    if (!details || !details.options) return 'Unknown';
    
    const correctOption = details.options.find((opt: any) => opt.is_correct);
    if (correctOption) {
      return `${correctOption.option_number} - ${correctOption.option_text}`;
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