/**
 * Validates that all required fields exist and are non-empty strings.
 * @param {Object} body - The request body object
 * @param {string[]} requiredFields - Array of field names that must exist
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function validateRequired(body, requiredFields) {
  const missing = [];
  for (const field of requiredFields) {
    const value = body[field];
    if (value === undefined || value === null || value === '') {
      missing.push(field);
    }
  }
  return { valid: missing.length === 0, missing };
}

/**
 * Validates that a value is one of the allowed options.
 * @param {string} value - The value to check
 * @param {string[]} allowedValues - Array of valid options
 * @returns {boolean}
 */
export function validateEnum(value, allowedValues) {
  return allowedValues.includes(value);
}

/**
 * Validates that a value is a positive integer.
 * @param {*} value - The value to check
 * @returns {boolean}
 */
export function validatePositiveInt(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

/**
 * Validates that a value is a positive finite number (allows decimals).
 * Use this for mark/score fields that may accept fractional values (e.g. 2.5).
 * @param {*} value - The value to check
 * @returns {boolean}
 */
export function validatePositiveNumber(value) {
  const num = Number(value);
  return !isNaN(num) && isFinite(num) && num >= 0;
}

/**
 * Validates that a mark value is a finite number between 0 and maxMarks (inclusive).
 * Accepts integers and fractional marks (e.g. 2.5).
 *
 * @param {*} value - The mark value to validate
 * @param {number} [maxMarks] - The maximum allowable marks (if provided)
 * @returns {boolean} True if value is valid and within [0, maxMarks]
 */
export function validateMarks(value, maxMarks) {
  if (value === null || value === undefined || typeof value === 'boolean' || value === '') {
    return false;
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return false;
  if (maxMarks !== undefined && maxMarks !== null) {
    const max = Number(maxMarks);
    if (Number.isFinite(max) && max >= 0 && num > max) return false;
  }
  return true;
}