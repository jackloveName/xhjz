<template>
  <view class="mall component-img-box upload-img">
    <!-- 单图 -->
    <view class="upload">
      <!-- 图片 -->
      <view class="preview">
        <image :src="resourcesVal||'/static/images/my/head-sculpture.png'" mode="aspectFill" @tap="getUploadImg" />
        <view v-if="needDeleteBtn" class="del" @tap="removeImgByIndex">
          <uni-icons custom-prefix="mall" type="icon-close" size="20rpx" color="#ffffff" class="del-icon" />
        </view>
        <!-- <view class="preview-img" @tap="previewImage" > 预览 </view> -->
      </view>
    </view>
  </view>
</template>

<script setup>
	import config from '@/config'
  import {onMounted,watch,onUnmounted,ref,defineEmits} from 'vue'
  import fileUpload from "@/utils/fileUpload.js"
  const resourcesUrl =config.ossUrl
	
  const props = defineProps({
    imgId: {
      type: [String, Number],
      default: ''
    },
    imgUrl: {
      type: String,
      default: ''
    },
    needDeleteBtn: {
      type: Boolean,
      default: true
    },
    type: {
      type: String,
      default: ''
    }
  })

  const emit = defineEmits(['getImagePath'])

  const imgNum = 1 // 图片上传数量，默认1，最大9
  const resourcesVal = ref('')
  let inited = false
  watch(() => props.imgUrl, (newVal, oldVal) => {
    if (!oldVal && newVal && !inited) {
      if (newVal.indexOf(resourcesUrl) === 0) {
        resourcesVal.value = newVal
      } else {
        resourcesVal.value = resourcesUrl + newVal
      }
      inited = true
    }
  })

  onMounted(() => {
	  console.log(props)
    if (props.imgUrl) {
      if (props.imgUrl?.indexOf(resourcesUrl) === 0) {
        resourcesVal.value = props.imgUrl
      } else {
        resourcesVal.value = resourcesUrl + props.imgUrl
      }
    }
  })

  onUnmounted(() => {
    if (isShowPreview) {
      uni.closePreviewImage({
        success: () => {
          isShowPreview = false
        }
      })
    }
  })

  /**
   * 上传图片
   */
  const getUploadImg = () => {
    fileUpload.chooseImage({
      count: imgNum, // 默认9
      sourceType: ['camera', 'album']
    }).then(res => {
      onUploadSuccess(res[0]?.filePath)
    })
  }

  /**
   * 上传成功回调
   */
  const onUploadSuccess = (filePath) => {
    resourcesVal.value = resourcesUrl + '/' + filePath
    emit('getImagePath', '/' + filePath, props.imgId)
  }

  /**
   * 删除图片
   */
  const removeImgByIndex = () => {
    resourcesVal.value = ''
    emit('getImagePath', '', props.imgId)
  }

  let isShowPreview = false
  /**
   * 图片预览
   */
  const previewImage = () => {
    const urls = []
    urls.push(resourcesVal.value)
    uni.previewImage({
      current: 0,
      urls,
      success: () => {
        isShowPreview = true
      }
    })
  }
</script>

<style lang="scss" scoped>
  .component-img-box {
    display: block;
    width: 100%;
    height: 100%;
    .upload {
      display: block;
      width: 100%;
      height: 100%;

      .preview {
        display: block;
        width: 100%;
        height: 100%;
        border-radius: 8rpx;
        background: #f9f9f9;
        position: relative;

        image {
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 8rpx;
        }
      }

      .upload-chequer {
        width: 100%;
        height: 100%;
        border-radius: 8rpx;
        background: #f9f9f9;
        display: flex;
        align-items: center;
        justify-content: center;

        .cross {
          font-size: 96rpx;
          font-weight: 200;
          color: #ccc;
        }
      }
    }

    .preview {

      /* 删除 */
      .del {
        position: absolute;
        top: 5rpx;
        right: 5rpx;
        width: 36rpx;
        height: 36rpx;
        font-size: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, .3);
        border-radius: 0 8rpx 0 30rpx;

        .del-icon {
          margin: 0 0 2rpx 2rpx;
        }
      }

      /* 预览 */
      .preview-img {
        position: absolute;
        bottom: 0;
        display: block;
        width: 100%;
        height: 2em;
        line-height: 2em;
        background: rgba(0, 0, 0, .3);
        text-align: center;
        color: #fff;
        border-radius: 0 0 8rpx 8rpx;
      }
    }
  }
</style>
