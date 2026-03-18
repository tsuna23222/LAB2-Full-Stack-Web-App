// ===================================
// Global Variables & Constants
// ===================================
const API = 'http://localhost:3000';
let currentUser = null;
let requestModalInstance = null;

// Database structure (still used for employees, departments, requests)
window.db = {
    departments: [],
    employees: [],
    requests: []
};

// ===================================
// Initialization
// ===================================
document.addEventListener('DOMContentLoaded', function() {
    loadLocalData();
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
    window.addEventListener('hashchange', handleRouting);

    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const simulateVerifyBtn = document.getElementById('simulateVerifyBtn');
    if (simulateVerifyBtn) simulateVerifyBtn.addEventListener('click', handleEmailVerification);

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    const employeeForm = document.getElementById('employeeForm');
    if (employeeForm) employeeForm.addEventListener('submit', handleEmployeeSubmit);

    const departmentForm = document.getElementById('departmentForm');
    if (departmentForm) departmentForm.addEventListener('submit', handleDepartmentSubmit);

    const accountForm = document.getElementById('accountForm');
    if (accountForm) accountForm.addEventListener('submit', handleAccountSubmit);
}

// ===================================
// Local Data (non-auth data stays local)
// ===================================
function loadLocalData() {
    try {
        const stored = localStorage.getItem('ipt_local_data');
        if (stored) {
            const parsed = JSON.parse(stored);
            window.db.departments = parsed.departments || [];
            window.db.employees   = parsed.employees   || [];
            window.db.requests    = parsed.requests    || [];
        } else {
            seedLocalData();
        }
    } catch (error) {
        console.error('Error loading local data:', error);
        seedLocalData();
    }
}

function saveLocalData() {
    try {
        localStorage.setItem('ipt_local_data', JSON.stringify({
            departments: window.db.departments,
            employees:   window.db.employees,
            requests:    window.db.requests
        }));
    } catch (error) {
        console.error('Error saving local data:', error);
        showToast('Error saving data', 'danger');
    }
}

function seedLocalData() {
    window.db.departments = [
        { id: generateId(), name: 'Engineering', description: 'Software development team' },
        { id: generateId(), name: 'HR',          description: 'Human Resources' }
    ];
    window.db.employees = [];
    window.db.requests  = [];
    saveLocalData();
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===================================
// Auth Helper
// ===================================

// ✅ Step 2: Add Auth Header to Protected Requests
function getAuthHeader() {
    const token = sessionStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// ===================================
// Authentication System (API-based)
// ===================================

// ✅ Step 3: On page load, check sessionStorage token
async function checkAuthOnLoad() {
    const token = sessionStorage.getItem('authToken');
    if (!token) return;

    try {
        const res = await fetch(`${API}/api/profile`, {
            headers: getAuthHeader()
        });

        if (res.ok) {
            const data = await res.json();
            setAuthState(true, data.user);
        } else {
            // Token expired or invalid
            sessionStorage.removeItem('authToken');
        }
    } catch (err) {
        console.warn('Backend not reachable on load');
    }
}

function setAuthState(isAuth, user = null) {
    currentUser = user;
    const body = document.body;

    if (isAuth && user) {
        body.classList.remove('not-authenticated');
        body.classList.add('authenticated');

        if (user.role === 'Admin' || user.role === 'admin') {
            body.classList.add('is-admin');
        } else {
            body.classList.remove('is-admin');
        }

        const usernameDisplay = document.getElementById('usernameDisplay');
        if (usernameDisplay) {
            usernameDisplay.textContent = user.username || (user.firstName + ' ' + user.lastName);
        }
    } else {
        body.classList.remove('authenticated', 'is-admin');
        body.classList.add('not-authenticated');
    }
}

// ✅ Register with API
async function handleRegister(e) {
    e.preventDefault();

    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName  = document.getElementById('regLastName').value.trim();
    const email     = document.getElementById('regEmail').value.trim().toLowerCase();
    const password  = document.getElementById('regPassword').value;

    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'danger');
        return;
    }

    // Use email as username for the backend
    const username = email.split('@')[0];

    try {
        const response = await fetch(`${API}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role: 'user' })
        });

        const data = await response.json();

        if (response.ok) {
            // Store display name locally
            localStorage.setItem('pending_name', JSON.stringify({ firstName, lastName, email }));
            showToast('Account created! Please verify your email.', 'success');
            navigateTo('#/verify-email');
        } else {
            showToast(data.error || 'Registration failed', 'danger');
        }
    } catch (err) {
        showToast('Network error — is the backend running?', 'danger');
    }
}

// Email verification (simulated — backend doesn't require it)
function handleEmailVerification() {
    const pending = localStorage.getItem('pending_name');
    if (!pending) {
        showToast('No pending verification', 'warning');
        return;
    }

    localStorage.removeItem('pending_name');
    showToast('Email verified successfully!', 'success');

    setTimeout(() => {
        navigateTo('#/login');
        const loginSuccess = document.getElementById('loginSuccess');
        if (loginSuccess) loginSuccess.style.display = 'block';
    }, 500);
}

// ✅ Login with API (replaces localStorage.setItem('auth_token'))
async function handleLogin(e) {
    e.preventDefault();

    const email    = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    // Use the part before @ as username (matches how we registered)
    const username = email.includes('@') ? email.split('@')[0] : email;

    try {
        const response = await fetch(`${API}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // ✅ Save token in sessionStorage instead of localStorage
            sessionStorage.setItem('authToken', data.token);
            setAuthState(true, data.user);
            showToast(`Welcome back, ${data.user.username}!`, 'success');
            navigateTo('#/profile');
        } else {
            showToast(data.error || 'Invalid credentials', 'danger');
        }
    } catch (err) {
        showToast('Network error — is the backend running?', 'danger');
    }
}

// ✅ Logout — clear sessionStorage instead of localStorage
function handleLogout(e) {
    e.preventDefault();
    sessionStorage.removeItem('authToken');
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
    const route = hash.replace('#/', '');

    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    const protectedRoutes = ['profile', 'requests'];
    const adminRoutes = ['employees', 'departments', 'accounts'];

    if (protectedRoutes.includes(route) && !currentUser) {
        navigateTo('#/login');
        return;
    }

    if (adminRoutes.includes(route)) {
        if (!currentUser) {
            navigateTo('#/login');
            return;
        }
        if (currentUser.role !== 'Admin' && currentUser.role !== 'admin') {
            showToast('Access denied: Admin only', 'danger');
            navigateTo('#/');
            return;
        }
    }

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
    if (targetPage) targetPage.classList.add('active');
}

// ===================================
// Render Functions
// ===================================
function renderVerifyEmailPage() {
    const pending = localStorage.getItem('pending_name');
    const email = pending ? JSON.parse(pending).email : 'your email';
    const emailDisplay = document.getElementById('emailToVerify');
    if (emailDisplay) emailDisplay.textContent = email;
}

function renderProfile() {
    if (!currentUser) return;

    const profileContent = document.getElementById('profileContent');
    if (!profileContent) return;

    const displayName = currentUser.username || (currentUser.firstName + ' ' + currentUser.lastName);

    profileContent.innerHTML = `
        <div class="profile-info">
            <h3>${displayName}</h3>
            <div class="profile-row">
                <div class="profile-label">Username:</div>
                <div class="profile-value">${currentUser.username}</div>
            </div>
            <div class="profile-row">
                <div class="profile-label">Role:</div>
                <div class="profile-value">
                    <span class="badge ${currentUser.role === 'admin' ? 'bg-danger' : 'bg-primary'}">
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

// ✅ Fetch admin dashboard from backend (Step 2 example)
async function loadAdminDashboard() {
    const res = await fetch(`http://localhost:3000/api/admin/dashboard`, {
        headers: getAuthHeader()
    });
    if (res.ok) {
        const data = await res.json();
        const el = document.getElementById('content');
        if (el) el.innerText = data.message;
    } else {
        const el = document.getElementById('content');
        if (el) el.innerText = 'Access denied!';
    }
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
            </tr>`;
        return;
    }

    tbody.innerHTML = window.db.employees.map(emp => {
        const dept = window.db.departments.find(d => d.id === emp.departmentId);
        const deptName = dept ? dept.name : 'Unknown';

        return `
            <tr>
                <td><code>${emp.employeeId}</code></td>
                <td>${emp.userEmail}</td>
                <td>${emp.position}</td>
                <td>${deptName}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editEmployee('${emp.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${emp.id}')">Delete</button>
                </td>
            </tr>`;
    }).join('');
}

function renderDepartments() {
    const tbody = document.getElementById('departmentsTableBody');
    if (!tbody) return;

    if (window.db.departments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-muted">
                    <div class="empty-state"><h5>No departments yet</h5></div>
                </td>
            </tr>`;
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
        </tr>`).join('');
}

// ✅ Accounts now fetched from backend
async function renderAccounts() {
    const tbody = document.getElementById('accountsTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="5" class="text-center">Loading...</td></tr>`;

    try {
        const res = await fetch(`${API}/api/admin/accounts`, {
            headers: getAuthHeader()
        });

        // Fallback: if endpoint doesn't exist yet, show current user only
        if (!res.ok) {
            tbody.innerHTML = `
                <tr>
                    <td>${currentUser.username}</td>
                    <td>—</td>
                    <td><span class="badge bg-danger">${currentUser.role}</span></td>
                    <td><span class="text-success">✓</span></td>
                    <td>—</td>
                </tr>`;
            return;
        }

        const data = await res.json();
        tbody.innerHTML = data.accounts.map(acc => `
            <tr>
                <td>${acc.username}</td>
                <td>${acc.role}</td>
                <td><span class="text-success">✓</span></td>
                <td>—</td>
            </tr>`).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-danger">Could not load accounts</td></tr>`;
    }
}

