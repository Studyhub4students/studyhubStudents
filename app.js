// --- API SERVICE ---
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.hostname.startsWith('192.168.') || 
                    window.location.hostname.startsWith('10.') || 
                    window.location.hostname.startsWith('172.');
const API_BASE = isLocalhost
  ? `http://${window.location.hostname}:5000/api`
  : 'https://syudyhubbackend.onrender.com/api'; // CHANGE THIS TO YOUR DEPLOYED BACKEND URL ON RENDER

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Determine if sending FormData (multipart file upload) vs JSON body
  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

const api = {
  // Auth API
  async login(phone, password) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { phone, password }
    });
    if (res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
    }
    return res;
  },

  async signup(name, phone, password, role) {
    const res = await request('/auth/signup', {
      method: 'POST',
      body: { name, phone, password, role }
    });
    if (res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
    }
    return res;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (typeof stopNotificationPolling === 'function') {
      stopNotificationPolling();
    }
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  async getMe() {
    return await request('/auth/me');
  },

  async getPendingUsers() {
    return await request('/auth/pending');
  },

  async getAllUsers() {
    return await request('/auth/users');
  },

  async approveUser(userId) {
    return await request(`/auth/approve/${userId}`, { method: 'POST' });
  },

  async rejectUser(userId) {
    return await request(`/auth/reject/${userId}`, { method: 'POST' });
  },

  async deleteUser(userId) {
    return await request(`/auth/users/${userId}`, { method: 'DELETE' });
  },

  async promoteUser(userId) {
    return await request(`/auth/promote/${userId}`, { method: 'POST' });
  },

  // Folders API
  async getFolders(type, parentId = null) {
    let url = `/folders?type=${type}`;
    if (parentId !== null) {
      url += `&parentId=${parentId}`;
    } else {
      url += `&parentId=null`;
    }
    return await request(url);
  },

  async createFolder(name, type, parentId = null) {
    return await request('/folders', {
      method: 'POST',
      body: { name, type, parentId }
    });
  },

  async renameFolder(folderId, name) {
    return await request(`/folders/${folderId}`, {
      method: 'PUT',
      body: { name }
    });
  },

  async deleteFolder(folderId) {
    return await request(`/folders/${folderId}`, {
      method: 'DELETE'
    });
  },

  // Documents API
  async getDocuments(type, folderId = null) {
    let url = `/documents?type=${type}`;
    if (folderId !== null) {
      url += `&folderId=${folderId}`;
    }
    return await request(url);
  },

  async uploadDocument(formData) {
    return await request('/documents/upload', {
      method: 'POST',
      body: formData
    });
  },

  async deleteDocument(docId) {
    return await request(`/documents/${docId}`, {
      method: 'DELETE'
    });
  },

  async getMyUploads() {
    return await request('/documents/my-uploads');
  },

  async updateDocument(docId, title, subject, year) {
    return await request(`/documents/${docId}`, {
      method: 'PUT',
      body: { title, subject, year }
    });
  },

  // Announcements API
  async getAnnouncements() {
    return await request('/announcements');
  },

  async createAnnouncement(title, content) {
    return await request('/announcements', {
      method: 'POST',
      body: { title, content }
    });
  },

  async deleteAnnouncement(annId) {
    return await request(`/announcements/${annId}`, {
      method: 'DELETE'
    });
  },

  // Help & Support API
  async submitHelpRequest(subject, message) {
    return await request('/help', {
      method: 'POST',
      body: { subject, message }
    });
  },

  async getHelpRequests() {
    return await request('/help');
  },

  async resolveHelpRequest(requestId) {
    return await request(`/help/resolve/${requestId}`, {
      method: 'POST'
    });
  },

  async deleteHelpRequest(requestId) {
    return await request(`/help/${requestId}`, {
      method: 'DELETE'
    });
  },

  // Notifications API
  async sendNotification(recipientId, message) {
    return await request('/notifications', {
      method: 'POST',
      body: { recipientId, message }
    });
  },

  async getUnreadNotifications() {
    return await request('/notifications/unread');
  },

  async markNotificationRead(id) {
    return await request(`/notifications/read/${id}`, {
      method: 'POST'
    });
  },

  async getMessageTemplates() {
    return await request('/notifications/templates');
  },

  async saveMessageTemplate(name, content) {
    return await request('/notifications/templates', {
      method: 'POST',
      body: { name, content }
    });
  },

  async deleteMessageTemplate(id) {
    return await request(`/notifications/templates/${id}`, {
      method: 'DELETE'
    });
  },

  async getAllNotifications() {
    return await request('/notifications/all');
  },

  async deleteNotification(id) {
    return await request(`/notifications/${id}`, {
      method: 'DELETE'
    });
  },

  async updateNotification(id, message) {
    return await request(`/notifications/${id}`, {
      method: 'PUT',
      body: { message }
    });
  },

  async toggleLikeDocument(docId) {
    return await request(`/documents/${docId}/like`, { method: 'POST' });
  },

  async getTeacherRanking() {
    return await request('/auth/teachers/ranking');
  },

  async getTeacherStats() {
    return await request('/auth/teachers/stats');
  }
};

// --- GLOBAL APPLICATION STATE ---
let currentUser = null;
let uploadSourceMode = 'file'; // 'file' | 'link'
let currentNotesFolder = null;
let currentPapersFolder = null;
let currentResourcesFolder = null;
let currentResourcesSection = 'root'; // 'root' | 'syllabus' | 'lab_manuals' | 'lab_manuals_folder' | 'books' | 'books_folder' | 'calculator'
let roadmapFolderStack = [];
let notesFoldersList = []; // Kept in memory to populate syllabus uploads
let activeDirectoryTab = 'admin'; // 'admin' | 'teacher' | 'student'
let directoryVisibleCount = 5;
let helpRequestsVisibleCount = 5;
let notificationsVisibleCount = 5;

// GPA Calculator State
const GRADE_POINTS = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'P': 4, 'F': 0 };
let sgpaRows = [
  { id: 1, courseName: '', credits: 4, grade: 'A+' },
  { id: 2, courseName: '', credits: 3, grade: 'A' },
  { id: 3, courseName: '', credits: 3, grade: 'B+' },
  { id: 4, courseName: '', credits: 2, grade: 'A+' }
];
let cgpaRows = [
  { id: 1, semesterName: 'Semester 1', sgpa: '', credits: 20 },
  { id: 2, semesterName: 'Semester 2', sgpa: '', credits: 20 }
];

// Helper to calculate dynamic academic years
function getAcademicYears() {
  const currentYear = new Date().getFullYear();
  const startYear = 2025;
  const years = [];
  const endLimit = Math.max(currentYear + 1, 2026);
  for (let y = startYear; y < endLimit; y++) {
    years.push(`${y}-${y + 1}`);
  }
  return years.reverse(); // Newest first
}

// Generate the Folder Icon HTML
function getFolderIconSvg(color1 = '#4a90e2', color2 = '#1e56a0') {
  return `
    <svg width="68" height="68" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 5px 4px rgba(14, 56, 122, 0.15))">
      <defs>
        <linearGradient id="folder-grad-${color1.replace('#', '')}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color1}" />
          <stop offset="100%" stop-color="${color2}" />
        </linearGradient>
      </defs>
      <path d="M10 24C10 20.6863 12.6863 18 16 18H40C43.3137 18 46 20.6863 46 24V27H90C93.3137 27 96 29.6863 96 33V76C96 79.3137 93.3137 82 90 82H10C6.68629 82 4 79.3137 4 76V24C4 20.6863 6.68629 18 10 18Z" fill="url(#folder-grad-${color1.replace('#', '')})" opacity="0.85" />
      <rect x="20" y="22" width="60" height="35" rx="3" fill="#ffffff" opacity="0.95" />
      <line x1="28" y1="28" x2="72" y2="28" stroke="#d9e2ec" stroke-width="2" />
      <line x1="28" y1="36" x2="60" y2="36" stroke="#d9e2ec" stroke-width="2" />
      <line x1="28" y1="44" x2="68" y2="44" stroke="#d9e2ec" stroke-width="2" />
      <path d="M4 33C4 29.6863 6.68629 27 10 27H90C93.3137 27 96 29.6863 96 33V77C96 80.3137 93.3137 83 90 83H10C6.68629 83 4 80.3137 4 77V33Z" fill="url(#folder-grad-${color1.replace('#', '')})" />
      <path d="M10 27.5H90" stroke="#ffffff" stroke-opacity="0.25" stroke-width="1.5" />
    </svg>
  `;
}

let myUploadsDocsList = [];

function canManageDocument(doc) {
  if (!currentUser) return false;
  if (currentUser.role === 'admin' || currentUser.role === 'superadmin') return true;
  if (currentUser.role === 'educator') {
    return doc.uploadedByUserId === currentUser.id;
  }
  return false;
}

// --- DOM NAVIGATION & AUTH HELPERS ---
function updateNavbar() {
  const container = document.getElementById('nav-auth-container');
  const adminTab = document.getElementById('nav-admin');
  const mobMenu = document.getElementById('mobile-nav-menu');

  if (currentUser) {
    // Show admin dashboard tab for admin & superadmin
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
      adminTab.style.display = 'flex';
    } else {
      adminTab.style.display = 'none';
    }

    // Show My Uploads tab for staff (educators, admins, superadmins)
    const myUploadsTab = document.getElementById('nav-my-uploads');
    if (myUploadsTab) {
      if (currentUser.role === 'educator' || currentUser.role === 'admin' || currentUser.role === 'superadmin') {
        myUploadsTab.style.display = 'flex';
      } else {
        myUploadsTab.style.display = 'none';
      }
    }

    // Show Teacher Dashboard tab for educators only
    const teacherDashboardTab = document.getElementById('nav-teacher-dashboard');
    if (teacherDashboardTab) {
      if (currentUser.role === 'educator') {
        teacherDashboardTab.style.display = 'flex';
      } else {
        teacherDashboardTab.style.display = 'none';
      }
    }

    // Populate Desktop Auth State
    container.innerHTML = `
      <div class="profile-dropdown-wrapper">
        <button id="profile-trigger-btn" class="profile-dropdown-btn" type="button">
          <i data-lucide="user" style="width: 16px; height: 16px;"></i>
          <span>${escapeHTML(capitalizeName(currentUser.name))}</span>
          <i data-lucide="chevron-down" style="width: 14px; height: 14px; margin-left: 2px; opacity: 0.7;"></i>
        </button>
        <div class="profile-dropdown-menu" id="profile-dropdown-menu">
          <div class="profile-info-header">
            <div class="profile-name">${escapeHTML(capitalizeName(currentUser.name))}</div>
            <div class="profile-phone">
              <i data-lucide="phone" style="width: 12px; height: 12px;"></i>
              ${escapeHTML(currentUser.phone)}
            </div>
          </div>
          <div class="profile-role-container">
            <span class="profile-role-label">Role:</span>
            <span class="profile-role-badge">
              ${currentUser.role === 'superadmin' ? 'Super Admin' : (currentUser.role === 'educator' ? 'Educator' : currentUser.role)}
            </span>
          </div>
          <button id="btn-logout" class="btn btn-danger btn-sm profile-logout-btn" style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px;">
            <i data-lucide="log-out" style="width: 14px; height: 14px;"></i> Logout
          </button>
        </div>
      </div>
    `;

    // Click handler to toggle showing on click (for mobile-tablet or explicit click behavior)
    const trigger = document.getElementById('profile-trigger-btn');
    const menu = document.getElementById('profile-dropdown-menu');
    if (trigger && menu) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
      });
      document.addEventListener('click', () => {
        menu.classList.remove('show');
      });
      menu.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    document.getElementById('btn-logout').addEventListener('click', () => {
      api.logout();
      currentUser = null;
      updateNavbar();
      navigate('#/');
    });

    // Populate Mobile Menu
    mobMenu.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 4px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
        <div style="display: flex; flex-direction: column;">
          <span style="font-weight: 700; font-size: 16px; color: var(--text-main); line-height: 1.2;">${escapeHTML(capitalizeName(currentUser.name))}</span>
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 500; text-transform: uppercase; margin-top: 2px;">Role: ${currentUser.role === 'superadmin' ? 'Super Admin' : currentUser.role}</span>
        </div>
        <button id="btn-close-mobile-menu" class="btn-close-mobile-menu" style="margin: 0; padding: 4px;" aria-label="Close Menu">
          <i data-lucide="x" style="width: 20px; height: 20px;"></i>
        </button>
      </div>
      <div style="font-size: 13px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; margin-bottom: 4px; margin-left: 4px;">
        <i data-lucide="phone" style="width: 12px; height: 12px;"></i> ${escapeHTML(currentUser.phone)}
      </div>
      <div class="mobile-nav-links">
        <a href="#/" class="mobile-nav-link" id="mob-nav-home"><i data-lucide="home" style="width: 18px; height: 18px;"></i> Home</a>
        <a href="#/notes" class="mobile-nav-link" id="mob-nav-notes"><i data-lucide="book-open" style="width: 18px; height: 18px;"></i> Notes</a>
        <a href="#/papers" class="mobile-nav-link" id="mob-nav-papers"><i data-lucide="file-text" style="width: 18px; height: 18px;"></i> Papers</a>
        <a href="#/resources" class="mobile-nav-link" id="mob-nav-resources"><i data-lucide="compass" style="width: 18px; height: 18px;"></i> Resources</a>
        <a href="#/support" class="mobile-nav-link" id="mob-nav-support"><i data-lucide="help-circle" style="width: 18px; height: 18px;"></i> Help & Support</a>
        ${(currentUser.role === 'educator' || currentUser.role === 'admin' || currentUser.role === 'superadmin') ? `
          <a href="#/my-uploads" class="mobile-nav-link" id="mob-nav-my-uploads"><i data-lucide="folder-heart" style="width: 18px; height: 18px;"></i> My Uploads</a>
        ` : ''}
        ${currentUser.role === 'educator' ? `
          <a href="#/teacher-dashboard" class="mobile-nav-link" id="mob-nav-teacher-dashboard"><i data-lucide="presentation" style="width: 18px; height: 18px;"></i> Teacher Dashboard</a>
        ` : ''}
        ${(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? `
          <a href="#/admin" class="mobile-nav-link" id="mob-nav-admin"><i data-lucide="shield-alert" style="width: 18px; height: 18px;"></i> Admin</a>
        ` : ''}
      </div>
      <button id="btn-mobile-logout" class="btn btn-danger" style="margin-top: auto; width: 100%;">
        <i data-lucide="log-out" style="width: 18px; height: 18px;"></i> Logout
      </button>
    `;

    // Click handler for Close Button inside Mobile Drawer
    const btnClose = document.getElementById('btn-close-mobile-menu');
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        mobMenu.classList.remove('open');
        const overlay = document.getElementById('mobile-nav-overlay');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = ''; // RESTORE PAGE SCROLL
      });
    }

    document.getElementById('btn-mobile-logout').addEventListener('click', () => {
      api.logout();
      currentUser = null;
      document.body.style.overflow = '';
      updateNavbar();
      navigate('#/');
    });

  } else {
    adminTab.style.display = 'none';
    const myUploadsTab = document.getElementById('nav-my-uploads');
    if (myUploadsTab) myUploadsTab.style.display = 'none';
    
    // Populate Desktop Auth State (Logged out)
    container.innerHTML = `
      <div style="display: flex; gap: 8px; margin-left: 12px;">
        <a href="#/login" class="nav-link">Login</a>
        <a href="#/signup" class="btn btn-primary btn-sm">Sign Up</a>
      </div>
    `;

    // Populate Mobile Menu (Logged out)
    mobMenu.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 8px;">
        <span style="font-weight: 800; font-size: 18px; color: var(--primary-dark);">Studyhub</span>
        <button id="btn-close-mobile-menu" class="btn-close-mobile-menu" style="margin: 0; padding: 4px;" aria-label="Close Menu">
          <i data-lucide="x" style="width: 20px; height: 20px;"></i>
        </button>
      </div>
      <div class="mobile-nav-links">
        <a href="#/" class="mobile-nav-link" id="mob-nav-home"><i data-lucide="home" style="width: 18px; height: 18px;"></i> Home</a>
        <a href="#/notes" class="mobile-nav-link" id="mob-nav-notes"><i data-lucide="book-open" style="width: 18px; height: 18px;"></i> Notes</a>
        <a href="#/papers" class="mobile-nav-link" id="mob-nav-papers"><i data-lucide="file-text" style="width: 18px; height: 18px;"></i> Papers</a>
        <a href="#/resources" class="mobile-nav-link" id="mob-nav-resources"><i data-lucide="compass" style="width: 18px; height: 18px;"></i> Resources</a>
        <a href="#/support" class="mobile-nav-link" id="mob-nav-support"><i data-lucide="help-circle" style="width: 18px; height: 18px;"></i> Help & Support</a>
      </div>
      <div style="display: flex; gap: 8px; margin-top: auto; width: 100%;">
        <a href="#/login" class="nav-link btn btn-secondary" style="flex: 1; text-align: center; justify-content: center; padding: 10px 0;">Login</a>
        <a href="#/signup" class="btn btn-primary" style="flex: 1; text-align: center; justify-content: center; padding: 10px 0;">Sign Up</a>
      </div>
    `;

    // Click handler for Close Button inside Mobile Drawer (Logged out)
    const btnClose = document.getElementById('btn-close-mobile-menu');
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        mobMenu.classList.remove('open');
        const overlay = document.getElementById('mobile-nav-overlay');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = ''; // RESTORE PAGE SCROLL
      });
    }
  }
  lucide.createIcons();
}

