
from attrs import validate
from flask import Flask, make_response, request, jsonify, session, abort,redirect, render_template_string, url_for,render_template, Blueprint
from flask_limiter import Limiter
from app.services.authorization.supabase_service import supabase
from  app.services.authorization.validators import isValidEmail, is_valid_employee_role, get_route
from  app.models.models import Person, Employee, Appointment,Patient, Schedule_System
from app.services.authorization.redis_service import redis_service
from app.services.authorization.auth_service import AuthService
from app.services.authorization.validators import isValidEmail, is_valid_employee_role, get_route
auth = Blueprint("auth", __name__)


# ---------------- AUTH & USER ---------------- #
@auth.route('/auth/login', methods=['POST'])
@Limiter.limit("3 per 5 minutes", key_func=lambda: request.form.get('email'))
def login():  

    # 1. Get form data (from frontend)
    username = request.form.get('email')
    password = request.form.get('password')
    role = request.form.get('role')
    
    supabase_service = supabase()

    auth_result  = supabase_service.login(username,password)

    if not auth_result:
        return jsonify({
            "success": False,
            "message": "Invalid username or password"
        }), 401

    auth_service = AuthService()
    db_role = auth_service.get_role(auth_result['access_token'])

    if not db_role:
        return jsonify({"success": False, "message": "User not found"}), 404

    if role and role != db_role:
        return jsonify({
            "success": False,
            "message": "Role mismatch"
        }), 403

    if is_valid_employee_role(db_role):
        auth_service.send_otp(username)
    else:    
        response = jsonify({
            "success": True,
            "redirect": "/patient/home"
        })

        response.set_cookie(
            "access_token",
            auth_result['access_token'],
            httponly=True,
            secure=True,
            samesite="Lax"
        )

        return response, 200
    
@auth.route('/auth/resolve', methods=['GET'])
def session_state():
    #this route is called assumig that in the frontend we have a bearer token 
    auth_header = request.headers.get("Authorization")
    token = auth_header.replace("Bearer ", "")
    supabase_service = supabase()
    if supabase_service.validate_session(token):
        auth_service = AuthService()
        user_role = auth_service.get_role(token)

        if user_role == "patient":
            return jsonify({
                "success": True,
                "redirect": "/patient/home"
            }), 200
        

        if not auth_service.is_2fa_complete(token):
            return supabase_service.send_otp(token)
                
        route = get_route(user_role)
        return jsonify({
            "success": True,
            "redirect": route
        }), 200
    
    return jsonify({
        "success": False,
        "message": "No valid session"
    }), 401

@auth.route('/auth/callback', methods=['GET' ])
def setup_2fa():

    code = request.args.get("code")

    if not code:
        return jsonify({"error": "Missing code"}), 400
    
    supabase_service = supabase()

    response = supabase_service.getSessionFromCode(code)

    session = response.session

    user = response.user

    user_id = user.id

    access_token = session.access_token
    role = AuthService().get_role(access_token)
    
    redis_client = redis_service()
    result = redis_client.addSessionToCache(user_id)

    if result:
        route=get_route(role)
        response = make_response(
            redirect(route)
        )
        response.set_cookie(
            "access_token",
            access_token,
            httponly=True,
            secure=True,
            samesite="Lax"
        )

        return response
    
    return jsonify({"error": "Failed to add session to cache"}), 400

@auth.route('/auth/register', methods=['POST']) 
def register():
    #  Get form data
    try:
        email = request.form.get("email")
        password= request.form.get("password")

        val = supabase().register(email,password) 

        if val:
            return jsonify({"success": False, "redirect": url_for('patient_homepage')}), 500
        else:
            return jsonify({"success": False}), 400
    except Exception as e:
        # Always return JSON, even if an error occurs
        print("Exception during registration:", e)
        return jsonify({"success": False, "error": str(e)}), 500


@auth.route('/users/profile', methods=['GET','POST'])
def update_profile():
    # pseudo:
    # 1. Get form data
    contact_number =request.form.get("phone")
    firstName=request.form.get("firstName")
    LastName=request.form.get("lastName")
    email = request.form.get("email")
    address=request.form.get("address")
    date_of_birth=request.form.get("dateOfBirth")
    gender=request.form.get("gender")
    id_number=request.form.get("idNumber")
    password=request.form.get("password")
    
    # 2. Patient p = Create Patient object using form data
    patient= Patient(name=firstName+" "+LastName, email=email,
                    contact_number=contact_number, address=address, date_of_birth=date_of_birth, 
                    gender=gender, id_number=id_number, password=password)    
    schedule_system_instance = Schedule_System()
    # 3. bool val=Call Schedule_System.changeProfileDetail(p)
    val= schedule_system_instance.changeProfileDetail(patient)
    if val:
        return jsonify({"success": True}), 200
    else:
        return jsonify({"success": False}), 400


@auth.route('/users/password', methods=['PUT'])
def change_password(): #ONLY USBALE FOR PAATIENTS
    # pseudo
    #if AuthenticateSession (session["email"], session.role) 
        
        # Get user id from session
        # Get new password from form
        # email = fetch_patient_email(id)
        # bool val = Call Schedule_System.changePassword(password, email)
        # if val;
        #      render_template(webage,mmsg={succcess_msg})
        # else:
        #       render_template(webage,mmsg={unsucccessful_msg})  
    pass
