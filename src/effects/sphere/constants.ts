/**
 * Константы для эффектов сфер
 */

import type { EffectColor, SphereType } from './types';

const radiusFromEnv = import.meta.env.VITE_SPHERE_RADIUS_KM;
const SPHERE_RADIUS_KM = parseFloat(radiusFromEnv) || 0.5;
const SPHERE_RADIUS_METERS = SPHERE_RADIUS_KM * 1000;

/**
 * Цвета для разных типов сфер
 */
export const SPHERE_COLORS: Record<SphereType, EffectColor> = {
  // ✅ Жёлтый (Lightning 3) - по умолчанию
  default: {
    r: 251,
    g: 191,
    b: 36,
    a: 1.0
  },
  
  // Красный (враги)
  enemy: {
    r: 239,
    g: 68,
    b: 68,
    a: 1.0
  },
  
  // Зелёный (союзники)
  ally: {
    r: 16,
    g: 185,
    b: 129,
    a: 1.0
  },
  
  // Синий (нейтральные)
  neutral: {
    r: 59,
    g: 130,
    b: 246,
    a: 1.0
  }
};

/**
 * ✅ Тёмные цвета для светлой темы карты (более контрастные)
 */
export const SPHERE_COLORS_LIGHT: Record<SphereType, EffectColor> = {
  // Тёмно-оранжевый (виден на светлом)
  default: {
    r: 180,
    g: 83,
    b: 9,
    a: 1.0
  },
  
  // Тёмно-красный
  enemy: {
    r: 185,
    g: 28,
    b: 28,
    a: 1.0
  },
  
  // Тёмно-зелёный
  ally: {
    r: 5,
    g: 122,
    b: 85,
    a: 1.0
  },
  
  // Тёмно-синий
  neutral: {
    r: 30,
    g: 64,
    b: 175,
    a: 1.0
  }
};

/**
 * Размеры эффектов (в метрах)
 */
export const EFFECT_SIZES = {
  /** Радар */
  radar: {
    /** Длина луча (половина диаметра сферы) */
    length: SPHERE_RADIUS_METERS,
    /** Толщина луча */
    width: 1.5,
    /** Высота над землёй */
    height: 2
  },
  
  /** Плазменные кольца */
  plasma: {
    /** Минимальный радиус */
    minRadius: SPHERE_RADIUS_METERS * 0.5,
    /** Максимальный радиус */
    maxRadius: SPHERE_RADIUS_METERS,
    /** Количество одновременных колец */
    ringCount: 2,
    /** Толщина кольца */
    thickness: 3
  },
  
  /** Искры */
  sparks: {
    /** Количество частиц в облаке */
    count: 500,
    /** Максимальный радиус, в котором летают частицы */
    maxRadius: SPHERE_RADIUS_METERS * 0.8, // Чуть меньше основной сферы
    /** Базовая скорость движения частиц */
    particleSpeed: 0.01,
    /** Масштаб "вихрей" шума. Меньше -> плавнее и крупнее вихри */
    noiseScale: 2.0,
    /** Скорость эволюции поля шума (как быстро меняются вихри) */
    noiseSpeed: 0.2,
    /** Минимальный и максимальный размер частиц */
    minSize: 5.0, 
    maxSize: 8.0,
  },

  /** Внешняя граница (кольцо) */
  outline: {
    /** Радиус центральной линии кольца */
    radius: SPHERE_RADIUS_METERS,
    /** Толщина кольца */
    thickness: 2
  }
} as const;

/**
 * Скорости анимации
 */
export const ANIMATION_SPEEDS = {
  /** Радар (радиан/секунда) */
  radarRotation: Math.PI / 2, // 90° в секунду (4 секунды на оборот)
  
  /** Плазма (расширение колец) */
  plasmaExpansion: 30, // метров/секунду
  
  /** Плазма (интервал между кольцами) */
  plasmaInterval: 1.5, // секунд
} as const;

/**
 * Параметры визуализации
 */
export const VISUAL_PARAMS = {
  /** Opacity для радара */
  radarOpacity: {
    start: 0.0,  // Прозрачный в начале
    end: 1.0     // Непрозрачный в конце
  },
  
  /** Opacity для плазмы */
  plasmaOpacity: {
    start: 0.8,  // Яркое в начале
    end: 0.0     // Исчезает в конце
  },
  
  /** Opacity для искр */
  sparksOpacity: {
    min: 0.0,    // Выключено
    max: 1.0     // Максимальная яркость
  },
  
  /** Свечение (glow) */
  glow: {
    intensity: 0.6,
    size: 25     // пиксели
  }
} as const;

/**
 * Настройки производительности
 */
export const PERFORMANCE_CONFIG = {
  /** Максимальное количество сфер */
  maxSpheres: 200,
  
  /** Упрощать эффекты при большом зуме */
  lodEnabled: true,
  
  /** Уровни детализации (zoom levels) */
  lodLevels: {
    high: 15,    // zoom > 15 — все эффекты
    medium: 12,  // zoom 12-15 — упрощённые эффекты
    low: 0       // zoom < 12 — минимальные эффекты
  },
  
  /** Использовать instanced rendering */
  useInstancing: true
} as const;

/**
 * Конфигурация по умолчанию для новой сферы
 */
export const DEFAULT_SPHERE_CONFIG = {
  type: 'default' as SphereType,
  intensity: 1.0,
  enableRadar: true,
  enablePlasma: true,
  enableSparks: true
} as const;