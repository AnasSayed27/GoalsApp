import React, { useCallback } from 'react';
import {
  FlatList,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGoals } from '../../../hooks/useGoals';
import { Colors } from '../../../constants/Colors';
import GoalCard from '../../../components/goals/GoalCard';
import EmptyState from '../../../components/common/EmptyState';

const GoalsScreen = () => {
  const router = useRouter();
  const { goals, deleteGoal } = useGoals();

  const handleDeleteGoal = useCallback((goalId) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(goalId) },
      ]
    );
  }, [deleteGoal]);

  const renderGoalItem = ({ item }) => (
    <GoalCard
      goal={item}
      onPress={() => router.push({ pathname: '/goals/detail', params: { goalId: item.id } })}
      onLongPress={() => handleDeleteGoal(item.id)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {goals.length === 0 ? (
        <EmptyState message="No goals yet. Add one!" icon="flag-outline" />
      ) : (
        <FlatList
          data={goals}
          renderItem={renderGoalItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/goals/add')}>
        <Text style={styles.addButtonText}>Add New Goal</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.palette.background,
    padding: 10,
  },
  list: {
    paddingBottom: 10,
  },
  addButton: {
    backgroundColor: Colors.palette.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GoalsScreen;