// index.js

shopChoice = document.getElementById("shopChoice")

// EVENT LISTENERS
document.getElementById("machineSelected").addEventListener("change",displayMachineCertifications)
document.getElementById("memberSelected").addEventListener("change",displayMemberCertifications)
shopChoice.addEventListener("change",locationChange)

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
            var sData = $(this).data('location');
            if (sData != currentLocation){
                $(this).hide();
            }
        })
    }
}
function displayMachineCertifications() {
    var e = document.getElementById("machineSelected");
    var option = e.options[e.selectedIndex];
    
    //var attrs = option.attributes;
    
    machineID = $('option:selected', this).attr("data-machineID");
    
    var dataToSend = {
        villageID: villageID
    };
    fetch(`${window.origin}/displayMachineData`, {
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
        console.log('show machine data')
        // Build list of members certified for this machine
        console.log('building list of members certified, if any')
        return
    })
}
    function displayMemberCertifications() {
        var e = document.getElementById("memberSelected");
        var option = e.options[e.selectedIndex]; 
        villageID = $('option:selected', this).attr("data-memberID");
        
        var dataToSend = {
            villageID: villageID
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

// END OF FUNCTIONS
