<template>
  <view class="proof-page" :style="{ minHeight: `${windowHeight}px` }">
    <view class="page-head" :style="{ paddingTop: `${statusBarHeight + 18}px` }">
      <view>
        <view class="page-title">凭证</view>
        <view class="page-kicker">归档、待办、到期和相册都在这里</view>
      </view>
      <view class="head-actions">
        <view class="stats-entry" @tap="openStatsPanel">统计</view>
      </view>
    </view>

    <view class="summary-card">
      <image src="/static/images/piaoyu/receipt-stack.png" mode="aspectFit" />
      <text>今年凭证库</text>
      <view>{{ yearProofStats.total }}</view>
      <text>已归档 {{ yearProofStats.archived }} · 待处理 {{ yearProofStats.pending }} · 快到期 {{ yearProofStats.expiring }}</text>
    </view>
    <view class="weekly-tip">{{ weeklySummaryText }}</view>

    <view class="urgent-banner" v-if="openReminderRows.length" @tap="scrollToReminder">
      <view>!</view>
      <text>有 {{ openReminderRows.length }} 项未完成提醒，进入处理中心继续办理</text>
    </view>

    <view class="section">
      <view class="section-head">
        <view class="section-title">待办队列</view>
        <view class="section-link" @tap="switchTab('/pages/index')">新增</view>
      </view>
      <view class="todo-list" v-if="actionRows.length">
        <view class="todo-row" v-for="item in actionRows" :key="item.id" @tap="openProofPanel(item)">
          <view class="todo-mark" :style="{ background: item.color }">{{ item.icon }}</view>
          <view class="todo-body">
            <view>{{ item.note || item.proofTypeName }}</view>
            <text>{{ item.proofStatusName }}<text v-if="item.dueDate"> · {{ item.dueDate }} 到期</text></text>
          </view>
          <view class="todo-actions">
            <view class="process" @tap.stop="openProofPanel(item)">去处理</view>
          </view>
        </view>
      </view>
      <view class="empty" v-else>当前没有待处理或快到期凭证</view>
    </view>

    <view class="section" id="reminder">
      <view class="section-title">提醒日程</view>
      <view class="reminder-list" v-if="reminderRows.length">
        <view class="reminder-row" v-for="item in reminderRows" :key="item.id" @tap="openProofPanel(item)">
          <view class="reminder-date">
            <view>{{ String(item.dueDate).slice(5, 10) }}</view>
            <text>{{ getReminderLabel(item.dueDate) }}</text>
          </view>
          <view class="reminder-body">
            <view>{{ item.note || item.proofTypeName }}</view>
            <text>{{ item.proofTypeName }} · {{ item.actionType }}</text>
          </view>
          <view class="reminder-process" @tap.stop="openProofPanel(item)">去处理</view>
        </view>
      </view>
      <view class="empty" v-else>还没有设置提醒日期的凭证</view>
    </view>

    <view class="section" id="voucher">
      <view class="section-head">
        <view>
          <view class="section-title">凭证相册</view>
          <text>{{ galleryMonth }} · {{ galleryBills.length }} 张</text>
        </view>
        <view class="section-link" @tap="galleryMonthPickerShow = true">切换月份</view>
      </view>
      <view class="voucher-grid" v-if="galleryBills.length">
        <view class="voucher" v-for="item in galleryBills" :key="item.id" @tap="previewImage(item.imgUrl || item.attachments[0]?.url)">
          <image :src="getImageUrl(item.imgUrl || item.attachments[0]?.url)" mode="aspectFill" />
          <view class="voucher-mask">
            <text>{{ item.proofTypeName }}</text>
            <text>{{ String(item.date).slice(5, 10) }}</text>
          </view>
        </view>
      </view>
      <view class="empty" v-else>{{ galleryMonth }} 还没有图片凭证</view>
    </view>

    <up-popup :show="reminderPopupShow" mode="center" round="28rpx" :closeOnClickOverlay="false">
      <view class="reminder-popup" v-if="activeReminder">
        <view class="reminder-popup-mark">!</view>
        <view class="reminder-popup-title">有凭证需要处理</view>
        <image
          class="reminder-popup-photo"
          :src="getProofImageUrl(activeReminder) ? getImageUrl(getProofImageUrl(activeReminder)) : '/static/images/piaoyu/receipt-stack.png'"
          mode="aspectFit"
          @tap="previewReminderImage(activeReminder)"
        />
        <view class="reminder-popup-sub">{{ activeReminder.note || activeReminder.proofTypeName }}</view>
        <view class="reminder-popup-meta">
          <view>{{ activeReminder.proofTypeName }}</view>
          <view>{{ activeReminder.dueDate ? `${activeReminder.dueDate} 提醒` : activeReminder.proofStatusName }}</view>
        </view>
        <view class="reminder-popup-next" v-if="hasNextReminder" @tap="showNextReminder">
          查看下一张 {{ reminderPopupIndex + 1 }}/{{ openReminderRows.length }}
        </view>
        <view class="reminder-popup-actions">
          <view class="ghost" @tap="muteActiveReminder(activeReminder)">不再提醒</view>
          <view class="ghost" @tap="quietTodayActiveReminder(activeReminder)">今日不提醒</view>
          <view class="primary" @tap="goActiveReminder">去处理</view>
        </view>
      </view>
    </up-popup>

    <view class="receipt-preview-mask" v-if="receiptPreviewShow" @tap="closeReceiptPreview">
      <view class="receipt-preview-close" @tap.stop="closeReceiptPreview">×</view>
      <image class="receipt-preview-image" :src="receiptPreviewUrl" mode="aspectFit" @tap.stop />
    </view>

    <up-popup :show="statsPanelShow" mode="bottom" round="28rpx" :closeOnClickOverlay="true" @close="statsPanelShow = false">
      <view class="stats-panel">
        <view class="panel-head">
          <view>
            <view class="panel-title">统计概览</view>
            <text>{{ statsMonth }}</text>
          </view>
          <view class="panel-head-actions">
            <view class="stats-month-btn" @tap="statsMonthPickerShow = true">切换月份</view>
            <view class="panel-close" @tap="statsPanelShow = false">×</view>
          </view>
        </view>
        <view class="stats-hero">
          <view>
            <text>本月处理率</text>
            <view>{{ selectedMonthArchiveRate }}%</view>
          </view>
          <view>
            <text>当月凭证</text>
            <view>{{ selectedMonthProofStats.total }}</view>
          </view>
          <view>
            <text>图片凭证</text>
            <view>{{ selectedMonthVoucherCount }}</view>
          </view>
        </view>
        <view class="panel-subtitle">生活提示</view>
        <view class="life-tip-list">
          <view class="life-tip" v-for="(tip, index) in selectedMonthLifeTips" :key="tip">
            <view>{{ index + 1 }}</view>
            <text>{{ tip }}</text>
          </view>
        </view>
        <view class="panel-subtitle">本月类型</view>
        <view class="stats-type-list" v-if="selectedMonthTypeRows.length">
          <view class="stats-type-row" v-for="item in selectedMonthTypeRows" :key="item.key">
            <view class="stats-type-name">
              <view :style="{ background: item.color }">{{ item.icon }}</view>
              <text>{{ item.name }}</text>
            </view>
            <view class="stats-type-track">
              <view :style="{ width: `${item.percent}%`, background: item.color }"></view>
            </view>
            <text>{{ item.count }}</text>
          </view>
        </view>
        <view class="empty" v-else>本月还没有可统计的凭证</view>
      </view>
    </up-popup>
    <up-datetime-picker :show="statsMonthPickerShow" v-model="statsMonthPickerValue" mode="year-month" @confirm="onStatsMonthConfirm" @cancel="statsMonthPickerShow = false" />
    <up-datetime-picker :show="galleryMonthPickerShow" v-model="galleryMonthPickerValue" mode="year-month" @confirm="onGalleryMonthConfirm" @cancel="galleryMonthPickerShow = false" />

    <up-popup :show="proofPanelShow" mode="bottom" round="28rpx" :closeOnClickOverlay="false" @close="closeProofPanel">
      <view class="proof-panel" v-if="selectedProof">
        <view class="panel-head">
          <view>
            <view class="panel-title">{{ selectedProof.note || selectedProof.proofTypeName }}</view>
            <text>{{ selectedProof.proofTypeName }} · {{ selectedProof.proofStatusName }}</text>
          </view>
          <view class="panel-close" @tap="closeProofPanel">×</view>
        </view>
        <view class="panel-preview" v-if="selectedProof.imgUrl || selectedProof.attachments.length" @tap="previewSelectedProofImage(selectedProof)">
          <image :src="getImageUrl(selectedProof.imgUrl || selectedProof.attachments[0]?.url)" mode="aspectFill" />
          <view>查看凭证图片</view>
        </view>
        <view class="panel-meta">
          <view>
            <text>收纳时间</text>
            <view>{{ String(selectedProof.date).slice(0, 16) }}</view>
          </view>
          <view>
            <text>提醒日期</text>
            <view>{{ selectedProof.dueDate || '未设置' }}</view>
          </view>
          <view>
            <text>处理动作</text>
            <view>{{ selectedProof.actionType }}</view>
          </view>
          <view v-if="selectedProof.actionKey === 'reimburse' || Number(selectedProof.reimbursementAmount || 0) > 0">
            <text>报销金额</text>
            <view>{{ selectedProof.reimbursementAmount || '0.00' }}</view>
          </view>
        </view>
        <view class="panel-note">
          <text>处理备注</text>
          <textarea auto-height maxlength="100" v-model="processNoteInput" placeholder="例如：已提交报销，等待财务确认；材料缺发票，需补充..." placeholder-class="panel-note-ph" />
        </view>
        <view class="panel-subtitle">稍后提醒</view>
        <view class="remind-grid">
          <view v-for="item in reminderPresets" :key="item.days" @tap="snoozeProof(selectedProof, item.days)">{{ item.label }}</view>
          <view @tap="customDuePickerShow = true">自定义日期</view>
        </view>
        <view class="panel-actions">
          <view class="panel-btn ghost" @tap="markTodo(selectedProof)">标记待处理</view>
          <view class="panel-btn primary" @tap="completeProof(selectedProof)">已处理并归档</view>
        </view>
      </view>
    </up-popup>
    <up-datetime-picker :show="customDuePickerShow" v-model="customDuePickerValue" mode="date" @confirm="onCustomDueConfirm" @cancel="customDuePickerShow = false" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store'
