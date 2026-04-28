# tests/test_employee.py
from app.models.models import Employee

def test_employee_creation():
    # Arrange: populate employee with test data
    employee = Employee(
        email="tariq@gmail.com",
        password="dhsbcsbhugehurfhbrhejcs9",
        name="Tariq Solomon",
        role="doctor",
        employee_id=3
    )

    # Assert: check that attributes are correctly assigned
    assert employee.email == "tariq@gmail.com"
    assert employee.password == "dhsbcsbhugehurfhbrhejcs9"
    assert employee.name == "Tariq Solomon"
    assert employee.role == "doctor"
    assert employee.employee_id == 3
