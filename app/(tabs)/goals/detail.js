import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import * as Progress from 'react-native-progress';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useLocalSearchParams, useRouter, Stack } from 'expo-router';

// Architecture imports
import { useGoals } from '../../../hooks/useGoals';
import { Colors } from '../../../constants/Colors';
import { calculateGoalProgress } from '../../../utils/progressCalculator';
import { formatDateShort, getTodayString } from '../../../utils/dateHelpers';
import { getSortedWeeks } from '../../../utils/weekBuilder';
import { convertGoalToSubgoal, calculateConsumedWeeks } from '../../../utils/goalConverter';
import { ensureGoalWeeks, deleteSubGoal, saveAllGoals } from '../../../services/GoalService';
import { createTactic, copyTacticFresh } from '../../../models/Goal';

// Components
import WeekCard from '../../../components/goals/WeekCard';
import AddTacticModal from '../../../components/goals/AddTacticModal';
import LogProgressModal from '../../../components/goals/LogProgressModal';
import AppModal from '../../../components/common/AppModal';

import { ErrorBoundary } from '../../../components/common/ErrorBoundary';

/**
 * Deep-clones a goal object to prevent mutation of nested weeks/tasks.
 * JSON round-trip is safe here since goals only contain serializable data.
 */
const deepCloneGoal = (goal) => JSON.parse(JSON.stringify(goal));

