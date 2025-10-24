<template>
  <div class="profile-container">
    <div class="profile-header">
      <h1 class="profile-title">个人资料</h1>
      <p class="profile-subtitle">管理您的个人信息和账户设置</p>
    </div>

    <div class="profile-content">
      <!-- 基本信息卡片 -->
      <el-card class="profile-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon class="header-icon"><User /></el-icon>
            <span>基本信息</span>
          </div>
        </template>

        <el-form
          ref="profileFormRef"
          :model="profileForm"
          :rules="profileRules"
          label-width="100px"
          class="profile-form"
        >
          <!-- 头像上传 -->
          <el-form-item label="头像" class="avatar-section">
            <div class="avatar-upload">
              <div class="avatar-container">
                <el-avatar
                  v-if="avatarDisplayUrl"
                  :key="`avatar-${avatarKey}`"
                  :size="120"
                  :src="avatarDisplayUrl"
                  class="avatar-preview"
                  @error="handleAvatarError"
                >
                  {{ profileForm.username?.charAt(0).toUpperCase() }}
                </el-avatar>
                <el-avatar
                  v-else
                  :size="120"
                  class="avatar-preview"
                >
                  {{ profileForm.username?.charAt(0).toUpperCase() }}
                </el-avatar>
              </div>
              <!-- 临时调试信息 -->
              <div v-if="profileForm.avatar" style="font-size: 12px; color: #666; margin-top: 5px; word-break: break-all; max-width: 300px;">
                URL: {{ avatarDisplayUrl }}
              </div>
              <div class="avatar-actions">
                <el-upload
                  ref="avatarUploadRef"
                  :http-request="customUpload"
                  :show-file-list="false"
                  :before-upload="beforeAvatarUpload"
                  accept="image/*"
                  class="avatar-uploader"
                >
                  <el-button type="primary" :icon="Upload" size="small">
                    更换头像
                  </el-button>
                </el-upload>
                <el-button 
                  type="danger" 
                  :icon="Delete" 
                  size="small"
                  @click="removeAvatar"
                  v-if="profileForm.avatar"
                >
                  删除头像
                </el-button>
              </div>
            </div>
          </el-form-item>

          <!-- 用户名 -->
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="profileForm.username"
              placeholder="请输入用户名"
              :disabled="isUpdating"
            />
          </el-form-item>

          <!-- 邮箱 -->
          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model="profileForm.email"
              type="email"
              placeholder="请输入邮箱地址"
              :disabled="isUpdating"
            />
          </el-form-item>

          <!-- 昵称 -->
          <el-form-item label="昵称" prop="nickname">
            <el-input
              v-model="profileForm.nickname"
              placeholder="请输入昵称"
              :disabled="isUpdating"
            />
          </el-form-item>

          <!-- 操作按钮 -->
          <el-form-item class="form-actions">
            <el-button
              type="primary"
              :loading="isUpdating"
              @click="updateProfile"
              :disabled="!isFormChanged"
            >
              保存更改
            </el-button>
            <el-button @click="resetForm" :disabled="isUpdating">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 密码修改卡片 -->
      <el-card class="profile-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon class="header-icon"><Lock /></el-icon>
            <span>密码安全</span>
          </div>
        </template>

        <el-form
          ref="passwordFormRef"
          :model="passwordForm"
          :rules="passwordRules"
          label-width="100px"
          class="password-form"
        >
          <!-- 当前密码 -->
          <el-form-item label="当前密码" prop="currentPassword">
            <el-input
              v-model="passwordForm.currentPassword"
              type="password"
              placeholder="请输入当前密码"
              show-password
              :disabled="isChangingPassword"
            />
          </el-form-item>

          <!-- 新密码 -->
          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="请输入新密码"
              show-password
              :disabled="isChangingPassword"
            />
          </el-form-item>

          <!-- 确认密码 -->
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="passwordForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              show-password
              :disabled="isChangingPassword"
            />
          </el-form-item>

          <!-- 操作按钮 -->
          <el-form-item class="form-actions">
            <el-button
              type="primary"
              :loading="isChangingPassword"
              @click="changePassword"
            >
              修改密码
            </el-button>
            <el-button @click="resetPasswordForm" :disabled="isChangingPassword">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 账户信息卡片 -->
      <el-card class="profile-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon class="header-icon"><InfoFilled /></el-icon>
            <span>账户信息</span>
          </div>
        </template>

        <div class="account-info">
          <div class="info-item">
            <span class="info-label">用户ID:</span>
            <span class="info-value">{{ authStore.user?.id }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">注册时间:</span>
            <span class="info-value">{{ formatDate(authStore.user?.created_at) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">最后登录:</span>
            <span class="info-value">{{ formatDate(authStore.user?.last_login) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">账户状态:</span>
            <el-tag :type="authStore.user?.is_active ? 'success' : 'danger'">
              {{ authStore.user?.is_active ? '正常' : '已禁用' }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="info-label">权限级别:</span>
            <el-tag :type="authStore.user?.is_admin ? 'warning' : 'info'">
              {{ authStore.user?.is_admin ? '管理员' : '普通用户' }}
            </el-tag>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type UploadProps } from 'element-plus'
import { User, Lock, InfoFilled, Upload, Delete } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores'
import { profileApi } from '../api'
import type { UserInfo } from '../types'

const authStore = useAuthStore()

// 表单引用
const profileFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()
const avatarUploadRef = ref()

// 加载状态
const isUpdating = ref(false)
const isChangingPassword = ref(false)

// 头像组件key，用于强制重新渲染
const avatarKey = ref(0)


// 个人资料表单
const profileForm = reactive({
  username: '',
  email: '',
  nickname: '',
  avatar: ''
})

// 密码修改表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 原始数据（用于比较是否有变化）
const originalProfile = ref<UserInfo | null>(null)

// 表单验证规则
const profileRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  nickname: [
    { max: 50, message: '昵称长度不能超过 50 个字符', trigger: 'blur' }
  ]
}

const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度在 6 到 50 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: Function) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 计算属性：表单是否有变化
const isFormChanged = computed(() => {
  if (!originalProfile.value) return false
  return (
    profileForm.username !== originalProfile.value.username ||
    profileForm.email !== originalProfile.value.email ||
    profileForm.nickname !== originalProfile.value.nickname ||
    profileForm.avatar !== originalProfile.value.avatar
  )
})

// 计算属性：头像显示URL
const avatarDisplayUrl = computed(() => {
  if (!profileForm.avatar) return ''
  
  // 如果是相对路径，转换为完整的后端URL
  if (profileForm.avatar.startsWith('/static/')) {
    const fullUrl = `http://127.0.0.1:8001${profileForm.avatar}`
    return fullUrl
  }
  
  // 如果已经是完整URL，直接返回
  return profileForm.avatar
})

// 初始化表单数据
const initForm = () => {
  if (authStore.user) {
    profileForm.username = authStore.user.username
    profileForm.email = authStore.user.email
    profileForm.nickname = authStore.user.nickname || ''
    
    // 处理头像URL，确保是完整的URL
    if (authStore.user.avatar) {
      if (authStore.user.avatar.startsWith('http')) {
        profileForm.avatar = authStore.user.avatar
      } else {
        profileForm.avatar = `http://127.0.0.1:8001${authStore.user.avatar}`
      }
    } else {
      profileForm.avatar = ''
    }
    
    // 保存原始数据
    originalProfile.value = { ...authStore.user }
  }
}

// 更新个人资料
const updateProfile = async () => {
  if (!profileFormRef.value) return
  
  try {
    await profileFormRef.value.validate()
    isUpdating.value = true
    
    const updateData = {
      username: profileForm.username,
      email: profileForm.email,
      nickname: profileForm.nickname,
      avatar: profileForm.avatar
    }
    
    const response = await profileApi.updateProfile(updateData)
    
    // 更新本地用户信息
    if (authStore.user) {
      Object.assign(authStore.user, response)
      localStorage.setItem('user_info', JSON.stringify(authStore.user))
    }
    
    ElMessage.success('个人资料更新成功')
    originalProfile.value = { ...authStore.user! }
  } catch (error: any) {
    console.error('更新个人资料失败:', error)
    ElMessage.error(error.response?.data?.detail || '更新失败，请重试')
  } finally {
    isUpdating.value = false
  }
}

// 修改密码
const changePassword = async () => {
  if (!passwordFormRef.value) return
  
  try {
    await passwordFormRef.value.validate()
    
    await ElMessageBox.confirm(
      '确定要修改密码吗？',
      '确认修改',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    isChangingPassword.value = true
    
    await profileApi.changePassword({
      current_password: passwordForm.currentPassword,
      new_password: passwordForm.newPassword
    })
    
    ElMessage.success('密码修改成功')
    resetPasswordForm()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('修改密码失败:', error)
      ElMessage.error(error.response?.data?.detail || '修改失败，请重试')
    }
  } finally {
    isChangingPassword.value = false
  }
}

// 重置表单
const resetForm = () => {
  if (originalProfile.value) {
    profileForm.username = originalProfile.value.username
    profileForm.email = originalProfile.value.email
    profileForm.nickname = originalProfile.value.nickname || ''
    profileForm.avatar = originalProfile.value.avatar || ''
  }
}

const resetPasswordForm = () => {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordFormRef.value?.clearValidate()
}

// 自定义上传方法
const customUpload = async (options: any) => {
  try {
    const response = await profileApi.uploadAvatar(options.file)
    
    if (response.success) {
      // 更新头像URL
      profileForm.avatar = response.avatar_url
      
      // 同时更新store中的用户信息
      if (authStore.user) {
        authStore.user.avatar = response.avatar_url
        localStorage.setItem('user_info', JSON.stringify(authStore.user))
      }
      
      // 强制触发Vue的响应式更新
      await nextTick()
      
      // 强制刷新头像显示
      setTimeout(() => {
        refreshAvatar()
      }, 100)
      
      ElMessage.success('头像上传成功')
    } else {
      ElMessage.error(response.message || '头像上传失败')
    }
  } catch (error: any) {
    console.error('头像上传失败:', error)
    ElMessage.error('头像上传失败，请重试')
  }
}

// 头像上传前验证
const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const isImage = rawFile.type.startsWith('image/')
  const isLt5M = rawFile.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}


// 头像加载错误处理
const handleAvatarError = (error: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('头像加载失败:', error)
  }
  ElMessage.error('头像加载失败，请检查网络连接或联系管理员')
}

// 强制刷新头像
const refreshAvatar = () => {
  // 通过更新key值强制重新渲染头像组件
  avatarKey.value++
}

// 删除头像
const removeAvatar = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除头像吗？',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    profileForm.avatar = ''
    ElMessage.success('头像已删除')
  } catch (error) {
    // 用户取消操作
  }
}

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '未知'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 组件挂载时初始化
onMounted(() => {
  initForm()
})
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 15px;
  box-sizing: border-box;
  height: 100%;
  overflow: auto;
}

