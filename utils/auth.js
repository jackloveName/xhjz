const TokenKey = 'App-Token'
const GuestModeKey = 'Guest-Mode'

export function getToken() {
  return uni.getStorageSync(TokenKey)
}

export function setToken(token) {
  return uni.setStorageSync(TokenKey, token)
}

export function removeToken() {
  return uni.removeStorageSync(TokenKey)
}

export function getGuestMode() {
  const value = uni.getStorageSync(GuestModeKey)
  return value === true || value === 'true' || value === 1 || value === '1'
}

export function setGuestMode(value = true) {
  if (!value) {
    return removeGuestMode()
  }
  removeToken()
  return uni.setStorageSync(GuestModeKey, '1')
}

export function removeGuestMode() {
  return uni.removeStorageSync(GuestModeKey)
}
