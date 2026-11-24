<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef, watch } from 'vue';
import {
  DEFAULT_ASCII_SPHERE_CHARS,
  DEFAULT_ASCII_SPHERE_COLOR,
  DEFAULT_ASCII_SPHERE_SPEED,
  mountAsciiSphere,
} from './canvas/renderer';
import type { AsciiSphereController } from './canvas/renderer';

interface Props {
  /**
   * 字符颜色，支持 #RGB 和 #RRGGBB。
   */
  color?: string;

  /**
   * 按深度由远及近映射的字符集。
   */
  chars?: string;

  /**
   * 球体旋转速度倍率，0 表示静止。
   */
  speed?: number;
}

const props = withDefaults(defineProps<Props>(), {
  color: DEFAULT_ASCII_SPHERE_COLOR,
  chars: DEFAULT_ASCII_SPHERE_CHARS,
  speed: DEFAULT_ASCII_SPHERE_SPEED,
});

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef');
let sphereController: AsciiSphereController | undefined;

onMounted(() => {
  if (!canvasRef.value) return;

  sphereController = mountAsciiSphere(canvasRef.value, {
    color: props.color,
    chars: props.chars,
    speed: props.speed,
  });
});

watch(
  () => props.color,
  (color) => {
    sphereController?.setColor(color);
  },
);

watch(
  () => props.chars,
  (chars) => {
    sphereController?.setChars(chars);
  },
);

watch(
  () => props.speed,
  (speed) => {
    sphereController?.setSpeed(speed);
  },
);

onUnmounted(() => {
  sphereController?.dispose();
});
</script>

<template>
  <canvas ref="canvasRef" class="ascii-sphere" aria-hidden="true"></canvas>
</template>

<style lang="scss" scoped>
.ascii-sphere {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0.45;
  pointer-events: none;
}
</style>
