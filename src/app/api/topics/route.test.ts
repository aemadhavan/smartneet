import { NextRequest, NextResponse } from 'next/server';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { db } from '@/db';
import { cache } from '@/lib/cache';
import { eq, isNull, and } from 'drizzle-orm';
import { topics } from '@/db/schema';

// Mock dependencies
vi.mock('@/db/schema', () => ({
  topics: {
    subject_id: 'topics.subject_id_column',
    parent_topic_id: 'topics.parent_topic_id_column',
    is_active: 'topics.is_active_column',
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
  isNull: vi.fn(field => `isNull(${field})`),
  and: vi.fn((...conditions) => `and(${conditions.join(', ')})`),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, init })),
  },
}));

const createMockRequest = (searchParams: Record<string, string> = {}) => {
  const url = new URL('http://localhost/api/topics');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return {
    nextUrl: {
      searchParams: url.searchParams,
    },
  } as NextRequest;
};

describe('GET /api/topics', () => {
  const mockAllTopics = [
    { id: 1, name: 'Topic 1', subject_id: 1, parent_topic_id: null, is_active: true },
    { id: 2, name: 'Topic 2', subject_id: 1, parent_topic_id: 1, is_active: true },
    { id: 3, name: 'Topic 3', subject_id: 2, parent_topic_id: null, is_active: false },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('should return topics from cache when available', async () => {
    vi.mocked(cache.get).mockResolvedValue(mockAllTopics);
    const req = createMockRequest({ subjectId: '1' });

    await GET(req);

    expect(cache.get).toHaveBeenCalledWith('api:topics:subjectId:1:parentTopicId:undefined:isRootLevel:undefined:isActive:undefined');
    expect(db.select).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
    expect(NextResponse.json).toHaveBeenCalledWith({ success: true, data: mockAllTopics, source: 'cache' }, { status: 200 });
  });

  test('should return all topics from database when cache is empty and no filters are applied', async () => {
    vi.mocked(cache.get).mockResolvedValue(null);
    fromMock.mockResolvedValue(mockAllTopics); // No .where() call
    const req = createMockRequest();

    await GET(req);

    expect(cache.get).toHaveBeenCalledWith('api:topics:subjectId:undefined:parentTopicId:undefined:isRootLevel:undefined:isActive:undefined');
    expect(db.select).toHaveBeenCalled();
    expect(fromMock).toHaveBeenCalledWith(topics);
    expect(whereMock).not.toHaveBeenCalled();
    expect(cache.set).toHaveBeenCalledWith('api:topics:subjectId:undefined:parentTopicId:undefined:isRootLevel:undefined:isActive:undefined', mockAllTopics, 3600);
    expect(NextResponse.json).toHaveBeenCalledWith({ success: true, data: mockAllTopics, source: 'database' }, { status: 200 });
  });

  test('should filter by subjectId and cache with longer TTL', async () => {
    const filteredTopics = mockAllTopics.filter(t => t.subject_id === 1);
    vi.mocked(cache.get).mockResolvedValue(null);
    fromMock.mockReturnValue({ where: whereMock });
    whereMock.mockResolvedValue(filteredTopics);
    const req = createMockRequest({ subjectId: '1' });

    await GET(req);

    expect(whereMock).toHaveBeenCalledWith('and(eq(topics.subject_id_column, 1))');
    expect(eq).toHaveBeenCalledWith(topics.subject_id, 1);
    expect(cache.set).toHaveBeenCalledWith('api:topics:subjectId:1:parentTopicId:undefined:isRootLevel:undefined:isActive:undefined', filteredTopics, 7200);
    expect(NextResponse.json).toHaveBeenCalledWith({ success: true, data: filteredTopics, source: 'database' }, { status: 200 });
  });

  test('should filter by parentTopicId and cache with longer TTL', async () => {
    const filteredTopics = mockAllTopics.filter(t => t.parent_topic_id === 1);
    vi.mocked(cache.get).mockResolvedValue(null);
    fromMock.mockReturnValue({ where: whereMock });
    whereMock.mockResolvedValue(filteredTopics);
    const req = createMockRequest({ parentTopicId: '1' });

    await GET(req);

    expect(whereMock).toHaveBeenCalledWith('and(eq(topics.parent_topic_id_column, 1))');
    expect(eq).toHaveBeenCalledWith(topics.parent_topic_id, 1);
    expect(cache.set).toHaveBeenCalledWith('api:topics:subjectId:undefined:parentTopicId:1:isRootLevel:undefined:isActive:undefined', filteredTopics, 7200);
    expect(NextResponse.json).toHaveBeenCalledWith({ success: true, data: filteredTopics, source: 'database' }, { status: 200 });
  });

  test('should filter by isRootLevel', async () => {
    const filteredTopics = mockAllTopics.filter(t => t.parent_topic_id === null);
    vi.mocked(cache.get).mockResolvedValue(null);
    fromMock.mockReturnValue({ where: whereMock });
    whereMock.mockResolvedValue(filteredTopics);
    const req = createMockRequest({ isRootLevel: 'true' });

    await GET(req);

    expect(whereMock).toHaveBeenCalledWith('and(isNull(topics.parent_topic_id_column))');
    expect(isNull).toHaveBeenCalledWith(topics.parent_topic_id);
    expect(cache.set).toHaveBeenCalledWith('api:topics:subjectId:undefined:parentTopicId:undefined:isRootLevel:true:isActive:undefined', filteredTopics, 3600);
    expect(NextResponse.json).toHaveBeenCalledWith({ success: true, data: filteredTopics, source: 'database' }, { status: 200 });
  });

  test('should filter by isActive=true', async () => {
    const filteredTopics = mockAllTopics.filter(t => t.is_active === true);
    vi.mocked(cache.get).mockResolvedValue(null);
    fromMock.mockReturnValue({ where: whereMock });
    whereMock.mockResolvedValue(filteredTopics);
    const req = createMockRequest({ isActive: 'true' });

    await GET(req);

    expect(whereMock).toHaveBeenCalledWith('and(eq(topics.is_active_column, true))');
    expect(eq).toHaveBeenCalledWith(topics.is_active, true);
    expect(cache.set).toHaveBeenCalledWith('api:topics:subjectId:undefined:parentTopicId:undefined:isRootLevel:undefined:isActive:true', filteredTopics, 3600);
    expect(NextResponse.json).toHaveBeenCalledWith({ success: true, data: filteredTopics, source: 'database' }, { status: 200 });
  });

  test('should filter by isActive=false', async () => {
    const filteredTopics = mockAllTopics.filter(t => !t.is_active);
    vi.mocked(cache.get).mockResolvedValue(null);
    fromMock.mockReturnValue({ where: whereMock });
    whereMock.mockResolvedValue(filteredTopics);
    const req = createMockRequest({ isActive: 'false' });

    await GET(req);

    expect(whereMock).toHaveBeenCalledWith('and(eq(topics.is_active_column, false))');
    expect(eq).toHaveBeenCalledWith(topics.is_active, false);
    expect(cache.set).toHaveBeenCalledWith('api:topics:subjectId:undefined:parentTopicId:undefined:isRootLevel:undefined:isActive:false', filteredTopics, 3600);
    expect(NextResponse.json).toHaveBeenCalledWith({ success: true, data: filteredTopics, source: 'database' }, { status: 200 });
  });

  test('should combine multiple filters', async () => {
    const filteredTopics = mockAllTopics.filter(t => t.subject_id === 1 && t.is_active);
    vi.mocked(cache.get).mockResolvedValue(null);
    fromMock.mockReturnValue({ where: whereMock });
    whereMock.mockResolvedValue(filteredTopics);
    const req = createMockRequest({ subjectId: '1', isActive: 'true' });

    await GET(req);

    expect(whereMock).toHaveBeenCalledWith('and(eq(topics.subject_id_column, 1), eq(topics.is_active_column, true))');
    expect(eq).toHaveBeenCalledWith(topics.subject_id, 1);
    expect(eq).toHaveBeenCalledWith(topics.is_active, true);
    expect(and).toHaveBeenCalledWith('eq(topics.subject_id_column, 1)', 'eq(topics.is_active_column, true)');
    expect(cache.set).toHaveBeenCalledWith('api:topics:subjectId:1:parentTopicId:undefined:isRootLevel:undefined:isActive:true', filteredTopics, 7200);
    expect(NextResponse.json).toHaveBeenCalledWith({ success: true, data: filteredTopics, source: 'database' }, { status: 200 });
  });

  test('should handle database errors gracefully', async () => {
    const dbError = new Error('Database connection failed');
    vi.mocked(cache.get).mockResolvedValue(null);
    fromMock.mockReturnValue({ where: whereMock });
    whereMock.mockRejectedValue(dbError);
    const req = createMockRequest({ subjectId: '1' });

    await GET(req);

    expect(db.select).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('Error fetching topics:', dbError);
    expect(cache.set).not.toHaveBeenCalled();
    expect(NextResponse.json).toHaveBeenCalledWith({ success: false, error: 'Failed to fetch topics' }, { status: 500 });
  });
});