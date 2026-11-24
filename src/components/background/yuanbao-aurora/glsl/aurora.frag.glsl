precision highp float;

uniform vec2 uRes;

float fade(float t){ return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

uniform float uTime;
uniform vec3  uBase;    // 底色。浅色为白，深色为近黑
uniform vec3  uTint;    // 浓度拉满时的颜色
uniform float uPeak;    // 峰值 alpha
uniform vec2  uShape;   // 噪声塑形区间 (lo, hi)
uniform float uCore;    // 高光核强度
uniform float uGamma;   // 竖直衰减指数。越小越平，深色片实测接近 0.15
uniform float uPulse;   // 全局「呼吸」深度。0 = 恒定亮度，1 = 最深
uniform float uScale;   // 基频：越大纹理越密、结构越小

vec2 fade(vec2 t){ return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = fade(f);
  return mix(mix(hash(i),               hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)),  hash(i + vec2(1, 1)), u.x), u.y);
}

/*
 * 3 个倍频。
 *
 * 曾经是 5 个，第 4/5 个由一个 uDetail uniform 加权；但标定下来浅色深色都取 detail = 0，
 * 也就是那两个倍频「算完再乘以 0」——uniform 不是编译期常量，GLSL 编译器优化不掉，
 * 实测白扔掉 40% 的噪声计算（2560x1520 下 2.5ms → 1.7ms，输出逐像素相同）。
 *
 * 所以直接砍到 3 个并去掉 uDetail。真要回到「更细的丝带」，是重新标定整套参数的事，
 * 不是把一个开关从 0 调上去。
 */
float fbm(vec2 p){
  float v = 0.0, a = 0.55, norm = 0.0;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    norm += a;
    p *= 2.03;
    a *= 0.5;
  }
  return v / norm;
}

void main(){
  vec2  uv = gl_FragCoord.xy / uRes;
  float ar = uRes.x / uRes.y;
  vec2  p  = vec2(uv.x * ar, uv.y) * uScale;
  float t  = uTime * 0.05;

  // 两级 domain warp
  vec2 q = vec2(fbm(p + vec2(0.0, t)),
                fbm(p + vec2(5.2, 1.3) - t * 0.7));
  vec2 r = vec2(fbm(p + 1.4 * q + vec2(1.7, 9.2) + t * 0.9),
                fbm(p + 1.4 * q + vec2(8.3, 2.8) - t * 0.8));
  float shape = smoothstep(uShape.x, uShape.y, fbm(p + 1.5 * r));

  // 漂移高光核
  vec2  hot  = vec2(0.34 + 0.26 * sin(uTime * 0.10), 0.90 + 0.10 * cos(uTime * 0.075));
  float d    = distance(vec2(uv.x * ar, uv.y), vec2(hot.x * ar, hot.y));
  float core = exp(-d * d * 3.2);

  // 两个不通约的频率叠加，避免呼吸看起来是规律的正弦。
  // 交流分量整体乘 uPulse，且相对基准值 0.68 归一化，改深度不会连带改平均亮度。
  float pulse = 0.68 * (1.0 + uPulse * (0.353 * sin(uTime * 0.21)
                                      + 0.206 * sin(uTime * 0.083 + 1.7)));

  float amt = clamp((shape + core * uCore) * pulse, 0.0, 1.0)
            * pow(clamp(uv.y, 0.0, 1.0), uGamma) * uPeak;

  gl_FragColor = vec4(mix(uBase, uTint, amt), 1.0);
}
