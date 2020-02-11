/**
 *处理后台发送的请求
 * 后台的服务端程序
 */

var express = require('express');
var mongodb=require('mongodb');
var MongoClient=mongodb.MongoClient;
var router = express.Router();
var url='mongodb://localhost:27017';
var responseData;
var objectId=mongodb.ObjectId;
router.use(function(req,resp,next){
    responseData={
        code:0,
        message:''
    };
    next();
});
//所有都有admin显示 userInfo(通过保存在cooies)里的都要通过绚染render传递
//访问后台首页的路由，将一个地址和回调函数绑在一起，这个叫路由
router.get('/',function(req,resp){
    //渲染views/admin/index.html
    resp.render('admin/index',{
        userInfo:req.userInfo
    });
});

//用户管理
router.get('/user/userInfo',function(req,resp){
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        var dbase=db.db('registration');
        dbase.collection('r_users')
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
                var users=results.slice(startIndex,startIndex+limit);
                resp.render('admin/user_info',{
                    userInfo:req.userInfo,
                    users:users,
                    count:results.length,
                    page:page,
                    limit:limit,
                    totalPage:totalPage
                });
            });
    });

});

//医院添加先用渲染跳到/hospital_add页面
router.get('/hospital/add',function(req,resp){
    resp.render('admin/hospital_add',{
        userInfo:req.userInfo
    });
});
//医院添加
router.post('/hospital/add', function (req,resp) {
    var name=req.body.name||'';
    var addr=req.body.addr||'';
    var tel=req.body.tel||'';
    if(name==''){
        resp.render('admin/error',{
            userInfo:req.userInfo,
            message:'医院名不能为空',
            url:'/admin/hospital/add'
        });
        return;
    }
    if(addr==''){
        resp.render('admin/error',{
            userInfo:req.userInfo,
            message:'医院地址不能为空',
            url:'/admin/hospital/add'
        });
        return;
    }
    if(tel==''){
        resp.render('admin/error',{
            userInfo:req.userInfo,
            message:'电话不能为空',
            url:'/admin/hospital/add'
        });
        return;
    }
    MongoClient.connect(url,{ useNewUrlParser: true,useUnifiedTopology:true },
        function(err,db){
            //判断添加的医院名是否已经在数据库中存在
            //获取操作的数据库
            var dbase = db.db('registration');
            var whereStr={'name':name};
            dbase.collection('hospitals')
                .find(whereStr).toArray(function(err,results){
                    if(results.length>0){
                        resp.render('admin/error',{
                            userInfo:req.userInfo,
                            message:'该医院已经被添加了',
                            url:'/admin/hospital/add'
                        });
                    }
                    else{
                        //定义一个插入分类的json对象
                        var hospital = {
                            'name':name,
                            'address':addr,
                            'tel':tel
                        };
                        dbase.collection('hospitals').insertOne(hospital,function(err,res){
                            resp.render('admin/success',{
                                userInfo:req.userInfo,
                                message:'添加医院成功',
                                url:'/admin/hospital/Info'
                            });
                        });
                    }
                });
        });
});
//医院删除
router.get('/hospital/delete',function(req,res){
    var id =req.query.id||'';
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        var dbase=db.db('registration');
        //给定删除条件
        var whereStr={'_id':objectId(id)};
        dbase.collection('hospitals').deleteOne(whereStr,function(err,results){
            res.render('admin/success',{
                userInfo:req.userInfo,
                message:'删除成功',
                url:'/admin/hospital/Info'
            })
        });
    });
})
//医院修改
router.get('/hospital/edit',function(req,resp){
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        var id = req.query.id||'';
        var dbase=db.db('registration');
        var whereStr={'_id':objectId(id)};
        dbase.collection('hospitals').find(whereStr).toArray(function(err,results){
            resp.render('admin/hospital_edit',{
                userInfo:req.userInfo,
                id:id,
                name:results[0].name,
                address:results[0].address,
                tel:results[0].tel
            })
        })
    });

});
router.post('/hospital/edit', function (req,resp) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        //获取操作的Document数据库
        var dbase=db.db('registration');
        var id =req.body._id||'';
        var name=req.body.name||'';
        console.log(name);
        var addr=req.body.addr||'';
        var tel=req.body.tel||'';
        var whereStr={'_id':objectId(id)};
        console.log(id);
        console.log(addr);

        var postDate={
            name:name,
            address:addr,
            tel:tel
        }
        var updateStr={$set:postDate};
        dbase.collection('hospitals').updateOne(whereStr,updateStr,true,function(err,results){
            resp.render('admin/success',{
                userInfo:req.userInfo,
                message:'修改医院信息成功',
                url:'/admin/hospital/Info'
            });
    });
})});
//医院展示.
router.get('/hospital/Info',function(req,resp){
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
                resp.render('admin/hospital_info',{
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

//添加科室
router.get('/department/add',function(req,resp){
    resp.render('admin/department_add',{
        userInfo:req.userInfo
    });
});
//添加科室
router.post('/department/add', function (req,resp) {
    var name=req.body.name||'';
    if(name==''){
        resp.render('admin/error',{
            userInfo:req.userInfo,
            message:'科室名不能为空',
            url:'/admin/department/add'
        });
        return;
    }
    MongoClient.connect(url,{ useNewUrlParser: true,useUnifiedTopology:true },
        function(err,db){
            //判断添加的科室名是否已经在数据库中存在
            //获取操作的数据库
            var dbase = db.db('registration');
            var whereStr={'name':name};
            dbase.collection('departments')
                .find(whereStr).toArray(function(err,results){
                    if(results.length>0){
                        resp.render('admin/error',{
                            userInfo:req.userInfo,
                            message:'该科室名称已经被添加了',
                            url:'/admin/department/add'
                        });
                    }
                    else{
                        //定义一个插入分类的json对象
                        var department = {
                            'name':name,
                        };
                        dbase.collection('departments').insertOne(department,function(err,res){
                            resp.render('admin/success',{
                                userInfo:req.userInfo,
                                message:'添加科室成功',
                                url:'/admin/department/Info'
                            });
                        });
                    }
                });
        });
});
//科室删除
router.get('/department/delete',function(req,res){
    var id =req.query.id||'';
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        var dbase=db.db('registration');
        //给定删除条件
        var whereStr={'_id':objectId(id)};
        dbase.collection('departments').deleteOne(whereStr,function(err,results){
            res.render('admin/success',{
                userInfo:req.userInfo,
                message:'删除成功',
                url:'/admin/department/Info'
            })
        });
    });
})
//科室修改
router.get('/department/edit',function(req,resp){
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        var id = req.query.id||'';
        var dbase=db.db('registration');
        var whereStr={'_id':objectId(id)};
        dbase.collection('departments').find(whereStr).toArray(function(err,results){
            resp.render('admin/department_edit',{
                userInfo:req.userInfo,
                id:id,
                name:results[0].name,
            })
        })
    });

});
router.post('/department/edit', function (req,resp) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        //获取操作的Document数据库
        var dbase=db.db('registration');
        var id =req.body._id||'';
        var name=req.body.name||'';
        var whereStr={'_id':objectId(id)};
        var postDate={
            name:name,
        };
        var updateStr={$set:postDate};
        dbase.collection('departments').updateOne(whereStr,updateStr,true,function(err,results){
            resp.render('admin/success',{
                userInfo:req.userInfo,
                message:'修改分类信息成功',
                url:'/admin/department/Info'
            });
        });
    })});
