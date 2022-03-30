// login.js

const form = document.getElementById('loginID');
form.addEventListener('submit', loginRtn);
window.focus()
document.getElementById("memberID").focus();

// FUNCTIONS
function loginRtn(e) {
    e.preventDefault();
    let memberID = document.getElementById("memberID").value
    let password = document.getElementById("password").value
    
    if (memberID == '') {
        modalAlert("Error","Missing village ID")
        return
    }
    if (password == '') {
        modalAlert("Error","Missing password")
        return
    }
    let dataToSend = {
        memberID: memberID,
        password: password
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
            window.open("/index","_self")
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
