// ════════════════════════════════════════════════════════════
// SYSTÈME D'AUTHENTIFICATION
// ════════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://frfungcoqagpcyaaglox.supabase.co';
const SUPABASE_KEY = 'sb_publishable_LWC2vokbGnSWFA1Vg6DAsA_JFaCNbei';
const CLOUD_ADMIN_EMAILS = ['onco.chn.cak@gmail.com'];
const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const SESSION_ACTIVITY_KEY = 'chncak_session_last_activity';

const ROLE_TABS = {
  medecin: ['dashboard', 'protocole', 'okchimio', 'medecins', 'historique', 'apercu', 'preparation', 'support', 'suivi', 'biologie', 'hematologie', 'transfusion', 'stats', 'programme', 'patients', 'rdv'],
  pharmacien: ['dashboard', 'pharmacie', 'stats', 'preparation', 'rdv'],
  infirmier: ['dashboard', 'transfusion', 'rdv', 'apercu', 'support', 'suivi', 'stats', 'programme', 'patients'],
  biologiste: ['dashboard', 'transfusion', 'stats', 'programme'],
  secretaire: ['dashboard', 'rdvconsultation', 'programme'],
  admin: ['dashboard', 'protocole', 'okchimio', 'medecins', 'stats', 'pharmacie', 'apercu', 'preparation', 'support', 'suivi', 'biologie', 'hematologie', 'transfusion', 'maintenance', 'stats', 'programme', 'rdvconsultation', 'patients', 'rdv']
};

let USERS = {};

let currentUser = null;
let lastActivityWrite = 0;

function allowedTabsForRole(role) {
  return ROLE_TABS[role] || ROLE_TABS.medecin;
}

function refreshDynamicUsers() {
  let approved = [];
  try { approved = JSON.parse(localStorage.getItem('chncak_approved_users') || '[]'); } catch(e) { approved = []; }
  let cleaned = false;
  approved = approved.map(u => {
    if (u && typeof u === 'object' && Object.prototype.hasOwnProperty.call(u, 'password')) {
      const { password, ...safeUser } = u;
      cleaned = true;
      return safeUser;
    }
    return u;
  });
  if (cleaned) localStorage.setItem('chncak_approved_users', JSON.stringify(approved));
  try {
    const registrations = JSON.parse(localStorage.getItem('chncak_user_registrations') || '[]');
    let regCleaned = false;
    const safeRegistrations = registrations.map(u => {
      if (u && typeof u === 'object' && Object.prototype.hasOwnProperty.call(u, 'password')) {
        const { password, ...safeUser } = u;
        regCleaned = true;
        return safeUser;
      }
      return u;
    });
    if (regCleaned) localStorage.setItem('chncak_user_registrations', JSON.stringify(safeRegistrations));
  } catch(e) {}
  USERS = {};
  approved.forEach(u => {
    if (!u || !u.username) return;
    USERS[u.username] = {
      role: u.role || 'medecin',
      name: (String(u.prenom || '') + ' ' + String(u.nom || '')).trim() || u.username,
      allowedTabs: allowedTabsForRole(u.role || 'medecin'),
      contact: u.contact || '',
      email: u.email || '',
      specialite: u.specialite || ''
    };
  });
}

window.refreshDynamicUsers = refreshDynamicUsers;

function supabaseAuthClient() {
  if (!window.supabase?.createClient) return null;
  if (!window.chimioproSupabaseClient) {
    window.chimioproSupabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'chimiopro-supabase-auth' }
    });
  }
  return window.chimioproSupabaseClient;
}

function approvedUserFor(identifier, email) {
  let approved = [];
  try { approved = JSON.parse(localStorage.getItem('chncak_approved_users') || '[]'); } catch(e) { approved = []; }
  const ni = String(identifier || '').toLowerCase().trim();
  const ne = String(email || '').toLowerCase().trim();
  return approved.find(u =>
    String(u.username || '').toLowerCase().trim() === ni ||
    String(u.email || '').toLowerCase().trim() === ne
  ) || null;
}

