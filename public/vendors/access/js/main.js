$(document).ready(function(){
    $('#register-loader').hide();
    $('#login-loader').hide();
    (function ($) {
      $.fn.serializeFormJSON = function () {
  
          var o = {};
          var a = this.serializeArray();
          $.each(a, function () {
              if (o[this.name]) {
                  if (!o[this.name].push) {
                      o[this.name] = [o[this.name]];
                  }
                  o[this.name].push(this.value || '');
              } else {
                  o[this.name] = this.value || '';
              }
          });
          return o;
      };
  })(jQuery);

  /*Regular Expressions */
  var nameRegex = /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u;
  var emailRegex = /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
  var userNameRegex = /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/;
  var passRegex = /^([a-zA-Z0-9@*#]{8,15})$/;
  var authRegex = /^[a-zA-Z0-9]+$/;

  function validateLoginData(data){
    if(data.login_userName){
      if(data.login_userName.length < 1 || !userNameRegex.test(data.login_userName)){
        $('input[name="login_userName"]').after("<label class='error' for='login_userName' style='color:red !important;'>You have entered an invalid username format</label>");
        $('input[name="login_userName"]').css('border-color', 'red');
        return;
      }
    }

    if(data.login_pass.length < 1 || !passRegex.test(data.login_pass)){
      $('input[name="login_pass"]').after("<label class='error' for='login_pass' style='color:red !important;'>Wrong password format</label>");
      $('input[name="login_pass"]').css('border-color', 'red');
      return;
    }

    //Submit form
    $('#login-form').hide();
    $('#login-loader').show();

    $.post('/login', data).done(function(response){
      if(response.success){
        window.location = '/dashboard';
      }
      if(response.error){
        //Display error message
        $('#login-loader').hide();
        $('#login-form').show();
        $('#login-form').before("<label class='error' for='login-form' style='color:red !important;'>" + response.error + "</label>")
      }
   });
  }//End Login Validation

  function validateRegisterationData(data){
    if(data.firstName.length < 1 || !nameRegex.test(data.firstName)){
      $('input[name="firstName"]').after("<label class='error' for='firstName' style='color:red !important;'>Please enter a valid first name</label>");
      $('input[name="firstName"]').css('border-color', 'red');
      return;
    }
    if(data.lastName.length < 1 || !nameRegex.test(data.lastName)){
      $('input[name="lastName"]').after("<label class='error' for='lastName' style='color:red !important;'>Please enter a valid last name</label>");
      $('input[name="lastName"]').css('border-color', 'red');
      return;
    }
    if(data.emailAddress.length < 1 || !emailRegex.test(data.emailAddress)){
      $('input[name="emailAddress"]').after("<label class='error' for='emailAddress' style='color:red !important;'>Please enter a valid email address</label>");
      $('input[name="emailAddress"]').css('border-color', 'red');
      return;
    }
    if(data.userName.length < 1 || !userNameRegex.test(data.userName)){
      $('input[name="userName"]').after("<label class='error' for='userName' style='color:red !important;'>Your username must be alphanumeric and must not contain special characters</label>");
      $('input[name="userName"]').css('border-color', 'red');
      return;
    }
    if(data.pass.length < 1 || !passRegex.test(data.pass)){
      $('input[name="pass"]').after("<label class='error' for='pass' style='color:red !important;'>Password must be at least 8 characters long</label>");
      $('input[name="pass"]').css('border-color', 'red');
      $('input[name="re_pass"]').css('border-color', 'red');
      return;
    }
    if(data.pass != data.re_pass){
      $('input[name="pass"]').after("<label class='error' for='pass' style='color:red !important;'>Passwords do not match</label>");
      $('input[name="pass"]').css('border-color', 'red');
      $('input[name="re_pass"]').after("<label class='error' for='re_pass' style='color:red !important;'>Passwords do not match</label>");
      $('input[name="re_pass"]').css('border-color', 'red');
      return;
    }
    if(data.authKey.length < 1 || !authRegex.test(data.authKey)){
      $('input[name="authKey"]').after("<label class='error' for='authKey' style='color:red !important;'>The Authorization Code can only contain numbers and letters</label>");
      $('input[name="authKey"]').css('border-color', 'red');
      return;
    }

    //Submit form
    $('#register-form').hide();
    $('#register-loader').show();

    $.post('/join', data).done(function(response){
       if(response.success){
        $('#register-loader').hide();
         window.location = '/dashboard';
       }
       if(response.error){
         //Display error message
         $('#register-loader').hide();
         $('#register-form').show();
         $('#register-form').before("<label class='error' for='register-form' style='color:red !important;'>" + response.error + "</label>")
       }
    });
  }//END Registeration Validation
  
    $('#register-form').submit(function (e) {
        e.preventDefault();
        $('.error').remove();
        $('input').each(function(){
          if(($(this).next().length == 0)){
            $(this).css('border-color', '#CCD0D7');
          }
        });
        var data = $(this).serializeFormJSON();
        validateRegisterationData(data);
    });

    $('#login-form').submit(function (e) {
      e.preventDefault();
      $('.error').remove();
      $('input').each(function(){
        if(($(this).next().length == 0)){
          $(this).css('border-color', '#CCD0D7');
        }
      });
      var data = $(this).serializeFormJSON();
      if(!data.login_userName){
        data.login_userName = $('input[name="login_userName"]').val();
      }
      validateLoginData(data);
  });
});