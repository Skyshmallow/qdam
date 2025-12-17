/**
 * PlasmaEffect - расходящиеся плазменные кольца
 * Создаёт эффект волн
 */

import * as THREE from 'three';
import { PLASMA_VERTEX_SHADER } from './shaders/plasma.vert';
import { PLASMA_FRAGMENT_SHADER } from './shaders/plasma.frag';
import { EFFECT_SIZES, ANIMATION_SPEEDS, VISUAL_PARAMS } from './constants';
import type { EffectColor } from './types';
import { geometryCache } from '@shared/utils/geometryCache';

interface PlasmaRing {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  startTime: number;
}

export class PlasmaEffect {
  private group: THREE.Group;
  private rings: PlasmaRing[] = [];
  private color: EffectColor;
  private globalTime: number = 0;

  constructor(color: EffectColor) {
    this.group = new THREE.Group();
    this.color = color;
    
    // Создаём начальные кольца
    for (let i = 0; i < EFFECT_SIZES.plasma.ringCount; i++) {
      const delay = i * ANIMATION_SPEEDS.plasmaInterval;
      this.createRing(delay);
    }
  }

  /**
   * Создаёт одно плазменное кольцо
   */
  private createRing(startTime: number): void {
    const geometry = this.createRingGeometry();
    const material = this.createPlasmaMaterial();
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = 1; // Немного над землёй
    
    this.group.add(mesh);
    this.rings.push({ mesh, material, startTime });
  }

  /**
   * Создаёт геометрию кольца
   */
  private createRingGeometry(): THREE.BufferGeometry {
    const { minRadius, thickness } = EFFECT_SIZES.plasma;
    const segments = 64; // Гладкий круг
    
    // ✅ Use cached geometry instead of creating new one
    const innerRadius = minRadius - thickness / 2;
    const outerRadius = minRadius + thickness / 2;
    const geometry = geometryCache.getRing(innerRadius, outerRadius, segments);
    
    return geometry;
  }

  /**
   * Создаёт шейдерный материал для плазмы
   */
  private createPlasmaMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      vertexShader: PLASMA_VERTEX_SHADER,
      fragmentShader: PLASMA_FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uExpansionSpeed: { value: ANIMATION_SPEEDS.plasmaExpansion },
        uMinRadius: { value: EFFECT_SIZES.plasma.minRadius },
        uMaxRadius: { value: EFFECT_SIZES.plasma.maxRadius },
        uColor: { 
          value: new THREE.Vector3(
            this.color.r / 255,
            this.color.g / 255,
            this.color.b / 255
          )
        },
        uOpacityStart: { value: VISUAL_PARAMS.plasmaOpacity.start },
        uOpacityEnd: { value: VISUAL_PARAMS.plasmaOpacity.end },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Обновление анимации
   */
  update(deltaTime: number): void {
    this.globalTime += deltaTime;
    
    this.rings.forEach((ring) => {
      const ringTime = this.globalTime - ring.startTime;
      ring.material.uniforms.uTime.value = ringTime;
      
      // Перезапускаем кольцо когда оно достигает края
      const maxDuration = 
        (EFFECT_SIZES.plasma.maxRadius - EFFECT_SIZES.plasma.minRadius) / 
        ANIMATION_SPEEDS.plasmaExpansion;
      
      if (ringTime > maxDuration) {
        // Сбрасываем время
        ring.startTime = this.globalTime;
      }
    });
  }

  /**
   * Изменить цвет плазмы
   */
  setColor(color: EffectColor): void {
    this.color = color;
    this.rings.forEach(ring => {
      ring.material.uniforms.uColor.value.set(
        color.r / 255,
        color.g / 255,
        color.b / 255
      );
    });
  }

  /**
   * Получить Three.js группу
   */
  getGroup(): THREE.Group {
    return this.group;
  }

  /**
   * Очистка ресурсов
   */
  dispose(): void {
    this.rings.forEach(ring => {
      ring.mesh.geometry.dispose();
      ring.material.dispose();
    });
    this.rings = [];
    this.group.clear();
  }
}