<template>
  <div class="chat-container">
    <!-- 页面加载遮罩 -->
    <div v-if="isPageLoading" class="page-loading-overlay">
      <div class="loading-content">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p class="loading-text">正在加载对话界面...</p>
      </div>
    </div>
    
    <!-- 移动端遮罩层 -->
    <div 
      v-if="isMobile && sidebarVisible" 
      class="sidebar-overlay" 
      @click="toggleSidebar"
    ></div>
    
    <el-row :gutter="16" class="chat-layout">
      <!-- 左侧Tab栏 -->
      <el-col :xs="0" :sm="0" :md="6" :lg="6" :xl="6" class="conversation-sidebar" :class="{ show: sidebarVisible }">
        <div class="sidebar-tabs">
          <el-tabs v-model="activeTab" class="sidebar-tabs-container">
            <!-- 会话历史Tab -->
            <el-tab-pane label="会话" name="conversations">
              <div class="tab-content">
                <div class="tab-header">
                  <el-button 
                    type="primary" 
                    @click="createNewConversation"
                    :icon="Plus"
                    size="small"
                    style="width: 94%"
                  >
                    新建对话
                  </el-button>
                </div>
                
                <div class="conversation-list">
                  <!-- 会话历史加载状态 -->
                  <div v-if="isConversationsLoading" class="conversations-loading">
                    <div class="loading-skeleton" v-for="n in 3" :key="n">
                      <div class="skeleton-avatar"></div>
                      <div class="skeleton-content">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-meta"></div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 会话历史列表 -->
                  <div 
                    v-else
                    v-for="conversation in conversations" 
                    :key="conversation.id"
                    class="conversation-item"
                    :class="{ active: currentConversationId === conversation.id }"
                    @click="selectConversation(conversation.id)"
                  >
                    <div class="conversation-content">
                      <div class="conversation-title">{{ conversation.title }}</div>
                      <div class="conversation-meta">
                        <span class="message-count">{{ conversation.message_count }} 条消息</span>
                        <span class="last-time">{{ formatTime(conversation.last_message_at) }}</span>
                      </div>
                    </div>
                    <div class="conversation-actions" @click.stop>
                      <el-button 
                        type="danger" 
                        size="small" 
                        :icon="Delete" 
                        circle 
                        @click="deleteConversation(conversation.id)"
                        title="删除会话"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <!-- 模型选择Tab -->
            <el-tab-pane label="模型" name="models">
              <div class="tab-content">
                <div class="selection-section">
                  <h4>模型选择</h4>
                  <el-select 
                    v-model="selectedModel" 
                    placeholder="选择模型"
                    style="width: 100%"
                    @change="handleModelChange"
                  >
                    <el-option
                      v-for="model in activeModels"
                      :key="model.id"
                      :label="model.name"
                      :value="model.id"
                    />
                  </el-select>
                </div>

                <div class="selection-section">
                  <h4>提示词模板</h4>
                  <el-select 
                    v-model="selectedPrompt" 
                    placeholder="选择提示词模板"
                    style="width: 100%"
                    @change="handlePromptChange"
                  >
                    <el-option
                      v-for="prompt in prompts"
                      :key="prompt.id"
                      :label="prompt.name"
                      :value="prompt.id"
                    />
                  </el-select>
                  <div v-if="selectedPrompt" class="prompt-preview">
                    <div class="prompt-preview-title">当前提示词内容:</div>
                    <div class="prompt-preview-content">
                      {{ getSelectedPromptContent() }}
                    </div>
                    <div class="prompt-preview-meta">
                      <span>ID: {{ selectedPrompt }}</span>
                      <span>状态: {{ getSelectedPromptStatus() }}</span>
                      <span>长度: {{ getSelectedPromptContent().length }} 字符</span>
                    </div>
                  </div>
                </div>

                <div class="selection-section">
                  <h4>知识库选择</h4>
                  <el-select 
                    v-model="selectedKnowledgeBase" 
                    placeholder="选择知识库"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="kb in knowledgeBases"
                      :key="kb.id"
                      :label="kb.name"
                      :value="kb.id"
                    />
                  </el-select>
                </div>
              </div>
            </el-tab-pane>

            <!-- 模型设置Tab -->
            <el-tab-pane label="设置" name="settings">
              <div class="tab-content">
                <div class="settings-section">
                  <div class="setting-item">
                    <div class="setting-label">
                      <span>上下文数</span>
                      <el-icon class="info-icon"><InfoFilled /></el-icon>
                    </div>
                    <div class="setting-control">
                      <el-slider 
                        v-model="modelSettings.contextCount" 
                        :min="1" 
                        :max="50" 
                        :step="1"
                        :show-input="false"
                      />
                    </div>
                  </div>

                  <div class="setting-item">
                    <div class="setting-label">流式输出</div>
                    <div class="setting-control">
                      <el-switch v-model="modelSettings.streaming" />
                    </div>
                  </div>

                  <div class="setting-item">
                    <div class="setting-label">
                      <span>温度设置</span>
                      <el-icon class="info-icon"><InfoFilled /></el-icon>
                    </div>
                    <div class="setting-control">
                      <el-slider 
                        v-model="modelSettings.temperature" 
                        :min="0" 
                        :max="2" 
                        :step="0.1"
                        :show-input="true"
                        style="width: 100%"
                      />
                    </div>
                  </div>

                  <div class="setting-item">
                    <div class="setting-label">
                      <span>最大 Token 数</span>
                      <el-icon class="info-icon"><InfoFilled /></el-icon>
                    </div>
                    <div class="setting-control">
                      <el-switch v-model="modelSettings.maxTokensEnabled" />
                    </div>
                  </div>

                  <div class="setting-item" v-if="modelSettings.maxTokensEnabled">
                    <div class="setting-label">
                      <span>Token 数量</span>
                    </div>
                    <div class="setting-control">
                      <el-input-number 
                        v-model="modelSettings.maxTokens" 
                        :min="100" 
                        :max="4000" 
                        style="width: 100%"
                      />
                    </div>
                  </div>

                  <div class="setting-item">
                    <div class="setting-label">
                      <span>Top P</span>
                      <el-icon class="info-icon"><InfoFilled /></el-icon>
                    </div>
                    <div class="setting-control">
                      <el-slider 
                        v-model="modelSettings.topP" 
                        :min="0" 
                        :max="1" 
                        :step="0.1"
                        :show-input="true"
                        style="width: 100%"
                      />
                    </div>
                  </div>

                  <div class="setting-item">
                    <div class="setting-label">
                      <span>频率惩罚</span>
                      <el-icon class="info-icon"><InfoFilled /></el-icon>
                    </div>
                    <div class="setting-control">
                      <el-slider 
                        v-model="modelSettings.frequencyPenalty" 
                        :min="-2" 
                        :max="2" 
                        :step="0.1"
                        :show-input="true"
                        style="width: 100%"
                      />
                    </div>
                  </div>

                  <div class="setting-item">
                    <div class="setting-label">
                      <span>存在惩罚</span>
                      <el-icon class="info-icon"><InfoFilled /></el-icon>
                    </div>
                    <div class="setting-control">
                      <el-slider 
                        v-model="modelSettings.presencePenalty" 
                        :min="-2" 
                        :max="2" 
                        :step="0.1"
                        :show-input="true"
                        style="width: 100%"
                      />
                    </div>
                  </div>

                  <div class="setting-group">
                    <div class="group-header">
                      <el-icon class="group-icon"><ArrowDown /></el-icon>
                      <span>消息设置</span>
                    </div>
                    <div class="group-content">
                      <div class="setting-item">
                        <div class="setting-label">显示提示词</div>
                        <div class="setting-control">
                          <el-switch v-model="modelSettings.showPrompt" />
                        </div>
                      </div>

                      <div class="setting-item">
                        <div class="setting-label">使用衬线字体</div>
                        <div class="setting-control">
                          <el-switch v-model="modelSettings.useSerifFont" />
                        </div>
                      </div>

                      <div class="setting-item">
                        <div class="setting-label">
                          <span>思考内容自动折叠</span>
                          <el-icon class="info-icon"><InfoFilled /></el-icon>
                        </div>
                        <div class="setting-control">
                          <el-switch v-model="modelSettings.autoCollapseThinking" />
                        </div>
                      </div>

                      <div class="setting-item">
                        <div class="setting-label">显示消息大纲</div>
                        <div class="setting-control">
                          <el-switch v-model="modelSettings.showMessageOutline" />
                        </div>
                      </div>

                      <div class="setting-item">
                        <div class="setting-label">消息样式</div>
                        <div class="setting-control">
                          <el-select v-model="modelSettings.messageStyle" style="width: 100%">
                            <el-option label="简洁" value="concise" />
                            <el-option label="详细" value="detailed" />
                            <el-option label="专业" value="professional" />
                          </el-select>
                        </div>
                      </div>

                      <div class="setting-item">
                        <div class="setting-label">多模型回答样式</div>
                        <div class="setting-control">
                          <el-select v-model="modelSettings.multiModelStyle" style="width: 100%">
                            <el-option label="标签模式" value="tag" />
                            <el-option label="列表模式" value="list" />
                            <el-option label="卡片模式" value="card" />
                          </el-select>
                        </div>
                      </div>

                      <div class="setting-item">
                        <div class="setting-label">对话导航按钮</div>
                        <div class="setting-control">
                          <el-select v-model="modelSettings.conversationNavButton" style="width: 100%">
                            <el-option label="不显示" value="none" />
                            <el-option label="显示" value="show" />
                            <el-option label="自动隐藏" value="auto" />
                          </el-select>
                        </div>
                      </div>

                      <div class="setting-item">
                        <div class="setting-label">消息字体大小</div>
                        <div class="setting-control">
                          <el-select v-model="modelSettings.messageFontSize" style="width: 100%">
                            <el-option label="小" value="small" />
                            <el-option label="中" value="medium" />
                            <el-option label="大" value="large" />
                          </el-select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-col>

      <!-- 中间聊天区域 -->
      <el-col :xs="24" :sm="24" :md="18" :lg="18" :xl="18" class="chat-main">
        <div class="chat-header">
          <div class="chat-title-section">
            <el-button 
              v-if="isMobile" 
              @click="toggleSidebar" 
              :icon="Menu" 
              size="small" 
              circle
              class="sidebar-toggle"
            />
            <div class="model-selector">
              <el-select 
                v-model="selectedModel" 
                placeholder="选择模型"
                @change="handleModelChange"
                class="model-select"
                size="large"
              >
                <el-option
                  v-for="model in activeModels"
                  :key="model.id"
                  :label="model.name"
                  :value="model.id"
                >
                  <div class="model-option">
                    <span class="model-name">{{ model.name }}</span>
                    <span class="model-provider">{{ model.provider }}</span>
                  </div>
                </el-option>
              </el-select>
            </div>
          </div>
          <div class="chat-actions">
            <!-- 按钮已移除 -->
          </div>
        </div>

        <div class="chat-messages" ref="messagesContainer">
          
          <!-- 没有配置模型时的引导信息 -->
          <div v-if="!defaultModel && messages.length === 0" class="welcome-message">
            <div class="welcome-content">
              <el-icon class="welcome-icon"><ChatDotRound /></el-icon>
              <h3>欢迎使用锋煊智能系统</h3>
              <p>请先配置模型后再开始对话</p>
              <el-button type="primary" @click="$router.push('/models')">
                前往模型管理
              </el-button>
            </div>
          </div>
          
          <div 
            v-for="message in messages" 
            :key="message.id"
            class="message-item"
            :class="message.role"
            :data-message-id="message.id"
            :data-message-role="message.role"
          >
            <div class="message-avatar">
              <el-avatar :size="32" v-if="message.role === 'user'">
                <img 
                  v-if="authStore.user?.avatar" 
                  :src="getUserAvatarUrl()" 
                  :alt="authStore.user?.username"
                  @error="handleAvatarError"
                />
                <el-icon v-else>
                  <User />
                </el-icon>
              </el-avatar>
              <el-avatar :size="32" v-else>
                <img 
                  :src="aiAvatarUrl" 
                  alt="AI助手"
                  @error="handleAvatarError"
                />
              </el-avatar>
            </div>
            <div class="message-content">
              <div class="message-text-wrapper">
                <div class="message-text" v-html="formatMessage(message.content)"></div>
                <button 
                  v-if="message.role === 'assistant'"
                  @click="copyMessage(message.content)"
                  class="copy-button"
                  title="复制内容"
                >
                  <el-icon><CopyDocument /></el-icon>
                </button>
              </div>
              <div class="message-meta">
                <span>{{ formatTime(message.created_at) }}</span>
                <span v-if="message.token_count">Token: {{ message.token_count }}</span>
                <span v-if="selectedPrompt && message.role === 'assistant'" class="prompt-indicator">
                  使用提示词: {{ prompts.find(p => p.id === selectedPrompt)?.name || '未知' }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- 加载状态 -->
          <div v-if="isLoading" class="message-item assistant">
            <div class="message-avatar">
              <el-avatar :size="32">
                <img 
                  :src="aiAvatarUrl" 
                  alt="AI助手"
                  @error="handleAvatarError"
                />
              </el-avatar>
            </div>
            <div class="message-content">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="chat-input">
          <div class="input-container">
            <div class="input-wrapper">
              <el-input
                v-model="inputMessage"
                type="textarea"
                :rows="3"
                placeholder="发消息或输入 / 选择技能"
                @keydown.ctrl.enter="sendMessage"
                :disabled="isLoading"
                class="message-input"
              />
              <button 
                @click="sendMessage"
                :disabled="!inputMessage.trim() || isLoading"
                class="send-arrow-btn"
                :class="{ 'has-content': inputMessage.trim() }"
              >
                <el-icon><ArrowUp /></el-icon>
              </button>
            </div>
          </div>
        </div>

      </el-col>

    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useChatStore, useModelStore, usePromptStore, useKnowledgeStore, useSettingsStore, useAuthStore } from '../stores'
