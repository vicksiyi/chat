// component/send/send.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    placeholder: { // 属性名
      type: String,
      value: '请输入您的内容'
    },
    buttonName: {
      type: String,
      value: '发送'
    },
    value: {
      type: String,
      value: ''
    },
    color: {
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
    inputChange: function (event) {
      this.triggerEvent('change', event);
    },
    send: function (event) {
      this.triggerEvent('send', event);
    }
  }
})
