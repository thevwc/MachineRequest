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
    
    # CREATE OBJECT OF NAMES FOR DROPDOWN LIST OF MEMBERS
    sqlNames = "SELECT Last_Name + ', ' + First_Name + ' (' + Member_ID + ')' as memberDisplayName,"
    sqlNames += " Member_ID as villageID FROM tblMember_Data "
    sqlNames += "WHERE Dues_Paid <> 0 "
    sqlNames += "ORDER BY Last_Name, First_Name "

    memberList = db.engine.execute(sqlNames)
    if memberList == None:
        flash('No names to list.','danger')
   
   
    return render_template("index.html",memberList=memberList)
    
@app.route('/getMemberLoginData',methods=['POST'])
def getMemberLoginData():
    req = request.get_json()
    memberID = req["memberID"]
    # req = request.get_json()
    # password = req["password"]

    #  LOOK UP MEMBER ID
    member = db.session.query(Member).filter(Member.Member_ID == memberID).first()
    if member == None:
        msg = "This village ID was not found."
        return jsonify(msg=msg,status=200)
    
    memberName = member.First_Name + ' ' + member.Last_Name
    if member.Nickname != '' and member.Nickname != None:
        memberName = member.First_Name + ' (' + member.Nickname + ') ' + member.Last_Name

    # if password != member.Password:
    #     msg = "The password does not match the password on file for <br>" + memberName + "."
    #     return jsonify(msg=msg,status=200)
    
    # if member.machineCertificationStaff != True:
    #     msg = "You are not currently authorized to use this application."
    #     return jsonify(msg=msg)

    # get machine list for member
    msg = "Authorized"
    return jsonify(msg=msg,memberName=memberName,status=200)
    

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
