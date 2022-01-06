// index.js
//var currentLightspeedID = ''
var currentMemberID = ''

// EVENT LISTENERS
document.getElementById("selectpicker").addEventListener("change",retrieveCustomerByVillageID)


// FUNCTIONS

function memberSelectedRtn() {
    var e = document.getElementById("selectpicker");
    var option = e.options[e.selectedIndex];

    //var lsData = option.getAttribute("data-lightspeed");
    //console.log('lsData - ',lsData)

    var attrs = option.attributes;
    console.log('attrs - ',attrs)

    //currentLightspeedID = $('option:selected', this).attr("data-lightspeeed");
    //document.getElementById('lightspeedID').value = currentLightspeedID
    //console.log('currentLightspeedID - ',currentLightspeedID)

    currentMemberID = $('option:selected', this).attr("data-member");
    document.getElementById('memberID').value = currentMemberID
    console.log('currentMemberID - ',currentMemberID)

    selectedMember = this.value

    retrieveCustomerByVillageID()

    //console.log('selectedMember - '+selectedMember)
	
    // Enable buttons
    //document.getElementById('getCustByPythonID').removeAttribute('disabled')
    //document.getElementById('prtTransactionsID').removeAttribute('disabled')
    
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
                modalAlert("ERROR",data.msg)
                return
            }
            // Display available data from lightspeed database
            msg = '<h4>Lightspeed Data</h4>';
            msg += `
                <ul class="list-group mb=3">
                    <li class="list-group-item" style=text-align:left>Name - ${data.memberName}</li>
                    <li class="list-group-item"style=text-align:left>Lightspeed ID - ${data.lightspeedID}</li>
                    <li class="list-group-item"style=text-align:left>Village ID - ${data.villageID}</li>
                    <li class="list-group-item"style=text-align:left>Home phone - ${data.homePhone}</li>
                    <li class="list-group-item"style=text-align:left>Mobile phone - ${data.mobilePhone}</li>
                    <li class="list-group-item"style=text-align:left>Email - ${data.email}</li>
                </ul>   
            `
                
            modalAlert("",msg)

            // msg = 'Name - ' + data.memberName + '\nLightspeed ID - ' + data.lightspeedID + '\nVillage ID - ' + data.villageID
            // msg += '\nHome phone - ' + data.homePhone + '\nMobile phone - ' + data.mobilePhone + '\nEmail - ' + data.email
            // msg += '\nCustomer type - ' + data.customerType
            // alert(msg)
            return
        })
    })
}


function retrieveCustomerByVillageID() {
    console.log ('enter routine - retrieveCustomerByVillageID')
    var e = document.getElementById("selectpicker");
    var option = e.options[e.selectedIndex];
    currentMemberID = $('option:selected', this).attr("data-member");
    selectedMember = this.value
    villageID = currentMemberID 
    //villageID = document.getElementById('memberID').value
    
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
            // Was the member found in the lightspeed database?
            if (data.hasOwnProperty('msg')){
                modalAlert('ERROR',data.msg)
                return
            }
            // console.log(data)
            // msg = 'Name - ' + data.memberName + '\nLightspeed ID - ' + data.lightspeedID + '\nVillage ID - ' + data.villageID
            // msg += '\nHome phone - ' + data.homePhone + '\nMobile phone - ' + data.mobilePhone + '\nEmail - ' + data.email
            // msg += '\nCustomer type - ' + data.customerType
            msg = '<h4>Lightspeed Data</h4>';
            msg += `
                <ul class="list-group mb=3">
                    <li class="list-group-item" style=text-align:left>Name - ${data.memberName}</li>
                    <li class="list-group-item"style=text-align:left>Lightspeed ID - ${data.lightspeedID}</li>
                    <li class="list-group-item"style=text-align:left>Village ID - ${data.villageID}</li>
                    <li class="list-group-item"style=text-align:left>Home phone - ${data.homePhone}</li>
                    <li class="list-group-item"style=text-align:left>Mobile phone - ${data.mobilePhone}</li>
                    <li class="list-group-item"style=text-align:left>Email - ${data.email}</li>
                </ul>   
            `
                
            modalAlert("Member Data",msg)
            document.getElementById('lightspeedID').value = data.lightspeedID
            document.getElementById('prtTransactionsID').removeAttribute('disabled')
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
            if (data.hasOwnProperty('msg')){
                modalAlert('ERROR',data.msg)
                return
            }
            console.log(data)
            
            msg =  data.transList
            modalAlert("Transactions",msg)
        })
    })   
}


function addCustomer() {
    url = '/addCustomer'
    location.href=url
}

function modalAlert(title,msg) {
	document.getElementById("modalTitle").innerHTML = title
	document.getElementById("modalBody").innerHTML= msg
	$('#myModalMsg').modal('show')
}

function closeModal() {
	$('#myModalMsg').modal('hide')
}

// END OF FUNCTIONS
