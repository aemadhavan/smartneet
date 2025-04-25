import { CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

// Define interfaces for different item formats
interface SequenceItem {
  key?: string;
  item_number?: number;
  item_text?: string;
  text?: string;
  [key: string]: unknown;
}

interface SequenceAnswerObject {
  selection?: string;
  option?: string;
  sequence?: string[];
  [key: string]: unknown;
}

interface OptionItem {
  option_number?: string;
  key?: string;
  option_text?: string;
  text?: string;
  is_correct?: boolean;
  isCorrect?: boolean;
}

interface QuestionAttempt {
  questionText?: string;
  details?: {
    options?: OptionItem[];
    sequence_items?: SequenceItem[];
    items?: SequenceItem[] | unknown[];
  } | null;
  isImageBased?: boolean | null | undefined;
  imageUrl?: string | null | undefined;
  userAnswer?: SequenceAnswerObject | string | null;
  correctAnswer?: SequenceAnswerObject | string | null;
}

interface SequenceOrderingProps {
  attempt: QuestionAttempt;
}

// Helper function to parse sequence strings like "E-C-A-D-B"
function parseSequenceString(sequenceStr: string | undefined): string[] {
  if (!sequenceStr) return [];
  return sequenceStr.split('-');
}

// Get sequence items from either sequence_items or items
function getSequenceItems(attempt: QuestionAttempt): { key: string; text: string }[] {
  // Check for sequence_items (from your JSON example)
  if (attempt?.details?.sequence_items && Array.isArray(attempt.details.sequence_items)) {
    return attempt.details.sequence_items.map(item => ({
      key: String(item.item_number || ''),
      text: item.item_text || ''
    }));
  }
  
  // Fallback to items 
  if (attempt?.details?.items && Array.isArray(attempt.details.items)) {
    return attempt.details.items.map((item, index) => {
      if (typeof item === 'object' && item !== null) {
        const typedItem = item as Record<string, unknown>;
        return {
          key: String(typedItem.key || typedItem.item_number || String.fromCharCode(65 + index)),
          text: String(typedItem.text || typedItem.item_text || `Item ${index + 1}`)
        };
      }
      return {
        key: String.fromCharCode(65 + index),
        text: String(item)
      };
    });
  }
  
  return [];
}

// Get the sequence from options (e.g., "E-C-A-D-B")
function getSequenceFromOption(options: OptionItem[], optionKey: string): string[] {
  if (!Array.isArray(options)) return [];
  
  const option = options.find(opt => 
    opt.option_number === optionKey || opt.key === optionKey
  );
  
  if (!option) return [];
  
  // Try to get the sequence string from option_text or text
  const sequenceStr = option.option_text || option.text;
  if (typeof sequenceStr === 'string' && sequenceStr.includes('-')) {
    return parseSequenceString(sequenceStr);
  }
  
  return [];
}

// Get user's sequence
function getUserSequence(attempt: QuestionAttempt): string[] {
  if (!attempt?.userAnswer) return [];
  
  // If userAnswer has a sequence property directly
  if (typeof attempt.userAnswer === 'object' && 
      attempt.userAnswer !== null && 
      attempt.userAnswer.sequence && 
      Array.isArray(attempt.userAnswer.sequence)) {
    return attempt.userAnswer.sequence;
  }
  
  // If userAnswer is a selection option like "a", "b", "c", etc.
  if (typeof attempt.userAnswer === 'object' && 
      attempt.userAnswer !== null && 
      (attempt.userAnswer.selection || attempt.userAnswer.option)) {
    const optionKey = attempt.userAnswer.selection || attempt.userAnswer.option;
    if (optionKey && attempt.details?.options) {
      return getSequenceFromOption(attempt.details.options, optionKey);
    }
  }
  
  // If userAnswer is a string option key
  if (typeof attempt.userAnswer === 'string' && attempt.details?.options) {
    return getSequenceFromOption(attempt.details.options, attempt.userAnswer);
  }
  
  return [];
}

// Get correct sequence
function getCorrectSequence(attempt: QuestionAttempt): string[] {
  if (!attempt?.correctAnswer) return [];
  
  // If correctAnswer has a sequence property directly
  if (typeof attempt.correctAnswer === 'object' && 
      attempt.correctAnswer !== null && 
      attempt.correctAnswer.sequence && 
      Array.isArray(attempt.correctAnswer.sequence)) {
    return attempt.correctAnswer.sequence;
  }
  
  // If correctAnswer is a selection option like "a", "b", "c", etc.
  if (typeof attempt.correctAnswer === 'object' && 
      attempt.correctAnswer !== null && 
      (attempt.correctAnswer.selection || attempt.correctAnswer.option)) {
    const optionKey = attempt.correctAnswer.selection || attempt.correctAnswer.option;
    if (optionKey && attempt.details?.options) {
      return getSequenceFromOption(attempt.details.options, optionKey);
    }
  }
  
  // If correctAnswer is a string option key
  if (typeof attempt.correctAnswer === 'string' && attempt.details?.options) {
    return getSequenceFromOption(attempt.details.options, attempt.correctAnswer);
  }
  
  // Try to find the correct option directly from options
  if (attempt.details?.options) {
    const correctOption = attempt.details.options.find(opt => 
      opt.is_correct === true || opt.isCorrect === true
    );
    
    if (correctOption) {
      const sequenceStr = correctOption.option_text || correctOption.text;
      if (typeof sequenceStr === 'string' && sequenceStr.includes('-')) {
        return parseSequenceString(sequenceStr);
      }
    }
  }
  
  return [];
}

// Find text description for a sequence item
function getItemDescription(sequenceItems: { key: string; text: string }[], key: string): string {
  const item = sequenceItems.find(item => item.key === key);
  return item?.text || `Item ${key}`;
}

export default function SequenceOrdering({ attempt }: SequenceOrderingProps) {
  // Get sequence items, user sequence, and correct sequence
  const sequenceItems = getSequenceItems(attempt);
  const userSequence = getUserSequence(attempt);
  const correctSequence = getCorrectSequence(attempt);
  
  // Render nothing if no attempt data
  if (!attempt) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
        {attempt.questionText ?? 'No question text available'}
      </div>
      
      {attempt.isImageBased && attempt.imageUrl && (
        <div className="my-4">
          <Image 
            src={attempt.imageUrl} 
            alt="Question diagram" 
            className="max-w-full max-h-96 mx-auto border border-gray-200 dark:border-gray-700 rounded-md"
            width={500}
            height={300}
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        </div>
      )}
      
      <div className="mt-4">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Your Sequence:</h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {userSequence.map((itemKey, idx) => {
            const correctPositionIndex = correctSequence.indexOf(itemKey);
            const isCorrectPosition = correctPositionIndex === idx;
            
            return (
              <div
                key={idx}
                className={`relative p-3 rounded-md border-2 ${
                  isCorrectPosition
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                }`}
              >
                <div className="flex items-center">
                  <div className="mr-2 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-800 dark:text-gray-200">
                    {idx + 1}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {getItemDescription(sequenceItems, itemKey)}
                  </p>
                  <div className="ml-2">
                    {isCorrectPosition ? (
                      <CheckCircle className="text-green-600 dark:text-green-400" size={18} />
                    ) : (
                      <XCircle className="text-red-600 dark:text-red-400" size={18} />
                    )}
                  </div>
                </div>
                {!isCorrectPosition && correctPositionIndex !== -1 && (
                  <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                    Correct position: {correctPositionIndex + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Correct Sequence:</h3>
        <div className="flex flex-wrap gap-2">
          {correctSequence.map((itemKey, idx) => {
            return (
              <div
                key={idx}
                className="p-3 rounded-md border-2 bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
              >
                <div className="flex items-center">
                  <div className="mr-2 w-6 h-6 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center text-green-800 dark:text-green-200">
                    {idx + 1}
                  </div>
                  <p className="text-green-800 dark:text-green-300">
                    {getItemDescription(sequenceItems, itemKey)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}