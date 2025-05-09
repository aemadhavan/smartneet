// File: src/app/practice/utils/questionUtils.ts

import { 
  AssertionReasonDetails, 
  SequenceOrderingDetails, 
  MultipleCorrectStatementsDetails, 
  MatchingDetails,
  DiagramBasedDetails,
  QuestionDetails,
  DiagramLabel,
  // Added for stronger typing in normalizers
  QuestionOption,
  Statement,
  SequenceItem,
  MatchingItem,
} from '@/app/practice/types';

// Raw types for parsing potentially unnormalized details
type RawAssertionReasonDetails = {
  statements?: Statement[];
  options?: QuestionOption[];
  assertion_reason_details?: {
    assertion_text?: string;
    reason_text?: string;
  };
  assertion_text?: string;
  reason_text?: string;
};

type RawSequenceOrderingDetails = {
  options?: QuestionOption[];
  sequence_details?: {
    intro_text?: string;
    items?: SequenceItem[] | null;
  };
  intro_text?: string;
  sequence_items?: SequenceItem[] | null;
};

type RawMultipleCorrectStatementsDetails = Partial<MultipleCorrectStatementsDetails> & {
  // For old format, if not nested under statement_details
  statements?: Statement[];
  intro_text?: string;
};

type RawMatchingDetails = Partial<MatchingDetails> & {
  // For old format, if not nested under matching_details
  items?: MatchingItem[];
  left_column_header?: string;
  right_column_header?: string;
};

/**
 * Parses JSON string or returns the object if already parsed
 */
export const parseJsonDetails = <T>(details: string | T): T | null => {
  if (typeof details === 'string') {
    try {
      const parsed = JSON.parse(details);
      // Check if the result is still a string (double-encoded JSON)
      if (typeof parsed === 'string') {
        return JSON.parse(parsed);
      }
      return parsed as T;
    } catch (e) {
      console.error('Error parsing JSON details:', e);
      return null;
    }
  }
  return details;
};

/**
 * Extracts statements from question text for assertion-reason questions
 * when they're not explicitly included in the details
 */
export const extractStatementsFromText = (questionText: string): { label: string; text: string }[] => {
  const statements: { label: string; text: string }[] = [];
  
  // Look for patterns like "Statement I: [text]" and "Statement II: [text]"
  const statementIMatch = questionText.match(/Statement\s+I:?\s*(.*?)(?=Statement\s+II:|$)/s);
  const statementIIMatch = questionText.match(/Statement\s+II:?\s*(.*?)(?=In the light of|$)/s);
  
  if (statementIMatch && statementIMatch[1]) {
    statements.push({
      label: 'I',
      text: statementIMatch[1].trim()
    });
  }
  
  if (statementIIMatch && statementIIMatch[1]) {
    statements.push({
      label: 'II',
      text: statementIIMatch[1].trim()
    });
  }
  
  return statements;
};

/**
 * Parses a matching question text to extract List I and List II items
 */
export const parseMatchingQuestion = (questionText: string): {
  listI: { label: string; text: string }[];
  listII: { label: string; text: string }[];
} => {
  const listI: { label: string; text: string }[] = [];
  const listII: { label: string; text: string }[] = [];
  
  // Extract List I items (typically labeled with letters A, B, C, etc.)
  const listIRegex = /([A-Z])\.\s+([^,\.]+)(?:,|\.|$)/g;
  let match;
  
  // Only try to parse if 'List I:' is found in the question text
  if (questionText.includes('List I:')) {
    const listIText = questionText.substring(questionText.indexOf('List I:'));
    
    while ((match = listIRegex.exec(listIText)) !== null) {
      listI.push({
        label: match[1],
        text: match[2].trim()
      });
    }
  }
  
  // Extract List II items (typically labeled with Roman numerals I, II, III, etc.)
  const listIIRegex = /([I]{1,4}|IV|V[I]{0,3})\.\s+([^,\.]+)(?:,|\.|$)/g;
  
  // Only try to parse if 'List II:' is found in the question text
  if (questionText.includes('List II:')) {
    const listIIText = questionText.substring(questionText.indexOf('List II:'));
    
    while ((match = listIIRegex.exec(listIIText)) !== null) {
      listII.push({
        label: match[1],
        text: match[2].trim()
      });
    }
  }
  
  return { listI, listII };
};

