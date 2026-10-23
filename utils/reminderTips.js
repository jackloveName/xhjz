import {
  getProofStats,
  getProofTypeSummary,
  normalizeBillList
} from '@/utils/proofArchive'

export const REMINDER_TIP_REPOSITORY = {
  home: {
    no_data: [
      '先收下今天的第一张凭证，本月堆栈会慢慢变完整。',
      '今天还没有凭证，拍照、报销、售后或到期提醒都可以先放进待整理箱。',
      '第一张凭证不用完美，收下来就已经很好。'
    ],
    pending_high: [
      '待处理事项有点多，可以先处理带有到期日期的凭证。',
      '待整理箱里已经有不少内容，先归档最近的一两张会轻松很多。',
      '今天适合清一下待处理凭证，给后面的查询留出秩序。'
    ],
    expiring: [
      '有凭证快到期了，优先检查重要凭证、报销或售后证据。',
      '近期有需要跟进的凭证，打开处理中心会更稳妥。',
      '到期凭证适合提前看一眼，避免临时翻找。'
    ],
    voucher_low: [
      '图片凭证还不多，重要材料可以顺手拍照留存。',
      '备注和图片越完整，后续报销、售后或核对越省力。',
      '先补齐关键凭证图片，之后查找会更快。'
    ],
    steady: [
      '本月已经覆盖 {activeDays} 天，凭证岛正在变得可靠。',
      '收纳节奏很稳定，本月统计会更清楚。',
      '每张凭证都在帮你保留生活里的关键证据。'
    ],
    general: [
      '补充图片、备注和提醒日期，本月统计会更有用。',
      '已归档的凭证点一下就能查看图片。',
      '长按今日凭证可以删除误收的内容。'
    ]
  },
  mine: {
    no_data: [
      '先收下几张凭证，这里会慢慢显示你的记录天数和归档数量。',
      '凭证岛会随着记录变丰富，今天可以从一张小票或重要凭证开始。',
      '当凭证积累起来，你会更容易找回需要的证据。'
    ],
    pending_high: [
      '待处理事项偏多，今天适合收尾一两条。',
      '待整理凭证会影响后续查找，先归档近期内容会更顺手。',
      '处理中心还有事项，按类型筛选会更快。'
    ],
    expiring: [
      '有快到期凭证，建议提前查看相关图片和备注。',
      '近期提醒已经出现，别让重要材料沉在待办里。',
      '快到期项目可以先处理，后面会轻松不少。'
    ],
    voucher_low: [
      '图片凭证还不多，重要材料可以顺手拍一张。',
      '凭证多一点，之后核对和查找会更放心。',
      '关键凭证留图片，普通凭证留备注，凭证岛会更完整。'
    ],
    steady: [
      '已经记录 {activeDays} 天，习惯一旦养成，复盘就轻松了。',
      '凭证数据正在变扎实，继续保持就很好。',
      '每次打开都顺手看一眼本月概览，待办进度会更清楚。'
    ],
    general: [
      '定期看一眼本月概览，可以更早发现待办和到期事项。',
      '昵称、头像和凭证岛一起完善，会更有自己的使用感。',
      '把凭证收清楚，就是给生活留一份可回看的秩序。'
    ]
  }
}

