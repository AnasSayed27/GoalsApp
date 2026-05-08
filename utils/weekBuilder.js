/**
 * Week Builder — Pure functions for generating and rebuilding week structures.
 *
 * This is THE SINGLE PLACE where weeks are created from date ranges.
 * Previously duplicated in: detail.js, subdetail.js, addSub.js (3 copies).
 */

import { createWeek } from '../models/Goal';
import { toUTCDate, toDateString } from './dateHelpers';

/**
 * Generates a map of week objects between two dates.
 * Each week spans 7 days (Mon-Sun), with the final week
 * potentially being shorter if endDate doesn't align.
 *
 * @param {string} startDateStr - Start date 'YYYY-MM-DD'
 * @param {string} endDateStr   - End date 'YYYY-MM-DD'
 * @returns {Object} Map of { week_0: {...}, week_1: {...}, ... }
 */
export const getWeeksBetweenDates = (startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr) {
        return {};
    }

    const weeks = {};
    const currentWeekStart = toUTCDate(startDateStr);
    const endDate = toUTCDate(endDateStr);
    let weekIndex = 0;

    while (currentWeekStart <= endDate) {
        const weekEndDate = new Date(currentWeekStart);
        weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);

        const actualEndDate = weekEndDate > endDate ? endDate : weekEndDate;

        weeks[`week_${weekIndex}`] = createWeek({
            startDate: toDateString(currentWeekStart),
            endDate: toDateString(actualEndDate),
        });

        weekIndex++;
        currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() + 7);
    }

    return weeks;
};

/**
 * Rebuilds a parent goal's weeks, excluding date ranges consumed by subgoals.
 *
 * When a goal has subgoals, the parent's own weeks should only cover the
 * time periods NOT occupied by subgoals. This function computes those
 * "gap" periods and generates weeks for them.
 *
 * Previously duplicated in: detail.js, subdetail.js, addSub.js (3 copies).
 *
 * @param {Object} goalObj - The parent goal object
 * @param {string} goalObj.startDate  - Parent start date
 * @param {string} goalObj.endDate    - Parent end date
 * @param {Array}  goalObj.subgoals   - Array of subgoal objects
 * @returns {Object} Map of week objects covering non-subgoal periods
 */
export const rebuildParentWeeks = (goalObj) => {
    if (!goalObj || !goalObj.startDate || !goalObj.endDate) {
        return {};
    }

    const subgoals = goalObj.subgoals || [];

    // If no subgoals, just build weeks for the full range
    if (subgoals.length === 0) {
        return getWeeksBetweenDates(goalObj.startDate, goalObj.endDate);
    }

    // Sort exclusion ranges by start date
    const exclusions = subgoals
        .map(sg => ({
            start: sg.startDate,
            end: sg.endDate,
        }))
        .sort((a, b) => toUTCDate(a.start) - toUTCDate(b.start));

    const result = {};
    let weekIdx = 0;

    const pushSegment = (segStart, segEnd) => {
        const segWeeks = getWeeksBetweenDates(segStart, segEnd);
        Object.keys(segWeeks).forEach(wkKey => {
            result[`week_${weekIdx}`] = segWeeks[wkKey];
            weekIdx++;
        });
    };

    let current = toUTCDate(goalObj.startDate);
    const end = toUTCDate(goalObj.endDate);

    exclusions.forEach(ex => {
        const exStart = toUTCDate(ex.start);
        const exEnd = toUTCDate(ex.end);

        if (current <= exStart) {
            // Segment from current to day before exclusion starts
            const segEnd = new Date(exStart);
            segEnd.setUTCDate(segEnd.getUTCDate() - 1);

            if (current <= segEnd) {
                pushSegment(toDateString(current), toDateString(segEnd));
            }
        }

        // Move current past this exclusion
        current = new Date(exEnd);
        current.setUTCDate(current.getUTCDate() + 1);
    });

    // Final trailing segment after last subgoal
    if (current <= end) {
        pushSegment(toDateString(current), goalObj.endDate);
    }

    return result;
};

/**
 * Initializes weeks for a goal that doesn't have them yet.
 * Chooses between full-range weeks or rebuilt parent weeks
 * depending on whether subgoals exist.
 *
 * @param {Object} goal - A goal object
 * @returns {Object} Week map
 */
export const initializeWeeks = (goal) => {
    if (!goal || !goal.startDate || !goal.endDate) {
        return {};
    }

    if (goal.subgoals && goal.subgoals.length > 0) {
        return rebuildParentWeeks(goal);
    }

    return getWeeksBetweenDates(goal.startDate, goal.endDate);
};

/**
 * Extracts the week index number from a week key string.
 *
 * @param {string} weekKey - e.g. 'week_3'
 * @returns {number} The index, e.g. 3
 */
export const getWeekIndex = (weekKey) => {
    if (!weekKey || typeof weekKey !== 'string') return 0;
    const parts = weekKey.split('_');
    return parseInt(parts[1], 10) || 0;
};

/**
 * Returns week entries sorted by index.
 *
 * @param {Object} weeks - Week map { week_0: {...}, week_2: {...}, ... }
 * @returns {Array} Sorted array of [weekKey, weekData] tuples
 */
export const getSortedWeeks = (weeks) => {
    if (!weeks || typeof weeks !== 'object') return [];

    return Object.entries(weeks).sort(
        ([keyA], [keyB]) => getWeekIndex(keyA) - getWeekIndex(keyB)
    );
};