/**
 * Normalizes an assertion-reason question to have the expected format
 */
export const normalizeAssertionReasonDetails = (
  details: string | Record<string, unknown>, 
  questionText: string
): AssertionReasonDetails | null => {
  const parsedDetails = parseJsonDetails<RawAssertionReasonDetails>(details);
  
  if (!parsedDetails) {
    return null;
  }
  
  // If details already has the correct structure with statements and options
  if (parsedDetails.statements && Array.isArray(parsedDetails.statements) &&
      parsedDetails.options && Array.isArray(parsedDetails.options)) {
    return parsedDetails as AssertionReasonDetails;
  }
  
  // Handle new format with assertion_reason_details
  if (parsedDetails.options && Array.isArray(parsedDetails.options) &&
      parsedDetails.assertion_reason_details && 
      typeof parsedDetails.assertion_reason_details === 'object') {
    
    const assertionTextFull = parsedDetails.assertion_reason_details.assertion_text || '';
    const reasonTextFull = parsedDetails.assertion_reason_details.reason_text || '';
    
    // Extract only the assertion part from assertion_text for the 'A' statement
    // and only the reason part from reason_text for the 'R' statement
    const assertionOnlyText = (assertionTextFull.split('\n')[0] || '').replace(/^Assertion \(A\): /i, '').trim();
    const reasonOnlyText = reasonTextFull.replace(/^Reason \(R\): /i, '').trim();

    const statements = [
      {
        statement_label: 'A',
        statement_text: assertionOnlyText
      },
      {
        statement_label: 'R',
        statement_text: reasonOnlyText
      }
    ];
    
    return {
      statements,
      options: parsedDetails.options
    };
  }
  
  // Handle old format with assertion_text and reason_text at root level
  if (parsedDetails.options && Array.isArray(parsedDetails.options) &&
      parsedDetails.assertion_text && parsedDetails.reason_text) {
    
    const statements = [
      {
        statement_label: 'A',
        statement_text: (parsedDetails.assertion_text || '').replace(/^Assertion \(A\): /i, '').trim()
      },
      {
        statement_label: 'R',
        statement_text: (parsedDetails.reason_text || '').replace(/^Reason \(R\): /i, '').trim()
      }
    ];
    
    return {
      statements,
      options: parsedDetails.options
    };
  }
  
  // If we have options but no statements, try to extract them from question text
  if (parsedDetails.options && Array.isArray(parsedDetails.options)) {
    const extractedStatements = extractStatementsFromText(questionText);
    
    if (extractedStatements.length > 0) {
      return {
        statements: extractedStatements.map(s => ({
          statement_label: s.label,
          statement_text: s.text
        })),
        options: parsedDetails.options
      };
    }
  }
  
  return null;
};

/**
 * Extracts sequence items from question text.
 * Example: "A. Item 1", "B. Item 2" or "I. Item 1", "II. Item 2"
 * This version iterates through lines and applies a regex to each.
 */
export const extractSequenceItemsFromText = (questionText: string): { item_number: string; item_text: string }[] => {
  const items: { item_number: string; item_text: string }[] = [];
  const lines = questionText.split('\n');
  // Regex for lines starting with a label (A., 1., I.) followed by text.
  const itemPattern = /^\s*(?:([A-Z])\.|([0-9]+)\.|([IVXLCDM]+)\.)\s*(.+)/;
  let match;

  for (const line of lines) {
    match = line.match(itemPattern);
    if (match) {
      const item_number = match[1] || match[2] || match[3]; // Captured A-Z, 0-9, or Roman numeral
      const item_text = match[4].trim();
      
      if (item_number && item_text) {
        // Basic validation to avoid overly long captures or accidental matches of options.
        if (item_text.length > 0 && item_text.length < 250 && !item_text.toLowerCase().includes("all of the above") && !item_text.toLowerCase().includes("none of the above")) {
          items.push({ item_number, item_text });
        }
      }
    }
  }
  return items;
};

