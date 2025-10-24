<template>
  <div class="image-generation-container">
    <!-- 移动端遮罩层 -->
    <div 
      v-if="isMobile && sidebarVisible" 
      class="sidebar-overlay" 
      @click="toggleSidebar"
    ></div>
    
    <el-row :gutter="16" class="image-generation-layout">
      <!-- 左侧历史记录 -->
      <el-col :xs="0" :sm="0" :md="6" :lg="6" :xl="6" class="history-sidebar" :class="{ show: sidebarVisible }">
        <div class="sidebar-content">
          <div class="sidebar-header">
            <h3>图片历史</h3>
            <el-button 
              type="primary" 
              @click="createNewSession"
              :icon="Plus"
              size="small"
            >
              新建会话
            </el-button>
          </div>
          
          <div class="image-history-list">
            <div 
              v-for="img in imageHistory" 
              :key="img.id"
              class="history-item"
              :class="{ active: selectedImageId === img.id }"
              @click="selectImage(img.id)"
            >
              <div class="history-image">
                <img :src="img.image_url" :alt="img.prompt" @error="handleImageError" />
              </div>
              <div class="history-info">
                <div class="history-prompt">{{ img.prompt.substring(0, 50) }}...</div>
                <div class="history-time">{{ formatTime(img.created_at) }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <!-- 中间主内容区 -->
      <el-col :xs="24" :sm="24" :md="18" :lg="18" :xl="18" class="main-content">
        <div class="content-header">
          <div class="header-left">
            <el-button 
              v-if="isMobile" 
              @click="toggleSidebar" 
              :icon="Menu" 
              size="small" 
              circle
            />
            <h2>图片生成</h2>
          </div>
        </div>

        <!-- 对话流区域 -->
        <div class="conversation-flow" ref="conversationFlow">
          <!-- 欢迎消息 -->
          <div v-if="messages.length === 0" class="welcome-message">
            <div class="welcome-content">
              <el-icon class="welcome-icon"><Picture /></el-icon>
              <h3>欢迎使用图片生成功能</h3>
              <p>描述你想要的图片,AI将为你生成精美的图片</p>
              <div class="example-prompts">
                <div class="example-title">示例提示词:</div>
                <el-tag 
                  v-for="(example, index) in examplePrompts" 
                  :key="index"
                  @click="useExamplePrompt(example)"
                  class="example-tag"
                >
                  {{ example }}
                </el-tag>
              </div>
            </div>
          </div>
          
          <!-- 消息列表 -->
          <div 
            v-for="message in messages" 
            :key="message.id"
            class="message-item"
            :class="message.role"
          >
            <div class="message-avatar">
              <el-avatar :size="32" v-if="message.role === 'user'">
                <el-icon><User /></el-icon>
              </el-avatar>
              <el-avatar :size="32" v-else>
                <el-icon><Picture /></el-icon>
              </el-avatar>
            </div>
            <div class="message-content">
              <div class="message-text">{{ message.content }}</div>
              
              <!-- 如果消息包含图片 -->
              <div v-if="message.image" class="message-image-container">
                <div 
                  class="message-image"
                  :class="{ selected: selectedImageForAdjustment?.id === message.image.id }"
                  @click="selectImageForAdjustment(message.image)"
                >
                  <img :src="message.image.image_url" :alt="message.image.prompt" @error="handleImageError" />
                  <div class="image-actions">
                    <el-button 
                      type="primary" 
                      size="small" 
                      @click.stop="selectImageForAdjustment(message.image)"
                    >
                      调整图片
                    </el-button>
                    <el-button 
                      size="small" 
                      @click.stop="downloadImage(message.image.image_url)"
                    >
                      下载
                    </el-button>
                  </div>
                </div>
                <div class="image-prompt">
                  <span class="prompt-label">提示词:</span>
                  <span class="prompt-text">{{ message.image.prompt }}</span>
                </div>
              </div>
              
              <div class="message-time">{{ formatTime(message.created_at) }}</div>
            </div>
          </div>
          
          <!-- 加载状态 -->
          <div v-if="isGenerating" class="message-item assistant">
            <div class="message-avatar">
              <el-avatar :size="32">
                <el-icon><Picture /></el-icon>
              </el-avatar>
            </div>
            <div class="message-content">
              <div class="generating-indicator">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>正在生成图片...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <!-- 如果选中了图片进行调整 -->
          <div v-if="selectedImageForAdjustment" class="adjustment-mode">
            <div class="adjustment-header">
              <span>调整模式: {{ selectedImageForAdjustment.prompt.substring(0, 30) }}...</span>
              <el-button 
                type="text" 
                @click="cancelAdjustment"
                :icon="Close"
              >
                取消
              </el-button>
            </div>
          </div>
          
          <div class="input-wrapper">
            <el-input
              v-model="inputPrompt"
              type="textarea"
              :rows="3"
              :placeholder="selectedImageForAdjustment ? '描述你想要调整的内容...' : '描述你想要生成的图片...'"
              @keydown.ctrl.enter="generateImage"
              :disabled="isGenerating"
              class="prompt-input"
            />
            <div class="input-controls">
              <div class="controls-left">
                <el-select v-model="imageSize" placeholder="尺寸" size="small" style="width: 120px">
                  <el-option label="1024x1024" value="1024x1024" />
                  <el-option label="1024x1792" value="1024x1792" />
                  <el-option label="1792x1024" value="1792x1024" />
                </el-select>
                <el-select v-model="imageQuality" placeholder="质量" size="small" style="width: 100px">
                  <el-option label="标准" value="standard" />
                  <el-option label="高清" value="hd" />
                </el-select>
                <el-select v-model="imageStyle" placeholder="风格" size="small" style="width: 100px">
                  <el-option label="自然" value="natural" />
                  <el-option label="生动" value="vivid" />
                </el-select>
              </div>
              <div class="controls-right">
                <button 
                  @click="generateImage"
                  :disabled="!inputPrompt.trim() || isGenerating"
                  class="generate-btn"
                  :class="{ 'has-content': inputPrompt.trim() }"
                >
                  <el-icon><ArrowUp /></el-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { imageApi, chatApi } from '../api'
import { 
  Plus, 
  User, 
  Picture,
  Menu,
  Loading,
  Close,
  ArrowUp
} from '@element-plus/icons-vue'
import type { ImageGenerationResponse } from '../types'

// 响应式数据
const inputPrompt = ref('')
const imageSize = ref('1024x1024')
const imageQuality = ref('standard')
const imageStyle = ref('natural')
const isGenerating = ref(false)
const currentConversationId = ref<number | null>(null)
const selectedImageForAdjustment = ref<ImageGenerationResponse | null>(null)
const selectedImageId = ref<number | null>(null)
const conversationFlow = ref<HTMLElement>()
const isMobile = ref(false)
const sidebarVisible = ref(false)

// 消息和图片历史
interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  image?: ImageGenerationResponse
  created_at: string
}

