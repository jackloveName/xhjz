<template>
  <view class="charts-box">
    <!-- 使用动态的 canvasId，防止路由切换时上下文被缓存污染 -->
    <qiun-data-charts
      v-if="showChart"
      :canvasId="dynamicId"
      type="arcbar"
      :opts="opts"
      :chartData="chartData"
    />
    <view class="center-text">
      <view class="center-value">{{ intake }}<text> kcal</text></view>
      <view class="center-label">已摄入 / {{ burn || '--' }}</view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  intake: {
    type: Number,
    default: 0
  },
  burn: {
    type: Number,
    default: 0
  }
})

const chartData = ref({})
const showChart = ref(false)
const dynamicId = ref('arc_' + Date.now()) // 动态 ID
let renderTimer = null
let isMounted = false // 记录 DOM 是否准备好

const opts = ref({
  color: ['#ffffff'],
  title: { name: '' },
  subtitle: { name: '' },
  extra: {
    arcbar: {
      type: 'circle',
      width: 12,
      backgroundColor: 'rgba(255,255,255,0.22)',
      startAngle: 1.5,
      endAngle: 1.5,
      gap: 2,
      lineCap: 'round'
    }
  }
})

// 抽离统一的渲染逻辑
const renderChart = () => {
  // 核心拦截：如果 DOM 还没挂载，绝对不许渲染图表
  if (!isMounted) return

  // 先把图表从页面卸载
  showChart.value = false

  let progress = 0
  if (props.burn && props.burn > 0) {
    progress = Math.min(1, Math.max(0, Number(props.intake || 0) / Number(props.burn)))
  }

  const res = {
    series: [
      {
        name: '摄入进度',
        color: '#ffffff',
        data: progress
      }
    ]
  }

  if (renderTimer) clearTimeout(renderTimer)

  // 给 DOM 一个极短的恢复期
  renderTimer = setTimeout(() => {
    // 每次渲染生成全新的 Canvas ID
    dynamicId.value = 'arc_' + Date.now()
    chartData.value = JSON.parse(JSON.stringify(res))
    showChart.value = true // 重新挂载
  }, 100) // H5 环境下 50~100ms 足够
}

// 1. 在组件挂载完成后，执行第一次渲染
onMounted(() => {
  isMounted = true
  nextTick(() => {
    renderChart()
  })
})

// 2. 监听数据变化（去掉 immediate: true，因为首次渲染已交给 onMounted）
watch(
  () => [props.intake, props.burn],
  () => {
    renderChart()
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
.charts-box {
  width: 300rpx;
  height: 300rpx;
  margin: 0 auto;
  position: relative;
}

.center-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.center-value {
  font-size: 46rpx;
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
}

.center-value text {
  font-size: 24rpx;
}

.center-label {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: rgba(255,255,255,0.9);
}
</style>