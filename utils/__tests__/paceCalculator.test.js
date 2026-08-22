import { calculateTacticDailyPace, buildTodayTactics } from '../paceCalculator';
import { toUTCDate } from '../dateHelpers';

describe('paceCalculator', () => {
    describe('calculateTacticDailyPace', () => {
        test('returns zero pace for non-target tactics or null tactic', () => {
            expect(calculateTacticDailyPace({ tactic: null })).toEqual({
                dailyPace: 0,
                todayWork: 0,
                isCompletedBeforeToday: false,
            });
            expect(calculateTacticDailyPace({ tactic: { text: 'Simple task' } })).toEqual({
                dailyPace: 0,
                todayWork: 0,
                isCompletedBeforeToday: false,
            });
        });

        test('calculates pace on Day 1 (Monday) with 6 days remaining', () => {
            const weekStartStr = '2026-08-17'; // Monday
            const todayUTC = toUTCDate('2026-08-17');
            const todayStr = '2026-08-17';
            const tactic = {
                id: '1',
                text: 'Make sales calls',
                targetValue: 60,
                currentProgress: 0,
                dailyLogs: {},
            };
            // target: 60, passed: 0, daysLeft: 6 -> 60 / 6 = 10 pace
            const result = calculateTacticDailyPace({ tactic, weekStartStr, todayUTC, todayStr });
            expect(result.dailyPace).toBe(10);
            expect(result.todayWork).toBe(0);
            expect(Boolean(result.isCompletedBeforeToday)).toBe(false);
        });

        test('calculates pace on Day 3 with partial progress logged earlier', () => {
            const weekStartStr = '2026-08-17'; // Monday
            const todayUTC = toUTCDate('2026-08-19'); // Wednesday (passedDays = 2, daysLeft = 4)
            const todayStr = '2026-08-19';
            const tactic = {
                id: '1',
                targetValue: 60,
                currentProgress: 20, // 20 done on Mon & Tue
                dailyLogs: {
                    '2026-08-17': 10,
                    '2026-08-18': 10,
                    '2026-08-19': 5, // 5 done so far today
                },
            };
            // remainingBeforeToday = 60 - 20 + 5 = 45
            // dailyPace = Math.ceil(45 / 4) = 12
            const result = calculateTacticDailyPace({ tactic, weekStartStr, todayUTC, todayStr });
            expect(result.dailyPace).toBe(12);
            expect(result.todayWork).toBe(5);
        });

        test('identifies tactics completed before today', () => {
            const weekStartStr = '2026-08-17';
            const todayUTC = toUTCDate('2026-08-19');
            const todayStr = '2026-08-19';
            const tactic = {
                id: '1',
                targetValue: 60,
                currentProgress: 60,
                completed: true,
                completionDate: '2026-08-18', // Finished yesterday
            };
            const result = calculateTacticDailyPace({ tactic, weekStartStr, todayUTC, todayStr });
            expect(result.isCompletedBeforeToday).toBe(true);
        });
    });

    describe('buildTodayTactics', () => {
        test('returns empty structure for empty goals list', () => {
            expect(buildTodayTactics(null)).toEqual({
                tactics: [],
                stats: { completed: 0, total: 0, progress: 0 },
            });
            expect(buildTodayTactics([])).toEqual({
                tactics: [],
                stats: { completed: 0, total: 0, progress: 0 },
            });
        });

        test('filters out goals that are outside today date range', () => {
            const futureGoal = {
                id: 'g1',
                name: 'Future Goal',
                startDate: '2027-01-01',
                endDate: '2027-03-26',
                weeks: {
                    week_0: {
                        startDate: '2027-01-01',
                        endDate: '2027-01-07',
                        tasks: [{ id: 't1', text: 'Future Tactic' }],
                    },
                },
            };
            const result = buildTodayTactics([futureGoal]);
            expect(result.tactics).toHaveLength(0);
            expect(result.stats.total).toBe(0);
        });

        test('builds today tactics for active goal containing both simple and target tactics', () => {
            const today = new Date().toISOString().split('T')[0];
            const activeGoal = {
                id: 'active_goal',
                name: 'Active Goal',
                startDate: today,
                endDate: today,
                weeks: {
                    week_0: {
                        startDate: today,
                        endDate: today,
                        tasks: [
                            { id: 't1', text: 'Simple Checkbox Tactic', completed: false },
                            { id: 't2', text: 'Target Tactic', targetValue: 10, currentProgress: 2, dailyLogs: { [today]: 2 } },
                        ],
                    },
                },
            };

            const result = buildTodayTactics([activeGoal]);
            expect(result.tactics).toHaveLength(2);
            expect(result.stats.total).toBeGreaterThan(0);
        });
    });
});
