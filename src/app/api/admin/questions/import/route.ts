// src/app/api/admin/questions/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  questions,
  sequence_ordering_questions,
  sequence_items
} from '@/db/schema';
import { questionTypeEnum, questionSourceTypeEnum, difficultyLevelEnum } from '@/db/schema';

// Multiple choice option interface
interface MultipleChoiceOption {
  option_number: string | number;
  option_text: string;
  is_correct: boolean;
}

// Statement interface
interface Statement {
  statement_label: string;
  statement_text: string;
  is_correct: boolean;
}

// Match columns item interface
interface MatchColumnsItem {
  left_item_label: string;
  left_item_text: string;
  right_item_label: string;
  right_item_text: string;
}

// Sequence item interface
interface SequenceItem {
  item_number: number;
  item_label?: string;
  item_text: string;
}

// Question details interface
interface QuestionDetails {
  options?: MultipleChoiceOption[];
  statements?: Statement[];
  assertion_text?: string;
  reason_text?: string;
  left_column_header?: string;
  right_column_header?: string;
  items?: MatchColumnsItem[] | SequenceItem[]; // Can be either type depending on question_type
  intro_text?: string;
  correct_option?: number | string;
  correct_sequence?: string | number[];
}

// New interfaces for handling legacy data
interface AssertionReasonData {
  assertion_text: string;
  reason_text: string;
  correct_option: number;
  options?: MultipleChoiceOption[];
}

interface MatchColumnsData {
  left_column_header?: string;
  right_column_header?: string;
  items?: MatchColumnsItem[];
  options?: MultipleChoiceOption[];
}

interface StatementBasedData {
  intro_text?: string;
  correct_option: number | string;
  statements?: Statement[];
  options?: MultipleChoiceOption[];
}

interface SequenceOrderingData {
  intro_text?: string;
  correct_sequence: string | number[];
  items?: SequenceItem[];
}

// Base question interface 
interface BaseQuestionData {
  paper_id: number;
  subject_id: number;
  question_number: number;
  topic_id: number;
  subtopic_id?: number;
  question_type: string;
  source_type?: string;
  question_text: string;
  explanation?: string;
  difficulty_level?: string;
  marks?: number;
  negative_marks?: number;
  is_active?: boolean;
  details?: QuestionDetails;
}