function profileFromSupabaseUser(user, identifier) {
  const email = String(user?.email || identifier || '').toLowerCase().trim();
  const metadata = user?.user_metadata || {};
  const appMetadata = user?.app_metadata || {};
  const approved = approvedUserFor(identifier, email);
  const role = appMetadata.role || metadata.role || approved?.role || (CLOUD_ADMIN_EMAILS.includes(email) ? 'admin' : 'medecin');
  const name = approved
    ? `${approved.prenom || ''} ${approved.nom || ''}`.trim()
    : (metadata.full_name || metadata.name || email || identifier || 'Utilisateur Supabase');
  return {
    username: email || identifier,
    email,
    name,
    role,
    authProvider: 'supabase',
    allowedTabs: allowedTabsForRole(role)
  };
}

async function loginWithSupabase(identifier, password) {
  const sb = supabaseAuthClient();
  if (!sb) throw new Error('Supabase non charge. Verifiez la connexion internet.');
  const approved = approvedUserFor(identifier, identifier);
  const email = String(String(identifier || '').includes('@') ? identifier : (approved?.email || identifier) || '').trim();
  if (!email.includes('@')) throw new Error('Utilisez votre email Supabase pour la connexion securisee.');
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return profileFromSupabaseUser(data.session?.user || data.user, email);
}

async function activeSupabaseSession() {
  const sb = supabaseAuthClient();
  if (!sb) return null;
  const { data } = await sb.auth.getSession().catch(() => ({ data: null }));
  if (data?.session?.user) return data.session;
  const refreshed = await sb.auth.refreshSession().catch(() => null);
  return refreshed?.data?.session?.user ? refreshed.data.session : null;
}

function markSessionActivity() {
  if (Date.now() - lastActivityWrite < 30 * 1000) return;
  lastActivityWrite = Date.now();
  localStorage.setItem(SESSION_ACTIVITY_KEY, String(Date.now()));
}

function sessionExpired() {
  const last = Number(localStorage.getItem(SESSION_ACTIVITY_KEY) || '0');
  return !!last && (Date.now() - last > SESSION_TIMEOUT_MS);
}

async function forceLogout(message) {
  try { await supabaseAuthClient()?.auth.signOut(); } catch(e) {}
  localStorage.removeItem('chncak_currentUser');
  localStorage.removeItem(SESSION_ACTIVITY_KEY);
  currentUser = null;
  const login = document.getElementById('login-screen');
  if (login) login.style.display = 'flex';
  const errorDiv = document.getElementById('login-error');
  if (message && errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

function installSessionActivityTracking() {
  ['click', 'keydown', 'mousemove', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, markSessionActivity, { passive: true });
  });
  setInterval(() => {
    if (currentUser && sessionExpired()) {
      forceLogout('Session expiree apres inactivite. Reconnectez-vous avec votre compte Supabase.');
    }
  }, 60 * 1000);
}

