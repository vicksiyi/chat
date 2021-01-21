const ws = require("nodejs-websocket");
const Time = require("./utils/formatTimes");
// 大群聊天
var user = []
var server = ws.createServer(function (conn) {
    let name = conn.headers['name-userinfo'];
    let openId = conn.headers['openid-userinfo'];
    let avatarUrl = conn.headers['avatarurl-userinfo'];
    user.push({ name, openId, avatarUrl });
    console.log('进入房间');
    conn.on("text", function (data) {
        console.log(data)
        console.log(user);
        let dataParse = JSON.parse(data)
        if (dataParse.type == 'heart') { conn.sendText(JSON.stringify({ ...dataParse, user })) }
        else {
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
        console.log(err)
    })

    conn.on("close", function (code, reason) {
        user.map((value, key) => {
            if (conn.headers['openid-userinfo'] == value.openId) { user.splice(key, 1) }
        });
        console.log('close');
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