/* ============================================================
   ONGLET RDV
============================================================ */
const RDV_DAYS = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const RDV_STATUS = {
  planifie: {label:'Planifié', color:'#4A80C4'},
  confirme: {label:'Confirmé', color:'#138754'},
  reporte: {label:'Reporté', color:'#E67E22'},
  annule: {label:'Annulé', color:'#C0392B'},
  traite: {label:'Traité', color:'#0B5E3C'}
};

function rdvReadJson(key, fallback){
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch(e){ return fallback; }
}

function rdvSaveList(list){
  localStorage.setItem('chncak_rdv', JSON.stringify(list));
}

function rdvPatientOptions(){
  return rdvReadJson('chncak_patients', []).map((p, index) => {
    const id = p.id || p.dossier || index;
    const label = `${p.prenom || ''} ${p.nom || ''}`.trim() || `Patient ${index + 1}`;
    const code = p.codegratuite || p.codeGratuite || p.code || p.dossier || '';
    const prefix = code ? `${code} - ` : '';
    return `<option value="${String(id).replace(/"/g,'&quot;')}">${prefix}${label}</option>`;
  }).join('');
}

function rdvMedecinOptions(){
  return rdvReadJson('chncak_medecins', medecins || []).map((m, index) => {
    const id = m.id || m.name || index;
    const label = m.name || `${m.prenom || ''} ${m.nom || ''}`.trim() || `Médecin ${index + 1}`;
    return `<option value="${String(id).replace(/"/g,'&quot;')}">${label}</option>`;
  }).join('');
}

function rdvProtocolOptions(){
  return PROTOCOLS.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}

function rdvFindPatient(value){
  const list = rdvReadJson('chncak_patients', []);
  return list.find((p, index) => String(p.id || p.dossier || index) === String(value));
}

function rdvFindMedecin(value){
  const list = rdvReadJson('chncak_medecins', medecins || []);
  return list.find((m, index) => String(m.id || m.name || index) === String(value));
}

function rdvFmt(iso){
  if(!iso) return '-';
  const d = new Date(iso + 'T00:00:00');
  if(isNaN(d)) return iso;
  return d.toLocaleDateString('fr-FR', {weekday:'short', day:'2-digit', month:'short', year:'numeric'});
}

function renderRdvPage(){
  const host = document.getElementById('rdv-page-content');
  if(!host) return;
  host.innerHTML = `
    <div style="max-width:1000px;margin:0 auto">
      <div class="card">
        <div class="card-header" style="justify-content:space-between">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="card-num">1</div>
            <h2>Gestion des rendez-vous</h2>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn-secondary" onclick="showRdvModal()">+ Nouveau RDV</button>
            <button class="btn-secondary" onclick="exportRdvStandalone()">Exporter Excel</button>
          </div>
        </div>
        <div class="card-body">
          <div class="rdv-toolbar">
            <input id="rdv-page-search" type="text" placeholder="Rechercher patient, médecin, protocole..." oninput="drawRdvRows()">
            <select id="rdv-page-filter" onchange="drawRdvRows()">
              <option value="all">Tous les statuts</option>
              ${Object.entries(RDV_STATUS).map(([key, s]) => `<option value="${key}">${s.label}</option>`).join('')}
            </select>
          </div>
          <div class="rdv-days">
            ${RDV_DAYS.map((day, index) => `<button class="prog-day-btn" onclick="filterRdvStandaloneByDay(${index},this)">${day}</button>`).join('')}
            <button class="prog-day-btn active" onclick="filterRdvStandaloneByDay('',this)">Tous</button>
          </div>
          <div id="rdv-standalone-list"></div>
        </div>
      </div>
    </div>

    <div class="modal-overlay" id="rdv-standalone-modal" onclick="if(event.target===this)closeRdvStandaloneModal()">
      <div class="modal" style="max-width:620px">
        <div class="modal-header">
          <h3 id="rdv-standalone-title">Nouveau rendez-vous</h3>
          <button class="modal-close" onclick="closeRdvStandaloneModal()">×</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="rdv-edit-id">
          <div class="fg g2">
            <div class="field"><label>Patient</label><select id="rdv-form-patient"><option value="">— Sélectionner —</option>${rdvPatientOptions()}</select></div>
            <div class="field"><label>Médecin</label><select id="rdv-form-medecin"><option value="">— Sélectionner —</option>${rdvMedecinOptions()}</select></div>
          </div>
          <div class="fg g2">
            <div class="field"><label>Date RDV</label><input id="rdv-form-date" type="date"></div>
            <div class="field"><label>Date protocole</label><input id="rdv-form-date-proto" type="date"></div>
          </div>
          <div class="fg g2">
            <div class="field"><label>Heure</label><input id="rdv-form-time" type="time" value="09:00"></div>
            <div class="field"><label>Statut</label><select id="rdv-form-status">${Object.entries(RDV_STATUS).map(([key, s]) => `<option value="${key}">${s.label}</option>`).join('')}</select></div>
          </div>
          <div class="field"><label>Protocole</label><select id="rdv-form-proto"><option value="">— Sélectionner —</option>${rdvProtocolOptions()}</select></div>
          <div class="field"><label>Notes</label><textarea id="rdv-form-notes" rows="3" style="width:100%;padding:9px 11px;border:1.5px solid var(--gray-border);border-radius:var(--radius);font-family:var(--font)"></textarea></div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="closeRdvStandaloneModal()">Annuler</button>
          <button class="btn-primary" style="width:auto;padding:9px 20px" onclick="saveRdvStandalone()">Enregistrer</button>
        </div>
      </div>
    </div>
  `;
  drawRdvRows();
}

