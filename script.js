// ===================================
// Global Variables & Constants
// ===================================
const STORAGE_KEY = 'ipt_demo_v1';
let currentUser = null;
let requestModalInstance = null;

// Database structure
window.db = {
    accounts: [],
    departments: [],
    employees: [],
    requests: []
};

// ===================================
// Initialization
// ===================================
document.addEventListener('DOMContentLoaded', function() {
    loadFromStorage();
    initializeEventListeners();
    checkAuthOnLoad();
    handleRouting();
    
    // Set brand name dynamically
    document.getElementById('brandName').textContent = 'Full-Stack App Casinillo';
    
    // Initialize Bootstrap modal
    const modalElement = document.getElementById('requestModal');
    if (modalElement) {
        requestModalInstance = new bootstrap.Modal(modalElement);
    }
});

// ===================================
// Event Listeners
// ===================================
function initializeEventListeners() {
    // Hash change for routing
    window.addEventListener('hashchange', handleRouting);
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Verify email simulation
    const simulateVerifyBtn = document.getElementById('simulateVerifyBtn');
    if (simulateVerifyBtn) {
        simulateVerifyBtn.addEventListener('click', handleEmailVerification);
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Employee form
    const employeeForm = document.getElementById('employeeForm');
    if (employeeForm) {
        employeeForm.addEventListener('submit', handleEmployeeSubmit);
    }
    
    // Department form
    const departmentForm = document.getElementById('departmentForm');
    if (departmentForm) {
        departmentForm.addEventListener('submit', handleDepartmentSubmit);
    }
    
    // Account form
    const accountForm = document.getElementById('accountForm');
    if (accountForm) {
        accountForm.addEventListener('submit', handleAccountSubmit);
    }
}

// ===================================
// Local Storage Management
// ===================================
function loadFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            window.db = JSON.parse(stored);
        } else {
            seedInitialData();
        }
    } catch (error) {
        console.error('Error loading from storage:', error);
        seedInitialData();
    }
}

function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
    } catch (error) {
        console.error('Error saving to storage:', error);
        showToast('Error saving data', 'danger');
    }
}

function seedInitialData() {
    window.db = {
        accounts: [
            {
                id: generateId(),
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@example.com',
                password: 'Password123!',
                role: 'Admin',
                verified: true
            }
        ],
        departments: [
            {
                id: generateId(),
                name: 'Engineering',
                description: 'Software development team'
            },
            {
                id: generateId(),
                name: 'HR',
                description: 'Human Resources'
            }
        ],
        employees: [],
        requests: []
    };
    saveToStorage();
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===================================
// Authentication System
// ===================================
function checkAuthOnLoad() {
    const authToken = localStorage.getItem('auth_token');
    if (authToken) {
        const user = window.db.accounts.find(acc => acc.email === authToken && acc.verified);
        if (user) {
            setAuthState(true, user);
        } else {
            localStorage.removeItem('auth_token');
        }
    }
}

function setAuthState(isAuth, user = null) {
    currentUser = user;
    const body = document.body;
    
    if (isAuth && user) {
        body.classList.remove('not-authenticated');
        body.classList.add('authenticated');
        
        if (user.role === 'Admin') {
            body.classList.add('is-admin');
        } else {
            body.classList.remove('is-admin');
        }
        
        // Update username display
        const usernameDisplay = document.getElementById('usernameDisplay');
        if (usernameDisplay) {
            usernameDisplay.textContent = user.firstName + ' ' + user.lastName;
        }
    } else {
        body.classList.remove('authenticated', 'is-admin');
        body.classList.add('not-authenticated');
    }
}

function handleRegister(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    
    // Validate
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'danger');
        return;
    }
    
    // Check if email exists
    const existingUser = window.db.accounts.find(acc => acc.email === email);
    if (existingUser) {
        showToast('Email already registered', 'danger');
        return;
    }
    
    // Create new account
    const newAccount = {
        id: generateId(),
        firstName,
        lastName,
        email,
        password,
        role: 'User',
        verified: false
    };
    
    window.db.accounts.push(newAccount);
    saveToStorage();
    
    // Store unverified email
    localStorage.setItem('unverified_email', email);
    
    showToast('Account created! Please verify your email.', 'success');
    navigateTo('#/verify-email');
}

function handleEmailVerification() {
    const email = localStorage.getItem('unverified_email');
    if (!email) {
        showToast('No pending verification', 'warning');
        return;
    }
    
    const account = window.db.accounts.find(acc => acc.email === email);
    if (account) {
        account.verified = true;
        saveToStorage();
        localStorage.removeItem('unverified_email');
        
        showToast('Email verified successfully!', 'success');
        
        // Show success message on login page
        setTimeout(() => {
            navigateTo('#/login');
            const loginSuccess = document.getElementById('loginSuccess');
            if (loginSuccess) {
                loginSuccess.style.display = 'block';
            }
        }, 500);
    }
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    
    const user = window.db.accounts.find(acc => 
        acc.email === email && 
        acc.password === password && 
        acc.verified === true
    );
    
    if (user) {
        localStorage.setItem('auth_token', email);
        setAuthState(true, user);
        showToast(`Welcome back, ${user.firstName}!`, 'success');
        navigateTo('#/profile');
    } else {
        showToast('Invalid credentials or email not verified', 'danger');
    }
}

function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('auth_token');
    setAuthState(false);
    showToast('Logged out successfully', 'success');
    navigateTo('#/');
}
