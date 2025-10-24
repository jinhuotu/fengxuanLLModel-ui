/**
 * Pinia状态管理配置文件
 * 
 * 功能说明：
 * 1. 管理应用的全局状态
 * 2. 处理用户认证状态
 * 3. 管理对话和消息状态
 * 4. 提供模型、提示词、知识库的状态管理
 */

// Pinia状态管理库导入
import { defineStore } from 'pinia'
// Vue响应式API导入
import { ref, computed } from 'vue'
// 类型定义导入
import type { 
  Conversation, 
  Message, 
  ModelConfig, 
  PromptTemplate, 
  KnowledgeBase,
  UserSettings,
  UserInfo,
  LoginRequest,
  RegisterRequest,
  AuthResponse
} from '../types'
// 认证API导入
import { authApi } from '../api'
// 待办事项Store导入
import { useTodoStore } from './todo'

// 重新导出待办事项Store
export { useTodoStore }

/**
 * 应用状态管理Store
 * 
 * 功能说明：
 * 1. 管理当前视图状态
 * 2. 控制主题模式（深色/浅色）
 * 3. 提供主题切换功能
 * 4. 支持主题持久化存储
 */
export const useAppStore = defineStore('app', () => {
  // 当前视图状态
  const currentView = ref('chat')
  // 深色模式状态，强制设置为浅色模式
  const isDarkMode = ref(false)
  
  /**
   * 切换主题模式
   * 强制保持浅色模式
   */
  const toggleTheme = () => {
    // 强制保持浅色模式
    isDarkMode.value = false
    localStorage.setItem('theme', 'light')
    
    // 更新HTML根元素的class
    updateThemeClass()
  }
  
  /**
   * 更新HTML根元素的主题类名
   * 确保主题样式正确应用
   */
  const updateThemeClass = () => {
    const htmlElement = document.documentElement
    if (isDarkMode.value) {
      htmlElement.classList.add('dark')
    } else {
      htmlElement.classList.remove('dark')
    }
  }
  
  /**
   * 初始化主题
   * 强制设置为浅色模式
   */
  const initTheme = () => {
    // 强制设置为浅色模式
    isDarkMode.value = false
    localStorage.setItem('theme', 'light')
    updateThemeClass()
    // 初始化为浅色模式，无需日志
  }
  
  return {
    currentView,
    isDarkMode,
    toggleTheme,
    initTheme
  }
})

/**
 * 对话状态管理Store
 * 
 * 功能说明：
 * 1. 管理对话会话列表
 * 2. 处理消息的增删改查
 * 3. 管理当前对话状态
 * 4. 提供本地存储持久化
 */