function showLoginError(message) {
  const errorDiv = document.getElementById('login-error');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

function toastAuth(message, type = 'info') {
  if (typeof window.showToastSafe === 'function') window.showToastSafe(message, type);
  else if (typeof window.notify === 'function') window.notify(message, type);
}

async function checkAuth() {
  refreshDynamicUsers();
  const savedUser = localStorage.getItem('chncak_currentUser');
  
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    if (sessionExpired()) {
      forceLogout('Session expiree apres inactivite. Reconnectez-vous avec votre compte Supabase.');
      return;
    }
    if (currentUser.authProvider !== 'supabase') {
      localStorage.removeItem('chncak_currentUser');
      currentUser = null;
      const login = document.getElementById('login-screen');
      if (login) login.style.display = 'flex';
      showLoginError('Session locale refusee. Chaque utilisateur doit se connecter avec son compte Supabase.');
      return;
    }
    const cloudSession = await activeSupabaseSession();
    if (!cloudSession) {
      await forceLogout('Session Supabase absente ou expiree. Reconnectez-vous pour garantir la synchronisation cloud.');
      return;
    }
    currentUser = {
      ...currentUser,
      ...profileFromSupabaseUser(cloudSession.user, currentUser.email || currentUser.username),
      authProvider: 'supabase'
    };
    if (USERS[currentUser.username]) {
      currentUser.allowedTabs = USERS[currentUser.username].allowedTabs;
      currentUser.role = USERS[currentUser.username].role;
      currentUser.name = USERS[currentUser.username].name;
      localStorage.setItem('chncak_currentUser', JSON.stringify(currentUser));
    }
    markSessionActivity();
    
    // Cacher login
    document.getElementById('login-screen').style.display = 'none';
    
    // Afficher bouton déconnexion
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
      logoutBtn.style.display = 'block';
      createLogoutButton();
    }
    
    // Appliquer permissions
    applyUserPermissions();
    applyReadOnlyMode();
    setTimeout(() => {
      Promise.resolve(window.chimioproCloudRefreshSession?.())
        .catch(err => console.warn('Synchronisation session restauree impossible', err));
    }, 500);
  } else {
    document.getElementById('login-screen').style.display = 'flex';
  }
}

async function handleLogin(event) {
  refreshDynamicUsers();
  event.preventDefault();

  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  let user = null;
  let cloudError = null;
  try {
    user = await loginWithSupabase(username, password);
    window.chimioproCloudReady = true;
  } catch (err) {
    cloudError = err;
  }

  const localApproved = approvedUserFor(username, username);

  if (!user) {
    showLoginError(localApproved?.email
      ? 'Connexion Supabase requise avec : ' + localApproved.email + '. Detail: ' + (cloudError?.message || 'session cloud absente')
      : 'Connexion impossible : ' + (cloudError?.message || 'identifiant ou mot de passe incorrect'));
    document.getElementById('login-password').value = '';
    return false;
  }

  currentUser = {
    username: user.username || username,
    email: user.email || '',
    name: user.name,
    role: user.role,
    allowedTabs: user.allowedTabs,
    authProvider: user.authProvider || 'supabase'
  };

  localStorage.setItem('chncak_currentUser', JSON.stringify(currentUser));
  markSessionActivity();
  document.getElementById('login-screen').style.display = 'none';

  const logoutBtn = document.getElementById('logout-button');
  if (logoutBtn) {
    logoutBtn.style.display = 'block';
    createLogoutButton();
  }

  applyUserPermissions();
  applyReadOnlyMode();

  setTimeout(() => {
    Promise.resolve(window.chimioproCloudRefreshSession?.())
      .catch(err => console.warn('Synchronisation initiale impossible', err));
  }, 300);

  return false;
}

function applyUserPermissions() {
  if (!currentUser) {
    return;
  }
  
  // Masquer/afficher les onglets selon les permissions
  const allTabs = document.querySelectorAll('.tab-btn');
  
  allTabs.forEach(tab => {
    const onclick = tab.getAttribute('onclick');
    if (!onclick) return;
    
    // Extraire l'ID de l'onglet
    const match = onclick.match(/showPage\('([^']+)'/);
    if (!match) return;
    
    const tabId = match[1];
    
    if (currentUser.allowedTabs.includes(tabId)) {
      tab.style.display = '';
    } else {
      tab.style.display = 'none';
    }
  });
  
  // Message de bienvenue
  if (currentUser.role === 'pharmacien') {
    setTimeout(() => {
      toastAuth('Bienvenue ' + currentUser.name + ' - acces pharmacien active.', 'success');
    }, 500);
  }
}


