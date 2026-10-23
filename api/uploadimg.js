import request from '@/utils/request'
// 获取图片上传的签名地址
export function get_batch_pre_sign_url(data){
	return request({
		url: `/mall_biz/ua/oss/get_batch_pre_sign_url`,
		method: 'get',
		params:data
	})
}
// 保存
export function save_to_platform(data){
	return request({
		url: `/mall_biz/attach_file/save_to_platform`,
		method: 'post',
		data
	})
}

export function set_user_info(data){
	return request({
		url: `/mall_user/user/set_user_info`,
		method: 'put',
		data
	})
}