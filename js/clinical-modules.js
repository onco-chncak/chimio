/* ============================================================
   SUIVI, BIOLOGIE, DASHBOARD ET STATISTIQUES
   Modules adaptes depuis l'ancien ChimioPro pour les donnees CHNCAK.
============================================================ */
(function(){
  const STORAGE = {
    patients: 'chncak_patients',
    rdv: 'chncak_rdv',
    historique: 'chncak_historique',
    okchimio: 'chncak_protocols',
    suivi: 'chncak_suivi',
    biologie: 'chncak_biologie',
    catalog: 'chncak_catalog',
    responsables: 'chncak_responsables'
  };

  function readJson(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(e){ return fallback; }
  }

  function writeJson(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }

  function readMerged(primary, legacy, fallback){
    const main = readJson(primary, null);
    if(Array.isArray(main)) return main;
    const old = readJson(legacy, null);
    return Array.isArray(old) ? old : fallback;
  }

  function esc(value){
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[ch]));
  }

  function val(...values){
    const found = values.find(v => v !== undefined && v !== null && String(v).trim() !== '');
    return found === undefined ? '' : found;
  }

  function display(...values){
    const v = val(...values);
    return v === '' ? '--' : esc(v);
  }

  function normalizeStatus(value){
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function patientCode(patient, index){
    return String(val(patient.id, patient.codeGratuite, patient.codegratuite, patient.codeGratuiteAuto, patient.code, patient.codeBarre, patient.dossier, index));
  }

  function patientName(patient){
    return `${val(patient.prenom)} ${val(patient.nom)}`.trim() || val(patient.name, patient.patientName, patient.patient, 'Patient');
  }

  function patientPhone(patient){
    return val(patient.tel, patient.telephone, patient.contact, patient.phone, patient.email);
  }

  function patientProtocol(patient){
    return val(patient.proto, patient.protocole, patient.protocol, patient.protoName, patient.protocoleNom);
  }

  function patientDoctor(patient){
    return val(patient.medecin, patient.medecinTraitant, patient.doctor, patient.prescripteur, patient['Médecin traitant']);
  }

  function getPatients(){
    return readJson(STORAGE.patients, []);
  }

  function getRdv(){
    return readJson(STORAGE.rdv, readJson('rdv', []));
  }

  function getHistorique(){
    return readJson(STORAGE.historique, readJson('historique', []));
  }

  function getOkChimioList(){
    return readJson(STORAGE.okchimio, readJson('chncak_okchimio', []));
  }

  function getSuivi(){
    return readMerged(STORAGE.suivi, 'suivi', []);
  }

  function saveSuivi(list){
    writeJson(STORAGE.suivi, list);
    writeJson('suivi', list);
  }

  function getBiologie(){
    return readMerged(STORAGE.biologie, 'biologie', []);
  }

  function saveBiologieList(list){
    writeJson(STORAGE.biologie, list);
    writeJson('biologie', list);
  }

  function getCatalog(){
    const catalog = readJson(STORAGE.catalog, null);
    if(Array.isArray(catalog)) return catalog;
    return readJson('chncak_stock', readJson('chncak_pharmacie_stock', []));
  }

  function parseDate(value){
    if(!value) return null;
    if(value instanceof Date) return value;
    const raw = String(value);
    if(raw.includes('/')){
      const parts = raw.split('/').map(Number);
      if(parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    const date = new Date(raw.length === 10 ? raw + 'T00:00:00' : raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function dateValue(item){
    return parseDate(val(item.dateTs, item.updatedAt, item.createdAt, item.dateRdv, item.dateProto, item.date, item.dateDebut, item.dateProtocole));
  }

  function formatDate(value){
    const date = parseDate(value);
    return date ? date.toLocaleDateString('fr-FR') : display(value);
  }

  function currentRange(period){
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    let end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    let label = `Année ${now.getFullYear()}`;

    if(period === 'journalier'){
      start.setMonth(now.getMonth(), now.getDate());
      start.setHours(0,0,0,0);
      end = new Date(start);
      end.setHours(23,59,59,999);
      label = now.toLocaleDateString('fr-FR', {weekday:'long', day:'2-digit', month:'long', year:'numeric'});
    } else if(period === 'mensuel'){
      start.setMonth(now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      label = now.toLocaleDateString('fr-FR', {month:'long', year:'numeric'});
    } else if(period === 'trimestriel'){
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      start.setMonth(quarterStart, 1);
      end = new Date(now.getFullYear(), quarterStart + 3, 0, 23, 59, 59);
      label = `Trimestre ${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;
    } else if(period === 'tout'){
      start.setFullYear(2000, 0, 1);
      label = 'Toutes périodes';
    }

    return {start, end, label};
  }

  function inRange(item, range){
    const date = dateValue(item);
    if(!date) return true;
    return date >= range.start && date <= range.end;
  }

  function countBy(items, selector){
    return items.reduce((acc, item) => {
      const key = val(typeof selector === 'function' ? selector(item) : item[selector], 'Non renseigné');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  function renderMiniRows(data, empty){
    const rows = Object.entries(data)
      .sort((a,b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label, count]) => `<div class="dash-line"><span>${esc(label)}</span><strong>${count}</strong></div>`)
      .join('');
    return rows || `<div class="hist-empty">${empty}</div>`;
  }

  function renderDashboard(){
    const el = document.getElementById('dashboard-content');
    if(!el) return;

    const patients = getPatients();
    const rdv = getRdv();
    const historique = getHistorique();
    const ok = getOkChimioList();
    const suivi = getSuivi();
    const biologie = getBiologie();
    const catalog = getCatalog();
    const responsables = readJson(STORAGE.responsables, {});

    const today = new Date();
    today.setHours(0,0,0,0);
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);

    const upcoming = rdv
      .map(r => ({...r, _date: parseDate(val(r.dateRdv, r.date))}))
      .filter(r => r._date && r._date >= today)
      .sort((a,b) => a._date - b._date);

    const todayRows = upcoming.filter(r => r._date <= weekEnd).slice(0, 8).map(r => `
      <tr>
        <td>${formatDate(val(r.dateRdv, r.date))}<div class="dash-muted">${display(r.time, r.heure)}</div></td>
        <td><strong>${display(`${val(r.prenom)} ${val(r.nom)}`.trim() || r.patient)}</strong><div class="dash-muted">${display(r.dossier)}</div></td>
        <td>${display(r.proto, r.protocole)}</td>
        <td>${display(r.medecin)}</td>
        <td><span class="dash-status ${normalizeStatus(r.status || r.statut).includes('trait') ? 'ok' : normalizeStatus(r.status || r.statut).includes('report') ? 'warn' : ''}">${display(r.status, r.statut, 'planifié')}</span></td>
      </tr>
    `).join('');

    const active = patients.filter(p => !['termine','traite','decede','archive'].includes(normalizeStatus(p.statut))).length;
    const lowStock = catalog.filter(item => Number(val(item.qteStock, item.stock, item.quantite, item.qty, 0)) <= 5).length;
    const bioAlerts = biologie.filter(b => getBioOverall(b).level !== 'ok').length;
    const treated = rdv.filter(r => normalizeStatus(r.status || r.statut).includes('trait')).length;

    el.innerHTML = `
      <div class="dashboard-shell clinical-dashboard">
        <div class="dashboard-service-head">
          <div class="dashboard-service-left">
            <img src="${document.querySelector('.nav-logo img')?.src || ''}" alt="CHNCAK">
            <div>
              <h2>Service d'Oncologie-Radiothérapie - CHNCAK Touba</h2>
              <p>${new Date().toLocaleDateString('fr-FR', {weekday:'long', day:'2-digit', month:'long', year:'numeric'})}</p>
            </div>
          </div>
          <div class="dashboard-clock" id="clinical-clock">${new Date().toLocaleTimeString('fr-FR')}</div>
        </div>

        <div class="dashboard-welcome">
          <div>
            <strong>Bienvenue sur ChimioPro</strong>
            <span>Gestion intégrée des prescriptions, patients, rendez-vous, biologie et pharmacie.</span>
          </div>
          <button class="btn-secondary" onclick="renderDashboard()">Actualiser</button>
        </div>

        <div class="dash-grid">
          <div class="dash-card"><div class="dash-value">${patients.length}</div><div class="dash-label">Patients</div></div>
          <div class="dash-card"><div class="dash-value">${active}</div><div class="dash-label">En cours</div></div>
          <div class="dash-card"><div class="dash-value">${upcoming.filter(r => r._date <= weekEnd).length}</div><div class="dash-label">RDV 7 jours</div></div>
          <div class="dash-card"><div class="dash-value">${treated}</div><div class="dash-label">RDV traités</div></div>
          <div class="dash-card"><div class="dash-value">${historique.length}</div><div class="dash-label">Protocoles générés</div></div>
          <div class="dash-card"><div class="dash-value">${ok.length}</div><div class="dash-label">OK Chimio</div></div>
          <div class="dash-card"><div class="dash-value">${suivi.length}</div><div class="dash-label">Suivis</div></div>
          <div class="dash-card"><div class="dash-value">${bioAlerts}</div><div class="dash-label">Alertes bio</div></div>
        </div>

        <div class="dashboard-schedule-card card">
          <div class="card-header" style="justify-content:space-between">
            <div><h2>Programme des rendez-vous</h2><div class="dash-muted">Salle chimio: ${display(responsables.chimio)} · Préparation: ${display(responsables.preparation)}</div></div>
            <button class="btn-secondary" onclick="editDashboardResponsables()">Responsables</button>
          </div>
          <div class="card-body dash-table-wrap">
            <table class="dash-table">
              <thead><tr><th>Date</th><th>Patient</th><th>Protocole</th><th>Médecin</th><th>Statut</th></tr></thead>
              <tbody>${todayRows || '<tr><td colspan="5" class="dash-empty">Aucun rendez-vous programmé dans les 7 prochains jours.</td></tr>'}</tbody>
            </table>
          </div>
        </div>

        <div class="dash-two">
          <div class="card">
            <div class="card-header"><div class="card-num">1</div><h2>Protocoles les plus utilisés</h2></div>
            <div class="card-body">${renderMiniRows(countBy(patients, patientProtocol), 'Aucune donnée protocole.')}</div>
          </div>
          <div class="card">
            <div class="card-header"><div class="card-num">2</div><h2>Surveillance rapide</h2></div>
            <div class="card-body">
              <div class="dash-line"><span>Bilans biologiques</span><strong>${biologie.length}</strong></div>
              <div class="dash-line"><span>Stock bas</span><strong>${lowStock}</strong></div>
              <div class="dash-line"><span>Réponses de suivi</span><strong>${suivi.length}</strong></div>
              <div class="dash-line"><span>Patients archivés/terminés</span><strong>${patients.filter(p => ['termine','traite','archive'].includes(normalizeStatus(p.statut))).length}</strong></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  window.editDashboardResponsables = function(){
    const current = readJson(STORAGE.responsables, {});
    const medecin = prompt('Médecin responsable OK Chimio:', current.medecin || '');
    if(medecin === null) return;
    const chimio = prompt('Responsable salle chimio:', current.chimio || '');
    if(chimio === null) return;
    const preparation = prompt('Responsable salle préparation:', current.preparation || '');
    if(preparation === null) return;
    const infirmiere = prompt('Infirmière responsable:', current.infirmiere || '');
    if(infirmiere === null) return;
    writeJson(STORAGE.responsables, {medecin, chimio, preparation, infirmiere});
    renderDashboard();
  };

  function suiviStatus(patient){
    const total = Number(val(patient.totalCures, patient.totalCycles, patient.curesPrevues, 0));
    const current = Number(val(patient.cure, patient.cycle, patient.numeroCure, patient.numCure, 0));
    const status = normalizeStatus(patient.statut);
    if(['termine','traite','archive'].includes(status) || (total && current >= total)){
      return '<span class="clinical-pill ok">Terminé</span>';
    }
    if(!patientProtocol(patient)){
      return '<span class="clinical-pill warn">Protocole absent</span>';
    }
    return '<span class="clinical-pill info">En cours</span>';
  }

  function renderSuivi(){
    const host = document.getElementById('suivi-content');
    if(!host) return;
    const patients = getPatients();
    const suivi = getSuivi();

    const patientOptions = patients.map((p, i) => {
      const code = patientCode(p, i);
      return `<option value="${esc(code)}">${display(code)} - ${display(patientName(p))}</option>`;
    }).join('');

    const patientRows = patients.map((p, i) => `
      <tr>
        <td>${display(p.prenom)}</td>
        <td>${display(p.nom)}</td>
        <td>${display(p.age)}</td>
        <td>${display(p.sexe)}</td>
        <td>${display(p.antecedents, p.antecedent, p.atcd)}</td>
        <td>${display(p.localisations, p.localisation, p.diagnostic)}</td>
        <td>${display(p.indication)}</td>
        <td>${display(p.codeGratuite, p.codegratuite, p.code)}</td>
        <td>${display(p.codeBarre, p.codeGratuite, p.codegratuite)}</td>
        <td>${display(p.numeroDossier, p.dossier)}</td>
        <td>${display(p.cubix, p.idCubix, p.icCubix)}</td>
        <td>${display(p.nationalite)}</td>
        <td>${display(patientPhone(p))}</td>
        <td>${display(patientProtocol(p))}</td>
        <td>${display(p.ligne, p.ligneTraitement, p.line)}</td>
        <td>${display(p.cure, p.cycle, p.numeroCure, p.numCure)}</td>
        <td>${display(p.totalCures, p.totalCycles)}</td>
        <td>${display(patientDoctor(p))}</td>
        <td>${suiviStatus(p)}</td>
      </tr>
    `).join('');

    const suiviRows = suivi.map(item => `
      <tr>
        <td>${display(item.patientName, item.patientCode)}</td>
        <td>${display(item.cures)}</td>
        <td>${display(item.compliant)}</td>
        <td>${display(item.reponse)}</td>
        <td>${display(item.dateDebut)}</td>
        <td>${display(item.date)}</td>
      </tr>
    `).join('');

    host.innerHTML = `
      <div class="clinical-shell">
        <div class="dashboard-head">
          <div>
            <h2>Suivi thérapeutique</h2>
            <p>Tableau patient complet avec remplissage automatique des informations de suivi.</p>
          </div>
          <button class="btn-secondary" onclick="clearClinicalModuleData('suivi')">Effacer historique</button>
        </div>

        <div class="clinical-table-wrap">
          <table class="clinical-table suivi-table">
            <thead>
              <tr><th>Prénom</th><th>Nom</th><th>Age</th><th>Sexe</th><th>Antécédents</th><th>Localisation</th><th>Indication</th><th>Code</th><th>Code barre</th><th>N° dossier</th><th>ID Cubix</th><th>Nationalité</th><th>Contact</th><th>Protocole</th><th>Ligne</th><th>Cure</th><th>Total</th><th>Médecin</th><th>Statut</th></tr>
            </thead>
            <tbody>${patientRows || '<tr><td colspan="19" class="dash-empty">Aucun patient enregistré.</td></tr>'}</tbody>
          </table>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-num">+</div><h2>Réponse de suivi</h2></div>
          <div class="card-body">
            <div class="clinical-form-grid">
              <div class="field"><label>Choisir le patient</label><select id="suivi-patient" onchange="autoFillSuiviFields()"><option value="">Sélectionner un patient</option>${patientOptions}</select></div>
              <div class="field"><label>Date début traitement</label><input type="text" id="suivi-date-debut" readonly></div>
              <div class="field"><label>Antécédents</label><input type="text" id="suivi-antecedents" readonly></div>
              <div class="field"><label>Localisation</label><input type="text" id="suivi-localisations" readonly></div>
              <div class="field"><label>Indication</label><input type="text" id="suivi-indication" readonly></div>
              <div class="field"><label>ID Cubix</label><input type="text" id="suivi-cubix" readonly></div>
              <div class="field"><label>Nationalité</label><input type="text" id="suivi-nationalite" readonly></div>
              <div class="field"><label>Contact</label><input type="text" id="suivi-contact" readonly></div>
              <div class="field"><label>Ligne traitement</label><input type="text" id="suivi-ligne" readonly></div>
              <div class="field"><label>Nombre de cures</label><input type="number" id="suivi-cures" min="1"></div>
              <div class="field"><label>Traitement compliant ?</label><select id="suivi-compliant"><option value="">Choisir</option><option value="Oui">Oui</option><option value="Non">Non</option></select></div>
              <div class="field"><label>Réponse tumorale</label><select id="reponse-tumorale"><option value="">Choisir</option><option value="Réponse complète">Réponse complète</option><option value="Réponse partielle">Réponse partielle</option><option value="Stabilité">Stabilité</option><option value="Progression">Progression</option></select></div>
            </div>
            <button class="btn-primary clinical-save" onclick="saveReponseTumorale()">Enregistrer réponse</button>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-num">H</div><h2>Historique des réponses</h2></div>
          <div class="card-body dash-table-wrap">
            <table class="dash-table"><thead><tr><th>Patient</th><th>Cures</th><th>Compliant</th><th>Réponse</th><th>Début</th><th>Date réponse</th></tr></thead><tbody>${suiviRows || '<tr><td colspan="6" class="dash-empty">Aucune réponse enregistrée.</td></tr>'}</tbody></table>
          </div>
        </div>
      </div>
    `;
  }

  window.autoFillSuiviFields = function(){
    const code = document.getElementById('suivi-patient')?.value;
    const patients = getPatients();
    const patient = patients.find((p, i) => patientCode(p, i) === code);
    const suivi = getSuivi();
    const existing = suivi.find(s => s.patientCode === code);
    const set = (id, value) => { const el = document.getElementById(id); if(el) el.value = value || ''; };

    if(!patient){
      ['suivi-date-debut','suivi-antecedents','suivi-localisations','suivi-indication','suivi-cubix','suivi-nationalite','suivi-contact','suivi-ligne'].forEach(id => set(id, ''));
      return;
    }

    set('suivi-date-debut', existing?.dateDebut || val(patient.dateDebut, patient.dateProtocole, patient.date, new Date().toLocaleDateString('fr-FR')));
    set('suivi-antecedents', val(patient.antecedents, patient.antecedent, patient.atcd));
    set('suivi-localisations', val(patient.localisations, patient.localisation, patient.diagnostic));
    set('suivi-indication', patient.indication);
    set('suivi-cubix', val(patient.cubix, patient.icCubix, patient.idCubix));
    set('suivi-nationalite', patient.nationalite);
    set('suivi-contact', patientPhone(patient));
    set('suivi-ligne', val(patient.ligne, patient.ligneTraitement, patient.line));
  };

  window.saveReponseTumorale = function(){
    const code = document.getElementById('suivi-patient')?.value;
    const cures = Number(document.getElementById('suivi-cures')?.value);
    const compliant = document.getElementById('suivi-compliant')?.value;
    const reponse = document.getElementById('reponse-tumorale')?.value;
    if(!code) return alert('Sélectionner un patient.');
    if(!cures || cures < 1) return alert('Indiquer un nombre de cures valide.');
    if(!compliant) return alert('Indiquer si le traitement est compliant.');
    if(!reponse) return alert('Sélectionner la réponse tumorale.');

    const patient = getPatients().find((p, i) => patientCode(p, i) === code);
    const list = getSuivi();
    const existing = list.find(s => s.patientCode === code);
    list.push({
      patientCode: code,
      patientName: patient ? `${code} - ${patientName(patient)}` : code,
      cures,
      compliant,
      reponse,
      dateDebut: document.getElementById('suivi-date-debut')?.value || existing?.dateDebut || new Date().toLocaleDateString('fr-FR'),
      date: new Date().toLocaleDateString('fr-FR'),
      dateTs: new Date().toISOString()
    });
    saveSuivi(list);
    renderSuivi();
    showToast?.('Réponse de suivi enregistrée.', 'success');
  };

  function getHbMessage(value){
    if(!value) return {text:'', level:'ok'};
    if(value < 8) return {text:'Anémie sévère (<8)', level:'danger'};
    if(value < 10) return {text:'Anémie modérée (8-10)', level:'warning'};
    if(value < 12) return {text:'Anémie légère (10-12)', level:'warning'};
    if(value <= 16) return {text:'Hb normale', level:'ok'};
    return {text:'Hb élevée', level:'warning'};
  }

  function getPnnMessage(value){
    if(!value) return {text:'', level:'ok'};
    if(value < 500) return {text:'Neutropénie sévère (<500)', level:'danger'};
    if(value < 1000) return {text:'Neutropénie modérée', level:'warning'};
    if(value < 1500) return {text:'Neutropénie légère', level:'warning'};
    if(value <= 8000) return {text:'PNN normal', level:'ok'};
    return {text:'PNN élevé', level:'warning'};
  }

  function getPlaquettesMessage(value){
    if(!value) return {text:'', level:'ok'};
    if(value < 50) return {text:'Thrombopénie sévère (<50)', level:'danger'};
    if(value < 100) return {text:'Thrombopénie modérée', level:'warning'};
    if(value < 150) return {text:'Plaquettes basses', level:'warning'};
    if(value <= 400) return {text:'Plaquettes normales', level:'ok'};
    return {text:'Thrombocytose possible', level:'warning'};
  }

  function getCreatinineMessage(value){
    if(!value) return {text:'', level:'ok'};
    if(value >= 14) return {text:'Créatinine critique: avis médical, hydratation, surveillance rénale', level:'danger'};
    if(value > 1.3 && value < 14) return {text:'Créatinine élevée: vérifier unité et fonction rénale', level:'warning'};
    return {text:'Fonction rénale acceptable', level:'ok'};
  }

  function getTransaminaseMessage(value, label){
    if(!value) return {text:'', level:'ok'};
    if(value > 200) return {text:`${label} très élevé`, level:'danger'};
    if(value > 80) return {text:`${label} élevé`, level:'warning'};
    if(value > 40) return {text:`${label} légèrement élevé`, level:'warning'};
    return {text:`${label} normal`, level:'ok'};
  }

  function getBioOverall(item){
    const checks = [
      getHbMessage(Number(item.hb)),
      getPnnMessage(Number(item.pnn)),
      getPlaquettesMessage(Number(item.plaquettes)),
      getCreatinineMessage(Number(item.creat)),
      getTransaminaseMessage(Number(item.asat), 'ASAT'),
      getTransaminaseMessage(Number(item.alat), 'ALAT')
    ];
    return checks.find(c => c.level === 'danger') || checks.find(c => c.level === 'warning') || {text:'Validation biologique', level:'ok'};
  }

  function renderBiologie(){
    const host = document.getElementById('biologie-content');
    if(!host) return;
    const patients = getPatients();
    const biologie = getBiologie();
    const patientOptions = patients.map((p, i) => `<option value="${esc(patientCode(p, i))}">${display(patientCode(p, i))} - ${display(patientName(p))}</option>`).join('');
    const rows = biologie.map(item => {
      const overall = getBioOverall(item);
      return `
        <tr>
          <td>${display(item.patient)}</td><td>${display(item.hb)}</td><td>${display(item.pnn)}</td><td>${display(item.plaquettes)}</td>
          <td>${display(item.creat)}</td><td>${display(item.asat)}</td><td>${display(item.alat)}</td>
          <td><span class="clinical-pill ${overall.level === 'danger' ? 'danger' : overall.level === 'warning' ? 'warn' : 'ok'}">${esc(overall.text)}</span></td>
          <td>${display(item.date)}</td>
        </tr>`;
    }).join('');

    host.innerHTML = `
      <div class="clinical-shell">
        <div class="dashboard-head">
          <div><h2>Biologie</h2><p>Validation biologique avec alertes automatiques avant chimiothérapie.</p></div>
          <button class="btn-secondary" onclick="clearClinicalModuleData('biologie')">Effacer historique</button>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-num">B</div><h2>Nouveau bilan</h2></div>
          <div class="card-body">
            <div class="clinical-form-grid">
              <div class="field"><label>Patient</label><select id="bio-patient-select" onchange="loadBiologiePatient()"><option value="">Sélectionner patient</option>${patientOptions}</select></div>
              <div class="field"><label>Nom patient</label><input type="text" id="bio-patient" readonly></div>
              ${bioInput('hb','Hb', 'g/dL')}
              ${bioInput('pnn','PNN', '/mm³')}
              ${bioInput('plaquettes','Plaquettes', 'G/L')}
              ${bioInput('creat','Créatinine', 'mg/L')}
              ${bioInput('asat','ASAT', 'UI/L')}
              ${bioInput('alat','ALAT', 'UI/L')}
            </div>
            <button class="btn-primary clinical-save" onclick="saveBiologie()">Sauvegarder</button>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-num">R</div><h2>Résultats biologie</h2></div>
          <div class="card-body dash-table-wrap">
            <table class="dash-table"><thead><tr><th>Patient</th><th>Hb</th><th>PNN</th><th>Plaquettes</th><th>Créatinine</th><th>ASAT</th><th>ALAT</th><th>Alerte</th><th>Date</th></tr></thead><tbody>${rows || '<tr><td colspan="9" class="dash-empty">Aucun bilan enregistré.</td></tr>'}</tbody></table>
          </div>
        </div>
      </div>`;
  }

  function bioInput(id, label, unit){
    return `<div class="field clinical-bio-field"><label>${label} (${unit})</label><input type="number" step="0.01" id="${id}" oninput="evaluateBiologieForm()"><span id="${id}-msg" class="bio-msg"></span></div>`;
  }

  window.loadBiologiePatient = function(){
    const code = document.getElementById('bio-patient-select')?.value;
    const patient = getPatients().find((p, i) => patientCode(p, i) === code);
    const input = document.getElementById('bio-patient');
    if(input) input.value = patient ? patientName(patient) : '';
  };

  function setBioMessage(id, result){
    const el = document.getElementById(id);
    if(!el) return;
    el.textContent = result.text || '';
    el.className = `bio-msg ${result.level}`;
  }

  window.evaluateBiologieForm = function(){
    setBioMessage('hb-msg', getHbMessage(Number(document.getElementById('hb')?.value)));
    setBioMessage('pnn-msg', getPnnMessage(Number(document.getElementById('pnn')?.value)));
    setBioMessage('plaquettes-msg', getPlaquettesMessage(Number(document.getElementById('plaquettes')?.value)));
    setBioMessage('creat-msg', getCreatinineMessage(Number(document.getElementById('creat')?.value)));
    setBioMessage('asat-msg', getTransaminaseMessage(Number(document.getElementById('asat')?.value), 'ASAT'));
    setBioMessage('alat-msg', getTransaminaseMessage(Number(document.getElementById('alat')?.value), 'ALAT'));
  };

  window.saveBiologie = function(){
    const code = document.getElementById('bio-patient-select')?.value;
    const patient = getPatients().find((p, i) => patientCode(p, i) === code);
    if(!patient) return alert('Sélectionner un patient.');
    const entry = {
      patient: patientName(patient),
      code,
      hb: document.getElementById('hb')?.value || '',
      pnn: document.getElementById('pnn')?.value || '',
      plaquettes: document.getElementById('plaquettes')?.value || '',
      creat: document.getElementById('creat')?.value || '',
      asat: document.getElementById('asat')?.value || '',
      alat: document.getElementById('alat')?.value || '',
      date: new Date().toLocaleDateString('fr-FR'),
      dateTs: new Date().toISOString()
    };
    const list = getBiologie();
    list.push(entry);
    saveBiologieList(list);
    renderBiologie();
    showToast?.('Bilan biologique enregistré.', 'success');
  };

  function renderStats(){
    const container = document.getElementById('stats-content') || document.getElementById('page-stats');
    if(!container) return;
    const period = document.getElementById('stats-period')?.value || 'mensuel';
    const range = currentRange(period);
    const patients = getPatients();
    const rdv = getRdv().filter(x => inRange(x, range));
    const hist = getHistorique().filter(x => inRange(x, range));
    const ok = getOkChimioList().filter(x => inRange(x, range));
    const suivi = getSuivi().filter(x => inRange(x, range));
    const biologie = getBiologie().filter(x => inRange(x, range));
    const catalog = getCatalog();
    const active = patients.filter(p => !['termine','traite','archive','decede'].includes(normalizeStatus(p.statut))).length;
    const treated = patients.filter(p => ['termine','traite','archive'].includes(normalizeStatus(p.statut))).length;
    const lowStock = catalog.filter(item => Number(val(item.qteStock, item.stock, item.quantite, item.qty, 0)) <= 5).length;
    const bioDanger = biologie.filter(b => getBioOverall(b).level === 'danger').length;
    const responseCounts = countBy(suivi, 'reponse');

    container.innerHTML = `
      <div class="clinical-shell stats-full">
        <div class="stats-summary-grid">
          ${statBox('Période', range.label)}
          ${statBox('Patients', patients.length)}
          ${statBox('En cours', active)}
          ${statBox('Traités/terminés', treated)}
          ${statBox('RDV', rdv.length)}
          ${statBox('Protocoles générés', hist.length)}
          ${statBox('OK Chimio', ok.length)}
          ${statBox('Suivis', suivi.length)}
          ${statBox('Bilans bio', biologie.length)}
          ${statBox('Alertes bio graves', bioDanger)}
          ${statBox('Stock bas', lowStock)}
          ${statBox('Médecins', Object.keys(countBy(patients, patientDoctor)).filter(k => k !== 'Non renseigné').length)}
        </div>
        <div class="clinical-report-grid">
          ${reportCard('Protocoles par patient', renderMiniRows(countBy(patients, patientProtocol), 'Aucun protocole.'))}
          ${reportCard('Localisations / diagnostics', renderMiniRows(countBy(patients, p => val(p.localisation, p.localisations, p.diagnostic)), 'Aucun diagnostic.'))}
          ${reportCard('Médecins prescripteurs', renderMiniRows(countBy(patients, patientDoctor), 'Aucun médecin.'))}
          ${reportCard('Statuts RDV', renderMiniRows(countBy(rdv, r => val(r.status, r.statut)), 'Aucun RDV.'))}
          ${reportCard('Réponses tumorales', renderMiniRows(responseCounts, 'Aucune réponse.'))}
          ${reportCard('Biologie', `<div class="dash-line"><span>Total bilans</span><strong>${biologie.length}</strong></div><div class="dash-line"><span>Alertes graves</span><strong>${bioDanger}</strong></div><div class="dash-line"><span>Alertes à surveiller</span><strong>${biologie.filter(b => getBioOverall(b).level === 'warning').length}</strong></div>`)}
          ${reportCard('Pharmacie', `<div class="dash-line"><span>Articles catalogue</span><strong>${catalog.length}</strong></div><div class="dash-line"><span>Stock bas</span><strong>${lowStock}</strong></div>`)}
          ${reportCard('Historique', `<div class="dash-line"><span>Prescriptions période</span><strong>${hist.length}</strong></div><div class="dash-line"><span>Validations période</span><strong>${ok.length}</strong></div>`)}
        </div>
      </div>
    `;
  }

  function statBox(label, value){
    return `<div class="stats-box"><h3>${esc(label)}</h3><p>${esc(value)}</p></div>`;
  }

  function reportCard(title, body){
    return `<div class="card stats-section-card"><div class="card-header"><h2>${esc(title)}</h2></div><div class="card-body">${body}</div></div>`;
  }

  window.clearClinicalModuleData = function(module){
    if(!confirm('Effacer les données de ce module ?')) return;
    if(module === 'suivi'){
      localStorage.removeItem(STORAGE.suivi);
      localStorage.removeItem('suivi');
      renderSuivi();
    }
    if(module === 'biologie'){
      localStorage.removeItem(STORAGE.biologie);
      localStorage.removeItem('biologie');
      renderBiologie();
    }
  };

  const previousShowPage = window.showPage;
  if(typeof previousShowPage === 'function'){
    window.showPage = function(id, btn){
      const result = previousShowPage.apply(this, arguments);
      if(id === 'suivi') renderSuivi();
      if(id === 'biologie') renderBiologie();
      if(id === 'dashboard') renderDashboard();
      if(id === 'stats') renderStats();
      return result;
    };
  }

  window.renderDashboard = renderDashboard;
  window.renderSuivi = renderSuivi;
  window.renderBiologie = renderBiologie;
  window.renderStats = renderStats;

  setInterval(() => {
    const clock = document.getElementById('clinical-clock');
    if(clock) clock.textContent = new Date().toLocaleTimeString('fr-FR');
  }, 1000);
})();
