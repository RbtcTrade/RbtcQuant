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

## RSA 登录
订阅市场
* 用户相关的数据必须先登录以后才能订阅
* market 当前交易市场 _连接   必须字段
* uid 用户id
* rsa_ciphertext  当前用户手机号 RSA私钥加密的 base64 字符串
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
  "method" : "push_user_order",
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

## 用户当前市场委托
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
* 订单号，时间，类型，价格，未成交数量，委托数量，状态
```json
{
    "method":"push_user_order",
    "data":[
        ["1529401690299552949",1529402081000,"sell","100001.00000000","0.00010000","0.00010000","ing"],
        ["1529401690299552948",1529402081000,"buy","100000.00000000","0.00010000","0.00010000","ing"]
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





























