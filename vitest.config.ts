// /Users/maceka/Projects/smartneet/vitest.config.ts
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom', // Mock browser environment
    mockReset: true, // Automatically reset mocks between tests
    setupFiles: ['./src/tests/setup.ts', './src/tests/vitest-setup.ts'], // Load env variables and Vitest setup before tests run
    typecheck: {
      tsconfig: './tsconfig.json'
    }
  },
});
