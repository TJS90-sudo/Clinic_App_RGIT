// doctors-dashboard.js
// Basic doctor dashboard logic

document.addEventListener('DOMContentLoaded', function() {
	// Welcome message
	const userName = document.getElementById('userName');
	if (userName) {
		userName.textContent = 'Dr. Smith';
	}

	// Example: Populate appointments list
	const appointmentsSection = document.getElementById('appointmentsList');
	if (appointmentsSection) {
		appointmentsSection.innerHTML = `
			<h2>Today's Appointments</h2>
			<ul>
				<li>09:00 - John Doe</li>
				<li>10:30 - Jane Smith</li>
				<li>12:00 - Bob Johnson</li>
			</ul>
		`;
	}

	// Example: Populate patient list
	const patientsSection = document.getElementById('patientsList');
	if (patientsSection) {
		patientsSection.innerHTML = `
			<h2>My Patients</h2>
			<ul>
				<li>John Doe</li>
				<li>Jane Smith</li>
				<li>Bob Johnson</li>
			</ul>
		`;
	}
});