const MONTHLY_LIFE_TIP_REPOSITORY = {
  no_data: [
    '这个月还没有凭证，先从一张小票开始，不用一次整理完整。',
    '月初可以先把报销、售后、重要材料这三类想一遍，遇到就顺手收。',
    '如果最近没有凭证，也可以把旧相册里的关键票据补进来。',
    '空月份不用焦虑，真正需要的是关键材料不丢。',
    '本月第一张凭证建议选最容易遗漏的那张，比如快递售后或报销小票。',
    '先收图片，再补备注，比等信息齐了再记录更容易坚持。',
    '这个月可以把凭证整理当成一个轻习惯，看到就拍一下。',
    '没有记录时，最适合先设一个重要凭证提醒，给后续留入口。'
  ],
  pending_high: [
    '待处理偏多，先处理有金额或到期日期的凭证，收益最大。',
    '把待处理分成“今天能完成”和“需要等结果”两类，会轻松很多。',
    '报销类凭证建议补上金额和备注，后面核对到账会更稳。',
    '待办堆起来时，不要全清，先收尾一条最紧的。',
    '如果某张凭证暂时无法处理，给它设一个新提醒，比放着不管更安全。',
    '待处理超过 3 项时，可以优先看快到期，再看报销，再看售后。',
    '处理凭证时顺手写一句结果备注，下次打开就不用重新回忆。',
    '积压的凭证适合按日期处理，越早到期越先看。'
  ],
  expiring: [
    '本月有快到期凭证，建议今天先打开图片确认材料是否完整。',
    '快到期项目最好写清楚下一步：联系谁、等什么、什么时候再看。',
    '到期提醒不要只改日期，能处理就直接处理，避免反复顺延。',
    '重要凭证到期前，最好检查图片是否清晰、备注是否能看懂。',
    '如果到期事项还不能完成，可以点今日不提醒，但别关闭提醒。',
    '快到期凭证超过一条时，先处理金额最高或影响最大的那条。',
    '到期凭证建议保留处理结果，之后查售后或报销会更省心。',
    '提醒出现时就是处理入口，不要再回到相册里找第二遍。'
  ],
  voucher_low: [
    '本月图片凭证偏少，重要凭证尽量补图，文字备注不如图片稳。',
    '没有图片的凭证后续很难证明来源，能补拍就补拍一张。',
    '小票容易褪色，拍照比保存纸质更可靠。',
    '如果凭证只写了备注，建议补一张截图或照片作为依据。',
    '图片不需要拍得很漂亮，但金额、日期、商户要尽量清楚。',
    '报销或售后相关材料，图片完整度比数量更重要。',
    '本月可以优先补齐待处理凭证的图片。',
    '看到票据先拍，整理备注可以晚一点。'
  ],
  reimbursement: [
    '本月报销材料较多，建议每张都填金额，月底核对会更快。',
    '报销凭证最好在备注里写用途，例如餐费、交通、采购或项目名。',
    '提交报销后别直接归档，等到账或确认通过后再完成。',
    '报销金额多时，可以每周固定看一次处理队列。',
    '报销凭证建议保留原小票和提交截图，两个证据更完整。',
    '如果不知道何时到账，先设 7 天或 30 天提醒，不要关闭。',
    '报销材料缺信息时，备注里写清楚缺什么，避免下次重新排查。',
    '本月报销多，统计里可以按月份回看处理率。'
  ],
  aftersale: [
    '售后凭证要记录沟通结果，单有小票通常不够。',
    '售后材料建议补上订单号、商品型号或客服回复摘要。',
    '如果售后还在等结果，设置 3 天或 7 天提醒比较合适。',
    '售后凭证完成后写一句处理结果，下次查问题会更快。',
    '本月售后偏多，可以先检查哪些还没给出明确答复。',
    '退换货类凭证最好保存物流截图或取件凭证。',
    '售后证据链越完整，后续争议越好处理。',
    '售后跟进不要只看日期，也要看备注里的下一步。'
  ],
  important: [
    '重要凭证建议都设提醒日期，别只放进相册。',
    '重要材料最好备注用途，例如保修、合同、会员、押金或证明。',
    '这类凭证不一定多，但每一张都值得把图片拍清楚。',
    '重要凭证适合用 30 天提醒做复查，避免长期沉底。',
    '如果重要凭证没有明确到期日，可以先设一个自定义日期。',
    '重要材料归档前，确认图片和备注能让未来的你看懂。',
    '本月重要凭证多，建议定期看处理中心，不要只看相册。',
    '重要凭证的价值在“需要时找得到”，不是记录数量。'
  ],
  receipt_heavy: [
    '本月小票较多，普通小票可以直接归档，别都变成待处理。',
    '小票多的时候，只有报销、售后、重要金额需要额外备注。',
    '日常小票不用过度分类，能查到图片和日期就够用。',
    '如果小票是为了报销，记得填金额，否则容易被当成普通归档。',
    '小票数量多时，相册按月份查看会更清楚。',
    '普通消费小票建议当天收，过几天再补很容易忘。',
    '小票拍照时尽量让总价和日期在画面里。',
    '本月小票多，月底可以只处理有提醒或有金额的部分。'
  ],
  archived_good: [
    '本月处理率不错，保持“有结果就归档”的节奏就很好。',
    '归档率高说明闭环比较完整，接下来重点看快到期提醒。',
    '已归档凭证多时，相册就是你的查找入口。',
    '这个月处理得比较干净，可以把精力放在新凭证及时收纳上。',
    '归档做得好，月底统计会更可信。',
    '保持当前节奏：普通凭证归档，未完成事项进待办。',
    '如果大部分已归档，说明这个月没有太多悬而未决的材料。',
    '处理率高时，别忘了检查图片是否完整。'
  ],
  steady: [
    '本月记录比较稳定，可以每周花一分钟看一次统计。',
    '连续记录比一次性大整理更可靠。',
    '凭证分布稳定时，重点关注待处理和快到期，而不是数量。',
    '本月已经形成节奏，继续保持“收下、提醒、处理、归档”。',
    '稳定记录能帮你更快发现异常月份，比如报销突然变多。',
    '每周看一眼统计，比月底补账式整理轻松。',
    '如果本月每天都有收纳，说明这个工具已经进入真实使用场景。',
    '稳定月份适合复查一次旧提醒，避免长期悬挂。'
  ]
}

const hashText = (val) => {
  return String(val).split('').reduce((hash, char) => {
    return ((hash << 5) - hash + char.charCodeAt(0)) | 0
  }, 0)
}

const todaySeed = () => {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
}

const pickTip = (tips, seedParts = []) => {
  const list = Array.isArray(tips) && tips.length ? tips : REMINDER_TIP_REPOSITORY.home.general
  const seed = hashText([todaySeed(), ...seedParts].join('|'))
  return list[Math.abs(seed) % list.length]
}

const formatTip = (template, data) => {
  return Object.keys(data).reduce((text, key) => {
    return text.replace(new RegExp(`\\{${key}\\}`, 'g'), data[key])
  }, template)
}

