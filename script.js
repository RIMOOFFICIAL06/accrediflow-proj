/* ===================================================
   AccrediFlow Full-Stack Frontend Script
   Connects to the Node.js/Express backend API
   =================================================== */

// --- API Configuration ---
const API_URL = 'http://localhost:5000/api'; // Base URL for your backend

// --- App State (session-based) ---
let currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || null;

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

// --- Core Logic: Signup, Login, Logout (with API Calls) ---
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
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login failed');
    
    currentUser = data;
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Direct user to the correct dashboard based on their role
    switch(currentUser.role) {
        case 'admin': enterAdmin(); break;
        case 'hod': enterHOD(); break;
        case 'faculty': enterFaculty(); break;
        case 'coordinator': 
            customAlert("Login successful, but the Coordinator dashboard is not yet implemented.", "Welcome!");
            backToLanding();
            break;
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
        if (!response.ok) throw new Error('Failed to fetch pending requests.');
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
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to approve user.');
        customAlert(data.message, "Approval Successful");
        renderSA_Pending();
    } catch (error) {
        customAlert(error.message, "Approval Failed");
    }
}

// --- Admin Dashboard ---
function enterAdmin() {
    buildDashboard("adminDashboard", [
        { label: "Manage Users", onClick: showUserManagementView },
        { label: "All Documents", onClick: showDocumentManagementView },
    ], `Admin: ${currentUser.name}`);
    showOnly(["adminDashboard"]);
    showUserManagementView();
}

// --- HOD Dashboard ---
function enterHOD() {
    buildDashboard("hodDashboard", [
        { label: "My Uploads", onClick: showDocumentManagementView },
        { label: "Review Faculty Docs", onClick: () => {} },
    ], `HOD: ${currentUser.name}`);
    showOnly(["hodDashboard"]);
    showDocumentManagementView();
}

// --- Faculty Dashboard ---
function enterFaculty() {
    buildDashboard("facultyDashboard", [
        { label: "My Uploads", onClick: showDocumentManagementView },
    ], `Faculty: ${currentUser.name}`);
    showOnly(["facultyDashboard"]);
    showDocumentManagementView();
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
        if (!response.ok) throw new Error('Failed to fetch users.');
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
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to create user.');
        customAlert(`User "${data.name}" created successfully.`, "User Created");
        closeModal('createUserModal');
        renderAD_UsersList();
    } catch (error) {
        customAlert(error.message, "Creation Failed");
    }
}

// --- Document Management (for all roles) ---
function showDocumentManagementView() {
    const contentArea = document.getElementById("dashboardContent");
    const title = currentUser.role === 'admin' ? 'All Institute Documents' : 'My Document Uploads';
    contentArea.innerHTML = `<div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-semibold text-slate-200">${title}</h3>
        <button class="px-4 py-2 rounded-md bg-cyan-500 text-slate-900 font-semibold text-sm" onclick="showUploadDocumentModal()">+ Upload Document</button>
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
            const errorText = await response.text();
            throw new Error(`Failed to fetch documents: ${response.status} ${response.statusText}. Server says: ${errorText}`);
        }

        const documents = await response.json();

        if (documents.length === 0) {
            docListContainer.innerHTML = `<div class="p-4 bg-slate-800 rounded-lg border border-slate-700 text-slate-400">No documents found.</div>`;
            return;
        }
        const tableHtml = `
            <div class="overflow-x-auto border border-slate-700 rounded-lg bg-slate-800">
                <table class="min-w-full text-sm">
                    <thead class="bg-slate-900/50">
                        <tr>
                            <th class="text-left p-3 font-semibold">Title</th><th class="text-left p-3 font-semibold">Category</th>
                            <th class="text-left p-3 font-semibold">Owner</th><th class="text-left p-3 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-700">
                        ${documents.map(doc => `
                            <tr class="hover:bg-slate-700/30">
                                <td class="p-3 font-medium text-slate-200">${escapeHtml(doc.title)}</td>
                                <td class="p-3 text-slate-400">${escapeHtml(doc.category)}</td>
                                <td class="p-3 text-slate-400">${escapeHtml(doc.owner.name)}</td>
                                <td class="p-3"><span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-300">${escapeHtml(doc.status)}</span></td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>`;
        docListContainer.innerHTML = tableHtml;
    } catch (error) {
        console.error("Error fetching documents:", error);
        docListContainer.innerHTML = `<div class="p-4 bg-red-900/50 rounded-lg border border-red-700 text-red-300">Error: ${error.message}</div>`;
    }
}

function showUploadDocumentModal() {
    const modalHTML = `
        <div id="uploadDocModal" class="modal-backdrop fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div class="w-full max-w-md rounded-xl bg-slate-800 border border-slate-700 p-6 shadow-2xl">
                <h3 class="text-lg font-semibold text-slate-100">Upload New Document</h3>
                <form id="uploadDocForm" class="mt-4 space-y-4">
                    <input id="docTitle" class="w-full rounded-md bg-slate-900/50 border border-slate-600 px-3 py-2" placeholder="Document Title" required>
                    <input id="docCategory" class="w-full rounded-md bg-slate-900/50 border border-slate-600 px-3 py-2" placeholder="Category (e.g., NAAC 1.2.3)" required>
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
    const docData = {
        title: document.getElementById('docTitle').value,
        category: document.getElementById('docCategory').value,
    };
    try {
        const response = await fetch(`${API_URL}/documents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentUser.token}` },
            body: JSON.stringify(docData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to upload document.');
        customAlert(`Document "${data.title}" uploaded successfully.`, "Upload Successful");
        closeModal('uploadDocModal');
        renderDocumentList();
    } catch (error) {
        customAlert(error.message, "Upload Failed");
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
            default: showOnly(["landing"]);
        }
    } else {
        showOnly(["landing"]);
    }
});
