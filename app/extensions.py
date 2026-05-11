from flask import Flask, request, jsonify, session, abort,redirect, render_template_string, url_for,render_template
from app.services.auth_service import AuthService,LoginService, PasswordService
from  app.models.models import Person, Employee, Appointment,Patient, Schedule_System
import pyotp
from datetime import timedelta
import qrcode,base64,io
from flask_cors import CORS
from flask_session import Session 
from supabase import ClientOptions, create_client, Client


from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_session import Session
from flask_cors import CORS
from werkzeug.local import LocalProxy
from flask import g, current_app
from supabase import create_client
from flask_storage import FlaskSessionStorage
import os
load_dotenv()

limiter = Limiter(key_func=get_remote_address)
sess = Session()
cors = CORS()
url = os.environ.get("SUPABASE_URL", "")
key = os.environ.get("SUPABASE_KEY", "")


def get_supabase():

    if "supabase" not in g:

        g.supabase = create_client(
            current_app.config["SUPABASE_URL"],
            current_app.config["SUPABASE_KEY"]
        )

    return g.supabase


supabase = LocalProxy(get_supabase)