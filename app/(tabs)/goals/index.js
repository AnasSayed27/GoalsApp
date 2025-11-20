import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Progress from 'react-native-progress';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useGoalsData } from '../../../hooks/useGoalsData';
import { Colors } from '../../../constants/Colors';

const GoalsScreen = () => {
  const router = useRouter();
  const { goals, deleteGoal } = useGoalsData();

  const handleDeleteGoal = useCallback((goalId) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteGoal(goalId),
        },
      ]
    );
  }, [deleteGoal]);

  const renderGoalItem = ({ item }) => (
    <TouchableOpacity
      style={styles.goalItem}
      onPress={() => router.push({ pathname: '/goals/detail', params: { goalId: item.id } })}
      onLongPress={() => handleDeleteGoal(item.id)}
    >
      <Text style={styles.goalName}>{item.name}</Text>
      <Text style={styles.goalDates}>{`${item.startDate} - ${item.endDate}`}</Text>

      {/* Progress Bar Section */}
      <View style={styles.progressBarSection}>
        <Progress.Bar
          progress={item.progress || 0}
          width={null}
          color={Colors.palette.success}
          unfilledColor="#e0e0e0"
          borderWidth={0}
          height={14}
          borderRadius={8}
          style={{ flex: 1 }}
          animated={true}
        />
        <View style={styles.progressPercentContainer}>
          <Text style={styles.progressPercentText}>{`${Math.round((item.progress || 0) * 100)}%`}</Text>
          <MaterialCommunityIcons name="trophy" size={20} color={Colors.palette.warning} style={styles.trophyIcon} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {goals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No goals yet. Add one!</Text>
        </View>

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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: Colors.palette.textSecondary,
  },
  list: {
    paddingBottom: 10,
  },
  goalItem: {
    backgroundColor: Colors.palette.card,
    padding: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 10,
  },
  goalName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: Colors.palette.textPrimary,
  },
  goalDates: {
    fontSize: 14,
    color: Colors.palette.textSecondary,
    marginBottom: 10,
  },
  progressBarSection: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressPercentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    minWidth: 60,
  },
  progressPercentText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.palette.textPrimary,
    marginRight: 4,
  },
  trophyIcon: {
    marginLeft: 2,
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
  }
});

export default GoalsScreen;