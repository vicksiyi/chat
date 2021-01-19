const { $Message } = require('../../dist/base/index');
// component/list-item/list-item.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    float: {
      type: String,
      value: 'left'
    },
    name: {
      type: String,
      value: ''
    },
    time: {
      type: String,
      value: ''
    },
    content: {
      type: String,
      value: ''
    },
    thumb: {
      type: String,
      value: ''
    },
    type: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    show: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 查看图片
    showImage: function () {
      wx.previewImage({
        current: this.properties.content,
        urls: [this.properties.content]
      })
    },
    audioPlay: function () {
      let _this = this
      const innerAudioContext = wx.createInnerAudioContext()
      innerAudioContext.autoplay = true
      innerAudioContext.src = this.properties.content
      innerAudioContext.onPlay((res) => {
        console.log('开始播放', res)
        $Message({
          content: '开始播放...',
          type: 'success'
        });
      })
      innerAudioContext.onEnded(() => {
        console.log('结束')
        $Message({
          content: '播放完成...',
          type: 'success'
        });
      })
      innerAudioContext.onError((res) => {
        console.log(res.errMsg)
        console.log(res.errCode)
      })
    }
  }
})
