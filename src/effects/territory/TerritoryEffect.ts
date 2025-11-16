/**
 * TerritoryEffect - трава на территории игрока
 * Использует InstancedMesh для производительности
 */
import * as THREE from 'three';
import mapboxgl from 'mapbox-gl';
import { point, polygon } from '@turf/helpers';
import distance from '@turf/distance';
import bbox from '@turf/bbox';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { GRASS_VERTEX_SHADER } from './shaders/grass.vert';
import { GRASS_FRAGMENT_SHADER } from './shaders/grass.frag';
import type { EffectColor } from '../sphere/types';
import { geometryCache } from '@shared/utils/geometryCache';

export interface TerritoryConfig {
  coordinates: [number, number][];
  color: EffectColor;
  instanceCount?: number;
  map?: mapboxgl.Map;
}

export class TerritoryEffect {
  private group: THREE.Group;
  private instancedMesh: THREE.InstancedMesh;
  private material: THREE.ShaderMaterial;
  private groundMesh: THREE.Mesh; // ← Добавляем ссылку на основание
  private dummy: THREE.Object3D;
  private time: number = 0;
  
  public transform: {
    translateX: number;
    translateY: number;
    translateZ: number;
    rotateX: number;
    rotateY: number;
    rotateZ: number;
    scale: number;
  };
  
