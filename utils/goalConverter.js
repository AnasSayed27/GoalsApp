/**
 * Goal Converter — Logic for converting between standalone goals and subgoals.
 *
 * Extracted from detail.js → confirmConvertGoal() and subdetail.js → confirmConvert().
 * These are pure data transformations — no AsyncStorage, no Alert, no navigation.
 */

import { rebuildParentWeeks, getWeeksBetweenDates } from './weekBuilder';

/**
 * Converts a standalone goal into a subgoal of a parent goal.
 * Returns the updated goals array (does NOT save to storage).
 *
 * @param {Array}  allGoals     - The full goals array
 * @param {string} goalId       - ID of the goal being converted
 * @param {string} parentGoalId - ID of the target parent goal
 * @returns {Object} { success: boolean, updatedGoals: Array, error?: string }
 */
export const convertGoalToSubgoal = (allGoals, goalId, parentGoalId) => {
    if (!allGoals || !Array.isArray(allGoals)) {
        return { success: false, updatedGoals: allGoals, error: 'Invalid goals array.' };
    }

    const parentIdx = allGoals.findIndex(g => g.id === parentGoalId);
    const goalIdx = allGoals.findIndex(g => g.id === goalId);

    if (parentIdx === -1) return { success: false, updatedGoals: allGoals, error: 'Parent goal not found.' };
    if (goalIdx === -1) return { success: false, updatedGoals: allGoals, error: 'Goal not found.' };
    if (goalId === parentGoalId) return { success: false, updatedGoals: allGoals, error: 'Cannot convert a goal to be its own subgoal.' };

    // Deep-clone to avoid mutations
    const updatedGoals = JSON.parse(JSON.stringify(allGoals));
    const parentGoal = updatedGoals[parentIdx];
    const goalToMove = updatedGoals[goalIdx];

    // Clear nested subgoals to prevent deep nesting
    goalToMove.subgoals = [];

    // Add to parent's subgoals
    if (!parentGoal.subgoals) parentGoal.subgoals = [];
    parentGoal.subgoals.push(goalToMove);

    // Rebuild parent weeks (excludes subgoal date ranges)
    parentGoal.weeks = rebuildParentWeeks(parentGoal);

    // Remove the moved goal from root level
    const filtered = updatedGoals.filter(g => g.id !== goalId);

    // Re-apply the updated parent
    const newParentIdx = filtered.findIndex(g => g.id === parentGoalId);
    if (newParentIdx !== -1) {
        filtered[newParentIdx] = parentGoal;
    }

    return { success: true, updatedGoals: filtered };
};

/**
 * Converts a subgoal back to a standalone goal.
 * Returns the updated goals array (does NOT save to storage).
 *
 * @param {Array}  allGoals   - The full goals array
 * @param {string} parentId   - ID of the parent goal
 * @param {string} subGoalId  - ID of the subgoal being extracted
 * @returns {Object} { success: boolean, updatedGoals: Array, error?: string }
 */
export const convertSubgoalToGoal = (allGoals, parentId, subGoalId) => {
    if (!allGoals || !Array.isArray(allGoals)) {
        return { success: false, updatedGoals: allGoals, error: 'Invalid goals array.' };
    }

    const updatedGoals = JSON.parse(JSON.stringify(allGoals));
    const parentIdx = updatedGoals.findIndex(g => g.id === parentId);

    if (parentIdx === -1) return { success: false, updatedGoals: allGoals, error: 'Parent goal not found.' };

    const parent = updatedGoals[parentIdx];
    if (!parent.subgoals) return { success: false, updatedGoals: allGoals, error: 'No subgoals found.' };

    const subGoalIdx = parent.subgoals.findIndex(s => s.id === subGoalId);
    if (subGoalIdx === -1) return { success: false, updatedGoals: allGoals, error: 'Subgoal not found.' };

    // Extract the subgoal
    const [subGoal] = parent.subgoals.splice(subGoalIdx, 1);
    subGoal.subgoals = []; // Clear any nested subgoals

    // Rebuild parent weeks
    parent.weeks = parent.subgoals.length > 0
        ? rebuildParentWeeks(parent)
        : getWeeksBetweenDates(parent.startDate, parent.endDate);

    updatedGoals[parentIdx] = parent;

    // Add the extracted subgoal as a standalone goal
    updatedGoals.push(subGoal);

    return { success: true, updatedGoals };
};

/**
 * Calculates how many weeks a subgoal would consume from the parent.
 *
 * @param {string} startDate - Subgoal start date 'YYYY-MM-DD'
 * @param {string} endDate   - Subgoal end date 'YYYY-MM-DD'
 * @returns {number} Number of weeks consumed
 */
export const calculateConsumedWeeks = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T00:00:00Z');
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(1, Math.ceil(diffDays / 7));
};
