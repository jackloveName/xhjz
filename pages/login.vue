<template>
	<view class="login-page">
		<image class="login-bg" src="/static/images/piaoyu/login-bg.png" mode="aspectFill" />
		<view class="login-top">
			<view class="brand-chip">
				<image src="/static/logo.png" mode="aspectFill" />
				<view>
					<view>薪花记账</view>
					<text>私密凭证岛</text>
				</view>
			</view>
			<view class="hero-title">把凭证收进安全的小岛</view>
			<view class="hero-sub">照片证据、保修材料、报销附件，都在这里安静归档。</view>
			<view class="trust-row">
				<view>图片留存</view>
				<view>换机恢复</view>
				<view>私密归档</view>
			</view>
		</view>

		<view class="login-panel">
			<view class="panel-head">
				<view>
					<view class="panel-title">{{ loginStatus === 1 ? '验证码登录' : '密码登录' }}</view>
					<text>{{ loginStatus === 1 ? '新用户验证后自动创建凭证岛' : '使用账号密码进入你的凭证岛' }}</text>
				</view>
				<view class="secure-mark">
					<up-icon name="lock" color="#101722" size="22"></up-icon>
				</view>
			</view>

			<view class="login-fields">
				<view class="field-block">
					<view class="field-label">手机号</view>
					<view class="input-shell">
						<input class="field-input" v-model="loginForm.username" maxlength="11" type="number" placeholder="请输入手机号" placeholder-class="input-placeholder" />
					</view>
				</view>

				<view class="field-block" v-if="loginStatus===2">
					<view class="field-label">登录密码</view>
					<view class="input-shell password-shell">
						<input class="field-input" v-model="loginForm.password" type="password" maxlength="20" placeholder="请输入账号密码" placeholder-class="input-placeholder" />
					</view>
				</view>

				<view class="field-block" v-if="loginStatus===1">
					<view class="field-label-row">
						<view class="field-label">短信验证码</view>
						<view class="inline-code-action" :class="{ disabled: disabled1 }" @tap="!disabled1 && getCode()">{{ disabled1 ? tips : '获取验证码' }}</view>
					</view>
					<view class="code-box-wrap" @tap="focusCodeInput">
						<input
							class="code-hidden-input"
							v-model="loginForm.code"
							:focus="codeFocus"
							type="number"
							maxlength="6"
							@input="onCodeInput"
							@blur="codeFocus=false"
						/>
						<view class="code-box" :class="{ filled: item, focus: codeFocus && index === loginForm.code.length }" v-for="(item, index) in codeDigits" :key="index">
							{{ item }}
						</view>
					</view>
					<view class="code-inline-tip">先获取短信验证码，再填写 6 位数字进入薪花记账。</view>
				</view>
			</view>

			<button class="login-btn" @tap="onLogin">{{ loginStatus === 1 ? '进入 / 注册' : '进入' }}</button>

			<view class="agreement-row">
				<up-radio-group v-model="radioValue">
					<up-radio name="1" iconSize="26rpx" activeColor="#3d8bff">
						<template #label>
							<view class="agreement-text">
								已阅读并同意
								<text @tap.stop="onToTermsOfService('隐私条款','XHJZ_PRIVACY_PROTOC')">《隐私条款》</text>
								和
								<text @tap.stop="onToTermsOfService('平台注册协议','XHJZ_REGISTER_PROTOC')">《平台注册协议》</text>
							</view>
						</template>
					</up-radio>
				</up-radio-group>
			</view>

			<view class="method-tabs bottom-method-tabs">
				<view class="method-tab" :class="{ active: loginStatus === 1 }" @tap="switchLoginStatus(1)">
					<up-icon name="phone" :color="loginStatus === 1 ? '#101722' : '#6b778a'" size="18"></up-icon>
					<text>验证码</text>
				</view>
				<view class="method-tab" :class="{ active: loginStatus === 2 }" @tap="switchLoginStatus(2)">
					<up-icon name="lock" :color="loginStatus === 2 ? '#101722' : '#6b778a'" size="18"></up-icon>
					<text>密码</text>
				</view>
			</view>

			<view class="guest-entry" @tap="enterGuestMode">
				<view class="guest-copy">
					<view>还没准备登录？</view>
					<text>先用游客模式整理本机凭证</text>
				</view>
				<view class="guest-btn">进入</view>
			</view>
		</view>

		<Verify
		  ref="verifyRef"
		  :mode="'pop'"
		  captcha-type="blockPuzzle"
		  :v-space="15"
		  :img-size="{ width: '320px', height: '160px' }"
		  @success="onGetCode"
		/>
	</view>
