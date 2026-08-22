import { exportData, importData } from '../BackupService';
import { StorageService } from '../StorageService';
import { STORAGE_KEYS } from '../../constants/StorageKeys';
import { APP_IDENTIFIER } from '../../constants/Config';
import * as FileSystem from 'expo-file-system';

import { Alert } from 'react-native';

describe('BackupService', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await StorageService.clearAll();
        jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
            if (buttons && buttons.length > 0) {
                const restoreBtn = buttons.find(b => b.text === 'Restore');
                if (restoreBtn && restoreBtn.onPress) {
                    restoreBtn.onPress();
                }
            }
        });
    });

    test('exports full backup payload containing all 4 domains (GOALS, TASKS, STREAKS, REVISIONS)', async () => {
        // Seed storage with data across all 4 keys
        const mockGoals = [{ id: 'g1', name: 'Master React Native' }];
        const mockTasks = [{ id: 't1', name: 'Morning Routine', duration: 1 }];
        const mockStreaks = { heatmapData: { '2026-08-22': 3.5 } };
        const mockRevisions = [{ id: 'rg1', name: 'Algorithms', items: [] }];

        await StorageService.save(STORAGE_KEYS.GOALS, mockGoals);
        await StorageService.save(STORAGE_KEYS.TASKS, mockTasks);
        await StorageService.save(STORAGE_KEYS.STREAKS, mockStreaks);
        await StorageService.save(STORAGE_KEYS.REVISIONS, mockRevisions);

        let writtenContent = null;
        FileSystem.writeAsStringAsync.mockImplementationOnce((uri, content) => {
            writtenContent = JSON.parse(content);
            return Promise.resolve();
        });

        const success = await exportData();
        expect(success).toBe(true);
        expect(writtenContent).toBeDefined();
        expect(writtenContent.appIdentifier).toBe(APP_IDENTIFIER);
        expect(writtenContent.data[STORAGE_KEYS.GOALS]).toEqual(mockGoals);
        expect(writtenContent.data[STORAGE_KEYS.TASKS]).toEqual(mockTasks);
        expect(writtenContent.data[STORAGE_KEYS.STREAKS]).toEqual(mockStreaks);
        expect(writtenContent.data[STORAGE_KEYS.REVISIONS]).toEqual(mockRevisions);
    });

    test('restores all 4 domains during import', async () => {
        const backupPayload = {
            appIdentifier: APP_IDENTIFIER,
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            data: {
                [STORAGE_KEYS.GOALS]: [{ id: 'g100', name: 'Restored Goal' }],
                [STORAGE_KEYS.TASKS]: [{ id: 't100', name: 'Restored Task', duration: 2 }],
                [STORAGE_KEYS.STREAKS]: { heatmapData: { '2026-08-01': 5 } },
                [STORAGE_KEYS.REVISIONS]: [{ id: 'rg100', name: 'Restored Revisions', items: [] }],
            },
        };

        FileSystem.readAsStringAsync.mockResolvedValueOnce(JSON.stringify(backupPayload));

        const success = await importData();
        expect(success).toBe(true);

        const restoredGoals = await StorageService.get(STORAGE_KEYS.GOALS);
        const restoredTasks = await StorageService.get(STORAGE_KEYS.TASKS);
        const restoredStreaks = await StorageService.get(STORAGE_KEYS.STREAKS);
        const restoredRevisions = await StorageService.get(STORAGE_KEYS.REVISIONS);

        expect(restoredGoals).toEqual(backupPayload.data[STORAGE_KEYS.GOALS]);
        expect(restoredTasks).toEqual(backupPayload.data[STORAGE_KEYS.TASKS]);
        expect(restoredStreaks).toEqual(backupPayload.data[STORAGE_KEYS.STREAKS]);
        expect(restoredRevisions).toEqual(backupPayload.data[STORAGE_KEYS.REVISIONS]);
    });

    test('pruneOldBackups deletes oldest files when count exceeds MAX_AUTO_BACKUPS', async () => {
        const { pruneOldBackups } = require('../BackupService');

        const mockFiles = [
            'file:///storage/AutoBackup_2026-01-01',
            'file:///storage/AutoBackup_2026-02-01',
            'file:///storage/AutoBackup_2026-03-01',
            'file:///storage/AutoBackup_2026-04-01',
        ];

        FileSystem.StorageAccessFramework.readDirectoryAsync.mockResolvedValueOnce(mockFiles);
        FileSystem.StorageAccessFramework.deleteAsync.mockResolvedValue();

        // Limit to 2 backups
        await pruneOldBackups('file:///storage', 2);

        // Should delete the 2 oldest files: Jan and Feb
        expect(FileSystem.StorageAccessFramework.deleteAsync).toHaveBeenCalledTimes(2);
        expect(FileSystem.StorageAccessFramework.deleteAsync).toHaveBeenCalledWith('file:///storage/AutoBackup_2026-01-01');
        expect(FileSystem.StorageAccessFramework.deleteAsync).toHaveBeenCalledWith('file:///storage/AutoBackup_2026-02-01');
    });
});
