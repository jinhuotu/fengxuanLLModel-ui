<template>
  <div class="mcp-view">
    <div class="header">
      <h1>MCP (Model Context Protocol)</h1>
      <p class="subtitle">管理模型上下文协议会话和请求</p>
    </div>

    <el-card class="action-card">
      <el-button type="primary" @click="showCreateDialog = true" :icon="Plus">
        创建MCP会话
      </el-button>
      <el-button @click="refreshSessions" :icon="Refresh">刷新列表</el-button>
      <el-button @click="checkHealth" :icon="Connection">健康检查</el-button>
    </el-card>

    <!-- MCP会话列表 -->
    <el-card class="sessions-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>MCP会话列表</span>
          <el-radio-group v-model="filterActive" size="small" @change="refreshSessions">
            <el-radio-button :label="null">全部</el-radio-button>
            <el-radio-button :label="true">活跃</el-radio-button>
            <el-radio-button :label="false">非活跃</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <el-table :data="sessions" style="width: 100%">
        <el-table-column prop="session_id" label="会话ID" width="200">
          <template #default="scope">
            <el-text truncated>{{ scope.row.session_id }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="mcp_server_url" label="服务器地址" width="300">
          <template #default="scope">
            <el-text truncated>{{ scope.row.mcp_server_url }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="message_count" label="消息数" width="100" align="center" />
        <el-table-column prop="error_count" label="错误数" width="100" align="center" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewSession(scope.row)">查看</el-button>
            <el-button size="small" type="primary" @click="showSendRequestDialog(scope.row)">
              发送请求
            </el-button>
            <el-button size="small" type="danger" @click="deleteSession(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="sessions.length === 0" description="暂无MCP会话" />
    </el-card>

    <!-- 创建MCP会话对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建MCP会话" width="600px">
      <el-form :model="createForm" label-width="140px">
        <el-form-item label="MCP服务器地址" required>
          <el-input 
            v-model="createForm.mcp_server_url" 
            placeholder="例如: ws://localhost:8080/mcp (留空使用默认配置)"
            @blur="validateServerUrl"
          />
          <div v-if="urlError" class="error-text">{{ urlError }}</div>
        </el-form-item>
        <el-form-item label="关联对话ID">
          <el-input-number v-model="createForm.conversation_id" :min="0" placeholder="可选" />
        </el-form-item>
        <el-form-item label="关联模型ID">
          <el-input-number v-model="createForm.model_config_id" :min="0" placeholder="可选" />
        </el-form-item>
        <el-form-item label="初始上下文">
          <el-input
            v-model="initialContextJson"
            type="textarea"
            :rows="4"
            placeholder='JSON格式，例如: {"key": "value"}'
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createSession" :loading="creating">创建</el-button>
      </template>
    </el-dialog>

    <!-- 发送MCP请求对话框 -->
    <el-dialog v-model="showRequestDialog" title="发送MCP请求" width="600px">
      <el-form :model="requestForm" label-width="140px">
        <el-form-item label="请求负载">
          <el-input
            v-model="requestPayloadJson"
            type="textarea"
            :rows="6"
            placeholder='JSON格式，例如: {"query": "Hello, MCP!"}'
          />
        </el-form-item>
        <el-form-item label="更新上下文">
          <el-switch v-model="requestForm.update_context" />
        </el-form-item>
        <el-form-item label="超时时间（秒）">
          <el-input-number v-model="requestForm.timeout" :min="0" :max="300" />
        </el-form-item>
      </el-form>
      
      <!-- 响应显示区域 -->
      <div v-if="responseData" class="response-area">
        <el-divider>响应结果</el-divider>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="消息ID">{{ responseData.message_id }}</el-descriptions-item>
          <el-descriptions-item label="处理时长">{{ responseData.duration_ms }}ms</el-descriptions-item>
          <el-descriptions-item label="上下文已更新" :span="2">
            {{ responseData.context_updated ? '是' : '否' }}
          </el-descriptions-item>
        </el-descriptions>
        <div class="response-content">
          <h4>响应内容：</h4>
          <pre>{{ JSON.stringify(responseData.response, null, 2) }}</pre>
        </div>
      </div>

      <template #footer>
        <el-button @click="showRequestDialog = false">关闭</el-button>
        <el-button type="primary" @click="sendRequest" :loading="sending">发送请求</el-button>
      </template>
    </el-dialog>

    <!-- 会话详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="会话详情" width="800px">
      <el-descriptions v-if="selectedSession" :column="2" border>
        <el-descriptions-item label="会话ID" :span="2">{{ selectedSession.session_id }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(selectedSession.status)">
            {{ getStatusText(selectedSession.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="是否活跃">
          {{ selectedSession.is_active ? '是' : '否' }}
        </el-descriptions-item>
        <el-descriptions-item label="服务器地址" :span="2">
          {{ selectedSession.mcp_server_url }}
        </el-descriptions-item>
        <el-descriptions-item label="消息数">{{ selectedSession.message_count }}</el-descriptions-item>
        <el-descriptions-item label="错误数">{{ selectedSession.error_count }}</el-descriptions-item>
        <el-descriptions-item label="最后心跳">
          {{ selectedSession.last_heartbeat_at ? formatDate(selectedSession.last_heartbeat_at) : '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="连接时间">
          {{ selectedSession.connected_at ? formatDate(selectedSession.connected_at) : '未连接' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(selectedSession.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatDate(selectedSession.updated_at) }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider>会话上下文</el-divider>
      <el-button size="small" @click="loadContexts" :loading="loadingContexts">加载上下文</el-button>
      <el-table v-if="contexts.length > 0" :data="contexts" style="width: 100%; margin-top: 10px">
        <el-table-column prop="context_type" label="类型" width="100" />
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column prop="token_count" label="Token数" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
      
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Connection } from '@element-plus/icons-vue'
import { mcpApi } from '../api'
import type { MCPSession, MCPSessionCreateRequest, MCPContext, MCPRequestPayload } from '../types/mcp'

// 数据状态
const loading = ref(false)
const creating = ref(false)
const sending = ref(false)
const loadingContexts = ref(false)
const sessions = ref<MCPSession[]>([])
const contexts = ref<MCPContext[]>([])
const selectedSession = ref<MCPSession | null>(null)
const responseData = ref<any>(null)
const filterActive = ref<boolean | null>(null)
const urlError = ref<string>('')

// 对话框状态
const showCreateDialog = ref(false)
const showRequestDialog = ref(false)
const showDetailDialog = ref(false)

// 表单数据
const createForm = ref<MCPSessionCreateRequest>({
  mcp_server_url: '',
  conversation_id: undefined,
  model_config_id: undefined,
  initial_context: undefined
})

const requestForm = ref<MCPRequestPayload>({
  payload: {},
  update_context: true,
  timeout: undefined
})

const initialContextJson = ref('')
const requestPayloadJson = ref('')

// 工具函数
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const getStatusType = (status: string) => {
  const types: Record<string, any> = {
    connected: 'success',
    connecting: 'warning',
    disconnected: 'info',
    error: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    connected: '已连接',
    connecting: '连接中',
    disconnected: '已断开',
    error: '错误'
  }
  return texts[status] || status
}

// API调用函数
const refreshSessions = async () => {
  loading.value = true
  try {
    sessions.value = await mcpApi.getSessions(filterActive.value ?? undefined)
  } catch (error: any) {
    ElMessage.error('获取会话列表失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    loading.value = false
  }
}

const validateServerUrl = () => {
  const url = createForm.value.mcp_server_url.trim()
  if (!url) {
    urlError.value = ''
    return true
  }
  
  // 检查URL格式
  if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
    urlError.value = 'MCP服务器地址必须以 ws:// 或 wss:// 开头'
    return false
  }
  
  // 基本格式验证
  const urlPattern = /^(ws|wss):\/\/[a-zA-Z0-9.-]+(:\d+)?(\/.*)?$/
  if (!urlPattern.test(url)) {
    urlError.value = '请输入有效的WebSocket地址，例如: ws://localhost:8080/mcp'
    return false
  }
  
  urlError.value = ''
  return true
}

const createSession = async () => {
  creating.value = true
  try {
    // 验证服务器URL
    if (!validateServerUrl()) {
      ElMessage.error('请修正服务器地址格式')
      creating.value = false
      return
    }
    
    // 解析初始上下文JSON
    let initialContext = undefined
    if (initialContextJson.value.trim()) {
      try {
        initialContext = JSON.parse(initialContextJson.value)
      } catch {
        ElMessage.error('初始上下文JSON格式错误')
        creating.value = false
        return
      }
    }

    const request: MCPSessionCreateRequest = {
      mcp_server_url: createForm.value.mcp_server_url.trim() || undefined,
      conversation_id: createForm.value.conversation_id,
      model_config_id: createForm.value.model_config_id,
      initial_context: initialContext
    }

    await mcpApi.createSession(request)
    ElMessage.success('MCP会话创建成功')
    showCreateDialog.value = false
    
    // 重置表单
    createForm.value = {
      mcp_server_url: '',
      conversation_id: undefined,
      model_config_id: undefined
    }
    initialContextJson.value = ''
    urlError.value = ''
    
    await refreshSessions()
  } catch (error: any) {
    ElMessage.error('创建会话失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    creating.value = false
  }
}

const showSendRequestDialog = (session: MCPSession) => {
  selectedSession.value = session
  responseData.value = null
  requestPayloadJson.value = ''
  requestForm.value = {
    payload: {},
    update_context: true,
    timeout: undefined
  }
  showRequestDialog.value = true
}

const sendRequest = async () => {
  if (!selectedSession.value) return
  
  sending.value = true
  try {
    // 解析请求负载JSON
    let payload = {}
    if (requestPayloadJson.value.trim()) {
      try {
        payload = JSON.parse(requestPayloadJson.value)
      } catch {
        ElMessage.error('请求负载JSON格式错误')
        sending.value = false
        return
      }
    }

    const request: MCPRequestPayload = {
      payload,
      update_context: requestForm.value.update_context,
      timeout: requestForm.value.timeout
    }

    const response = await mcpApi.sendRequest(selectedSession.value.session_id, request)
    responseData.value = response
    ElMessage.success('MCP请求发送成功')
    
    // 刷新会话列表以更新消息计数
    await refreshSessions()
  } catch (error: any) {
    ElMessage.error('发送请求失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    sending.value = false
  }
}

const deleteSession = async (session: MCPSession) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除会话 ${session.session_id} 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await mcpApi.deleteSession(session.session_id)
    ElMessage.success('会话删除成功')
    await refreshSessions()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除会话失败: ' + (error.response?.data?.detail || error.message))
    }
  }
}

const viewSession = async (session: MCPSession) => {
  selectedSession.value = session
  contexts.value = []
  showDetailDialog.value = true
}

const loadContexts = async () => {
  if (!selectedSession.value) return
  
  loadingContexts.value = true
  try {
    contexts.value = await mcpApi.getSessionContexts(selectedSession.value.session_id)
  } catch (error: any) {
    ElMessage.error('加载上下文失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    loadingContexts.value = false
  }
}

const checkHealth = async () => {
  try {
    const result = await mcpApi.healthCheck()
    ElMessage.success(`MCP服务健康状态: ${result.status}`)
  } catch (error: any) {
    ElMessage.error('健康检查失败: ' + (error.response?.data?.detail || error.message))
  }
}

// 生命周期
onMounted(() => {
  refreshSessions()
})
</script>

<style scoped>
.mcp-view {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.subtitle {
  margin: 5px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.action-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.response-area {
  margin-top: 20px;
}

.response-content {
  margin-top: 10px;
}

.response-content h4 {
  margin: 10px 0;
}

.response-content pre {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 300px;
}

.error-text {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
}
</style>