</template>

<script setup>
	import {computed,ref,getCurrentInstance} from "vue"
	import {useUserStore} from '@/store'
	import { checkPhoneNumber} from "@/utils/validate"
	import Verify from '@/components/verify/verify.vue'
	import {getLoginCode} from "@/api/login.js"
	import { encrypt } from '@/utils/crypto'
	import { setGuestMode } from '@/utils/auth'
	import util from "../utils/utils"

	const {proxy} = getCurrentInstance()
	let timer = null
	const loginForm = ref({
		username: "",
		code: "",
		password:"",
	})
	const radioValue=ref(false)
	const tips=ref('获取验证码')
	const disabled1=ref(false)
	const codeFocus=ref(false)
	const verifyRef = ref(null)
	const loginStatus=ref(1)//1是账号验证码,2是账号密码
	const codeDigits = computed(() => {
		const code = String(loginForm.value.code || '').slice(0, 6)
		return Array.from({ length: 6 }, (_, index) => code[index] || '')
	})
	const switchLoginStatus = (type) => {
		loginStatus.value = type
		codeFocus.value = false
	}
	const enterGuestMode = () => {
		setGuestMode(true)
		proxy.$tab.reLaunch('/pages/index')
	}
	const focusCodeInput = () => {
		codeFocus.value = false
		setTimeout(() => {
			codeFocus.value = true
		}, 30)
	}
	const onCodeInput = (e) => {
		loginForm.value.code = String(e.detail.value || '').replace(/\D/g, '').slice(0, 6)
	}
	const getCode=()=>{
		if (!loginForm.value.username.trim()) {
		  proxy.$modal.msgError("请输入手机号")
		  return
		}
		if (!checkPhoneNumber(loginForm.value.username)) {
		  proxy.$modal.msgError("请输入正确的手机号")
		  return
		}
		verifyRef.value.show()
	}
	const onGetCode = (verifyResult) => {
	  getLoginCode({
	      mobile: loginForm.value.username,
	      captchaVerification: verifyResult.captchaVerification
	    }).then(() => {
	    startInterval()
	    focusCodeInput()
	    uni.hideLoading()
	  })
	}
	const startInterval=()=>{
			const entryTime = parseInt(new Date().getTime() / 1000)
			let currentTime = 0
			const maxtime = 60
			tips.value = `${maxtime}s`
			disabled1.value = true
			timer = setInterval(() => {
			  currentTime = parseInt(new Date().getTime() / 1000)
			  const TimeDifference = (currentTime - entryTime)
			  const mytime = maxtime - TimeDifference
			  if (TimeDifference < maxtime) {
			    tips.value = `${mytime}s`
			  } else {
			    clearInterval(timer)
			    timer = null
			    disabled1.value = false
				tips.value = '获取验证码'
			  }
			}, 1000)
	}
	const onToTermsOfService=(title,key)=>{
		proxy.$tab.navigateTo(`/pages/mine/terms/index?title=${title}&key=${key}`)
	}
	async function pwdLogin(data) {
		useUserStore().login(data).then(() => {
			proxy.$modal.closeLoading()
			codeFocus.value = false
			loginSuccess()
		}).catch(() => {
		})
	}
	const onLogin = util.debounce(() => {
		if (!uni.getStorageSync('cloudAppType')) {
			util.setAppType()
		}
		if (!loginForm.value.username.trim()) {
			proxy.$modal.msgError("请输入手机号")
			return
		}
		if (!checkPhoneNumber(loginForm.value.username)) {
		  proxy.$modal.msgError("请输入正确的手机号")
		  return
		}
		if (loginStatus.value === 2&&!loginForm.value.password) {
			proxy.$modal.msgError("请输入密码")
			return
		}
		if (loginStatus.value === 1&&!loginForm.value.code) {
			getCode()
			return
		}
		if (loginStatus.value === 1&&String(loginForm.value.code || '').length < 6) {
			proxy.$modal.msgError("请输入6位验证码")
			focusCodeInput()
			return
		}
		if (!radioValue.value) {
			proxy.$modal.msgError("请阅读并同意协议")
			return
		}
		var imei,oaid,brand;
		// #ifdef APP
			if(uni.getSystemInfoSync().osName==='android'){
				try {
					imei =plus.device.imei?md5(plus.device.imei):undefined
				} catch (e) {
					console.error('获取设备信息失败：', e);
				}
				oaid=uni.getSystemInfoSync().oaid
			}
			brand=uni.getSystemInfoSync().brand
	  // #endif
		var data={
			sysType: 0,
			socialType: uni.getStorageSync('cloudAppType'),
			tempUid:"",
			userName: loginForm.value.username,
			passWord: loginStatus.value === 2 ? encrypt(loginForm.value.password) : undefined,
			mobile: loginStatus.value === 1 ? loginForm.value.username : undefined,
			validCode: loginStatus.value === 1 ? loginForm.value.code : undefined,
			imei:loginStatus.value === 1&&imei?imei:undefined,
			oaid:loginStatus.value === 1&&oaid?oaid:undefined,
			brand:loginStatus.value === 1&&brand?brand:undefined,
			appBrand:uni.getSystemInfoSync().appName,
			osName:uni.getSystemInfoSync().osName,
			loginStatus:loginStatus.value
		}
		proxy.$modal.loading("登录中，请耐心等待...")
		pwdLogin(data)
	}, 600)
	function loginSuccess(result) {
	  useUserStore().getInfo().then(() => {
	    proxy.$tab.reLaunch('/pages/index')
	  })
	}
