/**
 * useStreaks — Thin React state wrapper over StreakService.
 *
 * Replaces useStreaksData.js. The 370-line monster becomes ~80 lines.
 * All computation is delegated to StreakService.computeAllStats().
 */

import { useState, useCallback } from 'react';
import { createDefaultLevelInfo } from '../models/Streak';
import * as StreakService from '../services/StreakService';

export const useStreaks = () => {
    const [heatmapData, setHeatmapData] = useState({});
    const [stats, setStats] = useState({
        currentStreak: 0,
        longestStreak: 0,
        totalHours: 0,
        averageHours: 0,
        totalDaysWon: 0,
        thisWeekScore: 0,
        monthlyScore: 0,
        thisWeekHours: 0,
        thisWeekAvg: 0,
        avgIntensity: 0,
        trendPercentage: 0,
        targetProgress: 0,
        weekOverWeekGrowth: 0,
        consistencyScore: 0,
        levelInfo: createDefaultLevelInfo(),
    });
    const [isLoading, setIsLoading] = useState(true);

    const processAndSet = useCallback((rawHeatmap) => {
        const computed = StreakService.computeAllStats(rawHeatmap);
        setHeatmapData(computed.heatmapData);
        setStats({
            currentStreak: computed.currentStreak,
            longestStreak: computed.longestStreak,
            totalHours: computed.totalHours,
            averageHours: computed.averageHours,
            totalDaysWon: computed.totalDaysWon,
            thisWeekScore: computed.thisWeekScore,
            monthlyScore: computed.monthlyScore,
            thisWeekHours: computed.thisWeekHours,
            thisWeekAvg: computed.thisWeekAvg,
            avgIntensity: computed.avgIntensity,
            trendPercentage: computed.trendPercentage,
            targetProgress: computed.targetProgress,
            weekOverWeekGrowth: computed.weekOverWeekGrowth,
            consistencyScore: computed.consistencyScore,
            levelInfo: computed.levelInfo,
        });
        return computed.heatmapData;
    }, []);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const stored = await StreakService.loadStreakData();
        processAndSet(stored.heatmapData);
        setIsLoading(false);
    }, [processAndSet]);

    const updateHoursForDate = useCallback(async (dateStr, hours) => {
        const updatedHeatmap = { ...heatmapData, [dateStr]: hours };
        const processed = processAndSet(updatedHeatmap);
        await StreakService.saveStreakData(processed);
    }, [heatmapData, processAndSet]);

    const clearData = useCallback(async () => {
        const success = await StreakService.clearStreakData();
        if (success) {
            processAndSet({});
        }
        return success;
    }, [processAndSet]);

    return {
        heatmapData,
        // Spread stats for backward-compatible flat API
        ...stats,
        isLoading,
        loadData,
        updateHoursForDate,
        clearData,
    };
};
