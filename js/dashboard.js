/* ============================================================
   DASHBOARD
============================================================ */
function chnReadJson(key, fallback){
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch(e){ return fallback; }
}

function chnFormatDate(iso){
  if(!iso) return '-';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  if(isNaN(d)) return iso;
  return d.toLocaleDateString('fr-FR', {weekday:'short', day:'2-digit', month:'short', year:'numeric'});
}

function renderDashboard(){
  const el = document.getElementById('dashboard-content');
  if(!el) return;

  const patientsList = chnReadJson('chncak_patients', []);
  const rdvList = chnReadJson('chncak_rdv', []);
  const histList = chnReadJson('chncak_historique', []);
  const okList = chnReadJson('chncak_protocols', chnReadJson('chncak_okchimio', []));
  const stock = chnReadJson('chncak_pharmacie_stock', chnReadJson('chncak_stock', {}));
  const teamPhoto = localStorage.getItem('chncak_dashboard_team_photo') || '';

  const today = new Date();
  today.setHours(0,0,0,0);
  const inSevenDays = new Date(today);
  inSevenDays.setDate(today.getDate() + 7);

  const activePatients = patientsList.filter(p => (p.statut || 'actif') === 'actif').length;
  const upcomingRdv = rdvList
    .filter(r => r.dateRdv)
    .map(r => ({...r, _date: new Date(r.dateRdv + 'T00:00:00')}))
    .filter(r => !isNaN(r._date) && r._date >= today)
    .sort((a,b) => a._date - b._date);
  const weekRdv = upcomingRdv.filter(r => r._date <= inSevenDays).length;
  const treatedRdv = rdvList.filter(r => r.status === 'traite' || r.validatedAt).length;
  const stockItems = Array.isArray(stock) ? stock.length : Object.keys(stock || {}).length;

  const nextRows = upcomingRdv.slice(0, 8).map(r => `
    <tr>
      <td>${chnFormatDate(r.dateRdv)}</td>
      <td><strong>${r.prenom || ''} ${r.nom || ''}</strong><div class="dash-muted">${r.dossier || ''}</div></td>
      <td>${r.proto || r.protocole || '-'}</td>
      <td>${r.medecin || '-'}</td>
      <td><span class="dash-status ${r.status === 'reporte' ? 'warn' : r.status === 'traite' ? 'ok' : ''}">${r.status || 'planifie'}</span></td>
    </tr>
  `).join('');

  const protoCounts = {};
  patientsList.forEach(p => {
    const proto = p.proto || p.protocole || p.protoName || 'Non renseigne';
    protoCounts[proto] = (protoCounts[proto] || 0) + 1;
  });
  const protoRows = Object.entries(protoCounts)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => `<div class="dash-line"><span>${name}</span><strong>${count}</strong></div>`)
    .join('') || '<div class="hist-empty">Aucune donnée protocole.</div>';

  el.innerHTML = `
    <div class="dashboard-shell">
      <div class="dashboard-hero">
        <div class="dashboard-hero-copy">
          <div class="dashboard-logo-orbit">
            <img src="${typeof LOGO_B64 !== 'undefined' ? LOGO_B64 : ''}" alt="CHNCAK">
          </div>
          <div>
            <span class="dashboard-kicker">Bienvenue sur ChimioPro</span>
            <h2>Tableau de bord CHNCAK</h2>
            <p>Vue opérationnelle du service Oncologie-Radiothérapie : patients, rendez-vous, protocoles, OK Chimio et pharmacie.</p>
          </div>
        </div>
        <div class="dashboard-team-panel">
          ${teamPhoto ? `<img src="${teamPhoto}" alt="Equipe CHNCAK">` : `<div class="dashboard-team-empty">Photo de l'équipe</div>`}
          <label class="dashboard-photo-btn">
            Changer la photo
            <input type="file" accept="image/*" onchange="handleDashboardTeamPhoto(this)">
          </label>
        </div>
      </div>

      <div class="dash-grid">
        <div class="dash-card"><div class="dash-value">${patientsList.length}</div><div class="dash-label">Patients</div></div>
        <div class="dash-card"><div class="dash-value">${activePatients}</div><div class="dash-label">En cours</div></div>
        <div class="dash-card"><div class="dash-value">${weekRdv}</div><div class="dash-label">RDV 7 jours</div></div>
        <div class="dash-card"><div class="dash-value">${treatedRdv}</div><div class="dash-label">RDV traités</div></div>
        <div class="dash-card"><div class="dash-value">${histList.length}</div><div class="dash-label">Protocoles générés</div></div>
        <div class="dash-card"><div class="dash-value">${okList.length}</div><div class="dash-label">OK Chimio</div></div>
        <div class="dash-card"><div class="dash-value">${rdvList.length}</div><div class="dash-label">RDV total</div></div>
        <div class="dash-card"><div class="dash-value">${stockItems}</div><div class="dash-label">Stock</div></div>
      </div>

      <div class="dash-two">
        <div class="card">
          <div class="card-header"><div class="card-num">1</div><h2>Prochains rendez-vous</h2></div>
          <div class="card-body dash-table-wrap">
            <table class="dash-table">
              <thead><tr><th>Date</th><th>Patient</th><th>Protocole</th><th>Médecin</th><th>Statut</th></tr></thead>
              <tbody>${nextRows || '<tr><td colspan="5" class="dash-empty">Aucun rendez-vous à venir.</td></tr>'}</tbody>
            </table>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-num">2</div><h2>Protocoles les plus utilisés</h2></div>
          <div class="card-body">${protoRows}</div>
        </div>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  if(document.getElementById('page-dashboard')?.classList.contains('active')) renderDashboard();
});
