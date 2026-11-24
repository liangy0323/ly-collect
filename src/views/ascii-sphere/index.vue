<script setup lang="ts">
import AsciiSphereBackground from '@/components/background/ascii-sphere/index.vue';
</script>

<template>
  <main class="preview" aria-label="字符球体">
    <ascii-sphere-background />
  </main>
</template>

<style lang="scss" scoped>
.preview {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #fafaf9;
  background-image:
    linear-gradient(to right, rgb(0 0 0 / 4%) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(0 0 0 / 4%) 1px, transparent 1px);
  background-size: 96px 96px;
}
</style>
