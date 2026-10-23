<template>
  <view class="book-page" :style="{ minHeight: `${windowHeight}px` }">
    <view class="hero" :style="{ paddingTop: `${statusBarHeight + 20}px` }">
      <image class="hero-art" src="/static/images/piaoyu/home-hero.png" mode="aspectFill" />
      <view class="brand-row">
        <view>
          <view class="brand-title">薪花记账</view>
          <view class="tagline">你的私密凭证岛</view>
        </view>
      </view>
      <view class="hero-copy">
        <view class="hello">下午好，</view>
        <view class="hero-title">今天把证据收好</view>
        <view class="date-chip">{{ todayTitle }}</view>
      </view>
    </view>

    <view class="quick-actions">
      <view class="capture-action" @tap="chooseAttachment">
        <up-icon name="camera-fill" color="#101722" size="31"></up-icon>
        <view>
          <view>收一张凭证</view>
          <text>{{ form.imgUrl ? '已添加，完善卡片后保存' : '拍照留存，进入待整理箱' }}</text>
        </view>
      </view>
      <view class="manual-action" @tap="startReminderFlow">
        <up-icon name="bell" color="#101722" size="29"></up-icon>
        <view>
          <view>建提醒事项</view>
          <text>到期、售后、报销跟进</text>
        </view>
      </view>
    </view>

    <view class="urgent-card" v-if="openReminderRows.length" @tap="goFinance">
      <view class="urgent-mark">!</view>
      <view>
        <view>有 {{ openReminderRows.length }} 项凭证需要处理</view>
        <text>报销、售后或到期提醒未完成，点这里进入处理中心</text>
      </view>
      <up-icon name="arrow-right" color="#101722" size="16"></up-icon>
    </view>

    <view class="proof-section">
      <view class="section-head">
        <view>
          <view class="section-title">今天已收下的凭证</view>
          <text>已收 {{ todayProofStats.total }} · 待处理 {{ todayProofStats.pending }}</text>
        </view>
        <view class="section-link" @tap="goFinance">全部</view>
      </view>
      <scroll-view class="proof-scroll" scroll-x v-if="todayBills.length">
        <view class="proof-row">
          <view class="proof-card" v-for="item in todayBills.slice(0, 6)" :key="item.id" @tap="openBillVoucher(item)">
            <view class="proof-delete" @tap.stop="confirmDelete(item)">×</view>
            <image class="proof-img" :src="getBillVoucherUrl(item) ? getImageUrl(getBillVoucherUrl(item)) : '/static/images/piaoyu/receipt-stack.png'" mode="aspectFill" />
            <view class="proof-date">{{ String(item.date).slice(5, 10) }}</view>
            <view class="proof-title">{{ item.note || item.proofTypeName }}</view>
            <view class="proof-tag" :class="{ pending: item.proofStatus !== 'archived' }">{{ item.proofTypeName }} · {{ item.proofStatusName }}</view>
          </view>
        </view>
      </scroll-view>
      <view class="empty-proof" v-else>
        <image src="/static/images/piaoyu/receipt-stack.png" mode="aspectFit" />
        <view>
          <view>今天还没有凭证</view>
          <text>拍照、报销、售后提醒，都可以先收进待整理箱。</text>
        </view>
      </view>
    </view>

    <view class="stack-card">
      <view class="section-head">
        <view class="stack-title">{{ Number(month.slice(5, 7)) }}月凭证堆栈</view>
        <view class="stack-progress">待处理 {{ monthProofStats.pending }}</view>
      </view>
      <view class="stack-body">
        <image src="/static/images/piaoyu/receipt-stack.png" mode="aspectFit" />
        <view class="stack-metrics">
          <text>已收集</text>
          <view>{{ monthProofStats.total }}<text>张</text></view>
          <text>快到期 {{ monthProofStats.expiring }} 项</text>
        </view>
        <view class="progress-wrap">
          <view class="progress-bar">
            <view :style="{ width: `${Math.min(100, voucherRate)}%` }"></view>
          </view>
          <view class="progress-scale">
            <text>0</text><text>25</text><text>50</text><text>75</text><text>100</text>
          </view>
        </view>
      </view>
      <view class="review-call">
        <up-icon name="calendar" color="#8fb8eb" size="22"></up-icon>
        <view>
          <view>{{ Number(month.slice(5, 7)) }}月凭证概览</view>
          <text>{{ monthInsightText }}</text>
        </view>
        <view class="preview-btn" @tap="goFinance">预览</view>
      </view>
    </view>

    <view class="overview-title">凭证工作台</view>
    <view class="overview-grid">
      <view class="overview-card">
        <up-icon name="file-text" color="#3d8bff" size="30"></up-icon>
        <view>待处理</view>
        <text>{{ monthProofStats.pending }} 项</text>
      </view>
      <view class="overview-card">
        <up-icon name="bell" color="#ffc51f" size="30"></up-icon>
        <view>快到期</view>
        <text>{{ monthProofStats.expiring }} 项</text>
      </view>
      <view class="overview-card">
        <up-icon name="bookmark" color="#25bf75" size="30"></up-icon>
        <view>重要</view>
        <text>{{ monthProofStats.byType.important || 0 }} 张</text>
      </view>
      <view class="overview-card">
        <up-icon name="coupon" color="#ff724b" size="30"></up-icon>
        <view>报销</view>
        <text>{{ monthProofStats.byType.reimbursement || 0 }} 张</text>
      </view>
    </view>

    <view class="entry-panel" id="proofEditor">
      <view class="entry-head">
        <view>
          <view class="entry-title">{{ editorTitle }}</view>
          <text>{{ editorSubtitle }}</text>
        </view>
        <view class="mini-camera" @tap="chooseAttachment">
          <up-icon name="camera" color="#101722" size="20"></up-icon>
        </view>
      </view>
      <view class="selector-title">凭证类型</view>
      <view class="proof-type-grid">
        <view class="proof-type" :class="{ active: form.proofType === item.key }" v-for="item in proofTypes" :key="item.key" @tap="setProofType(item.key)">
          <view :style="{ background: item.color }">{{ item.icon }}</view>
          <text>{{ item.shortName }}</text>
        </view>
      </view>
      <view class="selector-title">提醒日期</view>
      <view class="due-row">
        <view class="due-chip" :class="{ active: form.dueDate === item.value }" v-for="item in duePresets" :key="item.label" @tap="setDuePreset(item.value)">
          {{ item.label }}
        </view>
        <view class="due-chip custom" :class="{ active: customDueActive }" @tap="duePickerShow = true">自定义</view>
      </view>
      <view class="amount-card" v-if="canInputReimbursement">
        <view>
          <text>报销金额</text>
          <text>可选，填写后自动进入待处理</text>
        </view>
        <input type="digit" v-model="form.reimbursementAmount" placeholder="0.00" placeholder-class="amount-ph" @input="onReimbursementAmountInput" />
      </view>
      <textarea class="note-input" auto-height maxlength="80" v-model="form.note" placeholder="备注：商品型号、报销事项、售后原因、到期说明..." placeholder-class="note-placeholder" />
      <view class="attachment-preview" v-if="form.imgUrl">
        <image :src="getImageUrl(form.imgUrl)" mode="aspectFill" @tap="previewImage(form.imgUrl)" />
        <view class="attachment-info">
          <view class="attachment-title">已添加凭证图片</view>
          <view class="attachment-sub">保存后会进入凭证堆栈</view>
        </view>
        <view class="remove-attach" @tap="removeAttachment">移除</view>
      </view>
      <view class="date-line" @tap="datePickerShow = true">
        <view>
          <text class="date-label">收纳时间</text>
          <text class="date-value">{{ form.date }}</text>
        </view>
        <up-icon name="arrow-right" color="#8c97a8" size="14"></up-icon>
      </view>
      <view class="lifecycle-preview">
        <view>凭证摘要</view>
        <text>{{ lifecycleText }}</text>
      </view>
      <view class="primary-btn" @tap="saveBill">{{ primaryActionText }}</view>
    </view>

    <view class="motto">
      <up-icon name="checkbox-mark" color="#5b95df" size="20"></up-icon>
      <text>{{ homeFooterTip }}</text>
    </view>

    <up-datetime-picker :show="datePickerShow" v-model="pickerValue" mode="datetime" @confirm="onDateConfirm" @cancel="datePickerShow = false" />
    <up-datetime-picker :show="duePickerShow" v-model="duePickerValue" mode="date" @confirm="onDueConfirm" @cancel="duePickerShow = false" />

    <up-popup :show="monthEndPopupShow" mode="center" round="28rpx" :closeOnClickOverlay="false">
      <view class="month-end-popup">
        <view class="reminder-popup-mark">!</view>
        <view class="reminder-popup-title">月底还有未处理凭证</view>
        <view class="month-end-count">{{ monthEndPendingRows.length }}</view>
        <view class="reminder-popup-sub">{{ month }} 还有凭证没有处理完成，建议月底前收尾。</view>
        <view class="month-end-meta">
          <view>
            <text>待处理</text>
            <view>{{ monthEndSummary.todo }}</view>
          </view>
          <view>
            <text>快到期</text>
            <view>{{ monthEndSummary.expiring }}</view>
          </view>
          <view>
            <text>待整理</text>
            <view>{{ monthEndSummary.inbox }}</view>
          </view>
        </view>
        <view class="month-end-actions">
          <view class="ghost" @tap="closeMonthEndPopupToday">关闭</view>
          <view class="primary" @tap="goMonthEndProcess">去处理</view>
        </view>
      </view>
    </up-popup>

    <up-popup :show="reminderPopupShow" mode="center" round="28rpx" :closeOnClickOverlay="false">
      <view class="reminder-popup" v-if="activeReminder">
        <view class="reminder-popup-mark">!</view>
        <view class="reminder-popup-title">有凭证需要处理</view>
        <image
          class="reminder-popup-photo"
          :src="getBillVoucherUrl(activeReminder) ? getImageUrl(getBillVoucherUrl(activeReminder)) : '/static/images/piaoyu/receipt-stack.png'"
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
          <view class="ghost" @tap="muteReminder(activeReminder)">不再提醒</view>
          <view class="ghost" @tap="quietTodayReminder(activeReminder)">今日不提醒</view>
          <view class="primary" @tap="goProcessReminder">去处理</view>
        </view>
      </view>
    </up-popup>

    <view class="receipt-preview-mask" v-if="receiptPreviewShow" @tap="closeReceiptPreview">
      <view class="receipt-preview-close" @tap.stop="closeReceiptPreview">×</view>
      <image class="receipt-preview-image" :src="receiptPreviewUrl" mode="aspectFit" @tap.stop />
    </view>

    <!-- #ifdef APP-PLUS -->
    <update-modal
      ref="updateModalRef"
      v-model:show="showUpdateModal"
      v-model:content="updateContent"
      v-model:showCancel="updateCanCancel"
    />
    <!-- #endif -->
  </view>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getGuestMode, getToken } from '@/utils/auth'
