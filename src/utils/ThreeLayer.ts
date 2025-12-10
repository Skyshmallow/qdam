// src/utils/ThreeLayer.ts

import mapboxgl from 'mapbox-gl';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SphereEffectManager } from '../effects/sphere';
import { TerritoryEffect, type TerritoryConfig } from '../effects/territory';
import { gpuDetector } from '@shared/utils/gpuDetector';

const MODEL_SCALE = 15;

export interface Transform {
  translateX: number;
  translateY: number;
  translateZ: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  scale: number;
}

export interface ChainData {
  id: string;
  start: [number, number];
  end: [number, number];
  startCoords: [number, number];
  endCoords: [number, number];
}

export class ThreeLayer implements mapboxgl.CustomLayerInterface {
  id: string;
  type: 'custom';
  renderingMode: '3d';

  private map?: mapboxgl.Map;
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private renderer?: THREE.WebGLRenderer;
  private castleModel?: THREE.Group;

  // Castles
  private castleObjects = new Map<string, { mesh: THREE.Group; transform: Transform }>();

  // Sphere Effect Manager
  private sphereManager?: SphereEffectManager;
  private lastFrameTime: number = 0;
  private territoryEffect?: TerritoryEffect;
  private otherTerritoryEffects: Map<string, TerritoryEffect> = new Map();

  private pendingChainsData: ChainData[] | null = null;

