export const GRASS_VERTEX_SHADER = `
varying vec2 vUv;
uniform float time;

void main() {
  vUv = uv;
  
  // VERTEX POSITION
  vec4 mvPosition = vec4(position, 1.0);
  
  #ifdef USE_INSTANCING
    mvPosition = instanceMatrix * mvPosition;
  #endif
  
  // DISPLACEMENT (анимация ветра)
  // Сила смещения увеличивается к верхушке травинки
  float dispPower = 1.0 - cos(uv.y * 3.1416 / 2.0);
  
  // Волна ветра
  float displacement = sin(mvPosition.x + time * 10.0) * (0.1 * dispPower);
  mvPosition.x += displacement;
  
  vec4 modelViewPosition = modelViewMatrix * mvPosition;
  gl_Position = projectionMatrix * modelViewPosition;
}
`;