import { chatApi, modelApi, promptApi, knowledgeApi, userSettingsApi } from '../api'
import { 
  Plus, 
  Delete, 
  User, 
  ChatDotRound,
  Menu,
  InfoFilled,
  ArrowDown,
  ArrowUp,
  CopyDocument,
  Loading
} from '@element-plus/icons-vue'
import type { Conversation, Message } from '../types'
import aiAvatar from '@/assets/logo/robbit.jpg'

const chatStore = useChatStore()
const modelStore = useModelStore()
const promptStore = usePromptStore()
const knowledgeStore = useKnowledgeStore()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()

// AI头像URL
const aiAvatarUrl = ref(aiAvatar)

// 响应式数据
const inputMessage = ref('')
const selectedModel = ref<number | null>(null)
const selectedPrompt = ref<number | null>(null)
const selectedKnowledgeBase = ref<number | null>(null)
const messagesContainer = ref<HTMLElement>()
const isMobile = ref(false)
const sidebarVisible = ref(false)
const activeTab = ref('conversations')

// 加载状态
const isPageLoading = ref(true)
const isConversationsLoading = ref(false)


// 模型设置
const modelSettings = ref({
  temperature: 0.7,
  maxTokens: 2000,
  maxTokensEnabled: false,
  topP: 1.0,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0,
  contextCount: 10,
  streaming: true,
  showPrompt: true,
  useSerifFont: false,
  autoCollapseThinking: true,
  showMessageOutline: false,
  messageStyle: 'concise',
  multiModelStyle: 'tag',
  conversationNavButton: 'none',
  messageFontSize: 'medium'
})

