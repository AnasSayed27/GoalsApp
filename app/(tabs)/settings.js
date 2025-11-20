import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Button,
    Alert,
    SafeAreaView
} from 'react-native';
import { StorageService } from '../../services/StorageService';
import { STORAGE_KEYS } from '../../constants/StorageKeys';
import { Colors } from '../../constants/Colors';

const SettingsScreen = () => {
    const handleClearGoalsData = () => {
        Alert.alert(
            "Confirm Deletion",
            "Are you sure you want to delete all goals? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Yes, Delete Goals",
                    onPress: async () => {
                        const success = await StorageService.remove(STORAGE_KEYS.GOALS);
                        if (success) {
                            Alert.alert("Success", "All goal data has been cleared.");
                        } else {
                            Alert.alert("Error", "Could not clear goal data.");
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const handleClearAllData = () => {
        Alert.alert(
            "Confirm Deletion",
            "Are you sure you want to delete ALL app data (goals, tasks, and streaks)? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Yes, Delete All",
                    onPress: async () => {
                        const success = await StorageService.multiRemove([
                            STORAGE_KEYS.GOALS,
                            STORAGE_KEYS.TASKS,
                            STORAGE_KEYS.STREAKS,
                            STORAGE_KEYS.LEGACY_STREAKS
                        ]);

                        if (success) {
                            Alert.alert("Success", "All app data has been cleared.");
                        } else {
                            Alert.alert("Error", "Could not clear app data.");
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Settings</Text>

            <Text style={styles.sectionTitle}>Data Management</Text>
            <View style={styles.buttonWrapper}>
                <Button
                    title="Clear Only Goal Data"
                    color={Colors.palette.warning}
                    onPress={handleClearGoalsData}
                />
                <Text style={styles.infoText}>
                    Deletes all goals and their tasks, but keeps streak history.
                </Text>
            </View>

            <View style={styles.buttonWrapper}>
                <Button
                    title="Clear All App Data"
                    color={Colors.palette.danger}
                    onPress={handleClearAllData}
                />
                <Text style={styles.infoText}>
                    Warning: Deletes all goals, tasks, and streak history.
                </Text>
            </View>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: Colors.palette.background,
        paddingTop: 20,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 25,
        color: Colors.palette.textPrimary,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.palette.textSecondary,
        marginTop: 20,
        marginBottom: 15,
        alignSelf: 'flex-start',
    },
    buttonWrapper: {
        width: '100%',
        alignItems: 'stretch',
        marginBottom: 20,
        padding: 15,
        backgroundColor: Colors.palette.card,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    infoText: {
        fontSize: 13,
        color: Colors.palette.textSecondary,
        marginTop: 8,
        textAlign: 'center',
    },
});

export default SettingsScreen; 