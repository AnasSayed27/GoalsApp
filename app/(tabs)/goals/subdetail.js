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
import { useFocusEffect, useLocalSearchParams, useRouter, Stack } from 'expo-router';

// Architecture imports
import { StorageService } from '../../../services/StorageService';
import { STORAGE_KEYS } from '../../../constants/StorageKeys';
import * as GoalService from '../../../services/GoalService';
import { calculateGoalProgress } from '../../../utils/progressCalculator';
import { formatDateShort, getTodayString } from '../../../utils/dateHelpers';
import { getSortedWeeks, getWeeksBetweenDates } from '../../../utils/weekBuilder';
import { convertSubgoalToGoal } from '../../../utils/goalConverter';
import { createTactic } from '../../../models/Goal';
import { Colors } from '../../../constants/Colors';

// Components
import WeekCard from '../../../components/goals/WeekCard';
import { ErrorBoundary } from '../../../components/common/ErrorBoundary';

/**
 * Deep-clones a subgoal object to prevent mutation of nested weeks/tasks.
 */
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

const SubGoalDetailScreen = () => {
  const params = useLocalSearchParams();
  const goalId = params.goalId || params.id;
  const subGoalId = params.subGoalId || params.subId;
  const router = useRouter();

  const [subGoal, setSubGoal] = useState(null);
  const [parentGoal, setParentGoal] = useState(null);
  const [newTaskTexts, setNewTaskTexts] = useState({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchData = async () => {
        if (!goalId || !subGoalId) {
          Alert.alert('Error', 'Missing parameters');
          if (router.canGoBack()) router.back();
          else router.replace('/goals');
          return;
        }
        setLoading(true);
        try {
          const goals = await StorageService.get(STORAGE_KEYS.GOALS, []);
          const parent = goals.find(g => String(g.id) === String(goalId));
          if (!parent) throw new Error('Parent goal not found');
          if (!parent.subgoals) parent.subgoals = [];
          const sg = parent.subgoals.find(s => String(s.id) === String(subGoalId));
          if (!sg) throw new Error('Sub-goal not found');

          // Ensure weeks exist
          if (!sg.weeks || Object.keys(sg.weeks).length === 0) {
            sg.weeks = getWeeksBetweenDates(sg.startDate, sg.endDate);
          }
          Object.values(sg.weeks).forEach(w => { if (!w.tasks) w.tasks = []; });

          if (isActive) {
            setParentGoal(parent);
            setSubGoal(deepClone(sg));
          }
        } catch (e) {
          console.error(e);
          Alert.alert('Error', 'Failed to load sub-goal');
          if (router.canGoBack()) router.back();
        } finally {
          if (isActive) setLoading(false);
        }
      };
      fetchData();
      return () => { isActive = false; };
    }, [goalId, subGoalId])
  );

  // ─── Helper: safe update ───
  const safeUpdateSubGoal = useCallback(async (updated) => {
    setSubGoal(updated);
    await GoalService.updateSubGoal(goalId, updated);
  }, [goalId]);

  // ─── Tactic handlers ───
  const handleAddTactic = (weekKey) => {
    const textToAdd = newTaskTexts[weekKey]?.trim();
    if (!textToAdd) {
      Alert.alert('Input Needed', 'Please enter a task description');
      return;
    }
    try {
      const newTask = createTactic({ text: textToAdd });
      const upd = deepClone(subGoal);
      if (!upd.weeks?.[weekKey]) {
        Alert.alert('Error', 'Week not found.');
        return;
      }
      if (!upd.weeks[weekKey].tasks) upd.weeks[weekKey].tasks = [];
      upd.weeks[weekKey].tasks.push(newTask);
      safeUpdateSubGoal(upd);
      setNewTaskTexts(prev => ({ ...prev, [weekKey]: '' }));
      Keyboard.dismiss();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleToggleTask = (weekKey, taskId) => {
    const upd = deepClone(subGoal);
    const weekTasks = upd.weeks?.[weekKey]?.tasks;
    if (!weekTasks) return;

    const idx = weekTasks.findIndex(t => t.id === taskId);
    if (idx === -1) return;

    weekTasks[idx].completed = !weekTasks[idx].completed;
    const todayStr = getTodayString();
    weekTasks[idx].completionDate = weekTasks[idx].completed ? todayStr : null;
    safeUpdateSubGoal(upd);
  };

  const handleDeleteTask = useCallback((weekKey, taskId) => {
    Alert.alert('Delete Task', 'Sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          const upd = deepClone(subGoal);
          if (upd.weeks?.[weekKey]?.tasks) {
            upd.weeks[weekKey].tasks = upd.weeks[weekKey].tasks.filter(t => t.id !== taskId);
            safeUpdateSubGoal(upd);
          }
        }
      }
    ]);
  }, [subGoal, safeUpdateSubGoal]);

  const handleReorderTask = async (weekKey, taskIndex, direction) => {
    const upd = deepClone(subGoal);
    const tasks = upd.weeks?.[weekKey]?.tasks;
    if (!tasks) return;

    if (direction === 'up' && taskIndex > 0) {
      [tasks[taskIndex], tasks[taskIndex - 1]] = [tasks[taskIndex - 1], tasks[taskIndex]];
    } else if (direction === 'down' && taskIndex < tasks.length - 1) {
      [tasks[taskIndex], tasks[taskIndex + 1]] = [tasks[taskIndex + 1], tasks[taskIndex]];
    } else { return; }

    safeUpdateSubGoal(upd);
  };

  // Subdetail doesn't use target-based update modals
  const handleUpdateTactic = () => {};

  // ─── Convert to standalone ───
  const handleConvert = () => {
    if (!parentGoal) return;
    Alert.alert(
      'Convert to Standalone Goal',
      `This will remove this subgoal from "${parentGoal.name}" and restore its timeline to the parent. Proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed', onPress: async () => {
            try {
              const allGoals = await StorageService.get(STORAGE_KEYS.GOALS, []);
              const result = convertSubgoalToGoal(allGoals, goalId, subGoalId);
              if (result.success) {
                await GoalService.saveAllGoals(result.updatedGoals);
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/goals');
                }
              } else {
                Alert.alert('Error', result.error || 'Conversion failed.');
              }
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Could not convert.');
            }
          }
        }
      ]
    );
  };

  if (loading || !subGoal) {
    return <View style={styles.loading}><Text>Loading...</Text></View>;
  }

  const progress = calculateGoalProgress(subGoal);
  const sortedWeeks = getSortedWeeks(subGoal.weeks || {});

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: subGoal.name }} />
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{subGoal.name}</Text>
          <Text style={styles.dates}>
            {formatDateShort(subGoal.startDate)} - {formatDateShort(subGoal.endDate)}
          </Text>
          <Progress.Bar
            progress={progress}
            width={null}
            color={Colors.palette.success}
            unfilledColor="#e0e0e0"
            borderWidth={0}
            height={14}
            borderRadius={8}
            style={{ marginTop: 10 }}
          />
          <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>
        </View>

        {sortedWeeks.map(([weekKey, weekData]) => (
          <WeekCard
            key={weekKey}
            weekKey={weekKey}
            weekData={weekData}
            inputValue={newTaskTexts[weekKey] || ''}
            onInputChange={(text) => setNewTaskTexts(prev => ({ ...prev, [weekKey]: text }))}
            onAddTactic={handleAddTactic}
            onToggleTactic={handleToggleTask}
            onUpdateTactic={handleUpdateTactic}
            onDeleteTactic={handleDeleteTask}
            onReorderTactic={handleReorderTask}
          />
        ))}

        <TouchableOpacity style={styles.convertBtn} onPress={handleConvert}>
          <Text style={styles.convertBtnText}>Convert to Standalone Goal</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8fa' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: '#fff', borderRadius: 18, padding: 22, margin: 18, alignItems: 'center', elevation: 3 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50' },
  dates: { fontSize: 14, color: '#666', marginTop: 4 },
  percent: { marginTop: 8, fontSize: 16, fontWeight: 'bold', color: Colors.palette.success },
  convertBtn: { backgroundColor: '#34495e', padding: 15, borderRadius: 10, marginHorizontal: 18, alignItems: 'center', marginTop: 10 },
  convertBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

const SubGoalDetailScreenWithBoundary = (props) => (
  <ErrorBoundary>
    <SubGoalDetailScreen {...props} />
  </ErrorBoundary>
);

export default SubGoalDetailScreenWithBoundary;
