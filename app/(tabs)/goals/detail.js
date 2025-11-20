import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Keyboard
} from 'react-native';
import * as Progress from 'react-native-progress';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useGoalsData } from '../../../hooks/useGoalsData';
import { Colors } from '../../../constants/Colors';

// Helper to calculate weeks
const getWeeksBetweenDates = (startDateStr, endDateStr) => {
  const weeks = {};
  let currentWeekStart = new Date(startDateStr + 'T00:00:00Z');
  const endDate = new Date(endDateStr + 'T00:00:00Z');
  let weekIndex = 0;

  while (currentWeekStart <= endDate) {
    const weekEndDate = new Date(currentWeekStart);
    weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);
    const actualEndDate = weekEndDate > endDate ? endDate : weekEndDate;
    const weekKey = `week_${weekIndex}`;
    weeks[weekKey] = {
      startDate: currentWeekStart.toISOString().split('T')[0],
      endDate: actualEndDate.toISOString().split('T')[0],
      tasks: []
    };
    weekIndex++;
    currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() + 7);
  }
  return weeks;
};

const GoalDetailScreen = () => {
  const { goalId } = useLocalSearchParams();
  const router = useRouter();
  const { goals, updateGoal, getGoalById } = useGoalsData();

  const [goal, setGoal] = useState(null);
  const [newTaskTexts, setNewTaskTexts] = useState({});
  const [loading, setLoading] = useState(true);

  // Load goal data from the hook
  useFocusEffect(
    useCallback(() => {
      if (!goalId) {
        if (router.canGoBack()) router.back();
        return;
      }

      const currentGoal = getGoalById(goalId);

      if (currentGoal) {
        // Check if we need to initialize weeks or subgoals
        let goalToUpdate = { ...currentGoal };
        let needsUpdate = false;

        if ((!goalToUpdate.weeks || Object.keys(goalToUpdate.weeks).length === 0) && (!goalToUpdate.subgoals || goalToUpdate.subgoals.length === 0)) {
          goalToUpdate.weeks = getWeeksBetweenDates(goalToUpdate.startDate, goalToUpdate.endDate);
          needsUpdate = true;
        } else {
          // Ensure structure exists
          if (goalToUpdate.weeks) {
            Object.keys(goalToUpdate.weeks).forEach(weekKey => {
              if (!goalToUpdate.weeks[weekKey].tasks) {
                goalToUpdate.weeks[weekKey].tasks = [];
                needsUpdate = true;
              }
            });
          }
          if (!goalToUpdate.subgoals) {
            goalToUpdate.subgoals = [];
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          updateGoal(goalToUpdate);
        }

        setGoal(goalToUpdate);
        setLoading(false);
      } else {
        // Goal might not be loaded yet if deep linking, or deleted
        if (goals.length > 0) {
          // If goals are loaded but this one isn't found
          Alert.alert("Error", "Goal not found.");
          if (router.canGoBack()) router.back();
        }
        // If goals are empty, they might still be loading in the hook
      }
    }, [goalId, goals, getGoalById, updateGoal, router])
  );

  // Helper to rebuild parent weeks excluding subgoals
  const rebuildParentWeeks = (goalObj) => {
    if (!goalObj) return {};
    const exclusions = (goalObj.subgoals || []).map((sg) => ({
      start: sg.startDate,
      end: sg.endDate,
    })).sort((a, b) => new Date(a.start) - new Date(b.start));

    const res = {};
    let weekIdx = 0;
    const pushSeg = (s, e) => {
      const weeksSeg = getWeeksBetweenDates(s, e);
      Object.keys(weeksSeg).forEach((wkKey) => {
        res[`week_${weekIdx}`] = weeksSeg[wkKey];
        weekIdx += 1;
      });
    };

    let cur = new Date(goalObj.startDate + 'T00:00:00Z');
    const end = new Date(goalObj.endDate + 'T00:00:00Z');

    exclusions.forEach((ex) => {
      const exStart = new Date(ex.start + 'T00:00:00Z');
      const exEnd = new Date(ex.end + 'T00:00:00Z');
      if (cur <= exStart) {
        const segEnd = new Date(exStart);
        segEnd.setUTCDate(segEnd.getUTCDate() - 1);
        if (cur <= segEnd) pushSeg(cur.toISOString().split('T')[0], segEnd.toISOString().split('T')[0]);
      }
      cur = new Date(exEnd);
      cur.setUTCDate(cur.getUTCDate() + 1);
    });
    if (cur <= end) pushSeg(cur.toISOString().split('T')[0], goalObj.endDate);
    return res;
  };

  // --- Task Management ---
  const handleAddTask = async (weekKey) => {
    const textToAdd = newTaskTexts[weekKey]?.trim();
    if (!textToAdd) {
      Alert.alert("Input Needed", "Please enter a task description.");
      return;
    }
    const updatedGoal = { ...goal };
    const newTask = { id: Date.now().toString(), text: textToAdd, completed: false };

    if (!updatedGoal.weeks[weekKey].tasks) { updatedGoal.weeks[weekKey].tasks = []; }
    updatedGoal.weeks[weekKey].tasks.push(newTask);

    setGoal(updatedGoal); // Optimistic UI update
    await updateGoal(updatedGoal); // Persist

    setNewTaskTexts(prev => ({ ...prev, [weekKey]: '' }));
    Keyboard.dismiss();
  };

  const handleDeleteTask = useCallback((weekKey, taskId) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const updatedGoal = { ...goal };
          updatedGoal.weeks[weekKey].tasks = updatedGoal.weeks[weekKey].tasks.filter(task => task.id !== taskId);
          setGoal(updatedGoal);
          await updateGoal(updatedGoal);
        }
      }
    ]);
  }, [goal, updateGoal]);

  const handleToggleTask = async (weekKey, taskId) => {
    const updatedGoal = { ...goal };
    const weekTasks = updatedGoal.weeks[weekKey].tasks;
    const taskIndex = weekTasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      weekTasks[taskIndex].completed = !weekTasks[taskIndex].completed;
      setGoal(updatedGoal);
      await updateGoal(updatedGoal);
    }
  };

  const handleDeleteSubGoal = useCallback((subId) => {
    Alert.alert('Delete Sub-goal', 'Are you sure you want to delete this sub-goal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const updated = { ...goal };
          updated.subgoals = (updated.subgoals || []).filter((sg) => sg.id !== subId);
          // Recalculate parent weeks
          updated.weeks = updated.subgoals.length > 0 ? rebuildParentWeeks(updated) : getWeeksBetweenDates(updated.startDate, updated.endDate);
          setGoal(updated);
          await updateGoal(updated);
        }
      }
    ]);
  }, [goal, updateGoal]);

  // --- Calculations ---
  const calculateProgress = useCallback((g = goal) => {
    if (!g) return 0;
    let total = 0;
    let completed = 0;
    const traverse = (obj) => {
      if (obj.weeks) {
        Object.values(obj.weeks).forEach(w => {
          if (w.tasks && Array.isArray(w.tasks)) {
            total += w.tasks.length;
            completed += w.tasks.filter(t => t.completed).length;
          }
        });
      }
      if (obj.subgoals && Array.isArray(obj.subgoals)) {
        obj.subgoals.forEach(sg => traverse(sg));
      }
    };
    traverse(g);
    return total > 0 ? completed / total : 0;
  }, [goal]);

  const isWeekComplete = useCallback((weekKey) => {
    if (!goal || !goal.weeks || !goal.weeks[weekKey] || !goal.weeks[weekKey].tasks) return false;
    const tasks = goal.weeks[weekKey].tasks;
    return tasks.length > 0 && tasks.every(task => task.completed);
  }, [goal]);

  if (loading || !goal) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <Text>Loading Goal...</Text>
      </View>
    );
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T00:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: goal.name }} />
      <ScrollView keyboardShouldPersistTaps="handled">
        {/* HEADER CARD */}
        <View style={styles.headerCard}>
          <Text style={styles.headerGoalName}>{goal.name}</Text>
          <Text style={styles.headerGoalDates}>{`${formatDate(goal.startDate)} - ${formatDate(goal.endDate)}`}</Text>
          <View style={styles.headerProgressBarRow}>
            <Progress.Bar
              progress={calculateProgress()}
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
              <Text style={styles.headerProgressPercentText}>{`${Math.round(calculateProgress() * 100)}%`}</Text>
              <MaterialCommunityIcons name="trophy" size={22} color={Colors.palette.warning} style={styles.headerTrophyIcon} />
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
            const sgProgress = calculateProgress(sg);
            return (
              <TouchableOpacity key={sg.id} style={styles.subgoalCard}
                onPress={() => router.push({ pathname: '/goals/subdetail', params: { goalId: goal.id, subGoalId: sg.id } })}
                onLongPress={() => handleDeleteSubGoal(sg.id)}>
                <Text style={styles.subgoalName}>{sg.name}</Text>
                <Text style={styles.subgoalDates}>{`${formatDate(sg.startDate)} - ${formatDate(sg.endDate)}`}</Text>
                <Progress.Bar progress={sgProgress} width={null} color={Colors.palette.success} unfilledColor="#e0e0e0" borderWidth={0} height={8} borderRadius={4} style={{ marginTop: 6 }} />
                <Text style={styles.subgoalPercent}>{`${Math.round(sgProgress * 100)}%`}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Weekly Sections */}
        {Object.entries(goal.weeks || {})
          .sort(([keyA], [keyB]) => parseInt(keyA.split('_')[1]) - parseInt(keyB.split('_')[1]))
          .map(([weekKey, weekData], idx) => {
            const weekProgress = (weekData.tasks && weekData.tasks.length > 0)
              ? weekData.tasks.filter(task => task.completed).length / weekData.tasks.length
              : 0;
            return (
              <View key={weekKey} style={styles.weekCard}>
                <View style={styles.weekCardHeader}>
                  <Text style={styles.weekCardTitle}>
                    Week {parseInt(weekKey.split('_')[1]) + 1}: {formatDate(weekData.startDate)} - {formatDate(weekData.endDate)}
                  </Text>
                  {isWeekComplete(weekKey) && <Text style={styles.weekCardTick}>✓</Text>}
                </View>
                <Progress.Bar
                  progress={weekProgress}
                  width={null}
                  color={weekProgress === 1 ? Colors.palette.success : '#ffa726'}
                  unfilledColor="#e0e0e0"
                  borderWidth={0}
                  height={8}
                  borderRadius={4}
                  style={{ marginTop: 4, marginBottom: 10 }}
                  animated={true}
                />
                {/* Task List */}
                {(weekData.tasks || []).map((task) => (
                  <View key={task.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                      style={[styles.taskItem, task.completed && styles.taskItemCompleted, { flex: 1 }]}
                      onPress={() => handleToggleTask(weekKey, task.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, task.completed && styles.checkboxCompleted]}>
                        {task.completed && <View style={styles.checkboxInner} />}
                      </View>
                      <Text style={[styles.taskText, task.completed && styles.taskTextCompleted]}>
                        {task.text}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteTask(weekKey, task.id)} style={{ marginLeft: 8, padding: 8 }}>
                      <MaterialCommunityIcons name="delete-outline" size={22} color={Colors.palette.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
                {(weekData.tasks || []).length === 0 && (
                  <Text style={styles.noTasksText}>No tasks added for this week yet.</Text>
                )}
                {/* Add Task Input */}
                <View style={styles.addTaskContainer}>
                  <TextInput
                    style={styles.taskInput}
                    placeholder="Add a new task..."
                    value={newTaskTexts[weekKey] || ''}
                    onChangeText={(text) => setNewTaskTexts(prev => ({ ...prev, [weekKey]: text }))}
                    onSubmitEditing={() => handleAddTask(weekKey)}
                    placeholderTextColor="#aaa"
                  />
                  <TouchableOpacity onPress={() => handleAddTask(weekKey)} style={styles.addButton}>
                    <Text style={styles.addButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.palette.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.palette.background,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    margin: 18,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  headerGoalName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.palette.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  headerGoalDates: {
    fontSize: 15,
    color: Colors.palette.textSecondary,
    marginBottom: 18,
    textAlign: 'center',
  },
  headerProgressBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  headerProgressPercentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 14,
    minWidth: 56,
    justifyContent: 'flex-end',
  },
  headerProgressPercentText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.palette.success,
    marginRight: 4,
  },
  headerTrophyIcon: {
    fontSize: 20,
    marginLeft: 0,
  },
  subgoalSection: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 18,
    marginBottom: 16,
    elevation: 2,
  },
  subgoalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subgoalHeading: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  subgoalCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  subgoalName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.palette.textPrimary,
  },
  subgoalDates: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
  subgoalPercent: {
    alignSelf: 'flex-end',
    marginTop: 4,
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.palette.success,
  },
  noSubgoalsText: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
    marginVertical: 6,
  },
  weekCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  weekCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weekCardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    flexShrink: 1,
  },
  weekCardTick: {
    fontSize: 22,
    color: Colors.palette.success,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'transparent',
  },
  taskItemCompleted: {
    backgroundColor: 'rgba(39, 174, 96, 0.05)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#aaa',
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxCompleted: {
    borderColor: Colors.palette.success,
    backgroundColor: '#eafaf1',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    backgroundColor: Colors.palette.success,
    borderRadius: 2,
  },
  taskText: {
    fontSize: 16,
    color: '#444',
    flex: 1,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  noTasksText: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 15,
  },
  addTaskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  taskInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginRight: 10,
    backgroundColor: '#fff',
    fontSize: 15,
  },
  addButton: {
    backgroundColor: Colors.palette.primary,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});

export default GoalDetailScreen;