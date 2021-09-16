# routes.py

from flask import session, render_template, flash, redirect, url_for, request, jsonify, json, make_response, after_this_request
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
        if n.Last_Name != None and n.First_Name != None:
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

    withoutLightspeedID = 0
    withoutLightspeedID = db.session.query(func.count(Member.Member_ID))\
        .filter(Member.Dues_Paid == True)\
        .filter(Member.lightspeedID == None).scalar()
    
    return render_template("index.html",nameDict=nameDict,withoutLightspeedID=withoutLightspeedID)
   
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
@app.route('/retrieveCustomerByLightspeedID', methods=['POST'])
def retrieveCustomerByLightspeedID():
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
    print("------ url for retrieveCustomerByID ----------------")
    print(url)
    
    headers = {'authorization': 'Bearer ' + token}
    try:
        response = requests.request('GET', url, headers=headers)
    except:
        msg = "ERROR - Call to Lightspeed API failed"
        return jsonify(msg=msg)

    json_data = response.json()
    count = json_data['@attributes']['count']
    print('count - ',count)
    if (count == '0'):
        print('count is 0')
        msg = 'ERROR - Member with lightspeed # ' + lightspeedID + ' was not found.'
        print (msg)
        return jsonify(msg=msg),201

    print('-----------------------------------------')
    pprint.pprint (json_data)

    lastName = json_data['Customer']['lastName']
    firstName = json_data['Customer']['firstName']
    msg = firstName + ' ' + lastName 
    customerType = json_data['Customer']['customerTypeID']
    homePhone = ''
    mobilePhone = ''

    try:
        phones = json_data['Customer']['Contact']['Phones']['ContactPhone']
        for phone in phones:
            if phone['useType'] == 'Home':
                homePhone = phone['number']
            if phone['useType'] == 'Mobile':
                mobilePhone = phone['number']
    except:
        print('no phones')

    email = ''
    try:
        email = json_data['Customer']['Contact']['Emails']['ContactEmail']['address']
    except:
        print('no email')

    customerTypeID = json_data['Customer']['customerTypeID']
    customerType = ''
    if customerTypeID == '1':
        customerType = 'Member'
    if customerTypeID == '3':
        customerType = 'Non-member Volunteer'
    villageID = json_data['Customer']['Contact']['custom']

    memberName = firstName + ' ' + lastName
    return jsonify(lightspeedID=lightspeedID,villageID=villageID,\
    memberName=memberName,email=email,homePhone=homePhone,mobilePhone=mobilePhone,customerType=customerType)
    
@app.route('/retrieveCustomerByVillageID', methods=['POST']) 
def retrieveCustomerByVillageID():
    req = request.get_json()
    villageID = req["villageID"]
    #print('villageID - ',villageID)

    # REFRESH TOKEN; SAVE TOKEN
    token = refreshToken()

    # BUILD URL 
    url = 'https://api.lightspeedapp.com/API/Account/' 
    url += app.config['ACCOUNT_ID']
    url += '/Customer.json?load_relations=["Contact"]&Contact.custom=~,' + villageID
    #print('url - ',url)

    headers = {'authorization': 'Bearer ' + token}
    try:
        response = requests.request('GET', url, headers=headers)
    except:
        flash('Operation failed','danger')
        return redirect(url_for('index'))
    json_data = response.json()
    #pprint.pprint(json_data)

    lightspeedID = json_data['Customer']['customerID']
    
    lastName = json_data['Customer']['lastName']
    firstName = json_data['Customer']['firstName']
    villageID = json_data['Customer']['Contact']['custom']
    try:
        email = json_data['Customer']['Contact']['Emails']['ContactEmail']['address']
    except:
        email = ''
    customerTypeID = json_data['Customer']['customerTypeID']
    customerType = ''
    if customerTypeID == '1':
        customerType = 'Member'
    if customerTypeID == '3':
        customerType = 'Non-member Volunteer'
    try:
        phones = json_data['Customer']['Contact']['Phones']['ContactPhone']
        homePhone = ''
        mobilePhone = ''
        for phone in phones:
            #print('useType - ',phone['useType'])

            if phone['useType'] == 'Home':
                homePhone = phone['number']
            if phone['useType'] == 'Mobile':
                mobilePhone = phone['number']
    except:
        homePhone = ''
        mobilePhone = ''
    memberName = firstName + ' ' + lastName
    return jsonify(lightspeedID=lightspeedID,villageID=villageID,memberName=memberName,\
    email=email,homePhone=homePhone,mobilePhone=mobilePhone,customerType=customerType)
    
@app.route('/duesPayment',methods=['POST'])
def duesPayment():
    req = request.get_json()
    lightspeedID = req["lightspeedID"]
    staffID = req["staffID"]
    employeeID = db.session.query(Member.lightspeedID).filter(Member.memberID == staffID)
    itemID = '1234'
    itemAmt = 75
    # url = 'https://api.lightspeedapp.com/API/Account/' 
    # url += app.config['ACCOUNT_ID']
    # url += '/Customer.json?load_relations=["Contact"]&Contact.custom=~,' + villageID
    headers = {'authorization': 'Bearer ' + token}
    AccountID = app.config['ACCOUNT_ID']
    url = "https://api.lightspeedapp.com/API/Account/{AccountID}/Sale.json"

    payload = {
        "employeeID": employeeID,
        "registerID": 1,
        "shopID": 1,
        "customerID": lightspeedID,
        "completed": true,
        "SaleLines": {
            "SaleLine": [
            {
                "itemID": 12,
                "unitQuantity": 1
            },
            {
                "itemID": 28,
                "unitQuantity": 1
            }
            ]
        },
        "SalePayments": {
            "SalePayment": {
                "amount": 75.00,
                "paymentTypeID": 1
            }
        }
    }
    print('payload - ',payload)
    return 'success'

