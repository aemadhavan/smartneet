import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { questions } from './schema';
import { eq, sql } from 'drizzle-orm';
import { cache } from '../lib/cache'; // Relative path instead of using @/
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function migrateQuestionsData() {
  console.log('Starting migration of AI-generated questions...');
  
  // Environment variables must be defined
  const PROD_DATABASE_URL = process.env.PROD_DATABASE_URL;
  const DEV_DATABASE_URL = process.env.DEV_DATABASE_URL;
  
  console.log('ENV vars loaded:', {
    prodDb: PROD_DATABASE_URL ? 'Yes' : 'No',
    devDb: DEV_DATABASE_URL ? 'Yes' : 'No'
  });
  
  if (!PROD_DATABASE_URL || !DEV_DATABASE_URL) {
    throw new Error('Database connection strings are not defined');
  }
  
  // Connection details - using verified connection strings
  const prodClient = postgres(PROD_DATABASE_URL);
  const devClient = postgres(DEV_DATABASE_URL);
  
  const prodDb = drizzle(prodClient);
  const devDb = drizzle(devClient);
  
  try {
    // 1. Get all AI-generated questions from production
    const aiGeneratedQuestions = await prodDb
      .select()
      .from(questions)
      .where(eq(questions.source_type, 'AI_Generated'));
    
    console.log(`Found ${aiGeneratedQuestions.length} AI-generated questions to migrate`);
    
    // 2. Insert questions in batches
    const batchSize = 50;
    for (let i = 0; i < aiGeneratedQuestions.length; i += batchSize) {
      const batch = aiGeneratedQuestions.slice(i, i + batchSize);
      
      await devDb.insert(questions).values(batch)
        .onConflictDoUpdate({
          target: questions.question_id,
          set: {
            paper_id: sql`EXCLUDED.paper_id`,
            subject_id: sql`EXCLUDED.subject_id`,
            topic_id: sql`EXCLUDED.topic_id`,
            subtopic_id: sql`EXCLUDED.subtopic_id`,
            question_number: sql`EXCLUDED.question_number`,
            question_type: sql`EXCLUDED.question_type`,
            source_type: sql`EXCLUDED.source_type`,
            question_text: sql`EXCLUDED.question_text`,
            explanation: sql`EXCLUDED.explanation`,
            details: sql`EXCLUDED.details`,
            difficulty_level: sql`EXCLUDED.difficulty_level`,
            marks: sql`EXCLUDED.marks`,
            negative_marks: sql`EXCLUDED.negative_marks`,
            is_image_based: sql`EXCLUDED.is_image_based`,
            image_url: sql`EXCLUDED.image_url`,
            is_active: sql`EXCLUDED.is_active`,
            created_at: sql`EXCLUDED.created_at`,
            updated_at: sql`EXCLUDED.updated_at`
          }
        });
      
      console.log(`Migrated batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(aiGeneratedQuestions.length/batchSize)}`);
    }
    
    // 3. Reset sequence
    await devDb.execute(sql`SELECT setval('questions_question_id_seq', (SELECT MAX(question_id) FROM questions))`);
    
    // 4. Clear cache
    await cache.delete('questions:pool:*');
    await cache.delete('topic:*:questions');
    await cache.delete('subtopic:*:questions');
    await cache.delete('question:*:details');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prodClient.end();
    await devClient.end();
  }
}

migrateQuestionsData().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});