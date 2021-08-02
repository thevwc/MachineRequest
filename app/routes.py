# routes.py

from flask import session, render_template, flash, redirect, url_for, request, jsonify, json, make_response, after_this_request
#from flask_weasyprint import HTML, render_pdf
import pdfkit


from flask_bootstrap import Bootstrap
from werkzeug.urls import url_parse
from app.models import ShopName, Member, MemberActivity, MonitorSchedule, MonitorScheduleTransaction,\
MonitorWeekNote, CoordinatorsSchedule, ControlVariables, DuesPaidYears, Contact
from app import app
from app import db
from sqlalchemy import func, case, desc, extract, select, update, text
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, DBAPIError
from sqlalchemy.orm import aliased

import datetime as dt
from datetime import date, datetime, timedelta

import os.path
from os import path


from flask_mail import Mail, Message
mail=Mail(app)

#import lightspeed_api
import pprint
import requests

@app.route('/')
@app.route('/index/')
@app.route('/index', methods=['GET'])
def index():
    # BUILD ARRAY OF NAMES FOR DROPDOWN LIST OF MEMBERS
    nameDict=[]
    nameItems=[]
    sqlSelect = "SELECT Last_Name, First_Name, Nickname, Member_ID, lightspeedID FROM tblMember_Data "
    sqlSelect += "ORDER BY Last_Name, First_Name "

    nameList = db.engine.execute(sqlSelect)
    position = 0
    for n in nameList:
        position += 1
        #print(n.Last_Name,n.First_Name,n.Member_ID)
        # print('---------------------------')
        # print(type(n.Last_Name))
        if n.Last_Name != None and n.First_Name != None:
        #     print(n.Last_Name,n.First_Name,n.Member_ID)
            lastFirst = n.Last_Name + ', ' + n.First_Name + ' (' + n.Member_ID + ')'
            if (n.Nickname != None and n.Nickname != ''):
                lastFirst += ' (' + n.Nickname + ')'
        else:
            lastFirst = ''

        nameItems = {
            'memberName':lastFirst,
            'memberID':n.Member_ID,
            'lightspeedID':n.lightspeedID
        }
        nameDict.append(nameItems)
    return render_template("index.html",nameDict=nameDict)
   
#PRINT MEMBER LIGHTSPEED TRANSACTIONS
@app.route("/prtTransactions", methods=["GET"])
def prtTransactions():
    memberID=request.args.get('memberID')
    destination = request.args.get('destination')
    
    # GET TODAYS DATE
    todays_date = date.today()
    displayDate = todays_date.strftime('%B %-d, %Y') 

    # GET MEMBER NAME
    member = db.session.query(Member).filter(Member.Member_ID == memberID).first()
    displayName = member.First_Name
    if (member.Nickname != None and member.Nickname != ''):
        displayName += ' (' + member.Nickname + ')'
    displayName += ' ' + member.Last_Name
    
    return render_template("rptTransactions.html")


# GET CUSTOMER RECORD BY CUSTOMER ID (LIGHTSPEED #)
@app.route('/retrieveCustomerByID', methods=['POST'])
def retrieveCustomerByID():
    req = request.get_json()
    lightspeedID = req["lightspeedID"]

    c = {'account_id': app.config['ACCOUNT_ID'],
        'client_id': app.config['CLIENT_ID'],
        'client_secret': app.config['CLIENT_SECRET'],
        'refresh_token': app.config['REFRESH_TOKEN']
    }
    # REFRESH TOKEN; SAVE TOKEN
    token = refreshToken()

    # BUILD URL
    url = 'https://api.lightspeedapp.com/API/Account/' 
    url += app.config['ACCOUNT_ID']
    url += '/Customer.json?load_relations=["Contact"]&customerID=~,' + lightspeedID
    headers = {'authorization': 'Bearer ' + token}
    response = requests.request('GET', url, headers=headers)
    
    data_json = response.json()

    lastName = data_json['Customer']['lastName']
    firstName = data_json['Customer']['firstName']
    msg = firstName + ' ' + lastName 
    customerType = data_json['Customer']['customerTypeID']
    phones = data_json['Customer']['Contact']['Phones']['ContactPhone']
    homePhone = ''
    mobilePhone = ''
    for phone in phones:
        if phone['useType'] == 'Home':
            homePhone = phone['number']
        if phone['useType'] == 'Mobile':
            mobilePhone = phone['number']
    email = data_json['Customer']['Contact']['Emails']['ContactEmail']['address']
    customerTypeID = data_json['Customer']['customerTypeID']
    customerType = ''
    if customerTypeID == '1':
        customerType = 'Member'
    if customerTypeID == '3':
        customerType = 'Non-member Volunteer'
    villageID = data_json['Customer']['Contact']['custom']

    memberName = firstName + ' ' + lastName
    return jsonify(lightspeedID=lightspeedID,villageID=villageID,\
    memberName=memberName,email=email,homePhone=homePhone,mobilePhone=mobilePhone,customerType=customerType)
    
