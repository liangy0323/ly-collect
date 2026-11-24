import fragmentSource from '../glsl/grain-gradient.frag.glsl' with { type: 'text' };
import vertexSource from '../glsl/grain-gradient.vert.glsl' with { type: 'text' };

const settings = {
  colors: ['#69FD6933', '#41B743', '#FCC062'],
  frame: 332733.07699987973,
  speed: 0.6,
  scale: 3.07,
  offsetY: 0.15,
  softness: 1,
  intensity: 0.4,
  noise: 0,
  maxPixels: 900_000,
};

const rgba = (hex: string) => {
  const value = hex.slice(1).padEnd(8, 'f');
  return [0, 2, 4, 6].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255);
};

const compileShader = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('无法创建 WebGL 着色器');

  // 与 Paper 的精度处理一致，避免波形和噪声的计算丢失精度。
  const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT)?.precision ?? 0;
  gl.shaderSource(shader, precision < 23 ? source.replace(/\b(?:lowp|mediump)\b/g, 'highp') : source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message || 'WebGL 着色器编译失败');
  }
  return shader;
};

const createProgram = (gl: WebGL2RenderingContext) => {
  const program = gl.createProgram();
  if (!program) throw new Error('无法创建 WebGL 程序');

  try {
    for (const [type, source] of [
      [gl.VERTEX_SHADER, vertexSource],
      [gl.FRAGMENT_SHADER, fragmentSource],
    ] as const) {
      const shader = compileShader(gl, type, source);
      gl.attachShader(program, shader);
      gl.deleteShader(shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || 'WebGL 程序链接失败');
    }
    return program;
  } catch (error) {
    gl.deleteProgram(program);
    throw error;
  }
};

/**
 * 使用已解码的噪声贴图启动颗粒渐变。
 * 卸载时调用返回的清理函数，停止动画并释放 WebGL 资源。
 */
export const mountGrainGradient = (
  canvas: HTMLCanvasElement,
  noiseImage: HTMLImageElement,
): (() => void) | undefined => {
  const context = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
  });
  if (!context) return;

  const gl = context;
  const program = createProgram(gl);
  gl.useProgram(program);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, noiseImage);

  const uniform = (name: string) => gl.getUniformLocation(program, `u_${name}`);
  const values = {
    colorsCount: settings.colors.length,
    softness: settings.softness,
    intensity: settings.intensity,
    noise: settings.noise,
    shape: 1, // 波形
    fit: 1, // 在画布内完整呈现
    scale: settings.scale,
    originX: 0.5,
    originY: 0.5,
    offsetY: settings.offsetY,
  };
  for (const [name, value] of Object.entries(values)) gl.uniform1f(uniform(name), value);
  gl.uniform4fv(uniform('colors[0]'), settings.colors.flatMap(rgba));

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const time = uniform('time');
  const resolution = uniform('resolution');
  const pixelRatio = uniform('pixelRatio');
  let elapsed = 0;
  let previous: number | null = null;
  let animationId = 0;

  const render = (now: number) => {
    if (previous !== null && !reducedMotion.matches && !document.hidden) elapsed += now - previous;
    previous = now;
    gl.uniform1f(time, (settings.frame + elapsed * settings.speed) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  const animate = (now: number) => {
    render(now);
    animationId = requestAnimationFrame(animate);
  };

  const updateAnimation = () => {
    cancelAnimationFrame(animationId);
    previous = null;
    if (!document.hidden && !reducedMotion.matches) animationId = requestAnimationFrame(animate);
  };

  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    const ratio = Math.min(devicePixelRatio, Math.sqrt(settings.maxPixels / (width * height)));
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(resolution, canvas.width, canvas.height);
    gl.uniform1f(pixelRatio, canvas.width / Math.round(width));
    render(performance.now());
  };

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', updateAnimation);
  reducedMotion.addEventListener('change', updateAnimation);
  resize();
  updateAnimation();

  return () => {
    cancelAnimationFrame(animationId);
    observer.disconnect();
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', updateAnimation);
    reducedMotion.removeEventListener('change', updateAnimation);
    gl.useProgram(null);
    gl.deleteTexture(texture);
    gl.deleteBuffer(quad);
    gl.deleteProgram(program);
  };
};
