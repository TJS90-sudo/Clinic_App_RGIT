// Multi-language Support Module
const Translations = {
    // Translation data
    data: {
        en: {
            'booking.step1': 'Step 1: Select Doctor',
            // Dashboard
            'dashboard.welcome': 'Welcome',
            'dashboard.profile': 'Profile',
            'dashboard.settings': 'Settings',
            'dashboard.logout': 'Logout',
                // Booking Form
                'booking.title': 'Book New Appointment',
                'booking.subtitle': 'Fill in the details below to book your clinic appointment.',
                'booking.patientName': 'Patient Name',
                'booking.date': 'Date',
                'booking.time': 'Time',
                'booking.clinic': 'Clinic',
                'booking.doctor': 'Doctor',
                'booking.reason': 'Reason for Visit',
                'booking.submit': 'Book Appointment',
                'booking.success': 'Appointment booked successfully!',
                'booking.error': 'Failed to book appointment. Please try again.',
                'booking.validationError': 'Please fill in all required fields.',

            // Appointments Dashboard
            'appointments.dashboardTitle': 'Appointments Dashboard',
            'appointments.dashboardDesc': 'Here you can view, manage, reschedule, or cancel your clinic appointments in real time.',
            'appointments.filterStatus': 'Filter by Status:',
            'appointments.filterDate': 'Filter by Date:',
            'appointments.all': 'All',
            'appointments.upcoming': 'Upcoming',
            'appointments.completed': 'Completed',
            'appointments.cancelled': 'Cancelled',
            'appointments.date': 'Date',
            'appointments.time': 'Time',
            'appointments.doctor': 'Doctor',
            'appointments.clinic': 'Clinic',
            'appointments.status': 'Status',
            'appointments.actions': 'Actions',
            'appointments.none': 'No appointments found.',
            // Navigation
            'nav.home': 'Home',
            'nav.services': 'Services',
            'nav.about': 'About',
            'nav.contact': 'Contact',
            // Hero Section
            'hero.title': 'Book Your Clinic Appointment Online',
            'hero.subtitle': 'Skip the queues, save your time. Book, reschedule, or cancel appointments from anywhere in South Africa.',
            'hero.bookNow': 'Book Appointment Now',
            'hero.learnMore': 'Learn More',
            'hero.quickBook': 'Quick Booking',
            'hero.quickBookDesc': 'Schedule appointments in under 2 minutes',
            'hero.smsSupport': 'SMS Support',
            'hero.smsSupportDesc': 'Works on any phone, smartphone not required',
            'hero.reminders': 'Smart Reminders',
            'hero.remindersDesc': 'Never miss an appointment with automated alerts',
            // Services Section
            'services.title': 'Our Services',
            'services.subtitle': 'Comprehensive healthcare appointment management for all',
            'services.patientReg': 'Patient Registration',
            'services.patientRegDesc': 'Quick and secure registration process with ID verification',
            'services.appointment': 'Appointment Booking',
            'services.appointmentDesc': 'Book, reschedule, or cancel appointments 24/7',
            'services.queue': 'Real-time Queue',
            'services.queueDesc': 'Track your position in the queue and estimated wait times',
            'services.sms': 'SMS Booking',
            'services.smsDesc': 'Book appointments via SMS for basic phone users',
            'services.notifications': 'Smart Notifications',
            'services.notificationsDesc': 'Automated reminders via SMS and email',
            'services.security': 'POPIA Compliant',
            'services.securityDesc': 'Your data is secure and protected by law',
            // Stats Section
            'stats.users': 'Active Users',
            'stats.uptime': 'System Uptime',
            'stats.response': 'Response Time',
            'stats.available': 'Available',
            // Footer
            'footer.description': 'Streamlining healthcare access across South Africa with digital appointment booking.',
            'footer.quickLinks': 'Quick Links',
            'footer.home': 'Home',
            'footer.services': 'Services',
            'footer.about': 'About',
            'footer.contact': 'Contact',
            'footer.support': 'Support',
            'footer.help': 'Help Center',
            'footer.privacy': 'Privacy Policy',
            'footer.terms': 'Terms of Service',
            // Login Modal
            'login.title': 'Login to Your Account',
            'login.email': 'Email Address',
            'login.password': 'Password',
            'login.remember': 'Remember me',
            'login.signin': 'Sign In',
            'login.forgot': 'Forgot your password?',
            'login.noAccount': "Don't have an account?",
            'login.signup': 'Sign up here',
            'login.success': 'Login successful!',
            'login.error': 'Invalid email or password',
            // Register Modal
            'register.title': 'Create Your Account',
            'register.firstName': 'First Name',
            'register.lastName': 'Last Name',
            'register.email': 'Email Address',
            'register.phone': 'Phone Number',
            'register.idNumber': 'ID Number',
            'register.password': 'Password',
            'register.confirmPassword': 'Confirm Password',
            'register.terms': 'I agree to the Terms of Service and Privacy Policy',
            'register.create': 'Create Account',
            'register.hasAccount': 'Already have an account?',
            'register.signin': 'Sign in here',
            'register.success': 'Account created successfully!',
            'register.error': 'Registration failed. Please try again.',
            'register.validationError': 'Please fix the errors below',
            // New fields
            'register.dateOfBirth': 'Date of Birth',
            'register.gender': 'Gender',
            'register.gender.male': 'Male',
            'register.gender.female': 'Female',
            'register.address': 'Address',
            // Common
            'common.loading': 'Loading...',
            'common.save': 'Save',
            'common.cancel': 'Cancel',
            'common.submit': 'Submit',
            'common.close': 'Close',
            'common.yes': 'Yes',
            'common.no': 'No',
            // Validation
            'validation.required': 'This field is required',
            'validation.email': 'Please enter a valid email address',
            'validation.phone': 'Please enter a valid South African phone number',
            'validation.idNumber': 'Please enter a valid 13-digit ID number',
            'validation.passwordLength': 'Password must be at least 8 characters long',
            'validation.passwordMatch': 'Passwords do not match',
            // Logout
            'logout.success': 'Logged out successfully'
        },
        zu: {
            'booking.step1': 'Isinyathelo 1: Khetha Udokotela',
            'dashboard.welcome': 'Siyakwamukela',
            'dashboard.profile': 'Iphrofayela',
            'dashboard.settings': 'Izilungiselelo',
            'dashboard.logout': 'Phuma',
            'appointments.dashboardTitle': 'Ideshibhodi Yokubhuka',
            'appointments.dashboardDesc': 'Lapha ungabuka, uphathe, uhlela kabusha, noma ukhansela izikhathi zakho zesibhedlela ngesikhathi sangempela.',
            'appointments.filterStatus': 'Hlunga ngesimo:',
            'appointments.filterDate': 'Hlunga ngosuku:',
            'appointments.all': 'Konke',
            'appointments.upcoming': 'Ezizayo',
            'appointments.completed': 'Kuqediwe',
            'appointments.cancelled': 'Kukhanseliwe',
            'appointments.date': 'Usuku',
            'appointments.time': 'Isikhathi',
            'appointments.doctor': 'Udokotela',
            'appointments.clinic': 'Isibhedlela',
            'appointments.status': 'Isimo',
            'appointments.actions': 'Izenzo',
            'appointments.none': 'Azikho izikhathi ezitholakele.',
            // Booking Form
            'booking.title': 'Bhuka Ukuvakashela Okusha',
            'booking.subtitle': 'Gcwalisa imininingwane engezansi ukuze ubhuke ukuvakashela kwakho esibhedlela.',
            'booking.patientName': 'Igama Lomguli',
            'booking.date': 'Usuku',
            'booking.time': 'Isikhathi',
            'booking.clinic': 'Isibhedlela',
            'booking.doctor': 'Udokotela',
            'booking.reason': 'Isizathu Sokuvakashela',
            'booking.submit': 'Bhuka Ukuvakashela',
            'booking.success': 'Ukuvakashela kubhukwe ngempumelelo!',
            'booking.error': 'Ukubhuka kwehlulekile. Zama futhi.',
            'booking.validationError': 'Sicela ugcwalise zonke izinkambu ezidingekayo.',
        },
        af: {
            'booking.step1': 'Stap 1: Kies Dokter',
            'dashboard.welcome': 'Welkom',
            'dashboard.profile': 'Profiel',
            'dashboard.settings': 'Instellings',
            'dashboard.logout': 'Teken uit',
            'appointments.dashboardTitle': 'Afsprakepaneelbord',
            'appointments.dashboardDesc': 'Hier kan jy jou kliniekafsprake in reële tyd besigtig, bestuur, herskeduleer of kanselleer.',
            'appointments.filterStatus': 'Filtreer volgens status:',
            'appointments.filterDate': 'Filtreer volgens datum:',
            'appointments.all': 'Alle',
            'appointments.upcoming': 'Opkomend',
            'appointments.completed': 'Voltooi',
            'appointments.cancelled': 'Gekanselleer',
            'appointments.date': 'Datum',
            'appointments.time': 'Tyd',
            'appointments.doctor': 'Dokter',
            'appointments.clinic': 'Kliniek',
            'appointments.status': 'Status',
            'appointments.actions': 'Aksies',
            'appointments.none': 'Geen afsprake gevind nie.'
            ,// Booking Form
            'booking.title': 'Boek Nuwe Afspraak',
            'booking.subtitle': 'Vul die besonderhede hieronder in om jou kliniekafspraak te bespreek.',
            'booking.patientName': 'Pasiënt Naam',
            'booking.date': 'Datum',
            'booking.time': 'Tyd',
            'booking.clinic': 'Kliniek',
            'booking.doctor': 'Dokter',
            'booking.reason': 'Rede vir Besoek',
            'booking.submit': 'Boek Afspraak',
            'booking.success': 'Afspraak suksesvol bespreek!',
            'booking.error': 'Kon nie afspraak bespreek nie. Probeer asseblief weer.',
            'booking.validationError': 'Vul asseblief alle vereiste velde in.',
        }
    },
    
    // Set translation for a key
    set(key, translations) {
        Object.keys(translations).forEach(lang => {
            if (!this.data[lang]) {
                this.data[lang] = {};
            }
            this.data[lang][key] = translations[lang];
        });
    },
    
    // Add multiple translations
    addTranslations(translations) {
        Object.keys(translations).forEach(lang => {
            if (!this.data[lang]) {
                this.data[lang] = {};
            }
            Object.assign(this.data[lang], translations[lang]);
        });
    },
    
    // Get supported languages
    getSupportedLanguages() {
        return Object.keys(this.data);
    },
    
    // Check if language is supported
    isLanguageSupported(language) {
        return this.data.hasOwnProperty(language);
    },
    
    // Get language name in native script
    getLanguageName(code) {
        const names = {
            'en': 'English',
            'zu': 'isiZulu',
            'af': 'Afrikaans'
        };
        return names[code] || code;
    },
    
    // Format number for current locale
    formatNumber(number, language = 'en') {
        const locales = {
            'en': 'en-ZA',
            'zu': 'zu-ZA',
            'af': 'af-ZA'
        };
        
        try {
            return new Intl.NumberFormat(locales[language] || 'en-ZA').format(number);
        } catch (error) {
            return number.toString();
        }
    },
    
    // Format date for current locale
    formatDate(date, language = 'en', options = {}) {
        const locales = {
            'en': 'en-ZA',
            'zu': 'zu-ZA',
            'af': 'af-ZA'
        };
        
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        try {
            return new Intl.DateTimeFormat(
                locales[language] || 'en-ZA',
                { ...defaultOptions, ...options }
            ).format(new Date(date));
        } catch (error) {
            return new Date(date).toLocaleDateString();
        }
    },
    
    // Format time for current locale
    formatTime(time, language = 'en', options = {}) {
        const locales = {
            'en': 'en-ZA',
            'zu': 'zu-ZA',
            'af': 'af-ZA'
        };
        
        const defaultOptions = {
            hour: '2-digit',
            minute: '2-digit'
        };
        
        try {
            return new Intl.DateTimeFormat(
                locales[language] || 'en-ZA',
                { ...defaultOptions, ...options }
            ).format(new Date(time));
        } catch (error) {
            return new Date(time).toLocaleTimeString();
        }
    },
    
    // Get text direction for language
    getTextDirection(language = 'en') {
        // All supported languages use left-to-right
        return 'ltr';
    },
    
    // Update document direction
    updateDocumentDirection(language = 'en') {
        document.documentElement.setAttribute('dir', this.getTextDirection(language));
        document.documentElement.setAttribute('lang', language);
    },
    
    // Pluralization helper
    pluralize(count, singular, plural = null, language = 'en') {
        if (plural === null) {
            plural = singular + 's'; // Simple English pluralization
        }
        
        // Simple pluralization rules for supported languages
        switch (language) {
            case 'en':
                return count === 1 ? singular : plural;
            case 'zu':
            case 'af':
                // Simplified - would need proper pluralization rules
                return count === 1 ? singular : plural;
            default:
                return count === 1 ? singular : plural;
        }
    }
};

// Global translation function
function getTranslation(key, language = null) {
    const lang = language || window.currentLanguage || 'en';
    // Try current language
    if (Translations.data[lang] && Translations.data[lang][key]) {
        return Translations.data[lang][key];
    }
    // Fallback to English
    if (lang !== 'en' && Translations.data.en && Translations.data.en[key]) {
        return Translations.data.en[key];
    }
    // Fallback to key
    return key;
}

// Alias for shorter usage
const t = getTranslation;

// Initialize translations
document.addEventListener('DOMContentLoaded', function() {
    // Set initial language
    const savedLanguage = localStorage.getItem('preferredLanguage') || 'en';
    if (window.changeLanguage) {
        window.changeLanguage(savedLanguage);
    }
});

// Export translations module
window.Translations = Translations;
window.getTranslation = getTranslation;
window.t = t;