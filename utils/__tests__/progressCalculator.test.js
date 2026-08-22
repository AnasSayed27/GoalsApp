import {
    getTacticCompletion,
    calculateWeekProgress,
    isWeekComplete,
    calculateGoalProgress,
    calculateDailyTaskStats,
} from '../progressCalculator';

describe('progressCalculator', () => {
    describe('getTacticCompletion', () => {
        test('returns 0 for null or undefined tactic', () => {
            expect(getTacticCompletion(null)).toBe(0);
            expect(getTacticCompletion(undefined)).toBe(0);
        });

        test('calculates binary checkbox completion', () => {
            expect(getTacticCompletion({ completed: true })).toBe(1);
            expect(getTacticCompletion({ completed: false })).toBe(0);
            expect(getTacticCompletion({})).toBe(0);
        });

        test('calculates target-based numeric completion', () => {
            expect(getTacticCompletion({ targetValue: 10, currentProgress: 5 })).toBe(0.5);
            expect(getTacticCompletion({ targetValue: 10, currentProgress: 0 })).toBe(0);
            expect(getTacticCompletion({ targetValue: 10, currentProgress: 10 })).toBe(1);
        });

        test('caps numeric progress at 1.0 when currentProgress exceeds targetValue', () => {
            expect(getTacticCompletion({ targetValue: 10, currentProgress: 15 })).toBe(1);
            expect(getTacticCompletion({ targetValue: 5, currentProgress: 100 })).toBe(1);
        });

        test('handles missing currentProgress safely on target tactics', () => {
            expect(getTacticCompletion({ targetValue: 10 })).toBe(0);
        });
    });

    describe('calculateWeekProgress', () => {
        test('returns 0 for empty or invalid week structures', () => {
            expect(calculateWeekProgress(null)).toBe(0);
            expect(calculateWeekProgress({})).toBe(0);
            expect(calculateWeekProgress({ tasks: [] })).toBe(0);
            expect(calculateWeekProgress({ tasks: null })).toBe(0);
        });

        test('calculates week progress with mixed checkbox and target tactics', () => {
            const weekData = {
                tasks: [
                    { completed: true }, // 1.0
                    { completed: false }, // 0.0
                    { targetValue: 10, currentProgress: 5 }, // 0.5
                    { targetValue: 4, currentProgress: 4 }, // 1.0
                ],
            };
            // Total = 1.0 + 0.0 + 0.5 + 1.0 = 2.5 / 4 = 0.625
            expect(calculateWeekProgress(weekData)).toBe(0.625);
        });

        test('returns 1.0 when all tasks in week are fully completed', () => {
            const weekData = {
                tasks: [
                    { completed: true },
                    { targetValue: 5, currentProgress: 5 },
                ],
            };
            expect(calculateWeekProgress(weekData)).toBe(1);
        });
    });

    describe('isWeekComplete', () => {
        test('returns false for empty or invalid week', () => {
            expect(isWeekComplete(null)).toBe(false);
            expect(isWeekComplete({})).toBe(false);
            expect(isWeekComplete({ tasks: [] })).toBe(false);
        });

        test('returns true only when every task has completion >= 1.0', () => {
            expect(isWeekComplete({
                tasks: [
                    { completed: true },
                    { targetValue: 10, currentProgress: 10 },
                ],
            })).toBe(true);

            expect(isWeekComplete({
                tasks: [
                    { completed: true },
                    { targetValue: 10, currentProgress: 9 },
                ],
            })).toBe(false);
        });
    });

    describe('calculateGoalProgress', () => {
        test('returns 0 for null or empty goal', () => {
            expect(calculateGoalProgress(null)).toBe(0);
            expect(calculateGoalProgress({})).toBe(0);
            expect(calculateGoalProgress({ weeks: {} })).toBe(0);
        });

        test('calculates single goal progress across multiple weeks', () => {
            const goal = {
                weeks: {
                    week_0: {
                        tasks: [
                            { completed: true },
                            { completed: false },
                        ],
                    },
                    week_1: {
                        tasks: [
                            { targetValue: 10, currentProgress: 10 },
                            { targetValue: 10, currentProgress: 0 },
                        ],
                    },
                },
            };
            // 4 tasks: (1 + 0 + 1 + 0) / 4 = 0.5
            expect(calculateGoalProgress(goal)).toBe(0.5);
        });

        test('recursively calculates progress across subgoals', () => {
            const goal = {
                weeks: {
                    week_0: {
                        tasks: [{ completed: true }], // 1 of 1
                    },
                },
                subgoals: [
                    {
                        weeks: {
                            week_0: {
                                tasks: [{ completed: false }, { completed: true }], // 1 of 2
                            },
                        },
                        subgoals: [
                            {
                                weeks: {
                                    week_0: {
                                        tasks: [{ targetValue: 10, currentProgress: 10 }], // 1 of 1
                                    },
                                },
                            },
                        ],
                    },
                ],
            };
            // Total tasks: 1 (parent) + 2 (subgoal 1) + 1 (subgoal 2) = 4 tasks
            // Completed: 1 + 1 + 1 = 3
            // Progress: 3 / 4 = 0.75
            expect(calculateGoalProgress(goal)).toBe(0.75);
        });
    });

    describe('calculateDailyTaskStats', () => {
        test('returns zeros for empty or null task array', () => {
            expect(calculateDailyTaskStats(null)).toEqual({ totalDuration: 0, completedDuration: 0, progress: 0 });
            expect(calculateDailyTaskStats([])).toEqual({ totalDuration: 0, completedDuration: 0, progress: 0 });
        });

        test('calculates duration sums and fractional progress accurately', () => {
            const tasks = [
                { id: '1', name: 'Workout', duration: 1.5, completed: true },
                { id: '2', name: 'Study', duration: 2.0, completed: false },
                { id: '3', name: 'Read', duration: 0.5, completed: true },
            ];
            // Total duration: 1.5 + 2.0 + 0.5 = 4.0
            // Completed: 1.5 + 0.5 = 2.0
            // Progress: 2.0 / 4.0 = 0.5
            expect(calculateDailyTaskStats(tasks)).toEqual({
                totalDuration: 4.0,
                completedDuration: 2.0,
                progress: 0.5,
            });
        });

        test('handles tasks with missing or non-numeric duration safely', () => {
            const tasks = [
                { id: '1', completed: true },
                { id: '2', duration: null, completed: true },
                { id: '3', duration: 2, completed: true },
            ];
            expect(calculateDailyTaskStats(tasks)).toEqual({
                totalDuration: 2,
                completedDuration: 2,
                progress: 1,
            });
        });
    });
});
