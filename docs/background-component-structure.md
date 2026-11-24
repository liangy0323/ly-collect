# 背景组件组织约定

背景组件位于 `src/components/background/<组件名>/`。组件目录名使用 kebab-case，页面通过组件目录下的 `index.vue` 引入。着色器、贴图、渲染器和样式随所属组件维护。

## 目录与职责

| 路径                 | 职责                                                                       | 何时创建                                             |
| -------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------- |
| `index.vue`          | 定义 Props、画布模板和组件生命周期，装配渲染器。                           | 每个背景组件都有。                                   |
| `webgl/renderer.ts`  | 封装 WebGL 初始化、绘制、动画时序和资源释放。                              | 背景使用 WebGL 独立渲染流程时。                      |
| `canvas/renderer.ts` | 封装 Canvas 2D 初始化、绘制、动画时序和资源释放。                          | 背景使用 Canvas 2D 独立渲染流程时。                  |
| `glsl/`              | 存放组件使用的顶点和片元着色器，分别使用 `.vert.glsl` 和 `.frag.glsl`。    | 组件使用 GLSL 时。                                   |
| `assets/`            | 存放组件私有的贴图、图片等静态资源。多个组件共用的资源放在 `src/assets/`。 | 组件有私有资源时。                                   |
| `composables/`       | 存放组件私有的 Vue 组合式逻辑，文件采用 `use-<职责>.ts` 命名。             | 响应式配置、监听或生命周期逻辑复杂到值得单独维护时。 |
| `index.scss`         | 存放组件的局部样式。                                                       | 样式超过 50 行或需要单独维护时。                     |

少量 Props、画布引用和挂载／卸载逻辑可以直接写在 `index.vue`。需要拆出组合式逻辑时，由 `index.vue` 调用 composable，composable 负责衔接 Vue 生命周期与渲染器。渲染器从同级目录 `glsl/` 导入着色器，贴图按相对路径交给 Rsbuild 处理。

```ts
import vertexSource from '../glsl/fullscreen.vert.glsl' with { type: 'text' };
```

样式较短时可以写在组件的 `<style scoped>` 中。拆出 `index.scss` 后，在组件中这样引入。

```vue
<style lang="scss" src="./index.scss" scoped></style>
```

## 仓库中的示例

- [Mastra Grain Gradient](../src/components/background/mastra-grain-gradient/) 的着色器位于 `glsl/`，噪声贴图位于 `assets/noise.png`。
- [极光背景](../src/components/background/aurora/) 的顶点、光晕和点阵着色器均位于 `glsl/`。使用 `loop` 开启循环，使用 `color` 设置光晕颜色，支持 `#RGB` 和 `#RRGGBB`，默认 `#25f39b`。
- [字符球体](../src/components/background/ascii-sphere/) 使用 Canvas 2D 渲染器 `canvas/renderer.ts` 绘制三维旋转字符球体。支持 `color`（默认 `#000000`）、`chars` 和 `speed`（默认 `1`）配置。
