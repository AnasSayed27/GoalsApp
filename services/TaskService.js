/**
 * TaskService — Data access layer for daily routine tasks.
 *
 * Extracts all CRUD + reorder logic from useTasksData.js into
 * pure async functions. The hook becomes a thin React wrapper.
 */

import { StorageService } from './StorageService';
import { STORAGE_KEYS } from '../constants/StorageKeys';
import { createTask, normalizeTask } from '../models/Task';
import { calculateDailyTaskStats } from '../utils/progressCalculator';

/**
 * Loads all tasks from storage, normalizes them.
 *
 * @returns {Promise<Array>} Array of normalized task objects
 */
export const loadAllTasks = async () => {
    const stored = await StorageService.get(STORAGE_KEYS.TASKS, []);
    return stored.map(normalizeTask).filter(Boolean);
};

/**
 * Saves the full tasks array to storage.
 *
 * @param {Array} tasks - Full tasks array
 * @returns {Promise<boolean>} Success flag
 */
export const saveAllTasks = async (tasks) => {
    return StorageService.save(STORAGE_KEYS.TASKS, tasks);
};

/**
 * Adds a new daily task. Uses createTask() factory for validation.
 *
 * @param {Array} currentTasks - Current tasks array
 * @param {string} name - Task name
 * @param {number} duration - Duration in hours
 * @returns {Promise<Object>} { success, updatedTasks, error? }
 */
export const addTask = async (currentTasks, name, duration) => {
    try {
        const newTask = createTask({ name, duration });
        const updated = [...currentTasks, newTask];
        await saveAllTasks(updated);
        return { success: true, updatedTasks: updated };
    } catch (e) {
        return { success: false, updatedTasks: currentTasks, error: e.message };
    }
};

/**
 * Toggles completion status of a task.
 *
 * @param {Array} currentTasks - Current tasks array
 * @param {string} taskId - ID of task to toggle
 * @returns {Promise<Object>} { success, updatedTasks, becameCompleted }
 */
export const toggleTaskComplete = async (currentTasks, taskId) => {
    const taskIndex = currentTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
        return { success: false, updatedTasks: currentTasks, becameCompleted: false };
    }

    const wasCompleted = currentTasks[taskIndex].completed;
    const updated = currentTasks.map((t, index) =>
        index === taskIndex ? { ...t, completed: !t.completed } : t
    );

    await saveAllTasks(updated);
    return { success: true, updatedTasks: updated, becameCompleted: !wasCompleted };
};

/**
 * Deletes a task by ID.
 *
 * @param {Array} currentTasks - Current tasks array
 * @param {string} taskId - ID to delete
 * @returns {Promise<Object>} { success, updatedTasks }
 */
export const deleteTask = async (currentTasks, taskId) => {
    const updated = currentTasks.filter(t => t.id !== taskId);
    await saveAllTasks(updated);
    return { success: true, updatedTasks: updated };
};

/**
 * Edits an existing task's name and/or duration.
 *
 * @param {Array} currentTasks - Current tasks array
 * @param {string} taskId - ID of task to edit
 * @param {string} newName - New name
 * @param {number} newDuration - New duration
 * @returns {Promise<Object>} { success, updatedTasks, error? }
 */
export const editTask = async (currentTasks, taskId, newName, newDuration) => {
    if (!newName || typeof newName !== 'string' || newName.trim().length === 0) {
        return { success: false, updatedTasks: currentTasks, error: 'Task name cannot be empty.' };
    }

    const updated = currentTasks.map(task =>
        task.id === taskId
            ? { ...task, name: newName.trim(), duration: Number(newDuration) || 0 }
            : task
    );

    await saveAllTasks(updated);
    return { success: true, updatedTasks: updated };
};

/**
 * Reorders a task by swapping with its neighbor.
 *
 * @param {Array} currentTasks - Current tasks array
 * @param {string} taskId - ID of task to move
 * @param {'up'|'down'} direction - Direction to move
 * @returns {Promise<Object>} { success, updatedTasks }
 */
export const reorderTask = async (currentTasks, taskId, direction) => {
    const taskIndex = currentTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return { success: false, updatedTasks: currentTasks };
    if (direction === 'up' && taskIndex === 0) return { success: false, updatedTasks: currentTasks };
    if (direction === 'down' && taskIndex === currentTasks.length - 1) return { success: false, updatedTasks: currentTasks };

    const updated = [...currentTasks];
    const swapIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1;
    [updated[taskIndex], updated[swapIndex]] = [updated[swapIndex], updated[taskIndex]];

    await saveAllTasks(updated);
    return { success: true, updatedTasks: updated };
};

/**
 * Replaces the full task list with a new ordered array (for drag-and-drop).
 *
 * @param {Array} newOrderedTasks - Tasks in new order
 * @returns {Promise<Object>} { success, updatedTasks }
 */
export const reorderTasks = async (newOrderedTasks) => {
    await saveAllTasks(newOrderedTasks);
    return { success: true, updatedTasks: newOrderedTasks };
};

/**
 * Computes task stats (uses Phase 0 progressCalculator).
 *
 * @param {Array} tasks - Tasks array
 * @returns {Object} { totalDuration, completedDuration, progress }
 */
export const getTaskStats = (tasks) => {
    return calculateDailyTaskStats(tasks);
};
