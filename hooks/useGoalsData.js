import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { StorageService } from '../services/StorageService';
import { STORAGE_KEYS } from '../constants/StorageKeys';
import { useFocusEffect } from 'expo-router';

export const useGoalsData = () => {
    const [goals, setGoals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadGoals = useCallback(async () => {
        setIsLoading(true);
        const storedGoals = await StorageService.get(STORAGE_KEYS.GOALS, []);

        // Calculate progress for each goal
        const goalsWithProgress = storedGoals.map(goal => ({
            ...goal,
            progress: calculateGoalProgress(goal)
        }));

        setGoals(goalsWithProgress);
        setIsLoading(false);
    }, []);

    // Auto-load when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadGoals();
        }, [loadGoals])
    );

    const saveGoals = useCallback(async (newGoals) => {
        setGoals(newGoals); // Optimistic update
        // Remove calculated progress before saving to avoid data bloat/inconsistency
        const goalsToSave = newGoals.map(({ progress, ...rest }) => rest);
        await StorageService.save(STORAGE_KEYS.GOALS, goalsToSave);
    }, []);

    const addGoal = useCallback(async (goalData) => {
        const newGoal = {
            id: Date.now().toString(),
            ...goalData,
            createdAt: new Date().toISOString(),
            weeks: {}, // Initialize empty structure
            subgoals: []
        };
        // Use functional update to ensure we have latest state if needed, 
        // but here we rely on 'goals' from closure. 
        // Better to pass goals as dependency or use functional state update if possible.
        // Since we need to save to storage, we need the new list.
        // Let's use the current 'goals' state.
        const updated = [...goals, newGoal];
        await saveGoals(updated);
        return true;
    }, [goals, saveGoals]);

    const deleteGoal = useCallback(async (id) => {
        const updated = goals.filter(g => g.id !== id);
        await saveGoals(updated);
    }, [goals, saveGoals]);

    const updateGoal = useCallback(async (updatedGoal) => {
        const updatedGoals = goals.map(g => g.id === updatedGoal.id ? updatedGoal : g);
        await saveGoals(updatedGoals);
    }, [goals, saveGoals]);

    const getGoalById = useCallback((id) => {
        return goals.find(g => g.id === id);
    }, [goals]);

    // --- Helper: Calculate Progress ---
    const calculateGoalProgress = (goal) => {
        if (!goal) return 0;

        let total = 0;
        let completed = 0;

        const traverse = (g) => {
            if (g.weeks) {
                Object.values(g.weeks).forEach((w) => {
                    if (w.tasks && Array.isArray(w.tasks)) {
                        total += w.tasks.length;
                        completed += w.tasks.filter((t) => t.completed).length;
                    }
                });
            }
            if (g.subgoals && Array.isArray(g.subgoals)) {
                g.subgoals.forEach(traverse);
            }
        };

        traverse(goal);
        return total > 0 ? completed / total : 0;
    };

    return {
        goals,
        isLoading,
        loadGoals,
        addGoal,
        updateGoal,
        deleteGoal,
        getGoalById
    };
};
