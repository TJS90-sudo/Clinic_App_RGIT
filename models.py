import hashlib
import base64
import psycopg2
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import psycopg2.extras
from dataclasses import dataclass, field, asdict
from datetime import datetime, date, time, timedelta
import hashlib
import uuid
import os
from dotenv import load_dotenv
from twilio.rest import Client
load_dotenv()
DB_URL= os.getenv("DB_URL")
account_sid = os.getenv("Twilio_Account_Sid")
auth_token = os.getenv("Twilio_auth_token")
Send_Grid_key= os.getenv("Send_Grid_key")




# -------------------- PERSON --------------------#
@dataclass
class Person:
    email: str
    password_hash: str

    def get_email(self):
        return self.email

    def get_password(self):
        # Example of a normal function in a dataclass
        return self.password_hash
    
# -------------------- PATIENT --------------------
@dataclass
class Patient(Person):
    contact_number: int = None
    name: str = ""
    address: str = ""
    date_of_birth: str = ""  # Format: YYYY-MM-DD
    gender: str = ""
    id_number: int = None

    def __init__(self, email, password, name, contact_number, address, date_of_birth, gender, id_number):
        super().__init__(email=email, password_hash=hashlib.sha256(password.encode()).hexdigest())
        self.name = name
        self.contact_number = contact_number
        self.address = address
        self.date_of_birth = date_of_birth
        self.gender = gender
        self.id_number = id_number
    def get_number(self):
        return self.contact_number
    
    def get_address(self):
        return self.address
    
    def get_date_of_birth(self):
        return self.date_of_birth
    
    def get_id_number(self):
        return self.id_number
    
    def get_gender(self):
        return self.gender
    
    def get_name(self):
        return self.name 
       
    def __repr__(self):
        return f"<Patient name='{self.name}' email='{self.email}' id_number={self.id_number}>"


# -------------------- EMPLOYEE --------------------
@dataclass
class Employee(Person):
    employee_id: str = ""
    name: str = ""

    def __init__(self, email, password, name, employee_id, role):
        super().__init__(email=email, password_hash=hashlib.sha256(password.encode()).hexdigest())
        self.name = name
        self.employee_id = employee_id

    def __repr__(self):
        return f"<Employee name='{self.name}' employee_id='{self.employee_id}' role='{self.role}' email='{self.email}'>"


# -------------------- APPOINTMENT --------------------
@dataclass
class Appointment:
    patientInt: int
    requested_date: date
    requested_time: time
    notes: str
    status: str = "pending"
    appointment_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    employee: Employee = None

    def __repr__(self):
        return f"<Appointment id={self.appointment_id} patient='{self.patient.name}' date={self.requested_date} time={self.requested_time} status='{self.status}'>"





