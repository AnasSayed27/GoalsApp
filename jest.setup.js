/* eslint-env jest */
// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo FileSystem
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///data/user/0/com.uac.Goals/files/',
  cacheDirectory: 'file:///data/user/0/com.uac.Goals/cache/',
  EncodingType: {
    UTF8: 'utf8',
  },
  readAsStringAsync: jest.fn().mockResolvedValue('{}'),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1024 }),
  StorageAccessFramework: {
    requestDirectoryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true, directoryUri: 'content://mock/dir' }),
    createFileAsync: jest.fn().mockResolvedValue('content://mock/dir/file.json'),
    readDirectoryAsync: jest.fn().mockResolvedValue([]),
    deleteAsync: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock Expo Sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock Expo DocumentPicker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///mock/backup.json', name: 'backup.json', size: 1024 }],
  }),
}));
