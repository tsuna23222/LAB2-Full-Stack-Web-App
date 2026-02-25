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

// ===================================
// Client-Side Routing
// ===================================
function navigateTo(hash) {
    window.location.hash = hash;
}

function handleRouting() {
    let hash = window.location.hash || '#/';
    
    // Remove hash prefix
    const route = hash.replace('#/', '');
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Protected routes (require login)
    const protectedRoutes = ['profile', 'requests'];
    const adminRoutes = ['employees', 'departments', 'accounts'];
    
    // Check authentication for protected routes
    if (protectedRoutes.includes(route) && !currentUser) {
        navigateTo('#/login');
        return;
    }
    
    // Check admin access
    if (adminRoutes.includes(route)) {
        if (!currentUser) {
            navigateTo('#/login');
            return;
        }
        if (currentUser.role !== 'Admin') {
            showToast('Access denied: Admin only', 'danger');
            navigateTo('#/');
            return;
        }
    }
    
    // Route to appropriate page
    let pageId = '';
    switch(route) {
        case '':
        case '/':
            pageId = 'home-page';
            break;
        case 'register':
            pageId = 'register-page';
            break;
        case 'verify-email':
            pageId = 'verify-email-page';
            renderVerifyEmailPage();
            break;
        case 'login':
            pageId = 'login-page';
            break;
        case 'profile':
            pageId = 'profile-page';
            renderProfile();
            break;
        case 'employees':
            pageId = 'employees-page';
            renderEmployees();
            break;
        case 'departments':
            pageId = 'departments-page';
            renderDepartments();
            break;
        case 'accounts':
            pageId = 'accounts-page';
            renderAccounts();
            break;
        case 'requests':
            pageId = 'requests-page';
            renderRequests();
            break;
        default:
            pageId = 'home-page';
    }
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
}

// ===================================
// Render Functions
// ===================================
function renderVerifyEmailPage() {
    const email = localStorage.getItem('unverified_email') || 'your email';
    const emailDisplay = document.getElementById('emailToVerify');
    if (emailDisplay) {
        emailDisplay.textContent = email;
    }
}

function renderProfile() {
    if (!currentUser) return;
    
    const profileContent = document.getElementById('profileContent');
    if (!profileContent) return;
    
    profileContent.innerHTML = `
        <div class="profile-info">
            <h3>${currentUser.firstName} ${currentUser.lastName}</h3>
            <div class="profile-row">
                <div class="profile-label">Email:</div>
                <div class="profile-value">${currentUser.email}</div>
            </div>
            <div class="profile-row">
                <div class="profile-label">Role:</div>
                <div class="profile-value">
                    <span class="badge ${currentUser.role === 'Admin' ? 'bg-danger' : 'bg-primary'}">
                        ${currentUser.role}
                    </span>
                </div>
            </div>
            <div class="mt-4">
                <button class="btn btn-primary" onclick="alert('Edit profile functionality coming soon!')">
                    Edit Profile
                </button>
            </div>
        </div>
    `;
}

