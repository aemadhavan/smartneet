// File: src/app/practice/utils/questionUtils.ts

import { 
  AssertionReasonDetails, 
  SequenceOrderingDetails, 
  MultipleCorrectStatementsDetails, 
  MatchingDetails,
  DiagramBasedDetails 
} from '@/app/practice/types';

/**
 * Parses JSON string or returns the object if already parsed
 */
export const parseJsonDetails = (details: string | any): any => {
  if (typeof details === 'string') {
    try {
      const parsed = JSON.parse(details);
      // Check if the result is still a string (double-encoded JSON)
      if (typeof parsed === 'string') {
        return JSON.parse(parsed);
      }
      return parsed;
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
    let listIText = questionText.substring(questionText.indexOf('List I:'));
    
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
    let listIIText = questionText.substring(questionText.indexOf('List II:'));
    
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
  details: any, 
  questionText: string
): AssertionReasonDetails | null => {
  const parsedDetails = parseJsonDetails(details);
  
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
export const normalizeSequenceOrderingDetails = (details: any): SequenceOrderingDetails | null => {
  const parsedDetails = parseJsonDetails(details);
  
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
  details: any,
  questionText: string
): MultipleCorrectStatementsDetails | null => {
  const parsedDetails = parseJsonDetails(details);
  
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
  details: any,
  questionText: string
): MatchingDetails | null => {
  const parsedDetails = parseJsonDetails(details);
  
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
      const items = [];
      for (let i = 0; i < Math.min(listI.length, listII.length); i++) {
        items.push({
          left_item_label: listI[i].label,
          left_item_text: listI[i].text,
          right_item_label: listII[i].label,
          right_item_text: listII[i].text
        });
      }
      
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
 * Extract diagram labels from question text if possible
 */
export const extractDiagramLabelsFromText = (questionText: string): { label_id: string; label_text: string }[] => {
  const labels: { label_id: string; label_text: string }[] = [];
  
  // Check for seed diagram questions
  if (questionText.toLowerCase().includes('seed') && 
     (questionText.toLowerCase().includes('part') || questionText.toLowerCase().includes('identify'))) {
    
    // For seed diagrams, create standard labels based on the common parts
    return [
      { label_id: 'A', label_text: 'Radicle' },
      { label_id: 'B', label_text: 'Plumule' },
      { label_id: 'C', label_text: 'Cotyledon' },
      { label_id: 'D', label_text: 'Micropyle' }
    ];
  }

  // Check for cell component questions
  if (questionText.toLowerCase().includes('component') && 
      (questionText.toLowerCase().includes('cell') || questionText.toLowerCase().includes('wall'))) {
    
    // For cell component diagrams, create standard labels
    return [
      { label_id: 'A', label_text: 'Cell Wall' },
      { label_id: 'B', label_text: 'Cell Membrane' },
      { label_id: 'C', label_text: 'Cytoplasm' },
      { label_id: 'D', label_text: 'Vacuole' }
    ];
  }
  
  // Try to find label patterns like "A - Something" or "1. Something" in the question text
  const labelPattern = /([A-Z]|[0-9]+)[\s\-\.:]+([^\n;]+)/g;
  let match;
  
  while ((match = labelPattern.exec(questionText)) !== null) {
    labels.push({
      label_id: match[1],
      label_text: match[2].trim()
    });
  }
  
  return labels;
};

/**
 * Normalizes a diagram-based question to have the expected format
 */
export const normalizeDiagramBasedDetails = (
  details: any,
  imageUrl: string | null
): DiagramBasedDetails | null => {
  const parsedDetails = parseJsonDetails(details);
  
  if (!parsedDetails) {
    console.log('Failed to parse diagram details:', details);
    return null;
  }
  
  // If details already has the correct structure
  if (parsedDetails.diagram_url && parsedDetails.options && Array.isArray(parsedDetails.options)) {
    return parsedDetails as DiagramBasedDetails;
  }
  
  // If we have options but no diagram_url, add the image URL
  if (parsedDetails.options && Array.isArray(parsedDetails.options)) {
    if (!imageUrl) {
      console.log('Missing image URL for diagram question:', parsedDetails);
    }
    
    return {
      diagram_url: imageUrl || '/images/diagrams/placeholder.jpg', // Use placeholder if no image URL
      options: parsedDetails.options,
      // We don't have labels here, but the property is optional in the type definition
    };
  }
  
  console.log('Invalid diagram details format:', parsedDetails);
  return null;
};

/**
 * Normalizes question details based on the question type
 */
export const normalizeQuestionDetails = (
  details: any, 
  questionType: string,
  questionText: string,
  imageUrl?: string | null
): any => {
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
      return normalizeDiagramBasedDetails(details, imageUrl || null);
    default:
      return parseJsonDetails(details);
  }
};