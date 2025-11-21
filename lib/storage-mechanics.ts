import AsyncStorage from "@react-native-async-storage/async-storage";

export class StorageMechanics {
  static async set(key: StorageKeys, value: any) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key.toString(), jsonValue);
    } catch (e) {}
  }

  static async remove(key: StorageKeys) {
    try {
      await AsyncStorage.removeItem(key.toString());
    } catch (e) {}
  }

  static async getAllKeys() {
    return await AsyncStorage.getAllKeys();
  }

  static async clear() {
    await AsyncStorage.clear();
  }

  static async get(key: StorageKeys) {
    try {
      const jsonValue = await AsyncStorage.getItem(key.toString());
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      // error reading value
    }
  }

  /**
   * Convenience methods for push notification registration tracking.
   * - Stores a timestamp (ms since epoch) under StorageKeys.PUSH_NOTIFICATION_LAST_REGISTERED.
   * - `shouldUpdatePushRegistration` returns true when no timestamp exists or when the last
   *   registration is older than the provided interval (in days).
   */

  static async setLastPushRegistration(timestamp: number) {
    try {
      await StorageMechanics.set(
        StorageKeys.PUSH_NOTIFICATION_LAST_REGISTERED,
        timestamp,
      );
    } catch (e) {
      // ignore storage errors
    }
  }

  static async getLastPushRegistration(): Promise<number | null> {
    try {
      const v = await StorageMechanics.get(
        StorageKeys.PUSH_NOTIFICATION_LAST_REGISTERED,
      );
      if (v == null) return null;
      const num = typeof v === "number" ? v : Number(v);
      return Number.isNaN(num) ? null : num;
    } catch (e) {
      return null;
    }
  }

  /**
   * Returns true if push token registration should be updated.
   * Defaults to once every `intervalInDays` days (7 by default).
   */
  static async shouldUpdatePushRegistration(
    intervalInDays = 7,
  ): Promise<boolean> {
    try {
      const last = await StorageMechanics.getLastPushRegistration();
      if (!last) return true;
      const now = Date.now();
      const diff = now - last;
      const intervalMs = intervalInDays * 24 * 60 * 60 * 1000;
      return diff >= intervalMs;
    } catch (e) {
      // In case of error assume we should update
      return true;
    }
  }
}

export enum StorageKeys {
  USER = "user",
  HAS_ONBOARDING_COMPLETED = "has-onboarding-completed",
  WITHDRAWAL_OPTIONS = "withdrawal-options",
  PUSH_NOTIFICATION_LAST_REGISTERED = "push-notification-last-registered",
}
