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


function updateLightspeedID() {
    console.log('updateLightspeedID')
    url = '/updateLightspeedID'
    location.href=url
}

function retrieveCustomerByID() {
    url = '/retrieveCustomerByID'
    location.href=url
}

function retrieveCustomerPython() {
    villageID = document.getElementById('memberID').value
    url = '/retrieveCustomerByVillageID?villageID=' + villageID
    location.href="/retrieveCustomerByVillageID/"+ villageID 
}
   
function listTransactions() {
    alert('To be developed.')
}

// function retrieveCustomerJS() {
//     villageID = document.getElementById('memberID').value
    
//     // REFRESH TOKEN; SAVE TOKEN
//     token = refreshToken()

//     url = 'https://api.lightspeedapp.com/API/Account/230019/Customer.json?load_relations=["Contact"]&Contact.custom=~,' + villageID
//     //headers = {'authorization': 'Bearer c69c7b31ce5b6caf176c189ba741f9ec4b231a20'}
//     headers = {'authorization': 'Bearer ' + token}
//     response = request('GET', url, headers=headers)
//     data_json = response.json()
//     console.log('------- Pretty Print JSON String ----------')
//     console.log(data_json)
//     console.log('--------------------------------------------------------')
    
//     lightspeedID = data_json['Customer']['customerID']
//     lastName = data_json['Customer']['lastName']
//     firstName = data_json['Customer']['firstName']
//     villageID = data_json['Customer']['Contact']['custom']
//     email = data_json['Customer']['Contact']['Emails']['ContactEmail']['address']

//     console.log('Lightspeed ID: '+lightspeedID+ '\nName: '+firstName + ' ' + lastName, 
//     '\nVillage ID - ',villageID)
// }
   



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
