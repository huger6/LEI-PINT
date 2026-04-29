'use strict';

module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    testTimeout: 30000,
    verbose: true,
    forceExit: true,
    clearMocks: true,
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
