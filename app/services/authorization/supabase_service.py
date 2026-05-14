class supabase:
    def __init__(self):
        self.supabase = supabase
        


    def login(self, username: str, password: str):
        try:
            response = self.supabase.auth.sign_in_with_password(
                {
                    "email": username,
                    "password":password,
                }
            )
            if response.user and response.session:
                return response
            else:
                return None
        except Exception as e:
            print(f"Exception during login: {e}")
            return None
        
    def validate_session(self, token)-> bool:
        try:
            user_response = self.supabase.auth.get_user(token)
            return user_response.user is not None

        except Exception as e:
            print(f"Error validating session: {e}")
            return False
            
    def get_user(self, token: str):
        return self.supabase.auth.get_user(token)
    

    def send_otp(self, email: str):
        return self.supabase.auth.sign_in_with_otp({
            "email": email,
            "options": {
                "email_redirect_to": "auth/callback"
            },
        })
    

    def getSessionFromCode(self, code: str):
        response = (
                self.supabase.auth.exchange_code_for_session({
                    "auth_code": code
                })
            )
        return response 


    def insert(self, table: str, data: dict):
        response = (
            self.client
            .table(table)
            .insert(data)
            .execute()
        )
        return response
    

    def _sign_up(self, email: str, password: str) ->dict | None:
        try:
            response = self.supabase.auth.sign_up(
                {
                    "email": email,
                    "password": password,
                }
            )
            return response
        except Exception as e:
            print(f"Error during sign up: {e}")
            return None 
    
    def register(self, email: str, password: str): #correct table here
        try:
            response = self.supabase.sign_up(email, password)
            
            if response.user and response.session:
                # Insert user role into the database
                self.insert("user_roles", {"user_id": response.user.id, "role": "patient"})
                return response
            else:
                return None
        except Exception as e:
            print(f"Error during registration: {e}")
            return None
    