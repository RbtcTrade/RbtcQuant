const WebSocketClient = require('websocket').client;

/**
 * webSocket client
 * @param param {object} ws 相关参数
 * @constructor
 */
function WS(param) {
    this.wsUrl = 'wss://market-api.rbtc.io/sub';
    this.heartTime = 5 * 1000;
    this.userParam = {
        market : 'del_pyc',
        uid : '7490',
    };
    if(typeof param == 'object'){
        if(param.userParam){
            Object.assign(this.userParam, param.userParam);
        };
        Object.assign(this, param);
    };
    this.xnb = this.userParam.market.split('_')[0];
    this.rmb = this.userParam.market.split('_')[1];
    this.wsCallbackEvent = {};
    this.client = null;
    this.connection = null;
    this.wsErrorCode = {
        "1"  : '无效的订单',
        "2"  : '余额不足',
        "3"  : '服务端解析发送的json数据出错',
        "4"  : 'mongo数据库中没有该用户',
        "5"  : '重复操作',
        "6"  : '创建订单失败，服务器内部错误',
        "7"  : '无效的用户ID',
        "8"  : '无效的价格',
        "9"  : '无效的个数',
        "10"  : '不知道如何提示，大概意思是这边服务器压力很大',
        "11"  : '无效的市场代号',
        "12"  : '无效的买卖类型',
        "13"  : '无效验证的用户',
        "14"  : '该市场暂停交易',
    }
};

WS.prototype.checkErrorCode = function (res){
    return new Promise((resolve, reject) => {
        if(res && res.data && res.data.error_code){
            let error_code = res.data.error_code;
            if(error_code * 1 > 0){
                reject(new Error(this.wsErrorCode[error_code] || '未知的 webSocket 错误码 ！'));
            }else{
                resolve(res);
            }
        }else{
            resolve(res);
        }
    });
},

WS.prototype.connectFailed = function (error) {
    console.log('connectFailed Error: ' + error.toString());
};

WS.prototype.error = function (error) {
    console.error("Connection Error: " + error.toString());
};

WS.prototype.close = function (code) {
    console.error('Connection Closed, CODE:' + code);
};


WS.prototype.addEvent = function (eventName, callback, self, once){
    if(this.wsCallbackEvent[eventName]){
        var callbackStatus = this.wsCallbackEvent[eventName].every(function (eventData){
            if(eventData.callback === callback  && eventData.once == once){
                return false;
            };
            return true;
        });
        if(callbackStatus){
            this.wsCallbackEvent[eventName].push({
                callback : callback,
                once : once,
                self : self
            });
        };
    }else{
        this.wsCallbackEvent[eventName] = [{
            callback : callback,
            once : once,
            self : self
        }];
    };
};


WS.prototype.on = function (eventName, callback, self){
    this.addEvent(eventName, callback, self, false);
};


WS.prototype.once = function (eventName, callback, self){
    this.addEvent(eventName, callback, self, true);
};

WS.prototype.removeEvent = function (eventName, callback){
    if(this.wsCallbackEvent[eventName]) {
        for (let i = 0; i < this.wsCallbackEvent[eventName].length; i++) {
            if (this.wsCallbackEvent[eventName][i].callback === callback) {
                this.wsCallbackEvent[eventName].splice(i, 1);
                return false;
            }
            ;
        };
    };
};

WS.prototype.eventExecute = function (parseData) {
    if(parseData && parseData.method && this.wsCallbackEvent[parseData.method]){
        var once = [];
        this.wsCallbackEvent[parseData.method].forEach((callbackObj, index) => {
            if(callbackObj.once){
                once.push(index);
            };
            if(typeof callbackObj.callback == 'function'){
                if(callbackObj.self){
                    callbackObj.callback.call(callbackObj.self, parseData);
                }else{
                    callbackObj.callback.call(this, parseData);
                };
            };
        });
        if(once.length){
            once = once.reverse();
            once.forEach(function (spliceIndex){
                this.wsCallbackEvent[parseData.method].splice(spliceIndex, 1);
            }, this);
        };
    };
};

WS.prototype.message = function (msg){
    if (msg.type === 'binary') {
        let parseStr = Buffer.from(msg.binaryData, 'binary').toString('utf8');
        try {
            parseData = JSON.parse(parseStr);
            // 处理数字太大精度丢失转成字符串
            if(parseData.method == 'push_user_order' || parseData.method == 'push_user_deal'){
                var s = parseStr.replace(/\[([0-9]{19,20})\,/g, '["$1",');
                parseData = JSON.parse(s);
            };
            if(parseData.method == 'push_deal_order_list'){
                var s = parseStr.replace(/\,([0-9]{19,20})\]/g, ',"$1"]');
                parseData = JSON.parse(s);
            };
            this.eventExecute(parseData);
        } catch (e){
            parseData = {};
            console.log(e);
        };
    };
};

WS.prototype.connect = function () {
    return new Promise((res, rej) => {
        if(this.client && this.connection.connected){
            this.client.abort();
        };
        this.client = new WebSocketClient();
        this.client.on('connectFailed', error => {
            this.connectFailed.call(this, error);
            rej(error);
        });
        this.client.on('connect', (connection) => {
            console.log('WebSocket Client Connected');
            this.connection = connection;
            this.heart();
            res(connection);
            connection.on('error', error => {
                this.error.call(this, error);
                rej(error);
            });
            connection.on('close', code => {
                this.close.call(this, code);
                rej(code);
            });
            connection.on('message', this.message.bind(this));
        })
        this.client.connect(this.wsUrl);
    })
};

WS.prototype.send = function (eventName, param){
    if(this.client && this.connection.connected){
        var data = {"method" : eventName || ""};
        if(param && typeof param == 'object'){
            data.data = param;
        };
        this.connection.sendUTF(JSON.stringify(data));
    };
};

WS.prototype.heart = function (){
    if(this.client && this.connection.connected){
        setTimeout(() => {
            this.send("pull_heart", {
                time: new Date().getTime().toString(),
            });
            this.heart();
        }, this.heartTime);
    };
};

module.exports = WS;
































