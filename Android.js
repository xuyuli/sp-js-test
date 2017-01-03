!function(){\n    var _su="https://plogin.m.jd.com/user/login.action?appid=100";\n    /**\n * Created by du on 16/9/1.\n */\nvar $ = dQuery;\nvar jQuery=$;\nString.prototype.format = function () {\n    var args = Array.prototype.slice.call(arguments);\n    var count = 0;\n    return this.replace(/%s/g, function (s, i) {\n        return args[count++];\n    });\n};\n\nString.prototype.trim = function () {\n    return this.replace(/(^\s*)|(\s*$)/g, \'\');\n};\n\nString.prototype.empty = function () {\n    return this.trim() === "";\n};\n\nfunction _logstr(str){\n    str=str||" "\n    return typeof str=="object"?JSON.stringify(str):(new String(str)).toString()\n}\nfunction log(str) {\n    var s= window.curSession\n    if(s){\n        s.log(str)\n    }else {\n        console.log("dSpider: "+_logstr(str))\n    }\n}\n\n//异常捕获\nfunction errorReport(e) {\n    var stack=e.stack? e.stack.replace(/http.*?inject\.php.*?:/ig," "+_su+":"): e.toString();\n    var msg="语法错误: " + e.message +"\nscript_url:"+_su+"\n"+stack\n    if(window.curSession){\n        curSession.log(msg);\n        curSession.finish(e.message,"",3,msg);\n    }\n}\n\nString.prototype.endWith = function (str) {\n    if (!str) return false;\n    return this.substring(this.length - str.length) === str;\n};\n\n//queryString helper\nwindow.qs = [];\nvar s = decodeURI(location.search.substr(1));\nvar a = s.split(\'&\');\nfor (var b = 0; b < a.length; ++b) {\n    var temp = a[b].split(\'=\');\n    qs[temp[0]] = temp[1] ? temp[1] : null;\n}\nMutationObserver = window.MutationObserver || window.WebKitMutationObserver\n\nfunction safeCallback(f) {\n    if (!(f instanceof Function)) return f;\n    return function () {\n        try {\n            f.apply(this, arguments)\n        } catch (e) {\n            errorReport(e)\n        }\n    }\n}\n//设置dQuery异常处理器\ndQuery.safeCallback = safeCallback;\ndQuery.errorReport = errorReport;\n\nfunction hook(fun) {\n    return function () {\n        if (!(arguments[0] instanceof Function)) {\n            t = arguments[0];\n            log("warning: " + fun.name + " first argument should be function not string ")\n            arguments[0] = function () {\n                eval(t)\n            };\n        }\n        arguments[0] = safeCallback(arguments[0]);\n        return fun.apply(this, arguments)\n    }\n}\n\n//hook setTimeout,setInterval异步回调\nvar setTimeout = hook(window.setTimeout);\nvar setInterval = hook(window.setInterval);\n\n//dom 监控\nfunction DomNotFindReport(selector) {\n    var msg = "元素不存在[%s]".format(selector)\n    log(msg)\n}\n\nfunction waitDomAvailable(selector, success, fail) {\n    var timeout = 10000;\n    var t = setInterval(function () {\n        timeout -= 10;\n        var ob = dQuery(selector)\n        if (ob[0]) {\n            clearInterval(t)\n            success(ob, 10000 - timeout)\n        } else if (timeout == 0) {\n            clearInterval(t)\n            var f = fail || DomNotFindReport;\n            f(selector)\n        }\n    }, 10);\n}\n\nfunction Observe(ob, options, callback) {\n    var mo = new MutationObserver(callback);\n    mo.observe(ob, options);\n    return mo;\n}\n\n//dquery,api加载成功的标志是window.xyApiLoaded=true,所有操作都必须在初始化成功之后\nfunction apiInit() {\n    dQuery.noConflict();\n    var withCheck=function(attr) {\n        var f = DataSession.prototype[attr];\n        return function () {\n            if (this.finished) {\n                log("call " + attr + " ignored, finish has been called! ")\n            } else {\n                return f.apply(this, arguments);\n            }\n        }\n    }\n\n    for (var attr in DataSession.prototype) {\n        DataSession.prototype[attr] = withCheck(attr);\n    }\n    var t = setInterval(function () {\n        if (!(window._xy || window.bridge)) {\n            return;\n        }\n        window.xyApiLoaded = true;\n        clearInterval(t);\n    }, 20);\n}\n\n//爬取入口\nfunction dSpider(sessionKey, callback) {\n    if(window.onSpiderInited&&this!=5)\n     return;\n    var $=dQuery;\n    var t = setInterval(function () {\n        if (window.xyApiLoaded) {\n            clearInterval(t);\n        } else {\n            return;\n        }\n        var session = new DataSession(sessionKey);\n        var onclose=function(){\n            log("onNavigate:"+location.href)\n            session._save()\n            if(session.onNavigate){\n                session.onNavigate(location.href);\n            }\n        }\n        $(window).on("beforeunload",onclose)\n        window.curSession = session;\n        session._init(function(){\n            DataSession.getExtraData(function (extras) {\n                $(safeCallback(function(){\n                    $("body").on("click","a",function(){\n                        $(this).attr("target",function(_,v){\n                            if(v=="_blank") return "_self"\n                        })\n                    })\n                    log("dSpider start!")\n                    extras.config=typeof _config==="object"?_config:"{}";\n                    session._args=extras.args;\n                    callback(session, extras, $);\n                }))\n            })\n        })\n    }, 20);\n}\n\ndQuery(function(){\n    if(window.onSpiderInited){\n      window.onSpiderInited(dSpider.bind(5));\n    }\n})\n\n//邮件爬取入口\nfunction dSpiderMail(sessionKey, callback) {\n    dSpider(sessionKey,function(session,env,$){\n      callback(session.getLocal("u"), session.getLocal("wd"), session, env, $);\n    })\n};\n    function DataSession(key) {\n    this.key = key;\n    this.finished = false;\n    _xy.start(key);\n}\n\nDataSession.getExtraData = function (f) {\n    f = safeCallback(f);\n    f && f(JSON.parse(_xy.getExtraData() || "{}"));\n}\n\nDataSession.prototype = {\n    _save: function () {\n        _xy.set(this.key, JSON.stringify(this.data));\n        _xy.save(this.key,JSON.stringify(this.local))\n    },\n    _init: function (f) {\n        this.data = JSON.parse(_xy.get(this.key) || "{}");\n        this.local=JSON.parse(_xy.read(this.key)|| "{}")\n        f()\n    },\n\n    get: function (key) {\n        return this.data[key];\n    },\n    set: function (key, value) {\n        this.data[key] = value;\n    },\n\n    showProgress: function (isShow) {\n        _xy.showProgress(isShow === undefined ? true : !!isShow);\n    },\n    setProgressMax: function (max) {\n        _xy.setProgressMax(max);\n    },\n    setProgress: function (progress) {\n        _xy.setProgress(progress);\n    },\n    getProgress: function (f) {\n        f = safeCallback(f);\n        f && f(_xy.getProgress());\n    },\n    showLoading: function (s) {\n        _xy.showLoading(s || "正在爬取,请耐心等待...")\n    },\n    hideLoading: function () {\n        _xy.hideLoading()\n    },\n    finish: function (errmsg, content, code, stack) {\n        this.finished = true;\n        if (errmsg) {\n            var ob = {\n                url: location.href,\n                msg: errmsg,\n                //content: content || document.documentElement.outerHTML,\n                args: this._args\n            }\n            stack && (ob.stack = stack);\n            return _xy.finish(this.key || "", code || 2, JSON.stringify(ob));\n        }\n        return _xy.finish(this.key || "", 0, "")\n    },\n    upload: function (value) {\n        if (value instanceof Object) {\n            value = JSON.stringify(value);\n        }\n        return _xy.push(this.key, value)\n    },\n    load: function (url, headers) {\n        headers = headers || {}\n        if (typeof headers !== "object") {\n            alert("the second argument of function load  must be Object!")\n            return\n        }\n        _xy.load(url, JSON.stringify(headers));\n    },\n    setUserAgent: function (str) {\n        _xy.setUserAgent(str)\n    },\n    openWithSpecifiedCore: function (url, core) {\n        _xy.openWithSpecifiedCore(url, core)\n    },\n    autoLoadImg: function (load) {\n        _xy.autoLoadImg(load === true)\n    },\n    string: function () {\n        log(this.data)\n    },\n    setProgressMsg:function(str){\n        if(!str) return;\n        _xy.setProgressMsg(str);\n    },\n    log: function(str,type) {\n        str=_logstr(str);\n        console.log("dSpider: "+str)\n        _xy.log(str,type||1)\n    },\n    setLocal: function (k, v) {\n        this.local[k]=v\n    },\n    getLocal: function (k) {\n        return this.local[k];\n    }\n};\napiInit();;\n    \ndSpider("jd", function(session,env,$){\n    var re = /sid=(.+)$/ig;\n    var infokey = "infokey";\n    var sid = "";\n    var max_order_num = 30;\n    var max_order_date = 100;\n    var globalInfo;\n\n    sid = session.get("sid");\n    session.onNavigate=function(url){\n        if(url.indexOf("://plogin.m.jd.com/user")!=-1){\n            session.showProgress(true);\n            session.setProgressMax(100);\n            session.setProgress(0);\n            session.autoLoadImg(false);\n        }\n    }\n\n\n    if (location.href.indexOf("://m.jd.com") != -1 ) {\n        session.setProgress(5);\n\n        if($(".jd-search-form-input")[0] != undefined){\n            sid  = $(".jd-search-form-input")[0].children[0].value;\n            session.set("sid",  sid);\n        }\n\n        session.set(infokey, new info({},{},{}));\n        globalInfo = session.get(infokey);\n        globalInfo.base_info.username  = $("[report-eventid$=\'MCommonHTail_Account\']").text().replace(/\n/g,"").replace(/\t/g,"");\n        saveInfo();\n        session.setProgress(10);\n        location.href="http://home.m.jd.com/maddress/address.action?";\n    }\n\n    if (location.href.indexOf("home.m.jd.com/maddress") != -1) {\n        session.setProgress(20);\n\n        globalInfo = session.get(infokey);\n\n        global_contact_info = new contact_info([]);\n        var taskAddr = [];\n        var urlarray = $(".ia-r");\n        for(var i=0;i<urlarray.length;i++){\n            taskAddr.push($.get(urlarray[i],function(response,status){\n                var node = $("<div>").append($(response))\n                var name = node.find("#uersNameId")[0].value;\n                var phone = node.find("#mobilePhoneId")[0].value;\n                var addr = node.find("#addressLabelId")[0].innerHTML;\n                var detail = node.find("#address_where")[0].innerHTML;\n\n                global_contact_info.contact_detail.push(new contact(name,addr,detail,phone, ""));\n            }) );\n\n        }\n\n\n        $.when.apply($,taskAddr).done(\n            // $.when(taskAddr).done(\n            function(){\n                globalInfo.contact_info = global_contact_info;\n                saveInfo();\n                session.setProgress(30);\n                getOrder();\n            });\n\n\n    }\n\n\n    function getOrder(){\n        session.setProgress(40);\n        globalInfo = session.get(infokey);\n        var orders = new order_info([]);\n        globalInfo.order_info = new order_info([]);\n        globalInfo.order_info.order_detail = [];\n        function getPageOrder(page){\n            $.getJSON("http://home.m.jd.com//newAllOrders/newAllOrders.json?sid="+sid+"&page="+page,function(d){\n                page++;\n                if( globalInfo.order_info.order_detail.length <=  max_order_num && d.orderList.length!=0 && (orders.order_detail.length == 0 || d.orderList[d.orderList.length-1].orderId != orders.order_detail[orders.order_detail.length-1].orderId) ){\n                    orders.order_detail = orders.order_detail.concat(d.orderList);\n                    var task = [];\n                    var tempOrder = [];\n                    if(globalInfo.order_info.order_detail.length < max_order_num){\n                        if(d.orderList.length + globalInfo.order_info.order_detail.length > max_order_num){\n                            d.orderList = d.orderList.slice(0, max_order_num -  globalInfo.order_info.order_detail.length);\n                        }\n                        task.push($.each(d.orderList,function(i,e){\n                            $.get("http://home.m.jd.com/newAllOrders/queryOrderDetailInfo.action?orderId="+ d.orderList[i].orderId+"&from=newUserAllOrderList&passKey="+d.passKeyList[i]+"&sid="+sid,\n                                function(response,status){\n                                    var addr = $("<div>").append($(response)).find(".step2-in-con").text();\n                                    var orderitem = new order(d.orderList[i].orderId,d.orderList[i].dataSubmit,d.orderList[i].price,addr);\n\n                                    orderitem.products = [];\n                                    var products = $("<div>").append($(response)).find(".pdiv");\n                                    $.each(products,function(k, e){\n                                        var name = $("<div>").append(products[k]).find(".sitem-m-txt").text();\n                                        var price = $("<div>").append(products[k]).find(".sitem-r").text();\n                                        var num = $("<div>").append(products[k]).find(".s3-num").text();\n                                        orderitem.products.push(new product(name,  num ,price));\n                                    });\n                                    if(Date.parse(new Date()) < ((new Date(orderitem.time.split(" ")[0])).getTime() + max_order_date * 24 * 60 * 60 * 1000)){\n                                        if(globalInfo.order_info.order_detail.length < max_order_num){\n                                            globalInfo.order_info.order_detail.push(orderitem);\n                                        }\n                                    }\n                                });\n                        }));\n                    }\n\n\n                    $.when(task).done(function(){\n                        getPageOrder(page);\n                        globalInfo.order_info.order_detail.sort(compare());\n                    });\n\n                }else {\n                    saveInfo();\n                    session.setProgress(60);\n                    getUserInfo();\n                    return;\n                }\n            });\n        }\n        getPageOrder(1);\n    }\n\n    function compare(){\n        return function(a,b){\n            var value1 = (new Date(a.time.split(" ")[0])).getTime();\n            var value2 = (new Date(b.time.split(" ")[0])).getTime();\n            return value2 - value1;\n        }\n    }\n\n    function getUserInfo(){\n        location.href = "http://home.m.jd.com/user/accountCenter.action";\n    }\n    if (location.href.indexOf("home.m.jd.com/user/accountCenter.action") != -1) {\n        session.setProgress(70);\n        if($(\'#shimingrenzheng\')[0] != undefined){\n            $(\'#shimingrenzheng\')[0].click();\n        }\n    }\n\n    //已实名用户\n    if (location.href.indexOf("msc.jd.com/auth/loginpage/wcoo/toAuthInfoPage") != -1) {\n        session.setProgress(90);\n        globalInfo = session.get(infokey);\n        if( $(".pos-ab")[0] != undefined){\n            globalInfo.base_info.name  = $(".pos-ab")[0].innerHTML;\n        }\n        if($(".pos-ab")[1] != undefined){\n            globalInfo.base_info.idcard_no  = $(".pos-ab")[1].innerHTML;\n        }\n        saveInfo();\n        logout();\n\n\n    }\n\n    function logout(){\n\n        alert("爬取订单总计:" + session.get(infokey).order_info.order_detail.length);\n        location.href = "https://passport.m.jd.com/user/logout.action?sid="+session.get("sid");\n        session.setProgress(100);\n        session.upload(session.get(infokey));\n        session.finish();\n    }\n    //快捷卡实名用户\n    if (location.href.indexOf("msc.jd.com/auth/loginpage/wcoo/toAuthPage") != -1) {\n        session.setProgress(90);\n        globalInfo = session.get(infokey);\n        if($("#username")[0] !=undefined){\n            globalInfo.base_info.name  = $("#username")[0].value;\n        }\n        if($("#idcard")[0] !=undefined){\n            globalInfo.base_info.idcard_no  = $("#idcard")[0].value;\n        }\n        saveInfo();\n        logout();\n    }\n\n    function saveInfo(){\n        session.set(infokey, globalInfo);\n    }\n\n\n\n    function addr(name,phone,addrdetail) {\n        this.name = name;\n        this.phone = phone;\n        this.addrdetail = addrdetail;\n    }\n\n    var address = [];\n    var global_contact_info;\n\n\n    function info(base_info,contact_info,order_info ){\n        this.site_id = 2;\n        this.base_info = base_info;\n        this.contact_info = contact_info;\n        this.order_info  = order_info;\n    }\n\n    function base_info(username, name, idcard_no, phone){\n        this.username = username;\n        this.name = name;\n        this.idcard_no = idcard_no;\n        this.phone = phone;\n    }\n\n\n    function contact_info(contact_detail){\n        this.contact_detail = contact_detail;\n    }\n\n    function contact(name, location ,address, phone, zipcode){\n        this.name  = name;\n        this.location  = location;\n        this.address  = address;\n        this.phone  = phone;\n        this.zipcode  = zipcode;\n    }\n\n    function order_info(order_detail){\n        this.order_detail  = order_detail;\n    }\n\n    function order(id, time , total, address){\n        this.id  = id;\n        this.time  = time;\n        this.total  = total;\n        this.address  = address;\n    }\n\n    function product(name, number, price){\n        this.name  = name;\n        this.number  = number;\n        this.price  = price;\n    }\n\n\n//end\n});\n
