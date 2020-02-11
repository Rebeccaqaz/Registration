/**
 * 前台的服务端程序
 */

var express = require('express');
var mongodb=require('mongodb');
var objectId=mongodb.ObjectId;
var MongoClient=mongodb.MongoClient;
var router = express.Router();
var responseData;
var url='mongodb://localhost:27017';
router.use(function(req,resp,next){
    responseData={
        code:0,
        message:''
    };
    next();
});
//专家查询
router.get('/user/doctorInfo',function(req,resp){
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        var dbase=db.db('registration');
        dbase.collection('doctors').aggregate([
            {
                $lookup:
                {
                    from:'departments',
                    localField:'did',//blog_contents表里面的字段
                    foreignField:'_id',//blog_s表里面的主键字段
                    as:'department'//别名
                }
            },
            {
                $lookup:{
                    from:'hospitals',
                    localField:'hid',
                    foreignField:'_id',
                    as:'hospital'
                }

            },
            {$unwind:'$department'},
            {$unwind:'$hospital'},
            {$sort:{'_id':-1}}
        ]).toArray(function(err,res){
            console.log(res);
            //获取当前查询页数默认第一条
            var page=req.query.page||1;
            //每页显示三条数据
            var limit=3;
            //计算总页数
            var totalPage=Math.ceil(res.length/limit);
            //如果当前页小于等于第一页那么查询第一页内容
            if(page<=1){page=1;}
            //如果当前页大于等于最后一页那么查询最后一页内容
            if(page>=totalPage){page=totalPage;}
            //计算出从哪个下标开始查起
            var startIndex=(page-1)*limit;
            var doctors=res.slice(startIndex,startIndex+limit);
            resp.render('main/doctor_info',{
                userInfo:req.userInfo,
                doctors:doctors,
                count:res.length,
                page:page,
                limit:limit,
                totalPage:totalPage
            });
        });
    });
})
//根据自己想要的医生来选择挂号操作
router.get('/user/reg', function (req,resq){
    var id = req.query.id||'';
    resq.render('main/reg',{
        userInfo:req.userInfo,
        did:id
    });
})
router.post('/user/reg',function(req,resp){
    var uid=req.body.uid||'';
    var did=req.body.did||'';
    var illness=req.body.illness||'';
    var date=new Date();
    var name=req.body.name||'';
    var tel=req.body.tel||'';
    if(illness==''){
        responseData.code=1;
        responseData.message='所患疾病不能为空';
        resp.json(responseData);
        return;
    }
    if(name==''){
        responseData.code=2;
        responseData.message='真实姓名不能为空';
        resp.json(responseData);
        return;
    }
    if(tel==''){
        responseData.code=3;
        responseData.message='联系电话不能为空';
        resp.json(responseData);
        return;
    }
    MongoClient.connect(url,{ useNewUrlParser: true,useUnifiedTopology:true },function(err,db){
        var dbase = db.db('registration');
        var whereStr={'illness':illness};
        dbase.collection('r_info').find(whereStr).toArray(function(err,results){
            if(results.length>0){
                responseData.code = 4;
                responseData.message = '该疾病已经被挂号预约过了';
                resp.json(responseData);
            }
            else{
                //定义一个插入用户的json对象
                var reg = {
                    'uid':objectId(uid),
                    'did':objectId(did),
                    'illness':illness,
                    'date':date .toLocaleString(),
                    'name':name,
                    'tel':tel
                };
                dbase.collection('r_info').insertOne(reg,function(err,res){});
                responseData.message='挂号成功';
                resp.json(responseData)
            }
        });

    });
})
//公告信息
router.get('/user/noticeInfo',function(req,resp){
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        var dbase=db.db('registration');
        dbase.collection('notices')
            .find().sort({'_id':-1}).toArray(function(err,results){
                //获取当前查询页数默认第一条
                var page=req.query.page||1;
                //每页显示2条数据
                var limit=2;
                //计算总页数
                var totalPage=Math.ceil(results.length/limit);
                //如果当前页小于等于第一页那么查询第一页内容
                if(page<=1){page=1;}
                //如果当前页大于等于最后一页那么查询最后一页内容
                if(page>=totalPage){page=totalPage;}
                //计算出从哪个下标开始查起
                var startIndex=(page-1)*limit;
                var notices=results.slice(startIndex,startIndex+limit);
                resp.render('main/notice_info',{
                    userInfo:req.userInfo,
                    notices:notices,
                    count:results.length,
                    page:page,
                    limit:limit,
                    totalPage:totalPage
                });
            });
    });
})
//接受注册请求先跳到用户注册界面
router.get('/user/register',function(req,resp){
    resp.render('main/register');
});
/**
 * 注册
 * 1. 用户名不能为空
 * 2. 密码不能为空
 * 3. 两次密码要一致
 * 4. 用户名不能已经注册
 */
