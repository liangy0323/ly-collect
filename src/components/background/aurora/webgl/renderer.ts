import auroraSource from '../glsl/aurora.frag.glsl' with { type: 'text' };
import dotsSource from '../glsl/dots.frag.glsl' with { type: 'text' };
import vertexSource from '../glsl/fullscreen.vert.glsl' with { type: 'text' };

/**
 * 组件默认光晕颜色，也是无效颜色的回退值。
 */
export const DEFAULT_AURORA_COLOR = '#25f39b';

const frameInterval = 1000 / 30;
const visibleDuration = 10_000;
const fadeDuration = 1_000;

const createProgram = (gl: WebGLRenderingContext, fragmentSource: string) => {
  const program = gl.createProgram();
  if (!program) throw new Error('无法创建 WebGL 程序');

  try {
    for (const [type, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]] as const) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('无法创建 WebGL 着色器');
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(message || 'WebGL 着色器编译失败');
      }
      gl.attachShader(program, shader);
      gl.deleteShader(shader);
    }
    gl.bindAttribLocation(program, 0, 'p');
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

const createRenderer = (canvas: HTMLCanvasElement, gl: WebGLRenderingContext) => {
  const aurora = createProgram(gl, auroraSource);
  const dots = createProgram(gl, dotsSource);
  const triangle = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // 对应原站浅色背景参数，光晕以四分之一尺寸渲染，点阵以完整尺寸叠加。
  gl.useProgram(aurora);
  const lightUniform = (name: string) => gl.getUniformLocation(aurora, name);
  const auroraResolution = lightUniform('uRes');
  const auroraTime = lightUniform('uTime');
  gl.uniform3f(lightUniform('uBase'), 1, 1, 1);
  const auroraTint = lightUniform('uTint');
  gl.uniform1f(lightUniform('uPeak'), 0.38);
  gl.uniform2f(lightUniform('uShape'), 0.34, 1);
  gl.uniform1f(lightUniform('uCore'), 0.25);
  gl.uniform1f(lightUniform('uGamma'), 1.3);
  gl.uniform1f(lightUniform('uScale'), 1);
  gl.uniform1f(lightUniform('uPulse'), 0);

  gl.useProgram(dots);
  const dotUniform = (name: string) => gl.getUniformLocation(dots, name);
  const dotResolution = dotUniform('uRes');
  const dotTime = dotUniform('uDotTime');
  const dotPixelRatio = dotUniform('uPxRatio');
  gl.uniform4f(dotUniform('uDot'), 8, 2, 0.5, 1);
  gl.uniform3f(dotUniform('uDotColor'), 1, 1, 1);
  gl.uniform1i(dotUniform('uAurora'), 0);

  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const textureLimit: number = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  let width = 0;
  let height = 0;
  let textureWidth = 0;
  let textureHeight = 0;

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const nextWidth = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const nextHeight = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (width === nextWidth && height === nextHeight) return;

    canvas.width = width = nextWidth;
    canvas.height = height = nextHeight;
    textureWidth = Math.min(textureLimit, Math.max(1, Math.round(width * 0.25)));
    textureHeight = Math.min(textureLimit, Math.max(1, Math.round(height * 0.25)));
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textureWidth, textureHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (status !== gl.FRAMEBUFFER_COMPLETE) throw new Error(`WebGL 帧缓冲不可用 (${status})`);

    gl.useProgram(aurora);
    gl.uniform2f(auroraResolution, textureWidth, textureHeight);
    gl.useProgram(dots);
    gl.uniform2f(dotResolution, width, height);
    gl.uniform1f(dotPixelRatio, ratio);
  };

  return {
    setColor(color: string) {
      const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())?.[1] ?? DEFAULT_AURORA_COLOR.slice(1);
      const rgb = hex.length === 3 ? hex.replace(/./g, '$&$&') : hex;
      const red = Number.parseInt(rgb.slice(0, 2), 16) / 255;
      const green = Number.parseInt(rgb.slice(2, 4), 16) / 255;
      const blue = Number.parseInt(rgb.slice(4, 6), 16) / 255;
      gl.useProgram(aurora);
      gl.uniform3f(auroraTint, red, green, blue);
    },

    render(milliseconds: number) {
      resize();
      const seconds = milliseconds * 0.001;
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.viewport(0, 0, textureWidth, textureHeight);
      gl.useProgram(aurora);
      gl.uniform1f(auroraTime, 8 * seconds);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, width, height);
      gl.useProgram(dots);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1f(dotTime, 2.8 * seconds);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.useProgram(null);
      gl.deleteFramebuffer(framebuffer);
      gl.deleteTexture(texture);
      gl.deleteBuffer(triangle);
      gl.deleteProgram(dots);
      gl.deleteProgram(aurora);
    },
  };
};

