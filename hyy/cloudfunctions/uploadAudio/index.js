const cloud = require('wx-server-sdk')
const atob = require('atob');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  let fileName = `audio/${(new Date()).valueOf()}${event.openId}.${event.suffix}`;
  return await cloud.uploadFile({
    cloudPath: fileName,
    fileContent: new Buffer(event.base64Audio, 'base64'),
  })
}