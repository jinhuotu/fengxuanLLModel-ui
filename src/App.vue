<!--
  应用程序根组件
  
  功能说明：
  1. 根据当前路由决定是否显示主布局
  2. 管理全局主题模式（深色/浅色）
  3. 处理登录页面和主应用页面的切换
-->

<script setup lang="ts">
// Vue Composition API导入
import { onMounted, computed } from 'vue'
// Vue Router路由相关导入
import { useRoute } from 'vue-router'
// 状态管理导入
import { useAppStore, useAuthStore } from './stores'
// 主布局组件导入
import MainLayout from './components/MainLayout.vue'

// 获取当前路由信息
const route = useRoute()
// 获取应用状态管理实例
const appStore = useAppStore()
// 获取认证状态管理实例
const authStore = useAuthStore()

/**
 * 计算属性：判断是否显示主布局
 * 
 * 逻辑说明：
 * - 当路由名称为'Login'时，不显示主布局，直接显示登录页面
 * - 其他所有页面都显示主布局（包含侧边栏、顶部栏等）
 */
const showMainLayout = computed(() => {
  return route.name !== 'Login'
})

/**
 * 组件挂载后的初始化操作
 * 在应用启动时执行一次
 */
onMounted(async () => {
  
  // 初始化认证状态
  await authStore.initAuth()
  
  // 初始化主题设置
  appStore.initTheme()
})
</script>

<template>
  <!-- 
    应用根容器
    - 根据主题模式动态添加dark类名
    - 全屏显示，隐藏溢出内容
  -->
  <div id="app" :class="{ 'dark': appStore.isDarkMode }">
    <!-- 
      条件渲染主布局
      - 当showMainLayout为true时显示主布局（包含侧边栏、顶部栏等）
      - 当showMainLayout为false时直接显示路由组件（如登录页面）
    -->
    <MainLayout v-if="showMainLayout" />
    <router-view v-else />
  </div>
</template>

<style>
/* 应用根容器样式 */
#app {
  /* 设置容器高度为视口高度 */
  height: 100vh;
  /* 设置容器宽度为视口宽度 */
  width: 100vw;
  /* 隐藏溢出内容，防止出现滚动条 */
  overflow: hidden;
}

/* 深色主题样式 */
.dark {
  /* 设置颜色方案为深色模式，影响浏览器默认样式 */
  color-scheme: dark;
}
</style>
