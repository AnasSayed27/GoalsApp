/**
 * LogProgressModal — Modal for logging progress on a target-based tactic.
 *
 * Extracted from detail.js lines 677-712.
 * Includes the "Copy to Next Week" button in the header.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AppModal from '../common/AppModal';

/**
 * @param {Object}   props
 * @param {boolean}  props.visible
 * @param {Function} props.onClose
 * @param {Object}   props.tactic - The tactic being updated
 * @param {Function} props.onUpdate - (newProgressValue) => void
 * @param {Function} props.onCopyToNext - () => void
 */
const LogProgressModal = ({ visible, onClose, tactic, onUpdate, onCopyToNext }) => {
    const [draftProgress, setDraftProgress] = useState('');

    // Sync when tactic changes
    useEffect(() => {
        if (tactic) {
            setDraftProgress((tactic.currentProgress || 0).toString());
        }
    }, [tactic]);

    const handleUpdate = () => {
        const newVal = draftProgress.trim();
        if (!newVal || isNaN(Number(newVal))) {
            Alert.alert('Invalid Input', 'Please enter a valid number.');
            return;
        }
        onUpdate(Number(newVal));
    };

    const copyButton = (
        <TouchableOpacity
            onPress={onCopyToNext}
            style={styles.copyBtn}
        >
            <MaterialCommunityIcons
                name="content-copy"
                size={16}
                color="#3498db"
                style={{ marginRight: 4 }}
            />
            <Text style={styles.copyBtnText}>Copy Next</Text>
        </TouchableOpacity>
    );

    return (
        <AppModal
            visible={visible}
            onClose={onClose}
            title="Log Progress"
            subtitle={tactic?.text}
            headerRight={copyButton}
            actions={[
                { label: 'Cancel', onPress: onClose },
                { label: 'Update', onPress: handleUpdate, primary: true },
            ]}
        >
            <View style={styles.inputGroup}>
                <Text style={styles.label}>
                    Current Progress (out of {tactic?.targetValue} {tactic?.unit})
                </Text>
                <TextInput
                    style={styles.input}
                    value={draftProgress}
                    onChangeText={setDraftProgress}
                    keyboardType="numeric"
                />
            </View>
        </AppModal>
    );
};

const styles = StyleSheet.create({
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#444',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    copyBtn: {
        backgroundColor: '#e8f4fd',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },
    copyBtnText: {
        color: '#3498db',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default LogProgressModal;
