/**
 * TacticsDailyCard — Renders a single tactic in the daily dashboard.
 *
 * Extracted from tasks.js lines 236-262.
 * Handles both target-based (with +/- controls) and simple checkbox tactics.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Progress from 'react-native-progress';
import { Colors } from '../../constants/Colors';

/**
 * @param {Object}   props
 * @param {Object}   props.tactic - Enriched tactic with goalName, type, dailyPace, todayWork
 * @param {Function} props.onToggle  - (goalId, weekKey, tacticId) for checkbox
 * @param {Function} props.onUpdateProgress - (goalId, weekKey, tacticId, amount) for +/-
 */
const TacticsDailyCard = ({ tactic, onToggle, onUpdateProgress }) => {
    return (
        <View style={styles.card}>
            <Text style={styles.goalName}>{tactic.goalName}</Text>

            {tactic.type === 'target' ? (
                <View>
                    <View style={styles.row}>
                        <Text style={styles.tacticText}>{tactic.text}</Text>
                        <View style={styles.controls}>
                            <TouchableOpacity
                                style={styles.btn}
                                onPress={() => onUpdateProgress(tactic.goalId, tactic.weekKey, tactic.id, -1)}
                            >
                                <Text style={styles.btnText}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.progressText}>
                                {tactic.currentProgress || 0} / {tactic.targetValue}
                            </Text>
                            <TouchableOpacity
                                style={styles.btn}
                                onPress={() => onUpdateProgress(tactic.goalId, tactic.weekKey, tactic.id, 1)}
                            >
                                <Text style={styles.btnText}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.paceContainer}>
                        <Text style={styles.paceText}>
                            Required Pace:{' '}
                            <Text style={styles.paceHighlight}>
                                {tactic.dailyPace} {tactic.unit} today
                            </Text>
                        </Text>
                    </View>
                    <Progress.Bar
                        progress={
                            tactic.dailyPace > 0
                                ? Math.min((tactic.todayWork || 0) / tactic.dailyPace, 1)
                                : 1
                        }
                        width={null}
                        color={Colors.palette.primary}
                        unfilledColor="#e0e0e0"
                        borderWidth={0}
                        height={4}
                        borderRadius={2}
                        style={{ marginTop: 8 }}
                    />
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.row}
                    onPress={() => onToggle(tactic.goalId, tactic.weekKey, tactic.id)}
                >
                    <View style={[styles.checkbox, tactic.completed && styles.checkboxCompleted]}>
                        {tactic.completed && <View style={styles.checkboxInner} />}
                    </View>
                    <Text style={[styles.tacticText, tactic.completed && styles.tacticTextCompleted]}>
                        {tactic.text}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 14,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    goalName: {
        fontSize: 12,
        color: Colors.palette.primary,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    tacticText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
        fontWeight: '500',
    },
    tacticTextCompleted: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    btn: {
        backgroundColor: '#f0f0f0',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    btnText: {
        fontSize: 20,
        color: '#333',
        fontWeight: 'bold',
    },
    progressText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#555',
        marginHorizontal: 8,
        minWidth: 45,
        textAlign: 'center',
    },
    paceContainer: {
        marginTop: 6,
    },
    paceText: {
        fontSize: 13,
        color: '#666',
    },
    paceHighlight: {
        fontWeight: 'bold',
        color: Colors.palette.warning,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#aaa',
        marginRight: 12,
    },
    checkboxCompleted: {
        backgroundColor: Colors.palette.success,
        borderColor: Colors.palette.success,
    },
    checkboxInner: {
        width: 10,
        height: 10,
        backgroundColor: '#fff',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 4,
    },
});

export default TacticsDailyCard;
