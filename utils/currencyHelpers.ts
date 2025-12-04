/**
 * Format a number as Indian Rupee currency
 * Handles very large numbers with proper formatting
 * @param amount - The amount to format
 * @param showDecimals - Whether to show decimal places (default: false)
 * @returns Formatted currency string (e.g., "₹1,23,45,678" or "₹12.34 Lakh")
 */
export const formatCurrency = (amount: number, showDecimals: boolean = false): string => {
  if (amount === 0) return '₹0';
  if (!amount || isNaN(amount)) return '₹0';

  // For very large numbers, use compact notation (Lakh, Crore)
  if (amount >= 10000000) {
    // 1 Crore and above
    const crores = amount / 10000000;
    return `₹${crores.toFixed(showDecimals ? 2 : 1)} Cr`;
  } else if (amount >= 100000) {
    // 1 Lakh and above
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(showDecimals ? 2 : 1)} Lakh`;
  } else if (amount >= 1000) {
    // Thousands - use Indian numbering system (lakhs format)
    const formatted = amount.toLocaleString('en-IN', {
      maximumFractionDigits: showDecimals ? 2 : 0,
      minimumFractionDigits: 0,
    });
    return `₹${formatted}`;
  } else {
    // Less than 1000
    return `₹${amount.toFixed(showDecimals ? 2 : 0)}`;
  }
};

/**
 * Format currency with full precision (for display in details)
 * @param amount - The amount to format
 * @returns Formatted currency string with commas
 */
export const formatCurrencyFull = (amount: number): string => {
  if (amount === 0) return '₹0';
  if (!amount || isNaN(amount)) return '₹0';

  return `₹${amount.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
};

/**
 * Parse currency string to number (handles formatted strings)
 * @param currencyString - Formatted currency string
 * @returns Number value
 */
export const parseCurrency = (currencyString: string): number => {
  if (!currencyString) return 0;
  
  // Remove currency symbols and spaces
  const cleaned = currencyString.replace(/[₹,\s]/g, '');
  
  // Handle compact notation
  if (cleaned.toLowerCase().includes('cr')) {
    const value = parseFloat(cleaned.replace(/cr/gi, ''));
    return value * 10000000;
  } else if (cleaned.toLowerCase().includes('lakh')) {
    const value = parseFloat(cleaned.replace(/lakh/gi, ''));
    return value * 100000;
  }
  
  return parseFloat(cleaned) || 0;
};

