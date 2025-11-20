import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Platform,
  Alert,
  ScrollView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';

// Helper reused from detail screen – duplicated here for independence
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

// Utility to rebuild parent weeks excluding all subgoal ranges
const rebuildParentWeeks = (parentGoal) => {
  if (!parentGoal) return {};
  // Collect exclusion ranges (inclusive) from subgoals
  const exclusions = (parentGoal.subgoals || []).map((sg) => ({
    start: sg.startDate,
    end: sg.endDate
  })).sort((a, b) => new Date(a.start) - new Date(b.start));

  const resultWeeks = {};
  let weekIndex = 0;

  const pushSegmentWeeks = (segStartStr, segEndStr) => {
    if (!segStartStr || !segEndStr) return;
    const segWeeks = getWeeksBetweenDates(segStartStr, segEndStr);
    Object.keys(segWeeks).forEach((wkKey) => {
      resultWeeks[`week_${weekIndex}`] = segWeeks[wkKey];
      weekIndex += 1;
    });
  };

  let current = new Date(parentGoal.startDate + 'T00:00:00Z');
  const parentEnd = new Date(parentGoal.endDate + 'T00:00:00Z');

  exclusions.forEach((ex, idx) => {
    const exStart = new Date(ex.start + 'T00:00:00Z');
    const exEnd = new Date(ex.end + 'T00:00:00Z');

    if (current <= exStart) {
      // segment from current to day before exStart
      const segEnd = new Date(exStart);
      segEnd.setUTCDate(segEnd.getUTCDate() - 1);
      if (current <= segEnd) {
        pushSegmentWeeks(current.toISOString().split('T')[0], segEnd.toISOString().split('T')[0]);
      }
    }
    // move current to day after exEnd
    current = new Date(exEnd);
    current.setUTCDate(current.getUTCDate() + 1);
  });

  // Final trailing segment
  if (current <= parentEnd) {
    pushSegmentWeeks(current.toISOString().split('T')[0], parentGoal.endDate);
  }

  return resultWeeks;
};

const AddSubGoalScreen = () => {
  const { goalId } = useLocalSearchParams();
  const router = useRouter();

  const [parentGoal, setParentGoal] = useState(null);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@goals');
        const goals = stored ? JSON.parse(stored) : [];
        const g = goals.find((gl) => gl.id === goalId);
        if (!g) {
          Alert.alert('Error', 'Parent goal not found');
          router.back();
          return;
        }
        if (!g.subgoals) g.subgoals = [];
        setParentGoal(g);
        setStartDate(new Date(g.startDate + 'T00:00:00Z'));
        setEndDate(new Date(g.endDate + 'T00:00:00Z'));
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Failed to load parent goal');
        router.back();
      }
    })();
  }, [goalId]);

  const saveSubGoal = async () => {
    if (!parentGoal) return;
    if (!name.trim()) {
      Alert.alert('Error', 'Enter sub-goal name');
      return;
    }
    const sDateISO = startDate.toISOString().split('T')[0];
    const eDateISO = endDate.toISOString().split('T')[0];

    // Validate date range inside parent
    if (sDateISO < parentGoal.startDate || eDateISO > parentGoal.endDate) {
      Alert.alert('Error', 'Sub-goal dates must lie inside parent goal timeframe');
      return;
    }
    if (endDate < startDate) {
      Alert.alert('Error', 'End date cannot be earlier than start date');
      return;
    }
    // Prevent overlap with existing sub-goals
    const hasOverlap = (parentGoal.subgoals || []).some((sg) => {
      return !(eDateISO < sg.startDate || sDateISO > sg.endDate);
    });
    if (hasOverlap) {
      Alert.alert('Error', 'Sub-goal dates overlap with an existing sub-goal. Choose a different timeframe.');
      return;
    }

    const subGoal = {
      id: Date.now().toString(),
      name: name.trim(),
      startDate: sDateISO,
      endDate: eDateISO,
      weeks: getWeeksBetweenDates(sDateISO, eDateISO),
      subgoals: []
    };

    try {
      const stored = await AsyncStorage.getItem('@goals');
      const goals = stored ? JSON.parse(stored) : [];
      const idx = goals.findIndex((g) => g.id === parentGoal.id);
      if (idx === -1) throw new Error('Parent goal not found');

      if (!goals[idx].subgoals) goals[idx].subgoals = [];
      goals[idx].subgoals.push(subGoal);

      // Recompute parent weeks excluding all subgoal ranges
      goals[idx].weeks = rebuildParentWeeks(goals[idx]);

      await AsyncStorage.setItem('@goals', JSON.stringify(goals));
      // Navigate back to parent detail screen (refresh happens on focus)
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed saving sub-goal');
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (!parentGoal) {
    return (
      <View style={styles.loading}><Text>Loading...</Text></View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Add Sub-goal to "{parentGoal.name}"</Text>

      <Text style={styles.label}>Sub-goal Name:</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter sub-goal" />

      <Text style={styles.label}>Start Date:</Text>
      {Platform.OS !== 'ios' && <Button title={formatDate(startDate)} onPress={() => setShowStart(true)} />}
      {(showStart || Platform.OS === 'ios') && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, d) => {
            const dt = d || startDate;
            setShowStart(false);
            setStartDate(dt);
            if (dt > endDate) setEndDate(dt);
          }}
          minimumDate={new Date(parentGoal.startDate + 'T00:00:00Z')}
          maximumDate={new Date(parentGoal.endDate + 'T00:00:00Z')}
        />
      )}

      <Text style={styles.label}>End Date:</Text>
      {Platform.OS !== 'ios' && <Button title={formatDate(endDate)} onPress={() => setShowEnd(true)} />}
      {(showEnd || Platform.OS === 'ios') && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, d) => {
            const dt = d || endDate;
            setShowEnd(false);
            setEndDate(dt);
          }}
          minimumDate={startDate}
          maximumDate={new Date(parentGoal.endDate + 'T00:00:00Z')}
        />
      )}

      <View style={{ marginTop: 30 }}>
        <Button title="Save Sub-goal" color="#4CAF50" onPress={saveSubGoal} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 20
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16
  }
});

export default AddSubGoalScreen;
