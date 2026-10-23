<template>
  <view class="cancel-page">
    <view class="warning-card">
      <view class="warning-mark">!</view>
      <view class="title">注销账号</view>
      <view class="desc">提交后账号将无法继续登录，个人资料与本地缓存会清空。请确认已经备份需要保留的凭证信息。</view>
    </view>

    <view class="notice-card">
      <view class="notice-title">注销前请确认</view>
      <view class="notice-row" v-for="item in notices" :key="item">
        <view class="dot"></view>
        <text>{{ item }}</text>
      </view>
    </view>

    <view class="agree-row" @tap="agreed = !agreed">
      <view class="checkbox" :class="{ checked: agreed }">
        <text v-if="agreed">✓</text>
      </view>
      <text>我已了解注销后的影响，并确认继续</text>
    </view>

    <button class="submit-btn" :class="{ disabled: !agreed }" @tap="confirmCancel">确认注销账号</button>
  </view>
</template>

<script setup>
import { getCurrentInstance, ref } from 'vue'
import { useUserStore } from '@/store'
import util from '@/utils/utils'

const { proxy } = getCurrentInstance()
const userStore = useUserStore()
const agreed = ref(false)
const notices = [
  '注销后当前账号将不能继续使用',
  '账号资料会被清空，操作完成后不可恢复',
  '如仍需保留凭证，请先自行确认数据完整'
]

const confirmCancel = util.debounce(() => {
  if (!agreed.value) {
    proxy.$modal.msg('请先勾选确认')
    return
  }
  uni.showModal({
    title: '确认注销账号',
    content: '注销后将无法恢复，是否继续？',
    confirmColor: '#e98276',
    success: (res) => {
      if (!res.confirm) return
      proxy.$modal.loading('处理中...')
      userStore.zxAction().then(() => {
        proxy.$modal.closeLoading()
        proxy.$tab.reLaunch('/pages/login')
      }).catch(() => {
        proxy.$modal.closeLoading()
      })
    }
  })
}, 600)
</script>

<style lang="scss" scoped>
.cancel-page {
  min-height: 100vh;
  padding: 34rpx 30rpx 80rpx;
  background:
    radial-gradient(circle at 86% 4%, rgba(248, 222, 217, 0.72), transparent 28%),
    linear-gradient(180deg, #f5f9ff 0%, #f8fbff 62%, #ffffff 100%);
  color: #252922;
}

.warning-card,
.notice-card {
  border: 1rpx solid #edf2f8;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 18rpx 42rpx rgba(54, 64, 48, 0.08);
}

.warning-card {
  padding: 44rpx 34rpx 38rpx;
  text-align: center;
}

.warning-mark {
  width: 88rpx;
  height: 88rpx;
  margin: 0 auto 22rpx;
  border-radius: 50%;
  background: #f8ded9;
  color: #d95f52;
  font-size: 50rpx;
  line-height: 88rpx;
  font-weight: 800;
}

.title {
  color: #101722;
  font-size: 40rpx;
  font-weight: 800;
}

.desc {
  margin-top: 18rpx;
  color: #5d697b;
  font-size: 26rpx;
  line-height: 1.75;
}

.notice-card {
  margin-top: 24rpx;
  padding: 30rpx;
}

.notice-title {
  margin-bottom: 20rpx;
  color: #101722;
  font-size: 30rpx;
  font-weight: 800;
}

.notice-row {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  margin-top: 16rpx;
  color: #565b54;
  font-size: 26rpx;
  line-height: 1.6;
}

.dot {
  width: 10rpx;
  height: 10rpx;
  margin-top: 16rpx;
  border-radius: 50%;
  background: #e98276;
  flex-shrink: 0;
}

.agree-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-top: 28rpx;
  color: #565b54;
  font-size: 24rpx;
}

.checkbox {
  width: 34rpx;
  height: 34rpx;
  border: 2rpx solid #d8d2c8;
  border-radius: 10rpx;
  background: #fff;
  color: #fff;
  text-align: center;
  line-height: 34rpx;
  font-size: 22rpx;
  font-weight: 800;
  flex-shrink: 0;
}

.checkbox.checked {
  border-color: #e98276;
  background: #e98276;
}

.submit-btn {
  height: 94rpx;
  margin-top: 34rpx;
  border-radius: 999rpx;
  background: linear-gradient(180deg, #e98276 0%, #d95f52 100%);
  color: #fff;
  line-height: 94rpx;
  font-size: 30rpx;
  font-weight: 800;
  box-shadow: 0 18rpx 36rpx rgba(217, 95, 82, 0.22);
}

.submit-btn::after {
  border: none;
}

.submit-btn.disabled {
  background: #d8d2c8;
  box-shadow: none;
}
</style>
