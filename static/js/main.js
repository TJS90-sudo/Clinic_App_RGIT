// Main Application JavaScript

// Global Variables
let currentUser = null;
let currentLanguage = 'en';

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize Application
function initializeApp() {
    // Load user preferences and set language first
    loadUserPreferences();

    // Initialize components
    initializeNavigation();
    initializeModals();
    initializeLanguageSelector();
    initializeForms();
    initializeScrollEffects();

    // Check authentication status
    checkAuthStatus();

    // Ensure translations are applied after language and selector are set
    updateTranslations();
    if (typeof Translations !== 'undefined' && typeof Translations.updateDocumentDirection === 'function') {
        Translations.updateDocumentDirection(currentLanguage);
    }

    console.log('ClinicBook application initialized successfully');
}

// Navigation Functions
function initializeNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navActions = document.querySelector('.nav-actions');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            if (navActions) {
                navActions.classList.toggle('active');
            }
        });
    }
    
    // Close mobile menu when clicking nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (navMenu.classList.contains('active')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                if (navActions) {
                    navActions.classList.remove('active');
                }
            }
        });
    });
    
    // Smooth scrolling for anchor links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                scrollToSection(targetId);
            }
        });
    });
}

// Modal Functions
function initializeModals() {
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                closeModal(openModal.id);
            }
        }
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus management
        const firstInput = modal.querySelector('input, select, textarea, button');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function switchModal(currentModalId, newModalId) {
    closeModal(currentModalId);
    setTimeout(() => openModal(newModalId), 200);
}

// Language Functions
function initializeLanguageSelector() {
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        // Add accessibility attributes
        languageSelect.setAttribute('aria-label', 'Select language');
        languageSelect.setAttribute('title', 'Select language');
        
        languageSelect.addEventListener('change', function() {
            changeLanguage(this.value);
        });
    }
}

function changeLanguage(language) {
    currentLanguage = language;
    localStorage.setItem('preferredLanguage', language);
    
    // Update all translatable elements
    updateTranslations();
    
    // Update language selector
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = language;
    }
    
    console.log(`Language changed to: ${language}`);
}

function updateTranslations() {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        const translation = getTranslation(key, currentLanguage);
        if (translation) {
            if (element.tagName === 'INPUT' && element.type === 'submit') {
                element.value = translation;
            } else {
                element.textContent = translation;
            }
        }
    });
}

// Form Functions
function initializeForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Form validation
    initializeFormValidation();
}

function initializeFormValidation() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', validateInput);
            input.addEventListener('input', clearValidationError);
        });
    });
}

function validateInput(e) {
    const input = e.target;
    const value = input.value.trim();
    const type = input.type;
    const name = input.name;
    
    let isValid = true;
    let errorMessage = '';
    
    // Required field validation
    if (input.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = getTranslation('validation.required', currentLanguage) || 'This field is required';
    }
    
    // Email validation
    if (type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = getTranslation('validation.email', currentLanguage) || 'Please enter a valid email address';
        }
    }
    
    // Phone number validation (South African format)
    if (name === 'phone' && value) {
        const phoneRegex = /^(27)[0-9]{9}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
            isValid = false;
            errorMessage = getTranslation('validation.phone', currentLanguage) || 'Please enter a valid South African phone number';
        }
    }
    
    // ID Number validation (South African format)
    if (name === 'idNumber' && value) {
        const idRegex = /^[0-9]{13}$/;
        if (!idRegex.test(value)) {
            isValid = false;
            errorMessage = getTranslation('validation.idNumber', currentLanguage) || 'Please enter a valid 13-digit ID number';
        }
    }
    
    // Password validation
    if (type === 'password' && value) {
        if (value.length < 8) {
            isValid = false;
            errorMessage = getTranslation('validation.passwordLength', currentLanguage) || 'Password must be at least 8 characters long';
        }
    }
    
    // Confirm password validation
    if (name === 'confirmPassword' && value) {
        const passwordInput = document.getElementById('registerPassword');
        if (passwordInput && value !== passwordInput.value) {
            isValid = false;
            errorMessage = getTranslation('validation.passwordMatch', currentLanguage) || 'Passwords do not match';
        }
    }
    
    // Display validation result
    if (isValid) {
        showInputSuccess(input);
    } else {
        showInputError(input, errorMessage);
    }
    
    return isValid;
}

