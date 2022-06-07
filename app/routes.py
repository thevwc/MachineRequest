# routes.py

from flask import session, render_template, flash, redirect, url_for, request, jsonify, json, make_response, after_this_request



from flask_bootstrap import Bootstrap
from werkzeug.urls import url_parse
from app.models import ShopName, Member, MemberActivity, MonitorSchedule, MonitorScheduleTransaction,\
MonitorWeekNote, CoordinatorsSchedule, ControlVariables, DuesPaidYears, Contact, Machines, \
MachineInstructors, MemberMachineCertifications, MachineActivity

from app import app
from app import db
from sqlalchemy import func, case, desc, extract, select, update, text
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, DBAPIError
from sqlalchemy.orm import aliased
from sqlalchemy.sql import text as SQLQuery

import datetime as dt
from datetime import date, datetime, timedelta

import os.path
from os import path


from flask_mail import Mail, Message
mail=Mail(app)
import requests

#from escpos.printer import Network

# LOAD INITIAL LOGIN PAGE

@app.route('/login',methods=['GET','POST'])
def login(): 
    if request.method != 'POST':
        return render_template("login.html")

    # PROCESS DATA FROM LOGIN FORM
    memberID = request.form['memberID']
    password = request.form['password']
    return render_template("login.html")

# MAIN PAGE
@app.route('/',methods=['GET','POST'])
@app.route('/index')
def index():
    today=date.today()
    todaysDate = today.strftime('%B %d, %Y')
    return render_template("index.html",todaysDate=todaysDate)
    
@app.route('/displayMemberData')
def displayMemberData():
    villageID=request.args.get('villageID')
    locationAbbr=request.args.get('location')
    if (locationAbbr == 'RA'):
        locationName = 'Rolling Acres'
        shopNumber = 1
    else:
        locationName = 'Brownwood'
        shopNumber = 2

    # test memberInShopNow
    #sp = "EXEC newMemberMachineCertification '" + memberID + "', '" + todaysDate + "',
    # sp = "EXEC memberInShopNow '" + villageID + "', '" + str(shopNumber) + "'"
    # print('sp - ',sp)
    # sql = SQLQuery
    # result = db.engine.execute(sql)
    # print('result - ',result)
    # sqlSelectSM += "ORDER BY Last_Name, First_Name"
    # result = db.engine.execute(sqlSelectSM)
    # result_as_list = result.fetchall()
    # for row in result_as_list:
    # print(row)

    today=date.today()
    todaysDateSTR = today.strftime('%B %d, %Y')

    mbr = db.session.query(Member).filter(Member.Member_ID == villageID).first()
    if (mbr == None):
        notFoundMsg = 'Member ID was not found.'
        return render_template('index.html',todaysDate=todaysDateSTR,notFoundMsg=notFoundMsg)
    else:
        notFoundMsg = ''

    memberName = mbr.First_Name
    if mbr.Nickname is not None:
        if len(mbr.Nickname) > 0 :
            memberName += ' (' + mbr.Nickname + ')'
    memberName += ' ' + mbr.Last_Name
    mobilePhone = mbr.Cell_Phone
    homePhone = mbr.Home_Phone
    eMail = mbr.eMail

    # Get machines with member certification
    machineDict = []
    machineItem = []
    machines = db.session.query(Machines)\
        .filter(Machines.machineLocation == locationAbbr)\
        .order_by(Machines.machineDesc)
    for m in machines:
        # CLEAR VARIABLES
        certified = False
        certifiedMsg = ''
        authorizationExpired = False
        authorizationExpirationDate = ''
        expirationMsg = ''

        memberCertified = db.session.query(MemberMachineCertifications) \
            .filter(MemberMachineCertifications.machineID == m.machineID) \
            .filter(MemberMachineCertifications.member_ID == villageID).first()
        
        if memberCertified:
            certifiedMsg = 'AUTHORIZED'
            dateCertified = memberCertified.dateCertified
            
            # Is authorization still valid?
            certificationDuration = memberCertified.certificationDuration  
            authorizationExpired = False
            
            # DETERMINE EXPIRATION DATE AND IF AUTHORIZATION HAS EXPIRED
            if certificationDuration.rstrip() != 'UNL':
                authorizationExpirationDate = computedExpirationDate(dateCertified, certificationDuration)
                #print('returned date - ',authorizationExpirationDate)
                expirationMsg = 'until ' + authorizationExpirationDate.strftime('%m-%d-%Y')
                if isExpired(authorizationExpirationDate):
                    authorizationExpired = True
            else:
                expirationMsg = '- PERMANENT'

        machineItem = {
            'machineID': m.machineID,
            'machineDesc': m.machineDesc,
            'machineLocation': m.machineLocation,
            'certifiedMsg':certifiedMsg,
            'authorizationExpired':authorizationExpired,
            'expirationMsg':expirationMsg
        }
        #print('Item - ',machineItem)
        machineDict.append(machineItem)
        
    msg="Success"
    
    return render_template("certifiedMachines.html",msg=msg,todaysDate=todaysDateSTR,\
        memberID=villageID,memberName=memberName,machineDict=machineDict,location=locationName)

