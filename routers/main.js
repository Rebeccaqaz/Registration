/**
 * 处理前台首页发送的请求
 * 前台首页的服务端程序
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
router.get('/',function(req,resp){
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        var dbase=db.db('registration');
        dbase.collection('hospitals')
            .find().sort({'_id':-1}).toArray(function(err,results){
                //获取当前查询页数默认第一条
                var page=req.query.page||1;
                //每页显示三条数据
                var limit=3;
                //计算总页数
                var totalPage=Math.ceil(results.length/limit);
                //如果当前页小于等于第一页那么查询第一页内容
                if(page<=1){page=1;}
                //如果当前页大于等于最后一页那么查询最后一页内容
                if(page>=totalPage){page=totalPage;}
                //计算出从哪个下标开始查起
                var startIndex=(page-1)*limit;
                var hospitals=results.slice(startIndex,startIndex+limit);
                resp.render('main/index',{
                    userInfo:req.userInfo,
                    hospitals:hospitals,
                    count:results.length,
                    page:page,
                    limit:limit,
                    totalPage:totalPage
                });
            });
    });
});

module.exports = router;
