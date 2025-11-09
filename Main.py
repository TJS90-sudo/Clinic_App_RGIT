from flask import Flask, request, jsonify, session, abort,redirect, render_template_string, url_for,render_template
from flask_limiter import Limiter
import hashlib
from  models import Person, Employee, Appointment,Patient, Schedule_System
import pyotp
from datetime import timedelta
import qrcode,base64,io
from flask_limiter.util import get_remote_address
from flask_cors import CORS
from flask_session import Session 
app = Flask(__name__,template_folder="frontend/pages")
app.permanent_session_lifetime = timedelta(minutes=30)
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SECRET_KEY'] = 'supersecret'
app.config.update(
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_COOKIE_SECURE=False    # False if not using HTTPS
)

CORS(app, supports_credentials=True)
limiter = Limiter(
    key_func=get_remote_address,
    app=app,                 # app must be passed as keyword
    #default_limits=["200 per day", "50 per hour"]  optional
)
Session(app)        

# API: Get all appointments for logged-in patient
@app.route('/api/patient/appointments', methods=['GET'])
def api_get_patient_appointments():
    email = session.get('username')
    if not email:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401
    Schedule_System_instance = Schedule_System()
    appointments = Schedule_System_instance.get_appointments_by_email(email)
    return jsonify({'success': True, 'appointments': appointments})

# API: Cancel appointment
@app.route('/api/patient/appointments/<int:appointment_id>/cancel', methods=['POST'])
def api_cancel_appointment(appointment_id):
    email = session.get('username')
    if not email:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401
    Schedule_System_instance = Schedule_System()
    ok = Schedule_System_instance.cancel_appointment(appointment_id, email)
    return jsonify({'success': ok})

# API: Delete appointment
@app.route('/api/patient/appointments/<int:appointment_id>/delete', methods=['POST'])
def api_delete_appointment(appointment_id):
    email = session.get('username')
    if not email:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401
    Schedule_System_instance = Schedule_System()
    ok = Schedule_System_instance.delete_appointment(appointment_id, email)
    return jsonify({'success': ok})

# API: Reschedule appointment
@app.route('/api/patient/appointments/<int:appointment_id>/reschedule', methods=['POST'])
def api_reschedule_appointment(appointment_id):
    email = session.get('username')
    if not email:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401
    data = request.get_json()
    new_date = data.get('date')
    new_time = data.get('time')
    if not new_date or not new_time:
        return jsonify({'success': False, 'error': 'Missing date or time'}), 400
    Schedule_System_instance = Schedule_System()
    ok = Schedule_System_instance.reschedule_appointment(appointment_id, email, new_date, new_time)
    return jsonify({'success': ok})
# ---------------- HOME ---------------- #
@app.route('/', methods=['GET'])
def home():
    return render_template('index.html')


