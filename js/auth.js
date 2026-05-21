// ════════════════════════════════════════════════════════════
// SYSTÈME D'AUTHENTIFICATION
// ════════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://frfungcoqagpcyaaglox.supabase.co';
const SUPABASE_KEY = 'sb_publishable_LWC2vokbGnSWFA1Vg6DAsA_JFaCNbei';
const CLOUD_ADMIN_EMAILS = ['onco.chn.cak@gmail.com'];

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

function allowedTabsForRole(role) {
  return ROLE_TABS[role] || ROLE_TABS.medecin;
}

function refreshDynamicUsers() {
  let approved = [];
  try { approved = JSON.parse(localStorage.getItem('chncak_approved_users') || '[]'); } catch(e) { approved = []; }
  approved.forEach(u => {
    if (!u || !u.username || !u.password) return;
    USERS[u.username] = {
      password: u.password,
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
      auth: { persistSession: true, autoRefreshToken: true }
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
  const email = String(identifier || '').trim();
  if (!email.includes('@')) throw new Error('Utilisez votre email Supabase pour la connexion securisee.');
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return profileFromSupabaseUser(data.session?.user || data.user, email);
}


function checkAuth() {
  refreshDynamicUsers();
  const savedUser = localStorage.getItem('chncak_currentUser');
  
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    if (currentUser.authProvider !== 'supabase' && !USERS[currentUser.username]?.password) {
      localStorage.removeItem('chncak_currentUser');
      currentUser = null;
      document.getElementById('login-screen').style.display = 'flex';
      return;
    }
    if (USERS[currentUser.username]) {
      currentUser.allowedTabs = USERS[currentUser.username].allowedTabs;
      currentUser.role = USERS[currentUser.username].role;
      currentUser.name = USERS[currentUser.username].name;
      localStorage.setItem('chncak_currentUser', JSON.stringify(currentUser));
    }
    console.log('Session restaurée:', currentUser);
    
    // Cacher login
    document.getElementById('login-screen').style.display = 'none';
    
    // Afficher bouton déconnexion
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
      logoutBtn.style.display = 'block';
      console.log('✓ Bouton déconnexion affiché (session)');
      createLogoutButton();
    }
    
    // Appliquer permissions
    console.log('Appel applyUserPermissions (session)...');
    applyUserPermissions();
    applyReadOnlyMode();
  } else {
    document.getElementById('login-screen').style.display = 'flex';
    console.log('Aucune session - affichage login');
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

  if (!user && USERS[username]?.password && USERS[username].password === password) {
    user = {
      username,
      name: USERS[username].name,
      role: USERS[username].role,
      allowedTabs: USERS[username].allowedTabs,
      authProvider: 'local'
    };
  }

  if (!user) {
    const errorDiv = document.getElementById('login-error');
    errorDiv.textContent = 'Connexion impossible : ' + (cloudError?.message || 'identifiant ou mot de passe incorrect');
    errorDiv.style.display = 'block';
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

  console.log('Connexion reussie:', currentUser);
  localStorage.setItem('chncak_currentUser', JSON.stringify(currentUser));
  document.getElementById('login-screen').style.display = 'none';

  logoutBtn = document.getElementById('logout-button');
  if (logoutBtn) {
    logoutBtn.style.display = 'block';
    createLogoutButton();
  }

  applyUserPermissions();
  applyReadOnlyMode();

  if (currentUser.authProvider === 'supabase') {
    setTimeout(() => {
      if (typeof window.chimioproCloudSync === 'function') {
        window.chimioproCloudSync().catch(err => console.warn('Synchronisation initiale impossible', err));
      }
    }, 300);
  }

  return false;
}

function applyUserPermissions() {
  console.log('=== applyUserPermissions appelé ===');
  console.log('currentUser:', currentUser);
  
  if (!currentUser) {
    console.log('currentUser est null - abandon');
    return;
  }
  
  console.log('allowedTabs:', currentUser.allowedTabs);
  
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
      console.log('Onglet masqué:', tabId);
    }
  });
  
  // Message de bienvenue
  if (currentUser.role === 'pharmacien') {
    setTimeout(() => {
      alert('👋 Bienvenue ' + currentUser.name + '\n\nVous avez accès uniquement à l\'onglet Pharmacie Centrale.');
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
    currentUser = null;
    location.reload();
  }
}

// Vérifier l'authentification au chargement
window.addEventListener('DOMContentLoaded', checkAuth);
