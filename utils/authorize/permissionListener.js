/**
 * uni.createRequestPermissionListener()
 * 文档地址：https://uniapp.dcloud.net.cn/api/system/create-request-permission-listener.html
 * 注意：HBuilderX (4.0+) android 平台支持；HBuilderX 4.01 Vue2项目需要使用自定义基座测试监听权限申请的功能，标准基座暂不支持测试。
 */

import permissionEnums from './permissionEnums'

let exportObj = null
// #ifdef APP
const { osName } = uni.getSystemInfoSync()
let permissionListener = null
// 是安卓平台，同时有uni.createRequestPermissionListener这个api
if (osName === 'android' && uni.createRequestPermissionListener) {
  permissionListener = uni.createRequestPermissionListener()
}
let canRunListener = true // 是否可以执行所有监听方法
let canStopListener = true // 是否可以执行取消所有监听方法，避免唤起权限会触发App.vue的onHide生命周期

/**
 * 权限说明文字
 * @param {String} = permissionName  例如：ACCESS_COARSE_LOCATION
 */
const texts = (permissionName) => {
  const routeritem = Router()
  let title = ''
  let content = ''
  const permissionInfo = permissionEnums[permissionName] || null
  if (routeritem.path == 'pages/webView/index' && permissionName == 'WRITE_EXTERNAL_STORAGE') {
    title = '相册权限使用说明（客服反馈）'
    content = '我们需要获取您的相册权限，仅用于您向客服提交问题时选择手机中已保存的照片信息，不会访问其他相册内容。'
    return { title, content }
  }
  if (routeritem.path == 'pages/webView/index' && permissionName == 'CAMERA') {
    title = '相机权限使用说明（客服反馈）'
    content = '我们需要获取您的相机权限，仅用于您向客服提交问题时拍摄照片信息，不会收集其他信息。'
    return { title, content }
  }
  if (routeritem.path == 'pages/loan/idCloud' && permissionName == 'CAMERA') {
    title = '相机权限使用说明（身份证上传）'
    content = '我们需要获取您的相机权限，仅用于拍摄并上传身份证信息，用于身份核验，不会用于其他用途。'
    return { title, content }
  }
  if (routeritem.path == 'pages/loan/idCloud' && permissionName == 'WRITE_EXTERNAL_STORAGE') {
    title = '相册权限使用说明（身份证上传）'
    content = '我们需要获取您的相册权限，仅用于您选择手机中已保存的身份证照片完成身份核验，不会访问或获取相册内其他内容，严格保护您的隐私安全。'
    return { title, content }
  }
  if (routeritem.path == 'pages/loan/liveInd' && permissionName == 'CAMERA') {
    title = '相机权限使用说明（活体认证）'
    content = '我们需要获取您的相机权限，仅用于完成活体认证（人脸识别），核实身份信息，不会收集或录制其他影像信息，严格保护您的隐私安全。'
    return { title, content }
  }
  if (routeritem.path == 'pages/loan/liveInd' && permissionName == 'RECORD_AUDIO') {
    title = '相机权限使用说明（活体认证）'
    content = '我们需要获取您的相机权限，仅用于完成活体认证（人脸识别），核实身份信息，不会收集或录制其他影像信息，严格保护您的隐私安全。'
    return { title, content }
  }
  if (routeritem.path == 'pages/loan/job' && permissionName == 'ACCESS_COARSE_LOCATION') {
    title = '位置权限使用说明（快速填写地址）'
    content = '我们需要获取您的粗略位置权限，仅用于快速帮您填写地址信息，不会收集、存储您的精准位置，严格保护您的位置隐私安全。'
    return { title, content }
  }
  
  if (permissionInfo) {
    const { name, explain } = permissionInfo
    title = `${name}权限使用说明`
    content = `将获取${name}权限，用于${explain}`
  } else {
    title = ''
    content = ''
  }
  return {
    title,
    content
  }
}
const Router = () => {
  // 获取页面栈
  const pages = getCurrentPages()
  // 最后一个元素 = 当前页面
  const currentPage = pages[pages.length - 1]
  // 当前路由信息
  const currentRoute = {
    // 路由路径（如：/pages/index/index）
    path: currentPage.route,
    // 路由参数（如?id=1&name=test 解析后的对象）
    query: currentPage.options
  }
  console.log('当前路由：', currentRoute)
  return currentRoute
}
/**
 * 绘画顶部权限说明
 * 文档地址：https://www.html5plus.org/doc/zh_cn/nativeobj.html
 * @function drawView title标题，content描述使用说明
 * @function hideView 隐藏顶部权限说明
 */
