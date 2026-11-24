<script setup lang="ts">
import { ArrowRight } from '@lucide/vue';
import CollectionHeader from '@/components/collection/collection-header.vue';
import { getAppEnv, isOfflineCacheEnabled } from '@/env';
import mastraPreview from './assets/mastra-grain-gradient.webp';
import auroraPreview from './assets/aurora.webp';

const backgrounds = [
  {
    route: 'MastraGrainGradient',
    title: 'Mastra Grain Gradient',
    description: '缓慢流动的波形颗粒渐变',
    preview: mastraPreview,
  },
  {
    route: 'Aurora',
    title: '极光背景',
    description: '浅绿光晕与淡入淡出的点阵',
    preview: auroraPreview,
  },
];
</script>

<template>
  <div class="collection-page">
    <div class="collection-page__inner">
      <collection-header />

      <main>
        <div class="collection-page__intro">
          <h1>背景收藏</h1>
          <p>收录值得回看的网页背景与动效，点开即可全屏预览。</p>
        </div>

        <ul class="gallery" aria-label="背景作品">
          <li v-for="background in backgrounds" :key="background.route">
            <router-link class="gallery-entry" :to="{ name: background.route }">
              <div class="gallery-entry__image">
                <img :src="background.preview" alt="" width="960" height="600" />
              </div>

              <div class="gallery-entry__caption">
                <div>
                  <h2>{{ background.title }}</h2>
                  <p>{{ background.description }}</p>
                </div>
                <span class="gallery-entry__arrow">
                  <arrow-right :size="18" :stroke-width="1.6" aria-hidden="true" />
                </span>
              </div>
            </router-link>
          </li>
        </ul>
      </main>

      <footer class="collection-footer">
        <span>环境 <code>{{ getAppEnv() }}</code></span>
        <span>离线缓存 {{ isOfflineCacheEnabled() ? '已开启' : '已关闭' }}</span>
      </footer>
    </div>
  </div>
</template>

<style lang="scss" src="./index.scss" scoped></style>
