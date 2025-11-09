// Admin Dashboard JavaScript - Administrative Interface Functionality
// This file handles all interactive features for the admin dashboard

class AdminDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.users = [];
        this.clinics = [];
        this.stats = {};
        this.activities = [];
        this.alerts = [];
        this.currentSettingsTab = 'general';
        
        this.init();
    }

    init() {
        this.checkAdminAuth();
        this.setupEventListeners();
        this.loadInitialData();
        this.startRealTimeUpdates();
    }

    checkAdminAuth() {
        // Check if user has admin role
        if (!Auth.isAuthenticated() || !Auth.hasRole('admin')) {
            window.location.href = '../index.html';
            return;
        }
        
        // Update admin user info
        const user = Auth.getCurrentUser();
        if (user) {
            const userName = document.getElementById('userName');
            if (userName) userName.textContent = user.firstName || 'Administrator';
        }
    }

    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('href').substring(1);
                this.showSection(section);
            });
        });

        // User management filters
        const userSearch = document.getElementById('userSearch');
        if (userSearch) {
            userSearch.addEventListener('input', this.debounce(() => {
                this.filterUsers();
            }, 300));
        }

        const userTypeFilter = document.getElementById('userTypeFilter');
        if (userTypeFilter) {
            userTypeFilter.addEventListener('change', () => this.filterUsers());
        }

        const userStatusFilter = document.getElementById('userStatusFilter');
        if (userStatusFilter) {
            userStatusFilter.addEventListener('change', () => this.filterUsers());
        }

        // Clinic management filters
        const clinicSearch = document.getElementById('clinicSearch');
        if (clinicSearch) {
            clinicSearch.addEventListener('input', this.debounce(() => {
                this.filterClinics();
            }, 300));
        }

        const clinicStatusFilter = document.getElementById('clinicStatusFilter');
        if (clinicStatusFilter) {
            clinicStatusFilter.addEventListener('change', () => this.filterClinics());
        }

        // Settings tabs
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('onclick').match(/'([^']+)'/)[1];
                this.showSettingsTab(tabName);
            });
        });

        // Forms
        const addUserForm = document.getElementById('addUserForm');
        if (addUserForm) {
            addUserForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createUser();
            });
        }

        // Reports date range
        const reportStartDate = document.getElementById('reportStartDate');
        const reportEndDate = document.getElementById('reportEndDate');
        if (reportStartDate && reportEndDate) {
            reportStartDate.addEventListener('change', () => this.updateReportData());
            reportEndDate.addEventListener('change', () => this.updateReportData());
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
    }

    showSection(sectionName) {
        // Update sidebar active state
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeItem = document.querySelector(`[href="#${sectionName}"]`)?.parentElement;
        if (activeItem) {
            activeItem.classList.add('active');
        }

        // Show content section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
        }

        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'users':
                await this.loadUsersData();
                break;
            case 'clinics':
                await this.loadClinicsData();
                break;
            case 'staff':
                await this.loadStaffData();
                break;
            case 'appointments':
                await this.loadAppointmentsOverview();
                break;
            case 'reports':
                await this.loadReportsData();
                break;
            case 'notifications':
                await this.loadNotificationsData();
                break;
            case 'settings':
                await this.loadSettingsData();
                break;
        }
    }

    async loadInitialData() {
        try {
            await Promise.all([
                this.loadSystemStats(),
                this.loadRecentActivity(),
                this.loadSystemAlerts(),
                this.loadDashboardData()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showNotification('Error loading dashboard data', 'error');
        }
    }

    async loadSystemStats() {
        try {
            // Simulate API call
            const stats = {
                totalUsers: 1247,
                totalAppointments: 8456,
                activeClinics: 12,
                activeStaff: 89,
                userGrowth: 12,
                appointmentGrowth: 8,
                clinicGrowth: 0,
                staffGrowth: 3
            };

            this.updateStatsDisplay(stats);
        } catch (error) {
            console.error('Error loading system stats:', error);
        }
    }

    updateStatsDisplay(stats) {
        const elements = {
            totalUsers: document.getElementById('totalUsers'),
            totalAppointments: document.getElementById('totalAppointments'),
            activeClinics: document.getElementById('activeClinics'),
            activeStaff: document.getElementById('activeStaff')
        };

        Object.keys(elements).forEach(key => {
            if (elements[key]) {
                elements[key].textContent = this.formatNumber(stats[key]);
            }
        });
    }

    async loadRecentActivity() {
        try {
            const activities = [
                {
                    id: 1,
                    type: 'user_registration',
                    message: 'New patient registered: Sarah Johnson',
                    timestamp: new Date(Date.now() - 1000 * 60 * 15),
                    icon: 'fa-user-plus',
                    color: 'blue'
                },
                {
                    id: 2,
                    type: 'appointment_booked',
                    message: 'Appointment booked at City Medical Centre',
                    timestamp: new Date(Date.now() - 1000 * 60 * 30),
                    icon: 'fa-calendar-plus',
                    color: 'green'
                },
                {
                    id: 3,
                    type: 'clinic_updated',
                    message: 'Health Plus Clinic updated operating hours',
                    timestamp: new Date(Date.now() - 1000 * 60 * 45),
                    icon: 'fa-hospital',
                    color: 'orange'
                },
                {
                    id: 4,
                    type: 'staff_login',
                    message: 'Dr. Smith logged into staff dashboard',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60),
                    icon: 'fa-user-md',
                    color: 'purple'
                }
            ];

            this.activities = activities;
            this.displayRecentActivity();
        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }

    displayRecentActivity() {
        const container = document.getElementById('recentActivityList');
        if (!container) return;

        if (this.activities.length === 0) {
            container.innerHTML = '<p class="no-data">No recent activity</p>';
            return;
        }

        container.innerHTML = this.activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.color}">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.message}</p>
                    <span class="activity-time">${this.timeAgo(activity.timestamp)}</span>
                </div>
            </div>
        `).join('');
    }

    async loadSystemAlerts() {
        try {
            const alerts = [
                {
                    id: 1,
                    type: 'warning',
                    message: 'Server CPU usage is above 80%',
                    timestamp: new Date(Date.now() - 1000 * 60 * 10),
                    severity: 'warning'
                },
                {
                    id: 2,
                    type: 'info',
                    message: 'System backup completed successfully',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                    severity: 'info'
                },
                {
                    id: 3,
                    type: 'error',
                    message: 'Failed to send SMS notifications to 3 users',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
                    severity: 'error'
                }
            ];

            this.alerts = alerts;
            this.displaySystemAlerts();
        } catch (error) {
            console.error('Error loading system alerts:', error);
        }
    }

    displaySystemAlerts() {
        const container = document.getElementById('systemAlertsList');
        if (!container) return;

        if (this.alerts.length === 0) {
            container.innerHTML = '<p class="no-data">No system alerts</p>';
            return;
        }

        container.innerHTML = this.alerts.map(alert => `
            <div class="alert-item ${alert.severity}">
                <div class="alert-icon">
                    <i class="fas ${this.getAlertIcon(alert.severity)}"></i>
                </div>
                <div class="alert-content">
                    <p>${alert.message}</p>
                    <span class="alert-time">${this.timeAgo(alert.timestamp)}</span>
                </div>
                <button class="alert-dismiss" onclick="adminDashboard.dismissAlert(${alert.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    async loadUsersData() {
        try {
            const users = [
                {
                    id: 1,
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john.doe@email.com',
                    phone: '+27821234567',
                    role: 'patient',
                    status: 'active',
                    registered: '2024-01-15'
                },
                {
                    id: 2,
                    firstName: 'Dr. Sarah',
                    lastName: 'Smith',
                    email: 'dr.smith@clinic.com',
                    phone: '+27827654321',
                    role: 'staff',
                    status: 'active',
                    registered: '2024-01-10'
                },
                {
                    id: 3,
                    firstName: 'Admin',
                    lastName: 'User',
                    email: 'admin@clinicbook.com',
                    phone: '+27829876543',
                    role: 'admin',
                    status: 'active',
                    registered: '2024-01-01'
                }
            ];

            this.users = users;
            this.displayUsersTable();
        } catch (error) {
            console.error('Error loading users data:', error);
        }
    }

    displayUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        if (this.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = this.users.map(user => `
            <tr>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.email}</td>
                <td>${user.phone}</td>
                <td><span class="role-badge ${user.role}">${user.role}</span></td>
                <td><span class="status-badge ${user.status}">${user.status}</span></td>
                <td>${this.formatDate(user.registered)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-outline" onclick="adminDashboard.editUser(${user.id})" title="Edit User">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="adminDashboard.viewUser(${user.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="adminDashboard.suspendUser(${user.id})" title="Suspend User">
                            <i class="fas fa-ban"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadClinicsData() {
        try {
            const clinics = [
                {
                    id: 1,
                    name: 'City Medical Centre',
                    address: '123 Main Street, Cape Town',
                    phone: '+27214567890',
                    email: 'info@citymedical.co.za',
                    status: 'active',
                    capacity: 50,
                    currentLoad: 35,
                    lastUpdated: '2024-01-15T10:30:00Z'
                },
                {
                    id: 2,
                    name: 'Health Plus Clinic',
                    address: '456 Oak Avenue, Cape Town',
                    phone: '+27214567891',
                    email: 'contact@healthplus.co.za',
                    status: 'active',
                    capacity: 30,
                    currentLoad: 28,
                    lastUpdated: '2024-01-15T09:15:00Z'
                },
                {
                    id: 3,
                    name: 'Community Health Center',
                    address: '789 Pine Road, Cape Town',
                    phone: '+27214567892',
                    email: 'admin@community.health.co.za',
                    status: 'maintenance',
                    capacity: 40,
                    currentLoad: 0,
                    lastUpdated: '2024-01-14T16:00:00Z'
                }
            ];

            this.clinics = clinics;
            this.displayClinicsGrid();
        } catch (error) {
            console.error('Error loading clinics data:', error);
        }
    }

    displayClinicsGrid() {
        const container = document.getElementById('clinicsGrid');
        if (!container) return;

        if (this.clinics.length === 0) {
            container.innerHTML = '<p class="no-data">No clinics found</p>';
            return;
        }

        container.innerHTML = this.clinics.map(clinic => `
            <div class="clinic-card">
                <div class="clinic-header">
                    <div class="clinic-info">
                        <h3>${clinic.name}</h3>
                        <p>${clinic.address}</p>
                    </div>
                    <span class="clinic-status ${clinic.status}">${clinic.status}</span>
                </div>
                <div class="clinic-details">
                    <div class="detail-item">
                        <i class="fas fa-phone"></i>
                        <span>${clinic.phone}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-envelope"></i>
                        <span>${clinic.email}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-users"></i>
                        <span>Capacity: ${clinic.currentLoad}/${clinic.capacity}</span>
                    </div>
                </div>
                <div class="clinic-actions">
                    <button class="btn btn-sm btn-outline" onclick="adminDashboard.editClinic(${clinic.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="adminDashboard.viewClinicStats(${clinic.id})">
                        <i class="fas fa-chart-bar"></i> Stats
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="adminDashboard.manageClinicStaff(${clinic.id})">
                        <i class="fas fa-user-md"></i> Staff
                    </button>
                </div>
            </div>
        `).join('');
    }

    showSettingsTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });

        const activeButton = document.querySelector(`[onclick*="'${tabName}'"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        // Show tab content
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        const targetTab = document.getElementById(`${tabName}-settings`);
        if (targetTab) {
            targetTab.classList.add('active');
            this.currentSettingsTab = tabName;
        }
    }

    async filterUsers() {
        const searchTerm = document.getElementById('userSearch').value.toLowerCase();
        const typeFilter = document.getElementById('userTypeFilter').value;
        const statusFilter = document.getElementById('userStatusFilter').value;

        let filteredUsers = [...this.users];

        if (searchTerm) {
            filteredUsers = filteredUsers.filter(user => 
                user.firstName.toLowerCase().includes(searchTerm) ||
                user.lastName.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm) ||
                user.phone.includes(searchTerm)
            );
        }

        if (typeFilter && typeFilter !== 'all') {
            filteredUsers = filteredUsers.filter(user => user.role === typeFilter);
        }

        if (statusFilter && statusFilter !== 'all') {
            filteredUsers = filteredUsers.filter(user => user.status === statusFilter);
        }

        // Update display with filtered users
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        tbody.innerHTML = filteredUsers.map(user => `
            <tr>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.email}</td>
                <td>${user.phone}</td>
                <td><span class="role-badge ${user.role}">${user.role}</span></td>
                <td><span class="status-badge ${user.status}">${user.status}</span></td>
                <td>${this.formatDate(user.registered)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-outline" onclick="adminDashboard.editUser(${user.id})" title="Edit User">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="adminDashboard.viewUser(${user.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="adminDashboard.suspendUser(${user.id})" title="Suspend User">
                            <i class="fas fa-ban"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async filterClinics() {
        const searchTerm = document.getElementById('clinicSearch').value.toLowerCase();
        const statusFilter = document.getElementById('clinicStatusFilter').value;

        let filteredClinics = [...this.clinics];

        if (searchTerm) {
            filteredClinics = filteredClinics.filter(clinic => 
                clinic.name.toLowerCase().includes(searchTerm) ||
                clinic.address.toLowerCase().includes(searchTerm) ||
                clinic.email.toLowerCase().includes(searchTerm)
            );
        }

        if (statusFilter && statusFilter !== 'all') {
            filteredClinics = filteredClinics.filter(clinic => clinic.status === statusFilter);
        }

        // Update display with filtered clinics
        const container = document.getElementById('clinicsGrid');
        if (!container) return;

        container.innerHTML = filteredClinics.map(clinic => `
            <div class="clinic-card">
                <div class="clinic-header">
                    <div class="clinic-info">
                        <h3>${clinic.name}</h3>
                        <p>${clinic.address}</p>
                    </div>
                    <span class="clinic-status ${clinic.status}">${clinic.status}</span>
                </div>
                <div class="clinic-details">
                    <div class="detail-item">
                        <i class="fas fa-phone"></i>
                        <span>${clinic.phone}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-envelope"></i>
                        <span>${clinic.email}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-users"></i>
                        <span>Capacity: ${clinic.currentLoad}/${clinic.capacity}</span>
                    </div>
                </div>
                <div class="clinic-actions">
                    <button class="btn btn-sm btn-outline" onclick="adminDashboard.editClinic(${clinic.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="adminDashboard.viewClinicStats(${clinic.id})">
                        <i class="fas fa-chart-bar"></i> Stats
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="adminDashboard.manageClinicStaff(${clinic.id})">
                        <i class="fas fa-user-md"></i> Staff
                    </button>
                </div>
            </div>
        `).join('');
    }

    // User Management Functions
    async createUser() {
        try {
            const formData = new FormData(document.getElementById('addUserForm'));
            const userData = Object.fromEntries(formData.entries());

            // Validate data
            if (!this.validateUserData(userData)) {
                return;
            }

            // Simulate API call
            await this.simulateApiCall('/admin/users', {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            // Add to local array for demo
            const newUser = {
                id: this.users.length + 1,
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                phone: userData.phone,
                role: userData.role,
                status: 'active',
                registered: new Date().toISOString().split('T')[0]
            };

            this.users.push(newUser);
            this.displayUsersTable();

            // Close modal and show success
            this.closeModal('addUserModal');
            this.showNotification('User created successfully', 'success');

        } catch (error) {
            console.error('Error creating user:', error);
            this.showNotification('Error creating user', 'error');
        }
    }

    validateUserData(userData) {
        const required = ['firstName', 'lastName', 'email', 'phone', 'role', 'idNumber'];
        
        for (const field of required) {
            if (!userData[field] || userData[field].trim() === '') {
                this.showNotification(`${field} is required`, 'error');
                return false;
            }
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return false;
        }

        // Phone validation (basic)
        const phoneRegex = /^\+27\d{9}$/;
        if (!phoneRegex.test(userData.phone.replace(/\s/g, ''))) {
            this.showNotification('Please enter a valid South African phone number (+27xxxxxxxxx)', 'error');
            return false;
        }

        return true;
    }

    // Action functions
    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            // In a real app, this would open an edit modal
            this.showNotification(`Edit user: ${user.firstName} ${user.lastName}`, 'info');
        }
    }

    viewUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            this.showNotification(`View user details: ${user.firstName} ${user.lastName}`, 'info');
        }
    }

    async suspendUser(userId) {
        if (!confirm('Are you sure you want to suspend this user?')) {
            return;
        }

        try {
            await this.simulateApiCall(`/admin/users/${userId}/suspend`, {
                method: 'POST'
            });

            // Update local data
            const user = this.users.find(u => u.id === userId);
            if (user) {
                user.status = user.status === 'suspended' ? 'active' : 'suspended';
                this.displayUsersTable();
                this.showNotification(`User ${user.status === 'suspended' ? 'suspended' : 'activated'} successfully`, 'success');
            }
        } catch (error) {
            console.error('Error suspending user:', error);
            this.showNotification('Error updating user status', 'error');
        }
    }

    editClinic(clinicId) {
        const clinic = this.clinics.find(c => c.id === clinicId);
        if (clinic) {
            this.showNotification(`Edit clinic: ${clinic.name}`, 'info');
        }
    }

    viewClinicStats(clinicId) {
        const clinic = this.clinics.find(c => c.id === clinicId);
        if (clinic) {
            this.showNotification(`View stats for: ${clinic.name}`, 'info');
        }
    }

    manageClinicStaff(clinicId) {
        const clinic = this.clinics.find(c => c.id === clinicId);
        if (clinic) {
            this.showNotification(`Manage staff for: ${clinic.name}`, 'info');
        }
    }

    dismissAlert(alertId) {
        this.alerts = this.alerts.filter(alert => alert.id !== alertId);
        this.displaySystemAlerts();
    }

    // Reports Functions
    async generateReport() {
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;

        if (!startDate || !endDate) {
            this.showNotification('Please select both start and end dates', 'error');
            return;
        }

        try {
            // Show loading
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = 'Generating...';
            button.disabled = true;

            // Simulate API call
            await this.simulateApiCall('/admin/reports/generate', {
                method: 'POST',
                body: JSON.stringify({ startDate, endDate })
            });

            // Update charts and summary
            this.updateReportCharts();
            this.updateReportSummary();

            this.showNotification('Report generated successfully', 'success');

        } catch (error) {
            console.error('Error generating report:', error);
            this.showNotification('Error generating report', 'error');
        } finally {
            const button = document.querySelector('[onclick="generateReport()"]');
            if (button) {
                button.textContent = 'Generate Report';
                button.disabled = false;
            }
        }
    }

    updateReportCharts() {
        // In a real app, this would update chart libraries like Chart.js
        const charts = ['appointmentChart', 'userGrowthChart', 'clinicPerformanceChart', 'noShowChart'];
        
        charts.forEach(chartId => {
            const element = document.getElementById(chartId);
            if (element) {
                element.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);">
                        <i class="fas fa-chart-area" style="font-size: 2rem; margin-right: 1rem;"></i>
                        <span>Chart data updated</span>
                    </div>
                `;
            }
        });
    }

    updateReportSummary() {
        const container = document.getElementById('reportSummaryMetrics');
        if (container) {
            container.innerHTML = `
                <div class="summary-metric">
                    <div class="metric-value">1,247</div>
                    <div class="metric-label">Total Users</div>
                </div>
                <div class="summary-metric">
                    <div class="metric-value">8,456</div>
                    <div class="metric-label">Total Appointments</div>
                </div>
                <div class="summary-metric">
                    <div class="metric-value">94.2%</div>
                    <div class="metric-label">Attendance Rate</div>
                </div>
                <div class="summary-metric">
                    <div class="metric-value">4.6/5</div>
                    <div class="metric-label">Avg. Rating</div>
                </div>
            `;
        }
    }

    // Settings Functions
    async saveSettings() {
        try {
            const settings = this.collectSettingsData();
            
            // Show loading
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = 'Saving...';
            button.disabled = true;

            // Simulate API call
            await this.simulateApiCall('/admin/settings', {
                method: 'PUT',
                body: JSON.stringify(settings)
            });

            this.showNotification('Settings saved successfully', 'success');

        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Error saving settings', 'error');
        } finally {
            const button = document.querySelector('[onclick="saveSettings()"]');
            if (button) {
                button.textContent = 'Save Settings';
                button.disabled = false;
            }
        }
    }

    collectSettingsData() {
        const settings = {};
        
        // Collect all form inputs from settings tabs
        document.querySelectorAll('.settings-tab input, .settings-tab select').forEach(input => {
            if (input.type === 'checkbox') {
                settings[input.id] = input.checked;
            } else {
                settings[input.id] = input.value;
            }
        });

        return settings;
    }

    async resetSettings() {
        if (!confirm('Are you sure you want to reset all settings to defaults?')) {
            return;
        }

        try {
            await this.simulateApiCall('/admin/settings/reset', {
                method: 'POST'
            });

            // Reset all form inputs to defaults
            this.loadDefaultSettings();
            this.showNotification('Settings reset to defaults', 'success');

        } catch (error) {
            console.error('Error resetting settings:', error);
            this.showNotification('Error resetting settings', 'error');
        }
    }

    loadDefaultSettings() {
        // Reset form inputs to default values
        const defaults = {
            systemName: 'ClinicBook',
            timeZone: 'Africa/Johannesburg',
            maxAppointments: 50,
            enableSMS: true,
            enableEmail: true,
            reminderTime: 24,
            sessionTimeout: 30,
            passwordPolicy: 'medium',
            autoBackup: true,
            backupFrequency: 'daily'
        };

        Object.keys(defaults).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = defaults[key];
                } else {
                    element.value = defaults[key];
                }
            }
        });
    }

    async performManualBackup() {
        try {
            const button = event.target;
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Backing up...';
            button.disabled = true;

            await this.simulateApiCall('/admin/backup/manual', {
                method: 'POST'
            });

            this.showNotification('Manual backup completed successfully', 'success');

        } catch (error) {
            console.error('Error performing backup:', error);
            this.showNotification('Error performing backup', 'error');
        } finally {
            const button = document.querySelector('[onclick="performManualBackup()"]');
            if (button) {
                button.innerHTML = '<i class="fas fa-download"></i> Manual Backup';
                button.disabled = false;
            }
        }
    }

    // Utility Functions
    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    timeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }

    getAlertIcon(severity) {
        const icons = {
            info: 'fa-info-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-exclamation-circle'
        };
        return icons[severity] || 'fa-info-circle';
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
            }, 1000 + Math.random() * 1000);
        });
    }

    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    closeModal(modalId) {
        if (window.closeModal) {
            window.closeModal(modalId);
        }
    }

    startRealTimeUpdates() {
        // Update system stats every 30 seconds
        setInterval(() => {
            if (this.currentSection === 'dashboard') {
                this.loadSystemStats();
                this.loadRecentActivity();
                this.loadSystemAlerts();
            }
        }, 30000);

        // Update user data every 60 seconds if on users section
        setInterval(() => {
            if (this.currentSection === 'users') {
                this.loadUsersData();
            }
        }, 60000);
    }

    // Placeholder functions for missing section data
    async loadDashboardData() {
        // Dashboard data already loaded in loadInitialData
        console.log('Dashboard data loaded');
    }

    async loadStaffData() {
        console.log('Loading staff data...');
    }

    async loadAppointmentsOverview() {
        console.log('Loading appointments overview...');
    }

    async loadReportsData() {
        console.log('Loading reports data...');
    }

    async loadNotificationsData() {
        console.log('Loading notifications data...');
    }

    async loadSettingsData() {
        this.loadDefaultSettings();
    }

    async exportUsers() {
        this.showNotification('User export functionality would be implemented here', 'info');
    }

    async broadcastMessage() {
        this.showNotification('Broadcast message functionality would be implemented here', 'info');
    }
}

// Global functions for HTML onclick events
window.showSection = function(sectionName) {
    if (window.adminDashboard) {
        window.adminDashboard.showSection(sectionName);
    }
};

window.showSettingsTab = function(tabName) {
    if (window.adminDashboard) {
        window.adminDashboard.showSettingsTab(tabName);
    }
};

window.generateReport = function() {
    if (window.adminDashboard) {
        window.adminDashboard.generateReport();
    }
};

window.saveSettings = function() {
    if (window.adminDashboard) {
        window.adminDashboard.saveSettings();
    }
};

window.resetSettings = function() {
    if (window.adminDashboard) {
        window.adminDashboard.resetSettings();
    }
};

window.performManualBackup = function() {
    if (window.adminDashboard) {
        window.adminDashboard.performManualBackup();
    }
};

window.exportUsers = function() {
    if (window.adminDashboard) {
        window.adminDashboard.exportUsers();
    }
};

window.broadcastMessage = function() {
    if (window.adminDashboard) {
        window.adminDashboard.broadcastMessage();
    }
};

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.body.classList.contains('admin-dashboard') || 
        window.location.pathname.includes('admin-dashboard')) {
        window.adminDashboard = new AdminDashboard();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminDashboard;
}