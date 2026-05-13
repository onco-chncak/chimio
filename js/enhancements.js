/* ============================================================
   ENRICHISSEMENTS NON DESTRUCTIFS DES ONGLET
============================================================ */
(function(){
  function readJson(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(e){ return fallback; }
  }

  function page(id){ return document.getElementById('page-' + id); }
  function panel(id){
    const host = page(id);
    if(!host) return null;
    let el = host.querySelector('.enhance-panel[data-enhance="'+id+'"]');
    if(!el){
      el = document.createElement('div');
      el.className = 'enhance-panel';
      el.dataset.enhance = id;
      host.appendChild(el);
    }
    return el;
  }

  function fmtDate(iso){
    if(!iso) return '-';
    const d = new Date(iso + (String(iso).length === 10 ? 'T00:00:00' : ''));
    return isNaN(d) ? iso : d.toLocaleDateString('fr-FR', {day:'2-digit', month:'short', year:'numeric'});
  }

  function protoName(idOrName){
    const proto = (window.PROTOCOLS || PROTOCOLS || []).find(p => p.id === idOrName || p.name === idOrName);
    return proto ? proto.name : (idOrName || '-');
  }

  function renderProtocolEnhance(){
    const el = panel('protocole'); if(!el) return;
    const protocols = window.PROTOCOLS || PROTOCOLS || [];
    const rows = protocols.slice(0, 10).map(p => `
      <tr>
        <td><strong>${p.name}</strong><div class="enhance-note">${p.indication || p.detail || ''}</div></td>
        <td>${p.rythme || p.badge || '-'}</td>
        <td>${(p.drugs || []).filter(d => d.name).length}</td>
        <td>${p.pre || '-'}</td>
      </tr>
    `).join('');
    el.innerHTML = `
      <div class="card">
        <div class="card-header"><div class="card-num">+</div><h2>Tableau de référence des protocoles</h2></div>
        <div class="card-body enhance-table-wrap">
          <table class="enhance-table">
            <thead><tr><th>Protocole</th><th>Rythme</th><th>Produits</th><th>Bilan utile</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderMedecinsEnhance(){
    const el = panel('medecins'); if(!el) return;
    const list = readJson('chncak_medecins', []);
    const rows = list.map(m => `
      <tr>
        <td><strong>${m.name || `Dr ${m.prenom || ''} ${m.nom || ''}`}</strong></td>
        <td>${m.grade || m.specialite || '-'}</td>
        <td>${m.contact || '-'}</td>
        <td>${m.email || '-'}</td>
      </tr>
    `).join('');
    el.innerHTML = `
      <div class="card">
        <div class="card-header"><div class="card-num">+</div><h2>Tableau contacts médecins</h2></div>
        <div class="card-body enhance-table-wrap">
          <table class="enhance-table">
            <thead><tr><th>Médecin</th><th>Spécialité</th><th>Téléphone</th><th>Email</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="4">Aucun médecin enregistré.</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderPharmacieEnhance(){
    const el = panel('pharmacie'); if(!el) return;
    const stock = readJson('chncak_pharmacie_stock', readJson('chncak_stock', {}));
    const entries = Array.isArray(stock) ? stock : Object.entries(stock || {}).map(([name, value]) => ({name, ...(typeof value === 'object' ? value : {qty:value})}));
    const rows = entries.slice(0, 12).map(item => {
      const qty = item.qty ?? item.quantite ?? item.stock ?? item.disponible ?? 0;
      const seuil = item.seuil ?? item.min ?? '';
      const statut = Number(qty) <= Number(seuil || -1) ? 'Alerte' : Number(qty) <= 0 ? 'Rupture' : 'OK';
      return `<tr><td><strong>${item.name || item.nom || '-'}</strong></td><td>${qty}</td><td>${seuil || '-'}</td><td><span class="enhance-pill">${statut}</span></td></tr>`;
    }).join('');
    el.innerHTML = `
      <div class="card">
        <div class="card-header"><div class="card-num">+</div><h2>Tableau de surveillance stock</h2></div>
        <div class="card-body enhance-table-wrap">
          <table class="enhance-table">
            <thead><tr><th>Médicament</th><th>Stock</th><th>Seuil</th><th>État</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="4">Aucune donnée de stock disponible.</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderPreparationEnhance(){
    const el = panel('preparation'); if(!el) return;
    el.innerHTML = `
      <div class="card">
        <div class="card-header"><div class="card-num">+</div><h2>Checklist préparation</h2></div>
        <div class="card-body enhance-table-wrap">
          <table class="enhance-table">
            <thead><tr><th>Étape</th><th>Contrôle</th><th>Traçabilité</th></tr></thead>
            <tbody>
              <tr><td>Identitovigilance</td><td>Nom, prénom, dossier, protocole, cure</td><td>Double contrôle avant préparation</td></tr>
              <tr><td>Dose</td><td>Surface corporelle, poids, clairance si besoin</td><td>Comparer à la dose prescrite</td></tr>
              <tr><td>Solvant</td><td>Compatibilité et volume final</td><td>Étiquette poche/seringue</td></tr>
              <tr><td>Libération</td><td>Aspect, volume, heure, préparateur</td><td>Validation pharmacie</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderSupportEnhance(){
    const el = panel('support'); if(!el) return;
    el.innerHTML = `
      <div class="card">
        <div class="card-header"><div class="card-num">+</div><h2>Tableau des demandes utiles</h2></div>
        <div class="card-body enhance-table-wrap">
          <table class="enhance-table">
            <thead><tr><th>Type</th><th>Information à joindre</th><th>Priorité</th></tr></thead>
            <tbody>
              <tr><td>Bug calcul dose</td><td>Protocole, poids, taille, dose affichée</td><td><span class="enhance-pill">Haute</span></td></tr>
              <tr><td>Protocole manquant</td><td>Nom, rythme, médicaments, supports, post-chimio</td><td><span class="enhance-pill">Moyenne</span></td></tr>
              <tr><td>Stock pharmacie</td><td>Médicament, présentation, quantité, seuil</td><td><span class="enhance-pill">Haute</span></td></tr>
              <tr><td>Import Excel</td><td>Fichier source et colonne non reconnue</td><td><span class="enhance-pill">Moyenne</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderPatientsEnhance(){
    const el = panel('patients'); if(!el) return;
    const list = readJson('chncak_patients', []);
    const active = list.filter(p => (p.statut || 'actif') === 'actif').length;
    const pause = list.filter(p => p.statut === 'pause').length;
    const done = list.filter(p => p.statut === 'termine').length;
    const rdv = list.filter(p => p.prochainRdv).length;
    el.innerHTML = `
      <div class="enhance-grid">
        <div class="enhance-kpi"><strong>${list.length}</strong><span>Total patients</span></div>
        <div class="enhance-kpi"><strong>${active}</strong><span>En cours</span></div>
        <div class="enhance-kpi"><strong>${pause}</strong><span>En pause</span></div>
        <div class="enhance-kpi"><strong>${rdv || done}</strong><span>RDV / terminés</span></div>
      </div>
    `;
  }

  function renderArchiveEnhance(){
    const el = panel('archive'); if(!el) return;
    const archive = readJson('chncak_archive', readJson('chncak_patients_archive', []));
    const rows = archive.slice(0, 10).map(p => `
      <tr><td><strong>${p.prenom || ''} ${p.nom || ''}</strong></td><td>${p.dossier || '-'}</td><td>${protoName(p.protoId || p.proto)}</td><td>${fmtDate(p.archivedAt || p.dateFin || p.updatedAt)}</td></tr>
    `).join('');
    el.innerHTML = `
      <div class="card">
        <div class="card-header"><div class="card-num">+</div><h2>Tableau synthèse archive</h2></div>
        <div class="card-body enhance-table-wrap">
          <table class="enhance-table">
            <thead><tr><th>Patient</th><th>Dossier</th><th>Protocole</th><th>Date</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="4">Aucun élément archivé.</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderOkChimioEnhance(){
    const el = panel('okchimio'); if(!el) return;
    const list = readJson('chncak_okchimio', readJson('chimio_okchimio', []));
    const pending = list.filter(x => /attente|pending/i.test(x.statut || x.status || '')).length;
    const validated = list.filter(x => /valid|ok|fait/i.test(x.statut || x.status || '')).length;
    el.innerHTML = `
      <div class="enhance-grid">
        <div class="enhance-kpi"><strong>${list.length}</strong><span>Demandes OK chimio</span></div>
        <div class="enhance-kpi"><strong>${pending}</strong><span>En attente</span></div>
        <div class="enhance-kpi"><strong>${validated}</strong><span>Validées</span></div>
        <div class="enhance-kpi"><strong>${Math.max(list.length - pending - validated, 0)}</strong><span>Autres</span></div>
      </div>
    `;
  }

  const renderers = {
    protocole: renderProtocolEnhance,
    medecins: renderMedecinsEnhance,
    pharmacie: renderPharmacieEnhance,
    preparation: renderPreparationEnhance,
    support: renderSupportEnhance,
    patients: renderPatientsEnhance,
    archive: renderArchiveEnhance,
    okchimio: renderOkChimioEnhance
  };

  function enhance(id){
    const fn = renderers[id];
    if(fn) setTimeout(fn, 80);
  }

  const originalShowPage = window.showPage;
  if(typeof originalShowPage === 'function'){
    window.showPage = function(id, btn){
      const result = originalShowPage.apply(this, arguments);
      enhance(id);
      return result;
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    Object.keys(renderers).forEach(id => {
      if(page(id)?.classList.contains('active')) enhance(id);
    });
  });
})();
