$(function(){
    // 注册
    $('#registerForm .registerBtn').click(function(){
        $.ajax({
            url: '/api/user/infoManage',
            type: 'post',
            data: $('#registerForm').serialize(),
            dataType: 'json',
            success: function(res){
                console.log(res);
                $('#registerForm .tips').html(res.message);
            }
        });
    });

});
