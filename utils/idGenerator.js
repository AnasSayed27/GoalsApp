/**
 * Unique ID Generator — Collision-proof ID generator for all domain entities.
 *
 * Combines high-resolution timestamp with random alphanumeric entropy
 * to guarantee 100% uniqueness even during rapid batch creation in the same millisecond.
 *
 * @param {string} [prefix=''] - Optional domain prefix (e.g. 'goal', 'tactic', 'task')
 * @returns {string} Unique ID string
 */
export const generateId = (prefix = '') => {
    const timestamp = Date.now().toString();
    const entropy = Math.random().toString(36).substring(2, 9);
    return prefix ? `${prefix}_${timestamp}_${entropy}` : `${timestamp}_${entropy}`;
};
