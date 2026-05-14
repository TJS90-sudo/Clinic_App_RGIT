from flask import Flask, request, jsonify, session, abort,redirect, render_template_string, url_for,render_template, Blueprint
from  app.models.models import Person, Employee, Appointment,Patient, Schedule_System


main = Blueprint("main", __name__)

# ---------------- INDEX PAGE ---------------- #
@main.route('/', methods=['GET'])
def home():
    return render_template('index.html')

# ---------------- RECEPTIONIST HOME PAGE ---------------- #
@main.route('/receptionist/home', methods=['GET'])
def receptionist_homepage():
    if not session.get('authenticated'):
        return redirect(url_for('login'))
    Schedule_System_instance= Schedule_System()
    if Schedule_System_instance.AuthenticateSession(session["email"], "staff"):
        today_appointments = Schedule_System_instance.Fetch_bookings_today()

        return render_template("receptionist-dashboard.html",
                                appointments=today_appointments)
    else:
        abort(403)

# ---------------- GENERATE STAFF HOME PAGE ---------------- #
@main.route('/admin/home', methods=['GET'])
def admin_homepage():
    # pseudo
    #if not session.get('authenticated'):
    #    return redirect(url_for('login'))
    #if AuthenticateSession (session["email"], "admin")
        # return render_template("admin_home.html")
    pass


# ---------------- DOCTOR HOME PAGE ---------------- #
@main.route('/doctor/home', methods=['GET'])
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


# ---------------- NURSE HOME PAGE ---------------- #
@main.route('/nurse/home', methods=['GET'])
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

# ---------------- patient HOME PAGE ---------------- #
@main.route('/patient/home', methods=['GET'])
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
