/**
 * MCP相关类型定义
 * 
 * 功能说明：
 * 1. 定义MCP会话、上下文、消息等数据结构
 * 2. 提供API请求和响应的类型约束
 * 3. 确保类型安全的MCP操作
 */

/**
 * 会话状态枚举
 */
export type SessionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

/**
 * 上下文类型枚举
 */
export type ContextType = 'system' | 'user' | 'assistant' | 'tool'

/**
 * 消息类型枚举
 */
export type MessageType = 'CONNECT' | 'CONNECT_ACK' | 'REQUEST' | 'RESPONSE' | 'ERROR' | 'PING' | 'PONG' | 'DISCONNECT'

/**
 * MCP会话接口
 */
export interface MCPSession {
  id: number
  session_id: string
  user_id: number
  mcp_server_url: string
  conversation_id?: number
  model_config_id?: number
  status: SessionStatus
  is_active: boolean
  message_count: number
  error_count: number
  last_heartbeat_at?: string
  connected_at?: string
  disconnected_at?: string
  created_at: string
  updated_at: string
}

/**
 * 创建MCP会话请求
 */
export interface MCPSessionCreateRequest {
  mcp_server_url?: string
  conversation_id?: number
  model_config_id?: number
  initial_context?: Record<string, any>
  connection_config?: Record<string, any>
}

/**
 * MCP上下文接口
 */
export interface MCPContext {
  id: number
  session_id: string
  model_id?: string
  context_data: Record<string, any>
  context_type: ContextType
  context_metadata?: Record<string, any>
  version: number
  token_count: number
  size_bytes: number
  is_encrypted: boolean
  created_at: string
  updated_at: string
}

/**
 * MCP消息接口
 */
export interface MCPMessage {
  id: number
  session_id: string
  message_id: string
  message_type: MessageType
  direction: 'send' | 'receive'
  payload: Record<string, any>
  status: 'pending' | 'sent' | 'received' | 'failed'
  error_message?: string
  send_at?: string
  receive_at?: string
  duration_ms?: number
  created_at: string
}

/**
 * MCP请求负载
 */
export interface MCPRequestPayload {
  payload: Record<string, any>
  update_context?: boolean
  timeout?: number
}

/**
 * MCP响应负载
 */
export interface MCPResponsePayload {
  response: Record<string, any>
  context_updated: boolean
  message_id: string
  duration_ms?: number
}

/**
 * MCP会话统计信息
 */
export interface MCPSessionStats {
  total_sessions: number
  active_sessions: number
  total_messages: number
  total_contexts: number
  avg_message_duration_ms?: number
  error_rate: number
}

