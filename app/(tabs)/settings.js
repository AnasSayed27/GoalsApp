import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
    Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StorageService } from '../../services/StorageService';
import { STORAGE_KEYS } from '../../constants/StorageKeys';
import { Colors } from '../../constants/Colors';
import { exportData, importData, setupAutoBackup } from '../../services/BackupService';

const SettingsScreen = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
    const [isSettingUpAuto, setIsSettingUpAuto] = useState(false);

    useEffect(() => {
        loadAutoBackupStatus();
    }, []);

    const loadAutoBackupStatus = async () => {
        const enabled = await StorageService.get(STORAGE_KEYS.AUTO_BACKUP_ENABLED, false);
        setAutoBackupEnabled(enabled);
    };

    const handleExport = async () => {
        setIsExporting(true);
        await exportData();
        setIsExporting(false);
    };

    const handleImport = async () => {
        setIsImporting(true);
        await importData();
        setIsImporting(false);
    };

    const handleToggleAutoBackup = async () => {
        if (!autoBackupEnabled) {
            setIsSettingUpAuto(true);
            const success = await setupAutoBackup();
            if (success) {
                setAutoBackupEnabled(true);
            }
            setIsSettingUpAuto(false);
        } else {
            Alert.alert(
                "Disable Auto-Backup",
                "Are you sure you want to disable weekly auto-backups?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Disable",
                        style: "destructive",
                        onPress: async () => {
                            await StorageService.save(STORAGE_KEYS.AUTO_BACKUP_ENABLED, false);
                            setAutoBackupEnabled(false);
                        }
                    }
                ]
            );
        }
    };

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
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Settings</Text>

                {/* Backup & Restore Section */}
                <Text style={styles.sectionTitle}>Backup & Restore</Text>

                <TouchableOpacity
                    style={[styles.actionButton, styles.exportButton]}
                    onPress={handleExport}
                    disabled={isExporting}
                >
                    {isExporting ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Ionicons name="cloud-upload-outline" size={22} color="#fff" />
                            <Text style={styles.actionButtonText}>Export Backup</Text>
                        </>
                    )}
                </TouchableOpacity>
                <Text style={styles.infoText}>
                    Saves all your data (goals, tasks, streaks) to a file. You can save it to Google Drive, email, or your device.
                </Text>

                <TouchableOpacity
                    style={[styles.actionButton, styles.importButton]}
                    onPress={handleImport}
                    disabled={isImporting}
                >
                    {isImporting ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Ionicons name="cloud-download-outline" size={22} color="#fff" />
                            <Text style={styles.actionButtonText}>Restore from Backup</Text>
                        </>
                    )}
                </TouchableOpacity>
                <Text style={styles.infoText}>
                    Restores your data from a previously exported backup file. This will overwrite current data.
                </Text>

                <View style={styles.autoBackupContainer}>
                    <View style={styles.autoBackupTextContainer}>
                        <Text style={styles.autoBackupTitle}>Monthly Auto-Backup</Text>
                        <Text style={styles.autoBackupSubtitle}>
                            {autoBackupEnabled
                                ? "Enabled: Silently saving on the 1st of every month"
                                : "Disabled: Manually backup recommended"}
                        </Text>
                    </View>
                    {isSettingUpAuto ? (
                        <ActivityIndicator color={Colors.palette.primary} size="small" />
                    ) : (
                        <Switch
                            value={autoBackupEnabled}
                            onValueChange={handleToggleAutoBackup}
                            trackColor={{ false: "#d1d1d1", true: "#2ecc71" }}
                            thumbColor="#fff"
                        />
                    )}
                </View>
                {autoBackupEnabled && (
                    <TouchableOpacity
                        style={styles.changeFolderButton}
                        onPress={handleToggleAutoBackup}
                    >
                        <Text style={styles.changeFolderText}>Change Backup Folder</Text>
                    </TouchableOpacity>
                )}

                {/* Data Management Section */}
                <Text style={styles.sectionTitle}>Data Management</Text>

                <TouchableOpacity
                    style={[styles.actionButton, styles.warningButton]}
                    onPress={handleClearGoalsData}
                >
                    <Ionicons name="flag-outline" size={22} color="#fff" />
                    <Text style={styles.actionButtonText}>Clear Only Goal Data</Text>
                </TouchableOpacity>
                <Text style={styles.infoText}>
                    Deletes all goals and their tasks, but keeps streak history.
                </Text>

                <TouchableOpacity
                    style={[styles.actionButton, styles.dangerButton]}
                    onPress={handleClearAllData}
                >
                    <Ionicons name="trash-outline" size={22} color="#fff" />
                    <Text style={styles.actionButtonText}>Clear All App Data</Text>
                </TouchableOpacity>
                <Text style={styles.infoText}>
                    Warning: Permanently deletes all goals, tasks, and streak history.
                </Text>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.palette.background,
    },
    scrollContent: {
        alignItems: 'center',
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        color: Colors.palette.textPrimary,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.palette.textSecondary,
        marginTop: 25,
        marginBottom: 15,
        alignSelf: 'flex-start',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 15,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    exportButton: {
        backgroundColor: '#3498db', // Blue
    },
    importButton: {
        backgroundColor: '#2ecc71', // Green
    },
    warningButton: {
        backgroundColor: Colors.palette.warning || '#f39c12', // Orange
    },
    dangerButton: {
        backgroundColor: Colors.palette.danger || '#e74c3c', // Red
    },
    infoText: {
        fontSize: 13,
        color: Colors.palette.textSecondary,
        marginBottom: 15,
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    autoBackupContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
        marginBottom: 5,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    autoBackupTextContainer: {
        flex: 1,
        marginRight: 10,
    },
    autoBackupTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.palette.textPrimary,
        marginBottom: 2,
    },
    autoBackupSubtitle: {
        fontSize: 12,
        color: Colors.palette.textSecondary,
    },
    changeFolderButton: {
        marginBottom: 15,
    },
    changeFolderText: {
        fontSize: 12,
        color: '#3498db',
        textDecorationLine: 'underline',
    },
});

export default SettingsScreen; 