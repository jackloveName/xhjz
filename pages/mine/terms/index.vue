<template>
  <view class="mall terms-container">
    <rich-text :nodes="content" />
  </view>
</template>

<script setup>
import { getSysConfigValue } from "@/api/login.js"
import { ref } from "vue"
import { onLoad } from "@dcloudio/uni-app"
const content = ref('')
onLoad((options) => {
  uni.setNavigationBarTitle({
    title: options.title
  })
  ServiceTermsConfig(options.key)
})

const ServiceTermsConfig = (key) => {
  getSysConfigValue(key).then(res => {
    if (uni.getSystemInfoSync().platform === 'ios') {
      res = res.replace(/\${name}/g, 'Ronan Pierce')
      res = res.replace(/\${email}/g, 'ronanpierce90@icloud.com')
      content.value = res
    } else {
      res = res.replace(/\${name}/g, '扬州言范软件科技有限公司')
      res = res.replace(/\${email}/g, 'lisaXking789@outlook.com')
      content.value = res
    }
  })
}
</script>

<style lang="scss" scoped>
.terms-container {
  min-height: 100vh;
  padding: 30rpx;
  background:
    radial-gradient(circle at 88% 4%, rgba(248, 222, 217, 0.64), transparent 28%),
    linear-gradient(180deg, #f5f9ff 0%, #f8fbff 62%, #ffffff 100%);
  color: #252922;
  font-size: 28rpx;
  line-height: 1.8;
}

.terms-container rich-text {
  display: block;
  padding: 32rpx;
  border: 1rpx solid #edf2f8;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 16rpx 38rpx rgba(54, 64, 48, 0.07);
}
</style>
