// src/app/api/admin/questions/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  questions, 
  multiple_choice_options, 
  assertion_reason_questions, 
  match_columns_questions,
  match_columns_items,
  match_columns_options,
  statement_based_questions,
  statements,
  sequence_ordering_questions,
  sequence_items
} from '@/db/schema';
import { questionTypeEnum, questionSourceTypeEnum, difficultyLevelEnum } from '@/db/schema';

// Base question interface
interface BaseQuestionData {
  paper_id: number;
  subject_id: number; // This is required in your schema
  question_number: number;
  topic_id: number; // This is required in your schema
  subtopic_id?: number;
  question_type: string;
  source_type?: string; // This is required in your schema
  question_text: string;
  explanation?: string;
  difficulty_level?: string;
  marks?: number;
  negative_marks?: number;
  is_image_based?: boolean;
  image_url?: string;
  is_active?: boolean;
}

// Multiple choice option interface
interface MultipleChoiceOption {
  option_number: number;
  option_text: string;
  is_correct: boolean;
}

// Assertion reason interface
interface AssertionReasonData {
  assertion_text: string;
  reason_text: string;
  correct_option: number;
  options?: MultipleChoiceOption[];
}

// Match columns item interface
interface MatchColumnsItem {
  left_item_label: string;
  left_item_text: string;
  right_item_label: string;
  right_item_text: string;
}

// Match columns option interface
interface MatchColumnsOption {
  option_number: number;
  option_text: string;
  is_correct: boolean;
}

// Match columns data interface
interface MatchColumnsData {
  left_column_header?: string;
  right_column_header?: string;
  items?: MatchColumnsItem[];
  options?: MatchColumnsOption[];
}

// Statement interface
interface Statement {
  statement_number: number;
  statement_label?: string;
  statement_text: string;
  is_correct: boolean;
}

// Statement based data interface
interface StatementBasedData {
  intro_text?: string;
  correct_option: number;
  statements?: Statement[];
  options?: MultipleChoiceOption[];
}
interface SequenceItem {
  item_number: number;
  item_label?: string;
  item_text: string;
}

// Sequence ordering data interface
interface SequenceOrderingData {
  intro_text?: string;
  correct_sequence: number[] | string;
  items?: SequenceItem[];
}
// Complete question data interface
interface QuestionData extends BaseQuestionData {
  options?: MultipleChoiceOption[];
  assertion_reason?: AssertionReasonData;
  assertion_reason_questions?: AssertionReasonData;
  match_columns?: MatchColumnsData;
  statement_based?: StatementBasedData;
  statement_based_questions?: StatementBasedData;
  statements?: Statement[];  
  sequence_ordering?: SequenceOrderingData;
  sequence_ordering_questions?: SequenceOrderingData;
  sequence_items?: SequenceItem[];
}

// Helper functions to validate and convert enum values
function validateQuestionType(type: string): typeof questionTypeEnum.enumValues[number] {
  // Map common type names to the enum values
  const typeMapping: Record<string, typeof questionTypeEnum.enumValues[number]> = {
    'multiple_choice': 'MultipleChoice',
    'multiplechoice': 'MultipleChoice',
    'assertion_reason': 'AssertionReason',
    'assertionreason': 'AssertionReason',
    'match_columns': 'Matching',
    'matching': 'Matching',
    'statement_based': 'MultipleCorrectStatements',
    'multiplecorrectstatements': 'MultipleCorrectStatements',
    'diagram_based': 'DiagramBased',
    'diagrambased': 'DiagramBased',
    'sequence_ordering': 'SequenceOrdering',
    'sequenceordering': 'SequenceOrdering'
  };

  // Try direct match with enum values first
  if (questionTypeEnum.enumValues.includes(type as typeof questionTypeEnum.enumValues[number])) {
    return type as typeof questionTypeEnum.enumValues[number];
  }

  // Try the normalized mapping
  const normalizedType = type.toLowerCase().replace(/\s+/g, '');
  if (typeMapping[normalizedType]) {
    return typeMapping[normalizedType];
  }

  // If we reach here, the type is invalid
  throw new Error(`Invalid question type: ${type}. Valid types are: ${questionTypeEnum.enumValues.join(', ')}`);
}

