import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, Platform } from 'react-native';
import { StorageService } from './StorageService';
import { STORAGE_KEYS } from '../constants/StorageKeys';

const BACKUP_VERSION = 1;
const APP_IDENTIFIER = 'com.uac.Goals';

/**
 * Creates a backup of all app data and triggers a save/share operation.
 * @param {string} [customDirUri] - Optional specific directory URI (for auto-backup).
 * @returns {Promise<boolean>} - True if export succeeded, false otherwise.
 */
export const exportData = async (customDirUri = null) => {
    try {
        // 1. Gather all data from AsyncStorage
        const streaksData = await StorageService.get(STORAGE_KEYS.STREAKS, {});
        const goalsData = await StorageService.get(STORAGE_KEYS.GOALS, []);
        const tasksData = await StorageService.get(STORAGE_KEYS.TASKS, []);

        // 2. Create a structured backup object
        const backupPayload = {
            appIdentifier: APP_IDENTIFIER,
            version: BACKUP_VERSION,
            createdAt: new Date().toISOString(),
            data: {
                [STORAGE_KEYS.STREAKS]: streaksData,
                [STORAGE_KEYS.GOALS]: goalsData,
                [STORAGE_KEYS.TASKS]: tasksData,
            },
        };

        const jsonContent = JSON.stringify(backupPayload, null, 2);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = customDirUri ? `AutoBackup_${timestamp}` : `GoalsApp_Backup_${timestamp}`;

        // 3. Automated Save to specific directory (used by Auto-Backup)
        if (customDirUri) {
            try {
                const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
                    customDirUri,
                    fileName,
                    'application/json'
                );

                await FileSystem.writeAsStringAsync(fileUri, jsonContent, {
                    encoding: FileSystem.EncodingType.UTF8,
                });
                return true;
            } catch (autoError) {
                console.error('BackupService: Auto-save failed', autoError);
                return false;
            }
        }

        // 4. Android-specific Direct Save (Manual)
        if (Platform.OS === 'android') {
            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

            if (permissions.granted) {
                try {
                    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
                        permissions.directoryUri,
                        fileName,
                        'application/json'
                    );

                    await FileSystem.writeAsStringAsync(fileUri, jsonContent, {
                        encoding: FileSystem.EncodingType.UTF8,
                    });

                    Alert.alert('Success', 'Backup saved successfully to your selected location.');
                    return true;
                } catch (saveError) {
                    console.error('BackupService: SAF save failed', saveError);
                    // Fallback to sharing if direct save fails
                }
            }
        }

        // 5. Fallback (iOS or if SAF was cancelled/failed on Android)
        const cachePath = `${FileSystem.cacheDirectory}${fileName}.json`;
        await FileSystem.writeAsStringAsync(cachePath, jsonContent, {
            encoding: FileSystem.EncodingType.UTF8,
        });

        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
            await Sharing.shareAsync(cachePath, {
                mimeType: 'application/json',
                dialogTitle: 'Save your GoalsApp Backup',
                UTI: 'public.json',
            });
            return true;
        } else {
            if (!customDirUri) Alert.alert('Error', 'Sharing/Saving is not available on this device.');
            return false;
        }

    } catch (error) {
        console.error('BackupService: Export failed', error);
        if (!customDirUri) Alert.alert('Export Failed', `An error occurred: ${error.message}`);
        return false;
    }
};

/**
 * Sets up a persistent directory for auto-backups.
 */
export const setupAutoBackup = async () => {
    try {
        if (Platform.OS !== 'android') {
            Alert.alert('Info', 'Auto-backup to a specific folder is currently only available on Android.');
            return false;
        }

        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (permissions.granted) {
            await StorageService.save(STORAGE_KEYS.AUTO_BACKUP_DIR_URI, permissions.directoryUri);
            await StorageService.save(STORAGE_KEYS.AUTO_BACKUP_ENABLED, true);
            // Mark last backup as now to start the tracking
            await StorageService.save(STORAGE_KEYS.LAST_AUTO_BACKUP_TIME, new Date().getTime());

            Alert.alert('Auto-Backup Enabled', 'The app will now automatically save a backup on the 1st of every month to this folder.');
            return true;
        }
        return false;
    } catch (error) {
        console.error('BackupService: Setup auto-backup failed', error);
        return false;
    }
};

