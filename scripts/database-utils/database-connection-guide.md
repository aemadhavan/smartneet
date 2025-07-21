# Database Connection Guide for SmartNEET

## Database Overview

The SmartNEET project uses a PostgreSQL database hosted on **Xata** with **Drizzle ORM** for database operations.

### Key Database Configuration Files

1. **`/Users/maceka/Projects/smartneet/drizzle.config.ts`** - Drizzle configuration
2. **`/Users/maceka/Projects/smartneet/src/db/index.ts`** - Database connection setup
3. **`/Users/maceka/Projects/smartneet/src/db/schema.ts`** - Database schema definitions
4. **`/Users/maceka/Projects/smartneet/.env.local`** - Environment variables

## Database Connection Setup

### Environment Variables
```bash
XATA_DATABASE_URL="postgresql://79j6ki:xau_QYqoVHkbIbgbeBMM15ShC7kfwZOtwkAL@us-east-1.sql.xata.sh/smartneet:main?sslmode=require"
```

### Connection Configuration
The database connection is configured in `/Users/maceka/Projects/smartneet/src/db/index.ts` with:
- **Pool-based connections** for better performance
- **SSL enabled** for secure connections
- **Retry logic** for handling connection failures
- **Connection pooling** optimized for serverless environments

## Database Schema

### Core Tables Structure

1. **`subjects`** - Subject information
   - `subject_id` (Primary Key)
   - `subject_name` (e.g., "Chemistry", "Physics")
   - `subject_code` (e.g., "CHEM", "PHY")
   - `is_active` (Boolean)

2. **`topics`** - Topic information
   - `topic_id` (Primary Key)
   - `subject_id` (Foreign Key)
   - `topic_name`
   - `parent_topic_id` (Self-referencing)

3. **`subtopics`** - Subtopic information
   - `subtopic_id` (Primary Key)
   - `topic_id` (Foreign Key)
   - `subtopic_name`

4. **`questions`** - Question information
   - `question_id` (Primary Key)
   - `subject_id` (Foreign Key)
   - `topic_id` (Foreign Key)
   - `subtopic_id` (Foreign Key)
   - `question_text` (Text)
   - `question_type` (Enum: MultipleChoice, Matching, etc.)
   - `difficulty_level` (Enum: easy, medium, hard)
   - `details` (JSONB - contains question-specific data)
   - `explanation` (Text)
   - `marks` (Integer)
   - `is_active` (Boolean)

### Available Subjects

Based on the current database:
- **Physics** (ID: 1)
- **Chemistry** (ID: 2) ← Target subject
- **Botany** (ID: 3)
- **Zoology** (ID: 4)

## Chemistry Questions Analysis

### Chemistry Subject Details
- **Subject ID**: 2
- **Subject Name**: "Chemistry"
- **Subject Code**: "CHEM"
- **Total Questions**: 994+ questions available

### Top Chemistry Topics (by question count)
1. **Chemical Bonding and Molecular Structure** - 115 questions
2. **p-block Elements** - 80 questions
3. **Redox Reaction and ElectroChemistry** - 70 questions
4. **d- and f-block Elements** - 69 questions
5. **Coordination Compounds** - 65 questions
6. **Equilibrium** - 65 questions
7. **Some Basic Concepts in Chemistry** - 55 questions
8. **Atomic Structure** - 50 questions
9. **Classification of Elements and Periodicity in Properties** - 50 questions
10. **Chemical Kinetics** - 50 questions

## How to Query Chemistry Questions

### Method 1: Using Drizzle ORM (Recommended)

```typescript
import { db } from '@/db';
import { subjects, questions, topics, subtopics } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Get chemistry questions
const chemistryQuestions = await db
  .select({
    question_id: questions.question_id,
    question_text: questions.question_text,
    question_type: questions.question_type,
    difficulty_level: questions.difficulty_level,
    topic_name: topics.topic_name,
    subtopic_name: subtopics.subtopic_name
  })
  .from(questions)
  .leftJoin(topics, eq(questions.topic_id, topics.topic_id))
  .leftJoin(subtopics, eq(questions.subtopic_id, subtopics.subtopic_id))
  .where(and(
    eq(questions.subject_id, 2), // Chemistry subject ID
    eq(questions.is_active, true)
  ))
  .limit(10);
```

### Method 2: Using Raw SQL

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.XATA_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Query chemistry questions
const result = await pool.query(`
  SELECT 
    q.question_id,
    q.question_text,
    q.question_type,
    q.difficulty_level,
    t.topic_name,
    st.subtopic_name
  FROM questions q
  LEFT JOIN topics t ON q.topic_id = t.topic_id
  LEFT JOIN subtopics st ON q.subtopic_id = st.subtopic_id
  WHERE q.subject_id = 2 AND q.is_active = true
  LIMIT 10
`);
```

### Method 3: Using Existing API Endpoints

The project already has several API endpoints you can reference:
- **GET `/api/subjects`** - Get all subjects
- **GET `/api/questions/[questionId]`** - Get specific question
- **GET `/api/topics`** - Get topics with filters

## Sample Query Functions

I've created the following helper files in your project:

1. **`/Users/maceka/Projects/smartneet/query-chemistry-questions.js`** - Basic JavaScript query example
2. **`/Users/maceka/Projects/smartneet/query-chemistry-drizzle.ts`** - TypeScript with Drizzle ORM
3. **`/Users/maceka/Projects/smartneet/chemistry-query-example.ts`** - Complete API example with filters

## Advanced Query Options

### Filter by Topic
```typescript
// Get questions from specific topic (e.g., Chemical Bonding)
const topicQuestions = await db
  .select()
  .from(questions)
  .where(and(
    eq(questions.subject_id, 2),
    eq(questions.topic_id, specific_topic_id),
    eq(questions.is_active, true)
  ));
```

### Filter by Difficulty
```typescript
// Get only medium difficulty chemistry questions
const mediumQuestions = await db
  .select()
  .from(questions)
  .where(and(
    eq(questions.subject_id, 2),
    eq(questions.difficulty_level, 'medium'),
    eq(questions.is_active, true)
  ));
```

### Filter by Question Type
```typescript
// Get only multiple choice questions
const mcqQuestions = await db
  .select()
  .from(questions)
  .where(and(
    eq(questions.subject_id, 2),
    eq(questions.question_type, 'MultipleChoice'),
    eq(questions.is_active, true)
  ));
```

## Question Data Structure

Each question contains:
- **Basic Info**: ID, text, type, difficulty, marks
- **Relationships**: Links to subject, topic, subtopic
- **Details**: JSONB field with question-specific data (options, answers, etc.)
- **Explanation**: Text explanation of the answer
- **Media**: Optional image URL for image-based questions

## Getting Started

1. **Install dependencies** (if not already installed):
   ```bash
   npm install drizzle-orm pg
   ```

2. **Use the existing connection**:
   ```typescript
   import { db } from '@/db';
   ```

3. **Run the example queries**:
   ```bash
   # Basic query
   node query-chemistry-questions.js
   
   # TypeScript version
   npx ts-node query-chemistry-drizzle.ts
   ```

## Best Practices

1. **Always filter by `is_active = true`** to get only active questions
2. **Use connection pooling** for better performance
3. **Implement retry logic** for database operations
4. **Cache frequently accessed data** using the existing cache system
5. **Use prepared statements** for repeated queries
6. **Handle database errors gracefully**

## Connection Testing

The database connection is automatically tested when you import from `/Users/maceka/Projects/smartneet/src/db/index.ts`. You should see a console message confirming successful connection.

This setup provides a robust foundation for querying chemistry questions with various filters and options.