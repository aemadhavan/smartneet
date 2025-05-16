//File: src/app/practice-sessions/[sessionId]/review/components/questions/componentTypes.ts

/**
 * This file defines helper functions and types for question component data transformation.
 */

// Generic answer types to replace 'any'
export type GenericAnswer = string | number | boolean | object | string[] | null | undefined;

// Helper function to transform an answer to string | { selectedOption: string } format
export function formatUserAnswer(answer: GenericAnswer): string | { selectedOption: string } | null {
  if (answer === null || answer === undefined) return null;
  
  if (typeof answer === 'string') return answer;
  
  if (typeof answer === 'number') return String(answer);
  
  if (typeof answer === 'object') {
    // Handle arrays - common for sequence answers
    if (Array.isArray(answer)) {
      return { selectedOption: answer.join(',') };
    }
    
    // Handle objects with various property names
    const obj = answer as Record<string, unknown>;
    const selectedValue = obj.selectedOption || obj.selection || obj.option || '';
    return { selectedOption: String(selectedValue) };
  }
  
  return null;
}

// Helper function to transform an answer to string | { option: string } format
export function formatCorrectAnswer(answer: GenericAnswer): string | { option: string } | null {
  if (answer === null || answer === undefined) return null;
  
  if (typeof answer === 'string') return answer;
  
  if (typeof answer === 'number') return String(answer);
  
  if (typeof answer === 'object') {
    // Handle arrays - common for sequence answers
    if (Array.isArray(answer)) {
      return { option: answer.join(',') };
    }
    
    // Handle objects with various property names
    const obj = answer as Record<string, unknown>;
    const correctValue = obj.option || obj.correctOption || obj.selectedOption || '';
    return { option: String(correctValue) };
  }
  
  return null;
}