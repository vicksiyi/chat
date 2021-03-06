const ws = require("nodejs-websocket");
const { connection } = require("websocket");
const Time = require("./utils/formatTimes");
// 大群聊天
var user = []
var link = []
var room = []
var connect = []
var server = ws.createServer(function (conn) {
    let name = conn.headers['name-userinfo'];
    let openId = conn.headers['openid-userinfo'];
    let avatarUrl = conn.headers['avatarurl-userinfo'];
    user.push({ name, openId, avatarUrl });
    link[openId] = link[openId] == undefined ? new Array() : link[openId]; // 每进来一个用户新建一个连接状态表
    for (let key in connect) { // 更新conn
        console.log(key);
        if (connect[key] != undefined && connect[key].headers['openid-userinfo'] == conn.headers['openid-userinfo']) {
            connect[key] = conn
            break;
        }
    }
    conn.on("text", function (data) {
        // console.log(data)
        // console.log(user);
        let dataParse = JSON.parse(data)
        console.log(dataParse)
        if (dataParse.type == 'heart') {
            conn.sendText(JSON.stringify({
                ...dataParse, user,
                'link': link[openId],
                room
            }))
            console.log(link[openId]);
        }
        else if (dataParse.type == 'link') {   // 接入
            let to_openid = dataParse.to_openid;
            link[to_openid].push({
                name: name,
                openId: openId,
                avatarUrl: avatarUrl,
                time: dataParse.time.split(' ')[1]
            });
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
        else if (dataParse.type == 'connect') {
            let from = conn
            let to = null
            server.connections.forEach(function (conn_to) {
                if (conn_to.headers['openid-userinfo'] == dataParse.connect_id) {
                    to = conn_to
                }
            })
            console.log(link[conn.headers['openid-userinfo']]);
            link[conn.headers['openid-userinfo']].map((value, key) => {
                if (dataParse.connect_id == value.openId) { link[conn.headers['openid-userinfo']].splice(key, 1) }
            });
            connect[from.headers['openid-userinfo']] = to
            connect[to.headers['openid-userinfo']] = from
            from.sendText(JSON.stringify({
                type: 'oneMsg',
                id: to.headers['openid-userinfo']
            }));
            to.sendText(JSON.stringify({
                type: 'oneMsg',
                id: from.headers['openid-userinfo']
            }));
        }
        else if (dataParse.type == '1v1Heart') {
            let to_user = conn.headers['to'];
            if (connect[to_user] == undefined) {
                conn.sendText(JSON.stringify({
                    type: '1v1Leave'
                }));
                delete connect[conn.headers['openid-userinfo']]
            }
            // console.log(connect);
        }
        else if (dataParse.type == '1v1Leave') {
            delete connect[conn.headers['openid-userinfo']];
        }
        else if (dataParse.type == '1v1Msg') {
            console.log(conn.headers);
        }
        else if (dataParse.type == '1v1Text' || dataParse.type == '1v1Image' || dataParse.type == '1v1Audio') {
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

function connecctBroad(from, to, msg) {

}