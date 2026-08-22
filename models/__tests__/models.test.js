import { createTask, normalizeTask } from '../Task';
import {
    createRevisionItem,
    createRevisionGroup,
    markRevised,
    getRevisionStatus,
    normalizeRevisionGroup,
    normalizeRevisionItem,
    DEFAULT_INTERVALS,
} from '../Revision';
import {
    createTactic,
    copyTacticFresh,
    createGoal,
    normalizeGoal,
} from '../Goal';
import { normalizeStreakData, buildLevelInfo } from '../Streak';

describe('Domain Models', () => {
    describe('Task Model', () => {
        test('creates valid task with required fields', () => {
            const task = createTask({ name: 'Morning Run', duration: 1.5 });
            expect(task.name).toBe('Morning Run');
            expect(task.duration).toBe(1.5);
            expect(task.completed).toBe(false);
            expect(task.id).toBeDefined();
        });

        test('throws error on missing name or negative duration', () => {
            expect(() => createTask({ name: '', duration: 1 })).toThrow();
            expect(() => createTask({ name: 'Walk', duration: -1 })).toThrow();
        });

        test('normalizes task safely', () => {
            const raw = { id: 't1', name: 'Study' };
            const normalized = normalizeTask(raw);
            expect(normalized.duration).toBe(0);
            expect(normalized.completed).toBe(false);
        });
    });

    describe('Revision Model', () => {
        test('creates revision item with default or custom intervals', () => {
            const item = createRevisionItem({ text: 'Dynamic Programming' });
            expect(item.intervals).toEqual(DEFAULT_INTERVALS);
            expect(item.currentStep).toBe(0);
            expect(item.isFullyRevised).toBe(false);

            const customItem = createRevisionItem({ text: 'System Design', intervals: [2, 5, 10] });
            expect(customItem.intervals).toEqual([2, 5, 10]);
        });

        test('markRevised advances step and sets next revision date', () => {
            const item = createRevisionItem({ text: 'Trees', intervals: [1, 3] });
            const revised1 = markRevised(item);
            expect(revised1.currentStep).toBe(1);
            expect(revised1.isFullyRevised).toBe(false);
            expect(revised1.revisionHistory).toHaveLength(1);

            const revised2 = markRevised(revised1);
            expect(revised2.currentStep).toBe(2);
            expect(revised2.isFullyRevised).toBe(true);
            expect(revised2.nextRevisionDate).toBeNull();
        });

        test('getRevisionStatus calculates overdue, due_today, upcoming, completed', () => {
            const today = new Date().toISOString().split('T')[0];
            expect(getRevisionStatus({ isFullyRevised: true })).toBe('completed');
            expect(getRevisionStatus({ nextRevisionDate: null })).toBe('completed');
            expect(getRevisionStatus({ nextRevisionDate: today })).toBe('due_today');
            expect(getRevisionStatus({ nextRevisionDate: '2020-01-01' })).toBe('overdue');
            expect(getRevisionStatus({ nextRevisionDate: '2099-01-01' })).toBe('upcoming');
        });
    });

    describe('Goal Model', () => {
        test('creates tactic and creates reset copy', () => {
            const tactic = createTactic({ text: 'Write 1000 words', targetValue: 1000, unit: 'words' });
            expect(tactic.text).toBe('Write 1000 words');
            expect(tactic.targetValue).toBe(1000);
            expect(tactic.unit).toBe('words');

            tactic.currentProgress = 1000;
            tactic.completed = true;

            const copy = copyTacticFresh(tactic);
            expect(copy.text).toBe('Write 1000 words');
            expect(copy.currentProgress).toBe(0);
            expect(copy.completed).toBe(false);
        });

        test('creates and normalizes full goal structure', () => {
            const goal = createGoal({
                name: 'Pass AWS Exam',
                startDate: '2026-08-01',
                endDate: '2026-10-24',
            });
            expect(goal.name).toBe('Pass AWS Exam');
            expect(goal.subgoals).toEqual([]);
            expect(goal.id).toMatch(/^goal_\d+_[a-z0-9]+$/);

            const normalized = normalizeGoal(goal);
            expect(normalized.id).toBe(goal.id);
            expect(normalized.name).toBe(goal.name);
        });

        test('validates ISO date format and date order in createGoal', () => {
            expect(() => createGoal({ name: 'Goal', startDate: '08/01/2026', endDate: '2026-10-24' })).toThrow();
            expect(() => createGoal({ name: 'Goal', startDate: '2026-10-24', endDate: '2026-08-01' })).toThrow();
        });

        test('normalizeGoal scrubs orphaned nulls, prevents self-referencing cycles, and normalizes dailyLogs', () => {
            const corruptedGoal = {
                id: 'parent_1',
                name: 'Parent Goal',
                startDate: '2026-08-01',
                endDate: '2026-08-31',
                weeks: {
                    week_0: {
                        tasks: [
                            {
                                id: 't1',
                                text: 'Tactic 1',
                                dailyLogs: {
                                    '2026-08-05': 5, // Valid inside bounds
                                    '2026-07-01': 10, // Outside bounds (July) -> scrubbed
                                    'invalid-date': 2, // Invalid format -> scrubbed
                                    '2026-08-10': -3, // Negative value -> scrubbed
                                },
                            },
                        ],
                    },
                },
                subgoals: [
                    null, // Null orphan -> scrubbed
                    { id: 'parent_1', name: 'Self reference cycle' }, // Self cycle -> scrubbed
                    { id: 'valid_sub', name: 'Valid Subgoal', startDate: '2026-08-10', endDate: '2026-08-20' },
                ],
            };

            const normalized = normalizeGoal(corruptedGoal);
            expect(normalized.weeks.week_0.tasks[0].dailyLogs).toEqual({ '2026-08-05': 5 });
            expect(normalized.subgoals).toHaveLength(1);
            expect(normalized.subgoals[0].id).toBe('valid_sub');
        });
    });

    describe('Streak Model', () => {
        test('normalizes raw heatmap data filtering invalid entries', () => {
            const raw = {
                heatmapData: {
                    '2026-08-01': 3.5,
                    '2026-08-02': -1, // invalid negative
                    '2026-08-03': 'bad', // invalid string
                },
            };
            const normalized = normalizeStreakData(raw);
            expect(normalized.heatmapData).toEqual({
                '2026-08-01': 3.5,
            });
        });

        test('buildLevelInfo returns correct tier for high consistency', () => {
            const levelInfo = buildLevelInfo({
                daysWonThisMonth: 25,
                totalHoursThisMonth: 100,
                daysInDivisor: 25,
            });
            expect(levelInfo.title).toBe('Titan');
            expect(levelInfo.score).toBeGreaterThanOrEqual(90);
        });
    });
});
