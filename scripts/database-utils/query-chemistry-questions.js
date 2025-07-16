// Query Chemistry Questions Script
// This script demonstrates how to connect to the database and query for chemistry questions

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.XATA_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function queryChemistryQuestions() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database successfully!');
    
    // First, let's check what subjects are available
    console.log('\n=== Available Subjects ===');
    const subjectsResult = await client.query(`
      SELECT subject_id, subject_name, subject_code, is_active 
      FROM subjects 
      ORDER BY subject_id
    `);
    
    console.table(subjectsResult.rows);
    
    // Find chemistry subject
    const chemistrySubject = subjectsResult.rows.find(s => 
      s.subject_name.toLowerCase().includes('chemistry') || 
      s.subject_code.toLowerCase().includes('chem')
    );
    
    if (!chemistrySubject) {
      console.log('\n❌ Chemistry subject not found in database');
      return;
    }
    
    console.log(`\n✅ Found Chemistry subject: ID=${chemistrySubject.subject_id}, Name="${chemistrySubject.subject_name}"`);
    
    // Query chemistry questions
    console.log('\n=== Chemistry Questions ===');
    const questionsResult = await client.query(`
      SELECT 
        q.question_id,
        q.question_text,
        q.question_type,
        q.difficulty_level,
        q.marks,
        q.is_active,
        t.topic_name,
        st.subtopic_name
      FROM questions q
      LEFT JOIN topics t ON q.topic_id = t.topic_id
      LEFT JOIN subtopics st ON q.subtopic_id = st.subtopic_id
      WHERE q.subject_id = $1 AND q.is_active = true
      ORDER BY q.question_id
      LIMIT 5
    `, [chemistrySubject.subject_id]);
    
    if (questionsResult.rows.length === 0) {
      console.log('❌ No chemistry questions found');
    } else {
      console.log(`Found ${questionsResult.rows.length} chemistry questions (showing first 5):`);
      console.table(questionsResult.rows);
    }
    
    // Get question count by topic
    console.log('\n=== Chemistry Questions by Topic ===');
    const topicCountResult = await client.query(`
      SELECT 
        t.topic_name,
        COUNT(q.question_id) as question_count
      FROM topics t
      LEFT JOIN questions q ON t.topic_id = q.topic_id AND q.is_active = true
      WHERE t.subject_id = $1 AND t.is_active = true
      GROUP BY t.topic_id, t.topic_name
      ORDER BY question_count DESC
    `, [chemistrySubject.subject_id]);
    
    console.table(topicCountResult.rows);
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    client.release();
  }
}

// Run the query
queryChemistryQuestions()
  .then(() => {
    console.log('\n✅ Query completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script error:', error);
    process.exit(1);
  });