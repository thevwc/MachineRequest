// index.js

// EVENT LISTENERS
document.getElementById("selectpicker").addEventListener("change",memberSelectedRtn)


// FUNCTIONS

function memberSelectedRtn() {
    console.log('this - '+this)
    currentMemberID = $('option:selected', this).attr("data-memberID");
    console.log('currentMemberID - '+ currentMemberID)
    
    selectedMember = this.value
    console.log('selectedMember - '+selectedMember)
	
    document.getElementById('memberID').value = currentMemberID
    
    document.getElementById('getCustByPythonID').removeAttribute('disabled')
    document.getElementById('prtTransactionsID').removeAttribute('disabled')
    //document.getElementById('getCustBYjsID').removeAttribute('disabled')
}


function updatelightspeedID() {
    // GET ALL CURRENT LIGHTSPEED CUSTOMER RECORDS
    // villageID = document.getElementById('memberID').value
    // var dataToSend = {
    //     villageID: villageID
    // };
    document.getElementById('updatelightspeedID').innerHTML = 'Working ...'
    dataToSend = ''
    
    fetch(`${window.origin}/updatelightspeedID`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(dataToSend),
        cache: "no-cache",
        headers: new Headers({
            "content-type": "application/json"
        })
    })
    .then(function (response) {
        document.getElementById('updatelightspeedID').innerHTML = 'Update Lightspeed ID'

        if (response.status != 200) {
            console.log(`Response status was not 200: ${response.status}${response.msg}`);
            return ;
        }
        response.json().then(function (data) {
            alert(data)
        })
    })
}


// function retrieveCustomerByID() {
//     lightspeedID = document.getElementById('lightspeedID').value 
//     alert('lightspeedID - '+lightspeedID)
//     url = '/retrieveCustomerByID?lightspeedID=' + lightspeedID
//     location.href=url
// }

function retrieveCustomerByID() {
    lightspeedID = document.getElementById('lightspeedID').value
    var dataToSend = {
        lightspeedID: lightspeedID
    };
    
    fetch(`${window.origin}/retrieveCustomerByID`, {
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
        })
    })
}


function retrieveCustomerByVillageID() {
    villageID = document.getElementById('memberID').value
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
            msg = 'Name - ' + data.memberName + '\nLightspeed ID - ' + data.lightspeedID + '\nVillage ID - ' + data.villageID
            msg += '\nHome phone - ' + data.homePhone + '\nMobile phone - ' + data.mobilePhone + '\nEmail - ' + data.email
            msg += '\nCustomer type - ' + data.customerType
            alert(msg)
        })
    })   
}



// function refreshToken() {
//     payload = {
//         'refresh_token': '0e5c9948da5e257f1f55de872c6901d6b3975b04',
//         'client_secret': 'cfb0bf58140eaa2f15b1e698c6b5470a4ab05d8ed65b0cd3013a9c94117d0283',
//         'client_id': '0ec071521972565d2cf9258ae86d413fef4265cf29dba51662c083c48a429370',
//         'grant_type': 'refresh_token'
//     }
//     url = 'https://cloud.lightspeedapp.com/oauth/access_token.php'
//     response = request('GET', url, headers=headers)
//     console.log('response -'+response)
//     token = (response['access_token'])
//     return token
// }


function addCustomer() {
    url = '/addCustomer'
    location.href=url
}
// END OF FUNCTIONS