/**
 * Normalizes a sequence-ordering question to have the expected format.
 * It prioritizes items from `details` JSON, then falls back to parsing `questionText`.
 */
export const normalizeSequenceOrderingDetails = (details: string | Record<string, unknown>, questionText: string): SequenceOrderingDetails | null => {
  const parsedDetails = parseJsonDetails<RawSequenceOrderingDetails>(details); 
  
  if (!parsedDetails) {
    return null;
  }
  
  let introText: string | undefined = undefined;
  let sequenceItems: { item_number: string; item_text: string }[] = [];
  let options: QuestionOption[] | undefined = undefined;

  if (parsedDetails.options && Array.isArray(parsedDetails.options)) {
    options = parsedDetails.options;
  } else {
    console.warn('SequenceOrderingDetails: Missing options array.', parsedDetails);
    return null; // Options are essential
  }

  // Get introText
  if (parsedDetails.sequence_details && typeof parsedDetails.sequence_details === 'object') {
    introText = parsedDetails.sequence_details.intro_text;
  } else { 
    introText = parsedDetails.intro_text; // Old format or already normalized
  }

  // Determine sequenceItems:
  // Priority:
  // 1. Explicit items in `details` JSON (new `sequence_details.items` or old `sequence_items`).
  //    If this is an array (even empty), it's considered definitive from `details`.
  // 2. If `details` does not provide an array for items (e.g., field is missing, null, or not an array),
  //    then fall back to parsing `questionText`.

  let itemsFoundInDetailsJson = false;
  if (parsedDetails.sequence_details && typeof parsedDetails.sequence_details === 'object') { // New DB format
    if (parsedDetails.sequence_details.items !== undefined) { // Key 'items' exists
      if (Array.isArray(parsedDetails.sequence_details.items)) {
        sequenceItems = parsedDetails.sequence_details.items; // Use it, even if empty array
        itemsFoundInDetailsJson = true;
      } else if (parsedDetails.sequence_details.items === null) {
        // items is explicitly null, means no items from details, allow fallback
        itemsFoundInDetailsJson = false; 
      } else {
        // items is present but not an array and not null (malformed)
        console.warn('SequenceOrderingDetails: sequence_details.items is malformed.', parsedDetails.sequence_details.items);
        itemsFoundInDetailsJson = false; // Treat as no valid items from details
      }
    }
    // If 'items' key is undefined, itemsFoundInDetailsJson remains false.
  } else if (parsedDetails.sequence_items !== undefined) { // Old DB format or already normalized with sequence_items at root
     if (Array.isArray(parsedDetails.sequence_items)) {
        sequenceItems = parsedDetails.sequence_items; // Use it, even if empty array
        itemsFoundInDetailsJson = true;
     } else if (parsedDetails.sequence_items === null) {
        // sequence_items is explicitly null
        itemsFoundInDetailsJson = false;
     } else {
        console.warn('SequenceOrderingDetails: sequence_items is malformed.', parsedDetails.sequence_items);
        itemsFoundInDetailsJson = false;
     }
  }
  // If itemsFoundInDetailsJson is false (meaning details didn't provide a definitive array, or provided null),
  // then try parsing questionText.
  if (!itemsFoundInDetailsJson && questionText) {
    const extractedItems = extractSequenceItemsFromText(questionText);
    // extractedItems will be an array (possibly empty if no items found in text)
    sequenceItems = extractedItems; 
  }
  
  // introText is sourced only from parsedDetails (new or old format) as determined above.
  // If not present in details, it will be undefined, and component will use its default.

  if (!options) { // Should have been caught earlier, but as a safeguard.
    console.warn('Could not normalize SequenceOrderingDetails: options are missing.');
    return null;
  }

  return {
    intro_text: introText,
    sequence_items: sequenceItems,
    options: options,
  } as SequenceOrderingDetails;
};

