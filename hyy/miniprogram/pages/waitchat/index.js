// miniprogram/pages/waitchat/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    inputValue: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },
  search: function () {
    console.log(this.data.inputValue)
  },
  inputChange: function (e) {
    this.setData({
      inputValue: e.detail.detail.value
    })
  }
})