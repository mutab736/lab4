var userToken;
var userEmail;
var webSocket = null;


function onPageLoad(){
  console.log("Token "+localStorage.getItem("userToken"));
   if(localStorage.getItem("userToken")=="undefined"  || localStorage.getItem("userToken")=="" || localStorage.getItem("userToken")==null){
    document.getElementById("page-content").innerHTML = document.getElementById("welcomeview").innerHTML;
   }
    else{
     connectToSocket();
     document.getElementById("page-content").innerHTML = document.getElementById("profileview").innerHTML;
     document.getElementById('Home').style.display = "block";
     getProfileInfoByToken();
   } 
}

// welcome page functions
function login(formData){
  console.log(formData.loginPassword.value);
  /* var */ userEmail = formData.loginEmail.value
  localStorage.setItem("userEmail",userEmail);
  var password = formData.loginPassword.value;
  genericPostXHR("/signin", JSON.stringify({'email' : userEmail, 'password' : password}), loginSuccess,loginFail);
  
}

function loginFail(result){
  console.log("faillogin "+JSON.stringify(result.status));
  var statusCode = result.status;
  if(statusCode =="401")
  showMessage("signin-errorMessageLabel","signin-errorMessage","Error : ","Wrong username or password.");
}

function loginSuccess(result){
  console.log("login success "+JSON.stringify(JSON.parse(result.responseText)));
  var resultData = JSON.parse(result.responseText);
  console.log("resultdata token "+resultData['token']);
  userToken = resultData['token'];
  localStorage.setItem("userToken",userToken);
  console.log("token "+userToken);
  document.getElementById("login-form").reset();
  document.getElementById("page-content").innerHTML = document.getElementById("profileview").innerHTML;
  document.getElementById('Home').style.display = "block";
  getProfileInfoByToken();
  //createSocketConnection();
  connectToSocket();
  

}

function register(formData){
    var email = formData.signupEmail.value
    var password = formData.signupPassword.value;
    var confirmPassword =  formData.signupRepeatPassword.value;
    var firstName = formData.signupFirstName.value;
    var familyName = formData.signupFamilyName.value;
    var gender = formData.signupGender.value;
    var city = formData.signupCity.value;
    var country = formData.signupCountry.value;
    var telephone = formData.signupTelephone.value;




    var result = validatePasswordAndConfirmPassword(password,confirmPassword);
    if(result == false){
      showMessage("signup-errorMessageLabel","signup-errorMessage","Error :","Password and ConfirmPassword Don't Match");
    }
    else{
      var newUserData ={
        "email": email,
        "password": password,
        "firstname":firstName,
        "familyname":familyName,
        "gender":gender,
        "city":city,
        "country":country,
        "telephone":telephone
      };
      genericPostXHR("/signup", JSON.stringify(newUserData), signupSuccess,signupFail);
    }
}

function signupFail(result){
  //console.log("faillogin "+JSON.stringify(statusCode));
  var statusCode = result.status;
  if(statusCode =="400"){
    showMessage("signup-errorMessageLabel","signup-errorMessage","Error : ","Form data missing or incorrect type.");
  }
  else if(statusCode =="409"){
  showMessage("signup-errorMessageLabel","signup-errorMessage","Error : ","Email is already exist");
  }
  else if(statusCode =="500"){
    showMessage("signup-errorMessageLabel","signup-errorMessage","Error : ","Something went wrong");
    }

}
function signupSuccess(result){
  var statusCode = result.status;
  if(statusCode=="201"){
  showMessage("signup-errorMessageLabel","signup-errorMessage","Success : ","Successfully created a new user.");
  document.getElementById("signup-form").reset();
  }
}

//Main page functions
function getProfileInfoByToken(){
  genericGetXHR("/getuserdatabytoken", JSON.stringify(""), getProfileInfoByTokenSuccess,getProfileInfoByTokenFail);
}

