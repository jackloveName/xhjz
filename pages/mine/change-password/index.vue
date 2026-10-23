<template>
	<view class="change-password-container">
		<view class="bg-decoration">
			<view class="bg-circle bg-circle-1"></view>
			<view class="bg-circle bg-circle-2"></view>
		</view>

		<view class="step-indicator">
			<view class="step-item" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
				<view class="step-number">1</view>
				<view class="step-text">验证手机</view>
			</view>
			<view class="step-line" :class="{ active: currentStep > 1 }"></view>
			<view class="step-item" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
				<view class="step-number">2</view>
				<view class="step-text">设置密码</view>
			</view>
		</view>

		<view v-if="currentStep === 1" class="step-content">
			<view class="title">验证手机号</view>
			<view class="subtitle">为了您的账号安全，请先验证手机号</view>

			<view class="input_box">
				<up-form labelPosition="left" :model="verifyForm" ref="form1">
					<up-form-item label="手机号" :borderBottom="true" labelWidth="80">
            {{ verifyForm.mobile }}
					</up-form-item>
					<up-form-item label="验证码" labelWidth="80" borderBottom>
						<up-input v-model="verifyForm.validCode" type="number" maxlength="6"
							border="none" placeholder="请输入验证码"></up-input>
						<up-button #right @tap="getCode" :text="tips" type="success"
							size="mini" color="#3d8bff" style="flex: 0.5;"
							:disabled="disabled1"></up-button>
					</up-form-item>
				</up-form>
			</view>

			<button class="submit_btn" @tap="verifyCode">下一步</button>
		</view>

		<view v-if="currentStep === 2" class="step-content">
			<view class="title">设置新密码</view>
			<view class="subtitle">密码需包含字母、数字和特殊符号</view>

			<view class="input_box">
				<up-form labelPosition="left" :model="passwordForm" ref="form2">
					<up-form-item label="新密码" :borderBottom="true" labelWidth="100">
						<up-input v-model="passwordForm.newPassword" type="password"
							maxlength="20" border="none" placeholder="请输入新密码"></up-input>
					</up-form-item>
					<up-form-item label="确认密码" labelWidth="100" borderBottom>
						<up-input v-model="passwordForm.confirmPassword" type="password"
							maxlength="20" border="none" placeholder="请再次输入新密码"></up-input>
					</up-form-item>
				</up-form>
			</view>

			<view class="password-tips">
				<view class="tip-item" :class="{ valid: passwordRules.hasLetter }">
					<text class="icon">{{ passwordRules.hasLetter ? '✓' : '○' }}</text>
					<text>包含字母</text>
				</view>
				<view class="tip-item" :class="{ valid: passwordRules.hasNumber }">
					<text class="icon">{{ passwordRules.hasNumber ? '✓' : '○' }}</text>
					<text>包含数字</text>
				</view>
				<view class="tip-item" :class="{ valid: passwordRules.hasSpecial }">
					<text class="icon">{{ passwordRules.hasSpecial ? '✓' : '○' }}</text>
					<text>包含特殊符号</text>
				</view>
				<view class="tip-item" :class="{ valid: passwordRules.lengthValid }">
					<text class="icon">{{ passwordRules.lengthValid ? '✓' : '○' }}</text>
					<text>长度6-20位</text>
				</view>
			</view>

			<button class="submit_btn" @tap="submitPassword">完成修改</button>
			<view class="back-btn" @tap="backToStep1">返回上一步</view>
		</view>

		<Verify
			ref="verifyRef"
			:mode="'pop'"
			captcha-type="blockPuzzle"
			:v-space="15"
			:img-size="{ width: '320px', height: '160px' }"
			@success="onVerifySuccess"
		/>
	</view>
</template>

<script setup>
import { ref, computed, getCurrentInstance, onUnmounted } from "vue"
import { onLoad } from "@dcloudio/uni-app"
import { useUserStore } from '@/store'
import Verify from '@/components/verify/verify.vue'
import { sendUpdatePwdCode, checkUpdatePwdCode, forgetPassword } from "@/api/login.js"
import { encrypt } from '@/utils/crypto'
import util from "@/utils/utils"

