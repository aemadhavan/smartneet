// File: src/lib/dashboard/formatting.js

/**
 * Returns a color for a mastery level
 * @param {string} level - The mastery level ('mastered', 'advanced', 'intermediate', 'beginner', 'notStarted')
 * @returns {string} - Hex color code for the mastery level
 */
export const getMasteryColor = (level) => {
    switch (level) {
      case 'mastered': return '#10B981'; // emerald-500
      case 'advanced': return '#3B82F6'; // blue-500
      case 'intermediate': return '#F59E0B'; // amber-500
      case 'beginner': return '#F97316'; // orange-500
      case 'notStarted': 
      default: return '#E5E7EB'; // gray-200
    }
  };
  
  /**
   * Format date to a readable string
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date string (e.g., "Jan 15, 2025")
   */
  export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  /**
   * Format minutes to readable duration
   * @param {number} minutes - Duration in minutes
   * @returns {string} - Formatted duration (e.g., "1h 30m")
   */
  export const formatDuration = (minutes) => {
    if (minutes === undefined || minutes === null) return 'N/A';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };
  
  /**
   * Format percentage value with % sign
   * @param {number} value - Percentage value
   * @returns {string} - Formatted percentage
   */
  export const formatPercentage = (value) => {
    if (value === undefined || value === null) return 'N/A';
    return `${Math.round(value)}%`;
  };
  
  /**
   * Format large numbers with commas
   * @param {number} value - Number to format
   * @returns {string} - Formatted number with commas
   */
  export const formatNumber = (value) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US').format(value);
  };