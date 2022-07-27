// HIDE EXTRA BUTTONS FOR TESTING RECEIPT PRINTER
villageID = document.getElementById('memberID').innerHTML

// if (villageID == '604875' || villageID == '373608' || villageID == '123456' || villageID == '492219') {
//     const escposBtnTest = document.getElementsByClassName('escposBtn')
//     for (const escPosBtn of escposBtnTest)
//         escPosBtn.style.display = 'block'
//     const prtTicketPageBtnTest = document.getElementsByClassName('prtTicketPageBtn')
//     for (const prtTicketPageBtn of prtTicketPageBtnTest)
//         prtTicketPageBtn.style.display = 'block'
// }

function getTicketData(machineID) {
    villageID = document.getElementById('memberID').innerText
    shopLocation = localStorage.getItem('shopLocation')
    console.log('location - '+shopLocation)
    isAuthorizedID = 'A'+machineID
    console.log('isAuthorizedID - '+isAuthorizedID)
    console.log(document.getElementById(isAuthorizedID).innerHTML)
    authorizationMsg = document.getElementById(isAuthorizedID).innerHTML
    console.log('authorizationMsg - '+authorizationMsg.substring(0,10))

    if (authorizationMsg.substring(0,10) == 'AUTHORIZED')  {
        isAuthorized = true
    }
    else {
        isAuthorized = false
    }
    console.log('isAuthorized - ',isAuthorized)
    // if (localStorage.getItem('printOption')) {
    //     printOption = localStorage.getItem('printOption')
    // }
    // else {
    //     printOption = "PRINT"
    // }
    
    // if (printOption == 'ESCPOS') {

    // }

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
        ticketMachineDesc.classList.add('machineName')
        ticketMachineDesc.innerHTML = data.ticketMachineDesc
        //ticketMachineID = document.getElementById('ticketMachineID')
        ticketKeyNumber = document.getElementById('ticketKeyNumber')

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

        if (isAuthorized) {
            document.getElementById('ticketTitle').innerHTML = "AUTHORIZATION TICKET"
            ticketKeyNumber.innerHTML = "Key # " + data.keyNumber
        }
        else {
            document.getElementById('ticketTitle').innerHTML = "REQUEST FOR ASSISTANCE"
            ticketKeyNumber.innerHTML = ""
        }
        
        // IF AUTHORIZED AND KEY IS KEPT IN THE TOOL CRIB ...
        if (isAuthorized && data.keyInToolCrib) {
            // DISPLAY MSG TO PICK UP KEY AT TOOL CRIB
            brk = document.createElement('br')
            msgLines.appendChild(brk)

            divRow1 = document.createElement('div')
            divRow1.classList.add('row')

            // divRow1Col1=document.createElement('div')
            // divRow1Col1.classList.add('col-4')
            // divRow1.appendChild(divRow1Col1)

            divRow1Col2 = document.createElement('div')
            divRow1Col2.classList.add("col-12","toolCribMsg")
            divRow1Col2.innerHTML = "Take this slip to the tool crib."
            divRow1.appendChild(divRow1Col2)

            msgLines.appendChild(divRow1)

            divRow2 = document.createElement('div')
            divRow2.classList.add('row')

            // divRow2Col1=document.createElement('div')
            // divRow2Col1.classList='col-4'
            // divRow2.appendChild(divRow2Col1)

            divRow2Col2 = document.createElement('div')
            divRow2Col2.classList.add('msgLine2','col-12')
            divRow2Col2.innerHTML = ""
            divRow2.appendChild(divRow2Col2)
            msgLines.appendChild(divRow2)

        }

        // If authorized and key provider ---
        if (isAuthorized && data.keyProvider) {
            divRow1 = document.createElement('div')
            divRow1.classList.add('row','kpMsgRow')

            // divRow1Col1 = document.createElement('div')
            // divRow1Col1.classList.add('col-3')
            // divRow1.appendChild(divRow1Col1)

            divRow1Data = document.createElement('div')
            divRow1Data.classList.add("col-12", 'kpMsgLine')
            divRow1Data.innerHTML = "Contact one of the following members for the key -"
            divRow1.appendChild(divRow1Data)
            listOfNames.appendChild(divRow1)
            
            // LIST OF KEY PROVIDERS
            keyProviders = data.keyProvidersDict
            
            for (var element of keyProviders) {
                divRow = document.createElement('div')
                divRow.classList.add('row','kpRow')

                // divCol0 = document.createElement('div')
                // divCol0.classList.add('col-0')
                // divRow.appendChild(divCol0)

                divCol1 = document.createElement('div')
                divCol1.classList.add('col-9','kpName')
                divCol1.innerHTML = element['name']
                divRow.appendChild(divCol1)

                divCol2 = document.createElement('div')
                divCol2.classList.add('col-3','kpInShopNow')
                divCol2.innerHTML = element['inShopNow']
                divRow.appendChild(divCol2)

                listOfNames.appendChild(divRow)
            }
        }
 
        // If not authorized ---
        if (!isAuthorized) {
            brk = document.createElement('br')
            listOfNames.appendChild(brk)
            //"You have not been authorized to use this equipment without assistance."

            divRow1 = document.createElement('div')
            divRow1.classList.add('row')

            // divRow1Col1=document.createElement('div')
            // divRow1Col1.classList.add('col-3')
            // divRow1.appendChild(divRow1Col1)

            divRow1DataCol2 = document.createElement('div')
            divRow1DataCol2.classList.add("col-12","asstMsg")
            divRow1DataCol2.style='text-align:left'
            divRow1DataCol2.innerHTML = "You are currently not authorized to use this equipment without assistance."
            divRow1.appendChild(divRow1DataCol2)

            divRow2 = document.createElement('div')
            divRow2.classList.add('row')
            //divRow2.style='height:100px'

            // divRow2Col1=document.createElement('div')
            // divRow2Col1.classList.add('col-3')
            // divRow2.appendChild(divRow2Col1)

            // divRow2Col2 = document.createElement('div')
            // divRow2Col2.classList.add("col-8","msgLine1")
            // divRow2Col2.style='text-align:left'
            // divRow2Col2.innerHTML = "this equipment without assistance."
            // divRow1.appendChild(divRow2Col2)

            brk = document.createElement('br')
            divRow1.appendChild(brk)
            listOfNames.appendChild(divRow1)
            listOfNames.appendChild(divRow1)

            brk = document.createElement('br')
            divRow1.appendChild(brk)
            listOfNames.appendChild(divRow1)

            // divRow1Col1=document.createElement('div')
            // divRow1Col1.classList.add('col-3')
            // divRow1.appendChild(divRow1Col1)

            divRow1Col2 = document.createElement('div')
            divRow1Col2.classList.add("col-12","asstMsg")
            divRow1Col2.innerHTML = "Contact one of the following members to arrange a time for them to assist you:"
            divRow1Col2.style='text-align:left'
            divRow1.appendChild(divRow1Col2)

            // divRow1Data = document.createElement('div')
            // divRow1Data.classList.add("col-12","msgLine2")
            // divRow1Data.innerHTML = "to arrange a time for them to assist you:"
            // divRow1.appendChild(divRow1Data)

            // HORIZONTAL LINE
            divRow1Line=document.createElement('hr')
            listOfNames.appendChild(divRow1Line)
            //divRow1.appendChild(divRow1Line)

            //listOfNames.appendChild(divRow1)
        
             // LIST OF ASSISTANTS FOR THIS MACHINE
            assistants = data.assistantsDict
            for (var element of assistants) {
                divRow = document.createElement('div')
                divRow.classList.add('row','asstRow')

                hrLine = document.createElement('HR')
                // divCol0.classList.add('col-3')
                divRow.appendChild(hrLine)

                divCol1 = document.createElement('div')
                divCol1.classList.add('col-8','asstName')
                divCol1.innerHTML = element['name']
                divRow.appendChild(divCol1)

                divCol2 = document.createElement('div')
                divCol2.classList.add('col-4','asstInShopNow')
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

function printViaESCPOS(machineID) {
    villageID = document.getElementById('memberID').innerText
    url = '/printTicketViaESCPOS?villageID='+villageID+'&machineID='+machineID
    window.location.href=url
}

function printTicketPage(machineID) {
    villageID = document.getElementById('memberID').innerText
    url = '/printTicketPage?villageID='+villageID+'&machineID='+machineID
    window.location.href=url
}

// function returnToSignIn() {

// }
// END OF FUNCTIONS