function getProfileInfoByTokenSuccess(result){
  //console.log("response "+JSON.parse(result.responseText));
  userData = JSON.parse(result.responseText);
  //console.log("user Data "+JSON.stringify(userData));
  setUserProfile(userData);
  getPostedMessages();
}

function getProfileInfoByTokenFail(status){

}

function getProfileInfoByTokenAndEmail(){
  //FIXME when should i populate useremail variable
  var userData = serverstub.getUserDataByEmail(userToken,userEmail);
  console.log("user Data "+JSON.stringify(userData));
  setUserProfile(userData);
  
}

function setUserProfile(userData){
  var email = userData['email'];
  var firstName = userData['first_name'];
  var familyName = userData['last_name'];
  var gender = userData['gender'];
  var city = userData['City'];
  var country = userData['Country'];

  //
   if(!document.getElementById("home_f_name")){
    document.getElementById("page-content").innerHTML = document.getElementById("profileview").innerHTML;
    document.getElementById('Home').style.display = "block";
   }
  // home user profile
  document.getElementById("home_f_name").innerHTML = email;
  console.log("user profile "+email);
  document.getElementById("home_l_name").innerHTML = firstName;
  document.getElementById("home_i_email").innerHTML = familyName;
  document.getElementById("home_i_gender").innerHTML = gender;
  document.getElementById("home_i_country").innerHTML = city;
  document.getElementById("home_i_city").innerHTML = country;

}

//TODO
// function getUserMessageByToken(){
//   var userMessages = serverstub.getUserMessageByToken(localStorage.getItem("userToken"));

// }
//TODO
// function getUserMessageByTokenAndEmail(){
//   var userMessages = serverstub.getUserMessageByToken(localStorage.getItem("userToken"),userEmail);

// }

function postMessage(formData){
  var message = formData.homePostText.value;
  genericPostXHR("/postmessage", JSON.stringify({"email":localStorage.getItem("userEmail"),"message":message}), postMessageSuccess,postMessageFail);
}

//FIXME
function postMessageFail(statusCode){

}
function postMessageSuccess(result){
  var statusCode = result.status;
  if(statusCode="201"){
  document.getElementById("post_text").value="";
  getPostedMessages();
  }
}

function refresh(){
  getPostedMessages();
}

function getPostedMessages(){
  genericGetXHR("/getusermessagebytoken", JSON.stringify(""), getPostMessageSuccess,postMessageFail);
}

function getPostMessageSuccess(result){
  var messages = "";
  //console.log("response "+JSON.parse(result.responseText));
  userMessages = JSON.parse(result.responseText);
  //console.log("user Messages "+userMessages.length)
  userMessages.forEach(function(entry) {
  //console.log("entry"+JSON.stringify(entry));
   messages +="User :"+localStorage.getItem("userEmail")+" Posted "+entry.message+" <br>";
});
  document.getElementById("home_previous_post").innerHTML = messages ;
}

//FIXME
function getPostMessageFail(status){
  
}

function getPostedMessagesByEmail(formData){
  showMessage("browse-errorMessageLabel","browse-errorMessage","","");
  document.getElementById("serachResult").innerHTML = "";
  userEmail = formData.userEmail.value;
  console.log("email "+userEmail);
  localStorage.setItem("browseEmail",userEmail);
  genericPostXHR("/getusermessagebyemail", JSON.stringify({'email' : userEmail}), getPostedMessagesByEmailSuccess,getPostedMessagesByEmailFail);

  console.log("mesages "+JSON.stringify(userMessages));

}

function getPostedMessagesByEmailSuccess(result){
  if(result.status =="204"){
    showMessage("browse-errorMessageLabel","browse-errorMessage","Error : ","Email dose not exist");
   return; 
  }
  var messages ="";
  console.log("response "+JSON.parse(result.responseText));
  userMessages = JSON.parse(result.responseText);
  console.log("user Messages "+userMessages.length)
  userMessages.forEach(function(entry) {
  console.log("entry"+JSON.stringify(entry));
   messages +="User :"+localStorage.getItem("browseEmail")+" Posted "+entry.message+" <br>";
});
  document.getElementById("serachResult").innerHTML = messages ;
  document.getElementById("User_info1").value="";
}

