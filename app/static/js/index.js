// index.js

// EVENT LISTENERS
document.getElementById("selectpicker").addEventListener("change",memberSelectedRtn)


// FUNCTIONS

function memberSelectedRtn() {
    //$(this).find(':selected').data('id');
    //currentLightspeedID = $(this).find(':selected').data('lightspeedID')
    currentLightspeedID = $('option:selected', this).attr("data-lightspeedID");
    console.log('currentLightspeedID - ',currentLightspeedID)
    
    currentMemberID = $('option:selected', this).attr("data-memberID");
    console.log('currentMemberID - '+ currentMemberID)
    

    selectedMember = this.value
    console.log('selectedMember - '+selectedMember)
	
    //document.getElementById('memberID').value = currentMemberID
    document.getElementById('lightspeedID').value = currentLightspeedID
    document.getElementById('getCustByPythonID').removeAttribute('disabled')
    document.getElementById('prtTransactionsID').removeAttribute('disabled')
    
}

function updatelightspeedID() {
    document.getElementById('updatelightspeedID').innerHTML = 'Working ...' 
    alertMsg = "Only members that have been added to the lightspeed system will be affected."
    alertMsg += "\n\nThis routine may take up to 5 minutes to complete."
    alert(alertMsg)

    $.ajax({
        url: "/updatelightspeedID",
        type: "GET",
        data: {},
    success: function(data, textStatus, jqXHR)
    {
        msg = data.msg
        alert(msg)
    },
    error: function (jqXHR, textStatus, errorThrown){
        alert("Error updating lightspeed ID")
    }
    })
    document.getElementById('updatelightspeedID').innerHTML = "Update VWC DB w/Lightspeed IDs" 
} 


function retrieveCustomerByLightspeedID() {
    lightspeedID = document.getElementById('lightspeedID').value
    var dataToSend = {
        lightspeedID: lightspeedID
    };
    
    fetch(`${window.origin}/retrieveCustomerByLightspeedID`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(dataToSend),
        cache: "no-cache",
        headers: new Headers({
            "content-type": "application/json"
        })
    })
    .then(function (response) {
        if (!response.ok) {
            alert('Network error ... retry.')
            console.log(`Response status was not 200: ${response.status}`);
            return ;
        }
        response.json().then(function (data) {
            // If member not found in lightspeed database ...
            if (data.hasOwnProperty('msg')){
                alert(data.msg)
                return
            }
            // Display available data from lightspeed database
            msg = 'Name - ' + data.memberName + '\nLightspeed ID - ' + data.lightspeedID + '\nVillage ID - ' + data.villageID
            msg += '\nHome phone - ' + data.homePhone + '\nMobile phone - ' + data.mobilePhone + '\nEmail - ' + data.email
            msg += '\nCustomer type - ' + data.customerType
            alert(msg)
            return
        })
    })
}


function retrieveCustomerByVillageID() {
    villageID = document.getElementById('memberID').value
    alert('VILLAGE ID - ',villageID)
    
    var dataToSend = {
        villageID: villageID
    };
    fetch(`${window.origin}/retrieveCustomerByVillageID`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(dataToSend),
        cache: "no-cache",
        headers: new Headers({
            "content-type": "application/json"
        })
    })
    .then(function (response) {
        if (response.status != 200) {
            console.log(`Response status was not 200: ${response.status}`);
            return ;
        }
        response.json().then(function (data) {
            console.log(data)
            msg = 'Name - ' + data.memberName + '\nLightspeed ID - ' + data.lightspeedID + '\nVillage ID - ' + data.villageID
            msg += '\nHome phone - ' + data.homePhone + '\nMobile phone - ' + data.mobilePhone + '\nEmail - ' + data.email
            msg += '\nCustomer type - ' + data.customerType
            alert(msg)
            document.getElementById('lightspeedID').value = data.lightspeedID
        })
    })
}


function listTransactions() {
    villageID = document.getElementById('memberID').value
    lightspeedID = document.getElementById('lightspeedID').value
    

    var dataToSend = {
        villageID: villageID,
        lightspeedID: lightspeedID
    };
    fetch(`${window.origin}/listTransactions`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(dataToSend),
        cache: "no-cache",
        headers: new Headers({
            "content-type": "application/json"
        })
    })
    .then(function (response) {
        if (response.status != 200) {
            console.log(`Response status was not 200: ${response.status}`);
            return ;
        }
        response.json().then(function (data) {
            
            console.log(data)
            msg = 'Name - ' + data.memberName + '\nLightspeed ID - ' + data.lightspeedID 
            alert(msg)
        })
    })   
}


function addCustomer() {
    url = '/addCustomer'
    location.href=url
}
// END OF FUNCTIONS
