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

    return storedGoals.map(goal => {
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
    const goalsToSave = goals.map(({ progress, ...rest }) => rest);
    return StorageService.save(STORAGE_KEYS.GOALS, goalsToSave);
};

/**
 * Adds a new goal and saves. Uses createGoal() factory for validation.
 *
 * @param {Array} currentGoals - Current goals array
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
        const updated = [...currentGoals, withProgress];
        await saveAllGoals(updated);
        return { success: true, updatedGoals: updated, newGoal: withProgress };
    } catch (e) {
        console.error('GoalService.addGoal:', e.message);
        return { success: false, updatedGoals: currentGoals, error: e.message };
    }
};

/**
 * Updates a single goal in the array and saves.
 *
 * @param {Array} currentGoals - Current goals array
 * @param {Object} updatedGoal - The goal to update (matched by id)
 * @returns {Promise<Object>} { success, updatedGoals }
 */
export const updateGoal = async (currentGoals, updatedGoal) => {
    const updated = currentGoals.map(g =>
        g.id === updatedGoal.id ? { ...updatedGoal, progress: calculateGoalProgress(updatedGoal) } : g
    );
    await saveAllGoals(updated);
    return { success: true, updatedGoals: updated };
};

/**
 * Deletes a goal by ID and saves.
 *
 * @param {Array} currentGoals - Current goals array
 * @param {string} goalId - ID to delete
 * @returns {Promise<Object>} { success, updatedGoals }
 */
export const deleteGoal = async (currentGoals, goalId) => {
    const updated = currentGoals.filter(g => g.id !== goalId);
    await saveAllGoals(updated);
    return { success: true, updatedGoals: updated };
};

/**
 * Finds a goal by ID (in-memory lookup, no storage call).
 *
 * @param {Array} goals - Goals array
 * @param {string} goalId - ID to find
 * @returns {Object|null} The goal or null
 */
export const getGoalById = (goals, goalId) => {
    return goals.find(g => g.id === goalId) || null;
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
 * Adds a subgoal to a parent goal. Handles:
 *   1. Creating the subgoal with weeks
 *   2. Rebuilding parent weeks to exclude subgoal ranges
 *   3. Saving to storage
 *
 * Replaces the direct AsyncStorage logic in addSub.js.
 *
 * @param {string} parentGoalId - Parent goal ID
 * @param {Object} subGoalData - { name, startDate, endDate }
 * @returns {Promise<Object>} { success, error? }
 */
export const addSubGoal = async (parentGoalId, subGoalData) => {
    try {
        const allGoals = await StorageService.get(STORAGE_KEYS.GOALS, []);
        const parentIdx = allGoals.findIndex(g => g.id === parentGoalId);

        if (parentIdx === -1) {
            return { success: false, error: 'Parent goal not found.' };
        }

        const parent = allGoals[parentIdx];
        if (!parent.subgoals) parent.subgoals = [];

        // Validate date range within parent
        if (subGoalData.startDate < parent.startDate || subGoalData.endDate > parent.endDate) {
            return { success: false, error: 'Sub-goal dates must lie inside parent goal timeframe.' };
        }
        if (subGoalData.endDate < subGoalData.startDate) {
            return { success: false, error: 'End date cannot be earlier than start date.' };
        }

        // Check for overlap with existing subgoals
        const hasOverlap = parent.subgoals.some(sg =>
            !(subGoalData.endDate < sg.startDate || subGoalData.startDate > sg.endDate)
        );
        if (hasOverlap) {
            return { success: false, error: 'Sub-goal dates overlap with an existing sub-goal.' };
        }

        const subGoal = createGoal(subGoalData);
        subGoal.weeks = getWeeksBetweenDates(subGoalData.startDate, subGoalData.endDate);

        parent.subgoals.push(subGoal);
        parent.weeks = rebuildParentWeeks(parent);

        allGoals[parentIdx] = parent;
        await StorageService.save(STORAGE_KEYS.GOALS, allGoals);

        return { success: true };
    } catch (e) {
        console.error('GoalService.addSubGoal:', e.message);
        return { success: false, error: e.message };
    }
};

/**
 * Updates a subgoal within its parent. Handles saving directly to storage.
 *
 * Replaces the direct AsyncStorage logic in subdetail.js → saveUpdates().
 *
 * @param {string} parentGoalId - Parent goal ID
 * @param {Object} updatedSubGoal - Updated subgoal object
 * @returns {Promise<boolean>} Success flag
 */
export const updateSubGoal = async (parentGoalId, updatedSubGoal) => {
    try {
        const allGoals = await StorageService.get(STORAGE_KEYS.GOALS, []);
        const parentIdx = allGoals.findIndex(g => g.id === parentGoalId);
        if (parentIdx === -1) return false;

        const subIdx = allGoals[parentIdx].subgoals.findIndex(s => s.id === updatedSubGoal.id);
        if (subIdx === -1) return false;

        allGoals[parentIdx].subgoals[subIdx] = updatedSubGoal;
        await StorageService.save(STORAGE_KEYS.GOALS, allGoals);

        return true;
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
