import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TIERS } from '../../constants/Config';

/**
 * TierCard — Displays current discipline tier with tap-to-expand rules modal.
 * Extracted from StreakComponents.js (lines 35-141).
 */
const TierCard = ({ levelInfo }) => {
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
                    <View style={[styles.progressBarFill, { width: `${Math.min(Math.max(levelInfo.score, 5), 100)}%`, backgroundColor: levelInfo.color }]} />
                </View>

                <View style={styles.levelFooter}>
                    <Text style={styles.nextRankText}>Tap for tier rules & details</Text>
                    <Ionicons name="chevron-forward" size={14} color="#3498db" />
                </View>
            </TouchableOpacity>

            <Modal animationType="fade" transparent={true} visible={infoVisible} onRequestClose={() => setInfoVisible(false)}>
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
                                {TIERS.map((tier, idx) => (
                                    <View key={idx} style={styles.tierRow}>
                                        <Text style={styles.tierName}>{tier.icon} {tier.title}</Text>
                                        <Text style={styles.tierPoints}>{tier.min}+ pts</Text>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    levelCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginVertical: 16, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, borderWidth: 1, borderColor: '#f0f0f0' },
    levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    rankContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 30 },
    rankIcon: { fontSize: 36, marginRight: 12 },
    rankTitle: { fontSize: 20, fontWeight: '800', color: '#2c3e50', letterSpacing: -0.5, flexShrink: 1 },
    rankSubtitle: { fontSize: 12, color: '#95a5a6', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    xpContainer: { alignItems: 'flex-end', minWidth: 80, marginTop: 2 },
    xpText: { fontSize: 20, fontWeight: '800' },
    xpLabel: { fontSize: 11, color: '#95a5a6', fontWeight: '600' },
    progressBarContainer: { height: 10, backgroundColor: '#f0f2f5', borderRadius: 5, overflow: 'hidden', marginBottom: 12 },
    progressBarFill: { height: '100%', borderRadius: 5 },
    levelFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    nextRankText: { fontSize: 12, color: '#3498db', fontWeight: '600' },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 22, fontWeight: '800', color: '#2c3e50' },
    modalSubtitle: { fontSize: 14, color: '#7f8c8d', marginBottom: 20 },
    ruleContainer: { flexDirection: 'column', marginBottom: 16 },
    ruleBox: { width: '100%', backgroundColor: '#f8f9fa', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 12 },
    ruleHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    ruleTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50' },
    rulePoints: { fontSize: 12, color: '#e67e22', fontWeight: '700', backgroundColor: '#fff3e0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
    ruleText: { fontSize: 13, color: '#95a5a6', marginBottom: 12, lineHeight: 18 },
    ruleStatBox: { flexDirection: 'row', alignItems: 'baseline', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#eee' },
    ruleStatLabel: { fontSize: 12, color: '#bdc3c7', fontWeight: '600', textTransform: 'uppercase', marginRight: 8 },
    ruleStatValue: { fontSize: 18, fontWeight: '700', color: '#2c3e50', marginRight: 6 },
    ruleStatSub: { fontSize: 12, color: '#7f8c8d' },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 16 },
    tierListTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50', marginBottom: 12 },
    tierListContainer: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 12 },
    tierRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
    tierName: { fontSize: 14, fontWeight: '600', color: '#34495e' },
    tierPoints: { fontSize: 14, fontWeight: '700', color: '#7f8c8d' },
});

export default TierCard;