import { useUserStore } from '@/store'
import fileUpload from '@/utils/fileUpload'
import util from '@/utils/utils'
import {
  getDateTitle,
  getProofStats,
  getProofStatusMeta,
  getProofTypeMeta,
  normalizeBillList,
  PROOF_TYPES
} from '@/utils/proofArchive'
import { getPageFooterTip, getReminderTip } from '@/utils/reminderTips'
import updateModal from '@/components/update-modal/index.vue'

const { proxy } = getCurrentInstance()
const userStore = useUserStore()
const windowHeight = ref(uni.getSystemInfoSync().windowHeight)
const statusBarHeight = ref(uni.getSystemInfoSync().statusBarHeight || 20)
const datePickerShow = ref(false)
const duePickerShow = ref(false)
const pickerValue = ref(Date.now())
const duePickerValue = ref(Date.now())
const today = ref(util.getTodayDate())
const month = ref(util.getMonthDate())
const reminderSeed = ref(Date.now())
const reminderMode = ref(false)
const reminderPopupShow = ref(false)
const reminderPopupIndex = ref(0)
const monthEndPopupShow = ref(false)
const receiptPreviewShow = ref(false)
const receiptPreviewUrl = ref('')
const form = ref({
  tradeType: '凭证',
  category: '消费小票',
  icon: '票',
  color: '#3d8bff',
  proofType: 'receipt',
  proofStatus: 'inbox',
  dueDate: '',
  remindMuted: false,
  remindEveryOpen: true,
  reimbursementAmount: '',
  processNote: '',
  actionKey: 'archive',
  actionType: '归档',
  note: '',
  date: util.formatDate(Date.now(), 'YYYY-MM-DD HH:mm:ss'),
  imgUrl: '',
  attachments: []
})

