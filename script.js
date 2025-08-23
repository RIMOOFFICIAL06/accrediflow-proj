/* ===================================================
   AccrediFlow Full-Stack Frontend Script
   Connects to the Node.js/Express backend API
   =================================================== */

// --- API Configuration ---
const API_URL = 'http://localhost:5000/api'; // Base URL for your backend

// --- App State (session-based) ---
let currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || null;

// --- Document Categories ---
const DOCUMENT_CATEGORIES = {
    faculty: [
        { body: 'NAAC', name: 'Faculty CVs' },
        { body: 'NAAC', name: 'Certificates of Awards' },
        { body: 'NBA', name: 'Final Year Project Reports' },
    ],
    hod: [
        { body: 'NAAC', name: 'Student Feedback Reports' },
        { body: 'NBA', name: 'Placement Statistics' },
        { body: 'NBA', name: 'Lab Manuals & Records' },
        { body: 'NBA', name: 'Placement & Higher Studies Proof' },
    ],
    coordinator: [
        { body: 'NIRF', name: 'Student to Teacher Ratio' },
        { body: 'NIRF', name: 'Quantity of Research' },
        { body: 'NIRF', name: 'Median Salary of Graduates' },
        { body: 'NIRF', name: '%age of Women or Students from Other States/Countries' },
        { body: 'NAAC', name: 'Student-Teacher Ratio' },
    ]
};

// --- Utility Functions ---
function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m]);
}

// --- Custom Modals ---
function customAlert(message, title = "Notification") {
    const modal = document.getElementById('customModal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    const actions = document.getElementById('modalActions');
    actions.innerHTML = `<button onclick="closeCustomModal()" class="px-4 py-2 rounded-md bg-cyan-500 text-slate-900 font-semibold">OK</button>`;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeCustomModal() {
    document.getElementById('customModal').classList.add('hidden');
    document.getElementById('customModal').classList.remove('flex');
}

// --- API Error Handling ---
async function handleApiError(response) {
    if (response.status === 401) {
        logout();
        customAlert("Your session has expired. Please log in again.", "Session Expired");
        return null;
    }
    try {
        const errorData = await response.json();
        throw new Error(errorData.message || `An error occurred: ${response.statusText}`);
    } catch (jsonError) {
        throw new Error(`Server returned a non-JSON error: ${response.status} ${response.statusText}`);
    }
}


// --- UI Navigation & Visibility ---
function updateAuthNav() {
    const nav = document.getElementById('authNav');
    if (currentUser) {
        nav.innerHTML = `<button onclick="logout()" class="px-4 py-2 rounded-md bg-slate-700/50 hover:bg-slate-700 text-slate-200 font-medium transition-colors">Logout</button>`;
    } else {
        nav.innerHTML = `
            <button onclick="showLogin()" class="font-medium text-slate-300 hover:text-cyan-400 transition-colors">Login</button>
            <button onclick="showSignup()" class="px-4 py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold transition">Register</button>
        `;
    }
}

function showOnly(idsToShow = []) {
  const sections = ["landing", "login", "signup", "adminDashboard", "coordinatorDashboard", "hodDashboard", "facultyDashboard", "superadminDashboard"];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("hidden", !idsToShow.includes(id));
  });
  updateAuthNav();
  window.scrollTo(0, 0);
}

const showLogin = () => showOnly(["login"]);
const showSignup = () => showOnly(["signup"]);
const backToLanding = () => showOnly(["landing"]);