@app.route('/printInlineTicket',methods=['POST'])
def printInlineTicket():

    req = request.get_json() 
    villageID = req["villageID"]
    machineID = req["machineID"]
    shopLocation = req["shopLocation"]
    isAuthorized = req["isAuthorized"]
    
    print(villageID,machineID,isAuthorized,shopLocation)

    if shopLocation == 'RA':
        shopNumber = 1
    else:
        shopNumber = 2

    # print('VillageID - ',villageID)
    # print('MachineID - ',machineID)
    # print('shopNumber - ',shopNumber)
    # print('authorized - ',isAuthorized)
    mbr = db.session.query(Member).filter(Member.Member_ID == villageID).first()
    if (mbr == None):
        return jsonify(msg="Member not found.",status=400)

    memberName = mbr.First_Name
    if mbr.Nickname is not None:
        if len(mbr.Nickname) > 0 :
            memberName += ' (' + mbr.Nickname + ')'
    memberName += ' ' + mbr.Last_Name
    mobilePhone = mbr.Cell_Phone
    homePhone = mbr.Home_Phone
    eMail = mbr.eMail

    machine = db.session.query(Machines).filter(Machines.machineID == machineID).first()
    if (machine == None):
        flash('Machine not found.','Danger')
        return jsonify(msg='Machine not found.',status=201)

    machineDesc = machine.machineDesc
    keyInToolCrib = machine.keyInToolCrib
    keyProvider = machine.keyProvider
    
    # BUILD LIST OF KEY PROVIDERS
    sqlKP = "select lfn_name, fnl_name, canAssist, KeyProvider, machineID, tblMember_Data.member_id as villageID "
    sqlKP += "from tblMember_Data "
    sqlKP += "left join machineInstructors on tblMember_Data.member_id = machineInstructors.member_id "
    sqlKP += "where keyProvider = 1 and machineid = '" + machineID + "'"
    
    keyProviders = db.engine.execute(sqlKP)
    keyProvidersDict = []
    keyProvidersItem = []
    if keyProviders == None:
        keyProvidersItem = {name:"No key providers assigned.",
                        inShopNow:false}
        keyProvidersDict.append(keyProvidersItem)
    else:
        for i in keyProviders:
            inShopNow = determineIfInShop(i.villageID,shopNumber)
            keyProvidersItem = {'name':i.fnl_name,
                        'inShopNow':inShopNow}
            keyProvidersDict.append(keyProvidersItem)
        
    # BUILD LIST OF MEMBERS WHO WILL ASSIST
    sqlAssistants = "select lfn_name, fnl_name, canAssist, KeyProvider, machineID, tblMember_Data.member_id as villageID "
    sqlAssistants += "from tblMember_Data "
    sqlAssistants += "left join machineInstructors on tblMember_Data.member_id = machineInstructors.member_id "
    sqlAssistants += "where canAssist = 1 and machineid = '" + machineID + "'"
    
    assistants = db.engine.execute(sqlAssistants)
    assistantsDict = []
    assistantsItem = []
    if assistants == None:
        assistantsItem = {name:"No staff currently assigned.",
                        inShopNow:false}
        assistantsDict.append(assistantsItem)
    else:
        for i in assistants:
            inShopNow = determineIfInShop(i.villageID,shopNumber)
            assistantsItem = {'name':i.fnl_name,
                        'inShopNow':inShopNow}
            assistantsDict.append(assistantsItem)

    today=date.today()
    todaysDateSTR = today.strftime('%B %d, %Y')
    
    activityDateTime = today.strftime('%Y-%m-%d %H:%M')
    

    # UPDATE MACHINE ACTIVITY TABLE
    if isAuthorized :
        sqlInsert = "INSERT INTO [machineActivity] ([member_ID], [startDateTime], [machineID], [shopLocation]) " 
        sqlInsert += " VALUES ('" + villageID + "', '" + activityDateTime + "', '" + machineID + "', '"
        sqlInsert += shopLocation + "')"
        print (sqlInsert)

        try: 
            db.session.execute(sqlInsert)
        except SQLAlchemyError as e:
            error = str(e.__dict__['orig'])
            print('Error - ',error)
            return jsonify(msg="Insert failed",status=201)

    # RETURN DATA TO CLIENT FOR PRINTING TICKET
    return jsonify(msg='SUCCESS',status=200\
        ,ticketName=memberName,isAuthorized=isAuthorized,ticketMobilePhone=mobilePhone,\
        ticketDate=todaysDateSTR,ticketHomePhone=homePhone,ticketeMail=eMail,\
        ticketMachineDesc=machineDesc,ticketMachineID=machineID,\
        keyInToolCrib=keyInToolCrib,keyProvider=keyProvider,\
        keyProvidersDict=keyProvidersDict,assistantsDict=assistantsDict)

