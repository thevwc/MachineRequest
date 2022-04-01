# routes.py

from flask import session, render_template, flash, redirect, url_for, request, jsonify, json, make_response, after_this_request
import pdfkit


from flask_bootstrap import Bootstrap
from werkzeug.urls import url_parse
from app.models import ShopName, Member, MemberActivity, MonitorSchedule, MonitorScheduleTransaction,\
MonitorWeekNote, CoordinatorsSchedule, ControlVariables, DuesPaidYears, Contact, Machines
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

# temp code
# @app.route('/index')
# def index():
#     print ('/index found')
#     return

# LOAD INITIAL LOGIN PAGE
@app.route('/',methods=['GET','POST'])
@app.route('/login',methods=['GET','POST'])
def login():
    print('......................................................................')
    
    if request.method != 'POST':
        return render_template("login.html")

    # PROCESS DATA FROM LOGIN FORM
    print('... POST request from /login')
    memberID = request.form['memberID']
    password = request.form['password']
    print("member ID - ",memberID," password - ",password)
    
    return render_template("login.html")

# MAIN PAGE
@app.route('/index')
def index():
     # BUILD ARRAY OF MACHINE NAMES FOR DROPDOWN LIST OF MACHINES
    #machineNames=[]
    sqlMachines = "SELECT machineID, machineDesc, machineLocation + ' - ' + machineDesc + ' (' + machineID + ')' as machineDisplayName, machineLocation "
    sqlMachines += "FROM MachinesRequiringCertification "
    sqlMachines += "ORDER BY machineDesc, machineLocation"
    #print('sqlMachines - ',sqlMachines)
    machineList = db.engine.execute(sqlMachines)
    if machineList == None:
        flash('No names to list.','danger')
    # for m in machineList:
    #     print('Machine ID - ' + m.machineID,'Desc - ' + m.machineDesc,'Display name -' + m.machineDisplayName)

    # CREATE OBJECT OF NAMES FOR DROPDOWN LIST OF MEMBERS
    sqlNames = "SELECT Last_Name + ', ' + First_Name + ' (' + Member_ID + ')' as memberDisplayName,"
    sqlNames += " Member_ID as villageID FROM tblMember_Data "
    sqlNames += "WHERE Dues_Paid <> 0 "
    sqlNames += "ORDER BY Last_Name, First_Name "

    memberList = db.engine.execute(sqlNames)
    if memberList == None:
        flash('No names to list.','danger')
   
    # CREATE OBJECT OF NAMES FOR DROPDOWN LIST OF INSTRUCTORS
    sqlNames = "SELECT Last_Name + ', ' + First_Name + ' (' + Member_ID + ')' as instructorDisplayName,"
    sqlNames += " Member_ID as villageID FROM tblMember_Data "
    sqlNames += "WHERE machineCertificationStaff = 1 "
    sqlNames += "ORDER BY Last_Name, First_Name "

    instructorList = db.engine.execute(sqlNames)
    if instructorList == None:
        flash('No names to list.','danger')
    return render_template("index.html",machineList=machineList,memberList=memberList,instructorList=instructorList)
    
@app.route('/getMemberLoginData',methods=['POST'])
def getMemberLoginData():
    req = request.get_json()
    memberID = req["memberID"]
    req = request.get_json()
    password = req["password"]

    #  LOOK UP MEMBER ID
    member = db.session.query(Member).filter(Member.Member_ID == memberID).first()
    if member == None:
        msg = "This village ID was not found."
        return jsonify(msg=msg,status=200)
    
    memberName = member.First_Name + ' ' + member.Last_Name
    if member.Nickname != '' and member.Nickname != None:
        memberName = member.First_Name + ' (' + member.Nickname + ') ' + member.Last_Name

    if password != member.Password:
        msg = "The password does not match the password on file for <br>" + memberName + "."
        return jsonify(msg=msg,status=200)
    
    if member.machineCertificationStaff != True:
        msg = "You are not currently authorized to use this application."
        return jsonify(msg=msg)

    msg = "Authorized"
    return jsonify(msg=msg,status=200)
    
@app.route('/displayMembersCertifiedOnSpecificMachine',methods=['GET','POST'])
def displayMachineData():
    req = request.get_json()
    machineID = req["machineID"]
    machine = db.session.query(Machines).filter(Machines.machineID == machineID).first()
    if machine == None:
        msg = "This machine ID was not found."
        return jsonify(msg=msg,status=200)
    machineDesc = machine.machineDesc
    machineLocation = machine.machineLocation
    
    # GET MEMBERS CERTIFIED FOR THIS MACHINE
    certifiedDict = []
    certifiedItem = []
    sp = "EXEC membersCertifiedForSpecificMachine '" + machineID + "'"
    sql = SQLQuery(sp)
    certified = db.engine.execute(sql)

    for c in certified:
        memberName = c.Last_Name + ', ' + c.First_Name
        if c.Nickname is not None:
            if len(c.Nickname) > 0 :
                memberName += ' (' + c.Nickname + ')'
       
        instructorID = c.certifiedBy
        instructor = db.session.query(Member).filter(Member.Member_ID == instructorID).first()
        if (instructor == None):
            instructorName = "Unknown"
        else:
            instructorName = instructor.Last_Name + ', ' + instructor.First_Name
            if instructor.Nickname is not None:
                if len(instructor.Nickname) > 0 :
                    instructorName += ' (' + instructor.Nickname + ')'

        certifiedItem = {
            'memberID':c.villageID,
            'memberName':memberName,
            'machineID':c.machineID,
            'dateCertified':c.dateCertified,
            'certifiedBy':instructorName
        }
        certifiedDict.append(certifiedItem)
    
    msg = 'Machine found'
    return jsonify(msg=msg,machineLocation=machineLocation,machineID=machineID,machineDesc=machineDesc,certifiedDict=certifiedDict)

@app.route('/displayMachineInstructors',methods=['GET','POST'])
def displayMachineInstructors():
    req = request.get_json()
    machineID = req["machineID"]
    machine = db.session.query(Machines).filter(Machines.machineID == machineID).first()
    if machine == None:
        msg = "This machine ID was not found."
        return jsonify(msg=msg,status=200)
    machineDesc = machine.machineDesc
    machineLocation = machine.machineLocation
    
    # GET INSTRUCTOR FOR THIS MACHINE
    instructorsList = []
    sp = "EXEC instructorsForSpecificMachine '" + machineID + "'"
    sql = SQLQuery(sp)
    instructors = db.engine.execute(sql)
    if instructors == None:
        return jsonify(msg="No instructors have been assigned.")
       
    for i in instructors:
        instructorName = i.First_Name 
        if i.Nickname is not None:
            if len(i.Nickname) > 0 :
                instructorName += ' (' + i.Nickname + ')'
        instructorName += ' ' + i.Last_Name
        print('Instructor name - ',instructorName)
        instructorsList.append(instructorName)
    return jsonify(msg="Instructors found",instructorsList=instructorsList)

@app.route('/displayMemberData')
def displayMemberData():
    req = request.get_json()
    villageID = req["villageID"]


    msg = 'Test member data'
    return jsonify(msg=msg)
