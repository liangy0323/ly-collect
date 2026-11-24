<script setup lang="ts">
import YuanbaoAuroraBackground from '@/components/background/yuanbao-aurora/index.vue';
</script>

<template>
  <main class="preview" aria-label="元宝极光">
    <yuanbao-aurora-background loop/>
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