function handleAuthProtection(hash) {
  const publicRoutes = ['#/login', '#/signup'];
  if (!publicRoutes.includes(hash) && !currentUser) {
    navigate('#/login');
    return false;
  }
  if (hash === '#/admin' && currentUser && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
    navigate('#/');
    return false;
  }
  if (hash === '#/my-uploads' && currentUser && currentUser.role !== 'educator' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
    navigate('#/');
    return false;
  }
  if (hash === '#/teacher-dashboard' && currentUser && currentUser.role !== 'educator') {
    navigate('#/');
    return false;
  }
  return true;
}

function navigate(hash) {
  window.location.hash = hash;
}

// --- ROUTER ENGINE ---
async function router() {
  const hash = window.location.hash || '#/';
  
  // Update navbar active state
  document.querySelectorAll('.nav-links .nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === hash) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Update mobile navbar active state
  document.querySelectorAll('.mobile-nav-menu .mobile-nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === hash) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Close mobile nav menu when navigating
  const mobMenu = document.getElementById('mobile-nav-menu');
  if (mobMenu) {
    mobMenu.classList.remove('open');
  }
  const mobOverlay = document.getElementById('mobile-nav-overlay');
  if (mobOverlay) {
    mobOverlay.classList.remove('open');
  }
  document.body.style.overflow = ''; // RESTORE PAGE SCROLL

  // Run protection check
  if (!handleAuthProtection(hash)) return;

  // Toggle page visibility
  document.querySelectorAll('.page-view').forEach(view => {
    view.style.display = 'none';
  });

  // Close any open modals when navigating
  closeAllModals();

  if (hash === '#/' || hash === '#') {
    document.getElementById('view-home').style.display = 'block';
    await renderHomeView();
  } else if (hash === '#/login') {
    if (currentUser) return navigate('#/');
    document.getElementById('view-login').style.display = 'block';
    document.getElementById('login-error-alert').style.display = 'none';
  } else if (hash === '#/signup') {
    if (currentUser) return navigate('#/');
    document.getElementById('view-signup').style.display = 'block';
    document.getElementById('signup-error-alert').style.display = 'none';
    document.getElementById('signup-success-alert').style.display = 'none';
    document.getElementById('form-signup').style.display = 'block';
  } else if (hash === '#/notes') {
    document.getElementById('view-notes').style.display = 'block';
    await renderNotesView();
  } else if (hash === '#/papers') {
    document.getElementById('view-papers').style.display = 'block';
    await renderPapersView();
  } else if (hash === '#/resources') {
    document.getElementById('view-resources').style.display = 'block';
    await renderResourcesView();
  } else if (hash === '#/admin') {
    directoryVisibleCount = 5;
    helpRequestsVisibleCount = 5;
    notificationsVisibleCount = 5;
    document.getElementById('view-admin').style.display = 'block';
    await renderAdminDashboardView();
  } else if (hash === '#/my-uploads') {
    document.getElementById('view-my-uploads').style.display = 'block';
    await renderMyUploadsView();
  } else if (hash === '#/support') {
    document.getElementById('view-support').style.display = 'block';
    await renderSupportView();
  } else if (hash === '#/teacher-dashboard') {
    document.getElementById('view-teacher-dashboard').style.display = 'block';
    await renderTeacherDashboardView();
  }

  lucide.createIcons();
}

// --- VIEW RENDERERS ---

// 1. HOME VIEW (Announcements)
async function renderHomeView() {
  const container = document.getElementById('announcements-list-container');
  const addAnnBtn = document.getElementById('btn-add-announcement');
  const annForm = document.getElementById('form-announcement');

  // Toggle announcement button for admin and teachers
  if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.role === 'educator')) {
    addAnnBtn.style.display = 'flex';
  } else {
    addAnnBtn.style.display = 'none';
    annForm.style.display = 'none';
  }

  // Load and render teacher rankings on the leaderboard card
  const leaderboardList = document.getElementById('teacher-ranking-list');
  if (leaderboardList) {
    leaderboardList.innerHTML = '<div style="font-size: 11px; color: var(--text-muted);">Loading leaderboard...</div>';
    api.getTeacherRanking()
      .then(ranking => {
        const topRanking = ranking.slice(0, 10);
        if (topRanking.length === 0) {
          leaderboardList.innerHTML = '<div style="font-size: 11px; color: var(--text-muted); text-align: center; padding: 10px 0;">No educators ranked yet</div>';
        } else {
          leaderboardList.innerHTML = topRanking.map((t, index) => {
            const rankNum = index + 1;
            let trophy = '';
            if (rankNum === 1) trophy = '🏆';
            else if (rankNum === 2) trophy = '🥈';
            else if (rankNum === 3) trophy = '🥉';

            const isSelf = currentUser && currentUser.id === t.id;
            const bgStyle = isSelf ? 'background-color: rgba(34, 197, 94, 0.05);' : '';

            return `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); ${bgStyle} font-size: 13px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-weight: 800; min-width: 24px;">#${rankNum}${trophy ? ' ' + trophy : ''}</span>
                  <span style="font-weight: 500; color: var(--primary-dark); max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${escapeHTML(capitalizeName(t.name))}
                  </span>
                </div>
              </div>
            `;
          }).join('');
        }
      })
      .catch(err => {
        console.error('Failed to load home leaderboard:', err);
        leaderboardList.innerHTML = '<div style="font-size: 11px; color: var(--danger);">Failed to load rankings</div>';
      });
  }

  container.innerHTML = `<div class="empty-state">Loading announcements...</div>`;

  try {
    const list = await api.getAnnouncements();
    if (list.length === 0) {
      container.innerHTML = `<div class="empty-state">No announcements posted yet. Check back later!</div>`;
      return;
    }

    container.innerHTML = `
      <div class="announcements-container">
        ${list.map(ann => {
          const cardStyle = ann.docUrl ? 'style="cursor: pointer; border-left: 4px solid var(--primary);"' : '';
          const cardClick = ann.docUrl ? `onclick="window.open('${ann.docUrl}', '_blank')"` : '';
          return `
            <div class="announcement-card" ${cardStyle} ${cardClick}>
              <h4 style="display: flex; align-items: center; gap: 8px;">
                ${escapeHTML(ann.title)}
                ${ann.docUrl ? `<span style="font-size: 10px; background-color: var(--primary-accent); color: var(--primary-dark); padding: 2px 8px; border-radius: 12px; font-weight: 700; text-transform: uppercase;">Doc Link</span>` : ''}
              </h4>
              <span class="announcement-date">
                <i data-lucide="calendar" style="width: 12px; height: 12px; display: inline-block; margin-right: 4px; vertical-align: middle;"></i>
                ${new Date(ann.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <p class="announcement-content">${escapeHTML(ann.content).replace(/\n/g, '<br>')}</p>
              ${ann.docUrl ? `
                <div style="margin-top: 10px; font-size: 13px; color: var(--primary); font-weight: 600; display: flex; align-items: center; gap: 4px;">
                  <i data-lucide="external-link" style="width: 14px; height: 14px;"></i> Open Associated Document
                </div>
              ` : ''}
              ${currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.role === 'educator') ? `
                <button class="announcement-delete btn-delete-ann" data-id="${ann.id}" title="Delete Announcement" onclick="event.stopPropagation();">
                  <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                </button>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Attach deletion handlers
    document.querySelectorAll('.btn-delete-ann').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.getAttribute('data-id');
        if (!confirm('Delete this announcement?')) return;
        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
        lucide.createIcons();
        try {
          await api.deleteAnnouncement(id);
          await renderHomeView();
        } catch (err) {
          alert(err.message || 'Failed to delete announcement');
          btn.disabled = false;
          btn.innerHTML = originalHTML;
          lucide.createIcons();
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.2)">Error loading announcements.</div>`;
  }
  lucide.createIcons();
}

// 2. NOTES VIEW
async function renderNotesView() {
  localStorage.setItem('currentNotesFolder', JSON.stringify(currentNotesFolder));
  const breadcrumbs = document.getElementById('notes-breadcrumbs');
  const actions = document.getElementById('notes-header-actions');
  const content = document.getElementById('notes-content-container');

  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin');
  const isStaff = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.role === 'educator');

  // 1. Render Header / Breadcrumbs & Action buttons
  if (!currentNotesFolder) {
    breadcrumbs.innerHTML = `<span class="breadcrumb-item breadcrumb-active">Subject Notes</span>`;
    actions.innerHTML = isAdmin ? `
      <button class="btn btn-primary" id="btn-add-notes-folder" style="display: flex; align-items: center; gap: 6px;">
        <i data-lucide="folder-plus" style="width: 18px; height: 18px;"></i> Add Subject Folder
      </button>
    ` : '';

    if (isAdmin) {
      document.getElementById('btn-add-notes-folder').addEventListener('click', () => {
        openFolderModal('notes');
      });
    }
  } else {
    breadcrumbs.innerHTML = `
      <span class="breadcrumb-item" id="notes-back-crumb">Subject Notes</span>
      <i data-lucide="chevron-right" class="breadcrumb-separator" style="width: 16px; height: 16px;"></i>
      <span class="breadcrumb-active">${escapeHTML(currentNotesFolder.name)}</span>
    `;
    actions.innerHTML = `
      <div style="display: flex; gap: 10px;">
        <button class="btn btn-secondary" id="btn-notes-back">
          <i data-lucide="arrow-left" style="width: 18px; height: 18px;"></i> Back
        </button>
        ${isStaff ? `
          <button class="btn btn-primary" id="btn-notes-upload" style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="plus" style="width: 18px; height: 18px;"></i> Upload Note (PDF)
          </button>
        ` : ''}
      </div>
    `;

    document.getElementById('btn-notes-back').addEventListener('click', backToNotesFolders);
    document.getElementById('notes-back-crumb').addEventListener('click', backToNotesFolders);
    if (isStaff) {
      document.getElementById('btn-notes-upload').addEventListener('click', () => {
        openUploadModal('notes', currentNotesFolder.id, currentNotesFolder.name);
      });
    }
  }

  // 2. Render content body
  if (!currentNotesFolder) {
    // Folders Grid View
    content.innerHTML = `<div class="empty-state">Loading subject folders...</div>`;
    try {
      const folders = await api.getFolders('notes');
      if (folders.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i data-lucide="info" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--primary-light);"></i>
            <p>No subjects folders created yet.</p>
            ${isAdmin ? '<p style="font-size: 14px; margin-top: 6px;">Click "Add Subject Folder" to get started.</p>' : ''}
          </div>
        `;
        lucide.createIcons();
        return;
      }

      content.innerHTML = `
        <div class="folders-grid">
          ${folders.map(f => `
            <div class="folder-item notes-folder-card" data-id="${f.id}" data-name="${f.name}">
              ${getFolderIconSvg('#4a82c3', '#1e56a0')}
              <span class="folder-name">${escapeHTML(f.name)}</span>
              ${isAdmin ? `
                <div class="folder-actions-overlay">
                  <button class="folder-btn btn-rename-folder" data-id="${f.id}" data-name="${f.name}" title="Rename">
                    <i data-lucide="edit-2" style="width: 12px; height: 12px;"></i>
                  </button>
                  <button class="folder-btn folder-btn-danger btn-delete-folder" data-id="${f.id}" title="Delete">
                    <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                  </button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;

      // Attach Folder Navigation and CRUD Click Listeners
      document.querySelectorAll('.notes-folder-card').forEach(card => {
        card.addEventListener('click', (e) => {
          // If clicking rename or delete overlays, ignore navigation
          if (e.target.closest('.folder-actions-overlay')) return;
          currentNotesFolder = { id: card.getAttribute('data-id'), name: card.getAttribute('data-name') };
          renderNotesView();
        });
      });

      if (isAdmin) {
        document.querySelectorAll('.btn-rename-folder').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openFolderModal('notes', btn.getAttribute('data-id'), btn.getAttribute('data-name'));
          });
        });

        document.querySelectorAll('.btn-delete-folder').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (!confirm('Are you sure you want to delete this folder and all notes inside?')) return;
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 10px; height: 10px;"></i>';
            lucide.createIcons();
            try {
              await api.deleteFolder(id);
              await renderNotesView();
            } catch (err) {
              alert(err.message || 'Failed to delete folder');
              btn.disabled = false;
              btn.innerHTML = originalHTML;
              lucide.createIcons();
            }
          });
        });
      }

    } catch (err) {
      content.innerHTML = `<div class="empty-state">Failed to load subject folders.</div>`;
    }
  } else {
    // Documents list view inside folder
    content.innerHTML = `<div class="empty-state">Loading notes...</div>`;
    try {
      const docs = await api.getDocuments('notes', currentNotesFolder.id);
      if (docs.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i data-lucide="file-text" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--text-muted);"></i>
            <p>No notes uploaded in this subject folder yet.</p>
            ${isStaff ? '<p style="font-size: 14px; margin-top: 6px;">Click "Upload Note" to post the first PDF.</p>' : ''}
          </div>
        `;
        lucide.createIcons();
        return;
      }

      content.innerHTML = `
        <h3 style="color: var(--primary-dark); margin-bottom: 16px;">Notes for ${escapeHTML(currentNotesFolder.name)}</h3>
        <div class="docs-list">
          ${docs.map(doc => `
            <div class="doc-card" style="position: relative;">
              <button class="btn-like-doc like-heart-btn ${doc.hasLiked ? 'liked' : ''}" data-id="${doc.id}" title="${doc.hasLiked ? 'Unlike' : 'Like'} this resource" style="position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; color: ${doc.hasLiked ? 'var(--danger)' : 'var(--text-muted)'}; transition: transform 0.2s ease;">
                <i data-lucide="heart" style="width: 16px; height: 16px; fill: ${doc.hasLiked ? 'var(--danger)' : 'none'}; stroke: ${doc.hasLiked ? 'var(--danger)' : 'currentColor'};"></i>
                <span class="like-count" style="font-size: 12px; font-weight: 700;">${doc.likesCount || 0}</span>
              </button>
              <div class="doc-info">
                <div class="doc-icon-container">
                  <i data-lucide="file-text" style="width: 20px; height: 20px;"></i>
                </div>
                <div class="doc-meta">
                  <h5>${escapeHTML(doc.title)}</h5>
                  <div class="doc-meta-details">
                    <span>Academic Year: ${escapeHTML(doc.year)}</span>
                    <span>•</span>
                    <span>By: ${escapeHTML(doc.uploadedBy)}</span>
                    <span>•</span>
                    <span>${new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div class="doc-actions">
                <a href="${doc.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="padding: 8px 12px;">
                  <i data-lucide="eye" style="width: 14px; height: 14px;"></i> View
                </a>
                <a href="${API_BASE}/documents/download/${doc.id}?token=${localStorage.getItem('token')}" download="${escapeHTML(doc.fileName)}" class="btn btn-primary btn-sm" style="padding: 8px 12px;">
                  <i data-lucide="download" style="width: 14px; height: 14px;"></i> Download
                </a>
                ${canManageDocument(doc) ? `
                  <button class="btn btn-danger btn-sm btn-delete-doc" data-id="${doc.id}" style="padding: 8px 12px;">
                    <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;

      document.querySelectorAll('.btn-delete-doc').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (!confirm('Delete this note document?')) return;
          const originalHTML = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
          lucide.createIcons();
          try {
            await api.deleteDocument(id);
            await renderNotesView();
          } catch (err) {
            alert(err.message || 'Failed to delete note');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            lucide.createIcons();
          }
        });
      });

      document.querySelectorAll('.btn-like-doc').forEach(btn => {
        btn.addEventListener('click', (e) => {
          handleLikeToggle(e, renderNotesView);
        });
      });

    } catch (err) {
      content.innerHTML = `<div class="empty-state">Failed to load documents.</div>`;
    }
  }
  lucide.createIcons();
}

function backToNotesFolders() {
  currentNotesFolder = null;
  renderNotesView();
}

// 3. PAPERS VIEW
let paperSearchQuery = '';