# @app.route('/printTicketPage')
# def printTicketPage():
#     print('/printTicketPage')
#     villageID=request.args.get('villageID')
#     machineID=request.args.get('machineID')
#     # print('VillageID - ',villageID)
#     # print('MachineID - ',machineID)

#     mbr = db.session.query(Member).filter(Member.Member_ID == villageID).first()
#     if (mbr == None):
#         msg="Member not found"
#         status=400
#         return jsonify(msg=msg,status=status)

#     memberName = mbr.First_Name
#     if mbr.Nickname is not None:
#         if len(mbr.Nickname) > 0 :
#             memberName += ' (' + mbr.Nickname + ')'
#     memberName += ' ' + mbr.Last_Name
#     mobilePhone = mbr.Cell_Phone
#     homePhone = mbr.Home_Phone
#     eMail = mbr.eMail

#     machine = db.session.query(Machines).filter(Machines.machineID == machineID).first()
#     print('machine - ',machine)

#     if (machine != None):
#         machineDesc = machine.machineDesc
#     else:
#         machineDesc = "?"

#     today=date.today()
#     todaysDateSTR = today.strftime('%B %d, %Y')

#     # print(memberName)
#     # print(machineDesc)
#     # print('desc - ',machine.machineDesc)
#     # print(todaysDateSTR)
#     # print('Key # '+ machineID)
#     # print('-------------------------------------------')

#     return render_template("ticket.html",todaysDate=todaysDateSTR,memberName=memberName,machineDesc=machineDesc,machineID=machineID)
    

# @app.route("/printWeeklyMonitorNotes", methods=["GET"])
# def printWeeklyMonitorNotes():
# 	dateScheduled=request.args.get('date')
# 	shopNumber=request.args.get('shop')
# 	destination = request.args.get('destination')

# 	...
	
	# if (destination == 'PDF') : 
	# 	html = render_template("rptWeeklyNotes.html",\
	# 	beginDate=beginDateSTR,endDate=endDateSTR,\
	# 	locationName=shopName,notes=notes,weekOfHdg=weekOfHdg,\
	# 	todaysDate=todays_dateSTRcurrentWorkingDirectory = os.getcwd()
	# 	pdfDirectoryPath = currentWorkingDirectory + "/app/static/pdf"
	# 	filePath = pdfDirectoryPath + "/rptWeeklyNotes.pdf" 
	# 	options = {"enable-local-file-access": None}
	# 	pdfkit.from_string(html,filePath, options=options)
	# 	return redirect(url_for('index'))
	# else:
	# 	return render_template("rptWeeklyNotes.html",\
	# 		beginDate=beginDateSTR,endDate=endDateSTR,\
	# 		locationName=shopName,notes=notes,weekOfHdg=weekOfHdg,\
	# 		todaysDate=todays_dateSTR
	# 	)
	

