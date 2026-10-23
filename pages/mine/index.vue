<template>
  <view class="mine-page" :style="{ minHeight: `${windowHeight}px` }">
    <view class="page-head" :style="{ paddingTop: `${statusBarHeight + 18}px` }">
      <view class="page-title">我的</view>
      <view class="page-kicker">私密凭证、头像和安全设置</view>
    </view>

    <view class="profile-card">
      <image class="flower" src="/static/images/piaoyu/receipt-stack.png" mode="aspectFit" />
      <view class="avatar-shell">
        <img-box :img-url="userInfo.pic" :need-delete-btn="false" type="user" @get-image-path="onGetImgPath" />
      </view>
      <view class="profile-info">
        <view class="name-row" @tap="openEditNick">
          <text>{{ nickName }}</text>
          <up-icon name="edit-pen" color="#3d8bff" size="15"></up-icon>
        </view>
        <view class="sub">{{ userInfo.userMobile || '欢迎使用薪花记账' }}</view>
      </view>
      <view class="settings-btn" @tap="onToSettings">
        <up-icon name="setting" color="#3d8bff" size="19"></up-icon>
        <text>设置</text>
      </view>
    </view>

    <view class="stats-grid">
      <view class="stat">
        <view>{{ totalDays }}</view>
        <text>记录天数</text>
      </view>
      <view class="stat">
        <view>{{ totalRecords }}</view>
        <text>凭证记录</text>
      </view>
      <view class="stat">
        <view>{{ voucherCount }}</view>
        <text>图片凭证</text>
      </view>
    </view>

    <view class="section-h">
      <text>本月凭证概览</text>
      <text class="section-link">{{ month }}</text>
    </view>

    <view class="data-card">
      <view class="data-row">
        <view class="data-icon green">待</view>
        <view class="data-body">
          <view class="data-title">待处理</view>
          <view class="data-desc">{{ monthProofStats.pending }} 项需要继续整理</view>
        </view>
      </view>
      <view class="data-row">
        <view class="data-icon coral">期</view>
        <view class="data-body">
          <view class="data-title">快到期</view>
          <view class="data-desc">{{ monthProofStats.expiring }} 项需要留意</view>
        </view>
      </view>
      <view class="data-row">
        <view class="data-icon gold">档</view>
        <view class="data-body">
          <view class="data-title">已归档</view>
          <view class="data-desc">{{ monthProofStats.archived }} 张凭证已收好</view>
        </view>
      </view>
    </view>

    <view class="logout-btn" @tap="logOutShow = true">退出登录</view>

    <view class="warm-tip">
      <view class="warm-tip-mark">我</view>
      <text>{{ mineFooterTip }}</text>
    </view>

    <up-modal :show="logOutShow" title="是否退出登录" content="退出登录后将需要重新登录，是否继续？" :showCancelButton="true" @confirm="loginoutConfirm" @cancel="logOutShow = false"></up-modal>

    <up-popup :show="nickShow" mode="center" round="28rpx" :closeOnClickOverlay="false" @close="closeNick">
      <view class="nick-popup">
        <view class="nick-popup-title">修改昵称</view>
      <view class="nick-popup-sub">给你的凭证岛起一个私密署名</view>
        <view class="nick-popup-input">
          <input class="nick-input" type="text" v-model="nickInput" :maxlength="20" placeholder="请输入昵称" placeholder-class="nick-input-ph" />
          <text class="nick-input-counter">{{ nickInput.length }}/20</text>
        </view>
        <view class="nick-popup-footer">
          <view class="nick-btn cancel" @tap="closeNick">取消</view>
          <view class="nick-btn confirm" @tap="confirmNick">保存</view>
        </view>
      </view>
    </up-popup>
  </view>
</template>