// Complete question data interface with legacy fields
interface QuestionData extends BaseQuestionData {
  options?: MultipleChoiceOption[];
  statements?: Statement[];
  assertion_reason?: AssertionReasonData;
  match_columns?: MatchColumnsData;
  statement_based?: StatementBasedData;
  statement_based_questions?: StatementBasedData;
  sequence_ordering?: SequenceOrderingData;
  sequence_ordering_questions?: SequenceOrderingData;
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

function processQuestionData(questionData: QuestionData): QuestionData {
  // Create a processed version of the question data with properly structured details
  const processedQuestion: QuestionData = {
    ...questionData,
    details: questionData.details || {}
  };

  const questionType = validateQuestionType(questionData.question_type);

  // If options exists at the top level, move it to details
  if (questionData.options && !processedQuestion.details?.options) {
    processedQuestion.details = {
      ...processedQuestion.details,
      options: questionData.options
    };
  }

  // Handle other data structures based on question type
  switch (questionType) {
    case 'MultipleChoice':
      // Already handled by moving options to details if needed
      break;

    case 'AssertionReason':
      // Move assertion_reason data to details if needed
      if (questionData.assertion_reason) {
        processedQuestion.details = {
          ...processedQuestion.details,
          assertion_text: questionData.assertion_reason.assertion_text,
          reason_text: questionData.assertion_reason.reason_text,
          correct_option: questionData.assertion_reason.correct_option
        };
        
        // If options exist in assertion_reason but not in details
        if (questionData.assertion_reason.options && !processedQuestion.details?.options) {
          processedQuestion.details = {
            ...processedQuestion.details,
            options: questionData.assertion_reason.options
          };
        }
      }
      break;

    case 'Matching':
      // Move match_columns data to details if needed
      if (questionData.match_columns) {
        processedQuestion.details = {
          ...processedQuestion.details,
          left_column_header: questionData.match_columns.left_column_header,
          right_column_header: questionData.match_columns.right_column_header,
          items: questionData.match_columns.items
        };
      }
      break;

    case 'MultipleCorrectStatements':
      // Move statement_based data to details if needed
      const statementBasedData = questionData.statement_based_questions || questionData.statement_based;
      if (statementBasedData) {
        processedQuestion.details = {
          ...processedQuestion.details,
          intro_text: statementBasedData.intro_text,
          correct_option: statementBasedData.correct_option
        };
        
        // If options exist in statement_based but not in details
        if (statementBasedData.options && !processedQuestion.details?.options) {
          processedQuestion.details = {
            ...processedQuestion.details,
            options: statementBasedData.options
          };
        }
      }
      
      // Move statements to details if needed
      if (questionData.statements && !processedQuestion.details?.statements) {
        processedQuestion.details = {
          ...processedQuestion.details,
          statements: questionData.statements
        };
      } else if (statementBasedData && statementBasedData.statements && !processedQuestion.details?.statements) {
        processedQuestion.details = {
          ...processedQuestion.details,
          statements: statementBasedData.statements
        };
      }
      break;

    case 'SequenceOrdering':
      // Move sequence_ordering data to details if needed
      const sequenceData = questionData.sequence_ordering_questions || questionData.sequence_ordering;
      if (sequenceData) {
        processedQuestion.details = {
          ...processedQuestion.details,
          intro_text: sequenceData.intro_text,
          correct_sequence: sequenceData.correct_sequence
        };
        
        // Move items to details if needed - these should be SequenceItem[] for this question type
        if (sequenceData.items && !processedQuestion.details?.items) {
          processedQuestion.details = {
            ...processedQuestion.details,
            items: sequenceData.items as SequenceItem[]
          };
        }
      }
      break;
  }

  return processedQuestion;
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

        // Process the question data to ensure details field is properly structured
        const processedQuestion = processQuestionData(questionData);

        // Start a transaction
        await db.transaction(async (tx) => {
          // Map question type to enum value
          const questionType = validateQuestionType(questionData.question_type);
          
          // Insert the base question with details field
          const [insertedQuestion] = await tx
            .insert(questions)
            .values({
              paper_id: processedQuestion.paper_id,
              subject_id: processedQuestion.subject_id,
              question_number: processedQuestion.question_number,
              topic_id: processedQuestion.topic_id,
              subtopic_id: processedQuestion.subtopic_id,
              question_type: questionType,
              source_type: validateSourceType(processedQuestion.source_type),
              question_text: processedQuestion.question_text,
              explanation: processedQuestion.explanation,
              details: processedQuestion.details || {}, // Insert the processed details field
              difficulty_level: processedQuestion.difficulty_level ? validateDifficultyLevel(processedQuestion.difficulty_level) : undefined,
              marks: processedQuestion.marks,
              negative_marks: processedQuestion.negative_marks,
              is_active: processedQuestion.is_active ?? true
            })
            .returning({ question_id: questions.question_id });

          const questionId = insertedQuestion.question_id;

          // For SequenceOrdering type, we still need to create sequence_ordering_questions and sequence_items
          if (questionType === 'SequenceOrdering' && processedQuestion.details) {
            // Extract sequence data from details
            const sequenceData = processedQuestion.details;
            if (sequenceData.correct_sequence || sequenceData.items) {
              const correctSequenceStr = typeof sequenceData.correct_sequence === 'object' 
                ? JSON.stringify(sequenceData.correct_sequence)
                : sequenceData.correct_sequence?.toString() || '';
              
              const [sequenceInsert] = await tx
                .insert(sequence_ordering_questions)
                .values({
                  question_id: questionId,
                  intro_text: sequenceData.intro_text,
                  correct_sequence: correctSequenceStr
                })
                .returning({ sequence_id: sequence_ordering_questions.sequence_id });
          
              const sequenceId = sequenceInsert.sequence_id;
          
              // Insert sequence items if present
              if (sequenceData.items && Array.isArray(sequenceData.items)) {
                // Check if items are SequenceItem[] by looking for item_number property
                const isSequenceItems = sequenceData.items.length > 0 && 'item_number' in sequenceData.items[0];
                
                if (isSequenceItems) {
                  await Promise.all(
                    (sequenceData.items as SequenceItem[]).map(item =>
                      tx.insert(sequence_items).values({
                        sequence_id: sequenceId,
                        item_number: item.item_number,
                        item_label: item.item_label,
                        item_text: item.item_text
                      })
                    )
                  );
                } else {
                  console.warn('Expected SequenceItem[] but got different item type in sequenceData.items');
                }
              }
            }
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