// --- Core Logic: Signup, Login, Logout ---
async function handleSignup(e) {
  e.preventDefault();
  const signupForm = e.target;
  const instituteData = {
    instituteName: signupForm.querySelector("#instituteName").value,
    instituteType: signupForm.querySelector("#instituteType").value,
    accreditationBody: signupForm.querySelector("#accreditationBody").value,
    emailDomain: signupForm.querySelector("#emailDomain").value,
    name: signupForm.querySelector("#adminName").value,
    email: signupForm.querySelector("#adminEmail").value,
    phone: signupForm.querySelector("#adminPhone").value,
    password: signupForm.querySelector("#signupPassword").value,
  };

  try {
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(instituteData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Something went wrong');
    customAlert(data.message, "Registration Submitted");
    showLogin();
  } catch (error) {
    customAlert(error.message, "Registration Failed");
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const loginForm = e.target;
  const loginData = {
    email: loginForm.querySelector("#email").value,
    password: loginForm.querySelector("#password").value,
    role: loginForm.querySelector("#role").value,
  };

  try {
    const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
    }
    
    const data = await response.json();
    currentUser = data;
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));

    switch(currentUser.role) {
        case 'admin': enterAdmin(); break;
        case 'hod': enterHOD(); break;
        case 'faculty': enterFaculty(); break;
        case 'coordinator': enterCoordinator(); break;
        default:
            customAlert("Login successful, but your role is not recognized.", "Welcome!");
            backToLanding();
    }
  } catch (error) {
    customAlert(error.message, "Login Failed");
  }
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem('currentUser');
  showOnly(["landing"]);
}

// --- Dashboard Rendering ---
function buildDashboard(containerId, sidebarItems, title) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const layout = document.getElementById("dashboardLayoutTemplate").content.cloneNode(true);
    container.innerHTML = '';
    container.appendChild(layout);
    document.getElementById("dashboardTitle").textContent = title;
    
    const nav = document.getElementById("sidebarNav");
    sidebarItems.forEach((item, index) => {
        const button = document.createElement("button");
        button.className = `w-full text-left px-4 py-2.5 rounded-md font-medium transition-colors ${index === 0 ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}`;
        button.textContent = item.label;
        button.onclick = () => {
            nav.querySelectorAll('button').forEach(btn => btn.classList.remove('bg-cyan-500/10', 'text-cyan-300'));
            button.classList.add('bg-cyan-500/10', 'text-cyan-300');
            item.onClick();
        };
        nav.appendChild(button);
    });
}

// --- Superadmin Panel ---
async function showSuperadmin() {
    buildDashboard("superadminDashboard", [
        { label: "Pending Requests", onClick: renderSA_Pending },
    ], "Superadmin Panel");
    showOnly(["superadminDashboard"]);
    renderSA_Pending();
}

async function renderSA_Pending() {
    const contentArea = document.getElementById("dashboardContent");
    contentArea.innerHTML = `<h3 class="text-xl font-semibold text-slate-200 mb-4">Loading...</h3>`;
    try {
        const response = await fetch(`${API_URL}/users/pending`);
        if (!response.ok) {
            await handleApiError(response);
            return;
        }
        const pendingAdmins = await response.json();
        
        contentArea.innerHTML = `<h3 class="text-xl font-semibold text-slate-200 mb-4">Pending Admin Requests</h3>`;
        if (pendingAdmins.length === 0) {
            contentArea.innerHTML += `<div class="p-4 bg-slate-800 rounded-lg border border-slate-700 text-slate-400">No pending requests.</div>`;
            return;
        }
        const listHtml = pendingAdmins.map(user => `
            <div class="p-4 bg-slate-800 rounded-lg border border-slate-700 flex justify-between items-center">
                <div>
                    <p class="font-semibold text-slate-100">${escapeHtml(user.instituteName)}</p>
                    <p class="text-sm text-slate-400">${escapeHtml(user.name)} (${escapeHtml(user.email)})</p>
                </div>
                <button class="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-md font-semibold text-sm" onclick="approveInstitute('${user._id}')">Approve</button>
            </div>`).join('');
        contentArea.innerHTML += `<div class="space-y-3">${listHtml}</div>`;
    } catch (error) {
        contentArea.innerHTML = `<div class="p-4 bg-red-900/50 rounded-lg border border-red-700 text-red-300">${error.message}</div>`;
    }
}

async function approveInstitute(userId) {
    try {
        const response = await fetch(`${API_URL}/users/${userId}/approve`, { method: 'PUT' });
        if (!response.ok) {
            await handleApiError(response);
            return;
        }
        const data = await response.json();
        customAlert(data.message, "Approval Successful");
        renderSA_Pending();
    } catch (error) {
        customAlert(error.message, "Approval Failed");
    }
}

