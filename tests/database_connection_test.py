from app.models.models import Schedule_System


def test_database_connection():
    system = Schedule_System()

    # Get a connection
    connection = system.getConnection()

    # Assert that the connection is not None
    assert connection is not None

    # Assert that you can get a cursor
    cursor = connection.cursor()
    assert cursor is not None

    # Clean up
    cursor.close()
    connection.close()