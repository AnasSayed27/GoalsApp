/**
 * Daily Task Data Model — Single source of truth for daily routine tasks.
 *
 * These are the tasks in the "Daily Routines" section of the dashboard,
 * NOT the tactics inside goals/weeks. For goal tactics, see Goal.js → createTactic().
 */

/**
 * Creates a new daily Task object.
 *
 * @param {Object} params
 * @param {string} params.name       - Task name (required)
 * @param {number} params.duration   - Duration in hours (required, must be > 0)
 * @returns {Object} A fully-formed daily Task object
 */
export const createTask = ({ name, duration }) => {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new Error('createTask: "name" is required and must be a non-empty string.');
    }

    const parsedDuration = Number(duration);
    if (isNaN(parsedDuration) || parsedDuration < 0) {
        throw new Error('createTask: "duration" must be a non-negative number.');
    }

    return {
        id: Date.now().toString(),
        name: name.trim(),
        duration: parsedDuration,
        completed: false,
        createdAt: new Date().toISOString(),
    };
};

/**
 * Ensures a task loaded from storage has all required fields.
 *
 * @param {Object} task - A raw task from storage
 * @returns {Object|null} A normalized task, or null if invalid
 */
export const normalizeTask = (task) => {
    if (!task || typeof task !== 'object' || !task.id) {
        return null;
    }

    return {
        id: task.id,
        name: task.name || 'Unnamed Task',
        duration: typeof task.duration === 'number' ? task.duration : 0,
        completed: Boolean(task.completed),
        createdAt: task.createdAt || new Date().toISOString(),
    };
};
