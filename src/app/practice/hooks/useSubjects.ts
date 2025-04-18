// File: src/app/practice/hooks/useSubjects.ts
import { useState, useEffect } from 'react';
import { Subject } from '../types';

export function useSubjects(subjectParam?: string | null) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Fetch available subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/subjects?isActive=true');
        if (!response.ok) {
          throw new Error('Failed to fetch subjects');
        }
        const data = await response.json();
        setSubjects(data.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects. Please try again.');
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  // Step 2: Match subject from URL parameter to fetched subjects
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
        setError(`Subject "${subjectParam}" not found. Please select a valid subject.`);
        setLoading(false);
      }
    } else if (subjects.length > 0 && !subjectParam) {
      setLoading(false);
    }
  }, [subjects, subjectParam]);

  return { subjects, selectedSubject, setSelectedSubject, loading, error };
}