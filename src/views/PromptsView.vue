<template>
  <div class="prompts-container">
    <div class="page-header">
      <h2>提示词管理</h2>
      <el-button type="primary" @click="showAddDialog" :icon="Plus">
        添加提示词
      </el-button>
    </div>

    <!-- 提示词列表 -->
    <el-card class="prompts-card">
      <el-table :data="prompts" v-loading="isLoading" stripe>
        <el-table-column prop="name" label="名称" width="200" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column label="内容预览" min-width="300">
          <template #default="{ row }">
            <div class="content-preview">
              {{ row.content.substring(0, 100) }}{{ row.content.length > 100 ? '...' : '' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'">
              {{ row.is_active ? '激活' : '未激活' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" @click="editPrompt(row)" :icon="Edit">
                编辑
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="deletePrompt(row.id)"
                :icon="Delete"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑提示词对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEditing ? '编辑提示词' : '添加提示词'"
      width="800px"
    >
      <el-form :model="promptForm" :rules="promptRules" ref="promptFormRef" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="promptForm.name" placeholder="请输入提示词名称" />
        </el-form-item>
        
        <el-form-item label="分类" prop="category">
          <el-select v-model="promptForm.category" placeholder="选择分类" style="width: 100%">
            <el-option label="通用" value="general" />
            <el-option label="编程" value="programming" />
            <el-option label="写作" value="writing" />
            <el-option label="翻译" value="translation" />
            <el-option label="分析" value="analysis" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input 
            v-model="promptForm.description" 
            type="textarea" 
            placeholder="请输入提示词描述"
            :rows="2"
          />
        </el-form-item>
        
        <el-form-item label="内容" prop="content">
          <el-input 
            v-model="promptForm.content" 
            type="textarea" 
            placeholder="请输入提示词内容"
            :rows="10"
            show-word-limit
            maxlength="5000"
          />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="promptForm.is_active">激活提示词</el-checkbox>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePrompt" :loading="saving">
          {{ isEditing ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewDialogVisible" title="提示词预览" width="600px">
      <div v-if="previewPrompt">
        <h3>{{ previewPrompt.name }}</h3>
        <p v-if="previewPrompt.description" class="preview-description">
          {{ previewPrompt.description }}
        </p>
        <div class="preview-content">
          <pre>{{ previewPrompt.content }}</pre>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, 
  Edit, 
  Delete 
} from '@element-plus/icons-vue'
import { usePromptStore } from '../stores'
import { promptApi } from '../api'
import type { PromptTemplate } from '../types'

const promptStore = usePromptStore()

// 响应式数据
const isLoading = ref(false)
const dialogVisible = ref(false)
const previewDialogVisible = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const promptFormRef = ref()

const prompts = ref<PromptTemplate[]>([])
const previewPrompt = ref<PromptTemplate | null>(null)

// 表单数据
const promptForm = reactive({
  name: '',
  category: '',
  description: '',
  content: '',
  is_active: true
})

// 表单验证规则
const promptRules = {
  name: [{ required: true, message: '请输入提示词名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入提示词内容', trigger: 'blur' }]
}

// 方法
const loadPrompts = async () => {
  try {
    isLoading.value = true
    const data = await promptApi.getPrompts()
    prompts.value = data || []
    promptStore.prompts = data || []
    
    // 如果返回空列表，显示友好提示而不是错误
  } catch (error) {
    // 只有在真正的网络错误或服务器错误时才显示错误提示
    if (error.response?.status >= 500) {
      ElMessage.error('服务器错误，请稍后重试')
    } else if (error.response?.status >= 400) {
      ElMessage.error('请求失败，请检查网络连接')
    } else {
      ElMessage.error('加载提示词列表失败')
    }
    console.error('加载提示词失败:', error)
  } finally {
    isLoading.value = false
  }
}

const showAddDialog = () => {
  isEditing.value = false
  resetForm()
  dialogVisible.value = true
}

const editPrompt = (prompt: PromptTemplate) => {
  isEditing.value = true
  Object.assign(promptForm, prompt)
  dialogVisible.value = true
}

const resetForm = () => {
  Object.assign(promptForm, {
    name: '',
    category: '',
    description: '',
    content: '',
    is_active: true
  })
}

const savePrompt = async () => {
  try {
    await promptFormRef.value.validate()
    saving.value = true
    
    if (isEditing.value) {
      await promptApi.updatePrompt(promptForm.id, promptForm)
      ElMessage.success('提示词更新成功')
    } else {
      await promptApi.createPrompt(promptForm)
      ElMessage.success('提示词创建成功')
    }
    
    dialogVisible.value = false
    await loadPrompts()
  } catch (error) {
    ElMessage.error('保存提示词失败')
    console.error('保存提示词失败:', error)
  } finally {
    saving.value = false
  }
}

const deletePrompt = async (promptId: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个提示词吗？', '确认删除', {
      type: 'warning'
    })
    
    await promptApi.deletePrompt(promptId)
    ElMessage.success('提示词删除成功')
    await loadPrompts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除提示词失败')
      console.error('删除提示词失败:', error)
    }
  }
}

const previewPromptContent = (prompt: PromptTemplate) => {
  previewPrompt.value = prompt
  previewDialogVisible.value = true
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN')
}

// 初始化
onMounted(() => {
  loadPrompts()
})
</script>

<style scoped>
.prompts-container {
  padding: 15px;
  box-sizing: border-box;
  height: 100%;
  overflow: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: var(--el-text-color-primary);
}

.prompts-card {
  margin-bottom: 20px;
}

.content-preview {
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  max-height: 60px;
  overflow: hidden;
}

.preview-description {
  color: var(--el-text-color-secondary);
  margin-bottom: 16px;
  font-style: italic;
}

.preview-content {
  background: var(--el-bg-color-page);
  padding: 16px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color);
}

.preview-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
  color: var(--el-text-color-primary);
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  align-items: center;
}

.action-buttons .el-button {
  flex-shrink: 0;
  white-space: nowrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .prompts-card {
    overflow-x: auto;
  }
}
</style>
