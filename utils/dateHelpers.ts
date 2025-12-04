/**
 * Parse a date string (YYYY-MM-DD) as a local date to avoid timezone issues.
 * When a date string like "2025-12-04" is passed to new Date(), JavaScript
 * interprets it as UTC midnight, which can show as the previous day in timezones
 * behind UTC. This function ensures the date is parsed as a local date.
 * 
 * @param dateString - Date string in YYYY-MM-DD format or other valid date formats
 * @returns Date object representing the date in local timezone
 */
export const parseLocalDate = (dateString: string | Date | null | undefined): Date => {
  if (!dateString) return new Date();
  
  // If it's already a Date object, return it
  if (dateString instanceof Date) {
    return dateString;
  }
  
  // Handle YYYY-MM-DD format (most common for scheduledDate)
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number);
    // Create date in local timezone (month is 0-indexed in JavaScript)
    return new Date(year, month - 1, day);
  }
  
  // Fallback for other date formats (ISO strings, etc.)
  return new Date(dateString);
};

/**
 * Format a date string (YYYY-MM-DD) for display
 * @param dateString - Date string in YYYY-MM-DD format
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string
 */
export const formatBookingDate = (
  dateString: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
): string => {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString('en-US', options);
};

/**
 * Get today's date as YYYY-MM-DD string in local timezone
 */
export const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Check if a date string represents today
 */
export const isToday = (dateString: string | Date | null | undefined): boolean => {
  const date = parseLocalDate(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Convert a date to YYYY-MM-DD string format (local timezone)
 */
export const toDateString = (date: Date | string | null | undefined): string => {
  const d = parseLocalDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

