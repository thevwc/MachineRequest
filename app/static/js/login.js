// login.js
window.focus()
document.getElementById("memberID").focus();

const memberID = document.getElementById('memberID')
//memberID.addEventListener('change',inputChange)
memberID.addEventListener('keyup',inputKeypress)

const form = document.getElementById('loginID');

form.addEventListener('submit', loginRtn);

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

function inputChange() {
    
    inputData = memberID.value
    console.log('change rtn - '+inputData)
    lenInputData = inputData.length
    console.log('length - '+ lenInputData)
    if (inputData.length < 6) {
        return
    }
    if (inputData.length > 6) {
        modalAlert('ERROR','Too many characters entered.')
        return
    }
    alert('6 characters entered')
}
function loginRtn(e) {
    e.preventDefault();
    let memberID = document.getElementById("memberID").value
    
    if (memberID == '') {
        modalAlert("Error","Missing village ID")
        return
    }
    
    let dataToSend = {
        memberID: memberID
    };
    fetch(`${window.origin}/getMemberLoginData`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(dataToSend),
        cache: "no-cache",
        headers: new Headers({
            "Content-type": "application/json"
        })
    })
    .then((res) => res.json())
    .then((data) => {
        console.log('data.msg - ' + data.msg)
        if (data.msg == "Authorized") {
            document.getElementById('memberName').innerHTML = data.memberName
            //window.open("/index","_self")
            return
        }
        modalAlert("Login",data.msg)
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
