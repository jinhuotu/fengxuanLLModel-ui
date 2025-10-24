<template>
  <div class="todo-page">
    <!-- 页面加载遮罩 -->
    <div v-if="isPageLoading" class="page-loading-overlay">
      <div class="loading-content">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p class="loading-text">正在加载待办事项...</p>
      </div>
    </div>

    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon class="title-icon"><List /></el-icon>
          待办事项管理
        </h1>
        <p class="page-description">管理您的个人待办事项，提高工作效率</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog" :icon="Plus">
          新建待办
        </el-button>
      </div>
    </div>

    <!-- 统计信息卡片 -->
    <div class="stats-cards">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon total">
              <el-icon><List /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ todoStore.stats.total }}</div>
              <div class="stat-label">总计</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon pending">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ todoStore.stats.pending }}</div>
              <div class="stat-label">待完成</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon in-progress">
              <el-icon><Loading /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ todoStore.stats.in_progress }}</div>
              <div class="stat-label">进行中</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon completed">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ todoStore.stats.completed }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <el-tabs v-model="activeTab" class="todo-tabs">
        <!-- 待完成标签页 -->
        <el-tab-pane label="待完成" name="pending">
          <template #label>
            <span class="tab-label">
              <el-icon><Clock /></el-icon>
              待完成 ({{ todoStore.stats.pending }})
            </span>
          </template>
          <div class="todo-list">
            <div v-if="todoStore.loading" class="loading-skeleton">
              <div v-for="n in 3" :key="n" class="skeleton-item">
                <div class="skeleton-checkbox"></div>
                <div class="skeleton-content">
                  <div class="skeleton-title"></div>
                  <div class="skeleton-text"></div>
                </div>
                <div class="skeleton-actions"></div>
              </div>
            </div>
            <div v-else-if="todoStore.pendingTodos.length === 0" class="empty-state">
              <el-icon class="empty-icon"><Document /></el-icon>
              <p class="empty-text">暂无待完成事项</p>
            </div>
            <div v-else class="todo-items">
              <div 
                v-for="todo in todoStore.pendingTodos" 
                :key="todo.id" 
                class="todo-item pending"
              >
                <div class="todo-content">
                  <div class="todo-title">{{ todo.title }}</div>
                  <div v-if="todo.content" class="todo-description">{{ todo.content }}</div>
                  <div class="todo-meta">
                    <span class="todo-time">{{ formatTime(todo.create_time) }}</span>
                  </div>
                </div>
                <div class="todo-actions">
                  <el-button-group>
                    <el-button 
                      size="small" 
                      @click="updateTodoStatus(todo.id, 'in_progress')"
                      :icon="Loading"
                    >
                      开始
                    </el-button>
                    <el-button 
                      size="small" 
                      type="success"
                      @click="updateTodoStatus(todo.id, 'completed')"
                      :icon="Check"
                    >
                      完成
                    </el-button>
                    <el-button 
                      size="small" 
                      @click="showEditDialog(todo)"
                      :icon="Edit"
                    >
                      编辑
                    </el-button>
                    <el-button 
                      size="small" 
                      type="danger"
                      @click="deleteTodo(todo.id)"
                      :icon="Delete"
                    >
                      删除
                    </el-button>
                  </el-button-group>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 进行中标签页 -->
        <el-tab-pane label="进行中" name="in_progress">
          <template #label>
            <span class="tab-label">
              <el-icon><Loading /></el-icon>
              进行中 ({{ todoStore.stats.in_progress }})
            </span>
          </template>
          <div class="todo-list">
            <div v-if="todoStore.loading" class="loading-skeleton">
              <div v-for="n in 3" :key="n" class="skeleton-item">
                <div class="skeleton-checkbox"></div>
                <div class="skeleton-content">
                  <div class="skeleton-title"></div>
                  <div class="skeleton-text"></div>
                </div>
                <div class="skeleton-actions"></div>
              </div>
            </div>
            <div v-else-if="todoStore.inProgressTodos.length === 0" class="empty-state">
              <el-icon class="empty-icon"><Loading /></el-icon>
              <p class="empty-text">暂无进行中事项</p>
            </div>
            <div v-else class="todo-items">
              <div 
                v-for="todo in todoStore.inProgressTodos" 
                :key="todo.id" 
                class="todo-item in-progress"
              >
                <div class="todo-content">
                  <div class="todo-title">{{ todo.title }}</div>
                  <div v-if="todo.content" class="todo-description">{{ todo.content }}</div>
                  <div class="todo-meta">
                    <span class="todo-time">{{ formatTime(todo.create_time) }}</span>
                  </div>
                </div>
                <div class="todo-actions">
                  <el-button-group>
                    <el-button 
                      size="small" 
                      @click="updateTodoStatus(todo.id, 'pending')"
                      :icon="Clock"
                    >
                      待完成
                    </el-button>
                    <el-button 
                      size="small" 
                      type="success"
                      @click="updateTodoStatus(todo.id, 'completed')"
                      :icon="Check"
                    >
                      完成
                    </el-button>
                    <el-button 
                      size="small" 
                      @click="showEditDialog(todo)"
                      :icon="Edit"
                    >
                      编辑
                    </el-button>
                    <el-button 
                      size="small" 
                      type="danger"
                      @click="deleteTodo(todo.id)"
                      :icon="Delete"
                    >
                      删除
                    </el-button>
                  </el-button-group>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 已完成标签页 -->
        <el-tab-pane label="已完成" name="completed">
          <template #label>
            <span class="tab-label">
              <el-icon><Check /></el-icon>
              已完成 ({{ todoStore.stats.completed }})
            </span>
          </template>
          <div class="todo-list">
            <div v-if="todoStore.loading" class="loading-skeleton">
              <div v-for="n in 3" :key="n" class="skeleton-item">
                <div class="skeleton-checkbox"></div>
                <div class="skeleton-content">
                  <div class="skeleton-title"></div>
                  <div class="skeleton-text"></div>
                </div>
                <div class="skeleton-actions"></div>
              </div>
            </div>
            <div v-else-if="todoStore.completedTodos.length === 0" class="empty-state">
              <el-icon class="empty-icon"><Check /></el-icon>
              <p class="empty-text">暂无已完成事项</p>
            </div>
            <div v-else class="todo-items">
              <div 
                v-for="todo in todoStore.completedTodos" 
                :key="todo.id" 
                class="todo-item completed"
              >
                <div class="todo-content">
                  <div class="todo-title">{{ todo.title }}</div>
                  <div v-if="todo.content" class="todo-description">{{ todo.content }}</div>
                  <div class="todo-meta">
                    <span class="todo-time">{{ formatTime(todo.create_time) }}</span>
                    <span v-if="todo.update_time" class="todo-update-time">
                      完成于 {{ formatTime(todo.update_time) }}
                    </span>
                  </div>
                </div>
                <div class="todo-actions">
                  <el-button-group>
                    <el-button 
                      size="small" 
                      @click="updateTodoStatus(todo.id, 'pending')"
                      :icon="Clock"
                    >
                      待完成
                    </el-button>
                    <el-button 
                      size="small" 
                      @click="updateTodoStatus(todo.id, 'in_progress')"
                      :icon="Loading"
                    >
                      进行中
                    </el-button>
                    <el-button 
                      size="small" 
                      @click="showEditDialog(todo)"
                      :icon="Edit"
                    >
                      编辑
                    </el-button>
                    <el-button 
                      size="small" 
                      type="danger"
                      @click="deleteTodo(todo.id)"
                      :icon="Delete"
                    >
                      删除
                    </el-button>
                  </el-button-group>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 创建/编辑待办事项对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑待办事项' : '新建待办事项'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="todoFormRef"
        :model="todoForm"
        :rules="todoFormRules"
        label-width="80px"
      >
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="todoForm.title"
            placeholder="请输入待办事项标题"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="todoForm.content"
            type="textarea"
            placeholder="请输入待办事项详细内容（可选）"
            :rows="4"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item v-if="isEdit" label="状态" prop="status">
          <el-select v-model="todoForm.status" placeholder="请选择状态">
            <el-option label="待完成" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="todoStore.loading">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { 
  Loading, 
  List, 
  Plus, 
  Clock, 
  Check, 
  Document, 
  Edit, 
  Delete 
} from '@element-plus/icons-vue'
import { useTodoStore } from '../stores/todo'
import type { Todo, TodoStatus, CreateTodoRequest, UpdateTodoRequest } from '../types/todo'

