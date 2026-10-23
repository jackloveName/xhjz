/*
 *
 *
 * https://www.mall.com/
 *
 * 未经允许，不可做商业用途！
 *
 * 版权所有，侵权必究！
 */
import config from '@/config'
// 应用类型
const AppType = {
    MINI: 1, // 微信小程序
    MP: 2, // 微信公众号
    PC: 3, // pc
    H5: 4, // h5
    ANDROID: 5, // 安卓
    IOS: 6, // 苹果
    ALI: 7, // 支付宝H5
    ALIMINI: 8 // 支付宝小程序
}

const util = {
    /**
     * 防抖
     * @param fn
     * @param t
     * @returns {Function}
     */
    debounce: (fn, t) => {
        const delay = t || 300
        let timer
        return function () {
            const args = arguments
            if (timer) {
                console.error('debounce 触发了前端请求防抖，请等待' + delay + '毫秒后点击')
                clearTimeout(timer)
            }
            const callNow = !timer
            timer = setTimeout(() => {
                timer = null
            }, delay)
            if (callNow) fn.apply(util, args)
        }
    },
    /**
     * 设置应用类型
     */
    setAppType() {
        // #ifdef H5
        uni.setStorageSync('cloudAppType', AppType.H5) // 普通H5
        const ua = navigator.userAgent.toLowerCase()
        if (ua.search(/MicroMessenger/i) > -1) {
            // 微信环境
            uni.setStorageSync('cloudAppType', AppType.MP)
        }
        // #endif
        // #ifdef APP-PLUS
        uni.getSystemInfo({
            success: (sysInfo) => {
                if (sysInfo.platform === 'android') {
                    uni.setStorageSync('cloudAppType', AppType.ANDROID)
                } else {
                    uni.setStorageSync('cloudAppType', AppType.IOS)
                }
            }
        })
        // #endif
        // #ifdef MP-WEIXIN
        uni.setStorageSync('cloudAppType', AppType.MINI)
        // #endif
    },
    //  获取今天日期
    getTodayDate() {
        const date = new Date()
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const day = date.getDate()
        return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`
    },
    getMonthDate() {
        const date = new Date()
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        return `${year}-${month < 10 ? '0' + month : month}`
    },
    getDaysByYearMonth(str) {
        const [year, month] = str.split('-').map(Number);
        return new Date(year, month, 0).getDate();
    },
    getWeekDay(dateStr) {
        const week = ['日', '一', '二', '三', '四', '五', '六'];
        const day = new Date(dateStr).getDay();
        return '周' + week[day];
    },
    checkFileUrl: (fileUrl) => {
        if (fileUrl === '') return ''
        const baseUrl = config.ossUrl
        const url = String(fileUrl || '')
        const isLocalFile = /^(file:|blob:|data:|wxfile:|content:|_doc\/|_www\/|\/var\/|\/tmp\/|\/private\/)/.test(url)
        if (url && url.indexOf('http') === -1 && !isLocalFile) {
            return baseUrl + fileUrl
        } else {
            return fileUrl
        }
    },
    /**
   * 获取上个月的年月字符串（支持跨年，自动处理 1月 → 去年12月）
   * @param {string} yearMonth 格式：YYYY-MM 例如 2026-01
   * @returns {string} 上一个月 格式：YYYY-MM
   */
    getLastMonth(yearMonth) {
        // 拆分 年 和 月
        let [year, month] = yearMonth.split('-').map(Number)
        // 核心：月份减1，如果变成0，就年份-1，月份设为12
        month--
        if (month === 0) {
            year--
            month = 12
        }
        // 拼接成 YYYY-MM 格式返回
        return `${year}-${String(month).padStart(2, '0')}`
    },
    formatTime(dateStr) {
        const target = new Date(dateStr);
        const now = new Date();
        // 今天0点、昨天0点、前天0点
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
        const diffTime = today - targetDay;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        // 只取后面的时间部分：08:30:00
        const timeStr = dateStr.split(' ')[1] || '';
        if (diffDays === 0) {
            return '今日 ' + timeStr;
        } else if (diffDays === 1) {
            return '昨天 ' + timeStr;
        } else if (diffDays === 2) {
            return '前天 ' + timeStr;
        } else {
            return dateStr;
        }
    },
    formatDate(timestamp, fmt = 'YYYY-MM-DD HH:mm:ss') {
        let time = Number(timestamp)
        if (time.toString().length === 10) time = time * 1000
        const date = new Date(time)

        const o = {
            'M+': date.getMonth() + 1,
            'D+': date.getDate(),
            'H+': date.getHours(),
            'm+': date.getMinutes(),
            's+': date.getSeconds(),
        }
        if (/(Y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
        }
        for (let k in o) {
            if (new RegExp(`(${k})`).test(fmt)) {
            fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length))
            }
        }
        return fmt
    }
}
export default util
