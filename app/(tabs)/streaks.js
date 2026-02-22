import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useStreaksData } from '../../hooks/useStreaksData';
import { StreakHeader, StatsOverview, HeatmapGrid, LogHoursModal, TierCard, FullHistoryModal } from '../../components/StreakComponents';

const StreaksScreen = () => {
    const {
        heatmapData,
        currentStreak,
        longestStreak,
        totalDaysWon,
        monthlyScore,
        thisWeekHours,
        thisWeekAvg,
        avgIntensity,
        trendPercentage,
        targetProgress,
        weekOverWeekGrowth,
        levelInfo,
        consistencyScore,
        isLoading,
        loadData,
        updateHoursForDate,
    } = useStreaksData();

    const [modalVisible, setModalVisible] = useState(false);
    const [fullHistoryVisible, setFullHistoryVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [currentHoursInput, setCurrentHoursInput] = useState('');

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const handleDayPress = (dateStr, hours) => {
        setSelectedDate(dateStr);
        setCurrentHoursInput(hours);
        setModalVisible(true);
    };

    const handleSaveHours = async (hours) => {
        await updateHoursForDate(selectedDate, hours);
        setModalVisible(false);
    };



    if (isLoading && !Object.keys(heatmapData).length) {
        return (
            <View style={styles.centered}>
                <Text style={styles.loadingText}>Loading Streaks...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <LogHoursModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSave={handleSaveHours}
                dateStr={selectedDate}
                currentHours={currentHoursInput}
            />

            <FullHistoryModal
                visible={fullHistoryVisible}
                onClose={() => setFullHistoryVisible(false)}
                heatmapData={heatmapData}
                onDayPress={handleDayPress}
            />

            <Text style={styles.header}>Activity Streaks</Text>

            <TierCard levelInfo={levelInfo} />

            <StreakHeader
                currentStreak={currentStreak}
                longestStreak={longestStreak}
            />

            <StatsOverview
                targetProgress={targetProgress}
                weekOverWeekGrowth={weekOverWeekGrowth}
                thisWeekHours={thisWeekHours}
                thisWeekAvg={thisWeekAvg}
                monthlyScore={monthlyScore}
                consistencyScore={consistencyScore}
                avgIntensity={avgIntensity}
                trendPercentage={trendPercentage}
            />

            <HeatmapGrid
                heatmapData={heatmapData}
                onDayPress={handleDayPress}
            />

            <TouchableOpacity
                style={styles.historyButton}
                onPress={() => setFullHistoryVisible(true)}
            >
                <Ionicons name="time-outline" size={20} color="#3498db" />
                <Text style={styles.historyButtonText}>View Full History</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa', // Slightly lighter/cleaner background
    },
    contentContainer: {
        paddingVertical: 24,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        fontSize: 16,
        color: '#7f8c8d',
        fontWeight: '500',
    },
    header: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 24,
        color: '#2c3e50',
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    historyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 16,
        marginBottom: 20,
        width: '100%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#3498db',
    },
    historyButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#3498db',
        marginLeft: 8,
    },
});

export default StreaksScreen;
