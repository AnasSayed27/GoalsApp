import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { Ionicons, MaterialIcons, Entypo } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import { Colors } from '../constants/Colors';

// --- Constants ---
const DURATIONS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];

// --- Components ---

export const ProgressSection = ({ completedDuration, totalDuration, progress }) => (
    <View style={styles.progressSection}>
        <Text style={styles.progressLabel}>Today's Progress</Text>
        <Progress.Bar
            progress={progress}
            width={null}
            height={12}
            color={Colors.palette.primary}
            unfilledColor="#e0e0e0"
            borderWidth={0}
            borderRadius={6}
            style={styles.progressBar}
        />
        <Text style={styles.progressText}>
            {completedDuration} / {totalDuration} hours ({Math.round(progress * 100)}%)
        </Text>
    </View>
);

export const TaskInput = ({ name, setName, duration, setDuration, onAdd }) => {
    const [showPicker, setShowPicker] = React.useState(false);

    return (
        <View>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.inputName}
                    placeholder="Task name"
                    value={name}
                    onChangeText={setName}
                />
                <TouchableOpacity
                    style={styles.durationButton}
                    onPress={() => setShowPicker(!showPicker)}
                >
                    <Text style={styles.durationButtonText}>{duration} hr{duration > 1 ? 's' : ''}</Text>
                    <MaterialIcons name="arrow-drop-down" size={24} color="#555" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButton} onPress={onAdd}>
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {showPicker && (
                <View style={styles.durationPickerContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.durationPicker}
                    >
                        {DURATIONS.map((value) => (
                            <TouchableOpacity
                                key={value}
                                style={[styles.durationOption, duration === value && styles.durationOptionSelected]}
                                onPress={() => {
                                    setDuration(value);
                                    setShowPicker(false);
                                }}
                            >
                                <Text
                                    style={[styles.durationOptionText, duration === value && styles.durationOptionTextSelected]}
                                >
                                    {value} hr{value > 1 ? 's' : ''}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

export const TaskItem = ({ item, onToggle, onMenuPress }) => (
    <View style={styles.taskItem}>
        <TouchableOpacity
            style={styles.checkbox}
            onPress={() => onToggle(item.id)}
        >
            <Ionicons
                name={item.completed ? 'checkbox' : 'square-outline'}
                size={24}
                color={item.completed ? Colors.palette.success : '#555'}
            />
        </TouchableOpacity>
        <View style={styles.taskInfo}>
            <Text style={[styles.taskName, item.completed && styles.completedText]}>
                {item.name}
            </Text>
            <Text style={styles.taskDuration}>{item.duration} hr{item.duration > 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
            style={styles.menuButton}
            onPress={() => onMenuPress(item.id)}
        >
            <Entypo name="dots-three-vertical" size={20} color="#555" />
        </TouchableOpacity>
    </View>
);

export const TaskMenuModal = ({ visible, onClose, onMoveUp, onMoveDown, onEdit, onDelete }) => (
    <Modal
        transparent={true}
        visible={visible}
        animationType="fade"
        onRequestClose={onClose}
    >
        <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={onClose}
        >
            <View style={styles.menuContainer}>
                <TouchableOpacity style={styles.menuItem} onPress={onMoveUp}>
                    <Ionicons name="arrow-up" size={20} color="#444" />
                    <Text style={styles.menuItemText}>Move Up</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={onMoveDown}>
                    <Ionicons name="arrow-down" size={20} color="#444" />
                    <Text style={styles.menuItemText}>Move Down</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={onEdit}>
                    <Ionicons name="pencil" size={20} color="#444" />
                    <Text style={styles.menuItemText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.menuItem, styles.deleteMenuItem]} onPress={onDelete}>
                    <Ionicons name="trash-outline" size={20} color={Colors.palette.danger} />
                    <Text style={styles.deleteMenuItemText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    </Modal>
);

export const EditTaskModal = ({ visible, onClose, onSave, initialName, initialDuration }) => {
    const [name, setName] = React.useState(initialName);
    const [duration, setDuration] = React.useState(initialDuration);
    const [showPicker, setShowPicker] = React.useState(false);

    // Update local state when props change (modal opens)
    React.useEffect(() => {
        if (visible) {
            setName(initialName);
            setDuration(initialDuration);
        }
    }, [visible, initialName, initialDuration]);

    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.editModalOverlay}>
                <View style={styles.editModalContent}>
                    <Text style={styles.editModalTitle}>Edit Task</Text>

                    <TextInput
                        style={styles.editInput}
                        placeholder="Task name"
                        value={name}
                        onChangeText={setName}
                        autoFocus
                    />

                    <TouchableOpacity
                        style={styles.editDurationButton}
                        onPress={() => setShowPicker(!showPicker)}
                    >
                        <Text style={styles.durationButtonText}>
                            {duration} hr{duration > 1 ? 's' : ''}
                        </Text>
                        <MaterialIcons name="arrow-drop-down" size={24} color="#555" />
                    </TouchableOpacity>

                    {showPicker && (
                        <View style={styles.editDurationPickerContainer}>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.durationPicker}
                            >
                                {DURATIONS.map((value) => (
                                    <TouchableOpacity
                                        key={value}
                                        style={[styles.durationOption, duration === value && styles.durationOptionSelected]}
                                        onPress={() => {
                                            setDuration(value);
                                            setShowPicker(false);
                                        }}
                                    >
                                        <Text
                                            style={[styles.durationOptionText, duration === value && styles.durationOptionTextSelected]}
                                        >
                                            {value} hr{value > 1 ? 's' : ''}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    <View style={styles.editModalButtons}>
                        <TouchableOpacity
                            style={[styles.editModalButton, styles.cancelEditButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelEditButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.editModalButton, styles.saveEditButton]}
                            onPress={() => onSave(name, duration)}
                        >
                            <Text style={styles.saveEditButtonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    // Progress
    progressSection: { marginBottom: 20, backgroundColor: '#fff', padding: 16, borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    progressLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' },
    progressBar: { marginBottom: 8 },
    progressText: { textAlign: 'right', fontSize: 14, color: '#666' },

    // Input
    inputContainer: { flexDirection: 'row', marginBottom: 16, alignItems: 'center' },
    inputName: { flex: 2, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginRight: 8, backgroundColor: '#fff', fontSize: 16 },
    durationButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginRight: 8, width: 100 },
    durationButtonText: { flex: 1, fontSize: 16, color: '#333' },
    addButton: { backgroundColor: Colors.palette.primary, padding: 12, borderRadius: 8, elevation: 2 },

    // Duration Picker
    durationPickerContainer: { marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#eee' },
    durationPicker: { paddingVertical: 8 },
    durationOption: { paddingHorizontal: 16, paddingVertical: 10, marginHorizontal: 4, borderRadius: 20, backgroundColor: '#f0f0f0' },
    durationOptionSelected: { backgroundColor: Colors.palette.primary },
    durationOptionText: { fontSize: 15, color: '#333' },
    durationOptionTextSelected: { color: 'white', fontWeight: '600' },

    // Task Item
    taskItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
    checkbox: { padding: 4 },
    taskInfo: { flex: 1, marginLeft: 12 },
    taskName: { fontSize: 16, color: '#333', marginBottom: 4 },
    taskDuration: { fontSize: 14, color: '#666' },
    completedText: { textDecorationLine: 'line-through', color: '#999' },
    menuButton: { padding: 8 },

    // Menu Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    menuContainer: { width: '70%', backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8 },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    menuItemText: { fontSize: 16, color: '#444', marginLeft: 16 },
    deleteMenuItem: { borderBottomWidth: 0 },
    deleteMenuItemText: { fontSize: 16, color: Colors.palette.danger, marginLeft: 16 },

    // Edit Modal
    editModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    editModalContent: { width: '85%', backgroundColor: 'white', borderRadius: 12, padding: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8 },
    editModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
    editInput: { width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: '#fff', fontSize: 16 },
    editDurationButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16 },
    editDurationPickerContainer: { marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#eee' },
    editModalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    editModalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    cancelEditButton: { backgroundColor: '#f0f0f0', marginRight: 8 },
    saveEditButton: { backgroundColor: Colors.palette.primary, marginLeft: 8 },
    cancelEditButtonText: { fontSize: 16, color: '#555', fontWeight: '500' },
    saveEditButtonText: { fontSize: 16, color: 'white', fontWeight: '500' }
});
