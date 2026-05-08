/**
 * Goal Data Model — Single source of truth for Goal, SubGoal, Week, and Tactic shapes.
 *
 * Every place that creates these objects MUST use these factory functions.
 * No more inline object literals scattered across files.
 *
 * IMPORTANT: These shapes must remain backward-compatible with existing
 * AsyncStorage data. Any new fields must have default values.
 */

// ─────────────────────────────────────────────
// TACTIC (aka "task" within a week)
// ─────────────────────────────────────────────

/**
 * Creates a new Tactic object.
 *
 * @param {Object} params
 * @param {string} params.text           - Tactic description (required)
 * @param {number|null} [params.targetValue=null] - Numeric target (null = checkbox-only)
 * @param {string} [params.unit='']      - Unit label for target (e.g. "calls", "hours")
 * @returns {Object} A fully-formed Tactic object
 */
export const createTactic = ({ text, targetValue = null, unit = '' }) => {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw new Error('createTactic: "text" is required and must be a non-empty string.');
    }

    const parsedTarget = targetValue != null ? Number(targetValue) : null;
    if (parsedTarget != null && (isNaN(parsedTarget) || parsedTarget <= 0)) {
        throw new Error('createTactic: "targetValue" must be a positive number or null.');
    }

    return {
        id: Date.now().toString(),
        text: text.trim(),
        completed: false,
        // Numeric-target fields (only meaningful when targetValue is set)
        targetValue: parsedTarget,
        currentProgress: 0,
        unit: parsedTarget != null ? (unit || '') : '',
        // Daily log tracking: { 'YYYY-MM-DD': numberLogged }
        dailyLogs: {},
        // Date string when this tactic was completed (null if not completed)
        completionDate: null,
    };
};

/**
 * Creates a reset copy of a tactic for "copy to next week".
 * Preserves text/target/unit but resets progress.
 *
 * @param {Object} sourceTactic - The tactic to copy from
 * @returns {Object} A fresh Tactic with reset progress
 */
export const copyTacticFresh = (sourceTactic) => {
    if (!sourceTactic || !sourceTactic.text) {
        throw new Error('copyTacticFresh: source tactic must have a "text" field.');
    }

    return {
        id: Date.now().toString(),
        text: sourceTactic.text,
        completed: false,
        targetValue: sourceTactic.targetValue || null,
        currentProgress: 0,
        unit: sourceTactic.unit || '',
        dailyLogs: {},
        completionDate: null,
    };
};

// ─────────────────────────────────────────────
// WEEK
// ─────────────────────────────────────────────

/**
 * Creates a new Week object.
 *
 * @param {Object} params
 * @param {string} params.startDate - ISO date string 'YYYY-MM-DD'
 * @param {string} params.endDate   - ISO date string 'YYYY-MM-DD'
 * @param {Array}  [params.tasks=[]]  - Array of Tactic objects
 * @returns {Object} A Week object
 */
export const createWeek = ({ startDate, endDate, tasks = [] }) => {
    if (!startDate || !endDate) {
        throw new Error('createWeek: "startDate" and "endDate" are required.');
    }

    return {
        startDate,
        endDate,
        tasks: Array.isArray(tasks) ? tasks : [],
    };
};

// ─────────────────────────────────────────────
// GOAL (top-level or subgoal — same shape)
// ─────────────────────────────────────────────

/**
 * Creates a new Goal object.
 *
 * @param {Object} params
 * @param {string} params.name       - Goal name (required)
 * @param {string} params.startDate  - ISO date string 'YYYY-MM-DD'
 * @param {string} params.endDate    - ISO date string 'YYYY-MM-DD'
 * @param {Object} [params.weeks={}] - Map of weekKey -> Week objects
 * @param {Array}  [params.subgoals=[]] - Array of subgoal objects
 * @returns {Object} A fully-formed Goal object
 */
export const createGoal = ({ name, startDate, endDate, weeks = {}, subgoals = [] }) => {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new Error('createGoal: "name" is required and must be a non-empty string.');
    }
    if (!startDate || !endDate) {
        throw new Error('createGoal: "startDate" and "endDate" are required.');
    }

    return {
        id: Date.now().toString(),
        name: name.trim(),
        startDate,
        endDate,
        createdAt: new Date().toISOString(),
        weeks: weeks || {},
        subgoals: Array.isArray(subgoals) ? subgoals : [],
    };
};

/**
 * Ensures a goal object loaded from storage has all required fields.
 * This handles backward compatibility — older stored goals may be missing fields.
 *
 * @param {Object} goal - A raw goal from storage
 * @returns {Object} A normalized goal with all fields guaranteed
 */
export const normalizeGoal = (goal) => {
    if (!goal || typeof goal !== 'object') {
        return null;
    }

    const normalized = { ...goal };

    // Ensure weeks structure
    if (!normalized.weeks || typeof normalized.weeks !== 'object' || Array.isArray(normalized.weeks)) {
        normalized.weeks = {};
    }

    // Ensure subgoals array
    if (!Array.isArray(normalized.subgoals)) {
        normalized.subgoals = [];
    }

    // Ensure each week has a tasks array
    Object.keys(normalized.weeks).forEach(weekKey => {
        if (!Array.isArray(normalized.weeks[weekKey].tasks)) {
            normalized.weeks[weekKey].tasks = [];
        }
    });

    // Normalize each subgoal recursively
    normalized.subgoals = normalized.subgoals.map(sg => normalizeGoal(sg)).filter(Boolean);

    return normalized;
};
