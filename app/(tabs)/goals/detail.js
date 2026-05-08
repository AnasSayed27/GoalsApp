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
  Keyboard,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  // Modal states
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [addModalWeekKey, setAddModalWeekKey] = useState(null);
  const [addModalDraftTarget, setAddModalDraftTarget] = useState('');
  const [addModalDraftUnit, setAddModalDraftUnit] = useState('');

  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [updateModalWeekKey, setUpdateModalWeekKey] = useState(null);
  const [updateModalTask, setUpdateModalTask] = useState(null);
  const [updateModalDraftProgress, setUpdateModalDraftProgress] = useState('');

  const [isConvertModalVisible, setIsConvertModalVisible] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState(null);

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
  const triggerAddModal = (weekKey) => {
    const textToAdd = newTaskTexts[weekKey]?.trim();
    if (!textToAdd) {
      Alert.alert("Input Needed", "Please enter a tactic description first.");
      return;
    }
    setAddModalWeekKey(weekKey);
    setAddModalDraftTarget('');
    setAddModalDraftUnit('');
    setIsAddModalVisible(true);
  };

  const confirmAddTask = async () => {
    const weekKey = addModalWeekKey;
    const textToAdd = newTaskTexts[weekKey]?.trim();
    if (!textToAdd) return;
    
    const targetValStr = addModalDraftTarget.trim();
    const unitStr = addModalDraftUnit.trim();

    const updatedGoal = { ...goal };
    const newTask = { id: Date.now().toString(), text: textToAdd, completed: false };

    if (targetValStr && !isNaN(Number(targetValStr))) {
      newTask.targetValue = Number(targetValStr);
      newTask.currentProgress = 0;
      newTask.unit = unitStr || '';
    }

    if (!updatedGoal.weeks[weekKey].tasks) { updatedGoal.weeks[weekKey].tasks = []; }
    updatedGoal.weeks[weekKey].tasks.push(newTask);

    setGoal(updatedGoal); // Optimistic UI update
    await updateGoal(updatedGoal); // Persist

    setNewTaskTexts(prev => ({ ...prev, [weekKey]: '' }));
    setIsAddModalVisible(false);
    Keyboard.dismiss();
  };

  const triggerUpdateModal = (weekKey, task) => {
    setUpdateModalWeekKey(weekKey);
    setUpdateModalTask(task);
    setUpdateModalDraftProgress((task.currentProgress || 0).toString());
    setIsUpdateModalVisible(true);
  };

  const confirmUpdateProgress = async () => {
    if (!updateModalTask || !updateModalWeekKey) return;
    
    const newProgressStr = updateModalDraftProgress.trim();
    if (!newProgressStr || isNaN(Number(newProgressStr))) {
        Alert.alert("Invalid Input", "Please enter a valid number.");
        return;
    }

    let newProgress = Number(newProgressStr);
    if (newProgress < 0) newProgress = 0;
    if (newProgress > updateModalTask.targetValue) newProgress = updateModalTask.targetValue;

    const updatedGoal = { ...goal };
    const weekTasks = updatedGoal.weeks[updateModalWeekKey].tasks;
    const taskIndex = weekTasks.findIndex(t => t.id === updateModalTask.id);
    
    if (taskIndex !== -1) {
      const oldProgress = weekTasks[taskIndex].currentProgress || 0;
      const diff = newProgress - oldProgress;
      
      const todayStr = new Date().toISOString().split('T')[0];
      if (!weekTasks[taskIndex].dailyLogs) weekTasks[taskIndex].dailyLogs = {};
      weekTasks[taskIndex].dailyLogs[todayStr] = (weekTasks[taskIndex].dailyLogs[todayStr] || 0) + diff;
      if (weekTasks[taskIndex].dailyLogs[todayStr] < 0) weekTasks[taskIndex].dailyLogs[todayStr] = 0;

      weekTasks[taskIndex].currentProgress = newProgress;
      if (newProgress === updateModalTask.targetValue) {
          weekTasks[taskIndex].completed = true;
      } else {
          weekTasks[taskIndex].completed = false;
      }
      
      setGoal(updatedGoal);
      await updateGoal(updatedGoal);
    }
    
    setIsUpdateModalVisible(false);
  };

  const handleCopyToNextWeek = async () => {
      if (!updateModalTask || !updateModalWeekKey) return;
      
      const currentWeekIndex = parseInt(updateModalWeekKey.split('_')[1]);
      const nextWeekKey = `week_${currentWeekIndex + 1}`;
      
      const updatedGoal = { ...goal };
      
      if (!updatedGoal.weeks[nextWeekKey]) {
          Alert.alert("Notice", "This is the final week. Cannot copy to next week.");
          return;
      }
      
      const newTask = {
          ...updateModalTask,
          id: Date.now().toString(),
          currentProgress: 0,
          completed: false,
          dailyLogs: {},
          completionDate: null
      };
      
      if (!updatedGoal.weeks[nextWeekKey].tasks) {
          updatedGoal.weeks[nextWeekKey].tasks = [];
      }
      
      updatedGoal.weeks[nextWeekKey].tasks.push(newTask);
      
      setGoal(updatedGoal);
      await updateGoal(updatedGoal);
      
      Alert.alert("Success", "Tactic copied to the next week!");
      setIsUpdateModalVisible(false);
  };

  const handleReorderTask = async (weekKey, taskIndex, direction) => {
    const updatedGoal = { ...goal };
    const weekTasks = updatedGoal.weeks[weekKey].tasks;
    
    if (direction === 'up' && taskIndex > 0) {
      const temp = weekTasks[taskIndex];
      weekTasks[taskIndex] = weekTasks[taskIndex - 1];
      weekTasks[taskIndex - 1] = temp;
    } else if (direction === 'down' && taskIndex < weekTasks.length - 1) {
      const temp = weekTasks[taskIndex];
      weekTasks[taskIndex] = weekTasks[taskIndex + 1];
      weekTasks[taskIndex + 1] = temp;
    } else {
      return;
    }
    
    setGoal(updatedGoal);
    await updateGoal(updatedGoal);
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
      const todayStr = new Date().toISOString().split('T')[0];
      weekTasks[taskIndex].completionDate = weekTasks[taskIndex].completed ? todayStr : null;
      setGoal(updatedGoal);
      await updateGoal(updatedGoal);
    }
  };

  const handleConvertGoal = () => {
      const parentGoal = goals.find(g => g.id === selectedParentId);
      if (!parentGoal) return;

      const sStart = new Date(goal.startDate + 'T00:00:00Z');
      const sEnd = new Date(goal.endDate + 'T00:00:00Z');
      const diffTime = Math.abs(sEnd - sStart);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      const consumedWeeks = Math.max(1, Math.ceil(diffDays / 7));

      Alert.alert(
          "Confirm Conversion",
          `This will consume approximately ${consumedWeeks} weeks from the parent goal "${parentGoal.name}". Proceed?`,
          [
              { text: "Cancel", style: "cancel" },
              { text: "Proceed", onPress: () => confirmConvertGoal(parentGoal) }
          ]
      );
  };

  const confirmConvertGoal = async (parentGoal) => {
      try {
          const stored = await AsyncStorage.getItem('@goals');
          let allGoals = stored ? JSON.parse(stored) : [];
          
          const pIdx = allGoals.findIndex((g) => g.id === selectedParentId);
          const currentIdx = allGoals.findIndex((g) => g.id === goal.id);
          
          if (pIdx === -1 || currentIdx === -1) return;
          
          const parentToUpdate = allGoals[pIdx];
          const goalToMove = allGoals[currentIdx];
          
          if (!parentToUpdate.subgoals) parentToUpdate.subgoals = [];
          
          // Clear subgoals of the moving goal to prevent deep nesting issues
          goalToMove.subgoals = [];
          
          parentToUpdate.subgoals.push(goalToMove);
          parentToUpdate.weeks = rebuildParentWeeks(parentToUpdate);
          
          // Remove the moved goal from root
          allGoals = allGoals.filter(g => g.id !== goal.id);
          
          // Re-find parent index in filtered list and update it
          const newPIdx = allGoals.findIndex((g) => g.id === selectedParentId);
          if (newPIdx !== -1) {
              allGoals[newPIdx] = parentToUpdate;
          }
          
          await AsyncStorage.setItem('@goals', JSON.stringify(allGoals));
          
          setIsConvertModalVisible(false);
          router.replace('/goals');
      } catch (e) {
          console.error(e);
          Alert.alert("Error", "Could not convert.");
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
            completed += w.tasks.reduce((sum, task) => {
                if (task.targetValue) {
                    return sum + Math.min((task.currentProgress || 0) / task.targetValue, 1);
                }
                return sum + (task.completed ? 1 : 0);
            }, 0);
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
              ? weekData.tasks.reduce((sum, task) => {
                  if (task.targetValue) {
                      return sum + Math.min((task.currentProgress || 0) / task.targetValue, 1);
                  }
                  return sum + (task.completed ? 1 : 0);
              }, 0) / weekData.tasks.length
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
                {(weekData.tasks || []).map((task, taskIndex, arr) => (
                  <View key={task.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: task.targetValue ? 12 : 0 }}>
                    {task.targetValue ? (
                        <TouchableOpacity 
                          style={[styles.taskItem, { flex: 1, flexDirection: 'column', alignItems: 'stretch', paddingVertical: 12, borderBottomWidth: 0, backgroundColor: 'rgba(52, 152, 219, 0.03)', borderRadius: 8, paddingHorizontal: 12 }]}
                          onPress={() => triggerUpdateModal(weekKey, task)}
                          onLongPress={() => handleDeleteTask(weekKey, task.id)}
                          delayLongPress={500}
                          activeOpacity={0.7}
                        >
                           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                               <Text style={[styles.taskText, task.completed && styles.taskTextCompleted, { fontWeight: '600' }]}>{task.text}</Text>
                               <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                   <Text style={styles.progressText}>{task.currentProgress || 0} / {task.targetValue} <Text style={{fontSize: 10, color: '#888'}}>{task.unit}</Text></Text>
                               </View>
                           </View>
                           <Progress.Bar progress={(task.currentProgress || 0) / task.targetValue} width={null} color={task.completed ? Colors.palette.success : Colors.palette.primary} unfilledColor="#e0e0e0" borderWidth={0} height={6} borderRadius={3} style={{ marginTop: 10 }} animated={true} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                          style={[styles.taskItem, task.completed && styles.taskItemCompleted, { flex: 1 }]}
                          onPress={() => handleToggleTask(weekKey, task.id)}
                          onLongPress={() => handleDeleteTask(weekKey, task.id)}
                          delayLongPress={500}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.checkbox, task.completed && styles.checkboxCompleted]}>
                            {task.completed && <View style={styles.checkboxInner} />}
                          </View>
                          <Text style={[styles.taskText, task.completed && styles.taskTextCompleted]}>
                            {task.text}
                          </Text>
                        </TouchableOpacity>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 4 }}>
                        <View style={{ flexDirection: 'column' }}>
                            <TouchableOpacity onPress={() => handleReorderTask(weekKey, taskIndex, 'up')} disabled={taskIndex === 0} style={{ padding: 2, opacity: taskIndex === 0 ? 0.3 : 1 }}>
                                <MaterialCommunityIcons name="chevron-up" size={24} color="#666" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleReorderTask(weekKey, taskIndex, 'down')} disabled={taskIndex === arr.length - 1} style={{ padding: 2, opacity: taskIndex === arr.length - 1 ? 0.3 : 1 }}>
                                <MaterialCommunityIcons name="chevron-down" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                    </View>
                  </View>
                ))}
                {(weekData.tasks || []).length === 0 && (
                  <Text style={styles.noTasksText}>No tactics added for this week yet.</Text>
                )}
                {/* Add Task Input */}
                <View style={styles.addTaskContainer}>
                  <View style={{ flex: 1 }}>
                      <TextInput
                        style={styles.taskInput}
                        placeholder="Add a new tactic/task..."
                        value={newTaskTexts[weekKey] || ''}
                        onChangeText={(text) => setNewTaskTexts(prev => ({ ...prev, [weekKey]: text }))}
                        onSubmitEditing={() => triggerAddModal(weekKey)}
                        placeholderTextColor="#aaa"
                      />
                  </View>
                  <TouchableOpacity onPress={() => triggerAddModal(weekKey)} style={[styles.addButton, { marginLeft: 10, alignSelf: 'stretch' }]}>
                    <Text style={styles.addButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        <TouchableOpacity style={styles.convertBtn} onPress={() => setIsConvertModalVisible(true)}>
          <Text style={styles.convertBtnText}>Convert to Subgoal</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Convert to Subgoal Modal */}
      <Modal visible={isConvertModalVisible} transparent={true} animationType="fade" onRequestClose={() => setIsConvertModalVisible(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsConvertModalVisible(false)}>
              <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                  <Text style={styles.modalTitle}>Convert to Subgoal</Text>
                  <Text style={styles.modalSubtitle}>Select the parent goal:</Text>
                  
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
                  
                  <View style={styles.modalActionRow}>
                      <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsConvertModalVisible(false)}>
                          <Text style={styles.modalCancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.modalSaveBtn, !selectedParentId && {opacity: 0.5}]} onPress={handleConvertGoal} disabled={!selectedParentId}>
                          <Text style={styles.modalSaveBtnText}>Convert</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </TouchableOpacity>
      </Modal>

      {/* Add Tactic Modal */}
      <Modal visible={isAddModalVisible} transparent={true} animationType="fade" onRequestClose={() => setIsAddModalVisible(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsAddModalVisible(false)}>
              <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                  <Text style={styles.modalTitle}>Set Tactic Target (Optional)</Text>
                  <Text style={styles.modalSubtitle}>If you just want a checkbox, leave these blank.</Text>
                  
                  <View style={styles.modalInputGroup}>
                      <Text style={styles.modalLabel}>Numeric Target</Text>
                      <TextInput
                          style={styles.modalInput}
                          placeholder="e.g. 70"
                          value={addModalDraftTarget}
                          onChangeText={setAddModalDraftTarget}
                          keyboardType="numeric"
                      />
                  </View>
                  <View style={styles.modalInputGroup}>
                      <Text style={styles.modalLabel}>Unit (optional)</Text>
                      <TextInput
                          style={styles.modalInput}
                          placeholder="e.g. calls, hours"
                          value={addModalDraftUnit}
                          onChangeText={setAddModalDraftUnit}
                      />
                  </View>
                  
                  <View style={styles.modalActionRow}>
                      <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsAddModalVisible(false)}>
                          <Text style={styles.modalCancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.modalSaveBtn} onPress={confirmAddTask}>
                          <Text style={styles.modalSaveBtnText}>Save</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </TouchableOpacity>
      </Modal>

      {/* Update Progress Modal */}
      <Modal visible={isUpdateModalVisible} transparent={true} animationType="fade" onRequestClose={() => setIsUpdateModalVisible(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsUpdateModalVisible(false)}>
              <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                          <Text style={styles.modalTitle}>Log Progress</Text>
                          <Text style={styles.modalSubtitle}>{updateModalTask?.text}</Text>
                      </View>
                      <TouchableOpacity onPress={handleCopyToNextWeek} style={{ backgroundColor: '#e8f4fd', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }}>
                          <MaterialCommunityIcons name="content-copy" size={16} color="#3498db" style={{ marginRight: 4 }} />
                          <Text style={{ color: '#3498db', fontSize: 12, fontWeight: 'bold' }}>Copy Next</Text>
                      </TouchableOpacity>
                  </View>
                  
                  <View style={styles.modalInputGroup}>
                      <Text style={styles.modalLabel}>Current Progress (out of {updateModalTask?.targetValue} {updateModalTask?.unit})</Text>
                      <TextInput
                          style={styles.modalInput}
                          value={updateModalDraftProgress}
                          onChangeText={setUpdateModalDraftProgress}
                          keyboardType="numeric"
                      />
                  </View>
                  
                  <View style={styles.modalActionRow}>
                      <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsUpdateModalVisible(false)}>
                          <Text style={styles.modalCancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.modalSaveBtn} onPress={confirmUpdateProgress}>
                          <Text style={styles.modalSaveBtnText}>Update</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </TouchableOpacity>
      </Modal>
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
  },
  progressBtn: {
    backgroundColor: '#eee',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  progressBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  modalInputGroup: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  modalCancelBtnText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: Colors.palette.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalSaveBtnText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  convertBtn: {
    backgroundColor: '#34495e',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  convertBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  parentGoalOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 8,
  },
  parentGoalOptionSelected: {
    borderColor: Colors.palette.primary,
    backgroundColor: 'rgba(52, 152, 219, 0.05)',
  },
  parentGoalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  parentGoalOptionTextSelected: {
    color: Colors.palette.primary,
    fontWeight: 'bold',
  }
});

export default GoalDetailScreen;