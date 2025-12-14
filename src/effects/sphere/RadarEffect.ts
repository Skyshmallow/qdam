/**
 * RadarEffect - вращающийся луч радара
 * GPU-ускоренная анимация через шейдеры
 */

import * as THREE from 'three';
import { RADAR_VERTEX_SHADER } from './shaders/radar.vert';
import { RADAR_FRAGMENT_SHADER } from './shaders/radar.frag';
import { EFFECT_SIZES, ANIMATION_SPEEDS, VISUAL_PARAMS } from './constants';
import type { EffectColor } from './types';

export class RadarEffect {
  private group: THREE.Group;
  private mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private time: number = 0;

  constructor(color: EffectColor) {
    this.group = new THREE.Group();
    
    // Создаём геометрию луча (линия от центра)
    const geometry = this.createRadarGeometry();
    
    // Создаём шейдерный материал
    this.material = this.createRadarMaterial(color);
    
    // Создаём mesh
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.z = EFFECT_SIZES.radar.height;
    
    this.group.add(this.mesh);
  }

  /**
   * Создаёт геометрию луча радара
   */
  private createRadarGeometry(): THREE.BufferGeometry {
    const { length, width } = EFFECT_SIZES.radar;
    
    // Луч как тонкий прямоугольник от центра
    const vertices = new Float32Array([
      // Треугольник 1
      0, 0, 0,              // Центр (начало)
      length, -width/2, 0,  // Правый нижний
      length, width/2, 0,   // Правый верхний
      
      // Треугольник 2
      0, 0, 0,              // Центр (начало)
      length, width/2, 0,   // Правый верхний
      0, width/2, 0,        // Левый верхний
    ]);
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    
    return geometry;
  }

  /**
   * Создаёт шейдерный материал для радара
   */
  private createRadarMaterial(color: EffectColor): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      vertexShader: RADAR_VERTEX_SHADER,
      fragmentShader: RADAR_FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uRotationSpeed: { value: ANIMATION_SPEEDS.radarRotation },
        uColor: { 
          value: new THREE.Vector3(
            color.r / 255,
            color.g / 255,
            color.b / 255
          )
        },
        uOpacityStart: { value: VISUAL_PARAMS.radarOpacity.start },
        uOpacityEnd: { value: VISUAL_PARAMS.radarOpacity.end },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Обновление анимации (вызывается каждый кадр)
   */
  update(deltaTime: number): void {
    this.time += deltaTime;
    this.material.uniforms.uTime.value = this.time;
  }

  /**
   * Изменить цвет радара
   */
  setColor(color: EffectColor): void {
    this.material.uniforms.uColor.value.set(
      color.r / 255,
      color.g / 255,
      color.b / 255
    );
  }

  /**
   * Получить Three.js группу для добавления в сцену
   */
  getGroup(): THREE.Group {
    return this.group;
  }

  /**
   * Очистка ресурсов
   */
  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.group.clear();
  }
}