//TDOD same functionly to other Fail methods should be one common method called by other methods
function getPostedMessagesByEmailFail(result){
  if(result.status =="401"){
  showMessage("browse-errorMessageLabel","browse-errorMessage","Error : ","You are not signed in.");
  }
  if(result.status =="400"){
    showMessage("browse-errorMessageLabel","browse-errorMessage","Error : ","data missing or email dosen't exist.");
    }
    document.getElementById("User_info1").value="";

}

//FIXME use genericGetXHR 
function logout(){
  //var userData = serverstub.signOut(localStorage.getItem("userToken"));
  genericGetXHR("/signout", JSON.stringify(""), logoutSuccess,logoutFail);

}

function logoutFail(result){

  if(result.status =="401"){
  localStorage.setItem("userToken","");
  document.getElementById("page-content").innerHTML = document.getElementById("welcomeview").innerHTML;
  }
  if(result.status =="400"){
    showMessage("signout-errorMessageLabel","signin-errorMessage","Error : ","data missing or incorrect type.");
    }
}

function logoutSuccess(result){
  localStorage.setItem("userToken","");
  document.getElementById("page-content").innerHTML = document.getElementById("welcomeview").innerHTML;
  websocket.close();

}

function changePassword(formData){
  console.log(formData.oldPassword.value);
  var currentPassword = formData.oldPassword.value;
  var newPassword = formData.newPassword.value;
  var confirmNewPassword = formData.confirmNewPassword.value;
 
  
  var result = validatePasswordAndConfirmPassword(newPassword,confirmNewPassword);
  if(result == false){
    document.getElementById("account-changePassword-ErrorMessage").style.display ="block";
    showMessage("changePassword-errorMessageLabel","changePassword-errorMessage","Error :","new Password and Confirm new Password Don't Match");
  }
  else{ // change password block
  genericPostXHR("/changepassword", JSON.stringify({'oldPassword' : currentPassword, 'newPassword' : newPassword}), changePasswordSuccess,changePasswordFail);

}
}

function changePasswordFail(result){
  console.log("faillogin "+JSON.stringify(result.status));
  var statusCode = result.status;
  if(statusCode =="401")
  showMessage("changePassword-errorMessageLabel","changePassword-errorMessage","Error : ","Wrong username or password.");
  if(statusCode =="400"){
    showMessage("changePassword-errorMessageLabel","changePassword-errorMessage","Error : ","Form data missing or incorrect type.");
  }
  if(statusCode =="500"){
    showMessage("changePassword-errorMessageLabel","changePassword-errorMessage","Error : ","Something went wrong Try again.");
  }
}

function changePasswordSuccess(result){
  document.getElementById("account_change_password-form").reset();
  // document.getElementById("account-changePassword-ErrorMessage").style.display ="block";
  // document.getElementById("page-content").innerHTML = document.getElementById("welcomeview").innerHTML
  // showMessage("signin-errorMessageLabel","signin-errorMessage","Success : ","Passweord Chaged Successfully");
  logout();
  //location.reload();
    //websocket.close();

}

function forgetPassword(formData){
  console.log(formData.forgetpasswordEmail.value);
  /* var */ userEmail = formData.forgetpasswordEmail.value
  genericPostXHR("/forgetpassword", JSON.stringify({'email' : userEmail}), forgetPasswordSuccess,forgetPasswordFail);
  
}

