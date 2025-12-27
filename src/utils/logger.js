/**
 * Secure Logger Utility
 * Only logs in development mode to prevent information leakage in production
 */

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

/**
 * Safe console.log - only outputs in development
 */
export const log = (...args) => {
    if (isDev) {
        console.log(...args);
    }
};

/**
 * Safe console.warn - only outputs in development
 */
export const warn = (...args) => {
    if (isDev) {
        console.warn(...args);
    }
};

/**
 * Safe console.error - always outputs (errors should always be visible)
 */
export const error = (...args) => {
    console.error(...args);
};

/**
 * Safe console.info - only outputs in development
 */
export const info = (...args) => {
    if (isDev) {
        console.info(...args);
    }
};

/**
 * Debug log with prefix - only in development
 */
export const debug = (prefix, ...args) => {
    if (isDev) {
        console.log(`[${prefix}]`, ...args);
    }
};

// Default export with all methods
const logger = {
    log,
    warn,
    error,
    info,
    debug,
    isDev
};

export default logger;
