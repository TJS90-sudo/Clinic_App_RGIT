from flask import Flask, request, jsonify, session, abort,redirect, render_template_string, url_for,render_template, Blueprint
from  app.models.models import Person, Employee, Appointment,Patient, Schedule_System


admin = Blueprint("admin", __name__)

# ---------------- ADMIN ---------------- #

@admin.route('/reports/appointments', methods=['GET'])
def appointment_stats():
    # pseudo
    #if not session.get('authenticated'):
    #    return redirect(url_for('login'))
    #if AuthenticateSession (session["email"], "admin")
        
        # return Schedule_System.generateAppointmentStats()
    pass

@admin.route('/reports/queue', methods=['GET'])
def queue_performance():
    # pseudo:
    #if not session.get('authenticated'):
    #    return redirect(url_for('login'))
    #if AuthenticateSession (session["email"], "admin")    
        # return Schedule_System.generateQueuePerformance()
    pass

@admin.route('/reports/utilization', methods=['GET'])
def utilization_report():
    # pseudo
    #if not session.get('authenticated'):
    #    return redirect(url_for('login'))
    #if AuthenticateSession (session["email"], "admin")
        
        # return  Schedule_System.generateUtilizationReport()
    pass

@admin.route('/staff/deletion', methods=['POST'])
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

@admin.route('/staff/update', methods=['PUT'])
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

@admin.route('/staff', methods=['POST'])
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

@admin.route('/schedule/generate', methods=['POST'])
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
