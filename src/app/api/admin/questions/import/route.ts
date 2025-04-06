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
  statements
} from '@/db/schema';
// Base question interface
interface BaseQuestionData {
  paper_id: number;
  question_number: number;
  topic_id?: number;
  subtopic_id?: number;
  question_type: string;
  question_text: string;
  explanation?: string;
  difficulty_level?: string;
  marks?: number;
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

// Complete question data interface
interface QuestionData extends BaseQuestionData {
  options?: MultipleChoiceOption[];
  assertion_reason?: AssertionReasonData;
  match_columns?: MatchColumnsData;
  statement_based?: StatementBasedData;
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
    let questionsData: QuestionData[] ;
    
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

    for (const questionData of questionsData) {
      try {
        // Start a transaction
        await db.transaction(async (tx) => {
          // Insert the base question
          const [insertedQuestion] = await tx
            .insert(questions)
            .values({
              paper_id: questionData.paper_id,
              question_number: questionData.question_number,
              topic_id: questionData.topic_id,
              subtopic_id: questionData.subtopic_id,
              question_type: questionData.question_type.toLowerCase(),
              question_text: questionData.question_text,
              explanation: questionData.explanation,
              difficulty_level: questionData.difficulty_level,
              marks: questionData.marks,
              is_image_based: questionData.is_image_based,
              image_url: questionData.image_url,
              is_active: questionData.is_active
            })
            .returning({ question_id: questions.question_id });

          const questionId = insertedQuestion.question_id;

          // Insert question type-specific data
          switch (questionData.question_type.toLowerCase()) {
            case 'multiple_choice':
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

            case 'assertion_reason':
              if (questionData.assertion_reason) {
                const ar = questionData.assertion_reason; 
                await tx.insert(assertion_reason_questions).values({
                  question_id: questionId,
                  assertion_text: ar.assertion_text,
                  reason_text: ar.reason_text,
                  correct_option: ar.correct_option
                });

                if (questionData.assertion_reason.options) {
                  await Promise.all(
                    questionData.assertion_reason.options.map((option: MultipleChoiceOption) =>
                      tx.insert(multiple_choice_options).values({
                        question_id: questionId,
                        option_number: option.option_number,
                        option_text: option.option_text,
                        is_correct: option.option_number === questionData.assertion_reason!.correct_option
                      })
                    )
                  );
                }
              }
              break;

            case 'match_columns':
              if (questionData.match_columns) {
                const [matchColumnsInsert] = await tx
                  .insert(match_columns_questions)
                  .values({
                    question_id: questionId,
                    left_column_header: questionData.match_columns.left_column_header,
                    right_column_header: questionData.match_columns.right_column_header
                  })
                  .returning({ match_id: match_columns_questions.match_id });

                const matchId = matchColumnsInsert.match_id;

                // Insert match items
                if (questionData.match_columns.items) {
                  await Promise.all(
                    questionData.match_columns.items.map((item: MatchColumnsItem) =>
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

                // Insert match options
                if (questionData.match_columns.options) {
                  await Promise.all(
                    questionData.match_columns.options.map((option: MatchColumnsOption) =>
                      tx.insert(match_columns_options).values({
                        match_id: matchId,
                        option_number: option.option_number,
                        option_text: option.option_text,
                        is_correct: option.is_correct || false
                      })
                    )
                  );
                }
              }
              break;

            case 'statement_based':
              if (questionData.statement_based) {
                await tx.insert(statement_based_questions).values({
                  question_id: questionId,
                  intro_text: questionData.statement_based.intro_text,
                  correct_option: questionData.statement_based.correct_option
                });

                // Insert statements
                if (questionData.statement_based.statements) {
                  await Promise.all(
                    questionData.statement_based.statements.map((statement: Statement) =>
                      tx.insert(statements).values({
                        question_id: questionId,
                        statement_number: statement.statement_number,
                        statement_text: statement.statement_text,
                        is_correct: statement.is_correct || false
                      })
                    )
                  );
                }

                // Insert options
                if (questionData.statement_based.options) {
                  await Promise.all(
                    questionData.statement_based.options.map((option: MultipleChoiceOption) =>
                      tx.insert(multiple_choice_options).values({
                        question_id: questionId,
                        option_number: option.option_number,
                        option_text: option.option_text,
                        is_correct: option.option_number === questionData.statement_based!.correct_option
                      })
                    )
                  );
                }
              }
              break;
          }
        });

        insertedCount++;
      } catch (error) {
        console.error('Error inserting question:', error);
        // Continue with next question even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      total: totalCount,
      inserted: insertedCount
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process questions' },
      { status: 500 }
    );
  }
}