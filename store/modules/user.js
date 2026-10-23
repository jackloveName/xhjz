import { defineStore } from 'pinia'
import { ref } from 'vue'
import storage from '@/utils/storage'
import constant from '@/utils/constant'
import { user_detail_info, logout, login_with_code, ualogin, destroy_user, getMjconfig, saveMjconfig } from '@/api/login'
import { getGuestMode, getToken, removeGuestMode, removeToken, setToken } from '@/utils/auth'
import { normalizeBillList } from '@/utils/proofArchive'

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken())
  const id = ref(storage.get(constant.id))
  const name = ref(storage.get(constant.name))
  const avatar = ref(storage.get(constant.avatar))
  const roles = ref(storage.get(constant.roles))
  const permissions = ref(storage.get(constant.permissions))
  const user_info = ref(storage.get(constant.user_info) || {})
  const user_information = ref(storage.get(constant.user_information) || {})
  const mockBillData = ref(normalizeBillList(storage.get(constant.mock_bill_data) || []))

  const SET_TOKEN = (val) => { token.value = val }
  const SET_ID = (val) => { id.value = val; storage.set(constant.id, val) }
  const SET_NAME = (val) => { name.value = val; storage.set(constant.name, val) }
  const SET_AVATAR = (val) => { avatar.value = val; storage.set(constant.avatar, val) }
  const SET_ROLES = (val) => { roles.value = val; storage.set(constant.roles, val) }
  const SET_PERMISSIONS = (val) => { permissions.value = val; storage.set(constant.permissions, val) }
  const SET_USER_INFO = (val) => { user_info.value = val || {}; storage.set(constant.user_info, user_info.value) }
  const SET_USER_INFORMATION = (val) => { user_information.value = val || {}; storage.set(constant.user_information, user_information.value) }
  const SET_MOCK_BILL_DATA = (val) => {
    mockBillData.value = normalizeBillList(val)
    storage.set(constant.mock_bill_data, mockBillData.value)
  }
  const getUserPhone = () => user_info.value.phone || user_info.value.userMobile || ''
  const getConfigKey = (suffix) => `${getUserPhone()}${suffix}`

  const loginAction = (loginInfo) => {
    return new Promise((resolve, reject) => {
      const action = loginInfo.loginStatus === 1 ? login_with_code : ualogin
      action(loginInfo).then((res) => {
        setToken(res.accessToken)
        removeGuestMode()
        SET_TOKEN(res.accessToken)
        resolve()
      }).catch(reject)
    })
  }

  const getInfoAction = () => {
    return new Promise((resolve, reject) => {
      if (getGuestMode() || !getToken()) {
        SET_USER_INFO({})
        resolve({})
        return
      }
      user_detail_info().then((res) => {
        SET_USER_INFO(res)
        resolve(res)
      }).catch(reject)
    })
  }

  const clearSession = () => {
    SET_TOKEN('')
    SET_ID('')
    SET_NAME('')
    SET_AVATAR('')
    SET_ROLES('')
    SET_PERMISSIONS('')
    removeToken()
    storage.clean()
    SET_USER_INFO({})
    SET_USER_INFORMATION({})
    SET_MOCK_BILL_DATA([])
  }

  const logOutAction = () => {
    return new Promise((resolve, reject) => {
      logout().then(() => {
        clearSession()
        resolve()
      }).catch(reject)
    })
  }

  const zxAction = () => {
    return new Promise((resolve, reject) => {
      destroy_user(false).then(() => {
        clearSession()
        resolve()
      }).catch(reject)
    })
  }

  const loadBillData = () => {
    return new Promise(async (resolve, reject) => {
      try {
        if (getGuestMode() || !getToken() || !getUserPhone()) {
          const localData = normalizeBillList(storage.get(constant.mock_bill_data) || [])
          SET_MOCK_BILL_DATA(localData)
          resolve(localData)
          return
        }
        const res = await getMjconfig(getConfigKey('BillMoney'))
        const parsed = res ? JSON.parse(res) : []
        const next = normalizeBillList(parsed)
        SET_MOCK_BILL_DATA(next)
        resolve(next)
      } catch (error) {
        reject(error)
      }
    })
  }

  const updateMockBillData = (val) => {
    return new Promise(async (resolve, reject) => {
      try {
        const next = normalizeBillList(val)
        if (getGuestMode() || !getToken() || !getUserPhone()) {
          SET_MOCK_BILL_DATA(next)
          resolve(next)
          return
        }
        await saveMjconfig({
          paramKey: getConfigKey('BillMoney'),
          paramValue: JSON.stringify(next),
          remark: '薪花记账凭证记录数据'
        })
        SET_MOCK_BILL_DATA(next)
        resolve(next)
      } catch (error) {
        reject(error)
      }
    })
  }

  const updateNoApi = (val) => Promise.resolve(SET_MOCK_BILL_DATA(val))

  return {
    token,
    id,
    name,
    avatar,
    roles,
    permissions,
    user_info,
    user_information,
    mockBillData,
    SET_AVATAR,
    SET_USER_INFORMATION,
    login: loginAction,
    getInfo: getInfoAction,
    logOut: logOutAction,
    zxAction,
    loadBillData,
    updateMockBillData,
    updateNoApi
  }
})
