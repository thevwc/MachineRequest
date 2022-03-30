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
    sqlMachines = "SELECT machineID, machineDesc, machineLocation + ' - ' + machineDesc as machineDisplayName, machineLocation "
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
    sqlNames = "SELECT Last_Name + ', ' + First_Name + ' (' + Member_ID + ')' as memberDisplayName,"
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
    
@app.route('/displayMachineData')
def displayMachineData():
    req = request.get_json()
    machineID = req["machineID"]

    msg = 'Test machine data'
    return jsonify(msg=msg)

@app.route('/displayMemberData')
def displayMemberData():
    req = request.get_json()
    villageID = req["villageID"]


    msg = 'Test member data'
    return jsonify(msg=msg)
