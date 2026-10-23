// #ifdef APP-PLUS
import appAuth from './app-auth.js'
// #endif
import { AppType } from '../constant.js'
import permissionEnums from './permissionEnums.js'

// 微信小程序权限校验
const wxCheck = (permit, option) => {
  const permitStr = `scope.${permit}`
  wx.getSetting({
    success (res) {
      if (!res.authSetting[permitStr]) {
        wx.authorize({
          scope: permitStr,
          success: () => {
            option.success && option.success()
          },
          fail: () => {
            handleAuthFail(permit, option, () => {
              // option.success && option.success()
              // option.fail && option.fail()
              if (permitStr !== 'scope.userLocation') {
                wx.openSetting({
                  success: setRes => {
                    if (setRes.authSetting[permitStr]) {
                      option.success && option.success()
                    } else {
                      option.fail && option.fail()
                      uni.showToast({
                        title: '授权失败',
                        icon: 'none',
                        duration: 2000
                      })
                    }
                  }
                })
              } else {
                const systemSetting = wx.getSystemSetting()
                if (res.authSetting['scope.userLocation'] === false || systemSetting.locationEnabled === false) {
                  option.fail && option.fail()
                } else {
                  option.success && option.success()
                }
              }
            }, option.fail)
          }
        })
      } else {
        option.success && option.success()
      }
    }
  })
}

// 处理未授权
const handleAuthFail = (permit, option, callBack, errCallBack) => {
  uni.showModal({
    title: option.title || '温馨提示',
    // #ifndef MP-WEIXIN
    content: option.content || `开启${permissionEnums[permit].name}权限后，才能${permissionEnums[permit].explain}`,
    confirmText: '去开启',
    // #endif
    // #ifdef MP-WEIXIN
    // eslint-disable-next-line no-dupe-keys
    content: option.content || '请确认定位权限是否开启',
    // eslint-disable-next-line no-dupe-keys
    confirmText: '确定',
    // #endif
    success: (mdlRes) => {
      if (mdlRes.confirm) {
        uni.setStorageSync('cloudGoOpenAuth', 1) // 用于app授权后返回页面时重新操作流程
        callBack()
      } else if (mdlRes.cancel) {
        uni.showToast({
          title: '取消授权',
          icon: 'none',
          duration: 2000
        })
        errCallBack && errCallBack()
      }
    }
  })
}

// APP权限校验
const appCheck = async (permit, option) => {
  // 详见constant文件AppType
  const appType = +uni.getStorageSync('cloudAppType')
  // 5.安卓 6.苹果
  let authRes = false
  if (appType === AppType.ANDROID) {
    const res = await appAuth.requestAndroidPermission(`android.permission.${permit}`)
    authRes = res === 1
    if (plus.os.version > 13) {
      // 安卓14+
      if (permit === 'READ_MEDIA_IMAGES' && !authRes) {
        // 读取图片权限 READ_MEDIA_VISUAL_USER_SELECTED 允许授权部分图片；当该权限启用时不弹出授权提示框
        authRes = (await appAuth.requestAndroidPermission('android.permission.READ_MEDIA_VISUAL_USER_SELECTED')) === 1
      }
      if (permit === 'writePhotosAlbum') {
        // 安卓14+保存图片到公共媒体目录无需权限
        authRes = true
      }
    }
  } else if (appType === AppType.IOS) {
    authRes = appAuth.judgeIosPermission(permit)
  }
  if (authRes) {
    option.success && option.success()
    return
  }
  handleAuthFail(permit, option, () => {
    // 打开App权限设置界面
    appAuth.gotoAppPermissionSetting()
  }, option.fail)
}

const handleAuthKey = (key) => {
  // 详见constant文件AppType
  const appType = +uni.getStorageSync('cloudAppType')
  // 1:小程序 5:安卓 6:ios
  switch (key) {
    // 定位
    case 'location':
      if (appType === AppType.MINI) {
        return 'userLocation'
      } else if (appType === AppType.ANDROID) {
        return 'ACCESS_FINE_LOCATION'
      } else if (appType === AppType.IOS) {
        return 'location'
      }
      break
      // 外部存储(含相册)读取权限
    case 'readStorage':
      if (appType === AppType.MINI) {
        return null
      } else if (appType === AppType.ANDROID) {
        // 安卓根据版本号申请不同的权限
        return plus.os.version >= 13 ? 'READ_MEDIA_IMAGES' : 'READ_EXTERNAL_STORAGE'
      } else if (appType === AppType.IOS) {
        return 'photoLibrary'
      }
      break
      // 外部存储(含相册)写入权限
    case 'writeStorage':
      if (appType === AppType.MINI) {
        return 'writePhotosAlbum'
      } else if (appType === AppType.ANDROID) {
        // 安卓13+ 保存图片到公共路径不需要权限
        return plus.os.version >= 13 ? 'writePhotosAlbum' : 'WRITE_EXTERNAL_STORAGE'
      } else if (appType === AppType.IOS) {
        return 'photoLibrary'
      }
      break
    case 'camera': // 摄像头权限
      if (appType === AppType.MINI) {
        return null
      } else if (appType === AppType.ANDROID) {
        return 'CAMERA'
      } else if (appType === AppType.IOS) {
        return 'camera'
      }
      break
    default:
      return ''
  }
}

// 权限校验
export function checkAuthorize (permit, option = {}) {
  // #ifdef APP-PLUS
  handleAuthKey(permit) ? appCheck(handleAuthKey(permit), option) : option.success?.()
  // #endif
  // #ifdef MP-WEIXIN
  handleAuthKey(permit) ? wxCheck(handleAuthKey(permit), option) : option.success?.()
  // #endif
  // #ifndef MP-WEIXIN || APP-PLUS
  option.success?.()
  // #endif
}
