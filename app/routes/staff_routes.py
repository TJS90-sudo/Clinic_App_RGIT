import base64
import io
from flask import Flask, request, jsonify, session, abort,redirect, render_template_string, url_for,render_template, Blueprint
from  app.models.models import Person, Employee, Appointment,Patient, Schedule_System


staff = Blueprint("staff", __name__)
# ---------------- STAFF---------------- #

@staff.route('/appointments/status', methods=['PUT'])#
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


@staff.route('/receptionist/register', methods=['POST'])
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

@staff.route('/receptionist/appointments', methods=['POST'])
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

@staff.route('/receptionist/appointments/cancel', methods=['DELETE'])
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

@staff.route('/appointments', methods=['GET'])
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

@staff.route('/appointments/today', methods=['GET'])
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


@staff.route('/appointments/week', methods=['GET'])
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

@staff.route('/appointments/staff/scheduleChange', methods=['PUT'])
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


@staff.route('/schedule/emergency', methods=['PUT'])
def emergency_schedule():
    if not session.get('authenticated'):
       return redirect(url_for('login'))
    Schedule_System_instance= Schedule_System()
    if Schedule_System_instance.AuthenticateSession(session["email"], "staff"):
        return Schedule_System_instance.Emergency()
    

@staff.route('/notifications/patients', methods=['POST'])
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

@staff.route('/appointments/confirm', methods=['PUT'])
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
