import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTasksData } from '../../hooks/useTasksData';
import { ProgressSection, TaskInput, TaskItem, TaskMenuModal, EditTaskModal } from '../../components/TaskComponents';
import { Colors } from '../../constants/Colors';

const TasksScreen = () => {
  const {
    tasks,
    addTask,
    toggleComplete,
    deleteTask,
    editTask,
    reorderTask,
    stats
  } = useTasksData();

  // UI State
  const [newName, setNewName] = useState('');
  const [newDuration, setNewDuration] = useState(1);

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const [editModalVisible, setEditModalVisible] = useState(false);

  // Animation State
  const [congratsMessage, setCongratsMessage] = useState('');
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Handlers
  const handleAddTask = async () => {
    const success = await addTask(newName, newDuration);
    if (success) {
      setNewName('');
      // Keep duration for convenience or reset? Let's keep it.
    }
  };

  const handleToggleComplete = async (id) => {
    const isNowCompleted = await toggleComplete(id);
    if (isNowCompleted) {
      triggerCongrats();
    }
  };

  const triggerCongrats = () => {
    const messages = [
      "Great job! 🎉", "Well done! 💪", "You're on fire! 🔥",
      "Keep it up! ⭐", "Awesome work! 👏"
    ];
    setCongratsMessage(messages[Math.floor(Math.random() * messages.length)]);

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleMenuPress = (id) => {
    setSelectedTaskId(id);
    setMenuVisible(true);
  };

  const handleDelete = () => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTask(selectedTaskId);
          setMenuVisible(false);
        }
      }
    ]);
  };

  const handleEditStart = () => {
    setMenuVisible(false);
    setEditModalVisible(true);
  };

  const handleEditSave = async (name, duration) => {
    const success = await editTask(selectedTaskId, name, duration);
    if (success) {
      setEditModalVisible(false);
    }
  };

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  return (
    <View style={styles.container}>
      {/* Congratulations Animation */}
      <Animated.View style={[
        styles.congratsContainer,
        { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }
      ]}>
        <Text style={styles.congratsText}>{congratsMessage}</Text>
      </Animated.View>

      <Text style={styles.header}>Daily Tasks</Text>

      <ProgressSection
        completedDuration={stats.completedDuration}
        totalDuration={stats.totalDuration}
        progress={stats.progress}
      />

      <TaskInput
        name={newName}
        setName={setNewName}
        duration={newDuration}
        setDuration={setNewDuration}
        onAdd={handleAddTask}
      />

      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TaskItem
            item={item}
            onToggle={handleToggleComplete}
            onMenuPress={handleMenuPress}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No tasks yet. Add one!</Text>
          </View>
        }
        style={styles.taskList}
      />

      <TaskMenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onMoveUp={() => { reorderTask(selectedTaskId, 'up'); setMenuVisible(false); }}
        onMoveDown={() => { reorderTask(selectedTaskId, 'down'); setMenuVisible(false); }}
        onEdit={handleEditStart}
        onDelete={handleDelete}
      />

      <EditTaskModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={handleEditSave}
        initialName={selectedTask?.name || ''}
        initialDuration={selectedTask?.duration || 1}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  taskList: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 8 },
  congratsContainer: { position: 'absolute', top: '10%', left: 0, right: 0, zIndex: 999, alignItems: 'center', justifyContent: 'center' },
  congratsText: { fontSize: 20, fontWeight: 'bold', color: Colors.palette.primary, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, elevation: 4 },
});

export default TasksScreen;