// 从设置store中同步默认模型设置
const syncModelSettings = () => {
  const defaultSettings = settingsStore.defaultModelSettings
  if (defaultSettings.modelId) {
    selectedModel.value = defaultSettings.modelId
  }
  if (defaultSettings.temperature !== undefined) {
    modelSettings.value.temperature = defaultSettings.temperature
  }
  if (defaultSettings.maxTokens !== undefined) {
    modelSettings.value.maxTokens = defaultSettings.maxTokens
  }
  if (defaultSettings.topP !== undefined) {
    modelSettings.value.topP = defaultSettings.topP
  }
  if (defaultSettings.frequencyPenalty !== undefined) {
    modelSettings.value.frequencyPenalty = defaultSettings.frequencyPenalty
  }
  if (defaultSettings.presencePenalty !== undefined) {
    modelSettings.value.presencePenalty = defaultSettings.presencePenalty
  }
}

// 计算属性
const conversations = computed(() => chatStore.conversations)
const currentConversationId = computed(() => chatStore.currentConversationId)
const messages = computed(() => chatStore.messages)
const isLoading = computed(() => chatStore.isLoading)
const defaultModel = computed(() => modelStore.defaultModel)
const activeModels = computed(() => modelStore.activeModels)
const prompts = computed(() => promptStore.prompts)
const knowledgeBases = computed(() => knowledgeStore.activeKnowledgeBases)


// 方法
const formatTime = (time: string | undefined) => {
  if (!time) return '未知'
  return new Date(time).toLocaleString('zh-CN')
}