/**
 * Normalizes a multiple-correct-statements question to have the expected format
 */
export const normalizeMultipleCorrectStatementsDetails = (
  details: string | Record<string, unknown>,
  questionText: string
): MultipleCorrectStatementsDetails | null => {
  const parsedDetails = parseJsonDetails<RawMultipleCorrectStatementsDetails>(
    details
  );
  
  if (!parsedDetails) {
    return null;
  }
  
  // Handle new format
  if (parsedDetails.options && Array.isArray(parsedDetails.options) &&
      parsedDetails.statement_details && typeof parsedDetails.statement_details === 'object' &&
      Array.isArray(parsedDetails.statement_details.statements)) {
    // Ensure all properties of MultipleCorrectStatementsDetails are present if asserting
    // Or ensure the Raw type is compatible enough or cast specific parts
    return {
        options: parsedDetails.options,
        statement_details: parsedDetails.statement_details
    } as MultipleCorrectStatementsDetails;
  }
  
  // Handle old format (for backward compatibility during migration)
  if (parsedDetails.options && Array.isArray(parsedDetails.options) &&
      parsedDetails.statements && Array.isArray(parsedDetails.statements) &&
      typeof parsedDetails.intro_text === 'string') {
    
    return {
      options: parsedDetails.options,
      statement_details: {
        intro_text: parsedDetails.intro_text,
        statements: parsedDetails.statements
      }
    } as MultipleCorrectStatementsDetails;
  }
  
  // If we have options but no statements, try to extract them from question text
  if (parsedDetails.options && Array.isArray(parsedDetails.options)) {
    const extractedStatements = extractStatementsFromText(questionText);
    
    if (extractedStatements.length > 0) {
      return {
        options: parsedDetails.options,
        statement_details: {
          intro_text: questionText, // Fallback to full question text if intro_text is missing
          statements: extractedStatements.map(s => ({
            statement_label: s.label,
            statement_text: s.text,
            // Ensure all properties of Statement are present, even if with default/inferred values
            is_correct: false, // This might need adjustment based on how correctness is determined
            statement_number: 0 // This might need adjustment based on how numbering is determined
          }))
        }
      } as MultipleCorrectStatementsDetails;
    }
  }
  
  return null;
};

/**
 * Normalizes a matching question to have the expected format
 */
export const normalizeMatchingDetails = (
  details: string | Record<string, unknown>,
  questionText: string
): MatchingDetails | null => {
  const parsedDetails = parseJsonDetails<RawMatchingDetails>(details);
  
  if (!parsedDetails) {
    return null;
  }
  
  // If details already has the correct new structure
  if (
    parsedDetails.options && Array.isArray(parsedDetails.options) &&
    parsedDetails.matching_details && typeof parsedDetails.matching_details === 'object' &&
    parsedDetails.matching_details.items && Array.isArray(parsedDetails.matching_details.items)
  ) {
    // Ensure the cast is safe or that RawMatchingDetails is sufficiently compatible
     return {
        options: parsedDetails.options,
        matching_details: parsedDetails.matching_details
     } as MatchingDetails;
  }

  // If we have options, check for old structure or parse from text
  if (parsedDetails.options && Array.isArray(parsedDetails.options)) {
    // Check if it's the old structure (items, left_column_header, right_column_header directly under parsedDetails)
    // This is a transitional step to support old data format before migration
    if (parsedDetails.items && Array.isArray(parsedDetails.items)) {
      return {
        options: parsedDetails.options, 
        matching_details: {
          items: parsedDetails.items,
          left_column_header: parsedDetails.left_column_header || "List I",
          right_column_header: parsedDetails.right_column_header || "List II",
        },
      } as MatchingDetails;
    }

    // If not the old structure with items, try to parse items from questionText
    const { listI, listII } = parseMatchingQuestion(questionText);
    
    if (listI.length > 0 && listII.length > 0) {
      const items = listI.slice(0, Math.min(listI.length, listII.length)).map((leftItem, index) => ({
        left_item_label: leftItem.label,
        left_item_text: leftItem.text,
        right_item_label: listII[index].label,
        right_item_text: listII[index].text
      }));
      
      return {
        options: parsedDetails.options,
        matching_details: {
          items,
          left_column_header: "List I",
          right_column_header: "List II"
        }
      };
    }
  }
  
  return null;
};