const GoalDetailScreen = () => {
  const params = useLocalSearchParams();
  const goalId = params.goalId || params.id;
  const router = useRouter();
  const { goals, updateGoal, getGoalById } = useGoals();

  const [goal, setGoal] = useState(null);
  const [newTaskTexts, setNewTaskTexts] = useState({});
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [addModalWeekKey, setAddModalWeekKey] = useState(null);

  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [updateModalWeekKey, setUpdateModalWeekKey] = useState(null);
  const [updateModalTask, setUpdateModalTask] = useState(null);

  const [isConvertModalVisible, setIsConvertModalVisible] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState(null);

  // ─── Load goal ───
  useFocusEffect(
    useCallback(() => {
      if (!goalId) {
        if (router.canGoBack()) router.back();
        return;
      }

      const currentGoal = getGoalById(String(goalId));

      if (currentGoal) {
        const { goal: normalized, needsUpdate } = ensureGoalWeeks(currentGoal);
        if (needsUpdate) updateGoal(normalized);
        setGoal(normalized);
        setLoading(false);
      } else if (goals.length > 0) {
        Alert.alert('Error', 'Goal not found.');
        if (router.canGoBack()) router.back();
        else router.replace('/goals');
      }
    }, [goalId, goals, getGoalById, updateGoal, router])
  );

  // ─── Helper: safe update ───
  const safeUpdateGoal = async (updatedGoal) => {
    setGoal(updatedGoal);
    await updateGoal(updatedGoal);
  };

  // ─── Tactic CRUD ───
  const triggerAddModal = (weekKey) => {
    const textToAdd = newTaskTexts[weekKey]?.trim();
    if (!textToAdd) {
      Alert.alert('Input Needed', 'Please enter a tactic description first.');
      return;
    }
    setAddModalWeekKey(weekKey);
    setIsAddModalVisible(true);
  };

  const confirmAddTask = async (targetValueStr, unitStr) => {
    const weekKey = addModalWeekKey;
    const textToAdd = newTaskTexts[weekKey]?.trim();
    if (!textToAdd) return;

    try {
      const parsedTarget = targetValueStr && !isNaN(Number(targetValueStr)) ? Number(targetValueStr) : null;
      const newTask = createTactic({
        text: textToAdd,
        targetValue: parsedTarget,
        unit: unitStr || '',
      });

      const updatedGoal = deepCloneGoal(goal);
      if (!updatedGoal.weeks[weekKey]) {
        Alert.alert('Error', 'Week not found.');
        return;
      }
      if (!updatedGoal.weeks[weekKey].tasks) updatedGoal.weeks[weekKey].tasks = [];
      updatedGoal.weeks[weekKey].tasks.push(newTask);

      await safeUpdateGoal(updatedGoal);
      setNewTaskTexts(prev => ({ ...prev, [weekKey]: '' }));
      setIsAddModalVisible(false);
      Keyboard.dismiss();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const triggerUpdateModal = (weekKey, task) => {
    setUpdateModalWeekKey(weekKey);
    setUpdateModalTask(task);
    setIsUpdateModalVisible(true);
  };

  const confirmUpdateProgress = async (newProgress) => {
    if (!updateModalTask || !updateModalWeekKey) return;

    let clamped = Math.max(0, Math.min(newProgress, updateModalTask.targetValue));

    const updatedGoal = deepCloneGoal(goal);
    const weekTasks = updatedGoal.weeks?.[updateModalWeekKey]?.tasks;
    if (!weekTasks) return;

    const taskIndex = weekTasks.findIndex(t => t.id === updateModalTask.id);
    if (taskIndex === -1) return;

    const oldProgress = weekTasks[taskIndex].currentProgress || 0;
    const diff = clamped - oldProgress;
    const todayStr = getTodayString();

    if (!weekTasks[taskIndex].dailyLogs) weekTasks[taskIndex].dailyLogs = {};
    weekTasks[taskIndex].dailyLogs[todayStr] = Math.max(0, (weekTasks[taskIndex].dailyLogs[todayStr] || 0) + diff);
    weekTasks[taskIndex].currentProgress = clamped;
    weekTasks[taskIndex].completed = clamped >= updateModalTask.targetValue;
    if (weekTasks[taskIndex].completed) {
      weekTasks[taskIndex].completionDate = todayStr;
    }

    await safeUpdateGoal(updatedGoal);
    setIsUpdateModalVisible(false);
  };

  const handleCopyToNextWeek = async () => {
    if (!updateModalTask || !updateModalWeekKey) return;

    const currentWeekIndex = parseInt(updateModalWeekKey.split('_')[1]);
    const nextWeekKey = `week_${currentWeekIndex + 1}`;
    const updatedGoal = deepCloneGoal(goal);

    if (!updatedGoal.weeks[nextWeekKey]) {
      Alert.alert('Notice', 'This is the final week. Cannot copy to next week.');
      return;
    }

    const newTask = copyTacticFresh(updateModalTask);
    if (!updatedGoal.weeks[nextWeekKey].tasks) updatedGoal.weeks[nextWeekKey].tasks = [];
    updatedGoal.weeks[nextWeekKey].tasks.push(newTask);

    await safeUpdateGoal(updatedGoal);
    Alert.alert('Success', 'Tactic copied to the next week!');
    setIsUpdateModalVisible(false);
  };

  const handleReorderTask = async (weekKey, taskIndex, direction) => {
    const updatedGoal = deepCloneGoal(goal);
    const weekTasks = updatedGoal.weeks?.[weekKey]?.tasks;
    if (!weekTasks) return;

    if (direction === 'up' && taskIndex > 0) {
      [weekTasks[taskIndex], weekTasks[taskIndex - 1]] = [weekTasks[taskIndex - 1], weekTasks[taskIndex]];
    } else if (direction === 'down' && taskIndex < weekTasks.length - 1) {
      [weekTasks[taskIndex], weekTasks[taskIndex + 1]] = [weekTasks[taskIndex + 1], weekTasks[taskIndex]];
    } else {
      return;
    }

    await safeUpdateGoal(updatedGoal);
  };

  const handleDeleteTask = useCallback((weekKey, taskId) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const updatedGoal = deepCloneGoal(goal);
          if (updatedGoal.weeks?.[weekKey]?.tasks) {
            updatedGoal.weeks[weekKey].tasks = updatedGoal.weeks[weekKey].tasks.filter(t => t.id !== taskId);
            await safeUpdateGoal(updatedGoal);
          }
        }
      }
    ]);
  }, [goal, updateGoal]);

  const handleToggleTask = async (weekKey, taskId) => {
    const updatedGoal = deepCloneGoal(goal);
    const weekTasks = updatedGoal.weeks?.[weekKey]?.tasks;
    if (!weekTasks) return;

    const taskIndex = weekTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    weekTasks[taskIndex].completed = !weekTasks[taskIndex].completed;
    const todayStr = getTodayString();
    weekTasks[taskIndex].completionDate = weekTasks[taskIndex].completed ? todayStr : null;

    await safeUpdateGoal(updatedGoal);
  };

  // ─── Convert & Subgoal ───
  const handleConvertGoal = () => {
    const parentGoal = goals.find(g => g.id === selectedParentId);
    if (!parentGoal) return;
    const consumedWeeks = calculateConsumedWeeks(goal.startDate, goal.endDate);

    Alert.alert(
      'Confirm Conversion',
      `This will consume approximately ${consumedWeeks} weeks from "${parentGoal.name}". Proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed', onPress: async () => {
            const result = convertGoalToSubgoal(goals, goal.id, selectedParentId);
            if (result.success) {
              await saveAllGoals(result.updatedGoals);
              setIsConvertModalVisible(false);
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/goals');
              }
            } else {
              Alert.alert('Error', result.error || 'Could not convert.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteSubGoal = useCallback((subId) => {
    Alert.alert('Delete Sub-goal', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const updated = deleteSubGoal(goal, subId);
          await safeUpdateGoal(updated);
        }
      }
    ]);
  }, [goal, updateGoal]);

  // ─── Render ───
  if (loading || !goal) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <Text>Loading Goal...</Text>
      </View>
    );
  }

  const overallProgress = calculateGoalProgress(goal);
  const sortedWeeks = getSortedWeeks(goal.weeks || {});

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: goal.name }} />
      <ScrollView keyboardShouldPersistTaps="handled">
        {/* HEADER CARD */}
        <View style={styles.headerCard}>
          <Text style={styles.headerGoalName}>{goal.name}</Text>
          <Text style={styles.headerGoalDates}>
            {formatDateShort(goal.startDate)} - {formatDateShort(goal.endDate)}
          </Text>
          <View style={styles.headerProgressBarRow}>
            <Progress.Bar
              progress={overallProgress}
              width={null}
              color={Colors.palette.success}
              unfilledColor="#e0e0e0"
              borderWidth={0}
              height={16}
              borderRadius={8}
              style={{ flex: 1 }}
              animated={true}
            />
            <View style={styles.headerProgressPercentContainer}>
              <Text style={styles.headerProgressPercentText}>{Math.round(overallProgress * 100)}%</Text>
              <MaterialCommunityIcons name="trophy" size={22} color={Colors.palette.warning} />
            </View>
          </View>
        </View>

        {/* SUB-GOALS SECTION */}
        <View style={styles.subgoalSection}>
          <View style={styles.subgoalHeaderRow}>
            <Text style={styles.subgoalHeading}>Sub-goals</Text>
            <TouchableOpacity onPress={() => router.push({ pathname: '/goals/addSub', params: { goalId: goal.id } })}>
              <MaterialCommunityIcons name="plus-circle" size={24} color={Colors.palette.primary} />
            </TouchableOpacity>
          </View>
          {(goal.subgoals || []).length === 0 && <Text style={styles.noSubgoalsText}>No sub-goals yet.</Text>}
          {(goal.subgoals || []).map((sg) => {
            const sgProgress = calculateGoalProgress(sg);
            return (
              <TouchableOpacity key={sg.id} style={styles.subgoalCard}
                onPress={() => router.push({ pathname: '/goals/subdetail', params: { goalId: goal.id, subGoalId: sg.id } })}
                onLongPress={() => handleDeleteSubGoal(sg.id)}>
                <Text style={styles.subgoalName}>{sg.name}</Text>
                <Text style={styles.subgoalDates}>{formatDateShort(sg.startDate)} - {formatDateShort(sg.endDate)}</Text>
                <Progress.Bar progress={sgProgress} width={null} color={Colors.palette.success} unfilledColor="#e0e0e0" borderWidth={0} height={8} borderRadius={4} style={{ marginTop: 6 }} />
                <Text style={styles.subgoalPercent}>{Math.round(sgProgress * 100)}%</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* WEEKLY SECTIONS */}
        {sortedWeeks.map(([weekKey, weekData]) => (
          <WeekCard
            key={weekKey}
            weekKey={weekKey}
            weekData={weekData}
            inputValue={newTaskTexts[weekKey] || ''}
            onInputChange={(text) => setNewTaskTexts(prev => ({ ...prev, [weekKey]: text }))}
            onAddTactic={triggerAddModal}
            onToggleTactic={handleToggleTask}
            onUpdateTactic={triggerUpdateModal}
            onDeleteTactic={handleDeleteTask}
            onReorderTactic={handleReorderTask}
          />
        ))}

        <TouchableOpacity style={styles.convertBtn} onPress={() => setIsConvertModalVisible(true)}>
          <Text style={styles.convertBtnText}>Convert to Subgoal</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ADD TACTIC MODAL */}
      <AddTacticModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSave={confirmAddTask}
      />

      {/* LOG PROGRESS MODAL */}
      <LogProgressModal
        visible={isUpdateModalVisible}
        onClose={() => setIsUpdateModalVisible(false)}
        tactic={updateModalTask}
        onUpdate={confirmUpdateProgress}
        onCopyToNext={handleCopyToNextWeek}
      />

      {/* CONVERT TO SUBGOAL MODAL */}
      <AppModal
        visible={isConvertModalVisible}
        onClose={() => setIsConvertModalVisible(false)}
        title="Convert to Subgoal"
        subtitle="Select the parent goal:"
        actions={[
          { label: 'Cancel', onPress: () => setIsConvertModalVisible(false) },
          { label: 'Convert', onPress: handleConvertGoal, primary: true, disabled: !selectedParentId },
        ]}
      >
        <ScrollView style={{ maxHeight: 200, marginBottom: 16 }}>
          {goals.filter(g => g.id !== goalId).map(g => (
            <TouchableOpacity
              key={g.id}
              style={[styles.parentGoalOption, selectedParentId === g.id && styles.parentGoalOptionSelected]}
              onPress={() => setSelectedParentId(g.id)}
            >
              <Text style={[styles.parentGoalOptionText, selectedParentId === g.id && styles.parentGoalOptionTextSelected]}>{g.name}</Text>
            </TouchableOpacity>
          ))}
          {goals.filter(g => g.id !== goalId).length === 0 && (
            <Text style={{ color: '#888', fontStyle: 'italic' }}>No other active goals found.</Text>
          )}
        </ScrollView>
      </AppModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.palette.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.palette.background },
  headerCard: { backgroundColor: '#fff', borderRadius: 14, padding: 18, margin: 18, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  headerGoalName: { fontSize: 26, fontWeight: 'bold', color: '#222', marginBottom: 4 },
  headerGoalDates: { fontSize: 14, color: '#888', marginBottom: 10 },
  headerProgressBarRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  headerProgressPercentContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  headerProgressPercentText: { fontSize: 16, fontWeight: 'bold', color: '#333', marginRight: 4 },
  subgoalSection: { marginHorizontal: 18, marginBottom: 10 },
  subgoalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  subgoalHeading: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  noSubgoalsText: { color: '#888', fontStyle: 'italic', marginBottom: 8 },
  subgoalCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  subgoalName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 2 },
  subgoalDates: { fontSize: 12, color: '#888' },
  subgoalPercent: { fontSize: 12, color: '#888', textAlign: 'right', marginTop: 4 },
  convertBtn: { backgroundColor: '#fff', borderColor: Colors.palette.primary, borderWidth: 1.5, borderRadius: 10, paddingVertical: 14, marginHorizontal: 18, marginTop: 8, alignItems: 'center' },
  convertBtnText: { color: Colors.palette.primary, fontSize: 16, fontWeight: 'bold' },
  parentGoalOption: { padding: 12, borderRadius: 8, backgroundColor: '#f8f9fa', marginBottom: 8 },
  parentGoalOptionSelected: { backgroundColor: Colors.palette.primary },
  parentGoalOptionText: { fontSize: 15, color: '#333' },
  parentGoalOptionTextSelected: { color: '#fff', fontWeight: 'bold' },
});

const GoalDetailScreenWithBoundary = (props) => (
  <ErrorBoundary>
    <GoalDetailScreen {...props} />
  </ErrorBoundary>
);

export default GoalDetailScreenWithBoundary;