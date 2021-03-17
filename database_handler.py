import sqlite3
from flask import g
from uuid import uuid4
import random
import hashlib


DATABASE_URI = "/home/mutab736/web_programming/tddd97/lab3/twidder"      # Mutaz's Machine Path
DATABASE_URI = "D:\\WebDevelopment\\WebLab\\lab4\\tddd97\\lab4_final\\twidder" # Talha's Machine Path



def get_db():
    db = getattr(g, 'db', None)
    if db is None:
        db = g.db = sqlite3.connect(DATABASE_URI)
    return db


def disconnect_db():
    db = getattr(g, 'db', None)
    if db is not None:
        g.db.close()
        g.db = None


def sign_in(email, password):
    currentPassword = get_db().execute(
        "SELECT password FROM User WHERE email =?;", [email])
    currentPassword = convert_cursor_with_single_value_to_string(
        currentPassword)
    currentPassword = str(currentPassword)
    password = hashlib.sha3_256(password.encode()).hexdigest()
    print("password & current password",currentPassword," ",password)
    print("password = cureent ppassword ",password == currentPassword)
    if password == currentPassword:
        rand_token = str(uuid4())
        rand_token = generate_token() #rand_token[0:rand_token.find("-")]
        print("token ", rand_token)
        status = "logedIn"
        get_db().execute("insert into UserSession(token,user_email,status) values (?,?,?);",
               (rand_token, email, status))
        get_db().commit()
        return rand_token
    else:
        raise Exception('Incorrect Password')


def sign_up(email, first_name, last_name, gender, city, country,telephone, password):
    get_db().execute("insert into User (email, first_name, last_name, gender, city, country,telephone_no, password) values (?,?,?,?,?,?,?,?)",
           (email, first_name, last_name, gender, city, country,telephone, password))
    get_db().commit()
    return True


def sign_out(userToken):
    user_status = get_db().execute(
        "SELECT status FROM UserSession WHERE token =?;", [userToken])
    user_status = convert_cursor_with_single_value_to_string(user_status)
    user_status = str(user_status)
    if str(user_status) == 'logedIn':
        user_status = 'logedOut'
        get_db().execute("UPDATE UserSession SET status ='" +
               user_status+"' where token ='"+userToken+"';")
        get_db().commit()
        return True
    else:
        print("logIn First")
        return False


def change_password(userToken, oldPassword, newPassword):
    user_status = get_db().execute(
        "SELECT status FROM UserSession WHERE token =?;", [userToken])
    user_status = convert_cursor_with_single_value_to_string(user_status)
    user_status = str(user_status)
    if str(user_status) == 'logedIn':
        currentPassword = get_db().execute(
            "SELECT password FROM User u inner join UserSession s on s.user_email=u.email WHERE token =?;", [userToken])
        currentPassword = convert_cursor_with_single_value_to_string(
            currentPassword)
        currentPassword = str(currentPassword)
        
        userEmail = get_db().execute(
            "SELECT email FROM User u inner join UserSession s on s.user_email=u.email WHERE token =?;", [userToken])
        userEmail = convert_cursor_with_single_value_to_string(
            userEmail)
        userEmail = str(userEmail)
        
        oldPassword = hashlib.sha3_256(oldPassword.encode()).hexdigest()
        #currentPassword = hashlib.sha3_256(currentPassword.encode()).hexdigest()
        newPassword = hashlib.sha3_256(newPassword.encode()).hexdigest()


        if oldPassword == currentPassword:
            try:
                get_db().execute("UPDATE User SET password=? where email=?;", [newPassword,userEmail])
                get_db().commit()
                return "success"
            except Exception as e:
                return False
        else:
            return "password is incorrect"
    else:
        return "Login First"


def get_user_data_by_token(userToken):
    user_status = check_token_validaty(userToken)
    if str(user_status) == 'logedIn':
        user_profile = get_db().execute(
            "SELECT u.* FROM User u inner join UserSession s on u.email = s.user_email  WHERE token =?;", [userToken])
        return user_profile.fetchall()
    elif str(user_status) == 'logedOut':
        print("logIn First")
        raise Exception("invalid token / logIn First")

