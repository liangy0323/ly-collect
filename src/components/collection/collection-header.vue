<script setup lang="ts">
import { Layers } from '@lucide/vue';
</script>

<template>
  <header class="collection-header">
    <router-link class="collection-header__brand" :to="{ name: 'DemoHome' }">
      <layers :size="19" :stroke-width="1.65" aria-hidden="true" />
      <span>LY Collect</span>
    </router-link>

    <nav class="collection-header__nav" aria-label="主导航">
      <router-link :to="{ name: 'DemoHome' }">背景收藏</router-link>
      <router-link :to="{ name: 'DemoComponents' }">基础组件</router-link>
    </nav>
  </header>
</template>

<style lang="scss" src="@/assets/styles/collection.scss"></style>
