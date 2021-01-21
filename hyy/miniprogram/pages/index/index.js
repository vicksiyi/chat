//index.js
const app = getApp()
const { $Message } = require('../../dist/base/index');

const myUrl = `ws://${app.ip}:8081` // websocket链接
var ws // socket发送的消息队列
var socketMsgQueue = []
var socketOpen = true // 判断心跳变量
var heart = ''  // 心跳失败次数
var heartBeatFailCount = 0 // 终止心跳
var heartBeatTimeOut = null; // 终止重新连接
var connectSocketTimeOut = null;
var voiceInterval = null
const recorderManager = wx.getRecorderManager()
var errorConnectTimeOut = null;

Page({
  data: {
    current: 'homepage',
    mine: {
      openid: '',
      userInfo: {}
    }
  },
  onShow: function () {
    let _this = this
    wx.getStorage({
      key: '_openid',
      success(res) {
        _this.setData({
          'mine.openid': res.data
        })
        wx.getStorage({
          key: '_userInfo',
          success: function (res2) {
            let _name = JSON.parse(res2.data).nickName
            let _avatarUrl = JSON.parse(res2.data).avatarUrl;
            // 开启连接
            _this.setData({
              _openid: res.data,
              _name: _name,
              _avatarUrl: _avatarUrl,
              'mine.userInfo': JSON.parse(res2.data)
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
      fail: function (err) {
        console.log(err)
        wx.redirectTo({
          url: '../auth/index',
        })
      }
    });
  },
  handleChange({ detail }) {
    this.setData({
      current: detail.key
    });
  },
  copy: function () {
    wx.setClipboardData({
      data: this.data.mine.openid,
      success(res) {
        $Message({
          content: '复制成功',
          type: 'success'
        });
      }
    })
  },
  navonechat: function () {
    wx.navigateTo({
      url: '../chat/index',
    })
  },
  navwaitchat: function () {
    clearTimeout(heartBeatTimeOut)
    setTimeout(() => {  // 防止2000ms还没过就点击返回导致(clear一个空对象)
      clearTimeout(errorConnectTimeOut)
    }, 2000)
    wx.closeSocket()
    wx.navigateTo({
      url: `../waitchat/index`,
    })
  },
  //与socket建立连接
  connectStart: function (_openid, _name, _avatarUrl) {
    var _this = this
    app.ws = wx.connectSocket({
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
      // 进入聊天
      _this.resMes(_openid, _name, _avatarUrl)
      // 开始心跳
      _this.startHeartBeat()
    })
    //连接失败
    wx.onSocketError((err) => {
      console.log('websocket连接失败', err);
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
          heartBeatTimeOut = setTimeout(() => {
            _this.heartBeat();
          }, 5000);
        }
      },
      fail: function (res) {
        console.log('重新连接中ing...');
        _this.setData({
          user: []
        })
        if (heartBeatFailCount > 2) {
          // 重连
          console.log('socket心跳失败')
          _this.connectStart(_this.data._openid, _this.data._name, _this.data._avatarUrl);
        }
        if (heart) {
          heartBeatTimeOut = setTimeout(() => {
            _this.heartBeat();
          }, 5000);
        }
        heartBeatFailCount++;
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
    app.ws.onOpen(res => {
      socketOpen = true;
      console.log('监听 WebSocket 连接打开事件。', res)
    })
    app.ws.onClose(onClose => {
      console.log('监听 WebSocket 连接关闭事件。', onClose)
      // 防止退出找不到组件
      // $Message({
      //   content: '连接关闭',
      //   type: 'error'
      // });
      socketOpen = false;
      // that.connectStart()
    })
    app.ws.onError(onError => {
      console.log('监听 WebSocket 错误。错误信息', onError)
      socketOpen = false
    })
    app.ws.onMessage(onMessage => {
      let data = JSON.parse(onMessage.data);
      console.log(data);
      // if (data.type == 'heart') {
      //   _this.setData({
      //     user: data.user
      //   })
      // } else if (data.type == 'add') {
      //   _this.setData({
      //     showUser: true,
      //     addUser: data
      //   })
      //   setTimeout(() => {
      //     _this.setData({
      //       showUser: false
      //     })
      //   }, 3000)
      // } else {
      //   let content = _this.data.content;
      //   content.push(data);
      //   _this.setData({
      //     content: content,
      //     scrollTop: content.length * 1000
      //   })
      // }
      // console.log(res, "接收到了消息")
    })
  },
  onUnload: function () {
    console.log('onUnload')
    clearTimeout(heartBeatTimeOut)
    setTimeout(() => {  // 防止2000ms还没过就点击返回导致(clear一个空对象)
      clearTimeout(errorConnectTimeOut)
    }, 2000)
    wx.closeSocket()
  }
})