// 状态管理
const todoStore = useTodoStore()

// 页面状态
const isPageLoading = ref(false)
const activeTab = ref('pending')

// 对话框状态
const dialogVisible = ref(false)
const isEdit = ref(false)
const todoFormRef = ref<FormInstance>()

// 表单数据
const todoForm = reactive<CreateTodoRequest & UpdateTodoRequest & { id?: number }>({
  title: '',
  content: '',
  status: 'pending'
})

// 表单验证规则
const todoFormRules: FormRules = {
  title: [
    { required: true, message: '请输入待办事项标题', trigger: 'blur' },
    { min: 1, max: 50, message: '标题长度在 1 到 50 个字符', trigger: 'blur' }
  ]
}

// 格式化时间
const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN')
}

// 显示创建对话框
const showCreateDialog = () => {
  isEdit.value = false
  dialogVisible.value = true
  resetForm()
}

// 显示编辑对话框
const showEditDialog = (todo: Todo) => {
  isEdit.value = true
  dialogVisible.value = true
  todoForm.id = todo.id
  todoForm.title = todo.title
  todoForm.content = todo.content || ''
  todoForm.status = todo.status
}

// 重置表单
const resetForm = () => {
  todoForm.id = undefined
  todoForm.title = ''
  todoForm.content = ''
  todoForm.status = 'pending'
  todoFormRef.value?.clearValidate()
}