import { getGuestMode } from '@/utils/auth'
import util from '@/utils/utils'
import {
  getProofTypeSummary,
  getProofStats,
  normalizeBillList,
  REMINDER_PRESETS
} from '@/utils/proofArchive'
import { getMonthlyLifeTips } from '@/utils/reminderTips'

const userStore = useUserStore()
const windowHeight = ref(uni.getSystemInfoSync().windowHeight)
const statusBarHeight = ref(uni.getSystemInfoSync().statusBarHeight || 20)
const currentYear = ref(String(new Date().getFullYear()))
const currentMonth = ref(util.getMonthDate())
const reminderSeed = ref(Date.now())
const proofPanelShow = ref(false)
const selectedProof = ref(null)
const lastReminderToastKey = ref('')
const customDuePickerShow = ref(false)
const customDuePickerValue = ref(Date.now())
const processNoteInput = ref('')
const reminderPopupShow = ref(false)
const reminderPopupIndex = ref(0)
const receiptPreviewShow = ref(false)
const receiptPreviewUrl = ref('')
const statsPanelShow = ref(false)
const statsMonthPickerShow = ref(false)
const statsMonthPickerValue = ref(Date.now())
const statsMonth = ref(util.getMonthDate())
const galleryMonthPickerShow = ref(false)
const galleryMonthPickerValue = ref(Date.now())
const galleryMonth = ref(util.getMonthDate())
const reminderPresets = REMINDER_PRESETS

