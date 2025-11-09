from models import Person

def test_person_creation():
    # Arrange
    person = Person(username="Tariq@gmail.com", password_hash="dhsbcsbhugehurfhbrhejcs9")

    # Assert
    assert person.email == "Tariq"
    assert person.password_hash == "dhsbcsbhugehurfhbrhejcs9"