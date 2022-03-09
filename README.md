# :black_nib: 版本V1.0:pencil2:
## :whale: 1、技术栈
- 前端：微信小程序原生代码、IviewUI组件库
- 后端：Node、Express
- 通信：WebSocket

## :frog: 2、核心功能
- 心跳检测 - 断开重连
- 消息广播 - 群聊
- 对点聊天 - 1v1私聊

## :thinking: 3、系统目录
### 小程序端 - hyy
- cloudfunctions[云函数]
- miniprogram[系统目录]
  - component[系统组件] 
  - dist[Iview组件]
  - images[系统图片]
  - pages[系统页面]
    - [auth[授权]](https://github.com/vicksiyi/chat/tree/main/hyy/miniprogram/pages/auth)
    - [chat[多人群聊]](https://github.com/vicksiyi/chat/tree/main/hyy/miniprogram/pages/chat)
    - [index[首页]](https://github.com/vicksiyi/chat/tree/main/hyy/miniprogram/pages/index)
    - [onechat[1v1聊天]](https://github.com/vicksiyi/chat/tree/main/hyy/miniprogram/pages/onechat)
    - [waitchat[等待接入]](https://github.com/vicksiyi/chat/tree/main/hyy/miniprogram/pages/waitchat)
  - template[系统模板]
  - utils[工具]
  
### 服务端 - hyy-server
- [one[群聊]](https://github.com/vicksiyi/chat/blob/main/hyy-server/one.js)
- [wait[1v1对点聊天和群聊]](https://github.com/vicksiyi/chat/blob/main/hyy-server/wait.js)
- [utils[工具]](https://github.com/vicksiyi/chat/tree/main/hyy-server/utils)


## :memo: 4、系统截图
<code><img width="30%" align="left" src="https://user-images.githubusercontent.com/39822906/157374344-17a1cf9e-1b32-4d95-a852-2611495d8ded.png"/></code>
<code><img width="30%" align="middle" src="https://user-images.githubusercontent.com/39822906/157374371-f87eedd2-2fd1-4d9a-b7b2-3a9c553da1a8.png"/></code>
<code><img width="30%" align="right" src="https://user-images.githubusercontent.com/39822906/157374381-9073adfe-0621-4fc4-afda-72048c359c53.png"/></code>

## ⚡  5、具体实现
- 心跳检测 - 核心代码
```javascript
// 心跳检测
heartBeat: function () {
    ... 
    _this.sendSocketMessage({
      msg: JSON.stringify(xtData),
      success: function (res) {
        if (heart) {
          // 连接成功后，重新开始心跳检测
          chatHeartBeatTimeOut = setTimeout(() => {
            _this.heartBeat();
          }, 5000);
        }
      },
      fail: function (res) {
        // 重连失败多少次， 不再重连
        if (chatHeartBeatFailCount > 2) {
          // 重连
          console.log('socket心跳失败')
          _this.connectStart(_this.data._openid, _this.data._name, _this.data._avatarUrl);
        }
        if (heart) {
          chatHeartBeatTimeOut = setTimeout(() => {
            _this.heartBeat();
          }, 5000);
        }
        chatHeartBeatFailCount++;
      },
    });
```
- 群聊 服务端 - 核心代码


广播式：即服务端有消息时，会将消息发送给所有连接了当前endpoint的小程序端
```javascript
function broadcast(user, msg) {
    let data = { ...user, ...msg }
    console.log(data)
    server.connections.forEach(function (conn) {
        conn.sendText(JSON.stringify(data))
    })
}
```
具体逻辑部分 - 只显示逻辑部分
```javascript
var server = ws.createServer(function (conn) {
    // 通过user数组记录在群聊的用户
    user.push({ name, openId, avatarUrl });
    // 加入房间[广播用户进入房间]
    broadcast(用户信息, { type: 'add', content: '加入房间' });
    conn.on("text", function (data) {
        let dataParse = JSON.parse(data)
        if (dataParse.type == 'heart') { conn.sendText(JSON.stringify({ ...dataParse, user })) }
        else {
            broadcast(用户信息, dataParse[消息内容])
        }
    })

    conn.on("error", function (err) { 错误处理 })

    conn.on("close", function (code, reason) {
        // 删除用户
        user.map((value, key) => {
            if (conn.headers['openid-userinfo'] == value.openId) { user.splice(key, 1) }
        });
        // 用户离开群聊
        broadcast( 用户信息, { type: 'add', content: '离开群聊' });
    })
}).listen(8080, function () { console.log('the ws port(8080) running');});


```

- 对点 服务端 - 核心代码
```javascript
var link = []  // 记录连接状态
var connect = []  // 正在1v1群聊的用户
var server = ws.createServer(function (conn) {
    ...
    link[openId] = link[openId] == undefined ? new Array() : link[openId]; // 每进来一个用户新建一个连接状态表
    for (let key in connect) { // 更新conn
        if (connect[key] != undefined && connect[key].headers['openid-userinfo'] == conn.headers['openid-userinfo']) {
            connect[key] = conn
            break;
        }
    }
    conn.on("text", function (data) {  // 监听消息
        let dataParse = JSON.parse(data)
        if (dataParse.type == 'heart') {
          // 心跳检测处理
        }
        else if (dataParse.type == 'link') {   // 接入
            let to_openid = dataParse.to_openid;
            link[to_openid].push(用户信息);
        }
        else if (dataParse.type == 'add') {     // 进入房间
            // 处理群聊信息
        }
        else if (dataParse.type == 'leave') {       // 退出房间
            // 处理群聊离开房间
        }
        else if (dataParse.type == 'connect') {
            // 用户建立连接
            server.connections.forEach(function (conn_to) {
                if (conn_to.headers['openid-userinfo'] == dataParse.connect_id) {
                    to = conn_to
                }
            })
            // 寻找连接方的状态
            link[conn.headers['openid-userinfo']].map((value, key) => {
                if (dataParse.connect_id == value.openId) { link[conn.headers['openid-userinfo']].splice(key, 1) }
            });
            // 建立连接
            connect[from.headers['openid-userinfo']] = to
            connect[to.headers['openid-userinfo']] = from
            from.sendText(JSON.stringify({
                type: 'oneMsg',
                id: to.headers['openid-userinfo']
            }));
            // 发送消息
            to.sendText(JSON.stringify({
                type: 'oneMsg',
                id: from.headers['openid-userinfo']
            }));
        }
        else if (dataParse.type == '1v1Heart') {  // 心跳检测，判断对点连接用户是否在线
            let to_user = conn.headers['to'];
            if (connect[to_user] == undefined) {
                conn.sendText(JSON.stringify({
                    type: '1v1Leave'
                }));
                delete connect[conn.headers['openid-userinfo']]
            }
        }
        else if (dataParse.type == '1v1Leave') { // 1v1通信 离开聊天室
            delete connect[conn.headers['openid-userinfo']];
        }
        else if (dataParse.type == '1v1Text' || dataParse.type == '1v1Image' || dataParse.type == '1v1Audio') {  // 1v1消息处理
            console.log(connect[conn.headers['openid-userinfo']])
            if (connect[conn.headers['openid-userinfo']] != undefined) {
                connect[conn.headers['openid-userinfo']].sendText(JSON.stringify({
                    name: conn.headers['name-userinfo'],
                    openid: conn.headers['openid-userinfo'],
                    avatarurl: conn.headers['avatarurl-userinfo'],
                    ...dataParse
                }));
                conn.sendText(JSON.stringify({
                    name: conn.headers['name-userinfo'],
                    openid: conn.headers['openid-userinfo'],
                    avatarurl: conn.headers['avatarurl-userinfo'],
                    ...dataParse
                }));
            } else {
                conn.sendText(JSON.stringify({
                    type: '1v1Leave'
                }));
                delete connect[conn.headers['openid-userinfo']]
            }
        }
        else {                                      // 发送消息
            broadcast(用户信息, dataParse) // 广播消息
        }
    })
    // 断开连接处理
    conn.on("close", function (code, reason) {
        user.map((value, key) => {
            if (conn.headers['openid-userinfo'] == value.openId) { user.splice(key, 1) }
        });
    })
}).listen(8081, function () {
    console.log('the ws port(8081) running');
}),

```

## :sparkling_heart: 6、不足
- 小程序端代码没混淆，容易被别人破解
- 消息数据没有加密 - 安全性问题
- 消息数据没有存储 - 历史消息问题
- 代码封装问题 - 维护困难
- 连接状态仅仅通过数组去实现，随着用户增多导致系统响应速度变慢问题

## :alarm_clock:  7、下一版本
- 消息采用RSA加密
- 连接状态存储在Redis中
- 聊天数据存储通过MongoDB
- 封装代码，重构消息类型
