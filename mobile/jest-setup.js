// Jest setup for @bairronow/mobile
// Replaces the react-native preset setupFiles to avoid pnpm virtual store
// ESM transform issues with react-native/jest/setup.js

global.IS_REACT_ACT_ENVIRONMENT = true;
global.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;

global.__DEV__ = true;

// Minimal polyfills needed for React Native tests
if (!global.cancelAnimationFrame) {
  global.cancelAnimationFrame = function (id) { clearTimeout(id); };
}
if (!global.requestAnimationFrame) {
  global.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
}
