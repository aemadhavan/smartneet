// File: src/app/practice/hooks/useSubjects.ts
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Subject } from '../types';
import { logger } from '@/lib/logger';

// Fetcher function for SWR with improved error handling
const fetcher = async (url: string) => {
  try {
    const response = await fetch(url, {
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(15000) // Reduced to 15 second timeout for faster failover
    });
    
    if (!response.ok) {
      // Parse error response for better error messages
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 503) {
        const error = new Error('Service temporarily unavailable. Please try again in a moment.');
        error.name = 'ServiceUnavailable';
        throw error;
      }
      
      if (response.status >= 500) {
        const error = new Error('Server error occurred. Please try again later.');
        error.name = 'ServerError';
        throw error;
      }
      
      const error = new Error(errorData.error || 'Failed to fetch subjects');
      error.name = 'FetchError';
      throw error;
    }
    
    const data = await response.json();
    
    // Handle fallback data from API
    if (data.fallback) {
      logger.warn('Received fallback data due to connection issues', { 
        context: 'useSubjects',
        data: { source: data.source }
      });
    }
    
    return data.data || [];
  } catch (error) {
    // Handle network errors specifically
    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutError = new Error('Request timed out. Please check your connection and try again.');
      timeoutError.name = 'TimeoutError';
      throw timeoutError;
    }
    
    if (error instanceof Error && error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError = new Error('Network connection failed. Please check your internet connection.');
      networkError.name = 'NetworkError';
      throw networkError;
    }
    
    throw error;
  }
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

  // Error state derived from SWR error with specific messaging
  const error = fetchError ? 
    (fetchError.message || 'Failed to load subjects. Please try again.') : 
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