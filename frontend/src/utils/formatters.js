/**
 * Formats a numeric value into Indian Rupee (INR) format (e.g. ₹1,50,000.00)
 *
 * @param {number|string} val - Number to format
 * @returns {string} Formatted Indian Rupee string
 */
export const formatCurrency = (val) => {
  const num = typeof val === 'number' ? val : parseFloat(val);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(isNaN(num) ? 0 : num);
};

