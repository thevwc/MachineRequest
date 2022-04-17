# routes.py

from flask import session, render_template, flash, redirect, url_for, request, jsonify, json, make_response, after_this_request
import pdfkit


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

from escpos.printer import Network

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
    todaySTR = today.strftime('%B %d, %Y')
    return render_template("index.html",todaysDate=todaySTR)
    
@app.route('/lookUpMember',methods=['POST'])
def lookUpMember():
    req = request.get_json()
    memberID = req["villageID"]
    
    #  LOOK UP MEMBER ID
    member = db.session.query(Member).filter(Member.Member_ID == memberID).first()
    if member == None:
        msg = "Member ID " + memberID + " was not found."
        memberName = msg
        return jsonify(msg=msg,memberName=memberName,status=201)
    
    if member.Nickname != '' and member.Nickname != None:
        memberName = member.First_Name + ' (' + member.Nickname + ') ' + member.Last_Name
    else:
        memberName = member.First_Name + ' ' + member.Last_Name
    
    # Get machines with member certification
    machineDict = []
    machineItem = []
    machines = db.session.query(Machines)
    for m in machines:
        memberCertified = db.session.query(MemberMachineCertifications) \
            .filter(MemberMachineCertifications.machineID == m.machineID) \
            .filter(MemberMachineCertifications.member_ID == memberID).first()
        if memberCertified is None:
            continue

        machineItem = {
            'machineID': m.machineID,
            'machineDesc': m.machineDesc + ' ('+m.machineID + ')',
            'machineLocation': m.machineLocation,
            'dateCertified':memberCertified.dateCertified.strftime('%m-%d-%Y')
        }
        machineDict.append(machineItem)

    msg = "Member found."
    return jsonify(msg=msg,memberName=memberName,machineDict=machineDict,status=200)
    

@app.route('/displayMemberData',methods=['POST'])
def displayMemberData():
    req = request.get_json() 
    villageID = req["villageID"]
    location = req["location"]
    mbr = db.session.query(Member).filter(Member.Member_ID == villageID).first()
    if (mbr == None):
        msg="Member not found"
        status=400
        return jsonify(msg=msg,status=status)

    memberName = mbr.First_Name
    if mbr.Nickname is not None:
        if len(mbr.Nickname) > 0 :
            memberName += ' (' + mbr.Nickname + ')'
    memberName += ' ' + mbr.Last_Name
    mobilePhone = mbr.Cell_Phone
    homePhone = mbr.Home_Phone
    eMail = mbr.eMail

    # Display machines with member certification
    # Get all machines and mark those this instructor may certifify
    machineDict = []
    machineItem = []
    machines = db.session.query(Machines)
    for m in machines:
        memberCertified = db.session.query(MemberMachineCertifications) \
            .filter(MemberMachineCertifications.machineID == m.machineID) \
            .filter(MemberMachineCertifications.member_ID == villageID).first()
        if memberCertified is None:
            continue

        machineItem = {
            'machineID': m.machineID,
            'machineDesc': m.machineDesc + ' ('+m.machineID + ')',
            'machineLocation': m.machineLocation,
            'dateCertified':memberCertified.dateCertified.strftime('%m-%d-%Y')
        }
        print(machineItem)
        machineDict.append(machineItem)

    msg="Success"
    
    return jsonify(msg=msg,memberName=memberName,mobilePhone=mobilePhone,homePhone=homePhone,eMail=eMail,machineDict=machineDict)

@app.route('/printTicket',methods=['POST'])
def printTicket():
    req = request.get_json() 
    villageID = req["villageID"]
    machineID = req["machineID"]
    
    # print('VillageID - ',villageID)
    # print('MachineID - ',machineID)

    mbr = db.session.query(Member).filter(Member.Member_ID == villageID).first()
    if (mbr == None):
        msg="Member not found"
        status=400
        return jsonify(msg=msg,status=status)

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
    todaysDateSTR = today.strftime('%B %d, %Y')
    
    activityDateTime = today.strftime('%Y-%m-%d %H:%M')
    shopLocation = 'BW'

    # UPDATE MACHINE ACTIVITY TABLE
    #print(machineID,villageID,activityDateTime,shopLocation)
   
    # try:
    #     activity = MachineActivity(machineID=machineID,member_ID=villageID,startDateTime=activityDateTime,shopLocation=shopLocation)
    #     db.session.add(activity)
    #     db.session.commit()
    # except SQLAlchemyError as e:
    #     error = str(e.__dict__['orig'])
    #     print('Error - ',error)
    #     db.session.rollback()

    # RETURN DATA TO CLIENT FOR PRINTING TICKET
    msg='Success'
    return jsonify(msg=msg,ticketName=memberName,ticketMobilePhone=mobilePhone,\
        ticketDate=todaysDateSTR,ticketHomePhone=homePhone,ticketeMail=eMail,\
        ticketMachineDesc=machineDesc,ticketMachineID=machineID)

@app.route('/printTicketPage')
def printTicketPage():
    villageID=request.args.get('villageID')
    machineID=request.args.get('machineID')

    mbr = db.session.query(Member).filter(Member.Member_ID == villageID).first()
    if (mbr == None):
        msg="Member not found"
        status=400
        return jsonify(msg=msg,status=status)

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
    todaysDateSTR = today.strftime('%B %d, %Y')

    print(memberName)
    print(machineDesc)
    print(todaysDateSTR)
    print('Key # '+ machineID)
    print('-------------------------------------------')

    return render_template("ticket.html",todaysDate=todaysDateSTR,memberName=memberName,machineDesc=machineDesc,machineID=machineID)
    

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
	

@app.route('/printEpsonTicket',methods=['POST'])
def printEpsonTicket():
    req = request.get_json() 
    villageID = req["villageID"]
    machineID = req["machineID"]
    print('VillageID - ',villageID)
    print('MachineID - ',machineID)

    mbr = db.session.query(Member).filter(Member.Member_ID == villageID).first()
    if (mbr == None):
        msg="Member not found"
        status=400
        return jsonify(msg=msg,status=status)

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
    todaysDateSTR = today.strftime('%B %d, %Y')

    print(memberName)
    print(machine.machineDesc)
    print(todaysDateSTR)
    print('Key # '+ machineID)
    print('-------------------------------------------')

   
    epsonPrinter = Network("192.168.12.126")
    epsonPrinter.text = memberName + '\n'
    epsonPrinter.text = todaysDateSTR + '\n'
    epsonPrinter.text = machineDesc + "\n"
    epsonPrinter.cut()
    msg="Success"
    
    return jsonify(msg=msg)