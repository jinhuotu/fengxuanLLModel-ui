<template>
  <div class="knowledge-container">
    <div class="page-header">
      <h2>知识库管理</h2>
      <el-button type="primary" @click="showAddDialog" :icon="Plus">
        创建知识库
      </el-button>
    </div>

    <!-- 知识库列表 -->
    <el-card class="knowledge-card">
      <el-table :data="knowledgeBases" v-loading="isLoading" stripe>
        <el-table-column prop="name" label="知识库名称" width="180" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column prop="document_count" label="文档数量" width="90" align="center" />
        <el-table-column prop="total_chunks" label="分块数量" width="90" align="center" />
        <el-table-column prop="embedding_model" label="嵌入模型" width="140" show-overflow-tooltip />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? '激活' : '未激活' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button 
                size="small" 
                @click="viewDocuments(row)" 
                :icon="DocumentIcon"
                class="action-btn"
              >
                文档
              </el-button>
              <el-button 
                size="small" 
                @click="editKnowledgeBase(row)" 
                :icon="Edit"
                class="action-btn"
              >
                编辑
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="deleteKnowledgeBase(row.id)"
                :icon="Delete"
                class="action-btn"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建/编辑知识库对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEditing ? '编辑知识库' : '创建知识库'"
      width="600px"
    >
      <el-form :model="knowledgeForm" :rules="knowledgeRules" ref="knowledgeFormRef" label-width="120px">
        <el-form-item label="知识库名称" prop="name">
          <el-input v-model="knowledgeForm.name" placeholder="请输入知识库名称" />
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input 
            v-model="knowledgeForm.description" 
            type="textarea" 
            placeholder="请输入知识库描述"
            :rows="3"
          />
        </el-form-item>
        
        <el-form-item label="嵌入模型" prop="embedding_model">
          <el-select v-model="knowledgeForm.embedding_model" placeholder="选择嵌入模型" style="width: 100%">
            <el-option 
              v-for="model in modelStore.models" 
              :key="model.id" 
              :label="`${model.name} (${model.model_name})`" 
              :value="model.model_name" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="分块大小" prop="chunk_size">
          <el-input-number 
            v-model="knowledgeForm.chunk_size" 
            :min="100" 
            :max="2000"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="分块重叠" prop="chunk_overlap">
          <el-input-number 
            v-model="knowledgeForm.chunk_overlap" 
            :min="0" 
            :max="200"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="knowledgeForm.is_active">激活知识库</el-checkbox>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveKnowledgeBase" :loading="saving">
          {{ isEditing ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 文档管理对话框 -->
    <el-dialog v-model="documentsDialogVisible" title="文档管理" width="800px">
      <div v-if="currentKnowledgeBase">
        <div class="documents-header">
          <h3>{{ currentKnowledgeBase.name }} - 文档列表</h3>
          <el-upload
            :action="uploadUrl"
            :headers="uploadHeaders"
            :data="uploadData"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            :show-file-list="false"
            accept=".txt,.md,.pdf,.doc,.docx"
          >
            <el-button type="primary" :icon="Upload">上传文档</el-button>
          </el-upload>
        </div>
        
        <el-table :data="documents" v-loading="documentsLoading" stripe>
          <el-table-column prop="original_filename" label="文件名" width="180" show-overflow-tooltip />
          <el-table-column prop="file_size" label="文件大小" width="90" align="center">
            <template #default="{ row }">
              {{ formatFileSize(row.file_size) }}
            </template>
          </el-table-column>
          <el-table-column prop="file_type" label="文件类型" width="100" align="center" />
          <el-table-column prop="processing_status" label="处理状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.processing_status)" size="small">
                {{ getStatusText(row.processing_status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="chunk_count" label="分块数量" width="90" align="center" />
          <el-table-column prop="created_at" label="上传时间" width="160">
            <template #default="{ row }">
              {{ formatTime(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="deleteDocument(row.id)"
                  :icon="Delete"
                  class="action-btn"
                >
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, 
  Edit, 
  Delete, 
  Document as DocumentIcon, 
  Upload 
} from '@element-plus/icons-vue'
import { useKnowledgeStore, useModelStore } from '../stores'
import { knowledgeApi } from '../api'
import type { KnowledgeBase, Document } from '../types'

const knowledgeStore = useKnowledgeStore()
const modelStore = useModelStore()

// 响应式数据
const isLoading = ref(false)
const documentsLoading = ref(false)
const dialogVisible = ref(false)
const documentsDialogVisible = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const knowledgeFormRef = ref()

const knowledgeBases = ref<KnowledgeBase[]>([])
const documents = ref<Document[]>([])
const currentKnowledgeBase = ref<KnowledgeBase | null>(null)

// 表单数据
const knowledgeForm = reactive({
  name: '',
  description: '',
  embedding_model: '',
  chunk_size: 1000,
  chunk_overlap: 200,
  is_active: true
})

// 表单验证规则
const knowledgeRules = {
  name: [{ required: true, message: '请输入知识库名称', trigger: 'blur' }],
  embedding_model: [{ required: true, message: '请选择嵌入模型', trigger: 'change' }],
  chunk_size: [{ required: true, message: '请设置分块大小', trigger: 'blur' }],
  chunk_overlap: [{ required: true, message: '请设置分块重叠', trigger: 'blur' }]
}

// 上传相关
const uploadUrl = computed(() => 
  `/api/v1/knowledge-bases/${currentKnowledgeBase.value?.id}/documents`
)

const uploadHeaders = computed(() => {
  const token = localStorage.getItem('access_token')
  return {
    'Authorization': token ? `Bearer ${token}` : ''
  }
})

const uploadData = computed(() => ({
  knowledge_base_id: currentKnowledgeBase.value?.id
}))

// 方法
const loadKnowledgeBases = async () => {
  try {
    isLoading.value = true
    const data = await knowledgeApi.getKnowledgeBases()
    knowledgeBases.value = data || []
    knowledgeStore.knowledgeBases = data || []
    
    // 如果返回空列表，显示友好提示而不是错误
  } catch (error) {
    // 只有在真正的网络错误或服务器错误时才显示错误提示
    if (error.response?.status >= 500) {
      ElMessage.error('服务器错误，请稍后重试')
    } else if (error.response?.status >= 400) {
      ElMessage.error('请求失败，请检查网络连接')
    } else {
      ElMessage.error('加载知识库列表失败')
    }
    console.error('加载知识库失败:', error)
  } finally {
    isLoading.value = false
  }
}

const showAddDialog = () => {
  isEditing.value = false
  resetForm()
  dialogVisible.value = true
}

const editKnowledgeBase = (knowledgeBase: KnowledgeBase) => {
  isEditing.value = true
  Object.assign(knowledgeForm, knowledgeBase)
  dialogVisible.value = true
}

const resetForm = () => {
  Object.assign(knowledgeForm, {
    name: '',
    description: '',
    embedding_model: modelStore.models.length > 0 ? modelStore.models[0].model_name : '',
    chunk_size: 1000,
    chunk_overlap: 200,
    is_active: true
  })
}

const saveKnowledgeBase = async () => {
  try {
    await knowledgeFormRef.value.validate()
    saving.value = true
    
    if (isEditing.value) {
      await knowledgeApi.updateKnowledgeBase(knowledgeForm.id, knowledgeForm)
      ElMessage.success('知识库更新成功')
    } else {
      await knowledgeApi.createKnowledgeBase(knowledgeForm)
      ElMessage.success('知识库创建成功')
    }
    
    dialogVisible.value = false
    await loadKnowledgeBases()
  } catch (error) {
    ElMessage.error('保存知识库失败')
    console.error('保存知识库失败:', error)
  } finally {
    saving.value = false
  }
}

const deleteKnowledgeBase = async (knowledgeBaseId: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个知识库吗？删除后将无法恢复！', '确认删除', {
      type: 'warning'
    })
    
    await knowledgeApi.deleteKnowledgeBase(knowledgeBaseId)
    ElMessage.success('知识库删除成功')
    await loadKnowledgeBases()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除知识库失败')
      console.error('删除知识库失败:', error)
    }
  }
}

const viewDocuments = async (knowledgeBase: KnowledgeBase) => {
  currentKnowledgeBase.value = knowledgeBase
  documentsDialogVisible.value = true
  await loadDocuments()
}

const loadDocuments = async () => {
  if (!currentKnowledgeBase.value) return
  
  try {
    documentsLoading.value = true
    const data = await knowledgeApi.getKnowledgeBaseDocuments(currentKnowledgeBase.value.id)
    documents.value = data || []
    
    // 如果返回空列表，显示友好提示而不是错误
  } catch (error) {
    // 只有在真正的网络错误或服务器错误时才显示错误提示
    if (error.response?.status >= 500) {
      ElMessage.error('服务器错误，请稍后重试')
    } else if (error.response?.status >= 400) {
      ElMessage.error('请求失败，请检查网络连接')
    } else {
      ElMessage.error('加载文档列表失败')
    }
    console.error('加载文档失败:', error)
  } finally {
    documentsLoading.value = false
  }
}

const deleteDocument = async (documentId: number) => {
  if (!currentKnowledgeBase.value) return
  
  try {
    await ElMessageBox.confirm('确定要删除这个文档吗？', '确认删除', {
      type: 'warning'
    })
    
    await knowledgeApi.deleteDocument(currentKnowledgeBase.value.id, documentId)
    ElMessage.success('文档删除成功')
    await loadDocuments()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除文档失败')
      console.error('删除文档失败:', error)
    }
  }
}

const beforeUpload = (file: File) => {
  const allowedTypes = [
    'text/plain',
    'text/markdown',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  
  // 获取文件扩展名
  const fileName = file.name.toLowerCase()
  const allowedExtensions = ['.txt', '.md', '.markdown', '.pdf', '.doc', '.docx']
  const fileExtension = fileName.substring(fileName.lastIndexOf('.'))
  
  // 检查MIME类型或文件扩展名
  const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)
  
  if (!isValidType) {
    ElMessage.error(`不支持的文件类型！支持的类型：${allowedExtensions.join(', ')}`)
    return false
  }
  
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过10MB！')
    return false
  }
  
  return true
}

const handleUploadSuccess = (response: any) => {
  ElMessage.success('文档上传成功')
  loadDocuments()
}

const handleUploadError = (error: any) => {
  ElMessage.error('文档上传失败')
  console.error('上传失败:', error)
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN')
}

const formatFileSize = (size: number) => {
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / (1024 * 1024)).toFixed(1) + ' MB'
}

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    'pending': 'info',
    'processing': 'warning',
    'completed': 'success',
    'failed': 'danger'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'pending': '等待处理',
    'processing': '处理中',
    'completed': '已完成',
    'failed': '处理失败'
  }
  return statusMap[status] || '未知'
}

// 初始化
onMounted(async () => {
  await loadKnowledgeBases()
  await modelStore.loadModels()
})
</script>

<style scoped>
.knowledge-container {
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

.knowledge-card {
  margin-bottom: 20px;
}

.documents-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.documents-header h3 {
  margin: 0;
  color: var(--el-text-color-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .knowledge-card {
    overflow-x: auto;
  }
}

.documents-header {
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.action-btn {
  margin: 0;
  min-width: 60px;
  height: 28px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-btn:active {
  transform: translateY(0);
}

/* 响应式操作按钮 */
@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }
  
  .action-btn {
    width: 100%;
    min-width: auto;
  }
}
</style>
