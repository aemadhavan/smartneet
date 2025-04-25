// File: src/hooks/useTypeData.ts
import { useMemo } from 'react';
import { QuestionTypeData } from '@/types/dashboard';

interface UseTypeDataResult {
  data: QuestionTypeData[];
  colors: string[];
}

/**
 * Custom hook to derive chart data for question types
 * @param {QuestionTypeData[]} data - Raw question type data
 * @returns {UseTypeDataResult} Processed data and helper functions
 */
export const useTypeData = (data: QuestionTypeData[]): UseTypeDataResult => {
  const pieColors = useMemo(() => [
    '#10b981', // emerald-500
    '#6366f1', // indigo-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6'  // violet-500
  ], []);

  const defaultData = useMemo((): QuestionTypeData[] => [
    { name: 'Multiple Choice', value: 65 },
    { name: 'Multiple Correct', value: 15 },
    { name: 'Assertion-Reason', value: 10 },
    { name: 'Matching', value: 5 },
    { name: 'Sequence', value: 5 }
  ], []);

  // Use provided data or default if empty
  const processedData = useMemo(() => {
    return data && data.length > 0 ? data : defaultData;
  }, [data, defaultData]);

  return {
    data: processedData,
    colors: pieColors
  };
};