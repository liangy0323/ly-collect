<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef } from 'vue';
import { mountYuanbaoAurora } from './webgl/renderer';

interface Props {
  /**
   * 当前轮播放结束后是否从头播放。
   */
  loop?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loop: false,
});

const canvas = useTemplateRef<HTMLCanvasElement>('canvas');
let dispose: (() => void) | undefined;

onMounted(() => {
  if (canvas.value) dispose = mountYuanbaoAurora(canvas.value, () => props.loop);
});

onUnmounted(() => dispose?.());
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