async function renderPapersView() {
  localStorage.setItem('currentPapersFolder', JSON.stringify(currentPapersFolder));
  const breadcrumbs = document.getElementById('papers-breadcrumbs');
  const actions = document.getElementById('papers-header-actions');
  const content = document.getElementById('papers-content-container');

  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin');
  const isStaff = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.role === 'educator');

  // Breadcrumbs & Actions
  if (!currentPapersFolder) {
    breadcrumbs.innerHTML = `<span class="breadcrumb-item breadcrumb-active">Papers (PYQs)</span>`;
    actions.innerHTML = isAdmin ? `
      <button class="btn btn-primary" id="btn-add-papers-folder" style="display: flex; align-items: center; gap: 6px;">
        <i data-lucide="folder-plus" style="width: 18px; height: 18px;"></i> Add Subject Folder
      </button>
    ` : '';

    if (isAdmin) {
      document.getElementById('btn-add-papers-folder').addEventListener('click', () => {
        openFolderModal('papers');
      });
    }
  } else {
    breadcrumbs.innerHTML = `
      <span class="breadcrumb-item" id="papers-back-crumb">Papers (PYQs)</span>
      <i data-lucide="chevron-right" class="breadcrumb-separator" style="width: 16px; height: 16px;"></i>
      <span class="breadcrumb-active">${escapeHTML(currentPapersFolder.name)}</span>
    `;
    actions.innerHTML = `
      <div style="display: flex; gap: 10px;">
        <button class="btn btn-secondary" id="btn-papers-back">
          <i data-lucide="arrow-left" style="width: 18px; height: 18px;"></i> Back
        </button>
        ${isStaff ? `
          <button class="btn btn-primary" id="btn-papers-upload" style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="plus" style="width: 18px; height: 18px;"></i> Upload PYQ (PDF)
          </button>
        ` : ''}
      </div>
    `;

    document.getElementById('btn-papers-back').addEventListener('click', backToPapersFolders);
    document.getElementById('papers-back-crumb').addEventListener('click', backToPapersFolders);
    if (isStaff) {
      document.getElementById('btn-papers-upload').addEventListener('click', () => {
        openUploadModal('paper', currentPapersFolder.id, currentPapersFolder.name);
      });
    }
  }

  // Render Content
  if (!currentPapersFolder) {
    // Folders Grid View
    content.innerHTML = `<div class="empty-state">Loading papers subject folders...</div>`;
    try {
      const folders = await api.getFolders('papers');
      if (folders.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i data-lucide="info" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--primary-light);"></i>
            <p>No paper subject folders created yet.</p>
            ${isAdmin ? '<p style="font-size: 14px; margin-top: 6px;">Click "Add Subject Folder" to get started.</p>' : ''}
          </div>
        `;
        lucide.createIcons();
        return;
      }

      content.innerHTML = `
        <div class="folders-grid">
          ${folders.map(f => `
            <div class="folder-item papers-folder-card" data-id="${f.id}" data-name="${f.name}">
              ${getFolderIconSvg('#0284c7', '#0369a1')}
              <span class="folder-name">${escapeHTML(f.name)}</span>
              ${isAdmin ? `
                <div class="folder-actions-overlay">
                  <button class="folder-btn btn-rename-papers-folder" data-id="${f.id}" data-name="${f.name}" title="Rename">
                    <i data-lucide="edit-2" style="width: 12px; height: 12px;"></i>
                  </button>
                  <button class="folder-btn folder-btn-danger btn-delete-papers-folder" data-id="${f.id}" title="Delete">
                    <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                  </button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;

      // Folder Click Listeners
      document.querySelectorAll('.papers-folder-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.folder-actions-overlay')) return;
          currentPapersFolder = { id: card.getAttribute('data-id'), name: card.getAttribute('data-name') };
          paperSearchQuery = '';
          renderPapersView();
        });
      });

      if (isAdmin) {
        document.querySelectorAll('.btn-rename-papers-folder').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openFolderModal('papers', btn.getAttribute('data-id'), btn.getAttribute('data-name'));
          });
        });

        document.querySelectorAll('.btn-delete-papers-folder').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (!confirm('Are you sure you want to delete this folder and all papers inside?')) return;
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 10px; height: 10px;"></i>';
            lucide.createIcons();
            try {
              await api.deleteFolder(id);
              await renderPapersView();
            } catch (err) {
              alert(err.message || 'Failed to delete folder');
              btn.disabled = false;
              btn.innerHTML = originalHTML;
              lucide.createIcons();
            }
          });
        });
      }

    } catch (err) {
      content.innerHTML = `<div class="empty-state">Failed to load subject folders.</div>`;
    }
  } else {
    // Documents list inside folder
    content.innerHTML = `<div class="empty-state">Loading papers...</div>`;
    try {
      const docs = await api.getDocuments('paper', currentPapersFolder.id);

      // Filtering logic
      const getFilteredDocs = () => {
        if (!paperSearchQuery.trim()) return docs;
        const q = paperSearchQuery.toLowerCase();
        return docs.filter(d => {
          const title = d.title || '';
          const year = d.year || '';
          return title.toLowerCase().includes(q) || year.toLowerCase().includes(q);
        });
      };

      const renderDocsList = () => {
        const filtered = getFilteredDocs();

        let searchBarHTML = '';
        if (docs.length > 0) {
          searchBarHTML = `
            <div class="search-input-wrapper" style="max-width: 300px; margin-bottom: 20px;">
              <i data-lucide="search" class="search-input-icon" style="width: 16px; height: 16px;"></i>
              <input
                type="text"
                id="input-paper-search"
                class="form-input search-input"
                placeholder="Search by paper name/year..."
                value="${escapeHTML(paperSearchQuery)}"
                style="padding: 8px 12px 8px 36px; font-size: 14px;"
              />
            </div>
          `;
        }

        let listHTML = '';
        if (docs.length === 0) {
          listHTML = `
            <div class="empty-state">
              <i data-lucide="file-text" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--text-muted);"></i>
              <p>No Previous Year Papers uploaded in this subject folder yet.</p>
              ${isStaff ? '<p style="font-size: 14px; margin-top: 6px;">Click "Upload PYQ" to post the first PDF.</p>' : ''}
            </div>
          `;
        } else if (filtered.length === 0) {
          listHTML = `
            <div class="empty-state">
              <p>No papers match your search "${escapeHTML(paperSearchQuery)}"</p>
            </div>
          `;
        } else {
          listHTML = `
            <div class="docs-list">
              ${filtered.map(doc => `
                <div class="doc-card" style="position: relative; border-left: 4px solid #0284c7;">
                  <button class="btn-like-doc like-heart-btn ${doc.hasLiked ? 'liked' : ''}" data-id="${doc.id}" title="${doc.hasLiked ? 'Unlike' : 'Like'} this resource" style="position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; color: ${doc.hasLiked ? 'var(--danger)' : 'var(--text-muted)'}; transition: transform 0.2s ease;">
                    <i data-lucide="heart" style="width: 16px; height: 16px; fill: ${doc.hasLiked ? 'var(--danger)' : 'none'}; stroke: ${doc.hasLiked ? 'var(--danger)' : 'currentColor'};"></i>
                    <span class="like-count" style="font-size: 12px; font-weight: 700;">${doc.likesCount || 0}</span>
                  </button>
                  <div class="doc-info">
                    <div class="doc-icon-container" style="background-color: #e0f2fe; color: #0284c7;">
                      <i data-lucide="file-text" style="width: 20px; height: 20px;"></i>
                    </div>
                    <div class="doc-meta">
                      <h5>${escapeHTML(doc.title)}</h5>
                      <div class="doc-meta-details">
                        <span>Academic Year: ${escapeHTML(doc.year)}</span>
                        <span>•</span>
                        <span>By: ${escapeHTML(doc.uploadedBy)}</span>
                        <span>•</span>
                        <span>${new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div class="doc-actions">
                    <a href="${doc.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="padding: 8px 12px;">
                      <i data-lucide="eye" style="width: 14px; height: 14px;"></i> View
                    </a>
                    <a href="${API_BASE}/documents/download/${doc.id}?token=${localStorage.getItem('token')}" download="${escapeHTML(doc.fileName)}" class="btn btn-primary btn-sm" style="padding: 8px 12px;">
                      <i data-lucide="download" style="width: 14px; height: 14px;"></i> Download
                    </a>
                    ${canManageDocument(doc) ? `
                      <button class="btn btn-danger btn-sm btn-delete-paper" data-id="${doc.id}" style="padding: 8px 12px;">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                      </button>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        }

        content.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
            <h3 style="color: var(--primary-dark); margin: 0;">PYQs for ${escapeHTML(currentPapersFolder.name)}</h3>
            ${searchBarHTML}
          </div>
          <div id="papers-list-render-mount">
            ${listHTML}
          </div>
        `;

        // Re-attach Search input handler
        const searchInput = document.getElementById('input-paper-search');
        if (searchInput) {
          // Focus at the end of the text
          searchInput.focus();
          searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
          
          searchInput.addEventListener('input', (e) => {
            paperSearchQuery = e.target.value;
            renderDocsList();
          });
        }

        // Re-attach Delete handler
        document.querySelectorAll('.btn-delete-paper').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (!confirm('Delete this paper document?')) return;
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
            lucide.createIcons();
            try {
              await api.deleteDocument(id);
              await renderPapersView();
            } catch (err) {
              alert(err.message || 'Failed to delete paper');
              btn.disabled = false;
              btn.innerHTML = originalHTML;
              lucide.createIcons();
            }
          });
        });

        // Re-attach Like handler
        document.querySelectorAll('.btn-like-doc').forEach(btn => {
          btn.addEventListener('click', (e) => {
            handleLikeToggle(e, renderPapersView);
          });
        });
        lucide.createIcons();
      };

      renderDocsList();

    } catch (err) {
      content.innerHTML = `<div class="empty-state">Failed to load papers documents.</div>`;
    }
  }
  lucide.createIcons();
}

function backToPapersFolders() {
  currentPapersFolder = null;
  renderPapersView();
}

