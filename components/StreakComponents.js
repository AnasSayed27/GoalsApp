import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUTCDateString } from '../hooks/useStreaksData';

const screenWidth = Dimensions.get('window').width;
const NUM_WEEKS_TO_SHOW = 10;

// --- Helper Functions ---

const getStartOfWeekUTC = (date) => {
    const dt = new Date(date.getTime());
    dt.setUTCHours(0, 0, 0, 0);
    const dayOfWeek = dt.getUTCDay();
    // Adjust for Monday start: Sunday (0) becomes 6, Monday (1) becomes 0
    const mondayDiff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const diff = dt.getUTCDate() - mondayDiff;
    dt.setUTCDate(diff);
    return dt;
};

const getCellColor = (hours, isFuture) => {
    if (isFuture) return '#f0f0f0';
    if (hours === undefined || hours === null) return '#e0e0e0';
    if (hours === 0) return '#e0e0e0';
    if (hours > 0 && hours <= 2) return '#f87171'; // Softer Red
    if (hours > 2 && hours <= 3.5) return '#fbbf24'; // Amber (Less aggressive)
    if (hours > 3.5 && hours <= 5) return '#4ade80'; // Vibrant Green (More prominent)
    if (hours > 5) return '#166534'; // Rich Deep Green
    return '#e0e0e0';
};

// --- Components ---

