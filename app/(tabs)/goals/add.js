import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useGoalsData } from '../../../hooks/useGoalsData';
import { Colors } from '../../../constants/Colors';

const AddGoalScreen = () => {
  const [goalName, setGoalName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const router = useRouter();
  const { addGoal } = useGoalsData();

  const onStartDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(Platform.OS === 'ios');
    setStartDate(currentDate);
    if (currentDate > endDate) {
      setEndDate(currentDate);
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(Platform.OS === 'ios');
    setEndDate(currentDate);
  };

  const handleSaveGoal = async () => {
    if (!goalName.trim()) {
      Alert.alert('Error', 'Please enter a goal name.');
      return;
    }
    if (endDate < startDate) {
      Alert.alert('Error', 'End date cannot be earlier than start date.');
      return;
    }

    const newGoalData = {
      name: goalName.trim(),
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };

    const success = await addGoal(newGoalData);

    if (success) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/goals');
      }
    } else {
      Alert.alert('Error', 'Failed to save the goal.');
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Goal Name:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your goal"
        value={goalName}
        onChangeText={setGoalName}
      />

      {/* --- Start Date --- */}
      <Text style={styles.label}>Start Date:</Text>
      {Platform.OS !== 'ios' && (
        <Button onPress={() => setShowStartDatePicker(true)} title={formatDate(startDate)} color="#555" />
      )}
      {(showStartDatePicker || Platform.OS === 'ios') && (
        <DateTimePicker
          testID="startDatePicker"
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onStartDateChange}
          minimumDate={new Date()}
          style={styles.datePicker}
        />
      )}
      {Platform.OS === 'ios' && showStartDatePicker && (
        <Button title="Done" onPress={() => setShowStartDatePicker(false)} />
      )}

      {/* --- End Date --- */}
      <Text style={styles.label}>End Date:</Text>
      {Platform.OS !== 'ios' && (
        <Button onPress={() => setShowEndDatePicker(true)} title={formatDate(endDate)} color="#555" />
      )}
      {(showEndDatePicker || Platform.OS === 'ios') && (
        <DateTimePicker
          testID="endDatePicker"
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onEndDateChange}
          minimumDate={startDate}
          style={styles.datePicker}
        />
      )}
      {Platform.OS === 'ios' && showEndDatePicker && (
        <Button title="Done" onPress={() => setShowEndDatePicker(false)} />
      )}

      <View style={styles.buttonContainer}>
        <Button title="Save Goal" onPress={handleSaveGoal} color={Colors.palette.success} />
      </View>
      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
    marginBottom: 10,
  },
  datePicker: {
    marginBottom: Platform.OS === 'ios' ? 0 : 10,
  },
  buttonContainer: {
    marginTop: 30,
    marginBottom: 20,
  }
});

export default AddGoalScreen;