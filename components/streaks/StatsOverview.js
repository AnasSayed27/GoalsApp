import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * StatsOverview — 2x2 grid of weekly trend/win-rate/intensity/pace stats.
 * Extracted from StreakComponents.js (lines 159-214).
 */
const StatsOverview = ({
    targetProgress,
    weekOverWeekGrowth,
    thisWeekHours,
    thisWeekAvg,
    monthlyScore,
    consistencyScore,
    avgIntensity,
    trendPercentage,
}) => {
    const trendIsPositive = trendPercentage >= 0;
    const trendColor = trendIsPositive ? '#2ecc71' : '#e74c3c';
    const trendIcon = trendIsPositive ? 'trending-up-outline' : 'trending-down-outline';

    const growthIsPositive = weekOverWeekGrowth >= 0;
    const growthColor = growthIsPositive ? '#2ecc71' : '#e74c3c';
    const growthIcon = growthIsPositive ? 'arrow-up-outline' : 'arrow-down-outline';

    const winRate = Math.round(consistencyScore * 100);
    let winRateColor = '#9b59b6';
    if (winRate >= 80) winRateColor = '#2ecc71';
    else if (winRate >= 50) winRateColor = '#f1c40f';
    else if (winRate > 0) winRateColor = '#e74c3c';

    return (
        <>
            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Ionicons name={growthIcon} size={24} color={growthColor} />
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 10, marginBottom: 2 }}>
                        <Text style={[styles.statNumber, { color: growthColor, marginTop: 0, marginBottom: 0 }]}>
                            {growthIsPositive ? '+' : ''}{Math.round(weekOverWeekGrowth)}%
                        </Text>
                        <Text style={{ fontSize: 7.5, color: '#bdc3c7', fontWeight: '700', marginLeft: 4, textTransform: 'uppercase' }}>vs last week</Text>
                    </View>
                    <Text style={styles.statSubtext}>{thisWeekAvg.toFixed(1)} Hrs / Day</Text>
                    <Text style={styles.statLabel}>7-Day Trend</Text>
                </View>
                <View style={styles.statBox}>
                    <Ionicons name="calendar-number-outline" size={24} color={winRateColor} />
                    <Text style={[styles.statNumber, { color: winRateColor }]}>{winRate}%</Text>
                    <Text style={styles.statSubtext}>{monthlyScore} / 30 Days</Text>
                    <Text style={styles.statLabel}>Win Rate</Text>
                </View>
            </View>
            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Ionicons name="speedometer-outline" size={24} color="#e67e22" />
                    <Text style={styles.statNumber}>{avgIntensity.toFixed(1)}</Text>
                    <Text style={styles.statSubtext}>Hrs / Day</Text>
                    <Text style={styles.statLabel}>Avg Intensity</Text>
                </View>
                <View style={styles.statBox}>
                    <Ionicons name={trendIcon} size={24} color={trendColor} />
                    <Text style={[styles.statNumber, { color: trendColor }]}>
                        {trendIsPositive ? '+' : ''}{trendPercentage.toFixed(0)}%
                    </Text>
                    <Text style={styles.statSubtext}>vs ideal (4.5h/d)</Text>
                    <Text style={styles.statLabel}>This Week</Text>
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    statBox: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        minHeight: 120,
        justifyContent: 'center',
    },
    statNumber: {
        fontSize: 22,
        fontWeight: '800',
        color: '#2c3e50',
        marginTop: 10,
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    statSubtext: {
        fontSize: 13,
        color: '#7f8c8d',
        marginBottom: 6,
        fontWeight: '500',
    },
    statLabel: {
        fontSize: 11,
        color: '#bdc3c7',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
});

export default StatsOverview;
