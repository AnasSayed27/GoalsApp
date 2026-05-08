/**
 * useTasks — Thin React state wrapper over TaskService.
 *
 * Replaces useTasksData.js. Same public API, but all logic
 * delegates to TaskService. Stats computed via progressCalculator.
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as TaskService from '../services/TaskService';

export const useTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadTasks = useCallback(async () => {
        setIsLoading(true);
        const loaded = await TaskService.loadAllTasks();
        setTasks(loaded);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const addTask = useCallback(async (name, duration) => {
        if (!name || duration === undefined) {
            Alert.alert('Error', 'Please enter name and duration');
            return false;
        }
        const result = await TaskService.addTask(tasks, name, duration);
        if (result.success) {
            setTasks(result.updatedTasks);
            return true;
        }
        Alert.alert('Error', result.error || 'Failed to add task.');
        return false;
    }, [tasks]);

    const toggleComplete = useCallback(async (id) => {
        const result = await TaskService.toggleTaskComplete(tasks, id);
        if (result.success) {
            setTasks(result.updatedTasks);
        }
        return result.becameCompleted;
    }, [tasks]);

    const deleteTask = useCallback(async (id) => {
        const result = await TaskService.deleteTask(tasks, id);
        if (result.success) {
            setTasks(result.updatedTasks);
        }
    }, [tasks]);

    const editTask = useCallback(async (id, newName, newDuration) => {
        if (!newName) {
            Alert.alert('Error', 'Task name cannot be empty');
            return false;
        }
        const result = await TaskService.editTask(tasks, id, newName, newDuration);
        if (result.success) {
            setTasks(result.updatedTasks);
            return true;
        }
        return false;
    }, [tasks]);

    const reorderTask = useCallback(async (id, direction) => {
        const result = await TaskService.reorderTask(tasks, id, direction);
        if (result.success) {
            setTasks(result.updatedTasks);
        }
    }, [tasks]);

    const reorderTasks = useCallback(async (newOrderedTasks) => {
        const result = await TaskService.reorderTasks(newOrderedTasks);
        if (result.success) {
            setTasks(result.updatedTasks);
        }
    }, []);

    // Derived stats via service
    const stats = TaskService.getTaskStats(tasks);

    return {
        tasks,
        isLoading,
        addTask,
        toggleComplete,
        deleteTask,
        editTask,
        reorderTask,
        reorderTasks,
        stats,
    };
};
