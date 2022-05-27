

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
        if (data.status < 200 || data.status > 299) {
            alert('An error has occurred. ' + data.statusText + ' status code ' + data.status)
            return
        }
        // Populate ticket
        ticketDate = document.getElementById('ticketDate')
        ticketDate.innerHTML = data.ticketDate
        ticketName = document.getElementById('ticketName')
        ticketName.innerHTML = data.ticketName
        ticketMachineDesc = document.getElementById('ticketMachineDesc')
        ticketMachineDesc.innerHTML = data.ticketMachineDesc
        ticketMachineID = document.getElementById('ticketMachineID')
        
        // CLEAR THE DETAIL SECTION
        //parent = document.getElementById('ticketBodyDetail')
        // while (parent.firstChild) {
        //     parent.removeChild(parent.lastChild)
        // }

        // CLEAR PREVIOUS MSG LINES
        msgLines = document.getElementById('msgLines')
        while (msgLines.firstChild) {
            msgLines.removeChild(msgLines.lastChild)
        }

        // CLEAR PREVIOUS LIST OF NAMES
        listOfNames = document.getElementById('listOfNames')
        while (listOfNames.firstChild) {
            listOfNames.removeChild(listOfNames.lastChild)
        }

        // SET TICKET TITLE
        if (data.isAuthorized == 'AUTHORIZED') {
            document.getElementById('ticketTitle').innerHTML = "AUTHORIZATION TICKET"
            ticketMachineID.innerHTML = "Key # " + data.ticketMachineID
        }
        else {
            document.getElementById('ticketTitle').innerHTML = "REQUEST FOR ASSISTANCE"
            ticketMachineID.innerHTML = ""
        }
        
        // IF AUTHORIZED AND KEY IS KEPT IN THE TOOL CRIB ...
        if (data.isAuthorized == 'AUTHORIZED' && data.keyInToolCrib) {
            // DISPLAY MSG TO PICK UP KEY AT TOOL CRIB
            brk = document.createElement('br')
            msgLines.appendChild(brk)

            divRow1 = document.createElement('div')
            divRow1.classList.add('row')

            divRow1Data = document.createElement('div')
            divRow1Data.classList.add("col-12","msgLine1")
            divRow1Data.innerHTML = "Take this slip to the tool crib."
            divRow1.appendChild(divRow1Data)
            msgLines.appendChild(divRow1)

            divRow2 = document.createElement('div')
            divRow2.classList.add('row')

            divRow2Data = document.createElement('div')
            divRow2Data.classList.add('msgLine2','col-12')
            divRow2Data.innerHTML = ""
            divRow2.appendChild(divRow2Data)
            msgLines.appendChild(divRow2)

        }

        // If authorized and key provider ---
        if (data.isAuthorized == 'AUTHORIZED' && data.keyProvider) {
            //  please contact one of the following for the machine lock key --
            //alert('enter keyProvider rtn')
            divRow1 = document.createElement('div')
            divRow1.classList.add('row')

            divRow1Data = document.createElement('div')
            divRow1Data.classList.add("col-12","msgLine1")
            divRow1Data.innerHTML = "Contact one of the following members for the key."
            divRow1.appendChild(divRow1Data)
            listOfNames.appendChild(divRow1)
            
            // LIST OF KEY PROVIDERS
            keyProviders = data.keyProvidersDict
            // if (keyProviders.length == 0) {
            //     alert('empty keyProvidersDict')
            // }
            
            for (var element of keyProviders) {
                divRow = document.createElement('div')
                divRow.classList.add('row','kpRow')

                divCol1 = document.createElement('div')
                divCol1.classList.add('col-6','kpName')
                divCol1.innerHTML = element['name']
                divRow.appendChild(divCol1)

                divCol2 = document.createElement('div')
                divCol2.classList.add('col-5','kpInShopNow')
                divCol2.innerHTML = element['inShopNow']
                divRow.appendChild(divCol2)

                listOfNames.appendChild(divRow)
            }
        }
 
        // If not authorized ---
        if (isAuthorized != 'AUTHORIZED') {
            brk = document.createElement('br')
            listOfNames.appendChild(brk)
            //"You have not been authorized to use this equipment without assistance."

            divRow1 = document.createElement('div')
            divRow1.classList.add('row')

            divRow1Data = document.createElement('div')
            divRow1Data.classList.add("col-12","msgLine1")
            divRow1Data.innerHTML = "Contact one of the following members"
            divRow1.appendChild(divRow1Data)

            divRow1Data = document.createElement('div')
            divRow1Data.classList.add("col-12","msgLine2")
            divRow1Data.innerHTML = "to arrange a time for their assistance."
            divRow1.appendChild(divRow1Data)

            listOfNames.appendChild(divRow1)
        
             // LIST OF ASSISTANTS FOR THIS MACHINE
            assistants = data.assistantsDict
            for (var element of assistants) {
                divRow = document.createElement('div')
                divRow.classList.add('row','kpRow')

                divCol1 = document.createElement('div')
                divCol1.classList.add('col-6','kpName')
                divCol1.innerHTML = element['name']
                divRow.appendChild(divCol1)

                divCol2 = document.createElement('div')
                divCol2.classList.add('col-5','kpInShopNow')
                divCol2.innerHTML = element['inShopNow']
                divRow.appendChild(divCol2)

                listOfNames.appendChild(divRow)
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