let rdvDayFilter = '';

function drawRdvRows(){
  const target = document.getElementById('rdv-standalone-list');
  if(!target) return;
  const q = (document.getElementById('rdv-page-search')?.value || '').toLowerCase();
  const status = document.getElementById('rdv-page-filter')?.value || 'all';
  const today = new Date(); today.setHours(0,0,0,0);
  let list = rdvReadJson('chncak_rdv', []);
  list = list.filter(r => {
    const text = `${r.prenom || ''} ${r.nom || ''} ${r.medecin || ''} ${r.proto || ''} ${r.dossier || ''}`.toLowerCase();
    const d = r.dateRdv ? new Date(r.dateRdv + 'T00:00:00') : null;
    return (!q || text.includes(q)) &&
      (status === 'all' || (r.status || 'planifie') === status) &&
      (rdvDayFilter === '' || (d && d.getDay() === rdvDayFilter));
  }).sort((a,b) => (a.dateRdv || '').localeCompare(b.dateRdv || ''));

  const rows = list.map(r => {
    const d = r.dateRdv ? new Date(r.dateRdv + 'T00:00:00') : null;
    const diff = d && !isNaN(d) ? Math.round((d - today) / 86400000) : null;
    const badge = diff === 0 ? 'Aujourd hui' : diff === 1 ? 'Demain' : diff < 0 ? 'En retard' : diff !== null ? `J-${diff}` : '';
    const statusInfo = RDV_STATUS[r.status || 'planifie'] || RDV_STATUS.planifie;
    const isToday = diff === 0;
    const isTreated = (r.status || '') === 'traite' || r.validatedAt;
    const treatButton = isTreated
      ? '<button class="rdv-treated" disabled>Patient traité</button>'
      : isToday
        ? `<button class="rdv-treat" onclick="traiterRdvStandalone(${r.id})">Traiter</button>`
        : '<button class="rdv-blocked" disabled>Non autorisé</button>';
    return `
      <div class="rdv-row">
        <div class="rdv-date">
          <strong>${rdvFmt(r.dateRdv)}</strong>
          <span>${badge}</span>
        </div>
        <div class="rdv-main">
          <div><strong>${r.prenom || ''} ${r.nom || ''}</strong> <span class="dash-muted">${r.dossier || ''}</span></div>
          <div class="dash-muted">${r.proto || '-'} · ${r.medecin || '-'}</div>
          ${r.notes ? `<div class="dash-muted">${r.notes}</div>` : ''}
        </div>
        <span class="rdv-status-pill" style="background:${statusInfo.color}">${statusInfo.label}</span>
        <div class="rdv-actions">
          ${treatButton}
          <button onclick="printBonRdvFromRdv(${r.id})">Bon RDV</button>
          <button onclick="editRdvStandalone(${r.id})">Modifier</button>
          <button onclick="deleteRdvStandalone(${r.id})">Supprimer</button>
        </div>
      </div>
    `;
  }).join('');

  target.innerHTML = rows || '<div class="hist-empty">Aucun rendez-vous trouvé.</div>';
}

function rdvPatientSurface(patient){
  const poids = parseFloat(patient?.poids || patient?.weight || 0);
  const taille = parseFloat(patient?.taille || patient?.height || 0);
  if(!poids || !taille) return 0;
  return 0.007184 * Math.pow(poids, 0.425) * Math.pow(taille, 0.725);
}

function rdvDoseForDrug(drug, patient){
  const poids = parseFloat(patient?.poids || patient?.weight || 0);
  const surface = rdvPatientSurface(patient);
  if(drug.fix !== undefined && typeof drug.fix === 'number') return drug.fix;
  if(drug.mgm2 && surface) return Math.round(drug.mgm2 * surface);
  if(drug.avastin && poids) return Math.round(15 * poids);
  return 0;
}

