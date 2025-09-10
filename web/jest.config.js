module.exports = {
    testEnvironment: 'jsdom',
    transform: {
      '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    setupFilesAfterEnv: [
      '@testing-library/jest-dom',
      '<rootDir>/src/test-utils/setup.ts'
    ],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
      '^@components/(.*)$': '<rootDir>/src/components/$1',
      '^@services/(.*)$': '<rootDir>/src/services/$1',
      '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
      '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    },
    collectCoverageFrom: [
      'src/**/*.{js,jsx,ts,tsx}',
      '!src/**/*.d.ts',
      '!src/**/*.stories.{js,jsx,ts,tsx}',
      '!src/**/*.test.{js,jsx,ts,tsx}',
      '!src/**/index.{js,jsx,ts,tsx}',
      '!src/types/**/*',
    ],
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  };