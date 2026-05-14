/**
 * RevisionBoard — Full-screen modal for managing spaced repetition revision items.
 *
 * Features:
 *   - Create/delete groups (folders)
 *   - Add/delete revision items inside groups
 *   - Mark items as "Revised" (advances spaced repetition)
 *   - Color-coded status: overdue (red), due today (yellow), upcoming (green), completed (grey)
 *   - Customize intervals per item
 *   - Collapsible groups
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../constants/Colors';
import { getRevisionStatus, DEFAULT_INTERVALS } from '../../models/Revision';

// ─────────────────────────────────────────────
// STATUS HELPERS
// ─────────────────────────────────────────────

const STATUS_COLORS = {
    overdue: Colors.palette.danger,
    due_today: '#f39c12',
    upcoming: Colors.palette.success,
    completed: Colors.palette.neutral,
};

const STATUS_LABELS = {
    overdue: 'OVERDUE',
    due_today: 'TODAY',
    upcoming: 'UPCOMING',
    completed: 'DONE ✓',
};

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

const RevisionBoard = ({
    visible,
    onClose,
    groups,
    onAddGroup,
    onDeleteGroup,
    onToggleCollapse,
    onAddItem,
    onDeleteItem,
    onMarkRevised,
    onUpdateIntervals,
    stats,
}) => {
    const [newGroupName, setNewGroupName] = useState('');
    const [newItemTexts, setNewItemTexts] = useState({}); // { groupId: 'text' }
    const [editingIntervalsId, setEditingIntervalsId] = useState(null);
    const [editingIntervalsText, setEditingIntervalsText] = useState('');

    // ── Add Group ──
    const handleAddGroup = () => {
        if (!newGroupName.trim()) {
            Alert.alert('Error', 'Please enter a group name.');
            return;
        }
        onAddGroup(newGroupName.trim());
        setNewGroupName('');
    };

    // ── Add Item ──
    const handleAddItem = (groupId) => {
        const text = newItemTexts[groupId]?.trim();
        if (!text) {
            Alert.alert('Error', 'Please enter an item name.');
            return;
        }
        onAddItem(groupId, text);
        setNewItemTexts(prev => ({ ...prev, [groupId]: '' }));
    };

    // ── Delete Group ──
    const handleDeleteGroup = (groupId, groupName) => {
        Alert.alert(
            'Delete Group',
            `Delete "${groupName}" and all its items?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => onDeleteGroup(groupId) },
            ]
        );
    };

    // ── Delete Item ──
    const handleDeleteItem = (groupId, itemId) => {
        Alert.alert(
            'Delete Item',
            'Are you sure you want to delete this revision item?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => onDeleteItem(groupId, itemId) },
            ]
        );
    };

    // ── Mark Revised ──
    const handleMarkRevised = (groupId, item) => {
        const status = getRevisionStatus(item);
        if (status === 'completed') return;
        if (status === 'upcoming') {
            Alert.alert(
                'Not Due Yet',
                `This item is not due until ${formatDate(item.nextRevisionDate)}. Mark as revised anyway?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Yes', onPress: () => onMarkRevised(groupId, item.id) },
                ]
            );
        } else {
            onMarkRevised(groupId, item.id);
        }
    };

    // ── Edit Intervals ──
    const startEditingIntervals = (item) => {
        setEditingIntervalsId(item.id);
        setEditingIntervalsText(item.intervals.join(', '));
    };

    const saveIntervals = (groupId, itemId) => {
        const parsed = editingIntervalsText
            .split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !isNaN(n) && n > 0);

        if (parsed.length === 0) {
            Alert.alert('Error', 'Please enter at least one valid interval (e.g., 1, 3, 7, 14, 30).');
            return;
        }
        onUpdateIntervals(groupId, itemId, parsed);
        setEditingIntervalsId(null);
        setEditingIntervalsText('');
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* ── Header ── */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>📖 Revision Board</Text>
                        {stats && (
                            <View style={styles.statsRow}>
                                {stats.overdue > 0 && <Text style={[styles.statBadge, { backgroundColor: STATUS_COLORS.overdue }]}>{stats.overdue} overdue</Text>}
                                {stats.dueToday > 0 && <Text style={[styles.statBadge, { backgroundColor: STATUS_COLORS.due_today }]}>{stats.dueToday} today</Text>}
                                {stats.upcoming > 0 && <Text style={[styles.statBadge, { backgroundColor: '#27ae60' }]}>{stats.upcoming} upcoming</Text>}
                            </View>
                        )}
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={28} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* ── Add Group ── */}
                <View style={styles.addGroupRow}>
                    <TextInput
                        style={styles.addGroupInput}
                        placeholder="New group name (e.g. Data Structures)..."
                        placeholderTextColor="#aaa"
                        value={newGroupName}
                        onChangeText={setNewGroupName}
                        onSubmitEditing={handleAddGroup}
                    />
                    <TouchableOpacity style={styles.addGroupBtn} onPress={handleAddGroup}>
                        <Ionicons name="add" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* ── Groups List ── */}
                <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
                    {groups.length === 0 && (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="book-open-variant" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>No revision groups yet.</Text>
                            <Text style={styles.emptySubtext}>Create a group above to start tracking!</Text>
                        </View>
                    )}

                    {groups.map(group => (
                        <View key={group.id} style={styles.groupCard}>
                            {/* Group Header */}
                            <TouchableOpacity
                                style={styles.groupHeader}
                                onPress={() => onToggleCollapse(group.id)}
                                onLongPress={() => handleDeleteGroup(group.id, group.name)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.groupHeaderLeft}>
                                    <Ionicons
                                        name={group.isCollapsed ? "chevron-forward" : "chevron-down"}
                                        size={20}
                                        color="#555"
                                    />
                                    <Text style={styles.groupName}>{group.name}</Text>
                                    <Text style={styles.groupCount}>({group.items.length})</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Group Content (when expanded) */}
                            {!group.isCollapsed && (
                                <View style={styles.groupContent}>
                                    {/* Items */}
                                    {group.items.map(item => {
                                        const status = getRevisionStatus(item);
                                        const statusColor = STATUS_COLORS[status];
                                        const isEditing = editingIntervalsId === item.id;

                                        return (
                                            <View key={item.id} style={[styles.itemCard, { borderLeftColor: statusColor }]}>
                                                <View style={styles.itemMainRow}>
                                                    {/* Revision Button */}
                                                    <TouchableOpacity
                                                        style={[styles.revisionBtn, { backgroundColor: status === 'completed' ? '#eee' : statusColor + '20', borderColor: statusColor }]}
                                                        onPress={() => handleMarkRevised(group.id, item)}
                                                        disabled={status === 'completed'}
                                                    >
                                                        {status === 'completed' ? (
                                                            <Ionicons name="checkmark-circle" size={22} color={statusColor} />
                                                        ) : (
                                                            <Ionicons name="refresh" size={18} color={statusColor} />
                                                        )}
                                                    </TouchableOpacity>

                                                    {/* Item Info */}
                                                    <View style={styles.itemInfo}>
                                                        <Text style={[styles.itemText, status === 'completed' && styles.itemTextCompleted]}>
                                                            {item.text}
                                                        </Text>
                                                        <View style={styles.itemMetaRow}>
                                                            <Text style={[styles.statusBadge, { color: statusColor }]}>
                                                                {STATUS_LABELS[status]}
                                                            </Text>
                                                            {item.nextRevisionDate && status !== 'completed' && (
                                                                <Text style={styles.itemDate}>
                                                                    {status === 'due_today' ? 'Revise now!' : formatDate(item.nextRevisionDate)}
                                                                </Text>
                                                            )}
                                                            <Text style={styles.itemStep}>
                                                                Step {item.currentStep}/{item.intervals.length}
                                                            </Text>
                                                        </View>
                                                    </View>

                                                    {/* Settings Icon */}
                                                    <TouchableOpacity
                                                        onPress={() => isEditing ? setEditingIntervalsId(null) : startEditingIntervals(item)}
                                                        onLongPress={() => handleDeleteItem(group.id, item.id)}
                                                        style={styles.settingsBtn}
                                                    >
                                                        <Ionicons name={isEditing ? "close-circle" : "settings-outline"} size={18} color="#999" />
                                                    </TouchableOpacity>
                                                </View>

                                                {/* Intervals Editor (inline) */}
                                                {isEditing && (
                                                    <View style={styles.intervalsEditor}>
                                                        <Text style={styles.intervalsLabel}>Intervals (days, comma-separated):</Text>
                                                        <View style={styles.intervalsInputRow}>
                                                            <TextInput
                                                                style={styles.intervalsInput}
                                                                value={editingIntervalsText}
                                                                onChangeText={setEditingIntervalsText}
                                                                placeholder="1, 3, 7, 14, 30"
                                                                keyboardType="numeric"
                                                            />
                                                            <TouchableOpacity
                                                                style={styles.intervalsSaveBtn}
                                                                onPress={() => saveIntervals(group.id, item.id)}
                                                            >
                                                                <Text style={styles.intervalsSaveBtnText}>Save</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                )}
                                            </View>
                                        );
                                    })}

                                    {group.items.length === 0 && (
                                        <Text style={styles.noItemsText}>No items yet. Add one below.</Text>
                                    )}

                                    {/* Add Item Input */}
                                    <View style={styles.addItemRow}>
                                        <TextInput
                                            style={styles.addItemInput}
                                            placeholder="Add revision item..."
                                            placeholderTextColor="#bbb"
                                            value={newItemTexts[group.id] || ''}
                                            onChangeText={(text) => setNewItemTexts(prev => ({ ...prev, [group.id]: text }))}
                                            onSubmitEditing={() => handleAddItem(group.id)}
                                        />
                                        <TouchableOpacity style={styles.addItemBtn} onPress={() => handleAddItem(group.id)}>
                                            <Ionicons name="add" size={20} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    ))}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.palette.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 18,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.palette.textPrimary,
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: 6,
        gap: 6,
    },
    statBadge: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        overflow: 'hidden',
    },
    closeBtn: {
        padding: 4,
        marginTop: 2,
    },
    addGroupRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    addGroupInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: '#333',
        backgroundColor: '#fafafa',
    },
    addGroupBtn: {
        backgroundColor: Colors.palette.primary,
        width: 44,
        height: 44,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    scrollArea: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 18,
        color: '#999',
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#bbb',
        marginTop: 4,
    },

    // ── Group ──
    groupCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
        overflow: 'hidden',
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 14,
        backgroundColor: '#fafafa',
    },
    groupHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    groupName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: Colors.palette.textPrimary,
        marginLeft: 8,
    },
    groupCount: {
        fontSize: 14,
        color: Colors.palette.textSecondary,
        marginLeft: 6,
    },
    groupContent: {
        paddingHorizontal: 14,
        paddingBottom: 14,
    },

    // ── Item ──
    itemCard: {
        borderLeftWidth: 4,
        borderRadius: 8,
        backgroundColor: '#fcfcfc',
        padding: 12,
        marginTop: 10,
    },
    itemMainRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    revisionBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemInfo: {
        flex: 1,
    },
    itemText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.palette.textPrimary,
    },
    itemTextCompleted: {
        textDecorationLine: 'line-through',
        color: '#bbb',
    },
    itemMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 8,
    },
    statusBadge: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    itemDate: {
        fontSize: 12,
        color: Colors.palette.textSecondary,
    },
    itemStep: {
        fontSize: 11,
        color: '#bbb',
    },
    settingsBtn: {
        padding: 6,
    },

    // ── Intervals Editor ──
    intervalsEditor: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    intervalsLabel: {
        fontSize: 12,
        color: Colors.palette.textSecondary,
        marginBottom: 6,
    },
    intervalsInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    intervalsInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        fontSize: 14,
        color: '#333',
    },
    intervalsSaveBtn: {
        backgroundColor: Colors.palette.secondary,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 6,
        marginLeft: 8,
    },
    intervalsSaveBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },

    // ── Add Item ──
    addItemRow: {
        flexDirection: 'row',
        marginTop: 12,
    },
    addItemInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        color: '#333',
        backgroundColor: '#fff',
    },
    addItemBtn: {
        backgroundColor: Colors.palette.success,
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    noItemsText: {
        fontSize: 13,
        color: '#bbb',
        fontStyle: 'italic',
        marginTop: 10,
        textAlign: 'center',
    },
});

export default RevisionBoard;
