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
    }
  }
})
