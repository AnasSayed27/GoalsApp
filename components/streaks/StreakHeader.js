import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * StreakHeader — Displays current/longest streak side by side.
 * Extracted from StreakComponents.js (lines 143-157).
 */
const StreakHeader = ({ currentStreak, longestStreak }) => (
    <View style={styles.headerContainer}>
        <View style={styles.streakBox}>
            <Ionicons name="flame" size={32} color="#e67e22" />
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
        </View>
        <View style={styles.dividerVertical} />
        <View style={styles.streakBox}>
            <Ionicons name="trophy" size={32} color="#f1c40f" />
            <Text style={styles.streakNumber}>{longestStreak}</Text>
            <Text style={styles.streakLabel}>Longest Streak</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        marginVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    streakBox: {
        alignItems: 'center',
        flex: 1,
        paddingHorizontal: 8,
    },
    streakNumber: {
        fontSize: 36,
        fontWeight: '800',
        color: '#2c3e50',
        marginVertical: 6,
        letterSpacing: -0.5,
    },
    streakLabel: {
        fontSize: 12,
        color: '#95a5a6',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    dividerVertical: {
        width: 1,
        height: '70%',
        backgroundColor: '#e0e0e0',
        marginHorizontal: 8,
    },
});

export default StreakHeader;
