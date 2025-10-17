// src/utils/ThreeLayer.ts

import mapboxgl from 'mapbox-gl';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

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

  // ✅ FIXED: Store each castle with its INDEPENDENT transform
  private castleObjects = new Map<string, { mesh: THREE.Group; transform: any }>();
  
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
  }

  // ✅ FIXED: Render each castle INDEPENDENTLY
  render(_gl: WebGLRenderingContext, matrix: number[]): void {
    if (!this.renderer || !this.map) return;

    const baseMatrix = new THREE.Matrix4().fromArray(matrix);

    // Render each castle with its own transform
    this.castleObjects.forEach((castle) => {
      this.renderCastle(baseMatrix, castle.mesh, castle.transform);
    });

    this.map.triggerRepaint();
  }

  // ✅ NEW: Render a single castle with its own transform
  private renderCastle(baseMatrix: THREE.Matrix4, mesh: THREE.Group, transform: any): void {
    const { translateX, translateY, translateZ, rotateX, rotateY, rotateZ, scale } = transform;

    const rotationX = new THREE.Matrix4().makeRotationX(rotateX);
    const rotationY = new THREE.Matrix4().makeRotationY(rotateY);
    const rotationZ = new THREE.Matrix4().makeRotationZ(rotateZ);

    // ✅ FIXED: Build transform matrix for THIS castle ONLY
    const localTransformMatrix = new THREE.Matrix4()
      .makeTranslation(translateX, translateY, translateZ)
      .scale(new THREE.Vector3(scale, -scale, scale))
      .multiply(rotationX)
      .multiply(rotationY)
      .multiply(rotationZ);

    this.camera.projectionMatrix = baseMatrix.clone().multiply(localTransformMatrix);
    
    // ✅ FIXED: Create temp scene with ONLY this castle
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
    this.castleObjects.forEach(castle => {
      // Remove mesh from temp scene (it was never added to main scene)
      castle.mesh.clear();
    });
    this.castleObjects.clear();
    this.scene.clear();
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
  
  // ✅ FIXED: Create castle with ABSOLUTE coordinates
  private addOrUpdateCastle(id: string, coords: [number, number]): void {
    if (this.castleObjects.has(id) || !this.castleModel) {
      return;
    }

    // ✅ Calculate ABSOLUTE transform for this castle
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
    // ✅ Position at origin of its own coordinate system
    castleMesh.position.set(0, 0, 0); 
    castleMesh.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
    
    // ✅ DON'T add to main scene - we render it separately
    // this.scene.add(castleMesh); // ← REMOVE THIS LINE

    this.castleObjects.set(id, { mesh: castleMesh, transform });
    this.log('Added new castle', { id, coords });
  }
}