/**
 * Checks if it's the 1st of the month and runs a silent backup if enabled.
 */
export const checkAndRunAutoBackup = async () => {
    try {
        const isEnabled = await StorageService.get(STORAGE_KEYS.AUTO_BACKUP_ENABLED, false);
        const dirUri = await StorageService.get(STORAGE_KEYS.AUTO_BACKUP_DIR_URI, null);
        const lastBackupTime = await StorageService.get(STORAGE_KEYS.LAST_AUTO_BACKUP_TIME, 0);

        if (!isEnabled || !dirUri) return;

        const now = new Date();
        const lastBackup = new Date(lastBackupTime);

        // Logic: 
        // 1. Must be the 1st day of the month
        // 2. Must not have already backed up this month (different month OR different year)
        const isFirstDayOfMonth = now.getDate() === 1;
        const differentMonth = now.getMonth() !== lastBackup.getMonth();
        const differentYear = now.getFullYear() !== lastBackup.getFullYear();

        if (isFirstDayOfMonth && (differentMonth || differentYear)) {
            const success = await exportData(dirUri);
            if (success) {
                await StorageService.save(STORAGE_KEYS.LAST_AUTO_BACKUP_TIME, now.getTime());
                console.log('Auto-Backup: Success for the 1st of the month');
            }
        }
    } catch (error) {
        console.warn('BackupService: Auto-backup check failed', error);
    }
};

/**
 * Imports data from a user-selected JSON file.
 * @returns {Promise<boolean>} - True if import succeeded, false otherwise.
 */
export const importData = async () => {
    try {
        // 1. Open the document picker
        const result = await DocumentPicker.getDocumentAsync({
            type: 'application/json',
            copyToCacheDirectory: true, // Important for reading the file
        });

        // Check if user cancelled
        if (result.canceled) {
            return false;
        }

        const fileUri = result.assets[0].uri;

        // 2. Read the file content
        const jsonContent = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.UTF8,
        });

        // 3. Parse and validate
        let backupPayload;
        try {
            backupPayload = JSON.parse(jsonContent);
        } catch (parseError) {
            Alert.alert('Invalid File', 'The selected file is not valid JSON.');
            return false;
        }

        // 4. Validate backup structure
        if (!backupPayload || typeof backupPayload !== 'object') {
            Alert.alert('Invalid Backup', 'The file structure is not recognized.');
            return false;
        }

        if (backupPayload.appIdentifier !== APP_IDENTIFIER) {
            Alert.alert(
                'Wrong Backup File',
                'This backup file was not created by the GoalsApp.'
            );
            return false;
        }

        if (!backupPayload.data || typeof backupPayload.data !== 'object') {
            Alert.alert('Invalid Backup', 'The backup file does not contain valid data.');
            return false;
        }

        // 5. Confirm with the user
        const confirmRestore = await new Promise((resolve) => {
            Alert.alert(
                'Restore Data?',
                `This will OVERWRITE all your current data with the backup from ${new Date(backupPayload.createdAt).toLocaleString()}. This action cannot be undone. Are you sure?`,
                [
                    { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                    { text: 'Restore', style: 'destructive', onPress: () => resolve(true) },
                ]
            );
        });

        if (!confirmRestore) {
            return false;
        }

        // 6. Restore data to AsyncStorage
        const dataToRestore = backupPayload.data;

        if (dataToRestore[STORAGE_KEYS.STREAKS] !== undefined) {
            await StorageService.save(STORAGE_KEYS.STREAKS, dataToRestore[STORAGE_KEYS.STREAKS]);
        }
        if (dataToRestore[STORAGE_KEYS.GOALS] !== undefined) {
            await StorageService.save(STORAGE_KEYS.GOALS, dataToRestore[STORAGE_KEYS.GOALS]);
        }
        if (dataToRestore[STORAGE_KEYS.TASKS] !== undefined) {
            await StorageService.save(STORAGE_KEYS.TASKS, dataToRestore[STORAGE_KEYS.TASKS]);
        }

        Alert.alert(
            'Restore Complete',
            'Your data has been successfully restored. Please restart the app for all changes to take effect.',
            [{ text: 'OK' }]
        );

        return true;
    } catch (error) {
        console.error('BackupService: Import failed', error);
        Alert.alert('Import Failed', `An error occurred: ${error.message}`);
        return false;
    }
};
