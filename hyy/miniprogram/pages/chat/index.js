// miniprogram/pages/chat/index.js
const app = getApp();
var wxst = function () { }
const myUrl = `ws://${app.ip}:8081` // websocket链接
const { $Message } = require('../../dist/base/index');
const formatTime = require('../../utils/time').formatTime;

var chatWs // socket发送的消息队列
var socketMsgQueue = []
var socketOpen = true // 判断心跳变量
var heart = ''  // 心跳失败次数
var chatHeartBeatFailCount = 0 // 终止心跳
var chatHeartBeatTimeOut = null; // 终止重新连接
var connectSocketTimeOut = null;
var chatVoiceInterval = null
const recorderManager = wx.getRecorderManager()
var errorConnectTimeOut = null;
Page({
  /**
   * 页面的初始数据
   */
  data: {
    inputValue: '',
    height: '',
    show: false,
    _openid: '',
    _name: '',
    _avatarUrl: '',
    value: '',
    content: [],
    scrollTop: 0,
    user: [],
    showPerson: false,
    showUser: false,
    addUser: {},
    num: 0,
    showVoice: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let _this = this;
    wx.getSystemInfo({
      success(res) {
        _this.setData({
          height: res.windowHeight - 51
        })
      }
    })
    wx.getStorage({
      key: '_openid',
      success: function (res) {
        wx.getStorage({
          key: '_userInfo',
          success: function (res2) {
            let _name = JSON.parse(res2.data).nickName
            let _avatarUrl = JSON.parse(res2.data).avatarUrl;
            // 开启连接
            _this.setData({
              _openid: res.data,
              _name: _name,
              _avatarUrl: _avatarUrl
            })
            _this.connectStart(res.data, _name, _avatarUrl);
          },
          fail: function () {
            wx.redirectTo({
              url: '../auth/index',
            })
          }
        })
      },
      fail: function () {
        wx.redirectTo({
          url: '../auth/index',
        })
      }
    })
  },
  copy: function (e) {
    wx.setClipboardData({
      data: e.detail,
      success(res) {
        $Message({
          content: 'ID复制成功，可返回进行1v1聊天',
          type: 'success'
        });
      }
    })
  },
  inputChange: function (e) {
    this.setData({
      inputValue: e.detail.detail.value
    })
  },
  send: function () {
    let _this = this;
    if (!_this.data.inputValue) {
      $Message({
        content: '内容不能为空',
        type: 'warning'
      });
      return false;
    }
    let msg = {
      type: 'text',
      content: _this.data.inputValue,
      time: formatTime(new Date())
    }
    _this.sendSocketMessage({
      msg: JSON.stringify(msg),
      success: () => {
        console.log("客户端发送成功")
      },
      fail: function (err) {
        $Message({
          content: '发送失败',
          type: 'error'
        });
      }
    })
    // 清空input
    _this.setData({
      inputValue: ''
    })
  },
  click: function () {
    this.setData({
      show: !this.data.show
    })
  },
  person: function () {
    this.setData({
      showPerson: !this.data.showPerson
    })
  },
  // 发送图片
  photo: function () {
    let _this = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      success: res => {
        wx.getFileSystemManager().readFile({
          filePath: res.tempFilePaths[0], //选择图片返回的相对路径
          encoding: 'base64', //编码格式
          success: res => { //成功的回调
            let base64Image = 'data:image/png;base64,' + res.data
            let msg = {
              type: 'image',
              content: base64Image,
              time: formatTime(new Date())
            }
            _this.sendSocketMessage({
              msg: JSON.stringify(msg),
              success: () => {
                console.log("客户端发送成功")
              },
              fail: function (err) {
                $Message({
                  content: '发送失败',
                  type: 'error'
                });
              }
            })
          }
        })
      },
      fail: function () {
        $Message({
          content: '用户取消选择',
          type: 'warning'
        })
      }
    })
  },
  voice: function () {
    let _this = this;
    this.setData({
      showVoice: true
    })
    recorderManager.start()
    recorderManager.onStart(() => {
      console.log('recorder start')
    })
    chatVoiceInterval = setInterval(() => {
      _this.setData({
        num: _this.data.num + 1,
      })
      if (_this.data.num >= 50) { // 最多录音50s
        this.voiceSend();
      }
    }, 1000)
    // wx.getSetting({
    //   success: function (res) {
    //     if (res.authSetting['scope.record']) {
    //       recorderManager.start()
    //       recorderManager.onStart(() => {
    //         console.log('recorder start')
    //       })
    //       chatVoiceInterval = setInterval(() => {
    //         _this.setData({
    //           num: _this.data.num + 1,
    //         })
    //         if (_this.data.num >= 50) { // 最多录音50s
    //           this.voiceSend();
    //         }
    //       }, 1000)
    //     } else {
    //       $Message({
    //         content: '请打开『右上角』->『设置』开启录音权限',
    //         type: 'warning'
    //       })
    //       _this.setData({
    //         showVoice: false
    //       })
    //     }
    //   }
    // })
  },
  voiceClear: function () {
    clearInterval(chatVoiceInterval)
    recorderManager.stop() // 结束录音
    this.setData({
      showVoice: false,
      num: 0
    })
  },
  voiceSend: async function () {
    let _this = this;
    clearInterval(chatVoiceInterval)
    recorderManager.stop()
    let data = await this.getVoice();
    wx.getFileSystemManager().readFile({
      filePath: data.tempFilePath, //选择图片返回的相对路径
      encoding: 'base64', //编码格式
      success: res => { //成功的回调
        // let base64Audio = `data:audio/${data.tempFilePath.split('.')[data.tempFilePath.split('.').length - 1]};base64,${res.data}`
        let base64Audio = res.data
        wx.cloud.callFunction({
          // 需调用的云函数名
          name: 'uploadAudio',
          // 传给云函数的参数
          data: {
            base64Audio: base64Audio,
            openId: this.data._openid,
            suffix: data.tempFilePath.split('.')[data.tempFilePath.split('.').length - 1]
          },
          // 成功回调
          complete: function (res) {
            console.log(base64Audio)
            console.log(res)
            let msg = {
              type: 'audio',
              content: res.result.fileID,
              time: formatTime(new Date())
            }
            _this.sendSocketMessage({
              msg: JSON.stringify(msg),
              success: () => {
                console.log("客户端发送成功")
              },
              fail: function (err) {
                $Message({
                  content: '发送失败',
                  type: 'error'
                });
              }
            })
          }
        })
      }
    })
    this.setData({
      showVoice: false,
      num: 0
    })
  },
  getVoice: function () {
    return new Promise((resolve, rejct) => {
      recorderManager.onStop((res) => {
        resolve(res);
      })
    })
  },
  urlTobase64: function (url) {
    console.log(url)
    return new Promise((resolve, reject) => {
      wx.request({
        url: url,
        responseType: 'arraybuffer',
        success: res => {
          //把arraybuffer转成base64
          let base64 = wx.arrayBufferToBase64(res.data);
          base64 = 'data:image/jpeg;base64,' + base64
          resolve(base64);
        },
        fail: function (err) {
          reject(err);
        }
      })
    })
  },
  //与socket建立连接
  connectStart: function (_openid, _name, _avatarUrl) {
    var _this = this
    chatWs = wx.connectSocket({
      url: myUrl,
      header: {
        'content-type': 'application/json',
        'openid-userInfo': _openid,
        'name-userInfo': _name,
        'avatarUrl-userInfo': _avatarUrl
      },
      success: (res) => {
        // console.log(res)
        // $Message({
        //   content: '加入群聊成功',
        //   type: 'success'
        // });
        console.log('连接成功')
      },
      fail: (err) => {
        wx.showToast({
          title: '网络异常！',
        })
        console.log(err)
      }
    })

    // 连接成功
    wx.onSocketOpen((res) => {
      console.log('WebSocket 成功连接', res)
      $Message({
        content: '加入群聊成功',
        type: 'success'
      });
      // 进入聊天
      _this.resMes(_openid, _name, _avatarUrl)
      // 开始心跳
      _this.startHeartBeat()
    })
    //连接失败
    wx.onSocketError((err) => {
      console.log('websocket连接失败', err);
      $Message({
        content: '加入群聊失败',
        type: 'error'
      });
      // twice = 0
      errorConnectTimeOut = setTimeout(() => {
        _this.connectStart(_openid, _name, _avatarUrl)
      }, 2000)
    })
    // deal
    _this.deal()
  },
  // 进入聊天
  resMes: function (_openid, _name, _avatarUrl) {
    console.log('进入房间提示');
    let data = {
      type: 'add'
    }
    this.sendSocketMessage({
      msg: JSON.stringify(data)
    })
  },
  // 开始心跳
  startHeartBeat: function () {
    var that = this;
    heart = 'heart';
    that.heartBeat();
  },
  // 心跳检测
  heartBeat: function () {
    var _this = this;
    if (!heart) {
      return;
    }
    var xtData = {
      type: 'heart'
    }
    _this.sendSocketMessage({
      msg: JSON.stringify(xtData),
      success: function (res) {
        if (heart) {
          chatHeartBeatTimeOut = setTimeout(() => {
            _this.heartBeat();
          }, 5000);
        }
      },
      fail: function (res) {
        $Message({
          content: '重新连接中ing...',
          type: 'warning'
        });
        _this.setData({
          user: []
        })
        if (chatHeartBeatFailCount > 2) {
          // 重连
          console.log('socket心跳失败')
          _this.connectStart(_this.data._openid, _this.data._name, _this.data._avatarUrl);
        }
        if (heart) {
          chatHeartBeatTimeOut = setTimeout(() => {
            _this.heartBeat();
          }, 5000);
        }
        chatHeartBeatFailCount++;
      },
    });
  },
  // 通过 WebSocket 连接发送数据
  sendSocketMessage: function (options) {
    var _this = this
    if (socketOpen) {
      wx.sendSocketMessage({
        data: options.msg,
        success: function (res) {
          if (options) {
            options.success && options.success(res);
          }
        },
        fail: function (res) {
          if (options) {
            options.fail && options.fail(res);
          }
        }
      })
    } else {  // 如果连接失效，
      socketMsgQueue.push(options.msg)
    }
  },
  // 监听socket
  deal: function () {
    let _this = this;
    chatWs.onOpen(res => {
      socketOpen = true;
      console.log('监听 WebSocket 连接打开事件。', res)
    })
    chatWs.onClose(onClose => {
      console.log('监听 WebSocket 连接关闭事件。', onClose)
      // 防止退出找不到组件
      // $Message({
      //   content: '连接关闭',
      //   type: 'error'
      // });
      socketOpen = false;
      // that.connectStart()
    })
    chatWs.onError(onError => {
      console.log('监听 WebSocket 错误。错误信息', onError)
      socketOpen = false
    })
    chatWs.onMessage(onMessage => {
      let data = JSON.parse(onMessage.data);
      if (data.type == 'heart') {
        _this.setData({
          user: data.room
        })
      } else if (data.type == 'add' || data.type == 'leave') {
        _this.setData({
          showUser: true,
          addUser: data
        })
        setTimeout(() => {
          _this.setData({
            showUser: false
          })
        }, 3000)
      } else {
        let content = _this.data.content;
        content.push(data);
        _this.setData({
          content: content,
          scrollTop: content.length * 1000
        })
      }
      // console.log(res, "接收到了消息")
    })
  },
  onUnload: function () {
    console.log('onUnLoad')
    this.clear();
  },
  clear: function () {
    let data = {
      type: 'leave'
    }
    this.sendSocketMessage({
      msg: JSON.stringify(data)
    })
    clearTimeout(chatHeartBeatTimeOut)
    setTimeout(() => {  // 防止2000ms还没过就点击返回导致(clear一个空对象)
      clearTimeout(errorConnectTimeOut)
    }, 2000)
    wx.closeSocket()
  }
})