const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const createNewConversation = async () => {
  try {
    // 检查是否有默认模型
    if (!defaultModel.value) {
      ElMessage.warning('请先配置模型后再创建对话。请前往"模型管理"页面添加模型。')
      return false
    }
    
    
    const response = await chatApi.createConversation({
      title: '新对话',
      model_config_id: defaultModel.value.id,
      prompt_template_id: selectedPrompt.value || undefined,
      knowledge_base_id: selectedKnowledgeBase.value || undefined
    })
    
    
    const newConversation: Conversation = {
      id: response.conversation_id,
      title: response.title,
      user_id: authStore.user?.id || 1,  // 使用当前用户ID，如果没有则使用默认值
      model_config_id: defaultModel.value.id,
      message_count: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    chatStore.addConversation(newConversation)
    // 设置当前对话ID
    chatStore.setCurrentConversation(response.conversation_id)
    // 创建新对话后清空消息列表
    chatStore.messages = []
    return true
  } catch (error: any) {
    console.error('创建对话失败:', error)
    const errorMessage = error.response?.data?.detail || error.message || '创建对话失败，请重试'
    ElMessage.error(errorMessage)
    return false
  }
}

const selectConversation = async (conversationId: number) => {
  chatStore.setCurrentConversation(conversationId)
  
  try {
    await chatStore.loadConversationMessages(conversationId)
    // 延迟滚动，确保消息完全渲染
    nextTick(() => {
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    })
  } catch (error) {
    console.error('获取消息历史失败:', error)
    ElMessage.error('加载会话消息失败')
  }
}

const deleteConversation = async (conversationId: number) => {
  try {
    await chatStore.deleteConversation(conversationId)
    ElMessage.success('会话删除成功')
  } catch (error) {
    console.error('删除会话失败:', error)
    ElMessage.error('删除会话失败')
  }
}

// 移除未使用的函数

const formatMessage = (content: string) => {
  if (!content) return ''
  
  // 转义HTML特殊字符
  let formatted = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
  
  // 处理思维链 - 优先处理，避免被其他规则影响
  formatted = formatted.replace(/【思考过程】([\s\S]*?)【最终答案】/g, 
    '<div class="thinking-process"><div class="thinking-header">💭 思考过程</div><div class="thinking-content">$1</div></div><div class="final-answer"><div class="answer-header">✨ 最终答案</div><div class="answer-content">')
  
  // 如果只有思考过程没有最终答案
  formatted = formatted.replace(/【思考过程】([\s\S]*?)(?=【最终答案】|$)/g, 
    '<div class="thinking-process"><div class="thinking-header">💭 思考过程</div><div class="thinking-content">$1</div></div>')
  
  // 如果只有最终答案没有思考过程
  formatted = formatted.replace(/【最终答案】([\s\S]*?)$/g, 
    '<div class="final-answer"><div class="answer-header">✨ 最终答案</div><div class="answer-content">$1</div></div>')
  
  // 处理代码块
  formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="code-block"><code class="language-$1">$2</code></pre>')
  
  // 处理行内代码
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
  
  // 处理标题
  formatted = formatted.replace(/^### (.*$)/gim, '<h3 class="message-h3">$1</h3>')
  formatted = formatted.replace(/^## (.*$)/gim, '<h2 class="message-h2">$1</h2>')
  formatted = formatted.replace(/^# (.*$)/gim, '<h1 class="message-h1">$1</h1>')
  
  // 处理列表
  formatted = formatted.replace(/^\* (.*$)/gim, '<li class="message-li">$1</li>')
  formatted = formatted.replace(/^- (.*$)/gim, '<li class="message-li">$1</li>')
  formatted = formatted.replace(/^\d+\. (.*$)/gim, '<li class="message-li numbered">$1</li>')
  
  // 处理粗体和斜体
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="message-strong">$1</strong>')
  formatted = formatted.replace(/\*(.*?)\*/g, '<em class="message-em">$1</em>')
  
  // 处理链接
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="message-link">$1</a>')
  
  // 处理换行
  formatted = formatted.replace(/\n/g, '<br>')
  
  return formatted
}

// 移除展开/折叠功能，不再需要此函数

const getSelectedPromptContent = () => {
  if (!selectedPrompt.value) return ''
  const prompt = prompts.value.find(p => p.id === selectedPrompt.value)
  return prompt?.content || '未找到提示词内容'
}

const getSelectedPromptStatus = () => {
  if (!selectedPrompt.value) return '未选择'
  const prompt = prompts.value.find(p => p.id === selectedPrompt.value)
  return prompt?.is_active ? '激活' : '未激活'
}

// 移除展开/折叠功能，不再需要此函数

const copyMessage = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    ElMessage.success('内容已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败，请手动复制')
  }
}

const generateConversationTitle = async () => {
  try {
    // 检查是否有足够的消息
    if (chatStore.messages.length < 2) {
      return
    }
    
    // 检查是否已经有标题（不是"新对话"）
    const currentConversation = conversations.value.find(c => c.id === currentConversationId.value)
    if (currentConversation && currentConversation.title !== '新对话') {
      return
    }
    
    
    // 准备消息数据
    const messages = chatStore.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
    
    // 获取标题生成模型ID
    const titleGenerationModelId = settingsStore.defaultModelSettings.titleGenerationModelId || defaultModel.value?.id
    
    if (!titleGenerationModelId) {
      return
    }
    
    // 调用标题生成API
    const response = await userSettingsApi.generateTitle({
      conversation_id: currentConversationId.value,
      messages: messages,
      model_id: titleGenerationModelId
    })
    
    if (response.success && response.title) {
      
      // 更新对话标题
      await chatStore.updateConversationTitle(currentConversationId.value!, response.title)
      
      // 更新本地对话列表中的标题
      const conversationIndex = conversations.value.findIndex(c => c.id === currentConversationId.value)
      if (conversationIndex !== -1 && conversations.value[conversationIndex]) {
        conversations.value[conversationIndex].title = response.title
      }
      
      ElMessage.success(`对话标题已生成: ${response.title}`)
    }
  } catch (error: any) {
    console.error('生成对话标题失败:', error)
    
    // 如果是"未设置标题生成模型"错误，提供友好的提示
    if (error.response?.data?.detail === '未设置标题生成模型') {
      // 不显示错误消息，避免干扰用户体验
    }
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim()) return
  
  // 检查是否配置了模型
  if (!defaultModel.value) {
    ElMessage.warning('请先配置模型后再进行对话。请前往"模型管理"页面添加模型。')
    return
  }
  
  const messageContent = inputMessage.value.trim()
  
  // 先保存用户消息内容，因为后续操作可能会清空输入框
  const userMessage: Message = {
    id: Date.now() + Math.random() * 1000, // 更唯一的ID
    conversation_id: currentConversationId.value || 0, // 临时ID，稍后会更新
    role: 'user',
    content: messageContent,
    token_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expanded: true // 默认展开
  }
  
  // 检查是否有对话，没有则创建
  if (!currentConversationId.value) {
    const created = await createNewConversation()
    if (!created || !currentConversationId.value) {
      return
    }
    // 设置对话ID
    userMessage.conversation_id = currentConversationId.value!
  } else {
    userMessage.conversation_id = currentConversationId.value!
  }
  
  chatStore.addMessage(userMessage)
  
    // 清空输入框
    inputMessage.value = ''
    scrollToBottom()
  
  // 发送到后端
  try {
    chatStore.isLoading = true
    
    // 验证提示词模板数据
    // 验证提示词模板
    
    const request = {
      conversation_id: currentConversationId.value!,
      message: messageContent,
      stream: modelSettings.value.streaming,
      model_config_id: selectedModel.value || defaultModel.value?.id,
      knowledge_base_id: selectedKnowledgeBase.value || undefined,
      prompt_template_id: selectedPrompt.value || undefined, // 每次发送消息时都传递当前选择的提示词模板
      // 添加模型设置参数
      model_settings: {
        temperature: modelSettings.value.temperature || 0.7,
        max_tokens: modelSettings.value.maxTokensEnabled ? modelSettings.value.maxTokens : undefined,
        top_p: modelSettings.value.topP || 1.0,
        frequency_penalty: modelSettings.value.frequencyPenalty || 0.0,
        presence_penalty: modelSettings.value.presencePenalty || 0.0,
        context_count: modelSettings.value.contextCount,
        streaming: modelSettings.value.streaming,
        show_prompt: modelSettings.value.showPrompt,
        use_serif_font: modelSettings.value.useSerifFont,
        auto_collapse_thinking: modelSettings.value.autoCollapseThinking,
        show_message_outline: modelSettings.value.showMessageOutline,
        message_style: modelSettings.value.messageStyle as "concise" | "detailed" | "professional",
        multi_model_style: modelSettings.value.multiModelStyle as "tag" | "list" | "card",
        conversation_nav_button: modelSettings.value.conversationNavButton as "none" | "show" | "auto",
        message_font_size: modelSettings.value.messageFontSize as "medium" | "small" | "large"
      }
    }
    
    // 发送消息请求
    
    // 使用 modelSettings.streaming 来决定是否使用流式输出
    if (modelSettings.value.streaming) {
      await handleStreamingResponse(request)
    } else {
      const response = await chatApi.sendMessage(request)
      
      // 检查响应数据结构
      if (!response.message_id) {
        throw new Error('API响应格式错误：缺少message_id')
      }
      
      const messageContent = response.message
      if (!messageContent) {
        throw new Error('API响应格式错误：缺少message字段')
      }
      
      const assistantMessage: Message = {
        id: response.message_id,
        conversation_id: currentConversationId.value!,
        role: 'assistant',
        content: messageContent,
        token_count: response.token_count || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expanded: true
      }
      
      chatStore.addMessage(assistantMessage)
    }
  } catch (error: any) {
    console.error('发送消息失败:', error)
    
    // 根据错误类型显示不同的提示
    let errorMsg = '发送消息失败，请重试'
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail
      if (detail.includes('对话不存在') || detail.includes('无权限访问')) {
        errorMsg = '对话不存在或无权限访问，请重新创建对话'
        // 清空当前对话状态
        chatStore.setCurrentConversation(null as any)
        chatStore.clearMessages()
      } else if (detail.includes('未找到可用的模型配置')) {
        errorMsg = '未找到可用的模型配置，请检查模型设置'
      } else {
        errorMsg = `发送消息失败: ${detail}`
      }
    } else if (error.message) {
      errorMsg = `发送消息失败: ${error.message}`
    }
    
    ElMessage.error(errorMsg)
    
    // 添加错误消息到聊天记录
    const errorMessage: Message = {
      id: Date.now(),
      conversation_id: currentConversationId.value || 0,
      role: 'assistant',
      content: `抱歉，${errorMsg}`,
      token_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expanded: true // 错误消息默认展开
    }
    chatStore.addMessage(errorMessage)
  } finally {
    chatStore.isLoading = false
    // 保存当前状态到localStorage
    chatStore.saveToLocalStorage()
    scrollToBottom()
    
    // 刷新对话列表以更新消息计数
    try {
      await chatStore.loadConversations()
    } catch (error) {
      console.error('刷新对话列表失败:', error)
    }
    
    // 检查是否需要生成标题（当消息数量达到3条时）
    if (chatStore.messages.length >= 3 && currentConversationId.value) {
      await generateConversationTitle()
    }
  }
}

const handleStreamingResponse = async (request: any) => {
  try {
    // 流式响应处理
    const stream = await chatApi.sendMessageStream(request)
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let assistantMessage: Message | null = null
    let messageCreated = false
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            
            if (data.type === 'content' && data.content) {
              if (!assistantMessage && !messageCreated) {
                // 创建助手消息，初始内容为空
                assistantMessage = {
                  id: Date.now(),
                  conversation_id: currentConversationId.value!,
                  role: 'assistant',
                  content: '',  // 初始内容为空
                  token_count: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  expanded: true // 默认展开
                }
                chatStore.addMessage(assistantMessage)
                messageCreated = true
                // 立即重置加载状态，因为我们已经创建了消息
                chatStore.isLoading = false
              }
              
              if (assistantMessage) {
                // 更新消息内容
                assistantMessage.content += data.content
                chatStore.updateMessage(assistantMessage.id, assistantMessage.content)
                scrollToBottom()
              }
            } else if (data.type === 'metadata' && assistantMessage) {
              assistantMessage.token_count = data.metadata?.token_count || 0
            } else if (data.type === 'error') {
              console.error('流式响应错误:', data.error)
              
              // 根据错误类型显示不同的提示
              if (data.error.includes('对话不存在') || data.error.includes('无权限访问')) {
                ElMessage.error('对话不存在或无权限访问，请重新创建对话')
                // 清空当前对话状态
                chatStore.setCurrentConversation(null as any)
                chatStore.clearMessages()
              } else {
                ElMessage.error(`流式响应错误: ${data.error}`)
              }
            } else if (data.type === 'done') {
              // 流式响应完成
            }
          } catch (e) {
            if (import.meta.env.DEV) {
              console.warn('解析流式数据失败:', e)
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('处理流式响应失败:', error)
    ElMessage.error('流式响应处理失败，请重试')
  } finally {
    // 确保在流式响应结束时重置加载状态
    chatStore.isLoading = false
    // 保存当前状态到localStorage
    chatStore.saveToLocalStorage()
    
    // 刷新对话列表以更新消息计数
    try {
      await chatStore.loadConversations()
    } catch (error) {
      console.error('刷新对话列表失败:', error)
    }
    
    // 检查是否需要生成标题（当消息数量达到3条时）
    if (chatStore.messages.length >= 3 && currentConversationId.value) {
      await generateConversationTitle()
    }
  }
}

// 移除未使用的函数

const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value
}

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const handleResize = () => {
  checkMobile()
  if (!isMobile.value) {
    sidebarVisible.value = false
  }
}

const handleModelChange = (modelId: number | null) => {
  selectedModel.value = modelId
}

const handlePromptChange = (promptId: number | null) => {
  selectedPrompt.value = promptId
  
  // 如果当前有对话，需要更新对话的提示词模板
  if (currentConversationId.value && promptId) {
    updateConversationPrompt(promptId)
  }
}

const updateConversationPrompt = async (promptId: number) => {
  try {
    if (!currentConversationId.value) {
      ElMessage.warning('请先创建对话')
      return
    }
    
    // 调用API更新对话的提示词模板
    const response = await chatApi.updateConversationPromptTemplate(
      currentConversationId.value,
      { prompt_template_id: promptId }
    )
    ElMessage.success(`提示词模板已更新为: ${response.prompt_template_name}`)
  } catch (error) {
    console.error('更新对话提示词失败:', error)
    ElMessage.error('更新提示词模板失败')
  }
}

// 移除未使用的函数

// 监听消息变化，自动滚动到底部
watch(messages, () => {
  scrollToBottom()
}, { deep: true })

// 监听默认模型变化，自动设置模型选择器
watch(defaultModel, (newDefaultModel) => {
  if (newDefaultModel) {
    selectedModel.value = newDefaultModel.id
  }
}, { immediate: true })

// 同步流式设置
watch(() => modelSettings.value.streaming, (newStreaming) => {
  chatStore.isStreaming = newStreaming
}, { immediate: true })

// 监听模型列表变化，确保默认模型能正确设置
watch(activeModels, () => {
  if (defaultModel.value && !selectedModel.value) {
    selectedModel.value = defaultModel.value.id
  }
}, { immediate: true })

// 获取用户头像URL
const getUserAvatarUrl = () => {
  if (!authStore.user?.avatar) return ''
  
  // 如果是相对路径，转换为完整的后端URL
  if (authStore.user.avatar.startsWith('/static/')) {
    return `http://127.0.0.1:8001${authStore.user.avatar}`
  }
  
  // 如果已经是完整URL，直接返回
  return authStore.user.avatar
}

// 头像加载错误处理
const handleAvatarError = (error: any) => {
  if (import.meta.env.DEV) {
    console.error('头像加载失败:', error)
  }
  // 头像加载失败时，会显示默认的用户图标
}

// 初始化
onMounted(async () => {
  // 检测移动端
  checkMobile()
  window.addEventListener('resize', handleResize)
  
  try {
    // 首先从localStorage恢复状态
    chatStore.restoreFromLocalStorage()
    
    // 加载设置
    settingsStore.loadSettings()
    
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
    }
    
    // 静默加载模型列表，失败时不显示错误
    try {
      const models = await modelApi.getActiveModels()
      modelStore.models = models
    } catch (error) {
    }
    
    // 静默设置默认模型，失败时不显示错误
    try {
      const defaultModel = await modelApi.getDefaultModel()
      modelStore.defaultModel = defaultModel
      // 设置模型选择器的默认值
      if (defaultModel && !selectedModel.value) {
        selectedModel.value = defaultModel.id
      }
    } catch (error) {
      // 如果没有默认模型，尝试从激活的模型列表中选择第一个
      if (modelStore.models && modelStore.models.length > 0) {
        const firstModel = modelStore.models[0]
        if (firstModel) {
          modelStore.defaultModel = firstModel
          if (!selectedModel.value) {
            selectedModel.value = firstModel.id
          }
        }
      } else {
      }
    }
    
    // 同步设置界面中的默认模型设置
    syncModelSettings()
    
    // 静默加载提示词列表
    try {
      const prompts = await promptApi.getActivePrompts()
      promptStore.prompts = prompts
    } catch (error) {
    }
    
    // 静默加载知识库列表
    try {
      const knowledgeBases = await knowledgeApi.getActiveKnowledgeBases()
      knowledgeStore.knowledgeBases = knowledgeBases
    } catch (error) {
    }
    
    // 加载会话历史
    isConversationsLoading.value = true
    try {
      await chatStore.loadConversations()
    } catch (error) {
      // 会话历史加载失败，使用本地缓存数据
    } finally {
      isConversationsLoading.value = false
    }
  } catch (error) {
    console.error('初始化数据失败:', error)
  } finally {
    // 页面加载完成
    isPageLoading.value = false
  }
})


