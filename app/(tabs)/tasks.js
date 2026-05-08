import React, { useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Animated, TouchableOpacity, ScrollView } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { useTasksData } from '../../hooks/useTasksData';
import { useGoalsData } from '../../hooks/useGoalsData';
import { ProgressSection, TaskInput, TaskItem, EditTaskModal } from '../../components/TaskComponents';
import { Colors } from '../../constants/Colors';
import * as Progress from 'react-native-progress';

const TasksScreen = () => {
  const {
    tasks,
    addTask,
    toggleComplete,
    deleteTask,
    reorderTasks,
    stats
  } = useTasksData();

  const { goals, updateGoal } = useGoalsData();

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
    if (success) {
      setNewName('');
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

  const handleDelete = (id) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTask(id);
        }
      }
    ]);
  };

  const renderItem = ({ item, drag, isActive }) => (
    <TaskItem
      item={item}
      onToggle={handleToggleComplete}
      onDelete={handleDelete}
      drag={drag}
      isActive={isActive}
    />
  );

  // --- Goal Tactics Logic ---
  const getTacticData = () => {
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const todayStr = today.toISOString().split('T')[0];
    
    const tactics = [];
    let totalScore = 0;
    let completedScore = 0;

    (goals || []).forEach(goal => {
      const start = new Date(goal.startDate + 'T00:00:00Z');
      const end = new Date(goal.endDate + 'T00:00:00Z');
      
      if (todayUTC >= start && todayUTC <= end && goal.weeks) {
        Object.entries(goal.weeks).forEach(([weekKey, weekData]) => {
          const wStart = new Date(weekData.startDate + 'T00:00:00Z');
          const wEnd = new Date(weekData.endDate + 'T00:00:00Z');
          
          if (todayUTC >= wStart && todayUTC <= wEnd) {
            const passedDays = Math.max(0, Math.floor((todayUTC - wStart) / (1000 * 60 * 60 * 24)));
            const daysLeft = Math.max(1, 6 - passedDays);
            
            (weekData.tasks || []).forEach(task => {
                const isCompleted = task.completed;
                const todayWork = task.dailyLogs?.[todayStr] || 0;
                
                if (task.targetValue) {
                    const remainingBeforeToday = task.targetValue - (task.currentProgress || 0) + todayWork;
                    const dailyPace = remainingBeforeToday > 0 ? Math.ceil(remainingBeforeToday / daysLeft) : 0;
                    
                    const wasCompletedBeforeToday = isCompleted && task.completionDate && task.completionDate !== todayStr;
                    
                    if (!wasCompletedBeforeToday) {
                        if (dailyPace > 0) {
                            totalScore += dailyPace;
                            completedScore += Math.min(todayWork, dailyPace);
                        } else if (todayWork > 0) {
                            totalScore += todayWork;
                            completedScore += todayWork;
                        }
                        
                        if (!isCompleted || (task.completionDate === todayStr)) {
                            tactics.push({
                                ...task, type: 'target', goalId: goal.id, goalName: goal.name, weekKey, dailyPace, todayWork
                            });
                        }
                    }
                } else {
                    const wasCompletedBeforeToday = isCompleted && task.completionDate && task.completionDate !== todayStr;
                    if (!wasCompletedBeforeToday) {
                        totalScore += 1;
                        completedScore += (isCompleted && task.completionDate === todayStr) ? 1 : 0;
                        
                        if (!isCompleted || task.completionDate === todayStr) {
                            tactics.push({
                                ...task, type: 'simple', goalId: goal.id, goalName: goal.name, weekKey, todayWork: isCompleted ? 1 : 0
                            });
                        }
                    }
                }
            });
          }
        });
      }
    });

    const progress = totalScore > 0 ? completedScore / totalScore : 0;
    return {
        tactics,
        stats: {
            completed: Math.round(completedScore * 10) / 10,
            total: totalScore,
            progress
        }
    };
  };

  const handleToggleGoalTactic = async (goalId, weekKey, taskId) => {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;
      const updatedGoal = { ...goal };
      const task = updatedGoal.weeks[weekKey].tasks.find(t => t.id === taskId);
      if (task) {
          task.completed = !task.completed;
          const todayStr = new Date().toISOString().split('T')[0];
          task.completionDate = task.completed ? todayStr : null;
          await updateGoal(updatedGoal);
          if (task.completed) triggerCongrats();
      }
  };

  const handleUpdateGoalTacticProgress = async (goalId, weekKey, taskId, amount) => {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;
      const updatedGoal = { ...goal };
      const task = updatedGoal.weeks[weekKey].tasks.find(t => t.id === taskId);
      if (task) {
          const oldProgress = task.currentProgress || 0;
          let newProgress = oldProgress + amount;
          if (newProgress < 0) newProgress = 0;
          if (newProgress >= task.targetValue) {
              newProgress = task.targetValue;
              task.completed = true;
              triggerCongrats();
          } else {
              task.completed = false;
          }
          const diff = newProgress - oldProgress;
          
          const todayStr = new Date().toISOString().split('T')[0];
          if (!task.dailyLogs) task.dailyLogs = {};
          task.dailyLogs[todayStr] = (task.dailyLogs[todayStr] || 0) + diff;
          if (task.dailyLogs[todayStr] < 0) task.dailyLogs[todayStr] = 0;

          task.currentProgress = newProgress;
          await updateGoal(updatedGoal);
      }
  };

  const { tactics: todayTactics, stats: tacticStats } = getTacticData();

  const headerComponent = useMemo(() => (
    <>
      <Text style={styles.header}>Daily Dashboard</Text>

      <ProgressSection
        completedDuration={tacticStats.completed}
        totalDuration={tacticStats.total}
        progress={tacticStats.progress}
        label="Today's Tactics Progress"
        unit="points"
      />
    </>
  ), [tacticStats.completed, tacticStats.total, tacticStats.progress]);

  const tacticsComponent = useMemo(() => {
    if (todayTactics.length === 0) return null;
    return (
      <View style={styles.tacticsSection}>
          <TouchableOpacity style={styles.sectionHeaderRow} onPress={() => setIsTacticsExpanded(prev => !prev)} activeOpacity={0.7}>
              <Text style={styles.sectionTitle}>12-Week Tactics (Today's Pace)</Text>
              <Ionicons name={isTacticsExpanded ? "chevron-up" : "chevron-down"} size={22} color="#666" />
          </TouchableOpacity>
          
          {isTacticsExpanded && todayTactics.map(tactic => (
              <View key={tactic.id} style={styles.tacticCard}>
                  <Text style={styles.tacticGoalName}>{tactic.goalName}</Text>
                  
                  {tactic.type === 'target' ? (
                      <View>
                          <View style={styles.tacticRow}>
                              <Text style={styles.tacticText}>{tactic.text}</Text>
                              <View style={styles.tacticControls}>
                                  <TouchableOpacity style={styles.tacticBtn} onPress={() => handleUpdateGoalTacticProgress(tactic.goalId, tactic.weekKey, tactic.id, -1)}><Text style={styles.tacticBtnText}>-</Text></TouchableOpacity>
                                  <Text style={styles.tacticProgressText}>{tactic.currentProgress || 0} / {tactic.targetValue}</Text>
                                  <TouchableOpacity style={styles.tacticBtn} onPress={() => handleUpdateGoalTacticProgress(tactic.goalId, tactic.weekKey, tactic.id, 1)}><Text style={styles.tacticBtnText}>+</Text></TouchableOpacity>
                              </View>
                          </View>
                          <View style={styles.paceContainer}>
                              <Text style={styles.paceText}>Required Pace: <Text style={styles.paceHighlight}>{tactic.dailyPace} {tactic.unit} today</Text></Text>
                          </View>
                          <Progress.Bar progress={tactic.dailyPace > 0 ? Math.min((tactic.todayWork || 0) / tactic.dailyPace, 1) : 1} width={null} color={Colors.palette.primary} unfilledColor="#e0e0e0" borderWidth={0} height={4} borderRadius={2} style={{ marginTop: 8 }} />
                      </View>
                  ) : (
                      <TouchableOpacity style={styles.tacticRow} onPress={() => handleToggleGoalTactic(tactic.goalId, tactic.weekKey, tactic.id)}>
                          <View style={[styles.checkbox, tactic.completed && styles.checkboxCompleted]}>
                              {tactic.completed && <View style={styles.checkboxInner} />}
                          </View>
                          <Text style={[styles.tacticText, tactic.completed && styles.tacticTextCompleted]}>{tactic.text}</Text>
                      </TouchableOpacity>
                  )}
              </View>
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
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  taskList: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 8 },
  congratsContainer: { position: 'absolute', top: '10%', left: 0, right: 0, zIndex: 999, alignItems: 'center', justifyContent: 'center' },
  congratsText: { fontSize: 20, fontWeight: 'bold', color: Colors.palette.primary, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, elevation: 4 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#444' },
  tacticsSection: { marginTop: 10, marginBottom: 10 },
  tacticCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tacticGoalName: { fontSize: 12, color: Colors.palette.primary, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 },
  tacticRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tacticText: { fontSize: 16, color: '#333', flex: 1, fontWeight: '500' },
  tacticControls: { flexDirection: 'row', alignItems: 'center' },
  tacticBtn: { backgroundColor: '#f0f0f0', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginHorizontal: 4 },
  tacticBtnText: { fontSize: 20, color: '#333', fontWeight: 'bold' },
  tacticProgressText: { fontSize: 15, fontWeight: 'bold', color: '#555', marginHorizontal: 8, minWidth: 45, textAlign: 'center' },
  paceContainer: { marginTop: 6 },
  paceText: { fontSize: 13, color: '#666' },
  paceHighlight: { fontWeight: 'bold', color: Colors.palette.warning },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#aaa', marginRight: 12 },
  checkboxCompleted: { backgroundColor: Colors.palette.success, borderColor: Colors.palette.success },
  checkboxInner: { width: 10, height: 10, backgroundColor: '#fff', borderRadius: 2, alignSelf: 'center', marginTop: 4 },
  tacticTextCompleted: { textDecorationLine: 'line-through', color: '#999' }
});

export default TasksScreen;

