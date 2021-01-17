// miniprogram/pages/chat/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    inputValue: '',
    height: '',
    show: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let _this = this;
    wx.setNavigationBarTitle({
      title: 'title',
    })
    wx.getSystemInfo({
      success(res) {
        _this.setData({
          height: res.windowHeight - 51
        })
      }
    })
  },
  inputChange: function (e) {
    this.setData({
      inputValue: e.detail.detail.value
    })
  },
  send: function () {
    console.log(this.data.inputValue)
  },
  click: function () {
    this.setData({
      show: !this.data.show
    })
  },
  person: function () {
    console.log(123)
  }
})