// 清理事件监听器
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.chat-container {
  height: 100%;
  background: var(--el-bg-color);
  position: relative;
  padding: 15px;
  box-sizing: border-box;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: none;
}

@media (max-width: 768px) {
  .sidebar-overlay {
    display: block;
  }
}

.chat-layout {
  height: 100%;
}

.conversation-sidebar {
  background: var(--el-bg-color-page);
  border-right: 1px solid var(--el-border-color);
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 0 12px 12px 0;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.sidebar-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-tabs-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 0 12px 12px 0;
  overflow: hidden;
}

/* Tab 头部样式 */
.sidebar-tabs-container .el-tabs__header {
  margin: 0;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 12px 0 0;
  overflow: hidden;
}

.sidebar-tabs-container .el-tabs__nav-wrap {
  padding: 0 16px;
}

.sidebar-tabs-container .el-tabs__nav {
  border: none;
}

.sidebar-tabs-container .el-tabs__item {
  border: none;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  background: transparent;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
  border-radius: 8px 8px 0 0;
  margin-right: 4px;
}

.sidebar-tabs-container .el-tabs__item:hover {
  color: #374151;
  background: #f3f4f6;
  border-radius: 8px 8px 0 0;
}

.sidebar-tabs-container .el-tabs__item.is-active {
  color: #3b82f6;
  background: white;
  border-bottom-color: #3b82f6;
  font-weight: 600;
  border-radius: 8px 8px 0 0;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
}

