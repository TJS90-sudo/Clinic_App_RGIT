import hashlib

from flask import jsonify


from app.models.models import Person, Schedule_System

class PasswordService:
    
    @staticmethod
    def hash(password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()

class LoginService:

    def __init__(self, username: str, hashed_password: str):
        self.username = username
        self.hashed_password = hashed_password
        self.Schedule_System_instance = Schedule_System()

    def login(self) -> bool:
        person = Person(self.username, self.hashed_password)
        login_success = self.Schedule_System_instance.Login(person)
        return login_success
    
class AuthService:

        VALID_EMPLOYEE_ROLES = {"admin", "receptionist", "doctor","nurse"}
        VALID_ROLES = {"admin", "receptionist", "doctor", "nurse", "patient"}
        ROUTE_MAP = {
            "nurse": "/nurse/home",
            "doctor": "/doctor/home",
            "admin": "/admin/home",
            "receptionist": "/receptionist/home",
            "patient": "/patient/home",
        }
        def __init__(self):
            self.sys = Schedule_System()

        @staticmethod
        def get_route(role: str) -> bool:
                return AuthService.ROUTE_MAP.get(role)
        
        @staticmethod
        def is_valid_employee_role(role: str) -> bool:
            return role in AuthService.VALID_EMPLOYEE_ROLES
    
        
        def get_role(self, email: str) -> str | None:
            return self.sys.get_role(email)

    