// 4. RESOURCES VIEW
async function renderResourcesView() {
  localStorage.setItem('currentResourcesSection', currentResourcesSection);
  localStorage.setItem('currentResourcesFolder', JSON.stringify(currentResourcesFolder));
  localStorage.setItem('roadmapFolderStack', JSON.stringify(roadmapFolderStack));
  const breadcrumbs = document.getElementById('resources-breadcrumbs');
  const actions = document.getElementById('resources-header-actions');
  const content = document.getElementById('resources-content-container');

  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin');
  const isStaff = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.role === 'educator');

  // Breadcrumbs & Actions
  let crumbsHTML = `<span class="breadcrumb-item ${currentResourcesSection === 'root' ? 'breadcrumb-active' : ''}" id="crumb-resources-root">Resources</span>`;
  let actionsHTML = '';

  const isStaffOrEducator = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.role === 'educator');

  if (currentResourcesSection !== 'root') {
    if (currentResourcesSection === 'roadmaps') {
      crumbsHTML += `
        <i data-lucide="chevron-right" class="breadcrumb-separator" style="width: 16px; height: 16px;"></i>
        <span class="breadcrumb-item ${!currentResourcesFolder ? 'breadcrumb-active' : ''}" id="crumb-resources-section">Roadmaps</span>
      `;
      roadmapFolderStack.forEach((folder, idx) => {
        const isLast = idx === roadmapFolderStack.length - 1;
        crumbsHTML += `
          <i data-lucide="chevron-right" class="breadcrumb-separator" style="width: 16px; height: 16px;"></i>
          <span class="breadcrumb-item ${isLast ? 'breadcrumb-active' : ''} roadmap-crumb-item" data-idx="${idx}" style="cursor: pointer;">
            ${escapeHTML(folder.name)}
          </span>
        `;
      });
    } else {
      crumbsHTML += `
        <i data-lucide="chevron-right" class="breadcrumb-separator" style="width: 16px; height: 16px;"></i>
        <span class="breadcrumb-item ${!currentResourcesFolder ? 'breadcrumb-active' : ''}" id="crumb-resources-section">
          ${currentResourcesSection === 'syllabus' ? 'Syllabus' : ''}
          ${currentResourcesSection.startsWith('lab_manuals') ? 'Lab Manuals' : ''}
          ${currentResourcesSection.startsWith('books') ? 'Books' : ''}
          ${currentResourcesSection === 'calculator' ? 'SGPA & CGPA Calculator' : ''}
        </span>
      `;
      if (currentResourcesFolder) {
        crumbsHTML += `
          <i data-lucide="chevron-right" class="breadcrumb-separator" style="width: 16px; height: 16px;"></i>
          <span class="breadcrumb-active">${escapeHTML(currentResourcesFolder.name)}</span>
        `;
      }
    }

    // Header buttons
    actionsHTML = `
      <div style="display: flex; gap: 10px;">
        <button class="btn btn-secondary" id="btn-resources-back">
          <i data-lucide="arrow-left" style="width: 18px; height: 18px;"></i> Back
        </button>
        ${(isAdmin && (currentResourcesSection === 'lab_manuals' || currentResourcesSection === 'books')) || (isStaffOrEducator && currentResourcesSection === 'roadmaps' && !currentResourcesFolder) ? `
          <button class="btn btn-primary" id="btn-resources-add-folder" style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="folder-plus" style="width: 18px; height: 18px;"></i> Add Folder
          </button>
        ` : ''}
        ${(isStaff && (currentResourcesSection === 'syllabus' || currentResourcesSection === 'lab_manuals_folder' || currentResourcesSection === 'books_folder')) || (isStaffOrEducator && currentResourcesSection === 'roadmaps' && currentResourcesFolder) ? `
          <button class="btn btn-primary" id="btn-resources-upload" style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="plus" style="width: 18px; height: 18px;"></i> Upload PDF
          </button>
        ` : ''}
      </div>
    `;
  }

  breadcrumbs.innerHTML = crumbsHTML;
  actions.innerHTML = actionsHTML;

  // Crumb clicks
  const crumbRoot = document.getElementById('crumb-resources-root');
  if (crumbRoot) crumbRoot.addEventListener('click', () => { currentResourcesSection = 'root'; currentResourcesFolder = null; roadmapFolderStack = []; renderResourcesView(); });

  const crumbSection = document.getElementById('crumb-resources-section');
  if (crumbSection) crumbSection.addEventListener('click', () => {
    if (currentResourcesSection.endsWith('_folder')) {
      currentResourcesSection = currentResourcesSection.replace('_folder', '');
    }
    currentResourcesFolder = null;
    roadmapFolderStack = [];
    renderResourcesView();
  });

  // Re-attach breadcrumbs stack handlers
  document.querySelectorAll('.roadmap-crumb-item').forEach(crumb => {
    crumb.addEventListener('click', () => {
      const idx = parseInt(crumb.getAttribute('data-idx'));
      roadmapFolderStack = roadmapFolderStack.slice(0, idx + 1);
      currentResourcesFolder = roadmapFolderStack[roadmapFolderStack.length - 1];
      renderResourcesView();
    });
  });

  const backBtn = document.getElementById('btn-resources-back');
  if (backBtn) backBtn.addEventListener('click', handleResourcesBack);

  const addFolderBtn = document.getElementById('btn-resources-add-folder');
  if (addFolderBtn) addFolderBtn.addEventListener('click', () => openFolderModal(currentResourcesSection));

  const uploadBtn = document.getElementById('btn-resources-upload');
  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
      let docType = 'syllabus';
      let folderId = null;
      let folderName = '';
      if (currentResourcesSection === 'lab_manuals_folder') {
        docType = 'lab_manual';
        folderId = currentResourcesFolder.id;
        folderName = currentResourcesFolder.name;
      } else if (currentResourcesSection === 'books_folder') {
        docType = 'book';
        folderId = currentResourcesFolder.id;
        folderName = currentResourcesFolder.name;
      } else if (currentResourcesSection === 'roadmaps') {
        docType = 'roadmap';
        folderId = currentResourcesFolder.id;
        folderName = currentResourcesFolder.name;
      }
      openUploadModal(docType, folderId, folderName);
    });
  }

  // 3. Render content body
  if (currentResourcesSection === 'root') {
    content.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 30px; padding: 10px 0;">
        <div class="card resource-card-trigger" data-section="syllabus" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 30px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background-color: var(--primary-accent); color: var(--primary); display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <i data-lucide="compass" style="width: 32px; height: 32px;"></i>
          </div>
          <h3 style="color: var(--primary-dark); font-size: 20px; font-weight: 700; margin-bottom: 10px;">Syllabus</h3>
          <p style="color: var(--text-muted); font-size: 14px;">Access official university syllabus PDFs for all departments and semesters.</p>
        </div>

        <div class="card resource-card-trigger" data-section="lab_manuals" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 30px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background-color: #fef3c7; color: #d97706; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <i data-lucide="file-spreadsheet" style="width: 32px; height: 32px;"></i>
          </div>
          <h3 style="color: var(--primary-dark); font-size: 20px; font-weight: 700; margin-bottom: 10px;">Lab Manuals</h3>
          <p style="color: var(--text-muted); font-size: 14px;">Subject-wise practical files, manuals, experiments instructions, and guides.</p>
        </div>

        <div class="card resource-card-trigger" data-section="books" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 30px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background-color: #e0f2fe; color: #0369a1; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <i data-lucide="book-open" style="width: 32px; height: 32px;"></i>
          </div>
          <h3 style="color: var(--primary-dark); font-size: 20px; font-weight: 700; margin-bottom: 10px;">Books</h3>
          <p style="color: var(--text-muted); font-size: 14px;">Recommended textbooks, references, and digital libraries for engineering.</p>
        </div>

        <div class="card resource-card-trigger" data-section="roadmaps" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 30px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background-color: #fae8ff; color: #a21caf; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <i data-lucide="map" style="width: 32px; height: 32px;"></i>
          </div>
          <h3 style="color: var(--primary-dark); font-size: 20px; font-weight: 700; margin-bottom: 10px;">Roadmaps</h3>
          <p style="color: var(--text-muted); font-size: 14px;">Semester-wise maps, study routes, curriculum guides, and plans created by teachers & admins.</p>
        </div>

        <div class="card resource-card-trigger" data-section="calculator" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 30px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background-color: #dcfce7; color: #15803d; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <i data-lucide="calculator" style="width: 32px; height: 32px;"></i>
          </div>
          <h3 style="color: var(--primary-dark); font-size: 20px; font-weight: 700; margin-bottom: 10px;">GPA Calculator</h3>
          <p style="color: var(--text-muted); font-size: 14px;">Quickly calculate your SGPA and CGPA with an interactive semester grid.</p>
        </div>
      </div>
    `;

    document.querySelectorAll('.resource-card-trigger').forEach(card => {
      card.addEventListener('click', () => {
        currentResourcesSection = card.getAttribute('data-section');
        currentResourcesFolder = null;
        roadmapFolderStack = [];
        renderResourcesView();
      });
    });

  } else if (currentResourcesSection === 'syllabus') {
    // Syllabus Documents View
    content.innerHTML = `<div class="empty-state">Loading syllabus...</div>`;
    try {
      const docs = await api.getDocuments('syllabus');
      if (docs.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i data-lucide="file-text" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--text-muted);"></i>
            <p>No syllabus PDFs uploaded yet.</p>
            ${isStaff ? '<p style="font-size: 14px; margin-top: 6px;">Click "Upload PDF" to add a syllabus.</p>' : ''}
          </div>
        `;
        lucide.createIcons();
        return;
      }

      content.innerHTML = `
        <h3 style="color: var(--primary-dark); margin-bottom: 16px;">Syllabus Documents</h3>
        <div class="docs-list">
          ${docs.map(doc => `
            <div class="doc-card" style="position: relative;">
              <button class="btn-like-doc like-heart-btn ${doc.hasLiked ? 'liked' : ''}" data-id="${doc.id}" title="${doc.hasLiked ? 'Unlike' : 'Like'} this resource" style="position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; color: ${doc.hasLiked ? 'var(--danger)' : 'var(--text-muted)'}; transition: transform 0.2s ease;">
                <i data-lucide="heart" style="width: 16px; height: 16px; fill: ${doc.hasLiked ? 'var(--danger)' : 'none'}; stroke: ${doc.hasLiked ? 'var(--danger)' : 'currentColor'};"></i>
                <span class="like-count" style="font-size: 12px; font-weight: 700;">${doc.likesCount || 0}</span>
              </button>
              <div class="doc-info">
                <div class="doc-icon-container">
                  <i data-lucide="file-text" style="width: 20px; height: 20px;"></i>
                </div>
                <div class="doc-meta">
                  <h5>${escapeHTML(doc.title)}</h5>
                  <div class="doc-meta-details">
                    <span>Year: ${escapeHTML(doc.year)}</span>
                    <span>•</span>
                    <span>By: ${escapeHTML(doc.uploadedBy)}</span>
                  </div>
                </div>
              </div>
              <div class="doc-actions">
                <a href="${doc.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm"><i data-lucide="eye" style="width:14px;height:14px;"></i> View</a>
                <a href="${API_BASE}/documents/download/${doc.id}?token=${localStorage.getItem('token')}" download="${escapeHTML(doc.fileName)}" class="btn btn-primary btn-sm"><i data-lucide="download" style="width:14px;height:14px;"></i> Download</a>
                ${canManageDocument(doc) ? `
                  <button class="btn btn-danger btn-sm btn-delete-resource-doc" data-id="${doc.id}"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;

      document.querySelectorAll('.btn-delete-resource-doc').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (!confirm('Delete this syllabus document?')) return;
          const originalHTML = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
          lucide.createIcons();
          try {
            await api.deleteDocument(id);
            await renderResourcesView();
          } catch (err) {
            alert(err.message || 'Failed to delete');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            lucide.createIcons();
          }
        });
      });

      document.querySelectorAll('.btn-like-doc').forEach(btn => {
        btn.addEventListener('click', (e) => {
          handleLikeToggle(e, renderResourcesView);
        });
      });

    } catch (err) {
      content.innerHTML = `<div class="empty-state">Error loading syllabus documents.</div>`;
    }

  } else if (currentResourcesSection === 'lab_manuals' || currentResourcesSection === 'books') {
    // Folders Grid View for Lab Manuals or Books
    content.innerHTML = `<div class="empty-state">Loading subject folders...</div>`;
    try {
      const folders = await api.getFolders(currentResourcesSection);
      if (folders.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i data-lucide="info" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--text-muted);"></i>
            <p>No subject folders created yet.</p>
            ${isAdmin ? '<p style="font-size: 14px; margin-top: 6px;">Click "Add Subject Folder" to start.</p>' : ''}
          </div>
        `;
        lucide.createIcons();
        return;
      }

      const isLab = currentResourcesSection === 'lab_manuals';
      content.innerHTML = `
        <div class="folders-grid">
          ${folders.map(f => `
            <div class="folder-item resources-folder-card" data-id="${f.id}" data-name="${f.name}">
              ${isLab ? getFolderIconSvg('#f59e0b', '#d97706') : getFolderIconSvg('#38bdf8', '#0369a1')}
              <span class="folder-name">${escapeHTML(f.name)}</span>
              ${isAdmin ? `
                <div class="folder-actions-overlay">
                  <button class="folder-btn btn-rename-res-folder" data-id="${f.id}" data-name="${f.name}" title="Rename"><i data-lucide="edit-2" style="width:12px;height:12px;"></i></button>
                  <button class="folder-btn folder-btn-danger btn-delete-res-folder" data-id="${f.id}" title="Delete"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;

      document.querySelectorAll('.resources-folder-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.folder-actions-overlay')) return;
          currentResourcesFolder = { id: card.getAttribute('data-id'), name: card.getAttribute('data-name') };
          currentResourcesSection = currentResourcesSection === 'lab_manuals' ? 'lab_manuals_folder' : 'books_folder';
          renderResourcesView();
        });
      });

      if (isAdmin) {
        document.querySelectorAll('.btn-rename-res-folder').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openFolderModal(currentResourcesSection, btn.getAttribute('data-id'), btn.getAttribute('data-name'));
          });
        });

        document.querySelectorAll('.btn-delete-res-folder').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (!confirm('Are you sure you want to delete this folder and all documents inside?')) return;
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 10px; height: 10px;"></i>';
            lucide.createIcons();
            try {
              await api.deleteFolder(id);
              await renderResourcesView();
            } catch (err) {
              alert(err.message || 'Failed to delete folder');
              btn.disabled = false;
              btn.innerHTML = originalHTML;
              lucide.createIcons();
            }
          });
        });
      }

    } catch (err) {
      content.innerHTML = `<div class="empty-state">Error loading folders.</div>`;
    }

  } else if (currentResourcesSection === 'lab_manuals_folder' || currentResourcesSection === 'books_folder') {
    // Documents inside specific Lab Manual or Book subject folder
    content.innerHTML = `<div class="empty-state">Loading files...</div>`;
    const docType = currentResourcesSection === 'lab_manuals_folder' ? 'lab_manual' : 'book';

    try {
      const docs = await api.getDocuments(docType, currentResourcesFolder.id);
      if (docs.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i data-lucide="file-text" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--text-muted);"></i>
            <p>No documents uploaded in this subject yet.</p>
            ${isStaff ? '<p style="font-size: 14px; margin-top: 6px;">Click "Upload PDF" to add files.</p>' : ''}
          </div>
        `;
        lucide.createIcons();
        return;
      }

      content.innerHTML = `
        <h3 style="color: var(--primary-dark); margin-bottom: 16px;">
          Files in ${escapeHTML(currentResourcesFolder.name)} (${docType === 'lab_manual' ? 'Lab Manuals' : 'Books'})
        </h3>
        <div class="docs-list">
          ${docs.map(doc => `
            <div class="doc-card" style="position: relative;">
              <button class="btn-like-doc like-heart-btn ${doc.hasLiked ? 'liked' : ''}" data-id="${doc.id}" title="${doc.hasLiked ? 'Unlike' : 'Like'} this resource" style="position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; color: ${doc.hasLiked ? 'var(--danger)' : 'var(--text-muted)'}; transition: transform 0.2s ease;">
                <i data-lucide="heart" style="width: 16px; height: 16px; fill: ${doc.hasLiked ? 'var(--danger)' : 'none'}; stroke: ${doc.hasLiked ? 'var(--danger)' : 'currentColor'};"></i>
                <span class="like-count" style="font-size: 12px; font-weight: 700;">${doc.likesCount || 0}</span>
              </button>
              <div class="doc-info">
                <div class="doc-icon-container">
                  <i data-lucide="file-text" style="width: 20px; height: 20px;"></i>
                </div>
                <div class="doc-meta">
                  <h5>${escapeHTML(doc.title)}</h5>
                  <div class="doc-meta-details">
                    <span>Year: ${escapeHTML(doc.year)}</span>
                    <span>•</span>
                    <span>By: ${escapeHTML(doc.uploadedBy)}</span>
                  </div>
                </div>
              </div>
              <div class="doc-actions">
                <a href="${doc.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm"><i data-lucide="eye" style="width:14px;height:14px;"></i> View</a>
                <a href="${API_BASE}/documents/download/${doc.id}?token=${localStorage.getItem('token')}" download="${escapeHTML(doc.fileName)}" class="btn btn-primary btn-sm"><i data-lucide="download" style="width:14px;height:14px;"></i> Download</a>
                ${canManageDocument(doc) ? `
                  <button class="btn btn-danger btn-sm btn-delete-res-item-doc" data-id="${doc.id}"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;

      document.querySelectorAll('.btn-delete-res-item-doc').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (!confirm('Delete this file?')) return;
          const originalHTML = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
          lucide.createIcons();
          try {
            await api.deleteDocument(id);
            await renderResourcesView();
          } catch (err) {
            alert(err.message || 'Failed to delete');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            lucide.createIcons();
          }
        });
      });

      document.querySelectorAll('.btn-like-doc').forEach(btn => {
        btn.addEventListener('click', (e) => {
          handleLikeToggle(e, renderResourcesView);
        });
      });

    } catch (err) {
      content.innerHTML = `<div class="empty-state">Error loading documents.</div>`;
    }

  } else if (currentResourcesSection === 'roadmaps') {
    content.innerHTML = `<div class="empty-state">Loading roadmaps...</div>`;
    const parentId = currentResourcesFolder ? currentResourcesFolder.id : 'null';

    try {
      const folders = await api.getFolders('roadmaps', parentId);
      let docs = [];
      if (currentResourcesFolder) {
        docs = await api.getDocuments('roadmap', currentResourcesFolder.id);
      }

      if (folders.length === 0 && docs.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i data-lucide="map" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--text-muted);"></i>
            <p>No folders or roadmaps here yet.</p>
            ${isStaffOrEducator ? `<p style="font-size: 14px; margin-top: 6px;">Click ${!currentResourcesFolder ? '"Add Folder" or ' : ''}"Upload PDF" to get started.</p>` : ''}
          </div>
        `;
        lucide.createIcons();
        return;
      }

      let foldersHTML = '';
      if (folders.length > 0) {
        foldersHTML = `
          <h4 style="color: var(--primary-dark); margin-bottom: 12px; font-weight: 700;">Folders</h4>
          <div class="folders-grid" style="margin-bottom: 30px;">
            ${folders.map(f => `
              <div class="folder-item roadmap-folder-card" data-id="${f.id}" data-name="${f.name}">
                ${getFolderIconSvg('#a21caf', '#701a75')}
                <span class="folder-name">${escapeHTML(f.name)}</span>
                ${isStaffOrEducator ? `
                  <div class="folder-actions-overlay">
                    <button class="folder-btn btn-rename-roadmap-folder" data-id="${f.id}" data-name="${f.name}" title="Rename"><i data-lucide="edit-2" style="width:12px;height:12px;"></i></button>
                    <button class="folder-btn folder-btn-danger btn-delete-roadmap-folder" data-id="${f.id}" title="Delete"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        `;
      }

      let docsHTML = '';
      if (docs.length > 0) {
        docsHTML = `
          <h4 style="color: var(--primary-dark); margin-bottom: 12px; font-weight: 700;">Roadmap Files</h4>
          <div class="docs-list">
            ${docs.map(doc => `
              <div class="doc-card" style="position: relative; border-left: 4px solid #a21caf;">
                <div class="doc-info">
                  <div class="doc-icon-container" style="background-color: #fae8ff; color: #a21caf;">
                    <i data-lucide="file-text" style="width: 20px; height: 20px;"></i>
                  </div>
                  <div class="doc-meta">
                    <h5>${escapeHTML(doc.title)}</h5>
                    <div class="doc-meta-details">
                      <span>Year: ${escapeHTML(doc.year)}</span>
                      <span>•</span>
                      <span>By: ${escapeHTML(doc.uploadedBy)}</span>
                      <span>•</span>
                      <span>${new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <button class="btn-like-doc like-heart-btn ${doc.hasLiked ? 'liked' : ''}" data-id="${doc.id}" title="${doc.hasLiked ? 'Unlike' : 'Like'} this resource" style="position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; color: ${doc.hasLiked ? 'var(--danger)' : 'var(--text-muted)'}; transition: transform 0.2s ease;">
                  <i data-lucide="heart" style="width: 16px; height: 16px; fill: ${doc.hasLiked ? 'var(--danger)' : 'none'}; stroke: ${doc.hasLiked ? 'var(--danger)' : 'currentColor'};"></i>
                  <span class="like-count" style="font-size: 12px; font-weight: 700;">${doc.likesCount || 0}</span>
                </button>

                <div class="doc-actions">
                  <a href="${doc.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm"><i data-lucide="eye" style="width:14px;height:14px;"></i> View</a>
                  <a href="${API_BASE}/documents/download/${doc.id}?token=${localStorage.getItem('token')}" download="${escapeHTML(doc.fileName)}" class="btn btn-primary btn-sm"><i data-lucide="download" style="width:14px;height:14px;"></i> Download</a>
                  ${canManageDocument(doc) ? `
                    <button class="btn btn-danger btn-sm btn-delete-roadmap-doc" data-id="${doc.id}"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      content.innerHTML = `
        <div style="padding: 10px 0;">
          ${foldersHTML}
          ${docsHTML}
        </div>
      `;

      // Event listeners
      document.querySelectorAll('.roadmap-folder-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.folder-actions-overlay')) return;
          const folderId = card.getAttribute('data-id');
          const folderName = card.getAttribute('data-name');
          const folder = { id: folderId, name: folderName };
          roadmapFolderStack.push(folder);
          currentResourcesFolder = folder;
          renderResourcesView();
        });
      });

      if (isStaffOrEducator) {
        document.querySelectorAll('.btn-rename-roadmap-folder').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openFolderModal('roadmaps', btn.getAttribute('data-id'), btn.getAttribute('data-name'));
          });
        });

        document.querySelectorAll('.btn-delete-roadmap-folder').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (!confirm('Are you sure you want to delete this folder and all subfolders and documents inside?')) return;
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 10px; height: 10px;"></i>';
            lucide.createIcons();
            try {
              await api.deleteFolder(id);
              await renderResourcesView();
            } catch (err) {
              alert(err.message || 'Failed to delete folder');
              btn.disabled = false;
              btn.innerHTML = originalHTML;
              lucide.createIcons();
            }
          });
        });

        document.querySelectorAll('.btn-delete-roadmap-doc').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (!confirm('Delete this roadmap?')) return;
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
            lucide.createIcons();
            try {
              await api.deleteDocument(id);
              await renderResourcesView();
            } catch (err) {
              alert(err.message || 'Failed to delete roadmap');
              btn.disabled = false;
              btn.innerHTML = originalHTML;
              lucide.createIcons();
            }
          });
        });
      }

      // Like handlers for roadmaps
      document.querySelectorAll('.btn-like-doc').forEach(btn => {
        btn.addEventListener('click', (e) => {
          handleLikeToggle(e, renderResourcesView);
        });
      });

    } catch (err) {
      content.innerHTML = `<div class="empty-state" style="color: var(--danger);">Failed to load roadmaps: ${escapeHTML(err.message)}</div>`;
    }

  } else if (currentResourcesSection === 'calculator') {
    // SGPA & CGPA CALCULATOR SHEET
    renderGPAThresholdsView(content);
  }

  lucide.createIcons();
}

function handleResourcesBack() {
  if (currentResourcesSection === 'roadmaps') {
    if (roadmapFolderStack.length > 0) {
      roadmapFolderStack.pop();
      if (roadmapFolderStack.length > 0) {
        currentResourcesFolder = roadmapFolderStack[roadmapFolderStack.length - 1];
      } else {
        currentResourcesFolder = null;
      }
    } else {
      currentResourcesSection = 'root';
      currentResourcesFolder = null;
    }
  } else if (currentResourcesSection === 'lab_manuals_folder') {
    currentResourcesSection = 'lab_manuals';
    currentResourcesFolder = null;
  } else if (currentResourcesSection === 'books_folder') {
    currentResourcesSection = 'books';
    currentResourcesFolder = null;
  } else {
    currentResourcesSection = 'root';
    currentResourcesFolder = null;
  }
  renderResourcesView();
}

// Render GPA Calculator sheets
function renderGPAThresholdsView(mountElement) {
  let calculatedSgpa = null;
  let calculatedCgpa = null;
  let activeTab = 'sgpa'; // 'sgpa' | 'cgpa'

  const computeAndRender = () => {
    mountElement.innerHTML = `
      <div class="card" style="max-width: 800px; margin: 0 auto;">
        <div class="calculator-tabs">
          <button class="calc-tab ${activeTab === 'sgpa' ? 'active' : ''}" id="tab-sgpa-trigger">SGPA Calculator</button>
          <button class="calc-tab ${activeTab === 'cgpa' ? 'active' : ''}" id="tab-cgpa-trigger">CGPA Calculator</button>
        </div>

        <!-- SGPA SHEET -->
        <div id="sheet-sgpa" style="display: ${activeTab === 'sgpa' ? 'block' : 'none'};">
          <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">
            Enter your course credit hours and letter grade. SGPA is calculated as weighted average of grade points.
          </p>

          <div class="calc-row-header">
            <span>Course Title (Optional)</span>
            <span>Credits (Weight)</span>
            <span>Letter Grade</span>
            <span></span>
          </div>

          <div id="sgpa-rows-container">
            ${sgpaRows.map((row, idx) => `
              <div class="calc-row">
                <input
                  type="text"
                  class="form-input sgpa-course-name"
                  placeholder="e.g. Mathematics I"
                  value="${escapeHTML(row.courseName)}"
                  data-idx="${idx}"
                />
                <input
                  type="number"
                  class="form-input sgpa-credits"
                  min="1"
                  max="10"
                  placeholder="Credits"
                  value="${row.credits}"
                  data-idx="${idx}"
                />
                <select class="form-select sgpa-grade" data-idx="${idx}">
                  ${Object.keys(GRADE_POINTS).map(g => `
                    <option value="${g}" ${row.grade === g ? 'selected' : ''}>${g} (GP: ${GRADE_POINTS[g]})</option>
                  `).join('')}
                </select>
                <button 
                  class="btn btn-danger btn-sm btn-remove-sgpa-row"
                  style="padding: 8px 10px; border-radius: 8px;"
                  data-idx="${idx}"
                  ${sgpaRows.length <= 1 ? 'disabled' : ''}
                >
                  <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                </button>
              </div>
            `).join('')}
          </div>

          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button id="btn-add-sgpa-row" class="btn btn-secondary btn-sm">+ Add Course</button>
            <button id="btn-calc-sgpa" class="btn btn-primary btn-sm">Calculate SGPA</button>
          </div>

          ${calculatedSgpa !== null ? `
            <div class="result-box" style="animation: modalEnter 0.3s ease;">
              <p style="font-weight: 600; font-size: 15px;">YOUR SGPA IS</p>
              <h2 class="result-val">${calculatedSgpa}</h2>
              <p style="font-size: 12px; opacity: 0.8;">Calculation: Sum(Credits * GradePoints) / Sum(Credits)</p>
            </div>
          ` : ''}
        </div>

        <!-- CGPA SHEET -->
        <div id="sheet-cgpa" style="display: ${activeTab === 'cgpa' ? 'block' : 'none'};">
          <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">
            Enter your SGPA and total credits earned per semester. CGPA is computed as a credit-weighted average.
          </p>

          <div class="calc-row-header">
            <span>Semester</span>
            <span>SGPA (0.00 - 10.00)</span>
            <span>Credits (Weight)</span>
            <span></span>
          </div>

          <div id="cgpa-rows-container">
            ${cgpaRows.map((row, idx) => `
              <div class="calc-row">
                <input
                  type="text"
                  class="form-input cgpa-sem-name"
                  value="${escapeHTML(row.semesterName)}"
                  data-idx="${idx}"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  class="form-input cgpa-sgpa"
                  placeholder="e.g. 8.42"
                  value="${row.sgpa}"
                  data-idx="${idx}"
                  required
                />
                <input
                  type="number"
                  min="1"
                  max="40"
                  class="form-input cgpa-credits"
                  placeholder="Credits"
                  value="${row.credits}"
                  data-idx="${idx}"
                />
                <button 
                  class="btn btn-danger btn-sm btn-remove-cgpa-row"
                  style="padding: 8px 10px; border-radius: 8px;"
                  data-idx="${idx}"
                  ${cgpaRows.length <= 1 ? 'disabled' : ''}
                >
                  <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                </button>
              </div>
            `).join('')}
          </div>

          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button id="btn-add-cgpa-row" class="btn btn-secondary btn-sm">+ Add Semester</button>
            <button id="btn-calc-cgpa" class="btn btn-primary btn-sm">Calculate CGPA</button>
          </div>

          ${calculatedCgpa !== null ? `
            <div class="result-box" style="animation: modalEnter 0.3s ease; background: linear-gradient(135deg, #15803d 0%, #22c55e 100%)">
              <p style="font-weight: 600; font-size: 15px;">YOUR CGPA IS</p>
              <h2 class="result-val">${calculatedCgpa}</h2>
              <p style="font-size: 12px; opacity: 0.8;">Credit-weighted CGPA calculated across semesters.</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    lucide.createIcons();

    // Event Triggers
    document.getElementById('tab-sgpa-trigger').addEventListener('click', () => { activeTab = 'sgpa'; computeAndRender(); });
    document.getElementById('tab-cgpa-trigger').addEventListener('click', () => { activeTab = 'cgpa'; computeAndRender(); });

    // SGPA triggers
    document.getElementById('btn-add-sgpa-row').addEventListener('click', () => {
      sgpaRows.push({ id: Date.now(), courseName: '', credits: 3, grade: 'A' });
      computeAndRender();
    });

    document.querySelectorAll('.btn-remove-sgpa-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        sgpaRows.splice(idx, 1);
        computeAndRender();
      });
    });

    // Save values typed in input fields back to state
    document.querySelectorAll('.sgpa-course-name').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(inp.getAttribute('data-idx'));
        sgpaRows[idx].courseName = e.target.value;
      });
    });
    document.querySelectorAll('.sgpa-credits').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(inp.getAttribute('data-idx'));
        sgpaRows[idx].credits = e.target.value;
      });
    });
    document.querySelectorAll('.sgpa-grade').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(sel.getAttribute('data-idx'));
        sgpaRows[idx].grade = e.target.value;
      });
    });

    document.getElementById('btn-calc-sgpa').addEventListener('click', () => {
      let totalCredits = 0;
      let totalPoints = 0;
      sgpaRows.forEach(row => {
        const cred = parseFloat(row.credits);
        const pts = GRADE_POINTS[row.grade];
        if (!isNaN(cred) && cred > 0) {
          totalCredits += cred;
          totalPoints += (cred * pts);
        }
      });
      calculatedSgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
      computeAndRender();
    });

    // CGPA triggers
    document.getElementById('btn-add-cgpa-row').addEventListener('click', () => {
      cgpaRows.push({ id: Date.now(), semesterName: `Semester ${cgpaRows.length + 1}`, sgpa: '', credits: 20 });
      computeAndRender();
    });

    document.querySelectorAll('.btn-remove-cgpa-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        cgpaRows.splice(idx, 1);
        computeAndRender();
      });
    });

    document.querySelectorAll('.cgpa-sem-name').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(inp.getAttribute('data-idx'));
        cgpaRows[idx].semesterName = e.target.value;
      });
    });
    document.querySelectorAll('.cgpa-sgpa').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(inp.getAttribute('data-idx'));
        cgpaRows[idx].sgpa = e.target.value;
      });
    });
    document.querySelectorAll('.cgpa-credits').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(inp.getAttribute('data-idx'));
        cgpaRows[idx].credits = e.target.value;
      });
    });

    document.getElementById('btn-calc-cgpa').addEventListener('click', () => {
      let totalCredits = 0;
      let totalPoints = 0;
      cgpaRows.forEach(row => {
        const sg = parseFloat(row.sgpa);
        const cred = parseFloat(row.credits);
        if (!isNaN(sg) && sg >= 0 && sg <= 10 && !isNaN(cred) && cred > 0) {
          totalCredits += cred;
          totalPoints += (sg * cred);
        }
      });
      calculatedCgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
      computeAndRender();
    });
  };

  computeAndRender();
}

// 5. ADMIN DASHBOARD VIEW
async function renderAdminDashboardView() {
  const roleLabel = document.getElementById('admin-panel-role-label');
  const errorAlert = document.getElementById('admin-error-alert');
  const pendingCount = document.getElementById('pending-users-count');
  const pendingContainer = document.getElementById('pending-users-list-container');
  const allCount = document.getElementById('all-users-count');
  const allContainer = document.getElementById('all-users-list-container');
  const directoryHint = document.getElementById('admin-directory-hint');
  const tabsContainer = document.getElementById('directory-tabs');

  roleLabel.textContent = currentUser.role === 'superadmin' ? 'Super Admin' : 'Admin';
  errorAlert.style.display = 'none';

  if (currentUser.role === 'superadmin') {
    directoryHint.textContent = 'Super Admin view: You have full deletion and admin promotion privileges.';
  } else {
    directoryHint.textContent = 'Admin view: You can manage and delete Student accounts only.';
  }

  pendingContainer.innerHTML = '<div class="empty-state">Loading approvals...</div>';
  allContainer.innerHTML = '<div class="empty-state">Loading users...</div>';

  try {
    const pending = await api.getPendingUsers();
    pendingCount.textContent = pending.length;

    if (pending.length === 0) {
      pendingContainer.innerHTML = `<div class="empty-state" style="padding: 30px;">No registration requests pending approval.</div>`;
    } else {
      pendingContainer.innerHTML = pending.map(u => `
        <div class="user-card">
          <div class="user-info">
            <h5>${escapeHTML(capitalizeName(u.name))}</h5>
            <p>Phone: ${escapeHTML(u.phone)} • Requested Role: <strong style="text-transform: capitalize; color: var(--primary);">${escapeHTML(u.role)}</strong></p>
            <p style="font-size: 11px; margin-top: 2px;">Registered: ${new Date(u.createdAt).toLocaleString()}</p>
          </div>
          <div class="user-actions">
            <button class="btn btn-primary btn-sm btn-approve-user" data-id="${u.id}" style="padding: 6px 12px; display: flex; align-items: center; gap: 4px; background-color: var(--success); border: none;">
              <i data-lucide="user-check" style="width:14px;height:14px;"></i> Approve
            </button>
            <button class="btn btn-danger btn-sm btn-reject-user" data-id="${u.id}" style="padding: 6px 12px; display: flex; align-items: center; gap: 4px;">
              <i data-lucide="user-x" style="width:14px;height:14px;"></i> Reject
            </button>
          </div>
        </div>
      `).join('');

      document.querySelectorAll('.btn-approve-user').forEach(btn => {
        btn.addEventListener('click', async () => {
          const originalHTML = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
          lucide.createIcons();
          try {
            await api.approveUser(btn.getAttribute('data-id'));
            await renderAdminDashboardView();
          } catch (err) {
            alert(err.message || 'Approval failed');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            lucide.createIcons();
          }
        });
      });

      document.querySelectorAll('.btn-reject-user').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Reject and delete this registration request?')) return;
          const originalHTML = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
          lucide.createIcons();
          try {
            await api.rejectUser(btn.getAttribute('data-id'));
            await renderAdminDashboardView();
          } catch (err) {
            alert(err.message || 'Rejection failed');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            lucide.createIcons();
          }
        });
      });
    }

    const all = await api.getAllUsers();
    allCount.textContent = all.length;

    const adminsList = all.filter(u => u.role === 'admin' || u.role === 'superadmin');
    const teachersList = all.filter(u => u.role === 'educator');
    const studentsList = all.filter(u => u.role === 'student');

    const renderTabs = () => {
      tabsContainer.innerHTML = `
        <button class="calc-tab ${activeDirectoryTab === 'admin' ? 'active' : ''}" id="tab-dir-admin">Admin (${adminsList.length})</button>
        <button class="calc-tab ${activeDirectoryTab === 'teacher' ? 'active' : ''}" id="tab-dir-teacher">Teachers (${teachersList.length})</button>
        <button class="calc-tab ${activeDirectoryTab === 'student' ? 'active' : ''}" id="tab-dir-student">Students (${studentsList.length})</button>
      `;

      document.getElementById('tab-dir-admin').addEventListener('click', () => { activeDirectoryTab = 'admin'; directoryVisibleCount = 5; updateDirectoryView(); });
      document.getElementById('tab-dir-teacher').addEventListener('click', () => { activeDirectoryTab = 'teacher'; directoryVisibleCount = 5; updateDirectoryView(); });
      document.getElementById('tab-dir-student').addEventListener('click', () => { activeDirectoryTab = 'student'; directoryVisibleCount = 5; updateDirectoryView(); });
    };

    const updateDirectoryView = () => {
      renderTabs();

      let selectedUsers = [];
      if (activeDirectoryTab === 'admin') selectedUsers = adminsList;
      else if (activeDirectoryTab === 'teacher') selectedUsers = teachersList;
      else if (activeDirectoryTab === 'student') selectedUsers = studentsList;

      if (selectedUsers.length === 0) {
        allContainer.innerHTML = `<div class="empty-state">No users found in this category.</div>`;
        const dirShowMoreContainer = document.getElementById('directory-show-more-container');
        if (dirShowMoreContainer) dirShowMoreContainer.innerHTML = '';
        lucide.createIcons();
        return;
      }

      const slicedUsers = selectedUsers.slice(0, directoryVisibleCount);

      allContainer.innerHTML = slicedUsers.map(u => {
        const isPrimarySuperAdmin = u.phone === '8218325600';
        const canPromote = currentUser.role === 'superadmin' && u.role === 'admin';
        
        const canDelete = u.id !== currentUser.id && 
                          !isPrimarySuperAdmin && 
                          (currentUser.role === 'superadmin' || (currentUser.role === 'admin' && u.role === 'student'));

        return `
          <div class="user-card" style="padding: 14px 16px;">
            <div class="user-info">
              <h5 style="font-size: 15px; display: flex; align-items: center; gap: 6px;">
                ${escapeHTML(capitalizeName(u.name))}
                ${isPrimarySuperAdmin ? `
                  <span style="font-size: 10px; background-color: #fee2e2; color: #ef4444; padding: 2px 6px; border-radius: 4px; font-weight: bold;">
                    Primary Owner
                  </span>
                ` : ''}
              </h5>
              <p style="font-size: 12px;">Phone: ${escapeHTML(u.phone)}</p>
              <div style="display: flex; gap: 6px; margin-top: 4px;">
                <span class="user-tag" style="margin: 0; padding: 2px 6px; font-size: 10px; background-color: ${u.role === 'superadmin' ? '#fee2e2' : 'var(--primary-accent)'}; color: ${u.role === 'superadmin' ? '#ef4444' : 'var(--primary-dark)'};">
                  ${u.role === 'superadmin' ? 'Super Admin' : escapeHTML(u.role)}
                </span>
                <span class="user-tag" style="margin: 0; padding: 2px 6px; font-size: 10px; background-color: ${u.approved ? '#dcfce7' : '#fee2e2'}; color: ${u.approved ? '#166534' : '#991b1b'};">
                  ${u.approved ? 'Approved' : 'Pending'}
                </span>
              </div>
            </div>
            <div style="display: flex; align-items: center;">
              ${u.role === 'educator' && typeof u.points === 'number' ? `
                <span class="user-tag" style="margin: 0 8px 0 0; padding: 4px 10px; font-size: 11px; font-weight: 700; background-color: var(--primary-accent); color: var(--primary-dark);">
                  ${u.points} pts
                </span>
              ` : ''}
              ${u.id !== currentUser.id ? `
                <button class="btn btn-secondary btn-sm btn-message-user" data-id="${u.id}" data-name="${escapeHTML(capitalizeName(u.name))}" style="margin-right: 8px; font-size: 11px; padding: 4px 10px; display: flex; align-items: center; gap: 3px; background-color: var(--primary-accent); color: var(--primary-dark); border-color: var(--primary-accent);" title="Send Notification Message">
                  <i data-lucide="bell" style="width: 12px; height: 12px;"></i> Message
                </button>
              ` : ''}
              ${canPromote ? `
                <button class="btn btn-secondary btn-sm btn-promote-admin" data-id="${u.id}" style="margin-right: 8px; font-size: 11px; padding: 4px 10px; display: flex; align-items: center; gap: 3px; background-color: #e0f2fe; color: #0369a1; border-color: #bae6fd;" title="Promote to Super Admin">
                  <i data-lucide="award" style="width: 12px; height: 12px;"></i> Promote
                </button>
              ` : ''}
              ${canDelete ? `
                <button class="btn btn-danger btn-sm btn-delete-user" data-id="${u.id}" style="padding: 8px; border-radius: 50%;" title="Delete User">
                  <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');

      document.querySelectorAll('.btn-promote-admin').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Promote this admin to Super Admin? This action gives them absolute permission.')) return;
          const originalHTML = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 12px; height: 12px;"></i>';
          lucide.createIcons();
          try {
            const res = await api.promoteUser(btn.getAttribute('data-id'));
            alert(res.message || 'Successfully promoted user to Super Admin!');
            await renderAdminDashboardView();
          } catch (err) {
            alert(err.message || 'Promotion failed');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            lucide.createIcons();
          }
        });
      });

      document.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Permanently delete this user account?')) return;
          const originalHTML = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 12px; height: 12px;"></i>';
          lucide.createIcons();
          try {
            await api.deleteUser(btn.getAttribute('data-id'));
            await renderAdminDashboardView();
          } catch (err) {
            alert(err.message || 'Deletion failed');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            lucide.createIcons();
          }
        });
      });

      document.querySelectorAll('.btn-message-user').forEach(btn => {
        btn.addEventListener('click', () => {
          const userId = btn.getAttribute('data-id');
          const userName = btn.getAttribute('data-name');
          
          const modal = document.getElementById('modal-send-message');
          const userIdInput = document.getElementById('send-message-user-id');
          const nameInput = document.getElementById('send-message-recipient-name');
          const bodyTextarea = document.getElementById('send-message-body');
          const errAlert = document.getElementById('send-message-error-alert');
          
          if (modal && userIdInput && nameInput && bodyTextarea) {
            errAlert.style.display = 'none';
            bodyTextarea.value = '';
            userIdInput.value = userId;
            nameInput.value = userName;
            modal.style.display = 'flex';
            renderMessageTemplates();
          }
        });
      });

      // Render Show More button for Directory if needed
      const dirShowMoreContainer = document.getElementById('directory-show-more-container');
      const dirRemaining = selectedUsers.length - directoryVisibleCount;
      if (dirShowMoreContainer) {
        if (dirRemaining > 0) {
          dirShowMoreContainer.innerHTML = `
            <button id="btn-directory-show-more" class="btn btn-secondary" style="display: flex; align-items: center; gap: 6px; font-size: 13px; padding: 8px 16px; font-weight: 600;">
              Show More (${dirRemaining} remaining) <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
            </button>
          `;
          document.getElementById('btn-directory-show-more').addEventListener('click', () => {
            directoryVisibleCount += 10;
            updateDirectoryView();
          });
        } else {
          dirShowMoreContainer.innerHTML = '';
        }
      }

      lucide.createIcons();
    };

    updateDirectoryView();

    // Fetch and render help requests
    const helpRequestsContainer = document.getElementById('support-requests-list-container');
    const helpRequestsCount = document.getElementById('support-requests-count');

    if (helpRequestsContainer && helpRequestsCount) {
      helpRequestsContainer.innerHTML = '<div class="empty-state">Loading support requests...</div>';

      try {
        const tickets = await api.getHelpRequests();
        helpRequestsCount.textContent = tickets.length;

        if (tickets.length === 0) {
          helpRequestsContainer.innerHTML = '<div class="empty-state">No support requests submitted yet.</div>';
          const supportShowMoreContainer = document.getElementById('support-show-more-container');
          if (supportShowMoreContainer) supportShowMoreContainer.innerHTML = '';
        } else {
          const slicedTickets = tickets.slice(0, helpRequestsVisibleCount);

          helpRequestsContainer.innerHTML = slicedTickets.map(t => {
            const isResolved = t.status === 'resolved';
            const cardClass = isResolved ? 'status-resolved' : 'status-pending';
            const badgeClass = isResolved ? 'status-badge-resolved' : 'status-badge-pending';
            const statusText = isResolved ? 'Resolved' : 'Pending';
            const statusIcon = isResolved ? 'check-circle' : 'clock';
            
            const roleBadge = t.role === 'superadmin' ? 'Super Admin' : (t.role === 'educator' ? 'Educator' : 'Student');
            
            return `
              <div class="ticket-card ${cardClass}">
                <div class="ticket-header">
                  <div class="ticket-user-info">
                    <h5 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">${escapeHTML(capitalizeName(t.name))}</h5>
                    <div class="ticket-user-meta">
                      <span class="profile-role-badge" style="background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 2px 6px; font-size: 10px; font-weight: 600; text-transform: capitalize;">${roleBadge}</span>
                      <span>•</span>
                      <span style="display: flex; align-items: center; gap: 4px;"><i data-lucide="phone" style="width: 12px; height: 12px;"></i> ${escapeHTML(t.phone)}</span>
                      <span>•</span>
                      <span style="display: flex; align-items: center; gap: 4px;"><i data-lucide="calendar" style="width: 12px; height: 12px;"></i> ${new Date(t.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <span class="ticket-status-badge ${badgeClass}">
                    <i data-lucide="${statusIcon}" style="width: 14px; height: 14px;"></i> ${statusText}
                  </span>
                </div>
                <div class="ticket-subject" style="font-size: 15px; font-weight: 700; color: var(--primary-dark); margin-bottom: 8px;">Subject: ${escapeHTML(t.subject)}</div>
                <div class="ticket-message" style="font-size: 14px; color: var(--text-main); background-color: rgba(243, 248, 255, 0.3); padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid rgba(30, 86, 160, 0.05); line-height: 1.5; white-space: pre-wrap;">${escapeHTML(t.message)}</div>
                <div class="ticket-actions" style="display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin-top: 14px;">
                  <button class="btn btn-secondary btn-sm btn-resolve-ticket" data-id="${t.id}" style="padding: 6px 12px; display: flex; align-items: center; gap: 4px;">
                    ${isResolved ? `
                      <i data-lucide="clock" style="width: 14px; height: 14px;"></i> Mark Pending
                    ` : `
                      <i data-lucide="check-circle" style="width: 14px; height: 14px;"></i> Mark Resolved
                    `}
                  </button>
                  <button class="btn btn-danger btn-sm btn-delete-ticket" data-id="${t.id}" style="padding: 6px 12px; display: flex; align-items: center; gap: 4px;">
                    <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Delete Request
                  </button>
                </div>
              </div>
            `;
          }).join('');

          // Bind resolve handler
          helpRequestsContainer.querySelectorAll('.btn-resolve-ticket').forEach(btn => {
            btn.addEventListener('click', async () => {
              const id = btn.getAttribute('data-id');
              const originalHTML = btn.innerHTML;
              btn.disabled = true;
              btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i> Updating...';
              lucide.createIcons();
              try {
                await api.resolveHelpRequest(id);
                await renderAdminDashboardView();
              } catch (err) {
                alert(err.message || 'Failed to update request');
                btn.disabled = false;
                btn.innerHTML = originalHTML;
                lucide.createIcons();
              }
            });
          });

          // Bind delete handler
          helpRequestsContainer.querySelectorAll('.btn-delete-ticket').forEach(btn => {
            btn.addEventListener('click', async () => {
              const id = btn.getAttribute('data-id');
              if (!confirm('Are you sure you want to permanently delete this help request?')) return;
              const originalHTML = btn.innerHTML;
              btn.disabled = true;
              btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i> Deleting...';
              lucide.createIcons();
              try {
                await api.deleteHelpRequest(id);
                await renderAdminDashboardView();
              } catch (err) {
                alert(err.message || 'Failed to delete request');
                btn.disabled = false;
                btn.innerHTML = originalHTML;
                lucide.createIcons();
              }
            });
          });

          // Render Show More button for Support requests if needed
          const supportShowMoreContainer = document.getElementById('support-show-more-container');
          const supportRemaining = tickets.length - helpRequestsVisibleCount;
          if (supportShowMoreContainer) {
            if (supportRemaining > 0) {
              supportShowMoreContainer.innerHTML = `
                <button id="btn-support-show-more" class="btn btn-secondary" style="display: flex; align-items: center; gap: 6px; font-size: 13px; padding: 8px 16px; font-weight: 600;">
                  Show More (${supportRemaining} remaining) <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
                </button>
              `;
              document.getElementById('btn-support-show-more').addEventListener('click', () => {
                helpRequestsVisibleCount += 10;
                renderAdminDashboardView();
              });
            } else {
              supportShowMoreContainer.innerHTML = '';
            }
          }
        }
      } catch (err) {
        console.error('Error fetching help requests:', err);
        helpRequestsContainer.innerHTML = `<div class="empty-state" style="color: var(--danger);">Failed to load support requests: ${escapeHTML(err.message)}</div>`;
      }
    }

    // Fetch and render superadmin notification messages list
    const superadminMessagesSection = document.getElementById('superadmin-messages-section');
    const superadminMessagesContainer = document.getElementById('superadmin-messages-list-container');
    const superadminMessagesCount = document.getElementById('superadmin-messages-count');

    if (currentUser.role === 'superadmin' && superadminMessagesSection && superadminMessagesContainer && superadminMessagesCount) {
      superadminMessagesSection.style.display = 'block';
      superadminMessagesContainer.innerHTML = '<div class="empty-state">Loading sent messages...</div>';

      try {
        const notifications = await api.getAllNotifications();
        superadminMessagesCount.textContent = notifications.length;

        if (notifications.length === 0) {
          superadminMessagesContainer.innerHTML = '<div class="empty-state">No notification messages sent yet.</div>';
          const messagesShowMoreContainer = document.getElementById('messages-show-more-container');
          if (messagesShowMoreContainer) messagesShowMoreContainer.innerHTML = '';
        } else {
          const slicedNotifications = notifications.slice(0, notificationsVisibleCount);

          superadminMessagesContainer.innerHTML = slicedNotifications.map(n => {
            const seenLabelClass = n.read ? 'status-badge-resolved' : 'status-badge-pending';
            const seenText = n.read ? 'seen' : 'unseen';
            const seenIcon = n.read ? 'eye' : 'eye-off';
            
            return `
              <div class="ticket-card" style="border-left: 4px solid ${n.read ? '#10b981' : '#eab308'}; margin-bottom: 12px; padding: 14px 16px;">
                <div class="ticket-header" style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                  <div class="ticket-user-info">
                    <h5 style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">
                      To: ${escapeHTML(capitalizeName(n.recipient.name))} (${escapeHTML(n.recipient.phone)})
                    </h5>
                    <span style="font-size: 11px; color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px;">
                      <i data-lucide="calendar" style="width: 12px; height: 12px;"></i> ${new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <span class="ticket-status-badge ${seenLabelClass}" style="text-transform: capitalize; padding: 2px 8px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">
                    <i data-lucide="${seenIcon}" style="width: 12px; height: 12px;"></i> ${seenText}
                  </span>
                </div>
                <div class="ticket-message" style="font-size: 13px; color: var(--text-main); background-color: rgba(243, 248, 255, 0.3); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid rgba(30, 86, 160, 0.05); line-height: 1.5; white-space: pre-wrap;">${escapeHTML(n.message)}</div>
                <div class="ticket-actions" style="display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: 10px;">
                  ${!n.read ? `
                    <button class="btn btn-secondary btn-sm btn-edit-notification" data-id="${n.id}" data-raw="${escapeHTML(n.rawMessage)}" style="padding: 4px 10px; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; background-color: #f1f5f9; border-color: #cbd5e1; color: #475569;">
                      <i data-lucide="edit-2" style="width: 12px; height: 12px;"></i> Edit Message
                    </button>
                  ` : ''}
                  <button class="btn btn-danger btn-sm btn-delete-notification" data-id="${n.id}" style="padding: 4px 10px; display: inline-flex; align-items: center; gap: 4px; font-size: 11px;">
                    <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i> Delete
                  </button>
                </div>
              </div>
            `;
          }).join('');

          // Bind Edit button click
          superadminMessagesContainer.querySelectorAll('.btn-edit-notification').forEach(btn => {
            btn.addEventListener('click', async () => {
              const id = btn.getAttribute('data-id');
              const rawMessage = btn.getAttribute('data-raw');
              
              const newMsgBody = prompt('Edit your message body:', rawMessage);
              if (newMsgBody === null) return; // user cancelled
              
              if (!newMsgBody.trim()) {
                alert('Message body cannot be empty');
                return;
              }

              const originalHTML = btn.innerHTML;
              btn.disabled = true;
              btn.innerHTML = 'Saving...';

              try {
                await api.updateNotification(id, newMsgBody.trim());
                await renderAdminDashboardView();
              } catch (err) {
                alert(err.message || 'Failed to update message');
                btn.disabled = false;
                btn.innerHTML = originalHTML;
                lucide.createIcons();
              }
            });
          });

          // Bind Delete button click
          superadminMessagesContainer.querySelectorAll('.btn-delete-notification').forEach(btn => {
            btn.addEventListener('click', async () => {
              const id = btn.getAttribute('data-id');
              if (!confirm('Are you sure you want to delete this message?')) return;
              
              const originalHTML = btn.innerHTML;
              btn.disabled = true;
              btn.innerHTML = 'Deleting...';

              try {
                await api.deleteNotification(id);
                await renderAdminDashboardView();
              } catch (err) {
                alert(err.message || 'Failed to delete message');
                btn.disabled = false;
                btn.innerHTML = originalHTML;
                lucide.createIcons();
              }
            });
          });

          // Render Show More button for Sent notifications if needed
          const messagesShowMoreContainer = document.getElementById('messages-show-more-container');
          const messagesRemaining = notifications.length - notificationsVisibleCount;
          if (messagesShowMoreContainer) {
            if (messagesRemaining > 0) {
              messagesShowMoreContainer.innerHTML = `
                <button id="btn-messages-show-more" class="btn btn-secondary" style="display: flex; align-items: center; gap: 6px; font-size: 13px; padding: 8px 16px; font-weight: 600;">
                  Show More (${messagesRemaining} remaining) <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
                </button>
              `;
              document.getElementById('btn-messages-show-more').addEventListener('click', () => {
                notificationsVisibleCount += 10;
                renderAdminDashboardView();
              });
            } else {
              messagesShowMoreContainer.innerHTML = '';
            }
          }
        }
      } catch (err) {
        console.error('Error fetching sent notifications:', err);
        superadminMessagesContainer.innerHTML = `<div class="empty-state" style="color: var(--danger);">Failed to load sent notifications: ${escapeHTML(err.message)}</div>`;
      }
    } else if (superadminMessagesSection) {
      superadminMessagesSection.style.display = 'none';
      const messagesShowMoreContainer = document.getElementById('messages-show-more-container');
      if (messagesShowMoreContainer) messagesShowMoreContainer.innerHTML = '';
    }

    lucide.createIcons();

  } catch (err) {
    errorAlert.textContent = err.message || 'Failed to load control panel directory';
    errorAlert.style.display = 'block';
  }
}

// --- MODAL UTILITIES ---

function closeAllModals() {
  document.getElementById('modal-folder').style.display = 'none';
  document.getElementById('modal-upload').style.display = 'none';
  if (document.getElementById('modal-edit-document')) document.getElementById('modal-edit-document').style.display = 'none';
  if (document.getElementById('modal-send-message')) document.getElementById('modal-send-message').style.display = 'none';
  if (document.getElementById('modal-view-notification')) document.getElementById('modal-view-notification').style.display = 'none';
}

function openFolderModal(sectionType, folderId = '', folderName = '') {
  document.getElementById('modal-folder-id').value = folderId;
  document.getElementById('modal-folder-section-type').value = sectionType;
  document.getElementById('modal-folder-name').value = folderName;
  
  const title = document.getElementById('modal-folder-title');
  if (folderId) {
    title.textContent = 'Rename Subject Folder';
  } else {
    title.textContent = 'Add Subject Folder';
  }

  document.getElementById('modal-folder').style.display = 'flex';
  document.getElementById('modal-folder-name').focus();
}

function openUploadModal(docType, folderId = null, folderName = '') {
  document.getElementById('upload-error-alert').style.display = 'none';
  document.getElementById('upload-section-type').value = docType;
  document.getElementById('upload-folder-id').value = folderId || '';
  document.getElementById('upload-folder-name').value = folderName;
  
  const titleEl = document.getElementById('modal-upload-title');
  const subjectDisplayGroup = document.getElementById('upload-subject-display-group');
  const subjectDisplayInp = document.getElementById('upload-doc-subject-display');
  const syllabusGroup = document.getElementById('upload-syllabus-subject-group');
  
  // Set upload title heading
  if (docType === 'notes') {
    titleEl.textContent = 'Upload Notes PDF';
    subjectDisplayGroup.style.display = 'block';
    subjectDisplayInp.value = folderName;
    syllabusGroup.style.display = 'none';
  } else if (docType === 'paper') {
    titleEl.textContent = 'Upload Previous Year Paper (PYQ) PDF';
    subjectDisplayGroup.style.display = 'block';
    subjectDisplayInp.value = folderName;
    syllabusGroup.style.display = 'none';
  } else if (docType === 'lab_manual') {
    titleEl.textContent = 'Upload Lab Manual PDF';
    subjectDisplayGroup.style.display = 'block';
    subjectDisplayInp.value = folderName;
    syllabusGroup.style.display = 'none';
  } else if (docType === 'book') {
    titleEl.textContent = 'Upload Book PDF';
    subjectDisplayGroup.style.display = 'block';
    subjectDisplayInp.value = folderName;
    syllabusGroup.style.display = 'none';
  } else if (docType === 'syllabus') {
    titleEl.textContent = 'Upload Syllabus PDF';
    subjectDisplayGroup.style.display = 'none';
    syllabusGroup.style.display = 'block';
    
    // Load Note Folders to populate syllabus subject tag drop down
    const selectEl = document.getElementById('upload-syllabus-subject-select');
    selectEl.innerHTML = '<option value="Syllabus">General Syllabus</option>';
    notesFoldersList.forEach(n => {
      selectEl.innerHTML += `<option value="${escapeHTML(n.name)}">${escapeHTML(n.name)}</option>`;
    });
  }

  // Reset upload source mode and UI tabs
  uploadSourceMode = 'file';
  const tabFileEl = document.getElementById('tab-upload-file');
  const tabLinkEl = document.getElementById('tab-upload-link');
  if (tabFileEl) tabFileEl.classList.add('active');
  if (tabLinkEl) tabLinkEl.classList.remove('active');
  
  const groupFileEl = document.getElementById('group-upload-file');
  const groupLinkEl = document.getElementById('group-upload-link');
  if (groupFileEl) groupFileEl.style.display = 'block';
  if (groupLinkEl) groupLinkEl.style.display = 'none';
  
  const linkInputEl = document.getElementById('upload-link-input');
  if (linkInputEl) linkInputEl.value = '';

  // Clear file inputs
  document.getElementById('upload-doc-title').value = '';
  document.getElementById('upload-file-input').value = '';
  document.getElementById('upload-file-label').textContent = 'Click to browse files';
  
  document.getElementById('modal-upload').style.display = 'flex';
}

// --- MY UPLOADS VIEW RENDERER ---
async function renderMyUploadsView() {
  const container = document.getElementById('my-uploads-list-container');
  if (!container) return;

  container.innerHTML = '<div class="empty-state"><div style="width: 30px; height: 30px; border: 3px solid var(--primary-accent); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>Loading your uploads...</div>';

  try {
    myUploadsDocsList = await api.getMyUploads();
    renderFilteredMyUploads();
  } catch (err) {
    console.error('Error loading my uploads:', err);
    container.innerHTML = `<div class="empty-state" style="color: var(--danger);">Failed to load uploaded documents: ${escapeHTML(err.message)}</div>`;
  }
}

function renderFilteredMyUploads() {
  const container = document.getElementById('my-uploads-list-container');
  if (!container) return;

  const searchInput = document.getElementById('my-uploads-search');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  const filtered = myUploadsDocsList.filter(doc => {
    const title = doc.title || '';
    const subject = doc.subject || '';
    const type = doc.type || '';
    return title.toLowerCase().includes(query) || 
           subject.toLowerCase().includes(query) ||
           type.toLowerCase().includes(query);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>${query ? 'No matching documents found.' : 'You have not uploaded any documents yet.'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="docs-list">
      ${filtered.map(doc => {
        let displayType = doc.type;
        if (doc.type === 'notes') displayType = 'Note';
        else if (doc.type === 'paper') displayType = 'PYQ/Paper';
        else if (doc.type === 'lab_manual') displayType = 'Lab Manual';
        else if (doc.type === 'book') displayType = 'Book';
        else if (doc.type === 'syllabus') displayType = 'Syllabus';

        return `
          <div class="doc-card">
            <div class="doc-info">
              <div class="doc-icon-container" style="background-color: var(--primary-accent); color: var(--primary-dark);">
                <i data-lucide="file-text" style="width: 20px; height: 20px;"></i>
              </div>
              <div class="doc-meta">
                <h5>${escapeHTML(doc.title)} <span class="user-tag" style="background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; font-size: 11px;">${displayType}</span></h5>
                <div class="doc-meta-details">
                  <span>Subject: ${escapeHTML(doc.subject || 'General')}</span>
                  <span>•</span>
                  <span>Year: ${escapeHTML(doc.year || 'N/A')}</span>
                  <span>•</span>
                  <span>Uploaded: ${new Date(doc.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div class="doc-actions">
              <a href="${doc.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="padding: 8px 12px;">
                <i data-lucide="eye" style="width: 14px; height: 14px;"></i> View
              </a>
              <button class="btn btn-secondary btn-sm btn-edit-uploaded-doc" 
                data-id="${doc.id}" 
                data-title="${escapeHTML(doc.title)}" 
                data-subject="${escapeHTML(doc.subject || '')}" 
                data-year="${escapeHTML(doc.year || '')}"
                style="padding: 8px 12px;">
                <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i> Edit
              </button>
              <button class="btn btn-danger btn-sm btn-delete-uploaded-doc" data-id="${doc.id}" style="padding: 8px 12px;">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Delete
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Attach event handlers to dynamic edit buttons
  container.querySelectorAll('.btn-edit-uploaded-doc').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const title = btn.getAttribute('data-title');
      const subject = btn.getAttribute('data-subject');
      const year = btn.getAttribute('data-year');
      openEditDocumentModal(id, title, subject, year);
    });
  });

  // Attach event handlers to dynamic delete buttons
  container.querySelectorAll('.btn-delete-uploaded-doc').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (!confirm('Are you sure you want to delete this document permanently?')) return;
      const originalHTML = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
      lucide.createIcons();
      try {
        await api.deleteDocument(id);
        await renderMyUploadsView();
      } catch (err) {
        alert(err.message || 'Failed to delete document');
        btn.disabled = false;
        btn.innerHTML = originalHTML;
        lucide.createIcons();
      }
    });
  });

  lucide.createIcons();
}

function openEditDocumentModal(docId, title, subject, year) {
  document.getElementById('edit-doc-id').value = docId;
  document.getElementById('edit-doc-title').value = title;
  document.getElementById('edit-doc-subject').value = subject;
  
  const yearSelect = document.getElementById('edit-doc-year');
  if (yearSelect) {
    yearSelect.value = year;
  }
  
  document.getElementById('edit-doc-error-alert').style.display = 'none';
  document.getElementById('modal-edit-document').style.display = 'flex';
}

// HELP & SUPPORT VIEW
async function renderSupportView() {
  const errorAlert = document.getElementById('support-error-alert');
  const successAlert = document.getElementById('support-success-alert');

  errorAlert.style.display = 'none';
  successAlert.style.display = 'none';

  if (!currentUser) {
    navigate('#/login');
    return;
  }

  // Populate user info fields
  document.getElementById('support-user-name').value = capitalizeName(currentUser.name);
  document.getElementById('support-user-phone').value = currentUser.phone;
  
  let displayRole = currentUser.role;
  if (currentUser.role === 'educator') displayRole = 'Educator (Teacher)';
  else if (currentUser.role === 'superadmin') displayRole = 'Super Admin';
  document.getElementById('support-user-role').value = displayRole;

  // Clear inputs
  document.getElementById('support-subject').value = '';
  document.getElementById('support-message').value = '';

  lucide.createIcons();
}

// --- FORM AND DOM INTERACTIVE HANDLERS ---

function initEventHandlers() {
  
  // Mobile Hamburger Toggle
  const btnHamburger = document.getElementById('btn-hamburger');
  const mobMenu = document.getElementById('mobile-nav-menu');
  const mobOverlay = document.getElementById('mobile-nav-overlay');
  if (btnHamburger && mobMenu && mobOverlay) {
    btnHamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      mobMenu.classList.add('open');
      mobOverlay.classList.add('open');
      document.body.style.overflow = 'hidden'; // PREVENT BACKGROUND SCROLL
    });
    // Close menu when clicking on the overlay
    mobOverlay.addEventListener('click', () => {
      mobMenu.classList.remove('open');
      mobOverlay.classList.remove('open');
      document.body.style.overflow = ''; // RESTORE BACKGROUND SCROLL
    });
    mobMenu.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // Hash Routing
  window.addEventListener('hashchange', router);

  // Footer Year
  document.getElementById('footer-year').textContent = new Date().getFullYear();

  // Populate dynamic upload academic years
  const uploadYearSel = document.getElementById('upload-doc-year');
  const years = getAcademicYears();
  uploadYearSel.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');

  // 1. ANNOUNCEMENT POST FORM
  const addAnnBtn = document.getElementById('btn-add-announcement');
  const annForm = document.getElementById('form-announcement');
  const addAnnText = document.getElementById('text-add-announcement');

  addAnnBtn.addEventListener('click', () => {
    if (annForm.style.display === 'none') {
      annForm.style.display = 'block';
      addAnnText.textContent = 'Cancel';
    } else {
      annForm.style.display = 'none';
      addAnnText.textContent = 'Add Announcement';
    }
  });

  annForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('ann-title').value.trim();
    const content = document.getElementById('ann-content').value.trim();
    if (!title || !content) return;

    const submitBtn = annForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';

    try {
      await api.createAnnouncement(title, content);
      document.getElementById('ann-title').value = '';
      document.getElementById('ann-content').value = '';
      annForm.style.display = 'none';
      addAnnText.textContent = 'Add Announcement';
      await renderHomeView();
    } catch (err) {
      alert(err.message || 'Failed to post announcement');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // 2. LOGIN FORM
  const loginForm = document.getElementById('form-login');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = document.getElementById('login-phone').value.trim();
    const password = document.getElementById('login-password').value;
    const errorAlert = document.getElementById('login-error-alert');
    const btnContent = document.getElementById('login-btn-content');

    errorAlert.style.display = 'none';
    btnContent.innerHTML = 'Logging in...';

    try {
      const res = await api.login(phone, password);
      currentUser = res.user;
      updateNavbar();
      startNotificationPolling();
      navigate('#/');
    } catch (err) {
      errorAlert.textContent = err.message || 'Failed to login';
      errorAlert.style.display = 'block';
      if (err.message && err.message.includes('pending')) {
        errorAlert.className = 'alert alert-warning';
      } else {
        errorAlert.className = 'alert alert-danger';
      }
      btnContent.innerHTML = '<i data-lucide="log-in" style="width:18px;height:18px;"></i> Login';
      lucide.createIcons();
    }
  });

  // Password Visibility Toggles
  const btnShowLoginPass = document.getElementById('btn-show-login-password');
  if (btnShowLoginPass) {
    btnShowLoginPass.addEventListener('click', () => {
      const input = document.getElementById('login-password');
      const icon = btnShowLoginPass.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
      }
      lucide.createIcons();
    });
  }

  const btnShowSignupPass = document.getElementById('btn-show-signup-password');
  if (btnShowSignupPass) {
    btnShowSignupPass.addEventListener('click', () => {
      const input = document.getElementById('signup-password');
      const icon = btnShowSignupPass.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
      }
      lucide.createIcons();
    });
  }

  // 3. SIGNUP FORM
  const signupForm = document.getElementById('form-signup');
  const roleSelect = document.getElementById('signup-role');
  const roleHint = document.getElementById('signup-role-hint');

  // Dropdown role hint changer
  if (roleSelect && roleHint) {
    roleSelect.addEventListener('change', (e) => {
      if (e.target.value === 'student') {
        roleHint.textContent = '✓ Instant approval. Get immediate access.';
      } else {
        roleHint.textContent = '⚠ Requires Admin manual approval before logging in.';
      }
    });
  }

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const phone = document.getElementById('signup-phone').value.trim();
    const password = document.getElementById('signup-password').value;
    const role = roleSelect ? roleSelect.value : 'student';

    const errorAlert = document.getElementById('signup-error-alert');
    const successAlert = document.getElementById('signup-success-alert');
    const successText = document.getElementById('signup-success-text');
    const btnContent = document.getElementById('signup-btn-content');

    errorAlert.style.display = 'none';
    successAlert.style.display = 'none';
    btnContent.innerHTML = 'Creating Account...';

    if (phone.length < 10) {
      errorAlert.textContent = 'Phone number must be at least 10 digits';
      errorAlert.style.display = 'block';
      btnContent.innerHTML = '<i data-lucide="user-plus" style="width:18px;height:18px;"></i> Register';
      lucide.createIcons();
      return;
    }

    try {
      const res = await api.signup(name, phone, password, role);
      if (res.requiresApproval) {
        successText.textContent = res.message;
        successAlert.style.display = 'flex';
        signupForm.style.display = 'none';
      } else {
        currentUser = res.user;
        updateNavbar();
        startNotificationPolling();
        navigate('#/');
      }
    } catch (err) {
      errorAlert.textContent = err.message || 'Failed to sign up';
      errorAlert.style.display = 'block';
    } finally {
      btnContent.innerHTML = '<i data-lucide="user-plus" style="width:18px;height:18px;"></i> Register';
      lucide.createIcons();
    }
  });

  // 4. FOLDER OPERATION MODAL FORM
  const folderForm = document.getElementById('form-folder');
  
  // Close / Cancel modal listeners
  document.getElementById('modal-folder-close').addEventListener('click', closeAllModals);
  document.getElementById('modal-folder-cancel').addEventListener('click', closeAllModals);

  folderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const folderId = document.getElementById('modal-folder-id').value;
    const name = document.getElementById('modal-folder-name').value.trim();
    const sectionType = document.getElementById('modal-folder-section-type').value;

    if (!name) return;

    const submitBtn = folderForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
      if (folderId) {
        // Rename folder
        await api.renameFolder(folderId, name);
      } else {
        // Create new folder
        await api.createFolder(name, sectionType);
      }
      closeAllModals();

      // Reload active view state
      if (sectionType === 'notes') {
        await renderNotesView();
      } else if (sectionType === 'papers') {
        await renderPapersView();
      } else {
        await renderResourcesView();
      }
    } catch (err) {
      alert(err.message || 'Failed to save subject folder');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // 5. DOCUMENT UPLOAD MODAL FORM
  const uploadForm = document.getElementById('form-upload');
  const dragBox = document.getElementById('upload-drag-box');
  const fileInput = document.getElementById('upload-file-input');
  const fileLabel = document.getElementById('upload-file-label');

  document.getElementById('modal-upload-close').addEventListener('click', closeAllModals);
  document.getElementById('modal-upload-cancel').addEventListener('click', closeAllModals);

  // File trigger click
  dragBox.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      fileLabel.textContent = file.name;
    } else {
      fileLabel.textContent = 'Click to browse files';
    }
  });

  // Source Mode tab switcher events
  const tabUploadFile = document.getElementById('tab-upload-file');
  const tabUploadLink = document.getElementById('tab-upload-link');
  const groupUploadFile = document.getElementById('group-upload-file');
  const groupUploadLink = document.getElementById('group-upload-link');
  const uploadLinkInput = document.getElementById('upload-link-input');
  const uploadErrorAlert = document.getElementById('upload-error-alert');

  if (tabUploadFile && tabUploadLink) {
    tabUploadFile.addEventListener('click', () => {
      uploadSourceMode = 'file';
      tabUploadFile.classList.add('active');
      tabUploadLink.classList.remove('active');
      if (groupUploadFile) groupUploadFile.style.display = 'block';
      if (groupUploadLink) groupUploadLink.style.display = 'none';
      if (uploadErrorAlert) uploadErrorAlert.style.display = 'none';
    });

    tabUploadLink.addEventListener('click', () => {
      uploadSourceMode = 'link';
      tabUploadFile.classList.remove('active');
      tabUploadLink.classList.add('active');
      if (groupUploadFile) groupUploadFile.style.display = 'none';
      if (groupUploadLink) groupUploadLink.style.display = 'block';
      if (uploadErrorAlert) uploadErrorAlert.style.display = 'none';
    });
  }

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorAlert = document.getElementById('upload-error-alert');
    const docType = document.getElementById('upload-section-type').value;
    const folderId = document.getElementById('upload-folder-id').value;
    const title = document.getElementById('upload-doc-title').value.trim();
    const year = document.getElementById('upload-doc-year').value;
    const uploadBtnSubmit = document.getElementById('btn-upload-submit');

    errorAlert.style.display = 'none';

    if (!title) {
      errorAlert.textContent = 'Please enter a document title';
      errorAlert.style.display = 'block';
      return;
    }

    // Determine subject tag
    let subject = document.getElementById('upload-folder-name').value;
    if (docType === 'syllabus') {
      subject = document.getElementById('upload-syllabus-subject-select').value;
    }

    uploadBtnSubmit.disabled = true;
    uploadBtnSubmit.textContent = 'Processing...';

    try {
      if (uploadSourceMode === 'file') {
        const file = fileInput.files[0];
        if (!file) {
          errorAlert.textContent = 'Please select a PDF file to upload';
          errorAlert.style.display = 'block';
          uploadBtnSubmit.disabled = false;
          uploadBtnSubmit.textContent = 'Upload';
          return;
        }

        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
          errorAlert.textContent = 'Only PDF documents are allowed';
          errorAlert.style.display = 'block';
          uploadBtnSubmit.disabled = false;
          uploadBtnSubmit.textContent = 'Upload';
          return;
        }

        // Check file size (10 MB = 10485760 bytes)
        const MAX_FILE_SIZE = 10485760;
        if (file.size > MAX_FILE_SIZE) {
          errorAlert.textContent = `File size too large. Got ${file.size}. Maximum is ${MAX_FILE_SIZE}.`;
          errorAlert.style.display = 'block';
          uploadBtnSubmit.disabled = false;
          uploadBtnSubmit.textContent = 'Upload';
          return;
        }

        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('title', title);
        formData.append('type', docType);
        formData.append('folderId', folderId || '');
        formData.append('subject', subject || '');
        formData.append('year', year || '');

        await request('/documents/upload', {
          method: 'POST',
          body: formData
        });
      } else {
        const fileUrl = uploadLinkInput.value.trim();
        if (!fileUrl) {
          errorAlert.textContent = 'Please enter a valid document URL';
          errorAlert.style.display = 'block';
          uploadBtnSubmit.disabled = false;
          uploadBtnSubmit.textContent = 'Upload';
          return;
        }

        if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
          errorAlert.textContent = 'URL must start with http:// or https://';
          errorAlert.style.display = 'block';
          uploadBtnSubmit.disabled = false;
          uploadBtnSubmit.textContent = 'Upload';
          return;
        }

        await request('/documents/upload', {
          method: 'POST',
          body: {
            title,
            type: docType,
            folderId: folderId && folderId !== 'null' ? folderId : null,
            subject: subject || null,
            year: year || null,
            fileUrl,
            fileName: title.toLowerCase().replace(/[^a-z0-9]/g, '_') + '.pdf'
          }
        });
      }

      closeAllModals();
      
      // Reload corresponding view
      if (docType === 'notes') {
        await renderNotesView();
      } else if (docType === 'paper') {
        await renderPapersView();
      } else {
        await renderResourcesView();
      }
    } catch (err) {
      errorAlert.textContent = err.message || 'Failed to process document';
      errorAlert.style.display = 'block';
    } finally {
      uploadBtnSubmit.disabled = false;
      uploadBtnSubmit.textContent = 'Upload';
    }
  });

  // 6. EDIT DOCUMENT MODAL FORM
  const editDocForm = document.getElementById('form-edit-document');
  const editDocYearSel = document.getElementById('edit-doc-year');
  if (editDocYearSel) {
    editDocYearSel.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
  }

  const closeEditDocModal = () => {
    document.getElementById('modal-edit-document').style.display = 'none';
  };

  const btnCloseEditDoc = document.getElementById('modal-edit-document-close');
  if (btnCloseEditDoc) {
    btnCloseEditDoc.addEventListener('click', closeEditDocModal);
  }
  const btnCancelEditDoc = document.getElementById('modal-edit-document-cancel');
  if (btnCancelEditDoc) {
    btnCancelEditDoc.addEventListener('click', closeEditDocModal);
  }

  if (editDocForm) {
    editDocForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorAlert = document.getElementById('edit-doc-error-alert');
      const docId = document.getElementById('edit-doc-id').value;
      const title = document.getElementById('edit-doc-title').value.trim();
      const subject = document.getElementById('edit-doc-subject').value.trim();
      const year = editDocYearSel.value;
      const saveBtnSubmit = document.getElementById('btn-edit-document-submit');

      errorAlert.style.display = 'none';

      if (!title) {
        errorAlert.textContent = 'Document title is required';
        errorAlert.style.display = 'block';
        return;
      }

      saveBtnSubmit.disabled = true;
      saveBtnSubmit.textContent = 'Saving changes...';

      try {
        await api.updateDocument(docId, title, subject, year);
        closeEditDocModal();
        
        // Refresh active views
        const hash = window.location.hash || '#/';
        if (hash === '#/my-uploads') {
          await renderMyUploadsView();
        } else if (hash === '#/notes') {
          await renderNotesView();
        } else if (hash === '#/papers') {
          await renderPapersView();
        } else if (hash === '#/resources') {
          await renderResourcesView();
        }
      } catch (err) {
        errorAlert.textContent = err.message || 'Failed to save changes';
        errorAlert.style.display = 'block';
      } finally {
        saveBtnSubmit.disabled = false;
        saveBtnSubmit.textContent = 'Save Changes';
      }
    });
  }

  // SEND MESSAGE MODAL (Admin Only)
  const sendMessageForm = document.getElementById('form-send-message');
  const closeSendMessageModal = () => {
    document.getElementById('modal-send-message').style.display = 'none';
  };

  const btnCloseSendMessage = document.getElementById('modal-send-message-close');
  if (btnCloseSendMessage) {
    btnCloseSendMessage.addEventListener('click', closeSendMessageModal);
  }
  const btnCancelSendMessage = document.getElementById('modal-send-message-cancel');
  if (btnCancelSendMessage) {
    btnCancelSendMessage.addEventListener('click', closeSendMessageModal);
  }

  if (sendMessageForm) {
    sendMessageForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorAlert = document.getElementById('send-message-error-alert');
      const userId = document.getElementById('send-message-user-id').value;
      const message = document.getElementById('send-message-body').value.trim();
      const submitBtn = document.getElementById('btn-send-message-submit');

      errorAlert.style.display = 'none';

      if (!message) {
        errorAlert.textContent = 'Message body is required';
        errorAlert.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';

      try {
        await api.sendNotification(userId, message);
        closeSendMessageModal();
        alert('Message sent successfully!');
      } catch (err) {
        errorAlert.textContent = err.message || 'Failed to send message';
        errorAlert.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  const btnSaveTemplate = document.getElementById('btn-save-as-template');
  if (btnSaveTemplate) {
    btnSaveTemplate.addEventListener('click', () => {
      const textarea = document.getElementById('send-message-body');
      if (!textarea || !textarea.value.trim()) {
        alert('Please write some text in the message body first to save as a template.');
        return;
      }
      const name = prompt('Enter a name for this template:');
      if (name && name.trim()) {
        saveMessageTemplate(name.trim(), textarea.value.trim());
      }
    });
  }

  // 7. MY UPLOADS SEARCH
  const myUploadsSearch = document.getElementById('my-uploads-search');
  if (myUploadsSearch) {
    myUploadsSearch.addEventListener('input', renderFilteredMyUploads);
  }

  // 8. HELP & SUPPORT SUBMISSION
  const supportForm = document.getElementById('form-support');
  if (supportForm) {
    supportForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const subject = document.getElementById('support-subject').value.trim();
      const message = document.getElementById('support-message').value.trim();
      const errorAlert = document.getElementById('support-error-alert');
      const successAlert = document.getElementById('support-success-alert');
      const submitBtn = supportForm.querySelector('button[type="submit"]');
      const btnContent = document.getElementById('support-btn-content');

      errorAlert.style.display = 'none';
      successAlert.style.display = 'none';

      if (!subject || !message) {
        errorAlert.textContent = 'Subject and message are required';
        errorAlert.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      const originalHTML = btnContent.innerHTML;
      btnContent.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 18px; height: 18px;"></i> Submitting...';
      lucide.createIcons();

      try {
        await api.submitHelpRequest(subject, message);
        successAlert.textContent = 'Your help and support request has been submitted successfully!';
        successAlert.style.display = 'block';
        document.getElementById('support-subject').value = '';
        document.getElementById('support-message').value = '';
        
        // Scroll support container to top to show success alert
        const supportCard = document.querySelector('.support-card');
        if (supportCard) supportCard.scrollTop = 0;
      } catch (err) {
        errorAlert.textContent = err.message || 'Failed to submit help request';
        errorAlert.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        btnContent.innerHTML = originalHTML;
        lucide.createIcons();
      }
    });
  }
}

// Helper to escape HTML characters
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper to capitalize first letter of each word in a name
function capitalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// --- NOTIFICATION POLLING SYSTEM ---
let notificationPollInterval = null;
let isNotificationModalActive = false;

function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    
    // Play double chime: E5 (659Hz) then A5 (880Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc1.start(now);
    osc1.stop(now + 0.35);
    
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.3, now + 0.17);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.5);
  } catch (err) {
    console.error("Failed to play notification sound:", err);
  }
}

