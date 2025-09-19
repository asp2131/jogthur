/**
 * Mock MMKV implementation for development/fallback
 */
export class MockMMKV {
  private storage: Map<string, string> = new Map();

  constructor(config?: { id?: string; encryptionKey?: string }) {
    // Mock constructor - just store config if needed
  }

  set(key: string, value: string): void {
    this.storage.set(key, value);
  }

  getString(key: string): string | undefined {
    return this.storage.get(key);
  }

  delete(key: string): void {
    this.storage.delete(key);
  }

  getAllKeys(): string[] {
    return Array.from(this.storage.keys());
  }

  clearAll(): void {
    this.storage.clear();
  }

  contains(key: string): boolean {
    return this.storage.has(key);
  }

  getNumber(key: string): number | undefined {
    const value = this.storage.get(key);
    return value ? Number(value) : undefined;
  }

  setNumber(key: string, value: number): void {
    this.storage.set(key, value.toString());
  }

  getBoolean(key: string): boolean | undefined {
    const value = this.storage.get(key);
    return value ? value === 'true' : undefined;
  }

  setBoolean(key: string, value: boolean): void {
    this.storage.set(key, value.toString());
  }
}

// Export as MMKV for compatibility
export const MMKV = MockMMKV;
