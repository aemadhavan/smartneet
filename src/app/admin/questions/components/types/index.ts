export type Subject = {
    subject_id: number;
    subject_name: string;
  };
  
  export type Topic = {
    topic_id: number;
    subject_id: number; // Changed from string to number
    topic_name: string;
    parent_topic_id: number | null;
    description: string | null;
    is_active: boolean;
  };
  
  export type Subtopic = {
    subtopic_id: number;
    topic_id: number;
    subtopic_name: string;
  };
  export type QuestionPaper = {
    paper_id: number;
    paper_year: number;
    paper_code: string | null;
    subject: string;
    section: string | null;
  };
  export type Question = {
    question_id: number;
    paper_id: number | null;
    question_number: number;
    topic_id: number | null;
    subtopic_id: number | null;
    question_type: string;
    question_text: string;
    explanation: string | null;
    difficulty_level: string;
    marks: number;
    is_image_based: boolean;
    image_url: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  export type QuestionsFiltersProps = {
   subjects: Subject[];
   topics: Topic[];
   subtopics: Subtopic[];
   papers: QuestionPaper[];
   questionTypes: string[];
   selectedSubject: string;
   selectedTopic: number | null;
   selectedSubtopic: number | null;
   selectedPaperId: number | null;
   selectedType: string;
   currentPaper?: QuestionPaper | null;
   onSubjectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
   onTopicChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
   onSubtopicChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
   onPaperChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
   onTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
 };

 export const QUESTION_TYPES = [
    'MultipleChoice',
    'Matching',
    'MultipleCorrectStatements',
    'AssertionReason',
    'DiagramBased',
    'SequenceOrdering'
  ];
  
  export const DIFFICULTY_LEVELS  = ['easy', 'medium', 'hard', 'very-hard'];