/**
 * 字符球体默认字符色，同时作为无效颜色值的回退色。
 */
export const DEFAULT_ASCII_SPHERE_COLOR = '#000000';

/**
 * 字符球体默认字符集，按深度由远及近映射显示。
 */
export const DEFAULT_ASCII_SPHERE_CHARS = '░▒▓█▀▄▌▐│─┤├┴┬╭╮╰╯';

/**
 * 字符球体默认旋转速度倍率，1 对应每秒约 1.2 弧度。
 */
export const DEFAULT_ASCII_SPHERE_SPEED = 1;

/**
 * 字符球体挂载配置项
 */
export interface AsciiSphereOptions {
  /**
   * 字符颜色，支持 #RGB 和 #RRGGBB
   */
  color: string;

  /**
   * 按深度由远及近映射的字符序列
   */
  chars: string;

  /**
   * 旋转速度倍率，0 表示静止
   */
  speed: number;
}

/**
 * 字符球体运行控制句柄
 */
export interface AsciiSphereController {
  /**
   * 更新字符颜色并立即重绘
   */
  setColor: (color: string) => void;

  /**
   * 更新深度映射字符集并立即重绘
   */
  setChars: (chars: string) => void;

  /**
   * 更新旋转速度倍率并同步动画状态
   */
  setSpeed: (speed: number) => void;

  /**
   * 停止动画并释放监听与观察器资源
   */
  dispose: () => void;
}

interface SphereSample {
  phi: number;
  sinTheta: number;
  cosTheta: number;
}

interface ProjectedPoint {
  x: number;
  y: number;
  z: number;
  charIndex: number;
}

interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

const ANGLE_STEP = 0.15;
const BASE_ANGULAR_SPEED = 1.2;
const REDUCED_MOTION_ANGLE = 0.85;
const MAX_FRAME_DELTA_MS = 100;
const SPHERE_RADIUS_RATIO = 0.44;
const FONT_SPEC = '12px monospace';

const parseHexColor = (color: string): RgbColor => {
  const matched = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())?.[1];
  const hex = matched ?? DEFAULT_ASCII_SPHERE_COLOR.slice(1);
  const full = hex.length === 3 ? hex.replace(/./g, '$&$&') : hex;

  return {
    red: Number.parseInt(full.slice(0, 2), 16),
    green: Number.parseInt(full.slice(2, 4), 16),
    blue: Number.parseInt(full.slice(4, 6), 16),
  };
};

const normalizeGlyphList = (chars: string): string[] => {
  const glyphList = Array.from(chars);
  return glyphList.length > 0 ? glyphList : Array.from(DEFAULT_ASCII_SPHERE_CHARS);
};

const normalizeSpeed = (speed: number): number => {
  return Number.isFinite(speed) ? speed : DEFAULT_ASCII_SPHERE_SPEED;
};

const createSphereSamples = (): SphereSample[] => {
  const sampleList: SphereSample[] = [];
  for (let phi = 0; phi < Math.PI * 2; phi += ANGLE_STEP) {
    for (let theta = 0; theta < Math.PI; theta += ANGLE_STEP) {
      sampleList.push({
        phi,
        sinTheta: Math.sin(theta),
        cosTheta: Math.cos(theta),
      });
    }
  }
  return sampleList;
};

/**
 * 在指定 Canvas 2D 画布上挂载三维字符旋转球体。
 *
 * 负责 HiDPI 尺寸适配、球面采样投影、画家算法深度排序以及可见性与减弱动态偏好监听。
 * 卸载组件时必须调用返回句柄的 `dispose` 方法释放动画帧与监听。
 *
 * @param canvas 目标画布元素
 * @param options 初始颜色、字符集与旋转速度配置
 * @returns 可动态更新参数和销毁资源的控制句柄；不支持 2D 上下文时返回 undefined
 */
