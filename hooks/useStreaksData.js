import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { StorageService } from '../services/StorageService';
import { STORAGE_KEYS } from '../constants/StorageKeys';

// Helper to get date string in YYYY-MM-DD format (UTC)
export const getUTCDateString = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        const now = new Date();
        return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
    }
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};

export const useStreaksData = () => {
    const [heatmapData, setHeatmapData] = useState({});
    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [totalHours, setTotalHours] = useState(0);
    const [averageHours, setAverageHours] = useState(0);

    // New Stats State
    const [totalDaysWon, setTotalDaysWon] = useState(0);
    const [thisWeekScore, setThisWeekScore] = useState(0);
    const [monthlyScore, setMonthlyScore] = useState(0);

    // New Quantity Stats
    const [thisWeekHours, setThisWeekHours] = useState(0);
    const [avgIntensity, setAvgIntensity] = useState(0);
    const [trendPercentage, setTrendPercentage] = useState(0);

    // Gamification State
    const [levelInfo, setLevelInfo] = useState({
        title: "Starter",
        icon: "🌱",
        color: "#2ecc71",
        score: 0,
        details: {
            consistency: 0,
            intensity: 0,
            avgHours: 0,
            winRate: 0
        }
    });

    const [consistencyScore, setConsistencyScore] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const saveData = async (dataToSave) => {
        const minimalData = {
            heatmapData: dataToSave.heatmapData,
        };
        await StorageService.save(STORAGE_KEYS.STREAKS, minimalData);
    };

    const processDataAndUpdateState = useCallback((currentHeatmapData) => {
        const validHeatmapData = (typeof currentHeatmapData === 'object' && currentHeatmapData !== null && !Array.isArray(currentHeatmapData))
            ? currentHeatmapData
            : {};

        // Clean up old data - only keep data from the last 6 months
        const cleanedHeatmapData = {};
        const cutoffDate = new Date();
        cutoffDate.setUTCMonth(cutoffDate.getUTCMonth() - 6);

        Object.entries(validHeatmapData).forEach(([dateStr, hours]) => {
            const entryDate = new Date(dateStr + 'T00:00:00Z');
            if (entryDate >= cutoffDate) {
                cleanedHeatmapData[dateStr] = hours;
            }
        });

        // Filter for days with hours >= 2.5
        const datesWithSignificantHours = Object.keys(cleanedHeatmapData)
            .filter(dateStr => typeof cleanedHeatmapData[dateStr] === 'number' && cleanedHeatmapData[dateStr] >= 2.5)
            .map(dateStr => new Date(dateStr + 'T00:00:00Z'))
            .sort((a, b) => a.getTime() - b.getTime());

        let newLongestStreak = 0;
        let newCurrentStreak = 0;

        if (datesWithSignificantHours.length > 0) {
            let tempStreak = 1;
            newLongestStreak = 1;

            for (let i = 1; i < datesWithSignificantHours.length; i++) {
                const prevDate = datesWithSignificantHours[i - 1];
                const currDate = datesWithSignificantHours[i];
                const diffTime = currDate.getTime() - prevDate.getTime();
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    tempStreak++;
                } else {
                    newLongestStreak = Math.max(newLongestStreak, tempStreak);
                    tempStreak = 1;
                }
            }
            newLongestStreak = Math.max(newLongestStreak, tempStreak);

            const todayNormalized = new Date();
            todayNormalized.setUTCHours(0, 0, 0, 0);
            const lastActiveDate = datesWithSignificantHours[datesWithSignificantHours.length - 1];
            const diffFromTodayInDays = Math.round((todayNormalized.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffFromTodayInDays <= 1) {
                newCurrentStreak = tempStreak;
            } else {
                newCurrentStreak = 0;
            }
        }

        setCurrentStreak(newCurrentStreak);
        setLongestStreak(newLongestStreak);

        let sumHours = 0;
        let recordedDaysCount = 0;
        Object.values(cleanedHeatmapData).forEach(hours => {
            if (typeof hours === 'number') {
                sumHours += hours;
                recordedDaysCount++;
            }
        });

        setTotalHours(sumHours);
        setAverageHours(recordedDaysCount > 0 ? sumHours / recordedDaysCount : 0);

        // --- Discipline Stats Calculations ---

        // 1. Total Days Won (Lifetime)
        let totalWon = 0;
        Object.values(cleanedHeatmapData).forEach(hours => {
            if (typeof hours === 'number' && hours >= 2.5) {
                totalWon++;
            }
        });
        setTotalDaysWon(totalWon);

        // 2. This Week's Score (Days >= 2.5 this week)
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setUTCHours(0, 0, 0, 0);
        const dayOfWeek = startOfWeek.getUTCDay(); // 0 = Sunday
        const diff = startOfWeek.getUTCDate() - dayOfWeek;
        startOfWeek.setUTCDate(diff); // Start of week (Sunday)

        let weekWon = 0;
        let weekHours = 0;
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setUTCDate(startOfWeek.getUTCDate() + i);
            const dStr = getUTCDateString(d);
            if (cleanedHeatmapData[dStr]) {
                if (cleanedHeatmapData[dStr] >= 2.5) {
                    weekWon++;
                }
                weekHours += cleanedHeatmapData[dStr];
            }
        }
        setThisWeekScore(weekWon);
        setThisWeekHours(weekHours);

        // 3. Monthly Score (Last 30 Days)
        let monthWon = 0;
        let last7DaysHours = 0;
        let last7DaysCount = 0;

        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today);
            checkDate.setUTCDate(today.getUTCDate() - i);
            const dateStr = getUTCDateString(checkDate);
            if (cleanedHeatmapData[dateStr] && cleanedHeatmapData[dateStr] >= 2.5) {
                monthWon++;
            }

            // Avg Intensity (Last 7 Days)
            if (i < 7) {
                if (cleanedHeatmapData[dateStr]) {
                    last7DaysHours += cleanedHeatmapData[dateStr];
                }
                last7DaysCount++;
            }
        }
        setMonthlyScore(monthWon);
        setConsistencyScore(monthWon / 30);
        setAvgIntensity(last7DaysCount > 0 ? last7DaysHours / last7DaysCount : 0);

        // 4. 7-Day Trend (vs Previous 7 Days)
        let previous7DaysHours = 0;
        for (let i = 7; i < 14; i++) {
            const checkDate = new Date(today);
            checkDate.setUTCDate(today.getUTCDate() - i);
            const dateStr = getUTCDateString(checkDate);
            if (cleanedHeatmapData[dateStr]) {
                previous7DaysHours += cleanedHeatmapData[dateStr];
            }
        }

        let trendPercentage = 0;
        if (previous7DaysHours === 0) {
            trendPercentage = last7DaysHours > 0 ? 100 : 0;
        } else {
            trendPercentage = ((last7DaysHours - previous7DaysHours) / previous7DaysHours) * 100;
        }
        setTrendPercentage(trendPercentage);

        // --- Dynamic Tier System (Calendar Month) ---
        const now = new Date();
        const currentMonth = now.getUTCMonth();
        const currentYear = now.getUTCFullYear();
        // const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // Not used currently
        const dayOfMonth = now.getUTCDate(); // Days passed so far (1-31)

        let monthDaysWon = 0;
        let monthTotalHours = 0;

        // Iterate from 1st to today
        for (let d = 1; d <= dayOfMonth; d++) {
            const date = new Date(Date.UTC(currentYear, currentMonth, d));
            const dateStr = getUTCDateString(date);
            const hours = cleanedHeatmapData[dateStr] || 0;

            if (hours >= 2.5) {
                monthDaysWon++;
            }
            monthTotalHours += hours;
        }

        // 1. Consistency Score (Max 60)
        // Based on Win Rate so far this month
        const monthWinRate = dayOfMonth > 0 ? monthDaysWon / dayOfMonth : 0;
        const consistencyPoints = monthWinRate * 60;

        // 2. Intensity Score (Max 40)
        // Target: 5 hours avg = Max Score
        const avgHoursActive = monthDaysWon > 0 ? monthTotalHours / monthDaysWon : 0;
        const intensityPoints = Math.min((avgHoursActive / 5) * 40, 40);

        const totalScore = Math.round(consistencyPoints + intensityPoints);

        const TIERS = [
            { min: 90, title: "Titan", icon: "🏆", color: "#f1c40f" },       // Gold
            { min: 70, title: "Warrior", icon: "⚔️", color: "#e67e22" },     // Orange
            { min: 50, title: "Guardian", icon: "🛡️", color: "#3498db" },    // Blue
            { min: 25, title: "Novice", icon: "🌱", color: "#2ecc71" },      // Green
            { min: 0, title: "Slacker", icon: "😴", color: "#95a5a6" }       // Grey
        ];

        let currentTier = TIERS[TIERS.length - 1];
        for (let tier of TIERS) {
            if (totalScore >= tier.min) {
                currentTier = tier;
                break;
            }
        }

        setLevelInfo({
            title: currentTier.title,
            icon: currentTier.icon,
            color: currentTier.color,
            score: totalScore,
            details: {
                consistency: Math.round(consistencyPoints),
                intensity: Math.round(intensityPoints),
                avgHours: avgHoursActive.toFixed(1),
                winRate: Math.round(monthWinRate * 100)
            }
        });

        setHeatmapData(cleanedHeatmapData);
        return { heatmapData: cleanedHeatmapData };
    }, []);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const storedData = await StorageService.get(STORAGE_KEYS.STREAKS);
        processDataAndUpdateState(storedData?.heatmapData || {});
        setIsLoading(false);
    }, [processDataAndUpdateState]);

    const updateHoursForDate = async (dateStr, hours) => {
        const updatedHeatmapData = { ...heatmapData, [dateStr]: hours };
        const processed = processDataAndUpdateState(updatedHeatmapData);
        await saveData(processed);
    };

    const clearData = async () => {
        const success = await StorageService.remove(STORAGE_KEYS.STREAKS);
        if (success) {
            processDataAndUpdateState({});
        }
        return success;
    };

    return {
        heatmapData,
        currentStreak,
        longestStreak,
        totalHours,
        averageHours,
        totalDaysWon,
        thisWeekScore,
        monthlyScore,
        thisWeekHours,
        avgIntensity,
        trendPercentage,
        levelInfo,
        consistencyScore,
        isLoading,
        loadData,
        updateHoursForDate,
        clearData
    };
};