// Appliquer mode lecture seule pour pharmacien
function isAllowedReadonlyAction(btn) {
  const text = (btn.textContent || '').toLowerCase();
  const onclick = (btn.getAttribute('onclick') || '').toLowerCase();
  return onclick.includes('print') ||
         onclick.includes('imprimer') ||
         onclick.includes('marktransfused') ||
         onclick.includes('validatestockfromrdv') ||
         text.includes('imprimer') ||
         text.includes('apercu') ||
         text.includes('aperçu') ||
         text.includes('bon de sang') ||
         text.includes('transfuse') ||
         text.includes('traiter');
}

function lockElementForReadonly(el) {
  el.disabled = true;
  el.style.opacity = '0.55';
  el.style.cursor = 'not-allowed';
  el.title = 'Acces en lecture seule';
}

function applyReadOnlyMode() {
  if (!currentUser || !['pharmacien', 'infirmier'].includes(currentUser.role)) return;

  if (currentUser.role === 'infirmier') {
    document.body.classList.add('infirmier-session');
    document.querySelectorAll('.page').forEach(page => {
      if (!page) return;
      page.querySelectorAll('button').forEach(btn => {
        const onclick = btn.getAttribute('onclick') || '';
        if (onclick.includes('showPage')) return;
        if (!isAllowedReadonlyAction(btn)) lockElementForReadonly(btn);
      });
      page.querySelectorAll('label').forEach(label => {
        const text = (label.textContent || '').toLowerCase();
        if (text.includes('importer') || text.includes('restaurer') || text.includes('export')) {
          label.style.display = 'none';
        }
      });
      page.querySelectorAll('input, select, textarea').forEach(input => {
        const type = (input.getAttribute('type') || '').toLowerCase();
        const haystack = `${input.id || ''} ${input.placeholder || ''} ${input.className || ''}`.toLowerCase();
        if (type === 'search' || /search|recherch|filter|filtre/.test(haystack)) return;
        lockElementForReadonly(input);
      });
    });
    return;
  }
  
  // Désactiver tous les boutons dans Stats et Programme SAUF impression
  const statsPage = document.getElementById('page-stats');
  const programmePage = document.getElementById('page-programme');
  
  [statsPage, programmePage, document.getElementById('page-preparation')].forEach(page => {
    if (!page) return;
    
    // Désactiver tous les boutons sauf navigation ET impression
    const buttons = page.querySelectorAll('button');
    buttons.forEach(btn => {
      const onclick = btn.getAttribute('onclick');
      if (!onclick) return;
      
      // Garder actifs : boutons de navigation et boutons d'impression
      const isNavigation = onclick.includes('showPage');
      const isPrint = onclick.includes('print') || onclick.includes('Print') || 
                      onclick.includes('imprimer') || onclick.includes('Imprimer');
      
      if (!isNavigation && !isPrint) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        btn.title = 'Accès en lecture seule';
      }
    });
    
    // Désactiver tous les inputs sauf ceux liés à l'impression
    const inputs = page.querySelectorAll('input:not([type="date"]), select:not(.print-select), textarea');
    inputs.forEach(input => {
      // Ne pas désactiver les inputs dans les zones d'impression
      const inPrintZone = input.closest('.print-controls') || 
                          input.closest('[class*="print"]') ||
                          input.id?.includes('print');
      
      if (!inPrintZone) {
        input.disabled = true;
        input.style.opacity = '0.7';
      }
    });
  });
}


async function logout() {
  if (confirm('Voulez-vous vraiment vous deconnecter ?')) {
    try { await supabaseAuthClient()?.auth.signOut(); } catch(e) {}
    localStorage.removeItem('chncak_currentUser');
    localStorage.removeItem(SESSION_ACTIVITY_KEY);
    currentUser = null;
    location.reload();
  }
}

// Vérifier l'authentification au chargement
window.addEventListener('DOMContentLoaded', () => {
  installSessionActivityTracking();
  checkAuth();
});