// #ifdef APP-PLUS
const updateModalRef = ref(null)
const showUpdateModal = ref(false)
const updateContent = ref('有新版本可用，请更新')
const updateCanCancel = ref(true)
// #endif

const billList = computed(() => normalizeBillList(userStore.mockBillData))
const proofTypes = PROOF_TYPES
const todayBills = computed(() => billList.value.filter(item => String(item.date).startsWith(today.value)))
const monthBills = computed(() => billList.value.filter(item => String(item.date).startsWith(month.value)))
const todayProofStats = computed(() => getProofStats(billList.value, today.value))
const monthProofStats = computed(() => getProofStats(billList.value, month.value))
const openReminderRows = computed(() => billList.value.filter(item => item.proofStatus !== 'archived' && item.remindEveryOpen && !item.remindMuted && item.reminderQuietDate !== today.value && (item.dueDate || item.proofStatus === 'todo' || item.proofStatus === 'expiring')))
const activeReminder = computed(() => openReminderRows.value[reminderPopupIndex.value] || openReminderRows.value[0] || null)
const hasNextReminder = computed(() => openReminderRows.value.length > 1)
const monthEndPendingRows = computed(() => monthBills.value.filter(item => item.proofStatus !== 'archived'))
const monthEndSummary = computed(() => monthEndPendingRows.value.reduce((summary, item) => {
  if (item.proofStatus === 'todo') summary.todo += 1
  else if (item.proofStatus === 'expiring') summary.expiring += 1
  else summary.inbox += 1
  return summary
}, { todo: 0, expiring: 0, inbox: 0 }))
const todayTitle = computed(() => getDateTitle(today.value))
const voucherRate = computed(() => {
  if (!monthBills.value.length) return 0
  const count = monthBills.value.filter(item => item.imgUrl || item.attachments.length).length
  return Math.round((count / monthBills.value.length) * 100)
})
const currentProofType = computed(() => getProofTypeMeta(form.value.proofType))
const editorTitle = computed(() => reminderMode.value ? '创建提醒事项' : '创建凭证卡片')
const editorSubtitle = computed(() => reminderMode.value ? '填写提醒日期，后续会进入处理中心' : '上传图片、补充备注，需要报销就填写金额')
const primaryActionText = computed(() => reminderMode.value ? '保存提醒事项' : '保存凭证卡片')
const canInputReimbursement = computed(() => form.value.proofType === 'receipt' || form.value.proofType === 'reimbursement')
const lifecycleText = computed(() => {
  const amount = Number(form.value.reimbursementAmount || 0)
  return [
    currentProofType.value.name,
    form.value.dueDate ? `${form.value.dueDate}提醒` : '',
    amount > 0 ? `报销 ${amount.toFixed(2)}` : ''
  ].filter(Boolean).join(' · ') || currentProofType.value.name
})
const duePresets = computed(() => {
  const now = Date.now()
  return [
    { label: '不提醒', value: '' },
    { label: '3天后', value: util.formatDate(now + 3 * 86400000, 'YYYY-MM-DD') },
    { label: '7天后', value: util.formatDate(now + 7 * 86400000, 'YYYY-MM-DD') },
    { label: '30天后', value: util.formatDate(now + 30 * 86400000, 'YYYY-MM-DD') }
  ]
})
const presetDueValues = computed(() => duePresets.value.map(item => item.value))
const customDueActive = computed(() => form.value.dueDate && !presetDueValues.value.includes(form.value.dueDate))
const monthInsightText = computed(() => getReminderTip({
  page: 'home',
  bills: billList.value,
  datePrefix: month.value,
  seed: reminderSeed.value
}))
const homeFooterTip = computed(() => getPageFooterTip({
  page: 'home',
  bills: billList.value,
  datePrefix: month.value,
  seed: reminderSeed.value
}))
const isGuestMode = computed(() => getGuestMode())
const getCanUseBook = () => Boolean(getToken()) || getGuestMode()
const getIsGuestMode = () => getGuestMode()