.sidebar-tabs-container .el-tabs__content {
  flex: 1;
  overflow: hidden;
  background: white;
  border-radius: 0 0 var(--radius-xl) 0;
}

.sidebar-tabs-container .el-tab-pane {
  height: 100%;
  overflow: hidden;
}

.tab-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: white;
  border-radius: 30px;
}

.tab-header {
  margin: 12px auto;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

/* 选择区域样式 */
.selection-section {
  margin-bottom: 24px;
}

.selection-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

/* 设置区域样式 */
.settings-section {
  height: 100%;
  overflow-y: auto;
  padding: 0;
}

.setting-item {
  margin-bottom: 20px;
  padding: 0;
  background: transparent;
  border: none;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.info-icon {
  font-size: 12px;
  color: #9ca3af;
  cursor: help;
}

.setting-control {
  margin-bottom: 0;
}

.setting-group {
  margin-top: 24px;
  border-top: 1px solid #e5e7eb;
  padding-top: 20px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
}

.group-icon {
  font-size: 12px;
  transition: transform 0.3s ease;
}

.group-content {
  padding-left: 0;
}

.group-content .setting-item {
  margin-bottom: 20px;
  padding: 0;
}

/* Element Plus 组件样式覆盖 */
.sidebar-tabs-container .el-slider__runway {
  background-color: #e5e7eb;
  height: 8px;
  border-radius: 4px;
}

.sidebar-tabs-container .el-slider__bar {
  background-color: #3b82f6;
  height: 8px;
  border-radius: 4px;
}

.sidebar-tabs-container .el-slider__button {
  width: 20px;
  height: 20px;
  border: 3px solid #3b82f6;
  background-color: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  border-radius: 50%;
}

.sidebar-tabs-container .el-switch.is-checked .el-switch__core {
  background-color: #3b82f6;
  border-color: #3b82f6;
  border-radius: 20px;
}

.sidebar-tabs-container .el-switch__core {
  background-color: #d1d5db;
  border-color: #d1d5db;
  border-radius: 20px;
  height: 24px;
  width: 48px;
}

.sidebar-tabs-container .el-switch__action {
  border-radius: 50%;
  width: 20px;
  height: 20px;
}

.sidebar-tabs-container .el-select .el-input__wrapper {
  border-radius: 12px;
  border: 1px solid #d1d5db;
  box-shadow: none;
  transition: all 0.3s ease;
  padding: 8px 12px;
}

.sidebar-tabs-container .el-select .el-input__wrapper:hover {
  border-color: #9ca3af;
}

.sidebar-tabs-container .el-select .el-input__wrapper.is-focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

.sidebar-tabs-container .el-button--primary {
  background-color: #3b82f6;
  border-color: #3b82f6;
  border-radius: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
  padding: 12px 20px;
}

.sidebar-tabs-container .el-button--primary:hover {
  background-color: #2563eb;
  border-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
}

.conversation-item {
  padding: 16px;
  margin: 8px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all var(--transition-normal);
  border: 1px solid #90caf9;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.conversation-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  opacity: 0;
  transition: opacity var(--transition-normal);
  border-radius: var(--radius-xl);
}

.conversation-content {
  flex: 1;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.conversation-actions {
  margin-left: var(--space-2);
  opacity: 0;
  transition: opacity var(--transition-normal);
  position: relative;
  z-index: 1;
}

.conversation-item:hover .conversation-actions {
  opacity: 1;
}

.conversation-item:hover {
  background: #e3f2fd;
  border-color: #64b5f6;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.2);
}

.conversation-item:hover::before {
  opacity: 0.05;
}

.conversation-item.active {
  background: #e3f2fd;
  border-color: #2196f3;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.25);
  color: #1565c0;
}

.conversation-item.active::before {
  opacity: 0;
}

.conversation-title {
  font-weight: 600;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #374151;
  font-size: 14px;
}

.conversation-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
}

.chat-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: var(--radius-xl) 0 0 var(--radius-xl);
  margin: var(--space-2) var(--space-2) var(--space-2) 0;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  border-bottom: 1px solid var(--gray-200);
  background: white;
  box-shadow: var(--shadow-xs);
}

.chat-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.sidebar-toggle {
  display: none;
}

.model-selector {
  flex: 1;
  max-width: 400px;
}

.model-select {
  width: 100%;
}

.model-select .el-input__wrapper {
  border-radius: var(--radius-lg);
  border: 2px solid var(--gray-200);
  box-shadow: none;
  transition: all var(--transition-normal);
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-base);
  font-weight: 500;
}

