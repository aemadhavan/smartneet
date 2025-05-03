// src/app/admin/biology/questions/components/QuestionFormTypes.tsx
import * as z from "zod";

// Define form schema based on question structure
export const questionFormSchema = z.object({
  // Basic info
  subject_id: z.coerce.number().min(1, "Subject is required"),
  topic_id: z.coerce.number().min(1, "Topic is required"),
  subtopic_id: z.coerce.number().optional(),
  paper_id: z.coerce.number().optional(),
  question_number: z.coerce.number().min(1, "Question number is required"),
  
  // Question content
  question_text: z.string().min(5, "Question text is required"),
  question_type: z.enum([
    "MultipleChoice", 
    "Matching", 
    "MultipleCorrectStatements", 
    "AssertionReason", 
    "DiagramBased", 
    "SequenceOrdering"
  ]),
  source_type: z.enum(["PreviousYear", "AI_Generated", "Other"]),
  explanation: z.string().optional(),
  
  // Metadata
  difficulty_level: z.enum(["easy", "medium", "hard"]),
  marks: z.coerce.number().min(1, "Marks are required"),
  negative_marks: z.coerce.number().default(0),
  is_image_based: z.boolean().default(false),
  image_url: z.string().optional(),
  is_active: z.boolean().default(true),
});

// Explicitly define the type from the zod schema
export type QuestionFormValues = z.infer<typeof questionFormSchema>;

// Define types for data models
export interface Topic {
  topic_id: number;
  topic_name: string;
}

export interface Subtopic {
  subtopic_id: number;
  topic_id: number;
  subtopic_name: string;
}