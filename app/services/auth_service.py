import hashlib,re

from flask import jsonify


from app.models.models import Person, Schedule_System

class PasswordService:
    
    @staticmethod
    def hash(password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()

class LoginService:

    def __init__(self, username: str, password: str):
        self.username = username
        self.password = password
        self.Schedule_System_instance = Schedule_System()

    def login(self) -> dict | None:
        person = Person(self.username, self.password)
        result  = self.Schedule_System_instance.Login(person)        
        return result
    
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
        def get_route(role: str) -> str | None:
                return AuthService.ROUTE_MAP.get(role)
        
        @staticmethod
        def is_valid_employee_role(role: str) -> bool:
            return role in AuthService.VALID_EMPLOYEE_ROLES
    
        
        def get_role(self, access_token: str) -> str | None:
            return self.sys.get_role(access_token)
        
        
        def employee_session_valid(self, token: str) -> bool:
            return self.sys.validate_session(token)
        

        def isValidEmail(email: str) -> bool:
            regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            
            if re.fullmatch(regex, email):
                return True
            return False


        @staticmethod
        def sign_up( email: str, password: str, role: str = "patient") -> bool:
            #for patients only
            if len(password) < 8 or role not in AuthService.VALID_ROLES or not AuthService.isValidEmail(email):
                return False
        
            try:
                sys = Schedule_System()
                val = sys.Register(email, password, role)
                return val
            except Exception as e:
                print(f"Error occurred while signing up: {e}")
                return False

    