import { NextRequest, NextResponse } from 'next/server';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { db } from '@/db';
import { cache } from '@/lib/cache';
import { eq, and, inArray } from 'drizzle-orm';
import { subtopics, topics } from '@/db/schema';

// Mock dependencies
vi.mock('@/db/schema', () => ({
  subtopics: {
    topic_id: 'subtopics.topic_id_column',
    is_active: 'subtopics.is_active_column',
  },
  topics: {
    topic_id: 'topics.topic_id_column',
    subject_id: 'topics.subject_id_column',
  },
}));

// Mocks for Drizzle's fluent API
const fromMock = vi.fn();
const whereMock = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(() => ({ from: fromMock })),
  },
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => `eq(${field}, ${value})`),
  inArray: vi.fn((field, values) => `inArray(${field}, [${values.join(',')}])`),
  and: vi.fn((...conditions) => `and(${conditions.join(', ')})`),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, init })),
  },
}));

const createMockRequest = (searchParams: Record<string, string> = {}) => {
  const url = new URL('http://localhost/api/subtopics');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return {
    nextUrl: {
      searchParams: url.searchParams,
    },
  } as NextRequest;
};

describe('GET /api/subtopics', () => {
  const mockAllSubtopics = [
    { id: 101, name: 'Subtopic 1.1', topic_id: 1, is_active: true },
    { id: 102, name: 'Subtopic 1.2', topic_id: 1, is_active: false },
    { id: 201, name: 'Subtopic 2.1', topic_id: 2, is_active: true },
  ];

  const mockTopicsForSubject1 = [{ topic_id: 1 }, { topic_id: 2 }];
  const mockTopicIdsForSubject1 = [1, 2];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Reset the global db mock to its simple state for most tests
    vi.mocked(db.select).mockReturnValue({ from: fromMock });
  });

  test('should return subtopics from cache when available', async () => {
    vi.mocked(cache.get).mockResolvedValue(mockAllSubtopics);
    const req = createMockRequest({ topicId: '1' });

    await GET(req);

    expect(cache.get).toHaveBeenCalledWith('api:subtopics:topicId:1:subjectId:undefined:isActive:undefined');
    expect(db.select).not.toHaveBeenCalled();
    expect(NextResponse.json).toHaveBeenCalledWith({ success: true, data: mockAllSubtopics, source: 'cache' }, { status: 200 });
  });

  test('should return all subtopics from DB when no filters are applied', async () => {
    vi.mocked(cache.get).mockResolvedValue(null);
    fromMock.mockResolvedValue(mockAllSubtopics); // No .where() call
    const req = createMockRequest();

    await GET(req);

    expect(fromMock).toHaveBeenCalledWith(subtopics);
    expect(whereMock).not.toHaveBeenCalled();
    expect(cache.set).toHaveBeenCalledWith('api:subtopics:topicId:undefined:subjectId:undefined:isActive:undefined', mockAllSubtopics, 1800);
    expect(NextResponse.json).toHaveBeenCalledWith({ success: true, data: mockAllSubtopics, source: 'database' }, { status: 200 });
  });

  test('should filter by topicId', async () => {
    const filteredSubtopics = mockAllSubtopics.filter(st => st.topic_id === 1);
    vi.mocked(cache.get).mockResolvedValue(null);
    fromMock.mockReturnValue({ where: whereMock });
    whereMock.mockResolvedValue(filteredSubtopics);
    const req = createMockRequest({ topicId: '1' });

    await GET(req);

    expect(whereMock).toHaveBeenCalledWith('and(eq(subtopics.topic_id_column, 1))');
    expect(eq).toHaveBeenCalledWith(subtopics.topic_id, 1);
    expect(cache.set).toHaveBeenCalledWith('api:subtopics:topicId:1:subjectId:undefined:isActive:undefined', filteredSubtopics, 1800);
  });

  test('should filter by isActive=true', async () => {
    const filteredSubtopics = mockAllSubtopics.filter(st => st.is_active);
    vi.mocked(cache.get).mockResolvedValue(null);
    fromMock.mockReturnValue({ where: whereMock });
    whereMock.mockResolvedValue(filteredSubtopics);
    const req = createMockRequest({ isActive: 'true' });

    await GET(req);

    expect(whereMock).toHaveBeenCalledWith('and(eq(subtopics.is_active_column, true))');
    expect(eq).toHaveBeenCalledWith(subtopics.is_active, true);
    expect(cache.set).toHaveBeenCalledWith('api:subtopics:topicId:undefined:subjectId:undefined:isActive:true', filteredSubtopics, 1800);
  });

  test('should filter by isActive=false', async () => {
    const filteredSubtopics = mockAllSubtopics.filter(st => !st.is_active);
    vi.mocked(cache.get).mockResolvedValue(null);
    fromMock.mockReturnValue({ where: whereMock });
    whereMock.mockResolvedValue(filteredSubtopics);
    const req = createMockRequest({ isActive: 'false' });

    await GET(req);

    expect(whereMock).toHaveBeenCalledWith('and(eq(subtopics.is_active_column, false))');
    expect(eq).toHaveBeenCalledWith(subtopics.is_active, false);
    expect(cache.set).toHaveBeenCalledWith('api:subtopics:topicId:undefined:subjectId:undefined:isActive:false', filteredSubtopics, 1800);
  });

  test('should filter by subjectId using cached topic IDs', async () => {
    vi.mocked(cache.get)
      .mockResolvedValueOnce(null) // Main cache miss
      .mockResolvedValueOnce(mockTopicIdsForSubject1); // Topic ID cache hit

    fromMock.mockReturnValue({ where: whereMock });
    whereMock.mockResolvedValue(mockAllSubtopics);
    const req = createMockRequest({ subjectId: '1' });

    await GET(req);

    expect(cache.get).toHaveBeenCalledWith('subject:1:topicIds');
    expect(whereMock).toHaveBeenCalledWith(`and(inArray(subtopics.topic_id_column, [${mockTopicIdsForSubject1.join(',')}]))`);
    expect(inArray).toHaveBeenCalledWith(subtopics.topic_id, mockTopicIdsForSubject1);
    expect(cache.set).toHaveBeenCalledWith('api:subtopics:topicId:undefined:subjectId:1:isActive:undefined', mockAllSubtopics, 1800);
  });

  test('should filter by subjectId by fetching topic IDs from DB', async () => {
    vi.mocked(cache.get).mockResolvedValue(null); // All cache misses

    // Mock the two separate DB calls
    vi.mocked(db.select)
      // 1. For topics
      .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(mockTopicsForSubject1) }) })
      // 2. For subtopics
      .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: whereMock.mockResolvedValue(mockAllSubtopics) }) });

    const req = createMockRequest({ subjectId: '1' });
    await GET(req);

    expect(cache.get).toHaveBeenCalledWith('subject:1:topicIds');
    expect(db.select).toHaveBeenCalledTimes(2);
    expect(cache.set).toHaveBeenCalledWith('subject:1:topicIds', mockTopicIdsForSubject1, 3600);
    expect(whereMock).toHaveBeenCalledWith(`and(inArray(subtopics.topic_id_column, [${mockTopicIdsForSubject1.join(',')}]))`);
    expect(cache.set).toHaveBeenCalledWith('api:subtopics:topicId:undefined:subjectId:1:isActive:undefined', mockAllSubtopics, 1800);
  });

  test('should return empty array and cache result if subjectId has no topics', async () => {
    vi.mocked(cache.get).mockResolvedValue(null); // All cache misses

    // Mock DB call for topics to return empty array
    vi.mocked(db.select).mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) });

    const req = createMockRequest({ subjectId: '99' });
    await GET(req);

    expect(db.select).toHaveBeenCalledTimes(1); // Only called for topics
    expect(cache.set).toHaveBeenCalledWith('subject:99:topicIds', [], 3600);
    expect(cache.set).toHaveBeenCalledWith('api:subtopics:topicId:undefined:subjectId:99:isActive:undefined', [], 3600);
    expect(NextResponse.json).toHaveBeenCalledWith({ success: true, data: [], source: 'database' }, { status: 200 });
  });

  test('should combine subjectId and isActive filters', async () => {
    const activeSubtopics = mockAllSubtopics.filter(st => st.is_active);
    vi.mocked(cache.get).mockResolvedValue(null); // All cache misses

    vi.mocked(db.select)
      .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(mockTopicsForSubject1) }) })
      .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: whereMock.mockResolvedValue(activeSubtopics) }) });

    const req = createMockRequest({ subjectId: '1', isActive: 'true' });
    await GET(req);

    const expectedInArray = `inArray(subtopics.topic_id_column, [${mockTopicIdsForSubject1.join(',')}])`;
    const expectedIsActive = 'eq(subtopics.is_active_column, true)';
    expect(whereMock).toHaveBeenCalledWith(`and(${expectedInArray}, ${expectedIsActive})`);
    expect(and).toHaveBeenCalledWith(expectedInArray, expectedIsActive);
    expect(cache.set).toHaveBeenCalledWith('api:subtopics:topicId:undefined:subjectId:1:isActive:true', activeSubtopics, 1800);
  });

  test('should handle database errors gracefully', async () => {
    const dbError = new Error('DB connection failed');
    vi.mocked(cache.get).mockResolvedValue(null);
    fromMock.mockReturnValue({ where: whereMock });
    whereMock.mockRejectedValue(dbError);
    const req = createMockRequest({ topicId: '1' });

    await GET(req);

    expect(console.error).toHaveBeenCalledWith('Error fetching subtopics:', 'DB connection failed');
    expect(cache.set).not.toHaveBeenCalled();
    expect(NextResponse.json).toHaveBeenCalledWith({ success: false, error: 'An unexpected error occurred while fetching subtopics.' }, { status: 500 });
  });

  test('should handle database errors during topic fetch for subjectId', async () => {
    const dbError = new Error('DB connection failed');
    vi.mocked(cache.get).mockResolvedValue(null); // All cache misses

    // Mock DB call for topics to fail
    vi.mocked(db.select).mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockRejectedValue(dbError) }) });

    const req = createMockRequest({ subjectId: '1' });
    await GET(req);

    expect(db.select).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('Error fetching subtopics:', 'DB connection failed');
    expect(NextResponse.json).toHaveBeenCalledWith({ success: false, error: 'An unexpected error occurred while fetching subtopics.' }, { status: 500 });
  });
});