export const useChatStore = defineStore('chat', () => {
  // 对话会话列表
  const conversations = ref<Conversation[]>([])
  // 当前对话ID
  const currentConversationId = ref<number | null>(null)
  // 当前对话的消息列表
  const messages = ref<Message[]>([])
  // 加载状态
  const isLoading = ref(false)
  // 流式响应状态
  const isStreaming = ref(false)
  
  /**
   * 计算属性：获取当前对话对象
   * 根据当前对话ID查找对应的对话对象
   */
  const currentConversation = computed(() => 
    conversations.value.find(c => c.id === currentConversationId.value)
  )
  
  /**
   * 添加新消息到当前对话
   * 
   * @param message 要添加的消息对象
   */
  const addMessage = (message: Message) => {
    messages.value.push(message)
  }
  
  /**
   * 更新指定消息的内容
   * 
   * @param messageId 消息ID
   * @param content 新的消息内容
   */
  const updateMessage = (messageId: number, content: string) => {
    const message = messages.value.find(m => m.id === messageId)
    if (message) {
      message.content = content
      message.updated_at = new Date().toISOString()
      // 触发响应式更新
      messages.value = [...messages.value]
    }
  }
  
  /**
   * 设置当前对话
   * 
   * @param conversationId 对话ID，可以为null
   */
  const setCurrentConversation = (conversationId: number | null) => {
    currentConversationId.value = conversationId
  }
  
  /**
   * 添加新对话到列表
   * 
   * @param conversation 对话对象
   */
  const addConversation = (conversation: Conversation) => {
    conversations.value.unshift(conversation)
    currentConversationId.value = conversation.id
    // 注意：不清空消息列表，让调用方决定是否清空
    // messages.value = []
  }

  /**
   * 加载会话列表
   * 
   * 从服务器获取用户的对话会话列表，并保存到本地存储
   * 如果网络请求失败，尝试从本地存储恢复数据
   * 
   * @returns Promise<any[]> 会话列表
   */
  const loadConversations = async () => {
    try {
      const { chatApi } = await import('../api')
      const conversationsList = await chatApi.getConversations()
      conversations.value = conversationsList
      
      // 保存到localStorage进行持久化
      localStorage.setItem('conversations', JSON.stringify(conversationsList))
      
      return conversationsList
    } catch (error) {
      console.error('加载会话列表失败:', error)
      // 尝试从localStorage恢复数据
      const savedConversations = localStorage.getItem('conversations')
      if (savedConversations) {
        try {
          conversations.value = JSON.parse(savedConversations)
        } catch (parseError) {
          console.error('解析本地会话数据失败:', parseError)
        }
      }
      throw error
    }
  }

  /**
   * 加载会话消息
   * 
   * 从服务器获取指定对话的消息历史，并保存到本地存储
   * 如果网络请求失败，尝试从本地存储恢复数据
   * 
   * @param conversationId 对话ID
   * @returns Promise<Message[]> 消息列表
   */
  const loadConversationMessages = async (conversationId: number) => {
    try {
      const { chatApi } = await import('../api')
      const response = await chatApi.getMessageHistory(conversationId)
      messages.value = response.messages
      
      // 保存到localStorage进行持久化
      localStorage.setItem(`messages_${conversationId}`, JSON.stringify(response.messages))
      
      return response.messages
    } catch (error) {
      console.error('加载会话消息失败:', error)
      // 尝试从localStorage恢复数据
      const savedMessages = localStorage.getItem(`messages_${conversationId}`)
      if (savedMessages) {
        try {
          messages.value = JSON.parse(savedMessages)
        } catch (parseError) {
          console.error('解析本地消息数据失败:', parseError)
        }
      }
      throw error
    }
  }

  // 更新会话标题
  const updateConversationTitle = async (conversationId: number, title: string) => {
    try {
      const { chatApi } = await import('../api')
      await chatApi.updateConversationTitle(conversationId, title)
      
      // 更新本地状态
      const conversation = conversations.value.find(c => c.id === conversationId)
      if (conversation) {
        conversation.title = title
        conversation.updated_at = new Date().toISOString()
        
        // 更新localStorage
        localStorage.setItem('conversations', JSON.stringify(conversations.value))
      }
    } catch (error) {
      console.error('更新会话标题失败:', error)
      throw error
    }
  }

  // 删除会话
  const deleteConversation = async (conversationId: number) => {
    try {
      const { chatApi } = await import('../api')
      await chatApi.deleteConversation(conversationId)
      
      // 更新本地状态
      conversations.value = conversations.value.filter(c => c.id !== conversationId)
      
      // 如果删除的是当前会话，清空消息
      if (currentConversationId.value === conversationId) {
        currentConversationId.value = null
        messages.value = []
      }
      
      // 更新localStorage
      localStorage.setItem('conversations', JSON.stringify(conversations.value))
      localStorage.removeItem(`messages_${conversationId}`)
    } catch (error) {
      console.error('删除会话失败:', error)
      throw error
    }
  }

  // 清空消息
  const clearMessages = () => {
    messages.value = []
  }

  // 从localStorage恢复状态
  const restoreFromLocalStorage = () => {
    try {
      const savedConversations = localStorage.getItem('conversations')
      if (savedConversations) {
        conversations.value = JSON.parse(savedConversations)
      }
      
      const savedCurrentId = localStorage.getItem('currentConversationId')
      if (savedCurrentId) {
        currentConversationId.value = parseInt(savedCurrentId)
        
        // 恢复当前会话的消息
        const savedMessages = localStorage.getItem(`messages_${savedCurrentId}`)
        if (savedMessages) {
          messages.value = JSON.parse(savedMessages)
        }
      }
    } catch (error) {
      console.error('从localStorage恢复状态失败:', error)
    }
  }

  // 保存当前状态到localStorage
  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('conversations', JSON.stringify(conversations.value))
      if (currentConversationId.value) {
        localStorage.setItem('currentConversationId', currentConversationId.value.toString())
        localStorage.setItem(`messages_${currentConversationId.value}`, JSON.stringify(messages.value))
      }
    } catch (error) {
      console.error('保存到localStorage失败:', error)
    }
  }
  
  return {
    conversations,
    currentConversationId,
    messages,
    isLoading,
    isStreaming,
    currentConversation,
    addMessage,
    updateMessage,
    setCurrentConversation,
    addConversation,
    loadConversations,
    loadConversationMessages,
    updateConversationTitle,
    deleteConversation,
    clearMessages,
    restoreFromLocalStorage,
    saveToLocalStorage
  }
})

