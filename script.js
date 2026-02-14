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