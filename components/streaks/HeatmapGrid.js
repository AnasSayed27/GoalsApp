import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { getUTCDateString } from '../../utils/dateHelpers';
import { getStartOfWeekUTC, getCellColor } from './streakHelpers';

const screenWidth = Dimensions.get('window').width;
const NUM_WEEKS_DEFAULT = 10;

/**
 * HeatmapGrid — GitHub-style activity heatmap.
 * Extracted from StreakComponents.js (lines 216-330).
 *
 * Reused by both the main streaks screen and the FullHistoryModal.
 */
const HeatmapGrid = ({ heatmapData, onDayPress, numWeeks = NUM_WEEKS_DEFAULT, title = 'Activity Heatmap' }) => {
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

                weekCells.push({ date: dateStr, hours, isFuture, isToday });
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

    const horizontalPadding = 20;
    const dayLabelWidth = 25;
    const gap = 5;
    const availableWidth = screenWidth - (horizontalPadding * 2) - dayLabelWidth - gap - 10;
    const cellWidth = Math.max(12, Math.floor(availableWidth / (numWeeks > 10 ? 12 : numWeeks)));
    const cellHeight = cellWidth;

    if (!transposedGridData.length || !transposedGridData[0]) return null;

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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gridScrollView} nestedScrollEnabled={true}>
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
                                                { width: cellWidth, height: cellHeight, backgroundColor: getCellColor(cell.hours, cell.isFuture) },
                                                cell.isToday && styles.todayCell,
                                                cell.isFuture && styles.futureCell,
                                            ]}
                                            disabled={cell.isFuture}
                                            onPress={() => !cell.isFuture && onDayPress(cell.date, cell.hours)}
                                        >
                                            {cell.hours > 0 && <Text style={styles.cellText}>{cell.hours}</Text>}
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

const styles = StyleSheet.create({
    heatmapSectionContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginTop: 10, marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, borderWidth: 1, borderColor: '#f0f0f0' },
    heatmapTitle: { fontSize: 18, fontWeight: '800', color: '#2c3e50', marginBottom: 16, letterSpacing: -0.5 },
    gridOuterContainer: { flexDirection: 'row' },
    dayLabelsColumn: { width: 25, justifyContent: 'space-between', paddingTop: 0, marginRight: 5 },
    dayLabelText: { fontSize: 10, color: '#bdc3c7', textAlign: 'center', fontWeight: '600' },
    gridScrollView: { flex: 1 },
    gridInnerContainer: { flexDirection: 'row' },
    weekColumn: { flexDirection: 'column', justifyContent: 'space-between' },
    dayCell: { borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    todayCell: { borderWidth: 2, borderColor: '#3498db' },
    futureCell: { opacity: 0.3 },
    cellText: { fontSize: 8, color: '#fff', fontWeight: 'bold' },
    legendContainerGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 16, gap: 12 },
    legendItemGrid: { flexDirection: 'row', alignItems: 'center' },
    legendDotGrid: { width: 10, height: 10, borderRadius: 3, marginRight: 6 },
    legendTextGrid: { fontSize: 11, color: '#7f8c8d', fontWeight: '500' },
});

export default HeatmapGrid;