/**
 * Extract diagram labels from question text without relying on hardcoded values
 * This implementation focuses on pattern recognition within the text
 */
export const extractDiagramLabelsFromText = (questionText: string): DiagramLabel[] => {
  const labels: DiagramLabel[] = [];
  
  // Try multiple pattern matching approaches to extract labels
  
  // Approach 1: Look for standard label patterns (A - Text, B - Text)
  const standardLabelPattern = /([A-Z]|[0-9]+)[\s\-\.:]+([^\n;,]+)(?=[,;\n]|$)/g;
  let match;
  let matchFound = false;
  
  while ((match = standardLabelPattern.exec(questionText)) !== null) {
    // Validate that we have a proper label (not just random text with letters)
    if (match[1] && match[2] && match[2].trim().length > 1) {
      labels.push({
        label_id: match[1],
        label_text: match[2].trim()
      });
      matchFound = true;
    }
  }
  
  if (matchFound) {
    return labels;
  }
  
  // Approach 2: Look for structured lists (often in biology questions)
  // Example: "A. X B. Y C. Z" or "1. X 2. Y 3. Z"
  const listItemPattern = /(?:^|\n|\s)([A-Z]|[0-9]+)\.\s+([^\.]+?)(?=(?:\s+[A-Z]\.)|\s+[0-9]+\.|\n|$)/g;
  matchFound = false;
  
  while ((match = listItemPattern.exec(questionText)) !== null) {
    if (match[1] && match[2] && match[2].trim().length > 1) {
      labels.push({
        label_id: match[1],
        label_text: match[2].trim()
      });
      matchFound = true;
    }
  }
  
  if (matchFound) {
    return labels;
  }
  
  // Approach 3: Look for consistent patterns of label references within text
  // This helps when the labels are mentioned within the text but not defined in a list
  const labelReferences = new Map<string, string[]>();
  
  // Match pattern: "Label X is/refers to/represents [description]"
  const referencePattern = /(?:label|part|structure|component|region|area)\s+([A-Z]|[0-9]+)\s+(?:is|refers to|represents|shows|indicates)\s+(?:the|a|an)?\s+([^\.;,]+)/gi;
  
  while ((match = referencePattern.exec(questionText)) !== null) {
    const labelId = match[1];
    const description = match[2].trim();
    
    if (!labelReferences.has(labelId)) {
      labelReferences.set(labelId, []);
    }
    labelReferences.get(labelId)?.push(description);
  }
  
  // If we found label references, convert them to labels
  if (labelReferences.size > 0) {
    for (const [labelId, descriptions] of labelReferences.entries()) {
      // Use the most common description if there are multiple
      const description = descriptions[0];
      labels.push({
        label_id: labelId,
        label_text: description
      });
    }
    return labels;
  }
  
  // Approach 4: Check for option-based questions that refer to diagram parts
  // For example: "Which of the following is true about part A?"
  const partMentionPattern = /part\s+([A-Z]|[0-9]+)/gi;
  const mentionedParts = new Set<string>();
  
  while ((match = partMentionPattern.exec(questionText)) !== null) {
    mentionedParts.add(match[1]);
  }
  
  if (mentionedParts.size > 0) {
    // Create generic labels for mentioned parts
    for (const part of mentionedParts) {
      labels.push({
        label_id: part,
        label_text: `Part ${part}`
      });
    }
    return labels;
  }
  
  // Approach 5: If the question mentions a diagram or figure at all,
  // generate generic alphabetical labels as a fallback
  if (questionText.toLowerCase().includes('diagram') || 
      questionText.toLowerCase().includes('figure') || 
      questionText.toLowerCase().includes('illustration')) {
    
    // Alphabetical labels are commonly used in biology diagrams
    for (let i = 0; i < 4; i++) {
      const labelChar = String.fromCharCode(65 + i); // A, B, C, D
      labels.push({
        label_id: labelChar,
        label_text: `Part ${labelChar}`
      });
    }
    return labels;
  }
  
  // If all approaches fail, return an empty array rather than hardcoded values
  return [];
};

