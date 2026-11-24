<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef, watch } from 'vue';
import { DEFAULT_AURORA_COLOR, mountAurora } from './webgl/renderer';

interface Props {
  /**
   * 当前轮播放结束后是否从头播放。
   */
  loop?: boolean;

  /**
   * 极光光晕颜色，支持 #RGB 和 #RRGGBB。
   */
  color?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loop: false,
  color: DEFAULT_AURORA_COLOR,
});

const canvas = useTemplateRef<HTMLCanvasElement>('canvas');
let aurora: ReturnType<typeof mountAurora>;

onMounted(() => {
  if (!canvas.value) return;

  aurora = mountAurora(canvas.value, {
    color: props.color,
    shouldLoop: () => props.loop,
  });
});

watch(() => props.color, (color) => aurora?.setColor(color));
onUnmounted(() => aurora?.dispose());
</script>

<template>
  <canvas ref="canvas" class="aurora" aria-hidden="true"></canvas>
</template>

<style scoped>
.aurora {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  pointer-events: none;
}
</style>
