// File: src/app/practice/hooks/useQuestionDetails.ts
import { useState, useEffect } from 'react';
import { Question, QuestionDetails, QuestionType } from '../types';

export function useQuestionDetails(question: Question) {
  const [details, setDetails] = useState<QuestionDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validate details structure based on question type
  const validateDetails = (parsedDetails: any, questionType: QuestionType): boolean => {
    switch (questionType) {
      case 'MultipleChoice':
        return Array.isArray(parsedDetails.options);
      case 'Matching':
        return Array.isArray(parsedDetails.items) && Array.isArray(parsedDetails.options);
      case 'AssertionReason':
      case 'MultipleCorrectStatements':
        return Array.isArray(parsedDetails.statements) && Array.isArray(parsedDetails.options);
      case 'SequenceOrdering':
        return Array.isArray(parsedDetails.sequence_items) && Array.isArray(parsedDetails.options);
      case 'DiagramBased':
        return parsedDetails.diagram_url && Array.isArray(parsedDetails.options);
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
      let parsedDetails: any;
      
      if (typeof question.details === 'string') {
        // Try to parse the details if it's a string
        parsedDetails = JSON.parse(question.details);
        // Handle double-encoded JSON (happens sometimes)
        parsedDetails = typeof parsedDetails === 'string' ? JSON.parse(parsedDetails) : parsedDetails;
      } else {
        // If it's already an object, use it directly
        parsedDetails = question.details;
      }
      
      // Validate the structure based on question type
      if (validateDetails(parsedDetails, question.question_type)) {
        setDetails(parsedDetails);
        setError(null);
      } else {
        console.error('Invalid question details structure for type:', question.question_type);
        setError(`Invalid structure for ${question.question_type} question type`);
        setDetails(parsedDetails); // Still set details so we can display whatever we have
      }
    } catch (e) {
      console.error('Failed to parse question details:', e);
      setError('Failed to parse question details');
      setDetails(null);
    }
  }, [question]);

  return { details, error };
}