@app.route('/printESCticket',methods=['GET'])
def printESCticket():
    print('/printESCticket')
    villageID=request.args.get('villageID')
    machineID=request.args.get('machineID')
    locationAbbr = request.args.get('location')
    if (locationAbbr == 'RA'):
        locationName = 'Rolling Acres'
    else:
        locationName = 'Brownwood'

    print('VillageID - ',villageID)
    print('MachineID - ',machineID)
    print('Location abbr - ',locationAbbr)
    
    mbr = db.session.query(Member).filter(Member.Member_ID == villageID).first()
    if (mbr == None):
        msg="Member not found"
        status=400
        flash('Member not found.','Info')
        return

    memberName = mbr.First_Name
    if mbr.Nickname is not None:
        if len(mbr.Nickname) > 0 :
            memberName += ' (' + mbr.Nickname + ')'
    memberName += ' ' + mbr.Last_Name
    mobilePhone = mbr.Cell_Phone
    homePhone = mbr.Home_Phone
    eMail = mbr.eMail

    machine = db.session.query(Machines).filter(Machines.machineID == machineID).first()
    if (machine != None):
        machineDesc = machine.machineDesc
    else:
        machineDesc = "?"

    today=date.today()
    todaysDate = today.strftime('%B %d, %Y')
    print('Location - ',locationName)
    print('Name - ',memberName)
    print('Home phone - ',homePhone)
    print('Mobile phone - ',mobilePhone)
    print('Email - ',eMail)
    print(machineDesc)
    print(todaysDate)
    print('Key # '+ machineID)
    
   
    # epsonPrinter = Network("192.168.12.126")
    # epsonPrinter.text = memberName + '\n'
    # epsonPrinter.text = todaysDateSTR + '\n'
    # epsonPrinter.text = machineDesc + "\n"
    # epsonPrinter.cut()
    
    
    return render_template('index.html',todaysDate=todaysDate,notFoundMsg='')


# def checkCertification(dateCertified,certificationDuration):
#     if dateCertified == None:
#         return False

#     today=date.today()
#     delta = today - dateCertified
#     daysElapsed = delta.days  
#     certified = False  
#     if certificationDuration.rstrip() == 'UNL':
#         certified = True
#     if certificationDuration.rstrip() == '365 days':
#         if daysElapsed < 365:
#             certified = True
#     if certificationDuration.rstrip() == '180 days':
#         if daysElapsed < 180:
#             certified = True
#     if certificationDuration.rstrip() == '90 days':
#         if daysElapsed < 90:
#             certified = True
#     if certificationDuration.rstrip() == '60 days':
#         if daysElapsed < 60:
#             certified = True
#     if certificationDuration.rstrip() == '30 days':
#         if daysElapsed < 30:
#             certified = True
#     if certificationDuration.rstrip() == '7 days':
#         if daysElapsed < 7:
#             certified = True
#     return certified

def computedExpirationDate(dateCertified,certificationDuration):
    if certificationDuration.rstrip() == '365 days':
        expirationDate = dateCertified + timedelta(days=365)
        return expirationDate
    if certificationDuration.rstrip() == '180 days':
        expirationDate = dateCertified + timedelta(days=180)
        return expirationDate
    if certificationDuration.rstrip() == '90 days':
        expirationDate = dateCertified + timedelta(days=90)
        return expirationDate
    if certificationDuration.rstrip() == '60 days':
        expirationDate = dateCertified + timedelta(days=60)
        return expirationDate
    if certificationDuration.rstrip() == '30 days':
        expirationDate = dateCertified + timedelta(days=30)
        return expirationDate
    if certificationDuration.rstrip() == '7 days':
        expirationDate = dateCertified + timedelta(days=7)
        return expirationDate
    # IF INVALID certificationDuration then return none
    return ''

def isExpired (expirationDate):
    today=date.today()
    delta = today - expirationDate 
    if delta.days > 0:
        return True
    else:
        return False

def determineIfInShop(villageID,shopNumber):
    sqlSelect = "SELECT Top 1 [Member_ID] FROM [dbo].[tblMember_Activity] "
    sqlSelect += "WHERE [Member_ID] = '" + villageID + "' " 
    sqlSelect += "AND CAST([Check_In_Date_Time] AS DATE) = CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'US Eastern Standard Time' AS date) "
    sqlSelect += "AND CAST([Check_Out_Date_Time] AS DATE) IS NULL "
    sqlSelect += "AND [Shop_Number] = " + str(shopNumber)
    #print('sqlSelect - ',sqlSelect)
    result = db.engine.execute(sqlSelect).scalar()
    #print('result - ',result)
    if result != None:
        return 'IN SHOP NOW'
    else:
        return ''