async function checkNotifications() {
  // If not logged in, or already displaying a notification modal, do nothing
  if (!localStorage.getItem('token') || isNotificationModalActive) return;

  try {
    const unread = await api.getUnreadNotifications();
    if (unread && unread.length > 0) {
      // Pick the first unread notification to show
      const notif = unread[0];
      showNotificationModal(notif);
    }
  } catch (err) {
    console.error('Error polling notifications:', err);
  }
}

function showNotificationModal(notif) {
  isNotificationModalActive = true;
  
  // Play the chime
  playNotificationSound();
  
  const modal = document.getElementById('modal-view-notification');
  const contentEl = document.getElementById('notification-message-content');
  
  if (modal && contentEl) {
    contentEl.textContent = notif.message;
    modal.style.display = 'flex';
    lucide.createIcons(); // trigger icon rendering inside modal
    
    // Bind dismiss handlers
    const closeBtn = document.getElementById('modal-view-notification-close');
    const ackBtn = document.getElementById('btn-notification-acknowledge');
    
    const handleClose = async () => {
      modal.style.display = 'none';
      isNotificationModalActive = false;
      try {
        await api.markNotificationRead(notif.id);
        // check again for any more queued unread notifications
        setTimeout(checkNotifications, 1000);
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    };
    
    closeBtn.onclick = handleClose;
    ackBtn.onclick = handleClose;
  }
}

function startNotificationPolling() {
  if (notificationPollInterval) clearInterval(notificationPollInterval);
  
  // Check immediately
  checkNotifications();
  
  // Poll every 8 seconds
  notificationPollInterval = setInterval(checkNotifications, 8000);
}

function stopNotificationPolling() {
  if (notificationPollInterval) {
    clearInterval(notificationPollInterval);
    notificationPollInterval = null;
  }
}

// --- MESSAGE TEMPLATES SYSTEM ---
let messageTemplatesList = [];

async function saveMessageTemplate(name, content) {
  try {
    await api.saveMessageTemplate(name, content);
    await renderMessageTemplates();
  } catch (err) {
    alert(err.message || 'Failed to save template');
  }
}

async function renderMessageTemplates() {
  const container = document.getElementById('quick-templates-container');
  if (!container) return;
  
  container.innerHTML = '<span style="font-size: 11px; color: var(--text-muted);">Loading templates...</span>';

  try {
    messageTemplatesList = await api.getMessageTemplates();
    if (messageTemplatesList.length === 0) {
      container.innerHTML = '<span style="font-size: 11px; color: var(--text-muted);">No templates saved.</span>';
      return;
    }

    container.innerHTML = messageTemplatesList.map((t, idx) => `
      <button type="button" class="btn btn-secondary btn-sm btn-select-template" data-index="${idx}" style="font-size: 11px; padding: 4px 8px; background-color: #f1f5f9; border-color: #e2e8f0; color: #475569;">
        ${escapeHTML(t.name)}
      </button>
    `).join('');
    
    container.querySelectorAll('.btn-select-template').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = btn.getAttribute('data-index');
        const target = messageTemplatesList[idx];
        const textarea = document.getElementById('send-message-body');
        if (textarea && target) {
          textarea.value = target.content;
        }
      });
    });
  } catch (err) {
    console.error('Error rendering templates:', err);
    container.innerHTML = '<span style="font-size: 11px; color: var(--danger);">Failed to load templates.</span>';
  }
}

