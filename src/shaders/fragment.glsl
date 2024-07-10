uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution;
  gl_FragColor = vec4(sin(u_time), u_mouse.x, st.y, 1.0);
}