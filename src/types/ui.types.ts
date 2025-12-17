/**
 * UI Types for QDAM Application
 * Содержит типы для UI компонентов (overlays, notifications, etc.)
 */

// ============================================
// Notification Types
// ============================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number; // В миллисекундах (default: 3000)
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================
// Overlay Types
// ============================================

export type OverlayType = 'profile' | 'history' | 'layers' | null;

// ============================================
// Profile Types
// ============================================

export interface ProfileData {
  username: string;
  avatar: string | null; // URL или null для default
  level: number; // Заглушка: 1
  stats: {
    totalChains: number;
    totalDistance: number; // в км
    territoryCovered: number; // в км²
  };
  joinedDate: number; // timestamp
  achievements: {
    unlocked: number; // Заглушка: 0
    total: number;    // Заглушка: 50
  };
}

// ============================================
// Map Style Types
// ============================================

export interface MapStyle {
  id: string;
  name: string;
  url: string;
  preview: string; // URL миниатюры
  category: 'light' | 'dark' | 'satellite';
}

// ============================================
// History Types
// ============================================

export interface HistoryEntry {
  id: string;
  chainId: string;
  date: number; // timestamp
  distance: number; // в метрах
  duration: number; // в секундах
  isSimulation: boolean;
}
