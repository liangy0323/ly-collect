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
    path: 'yuanbao-aurora',
    name: 'YuanbaoAurora',
    component: () => import('@/views/yuanbao-aurora/index.vue'),
    meta: { title: '元宝极光' },
  },
];
