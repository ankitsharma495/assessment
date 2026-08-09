module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
};
