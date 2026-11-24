precision highp float;

uniform vec2 uRes;

float fade(float t){ return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

uniform sampler2D uAurora;
uniform vec4  uDot;      // (间隔, 最大半径, 最小半径, 整体不透明度)，前三项单位为 CSS px
uniform vec3  uDotColor;
uniform float uDotTime;
uniform float uPxRatio;  // 1 个 CSS px 对应多少后备缓冲像素

float dHash2(float i, float j){ return fract(sin(i * 127.1 + j * 311.7) * 43758.5453); }
float dHash3(float ix, float iy, float iz){
  return fract(sin(ix * 127.1 + iy * 311.7 + iz * 74.7) * 43758.5453123);
}
float dBilinear(float x, float y, float iz){
  float x0 = floor(x), y0 = floor(y);
  float fx = fade(x - x0), fy = fade(y - y0);
  return mix(mix(dHash3(x0, y0, iz),       dHash3(x0 + 1.0, y0, iz),       fx),
             mix(dHash3(x0, y0 + 1.0, iz), dHash3(x0 + 1.0, y0 + 1.0, iz), fx), fy);
}
float dNoise3(float x, float y, float z){
  float iz = floor(z);
  return mix(dBilinear(x, y, iz), dBilinear(x, y, iz + 1.0), fade(z - iz));
}

void main(){
  vec3 col = texture2D(uAurora, gl_FragCoord.xy / uRes).rgb;

  if (uDot.w > 0.0) {
    float spacing = uDot.x;
    // 换算到 CSS px、且 y 轴翻成「左上原点」，才能跟 Canvas2D 版落在同一批格点上
    vec2 cssSize = uRes / uPxRatio;
    vec2 cssPx   = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uPxRatio;

    vec2 cells  = ceil(cssSize / spacing) + 1.0;
    vec2 origin = (cssSize - (cells - 1.0) * spacing) * 0.5;   // 居中铺格
    vec2 cell   = clamp(floor((cssPx - origin) / spacing + 0.5), vec2(0.0), cells - 1.0);
    vec2 center = origin + cell * spacing;

    float nx = cell.x * 0.18, ny = cell.y * 0.18;              // 对应 DOT_GRID_NOISE_SPATIAL
    float z1 = uDotTime + dHash2(cell.x + 3.0, cell.y + 11.0) * 40.0;
    float n  = dNoise3(nx, ny, z1) * 0.65
             + dNoise3(nx * 2.05 + 19.1, ny * 2.05 + 7.3, z1 * 2.05 + 3.7) * 0.35;

    float rad = uDot.z + (uDot.y - uDot.z) * n;
    // 一个后备缓冲像素等于 1/uPxRatio 个 CSS px，用它当抗锯齿过渡宽度
    float aa  = 1.0 / uPxRatio;
    float cov = smoothstep(rad + aa * 0.5, rad - aa * 0.5, distance(cssPx, center));
    col = mix(col, uDotColor, cov * uDot.w);
  }

  gl_FragColor = vec4(col, 1.0);
}