// --- INITIALIZE APPLICATION ---
async function initApp() {
  // Restore view states from localStorage
  try {
    const savedNotesFolder = localStorage.getItem('currentNotesFolder');
    if (savedNotesFolder && savedNotesFolder !== 'null') currentNotesFolder = JSON.parse(savedNotesFolder);
  } catch (e) { console.error('Error restoring currentNotesFolder:', e); }

  try {
    const savedPapersFolder = localStorage.getItem('currentPapersFolder');
    if (savedPapersFolder && savedPapersFolder !== 'null') currentPapersFolder = JSON.parse(savedPapersFolder);
  } catch (e) { console.error('Error restoring currentPapersFolder:', e); }

  try {
    const savedResourcesFolder = localStorage.getItem('currentResourcesFolder');
    if (savedResourcesFolder && savedResourcesFolder !== 'null') currentResourcesFolder = JSON.parse(savedResourcesFolder);
  } catch (e) { console.error('Error restoring currentResourcesFolder:', e); }

  try {
    const savedRoadmapStack = localStorage.getItem('roadmapFolderStack');
    if (savedRoadmapStack) roadmapFolderStack = JSON.parse(savedRoadmapStack);
  } catch (e) { console.error('Error restoring roadmapFolderStack:', e); }

  const savedResourcesSection = localStorage.getItem('currentResourcesSection');
  if (savedResourcesSection) currentResourcesSection = savedResourcesSection;

  const token = localStorage.getItem('token');
  document.getElementById('view-loading').style.display = 'flex';

  if (token) {
    try {
      currentUser = await api.getMe();
      localStorage.setItem('user', JSON.stringify(currentUser));
      startNotificationPolling();
    } catch (err) {
      console.error('Session validation failed:', err.message);
      api.logout();
      currentUser = null;
    }
  }

  // Pre-load note folders in memory for dropdown tagging inside syllabus upload
  try {
    notesFoldersList = await api.getFolders('notes');
  } catch (err) {
    console.error('Failed pre-loading subjects list', err);
  }

  document.getElementById('view-loading').style.display = 'none';
  
  updateNavbar();
  initEventHandlers();
  
  // Run routing trigger
  await router();
}

