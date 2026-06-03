import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// We don't enable Vitest `globals`, so Testing Library's auto-cleanup is not
// registered. Unmount rendered components after each test — this also cancels
// any in-flight requestAnimationFrame from the radar animation before teardown.
afterEach(() => {
  cleanup();
});
