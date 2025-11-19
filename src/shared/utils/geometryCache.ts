/**
 * Geometry Cache for Three.js
 * 
 * Кэширует геометрии для переиспользования и избежания дублирования в памяти.
 * Вместо создания новой геометрии каждый раз, мы клонируем из кэша.
 */

import * as THREE from 'three';

type GeometryType = 'sphere' | 'plane' | 'box' | 'cylinder';

class GeometryCache {
  private static instance: GeometryCache;
  private cache = new Map<string, THREE.BufferGeometry>();
  private stats = {
    hits: 0,
    misses: 0,
    size: 0,
  };

  private constructor() {
    console.log('[GeometryCache] Initialized');
  }

  static getInstance(): GeometryCache {
    if (!this.instance) {
      this.instance = new GeometryCache();
    }
    return this.instance;
  }

  /**
   * Генерирует ключ для кэша
   */
  private generateKey(type: GeometryType, params: unknown[]): string {
    return `${type}:${JSON.stringify(params)}`;
  }

  /**
   * Получить геометрию из кэша или создать новую
   */
  private getOrCreate(
    key: string,
    creator: () => THREE.BufferGeometry
  ): THREE.BufferGeometry {
    if (this.cache.has(key)) {
      this.stats.hits++;
      const cached = this.cache.get(key)!;
      return cached.clone();
    }

    this.stats.misses++;
    const geometry = creator();
    this.cache.set(key, geometry);
    this.stats.size = this.cache.size;

    return geometry.clone();
  }

  /**
   * Получить сферу (для замков, сфер влияния)
   */
  getSphere(radius: number, widthSegments: number = 32, heightSegments: number = 32): THREE.SphereGeometry {
    const key = this.generateKey('sphere', [radius, widthSegments, heightSegments]);
    return this.getOrCreate(
      key,
      () => new THREE.SphereGeometry(radius, widthSegments, heightSegments)
    ) as THREE.SphereGeometry;
  }

  /**
   * Получить плоскость (для травы, земли)
   */
  getPlane(
    width: number,
    height: number,
    widthSegments: number = 1,
    heightSegments: number = 1
  ): THREE.PlaneGeometry {
    const key = this.generateKey('plane', [width, height, widthSegments, heightSegments]);
    return this.getOrCreate(
      key,
      () => new THREE.PlaneGeometry(width, height, widthSegments, heightSegments)
    ) as THREE.PlaneGeometry;
  }

  /**
   * Получить куб (для зданий, препятствий)
   */
  getBox(width: number, height: number, depth: number): THREE.BoxGeometry {
    const key = this.generateKey('box', [width, height, depth]);
    return this.getOrCreate(
      key,
      () => new THREE.BoxGeometry(width, height, depth)
    ) as THREE.BoxGeometry;
  }

  /**
   * Получить цилиндр (для столбов, колонн)
   */
  getCylinder(
    radiusTop: number,
    radiusBottom: number,
    height: number,
    radialSegments: number = 32
  ): THREE.CylinderGeometry {
    const key = this.generateKey('cylinder', [radiusTop, radiusBottom, height, radialSegments]);
    return this.getOrCreate(
      key,
      () => new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
    ) as THREE.CylinderGeometry;
  }

  /**
   * Получить кольцо (для эффектов сфер, плазмы)
   */
  getRing(
    innerRadius: number,
    outerRadius: number,
    thetaSegments: number = 32,
    phiSegments: number = 1
  ): THREE.RingGeometry {
    const key = `ring:${JSON.stringify([innerRadius, outerRadius, thetaSegments, phiSegments])}`;
    return this.getOrCreate(
      key,
      () => new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments, phiSegments)
    ) as THREE.RingGeometry;
  }

  /**
   * Очистить весь кэш (вызывать при unmount или смене сцены)
   */
  clear(): void {
    this.cache.forEach(geometry => geometry.dispose());
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, size: 0 };
    console.log('[GeometryCache] Cleared');
  }

  /**
   * Удалить конкретную геометрию из кэша
   */
  remove(type: GeometryType, params: unknown[]): void {
    const key = this.generateKey(type, params);
    const geometry = this.cache.get(key);
    if (geometry) {
      geometry.dispose();
      this.cache.delete(key);
      this.stats.size = this.cache.size;
    }
  }

  /**
   * Получить статистику кэша
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(1)
      : '0.0';

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
    };
  }

  /**
   * Логировать статистику
   */
  logStats(): void {
    const stats = this.getStats();
    console.log('[GeometryCache] Stats:', stats);
  }
}

// Singleton export
export const geometryCache = GeometryCache.getInstance();

// Export class for testing
export { GeometryCache };
