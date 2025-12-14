/**
 * Fragment shader для электрических искр
 * Создаёт эффект мерцающих точек
 */
export const SPARKS_FRAGMENT_SHADER = `
uniform vec3 uColor;
varying float vProgress;
varying float vOpacity;

void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  
  if (dist > 0.5) {
    discard;
  }
  
  float radialGlow = 1.0 - smoothstep(0.0, 0.5, dist);
  radialGlow = pow(radialGlow, 2.0);
  
  float opacity = radialGlow * vOpacity * 0.5;
  
  float flicker = sin(vProgress * 50.0) * 0.15 + 0.85;
  opacity *= flicker;
  
  vec3 finalColor = uColor * 1.5;
  
  gl_FragColor = vec4(finalColor, opacity);
}
`;
