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
        try:
            conn = self.getConnection()
            cursor = conn.cursor()
            # Get patient id from email
            cursor.execute("SELECT idnumber FROM patient WHERE email = %s", (email,))
            row = cursor.fetchone()
            if not row:
                cursor.close()
                conn.close()
                return []
            patient_id = row[0]
            # Get appointments for this patient
            cursor.execute("SELECT appointment_id, requesteddate, requestedtime, doctor, clinic, status FROM appointment WHERE patientid = %s", (patient_id,))
            appointments = [
                {
                    'appointment_id': r[0],
                    'date': r[1],
                    'time': r[2],
                    'doctor': r[3],
                    'clinic': r[4],
                    'status': r[5],
                } for r in cursor.fetchall()
            ]
            cursor.close()
            conn.close()
            return appointments
        except Exception as e:
            cursor.close()
            conn.close()
            return []

    def cancel_appointment(self, appointment_id, patient_email):
        try:
            conn = self.getConnection()
            cursor = conn.cursor()
            # Check appointment belongs to patient
            cursor.execute("SELECT a.appointment_id FROM appointment a JOIN patient p ON a.patientid = p.idnumber WHERE a.appointment_id = %s AND p.email = %s", (appointment_id, patient_email))
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return False
            cursor.execute("UPDATE appointment SET status = 'cancelled' WHERE appointment_id = %s", (appointment_id,))
            conn.commit()
            cursor.close()
            conn.close()
            return True
        except Exception as e:
            cursor.close()
            conn.close()
            return False

    def delete_appointment(self, appointment_id, patient_email):
        try:
            conn = self.getConnection()
            cursor = conn.cursor()
            cursor.execute("SELECT a.appointment_id FROM appointment a JOIN patient p ON a.patientid = p.idnumber WHERE a.appointment_id = %s AND p.email = %s", (appointment_id, patient_email))
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return False
            cursor.execute("DELETE FROM appointment WHERE appointment_id = %s", (appointment_id,))
            conn.commit()
            cursor.close()
            conn.close()
            return True
        except Exception as e:
            cursor.close()
            conn.close()
            return False

    def reschedule_appointment(self, appointment_id, patient_email, new_date, new_time):
        try:
            conn = self.getConnection()
            cursor = conn.cursor()
            cursor.execute("SELECT a.appointment_id FROM appointment a JOIN patient p ON a.patientid = p.idnumber WHERE a.appointment_id = %s AND p.email = %s", (appointment_id, patient_email))
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return False
            cursor.execute("UPDATE appointment SET requesteddate = %s, requestedtime = %s, status = 'upcoming' WHERE appointment_id = %s", (new_date, new_time, appointment_id))
            conn.commit()
            cursor.close()
            conn.close()
            return True
        except Exception as e:
            cursor.close()
            conn.close()
            return False
   

    def getConnection(self):
        try:
            conn = psycopg2.connect(DB_URL)
            return conn
        except Exception as e:
            return None
    
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
    
    def Book(self, email, doctor, clinic, requestedDate, requestedTime, appointmentType, reason, specialRequests, smsReminder, emailReminder):
        try:
            conn = self.getConnection()
            cursor = conn.cursor()
            # Get patient id from email
            cursor.execute("SELECT idnumber FROM patient WHERE email = %s", (email,))
            row = cursor.fetchone()
            if not row:
                cursor.close()
                conn.close()
                return False, 'Patient not found'
            patient_id = row[0]
            # Insert appointment
            cursor.execute("""
                INSERT INTO appointment (patientid, doctor, clinic, requesteddate, requestedtime, type, reason, specialrequests, smsreminder, emailreminder, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'upcoming')
            """, (patient_id, doctor, clinic, requestedDate, requestedTime, appointmentType, reason, specialRequests, smsReminder, emailReminder))
            conn.commit()
            cursor.close()
            conn.close()
            return True, 'Appointment booked successfully'
        except Exception as e:
            cursor.close()
            conn.close()
            return False, str(e)



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







