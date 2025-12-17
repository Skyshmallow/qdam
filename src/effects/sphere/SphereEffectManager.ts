/**
 * SphereEffectManager - главный менеджер эффектов сфер
 * Управляет созданием, обновлением и удалением всех эффектов
 */

import * as THREE from 'three';
import mapboxgl from 'mapbox-gl';
import { RadarEffect } from './RadarEffect';
import { PlasmaEffect } from './PlasmaEffect';
import { SparksEffect } from './SparksEffect';
import { SPHERE_COLORS, DEFAULT_SPHERE_CONFIG, EFFECT_SIZES } from './constants';
import { geometryCache } from '@shared/utils/geometryCache';

import type {
  SphereEffectConfig,
  SphereEffectInstance,
  SphereType,
  SphereEffectManagerOptions,
  EffectColor
} from './types';

export class SphereEffectManager {
  private scene: THREE.Scene;
  private spheres = new Map<string, SphereEffectInstance>();
  private options: Required<SphereEffectManagerOptions>;

  constructor(
    scene: THREE.Scene,
    options?: SphereEffectManagerOptions
  ) {
    this.scene = scene;
    this.options = {
      enableRadar: options?.enableRadar ?? DEFAULT_SPHERE_CONFIG.enableRadar,
      enablePlasma: options?.enablePlasma ?? DEFAULT_SPHERE_CONFIG.enablePlasma,
      enableSparks: options?.enableSparks ?? DEFAULT_SPHERE_CONFIG.enableSparks,
      globalIntensity: options?.globalIntensity ?? DEFAULT_SPHERE_CONFIG.intensity,
    };

    console.log('[SphereEffectManager] Initialized', this.options);
  }

  /**
   * Создаёт новый эффект сферы
   */
  createSphere(config: SphereEffectConfig): void {
    // Проверяем дубликаты
    if (this.spheres.has(config.id)) {
      console.warn(`[SphereEffectManager] Sphere ${config.id} already exists`);
      return;
    }

    // Определяем цвет
    const color = config.customColor || SPHERE_COLORS[config.type];

    // Вычисляем Mercator координаты
    const mercatorCoords = mapboxgl.MercatorCoordinate.fromLngLat(
      config.coordinates,
      0
    );

    // Создаём трансформацию
    const transform = {
      translateX: mercatorCoords.x,
      translateY: mercatorCoords.y,
      translateZ: 0,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      scale: mercatorCoords.meterInMercatorCoordinateUnits(),
    };

    // Создаём outline (граница сферы)
    const outlineGroup = this.createOutline(color);

    // Создаём группы для эффектов
    const radarGroup = this.options.enableRadar
      ? new RadarEffect(color).getGroup()
      : new THREE.Group();

    const plasmaGroup = this.options.enablePlasma
      ? new PlasmaEffect(color).getGroup()
      : new THREE.Group();

    const sparksGroup = this.options.enableSparks
      ? new SparksEffect(color).getGroup()
      : new THREE.Group();

    // Add outline to scene FIRST
    this.scene.add(outlineGroup);

    // Add groups to scene 
    if (this.options.enableRadar && radarGroup.children.length > 0) {
      this.scene.add(radarGroup);
    }
    if (this.options.enablePlasma && plasmaGroup.children.length > 0) {
      this.scene.add(plasmaGroup);
    }
    if (this.options.enableSparks && sparksGroup.children.length > 0) {
      this.scene.add(sparksGroup);
    }

    const sparkPoints = sparksGroup.children[0] as THREE.Points;
    console.log('[SphereEffectManager] Sparks group created:', {
      hasChildren: sparksGroup.children.length > 0,
      childType: sparksGroup.children[0]?.type,
      isPoints: sparksGroup.children[0] instanceof THREE.Points,
      pointsCount: sparkPoints?.geometry?.attributes?.position?.count,
      hasPositionAttr: !!sparkPoints?.geometry?.attributes?.position,
      hasStartPositionAttr: !!sparkPoints?.geometry?.attributes?.aStartPosition,
      hasRandomAttr: !!sparkPoints?.geometry?.attributes?.aRandom,
      materialType: (sparkPoints?.material as THREE.Material)?.type,
      uniformsKeys: (sparkPoints?.material as THREE.ShaderMaterial)?.uniforms ?
        Object.keys((sparkPoints.material as THREE.ShaderMaterial).uniforms) : [],
      positionZ: sparkPoints?.position?.z,
      visible: sparkPoints?.visible,
      inScene: this.scene.children.includes(sparksGroup)
    });

    // Сохраняем инстанс
    const instance: SphereEffectInstance = {
      id: config.id,
      coordinates: config.coordinates,
      type: config.type,
      outline: outlineGroup,
      radar: radarGroup,
      plasma: plasmaGroup,
      sparks: sparksGroup,
      transform,
      time: 0,
    };

    this.spheres.set(config.id, instance);

    console.log(`[SphereEffectManager] Created sphere ${config.id} at`, config.coordinates);
  }

