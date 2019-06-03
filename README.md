# RbtcQuant

[RBTC](https://www.dxb.com/)交易平台量化交易API
----
## 协议变更记录

|   变更版本    |   变更时间    |   变更内容    |   变更目的    |  
|   --- |   --- |   --- |   --- |  
|   1.1 |   2019-04-1 15:00 |   深度/实时成交/用户挂单/K线/用户成交 数据添加一个顶级的market字段,类型为字符串,表示数据对应的市场    |   用户切换市场时,服务器可能推送一个旧市场的数据,添加该字段,使得使用者可以进行过滤 |   
## 生成 RSA 公钥私钥
```bash
# 1024bit, pkcs8
npm run create-rsa
```
或 [openssl](https://www.openssl.org/) 生成

## http 协议

### 下单

#### HTTP方法及地址
POST **/order**

#### 参数
JSON
* market 当前交易市场， _连接, 左边是交易货币，右边是支付货币，如btc_usdt
* uid 用户id[可以选字段，当这个不填或填0，表示不登录，token和rsa_ciphertext将被忽略]
* token 当前用户登录时随机生成512长度的字符串 RBTC登录
* rsa_ciphertext 当前用户手机号 RSA私钥加密的 base64 字符串，请用户先设置RSA公钥 RSA公钥设置,用户登录token和rsa_ciphertext必须传一个
* data 下单数据
    * type 类型 Buy/Sell
    * price 价格
    * count 数量
    * ts 当前毫秒时间戳


```json
{
  "market": "eos_usdt",
  "uid": 7474,
  "token": "123",
  "rsa_ciphertext": "41242",
  "data": {
    "count": "0.0001",
    "price": "100001",
    "ts": 1529402865467,
    "type": "Buy"
  }
}
```

#### 返回状态码
总是200

#### 返回值
* [error_code](#error_code)
```json
{"order_id":"1550216642281386001","error_code":0}
```
### 取消订单

#### HTTP方法
POST **/withdraw**

#### 参数
JSON
* market 当前交易市场， _连接, 左边是交易货币，右边是支付货币，如btc_usdt
* uid 用户id[可以选字段，当这个不填或填0，表示不登录，token和rsa_ciphertext将被忽略]
* token 当前用户登录时随机生成512长度的字符串 RBTC登录
* rsa_ciphertext 当前用户手机号 RSA私钥加密的 base64 字符串，请用户先设置RSA公钥 RSA公钥设置,用户登录token和rsa_ciphertext必须传一个
* data 下单数据
    * order_id 订单id

```json
{
  "market": "eos_usdt",
  "uid": 7474,
  "token": "123",
  "rsa_ciphertext": "41242",
  "data": {
    "order_id": "1550215048122084003"
     }
}
```

#### 返回状态码
总是200

#### 返回值
* [error_code](#error_code)
```json
{"order_id":"1550216642281386001","error_code":0}
```
## ws url
系统不主动暴露url,而是通过一个前置的服务来动态返回url，
### 通信方法
HTTP GET

### 地址
/chooseLeast

### 参数
无
### 返回状态码
总是200
### 返回值
json数据
```json
{
    "address":"服务器地址",
    "error":"错误信息，如果成功，本字段不存在"
}
```
应用连接返回的地址(如wss://market-api.dxb.com/sub)


## ws 协议
|接口|说明|是否需要用户验证|返回|是否针对单个市场|
----------------------|---------------------|---------------------|---------------------|---------------------|
[pull_user_market](#pull_user_market)|订阅市场或登录|-|push_user_market|是|
[pull_user_assets](#pull_user_assets)	|请求用户当前余额|是|push_user_assets|-|
[pull_user_order](#pull_user_order)	|请求用户当前交易对委托|是|push_user_order|是|
[pull_user_deal](#pull_user_deal)	|请求用户当前交易对已成交记录|是|push_user_deal|是|
[order](#order)	|委托挂单|是|order_resp|是|
[withdrawal](#withdrawal)	|撤单|是|withdrawal_resp|是|
[pull_home_market_quote](#pull_home_market_quote)	|请求24小时行情数据|否|push_home_market_quote|多|
[pull_home_market_trend](#pull_home_market_trend)	|请求3日价格趋势|否|push_home_market_trend|多|
[pull_merge_depth_order_list](#pull_merge_depth_order_list)	|请求委托挂单深度|否|push_merge_depth_order_list|是|
[pull_kline_graph](#pull_kline_graph)	|请求k线|否|push_kline_graph|是|
[pull_deal_order_list](#pull_deal_order_list)	|请求当前交易对实时成交记录|否|push_deal_order_list|是|
[pull_heart](#pull_heart)	|心跳包|否|push_heart|-|
* 上述表格中，“-”表示无关；“是否针对单个市场”列中的“多”，表示该协议既可以用在多个市场也可以针对单个市场。

## ws 数据格式
* ws 订阅发送utf8编码的json字符串
```json
{
    "method":"pull_user_market",
    "data":{
        "market" : "btc_usdt",
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

## <span id = "pull_user_market">pull_user_market 订阅市场或登录</span>

* 用户相关的数据必须先登录以后才能订阅，未登录订阅用户数据可能会造成服务端主动关闭 websocket
* market 当前交易市场， _连接, 左边是交易货币，右边是支付货币，如btc_usdt
* uid 用户id[可以选字段，当这个不填或填0，表示不登录，token和rsa_ciphertext将被忽略]
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
* 登录状态 data[0][0] == 0 ? "登录成功" : "登录失败"
```json
{
    "method":"push_user_market",
    "data":[
        ["0"]
    ]
}
```

### ws 特别说明
* 请求ws协议表格列“是否针对单个市场”值为“是”的协议之前，必须先请求**pull_user_market**，market字段填写你需要订阅的市场（或称交易对）。
* **pull_user_market**拥有订阅市场、登录两种功能。协议包中market指定的就是市场（或称交易对），当不传market的时候，请求ws协议表格列“是否针对单个市场”值为“是”的协议是无效的。当不传market的时候，请求**pull_home_market_quote**和**pull_home_market_trend**返回的是所有交易所支持的市场的数据。
* 关于切换市场，切换市场需先请求**pull_user_market**，market字段填写你需要订阅的市场（或称交易对）。

## <span id = "pull_merge_depth_order_list">pull_merge_depth_order_list 委托挂单深度</span>
订阅
```json
{
    "method" : "pull_merge_depth_order_list"
}
```
推送
* 第一次推送是20条的深度数据，以后的推送是变动的深度数据（数据结构不变）。需要自行合并深度，详情查看demo 
* ["33.31000000","6.60912639"] 价格,数量
```json
{
    "method":"push_merge_depth_order_list",
    "market":"btc_usdt",
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

## <span id = "pull_user_assets">pull_user_assets 用户当前余额</span>
* 登录成功后请求一次为最新余额，之后可以在每次收到**push_user_order**或**push_user_deal**后请求一次可获得最新余额
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

## <span id = "pull_user_order">pull_user_order 用户当前交易对委托</span>
订阅
* max_count 获取的委托挂单数量，-1获取全部委托，可选参数，不填则是返回默认的**30**条
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
    "market":"btc_usdt",
    "data":[
        ["1529401690299552949",1529402081000,"sell","100001.00000000","0.00010000","0.00010000","ing"],
        ["1529401690299552948",1529402081000,"buy","100000.00000000","0.00010000","0.00010000","ing"]
    ]
}
```

## <span id = "pull_user_deal">pull_user_deal 用户当前交易对已成交记录</span>
订阅
```json
{
  "method" : "pull_user_deal",
}
```
推送
* 第一次推送最多 30 条数的委托，后面推送变动的数据
* 推送数据结构同用户当前交易对委托  push_user_order
* ["1529401690299552949",1529402081000,"sell","100001.00000000","0.00010000","0.00010000","deal"]
* 订单号，时间，类型，价格，成交数量，委托数量，状态（deal成交）
```json
{
    "method":"push_user_deal",
    "market":"btc_usdt",
    "data":[
        ["1529401690299552949",1529402081000,"sell","100001.00000000","0.00010000","0.00010000","deal"],
        ["1529401690299552948",1529402081000,"buy","100000.00000000","0.00010000","0.00010000","deal"]
    ]
}
```

## <span id = "pull_home_market_quote">pull_home_market_quote 当前交易对24小时行情数据，未先订阅交易对订阅行情会返回所有的交易对行情，单独订阅一个交易对请先订阅</span>
* 在**pull_user_market**的参数market不填的情况下，第一次请求**pull_home_market_quote**则返回所有市场最近24小时数据，之后会自动推送有修改的数据
* 在填写了有效的**pull_user_market**的参数market的情况下，第一次请求**pull_home_market_quote**则返回指定市场最近24小时数据，之后若该市场有修改数据时会自动推送
订阅
```json
{
  "method" : "pull_home_market_quote",
}
```
推送
* 第一次初始化，后面增量推送
* data["支付货币"]["交易货币"]
* [交易对, 最新成交价, 24H开盘价,24h涨跌, 24h最高价, 24h最低价, 24h成交量, 24h成交额, 交易货币¥单价折算, 支付货币¥单价折算]
```json
{
    "method":"push_home_market_quote",
    "data":{
        "usdt":{
            "eth":["eth_usdt","0.00000000","0.00000000","-20.00000000","0.00000000","0.00000000","0.00000000","0.00000000","0.00000000","6.86470000"]
        }
    }
}
```

## <span id = "pull_home_market_trend">pull_home_market_trend 3日价格趋势</span>
* 在**pull_user_market**的参数market不填的情况下，第一次请求**pull_home_market_trend**则返回所有市场的3日价格趋势，之后会自动推送有修改的数据
* 在填写了有效的**pull_user_market**的参数market的情况下，第一次请求**pull_home_market_trend**则返回指定市场的3日价格趋势，之后若该市场有修改数据时会自动推送

订阅
``` json
{
	"method" : "pull_home_market_trend"
}
```
推送
* 第一次请求**pull_home_market_trend**会推送初始化数据，每个市场最多**72**条，之后会推送增量数据
* ["156574674567", "0.2"]
* [k线开始时间ms, 价格]
``` json
{
	"method" : "push_home_market_trend",
	"data" : {
		"usdt" : {
			"doge" : [
				["156574674567", "0.2"],
				["156574674567", "0.4"]
			],
			"btc: [["156574674567", "0.2"], ["156574674567", "0.2"]]
		},
		"btc":{
			"eth: [["156574674567", "0.2"], ["156574674567", "0.2"]]
		}
	}
}
```

## <span id = "pull_deal_order_list">pull_deal_order_list 当前交易对实时成交记录</span>
订阅
```json
{
  "method" : "pull_deal_order_list",
}
```
推送
* 第一次请求pull_deal_order_list会返回最大100条实时成交数据，之后会增量推送
* [1532488767000,"buy","10.00000000","50.00000000","1532436029270392021"]
* [时间戳, 交易类型(buy/sell）,成交价,成交数量,订单号]
```json
{
    "method":"push_deal_order_list",
    "market":"btc_usdt",
    "data":[
        [1532488767000,"buy","10.00000000","50.00000000","1532436029270392021"],
        [1534315010000,"sell","5.00000000","1.00000000","1534314570043489943"]
    ]
}
```

## <span id = "order">order 委托挂单</span>
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

## <span id = "withdrawal">withdrawal 撤单</span>
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


## <span id = "pull_kline_graph">pull_kline_graph K线</span>
订阅
* k_line_type K线类型，单位为分钟的数字，字符串类型
* k_line_count k线数据长度，最大**500**条
```json
{
    "method" : "pull_kline_graph",
    "market","btc_usdt",
    "data" : {
        "k_line_type" : "1",
        "k_line_count" : "500",
    }
}
```

|k_line_type|说明|
|---|---|
|1|1分钟|
|3|3分钟|
|5|5分钟|
|10|10分钟|
|15|15分钟|
|30|30分钟|
|60|1小时|
|120|2小时|
|240|4小时|
|360|6小时|
|720|12小时|
|1440|1天|
|10080|1周|

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

## <span id = "pull_heart">pull_heart 心跳包</span>
每隔5-10秒发一次，用于保持连接

请求
* time 发送者本地时间戳，服务器收到后会原值返回。发送者可以根据(当前的本地时间戳-time)/2，求出网络延迟
```json
{
    "method":"pull_heart",
    "data":{
    	"time":"123412341234",
    }
}
```

返回
```json
{
    "method":"push_heart",
    "data":{
    	"time":"123412341234",
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
| 10 | 服务器繁忙，请稍后再试 |
| 11 | 无效的市场代号 |
| 12 | 无效的买卖类型 |
| 13 | 无效验证的用户 |
| 14 | 该市场暂停交易 |
| 15 | 验证失败 |
| 16 | 禁用的市场 |
| 17 | 需要实名认证 |
| 18 | 无效的k线类型 |
| 19 | 下单时间结束 |
| 20 | 单次下单个数太少 |
| 21 | 下单个数太多，超过本轮上线 |
| 22 | 请同意条款 |
| 23 | 不合法的请求 |
| 24 | 重复下单过多 |
| 25 | 用户禁止交易 |

