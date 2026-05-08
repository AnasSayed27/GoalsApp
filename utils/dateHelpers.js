/**
 * Date Helper Utilities — Pure functions for date formatting and comparison.
 *
 * All date operations in the app should use these helpers instead of
 * inline Date manipulation. This eliminates timezone bugs.
 *
 * CONVENTION: All date strings are 'YYYY-MM-DD' format.
 * All Date objects are constructed with 'T00:00:00Z' suffix for UTC consistency.
 */

/**
 * Converts a YYYY-MM-DD string to a UTC Date object.
 * Always appends T00:00:00Z to avoid local timezone shifts.
 *
 * @param {string} dateStr - Date in 'YYYY-MM-DD' format
 * @returns {Date} UTC Date object
 */
export const toUTCDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') {
        return new Date();
    }
    return new Date(dateStr + 'T00:00:00Z');
};

/**
 * Converts a Date object to 'YYYY-MM-DD' string.
 *
 * @param {Date} date - Date object
 * @returns {string} Date string in 'YYYY-MM-DD' format
 */
export const toDateString = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
};

/**
 * Returns today's date as a 'YYYY-MM-DD' string (UTC).
 *
 * @returns {string} Today's date string
 */
export const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
};

/**
 * Returns today's date as a UTC-normalized Date (midnight UTC).
 *
 * @returns {Date} Today at 00:00:00 UTC
 */
export const getTodayUTC = () => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

/**
 * Formats a 'YYYY-MM-DD' date string for display.
 * Example: '2024-03-15' → 'Mar 15'
 *
 * @param {string} dateStr - Date in 'YYYY-MM-DD' format
 * @returns {string} Formatted date like 'Mar 15'
 */
export const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const date = toUTCDate(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/**
 * Formats a Date object for display with year.
 * Example: Date → 'March 15, 2024'
 *
 * @param {Date} date - Date object
 * @returns {string} Formatted date like 'March 15, 2024'
 */
export const formatDateLong = (date) => {
    if (!date || !(date instanceof Date)) return '';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

/**
 * Returns a UTC date string for a Date object.
 * Uses manual formatting to avoid timezone issues.
 *
 * @param {Date} date - Date object
 * @returns {string} 'YYYY-MM-DD' formatted string (UTC)
 */
export const getUTCDateString = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        const now = new Date();
        return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
    }
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};

/**
 * Returns the number of days between two date strings (inclusive count).
 *
 * @param {string} startStr - Start date 'YYYY-MM-DD'
 * @param {string} endStr   - End date 'YYYY-MM-DD'
 * @returns {number} Number of days (inclusive)
 */
export const daysBetween = (startStr, endStr) => {
    const start = toUTCDate(startStr);
    const end = toUTCDate(endStr);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Returns the number of weeks (ceiling) between two date strings.
 *
 * @param {string} startStr - Start date 'YYYY-MM-DD'
 * @param {string} endStr   - End date 'YYYY-MM-DD'
 * @returns {number} Number of weeks (rounded up)
 */
export const weeksBetween = (startStr, endStr) => {
    const days = daysBetween(startStr, endStr) - 1; // exclusive end
    return Math.max(1, Math.ceil(days / 7));
};

/**
 * Checks if a date falls within a range (inclusive).
 *
 * @param {Date} date  - The date to check
 * @param {string} startStr - Start date 'YYYY-MM-DD'
 * @param {string} endStr   - End date 'YYYY-MM-DD'
 * @returns {boolean}
 */
export const isDateInRange = (date, startStr, endStr) => {
    const start = toUTCDate(startStr);
    const end = toUTCDate(endStr);
    return date >= start && date <= end;
};

/**
 * Adds days to a date string and returns a new date string.
 *
 * @param {string} dateStr - Base date 'YYYY-MM-DD'
 * @param {number} days    - Number of days to add (can be negative)
 * @returns {string} New date string
 */
export const addDays = (dateStr, days) => {
    const date = toUTCDate(dateStr);
    date.setUTCDate(date.getUTCDate() + days);
    return toDateString(date);
};

/**
 * Returns the start of the week (Monday) for a given date.
 *
 * @param {Date} date - Any date
 * @returns {Date} Monday of that week (UTC)
 */
export const getStartOfWeek = (date) => {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayOfWeek = d.getUTCDay(); // 0=Sunday, 1=Monday, ...
    const mondayDiff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    d.setUTCDate(d.getUTCDate() - mondayDiff);
    return d;
};
