// index.js
window.focus()
document.getElementById("memberID").focus();

// Constants
const memberID = document.getElementById('memberID')
const clearBtn = document.getElementById('clearBtn')
let currentMemberID = ''

// EventListeners
memberID.addEventListener('keyup',inputKeypress)
clearBtn.addEventListener('click',clearMemberData)


// FUNCTIONS

function inputKeypress() {
    inputData = memberID.value
    //console.log('keyPress rtn - ' + inputData)
    if (inputData.length < 6) {
        return
    }
    if (inputData.length > 6) {
        modalAlert('ERROR','Too many characters entered.')
        return
    }
    console.log('... call lookupMember' + inputData)
    currentMemberID = inputData 
    lookupMember(inputData)
}

function lookupMember(villageID) {
    console.log('villageID - '+villageID)
    //console.log('location - '+location)
    shopLocation = 'BW'

    let dataToSend = {
        villageID: villageID,
        location: shopLocation
    };

    fetch(`${window.origin}/lookUpMember`, {
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
        clearMemberData()
        if (data.status < 200 || data.status > 299) {
            alert('An error has occurred. ' + data.statusText + ' status code ' + data.status)
            return
        }
        
        memberName = document.getElementById('memberName')
        memberName.innerHTML = data.memberName
        
        if (data.status == 201) {
            // Member not found
            document.getElementById('memberID').value = ""
            return
        }
        // SUCCESS - Member was found
        // Build machine list
        machinesSection = document.getElementById('machinesSection')

        machine = data.machineDict
        if (machine.length == 0){
            // If no machines, display message
            var divNoMachines = document.createElement('div')
            divNoMachines.innerHTML = "No machines have been certified for this member."
            divNoMachines.style.width = '400px'
            divNoMachines.style.margin = 'auto'
            machinesSection.appendChild(divNoMachines)
            return
        }
        
        // BUILD HEADINGS FOR LIST OF MACHINES
        // Insert a <br> after name
        var breakElement = document.createElement('br')
        nameSection.appendChild(breakElement)

        // Display the prompt - Select a machine:
        // machinesSection = document.getElementById('machinesSection')
        // divHdg = document.createElement('div')
        // divHdg.innerHTML = 'Select a machine:'
        // divHdg.style.marginLeft='20px'
        // machinesSection.appendChild(divHdg)
      
        // List the machines the member is certified
        for (m of machine) {
            // BUILD THE ROW
            var divRow = document.createElement('div')
            divRow.classList.add('row')
            
            var selectBtn = document.createElement('btn')
            selectBtn.innerHTML = 'SELECT'
            selectBtn.classList.add('btn', 'btn-primary','btn-sm','selectBtn')
            var printTicketSTR = "printTicket('" + m['machineID'] + "')"
            console.log('printTicketSTR - ',printTicketSTR)
            //selectBtn.onclick = printTicketSTR
            selectBtn.setAttribute('onclick',printTicketSTR);
            divRow.appendChild(selectBtn)

            var divMachineDesc = document.createElement('div')
            divMachineDesc.innerHTML = m['machineDesc']
            divMachineDesc.classList.add('machineDesc')

            divRow.appendChild(divMachineDesc)

            // ADD THE ROW TO THE DETAIL SECTION
            machinesSection.appendChild(divRow)
        }

        return
    })
    
}

// function displayMachineInstructorsAndMembers() {
//     let e = document.getElementById("machineSelected");
//     machineID = e.options[e.selectedIndex].getAttribute('data-machineid')
//     let dataToSend = {
//         machineID: machineID
//     };
//     fetch(`${window.origin}/displayMachineInstructorsAndMembers`, {
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
//         if (data.msg == "Machine not found") {
//             modalAlert('Machine Lookup',data.msg)
//             return
//         }
//         // Clear previous instructor and member data
//         dtlParent = document.getElementById('machineInstructorsAndMembers')
//         while (dtlParent.firstChild) {
//             dtlParent.removeChild(dtlParent.lastChild);
//         }

//         // Display Instructor heading
//         var divInstructorHdg = document.createElement('div')
//         divInstructorHdg.classList.add('InstructorListHdg')
//         divInstructorHdg.innerHTML = "Instructors:"
//         divInstructorHdg.style.textAlign = 'left'
//         divInstructorHdg.style.marginLeft = '30px'
//         dtlParent.appendChild(divInstructorHdg)

//         // Display List of Instructors
//         instructors = data.instructorsList
//         if (instructors.length == 0) {
//             var divNoInstructors = document.createElement('div')
//             divNoInstructors.classList.add('NoInstructors')
//             divNoInstructors.innerHTML = "No instructors assigned."
//             divNoInstructors.style.width = '400px'
//             divNoInstructors.style.paddingLeft = '60px'
//             dtlParent.appendChild(divNoInstructors)
//         }
//         else {
//             for (i=0;i<instructors.length;i++) {
//                 var divName = document.createElement('div')
//                 divName.classList.add('InstructorName')
//                 divName.innerHTML = instructors[i]
//                 divName.style.paddingLeft = '60px'
//                 divName.style.width = '400px'
            
//                 dtlParent.appendChild(divName)
//             }
//         }

//         // Display 'Certified Members' heading
//         var divMemberHdg = document.createElement('div')
//         divMemberHdg.classList.add('MemberListHdg')
//         divMemberHdg.innerHTML = "Certified Members:"
//         divMemberHdg.style.textAlign = 'left'
//         divMemberHdg.style.paddingTop = '30px'
//         divMemberHdg.style.paddingLeft = '30px'
//         dtlParent.appendChild(divMemberHdg)

