/**
 * Типы для эффектов сфер (Three.js)
 */

import * as THREE from 'three';

/**
 * Тип сферы (определяет цвет)
 */
export type SphereType = 'default' | 'enemy' | 'ally' | 'neutral';

/**
 * Конфигурация цвета эффекта
 */
export interface EffectColor {
  /** RGB цвет (0-255) */
  r: number;
  g: number;
  b: number;
  /** Альфа-канал (0-1) */
  a: number;
}

/**
 * Конфигурация одного эффекта сферы
 */
export interface SphereEffectConfig {
  /** Уникальный ID сферы */
  id: string;
  /** Координаты [lng, lat] */
  coordinates: [number, number];
  /** Тип сферы (определяет цвет) */
  type: SphereType;
  /** Кастомный цвет (опционально) */
  customColor?: EffectColor;
}

/**
 * Инстанс эффекта сферы (Three.js объекты)
 */
export interface SphereEffectInstance {
  /** ID сферы */
  id: string;
  /** Координаты */
  coordinates: [number, number];
  /** Тип */
  type: SphereType;
  /** Граница сферы */
  outline: THREE.Group; 
  /** Радар (вращающийся луч) */
  radar: THREE.Group;
  /** Плазменные волны */
  plasma: THREE.Group;
  /** Электрические искры */
  sparks: THREE.Group;
  /** Матрица трансформации (для Mapbox) */
  transform: {
    translateX: number;
    translateY: number;
    translateZ: number;
    rotateX: number;
    rotateY: number;
    rotateZ: number;
    scale: number;
  };
  /** Время жизни (для анимации) */
  time: number;
}

/**
 * Параметры для создания эффекта
 */
export interface CreateEffectParams {
  /** Радиус сферы (в метрах) */
  radius: number;
  /** Цвет эффекта */
  color: EffectColor;
  /** Интенсивность эффекта (0-1) */
  intensity?: number;
}

/**
 * Опции для менеджера эффектов
 */
export interface SphereEffectManagerOptions {
  /** Включить/выключить радар */
  enableRadar?: boolean;
  /** Включить/выключить плазму */
  enablePlasma?: boolean;
  /** Включить/выключить искры */
  enableSparks?: boolean;
  /** Глобальная интенсивность (0-1) */
  globalIntensity?: number;
}