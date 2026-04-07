/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  watchman: false,
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss)$": "<rootDir>/__mocks__/styleMock.js",
  },
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          module: "commonjs",
          target: "es2020",
          moduleResolution: "node",
          baseUrl: ".",
          paths: { "@/*": ["./src/*"] },
          types: ["jest", "node", "@testing-library/jest-dom"],
        },
        diagnostics: false,
      },
    ],
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@bairronow|browser-image-compression|@microsoft/signalr)/)",
  ],
};
