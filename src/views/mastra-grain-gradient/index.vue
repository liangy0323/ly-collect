<script setup lang="ts">
import MastraGrainGradient from '@/components/background/mastra-grain-gradient/index.vue';
</script>

<template>
  <main class="preview" aria-label="Mastra Grain Gradient">
    <mastra-grain-gradient class="preview__background" />
  </main>
</template>

<style lang="scss" scoped>
.preview {
  position: relative;
  width: 100%;
  height: 100%;
}

.preview__background {
  width: 100%;
  height: 100%;
  border: 0;
  border-radius: 0;
}
</style>
