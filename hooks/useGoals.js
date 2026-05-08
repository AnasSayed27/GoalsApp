/**
 * useGoals — Thin React state wrapper over GoalService.
 *
 * Replaces useGoalsData.js. Key differences:
 *   - No inline calculateGoalProgress() (uses progressCalculator via GoalService)
 *   - All CRUD delegates to GoalService
 *   - useFocusEffect for auto-reload on screen focus
 */

import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import * as GoalService from '../services/GoalService';

export const useGoals = () => {
    const [goals, setGoals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadGoals = useCallback(async () => {
        setIsLoading(true);
        const loaded = await GoalService.loadAllGoals();
        setGoals(loaded);
        setIsLoading(false);
    }, []);

    // Auto-reload when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadGoals();
        }, [loadGoals])
    );

    const addGoal = useCallback(async (goalData) => {
        const result = await GoalService.addGoal(goals, goalData);
        if (result.success) {
            setGoals(result.updatedGoals);
        }
        return result.success;
    }, [goals]);

    const updateGoal = useCallback(async (updatedGoal) => {
        // Optimistic update
        const result = await GoalService.updateGoal(goals, updatedGoal);
        if (result.success) {
            setGoals(result.updatedGoals);
        }
    }, [goals]);

    const deleteGoal = useCallback(async (goalId) => {
        const result = await GoalService.deleteGoal(goals, goalId);
        if (result.success) {
            setGoals(result.updatedGoals);
        }
    }, [goals]);

    const getGoalById = useCallback((goalId) => {
        return GoalService.getGoalById(goals, goalId);
    }, [goals]);

    return {
        goals,
        isLoading,
        loadGoals,
        addGoal,
        updateGoal,
        deleteGoal,
        getGoalById,
    };
};
