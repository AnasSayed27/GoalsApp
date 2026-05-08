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
  
  const defaultEndDate = new Date();
  defaultEndDate.setDate(defaultEndDate.getDate() + (12 * 7));
  const [endDate, setEndDate] = useState(defaultEndDate);
  
  const [weeksLength, setWeeksLength] = useState('12');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const router = useRouter();
  const { addGoal } = useGoalsData();

  const onStartDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(Platform.OS === 'ios');
    setStartDate(currentDate);
    
    const wks = parseFloat(weeksLength) || 0;
    if (wks > 0) {
        const newEndDate = new Date(currentDate);
        newEndDate.setDate(newEndDate.getDate() + Math.round(wks * 7));
        setEndDate(newEndDate);
    } else if (currentDate > endDate) {
      setEndDate(currentDate);
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(Platform.OS === 'ios');
    setEndDate(currentDate);
    
    const diffTime = currentDate.getTime() - startDate.getTime();
    const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const weeks = diffDays / 7;
    setWeeksLength(weeks.toFixed(1).replace('.0', ''));
  };

  const onWeeksLengthChange = (text) => {
      setWeeksLength(text);
      const wks = parseFloat(text);
      if (!isNaN(wks) && wks >= 0) {
          const newEndDate = new Date(startDate);
          newEndDate.setDate(newEndDate.getDate() + Math.round(wks * 7));
          setEndDate(newEndDate);
      }
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

      {/* --- Duration in Weeks --- */}
      <Text style={styles.label}>Duration (Weeks):</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 12"
        keyboardType="numeric"
        value={weeksLength}
        onChangeText={onWeeksLengthChange}
      />

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