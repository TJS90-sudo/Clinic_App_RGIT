from datetime import date, time
from models import Appointment, Employee

def test_appointment_creation():
    # Arrange
    employee = Employee(name="Tariq")
    appointment = Appointment(
        patientInt=3,
        requested_date=date(2025, 11, 3),
        requested_time=time(14, 30),
        notes="Follow-up visit",
        status="pending",
        appointment_id=3,
        employee=employee
    )

    assert appointment.patientInt == 3
    assert appointment.requested_date == date(2025, 11, 3)
    assert appointment.requested_time == time(14, 30)
    assert appointment.status == "pending"
    assert appointment.employee.name == "Tariq"