.model-select .el-input__wrapper:hover {
  border-color: var(--gray-400);
}

.model-select .el-input__wrapper.is-focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.model-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.model-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.model-provider {
  font-size: 12px;
  color: #6b7280;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  background: var(--gray-50);
  display: flex;
  flex-direction: column;
}

.welcome-message {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.welcome-content {
  text-align: center;
  padding: var(--space-10);
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  max-width: 400px;
  border: 1px solid var(--gray-200);
}

.welcome-icon {
  font-size: 48px;
  color: var(--el-color-primary);
  margin-bottom: 16px;
}

.welcome-content h3 {
  margin: 0 0 12px 0;
  color: var(--el-text-color-primary);
  font-size: 20px;
  font-weight: 500;
}

.welcome-content p {
  margin: 0 0 24px 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.message-item {
  display: flex;
  margin: 12px 16px;
  gap: 8px;
  animation: fadeInUp 0.3s ease;
  align-items: flex-start;
}

.message-item.user {
  flex-direction: row-reverse;
  gap: 8px;
}

/* 确保用户消息和助手消息的间隔完全一致 */
.message-item.user .message-avatar,
.message-item.assistant .message-avatar {
  margin: 0;
  padding: 0;
}

.message-item.user .message-content,
.message-item.assistant .message-content {
  margin: 0;
  padding: 0;
}

.message-avatar {
  flex-shrink: 0;
  margin: 0;
  padding: 0;
}

.message-content {
  flex: 0 0 auto;
  max-width: 85%;
  min-width: 200px;
  width: fit-content;
  display: flex;
  flex-direction: column;
  margin: 0;
}

.message-item.user .message-content {
  text-align: right;
  margin: 0;
  padding: 0;
}

.message-text-wrapper {
  position: relative;
  display: inline-block;
  width: fit-content;
  max-width: 100%;
  margin: 0;
  padding: 0;
}

.message-text {
  background: #e3f2fd;
  padding: 12px 16px;
  border-radius: 18px;
  line-height: 1.6;
  word-wrap: break-word;
  width: fit-content;
  max-width: 100%;
  display: inline-block;
  min-width: 100px;
  border: 1px solid #90caf9;
  box-shadow: 0 1px 3px rgba(33, 150, 243, 0.1);
  transition: all var(--transition-normal);
  color: #1565c0;
  overflow: hidden;
  margin: 0;
}

.copy-button {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message-text-wrapper:hover .copy-button {
  opacity: 1;
}

.copy-button:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.1);
}

.copy-button .el-icon {
  font-size: 12px;
  color: #666;
}

.message-item.user .message-text {
  background: #e3f2fd;
  color: #1565c0;
  border-color: #90caf9;
  box-shadow: 0 1px 3px rgba(33, 150, 243, 0.15);
  margin: 0;
  padding: 12px 16px;
}

.message-item.assistant .message-text {
  background: #e3f2fd;
  color: #1565c0;
  border-color: #90caf9;
  box-shadow: 0 1px 3px rgba(33, 150, 243, 0.1);
  margin: 0;
  padding: 12px 16px;
}

/* 消息内容格式化样式 */
.message-text {
  /* 标题样式 */
  .message-h1 {
    font-size: 1.5em;
    font-weight: bold;
    margin: 16px 0 12px 0;
    color: #1976d2;
    border-bottom: 2px solid #e3f2fd;
    padding-bottom: 8px;
  }
  
  .message-h2 {
    font-size: 1.3em;
    font-weight: bold;
    margin: 14px 0 10px 0;
    color: #1976d2;
  }
  
  .message-h3 {
    font-size: 1.1em;
    font-weight: bold;
    margin: 12px 0 8px 0;
    color: #1976d2;
  }
  
  /* 代码块样式 */
  .code-block {
    background: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    padding: 12px;
    margin: 12px 0;
    overflow-x: auto;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
    line-height: 1.4;
    color: #333;
  }
  
  .inline-code {
    background: #f0f0f0;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
    color: #d63384;
    border: 1px solid #e0e0e0;
  }
  
  /* 列表样式 */
  .message-li {
    margin: 4px 0;
    padding-left: 20px;
    position: relative;
    list-style: none;
    line-height: 1.6;
  }
  
  .message-li:before {
    content: "•";
    color: #1976d2;
    font-weight: bold;
    position: absolute;
    left: 8px;
    top: 0;
    font-size: 14px;
  }
  
  .message-li.numbered:before {
    content: counter(list-counter) ".";
    counter-increment: list-counter;
    left: 6px;
    font-size: 14px;
  }
  
  /* 文本样式 */
  .message-strong {
    font-weight: bold;
    color: #1976d2;
  }
  
  .message-em {
    font-style: italic;
    color: #666;
  }
  
  /* 链接样式 */
  .message-link {
    color: #1976d2;
    text-decoration: underline;
    transition: color 0.2s ease;
  }
  
  .message-link:hover {
    color: #0d47a1;
  }
  
  /* 段落间距 */
  p {
    margin: 8px 0;
    line-height: 1.6;
    color: #1565c0;
  }
  
  /* 确保所有文本都有良好的对比度 */
  * {
    color: inherit;
  }
  
  /* 引用样式 */
  blockquote {
    border-left: 4px solid #1976d2;
    background: #f8f9fa;
    margin: 12px 0;
    padding: 8px 16px;
    color: #666;
    font-style: italic;
  }
  
  /* 表格样式 */
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
  }
  
  th, td {
    border: 1px solid #e0e0e0;
    padding: 8px 12px;
    text-align: left;
  }
  
  th {
    background: #f5f5f5;
    font-weight: bold;
    color: #1976d2;
  }
  
  tr:nth-child(even) {
    background: #f9f9f9;
  }
}