@app.route('/retrieveCustomerByVillageID', methods=['POST']) 
def retrieveCustomerByVillageID():
    req = request.get_json()
    villageID = req["villageID"]
    
    # REFRESH TOKEN; SAVE TOKEN
    token = refreshToken()

    # BUILD URL 
    url = 'https://api.lightspeedapp.com/API/Account/' 
    url += app.config['ACCOUNT_ID']
    url += '/Customer.json?load_relations=["Contact"]&Contact.custom=~,' + villageID
    headers = {'authorization': 'Bearer ' + token}
    try:
        response = requests.request('GET', url, headers=headers)
    except:
        flash('Operation failed','danger')
        return redirect(url_for('index'))

    data_json = response.json()
   
    lightspeedID = data_json['Customer']['customerID']
    lastName = data_json['Customer']['lastName']
    firstName = data_json['Customer']['firstName']
    villageID = data_json['Customer']['Contact']['custom']
    email = data_json['Customer']['Contact']['Emails']['ContactEmail']['address']
    customerTypeID = data_json['Customer']['customerTypeID']
    customerType = ''
    if customerTypeID == '1':
        customerType = 'Member'
    if customerTypeID == '3':
        customerType = 'Non-member Volunteer'
    phones = data_json['Customer']['Contact']['Phones']['ContactPhone']
    homePhone = ''
    mobilePhone = ''
    for phone in phones:
        if phone['useType'] == 'Home':
            homePhone = phone['number']
        if phone['useType'] == 'Mobile':
            mobilePhone = phone['number']
    memberName = firstName + ' ' + lastName
    return jsonify(lightspeedID=lightspeedID,villageID=villageID,memberName=memberName,\
    email=email,homePhone=homePhone,mobilePhone=mobilePhone,customerType=customerType)
    
    
@app.route('/listTransactions', methods=['POST']) 
def listTransactions():
    req = request.get_json()
    villageID = req["villageID"]
    
    # REFRESH TOKEN; SAVE TOKEN
    token = refreshToken()

    # BUILD URL 
    url = 'https://api.lightspeedapp.com/API/Account/' 
    url += app.config['ACCOUNT_ID']
    url += '/Customer.json?load_relations=["Contact","Sales"]&Contact.custom=~,' + villageID
    headers = {'authorization': 'Bearer ' + token}
    try:
        response = requests.request('GET', url, headers=headers)
    except:
        flash('Operation failed','danger')
        return redirect(url_for('index'))

    data_json = response.json()
    pprint.pprint(data_json)

    lightspeedID = data_json['Customer']['customerID']
    lastName = data_json['Customer']['lastName']
    firstName = data_json['Customer']['firstName']
    villageID = data_json['Customer']['Contact']['custom']
    email = data_json['Customer']['Contact']['Emails']['ContactEmail']['address']
    customerTypeID = data_json['Customer']['customerTypeID']
    customerType = ''
    if customerTypeID == '1':
        customerType = 'Member'
    if customerTypeID == '3':
        customerType = 'Non-member Volunteer'
    phones = data_json['Customer']['Contact']['Phones']['ContactPhone']
    homePhone = ''
    mobilePhone = ''
    for phone in phones:
        if phone['useType'] == 'Home':
            homePhone = phone['number']
        if phone['useType'] == 'Mobile':
            mobilePhone = phone['number']
    memberName = firstName + ' ' + lastName
    return jsonify(lightspeedID=lightspeedID,villageID=villageID,memberName=memberName,\
    email=email,homePhone=homePhone,mobilePhone=mobilePhone,customerType=customerType)
    

def refreshToken():
    import requests
    payload = {
        'refresh_token': app.config['REFRESH_TOKEN'],
        'client_secret': app.config['CLIENT_SECRET'],
        'client_id': app.config['CLIENT_ID'],
        'grant_type': 'refresh_token'
    }

    r = requests.post('https://cloud.lightspeedapp.com/oauth/access_token.php', data=payload).json()
    #print('r - ',r)
    token = (r['access_token'])
    return token

