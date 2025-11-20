import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageService = {
    /**
     * Save data to storage
     * @param {string} key 
     * @param {any} value 
     */
    save: async (key, value) => {
        try {
            const jsonValue = JSON.stringify(value);
            await AsyncStorage.setItem(key, jsonValue);
            return true;
        } catch (e) {
            console.error(`StorageService: Failed to save to ${key}`, e);
            return false;
        }
    },

    /**
     * Get data from storage
     * @param {string} key 
     * @param {any} defaultValue - Value to return if key doesn't exist
     */
    get: async (key, defaultValue = null) => {
        try {
            const jsonValue = await AsyncStorage.getItem(key);
            return jsonValue != null ? JSON.parse(jsonValue) : defaultValue;
        } catch (e) {
            console.error(`StorageService: Failed to load from ${key}`, e);
            return defaultValue;
        }
    },

    /**
     * Remove specific key from storage
     * @param {string} key 
     */
    remove: async (key) => {
        try {
            await AsyncStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error(`StorageService: Failed to remove ${key}`, e);
            return false;
        }
    },

    /**
     * Clear multiple keys
     * @param {string[]} keys 
     */
    multiRemove: async (keys) => {
        try {
            await AsyncStorage.multiRemove(keys);
            return true;
        } catch (e) {
            console.error(`StorageService: Failed to multi-remove keys`, e);
            return false;
        }
    },

    /**
     * Clear all storage (Use with caution)
     */
    clearAll: async () => {
        try {
            await AsyncStorage.clear();
            return true;
        } catch (e) {
            console.error(`StorageService: Failed to clear all storage`, e);
            return false;
        }
    }
};
