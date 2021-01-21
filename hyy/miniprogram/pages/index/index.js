//index.js
const app = getApp()
const { $Message } = require('../../dist/base/index');
Page({
  data: {
    current: 'homepage',
    mine: {
      openid: '',
      userInfo: {}
    }
  },
  onLoad: function () {
    let _this = this
    wx.getStorage({
      key: '_openid',
      success(res) {
        _this.setData({
          'mine.openid': res.data
        })
      },
      fail: function (err) {
        console.log(err)
        wx.redirectTo({
          url: '../auth/index',
        })
      }
    });
    wx.getStorage({
      key: '_userInfo',
      success(res) {
        _this.setData({
          'mine.userInfo': JSON.parse(res.data)
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
    wx.navigateTo({
      url: '../waitchat/index',
    })
  }
})