// --- Dashboard Entry Points ---
function enterAdmin() {
    buildDashboard("adminDashboard", [
        { label: "Manage Users", onClick: showUserManagementView },
        { label: "All Documents", onClick: showDocumentManagementView },
        { label: "Generate Report", onClick: showReportView },
    ], `Admin: ${currentUser.name}`);
    showOnly(["adminDashboard"]);
    showUserManagementView();
}

function enterHOD() {
    buildDashboard("hodDashboard", [
        { label: "My Tasks", onClick: showGuidedUploadView },
        { label: "Review Faculty Docs", onClick: showFacultyReviewView },
    ], `HOD: ${currentUser.name}`);
    showOnly(["hodDashboard"]);
    showGuidedUploadView();
}

function enterFaculty() {
    buildDashboard("facultyDashboard", [
        { label: "My Tasks", onClick: showGuidedUploadView },
    ], `Faculty: ${currentUser.name}`);
    showOnly(["facultyDashboard"]);
    showGuidedUploadView();
}

function enterCoordinator() {
    buildDashboard("coordinatorDashboard", [
        { label: "My Tasks", onClick: showGuidedUploadView },
        { label: "Review HOD Docs", onClick: showHodReviewView },
    ], `Coordinator: ${currentUser.name}`);
    showOnly(["coordinatorDashboard"]);
    showGuidedUploadView();
}

// --- Admin: User Management ---
function showUserManagementView() {
    const contentArea = document.getElementById("dashboardContent");
    contentArea.innerHTML = `<div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-semibold text-slate-200">Institute User Management</h3>
        <button class="px-4 py-2 rounded-md bg-cyan-500 text-slate-900 font-semibold text-sm" onclick="showCreateUserModal()">+ Create User</button>
    </div>
    <div id="userListContainer"></div>`;
    renderAD_UsersList();
}

async function renderAD_UsersList() {
    const userListContainer = document.getElementById('userListContainer');
    userListContainer.innerHTML = 'Loading users...';
    try {
        const response = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${currentUser.token}` }
        });
        if (!response.ok) {
            await handleApiError(response);
            return;
        }
        const users = await response.json();
        if (users.length <= 1) {
            userListContainer.innerHTML = `<div class="p-4 bg-slate-800 rounded-lg border border-slate-700 text-slate-400">No other users found.</div>`;
            return;
        }
        const tableHtml = `
            <div class="overflow-x-auto border border-slate-700 rounded-lg bg-slate-800">
                <table class="min-w-full text-sm">
                    <thead class="bg-slate-900/50">
                        <tr>
                            <th class="text-left p-3 font-semibold">Name</th><th class="text-left p-3 font-semibold">Email</th>
                            <th class="text-left p-3 font-semibold">Role</th><th class="text-left p-3 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-700">
                        ${users.map(user => `
                            <tr class="hover:bg-slate-700/30">
                                <td class="p-3 font-medium text-slate-200">${escapeHtml(user.name)}</td>
                                <td class="p-3 text-slate-400">${escapeHtml(user.email)}</td>
                                <td class="p-3 text-slate-400 capitalize">${escapeHtml(user.role)}</td>
                                <td class="p-3"><span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.approved ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}">${user.approved ? 'Active' : 'Pending'}</span></td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>`;
        userListContainer.innerHTML = tableHtml;
    } catch (error) {
        userListContainer.innerHTML = `<div class="p-4 bg-red-900/50 rounded-lg border border-red-700 text-red-300">${error.message}</div>`;
    }
}

function showCreateUserModal() {
    const modalHTML = `
        <div id="createUserModal" class="modal-backdrop fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div class="w-full max-w-md rounded-xl bg-slate-800 border border-slate-700 p-6 shadow-2xl">
                <h3 class="text-lg font-semibold text-slate-100">Create New User</h3>
                <form id="createUserForm" class="mt-4 space-y-4">
                    <input id="newUserName" class="w-full rounded-md bg-slate-900/50 border border-slate-600 px-3 py-2" placeholder="Full Name" required>
                    <input id="newUserEmail" type="email" class="w-full rounded-md bg-slate-900/50 border border-slate-600 px-3 py-2" placeholder="Email Address" required>
                    <input id="newUserPassword" type="password" class="w-full rounded-md bg-slate-900/50 border border-slate-600 px-3 py-2" placeholder="Temporary Password" required>
                    <select id="newUserRole" class="w-full rounded-md bg-slate-900/50 border border-slate-600 px-3 py-2 appearance-none" required>
                        <option value="">Select Role</option><option value="coordinator">Coordinator</option>
                        <option value="hod">HOD</option><option value="faculty">Faculty</option>
                    </select>
                    <div class="flex justify-end gap-3 pt-3">
                        <button type="button" onclick="closeModal('createUserModal')" class="px-4 py-2 rounded-md border border-slate-600 text-slate-300 hover:bg-slate-700 transition">Cancel</button>
                        <button type="submit" class="px-4 py-2 rounded-md bg-cyan-500 text-slate-900 font-semibold hover:bg-cyan-400 transition">Create User</button>
                    </div>
                </form>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('createUserForm').addEventListener('submit', handleCreateUser);
}

async function handleCreateUser(e) {
    e.preventDefault();
    const userData = {
        name: document.getElementById('newUserName').value,
        email: document.getElementById('newUserEmail').value,
        password: document.getElementById('newUserPassword').value,
        role: document.getElementById('newUserRole').value,
    };
    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentUser.token}` },
            body: JSON.stringify(userData)
        });
        if (!response.ok) {
            await handleApiError(response);
            return;
        }
        const data = await response.json();
        customAlert(`User "${data.name}" created successfully.`, "User Created");
        closeModal('createUserModal');
        renderAD_UsersList();
    } catch (error) {
        customAlert(error.message, "Creation Failed");
    }
}

