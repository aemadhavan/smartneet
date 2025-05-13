# Practice Module (`src/app/practice/`)

This module is responsible for handling the user's practice session experience within the SmartNeet application. It allows users to select subjects, topics, or subtopics for practice, answer various types of questions, and review their performance upon completion.

## Key Features

*   **Subject, Topic, and Subtopic Selection**: Users can initiate a practice session by selecting a specific subject, or drill down to a particular topic or subtopic.
*   **Dynamic Question Loading**: Questions are fetched and displayed based on the selected criteria.
*   **Variety of Question Types**: Supports multiple question formats (e.g., Multiple Choice, Assertion-Reason, Diagram-Based, etc.) through dedicated components.
*   **Interactive Session Management**:
    *   Navigation between questions.
    *   Real-time progress tracking.
    *   Submission of answers.
*   **Session Completion and Summary**:
    *   Displays a detailed summary upon session completion, including score, accuracy, time taken, and performance per topic.
    *   Provides recommendations for improvement.
*   **Subscription Limit Integration**: Checks and enforces user subscription limits for practice sessions.
*   **Error Handling and Loading States**: Provides user-friendly feedback during data fetching or in case of errors.

## Core Components

*   **`page.tsx`**: The main entry point for the `/practice` route. It uses React Suspense to handle loading states and renders the `PracticeClientPage`.
*   **`client-page.tsx`**: This is the primary client-side component that orchestrates the entire practice session. It manages:
    *   Fetching subject, topic, and subtopic data.
    *   Initializing and managing the practice session state (current question, user answers, completion status) via the `usePracticeSession` hook.
    *   Handling user interactions like selecting options, moving to the next question, and completing the session.
    *   Displaying different UI states: subject selection, active question, loading, error, and subscription limit notifications.
    *   Rendering the `SessionCompletePage` when a session is finished.
*   **`complete.tsx`**: This component is displayed after a user completes a practice session. It fetches and shows a detailed summary of the session, including:
    *   Overall score and accuracy.
    *   Number of correct and incorrect answers.
    *   Time taken.
    *   Performance breakdown by topic.
    *   Recommendations and options to review answers, start a new session, or go to the dashboard.

## Directory Structure

*   **`components/`**: This directory houses all React components specific to the practice module. It's further organized into:
    *   `debug/`: Contains components used for debugging purposes during development.
        *   `DebugQuestionInfo.tsx`: Likely displays raw question data or internal state for easier debugging.
    *   `questions/`: Contains components responsible for rendering various types of questions. Each question type typically has its own component.
        *   `QuestionDisplay.tsx`: A central component that likely acts as a wrapper or dispatcher to render the correct question component based on `question_type`.
        *   `MultipleChoiceQuestion.tsx`: Renders multiple-choice questions.
        *   `MatchingQuestion.tsx`: Renders questions that require matching items from two lists.
        *   `AssertionReasonQuestion.tsx`: Renders assertion-reason type questions.
        *   `MultipleCorrectStatementsQuestion.tsx`: Renders questions where multiple statements can be correct.
        *   `SequenceOrderingQuestion.tsx`: Renders questions that require ordering items in a sequence.
        *   `DiagramBasedQuestion.tsx`: Renders questions that are based on a diagram or image.
        *   `index.ts`: Exports all components from this subdirectory for easier importing.
    *   `ui/`: Contains general-purpose UI components used throughout the practice module.
        *   `SubjectSelector.tsx`: Allows users to select a subject for their practice session.
        *   `QuestionNavigator.tsx`: Provides UI for navigating between questions in a session (e.g., a list of question numbers).
        *   `LoadingSpinner.tsx`: A reusable component to indicate loading states.
        *   `ErrorDisplay.tsx`: A component to display error messages to the user.
        *   `ProgressBar.tsx`: Displays the user's progress through the practice session.
        *   `OptionButton.tsx`: A styled button component, likely used for answer options.
        *   `DiagramDisplay.tsx`: A component specifically for displaying diagrams or images associated with questions.
        *   `index.ts`: Exports all components from this subdirectory.

