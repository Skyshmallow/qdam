// Test setup file for Vitest
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Mapbox GL
vi.mock('mapbox-gl', () => ({
  default: {
    accessToken: 'test-token',
    Map: vi.fn(() => ({
      on: vi.fn(),
      off: vi.fn(),
      remove: vi.fn(),
      getCanvas: vi.fn(() => ({
        style: {}
      })),
      getSource: vi.fn(),
      addSource: vi.fn(),
      addLayer: vi.fn(),
    })),
    Marker: vi.fn(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
      getElement: vi.fn(() => ({
        style: {
          setProperty: vi.fn()
        }
      })),
    })),
    MercatorCoordinate: {
      fromLngLat: vi.fn(() => ({
        x: 0,
        y: 0,
        z: 0,
        meterInMercatorCoordinateUnits: () => 1,
      }))
    }
  }
}));

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(() => 1),
  clearWatch: vi.fn(),
};

Object.defineProperty(globalThis.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock IndexedDB (idb will use this)
const indexedDBMock = {
  open: vi.fn(),
};

Object.defineProperty(globalThis, 'indexedDB', {
  value: indexedDBMock,
  writable: true,
});

console.log('✅ Test setup complete');
