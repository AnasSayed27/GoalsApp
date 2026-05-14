/**
 * useRevisions — Thin React state wrapper over RevisionService.
 *
 * Follows the same pattern as useGoals.js.
 */

import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import * as RevisionService from '../services/RevisionService';

export const useRevisions = () => {
    const [groups, setGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadGroups = useCallback(async () => {
        setIsLoading(true);
        const loaded = await RevisionService.loadAllGroups();
        setGroups(loaded);
        setIsLoading(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadGroups();
        }, [loadGroups])
    );

    const addGroup = useCallback(async (name) => {
        const result = await RevisionService.addGroup(groups, name);
        if (result.success) setGroups(result.updatedGroups);
        return result.success;
    }, [groups]);

    const deleteGroup = useCallback(async (groupId) => {
        const result = await RevisionService.deleteGroup(groups, groupId);
        if (result.success) setGroups(result.updatedGroups);
    }, [groups]);

    const renameGroup = useCallback(async (groupId, newName) => {
        const result = await RevisionService.renameGroup(groups, groupId, newName);
        if (result.success) setGroups(result.updatedGroups);
    }, [groups]);

    const toggleGroupCollapse = useCallback(async (groupId) => {
        const result = await RevisionService.toggleGroupCollapse(groups, groupId);
        if (result.success) setGroups(result.updatedGroups);
    }, [groups]);

    const addItem = useCallback(async (groupId, text, customIntervals = null) => {
        const result = await RevisionService.addItem(groups, groupId, text, customIntervals);
        if (result.success) setGroups(result.updatedGroups);
        return result.success;
    }, [groups]);

    const deleteItem = useCallback(async (groupId, itemId) => {
        const result = await RevisionService.deleteItem(groups, groupId, itemId);
        if (result.success) setGroups(result.updatedGroups);
    }, [groups]);

    const markItemRevised = useCallback(async (groupId, itemId) => {
        const result = await RevisionService.markItemRevised(groups, groupId, itemId);
        if (result.success) setGroups(result.updatedGroups);
    }, [groups]);

    const updateItemIntervals = useCallback(async (groupId, itemId, newIntervals) => {
        const result = await RevisionService.updateItemIntervals(groups, groupId, itemId, newIntervals);
        if (result.success) setGroups(result.updatedGroups);
    }, [groups]);

    const getStats = useCallback(() => {
        return RevisionService.getStats(groups);
    }, [groups]);

    return {
        groups,
        isLoading,
        loadGroups,
        addGroup,
        deleteGroup,
        renameGroup,
        toggleGroupCollapse,
        addItem,
        deleteItem,
        markItemRevised,
        updateItemIntervals,
        getStats,
    };
};