const resetForm = () => {
  const proofMeta = getProofTypeMeta('receipt')
  reminderMode.value = false
  form.value.note = ''
  form.value.tradeType = '凭证'
  form.value.category = proofMeta.name
  form.value.icon = proofMeta.icon
  form.value.color = proofMeta.color
  form.value.proofType = proofMeta.key
  form.value.proofStatus = 'inbox'
  form.value.dueDate = ''
  form.value.remindMuted = false
  form.value.remindEveryOpen = true
  form.value.reimbursementAmount = ''
  form.value.processNote = ''
  form.value.actionKey = 'archive'
  form.value.actionType = proofMeta.actionType
  form.value.date = util.formatDate(Date.now(), 'YYYY-MM-DD HH:mm:ss')
  form.value.imgUrl = ''
  form.value.attachments = []
  pickerValue.value = Date.now()
}

const setProofType = (type) => {
  const proofMeta = getProofTypeMeta(type)
  form.value.proofType = proofMeta.key
  form.value.category = proofMeta.name
  form.value.icon = proofMeta.icon
  form.value.color = proofMeta.color
  form.value.actionType = proofMeta.actionType
  if (!canInputReimbursement.value) form.value.reimbursementAmount = ''
}

const startReminderFlow = () => {
  reminderMode.value = true
  setProofType('important')
  form.value.proofStatus = 'expiring'
  form.value.dueDate = util.formatDate(Date.now() + 30 * 86400000, 'YYYY-MM-DD')
  if (!form.value.note.trim()) form.value.note = '到期/跟进提醒'
  uni.pageScrollTo({ selector: '#proofEditor', duration: 260 })
  proxy.$modal?.msg?.('已切换到提醒事项')
}

const setDuePreset = (date) => {
  form.value.dueDate = date
}

const resolveProofFlow = () => {
  const amount = Number(form.value.reimbursementAmount || 0)
  if (amount > 0 || form.value.proofType === 'reimbursement') {
    return { status: 'todo', actionKey: 'reimburse', actionType: '报销' }
  }
  if (form.value.proofType === 'aftersale') {
    return { status: 'todo', actionKey: 'followup', actionType: '跟进' }
  }
  if (form.value.dueDate) {
    return { status: 'expiring', actionKey: 'remind', actionType: '提醒' }
  }
  return { status: 'archived', actionKey: 'archive', actionType: '归档' }
}

const sanitizeProofAmount = (val) => {
  if (val === '' || val == null) return ''
  let s = String(val).replace(/[^\d.]/g, '')
  while (s.charAt(0) === '.') s = s.slice(1)
  const dotIdx = s.indexOf('.')
  if (dotIdx >= 0) s = s.slice(0, dotIdx + 1) + s.slice(dotIdx + 1).replace(/\./g, '')
  if (s.length > 1 && s.charAt(0) === '0' && s.charAt(1) !== '.') {
    s = s.replace(/^0+/, '')
    if (s === '' || s.charAt(0) === '.') s = '0' + s
  }
  const finalDot = s.indexOf('.')
  if (finalDot >= 0) s = s.slice(0, finalDot + 1) + s.slice(finalDot + 1, finalDot + 3)
  return s
}

const onReimbursementAmountInput = (e) => {
  form.value.reimbursementAmount = sanitizeProofAmount(e.detail.value)
}

const setLocalAttachment = (file) => {
  const filePath = file?.path || file?.tempFilePath
  if (!filePath) return
  form.value.imgUrl = filePath
  form.value.attachments = [{
    type: 'image',
    fileType: String(filePath).split('.').pop() || 'jpg',
    fileName: String(filePath).split('/').pop() || '凭证图片',
    filePath,
    url: filePath,
    fileSize: file.size || 0
  }]
  proxy.$modal?.msgSuccess?.('凭证已添加')
}

const chooseLocalAttachment = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['camera', 'album'],
    success: (res) => setLocalAttachment(res.tempFiles?.[0])
  })
}

const chooseAttachment = async () => {
  if (isGuestMode.value) {
    chooseLocalAttachment()
    return
  }
  try {
    const files = await fileUpload.chooseImage({ count: 1, sourceType: ['camera', 'album'] })
    const file = files?.[0]
    if (!file?.filePath) return
    await fileUpload.saveAttachFileToPlat(files)
    form.value.imgUrl = file.filePath
    form.value.attachments = [{ ...file, url: file.filePath, type: 'image' }]
    proxy.$modal?.msgSuccess?.('凭证已添加')
  } catch (error) {
    proxy.$modal?.msgError?.('图片上传失败，请稍后重试')
  }
}

const removeAttachment = () => {
  form.value.imgUrl = ''
  form.value.attachments = []
}

const getImageUrl = (url) => util.checkFileUrl(url)

const previewImage = (url) => {
  if (!url) return
  uni.previewImage({ urls: [getImageUrl(url)] })
}

const getBillVoucherUrl = (item) => item?.imgUrl || item?.attachments?.[0]?.url || ''

