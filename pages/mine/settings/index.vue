<template>
  <view class="settings-page">
    <view class="settings-head">
      <view class="head-icon">
        <up-icon name="setting" color="#3d8bff" size="26"></up-icon>
      </view>
      <view>
        <view class="head-title">设置</view>
        <view class="head-sub">账号安全与协议管理</view>
      </view>
    </view>

    <view class="menu-card">
      <view class="menu-item" v-for="item in menus" :key="item.title" @tap="item.action">
        <view class="menu-icon" :class="item.className">
          <up-icon :name="item.icon" color="#ffffff" size="20"></up-icon>
        </view>
        <view class="menu-text-wrap">
          <view class="menu-title">{{ item.title }}</view>
          <view class="menu-sub">{{ item.sub }}</view>
        </view>
        <up-icon name="arrow-right" color="#8b8f87" size="14"></up-icon>
      </view>
    </view>
  </view>
</template>

<script setup>
import { getCurrentInstance } from 'vue'

const { proxy } = getCurrentInstance()

const toTerms = (title, key) => {
  proxy.$tab.navigateTo(`/pages/mine/terms/index?title=${title}&key=${key}`)
}

const menus = [
  {
    title: '修改密码',
    sub: '保护你的账号安全',
    icon: 'lock',
    className: 'gold',
    action: () => proxy.$tab.navigateTo('/pages/mine/change-password/index')
  },
  {
    title: '隐私条款',
    sub: '查看平台隐私说明',
    icon: 'file-text',
    className: 'green',
    action: () => toTerms('隐私条款', 'XHJZ_PRIVACY_PROTOC')
  },
  {
    title: '注册协议',
    sub: '查看用户注册协议',
    icon: 'file-text',
    className: 'teal',
    action: () => toTerms('注册协议', 'XHJZ_REGISTER_PROTOC')
  },
  {
    title: '注销账号',
    sub: '注销后将无法恢复',
    icon: 'trash',
    className: 'coral',
    action: () => proxy.$tab.navigateTo('/pages/mine/cancel-account/index')
  }
]
</script>

<style lang="scss" scoped>
.settings-page {
  min-height: 100vh;
  padding: 34rpx 30rpx 80rpx;
  background:
    radial-gradient(circle at 86% 4%, rgba(248, 222, 217, 0.72), transparent 28%),
    radial-gradient(circle at 0% 42%, rgba(237, 244, 233, 0.82), transparent 30%),
    linear-gradient(180deg, #f5f9ff 0%, #f8fbff 62%, #ffffff 100%);
  color: #252922;
}

.settings-head {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 30rpx;
  border: 1rpx solid #edf2f8;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 18rpx 42rpx rgba(54, 64, 48, 0.08);
}

.head-icon {
  width: 82rpx;
  height: 82rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 26rpx;
  background: #eef6ff;
  flex-shrink: 0;
}

.head-title {
  color: #101722;
  font-size: 38rpx;
  font-weight: 800;
}

.head-sub {
  margin-top: 8rpx;
  color: #5d697b;
  font-size: 24rpx;
}

.menu-card {
  margin-top: 24rpx;
  overflow: hidden;
  border: 1rpx solid #edf2f8;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 16rpx 38rpx rgba(54, 64, 48, 0.07);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 26rpx 24rpx;
  border-bottom: 1rpx solid #edf2f8;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  width: 70rpx;
  height: 70rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22rpx;
  flex-shrink: 0;
}

.gold { background: #c59b5b; }
.green { background: #6e8b5e; }
.teal { background: #5f8a72; }
.coral { background: #e98276; }

.menu-text-wrap {
  flex: 1;
  min-width: 0;
}

.menu-title {
  color: #252922;
  font-size: 28rpx;
  font-weight: 700;
}

.menu-sub {
  margin-top: 8rpx;
  color: #5d697b;
  font-size: 22rpx;
}
</style>