function validateSourceType(type: string = 'PreviousYear'): typeof questionSourceTypeEnum.enumValues[number] {
  // Map common source type names to the enum values
  const sourceMapping: Record<string, typeof questionSourceTypeEnum.enumValues[number]> = {
    'previous_year': 'PreviousYear', 
    'previousyear': 'PreviousYear',
    'ai_generated': 'AI_Generated',
    'aigenerated': 'AI_Generated',
    'ai': 'AI_Generated',
    'other': 'Other'
  };

  // Try direct match with enum values first
  if (questionSourceTypeEnum.enumValues.includes(type as typeof questionSourceTypeEnum.enumValues[number])) {
    return type as typeof questionSourceTypeEnum.enumValues[number];
  }

  // Try the normalized mapping
  const normalizedType = type.toLowerCase().replace(/\s+/g, '');
  if (sourceMapping[normalizedType]) {
    return sourceMapping[normalizedType];
  }

  // Default to PreviousYear if not specified or invalid
  return 'PreviousYear';
}

function validateDifficultyLevel(level: string = 'medium'): typeof difficultyLevelEnum.enumValues[number] {
  // Map common difficulty level names to the enum values
  const levelMapping: Record<string, typeof difficultyLevelEnum.enumValues[number]> = {
    'easy': 'easy',
    'medium': 'medium',
    'hard': 'hard',
    '1': 'easy',
    '2': 'medium', 
    '3': 'hard',
    'low': 'easy',
    'moderate': 'medium',
    'high': 'hard',
    'difficult': 'hard'
  };

  // Try direct match with enum values first
  if (difficultyLevelEnum.enumValues.includes(level as typeof difficultyLevelEnum.enumValues[number])) {
    return level as typeof difficultyLevelEnum.enumValues[number];
  }

  // Try the normalized mapping
  const normalizedLevel = level.toLowerCase().replace(/\s+/g, '');
  if (levelMapping[normalizedLevel]) {
    return levelMapping[normalizedLevel];
  }

  // Default to medium if not specified or invalid
  return 'medium';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const jsonFile = formData.get('jsonFile') as File;

    if (!jsonFile) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const text = await jsonFile.text();
    let questionsData: QuestionData[];
    
    try {
      questionsData = JSON.parse(text);
      if (!Array.isArray(questionsData)) {
        return NextResponse.json(
          { error: 'Invalid JSON format. Expected an array of questions.' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return NextResponse.json(
        { error: 'Failed to parse JSON' },
        { status: 400 }
      );
    }

    let insertedCount = 0;
    const totalCount = questionsData.length;
    const errors: Array<{ question_number: number, error: string }> = [];

    for (const questionData of questionsData) {
      try {
        // Validate and prepare required fields
        if (!questionData.subject_id) {
          throw new Error("subject_id is required");
        }
        
        if (!questionData.topic_id) {
          throw new Error("topic_id is required");
        }

        // Start a transaction
        await db.transaction(async (tx) => {
          // Map question type to enum value
          const questionType = validateQuestionType(questionData.question_type);
          
          // Insert the base question
          const [insertedQuestion] = await tx
            .insert(questions)
            .values({
              paper_id: questionData.paper_id,
              subject_id: questionData.subject_id,
              question_number: questionData.question_number,
              topic_id: questionData.topic_id,
              subtopic_id: questionData.subtopic_id,
              question_type: questionType,
              source_type: validateSourceType(questionData.source_type),
              question_text: questionData.question_text,
              explanation: questionData.explanation,
              difficulty_level: questionData.difficulty_level ? validateDifficultyLevel(questionData.difficulty_level) : undefined,
              marks: questionData.marks,
              negative_marks: questionData.negative_marks,
              is_image_based: questionData.is_image_based,
              image_url: questionData.image_url,
              is_active: questionData.is_active ?? true
            })
            .returning({ question_id: questions.question_id });

          const questionId = insertedQuestion.question_id;

          // Insert question type-specific data
          switch (questionType) {
            case 'MultipleChoice':
              if (questionData.options) {
                await Promise.all(
                  questionData.options.map((option: MultipleChoiceOption) =>
                    tx.insert(multiple_choice_options).values({
                      question_id: questionId,
                      option_number: option.option_number,
                      option_text: option.option_text,
                      is_correct: option.is_correct || false
                    })
                  )
                );
              }
              break;

            case 'AssertionReason':
              if (questionData.assertion_reason) {
                const ar = questionData.assertion_reason; 
                await tx.insert(assertion_reason_questions).values({
                  question_id: questionId,
                  assertion_text: ar.assertion_text,
                  reason_text: ar.reason_text,
                  correct_option: ar.correct_option
                });
            
                // Check for options in both places
                const options = ar.options || questionData.options;
                if (options) {
                  await Promise.all(
                    options.map((option: MultipleChoiceOption) =>
                      tx.insert(multiple_choice_options).values({
                        question_id: questionId,
                        option_number: option.option_number,
                        option_text: option.option_text,
                        is_correct: option.option_number === ar.correct_option
                      })
                    )
                  );
                }
              }
              break;

            case 'Matching':
                // First we need to create the match_columns_questions entry
                // But we need to extract the column headers from the question text
                
                // Create default column headers if not explicitly provided
                const leftHeader = questionData.match_columns?.left_column_header || 'List I';
                const rightHeader = questionData.match_columns?.right_column_header || 'List II';
                
                // Insert the match columns question record
                const [matchColumnsInsert] = await tx
                  .insert(match_columns_questions)
                  .values({
                    question_id: questionId,
                    left_column_header: leftHeader,
                    right_column_header: rightHeader
                  })
                  .returning({ match_id: match_columns_questions.match_id });
              
                const matchId = matchColumnsInsert.match_id;
              
                // Parse match items from question text if not explicitly provided
                // This is a simplified example - you'll need more robust parsing based on your format
                let matchItems = [];
                if (questionData.match_columns?.items) {
                  matchItems = questionData.match_columns.items;
                } else {
                  // Try to extract items from question text
                  // This would need actual parsing logic based on your question format
                  // For example, detecting "List I: A. Rhizopus, B. Ustilago..." pattern
                  
                  // Example parsing logic (simplified):
                  try {
                    // Simple regex to find List I items - this is just an example
                    const listIRegex = /List I:([^.]*?)List II/s;
                    const listIIRegex = /List II:([^.]*?)$/s;
                    
                    const listIMatch = questionData.question_text.match(listIRegex);
                    const listIIMatch = questionData.question_text.match(listIIRegex);
                    
                    if (listIMatch && listIIMatch) {
                      // Parse items like "A. Rhizopus, B. Ustilago..."
                      const listIItems = listIMatch[1].split(',').map(i => i.trim());
                      const listIIItems = listIIMatch[1].split(',').map(i => i.trim());
                      
                      // Match them up - this logic would need to be customized
                      // This is just a simplified example
                      for (let i = 0; i < Math.min(listIItems.length, listIIItems.length); i++) {
                        const leftItem = listIItems[i].match(/(\w+)\.([^,]+)/);
                        const rightItem = listIIItems[i].match(/(\w+)\.([^,]+)/);
                        
                        if (leftItem && rightItem) {
                          matchItems.push({
                            left_item_label: leftItem[1],
                            left_item_text: leftItem[2].trim(),
                            right_item_label: rightItem[1],
                            right_item_text: rightItem[2].trim()
                          });
                        }
                      }
                    }
                  } catch (error) {
                    console.error("Failed to parse match items from question text:", error);
                    // Continue with empty items - log this for review
                  }
                }
              
                // Insert match items
                if (matchItems.length > 0) {
                  await Promise.all(
                    matchItems.map((item) =>
                      tx.insert(match_columns_items).values({
                        match_id: matchId,
                        left_item_label: item.left_item_label,
                        left_item_text: item.left_item_text,
                        right_item_label: item.right_item_label,
                        right_item_text: item.right_item_text
                      })
                    )
                  );
                }
              
                // Insert options - use questionData.options directly 
                if (questionData.options) {
                  await Promise.all(
                    questionData.options.map((option) =>
                      tx.insert(match_columns_options).values({
                        match_id: matchId,
                        option_number: option.option_number,
                        option_text: option.option_text,
                        is_correct: option.is_correct || false
                      })
                    )
                  );
                }
                break;

            case 'MultipleCorrectStatements':
              // Look for statement_based_questions OR statement_based
              const statementBasedData = questionData.statement_based_questions || questionData.statement_based;
              
              if (statementBasedData) {
                const [statementBasedInsert] = await tx
                  .insert(statement_based_questions)
                  .values({
                    question_id: questionId,
                    intro_text: statementBasedData.intro_text,
                    correct_option: statementBasedData.correct_option
                  })
                  .returning({ statement_id: statement_based_questions.statement_id });
            
                const statementId = statementBasedInsert.statement_id;
            
                // Check for statements in both places
                const statementsList = statementBasedData.statements || questionData.statements;
                
                // Insert statements
                if (statementsList && statementsList.length > 0) {
                  await Promise.all(
                    statementsList.map((statement: Statement) =>
                      tx.insert(statements).values({
                        statement_based_id: statementId,
                        statement_number: statement.statement_number,
                        statement_label: statement.statement_label,
                        statement_text: statement.statement_text,
                        is_correct: statement.is_correct || false
                      })
                    )
                  );
                }
            
                // Check for options in both places
                const options = statementBasedData.options || questionData.options;
                
                // Insert options
                if (options) {
                  await Promise.all(
                    options.map((option: MultipleChoiceOption) =>
                      tx.insert(multiple_choice_options).values({
                        question_id: questionId,
                        option_number: option.option_number,
                        option_text: option.option_text,
                        is_correct: option.option_number === statementBasedData.correct_option
                      })
                    )
                  );
                }
              }
              break;
              case 'SequenceOrdering':
                // Look for sequence_ordering_questions in both possible locations
                const sequenceData = questionData.sequence_ordering_questions || questionData.sequence_ordering;
                
                if (sequenceData) {
                  // Convert correct_sequence array to string if needed
                  const correctSequenceStr = typeof sequenceData.correct_sequence === 'object' 
                    ? JSON.stringify(sequenceData.correct_sequence)
                    : sequenceData.correct_sequence;
                  
                  const [sequenceInsert] = await tx
                    .insert(sequence_ordering_questions)
                    .values({
                      question_id: questionId,
                      intro_text: sequenceData.intro_text,
                      correct_sequence: correctSequenceStr
                    })
                    .returning({ sequence_id: sequence_ordering_questions.sequence_id });
              
                  const sequenceId = sequenceInsert.sequence_id;
              
                  // Check for sequence items in both places
                  const sequenceItems = sequenceData.items || questionData.sequence_items;
                  
                  // Insert sequence items
                  if (sequenceItems && sequenceItems.length > 0) {
                    await Promise.all(
                      sequenceItems.map((item) =>
                        tx.insert(sequence_items).values({
                          sequence_id: sequenceId,
                          item_number: item.item_number,
                          item_label: item.item_label,
                          item_text: item.item_text
                        })
                      )
                    );
                  }
                }
                
                // Insert options
                if (questionData.options) {
                  await Promise.all(
                    questionData.options.map((option: MultipleChoiceOption) =>
                      tx.insert(multiple_choice_options).values({
                        question_id: questionId,
                        option_number: option.option_number,
                        option_text: option.option_text,
                        is_correct: option.is_correct || false
                      })
                    )
                  );
                }
                break;  
            // Add other question types as needed
            case 'DiagramBased':
            
              // These types might have their own special handling
              if (questionData.options) {
                await Promise.all(
                  questionData.options.map((option: MultipleChoiceOption) =>
                    tx.insert(multiple_choice_options).values({
                      question_id: questionId,
                      option_number: option.option_number,
                      option_text: option.option_text,
                      is_correct: option.is_correct || false
                    })
                  )
                );
              }
              break;
          }
        });

        insertedCount++;
      } catch (error) {
        console.error('Error inserting question:', error);
        // Store error for reporting
        errors.push({
          question_number: questionData.question_number,
          error: error instanceof Error ? error.message : String(error)
        });
        // Continue with next question even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      total: totalCount,
      inserted: insertedCount,
      failed: totalCount - insertedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process questions', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}