// 提交表单
const handleSubmit = async () => {
  if (!todoFormRef.value) return
  
  try {
    await todoFormRef.value.validate()
    
    if (isEdit.value) {
      // 编辑待办事项
      await todoStore.updateTodo(todoForm.id!, {
        title: todoForm.title,
        content: todoForm.content,
        status: todoForm.status
      })
    } else {
      // 创建待办事项
      await todoStore.createTodo({
        title: todoForm.title,
        content: todoForm.content,
        status: todoForm.status
      })
    }
    
    dialogVisible.value = false
    resetForm()
  } catch (error) {
    console.error('提交失败:', error)
  }
}

// 更新待办事项状态
const updateTodoStatus = async (todoId: number, status: TodoStatus) => {
  try {
    await todoStore.updateTodoStatus(todoId, status)
  } catch (error) {
    console.error('更新状态失败:', error)
  }
}

// 删除待办事项
const deleteTodo = async (todoId: number) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个待办事项吗？',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await todoStore.deleteTodo(todoId)
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

// 页面初始化
onMounted(async () => {
  try {
    isPageLoading.value = true
    await todoStore.loadTodos()
  } catch (error) {
    console.error('页面初始化失败:', error)
  } finally {
    isPageLoading.value = false
  }
})
</script>

<style scoped>
.todo-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  overflow: hidden;
  position: relative;
  padding: 15px;
  box-sizing: border-box;
}

/* 页面加载遮罩 */
.page-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
}

.loading-icon {
  font-size: 32px;
  color: #409EFF;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 16px;
  font-size: 16px;
  color: #666;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 页面头部 */
.page-header {
  background: white;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  color: #409EFF;
}

.page-description {
  margin: 4px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 统计信息卡片 */
.stats-cards {
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.stat-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.pending {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.in-progress {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

/* 主要内容区域 */
.main-content {
  flex: 1;
  padding: 16px 20px;
  overflow: hidden;
  min-height: 0;
}

.todo-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.todo-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

.todo-tabs :deep(.el-tab-pane) {
  height: 100%;
  overflow: hidden;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 待办事项列表 */
.todo-list {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

/* 加载骨架屏 */
.loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: white;
}

.skeleton-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #e4e7ed;
  border-radius: 4px;
  background: #f5f5f5;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-title {
  height: 20px;
  background: #e4e7ed;
  border-radius: 4px;
  width: 60%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

.skeleton-text {
  height: 16px;
  background: #e4e7ed;
  border-radius: 4px;
  width: 40%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

.skeleton-actions {
  width: 200px;
  height: 32px;
  background: #e4e7ed;
  border-radius: 4px;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #909399;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  margin: 0;
}

/* 待办事项项 */
.todo-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s;
}

.todo-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.todo-item.pending {
  border-left: 4px solid #f56c6c;
}

.todo-item.in-progress {
  border-left: 4px solid #409EFF;
}

.todo-item.completed {
  border-left: 4px solid #67C23A;
  background: #f0f9ff;
}

.todo-item.completed .todo-title {
  text-decoration: line-through;
  color: #909399;
}

.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  line-height: 1.4;
}

.todo-description {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 12px;
  white-space: pre-wrap;
}

.todo-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.todo-time {
  font-size: 12px;
  color: #909399;
}

.todo-update-time {
  font-size: 12px;
  color: #67C23A;
  font-weight: 500;
}

.todo-actions {
  flex-shrink: 0;
}

/* 对话框样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .stats-cards {
    padding: 16px;
  }
  
  .main-content {
    padding: 16px;
  }
  
  .todo-item {
    flex-direction: column;
    gap: 12px;
  }
  
  .todo-actions {
    width: 100%;
  }
  
  .todo-actions .el-button-group {
    width: 100%;
    display: flex;
  }
  
  .todo-actions .el-button {
    flex: 1;
  }
}
</style>