</script>

<style lang="scss" scoped>
page {
	background: #f5f9ff;
}

.login-page {
	position: relative;
	min-height: 100vh;
	overflow: hidden;
	display: block;
	align-items: initial;
	box-sizing: border-box;
	padding: 58rpx 30rpx 46rpx;
	background: #f7fbff;
}

.login-bg {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	opacity: 1;
	pointer-events: none;
}

.login-top {
	position: relative;
	z-index: 1;
	min-height: 430rpx;
	padding-top: 10rpx;
}

.brand-chip {
	display: inline-flex;
	align-items: center;
	gap: 14rpx;
	min-height: 76rpx;
	padding: 8rpx 20rpx 8rpx 8rpx;
	border: 1rpx solid rgba(223, 234, 248, 0.92);
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.86);
	box-shadow: 0 14rpx 32rpx rgba(53, 86, 128, 0.12);
}

.brand-chip image {
	width: 60rpx;
	height: 60rpx;
	border-radius: 18rpx;
	flex-shrink: 0;
}

.brand-chip view view {
	color: #101722;
	font-size: 27rpx;
	font-weight: 900;
	line-height: 1.1;
}

.brand-chip text {
	display: block;
	margin-top: 5rpx;
	color: #647286;
	font-size: 20rpx;
}

.hero-title {
	width: 410rpx;
	margin-top: 54rpx;
	color: #101722;
	font-size: 46rpx;
	font-weight: 900;
	line-height: 1.22;
	letter-spacing: 0;
}

.hero-sub {
	width: 390rpx;
	margin-top: 18rpx;
	color: #566377;
	font-size: 25rpx;
	line-height: 1.58;
}

.trust-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-top: 26rpx;
}

.trust-row view {
	padding: 10rpx 16rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.8);
	color: #4f5d70;
	font-size: 21rpx;
	font-weight: 800;
	box-shadow: 0 8rpx 20rpx rgba(53, 86, 128, 0.08);
}

.login-panel {
	position: relative;
	z-index: 2;
	margin-top: 0;
	padding: 30rpx 28rpx 26rpx;
	border: 1rpx solid rgba(223, 234, 248, 0.9);
	border-radius: 32rpx;
	background: rgba(255, 255, 255, 0.9);
	box-shadow: 0 24rpx 62rpx rgba(53, 86, 128, 0.12);
	backdrop-filter: blur(16px);
}

.panel-head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 20rpx;
}

.panel-title {
	color: #101722;
	font-size: 34rpx;
	font-weight: 900;
}

.panel-head text {
	display: block;
	margin-top: 10rpx;
	color: #6b778a;
	font-size: 23rpx;
	line-height: 1.4;
}