const billList = computed(() => normalizeBillList(userStore.mockBillData))
const yearBills = computed(() => billList.value.filter(item => String(item.date).startsWith(currentYear.value)))
const yearProofStats = computed(() => getProofStats(billList.value, currentYear.value))
const voucherBills = computed(() => yearBills.value.filter(item => item.imgUrl || item.attachments.length))
const galleryBills = computed(() => billList.value
  .filter(item => String(item.date).startsWith(galleryMonth.value) && (item.imgUrl || item.attachments.length))
  .sort((a, b) => new Date(b.date) - new Date(a.date)))
const selectedMonthBills = computed(() => billList.value.filter(item => String(item.date).startsWith(statsMonth.value)))
const selectedMonthProofStats = computed(() => getProofStats(billList.value, statsMonth.value))
const selectedMonthTypeRows = computed(() => getProofTypeSummary(billList.value, statsMonth.value).filter(item => item.count > 0))
const selectedMonthVoucherCount = computed(() => selectedMonthBills.value.filter(item => item.imgUrl || item.attachments.length).length)
const selectedMonthArchiveRate = computed(() => {
  if (!selectedMonthProofStats.value.total) return 0
  return Math.round((selectedMonthProofStats.value.archived / selectedMonthProofStats.value.total) * 100)
})
const selectedMonthLifeTips = computed(() => getMonthlyLifeTips({
  bills: billList.value,
  datePrefix: statsMonth.value,
  seed: reminderSeed.value,
  limit: 3
}))
const actionRows = computed(() => yearBills.value
  .filter(item => item.proofStatus === 'todo' || item.proofStatus === 'expiring' || item.proofStatus === 'inbox')
  .sort((a, b) => {
    const aDue = a.dueDate || '9999-12-31'
    const bDue = b.dueDate || '9999-12-31'
    return aDue.localeCompare(bDue)
  })
  .slice(0, 8))
