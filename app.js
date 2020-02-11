//加载express模块
var express=require('express');
//加载body-parser模块，用来解析post方式传递的数据
var bodyParser=require('body-parser');
//加载模板引擎模块
var swig=require('swig');
//加载cookies模块
var Cookies=require('cookies');
//加载mongodb模块
var mongodb=require('mongodb');
//获取mongodb的客户端对象
var MongoClient = mongodb.MongoClient;
//获取mongodb中主键的类型
var objectId=mongodb.ObjectId;
//创建一个express对象
var app=express();
//创建一个application/x-www-form-encoded编码
var urlencoded=bodyParser.urlencoded({extended:true});
//用创建好的application/x-www-form-encoded编码
app.use(urlencoded);
//设置静态文件的目录，如css，js，images，etc
app.use('/public',express.static(__dirname+'/public'));
//配置当前应用使用的模板引擎
//第一个参数：模板引擎的名称，也是需要渲染的文件的后罪名
//第二个参数：渲染解析文件的技术
app.engine('html',swig.renderFile);
//配置需要使用模板引擎渲染的文件的目录
//第一个参数：views，固定不变
//第二个参数：需要使用模板引擎渲染的文件的目录
app.set('views','./views');
//注册之前配置的模板引擎，好让应用真正使用该模板引擎
//第一个参数：view engine 固定不变
//第二个参数：模板引擎的名称，跟app.engine第一个参数一致
app.set('view engine','html');
//关闭swig渲染缓存，默认是开启的
swig.setDefaults({cache:false});
//访问cookie，查看是否已经登录
//模块化开发
//这一步要放在加载首页前面，先设置一个cookie来存放登录信息
app.use(function(req,resp,next){
 //产生一个cookie对象
 req.cookies=new Cookies(req,resp);
 //获取cookie中用户的登录信息
 var userInfoStr=req.cookies.get('userInfo');
 console.log('用户登录信息'+userInfoStr);
 //将用户信息存储到req中以便每个请求都能传递用户登录信息
 req.userInfo={};
 if(userInfoStr){
  //用户已登录
  //将从cookie中获取的用户信息转化为json对象并存储到req中
  req.userInfo=JSON.parse(userInfoStr);
  //从数据库中查找是否为管理员身份
  var url='mongodb://localhost:27017';
  //连接数据库
  MongoClient.connect(url,{useNewUrlParser: true,userUnifiedTopology:true},function(err,db){
   //获取需要先操作的数据库
   var dbase=db.db('registration');
   //查询条件根据id查询
   var whereStr={'_id':objectId(req.userInfo._id)};
   //从blog_users表中根据whereStr查询数据
   dbase.collection('r_users').find(whereStr)
       .toArray(function(err,results){
        if(err){
         console.log(err);
         next();
        }else{
         //将查询到的用户的isadmin字段存储到req的用户信息中
         req.userInfo.isAdmin=Boolean(results[0].isAdmin);
         next();
        }
       });
  });
 }
 //执行下一个操作免得卡死
 else{next();}
});
/**
 * 前台首页模块：
信息展示：系统首页医院信息；
*/
app.use('/',require('./routers/main.js'));
/**
 * 前台其他功能模块：
 （1）信息查询：根据医院对专家进行条件查询，根据科室对专家进行条件查询等；
 （2）信息展示：展示公告信息，用户预约详情信息展示；
（3）系统使用：完成登录注册注册信息修改功能；
（4）用户：登录，查询、预约挂号，取消挂号等。）
 */
app.use('/api',require('./routers/api.js'));
/**
 * 后台功能模块：
 （1）系统公告的管理：管理员对医院公告进行添加、修改和删除操作；
 （2）专家信息管理：管理员对专家信息进行添加、修改和删除操作；
 （3）注册用户管理：管理员对用户的个人信息进行查询管理；
 （4）科室信息管理：管理员科室信息进行添加、修改和删除操作；
 （5）医院信息管理：管理员对医院的信息进行添加、修改和删除操作。
 */
app.use('/admin',require('./routers/admin.js'));
//监听8081端口
app.listen(8081,function(){
    console.log('挂号系统已启动');
});