const messages = ref<Message[]>([])
const imageHistory = ref<ImageGenerationResponse[]>([])

// 示例提示词
const examplePrompts = [
  '一只可爱的小猫在窗台上晒太阳',
  '未来城市的夜景,霓虹灯闪烁',
  '宁静的森林湖泊,阳光穿过树叶'
]

// 方法
const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN')
}

const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value
}

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const createNewSession = async () => {
  try {
    // 创建新的对话会话
    const response = await chatApi.createConversation({
      title: '图片生成会话',
      model_config_id: 1 // 这里需要从实际的模型列表中获取
    })
    
    currentConversationId.value = response.conversation_id
    messages.value = []
    selectedImageForAdjustment.value = null
    
    ElMessage.success('新会话已创建')
  } catch (error: any) {
    console.error('创建会话失败:', error)
    ElMessage.error('创建会话失败,请重试')
  }
}

const selectImage = (imageId: number) => {
  selectedImageId.value = imageId
}

const selectImageForAdjustment = (image: ImageGenerationResponse) => {
  selectedImageForAdjustment.value = image
  inputPrompt.value = ''
}

const cancelAdjustment = () => {
  selectedImageForAdjustment.value = null
  inputPrompt.value = ''
}

const useExamplePrompt = (prompt: string) => {
  inputPrompt.value = prompt
}

const generateImage = async () => {
  if (!inputPrompt.value.trim() || isGenerating.value) return
  
  // 确保有对话会话
  if (!currentConversationId.value) {
    await createNewSession()
    if (!currentConversationId.value) return
  }
  
  const prompt = inputPrompt.value.trim()
  
  // 添加用户消息
  const userMessage: Message = {
    id: Date.now(),
    role: 'user',
    content: selectedImageForAdjustment.value 
      ? `调整图片: ${prompt}` 
      : `生成图片: ${prompt}`,
    created_at: new Date().toISOString()
  }
  messages.value.push(userMessage)
  
  // 清空输入
  inputPrompt.value = ''
  scrollToBottom()
  
  try {
    isGenerating.value = true
    
    let response: ImageGenerationResponse
    
    if (selectedImageForAdjustment.value) {
      // 调整模式
      response = await imageApi.adjustImage({
        conversation_id: currentConversationId.value,
        original_image_id: selectedImageForAdjustment.value.id,
        adjustment_prompt: prompt,
        size: imageSize.value,
        quality: imageQuality.value,
        style: imageStyle.value
      })
    } else {
      // 生成模式
      response = await imageApi.generateImage({
        conversation_id: currentConversationId.value,
        prompt: prompt,
        size: imageSize.value,
        quality: imageQuality.value,
        style: imageStyle.value,
        n: 1
      })
    }
    
    // 添加助手消息(包含图片)
    const assistantMessage: Message = {
      id: Date.now() + 1,
      role: 'assistant',
      content: selectedImageForAdjustment.value 
        ? '图片已调整完成' 
        : '图片已生成完成',
      image: response,
      created_at: new Date().toISOString()
    }
    messages.value.push(assistantMessage)
    
    // 添加到历史记录
    imageHistory.value.unshift(response)
    
    // 取消调整模式
    selectedImageForAdjustment.value = null
    
    ElMessage.success('图片生成成功')
    
  } catch (error: any) {
    console.error('图片生成失败:', error)
    const errorMsg = error.response?.data?.detail || error.message || '图片生成失败,请重试'
    ElMessage.error(errorMsg)
    
    // 添加错误消息
    const errorMessage: Message = {
      id: Date.now() + 1,
      role: 'assistant',
      content: `抱歉,${errorMsg}`,
      created_at: new Date().toISOString()
    }
    messages.value.push(errorMessage)
  } finally {
    isGenerating.value = false
    scrollToBottom()
  }
}