.secure-mark {
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 20rpx;
	background: #fff3bf;
	flex-shrink: 0;
}

.method-tabs {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 14rpx;
	margin-top: 18rpx;
	padding: 0;
	border-radius: 0;
	background: transparent;
}

.bottom-method-tabs {
	margin-top: 20rpx;
}

.method-tab {
	height: 72rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
	border: 1rpx solid #dfeaf8;
	border-radius: 22rpx;
	background: rgba(255, 255, 255, 0.72);
	color: #6b778a;
	font-size: 24rpx;
	font-weight: 900;
}

.method-tab.active {
	border-color: rgba(255, 207, 36, 0.7);
	background: #ffcf24;
	color: #101722;
	box-shadow: 0 12rpx 24rpx rgba(255, 197, 31, 0.18);
}

.method-tab text {
	line-height: 1;
}

.login-fields {
	margin-top: 22rpx;
	border: 0;
	border-radius: 0;
	background: transparent;
	overflow: visible;
}

.field-block {
	padding: 0;
	border-bottom: 0;
}

.field-block + .field-block {
	margin-top: 24rpx;
}

.field-label {
	margin-bottom: 12rpx;
	color: #4f5d70;
	font-size: 23rpx;
	font-weight: 900;
}

.field-label-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
	margin-bottom: 14rpx;
}

.field-label-row .field-label {
	margin-bottom: 0;
}

.input-shell {
	height: 88rpx;
	padding: 0 24rpx;
	border: 1rpx solid #dfeaf8;
	border-radius: 24rpx;
	background: #f7fbff;
}

.field-input {
	height: 88rpx;
	line-height: 88rpx;
	font-size: 31rpx;
	font-weight: 800;
}

.input-placeholder {
	color: #a4afbf;
}

.inline-code-action {
	flex-shrink: 0;
	min-width: 150rpx;
	height: 58rpx;
	line-height: 58rpx;
	padding: 0 18rpx;
	border-radius: 18rpx;
	background: #fff3bf;
	color: #101722;
	box-shadow: 0 8rpx 18rpx rgba(255, 197, 31, 0.18);
	text-align: center;
	font-size: 23rpx;
	font-weight: 900;
	box-sizing: border-box;
}

.inline-code-action.disabled {
	background: #f3f7fc;
	color: #9aa6b6;
	box-shadow: none;
}

.code-box-wrap {
	position: relative;
	display: grid;
	grid-template-columns: repeat(6, 1fr);
	gap: 10rpx;
}

.code-hidden-input {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 78rpx;
	opacity: 0;
	z-index: 2;
}

.code-box {
	height: 78rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1rpx solid #dfeaf8;
	border-radius: 18rpx;
	background: #f7fbff;
	color: #101722;
	font-size: 34rpx;
	font-weight: 900;
	box-sizing: border-box;
}

.code-box.filled,
.code-box.focus {
	border-color: rgba(61, 139, 255, 0.48);
	background: #eef6ff;
	box-shadow: inset 0 0 0 2rpx rgba(61, 139, 255, 0.08);
}

.code-inline-tip {
	margin-top: 14rpx;
	color: #6b778a;
	font-size: 22rpx;
	line-height: 1.45;
}

.login-btn {
	margin-top: 26rpx;
	height: 94rpx;
	line-height: 94rpx;
	border-radius: 26rpx;
	background: #101722;
	color: #ffffff;
	font-size: 32rpx;
	font-weight: 900;
}

.agreement-row {
	margin-top: 22rpx;
}

.agreement-text {
	color: #647286;
	font-size: 22rpx;
}

.guest-entry {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
	margin-top: 20rpx;
	padding: 18rpx 22rpx;
	border: 1rpx solid #dfeaf8;
	border-radius: 24rpx;
	background: #f6faff;
}

.guest-copy {
	min-width: 0;
}

.guest-copy view {
	color: #101722;
	font-size: 25rpx;
	font-weight: 900;
}

.guest-copy text {
	display: block;
	margin-top: 8rpx;
	color: #6b778a;
	font-size: 22rpx;
}

.guest-btn {
	flex-shrink: 0;
	padding: 12rpx 22rpx;
	border-radius: 999rpx;
	background: #ffcf24;
	color: #101722;
	font-size: 24rpx;
	font-weight: 900;
}
</style>
