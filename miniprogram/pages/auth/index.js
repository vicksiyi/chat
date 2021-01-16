const { $Message } = require('../../dist/base/index');
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.cloud.callFunction({
      name: 'login',
      complete: res => {
        wx.setStorage({
          key: "_openid",
          data: res.result.openid
        })
      }
    })
  },
  bindGetUserInfo: function (e) {
    if (e.detail.errMsg === "getUserInfo:fail auth deny") {
      $Message({
        content: '需要授权才可进入系统！',
        type: 'warning'
      });
      return false;
    }
    $Message({
      content: '授权成功',
      type: 'success'
    });
    wx.setStorage({
      key: "_userInfo",
      data: JSON.stringify(e.detail.userInfo)
    })
    setTimeout(() => {
      wx.navigateTo({
        url: '../index/index',
      })
    }, 1000)
  }
})