// index.js
//  PAGE LOAD ROUTINES
// Declare global variables)

var todaysDate = new Date();
var shopNames = ['Rolling Acres', 'Brownwood']


// UPDATED ON LOAD AND SHOP CHANGE
var curShopNumber = ''
var curShopName = ''


// SET INITIAL PAGE VALUES

// GET STAFFID THAT WAS STORED BY THE LOGIN ROUTINE
if (!localStorage.getItem('staffID')) {
    staffID = prompt("Staff ID - ")
    localStorage.setItem('staffID',staffID)
}
else {
    staffID = localStorage.getItem('staffID')
}

// PRINT THE REPORTS
//$('#prtPresidentsReportID').click(function(){
    
//})

document.getElementById("selectpicker").addEventListener("change",memberSelectedRtn)

function memberSelectedRtn() {
    selectedMember = this.value
	lastEight = selectedMember.slice(-8)
	currentMemberID= lastEight.slice(1,7)
	//document.getElementById('selectpicker').value=''
    document.getElementById('prtTransactionsID').removeAttribute('disabled')
}
function PresidentsReport() {
    window.location.href = '/prtPresidentsReport?destination=PRINT' 
}

function Mentors() {
    window.location.href = '/prtMentors?destination=PRINT'
}

function Contacts() {
    window.location.href = '/prtContacts?destination=PRINT'
}

function Transactions() {
    // TO BE DEFINED .....
    link = '/prtTransactions?destination=PRINT&memberID=' + currentMemberID + '&year=' + curYear
    window.location.href = link
}

function retrieveCustomer() {
    // get memberID (lightspeed#?) to send
    link = '/retrieveCustomer'
    window.location.href = link
}
// END OF FUNCTIONS
