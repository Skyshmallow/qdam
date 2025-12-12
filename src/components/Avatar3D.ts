// src/components/Avatar3D.ts
import * as THREE from 'three';

/**
 * Create a modern 3D navigation chevron/delta arrow (like Google Maps)
 * This is added directly to ThreeLayer scene, not as a separate canvas
 */
export function createNavigationAvatar(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'navigationAvatar';

  // Create chevron/delta arrow shape (like Google Maps navigation)
  const arrowShape = new THREE.Shape();
  
  // Start at the tip (nose) - увеличенный размер в 2 раза
  arrowShape.moveTo(0, 3.0);
  
  // Right wing
  arrowShape.lineTo(2.0, -2.0);
  
  // Curved indent at the bottom (right side to center)
  arrowShape.quadraticCurveTo(1.0, -1.6, 0, -1.0);
  
  // Curved indent at the bottom (center to left side)
  arrowShape.quadraticCurveTo(-1.0, -1.6, -2.0, -2.0);
  
  // Left wing back to tip
  arrowShape.lineTo(0, 3.0);
  
  // Extrude the arrow shape to make it 3D
  const extrudeSettings = {
    depth: 0.6,
    bevelEnabled: true,
    bevelThickness: 0.16,
    bevelSize: 0.16,
    bevelSegments: 3
  };
  
  const arrowGeometry = new THREE.ExtrudeGeometry(arrowShape, extrudeSettings);
  
  // Modern gradient-like material with vibrant color
  const arrowMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x00d9ff, // Cyan/Aqua - modern and vibrant
    metalness: 0.7,
    roughness: 0.2,
    emissive: 0x0088cc,
    emissiveIntensity: 0.3
  });
  const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);

  
  // Rotate to lay flat and point forward
  arrow.rotation.x = -Math.PI / 2;
  arrow.position.z = 0.3;
  arrow.castShadow = true;
  group.add(arrow);
  
  // Store arrow reference for pulse animation
  group.userData.arrow = arrow;
  
  // Add pulsing glow ring effect (увеличенные кольца)
  const ringGeometry = new THREE.RingGeometry(2.4, 3.0, 32);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x00d9ff,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide
  });
  const pulseRing = new THREE.Mesh(ringGeometry, ringMaterial);
  pulseRing.rotation.x = -Math.PI / 2;
  pulseRing.position.y = 0.2;
  group.add(pulseRing);
  
  // Add secondary pulse ring
  const ring2Geometry = new THREE.RingGeometry(3.0, 3.6, 32);
  const ring2Material = new THREE.MeshBasicMaterial({
    color: 0x00d9ff,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  });
  const pulseRing2 = new THREE.Mesh(ring2Geometry, ring2Material);
  pulseRing2.rotation.x = -Math.PI / 2;
  pulseRing2.position.y = 0.2;
  group.add(pulseRing2);
  
  group.userData.pulseRing = pulseRing;
  group.userData.pulseRing2 = pulseRing2;
  group.userData.pulseTime = 0;
  
  // Position slightly above ground
  group.position.y = 1.0;
  
  return group;
}

/**
 * Update avatar pulse animation (called from render loop)
 */
export function updateAvatarAnimation(avatar: THREE.Group, deltaTime: number): void {
  if (!avatar.userData.pulseRing || !avatar.userData.pulseRing2) return;
  
  avatar.userData.pulseTime += deltaTime * 0.003; // Adjust speed
  const pulseTime = avatar.userData.pulseTime;
  
  // Primary ring pulse
  const scale1 = 1 + Math.sin(pulseTime) * 0.15;
  const opacity1 = 0.4 + Math.sin(pulseTime) * 0.2;
  avatar.userData.pulseRing.scale.set(scale1, scale1, 1);
  (avatar.userData.pulseRing.material as THREE.MeshBasicMaterial).opacity = Math.max(0.1, opacity1);
  
  // Secondary ring pulse (offset phase)
  const scale2 = 1 + Math.sin(pulseTime + Math.PI) * 0.15;
  const opacity2 = 0.3 + Math.sin(pulseTime + Math.PI) * 0.15;
  avatar.userData.pulseRing2.scale.set(scale2, scale2, 1);
  (avatar.userData.pulseRing2.material as THREE.MeshBasicMaterial).opacity = Math.max(0.05, opacity2);
  
  // Subtle arrow glow pulse
  if (avatar.userData.arrow) {
    const glowIntensity = 0.3 + Math.sin(pulseTime * 2) * 0.1;
    (avatar.userData.arrow.material as THREE.MeshStandardMaterial).emissiveIntensity = glowIntensity;
  }
}
