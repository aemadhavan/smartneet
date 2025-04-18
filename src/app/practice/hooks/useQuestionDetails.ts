// File: src/app/practice/hooks/useQuestionDetails.ts
import { useState, useEffect } from 'react';
import { 
  Question, 
  QuestionDetails, 
  QuestionType
} from '@/app/practice/types';

export function useQuestionDetails(question: Question) {
  const [details, setDetails] = useState<QuestionDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validate details structure based on question type
  const validateDetails = (parsedDetails: unknown, questionType: QuestionType): boolean => {
    // Basic type guard to ensure we're dealing with an object
    if (!parsedDetails || typeof parsedDetails !== 'object' || parsedDetails === null) {
      return false;
    }
    
    // Type assertion to allow property access (after we've checked it's an object)
    const detailsObj = parsedDetails as Record<string, unknown>;
    
    switch (questionType) {
      case 'MultipleChoice':
        return Array.isArray(detailsObj.options);
      case 'Matching':
        return Array.isArray(detailsObj.items) && Array.isArray(detailsObj.options);
      case 'AssertionReason':
      case 'MultipleCorrectStatements':
        return Array.isArray(detailsObj.statements) && Array.isArray(detailsObj.options);
      case 'SequenceOrdering':
        return Array.isArray(detailsObj.sequence_items) && Array.isArray(detailsObj.options);
      case 'DiagramBased':
        return Boolean(detailsObj.diagram_url) && Array.isArray(detailsObj.options);
      default:
        return false;
    }
  };

  useEffect(() => {
    if (!question || !question.details) {
      setDetails(null);
      return;
    }

    try {
      let parsedDetails: unknown;
      
      if (typeof question.details === 'string') {
        // Try to parse the details if it's a string
        parsedDetails = JSON.parse(question.details);
        // Handle double-encoded JSON (happens sometimes)
        if (typeof parsedDetails === 'string') {
          parsedDetails = JSON.parse(parsedDetails);
        }
      } else {
        // If it's already an object, use it directly
        parsedDetails = question.details;
      }
      
      // Validate the structure based on question type
      if (validateDetails(parsedDetails, question.question_type)) {
        // We've validated the structure matches what we expect, so safe to cast
        setDetails(parsedDetails as QuestionDetails);
        setError(null);
      } else {
        console.error('Invalid question details structure for type:', question.question_type);
        setError(`Invalid structure for ${question.question_type} question type`);
        // Cast to QuestionDetails but we know it might not be fully valid
        setDetails(parsedDetails as QuestionDetails); 
      }
    } catch (e) {
      console.error('Failed to parse question details:', e);
      setError('Failed to parse question details');
      setDetails(null);
    }
  }, [question]);

  return { details, error };
}