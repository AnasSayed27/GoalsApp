import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal } from 'react-native';

/**
 * LogHoursModal — Grid of hour buttons for logging activity hours.
 * Extracted from StreakComponents.js (lines 332-380).
 */
const LogHoursModal = ({ visible, onClose, onSave, dateStr, currentHours }) => {
    const hourOptions = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8];

    return (
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
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
                                style={[styles.hourOption, item === currentHours && styles.selectedHourOption]}
                                onPress={() => onSave(item)}
                            >
                                <Text style={[styles.hourOptionText, item === currentHours && styles.selectedHourOptionText]}>
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

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6, maxHeight: '80%' },
    modalTitle: { fontSize: 22, fontWeight: '800', color: '#2c3e50' },
    modalSubtitle: { fontSize: 14, color: '#7f8c8d', marginBottom: 20 },
    hourOption: { width: '30%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', margin: '1.5%', borderRadius: 12, backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#eee' },
    selectedHourOption: { backgroundColor: '#3498db', borderColor: '#3498db' },
    hourOptionText: { fontSize: 16, fontWeight: '600', color: '#2c3e50' },
    selectedHourOptionText: { color: '#fff' },
    hourListContainer: { paddingVertical: 10 },
    closeButton: { marginTop: 20, paddingVertical: 12, width: '100%', backgroundColor: '#f1f2f6', borderRadius: 12, alignItems: 'center' },
    closeButtonText: { fontSize: 16, fontWeight: '600', color: '#7f8c8d' },
});

export default LogHoursModal;
