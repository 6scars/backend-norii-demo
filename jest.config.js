export default {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests-jest/**/*.test.js'],
  transform: {},
  setupFiles: ['<rootDir>/tests-jest/setup/environment.js'],
  clearMocks: true,
  verbose: true,
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './test-reports',
        filename: 'jest-report.html',
        pageTitle: 'Backend Spotify test report',
        expand: true
      }
    ]
  ]
};