function showInputError(input, message) {
    clearValidationError(input);
    
    input.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'input-error';
    errorDiv.textContent = message;
    errorDiv.style.color = 'var(--error-color, #ef4444)';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '0.25rem';
    
    input.parentNode.appendChild(errorDiv);
}

function showInputSuccess(input) {
    clearValidationError(input);
    input.classList.add('success');
}

function clearValidationError(input) {
    if (typeof input === 'object' && input.target) {
        input = input.target;
    }
    
    input.classList.remove('error', 'success');
    const errorDiv = input.parentNode.querySelector('.input-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Authentication Functions
function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password'),
        rememberMe: formData.get('rememberMe') === 'on'
    };

    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = getTranslation('common.loading', currentLanguage) || 'Loading...';
    submitButton.disabled = true;
    submitButton.classList.add('loading');

    // Send login data to backend
    fetch('/auth/login', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
        },
        body: formData
    })
    .then(async response => {
        // Reset button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        submitButton.classList.remove('loading');

        if (response.ok) {
            // Expecting JSON with success and redirect info
            const data = await response.json();
            if (data.success) {
                closeModal('loginModal');
                showNotification(getTranslation('login.success', currentLanguage) || 'Login successful!', 'success');
                // Redirect to dashboard or update UI
                if (data.redirect) {
                    window.location.href = data.redirect;
                } else {
                    updateUIForLoggedInUser();
                }
            } else {
                showNotification(data.message || getTranslation('login.error', currentLanguage) || 'Invalid email or password', 'error');
            }
        } else {
            // Handle error
            let msg = 'Login failed. Please try again.';
            try {
                const err = await response.json();
                if (err.message) msg = err.message;
            } catch {}
            showNotification(msg, 'error');
        }
    })
    .catch(error => {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        showNotification('Network error. Please try again.', 'error');
        console.error('Login error:', error);
    });
}

function handleRegister(e) {
    e.preventDefault();
    
    const form = e.target;
    const inputs = form.querySelectorAll('input');
    let isFormValid = true;
    
    // Validate all inputs
    inputs.forEach(input => {
        if (!validateInput({ target: input })) {
            isFormValid = false;
        }
    });
    
    if (!isFormValid) {
        showNotification(getTranslation('register.validationError', currentLanguage) || 'Please fix the errors below', 'error');
        return;
    }
    
    const formData = new FormData(form);
    const registerData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        idNumber: formData.get('idNumber'),
        password: formData.get('password')
    };
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = getTranslation('common.loading', currentLanguage) || 'Creating Account...';
    submitButton.disabled = true;
    submitButton.classList.add('loading');
    
    // Simulate API call
    setTimeout(() => {
        // Reset button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        
        // Simulate successful registration
        if (simulateRegister(registerData)) {
            closeModal('registerModal');
            showNotification(getTranslation('register.success', currentLanguage) || 'Account created successfully!', 'success');
            // Auto-login after registration
            currentUser = registerData;
            updateUIForLoggedInUser();
        } else {
            showNotification(getTranslation('register.error', currentLanguage) || 'Registration failed. Please try again.', 'error');
        }
    }, 2000);
}

function simulateLogin(loginData) {
    // Simulate authentication logic
    const validCredentials = [
        { 
            email: 'patient@clinic.com', 
            password: 'password123', 
            role: 'patient',
            firstName: 'John',
            lastName: 'Patient',
            phone: '+27821234567',
            id: '1001'
        },
        { 
            email: 'staff@clinic.com', 
            password: 'staff123', 
            role: 'staff',
            firstName: 'Jane',
            lastName: 'Staff',
            phone: '+27827654321',
            id: '2001'
        },
        { 
            email: 'admin@clinic.com', 
            password: 'admin123', 
            role: 'admin',
            firstName: 'Admin',
            lastName: 'User',
            phone: '+27829876543',
            id: '3001'
        }
    ];
    
    const user = validCredentials.find(cred => 
        cred.email === loginData.email && cred.password === loginData.password
    );
    
    if (user) {
        currentUser = { 
            ...user, 
            rememberMe: loginData.rememberMe,
            loginTime: new Date().toISOString()
        };
        
        // Use Auth module to properly set user data
        if (window.Auth) {
            window.Auth.setCurrentUser(currentUser);
            window.Auth.setToken('mock_token_' + Date.now());
        } else {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('authToken', 'mock_token_' + Date.now());
        }
        
        return true;
    }
    
    return false;
}

