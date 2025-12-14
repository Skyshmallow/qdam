/**
 * Fragment shader для вращающегося радара
 * Создаёт градиент от прозрачного к яркому
 */

export const RADAR_FRAGMENT_SHADER = `
  // Uniforms
  uniform vec3 uColor;           // Цвет радара (RGB)
  uniform float uOpacityStart;   // Прозрачность в начале (0.0)
  uniform float uOpacityEnd;     // Прозрачность в конце (1.0)
  
  // Varying (получаем из vertex shader)
  varying float vDistance;
  
  void main() {
    // Создаём градиент opacity: прозрачный в центре → яркий на краю
    float opacity = mix(uOpacityStart, uOpacityEnd, vDistance);
    
    // Добавляем свечение на краю
    float glow = smoothstep(0.7, 1.0, vDistance) * 0.5;
    opacity += glow;
    
    // Финальный цвет с альфа-каналом
    gl_FragColor = vec4(uColor, opacity);
  }
`;