const reminderRows = computed(() => yearBills.value
  .filter(item => item.dueDate && item.proofStatus !== 'archived')
  .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
  .slice(0, 12))
const openReminderRows = computed(() => yearBills.value
  .filter(item => item.proofStatus !== 'archived' && item.remindEveryOpen && !item.remindMuted && item.reminderQuietDate !== util.getTodayDate() && (item.dueDate || item.proofStatus === 'todo' || item.proofStatus === 'expiring')))
const activeReminder = computed(() => openReminderRows.value[reminderPopupIndex.value] || openReminderRows.value[0] || null)
const hasNextReminder = computed(() => openReminderRows.value.length > 1)
const weekBills = computed(() => {
  const now = new Date()
  const day = now.getDay() || 7
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1).getTime()
  const end = start + 7 * 86400000
  return billList.value.filter((item) => {
    const time = new Date(item.date).getTime()
    return time >= start && time < end
  })
})
const weeklySummaryText = computed(() => {
  const stats = getProofStats(weekBills.value)
  if (!stats.total) return '本周还没有新凭证，遇到报销、售后或重要材料时顺手收一下。'
  return `本周收纳 ${stats.total} 张，待处理 ${stats.pending} 项，快到期 ${stats.expiring} 项。`
})
const getImageUrl = (url) => util.checkFileUrl(url || '')
const getProofImageUrl = (item) => item?.imgUrl || item?.attachments?.[0]?.url || ''
const previewImage = (url) => {
  if (!url) return
  uni.previewImage({ urls: [getImageUrl(url)] })
}
const previewReminderImage = (item) => {
  const url = getProofImageUrl(item)
  if (!url) return
  receiptPreviewUrl.value = getImageUrl(url)
  receiptPreviewShow.value = true
}
const previewSelectedProofImage = (item) => {
  const url = getProofImageUrl(item)
  if (!url) return
  receiptPreviewUrl.value = getImageUrl(url)
  receiptPreviewShow.value = true
}
const closeReceiptPreview = () => {
  receiptPreviewShow.value = false
  receiptPreviewUrl.value = ''
}
const openStatsPanel = () => {
  statsMonth.value = currentMonth.value
  statsMonthPickerValue.value = new Date(`${currentMonth.value}-01 00:00:00`).getTime()
  statsPanelShow.value = true
}
const onStatsMonthConfirm = (e) => {
  statsMonth.value = util.formatDate(e.value, 'YYYY-MM')
  statsMonthPickerValue.value = e.value
  statsMonthPickerShow.value = false
}
const onGalleryMonthConfirm = (e) => {
  galleryMonth.value = util.formatDate(e.value, 'YYYY-MM')
  galleryMonthPickerValue.value = e.value
  galleryMonthPickerShow.value = false
}
const switchTab = (url) => uni.switchTab({ url })
const scrollToReminder = () => {
  uni.pageScrollTo({ selector: '#reminder', duration: 220 })
}
const getReminderLabel = (dueDate) => {
  if (!dueDate) return '未设置'
  const today = new Date(`${util.getTodayDate()} 00:00:00`).getTime()
  const target = new Date(`${String(dueDate).slice(0, 10)} 00:00:00`).getTime()
  const diff = Math.round((target - today) / 86400000)
  if (diff < 0) return `已过${Math.abs(diff)}天`
  if (diff === 0) return '今天'
  if (diff === 1) return '明天'
  return `${diff}天后`
}
const openProofPanel = (item) => {
  selectedProof.value = item
  processNoteInput.value = item.processNote || ''
  customDuePickerValue.value = item.dueDate ? new Date(`${item.dueDate} 00:00:00`).getTime() : Date.now()
  proofPanelShow.value = true
}
const closeProofPanel = () => {
  proofPanelShow.value = false
  selectedProof.value = null
}
const updateProof = async (item, patch, toastTitle) => {
  if (!item?.id) return
  const next = billList.value.map(proof => proof.id === item.id
    ? {
        ...proof,
        processNote: selectedProof.value?.id === item.id ? processNoteInput.value : proof.processNote,
        ...patch,
        updatedAt: util.formatDate(Date.now(), 'YYYY-MM-DD HH:mm:ss')
      }
    : proof)
  await userStore.updateMockBillData(next)
  const updated = next.find(proof => proof.id === item.id) || null
  selectedProof.value = updated
  if (toastTitle) uni.showToast({ title: toastTitle, icon: 'none' })
}
const snoozeProof = async (item, days) => {
  if (days === -1) {
    await updateProof(item, {
      remindMuted: true,
      remindEveryOpen: false,
      actionType: '暂停提醒',
      reminderNote: '不再提醒'
    }, '已关闭提醒')
    return
  }
  if (days === 0) {
    await updateProof(item, {
      remindMuted: false,
      remindEveryOpen: true,
      proofStatus: item.proofStatus === 'archived' ? 'todo' : item.proofStatus,
      proofStatusName: item.proofStatus === 'archived' ? '待处理' : item.proofStatusName,
      actionType: '提醒',
      reminderNote: '每次打开提醒'
    }, '已设为每次打开提醒')
    return
  }
  const dueDate = util.formatDate(Date.now() + days * 86400000, 'YYYY-MM-DD')
  await updateProof(item, {
    proofStatus: 'expiring',
    proofStatusName: '快到期',
    dueDate,
    remindMuted: false,
    remindEveryOpen: true,
    actionType: '提醒',
    reminderNote: `${days}天后提醒`
  }, `已设为${days}天后提醒`)
}
const markTodo = async (item) => {
  await updateProof(item, {
    proofStatus: 'todo',
    proofStatusName: '待处理',
    actionType: '待处理',
    remindMuted: false,
    remindEveryOpen: true,
    handledAt: ''
  }, '已放入待处理')
}
const completeProof = async (item) => {
  await updateProof(item, {
    proofStatus: 'archived',
    proofStatusName: '已归档',
    actionType: '已处理',
    dueDate: '',
    remindMuted: true,
    remindEveryOpen: false,
    reminderNote: '',
    handledAt: util.formatDate(Date.now(), 'YYYY-MM-DD HH:mm:ss')
  }, '已处理并归档')
  closeProofPanel()
}
const goActiveReminder = () => {
  if (!activeReminder.value) return
  reminderPopupShow.value = false
  openProofPanel(activeReminder.value)
}
const showNextReminder = () => {
  if (!openReminderRows.value.length) return
  reminderPopupIndex.value = (reminderPopupIndex.value + 1) % openReminderRows.value.length
}
const snoozeActiveReminder = async (item, days) => {
  await snoozeProof(item, days)
  reminderPopupShow.value = false
}
const muteActiveReminder = async (item) => {
  await snoozeProof(item, -1)
  reminderPopupShow.value = false
}
const quietTodayActiveReminder = async (item) => {
  await updateProof(item, {
    reminderQuietDate: util.getTodayDate(),
    reminderNote: '今日不提醒',
    remindMuted: false,
    remindEveryOpen: true
  }, '今天不再提醒')
  reminderPopupShow.value = false
}
const onCustomDueConfirm = async (e) => {
  if (!selectedProof.value) return
  const dueDate = util.formatDate(e.value, 'YYYY-MM-DD')
  customDuePickerValue.value = e.value
  customDuePickerShow.value = false
  await updateProof(selectedProof.value, {
    proofStatus: 'expiring',
    proofStatusName: '快到期',
    dueDate,
    remindMuted: false,
    remindEveryOpen: true,
    actionType: '提醒',
    reminderNote: '自定义日期提醒'
  }, '提醒日期已更新')
}
const remindDueOnOpen = () => {
  const todayKey = util.getTodayDate()
  const dueCount = openReminderRows.value.length
  const toastKey = `${todayKey}_${dueCount}`
  if (reminderPopupIndex.value >= dueCount) reminderPopupIndex.value = 0
  reminderPopupShow.value = Boolean(dueCount)
  if (!dueCount || lastReminderToastKey.value === toastKey) return
  lastReminderToastKey.value = toastKey
  uni.showToast({ title: `有 ${dueCount} 项提醒需要处理`, icon: 'none' })
}