  constructor(config: TerritoryConfig) {
    this.group = new THREE.Group();
    this.dummy = new THREE.Object3D();
    
    // ✅ Adaptive instance count (будет настроено из ThreeLayer на основе GPU)
    const instanceCount = config.instanceCount || 15000;
    
    // ✅ Вычисляем центр и масштаб территории
    const centerCoords = this.calculateCenterSimple(config.coordinates);
    const centerMercator = mapboxgl.MercatorCoordinate.fromLngLat(centerCoords, 0);
    const meterScale = centerMercator.meterInMercatorCoordinateUnits();
    
    // ✅ Transform: центр территории + правильный масштаб
    this.transform = {
      translateX: centerMercator.x,
      translateY: centerMercator.y,
      translateZ: centerMercator.z,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      scale: meterScale, // ← Масштаб для данной широты
    };
    
    // ✅ Вычисляем ТЕМНЫЙ оттенок для основания (земля)
    // Формула: Темный = Основной цвет * 0.3 (30% яркости)
    const darkGroundColor = new THREE.Color(
      (config.color.r / 255) * 0.3,
      (config.color.g / 255) * 0.3,
      (config.color.b / 255) * 0.3
    );
    
    // ✅ Создаём темное основание территории (земля под травой)
    const groundShape = this.createGroundShape(config.coordinates, [centerCoords[0], centerCoords[1]]);
    const groundGeometry = new THREE.ShapeGeometry(groundShape);
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: darkGroundColor, // ← Динамический темный цвет
      side: THREE.DoubleSide,
      depthTest: true,
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundMesh.position.z = 0; // Земля на уровне 0
    this.groundMesh.renderOrder = 0; // Рендерить ПЕРВОЙ
    this.group.add(this.groundMesh);
    
    // ✅ ВЕРТИКАЛЬНАЯ трава в МЕТРАХ - используем cached геометрию
    const bladeGeometry = geometryCache.getPlane(0.5, 3.0, 1, 4);
    bladeGeometry.rotateX(Math.PI / 2); // ← КЛЮЧЕВОЕ! Поворот в вертикальное положение
    bladeGeometry.translate(0, 0, 1.5); // Сдвиг вверх по Z (трава растет вверх)
    
    // ✅ Вычисляем СВЕТЛЫЙ оттенок для травы
    // Формула: Светлый = Основной цвет * 1.2 + 0.1 (увеличиваем яркость на 20% + добавляем 10%)
    const lightGrassColor = new THREE.Vector3(
      Math.min((config.color.r / 255) * 1.2 + 0.1, 1.0),
      Math.min((config.color.g / 255) * 1.2 + 0.1, 1.0),
      Math.min((config.color.b / 255) * 1.2 + 0.1, 1.0)
    );
    
    console.log('🎨 [TerritoryEffect] Colors:', {
      owner: config.color,
      darkGround: darkGroundColor,
      lightGrass: lightGrassColor
    });

    this.material = new THREE.ShaderMaterial({
      vertexShader: GRASS_VERTEX_SHADER,
      fragmentShader: GRASS_FRAGMENT_SHADER,
      uniforms: {
        time: { value: 0 },
        baseColor: { value: lightGrassColor } // ← Используем светлый цвет
      },
      side: THREE.DoubleSide,
      depthTest: true,
      depthWrite: true,
      transparent: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    
    this.instancedMesh = new THREE.InstancedMesh(bladeGeometry, this.material, instanceCount);
    this.instancedMesh.renderOrder = 1; // ← Рендерить ПОСЛЕ земли

    this.positionGrassBlades(config.coordinates, centerCoords, instanceCount);
    this.group.add(this.instancedMesh);
  }
  
  private calculateCenterSimple(coords: [number, number][]): [number, number] {
    let sumLng = 0, sumLat = 0;
    coords.forEach(([lng, lat]) => {
      sumLng += lng;
      sumLat += lat;
    });
    return [sumLng / coords.length, sumLat / coords.length];
  }
  
  /**
   * Создаёт Shape для темно-зеленого основания территории
   */
  private createGroundShape(coords: [number, number][], center: [number, number]): THREE.Shape {
    const [centerLng, centerLat] = center;
    const shape = new THREE.Shape();
    
    coords.forEach((coord, index) => {
      const [lng, lat] = coord;
      
      // Конвертируем в метры от центра
      const distanceX = distance(
        point([centerLng, centerLat]),
        point([lng, centerLat]),
        { units: 'meters' }
      );
      const distanceY = distance(
        point([centerLng, centerLat]),
        point([centerLng, lat]),
        { units: 'meters' }
      );
      
      const localX = lng > centerLng ? distanceX : -distanceX;
      const localY = lat > centerLat ? distanceY : -distanceY;
      
      if (index === 0) {
        shape.moveTo(localX, localY);
      } else {
        shape.lineTo(localX, localY);
      }
    });
    
    shape.closePath();
    return shape;
  }
  
  private positionGrassBlades(coords: [number, number][], center: [number, number], count: number): void {
    // Создаем полигон, убедившись, что он замкнут
    const poly = polygon([[...coords, coords[0]]]);
    const box = bbox(poly);
    
    // Используем ПЕРЕДАННЫЙ центр, а не вычисляем новый
    const [centerLng, centerLat] = center;
    
    console.log('🌿 [TerritoryEffect] Positioning grass relative to simple center:', [centerLng, centerLat]);
    
    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 10;
    
    while (placed < count && attempts < maxAttempts) {
      const lng = box[0] + Math.random() * (box[2] - box[0]);
      const lat = box[1] + Math.random() * (box[3] - box[1]);
      const pt = point([lng, lat]);
      
      if (booleanPointInPolygon(pt, poly)) {
        // Все дальнейшие расчеты теперь используют тот же центр, что и земля
        const distanceX = distance(point([centerLng, centerLat]), point([lng, centerLat]), { units: 'meters' });
        const distanceY = distance(point([centerLng, centerLat]), point([centerLng, lat]), { units: 'meters' });
        
        const localX = lng > centerLng ? distanceX : -distanceX;
        const localY = lat > centerLat ? distanceY : -distanceY;
        
        this.dummy.position.set(localX, localY, 0);
        
        const randomHeight = 0.8 + Math.random() * 1.7;
        const randomWidth = 0.8 + Math.random() * 0.4;
        this.dummy.scale.set(randomWidth, randomWidth, randomHeight);
        this.dummy.rotation.z = Math.random() * Math.PI * 2;
        
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(placed, this.dummy.matrix);
        placed++;
      }
      
      attempts++;
    }
    
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    
    console.log('🌿 [TerritoryEffect] Placement complete:', {
      requested: count,
      placed: placed,
    });
  }


  update(deltaTime: number): void {
    this.time += deltaTime;
    this.material.uniforms.time.value = this.time;
  }
  
  /**
   * Изменить цвет территории (для разных игроков)
   * Обновляет как основание (темный), так и траву (светлый)
   */
  setColor(color: EffectColor): void {
    // ✅ Обновляем темное основание (земля)
    const darkGroundColor = new THREE.Color(
      (color.r / 255) * 0.3,
      (color.g / 255) * 0.3,
      (color.b / 255) * 0.3
    );
    (this.groundMesh.material as THREE.MeshBasicMaterial).color = darkGroundColor;
    
    // ✅ Обновляем светлую траву
    const lightGrassColor = new THREE.Vector3(
      Math.min((color.r / 255) * 1.2 + 0.1, 1.0),
      Math.min((color.g / 255) * 1.2 + 0.1, 1.0),
      Math.min((color.b / 255) * 1.2 + 0.1, 1.0)
    );
    this.material.uniforms.baseColor.value = lightGrassColor;
    
    console.log('🎨 [TerritoryEffect] setColor() called:', {
      input: color,
      darkGround: darkGroundColor,
      lightGrass: lightGrassColor
    });
  }
  
  getGroup(): THREE.Group {
    return this.group;
  }
  
  dispose(): void {
    // Очищаем траву
    this.instancedMesh.geometry.dispose();
    this.material.dispose();
    
    // Очищаем основание
    this.groundMesh.geometry.dispose();
    (this.groundMesh.material as THREE.MeshBasicMaterial).dispose();
    
    // Очищаем группу
    this.group.clear();
  }
}
