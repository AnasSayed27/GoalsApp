/**
 * StreakService — Data access layer for streaks/heatmap.
 *
 * Extracts all storage ops and stat computation from useStreaksData.js.
 * The 300-line processDataAndUpdateState() becomes composable pure functions here.
 */

import { StorageService } from './StorageService';
import { STORAGE_KEYS } from '../constants/StorageKeys';
import { STREAK_WIN_THRESHOLD_HOURS, STREAK_IDEAL_HOURS_PER_DAY } from '../constants/Config';
import { normalizeStreakData, buildLevelInfo } from '../models/Streak';
import { getUTCDateString, getStartOfWeek } from '../utils/dateHelpers';

/**
 * Loads and normalizes streak data from storage.
 *
 * @returns {Promise<Object>} { heatmapData: {...} }
 */
export const loadStreakData = async () => {
    let raw = await StorageService.get(STORAGE_KEYS.STREAKS);
    if (!raw) {
        const legacy = await StorageService.get(STORAGE_KEYS.LEGACY_STREAKS);
        if (legacy) {
            const normalized = normalizeStreakData(legacy);
            await StorageService.save(STORAGE_KEYS.STREAKS, normalized);
            return normalized;
        }
    }
    return normalizeStreakData(raw);
};

/**
 * Saves streak data to storage (only heatmapData is persisted).
 *
 * @param {Object} heatmapData - The heatmap { 'YYYY-MM-DD': hours }
 * @returns {Promise<boolean>}
 */
export const saveStreakData = async (heatmapData) => {
    return StorageService.save(STORAGE_KEYS.STREAKS, { heatmapData });
};

/**
 * Clears all streak data from storage.
 *
 * @returns {Promise<boolean>}
 */
export const clearStreakData = async () => {
    return StorageService.remove(STORAGE_KEYS.STREAKS);
};

/**
 * Computes streak counts from heatmap data.
 *
 * @param {Object} heatmapData
 * @returns {Object} { currentStreak, longestStreak }
 */
