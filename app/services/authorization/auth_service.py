import hashlib
from urllib import response
from app.services.authorization import redis_service
from app.services.authorization.supabase_service import supabase
from extensions import supabase
from flask import jsonify


from app.models.models import Schedule_System

class PasswordService:
    
    @staticmethod
    def hash(password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()

       

class AuthService:

        def __init__(self):
            self.sys = Schedule_System()
  
        
        def get_role(self, access_token: str) -> str | None:

            supabase_service = supabase()
            user_info = supabase_service.get_user(access_token)

            if not user_info or not user_info.user:
                return None
            user_id = user_info.user.id
            filters = {"user_id": user_id}
            response = supabase_service.select("user_roles", "role", filters=filters)
            
            return response[0]['role'] if response else None
        
        
        def select(self, table: str, query_config: str, filters: dict = None):
            """
            filters format:
            [
                {
                    "op": "eq",
                    "column": "user_id",
                    "value": 5
                }
            ]
            """
            
            
            query = supabase.table(table).select(query_config)

            if filters:
                for f in filters:
                    op = f.get("op")
                    column = f.get("column")
                    value = f.get("value")

                    if op == "eq":
                        query = query.eq(column, value)
                    elif op == "gt":
                        query = query.gt(column, value)
                    elif op == "lt":
                        query = query.lt(column, value)
                    elif op == "like":
                        query = query.like(column, value)
                    else:
                        raise ValueError(f"Unsupported operator: {op}")

            response = query.execute()
            return response.data

        def session_valid(self, token: str) -> bool:
            return self.sys.validate_session(token)
        
        
        # remove role from this function, it should be determined by the system becuase this is a external customer based function
        def sign_up(self, email: str, password: str, role: str = "patient") -> bool:
            #for patients only
            if len(password) < 8 or role not in AuthService.VALID_ROLES or not AuthService.isValidEmail(email):
                return False
        
            try:
                val = self.sys.Register(email, password, role)
                return val
            except Exception as e:
                print(f"Error occurred while signing up: {e}")
                return False

        @staticmethod
        def is_2fa_complete(token: str) -> bool:
            user_info = supabase().get_user(token)
            if not user_info or not user_info.user:
                return False
            
            user_id = user_info.user.id
            status = redis_service().get_user(user_id)
            return status == "verified"