const openBillVoucher = (item) => {
  const url = getBillVoucherUrl(item)
  if (!url) return
  previewImage(url)
}
const previewReminderImage = (item) => {
  const url = getBillVoucherUrl(item)
  if (!url) return
  receiptPreviewUrl.value = getImageUrl(url)
  receiptPreviewShow.value = true
}
const closeReceiptPreview = () => {
  receiptPreviewShow.value = false
  receiptPreviewUrl.value = ''
}

const onDateConfirm = (e) => {
  form.value.date = util.formatDate(e.value, 'YYYY-MM-DD HH:mm:ss')
  pickerValue.value = e.value
  datePickerShow.value = false
}

const onDueConfirm = (e) => {
  form.value.dueDate = util.formatDate(e.value, 'YYYY-MM-DD')
  duePickerValue.value = e.value
  duePickerShow.value = false
}

const saveBill = async () => {
  const hasContent = form.value.imgUrl || form.value.note.trim() || form.value.dueDate || form.value.reimbursementAmount || form.value.proofType !== 'receipt'
  if (!hasContent) {
    proxy.$modal?.msgError?.('请拍照、填写备注或选择提醒日期')
    return
  }
  const now = Date.now()
  const savingReminder = reminderMode.value
  const proofMeta = getProofTypeMeta(form.value.proofType)
  const flow = resolveProofFlow()
  const statusMeta = getProofStatusMeta(flow.status)
  const bill = {
    id: `bill_${now}`,
    tradeType: form.value.tradeType,
    category: proofMeta.name,
    icon: form.value.icon,
    color: form.value.color,
    proofType: proofMeta.key,
    proofStatus: statusMeta.key,
    actionType: flow.actionType,
    actionKey: flow.actionKey,
    dueDate: form.value.dueDate,
    remindMuted: form.value.remindMuted,
    remindEveryOpen: form.value.remindEveryOpen,
    reimbursementAmount: Number(form.value.reimbursementAmount || 0).toFixed(2),
    processNote: form.value.processNote,
    money: '0.00',
    note: form.value.note.trim(),
    date: form.value.date,
    time: form.value.date.slice(11, 16),
    imgUrl: form.value.imgUrl,
    attachments: form.value.attachments
  }
  await userStore.updateMockBillData([bill, ...billList.value])
  resetForm()
  today.value = util.getTodayDate()
  month.value = util.getMonthDate()
  proxy.$modal?.msgSuccess?.(savingReminder ? '提醒事项已保存' : '凭证卡片已保存')
}

const confirmDelete = (item) => {
  uni.showModal({
    title: '删除记录',
    content: `确定删除「${item.note || item.proofTypeName}」吗？`,
    success: async (res) => {
      if (!res.confirm) return
      await userStore.updateMockBillData(billList.value.filter(bill => bill.id !== item.id))
      proxy.$modal?.msgSuccess?.('已删除')
    }
  })
}

const goFinance = () => proxy.$tab.switchTab('/pages/finance/index')
const goProcessReminder = () => {
  reminderPopupShow.value = false
  goFinance()
}
const showNextReminder = () => {
  if (!openReminderRows.value.length) return
  reminderPopupIndex.value = (reminderPopupIndex.value + 1) % openReminderRows.value.length
}

const runAppUpdateCheck = async () => {
  // #ifdef APP-PLUS
  await nextTick()
  await updateModalRef.value?.checkAppUpdate()
  return showUpdateModal.value
  // #endif
  // #ifndef APP-PLUS
  return false
  // #endif
}

const loadData = async () => {
  if (getIsGuestMode()) {
    await userStore.loadBillData()
    return
  }
  await userStore.getInfo()
  await userStore.loadBillData()
}

const updateProof = async (item, patch, toastTitle) => {
  if (!item?.id) return
  const next = billList.value.map(proof => proof.id === item.id
    ? {
        ...proof,
        ...patch,
        updatedAt: util.formatDate(Date.now(), 'YYYY-MM-DD HH:mm:ss')
      }
    : proof)
  await userStore.updateMockBillData(next)
  if (toastTitle) uni.showToast({ title: toastTitle, icon: 'none' })
}
const snoozeReminder = async (item, days) => {
  if (days === 0) {
    await updateProof(item, {
      remindMuted: false,
      remindEveryOpen: true,
      actionType: '提醒',
      reminderNote: '每次打开提醒'
    }, '已设为每次打开提醒')
    reminderPopupShow.value = false
    return
  }
  await updateProof(item, {
    dueDate: util.formatDate(Date.now() + days * 86400000, 'YYYY-MM-DD'),
    proofStatus: 'expiring',
    proofStatusName: '快到期',
    remindMuted: false,
    remindEveryOpen: true,
    actionType: '提醒',
    reminderNote: `${days}天后提醒`
  }, `已设为${days}天后提醒`)
  reminderPopupShow.value = false
}
const muteReminder = async (item) => {
  await updateProof(item, {
    remindMuted: true,
    remindEveryOpen: false,
    actionType: '暂停提醒',
    reminderNote: '不再提醒'
  }, '已关闭提醒')
  reminderPopupShow.value = false
}
const quietTodayReminder = async (item) => {
  await updateProof(item, {
    reminderQuietDate: today.value,
    reminderNote: '今日不提醒',
    remindMuted: false,
    remindEveryOpen: true
  }, '今天不再提醒')
  reminderPopupShow.value = false
}
const remindDueOnOpen = () => {
  if (reminderPopupIndex.value >= openReminderRows.value.length) reminderPopupIndex.value = 0
  reminderPopupShow.value = Boolean(openReminderRows.value.length)
}
const isMonthEndDay = () => {
  const now = new Date()
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return tomorrow.getDate() === 1
}
const getMonthEndQuietKey = () => `month_end_quiet_${today.value}`
const remindMonthEndOnOpen = () => {
  const quietDate = uni.getStorageSync(getMonthEndQuietKey())
  monthEndPopupShow.value = isMonthEndDay() && quietDate !== today.value && monthEndPendingRows.value.length > 0
  if (monthEndPopupShow.value) reminderPopupShow.value = false
}
const closeMonthEndPopupToday = () => {
  uni.setStorageSync(getMonthEndQuietKey(), today.value)
  monthEndPopupShow.value = false
}
const goMonthEndProcess = () => {
  closeMonthEndPopupToday()
  goFinance()
}

