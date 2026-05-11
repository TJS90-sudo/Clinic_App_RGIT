import base64
import io
from flask import Flask, request, jsonify, session, abort,redirect, render_template_string, url_for,render_template, Blueprint
from  app.models.models import Person, Employee, Appointment,Patient, Schedule_System


queue_and_schedule = Blueprint("queue_and_schedule", __name__)


# ---------------- QUEUE & SCHEDULE ---------------- #
@queue_and_schedule.route('/queue', methods=['GET'])
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


@queue_and_schedule.route('/queue/update', methods=['PUT'])
def update_queue():
    # pseudo:
    # call Schedule_System.update_queue()
    pass

