// File: src/app/practice/hooks/useSubjects.ts
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Subject } from '../types';
import { logger } from '@/lib/logger';

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = new Error('Failed to fetch subjects');
    error.name = 'FetchError';
    throw error;
  }
  
  const data = await response.json();
  return data.data || [];
};

export function useSubjects(subjectParam?: string | null) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  
  // Use SWR for fetching subjects with stale-while-revalidate pattern
  const { 
    data: subjects = [], 
    error: fetchError, 
    isLoading,
    mutate 
  } = useSWR<Subject[]>(
    '/api/subjects?isActive=true', 
    fetcher, 
    {
      revalidateOnFocus: false, // Don't revalidate when window gets focus
      revalidateIfStale: true,  // Revalidate if data is stale
      dedupingInterval: 60000,  // Deduplicate requests with the same key for 60 seconds
      errorRetryCount: 3,       // Retry 3 times on error
      onError: (err) => {
        logger.error('Error fetching subjects', {
          error: err instanceof Error ? err.message : String(err),
          context: 'useSubjects'
        });
      }
    }
  );

  // Error state derived from SWR error
  const error = fetchError ? 
    'Failed to load subjects. Please try again.' : 
    null;

  // Match subject from URL parameter to fetched subjects
  useEffect(() => {
    if (subjects.length > 0 && subjectParam) {
      const matchedSubject = subjects.find(
        (s) =>
          s.subject_name.toLowerCase() === subjectParam ||
          s.subject_code.toLowerCase() === subjectParam
      );
      
      if (matchedSubject) {
        setSelectedSubject(matchedSubject);
      } else {
        logger.warn(`Subject "${subjectParam}" not found`, { context: 'useSubjects' });
      }
    }
  }, [subjects, subjectParam]);

  // Function to reload subjects data
  const reloadSubjects = () => {
    mutate(); // Trigger a revalidation of the data
  };

  return { 
    subjects, 
    selectedSubject, 
    setSelectedSubject, 
    loading: isLoading, 
    error,
    reloadSubjects // New function to reload data
  };
}