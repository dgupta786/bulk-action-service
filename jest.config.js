/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/index.ts',
    '!src/configs/**/*.ts',
    '!src/constants/**/*.ts',
    '!src/interfaces/**/*.ts',
    '!src/**/interface.ts',
    '!src/**/*.d.ts'
  ],
  coverageDirectory: './coverage',
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 70,
      statements: 70
    }
  },
  // Handle nullish assignment operator in dependencies
  transformIgnorePatterns: [
    '/node_modules/(?!bson|mongodb-connection-string-url|whatwg-url|tr46|webidl-conversions)'
  ]
};