onLoad(() => {
  if (!getCanUseBook()) {
    proxy.$tab.reLaunch('/pages/login')
    return
  }
  if (getIsGuestMode()) {
    userStore.loadBillData()
    return
  }
  userStore.getInfo().then(async res => {
    if (res.borrowFlag === 1) {
      const updateVisible = await runAppUpdateCheck()
      if (!updateVisible) proxy.$tab.reLaunch('/pages/mine/agreement/agreement')
      return
    }
    await userStore.loadBillData()
  })
})

onShow(async () => {
  today.value = util.getTodayDate()
  month.value = util.getMonthDate()
  reminderSeed.value = Date.now()
  if (getCanUseBook()) {
    await loadData()
    remindMonthEndOnOpen()
    if (!monthEndPopupShow.value) remindDueOnOpen()
  }
})
</script>

<style lang="scss" scoped>
.book-page {
  position: relative;
  overflow-x: hidden;
  padding: 0 28rpx 150rpx;
  background:
    linear-gradient(180deg, rgba(235, 245, 255, 0.94) 0%, rgba(247, 251, 255, 0.98) 34%, #ffffff 76%),
    #ffffff;
  color: #101722;
}

.hero {
  position: relative;
  min-height: 430rpx;
  overflow: hidden;
}

.hero-art {
  position: absolute;
  right: -190rpx;
  top: 70rpx;
  width: 620rpx;
  height: 420rpx;
  opacity: 0.98;
  pointer-events: none;
}

.brand-row,
.quick-actions,
.section-head,
.stack-body,
.review-call,
.entry-head,
.date-line,
.attachment-preview,
.motto {
  display: flex;
  align-items: center;
}

.brand-row {
  position: relative;
  z-index: 1;
  justify-content: space-between;
  gap: 24rpx;
}

.brand-title {
  color: #101722;
  font-size: 58rpx;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0;
}

.tagline {
  margin-top: 16rpx;
  color: #4f5d70;
  font-size: 27rpx;
  font-weight: 500;
}

.hero-copy {
  position: relative;
  z-index: 1;
  margin-top: 76rpx;
  max-width: 360rpx;
}

.hello,
.hero-title {
  color: #111923;
  font-size: 48rpx;
  font-weight: 900;
  line-height: 1.26;
}

.date-chip {
  display: inline-flex;
  margin-top: 24rpx;
  padding-top: 18rpx;
  border-top: 8rpx solid #ffcf24;
  color: #566377;
  font-size: 28rpx;
}

.quick-actions {
  gap: 20rpx;
  margin-top: 18rpx;
}

.urgent-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 22rpx;
  padding: 22rpx;
  border-radius: 28rpx;
  background: #fff3bf;
  box-shadow: 0 18rpx 38rpx rgba(171, 130, 24, 0.14);
}

.urgent-mark {
  width: 52rpx;
  height: 52rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #ffc51f;
  color: #101722;
  font-size: 28rpx;
  font-weight: 900;
  flex-shrink: 0;
}

.urgent-card > view:nth-child(2) {
  min-width: 0;
  flex: 1;
}

.urgent-card > view:nth-child(2) view {
  color: #101722;
  font-size: 28rpx;
  font-weight: 900;
}

.urgent-card text {
  display: block;
  margin-top: 8rpx;
  color: #5d697b;
  font-size: 22rpx;
  line-height: 1.4;
}

.capture-action,
.manual-action {
  flex: 1;
  min-height: 132rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 22rpx;
  border-radius: 28rpx;
  box-shadow: 0 18rpx 36rpx rgba(53, 86, 128, 0.12);
}

.capture-action {
  background: linear-gradient(135deg, #ffd936 0%, #ffc51f 100%);
}

.manual-action {
  background: #ffffff;
  border: 1rpx solid #edf2f8;
}

.capture-action view view,
.manual-action view view {
  color: #101722;
  font-size: 31rpx;
  font-weight: 900;
  white-space: nowrap;
}

.capture-action text,
.manual-action text {
  display: block;
  margin-top: 8rpx;
  color: #647286;
  font-size: 22rpx;
  line-height: 1.3;
}

.proof-section,
.stack-card,
.entry-panel {
  margin-top: 26rpx;
  padding: 26rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.94);
  border: 1rpx solid #edf2f8;
  box-shadow: 0 18rpx 46rpx rgba(53, 86, 128, 0.08);
}

.section-head {
  justify-content: space-between;
  gap: 20rpx;
}

