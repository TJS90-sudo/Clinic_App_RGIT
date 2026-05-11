from flask import Flask, request, jsonify, session, abort,redirect, render_template_string, url_for,render_template, Blueprint
from  app.models.models import Person, Employee, Appointment,Patient, Schedule_System


appointment = Blueprint("appointment", __name__)

# API: Get all appointments for logged-in patient
@appointment.route('/api/patient/appointments', methods=['GET'])
def api_get_patient_appointments():
    email = session.get('username')
    if not email:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401
    Schedule_System_instance = Schedule_System()
    appointments = Schedule_System_instance.get_appointments_by_email(email)
    return jsonify({'success': True, 'appointments': appointments})

# API: Cancel appointment
@appointment.route('/api/patient/appointments/<int:appointment_id>/cancel', methods=['POST'])
def api_cancel_appointment(appointment_id):
    email = session.get('username')
    if not email:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401
    Schedule_System_instance = Schedule_System()
    ok = Schedule_System_instance.cancel_appointment(appointment_id, email)
    return jsonify({'success': ok})

# API: Delete appointment
@appointment.route('/api/patient/appointments/<int:appointment_id>/delete', methods=['POST'])
def api_delete_appointment(appointment_id):
    email = session.get('username')
    if not email:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401
    Schedule_System_instance = Schedule_System()
    ok = Schedule_System_instance.delete_appointment(appointment_id, email)
    return jsonify({'success': ok})

# API: Reschedule appointment
@appointment.route('/api/patient/appointments/<int:appointment_id>/reschedule', methods=['POST'])
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


# ---------------- APPOINTMENTS ---------------- #
@appointment.route('/appointments', methods=['POST'])
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

@appointment.route('/appointments/cancel', methods=['DELETE'])
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


@appointment.route('/appointments/reschedule', methods=['PUT'])
def reschedule():
    # pseudo:
    #  Get new_date, new_time,notes  and appointment_id from form or input
    #  bool val =  Call Schedule_System.rescheduleAppointmentAppointment_ID: string, new_date, new_time, notes)
    #  If val 
    #     render_template(webpage, {message=success})
    #  else:
    #     render_template(webpage, {message=UNsuccessFUL})
    pass
