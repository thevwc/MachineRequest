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
const instructorsORmembersBtns = document.getElementById("instructorsORmembersBtns")

// EVENT LISTENERS
shopChoice.addEventListener("change",locationChange)
machineSelected.addEventListener("change",machineChange)
memberSelected.addEventListener("change",memberChange)
instructorSelected.addEventListener("change",instructorChange)
largeScreen.addEventListener("change",handleMediaChange)
machineInstructorBtn.addEventListener("click",displayMachineInstructors)
machineMemberBtn.addEventListener("click",displayMembersCertifiedOnSpecificMachine)


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

function machineChange() {
    // CLEAR OTHER SELECTIONS
    if (machineSelected.selectedIndex != 0) {
        memberSelected.selectedIndex = 0
        instructorSelected.selectedIndex = 0
    }
    // HIDE MEMBER AND INSTRUCTOR SECTIONS IF NOT ON LARGE SCREEN
    if (!largeScreen.matches) {
        machineSection.style.display="block"
        memberSection.style.display="none"
        instructorSection.style.display="none"
    }
    // GET MACHINE DATA TO DISPLAY
    instructorsORmembersBtns.style.display="block"
    
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
function displayMembersCertifiedOnSpecificMachine() {
    let e = document.getElementById("machineSelected");
    machineID = e.options[e.selectedIndex].getAttribute('data-machineid')
    //docx = document.querySelector("#machineSelected")
    //machinex = docx.options[docx.selectedIndex].getAttribute('data-machineid')
    //alert('machineID - '+machineID)

    //machineID = $('option:selected', this).attr('data-machineid').value;
    //alert('machineID - '+machineID)
    let dataToSend = {
        machineID: machineID
    };
    fetch(`${window.origin}/displayMembersCertifiedOnSpecificMachine`, {
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
        if (data.msg == "Machine not found") {
            modalAlert('Machine Lookup',data.msg)
            return
        }
        // Populate machine fields; show machine fields
        certified = data.certifiedDict
        if (certified.length == 0){
            alert('no members certified')
        }
        else {
            alert('Count - '+ certified.length)
        }
        alert('dict - '+data.certifiedDict)
        
        for (i=0; i<certified.length;i++) {
            console.log('Certified member -'+ certified[i]['member_ID'])
        }

        console.log('show machine data')
        // Build list of members certified for this machine
        console.log('building list of members certified, if any')
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

function displayMachineInstructors() {
    alert('display machine Instructors routine')
}


// END OF FUNCTIONS