export const computeStreaks = (heatmapData) => {
    const threshold = STREAK_WIN_THRESHOLD_HOURS;

    const datesWithWins = Object.keys(heatmapData)
        .filter(dateStr => typeof heatmapData[dateStr] === 'number' && heatmapData[dateStr] >= threshold)
        .map(dateStr => new Date(dateStr + 'T00:00:00Z'))
        .sort((a, b) => a.getTime() - b.getTime());

    let longestStreak = 0;
    let currentStreak = 0;

    if (datesWithWins.length > 0) {
        let tempStreak = 1;
        longestStreak = 1;

        for (let i = 1; i < datesWithWins.length; i++) {
            const diffDays = Math.round(
                (datesWithWins[i].getTime() - datesWithWins[i - 1].getTime()) / (1000 * 60 * 60 * 24)
            );
            if (diffDays === 1) {
                tempStreak++;
            } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        // Check if current streak is active (last active date is today or yesterday)
        const todayNormalized = new Date();
        todayNormalized.setUTCHours(0, 0, 0, 0);
        const lastActive = datesWithWins[datesWithWins.length - 1];
        const diffFromToday = Math.round(
            (todayNormalized.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
        );

        currentStreak = diffFromToday <= 1 ? tempStreak : 0;
    }

    return { currentStreak, longestStreak };
};

/**
 * Computes aggregate hour stats from heatmap data.
 *
 * @param {Object} heatmapData
 * @returns {Object} { totalHours, averageHours, totalDaysWon }
 */
export const computeHourStats = (heatmapData) => {
    let totalHours = 0;
    let recordedDays = 0;
    let totalDaysWon = 0;
    const threshold = STREAK_WIN_THRESHOLD_HOURS;

    Object.values(heatmapData).forEach(hours => {
        if (typeof hours === 'number') {
            totalHours += hours;
            recordedDays++;
            if (hours >= threshold) totalDaysWon++;
        }
    });

    return {
        totalHours,
        averageHours: recordedDays > 0 ? totalHours / recordedDays : 0,
        totalDaysWon,
    };
};

/**
 * Computes time-windowed stats: this week, monthly, trends, growth.
 *
 * @param {Object} heatmapData
 * @returns {Object} All time-windowed stats
 */
export const computeWindowedStats = (heatmapData) => {
    const threshold = STREAK_WIN_THRESHOLD_HOURS;
    const today = new Date();
    const todayStr = getUTCDateString(today);
    const hoursToday = heatmapData[todayStr] || 0;
    const hasLoggedToday = hoursToday > 0;
    const isTodayWin = hoursToday >= threshold;

    const yesterday = new Date(today);
    yesterday.setUTCDate(today.getUTCDate() - 1);

    const endDateForStats = hasLoggedToday ? new Date(today) : new Date(yesterday);
    endDateForStats.setUTCHours(0, 0, 0, 0);

    const startOfWeek = getStartOfWeek(endDateForStats);

    // This week stats
    let thisWeekScore = 0;
    let thisWeekHours = 0;
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setUTCDate(startOfWeek.getUTCDate() + i);
        if (d > endDateForStats) break;
        const dStr = getUTCDateString(d);
        const h = heatmapData[dStr] || 0;
        if (h >= threshold) thisWeekScore++;
        thisWeekHours += h;
    }

    // Monthly (last 30 days) + last 7 days avg
    let monthlyScore = 0;
    let last7DaysHours = 0;
    for (let i = 0; i < 30; i++) {
        const d = new Date(endDateForStats);
        d.setUTCDate(endDateForStats.getUTCDate() - i);
        const dStr = getUTCDateString(d);
        const h = heatmapData[dStr] || 0;
        if (h >= threshold) monthlyScore++;
        if (i < 7) last7DaysHours += h;
    }
    const thisWeekAvg = last7DaysHours / 7;
    const consistencyScore = monthlyScore / 30;

    // Avg intensity (90 days)
    let last90DaysHours = 0;
    for (let i = 0; i < 90; i++) {
        const d = new Date(endDateForStats);
        d.setUTCDate(endDateForStats.getUTCDate() - i);
        const dStr = getUTCDateString(d);
        last90DaysHours += (heatmapData[dStr] || 0);
    }
    const avgIntensity = last90DaysHours / 90;

    // Trend + target progress
    const daysInPeriod = Math.floor(
        (endDateForStats.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    const idealHours = daysInPeriod * STREAK_IDEAL_HOURS_PER_DAY;

    let trendPercentage = 0;
    if (idealHours === 0) {
        trendPercentage = thisWeekHours > 0 ? 100 : 0;
    } else {
        trendPercentage = ((thisWeekHours - idealHours) / idealHours) * 100;
    }
    const targetProgress = idealHours > 0 ? (thisWeekHours / idealHours) * 100 : 0;

    // Week-over-week growth
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setUTCDate(startOfWeek.getUTCDate() - 7);
    let lastWeekHours = 0;
    for (let i = 0; i < daysInPeriod; i++) {
        const d = new Date(startOfLastWeek);
        d.setUTCDate(startOfLastWeek.getUTCDate() + i);
        lastWeekHours += (heatmapData[getUTCDateString(d)] || 0);
    }
    const weekOverWeekGrowth = lastWeekHours > 0
        ? ((thisWeekHours - lastWeekHours) / lastWeekHours) * 100
        : (thisWeekHours > 0 ? 100 : 0);

    // Tier/Level calculation (calendar month)
    const lastDay = endDateForStats.getUTCDate();
    const monthIdx = endDateForStats.getUTCMonth();
    const yearNum = endDateForStats.getUTCFullYear();

    let monthDaysWon = 0;
    let monthTotalHours = 0;
    for (let d = 1; d <= lastDay; d++) {
        const date = new Date(Date.UTC(yearNum, monthIdx, d));
        const h = heatmapData[getUTCDateString(date)] || 0;
        if (h >= threshold) monthDaysWon++;
        monthTotalHours += h;
    }

    // Safety logic: don't penalize score at start of new day
    const daysInDivisor = isTodayWin ? lastDay : (hasLoggedToday ? lastDay - 1 : lastDay);

    const levelInfo = buildLevelInfo({
        daysWonThisMonth: monthDaysWon,
        totalHoursThisMonth: monthTotalHours,
        daysInDivisor,
    });

    return {
        thisWeekScore,
        thisWeekHours,
        monthlyScore,
        thisWeekAvg,
        avgIntensity,
        trendPercentage,
        targetProgress,
        weekOverWeekGrowth,
        consistencyScore,
        levelInfo,
    };
};

/**
 * Computes ALL derived stats from heatmap data in one call.
 * Replaces the 260-line processDataAndUpdateState() in useStreaksData.js.
 *
 * @param {Object} heatmapData
 * @returns {Object} Complete stats object
 */
export const computeAllStats = (heatmapData) => {
    const streaks = computeStreaks(heatmapData);
    const hourStats = computeHourStats(heatmapData);
    const windowed = computeWindowedStats(heatmapData);

    return {
        ...streaks,
        ...hourStats,
        ...windowed,
        heatmapData,
    };
};
