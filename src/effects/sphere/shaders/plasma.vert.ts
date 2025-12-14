/**
 * Vertex shader для плазменных волн
 * Управляет расширением колец
 */

export const PLASMA_VERTEX_SHADER = `
  // Uniforms
  uniform float uTime;           // Время жизни кольца
  uniform float uExpansionSpeed; // Скорость расширения
  uniform float uMinRadius;      // Начальный радиус
  uniform float uMaxRadius;      // Конечный радиус
  
  // Varying
  varying float vProgress;       // Прогресс анимации (0.0 - 1.0)
  
  void main() {
    // Вычисляем прогресс (0.0 в начале → 1.0 в конце)
    vProgress = min(uTime * uExpansionSpeed / (uMaxRadius - uMinRadius), 1.0);
    
    // Расширяем кольцо
    float currentRadius = mix(uMinRadius, uMaxRadius, vProgress);
    vec3 expandedPosition = position * (currentRadius / uMinRadius);
    
    // Финальная позиция
    gl_Position = projectionMatrix * modelViewMatrix * vec4(expandedPosition, 1.0);
  }
`;