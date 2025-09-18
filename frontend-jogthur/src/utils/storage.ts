import { MMKV } from 'react-native-mmkv';

// Initialize MMKV storage instance
export const storage = new MMKV({
  id: 'fittracker-storage',
  encryptionKey: 'fittracker-encryption-key', // In production, use a secure key
});

// Storage utility functions
export const StorageUtils = {
  // Generic get/set functions
  getString: (key: string): string | undefined => storage.getString(key),
  setString: (key: string, value: string): void => storage.set(key, value),
  
  getNumber: (key: string): number | undefined => storage.getNumber(key),
  setNumber: (key: string, value: number): void => storage.set(key, value),
  
  getBoolean: (key: string): boolean | undefined => storage.getBoolean(key),
  setBoolean: (key: string, value: boolean): void => storage.set(key, value),
  
  // JSON object storage
  getObject: <T>(key: string): T | undefined => {
    const jsonString = storage.getString(key);
    return jsonString ? JSON.parse(jsonString) : undefined;
  },
  
  setObject: <T>(key: string, value: T): void => {
    storage.set(key, JSON.stringify(value));
  },
  
  // Delete functions
  delete: (key: string): void => storage.delete(key),
  clearAll: (): void => storage.clearAll(),
  
  // Check if key exists
  contains: (key: string): boolean => storage.contains(key),
  
  // Get all keys
  getAllKeys: (): string[] => storage.getAllKeys(),
};

export default StorageUtils;