// File: src/app/practice/utils/questionUtils.ts

import { 
  AssertionReasonDetails, 
  SequenceOrderingDetails, 
  MultipleCorrectStatementsDetails, 
  MatchingDetails,
  DiagramBasedDetails,
  QuestionDetails,
  DiagramLabel
} from '@/app/practice/types';

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
  details: unknown, 
  questionText: string
): AssertionReasonDetails | null => {
  const parsedDetails = parseJsonDetails<Partial<AssertionReasonDetails>>(details as string | Partial<AssertionReasonDetails>);
  
  if (!parsedDetails) {
    return null;
  }
  
  // If details already has the correct structure
  if (parsedDetails.statements && Array.isArray(parsedDetails.statements) &&
      parsedDetails.options && Array.isArray(parsedDetails.options)) {
    return parsedDetails as AssertionReasonDetails;
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
 * Normalizes a sequence-ordering question to have the expected format
 */
export const normalizeSequenceOrderingDetails = (details: unknown): SequenceOrderingDetails | null => {
  const parsedDetails = parseJsonDetails<Partial<SequenceOrderingDetails>>(details as string | Partial<SequenceOrderingDetails>);
  
  if (!parsedDetails) {
    return null;
  }
  
  // If details already has the correct structure
  if (parsedDetails.sequence_items && Array.isArray(parsedDetails.sequence_items) &&
      parsedDetails.options && Array.isArray(parsedDetails.options)) {
    return parsedDetails as SequenceOrderingDetails;
  }
  
  return null;
};

/**
 * Normalizes a multiple-correct-statements question to have the expected format
 */
export const normalizeMultipleCorrectStatementsDetails = (
  details: unknown,
  questionText: string
): MultipleCorrectStatementsDetails | null => {
  const parsedDetails = parseJsonDetails<Partial<MultipleCorrectStatementsDetails>>(
    details as string | Partial<MultipleCorrectStatementsDetails>
  );
  
  if (!parsedDetails) {
    return null;
  }
  
  // If details already has the correct structure
  if (parsedDetails.statements && Array.isArray(parsedDetails.statements) &&
      parsedDetails.options && Array.isArray(parsedDetails.options)) {
    return parsedDetails as MultipleCorrectStatementsDetails;
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
 * Normalizes a matching question to have the expected format
 */
export const normalizeMatchingDetails = (
  details: unknown,
  questionText: string
): MatchingDetails | null => {
  const parsedDetails = parseJsonDetails<Partial<MatchingDetails>>(details as string | Partial<MatchingDetails>);
  
  if (!parsedDetails) {
    return null;
  }
  
  // If details already has the correct structure
  if (parsedDetails.items && Array.isArray(parsedDetails.items) &&
      parsedDetails.options && Array.isArray(parsedDetails.options)) {
    return parsedDetails as MatchingDetails;
  }
  
  // If we have options but no items, try to extract them from question text
  if (parsedDetails.options && Array.isArray(parsedDetails.options)) {
    const { listI, listII } = parseMatchingQuestion(questionText);
    
    if (listI.length > 0 && listII.length > 0) {
      const items = listI.slice(0, Math.min(listI.length, listII.length)).map((leftItem, index) => ({
        left_item_label: leftItem.label,
        left_item_text: leftItem.text,
        right_item_label: listII[index].label,
        right_item_text: listII[index].text
      }));
      
      return {
        items,
        options: parsedDetails.options,
        left_column_header: "List I",
        right_column_header: "List II"
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
  details: unknown,
  imageUrl: string | null,
  questionText: string
): DiagramBasedDetails | null => {
  // Try to parse the details
  const parsedDetails = parseJsonDetails<Partial<DiagramBasedDetails>>(details as string | Partial<DiagramBasedDetails>);
  
  if (!parsedDetails) {
    console.log('Failed to parse diagram details:', details);
    return null;
  }
  
  // If details already has the complete structure, just return it
  if (parsedDetails.diagram_url && 
      parsedDetails.options && Array.isArray(parsedDetails.options)) {
    return parsedDetails as DiagramBasedDetails;
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
  
  return normalizedDetails as DiagramBasedDetails;
};

/**
 * Normalizes question details based on the question type
 */
export const normalizeQuestionDetails = (
  details: unknown, 
  questionType: string,
  questionText: string,
  imageUrl?: string | null
): QuestionDetails | null => {
  switch (questionType) {
    case 'AssertionReason':
      return normalizeAssertionReasonDetails(details, questionText);
    case 'SequenceOrdering':
      return normalizeSequenceOrderingDetails(details);
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