function simulateRegister(registerData) {
    // Simulate registration logic
    currentUser = {
        ...registerData,
        role: 'patient',
        id: Date.now(),
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    return true;
}

function checkAuthStatus() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            updateUIForLoggedInUser();
        } catch (error) {
            console.error('Error parsing stored user data:', error);
            localStorage.removeItem('currentUser');
        }
    }
}

function updateUIForLoggedInUser() {
    if (!currentUser) return;
    // Update username in dropdown (patient dashboard)
    const userNameSpan = document.getElementById('userName');
    if (userNameSpan) {
        userNameSpan.textContent = currentUser.firstName || currentUser.email || 'User';
    }
    // Update navigation (other pages)
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
        navActions.innerHTML = `
            <div class="user-menu">
                <span class="user-greeting">Hello, ${currentUser.firstName || currentUser.email}</span>
                <button class="btn btn-outline" onclick="navigateToDashboard()">Dashboard</button>
                <button class="btn btn-primary" onclick="logout()">Logout</button>
            </div>
        `;
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    
    // Reset navigation
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
        navActions.innerHTML = `
            <button class="btn btn-outline" onclick="openModal('loginModal')">Login</button>
            <button class="btn btn-primary" onclick="openModal('registerModal')">Register</button>
        `;
    }
    
    showNotification(getTranslation('logout.success', currentLanguage) || 'Logged out successfully', 'success');
}

// Utility Functions
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = section.offsetTop - headerHeight - 20;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

function initializeScrollEffects() {
    // Header scroll effect
    const header = document.querySelector('.header');
    let lastScroll = 0;
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Hide/show header on scroll
        if (currentScroll > lastScroll && currentScroll > 200) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        lastScroll = currentScroll;
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentNode.parentNode.remove()">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: var(--shadow-lg);
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function loadUserPreferences() {
    // Load language preference
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
        changeLanguage(savedLanguage);
    }
    
    // Load theme preference
    const savedTheme = localStorage.getItem('preferredTheme');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
    }
}

function navigateToDashboard() {
    if (!currentUser) {
        openModal('loginModal');
        return;
    }
    
    // Navigate based on user role
    switch (currentUser.role) {
        case 'patient':
            window.location.href = 'pages/patient-dashboard.html';
            break;
        case 'staff':
            window.location.href = 'pages/staff-dashboard.html';
            break;
        case 'admin':
            window.location.href = 'pages/admin-dashboard.html';
            break;
        default:
            window.location.href = 'pages/patient-dashboard.html';
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .header.scrolled {
        background-color: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    }
    
    .header {
        transition: var(--transition);
    }
    
    .user-menu {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .user-greeting {
        color: var(--text-primary);
        font-weight: 500;
    }
    
    .form-group input.error {
        border-color: #ef4444;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
    
    .form-group input.success {
        border-color: #10b981;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }
`;
document.head.appendChild(style);

// Test functions for development
function testAdminLogin() {
    const loginData = {
        email: 'admin@clinic.com',
        password: 'admin123',
        rememberMe: false
    };
    
    if (simulateLogin(loginData)) {
        showNotification('Receptionist login successful! Redirecting to receptionist dashboard...', 'success');
        setTimeout(() => {
            window.location.href = 'pages/receptionist-dashboard.html';
        }, 1500);
    }
}

function testStaffLogin() {
    const loginData = {
        email: 'staff@clinic.com',
        password: 'staff123',
        rememberMe: false
    };
    
    if (simulateLogin(loginData)) {
        showNotification('Staff login successful! Redirecting to staff dashboard...', 'success');
        setTimeout(() => {
            window.location.href = 'pages/staff-dashboard.html';
        }, 1500);
    }
}

function testPatientLogin() {
    const loginData = {
        email: 'patient@clinic.com',
        password: 'password123',
        rememberMe: false
    };
    
    if (simulateLogin(loginData)) {
        showNotification('Patient login successful! Redirecting to patient dashboard...', 'success');
        setTimeout(() => {
            window.location.href = 'pages/patient-dashboard.html';
        }, 1500);
    }
}

// Export functions for global access
window.ClinicBook = {
    openModal,
    closeModal,
    switchModal,
    changeLanguage,
    scrollToSection,
    navigateToDashboard,
    logout
};

// Export test functions globally
window.testAdminLogin = testAdminLogin;
window.testStaffLogin = testStaffLogin;
window.testPatientLogin = testPatientLogin;