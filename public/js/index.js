$(function(){
    // 登录
    $('#loginForm .loginbtn').click(function(){
        $.ajax({
            url: '/api/user/login',
            type: 'post',
            data: $('#loginForm').serialize(),
            dataType: 'json',
            success: function(res){
                console.log(res);
                $('#loginForm .tips').html(res.message);
                // 登录成功
                if (res.code == 0) {
                    setTimeout(function(){
                        window.location.reload();
                    },1000);
                }
            }
        });
    });

    // 退出
    $('#logout').click(function(){
        $.ajax({
            url: '/api/user/logout',
            dataType: 'json',
            success: function(res){
                // 退出成功，刷新页面
                if (res.code == 0) {
                    window.location.reload();
                }
            }
        });
    });
});