router.post('/user/register',function(req,resp){
    //处理AJAXPOST方式发送过来的请求
    //账号
    var username=req.body.username||'';
    //密码
    var pwd=req.body.password||'';
    //姓名
    var realName=req.body.realName||'';
    //性别
    var gender=req.body.gender||'';
    //地址
    var address=req.body.address||'';
    //电话
    var tel=req.body.tel||'';
    /**
     * 使用正则表达式判断用户名密码手机号是否符合格式*/
    //用户名不能为空且长度必须大于4位、必须以字母开头
    if(username==''){
        responseData.code=1;
        responseData.message='用户名不能为空';
        resp.json(responseData);
        return;
    }
    if(!/^[a-zA-Z]\w{3,}$/g.test(username)){
            responseData.code=2;
            responseData.message='用户名不符合条件';
            resp.json(responseData);
            return;
    }
    //密码不能为空且长度必须大于6位、必须数字字母结合
    if(pwd==''){
        responseData.code=3;
        responseData.message='密码不能为空';
        resp.json(responseData);
        return;
    }
    if(!/^[0-9a-zA-Z]{6,}$/.test(pwd)){
        responseData.code=4;
        responseData.message='密码不符合条件';
        resp.json(responseData);
        return;
    }
    if(realName==''){
        responseData.code=5;
        responseData.message='姓名不能为空';
        resp.json(responseData);
        return;
    }
    if(gender==''){
        responseData.code=6;
        responseData.message='性别不能为空';
        resp.json(responseData);
        return;
    }
    if(address==''){
        responseData.code=7;
        responseData.message='地址不能为空';
        resp.json(responseData);
        return;
    }
    if(tel==''){
        responseData.code=8;
        responseData.message='电话不能为空';
        resp.json(responseData);
        return;
    }
    MongoClient.connect(url,{ useNewUrlParser: true,useUnifiedTopology:true },function(err,db){

        //判断注册的用户是否已经在数据库中存在
        //获取操作的数据库

        var dbase = db.db('registration');

        var whereStr={'username':username};

        dbase.collection('r_users').find(whereStr).toArray(function(err,results){
            if(results.length>0){
                responseData.code = 9;
                responseData.message = '用户已经被注册了';
                resp.json(responseData);
            }
            else{
                //定义一个插入用户的json对象
                var user = {
                    'username':username,
                    'pwd':pwd,
                    'realName':realName,
                    'gender':gender,
                    'address':address,
                    'tel':tel,
                    'isAdmin':true
                };
                dbase.collection('r_users').insertOne(user,function(err,res){});
                responseData.message='注册成功';
                resp.json(responseData)
            }
        });

    });
});
/**
 * 登录
 * 输入已注册好的用户名与密码
 * 登录失败则提示输入失败
 * 登录成功则自动刷新至成功界面
 * */
