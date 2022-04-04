// index.js
const shopChoice = document.getElementById("shopChoice")
console.log('shopChoice - '+shopChoice.value)

const machineSelected = document.getElementById("machineSelected")
const memberSelected = document.getElementById("memberSelected")
const instructorSelected = document.getElementById("instructorSelected")
const machineSection = document.getElementById("machineSection")
const memberSection = document.getElementById("memberSection")
const instructorSection = document.getElementById("instructorSection")
const largeScreen = window.matchMedia("(min-width: 992px)")
const machineInstructorBtn = document.getElementById("machineInstructorBtn")
const machineMemberBtn = document.getElementById("machineMemberBtn")
const machineInstructorsAndMembers = document.getElementById("machineInstructorsAndMembers")

// EVENT LISTENERS
shopChoice.addEventListener("change",locationChange)
machineSelected.addEventListener("click",machineClicked)
memberSelected.addEventListener("change",memberChange)
instructorSelected.addEventListener("change",instructorChange)
largeScreen.addEventListener("change",handleMediaChange)


// CODE EXECUTED EVERY TIME
handleMediaChange(largeScreen)


// FUNCTIONS

// SHOW/HIDE MACHINE LIST OPTIONS BASED ON LOCATION SELECTION
function locationChange() {
    // SHOW ALL MACHINES
    $('.optMachineName').each(function(){
        $(this).show();
    })
    if (shopChoice.value != 'BOTH') {
        // HIDE OPTION IF THE data.location MATCHES THE SELECTED LOCATION
        let currentLocation = shopChoice.value
        $('.optMachineName').each(function(){
            let sData = $(this).data('location');
            if (sData != currentLocation){
                $(this).hide();
            }
        })
    }
}

function machineClicked() {
    // CLEAR OTHER SELECTIONS
    if (machineSelected.selectedIndex != 0) {
        memberSelected.selectedIndex = 0
        instructorSelected.selectedIndex = 0
    }
    else {
        return
    }
    // HIDE MEMBER AND INSTRUCTOR SECTIONS IF NOT ON LARGE SCREEN
    if (!largeScreen.matches) {
        machineSection.style.display="block"
        memberSection.style.display="none"
        instructorSection.style.display="none"
    }
    // GET MACHINE DATA TO DISPLAY
    machineInstructorsAndMembers.style.display="block"
    displayMachineInstructorsAndMembers()
}

function memberChange() {
    // CLEAR OTHER SELECTIONS
    if (memberSelected.selectedIndex != 0) {
        machineSelected.selectedIndex = 0
        instructorSelected.selectedIndex = 0
    }
    // HIDE MACHINE AND INSTRUCTOR SECTIONS IF NOT ON LARGE SCREEN
    if (!largeScreen.matches) { 
        machineSection.style.display="none"
        memberSection.style.display="block"
        instructorSection.style.display="none"
    }
    // GET MEMBER CONTACT INFO TO DISPLAY
    console.log(' ... call displayMemberCertifications')
    let option = memberSelected.options[memberSelected.selectedIndex]; 
    villageID = memberSelected.options[memberSelected.selectedIndex].getAttribute('data-villageid')
    // ...................................
    // ....PROGRAM ERRORS AT THE NEXT LINE  
    location=shopChoice.value
    //shopLocation = document.getElementById("shopChoice")
    //location=shopLocation.value
    // ....................................
    
    displayMemberCertifications(villageID,location)
}

function instructorChange() {
    // CLEAR OTHER SELECTIONS
    if (instructorSelected.selectedIndex != 0) {
        machineSelected.selectedIndex = 0
        memberSelected.selectedIndex = 0
    }
    // HIDE MACHINE AND MEMBER SECTIONS IF NOT ON LARGE SCREEN
    if (!largeScreen.matches) {
        machineSection.style.display="none"
        memberSection.style.display="none"
    }
    // GET INSTRUCTOR CONTACT DATA TO DISPLAY
    displayMachineInstructorData()
}

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
    console.log('location - '+location)
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
    // Clear previous member data
    dtlParent = document.getElementById('memberData')
    while (dtlParent.firstChild) {
        dtlParent.removeChild(dtlParent.lastChild)
    }

    // Display name and contact info
    members = data.memberList
    if (members.length == 0) {
        modalAlert("ERROR","Member ID not found.")
        return
    }
    var divMemberName = document.createElement('div')
    divMemberName.innerHTML = data.memberName
    divMemberName.style.textAlign='center'
    dtlParent.appendChild(divMemberName)

    var divHomePhone = document.createElement('div')
    divHomePhone.innerHTML = "Home phone " + data.homePhone
    divHomePhone.style.textAlign='right'
    dtlParent.appendChild(divHomePhone)

    var divMobilePhone = document.createElement('div')
    divMobilePhone.innerHTML = "Mobile phone " + data.mobilePhone
    divMobilePhone.style.textAlign='right'
    dtlParent.appendChild(divMobilePhone)

    var divEmail = document.createElement('div')
    divEmail.innerHTML = "Email " + data.eMail
    divEmail.style.textAlign='right'
    dtlParent.appendChild(divEmail)
    // Populate member fields; show member fields

    console.log('show member contact data')
    // Build list of machines certified and not certified for this member
    
    console.log('building list of all possible machines for this location (BOTH, RA, or BW')
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

function handleMediaChange(e) {
    if (e.matches) {
        // LOGIC FOR SCREENS 992 OR LARGER
        machineSection.style.display="block"
        memberSection.style.display="block"
        instructorSection.style.display="block"
    }
    else {
        machineSection.style.display="none"
        memberSection.style.display="none"
        instructorSection.style.display="none"
    }
}

function displayMachineInstructorData() {
    console.log('display machine Instructors routine')
    let e = document.getElementById("instructorSelected");
    instructorID = e.options[e.selectedIndex].getAttribute('data-villageid')
    let dataToSend = {
        instructorID: instructorID
    };
    fetch(`${window.origin}/displayMachineInstructors`, {
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
        console.log('status - '+data.status)
        if (data.msg == "Instructor not found") {
            modalAlert("Instructor Lookup",data.msg)
        }

        if (data.status == 400) {
            modalAlert('Machine Lookup',data.msg)
            return
        }
        // Clear previous instructor and member data
        dtlParent = document.getElementById('instructorData')
        while (dtlParent.firstChild) {
            dtlParent.removeChild(dtlParent.lastChild);
        }
        
        // Display Instructor Contact Data
        var divInstructorName = document.createElement('div')
        divInstructorName.innerHTML = data.instructorName
        divInstructorName.style.textAlign='left'
        dtlParent.appendChild(divInstructorName)

        var divHomePhone = document.createElement('div')
        divHomePhone.innerHTML = "Home phone - " + data.homePhone
        divHomePhone.style.textAlign='left'
        dtlParent.appendChild(divHomePhone)

        var divMobilePhone = document.createElement('div')
        divMobilePhone.innerHTML = "Mobile phone - " + data.mobilePhone
        divMobilePhone.style.textAlign='left'
        dtlParent.appendChild(divMobilePhone)

        var divEmail = document.createElement('div')
        divEmail.innerHTML = "Email - " + data.eMail
        divEmail.style.textAlign='left'
        dtlParent.appendChild(divEmail)
        
        
        // Display machines instructor may certify with check boxes


        
        return
    })
}


// END OF FUNCTIONS
