// Simple test to verify test setup is working
import { describe, it, expect } from 'vitest';

describe('Phase 0: Test Setup', () => {
  it('should run basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to test environment', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });

  it('should have mocked geolocation', () => {
    expect(navigator.geolocation).toBeDefined();
    expect(typeof navigator.geolocation.getCurrentPosition).toBe('function');
  });

  it('should have mocked localStorage', () => {
    expect(localStorage).toBeDefined();
    expect(typeof localStorage.getItem).toBe('function');
    expect(typeof localStorage.setItem).toBe('function');
  });
});