const getBillInfo = ({ bills, datePrefix = '' }) => {
  const normalized = normalizeBillList(bills)
  const scopeBills = normalized.filter(item => !datePrefix || String(item.date).startsWith(datePrefix))
  const stats = getProofStats(normalized, datePrefix)
  const typeRows = getProofTypeSummary(normalized, datePrefix)
  const topType = typeRows.slice().sort((a, b) => b.count - a.count)[0] || null
  const activeDays = new Set(scopeBills.map(item => String(item.date || '').slice(0, 10))).size
  const voucherCount = scopeBills.filter(item => item.imgUrl || item.attachments?.length).length

  return {
    bills: scopeBills,
    stats,
    topType,
    activeDays,
    voucherCount,
    voucherRate: scopeBills.length ? Math.round((voucherCount / scopeBills.length) * 100) : 0
  }
}

const resolveScenario = (info) => {
  if (!info.bills.length) return 'no_data'
  if (info.stats.expiring > 0) return 'expiring'
  if (info.stats.pending >= 4 || (info.bills.length >= 3 && info.stats.pending >= info.bills.length * 0.5)) return 'pending_high'
  if (info.bills.length >= 3 && info.voucherRate < 35) return 'voucher_low'
  if (info.activeDays >= 8) return 'steady'
  return 'general'
}

const buildTipData = (info) => ({
  activeDays: info.activeDays,
  mainType: info.topType?.name || '主要类型',
  pending: info.stats.pending,
  voucherRate: info.voucherRate
})

const pickManyTips = (pool, seedParts = [], limit = 3) => {
  const list = Array.isArray(pool) ? pool.filter(Boolean) : []
  if (!list.length) return []
  const start = Math.abs(hashText([todaySeed(), ...seedParts].join('|'))) % list.length
  const result = []
  for (let i = 0; i < list.length && result.length < limit; i++) {
    const tip = list[(start + i) % list.length]
    if (!result.includes(tip)) result.push(tip)
  }
  return result
}

const getMonthlyTipScenarios = (info) => {
  const scenarios = []
  const byType = info.stats.byType || {}
  if (!info.bills.length) scenarios.push('no_data')
  if (info.stats.expiring > 0) scenarios.push('expiring')
  if (info.stats.pending >= 2 || (info.bills.length >= 3 && info.stats.pending >= info.bills.length * 0.4)) scenarios.push('pending_high')
  if (info.bills.length >= 2 && info.voucherRate < 50) scenarios.push('voucher_low')
  if ((byType.reimbursement || 0) > 0) scenarios.push('reimbursement')
  if ((byType.aftersale || 0) > 0) scenarios.push('aftersale')
  if ((byType.important || 0) > 0) scenarios.push('important')
  if ((byType.receipt || 0) >= Math.max(3, info.bills.length * 0.5)) scenarios.push('receipt_heavy')
  if (info.bills.length >= 3 && info.stats.archived / info.bills.length >= 0.75) scenarios.push('archived_good')
  if (info.activeDays >= 5) scenarios.push('steady')
  if (!scenarios.length) scenarios.push('steady')
  return scenarios
}

export const getReminderTip = ({
  page = 'home',
  bills = [],
  datePrefix = '',
  seed = ''
} = {}) => {
  const info = getBillInfo({ bills, datePrefix })
  const scenario = resolveScenario(info)
  const pool = REMINDER_TIP_REPOSITORY[page]?.[scenario] || REMINDER_TIP_REPOSITORY[page]?.general || REMINDER_TIP_REPOSITORY.home.general
  const template = pickTip(pool, [page, 'main', scenario, datePrefix, info.bills.length, info.stats.pending, seed])
  return formatTip(template, buildTipData(info))
}

export const getPageFooterTip = ({
  page = 'home',
  bills = [],
  datePrefix = '',
  yearPrefix = '',
  seed = ''
} = {}) => {
  const info = getBillInfo({ bills, datePrefix })
  const scenario = resolveScenario(info)
  const pool = REMINDER_TIP_REPOSITORY[page]?.[scenario] || REMINDER_TIP_REPOSITORY[page]?.general || REMINDER_TIP_REPOSITORY.home.general
  const template = pickTip(pool, [page, 'footer', scenario, datePrefix, yearPrefix, info.bills.length, seed])
  return formatTip(template, buildTipData(info))
}

export const getMonthlyLifeTips = ({
  bills = [],
  datePrefix = '',
  seed = '',
  limit = 3
} = {}) => {
  const info = getBillInfo({ bills, datePrefix })
  const scenarios = getMonthlyTipScenarios(info)
  const data = buildTipData(info)
  const tips = scenarios.flatMap((scenario) => pickManyTips(
    MONTHLY_LIFE_TIP_REPOSITORY[scenario],
    ['monthly-life', scenario, datePrefix, info.bills.length, info.stats.pending, info.voucherRate, seed],
    2
  ))
  const unique = tips.filter((tip, index) => tips.indexOf(tip) === index).slice(0, limit)
  return unique.map(tip => formatTip(tip, data))
}