def get_user_data_by_email(userToken, userEmail):
    user_status = check_token_validaty(userToken)
    if str(user_status) == 'logedIn':
        user_data = get_db().execute("SELECT u.email,u.first_name, u.last_name, u.city, u.country, u.gender FROM User u WHERE u.email =?;", [userEmail])
        return user_data.fetchall()
    else:
        raise Exception("invalid token / logIn First")



def get_user_message_by_token(userToken):
    user_status = check_token_validaty(userToken)
    if str(user_status)=='logedIn':
        user_message = get_db().execute("SELECT p.post_message FROM Post p inner join UserSession s on p.user_email = s.user_email  WHERE token=?;", [userToken])
        return user_message.fetchall()
    else:
        raise Exception("invalid token / logIn First")

def get_user_message_by_email(userToken,userEmail):
    user_status = check_token_validaty(userToken)
    print("status ",user_status)
    if str(user_status)=='logedIn':
        user_message = get_db().execute("SELECT post_message FROM Post WHERE user_email =?;", [userEmail])
        return user_message.fetchall()
    else:
        raise Exception("invalid token / logIn First")


def post_message(userToken, email,post_message,):
    user_status = get_db().execute("SELECT status FROM UserSession WHERE token=? and user_email=?;", [userToken,email])        
    user_status = convert_cursor_with_single_value_to_string(user_status)
    user_status = str(user_status)
    if user_status == 'logedIn':
        get_db().execute("INSERT INTO Post(user_email,post_message) values(?,?);", [email,post_message])
        get_db().commit()
        return True;
    else:
        raise Exception("invalid token / logIn First")

def get_user_email_by_token(userToken):
    cursor = get_db().execute("SELECT user_email FROM UserSession where status = 'logedIn' and  token = ?", [userToken])
    user = cursor.fetchone()
    cursor.close()
    if  user == None:
        return False
    else:
        return user[0]

def get_user_data_by_email_only(userEmail):
        user_data = get_db().execute("SELECT u.email,u.first_name, u.last_name, u.city, u.country, u.gender, u.telephone_no FROM User u WHERE u.email =?;", [userEmail])
        result = user_data.fetchall()
        if result is None or len(result)==0:
            raise Exception("Email dosen't exist")
        else:
            return result


# util methods

def convert_cursor_with_single_value_to_string(cursor):
    fetch = cursor.fetchall()
    if len(str(fetch))==2:
        return "invalid token"
    result = str(fetch[0])
    result=str(result)[2:(len(result)-3)]
    return result.strip()

def check_token_validaty(token):
    token_status = get_db().execute("SELECT status FROM UserSession WHERE token =?;", [token])
    token_status = convert_cursor_with_single_value_to_string(token_status)
    token_status = str(token_status)
    return token_status

def generate_token():
    TOKEN_LENGTH = 20
    TOKEN_STRING = "abcdefghijklmnopqrstuvxyzABCDEFGHIJKLMNOPQRSTUVXYZ"
    token = ""

    for i in range(0, TOKEN_LENGTH):
        token += TOKEN_STRING[random.randint(0, len(TOKEN_STRING)-1)]

    return token

def get_session_status_by_email(userEmail):
    token_status = get_db().execute("SELECT status FROM UserSession WHERE status='logedIn' and user_email =?;", [userEmail])
    token_status = convert_cursor_with_single_value_to_string(token_status)
    token_status = str(token_status)
    print("Token status ",token_status)
    if(token_status !="invalid token"):
        return True
    return False

def deactivate_session_status(userEmail):
    get_db().execute("UPDATE UserSession SET status='logedOut' where user_email=?;", [userEmail])
    get_db().commit()

def update_user_password(password,userEmail):
    get_db().execute("UPDATE User SET password=? where email=?;", [password,userEmail])
    get_db().commit()
