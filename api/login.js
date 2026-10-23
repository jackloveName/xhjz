import request from '@/utils/request'

// 登录方法
export function login(username, password, code, uuid) {
  const data = {
    username,
    password,
    code,
    uuid
  }
  return request({
    'url': '/login',
    headers: {
      isToken: false
    },
    'method': 'post',
    'data': data
  })
}

// 注册方法
export function register(data) {
  return request({
    url: '/register',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}

// 获取用户详细信息
export function getInfo() {
  return request({
    'url': '/getInfo',
    'method': 'get'
  })
}

// 退出方法
export function logout() {
  return request({
    'url': '/mall_auth/ma/login_out',
    'method': 'post'
  })
}

// 获取验证码
export function getLoginCode(data) {
  return request({
    'url': '/mall_biz/ua/sms/verification_code/login_code',
    headers: {
      isToken: false
    },
    method: 'put',
    timeout: 20000,
	data
  })
}
// 获取个人记账数据
export function getMjconfig(key) {
  return request({
    'url': `/mall_admin/ua/app/sys_config/get/other/value/config/${key}`,
    'method': 'get'
  })
}
//获取系统参数
export function getSysConfigValue(key) {
  return request({
    'url': `/mall_admin/ua/app/sys_config/get/value/config/${key}`,
    'method': 'get'
  })
}
// 保存协议
export function saveMjconfig(data){
	return request({
		url: `/mall_admin/p/sys_config/ua/other/save`,
		method: 'post',
		data
	})
}
// 验证码登录
export function login_with_code(data){
	return request({
		url: `/mall_auth/ua/login_with_code`,
		method: 'post',
		data
	})
}
// 账号密码登录
export function ualogin(data){
	return request({
		url: `/mall_auth/ua/login`,
		method: 'post',
		data
	})
}
// 获取用户信息
export function user_detail_info(){
	return request({
		url: `/mall_user/user/ma/user_detail_info`,
		method: 'get',
	})
}
// 注销账号
export function destroy_user(data){
	return request({
		url: `/mall_user/user/destroy_user?forceDestroy=`+data,
		method: 'get',
	})
}
// 发送修改密码短信验证码
export function sendUpdatePwdCode(data){
	return request({
		url: `/mall_biz/sms/verification_code/update_pwd`,
		method: 'put',
		timeout: 20000,
		data
	})
}
// 验证修改密码短信验证码
export function checkUpdatePwdCode(data){
	return request({
		url: `/mall_biz/sms/verification_code/check_update_pwd`,
		method: 'put',
		data
	})
}
// 修改密码
export function forgetPassword(data){
	return request({
		url: `/mall_auth/forget_password`,
		method: 'put',
		data
	})
}

/**
 * 获取应用更新配置
 * @param {string} osName - 操作系统名称 (android/ios)
 * @returns {Promise}
 */
export function getAppUpdateConfig(osName) {
	return request({
		url: `/mall_admin/ua/app/sys_config/${osName}`,
		method: 'get'
	})
}

// 
export function set_other_contact(data){
	return request({
		url: `/mall-connect/kyc/set_other_contact`,
		method: 'post',
		data
	})
}