@app.route('/listTransactions', methods=['POST']) 
def listTransactions():
    req = request.get_json()
    print('----------  Start of test  ---------------')
    villageID = req["villageID"]
    lightspeedID = req["lightspeedID"]
    print('villageID - ',villageID)
    print('lightspeedID - ',lightspeedID)
    if lightspeedID == None or lightspeedID == '':
        msg = "Missing lightspeedID"
        return msg,200

    # REFRESH TOKEN; SAVE TOKEN
    token = refreshToken()
    
    # BUILD URL 
    url = 'https://api.lightspeedapp.com/API/Account/' 
    url += app.config['ACCOUNT_ID']
    url += '/Sale.json?load_relations=["Customer","SaleLines.Item"]&customerID=~,' + lightspeedID
    print('------  url for listTransactions follows  ----------------------------------------------')
    print('url - ',url)
    
    headers = {'authorization': 'Bearer ' + token}
    try:
        response = requests.request('GET', url, headers=headers)
        print('-----  valid listTransactions response follows  -----------------------------------------------')
        json_data = response.json()
    except:
        print('======= operation failed ============')
        json_data = response.json()
        msg = "Operation failed"
        return jsonify(msg=msg),200
    
    #Were any sales found?
    count = json_data['@attributes']['count']
    if count == 0:
            print('count is 0')
            return jsonify(msg='Count = 0'),200
    
    # Show json data ....
    print(json_data['Sale'])
    
    try:
        lightspeedID = json_data['Sale'][0]['Customer']['customerID']
    except:
        msg="lightspeedID = failed"
        return jsonify(msg=msg),200

    lastName = json_data['Sale'][0]["Customer"]["lastName"]
    firstName = json_data['Sale'][0]["Customer"]["firstName"]
    print('Name - ',firstName,lastName,'ID - ',lightspeedID)
    
    
    # email = json_data['Customer']['Contact']['Emails']['ContactEmail']['address']
    # customerTypeID = json_data['Customer']['customerTypeID']
    # customerType = ''
    # if customerTypeID == '1':
    #     customerType = 'Member'
    # if customerTypeID == '3':
    #     customerType = 'Non-member Volunteer'
    # phones = json_data['Customer']['Contact']['Phones']['ContactPhone']
    # homePhone = ''
    # mobilePhone = ''
    # for phone in phones:
    #     if phone['useType'] == 'Home':
    #         homePhone = phone['number']
    #     if phone['useType'] == 'Mobile':
    #         mobilePhone = phone['number']
    memberName = firstName + ' ' + lastName
    # return jsonify(lightspeedID=lightspeedID,villageID=villageID,memberName=memberName,\
    # email=email,homePhone=homePhone,mobilePhone=mobilePhone,customerType=customerType)
    return jsonify(lightspeedID=lightspeedID,memberName=memberName),200

def refreshToken():
    import requests
    payload = {
        'refresh_token': app.config['REFRESH_TOKEN'],
        'client_secret': app.config['CLIENT_SECRET'],
        'client_id': app.config['CLIENT_ID'],
        'grant_type': 'refresh_token'
    }

    r = requests.post('https://cloud.lightspeedapp.com/oauth/access_token.php', data=payload).json()
    token = (r['access_token'])
    return token

@app.route('/updatelightspeedID', methods=['GET']) 
def updatelightspeedID():
    print('Start updateLightspeedID ... ')

    # REFRESH TOKEN; SAVE TOKEN
    token = refreshToken()
    start = 0
    batchSize = 100
    recordsUpdated = 0
    numberOfLightspeedRecords = 0
    for i in range(50):
        print('Batch # ',i)

        # BUILD URL 
        url = 'https://api.lightspeedapp.com/API/Account/230019/Customer.json'
        url += '?load_relations=["Contact"]&Contact.custom&offset=' + str(start) + '&limit=' + str(batchSize)

        headers = {'authorization': 'Bearer ' + token}
        response = requests.request('GET', url, headers=headers) 
        json_data = response.json()
        
        count = json_data['@attributes']['count']
        
        if (numberOfLightspeedRecords >= int(count)):
            break
        
        # PRINT ATTRIBUTES DATA
        try:
            offset = json_data['@attributes']['offset']
        except:
            break
        limit = json_data['@attributes']['limit'] 
        
        # RETRIEVE LIGHTSPEED CUSTOMER/CONTACT RECORDS
        try:
            for d in range(int(limit)):
                if (numberOfLightspeedRecords >= int(count)):
                    break
                numberOfLightspeedRecords += 1

                lightspeedID = json_data['Customer'][d]['customerID']
                lastName = json_data['Customer'][d]['lastName']
                firstName = json_data['Customer'][d]['firstName']
                villageID = json_data['Customer'][d]['Contact']['custom']
                email = json_data['Customer'][d]['Contact']['Emails']['ContactEmail']['address']
                memberType = json_data['Customer'][d]['customerTypeID']
        
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
   
    return jsonify(msg=msg)

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
        'customerTypeID': 1,
            'Contact': {
                'custom': villageID,
                'Emails': {
                    'ContactEmail': {
                        'address': email,
                        'useType': 'Primary'
                    }
                },
                'Phones': {
                    'Contact': [{
                        'number':mobilePhone,
                        'useType':'Mobile'
                    },
                    {
                        'number':homePhone,
                        'useType':'Home'
                    },
                    {
                        'number':workPhone,
                        'useType':'Work'
                    }]   
                }
            }
        }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
    except:
        flash('Operation failed','danger')
        return redirect(url_for('index'))
    flash('Customer added','success')
    return redirect(url_for('index'))
