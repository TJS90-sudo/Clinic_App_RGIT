// Dashboard JavaScript Module

// Dashboard state
const Dashboard = {
    currentSection: 'dashboard',
    currentStep: 1,
    selectedDate: null,
    selectedTime: null,
    bookingData: {},
    appointments: [],
    
    // Initialize dashboard
    init() {
        this.checkAuthentication();
        this.loadUserData();
        this.loadDashboardData();
        this.setupEventListeners();
        this.initializeCalendar();
        this.startPeriodicUpdates();
    },
    
    // Check if user is authenticated
    checkAuthentication() {
        if (!Auth.isAuthenticated()) {
            window.location.href = '../index.html';
            return;
        }
        
        // Update user info in header
        const user = Auth.getCurrentUser();
        if (user) {
            const userName = document.getElementById('userName');
            if (userName) {
                userName.textContent = user.firstName || user.email;
            }
        }
    },
    
    // Load user-specific dashboard data
    async loadUserData() {
        try {
            // This would typically make API calls to get user data
            await this.loadAppointments();
            await this.loadNotifications();
            await this.loadQueueStatus();
            this.updateStats();
        } catch (error) {
            console.error('Error loading user data:', error);
            this.showNotification('Error loading dashboard data', 'error');
        }
    },
    
    // Load dashboard initial data
    loadDashboardData() {
        this.loadClinics();
        this.updateUpcomingAppointments();
    },
    
    // Setup event listeners
    setupEventListeners() {
        // User dropdown
        const userDropdownBtn = document.querySelector('.user-dropdown-btn');
        const userDropdown = document.querySelector('.user-dropdown');
        
        if (userDropdownBtn && userDropdown) {
            userDropdownBtn.addEventListener('click', (e) => {
                e.preventDefault();
                userDropdown.classList.toggle('active');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!userDropdown.contains(e.target)) {
                    userDropdown.classList.remove('active');
                }
            });
        }
        
        // Booking form
        const bookingForm = document.getElementById('bookingForm');
        if (bookingForm) {
            bookingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitBooking();
            });
        }
        
        // Language change
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                changeLanguage(e.target.value);
            });
        }
    },
    
    // Show specific section
    showSection(sectionId) {
        // Scroll booking section to top for immediate visibility
        if (sectionId === 'book-appointment') {
            const bookingSection = document.getElementById('book-appointment-section');
            if (bookingSection) {
                setTimeout(() => window.scrollTo({ top: bookingSection.offsetTop - 40, behavior: 'smooth' }), 100);
            }
        }
        console.log('[Dashboard] showSection called with:', sectionId);
        // Debug: check if section exists
        const dbgTargetSection = document.getElementById(`${sectionId}-section`);
        if (dbgTargetSection) {
            console.log(`[Dashboard] Found section: #${sectionId}-section`);
        } else {
            console.warn(`[Dashboard] Section not found: #${sectionId}-section`);
        }
        // Update sidebar active state
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[onclick="showSection('${sectionId}')"]`).parentNode;
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        // Show content section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
        }
        
        // Load section-specific data
        this.loadSectionData(sectionId);
    },
    
    // Load data for specific section
    async loadSectionData(sectionId) {
        switch (sectionId) {
            case 'appointments':
                await this.loadAppointments();
                this.renderAppointmentsTable();
                break;
            case 'queue-status':
                await this.loadQueueStatus();
                this.renderQueueStatus();
                break;
            case 'book-appointment':
                this.resetBookingForm();
                break;
        }
    },
    
    // Load appointments from API
    async loadAppointments() {
        try {
            // Simulate API call
            const response = await this.simulateApiCall('/appointments', {
                method: 'GET'
            });
            
            this.appointments = response.appointments || this.getMockAppointments();
        } catch (error) {
            console.error('Error loading appointments:', error);
            this.appointments = this.getMockAppointments();
        }
    },
    
    // Mock appointments data
    getMockAppointments() {
        return [
            {
                id: 1,
                date: '2024-11-15',
                time: '09:00',
                doctor: 'Dr. Smith',
                clinic: 'City Health Clinic',
                status: 'upcoming',
                type: 'consultation'
            },
            {
                id: 2,
                date: '2024-11-20',
                time: '14:30',
                doctor: 'Dr. Johnson',
                clinic: 'Metro Medical Center',
                status: 'upcoming',
                type: 'follow-up'
            },
            {
                id: 3,
                date: '2024-10-25',
                time: '11:00',
                doctor: 'Dr. Williams',
                clinic: 'City Health Clinic',
                status: 'completed',
                type: 'consultation'
            }
        ];
    },
    
    // Render appointments table
    renderAppointmentsTable() {
        const tbody = document.getElementById('appointmentsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.appointments.forEach(appointment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDate(appointment.date)}</td>
                <td>${appointment.time}</td>
                <td>${appointment.doctor}</td>
                <td>${appointment.clinic}</td>
                <td><span class="status-badge status-${appointment.status}">${appointment.status}</span></td>
                <td>
                    <div class="appointment-actions">
                        ${appointment.status === 'upcoming' ? `
                            <button class="btn btn-outline btn-sm" onclick="Dashboard.rescheduleAppointment(${appointment.id})">
                                <i class="fas fa-edit"></i> Reschedule
                            </button>
                            <button class="btn btn-outline btn-sm" onclick="Dashboard.cancelAppointment(${appointment.id})">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        ` : ''}
                        <button class="btn btn-outline btn-sm" onclick="Dashboard.viewAppointmentDetails(${appointment.id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    },
    
    // Update upcoming appointments section
    updateUpcomingAppointments() {
        const container = document.getElementById('upcomingAppointmentsList');
        if (!container) return;
        
        const upcomingAppointments = this.appointments.filter(apt => apt.status === 'upcoming').slice(0, 3);
        
        if (upcomingAppointments.length === 0) {
            container.innerHTML = `
                <div class="appointment-item">
                    <div class="appointment-info">
                        <p>No upcoming appointments</p>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        upcomingAppointments.forEach(appointment => {
            const item = document.createElement('div');
            item.className = 'appointment-item';
            item.innerHTML = `
                <div class="appointment-info">
                    <h4>${appointment.doctor} - ${appointment.clinic}</h4>
                    <p>${this.formatDate(appointment.date)} at ${appointment.time}</p>
                </div>
                <div class="appointment-actions">
                    <button class="btn btn-outline btn-sm" onclick="Dashboard.rescheduleAppointment(${appointment.id})">Reschedule</button>
                </div>
            `;
            container.appendChild(item);
        });
    },
    
    // Update statistics
    updateStats() {
        const upcomingCount = this.appointments.filter(apt => apt.status === 'upcoming').length;
        const completedCount = this.appointments.filter(apt => apt.status === 'completed').length;
        
        const upcomingElement = document.getElementById('upcomingAppointments');
        const completedElement = document.getElementById('completedAppointments');
        
        if (upcomingElement) upcomingElement.textContent = upcomingCount;
        if (completedElement) completedElement.textContent = completedCount;
    },
    
    // Load clinics data
    async loadClinics() {
        try {
            const clinics = [
                { id: 1, name: 'City Health Clinic', address: '123 Main St, Cape Town' },
                { id: 2, name: 'Metro Medical Center', address: '456 Oak Ave, Johannesburg' },
                { id: 3, name: 'Community Health Center', address: '789 Pine St, Durban' }
            ];
            
            const clinicSelect = document.getElementById('clinicSelect');
            if (clinicSelect) {
                clinicSelect.innerHTML = '<option value="">Select a clinic</option>';
                clinics.forEach(clinic => {
                    const option = document.createElement('option');
                    option.value = clinic.id;
                    option.textContent = clinic.name;
                    clinicSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading clinics:', error);
        }
    },
    
    // Load doctors based on selected clinic
    async loadDoctors() {
        const clinicSelect = document.getElementById('clinicSelect');
        const doctorSelect = document.getElementById('doctorSelect');
        
        if (!clinicSelect || !doctorSelect) return;
        
        const clinicId = clinicSelect.value;
        if (!clinicId) {
            doctorSelect.disabled = true;
            doctorSelect.innerHTML = '<option value="">Select a doctor</option>';
            return;
        }
        
        try {
            // Mock doctors data
            const doctors = [
                { id: 1, name: 'Dr. Smith', specialization: 'General Practice' },
                { id: 2, name: 'Dr. Johnson', specialization: 'Internal Medicine' },
                { id: 3, name: 'Dr. Williams', specialization: 'Pediatrics' }
            ];
            
            doctorSelect.innerHTML = '<option value="">Select a doctor</option>';
            doctors.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.id;
                option.textContent = `${doctor.name} - ${doctor.specialization}`;
                doctorSelect.appendChild(option);
            });
            
            doctorSelect.disabled = false;
        } catch (error) {
            console.error('Error loading doctors:', error);
        }
    },
    
    // Booking form navigation
    nextStep() {
        const currentStepElement = document.getElementById(`step${this.currentStep}`);
        const nextStepElement = document.getElementById(`step${this.currentStep + 1}`);
        
        if (!this.validateCurrentStep()) {
            return;
        }
        
        if (currentStepElement && nextStepElement) {
            currentStepElement.classList.remove('active');
            nextStepElement.classList.add('active');
            this.currentStep++;
            
            if (this.currentStep === 2) {
                this.loadAvailableSlots();
            }
        }
    },
    
    prevStep() {
        const currentStepElement = document.getElementById(`step${this.currentStep}`);
        const prevStepElement = document.getElementById(`step${this.currentStep - 1}`);
        
        if (currentStepElement && prevStepElement) {
            currentStepElement.classList.remove('active');
            prevStepElement.classList.add('active');
            this.currentStep--;
        }
    },
    
    // Validate current booking step
    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                const clinic = document.getElementById('clinicSelect').value;
                const doctor = document.getElementById('doctorSelect').value;
                const type = document.getElementById('appointmentType').value;
                
                if (!clinic || !doctor || !type) {
                    this.showNotification('Please fill in all required fields', 'error');
                    return false;
                }
                break;
            case 2:
                if (!this.selectedDate || !this.selectedTime) {
                    this.showNotification('Please select a date and time', 'error');
                    return false;
                }
                break;
        }
        return true;
    },
    
    // Initialize calendar widget
    initializeCalendar() {
        const calendarWidget = document.getElementById('calendarWidget');
        if (!calendarWidget) return;
        
        const today = new Date();
        this.renderCalendar(today.getFullYear(), today.getMonth());
    },
    
    // Render calendar for given month/year
    renderCalendar(year, month) {
        const calendarWidget = document.getElementById('calendarWidget');
        if (!calendarWidget) return;
        
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const today = new Date();
        
        let calendarHTML = `
            <div class="calendar-header">
                <button type="button" class="calendar-nav" onclick="Dashboard.changeMonth(-1)">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <h4>${monthNames[month]} ${year}</h4>
                <button type="button" class="calendar-nav" onclick="Dashboard.changeMonth(1)">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div class="calendar-grid">
                <div class="calendar-day-header">Sun</div>
                <div class="calendar-day-header">Mon</div>
                <div class="calendar-day-header">Tue</div>
                <div class="calendar-day-header">Wed</div>
                <div class="calendar-day-header">Thu</div>
                <div class="calendar-day-header">Fri</div>
                <div class="calendar-day-header">Sat</div>
        `;
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            calendarHTML += '<div class="calendar-day other-month"></div>';
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateString = date.toISOString().split('T')[0];
            const isToday = date.toDateString() === today.toDateString();
            const isPast = date < today && !isToday;
            const isSelected = dateString === this.selectedDate;
            
            let classes = 'calendar-day';
            if (isPast) classes += ' disabled';
            if (isSelected) classes += ' selected';
            
            calendarHTML += `
                <div class="${classes}" onclick="Dashboard.selectDate('${dateString}')" data-date="${dateString}">
                    ${day}
                </div>
            `;
        }
        
        calendarHTML += '</div>';
        calendarWidget.innerHTML = calendarHTML;
    },
    
    // Change calendar month
    changeMonth(direction) {
        const header = document.querySelector('.calendar-header h4');
        if (!header) return;
        
        const [monthName, year] = header.textContent.split(' ');
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        let month = monthNames.indexOf(monthName);
        let newYear = parseInt(year);
        
        month += direction;
        
        if (month < 0) {
            month = 11;
            newYear--;
        } else if (month > 11) {
            month = 0;
            newYear++;
        }
        
        this.renderCalendar(newYear, month);
    },
    
    // Select date in calendar
    selectDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        
        if (date < today && date.toDateString() !== today.toDateString()) {
            return; // Can't select past dates
        }
        
        this.selectedDate = dateString;
        
        // Update calendar display
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });
        
        const selectedDay = document.querySelector(`[data-date="${dateString}"]`);
        if (selectedDay) {
            selectedDay.classList.add('selected');
        }
        
        // Load available time slots
        this.loadAvailableSlots();
    },
    
    // Load available time slots for selected date
    loadAvailableSlots() {
        const timeSlotsContainer = document.getElementById('timeSlots');
        if (!timeSlotsContainer || !this.selectedDate) return;
        
        // Mock time slots
        const timeSlots = [
            '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
        ];
        
        timeSlotsContainer.innerHTML = '';
        
        timeSlots.forEach(time => {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = time;
            slot.onclick = () => this.selectTimeSlot(time);
            timeSlotsContainer.appendChild(slot);
        });
    },
    
    // Select time slot
    selectTimeSlot(time) {
        this.selectedTime = time;
        
        // Update time slots display
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.classList.remove('selected');
        });
        
        event.target.classList.add('selected');
        
        // Enable next step button
        const nextButton = document.getElementById('step2Next');
        if (nextButton) {
            nextButton.disabled = false;
        }
    },
    
    // Review booking before submission
    reviewBooking() {
        const bookingData = this.collectBookingData();
        const summaryContainer = document.getElementById('bookingSummary');
        
        if (!summaryContainer) return;
        
        summaryContainer.innerHTML = `
            <div class="summary-item">
                <span class="summary-label">Clinic:</span>
                <span class="summary-value">${bookingData.clinicName}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Doctor:</span>
                <span class="summary-value">${bookingData.doctorName}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Date:</span>
                <span class="summary-value">${this.formatDate(bookingData.date)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Time:</span>
                <span class="summary-value">${bookingData.time}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Type:</span>
                <span class="summary-value">${bookingData.type}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Reason:</span>
                <span class="summary-value">${bookingData.reason || 'Not specified'}</span>
            </div>
        `;
        
        this.nextStep();
    },
    
    // Collect booking form data
    collectBookingData() {
        const clinicSelect = document.getElementById('clinicSelect');
        const doctorSelect = document.getElementById('doctorSelect');
        const typeSelect = document.getElementById('appointmentType');
        
        return {
            clinic: clinicSelect.value,
            clinicName: clinicSelect.options[clinicSelect.selectedIndex].text,
            doctor: doctorSelect.value,
            doctorName: doctorSelect.options[doctorSelect.selectedIndex].text,
            type: typeSelect.value,
            date: this.selectedDate,
            time: this.selectedTime,
            reason: document.getElementById('reasonForVisit').value,
            specialRequests: document.getElementById('specialRequests').value,
            smsReminder: document.getElementById('smsReminder').checked,
            emailReminder: document.getElementById('emailReminder').checked
        };
    },
    
    // Submit booking
    async submitBooking() {
        try {
            const bookingData = this.collectBookingData();
            
            // Show loading state
            const submitButton = document.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Booking...';
            submitButton.disabled = true;
            
            // Simulate API call
            await this.simulateApiCall('/appointments', {
                method: 'POST',
                body: JSON.stringify(bookingData)
            });
            
            // Success
            this.showNotification('Appointment booked successfully!', 'success');
            this.resetBookingForm();
            this.showSection('appointments');
            
            // Reload appointments
            await this.loadAppointments();
            this.renderAppointmentsTable();
            this.updateStats();
            
        } catch (error) {
            console.error('Error booking appointment:', error);
            this.showNotification('Failed to book appointment. Please try again.', 'error');
        }
    },
    
    // Reset booking form
    resetBookingForm() {
        console.log('[Dashboard] resetBookingForm called');
        const dbgForm = document.getElementById('bookingForm');
        if (dbgForm) {
            console.log('[Dashboard] bookingForm found, resetting');
        } else {
            console.warn('[Dashboard] bookingForm NOT found');
        }
        this.currentStep = 1;
        this.selectedDate = null;
        this.selectedTime = null;
        
        // Reset form
        const form = document.getElementById('bookingForm');
        if (form) {
            form.reset();
        }
        
        // Show first step
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
        });
        
        const firstStep = document.getElementById('step1');
        if (firstStep) {
            firstStep.classList.add('active');
        }
        
        // Reset selects
        const doctorSelect = document.getElementById('doctorSelect');
        if (doctorSelect) {
            doctorSelect.disabled = true;
            doctorSelect.innerHTML = '<option value="">Select a doctor</option>';
        }
    },
    
    // Load queue status
    async loadQueueStatus() {
        try {
            // Mock queue data
            const queueData = {
                position: 3,
                estimatedWait: 25,
                totalInQueue: 12,
                currentlyServing: 1
            };
            
            this.renderQueueStatus(queueData);
        } catch (error) {
            console.error('Error loading queue status:', error);
        }
    },
    
    // Render queue status
    renderQueueStatus(queueData = null) {
        const container = document.getElementById('currentQueue');
        if (!container) return;
        
        if (!queueData) {
            container.innerHTML = `
                <div class="queue-info">
                    <h3>No Active Queue</h3>
                    <p>You are not currently in any queue.</p>
                </div>
            `;
            return;
        }
        
        const progressPercentage = ((queueData.totalInQueue - queueData.position + 1) / queueData.totalInQueue) * 100;
        
        container.innerHTML = `
            <div class="queue-number">#${queueData.position}</div>
            <div class="queue-info">
                <h3>Your Position in Queue</h3>
                <p>Estimated wait time: ${queueData.estimatedWait} minutes</p>
            </div>
            <div class="queue-progress">
                <div class="queue-progress-bar" style="width: ${progressPercentage}%"></div>
            </div>
            <div class="queue-details">
                <p>Currently serving: #${queueData.currentlyServing}</p>
                <p>Total in queue: ${queueData.totalInQueue}</p>
            </div>
        `;
    },
    
    // Load notifications
    async loadNotifications() {
        try {
            // Mock notifications
            const notifications = [
                { id: 1, message: 'Appointment reminder: Tomorrow at 9:00 AM', type: 'reminder', read: false },
                { id: 2, message: 'Your appointment has been confirmed', type: 'confirmation', read: false },
                { id: 3, message: 'New clinic location available', type: 'info', read: true }
            ];
            
            const unreadCount = notifications.filter(n => !n.read).length;
            const badge = document.getElementById('notificationBadge');
            if (badge) {
                badge.textContent = unreadCount;
                badge.style.display = unreadCount > 0 ? 'inline' : 'none';
            }
            
            const unreadElement = document.getElementById('unreadNotifications');
            if (unreadElement) {
                unreadElement.textContent = unreadCount;
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    },
    
    // Utility functions
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    simulateApiCall(endpoint, options = {}) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate occasional failures
                if (Math.random() < 0.1) {
                    reject(new Error('Network error'));
                } else {
                    resolve({ success: true, data: {} });
                }
            }, 1000 + Math.random() * 1000);
        });
    },
    
    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    },
    
    // Start periodic updates
    startPeriodicUpdates() {
        // Update queue status every 30 seconds
        setInterval(() => {
            if (this.currentSection === 'queue-status') {
                this.loadQueueStatus();
            }
        }, 30000);
        
        // Update notifications every 60 seconds
        setInterval(() => {
            this.loadNotifications();
        }, 60000);
    },
    
    // Appointment actions
    async rescheduleAppointment(appointmentId) {
        // This would typically open a reschedule modal
        this.showNotification('Reschedule functionality would be implemented here', 'info');
    },
    
    async cancelAppointment(appointmentId) {
        if (confirm('Are you sure you want to cancel this appointment?')) {
            try {
                await this.simulateApiCall(`/appointments/${appointmentId}`, {
                    method: 'DELETE'
                });
                
                this.showNotification('Appointment cancelled successfully', 'success');
                await this.loadAppointments();
                this.renderAppointmentsTable();
                this.updateStats();
            } catch (error) {
                this.showNotification('Failed to cancel appointment', 'error');
            }
        }
    },
    
    viewAppointmentDetails(appointmentId) {
        const appointment = this.appointments.find(apt => apt.id === appointmentId);
        if (appointment) {
            // This would typically open a details modal
            this.showNotification(`Viewing details for appointment with ${appointment.doctor}`, 'info');
        }
    },
    
    // Filter appointments
    filterAppointments() {
        const statusFilter = document.getElementById('statusFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        
        let filteredAppointments = [...this.appointments];
        
        if (statusFilter && statusFilter !== 'all') {
            filteredAppointments = filteredAppointments.filter(apt => apt.status === statusFilter);
        }
        
        if (dateFilter) {
            filteredAppointments = filteredAppointments.filter(apt => apt.date === dateFilter);
        }
        
        // Re-render table with filtered data
        const tbody = document.getElementById('appointmentsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        filteredAppointments.forEach(appointment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDate(appointment.date)}</td>
                <td>${appointment.time}</td>
                <td>${appointment.doctor}</td>
                <td>${appointment.clinic}</td>
                <td><span class="status-badge status-${appointment.status}">${appointment.status}</span></td>
                <td>
                    <div class="appointment-actions">
                        ${appointment.status === 'upcoming' ? `
                            <button class="btn btn-outline btn-sm" onclick="Dashboard.rescheduleAppointment(${appointment.id})">
                                <i class="fas fa-edit"></i> Reschedule
                            </button>
                            <button class="btn btn-outline btn-sm" onclick="Dashboard.cancelAppointment(${appointment.id})">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        ` : ''}
                        <button class="btn btn-outline btn-sm" onclick="Dashboard.viewAppointmentDetails(${appointment.id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
};

// Global functions for HTML onclick events
window.showSection = function(sectionId) {
    Dashboard.showSection(sectionId);
};

window.loadDoctors = function() {
    Dashboard.loadDoctors();
};

window.nextStep = function() {
    Dashboard.nextStep();
};

window.prevStep = function() {
    Dashboard.prevStep();
};

window.reviewBooking = function() {
    Dashboard.reviewBooking();
};

window.filterAppointments = function() {
    Dashboard.filterAppointments();
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    Dashboard.init();
});

// Export Dashboard for global access
window.Dashboard = Dashboard;