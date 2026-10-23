<template>
  <u-overlay :show="show" :z-index="9999" @click="handleOverlayClick">
    <view class="update-wrapper" @tap.stop>
      <view class="update-card">
        <view class="paper-ridge"></view>
        <view class="receipt-corner"></view>

        <view class="app-icon">
          <image :src="goodImg || '/static/images/piaoyu/app-icon.png'" mode="aspectFit"></image>
        </view>

        <view class="eyebrow">薪花记账</view>
        <view class="title">{{ title }}</view>
        <view class="version-info">{{ versionText }}</view>

        <view class="update-notes">
          <view class="notes-title">更新内容</view>
          <view class="notes-content">{{ content }}</view>
        </view>

        <view v-if="!downloading" class="button-group">
          <view
            v-if="showCancel"
            class="btn btn-outline"
            @tap="onCancel"
          >
            {{ cancelText }}
          </view>
          <view
            class="btn btn-primary"
            @tap="onConfirm"
          >
            {{ confirmText }}
          </view>
        </view>

        <view v-else class="progress-section">
          <view class="progress-container">
            <view class="progress-bar-bg">
              <view class="progress-bar-fill" :style="{ width: progress + '%' }">
                <view class="progress-shimmer"></view>
              </view>
            </view>
          </view>
          <view class="status-text">
            <text class="status-message">{{ statusMessage }}</text>
            <text class="percentage">{{ progress }}%</text>
          </view>
        </view>
      </view>
    </view>
  </u-overlay>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { getSysConfigValue } from '@/api/login.js'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '发现新版本'
  },
  content: {
    type: String,
    default: '有新版本可用，请更新'
  },
  confirmText: {
    type: String,
    default: '立即更新'
  },
  cancelText: {
    type: String,
    default: '稍后更新'
  },
  showCancel: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['confirm', 'cancel', 'update:show', 'update:content', 'update:showCancel'])

// 状态管理
const downloading = ref(false)
const progress = ref(0)
const statusMessage = ref('正在下载资源包...')
const versionText = ref('')
const updateConfig = ref({
  appDownloadUrl: '',
  internalUpdate: 0,
  appVersion: '',
  updateType: 0
})
const goodImg=ref('')
// 版本检查定时器
let versionCheckTimer = null

/**
 * 检查应用更新
 */
const checkAppUpdate = async () => {
  // #ifdef APP-PLUS
  try {
    const systemInfo = uni.getSystemInfoSync()
    const osName = systemInfo.osName.toLowerCase()
    let res = await getSysConfigValue(systemInfo.appName)
    res = res ? JSON.parse(res) : {}
    console.log(res)
    if (res) {
      goodImg.value = res.goodsLogo
      // 根据平台提取对应字段
      let updateType, updateWay, appVersion, appDownloadUrl, versionDesc
      if (osName === 'ios') {
        updateType = res.iosUpdateType
        updateWay = res.iosUpdateWay
        appVersion = res.iosAppVersion
        appDownloadUrl = res.iosAppDownloadUrl
        versionDesc = res.iosVersionDesc
      } else {
        // android
        updateType = res.androidUpdateType
        updateWay = res.androidUpdateWay
        appVersion = res.androidVersion
        appDownloadUrl = res.androidAppDownloadUrl
        versionDesc = res.androidVersionDesc
      }

      // 保存配置
      updateConfig.value = {
        updateType: updateType,
        internalUpdate: updateWay,
        appVersion: appVersion,
        appDownloadUrl: appDownloadUrl
      }

      // 设置更新内容
      emit('update:content', versionDesc || '有新版本可用，请更新')

      // updateType: 0-不更新, 1-可选更新, 2-强制更新
      if (updateType == 0) {
        emit('update:show', false)
        return
      }

      // 设置版本信息文本
      versionText.value = `Version ${appVersion || '未知版本'}`

      // 设置是否可取消（强制更新时不可取消）
      emit('update:showCancel', updateType == 1)

      // 检查版本号是否匹配
      const currentVersion = plus.runtime.version
      if (currentVersion != appVersion) {
        emit('update:show', true)
        uni.hideTabBar()
      } else {
        emit('update:show', false)
      }
    }
  } catch (error) {
    console.error('检查更新失败:', error)
  }
  // #endif

  // #ifndef APP-PLUS
  console.log('update-modal: 仅在 APP 环境下生效')
  // #endif
}

/**
 * 启动版本号监听
 */
const startVersionCheck = () => {
  // #ifdef APP-PLUS
  if (!props.show || !downloading.value) {
    return
  }

  // 每3秒检查一次版本号
  versionCheckTimer = setInterval(() => {
    const currentVersion = plus.runtime.version
    if (currentVersion == updateConfig.value.appVersion) {
      // 版本号匹配，关闭弹窗
      stopVersionCheck()
      downloading.value = false
      progress.value = 0
      emit('update:show', false)
      uni.showTabBar()

      uni.showToast({
        title: '更新成功',
        icon: 'success'
      })
    }
  }, 3000)
  // #endif
}