.profile-header {
  text-align: center;
  margin-bottom: 30px;
}

.profile-title {
  font-size: 2rem;
  font-weight: bold;
  color: var(--el-text-color-primary);
  margin: 0 0 10px 0;
}

.profile-subtitle {
  color: var(--el-text-color-secondary);
  margin: 0;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-icon {
  color: var(--el-color-primary);
}

.profile-form,
.password-form {
  max-width: 500px;
}

.avatar-section {
  margin-bottom: 20px;
}

.avatar-upload {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-preview {
  border: 3px solid var(--el-border-color);
  transition: border-color 0.3s ease;
}

.avatar-preview:hover {
  border-color: var(--el-color-primary);
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.avatar-uploader {
  display: inline-block;
}

.form-actions {
  margin-top: 30px;
  margin-bottom: 0;
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.info-value {
  color: var(--el-text-color-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-container {
    padding: 15px;
  }
  
  .profile-title {
    font-size: 1.5rem;
  }
  
  .avatar-upload {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .avatar-actions {
    flex-direction: row;
    gap: 10px;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}

@media (max-width: 480px) {
  .profile-container {
    padding: 10px;
  }
  
  .profile-form,
  .password-form {
    max-width: 100%;
  }
  
  .form-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .form-actions .el-button {
    width: 100%;
  }
}

/* 头像容器样式 */
.avatar-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 头像调试信息样式 */
.avatar-debug {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
  word-break: break-all;
  max-width: 300px;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
}
</style>
