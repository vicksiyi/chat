const ws = require("nodejs-websocket");
const Time = require("./utils/formatTimes");
// 大群聊天
var user = []
var link = []
var room = []
var server = ws.createServer(function (conn) {
    let name = conn.headers['name-userinfo'];
    let openId = conn.headers['openid-userinfo'];
    let avatarUrl = conn.headers['avatarurl-userinfo'];
    user.push({ name, openId, avatarUrl });
    console.log(link[openId])
    link[openId] = link[openId] == undefined ? new Array() : link[openId]; // 每进来一个用户新建一个连接状态表
    conn.on("text", function (data) {
        // console.log(data)
        // console.log(user);
        let dataParse = JSON.parse(data)
        console.log(dataParse)
        if (dataParse.type == 'heart') {
            conn.sendText(JSON.stringify({
                ...dataParse, user,
                'link': link[conn.headers['openid-userinfo']],
                room
            }))
        }
        else if (dataParse.type == 'link') {   // 接入
            let to_openid = dataParse.to_openid;
            link[to_openid].push(conn.headers['openid-userinfo']);
            console.log(link);
        }
        else if (dataParse.type == 'add') {     // 进入房间
            room.push({
                name: name,
                openid: openId,
                avatarUrl: avatarUrl
            })
            broadcast({
                name: name,
                openid: openId,
                avatarurl: avatarUrl
            }, { type: 'add', content: '加入房间' });
        }
        else if (dataParse.type == 'leave') {       // 退出房间
            room.map((value, key) => {
                if (openId == value.openid) { room.splice(key, 1) }
            });
            broadcast({
                name: conn.headers['name-userinfo'],
                openid: conn.headers['openid-userinfo'],
                avatarurl: conn.headers['avatarurl-userinfo']
            }, { type: 'leave', content: '离开房间' });
        }
        else {                                      // 发送消息
            broadcast({
                name: conn.headers['name-userinfo'],
                openid: conn.headers['openid-userinfo'],
                avatarurl: conn.headers['avatarurl-userinfo']
            }, dataParse)
        }
    })

    conn.on("error", function (err) {
        user.map((value, key) => {
            if (conn.headers['openid-userinfo'] == value.openId) { user.splice(key, 1) }
        });
        room.map((value, key) => {
            if (conn.headers['openid-userinfo'] == value.openid) { room.splice(key, 1) }
        });
    })

    conn.on("close", function (code, reason) {
        user.map((value, key) => {
            if (conn.headers['openid-userinfo'] == value.openId) { user.splice(key, 1) }
        });
        room.map((value, key) => {
            if (conn.headers['openid-userinfo'] == value.openid) { room.splice(key, 1) }
        });
    })
}).listen(8081, function () {
    console.log('the ws port(8081) running');
});

function broadcast(user, msg) {
    let data = { ...user, ...msg }
    console.log(data)
    server.connections.forEach(function (conn) {
        conn.sendText(JSON.stringify(data))
    })
}