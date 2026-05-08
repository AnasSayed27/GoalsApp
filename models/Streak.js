/**
 * Streak Data Model — Single source of truth for streak/heatmap data shape.
 *
 * Storage format: { heatmapData: { 'YYYY-MM-DD': hoursWorked, ... } }
 * All derived stats (streaks, tiers, scores) are computed, never stored.
 */

import { TIERS, TIER_CONSISTENCY_MAX_POINTS, TIER_INTENSITY_MAX_POINTS, STREAK_MAX_AVG_HOURS_TARGET } from '../constants/Config';

/**
 * Creates the default (empty) streak data structure.
 *
 * @returns {Object} A clean streak data object
 */
export const createStreakData = () => ({
    heatmapData: {},
});

/**
 * Normalizes streak data loaded from storage.
 * Ensures the shape is correct regardless of what was stored.
 *
 * @param {Object|null} storedData - Raw data from AsyncStorage
 * @returns {Object} A normalized streak data object
 */
export const normalizeStreakData = (storedData) => {
    if (!storedData || typeof storedData !== 'object') {
        return createStreakData();
    }

    const heatmapData = {};

    // Only keep valid date->number entries
    if (storedData.heatmapData && typeof storedData.heatmapData === 'object' && !Array.isArray(storedData.heatmapData)) {
        Object.entries(storedData.heatmapData).forEach(([dateStr, hours]) => {
            if (typeof hours === 'number' && hours >= 0) {
                heatmapData[dateStr] = hours;
            }
        });
    }

    return { heatmapData };
};

/**
 * Creates a default Level Info object (the gamification tier display).
 *
 * @returns {Object} Default level info
 */
export const createDefaultLevelInfo = () => ({
    title: TIERS[TIERS.length - 1].title,
    icon: TIERS[TIERS.length - 1].icon,
    color: TIERS[TIERS.length - 1].color,
    score: 0,
    details: {
        consistency: 0,
        intensity: 0,
        avgHours: 0,
        winRate: 0,
    },
});

/**
 * Determines the tier based on a total score.
 *
 * @param {number} totalScore - Score out of 100
 * @returns {Object} The matching tier object from TIERS
 */
export const getTierForScore = (totalScore) => {
    for (const tier of TIERS) {
        if (totalScore >= tier.min) {
            return tier;
        }
    }
    return TIERS[TIERS.length - 1]; // Fallback to lowest tier
};

/**
 * Builds a full Level Info object from computed stats.
 *
 * @param {Object} params
 * @param {number} params.daysWonThisMonth - Days with >= threshold hours
 * @param {number} params.totalHoursThisMonth - Sum of hours in counting period
 * @param {number} params.daysInDivisor - Number of days to divide by for win rate
 * @returns {Object} Full level info with tier, score, and detail breakdown
 */
export const buildLevelInfo = ({ daysWonThisMonth, totalHoursThisMonth, daysInDivisor }) => {
    const effectiveWinRate = daysInDivisor > 0 ? daysWonThisMonth / daysInDivisor : 0;
    const consistencyPoints = effectiveWinRate * TIER_CONSISTENCY_MAX_POINTS;

    const effectiveAvgHours = daysWonThisMonth > 0 ? totalHoursThisMonth / daysWonThisMonth : 0;
    const intensityPoints = Math.min(
        (effectiveAvgHours / STREAK_MAX_AVG_HOURS_TARGET) * TIER_INTENSITY_MAX_POINTS,
        TIER_INTENSITY_MAX_POINTS
    );

    const totalScore = Math.round(consistencyPoints + intensityPoints);
    const tier = getTierForScore(totalScore);

    return {
        title: tier.title,
        icon: tier.icon,
        color: tier.color,
        score: totalScore,
        details: {
            consistency: Math.round(consistencyPoints),
            intensity: Math.round(intensityPoints),
            avgHours: effectiveAvgHours.toFixed(1),
            winRate: Math.round(effectiveWinRate * 100),
        },
    };
};
