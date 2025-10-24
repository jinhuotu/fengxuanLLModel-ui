/**
 * Vue Router 路由配置文件
 * 
 * 功能说明：
 * 1. 定义应用的所有路由规则
 * 2. 配置路由守卫进行权限控制
 * 3. 管理页面间的导航逻辑
 */

// Vue Router核心功能导入
import { createRouter, createWebHistory } from 'vue-router'
// 路由记录类型定义导入
import type { RouteRecordRaw } from 'vue-router'
// 认证状态管理导入
import { useAuthStore } from '../stores'

// 静态导入所有页面组件
import LoginView from '../views/LoginView.vue'
import ChatView from '../views/ChatView.vue'
import ModelsView from '../views/ModelsView.vue'
import PromptsView from '../views/PromptsView.vue'
import KnowledgeView from '../views/KnowledgeView.vue'
import SettingsView from '../views/SettingsView.vue'
import ProfileView from '../views/ProfileView.vue'
import TodoView from '../views/TodoView.vue'
import ImageGenerationView from '../views/ImageGenerationView.vue'
import MCPView from '../views/MCPView.vue'

/**
 * 路由配置数组
 * 
 * 路由结构说明：
 * - path: 路由路径
 * - name: 路由名称（用于编程式导航）
 * - component: 对应的Vue组件
 * - meta: 路由元信息
 *   - title: 页面标题
 *   - requiresAuth: 是否需要用户认证
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: {
      title: '用户登录',
      requiresAuth: false  // 登录页面不需要认证
    }
  },
  {
    path: '/',
    name: 'Chat',
    component: ChatView,
    meta: {
      title: '对话',
      requiresAuth: true  // 对话页面需要认证
    }
  },
  {
    path: '/models',
    name: 'Models',
    component: ModelsView,
    meta: {
      title: '模型管理',
      requiresAuth: true  // 模型管理页面需要认证
    }
  },
  {
    path: '/prompts',
    name: 'Prompts',
    component: PromptsView,
    meta: {
      title: '提示词管理',
      requiresAuth: true  // 提示词管理页面需要认证
    }
  },
  {
    path: '/knowledge',
    name: 'Knowledge',
    component: KnowledgeView,
    meta: {
      title: '知识库管理',
      requiresAuth: true  // 知识库管理页面需要认证
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsView,
    meta: {
      title: '系统设置',
      requiresAuth: true  // 系统设置页面需要认证
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileView,
    meta: {
      title: '个人资料',
      requiresAuth: true  // 个人资料页面需要认证
    }
  },
  {
    path: '/todos',
    name: 'Todos',
    component: TodoView,
    meta: {
      title: '待办事项',
      requiresAuth: true  // 待办事项页面需要认证
    }
  },
  {
    path: '/image-generation',
    name: 'ImageGeneration',
    component: ImageGenerationView,
    meta: {
      title: '图片生成',
      requiresAuth: true  // 图片生成页面需要认证
    }
  },
  {
    path: '/mcp',
    name: 'MCP',
    component: MCPView,
    meta: {
      title: 'MCP管理',
      requiresAuth: true  // MCP管理页面需要认证
    }
  },
]

/**
 * 创建路由实例
 * 
 * 配置说明：
 * - history: 使用HTML5 History模式，支持干净的URL
 * - routes: 路由配置数组
 */
const router = createRouter({
  history: createWebHistory(),
  routes
})

/**
 * 全局路由前置守卫
 * 
 * 功能说明：
 * 1. 在每次路由跳转前执行
 * 2. 检查用户认证状态
 * 3. 根据路由的requiresAuth元信息决定是否允许访问
 * 4. 处理已登录用户访问登录页面的重定向
 * 
 * @param to 目标路由
 * @param from 来源路由
 * @param next 路由跳转控制函数
 */
router.beforeEach(async (to, from, next) => {
  // 获取认证状态管理实例
  const authStore = useAuthStore()
  
  /**
   * 初始化认证状态
   * 如果用户未认证，尝试从localStorage恢复认证状态
   */
  if (!authStore.isAuthenticated) {
    await authStore.initAuth()
  }
  
  /**
   * 权限检查逻辑
   */
  if (to.meta.requiresAuth) {
    // 如果路由需要认证
    if (authStore.isAuthenticated) {
      // 用户已认证，允许访问
      next()
    } else {
      // 用户未认证，重定向到登录页面
      next('/login')
    }
  } else {
    // 如果路由不需要认证（如登录页面）
    if (to.name === 'Login' && authStore.isAuthenticated) {
      // 如果已登录用户访问登录页面，重定向到首页
      next('/')
    } else {
      // 其他情况允许访问
      next()
    }
  }
})

// 导出路由实例
export default router
