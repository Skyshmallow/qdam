export const GRASS_FRAGMENT_SHADER = `
varying vec2 vUv;
uniform vec3 baseColor;

void main() {
  // ✅ Увеличенная насыщенность: меньше градиента, больше базового цвета
  float clarity = (vUv.y * 0.3) + 0.85; // Было 0.5 + 0.5, теперь 0.3 + 0.85
  
  vec3 finalColor = baseColor * clarity;
  
  // ✅ Полная непрозрачность
  gl_FragColor = vec4(finalColor, 1.0);
}
`;