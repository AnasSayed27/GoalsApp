/**
 * EmptyState — Reusable empty state placeholder.
 *
 * Used when lists have no items (goals, tasks, tactics, subgoals).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * @param {Object} props
 * @param {string} props.message - Text to display
 * @param {string} [props.icon='clipboard-outline'] - Ionicons icon name
 * @param {number} [props.iconSize=48]
 * @param {string} [props.iconColor='#ccc']
 */
const EmptyState = ({
    message,
    icon = 'clipboard-outline',
    iconSize = 48,
    iconColor = '#ccc',
}) => (
    <View style={styles.container}>
        <Ionicons name={icon} size={iconSize} color={iconColor} />
        <Text style={styles.text}>{message}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
    text: {
        fontSize: 16,
        color: '#999',
        marginTop: 8,
        fontStyle: 'italic',
        textAlign: 'center',
    },
});

export default EmptyState;
