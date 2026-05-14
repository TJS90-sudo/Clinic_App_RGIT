import re

from app.services.authorization.auth_service import AuthService

def isValidEmail(email: str) -> bool:
    regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            
    if re.fullmatch(regex, email):
        return True
    return False


def is_valid_employee_role(role: str) -> bool:
    return role in AuthService.VALID_EMPLOYEE_ROLES

def get_route(role: str) -> str | None:
    return AuthService.ROUTE_MAP.get(role)
        