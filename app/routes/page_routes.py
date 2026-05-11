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