//         // Display list of members certified for this machine
//         certified = data.certifiedDict
//         if (certified.length == 0){
//             // If no members, display message
//             var divNoMembers = document.createElement('div')
//             divNoMembers.classList.add('NoMembers')
//             divNoMembers.innerHTML = "No members have been certified."
//             divNoMembers.style.width = '400px'
//             divNoMembers.style.marginLeft = '60px'
//             dtlParent.appendChild(divNoMembers)
//         }
//         else {
//             for (var element of certified) {
//                 var divMemberName = document.createElement('div')
//                 divMemberName.classList.add('CertifiedMemberName')
//                 divMemberName.innerHTML = element['memberName']
//                 divMemberName.style.width = '400px'
//                 divMemberName.style.marginLeft = '60px'
//                 dtlParent.appendChild(divMemberName)
//             }
//         }
//         return
//     })
// }
// function displayMemberCertifications(villageID,location) {
//     console.log('villageID - '+villageID)
//     //console.log('location - '+location)
//     let dataToSend = {
//         villageID: villageID,
//         location: location
//     };
//     fetch(`${window.origin}/displayMemberData`, {
//         method: "POST",
//         credentials: "include",
//         body: JSON.stringify(dataToSend),
//         cache: "no-cache",
//         headers: new Headers({
//             "content-type": "application/json"
//         })
//     })
// .then((res) => res.json())
// .then((data) => {
//     console.log('data.msg - ' + data.msg)
//     if (data.msg == "Member not found") {
//         modalAlert('Member Lookup',data.msg)
//         return
//     }
    
//     clearMemberData()
//     memberData = document.getElementById('memberData')

//     // Display member name
//     var divMemberName = document.createElement('div')
//     divMemberName.innerHTML = data.memberName
//     divMemberName.style.fontSize = 'large'
//     divMemberName.style.textAlign = 'center'
//     divMemberName.style.margin = 'auto'
//     memberData.appendChild(divMemberName)
    

//     machine = data.machineDict
//     if (machine.length == 0){
//         // If no machines, display message
//         var divNoMachines = document.createElement('div')
//         divNoMachines.innerHTML = "No machines have been certified."
//         divNoMachines.style.width = '400px'
//         divNoMachines.style.margin = 'auto'
//         memberData.appendChild(divNoMachines)
//         return
//     }
        
//     // BUILD HEADINGS FOR LIST OF MACHINES
//     var breakElement = document.createElement('br')
//     memberData.appendChild(breakElement)

//     var divHdgRow = document.createElement('div')
//     divHdgRow.classList.add('row', 'headings')
//     divHdgRow.innerHTML="<h6>Select one of the following -</h6>"
//     divHdgRow.margin='auto'
//     memberData.appendChild(divHdgRow)

//     memberData.appendChild(breakElement)

//     for (m of machine) {
//         // BUILD THE ROW
//         var divRow = document.createElement('div')
//         divRow.classList.add('row')
        
//         var selectBtn = document.createElement('btn')
//         selectBtn.innerHTML = 'SELECT'
//         divRow.appendChild('selectBtn')

//         var divMachineDesc = document.createElement('div')
//         divMachineDesc.innerHTML = m['machineDesc']
//         divRow.appendChild(divMachineDesc)

//         // ADD THE ROW TO THE DETAIL SECTION
//         memberData.appendChild(divRow)
//     }
//     return
//     })
// }


function modalAlert(title,msg) {
	document.getElementById("modalTitle").innerHTML = title
	document.getElementById("modalBody").innerHTML= msg
	$('#myModalMsg').modal('show')
}

function closeModal() {
	$('#myModalMsg').modal('hide')
}

function clearMemberData() {
    // Clear previous member data
    //memberID = document.getElementById('memberID')
    memberID.value = ''
    memberName = document.getElementById('memberName')
    memberName.innerHTML = ''
    machinesSection = document.getElementById('machinesSection')

    // Erase machine list
    while (machinesSection.firstChild) {
        machinesSection.removeChild(machinesSection.lastChild)
    }
    window.focus()
    document.getElementById("memberID").focus();

}

function printTicket(machineID) {
    console.log('machineID - '+machineID)
    //alert('Print a ticket for '+ machineID)
    //window.location.href = '/printTicket?machineID=' + machineID + '&villageID=' + currentMemberID  

    let dataToSend = {
        villageID: currentMemberID,
        machineID: machineID
    };

    fetch(`${window.origin}/printTicket`, {
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
        if (data.status < 200 || data.status > 299) {
            alert('An error has occurred. ' + data.statusText + ' status code ' + data.status)
            return
        }
        // Populate ticket
        console.log('ticketDate - '+data.ticketDate)

        ticketDate = document.getElementById('ticketDate')
        ticketDate.innerHTML = data.ticketDate
        ticketName = document.getElementById('ticketName')
        ticketName.innerHTML = data.ticketName
        ticketMachineDesc = document.getElementById('ticketMachineDesc')
        ticketMachineDesc.innerHTML = data.ticketMachineDesc
        ticketMachineID = document.getElementById('ticketMachineID')
        ticketMachineID.innerHTML = "Key # " + data.ticketMachineID

        // Print ticket
        window.print();

        // Clear screen
        clearMemberData()
        return
    })     
}

// function printTicket2(machineID) {
//     let text = window.open();
//     text.document.body.innerHTML = 'some content for '+ machineID;
//     text.print();
// }
// END OF FUNCTIONS
