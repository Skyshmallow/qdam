/**
 * Vertex shader для вращающегося радара
 * Преобразует координаты вершин
 */

export const RADAR_VERTEX_SHADER = `
  // Uniforms (параметры из JS)
  uniform float uTime;           // Время для анимации
  uniform float uRotationSpeed;  // Скорость вращения
  
  // Varying (передаём во fragment shader)
  varying float vDistance;       // Расстояние от центра (для градиента)
  
  void main() {
    // Вычисляем расстояние от центра (0.0 в центре, 1.0 на краю)
    vDistance = length(position.xy) / 140.0; // 140 = длина луча
    
    // Применяем вращение вокруг оси Z
    float angle = uTime * uRotationSpeed;
    float cosAngle = cos(angle);
    float sinAngle = sin(angle);
    
    vec3 rotatedPosition = vec3(
      position.x * cosAngle - position.y * sinAngle,
      position.x * sinAngle + position.y * cosAngle,
      position.z
    );
    
    // Финальная позиция
    gl_Position = projectionMatrix * modelViewMatrix * vec4(rotatedPosition, 1.0);
  }
`;