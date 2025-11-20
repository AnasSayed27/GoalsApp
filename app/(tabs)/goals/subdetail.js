import React, { useState, useEffect, useCallback } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as Progress from 'react-native-progress';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Helper duplicated
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

const SubGoalDetailScreen = () => {
  const { goalId, subGoalId } = useLocalSearchParams();
  const router = useRouter();

  const [subGoal, setSubGoal] = useState(null);
  const [parentGoal, setParentGoal] = useState(null);
  const [newTaskTexts, setNewTaskTexts] = useState({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetch = async () => {
        if (!goalId || !subGoalId) {
          Alert.alert('Error', 'Missing parameters');
          router.back();
          return;
        }
        setLoading(true);
        try {
          const stored = await AsyncStorage.getItem('@goals');
          const goals = stored ? JSON.parse(stored) : [];
          const parent = goals.find((g) => g.id === goalId);
          if (!parent) throw new Error('Parent goal not found');
          if (!parent.subgoals) parent.subgoals = [];
          const sg = parent.subgoals.find((s) => s.id === subGoalId);
          if (!sg) throw new Error('Sub-goal not found');

          // Ensure weeks exist
          if (!sg.weeks || Object.keys(sg.weeks).length === 0) {
            sg.weeks = getWeeksBetweenDates(sg.startDate, sg.endDate);
          }
          // Ensure tasks arrays exist
          Object.values(sg.weeks).forEach((w) => {
            if (!w.tasks) w.tasks = [];
          });

          if (isActive) {
            setParentGoal(parent);
            setSubGoal({ ...sg });
          }
        } catch (e) {
          console.error(e);
          Alert.alert('Error', 'Failed to load sub-goal');
          router.back();
        } finally {
          if (isActive) setLoading(false);
        }
      };
      fetch();
      return () => {
        isActive = false;
      };
    }, [goalId, subGoalId])
  );

  const saveUpdates = useCallback(async (updatedSubGoal) => {
    try {
      const stored = await AsyncStorage.getItem('@goals');
      const goals = stored ? JSON.parse(stored) : [];
      const pIdx = goals.findIndex((g) => g.id === goalId);
      if (pIdx === -1) return;
      const sIdx = goals[pIdx].subgoals.findIndex((s) => s.id === updatedSubGoal.id);
      if (sIdx === -1) return;
      goals[pIdx].subgoals[sIdx] = updatedSubGoal;
      await AsyncStorage.setItem('@goals', JSON.stringify(goals));
    } catch (e) {
      console.error(e);
    }
  }, [goalId]);

  // Task handlers identical to parent goal logic

  const handleAddTask = (weekKey) => {
    const textToAdd = newTaskTexts[weekKey]?.trim();
    if (!textToAdd) {
      Alert.alert('Input Needed', 'Please enter a task description');
      return;
    }
    const upd = { ...subGoal };
    if (!upd.weeks[weekKey].tasks) upd.weeks[weekKey].tasks = [];
    upd.weeks[weekKey].tasks.push({ id: Date.now().toString(), text: textToAdd, completed: false });
    setSubGoal(upd);
    saveUpdates(upd);
    setNewTaskTexts((prev) => ({ ...prev, [weekKey]: '' }));
    Keyboard.dismiss();
  };

  const toggleTask = (weekKey, taskId) => {
    const upd = { ...subGoal };
    const idx = upd.weeks[weekKey].tasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      upd.weeks[weekKey].tasks[idx].completed = !upd.weeks[weekKey].tasks[idx].completed;
      setSubGoal(upd);
      saveUpdates(upd);
    }
  };

  const deleteTask = (weekKey, taskId) => {
    Alert.alert('Delete Task', 'Sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          const upd = { ...subGoal };
          upd.weeks[weekKey].tasks = upd.weeks[weekKey].tasks.filter((t) => t.id !== taskId);
          setSubGoal(upd);
          saveUpdates(upd);
        }
      }
    ]);
  };

  const calculateProgress = useCallback(() => {
    if (!subGoal || !subGoal.weeks) return 0;
    let total = 0, completed = 0;
    Object.values(subGoal.weeks).forEach((w) => {
      if (w.tasks && Array.isArray(w.tasks)) {
        total += w.tasks.length;
        completed += w.tasks.filter((t) => t.completed).length;
      }
    });
    return total > 0 ? completed / total : 0;
  }, [subGoal]);

  const formatDate = (str) => new Date(str + 'T00:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  if (loading || !subGoal) {
    return <View style={styles.loading}><Text>Loading...</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: subGoal.name }} />
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{subGoal.name}</Text>
          <Text style={styles.dates}>{`${formatDate(subGoal.startDate)} - ${formatDate(subGoal.endDate)}`}</Text>
          <Progress.Bar progress={calculateProgress()} width={null} color="#27ae60" unfilledColor="#e0e0e0" borderWidth={0} height={14} borderRadius={8} style={{ marginTop: 10 }} />
          <Text style={styles.percent}>{`${Math.round(calculateProgress() * 100)}%`}</Text>
        </View>

        {Object.entries(subGoal.weeks || {})
          .sort(([a], [b]) => parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]))
          .map(([wk, wd]) => {
            const wProg = wd.tasks && wd.tasks.length ? wd.tasks.filter(t => t.completed).length / wd.tasks.length : 0;
            return (
              <View key={wk} style={styles.weekCard}>
                <Text style={styles.weekTitle}>{`Week ${parseInt(wk.split('_')[1]) + 1}: ${formatDate(wd.startDate)} - ${formatDate(wd.endDate)}`}</Text>
                <Progress.Bar progress={wProg} width={null} color={wProg === 1 ? '#27ae60' : '#ffa726'} unfilledColor="#e0e0e0" borderWidth={0} height={8} borderRadius={4} style={{ marginVertical: 6 }} />

                {(wd.tasks || []).map((t) => (
                  <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity style={[styles.taskItem, t.completed && styles.taskItemDone, { flex: 1 }]} onPress={() => toggleTask(wk, t.id)}>
                      <View style={[styles.checkbox, t.completed && styles.checkboxDone]}>{t.completed && <View style={styles.checkboxInner} />}</View>
                      <Text style={[styles.taskText, t.completed && styles.taskDone]}>{t.text}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteTask(wk, t.id)} style={{ marginLeft: 8, padding: 8 }}>
                      <MaterialCommunityIcons name="delete-outline" size={22} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                ))}

                {(wd.tasks || []).length === 0 && <Text style={styles.noTasks}>No tasks yet.</Text>}

                <View style={styles.addTaskRow}>
                  <TextInput style={styles.taskInput} placeholder="Add task" value={newTaskTexts[wk] || ''} onChangeText={(txt) => setNewTaskTexts((p) => ({ ...p, [wk]: txt }))} onSubmitEditing={() => handleAddTask(wk)} />
                  <TouchableOpacity onPress={() => handleAddTask(wk)} style={styles.addBtn}><Text style={styles.addBtnTxt}>+</Text></TouchableOpacity>
                </View>
              </View>
            );
          })}
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
  percent: { marginTop: 8, fontSize: 16, fontWeight: 'bold', color: '#27ae60' },
  weekCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginHorizontal: 18, marginBottom: 16, elevation: 2 },
  weekTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  taskItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  taskItemDone: { backgroundColor: 'rgba(39,174,96,0.05)' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#aaa', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { borderColor: '#27ae60', backgroundColor: '#eafaf1' },
  checkboxInner: { width: 12, height: 12, backgroundColor: '#4CAF50', borderRadius: 2 },
  taskText: { fontSize: 15, color: '#444', flex: 1 },
  taskDone: { textDecorationLine: 'line-through', color: '#aaa' },
  noTasks: { color: '#888', fontStyle: 'italic', textAlign: 'center', paddingVertical: 10 },
  addTaskRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  taskInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, paddingVertical: 6, paddingHorizontal: 10, fontSize: 14 },
  addBtn: { backgroundColor: '#f4511e', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 5, marginLeft: 8 },
  addBtnTxt: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default SubGoalDetailScreen;
