  //GLOBALS
  window.totalVehicleFiles = [];
  window.warnUserAboutPhotos = false;
  window.holdVehicle = false;
  window.isValid = true;
  window.alphanumRegex = /^[a-zA-Z0-9\s.\-_+/]+$/;

function handlePhotos(files){ 
    totalVehicleFiles = [];
    var reader = new FileReader();
    readFile(0, files, reader, {});
}

function readFile(index, files, reader, fileAttributes){
    if(index >= files.length) {
        return;   
    }

    var file = files[index];
    fileAttributes.name = file.name;
    fileAttributes.size = file.size;
    fileAttributes.type = file.type;
    reader.onload = function(e){
        var bin = e.target.result;
        fileAttributes.data = bin;
        totalVehicleFiles.push(fileAttributes);
        readFile(++index, files, new FileReader(), {});
    }
    reader.readAsDataURL(file);
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

    /*VIN Autofill handler*/
    $('#manual-vin-autofill').click(function(e){
        e.preventDefault();
        $('#manual-vin-autofill').prop('disabled', true);
        var vinNumber = $('#manual-vin-number').val();

        if(window.currentVinNumber === vinNumber){
            $('#manual-vin-div').before("<label class='error' id='vin-autofill-error' for='manual-vin-div' style='color:red;'>Vin Number already autofilled. Try a different VIN</label>");
                setTimeout(function(){
                    $('#vin-autofill-error').remove();
                    $('#manual-vin-autofill').prop('disabled', false);
                },3000);
                return;     
        }

        var vinNumberRegex = /^(([a-h,A-H,j-n,J-N,p-z,P-Z,0-9]{9})([a-h,A-H,j-n,J-N,p,P,r-t,R-T,v-z,V-Z,0-9])([a-h,A-H,j-n,J-N,p-z,P-Z,0-9])(\d{6}))$/;
        var vinNumberRegex2 = /^([A-Z\d]{3})[A-Z]{2}\d{2}([A-Z\d]{1})([X\d]{1})([A-Z\d]{3})\d{5}$/;
        var vinNumberRegex3 = /^[^iIoOqQ'-]{10,17}$/;

        if(!vinNumberRegex.test(vinNumber) && !vinNumberRegex2.test(vinNumber) && !vinNumberRegex3.test(vinNumber)){
            //Wrong VIN format - Display ERROR
            $('#manual-vin-div').before("<label class='error' id='vin-autofill-error' for='manual-vin-div' style='color:red;'>Invalid VIN format</label>");
            setTimeout(function(){
                $('#vin-autofill-error').remove();
                $('#manual-vin-autofill').prop('disabled', false);
            },2000);
            return;
        }
        $.post('/inventory/vin/decoder/', {vinNumber: vinNumber}).done(function(data){
            if(data.error){
                $('#manual-vin-div').before("<label class='error' id='vin-autofill-error' for='manual-vin-div' style='color:red;'>" + data.error + "</label>");
                setTimeout(function(){
                    $('#vin-autofill-error').remove();
                    $('#manual-vin-autofill').prop('disabled', false);
                },2000);
                return;
            }
            if(data.data && data.data.year){
                var vehicle = data.data;
                //Fill in Vehicle Year
                if(vehicle.year !== null){
                    $('select[name="Vehicle Year"]').find(":selected").removeAttr('selected');
                    $('select[name="Vehicle Year"]').find('option[value="' + vehicle.year + '"]').attr("selected",true);
                    $('select[name="Vehicle Year"]').addClass('autofill-value');
                    $('select[name="Vehicle Year"]').css('background', '#b7b5b5');
                }   
                //Fill in Vehicle Seats
                if(vehicle.seats !== null){
                    $('select[name="Seats"]').find(":selected").removeAttr('selected');
                    $('select[name="Seats"]').find('option[value="' + vehicle.seats + '"]').attr("selected",true);
                    $('select[name="Seats"]').addClass('autofill-value');
                    $('select[name="Seats"]').css('background', '#b7b5b5');
                }
                //Fill in Vehicle Make
                if(vehicle.make !== null){
                    $('input[name="Make"]').val(vehicle.make);
                    $('input[name="Make"]').addClass('autofill-value');
                    $('input[name="Make"]').css('background', '#b7b5b5');
                }
                //Fill in Vehicle Make
                if(vehicle.model !== null){
                    $('input[name="Model"]').val(vehicle.model);
                    $('input[name="Model"]').addClass('autofill-value');
                    $('input[name="Model"]').css('background', '#b7b5b5');
                }
                //Fill in Vehicle Body Type
                if(vehicle.bodyType !== null){
                    $('select[name="Body Style"]').find(":selected").removeAttr('selected');
                    $('select[name="Body Style"]').find('option[value="' + vehicle.bodyType + '"]').attr("selected",true);
                    $('select[name="Body Style"]').addClass('autofill-value');
                    $('select[name="Body Style"]').css('background', '#b7b5b5');
                }
                //Fill in Vehicle Gears
                if(vehicle.numberOfGears !== null){
                    $('select[name="Gears"]').find(":selected").removeAttr('selected');
                    $('select[name="Gears"]').find('option[value="' + vehicle.numberOfGears + '"]').attr("selected",true);
                    $('select[name="Gears"]').addClass('autofill-value');
                    $('select[name="Gears"]').css('background', '#b7b5b5');
                }
                //Fill in Vehicle Doors
                if(vehicle.numberOfDoors !== null){
                    $('select[name="Doors"').find(":selected").removeAttr('selected');
                    $('select[name="Doors"]').find('option[value="' + vehicle.numberOfDoors + '"]').attr("selected",true);
                    $('select[name="Doors"]').addClass('autofill-value');
                    $('select[name="Doors"]').css('background', '#b7b5b5');
                }
                //Fill in Vehicle Cylinders
                if(vehicle.numberOfCylinders !== null){
                    $('select[name="Cylinders"').find(":selected").removeAttr('selected');
                    $('select[name="Cylinders"]').find('option[value="' + vehicle.numberOfCylinders + '"]').attr("selected",true);
                    $('select[name="Cylinders"]').addClass('autofill-value');
                    $('select[name="Cylinders"]').css('background', '#b7b5b5');
                }
                //Fill in Vehicle Drive Type
                if(vehicle.driveType !== null){
                    $('select[name="Drive Type"').find(":selected").removeAttr('selected');
                    $('select[name="Drive Type"]').find('option[value="' + vehicle.driveType + '"]').attr("selected",true);
                    $('select[name="Drive Type"]').addClass('autofill-value');
                    $('select[name="Drive Type"]').css('background', '#b7b5b5');
                }

                if(vehicle.trim !== null){
                    $('input[name="Trim"]').val(vehicle.trim);
                    $('input[name="Trim"]').addClass('autofill-value');
                    $('input[name="Trim"]').css('background', '#b7b5b5');
                }
                //Fill in Vehicle Transmission Type
                if(vehicle.transmissionType !== null){
                    $('select[name="Transmission"').find(":selected").removeAttr('selected');
                    $('select[name="Transmission"]').find('option[value="' + vehicle.transmissionType + '"]').attr("selected",true);
                    $('select[name="Transmission"]').addClass('autofill-value');
                    $('select[name="Transmission"]').css('background', '#b7b5b5');
                }
                //Fill in Vehicle Engine Type
                if(vehicle.engineType !== null){
                    $('select[name="Engine Type"').find(":selected").removeAttr('selected');
                    $('select[name="Engine Type"]').find('option[value="' + vehicle.engineType + '"]').attr("selected",true);
                    $('select[name="Engine Type"]').addClass('autofill-value');
                    $('select[name="Engine Type"]').css('background', '#b7b5b5');
                }
                //Fill in Vehicle Gears
                if(vehicle.fuelType !== null){
                    $('select[name="Fuel Type"').find(":selected").removeAttr('selected');
                    $('select[name="Fuel Type"]').find('option[value="' + vehicle.fuelType + '"]').attr("selected",true);
                    $('select[name="Fuel Type"]').addClass('autofill-value');
                    $('select[name="Fuel Type"]').css('background', '#b7b5b5');
                }

                window.currentVinNumber = vinNumber;

                setTimeout(function(){
                    if($('.autofill-value').length !== 0){
                        $('.autofill-value').each(function(index){
                                $(this).css('background', '#fff');
                          });
                    }
                    $('#manual-vin-autofill').prop('disabled', false);
                }, 3000);
            }else{
                $('#manual-vin-div').before("<label class='error' id='vin-autofill-error' for='manual-vin-div' style='color:red;'>Service unavailable. Try again Later</label>");
                setTimeout(function(){
                    $('#vin-autofill-error').remove();
                    $('#manual-vin-autofill').prop('disabled', false);
                },2000);
                return;   
            }
        });
    });
    /*End VIN Autofill handler*/

    /*Save & Contiue Handler*/
    $('.save-continue').click(function(e){
        e.preventDefault();
        $('.inventory-submit-error').addClass('d-none');
        var currentTab = $('ul.listing-form-steps').find('li.active');
        var href = $('ul.listing-form-steps').find('li.active').data('target');
        var id = href.substring(1, href.length);
        isValid = true;
        //validate inputs/selected options
        //Check that all inputs have value
       $('input', $(href)).each(function(index){
           $(this).css('background', '#fff');
           if(href === '#listing-add-form-one' && (index===0 || index===1)){
            ;
           }else if($(this).attr('required') && ($(this).val() === '' || $(this).val() === undefined || $(this).val()===null || !alphanumRegex.test($(this).val()))){
                isValid = false;
                $(this).css('background', '#b7b5b5'); 
           }
       });

       //Check that all options have selections
       $('select', $(href)).each(function(){
        $(this).css('background', '#fff');
           if(($(this).attr('required') && $(this).val().toUpperCase() === 'SELECT') || !alphanumRegex.test($(this).val())){
                isValid = false;
                $(this).css('background', '#b7b5b5');
           }
    });

        //All required fields must be field out
        if(!isValid){
            $('p#' + id + '-error').removeClass('d-none');
            setTimeout(function(){
              $('input', $(href).each(function(){
                $(this).css('background', '#fff');
              })); 
              $('select', $(href).each(function(){
                $(this).css('background', '#fff');
              })); 
            }, 3000);
            return;
        }
        $('ul.listing-form-steps').find('li.active').removeClass('active')
        currentTab.next().addClass('active').click();   
    });

    //Display Car Registeration Form Details if Registered
    $('input[name="RegisteredYes"]').click(function(){
        $('input[name="RegisteredNo"]').prop('checked', false);
        $('#vehicle-registration-details').removeClass('d-none');
    });
    //Else Do not display
    $('input[name="RegisteredNo"]').click(function(){
        $('input[name="RegisteredYes"]').prop('checked', false);
        $('#vehicle-registration-details').addClass('d-none');
    });

    //Fill in AutoTrust Winnipeg Address if the vehicle is currently
    //located at Autotrust, otherwise clear input fields
    $('input[name="vehicle-location-input-no"]').click(function(){
        $('input[name="vehicle-location-input-yes"]').prop('checked', false);
        //Clean Input Fields
        $('input[name="address_line_1"]').val('');
        $('input[name="address_city"]').val('');
        $('input[name="address_postal"]').val('');
        $('select[name="State"]').find('option[value="Select"]').attr("selected",true);
        $('select[name="Country"]').find('option[value="Select"]').attr("selected",true);
    });

    $('input[name="vehicle-location-input-yes"]').click(function(){
        $('input[name="vehicle-location-input-no"]').prop('checked', false);
        //Autofill Address
        $('input[name="address_line_1"]').val('918 McPhillips Street');
        $('input[name="address_city"]').val('Winnipeg');
        $('input[name="address_postal"]').val('R2X 2J8');
        $('select[name="State"]').find('option[value="MB"]').attr("selected",true);
        $('select[name="Country"]').find('option[value="Canada"]').attr("selected",true);
    });

    $('#hold-vehicle').click(function(e){
        e.preventDefault();
        if(holdVehicle){
            $('#hold-vehicle').text('HOLD');
            $('#hold-vehicle').css('background', 'black');
            holdVehicle = false;
        }else{
            $('#hold-vehicle').text('RELEASE');
            $('#hold-vehicle').css('background', 'red');
            $()
            holdVehicle = true;
        }
    });


    $('#vehicle-addition-form-submit').click(function(e){
        e.preventDefault();
        isValid = true;
        var count = 0;

        $('.inventory-submit-error').addClass('d-none');
        $('#listing-add-form-five-error').text('Vehicle location details are required to continue.');
        $('input', $('#vehicle-addition')).each(function(index){
             if($(this).attr('required') && ($(this).val() === '' || $(this).val() === undefined || $(this).val()===null || !alphanumRegex.test($(this).val()))){
                 isValid = false;
                 count++;
                 $(this).css('background', '#b7b5b5'); 
            }
        });
 
        //Check that all options have selections
        $('select', $('#vehicle-addition')).each(function(){
            if(($(this).attr('required') && $(this).val().toUpperCase() === 'SELECT') || !alphanumRegex.test($(this).val())){
                 isValid = false;
                 count++;
                 $(this).css('background', '#b7b5b5');
            }
        });

        //if there are no errors that occured before the final page 
        //then check if the location info has been filled in 
        //since '.save-continue' doesn't apply on the final page
        if(count === 0){
            $('input', $('#vehicle-location-info')).each(function(index){
                $(this).css('background', '#fff');
                if($(this).attr('required') && ($(this).val() === '' || $(this).val() === undefined || $(this).val()===null || !alphanumRegex.test($(this).val()))){
                     isValid = false;
                     $(this).css('background', '#b7b5b5'); 
                }
            });
    
            $('select', $('#vehicle-location-info')).each(function(){
                $(this).css('background', '#fff');
               if(($(this).attr('required') && $(this).val().toUpperCase() === 'SELECT') || !alphanumRegex.test($(this).val())){
                    isValid = false;
                    $(this).css('background', '#b7b5b5');
               }
            });
        }

        //if there are errors that occured before the final page then display generic error message.
        if(count > 0){
            $('#listing-add-form-five-error').removeClass('d-none').text('Required values are missing. Please check again.');
            return;
        }

        //if there are any errors occuring on the final page then display error message on final page.
        if(!isValid){
            $('#listing-add-form-five-error').removeClass('d-none');
            setTimeout(function(){
              $('input', $("#vehicle-location-info").each(function(){
                $(this).css('background', '#fff');
              })); 
              $('select', $("#vehicle-location-info").each(function(){
                $(this).css('background', '#fff');
              })); 
            }, 3000);
            return;
        }

        var pathName = window.location.pathname;
        //Verify that the vehicle is being submitted with photos
        if(!pathName.toUpperCase().includes('/VEHICLE/EDIT')){
            if(totalVehicleFiles.length === 0){
                if(!warnUserAboutPhotos){
                   //warn user
                   warnUserAboutPhotos = confirm('WARNING: You are about to upload this vehicle without photos. Press OK to continue.');
                   if(warnUserAboutPhotos){
                       $('#vehicle-addition-form-submit').click();
                   }
                   return;
               }
           }
        }
        var data = $('#vehicle-addition').serializeFormJSON();
        data.vehiclePhotos = totalVehicleFiles;
        data.holdVehicle = holdVehicle;

        $('#listing-add-form-content-js').addClass('d-none');
        $('#listing-add-form-loader').removeClass('d-none');
        
        //send data to sever
        let inventoryPostURL = '/inventory/new/add';
        let postReqStockNo = getParameterByName('stockNo');

        if(pathName.toUpperCase().includes('/VEHICLE/EDIT')){
            inventoryPostURL = '/inventory/edit?stockNo=' + postReqStockNo;
        }

        $.post(inventoryPostURL, data).done(function(response){
            if(response.error){
                //handle Error response
                $('#listing-add-form-content-js').removeClass('d-none');
                $('#listing-add-form-loader').addClass('d-none');
                $('#listing-add-form-five-error').removeClass('d-none').text(response.error);
                return;
            }
            if(response.stockNo){
                //handle Success Response
                if(inventoryPostURL.toUpperCase().includes('INVENTORY/EDIT')){
                    window.location = '/vehicle?stockNo=' + response.stockNo;
                }else{
                    window.location = '/vehicle?stockNo=' + response.stockNo + '&newVehicle=true';
                }
            }
        });
        return;
    });
});