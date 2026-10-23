<script setup>
  import permissionListener from './utils/authorize/permissionListener.js'
  import config from './config'
  import { getGuestMode, getToken } from '@/utils/auth'
  import { useConfigStore } from '@/store'
  import { getCurrentInstance } from "vue"
  import { onLaunch,onShow,onHide } from '@dcloudio/uni-app'

  const { proxy } = getCurrentInstance()

  onLaunch(() => {
    initApp()
  })
	onShow(() => {
        permissionListener?.listenerFunc()
    })
    onHide(()=>{
        permissionListener?.stopFunc()
    })
  // 初始化应用
  function initApp() {
    // 初始化应用配置
    initConfig()
    // 检查用户登录状态
    //#ifdef H5
    checkLogin()
    //#endif
  }

  function initConfig() {
    useConfigStore().setConfig(config)
  }

  function checkLogin() {
    if (!getToken() && !getGuestMode()) {
      proxy.$tab.reLaunch('/pages/login') 
    }
  }
</script>

<style lang="scss">
  @import '@/static/scss/index.scss';
  @import "uview-plus/index.scss";
</style>
