/**
 * Streak helper functions — shared between streak components.
 * Extracted from the StreakComponents.js monolith.
 */

import { getUTCDateString } from '../../utils/dateHelpers';

/**
 * Returns the Monday start of the week for a given UTC date.
 */
export const getStartOfWeekUTC = (date) => {
    const dt = new Date(date.getTime());
    dt.setUTCHours(0, 0, 0, 0);
    const dayOfWeek = dt.getUTCDay();
    const mondayDiff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    dt.setUTCDate(dt.getUTCDate() - mondayDiff);
    return dt;
};

/**
 * Maps hours to a heatmap cell color.
 */
export const getCellColor = (hours, isFuture) => {
    if (isFuture) return '#f0f0f0';
    if (hours === undefined || hours === null) return '#e0e0e0';
    if (hours === 0) return '#e0e0e0';
    if (hours > 0 && hours <= 2) return '#f87171';
    if (hours > 2 && hours <= 3.5) return '#fbbf24';
    if (hours > 3.5 && hours <= 5) return '#4ade80';
    if (hours > 5) return '#166534';
    return '#e0e0e0';
};

/**
 * Generates quarterly time intervals for the full history filter.
 */
export const generateQuarters = (startDateStr) => {
    if (!startDateStr) return [{ label: 'All Time', start: null, end: null }];

    const firstDate = new Date(startDateStr + 'T00:00:00Z');
    const today = new Date();
    const intervals = [{ label: 'All Time', start: null, end: null }];

    const quarters = [
        { label: 'Jan-Mar', startMonth: 0, endMonth: 2 },
        { label: 'Apr-Jun', startMonth: 3, endMonth: 5 },
        { label: 'Jul-Sep', startMonth: 6, endMonth: 8 },
        { label: 'Oct-Dec', startMonth: 9, endMonth: 11 },
    ];

    const todayYear = today.getUTCFullYear();
    const todayQuarter = Math.floor(today.getUTCMonth() / 3);

    let y = firstDate.getUTCFullYear();
    let q = Math.floor(firstDate.getUTCMonth() / 3);

    while (y < todayYear || (y === todayYear && q <= todayQuarter)) {
        const quarterInfo = quarters[q];
        const start = new Date(Date.UTC(y, quarterInfo.startMonth, 1));
        const end = new Date(Date.UTC(y, quarterInfo.endMonth + 1, 0, 23, 59, 59, 999));

        intervals.push({ label: `${quarterInfo.label} ${y}`, start, end });

        q++;
        if (q > 3) { q = 0; y++; }
    }

    return intervals.reverse();
};