const { proxy } = getCurrentInstance()
const userStore = useUserStore()
const currentStep = ref(1)
const verifyForm = ref({
	mobile: "",
	validCode: ""
})
const passwordForm = ref({
	newPassword: "",
	confirmPassword: ""
})
const tips = ref('获取验证码')
const disabled1 = ref(false)
const verifyRef = ref(null)
let timer = null
const checkUpdatePwdSmsFlag = ref("")

const passwordRules = computed(() => {
	const pwd = passwordForm.value.newPassword
	return {
		hasLetter: /[a-zA-Z]/.test(pwd),
		hasNumber: /[0-9]/.test(pwd),
		hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
		lengthValid: pwd.length >= 6 && pwd.length <= 20
	}
})

const isPasswordValid = computed(() => {
	return passwordRules.value.hasLetter &&
		   passwordRules.value.hasNumber &&
		   passwordRules.value.hasSpecial &&
		   passwordRules.value.lengthValid
})

const getCode = () => {
	verifyRef.value.show()
}

const onVerifySuccess = (verifyResult) => {
	sendUpdatePwdCode({
		mobile: verifyForm.value.mobile,
		captchaVerification: verifyResult.captchaVerification
	}).then(() => {
		startInterval()
		uni.hideLoading()
		proxy.$modal.msgSuccess("验证码已发送")
	}).catch(() => {
		uni.hideLoading()
	})
}

const startInterval = () => {
	const entryTime = parseInt(new Date().getTime() / 1000)
	let currentTime = 0
	const maxtime = 60
	tips.value = `${maxtime}s`
	disabled1.value = true
	timer = setInterval(() => {
		currentTime = parseInt(new Date().getTime() / 1000)
		const TimeDifference = currentTime - entryTime
		const mytime = maxtime - TimeDifference
		if (TimeDifference <= maxtime) {
			tips.value = `${Math.floor(mytime % 60)}s`
		} else {
			clearInterval(timer)
			timer = null
			tips.value = '获取验证码'
			disabled1.value = false
		}
	}, 1000)
}

const verifyCode = util.debounce(() => {
	if (!verifyForm.value.validCode.trim()) {
		proxy.$modal.msgError("请输入验证码")
		return
	}

	proxy.$modal.loading("验证中...")
	checkUpdatePwdCode({
		mobile: verifyForm.value.mobile,
		validCode: verifyForm.value.validCode
	}).then((res) => {
		proxy.$modal.closeLoading()
		checkUpdatePwdSmsFlag.value = res
		currentStep.value = 2
		proxy.$modal.msgSuccess("验证成功")
	}).catch(() => {
		proxy.$modal.closeLoading()
	})
}, 600)

const backToStep1 = () => {
	currentStep.value = 1
	passwordForm.value.newPassword = ""
	passwordForm.value.confirmPassword = ""
}

const submitPassword = util.debounce(() => {
	if (!passwordForm.value.newPassword.trim()) {
		proxy.$modal.msgError("请输入新密码")
		return
	}

	if (!isPasswordValid.value) {
		proxy.$modal.msgError("密码必须包含字母、数字和特殊符号，长度6-20位")
		return
	}

	if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
		proxy.$modal.msgError("两次输入的密码不一致")
		return
	}

	proxy.$modal.loading("修改中...")
	forgetPassword({
		checkUpdatePwdSmsFlag: checkUpdatePwdSmsFlag.value,
		mobile: verifyForm.value.mobile,
		newPassword: encrypt(passwordForm.value.newPassword),
		sysType: 0
	}).then(() => {
		proxy.$modal.closeLoading()
		proxy.$modal.msgSuccess("密码修改成功，请重新登录")
		setTimeout(() => {
			userStore.logOut().then(() => {
				proxy.$tab.reLaunch('/pages/login')
			})
		}, 1500)
	}).catch(() => {
		proxy.$modal.closeLoading()
	})
}, 600)

onLoad(() => {
	const userInfo = userStore.user_info
	if (userInfo && userInfo.userMobile) {
		verifyForm.value.mobile = userInfo.userMobile
	} else {
		proxy.$modal.msgError("未获取到手机号")
		setTimeout(() => {
			uni.navigateBack()
		}, 1500)
	}
})

onUnmounted(() => {
	if (timer) {
		clearInterval(timer)
		timer = null
	}
})
</script>

<style lang="scss" scoped>
page {
	background-color: #f8fbff;
}