function renderRequests() {
    const content = document.getElementById('requestsContent');
    if (!content) return;

    const userRequests = window.db.requests.filter(req => req.employeeEmail === currentUser?.username);

    if (userRequests.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <h5>You have no requests yet</h5>
                <p>Click "+ New Request" to create one</p>
                <button class="btn btn-primary mt-3" onclick="showRequestModal()">Create One</button>
            </div>`;
        return;
    }

    content.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr><th>Date</th><th>Type</th><th>Items</th><th>Status</th></tr>
                </thead>
                <tbody>
                    ${userRequests.map(req => {
                        const statusClass = req.status === 'Pending' ? 'bg-warning' :
                                            req.status === 'Approved' ? 'bg-success' : 'bg-danger';
                        const itemsList = req.items.map(i => `${i.name} (${i.quantity})`).join(', ');
                        return `
                            <tr>
                                <td>${new Date(req.date).toLocaleDateString()}</td>
                                <td><strong>${req.type}</strong></td>
                                <td>${itemsList}</td>
                                <td><span class="badge ${statusClass}">${req.status}</span></td>
                            </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
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

    const id           = document.getElementById('empEditId').value;
    const employeeId   = document.getElementById('empId').value.trim();
    const userEmail    = document.getElementById('empEmail').value.trim().toLowerCase();
    const position     = document.getElementById('empPosition').value.trim();
    const departmentId = document.getElementById('empDepartment').value;
    const hireDate     = document.getElementById('empHireDate').value;

    if (id) {
        const emp = window.db.employees.find(e => e.id === id);
        if (emp) {
            emp.employeeId   = employeeId;
            emp.userEmail    = userEmail;
            emp.position     = position;
            emp.departmentId = departmentId;
            emp.hireDate     = hireDate;
        }
        showToast('Employee updated successfully', 'success');
    } else {
        window.db.employees.push({ id: generateId(), employeeId, userEmail, position, departmentId, hireDate });
        showToast('Employee added successfully', 'success');
    }

    saveLocalData();
    hideEmployeeForm();
    renderEmployees();
}

function editEmployee(id) {
    const emp = window.db.employees.find(e => e.id === id);
    if (!emp) return;

    document.getElementById('empEditId').value    = emp.id;
    document.getElementById('empId').value        = emp.employeeId;
    document.getElementById('empEmail').value     = emp.userEmail;
    document.getElementById('empPosition').value  = emp.position;
    document.getElementById('empHireDate').value  = emp.hireDate;

    populateDepartmentDropdown();
    document.getElementById('empDepartment').value = emp.departmentId;
    document.getElementById('employeeFormContainer').style.display = 'block';
}

function deleteEmployee(id) {
    if (confirm('Are you sure you want to delete this employee?')) {
        window.db.employees = window.db.employees.filter(e => e.id !== id);
        saveLocalData();
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

    const id          = document.getElementById('deptEditId').value;
    const name        = document.getElementById('deptName').value.trim();
    const description = document.getElementById('deptDescription').value.trim();

    if (id) {
        const dept = window.db.departments.find(d => d.id === id);
        if (dept) { dept.name = name; dept.description = description; }
        showToast('Department updated successfully', 'success');
    } else {
        window.db.departments.push({ id: generateId(), name, description });
        showToast('Department added successfully', 'success');
    }

    saveLocalData();
    hideDepartmentForm();
    renderDepartments();
}

function editDepartment(id) {
    const dept = window.db.departments.find(d => d.id === id);
    if (!dept) return;

    document.getElementById('deptEditId').value        = dept.id;
    document.getElementById('deptName').value          = dept.name;
    document.getElementById('deptDescription').value   = dept.description;
    document.getElementById('departmentFormContainer').style.display = 'block';
}

function deleteDepartment(id) {
    if (confirm('Are you sure you want to delete this department?')) {
        window.db.departments = window.db.departments.filter(d => d.id !== id);
        saveLocalData();
        showToast('Department deleted successfully', 'success');
        renderDepartments();
    }
}

// ===================================
// Account CRUD (admin form — local display only)
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
    showToast('Account management is now handled by the backend.', 'info');
    hideAccountForm();
}

function resetPassword(id) {
    showToast('Password reset is now handled by the backend.', 'info');
}

function deleteAccount(id) {
    showToast('Account deletion is now handled by the backend.', 'info');
}

// ===================================
// Requests
// ===================================
function showRequestModal() {
    document.getElementById('requestForm').reset();
    document.getElementById('requestItems').innerHTML = `
        <div class="request-item mb-2">
            <div class="input-group">
                <input type="text" class="form-control item-name" placeholder="Item name" required>
                <input type="number" class="form-control item-qty" placeholder="Qty" min="1" value="1" style="max-width:80px;" required>
                <button type="button" class="btn btn-outline-danger" onclick="removeRequestItem(this)">×</button>
            </div>
        </div>`;
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
        </div>`;
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
        const name     = elem.querySelector('.item-name').value.trim();
        const quantity = parseInt(elem.querySelector('.item-qty').value);
        if (!name || quantity < 1) { isValid = false; }
        else { items.push({ name, quantity }); }
    });

    if (!isValid || items.length === 0) {
        showToast('Please fill in all item fields correctly', 'danger');
        return;
    }

    window.db.requests.push({
        id: generateId(),
        type,
        items,
        status: 'Pending',
        date: new Date().toISOString(),
        employeeEmail: currentUser.username
    });

    saveLocalData();
    requestModalInstance.hide();
    showToast('Request submitted successfully', 'success');
    renderRequests();
}

// ===================================
// Toast Notifications
// ===================================
function showToast(message, type = 'info') {
    const toastBody    = document.getElementById('toastBody');
    const toastElement = document.getElementById('toast');
    if (!toastBody || !toastElement) return;

    toastBody.textContent = message;
    toastElement.className = 'toast';

    if (type === 'success')      toastElement.classList.add('bg-success', 'text-white');
    else if (type === 'danger')  toastElement.classList.add('bg-danger',  'text-white');
    else if (type === 'warning') toastElement.classList.add('bg-warning');
    else                         toastElement.classList.add('bg-info',    'text-white');

    new bootstrap.Toast(toastElement).show();
}