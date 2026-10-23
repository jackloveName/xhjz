import config from '@/config'
import { getGuestMode, getToken } from '@/utils/auth'
import errorCode from '@/utils/errorCode'
import { useUserStore } from '@/store/modules/user'
import { toast, showConfirm, tansParams } from '@/utils/common'

let timeout = 10000
const baseUrl = config.baseUrl

const request = config => {
  // 是否需要设置 token
  const isToken = (config.headers || {}).isToken === false
  config.header = config.header || {}
  if (getToken() && !isToken) {
    config.header['Authorization'] = getToken()
  }
  // get请求映射params参数
  if (config.params) {
    let url = config.url + '?' + tansParams(config.params)
    url = url.slice(0, -1)
    config.url = url
  }
  return new Promise((resolve, reject) => {
    uni.request({
        method: config.method || 'get',
        timeout: config.timeout ||  timeout,
        url: config.baseUrl || baseUrl + config.url,
        data: config.data,
        header: config.header,
        dataType: 'json'
      }).then(response => {
        const res = response
        console.log(response)
        const code = res.data.code || 200
        if (code === 401) {
          if (getGuestMode()) {
            reject('游客模式无需登录')
            return
          }
          showConfirm('登录状态已过期，您可以继续留在该页面，或者重新登录?').then(res => {
            if (res.confirm) {
              useUserStore().logOut().then(res => {
                uni.reLaunch({ url: '/pages/login' })
              })
            }
          })
          reject('无效的会话，或者会话已过期，请重新登录。')
        } else if (code === "A00005") {
          toast(res.data.msg)
          reject('500')
        } else if (code === "A00006") {
          toast(res.data.msg)
          reject('600')
        } else if (code === '00000') {
			resolve(res.data.data)
        } else  if (code === 'A00001') {
          if (getGuestMode()) {
            reject(code)
            return
          }
			toast(res.data.msg)
			useUserStore().logOut().then(res => {
			  uni.reLaunch({ url: '/pages/login' })
			})
			reject(code)
        }else  if (code !== 200) {
			reject(code)
        }
        resolve(res.data)
      })
      .catch(error => {
		  console.log(error)
        let { message } = error
        if (message === 'Network Error') {
          message = '后端接口连接异常'
        } else if (message.includes('timeout')) {
          message = '系统接口请求超时'
        } else if (message.includes('Request failed with status code')) {
          message = '系统接口' + message.slice(-3) + '异常'
        }
        toast(message)
        reject(error)
      })
  })
}

export default request
