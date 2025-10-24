// 基础类型定义
export interface BaseEntity {
  id: number
  created_at: string
  updated_at: string
}

// 用户相关类型
export interface User extends BaseEntity {
  username: string
  email: string
  nickname?: string
  avatar?: string
  is_active: boolean
  is_admin: boolean
  last_login?: string
}

// 认证相关类型
export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  confirm_password: string
  nickname?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface UserInfo {
  id: number
  username: string
  email: string
  nickname?: string
  avatar?: string
  is_active: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
  last_login?: string
}

// 对话相关类型
export interface Conversation extends BaseEntity {
  title: string
  user_id: number
  model_config_id: number
  knowledge_base_id?: number
  prompt_template_id?: number
  message_count: number
  is_active: boolean
  last_message_at?: string
}

export interface Message extends BaseEntity {
  conversation_id: number
  role: 'user' | 'assistant' | 'system'
  content: string
  token_count: number
  message_metadata?: Record<string, any>
  expanded?: boolean
}

// 图片生成相关类型
export interface ImageGeneration {
  id: number
  conversation_id: number
  user_id: number
  prompt: string
  original_image_id?: number
  image_url: string
  image_path?: string
  model_provider?: string
  model_name?: string
  size?: string
  quality?: string
  style?: string
  image_metadata?: Record<string, any>
  created_at: string
}

export interface ImageGenerationRequest {
  conversation_id: number
  prompt: string
  original_image_id?: number
  model_provider?: string
  model_name?: string
  size?: string
  quality?: string
  style?: string
  n?: number
}

export interface ImageAdjustmentRequest {
  conversation_id: number
  original_image_id: number
  adjustment_prompt: string
  size?: string
  quality?: string
  style?: string
}

export interface ImageGenerationResponse {
  id: number
  conversation_id: number
  user_id: number
  prompt: string
  original_image_id?: number
  image_url: string
  image_path?: string
  model_provider?: string
  model_name?: string
  size?: string
  quality?: string
  style?: string
  image_metadata?: Record<string, any>
  created_at: string
}

export interface ImageGenerationListResponse {
  images: ImageGenerationResponse[]
  total: number
  conversation_id: number
}

// 模型配置类型
export interface ModelConfig extends BaseEntity {
  name: string
  provider: string
  model_name: string
  api_key: string
  base_url: string
  temperature: string
  max_tokens: number
  is_active: boolean
  is_default: boolean
  description?: string
}

// 提示词模板类型
export interface PromptTemplate extends BaseEntity {
  name: string
  content: string
  description?: string
  category?: string
  is_active: boolean
}

// 知识库相关类型
export interface KnowledgeBase extends BaseEntity {
  name: string
  description?: string
  collection_name: string
  embedding_model: string
  chunk_size: number
  chunk_overlap: number
  is_active: boolean
  document_count: number
  total_chunks: number
}

export interface Document extends BaseEntity {
  knowledge_base_id: number
  filename: string
  original_filename: string
  file_path: string
  file_size: number
  file_type: string
  content?: string
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  chunk_count?: number
  error_message?: string
}

// 聊天请求/响应类型
export interface ChatRequest {
  conversation_id: number
  message: string
  stream: boolean
  model_config_id?: number
  knowledge_base_id?: number
  prompt_template_id?: number
  // 新增：模型设置参数
  model_settings?: ModelSettings
}

// 模型设置参数类型
export interface ModelSettings {
  temperature?: number
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  context_count?: number
  streaming?: boolean
  show_prompt?: boolean
  use_serif_font?: boolean
  auto_collapse_thinking?: boolean
  show_message_outline?: boolean
  message_style?: 'concise' | 'detailed' | 'professional'
  multi_model_style?: 'tag' | 'list' | 'card'
  conversation_nav_button?: 'none' | 'show' | 'auto'
  message_font_size?: 'small' | 'medium' | 'large'
}

export interface ChatResponse {
  success: boolean
  message_id: number
  message: string  // 后端实际返回的是message字段，不是content
  token_count: number
  metadata?: Record<string, any>
  conversation_exceeded?: boolean
}

export interface ChatStreamResponse {
  type: 'content' | 'metadata' | 'error' | 'done'
  content?: string
  metadata?: Record<string, any>
  error?: string
}

// 对话创建类型
export interface ConversationCreateRequest {
  title: string
  model_config_id: number
  knowledge_base_id?: number
  prompt_template_id?: number
}

export interface ConversationCreateResponse {
  conversation_id: number
  title: string
  message: string
}

// 消息历史类型
export interface MessageHistoryRequest {
  conversation_id: number
  limit?: number
}

export interface MessageHistoryResponse {
  messages: Message[]
  total_count: number
  conversation_id: number
}

// RAG聊天类型
export interface RAGChatRequest {
  conversation_id: number
  message: string
  knowledge_base_id: number
  stream: boolean
}

export interface RAGChatResponse {
  message_id: number
  content: string
  sources: Array<{
    content: string
    metadata: Record<string, any>
    distance: number
  }>
  token_count: number
}

// 用户设置类型
export interface UserSettings {
  apiBaseUrl: string
  theme: 'light' | 'dark'
  language: 'zh-CN' | 'en-US'
  autoSave: boolean
  maxConversations: number
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 分页类型
export interface PaginationParams {
  skip: number
  limit: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  skip: number
  limit: number
}

// 文件上传类型
export interface FileUploadResponse {
  document_id: number
  filename: string
  file_size: number
  processing_status: string
  message: string
}

// 知识库统计类型
export interface KnowledgeBaseStats {
  total_documents: number
  total_chunks: number
  total_size: number
  last_updated: string
}