function forgetPasswordFail(result){
  console.log("faillogin "+JSON.stringify(result.status));
  var statusCode = result.status;
  if(statusCode =="400"){
    showMessage("forgetpassword-errorMessageLabel","forgetpassword-errorMessage","Error : ","Form data missing or incorrect type.");
  }
  if(statusCode =="500"){
    showMessage("forgetpassword-errorMessageLabel","forgetpassword-errorMessage","Error : ","Something went wrong Try again.");
  }
}

function forgetPasswordSuccess(result){
  if(result.status =="204"){
    document.getElementById("forgetpassword-form").reset();
    showMessage("forgetpassword-errorMessageLabel","forgetpassword-errorMessage","Error : ","Email dose not exist");
   return; 
  }
  document.getElementById("forgetpassword-form").reset();
  showMessage("forgetpassword-errorMessageLabel","forgetpassword-errorMessage","Success : ","New Password Generated successfully, sms has been sent to you with the new password");  

}


//util functions
function validatePassword(password){
    console.log(password.value.length());

}

function validatePasswordAndConfirmPassword(password,confirmPassword){
    if(password/* .value */ != confirmPassword/* .value */) {
      return false;
      } else {
        return true;
      }
}

function showMessage(messageLabelId,messageTextId,messageLabel,messageText){
    document.getElementById(messageLabelId).innerHTML = messageLabel;
    document.getElementById(messageTextId).innerHTML = messageText;
}




function openTab(evt, tabName) {
  // Declare all variables
  var i, tabcontent, tablinks;

  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

function genericPostXHR(url, jsonValues, successCall, failureCall){
  var xhr = new XMLHttpRequest();
  var httpSuccessRegEx = /^2\d{2}$/
	xhr.onreadystatechange = function(){
    console.log("Status "+this.status);
		if (this.readyState == 4 && httpSuccessRegEx.test(this.status) /*this.status == 200*/)
		{
      successCall(this);
    }
    else{
      failureCall(this);
    }
	}
	xhr.open("POST", url, true);
  xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
  xhr.setRequestHeader('Token',localStorage.getItem("userToken"));
	xhr.send(jsonValues);
}

function genericGetXHR(url, jsonValues, successCall, failureCall){
  var xhr = new XMLHttpRequest();
  var httpSuccessRegEx = /^2\d{2}$/
	xhr.onreadystatechange = function(){
    console.log("Status "+this.status);
		if (this.readyState == 4 && /*httpSuccessRegEx.test(this.status)*/ this.status == 200)
		{
      successCall(this);
    }
    else{
      failureCall(this);
    }
	}
	xhr.open("GET", url, true);
  xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
  console.log("token inside genericget "+localStorage.getItem("userToken"));
  xhr.setRequestHeader('Token',localStorage.getItem("userToken"));
	xhr.send(jsonValues);
}

// createSocketConnection = function(){
// 	debugger;

//     webSocket= new WebSocket("ws://localhost:5001/api");
//     console.log("inside create socket connection")
// 	 var data = JSON.stringify({'token': localStorage.getItem("userToken")});
// 	 webSocket.onopen = function () {
// 			 console.log(data);
// 			 webSocket.send(data);
// 	 };
// 	 webSocket.onmessage = function (ev) {
// 			 if (ev.data == "true") {
// 					 console.log("true");
// 					 logout();
// 					 webSocket.close();
// 			 }


// 	 };
// 	 webSocket.onclose = function (ev) {

// 	 }
// }
function connectToSocket() {
  let conn = new WebSocket("ws://twidder-mutab736-dev.apps.sandbox.x8i5.p1.openshiftapps.com/socket");
  conn.onopen = function () {
    let data = { "email": localStorage.getItem("userEmail"), "token": localStorage.getItem("userToken") };
    console.log("open ws "+JSON.stringify(data));
    conn.send(JSON.stringify(data));
  };

  conn.onmessage = function (message) {
    message = JSON.parse(message.data);
    console.log("message ws "+JSON.stringify(message));
    if (message.success == false) {
      logout();
    }
  };
}
