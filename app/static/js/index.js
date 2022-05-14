// index.js

// Define variables
var curNumber="";
var entry = "";
var currentLocation = ''

// Define event listeners
//shopLocationSelector = document.getElementById('shopLocationSelector')
//shopLocationSelector.addEventListener('change',shopLocationChange)

// Establish the current shop location
if (localStorage.getItem('shopLocation')) {
  currentLocation = localStorage.getItem('shopLocation')
  if (currentLocation == 'RA') {
    locationID.innerText = 'Rolling Acres'
  }
  else {
    locationID.innerText = 'Brownwood'
  }
}  
else {
  // Initialize localStorage with 'RA'
  locationID.innerText ='Rolling Acres'
  currentLocation = 'RA'
  localStorage.setItem('shopLocation',currentLocation)
}  
  
  // console.log('currentLocation - '+currentLocation)
  // document.getElementById('shopLocation').value = currentLocation
  // keypad.style.display='block'
  // window.focus()
  // document.getElementById("memberInput").focus();


  // keypad.style.display='none'
  // modalAlert('LOCATION','Please select a location.')

// keypad = document.getElementById('keypadID')

function shopLocationChange() {
    locationID = document.getElementById('locationID')
    currentLocationName = locationID.innerText
    if (currentLocationName == 'Rolling Acres') {
      locationID.innerText = 'Brownwood'
      currentLocation = 'BW'
      localStorage.setItem('shopLocation','BW')
    }
    else {
      locationID.innerText = 'Rolling Acres'
      currentLocation = 'RA'
      localStorage.setItem('shopLocation','RA')
    }
    //   modalAlert('Location','Please select a location.')
    //   return 
    // }
    // localStorage.setItem('shopLocation',currentLocation)
    // keypad.style.display='block'
    clearScreen()
    // console.log('currentLocation - '+currentLocation)
    // console.log('memberInput value - '+document.getElementById('memberInput').value)
}

//   if (!localStorage.getItem('delaySec')) {
//     localStorage.setItem('delaySec',5)
//     delayInSeconds = 5
//   }
//   else {
//     delayInSeconds = localStorage.getItem('delaySec')
//   }
//   delayInMilliseconds = delayInSeconds * 1000
//   document.getElementById('delaySec').innerHTML = delayInSeconds + ' sec'
//   document.getElementById('delayTimeID').value = delayInSeconds

  
  // SET UP LISTENER FOR BARCODE SCANNER INPUT
  // memberInput = document.getElementById('memberInput')
  // memberInput.addEventListener('input',checkForScannerInput)
  
  // SET UP LISTENERS FOR SETTINGS BUTTONS
  // $(".cancelBtn").click(function() {
  //   console.log('cancelBtn clicked ...')
  //   $('#settingsModalID').modal('hide')
  // })

  function cancelSettings() {
    $('#settingsModalID').modal('hide')
  }

  function updateSettings(settingsForm) {
    delayInSeconds = settingsForm.delayTime.value
    localStorage.setItem('delaySec',delayInSeconds)
    delayInMilliseconds = delayInSeconds * 1000  
  }

  
// CHECK FOR SCANNED DATA OR KEYPAD KEY STROKES; DATA WILL BE IN memberInput ELEMENT
function checkForScannerInput() {
    inputValue = memberInput.value
    if (inputValue.length == 6) {
      curNumber = inputValue
      displayMemberCertifications(curNumber,currentLocation)
    }
}

$("button").click(function() {    
    entry = $(this).attr("value");
    //alert('this - '+$(this).id)
    if (entry == undefined) {
      return
    }
    // WAS CLR KEY PRESSED?
    if (entry === "all-clear") {
      clearScreen();
      return;
    }

    if (entry === "enter") {
      modalAlert('KEY','Enter was clicked')
      return
    }
    curNumber = curNumber + entry;
    document.getElementById("memberInput").value = curNumber;

    // IF 6 DIGITS HAVE BEEN ENTERED, CHECK FOR 'SETTINGS' CODE
    if (curNumber.length == 6) {
      villageID = curNumber
      url = '/displayMemberData?villageID='+villageID+'&location='+currentLocation
      location.href=url
      return
      }
    //document.getElementById('memberInput').focus()
    return
})

function clearScreen() {
    entry='';
    curNumber="";
    document.getElementById("memberInput").value = "";
    document.getElementById('notFoundID').innerHTML = ''
  }


