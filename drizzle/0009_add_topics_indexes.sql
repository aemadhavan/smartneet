-- Migration: Add performance indexes for topics table
-- Created: 2025-11-11
-- Purpose: Optimize chemistry page and other subject pages query performance

-- Critical composite index for subject + parent queries (most common pattern)
CREATE INDEX IF NOT EXISTS "idx_topics_subject_parent" ON "topics" ("subject_id", "parent_topic_id");

-- Composite index for subject + active status filtering
CREATE INDEX IF NOT EXISTS "idx_topics_subject_active" ON "topics" ("subject_id", "is_active");

-- Composite index for parent + active status (for subtopic queries)
CREATE INDEX IF NOT EXISTS "idx_topics_parent_active" ON "topics" ("parent_topic_id", "is_active") WHERE "parent_topic_id" IS NOT NULL;

-- Partial index specifically for root topics (where parent_topic_id IS NULL)
-- This is highly selective and speeds up root topic queries significantly
CREATE INDEX IF NOT EXISTS "idx_topics_root_subjects" ON "topics" ("subject_id", "is_active") WHERE "parent_topic_id" IS NULL;

-- Additional index for ordering by topic_id (used in API routes)
CREATE INDEX IF NOT EXISTS "idx_topics_id_ordering" ON "topics" ("topic_id" ASC);

-- Analyze the table to update statistics for the query planner
ANALYZE "topics";
