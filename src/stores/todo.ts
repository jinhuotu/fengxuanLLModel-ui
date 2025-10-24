/**
 * 待办事项状态管理
 * 
 * 功能说明：
 * 1. 管理待办事项的状态和数据
 * 2. 提供待办事项的CRUD操作
 * 3. 支持多状态管理和用户隔离
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { todoApi } from '../api'
import type { Todo, TodoStatus, CreateTodoRequest, UpdateTodoRequest, TodoQueryParams, TodoStats } from '../types/todo'

export const useTodoStore = defineStore('todo', () => {
  // 状态定义
  const todos = ref<Todo[]>([])
  const currentTodo = ref<Todo | null>(null)
  const loading = ref(false)
  const stats = ref<TodoStats>({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0
  })

  // 计算属性
  const pendingTodos = computed(() => 
    todos.value.filter(todo => todo.status === 'pending')
  )
  
  const inProgressTodos = computed(() => 
    todos.value.filter(todo => todo.status === 'in_progress')
  )
  
  const completedTodos = computed(() => 
    todos.value.filter(todo => todo.status === 'completed')
  )

  // 按状态获取待办事项
  const getTodosByStatus = (status: TodoStatus) => {
    return todos.value.filter(todo => todo.status === status)
  }

  // 获取待办事项统计信息
  const updateStats = () => {
    stats.value = {
      total: todos.value.length,
      pending: pendingTodos.value.length,
      in_progress: inProgressTodos.value.length,
      completed: completedTodos.value.length
    }
  }

  // 加载待办事项列表
  const loadTodos = async (params: TodoQueryParams = {}) => {
    try {
      loading.value = true
      const response = await todoApi.getTodos(params)
      const items = Array.isArray(response) ? response : (response?.items ?? [])
      todos.value = items as unknown as Todo[]
      updateStats()
    } catch (error: any) {
      console.error('加载待办事项失败:', error)
      ElMessage.error('加载待办事项失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 创建待办事项
  const createTodo = async (request: CreateTodoRequest) => {
    try {
      loading.value = true
      const response = await todoApi.createTodo(request)
      todos.value.unshift(response)
      updateStats()
      ElMessage.success('待办事项创建成功')
      return response
    } catch (error: any) {
      console.error('创建待办事项失败:', error)
      ElMessage.error('创建待办事项失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 更新待办事项
  const updateTodo = async (todoId: number, request: UpdateTodoRequest) => {
    try {
      loading.value = true
      const response = await todoApi.updateTodo(todoId, request)
      const index = todos.value.findIndex(todo => todo.id === todoId)
      if (index !== -1) {
        todos.value[index] = response
      }
      updateStats()
      ElMessage.success('待办事项更新成功')
      return response
    } catch (error: any) {
      console.error('更新待办事项失败:', error)
      ElMessage.error('更新待办事项失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 更新待办事项状态
  const updateTodoStatus = async (todoId: number, status: TodoStatus) => {
    try {
      await updateTodo(todoId, { status })
    } catch (error) {
      throw error
    }
  }

  // 删除待办事项
  const deleteTodo = async (todoId: number) => {
    try {
      loading.value = true
      await todoApi.deleteTodo(todoId)
      const index = todos.value.findIndex(todo => todo.id === todoId)
      if (index !== -1) {
        todos.value.splice(index, 1)
      }
      updateStats()
      ElMessage.success('待办事项删除成功')
    } catch (error: any) {
      console.error('删除待办事项失败:', error)
      ElMessage.error('删除待办事项失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 批量删除待办事项
  const batchDeleteTodos = async (todoIds: number[]) => {
    try {
      loading.value = true
      await todoApi.batchDeleteTodos(todoIds)
      todos.value = todos.value.filter(todo => !todoIds.includes(todo.id))
      updateStats()
      ElMessage.success(`成功删除 ${todoIds.length} 个待办事项`)
    } catch (error: any) {
      console.error('批量删除待办事项失败:', error)
      ElMessage.error('批量删除待办事项失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取待办事项详情
  const getTodo = async (todoId: number) => {
    try {
      loading.value = true
      const response = await todoApi.getTodo(todoId)
      currentTodo.value = response
      return response
    } catch (error: any) {
      console.error('获取待办事项详情失败:', error)
      ElMessage.error('获取待办事项详情失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 加载统计信息
  const loadStats = async () => {
    try {
      const response = await todoApi.getTodoStats()
      stats.value = response
    } catch (error: any) {
      console.error('加载统计信息失败:', error)
    }
  }

  // 清空数据
  const clearTodos = () => {
    todos.value = []
    currentTodo.value = null
    stats.value = {
      total: 0,
      pending: 0,
      in_progress: 0,
      completed: 0
    }
  }

  return {
    // 状态
    todos,
    currentTodo,
    loading,
    stats,
    
    // 计算属性
    pendingTodos,
    inProgressTodos,
    completedTodos,
    
    // 方法
    getTodosByStatus,
    loadTodos,
    createTodo,
    updateTodo,
    updateTodoStatus,
    deleteTodo,
    batchDeleteTodos,
    getTodo,
    loadStats,
    clearTodos
  }
})