// --- Guided Upload & Progress Tracker ---
async function showGuidedUploadView() {
    const contentArea = document.getElementById("dashboardContent");
    contentArea.innerHTML = `<h3 class="text-xl font-semibold text-slate-200 mb-4">My Assigned Tasks</h3>
    <div id="guidedTaskList">Loading tasks...</div>`;
    
    try {
        const requiredDocs = DOCUMENT_CATEGORIES[currentUser.role] || [];
        if (requiredDocs.length === 0) {
            contentArea.innerHTML = `<div class="p-4 bg-slate-800 rounded-lg border border-slate-700 text-slate-400">No tasks assigned to your role.</div>`;
            updateProgressTracker(0, 0);
            return;
        }

        const response = await fetch(`${API_URL}/documents`, {
            headers: { 'Authorization': `Bearer ${currentUser.token}` }
        });
        if (!response.ok) {
            await handleApiError(response);
            return;
        }
        const uploadedDocs = await response.json();

        let completedCount = 0;
        const taskListHtml = requiredDocs.map(task => {
            const fullCategoryName = `${task.body}: ${task.name}`;
            const uploadedDoc = uploadedDocs.find(doc => doc.category === fullCategoryName);
            
            if (uploadedDoc) completedCount++;

            return `
                <div class="p-4 bg-slate-800 rounded-lg border border-slate-700 flex justify-between items-center">
                    <div>
                        <p class="font-semibold text-slate-100">${escapeHtml(fullCategoryName)}</p>
                        <p class="text-sm ${uploadedDoc ? 'text-green-400' : 'text-yellow-400'}">
                            Status: ${uploadedDoc ? `Uploaded (${uploadedDoc.status})` : 'Pending'}
                        </p>
                    </div>
                    ${!uploadedDoc ? 
                        `<button class="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-md font-semibold text-sm" onclick="showUploadDocumentModal('${fullCategoryName}')">Upload</button>` :
                        `<a href="http://localhost:5000${uploadedDoc.filePath.replace(/\\/g, '/')}" target="_blank" class="text-cyan-400 hover:underline text-sm font-semibold">View File</a>`
                    }
                </div>
            `;
        }).join('');

        document.getElementById('guidedTaskList').innerHTML = `<div class="space-y-3">${taskListHtml}</div>`;
        updateProgressTracker(completedCount, requiredDocs.length);

    } catch (error) {
        contentArea.innerHTML = `<div class="p-4 bg-red-900/50 rounded-lg border border-red-700 text-red-300">${error.message}</div>`;
    }
}

