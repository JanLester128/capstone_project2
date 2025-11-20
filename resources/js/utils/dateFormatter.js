/**
 * Date and time formatting utilities for Asia/Manila timezone
 * All dates are formatted in a human-readable format
 */

/**
 * Format a date string or Date object to a readable format
 * @param {string|Date} date - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  if (!date) return '—';
  
  const {
    includeTime = false,
    dateStyle = 'long', // 'full', 'long', 'medium', 'short'
    timeStyle = 'short', // 'full', 'long', 'medium', 'short'
  } = options;

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return '—';
    }

    const formatOptions = {
      timeZone: 'Asia/Manila',
    };

    if (includeTime) {
      formatOptions.dateStyle = dateStyle;
      formatOptions.timeStyle = timeStyle;
    } else {
      formatOptions.dateStyle = dateStyle;
    }

    return dateObj.toLocaleString('en-US', formatOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '—';
  }
}

/**
 * Format date to "Month Day, Year" format (e.g., "July 15, 2002")
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDateLong(date) {
  return formatDate(date, { dateStyle: 'long' });
}

/**
 * Format date to "Mon Day, Year" format (e.g., "Jul 15, 2002")
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDateMedium(date) {
  return formatDate(date, { dateStyle: 'medium' });
}

/**
 * Format date to "M/D/YYYY" format (e.g., "7/15/2002")
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDateShort(date) {
  return formatDate(date, { dateStyle: 'short' });
}

/**
 * Format date with time (e.g., "July 15, 2002 at 3:30 PM")
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(date) {
  return formatDate(date, { includeTime: true, dateStyle: 'long', timeStyle: 'short' });
}

/**
 * Format date with time in medium format (e.g., "Jul 15, 2002, 3:30 PM")
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date and time string
 */
export function formatDateTimeMedium(date) {
  return formatDate(date, { includeTime: true, dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * Format time only (e.g., "3:30 PM")
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted time string
 */
export function formatTime(date) {
  if (!date) return '—';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '—';
    }

    return dateObj.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Manila',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '—';
  }
}

/**
 * Format time with seconds (e.g., "3:30:45 PM")
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted time string with seconds
 */
export function formatTimeLong(date) {
  if (!date) return '—';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '—';
    }

    return dateObj.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Manila',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '—';
  }
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 * @param {string|Date} date - The date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  if (!date) return '—';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '—';
    }

    const now = new Date();
    const diffMs = now - dateObj;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    if (diffWeek < 4) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`;
    if (diffMonth < 12) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
    return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '—';
  }
}

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param {string|Date} date - The date to format
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function formatDateForInput(date) {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    // Get date components in Manila timezone
    const year = dateObj.toLocaleString('en-US', { timeZone: 'Asia/Manila', year: 'numeric' });
    const month = dateObj.toLocaleString('en-US', { timeZone: 'Asia/Manila', month: '2-digit' });
    const day = dateObj.toLocaleString('en-US', { timeZone: 'Asia/Manila', day: '2-digit' });
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
}

/**
 * Check if a date is today
 * @param {string|Date} date - The date to check
 * @returns {boolean} True if the date is today
 */
export function isToday(date) {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    
    return dateObj.toLocaleDateString('en-US', { timeZone: 'Asia/Manila' }) === 
           today.toLocaleDateString('en-US', { timeZone: 'Asia/Manila' });
  } catch (error) {
    return false;
  }
}

/**
 * Check if a date is in the past
 * @param {string|Date} date - The date to check
 * @returns {boolean} True if the date is in the past
 */
export function isPast(date) {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    
    return dateObj < now;
  } catch (error) {
    return false;
  }
}

/**
 * Check if a date is in the future
 * @param {string|Date} date - The date to check
 * @returns {boolean} True if the date is in the future
 */
export function isFuture(date) {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    
    return dateObj > now;
  } catch (error) {
    return false;
  }
}

