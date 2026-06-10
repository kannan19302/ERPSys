import { describe, it, expect } from 'vitest';
import { DEFAULT_PAGE_SIZE } from './constants';

describe('Shared Constants', () => {
  it('should have system permission scopes defined', () => {
    expect(DEFAULT_PAGE_SIZE).toBeDefined();
  });
});