# ---------------- AUTH & USER ---------------- #
@app.route('/auth/login', methods=['POST'])
@limiter.limit("3 per 5 minutes", key_func=lambda: request.form.get('email'))
def login():

    print("LOGIN ROUTE CALLED")
    print("Session at /auth/login:", dict(session))
    # 1. Get form data (from frontend)
    username = request.form.get('email')
    password = request.form.get('password')
    role = request.form.get('role')
    print ("Role selected:", role)
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    print(f"Login attempt: username={username}, password(raw)={password}, password(hash)={hashed_password}, role={role}")

    # 2. Create Person object (pseudo)
    person = Person(username, hashed_password)
    Schedule_System_instance = Schedule_System()
    # 3. Validate credentials
    login_success = Schedule_System_instance.Login(person)

    print(f"Login DB check result: {login_success}")

    # Helper: detect AJAX/fetch
    def is_ajax():
        return request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.accept_mimetypes['application/json'] > 0

    if not login_success:
        if is_ajax():
            return jsonify({"success": False, "message": "Invalid username or password"}), 401
        else:
            return "Invalid username or password"

    emp_roles=["nurse", "doctor", "admin", "receptionist"]

    if role in emp_roles:
        if session.get('authenticated'):
            redirect_url = None
            session["email"] = username
            if role=="nurse":
                redirect_url = "/nurse/home"
            elif role=="doctor":
                redirect_url = "/doctor/home"
            elif role=="admin":
                redirect_url = "/admin/home"
            elif role=="receptionist":
                redirect_url = "/receptionist/home"
            if is_ajax():
                return jsonify({"success": True, "redirect": redirect_url})
            else:
                return redirect(redirect_url)

        session.permanent = True
        session['temp_user'] = username
        session['role'] = role
        if 'otp_secret' not in session:
            session['otp_secret'] = pyotp.random_base32()
        print("Host, login route:", request.host)
        print("Session keys, login route:", session.keys())
        if is_ajax():
            return jsonify({"success": True, "redirect": url_for('setup_2fa')})
        else:
            return redirect(url_for('setup_2fa'))

    else:
        session.permanent = True    
        session['authenticated'] = True
        session['username'] = username
        if is_ajax():
            return jsonify({"success": True, "redirect": "/patient/home"})
        else:
            return redirect("/patient/home")
    
