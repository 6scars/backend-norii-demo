export default {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests-jest/**/*.test.js'],
  transform: {},
  setupFiles: ['<rootDir>/tests-jest/setup/environment.js'],
  clearMocks: true,
  verbose: true
};
