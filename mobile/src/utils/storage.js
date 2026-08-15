import AsyncStorage from "@react-native-async-storage/async-storage";

// In-memory fallback dictionary
const memoryStorage = {};

const SafeStorage = {
  getItem: async (key) => {
    try {
      const val = await AsyncStorage.getItem(key);
      return val;
    } catch (e) {
      return memoryStorage[key] || null;
    }
  },
  setItem: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      memoryStorage[key] = value;
    }
  },
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      delete memoryStorage[key];
    }
  }
};

export default SafeStorage;
