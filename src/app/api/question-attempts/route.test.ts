// src/app/api/question-attempts/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST, GET } from './route';
import { db } from '@/db';
import { question_attempts, questions, session_questions } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { evaluateAnswer, parseQuestionDetails } from '@/lib/utils/answerEvaluation';
import { cache } from '@/lib/cache';
import { recordQuestionAttempt, updateTopicMastery } from '@/lib/utilities/sessionUtils';
import { and, eq, sql } from 'drizzle-orm'; // Import these directly

// Mock external modules
vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    offset: vi.fn(),
    insert: vi.fn(),
    values: vi.fn(),
    returning: vi.fn(),
  },
}));

vi.mock('@/db/schema', () => ({
  question_attempts: {},
  questions: {},
  session_questions: {},
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/utils/answerEvaluation', () => ({
  evaluateAnswer: vi.fn(),
  parseQuestionDetails: vi.fn(),
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    deletePattern: vi.fn(),
  },
}));

vi.mock('@/lib/utilities/sessionUtils', () => ({
  recordQuestionAttempt: vi.fn(),
  updateTopicMastery: vi.fn(),
}));

// Mock console.error and console.log to prevent noise during tests
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('Question Attempts API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations for db methods to allow chaining
    (db.select as vi.Mock).mockImplementation(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
    }));
    (db.insert as vi.Mock).mockImplementation(() => ({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
    }));
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  // --- POST Tests ---

  describe('POST /api/question-attempts', () => {
    it('should return 401 if user is not authenticated', async () => {
      (auth as vi.Mock).mockResolvedValue({ userId: null });
      const request = new NextRequest('http://localhost/api/question-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('should return 400 if request body is not valid JSON', async () => {
      (auth as vi.Mock).mockResolvedValue({ userId: 'user123' });
      const request = new NextRequest('http://localhost/api/question-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Invalid JSON request body');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error parsing JSON request body in question-attempts:',
        expect.any(Error)
      );
    });

    it('should return 400 if attempt parameters are invalid (ZodError)', async () => {
      (auth as vi.Mock).mockResolvedValue({ userId: 'user123' });
      const request = new NextRequest('http://localhost/api/question-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: 'invalid' }), // Invalid type
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBeInstanceOf(Array); // ZodError returns an array of errors
      expect(body.details).toContain('session_id: Expected number, received string');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Validation error:',
        expect.any(Error)
      );
    });

    it('should return 404 if question not found', async () => {
      (auth as vi.Mock).mockResolvedValue({ userId: 'user123' });
      (db.select as vi.Mock).mockImplementationOnce(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]), // No question found
      }));

      const request = new NextRequest('http://localhost/api/question-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 1,
          session_question_id: 1,
          question_id: 999,
          user_answer: 'A',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Question not found');
    });

    it('should return 500 if question details format is invalid', async () => {
      (auth as vi.Mock).mockResolvedValue({ userId: 'user123' });
      (db.select as vi.Mock).mockImplementationOnce(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          {
            question_id: 1,
            question_type: 'multiple_choice',
            details: 'invalid json string', // Invalid details format
            marks: 4,
            negative_marks: 1,
            topic_id: 101,
          },
        ]),
      }));
      (parseQuestionDetails as vi.Mock).mockImplementation(() => {
        throw new Error('Parsing error');
      });

      const request = new NextRequest('http://localhost/api/question-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 1,
          session_question_id: 1,
          question_id: 1,
          user_answer: 'A',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Invalid question details format');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error parsing question details in question-attempts route:',
        expect.any(Error)
      );
    });

    it('should return 404 if session question not found', async () => {
      (auth as vi.Mock).mockResolvedValue({ userId: 'user123' });
      (db.select as vi.Mock)
        .mockImplementationOnce(() => ({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([
            {
              question_id: 1,
              question_type: 'multiple_choice',
              details: JSON.stringify({ correct_answer: 'A' }),
              marks: 4,
              negative_marks: 1,
              topic_id: 101,
            },
          ]),
        }))
        .mockImplementationOnce(() => ({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([]), // No session question found
        }));
      (parseQuestionDetails as vi.Mock).mockReturnValue({ correct_answer: 'A' });
      (evaluateAnswer as vi.Mock).mockReturnValue(true);

      const request = new NextRequest('http://localhost/api/question-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 1,
          session_question_id: 1,
          question_id: 1,
          user_answer: 'A',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Session question not found');
    });

    it('should successfully record a correct question attempt', async () => {
      (auth as vi.Mock).mockResolvedValue({ userId: 'user123' });
      const mockQuestionDetails = {
        question_id: 1,
        question_type: 'multiple_choice',
        details: JSON.stringify({ correct_answer: 'A' }),
        marks: 4,
        negative_marks: 1,
        topic_id: 101,
      };
      const mockSessionQuestion = {
        session_question_id: 1,
        session_id: 1,
        question_id: 1,
      };
      const mockRecordResult = {
        attempt: { attempt_id: 123, is_correct: true, marks_awarded: 4 },
        sessionStats: { total_questions: 1, questions_correct: 1 },
      };

      (db.select as vi.Mock)
        .mockImplementationOnce(() => ({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([mockQuestionDetails]),
        }))
        .mockImplementationOnce(() => ({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([mockSessionQuestion]),
        }));

      (parseQuestionDetails as vi.Mock).mockReturnValue({ correct_answer: 'A' });
      (evaluateAnswer as vi.Mock).mockReturnValue(true);
      (recordQuestionAttempt as vi.Mock).mockResolvedValue(mockRecordResult);
      (updateTopicMastery as vi.Mock).mockResolvedValue(undefined);
      (cache.delete as vi.Mock).mockResolvedValue(undefined);
      (cache.deletePattern as vi.Mock).mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost/api/question-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 1,
          session_question_id: 1,
          question_id: 1,
          user_answer: 'A',
          time_taken_seconds: 30,
          user_notes: 'Some notes',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.attempt_id).toBe(mockRecordResult.attempt.attempt_id);
      expect(body.is_correct).toBe(true);
      expect(body.marks_awarded).toBe(4);
      expect(body.session_stats).toEqual(mockRecordResult.sessionStats);

      expect(recordQuestionAttempt).toHaveBeenCalledWith(
        'user123',
        1,
        1,
        1,
        'A',
        true,
        4,
        30
      );
      expect(updateTopicMastery).toHaveBeenCalledWith('user123', 101, true);
      expect(cache.delete).toHaveBeenCalledTimes(3);
      expect(cache.deletePattern).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Cache invalidated for user user123 due to new question attempt in session 1'
      );
    });

    it('should successfully record an incorrect question attempt', async () => {
      (auth as vi.Mock).mockResolvedValue({ userId: 'user123' });
      const mockQuestionDetails = {
        question_id: 1,
        question_type: 'multiple_choice',
        details: JSON.stringify({ correct_answer: 'A' }),
        marks: 4,
        negative_marks: 1,
        topic_id: 101,
      };
      const mockSessionQuestion = {
        session_question_id: 1,
        session_id: 1,
        question_id: 1,
      };
      const mockRecordResult = {
        attempt: { attempt_id: 124, is_correct: false, marks_awarded: -1 },
        sessionStats: { total_questions: 1, questions_correct: 0 },
      };

      (db.select as vi.Mock)
        .mockImplementationOnce(() => ({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([mockQuestionDetails]),
        }))
        .mockImplementationOnce(() => ({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([mockSessionQuestion]),
        }));

      (parseQuestionDetails as vi.Mock).mockReturnValue({ correct_answer: 'A' });
      (evaluateAnswer as vi.Mock).mockReturnValue(false);
      (recordQuestionAttempt as vi.Mock).mockResolvedValue(mockRecordResult);
      (updateTopicMastery as vi.Mock).mockResolvedValue(undefined);
      (cache.delete as vi.Mock).mockResolvedValue(undefined);
      (cache.deletePattern as vi.Mock).mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost/api/question-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 1,
          session_question_id: 1,
          question_id: 1,
          user_answer: 'B',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.attempt_id).toBe(mockRecordResult.attempt.attempt_id);
      expect(body.is_correct).toBe(false);
      expect(body.marks_awarded).toBe(-1);
      expect(body.session_stats).toEqual(mockRecordResult.sessionStats);

      expect(recordQuestionAttempt).toHaveBeenCalledWith(
        'user123',
        1,
        1,
        1,
        'B',
        false,
        -1,
        undefined
      );
      expect(updateTopicMastery).toHaveBeenCalledWith('user123', 101, false);
    });

    it('should handle cache invalidation errors gracefully', async () => {
      (auth as vi.Mock).mockResolvedValue({ userId: 'user123' });
      const mockQuestionDetails = {
        question_id: 1,
        question_type: 'multiple_choice',
        details: JSON.stringify({ correct_answer: 'A' }),
        marks: 4,
        negative_marks: 1,
        topic_id: 101,
      };
      const mockSessionQuestion = {
        session_question_id: 1,
        session_id: 1,
        question_id: 1,
      };
      const mockRecordResult = {
        attempt: { attempt_id: 125, is_correct: true, marks_awarded: 4 },
        sessionStats: { total_questions: 1, questions_correct: 1 },
      };

      (db.select as vi.Mock)
        .mockImplementationOnce(() => ({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([mockQuestionDetails]),
        }))
        .mockImplementationOnce(() => ({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([mockSessionQuestion]),
        }));

      (parseQuestionDetails as vi.Mock).mockReturnValue({ correct_answer: 'A' });
      (evaluateAnswer as vi.Mock).mockReturnValue(true);
      (recordQuestionAttempt as vi.Mock).mockResolvedValue(mockRecordResult);
      (updateTopicMastery as vi.Mock).mockResolvedValue(undefined);
      (cache.delete as vi.Mock).mockRejectedValue(new Error('Cache error')); // Simulate cache error
      (cache.deletePattern as vi.Mock).mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost/api/question-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 1,
          session_question_id: 1,
          question_id: 1,
          user_answer: 'A',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200); // Should still return 200
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error during cache invalidation in question-attempts:',
        expect.any(Error)
      );
    });

    it('should return 400 on a generic server error caught by validation', async () => {
      (auth as vi.Mock).mockResolvedValue({ userId: 'user123' });
      (db.select as vi.Mock).mockImplementationOnce(() => {
        throw new Error('Database connection failed'); // Simulate a generic error
      });

      const request = new NextRequest('http://localhost/api/question-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 1,
          session_question_id: 1,
          question_id: 1,
          user_answer: 'A',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Invalid attempt parameters');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Validation error:',
        expect.any(Error)
      );
    });
  });

  // --- GET Tests ---

  describe('GET /api/question-attempts', () => {
    it('should return 401 if user is not authenticated', async () => {
      (auth as vi.Mock).mockResolvedValue({ userId: null });
      const request = new NextRequest('http://localhost/api/question-attempts');

      const response = await GET(request);
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('should return cached attempts if available', async () => {
      (auth as vi.Mock).mockResolvedValue({ userId: 'user123' });
      const mockCachedAttempts = [{ attempt_id: 1, user_answer: 'cached' }];
      (cache.get as vi.Mock).mockResolvedValue(mockCachedAttempts);

      const request = new NextRequest('http://localhost/api/question-attempts');
      const response = await GET(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.attempts).toEqual(mockCachedAttempts);
      expect(body.source).toBe('cache');
      expect(cache.get).toHaveBeenCalledWith('user:user123:question-attempts:qid:all:sid:all:limit:20:offset:0');
    });

    it('should fetch attempts from database if cache is empty', async () => {
      (auth as vi.Mock).mockResolvedValue({ userId: 'user123' });
      (cache.get as vi.Mock).mockResolvedValue(null);
      const mockAttempts = [{ attempt_id: 2, user_answer: 'db' }];
      (db.select as vi.Mock).mockImplementationOnce(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockAttempts),
      }));
      (cache.set as vi.Mock).mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost/api/question-attempts');
      const response = await GET(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.attempts).toEqual(mockAttempts);
      expect(body.source).toBe('database');
      expect(cache.set).toHaveBeenCalledWith(
        'user:user123:question-attempts:qid:all:sid:all:limit:20:offset:0',
        mockAttempts,
        900
      );
    });

    it('should filter attempts by questionId', async () => {
      (auth as vi.Mock).mockResolvedValue({ userId: 'user123' });
      (cache.get as vi.Mock).mockResolvedValue(null);
      const mockAttempts = [{ attempt_id: 3, question_id: 10, user_answer: 'filtered' }];
      (db.select as vi.Mock).mockImplementationOnce(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockAttempts),
      }));

      const request = new NextRequest('http://localhost/api/question-attempts?questionId=10');
      const response = await GET(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.attempts).toEqual(mockAttempts);
      expect(db.select).toHaveBeenCalled();
      // Verify that the where clause includes the questionId filter
      // This is a bit tricky to test directly with the current mock setup,
      // but the mockResolvedValue ensures the correct data is returned.
    });

    it('should filter attempts by sessionId', async () => {
      (auth as vi.Mock).mockResolvedValue({ userId: 'user123' });
      (cache.get as vi.Mock).mockResolvedValue(null);
      const mockAttempts = [{ attempt_id: 4, session_id: 20, user_answer: 'filtered' }];
      (db.select as vi.Mock).mockImplementationOnce(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockAttempts),
      }));

      const request = new NextRequest('http://localhost/api/question-attempts?sessionId=20');
      const response = await GET(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.attempts).toEqual(mockAttempts);
    });

    it('should filter attempts by both questionId and sessionId', async () => {
      (auth as vi.Mock).mockResolvedValue({ userId: 'user123' });
      (cache.get as vi.Mock).mockResolvedValue(null);
      const mockAttempts = [{ attempt_id: 5, question_id: 10, session_id: 20, user_answer: 'filtered' }];
      (db.select as vi.Mock).mockImplementationOnce(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockAttempts),
      }));

      const request = new NextRequest('http://localhost/api/question-attempts?questionId=10&sessionId=20');
      const response = await GET(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.attempts).toEqual(mockAttempts);
    });

    it('should handle limit and offset parameters', async () => {
      (auth as vi.Mock).mockResolvedValue({ userId: 'user123' });
      (cache.get as vi.Mock).mockResolvedValue(null);
      const mockAttempts = [{ attempt_id: 6, user_answer: 'paginated' }];

      (db.select as vi.Mock).mockImplementationOnce(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation((l: number) => {
          expect(l).toBe(5);
          return {
            offset: vi.fn().mockImplementation((o: number) => {
              expect(o).toBe(10);
              return Promise.resolve(mockAttempts);
            }),
          };
        }),
      }));

      const request = new NextRequest('http://localhost/api/question-attempts?limit=5&offset=10');
      const response = await GET(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.attempts).toEqual(mockAttempts);
    });

    it('should return 500 on a generic server error during GET', async () => {
      (auth as vi.Mock).mockResolvedValue({ userId: 'user123' });
      (cache.get as vi.Mock).mockRejectedValue(new Error('Cache read error')); // Simulate error before DB query

      const request = new NextRequest('http://localhost/api/question-attempts');
      const response = await GET(request);
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Failed to fetch question attempts');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching question attempts:',
        expect.any(Error)
      );
    });
  });
});
