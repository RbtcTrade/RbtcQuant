const Decimal = require('decimal.js');
/**
 * 模板class
 */
class tempClass {
    constructor(){
        this._data = [];
        this.watchCallback = [];
        this.state = false;
    }
    get data (){
        return this._data;
    }
    set data (data){
        this.execute(data, JSON.parse(JSON.stringify(this._data)));
        this._data = data;
        if(!this.state) this.state = true;
    }

    execute (val, old){
        this.watchCallback.forEach(call => {
            call.call(this, val, old);
        });
    }

    watch (callback){
        if(typeof callback == 'function'){
            this.watchCallback.push(callback);
        };
    }
    removeWatch (callback){
        if(typeof callback != 'function') return false;
        for (let i = 0; i < this.watchCallback.length; i++){
            if(this.watchCallback[i] === callback){
                this.watchCallback.splice(i, 1);
                return true;
            };
        }
    }
}

/**
 * 用户委托
 */
class UserOrder extends tempClass{
    constructor (){
        super();
        this.keyList = [];
        this.keyObj = {};
        this.watchCallback = [];
    }
    get data (){
        return super.data;
    }
    set data (data){
        let upData = this.upData(data);
        let old = JSON.parse(JSON.stringify(this._data));
        this._data = upData;
        this.setKey();
        this.execute(upData, old);
        if(!this.state) this.state = true;
    }

    setKey (){
        let keyList = [],keyObj = {};
        this.data.forEach(function (item){
            keyList.push(item[0]);
            keyObj[item[0]] = item;
        });
        this.keyList = keyList;
        this.keyObj = keyObj;
    }

    upData (data){
        var newData = [];
        var userOrder = JSON.parse(JSON.stringify(this.data));
        if(this.keyList.length){
            data.forEach((item, dIndex) => {
                var i = this.keyList.indexOf(item[0]);
                if(i >= 0){
                    if(item[6] == 'withdrawal'){
                        userOrder.splice(i, 1, item);
                    }else{
                        userOrder.splice(i, 1, item);
                    };
                }else{
                    if(item[6] == 'withdrawal'){
                    }else{
                        newData.push(item);
                    };
                };
            });
            data = newData;
        }else{
            data.forEach(function (d, dIndex){
                if(d[6] != 'withdrawal'){
                    newData.push(d);
                };
            });
            data = newData;
        };
        if(userOrder.length >= 200){
            userOrder.splice(data.length * -1);
        };
        var newUserOrder = [];
        userOrder.forEach(function (d){
            if(d[6] != 'withdrawal'){
                newUserOrder.push(d);
            };
        });
        return data.concat(newUserOrder);
    }
};

/**
 * 用户余额
 */
class UserAssets extends tempClass{
    constructor (){
        super();
    }
}

/**
 * 深度卖单
 */
class DepthSell extends tempClass{
    constructor (){
        super();
        this.depthKey = {};
        this.type = 'sell';
    }
    get data (){
        return super.data;
    }
    set data (data){
        var depthKey = Object.assign({}, this.depthKey);
        var mergeData = this.merge(data, depthKey, this.type);
        let old = JSON.parse(JSON.stringify(this._data));
        this._data = mergeData.d;
        this.depthKey = mergeData.k;
        this.execute(this._data, old);
        if(!this.state) this.state = true;
    }
    merge (data, depthKey, type){
        if(Array.isArray(data)){
            data.forEach(item => {
                var itemK = item[0];
                if(depthKey[itemK]){
                    var n = (parseFloat(depthKey[itemK]) + parseFloat(item[1])).toFixed(8);
                    if(n == 0){
                        delete depthKey[itemK];
                    }else{
                        depthKey[itemK] = n;
                    };
                }else{
                    depthKey[itemK] = item[1];
                };
            });
        };
        var key = Object.keys(depthKey);
        if(type == 'buy'){
            key.sort((a, b) => {
                return (parseFloat(b) - parseFloat(a)).toFixed(8);
            });
        }else{
            key.sort((a, b) => {
                return (parseFloat(a) - parseFloat(b)).toFixed(8);
            });
        };
        var depthSell = [];
        key.forEach(k => {
            depthSell.push([k, depthKey[k]]);
        });
        return {
            k : depthKey,
            d : depthSell
        }
    };
}

/**
 * 深度买单
 */
class DepthBuy extends DepthSell{
    constructor (){
        super()
        this.type = 'buy';
    }
}

/**
 * 实时成交列表
 */
class DealList extends tempClass{
    constructor (){
        super();
    }
    get data (){
        return super.data;
    }
    set data (data){
        let old = JSON.parse(JSON.stringify(this._data));
        let n = data.concat(this._data);
        if(n.length > 200){
            n.splice(200 - n.length);
        };
        this._data = n;
        this.execute(this._data, old);
        if(!this.state) this.state = true;
    }
}

module.exports = {
    UserOrder,
    UserAssets,
    DepthSell,
    DepthBuy,
    DealList,
}