.section-title,
.stack-title,
.overview-title,
.entry-title {
  color: #101722;
  font-size: 31rpx;
  font-weight: 900;
}

.section-head text,
.entry-head text {
  display: block;
  margin-top: 8rpx;
  color: #6b778a;
  font-size: 23rpx;
}

.section-link,
.preview-btn {
  flex-shrink: 0;
  color: #5b6676;
  font-size: 24rpx;
}

.proof-scroll {
  width: 100%;
  margin-top: 22rpx;
  white-space: nowrap;
}

.proof-row {
  display: inline-flex;
  gap: 18rpx;
}

.proof-card {
  position: relative;
  width: 190rpx;
  padding-right: 18rpx;
  border-right: 1rpx solid #edf2f8;
}

.proof-delete {
  position: absolute;
  right: 24rpx;
  top: -10rpx;
  z-index: 2;
  width: 40rpx;
  height: 40rpx;
  line-height: 36rpx;
  border: 2rpx solid #ffffff;
  border-radius: 50%;
  background: #fff4f2;
  color: #e6533d;
  text-align: center;
  font-size: 30rpx;
  font-weight: 500;
  box-sizing: border-box;
  box-shadow: 0 8rpx 18rpx rgba(230, 83, 61, 0.18);
}

.proof-img {
  width: 144rpx;
  height: 180rpx;
  border-radius: 18rpx;
  background: #eef5ff;
}

.proof-date {
  margin-top: 12rpx;
  color: #101722;
  font-size: 27rpx;
  font-weight: 800;
}

.proof-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 8rpx;
  color: #101722;
  font-size: 25rpx;
  font-weight: 700;
}

.proof-tag {
  display: block;
  max-width: 144rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 12rpx;
  padding: 7rpx 10rpx;
  border-radius: 999rpx;
  background: #dff8ec;
  color: #15935d;
  font-size: 20rpx;
  font-weight: 700;
  line-height: 1.2;
  box-sizing: border-box;
}

.proof-tag.pending {
  background: #fff0e9;
  color: #e6533d;
}

.empty-proof {
  display: flex;
  align-items: center;
  gap: 22rpx;
  margin-top: 18rpx;
}

.empty-proof image {
  width: 150rpx;
  height: 120rpx;
  flex-shrink: 0;
}

.empty-proof view view {
  color: #101722;
  font-size: 28rpx;
  font-weight: 800;
}

.empty-proof text {
  display: block;
  margin-top: 8rpx;
  color: #6b778a;
  font-size: 23rpx;
  line-height: 1.45;
}

.stack-progress {
  color: #ff5e45;
  font-size: 27rpx;
  font-weight: 900;
}

.stack-body {
  gap: 22rpx;
  margin-top: 24rpx;
}

.stack-body image {
  width: 160rpx;
  height: 126rpx;
  flex-shrink: 0;
}

.stack-metrics {
  width: 150rpx;
  flex-shrink: 0;
}

.stack-metrics > text {
  color: #6b778a;
  font-size: 23rpx;
}

.stack-metrics > view {
  margin: 8rpx 0;
  color: #101722;
  font-size: 56rpx;
  font-weight: 900;
  line-height: 1;
}

.stack-metrics view text {
  margin-left: 6rpx;
  font-size: 24rpx;
  font-weight: 700;
}

.progress-wrap {
  flex: 1;
  min-width: 0;
}

.progress-bar {
  overflow: hidden;
  height: 22rpx;
  border-radius: 999rpx;
  background: #edf2f8;
}

.progress-bar view {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #ffd11f 0%, #ffc012 100%);
}

.progress-scale {
  display: flex;
  justify-content: space-between;
  margin-top: 16rpx;
  color: #7c8797;
  font-size: 21rpx;
}

.review-call {
  gap: 18rpx;
  margin-top: 24rpx;
  padding-top: 22rpx;
  border-top: 1rpx solid #edf2f8;
}

.review-call > view:nth-child(2) {
  flex: 1;
  min-width: 0;
}

.review-call view view {
  color: #101722;
  font-size: 27rpx;
  font-weight: 800;
}

.review-call text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 8rpx;
  color: #6b778a;
  font-size: 22rpx;
}

.preview-btn {
  padding: 12rpx 18rpx;
  border-radius: 18rpx;
  background: #f0f5fb;
}

.overview-title {
  margin: 32rpx 8rpx 18rpx;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14rpx;
}

.overview-card {
  min-width: 0;
  min-height: 142rpx;
  padding: 18rpx 10rpx;
  border: 1rpx solid #edf2f8;
  border-radius: 22rpx;
  background: #fff;
  text-align: center;
  box-shadow: 0 12rpx 28rpx rgba(53, 86, 128, 0.06);
}

.overview-card view {
  margin-top: 12rpx;
  color: #101722;
  font-size: 22rpx;
  font-weight: 800;
}

.overview-card text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 8rpx;
  color: #657287;
  font-size: 21rpx;
}

.overview-card text.danger {
  color: #f0543f;
}

.entry-panel {
  margin-top: 28rpx;
}

.entry-head {
  justify-content: space-between;
  gap: 18rpx;
}

.mini-camera {
  width: 66rpx;
  height: 66rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20rpx;
  background: #ffcf24;
  flex-shrink: 0;
}

.primary-btn {
  background: #101722;
  color: #ffffff;
}

.selector-title {
  margin: 26rpx 0 14rpx;
  color: #4f5d70;
  font-size: 23rpx;
  font-weight: 900;
}