@app.route('/patient/home', methods=['GET'])
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
                <li><b>Gender:</b> {patient_data.get_id_number() or ''}</li>
            </ul>
        </div>
        """)
    else:
        html = html.replace('<!--PATIENT_INFO-->', '<div class="patient-info-card"><b>Patient data not found.</b></div>')
    return render_template_string(html)

@app.route('/setup_2fa', methods=['GET', 'POST'])
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


@app.route('/auth/register', methods=['POST'])
def register():
    # pseudo:
    # 1. Get form data
    try:
        email = request.form.get("email")
        plain_password= request.form.get("password")
        password= hashlib.sha256(plain_password.encode()).hexdigest()

        # 3. Call 
        schedule_system_instance = Schedule_System()
        val = schedule_system_instance.Register(email, password)
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


@app.route('/users/profile', methods=['GET','POST'])
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


@app.route('/users/password', methods=['PUT'])
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



# ---------------- APPOINTMENTS ---------------- #
@app.route('/appointments', methods=['POST'])
def book_appointment():
    if not session.get('username'):
        return jsonify({'success': False, 'error': 'Not logged in'}), 401
    data = request.get_json() or request.form
    required_fields = ['doctor', 'requestedDate', 'requestedTime', 'appointmentType']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'success': False, 'error': f'Missing field: {field}'}), 400
    email = session['username']
    doctor = data.get('doctor')
    requestedDate = data.get('requestedDate')
    requestedTime = data.get('requestedTime')
    appointmentType = data.get('appointmentType')
    reason = data.get('reason', '')
    specialRequests = data.get('specialRequests', '')
    smsReminder = bool(data.get('smsReminder', True))
    emailReminder = bool(data.get('emailReminder', True))
    Schedule_System_instance = Schedule_System()
    ok, msg = Schedule_System_instance.Book(email, doctor, requestedDate, requestedTime, appointmentType, reason, specialRequests, smsReminder, emailReminder)
    if ok:
        return jsonify({'success': True, 'message': msg})
    else:
        return jsonify({'success': False, 'error': msg}), 500

@app.route('/appointments/cancel', methods=['DELETE'])
def cancel_schedule():
    # pseudo:
    #if not session.get('authenticated'):
    #    return redirect(url_for('login'))
    # bool val= call Schedule_System.CancelSchedule(appointment_id)
    # if val:
        #render_template(page, msg{succes msg})  
    #else:
        #render_template(page, msg{unsuccesful msg})
    pass


@app.route('/appointments/reschedule', methods=['PUT'])
def reschedule():
    # pseudo:
    #  Get new_date, new_time,notes  and appointment_id from form or input
    #  bool val =  Call Schedule_System.rescheduleAppointmentAppointment_ID: string, new_date, new_time, notes)
    #  If val 
    #     render_template(webpage, {message=success})
    #  else:
    #     render_template(webpage, {message=UNsuccessFUL})
    pass

# ---------------- QUEUE & SCHEDULE ---------------- #
@app.route('/queue', methods=['GET'])
def get_queue_position(patient_id):
    # pseudo:
    # Get patient_id from session
    # Get date from query param 
    # val = Call Schedule_System.Get_Queue_Position(patient_id, date)
    # if val => 0:
    #      return val
    #else:
    #      return -1
    pass


@app.route('/queue/update', methods=['PUT'])
def update_queue():
    # pseudo:
    # call Schedule_System.update_queue()
    pass










# ---------------- DOCTOR ---------------- #
@app.route('/doctor/home', methods=['GET'])
def doctor_homepage():
    # pseudo
    if not session.get('authenticated'):
        return redirect(url_for('login'))
    Schedule_System_instance= Schedule_System()
    emp_id= Schedule_System_instance.getEmpIdByEmail(session["email"])
    if Schedule_System_instance.AuthenticateSession(session["email"], "doctor"):
        assigned_patients = Schedule_System_instance.getAssignedPatients(emp_id)
        return render_template("doctors-dashboard.html", appointments=assigned_patients)
    else:
        abort(403)







# ---------------- NURSE ---------------- #
@app.route('/nurse/home', methods=['GET'])
def nurse_homepage():
    if not session.get('authenticated'):
       return redirect(url_for('login'))
    Schedule_System_instance= Schedule_System()

    if Schedule_System_instance.AuthenticateSession(session["email"], "nurse"):
        emp_id= Schedule_System_instance.getEmpIdByEmail(session["email"])
        upcoming_appointments = Schedule_System_instance.getAssignedPatients(emp_id)

        return render_template("nurse-dashboard.html",
                                appointments=upcoming_appointments)
    else:   
        abort(403)






# ---------------- STAFF---------------- #
@app.route('/receptionist/home', methods=['GET'])
def receptionist_homepage():
    if not session.get('authenticated'):
        return redirect(url_for('login'))
    Schedule_System_instance= Schedule_System()
    if Schedule_System_instance.AuthenticateSession(session["email"], "staff"):
        today_appointments = Schedule_System_instance.Fetch_bookings_today()

        return render_template("receptionist-dashboard.html",
                                appointments=today_appointments)

@app.route('/appointments/status', methods=['PUT'])#
def change_patient_status():
    if not session.get('authenticated'):
        return redirect(url_for('login'))
    Schedule_System_instance= Schedule_System()
    if Schedule_System_instance.AuthenticateSession(session["email"], "staff"):
        status=request.form.get('status')
        appointment_id=request.form.get('appointment_id')
        val = Schedule_System_instance.Change_patient_Status(appointment_id, status)
        if not val:
            return "Error updating status"
        return "Status updated successfully"


@app.route('/receptionist/register', methods=['POST'])
def receptionist_register_patient():
    if not session.get('authenticated'):
        return redirect(url_for('login'))
    Schedule_System_instance= Schedule_System()
    if Schedule_System_instance.AuthenticateSession(session["email"], "staff"):
        data = request.form
        try:
            new_patient = Patient(name=data['name'], email=data['email'], phone=data['phone'])
            val = Schedule_System_instance.RegisterPatient(new_patient)
            if val: 
                return "Patient registered successfully"
            return "Error registering patient"
        except Exception as e:
                return "Error registering patient"
    else:
        abort(403)

@app.route('/receptionist/appointments', methods=['POST'])
def receptionist_book_appointment():
    if not session.get('authenticated'):
        return redirect(url_for('login'))
    Schedule_System_instance= Schedule_System()
    if Schedule_System_instance.AuthenticateSession(session["email"], "staff"):
        patient_id = request.form.get('patient_id')
        date = request.form.get('date')
        time = request.form.get('time')
        try:
            val = Schedule_System.BookForPatient(patient_id, date, time)
            if val:
                return "Appointment booked"
            return "Error booking appointment"
        except Exception as e:
            return "Error booking appointment"
    else:
        abort(403)

@app.route('/receptionist/appointments/cancel', methods=['DELETE'])
def receptionist_cancel_appointment():
    if not session.get('authenticated'):
        return redirect(url_for('login'))
    Schedule_System_instance= Schedule_System()
    if Schedule_System_instance.AuthenticateSession(session["email"], "staff"):
        appointment_id = request.form.get('appointment_id')
        try:
            val = Schedule_System.CancelAppointment(appointment_id)
            if val: 
                return "Appointment canceled"
            return "Error canceling appointment"
        except Exception as e:
            return "Error canceling appointment"
    else:
        abort(403)

@app.route('/appointments', methods=['GET'])
def fetch_bookings():
    if not session.get('authenticated'):
        return redirect(url_for('login'))
    Schedule_System_instance= Schedule_System()
    if Schedule_System_instance.AuthenticateSession(session["email"], "staff"):    
        patient_id,date=None
        date=request.args.get('date')
        patient_id=request.args.get('patient_id')
        if date: 
            l1 = Schedule_System_instance.Fetch_bookings(date)
        elif patient_id: 
            l1 = Schedule_System_instance.Fetch_bookings(patient_id)

        if len(l1)==0 :
            return []
        else:
            return l1
    else:
        abort(403)

@app.route('/appointments/today', methods=['GET'])
def fetch_bookings_today():
    if not session.get('authenticated'):
        return redirect(url_for('login'))
    Schedule_System_instance= Schedule_System()
    if Schedule_System_instance.AuthenticateSession(session["email"], "staff"):    
        try:
            l = Schedule_System_instance.Fetch_bookings_today()
            return l
        except Exception as e:
            return []
    else:
        abort(403)


@app.route('/appointments/week', methods=['GET'])
def fetch_bookings_week():
    if not session.get('authenticated'):
        return redirect(url_for('login'))
    Schedule_System_instance= Schedule_System()
    if Schedule_System_instance.AuthenticateSession(session["email"], "staff"):
        try:
            l= Schedule_System_instance.Fetch_bookings_week()
            return l
        except Exception as e:
            return []
    else:
        abort(403)

@app.route('/appointments/staff/scheduleChange', methods=['PUT'])
def change_emp_for_schedule(appointment_id, emp_id):
    if not session.get('authenticated'):
       return redirect(url_for('login'))
    Schedule_System_instance= Schedule_System()
    if Schedule_System_instance.AuthenticateSession(session["email"], "staff"):
        try:
            val = Schedule_System_instance.ChangeEmpForAppointment(appointment_id, emp_id)
            if val:
                message="success"
            else:
                message="unsuccessful"
            return message
        except Exception as e:
            return "unsuccessful"
    else:
        abort(403)


@app.route('/schedule/emergency', methods=['PUT'])
def emergency_schedule():
    if not session.get('authenticated'):
       return redirect(url_for('login'))
    Schedule_System_instance= Schedule_System()
    if Schedule_System_instance.AuthenticateSession(session["email"], "staff"):
        return Schedule_System_instance.Emergency()
    

@app.route('/notifications/patients', methods=['POST'])
def notify_patients():
    if not session.get('authenticated'):
       return redirect(url_for('login'))
    Schedule_System_instance= Schedule_System()
    if Schedule_System_instance.AuthenticateSession(session["email"], "staff"):
        try:
            val = Schedule_System_instance.Notify_Patients()
            if val:
                message="success"
            else:
                message="unsuccessful"
            return message
        except Exception as e:
            return "unsuccessful"   
    else:
        abort(403)

@app.route('/appointments/confirm', methods=['PUT'])
def confirm_booking(): 
    if not session.get('authenticated'):
        return redirect(url_for('login'))
    Schedule_System_instance= Schedule_System()
    if Schedule_System_instance.AuthenticateSession (session["email"], "staff"):
        
        appointment_id= request.form.get('appointment_id')
        Employee_id = request.form.get('employee_id')
        val = Schedule_System_instance.ConfirmBooking(appointment_id, Employee_id)
        if val:
            return "Booking confirmed"
        return "Error confirming booking"
    else:
        abort(403)






# ---------------- ADMIN ---------------- #
@app.route('/admin/home', methods=['GET'])
def admin_homepage():
    # pseudo
    #if not session.get('authenticated'):
    #    return redirect(url_for('login'))
    #if AuthenticateSession (session["email"], "admin")
        # return render_template("admin_home.html")
    pass
@app.route('/reports/appointments', methods=['GET'])
def appointment_stats():
    # pseudo
    #if not session.get('authenticated'):
    #    return redirect(url_for('login'))
    #if AuthenticateSession (session["email"], "admin")
        
        # return Schedule_System.generateAppointmentStats()
    pass

@app.route('/reports/queue', methods=['GET'])
def queue_performance():
    # pseudo:
    #if not session.get('authenticated'):
    #    return redirect(url_for('login'))
    #if AuthenticateSession (session["email"], "admin")    
        # return Schedule_System.generateQueuePerformance()
    pass

@app.route('/reports/utilization', methods=['GET'])
def utilization_report():
    # pseudo
    #if not session.get('authenticated'):
    #    return redirect(url_for('login'))
    #if AuthenticateSession (session["email"], "admin")
        
        # return  Schedule_System.generateUtilizationReport()
    pass

@app.route('/staff/deletion', methods=['POST'])
def delete_staff():
    # pseudo
    #if not session.get('authenticated'):
    #    return redirect(url_for('login'))
    #if AuthenticateSession (session["email"], "admin")
        #emp_id = input into post method    
        #  Employee e= Fetch_employee(emp_id) 
        #if e:
            #  bool val = Call Schedule_System.deleteStaff(e)
            # if val:
            #     render_template(webpage, {message=success})
            #  else:
            #     render_template(webpage, {message=UNsuccessFUL})
    pass

@app.route('/staff/update', methods=['PUT'])
def update_staff(emp_id):
    # pseudo
    #if not session.get('authenticated'):
    #    return redirect(url_for('login'))
    #if AuthenticateSession (session["email"], "admin")
        
        # Get form data
        # Employee employee = Create Employee object using form data
        # bool val= Call Schedule_System.updateStaffDetail(employee)
            # if val:
        #     render_template(webpage, {message=success})
        #  else:
        #     render_template(webpage, {message=UNsuccessFUL})
    pass

@app.route('/staff', methods=['POST'])
def create_staff():
    # pseudo
    #if not session.get('authenticated'):
    #    return redirect(url_for('login'))
    #if AuthenticateSession (session["email"], "admin")
        # Get form data
        # Employee employee = Create Employee object using form data
        # bool val = Call Schedule_System.createStaff(employee)
        # if val:
        #     render_template(webpage, {message=success})
        #  else:
        #     render_template(webpage, {message=UNsuccessFUL})
    pass

@app.route('/schedule/generate', methods=['POST'])
def schedule_system_route():
    """    if not session.get('authenticated'):
        return redirect(url_for('login'))
        Schedule_System_instance= Schedule_System()
        if Schedule_System_instance.AuthenticateSession(session["email"], "staff"):
            
            # 1. Get bookings_per_day, num_rooms from form or defaults
            # 2. bool val = Call Schedule_System.generateTimeSlots(bookings_per_day, num_rooms)
            # if val:
            #     render_template(webpage, {message=success})
            #  else:
            #     render_template(webpage, {message=UNsuccessFUL})
        pass"""
    pass



if __name__ == "__main__":
    app.run(debug=True)

