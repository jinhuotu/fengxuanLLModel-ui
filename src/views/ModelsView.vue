<template>
  <div class="models-container">
    <div class="page-header">
      <h2>模型管理</h2>
      <el-button type="primary" @click="showAddDialog" :icon="Plus">
        添加模型
      </el-button>
    </div>

    <!-- 模型列表 -->
    <el-card class="models-card">
      <!-- 空状态提示 -->
      <div v-if="!isLoading && models.length === 0" class="empty-state">
        <el-empty description="暂无模型配置">
          <template #image>
            <el-icon class="empty-icon"><Cpu /></el-icon>
          </template>
          <template #description>
            <p>您还没有配置任何模型</p>
            <p>请点击"添加模型"按钮开始配置</p>
          </template>
          <el-button type="primary" @click="showAddDialog" :icon="Plus">
            添加第一个模型
          </el-button>
        </el-empty>
      </div>
      
      <!-- 模型表格 -->
      <el-table v-else :data="models" v-loading="isLoading" stripe class="models-table">
        <el-table-column prop="name" label="模型名称" min-width="140" />
        <el-table-column prop="provider" label="提供商" min-width="90" />
        <el-table-column prop="model_name" label="模型ID" min-width="150" />
        <el-table-column prop="temperature" label="温度" width="80" />
        <el-table-column prop="max_tokens" label="最大Token" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'">
              {{ row.is_active ? '激活' : '未激活' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="默认" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.is_default" type="warning">默认</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="320" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" @click="testModel(row.id)" :icon="Connection">
                测试
              </el-button>
              <el-button size="small" @click="editModel(row)" :icon="Edit">
                编辑
              </el-button>
              <el-button 
                size="small" 
                type="primary" 
                @click="setDefaultModel(row.id)"
                :disabled="row.is_default"
                :icon="Star"
              >
                设默认
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="deleteModel(row.id)"
                :icon="Delete"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑模型对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEditing ? '编辑模型' : '添加模型'"
      width="600px"
    >
      <el-form :model="modelForm" :rules="modelRules" ref="modelFormRef" label-width="100px">
        <el-form-item label="模型名称" prop="name">
          <el-input v-model="modelForm.name" placeholder="请输入模型名称" />
        </el-form-item>
        
        <el-form-item label="提供商" prop="provider">
          <el-select v-model="modelForm.provider" placeholder="选择提供商" style="width: 100%">
            <el-option label="DeepSeek" value="deepseek" />
            <el-option label="智谱AI" value="zhipu" />
            <el-option label="OpenAI" value="openai" />
            <el-option label="Ollama" value="ollama" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="模型ID" prop="model_name">
          <el-input v-model="modelForm.model_name" placeholder="请输入模型ID" />
        </el-form-item>
        
        <el-form-item label="API Key" prop="api_key">
          <el-input 
            v-model="modelForm.api_key" 
            type="password" 
            placeholder="请输入API Key"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="Base URL" prop="base_url">
          <el-input v-model="modelForm.base_url" placeholder="请输入Base URL" />
        </el-form-item>
        
        <el-form-item label="温度" prop="temperature">
          <el-slider 
            v-model="modelForm.temperature" 
            :min="0" 
            :max="2" 
            :step="0.1" 
            show-input
          />
        </el-form-item>
        
        <el-form-item label="最大Token" prop="max_tokens">
          <el-input-number 
            v-model="modelForm.max_tokens" 
            :min="1" 
            :max="100000"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input 
            v-model="modelForm.description" 
            type="textarea" 
            placeholder="请输入模型描述"
            :rows="3"
          />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="modelForm.is_active">激活模型</el-checkbox>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveModel" :loading="saving">
          {{ isEditing ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 测试结果对话框 -->
    <el-dialog v-model="testDialogVisible" title="模型测试结果" width="500px">
      <div v-if="testResult">
        <el-alert 
          :type="testResult.success ? 'success' : 'error'"
          :title="testResult.success ? '连接成功' : '连接失败'"
          :description="testResult.message"
          show-icon
        />
        <div v-if="testResult.success && testResult.details" class="test-details">
          <h4>测试详情:</h4>
          <pre>{{ JSON.stringify(testResult.details, null, 2) }}</pre>
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
  Delete, 
  Star, 
  Connection,
  Cpu
} from '@element-plus/icons-vue'
import { useModelStore } from '../stores'
import { modelApi } from '../api'
import type { ModelConfig } from '../types'

const modelStore = useModelStore()

// 响应式数据
const isLoading = ref(false)
const dialogVisible = ref(false)
const testDialogVisible = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const testResult = ref<any>(null)
const modelFormRef = ref()

const models = ref<ModelConfig[]>([])

// 表单数据
const modelForm = reactive({
  name: '',
  provider: '',
  model_name: '',
  api_key: '',
  base_url: '',
  temperature: '0.7',
  max_tokens: 4000,
  description: '',
  is_active: true
})

// 表单验证规则
const modelRules = {
  name: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  provider: [{ required: true, message: '请选择提供商', trigger: 'change' }],
  model_name: [{ required: true, message: '请输入模型ID', trigger: 'blur' }],
  api_key: [{ required: true, message: '请输入API Key', trigger: 'blur' }],
  base_url: [{ required: true, message: '请输入Base URL', trigger: 'blur' }],
  temperature: [{ required: true, message: '请设置温度', trigger: 'blur' }],
  max_tokens: [{ required: true, message: '请设置最大Token', trigger: 'blur' }]
}

// 方法
const loadModels = async () => {
  try {
    isLoading.value = true
    const data = await modelApi.getModels()
    models.value = data || []
    modelStore.models = data || []
    
    // 如果返回空列表，显示友好提示而不是错误
  } catch (error) {
    // 只有在真正的网络错误或服务器错误时才显示错误提示
    if (error.response?.status >= 500) {
      ElMessage.error('服务器错误，请稍后重试')
    } else if (error.response?.status >= 400) {
      ElMessage.error('请求失败，请检查网络连接')
    } else {
      ElMessage.error('加载模型列表失败')
    }
    console.error('加载模型失败:', error)
  } finally {
    isLoading.value = false
  }
}

const showAddDialog = () => {
  isEditing.value = false
  resetForm()
  dialogVisible.value = true
}

const editModel = (model: ModelConfig) => {
  isEditing.value = true
  Object.assign(modelForm, model)
  dialogVisible.value = true
}

const resetForm = () => {
  Object.assign(modelForm, {
    name: '',
    provider: '',
    model_name: '',
    api_key: '',
    base_url: '',
    temperature: 0.7,
    max_tokens: 4000,
    description: '',
    is_active: true
  })
}

const saveModel = async () => {
  try {
    await modelFormRef.value.validate()
    saving.value = true
    
    // 准备发送的数据，确保类型正确
    const modelData = {
      ...modelForm,
      temperature: String(modelForm.temperature),
      max_tokens: Number(modelForm.max_tokens)
    }
    
    if (isEditing.value) {
      await modelApi.updateModel(modelForm.id, modelData)
      ElMessage.success('模型更新成功')
    } else {
      await modelApi.createModel(modelData)
      ElMessage.success('模型创建成功')
    }
    
    dialogVisible.value = false
    await loadModels()
  } catch (error) {
    ElMessage.error('保存模型失败')
    console.error('保存模型失败:', error)
  } finally {
    saving.value = false
  }
}

const deleteModel = async (modelId: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个模型吗？', '确认删除', {
      type: 'warning'
    })
    
    await modelApi.deleteModel(modelId)
    ElMessage.success('模型删除成功')
    await loadModels()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除模型失败')
      console.error('删除模型失败:', error)
    }
  }
}