  private log(step: string, details?: Record<string, unknown>): void {
    // Log only in development mode with debug flag
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_THREE_LAYER) {
      const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
      const detailsLog = details ? JSON.stringify(details) : '';
      console.log(`[${timestamp}][ThreeLayer:${this.id}] ${step}`, detailsLog);
    }
  }

  constructor(id: string) {
    this.id = id;
    this.type = 'custom';
    this.renderingMode = '3d';
    this.camera = new THREE.Camera();
    this.scene = new THREE.Scene();

    this.log('Initialized');
  }

  onAdd(map: mapboxgl.Map, gl: WebGLRenderingContext): void {
    this.map = map;

    // ✅ GPU Detection for adaptive quality
    const gpuInfo = gpuDetector.gpuInfo;
    const settings = gpuDetector.settings;
    this.log('GPU Detection', {
      tier: gpuInfo.tier,
      renderer: gpuInfo.renderer,
      grassCount: settings.grassInstanceCount
    });

    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: settings.antialias,
    });
    this.renderer.autoClear = false;

    // Add lighting (adjust count based on GPU tier)
    const ambient = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambient);

    if (settings.maxLights >= 2) {
      const sunlight = new THREE.DirectionalLight(0xffffff, 0.75);
      sunlight.position.set(0, -70, 100).normalize();
      this.scene.add(sunlight);
    }

    // Initialize Sphere Manager (disable effects on low-end)
    this.sphereManager = new SphereEffectManager(this.scene, {
      enableRadar: settings.enableSphereEffects,
      enablePlasma: settings.enableSphereEffects,
      enableSparks: settings.enableSphereEffects,
    });
    this.log('SphereEffectManager initialized');

    // Territory will be created from real game data via updateTerritory()

    // Load 3D model
    const loader = new GLTFLoader();
    loader.load(
      './castle.glb',
      (gltf) => {
        this.castleModel = gltf.scene;
        this.log('Model loaded successfully');

        if (this.pendingChainsData) {
          this.log('Processing pending data after model load');
          this.setChains(this.pendingChainsData);
          this.pendingChainsData = null;
        }
      },
      undefined,
      (error) => console.error(`[ThreeLayer:${this.id}] ERROR: Model loading failed`, error)
    );

    // Start animation loop
    this.lastFrameTime = performance.now();
  }

  public updateTerritory(territoryGeoJSON: GeoJSON.Feature | null): void {
    // ✅ Удаляем старую территорию всегда
    if (this.territoryEffect) {
      this.scene.remove(this.territoryEffect.getGroup());
      this.territoryEffect.dispose();
      this.territoryEffect = undefined;
    }

    // ✅ Если territoryGeoJSON null - просто выходим (территория удалена)
    if (!territoryGeoJSON || territoryGeoJSON.geometry.type !== 'Polygon') {
      return;
    }

    // Получаем координаты из GeoJSON
    const coordinates = territoryGeoJSON.geometry.coordinates[0] as [number, number][];

    // ✅ Определяем цвет по владельцу территории
    const owner = territoryGeoJSON.properties?.owner || 'player';

    let color: { r: number; g: number; b: number; a: number };

    if (owner === 'player') {
      color = { r: 16, g: 185, b: 129, a: 1.0 }; // Зелёный
    } else if (owner === 'enemy') {
      color = { r: 239, g: 68, b: 68, a: 1.0 }; // Красный
    } else if (owner === 'ally') {
      color = { r: 59, g: 130, b: 246, a: 1.0 }; // Синий
    } else {
      color = { r: 156, g: 163, b: 175, a: 1.0 }; // Серый (неизвестный)
    }

    const config: TerritoryConfig = {
      coordinates,
      color,
      instanceCount: gpuDetector.settings.grassInstanceCount, // ✅ Adaptive grass count
      map: this.map,
    };

    this.territoryEffect = new TerritoryEffect(config);
    this.scene.add(this.territoryEffect.getGroup());
  }

  /**
   * Update other players' territories with their colors
   */
  public updateOtherTerritories(
    territories: Array<{
      userId: string;
      territory: GeoJSON.Feature<GeoJSON.Polygon> | null;
      color: string;
    }>
  ): void {
    // Remove territories that no longer exist
    const currentUserIds = new Set(territories.map(t => t.userId));
    for (const [userId, effect] of this.otherTerritoryEffects.entries()) {
      if (!currentUserIds.has(userId)) {
        this.scene.remove(effect.getGroup());
        effect.dispose();
        this.otherTerritoryEffects.delete(userId);
      }
    }

    // Update or create territories
    territories.forEach(({ userId, territory, color }) => {
      // Remove old territory for this user
      const existingEffect = this.otherTerritoryEffects.get(userId);
      if (existingEffect) {
        this.scene.remove(existingEffect.getGroup());
        existingEffect.dispose();
        this.otherTerritoryEffects.delete(userId);
      }

      // Create new territory if exists
      if (territory && territory.geometry.type === 'Polygon') {
        const coordinates = territory.geometry.coordinates[0] as [number, number][];

        // Parse hex color to RGB
        const hexColor = color.replace('#', '');
        const colorRGB = {
          r: parseInt(hexColor.substring(0, 2), 16),
          g: parseInt(hexColor.substring(2, 4), 16),
          b: parseInt(hexColor.substring(4, 6), 16),
          a: 1.0,
        };

        const config: TerritoryConfig = {
          coordinates,
          color: colorRGB,
          instanceCount: gpuDetector.settings.grassInstanceCount,
          map: this.map,
        };

        const newEffect = new TerritoryEffect(config);
        this.scene.add(newEffect.getGroup());
        this.otherTerritoryEffects.set(userId, newEffect);
      }
    });
  }

  // Render castles + spheres + territory
  // ✅ ПРАВИЛЬНЫЙ ПОРЯДОК: Сферы → Территория → Замки
  render(_gl: WebGLRenderingContext, matrix: number[]): void {
    if (!this.renderer || !this.map) return;

    // Calculate deltaTime
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    // ✅ Обновляем анимацию травы (своей территории)
    if (this.territoryEffect) {
      this.territoryEffect.update(deltaTime);
    }

    // ✅ Обновляем анимацию травы (других игроков)
    for (const effect of this.otherTerritoryEffects.values()) {
      effect.update(deltaTime);
    }

    const baseMatrix = new THREE.Matrix4().fromArray(matrix);

    // UPDATE sphere animations FIRST (before rendering!)
    if (this.sphereManager) {
      this.sphereManager.update(deltaTime);
    }

    // ✅ СЛОЙ 1: Рендерим сферы ПЕРВЫМИ (нижний слой)
    if (this.sphereManager && this.renderer) {
      this.sphereManager.render(_gl, baseMatrix, this.renderer, this.camera);
    }

    // ✅ СЛОЙ 2: Рендерим территории (средний слой - закрывает сферы)
    // Own territory
    if (this.territoryEffect) {
      this.renderTerritory(baseMatrix);
    }

    // Other players' territories
    for (const effect of this.otherTerritoryEffects.values()) {
      this.renderOtherTerritory(baseMatrix, effect);
    }

    // ✅ СЛОЙ 3: Рендерим замки ПОСЛЕДНИМИ (верхний слой - видны поверх всего)
    this.castleObjects.forEach((castle) => {
      this.renderCastle(baseMatrix, castle.mesh, castle.transform);
    });

    this.map.triggerRepaint();
  }
  /**
   * ✅ Рендерит территорию с transform matrix (как замки/сферы)
   */
  private renderTerritory(baseMatrix: THREE.Matrix4): void {
    if (!this.territoryEffect || !this.renderer) return;

    const { translateX, translateY, translateZ, rotateX, rotateY, rotateZ, scale } = this.territoryEffect.transform;

    // Создаём матрицы вращения
    const rotationX = new THREE.Matrix4().makeRotationX(rotateX);
    const rotationY = new THREE.Matrix4().makeRotationY(rotateY);
    const rotationZ = new THREE.Matrix4().makeRotationZ(rotateZ);

    // ✅ TRANSFORM MATRIX КАК У ЗАМКОВ/СФЕР
    const localTransform = new THREE.Matrix4()
      .makeTranslation(translateX, translateY, translateZ)
      .scale(new THREE.Vector3(scale, -scale, scale)) // ← КЛЮЧ! Масштаб через матрицу
      .multiply(rotationX)
      .multiply(rotationY)
      .multiply(rotationZ);

    this.camera.projectionMatrix = baseMatrix.clone().multiply(localTransform);

    // Создаём временную сцену
    const tempScene = new THREE.Scene();

    // Добавляем освещение
    this.scene.children
      .filter(child => child instanceof THREE.Light)
      .forEach(light => tempScene.add(light.clone()));

    // Добавляем территорию
    const grassGroup = this.territoryEffect.getGroup();
    if (grassGroup.parent === this.scene) {
      this.scene.remove(grassGroup);
    }
    tempScene.add(grassGroup);

    // Рендерим
    this.renderer.resetState();
    this.renderer.render(tempScene, this.camera);

    // Возвращаем в основную сцену
    tempScene.remove(grassGroup);
    this.scene.add(grassGroup);

    // Очищаем
    tempScene.clear();
  }

  /**
   * ✅ Рендерит территорию другого игрока
   */
  private renderOtherTerritory(baseMatrix: THREE.Matrix4, effect: TerritoryEffect): void {
    if (!this.renderer) return;

    const { translateX, translateY, translateZ, rotateX, rotateY, rotateZ, scale } = effect.transform;

    // Создаём матрицы вращения
    const rotationX = new THREE.Matrix4().makeRotationX(rotateX);
    const rotationY = new THREE.Matrix4().makeRotationY(rotateY);
    const rotationZ = new THREE.Matrix4().makeRotationZ(rotateZ);

    // Transform matrix
    const localTransform = new THREE.Matrix4()
      .makeTranslation(translateX, translateY, translateZ)
      .scale(new THREE.Vector3(scale, -scale, scale))
      .multiply(rotationX)
      .multiply(rotationY)
      .multiply(rotationZ);

    this.camera.projectionMatrix = baseMatrix.clone().multiply(localTransform);

    // Создаём временную сцену
    const tempScene = new THREE.Scene();

    // Добавляем освещение
    this.scene.children
      .filter(child => child instanceof THREE.Light)
      .forEach(light => tempScene.add(light.clone()));

    // Добавляем территорию
    const grassGroup = effect.getGroup();
    if (grassGroup.parent === this.scene) {
      this.scene.remove(grassGroup);
    }
    tempScene.add(grassGroup);

    // Рендерим
    this.renderer.resetState();
    this.renderer.render(tempScene, this.camera);

    // Возвращаем в основную сцену
    tempScene.remove(grassGroup);
    this.scene.add(grassGroup);

    // Очищаем
    tempScene.clear();
  }

  // Render a single castle with its own transform
  private renderCastle(baseMatrix: THREE.Matrix4, mesh: THREE.Group, transform: Transform): void {
    const { translateX, translateY, translateZ, rotateX, rotateY, rotateZ, scale } = transform;

    const rotationX = new THREE.Matrix4().makeRotationX(rotateX);
    const rotationY = new THREE.Matrix4().makeRotationY(rotateY);
    const rotationZ = new THREE.Matrix4().makeRotationZ(rotateZ);

    // Build transform matrix for THIS castle ONLY
    const localTransformMatrix = new THREE.Matrix4()
      .makeTranslation(translateX, translateY, translateZ)
      .scale(new THREE.Vector3(scale, -scale, scale))
      .multiply(rotationX)
      .multiply(rotationY)
      .multiply(rotationZ);

    this.camera.projectionMatrix = baseMatrix.clone().multiply(localTransformMatrix);

    // Create temp scene with ONLY this castle
    const tempScene = new THREE.Scene();
    tempScene.add(mesh);

    // Add lights to temp scene
    this.scene.children
      .filter(child => child instanceof THREE.Light)
      .forEach(light => tempScene.add(light.clone()));

    // Render ONLY this castle
    this.renderer!.resetState();
    this.renderer!.render(tempScene, this.camera);
  }

  onRemove(): void {
    // Cleanup castles
    this.castleObjects.forEach(castle => {
      castle.mesh.clear();
    });
    this.castleObjects.clear();

    //  Cleanup spheres
    if (this.sphereManager) {
      this.sphereManager.dispose();
      this.sphereManager = undefined;
    }

    this.scene.clear();
    this.log('Layer removed and cleaned up');
  }

  // Public method to sync spheres with GeoJSON
  public updateSpheres(spheresGeoJSON: GeoJSON.FeatureCollection): void {
    if (!this.sphereManager) {
      console.warn('[ThreeLayer] SphereManager not initialized yet');
      return;
    }

    this.sphereManager.syncWithGeoJSON(spheresGeoJSON);
    this.log('Spheres updated', { count: this.sphereManager.getSphereCount() });
  }

  public setChains(chains: ChainData[]): void {
    if (!this.castleModel) {
      this.log('Model not ready, queuing data');
      this.pendingChainsData = chains;
      return;
    }

    const allCastleIdsInNewData = new Set<string>();
    chains.forEach(chain => {
      allCastleIdsInNewData.add(`${chain.id}-start`);
      allCastleIdsInNewData.add(`${chain.id}-end`);
    });

    // Remove old castles
    this.castleObjects.forEach((castle, id) => {
      if (!allCastleIdsInNewData.has(id)) {
        castle.mesh.clear();
        this.castleObjects.delete(id);
      }
    });

    // Add new castles
    chains.forEach(chain => {
      this.addOrUpdateCastle(`${chain.id}-start`, chain.startCoords);
      this.addOrUpdateCastle(`${chain.id}-end`, chain.endCoords);
    });
  }

  //  Create castle with ABSOLUTE coordinates
  private addOrUpdateCastle(id: string, coords: [number, number]): void {
    if (this.castleObjects.has(id) || !this.castleModel) {
      return;
    }

    // Calculate ABSOLUTE transform for this castle
    const mercatorCoords = mapboxgl.MercatorCoordinate.fromLngLat(coords, 0);
    const meterScale = mercatorCoords.meterInMercatorCoordinateUnits();

    // ✅ Lift castle above ground (15 meters elevation)
    const CASTLE_ELEVATION_METERS = 30;
    const elevationOffset = CASTLE_ELEVATION_METERS * meterScale;

    const transform = {
      translateX: mercatorCoords.x,
      translateY: mercatorCoords.y,
      translateZ: mercatorCoords.z + elevationOffset,
      rotateX: Math.PI / 2,
      rotateY: Math.random() * Math.PI * 2,
      rotateZ: 0,
      scale: meterScale,
    };

    const castleMesh = this.castleModel.clone();
    castleMesh.position.set(0, 0, 0);
    castleMesh.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);

    this.castleObjects.set(id, { mesh: castleMesh, transform });
    this.log('Added new castle', { id, coords });
  }

  /**
   * ✅ Установить тему карты (для корректного отображения сфер)
   */
  public setTheme(theme: 'light' | 'dark'): void {
    if (this.sphereManager) {
      this.sphereManager.setTheme(theme);
    }
  }
}