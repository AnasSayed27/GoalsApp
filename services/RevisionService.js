/**
 * RevisionService — Data access layer for revision groups and items.
 *
 * Handles all CRUD operations and persistence via StorageService.
 * Follows the same pattern as GoalService.
 */

import { StorageService } from './StorageService';
import { STORAGE_KEYS } from '../constants/StorageKeys';
import {
    createRevisionGroup,
    createRevisionItem,
    markRevised as markRevisedModel,
    normalizeRevisionGroup,
} from '../models/Revision';

// ─────────────────────────────────────────────
// LOAD / SAVE
// ─────────────────────────────────────────────

/**
 * Load all revision groups from storage.
 * @returns {Promise<Object[]>} Array of normalized RevisionGroup objects
 */
export const loadAllGroups = async () => {
    const raw = await StorageService.get(STORAGE_KEYS.REVISIONS, []);
    return raw.map(normalizeRevisionGroup).filter(Boolean);
};

/**
 * Save all revision groups to storage.
 * @param {Object[]} groups - Array of RevisionGroup objects
 */
const saveAllGroups = async (groups) => {
    await StorageService.save(STORAGE_KEYS.REVISIONS, groups);
};

// ─────────────────────────────────────────────
// GROUP CRUD
// ─────────────────────────────────────────────

/**
 * Add a new revision group.
 */
export const addGroup = async (groups, name) => {
    try {
        const newGroup = createRevisionGroup({ name });
        const updated = [...groups, newGroup];
        await saveAllGroups(updated);
        return { success: true, updatedGroups: updated };
    } catch (e) {
        console.error('RevisionService.addGroup:', e);
        return { success: false, updatedGroups: groups };
    }
};

/**
 * Delete a revision group.
 */
export const deleteGroup = async (groups, groupId) => {
    const updated = groups.filter(g => g.id !== groupId);
    await saveAllGroups(updated);
    return { success: true, updatedGroups: updated };
};

/**
 * Rename a revision group.
 */
export const renameGroup = async (groups, groupId, newName) => {
    const updated = groups.map(g =>
        g.id === groupId ? { ...g, name: newName.trim() } : g
    );
    await saveAllGroups(updated);
    return { success: true, updatedGroups: updated };
};

/**
 * Toggle collapse state of a group.
 */
export const toggleGroupCollapse = async (groups, groupId) => {
    const updated = groups.map(g =>
        g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g
    );
    await saveAllGroups(updated);
    return { success: true, updatedGroups: updated };
};

// ─────────────────────────────────────────────
// ITEM CRUD
// ─────────────────────────────────────────────

/**
 * Add a revision item to a group.
 */
export const addItem = async (groups, groupId, text, customIntervals = null) => {
    try {
        const newItem = createRevisionItem({ text, intervals: customIntervals });
        const updated = groups.map(g => {
            if (g.id === groupId) {
                return { ...g, items: [...g.items, newItem] };
            }
            return g;
        });
        await saveAllGroups(updated);
        return { success: true, updatedGroups: updated };
    } catch (e) {
        console.error('RevisionService.addItem:', e);
        return { success: false, updatedGroups: groups };
    }
};

/**
 * Delete a revision item from a group.
 */
export const deleteItem = async (groups, groupId, itemId) => {
    const updated = groups.map(g => {
        if (g.id === groupId) {
            return { ...g, items: g.items.filter(i => i.id !== itemId) };
        }
        return g;
    });
    await saveAllGroups(updated);
    return { success: true, updatedGroups: updated };
};

/**
 * Mark a revision item as revised (advance to next step).
 */
export const markItemRevised = async (groups, groupId, itemId) => {
    const updated = groups.map(g => {
        if (g.id === groupId) {
            return {
                ...g,
                items: g.items.map(i =>
                    i.id === itemId ? markRevisedModel(i) : i
                ),
            };
        }
        return g;
    });
    await saveAllGroups(updated);
    return { success: true, updatedGroups: updated };
};

/**
 * Update custom intervals for a revision item.
 */
export const updateItemIntervals = async (groups, groupId, itemId, newIntervals) => {
    const updated = groups.map(g => {
        if (g.id === groupId) {
            return {
                ...g,
                items: g.items.map(i =>
                    i.id === itemId ? { ...i, intervals: newIntervals.map(Number).filter(n => n > 0) } : i
                ),
            };
        }
        return g;
    });
    await saveAllGroups(updated);
    return { success: true, updatedGroups: updated };
};

// ─────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────

/**
 * Get summary stats across all groups.
 */
export const getStats = (groups) => {
    let overdue = 0;
    let dueToday = 0;
    let upcoming = 0;
    let completed = 0;
    const today = new Date().toISOString().split('T')[0];

    groups.forEach(g => {
        g.items.forEach(item => {
            if (item.isFullyRevised) {
                completed++;
            } else if (!item.nextRevisionDate) {
                completed++;
            } else if (item.nextRevisionDate < today) {
                overdue++;
            } else if (item.nextRevisionDate === today) {
                dueToday++;
            } else {
                upcoming++;
            }
        });
    });

    return { overdue, dueToday, upcoming, completed, total: overdue + dueToday + upcoming + completed };
};
