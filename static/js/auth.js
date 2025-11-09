// Handle Login Form Submission
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const res = await fetch('http://localhost:5000/auth/login', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            if (res.redirected) {
                window.location.href = res.url;
            } else {
                const text = await res.text();
                alert(text);
            }
        });
    }
});

// Authentication Module
const Auth = {
    // API Configuration
    API_BASE_URL: 'http://localhost:8000/api', // Django backend URL
    
    // Token management
    getToken() {
        return localStorage.getItem('authToken');
    },
    
    setToken(token) {
        localStorage.setItem('authToken', token);
    },
    
    removeToken() {
        localStorage.removeItem('authToken');
    },
    
    // API request helper
    async apiRequest(endpoint, options = {}) {
        const url = `${this.API_BASE_URL}${endpoint}`;
        const token = this.getToken();
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };
        
        const requestOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, requestOptions);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },
    
    // Registration
    async register(userData) {
        try {
            const response = await this.apiRequest('/auth/register/', {
                method: 'POST',
                body: JSON.stringify({
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    email: userData.email,
                    phone_number: userData.phone,
                    id_number: userData.idNumber,
                    password: userData.password,
                    password_confirm: userData.confirmPassword
                })
            });
            
            if (response.token) {
                this.setToken(response.token);
                this.setCurrentUser(response.user);
            }
            
            return response;
        } catch (error) {
            throw new Error(this.getErrorMessage(error));
        }
    },
    
    // Login
    async login(credentials) {
        try {
            const response = await this.apiRequest('/auth/login/', {
                method: 'POST',
                body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password
                })
            });
            
            if (response.token) {
                this.setToken(response.token);
                this.setCurrentUser(response.user);
                
                if (credentials.rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                }
            }
            
            return response;
        } catch (error) {
            throw new Error(this.getErrorMessage(error));
        }
    },
    
    // Logout
    async logout() {
        try {
            const token = this.getToken();
            if (token) {
                await this.apiRequest('/auth/logout/', {
                    method: 'POST'
                });
            }
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            this.removeToken();
            this.removeCurrentUser();
            localStorage.removeItem('rememberMe');
        }
    },
    
    // Password reset
    async requestPasswordReset(email) {
        try {
            const response = await this.apiRequest('/auth/password-reset/', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
            
            return response;
        } catch (error) {
            throw new Error(this.getErrorMessage(error));
        }
    },
    
    async resetPassword(token, newPassword) {
        try {
            const response = await this.apiRequest('/auth/password-reset/confirm/', {
                method: 'POST',
                body: JSON.stringify({
                    token,
                    password: newPassword
                })
            });
            
            return response;
        } catch (error) {
            throw new Error(this.getErrorMessage(error));
        }
    },
    
    // User management
    setCurrentUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        window.currentUser = user;
    },
    
    getCurrentUser() {
        const userString = localStorage.getItem('currentUser');
        if (userString) {
            try {
                return JSON.parse(userString);
            } catch (error) {
                console.error('Error parsing current user:', error);
                this.removeCurrentUser();
                return null;
            }
        }
        return null;
    },
    
    removeCurrentUser() {
        localStorage.removeItem('currentUser');
        window.currentUser = null;
    },
    
    // Token validation
    async validateToken() {
        const token = this.getToken();
        if (!token) return false;
        
        try {
            const response = await this.apiRequest('/auth/validate/', {
                method: 'POST'
            });
            
            if (response.valid) {
                this.setCurrentUser(response.user);
                return true;
            } else {
                this.removeToken();
                this.removeCurrentUser();
                return false;
            }
        } catch (error) {
            console.error('Token validation failed:', error);
            this.removeToken();
            this.removeCurrentUser();
            return false;
        }
    },
    
    // Check if user is authenticated
    isAuthenticated() {
        // For frontend-only implementation, check if user exists in localStorage
        const user = this.getCurrentUser();
        return !!user;
    },
    
    // Get user role
    getUserRole() {
        const user = this.getCurrentUser();
        return user ? user.role : null;
    },
    
    // Check if user has specific role
    hasRole(role) {
        return this.getUserRole() === role;
    },
    
    // Check if user has any of the specified roles
    hasAnyRole(roles) {
        const userRole = this.getUserRole();
        return roles.includes(userRole);
    },
    
    // Profile management
    async updateProfile(profileData) {
        try {
            const response = await this.apiRequest('/auth/profile/', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
            
            this.setCurrentUser(response.user);
            return response;
        } catch (error) {
            throw new Error(this.getErrorMessage(error));
        }
    },
    
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await this.apiRequest('/auth/change-password/', {
                method: 'POST',
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });
            
            return response;
        } catch (error) {
            throw new Error(this.getErrorMessage(error));
        }
    },
    
    // SMS Authentication (for basic phone users)
    async sendSMSCode(phoneNumber) {
        try {
            const response = await this.apiRequest('/auth/sms-code/', {
                method: 'POST',
                body: JSON.stringify({
                    phone_number: phoneNumber
                })
            });
            
            return response;
        } catch (error) {
            throw new Error(this.getErrorMessage(error));
        }
    },
    
    async verifySMSCode(phoneNumber, code) {
        try {
            const response = await this.apiRequest('/auth/sms-verify/', {
                method: 'POST',
                body: JSON.stringify({
                    phone_number: phoneNumber,
                    code: code
                })
            });
            
            if (response.token) {
                this.setToken(response.token);
                this.setCurrentUser(response.user);
            }
            
            return response;
        } catch (error) {
            throw new Error(this.getErrorMessage(error));
        }
    },
    
    // Two-factor authentication
    async enable2FA() {
        try {
            const response = await this.apiRequest('/auth/2fa/enable/', {
                method: 'POST'
            });
            
            return response;
        } catch (error) {
            throw new Error(this.getErrorMessage(error));
        }
    },
    
    async verify2FA(code) {
        try {
            const response = await this.apiRequest('/auth/2fa/verify/', {
                method: 'POST',
                body: JSON.stringify({ code })
            });
            
            return response;
        } catch (error) {
            throw new Error(this.getErrorMessage(error));
        }
    },
    
    // Error handling
    getErrorMessage(error) {
        if (error.message) {
            return error.message;
        }
        
        // Handle different types of errors
        if (typeof error === 'string') {
            return error;
        }
        
        if (error.response && error.response.data) {
            if (error.response.data.message) {
                return error.response.data.message;
            }
            if (error.response.data.errors) {
                const errors = Object.values(error.response.data.errors).flat();
                return errors.join(', ');
            }
        }
        
        return 'An unexpected error occurred. Please try again.';
    },
    
    // Initialize authentication
    async init() {
        const token = this.getToken();
        if (token) {
            const isValid = await this.validateToken();
            if (isValid) {
                // Update UI for authenticated user
                if (window.updateUIForLoggedInUser) {
                    window.updateUIForLoggedInUser();
                }
            }
        }
    },
    
    // Refresh token (if using refresh tokens)
    async refreshToken() {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }
        
        try {
            const response = await this.apiRequest('/auth/refresh/', {
                method: 'POST',
                body: JSON.stringify({
                    refresh_token: refreshToken
                })
            });
            
            this.setToken(response.access_token);
            if (response.refresh_token) {
                localStorage.setItem('refreshToken', response.refresh_token);
            }
            
            return response;
        } catch (error) {
            // If refresh fails, redirect to login
            this.logout();
            throw error;
        }
    },
    
    // Auto-refresh token setup
    setupAutoRefresh() {
        const token = this.getToken();
        if (!token) return;
        
        try {
            // Decode JWT to get expiration time
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expirationTime = payload.exp * 1000; // Convert to milliseconds
            const currentTime = Date.now();
            const timeToRefresh = expirationTime - currentTime - (5 * 60 * 1000); // Refresh 5 minutes before expiry
            
            if (timeToRefresh > 0) {
                setTimeout(async () => {
                    try {
                        await this.refreshToken();
                        this.setupAutoRefresh(); // Setup next refresh
                    } catch (error) {
                        console.error('Auto-refresh failed:', error);
                    }
                }, timeToRefresh);
            }
        } catch (error) {
            console.error('Error setting up auto-refresh:', error);
        }
    }
};

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    Auth.init();
    Auth.setupAutoRefresh();
});

// Handle network errors and token expiration
window.addEventListener('online', function() {
    Auth.init();
});

// Intercept fetch requests to handle token expiration
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    try {
        const response = await originalFetch.apply(this, args);
        
        // If we get a 401, try to refresh the token
        if (response.status === 401 && Auth.getToken()) {
            try {
                await Auth.refreshToken();
                // Retry the original request with new token
                const newResponse = await originalFetch.apply(this, args);
                return newResponse;
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                Auth.logout();
                return response;
            }
        }
        
        return response;
    } catch (error) {
        throw error;
    }
};

// Make Auth module globally available
window.Auth = Auth;

// Export Auth module
window.Auth = Auth;