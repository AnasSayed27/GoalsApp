/**
 * Progress Calculator — THE SINGLE PLACE for all progress math.
 *
 * Previously duplicated in:
 *   - useGoalsData.js → calculateGoalProgress()
 *   - detail.js → calculateProgress()
 *   - tasks.js → getTacticData() (inline progress)
 *   - subdetail.js → calculateProgress()
 *
 * Now there is ONE function. Used by hooks, screens, and components alike.
 */

/**
 * Calculates a single tactic's fractional completion (0 to 1).
 *
 * For target-based tactics: currentProgress / targetValue (capped at 1)
 * For checkbox tactics: 1 if completed, 0 if not
 *
 * @param {Object} tactic - A tactic object
 * @returns {number} Fractional completion between 0 and 1
 */
export const getTacticCompletion = (tactic) => {
    if (!tactic) return 0;

    if (tactic.targetValue) {
        return Math.min((tactic.currentProgress || 0) / tactic.targetValue, 1);
    }

    return tactic.completed ? 1 : 0;
};

/**
 * Calculates progress for a single week (fraction 0 to 1).
 *
 * @param {Object} weekData - A week object with a tasks array
 * @returns {number} Fractional progress between 0 and 1
 */
export const calculateWeekProgress = (weekData) => {
    if (!weekData || !weekData.tasks || !Array.isArray(weekData.tasks) || weekData.tasks.length === 0) {
        return 0;
    }

    const totalCompletion = weekData.tasks.reduce(
        (sum, tactic) => sum + getTacticCompletion(tactic),
        0
    );

    return totalCompletion / weekData.tasks.length;
};

/**
 * Checks if all tasks in a week are completed.
 *
 * @param {Object} weekData - A week object with a tasks array
 * @returns {boolean} True if all tasks are completed
 */
export const isWeekComplete = (weekData) => {
    if (!weekData || !weekData.tasks || !Array.isArray(weekData.tasks) || weekData.tasks.length === 0) {
        return false;
    }

    return weekData.tasks.every(tactic => getTacticCompletion(tactic) >= 1);
};

/**
 * Calculates overall progress for a goal (including all subgoals, recursively).
 * This is THE canonical progress function for the entire app.
 *
 * Returns a fraction between 0 and 1 (multiply by 100 for percentage).
 *
 * @param {Object} goal - A goal object (may contain weeks and subgoals)
 * @returns {number} Fractional progress between 0 and 1
 */
export const calculateGoalProgress = (goal) => {
    if (!goal) return 0;

    let totalTactics = 0;
    let completedFraction = 0;

    const traverse = (obj) => {
        if (!obj) return;

        // Count tactics in this object's own weeks
        if (obj.weeks && typeof obj.weeks === 'object') {
            Object.values(obj.weeks).forEach(week => {
                if (week.tasks && Array.isArray(week.tasks)) {
                    totalTactics += week.tasks.length;
                    completedFraction += week.tasks.reduce(
                        (sum, tactic) => sum + getTacticCompletion(tactic),
                        0
                    );
                }
            });
        }

        // Recurse into subgoals
        if (obj.subgoals && Array.isArray(obj.subgoals)) {
            obj.subgoals.forEach(sg => traverse(sg));
        }
    };

    traverse(goal);

    return totalTactics > 0 ? completedFraction / totalTactics : 0;
};

/**
 * Calculates daily task stats (for the Daily Routines section).
 *
 * @param {Array} tasks - Array of daily task objects
 * @returns {Object} { totalDuration, completedDuration, progress }
 */
export const calculateDailyTaskStats = (tasks) => {
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return { totalDuration: 0, completedDuration: 0, progress: 0 };
    }

    const totalDuration = tasks.reduce((sum, task) => sum + (task.duration || 0), 0);
    const completedDuration = tasks.reduce(
        (sum, task) => task.completed ? sum + (task.duration || 0) : sum,
        0
    );
    const progress = totalDuration > 0 ? completedDuration / totalDuration : 0;

    return { totalDuration, completedDuration, progress };
};