/**
 * Normalizes a diagram-based question to have the expected format
 */
export const normalizeDiagramBasedDetails = (
  details: string | Record<string, unknown>,
  imageUrl: string | null,
  questionText: string
): DiagramBasedDetails | null => {
  // Try to parse the details
  const parsedDetails = parseJsonDetails<Partial<DiagramBasedDetails>>(details);
  
  if (!parsedDetails) {
    console.log('Failed to parse diagram details:', details);
    return null;
  }
  
  // If details already has the complete structure, just return it
  if (parsedDetails.diagram_url &&
      parsedDetails.options && Array.isArray(parsedDetails.options)) {
    // Ensure diagram_details is preserved if it exists
    return {
      ...parsedDetails,
      diagram_details: parsedDetails.diagram_details,
    } as DiagramBasedDetails;
  }
  
  // Start building normalized details
  const normalizedDetails: Partial<DiagramBasedDetails> = {};
  
  // Add diagram URL (from details or from passed imageUrl)
  normalizedDetails.diagram_url = parsedDetails.diagram_url || 
                                 imageUrl || 
                                 '/images/diagrams/placeholder.jpg';
  
  // Add options if they exist in parsed details
  if (parsedDetails.options && Array.isArray(parsedDetails.options)) {
    normalizedDetails.options = parsedDetails.options;
  } else {
    // If no options, we can't proceed
    console.log('Missing options in diagram question details');
    return null;
  }
  
  // Add labels if they exist in parsed details, otherwise try to extract them from question text
  if (parsedDetails.labels && Array.isArray(parsedDetails.labels) && parsedDetails.labels.length > 0) {
    normalizedDetails.labels = parsedDetails.labels;
  } else {
    // Try to extract labels from question text
    const extractedLabels = extractDiagramLabelsFromText(questionText);
    
    // Only add extracted labels if we actually found some
    if (extractedLabels.length > 0) {
      normalizedDetails.labels = extractedLabels;
    }
    // It's okay if we don't have labels - they're optional in the DiagramBasedDetails type
  }

  // Add diagram_details if it exists in parsed details
  if (parsedDetails.diagram_details) {
    normalizedDetails.diagram_details = parsedDetails.diagram_details;
  }
  
  return normalizedDetails as DiagramBasedDetails;
};

/**
 * Normalizes question details based on the question type
 */
export const normalizeQuestionDetails = (
  details: string | Record<string, unknown>, 
  questionType: string,
  questionText: string,
  imageUrl?: string | null
): QuestionDetails | null => {
  switch (questionType) {
    case 'AssertionReason':
      return normalizeAssertionReasonDetails(details, questionText);
    case 'SequenceOrdering':
      return normalizeSequenceOrderingDetails(details, questionText); // Pass questionText again
    case 'MultipleCorrectStatements':
      return normalizeMultipleCorrectStatementsDetails(details, questionText);
    case 'Matching':
      return normalizeMatchingDetails(details, questionText);
    case 'DiagramBased':
      return normalizeDiagramBasedDetails(details, imageUrl || null, questionText);
    default:
      return parseJsonDetails<QuestionDetails>(details as string | QuestionDetails);
  }
};
