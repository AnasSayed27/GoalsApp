/**
 * AddTacticModal — Modal for adding a tactic with optional numeric target.
 *
 * Extracted from detail.js lines 638-675.
 * Uses AppModal as the shell.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import AppModal from '../common/AppModal';

/**
 * @param {Object}   props
 * @param {boolean}  props.visible
 * @param {Function} props.onClose
 * @param {Function} props.onSave - (targetValue, unit) => void
 */
const AddTacticModal = ({ visible, onClose, onSave }) => {
    const [draftTarget, setDraftTarget] = useState('');
    const [draftUnit, setDraftUnit] = useState('');

    const handleSave = () => {
        onSave(draftTarget.trim(), draftUnit.trim());
        setDraftTarget('');
        setDraftUnit('');
    };

    const handleClose = () => {
        setDraftTarget('');
        setDraftUnit('');
        onClose();
    };

    return (
        <AppModal
            visible={visible}
            onClose={handleClose}
            title="Set Tactic Target (Optional)"
            subtitle="If you just want a checkbox, leave these blank."
            actions={[
                { label: 'Cancel', onPress: handleClose },
                { label: 'Save', onPress: handleSave, primary: true },
            ]}
        >
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Numeric Target</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 70"
                    value={draftTarget}
                    onChangeText={setDraftTarget}
                    keyboardType="numeric"
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Unit (optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. calls, hours"
                    value={draftUnit}
                    onChangeText={setDraftUnit}
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
});

export default AddTacticModal;
