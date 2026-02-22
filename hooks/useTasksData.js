import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { StorageService } from '../services/StorageService';
import { STORAGE_KEYS } from '../constants/StorageKeys';

export const useTasksData = () => {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadTasks = useCallback(async () => {
        setIsLoading(true);
        const storedTasks = await StorageService.get(STORAGE_KEYS.TASKS, []);
        setTasks(storedTasks);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const saveTasks = async (newTasks) => {
        setTasks(newTasks); // Optimistic update
        await StorageService.save(STORAGE_KEYS.TASKS, newTasks);
    };

    const addTask = async (name, duration) => {
        if (!name || duration === undefined) {
            Alert.alert('Error', 'Please enter name and duration');
            return false;
        }
        const newTask = {
            id: Date.now().toString(),
            name,
            duration,
            completed: false,
            createdAt: new Date().toISOString(),
        };
        const updated = [...tasks, newTask];
        await saveTasks(updated);
        return true;
    };

    const toggleComplete = async (id) => {
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex === -1) return false;

        const task = tasks[taskIndex];
        const wasCompleted = task.completed;
        const updated = tasks.map((t, index) =>
            index === taskIndex ? { ...t, completed: !t.completed } : t
        );

        await saveTasks(updated);
        return !wasCompleted; // Returns true if it became completed (for congratulations)
    };

    const deleteTask = async (id) => {
        const updated = tasks.filter(t => t.id !== id);
        await saveTasks(updated);
    };

    const editTask = async (id, newName, newDuration) => {
        if (!newName) {
            Alert.alert('Error', 'Task name cannot be empty');
            return false;
        }
        const updated = tasks.map(task =>
            task.id === id ? { ...task, name: newName, duration: newDuration } : task
        );
        await saveTasks(updated);
        return true;
    };

    const reorderTask = async (id, direction) => {
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex === -1) return;
        if (direction === 'up' && taskIndex === 0) return;
        if (direction === 'down' && taskIndex === tasks.length - 1) return;

        const updated = [...tasks];
        const swapIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1;

        const temp = updated[taskIndex];
        updated[taskIndex] = updated[swapIndex];
        updated[swapIndex] = temp;

        await saveTasks(updated);
    };

    const reorderTasks = async (newOrderedTasks) => {
        await saveTasks(newOrderedTasks);
    };

    // Derived state
    const totalDuration = tasks.reduce((sum, task) => sum + task.duration, 0);
    const completedDuration = tasks.reduce((sum, task) => task.completed ? sum + task.duration : sum, 0);
    const progress = totalDuration > 0 ? completedDuration / totalDuration : 0;

    return {
        tasks,
        isLoading,
        addTask,
        toggleComplete,
        deleteTask,
        editTask,
        reorderTask,
        reorderTasks,
        stats: {
            totalDuration,
            completedDuration,
            progress
        }
    };
};
