/**
 * Revision Data Model — Single source of truth for RevisionGroup and RevisionItem shapes.
 *
 * Spaced repetition intervals (default): 1, 3, 7, 14, 30 days.
 * Users can customize intervals per item.
 */

// Default spaced repetition intervals in days
export const DEFAULT_INTERVALS = [1, 3, 7, 14, 30];

// ─────────────────────────────────────────────
// REVISION ITEM (a single topic to revise)
// ─────────────────────────────────────────────

/**
 * Creates a new RevisionItem.
 *
 * @param {Object} params
 * @param {string} params.text          - Item name (required, e.g. "Binary Trees")
 * @param {number[]} [params.intervals] - Custom spaced repetition intervals in days
 * @returns {Object} A fully-formed RevisionItem
 */
export const createRevisionItem = ({ text, intervals = null }) => {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw new Error('createRevisionItem: "text" is required and must be a non-empty string.');
    }

    const today = new Date().toISOString().split('T')[0];

    return {
        id: Date.now().toString(),
        text: text.trim(),
        // The intervals this item follows (array of day-gaps)
        intervals: Array.isArray(intervals) && intervals.length > 0
            ? intervals.map(Number).filter(n => n > 0)
            : [...DEFAULT_INTERVALS],
        // Which revision step we are on (0 = first revision not done yet)
        currentStep: 0,
        // Date this item was first added (YYYY-MM-DD)
        createdDate: today,
        // Next revision due date (YYYY-MM-DD) — starts as today
        nextRevisionDate: today,
        // History of completed revisions: [{ date: 'YYYY-MM-DD', step: 0 }, ...]
        revisionHistory: [],
        // true if all intervals have been completed
        isFullyRevised: false,
    };
};

// ─────────────────────────────────────────────
// REVISION GROUP (a folder of related items)
// ─────────────────────────────────────────────

/**
 * Creates a new RevisionGroup.
 *
 * @param {Object} params
 * @param {string} params.name   - Group name (required, e.g. "Data Structures")
 * @param {Array}  [params.items=[]] - Array of RevisionItem objects
 * @returns {Object} A RevisionGroup object
 */
export const createRevisionGroup = ({ name, items = [] }) => {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new Error('createRevisionGroup: "name" is required and must be a non-empty string.');
    }

    return {
        id: Date.now().toString(),
        name: name.trim(),
        createdDate: new Date().toISOString().split('T')[0],
        items: Array.isArray(items) ? items : [],
        isCollapsed: false,
    };
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/**
 * Marks a revision item as revised today.
 * Advances to the next step and calculates the next revision date.
 *
 * @param {Object} item - The RevisionItem to update
 * @returns {Object} Updated RevisionItem (new object, does not mutate)
 */
export const markRevised = (item) => {
    const today = new Date().toISOString().split('T')[0];
    const updatedItem = { ...item };

    // Record this revision in history
    updatedItem.revisionHistory = [
        ...(updatedItem.revisionHistory || []),
        { date: today, step: updatedItem.currentStep }
    ];

    // Advance step
    updatedItem.currentStep += 1;

    // Check if all intervals are done
    if (updatedItem.currentStep >= updatedItem.intervals.length) {
        updatedItem.isFullyRevised = true;
        updatedItem.nextRevisionDate = null;
    } else {
        // Calculate next revision date
        const daysUntilNext = updatedItem.intervals[updatedItem.currentStep];
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + daysUntilNext);
        updatedItem.nextRevisionDate = nextDate.toISOString().split('T')[0];
        updatedItem.isFullyRevised = false;
    }

    return updatedItem;
};

/**
 * Determines the status of a revision item.
 *
 * @param {Object} item - The RevisionItem
 * @returns {'overdue'|'due_today'|'upcoming'|'completed'} Status string
 */
export const getRevisionStatus = (item) => {
    if (item.isFullyRevised) return 'completed';
    if (!item.nextRevisionDate) return 'completed';

    const today = new Date().toISOString().split('T')[0];
    if (item.nextRevisionDate < today) return 'overdue';
    if (item.nextRevisionDate === today) return 'due_today';
    return 'upcoming';
};

/**
 * Normalizes a revision group loaded from storage to ensure all fields exist.
 *
 * @param {Object} group - Raw group from storage
 * @returns {Object|null} Normalized group
 */
export const normalizeRevisionGroup = (group) => {
    if (!group || typeof group !== 'object') return null;

    return {
        id: group.id || Date.now().toString(),
        name: group.name || 'Untitled Group',
        createdDate: group.createdDate || new Date().toISOString().split('T')[0],
        items: Array.isArray(group.items) ? group.items.map(normalizeRevisionItem) : [],
        isCollapsed: group.isCollapsed || false,
    };
};

/**
 * Normalizes a revision item loaded from storage.
 */
export const normalizeRevisionItem = (item) => {
    if (!item || typeof item !== 'object') return null;

    return {
        id: item.id || Date.now().toString(),
        text: item.text || 'Untitled',
        intervals: Array.isArray(item.intervals) ? item.intervals : [...DEFAULT_INTERVALS],
        currentStep: item.currentStep || 0,
        createdDate: item.createdDate || new Date().toISOString().split('T')[0],
        nextRevisionDate: item.nextRevisionDate || new Date().toISOString().split('T')[0],
        revisionHistory: Array.isArray(item.revisionHistory) ? item.revisionHistory : [],
        isFullyRevised: item.isFullyRevised || false,
    };
};
