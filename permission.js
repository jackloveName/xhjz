import { getGuestMode, getToken } from '@/utils/auth'

// 登录页面
const loginPage = "/pages/login"
  
// 页面白名单
const whiteList = [
  '/pages/login', '/pages/register', '/pages/mine/terms/index'
]
const guestList = [
  '/pages/index', '/pages/trend/index', '/pages/finance/index'
]

function normalizeUrl(url = '') {
  let path = String(url || '').split('?')[0].trim()
  if (!path || path === '/') return '/pages/index'
  path = path.startsWith('/') ? path : `/${path}`
  path = path.replace(/\/+$/, '')
  if (path === '/pages/index/index') return '/pages/index'
  return path
}

// 检查地址白名单
function checkWhite(url) {
  const path = normalizeUrl(url)
  return whiteList.indexOf(path) !== -1
}

function checkGuest(url) {
  const path = normalizeUrl(url)
  return getGuestMode() && guestList.indexOf(path) !== -1
}

// 页面跳转验证拦截器
let list = ["navigateTo", "redirectTo", "reLaunch", "switchTab"]
list.forEach(item => {
  uni.addInterceptor(item, {
    invoke(to) {
      if (getGuestMode()) {
        if (checkWhite(to.url) || checkGuest(to.url)) {
          return true
        }
        uni.reLaunch({ url: loginPage })
        return false
      }
      if (getToken()) {
        if (normalizeUrl(to.url) === loginPage) {
          uni.reLaunch({ url: "/pages/index" })
        }
        return true
      } else {
        if (checkWhite(to.url)) {
          return true
        }
        if (checkGuest(to.url)) {
          return true
        }
        uni.reLaunch({ url: loginPage })
        return false
      }
    },
    fail(err) {
      console.log(err)
    }
  })
})