// function lookupMember(villageID) {
//     console.log('villageID - '+villageID)
//     //console.log('location - '+location)
//     shopLocation = 'BW'

//     let dataToSend = {
//         villageID: villageID,
//         location: shopLocation
//     };

//     fetch(`${window.origin}/lookUpMember`, {
//         method: "POST",
//         credentials: "include",
//         body: JSON.stringify(dataToSend),
//         cache: "no-cache",
//         headers: new Headers({
//             "content-type": "application/json"
//         })
//     })
//     .then((res) => res.json())
//     .then((data) => {
//         clearMemberData()
//         if (data.status < 200 || data.status > 299) {
//             alert('An error has occurred. ' + data.statusText + ' status code ' + data.status)
//             return
//         }
        
//         memberName = document.getElementById('memberName')
//         memberName.innerHTML = data.memberName
        
//         if (data.status == 201) {
//             // Member not found
//             document.getElementById('memberID').value = ""
//             return
//         }
//         // SUCCESS - Member was found
//         // Build machine list
//         machinesSection = document.getElementById('machinesSection')

//         machine = data.machineDict
//         if (machine.length == 0){
//             // If no machines, display message
//             var divNoMachines = document.createElement('div')
//             divNoMachines.innerHTML = "No machines have been certified for this member."
//             divNoMachines.style.width = '400px'
//             divNoMachines.style.margin = 'auto'
//             machinesSection.appendChild(divNoMachines)
//             return
//         }
        
//         // BUILD HEADINGS FOR LIST OF MACHINES
//         // Insert a <br> after name
//         var breakElement = document.createElement('br')
//         nameSection.appendChild(breakElement)

//         // Display the prompt - Select a machine:
//         // machinesSection = document.getElementById('machinesSection')
//         // divHdg = document.createElement('div')
//         // divHdg.innerHTML = 'Select a machine:'
//         // divHdg.style.marginLeft='20px'
//         // machinesSection.appendChild(divHdg)
      
//         // List the machines the member is certified
//         for (m of machine) {
//             // BUILD THE ROW
//             var divRow = document.createElement('div')
//             divRow.classList.add('row')
            
//             var selectBtn = document.createElement('btn')
//             selectBtn.innerHTML = 'SELECT'
//             selectBtn.classList.add('btn', 'btn-primary','btn-sm','selectBtn')
//             var printTicketSTR = "printTicket('" + m['machineID'] + "')"
//             console.log('printTicketSTR - ',printTicketSTR)
//             //selectBtn.onclick = printTicketSTR
//             selectBtn.setAttribute('onclick',printTicketSTR);
//             divRow.appendChild(selectBtn)

//             var divMachineDesc = document.createElement('div')
//             divMachineDesc.innerHTML = m['machineDesc']
//             divMachineDesc.classList.add('machineDesc')

//             divRow.appendChild(divMachineDesc)

//             // ADD THE ROW TO THE DETAIL SECTION
//             machinesSection.appendChild(divRow)
//         }

//         return
//     })
    
// }

function displayMemberCertificationsPage(villageID,location) {
  window.location()
}

function displayMemberCertifications(villageID,location) {
    console.log('villageID - '+villageID)
    //console.log('location - '+location)
    let dataToSend = {
        villageID: villageID,
        location: location
    };
    fetch(`${window.origin}/displayMemberData`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(dataToSend),
        cache: "no-cache",
        headers: new Headers({
            "content-type": "application/json"
        })
    })
