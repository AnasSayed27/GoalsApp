import {
    getWeeksBetweenDates,
    rebuildParentWeeks,
    initializeWeeks,
    getWeekIndex,
    getSortedWeeks,
} from '../weekBuilder';

describe('weekBuilder', () => {
    describe('getWeeksBetweenDates', () => {
        test('returns empty object when dates are missing', () => {
            expect(getWeeksBetweenDates(null, null)).toEqual({});
            expect(getWeeksBetweenDates('2026-08-01', null)).toEqual({});
        });

        test('generates exactly 2 weeks for a 14-day span', () => {
            const weeks = getWeeksBetweenDates('2026-08-03', '2026-08-16'); // 14 days
            const keys = Object.keys(weeks);
            expect(keys).toHaveLength(2);
            expect(weeks.week_0).toEqual(expect.objectContaining({
                startDate: '2026-08-03',
                endDate: '2026-08-09',
                tasks: [],
            }));
            expect(weeks.week_1).toEqual(expect.objectContaining({
                startDate: '2026-08-10',
                endDate: '2026-08-16',
                tasks: [],
            }));
        });

        test('generates 12 weeks for an 84-day (12-week) span', () => {
            // Aug 3, 2026 (Mon) to Oct 25, 2026 (Sun) = 84 days (12 weeks)
            const weeks = getWeeksBetweenDates('2026-08-03', '2026-10-25');
            expect(Object.keys(weeks)).toHaveLength(12);
            expect(weeks.week_0.startDate).toBe('2026-08-03');
            expect(weeks.week_11.endDate).toBe('2026-10-25');
        });

        test('handles partial final week correctly', () => {
            // 10 days span: Week 0 has 7 days, Week 1 has 3 days
            const weeks = getWeeksBetweenDates('2026-08-03', '2026-08-12');
            expect(Object.keys(weeks)).toHaveLength(2);
            expect(weeks.week_0.startDate).toBe('2026-08-03');
            expect(weeks.week_0.endDate).toBe('2026-08-09');
            expect(weeks.week_1.startDate).toBe('2026-08-10');
            expect(weeks.week_1.endDate).toBe('2026-08-12');
        });
    });

    describe('rebuildParentWeeks', () => {
        test('returns full range when subgoals array is empty', () => {
            const goal = {
                startDate: '2026-08-03',
                endDate: '2026-08-16',
                subgoals: [],
            };
            const weeks = rebuildParentWeeks(goal);
            expect(Object.keys(weeks)).toHaveLength(2);
        });

        test('excludes weeks consumed by a middle subgoal', () => {
            // Goal: Aug 3 to Aug 30 (4 weeks)
            // Subgoal in middle: Aug 10 to Aug 23 (Weeks 2 and 3)
            // Parent should only retain: Aug 3 to Aug 9 (Week 1) and Aug 24 to Aug 30 (Week 4)
            const goal = {
                startDate: '2026-08-03',
                endDate: '2026-08-30',
                subgoals: [
                    {
                        startDate: '2026-08-10',
                        endDate: '2026-08-23',
                    },
                ],
            };
            const weeks = rebuildParentWeeks(goal);
            const keys = Object.keys(weeks);
            expect(keys).toHaveLength(2);
            expect(weeks.week_0.startDate).toBe('2026-08-03');
            expect(weeks.week_0.endDate).toBe('2026-08-09');
            expect(weeks.week_1.startDate).toBe('2026-08-24');
            expect(weeks.week_1.endDate).toBe('2026-08-30');
        });

        test('handles subgoal at start of parent date range', () => {
            // Goal: Aug 3 to Aug 16
            // Subgoal: Aug 3 to Aug 9
            // Parent should retain only: Aug 10 to Aug 16
            const goal = {
                startDate: '2026-08-03',
                endDate: '2026-08-16',
                subgoals: [
                    {
                        startDate: '2026-08-03',
                        endDate: '2026-08-09',
                    },
                ],
            };
            const weeks = rebuildParentWeeks(goal);
            expect(Object.keys(weeks)).toHaveLength(1);
            expect(weeks.week_0.startDate).toBe('2026-08-10');
            expect(weeks.week_0.endDate).toBe('2026-08-16');
        });
    });

    describe('getWeekIndex & getSortedWeeks', () => {
        test('parses index from week key string correctly', () => {
            expect(getWeekIndex('week_0')).toBe(0);
            expect(getWeekIndex('week_10')).toBe(10);
            expect(getWeekIndex('invalid')).toBe(0);
            expect(getWeekIndex(null)).toBe(0);
        });

        test('sorts week entries by numerical index instead of alphabetical string sorting', () => {
            const weeksMap = {
                week_10: { name: 'Week 10' },
                week_1: { name: 'Week 1' },
                week_0: { name: 'Week 0' },
                week_2: { name: 'Week 2' },
            };
            const sorted = getSortedWeeks(weeksMap);
            expect(sorted.map(([k]) => k)).toEqual(['week_0', 'week_1', 'week_2', 'week_10']);
        });
    });

    describe('initializeWeeks', () => {
        test('initializes standard weeks for goal without subgoals', () => {
            const goal = { startDate: '2026-08-01', endDate: '2026-08-14', subgoals: [] };
            const weeks = initializeWeeks(goal);
            expect(Object.keys(weeks)).toHaveLength(2);
        });

        test('initializes rebuilt weeks when goal has subgoals', () => {
            const goal = {
                startDate: '2026-08-01',
                endDate: '2026-08-14',
                subgoals: [{ startDate: '2026-08-01', endDate: '2026-08-07' }],
            };
            const weeks = initializeWeeks(goal);
            expect(Object.keys(weeks)).toHaveLength(1);
        });

        test('returns empty object when dates are missing', () => {
            expect(initializeWeeks(null)).toEqual({});
            expect(initializeWeeks({})).toEqual({});
        });
    });
});