function renderEmployees() {
    const tbody = document.getElementById('employeesTableBody');
    if (!tbody) return;
    
    if (window.db.employees.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    <div class="empty-state">
                        <h5>No employees yet</h5>
                        <p>Click "+ Add Employee" to create one</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = window.db.employees.map(emp => {
        const user = window.db.accounts.find(acc => acc.email === emp.userEmail);
        const dept = window.db.departments.find(d => d.id === emp.departmentId);
        const userName = user ? `${user.firstName} ${user.lastName}` : emp.userEmail;
        const deptName = dept ? dept.name : 'Unknown';
        
        return `
            <tr>
                <td><code>${emp.employeeId}</code></td>
                <td>${userName}</td>
                <td>${emp.position}</td>
                <td>${deptName}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editEmployee('${emp.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${emp.id}')">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderDepartments() {
    const tbody = document.getElementById('departmentsTableBody');
    if (!tbody) return;
    
    if (window.db.departments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-muted">
                    <div class="empty-state">
                        <h5>No departments yet</h5>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = window.db.departments.map(dept => `
        <tr>
            <td><strong>${dept.name}</strong></td>
            <td>${dept.description}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editDepartment('${dept.id}')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteDepartment('${dept.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function renderAccounts() {
    const tbody = document.getElementById('accountsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = window.db.accounts.map(acc => `
        <tr>
            <td>${acc.firstName} ${acc.lastName}</td>
            <td>${acc.email}</td>
            <td>
                <span class="badge ${acc.role === 'Admin' ? 'bg-danger' : 'bg-primary'}">
                    ${acc.role}
                </span>
            </td>
            <td>
                ${acc.verified ? '<span class="text-success">✓</span>' : '<span class="text-danger">✗</span>'}
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editAccount('${acc.id}')">Edit</button>
                <button class="btn btn-sm btn-warning" onclick="resetPassword('${acc.id}')">Reset Password</button>
                <button class="btn btn-sm btn-danger" onclick="deleteAccount('${acc.id}')" 
                    ${acc.email === currentUser?.email ? 'disabled title="Cannot delete yourself"' : ''}>
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

function renderRequests() {
    const content = document.getElementById('requestsContent');
    if (!content) return;
    
    const userRequests = window.db.requests.filter(req => req.employeeEmail === currentUser.email);
    
    if (userRequests.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <h5>You have no requests yet</h5>
                <p>Click "+ New Request" to create one</p>
                <button class="btn btn-primary mt-3" onclick="showRequestModal()">Create One</button>
            </div>
        `;
        return;
    }
    
    content.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Items</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${userRequests.map(req => {
                        const statusClass = req.status === 'Pending' ? 'bg-warning' : 
                                          req.status === 'Approved' ? 'bg-success' : 'bg-danger';
                        const itemsList = req.items.map(item => `${item.name} (${item.quantity})`).join(', ');
                        
                        return `
                            <tr>
                                <td>${new Date(req.date).toLocaleDateString()}</td>
                                <td><strong>${req.type}</strong></td>
                                <td>${itemsList}</td>
                                <td><span class="badge ${statusClass}">${req.status}</span></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ===================================
// Employee CRUD
// ===================================
function showAddEmployeeForm() {
    document.getElementById('employeeFormContainer').style.display = 'block';
    document.getElementById('employeeFormTitle').textContent = 'Add/Edit Employee';
    document.getElementById('employeeForm').reset();
    document.getElementById('empEditId').value = '';
    populateDepartmentDropdown();
}

function hideEmployeeForm() {
    document.getElementById('employeeFormContainer').style.display = 'none';
}

function populateDepartmentDropdown() {
    const select = document.getElementById('empDepartment');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Department</option>' +
        window.db.departments.map(dept => 
            `<option value="${dept.id}">${dept.name}</option>`
        ).join('');
}

function handleEmployeeSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('empEditId').value;
    const employeeId = document.getElementById('empId').value.trim();
    const userEmail = document.getElementById('empEmail').value.trim().toLowerCase();
    const position = document.getElementById('empPosition').value.trim();
    const departmentId = document.getElementById('empDepartment').value;
    const hireDate = document.getElementById('empHireDate').value;
    
    // Validate user exists
    const userExists = window.db.accounts.find(acc => acc.email === userEmail);
    if (!userExists) {
        showToast('User email does not exist in accounts', 'danger');
        return;
    }
    
    if (id) {
        // Update existing
        const emp = window.db.employees.find(e => e.id === id);
        if (emp) {
            emp.employeeId = employeeId;
            emp.userEmail = userEmail;
            emp.position = position;
            emp.departmentId = departmentId;
            emp.hireDate = hireDate;
        }
        showToast('Employee updated successfully', 'success');
    } else {
        // Create new
        const newEmployee = {
            id: generateId(),
            employeeId,
            userEmail,
            position,
            departmentId,
            hireDate
        };
        window.db.employees.push(newEmployee);
        showToast('Employee added successfully', 'success');
    }
    
    saveToStorage();
    hideEmployeeForm();
    renderEmployees();
}

function editEmployee(id) {
    const emp = window.db.employees.find(e => e.id === id);
    if (!emp) return;
    
    document.getElementById('empEditId').value = emp.id;
    document.getElementById('empId').value = emp.employeeId;
    document.getElementById('empEmail').value = emp.userEmail;
    document.getElementById('empPosition').value = emp.position;
    document.getElementById('empHireDate').value = emp.hireDate;
    
    populateDepartmentDropdown();
    document.getElementById('empDepartment').value = emp.departmentId;
    
    document.getElementById('employeeFormContainer').style.display = 'block';
}

function deleteEmployee(id) {
    if (confirm('Are you sure you want to delete this employee?')) {
        window.db.employees = window.db.employees.filter(e => e.id !== id);
        saveToStorage();
        showToast('Employee deleted successfully', 'success');
        renderEmployees();
    }
}

// ===================================
// Department CRUD
// ===================================
function showAddDepartmentForm() {
    document.getElementById('departmentFormContainer').style.display = 'block';
    document.getElementById('departmentForm').reset();
    document.getElementById('deptEditId').value = '';
}

function hideDepartmentForm() {
    document.getElementById('departmentFormContainer').style.display = 'none';
}

function handleDepartmentSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('deptEditId').value;
    const name = document.getElementById('deptName').value.trim();
    const description = document.getElementById('deptDescription').value.trim();
    
    if (id) {
        // Update
        const dept = window.db.departments.find(d => d.id === id);
        if (dept) {
            dept.name = name;
            dept.description = description;
        }
        showToast('Department updated successfully', 'success');
    } else {
        // Create
        const newDept = {
            id: generateId(),
            name,
            description
        };
        window.db.departments.push(newDept);
        showToast('Department added successfully', 'success');
    }
    
    saveToStorage();
    hideDepartmentForm();
    renderDepartments();
}

function editDepartment(id) {
    const dept = window.db.departments.find(d => d.id === id);
    if (!dept) return;
    
    document.getElementById('deptEditId').value = dept.id;
    document.getElementById('deptName').value = dept.name;
    document.getElementById('deptDescription').value = dept.description;
    document.getElementById('departmentFormContainer').style.display = 'block';
}

function deleteDepartment(id) {
    if (confirm('Are you sure you want to delete this department?')) {
        window.db.departments = window.db.departments.filter(d => d.id !== id);
        saveToStorage();
        showToast('Department deleted successfully', 'success');
        renderDepartments();
    }
}

// ===================================
// Account CRUD
// ===================================
function showAddAccountForm() {
    document.getElementById('accountFormContainer').style.display = 'block';
    document.getElementById('accountForm').reset();
    document.getElementById('accEditId').value = '';
    document.getElementById('accPasswordGroup').style.display = 'block';
    document.getElementById('accPassword').required = true;
}

function hideAccountForm() {
    document.getElementById('accountFormContainer').style.display = 'none';
}

function handleAccountSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('accEditId').value;
    const firstName = document.getElementById('accFirstName').value.trim();
    const lastName = document.getElementById('accLastName').value.trim();
    const email = document.getElementById('accEmail').value.trim().toLowerCase();
    const password = document.getElementById('accPassword').value;
    const role = document.getElementById('accRole').value;
    const verified = document.getElementById('accVerified').checked;
    
    if (id) {
        // Update
        const acc = window.db.accounts.find(a => a.id === id);
        if (acc) {
            acc.firstName = firstName;
            acc.lastName = lastName;
            acc.email = email;
            if (password) acc.password = password;
            acc.role = role;
            acc.verified = verified;
        }
        showToast('Account updated successfully', 'success');
    } else {
        // Create
        if (!password || password.length < 6) {
            showToast('Password must be at least 6 characters', 'danger');
            return;
        }
        
        const emailExists = window.db.accounts.find(a => a.email === email);
        if (emailExists) {
            showToast('Email already exists', 'danger');
            return;
        }
        
        const newAccount = {
            id: generateId(),
            firstName,
            lastName,
            email,
            password,
            role,
            verified
        };
        window.db.accounts.push(newAccount);
        showToast('Account added successfully', 'success');
    }
    
    saveToStorage();
    hideAccountForm();
    renderAccounts();
}

function editAccount(id) {
    const acc = window.db.accounts.find(a => a.id === id);
    if (!acc) return;
    
    document.getElementById('accEditId').value = acc.id;
    document.getElementById('accFirstName').value = acc.firstName;
    document.getElementById('accLastName').value = acc.lastName;
    document.getElementById('accEmail').value = acc.email;
    document.getElementById('accPassword').value = '';
    document.getElementById('accRole').value = acc.role;
    document.getElementById('accVerified').checked = acc.verified;
    
    document.getElementById('accPasswordGroup').style.display = 'block';
    document.getElementById('accPassword').required = false;
    document.getElementById('accountFormContainer').style.display = 'block';
}

function resetPassword(id) {
    const newPassword = prompt('Enter new password (minimum 6 characters):');
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters', 'danger');
        return;
    }
    
    const acc = window.db.accounts.find(a => a.id === id);
    if (acc) {
        acc.password = newPassword;
        saveToStorage();
        showToast('Password reset successfully', 'success');
    }
}

function deleteAccount(id) {
    const acc = window.db.accounts.find(a => a.id === id);
    if (acc && acc.email === currentUser?.email) {
        showToast('Cannot delete your own account', 'danger');
        return;
    }
    
    if (confirm('Are you sure you want to delete this account?')) {
        window.db.accounts = window.db.accounts.filter(a => a.id !== id);
        saveToStorage();
        showToast('Account deleted successfully', 'success');
        renderAccounts();
    }
}

// ===================================
// Requests
// ===================================
function showRequestModal() {
    // Reset form
    document.getElementById('requestForm').reset();
    document.getElementById('requestItems').innerHTML = `
        <div class="request-item mb-2">
            <div class="input-group">
                <input type="text" class="form-control item-name" placeholder="Item name" required>
                <input type="number" class="form-control item-qty" placeholder="Qty" min="1" value="1" style="max-width:80px;" required>
                <button type="button" class="btn btn-outline-danger" onclick="removeRequestItem(this)">×</button>
            </div>
        </div>
    `;
    
    requestModalInstance.show();
}

function addRequestItem() {
    const container = document.getElementById('requestItems');
    const newItem = document.createElement('div');
    newItem.className = 'request-item mb-2';
    newItem.innerHTML = `
        <div class="input-group">
            <input type="text" class="form-control item-name" placeholder="Item name" required>
            <input type="number" class="form-control item-qty" placeholder="Qty" min="1" value="1" style="max-width:80px;" required>
            <button type="button" class="btn btn-outline-danger" onclick="removeRequestItem(this)">×</button>
        </div>
    `;
    container.appendChild(newItem);
}

function removeRequestItem(btn) {
    const container = document.getElementById('requestItems');
    if (container.children.length > 1) {
        btn.closest('.request-item').remove();
    } else {
        showToast('At least one item is required', 'warning');
    }
}

function submitRequest() {
    const type = document.getElementById('reqType').value;
    const itemElements = document.querySelectorAll('.request-item');
    
    const items = [];
    let isValid = true;
    
    itemElements.forEach(elem => {
        const name = elem.querySelector('.item-name').value.trim();
        const quantity = parseInt(elem.querySelector('.item-qty').value);
        
        if (!name || quantity < 1) {
            isValid = false;
        } else {
            items.push({ name, quantity });
        }
    });
    
    if (!isValid || items.length === 0) {
        showToast('Please fill in all item fields correctly', 'danger');
        return;
    }
    
    const newRequest = {
        id: generateId(),
        type,
        items,
        status: 'Pending',
        date: new Date().toISOString(),
        employeeEmail: currentUser.email
    };
    
    window.db.requests.push(newRequest);
    saveToStorage();
    
    requestModalInstance.hide();
    showToast('Request submitted successfully', 'success');
    renderRequests();
}

// ===================================
// Toast Notifications
// ===================================
function showToast(message, type = 'info') {
    const toastBody = document.getElementById('toastBody');
    const toastElement = document.getElementById('toast');
    
    if (!toastBody || !toastElement) return;
    
    // Set message
    toastBody.textContent = message;
    
    // Set color based on type
    toastElement.className = 'toast';
    if (type === 'success') {
        toastElement.classList.add('bg-success', 'text-white');
    } else if (type === 'danger') {
        toastElement.classList.add('bg-danger', 'text-white');
    } else if (type === 'warning') {
        toastElement.classList.add('bg-warning');
    } else {
        toastElement.classList.add('bg-info', 'text-white');
    }
    
    // Show toast
    const bsToast = new bootstrap.Toast(toastElement);
    bsToast.show();
}