class Schedule_System: 
    def get_appointments_by_email(self, email):
        """Fetch appointments for the patient identified by email using the Appointments schema.

        Returns a list of dicts with keys: appointment_id, date, time, doctor, clinic, status.
        Clinic is not part of the schema, so it's returned as an empty string.
        """
        try:
            conn = self.getConnection()
            cursor = conn.cursor()

            # Get patient id from email
            cursor.execute("SELECT PatientID FROM Patient WHERE Email = %s", (email,))
            row = cursor.fetchone()
            if not row:
                return []
            patient_id = row[0]

            # Get appointments for this patient, join doctor name if available
            cursor.execute(
                """
                SELECT a.AppointmentID,
                       a.Date,
                       a.Time,
                       a.Status,
                       e.Name AS DoctorName,
                       a.RoomID
                FROM Appointments a
                LEFT JOIN Employee e ON a.EmployeeID = e.EmployeeID
                WHERE a.PatientID = %s
                ORDER BY a.Date ASC, a.Time ASC
                """,
                (patient_id,)
            )

            appointments = []
            for r in cursor.fetchall():
                appt_id, appt_date, appt_time, status, doctor_name, room_id = r
                # Format date and time to strings
                if isinstance(appt_date, (datetime, date)):
                    date_str = appt_date.strftime('%Y-%m-%d') if isinstance(appt_date, (datetime, date)) else str(appt_date)
                else:
                    date_str = str(appt_date)
                if isinstance(appt_time, (datetime, time)):
                    time_str = appt_time.strftime('%H:%M')
                else:
                    # might already be text
                    time_str = str(appt_time)[:5]

                appointments.append({
                    'appointment_id': appt_id,
                    'date': date_str,
                    'time': time_str,
                    'doctor': doctor_name or '',
                    'clinic': '',
                    'status': status
                })

            return appointments
        except Exception as e:
            print(f"Exception fetching appointments: {e}")
            return []
        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'conn' in locals():
                conn.close()

    def cancel_appointment(self, appointment_id, patient_email):
        try:
            conn = self.getConnection()
            cursor = conn.cursor()
            # Check appointment belongs to patient
            cursor.execute(
                """
                SELECT a.AppointmentID
                FROM Appointments a
                JOIN Patient p ON a.PatientID = p.PatientID
                WHERE a.AppointmentID = %s AND p.Email = %s
                """,
                (appointment_id, patient_email)
            )
            if not cursor.fetchone():
                return False
            cursor.execute("UPDATE Appointments SET Status = 'cancelled' WHERE AppointmentID = %s", (appointment_id,))
            conn.commit()
            return True
        except Exception as e:
            print(f"Exception cancelling appointment: {e}")
            return False
        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'conn' in locals():
                conn.close()

    def delete_appointment(self, appointment_id, patient_email):
        try:
            conn = self.getConnection()
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT a.AppointmentID
                FROM Appointments a
                JOIN Patient p ON a.PatientID = p.PatientID
                WHERE a.AppointmentID = %s AND p.Email = %s
                """,
                (appointment_id, patient_email)
            )
            if not cursor.fetchone():
                return False
            cursor.execute("DELETE FROM Appointments WHERE AppointmentID = %s", (appointment_id,))
            conn.commit()
            return True
        except Exception as e:
            print(f"Exception deleting appointment: {e}")
            return False
        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'conn' in locals():
                conn.close()

    def reschedule_appointment(self, appointment_id, patient_email, new_date, new_time):
        try:
            conn = self.getConnection()
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT a.AppointmentID
                FROM Appointments a
                JOIN Patient p ON a.PatientID = p.PatientID
                WHERE a.AppointmentID = %s AND p.Email = %s
                """,
                (appointment_id, patient_email)
            )
            if not cursor.fetchone():
                return False
            cursor.execute(
                """
                UPDATE Appointments
                SET Date = %s, Time = %s, Status = 'pending'
                WHERE AppointmentID = %s
                """,
                (new_date, new_time, appointment_id)
            )
            conn.commit()
            return True
        except Exception as e:
            print(f"Exception rescheduling appointment: {e}")
            return False
        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'conn' in locals():
                conn.close()
    def get_patient_by_email(self, email):
        try:
            conn = self.getConnection()
            cursor = conn.cursor()
            cursor.execute("SELECT email, contactnumber, address, dateofbirth, idnumber, gender, name FROM patient WHERE email = %s", (email,))
            row = cursor.fetchone()
            cursor.close()
            conn.close()
            if row:
                return {
                    'email': row[0],
                    'contact_number': row[1],
                    'address': row[2],
                    'date_of_birth': row[3],
                    'id_number': row[4],
                    'gender': row[5],
                    'name': row[6],
                }
            else:
                return None
        except Exception as e:
            print(f"Exception fetching patient by email: {e}")
            return None

    def upsert_patient_profile(self, email: str, fields: dict):
        """Create or update a patient's profile by email.

        Allowed fields: name, contact_number, address, date_of_birth, gender, id_number
        Returns True on success, False otherwise.
        """
        allowed = {
            'name': 'name',
            'contact_number': 'contactnumber',
            'address': 'address',
            'date_of_birth': 'dateofbirth',
            'gender': 'gender',
            'id_number': 'idnumber',
        }
        try:
            conn = self.getConnection()
            cursor = conn.cursor()

            # Check if patient record exists
            cursor.execute("SELECT 1 FROM patient WHERE email = %s", (email,))
            exists = cursor.fetchone() is not None

            # Build data mapping using only provided allowed fields
            data = {}
            for k, v in (fields or {}).items():
                if k in allowed:
                    data[allowed[k]] = v

            if not data and not exists:
                # If no data provided and no record, create an empty shell with just email
                cursor.execute("INSERT INTO patient (email) VALUES (%s)", (email,))
                conn.commit()
                return True

            if exists:
                if not data:
                    return True  # nothing to update
                # Dynamic UPDATE
                set_clauses = []
                values = []
                for col, val in data.items():
                    set_clauses.append(f"{col} = %s")
                    values.append(val)
                values.append(email)
                cursor.execute(f"UPDATE patient SET {', '.join(set_clauses)} WHERE email = %s", values)
            else:
                # Prepare INSERT including email plus provided columns
                columns = ['email'] + list(data.keys())
                placeholders = ["%s"] * len(columns)
                values = [email] + list(data.values())
                cursor.execute(
                    f"INSERT INTO patient ({', '.join(columns)}) VALUES ({', '.join(placeholders)})",
                    values
                )

            conn.commit()
            return True
        except Exception as e:
            print(f"Exception upserting patient profile: {e}")
            return False
        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'conn' in locals():
                conn.close()
    def getConnection(self):
        conn = psycopg2.connect(DB_URL)
        return conn
    
    def Login(self, user: Person): #boolean
        username= user.get_email()
        password = user.get_password()
        try:
            conn = self.getConnection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Example SQL query (use parameters to prevent SQL injection)
            query = "SELECT * FROM auth WHERE email = %s AND PasswordHash = %s"
            cursor.execute(query, (username, password))
            row = cursor.fetchone()

            cursor.close()
            conn.close()

            if row:
                return True
            else:
                return False
        except Exception as e:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()
            return False


    def Register(self,email: str, password: str): #boolean
        try:
            conn = self.getConnection()
            password_hash = password
            cursor = conn.cursor()
            cursor.execute("INSERT INTO auth (email,role, passwordhash) VALUES (%s,%s, %s)", (email,"patient", password_hash))
            conn.commit()
            cursor.close()
            conn.close()
            # Password is hashed before storing in the database
            return True
        except Exception as e:
            print(f"Exception during registration: {e}")
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()
            return False

    
    def changeProfileDetail (self,p:Patient): #boolean
        try:
            conn = self.getConnection()
            cursor = conn.cursor()
            cursor.execute("INSERT INTO patient (email	,contactnumber,	address	,dateofbirth,idnumber,gender,name) VALUES (%s,%s, %s,%s,%s, %s,%s)", (p.get_email(), p.get_number(), p.get_address(), p.get_date_of_birth(), p.get_id_number(), p.get_gender(), p.get_name()))
            conn.commit()
            cursor.close()
            conn.close()
            # Password is hashed before storing in the database
            return True
        except Exception as e:
            print(f"Exception during registration: {e}")
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()
            return False
    


    def changePassword( self,password: str, email:str,): 
        #try
            #cursors= get connection to DB
            #cusror.execute(replace password in auth where email is patientsemail , (email, password) )
            #return true
        #catch Exception e 
            #return false
        pass

    def fetch_patient_email(self,id):
        #try
            #cursors= get connection to DB
            #cusror.execute(fetch email from Patients where patient_id = id )
            #return email
        #catch Exception e 
            #return None
            pass
    def Book(self, email, employeeId, date, time, roomId=None):
        """Book a new appointment.
        
        Args:
            email (str): Patient's email
            employeeId (int): Doctor's employee ID
            date (date): Appointment date
            time (time): Appointment time
            roomId (int, optional): Preferred room ID
            
        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            conn = self.getConnection()
            cursor = conn.cursor()

            # Get patient id from email
            cursor.execute("SELECT PatientID FROM Patient WHERE Email = %s", (email,))
            row = cursor.fetchone()
            if not row:
                return False, 'Patient not found'
            patient_id = row[0]

            # Verify employee exists and is a doctor
            cursor.execute("SELECT EmployeeID FROM Employee WHERE EmployeeID = %s AND Role = 'doctor'", (employeeId,))
            if not cursor.fetchone():
                return False, 'Invalid doctor ID'

            # Check if timeslot is available
            cursor.execute("""
                SELECT 1 FROM Appointments 
                WHERE Date = %s AND Time = %s 
                AND (EmployeeID = %s OR RoomID = %s)
                AND Status != 'cancelled'
            """, (date, time, employeeId, roomId))
            
            if cursor.fetchone():
                return False, 'Time slot not available'

            # Insert appointment according to schema
            cursor.execute("""
                INSERT INTO Appointments (
                    PatientID, 
                    Date, 
                    Time, 
                    Status, 
                    EmployeeID,
                    RoomID
                ) VALUES (%s, %s, %s, 'pending', %s, %s)
            """, (patient_id, date, time, employeeId, roomId))

            conn.commit()
            return True, 'Appointment booked successfully'

        except Exception as e:
            print(f"Exception booking appointment: {e}")
            return False, str(e)
        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'conn' in locals():
                conn.close()

    def get_doctors(self):
        """Get list of available doctors with display-ready names.

        Attempts to intelligently determine first/last name columns. Falls back to a single
        Name column if that's all that exists. If the stored name value equals the role
        (e.g. 'doctor'), it will try alternative columns before returning.

        Returns:
            list[dict]: [{ 'employeeId': int, 'name': 'Dr Govender' }]
        """
        try:
            conn = self.getConnection()
            cursor = conn.cursor()

            # Discover available columns in employee table
            cursor.execute("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'employee'
            """)
            cols = {r[0].lower() for r in cursor.fetchall()}

            # Candidate columns
            first_candidates = ['firstname', 'first_name', 'fname']
            last_candidates  = ['lastname', 'last_name', 'lname', 'surname']

            first_col = next((c for c in first_candidates if c in cols), None)
            last_col  = next((c for c in last_candidates if c in cols), None)

            name_col = 'name' if 'name' in cols else None
            # Determine ID column
            id_candidates = ['employeeid', 'employee_id', 'emp_id', 'id']
            id_col = next((c for c in id_candidates if c in cols), 'employeeid')

            # Optional role filter if column exists
            role_col = 'role' if 'role' in cols else ('occupation' if 'occupation' in cols else None)
            where_clause = f" WHERE lower({role_col}) = 'doctor'" if role_col else ''

            # Detect specialization/department-like column
            specialization_col = None
            for cand in ['specialization', 'speciality', 'specialty', 'department', 'dept']:
                if cand in cols:
                    specialization_col = cand
                    break

            def make_display(role_val, first, last, raw_name, email, emp_id):
                prefix_map = {
                    'doctor': 'Dr',
                    'nurse': 'Nurse',
                    'staff': '',
                    'admin': ''
                }
                role_l = (role_val or '').strip().lower()
                prefix = prefix_map.get(role_l, 'Dr' if role_l == '' else '')

                # Prefer surname/last name for display like: Dr Govender
                last_clean = (last or '').strip() if last is not None else ''
                first_clean = (first or '').strip() if first is not None else ''
                raw_clean = (raw_name or '').strip()

                # If we don't have last name but have raw name, try to take last token as surname
                if not last_clean and raw_clean:
                    parts = [p for p in raw_clean.split() if p]
                    if len(parts) > 1:
                        last_clean = parts[-1]
                    else:
                        last_clean = raw_clean

                # Build display using prefix + surname
                if prefix:
                    if last_clean:
                        return f"{prefix} {last_clean}"
                    if raw_clean:
                        return f"{prefix} {raw_clean}"
                # Fallbacks if no prefix or surname
                if raw_clean:
                    return raw_clean
                if first_clean:
                    return first_clean
                if email:
                    return email
                return f"Doctor #{emp_id}"

            doctors = []
            if first_col and last_col:
                # Build query using detected first/last columns
                select_role = f", {role_col}" if role_col else ''
                select_spec = f", {specialization_col}" if specialization_col else ''
                query = f"SELECT {id_col}, {first_col}, {last_col}{select_role}{select_spec} FROM employee{where_clause} ORDER BY {first_col}, {last_col}"  # no user input
                cursor.execute(query)
                for row in cursor.fetchall():
                    # Unpack depending on selected columns
                    idx = 0
                    emp_id = row[idx]; idx += 1
                    first = row[idx]; idx += 1
                    last = row[idx]; idx += 1
                    role_val = row[idx] if role_col else 'doctor'; idx += (1 if role_col else 0)
                    spec_val = row[idx] if specialization_col else None
                    display = make_display(role_val, first, last, None, None, emp_id)
                    doctors.append({'employeeId': emp_id, 'name': display, 'specialization': (spec_val or '').strip() if spec_val else None})
            elif name_col:
                # Single name column available
                select_role = f", {role_col}" if role_col else ''
                select_spec = f", {specialization_col}" if specialization_col else ''
                cursor.execute(f"SELECT {id_col}, {name_col}{select_role}{select_spec} FROM employee{where_clause} ORDER BY {name_col}")
                for row in cursor.fetchall():
                    idx = 0
                    emp_id = row[idx]; idx += 1
                    raw_name = row[idx]; idx += 1
                    role_val = row[idx] if role_col else 'doctor'; idx += (1 if role_col else 0)
                    spec_val = row[idx] if specialization_col else None
                    display = make_display(role_val, None, None, raw_name, None, emp_id)
                    doctors.append({'employeeId': emp_id, 'name': display, 'specialization': (spec_val or '').strip() if spec_val else None})
            else:
                # Fallback: attempt to use email column, otherwise role
                email_col = 'email' if 'email' in cols else None
                if email_col:
                    select_role = f", {role_col}" if role_col else ''
                    select_spec = f", {specialization_col}" if specialization_col else ''
                    cursor.execute(f"SELECT {id_col}, {email_col}{select_role}{select_spec} FROM employee{where_clause} ORDER BY {email_col}")
                    for row in cursor.fetchall():
                        idx = 0
                        emp_id = row[idx]; idx += 1
                        email = row[idx]; idx += 1
                        role_val = row[idx] if role_col else 'doctor'; idx += (1 if role_col else 0)
                        spec_val = row[idx] if specialization_col else None
                        display = make_display(role_val, None, None, None, email, emp_id)
                        doctors.append({'employeeId': emp_id, 'name': display, 'specialization': (spec_val or '').strip() if spec_val else None})
                else:
                    # Last resort: just list IDs
                    cursor.execute(f"SELECT {id_col} FROM employee{where_clause} ORDER BY {id_col}")
                    for row in cursor.fetchall():
                        doctors.append({'employeeId': row[0], 'name': f"Doctor #{row[0]}", 'specialization': None})

            return doctors
        except Exception as e:
            print(f"Error fetching doctors: {e}")
            return []
        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'conn' in locals():
                conn.close()

    def get_available_times(self, doctor_id, date):
        """Get available time slots for a given doctor and date.
        
        Args:
            doctor_id (int): Doctor's employee ID
            date (date): Date to check
            
        Returns:
            list: Available time slots in HH:MM format
        """
        try:
            conn = self.getConnection()
            cursor = conn.cursor()
            
            # Get all booked times for the doctor on the given date
            cursor.execute("""
                SELECT Time::text 
                FROM Appointments 
                WHERE EmployeeID = %s 
                AND Date = %s
                AND Status != 'cancelled'
            """, (doctor_id, date))
            
            booked_times = {row[0] for row in cursor.fetchall()}
            
            # Generate all possible time slots (8 AM to 5 PM, 30-min intervals)
            all_slots = []
            start = datetime.strptime('08:00', '%H:%M').time()
            end = datetime.strptime('17:00', '%H:%M').time()
            slot = start
            
            while slot <= end:
                slot_str = slot.strftime('%H:%M')
                if slot_str not in booked_times:
                    all_slots.append(slot_str)
                slot = (datetime.combine(date, slot) + timedelta(minutes=30)).time()
            
            return all_slots
        except Exception as e:
            print(f"Error fetching available times: {e}")
            return []
        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'conn' in locals():
                conn.close()
    def Fetch_bookings (self,date: str): #Appointment [] 
        #execute sql query to fetch appointments from appointment table ysing date
        #return an empty appointment list if no books exist
        pass
    def Fetch_bookings(self,PatientId :int): #Appointment []
        #execute sql query to fetch appointments from appointment table using patientId
        #return an empty appointment list if no books exist
        pass

    def getAssignedPatients(self,emp_id):
        """     
        try:
            cursor= get connection to DB
            cursor.execute("select * from appointments where emp_id = (emp id)")
            info = fetchall
            return info
        catch exception e:
            return []
        """
        pass
        
    def AuthenticateSession(self, email: str, role: str) -> bool:
        try:
            connection = self.getConnection()
            cursor = connection.cursor()

            # Fetch role for the given email
            cursor.execute("SELECT role FROM employee WHERE email = %s", (email,))
            info = cursor.fetchone()

            if info and info[0] == role:
                cursor.close()
                connection.close()
                return True
            else:
                cursor.close()
                connection.close()
                return False

        except Exception as e:
            cursor.close()
            connection.close()
            return False
    
    
    def getEmpIdByEmail(self, email: str):
        try:
            # Get a database connection
            schedule_system_instance = Schedule_System()
            conn = schedule_system_instance.getConnection()
            cursor = conn.cursor()

            # Execute SQL query safely using parameterized query
            cursor.execute("SELECT EmployeeID FROM employee WHERE Email = %s", (email,))
            result = cursor.fetchone()

            # Extract the employee ID if found
            employee_id = result[0] if result else None

            return employee_id

        except Exception as e:
            print(f"Error getting employee ID by email: {e}")
            return None

        finally:
            # Ensure resources are properly closed
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    

    def Fetch_bookings_today(self): #Appointment []
        Schedule_System_instance = Schedule_System()
        try:
            conn=Schedule_System_instance.getConnection()
            appointments=None
            today= date.today()
            cursor= conn.cursor()
            cursor.execute("SELECT * FROM appointment WHERE date = %s", (today,))
            rows = cursor.fetchall()
            for row in rows:
                appointment= Appointment(
                    patientInt=row[1],
                    requested_date=row[2],
                    requested_time=row[3],
                    notes=None,
                    status=row[4],
                    appointment_id=row[0],
                    employee=row[5]
                    
                )
                appointments.append(appointment)
            return appointments
        except Exception as e:
            cursor.close()
            conn.close()
            return []

    def Fetch_bookings_week(self): #Appointment []
        try:
            Schedule_System_instance = Schedule_System()
            conn=Schedule_System_instance.getConnection()
            appointments=None
            start_date = date.today()
            end_date = start_date + timedelta(days=7)

            conn = Schedule_System_instance.getConnection()
            cursor = conn.cursor()

            cursor.execute("""
                SELECT * FROM appointment 
                WHERE date BETWEEN %s AND %s
            """, (start_date, end_date))

            rows = cursor.fetchall()
            for row in rows:
                appointment= Appointment(
                    patientInt=row[1],
                    requested_date=row[2],
                    requested_time=row[3],
                    notes=None,
                    status=row[4],
                    appointment_id=row[0],
                    employee=row[5]
                    
                )
                appointments.append(appointment)
            return appointments
        except Exception as e:
            cursor.close()
            conn.close()
            return []

    def deleteStaff(self,emp :Employee): #boolean
        #exexcutes deletion on  auth table and employee table for given emp
        pass
    def updateStaffDetail(self,emp :Employee): #boolean
        #executes sql query to update employee on employee email
        pass
    def Schedule_System (self): #void
        #constructor
        pass
    def _validateDate(self,date:str): #bolean
        pass
        #checks date obejct using regex matches to ensure it matches the patten required for database storage
    def createStaff(self,emp :Employee): #boolean
        #uses employee email and genereates password
        #takes formm input and inserts into employee table       
        pass
    def Get_Queue_Position(self,PatientId: int, date: str): #int
        #call update_queue()
        #list =Fetch_bookings_today()
        #list.sort()
        #for apointment in list remove all completed.
        # non_completed_and_no_showup=0
        #iterate through list to find  appointment id
        #iterate non_completed_no_showup where we dont find the id
        # return appoitnemnt_found -  non_completed_no_showup   
        pass
    
    def reschedule(self,Appointment_ID: str, new_date: str, new_time: str, notes: str): #Boolean 
        #executes sql to fecth patient id using apointment_ID
        #uses appointment id to fetch information to make user:Patient object
        #calls Book (user: Patient, requestedDate: str,  requestedTime: str,   notes: str)
        #return true or false to book on the new schedule
        pass

    def CancelSchedule (self,Appointment_ID: str): #boolean
        #cursor = get_connection_to_db()
        #bool val= calls Change_patient_Status (appointmentID, "cancelled")
        # if val: 
            # bool val2= call removeEmp(appointmentID)
            #if val2:
                #return True 
            #else:
                #return False
        #else: return False
        pass 
    def removeEmp(self,appointmentID):
        #try:
            #cursor = get_connection_to_db()
            #cursor.execuite(" UPDATE emp_id from Appointment Where appointment_id = appointmentID")
            #close connection
            #return True 
            
        #catch exception e:
            #cose connection
            #return False
        pass 
    def notifyGenericPassword(selfemail: str, gen_password:str):       
        pass
        """Send email notification via Twilio SendGrid"""
        """    try:
                message = Mail(
                    from_email="clinic@example.com",
                    to_emails=email,
                    subject=subject,
                    html_content/plain_text_content=content containing generic password
                )

                sg = SendGridAPIClient("YOUR_SENDGRID_API_KEY")
                response = sg.send(message)

                print(f"Email sent to {email}, status code: {response.status_code}")
                return True
            except Exception as e:
                print(f"Failed to send email: {e}")
                return False"""        
    def Fetch_employee(self,emp_id) :#returns Employee object 
        try:
            cursor = self.getConnection()
            # Execute SQL query to fetch employee details by ID
            cursor.execute("SELECT * FROM EMPLOYEE WHERE EMP_ID = emp_id")
            # Fetch the result
            info = cursor.fetchone()
            # Use the retrieved data to create an Employee object
            employee = Employee(info)
            # Return the Employee object
            return employee
        except Exception as e:
            cursor.close()
            return None
        
    def Change_patient_Status (self, appointmentID: str, status: str) ->bool:
        try:
            Schedule_System_instance=Schedule_System()
            conn= Schedule_System_instance.getConnection()
            cursor= conn.cursor()

            if status == "cancelled":
                cursor.execute("""
                    UPDATE appointment 
                    SET status = %s, patient_id = NULL, employment_id = NULL
                    WHERE appointment_id = %s
                """, (status, appointmentID))
                cursor.close()
                conn.close()
                return True 
            
            elif status == "completed":
                cursor.execute("""
                    UPDATE appointment 
                    SET status = %s
                    WHERE appointment_id = %s
                """, (status, appointmentID))
                cursor.close()
                conn.close()
                return True 

        except Exception as e:
            cursor.close()
            conn.close()
            return False 


    def ChangeEmpForSchedule(self,AppointmentId: int)->bool: 
        try:
            Schedule_System_instance=Schedule_System()
            conn= Schedule_System_instance.getConnection()
            cursor= conn.cursor()

            cursor.execute("""
                UPDATE appointment 
                SET emp_id = NULL
                WHERE appointment_id = %s
            """, (AppointmentId,))
            cursor.close()
            conn.close()
            return True

        except Exception as e:
            cursor.close()
            conn.close()
            return False 
        cursor = self.getConnection()
        # Execute SQL query to fetch employee details by ID
        cursor.execute("SELECT * FROM EMPLOYEE WHERE EMP_ID = emp_id")
        # Fetch the result
        info = cursor.fetchone()
        # Use the retrieved data to create an Employee object
        employee = Employee(info)
        # Return the Employee object
        return employee
    def Change_patient_Status (self,appointmentID: str, status: str): #boolean
        #if status == "cancelled":
            #try
                #cursor= get cpnnection to DB
                #cursor.execute("""Update appointment status in the appointment table using appointmentID to cancelled""")
                #cursor.execute("""Update appointment patient_id in the appointment table using appointmentID to null""")
                #cursor.execute("""Update appointment employment_id in the appointment table using appointmentID to null""")
                #close connections
                #Return True 

            #catch exception e:
                #Return False "
            #finally:
                #close connections
                #if status == "cancelled":
        #elif status == "completed":
            #try
                #cursor= get cpnnection to DB
                #cursor.execute("""Update appointment status in the appointment table using appointmentID to completed""")
                #close connections
                #Return True 

            #catch exception e:
                #Return False "
            #finally:
                #close connections
        pass
    def ChangeEmpForSchedule(self,AppointmentId: int): #boolean
        """Update appointment doctor/nurse assigned in the database using appointmentID with sql to null
            Return True if update succeeds, False otherwise"""
        pass
    def Notify_Patients (self, p:Patient): #boolean
        # calls EmailNotification (p.email: str)
        # calls SMSNotification (p.number: str)
        # returns true if any calls return true
        pass
    def ConfirmBooking(self, AppointmentId: int, EmployeeId:int):#boolean 
        """
        1. calls addEmptToAppointment(id) first if assigning employee here.
        2. Calls Notify_Patients(patient) to send SMS/email notifications.
        3. Updates appointment status to 'Scheduled' in the database.
        4. Returns True if all steps succeed, False otherwise.
        """
        pass
    
    def Notify_Patients (self, p:Patient)->bool: 
        try:
            email_sent = self._EmailNotification(p.get_email())
            sms_sent = self._SMSNotification(str(p.get_number()))
            return email_sent or sms_sent
        except Exception as e:
            return False

        except Exception as e:
            print(f"Exception fetching patient by email: {e}")
            return None        
    def ConfirmBooking(self, AppointmentId: int, EmployeeId:int)->bool:
        try:
            boolVal = self.addEmptToAppointment(EmployeeId, AppointmentId)
            if not boolVal:
                return False
            patient_email = self.fetch_patient_email(AppointmentId)
            patient = self.get_patient_by_email(patient_email)
            Schedule_System_instance=Schedule_System()
            Schedule_System_instance.Change_patient_Status(AppointmentId, "Scheduled")
            notify_success = self.Notify_Patients(patient)
            if not notify_success:
                return False
        except Exception as e:
            return False    
        
    def get_patient_by_email(self, email)->Patient: #check this
        try:
            conn = self.getConnection()
            cursor = conn.cursor()
            cursor.execute("SELECT email, contactnumber, address, dateofbirth, idnumber, gender, name FROM patient WHERE email = %s", (email,))
            row = cursor.fetchone()
            cursor.close()
            conn.close()
            if row:
                patient= Patient(
                    email=row[0],
                    password="",  # Password not fetched for security
                    name=row[6],
                    contact_number=row[1],
                    address=row[2],
                    date_of_birth=row[3],
                    gender=row[5],
                    id_number=row[4]
                )
                return patient
            else:
                return None    
        except Exception as e:
            cursor.close()
            conn.close()
            return None
        
    def addEmptToAppointment (self, EmpID:int, AppointmentID:int)->bool:
        try:
            Schedule_System_instance=Schedule_System()
            conn= Schedule_System_instance.getConnection()
            cursor= conn.cursor()

            cursor.execute("""
                UPDATE appointment 
                SET emp_id = %s
                WHERE appointment_id = %s
            """, (EmpID, AppointmentID))
            cursor.close()
            conn.close()
            return True
        except Exception as e:
            cursor.close()
            conn.close()
            return False

    def generateAppointmentStats(self): # dict
        """stats = db.fetch("SELECT status, COUNT(*) FROM appointments GROUP BY status")

            
        labels = [row[0] for row in results]  # e.g. ['Scheduled', 'Completed', 'Cancelled']
        data = [row[1] for row in results]    # e.g. [12, 25, 3]
        
        return {
            "labels": labels,
            "data": data
        }"""
        pass
    
    def generateUtilizationReport(self): # list of dicts
        """Fetch the number of appointments per employee along with their role
        results = QUERY(
            "SELECT employee_id, role, COUNT(*) AS appointments_count
            FROM appointments
            JOIN employee ON appointments.employee_id = employee.employee_id
            GROUP BY employee_id, role
            ORDER BY role"    


            labels = [f"{row[0]} ({row[1]})" for row in results]  # "John Doe (Doctor)"
            data = [row[2] for row in results]                    # [15, 9, 7]
            
            return {
                "labels": labels,
                "data": data
            }"""
        
    def generateQueuePerformance(self): # dict
        #uses a patient’s place in the queue, used to calculate metrics like average wait time in queue
        """Fetch all completed appointments from the database
        queue_data = SELECT queue_position FROM appointments WHERE status='completed'
        
        // Compute performance metrics
        average_position = average(queue_data.queue_position)
        total_completed = count(queue_data)
        
        // Return metrics for dashboard
        Return {
            "total_completed": total_completed,
            "average_queue_position": average_position
        }"""
        pass
    
    def Emergency (self)->bool:
        try:
            conn=self.getConnection()
            cursor= conn.cursor()
            today= date.today()
            cursor.execute("SELECT * FROM appointment WHERE date = %s AND status = 'available'", (today,))
            row = cursor.fetchone()
            if not row:
                cursor.close()
                conn.close()
                return False
            appointment_id = row[0]
            cursor.execute("UPDATE appointment SET status = 'emergency' WHERE appointment_id = %s", (appointment_id,))
            conn.commit()
            cursor.close()
            conn.close()
            return True
        except Exception as e:
            cursor.close()
            conn.close()
            return False
    
    """ def _EmailNotification(self, email: str, message: str = "Your appointment is confirmed")->bool:
            try:
                sg = SendGridAPIClient(Send_Grid_key)
                response = sg.send(message)

                print(f"Email sent to {email}, status code: {response.status_code}")
                return True
            except Exception as e:
                print(f"Failed to send email: {e}")
                return False

    """
    def _SMSNotification(self, number: str, message: str = "Your appointment is confirmed"): #Boolean  
        try:
            client = Client(account_sid, auth_token)

            client.messages.create(
                body=message,
                from_="+12175481588",
                to=number
            )

            return True 
        except Exception as e:
            return False


    def generateTimeSlots(self,bookingsPerDay:int, intnum_rooms = 3): #boolean
        pass
        """ Try get cnnection to databse with cursor
                for i in range(30):
                    Date = date.today() + timedelta(days=i)
                    for _ in range(number bookings per day):
                        time= increment time to space out according to bookings per day
                        Status= "Canceled"
                        RoomId = (slot_index % num_rooms) + 1
                        try 
                            Database.execute("Insert into Appoinment Date,Time,Status,RoomID")
                            return True 
                        except exception 
                        return False"""


    def update_queue(self):#boolean  
        """ 
        Cleans up cancelled appointments with PatientId assigned before calculating positions
        if date is None:
            date = date.today()

        try:
            cursor = get connection to DB 

            #Cleanup cancelled appointments with patient IDs
            cursor.execute('''
                DELETE FROM Appointment
                WHERE Status='Cancelled'
                AND PatientId IS NOT NULL
                AND Date <= %s
            ''', (date,))
    """
        
    def rescheduleAppointment(self, appointment_id, new_date, new_time)->bool:
        try:
            conn= self.getConnection()
            cursor= conn.cursor
            cursor.execute("SELECT * FROM Appointment WHERE AppointmentId=%s", (appointment_id,))
            appt = cursor.fetchone()
            if not appt:
                return False

            # Update appointment
            cursor.execute('''
                    UPDATE Appointment
                    SET Date=%s, Time=%s, Status='Scheduled'
                    WHERE AppointmentId=%s
                ''', (new_date, new_time, appointment_id))

            conn.commit()
            cursor.close()
            conn.close()
            return True

        except Exception as e:
            cursor.close()
            conn.close()
            return False



"""   
def creatEmpTest():
        email="nurse@my.richfield.ac.za"

        password_hash=hashlib.sha256("nursepass".encode()).hexdigest()
        role="nurse"
        Schedule_System_instance= Schedule_System()
        conn= Schedule_System_instance.getConnection()
        cursor= conn.cursor()

        cursor.execute("INSERT INTO auth (Email,Role,PasswordHash) VALUES (%s,%s,%s)", (email,role,password_hash))
        conn.commit()

        name="nurse"
        spezialization="coonsultation"
        surname="Member"
        contactnumber="01234567330"
        cursor.execute("INSERT INTO employee (email, contactnumber, role,name, surname,specialization) VALUES (%s, %s, %s, %s, %s, %s)", (email,contactnumber,role,name,surname, spezialization))
        conn.commit()
        conn.close()
        cursor.close()

if __name__ == "__main__":
    creatEmpTest()
"""