/**
 * 停止版本号监听
 */
const stopVersionCheck = () => {
  if (versionCheckTimer) {
    clearInterval(versionCheckTimer)
    versionCheckTimer = null
  }
}

/**
 * 处理遮罩层点击（阻止关闭）
 */
const handleOverlayClick = () => {
  // 强制更新模式或正在下载时，点击遮罩不关闭
  if (updateConfig.value.updateType == 2 || downloading.value) {
    uni.showToast({
      title: '请先完成更新',
      icon: 'none'
    })
  }
}

/**
 * 处理更新确认
 */
const onConfirm = async () => {
  // #ifdef APP-PLUS
  const systemInfo = uni.getSystemInfoSync()
  const osName = systemInfo.osName.toLowerCase()

  // 外部更新（updateWay == 1）：直接跳转到浏览器下载
  if (updateConfig.value.internalUpdate == 1) {
    plus.runtime.openURL(updateConfig.value.appDownloadUrl)
    return
  }

  // iOS 内部更新（updateWay == 0）：跳转到 App Store 或下载地址
  if (osName === 'ios') {
    plus.runtime.openURL(updateConfig.value.appDownloadUrl)
    return
  }

  // Android 内部更新（updateWay == 0）：应用内下载
  downloading.value = true
  progress.value = 0
  statusMessage.value = '正在下载资源包...'

  // 启动版本号检查
  startVersionCheck()

  // 应用内下载更新
  const downloadTask = uni.downloadFile({
    url: updateConfig.value.appDownloadUrl,
    success: (downloadResult) => {
      if (downloadResult.statusCode === 200) {
        progress.value = 100
        statusMessage.value = '下载完成，正在准备安装...'

        // 安装 APK
        plus.runtime.install(
          downloadResult.tempFilePath,
          { force: false },
          () => {
            statusMessage.value = '安装完成，等待重启...'

            // 提示用户重启应用
            setTimeout(() => {
              uni.showModal({
                title: '安装完成',
                content: '新版本已安装完成，是否立即重启应用？',
                success: (res) => {
                  if (res.confirm) {
                    plus.runtime.restart()
                  }
                }
              })
            }, 500)
          },
          (error) => {
            console.error('安装失败:', error)
            downloading.value = false
            stopVersionCheck()

            uni.showToast({
              title: '安装失败',
              icon: 'none'
            })
          }
        )
      } else {
        downloading.value = false
        stopVersionCheck()

        uni.showToast({
          title: '下载失败，状态码：' + downloadResult.statusCode,
          icon: 'none'
        })
      }
    },
    fail: (error) => {
      console.error('下载失败:', error)
      downloading.value = false
      stopVersionCheck()

      uni.showToast({
        title: '下载失败',
        icon: 'none'
      })
    }
  })

  // 监听下载进度
  downloadTask.onProgressUpdate((res) => {
    progress.value = Math.floor(res.progress)

    if (res.progress >= 100) {
      statusMessage.value = '下载完成，正在准备安装...'
    }
  })

  emit('confirm')
  // #endif
}

/**
 * 处理取消
 */
const onCancel = () => {
  // 只有可选更新才能取消
  if (updateConfig.value.updateType == 1) {
    emit('update:show', false)
    uni.showTabBar()
    emit('cancel')
  }
}

// 监听 show 变化
watch(
  () => props.show,
  (newVal) => {
    // #ifdef APP-PLUS
    if (newVal) {
      // 弹窗显示时，禁止背景滚动
      const currentWebview = plus.webview.currentWebview()
      if (currentWebview) {
        uni.pageScrollTo({ scrollTop: 0, duration: 0 })
        currentWebview.setStyle({ scrollIndicator: 'none' })
        currentWebview.setStyle({ scalable: false })
        currentWebview.setStyle({ bounce: 'none' })
        currentWebview.setStyle({ pullToRefresh: { support: false } })
      }
    } else {
      // 弹窗关闭时，恢复背景滚动
      const currentWebview = plus.webview.currentWebview()
      if (currentWebview) {
        currentWebview.setStyle({ scrollIndicator: 'default' })
        currentWebview.setStyle({ scalable: true })
        currentWebview.setStyle({ bounce: 'vertical' })
        currentWebview.setStyle({ pullToRefresh: { support: true } })
      }

      // 停止版本检查
      stopVersionCheck()
    }
    // #endif
  },
  { immediate: true }
)

// 组件卸载时清理
onUnmounted(() => {
  stopVersionCheck()
})

// 暴露方法给父组件
defineExpose({
  checkAppUpdate
})
</script>

