

function printInlineTicket(machineID) {
    console.log('machineID - '+machineID)
    villageID = document.getElementById('memberID').innerText
    shopLocation = localStorage.getItem('shopLocation')
    console.log('location - '+shopLocation)
    isAuthorizedID = 'A'+machineID
    console.log('isAuthorizedID - '+isAuthorizedID)
    if (document.getElementById(isAuthorizedID)) {
        isAuthorized = document.getElementById(isAuthorizedID).innerHTML
    }
    else {
        isAuthorized = ''
    }
    console.log('isAuthorized - ',isAuthorized)

    let dataToSend = {
        villageID: villageID,
        machineID: machineID,
        shopLocation: shopLocation,
        isAuthorized: isAuthorized
    };
    console.log('window.origin - '+window.origin)

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
        console.log('data.status - '+data.status)
        if (data.status < 200 || data.status > 299) {
            alert('An error has occurred. ' + data.statusText + ' status code ' + data.status)
            return
        }
        // Populate ticket
        console.log('ticketDate - '+data.ticketDate)
        console.log('ticketName - '+data.ticketName)
        ticketDate = document.getElementById('ticketDate')
        ticketDate.innerHTML = data.ticketDate
        ticketName = document.getElementById('ticketName')
        ticketName.innerHTML = data.ticketName
        ticketMachineDesc = document.getElementById('ticketMachineDesc')
        ticketMachineDesc.innerHTML = data.ticketMachineDesc
        ticketMachineID = document.getElementById('ticketMachineID')
        
        // CLEAR THE DETAIL SECTION
        parent = document.getElementById('ticketBodyDetail')
        while (parent.firstChild) {
            parent.removeChild(parent.lastChild)
        }
        if (isAuthorized == 'AUTHORIZED') {
            ticketMachineID.innerHTML = "Key # " + data.ticketMachineID
        }
        else {
            ticketMachineID.innerHTML = ""
        }

        // IF AUTHORIZED AND KEY IS KEPT IN THE TOOL CRIB ...
        if (isAuthorized = 'AUTHORIZED' && data.keyInToolCrib) {
            //display msg to pick up key at the tool crib
            divRow1 = document.createElement('div')
            divRow1.classList.add('row')

            divRow1Data = document.createElement('div')
            divRow1Data.classList.add("col-12","msgLine1")
            divRow1Data.innerHTML = "Take this slip to the tool crib."
            divRow1.appendChild(divRow1Data)
            parent.appendChild(divRow1)

            divRow2 = document.createElement('div')
            divRow2.classList.add('row')

            divRow2Data = document.createElement('div')
            divRow2Data.classList.add('msgLine2','col-12')
            divRow2Data.innerHTML = "msgLine2"
            divRow2.appendChild(divRow2Data)
            parent.appendChild(divRow2)

        }

        // If authorized and key provider ---
        if (isAuthorized = 'AUTHORIZED' && data.callKeyProvider) {
            //  please contact one of the following for the machine lock key --
            divRow1 = document.createElement('div')
            divRow1.classList.add('row')

            divRow1Data = document.createElement('div')
            divRow1Data.classList.add("col-12","msgLine1")
            divRow1Data.innerHTML = "Contact one of the following members for the key."
            divRow1.appendChild(divRow1Data)
            parent.appendChild(divRow1)
            
            // LIST OF KEY PROVIDERS
            keyProviders = data.keyProvidersDict
            for (var element of keyProviders) {
                console.log('keyProviders element - ' + element.name)
            }
        }
 
        // If not authorized ---
        if (isAuthorized != 'AUTHORIZED') {
             //"You have not been authorized to use this equipment without assistance."
            //  divRow1 = document.createElement('div')
            //  divRow1.classList.add('row')
 
            //  divRow1Data = document.createElement('div')
            //  divRow1Data.innerHTML = "Contact one of the following members to arrange a time for their assistance."
 
            //  divRow1.appendChild(divRow1Data)
            //  parent.appendChild(divRow1)
            
             // LIST OF ASSISTANTS FOR THIS MACHINE
             assistants = data.assistantsDict
            for (var element of assistants) {
                console.log('assistants element - ' + element.name)
            }
        }

        // Print ticket
        window.print();

        // Clear screen
        //clearMemberData()
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