export const TierCard = ({ levelInfo }) => {
    const [infoVisible, setInfoVisible] = useState(false);

    return (
        <>
            <TouchableOpacity
                style={[styles.levelCard, { borderLeftColor: levelInfo.color, borderLeftWidth: 6 }]}
                onPress={() => setInfoVisible(true)}
                activeOpacity={0.9}
            >
                <View style={styles.levelHeader}>
                    <View style={styles.rankContainer}>
                        <Text style={styles.rankIcon}>{levelInfo.icon}</Text>
                        <View>
                            <Text style={styles.rankTitle}>{levelInfo.title}</Text>
                            <Text style={styles.rankSubtitle}>Monthly Discipline Tier</Text>
                        </View>
                    </View>
                    <View style={styles.xpContainer}>
                        <Text style={[styles.xpText, { color: levelInfo.color }]}>{levelInfo.score}/100</Text>
                        <Text style={styles.xpLabel}>Score</Text>
                    </View>
                </View>

                <View style={styles.progressBarContainer}>
                    <View
                        style={[
                            styles.progressBarFill,
                            {
                                width: `${Math.min(Math.max(levelInfo.score, 5), 100)}%`,
                                backgroundColor: levelInfo.color
                            }
                        ]}
                    />
                </View>

                <View style={styles.levelFooter}>
                    <Text style={styles.nextRankText}>
                        Tap for tier rules & details
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color="#3498db" />
                </View>
            </TouchableOpacity>

            <Modal
                animationType="fade"
                transparent={true}
                visible={infoVisible}
                onRequestClose={() => setInfoVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>🏆 Monthly Tier System</Text>
                            <TouchableOpacity onPress={() => setInfoVisible(false)}>
                                <Ionicons name="close-circle" size={28} color="#bdc3c7" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                            <Text style={styles.modalSubtitle}>Your rank updates daily based on this month's performance.</Text>

                            <View style={styles.ruleContainer}>
                                <View style={styles.ruleBox}>
                                    <View style={styles.ruleHeaderRow}>
                                        <Text style={styles.ruleTitle}>1. Consistency</Text>
                                        <Text style={styles.rulePoints}>Max 60 pts</Text>
                                    </View>
                                    <Text style={styles.ruleText}>Based on Win Rate (Days ≥ 2.5 hrs)</Text>
                                    <View style={styles.ruleStatBox}>
                                        <Text style={styles.ruleStatLabel}>Your Score:</Text>
                                        <Text style={styles.ruleStatValue}>{levelInfo.details?.consistency || 0} pts</Text>
                                        <Text style={styles.ruleStatSub}>({levelInfo.details?.winRate || 0}% Win Rate)</Text>
                                    </View>
                                </View>

                                <View style={styles.ruleBox}>
                                    <View style={styles.ruleHeaderRow}>
                                        <Text style={styles.ruleTitle}>2. Intensity</Text>
                                        <Text style={styles.rulePoints}>Max 40 pts</Text>
                                    </View>
                                    <Text style={styles.ruleText}>Based on Avg Hours (Target: 5 hrs)</Text>
                                    <View style={styles.ruleStatBox}>
                                        <Text style={styles.ruleStatLabel}>Your Score:</Text>
                                        <Text style={styles.ruleStatValue}>{levelInfo.details?.intensity || 0} pts</Text>
                                        <Text style={styles.ruleStatSub}>({levelInfo.details?.avgHours || 0} hrs/day)</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <Text style={styles.tierListTitle}>Tier Thresholds</Text>
                            <View style={styles.tierListContainer}>
                                <View style={styles.tierRow}><Text style={styles.tierName}>🏆 Titan</Text><Text style={styles.tierPoints}>90+ pts</Text></View>
                                <View style={styles.tierRow}><Text style={styles.tierName}>⚔️ Warrior</Text><Text style={styles.tierPoints}>70-89 pts</Text></View>
                                <View style={styles.tierRow}><Text style={styles.tierName}>🛡️ Guardian</Text><Text style={styles.tierPoints}>50-69 pts</Text></View>
                                <View style={styles.tierRow}><Text style={styles.tierName}>🌱 Novice</Text><Text style={styles.tierPoints}>25-49 pts</Text></View>
                                <View style={styles.tierRow}><Text style={styles.tierName}>😴 Slacker</Text><Text style={styles.tierPoints}>0-24 pts</Text></View>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    );
};

export const StreakHeader = ({ currentStreak, longestStreak }) => (
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

export const StatsOverview = ({ thisWeekScore, thisWeekHours, thisWeekAvg, monthlyScore, consistencyScore, avgIntensity, trendPercentage }) => {
    // Dynamic Color Logic
    const trendIsPositive = trendPercentage >= 0;
    const trendColor = trendIsPositive ? '#2ecc71' : '#e74c3c';
    const trendIcon = trendIsPositive ? 'trending-up-outline' : 'trending-down-outline';

    const winRate = Math.round(consistencyScore * 100);
    let winRateColor = '#9b59b6'; // Default Purple
    if (winRate >= 80) winRateColor = '#2ecc71'; // Green
    else if (winRate >= 50) winRateColor = '#f1c40f'; // Yellow
    else if (winRate > 0) winRateColor = '#e74c3c'; // Red

    return (
        <>
            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Ionicons name="calendar-outline" size={24} color="#3498db" />
                    <Text style={styles.statNumber}>{thisWeekScore} / 7</Text>
                    <Text style={styles.statSubtext}>{thisWeekAvg.toFixed(1)} Hrs / Day</Text>
                    <Text style={styles.statLabel}>This Week</Text>
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
                    <Text style={styles.statSubtext}>vs Last Week</Text>
                    <Text style={styles.statLabel}>7-Day Trend</Text>
                </View>
            </View>
        </>
    );
};

export const HeatmapGrid = ({ heatmapData, onDayPress, numWeeks = NUM_WEEKS_TO_SHOW, title = "Activity Heatmap" }) => {
    const generateHeatmapGridUIData = () => {
        const gridRows = [];
        const todayNormalized = new Date();
        todayNormalized.setUTCHours(0, 0, 0, 0);

        let currentWeekStartDate = getStartOfWeekUTC(todayNormalized);
        currentWeekStartDate.setUTCDate(currentWeekStartDate.getUTCDate() - (numWeeks - 1) * 7);

        for (let weekIndex = 0; weekIndex < numWeeks; weekIndex++) {
            let weekCells = [];
            for (let dayIndexInWeek = 0; dayIndexInWeek < 7; dayIndexInWeek++) {
                const cellDate = new Date(currentWeekStartDate.getTime());
                cellDate.setUTCDate(currentWeekStartDate.getUTCDate() + (weekIndex * 7) + dayIndexInWeek);
                const dateStr = getUTCDateString(cellDate);
                const hours = heatmapData[dateStr];

                const isFuture = cellDate.getTime() > todayNormalized.getTime();
                const isToday = dateStr === getUTCDateString(todayNormalized) && !isFuture;

                weekCells.push({
                    date: dateStr,
                    hours: hours,
                    isFuture: isFuture,
                    isToday: isToday
                });
            }
            gridRows.push(weekCells);
        }

        const transposedGrid = [];
        if (gridRows.length > 0 && gridRows[0].length === 7) {
            for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
                let dayColumnCells = [];
                for (let weekIdx = 0; weekIdx < numWeeks; weekIdx++) {
                    dayColumnCells.push(gridRows[weekIdx][dayOfWeek]);
                }
                transposedGrid.push(dayColumnCells);
            }
        }
        return transposedGrid;
    };

    const transposedGridData = generateHeatmapGridUIData();
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    // Dynamic sizing
    const horizontalPadding = 20; // Approximate padding
    const dayLabelWidth = 25;
    const gap = 5;
    const availableWidth = screenWidth - (horizontalPadding * 2) - dayLabelWidth - gap - 10;
    const cellWidth = Math.max(12, Math.floor(availableWidth / (numWeeks > 10 ? 12 : numWeeks))); // Limit cell width calculation base
    const cellHeight = cellWidth;

    return (
        <View style={styles.heatmapSectionContainer}>
            <Text style={styles.heatmapTitle}>{title}</Text>
            <View style={styles.gridOuterContainer}>
                <View style={[styles.dayLabelsColumn, { height: (cellHeight + 4) * 7 - 4 }]}>
                    {dayLabels.map((label, index) => (
                        <Text key={`label-${index}`} style={[styles.dayLabelText, { height: cellHeight, lineHeight: cellHeight }]}>
                            {index % 2 === 0 ? label : ''}
                        </Text>
                    ))}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gridScrollView}>
                    <View style={styles.gridInnerContainer}>
                        {transposedGridData[0].map((_, weekIndex) => (
                            <View key={`weekcol-${weekIndex}`} style={[styles.weekColumn, { marginRight: weekIndex < numWeeks - 1 ? 4 : 0 }]}>
                                {transposedGridData.map((dayRow, dayIndex) => {
                                    const cell = dayRow[weekIndex];
                                    if (!cell) return <View key={`empty-${weekIndex}-${dayIndex}`} style={[styles.dayCell, { width: cellWidth, height: cellHeight, backgroundColor: '#f0f0f0' }]} />;

                                    return (
                                        <TouchableOpacity
                                            key={cell.date + weekIndex + dayIndex}
                                            style={[
                                                styles.dayCell,
                                                {
                                                    width: cellWidth,
                                                    height: cellHeight,
                                                    backgroundColor: getCellColor(cell.hours, cell.isFuture),
                                                },
                                                cell.isToday && styles.todayCell,
                                                cell.isFuture && styles.futureCell,
                                            ]}
                                            disabled={cell.isFuture}
                                            onPress={() => !cell.isFuture && onDayPress(cell.date, cell.hours)}
                                        >
                                            {cell.hours > 0 && (
                                                <Text style={styles.cellText}>{cell.hours}</Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>
            <View style={styles.legendContainerGrid}>
                <View style={styles.legendItemGrid}><View style={[styles.legendDotGrid, { backgroundColor: getCellColor(1, false) }]} /><Text style={styles.legendTextGrid}>0.5 - 2 hrs</Text></View>
                <View style={styles.legendItemGrid}><View style={[styles.legendDotGrid, { backgroundColor: getCellColor(3, false) }]} /><Text style={styles.legendTextGrid}>2.5 - 3.5 hrs</Text></View>
                <View style={styles.legendItemGrid}><View style={[styles.legendDotGrid, { backgroundColor: getCellColor(4, false) }]} /><Text style={styles.legendTextGrid}>4 - 5 hrs</Text></View>
                <View style={styles.legendItemGrid}><View style={[styles.legendDotGrid, { backgroundColor: getCellColor(6, false) }]} /><Text style={styles.legendTextGrid}>5+ hrs</Text></View>
                <View style={styles.legendItemGrid}><View style={[styles.legendDotGrid, { backgroundColor: getCellColor(0, false) }]} /><Text style={styles.legendTextGrid}>0 hrs</Text></View>
            </View>
        </View>
    );
};

export const LogHoursModal = ({ visible, onClose, onSave, dateStr, currentHours }) => {
    const [hourOptions] = useState([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8]);

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{`Log Hours for ${dateStr}`}</Text>
                    <Text style={styles.modalSubtitle}>
                        {`Current: ${currentHours !== undefined ? currentHours : '0'} hrs\nSelect hours:`}
                    </Text>

                    <FlatList
                        data={hourOptions}
                        horizontal={false}
                        numColumns={3}
                        keyExtractor={(item) => item.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.hourOption,
                                    item === currentHours && styles.selectedHourOption
                                ]}
                                onPress={() => onSave(item)}
                            >
                                <Text style={[
                                    styles.hourOptionText,
                                    item === currentHours && styles.selectedHourOptionText
                                ]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.hourListContainer}
                    />

                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const generateQuarters = (startDateStr) => {
    if (!startDateStr) return [{ label: 'All Time', start: null, end: null }];

    // Ensure we parse correctly without TZ issues
    const firstDate = new Date(startDateStr + 'T00:00:00Z');
    const today = new Date();
    const intervals = [{ label: 'All Time', start: null, end: null }];

    let currentYear = firstDate.getUTCFullYear();
    let currentQuarter = Math.floor(firstDate.getUTCMonth() / 3); // 0-3

    const quarters = [
        { label: 'Jan-Mar', startMonth: 0, endMonth: 2 },
        { label: 'Apr-Jun', startMonth: 3, endMonth: 5 },
        { label: 'Jul-Sep', startMonth: 6, endMonth: 8 },
        { label: 'Oct-Dec', startMonth: 9, endMonth: 11 }
    ];

    const todayYear = today.getUTCFullYear();
    const todayQuarter = Math.floor(today.getUTCMonth() / 3);

    let y = currentYear;
    let q = currentQuarter;

    while (y < todayYear || (y === todayYear && q <= todayQuarter)) {
        const quarterInfo = quarters[q];
        const start = new Date(Date.UTC(y, quarterInfo.startMonth, 1));
        const end = new Date(Date.UTC(y, quarterInfo.endMonth + 1, 0, 23, 59, 59, 999));

        intervals.push({
            label: `${quarterInfo.label} ${y}`,
            start,
            end
        });

        q++;
        if (q > 3) {
            q = 0;
            y++;
        }
    }

    return intervals.reverse(); // Show newest first
};

export const FullHistoryModal = ({ visible, onClose, heatmapData, onDayPress }) => {
    const dates = Object.keys(heatmapData).sort();
    const [selectedRange, setSelectedRange] = useState({ label: 'All Time', start: null, end: null });
    const [pickerVisible, setPickerVisible] = useState(false);
    const intervals = generateQuarters(dates[0]);

    // Calculate weeks needed to show all history
    let numWeeks = 26; // Default to 6 months
    if (dates.length > 0) {
        const oldestDate = new Date(dates[0] + 'T00:00:00Z');
        const today = new Date();
        const diffInDays = Math.ceil((today.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
        numWeeks = Math.max(26, Math.ceil(diffInDays / 7) + 1);
    }

    // Filter dates based on selected range
    const filteredDates = dates.filter(d => {
        if (!selectedRange.start) return true;
        const dt = new Date(d + 'T00:00:00Z');
        return dt >= selectedRange.start && dt <= selectedRange.end;
    });

    const totalHours = Object.keys(heatmapData)
        .filter(d => {
            if (!selectedRange.start) return true;
            const dt = new Date(d + 'T00:00:00Z');
            return dt >= selectedRange.start && dt <= selectedRange.end;
        })
        .reduce((acc, d) => acc + (heatmapData[d] || 0), 0);

    const journeyDuration = (() => {
        if (dates.length === 0) return 0;

        const firstEntryDate = new Date(dates[0] + 'T00:00:00Z');
        const start = selectedRange.start ? new Date(Math.max(selectedRange.start.getTime(), firstEntryDate.getTime())) : firstEntryDate;
        const end = selectedRange.end ? new Date(Math.min(selectedRange.end.getTime(), new Date().getTime())) : new Date();

        const d1 = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
        const d2 = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());

        if (d2 < d1) return 0;
        return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
    })();

    const milestoneCounts = (() => {
        const counts = { elite: 0, workhorse: 0, solid: 0, active: 0, rest: 0 };
        if (dates.length === 0) return counts;

        const firstEntryDate = new Date(dates[0] + 'T00:00:00Z');
        const start = selectedRange.start ? new Date(Math.max(selectedRange.start.getTime(), firstEntryDate.getTime())) : firstEntryDate;
        const end = selectedRange.end ? new Date(Math.min(selectedRange.end.getTime(), new Date().getTime())) : new Date();

        const firstDayUTC = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
        const lastDayUTC = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());

        if (lastDayUTC < firstDayUTC) return counts;
        const totalDaysCount = Math.floor((lastDayUTC - firstDayUTC) / (1000 * 60 * 60 * 24)) + 1;

        for (let i = 0; i < totalDaysCount; i++) {
            const d = new Date(firstDayUTC);
            d.setUTCDate(new Date(firstDayUTC).getUTCDate() + i);
            const dStr = d.toISOString().split('T')[0];
            const h = heatmapData[dStr] || 0;

            if (h >= 6) counts.elite++;
            else if (h >= 5) counts.workhorse++;
            else if (h >= 4) counts.solid++;
            else if (h >= 3) counts.active++;
            else counts.rest++;
        }
        return counts;
    })();

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.fullHistoryContainer}>
                <View style={styles.fullHistoryHeader}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.fullHistoryTitle}>Full History</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    <HeatmapGrid
                        heatmapData={heatmapData}
                        onDayPress={onDayPress}
                        numWeeks={numWeeks}
                        title="All Recorded Activity"
                    />

                    {/* Custom Dropdown Selector */}
                    <View style={styles.dropdownContainer}>
                        <TouchableOpacity
                            style={styles.dropdownButton}
                            onPress={() => setPickerVisible(true)}
                        >
                            <View style={styles.dropdownButtonContent}>
                                <Ionicons name="calendar" size={20} color="#3498db" style={{ marginRight: 8 }} />
                                <Text style={styles.dropdownButtonText}>{selectedRange.label}</Text>
                            </View>
                            <Ionicons name="chevron-down" size={18} color="#7f8c8d" />
                        </TouchableOpacity>
                    </View>

                    {/* Selection Modal (Dropdown content) */}
                    <Modal
                        visible={pickerVisible}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setPickerVisible(false)}
                    >
                        <TouchableOpacity
                            style={styles.pickerModalOverlay}
                            activeOpacity={1}
                            onPress={() => setPickerVisible(false)}
                        >
                            <View style={styles.pickerModalContent}>
                                <View style={styles.pickerModalHeader}>
                                    <Text style={styles.pickerModalTitle}>Select Period</Text>
                                    <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                        <Ionicons name="close" size={24} color="#333" />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView bounces={false}>
                                    {intervals.map((interval, idx) => (
                                        <TouchableOpacity
                                            key={`interval-${idx}`}
                                            style={[
                                                styles.pickerOption,
                                                selectedRange.label === interval.label && styles.pickerOptionSelected
                                            ]}
                                            onPress={() => {
                                                setSelectedRange(interval);
                                                setPickerVisible(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.pickerOptionText,
                                                selectedRange.label === interval.label && styles.pickerOptionTextSelected
                                            ]}>
                                                {interval.label}
                                            </Text>
                                            {selectedRange.label === interval.label && (
                                                <Ionicons name="checkmark-circle" size={20} color="#3498db" />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </TouchableOpacity>
                    </Modal>

                    {/* Lifetime Statistics Section */}
                    <Text style={styles.recentLogsTitle}>
                        {selectedRange.label === 'All Time' ? 'Lifetime Statistics' : `Stats for ${selectedRange.label}`}
                    </Text>
                    <View style={styles.lifetimeStatsContainer}>
                        <View style={styles.lifetimeStatCard}>
                            <Ionicons name="calendar-outline" size={24} color="#3498db" />
                            <Text style={styles.lifetimeStatValue}>{filteredDates.length}</Text>
                            <Text style={styles.lifetimeStatLabel}>Active Days</Text>
                            <Text style={styles.lifetimeStatSub}>
                                {selectedRange.label === 'All Time' ? (dates[0] ? `From ${dates[0]}` : 'Tracked') : 'In Period'}
                            </Text>
                        </View>
                        <View style={styles.lifetimeStatCard}>
                            <Ionicons name="time-outline" size={24} color="#2ecc71" />
                            <Text style={styles.lifetimeStatValue}>
                                {totalHours.toFixed(1)}
                            </Text>
                            <Text style={styles.lifetimeStatLabel}>Total Hours</Text>
                            <Text style={styles.lifetimeStatSub}>
                                {selectedRange.label === 'All Time' ? (dates[0] ? `Since ${dates[0]}` : 'Logged') : 'In Period'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.singleStatContainer}>
                        <View style={[styles.lifetimeStatCard, { width: '60%' }]}>
                            <Ionicons name="analytics-outline" size={24} color="#e67e22" />
                            <Text style={styles.lifetimeStatValue}>
                                {filteredDates.length > 0 ? (totalHours / filteredDates.length).toFixed(1) : '0'}
                            </Text>
                            <Text style={styles.lifetimeStatLabel}>Daily Avg</Text>
                            <Text style={styles.lifetimeStatSub}>Hours Per Active Day</Text>
                        </View>
                    </View>

                    {/* Journey Duration Section */}
                    <View style={styles.trackingRangeContainer}>
                        <Text style={styles.trackingRangeHeader}>
                            {selectedRange.label === 'All Time' ? 'Journey Duration' : 'Period Duration'}
                        </Text>
                        <Text style={styles.trackingRangeText}>
                            <Text style={styles.trackingRangeValues}>{journeyDuration}</Text> Days
                        </Text>
                        <Text style={styles.trackingRangeSub}>
                            {selectedRange.label === 'All Time' ?
                                `${dates[0] || 'N/A'} — ${dates[dates.length - 1] || 'Today'}` :
                                `${selectedRange.start.toISOString().split('T')[0]} — ${selectedRange.end.toISOString().split('T')[0]}`}
                        </Text>
                    </View>

                    <Text style={styles.recentLogsTitle}>🏆 Milestone Summary</Text>
                    {dates.length === 0 ? (
                        <Text style={styles.noHistoryText}>No records found yet.</Text>
                    ) : (() => {
                        const milestoneList = [
                            { label: 'Elite (6+ hrs)', count: milestoneCounts.elite, color: '#f1c40f', icon: 'flash' },
                            { label: 'Workhorse (5+ hrs)', count: milestoneCounts.workhorse, color: '#e67e22', icon: 'construct' },
                            { label: 'Solid (4+ hrs)', count: milestoneCounts.solid, color: '#3498db', icon: 'trending-up' },
                            { label: 'Active (3+ hrs)', count: milestoneCounts.active, color: '#2ecc71', icon: 'walk' },
                            { label: 'Low/Rest (< 3 hrs)', count: milestoneCounts.rest, color: '#95a5a6', icon: 'cafe' }
                        ];

                        return milestoneList.map((m, idx) => (
                            <View key={`milestone-${idx}`} style={styles.historyListItem}>
                                <View style={styles.historyListDateContainer}>
                                    <Ionicons name={m.icon} size={20} color={m.color} style={{ marginRight: 12 }} />
                                    <Text style={styles.milestoneLabel}>{m.label}</Text>
                                </View>
                                <View style={[styles.milestoneBadge, { backgroundColor: m.color }]}>
                                    <Text style={styles.milestoneCount}>{m.count} days</Text>
                                </View>
                            </View>
                        ));
                    })()}
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    // --- Level Card (New) ---
    levelCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginVertical: 16,
        width: '100%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    levelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // Align to top
        marginBottom: 16,
    },
    rankContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1, // Allow it to take available space
        marginRight: 30, // Add spacing between rank and score
    },
    rankIcon: {
        fontSize: 36,
        marginRight: 12,
    },
    rankTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#2c3e50',
        letterSpacing: -0.5,
        flexShrink: 1, // Allow text to shrink if needed
    },
    rankSubtitle: {
        fontSize: 12,
        color: '#95a5a6',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    xpContainer: {
        alignItems: 'flex-end',
        minWidth: 80, // Ensure minimum width for score
        marginTop: 2, // Align with rankTitle
    },
    xpText: {
        fontSize: 20, // Slightly larger for better visibility
        fontWeight: '800',
    },
    xpLabel: {
        fontSize: 11,
        color: '#95a5a6',
        fontWeight: '600',
    },
    progressBarContainer: {
        height: 10,
        backgroundColor: '#f0f2f5',
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    levelFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    nextRankText: {
        fontSize: 12,
        color: '#3498db',
        fontWeight: '600',
    },

    // --- Modal Styles ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        maxHeight: '80%', // Prevent modal from being too tall
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#2c3e50',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 20,
    },
    ruleContainer: {
        flexDirection: 'column', // Stack vertically for better space
        marginBottom: 16,
    },
    ruleBox: {
        width: '100%', // Full width
        backgroundColor: '#f8f9fa',
        padding: 16, // More padding
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 12, // Spacing between boxes
    },
    ruleHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    ruleTitle: {
        fontSize: 16, // Larger title
        fontWeight: '700',
        color: '#2c3e50',
    },
    rulePoints: {
        fontSize: 12,
        color: '#e67e22',
        fontWeight: '700',
        backgroundColor: '#fff3e0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
    },
    ruleText: {
        fontSize: 13,
        color: '#95a5a6',
        marginBottom: 12,
        lineHeight: 18,
    },
    ruleStatBox: {
        flexDirection: 'row', // Align label and value horizontally
        alignItems: 'baseline',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    ruleStatLabel: {
        fontSize: 12,
        color: '#bdc3c7',
        fontWeight: '600',
        textTransform: 'uppercase',
        marginRight: 8,
    },
    ruleStatValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2c3e50',
        marginRight: 6,
    },
    ruleStatSub: {
        fontSize: 12,
        color: '#7f8c8d',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 16,
    },
    tierListTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2c3e50',
        marginBottom: 12,
    },
    tierListContainer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 12,
    },
    tierRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tierName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#34495e',
    },
    tierPoints: {
        fontSize: 14,
        fontWeight: '700',
        color: '#7f8c8d',
    },

    // --- Header Styles ---
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        marginVertical: 12,
        shadowColor: "#000",
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

    // --- Stats Styles ---
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
        shadowColor: "#000",
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

    // --- Heatmap Styles ---
    heatmapSectionContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginTop: 10,
        marginBottom: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    heatmapTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2c3e50',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    gridOuterContainer: {
        flexDirection: 'row',
    },
    dayLabelsColumn: {
        width: 25,
        justifyContent: 'space-between',
        paddingTop: 0,
        marginRight: 5,
    },
    dayLabelText: {
        fontSize: 10,
        color: '#bdc3c7',
        textAlign: 'center',
        fontWeight: '600',
    },
    gridScrollView: {
        flex: 1,
    },
    gridInnerContainer: {
        flexDirection: 'row',
    },
    weekColumn: {
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    dayCell: {
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    todayCell: {
        borderWidth: 2,
        borderColor: '#3498db',
    },
    futureCell: {
        opacity: 0.3,
    },
    cellText: {
        fontSize: 8,
        color: '#fff',
        fontWeight: 'bold',
    },
    legendContainerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 16,
        gap: 12,
    },
    legendItemGrid: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDotGrid: {
        width: 10,
        height: 10,
        borderRadius: 3,
        marginRight: 6,
    },
    legendTextGrid: {
        fontSize: 11,
        color: '#7f8c8d',
        fontWeight: '500',
    },

    // --- Log Hours Modal Styles ---
    hourOption: {
        width: '30%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        margin: '1.5%',
        borderRadius: 12,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#eee',
    },
    selectedHourOption: {
        backgroundColor: '#3498db',
        borderColor: '#3498db',
    },
    hourOptionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
    },
    selectedHourOptionText: {
        color: '#fff',
    },
    hourListContainer: {
        paddingVertical: 10,
    },
    closeButton: {
        marginTop: 20,
        paddingVertical: 12,
        width: '100%',
        backgroundColor: '#f1f2f6',
        borderRadius: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#7f8c8d',
    },
    // --- Full History Modal ---
    fullHistoryContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    fullHistoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 15, // Added some padding back for balance
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 4,
    },
    fullHistoryTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#2c3e50',
    },
    historyLegendInfo: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    historyLegendTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2c3e50',
    },
    historyLegendSub: {
        fontSize: 12,
        color: '#95a5a6',
    },
    recentLogsTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2c3e50',
        marginTop: 20,
        marginBottom: 16,
    },
    noHistoryText: {
        textAlign: 'center',
        color: '#95a5a6',
        marginTop: 20,
        fontStyle: 'italic',
    },
    historyListItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    historyListDateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    historyListDate: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2c3e50',
    },
    historyListHoursBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    historyListHours: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
    lifetimeStatsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    singleStatContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    lifetimeStatCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 18,
        width: '48%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f0f0f0',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
    },
    lifetimeStatValue: {
        fontSize: 26,
        fontWeight: '800',
        color: '#2c3e50',
        marginVertical: 4,
    },
    lifetimeStatLabel: {
        fontSize: 12,
        color: '#bdc3c7',
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    lifetimeStatSub: {
        fontSize: 10,
        color: '#95a5a6',
        marginTop: 2,
    },
    milestoneLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2c3e50',
    },
    milestoneBadge: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        minWidth: 80,
        alignItems: 'center',
    },
    milestoneCount: {
        fontSize: 13,
        fontWeight: '800',
        color: '#fff',
    },
    trackingRangeContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        alignItems: 'center',
        elevation: 1,
    },
    trackingRangeHeader: {
        fontSize: 12,
        color: '#bdc3c7',
        fontWeight: '800',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    trackingRangeText: {
        fontSize: 18,
        color: '#7f8c8d',
        fontWeight: '600',
    },
    trackingRangeValues: {
        color: '#2c3e50',
        fontWeight: '900',
        fontSize: 22,
    },
    trackingRangeSub: {
        fontSize: 13,
        color: '#95a5a6',
        marginTop: 4,
        fontWeight: '500',
    },
    rangeSelectorContainer: {
        marginVertical: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 5,
    },
    dropdownContainer: {
        marginVertical: 15,
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    dropdownButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dropdownButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2c3e50',
    },
    pickerModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: 20,
    },
    pickerModalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        maxHeight: '60%',
        paddingBottom: 10,
        overflow: 'hidden',
    },
    pickerModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    pickerModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2c3e50',
    },
    pickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f9f9f9',
    },
    pickerOptionSelected: {
        backgroundColor: '#f0f7ff',
    },
    pickerOptionText: {
        fontSize: 16,
        color: '#7f8c8d',
        fontWeight: '500',
    },
    pickerOptionTextSelected: {
        color: '#3498db',
        fontWeight: '700',
    },
});
