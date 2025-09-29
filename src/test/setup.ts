// Test setup file for Vitest
// This file is run before each test file

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Electron APIs if needed
global.window = global.window || {};

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Add any global test utilities or mocks here
