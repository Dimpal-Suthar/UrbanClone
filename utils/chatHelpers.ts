/**
 * Format time for chat messages
 */
export const formatMessageTime = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
};

/**
 * Format date for conversation list (smart formatting)
 */
export const formatConversationTime = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Get message preview text
 */
export const getMessagePreview = (
  text: string,
  type: 'text' | 'image' | 'location',
  isOwnMessage: boolean
): string => {
  const prefix = isOwnMessage ? 'You: ' : '';

  if (type === 'image') return `${prefix}📷 Image`;
  if (type === 'location') return `${prefix}📍 Location`;
  
  // Truncate long text
  const maxLength = 50;
  if (text.length > maxLength) {
    return `${prefix}${text.substring(0, maxLength)}...`;
  }
  
  return `${prefix}${text}`;
};

/**
 * Group messages by date
 */
export const groupMessagesByDate = (messages: any[]): { date: string; messages: any[] }[] => {
  const groups: { [key: string]: any[] } = {};

  messages.forEach(message => {
    const date = new Date(message.createdAt);
    const dateKey = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
  });

  return Object.entries(groups).map(([date, messages]) => ({
    date,
    messages,
  }));
};

/**
 * Check if message is from today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if message is from yesterday
 */
export const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

/**
 * Get conversation ID from customer and provider IDs (deterministic)
 */
export const getConversationId = (userId1: string, userId2: string): string => {
  // Sort IDs to ensure consistent conversation ID regardless of order
  const sortedIds = [userId1, userId2].sort();
  return sortedIds.join('_');
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

