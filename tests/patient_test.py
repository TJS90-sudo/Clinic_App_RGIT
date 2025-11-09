# tests/test_patient.py
from models import Patient

def test_patient_creation():
    # Arrange: populate patient with test data
    patient = Patient(
        email="tariq@gmail.com",
        password_hash="dhsbcsbhugehurfhbrhejcs9",
        name="Tariq Solomon",
        contact_number="27123456789",
        address="123 Main Street",
        date_of_birth="1999-05-01",
        gender="Male",
        id_number="1234567890111"
    )

    # Assert: check that attributes are correctly assigned
    assert patient.email == "tariq@gmail.com"
    assert patient.password_hash == "dhsbcsbhugehurfhbrhejcs9"
    assert patient.name == "Tariq Solomon"
    assert patient.contact_number == "27123456789"
    assert patient.address == "123 Main Street"
    assert patient.date_of_birth == "1999-05-01"
    assert patient.gender == "Male"
    assert patient.id_number == "1234567890111"
