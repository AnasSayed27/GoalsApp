import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    Dimensions
} from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import { Colors } from '../constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DURATIONS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];

// --- Progress Section ---
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

// --- Task Input Section ---
export const TaskInput = ({ name, setName, duration, setDuration, onAdd }) => {
    const [showPicker, setShowPicker] = React.useState(false);

    return (
        <View style={styles.inputWrapper}>
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

// --- Task Item Component ---
export const TaskItem = ({ item, onToggle, onDelete, drag, isActive }) => {
    return (
        <TouchableOpacity
            onLongPress={drag}
            onPress={() => onToggle(item.id)}
            delayLongPress={200}
            activeOpacity={0.9}
            style={[
                styles.taskItem,
                isActive && styles.taskItemDragging,
                item.completed && styles.taskItemCompleted
            ]}
        >
            <View style={styles.checkboxContainer}>
                <Ionicons
                    name={item.completed ? "checkbox" : "square-outline"}
                    size={24}
                    color={item.completed ? Colors.palette.success : "#999"}
                />
            </View>
            <View style={styles.taskContent}>
                <Text
                    numberOfLines={1}
                    style={[styles.taskName, item.completed && styles.completedText]}
                >
                    {item.name}
                </Text>
                <Text style={styles.taskDuration}>
                    {item.duration} hr{item.duration > 1 ? 's' : ''}
                </Text>
            </View>

            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => onDelete(item.id)}
            >
                <Ionicons name="trash-outline" size={20} color={Colors.palette.danger} />
            </TouchableOpacity>

            <View style={styles.reorderHandle}>
                <Ionicons name="reorder-two-outline" size={20} color="#ccc" />
            </View>
        </TouchableOpacity>
    );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
    // Utils
    progressSection: { marginBottom: 20, backgroundColor: '#fff', padding: 16, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    progressLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' },
    progressBar: { marginBottom: 8 },
    progressText: { textAlign: 'right', fontSize: 14, color: '#666' },

    // Input Area
    inputWrapper: { marginBottom: 16 },
    inputContainer: { flexDirection: 'row', alignItems: 'center' },
    inputName: { flex: 1, height: 48, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 16, backgroundColor: '#fff', fontSize: 16 },
    durationButton: { flexDirection: 'row', alignItems: 'center', height: 48, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, marginHorizontal: 8, width: 90 },
    durationButtonText: { flex: 1, fontSize: 14, color: '#333' },
    addButton: { backgroundColor: Colors.palette.primary, width: 48, height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center', elevation: 2 },

    // Duration Picker
    durationPickerContainer: { marginTop: 8, backgroundColor: '#fff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#eee' },
    durationPicker: { paddingVertical: 4 },
    durationOption: { paddingHorizontal: 16, paddingVertical: 8, marginHorizontal: 4, borderRadius: 20, backgroundColor: '#f0f0f0' },
    durationOptionSelected: { backgroundColor: Colors.palette.primary },
    durationOptionText: { fontSize: 14, color: '#333' },
    durationOptionTextSelected: { color: 'white', fontWeight: '600' },

    // Task Item
    taskItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 10, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    taskItemDragging: { elevation: 10, shadowOpacity: 0.3, shadowRadius: 10, backgroundColor: '#ecf4ff', transform: [{ scale: 1.02 }] },
    taskItemCompleted: { opacity: 0.8 },
    checkboxContainer: { marginRight: 15 },
    taskContent: { flex: 1 },
    taskName: { fontSize: 16, fontWeight: '500', color: '#333', marginBottom: 2 },
    taskDuration: { fontSize: 13, color: '#888' },
    completedText: { textDecorationLine: 'line-through', color: '#aaa' },

    deleteButton: {
        padding: 8,
        marginLeft: 4,
    },
    reorderHandle: {
        paddingLeft: 8,
    },
});

