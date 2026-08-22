/**
 * GoalService — Data access layer for goals.
 *
 * ALL goal storage operations go through here. No screen or hook should
 * ever call AsyncStorage/@goals directly. This replaces:
 *   - Direct AsyncStorage calls in detail.js, subdetail.js, addSub.js
 *   - Inline CRUD logic in useGoalsData.js
 *
 * Uses Phase 0 models for object creation and normalization.
 */

import { StorageService } from './StorageService';
import { STORAGE_KEYS } from '../constants/StorageKeys';
import { createGoal, normalizeGoal } from '../models/Goal';
import { calculateGoalProgress } from '../utils/progressCalculator';
import { initializeWeeks, rebuildParentWeeks, getWeeksBetweenDates } from '../utils/weekBuilder';

/**
 * Loads all goals from storage, normalizes them, and attaches computed progress.
 *
 * @returns {Promise<Array>} Array of goal objects with .progress computed
 */
export const loadAllGoals = async () => {
    const storedGoals = await StorageService.get(STORAGE_KEYS.GOALS, []);

    return (Array.isArray(storedGoals) ? storedGoals : []).map(goal => {
        const normalized = normalizeGoal(goal);
        if (!normalized) return null;
        return {
            ...normalized,
            progress: calculateGoalProgress(normalized),
        };
    }).filter(Boolean);
};

/**
 * Saves the full goals array to storage.
 * Strips computed `progress` field before persisting.
 *
 * @param {Array} goals - Full goals array
 * @returns {Promise<boolean>} Success flag
 */
export const saveAllGoals = async (goals) => {
    const goalsToSave = (Array.isArray(goals) ? goals : []).map(({ progress, ...rest }) => rest);
    return StorageService.save(STORAGE_KEYS.GOALS, goalsToSave);
};

/**
 * Adds a new goal atomically and saves. Uses createGoal() factory for validation.
 *
 * @param {Array} currentGoals - Current in-memory goals array
 * @param {Object} goalData - { name, startDate, endDate }
 * @returns {Promise<Object>} { success, updatedGoals, newGoal? }
 */
export const addGoal = async (currentGoals, goalData) => {
    try {
        const newGoal = createGoal(goalData);
        const withProgress = {
            ...newGoal,
            progress: 0,
        };

        const updated = await StorageService.mutate(STORAGE_KEYS.GOALS, (storedGoals = []) => {
            const list = Array.isArray(storedGoals) ? storedGoals : [];
            const goalsToSave = [...list, newGoal].map(({ progress, ...rest }) => rest);
            return goalsToSave;
        }, []);

        const finalGoals = (updated || []).map(g => ({
            ...g,
            progress: calculateGoalProgress(g),
        }));

        return { success: true, updatedGoals: finalGoals, newGoal: withProgress };
    } catch (e) {
        console.error('GoalService.addGoal:', e.message);
        return { success: false, updatedGoals: currentGoals, error: e.message };
    }
};

/**
 * Updates a single goal in the array atomically and saves.
 *
 * @param {Array} currentGoals - Current goals array
 * @param {Object} updatedGoal - The goal to update (matched by id)
 * @returns {Promise<Object>} { success, updatedGoals }
 */
export const updateGoal = async (currentGoals, updatedGoal) => {
    try {
        const updated = await StorageService.mutate(STORAGE_KEYS.GOALS, (storedGoals = []) => {
            const list = Array.isArray(storedGoals) ? storedGoals : [];
            const cleanUpdatedGoal = { ...updatedGoal };
            delete cleanUpdatedGoal.progress;

            const idx = list.findIndex(g => g.id === updatedGoal.id);
            if (idx !== -1) {
                list[idx] = cleanUpdatedGoal;
            } else {
                list.push(cleanUpdatedGoal);
            }
            return list.map(({ progress, ...rest }) => rest);
        }, []);

        const finalGoals = (updated || []).map(g => ({
            ...g,
            progress: calculateGoalProgress(g),
        }));

        return { success: true, updatedGoals: finalGoals };
    } catch (e) {
        console.error('GoalService.updateGoal:', e.message);
        return { success: false, updatedGoals: currentGoals, error: e.message };
    }
};

/**
 * Deletes a goal by ID atomically and saves.
 *
 * @param {Array} currentGoals - Current goals array
 * @param {string} goalId - ID to delete
 * @returns {Promise<Object>} { success, updatedGoals }
 */
export const deleteGoal = async (currentGoals, goalId) => {
    try {
        const updated = await StorageService.mutate(STORAGE_KEYS.GOALS, (storedGoals = []) => {
            const list = Array.isArray(storedGoals) ? storedGoals : [];
            return list.filter(g => g.id !== goalId).map(({ progress, ...rest }) => rest);
        }, []);

        const finalGoals = (updated || []).map(g => ({
            ...g,
            progress: calculateGoalProgress(g),
        }));

        return { success: true, updatedGoals: finalGoals };
    } catch (e) {
        console.error('GoalService.deleteGoal:', e.message);
        return { success: false, updatedGoals: currentGoals, error: e.message };
    }
};

/**
 * Atomically updates a specific tactic inside a goal/week in storage.
 *
 * @param {string} goalId - Target goal ID
 * @param {string} weekKey - Target week key (e.g. 'week_0')
 * @param {string} taskId - Target tactic ID
 * @param {Function} updaterFn - Mutation function receiving the tactic object
 * @returns {Promise<Object>} { success, updatedGoals }
 */
