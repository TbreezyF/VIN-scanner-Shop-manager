/*Regular Expressions */
window.nameRegex = /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð,.'-]+$/u;
window.emailRegex = /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
window.userNameRegex = /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/;
window.passRegex = /^([a-zA-Z0-9@*#]{8,15})$/;
window.authRegex = /^[a-zA-Z0-9]+$/;
window.alphanumRegex2 = /^[a-zA-Z0-9\s.\-_+/\r\n]+$/;
window.alphanumRegex = /^[a-zA-Z0-9\s.]+$/;
window.phoneNumberRegex = /^(\(?\+?[0-9]*\)?)?[0-9_\- \(\)]*$/;
window.serviceList = [];
window.timeEstimate = [];
window.invalid = false;
window.deleteId = null;
window.startId = null;
window.updateId = null;
window.stopId = null;


$(document).ready(function(){
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

    $('#service-male-gender').click(function(e){
        e.preventDefault();
        $('#service-female-gender').removeAttr('checked');
        $('#service-female-gender').removeClass('btn-primary').addClass('btn-default');
        $('#service-male-gender').removeClass('btn-default').addClass('btn-primary');
        $('input[name="genderMale"]').attr('checked', true)

    });
    $('#service-female-gender').click(function(e){
        e.preventDefault();
        $('#service-male-gender').removeAttr('checked');
        $('#service-male-gender').removeClass('btn-primary').addClass('btn-default');
        $('#service-female-gender').removeClass('btn-default').addClass('btn-primary');
        $('input[name="genderFemale"]').attr('checked', true).removeClass('btn-default').addClass('btn-primary');
    });

    // Smart Wizard
    // Smart Wizard
    $('#smartwizard').smartWizard({
        selected: 0,  // Initial selected step, 0 = first step 
        keyNavigation:true, // Enable/Disable keyboard navigation(left and right keys are used if enabled)
        autoAdjustHeight:true, // Automatically adjust content height
        cycleSteps: false, // Allows to cycle the navigation of steps
        backButtonSupport: true, // Enable the back button support
        useURLhash: true, // Enable selection of the step based on url hash
        lang: {  // Language variables
            next: 'Next', 
            previous: 'Previous'
        },
        toolbarSettings: {
            toolbarPosition: 'bottom', // none, top, bottom, both
            toolbarButtonPosition: 'right', // left, right
            showNextButton: true, // show/hide a Next button
            showPreviousButton: true, // show/hide a Previous button
            toolbarExtraButtons: [
        $('<button></button>').text('Finish')
                      .addClass('btn btn-info')
                      .on('click', handleServiceSubmit)
                  ]
        }, 
        anchorSettings: {
            anchorClickable: true, // Enable/Disable anchor navigation
            enableAllAnchors: false, // Activates all anchors clickable all times
            markDoneStep: true, // add done css
            enableAnchorOnDoneStep: true // Enable/Disable the done steps navigation
        },            
        contentURL: null, // content url, Enables Ajax content loading. can set as data data-content-url on anchor
        disabledSteps: [],    // Array Steps disabled
        errorSteps: [],    // Highlight step with errors
        theme: 'dots',
        transitionEffect: 'fade', // Effect on navigation, none/slide/fade
        transitionSpeed: '400'
  });

  $('.service-link').click(function(e){
    var target = $(e.target);
    if(target.hasClass('active-service')){
        target.css('background', '#fff');
        //remove from list of service
        var index = serviceList.indexOf(target.text().trim());
        if(index > -1 ){
            serviceList.splice(index, 1);
        }
        return;
    }else{
        target.css('background', '#c1baba');
        target.addClass('active-service');
        //add to service list
        serviceList.push(target.text().trim());
        return;
    }
  });

    function handleServiceSubmit(){
        $('.error').remove();
        $('#service-selection-error').addClass('d-none');
        invalid = false;
        let formStepOne = $('#service-step-1').serializeFormJSON();
        let formStepTwo = $('#service-step-2').serializeFormJSON();

        //Clear error visual
        $('input').each(function(){
            if(($(this).next().length == 0)){
              $(this).css('border-color', '#CCD0D7');
            }
          });

        //validateForm
        //validate form step one
        if(!nameRegex.test(formStepOne.firstName) || formStepOne.firstName.length < 3){
            invalid = true;
            $('input[name="firstName"]').after("<label class='error' style='color:red !important;'>First name contains invalid characters</label>");
            $('input[name="firstName"]').css('border-color', 'red');
            $('#nav-step-1').click();
        }
        if(!nameRegex.test(formStepOne.lastName) || formStepOne.lastName.length < 3){
            invalid = true;
            $('input[name="lastName"]').after("<label class='error' style='color:red !important;'>Last name contains invalid characters</label>");
            $('input[name="lastName"]').css('border-color', 'red');
            $('#nav-step-1').click();
        }
        if(!nameRegex.test(formStepOne.middleName) && formStepOne.middleName.length > 3){
            invalid = true;
            $('input[name="middleName"]').after("<label class='error' style='color:red !important;'>Middle name/Initials contains invalid characters</label>");
            $('input[name="middleName"]').css('border-color', 'red');
            $('#nav-step-1').click();
        }
        if(!Number(formStepOne.servicePhone) || formStepOne.servicePhone.length < 7){
            invalid = true;
            $('input[name="servicePhone"]').after("<label class='error' style='color:red !important;'>Please enter a valid phone number</label>");
            $('input[name="servicePhone"]').css('border-color', 'red');
            $('#nav-step-1').click();
        }  
        
        if(invalid){
            return;
        }

        //Validate form step 2
        if(!alphanumRegex2.test(formStepTwo.carMake)){
            invalid = true;
            $('input[name="carMake"]').after("<label class='error' style='color:red !important;'>The car make is in an invalid format.</label>");
            $('input[name="carMake"]').css('border-color', 'red');
            $('#nav-step-2').click();
        }
        if(!alphanumRegex2.test(formStepTwo.carModel)){
            invalid = true;
            $('input[name="carModel"]').after("<label class='error' style='color:red !important;'>The car model is in an invalid format.</label>");
            $('input[name="carModel"]').css('border-color', 'red');
            $('#nav-step-2').click();
        }
        if(!Number(formStepTwo.carYear) || formStepTwo.carYear.length < 4){
            invalid = true;
            $('input[name="carYear"]').after("<label class='error' style='color:red !important;'>The car year is in an invalid format. Enter a valid year (e.g 2004)</label>");
            $('input[name="carYear"]').css('border-color', 'red');
            $('#nav-step-2').click();
        }
        if(!alphanumRegex2.test(formStepTwo.carTrim)){
            invalid = true;
            $('input[name="carTrim"]').after("<label class='error' style='color:red !important;'>The car trim is in an invalid format. Must be alphanumeric</label>");
            $('input[name="carTrim"]').css('border-color', 'red');
            $('#nav-step-2').click();
        }
        if(!alphanumRegex2.test(formStepTwo.licensePlate)){
            invalid = true;
            $('input[name="licensePlate"]').after("<label class='error' style='color:red !important;'>The car trim is in an invalid format. Must be alphanumeric</label>");
            $('input[name="licensePlate"]').css('border-color', 'red');
            $('#nav-step-2').click();
        }

        if(invalid){
            return;
        }

        if(serviceList.length == 0){
            invalid = true;
            $('#service-selection-error').text('You can not submit a service request without specifying a service type.').removeClass('d-none');
            $('#nav-step-3').click();
        }

        if(invalid){
            return;
        }

        //Send details to server;

        $('#service-time-estimate').modal('show');

        $('#service-form-complete').click(function(e){
            $('#service-time-estimate').modal('hide');
            timeEstimate[0] = $('input[name="serviceHours"]').val();
            timeEstimate[1] = $('input[name="serviceMinutes"]').val();

            //show loader
            //send info to server
            $('#service-content').hide();
            $('#service-form-loader').removeClass('d-none');

            
            $.post('/service/request', {
                formOne: formStepOne,
                formTwo: formStepTwo,
                serviceList: serviceList,
                timeEstimate: timeEstimate
            }).done(function(response){
                if(response.error){
                    $('#service-selection-error').removeClass('d-none').text(response.error);
                    $('#service-form-loader').addClass('d-none');
                    $('#service-content').show();
                    return;
                }
                if(response.success){
                    window.location = '/service/records';
                    return;
                }
                //something weird happened
                $('#service-selection-error').removeClass('d-none').text('An unexpected error occured. Please try again or contact support');
                $('#service-form-loader').addClass('d-none');
                $('#service-content').show();
                return;
            });
            
         });
     }//End Service Request Submit

     $('#delete').on('show.bs.modal', function(e){
        $('#delete-record-error').addClass('d-none')
        deleteId = $(e.relatedTarget).data('delete');
     });

     $('#start').on('show.bs.modal', function(e){
        $('#start-request-error').addClass('d-none')
        startId = $(e.relatedTarget).data('start');
     });

     $('#stop').on('show.bs.modal', function(e){
        $('#stop-request-error').addClass('d-none')
        stopId = $(e.relatedTarget).data('stop');
     });



     $('#delete-service-record').click(function(e){
        if(deleteId){
            $.post('/service/delete?serviceId=' + deleteId, {}).done(function(response){
                if(response.error){
                    $('#delete-record-error').removeClass('d-none').text(response.error);
                }
                if(response.success){
                    window.location.reload(true);
                }
            })
        }else{
            //show error
            $('#delete-record-error').removeClass('d-none').text('Unable to determine the ID of the record to delete. Try again or contact support');
        }
     });

     $('#start-service-request').click(function(e){
        if(startId){
            var notes = $('#service-record-notes').val();
            $.post('/service/start?serviceId=' + startId, {notes: notes}).done(function(response){
                if(response.error){
                    $('#start-request-error').removeClass('d-none').text(response.error);
                }
                if(response.success){
                    window.location.reload(true);
                }
            })
        }else{
            //show error
            $('#start-request-error').removeClass('d-none').text('Unable to determine the ID of the service request. You may try again or inform an Admin of this error.');
        }
     });

     $('#stop-service-request').click(function(e){
        if(stopId){
            $.post('/service/stop?serviceId=' + stopId, {}).done(function(response){
                if(response.error){
                    $('#stop-request-error').removeClass('d-none').text(response.error);
                }
                if(response.success){
                    window.location.reload(true);
                }
            })
        }else{
            //show error
            $('#stop-request-error').removeClass('d-none').text('Unable to determine the ID of the service request. You may try again or inform an Admin of this error.');
        }
     });
});