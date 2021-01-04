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

@app.route('/')
@app.route('/index/')
@app.route('/index', methods=['GET'])
def index():
    # BUILD ARRAY OF NAMES FOR DROPDOWN LIST OF MEMBERS
    nameArray=[]
    sqlSelect = "SELECT Last_Name, First_Name, Member_ID FROM tblMember_Data "
    sqlSelect += "ORDER BY Last_Name, First_Name "
    nameList = db.engine.execute(sqlSelect)
    position = 0
    for n in nameList:
        position += 1
        lastFirst = n.Last_Name + ', ' + n.First_Name + ' (' + n.Member_ID + ')'
        nameArray.append(lastFirst)
    return render_template("index.html",nameList=nameArray)
   
#PRINT MEMBER LIGHTSPEED TRANSACTIONS
@app.route("/prtTransactions", methods=["GET"])
def prtMonitorTransactions():
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
    
@app.route('/retrieveCustomer')
def retrieveCustomer():
    c = {'account_id': '230019',
    'client_id': '0ec071521972565d2cf9258ae86d413fef4265cf29dba51662c083c48a429370',
    'client_secret': 'cfb0bf58140eaa2f15b1e698c6b5470a4ab05d8ed65b0cd3013a9c94117d0283',
    'refresh_token': '0e5c9948da5e257f1f55de872c6901d6b3975b04'
}
 
ls = lightspeed_api.Lightspeed(cArray)

# Get a customer record
r = ls.get('Customer/1')

pprint.pprint(r)