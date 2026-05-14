import React, { useCallback, useState } from 'react';
import {
  FlatList,
  TouchableOpacity,
  Text,
  View,
  SafeAreaView,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useGoals } from '../../../hooks/useGoals';
import { useRevisions } from '../../../hooks/useRevisions';
import { Colors } from '../../../constants/Colors';
import GoalCard from '../../../components/goals/GoalCard';
import EmptyState from '../../../components/common/EmptyState';
import RevisionBoard from '../../../components/revisions/RevisionBoard';

const GoalsScreen = () => {
  const router = useRouter();
  const { goals, deleteGoal } = useGoals();
  const {
    groups,
    addGroup,
    deleteGroup,
    toggleGroupCollapse,
    addItem,
    deleteItem,
    markItemRevised,
    updateItemIntervals,
    getStats,
  } = useRevisions();

  const [isRevisionBoardVisible, setIsRevisionBoardVisible] = useState(false);

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

  const revisionStats = getStats();
  const hasRevisionAlerts = revisionStats.overdue > 0 || revisionStats.dueToday > 0;

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

      {/* Floating Revision Board Button */}
      <TouchableOpacity
        style={styles.revisionFab}
        onPress={() => setIsRevisionBoardVisible(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="book-open-variant" size={24} color="#fff" />
        {hasRevisionAlerts && (
          <View style={styles.revisionBadge}>
            <Text style={styles.revisionBadgeText}>
              {revisionStats.overdue + revisionStats.dueToday}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Revision Board Modal */}
      <RevisionBoard
        visible={isRevisionBoardVisible}
        onClose={() => setIsRevisionBoardVisible(false)}
        groups={groups}
        onAddGroup={addGroup}
        onDeleteGroup={deleteGroup}
        onToggleCollapse={toggleGroupCollapse}
        onAddItem={addItem}
        onDeleteItem={deleteItem}
        onMarkRevised={markItemRevised}
        onUpdateIntervals={updateItemIntervals}
        stats={revisionStats}
      />
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
  revisionFab: {
    position: 'absolute',
    bottom: 80,
    right: 18,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.palette.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
  revisionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.palette.danger,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  revisionBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default GoalsScreen;