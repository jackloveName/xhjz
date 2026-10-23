import {get_batch_pre_sign_url,save_to_platform} from "@/api/uploadimg.js"
// #ifdef H5
import ImageCompressor from 'compressorjs'
// #endif
const fileUpload = {
  // 选取图片
  chooseImage ({ count = 1, sourceType, sizeType }) {
    let permissionStr = 'readStorage'
    if (String(sourceType) === 'camera') {
      permissionStr = 'camera'
    }
    return new Promise((resolve, reject) => {
      // checkAuthorize(permissionStr, {
      //   success: () => {
      uni.chooseImage({
        count,
        sizeType: sizeType || ['compressed'],
        sourceType: sourceType || ['album'],
        success: async (res) => {
          const checkRes = await this.checkFileType(res.tempFiles)
          if (checkRes) {
            this.uploadImgs(res, 1).then(resData => {
              resolve(resData)
            }).catch(err => {
              reject(err)
            })
          }
        }
      })
      //   }
      // })
    })
  },
  // 文件类型校验（当前只校验图片）
  checkFileType (fileList) {
    return new Promise((resolve) => {
      for (const fileItem of fileList) {
        if (!['png', 'jpg', 'jpeg', 'PNG', 'JPG', 'JPEG'].includes(this.getFileType(fileItem))) {
          uni.showToast({
            title: '只能是图片类型',
            icon: 'none'
          })
          resolve(false)
          break
        }
      }
      resolve(true)
    })
  },
  // 上传文件 type 1:图片 2:视频 3:文件
  uploadImgs: async function (res, type) {
    // 文件的本地临时文件路径列表
    const tempFiles = res.tempFiles
    const ossList = await this.getBatchPreSignUrl(tempFiles)
	console.log(ossList)
    const promises = ossList.map((item, index) => {
      return new Promise((resolve, reject) => {
        // 设置请求头类型
        const _type = item.fileName.split('.')[1]
        const contentType = type === 1 ? _type.indexOf('image/') > -1 ? _type : 'image/' + _type : 'application/x-www-form-urlencoded'
        // 压缩图片回调
        fileUpload.getCompressedFileInfo(res.tempFiles[index]).then(async (compressFileInfo) => {
          const { filePath, size } = compressFileInfo
          this.awsUpload(filePath, item.preSignUrl, contentType).then(() => {
            // type 1:图片 2:视频 3:文件
            resolve({
              type,
              fileType: this.getFileType(tempFiles[index]),
              fileName: this.getFileName(tempFiles[index]),
              filePath: '/' + item.dir + item.fileName,
              fileSize: size
            })
          }).catch((err) => {
            reject(err)
          })
        })
      })
    })
    return Promise.all(promises)
  },
  // 图片资源转流
  awsUpload (filePath, preSignUrl, contentType) {
    return new Promise((resolve, reject) => {
      // #ifdef APP-PLUS
      this.plusIo(filePath).then((buffer) => {
        const params = {
          url: preSignUrl,
          method: 'put',
          data: buffer,
          header: {
            'Content-Type': contentType
          }
        }
        uni.request(params).then(() => {
          uni.hideLoading()
          resolve()
        }).catch((error) => {
          reject(error) // 请求失败时 reject
        })
      })
      // #endif
      // #ifdef H5
      uni.request({
        url: filePath,
        method: 'GET',
        responseType: 'arraybuffer',
        success: function (requestRes) {
          const params = {
            url: preSignUrl,
            method: 'put',
            data: requestRes.data,
            header: {
              'Content-Type': contentType
            }
          }
          uni.request(params).then(() => {
            uni.hideLoading()
            resolve()
          }).catch((error) => {
            reject(error) // 请求失败时 reject
          })
        }
      })
      // #endif
      // #ifdef MP-WEIXIN
      uni.getFileSystemManager().readFile({
        filePath,
        success: function (requestRes) {
          const params = {
            url: preSignUrl,
            method: 'put',
            data: requestRes.data,
            header: {
              'Content-Type': contentType
            }
          }
          uni.request(params).then(() => {
            uni.hideLoading()
            resolve()
          }).catch((error) => {
            reject(error) // 请求失败时 reject
          })
        }
      })
      // #endif
    })
  },
  // 获取图片上传的签名地址
  getBatchPreSignUrl (tempFiles) {
    return new Promise((resolve) => {
      const fileNames = tempFiles?.map(item => this.getFileName(item)).join(',')
	  get_batch_pre_sign_url({fileNames}).then(data=>{
		  resolve(data)
	  })
      // http.request({
      //   url: '/mall_biz/ua/oss/get_batch_pre_sign_url',
      //   method: 'GET',
      //   data: {
      //     fileNames
      //   },
      //   selfLoading: true
      // }).then((data) => {
      //   resolve(data)
      // })
    })
  },
  plusIo: (filePath) => {
    return new Promise((resolve) => {
      plus.io.resolveLocalFileSystemURL(filePath, async function (entry) {
        entry.file(function (file) { // 读取文件
          const reader = new plus.io.FileReader()
          reader.readAsDataURL(file) // 以URL格式读取文件
          reader.onload = function () {
            const base64 = this.result.split(',')[1] // 获取base64字符串
            const buffer = uni.base64ToArrayBuffer(base64) // 转换为arrayBuffer格式
            resolve(buffer)
          }
        })
      })
    })
  },
  getFileType (imgInfo) {
    let _type = ''
    // #ifdef H5
    _type = imgInfo.name.substring(imgInfo.name.lastIndexOf('.') + 1)
    // #endif
    // #ifndef H5
    const _path = imgInfo.path
    _type = _path.substring(_path.lastIndexOf('.') + 1)
    // #endif
    return _type
  },
  getFileName (imgInfo) {
    let fileName = ''
    // #ifdef H5
    fileName = imgInfo.name
    // #endif
    // #ifdef APP-PLUS
    fileName = imgInfo.path
    // #endif
    return fileName
  },
  // 保存凭证到平台资源管理
  saveAttachFileToPlat: (data) => {
    if (!data || !data.length) return true
    return new Promise(resolve => {
		save_to_platform(data).then(res=>{
			resolve(true)
		}).catch(err=>{
			resolve(false)
		})
      // http.request({
      //   url: '/mall_biz/attach_file/save_to_platform',
      //   method: 'POST',
      //   data,
      //   selfLoading: true
      // }).then(() => {
      //   resolve(true)
      // }).catch(() => {
      //   resolve(false)
      // })
    })
  },

  /**
   * 压缩图片文件
   * @param {file} file 将要压缩的文件
   * @returns {Promise} 压缩后的文件信息；(H5端返回base64格式图片)
   */
  getCompressedFileInfo: (file) => {
    return new Promise((resolve, reject) => {
		// #ifdef H5
		fileUpload.compressImage(file).then((compressFile) => {
		  const reader = new FileReader()
		  reader.onload = (event) => {
		    const filePath = event.target.result // Base64 字符串
		    resolve({ filePath, size: compressFile.size })
		  }
		  reader.onerror = (error) => {
		    console.error('转换失败：', error)
		    reject(error)
		  }
		  reader.readAsDataURL(new File([compressFile], file.name, { type: file.type }))
		})
		// #endif
      // #ifdef APP-PLUS
      const path = file.tempFilePath || file.path
      uni.getImageInfo({
        src: path,
        success: (imgInfo) => {
          uni.compressImage({
            src: path,
            quality: 80,
            compressedWidth: imgInfo.width > 1080 ? 1080 : imgInfo.width,
            success: (compressImageRes) => {
              const filePath = compressImageRes.tempFilePath
              // #ifdef APP-PLUS
              uni.getFileInfo({
                filePath,
                success: (fileInfoRes) => {
                  resolve({ filePath, size: fileInfoRes.size })
                },
                fail: (error) => {
                  console.error('getFileInfo fail', error)
                  reject(error)
                }
              })
              // #endif
            },
            fail: (compressErrMsg) => {
              console.error('compressErrMsg', compressErrMsg)
              reject(compressErrMsg)
            }
          })
        },
        fail: (error) => {
          console.error('getImgInfo fail', error)
          reject(error)
        }
      })
      // #endif
    })
  },
  /**
   * H5端的压缩图片
   * @param {File} file - 要压缩的图片文件
   * @returns {Promise<File>} - 压缩后的图片文件
   */
  compressImage: async (file) => {
    const isSize = file.size / 1024 < 512
    if (isSize) {
      return file
    }
    // 0.5m~5m，从0.8开始循环。5m~10m，从0.6开始循环。10m以上就直接0.4。
    // 最低使用0.4
    let quality
    if (file.size / 1024 / 1024 < 5) {
      quality = 0.8
    } else if (file.size / 1024 / 1024 < 10) {
      quality = 0.6
    } else {
      quality = 0.4
    }
    try {
      let resultBlob
      let index = true
      while (index) {
        resultBlob = await fileUpload.ImageCompressorFn(file, quality)
        if (resultBlob.size / 1024 < 512 || quality <= 0.4) {
          index = false
        } else {
          quality = (quality * 10 - 2) / 10
        }
      }
      return new File([resultBlob], { type: file.type })
    } catch (error) {
      console.error('图片压缩失败:', error)
      // 返回原文件
      return file
    }
  },
  
  ImageCompressorFn: (file, quality = 0.6) => {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line no-new
      new ImageCompressor(file, {
        quality,
        convertSize: 512000,
        maxWidth: 1080,
        success (result) {
          resolve(result)
        },
        error (err) {
          reject(err)
        }
      })
    })
  }
}

export default fileUpload