export const mountAsciiSphere = (
  canvas: HTMLCanvasElement,
  options: AsciiSphereOptions,
): AsciiSphereController | undefined => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const sampleList = createSphereSamples();
  const projectedList: ProjectedPoint[] = sampleList.map(() => ({
    x: 0,
    y: 0,
    z: 0,
    charIndex: 0,
  }));

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let rgb = parseHexColor(options.color);
  let glyphList = normalizeGlyphList(options.chars);
  let speed = normalizeSpeed(options.speed);
  let width = 0;
  let height = 0;
  let angle = 0;
  let lastTime = 0;
  let frameId = 0;
  let isOnScreen = true;
  let isDisposed = false;

  const resize = (): void => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const nextWidth = rect.width;
    const nextHeight = rect.height;
    const pixelWidth = Math.max(1, Math.round(nextWidth * ratio));
    const pixelHeight = Math.max(1, Math.round(nextHeight * ratio));

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    width = nextWidth;
    height = nextHeight;
    ctx.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
  };

  const draw = (currentAngle: number): void => {
    if (isDisposed) return;
    if (!width || !height) resize();
    if (!width || !height) return;

    ctx.clearRect(0, 0, width, height);
    ctx.font = FONT_SPEC;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * SPHERE_RADIUS_RATIO;
    const maxCharIndex = glyphList.length - 1;

    const spin = 0.5 * currentAngle;
    const rot1 = 0.3 * currentAngle;
    const cosRot1 = Math.cos(rot1);
    const sinRot1 = Math.sin(rot1);
    const rot2 = 0.2 * currentAngle;
    const cosRot2 = Math.cos(rot2);
    const sinRot2 = Math.sin(rot2);

    for (let index = 0; index < sampleList.length; index += 1) {
      const sample = sampleList[index];
      const azimuth = sample.phi + spin;
      const x0 = sample.sinTheta * Math.cos(azimuth);
      const y0 = sample.sinTheta * Math.sin(azimuth);
      const z0 = sample.cosTheta;

      const x1 = x0 * cosRot1 - z0 * sinRot1;
      const z1 = x0 * sinRot1 + z0 * cosRot1;
      const y2 = y0 * cosRot2 - z1 * sinRot2;
      const z2 = y0 * sinRot2 + z1 * cosRot2;

      const rawIndex = Math.floor(((z2 + 1) / 2) * maxCharIndex);
      const charIndex = Math.min(maxCharIndex, Math.max(0, rawIndex));
      const point = projectedList[index];
      point.x = centerX + x1 * radius;
      point.y = centerY + y2 * radius;
      point.z = z2;
      point.charIndex = charIndex;
    }

    projectedList.sort((first, second) => first.z - second.z);

    for (let index = 0; index < projectedList.length; index += 1) {
      const point = projectedList[index];
      const alpha = 0.2 + (point.z + 1) * 0.4;
      ctx.fillStyle = `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, ${alpha})`;
      ctx.fillText(glyphList[point.charIndex], point.x, point.y);
    }
  };

  const renderStatic = (): void => {
    draw(reducedMotion.matches ? REDUCED_MOTION_ANGLE : angle);
  };

  const tick = (now: number): void => {
    const deltaMs = Math.min(Math.max(now - lastTime, 0), MAX_FRAME_DELTA_MS);
    lastTime = now;
    angle += deltaMs * 0.001 * BASE_ANGULAR_SPEED * speed;
    draw(angle);
    frameId = requestAnimationFrame(tick);
  };

  const syncAnimation = (): void => {
    cancelAnimationFrame(frameId);
    frameId = 0;
    if (!isDisposed && !document.hidden && isOnScreen && !reducedMotion.matches && speed !== 0) {
      lastTime = performance.now();
      frameId = requestAnimationFrame(tick);
    }
  };

  const handleResize = (): void => {
    resize();
    if (!frameId) renderStatic();
  };

  const handleMotionChange = (): void => {
    renderStatic();
    syncAnimation();
  };

  const resizeObserver = new ResizeObserver(handleResize);
  const intersectionObserver = new IntersectionObserver((entries) => {
    isOnScreen = entries.some((entry) => entry.isIntersecting);
    syncAnimation();
  });

  const dispose = (): void => {
    if (isDisposed) return;
    isDisposed = true;
    cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('visibilitychange', syncAnimation);
    reducedMotion.removeEventListener('change', handleMotionChange);
  };

  resizeObserver.observe(canvas);
  intersectionObserver.observe(canvas);
  window.addEventListener('resize', handleResize);
  document.addEventListener('visibilitychange', syncAnimation);
  reducedMotion.addEventListener('change', handleMotionChange);

  resize();
  renderStatic();
  syncAnimation();

  return {
    setColor: (color) => {
      if (isDisposed) return;
      rgb = parseHexColor(color);
      if (!frameId) renderStatic();
    },
    setChars: (chars) => {
      if (isDisposed) return;
      glyphList = normalizeGlyphList(chars);
      if (!frameId) renderStatic();
    },
    setSpeed: (nextSpeed) => {
      if (isDisposed) return;
      speed = normalizeSpeed(nextSpeed);
      syncAnimation();
    },
    dispose,
  };
};
