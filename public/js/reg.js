$(function(){
    // 注册
    $('#regForm .registerBtn').click(function(){
        $.ajax({
            url: '/api/user/reg',
            type: 'post',
            data: $('#regForm').serialize(),
            dataType: 'json',
            success: function(res){
                console.log(res);
                $('#regForm .tips').html(res.message);
            }
        });
    });

});
