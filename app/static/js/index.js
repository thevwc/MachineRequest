// index.js
const shopChoice = document.getElementById("shopChoice")
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
        instructorsORmembersBtns.style.display="none"
    }
    // HIDE MACHINE AND INSTRUCTOR SECTIONS IF NOT ON LARGE SCREEN
    if (!largeScreen.matches) { 
        machineSection.style.display="none"
        memberSection.style.display="block"
        instructorSection.style.display="none"
    }
    // GET MEMBER CONTACT INFO TO DISPLAY
}

function instructorChange() {
    // CLEAR OTHER SELECTIONS
    if (instructorSelected.selectedIndex != 0) {
        machineSelected.selectedIndex = 0
        memberSelected.selectedIndex = 0
        instructorsORmembersBtns.style.display="none"
    }
    // HIDE MACHINE AND MEMBER SECTIONS IF NOT ON LARGE SCREEN
    if (!largeScreen.matches) {
        machineSection.style.display="none"
        memberSection.style.display="none"
        instructorSection.style.display="block"
    }
    // GET INSTRUCTOR CONTACT DATA TO DISPLAY
}
// function displayMembersCertifiedOnSpecificMachine() {
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
        const divInstructorHdg = document.createElement('div')
        divInstructorHdg.classList.add('InstructorListHdg')
        divInstructorHdg.innerHTML = "Instructors:"
        divInstructorHdg.style.textAlign = 'left'
        divInstructorHdg.style.marginLeft = '30px'
        dtlParent.appendChild(divInstructorHdg)

        // Display List of Instructors
        instructors = data.instructorsList
        if (instructors.length == 0) {
            const divNoInstructors = document.createElement('div')
            divNoInstructors.classList.add('NoInstructors')
            divNoInstructors.innerHTML = "No instructors assigned."
            divNoInstructors.style.width = '400px'
            divNoInstructors.style.paddingLeft = '60px'
            dtlParent.appendChild(divNoInstructors)
        }
        else {
            for (i=0;i<instructors.length;i++) {
                const divName = document.createElement('div')
                divName.classList.add('InstructorName')
                divName.innerHTML = instructors[i]
                divName.style.paddingLeft = '60px'
                divName.style.width = '400px'
            
                dtlParent.appendChild(divName)
            }
        }

        // Display 'Certified Members' heading
        const divMemberHdg = document.createElement('div')
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
            const divNoMembers = document.createElement('div')
            divNoMembers.classList.add('NoMembers')
            divNoMembers.innerHTML = "No members have been certified."
            divNoMembers.style.width = '400px'
            divNoMembers.style.marginLeft = '60px'
            dtlParent.appendChild(divNoMembers)
        }
        else {
            for (const element of certified) {
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
    function displayMemberCertifications() {
        let e = document.getElementById("memberSelected");
        let option = e.options[e.selectedIndex]; 
        villageID = $('option:selected', this).attr("data-memberid");
        location = shopChoice.value

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

// function displayMachineInstructors() {
//     console.log('display machine Instructors routine')
//     let e = document.getElementById("machineSelected");
//     machineID = e.options[e.selectedIndex].getAttribute('data-machineid')
//     let dataToSend = {
//         machineID: machineID
//     };
//     fetch(`${window.origin}/displayMachineInstructors`, {
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
//         console.log('status - '+data.status)
        
//         if (data.status == 400) {
//             modalAlert('Machine Lookup',data.msg)
//             return
//         }
    
//         // Build list of instructors for this machine
        
//         if (data-status == 201){
//             modalAlert('Certification','No instructors have been approved for this machine.')
//             return
//         }
        
//         return
//     })
// }


// END OF FUNCTIONS
