import * as RevisionService from '../RevisionService';
import { StorageService } from '../StorageService';
import { STORAGE_KEYS } from '../../constants/StorageKeys';

describe('RevisionService', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await StorageService.clearAll();
    });

    test('addGroup, loadAllGroups, renameGroup, toggleGroupCollapse, and deleteGroup', async () => {
        // 1. Add Group
        const addRes = await RevisionService.addGroup([], 'Computer Science');
        expect(addRes.success).toBe(true);
        expect(addRes.updatedGroups).toHaveLength(1);
        const groupId = addRes.updatedGroups[0].id;
        expect(addRes.updatedGroups[0].name).toBe('Computer Science');

        // 2. Load Groups
        const loaded = await RevisionService.loadAllGroups();
        expect(loaded).toHaveLength(1);
        expect(loaded[0].id).toBe(groupId);

        // 3. Rename Group
        const renameRes = await RevisionService.renameGroup(loaded, groupId, 'CS Fundamentals');
        expect(renameRes.success).toBe(true);
        expect(renameRes.updatedGroups[0].name).toBe('CS Fundamentals');

        // 4. Toggle Collapse
        const collapseRes = await RevisionService.toggleGroupCollapse(renameRes.updatedGroups, groupId);
        expect(collapseRes.success).toBe(true);
        expect(collapseRes.updatedGroups[0].isCollapsed).toBe(true);

        // 5. Delete Group
        const deleteRes = await RevisionService.deleteGroup(collapseRes.updatedGroups, groupId);
        expect(deleteRes.success).toBe(true);
        expect(deleteRes.updatedGroups).toHaveLength(0);
    });

    test('addItem, markItemRevised, updateItemIntervals, deleteItem, and getStats', async () => {
        const { updatedGroups: initialGroups } = await RevisionService.addGroup([], 'Math');
        const groupId = initialGroups[0].id;

        // 1. Add Item
        const addRes = await RevisionService.addItem(initialGroups, groupId, 'Calculus Integrals', [1, 3, 7]);
        expect(addRes.success).toBe(true);
        expect(addRes.updatedGroups[0].items).toHaveLength(1);
        const itemId = addRes.updatedGroups[0].items[0].id;
        expect(addRes.updatedGroups[0].items[0].intervals).toEqual([1, 3, 7]);

        // 2. Mark Item Revised
        const markRes = await RevisionService.markItemRevised(addRes.updatedGroups, groupId, itemId);
        expect(markRes.success).toBe(true);
        expect(markRes.updatedGroups[0].items[0].currentStep).toBe(1);

        // 3. Update Item Intervals
        const updateIntRes = await RevisionService.updateItemIntervals(markRes.updatedGroups, groupId, itemId, [2, 4, 8]);
        expect(updateIntRes.success).toBe(true);
        expect(updateIntRes.updatedGroups[0].items[0].intervals).toEqual([2, 4, 8]);

        // 4. Get Stats
        const stats = RevisionService.getStats(updateIntRes.updatedGroups);
        expect(stats.total).toBe(1);

        // 5. Delete Item
        const deleteItemRes = await RevisionService.deleteItem(updateIntRes.updatedGroups, groupId, itemId);
        expect(deleteItemRes.success).toBe(true);
        expect(deleteItemRes.updatedGroups[0].items).toHaveLength(0);
    });
});