export const updateTacticInGoal = async (goalId, weekKey, taskId, updaterFn) => {
    try {
        const updated = await StorageService.mutate(STORAGE_KEYS.GOALS, (storedGoals = []) => {
            const list = Array.isArray(storedGoals) ? storedGoals : [];
            const goal = list.find(g => g.id === goalId);
            if (goal && goal.weeks && goal.weeks[weekKey] && Array.isArray(goal.weeks[weekKey].tasks)) {
                const tactic = goal.weeks[weekKey].tasks.find(t => t.id === taskId);
                if (tactic) {
                    updaterFn(tactic);
                }
            }
            return list.map(({ progress, ...rest }) => rest);
        }, []);

        const finalGoals = (updated || []).map(g => ({
            ...g,
            progress: calculateGoalProgress(g),
        }));

        return { success: true, updatedGoals: finalGoals };
    } catch (e) {
        console.error('GoalService.updateTacticInGoal:', e.message);
        return { success: false, error: e.message };
    }
};

/**
 * Finds a goal by ID (in-memory lookup, no storage call).
 *
 * @param {Array} goals - Goals array
 * @param {string} goalId - ID to find
 * @returns {Object|null} The goal or null
 */
export const getGoalById = (goals, goalId) => {
    return (goals || []).find(g => g.id === goalId) || null;
};

/**
 * Ensures a goal has its week structure initialized.
 * If weeks are empty and no subgoals exist, generates them from dates.
 *
 * @param {Object} goal - A goal object
 * @returns {Object} { goal: normalizedGoal, needsUpdate: boolean }
 */
export const ensureGoalWeeks = (goal) => {
    if (!goal) return { goal: null, needsUpdate: false };

    const normalized = normalizeGoal(goal);
    let needsUpdate = false;

    if (Object.keys(normalized.weeks).length === 0 && normalized.subgoals.length === 0) {
        normalized.weeks = initializeWeeks(normalized);
        needsUpdate = true;
    }

    return { goal: normalized, needsUpdate };
};

/**
 * Adds a subgoal to a parent goal atomically.
 *
 * @param {string} parentGoalId - Parent goal ID
 * @param {Object} subGoalData - { name, startDate, endDate }
 * @returns {Promise<Object>} { success, error? }
 */
export const addSubGoal = async (parentGoalId, subGoalData) => {
    try {
        let opError = null;

        await StorageService.mutate(STORAGE_KEYS.GOALS, (storedGoals = []) => {
            const list = Array.isArray(storedGoals) ? storedGoals : [];
            const parentIdx = list.findIndex(g => g.id === parentGoalId);

            if (parentIdx === -1) {
                opError = 'Parent goal not found.';
                return list;
            }

            const parent = list[parentIdx];
            if (!parent.subgoals) parent.subgoals = [];

            // Validate date range within parent
            if (subGoalData.startDate < parent.startDate || subGoalData.endDate > parent.endDate) {
                opError = 'Sub-goal dates must lie inside parent goal timeframe.';
                return list;
            }
            if (subGoalData.endDate < subGoalData.startDate) {
                opError = 'End date cannot be earlier than start date.';
                return list;
            }

            // Check for overlap with existing subgoals
            const hasOverlap = parent.subgoals.some(sg =>
                !(subGoalData.endDate < sg.startDate || subGoalData.startDate > sg.endDate)
            );
            if (hasOverlap) {
                opError = 'Sub-goal dates overlap with an existing sub-goal.';
                return list;
            }

            const subGoal = createGoal(subGoalData);
            subGoal.weeks = getWeeksBetweenDates(subGoalData.startDate, subGoalData.endDate);

            parent.subgoals.push(subGoal);
            parent.weeks = rebuildParentWeeks(parent);

            list[parentIdx] = parent;
            return list.map(({ progress, ...rest }) => rest);
        }, []);

        if (opError) {
            return { success: false, error: opError };
        }

        return { success: true };
    } catch (e) {
        console.error('GoalService.addSubGoal:', e.message);
        return { success: false, error: e.message };
    }
};

/**
 * Updates a subgoal within its parent atomically.
 *
 * @param {string} parentGoalId - Parent goal ID
 * @param {Object} updatedSubGoal - Updated subgoal object
 * @returns {Promise<boolean>} Success flag
 */
export const updateSubGoal = async (parentGoalId, updatedSubGoal) => {
    try {
        let success = false;
        await StorageService.mutate(STORAGE_KEYS.GOALS, (storedGoals = []) => {
            const list = Array.isArray(storedGoals) ? storedGoals : [];
            const parentIdx = list.findIndex(g => g.id === parentGoalId);
            if (parentIdx === -1) return list;

            const subIdx = (list[parentIdx].subgoals || []).findIndex(s => s.id === updatedSubGoal.id);
            if (subIdx === -1) return list;

            list[parentIdx].subgoals[subIdx] = updatedSubGoal;
            success = true;
            return list.map(({ progress, ...rest }) => rest);
        }, []);

        return success;
    } catch (e) {
        console.error('GoalService.updateSubGoal:', e);
        return false;
    }
};

/**
 * Deletes a subgoal from its parent and rebuilds parent weeks.
 *
 * @param {Array} currentGoals - Current goals array
 * @param {Object} parentGoal - The parent goal
 * @param {string} subGoalId - ID of subgoal to delete
 * @returns {Object} Updated parent goal
 */
export const deleteSubGoal = (parentGoal, subGoalId) => {
    const updated = { ...parentGoal };
    updated.subgoals = (updated.subgoals || []).filter(sg => sg.id !== subGoalId);

    updated.weeks = updated.subgoals.length > 0
        ? rebuildParentWeeks(updated)
        : getWeeksBetweenDates(updated.startDate, updated.endDate);

    return updated;
};
