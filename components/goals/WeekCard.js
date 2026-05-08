/**
 * WeekCard — Renders a single week with its tactics and add input.
 *
 * Extracted from detail.js lines 499-597 (~100 lines of inline JSX).
 * Each WeekCard is self-contained with its own progress bar, tactic list, and add input.
 */

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import * as Progress from 'react-native-progress';
import { Colors } from '../../constants/Colors';
import TacticItem from './TacticItem';
import { calculateWeekProgress, isWeekComplete } from '../../utils/progressCalculator';
import { formatDateShort } from '../../utils/dateHelpers';
import { getWeekIndex } from '../../utils/weekBuilder';

/**
 * @param {Object}   props
 * @param {string}   props.weekKey    - e.g. 'week_0'
 * @param {Object}   props.weekData   - Week object { startDate, endDate, tasks }
 * @param {string}   props.inputValue - Current text input value
 * @param {Function} props.onInputChange  - (text) for input changes
 * @param {Function} props.onAddTactic    - (weekKey) trigger add modal
 * @param {Function} props.onToggleTactic - (weekKey, tacticId)
 * @param {Function} props.onUpdateTactic - (weekKey, tactic)
 * @param {Function} props.onDeleteTactic - (weekKey, tacticId)
 * @param {Function} props.onReorderTactic - (weekKey, index, direction)
 */
const WeekCard = ({
    weekKey,
    weekData,
    inputValue,
    onInputChange,
    onAddTactic,
    onToggleTactic,
    onUpdateTactic,
    onDeleteTactic,
    onReorderTactic,
}) => {
    const weekProgress = calculateWeekProgress(weekData);
    const weekComplete = isWeekComplete(weekData);
    const weekNum = getWeekIndex(weekKey) + 1;
    const tasks = weekData.tasks || [];

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>
                    Week {weekNum}: {formatDateShort(weekData.startDate)} - {formatDateShort(weekData.endDate)}
                </Text>
                {weekComplete && <Text style={styles.tick}>✓</Text>}
            </View>

            {/* Progress */}
            <Progress.Bar
                progress={weekProgress}
                width={null}
                height={8}
                color={weekProgress === 1 ? Colors.palette.success : '#ffa726'}
                unfilledColor="#e0e0e0"
                borderWidth={0}
                borderRadius={4}
                style={{ marginTop: 4, marginBottom: 10 }}
            />

            {/* Tactics List */}
            {tasks.map((tactic, idx) => (
                <TacticItem
                    key={tactic.id}
                    tactic={tactic}
                    weekKey={weekKey}
                    index={idx}
                    total={tasks.length}
                    onToggle={onToggleTactic}
                    onUpdate={onUpdateTactic}
                    onDelete={onDeleteTactic}
                    onReorder={onReorderTactic}
                />
            ))}

            {tasks.length === 0 && (
                <Text style={styles.emptyText}>No tactics added for this week yet.</Text>
            )}

            {/* Add Tactic Input */}
            <View style={styles.addContainer}>
                <View style={{ flex: 1 }}>
                    <TextInput
                        style={styles.input}
                        placeholder="Add a new tactic/task..."
                        value={inputValue}
                        onChangeText={onInputChange}
                        onSubmitEditing={() => onAddTactic(weekKey)}
                        placeholderTextColor="#aaa"
                    />
                </View>
                <TouchableOpacity
                    onPress={() => onAddTactic(weekKey)}
                    style={styles.addButton}
                >
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        marginHorizontal: 18,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#333',
        flexShrink: 1,
    },
    tick: {
        fontSize: 22,
        color: Colors.palette.success,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    emptyText: {
        color: '#888',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 15,
    },
    addContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 15,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 5,
        marginRight: 10,
        backgroundColor: '#fff',
        fontSize: 15,
    },
    addButton: {
        backgroundColor: Colors.palette.primary,
        paddingHorizontal: 15,
        paddingVertical: 9,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        alignSelf: 'stretch',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default WeekCard;
