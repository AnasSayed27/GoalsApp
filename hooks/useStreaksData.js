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
    const [thisWeekAvg, setThisWeekAvg] = useState(0);
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

        // Heatmap data is now kept indefinitely
        const cleanedHeatmapData = { ...validHeatmapData };

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

        // 2. This Week's Score (Days >= 2.5 this week, calculated up to yesterday)
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setUTCDate(today.getUTCDate() - 1);
        const todayStr = getUTCDateString(today);
        const hoursToday = cleanedHeatmapData[todayStr] || 0;
        const hasLoggedToday = hoursToday > 0;
        const isTodayWin = hoursToday >= 2.5;

        // Use today as end date if user has logged hours today, else use yesterday
        const endDateForStats = hasLoggedToday ? today : yesterday;
        endDateForStats.setUTCHours(0, 0, 0, 0); // Normalize endDateForStats to start of day UTC

        // 2. This Week (Monday-Sunday)
        const startOfWeek = new Date(endDateForStats); // Use endDateForStats for start of week calculation
        const dayOfWeek = startOfWeek.getUTCDay(); // 0 = Sunday
        // Adjust for Monday start: Sunday (0) becomes 6, Monday (1) becomes 0, etc.
        const mondayDiff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const diff = startOfWeek.getUTCDate() - mondayDiff;
        startOfWeek.setUTCDate(diff); // Start of week (Monday)

        let weekWon = 0;
        let weekHours = 0;
        // Count from start of week up to and including today/yesterday
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setUTCDate(startOfWeek.getUTCDate() + i);
            // Only count days up to the stats end date (today if logged, else yesterday)
            if (d > endDateForStats) break;
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

        // 3. Monthly Score (Last 30 Days from end date)
        let monthWon = 0;
        let last7DaysHours = 0;
        let last7DaysCount = 0;

        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(endDateForStats);
            checkDate.setUTCDate(endDateForStats.getUTCDate() - i);
            const dateStr = getUTCDateString(checkDate);
            if (cleanedHeatmapData[dateStr] && cleanedHeatmapData[dateStr] >= 2.5) {
                monthWon++;
            }

            // Last 7 Days from yesterday (for This Week Avg)
            if (i < 7) {
                if (cleanedHeatmapData[dateStr]) {
                    last7DaysHours += cleanedHeatmapData[dateStr];
                }
                last7DaysCount++;
            }
        }
        setMonthlyScore(monthWon);
        setConsistencyScore(monthWon / 30);

        // This Week Avg (Last 7 days average hrs/day from yesterday)
        setThisWeekAvg(last7DaysHours / 7);

        // Avg Intensity (Last 90 days average hrs/day)
        let last90DaysHours = 0;
        for (let i = 0; i < 90; i++) {
            const checkDate = new Date(endDateForStats);
            checkDate.setUTCDate(endDateForStats.getUTCDate() - i);
            const dateStr = getUTCDateString(checkDate);
            if (cleanedHeatmapData[dateStr]) {
                last90DaysHours += cleanedHeatmapData[dateStr];
            }
        }
        setAvgIntensity(last90DaysHours / 90);

        // 4. 7-Day Trend (Current Week vs Previous Full Week)
        // weekHours already contains hours from Monday up to endDateForStats (today/yesterday)
        let previousFullWeekHours = 0;
        const startOfPreviousWeek = new Date(startOfWeek);
        startOfPreviousWeek.setUTCDate(startOfWeek.getUTCDate() - 7);

        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfPreviousWeek);
            d.setUTCDate(startOfPreviousWeek.getUTCDate() + i);
            const dStr = getUTCDateString(d);
            if (cleanedHeatmapData[dStr]) {
                previousFullWeekHours += cleanedHeatmapData[dStr];
            }
        }

        let trendPercentage = 0;
        if (previousFullWeekHours === 0) {
            trendPercentage = weekHours > 0 ? 100 : 0;
        } else {
            trendPercentage = ((weekHours - previousFullWeekHours) / previousFullWeekHours) * 100;
        }
        setTrendPercentage(trendPercentage);

        // --- Dynamic Tier System (Calendar Month) ---
        const lastDayOfMonth = endDateForStats.getUTCDate();
        const monthMonth = endDateForStats.getUTCMonth();
        const monthYear = endDateForStats.getUTCFullYear();

        let monthDaysWonCount = 0;
        let monthTotalHoursSum = 0;

        // Iterate from 1st of month to endDateForStats (today if logged, else yesterday)
        for (let d = 1; d <= lastDayOfMonth; d++) {
            const date = new Date(Date.UTC(monthYear, monthMonth, d));
            const dateStr = getUTCDateString(date);
            const hours = cleanedHeatmapData[dateStr] || 0;

            if (hours >= 2.5) {
                monthDaysWonCount++;
            }
            monthTotalHoursSum += hours;
        }

        // Safety Logic for Tier Score:
        // Only include Today in the divisor/average calculation if it's already a win.
        // This prevents the score from dropping at the start of a new day.
        const daysToCountInDivisor = isTodayWin ? lastDayOfMonth : (hasLoggedToday ? lastDayOfMonth - 1 : lastDayOfMonth);
        const winsToCountInScore = monthDaysWonCount; // This already includes today if isTodayWin is true

        // 1. Consistency Score (Max 60)
        const effectiveWinRate = daysToCountInDivisor > 0 ? winsToCountInScore / daysToCountInDivisor : 0;
        const consistencyPoints = effectiveWinRate * 60;

        // 2. Intensity Score (Max 40)
        // Target: 6 hours avg = Max Score (Updated from 5)
        const effectiveAvgHours = winsToCountInScore > 0 ? monthTotalHoursSum / winsToCountInScore : 0;
        const intensityPoints = Math.min((effectiveAvgHours / 6) * 40, 40);

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
                avgHours: effectiveAvgHours.toFixed(1),
                winRate: Math.round(effectiveWinRate * 100)
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
        thisWeekAvg,
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