// Launch app
window.addEventListener('DOMContentLoaded', initApp);

async function handleLikeToggle(e, viewRefreshCallback) {
  e.stopPropagation();
  const btn = e.currentTarget;
  const docId = btn.getAttribute('data-id');
  if (!docId) return;

  btn.disabled = true;
  try {
    await api.toggleLikeDocument(docId);
    await viewRefreshCallback();
  } catch (err) {
    alert(err.message || 'Failed to toggle like');
    btn.disabled = false;
  }
}

async function renderTeacherDashboardView() {
  const statsOwnUploads = document.getElementById('stats-own-uploads');
  const statsOwnLikes = document.getElementById('stats-own-likes');
  const statsTotalTeacherUploads = document.getElementById('stats-total-teacher-uploads');
  const rankingListContainer = document.getElementById('dashboard-ranking-list');

  if (!statsOwnUploads || !statsOwnLikes || !statsTotalTeacherUploads || !rankingListContainer) return;

  statsOwnUploads.textContent = '...';
  statsOwnLikes.textContent = '...';
  statsTotalTeacherUploads.textContent = '...';
  rankingListContainer.innerHTML = '<div class="empty-state">Loading rankings and stats...</div>';

  try {
    const stats = await api.getTeacherStats();
    statsOwnUploads.textContent = stats.ownFilesCount;
    statsOwnLikes.textContent = stats.ownLikesCount;
    statsTotalTeacherUploads.textContent = stats.totalTeacherFiles;

    const ranking = await api.getTeacherRanking();
    if (ranking.length === 0) {
      rankingListContainer.innerHTML = '<div class="empty-state">No educators registered yet.</div>';
      return;
    }

    rankingListContainer.innerHTML = ranking.map((t, index) => {
      const rankNum = index + 1;
      let trophy = '';
      if (rankNum === 1) trophy = '🏆';
      else if (rankNum === 2) trophy = '🥈';
      else if (rankNum === 3) trophy = '🥉';

      const isSelf = currentUser && currentUser.id === t.id;
      const highlightStyle = isSelf ? 'border-left: 4px solid var(--success); background-color: rgba(34, 197, 94, 0.05);' : '';

      return `
        <div class="card" style="padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; ${highlightStyle}">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="font-size: 18px; font-weight: 800; min-width: 70px; display: flex; align-items: center; gap: 4px;">
              #${rankNum} ${trophy}
            </div>
            <div>
              <h4 style="margin: 0; color: var(--primary-dark); font-size: 15px;">
                ${escapeHTML(capitalizeName(t.name))}
                ${isSelf ? '<span class="user-tag" style="background-color: var(--success-accent); color: var(--success); font-size: 10px; padding: 2px 6px;">You</span>' : ''}
              </h4>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--text-muted);">
                ${t.uploads} uploads • ${t.likes} likes
              </p>
            </div>
          </div>
          <div style="text-align: right;">
            <span class="user-tag" style="font-weight: 700; font-size: 13px; background-color: var(--primary-accent); color: var(--primary-dark); padding: 4px 10px;">
              ${t.points} pts
            </span>
          </div>
        </div>
      `;
    }).join('');

    lucide.createIcons();
  } catch (err) {
    console.error('Error loading teacher stats/ranking:', err);
    rankingListContainer.innerHTML = `<div class="empty-state" style="color: var(--danger);">Failed to load stats/ranking: ${escapeHTML(err.message)}</div>`;
  }
}
