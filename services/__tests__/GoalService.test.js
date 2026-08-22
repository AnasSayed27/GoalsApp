import * as GoalService from '../GoalService';
import { StorageService } from '../StorageService';
import { STORAGE_KEYS } from '../../constants/StorageKeys';

describe('GoalService', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await StorageService.clearAll();
    });

    test('addGoal, loadAllGoals, and deleteGoal', async () => {
        const goalData = {
            name: 'Pass Exam',
            startDate: '2026-08-01',
            endDate: '2026-10-31',
        };

        const addResult = await GoalService.addGoal([], goalData);
        expect(addResult.success).toBe(true);
        expect(addResult.newGoal.name).toBe('Pass Exam');

        const allGoals = await GoalService.loadAllGoals();
        expect(allGoals).toHaveLength(1);
        expect(allGoals[0].name).toBe('Pass Exam');
        expect(allGoals[0].progress).toBe(0);

        const deleteResult = await GoalService.deleteGoal(allGoals, allGoals[0].id);
        expect(deleteResult.success).toBe(true);
        expect(deleteResult.updatedGoals).toHaveLength(0);
    });

    test('updateTacticInGoal atomically modifies tactic in storage', async () => {
        const goalData = {
            name: 'Run Marathon',
            startDate: '2026-08-01',
            endDate: '2026-10-31',
        };

        const { newGoal } = await GoalService.addGoal([], goalData);
        const goalWithWeeks = GoalService.ensureGoalWeeks(newGoal).goal;

        // Add a tactic to week_0
        goalWithWeeks.weeks.week_0.tasks = [
            { id: 'tactic_1', text: '5km jog', targetValue: 5, currentProgress: 0, completed: false },
        ];
        await GoalService.updateGoal([], goalWithWeeks);

        // Atomically update progress
        const updateRes = await GoalService.updateTacticInGoal(goalWithWeeks.id, 'week_0', 'tactic_1', (tactic) => {
            tactic.currentProgress = 5;
            tactic.completed = true;
        });

        expect(updateRes.success).toBe(true);
        const loaded = await GoalService.loadAllGoals();
        expect(loaded[0].weeks.week_0.tasks[0].completed).toBe(true);
        expect(loaded[0].weeks.week_0.tasks[0].currentProgress).toBe(5);
        expect(loaded[0].progress).toBe(1);
    });
});
