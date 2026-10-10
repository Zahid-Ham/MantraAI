module.exports = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^expo-constants$': '<rootDir>/__mocks__/expo-constants.js',
    '^expo/virtual/env$': '<rootDir>/__mocks__/expo-env.js',
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/async-storage.js',
  },
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
};