function updateProgressTracker(completed, total) {
    const progressTracker = document.getElementById('progressTracker');
    if (!progressTracker) return;

    if (total === 0) {
        progressTracker.innerHTML = '';
        return;
    }

    const percentage = Math.round((completed / total) * 100);
    progressTracker.innerHTML = `
        <span class="text-sm font-medium text-slate-300">Progress: ${completed}/${total}</span>
        <div class="w-32 bg-slate-700 rounded-full h-2.5">
            <div class="bg-cyan-500 h-2.5 rounded-full" style="width: ${percentage}%"></div>
        </div>
        <span class="text-sm font-bold text-cyan-400">${percentage}%</span>
    `;
}

// --- Document Management (for Admin) ---
function showDocumentManagementView() {
    const contentArea = document.getElementById("dashboardContent");
    const title = 'All Institute Documents';
    contentArea.innerHTML = `<div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-semibold text-slate-200">${title}</h3>
    </div>
    <div id="docListContainer"></div>`;
    renderDocumentList();
}

async function renderDocumentList() {
    const docListContainer = document.getElementById('docListContainer');
    docListContainer.innerHTML = 'Loading documents...';
    try {
        const response = await fetch(`${API_URL}/documents`, {
            headers: { 'Authorization': `Bearer ${currentUser.token}` }
        });
        if (!response.ok) {
            await handleApiError(response);
            return;
        }
        const documents = await response.json();
        if (documents.length === 0) {
            docListContainer.innerHTML = `<div class="p-4 bg-slate-800 rounded-lg border border-slate-700 text-slate-400">No documents found.</div>`;
            return;
        }
        const statusColors = {
            'Pending HOD Approval': 'bg-yellow-500/20 text-yellow-300',
            'Pending Coordinator Approval': 'bg-blue-500/20 text-blue-300',
            'Approved': 'bg-green-500/20 text-green-300',
            'Rejected': 'bg-red-500/20 text-red-300',
        };
        const tableHtml = `
            <div class="overflow-x-auto border border-slate-700 rounded-lg bg-slate-800">
                <table class="min-w-full text-sm">
                    <thead class="bg-slate-900/50">
                        <tr>
                            <th class="text-left p-3 font-semibold">Title</th><th class="text-left p-3 font-semibold">Category</th>
                            <th class="text-left p-3 font-semibold">Owner</th><th class="text-left p-3 font-semibold">Status</th>
                            <th class="text-left p-3 font-semibold">View File</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-700">
                        ${documents.map(doc => `
                            <tr class="hover:bg-slate-700/30">
                                <td class="p-3 font-medium text-slate-200">${escapeHtml(doc.title)}</td>
                                <td class="p-3 text-slate-400">${escapeHtml(doc.category)}</td>
                                <td class="p-3 text-slate-400">${doc.owner ? escapeHtml(doc.owner.name) : 'N/A'}</td>
                                <td class="p-3"><span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[doc.status] || 'bg-gray-500/20 text-gray-300'}">${escapeHtml(doc.status)}</span></td>
                                <td class="p-3"><a href="http://localhost:5000${doc.filePath.replace(/\\/g, '/')}" target="_blank" class="text-cyan-400 hover:underline">View</a></td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>`;
        docListContainer.innerHTML = tableHtml;
    } catch (error) {
        docListContainer.innerHTML = `<div class="p-4 bg-red-900/50 rounded-lg border border-red-700 text-red-300">${error.message}</div>`;
    }
}

function showUploadDocumentModal(prefilledCategory = '') {
    const userCategories = DOCUMENT_CATEGORIES[currentUser.role] || [];
    const categoryOptions = userCategories.map(cat => {
        const fullCategoryName = `${cat.body}: ${cat.name}`;
        return `<option value="${fullCategoryName}" ${fullCategoryName === prefilledCategory ? 'selected' : ''}>${fullCategoryName}</option>`
    }).join('');

    const modalHTML = `
        <div id="uploadDocModal" class="modal-backdrop fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div class="w-full max-w-md rounded-xl bg-slate-800 border border-slate-700 p-6 shadow-2xl">
                <h3 class="text-lg font-semibold text-slate-100">Upload New Document</h3>
                <form id="uploadDocForm" class="mt-4 space-y-4">
                    <input id="docTitle" class="w-full rounded-md bg-slate-900/50 border border-slate-600 px-3 py-2" placeholder="Document Title" required>
                    <select id="docCategory" class="w-full rounded-md bg-slate-900/50 border border-slate-600 px-3 py-2 appearance-none" required ${prefilledCategory ? 'disabled' : ''}>
                        <option value="">Select a Category</option>
                        ${categoryOptions}
                    </select>
                    <div>
                        <label for="docFile" class="text-sm font-medium text-slate-400">Select File (PDF Only)</label>
                        <input id="docFile" type="file" accept=".pdf" class="mt-1 w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/10 file:text-cyan-300 hover:file:bg-cyan-500/20" required>
                    </div>
                    <div class="flex justify-end gap-3 pt-3">
                        <button type="button" onclick="closeModal('uploadDocModal')" class="px-4 py-2 rounded-md border border-slate-600 text-slate-300 hover:bg-slate-700 transition">Cancel</button>
                        <button type="submit" class="px-4 py-2 rounded-md bg-cyan-500 text-slate-900 font-semibold hover:bg-cyan-400 transition">Upload</button>
                    </div>
                </form>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('uploadDocForm').addEventListener('submit', handleCreateDocument);
}

