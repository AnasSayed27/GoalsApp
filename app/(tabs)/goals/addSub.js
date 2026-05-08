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
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as GoalService from '../../../services/GoalService';
import { StorageService } from '../../../services/StorageService';
import { STORAGE_KEYS } from '../../../constants/StorageKeys';
import { formatDateLong } from '../../../utils/dateHelpers';
import { toUTCDate } from '../../../utils/dateHelpers';

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
        const goals = await StorageService.get(STORAGE_KEYS.GOALS, []);
        const g = goals.find((gl) => gl.id === goalId);
        if (!g) {
          Alert.alert('Error', 'Parent goal not found');
          router.back();
          return;
        }
        if (!g.subgoals) g.subgoals = [];
        setParentGoal(g);
        setStartDate(toUTCDate(g.startDate));
        setEndDate(toUTCDate(g.endDate));
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

    if (endDate < startDate) {
      Alert.alert('Error', 'End date cannot be earlier than start date');
      return;
    }

    const result = await GoalService.addSubGoal(parentGoal.id, {
      name: name.trim(),
      startDate: sDateISO,
      endDate: eDateISO,
    });

    if (result.success) {
      router.back();
    } else {
      Alert.alert('Error', result.error || 'Failed saving sub-goal');
    }
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
      {Platform.OS !== 'ios' && <Button title={formatDateLong(startDate)} onPress={() => setShowStart(true)} />}
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
          minimumDate={toUTCDate(parentGoal.startDate)}
          maximumDate={toUTCDate(parentGoal.endDate)}
        />
      )}

      <Text style={styles.label}>End Date:</Text>
      {Platform.OS !== 'ios' && <Button title={formatDateLong(endDate)} onPress={() => setShowEnd(true)} />}
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
          maximumDate={toUTCDate(parentGoal.endDate)}
        />
      )}

      <View style={{ marginTop: 30 }}>
        <Button title="Save Sub-goal" color="#4CAF50" onPress={saveSubGoal} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', padding: 20 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, fontSize: 16 },
});

export default AddSubGoalScreen;
