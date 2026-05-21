// ════════════════════════════════════════════════════════════
// SYSTÈME D'AUTHENTIFICATION
// ════════════════════════════════════════════════════════════

let USERS = {
  medecin: {
    password: 'medecin123',
    role: 'medecin',
    name: 'Dr Médecin',
    allowedTabs: ['dashboard', 'protocole', 'okchimio', 'medecins', 'historique', 'apercu', 'preparation', 'support', 'suivi', 'biologie', 'hematologie', 'transfusion', 'stats', 'programme', 'patients', 'rdv']
  },
  TEST: {
    password: 'test123',
    role: 'medecin',
    name: 'Dr TEST',
    allowedTabs: ['dashboard', 'protocole', 'okchimio', 'medecins', 'historique', 'apercu', 'preparation', 'support', 'suivi', 'biologie', 'hematologie', 'transfusion', 'stats', 'programme', 'patients', 'rdv']
  },
  maymouna: {
    password: 'm123@',
    role: 'medecin',
    name: 'Dr Maymouna',
    allowedTabs: ['dashboard', 'protocole', 'okchimio', 'medecins', 'historique', 'apercu', 'preparation', 'support', 'suivi', 'biologie', 'hematologie', 'transfusion', 'stats', 'programme', 'patients', 'rdv']
  },
  pharmacien: {
    password: 'pharma123',
    role: 'pharmacien',
    name: 'Pharmacien',
    allowedTabs: ['dashboard', 'pharmacie', 'stats', 'preparation', 'rdv']
  },
  infirmier: {
    password: 'inf123',
    role: 'infirmier',
    name: 'Infirmier',
    allowedTabs: ['dashboard', 'transfusion', 'rdv', 'apercu', 'support', 'suivi', 'stats', 'programme', 'patients']
  },
  biologiste: {
    password: 'bio123',
    role: 'biologiste',
    name: 'Biologiste',
    allowedTabs: ['dashboard', 'transfusion', 'stats', 'programme']
  },
  admin: {
    password: 'admin123',
    role: 'admin',
    name: 'Administrateur',
    allowedTabs: ['dashboard', 'protocole', 'okchimio', 'medecins', 'stats', 'pharmacie', 'apercu', 'preparation', 'support', 'suivi', 'biologie', 'hematologie', 'transfusion', 'maintenance', 'stats', 'programme', 'patients', 'rdv']
  }
};

let currentUser = null;

function allowedTabsForRole(role) {
  if (role === 'admin') return USERS.admin.allowedTabs;
  if (role === 'pharmacien') return USERS.pharmacien.allowedTabs;
  if (role === 'infirmier') return USERS.infirmier.allowedTabs;
  if (role === 'biologiste') return USERS.biologiste.allowedTabs;
  return USERS.medecin.allowedTabs;
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

function checkAuth() {
  refreshDynamicUsers();
  const savedUser = localStorage.getItem('chncak_currentUser');
  
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
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

function handleLogin(event) {
  refreshDynamicUsers();
  event.preventDefault();
  
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  
  const user = USERS[username];
  
  if (!user || user.password !== password) {
    const errorDiv = document.getElementById('login-error');
    errorDiv.textContent = '❌ Nom d\'utilisateur ou mot de passe incorrect';
    errorDiv.style.display = 'block';
    document.getElementById('login-password').value = '';
    return false;
  }
  
  // Connexion réussie
  currentUser = {
    username: username,
    name: user.name,
    role: user.role,
    allowedTabs: user.allowedTabs
  };
  
  console.log('Connexion réussie:', currentUser);
  
  localStorage.setItem('chncak_currentUser', JSON.stringify(currentUser));
  
  // Cacher écran login
  document.getElementById('login-screen').style.display = 'none';
  
  // Afficher bouton déconnexion
  logoutBtn = document.getElementById('logout-button');
  if (logoutBtn) {
    logoutBtn.style.display = 'block';
    console.log('✓ Bouton déconnexion affiché');
    createLogoutButton();
  } else {
    console.error('✗ Bouton logout-button non trouvé !');
  }
  
  // Appliquer les permissions
  console.log('Appel applyUserPermissions...');
  applyUserPermissions();
  
  // Mode lecture seule si pharmacien
  applyReadOnlyMode();
  
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


function logout() {
  if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
    localStorage.removeItem('chncak_currentUser');
    currentUser = null;
    location.reload();
  }
}

// Vérifier l'authentification au chargement
window.addEventListener('DOMContentLoaded', checkAuth);
