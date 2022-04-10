// index.js
window.focus()
document.getElementById("memberID").focus();

const memberID = document.getElementById('memberID')
memberID.addEventListener('keyup',inputKeypress)

//const memberSelected = document.getElementById("memberSelected")
//const memberSection = document.getElementById("memberSection")

// EVENT LISTENERS
//shopChoice.addEventListener("click",locationChange)
//memberSelected.addEventListener("click",memberClicked)


// FUNCTIONS

function inputKeypress() {
    inputData = memberID.value
    console.log('keyPress rtn - ' + inputData)
    if (inputData.length < 6) {
        return
    }
    if (inputData.length > 6) {
        modalAlert('ERROR','Too many characters entered.')
        return
    }
    alert('6 characters entered')
}
// SHOW/HIDE MACHINE LIST OPTIONS BASED ON LOCATION SELECTION

//function memberClicked() {
    // CLEAR OTHER SELECTIONS
//    if (memberSelected.selectedIndex == 0) {
//        return
//    }

    
    // GET MEMBER VILLAGE ID FROM MEMBER DROP DOWN LIST
//    let option = memberSelected.options[memberSelected.selectedIndex]; 
//    villageID = memberSelected.options[memberSelected.selectedIndex].getAttribute('data-villageid')
    
//    displayMemberCertifications(villageID)
//}


function displayMachineInstructorsAndMembers() {
    let e = document.getElementById("machineSelected");
    machineID = e.options[e.selectedIndex].getAttribute('data-machineid')
    let dataToSend = {
        machineID: machineID
    };
    fetch(`${window.origin}/displayMachineInstructorsAndMembers`, {
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
        if (data.msg == "Machine not found") {
            modalAlert('Machine Lookup',data.msg)
            return
        }
        // Clear previous instructor and member data
        dtlParent = document.getElementById('machineInstructorsAndMembers')
        while (dtlParent.firstChild) {
            dtlParent.removeChild(dtlParent.lastChild);
        }

        // Display Instructor heading
        var divInstructorHdg = document.createElement('div')
        divInstructorHdg.classList.add('InstructorListHdg')
        divInstructorHdg.innerHTML = "Instructors:"
        divInstructorHdg.style.textAlign = 'left'
        divInstructorHdg.style.marginLeft = '30px'
        dtlParent.appendChild(divInstructorHdg)

        // Display List of Instructors
        instructors = data.instructorsList
        if (instructors.length == 0) {
            var divNoInstructors = document.createElement('div')
            divNoInstructors.classList.add('NoInstructors')
            divNoInstructors.innerHTML = "No instructors assigned."
            divNoInstructors.style.width = '400px'
            divNoInstructors.style.paddingLeft = '60px'
            dtlParent.appendChild(divNoInstructors)
        }
        else {
            for (i=0;i<instructors.length;i++) {
                var divName = document.createElement('div')
                divName.classList.add('InstructorName')
                divName.innerHTML = instructors[i]
                divName.style.paddingLeft = '60px'
                divName.style.width = '400px'
            
                dtlParent.appendChild(divName)
            }
        }

        // Display 'Certified Members' heading
        var divMemberHdg = document.createElement('div')
        divMemberHdg.classList.add('MemberListHdg')
        divMemberHdg.innerHTML = "Certified Members:"
        divMemberHdg.style.textAlign = 'left'
        divMemberHdg.style.paddingTop = '30px'
        divMemberHdg.style.paddingLeft = '30px'
        dtlParent.appendChild(divMemberHdg)

        // Display list of members certified for this machine
        certified = data.certifiedDict
        if (certified.length == 0){
            // If no members, display message
            var divNoMembers = document.createElement('div')
            divNoMembers.classList.add('NoMembers')
            divNoMembers.innerHTML = "No members have been certified."
            divNoMembers.style.width = '400px'
            divNoMembers.style.marginLeft = '60px'
            dtlParent.appendChild(divNoMembers)
        }
        else {
            for (var element of certified) {
                var divMemberName = document.createElement('div')
                divMemberName.classList.add('CertifiedMemberName')
                divMemberName.innerHTML = element['memberName']
                divMemberName.style.width = '400px'
                divMemberName.style.marginLeft = '60px'
                dtlParent.appendChild(divMemberName)
            }
        }
        return
    })
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
        return
    }
    
    clearMemberData()
    memberData = document.getElementById('memberData')

    // Display member name
    var divMemberName = document.createElement('div')
    divMemberName.innerHTML = data.memberName
    divMemberName.style.fontSize = 'large'
    divMemberName.style.textAlign = 'center'
    divMemberName.style.margin = 'auto'
    memberData.appendChild(divMemberName)
    

    machine = data.machineDict
    if (machine.length == 0){
        // If no machines, display message
        var divNoMachines = document.createElement('div')
        divNoMachines.innerHTML = "No machines have been certified."
        divNoMachines.style.width = '400px'
        divNoMachines.style.margin = 'auto'
        memberData.appendChild(divNoMachines)
        return
    }
        
    // BUILD HEADINGS FOR LIST OF MACHINES
    var breakElement = document.createElement('br')
    memberData.appendChild(breakElement)

    var divHdgRow = document.createElement('div')
    divHdgRow.classList.add('row', 'headings')
    divHdgRow.innerHTML="<h6>Select one of the following -</h6>"
    divHdgRow.margin='auto'
    memberData.appendChild(divHdgRow)

    memberData.appendChild(breakElement)

    for (m of machine) {
        // BUILD THE ROW
        var divRow = document.createElement('div')
        divRow.classList.add('row')
        
        var selectBtn = document.createElement('btn')
        selectBtn.innerHTML = 'SELECT'
        divRow.appendChild('selectBtn')

        var divMachineDesc = document.createElement('div')
        divMachineDesc.innerHTML = m['machineDesc']
        divRow.appendChild(divMachineDesc)

        // ADD THE ROW TO THE DETAIL SECTION
        memberData.appendChild(divRow)
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

function clearMemberData() {
    // Clear previous member data
    memberData = document.getElementById('memberData')
    while (memberData.firstChild) {
        memberData.removeChild(memberData.lastChild)
    }
}
// END OF FUNCTIONS