.change-password-container {
	position: relative;
	width: 100%;
	min-height: 100vh;
	padding: 42rpx 30rpx 80rpx;
	overflow: hidden;
	background:
		radial-gradient(circle at 86% 3%, rgba(248, 222, 217, 0.72), transparent 28%),
		linear-gradient(180deg, #f5f9ff 0%, #f8fbff 62%, #ffffff 100%);
	color: #252922;

	.bg-decoration {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
		z-index: 0;

		.bg-circle {
			position: absolute;
			border-radius: 50%;
			filter: blur(56rpx);
			opacity: 0.38;
		}
		.bg-circle-1 {
			width: 420rpx;
			height: 420rpx;
			top: -120rpx;
			right: -120rpx;
			background: #f8ded9;
		}
		.bg-circle-2 {
			width: 300rpx;
			height: 300rpx;
			top: 280rpx;
			left: -100rpx;
			background: #d9e6cf;
			opacity: 0.5;
		}
	}

	.step-indicator {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 54rpx;

		.step-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 12rpx;

			.step-number {
				width: 56rpx;
				height: 56rpx;
				border-radius: 50%;
				background: #eeeae1;
				color: #8b8f87;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 28rpx;
				font-weight: 600;
				transition: all 0.3s;
			}

			.step-text {
				font-size: 24rpx;
				color: #8b8f87;
				transition: all 0.3s;
			}

			&.active {
				.step-number {
					background: linear-gradient(180deg, #5ba7ff 0%, #3d8bff 100%);
					color: #fff;
					box-shadow: 0 8rpx 18rpx rgba(79, 133, 70, 0.22);
				}
				.step-text {
					color: #3d8bff;
					font-weight: 600;
				}
			}

			&.completed {
				.step-number {
					background: #c59b5b;
					color: #fff;
				}
			}
		}

		.step-line {
			width: 120rpx;
			height: 4rpx;
			background: #eeeae1;
			margin: 0 24rpx;
			margin-bottom: 40rpx;
			transition: all 0.3s;

			&.active {
				background: linear-gradient(90deg, #5ba7ff 0%, #c59b5b 100%);
			}
		}
	}

	.step-content {
		position: relative;
		z-index: 1;

		.title {
			font-size: 44rpx;
			font-weight: 800;
			color: #101722;
			text-align: center;
			margin-bottom: 16rpx;
		}

		.subtitle {
			font-size: 26rpx;
			color: #5d697b;
			text-align: center;
			margin-bottom: 48rpx;
		}

		.input_box {
			background: rgba(255, 255, 255, 0.86);
			padding: 12rpx 32rpx;
			border-radius: 24rpx;
			border: 1rpx solid #edf2f8;
			box-shadow: 0 16rpx 38rpx rgba(54, 64, 48, 0.07);
			margin-bottom: 32rpx;
		}

		.password-tips {
			background: rgba(255, 255, 255, 0.82);
			padding: 32rpx;
			border-radius: 24rpx;
			border: 1rpx solid #edf2f8;
			margin-bottom: 32rpx;
			backdrop-filter: blur(20rpx);

			.tip-item {
				display: flex;
				align-items: center;
				gap: 16rpx;
				margin-bottom: 20rpx;
				font-size: 26rpx;
				color: #8b8f87;
				transition: all 0.3s;

				&:last-child {
					margin-bottom: 0;
				}

				.icon {
					width: 32rpx;
					height: 32rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 24rpx;
				}

				&.valid {
					color: #3d8bff;
					font-weight: 600;

					.icon {
						color: #3d8bff;
					}
				}
			}
		}

		.submit_btn {
			width: 100%;
			height: 104rpx;
			line-height: 104rpx;
			border: none;
			text-align: center;
			background: linear-gradient(180deg, #5ba7ff 0%, #3d8bff 55%, #2f6faf 100%);
			color: #fff;
			border-radius: 52rpx;
			font-size: 32rpx;
			font-weight: 600;
			letter-spacing: 0;
			box-shadow: 0 18rpx 36rpx rgba(79, 133, 70, 0.2);
			transition: transform 0.15s;

			&:active {
				transform: scale(0.98);
			}

			&::after {
				border: none;
			}
		}

		.back-btn {
			text-align: center;
			color: #5d697b;
			font-size: 28rpx;
			margin-top: 32rpx;
			padding: 20rpx;
		}
	}
}
</style>
