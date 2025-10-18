module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/app.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true
};