  // Create outline (граница сферы)
  private createOutline(color: EffectColor): THREE.Group {
    const group = new THREE.Group();
    const { radius, thickness } = EFFECT_SIZES.outline;

    // ✅ Use cached geometry
    const innerRadius = radius - thickness / 2;
    const outerRadius = radius + thickness / 2;
    const geometry = geometryCache.getRing(innerRadius, outerRadius, 128);

    // Create glowing material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: {
          value: new THREE.Color(color.r / 255, color.g / 255, color.b / 255)
        },
        uTime: { value: 0 },
        uGlowIntensity: { value: 0.8 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        uniform float uGlowIntensity;
        varying vec2 vUv;
        
        void main() {
          // Пульсация яркости
          float pulse = sin(uTime * 2.0) * 0.3 + 0.7; // 0.4 - 1.0
          
          // Свечение на краях
          float edgeGlow = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
          
          // Финальный цвет
          vec3 finalColor = uColor * pulse * uGlowIntensity;
          float alpha = 0.8 + edgeGlow * 0.2;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = 1; // Немного над землёй
    group.add(mesh);

    return group;
  }

  /**
   * Обновляет позицию существующей сферы
   */
  updateSphere(id: string, newCoordinates: [number, number]): void {
    const sphere = this.spheres.get(id);
    if (!sphere) {
      console.warn(`[SphereEffectManager] Sphere ${id} not found`);
      return;
    }

    // Обновляем координаты
    sphere.coordinates = newCoordinates;

    // Пересчитываем трансформацию
    const mercatorCoords = mapboxgl.MercatorCoordinate.fromLngLat(
      newCoordinates,
      0
    );

    sphere.transform.translateX = mercatorCoords.x;
    sphere.transform.translateY = mercatorCoords.y;
    sphere.transform.scale = mercatorCoords.meterInMercatorCoordinateUnits();

    // Log only in development mode (reduces console spam)
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_SPHERES) {
      console.log(`[SphereEffectManager] Updated sphere ${id} to`, newCoordinates);
    }
  }

  /**
   * Удаляет сферу
   */
  removeSphere(id: string): void {
    const sphere = this.spheres.get(id);
    if (!sphere) {
      console.warn(`[SphereEffectManager] Sphere ${id} not found`);
      return;
    }

    // ✅ Clean outline
    if (sphere.outline.children.length > 0) {
      const outlineMesh = sphere.outline.children[0] as THREE.Mesh;
      outlineMesh.geometry.dispose();
      (outlineMesh.material as THREE.Material).dispose();
      this.scene.remove(sphere.outline);
    }

    // Clean radar
    if (sphere.radar.children.length > 0) {
      const radarEffect = sphere.radar.children[0] as { dispose?: () => void };
      radarEffect?.dispose?.();
      this.scene.remove(sphere.radar);
    }

    // Clean plasma
    if (sphere.plasma.children.length > 0) {
      const plasmaEffect = sphere.plasma.children[0] as { dispose?: () => void };
      plasmaEffect?.dispose?.();
      this.scene.remove(sphere.plasma);
    }

    // Clean sparks
    if (sphere.sparks.children.length > 0) {
      const sparksEffect = sphere.sparks.children[0] as { dispose?: () => void };
      sparksEffect?.dispose?.();
      this.scene.remove(sphere.sparks);
    }

    this.spheres.delete(id);
    console.log(`[SphereEffectManager] Removed sphere ${id}`);
  }