function traiterRdvStandalone(id){
  const list = rdvReadJson('chncak_rdv', []);
  const idx = list.findIndex(r => r.id === id);
  if(idx === -1) return;
  const rdv = list[idx];
  const today = new Date().toISOString().split('T')[0];
  if(rdv.dateRdv !== today){
    alert('Non autorisé : ce rendez-vous ne correspond pas à la date du jour.');
    return;
  }
  if((rdv.status || '') === 'traite' || rdv.validatedAt){
    alert('Ce patient est déjà marqué comme traité.');
    return;
  }

  const patients = rdvReadJson('chncak_patients', []);
  const patient = patients.find(p =>
    (p.dossier && p.dossier === rdv.dossier) ||
    (`${p.prenom || ''} ${p.nom || ''}`.trim().toLowerCase() === `${rdv.prenom || ''} ${rdv.nom || ''}`.trim().toLowerCase())
  ) || {};
  const proto = PROTOCOLS.find(p => p.id === rdv.protoId || p.name === rdv.proto);
  if(!proto){
    alert('Protocole introuvable pour ce rendez-vous.');
    return;
  }

  const catalog = JSON.parse(localStorage.getItem('chncak_catalog') || '[]');
  let updated = 0;
  const warnings = [];
  const details = [];

  proto.drugs.filter(d => !d.t && !d.oral && !d.fix && (d.mgm2 || d.avastin || d.carbo)).forEach(drug => {
    if(drug.carbo){
      warnings.push(`${drug.name}: dose Carboplatine non déduite automatiquement sans créatininémie.`);
      return;
    }
    const dose = rdvDoseForDrug(drug, patient);
    if(!dose){
      warnings.push(`${drug.name}: poids/taille manquants pour calculer la dose.`);
      return;
    }
    const calc = typeof calcFlacons === 'function' ? calcFlacons(drug.name, dose) : null;
    const itemIndex = catalog.findIndex(item => item.name === drug.name);
    if(!calc || itemIndex === -1){
      warnings.push(`${drug.name}: médicament non trouvé dans le catalogue pharmacie.`);
      return;
    }
    const stock = Number(catalog[itemIndex].qteStock ?? catalog[itemIndex].stock ?? 0);
    if(stock < calc.nbFlacons){
      warnings.push(`${drug.name}: stock insuffisant (${stock} disponible, ${calc.nbFlacons} requis).`);
      return;
    }
    catalog[itemIndex].qteStock = stock - calc.nbFlacons;
    updated++;
    details.push(`${drug.name}: ${calc.nbFlacons} flacon(s), reliquat ${calc.reliquat || 0} mg`);
  });

  localStorage.setItem('chncak_catalog', JSON.stringify(catalog));
  list[idx] = {...rdv, status:'traite', validatedAt:new Date().toISOString(), stockDetails:details, stockWarnings:warnings};
  rdvSaveList(list);

  const sorties = rdvReadJson('chncak_sorties', []);
  sorties.unshift({
    id: Date.now(),
    date: new Date().toLocaleDateString('fr-FR'),
    dateTs: new Date().toISOString(),
    patient: `${rdv.prenom || ''} ${rdv.nom || ''}`.trim(),
    protocole: proto.name,
    details: details.join(', '),
    warnings
  });
  localStorage.setItem('chncak_sorties', JSON.stringify(sorties));

  drawRdvRows();
  if(typeof renderDashboard === 'function') renderDashboard();
  if(typeof renderPharmacie === 'function' && document.getElementById('page-pharmacie')?.classList.contains('active')) renderPharmacie();
  alert(`Patient traité. Stock mis à jour pour ${updated} médicament(s).${warnings.length ? '\n\nAvertissements:\n' + warnings.join('\n') : ''}`);
}

function filterRdvStandaloneByDay(day, btn){
  rdvDayFilter = day === '' ? '' : Number(day);
  document.querySelectorAll('#page-rdv .prog-day-btn').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  drawRdvRows();
}

