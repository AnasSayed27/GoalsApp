import React, { useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Animated, TouchableOpacity } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';

// NEW architecture imports
import { useTasks } from '../../hooks/useTasks';
import { useGoals } from '../../hooks/useGoals';
import { ProgressSection, TaskInput, TaskItem } from '../../components/TaskComponents';
import { Colors } from '../../constants/Colors';
import { CONGRATS_MESSAGES } from '../../constants/Config';
import { buildTodayTactics } from '../../utils/paceCalculator';
import { getTodayString } from '../../utils/dateHelpers';
import TacticsDailyCard from '../../components/dashboard/TacticsDailyCard';

const TasksScreen = () => {
  const { tasks, addTask, toggleComplete, deleteTask, reorderTasks, stats } = useTasks();
  const { goals, updateGoal } = useGoals();

  // UI State
  const [newName, setNewName] = useState('');
  const [newDuration, setNewDuration] = useState(1);
  const [isTacticsExpanded, setIsTacticsExpanded] = useState(true);

  // Animation State
  const [congratsMessage, setCongratsMessage] = useState('');
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Handlers
  const handleAddTask = async () => {
    const success = await addTask(newName, newDuration);
    if (success) setNewName('');
  };

  const handleToggleComplete = async (id) => {
    const isNowCompleted = await toggleComplete(id);
    if (isNowCompleted) triggerCongrats();
  };

  const triggerCongrats = () => {
    setCongratsMessage(CONGRATS_MESSAGES[Math.floor(Math.random() * CONGRATS_MESSAGES.length)]);
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

  const handleDelete = (id) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTask(id) }
    ]);
  };

  const renderItem = ({ item, drag, isActive }) => (
    <TaskItem item={item} onToggle={handleToggleComplete} onDelete={handleDelete} drag={drag} isActive={isActive} />
  );

  // --- Goal Tactics — now using paceCalculator utility ---
  const handleToggleGoalTactic = async (goalId, weekKey, taskId) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const updatedGoal = JSON.parse(JSON.stringify(goal));
    const task = updatedGoal.weeks?.[weekKey]?.tasks?.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      const todayStr = getTodayString();
      task.completionDate = task.completed ? todayStr : null;
      await updateGoal(updatedGoal);
      if (task.completed) triggerCongrats();
    }
  };

  const handleUpdateGoalTacticProgress = async (goalId, weekKey, taskId, amount) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const updatedGoal = JSON.parse(JSON.stringify(goal));
    const task = updatedGoal.weeks?.[weekKey]?.tasks?.find(t => t.id === taskId);
    if (task) {
      const oldProgress = task.currentProgress || 0;
      let newProgress = oldProgress + amount;
      if (newProgress < 0) newProgress = 0;
      if (newProgress >= task.targetValue) {
        newProgress = task.targetValue;
        task.completed = true;
        task.completionDate = getTodayString();
        triggerCongrats();
      } else {
        task.completed = false;
      }
      const diff = newProgress - oldProgress;
      const todayStr = getTodayString();
      if (!task.dailyLogs) task.dailyLogs = {};
      task.dailyLogs[todayStr] = Math.max(0, (task.dailyLogs[todayStr] || 0) + diff);
      task.currentProgress = newProgress;
      await updateGoal(updatedGoal);
    }
  };

  // Use buildTodayTactics from paceCalculator instead of inline 75-line getTacticData()
  const { tactics: todayTactics, stats: tacticStats } = buildTodayTactics(goals);

  const tacticsComponent = useMemo(() => {
    if (todayTactics.length === 0) return null;
    return (
      <View style={styles.tacticsSection}>
        <TouchableOpacity style={styles.sectionHeaderRow} onPress={() => setIsTacticsExpanded(prev => !prev)} activeOpacity={0.7}>
          <Text style={styles.sectionTitle}>12-Week Tactics (Today's Pace)</Text>
          <Ionicons name={isTacticsExpanded ? 'chevron-up' : 'chevron-down'} size={22} color="#666" />
        </TouchableOpacity>

        {isTacticsExpanded && todayTactics.map(tactic => (
          <TacticsDailyCard
            key={tactic.id}
            tactic={tactic}
            onToggle={handleToggleGoalTactic}
            onUpdateProgress={handleUpdateGoalTacticProgress}
          />
        ))}
      </View>
    );
  }, [todayTactics, isTacticsExpanded]);

  const renderHeader = useCallback(() => (
    <>
      {tacticsComponent}
      <Text style={[styles.sectionTitle, { marginTop: isTacticsExpanded ? 16 : 8, marginBottom: 10 }]}>Daily Routines</Text>
    </>
  ), [tacticsComponent, isTacticsExpanded]);

  return (
    <View style={styles.container}>
      {/* Congratulations Animation */}
      <Animated.View style={[
        styles.congratsContainer,
        { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }
      ]}>
        <Text style={styles.congratsText}>{congratsMessage}</Text>
      </Animated.View>

      <Text style={styles.header}>Daily Dashboard</Text>

      <ProgressSection
        completedDuration={tacticStats.completed}
        totalDuration={tacticStats.total}
        progress={tacticStats.progress}
        label="Today's Tactics Progress"
        unit="points"
      />

      <TaskInput
        name={newName}
        setName={setNewName}
        duration={newDuration}
        setDuration={setNewDuration}
        onAdd={handleAddTask}
      />

      <DraggableFlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => reorderTasks(data)}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No tasks yet. Add one!</Text>
          </View>
        }
        style={styles.taskList}
        containerStyle={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingHorizontal: 16, paddingTop: 8 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10 },
  congratsContainer: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#2ecc71', paddingVertical: 10, alignItems: 'center', zIndex: 100, borderRadius: 8, marginHorizontal: 16 },
  congratsText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 8 },
  taskList: { flex: 1, marginTop: 8 },
  // Tactics section
  tacticsSection: { marginBottom: 8 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
});

export default TasksScreen;