<script setup>
import { computed, getCurrentInstance, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store'
import imgBox from '@/pages/common/img-box/img-box.vue'
import { set_user_info } from '@/api/uploadimg.js'
import util from '@/utils/utils.js'
import { getProofStats, normalizeBillList } from '@/utils/proofArchive'
import { getPageFooterTip } from '@/utils/reminderTips'

const { proxy } = getCurrentInstance()
const userStore = useUserStore()
const windowHeight = ref(uni.getSystemInfoSync().windowHeight)
const statusBarHeight = ref(uni.getSystemInfoSync().statusBarHeight || 20)
const logOutShow = ref(false)
const nickShow = ref(false)
const nickInput = ref('')
const month = ref(util.getMonthDate())
const reminderSeed = ref(Date.now())

const userInfo = computed(() => userStore.user_info || {})
const nickName = computed(() => userInfo.value.nickName || userInfo.value.userMobile || '薪花记账用户')
const billList = computed(() => normalizeBillList(userStore.mockBillData))
const monthProofStats = computed(() => getProofStats(billList.value, month.value))
const totalRecords = computed(() => billList.value.length)
const voucherCount = computed(() => billList.value.filter(item => item.imgUrl || item.attachments.length).length)
const totalDays = computed(() => {
  const set = new Set(billList.value.map(item => String(item.date || '').slice(0, 10)))
  return set.size
})
const mineFooterTip = computed(() => getPageFooterTip({
  page: 'mine',
  bills: billList.value,
  datePrefix: month.value,
  seed: reminderSeed.value
}))

const onToSettings = () => proxy.$tab.navigateTo('/pages/mine/settings/index')

const loginoutConfirm = () => {
  logOutShow.value = false
  userStore.logOut().then(() => proxy.$tab.reLaunch('/pages/login'))
}

const onGetImgPath = (url) => {
  if (!url) return
  onUpdateUserInfo({ pic: url })
}

const onUpdateUserInfo = (userData) => {
  userData.birthDate = userInfo.value.birthDate || ''
  userData.sex = userInfo.value.sex
  set_user_info(userData).then(() => {
    proxy.$modal.msg('更新成功')
    userStore.getInfo()
  })
}

const openEditNick = () => {
  nickInput.value = userInfo.value.nickName || ''
  nickShow.value = true
}

const closeNick = () => {
  nickShow.value = false
}

const confirmNick = () => {
  const val = (nickInput.value || '').trim()
  if (!val) {
    proxy.$modal.msg('昵称不能为空')
    return
  }
  set_user_info({ nickName: val, birthDate: userInfo.value.birthDate || '', sex: userInfo.value.sex }).then(() => {
    proxy.$modal.msg('修改成功')
    nickShow.value = false
    userStore.getInfo()
  })
}

onShow(async () => {
  month.value = util.getMonthDate()
  reminderSeed.value = Date.now()
  await userStore.getInfo()
  await userStore.loadBillData()
})
</script>

<style lang="scss" scoped>
.mine-page {
  position: relative;
  padding: 0 30rpx 150rpx;
  background:
    linear-gradient(180deg, rgba(235, 245, 255, 0.94) 0%, rgba(248, 251, 255, 0.98) 56%, #ffffff 100%);
  color: #101722;
}

.page-title {
  color: #101722;
  font-size: 52rpx;
  font-weight: 900;
}

.page-kicker {
  margin-top: 10rpx;
  color: #5d697b;
  font-size: 24rpx;
}

.profile-card {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 22rpx;
  margin-top: 32rpx;
  padding: 28rpx;
  border: 1rpx solid #edf2f8;
  border-radius: 34rpx;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 24rpx 58rpx rgba(53, 86, 128, 0.12);
}

.flower {
  position: absolute;
  right: -92rpx;
  top: -24rpx;
  width: 260rpx;
  height: 260rpx;
  opacity: 0.18;
  pointer-events: none;
  mix-blend-mode: multiply;
}

.avatar-shell {
  width: 126rpx;
  height: 126rpx;
  overflow: hidden;
  border: 4rpx solid rgba(61, 139, 255, 0.16);
  border-radius: 50%;
  background: #fff;
  flex-shrink: 0;
}

.profile-info {
  position: relative;
  z-index: 1;
  min-width: 0;
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  color: #101722;
  font-size: 38rpx;
  font-weight: 700;
}

.name-row text {
  max-width: 300rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub {
  margin-top: 10rpx;
  color: #5d697b;
  font-size: 24rpx;
}

.stats-grid {
  display: grid;
  gap: 16rpx;
}

.stats-grid {
  grid-template-columns: repeat(3, 1fr);
  margin-top: 22rpx;
}

.stat {
  padding: 24rpx 12rpx;
  border: 1rpx solid #edf2f8;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.78);
  text-align: center;
}

.stat view {
  color: #101722;
  font-size: 34rpx;
  font-weight: 700;
}

.stat text {
  display: block;
  margin-top: 8rpx;
  color: #5d697b;
  font-size: 22rpx;
}

.section-h {
  margin: 30rpx 4rpx 16rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #101722;
  font-size: 30rpx;
  font-weight: 700;
}

.section-link {
  color: #5d697b;
  font-size: 22rpx;
  font-weight: 500;
}

.settings-btn {
  position: relative;
  z-index: 1;
  width: 112rpx;
  height: 76rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  margin-left: auto;
  border: 1rpx solid #dfeaf8;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.78);
  color: #3d8bff;
  font-size: 22rpx;
  font-weight: 700;
  box-shadow: 0 12rpx 26rpx rgba(54, 64, 48, 0.08);
  flex-shrink: 0;
}

.data-card {
  border: 1rpx solid #edf2f8;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 16rpx 38rpx rgba(54, 64, 48, 0.07);
  overflow: hidden;
}

.data-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 24rpx;
  border-bottom: 1rpx solid #edf2f8;
}

.data-row:last-child {
  border-bottom: none;
}

.data-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.data-icon {
  width: 70rpx;
  height: 70rpx;
  border-radius: 22rpx;
  color: #fff;
  font-size: 24rpx;
  flex-shrink: 0;
}

.green { background: #3d8bff; }
.coral { background: #e98276; }
.gold { background: #c59b5b; }

.data-body {
  flex: 1;
  min-width: 0;
}

.data-title {
  color: #252922;
  font-size: 28rpx;
  font-weight: 700;
}

.data-desc {
  margin-top: 8rpx;
  color: #5d697b;
  font-size: 22rpx;
}

.logout-btn {
  height: 92rpx;
  margin-top: 24rpx;
  line-height: 92rpx;
  border: 1rpx solid #edf2f8;
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.84);
  color: #e98276;
  text-align: center;
  font-size: 28rpx;
  font-weight: 700;
  box-shadow: 0 16rpx 34rpx rgba(54, 64, 48, 0.07);
}

.warm-tip {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-top: 22rpx;
  padding: 18rpx 22rpx;
  border: 1rpx solid rgba(238, 231, 220, 0.92);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.66);
  color: #6f756d;
  font-size: 24rpx;
  line-height: 1.5;
}

.warm-tip-mark {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 15rpx;
  background: #eef6ff;
  color: #2f6faf;
  font-size: 20rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.nick-popup {
  width: 620rpx;
  padding: 38rpx 32rpx 30rpx;
}

.nick-popup-title {
  color: #101722;
  text-align: center;
  font-size: 34rpx;
  font-weight: 800;
}

.nick-popup-sub {
  display: block;
  margin-top: 8rpx;
  color: #5d697b;
  text-align: center;
  font-size: 22rpx;
}

.nick-popup-input {
  margin-top: 28rpx;
  padding: 0 20rpx;
  border: 1rpx solid #edf2f8;
  border-radius: 20rpx;
  background: #faf7f1;
}

.nick-input {
  height: 88rpx;
  line-height: 88rpx;
  color: #252922;
  font-size: 28rpx;
}

.nick-input-counter {
  display: block;
  padding-bottom: 16rpx;
  color: #8b8f87;
  text-align: right;
  font-size: 20rpx;
}

.nick-popup-footer {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18rpx;
  margin-top: 28rpx;
}

.nick-btn {
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 999rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: 700;
}

.nick-btn.cancel {
  background: #f3f0ea;
  color: #5d697b;
}

.nick-btn.confirm {
  background: linear-gradient(180deg, #5ba7ff 0%, #3d8bff 55%, #2f6faf 100%);
  color: #fff;
}
</style>
