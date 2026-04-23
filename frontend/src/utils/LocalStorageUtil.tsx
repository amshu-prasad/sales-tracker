// Utility for localStorage
export const localStorageUtil = {
  /**
   * Sets an item in localStorage
   * @param key - The key under which the value is stored
   * @param value - The value to store (any type)
   */
  setItem<T>(key: string, value: T): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error setting item in localStorage: ${error}`);
    }
  },

  /**
   * Gets an item from localStorage
   * @param key - The key of the value to retrieve
   * @returns The parsed value or null if not found
   */
  getItem<T>(key: string): T | null {
    try {
      const serializedValue = localStorage.getItem(key);
      if (!serializedValue) {
        return null;
      }
      try {
        // Attempt to parse as JSON
        return JSON.parse(serializedValue) as T;
      } catch {
        // If parsing fails, assume it's a plain string and return it
        return serializedValue as unknown as T;
      }
    } catch (error) {
      console.error(`Error getting item from localStorage: ${error}`);
      return null;
    }
  },

  /**
   * Removes an item from localStorage
   * @param key - The key of the value to remove
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item from localStorage: ${error}`);
    }
  },

  /**
   * Clears all items in localStorage
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error(`Error clearing localStorage: ${error}`);
    }
  },
};