// 模型状态管理
export const useModelStore = defineStore('model', () => {
  const models = ref<ModelConfig[]>([])
  const defaultModel = ref<ModelConfig | null>(null)
  const isLoading = ref(false)
  
  const activeModels = computed(() => 
    models.value.filter(m => m.is_active)
  )
  
  const setDefaultModel = (modelId: number) => {
    defaultModel.value = models.value.find(m => m.id === modelId) || null
  }
  
  const loadModels = async () => {
    try {
      isLoading.value = true
      const { modelApi } = await import('../api')
      const modelList = await modelApi.getActiveModels()
      models.value = modelList
      // 模型列表加载成功
    } catch (error) {
      console.error('加载模型列表失败:', error)
      models.value = []
    } finally {
      isLoading.value = false
    }
  }
  
  return {
    models,
    defaultModel,
    isLoading,
    activeModels,
    setDefaultModel,
    loadModels
  }
})

// 设置状态管理
export const useSettingsStore = defineStore('settings', () => {
  // 原有的设置
  const settings = ref<UserSettings>({
    apiBaseUrl: 'http://127.0.0.1:8001',
    theme: 'light',
    language: 'zh-CN',
    autoSave: true,
    maxConversations: 50
  })
  
  // 新增的默认模型设置
  const defaultModelSettings = ref({
    modelId: null as number | null,
    titleGenerationModelId: null as number | null,
    temperature: 0.7,
    maxTokens: 2000,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    enableChainOfThought: false
  })
  
  const generalSettings = ref({
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    autoSave: true
  })
  
  const displaySettings = ref({
    theme: 'light',
    fontSize: 14,
    density: 'normal'
  })
  
  // 原有的更新方法
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
  }
  
  // 新增的更新方法
  const updateDefaultModelSettings = (settings: Partial<typeof defaultModelSettings.value>) => {
    Object.assign(defaultModelSettings.value, settings)
    localStorage.setItem('defaultModelSettings', JSON.stringify(defaultModelSettings.value))
  }
  
  const updateGeneralSettings = (settings: Partial<typeof generalSettings.value>) => {
    Object.assign(generalSettings.value, settings)
    localStorage.setItem('generalSettings', JSON.stringify(generalSettings.value))
  }
  
  const updateDisplaySettings = (settings: Partial<typeof displaySettings.value>) => {
    Object.assign(displaySettings.value, settings)
    localStorage.setItem('displaySettings', JSON.stringify(displaySettings.value))
  }
  
  const loadSettings = () => {
    try {
      // 加载原有设置
      const savedSettings = localStorage.getItem('userSettings')
      if (savedSettings) {
        settings.value = JSON.parse(savedSettings)
      }
      
      // 加载新增设置
      const savedModelSettings = localStorage.getItem('defaultModelSettings')
      if (savedModelSettings) {
        defaultModelSettings.value = JSON.parse(savedModelSettings)
      }
      
      const savedGeneralSettings = localStorage.getItem('generalSettings')
      if (savedGeneralSettings) {
        generalSettings.value = JSON.parse(savedGeneralSettings)
      }
      
      const savedDisplaySettings = localStorage.getItem('displaySettings')
      if (savedDisplaySettings) {
        displaySettings.value = JSON.parse(savedDisplaySettings)
      }
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  }
  
  return {
    // 原有返回值
    settings,
    updateSettings,
    // 新增返回值
    defaultModelSettings,
    generalSettings,
    displaySettings,
    updateDefaultModelSettings,
    updateGeneralSettings,
    updateDisplaySettings,
    loadSettings
  }
})

// 提示词状态管理
export const usePromptStore = defineStore('prompt', () => {
  const prompts = ref<PromptTemplate[]>([])
  const isLoading = ref(false)
  
  return {
    prompts,
    isLoading
  }
})

// 知识库状态管理
export const useKnowledgeStore = defineStore('knowledge', () => {
  const knowledgeBases = ref<KnowledgeBase[]>([])
  const currentKnowledgeBase = ref<KnowledgeBase | null>(null)
  const isLoading = ref(false)
  
  const activeKnowledgeBases = computed(() => 
    knowledgeBases.value.filter(kb => kb.is_active)
  )
  
  return {
    knowledgeBases,
    currentKnowledgeBase,
    isLoading,
    activeKnowledgeBases
  }
})

