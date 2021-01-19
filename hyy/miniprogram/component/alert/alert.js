// component/alert/alert.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    num: {
      type: Number,
      value: 0
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
    voiceClear: function (event) {
      this.triggerEvent('voiceClear', event);
    },
    voiceSend: function (event) {
      this.triggerEvent('voiceSend', event);
    }
  }
})
