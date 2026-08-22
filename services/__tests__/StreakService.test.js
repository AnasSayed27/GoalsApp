import {
    computeStreaks,
    computeHourStats,
    computeWindowedStats,
    computeAllStats,
} from '../StreakService';

describe('StreakService', () => {
    describe('computeStreaks', () => {
        test('returns 0 streaks for empty heatmap data', () => {
            expect(computeStreaks({})).toEqual({ currentStreak: 0, longestStreak: 0 });
        });

        test('identifies consecutive days with wins (>= 2.5h)', () => {
            const today = new Date();
            const y1 = new Date(today);
            y1.setUTCDate(today.getUTCDate() - 1);
            const y2 = new Date(today);
            y2.setUTCDate(today.getUTCDate() - 2);

            const format = (d) => d.toISOString().split('T')[0];

            const heatmap = {
                [format(y2)]: 3.0, // Win
                [format(y1)]: 4.5, // Win
                [format(today)]: 2.5, // Win
            };

            const result = computeStreaks(heatmap);
            expect(result.currentStreak).toBe(3);
            expect(result.longestStreak).toBe(3);
        });

        test('handles broken streaks and retains longest historical streak', () => {
            const heatmap = {
                '2026-01-01': 3.0,
                '2026-01-02': 4.0,
                '2026-01-03': 3.5,
                '2026-01-04': 5.0, // 4-day streak in Jan
                '2026-01-05': 1.0, // Lost (below 2.5h)
                '2026-02-01': 3.0,
                '2026-02-02': 4.0, // 2-day streak in Feb
            };
            const result = computeStreaks(heatmap);
            expect(result.longestStreak).toBe(4);
            expect(result.currentStreak).toBe(0); // Long in the past
        });
    });

    describe('computeHourStats', () => {
        test('computes total hours, averages, and days won', () => {
            const heatmap = {
                '2026-08-01': 2.0, // Not won
                '2026-08-02': 4.0, // Won
                '2026-08-03': 3.0, // Won
                '2026-08-04': 1.0, // Not won
            };
            // Total: 10.0 hrs, 4 days recorded, avg: 2.5, days won: 2
            const stats = computeHourStats(heatmap);
            expect(stats.totalHours).toBe(10.0);
            expect(stats.averageHours).toBe(2.5);
            expect(stats.totalDaysWon).toBe(2);
        });

        test('handles non-numeric values safely', () => {
            const heatmap = {
                '2026-08-01': null,
                '2026-08-02': 'invalid',
                '2026-08-03': 5.0,
            };
            const stats = computeHourStats(heatmap);
            expect(stats.totalHours).toBe(5.0);
            expect(stats.totalDaysWon).toBe(1);
        });
    });

    describe('computeAllStats', () => {
        test('assembles complete stats object including levelInfo', () => {
            const heatmap = {
                '2026-08-01': 3.0,
            };
            const allStats = computeAllStats(heatmap);
            expect(allStats).toHaveProperty('currentStreak');
            expect(allStats).toHaveProperty('longestStreak');
            expect(allStats).toHaveProperty('totalHours');
            expect(allStats).toHaveProperty('averageHours');
            expect(allStats).toHaveProperty('monthlyScore');
            expect(allStats).toHaveProperty('levelInfo');
            expect(allStats.levelInfo).toHaveProperty('title');
            expect(allStats.levelInfo).toHaveProperty('score');
            expect(allStats.levelInfo).toHaveProperty('color');
            expect(allStats.levelInfo).toHaveProperty('details');
        });
    });
});