//科室信息展示.
router.get('/department/Info',function(req,resp){
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        var dbase=db.db('registration');
        dbase.collection('departments')
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
                var departments=results.slice(startIndex,startIndex+limit);
                resp.render('admin/department_info',{
                    userInfo:req.userInfo,
                    departments:departments,
                    count:results.length,
                    page:page,
                    limit:limit,
                    totalPage:totalPage
                });
            });
    });

});

//医生信息添加
router.get('/doctor/add',function(req,resp){
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        var dbase=db.db('registration');
        dbase.collection('departments')
            .find().sort({'_id':-1}).toArray(function(err,departments){
                console.log(departments);
                dbase.collection('hospitals')
                    .find().sort({'_id':-1}).toArray(function(err,hospitals){
                        console.log(hospitals);
                        resp.render('admin/doctor_add',{
                            userInfo:req.userInfo,
                            departments:departments,
                            hospitals:hospitals
                        });
                    })
            });
    });
});
//医生信息添加
router.post('/doctor/add', function (req,resp) {
    var name=req.body.name||'';
    var gender=req.body.gender||'';
    var age=req.body.age||'';
    var did=req.body.department||'';
    var skill=req.body.skill||'';
    var hid=req.body.hospital||'';
    if(name==''){
        resp.render('admin/error',{
            userInfo:req.userInfo,
            message:'专家名不能为空',
            url:'/admin/doctor/add'
        });
        return;
    }
    if(gender==''){
        resp.render('admin/error',{
            userInfo:req.userInfo,
            message:'专家性别不能为空',
            url:'/admin/doctor/add'
        });
        return;
    }
    if(age==''){
        resp.render('admin/error',{
            userInfo:req.userInfo,
            message:'专家年龄不能为空',
            url:'/admin/doctor/add'
        });
        return;
    }
    if(skill==''){
        resp.render('admin/error',{
            userInfo:req.userInfo,
            message:'擅长技能不能为空',
            url:'/admin/doctor/add'
        });
        return;
    }
    MongoClient.connect(url,{ useNewUrlParser: true,useUnifiedTopology:true },
        function(err,db){
            var dbase = db.db('registration');
            var whereStr={'name':name};
            dbase.collection('doctors')
                .find(whereStr).toArray(function(err,results){
                    if(results.length>0){
                        resp.render('admin/error',{
                            userInfo:req.userInfo,
                            message:'该专家已经被添加了',
                            url:'/admin/doctor/add'
                        });
                    }
                    else{
                        //定义一个插入分类的json对象
                        var doctor = {
                            'name':name,
                            'age':age,
                            'gender':gender,
                            'did':objectId(did),
                            'skill':skill,
                            'hid':objectId(hid)
                        };
                        dbase.collection('doctors').insertOne(doctor,function(err,res){
                            resp.render('admin/success',{
                                userInfo:req.userInfo,
                                message:'添加专家成功',
                                url:'/admin/doctor/Info'
                            });
                        });
                    }
                });
        });
});
//医生信息删除
router.get('/doctor/delete',function(req,res){
    var id =req.query.id||'';
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        var dbase=db.db('registration');
        //给定删除条件
        var whereStr={'_id':objectId(id)};
        dbase.collection('doctors').deleteOne(whereStr,function(err,results){
            res.render('admin/success',{
                userInfo:req.userInfo,
                message:'删除成功',
                url:'/admin/doctor/Info'
            })
        });
    });
})
//医生信息修改
router.get('/doctor/edit',function(req,resp){
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        var dbase=db.db('registration');
        var id = req.query.id||'';
        dbase.collection('hospitals')
            .find().sort({'_id':-1}).toArray(function(err,hospitals){
                console.log(hospitals);
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
                    {$sort:{'_id':-1}},
                    {$match:{_id:objectId(id)}}
                ]).toArray(function(err,doctor){
                    console.log(doctor[0]);
                    dbase.collection('departments')
                        .find().sort({'_id':-1}).toArray(function(err,departments){
                            console.log(departments);
                            dbase.collection('hospitals')
                                .find().sort({'_id':-1}).toArray(function(err,hospitals){
                                    console.log(hospitals);
                                    resp.render('admin/doctor_edit',{
                                        userInfo:req.userInfo,
                                        doctor:doctor[0],
                                        departments:departments,
                                        hospitals:hospitals
                                    });
                                })
                        });
                });
            })
    })
});
router.post('/doctor/edit', function (req,resp) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        //获取操作的Document数据库
        var dbase=db.db('registration');
        var id =req.body._id||'';
        var name=req.body.name||'';
        var gender=req.body.gender||'';
        var age=req.body.age||'';
        var did=req.body.department||'';
        var skill=req.body.skill||'';
        var hid=req.body.hospital||'';
        var whereStr={'_id':objectId(id)};
        var postDate={
            name:name,
            gender:gender,
            age:age,
            did:objectId(did),
            skill:skill,
            hid:objectId(hid)
        }
        var updateStr={$set:postDate};
        dbase.collection('doctors').updateOne(whereStr,updateStr,true,function(err,results){
            resp.render('admin/success',{
                userInfo:req.userInfo,
                message:'修改专家信息成功',
                url:'/admin/doctor/Info'
            });
        });
    })});
