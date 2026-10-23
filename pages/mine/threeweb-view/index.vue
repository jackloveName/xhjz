<template>
	<web-view :src="url" :progress="false" />
</template>

<script setup>
	import { ref,getCurrentInstance} from 'vue'
	import { onLoad, onReady, onUnload,onBackPress,onHide} from "@dcloudio/uni-app"
	const url = ref('')
	var time1, time2
	onLoad((item) => {
		const durl = decodeURIComponent(item.url)
		console.log('three-1', durl)
		if (durl.endsWith('.apk') || durl.includes('apps.apple.com') || durl.includes('open_external=true') || durl
			.includes('.plist')) {
			plus.runtime.openURL(durl)
			// 如果这个页面就是个空壳，不需要留着，可以退回上一页
			if(time1){
				clearTimeout(time1)
			}
			time1 = setTimeout(() => {
				uni.reLaunch({
					url: '/pages/mine/agreement/agreement'
				})
			}, 1000)
			return // 终止后续 Webview 创建逻辑
		}
		url.value = durl
	})
	onBackPress((options) => {
		// console.log('返回按钮点击事件触发',options)
		if (options.from === 'backbutton') {
			console.log('用户点击了原生返回按钮');
			// 执行你的逻辑，例如直接关闭当前 web-view 页面
			time2 = setTimeout(() => {
				uni.reLaunch({
					url: '/pages/mine/agreement/agreement'
				})
			}, 400);
			// // 关键：返回 true 之后，系统将不再执行默认的返回逻辑（即不再尝试让 web-view 后退）
			return true;
		}
		return false
	})
	onReady(() => {
		setTimeout(() => {
			// #ifdef APP-PLUS
			// 获取当前 Webview 对象
			const pages = getCurrentPages()
			const page = pages[pages.length - 1]
			const currentWebview = page.$getAppWebview().children()[0]
			console.log(currentWebview)
			if(!currentWebview){
				return
			}
			if (uni.getSystemInfoSync().platform === 'android') {
				// 在页面加载完成时注入，防止第三方页面自带的 alert 弹出
				currentWebview.addEventListener('loaded', () => {
					overrideAlert(currentWebview);
				});
			}
			// 监听即将跳转的URL
			// currentWebview.overrideUrlLoading({
			//   mode: 'reject' // 阻止WebView默认加载
			// }, e => {
			//   const url = e.url
			//   // 如果是APK或App Store地址
			//   if (url.endsWith('.apk') || url.includes('apps.apple.com') || url.includes('open_external=true')||url.includes('.plist')) {
			//   // 调用系统浏览器打开
			//     plus.runtime.openURL(url)
			//   } else {
			//   // // 否则正常加载
			//   //   currentWebview.loadURL(url,{reload: true})
			//    // 临时关闭overrideUrlLoading，允许本次URL正常加载
			//       currentWebview.overrideUrlLoading({ mode: 'allow' });
			//       // 执行原生加载（无reload参数，避免中断重定向）
			//       currentWebview.loadURL(url);
			//       // 重新开启overrideUrlLoading，保证后续URL仍被拦截
			//       setTimeout(() => {
			//         currentWebview.overrideUrlLoading({ mode: 'reject' }, arguments.callee);
			//       }, 0);
			//   }
			// })
			// #endif
		}, 1000)
	})
	const overrideAlert = (webview) => {
		webview.evalJS(`
    (function() {
      function override() {
        window.alert = function(msg) {
          if (window.plus && plus.nativeUI) {
            plus.nativeUI.alert(msg, function(){}, "提示", "确定");
          } else {
            console.log('plus not ready');
          }
        };
      }
      override();
      setTimeout(override, 500);
      setTimeout(override, 1500);
    })();
  `);
	}
	onHide(() => {
		console.log(time1)
	  // if(time1){
		 //  clearTimeout(time1)
	  // }
	  if(time2){
		  clearTimeout(time2)
	  }
	})
</script>