onShow(async () => {
  currentYear.value = String(new Date().getFullYear())
  currentMonth.value = util.getMonthDate()
  reminderSeed.value = Date.now()
  if (!getGuestMode()) await userStore.getInfo()
  await userStore.loadBillData()
  remindDueOnOpen()
})
</script>

<style lang="scss" scoped>
.proof-page {
  padding: 0 30rpx 150rpx;
  background: linear-gradient(180deg, rgba(235, 245, 255, 0.94) 0%, rgba(248, 251, 255, 0.98) 48%, #ffffff 100%);
  color: #101722;
}

.page-head,
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20rpx;
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

.head-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
}

.stats-entry {
  height: 56rpx;
  line-height: 56rpx;
  padding: 0 22rpx;
  border-radius: 999rpx;
  background: #101722;
  color: #ffffff;
  font-size: 23rpx;
  font-weight: 900;
}

.summary-card {
  position: relative;
  overflow: hidden;
  margin-top: 32rpx;
  padding: 34rpx;
  border: 1rpx solid #dfeaf8;
  border-radius: 36rpx;
  background: linear-gradient(135deg, #ffffff 0%, #eef6ff 100%);
  box-shadow: 0 24rpx 58rpx rgba(53, 86, 128, 0.12);
}

.summary-card image {
  position: absolute;
  right: -92rpx;
  top: 2rpx;
  width: 270rpx;
  height: 270rpx;
  opacity: 0.24;
  pointer-events: none;
}

.summary-card text {
  position: relative;
  z-index: 1;
  display: block;
  color: #5d697b;
  font-size: 24rpx;
}

.summary-card view {
  position: relative;
  z-index: 1;
  margin: 18rpx 0;
  color: #101722;
  font-size: 64rpx;
  line-height: 1;
  font-weight: 700;
}

.weekly-tip {
  margin-top: 16rpx;
  padding: 0 6rpx;
  color: #6b778a;
  font-size: 23rpx;
  line-height: 1.5;
}

.urgent-banner {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 22rpx;
  padding: 20rpx 22rpx;
  border-radius: 26rpx;
  background: #fff3bf;
  color: #101722;
  box-shadow: 0 14rpx 32rpx rgba(171, 130, 24, 0.12);
}

.urgent-banner view {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #ffc51f;
  color: #101722;
  font-size: 26rpx;
  font-weight: 900;
  flex-shrink: 0;
}

.urgent-banner text {
  color: #101722;
  font-size: 25rpx;
  font-weight: 800;
  line-height: 1.4;
}

.section {
  margin-top: 24rpx;
  padding: 28rpx;
  border: 1rpx solid #edf2f8;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 16rpx 38rpx rgba(53, 86, 128, 0.08);
}

.section-title {
  color: #101722;
  font-size: 30rpx;
  font-weight: 700;
}

.section-link {
  color: #3d8bff;
  font-size: 24rpx;
  font-weight: 700;
}

.todo-mark {
  display: flex;
  align-items: center;
  justify-content: center;
}

.todo-list {
  display: grid;
  gap: 14rpx;
  margin-top: 22rpx;
}

.todo-row,
.reminder-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 18rpx;
  border-radius: 24rpx;
  background: #f8fbff;
}

