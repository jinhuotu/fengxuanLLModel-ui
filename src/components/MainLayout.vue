<!--
  主布局组件
  
  功能说明：
  1. 提供应用的主要布局结构
  2. 包含侧边栏导航和主内容区域
  3. 管理用户界面和主题切换
  4. 处理用户操作和页面导航
-->

<template>
  <!-- 主容器 -->
  <el-container class="main-container">
    <!-- 侧边栏导航 -->
    <el-aside width="80px" class="sidebar">
      <!-- 侧边栏头部 - 显示应用Logo -->
      <div class="sidebar-header">
        <div class="logo">
          <el-icon class="logo-icon">
            <ChatDotRound />
          </el-icon>
        </div>
      </div>
      
      <!-- 侧边栏菜单 - 主要功能导航 -->
      <div class="sidebar-menu">
        <!-- 对话页面导航 -->
        <el-tooltip content="对话" placement="right" effect="dark">
          <div 
            class="menu-item"
            :class="{ active: currentRoute === '/' }"
            @click="router.push('/')"
          >
            <el-icon><ChatDotRound /></el-icon>
          </div>
        </el-tooltip>
        
        <!-- 图片生成页面导航 -->
        <el-tooltip content="图片生成" placement="right" effect="dark">
          <div 
            class="menu-item"
            :class="{ active: currentRoute === '/image-generation' }"
            @click="router.push('/image-generation')"
          >
            <el-icon><Picture /></el-icon>
          </div>
        </el-tooltip>
        
        <!-- 待办事项页面导航 -->
        <el-tooltip content="待办事项" placement="right" effect="dark">
          <div 
            class="menu-item"
            :class="{ active: currentRoute === '/todos' }"
            @click="router.push('/todos')"
          >
            <el-icon><List /></el-icon>
          </div>
        </el-tooltip>
        
        <!-- 模型管理页面导航 -->
        <el-tooltip content="模型管理" placement="right" effect="dark">
          <div 
            class="menu-item"
            :class="{ active: currentRoute === '/models' }"
            @click="router.push('/models')"
          >
            <el-icon><Cpu /></el-icon>
          </div>
        </el-tooltip>
        
        <!-- 提示词管理页面导航 -->
        <el-tooltip content="提示词" placement="right" effect="dark">
          <div 
            class="menu-item"
            :class="{ active: currentRoute === '/prompts' }"
            @click="router.push('/prompts')"
          >
            <el-icon><Document /></el-icon>
          </div>
        </el-tooltip>
        
        <!-- 知识库管理页面导航 -->
        <el-tooltip content="知识库" placement="right" effect="dark">
          <div 
            class="menu-item"
            :class="{ active: currentRoute === '/knowledge' }"
            @click="router.push('/knowledge')"
          >
            <el-icon><Collection /></el-icon>
          </div>
        </el-tooltip>
        
        <!-- MCP管理页面导航 -->
        <el-tooltip content="MCP管理" placement="right" effect="dark">
          <div 
            class="menu-item"
            :class="{ active: currentRoute === '/mcp' }"
            @click="router.push('/mcp')"
          >
            <el-icon><Connection /></el-icon>
          </div>
        </el-tooltip>
        
        <!-- 系统设置页面导航 -->
        <el-tooltip content="设置" placement="right" effect="dark">
          <div 
            class="menu-item"
            :class="{ active: currentRoute === '/settings' }"
            @click="router.push('/settings')"
          >
            <el-icon><Setting /></el-icon>
          </div>
        </el-tooltip>
      </div>
    </el-aside>

    <!-- 主内容区域 -->
    <el-container class="main-content">
      <!-- 顶部工具栏 -->
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-button-group>
            <el-button 
              icon="Refresh" 
              @click="refreshCurrentPage"
              circle
              title="刷新页面"
            />
            <el-button 
              icon="Delete" 
              @click="handleClearCache"
              circle
              title="清除会话缓存"
              type="danger"
            />
          </el-button-group>
          
          <!-- 用户信息下拉菜单 -->
          <el-dropdown @command="handleUserCommand" trigger="click">
            <div class="user-info">
              <el-avatar :size="32" :src="authStore.user?.avatar">
                {{ authStore.user?.username?.charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="username">{{ authStore.user?.nickname || authStore.user?.username }}</span>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人资料
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  账户设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 页面内容 -->
      <el-main class="content">
        <router-view v-slot="{ Component }">
          <transition 
            name="page-transition" 
            mode="out-in"
            @before-enter="onBeforeEnter"
            @after-leave="onAfterLeave"
          >
            <div class="page-wrapper" :key="route.path">
              <div v-if="isPageLoading" class="page-loading">
                <div class="loading-spinner">
                  <el-icon class="is-loading">
                    <Loading />
                  </el-icon>
                </div>
                <p class="loading-text">加载中...</p>
              </div>
              <component :is="Component" v-else />
            </div>
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore, useAuthStore, useChatStore } from '../stores'
import {
  ChatDotRound, 
  List,
  Cpu, 
  Document, 
  Collection, 
  Setting,
  User,
  ArrowDown,
  Delete,
  Loading,
  Picture,
  Connection
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()
const chatStore = useChatStore()

// 页面加载状态
const isPageLoading = ref(false)
let loadingTimer: number | null = null

// 监听路由变化，显示加载动画
watch(() => route.path, () => {
  // 清除之前的定时器
  if (loadingTimer) {
    clearTimeout(loadingTimer)
  }
  
  isPageLoading.value = true
  
  // 设置最短加载时间，确保用户能看到加载动画
  loadingTimer = window.setTimeout(() => {
    isPageLoading.value = false
    loadingTimer = null
  }, 400)
})

// 过渡动画钩子
const onBeforeEnter = () => {
  // 在新页面进入前显示加载动画
  isPageLoading.value = true
}

const onAfterLeave = () => {
  // 页面离开后不需要额外处理，由路由监听器控制
}

const currentRoute = computed(() => route.path)

const currentPageTitle = computed(() => {
  const titleMap: Record<string, string> = {
    '/': '对话',
    '/image-generation': '图片生成',
    '/todos': '待办事项',
    '/models': '模型管理',
    '/prompts': '提示词管理',
    '/knowledge': '知识库管理',
    '/mcp': 'MCP管理',
    '/settings': '系统设置'
  }
  return titleMap[route.path] || '未知页面'
})

const refreshCurrentPage = () => {
  // 刷新当前页面数据
  window.location.reload()
}



const handleClearCache = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清除所有会话缓存吗？这将清除所有本地存储的会话和消息数据。',
      '清除会话缓存',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 清除会话缓存
    authStore.clearConversationCache()
    // 同时清除chatStore中的内存状态
    chatStore.conversations = []
    chatStore.messages = []
    chatStore.currentConversationId = null
    ElMessage.success('已清除所有会话缓存')
    
    // 刷新页面以重新加载数据
    window.location.reload()
  } catch (error) {
    // 用户取消操作
  }
}