router.post('/user/login',function(req,resp){
    //处理AJAXPOST方式发送过来的请求
    var username=req.body.username||'';
    var pwd=req.body.pwd||'';
    if(username==''){
        responseData.code=1;
        responseData.message='用户名不能为空';
        resp.json(responseData);
        return;
    }
    if(pwd==''){
        responseData.code=2;
        responseData.message='密码不能为空';
        resp.json(responseData);
        return;
    }
    MongoClient.connect(url,{ useNewUrlParser: true,useUnifiedTopology:true },function(err,db){
        //获取需要操作的数据库
        var dbase = db.db('registration');
        //查询条件，用户名和密码
        var whereStr={'username':username,'pwd':pwd};

        //根据用户的用户名和密码查询blog_users里面的数据
        dbase.collection('r_users').find(whereStr).toArray(function(err,results) {
            if(results.length==0){
                responseData.code = 3;
                responseData.message = '用户名或密码不正确！';
                resp.json(responseData);
            }else{
                responseData.message = '登录成功！';
                responseData.userInfo = {
                    _id:results[0]._id,
                    username:results[0].username,
                    isAdmin:results[0].isAdmin
                }
                //设置cookies
                req.cookies.set('userInfo',JSON.stringify(responseData.userInfo));
                resp.json(responseData);
            }
        });
    });
});
//接受用户中心请求跳到用户中心页面
router.get('/user/center', function (req,resp) {
    resp.render('main/center',{userInfo:req.userInfo});
})
//个人信息管理
router.get('/user/infoManage',function(req,resp){
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        var id = req.query.id||'';
        console.log(id);
        var dbase=db.db('registration');
        var whereStr={'_id':objectId(id)};
        dbase.collection('r_users')
            .find(whereStr).sort({'_id':-1}).toArray(function(err,results){
                resp.render('main/infoManage',{
                    userInfo:req.userInfo,
                    user:results[0]
                });
            });
    });
})
router.post('/user/infoManage',function(req,resp){
    var id=req.body.id||''
    //处理AJAXPOST方式发送过来的请求
    //账号
    var username=req.body.username||'';
    //密码
    var pwd=req.body.password||'';
    //姓名
    var realName=req.body.realName||'';
    //性别
    var gender=req.body.gender||'';
    //地址
    var address=req.body.address||'';
    //电话
    var tel=req.body.tel||'';
    /**
     * 使用正则表达式判断用户名密码手机号是否符合格式*/
    //用户名不能为空且长度必须大于4位、必须以字母开头
    if(username==''){
        responseData.code=1;
        responseData.message='用户名不能为空';
        resp.json(responseData);
        return;
    }
    if(!/^[a-zA-Z]\w{3,}$/g.test(username)){
        responseData.code=2;
        responseData.message='用户名不符合条件';
        resp.json(responseData);
        return;
    }
    //密码不能为空且长度必须大于6位、必须数字字母结合
    if(pwd==''){
        responseData.code=3;
        responseData.message='密码不能为空';
        resp.json(responseData);
        return;
    }
    if(!/^[0-9a-zA-Z]{6,}$/.test(pwd)){
        responseData.code=4;
        responseData.message='密码不符合条件';
        resp.json(responseData);
        return;
    }
    if(realName==''){
        responseData.code=5;
        responseData.message='姓名不能为空';
        resp.json(responseData);
        return;
    }
    if(gender==''){
        responseData.code=6;
        responseData.message='性别不能为空';
        resp.json(responseData);
        return;
    }
    if(address==''){
        responseData.code=7;
        responseData.message='地址不能为空';
        resp.json(responseData);
        return;
    }
    if(tel==''){
        responseData.code=8;
        responseData.message='电话不能为空';
        resp.json(responseData);
        return;
    }
    MongoClient.connect(url,{ useNewUrlParser: true,useUnifiedTopology:true },function(err,db){

        //判断注册的用户是否已经在数据库中存在
        //获取操作的数据库

        var dbase = db.db('registration');

        var whereStr={'_id':objectId(id)};
        var updateStr={
            username:username,
                pwd:pwd,
            realName:realName,
            gender:gender,
            address:address,
            tel:tel
        }
        dbase.collection('r_users').updateOne(whereStr,updateStr,true,function(err,results){
                responseData.message='修改个人信息成功';
                resp.json(responseData)
        });
    });
})
//预约信息管理
router.get('/user/regManage',function(req,resp){
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        var id = req.query.id||'';
        var dbase=db.db('registration');
        var whereStr={'uid':objectId(id)};
        dbase.collection('r_info')
            .find(whereStr).sort({'_id':-1}).toArray(function(err,results){
                //获取当前查询页数默认第一条
                var page=req.query.page||1;
                //每页显示2条数据
                var limit=2;
                //计算总页数
                var totalPage=Math.ceil(results.length/limit);
                //如果当前页小于等于第一页那么查询第一页内容
                if(page<=1){page=1;}
                //如果当前页大于等于最后一页那么查询最后一页内容
                if(page>=totalPage){page=totalPage;}
                //计算出从哪个下标开始查起
                var startIndex=(page-1)*limit;
                var regs=results.slice(startIndex,startIndex+limit);
                resp.render('main/regManage',{
                    userInfo:req.userInfo,
                    regs:regs,
                    count:results.length,
                    page:page,
                    limit:limit,
                    totalPage:totalPage
                });
            });
    });
})
//取消预约
router.get('/user/cancelReg',function(req,resp){
    var id =req.query.id||'';
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        var dbase=db.db('registration');
        //给定删除条件
        var whereStr={'_id':objectId(id)};
        dbase.collection('r_info').deleteOne(whereStr,function(err,results){
            resp.render('main/regManage',{
                userInfo:req.userInfo,
            })
        });
    });
})
/**
 * 退出用户中心 直接接受a链接跳转然后跳到系统首页即可*/
router.get('/user/exitCenter',function(req,resp){
    resp.render('main/index',{userInfo:req.userInfo});
})
/**
 * 退出用户登录
 * 只需将cookie中的登录用户信息清除即可
 * */
router.get('/user/logout',function(req,resp){
    //将cookie中的登录用户信息清除
    req.cookies.set('userInfo',null);
    resp.json(responseData);
});

module.exports = router;