async function handleCreateDocument(e) {
    e.preventDefault();
    const form = e.target;
    const fileInput = form.querySelector('#docFile');
    const file = fileInput.files[0];
    if (!file) return customAlert("Please select a file to upload.", "File Required");
    if (file.type !== 'application/pdf') return customAlert("Only PDF files are allowed for this feature.", "Invalid File Type");

    const formData = new FormData();
    formData.append('document', file);

    try {
        const uploadRes = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${currentUser.token}` },
            body: formData,
        });
        if (!uploadRes.ok) {
            await handleApiError(uploadRes);
            return;
        }
        const uploadData = await uploadRes.json();

        const docData = {
            title: form.querySelector('#docTitle').value,
            category: form.querySelector('#docCategory').value,
            filePath: uploadData.filePath,
        };

        const docRes = await fetch(`${API_URL}/documents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentUser.token}` },
            body: JSON.stringify(docData)
        });
        if (!docRes.ok) {
            await handleApiError(docRes);
            return;
        }
        const newDoc = await docRes.json();

        customAlert(`Document "${newDoc.title}" uploaded successfully.`, "Upload Successful");
        closeModal('uploadDocModal');
        showGuidedUploadView();
    } catch (error) {
        customAlert(error.message, "Upload Failed");
    }
}

// --- HOD: Faculty Document Review ---
function showFacultyReviewView() {
    const contentArea = document.getElementById("dashboardContent");
    contentArea.innerHTML = `<h3 class="text-xl font-semibold text-slate-200 mb-4">Review Faculty Documents</h3>
    <div id="facultyDocListContainer"></div>`;
    renderFacultyDocumentList();
}

async function renderFacultyDocumentList() {
    const docListContainer = document.getElementById('facultyDocListContainer');
    docListContainer.innerHTML = 'Loading faculty documents...';
    try {
        const response = await fetch(`${API_URL}/documents/faculty`, {
            headers: { 'Authorization': `Bearer ${currentUser.token}` }
        });
        if (!response.ok) {
            await handleApiError(response);
            return;
        }
        const documents = await response.json();
        if (documents.length === 0) {
            docListContainer.innerHTML = `<div class="p-4 bg-slate-800 rounded-lg border border-slate-700 text-slate-400">No documents submitted by faculty yet.</div>`;
            return;
        }
        
        const statusColors = {
            'Pending HOD Approval': 'bg-yellow-500/20 text-yellow-300',
            'Pending Coordinator Approval': 'bg-blue-500/20 text-blue-300',
            'Approved': 'bg-green-500/20 text-green-300',
            'Rejected': 'bg-red-500/20 text-red-300',
        };

        const tableHtml = `
            <div class="overflow-x-auto border border-slate-700 rounded-lg bg-slate-800">
                <table class="min-w-full text-sm">
                    <thead class="bg-slate-900/50">
                        <tr>
                            <th class="text-left p-3 font-semibold">Title</th><th class="text-left p-3 font-semibold">Owner</th>
                            <th class="text-left p-3 font-semibold">Status</th><th class="text-left p-3 font-semibold">View File</th>
                            <th class="text-left p-3 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-700">
                        ${documents.map(doc => `
                            <tr class="hover:bg-slate-700/30">
                                <td class="p-3 font-medium text-slate-200">${escapeHtml(doc.title)}</td>
                                <td class="p-3 text-slate-400">${doc.owner ? escapeHtml(doc.owner.name) : 'N/A'}</td>
                                <td class="p-3"><span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[doc.status] || 'bg-gray-500/20 text-gray-300'}">${escapeHtml(doc.status)}</span></td>
                                <td class="p-3"><a href="http://localhost:5000${doc.filePath.replace(/\\/g, '/')}" target="_blank" class="text-cyan-400 hover:underline">View</a></td>
                                <td class="p-3 space-x-2">
                                    <button class="px-2.5 py-1 rounded-md border border-slate-600 hover:bg-green-500/20 text-xs" onclick="updateStatus('${doc._id}', 'Approved', 'faculty')">Approve</button>
                                    <button class="px-2.5 py-1 rounded-md border border-slate-600 hover:bg-red-500/20 text-xs" onclick="updateStatus('${doc._id}', 'Rejected', 'faculty')">Reject</button>
                                </td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>`;
        docListContainer.innerHTML = tableHtml;
    } catch (error) {
        docListContainer.innerHTML = `<div class="p-4 bg-red-900/50 rounded-lg border border-red-700 text-red-300">${error.message}</div>`;
    }
}

// --- Coordinator: HOD Document Review ---
function showHodReviewView() {
    const contentArea = document.getElementById("dashboardContent");
    contentArea.innerHTML = `<h3 class="text-xl font-semibold text-slate-200 mb-4">Review HOD & Approved Documents</h3>
    <div id="hodDocListContainer"></div>`;
    renderHodDocumentList();
}

async function renderHodDocumentList() {
    const docListContainer = document.getElementById('hodDocListContainer');
    docListContainer.innerHTML = 'Loading documents for review...';
    try {
        const response = await fetch(`${API_URL}/documents/hod-approved`, {
            headers: { 'Authorization': `Bearer ${currentUser.token}` }
        });
        if (!response.ok) {
            await handleApiError(response);
            return;
        }
        const documents = await response.json();
        if (documents.length === 0) {
            docListContainer.innerHTML = `<div class="p-4 bg-slate-800 rounded-lg border border-slate-700 text-slate-400">No documents are currently awaiting your review.</div>`;
            return;
        }
        
        const statusColors = {
            'Pending HOD Approval': 'bg-yellow-500/20 text-yellow-300',
            'Pending Coordinator Approval': 'bg-blue-500/20 text-blue-300',
            'Approved': 'bg-green-500/20 text-green-300',
            'Rejected': 'bg-red-500/20 text-red-300',
        };

        const tableHtml = `
            <div class="overflow-x-auto border border-slate-700 rounded-lg bg-slate-800">
                <table class="min-w-full text-sm">
                    <thead class="bg-slate-900/50">
                        <tr>
                            <th class="text-left p-3 font-semibold">Title</th><th class="text-left p-3 font-semibold">Owner</th>
                            <th class="text-left p-3 font-semibold">Status</th><th class="text-left p-3 font-semibold">View File</th>
                            <th class="text-left p-3 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-700">
                        ${documents.map(doc => `
                            <tr class="hover:bg-slate-700/30">
                                <td class="p-3 font-medium text-slate-200">${escapeHtml(doc.title)}</td>
                                <td class="p-3 text-slate-400">${doc.owner ? escapeHtml(doc.owner.name) : 'N/A'}</td>
                                <td class="p-3"><span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[doc.status] || 'bg-gray-500/20 text-gray-300'}">${escapeHtml(doc.status)}</span></td>
                                <td class="p-3"><a href="http://localhost:5000${doc.filePath.replace(/\\/g, '/')}" target="_blank" class="text-cyan-400 hover:underline">View</a></td>
                                <td class="p-3 space-x-2">
                                    <button class="px-2.5 py-1 rounded-md border border-slate-600 hover:bg-green-500/20 text-xs" onclick="updateStatus('${doc._id}', 'Approved', 'hod')">Final Approve</button>
                                    <button class="px-2.5 py-1 rounded-md border border-slate-600 hover:bg-red-500/20 text-xs" onclick="updateStatus('${doc._id}', 'Rejected', 'hod')">Reject</button>
                                </td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>`;
        docListContainer.innerHTML = tableHtml;
    } catch (error) {
        docListContainer.innerHTML = `<div class="p-4 bg-red-900/50 rounded-lg border border-red-700 text-red-300">${error.message}</div>`;
    }
}

// --- Admin: Reporting ---
function showReportView() {
    const contentArea = document.getElementById("dashboardContent");
    contentArea.innerHTML = `<div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-semibold text-slate-200">Generate Final Reports</h3>
    </div>
    <div id="reportActionsContainer" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Buttons will be generated here -->
    </div>`;
    renderReportActions();
}

function renderReportActions() {
    const container = document.getElementById('reportActionsContainer');
    const accreditationBodies = ['NAAC', 'NBA', 'NIRF']; // Define the bodies you support
    
    const actionButtonsHtml = accreditationBodies.map(body => `
        <div class="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h4 class="font-semibold text-lg text-slate-100">${body} Report</h4>
            <p class="text-sm text-slate-400 mt-1">Download a consolidated PDF booklet of all approved ${body} documents.</p>
            <button class="mt-4 px-4 py-2 rounded-md bg-cyan-500 text-slate-900 font-semibold text-sm w-full" onclick="downloadMergedPdfReport('${body}')">
                Download ${body} PDF
            </button>
        </div>
    `).join('');

    container.innerHTML = actionButtonsHtml;
}

async function downloadMergedPdfReport(body) {
    customAlert(`Generating ${body} PDF booklet... This may take a moment.`, "Report Generation");
    try {
        const response = await fetch(`${API_URL}/documents/report/pdf/${body}`, {
            headers: { 'Authorization': `Bearer ${currentUser.token}` }
        });
        
        if (!response.ok) {
            // Check for a specific "not found" message from the server
            if (response.status === 404) {
                const errorData = await response.json();
                throw new Error(errorData.message || `No approved ${body} documents found.`);
            }
            await handleApiError(response);
            return;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `AccrediFlow-Report-${body}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch (error) {
        customAlert(error.message, "PDF Download Failed");
    }
}


async function updateStatus(docId, status, reviewType) {
    try {
        const response = await fetch(`${API_URL}/documents/${docId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentUser.token}` },
            body: JSON.stringify({ status })
        });
        if (!response.ok) {
            await handleApiError(response);
            return;
        }
        const data = await response.json();
        
        customAlert(`Document status updated to "${data.status}".`, "Update Successful");
        
        if (reviewType === 'faculty') {
            renderFacultyDocumentList();
        } else if (reviewType === 'hod') {
            renderHodDocumentList();
        }
    } catch (error) {
        customAlert(error.message, "Update Failed");
    }
}


function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.remove();
}

// --- Initial Load ---
document.addEventListener("DOMContentLoaded", () => {
    if (currentUser && currentUser.token) {
        switch(currentUser.role) {
            case 'admin': enterAdmin(); break;
            case 'hod': enterHOD(); break;
            case 'faculty': enterFaculty(); break;
            case 'coordinator': enterCoordinator(); break;
            default: showOnly(["landing"]);
        }
    } else {
        showOnly(["landing"]);
    }
});
