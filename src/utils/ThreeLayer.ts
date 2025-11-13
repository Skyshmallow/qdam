// src/utils/ThreeLayer.ts

import mapboxgl from 'mapbox-gl';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SphereEffectManager } from '../effects/sphere'; 
import { TerritoryEffect, type TerritoryConfig } from '../effects/territory';

const MODEL_SCALE = 25;

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
  private castleObjects = new Map<string, { mesh: THREE.Group; transform: any }>();
  
  // Sphere Effect Manager
  private sphereManager?: SphereEffectManager;
  private lastFrameTime: number = 0;
  private territoryEffect?: TerritoryEffect;

  private pendingChainsData: Array<{ 
    id: number; 
    start: [number, number]; 
    end: [number, number]; 
    startCoords: [number, number]; 
    endCoords: [number, number] 
  }> | null = null;

  private log(step: string, details?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    const detailsLog = details ? JSON.stringify(details) : '';
    console.log(`[${timestamp}][ThreeLayer:${this.id}] ${step}`, detailsLog);
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
    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    });
    this.renderer.autoClear = false;

    // Add lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambient);
    const sunlight = new THREE.DirectionalLight(0xffffff, 0.75);
    sunlight.position.set(0, -70, 100).normalize();
    this.scene.add(sunlight);

    // Initialize Sphere Manager
    this.sphereManager = new SphereEffectManager(this.scene, {
      enableRadar: true,
      enablePlasma: true,
      enableSparks: true,
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
      instanceCount: 15000, // ✅ Густая трава
      map: this.map,
    };

    this.territoryEffect = new TerritoryEffect(config);
    this.scene.add(this.territoryEffect.getGroup());
  }

  // Render castles + spheres + territory
  // ✅ ПРАВИЛЬНЫЙ ПОРЯДОК: Сферы → Территория → Замки
  render(_gl: WebGLRenderingContext, matrix: number[]): void {
    if (!this.renderer || !this.map) return;

    // Calculate deltaTime
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    // ✅ Обновляем анимацию травы
    if (this.territoryEffect) {
      this.territoryEffect.update(deltaTime);
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

    // ✅ СЛОЙ 2: Рендерим территорию (средний слой - закрывает сферы)
    if (this.territoryEffect) {
      this.renderTerritory(baseMatrix);
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

  // Render a single castle with its own transform
  private renderCastle(baseMatrix: THREE.Matrix4, mesh: THREE.Group, transform: any): void {
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
  
  public setChains(chains: Array<{
    id: number; 
    start: [number, number]; 
    end: [number, number];
    startCoords: [number, number];
    endCoords: [number, number];
  }>): void {
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

    const transform = {
      translateX: mercatorCoords.x,
      translateY: mercatorCoords.y,
      translateZ: mercatorCoords.z,
      rotateX: Math.PI / 2,
      rotateY: Math.random() * Math.PI * 2,
      rotateZ: 0,
      scale: mercatorCoords.meterInMercatorCoordinateUnits(),
    };

    const castleMesh = this.castleModel.clone();
    castleMesh.position.set(0, 0, 0); 
    castleMesh.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);

    this.castleObjects.set(id, { mesh: castleMesh, transform });
    this.log('Added new castle', { id, coords });
  }
}