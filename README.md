Databse Info:

        # --------------------------------------------
        # Create  role_registry table
        # --------------------------------------------
        CREATE TABLE role_registry (
            user_id UUID PRIMARY KEY REFERENCES auth.users(id),
            role VARCHAR(20) NOT NULL CHECK (
                role IN ('Admin', 'staff', 'patient', 'doctor', 'nurse')
            )
        );

        # --------------------------------------------
        # Create Patient table
        # --------------------------------------------
        cursor.execute("""
            CREATE TABLE Patient (
                    user_id UUID PRIMARY KEY,
                    email TEXT NOT NULL,
                    contact_number VARCHAR(15) CHECK (contact_number ~ '^[0-9]{11}$'),
                    address VARCHAR(255),
                    date_of_birth DATE,
                    id_number VARCHAR(13) UNIQUE CHECK (id_number ~ '^[0-9]{13}$'),
                    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female')),
                    name TEXT
                );""")

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

