
from flask import Flask, request, jsonify, session, abort,redirect, render_template_string, url_for,render_template, Blueprint
from flask_limiter import Limiter
from  app.models.models import Person, Employee, Appointment,Patient, Schedule_System
from app.services import auth_service
from app.services.auth_service import AuthService,LoginService, PasswordService

auth = Blueprint("auth", __name__)


# ---------------- AUTH & USER ---------------- #
@auth.route('/auth/login', methods=['POST'])
@Limiter.limit("3 per 5 minutes", key_func=lambda: request.form.get('email'))
def login():

    # 1. Get form data (from frontend)
    username = request.form.get('email')
    password = request.form.get('password')
    role = request.form.get('role')
    auth_header = request.headers.get("Authorization")

    if auth_header:
        token = auth_header.replace("Bearer ", "")
        if AuthService().session_valid(token):
            if AuthService.is_valid_employee_role(role) and AuthService.is_2fa_complete(token):
                        user_role = AuthService().get_role(token)
                        if user_role and user_role == role:
                            return redirect(AuthService.get_route(user_role))
                        else:
                            return jsonify({
                                "success": False,
                                "message": "Role mismatch"
                            }), 403
            elif role  == "patient":
                        user_role = AuthService().get_role(token)
                        if user_role and user_role == "patient":
                            return redirect("/patient/home")
                        else:
                            return jsonify({
                                "success": False,
                                "message": "Role mismatch"
                            }), 403
            else:
                return jsonify({
                    "success": False,
                    "message": "Invalid role"
                }), 400
        
        if AuthService().employee_session_valid(token):
            user_role = AuthService().get_role(token)
            if user_role and user_role == role: 
                return redirect(AuthService.get_route(user_role))
            elif user_role  == "patient" and role == "patient":
                return redirect("/patient/home")
            else:
                return jsonify({
                    "success": False,
                    "message": "Role mismatch"
                }), 403
            
    auth_result  = LoginService(username,password).login()

    if not auth_result:
        return jsonify({
            "success": False,
            "message": "Invalid username or password"
        }), 401


    db_role = AuthService().get_role(auth_result['access_token'])

    if not db_role:
        return jsonify({"success": False, "message": "User not found"}), 404

    if role and role != db_role:
        return jsonify({
            "success": False,
            "message": "Role mismatch"
        }), 403

    
    user_role = db_role
    token = auth_result['access_token']
    if AuthService.is_valid_employee_role(user_role):
        return jsonify({
            "success": False,
            "redirect": "setup_2fa"
        })
    else:    
        return jsonify({
            "success": True,
            "redirect": "/patient/home"
        })
    
@auth.route('/patient/home', methods=['GET'])
def patient_homepage():
    # Get logged-in user's email from session
    email = session.get('username')
    patient_data = None
    if email:
        Schedule_System_instance = Schedule_System()
        patient_data = Schedule_System_instance.get_patient_by_email(email)
    # Render template with patient data
    html = open('frontend/pages/patient-dashboard.html').read()
    # Simple string replace for demo; in production use Jinja2 templates
    if patient_data:
        html =  html.replace('User', patient_data.get_name())
        html = html.replace('<!--PATIENT_INFO-->', f"""
        <div class='patient-info-card'>
            <h2>Patient Information</h2>
            <ul>
                <li><b>Name:</b> {patient_data.get_name() or ''}</li>
                <li><b>Email:</b> {patient_data.get_email() or ''}</li>
                <li><b>Contact Number:</b> {patient_data.get_number() or ''}</li>
                <li><b>Address:</b> {patient_data.get_address() or ''}</li>
                <li><b>Date of Birth:</b> {patient_data.get_date_of_birth() or ''}</li>
                <li><b>ID Number:</b> {patient_data.get_id_number() or ''}</li>
                <li><b>Gender:</b> {patient_data.get_gender() or ''}</li>
            </ul>
        </div>
        """)
    else:
        html = html.replace('<!--PATIENT_INFO-->', '<div class="patient-info-card"><b>Patient data not found.</b></div>')
    return render_template_string(html)

@auth.route('/setup_2fa', methods=['GET', 'POST'])
def setup_2fa():
    print("Host:", request.host)
    print("Session keys:", session.keys())

    username = session.get('temp_user')
    secret = session.get('otp_secret')

    # Ensure user came from login
    if not username or not secret:
        return redirect('/')

    Schedule_System_instance = Schedule_System()
    if  session.get('role') =="receptionist":
        session['role']="staff"

    if not Schedule_System_instance.AuthenticateSession(username, session.get('role')):
        return redirect('/')

    totp = pyotp.TOTP(secret)

    if request.method == 'POST':
        code = request.form.get('code')
        if totp.verify(code):
            session['authenticated'] = True
            session['username'] = username
            session["email"]=session['username']
            # clear temporary session data
            session.pop('temp_user', None)
            session.pop('otp_secret', None)

            role = session.get('role')

            if role == "staff":
                return redirect('/receptionist/home')
            elif role == "doctor":
                return redirect('/doctor/home')
            elif role == "nurse":
                return redirect('/nurse/home')
            elif role == "admin":
                return redirect('/admin/home')

        else:
            return "Invalid 2FA code"

    # GET request → show QR code + form
    uri = totp.provisioning_uri(name=username, issuer_name="MyFlaskApp")
    img = qrcode.make(uri)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')

    return render_template('setup_2fa.html', qr_code=img_base64, secret=secret)


@auth.route('/auth/register', methods=['POST'])
def register():
    # pseudo:
    # 1. Get form data
    try:
        email = request.form.get("email")
        plain_password= request.form.get("password")

        val = AuthService.sign_up(email, plain_password)
        # 4. If success: render "update details" page 
        if val:
            # Automatically log in the user and redirect to patient dashboard
            session.permanent = True
            session['authenticated'] = True
            session['username'] = email
            return redirect(url_for('patient_homepage'))
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
