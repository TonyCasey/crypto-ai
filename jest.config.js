module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  testMatch: [
    '**/packages/**/?(*.)+(spec|test).ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: 'node',
        target: 'es2020',
        module: 'commonjs',
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@cryptobot)/)'
  ],
  collectCoverageFrom: [
    'packages/**/*.ts',
    '!packages/**/*.d.ts',
    '!packages/**/index.ts',
    '!packages/**/*.test.ts',
    '!packages/**/*.spec.ts',
    '!packages/**/dist/**',
    '!packages/**/node_modules/**',
  ],
  moduleNameMapper: {
    '^@cryptobot/types$': '<rootDir>/packages/@cryptobot/types/src/index.ts',
    '^@cryptobot/indicators$': '<rootDir>/packages/@cryptobot/indicators/src/index.ts',
    '^@cryptobot/exchanges$': '<rootDir>/packages/@cryptobot/exchanges/src/index.ts',
    '^@cryptobot/database$': '<rootDir>/packages/@cryptobot/database/src/index.ts',
    '^@cryptobot/trading$': '<rootDir>/packages/@cryptobot/trading/src/index.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};