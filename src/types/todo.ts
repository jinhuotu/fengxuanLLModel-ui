/**
 * 待办事项相关类型定义
 */

// 待办事项状态枚举
export enum TodoStatus {
  PENDING = 'pending',      // 待完成
  IN_PROGRESS = 'in_progress', // 进行中
  COMPLETED = 'completed'    // 已完成
}

// 待办事项状态显示文本映射
export const TodoStatusText = {
  [TodoStatus.PENDING]: '待完成',
  [TodoStatus.IN_PROGRESS]: '进行中',
  [TodoStatus.COMPLETED]: '已完成'
}

// 待办事项状态颜色映射
export const TodoStatusColor = {
  [TodoStatus.PENDING]: '#909399',
  [TodoStatus.IN_PROGRESS]: '#409EFF',
  [TodoStatus.COMPLETED]: '#67C23A'
}

// 待办事项基础接口
export interface Todo {
  id: number
  user_id: number
  title: string
  content?: string
  status: TodoStatus
  create_time: string
  update_time?: string
}

// 创建待办事项请求接口
export interface CreateTodoRequest {
  title: string
  content?: string
  status?: TodoStatus
}

// 更新待办事项请求接口
export interface UpdateTodoRequest {
  title?: string
  content?: string
  status?: TodoStatus
}

// 待办事项查询参数接口
export interface TodoQueryParams {
  status?: TodoStatus
  skip?: number
  limit?: number
}

// 待办事项统计信息接口
export interface TodoStats {
  total: number
  pending: number
  in_progress: number
  completed: number
}

