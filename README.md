Databse Info:

        # --------------------------------------------
        # Create Auth table
        # --------------------------------------------
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS Auth (
                Email VARCHAR(100) PRIMARY KEY,
                Role VARCHAR(20) NOT NULL CHECK (Role IN ('Admin', 'staff', 'patient', 'doctor', 'nurse')),
                PasswordHash VARCHAR(255) NOT NULL
            );
            """)
        


        # --------------------------------------------
        # Create Patient table
        # --------------------------------------------
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS Patient (
                PatientID SERIAL PRIMARY KEY,
                Email VARCHAR(100) NOT NULL REFERENCES Auth(Email) ON DELETE CASCADE,
                ContactNumber VARCHAR(15) NOT NULL CHECK (ContactNumber ~ '^[0-9]{11}$'),
                Address VARCHAR(255),
                DateOfBirth DATE NOT NULL,
                IDnumber VARCHAR(13) UNIQUE NOT NULL CHECK (IDnumber ~ '^[0-9]{13}$'),
                Gender VARCHAR(10) NOT NULL CHECK (Gender IN ('Male', 'Female'))
                name Text NOT NULL
            );
            """)

        # --------------------------------------------
        # Create Employee table
        # --------------------------------------------
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS Employee (
                EmployeeID SERIAL PRIMARY KEY,
                Email VARCHAR(100) NOT NULL REFERENCES Auth(Email) ON DELETE CASCADE,
                ContactNumber VARCHAR(11) CHECK (ContactNumber ~ '^[0-9]{11}$'),
                Role VARCHAR(100) NOT NULL,
                Name VARCHAR(100) NOT NULL,
                Surname VARCHAR(100) NOT NULL,
                Specialization VARCHAR(50)
            );
            """)

        # --------------------------------------------
        # Create Appointments table
        # --------------------------------------------
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS Appointments (
                AppointmentID SERIAL PRIMARY KEY,
                PatientID INT NOT NULL REFERENCES Patient(PatientID) ON DELETE CASCADE,
                Date DATE NOT NULL,
                Time TIME NOT NULL,
                Status TEXT NOT NULL,
                EmployeeID INT REFERENCES Employee(EmployeeID) ON DELETE SET NULL,
                RoomID INT
            );
            """)

