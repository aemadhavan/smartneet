// File: src/lib/dashboard/formatting.js
/**
 * Returns a color based on mastery level
 * @param {string} level - Mastery level
 * @returns {string} Color code
 */
export const getMasteryColor = (level) => {
    switch(level) {
      case 'notStarted': return '#f3f4f6'; // gray-100
      case 'beginner': return '#fee2e2'; // red-100
      case 'intermediate': return '#fef3c7'; // yellow-100
      case 'advanced': return '#dbeafe'; // blue-100
      case 'mastered': return '#d1fae5'; // green-100
      default: return '#e5e7eb'; // gray-200
    }
  };
  
  /**
   * Formats a date string
   * @param {string} dateString - Date string to format
   * @returns {string} Formatted date
   */
  export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  /**
   * Formats accuracy as a percentage
   * @param {number} accuracy - Accuracy value
   * @returns {string} Formatted accuracy string
   */
  export const formatAccuracy = (accuracy) => {
    return `${Math.round(accuracy)}%`;
  };
