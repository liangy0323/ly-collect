<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef } from 'vue';
import noiseUrl from './assets/noise.png';
import { mountGrainGradient } from './webgl/renderer';

const canvas = useTemplateRef<HTMLCanvasElement>('canvas');
let dispose: (() => void) | undefined;

onMounted(async () => {
  const element = canvas.value;
  if (!element) return;

  try {
    const noise = new Image();
    noise.src = noiseUrl;
    await noise.decode();
    if (canvas.value === element) dispose = mountGrainGradient(element, noise);
  } catch (error) {
    console.error(error);
  }
});

onUnmounted(() => dispose?.());
</script>

<template>
  <div class="grain-gradient">
    <canvas ref="canvas" aria-hidden="true"></canvas>
  </div>
</template>

<style scoped>
.grain-gradient {
  --panel: oklch(15.91% 0 0);
  --border: oklch(100% 0 0 / 9%);

  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--panel);
}

@media (prefers-color-scheme: light) {
  .grain-gradient {
    --panel: oklch(98.51% 0 0);
    --border: oklch(20.5% 0 0 / 9%);
  }
}

canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.4;
  pointer-events: none;
}
</style>