<style lang="scss" scoped>
$primary-color: #3d8bff;
$primary-hover: #2f6faf;
$primary-light: #eef6ff;
$accent-color: #ffc51f;
$text-dark: #101722;
$text-gray: #5d697b;
$line-color: #dfeaf8;
$card-bg: rgba(255, 255, 255, 0.96);

.update-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  padding: 0 30rpx;
  background:
    linear-gradient(180deg, rgba(235, 245, 255, 0.96) 0%, rgba(248, 251, 255, 0.98) 54%, #ffffff 100%);
}

.update-card {
  position: relative;
  overflow: hidden;
  background-color: $card-bg;
  width: 100%;
  max-width: 620rpx;
  border: 1rpx solid $line-color;
  border-radius: 28rpx;
  box-shadow: 0 30rpx 76rpx rgba(33, 86, 148, 0.16);
  padding: 66rpx 42rpx 42rpx;
  box-sizing: border-box;
  text-align: center;
  color: $text-dark;
}

.paper-ridge {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 18rpx;
  background:
    linear-gradient(90deg, $accent-color 0%, $accent-color 14%, transparent 14%, transparent 19%, $primary-color 19%, $primary-color 34%, transparent 34%, transparent 39%, #101722 39%, #101722 52%, transparent 52%, transparent 57%, $accent-color 57%, $accent-color 70%, transparent 70%, transparent 75%, $primary-color 75%, $primary-color 100%);
  pointer-events: none;
}

.receipt-corner {
  position: absolute;
  top: 26rpx;
  right: 30rpx;
  width: 86rpx;
  height: 58rpx;
  border-top: 2rpx solid rgba(61, 139, 255, 0.2);
  border-right: 2rpx solid rgba(61, 139, 255, 0.2);
  border-radius: 0 20rpx 0 0;
  pointer-events: none;
}

.app-icon {
  position: relative;
  z-index: 1;
  width: 136rpx;
  height: 136rpx;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(238, 246, 255, 0.9)),
    #fff;
  border: 1rpx solid rgba(61, 139, 255, 0.18);
  border-radius: 32rpx;
  margin: 0 auto 26rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 18rpx 38rpx rgba(61, 139, 255, 0.16);
}

.app-icon image {
  display: flex;
  width: 104rpx;
  height: 104rpx;
  border-radius: 26rpx;
}

.eyebrow {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42rpx;
  padding: 0 22rpx;
  border-radius: 999rpx;
  background: $primary-light;
  color: $primary-color;
  font-size: 22rpx;
  font-weight: 700;
}

.title {
  position: relative;
  z-index: 1;
  margin: 18rpx 0 12rpx;
  color: $text-dark;
  font-size: 40rpx;
  font-weight: 800;
}

.version-info {
  position: relative;
  z-index: 1;
  color: $text-gray;
  font-size: 26rpx;
  margin-bottom: 34rpx;
}

.update-notes {
  position: relative;
  z-index: 1;
  background: #f8fbff;
  border: 1rpx solid $line-color;
  border-radius: 22rpx;
  padding: 28rpx;
  text-align: left;
  margin-bottom: 36rpx;
  font-size: 26rpx;
  color: $text-gray;
  line-height: 1.7;
}

.notes-title {
  margin: 0 0 20rpx 0;
  color: $text-dark;
  font-size: 28rpx;
  font-weight: 800;
}

.notes-content {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.button-group {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 18rpx;
  margin-top: 10rpx;
}

.btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 22rpx;
  font-size: 28rpx;
  font-weight: 800;
  text-align: center;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(180deg, #5ba7ff 0%, $primary-color 100%);
  color: #ffffff;
  box-shadow: 0 16rpx 32rpx rgba(61, 139, 255, 0.24);
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-outline {
  background: rgba(255, 255, 255, 0.86);
  color: $text-gray;
  border: 1rpx solid $line-color;
}

.btn-outline:active {
  background-color: $primary-light;
  color: $text-dark;
}

.progress-section {
  position: relative;
  z-index: 1;
  animation: fadeIn 0.4s ease forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.progress-container {
  position: relative;
  margin-bottom: 24rpx;
}

.progress-bar-bg {
  background-color: #eef6ff;
  height: 18rpx;
  border-radius: 20rpx;
  overflow: hidden;
  width: 100%;
}

.progress-bar-fill {
  background: linear-gradient(90deg, $primary-color 0%, #5ba7ff 68%, $accent-color 100%);
  height: 100%;
  width: 0%;
  border-radius: 20rpx;
  transition: width 0.4s ease;
  position: relative;
}

.progress-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: shimmer 1.5s infinite linear;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.status-text {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18rpx;
  font-size: 24rpx;
  color: $text-dark;
  font-weight: 700;
}

.status-message {
  flex: 1;
  min-width: 0;
  color: $text-gray;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.percentage {
  color: $primary-color;
  font-size: 26rpx;
  font-weight: 800;
  flex-shrink: 0;
}
</style>
