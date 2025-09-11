module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  displayName: 'Backend Integration Tests',
  roots: ['<rootDir>/tests/integration'],
  testMatch: ['**/*.integration.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.ts'],
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  coverageDirectory: 'coverage/integration',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@cryptobot/types$': '<rootDir>/../packages/@cryptobot/types/src/index.ts',
    '^@cryptobot/database$': '<rootDir>/../packages/@cryptobot/database/src/index.ts',
    '^@cryptobot/indicators$': '<rootDir>/../packages/@cryptobot/indicators/src/index.ts',
    '^@cryptobot/exchanges$': '<rootDir>/../packages/@cryptobot/exchanges/src/index.ts',
    '^@cryptobot/trading$': '<rootDir>/../packages/@cryptobot/trading/src/index.ts',
  },
};