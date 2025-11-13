// Файл: SparksEffect.ts 

/**
 * SparksEffect - облако хаотичных мерцающих частиц
 * Анимация полностью на GPU с использованием Simplex Noise
 */
import * as THREE from 'three';
import { SPARKS_VERTEX_SHADER } from './shaders/sparks.vert';
import { SPARKS_FRAGMENT_SHADER } from './shaders/sparks.frag';
import { EFFECT_SIZES } from './constants';
import type { EffectColor } from './types';

export class SparksEffect {
  private group: THREE.Group;
  private points: THREE.Points;
  private material: THREE.ShaderMaterial;

  constructor(color: EffectColor) {
    this.group = new THREE.Group();
    
    const geometry = this.createSparksGeometry();
    this.material = this.createSparksMaterial(color);

    this.points = new THREE.Points(geometry, this.material);
    this.points.position.z = 3;
    this.group.add(this.points);
    
    // ✅ ДИАГНОСТИКА
    console.log('[SparksEffect] Created:', {
      particleCount: geometry.attributes.position?.count,
      hasPosition: !!geometry.attributes.position,
      hasStartPosition: !!geometry.attributes.aStartPosition,
      hasRandom: !!geometry.attributes.aRandom,
      materialUniforms: Object.keys(this.material.uniforms)
    });
  }

  /**
   * Создаёт геометрию для облака частиц.
   */
  private createSparksGeometry(): THREE.BufferGeometry {
    const { count, maxRadius } = EFFECT_SIZES.sparks;
    
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);
    const startPositions = new Float32Array(count * 3);
    const randoms = new Float32Array(count * 4);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * 2 * Math.PI; // Угол вращения

      const minRadius = maxRadius * 0.4;
      const distance = minRadius + Math.sqrt(Math.random()) * (maxRadius - minRadius);
      
      const x = distance * Math.cos(angle);
      const y = distance * Math.sin(angle);
      const z = 0;

      // Position (обязательный атрибут для Points)
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Стартовая позиция (для шейдера)
      startPositions[i * 3 + 0] = x;
      startPositions[i * 3 + 1] = y;
      startPositions[i * 3 + 2] = z;

      // Случайные параметры
      randoms[i * 4 + 0] = Math.random();
      randoms[i * 4 + 1] = Math.random();
      randoms[i * 4 + 2] = Math.random();
      randoms[i * 4 + 3] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aStartPosition', new THREE.BufferAttribute(startPositions, 3));
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 4));

    return geometry;
  }

  /**
   * Создаёт шейдерный материал для частиц
   */
  private createSparksMaterial(color: EffectColor): THREE.ShaderMaterial {
    const {
      maxRadius,
      particleSpeed,
      noiseScale,
      noiseSpeed,
      minSize,
      maxSize
    } = EFFECT_SIZES.sparks;
    
    return new THREE.ShaderMaterial({
      vertexShader: SPARKS_VERTEX_SHADER,
      fragmentShader: SPARKS_FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uMaxRadius: { value: maxRadius },
        uParticleSpeed: { value: particleSpeed },
        uNoiseScale: { value: noiseScale },
        uNoiseSpeed: { value: noiseSpeed },
        uMinSize: { value: minSize },
        uMaxSize: { value: maxSize },
        uColor: { 
          value: new THREE.Vector3(color.r / 255, color.g / 255, color.b / 255)
        },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
  }

  /**
   * Изменить цвет искр
   */
  setColor(color: EffectColor): void {
    this.material.uniforms.uColor.value.set(
      color.r / 255,
      color.g / 255,
      color.b / 255
    );
  }

  /**
   * Публичный метод для получения Points (без Group)
   */
  getPoints(): THREE.Points {
    return this.points;
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
    this.points.geometry.dispose();
    this.material.dispose();
    this.group.clear();
  }
}