.todo-mark {
  width: 58rpx;
  height: 58rpx;
  border-radius: 20rpx;
  color: #fff;
  font-size: 22rpx;
  font-weight: 900;
  flex-shrink: 0;
}

.todo-body {
  flex: 1;
  min-width: 0;
}

.todo-body view {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #101722;
  font-size: 27rpx;
  font-weight: 800;
}

.todo-body text {
  display: block;
  margin-top: 8rpx;
  color: #5d697b;
  font-size: 22rpx;
}

.todo-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.todo-actions view {
  min-width: 120rpx;
  height: 56rpx;
  line-height: 56rpx;
  border-radius: 20rpx;
  background: #eef6ff;
  color: #2f6faf;
  text-align: center;
  font-size: 22rpx;
  font-weight: 800;
}

.todo-actions view.process {
  background: #3d8bff;
  color: #fff;
}

.reminder-list {
  display: grid;
  gap: 14rpx;
  margin-top: 22rpx;
}

.reminder-date {
  width: 92rpx;
  flex-shrink: 0;
}

.reminder-date view {
  color: #101722;
  font-size: 26rpx;
  font-weight: 900;
}

.reminder-date text {
  display: block;
  margin-top: 6rpx;
  color: #3d8bff;
  font-size: 20rpx;
  font-weight: 800;
}