.proof-type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14rpx;
}

.proof-type {
  min-height: 126rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  border: 1rpx solid #dfeaf8;
  border-radius: 22rpx;
  background: #f7fbff;
  color: #4f5d70;
  font-size: 23rpx;
  font-weight: 900;
}

.proof-type view {
  width: 52rpx;
  height: 52rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18rpx;
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 900;
}

.proof-type.active {
  border-color: rgba(255, 207, 36, 0.8);
  background: #fff9dc;
  color: #101722;
  box-shadow: 0 12rpx 26rpx rgba(255, 197, 31, 0.14);
}

.due-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.due-chip {
  padding: 13rpx 18rpx;
  border: 1rpx solid #dfeaf8;
  border-radius: 999rpx;
  background: #ffffff;
  color: #5d697b;
  font-size: 23rpx;
  font-weight: 800;
}

.due-chip.active {
  border-color: rgba(61, 139, 255, 0.34);
  background: #eef6ff;
  color: #2f6faf;
}

.due-chip.custom {
  border-color: rgba(255, 197, 31, 0.5);
  color: #9a7438;
}

.amount-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 22rpx;
  padding: 20rpx;
  border: 1rpx solid #dfeaf8;
  border-radius: 24rpx;
  background: #f8fbff;
}

.amount-card view {
  min-width: 0;
}

.amount-card text {
  display: block;
}

.amount-card text:first-child {
  color: #101722;
  font-size: 27rpx;
  font-weight: 900;
}

.amount-card text:last-child {
  margin-top: 6rpx;
  color: #6b778a;
  font-size: 21rpx;
}

.amount-card input {
  width: 180rpx;
  height: 68rpx;
  color: #101722;
  text-align: right;
  font-size: 34rpx;
  font-weight: 900;
}

.amount-ph {
  color: #b8c4d3;
}

.note-input {
  width: 100%;
  min-height: 58rpx;
  margin-top: 4rpx;
  color: #273142;
  font-size: 27rpx;
  line-height: 1.55;
}

.note-placeholder {
  color: #9aa6b6;
}

.attachment-preview {
  gap: 18rpx;
  margin-top: 18rpx;
  padding: 16rpx;
  border: 1rpx solid #dfeaf8;
  border-radius: 22rpx;
  background: #f6faff;
}

.attachment-preview image {
  width: 86rpx;
  height: 86rpx;
  border-radius: 18rpx;
}

.attachment-info {
  flex: 1;
  min-width: 0;
}

.attachment-title {
  color: #101722;
  font-size: 26rpx;
  font-weight: 800;
}

.attachment-sub {
  margin-top: 8rpx;
  color: #6b778a;
  font-size: 22rpx;
}

.remove-attach {
  color: #f0543f;
  font-size: 24rpx;
}

.date-line {
  justify-content: space-between;
  margin-top: 18rpx;
  padding: 16rpx 0;
  border-top: 1rpx solid #edf2f8;
  border-bottom: 1rpx solid #edf2f8;
}

.date-label {
  color: #6b778a;
  font-size: 22rpx;
}

.date-value {
  margin-left: 18rpx;
  color: #273142;
  font-size: 24rpx;
}

.lifecycle-preview {
  margin: 22rpx 0 28rpx;
  padding: 18rpx 20rpx;
  border: 1rpx solid #d9e8fb;
  border-radius: 22rpx;
  background: #eef6ff;
}

.lifecycle-preview view {
  color: #2f6faf;
  font-size: 22rpx;
  font-weight: 900;
}

.lifecycle-preview text {
  display: block;
  margin-top: 8rpx;
  color: #101722;
  font-size: 25rpx;
  font-weight: 800;
}

.primary-btn {
  height: 96rpx;
  line-height: 96rpx;
  border-radius: 999rpx;
  text-align: center;
  font-size: 34rpx;
  font-weight: 900;
  box-shadow: 0 18rpx 34rpx rgba(16, 23, 34, 0.2);
}

.motto {
  gap: 14rpx;
  margin: 32rpx 0 0;
  padding: 18rpx 22rpx;
  border: 1rpx solid #d9e8fb;
  border-radius: 22rpx;
  background: #eef6ff;
  color: #5b6676;
  font-size: 24rpx;
  line-height: 1.5;
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

.month-end-popup {
  width: 610rpx;
  padding: 34rpx 30rpx 30rpx;
  border-radius: 28rpx;
  background: #ffffff;
  text-align: center;
}

.month-end-count {
  margin-top: 18rpx;
  color: #101722;
  font-size: 82rpx;
  line-height: 1;
  font-weight: 900;
}

.month-end-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
  margin-top: 22rpx;
}

.month-end-meta > view {
  min-width: 0;
  padding: 16rpx 10rpx;
  border-radius: 20rpx;
  background: #f8fbff;
}

.month-end-meta text {
  display: block;
  color: #6b778a;
  font-size: 20rpx;
}

.month-end-meta view view {
  margin-top: 10rpx;
  color: #101722;
  font-size: 34rpx;
  line-height: 1;
  font-weight: 900;
}

.month-end-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12rpx;
  margin-top: 28rpx;
}

.month-end-actions view {
  height: 76rpx;
  line-height: 76rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  font-weight: 900;
}

.month-end-actions .ghost {
  border: 1rpx solid #dfeaf8;
  background: #ffffff;
  color: #5d697b;
}

.month-end-actions .primary {
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
</style>