/**
 * 用户认证状态管理Store
 * 
 * 功能说明：
 * 1. 管理用户登录状态
 * 2. 处理用户认证token
 * 3. 提供登录、注册、登出功能
 * 4. 管理用户信息状态
 */
export const useAuthStore = defineStore('auth', () => {
  // 当前用户信息
  const user = ref<UserInfo | null>(null)
  // 访问令牌
  const token = ref<string | null>(null)
  // 认证状态
  const isAuthenticated = ref(false)
  // 加载状态
  const isLoading = ref(false)
  
  /**
   * 从localStorage恢复认证状态
   * 
   * 在应用启动时调用，尝试从本地存储恢复用户的登录状态
   * 并验证token的有效性
   */
  const initAuth = async () => {
    const savedToken = localStorage.getItem('access_token')
    const savedUser = localStorage.getItem('user_info')
    
    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = JSON.parse(savedUser)
      
      // 验证token是否仍然有效
      try {
        await authApi.getCurrentUser()
        isAuthenticated.value = true
      } catch (error) {
        // token无效，清除本地存储
        console.warn('Token已失效，清除本地认证信息')
        await logout()
      }
    }
  }
  
  /**
   * 用户登录
   * 
   * @param credentials 登录凭据（用户名和密码）
   * @returns Promise<{ success: boolean; error?: string }> 登录结果
   */
  const login = async (credentials: LoginRequest) => {
    try {
      isLoading.value = true
      const response: AuthResponse = await authApi.login(credentials)
      
      // 保存访问令牌
      token.value = response.access_token
      localStorage.setItem('access_token', response.access_token)
      
      // 获取并保存用户信息
      const userInfo = await authApi.getCurrentUser()
      user.value = userInfo
      localStorage.setItem('user_info', JSON.stringify(userInfo))
      
      // 清除旧的会话缓存，确保新用户看到的是自己的数据
      clearConversationCache()
      
      isAuthenticated.value = true
      return { success: true }
    } catch (error: any) {
      console.error('登录失败:', error)
      return { 
        success: false, 
        error: error.response?.data?.detail || '登录失败' 
      }
    } finally {
      isLoading.value = false
    }
  }
  
  // 注册
  const register = async (userData: RegisterRequest) => {
    try {
      isLoading.value = true
      const userInfo = await authApi.register(userData)
      
      // 注册成功后自动登录
      const loginResult = await login({
        username: userData.username,
        password: userData.password
      })
      
      return loginResult
    } catch (error: any) {
      console.error('注册失败:', error)
      return { 
        success: false, 
        error: error.response?.data?.detail || '注册失败' 
      }
    } finally {
      isLoading.value = false
    }
  }
  
  // 登出
  const logout = async () => {
    try {
      if (token.value) {
        await authApi.logout()
      }
    } catch (error) {
      console.error('登出失败:', error)
    } finally {
      // 清除本地状态
      user.value = null
      token.value = null
      isAuthenticated.value = false
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_info')
    }
  }
  
  // 刷新用户信息
  const refreshUserInfo = async () => {
    try {
      if (token.value) {
        const userInfo = await authApi.getCurrentUser()
        user.value = userInfo
        localStorage.setItem('user_info', JSON.stringify(userInfo))
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error)
      // 如果刷新失败，可能token已过期，执行登出
      await logout()
    }
  }
  
  // 检查是否已登录
  const checkAuth = () => {
    return isAuthenticated.value && token.value !== null
  }
  
  /**
   * 强制清除所有认证状态
   * 用于数据库被清空等特殊情况
   */
  const forceLogout = () => {
    user.value = null
    token.value = null
    isAuthenticated.value = false
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_info')
    // 已强制清除认证状态
  }
  
  /**
   * 清除所有会话缓存数据
   * 用于用户切换或数据重置
   */
  const clearConversationCache = () => {
    // 清除会话相关的localStorage数据
    localStorage.removeItem('conversations')
    localStorage.removeItem('currentConversationId')
    
    // 清除所有消息缓存
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('messages_')) {
        localStorage.removeItem(key)
      }
    }
    
    // 已清除所有会话缓存数据
  }
  
  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    initAuth,
    login,
    register,
    logout,
    refreshUserInfo,
    checkAuth,
    forceLogout,
    clearConversationCache
  }
})