  /**
   * Удаляет все сферы
   */
  removeAllSpheres(): void {
    const ids = Array.from(this.spheres.keys());
    ids.forEach(id => this.removeSphere(id));
    console.log('[SphereEffectManager] Removed all spheres');
  }

  /**
   * Синхронизирует сферы с GeoJSON данными
   */
  syncWithGeoJSON(geoJSON: GeoJSON.FeatureCollection): void {
    // Получаем ID всех сфер из GeoJSON
    const newIds = new Set(
      geoJSON.features.map(feature => feature.properties?.id || feature.id?.toString())
    );

    // Удаляем сферы, которых нет в новых данных
    this.spheres.forEach((_, id) => {
      if (!newIds.has(id)) {
        this.removeSphere(id);
      }
    });

    // Добавляем/обновляем сферы из GeoJSON
    geoJSON.features.forEach(feature => {
      if (feature.geometry.type !== 'Polygon') return;

      const id = feature.properties?.id || feature.id?.toString();
      if (!id) return;

      // Вычисляем центр полигона
      const coords = feature.geometry.coordinates[0];
      const center = this.calculateCenter(coords as [number, number][]);

      const type: SphereType = feature.properties?.type || 'default';

      // Создаём или обновляем
      if (!this.spheres.has(id)) {
        this.createSphere({ id, coordinates: center, type });
      } else {
        this.updateSphere(id, center);
      }
    });
  }

  /**
   * Вычисляет центр полигона
   */
  private calculateCenter(coords: [number, number][]): [number, number] {
    let totalLng = 0;
    let totalLat = 0;
    const count = coords.length;

    coords.forEach(([lng, lat]) => {
      totalLng += lng;
      totalLat += lat;
    });

    return [totalLng / count, totalLat / count];
  }

  /**
   * Рендерит все сферы (вызывается в ThreeLayer.render)
   */
  render(_gl: WebGLRenderingContext, baseMatrix: THREE.Matrix4, renderer: THREE.WebGLRenderer, camera: THREE.Camera): void {
    this.spheres.forEach(sphere => {
      this.renderSphere(sphere, baseMatrix, renderer, camera);
    });
  }

