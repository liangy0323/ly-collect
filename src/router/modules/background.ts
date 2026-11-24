import type { RouteRecordRaw } from 'vue-router';

/**
 * 背景收藏页按需加载，浏览其他页面时无需下载着色器。
 */
export const backgroundRoutes: RouteRecordRaw[] = [
  {
    path: 'mastra-grain-gradient',
    name: 'MastraGrainGradient',
    component: () => import('@/views/mastra-grain-gradient/index.vue'),
    meta: { title: 'Mastra Grain Gradient' },
  },
  {
    path: 'aurora',
    name: 'Aurora',
    component: () => import('@/views/aurora/index.vue'),
    meta: { title: '极光背景' },
  },
  {
    path: 'ascii-sphere',
    name: 'AsciiSphere',
    component: () => import('@/views/ascii-sphere/index.vue'),
    meta: { title: '字符球体' },
  },
];
