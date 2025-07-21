// Query Chemistry Questions with Drizzle ORM
// This script demonstrates how to use the existing Drizzle setup to query chemistry questions

import { db } from '../../src/db/index';
import { subjects, questions, topics, subtopics } from '../../src/db/schema';
import { eq, and, count } from 'drizzle-orm';

async function queryChemistryQuestions() {
  try {
    console.log('🔍 Querying database for chemistry questions...\n');
    
    // First, get all subjects to find chemistry
    console.log('=== Available Subjects ===');
    const allSubjects = await db
      .select({
        subject_id: subjects.subject_id,
        subject_name: subjects.subject_name,
        subject_code: subjects.subject_code,
        is_active: subjects.is_active
      })
      .from(subjects)
      .orderBy(subjects.subject_id);
    
    console.table(allSubjects);
    
    // Find chemistry subject (assuming subject_id=2 based on test files)
    const chemistrySubject = allSubjects.find(s => 
      s.subject_name.toLowerCase().includes('chemistry') || 
      s.subject_code.toLowerCase().includes('chem') ||
      s.subject_id === 2 // Based on test files
    );
    
    if (!chemistrySubject) {
      console.log('❌ Chemistry subject not found');
      return;
    }
    
    console.log(`\n✅ Found Chemistry subject: ID=${chemistrySubject.subject_id}, Name="${chemistrySubject.subject_name}"`);
    
    // Query chemistry questions with related data
    console.log('\n=== Chemistry Questions (Sample) ===');
    const chemistryQuestions = await db
      .select({
        question_id: questions.question_id,
        question_text: questions.question_text,
        question_type: questions.question_type,
        difficulty_level: questions.difficulty_level,
        marks: questions.marks,
        is_active: questions.is_active,
        topic_name: topics.topic_name,
        subtopic_name: subtopics.subtopic_name
      })
      .from(questions)
      .leftJoin(topics, eq(questions.topic_id, topics.topic_id))
      .leftJoin(subtopics, eq(questions.subtopic_id, subtopics.subtopic_id))
      .where(and(
        eq(questions.subject_id, chemistrySubject.subject_id),
        eq(questions.is_active, true)
      ))
      .limit(5);
    
    if (chemistryQuestions.length === 0) {
      console.log('❌ No chemistry questions found');
    } else {
      console.log(`Found chemistry questions (showing first 5):`);
      console.table(chemistryQuestions);
    }
    
    // Get question count by topic
    console.log('\n=== Chemistry Questions by Topic ===');
    const topicCounts = await db
      .select({
        topic_name: topics.topic_name,
        question_count: count(questions.question_id)
      })
      .from(topics)
      .leftJoin(questions, and(
        eq(topics.topic_id, questions.topic_id),
        eq(questions.is_active, true)
      ))
      .where(and(
        eq(topics.subject_id, chemistrySubject.subject_id),
        eq(topics.is_active, true)
      ))
      .groupBy(topics.topic_id, topics.topic_name)
      .orderBy(count(questions.question_id));
    
    console.table(topicCounts);
    
    // Get a detailed chemistry question with all details
    console.log('\n=== Sample Chemistry Question with Details ===');
    const detailedQuestion = await db
      .select()
      .from(questions)
      .where(and(
        eq(questions.subject_id, chemistrySubject.subject_id),
        eq(questions.is_active, true)
      ))
      .limit(1);
    
    if (detailedQuestion.length > 0) {
      console.log('Question details:');
      console.log('ID:', detailedQuestion[0].question_id);
      console.log('Type:', detailedQuestion[0].question_type);
      console.log('Text:', detailedQuestion[0].question_text.substring(0, 200) + '...');
      console.log('Difficulty:', detailedQuestion[0].difficulty_level);
      console.log('Marks:', detailedQuestion[0].marks);
      console.log('Details (JSON):', JSON.stringify(detailedQuestion[0].details, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  }
}

// Example function to query specific chemistry questions
export async function getChemistryQuestions(limit = 10, topic_id?: number) {
  try {
    // First get chemistry subject ID
    const chemistrySubject = await db
      .select({ subject_id: subjects.subject_id })
      .from(subjects)
      .where(eq(subjects.subject_name, 'Chemistry')) // Adjust based on actual name
      .limit(1);
    
    if (chemistrySubject.length === 0) {
      throw new Error('Chemistry subject not found');
    }
    
    const subject_id = chemistrySubject[0].subject_id;
    
    // Build query conditions
    const conditions = [
      eq(questions.subject_id, subject_id),
      eq(questions.is_active, true)
    ];
    
    if (topic_id) {
      conditions.push(eq(questions.topic_id, topic_id));
    }
    
    // Query questions
    const result = await db
      .select({
        question_id: questions.question_id,
        question_text: questions.question_text,
        question_type: questions.question_type,
        details: questions.details,
        explanation: questions.explanation,
        difficulty_level: questions.difficulty_level,
        marks: questions.marks,
        negative_marks: questions.negative_marks,
        is_image_based: questions.is_image_based,
        image_url: questions.image_url,
        topic_name: topics.topic_name,
        subtopic_name: subtopics.subtopic_name
      })
      .from(questions)
      .leftJoin(topics, eq(questions.topic_id, topics.topic_id))
      .leftJoin(subtopics, eq(questions.subtopic_id, subtopics.subtopic_id))
      .where(and(...conditions))
      .limit(limit);
    
    return result;
    
  } catch (error) {
    console.error('Error querying chemistry questions:', error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  queryChemistryQuestions()
    .then(() => {
      console.log('\n✅ Query completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Script error:', error);
      process.exit(1);
    });
}