.then((res) => res.json())
.then((data) => {
    console.log('data.msg - ' + data.msg)
    if (data.msg == "Member not found") {
        modalAlert('Member Lookup',data.msg)
        clearScreen()
        return
    }
    // Hide keypad
    keypad.style.display='none'

    // Erase member name
    memberName = document.getElementById('memberName')
    while (memberName.firstChild) {
        memberName.removeChild(memberName.lastChild)
    }

    // Display member name
    console.log('data.memberName - '+data.memberName)
    var divMemberName = document.createElement('div')
    divMemberName.innerHTML = data.memberName
    divMemberName.style.fontSize = '1.5rem'
    divMemberName.style.textAlign = 'center'
    divMemberName.style.marginTop = '20px'
    divMemberName.style.border='2px solid green'
    memberName.appendChild(divMemberName)
    
    // Erase machine list
    while (machinesCertified.firstChild) {
      machinesCertified.removeChild(machinesCertified.lastChild)
    }
    machine = data.certifiedMachines
    if (machine.length == 0){
        // If no machines, display message
        var divNoMachines = document.createElement('div')
        divNoMachines.innerHTML = "No machines have been certified."
        divNoMachines.style.width = '400px'
        divNoMachines.style.margin = 'auto'
        machinesCertified.appendChild(divNoMachines)
        return
    }
        
    // BUILD HEADINGS FOR LIST OF MACHINES
    var breakElement = document.createElement('br')
    machinesCertified.appendChild(breakElement)

    var divHdgRow = document.createElement('div')
    divHdgRow.classList.add('row', 'selectLine')
    divHdgRow.innerHTML="<h6>Select one of the following -</h6>"
    divHdgRow.style.marginTop='20px'
    machinesCertified.appendChild(divHdgRow)

    machinesCertified.appendChild(breakElement)

    for (m of machine) {
        // BUILD THE ROW
        var divRow = document.createElement('div')
        divRow.style.marginTop='10px'
        divRow.classList.add('row')
        
        var selectBtn = document.createElement('btn')
        selectBtn.innerHTML = 'SELECT'
        selectBtn.classList.add('btn', 'btn-primary','btn-xs','selectBtn')
        selectBtn.style.marginLeft= '110px'

        var checkOutMachineSTR = "checkOutMachine('" + m['machineID'] + "')"
        selectBtn.setAttribute('onclick',checkOutMachineSTR);
        divRow.appendChild(selectBtn)

        var divMachineDesc = document.createElement('div')
        divMachineDesc.innerHTML = m['machineDesc']
        divMachineDesc.style.fontSize='1.5rem'
        divMachineDesc.style.marginLeft ='20px'
        divMachineDesc.style.paddingTop='2px'
        divRow.appendChild(divMachineDesc)

        // ADD THE ROW TO THE DETAIL SECTION
        machinesCertified.appendChild(divRow)
    }
    return
    })
}


function modalAlert(title,msg) {
	document.getElementById("modalTitle").innerHTML = title
	document.getElementById("modalBody").innerHTML= msg
	$('#myModalMsg').modal('show')
}

function closeModal() {
	$('#myModalMsg').modal('hide')
}

// function clearMemberData() {
//     // Clear previous member data
//     //memberID = document.getElementById('memberID')
//     memberID.value = ''
//     memberName = document.getElementById('memberName')
//     memberName.innerHTML = ''
//     machinesSection = document.getElementById('machinesSection')

//     // Erase machine list
//     while (machinesSection.firstChild) {
//         machinesSection.removeChild(machinesSection.lastChild)
//     }
//     window.focus()
//     document.getElementById("memberID").focus();

// }

// function printTicket(machineID) {
//     console.log('machineID - '+machineID)
//     //alert('Print a ticket for '+ machineID)
//     //window.location.href = '/printTicket?machineID=' + machineID + '&villageID=' + currentMemberID  

//     let dataToSend = {
//         villageID: currentMemberID,
//         machineID: machineID
//     };

//     fetch(`${window.origin}/printTicket`, {
//         method: "POST",
//         credentials: "include",
//         body: JSON.stringify(dataToSend),
//         cache: "no-cache",
//         headers: new Headers({
//             "content-type": "application/json"
//         })
//     })
//     .then((res) => res.json())
//     .then((data) => {
//         if (data.status < 200 || data.status > 299) {
//             alert('An error has occurred. ' + data.statusText + ' status code ' + data.status)
//             return
//         }
//         // Populate ticket
//         console.log('ticketDate - '+data.ticketDate)

//         ticketDate = document.getElementById('ticketDate')
//         ticketDate.innerHTML = data.ticketDate
//         ticketName = document.getElementById('ticketName')
//         ticketName.innerHTML = data.ticketName
//         ticketMachineDesc = document.getElementById('ticketMachineDesc')
//         ticketMachineDesc.innerHTML = data.ticketMachineDesc
//         ticketMachineID = document.getElementById('ticketMachineID')
//         ticketMachineID.innerHTML = "Key # " + data.ticketMachineID

//         // Print ticket
//         window.print();

//         // Clear screen
//         clearMemberData()
//         return
//     })     
// }

// function printTicket2(machineID) {
//     let text = window.open();
//     text.document.body.innerHTML = 'some content for '+ machineID;
//     text.print();
// }
// END OF FUNCTIONS