function showRdvModal(){
  document.getElementById('rdv-standalone-title').textContent = 'Nouveau rendez-vous';
  document.getElementById('rdv-edit-id').value = '';
  document.getElementById('rdv-form-patient').disabled = false;
  document.getElementById('rdv-form-patient').title = '';
  document.getElementById('rdv-form-patient').value = '';
  document.getElementById('rdv-form-medecin').value = '';
  document.getElementById('rdv-form-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('rdv-form-date-proto').value = '';
  document.getElementById('rdv-form-time').value = '09:00';
  document.getElementById('rdv-form-status').value = 'planifie';
  document.getElementById('rdv-form-proto').value = '';
  document.getElementById('rdv-form-notes').value = '';
  document.getElementById('rdv-standalone-modal').classList.add('open');
}

function closeRdvStandaloneModal(){
  document.getElementById('rdv-standalone-modal')?.classList.remove('open');
}

function saveRdvStandalone(){
  const patient = rdvFindPatient(document.getElementById('rdv-form-patient').value);
  const med = rdvFindMedecin(document.getElementById('rdv-form-medecin').value);
  const proto = PROTOCOLS.find(p => p.id === document.getElementById('rdv-form-proto').value);
  const dateRdv = document.getElementById('rdv-form-date').value;
  if(!patient || !dateRdv){
    alert('Sélectionnez au minimum un patient et une date de rendez-vous.');
    return;
  }
  const id = parseInt(document.getElementById('rdv-edit-id').value, 10) || Date.now();
  const list = rdvReadJson('chncak_rdv', []);
  const entry = {
    id,
    prenom: patient.prenom || '',
    nom: patient.nom || '',
    age: patient.age || '',
    dossier: patient.dossier || '',
    tel: patient.tel || patient.telephone || '',
    protoId: proto?.id || '',
    proto: proto?.name || '',
    medecin: med ? (med.name || `${med.prenom || ''} ${med.nom || ''}`.trim()) : '',
    dateRdv,
    dateProto: document.getElementById('rdv-form-date-proto').value,
    time: document.getElementById('rdv-form-time').value,
    status: document.getElementById('rdv-form-status').value,
    notes: document.getElementById('rdv-form-notes').value.trim(),
    updatedAt: new Date().toISOString()
  };
  const idx = list.findIndex(r => r.id === id);
  if(idx >= 0) list[idx] = {...list[idx], ...entry};
  else list.push(entry);
  rdvSaveList(list.sort((a,b) => (a.dateRdv || '').localeCompare(b.dateRdv || '')));
  closeRdvStandaloneModal();
  drawRdvRows();
  if(typeof renderDashboard === 'function') renderDashboard();
  if(typeof showToast === 'function') showToast('Rendez-vous enregistré.', 'success');
}

function editRdvStandalone(id){
  const r = rdvReadJson('chncak_rdv', []).find(item => item.id === id);
  if(!r) return;
  showRdvModal();
  document.getElementById('rdv-standalone-title').textContent = 'Modifier rendez-vous';
  document.getElementById('rdv-edit-id').value = r.id;
  const patientSelect = document.getElementById('rdv-form-patient');
  const medecinSelect = document.getElementById('rdv-form-medecin');
  patientSelect.disabled = false;
  const patientName = `${r.prenom || ''} ${r.nom || ''}`.trim().toLowerCase();
  Array.from(patientSelect.options).forEach(opt => {
    const optText = opt.textContent.trim().toLowerCase();
    if(optText === patientName || optText.endsWith(' - ' + patientName)) patientSelect.value = opt.value;
  });
  patientSelect.disabled = true;
  patientSelect.title = 'Patient verrouillé automatiquement depuis la ligne RDV sélectionnée';
  Array.from(medecinSelect.options).forEach(opt => {
    if(opt.textContent.trim().toLowerCase() === String(r.medecin || '').trim().toLowerCase()) medecinSelect.value = opt.value;
  });
  document.getElementById('rdv-form-date').value = r.dateRdv || '';
  document.getElementById('rdv-form-date-proto').value = r.dateProto || '';
  document.getElementById('rdv-form-time').value = r.time || '09:00';
  document.getElementById('rdv-form-status').value = r.status || 'planifie';
  document.getElementById('rdv-form-proto').value = r.protoId || '';
  document.getElementById('rdv-form-notes').value = r.notes || '';
}

function deleteRdvStandalone(id){
  if(!confirm('Supprimer ce rendez-vous ?')) return;
  rdvSaveList(rdvReadJson('chncak_rdv', []).filter(r => r.id !== id));
  drawRdvRows();
  if(typeof renderDashboard === 'function') renderDashboard();
}

function exportRdvStandalone(){
  const list = rdvReadJson('chncak_rdv', []);
  if(!list.length){ alert('Aucun rendez-vous à exporter.'); return; }
  const rows = list.map(r => ({
    Date: rdvFmt(r.dateRdv),
    Heure: r.time || '',
    Patient: `${r.prenom || ''} ${r.nom || ''}`.trim(),
    Dossier: r.dossier || '',
    Medecin: r.medecin || '',
    Protocole: r.proto || '',
    Statut: (RDV_STATUS[r.status || 'planifie'] || RDV_STATUS.planifie).label,
    Notes: r.notes || ''
  }));
  if(typeof XLSX === 'undefined'){
    alert('Bibliothèque Excel non chargée.');
    return;
  }
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'RDV');
  XLSX.writeFile(wb, `RDV_ChimioPro_${new Date().toISOString().slice(0,10)}.xlsx`);
}
