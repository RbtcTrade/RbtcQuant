# RbtcQuant

[RBTC](https://www.rbtc.io/)交易平台量化交易API

----

## 生成 RSA 公钥私钥
```bash
# 1024bit, pkcs8
npm run create-rsa
```
或 [openssl](https://www.openssl.org/) 生成


## ws url
```bash
wss://market-api.rbtc.io/sub
```

## ws 数据格式
* ws 订阅发送utf8编码的json字符串
```json
{
    "method":"pull_user_market",
    "data":{
        "market" : "pyc_cnt",
        "uid" : "7490",
        "rsa_ciphertext" : "rsa_ciphertext"
    }
}
```
* ws 推送返回utf8 json字符串编码成binary的Buffer
```ecmascript 6
Buffer.from(msg.binaryData, 'binary').toString('utf8');
```
```json
{
    "method":"push_user_market",
    "data":[
      ["0"]
    ]
}
```

## 登录
订阅市场
* 用户相关的数据必须先登录以后才能订阅，未登录订阅用户数据可能会造成服务端主动关闭 websocket
* market 当前交易市场， _连接, 左边是交易货币，右边是支付货币(必须字段)
* uid 用户id
* token  当前用户登录时随机生成512长度的字符串 [RBTC登录](https://www.rbtc.io/home/login/login)
* rsa_ciphertext  当前用户手机号 RSA私钥加密的 base64 字符串，请用户先设置RSA公钥 [RSA公钥设置](https://www.rbtc.io/home/safety/api)
* 用户登录token和rsa_ciphertext必须传一个
```json
{
    "method":"pull_user_market",
    "data":{
        "market" : "pyc_cnt",
        "uid" : "7490",
        "token" : "token",
        "rsa_ciphertext" : "rsa_ciphertext"
    }
}
```
推送
* 登录状态 data[0][0] == 1 ? "登录失败" : "登录成功"
```json
{
    "method":"push_user_market",
    "data":[
        ["0"]
    ]
}
```

## 委托挂单深度
订阅
```json
{
    "method" : "pull_merge_depth_order_list"
}
```
推送
* 第一次推送是20条的深度数据，以后的推送是变动的深度数据（数据结构不变）。你要自己合并深度，详情查看demo 
* ["33.31000000","6.60912639"] 价格,数量
```json
{
    "method":"push_merge_depth_order_list",
    "data":{
        "buy":[
            ["33.31000000","6.60912639"],
            ["33.05000000","6.59757943"],
            ["33.01110000","6.33877696"]
        ],
        "sell":[
            ["33.50500000","29.18967318"],
            ["33.81000000","190.00000000"],
            ["33.81800000","3.30067000"]
        ]
    }
}
```

## 用户当前余额
订阅
```json
{
  "method" : "pull_user_assets"
}
```
推送
* free_service_charge 手续费
* asset 余额，浮点字符串
```json
{
  "method" : "push_user_assets",
  "data" : {
    "uid":"7490",
    "free_service_charge":"0",
    "asset":{
        "btc":"8762.7500000000000000000000",
        "ccc":"20",
        "cnt":"812942.6045246300000000000000",
        "del":"139.4000000000000000000000",
        "doge":"123456789.0000000000000000000000",
        "eth":"123456789.0000000000000000000000",
        "pyc":"1025696.6514000000000000000000",
        "tiv":"40",
        "zcc":"40"
    }
  }
}
```

## 用户当前交易对委托
订阅
* max_count 获取的委托挂单数量，-1获取全部委托，默认30
```json
{
  "method" : "pull_user_order",
  "data" : {
    "max_count" : "30"
  }
}
```
推送
* 第一次推送最多 max_count 条数的委托，后面推送变动的数据
* ["1529401690299552949",1529402081000,"sell","100001.00000000","0.00010000","0.00010000","ing"]
* 订单号，时间，类型，价格，未成交数量，委托数量，状态（ing委托中，withdrawal撤单）
```json
{
    "method":"push_user_order",
    "data":[
        ["1529401690299552949",1529402081000,"sell","100001.00000000","0.00010000","0.00010000","ing"],
        ["1529401690299552948",1529402081000,"buy","100000.00000000","0.00010000","0.00010000","ing"]
    ]
}
```

## 用户当前交易对已成交记录
订阅
```json
{
  "method" : "pull_user_deal",
}
```
推送
* 推送数据结构同用户当前交易对委托  push_user_order
```json
{
    "method":"push_user_deal",
    "data":[
        ["1529401690299552949",1529402081000,"sell","100001.00000000","0.00010000","0.00010000","ing"],
        ["1529401690299552948",1529402081000,"buy","100000.00000000","0.00010000","0.00010000","ing"]
    ]
}
```

## 当前交易对24小时行情数据，未先订阅交易对订阅行情会返回所有的交易对行情，单独订阅一个交易对请先
订阅
```json
{
  "method" : "pull_home_market_quote",
}
```
推送
* 第一次初始化，后面增量推送
* data["支付货币"]["交易货币"]
* [交易对, 最新成交价, 24h涨跌, 24h最高价, 24h最低价, 24h成交量, 24h成交额, 交易货币¥单价折算, 支付货币¥单价折算]
```json
{
    "method":"push_home_market_quote",
    "data":{
        "usdt":{
            "eth":["eth_usdt","0.00000000","-20.00000000","0.00000000","0.00000000","0.00000000","0.00000000","0.00000000","6.86470000"]
        }
    }
}
```

## 当前交易对实时成交记录
订阅
```json
{
  "method" : "pull_deal_order_list",
}
```
推送
* [1532488767000,"buy","10.00000000","50.00000000","1532436029270392021"]
* [时间戳, 交易类型(buy/sell）,成交价,成交数量,订单号]
```json
{
    "method":"push_deal_order_list",
    "data":[
        [1532488767000,"buy","10.00000000","50.00000000","1532436029270392021"],
        [1534315010000,"sell","5.00000000","1.00000000","1534314570043489943"]
    ]
}
```

## 委托挂单
订阅
* type 类型 Buy/Sell
* price 价格
* count 数量
* ts 当前毫秒时间戳
```json
{
    "method" : "order",
    "data" : {
        "type" : "Buy",
        "price" : "100001",
        "count" : "0.0001",
        "ts" : 1529402865467
    }
}
```
推送
* [error_code](#error_code)
```json
{
    "method":"order_resp",
    "data":{
        "order_id":"1529401690299552951",
        "error_code":0
    }
}
```

## 撤单
订阅
* order_id 订单号
```json
{
    "method" : "withdrawal",
    "data" : {
        "order_id" : "1529401690299552949"
    }
}
```
推送
* [error_code](#error_code)
```json
{
    "method":"withdrawal_resp",
    "data":{
        "order_id":"1529401690299552949",
        "error_code":0
    }
}

```

## K线
订阅
* market 交易对，交易对切换，需要重新订阅
* k_line_type K线类型，单位为分钟的数字，字符串类型
* k_line_count k线数据长度，最大200
```json
{
    "method" : "pull_kline_graph",
    "data" : {
        "market" : "eth_usdt",
        "k_line_type" : "1",
        "k_line_count" : "200",
    }
}
```
推送
* ["1534196280000","4.59185000","4.59235000","4.58500000","4.58545000","287.72148820"]
* [时间戳，开盘价，最高价，最低价，收盘价，成交量]
* 第一次推送数据初始化，后面推送是增量更新。
```json
{
    "method":"push_kline_graph",
    "data":[
        ["1534196280000","4.59185000","4.59235000","4.58500000","4.58545000","287.72148820"],
        ["1534197180000","4.58545000","4.58545000","4.53725000","4.54845000","303.61372494"]
    ]
}
```

## error_code
| error_code |  text |
|---| --- |
| 1 | 无效的订单 |
| 2 | 余额不足 |
| 3 | 服务端解析发送的json数据出错 |
| 4 | 没有该用户 |
| 5 | 重复操作 |
| 6 | 创建订单失败，服务器内部错误 |
| 7 | 无效的用户ID |
| 8 | 无效的价格 |
| 9 | 无效的个数 |
| 10 | 不知道如何提示，大概意思是这边服务器压力很大 |
| 11 | 无效的市场代号 |
| 12 | 无效的买卖类型 |
| 13 | 无效验证的用户 |
| 14 | 该市场暂停交易 |
| 15 | 验证失败 |
| 16 | 禁用的市场 |
| 17 | 需要实名认证 |





























