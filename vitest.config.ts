import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '.',
    exclude: ['node_modules/**'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'lcov', 'html'],
      reportOnFailure: true,
      exclude: ['tests/**', '*.config.*'],
    },
  },
});
