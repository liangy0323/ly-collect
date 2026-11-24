<script setup lang="ts">
import AuroraBackground from '@/components/background/aurora/index.vue';
</script>

<template>
  <main class="preview" aria-label="极光背景">
    <aurora-background loop />
  </main>
</template>

<style lang="scss" scoped>
.preview {
  position: relative;
  width: 100%;
  height: 100%;
  background: #fff;
}
</style>