/**
 * 在同一画布中绘制光晕和点阵，按原效果淡入淡出。
 * 每轮结束时读取循环设置。颜色更新沿用当前播放进度，卸载时释放 WebGL 资源。
 */
export const mountAurora = (
  canvas: HTMLCanvasElement,
  { color: initialColor, shouldLoop }: { color: string; shouldLoop: () => boolean },
): { setColor: (color: string) => void; dispose: () => void } | undefined => {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false });
  if (!gl) return;

  const renderer = createRenderer(canvas, gl);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = visibleDuration + fadeDuration;
  let elapsed = 0;
  let lastTime = 0;
  let nextFrame = 0;
  let frameId = 0;
  let onScreen = true;
  let disposed = false;

  const draw = () => {
    if (!disposed) renderer.render(reducedMotion.matches ? 12_000 : elapsed);
  };

  try {
    renderer.setColor(initialColor);
    draw();
  } catch (error) {
    renderer.dispose();
    throw error;
  }

  const fade = canvas.animate([
    { opacity: 0, offset: 0, easing: 'ease' },
    { opacity: 1, offset: fadeDuration / duration },
    { opacity: 1, offset: visibleDuration / duration, easing: 'ease' },
    { opacity: 0, offset: 1 },
  ], { duration });

  const tick = (now: number) => {
    elapsed += now - lastTime;
    lastTime = now;
    if (elapsed >= nextFrame) {
      nextFrame += frameInterval;
      if (nextFrame < elapsed) nextFrame = elapsed + frameInterval;
      draw();
    }
    frameId = requestAnimationFrame(tick);
  };

  const sync = () => {
    cancelAnimationFrame(frameId);
    frameId = 0;
    if (!disposed && !document.hidden && onScreen && !reducedMotion.matches) {
      lastTime = performance.now();
      frameId = requestAnimationFrame(tick);
    }
  };

  const updateMotion = () => {
    draw();
    sync();
  };

  const resizeObserver = new ResizeObserver(() => {
    if (!frameId) draw();
  });
  const screenObserver = new IntersectionObserver(entries => {
    onScreen = entries.some(entry => entry.isIntersecting);
    sync();
  });

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    fade.onfinish = null;
    fade.cancel();
    cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    screenObserver.disconnect();
    document.removeEventListener('visibilitychange', sync);
    reducedMotion.removeEventListener('change', updateMotion);
    canvas.removeEventListener('webglcontextlost', dispose);
    renderer.dispose();
  };

  const handleFinish = () => {
    if (disposed) return;
    if (!shouldLoop()) {
      dispose();
      return;
    }

    elapsed = 0;
    nextFrame = 0;
    draw();
    fade.currentTime = 0;
    fade.play();
    sync();
  };

  resizeObserver.observe(canvas);
  screenObserver.observe(canvas);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', updateMotion);
  canvas.addEventListener('webglcontextlost', dispose);
  fade.onfinish = handleFinish;
  sync();
  return {
    setColor: (color) => {
      if (disposed) return;
      renderer.setColor(color);
      draw();
    },
    dispose,
  };
};
