/**
 * 应用程序主入口文件
 * 
 * 该文件负责：
 * 1. 创建Vue应用实例
 * 2. 配置全局插件和状态管理
 * 3. 初始化应用状态
 * 4. 挂载应用到DOM
 */

// Vue核心库导入
import { createApp } from 'vue'
// Pinia状态管理库导入
import { createPinia } from 'pinia'
// Element Plus UI组件库导入
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// Element Plus图标库导入
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// Element Plus中文语言包导入
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
// 全局样式导入
import './style.css'
// 根组件导入
import App from './App.vue'
// 路由配置导入
import router from './router'
// 认证状态管理导入
import { useAuthStore } from './stores'

// 创建Vue应用实例
const app = createApp(App)
// 创建Pinia状态管理实例
const pinia = createPinia()

/**
 * 注册Element Plus图标组件
 * 遍历所有图标组件并全局注册，使所有图标都可以在模板中直接使用
 */
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 安装Pinia状态管理插件
app.use(pinia)
// 安装Vue Router路由插件
app.use(router)
// 安装Element Plus UI组件库，并配置中文语言包
app.use(ElementPlus, {
  locale: zhCn,
})

/**
 * 初始化用户认证状态
 * 从localStorage中恢复用户的登录状态和用户信息
 */
const authStore = useAuthStore()
authStore.initAuth()

// 将应用挂载到DOM元素#app上
app.mount('#app')
