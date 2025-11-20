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
import { StreakHeader, StatsOverview, HeatmapGrid, LogHoursModal, TierCard } from '../../components/StreakComponents';

const StreaksScreen = () => {
    const {
        heatmapData,
        currentStreak,
        longestStreak,
        totalDaysWon,
        thisWeekScore,
        monthlyScore,
        thisWeekHours,
        avgIntensity,
        trendPercentage,
        levelInfo,
        consistencyScore,
        isLoading,
        loadData,
        updateHoursForDate,
        clearData
    } = useStreaksData();

    const [modalVisible, setModalVisible] = useState(false);
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

    const handleClearData = () => {
        Alert.alert(
            "Confirm Clear",
            "Are you sure you want to clear all streak and hours data? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear Data",
                    style: "destructive",
                    onPress: async () => {
                        const success = await clearData();
                        if (success) {
                            Alert.alert("Data Cleared", "All your data has been successfully cleared.");
                        }
                    },
                },
            ]
        );
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

            <Text style={styles.header}>Activity Streaks</Text>

            <TierCard levelInfo={levelInfo} />

            <StreakHeader
                currentStreak={currentStreak}
                longestStreak={longestStreak}
            />

            <StatsOverview
                thisWeekScore={thisWeekScore}
                thisWeekHours={thisWeekHours}
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
                style={styles.clearButton}
                onPress={handleClearData}
            >
                <Ionicons name="trash-bin-outline" size={20} color="#e74c3c" />
                <Text style={styles.clearButtonText}>Clear All Data</Text>
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
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        paddingVertical: 14,
        paddingHorizontal: 30,
        backgroundColor: '#fff',
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#ffebee',
        shadowColor: "#e74c3c",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    clearButtonText: {
        color: '#e74c3c',
        fontSize: 15,
        marginLeft: 8,
        fontWeight: '600',
    },
});

export default StreaksScreen;