  /**
   * Рендерит одну сферу
   */
  private renderSphere(
    sphere: SphereEffectInstance,
    baseMatrix: THREE.Matrix4,
    renderer: THREE.WebGLRenderer,
    camera: THREE.Camera
  ): void {
    const { translateX, translateY, translateZ, rotateX, rotateY, rotateZ, scale } = sphere.transform;

    // Создаём матрицы вращения
    const rotationX = new THREE.Matrix4().makeRotationX(rotateX);
    const rotationY = new THREE.Matrix4().makeRotationY(rotateY);
    const rotationZ = new THREE.Matrix4().makeRotationZ(rotateZ);

    // Строим локальную трансформацию
    const localTransform = new THREE.Matrix4()
      .makeTranslation(translateX, translateY, translateZ)
      .scale(new THREE.Vector3(scale, -scale, scale))
      .multiply(rotationX)
      .multiply(rotationY)
      .multiply(rotationZ);

    // Устанавливаем матрицу камеры
    camera.projectionMatrix = baseMatrix.clone().multiply(localTransform);

    // Создаём временную сцену для этой сферы
    const tempScene = new THREE.Scene();

    this.scene.children
      .filter(child => child instanceof THREE.Light)
      .forEach(light => tempScene.add(light.clone()));

    // Add outline FIRST (background layer)
    if (sphere.outline.parent === this.scene) {
      this.scene.remove(sphere.outline);
      tempScene.add(sphere.outline);
    }

    // Add effects
    if (this.options.enableRadar && sphere.radar.parent === this.scene) {
      this.scene.remove(sphere.radar);
      tempScene.add(sphere.radar);
    }

    if (this.options.enablePlasma && sphere.plasma.parent === this.scene) {
      this.scene.remove(sphere.plasma);
      tempScene.add(sphere.plasma);
    }

    if (this.options.enableSparks && sphere.sparks.parent === this.scene) {
      this.scene.remove(sphere.sparks);
      tempScene.add(sphere.sparks);
    }

    // Рендерим
    renderer.resetState();
    renderer.render(tempScene, camera);

    // Return outline to main scene
    if (sphere.outline.parent === tempScene) {
      tempScene.remove(sphere.outline);
      this.scene.add(sphere.outline);
    }

    // Return other effects
    if (sphere.radar.parent === tempScene) {
      tempScene.remove(sphere.radar);
      this.scene.add(sphere.radar);
    }
    if (sphere.plasma.parent === tempScene) {
      tempScene.remove(sphere.plasma);
      this.scene.add(sphere.plasma);
    }
    if (sphere.sparks.parent === tempScene) {
      tempScene.remove(sphere.sparks);
      this.scene.add(sphere.sparks);
    }

    // Очищаем временную сцену
    tempScene.clear();
  }

  /**
   * Обновление анимации (вызывается каждый кадр)
   */
  update(deltaTime: number): void {
    this.spheres.forEach(sphere => {
      sphere.time += deltaTime;

      // Update outline animation
      if (sphere.outline.children.length > 0) {
        const outlineMesh = sphere.outline.children[0] as THREE.Mesh;
        const material = outlineMesh.material as THREE.ShaderMaterial;
        if (material.uniforms?.uTime) {
          material.uniforms.uTime.value = sphere.time;
        }
      }

      // Update radar
      if (this.options.enableRadar && sphere.radar.children.length > 0) {
        const radarMesh = sphere.radar.children[0] as THREE.Mesh;
        const material = radarMesh.material as THREE.ShaderMaterial;
        material.uniforms.uTime.value = sphere.time;
      }

      // Update plasma
      if (this.options.enablePlasma) {
        sphere.plasma.children.forEach(child => {
          const mesh = child as THREE.Mesh;
          const material = mesh.material as THREE.ShaderMaterial;
          if (material.uniforms?.uTime) {
            material.uniforms.uTime.value = sphere.time;
          }
        });
      }

      // Update sparks
      if (this.options.enableSparks && sphere.sparks.children.length > 0) {
        // ✅ Проверяем тип объекта
        const child = sphere.sparks.children[0];

        if (child instanceof THREE.Points) {
          const sparkPoints = child as THREE.Points;
          const material = sparkPoints.material;

          if (material instanceof THREE.ShaderMaterial && material.uniforms?.uTime) {
            material.uniforms.uTime.value = sphere.time;
          } else {
            console.warn('[SphereEffectManager] Sparks material is not ShaderMaterial or missing uTime uniform');
          }
        } else {
          console.warn('[SphereEffectManager] Sparks child is not Points:', child);
        }
      }
    });
  }

  /**
   * Получить количество активных сфер
   */
  getSphereCount(): number {
    return this.spheres.size;
  }

  /**
   * Получить все ID сфер
   */
  getSphereIds(): string[] {
    return Array.from(this.spheres.keys());
  }

  /**
   * Очистка всех ресурсов
   */
  dispose(): void {
    this.removeAllSpheres();
    this.spheres.clear();
    console.log('[SphereEffectManager] Disposed');
  }
}