let view = null
const drawView = ({ title, content }) => {
  if (view || !title || !content) return // 没有标题和内容则return出去
  const { windowTop, windowWidth, statusBarHeight } = uni.getSystemInfoSync()
  const topHeight = windowTop + statusBarHeight
  const distance = {
    box: 10, // 盒子距离视图两边的距离
    text: 20 // 文字距离视图两边的距离
  }
  // 标题的相关样式
  const titleStyle = {
    size: 16,
    height: 16,
    top: `${topHeight + 22}`,
    color: '#000'
  }
  // 内容的相关样式
  const contentStyle = {
    size: 14,
    height: 0,
    top: `${parseInt(titleStyle.top) + titleStyle.height + 6}`,
    color: '#656563'
  }
  const contentLength = content.length // 权限说明内容文字长度
  const contentWidth = windowWidth - distance.text * 2 // 内容的宽度
  const contentRowCount = Math.floor(contentWidth / contentStyle.size) // 一行占几个文字
  const contentRows = Math.ceil(contentLength / contentRowCount) // 当前内容占几行
  contentStyle.height = contentRows * (contentStyle.size + 6) // 内容的高度
  /**
   * @description 计算盒子的高度
   * 获取content到盒子顶部距离：parseInt(contentStyle.top) - topHeight - distance.box
   * content的高度：contentStyle.height
   * 获取content到盒子底部的距离：(distance.text - distance.box)
   */
  const boxHeight = (parseInt(contentStyle.top) - topHeight - distance.box) + contentStyle.height + (distance.text - distance.box)

  view = new plus.nativeObj.View('per-modal', {
    top: '0',
    left: '0',
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)'
  })
  view.drawRect({
    color: '#fff',
    radius: '5px'
  }, {
    top: `${topHeight + distance.box}px`,
    left: `${distance.box}px`,
    right: `${distance.box}px`,
    height: `${boxHeight}px`
  })
  view.drawText(title, {
    top: `${titleStyle.top}px`,
    left: `${distance.text}px`,
    right: `${distance.text}px`,
    height: `${titleStyle.height}px`
  }, {
    size: `${titleStyle.size}px`,
    align: 'left',
    color: titleStyle.color,
    weight: 'bold'
  })
  view.drawText(content, {
    top: `${contentStyle.top}px`,
    left: `${distance.text}px`,
    right: `${distance.text}px`,
    height: `${contentStyle.height}px`
  }, {
    size: `${contentStyle.size}px`,
    lineSpacing: '2px',
    align: 'left',
    color: contentStyle.color,
    verticalAlign: 'top',
    whiteSpace: 'normal'
  })
  let timer = setTimeout(() => {
    view && view.show()
    clearTimeout(timer)
    timer = null
  }, 200)
}
// 关闭顶部权限说明
const hideView = () => {
  if (view) {
    view.hide()
    view = null
  }
}
let isModalShow = false 
// 监听权限方法
const listenerFunc = () => {
  stopFunc() // 取消所有监听方法
  if (canRunListener && permissionListener) {
    let permissionName = '' // 权限名称
    let hasConfirm = false // 是否有权限弹窗（触发permissionListener.onConfirm这个回调）
    canRunListener = false
    canStopListener = false
    // 监听申请系统权限
    permissionListener.onRequest((e) => {
      // eslint-disable-next-line no-console
      console.log('permissionListener.onRequest回调：', e)
      if (Array.isArray(e) && e.length > 0) {
        const stringToArray = e[0].split('.')
        permissionName = stringToArray[stringToArray.length - 1]
      }
    })
    // 监听弹出系统权限授权框
    permissionListener.onConfirm((e) => {
      // eslint-disable-next-line no-console
      console.log('permissionListener.onConfirm回调：', e)
      hasConfirm = true
      if (permissionName) {
        drawView(texts(permissionName))
      }
    })
    // 监听权限申请完成
    permissionListener.onComplete((e) => {
      // eslint-disable-next-line no-console
      console.log('permissionListener.onComplete回调：', e)
      // e.length === 0：权限列表无值，则不继续做相对逻辑
      if (e.length === 0) return
      let name = '' // 权限名称
      let explain = '' // 权限说明
      if (permissionName && permissionEnums[permissionName]) {
        name = permissionEnums[permissionName].name
        explain = permissionEnums[permissionName].explain
      }
      const Manifest = plus.android.importClass('android.Manifest')
      const MainActivity = plus.android.runtimeMainActivity()
      const permissionStatus = MainActivity.checkSelfPermission(Manifest.permission[permissionName])
	  console.log(permissionStatus,hasConfirm, permissionName, name, explain)
      /**
       * @description 永久拒绝该权限，则引导用户前往设置页
       * permissionStatus != 0：权限状态是拒绝
       * !hasConfirm：没有permissionListener.onConfirm这个回调
       */
      if (permissionStatus != 0 && !hasConfirm && name && explain) {
        // uni.showModal({
        //   title: '温馨提示',
        //   content: `开启${name}权限后，才能${explain}`,
        //   showCancel: true,
        //   confirmText: '去设置',
        //   success: (res) => {
        //     if (res.confirm) {
        //       uni.openAppAuthorizeSetting()
        //     }
        //   }
        // })
		showLocationModal(name,explain)
        return
      }
	  // if (permissionStatus === -1  && name && explain) {
	  // 	showLocationModal(name,explain)
	  // }
      canStopListener = true
      hideView()
    })
  }
}
const showLocationModal = (name,explain) => {
  if (isModalShow) return // 防止重复弹出
  isModalShow = true
  uni.showModal({
    title: '温馨提示',
    content: `开启${name}权限后，才能${explain}`,
    showCancel: true,
    confirmText: '去设置',
    success: (res) => {
      isModalShow = false // 无论确认/取消，都重置开关
      if (res.confirm) {
        uni.openAppAuthorizeSetting()
      }
    },
    fail: () => {
      isModalShow = false // 失败时也重置
    },
    complete: () => {
      isModalShow = false // 完成回调（兜底）
    }
  })
}
const hideModal = () => {
  // 方式A：如果是在页面中，可通过返回上一页（适合modal在子页面）
  // uni.navigateBack({ delta: 1 })
  // 方式B：通过关闭当前页面的所有弹窗（通用）
  // 注意：该方法会关闭所有弹窗，包括toast/loading等
  uni.hideToast() // 虽然是hideToast，但能关闭modal（uniapp底层兼容）
  
  // 方式C：强制重置状态（配合开关变量）
  isModalShow = false
}
// 取消所有监听方法
const stopFunc = () => {
  if (canStopListener && permissionListener) {
    canRunListener = true
    hideView()
    permissionListener.stop()
  }
}

if (permissionListener) {
  exportObj = {
    listenerFunc,
    stopFunc
  }
} else {
  exportObj = null
}
// #endif

export default exportObj
