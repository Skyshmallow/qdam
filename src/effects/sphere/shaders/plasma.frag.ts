/**
 * Fragment shader для плазменных волн
 * Создаёт эффект исчезающего кольца
 */

export const PLASMA_FRAGMENT_SHADER = `
  // Uniforms
  uniform vec3 uColor;           // Цвет плазмы (RGB)
  uniform float uOpacityStart;   // Начальная прозрачность (0.8)
  uniform float uOpacityEnd;     // Конечная прозрачность (0.0)
  
  // Varying
  varying float vProgress;       // Прогресс анимации (0.0 - 1.0)
  
  void main() {
    // Плавное исчезновение: яркое в начале → прозрачное в конце
    float opacity = mix(uOpacityStart, uOpacityEnd, vProgress);
    
    // Добавляем пульсацию
    float pulse = sin(vProgress * 3.14159 * 2.0) * 0.3;
    opacity += pulse * (1.0 - vProgress);
    
    // Ограничиваем opacity в диапазоне [0, 1]
    opacity = clamp(opacity, 0.0, 1.0);
    
    // Финальный цвет
    gl_FragColor = vec4(uColor, opacity);
  }
`;