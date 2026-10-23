import util from '@/utils/utils'

export const PROOF_TYPES = [
  { key: 'receipt', name: '消费小票', shortName: '小票', icon: '票', color: '#3d8bff', actionType: '归档' },
  { key: 'reimbursement', name: '报销材料', shortName: '报销', icon: '报', color: '#ff724b', actionType: '待处理' },
  { key: 'aftersale', name: '售后凭证', shortName: '售后', icon: '售', color: '#ffc51f', actionType: '跟进' },
  { key: 'important', name: '重要凭证', shortName: '重要', icon: '证', color: '#25bf75', actionType: '提醒' }
]

export const PROOF_STATUS = [
  { key: 'inbox', name: '待整理', icon: '收', color: '#7aa8d8' },
  { key: 'archived', name: '已归档', icon: '档', color: '#25bf75' },
  { key: 'todo', name: '待处理', icon: '办', color: '#ff724b' },
  { key: 'expiring', name: '快到期', icon: '期', color: '#ffc51f' }
]

export const REMINDER_PRESETS = [
  { label: '每次打开提醒', shortLabel: '每次打开', days: 0 },
  { label: '明天提醒', shortLabel: '明天', days: 1 },
  { label: '3天后提醒', shortLabel: '3天后', days: 3 },
  { label: '7天后提醒', shortLabel: '7天后', days: 7 },
  { label: '30天后提醒', shortLabel: '30天后', days: 30 },
  { label: '不再提醒', shortLabel: '关闭', days: -1 }
]

export const PROOF_TYPE_MAP = PROOF_TYPES.reduce((map, item) => {
  map[item.key] = item
  return map
}, {})

export const PROOF_STATUS_MAP = PROOF_STATUS.reduce((map, item) => {
  map[item.key] = item
  return map
}, {})

const LEGACY_PROOF_TYPE_MAP = {
  warranty: 'important',
  subscription: 'important',
  contract: 'important'
}

export const getNormalizedProofType = (proofType = 'receipt') => LEGACY_PROOF_TYPE_MAP[proofType] || proofType || 'receipt'

export const getProofTypeMeta = (proofType = 'receipt') => PROOF_TYPE_MAP[getNormalizedProofType(proofType)] || PROOF_TYPES[0]

export const getProofStatusMeta = (proofStatus = 'inbox') => PROOF_STATUS_MAP[proofStatus] || PROOF_STATUS[0]

export const getProofTypeSummary = (list, datePrefix = '') => {
  const stats = getProofStats(list, datePrefix)
  const total = Math.max(1, stats.total)
  return PROOF_TYPES.map(item => {
    const count = stats.byType[item.key] || 0
    return {
      ...item,
      count,
      percent: Math.max(count ? 8 : 0, Math.round((count / total) * 100))
    }
  })
}

export const getProofStatusSummary = (list, datePrefix = '') => {
  const stats = getProofStats(list, datePrefix)
  const total = Math.max(1, stats.total)
  return PROOF_STATUS.map(item => {
    const count = stats.byStatus[item.key] || 0
    return {
      ...item,
      count,
      percent: Math.max(count ? 8 : 0, Math.round((count / total) * 100))
    }
  })
}

export const normalizeBillList = (val) => {
  if (!Array.isArray(val)) return []
  return val
    .filter(item => item && typeof item === 'object')
    .map((item) => {
      const proofType = getNormalizedProofType(item.proofType || item.evidenceType || 'receipt')
      const proofMeta = getProofTypeMeta(proofType)
      const category = proofMeta.name
      const date = item.date || item.createTime || util.formatDate(Date.now(), 'YYYY-MM-DD HH:mm:ss')
      const imgUrl = item.imgUrl || item.imageUrl || item.attachmentUrl || item.attachments?.[0]?.url || ''
      const attachments = Array.isArray(item.attachments)
        ? item.attachments
        : imgUrl
          ? [{ type: 'image', url: imgUrl }]
          : []
      const proofStatus = item.proofStatus || (imgUrl || attachments.length ? 'archived' : 'inbox')
      return {
        id: item.id || `bill_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        tradeType: '凭证',
        category,
        proofType,
        proofTypeName: proofMeta.name,
        proofStatus,
        proofStatusName: getProofStatusMeta(proofStatus).name,
        actionKey: item.actionKey || '',
        actionType: item.actionType || proofMeta.actionType,
        dueDate: item.dueDate || '',
        handledAt: item.handledAt || '',
        updatedAt: item.updatedAt || '',
        reminderNote: item.reminderNote || '',
        reminderQuietDate: item.reminderQuietDate || '',
        remindMuted: Boolean(item.remindMuted),
        remindEveryOpen: item.remindEveryOpen !== false,
        processNote: item.processNote || '',
        reimbursementAmount: Number(item.reimbursementAmount || item.money || item.amount || 0).toFixed(2),
        ownerTag: item.ownerTag || '',
        icon: proofMeta.icon,
        color: proofMeta.color,
        money: Number(item.money || item.amount || 0).toFixed(2),
        note: item.note || item.remark || '',
        shop: item.shop || '',
        date,
        time: item.time || String(date).slice(11, 16) || '',
        imgUrl,
        attachments
      }
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export const getProofStats = (list, datePrefix = '') => {
  const matched = normalizeBillList(list).filter(item => !datePrefix || String(item.date).startsWith(datePrefix))
  const today = util.getTodayDate()
  return matched.reduce((stats, item) => {
    stats.total += 1
    if (item.imgUrl || item.attachments.length) stats.archived += 1
    if (item.proofStatus === 'todo' || item.proofStatus === 'inbox') stats.pending += 1
    if (item.proofStatus === 'expiring' || (item.dueDate && String(item.dueDate).slice(0, 10) <= today)) stats.expiring += 1
    stats.byType[item.proofType] = (stats.byType[item.proofType] || 0) + 1
    stats.byStatus[item.proofStatus] = (stats.byStatus[item.proofStatus] || 0) + 1
    return stats
  }, {
    total: 0,
    archived: 0,
    pending: 0,
    expiring: 0,
    byType: {},
    byStatus: {}
  })
}

export const getDateTitle = (date) => {
  const target = new Date(date)
  const today = new Date()
  const sameYear = target.getFullYear() === today.getFullYear()
  const mm = String(target.getMonth() + 1).padStart(2, '0')
  const dd = String(target.getDate()).padStart(2, '0')
  const prefix = sameYear ? `${mm}月${dd}日` : `${target.getFullYear()}年${mm}月${dd}日`
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][target.getDay()]
  return `${prefix} ${week}`
}
