
/*AutoTrust Winnipeg Inventory Management System event controller script*/
//Script to handle core events that may not be a part of servicing, inventory or, price checker

/*Regular Expressions */
window.nameRegex = /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u;
window.emailRegex = /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
window.userNameRegex = /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/;
window.passRegex = /^([a-zA-Z0-9@*#]{8,15})$/;
window.authRegex = /^[a-zA-Z0-9]+$/;
window.alphanumRegex2 = /^[a-zA-Z0-9\s.\-_+/\r\n]+$/;
window.phoneNumberRegex = /^(\(?\+?[0-9]*\)?)?[0-9_\- \(\)]*$/;

window.profilePic = {};

function handleProfilePhotos(files){
    profilePic = {};
    var profilePicReader = new FileReader();
    var file = files[0];
    var mb = 1000000;

    if(file.size/mb >= 1){
        $('#update-profile-error').removeClass('d-none').text('Selected file is too large. Must be 1 MB or less.');
        return;
    }

    profilePic.name = file.name;
    profilePic.size = file.size;
    profilePic.type = file.type;

    profilePicReader.onload = function(e){
        var bin = e.target.result;
        profilePic.data = bin;
        $('#profile-photo').attr('src', bin);
    }

    profilePicReader.readAsDataURL(file);
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}



$(document).ready(function(){
    //Custom Jquery Method
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

    //Set up carousel 
    $(".owl-carousel").owlCarousel({

        nav: true,
        rewind: true,
        navText: ["<i class='fa fa-chevron-left' style='margin-left: 325px !important;'></i>","<i class='fa fa-chevron-right'></i>"]
        });

    $('.vehicle-image').click(function(e){
        e.preventDefault();
        var target = $(e.target);
        $('#vehicle-featured-image-href').attr('href', target[0].currentSrc);
        $('#vehicle-featured-image-img').attr('src', target[0].currentSrc);
    });
    //Updating User Profile Data
    $('#update-profile-submit').click(function(e){
        $('#update-profile-error').addClass('d-none');
        $('#update-profile-error').text('Some info you entered is invalid. Only numbers and alphabets are allowed.');
        e.preventDefault();
        var isValid = true;
        var emailRegex = /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
        $('input', $('#edit-personal-info')).each(function(index){
            $(this).css('background', '#fff');
            if(!alphanumRegex2.test($(this).val()) && !emailRegex.test($(this).val())){
                isValid = false;
                 $(this).css('background', '#b7b5b5'); 
            }
        });

        var pass = $('input[name="pass"]').val();
        var re_pass = $('input[name="re_pass"]').val();
        
        if(!isValid){
            $('#update-profile-error').removeClass('d-none');
            return;
        }

        if(pass !== re_pass){
            $('#update-profile-error').removeClass('d-none').text('Your passwords do not match.');
            return;
        }

        //send details to server
        var data = $('#update-profile').serializeFormJSON();
        data.profilePic = profilePic;

        $.post('/profile/update', data).done(function(response){
            if(response.error){
                $('#update-profile-error').removeClass('d-none').text(response.error);
                return;
            }
            if(response.success){
                $('#update-profile-success').removeClass('d-none');
                return;
            }else{
                $('#update-profile-error').removeClass('d-none').text('Unable to update your profile at this time. Try again later.');
                return;
            }
        });
    });

    $('#reset-update-profile').click(function(e){
        e.preventDefault();
        $('#update-profile')[0].reset();
        var imgSrc = $('#profile-photo').attr('src');
        if(aboutUser){
            document.getElementById('about').value = aboutUser;
        }
        $('#profile-photo').attr('src', imgSrc);
    }); 


    $('#testdriveModal').on('shown.bs.modal', function (event) {
        $('#testDriveError').addClass('d-none');
    });
    $('#checkinModal').on('shown.bs.modal', function (event) {
        $('#checkinInfo').addClass('d-none');
    });
    $('#soldModal').on('shown.bs.modal', function (event) {
        $('#soldInfo').addClass('d-none');
    });
    $('#deleteModal').on('shown.bs.modal', function (event) {
        $('#deleteInfo').addClass('d-none');
    });
    //handle testdrive
    $('#testDriveSubmitButton').click(function(e){
        e.preventDefault();
        $('#testDriveLoading').removeClass('d-none');
        $('#testDriveError').addClass('d-none').text('Some of the information provided is invalid.');
        var testDriveName = $('input[name="testDriveName"').val();
        var testDriveEmail = $('input[name="testDriveEmail"').val();
        var testDriveAddressLine1 = $('input[name="testDriveAddressLine1"').val();
        var testDriveCity = $('input[name="testDriveAddressCity"').val();
        var testDrivePhone = $('input[name="testDrivePhone"').val();
        var preferredContact = 'phone';

        if($('input[name="preferredContactEmail"').is(':checked')){
            preferredContact = 'email';
        }

        if(!nameRegex.test(testDriveName) || !emailRegex.test(testDriveEmail) || !alphanumRegex2.test(testDriveCity) || !alphanumRegex2.test(testDriveAddressLine1) || !phoneNumberRegex.test(testDrivePhone)){
            //Show error
            $('#testDriveLoading').addClass('d-none');
            $('#testDriveError').removeClass('d-none');
            return;
        }

        let testDriveData = {};
        testDriveData.name = testDriveName;
        testDriveData.email = testDriveEmail;
        testDriveData.addressLine1 = testDriveAddressLine1;
        testDriveData.city = testDriveCity;
        testDriveData.phone = testDrivePhone;
        testDriveData.preferredContact = preferredContact;

        //Send Info To server
        var testDriveStockNo = getParameterByName('stockNo');

        if(!testDriveStockNo){
            $('#testDriveLoading').addClass('d-none');
            $('#testDriveError').removeClass('d-none').text('Could not identify the vehicle selected for test drive. Please reload the window');
            return;
        }
        $.post('/vehicle/testdrive/?stockNo=' + testDriveStockNo, testDriveData).done(function(res){
            if(res.success){
                $('#testDriveLoading').addClass('d-none');
                $('#testDriveSuccess').removeClass('d-none').text('Test drive arranged. It is safe to close this pop up.');
                return;
            }
            if(res.error){
                $('#testDriveLoading').addClass('d-none');
                $('#testDriveError').removeClass('d-none').text(response.error);
                return;
            }
            $('#testDriveLoading').addClass('d-none');
            $('#testDriveError').removeClass('d-none').text('Something unexpected occured. Please try again or contact support');
            return;
        });
    });

    $('#checkInConfirmation').click(function(e){
        e.preventDefault();
        $('#checkinInfo').removeClass('d-none');
        var checkInStockNo = getParameterByName('stockNo');
        $.post('/vehicle/checkin/?stockNo=' + checkInStockNo,{stockNo: checkInStockNo}).done(function(res){
            if(res.success){
                $('#checkinInfo').removeClass('alert-info').addClass('alert-success').text('Vehicle checked in.');
                setTimeout(function(){
                    $('#checkInClose').click();
                }, 5000);
                window.location.reload(true);
                return;
            }
            if(res.error){
                $('#checkinInfo').removeClass('alert-info').addClass('alert-danger').text(res.err);
                setTimeout(function(){
                    $('#checkInClose').click();
                }, 5000);
                return;
            }

            $('#checkinInfo').removeClass('alert-info').addClass('alert-danger').text('Something unexpected occured. Try again later.');
            return;

        });
    });

    $('#soldConfirmation').click(function(e){
        e.preventDefault();
        $('#soldInfo').removeClass('d-none');
        var soldStockNo = getParameterByName('stockNo');
        $.post('/vehicle/sell/?stockNo=' + soldStockNo,{stockNo: soldStockNo}).done(function(res){
            if(res.success){
                $('#soldInfo').removeClass('alert-info').addClass('alert-success').text('Vehicle marked as sold.');
                setTimeout(function(){
                    $('#soldClose').click();
                }, 5000);
                window.location.reload(true);
                return;
            }
            if(res.error){
                $('#soldInfo').removeClass('alert-info').addClass('alert-danger').text(res.error);
                setTimeout(function(){
                    $('#soldClose').click();
                }, 5000);
                return;
            }

            $('#soldInfo').removeClass('alert-info').addClass('alert-danger').text('Something unexpected occured. Try again later.');
            return;

        });
    });

    var confirmationText = '';
    $('#deleteConfirmText').keyup(function(){
        confirmationText = $(this).val();
        if(confirmationText.toUpperCase() === 'DELETE'){
            $('#deleteConfirmation').prop('disabled', false);
            $('#deleteConfirmText').css('border-color', '#d8d6d6');
        }else{
            $('#deleteConfirmation').prop('disabled', true); 
            $('#deleteConfirmText').css('border-color', 'red');
        }
    }).keypress(function(e) {
        return String.fromCharCode(e.which);
    });


    $('#deleteConfirmation').click(function(e){
        e.preventDefault();
        $('#deleteInfo').removeClass('d-none');
        var deleteStockNo = getParameterByName('stockNo');
        $.post('/vehicle/delete/?stockNo=' + deleteStockNo,{stockNo: deleteStockNo}).done(function(res){
            if(res.success){
                $('#deleteInfo').removeClass('alert-info').addClass('alert-success').text('Vehicle deleted.');
                setTimeout(function(){
                    $('#deleteClose').click();
                }, 5000);
                window.location = '/dashboard';
                return;
            }
            if(res.error){
                $('#deleteInfo').removeClass('alert-info').addClass('alert-danger').text(res.error);
                setTimeout(function(){
                    $('#deleteClose').click();
                }, 5000);
                return;
            }

            $('#deleteInfo').removeClass('alert-info').addClass('alert-danger').text('Something unexpected occured. Try again later.');
            return;
        });
    });

    $('#editVehicleButton').click(function(e){
        e.preventDefault();
        var editStockNo = getParameterByName('stockNo');

        window.location = '/vehicle/edit/?stockNo=' + editStockNo;
        /*$.post('/vehicle/edit/?stockNo=' + editStockNo, {stockNo: editStockNo}).done(function(res){
            
        })*/
    });

    var pricecheckVin = '';
    $('#pricecheck_scanner_input').keyup(function(){
        pricecheckVin = $(this).val();
        if(pricecheckVin != ''){
            $('#pricecheck-scanner-button').text('ENTER');
            $('#pricecheck-scanner-button').removeAttr('data-toggle data-target');
            $('#pricecheck-scanner-button').addClass('pricecheck-manual');
        }else{
            $('#pricecheck-scanner-button').html('START SCANNER <i class="fa fa-barcode"></i>');
            $('#pricecheck-scanner-button').attr('data-toggle', 'modal');
            $('#pricecheck-scanner-button').attr('data-target', '#livestream_scanner');
            $('#pricecheck-scanner-button').removeClass('pricecheck-manual');
        }
    });

    $(document).on('click', '.pricecheck-manual', function(e){
        e.preventDefault();
    })


    
});