/* 移除展开/折叠相关样式，消息默认展开 */

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  display: flex;
  gap: 8px;
}

/* 思维链样式 */
.thinking-process {
  margin: 12px 0;
  padding: 12px;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
  border: 1px solid #d1e7ff;
  border-radius: 8px;
  border-left: 4px solid #4a90e2;
}

.thinking-header {
  font-weight: 600;
  color: #2c5aa0;
  margin-bottom: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.thinking-content {
  color: #4a5568;
  line-height: 1.6;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-word;
}

.final-answer {
  margin: 12px 0;
  padding: 12px;
  background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%);
  border: 1px solid #b8f2e6;
  border-radius: 8px;
  border-left: 4px solid #38b2ac;
}

.answer-header {
  font-weight: 600;
  color: #2d7d77;
  margin-bottom: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.answer-content {
  color: #2d3748;
  line-height: 1.6;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-item.user .message-meta {
  justify-content: flex-end;
}

.prompt-indicator {
  color: #1976d2;
  font-size: 11px;
  background: rgba(25, 118, 210, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(25, 118, 210, 0.2);
}

.prompt-preview {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.prompt-preview-title {
  font-size: 12px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 8px;
}

.prompt-preview-content {
  font-size: 11px;
  color: #6c757d;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
}

.prompt-preview-meta {
  margin-top: 8px;
  display: flex;
  gap: 12px;
  font-size: 10px;
  color: #868e96;
}

.prompt-preview-meta span {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: var(--el-bg-color-page);
  border-radius: 12px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-primary);
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.chat-input {
  padding: var(--space-4);
  border-top: 1px solid var(--gray-200);
  background: white;
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
}

.input-container {
  width: 100%;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.message-input {
  width: 100%;
}

.message-input .el-textarea__inner {
  border-radius: 20px;
  border: 1px solid #e0e0e0;
  padding: 16px 50px 16px 16px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  box-shadow: none;
  transition: all 0.3s ease;
  background-color: #ffffff !important;
  color: #606266 !important;
}

.message-input .el-textarea__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  background-color: #ffffff !important;
  color: #606266 !important;
}

.send-arrow-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #e5e7eb;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10;
}

.send-arrow-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.send-arrow-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.send-arrow-btn.has-content {
  background: #3b82f6;
  color: white;
}

.send-arrow-btn.has-content:hover:not(:disabled) {
  background: #2563eb;
  transform: scale(1.05);
}

.info-panel {
  background: var(--el-bg-color-page);
  border-left: 1px solid var(--el-border-color);
  height: 100%;
  overflow-y: auto;
}

.info-card {
  margin-bottom: 12px;
}

.conversation-info-panel .info-card {
  margin-bottom: 8px;
}

.conversation-info-panel .info-card:last-child {
  margin-bottom: 0;
}

.conversation-info,
.model-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  font-weight: 500;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.info-item span {
  color: var(--el-text-color-primary);
  font-size: 12px;
  text-align: right;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-info {
  text-align: center;
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .chat-main {
    flex: 1;
  }
  
  .message-content {
    max-width: 90%;
  }
  
  .message-text {
    max-width: none;
    width: 100%;
  }
}

@media (max-width: 768px) {
  .sidebar-toggle {
    display: block !important;
  }
  
  .conversation-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    width: 300px;
  }
  
  .conversation-sidebar.show {
    transform: translateX(0);
  }
  
  .conversation-info-panel {
    max-height: 40vh;
    padding: 12px;
  }
  
  .message-content {
    max-width: 95%;
    min-width: 150px;
  }
  
  .message-text {
    max-width: none;
    width: 100%;
  }
  
  .toolbar-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toolbar-row .el-select {
    width: 100% !important;
    margin-bottom: 8px;
  }
  
  .input-wrapper {
    position: relative;
  }
  
  .send-arrow-btn {
    bottom: 6px;
    right: 6px;
    width: 28px;
    height: 28px;
  }
}

/* 思维链样式 */
.thinking-process {
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
  border: 1px solid #d1e7ff;
  border-radius: 12px;
  margin: 12px 0;
  padding: 16px;
  position: relative;
  overflow: hidden;
}

.thinking-process::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #4f46e5, #06b6d4, #10b981);
}

.thinking-header {
  font-weight: 600;
  color: #4f46e5;
  font-size: 14px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.thinking-content {
  color: #374151;
  line-height: 1.6;
  font-size: 14px;
}

.final-answer {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  margin: 12px 0;
  padding: 16px;
  position: relative;
  overflow: hidden;
}

.final-answer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #10b981, #059669, #047857);
}

.answer-header {
  font-weight: 600;
  color: #059669;
  font-size: 14px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.answer-content {
  color: #1f2937;
  line-height: 1.6;
  font-size: 14px;
  font-weight: 500;
}

/* 思维链折叠/展开动画 */
.thinking-process.collapsed .thinking-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.thinking-process.expanded .thinking-content {
  max-height: 1000px;
  transition: max-height 0.3s ease;
}

/* 思维链响应式设计 */
@media (max-width: 768px) {
  .thinking-process,
  .final-answer {
    margin: 8px 0;
    padding: 12px;
  }
  
  .thinking-header,
  .answer-header {
    font-size: 13px;
  }
  
  .thinking-content,
  .answer-content {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .chat-container {
    height: calc(100vh - 80px);
  }
  
  .chat-header {
    padding: 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .chat-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .message-content {
    max-width: 98%;
    min-width: 120px;
  }
  
  .message-text {
    max-width: none;
    width: 100%;
    min-width: 80px;
  }
  
  .input-toolbar {
    padding: 0 8px;
  }
  
  .chat-input {
    padding: 12px;
  }
}

/* 加载效果样式 */
.page-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.loading-icon {
  font-size: 48px;
  color: var(--el-color-primary);
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.loading-text {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 500;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 会话历史加载骨架屏 */
.conversations-loading {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.loading-skeleton {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.skeleton-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-title {
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
  width: 80%;
}

.skeleton-meta {
  height: 12px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
  width: 60%;
}

@keyframes skeleton-loading {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

</style>
