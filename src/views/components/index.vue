<script setup lang="ts">
import { ref } from 'vue';
import CollectionHeader from '@/components/collection/collection-header.vue';

const isLoading = ref(true);
const handleToggleLoading = () => {
  isLoading.value = !isLoading.value;
};
</script>

<template>
  <div class="collection-page">
    <div class="collection-page__inner">
      <collection-header />

      <main class="components-page">
        <div class="collection-page__intro">
          <h1>基础组件</h1>
          <p>可复用的图标与加载指示器。</p>
        </div>

        <div class="specimens">
          <section class="specimen" aria-labelledby="icon-title">
            <div class="specimen__heading">
              <div>
                <h2 id="icon-title">LucideIcon</h2>
                <p>线性图标</p>
              </div>
            </div>

            <div class="specimen__stage specimen__stage--icons">
              <div class="specimen__sample">
                <span class="specimen__symbol"><lucide-icon icon="House" :size="28" aria-hidden="true" /></span>
                <code>House</code>
              </div>
              <div class="specimen__sample">
                <span class="specimen__symbol"><lucide-icon icon="Bell" :size="28" aria-hidden="true" /></span>
                <code>Bell</code>
              </div>
            </div>

            <code class="specimen__usage">&lt;lucide-icon icon="House" :size="28" /&gt;</code>
          </section>

          <section class="specimen" aria-labelledby="loading-title">
            <div class="specimen__heading">
              <div>
                <h2 id="loading-title">CircleLoading</h2>
                <p>圆形加载指示器</p>
              </div>
              <button type="button" class="specimen__toggle" :aria-pressed="isLoading" @click="handleToggleLoading">
                <span class="specimen__switch" aria-hidden="true"></span>
                播放动画
              </button>
            </div>

            <div class="specimen__stage specimen__stage--loading">
              <div class="specimen__sample">
                <span class="specimen__symbol"><circle-loading v-if="isLoading" /></span>
                <code>24px</code>
              </div>
              <div class="specimen__sample">
                <span class="specimen__symbol"><circle-loading v-if="isLoading" :size="36" /></span>
                <code>36px</code>
              </div>
            </div>

            <code class="specimen__usage">&lt;circle-loading :size="36" /&gt;</code>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<style lang="scss" src="./index.scss" scoped></style>
