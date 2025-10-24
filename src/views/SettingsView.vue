<template>
  <div class="settings-layout">
    <!-- 左侧导航栏 -->
    <div class="settings-sidebar">
      <div class="sidebar-header">
        <div class="header-title">
          <el-icon class="header-icon"><Setting /></el-icon>
          <span class="header-text">设置</span>
        </div>
      </div>
      
      <div class="sidebar-content">
        <!-- 基础设置分组 -->
        <div class="nav-group">
          <div class="group-title">基础设置</div>
          <div 
            v-for="item in basicSettings" 
            :key="item.key"
            class="nav-item"
            :class="{ active: activeTab === item.key }"
            @click="activeTab = item.key"
          >
            <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
            <span class="nav-text">{{ item.label }}</span>
          </div>
        </div>

        <!-- 高级设置分组 -->
        <div class="nav-group">
          <div class="group-title">高级设置</div>
          <div 
            v-for="item in advancedSettings" 
            :key="item.key"
            class="nav-item"
            :class="{ active: activeTab === item.key }"
            @click="activeTab = item.key"
          >
            <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
            <span class="nav-text">{{ item.label }}</span>
          </div>
        </div>

        <!-- 数据管理分组 -->
        <div class="nav-group">
          <div class="group-title">数据管理</div>
          <div 
            v-for="item in dataSettings" 
            :key="item.key"
            class="nav-item"
            :class="{ active: activeTab === item.key }"
            @click="activeTab = item.key"
          >
            <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
            <span class="nav-text">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧内容区域 -->
    <div class="settings-content">
      <div class="content-header">
        <h2 class="content-title">{{ getCurrentTabTitle() }}</h2>
      </div>
      
      <div class="content-body">

        <!-- 默认模型设置 -->
        <div v-if="activeTab === 'default-model'" class="settings-section">
          <div class="section-card">
            <div class="card-header">
              <h3>默认模型配置</h3>
            </div>
            <div class="card-content">
              <el-form :model="defaultModelSettings" label-width="120px">
                <el-form-item label="默认模型">
                  <el-select v-model="defaultModelSettings.modelId" style="width: 100%">
                    <el-option 
                      v-for="model in modelStore.activeModels" 
                      :key="model.id" 
                      :label="`${model.name} (${model.model_name})`" 
                      :value="model.id" 
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="标题生成模型">
                  <el-select v-model="defaultModelSettings.titleGenerationModelId" style="width: 100%">
                    <el-option 
                      v-for="model in modelStore.activeModels" 
                      :key="model.id" 
                      :label="`${model.name} (${model.model_name})`" 
                      :value="model.id" 
                    />
                  </el-select>
                  <span class="form-tip">用于自动生成对话标题的模型</span>
                </el-form-item>
                <el-form-item label="温度设置">
                  <el-slider v-model="defaultModelSettings.temperature" :min="0" :max="2" :step="0.1" />
                  <span class="form-tip">控制回复的随机性，0表示完全确定，2表示非常随机</span>
                </el-form-item>
                <el-form-item label="最大令牌数">
                  <el-input-number v-model="defaultModelSettings.maxTokens" :min="100" :max="4000" />
                  <span class="form-tip">限制回复的最大长度</span>
                </el-form-item>
                <el-form-item label="Top P">
                  <el-slider v-model="defaultModelSettings.topP" :min="0" :max="1" :step="0.1" />
                  <span class="form-tip">控制回复的多样性</span>
                </el-form-item>
                <el-form-item label="频率惩罚">
                  <el-slider v-model="defaultModelSettings.frequencyPenalty" :min="-2" :max="2" :step="0.1" />
                  <span class="form-tip">减少重复内容的生成</span>
                </el-form-item>
                <el-form-item label="存在惩罚">
                  <el-slider v-model="defaultModelSettings.presencePenalty" :min="-2" :max="2" :step="0.1" />
                  <span class="form-tip">鼓励模型谈论新话题</span>
                </el-form-item>
                <el-form-item label="思维链功能">
                  <el-switch v-model="defaultModelSettings.enableChainOfThought" />
                  <span class="form-tip">启用后AI会展示思考过程，提供更详细的推理步骤</span>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="saveDefaultModelSettings">保存设置</el-button>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </div>

        <!-- 常规设置 -->
        <div v-if="activeTab === 'general'" class="settings-section">
          <div class="section-card">
            <div class="card-header">
              <h3>常规设置</h3>
            </div>
            <div class="card-content">
              <el-form :model="generalSettings" label-width="120px">
                <el-form-item label="语言">
                  <el-select v-model="generalSettings.language" style="width: 100%">
                    <el-option label="简体中文" value="zh-CN" />
                    <el-option label="English" value="en-US" />
                  </el-select>
                </el-form-item>
                <el-form-item label="时区">
                  <el-select v-model="generalSettings.timezone" style="width: 100%">
                    <el-option label="北京时间 (UTC+8)" value="Asia/Shanghai" />
                    <el-option label="UTC" value="UTC" />
                  </el-select>
                </el-form-item>
                <el-form-item label="自动保存">
                  <el-switch v-model="generalSettings.autoSave" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="saveGeneralSettings">保存设置</el-button>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </div>


        <!-- 数据设置 -->
        <div v-if="activeTab === 'data'" class="settings-section">
          <!-- 数据备份与恢复 -->
          <div class="section-card">
            <div class="card-header">
              <h3>数据备份与恢复</h3>
              <div class="card-actions">
                <el-button @click="backupData">备份</el-button>
                <el-button @click="restoreData">恢复</el-button>
              </div>
            </div>
            <div class="card-content">
              <div class="backup-option">
                <el-switch v-model="backupSettings.compactBackup" />
                <div class="option-content">
                  <div class="option-title">精简备份</div>
                  <div class="option-description">
                    备份时跳过备份图片、知识库等数据文件，仅备份聊天记录和设置。减少空间占用，加快备份速度。
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 数据目录 -->
          <div class="section-card">
            <div class="card-header">
              <h3>数据目录</h3>
            </div>
            <div class="card-content">
              <div class="directory-item">
                <div class="directory-info">
                  <div class="directory-label">应用数据</div>
                  <div class="directory-path">{{ dataDirectories.appData || '加载中...' }}</div>
                </div>
                <el-button size="small" @click="openDirectory(dataDirectories.appData)">打开目录</el-button>
              </div>
              <div class="directory-item">
                <div class="directory-info">
                  <div class="directory-label">应用日志</div>
                  <div class="directory-path">{{ dataDirectories.logs || '加载中...' }}</div>
                </div>
                <el-button size="small" @click="openDirectory(dataDirectories.logs)">打开日志</el-button>
              </div>
              <div class="directory-item">
                <div class="directory-info">
                  <div class="directory-label">知识库文件</div>
                  <div class="directory-path">{{ dataDirectories.uploads || '加载中...' }}</div>
                </div>
                <el-button size="small" type="danger" @click="deleteKnowledgeFiles">删除文件</el-button>
              </div>
              <div class="directory-item">
                <div class="directory-info">
                  <div class="directory-label">向量数据库</div>
                  <div class="directory-path">{{ dataDirectories.chroma_db || '加载中...' }}</div>
                </div>
                <el-button size="small" type="danger" @click="deleteKnowledgeFiles">删除向量库</el-button>
              </div>
              <div class="directory-item">
                <div class="directory-info">
                  <div class="directory-label">清除缓存</div>
                  <div class="directory-path">清除缓存文件</div>
                </div>
                <el-button size="small" @click="clearCache">清除缓存</el-button>
              </div>
            </div>
          </div>

          <!-- 重置数据 -->
          <div class="section-card">
            <div class="card-header">
              <h3>重置数据</h3>
            </div>
            <div class="card-content">
              <div class="reset-warning">
                <el-icon class="warning-icon"><Warning /></el-icon>
                <div class="warning-content">
                  <div class="warning-title">危险操作</div>
                  <div class="warning-text">重置数据将删除所有聊天记录、设置和知识库数据，此操作不可恢复。</div>
                </div>
              </div>
              <div class="reset-actions">
                <el-button type="danger" @click="resetAllData">重置数据</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- MCP设置 -->
        <div v-if="activeTab === 'mcp'" class="settings-section">
          <div class="section-card">
            <div class="card-header">
              <h3>MCP 服务器配置</h3>
              <div class="card-actions">
                <el-button @click="refreshMCPStatus" :loading="refreshingMCPStatus">
                  刷新状态
                </el-button>
                <el-button type="primary" @click="testMCPConnection" :loading="testingMCP">
                  测试连接
                </el-button>
              </div>
            </div>
            <div class="card-content">
              <el-form :model="mcpSettings" label-width="140px">
                <el-form-item label="MCP服务器地址">
                  <el-input 
                    v-model="mcpSettings.serverUrl" 
                    placeholder="ws://localhost:8080/mcp"
                    style="width: 100%"
                  />
                  <span class="form-tip">WebSocket 连接地址，用于与 MCP 服务器通信</span>
                </el-form-item>
                
                <el-form-item label="连接超时时间">
                  <el-input-number 
                    v-model="mcpSettings.connectionTimeout" 
                    :min="5" 
                    :max="300" 
                    style="width: 200px"
                  />
                  <span class="form-tip">连接超时时间（秒）</span>
                </el-form-item>
                
                <el-form-item label="心跳间隔">
                  <el-input-number 
                    v-model="mcpSettings.heartbeatInterval" 
                    :min="10" 
                    :max="300" 
                    style="width: 200px"
                  />
                  <span class="form-tip">心跳间隔时间（秒）</span>
                </el-form-item>
                
                <el-form-item label="最大重试次数">
                  <el-input-number 
                    v-model="mcpSettings.maxRetries" 
                    :min="1" 
                    :max="10" 
                    style="width: 200px"
                  />
                  <span class="form-tip">连接失败时的最大重试次数</span>
                </el-form-item>
                
                <el-form-item label="请求超时时间">
                  <el-input-number 
                    v-model="mcpSettings.requestTimeout" 
                    :min="10" 
                    :max="600" 
                    style="width: 200px"
                  />
                  <span class="form-tip">MCP 请求超时时间（秒）</span>
                </el-form-item>
                
                <el-form-item label="启用SSL">
                  <el-switch v-model="mcpSettings.enableSSL" />
                  <span class="form-tip">是否启用 SSL 加密连接</span>
                </el-form-item>
              </el-form>
            </div>
          </div>

          <!-- MCP 服务器列表 -->
          <div class="section-card">
            <div class="card-header">
              <h3>预配置的 MCP 服务器</h3>
              <div class="card-actions">
                <el-button type="primary" @click="showAddServerDialog">
                  添加服务器
                </el-button>
              </div>
            </div>
            <div class="card-content">
              <el-table :data="mcpServers" style="width: 100%">
                <el-table-column prop="name" label="服务器名称" width="200" />
                <el-table-column prop="url" label="服务器地址" min-width="300" />
                <el-table-column prop="description" label="描述" min-width="200" />
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                      {{ row.status === 'active' ? '活跃' : '未激活' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="200">
                  <template #default="{ row }">
                    <el-button size="small" @click="editServer(row)">编辑</el-button>
                    <el-button size="small" type="success" @click="connectToServer(row)">连接</el-button>
                    <el-button size="small" type="danger" @click="deleteServer(row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>

          <!-- MCP 连接状态 -->
          <div class="section-card">
            <div class="card-header">
              <h3>连接状态</h3>
            </div>
            <div class="card-content">
              <div class="mcp-status">
                <div class="status-item">
                  <span class="status-label">连接状态:</span>
                  <el-tag :type="mcpStatus.connected ? 'success' : 'danger'">
                    {{ mcpStatus.connected ? '已连接' : '未连接' }}
                  </el-tag>
                </div>
                <div class="status-item">
                  <span class="status-label">当前服务器:</span>
                  <span>{{ mcpStatus.currentServer || '无' }}</span>
                </div>
                <div class="status-item">
                  <span class="status-label">会话数量:</span>
                  <span>{{ mcpStatus.sessionCount }}</span>
                </div>
                <div class="status-item">
                  <span class="status-label">最后连接时间:</span>
                  <span>{{ mcpStatus.lastConnected || '从未连接' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- API服务器设置 -->
        <div v-if="activeTab === 'api-server'" class="settings-section">
          <div class="section-card">
            <div class="card-header">
              <h3>API服务器接口文档</h3>
              <div class="card-actions">
                <el-button @click="refreshApiStatus" :loading="refreshingStatus">
                  刷新状态
                </el-button>
                <el-button @click="showServerConfig">
                  配置服务器
                </el-button>
                <el-button @click="expandAllApis">
                  展开全部
                </el-button>
                <el-button @click="collapseAllApis">
                  折叠全部
                </el-button>
                <el-button type="primary" @click="testAllApis" :loading="testingAll">
                  测试所有接口
                </el-button>
              </div>
            </div>
            <div class="card-content">
              <div class="api-status">
                <div class="status-item">
                  <span class="status-label">服务器状态:</span>
                  <el-tag :type="apiStatus.healthy ? 'success' : 'danger'">
                    {{ apiStatus.healthy ? '在线' : '离线' }}
                  </el-tag>
                </div>
                <div class="status-item">
                  <span class="status-label">服务器地址:</span>
                  <span class="server-url">{{ apiStatus.serverUrl }}</span>
                </div>
                <div class="status-item">
                  <span class="status-label">响应时间:</span>
                  <span>{{ apiStatus.responseTime }}ms</span>
                </div>
                <div class="status-item">
                  <span class="status-label">API版本:</span>
                  <span>{{ apiStatus.version }}</span>
                </div>
                <div class="status-item">
                  <span class="status-label">最后检查:</span>
                  <span>{{ apiStatus.lastCheck }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- API接口列表 -->
          <div class="section-card" v-for="category in apiCategories" :key="category.name">
            <div class="card-header">
              <h3>{{ category.name }}</h3>
              <el-tag type="info">{{ category.apis.length }} 个接口</el-tag>
            </div>
            <div class="card-content">
              <div class="api-list">
                <div v-for="api in category.apis" :key="api.endpoint" class="api-item">
                  <div class="api-description">
                    {{ api.description }}
                  </div>
                  <div class="api-header" @click="toggleApiDetails(api)">
                    <div class="api-method">
                      <el-tag :type="getMethodType(api.method)" size="small">
                        {{ api.method }}
                      </el-tag>
                    </div>
                    <div class="api-endpoint">
                      <code>{{ api.endpoint }}</code>
                    </div>
                    <div class="api-actions">
                      <el-button size="small" @click.stop="testApi(api)" :loading="api.testing">
                        测试
                      </el-button>
                      <el-button size="small" @click.stop="showApiDetails(api)">
                        详情
                      </el-button>
                      <el-icon class="expand-icon" :class="{ 'expanded': api.expanded }">
                        <ArrowDown />
                      </el-icon>
                    </div>
                  </div>
                  <div class="api-details" v-show="api.expanded">
                    <div class="api-params" v-if="api.parameters && api.parameters.length > 0">
                      <div class="params-title">参数:</div>
                      <div class="params-list">
                        <div v-for="param in api.parameters" :key="param.name" class="param-item">
                          <span class="param-name">{{ param.name }}</span>
                          <span class="param-type">({{ param.type }})</span>
                          <span class="param-required" v-if="param.required">*</span>
                          <span class="param-description">{{ param.description }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="api-response" v-if="api.response">
                      <div class="response-title">返回数据:</div>
                      <pre class="response-example">{{ api.response }}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 系统信息 -->
        <div v-if="activeTab === 'system'" class="settings-section">
          <div class="section-card">
            <div class="card-header">
              <h3>系统信息</h3>
              <div class="card-actions">
                <el-button @click="refreshSystemInfo" :loading="loadingSystemInfo">
                  刷新信息
                </el-button>
              </div>
            </div>
            <div class="card-content">
              <div class="info-grid">
                <div class="info-item">
                  <label>应用版本</label>
                  <span>{{ systemInfo.version || '加载中...' }}</span>
                </div>
                <div class="info-item">
                  <label>构建时间</label>
                  <span>{{ systemInfo.buildTime || '加载中...' }}</span>
                </div>
                <div class="info-item">
                  <label>运行时间</label>
                  <span>{{ systemInfo.uptime || '加载中...' }}</span>
                </div>
                <div class="info-item">
                  <label>内存使用</label>
                  <span>{{ systemInfo.memoryUsage || '加载中...' }}</span>
                </div>
                <div class="info-item">
                  <label>磁盘使用</label>
                  <span>{{ systemInfo.diskUsage || '加载中...' }}</span>
                </div>
                <div class="info-item">
                  <label>网络状态</label>
                  <span :class="systemInfo.networkStatus === 'online' ? 'status-online' : 'status-offline'">
                    {{ systemInfo.networkStatus === 'online' ? '在线' : '离线' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Setting,
  Cpu,
  Folder,
  Warning,
  User,
  ArrowDown
} from '@element-plus/icons-vue'
import { useSettingsStore, useModelStore } from '../stores'
import { userSettingsApi, mcpApi } from '../api'

const settingsStore = useSettingsStore()
const modelStore = useModelStore()

// 当前激活的标签页
const activeTab = ref('data')

// 导航配置
const basicSettings = [
  { key: 'default-model', label: '默认模型', icon: Cpu },
  { key: 'general', label: '常规设置', icon: Setting }
]

const advancedSettings = [
  { key: 'mcp', label: 'MCP', icon: Setting },
  { key: 'web-search', label: '网络搜索', icon: Setting },
  { key: 'api-server', label: 'API 服务器', icon: Setting }
]

const dataSettings = [
  { key: 'data', label: '数据设置', icon: Folder },
  { key: 'system', label: '系统信息', icon: Setting }
]

// 响应式数据
const refreshingStatus = ref(false)
const testingAll = ref(false)
const loadingSystemInfo = ref(false)
const refreshingMCPStatus = ref(false)
const testingMCP = ref(false)

// API状态
const apiStatus = reactive({
  healthy: false,
  responseTime: 0,
  version: '1.0.0',
  serverUrl: 'http://127.0.0.1:8001',
  lastCheck: '未检查'
})

// API分类和接口数据
const apiCategories = ref([
  {
    name: '用户认证',
    apis: [
      {
        method: 'POST',
        endpoint: '/api/v1/auth/register',
        description: '用户注册',
        parameters: [
          { name: 'username', type: 'string', required: true, description: '用户名' },
          { name: 'email', type: 'string', required: true, description: '邮箱地址' },
          { name: 'password', type: 'string', required: true, description: '密码' },
          { name: 'nickname', type: 'string', required: false, description: '昵称' }
        ],
        response: `{
  "id": 1,
  "username": "user123",
  "email": "user@example.com",
  "nickname": "用户",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}`,
        testing: false,
        expanded: false
      },
      {
        method: 'POST',
        endpoint: '/api/v1/auth/login',
        description: '用户登录',
        parameters: [
          { name: 'username', type: 'string', required: true, description: '用户名' },
          { name: 'password', type: 'string', required: true, description: '密码' }
        ],
        response: `{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}`,
        testing: false,
        expanded: false
      },
      {
        method: 'GET',
        endpoint: '/api/v1/auth/me',
        description: '获取当前用户信息',
        parameters: [
          { name: 'Authorization', type: 'header', required: true, description: 'Bearer token' }
        ],
        response: `{
  "id": 1,
  "username": "user123",
  "email": "user@example.com",
  "nickname": "用户",
  "is_active": true
}`,
        testing: false,
        expanded: false
      }
    ]
  },
  {
    name: '聊天功能',
    apis: [
      {
        method: 'POST',
        endpoint: '/api/v1/chat/send',
        description: '发送消息（非流式）',
        parameters: [
          { name: 'conversation_id', type: 'int', required: true, description: '对话ID' },
          { name: 'message', type: 'string', required: true, description: '消息内容' },
          { name: 'stream', type: 'boolean', required: false, description: '是否流式响应' },
          { name: 'model_settings', type: 'object', required: false, description: '模型设置' }
        ],
        response: `{
  "message": "AI回复内容",
  "conversation_id": 1,
  "message_id": 123,
  "token_count": 150,
  "created_at": "2024-01-01T00:00:00Z"
}`,
        testing: false,
        expanded: false
      },
      {
        method: 'POST',
        endpoint: '/api/v1/chat/stream',
        description: '发送消息（流式响应）',
        parameters: [
          { name: 'conversation_id', type: 'int', required: true, description: '对话ID' },
          { name: 'message', type: 'string', required: true, description: '消息内容' },
          { name: 'stream', type: 'boolean', required: true, description: '必须为true' }
        ],
        response: 'Server-Sent Events流式数据',
        testing: false,
        expanded: false
      },
      {
        method: 'POST',
        endpoint: '/api/v1/chat/conversations',
        description: '创建新对话',
        parameters: [
          { name: 'title', type: 'string', required: true, description: '对话标题' },
          { name: 'model_config_id', type: 'int', required: false, description: '模型配置ID' },
          { name: 'knowledge_base_id', type: 'int', required: false, description: '知识库ID' }
        ],
        response: `{
  "conversation_id": 1,
  "title": "新对话",
  "message": "对话创建成功"
}`,
        testing: false,
        expanded: false
      },
      {
        method: 'GET',
        endpoint: '/api/v1/chat/conversations/{conversation_id}/messages',
        description: '获取消息历史',
        parameters: [
          { name: 'conversation_id', type: 'int', required: true, description: '对话ID' },
          { name: 'limit', type: 'int', required: false, description: '消息数量限制' }
        ],
        response: `{
  "messages": [
    {
      "id": 1,
      "role": "user",
      "content": "用户消息",
      "created_at": "2024-01-01T00:00:00Z",
      "token_count": 10
    }
  ],
  "total_count": 1,
  "conversation_id": 1
}`,
        testing: false,
        expanded: false
      }
    ]
  },
  {
    name: '对话管理',
    apis: [
      {
        method: 'GET',
        endpoint: '/api/v1/conversations/',
        description: '获取对话列表',
        parameters: [
          { name: 'skip', type: 'int', required: false, description: '跳过数量' },
          { name: 'limit', type: 'int', required: false, description: '限制数量' }
        ],
        response: `[
  {
    "id": 1,
    "title": "对话标题",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "message_count": 10
  }
]`,
        testing: false,
        expanded: false
      },
      {
        method: 'GET',
        endpoint: '/api/v1/conversations/{conversation_id}',
        description: '获取对话详情',
        parameters: [
          { name: 'conversation_id', type: 'int', required: true, description: '对话ID' }
        ],
        response: `{
  "id": 1,
  "title": "对话标题",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "messages": [...]
}`,
        testing: false,
        expanded: false
      },
      {
        method: 'PUT',
        endpoint: '/api/v1/conversations/{conversation_id}',
        description: '更新对话',
        parameters: [
          { name: 'conversation_id', type: 'int', required: true, description: '对话ID' },
          { name: 'title', type: 'string', required: false, description: '新标题' }
        ],
        response: `{
  "id": 1,
  "title": "更新后的标题",
  "updated_at": "2024-01-01T00:00:00Z"
}`,
        testing: false,
        expanded: false
      },
      {
        method: 'DELETE',
        endpoint: '/api/v1/conversations/{conversation_id}',
        description: '删除对话',
        parameters: [
          { name: 'conversation_id', type: 'int', required: true, description: '对话ID' }
        ],
        response: `{
  "message": "对话删除成功"
}`,
        testing: false,
        expanded: false
      }
    ]
  },
  {
    name: '模型管理',
    apis: [
      {
        method: 'GET',
        endpoint: '/api/v1/models/',
        description: '获取模型列表',
        parameters: [
          { name: 'skip', type: 'int', required: false, description: '跳过数量' },
          { name: 'limit', type: 'int', required: false, description: '限制数量' },
          { name: 'active_only', type: 'boolean', required: false, description: '仅激活模型' }
        ],
        response: `[
  {
    "id": 1,
    "name": "GPT-4",
    "model_name": "gpt-4",
    "provider": "openai",
    "is_active": true,
    "is_default": true
  }
]`,
        testing: false,
        expanded: false
      },
      {
        method: 'GET',
        endpoint: '/api/v1/models/active',
        description: '获取激活的模型',
        parameters: [],
        response: `[
  {
    "id": 1,
    "name": "GPT-4",
    "model_name": "gpt-4",
    "provider": "openai"
  }
]`,
        testing: false,
        expanded: false
      },
      {
        method: 'POST',
        endpoint: '/api/v1/models/',
        description: '创建模型配置',
        parameters: [
          { name: 'name', type: 'string', required: true, description: '模型名称' },
          { name: 'model_name', type: 'string', required: true, description: '模型标识' },
          { name: 'provider', type: 'string', required: true, description: '提供商' },
          { name: 'api_key', type: 'string', required: true, description: 'API密钥' },
          { name: 'api_url', type: 'string', required: true, description: 'API地址' }
        ],
        response: `{
  "id": 1,
  "name": "GPT-4",
  "model_name": "gpt-4",
  "provider": "openai",
  "is_active": true
}`,
        testing: false,
        expanded: false
      },
      {
        method: 'POST',
        endpoint: '/api/v1/models/{model_id}/test',
        description: '测试模型连接',
        parameters: [
          { name: 'model_id', type: 'int', required: true, description: '模型ID' }
        ],
        response: `{
  "success": true,
  "response_time": 1500,
  "message": "模型连接测试成功"
}`,
        testing: false,
        expanded: false
      }
    ]
  },
  {
    name: '提示词管理',
    apis: [
      {
        method: 'GET',
        endpoint: '/api/v1/prompts/',
        description: '获取提示词列表',
        parameters: [
          { name: 'skip', type: 'int', required: false, description: '跳过数量' },
          { name: 'limit', type: 'int', required: false, description: '限制数量' },
          { name: 'category', type: 'string', required: false, description: '分类筛选' }
        ],
        response: `[
  {
    "id": 1,
    "name": "代码助手",
    "content": "你是一个专业的代码助手...",
    "category": "编程",
    "is_public": true
  }
]`,
        testing: false,
        expanded: false
      },
      {
        method: 'POST',
        endpoint: '/api/v1/prompts/',
        description: '创建提示词模板',
        parameters: [
          { name: 'name', type: 'string', required: true, description: '模板名称' },
          { name: 'content', type: 'string', required: true, description: '模板内容' },
          { name: 'description', type: 'string', required: false, description: '描述' },
          { name: 'category', type: 'string', required: false, description: '分类' }
        ],
        response: `{
  "id": 1,
  "name": "代码助手",
  "content": "你是一个专业的代码助手...",
  "category": "编程",
  "is_public": true,
  "created_at": "2024-01-01T00:00:00Z"
}`,
        testing: false,
        expanded: false
      },
      {
        method: 'POST',
        endpoint: '/api/v1/prompts/{prompt_id}/render',
        description: '渲染提示词模板',
        parameters: [
          { name: 'prompt_id', type: 'int', required: true, description: '提示词ID' },
          { name: 'variables', type: 'object', required: true, description: '模板变量' }
        ],
        response: `{
  "rendered_content": "渲染后的内容",
  "variables_used": ["var1", "var2"],
  "variables_missing": []
}`,
        testing: false,
        expanded: false
      }
    ]
  },
  {
    name: '知识库管理',
    apis: [
      {
        method: 'GET',
        endpoint: '/api/v1/knowledge-bases/',
        description: '获取知识库列表',
        parameters: [
          { name: 'skip', type: 'int', required: false, description: '跳过数量' },
          { name: 'limit', type: 'int', required: false, description: '限制数量' }
        ],
        response: `[
  {
    "id": 1,
    "name": "技术文档",
    "description": "技术相关文档",
    "document_count": 10,
    "is_active": true
  }
]`,
        testing: false,
        expanded: false
      },
      {
        method: 'POST',
        endpoint: '/api/v1/knowledge-bases/',
        description: '创建知识库',
        parameters: [
          { name: 'name', type: 'string', required: true, description: '知识库名称' },
          { name: 'description', type: 'string', required: false, description: '描述' },
          { name: 'embedding_model', type: 'string', required: true, description: '嵌入模型' }
        ],
        response: `{
  "id": 1,
  "name": "技术文档",
  "description": "技术相关文档",
  "embedding_model": "text-embedding-ada-002",
  "created_at": "2024-01-01T00:00:00Z"
}`,
        testing: false,
        expanded: false
      },
      {
        method: 'POST',
        endpoint: '/api/v1/knowledge-bases/{knowledge_base_id}/documents',
        description: '上传文档到知识库',
        parameters: [
          { name: 'knowledge_base_id', type: 'int', required: true, description: '知识库ID' },
          { name: 'file', type: 'file', required: true, description: '文档文件' }
        ],
        response: `{
  "document_id": 1,
  "filename": "document.pdf",
  "file_size": 1024000,
  "processing_status": "completed",
  "message": "文档上传成功"
}`,
        testing: false,
        expanded: false
      },
      {
        method: 'POST',
        endpoint: '/api/v1/knowledge-bases/{knowledge_base_id}/search',
        description: '搜索知识库',
        parameters: [
          { name: 'knowledge_base_id', type: 'int', required: true, description: '知识库ID' },
          { name: 'query', type: 'string', required: true, description: '搜索查询' },
          { name: 'top_k', type: 'int', required: false, description: '返回结果数量' }
        ],
        response: `{
  "query": "搜索内容",
  "results": [
    {
      "content": "相关文档内容",
      "metadata": {...},
      "distance": 0.1
    }
  ],
  "total": 1
}`,
        testing: false,
        expanded: false
      }
    ]
  },
  {
    name: '用户设置',
    apis: [
      {
        method: 'GET',
        endpoint: '/api/v1/user-settings/',
        description: '获取用户设置',
        parameters: [],
        response: `{
  "id": 1,
  "user_id": 1,
  "default_model_id": 1,
  "title_generation_model_id": 1,
  "created_at": "2024-01-01T00:00:00Z"
}`,
        testing: false,
        expanded: false
      },
      {
        method: 'PUT',
        endpoint: '/api/v1/user-settings/',
        description: '更新用户设置',
        parameters: [
          { name: 'default_model_id', type: 'int', required: false, description: '默认模型ID' },
          { name: 'title_generation_model_id', type: 'int', required: false, description: '标题生成模型ID' }
        ],
        response: `{
  "id": 1,
  "user_id": 1,
  "default_model_id": 1,
  "title_generation_model_id": 1,
  "updated_at": "2024-01-01T00:00:00Z"
}`,
        testing: false,
        expanded: false
      },
      {
        method: 'POST',
        endpoint: '/api/v1/user-settings/generate-title',
        description: '生成对话标题',
        parameters: [
          { name: 'conversation_id', type: 'int', required: true, description: '对话ID' },
          { name: 'messages', type: 'array', required: true, description: '消息列表' },
          { name: 'model_id', type: 'int', required: false, description: '模型ID' }
        ],
        response: `{
  "success": true,
  "title": "生成的标题",
  "message": "标题生成成功",
  "model_used": "Model ID: 1"
}`,
        testing: false,
        expanded: false
      }
    ]
  }
])

// 默认模型设置 - 使用store中的数据
const defaultModelSettings = computed(() => settingsStore.defaultModelSettings)

// 常规设置
const generalSettings = reactive({
  language: 'zh-CN' as 'zh-CN' | 'en-US',
  timezone: 'Asia/Shanghai',
  autoSave: true
})


// 备份设置
const backupSettings = reactive({
  compactBackup: false
})

// 数据目录
const dataDirectories = reactive({
  appData: '',
  logs: '',
  uploads: '',
  chroma_db: '',
  database: ''
})

// 系统信息
const systemInfo = reactive({
  version: '1.0.0',
  buildTime: '2024-01-01 00:00:00',
  uptime: '0天0小时0分钟',
  memoryUsage: '0 MB',
  diskUsage: '0 MB',
  networkStatus: 'online'
})

// MCP设置
const mcpSettings = reactive({
  serverUrl: 'ws://localhost:8080/mcp',
  connectionTimeout: 30,
  heartbeatInterval: 30,
  maxRetries: 3,
  requestTimeout: 60,
  enableSSL: false
})

// MCP服务器列表
const mcpServers = ref([
  {
    id: 1,
    name: 'Everything Server',
    url: 'npx @modelcontextprotocol/server-everything',
    description: '提供文件系统、Git、数据库等功能的综合服务器',
    status: 'active'
  },
  {
    id: 2,
    name: 'Filesystem Server',
    url: 'npx @modelcontextprotocol/server-filesystem',
    description: '文件系统操作服务器',
    status: 'inactive'
  },
  {
    id: 3,
    name: 'Git Server',
    url: 'npx @modelcontextprotocol/server-git',
    description: 'Git 操作服务器',
    status: 'inactive'
  }
])

// MCP连接状态
const mcpStatus = reactive({
  connected: false,
  currentServer: '',
  sessionCount: 0,
  lastConnected: ''
})

// 获取当前标签页标题
const getCurrentTabTitle = () => {
  const allSettings = [...basicSettings, ...advancedSettings, ...dataSettings]
  const currentItem = allSettings.find(item => item.key === activeTab.value)
  return currentItem?.label || '设置'
}

// 方法
const getMethodType = (method: string) => {
  const methodTypes: Record<string, string> = {
    'GET': 'success',
    'POST': 'primary',
    'PUT': 'warning',
    'DELETE': 'danger',
    'PATCH': 'info'
  }
  return methodTypes[method] || 'info'
}

// MCP相关方法
const loadMCPSettings = async () => {
  try {
    // 从后端获取MCP健康状态，包含默认服务器地址
    const healthResult = await mcpApi.healthCheck()
    
    // 更新MCP设置中的服务器地址
    if (healthResult.server_url) {
      mcpSettings.serverUrl = healthResult.server_url
    }
    
    console.log('MCP设置加载完成:', mcpSettings)
  } catch (error: any) {
    console.warn('加载MCP设置失败:', error)
    // 使用默认设置
  }
}

const refreshMCPStatus = async () => {
  try {
    refreshingMCPStatus.value = true
    
    // 调用后端API获取MCP健康状态
    const healthResult = await mcpApi.healthCheck()
    
    // 获取MCP会话统计信息
    try {
      const statsResult = await mcpApi.getSessionStats()
      mcpStatus.sessionCount = statsResult.total_sessions || 0
    } catch (statsError) {
      // 如果获取统计信息失败，不影响主要功能
      console.warn('获取MCP会话统计失败:', statsError)
      mcpStatus.sessionCount = 0
    }
    
    // 更新状态
    mcpStatus.connected = healthResult.status === 'healthy'
    mcpStatus.currentServer = healthResult.server_url || mcpSettings.serverUrl
    
    ElMessage.success('MCP状态已刷新')
  } catch (error: any) {
    console.error('刷新MCP状态失败:', error)
    ElMessage.error('刷新MCP状态失败: ' + (error.response?.data?.detail || error.message))
    
    // 设置默认状态
    mcpStatus.connected = false
    mcpStatus.currentServer = ''
    mcpStatus.sessionCount = 0
  } finally {
    refreshingMCPStatus.value = false
  }
}

const testMCPConnection = async () => {
  try {
    testingMCP.value = true
    
    // 准备测试数据
    const testData = {
      server_url: mcpSettings.serverUrl || undefined,
      connection_config: {
        timeout: mcpSettings.connectionTimeout,
        heartbeat_interval: mcpSettings.heartbeatInterval,
        max_retries: mcpSettings.maxRetries,
        request_timeout: mcpSettings.requestTimeout,
        enable_ssl: mcpSettings.enableSSL
      }
    }
    
    // 调用后端API测试MCP连接
    const result = await mcpApi.testConnection(testData)
    
    if (result.success) {
      ElMessage.success(result.message)
      // 更新连接状态
      mcpStatus.connected = true
      mcpStatus.currentServer = result.server_url
      mcpStatus.lastConnected = new Date().toLocaleString()
    } else {
      ElMessage.error(result.message)
      // 更新连接状态
      mcpStatus.connected = false
      mcpStatus.currentServer = ''
    }
  } catch (error: any) {
    console.error('MCP连接测试失败:', error)
    
    // 改进错误消息显示
    let errorMessage = 'MCP连接测试失败: '
    if (error.response?.data?.detail) {
      errorMessage += error.response.data.detail
    } else if (error.message) {
      errorMessage += error.message
    } else {
      errorMessage += '未知错误'
    }
    
    // 特殊处理1011错误
    if (errorMessage.includes('1011')) {
      errorMessage += '\n\n建议解决方案:\n1. 检查MCP服务器是否正在运行\n2. 确认服务器支持MCP协议\n3. 验证服务器地址和端口是否正确'
    }
    
    ElMessage.error(errorMessage)
    // 更新连接状态
    mcpStatus.connected = false
    mcpStatus.currentServer = ''
  } finally {
    testingMCP.value = false
  }
}

const showAddServerDialog = () => {
  ElMessageBox.prompt('请输入MCP服务器信息', '添加MCP服务器', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputType: 'textarea',
    inputPlaceholder: '服务器名称\n服务器地址\n描述'
  }).then(({ value }) => {
    if (value) {
      const lines = value.split('\n')
      if (lines.length >= 2) {
        const newServer = {
          id: Date.now(),
          name: lines[0].trim(),
          url: lines[1].trim(),
          description: lines[2]?.trim() || '',
          status: 'inactive'
        }
        mcpServers.value.push(newServer)
        ElMessage.success('MCP服务器已添加')
      } else {
        ElMessage.error('请输入完整的服务器信息')
      }
    }
  }).catch(() => {
    // 用户取消
  })
}

const editServer = (server: any) => {
  ElMessageBox.prompt('编辑MCP服务器信息', '编辑服务器', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputType: 'textarea',
    inputValue: `${server.name}\n${server.url}\n${server.description}`
  }).then(({ value }) => {
    if (value) {
      const lines = value.split('\n')
      if (lines.length >= 2) {
        server.name = lines[0].trim()
        server.url = lines[1].trim()
        server.description = lines[2]?.trim() || ''
        ElMessage.success('MCP服务器已更新')
      } else {
        ElMessage.error('请输入完整的服务器信息')
      }
    }
  }).catch(() => {
    // 用户取消
  })
}

const connectToServer = async (server: any) => {
  try {
    // 这里可以调用后端API连接到指定的MCP服务器
    mcpStatus.connected = true
    mcpStatus.currentServer = server.name
    mcpStatus.lastConnected = new Date().toLocaleString()
    ElMessage.success(`已连接到 ${server.name}`)
  } catch (error) {
    ElMessage.error(`连接 ${server.name} 失败`)
  }
}

const deleteServer = async (server: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除MCP服务器 "${server.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const index = mcpServers.value.findIndex(s => s.id === server.id)
    if (index > -1) {
      mcpServers.value.splice(index, 1)
      ElMessage.success('MCP服务器已删除')
    }
  } catch (error) {
    // 用户取消
  }
}

const refreshApiStatus = async () => {
  const startTime = Date.now()
  try {
    refreshingStatus.value = true
    
    // 更新最后检查时间
    apiStatus.lastCheck = new Date().toLocaleString()
    
    // 测试健康检查端点
    const response = await fetch(`${apiStatus.serverUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      // 添加超时设置
      signal: AbortSignal.timeout(10000) // 10秒超时
    })
    
    const responseTime = Date.now() - startTime
    
    if (response.ok) {
      const data = await response.json()
      apiStatus.healthy = true
      apiStatus.responseTime = responseTime
      apiStatus.version = data.version || '1.0.0'
      ElMessage.success(`API服务器连接正常 (${responseTime}ms)`)
    } else {
      apiStatus.healthy = false
      apiStatus.responseTime = responseTime
      apiStatus.version = '未知'
      ElMessage.error(`API服务器响应异常 (${response.status})`)
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    apiStatus.healthy = false
    apiStatus.responseTime = responseTime
    apiStatus.version = '未知'
    
    if (error.name === 'TimeoutError') {
      ElMessage.error('API服务器连接超时')
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      ElMessage.error('无法连接到API服务器，请检查服务器地址和端口')
    } else {
      ElMessage.error(`API服务器连接失败: ${error.message}`)
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.error('API状态检查失败:', error)
    }
  } finally {
    refreshingStatus.value = false
  }
}

const testApi = async (api: any) => {
  try {
    api.testing = true
    
    // 根据不同的API类型进行测试
    let testUrl = `${apiStatus.serverUrl}${api.endpoint}`
    
    // 处理路径参数
    if (api.endpoint.includes('{conversation_id}')) {
      testUrl = testUrl.replace('{conversation_id}', '1')
    }
    if (api.endpoint.includes('{model_id}')) {
      testUrl = testUrl.replace('{model_id}', '1')
    }
    if (api.endpoint.includes('{prompt_id}')) {
      testUrl = testUrl.replace('{prompt_id}', '1')
    }
    if (api.endpoint.includes('{knowledge_base_id}')) {
      testUrl = testUrl.replace('{knowledge_base_id}', '1')
    }
    
    const options: RequestInit = {
      method: api.method,
      headers: {
        'Content-Type': 'application/json'
      }
    }
    
    // 为POST/PUT请求添加测试数据
    if (['POST', 'PUT'].includes(api.method)) {
      const testData: any = {}
      
      // 根据参数生成测试数据
      api.parameters?.forEach((param: any) => {
        if (param.required && param.type !== 'header') {
          switch (param.type) {
            case 'string':
              testData[param.name] = 'test_value'
              break
            case 'int':
              testData[param.name] = 1
              break
            case 'boolean':
              testData[param.name] = true
              break
            case 'object':
              testData[param.name] = {}
              break
            case 'array':
              testData[param.name] = []
              break
          }
        }
      })
      
      if (Object.keys(testData).length > 0) {
        options.body = JSON.stringify(testData)
      }
    }
    
    const response = await fetch(testUrl, options)
    
    if (response.ok) {
      ElMessage.success(`${api.description} 测试成功`)
    } else {
      ElMessage.error(`${api.description} 测试失败: ${response.status}`)
    }
    
  } catch (error) {
    ElMessage.error(`${api.description} 测试失败: ${error}`)
  } finally {
    api.testing = false
  }
}

const testAllApis = async () => {
  try {
    testingAll.value = true
    let successCount = 0
    let totalCount = 0
    
    for (const category of apiCategories.value) {
      for (const api of category.apis) {
        totalCount++
        try {
          await testApi(api)
          successCount++
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`API测试失败: ${api.endpoint}`, error)
          }
        }
      }
    }
    
    ElMessage.success(`API测试完成: ${successCount}/${totalCount} 个接口测试成功`)
  } catch (error) {
    ElMessage.error('批量测试失败')
  } finally {
    testingAll.value = false
  }
}

const showApiDetails = (api: any) => {
  // 创建详情对话框
  const details = `
接口: ${api.method} ${api.endpoint}
描述: ${api.description}

参数:
${api.parameters?.map((p: any) => `- ${p.name} (${p.type})${p.required ? ' *' : ''}: ${p.description}`).join('\n') || '无'}

返回示例:
${api.response}
  `
  
  ElMessageBox.alert(details, 'API详情', {
    confirmButtonText: '确定',
    customClass: 'api-details-dialog'
  })
}

const toggleApiDetails = (api: any) => {
  api.expanded = !api.expanded
}

const expandAllApis = () => {
  apiCategories.value.forEach(category => {
    category.apis.forEach(api => {
      api.expanded = true
    })
  })
  ElMessage.success('已展开所有接口')
}

const collapseAllApis = () => {
  apiCategories.value.forEach(category => {
    category.apis.forEach(api => {
      api.expanded = false
    })
  })
  ElMessage.success('已折叠所有接口')
}

const showServerConfig = () => {
  ElMessageBox.prompt('请输入API服务器地址', '配置服务器', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: apiStatus.serverUrl,
    inputPlaceholder: '例如: http://127.0.0.1:8001',
    inputValidator: (value) => {
      if (!value) {
        return '请输入服务器地址'
      }
      try {
        new URL(value)
        return true
      } catch {
        return '请输入有效的URL地址'
      }
    }
  }).then(({ value }) => {
    apiStatus.serverUrl = value
    ElMessage.success('服务器地址已更新')
    // 自动刷新状态
    refreshApiStatus()
  }).catch(() => {
    // 用户取消
  })
}

const saveDefaultModelSettings = async () => {
  try {
    if (defaultModelSettings.value) {
      // 更新本地设置
      settingsStore.updateDefaultModelSettings(defaultModelSettings.value)
      
      // 同步到后端
      await userSettingsApi.updateUserSettings({
        default_model_id: defaultModelSettings.value.modelId,
        title_generation_model_id: defaultModelSettings.value.titleGenerationModelId,
        enable_chain_of_thought: defaultModelSettings.value.enableChainOfThought
      })
      
      ElMessage.success('默认模型设置已保存')
    }
  } catch (error: any) {
    console.error('保存设置失败:', error)
    ElMessage.error('保存设置失败，请重试')
  }
}

const saveGeneralSettings = () => {
  settingsStore.updateSettings({
    language: generalSettings.language
  })
  ElMessage.success('常规设置已保存')
}


const backupData = () => {
  ElMessage.success('数据备份已开始')
}

const restoreData = () => {
  ElMessage.info('数据恢复功能开发中...')
}

// 加载数据目录信息
const loadDataDirectories = async () => {
  try {
    const directories = await userSettingsApi.getDataDirectories()
    dataDirectories.appData = directories.app_data?.path || ''
    dataDirectories.logs = directories.logs?.path || ''
    dataDirectories.uploads = directories.uploads?.path || ''
    dataDirectories.chroma_db = directories.chroma_db?.path || ''
    dataDirectories.database = directories.database?.path || ''
  } catch (error) {
    console.error('加载数据目录信息失败:', error)
    ElMessage.error('加载数据目录信息失败')
  }
}

// 加载系统信息
const loadSystemInfo = async () => {
  try {
    loadingSystemInfo.value = true
    const info = await userSettingsApi.getSystemInfo()
    
    // 更新系统信息
    systemInfo.version = info.version || '1.0.0'
    systemInfo.buildTime = info.build_time || '未知'
    systemInfo.uptime = info.uptime || '0天0小时0分钟'
    systemInfo.memoryUsage = info.memory_usage || '0 MB'
    systemInfo.diskUsage = info.disk_usage || '0 MB'
    systemInfo.networkStatus = info.network_status || 'online'
    
    // 系统信息加载成功
  } catch (error) {
    console.error('加载系统信息失败:', error)
    ElMessage.error('加载系统信息失败')
    
    // 设置默认值
    systemInfo.version = '1.0.0'
    systemInfo.buildTime = '未知'
    systemInfo.uptime = '0天0小时0分钟'
    systemInfo.memoryUsage = '0 MB'
    systemInfo.diskUsage = '0 MB'
    systemInfo.networkStatus = 'offline'
  } finally {
    loadingSystemInfo.value = false
  }
}

// 刷新系统信息
const refreshSystemInfo = async () => {
  await loadSystemInfo()
  ElMessage.success('系统信息已刷新')
}

// 打开目录
const openDirectory = (path: string) => {
  if (!path) {
    ElMessage.warning('目录路径不存在')
    return
  }
  
  // 在浏览器中打开目录（实际应用中可能需要调用系统API）
  ElMessage.info(`目录路径: ${path}`)
}

// 清除缓存
const clearCache = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清除缓存吗？此操作将删除所有缓存文件。',
      '清除缓存',
      {
        type: 'warning',
        confirmButtonText: '确定清除',
        cancelButtonText: '取消'
      }
    )
    
    const result = await userSettingsApi.clearCache()
    ElMessage.success(result.message)
    
    // 重新加载数据目录信息
    await loadDataDirectories()
  } catch (error: any) {
    if (error.message && error.message.includes('取消')) {
      return
    }
    console.error('清除缓存失败:', error)
    ElMessage.error('清除缓存失败')
  }
}

// 删除知识库文件
const deleteKnowledgeFiles = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除知识库文件吗？此操作将删除所有上传的文档和向量数据库，且不可恢复！',
      '删除知识库文件',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消'
      }
    )
    
    const result = await userSettingsApi.deleteKnowledgeFiles()
    ElMessage.success(result.message)
    
    // 重新加载数据目录信息
    await loadDataDirectories()
  } catch (error: any) {
    if (error.message && error.message.includes('取消')) {
      return
    }
    console.error('删除知识库文件失败:', error)
    ElMessage.error('删除知识库文件失败')
  }
}

const resetAllData = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有数据吗？此操作将删除所有聊天记录、设置和知识库数据，且不可恢复！',
      '危险操作',
      {
        type: 'warning',
        confirmButtonText: '确定重置',
        cancelButtonText: '取消'
      }
    )
    
    const result = await userSettingsApi.resetAllData()
    ElMessage.success(result.message)
    
    // 重新加载数据目录信息
    await loadDataDirectories()
  } catch (error: any) {
    if (error.message && error.message.includes('取消')) {
      return
    }
    console.error('重置数据失败:', error)
    ElMessage.error('重置数据失败')
  }
}

// 初始化
onMounted(async () => {
  // 加载设置
  settingsStore.loadSettings()
  await modelStore.loadModels()
  
  // 加载数据目录信息
  await loadDataDirectories()
  
  // 加载系统信息
  await loadSystemInfo()
  
  // 刷新MCP状态
  await refreshMCPStatus()
  
  // 加载MCP设置
  await loadMCPSettings()
  
  // 从后端加载用户设置
  try {
    const userSettings = await userSettingsApi.getUserSettings()
    if (userSettings) {
      // 更新本地设置
      settingsStore.updateDefaultModelSettings({
        modelId: userSettings.default_model_id,
        titleGenerationModelId: userSettings.title_generation_model_id,
        enableChainOfThought: userSettings.enable_chain_of_thought
      })
    }
  } catch (error) {
    // 加载用户设置失败，使用默认设置
  }
  
  // 如果默认模型设置中没有选择模型，选择第一个可用模型
  if (!defaultModelSettings.value?.modelId && modelStore.activeModels.length > 0) {
    settingsStore.updateDefaultModelSettings({
      modelId: modelStore.activeModels[0]?.id
    })
  }
  
  // 如果标题生成模型没有设置，使用默认模型
  if (!defaultModelSettings.value?.titleGenerationModelId && defaultModelSettings.value?.modelId) {
    settingsStore.updateDefaultModelSettings({
      titleGenerationModelId: defaultModelSettings.value.modelId
    })
  }
  
  // 如果当前是API服务器页面，自动检查状态
  if (activeTab.value === 'api-server') {
    refreshApiStatus()
  }
})

// 监听activeTab变化，当切换到API服务器页面时自动检查状态
watch(activeTab, (newTab) => {
  if (newTab === 'api-server') {
    refreshApiStatus()
  } else if (newTab === 'system') {
    // 当切换到系统信息页面时，刷新系统信息
    loadSystemInfo()
  }
})
</script>

<style scoped>
.settings-layout {
  display: flex;
  height: 100%;
  background: #f5f5f5;
  padding: 15px;
  box-sizing: border-box;
  overflow: hidden;
}

/* 左侧导航栏 */
.settings-sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.header-icon {
  color: #4caf50;
  font-size: 20px;
}

.sidebar-content {
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
}

.nav-group {
  margin-bottom: 24px;
}

.group-title {
  padding: 0 20px 8px;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
  font-size: 14px;
}

.nav-item:hover {
  background: #f8f9fa;
  color: #333;
}

.nav-item.active {
  background: #e8f5e8;
  color: #333;
  border-right: 3px solid #4caf50;
}

.nav-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.nav-text {
  flex: 1;
}

/* 右侧内容区域 */
.settings-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.content-header {
  padding: 24px 32px 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.content-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.content-body {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 卡片样式 */
.section-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.card-content {
  padding: 24px;
}

/* 备份选项样式 */
.backup-option {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.option-content {
  flex: 1;
}

.option-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.option-description {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

/* 目录项样式 */
.directory-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.directory-item:last-child {
  border-bottom: none;
}

.directory-info {
  flex: 1;
}

.directory-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.directory-path {
  font-size: 13px;
  color: #666;
  font-family: 'Courier New', monospace;
}

/* 重置警告样式 */
.reset-warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  margin-bottom: 16px;
}

.warning-icon {
  color: #f39c12;
  font-size: 20px;
  margin-top: 2px;
}

.warning-content {
  flex: 1;
}

.warning-title {
  font-size: 14px;
  font-weight: 600;
  color: #856404;
  margin-bottom: 4px;
}

.warning-text {
  font-size: 13px;
  color: #856404;
  line-height: 1.4;
}

.reset-actions {
  display: flex;
  justify-content: flex-end;
}

/* 系统信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

.info-item span {
  font-size: 14px;
  color: #333;
}

.status-online {
  color: #4caf50;
  font-weight: 600;
}

.status-offline {
  color: #f44336;
  font-weight: 600;
}

/* 表单提示 */
.form-tip {
  margin-left: 8px;
  color: #666;
  font-size: 12px;
}

/* API服务器设置样式 */
.api-status {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-label {
  font-weight: 500;
  color: #666;
}

.server-url {
  font-family: 'Courier New', monospace;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
  color: #007bff;
  font-size: 13px;
}

.api-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.api-item {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  background: white;
  transition: all 0.2s ease;
}

.api-item:hover {
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
}

.api-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.api-header:hover {
  background-color: #f8f9fa;
}

.api-method {
  flex-shrink: 0;
}

.api-endpoint {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #333;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
}

.api-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.expand-icon {
  font-size: 16px;
  color: #666;
  transition: transform 0.3s ease;
  cursor: pointer;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.api-description {
  color: #333;
  font-weight: 500;
  margin-bottom: 8px;
  line-height: 1.5;
  font-size: 14px;
}

.api-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e9ecef;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.api-params {
  margin-bottom: 12px;
}

.params-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.params-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.param-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.param-name {
  font-weight: 500;
  color: #333;
  min-width: 80px;
}

.param-type {
  color: #007bff;
  font-family: 'Courier New', monospace;
}

.param-required {
  color: #dc3545;
  font-weight: bold;
}

.param-description {
  color: #666;
}

.api-response {
  margin-top: 12px;
}

.response-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.response-example {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
}

/* API详情对话框样式 */
.api-details-dialog {
  max-width: 800px;
}

.api-details-dialog .el-message-box__content {
  white-space: pre-wrap;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .settings-sidebar {
    width: 240px;
  }
  
  .content-body {
    padding: 20px 24px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .api-status {
    flex-direction: column;
    gap: 12px;
  }
  
  .api-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .api-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .settings-layout {
    flex-direction: column;
  }
  
  .settings-sidebar {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .sidebar-content {
    display: flex;
    overflow-x: auto;
    padding: 12px 16px;
  }
  
  .nav-group {
    margin-bottom: 0;
    margin-right: 24px;
    min-width: 120px;
  }
  
  .nav-item {
    padding: 8px 12px;
    white-space: nowrap;
  }
  
  .content-body {
    padding: 16px;
  }
  
  .card-content {
    padding: 16px;
  }
  
  .directory-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .reset-actions {
    justify-content: flex-start;
  }
}
</style>
