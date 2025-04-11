const { pool } = require('./xata-connection');

async function createSchema() {
  const client = await pool.connect();
  
  try {
    console.log('Starting schema creation with proper dependency order...');
    
    await client.query('BEGIN');
    
    // Step 1: Create enum types
    console.log('Creating enum types...');
    
    await client.query(`
      DROP TYPE IF EXISTS question_type CASCADE;
      CREATE TYPE question_type AS ENUM (
        'MultipleChoice', 
        'Matching', 
        'MultipleCorrectStatements', 
        'AssertionReason', 
        'DiagramBased', 
        'SequenceOrdering'
      );
    `);
    
    await client.query(`
      DROP TYPE IF EXISTS question_source_type CASCADE;
      CREATE TYPE question_source_type AS ENUM (
        'PreviousYear', 
        'AI_Generated', 
        'Other'
      );
    `);
    
    await client.query(`
      DROP TYPE IF EXISTS difficulty_level CASCADE;
      CREATE TYPE difficulty_level AS ENUM (
        'easy', 
        'medium', 
        'hard'
      );
    `);
    
    console.log('Enum types created successfully');
    
    // Step 2: Create tables in the correct order (no foreign keys yet)
    console.log('\nCreating base tables...');
    
    // Create subjects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        subject_id SERIAL PRIMARY KEY,
        subject_name VARCHAR(50) NOT NULL,
        subject_code VARCHAR(10) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created subjects table');
    
    // Create topics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS topics (
        topic_id SERIAL PRIMARY KEY,
        subject_id INTEGER NOT NULL,
        topic_name VARCHAR(100) NOT NULL,
        parent_topic_id INTEGER,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created topics table');
    
    // Create subtopics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subtopics (
        subtopic_id SERIAL PRIMARY KEY,
        topic_id INTEGER NOT NULL,
        subtopic_name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created subtopics table');
    
    // Create exam_years table
    await client.query(`
      CREATE TABLE IF NOT EXISTS exam_years (
        year_id SERIAL PRIMARY KEY,
        exam_year INTEGER NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created exam_years table');
    
    // Create question_papers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS question_papers (
        paper_id SERIAL PRIMARY KEY,
        exam_year_id INTEGER NOT NULL,
        subject_id INTEGER NOT NULL,
        paper_code VARCHAR(20),
        total_questions INTEGER,
        max_marks INTEGER,
        time_duration_minutes INTEGER,
        source_description TEXT,
        upload_date TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created question_papers table');
    
    // Create questions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        question_id SERIAL PRIMARY KEY,
        paper_id INTEGER,
        subject_id INTEGER NOT NULL,
        topic_id INTEGER NOT NULL,
        subtopic_id INTEGER,
        question_number INTEGER,
        question_type question_type NOT NULL,
        source_type question_source_type NOT NULL,
        question_text TEXT NOT NULL,
        explanation TEXT,
        difficulty_level difficulty_level DEFAULT 'medium',
        marks INTEGER DEFAULT 4,
        negative_marks INTEGER DEFAULT 1,
        is_image_based BOOLEAN DEFAULT false,
        image_url VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created questions table');
    
    // Create question-type-specific tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS multiple_choice_options (
        option_id SERIAL PRIMARY KEY,
        question_id INTEGER NOT NULL,
        option_number INTEGER NOT NULL,
        option_text TEXT NOT NULL,
        is_correct BOOLEAN DEFAULT false
      );
      
      CREATE TABLE IF NOT EXISTS assertion_reason_questions (
        ar_id SERIAL PRIMARY KEY,
        question_id INTEGER UNIQUE,
        assertion_text TEXT NOT NULL,
        reason_text TEXT NOT NULL,
        correct_option INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS match_columns_questions (
        match_id SERIAL PRIMARY KEY,
        question_id INTEGER UNIQUE,
        left_column_header TEXT,
        right_column_header TEXT
      );
      
      CREATE TABLE IF NOT EXISTS match_columns_items (
        item_id SERIAL PRIMARY KEY,
        match_id INTEGER,
        left_item_label VARCHAR(10) NOT NULL,
        left_item_text TEXT NOT NULL,
        right_item_label VARCHAR(10) NOT NULL,
        right_item_text TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS match_columns_options (
        option_id SERIAL PRIMARY KEY,
        match_id INTEGER,
        option_number INTEGER NOT NULL,
        option_text TEXT NOT NULL,
        is_correct BOOLEAN DEFAULT false
      );
      
      CREATE TABLE IF NOT EXISTS statement_based_questions (
        statement_id SERIAL PRIMARY KEY,
        question_id INTEGER UNIQUE,
        intro_text TEXT,
        correct_option INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS statements (
        statement_id SERIAL PRIMARY KEY,
        statement_based_id INTEGER NOT NULL,
        statement_number INTEGER NOT NULL,
        statement_label VARCHAR(10),
        statement_text TEXT NOT NULL,
        is_correct BOOLEAN DEFAULT false
      );
    `);
    console.log('Created question-type-specific tables');
    
    // Create tags tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS tags (
        tag_id SERIAL PRIMARY KEY,
        tag_name VARCHAR(50) NOT NULL UNIQUE
      );
      
      CREATE TABLE IF NOT EXISTS question_tags (
        question_id INTEGER,
        tag_id INTEGER,
        PRIMARY KEY (question_id, tag_id)
      );
    `);
    console.log('Created tags tables');
    
    // Step 3: Add foreign key constraints
    console.log('\nAdding foreign key constraints...');
    
    // topics foreign keys
    await client.query(`
      ALTER TABLE topics 
      ADD CONSTRAINT fk_topics_subject
      FOREIGN KEY (subject_id) REFERENCES subjects(subject_id);
      
      ALTER TABLE topics 
      ADD CONSTRAINT fk_topics_parent
      FOREIGN KEY (parent_topic_id) REFERENCES topics(topic_id);
    `);
    
    // subtopics foreign keys
    await client.query(`
      ALTER TABLE subtopics 
      ADD CONSTRAINT fk_subtopics_topic
      FOREIGN KEY (topic_id) REFERENCES topics(topic_id);
    `);
    
    // question_papers foreign keys
    await client.query(`
      ALTER TABLE question_papers 
      ADD CONSTRAINT fk_question_papers_exam_year
      FOREIGN KEY (exam_year_id) REFERENCES exam_years(year_id);
      
      ALTER TABLE question_papers 
      ADD CONSTRAINT fk_question_papers_subject
      FOREIGN KEY (subject_id) REFERENCES subjects(subject_id);
    `);
    
    // questions foreign keys
    await client.query(`
      ALTER TABLE questions 
      ADD CONSTRAINT fk_questions_paper
      FOREIGN KEY (paper_id) REFERENCES question_papers(paper_id);
      
      ALTER TABLE questions 
      ADD CONSTRAINT fk_questions_subject
      FOREIGN KEY (subject_id) REFERENCES subjects(subject_id);
      
      ALTER TABLE questions 
      ADD CONSTRAINT fk_questions_topic
      FOREIGN KEY (topic_id) REFERENCES topics(topic_id);
      
      ALTER TABLE questions 
      ADD CONSTRAINT fk_questions_subtopic
      FOREIGN KEY (subtopic_id) REFERENCES subtopics(subtopic_id);
    `);
    
    // question type specific table foreign keys
    await client.query(`
      ALTER TABLE multiple_choice_options 
      ADD CONSTRAINT fk_options_question
      FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE;
      
      ALTER TABLE assertion_reason_questions 
      ADD CONSTRAINT fk_ar_question
      FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE;
      
      ALTER TABLE match_columns_questions 
      ADD CONSTRAINT fk_match_question
      FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE;
      
      ALTER TABLE match_columns_items 
      ADD CONSTRAINT fk_items_match
      FOREIGN KEY (match_id) REFERENCES match_columns_questions(match_id) ON DELETE CASCADE;
      
      ALTER TABLE match_columns_options 
      ADD CONSTRAINT fk_match_options_match
      FOREIGN KEY (match_id) REFERENCES match_columns_questions(match_id) ON DELETE CASCADE;
      
      ALTER TABLE statement_based_questions 
      ADD CONSTRAINT fk_statement_question
      FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE;
      
      ALTER TABLE statements 
      ADD CONSTRAINT fk_statements_question
      FOREIGN KEY (statement_based_id) REFERENCES statement_based_questions(statement_id) ON DELETE CASCADE;
    `);
    
    // tags foreign keys
    await client.query(`
      ALTER TABLE question_tags 
      ADD CONSTRAINT fk_question_tags_question
      FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE;
      
      ALTER TABLE question_tags 
      ADD CONSTRAINT fk_question_tags_tag
      FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE;
    `);
    
    console.log('Foreign key constraints added successfully');
    
    // Create drizzle migrations table to track this migration
    await client.query(`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at timestamp with time zone DEFAULT now()
      );
      
      INSERT INTO "__drizzle_migrations" (hash) 
      VALUES ('manual_schema_creation');
    `);
    
    await client.query('COMMIT');
    
    console.log('\n✅ Schema created successfully with all relationships');
    console.log('\nNext steps:');
    console.log('1. Run `npx drizzle-kit studio` to view your database schema');
    console.log('2. Run your application to start using the database');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating schema:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Execute the schema creation
if (require.main === module) {
  createSchema().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { createSchema };