// 权限功能菜单
let permissionEnums = {}
// #ifdef APP-PLUS
const { osName } = uni.getSystemInfoSync()
if (osName === 'android') {
  permissionEnums = {
    ACCESS_COARSE_LOCATION: {
      name: '定位',
      explain: '用于获取当前地区的产品信息,更好的为您服务'
    },
    ACCESS_FINE_LOCATION: {
      name: '定位',
      explain: '用于获取当前地区的产品信息,更好的为您服务'
    },
	CALL_PHONE:{
		name: '拨打电话',
		explain: '用于能够快捷的拨打客服电话'
	},
    READ_EXTERNAL_STORAGE: {
      name: '存储',
      explain: '上传图片、上传视频等相关功能'
    },
    CAMERA: {
      name: '相机',
      explain: '扫二维码、拍摄图片等相关功能'
    },
    WRITE_EXTERNAL_STORAGE: {
      name: '存储',
      explain: '把图片保存到相册等相关功能'
    },
    // 安卓13（API 33） 相册读写权限
    READ_MEDIA_IMAGES: {
      name: '存储',
      explain: '上传图片、保存图片等相关功能'
    },
    // 安卓14+（API 34+） 相册读写权限
    READ_MEDIA_VISUAL_USER_SELECTED: {
      name: '存储',
      explain: '上传图片、保存图片等相关功能'
    }
  }
} else {
  permissionEnums = {
    location: {
      name: '定位',
      explain: '展示附近店铺、填写收货地址等相关功能'
    },
    photoLibrary: {
      name: '存储',
      explain: '上传图片、上传视频、把图片保存到相册等相关功能'
    },
    camera: {
      name: '相机',
      explain: '扫二维码、拍摄图片等相关功能'
    }
  }
}
// #endif
// #ifdef MP-WEIXIN
// 微信小程序
permissionEnums = {
  userLocation: {
    name: '定位',
    explain: '展示附近店铺、填写收货地址等相关功能'
  },
  writePhotosAlbum: {
    name: '相册',
    explain: '把图片保存到相册等相关功能'
  }
}
// #endif

export default permissionEnums
