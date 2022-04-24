

function printInlineTicket(machineID) {
    console.log('machineID - '+machineID)
    //alert('Print inline ticket for '+ machineID)
    //window.location.href = '/printTicket?machineID=' + machineID + '&villageID=' + currentMemberID  
    villageID = document.getElementById('memberID').innerText
    let dataToSend = {
        villageID: villageID,
        machineID: machineID
    };

    fetch(`${window.origin}/printInlineTicket`, {
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

function printTicket2(machineID) {
    alert('printTicket2')
    villageID = document.getElementById('memberID').innerText
    url = '/printESCticket?villageID='+villageID+'&machineID='+machineID
    window.location.href=url
}

function printTicketPage(machineID) {
    alert('printTicketPage')
    villageID = document.getElementById('memberID').innerText
    url = '/printTicketPage?villageID='+villageID+'&machineID='+machineID
    window.location.href=url
}
// END OF FUNCTIONS
