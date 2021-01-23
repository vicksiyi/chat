const { $Message } = require('../../dist/base/index');
let innerAudioContext = wx.createInnerAudioContext()
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
    },
    openid: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    show: false,
    status: 'start',
    msg: '播放'
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
    audioPlay: async function () {
      let _this = this
      innerAudioContext.src = this.properties.content
      // innerAudioContext.play();
      innerAudioContext.autoplay = true
      $Message({
        content: '开始播放...',
        type: 'success'
      });
      // 无法控制多个状态
      // if(this.data.status == 'stop') {  
      //   _this.audioStop();
      //   return false;
      // }
      // if(this.data.status == 'continue') {
      //   _this.audioContinue();
      //   return false;
      // }
      _this.setData({
        // msg: '暂停',
        status: 'stop'
      })
      innerAudioContext.onPlay((res) => {
        _this.setData({
          // msg: '暂停',
          status: 'stop'
        })
      })
      innerAudioContext.onEnded(() => {
        console.log('结束')
        $Message({
          content: '播放完成...',
          type: 'success'
        });
        _this.setData({
          // msg: '播放',
          status: 'start'
        })
      })
      innerAudioContext.onError((res) => {
        console.log(res.errMsg)
        console.log(res.errCode)
        _this.setData({
          // msg: '播放',
          status: 'start'
        })
        $Message({
          content: '播放出错!',
          type: 'error'
        });
      })
    },
    audioStop: function () {
      innerAudioContext.pause()
      $Message({
        content: '暂停播放...',
        type: 'success'
      });
      this.setData({
        // msg: '继续',
        status: 'continue'
      })
    },
    audioContinue: function () {
      innerAudioContext.play()
      $Message({
        content: '继续播放...',
        type: 'success'
      });
      this.setData({
        // msg: '暂停',
        status: 'stop'
      })
    },
    copy: function (event) {
      this.triggerEvent('copy', event.currentTarget.dataset.openid);
    }
  }
})
