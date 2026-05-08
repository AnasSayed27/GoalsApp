import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HeatmapGrid from './HeatmapGrid';
import { generateQuarters } from './streakHelpers';

/**
 * FullHistoryModal — Full-screen modal with extended heatmap, period filter,
 * lifetime stats, and milestone summary.
 * Extracted from StreakComponents.js (lines 427-671).
 *
 * The heaviest component in the old monolith (~250 lines of JSX + logic).
 */
const FullHistoryModal = ({ visible, onClose, heatmapData, onDayPress }) => {
    const dates = Object.keys(heatmapData).sort();
    const [selectedRange, setSelectedRange] = useState({ label: 'All Time', start: null, end: null });
    const [pickerVisible, setPickerVisible] = useState(false);
    const intervals = generateQuarters(dates[0]);

    // Calculate weeks needed for full history
    let numWeeks = 26;
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

    const milestoneList = [
        { label: 'Elite (6+ hrs)', count: milestoneCounts.elite, color: '#f1c40f', icon: 'flash' },
        { label: 'Workhorse (5+ hrs)', count: milestoneCounts.workhorse, color: '#e67e22', icon: 'construct' },
        { label: 'Solid (4+ hrs)', count: milestoneCounts.solid, color: '#3498db', icon: 'trending-up' },
        { label: 'Active (3+ hrs)', count: milestoneCounts.active, color: '#2ecc71', icon: 'walk' },
        { label: 'Low/Rest (< 3 hrs)', count: milestoneCounts.rest, color: '#95a5a6', icon: 'cafe' },
    ];

    return (
        <Modal animationType="slide" transparent={false} visible={visible} onRequestClose={onClose}>
            <View style={styles.fullHistoryContainer}>
                <View style={styles.fullHistoryHeader}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.fullHistoryTitle}>Full History</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} nestedScrollEnabled={true} removeClippedSubviews={false}>
                    <HeatmapGrid heatmapData={heatmapData} onDayPress={onDayPress} numWeeks={numWeeks} title="All Recorded Activity" />

                    {/* Period selector */}
                    <View style={styles.dropdownContainer}>
                        <TouchableOpacity style={styles.dropdownButton} onPress={() => setPickerVisible(true)}>
                            <View style={styles.dropdownButtonContent}>
                                <Ionicons name="calendar" size={20} color="#3498db" style={{ marginRight: 8 }} />
                                <Text style={styles.dropdownButtonText}>{selectedRange.label}</Text>
                            </View>
                            <Ionicons name="chevron-down" size={18} color="#7f8c8d" />
                        </TouchableOpacity>
                    </View>

                    {/* Lifetime Statistics */}
                    <Text style={styles.sectionTitle}>
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
                            <Text style={styles.lifetimeStatValue}>{totalHours.toFixed(1)}</Text>
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

                    {/* Journey Duration */}
                    <View style={styles.trackingRangeContainer}>
                        <Text style={styles.trackingRangeHeader}>
                            {selectedRange.label === 'All Time' ? 'Journey Duration' : 'Period Duration'}
                        </Text>
                        <Text style={styles.trackingRangeText}>
                            <Text style={styles.trackingRangeValues}>{journeyDuration}</Text> Days
                        </Text>
                        <Text style={styles.trackingRangeSub}>
                            {selectedRange.label === 'All Time'
                                ? `${dates[0] || 'N/A'} — ${dates[dates.length - 1] || 'Today'}`
                                : `${selectedRange.start?.toISOString().split('T')[0]} — ${selectedRange.end?.toISOString().split('T')[0]}`}
                        </Text>
                    </View>

                    {/* Milestone Summary */}
                    <Text style={styles.sectionTitle}>🏆 Milestone Summary</Text>
                    {dates.length === 0 ? (
                        <Text style={styles.noHistoryText}>No records found yet.</Text>
                    ) : (
                        milestoneList.map((m, idx) => (
                            <View key={`milestone-${idx}`} style={styles.historyListItem}>
                                <View style={styles.historyListDateContainer}>
                                    <Ionicons name={m.icon} size={20} color={m.color} style={{ marginRight: 12 }} />
                                    <Text style={styles.milestoneLabel}>{m.label}</Text>
                                </View>
                                <View style={[styles.milestoneBadge, { backgroundColor: m.color }]}>
                                    <Text style={styles.milestoneCount}>{m.count} days</Text>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>

                {/* Period Picker Modal */}
                <Modal visible={pickerVisible} transparent={true} animationType="fade" onRequestClose={() => setPickerVisible(false)}>
                    <TouchableOpacity style={styles.pickerModalOverlay} activeOpacity={1} onPress={() => setPickerVisible(false)}>
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
                                        style={[styles.pickerOption, selectedRange.label === interval.label && styles.pickerOptionSelected]}
                                        onPress={() => { setSelectedRange(interval); setPickerVisible(false); }}
                                    >
                                        <Text style={[styles.pickerOptionText, selectedRange.label === interval.label && styles.pickerOptionTextSelected]}>
                                            {interval.label}
                                        </Text>
                                        {selectedRange.label === interval.label && <Ionicons name="checkmark-circle" size={20} color="#3498db" />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    fullHistoryContainer: { flex: 1, backgroundColor: '#f8f9fa' },
    fullHistoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 15, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    backButton: { padding: 4 },
    fullHistoryTitle: { fontSize: 20, fontWeight: '800', color: '#2c3e50' },
    dropdownContainer: { marginVertical: 15 },
    dropdownButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#e0e0e0', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    dropdownButtonContent: { flexDirection: 'row', alignItems: 'center' },
    dropdownButtonText: { fontSize: 15, fontWeight: '600', color: '#2c3e50' },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#2c3e50', marginTop: 20, marginBottom: 16 },
    noHistoryText: { textAlign: 'center', color: '#95a5a6', marginTop: 20, fontStyle: 'italic' },
    // Stats cards
    lifetimeStatsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    singleStatContainer: { alignItems: 'center', marginBottom: 20 },
    lifetimeStatCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, width: '48%', alignItems: 'center', borderWidth: 1, borderColor: '#f0f0f0', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10 },
    lifetimeStatValue: { fontSize: 26, fontWeight: '800', color: '#2c3e50', marginVertical: 4 },
    lifetimeStatLabel: { fontSize: 12, color: '#bdc3c7', fontWeight: '800', textTransform: 'uppercase' },
    lifetimeStatSub: { fontSize: 10, color: '#95a5a6', marginTop: 2 },
    // Tracking range
    trackingRangeContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#f0f0f0', alignItems: 'center', elevation: 1 },
    trackingRangeHeader: { fontSize: 12, color: '#bdc3c7', fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 },
    trackingRangeText: { fontSize: 18, color: '#7f8c8d', fontWeight: '600' },
    trackingRangeValues: { color: '#2c3e50', fontWeight: '900', fontSize: 22 },
    trackingRangeSub: { fontSize: 13, color: '#95a5a6', marginTop: 4, fontWeight: '500' },
    // Milestone list
    historyListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#f0f0f0' },
    historyListDateContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    milestoneLabel: { fontSize: 15, fontWeight: '600', color: '#2c3e50' },
    milestoneBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, minWidth: 80, alignItems: 'center' },
    milestoneCount: { fontSize: 13, fontWeight: '800', color: '#fff' },
    // Picker modal
    pickerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
    pickerModalContent: { backgroundColor: '#fff', borderRadius: 20, maxHeight: '60%', paddingBottom: 10, overflow: 'hidden' },
    pickerModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    pickerModalTitle: { fontSize: 18, fontWeight: '700', color: '#2c3e50' },
    pickerOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
    pickerOptionSelected: { backgroundColor: '#f0f7ff' },
    pickerOptionText: { fontSize: 16, color: '#7f8c8d', fontWeight: '500' },
    pickerOptionTextSelected: { color: '#3498db', fontWeight: '700' },
});

export default FullHistoryModal;
