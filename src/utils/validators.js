// Utility functions for form validation

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validates Brazilian phone format
 * @param {string} phone - Phone to validate (with or without formatting)
 * @returns {boolean} - True if valid
 */
export const isValidPhone = (phone) => {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    // Brazilian phone: 10 or 11 digits (with or without area code)
    return cleaned.length >= 10 && cleaned.length <= 11;
};

/**
 * Validates Brazilian CEP format
 * @param {string} cep - CEP to validate
 * @returns {boolean} - True if valid
 */
export const isValidCEP = (cep) => {
    const cleaned = cep.replace(/\D/g, '');
    return cleaned.length === 8;
};

/**
 * Validates that a date is not in the future
 * @param {string} date - Date string in YYYY-MM-DD format
 * @returns {boolean} - True if date is today or in the past
 */
export const isNotFutureDate = (date) => {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate <= today;
};

/**
 * Validates that a date is not in the past
 * @param {string} date - Date string in YYYY-MM-DD format
 * @returns {boolean} - True if date is today or in the future
 */
export const isNotPastDate = (date) => {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate >= today;
};

/**
 * Validates required field
 * @param {any} value - Value to validate
 * @returns {boolean} - True if not empty
 */
export const isRequired = (value) => {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    return value !== null && value !== undefined;
};

/**
 * Validates minimum length
 * @param {string} value - String to validate
 * @param {number} min - Minimum length
 * @returns {boolean} - True if meets minimum
 */
export const minLength = (value, min) => {
    return value.length >= min;
};

/**
 * Validates maximum length
 * @param {string} value - String to validate
 * @param {number} max - Maximum length
 * @returns {boolean} - True if within maximum
 */
export const maxLength = (value, max) => {
    return value.length <= max;
};

/**
 * Sanitizes string input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;

    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};
