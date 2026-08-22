import AsyncStorage from '@react-native-async-storage/async-storage';

// Per-key queue mapping: key -> Promise chain
const mutationLocks = new Map();

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
     * Atomically mutates a key in storage by serializing transformations through a Promise queue.
     * Guarantees that concurrent read-modify-write operations on the same key do not overwrite each other.
     *
     * @param {string} key - AsyncStorage key
     * @param {Function} transformFn - Synchronous or asynchronous function (currentValue) => updatedValue
     * @param {any} [defaultValue=null] - Default value if key is missing
     * @returns {Promise<any>} The updated value
     */
    mutate: async (key, transformFn, defaultValue = null) => {
        const currentLock = mutationLocks.get(key) || Promise.resolve();

        let releaseLock;
        const nextLock = new Promise((resolve) => {
            releaseLock = resolve;
        });

        mutationLocks.set(key, nextLock);

        try {
            await currentLock;
            const currentData = await StorageService.get(key, defaultValue);
            const transformedData = await transformFn(currentData);
            await StorageService.save(key, transformedData);
            return transformedData;
        } finally {
            releaseLock();
            if (mutationLocks.get(key) === nextLock) {
                mutationLocks.delete(key);
            }
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
