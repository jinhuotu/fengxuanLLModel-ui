/**
 * API接口配置文件
 * 
 * 功能说明：
 * 1. 配置HTTP请求客户端（axios）
 * 2. 定义所有API接口方法
 * 3. 处理请求和响应拦截
 * 4. 管理认证token
 */

// Axios HTTP客户端库导入
import axios from 'axios'
// 类型定义导入
import type { 
  ChatRequest, 
  ChatResponse, 
  ConversationCreateRequest,
  ConversationCreateResponse,
  MessageHistoryResponse,
  RAGChatRequest,
  RAGChatResponse,
  ModelConfig,
  PromptTemplate,
  KnowledgeBase,
  Document,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserInfo
} from '../types'
import type {
  MCPSession,
  MCPSessionCreateRequest,
  MCPContext,
  MCPRequestPayload,
  MCPResponsePayload,
  MCPSessionStats
} from '../types/mcp'

/**
 * 创建axios实例
 * 
 * 配置说明：
 * - baseURL: API服务器基础URL
 * - timeout: 请求超时时间（30秒）
 * - headers: 默认请求头配置
 */
const api = axios.create({
  baseURL: 'http://127.0.0.1:8001/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * 请求拦截器
 * 
 * 功能说明：
 * 1. 在发送请求前自动添加认证token
 * 2. 记录请求日志用于调试
 * 3. 处理请求错误
 */
api.interceptors.request.use(
  (config) => {
    // 自动添加认证token到请求头
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器
 * 
 * 功能说明：
 * 1. 处理成功的API响应
 * 2. 记录响应日志
 * 3. 处理HTTP错误状态码
 * 4. 自动处理401未授权错误
 */
api.interceptors.response.use(
  (response) => {
    // 直接返回响应数据，简化后续处理
    return response.data
  },
  (error) => {
    // 详细记录API请求错误信息（生产环境可关闭）
    if (import.meta.env.DEV) {
      console.error('API请求错误详情:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      })
    }
    
    /**
     * 处理401未授权错误
     * 当token过期或无效时，自动清除本地存储并跳转到登录页
     */
    if (error.response?.status === 401) {
      if (import.meta.env.DEV) {
        console.warn('用户未授权，清除本地存储并跳转到登录页')
      }
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_info')
      // 可以在这里触发登出逻辑
      window.location.href = '/login'
    }
    
    /**
     * 处理其他HTTP错误
     * 记录4xx和5xx状态码的错误信息
     */
    if (error.response?.status >= 400 && import.meta.env.DEV) {
      console.error(`HTTP错误 ${error.response.status}:`, error.response.data)
    }
    
    // 返回完整的错误对象，包含response信息，供调用方处理
    return Promise.reject(error)
  }
)

/**
 * 聊天相关API接口
 * 
 * 功能说明：
 * 1. 处理用户与AI模型的对话交互
 * 2. 支持流式和非流式消息发送
 * 3. 管理对话会话和消息历史
 * 4. 提供RAG（检索增强生成）功能
 */
export const chatApi = {
  /**
   * 发送消息（非流式）
   * 
   * @param request 聊天请求对象，包含消息内容、模型配置等
   * @returns Promise<ChatResponse> 聊天响应对象
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    return api.post('/chat/send', request)
  },

  /**
   * 发送消息（流式）
   * 
   * 使用fetch API实现流式响应，支持实时接收AI生成的内容
   * 
   * @param request 聊天请求对象
   * @returns Promise<ReadableStream> 可读流对象
   */
  async sendMessageStream(request: ChatRequest): Promise<ReadableStream> {
    const token = localStorage.getItem('access_token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    
    const response = await fetch(`${api.defaults.baseURL}/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.body!
  },

  /**
   * 创建新对话会话
   * 
   * @param request 对话创建请求对象
   * @returns Promise<ConversationCreateResponse> 对话创建响应
   */
  async createConversation(request: ConversationCreateRequest): Promise<ConversationCreateResponse> {
    return api.post('/chat/conversations', request)
  },

  /**
   * 获取对话消息历史
   * 
   * @param conversationId 对话ID
   * @param limit 消息数量限制，默认50条
   * @returns Promise<MessageHistoryResponse> 消息历史响应
   */
  async getMessageHistory(conversationId: number, limit = 50): Promise<MessageHistoryResponse> {
    return api.get(`/chat/conversations/${conversationId}/messages?limit=${limit}`)
  },

  /**
   * RAG聊天（检索增强生成）
   * 
   * 结合知识库进行智能问答，提供更准确的回答
   * 
   * @param request RAG聊天请求对象
   * @returns Promise<RAGChatResponse> RAG聊天响应
   */
  async chatWithRAG(request: RAGChatRequest): Promise<RAGChatResponse> {
    return api.post('/chat/rag', request)
  },

  /**
   * 获取对话摘要
   * 
   * @param conversationId 对话ID
   * @returns Promise<any> 对话摘要信息
   */
  async getConversationSummary(conversationId: number): Promise<any> {
    return api.get(`/chat/conversations/${conversationId}/summary`)
  },

  /**
   * 获取用户会话列表
   * 
   * @param skip 跳过的记录数，用于分页
   * @param limit 返回的记录数限制
   * @returns Promise<any[]> 会话列表
   */
  async getConversations(skip = 0, limit = 20): Promise<any[]> {
    return api.get(`/conversations?skip=${skip}&limit=${limit}`)
  },

  /**
   * 获取特定会话详情
   * 
   * @param conversationId 对话ID
   * @returns Promise<any> 会话详情
   */
  async getConversation(conversationId: number): Promise<any> {
    return api.get(`/conversations/${conversationId}`)
  },

  /**
   * 更新会话标题
   * 
   * @param conversationId 对话ID
   * @param title 新的标题
   * @returns Promise<any> 更新结果
   */
  async updateConversationTitle(conversationId: number, title: string): Promise<any> {
    return api.put(`/conversations/${conversationId}/title`, { title })
  },

  /**
   * 删除会话
   * 
   * @param conversationId 对话ID
   * @returns Promise<any> 删除结果
   */
  async deleteConversation(conversationId: number): Promise<any> {
    return api.delete(`/conversations/${conversationId}`)
  },

  /**
   * 更新对话的提示词模板
   * 
   * @param conversationId 对话ID
   * @param request 更新请求
   * @returns Promise<any> 更新结果
   */
  async updateConversationPromptTemplate(conversationId: number, request: { prompt_template_id: number }): Promise<any> {
    return api.put(`/conversations/${conversationId}/prompt-template`, request)
  },

  /**
   * 更新对话的提示词模板
   * 
   * @param conversationId 对话ID
   * @param request 更新请求
   * @returns Promise<any> 更新结果
   */
  async updateConversationPromptTemplate(conversationId: number, request: { prompt_template_id: number }): Promise<any> {
    return api.put(`/conversations/${conversationId}/prompt-template`, request)
  }
}

/**
 * 图片生成API接口
 * 
 * 功能说明：
 * 1. 处理图片生成请求
 * 2. 支持基于提示词生成图片
 * 3. 支持选中图片进行调整
 * 4. 管理对话中的图片
 */
export const imageApi = {
  /**
   * 生成图片
   * 
   * @param request 图片生成请求对象
   * @returns Promise<ImageGenerationResponse> 图片生成响应
   */
  async generateImage(request: any): Promise<any> {
    return api.post('/images/generate', request)
  },

  /**
   * 调整图片
   * 
   * 基于已生成的图片和调整描述，重新生成调整后的图片
   * 
   * @param request 图片调整请求对象
   * @returns Promise<ImageGenerationResponse> 调整后的图片响应
   */
  async adjustImage(request: any): Promise<any> {
    return api.post('/images/adjust', request)
  },

  /**
   * 获取对话中的图片列表
   * 
   * @param conversationId 对话ID
   * @param skip 跳过的记录数
   * @param limit 返回的记录数限制
   * @returns Promise<ImageGenerationListResponse> 图片列表响应
   */
  async getConversationImages(conversationId: number, skip = 0, limit = 50): Promise<any> {
    return api.get(`/images/conversation/${conversationId}?skip=${skip}&limit=${limit}`)
  },

  /**
   * 获取单张图片详情
   * 
   * @param imageId 图片ID
   * @returns Promise<ImageGenerationResponse> 图片详情
   */
  async getImage(imageId: number): Promise<any> {
    return api.get(`/images/${imageId}`)
  }
}

/**
 * 模型管理API接口
 * 
 * 功能说明：
 * 1. 管理AI模型的配置和状态
 * 2. 支持多种模型提供商（OpenAI、Claude等）
 * 3. 提供模型的CRUD操作
 * 4. 支持模型连接测试和默认模型设置
 */
export const modelApi = {
  /**
   * 获取模型列表
   * 
   * @param skip 跳过的记录数，用于分页
   * @param limit 返回的记录数限制
   * @param provider 模型提供商过滤（可选）
   * @param activeOnly 是否只返回激活的模型
   * @returns Promise<ModelConfig[]> 模型配置列表
   */
  async getModels(skip = 0, limit = 100, provider?: string, activeOnly = true): Promise<ModelConfig[]> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
      active_only: activeOnly.toString()
    })
    if (provider) params.append('provider', provider)
    
    return api.get(`/models?${params}`)
  },

  /**
   * 获取激活的模型列表
   * 
   * @returns Promise<ModelConfig[]> 激活的模型列表
   */
  async getActiveModels(): Promise<ModelConfig[]> {
    return api.get('/models/active')
  },

  /**
   * 获取默认模型配置
   * 
   * @returns Promise<ModelConfig> 默认模型配置
   */
  async getDefaultModel(): Promise<ModelConfig> {
    try {
      return await api.get('/models/default')
    } catch (error: any) {
      // 如果是404错误，说明没有设置默认模型，这是正常情况
      if (error.response?.status === 404) {
        throw new Error('未找到默认模型')
      }
      throw error
    }
  },

  /**
   * 获取特定模型详情
   * 
   * @param modelId 模型ID
   * @returns Promise<ModelConfig> 模型配置详情
   */
  async getModel(modelId: number): Promise<ModelConfig> {
    return api.get(`/models/${modelId}`)
  },

  /**
   * 创建新模型配置
   * 
   * @param model 模型配置对象
   * @returns Promise<ModelConfig> 创建的模型配置
   */
  async createModel(model: Partial<ModelConfig>): Promise<ModelConfig> {
    return api.post('/models', model)
  },

  /**
   * 更新模型配置
   * 
   * @param modelId 模型ID
   * @param model 更新的模型配置
   * @returns Promise<ModelConfig> 更新后的模型配置
   */
  async updateModel(modelId: number, model: Partial<ModelConfig>): Promise<ModelConfig> {
    return api.put(`/models/${modelId}`, model)
  },

  /**
   * 删除模型配置
   * 
   * @param modelId 模型ID
   * @returns Promise<{ message: string }> 删除结果消息
   */
  async deleteModel(modelId: number): Promise<{ message: string }> {
    return api.delete(`/models/${modelId}`)
  },

  /**
   * 设置默认模型
   * 
   * @param modelId 模型ID
   * @returns Promise<{ message: string }> 设置结果消息
   */
  async setDefaultModel(modelId: number): Promise<{ message: string }> {
    return api.post(`/models/${modelId}/set-default`)
  },

  /**
   * 测试模型连接
   * 
   * 验证模型配置是否正确，API密钥是否有效
   * 
   * @param modelId 模型ID
   * @returns Promise<any> 测试结果
   */
  async testModel(modelId: number): Promise<any> {
    return api.post(`/models/${modelId}/test`)
  },

  /**
   * 根据提供商获取模型列表
   * 
   * @param provider 提供商名称
   * @returns Promise<ModelConfig[]> 该提供商的模型列表
   */
  async getModelsByProvider(provider: string): Promise<ModelConfig[]> {
    return api.get(`/models/providers/${provider}`)
  }
}

/**
 * 提示词管理API接口
 * 
 * 功能说明：
 * 1. 管理AI对话的提示词模板
 * 2. 支持提示词的CRUD操作
 * 3. 提供激活/非激活状态管理
 * 4. 支持提示词模板的复用和定制
 */
export const promptApi = {
  /**
   * 获取提示词列表
   * 
   * @param skip 跳过的记录数，用于分页
   * @param limit 返回的记录数限制
   * @param activeOnly 是否只返回激活的提示词
   * @returns Promise<PromptTemplate[]> 提示词模板列表
   */
  async getPrompts(skip = 0, limit = 100, activeOnly = true): Promise<PromptTemplate[]> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
      active_only: activeOnly.toString()
    })
    
    return api.get(`/prompts?${params}`)
  },

  /**
   * 获取激活的提示词列表
   * 
   * @returns Promise<PromptTemplate[]> 激活的提示词列表
   */
  async getActivePrompts(): Promise<PromptTemplate[]> {
    return api.get('/prompts/active')
  },

  /**
   * 获取特定提示词详情
   * 
   * @param promptId 提示词ID
   * @returns Promise<PromptTemplate> 提示词模板详情
   */
  async getPrompt(promptId: number): Promise<PromptTemplate> {
    return api.get(`/prompts/${promptId}`)
  },

  /**
   * 创建新提示词模板
   * 
   * @param prompt 提示词模板对象
   * @returns Promise<PromptTemplate> 创建的提示词模板
   */
  async createPrompt(prompt: Partial<PromptTemplate>): Promise<PromptTemplate> {
    return api.post('/prompts', prompt)
  },

  /**
   * 更新提示词模板
   * 
   * @param promptId 提示词ID
   * @param prompt 更新的提示词模板
   * @returns Promise<PromptTemplate> 更新后的提示词模板
   */
  async updatePrompt(promptId: number, prompt: Partial<PromptTemplate>): Promise<PromptTemplate> {
    return api.put(`/prompts/${promptId}`, prompt)
  },

  /**
   * 删除提示词模板
   * 
   * @param promptId 提示词ID
   * @returns Promise<{ message: string }> 删除结果消息
   */
  async deletePrompt(promptId: number): Promise<{ message: string }> {
    return api.delete(`/prompts/${promptId}`)
  }
}

/**
 * 知识库管理API接口
 * 
 * 功能说明：
 * 1. 管理知识库的创建、更新和删除
 * 2. 处理文档的上传、删除和搜索
 * 3. 提供知识库统计信息
 * 4. 支持RAG（检索增强生成）功能
 */
export const knowledgeApi = {
  /**
   * 获取知识库列表
   * 
   * @param skip 跳过的记录数，用于分页
   * @param limit 返回的记录数限制
   * @param activeOnly 是否只返回激活的知识库
   * @returns Promise<KnowledgeBase[]> 知识库列表
   */
  async getKnowledgeBases(skip = 0, limit = 100, activeOnly = true): Promise<KnowledgeBase[]> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
      active_only: activeOnly.toString()
    })
    
    return api.get(`/knowledge-bases?${params}`)
  },

  /**
   * 获取激活的知识库列表
   * 
   * @returns Promise<KnowledgeBase[]> 激活的知识库列表
   */
  async getActiveKnowledgeBases(): Promise<KnowledgeBase[]> {
    return api.get('/knowledge-bases/active')
  },

  /**
   * 获取特定知识库详情
   * 
   * @param knowledgeBaseId 知识库ID
   * @returns Promise<KnowledgeBase> 知识库详情
   */
  async getKnowledgeBase(knowledgeBaseId: number): Promise<KnowledgeBase> {
    return api.get(`/knowledge-bases/${knowledgeBaseId}`)
  },

  /**
   * 创建新知识库
   * 
   * @param knowledgeBase 知识库配置对象
   * @returns Promise<KnowledgeBase> 创建的知识库
   */
  async createKnowledgeBase(knowledgeBase: Partial<KnowledgeBase>): Promise<KnowledgeBase> {
    return api.post('/knowledge-bases', knowledgeBase)
  },

  /**
   * 更新知识库配置
   * 
   * @param knowledgeBaseId 知识库ID
   * @param knowledgeBase 更新的知识库配置
   * @returns Promise<KnowledgeBase> 更新后的知识库
   */
  async updateKnowledgeBase(knowledgeBaseId: number, knowledgeBase: Partial<KnowledgeBase>): Promise<KnowledgeBase> {
    return api.put(`/knowledge-bases/${knowledgeBaseId}`, knowledgeBase)
  },

  /**
   * 删除知识库
   * 
   * @param knowledgeBaseId 知识库ID
   * @returns Promise<{ message: string }> 删除结果消息
   */
  async deleteKnowledgeBase(knowledgeBaseId: number): Promise<{ message: string }> {
    return api.delete(`/knowledge-bases/${knowledgeBaseId}`)
  },

  /**
   * 获取知识库文档列表
   * 
   * @param knowledgeBaseId 知识库ID
   * @returns Promise<Document[]> 文档列表
   */
  async getKnowledgeBaseDocuments(knowledgeBaseId: number): Promise<Document[]> {
    return api.get(`/knowledge-bases/${knowledgeBaseId}/documents`)
  },

  /**
   * 上传文档到知识库
   * 
   * @param knowledgeBaseId 知识库ID
   * @param file 要上传的文件
   * @returns Promise<any> 上传结果
   */
  async uploadDocument(knowledgeBaseId: number, file: File): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)
    
    return api.post(`/knowledge-bases/${knowledgeBaseId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  /**
   * 删除知识库中的文档
   * 
   * @param knowledgeBaseId 知识库ID
   * @param documentId 文档ID
   * @returns Promise<{ message: string }> 删除结果消息
   */
  async deleteDocument(knowledgeBaseId: number, documentId: number): Promise<{ message: string }> {
    return api.delete(`/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`)
  },

  /**
   * 获取知识库统计信息
   * 
   * @param knowledgeBaseId 知识库ID
   * @returns Promise<any> 统计信息
   */
  async getKnowledgeBaseStats(knowledgeBaseId: number): Promise<any> {
    return api.get(`/knowledge-bases/${knowledgeBaseId}/stats`)
  },

  /**
   * 搜索知识库
   * 
   * 在知识库中搜索相关文档，用于RAG功能
   * 
   * @param knowledgeBaseId 知识库ID
   * @param query 搜索查询
   * @param topK 返回的文档数量
   * @returns Promise<any> 搜索结果
   */
  async searchKnowledgeBase(knowledgeBaseId: number, query: string, topK = 5): Promise<any> {
    const formData = new FormData()
    formData.append('query', query)
    formData.append('top_k', topK.toString())
    
    return api.post(`/knowledge-bases/${knowledgeBaseId}/search`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

/**
 * 用户认证API接口
 * 
 * 功能说明：
 * 1. 处理用户登录和注册
 * 2. 管理用户认证状态
 * 3. 提供token刷新和登出功能
 * 4. 获取当前用户信息
 */
export const authApi = {
  /**
   * 用户登录
   * 
   * @param credentials 登录凭据（用户名和密码）
   * @returns Promise<AuthResponse> 认证响应，包含访问令牌
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return api.post('/auth/login', credentials)
  },

  /**
   * 用户注册
   * 
   * @param userData 用户注册信息
   * @returns Promise<UserInfo> 注册后的用户信息
   */
  async register(userData: RegisterRequest): Promise<UserInfo> {
    return api.post('/auth/register', userData)
  },

  /**
   * 获取当前用户信息
   * 
   * @returns Promise<UserInfo> 当前用户信息
   */
  async getCurrentUser(): Promise<UserInfo> {
    return api.get('/auth/me')
  },

  /**
   * 刷新访问令牌
   * 
   * 当token即将过期时，使用此接口获取新的token
   * 
   * @returns Promise<AuthResponse> 新的认证响应
   */
  async refreshToken(): Promise<AuthResponse> {
    return api.post('/auth/refresh')
  },

  /**
   * 用户登出
   * 
   * 清除服务器端的用户会话
   * 
   * @returns Promise<{ message: string }> 登出结果消息
   */
  async logout(): Promise<{ message: string }> {
    return api.post('/auth/logout')
  }
}

/**
 * 用户设置API接口
 * 
 * 功能说明：
 * 1. 管理用户个性化设置
 * 2. 处理默认模型配置
 * 3. 管理标题生成模型设置
 * 4. 提供设置验证和默认值处理
 */
export const userSettingsApi = {
  /**
   * 获取用户设置
   * 
   * @returns Promise<any> 用户设置信息
   */
  async getUserSettings(): Promise<any> {
    return api.get('/user-settings')
  },

  /**
   * 创建用户设置
   * 
   * @param settings 用户设置数据
   * @returns Promise<any> 创建的用户设置
   */
  async createUserSettings(settings: any): Promise<any> {
    return api.post('/user-settings', settings)
  },

  /**
   * 更新用户设置
   * 
   * @param settings 更新的设置数据
   * @returns Promise<any> 更新后的用户设置
   */
  async updateUserSettings(settings: any): Promise<any> {
    return api.put('/user-settings', settings)
  },

  /**
   * 删除用户设置
   * 
   * @returns Promise<any> 删除结果
   */
  async deleteUserSettings(): Promise<any> {
    return api.delete('/user-settings')
  },

  /**
   * 生成对话标题
   * 
   * @param request 标题生成请求
   * @returns Promise<any> 标题生成结果
   */
  async generateTitle(request: any): Promise<any> {
    return api.post('/user-settings/generate-title', request)
  },

  /**
   * 获取数据目录信息
   * 
   * @returns Promise<any> 数据目录信息
   */
  async getDataDirectories(): Promise<any> {
    return api.get('/user-settings/data-directories')
  },

  /**
   * 清除缓存
   * 
   * @returns Promise<any> 清除结果
   */
  async clearCache(): Promise<any> {
    return api.post('/user-settings/clear-cache')
  },

  /**
   * 删除知识库文件
   * 
   * @returns Promise<any> 删除结果
   */
  async deleteKnowledgeFiles(): Promise<any> {
    return api.post('/user-settings/delete-knowledge-files')
  },

  /**
   * 重置所有数据
   * 
   * @returns Promise<any> 重置结果
   */
  async resetAllData(): Promise<any> {
    return api.post('/user-settings/reset-all-data')
  },

  /**
   * 获取系统信息
   * 
   * @returns Promise<any> 系统信息
   */
  async getSystemInfo(): Promise<any> {
    return api.get('/user-settings/system-info')
  }
}

/**
 * 个人资料API接口
 * 
 * 功能说明：
 * 1. 管理用户个人资料信息
 * 2. 处理头像上传功能
 * 3. 提供密码修改功能
 * 4. 支持用户信息更新
 */
export const profileApi = {
  /**
   * 更新个人资料
   * 
   * @param profileData 个人资料数据
   * @returns Promise<any> 更新结果
   */
  async updateProfile(profileData: any): Promise<any> {
    return api.put('/auth/me', profileData)
  },

  /**
   * 修改密码
   * 
   * @param passwordData 密码数据
   * @returns Promise<any> 修改结果
   */
  async changePassword(passwordData: any): Promise<any> {
    return api.post('/auth/change-password', passwordData)
  },

  /**
   * 上传头像
   * 
   * @param file 头像文件
   * @returns Promise<any> 上传结果
   */
  async uploadAvatar(file: File): Promise<any> {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.post('/auth/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

/**
 * 待办事项API接口
 * 
 * 功能说明：
 * 1. 管理用户的待办事项
 * 2. 支持多状态管理（待完成、进行中、已完成）
 * 3. 确保用户数据隔离
 */
export const todoApi = {
  /**
   * 创建待办事项
   * 
   * @param request 创建待办事项请求
   * @returns Promise<Todo> 创建的待办事项
   */
  async createTodo(request: any): Promise<any> {
    return api.post('/todos/', request)
  },

  /**
   * 获取用户的待办事项列表
   * 
   * @param params 查询参数
   * @returns Promise<Todo[]> 待办事项列表
   */
  async getTodos(params: any = {}): Promise<any[]> {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `/todos?${queryString}` : '/todos/'
    return api.get(url)
  },

  /**
   * 获取待办事项详情
   * 
   * @param todoId 待办事项ID
   * @returns Promise<Todo> 待办事项详情
   */
  async getTodo(todoId: number): Promise<any> {
    return api.get(`/todos/${todoId}`)
  },

  /**
   * 更新待办事项
   * 
   * @param todoId 待办事项ID
   * @param request 更新请求
   * @returns Promise<Todo> 更新后的待办事项
   */
  async updateTodo(todoId: number, request: any): Promise<any> {
    return api.put(`/todos/${todoId}`, request)
  },

  /**
   * 删除待办事项
   * 
   * @param todoId 待办事项ID
   * @returns Promise<any> 删除结果
   */
  async deleteTodo(todoId: number): Promise<any> {
    return api.delete(`/todos/${todoId}`)
  },

  /**
   * 批量删除待办事项
   * 
   * @param todoIds 待办事项ID数组
   * @returns Promise<any> 删除结果
   */
  async batchDeleteTodos(todoIds: number[]): Promise<any> {
    return api.delete('/todos/batch', { data: { todo_ids: todoIds } })
  },

  /**
   * 获取待办事项统计信息
   * 
   * @returns Promise<TodoStats> 统计信息
   */
  async getTodoStats(): Promise<any> {
    return api.get('/todos/stats/summary')
  }
}

/**
 * MCP (Model Context Protocol) API接口
 * 
 * 功能说明：
 * 1. 管理MCP会话的创建、查询和删除
 * 2. 发送MCP请求并处理响应
 * 3. 管理MCP上下文
 * 4. 提供健康检查功能
 */
export const mcpApi = {
  /**
   * 创建MCP会话
   * 
   * @param request MCP会话创建请求
   * @returns Promise<MCPSession> 创建的MCP会话
   */
  async createSession(request: MCPSessionCreateRequest): Promise<MCPSession> {
    return api.post('/mcp/sessions', request)
  },

  /**
   * 获取MCP会话列表
   * 
   * @param isActive 是否只返回活跃会话
   * @returns Promise<MCPSession[]> MCP会话列表
   */
  async getSessions(isActive?: boolean): Promise<MCPSession[]> {
    const params = isActive !== undefined ? { is_active: isActive } : {}
    return api.get('/mcp/sessions', { params })
  },

  /**
   * 获取MCP会话详情
   * 
   * @param sessionId 会话ID
   * @returns Promise<MCPSession> MCP会话详情
   */
  async getSession(sessionId: string): Promise<MCPSession> {
    return api.get(`/mcp/sessions/${sessionId}`)
  },

  /**
   * 发送MCP请求
   * 
   * @param sessionId 会话ID
   * @param request MCP请求负载
   * @returns Promise<MCPResponsePayload> MCP响应负载
   */
  async sendRequest(sessionId: string, request: MCPRequestPayload): Promise<MCPResponsePayload> {
    return api.post(`/mcp/sessions/${sessionId}/request`, request)
  },

  /**
   * 删除MCP会话
   * 
   * @param sessionId 会话ID
   * @returns Promise<void>
   */
  async deleteSession(sessionId: string): Promise<void> {
    return api.delete(`/mcp/sessions/${sessionId}`)
  },

  /**
   * 获取会话上下文列表
   * 
   * @param sessionId 会话ID
   * @param contextType 上下文类型过滤
   * @param limit 返回数量限制
   * @returns Promise<MCPContext[]> 上下文列表
   */
  async getSessionContexts(sessionId: string, contextType?: string, limit = 50): Promise<MCPContext[]> {
    const params: any = { limit }
    if (contextType) params.context_type = contextType
    return api.get(`/mcp/sessions/${sessionId}/contexts`, { params })
  },

  /**
   * MCP健康检查
   * 
   * @returns Promise<any> 健康检查结果
   */
  async healthCheck(): Promise<any> {
    return api.get('/mcp/health')
  },

  /**
   * 获取MCP会话统计信息
   * 
   * @returns Promise<MCPSessionStats> 统计信息
   */
  async getSessionStats(): Promise<MCPSessionStats> {
    return api.get('/mcp/stats')
  },

  /**
   * 测试MCP服务器连接
   * 
   * @param testData 测试数据，包含服务器地址和连接配置
   * @returns Promise<any> 测试结果
   */
  async testConnection(testData: { server_url?: string; connection_config?: any }): Promise<any> {
    return api.post('/mcp/test-connection', testData)
  }
}

// 导出默认的axios实例，供其他模块使用
export default api