*   **`hooks/`**: This directory contains custom React hooks that encapsulate stateful logic and side effects, making components cleaner and logic reusable.
    *   `useSubjects.ts`: A hook responsible for fetching and managing the list of available subjects, including the currently selected subject.
    *   `usePracticeSession.ts`: A core hook that manages the entire lifecycle of a practice session. This includes:
        *   Creating a new session (fetching questions based on subject, topic, or subtopic).
        *   Tracking the current question index.
        *   Storing user answers.
        *   Handling option selection.
        *   Managing navigation (next/previous question).
        *   Determining session completion.
        *   Handling subscription limit errors.
    *   `useQuestionDetails.ts`: This hook likely fetches or processes detailed information for a specific question, potentially handling normalization or specific display logic.
    *   `index.ts`: Exports all hooks from this subdirectory.

*   **`types/`**: This directory defines TypeScript interfaces and types used throughout the practice module, ensuring data consistency and providing autocompletion/type-checking benefits.
    *   `index.ts`: Exports all types. Key types include:
        *   `Subject`: Defines the structure for a subject (ID, name, code).
        *   `Question`: A comprehensive interface defining the structure of a question, including its ID, text, type (`QuestionType`), details (which can be a string or a `QuestionDetails` object), explanation, difficulty, marks, topic/subtopic info, and image-related properties.
        *   `SessionResponse`: Defines the expected response structure when fetching a new session (session ID and an array of `Question` objects).
        *   `QuestionType`: An enum-like union type for all supported question types (e.g., 'MultipleChoice', 'Matching').
        *   `DifficultyLevel`: An enum-like union type for difficulty levels ('easy', 'medium', 'hard').
        *   Specific `Details` interfaces for each question type (e.g., `MultipleChoiceDetails`, `MatchingDetails`, `AssertionReasonDetails`, `SequenceOrderingDetails`, `DiagramBasedDetails`). These define the structure of the `details` property for each `QuestionType`.
        *   Helper types like `MultipleChoiceOption`, `MatchingItem`, `Statement`, `SequenceItem`, `QuestionOption`, `DiagramLabel`.
        *   `QuestionDetails`: A union type representing all possible specific detail structures.

*   **`utils/`**: This directory contains utility functions that provide helper logic for the practice module.
    *   `questionUtils.ts`: A crucial file containing functions for processing and normalizing question data. This includes:
        *   `parseJsonDetails`: Parses JSON strings found in question details.
        *   `extractStatementsFromText`, `parseMatchingQuestion`, `extractSequenceItemsFromText`, `extractDiagramLabelsFromText`: Functions to extract specific information from the raw question text if it's not available in a structured format within the `details` JSON. This is important for handling legacy data or variations in data structure.
        *   `normalizeAssertionReasonDetails`, `normalizeSequenceOrderingDetails`, `normalizeMultipleCorrectStatementsDetails`, `normalizeMatchingDetails`, `normalizeDiagramBasedDetails`: A set of functions dedicated to transforming the raw `details` of a question (which might be a string or a loosely structured object) into a consistent, well-defined `QuestionDetails` object specific to its `QuestionType`. This ensures that components receive data in a predictable format.
        *   `normalizeQuestionDetails`: A higher-level function that dispatches to the appropriate normalization function based on the `questionType`.

## Workflow Overview

1.  User navigates to the practice section (potentially with pre-selected subject/topic/subtopic via URL parameters).
2.  `page.tsx` loads `client-page.tsx`.
3.  `client-page.tsx`:
    *   If no subject is selected, it displays the `SubjectSelector` component.
    *   Once a subject is selected (or if provided via params), it checks subscription limits using `useSubscriptionLimits`.
    *   If limits allow, it initializes a practice session using `usePracticeSession`, fetching relevant questions.
    *   It then renders the `QuestionDisplay` component for the current question, along with navigation controls (`QuestionNavigator`, next/previous buttons).
    *   User answers questions, and `usePracticeSession` updates the state.
    *   When the user completes the session (or all questions are answered), `sessionCompleted` becomes true.
4.  If `sessionCompleted` is true, `client-page.tsx` renders `SessionCompletePage`.
5.  `SessionCompletePage` fetches and displays the session summary and provides options for next steps.

This module is crucial for the core learning experience, providing users with the tools to test and improve their knowledge.