@app.route('/updateLightspeedID', methods=['POST']) 
def updateLightspeedID():

    # REFRESH TOKEN; SAVE TOKEN
    token = refreshToken()
    start = 0
    batchSize = 100
    recordsUpdated = 0
    numberOfLightspeedRecords = 0
    for i in range(50):
        # BUILD URL 
        url = 'https://api.lightspeedapp.com/API/Account/230019/Customer.json'
        url += '?load_relations=["Contact"]&Contact.custom&offset=' + str(start) + '&limit=' + str(batchSize)

        headers = {'authorization': 'Bearer ' + token}
        response = requests.request('GET', url, headers=headers) 
        data_json = response.json()
        
        count = data_json['@attributes']['count']
        if (numberOfLightspeedRecords >= int(count)):
            break
        

        # PRINT ATTRIBUTES DATA
        try:
            offset = data_json['@attributes']['offset']
        except:
            break
        limit = data_json['@attributes']['limit'] 
        
        try:
            for d in range(int(limit)):
                if (numberOfLightspeedRecords >= int(count)):
                    break
                numberOfLightspeedRecords += 1

                lightspeedID = data_json['Customer'][d]['customerID']
                lastName = data_json['Customer'][d]['lastName']
                firstName = data_json['Customer'][d]['firstName']
                villageID = data_json['Customer'][d]['Contact']['custom']
                email = data_json['Customer'][d]['Contact']['Emails']['ContactEmail']['address']
                memberType = data_json['Customer'][d]['customerTypeID']
        
                if villageID != '' and villageID != None:
                    # UPDATE lightspeedID IN tblMember_Data
                    sqlUpdate = "UPDATE tblMember_Data SET lightspeedID = '" + lightspeedID + "' "
                    sqlUpdate += "WHERE Member_ID = '" + villageID + "'"
                    db.engine.execute(sqlUpdate)
                    recordsUpdated += 1

        except:
            continue
        finally:
            start += batchSize

    msg = 'Number of Lightspeed records - ' + str(numberOfLightspeedRecords)
    msg += '\nNumber of member records updated w/Lightspeed ID - ' + str(recordsUpdated) 

    print('Number of Lightspeed records - ',numberOfLightspeedRecords)
    print('Number of member records updated w/Lightspeed ID - ',recordsUpdated)
   
    return jsonify(msg)

@app.route('/addCustomer')
def addCustomer():
    villageID = '200001'
    firstName = 'John'
    lastName = 'Johnson'
    email = 'hartl1r@gmail.com'
    homePhone = '(352) 391-0727'
    mobilePhone = '(352 391-7894'
    workPhone = '(123) 456-7890'  
    
    # REFRESH TOKEN; SAVE TOKEN
    token = refreshToken()

    # BUILD URL 
    url = 'https://api.lightspeedapp.com/API/Account/' 
    url += app.config['ACCOUNT_ID']
    url += '/Customer.json'
    print('url - ',url)
    print('----------------------------------------------')
    headers = {'authorization': 'Bearer ' + token}
    
    payload = {
        "firstName": firstName,
        "lastName": lastName,
        'customerTypeID': '1'
    }

        #     'Contact': {
        #         'custom': villageID,
        #         'Emails': {
        #             'ContactEmail': {
        #                 'address': email,
        #                 'useType': 'Primary'
        #             }
        #         },
        #         'Phones': {
        #             'Contact': [{
        #                 'number':mobilePhone,
        #                 'useType':'Mobile'
        #             },
        #             {
        #                 'number':homePhone,
        #                 'useType':'Home'
        #             },
        #             {
        #                 'number':workPhone,
        #                 'useType':'Work'
        #             }]   
        #         }
        #     }
        # }
    pprint.pprint (payload)
    print('----------------------------------------------')
    try:
        response = requests.request("POST", url, data=payload, headers=headers)
    except:
        flash('Operation failed','danger')
        return redirect(url_for('index'))
    
    print(response.text)
    flash('Customer added','success')
    return redirect(url_for('index'))

# @app.route('/addCustomer')
# def addCustomer():
#     print('/addCustomer')
#     account_id = app.config['ACCOUNT_ID']
#     client_id = app.config['CLIENT_ID']
#     client_secret = app.config['CLIENT_SECRET']
#     refresh_token = app.config['REFRESH_TOKEN']

#     c = {'account_id': app.config['ACCOUNT_ID'],
#         'client_id': app.config['CLIENT_ID'],
#         'client_secret': app.config['CLIENT_SECRET'],
#         'refresh_token': app.config['REFRESH_TOKEN']
#     }
    
#     #ls = lightspeed_api.Lightspeed(c)

#     # Create a new customer
#     villageID = '100053'
#     firstName = 'Janet'
#     lastName = 'L100053'
#     email = 'hartl1r@gmail.com'
#     
#     formatted = {'Customer':
#         {'firstName': firstName,
#             'lastName': lastName,
#             
#     print('==============================')
#     pprint.pprint(formatted)
#     print('==============================')
#     try:    
#         ls.create("Customer", formatted["Customer"])
#     except:
#         print('ls.create error')
#     print('Customer added.')
#     flash("Customer added.","Success")
#     return redirect(url_for('index')) 




    # url = "https://api.lightspeedapp.com/API/Account/230019/Customer.json"
    # print(url)

    # payload = {
    #     "firstName": firstName,
    #     "lastName": lastName,
    #     "customerTypeID":1,
    #     "Contact": {
    #         "custom":villageID,
    #         "email":email
    #         }
    #     }
    # payload = {
    #     "firstName": firstName,
    #     "lastName": lastName,
    #     "customerTypeID":1,
    #     }