const setDefaultModel = async (modelId: number) => {
  try {
    await modelApi.setDefaultModel(modelId)
    ElMessage.success('默认模型设置成功')
    await loadModels()
  } catch (error) {
    ElMessage.error('设置默认模型失败')
    console.error('设置默认模型失败:', error)
  }
}

const testModel = async (modelId: number) => {
  try {
    const result = await modelApi.testModel(modelId)
    testResult.value = result
    testDialogVisible.value = true
  } catch (error) {
    testResult.value = {
      success: false,
      message: '测试失败: ' + error.message
    }
    testDialogVisible.value = true
  }
}

// 初始化
onMounted(() => {
  loadModels()
})
</script>

<style scoped>
.models-container {
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

.models-card {
  margin-bottom: 20px;
}

.models-table {
  width: 100%;
}

.models-table .el-table__body-wrapper {
  overflow-x: auto;
}

.models-table .el-table__header-wrapper {
  overflow-x: auto;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  min-width: 300px;
}

.action-buttons .el-button {
  flex-shrink: 0;
  white-space: nowrap;
  padding: 6px 12px;
  font-size: 13px;
  min-width: auto;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  color: var(--el-color-primary);
  margin-bottom: 16px;
}

.test-details {
  margin-top: 16px;
  padding: 16px;
  background: var(--el-bg-color-page);
  border-radius: 4px;
}

.test-details h4 {
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
}

.test-details pre {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: pre-wrap;
  word-break: break-all;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .models-card {
    overflow-x: auto;
  }
  
  .action-buttons {
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .action-buttons .el-button {
    font-size: 12px;
    padding: 4px 8px;
  }
}

@media (max-width: 1200px) {
  .action-buttons {
    gap: 6px;
  }
  
  .action-buttons .el-button {
    font-size: 12px;
    padding: 4px 8px;
  }
}

@media (min-width: 1400px) {
  .models-table {
    width: 100%;
  }
  
  .action-buttons {
    gap: 10px;
    min-width: 350px;
  }
  
  .action-buttons .el-button {
    padding: 8px 16px;
    font-size: 14px;
  }
}

@media (min-width: 1600px) {
  .action-buttons {
    gap: 12px;
    min-width: 400px;
  }
  
  .action-buttons .el-button {
    padding: 10px 20px;
    font-size: 15px;
  }
}
</style>