.reminder-body {
  min-width: 0;
  flex: 1;
}

.reminder-body view {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #101722;
  font-size: 27rpx;
  font-weight: 800;
}

.reminder-body text {
  display: block;
  margin-top: 8rpx;
  color: #5d697b;
  font-size: 22rpx;
}

.reminder-process {
  flex-shrink: 0;
  min-width: 120rpx;
  height: 56rpx;
  line-height: 56rpx;
  border-radius: 20rpx;
  background: #3d8bff;
  color: #ffffff;
  text-align: center;
  font-size: 22rpx;
  font-weight: 800;
}

.voucher-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
  margin-top: 22rpx;
}

.voucher {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1;
  border-radius: 24rpx;
  background: #eef5ff;
}

.voucher image {
  width: 100%;
  height: 100%;
}

.voucher-mask {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  gap: 8rpx;
  padding: 10rpx;
  background: rgba(16, 23, 34, 0.58);
  color: #fff;
  font-size: 18rpx;
}

.empty {
  padding: 34rpx 0 8rpx;
  color: #8b8f87;
  text-align: center;
  font-size: 24rpx;
}

.reminder-popup {
  width: 610rpx;
  padding: 34rpx 30rpx 30rpx;
  border-radius: 28rpx;
  background: #ffffff;
  text-align: center;
}

.reminder-popup-mark {
  width: 62rpx;
  height: 62rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 18rpx;
  border-radius: 50%;
  background: #ffc51f;
  color: #101722;
  font-size: 34rpx;
  font-weight: 900;
}

.reminder-popup-title {
  color: #101722;
  font-size: 34rpx;
  font-weight: 900;
}

.reminder-popup-photo {
  display: block;
  width: 100%;
  height: 390rpx;
  margin-top: 22rpx;
  border-radius: 22rpx;
  background: #f8fbff;
}

.reminder-popup-sub {
  margin-top: 12rpx;
  color: #5d697b;
  font-size: 25rpx;
  line-height: 1.45;
}

.reminder-popup-meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12rpx;
  margin-top: 20rpx;
}

.reminder-popup-meta view {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 14rpx;
  border-radius: 18rpx;
  background: #f8fbff;
  color: #273142;
  font-size: 22rpx;
  font-weight: 800;
}

.reminder-popup-next {
  height: 78rpx;
  line-height: 78rpx;
  margin-top: 20rpx;
  border-radius: 999rpx;
  background: #101722;
  color: #ffffff;
  font-size: 25rpx;
  font-weight: 900;
  box-shadow: 0 14rpx 28rpx rgba(16, 23, 34, 0.18);
}

.reminder-popup-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
  margin-top: 26rpx;
}

.reminder-popup-actions view {
  height: 76rpx;
  line-height: 76rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  font-weight: 900;
}

.reminder-popup-actions .ghost {
  border: 1rpx solid #dfeaf8;
  background: #ffffff;
  color: #5d697b;
}

.reminder-popup-actions .primary {
  background: #3d8bff;
  color: #ffffff;
}

.receipt-preview-mask {
  position: fixed;
  inset: 0;
  z-index: 2147483646;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 96rpx 34rpx;
  background: rgba(9, 14, 22, 0.88);
}

.receipt-preview-image {
  width: 100%;
  height: 100%;
}

.receipt-preview-close {
  position: fixed;
  right: 32rpx;
  top: 54rpx;
  z-index: 2147483647;
  width: 72rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  text-align: center;
  font-size: 48rpx;
  font-weight: 300;
}

.stats-panel {
  padding: 34rpx 30rpx 42rpx;
  background: linear-gradient(180deg, #f5f9ff 0%, #ffffff 100%);
}

.panel-head-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
}

.stats-month-btn {
  height: 56rpx;
  line-height: 56rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: #101722;
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 900;
}

.stats-hero {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
  margin-top: 24rpx;
}

.stats-hero > view {
  min-width: 0;
  padding: 20rpx 14rpx;
  border-radius: 24rpx;
  background: #ffffff;
  text-align: center;
}

.stats-hero text {
  display: block;
  color: #6b778a;
  font-size: 20rpx;
  white-space: nowrap;
}

.stats-hero view view {
  margin-top: 14rpx;
  color: #101722;
  font-size: 38rpx;
  line-height: 1;
  font-weight: 900;
}

.life-tip-list {
  display: grid;
  gap: 12rpx;
  margin-top: 16rpx;
}