const downloadImage = async (imageUrl: string) => {
  try {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `generated-image-${Date.now()}.png`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('图片下载已开始')
  } catch (error) {
    console.error('下载图片失败:', error)
    ElMessage.error('下载图片失败')
  }
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = 'https://via.placeholder.com/512x512.png?text=Image+Load+Failed'
}

const scrollToBottom = () => {
  nextTick(() => {
    if (conversationFlow.value) {
      conversationFlow.value.scrollTop = conversationFlow.value.scrollHeight
    }
  })
}

const loadImageHistory = async () => {
  if (!currentConversationId.value) return
  
  try {
    const response = await imageApi.getConversationImages(currentConversationId.value)
    imageHistory.value = response.images
  } catch (error) {
    console.error('加载图片历史失败:', error)
  }
}

// 初始化
onMounted(async () => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  // 自动创建会话
  await createNewSession()
  await loadImageHistory()
})
</script>

<style scoped>
.image-generation-container {
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

.image-generation-layout {
  height: 100%;
}

.history-sidebar {
  background: var(--el-bg-color-page);
  border-right: 1px solid var(--el-border-color);
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
}

.sidebar-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.sidebar-header {
  margin-bottom: 20px;
}

.sidebar-header h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
}

.image-history-list {
  flex: 1;
  overflow-y: auto;
}

.history-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  margin-bottom: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--el-border-color);
}

.history-item:hover {
  background: var(--el-fill-color-light);
  border-color: var(--el-color-primary);
}

.history-item.active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}

.history-image {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.history-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-prompt {
  font-size: 13px;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-time {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.main-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--el-box-shadow-light);
}

.content-header {
  padding: 20px;
  border-bottom: 1px solid var(--el-border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.conversation-flow {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: var(--el-bg-color);
}

.welcome-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}

.welcome-content {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: var(--el-box-shadow);
  max-width: 500px;
}

.welcome-icon {
  font-size: 64px;
  color: var(--el-color-primary);
  margin-bottom: 20px;
}

.welcome-content h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
}

.welcome-content p {
  margin: 0 0 24px 0;
  color: var(--el-text-color-secondary);
}

.example-prompts {
  margin-top: 20px;
}

.example-title {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 12px;
  color: var(--el-text-color-regular);
}

.example-tag {
  margin: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.example-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message-item {
  display: flex;
  margin-bottom: 20px;
  gap: 12px;
  animation: fadeInUp 0.3s ease;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  max-width: 80%;
}

.message-text {
  background: var(--el-fill-color-light);
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 8px;
  display: inline-block;
}

.message-item.user .message-text {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.message-image-container {
  margin-top: 12px;
}

.message-image {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 3px solid transparent;
}

.message-image:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.message-image.selected {
  border-color: var(--el-color-primary);
}

.message-image img {
  width: 100%;
  max-width: 512px;
  display: block;
  border-radius: 8px;
}

.image-actions {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.message-image:hover .image-actions {
  opacity: 1;
}

.image-prompt {
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  font-size: 12px;
}

.prompt-label {
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.prompt-text {
  color: var(--el-text-color-regular);
}

.message-time {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.generating-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 12px;
}

.input-area {
  padding: 20px;
  border-top: 1px solid var(--el-border-color);
  background: white;
}

.adjustment-mode {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
  border: 1px solid var(--el-color-primary);
}

.adjustment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--el-color-primary);
}

.input-wrapper {
  width: 100%;
}

.prompt-input {
  margin-bottom: 12px;
}

.input-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.controls-left {
  display: flex;
  gap: 8px;
}

.generate-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.generate-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.generate-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.generate-btn.has-content {
  background: var(--el-color-primary);
  color: white;
}

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

@media (max-width: 768px) {
  .history-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    width: 300px;
  }
  
  .history-sidebar.show {
    transform: translateX(0);
  }
  
  .message-content {
    max-width: 95%;
  }
}
</style>

