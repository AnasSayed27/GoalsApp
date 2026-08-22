import * as TaskService from '../TaskService';
import { StorageService } from '../StorageService';
import { STORAGE_KEYS } from '../../constants/StorageKeys';

describe('TaskService', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await StorageService.clearAll();
    });

    test('addTask, loadAllTasks, toggleTaskComplete, editTask, and deleteTask', async () => {
        // 1. Add Task
        const addRes = await TaskService.addTask([], 'Morning Workout', 1.5);
        expect(addRes.success).toBe(true);
        expect(addRes.updatedTasks).toHaveLength(1);
        const taskId = addRes.updatedTasks[0].id;
        expect(addRes.updatedTasks[0].name).toBe('Morning Workout');

        // 2. Load Tasks
        const loaded = await TaskService.loadAllTasks();
        expect(loaded).toHaveLength(1);
        expect(loaded[0].id).toBe(taskId);

        // 3. Toggle Complete
        const toggleRes = await TaskService.toggleTaskComplete(loaded, taskId);
        expect(toggleRes.success).toBe(true);
        expect(toggleRes.becameCompleted).toBe(true);
        expect(toggleRes.updatedTasks[0].completed).toBe(true);

        // 4. Edit Task
        const editRes = await TaskService.editTask(toggleRes.updatedTasks, taskId, 'Evening Workout', 2.0);
        expect(editRes.success).toBe(true);
        expect(editRes.updatedTasks[0].name).toBe('Evening Workout');
        expect(editRes.updatedTasks[0].duration).toBe(2.0);

        // 5. Delete Task
        const deleteRes = await TaskService.deleteTask(editRes.updatedTasks, taskId);
        expect(deleteRes.success).toBe(true);
        expect(deleteRes.updatedTasks).toHaveLength(0);
    });

    test('reorderTask and reorderTasks', async () => {
        const tasks = [
            { id: '1', name: 'Task 1', duration: 1 },
            { id: '2', name: 'Task 2', duration: 1 },
            { id: '3', name: 'Task 3', duration: 1 },
        ];

        // Move task 2 up
        const upRes = await TaskService.reorderTask(tasks, '2', 'up');
        expect(upRes.updatedTasks.map(t => t.id)).toEqual(['2', '1', '3']);

        // Move task 2 down
        const downRes = await TaskService.reorderTask(tasks, '2', 'down');
        expect(downRes.updatedTasks.map(t => t.id)).toEqual(['1', '3', '2']);

        // Full reorder
        const customOrder = [tasks[2], tasks[0], tasks[1]];
        const fullRes = await TaskService.reorderTasks(customOrder);
        expect(fullRes.updatedTasks.map(t => t.id)).toEqual(['3', '1', '2']);
    });

    test('getTaskStats calculates correct sums', () => {
        const tasks = [
            { id: '1', duration: 1.5, completed: true },
            { id: '2', duration: 2.5, completed: false },
        ];
        const stats = TaskService.getTaskStats(tasks);
        expect(stats.totalDuration).toBe(4.0);
        expect(stats.completedDuration).toBe(1.5);
        expect(stats.progress).toBe(0.375);
    });
});
