// Staff Dashboard JavaScript - Healthcare Staff Interface Functionality
// This file handles all interactive features for the staff dashboard

class StaffDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentShift = null;
        this.queueData = [];
        this.emergencyProtocols = [];
        this.scheduleData = [];
        this.patientSearchResults = [];
        this.notifications = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.startRealTimeUpdates();
        this.initializeShiftStatus();
    }


    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('href').substring(1);
                console.log('setupEventListeners this:', section);
                this.showSection(section);
            });
        });

        // Shift management
        const shiftToggle = document.getElementById('shiftToggle');
        if (shiftToggle) {
            shiftToggle.addEventListener('click', () => this.toggleShift());
        }

        // Queue management buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('call-next')) {
                this.callNextPatient();
            }
            if (e.target.classList.contains('mark-no-show')) {
                const patientId = e.target.dataset.patientId;
                this.markNoShow(patientId);
            }
            if (e.target.classList.contains('complete-appointment')) {
                const appointmentId = e.target.dataset.appointmentId;
                this.completeAppointment(appointmentId);
            }
            if (e.target.classList.contains('delay-appointment')) {
                const appointmentId = e.target.dataset.appointmentId;
                this.delayAppointment(appointmentId);
            }
        });

        // Emergency protocol buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('emergency-btn')) {
                const type = e.target.dataset.emergencyType;
                this.triggerEmergencyProtocol(type);
            }
        });

        // Patient search
        const patientSearch = document.getElementById('patientSearch');
        if (patientSearch) {
            patientSearch.addEventListener('input', this.debounce(() => {
                this.searchPatients();
            }, 300));
        }

        // Schedule interactions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('schedule-slot')) {
                this.handleScheduleSlotClick(e.target);
            }
        });

        // Filter controls
        const queueFilter = document.getElementById('queueFilter');
        if (queueFilter) {
            queueFilter.addEventListener('change', () => this.filterQueue());
        }

        // Language selector
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                if (window.changeLanguage) {
                    window.changeLanguage(e.target.value);
                }
            });
        }

        // Refresh buttons
        document.getElementById('refreshQueue')?.addEventListener('click', () => {
            this.loadQueueData();
        });

        document.getElementById('refreshSchedule')?.addEventListener('click', () => {
            this.loadScheduleData();
        });
    }

    showSection(sectionId) {
        // Update sidebar active state
        document.querySelectorAll('.sidebar-link').forEach(item => {
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
    }


    // Load Doctors & Nurses Section
    async loadDoctorsSection() {
        console.log('loadDashboardData called'); 
        try {
            const doctors = [
                { id: 'D001', name: 'Dr. Alice Brown', specialty: 'Cardiology', status: 'available' },
                { id: 'D002', name: 'Dr. Mark Green', specialty: 'General Medicine', status: 'busy' },
                { id: 'N001', name: 'Nurse Emma White', specialty: 'Pediatrics', status: 'available' },
                { id: 'N002', name: 'Nurse John Black', specialty: 'ER', status: 'on-duty' }
            ];

            const container = document.getElementById('Doctors-and-nurse-section');
            if (!container) return;

            container.innerHTML = doctors.map(doc => `
                <div class="staff-card ${doc.status}">
                    <h4>${doc.name}</h4>
                    <p>Specialty: ${doc.specialty}</p>
                    <p>Status: <span class="status-badge ${doc.status}">${doc.status}</span></p>
                    <button class="btn btn-sm btn-primary assign-doctor" data-id="${doc.id}">
                        Assign to Booking
                    </button>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading doctors and nurses section:', error);
        }
    }

    // Load Patients Section
    async loadPatientsSection() {
        try {
            const patients = [
                { id: 'P001', name: 'John Smith', age: 45, lastVisit: '2025-11-01' },
                { id: 'P002', name: 'Mary Johnson', age: 32, lastVisit: '2025-10-28' },
                { id: 'P003', name: 'David Wilson', age: 67, lastVisit: '2025-11-05' }
            ];

            const container = document.getElementById('patients-section');
            if (!container) return;

            container.innerHTML = patients.map(p => `
                <div class="patient-card">
                    <h4>${p.name}</h4>
                    <p>Age: ${p.age}</p>
                    <p>Last Visit: ${p.lastVisit}</p>
                    <button class="btn btn-sm btn-outline view-patient" data-id="${p.id}">
                        View Details
                    </button>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading patients section:', error);
        }
    }

    // Load Patient Requests Section
    async PatientsRequestSection() {
        try {
            const requests = [
                { id: 'R001', patient: 'John Smith', type: 'New Appointment', date: '2025-11-10', status: 'pending' },
                { id: 'R002', patient: 'Mary Johnson', type: 'Reschedule', date: '2025-11-12', status: 'pending' },
                { id: 'R003', patient: 'David Wilson', type: 'Cancellation', date: '2025-11-09', status: 'review' }
            ];

            const container = document.getElementById('patientRequests-section');
            if (!container) return;

            container.innerHTML = requests.map(r => `
                <div class="request-card ${r.status}">
                    <h4>${r.patient}</h4>
                    <p>Request Type: ${r.type}</p>
                    <p>Date: ${r.date}</p>
                    <p>Status: <span class="status-badge ${r.status}">${r.status}</span></p>
                    <button class="btn btn-sm btn-primary assign-doctor" data-request-id="${r.id}">
                        Assign Doctor/Nurse
                    </button>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading patient requests section:', error);
        }
    }

    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard-section':
                await this.loadDashboardData();
                break;

            case 'queue-section':
                await this.loadQueueData();
                break;

            case 'patients-section':
                await this.loadPatientsSection();
                break;

            case 'Doctors-and-nurse-section':
                
                await this.loadDoctorsSection();
                break;

            case 'patientRequests-section':
                await this.PatientsRequestSection();
                break;
        }
    }


    async loadInitialData() {
        try {
            await Promise.all([
                this.loadDashboardData(),
                this.loadQueueData(),
                this.loadShiftData(),
                this.loadNotifications()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showNotification('Error loading dashboard data', 'error');
        }
    }

    async loadDashboardData() {
        try {
            // Load dashboard overview data
            const dashboardData = {
                todayAppointments: 24,
                queueLength: 8,
                completedToday: 16,
                averageWaitTime: 15,
                nextAppointment: {
                    time: '14:30',
                    patient: 'Sarah Johnson',
                    type: 'General Consultation'
                },
                recentActivity: [
                    {
                        time: '14:15',
                        action: 'Completed appointment with John Doe',
                        type: 'completion'
                    },
                    {
                        time: '14:00',
                        action: 'Patient Mary Smith checked in',
                        type: 'checkin'
                    },
                    {
                        time: '13:45',
                        action: 'Emergency protocol activated - Code Blue',
                        type: 'emergency'
                    }
                ]
            };

            this.updateDashboardStats(dashboardData);
            this.displayRecentActivity(dashboardData.recentActivity);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    updateDashboardStats(data) {
        const elements = {
            todayAppointments: document.getElementById('todayAppointments'),
            queueLength: document.getElementById('queueLength'),
            completedToday: document.getElementById('completedToday'),
            averageWaitTime: document.getElementById('averageWaitTime')
        };

        Object.keys(elements).forEach(key => {
            if (elements[key] && data[key] !== undefined) {
                elements[key].textContent = key === 'averageWaitTime' ? 
                    `${data[key]} min` : data[key];
            }
        });

        // Update next appointment
        const nextAppElement = document.getElementById('nextAppointment');
        if (nextAppElement && data.nextAppointment) {
            nextAppElement.innerHTML = `
                <div class="next-appointment-info">
                    <div class="appointment-time">${data.nextAppointment.time}</div>
                    <div class="appointment-details">
                        <strong>${data.nextAppointment.patient}</strong><br>
                        ${data.nextAppointment.type}
                    </div>
                </div>
            `;
        }
    }

    displayRecentActivity(activities) {
        const container = document.getElementById('recentActivityList');
        if (!container) return;

        container.innerHTML = activities.map(activity => `
            <div class="activity-item ${activity.type}">
                <div class="activity-time">${activity.time}</div>
                <div class="activity-text">${activity.action}</div>
            </div>
        `).join('');
    }

    async loadQueueData() {
        try {
            const queueData = [
                {
                    id: 1,
                    position: 1,
                    patient: {
                        name: 'John Smith',
                        age: 45,
                        id: 'P001',
                        appointmentTime: '14:00',
                        type: 'General Consultation',
                        priority: 'normal',
                        status: 'waiting',
                        waitTime: 30
                    }
                },
                {
                    id: 2,
                    position: 2,
                    patient: {
                        name: 'Mary Johnson',
                        age: 32,
                        id: 'P002',
                        appointmentTime: '14:15',
                        type: 'Follow-up',
                        priority: 'normal',
                        status: 'checked-in',
                        waitTime: 15
                    }
                },
                {
                    id: 3,
                    position: 3,
                    patient: {
                        name: 'David Wilson',
                        age: 67,
                        id: 'P003',
                        appointmentTime: '14:30',
                        type: 'Chronic Disease Management',
                        priority: 'high',
                        status: 'waiting',
                        waitTime: 5
                    }
                },
                {
                    id: 4,
                    position: 0,
                    patient: {
                        name: 'Emergency Patient',
                        age: 28,
                        id: 'E001',
                        appointmentTime: 'NOW',
                        type: 'Emergency',
                        priority: 'urgent',
                        status: 'urgent',
                        waitTime: 0
                    }
                }
            ];

            this.queueData = queueData;
            this.displayQueue();
            this.updateQueueStats();
        } catch (error) {
            console.error('Error loading queue data:', error);
        }
    }

    displayQueue() {
        const container = document.getElementById('queueContainer');
        if (!container) return;

        if (this.queueData.length === 0) {
            container.innerHTML = `
                <div class="empty-queue">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No patients in queue</p>
                </div>
            `;
            return;
        }

        // Sort by priority and position
        const sortedQueue = [...this.queueData].sort((a, b) => {
            const priorityOrder = { urgent: 0, high: 1, normal: 2 };
            if (a.patient.priority !== b.patient.priority) {
                return priorityOrder[a.patient.priority] - priorityOrder[b.patient.priority];
            }
            return a.position - b.position;
        });

        container.innerHTML = sortedQueue.map(item => `
            <div class="queue-item ${item.patient.priority} ${item.patient.status}" data-patient-id="${item.patient.id}">
                <div class="queue-position">
                    ${item.position === 0 ? 'URGENT' : `#${item.position}`}
                </div>
                <div class="patient-info">
                    <div class="patient-header">
                        <h4>${item.patient.name}</h4>
                        <span class="patient-age">Age: ${item.patient.age}</span>
                    </div>
                    <div class="appointment-details">
                        <span class="appointment-time">
                            <i class="fas fa-clock"></i> ${item.patient.appointmentTime}
                        </span>
                        <span class="appointment-type">${item.patient.type}</span>
                    </div>
                    <div class="wait-info">
                        <span class="wait-time">Wait: ${item.patient.waitTime} min</span>
                        <span class="priority-badge ${item.patient.priority}">${item.patient.priority}</span>
                    </div>
                </div>
                <div class="queue-actions">
                    <button class="btn btn-sm btn-primary call-next" data-patient-id="${item.patient.id}">
                        <i class="fas fa-user-check"></i> Call
                    </button>
                    <button class="btn btn-sm btn-outline delay-appointment" data-appointment-id="${item.id}">
                        <i class="fas fa-clock"></i> Delay
                    </button>
                    <button class="btn btn-sm btn-outline mark-no-show" data-patient-id="${item.patient.id}">
                        <i class="fas fa-user-times"></i> No Show
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateQueueStats() {
        const totalInQueue = this.queueData.length;
        const urgentPatients = this.queueData.filter(item => item.patient.priority === 'urgent').length;
        const averageWait = totalInQueue > 0 ? 
            Math.round(this.queueData.reduce((sum, item) => sum + item.patient.waitTime, 0) / totalInQueue) : 0;

        const elements = {
            queueTotal: document.getElementById('queueTotal'),
            urgentCount: document.getElementById('urgentCount'),
            averageWaitQueue: document.getElementById('averageWaitQueue')
        };

        if (elements.queueTotal) elements.queueTotal.textContent = totalInQueue;
        if (elements.urgentCount) elements.urgentCount.textContent = urgentPatients;
        if (elements.averageWaitQueue) elements.averageWaitQueue.textContent = `${averageWait} min`;
    }

    async loadEmergencyProtocols() {
        try {
            const protocols = [
                {
                    id: 1,
                    name: 'Code Blue - Cardiac Arrest',
                    type: 'code-blue',
                    description: 'Patient in cardiac arrest, requires immediate CPR',
                    color: 'blue',
                    actions: [
                        'Call emergency services immediately',
                        'Begin CPR if trained',
                        'Clear the area of non-essential personnel',
                        'Prepare defibrillator if available'
                    ]
                },
                {
                    id: 2,
                    name: 'Code Red - Fire Emergency',
                    type: 'code-red',
                    description: 'Fire detected in facility',
                    color: 'red',
                    actions: [
                        'Activate fire alarm',
                        'Call fire department',
                        'Evacuate patients and staff',
                        'Close fire doors'
                    ]
                },
                {
                    id: 3,
                    name: 'Code Grey - Security Threat',
                    type: 'code-grey',
                    description: 'Security threat or combative person',
                    color: 'grey',
                    actions: [
                        'Call security immediately',
                        'Do not confront the person',
                        'Clear the area if safe to do so',
                        'Alert other staff members'
                    ]
                },
                {
                    id: 4,
                    name: 'Medical Emergency',
                    type: 'medical',
                    description: 'Patient requires immediate medical attention',
                    color: 'orange',
                    actions: [
                        'Assess patient condition',
                        'Call for medical assistance',
                        'Administer first aid if qualified',
                        'Prepare for ambulance arrival'
                    ]
                }
            ];

            this.emergencyProtocols = protocols;
            this.displayEmergencyProtocols();
        } catch (error) {
            console.error('Error loading emergency protocols:', error);
        }
    }

    displayEmergencyProtocols() {
        const container = document.getElementById('emergencyProtocols');
        if (!container) return;

        container.innerHTML = this.emergencyProtocols.map(protocol => `
            <div class="emergency-protocol ${protocol.color}">
                <div class="protocol-header">
                    <h3>${protocol.name}</h3>
                    <button class="emergency-btn ${protocol.color}" data-emergency-type="${protocol.type}">
                        <i class="fas fa-exclamation-triangle"></i> Activate
                    </button>
                </div>
                <p class="protocol-description">${protocol.description}</p>
                <div class="protocol-actions">
                    <h4>Actions:</h4>
                    <ol>
                        ${protocol.actions.map(action => `<li>${action}</li>`).join('')}
                    </ol>
                </div>
            </div>
        `).join('');
    }

    async loadScheduleData() {
        try {
            const today = new Date();
            const scheduleData = [];

            // Generate schedule for next 7 days
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                
                const daySchedule = {
                    date: date.toISOString().split('T')[0],
                    dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    slots: this.generateTimeSlots(date)
                };
                
                scheduleData.push(daySchedule);
            }

            this.scheduleData = scheduleData;
            this.displaySchedule();
        } catch (error) {
            console.error('Error loading schedule data:', error);
        }
    }

    generateTimeSlots(date) {
        const slots = [];
        const isToday = date.toDateString() === new Date().toDateString();
        const currentHour = new Date().getHours();

        // Generate slots from 9 AM to 5 PM
        for (let hour = 9; hour < 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const isPast = isToday && hour <= currentHour;
                
                slots.push({
                    time: timeString,
                    status: this.getSlotStatus(date, hour, minute),
                    patient: this.getSlotPatient(date, hour, minute),
                    isPast: isPast
                });
            }
        }

        return slots;
    }

    getSlotStatus(date, hour, minute) {
        // Simulate some appointments
        const random = Math.random();
        if (random < 0.3) return 'booked';
        if (random < 0.4) return 'tentative';
        return 'available';
    }

    getSlotPatient(date, hour, minute) {
        const patients = [
            'John Smith', 'Mary Johnson', 'David Wilson', 'Sarah Brown',
            'Michael Davis', 'Lisa Wilson', 'Robert Taylor', 'Jennifer Lee'
        ];
        
        return Math.random() < 0.3 ? patients[Math.floor(Math.random() * patients.length)] : null;
    }

    displaySchedule() {
        const container = document.getElementById('scheduleGrid');
        if (!container) return;

        container.innerHTML = `
            <div class="schedule-header">
                ${this.scheduleData.map(day => `
                    <div class="schedule-day-header">
                        <div class="day-name">${day.dayName}</div>
                        <div class="day-date">${this.formatDate(day.date)}</div>
                    </div>
                `).join('')}
            </div>
            <div class="schedule-body">
                ${this.generateScheduleTimeRows()}
            </div>
        `;
    }

    generateScheduleTimeRows() {
        const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', 
                          '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
        
        return timeSlots.map(time => `
            <div class="schedule-time-row">
                <div class="time-label">${time}</div>
                ${this.scheduleData.map((day, dayIndex) => {
                    const slot = day.slots.find(s => s.time === time);
                    return `
                        <div class="schedule-slot ${slot ? slot.status : 'available'} ${slot && slot.isPast ? 'past' : ''}" 
                             data-date="${day.date}" 
                             data-time="${time}">
                            ${slot && slot.patient ? `
                                <div class="slot-patient">${slot.patient}</div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `).join('');
    }

    // Queue Management Functions
    async callNextPatient() {
        const nextPatient = this.queueData.find(item => item.position === 1 || item.patient.priority === 'urgent');
        if (!nextPatient) {
            this.showNotification('No patients in queue', 'info');
            return;
        }

        try {
            // Simulate API call
            await this.simulateApiCall('/staff/queue/call-next', {
                method: 'POST',
                body: JSON.stringify({ patientId: nextPatient.patient.id })
            });

            // Update UI
            this.showNotification(`Calling ${nextPatient.patient.name}`, 'success');
            
            // Remove from queue or update status
            this.queueData = this.queueData.filter(item => item.patient.id !== nextPatient.patient.id);
            this.displayQueue();
            this.updateQueueStats();

            // Update dashboard stats
            await this.loadDashboardData();

        } catch (error) {
            console.error('Error calling next patient:', error);
            this.showNotification('Error calling patient', 'error');
        }
    }

    async markNoShow(patientId) {
        if (!confirm('Mark this patient as a no-show?')) {
            return;
        }

        try {
            await this.simulateApiCall(`/staff/appointments/${patientId}/no-show`, {
                method: 'PUT'
            });

            // Remove from queue
            this.queueData = this.queueData.filter(item => item.patient.id !== patientId);
            this.displayQueue();
            this.updateQueueStats();

            this.showNotification('Patient marked as no-show', 'success');

        } catch (error) {
            console.error('Error marking no-show:', error);
            this.showNotification('Error updating patient status', 'error');
        }
    }

    async completeAppointment(appointmentId) {
        try {
            await this.simulateApiCall(`/staff/appointments/${appointmentId}/complete`, {
                method: 'PUT'
            });

            this.showNotification('Appointment completed', 'success');
            await this.loadDashboardData();

        } catch (error) {
            console.error('Error completing appointment:', error);
            this.showNotification('Error completing appointment', 'error');
        }
    }

    async delayAppointment(appointmentId) {
        const delayMinutes = prompt('Delay by how many minutes?', '15');
        if (!delayMinutes || isNaN(delayMinutes)) {
            return;
        }

        try {
            await this.simulateApiCall(`/staff/appointments/${appointmentId}/delay`, {
                method: 'PUT',
                body: JSON.stringify({ delayMinutes: parseInt(delayMinutes) })
            });

            this.showNotification(`Appointment delayed by ${delayMinutes} minutes`, 'success');
            await this.loadQueueData();

        } catch (error) {
            console.error('Error delaying appointment:', error);
            this.showNotification('Error delaying appointment', 'error');
        }
    }

    // Emergency Functions
    async triggerEmergencyProtocol(type) {
        if (!confirm('Are you sure you want to activate this emergency protocol?')) {
            return;
        }

        try {
            await this.simulateApiCall('/staff/emergency/activate', {
                method: 'POST',
                body: JSON.stringify({ type: type, timestamp: new Date().toISOString() })
            });

            // Show emergency alert
            this.showEmergencyAlert(type);
            
            // Log activity
            this.logEmergencyActivity(type);

            this.showNotification(`Emergency protocol ${type} activated`, 'warning');

        } catch (error) {
            console.error('Error activating emergency protocol:', error);
            this.showNotification('Error activating emergency protocol', 'error');
        }
    }

    showEmergencyAlert(type) {
        // Create emergency overlay
        const overlay = document.createElement('div');
        overlay.className = 'emergency-overlay';
        overlay.innerHTML = `
            <div class="emergency-alert">
                <div class="emergency-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2>EMERGENCY PROTOCOL ACTIVATED</h2>
                <p>Protocol: ${type.toUpperCase()}</p>
                <p>All staff have been notified</p>
                <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">
                    Acknowledge
                </button>
            </div>
        `;

        document.body.appendChild(overlay);
    }

    logEmergencyActivity(type) {
        const activity = {
            time: new Date().toLocaleTimeString(),
            action: `Emergency protocol activated - ${type}`,
            type: 'emergency'
        };

        // Add to recent activity (would normally be handled by backend)
        console.log('Emergency activity logged:', activity);
    }

    // Shift Management
    async initializeShiftStatus() {
        try {
            // Check current shift status
            const shiftData = await this.simulateApiCall('/staff/shift/status');
            this.currentShift = shiftData.isActive ? 'active' : 'inactive';
            this.updateShiftUI();
        } catch (error) {
            console.error('Error loading shift status:', error);
        }
    }

    async toggleShift() {
        try {
            const action = this.currentShift === 'active' ? 'end' : 'start';
            
            await this.simulateApiCall(`/staff/shift/${action}`, {
                method: 'POST'
            });

            this.currentShift = this.currentShift === 'active' ? 'inactive' : 'active';
            this.updateShiftUI();

            this.showNotification(`Shift ${action}ed successfully`, 'success');

        } catch (error) {
            console.error('Error toggling shift:', error);
            this.showNotification('Error updating shift status', 'error');
        }
    }

    updateShiftUI() {
        const shiftIndicator = document.getElementById('shiftIndicator');
        const shiftToggle = document.getElementById('shiftToggle');

        if (shiftIndicator) {
            shiftIndicator.className = `shift-indicator ${this.currentShift}`;
            shiftIndicator.textContent = this.currentShift === 'active' ? 'On Duty' : 'Off Duty';
        }

        if (shiftToggle) {
            shiftToggle.textContent = this.currentShift === 'active' ? 'End Shift' : 'Start Shift';
            shiftToggle.className = `btn ${this.currentShift === 'active' ? 'btn-outline' : 'btn-primary'}`;
        }
    }

    // Patient Management
    async searchPatients() {
        const searchTerm = document.getElementById('patientSearch').value.trim();
        if (!searchTerm || searchTerm.length < 2) {
            this.clearPatientSearchResults();
            return;
        }

        try {
            // Simulate API call
            const results = [
                {
                    id: 'P001',
                    name: 'John Smith',
                    age: 45,
                    phone: '+27821234567',
                    lastVisit: '2024-01-10',
                    conditions: ['Hypertension', 'Diabetes']
                },
                {
                    id: 'P002',
                    name: 'Mary Johnson',
                    age: 32,
                    phone: '+27827654321',
                    lastVisit: '2024-01-08',
                    conditions: ['Asthma']
                }
            ].filter(patient => 
                patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                patient.id.toLowerCase().includes(searchTerm.toLowerCase())
            );

            this.patientSearchResults = results;
            this.displayPatientSearchResults();

        } catch (error) {
            console.error('Error searching patients:', error);
            this.showNotification('Error searching patients', 'error');
        }
    }

    displayPatientSearchResults() {
        const container = document.getElementById('patientSearchResults');
        if (!container) return;

        if (this.patientSearchResults.length === 0) {
            container.innerHTML = '<p class="no-results">No patients found</p>';
            return;
        }

        container.innerHTML = this.patientSearchResults.map(patient => `
            <div class="patient-result" onclick="staffDashboard.viewPatientDetails('${patient.id}')">
                <div class="patient-basic-info">
                    <h4>${patient.name}</h4>
                    <span class="patient-id">${patient.id}</span>
                </div>
                <div class="patient-details">
                    <p><strong>Age:</strong> ${patient.age}</p>
                    <p><strong>Phone:</strong> ${patient.phone}</p>
                    <p><strong>Last Visit:</strong> ${this.formatDate(patient.lastVisit)}</p>
                    ${patient.conditions.length > 0 ? `
                        <p><strong>Conditions:</strong> ${patient.conditions.join(', ')}</p>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    clearPatientSearchResults() {
        const container = document.getElementById('patientSearchResults');
        if (container) {
            container.innerHTML = '';
        }
    }

    viewPatientDetails(patientId) {
        const patient = this.patientSearchResults.find(p => p.id === patientId);
        if (patient) {
            this.showNotification(`View details for ${patient.name}`, 'info');
            // In a real app, this would open a patient details modal
        }
    }

    // Schedule Management
    handleScheduleSlotClick(slotElement) {
        const date = slotElement.dataset.date;
        const time = slotElement.dataset.time;
        const status = slotElement.classList.contains('booked') ? 'booked' : 
                      slotElement.classList.contains('tentative') ? 'tentative' : 'available';

        this.showScheduleSlotMenu(date, time, status, slotElement);
    }

    showScheduleSlotMenu(date, time, status, element) {
        // Create context menu
        const menu = document.createElement('div');
        menu.className = 'schedule-context-menu';
        menu.innerHTML = `
            <div class="menu-item" onclick="staffDashboard.bookSlot('${date}', '${time}')">
                <i class="fas fa-plus"></i> Book Appointment
            </div>
            ${status === 'booked' ? `
                <div class="menu-item" onclick="staffDashboard.viewAppointment('${date}', '${time}')">
                    <i class="fas fa-eye"></i> View Details
                </div>
                <div class="menu-item" onclick="staffDashboard.cancelSlot('${date}', '${time}')">
                    <i class="fas fa-times"></i> Cancel
                </div>
            ` : ''}
            <div class="menu-item" onclick="staffDashboard.blockSlot('${date}', '${time}')">
                <i class="fas fa-ban"></i> Block Slot
            </div>
        `;

        // Position menu
        const rect = element.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = `${rect.bottom + 5}px`;
        menu.style.left = `${rect.left}px`;

        document.body.appendChild(menu);

        // Remove menu when clicking elsewhere
        setTimeout(() => {
            document.addEventListener('click', function removeMenu() {
                if (menu.parentElement) {
                    menu.remove();
                }
                document.removeEventListener('click', removeMenu);
            });
        }, 100);
    }

    bookSlot(date, time) {
        this.showNotification(`Book appointment for ${date} at ${time}`, 'info');
    }

    viewAppointment(date, time) {
        this.showNotification(`View appointment for ${date} at ${time}`, 'info');
    }

    cancelSlot(date, time) {
        if (confirm(`Cancel appointment for ${date} at ${time}?`)) {
            this.showNotification('Appointment cancelled', 'success');
            this.loadScheduleData();
        }
    }

    blockSlot(date, time) {
        this.showNotification(`Block slot for ${date} at ${time}`, 'info');
    }

    // Filter Functions
    filterQueue() {
        const filter = document.getElementById('queueFilter').value;
        let filteredQueue = [...this.queueData];

        switch (filter) {
            case 'urgent':
                filteredQueue = filteredQueue.filter(item => item.patient.priority === 'urgent');
                break;
            case 'waiting':
                filteredQueue = filteredQueue.filter(item => item.patient.status === 'waiting');
                break;
            case 'checked-in':
                filteredQueue = filteredQueue.filter(item => item.patient.status === 'checked-in');
                break;
        }

        // Temporarily update display with filtered data
        const originalData = this.queueData;
        this.queueData = filteredQueue;
        this.displayQueue();
        this.queueData = originalData;
    }

    // Utility Functions
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async simulateApiCall(endpoint, options = {}) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() < 0.1) {
                    reject(new Error('Network error'));
                } else {
                    resolve({ success: true, data: {} });
                }
            }, 500 + Math.random() * 1000);
        });
    }

    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    startRealTimeUpdates() {
        // Update queue every 30 seconds
        setInterval(() => {
            if (this.currentSection === 'queue') {
                this.loadQueueData();
            }
        }, 30000);

        // Update dashboard every 60 seconds
        setInterval(() => {
            if (this.currentSection === 'dashboard') {
                this.loadDashboardData();
            }
        }, 60000);
    }

    // Placeholder functions for missing sections
    async loadShiftData() {
        console.log('Loading shift data...');
    }

    async loadNotifications() {
        console.log('Loading notifications...');
    }

    async loadPatientsData() {
        console.log('Loading patients data...');
    }

    async loadStaffReports() {
        console.log('Loading staff reports...');
    }
}

// Global functions for HTML onclick events
window.showSection = function(sectionName) {
    if (window.staffDashboard) {
        window.staffDashboard.showSection(sectionName);
    }
};

// Initialize staff dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.body.classList.contains('staff-dashboard') || 
        window.location.pathname.includes('staff-dashboard')) {
        window.staffDashboard = new StaffDashboard();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StaffDashboard;
}