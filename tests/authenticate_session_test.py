from models import Schedule_System

def test_authenticate_session():
    system = Schedule_System()

    # Test valid user with correct role
    assert system.authenticate_session("tariq@gmail.com", "admin") is True
