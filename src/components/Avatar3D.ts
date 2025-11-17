// src/components/Avatar3D.ts
import * as THREE from 'three';

/**
 * Avatar3D - класс для управления 3D аватаром
 * Не использует React чтобы избежать проблем с вложенными roots
 */
export class Avatar3D {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private avatar: THREE.Group;
  private ring: THREE.Mesh;
  private animationFrameId: number | null = null;
  private pulseTime = 0;

  constructor(container: HTMLDivElement) {
    this.container = container;

    const width = 100;
    const height = 100;

    // Сцена
    this.scene = new THREE.Scene();

    // Камера (вид сверху)
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.camera.position.set(0, 8, 0);
    this.camera.lookAt(0, 0, 0);

    // Рендерер
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true // Прозрачный фон
    });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(2, 5, 2);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // === АВАТАР ===
    this.avatar = new THREE.Group();

    // Основная стрелка (3D)
    const arrowShape = new THREE.Shape();
    arrowShape.moveTo(0, 1.2);      // Верхушка
    arrowShape.lineTo(-0.5, -0.4);  // Левый угол
    arrowShape.lineTo(-0.15, -0.4); // Левый хвост
    arrowShape.lineTo(-0.15, -0.9); // Низ левого хвоста
    arrowShape.lineTo(0.15, -0.9);  // Низ правого хвоста
    arrowShape.lineTo(0.15, -0.4);  // Правый хвост
    arrowShape.lineTo(0.5, -0.4);   // Правый угол
    arrowShape.lineTo(0, 1.2);      // Замыкаем

    const extrudeSettings = {
      depth: 0.25,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 2
    };

    const arrowGeometry = new THREE.ExtrudeGeometry(arrowShape, extrudeSettings);
    arrowGeometry.translate(0, 0, -0.125);

    const arrowMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2196F3,
      metalness: 0.4,
      roughness: 0.3,
      emissive: 0x1565C0,
      emissiveIntensity: 0.3
    });

    const arrowMesh = new THREE.Mesh(arrowGeometry, arrowMaterial);
    arrowMesh.rotation.x = -Math.PI / 2;
    arrowMesh.castShadow = true;
    this.avatar.add(arrowMesh);

    // Белая обводка
    const outlineGeometry = arrowGeometry.clone();
    const outlineMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      side: THREE.BackSide
    });
    const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
    outline.rotation.x = -Math.PI / 2;
    outline.scale.multiplyScalar(1.1);
    this.avatar.add(outline);

    // Круглая база под аватаром
    const baseGeometry = new THREE.CircleGeometry(0.7, 32);
    const baseMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x2196F3,
      transparent: true,
      opacity: 0.2
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.rotation.x = -Math.PI / 2;
    base.position.y = 0.01;
    this.avatar.add(base);

    // Пульсирующее кольцо
    const ringGeometry = new THREE.RingGeometry(0.5, 0.65, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x2196F3,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    this.ring = new THREE.Mesh(ringGeometry, ringMaterial);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.02;
    this.avatar.add(this.ring);

    this.scene.add(this.avatar);

    // Начать анимацию
    this.animate();
  }

  /**
   * Обновить направление аватара
   */
  setBearing(bearing: number) {
    // Конвертируем bearing (градусы) в радианы
    // bearing 0° = север (вверх), поэтому вычитаем Math.PI/2
    const radians = (bearing * Math.PI) / 180 - Math.PI / 2;
    
    // Вращаем ТОЛЬКО вокруг оси Y
    this.avatar.rotation.set(0, -radians, 0);
  }

  /**
   * Анимационный цикл
   */
  private animate = () => {
    this.pulseTime += 0.05;

    // Пульсация кольца
    this.ring.scale.set(
      1 + Math.sin(this.pulseTime) * 0.15,
      1,
      1 + Math.sin(this.pulseTime) * 0.15
    );
    
    // Type cast для доступа к opacity
    const ringMaterial = this.ring.material as THREE.MeshBasicMaterial;
    ringMaterial.opacity = 0.3 + Math.sin(this.pulseTime) * 0.25;

    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  /**
   * Очистка ресурсов
   */
  dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
    
    this.renderer.dispose();
    
    // Очистить геометрии и материалы
    this.avatar.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(m => m.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
}
