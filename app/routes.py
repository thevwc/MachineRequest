# routes.py

from flask import session, render_template, flash, redirect, url_for, request, jsonify, json, make_response, after_this_request
import pdfkit


from flask_bootstrap import Bootstrap
from werkzeug.urls import url_parse
from app.models import ShopName, Member, MemberActivity, MonitorSchedule, MonitorScheduleTransaction,\
MonitorWeekNote, CoordinatorsSchedule, ControlVariables, DuesPaidYears, Contact, Machines, \
MachineInstructors, MemberMachineCertifications
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
    if request.method != 'POST':
        return render_template("login.html")

    # PROCESS DATA FROM LOGIN FORM
    memberID = request.form['memberID']
    password = request.form['password']
    return render_template("login.html")

# MAIN PAGE
@app.route('/index')
def index():
     # BUILD ARRAY OF MACHINE NAMES FOR DROPDOWN LIST OF MACHINES
    #machineNames=[]
    sqlMachines = "SELECT machineID, machineDesc, machineLocation + ' - ' + machineDesc + ' (' + machineID + ')' as machineDisplayName, machineLocation "
    sqlMachines += "FROM MachinesRequiringCertification "
    sqlMachines += "ORDER BY machineDesc, machineLocation"
    
    machineList = db.engine.execute(sqlMachines)
    if machineList == None:
        flash('No names to list.','danger')
    
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
    
@app.route('/displayMachineInstructorsAndMembers',methods=['GET','POST'])
def displayMachineData():
    req = request.get_json()
    machineID = req["machineID"]
    machine = db.session.query(Machines).filter(Machines.machineID == machineID).first()
    if machine == None:
        msg = "Machine ID " + machineID + " was not found."
        return jsonify(msg=msg,status=400)
    machineDesc = machine.machineDesc
    machineLocation = machine.machineLocation
    
    # GET INSTRUCTORS FOR THIS MACHINE
        # GET INSTRUCTOR FOR THIS MACHINE
    instructorsList = []
    sp = "EXEC instructorsForSpecificMachine '" + machineID + "'"
    sql = SQLQuery(sp)
    instructors = db.engine.execute(sql)
    if instructors == None:
        instructorsList.append("No instructors assigned.")
    else:
        for i in instructors:
            instructorName = i.First_Name 
            if i.Nickname is not None:
                if len(i.Nickname) > 0 :
                    instructorName += ' (' + i.Nickname + ')'
            instructorName += ' ' + i.Last_Name
            instructorsList.append(instructorName)

    # GET MEMBERS CERTIFIED FOR THIS MACHINE
    certifiedDict = []
    certifiedItem = []
    sp = "EXEC membersCertifiedForSpecificMachine '" + machineID + "'"
    sql = SQLQuery(sp)
    certified = db.engine.execute(sql)
    if certified == None:
        memberName = 'No members have been certified.'
        certifiedItem = {
                'memberID':'',
                'memberName':memberName,
                'machineID':machineID,
                'dateCertified':'',
                'certifiedBy':''
        }
        certifiedDict.append(certifiedItem)
    else:
        for c in certified:
            memberName = c.First_Name
            if c.Nickname is not None:
                if len(c.Nickname) > 0 :
                    memberName += ' (' + c.Nickname + ')'
            memberName += ' ' + c.Last_Name

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
    msg="Success"
    status=200
    return jsonify(msg=msg,status=status,machineLocation=machineLocation,machineID=machineID,
    machineDesc=machineDesc,instructorsList=instructorsList,certifiedDict=certifiedDict)


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
            mbrName += ' (' + mbr.Nickname + ')'
    memberName += ' ' + mbr.Last_Name
    mobilePhone = mbr.Cell_Phone
    homePhone = mbr.Home_Phone
    eMail = mbr.eMail
    msg="Success"
    
    return jsonify(msg=msg,memberName=memberName,mobilePhone=mobilePhone,homePhone=homePhone,eMail=eMail)

@app.route('/displayMachineInstructors',methods=['GET','POST'])
def displayMachineInstructors():
    req = request.get_json()
    instructorID = req["instructorID"]
    instructor = db.session.query(Member).filter(Member.Member_ID == instructorID).first()
    if instructor == None:
        msg = "Instructor ID " + machineID + " was not found."
        return jsonify(msg=msg,status=201)
    instructorName = instructor.First_Name
    if instructor.Nickname is not None:
        if len(instructor.Nickname) > 0 :
            instructorName += ' (' + instructor.Nickname + ')'
    instructorName += ' ' + instructor.Last_Name
    mobilePhone = instructor.Cell_Phone
    homePhone = instructor.Home_Phone
    eMail = instructor.eMail
    msg="Instructor found."

    # Get all machines and mark those this instructor may certifify
    machineDict = []
    machineItem = []
    machines = db.session.query(Machines)
    for m in machines:
        instructorCertified = db.session.query(MachineInstructors)\
            .filter(MachineInstructors.machineID == m.machineID)\
            .filter(MachineInstructors.member_ID == instructorID).scalar() is not None
        
        machineItem = {
            'machineID': m.machineID,
            'machineDesc': m.machineDesc + ' ('+m.machineID + ')',
            'machineLocation': m.machineLocation,
            'instructorCertified':instructorCertified
        }
        
        machineDict.append(machineItem)
        msg="Success"
    return jsonify(msg=msg,status=200,instructorName=instructorName,mobilePhone=mobilePhone,\
        homePhone=homePhone,eMail=eMail,machineDict=machineDict)
