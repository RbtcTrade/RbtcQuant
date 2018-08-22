const WS = require('./ws/ws');
const wsRSA = require('./ws/wsRSA');
const {UserOrder, UserAssets, DepthSell, DepthBuy, DealList} = require('./ws/data');

let ws = new WS({
    wsUrl : 'wss://market-api.rdb.one/sub',
    userParam : {
        market : 'pyc_cnt',
        uid : '7490',
    }
});

/**
 * 实时成交
 * @type {DealList|*}
 */
let dealList = new DealList();
/**
 * 深度卖单
 * @type {DepthSell|*}
 */
let depthSell = new DepthSell();

/**
 * 深度买单
 * @type {DepthBuy|*}
 */
let depthBuy = new DepthBuy();

/**
 * 余额
 * @type {UserAssets|*}
 */
let userAssets = new UserAssets();

/**
 * 用户委托
 * @type {UserOrder|*}
 */
let userOrder = new UserOrder();

module.exports = {
    userOrder,
    userAssets,
    depthBuy,
    depthSell,
    dealList,
    ws,
    connect,
}

/**
 * 用户委托变动
 * @param val {array} [["1528561454273413848",1528570368000,"sell","34.00000000","1.00000000","1.00000000","ing"]] id,时间，类型，价格，未成交数量，委托数量，状态
 */
userOrder.watch(function (val, old) {
    // console.log(JSON.stringify(val));
    if(!userOrder.state){
        if(val.length){
            console.log('withdrawal', JSON.stringify(val[0]));
            // ws.send("withdrawal", {
            //     order_id : val[0][0]
            // });
        };
    };
});

dealList.watch(function (val, old) {
    // console.log(JSON.stringify(val));
});

/**
 * order 委托挂单请谨慎使用，导致的财产损失此demo概不负责。
 */
userAssets.watch(function (val, old) {
    // console.log(JSON.stringify(val));
    if(userAssets.state == false){
        // 买
        // ws.send("order", {
        //     type : "Buy",
        //     price : '100000',
        //     count : '0.0001',
        //     ts : Date.now(),
        // });
        // 卖
        // ws.send("order", {
        //     type : "Sell",
        //     price : '100001',
        //     count : '0.0001',
        //     ts : Date.now(),
        // });
    };
});

depthSell.watch(function (val, old) {
    // console.log(JSON.stringify(val));
    // console.log(JSON.stringify(this.depthKey));
});

depthBuy.watch(function (val, old) {
    // console.log(JSON.stringify(val));
    // console.log(JSON.stringify(this.depthKey));
});

/**
 * 监听撤单
 */
ws.on("withdrawal_resp", (res) => {
    console.log(JSON.stringify(res));
    ws.checkErrorCode(res).then(data => {
        ws.send('pull_user_assets');
    }).catch(err => {
        console.log(err);
    });
});

/**
 * 监听挂单
 */
ws.on("order_resp", (res) => {
    console.log(JSON.stringify(res));
    ws.checkErrorCode(res).then(data => {
        ws.send('pull_user_assets');
    }).catch(err => {
        console.log(err);
    });
});

/**
 * 监听用户登录
 */
ws.on('push_user_market', function (res) {
    console.log(res);
    if(res && res.data && res.data[0] == 0){
        // 实时成交记录
        this.send("pull_deal_order_list");
        // 24h行情
        // this.send('pull_home_market_quote');
        // 深度
        this.send('pull_merge_depth_order_list');
        // 余额
        this.send('pull_user_assets');
        // 用户委托
        this.send('pull_user_order');
        // 用户成交
        // this.send('pull_user_deal');
    };
});


/**
 * 监听实时成交
 */
ws.on('push_deal_order_list', function (res) {
    // console.log(JSON.stringify(res));
    if(res && res.data && Array.isArray(res.data)){
        dealList.data = res.data;
    }else{
        console.error('错误的 push_deal_order_list 响应数据')
    };
});

/**
 * 监听深度合并
 */
ws.on('push_merge_depth_order_list', function (res) {
    // console.log(JSON.stringify(res));
    if(res && res.data){
        depthSell.data = res.data.sell || [];
        depthBuy.data = res.data.buy || [];
    }
});

/**
 * 监听用户余额
 */
ws.on('push_user_assets', function (res) {
    // console.log(JSON.stringify(res));
    if(res && res.data){
        userAssets.data = res.data;
    }
});

/**
 * 监听用户委托
 */
ws.on('push_user_order', function (res) {
    // console.log(JSON.stringify(res));
    var data = res.data || [];
    if(userOrder.state){
        ws.send('pull_user_assets');
    };
     userOrder.data =data;
});

let privateKey;
/**
 * RSA加密登录 websocket
 * @returns {Promise<void>}
 */
async function connect(){
    if(!privateKey){
        try {
            privateKey = await wsRSA();
        }catch (e) {
            console.error(e);
        };
    };
    let count = 0;
    ws.connect().then(res => {
        count = 0;
        ws.userParam.rsa_ciphertext = privateKey;
        ws.send('pull_user_market', ws.userParam);
    }).catch(err => {
        console.error(`connect error:${err}`);
        count ++;
        if(count < 15){
            setTimeout(() => {
                connect();
            }, 1000)
        };
    });
};
connect();








