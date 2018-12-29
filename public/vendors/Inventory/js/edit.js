
$(document).ready(function(){
    //Utility Functions
    var featureArray = [];
    var notesArray = [];
    function parseData(data, mode){
        if(data.indexOf(',') == -1){
            if(mode==0){
                featureArray.push(data);
            }else{
                notesArray.push(data);
            }
            return;
        }
        var partial = data.substring(0, data.indexOf(','));
        if(mode == 0){
            featureArray.push(partial);
        }else{
            notesArray.push(partial);
        }

        parseData(data.substring(data.indexOf(',') + 1, data.length), mode);
    }

     //Get all select/radio input data
    //Form Step 1
    var year = '<%=vehicle.year%>';
    var seats = '<%=vehicle.seats%>';
    var numberOfGears = '<%=vehicle.numberOfGears%>';
    var driveType = '<%=vehicle.driveType%>';
    var numberOfCylinders = '<%=vehicle.numberOfCylinders%>';
    var fuelType = '<%=vehicle.fuelType%>';
    var bodyType = '<%=vehicle.bodyType%>';
    var numberOfDoors = '<%=vehicle.numberOfDoors%>';
    var transmissionType = '<%=vehicle.transmissionType%>';
    var engineType = '<%=vehicle.engineType%>';

    //Form Step 2
    var features = '<%=vehicle.features%>';

    //Form Step 3
    var registered = '<%=vehicle.registered%>' || false;
    var exteriorColor = '<%=vehicle.exteriorColor%>';
    var plateNumber = '<%=vehicle.plateNumber%>' || '';
    var registrationExpMonth = '<%=vehicle.registrationExpMonth%>';
    var registrationExpYear = '<%=vehicle.registrationExpYear%>';
    var registrationNumber = '<%=vehicle.registrationNumber%>';

    /* Form Step 4 */

    //Form Step 5
    var locLength = Number('<%=locLength%>');
    var editors = '<%=vehicle.dealership.editors%>' || 'Admin';
    var onLot = '<%=vehicle.dealership.onLot%>' || true;
    var onHold = '<%=vehicle.dealership.onHold%>' || false;
    var state = '<%=vehicle.dealership.locationHistory[locLength-1].state%>';
    var country = '<%=vehicle.dealership.locationHistory[locLength-1].country%>' || 'Canada';

    /*Fill in Selects */
    $('select[name="Vehicle Year"]').find('option[value="' + year + '"]').attr("selected",true);
    $('select[name="Seats"]').find('option[value="' + seats + '"]').attr("selected",true);
    $('select[name="Gears"]').find('option[value="' + numberOfGears + '"]').attr("selected",true);
    $('select[name="Drive Type"]').find('option[value="' + driveType + '"]').attr("selected",true);
    $('select[name="Cylinders"]').find('option[value="' + numberOfCylinders + '"]').attr("selected",true);
    $('select[name="Fuel Type"]').find('option[value="' + fuelType + '"]').attr("selected",true);
    $('select[name="Body Style"]').find('option[value="' + bodyType + '"]').attr("selected",true);
    $('select[name="Doors"]').find('option[value="' + numberOfDoors + '"]').attr("selected",true);
    $('select[name="Seats"]').find('option[value="' + seats + '"]').attr("selected",true);
    $('select[name="Transmission"]').find('option[value="' + transmissionType + '"]').attr("selected",true);
    $('select[name="Engine Type"]').find('option[value="' + engineType + '"]').attr("selected",true);
    $('select[name="exterior_color"]').find('option[value="' + exteriorColor + '"]').attr("selected",true);
    $('select[name="State"]').find('option[value="' + state + '"]').attr("selected",true);
    $('select[name="Country"]').find('option[value="' + country + '"]').attr("selected",true);


    //Handle Features (Input Checkboxes)
    var selectedFeatures = '<%=vehicle.selectedFeatures%>' || [];
    parseData(selectedFeatures, 0);

    for(var i=0; i<featureArray.length; i++){
        $('input[name="' + featureArray[i] + '"]').prop('checked', true);
    }

    //Handle Radio Inputs
    if(registered == 'true'){
        $('input[name="RegisteredYes"]').prop('checked', true);
    }

    if(registrationExpMonth.toUpperCase() !== 'SELECT'){
        $('select[name="Registration_Month"]').find('option[value="' + registrationExpMonth + '"]').attr("selected",true);
    }
    if(registrationExpYear.toUpperCase() !== 'SELECT'){
        $('select[name="Registration_Expiry_Month"]').find('option[value="' + registrationExpYear + '"]').attr("selected",true);
    }

    if(editors == 'Admin'){
        $('input[name="Allow-Staff-Edit"]').prop('checked', false);
        $('input[name="Allow-Admin-Edit"]').prop('checked', true);
        $('#adminEditBtn').click();
    }

    if(onLot == 'true'){
        $('input[name="vehicle-location-input-yes"]').prop('checked', true);
        $('input[name="vehicle-location-input-no"]').prop('checked', false);
    }

    if(onHold == 'true'){
        $('#hold-vehicle').click();
    }

    //handle notes
    
    

    var notes = '<%=vehicle.dealership.notes%>';
    parseData(notes, 1);
    var text = '';
    for(var i=0; i<notesArray.length; i++){
        if(i == notesArray.length - 1 ){
            text += notesArray[i];
        }else{
            text += notesArray[i] + '\r\n';
        }
    }
    $('#vehicle_notes').val(text);
});