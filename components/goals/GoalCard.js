/**
 * GoalCard — Renders a single goal in the goals list.
 *
 * Extracted from goals/index.js renderGoalItem (~30 lines inline).
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ProgressBar from '../common/ProgressBar';
import { Colors } from '../../constants/Colors';

/**
 * @param {Object}   props
 * @param {Object}   props.goal     - Goal object with progress
 * @param {Function} props.onPress  - Navigate to detail
 * @param {Function} props.onLongPress - Delete goal
 */
const GoalCard = ({ goal, onPress, onLongPress }) => (
    <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onLongPress={onLongPress}
    >
        <Text style={styles.name}>{goal.name}</Text>
        <Text style={styles.dates}>{`${goal.startDate} - ${goal.endDate}`}</Text>

        <View style={styles.progressRow}>
            <ProgressBar
                progress={goal.progress || 0}
                height={14}
                color={Colors.palette.success}
                showPercent={false}
                style={{ flex: 1 }}
            />
            <View style={styles.percentContainer}>
                <Text style={styles.percentText}>
                    {`${Math.round((goal.progress || 0) * 100)}%`}
                </Text>
                <MaterialCommunityIcons
                    name="trophy"
                    size={20}
                    color={Colors.palette.warning}
                    style={styles.trophy}
                />
            </View>
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.palette.card,
        padding: 15,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
        marginBottom: 10,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        color: Colors.palette.textPrimary,
    },
    dates: {
        fontSize: 14,
        color: Colors.palette.textSecondary,
        marginBottom: 10,
    },
    progressRow: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    percentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
        minWidth: 60,
    },
    percentText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.palette.textPrimary,
        marginRight: 4,
    },
    trophy: {
        marginLeft: 2,
    },
});

export default GoalCard;
