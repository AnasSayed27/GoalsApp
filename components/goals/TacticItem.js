/**
 * TacticItem — Renders a single tactic within a WeekCard.
 *
 * Handles both checkbox-style (simple) and target-based (numeric) tactics.
 * Extracted from detail.js lines 530-575 (~45 lines of inline JSX per tactic).
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Progress from 'react-native-progress';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../constants/Colors';

/**
 * @param {Object}   props
 * @param {Object}   props.tactic    - The tactic object
 * @param {string}   props.weekKey   - Parent week key
 * @param {number}   props.index     - Tactic index in list
 * @param {number}   props.total     - Total tactics in list
 * @param {Function} props.onToggle  - (weekKey, tacticId) for checkbox tactics
 * @param {Function} props.onUpdate  - (weekKey, tactic) to open update modal
 * @param {Function} props.onDelete  - (weekKey, tacticId) long-press delete
 * @param {Function} props.onReorder - (weekKey, index, direction) reorder
 */
const TacticItem = ({
    tactic,
    weekKey,
    index,
    total,
    onToggle,
    onUpdate,
    onDelete,
    onReorder,
}) => {
    const isTarget = !!tactic.targetValue;

    return (
        <View style={styles.row}>
            {isTarget ? (
                <TouchableOpacity
                    style={styles.targetItem}
                    onPress={() => onUpdate(weekKey, tactic)}
                    onLongPress={() => onDelete(weekKey, tactic.id)}
                    delayLongPress={500}
                    activeOpacity={0.7}
                >
                    <View style={styles.targetHeader}>
                        <Text style={[styles.tacticText, tactic.completed && styles.tacticTextCompleted, { fontWeight: '600' }]}>
                            {tactic.text}
                        </Text>
                        <View style={styles.progressInfo}>
                            <Text style={styles.progressText}>
                                {tactic.currentProgress || 0} / {tactic.targetValue}{' '}
                                <Text style={styles.unitText}>{tactic.unit}</Text>
                            </Text>
                        </View>
                    </View>
                    <Progress.Bar
                        progress={(tactic.currentProgress || 0) / tactic.targetValue}
                        width={null}
                        color={tactic.completed ? Colors.palette.success : Colors.palette.primary}
                        unfilledColor="#e0e0e0"
                        borderWidth={0}
                        height={6}
                        borderRadius={3}
                        style={{ marginTop: 10 }}
                        animated={true}
                    />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={[styles.checkboxItem, tactic.completed && styles.checkboxItemCompleted]}
                    onPress={() => onToggle(weekKey, tactic.id)}
                    onLongPress={() => onDelete(weekKey, tactic.id)}
                    delayLongPress={500}
                    activeOpacity={0.7}
                >
                    <View style={[styles.checkbox, tactic.completed && styles.checkboxCompleted]}>
                        {tactic.completed && <View style={styles.checkboxInner} />}
                    </View>
                    <Text style={[styles.tacticText, tactic.completed && styles.tacticTextCompleted]}>
                        {tactic.text}
                    </Text>
                </TouchableOpacity>
            )}

            {/* Reorder controls */}
            <View style={styles.reorderControls}>
                <TouchableOpacity
                    onPress={() => onReorder(weekKey, index, 'up')}
                    disabled={index === 0}
                    style={[styles.reorderBtn, index === 0 && styles.reorderBtnDisabled]}
                >
                    <MaterialCommunityIcons name="chevron-up" size={24} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => onReorder(weekKey, index, 'down')}
                    disabled={index === total - 1}
                    style={[styles.reorderBtn, index === total - 1 && styles.reorderBtnDisabled]}
                >
                    <MaterialCommunityIcons name="chevron-down" size={24} color="#666" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    targetItem: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'stretch',
        paddingVertical: 12,
        backgroundColor: 'rgba(52, 152, 219, 0.03)',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 8,
    },
    targetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginHorizontal: 8,
    },
    unitText: {
        fontSize: 10,
        color: '#888',
    },
    checkboxItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    checkboxItemCompleted: {
        backgroundColor: 'rgba(39, 174, 96, 0.05)',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#aaa',
        marginRight: 14,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    checkboxCompleted: {
        borderColor: Colors.palette.success,
        backgroundColor: '#eafaf1',
    },
    checkboxInner: {
        width: 12,
        height: 12,
        backgroundColor: Colors.palette.success,
        borderRadius: 2,
    },
    tacticText: {
        fontSize: 16,
        color: '#444',
        flex: 1,
    },
    tacticTextCompleted: {
        textDecorationLine: 'line-through',
        color: '#aaa',
    },
    reorderControls: {
        flexDirection: 'column',
        paddingLeft: 4,
    },
    reorderBtn: {
        padding: 2,
    },
    reorderBtnDisabled: {
        opacity: 0.3,
    },
});

export default TacticItem;