// 处理用户下拉菜单命令
const handleUserCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      // 跳转到个人资料页面
      router.push('/profile')
      break
    case 'settings':
      // 跳转到设置页面
      router.push('/settings')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm(
          '确定要退出登录吗？',
          '确认退出',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        await authStore.logout()
        ElMessage.success('已退出登录')
        router.push('/login')
      } catch (error) {
        // 用户取消操作
      }
      break
  }
}
</script>

<style scoped>
.main-container {
  height: 100vh;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.sidebar {
  background: var(--el-bg-color-page);
  border-right: 1px solid var(--el-border-color);
  width: 80px !important;
  display: flex;
  flex-direction: column;
  color: var(--el-text-color-primary);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color);
  height: 60px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon {
  font-size: 24px;
  color: var(--el-color-primary);
}

.sidebar-menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px 0;
  gap: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin: 0 auto;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--el-text-color-secondary);
}

.menu-item:hover {
  background-color: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.menu-item.active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.menu-item .el-icon {
  font-size: 20px;
}

.main-content {
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
  color: var(--el-text-color-primary);
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.user-info:hover {
  background-color: var(--el-fill-color-light);
}

.username {
  font-size: 14px;
  color: var(--el-text-color-primary);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.content {
  padding: 0;
  background: var(--el-bg-color);
  overflow: auto;
  color: var(--el-text-color-primary);
  position: relative;
}

/* 页面包装器 */
.page-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 页面加载动画容器 */
.page-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  gap: 20px;
  animation: fadeIn 0.2s ease-out;
}

/* 加载图标旋转动画 */
.loading-spinner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  animation: spinnerPulse 2s ease-in-out infinite;
}

.loading-spinner::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: var(--el-color-primary);
  border-right-color: var(--el-color-primary);
  animation: spin 1s linear infinite;
}

.loading-spinner .el-icon {
  font-size: 36px;
  color: var(--el-color-primary);
  z-index: 1;
}

/* 加载文字 */
.loading-text {
  font-size: 15px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  margin: 0;
  animation: pulse 1.5s ease-in-out infinite;
  letter-spacing: 0.5px;
}

/* 旋转动画 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 脉冲缩放动画 */
@keyframes spinnerPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* 文字脉冲动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* 淡入动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 页面过渡动画 */
.page-transition-enter-active {
  animation: slideInRight 0.4s ease-out;
}

.page-transition-leave-active {
  animation: slideOutLeft 0.3s ease-in;
}

/* 滑入动画 */
@keyframes slideInRight {
  from {
    transform: translateX(20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 滑出动画 */
@keyframes slideOutLeft {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-20px);
    opacity: 0;
  }
}

/* 按钮样式 */
.header-right .el-button {
  transition: all 0.3s ease;
}

.header-right .el-button:hover {
  transform: scale(1.05);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar:not(.collapsed) {
    transform: translateX(0);
  }
  
  .main-content {
    width: 100%;
  }
  
  .menu-item {
    width: 40px;
    height: 40px;
  }
  
  .menu-item .el-icon {
    font-size: 18px;
  }
}
</style>
