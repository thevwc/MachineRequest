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

import lightspeed_api
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
    #print('sqlSelect - ',sqlSelect)

    nameList = db.engine.execute(sqlSelect)
    position = 0
    for n in nameList:
        position += 1
        lastFirst = n.Last_Name + ', ' + n.First_Name 
        if (n.Nickname != None and n.Nickname != ''):
            lastFirst += ' (' + n.Nickname + ')'
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
    #todaysDate = todays_date.strftime('%-m-%-d-%Y')
    displayDate = todays_date.strftime('%B %-d, %Y') 

    # GET MEMBER NAME
    member = db.session.query(Member).filter(Member.Member_ID == memberID).first()
    displayName = member.First_Name
    if (member.Nickname != None and member.Nickname != ''):
        displayName += ' (' + member.Nickname + ')'
    displayName += ' ' + member.Last_Name
    
    return render_template("rptTransactions.html")
    

# GET CUSTOMER RECORD BY CUSTOMER ID (LIGHTSPEED #)
@app.route('/retrieveCustomerByID')
def retrieveCustomerByID():
    c = {'account_id': '230019',
        'client_id': '0ec071521972565d2cf9258ae86d413fef4265cf29dba51662c083c48a429370',
        'client_secret': 'cfb0bf58140eaa2f15b1e698c6b5470a4ab05d8ed65b0cd3013a9c94117d0283',
        'refresh_token': '0e5c9948da5e257f1f55de872c6901d6b3975b04'
    }

    ls = lightspeed_api.Lightspeed(c)

    # Get a customer record
    r = ls.get('Customer/1')
    pprint.pprint(r)
    # s = ls.get('Contact/127')
    return redirect(url_for('index'))

@app.route('/retrieveCustomerByVillageID/<villageID>') 
def retrieveCustomerByVillageID(villageID):

    # REFRESH TOKEN; SAVE TOKEN
    token = refreshToken()

    # BUILD URL 
    url = 'https://api.lightspeedapp.com/API/Account/230019/Customer.json?load_relations=["Contact"]&Contact.custom=~,' + villageID
    #headers = {'authorization': 'Bearer c69c7b31ce5b6caf176c189ba741f9ec4b231a20'}
    headers = {'authorization': 'Bearer ' + token}
    response = requests.request('GET', url, headers=headers)
    data_json = response.json()
    print('------- Pretty Print JSON String ----------')
    pprint.pprint(data_json)
    print('--------------------------------------------------------')
    
    lightspeedID = data_json['Customer']['customerID']
    lastName = data_json['Customer']['lastName']
    firstName = data_json['Customer']['firstName']
    villageID = data_json['Customer']['Contact']['custom']
    email = data_json['Customer']['Contact']['Emails']['ContactEmail']['address']
    
    print('--------  MEMBER DATA -----------')
    print('Lightspeed ID: ',lightspeedID, '\nName: ',firstName + ' ' + lastName, 
    '\nVillage ID - ',villageID)
    print('--------------------------------------------------------')
    
    return redirect(url_for('index'))

def refreshToken():
    import requests
    payload = {
        'refresh_token': '0e5c9948da5e257f1f55de872c6901d6b3975b04',
        'client_secret': 'cfb0bf58140eaa2f15b1e698c6b5470a4ab05d8ed65b0cd3013a9c94117d0283',
        'client_id': '0ec071521972565d2cf9258ae86d413fef4265cf29dba51662c083c48a429370',
        'grant_type': 'refresh_token'
    }
    r = requests.post('https://cloud.lightspeedapp.com/oauth/access_token.php', data=payload).json()
    #print('r - ',r)
    token = (r['access_token'])
    return token

@app.route('/updateLightspeedID') 
def updateLightspeedID():
    # REFRESH TOKEN; SAVE TOKEN
    token = refreshToken()
    start = 0
    batchSize = 100
    recordCnt = 0
    for i in range(50):
        # BUILD URL 
        url = 'https://api.lightspeedapp.com/API/Account/230019/Customer.json'
        url += '?load_relations=["Contact"]&Contact.custom&offset=' + str(start) + '&limit=' + str(batchSize)
        print(url)

        headers = {'authorization': 'Bearer ' + token}
        response = requests.request('GET', url, headers=headers) 
        data_json = response.json()

        # PRINT ATTRIBUTES DATA
        len_data_json = len(data_json)
        print('Batch ',i)
        count = data_json['@attributes']['count']
        offset = data_json['@attributes']['offset']
        limit = data_json['@attributes']['limit']

        print ('.............. attributes of json file .......................')
        print('length of data_json - ',len_data_json)
        print('count - ',count)
        print('offset - ',offset)
        print('limit - ',limit)
        
        # PRINT CUSTOMER DATA
        print('--------  MEMBER DATA -----------')
        print ("{:<5} {:<5} {:<5} {:<20} {:<10} {:<5} {:<35}".format('#','d','ID', 'Name','VillageID', 'Type', 'email'))
        for d in range(int(limit)):
            lightspeedID = data_json['Customer'][d]['customerID']
            lastName = data_json['Customer'][d]['lastName']
            firstName = data_json['Customer'][d]['firstName']
            villageID = data_json['Customer'][d]['Contact']['custom']
            email = data_json['Customer'][d]['Contact']['Emails']['ContactEmail']['address']
            memberType = data_json['Customer'][d]['customerTypeID']
    
            print ("{:<5} {:<5} {:<5} {:<20} {:<10} {:<5} {:<35}".format(str(recordCnt),str(d),lightspeedID, firstName + ' ' + lastName,villageID, memberType, email))
            
            # UPDATE lightspeedID IN tblMember_Data
            sqlUpdate = "UPDATE tblMember_Data SET lightspeedID = '" + lightspeedID + "' "
            sqlUpdate += "WHERE Member_ID = '" + villageID + "'"
            db.engine.execute(sqlUpdate)
            
            recordCnt += 1
            if (recordCnt >= int(count)):
                flash("Records updated - "+str(recordCnt))
                return redirect(url_for('index'))
        start += batchSize
        
        
    return redirect(url_for('index'))


@app.route('/addCustomer')
def addCustomer():
    villageID = '123456'
    firstName = 'Jane'
    lastName = 'Doe'
    email = 'hartl1r@gmail.com'

    # BUILD JSON FILE ?

    url = "https://api.lightspeedapp.com/API/Account/230019/Customer.json"
    print(url)

    payload = {
        "firstName": firstName,
        "lastName": lastName,
        "customerTypeID":1,
        "Contact": {
            "custom":villageID,
            "email":email
            }
        }
    
    token = refresh_token()
    headers = {'authorization': 'Bearer ' + token}
    response = requests.request("POST", url, data=payload, headers=headers)

    print(response.text)
    
    return redirect(url_for('index'))
