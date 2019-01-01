
/*AutoTrust Winnipeg Inventory Management System event controller script*/
//Script to handle core events that may not be a part of servicing, inventory or, price checker

/*Regular Expressions */
window.nameRegex = /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u;
window.emailRegex = /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
window.userNameRegex = /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/;
window.passRegex = /^([a-zA-Z0-9@*#]{8,15})$/;
window.authRegex = /^[a-zA-Z0-9]+$/;
window.alphanumRegex2 = /^[a-zA-Z0-9\s.\-_+/\r\n]+$/;
window.alphanumRegex = /^[a-zA-Z0-9\s.]+$/;
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

function handleScannedVinForPriceCheck(){
    var vinNumber = $('#pricecheck-scanner-input').val();

    $('#pricecheck-info').hide();
    $('#pricecheck-loader').removeClass('d-none');
    $('#pricecheck-waitText').removeClass('d-none');
    $('#pricecheck-result-card').addClass('d-none');
    

    $.post('/pricechecker/vin', {vinNumber: vinNumber}).done(function(response){
        if(response.error){
            $('#manual-pricecheck-error').text(response.error).removeClass('d-none');
            return;
        }
        if(response.price){
            let data = response.data;
            $('#pricecheck-car-title').text(data.year + ' ' + data.make + ' ' + data.model);
            if(response.price < 10000){
                var price = '$' + response.price.toString().substring(0, 1) + ',' + response.price.toString().substring(1, response.price.length);
                $('#pricecheck-price').text(price);
            }else{
                var price = '$' + response.price.toString().substring(0, 2) + ',' + response.price.toString().substring(2, response.price.length);
                $('#pricecheck-price').text(price);
            }
            var checked_url = 'https://www.kijiji.ca/b-cars-vehicles/winnipeg/' + data.year + '-' + data.make + '-' + data.model + '/k0c27l1700192?sort=priceAsc';
            $('#pricecheck-link').attr('href', checked_url);
            $('#pricecheck-result-card').removeClass('d-none');
            $('#pricecheck-loader').addClass('d-none');
            $('#pricecheck-waitText').addClass('d-none');
            $('#pricecheck-info').show();
            return;
        }
        $('#manual-pricecheck-error').text('An unexpected error occured. Try again or contact support.').removeClass('d-none');
        return;
        //Something weird happened
    });
    //call server to return price
    return;
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
    });


    $('#staffSearchGo').click(function(e){
        e.preventDefault();
        $('#search-staff-error').addClass('d-none')
        var searchTerm = $('#staff-search-input').val();

        if(!alphanumRegex2.test(searchTerm)){
            $('#search-staff-error').removeClass('d-none').text('The search term you entered is in an invalid format');
            return;
        }

        $.post('/staff/search', {searchTerm: searchTerm}).done(function(res){
            if(res.error){
                $('#search-staff-error').removeClass('d-none').text(res.error);
                return;
            }
            if(res.success){
                window.location = '/profile/@/' + searchTerm;
                return;
            }

            //Something went wrong
            $('#search-staff-error').removeClass('d-none').text('An unexpected error occured. Please try searching again or contact support');
            return;
        });
    });

    $('#inventorySearchGo').click(function(e){
        e.preventDefault();
        $('#search-inventory-error').addClass('d-none')
        var searchTerm = $('#search-inventory-input').val();

        if(!Number(searchTerm)){
            $('#search-inventory-error').removeClass('d-none').text('The search term you entered is in an invalid format');
            return;
        }

        $.post('/inventory/search', {searchTerm: searchTerm}).done(function(res){
            if(res.error){
                $('#search-inventory-error').removeClass('d-none').text(res.error);
                return;
            }
            if(res.success){
                window.location = '/vehicle/?stockNo=' + searchTerm;
                return;
            }

            //Something went wrong
            $('#search-inventory-error').removeClass('d-none').text('An unexpected error occured. Please try searching again or contact support');
            return;
        });
    });

    $('#priceCheckerSubmit').click(function(e){
        e.preventDefault();
        var data = $('#priceCheckerManualForm').serializeFormJSON();
        $('.error').remove();
        $('#manual-pricecheck-error').addClass('d-none');
        $('#pricecheck-result-card').addClass('d-none');
        $('#pricecheck-loader').addClass('d-none');
        $('#pricecheck-waitText').addClass('d-none');

        let invalid = false;
        if(!alphanumRegex.test(data.make)){
            invalid = true;
            $('input[name="make"]').after("<label class='error' for='make' style='color:red !important;'>Please enter a valid vehicle make</label>");
            $('input[name="make"]').css('border-color', 'red');
        }
        if(!alphanumRegex.test(data.model)){
            invalid = true;
            $('input[name="model"]').after("<label class='error' for='model' style='color:red !important;'>Please enter a valid vehicle model</label>");
            $('input[name="model"]').css('border-color', 'red');
        }
        if(!Number(data.year) || data.year.length < 4 || data.year.length > 4){
            invalid = true;
            $('input[name="year"]').after("<label class='error' for='year' style='color:red !important;'>Enter a valid year (e.g 2004)</label>");
            $('input[name="year"]').css('border-color', 'red');
        }

        $('input').each(function(){
            if(($(this).next().length == 0)){
              $(this).css('border-color', '#CCD0D7');
            }
          });

        if(invalid){
            return;
        }

          //Data is valid send to server
          //show loader and hide everything else
          $('#pricecheck-info').hide();
          $('#pricecheck-loader').removeClass('d-none');
          $('#pricecheck-waitText').removeClass('d-none');
          var checked_url = 'https://www.kijiji.ca/b-cars-vehicles/winnipeg/' + data.year + '-' + data.make + '-' + data.model + '/k0c27l1700192?sort=priceAsc';
          $.post('/pricechecker/getprice', data).done(function(response){
            if(response.error){
                $('#manual-pricecheck-error').text(response.error).removeClass('d-none');
                return;
            }
            if(response.price){
                $('#pricecheck-car-title').text(data.year + ' ' + data.make + ' ' + data.model);
                if(response.price < 10000){
                    var price = '$' + response.price.toString().substring(0, 1) + ',' + response.price.toString().substring(1, response.price.length);
                    $('#pricecheck-price').text(price);
                }else{
                    var price = '$' + response.price.toString().substring(0, 2) + ',' + response.price.toString().substring(2, response.price.length);
                    $('#pricecheck-price').text(price);
                }
                $('#pricecheck-link').attr('href', checked_url);
                $('#pricecheck-result-card').removeClass('d-none');
                $('#pricecheck-loader').addClass('d-none');
                $('#pricecheck-waitText').addClass('d-none');
                $('#pricecheck-info').show();
            }
            //Something weird happened
            $('#manual-pricecheck-error').text('An unexpected error occured. Try again or contact support.').removeClass('d-none');
            return;
          });
        return;
    });
    
});