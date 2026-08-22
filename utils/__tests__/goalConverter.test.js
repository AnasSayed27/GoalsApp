import { convertGoalToSubgoal, convertSubgoalToGoal, calculateConsumedWeeks } from '../goalConverter';

describe('goalConverter', () => {
    describe('convertGoalToSubgoal', () => {
        const createParent = () => ({
            id: 'parent_1',
            name: 'Parent Goal',
            startDate: '2026-08-01',
            endDate: '2026-10-31',
            subgoals: [],
            weeks: {},
        });

        test('successfully converts standalone goal within parent timeframe', () => {
            const parent = createParent();
            const child = {
                id: 'child_1',
                name: 'Subgoal Candidate',
                startDate: '2026-08-10',
                endDate: '2026-08-30',
                subgoals: [],
                weeks: {},
            };

            const result = convertGoalToSubgoal([parent, child], 'child_1', 'parent_1');
            expect(result.success).toBe(true);
            expect(result.updatedGoals).toHaveLength(1); // Root now has only parent
            expect(result.updatedGoals[0].subgoals).toHaveLength(1);
            expect(result.updatedGoals[0].subgoals[0].id).toBe('child_1');
        });

        test('blocks conversion if target goal already has its own subgoals', () => {
            const parent = createParent();
            const childWithChildren = {
                id: 'child_1',
                name: 'Nested Goal',
                startDate: '2026-08-10',
                endDate: '2026-08-30',
                subgoals: [{ id: 'sub_sub_1', name: 'Grandchild' }],
                weeks: {},
            };

            const result = convertGoalToSubgoal([parent, childWithChildren], 'child_1', 'parent_1');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Cannot convert a goal that has subgoals');
        });

        test('blocks conversion if goal date range is outside parent timeframe', () => {
            const parent = createParent(); // 2026-08-01 to 2026-10-31
            const outOfBoundsChild = {
                id: 'child_1',
                name: 'Out of Bounds',
                startDate: '2026-07-01', // Before parent starts
                endDate: '2026-08-30',
                subgoals: [],
                weeks: {},
            };

            const result = convertGoalToSubgoal([parent, outOfBoundsChild], 'child_1', 'parent_1');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Goal timeframe must be within the parent goal timeframe');
        });

        test('blocks conversion if goal date range overlaps with existing parent subgoals', () => {
            const parent = createParent();
            parent.subgoals = [
                { id: 'existing_sg', startDate: '2026-08-05', endDate: '2026-08-20' },
            ];

            const overlappingChild = {
                id: 'child_1',
                name: 'Overlap',
                startDate: '2026-08-15', // Overlaps with Aug 5 - Aug 20
                endDate: '2026-08-30',
                subgoals: [],
                weeks: {},
            };

            const result = convertGoalToSubgoal([parent, overlappingChild], 'child_1', 'parent_1');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Goal dates overlap with an existing subgoal');
        });
    });

    describe('convertSubgoalToGoal', () => {
        test('extracts subgoal back to standalone root goal', () => {
            const parent = {
                id: 'parent_1',
                name: 'Parent Goal',
                startDate: '2026-08-01',
                endDate: '2026-10-31',
                subgoals: [
                    { id: 'sub_1', name: 'Extracted Goal', startDate: '2026-08-10', endDate: '2026-08-30', subgoals: [] },
                ],
                weeks: {},
            };

            const result = convertSubgoalToGoal([parent], 'parent_1', 'sub_1');
            expect(result.success).toBe(true);
            expect(result.updatedGoals).toHaveLength(2);
            expect(result.updatedGoals[0].subgoals).toHaveLength(0);
            expect(result.updatedGoals[1].id).toBe('sub_1');
        });
    });

    describe('calculateConsumedWeeks', () => {
        test('calculates consumed weeks for given range', () => {
            expect(calculateConsumedWeeks('2026-08-01', '2026-08-14')).toBe(2);
            expect(calculateConsumedWeeks(null, null)).toBe(0);
        });
    });
});