.life-tip {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding: 16rpx 18rpx;
  border-radius: 22rpx;
  background: #fff8df;
}

.life-tip view {
  width: 34rpx;
  height: 34rpx;
  line-height: 34rpx;
  border-radius: 50%;
  background: #101722;
  color: #ffffff;
  text-align: center;
  font-size: 18rpx;
  font-weight: 900;
  flex-shrink: 0;
}

.life-tip text {
  flex: 1;
  min-width: 0;
  color: #3f4754;
  font-size: 23rpx;
  line-height: 1.45;
}

.stats-type-list {
  display: grid;
  gap: 16rpx;
  margin-top: 16rpx;
}

.stats-type-row {
  display: grid;
  grid-template-columns: 154rpx 1fr 44rpx;
  align-items: center;
  gap: 14rpx;
}

.stats-type-name {
  display: flex;
  align-items: center;
  gap: 10rpx;
  min-width: 0;
}

.stats-type-name view {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 15rpx;
  color: #ffffff;
  font-size: 18rpx;
  font-weight: 900;
  flex-shrink: 0;
}

.stats-type-name text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #273142;
  font-size: 23rpx;
  font-weight: 800;
}

.stats-type-track {
  overflow: hidden;
  height: 12rpx;
  border-radius: 999rpx;
  background: #edf2f8;
}

.stats-type-track view {
  height: 100%;
  border-radius: inherit;
}

.stats-type-row > text {
  color: #6b778a;
  text-align: right;
  font-size: 22rpx;
  font-weight: 800;
}

.proof-panel {
  padding: 34rpx 30rpx 42rpx;
  background: linear-gradient(180deg, #f5f9ff 0%, #ffffff 100%);
}

.panel-head,
.panel-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.panel-title {
  color: #101722;
  font-size: 34rpx;
  font-weight: 900;
}

.panel-head text {
  display: block;
  margin-top: 8rpx;
  color: #5d697b;
  font-size: 23rpx;
}

.panel-close {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #eef6ff;
  color: #5d697b;
  font-size: 42rpx;
  line-height: 1;
  flex-shrink: 0;
}

.panel-preview {
  position: relative;
  overflow: hidden;
  height: 220rpx;
  margin-top: 24rpx;
  border-radius: 26rpx;
  background: #eef5ff;
}

.panel-preview image {
  width: 100%;
  height: 100%;
}

.panel-preview view {
  position: absolute;
  left: 18rpx;
  bottom: 18rpx;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(16, 23, 34, 0.66);
  color: #fff;
  font-size: 22rpx;
  font-weight: 800;
}

.panel-meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12rpx;
  margin-top: 20rpx;
}

.panel-meta > view {
  min-width: 0;
  padding: 16rpx;
  border-radius: 22rpx;
  background: #f8fbff;
}

.panel-meta text {
  color: #6b778a;
  font-size: 20rpx;
}

.panel-meta view view {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 8rpx;
  color: #101722;
  font-size: 23rpx;
  font-weight: 800;
}

.panel-subtitle {
  margin: 26rpx 4rpx 14rpx;
  color: #101722;
  font-size: 28rpx;
  font-weight: 900;
}

.panel-note {
  margin-top: 20rpx;
  padding: 18rpx;
  border: 1rpx solid #dfeaf8;
  border-radius: 24rpx;
  background: #fff;
}

.panel-note text {
  display: block;
  color: #101722;
  font-size: 26rpx;
  font-weight: 900;
}

.panel-note textarea {
  width: 100%;
  min-height: 86rpx;
  margin-top: 12rpx;
  color: #273142;
  font-size: 25rpx;
  line-height: 1.5;
}

.panel-note-ph {
  color: #a7b2c1;
}

.remind-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14rpx;
}

.remind-grid view {
  height: 72rpx;
  line-height: 72rpx;
  border: 1rpx solid #dfeaf8;
  border-radius: 22rpx;
  background: #fff;
  color: #2f6faf;
  text-align: center;
  font-size: 25rpx;
  font-weight: 800;
}

.panel-actions {
  margin-top: 28rpx;
}

.panel-btn {
  flex: 1;
  height: 86rpx;
  line-height: 86rpx;
  border-radius: 999rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: 900;
}

.panel-btn.ghost {
  border: 1rpx solid #dfeaf8;
  background: #fff;
  color: #5d697b;
}

.panel-btn.primary {
  background: linear-gradient(180deg, #5ba7ff 0%, #3d8bff 100%);
  color: #fff;
}
</style>