//医生信息展示.
router.get('/doctor/Info',function(req,resp){
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
            resp.render('admin/doctor_info',{
                userInfo:req.userInfo,
                doctors:doctors,
                count:res.length,
                page:page,
                limit:limit,
                totalPage:totalPage
            });
        });
    });
});


//系统公告信息添加
router.get('/notice/add',function(req,resp){
    resp.render('admin/notice_add',{
        userInfo:req.userInfo
    });
});
//系统公告信息添加
router.post('/notice/add', function (req,resp) {
    var title=req.body.title||'';
    var content=req.body.content||'';
    var date=new Date();
    if(title==''){
        resp.render('admin/error',{
            userInfo:req.userInfo,
            message:'标题不能为空',
            url:'/admin/notice/add'
        });
        return;
    }
    if(content==''){
        resp.render('admin/error',{
            userInfo:req.userInfo,
            message:'内容不能为空',
            url:'/admin//add'
        });
        return;
    }
    MongoClient.connect(url,{ useNewUrlParser: true,useUnifiedTopology:true },
        function(err,db){
            var dbase = db.db('registration');
            var whereStr={'title':title};
            dbase.collection('notices')
                .find(whereStr).toArray(function(err,results){
                        var notice = {
                            'title':title,
                            'content':content,
                            'time':date .toLocaleString()
                        };
                        dbase.collection('notices').insertOne(notice,function(err,res){
                            resp.render('admin/success',{
                                userInfo:req.userInfo,
                                message:'添加公告成功',
                                url:'/admin/notice/Info'
                            });
                        });
                });
        });
});
//系统公告信息删除
router.get('/notice/delete',function(req,res){
    var id =req.query.id||'';
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        var dbase=db.db('registration');
        //给定删除条件
        var whereStr={'_id':objectId(id)};
        dbase.collection('notices').deleteOne(whereStr,function(err,results){
            res.render('admin/success',{
                userInfo:req.userInfo,
                message:'删除成功',
                url:'/admin/notice/Info'
            })
        });
    });
})
//系统公告信息修改
router.get('/notice/edit',function(req,resp){
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        var id = req.query.id||'';
        var dbase=db.db('registration');
        var whereStr={'_id':objectId(id)};
        dbase.collection('notices').find(whereStr).toArray(function(err,results){
            resp.render('admin/notice_edit',{
                userInfo:req.userInfo,
                id:id,
                title:results[0].title,
                content:results[0].content
            })
        })
    });

});
router.post('/notice/edit', function (req,resp) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        var dbase=db.db('registration');
        var id =req.body._id||'';
        var title=req.body.title||'';
        var content=req.body.content||'';
        var date=new Date();
        var whereStr={'_id':objectId(id)};
        var postDate={
            title:title,
            content:content,
            time:date .toLocaleString()
        }
        var updateStr={$set:postDate};
        dbase.collection('notices').updateOne(whereStr,updateStr,true,function(err,results){
            resp.render('admin/success',{
                userInfo:req.userInfo,
                message:'修改医院信息成功',
                url:'/admin/notice/Info'
            });
        });
    })});
//系统公告信息展示.
router.get('/notice/Info',function(req,resp){
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        var dbase=db.db('registration');
        dbase.collection('notices')
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
                var notices=results.slice(startIndex,startIndex+limit);
                resp.render('admin/notice_info',{
                    userInfo:req.userInfo,
                    notices:notices,
                    count:results.length,
                    page:page,
                    limit:limit,
                    totalPage:totalPage
                });
            });
    });
});

//退出登录
router.get('/logout',function(req,resp){
    resp.render('main/index',{
        userInfo:req.userInfo
    });
});
module.exports = router;