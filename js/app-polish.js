/* ============================================================
   FINITIONS DEMANDEES: FORMULAIRE, DASHBOARD, STATS, ARCHIVE
============================================================ */
(function(){
  function readJson(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(e){ return fallback; }
  }

  function writeJson(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }

  function esc(value){
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[c]));
  }

  function val(){
    for(let i = 0; i < arguments.length; i++){
      const value = arguments[i];
      if(value !== undefined && value !== null && String(value).trim() !== '') return value;
    }
    return '';
  }

  function normalize(value){
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function patients(){ return readJson('chncak_patients', []); }
  function historique(){ return readJson('chncak_historique', []); }
  function rdvs(){ return readJson('chncak_rdv', []); }
  function suivi(){ return readJson('chncak_suivi', readJson('suivi', [])); }
  function biologie(){ return readJson('chncak_biologie', readJson('biologie', [])); }
  function catalog(){ return readJson('chncak_catalog', []); }

  function patientProtocol(patient){
    return val(patient.proto, patient.protocole, patient.protocol, patient.protoName, patient.protocoleNom, 'Non renseigné');
  }

  function patientCancer(patient){
    return val(patient.localisation, patient.localisations, patient.diagnostic, 'Non renseigné');
  }

  function patientDoctor(patient){
    return val(patient.medecin, patient.medecinTraitant, patient.doctor, patient.prescripteur, 'Non assigné');
  }

  function countBy(items, selector){
    return items.reduce((acc, item) => {
      const key = typeof selector === 'function' ? selector(item) : val(item[selector], 'Non renseigné');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  function parseDate(value){
    if(!value) return null;
    if(typeof value === 'number') return new Date(value);
    const raw = String(value);
    if(raw.includes('/')){
      const parts = raw.split('/').map(Number);
      if(parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    const date = new Date(raw.length === 10 ? raw + 'T00:00:00' : raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function itemDate(item){
    return parseDate(val(item.dateTs, item.updatedAt, item.createdAt, item.dateRdv, item.dateProto, item.date));
  }

  function rangeFor(period){
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    let end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    let label = `Année ${now.getFullYear()}`;
    if(period === 'mensuel'){
      start.setMonth(now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      label = now.toLocaleDateString('fr-FR', {month:'long', year:'numeric'});
    }
    if(period === 'trimestriel'){
      const qStart = Math.floor(now.getMonth() / 3) * 3;
      start.setMonth(qStart, 1);
      end = new Date(now.getFullYear(), qStart + 3, 0, 23, 59, 59);
      label = `Trimestre ${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;
    }
    if(period === 'semestre'){
      const sStart = now.getMonth() < 6 ? 0 : 6;
      start.setMonth(sStart, 1);
      end = new Date(now.getFullYear(), sStart + 6, 0, 23, 59, 59);
      label = `Semestre ${sStart === 0 ? 1 : 2} ${now.getFullYear()}`;
    }
    if(period === 'annuel'){
      label = `Année ${now.getFullYear()}`;
    }
    if(period === 'tout'){
      start.setFullYear(2000, 0, 1);
      label = 'Toutes périodes';
    }
    return {start, end, label};
  }

  function filterRange(items, period){
    const range = rangeFor(period);
    return items.filter(item => {
      const date = itemDate(item);
      return !date || (date >= range.start && date <= range.end);
    });
  }

  function statBox(label, value){
    return `<div class="stats-box"><h3>${esc(label)}</h3><p>${esc(value)}</p></div>`;
  }

  function objectRows(data){
    const rows = Object.entries(data)
      .sort((a,b) => b[1] - a[1])
      .map(([label, count]) => `<tr><td>${esc(label)}</td><td>${count}</td></tr>`)
      .join('');
    return rows || '<tr><td colspan="2">Aucune donnée</td></tr>';
  }

  function medicineStats(period){
    const hist = filterRange(historique(), period);
    const totals = {};
    let totalReliquat = 0;

    hist.forEach(entry => {
      const proto = (window.PROTOCOLS || []).find(p => p.id === entry.protoId || p.name === entry.protoName);
      const surface = Number(entry.sc) || 0;
      if(!proto) return;
      proto.drugs.filter(d => !d.t && !d.oral && (d.mgm2 || d.fix || d.avastin || d.carbo)).forEach(drug => {
        const name = drug.name || drug.label;
        if(!name) return;
        let dose = 0;
        if(drug.mgm2 && surface) dose = Math.round(drug.mgm2 * surface);
        else if(typeof drug.fix === 'number') dose = drug.fix;
        else if(drug.avastin && entry.poids) dose = Math.round(15 * Number(entry.poids));
        if(!totals[name]) totals[name] = {uses:0, dose:0, reliquat:0};
        totals[name].uses += 1;
        totals[name].dose += dose || 0;
        if(dose && typeof window.calcFlacons === 'function'){
          const calc = window.calcFlacons(name, dose);
          if(calc){
            totals[name].reliquat += Number(calc.reliquat || 0);
            totalReliquat += Number(calc.reliquat || 0);
          }
        }
      });
    });

    return {totals, totalReliquat};
  }

  function medicineTable(stats){
    const rows = Object.entries(stats.totals)
      .sort((a,b) => b[1].uses - a[1].uses)
      .map(([name, data]) => `
        <tr>
          <td>${esc(name)}</td>
          <td>${data.uses}</td>
          <td>${Math.round(data.dose).toLocaleString('fr-FR')} mg</td>
          <td>${Math.round(data.reliquat).toLocaleString('fr-FR')} mg</td>
        </tr>
      `).join('');
    return `<table class="stats-rich-table"><thead><tr><th>Médicament</th><th>Utilisations</th><th>Dose totale utilisée</th><th>Reliquats / pertes</th></tr></thead><tbody>${rows || '<tr><td colspan="4">Aucun médicament utilisé sur la période.</td></tr>'}</tbody></table>`;
  }

  function protocolCancerTable(list){
    const grouped = {};
    list.forEach(patient => {
      const key = `${patientProtocol(patient)}||${patientCancer(patient)}`;
      grouped[key] = (grouped[key] || 0) + 1;
    });
    const rows = Object.entries(grouped).sort((a,b) => b[1] - a[1]).map(([key, count]) => {
      const [proto, cancer] = key.split('||');
      return `<tr><td>${esc(proto)}</td><td>${esc(cancer)}</td><td>${count}</td></tr>`;
    }).join('');
    return `<table class="stats-rich-table"><thead><tr><th>Protocole</th><th>Type de cancer / localisation</th><th>Patients</th></tr></thead><tbody>${rows || '<tr><td colspan="3">Aucune donnée.</td></tr>'}</tbody></table>`;
  }

  function doctorTable(list){
    const rows = Object.entries(countBy(list, patientDoctor))
      .sort((a,b) => b[1] - a[1])
      .map(([doctor, count]) => `<tr><td>${esc(doctor)}</td><td>${count}</td></tr>`)
      .join('');
    return `<table class="stats-rich-table"><thead><tr><th>Médecin</th><th>Nombre de protocoles/patients</th></tr></thead><tbody>${rows || '<tr><td colspan="2">Aucun médecin.</td></tr>'}</tbody></table>`;
  }

  function renderStatsRich(period){
    const range = rangeFor(period);
    const pts = patients();
    const hist = filterRange(historique(), period);
    const rdv = filterRange(rdvs(), period);
    const suivis = filterRange(suivi(), period);
    const bios = filterRange(biologie(), period);
    const meds = medicineStats(period);
    const medCount = Object.keys(meds.totals).length;
    const treated = pts.filter(p => ['traite','termine','archive'].includes(normalize(p.statut))).length;

    return `
      <div class="clinical-shell stats-full">
        <div class="stats-actions-bar">
          <div><strong>Rapport statistiques</strong><span>${esc(range.label)}</span></div>
          <button class="btn-secondary" onclick="printRapport()">Imprimer / Exporter</button>
        </div>
        <div class="stats-summary-grid">
          ${statBox('Patients', pts.length)}
          ${statBox('Patients traités', treated)}
          ${statBox('RDV période', rdv.length)}
          ${statBox('Prescriptions période', hist.length)}
          ${statBox('Suivis', suivis.length)}
          ${statBox('Bilans bio', bios.length)}
          ${statBox('Médicaments utilisés', medCount)}
          ${statBox('Reliquats totaux', `${Math.round(meds.totalReliquat).toLocaleString('fr-FR')} mg`)}
        </div>
        <div class="card stats-section-card">
          <div class="card-header"><h2>Patients par protocole et type de cancer</h2></div>
          <div class="card-body">${protocolCancerTable(pts)}</div>
        </div>
        <div class="clinical-report-grid">
          <div class="card stats-section-card"><div class="card-header"><h2>Médecins prescripteurs</h2></div><div class="card-body">${doctorTable(pts)}</div></div>
          <div class="card stats-section-card"><div class="card-header"><h2>Réponses tumorales</h2></div><div class="card-body"><table class="stats-rich-table"><tbody>${objectRows(countBy(suivis, 'reponse'))}</tbody></table></div></div>
        </div>
        <div class="card stats-section-card">
          <div class="card-header"><h2>Médicaments utilisés, doses et pertes</h2></div>
          <div class="card-body">${medicineTable(meds)}</div>
        </div>
      </div>
    `;
  }

  window.renderStats = function(){
    const container = document.getElementById('stats-content') || document.getElementById('page-stats');
    if(!container) return;
    const period = document.getElementById('stats-period')?.value || 'mensuel';
    container.innerHTML = renderStatsRich(period);
  };

  function buildReportDocument(period){
    const range = rangeFor(period);
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Rapport ChimioPro</title>
      <style>
      body{font-family:Arial,Helvetica,sans-serif;color:#17202a;margin:24px}
      .head{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #0A3D7A;padding-bottom:14px;margin-bottom:18px}
      h1{font-size:20px;color:#0A3D7A;margin:0} h2{font-size:15px;color:#0A3D7A;margin:18px 0 8px}
      .muted{font-size:12px;color:#666}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}
      .box{border:1px solid #d7dde5;border-radius:6px;padding:10px}.box b{display:block;font-size:18px;color:#0A3D7A}
      table{width:100%;border-collapse:collapse;margin-bottom:14px}th,td{border:1px solid #d7dde5;padding:7px;text-align:left;font-size:12px}th{background:#eef4fd;color:#0A3D7A}
      </style></head><body>
      <div class="head"><div><h1>CHNCAK Touba - ChimioPro</h1><div class="muted">Service d'Oncologie-Radiothérapie</div></div><div class="muted">${new Date().toLocaleDateString('fr-FR')}<br>${esc(range.label)}</div></div>
      ${renderStatsRich(period).replaceAll('class="stats-summary-grid"', 'class="grid"').replaceAll('class="stats-box"', 'class="box"')}
      </body></html>`;
  }

  function downloadFile(name, content, mime){
    const blob = new Blob([content], {type:mime});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  window.printRapport = function(){
    const period = prompt('Période du rapport : mensuel, trimestriel, semestre ou annuel', 'mensuel');
    if(!period) return;
    const normalized = normalize(period).startsWith('tri') ? 'trimestriel' : normalize(period).startsWith('sem') ? 'semestre' : normalize(period).startsWith('ann') ? 'annuel' : 'mensuel';
    const format = prompt('Format : PDF, Word ou Excel', 'PDF');
    if(!format) return;
    const html = buildReportDocument(normalized);
    const stamp = new Date().toISOString().slice(0,10);
    const choice = normalize(format);
    if(choice.includes('word') || choice.includes('doc')){
      downloadFile(`Rapport_ChimioPro_${stamp}.doc`, html, 'application/msword');
      return;
    }
    if(choice.includes('excel') || choice.includes('xls')){
      downloadFile(`Rapport_ChimioPro_${stamp}.xls`, html, 'application/vnd.ms-excel');
      return;
    }
    const win = window.open('', '_blank', 'width=1100,height=800');
    if(!win) return alert('Impossible d’ouvrir la fenêtre d’impression.');
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  window.printStats = window.printRapport;

  function polishProtocoleForm(){
    const card = document.querySelector('#page-protocole .card .card-body');
    if(!card || card.dataset.polished) return;
    card.dataset.polished = '1';
    const groups = card.querySelectorAll(':scope > .fg');
    const labels = ['Données patient', 'Autres données', 'Identification', 'Données thérapeutiques', 'Antécédents'];
    groups.forEach((group, index) => {
      const title = document.createElement('div');
      title.className = 'form-section-title';
      title.textContent = labels[index] || 'Données';
      group.prepend(title);
    });
  }

  function addPatientsArchiveButton(){
    const page = document.getElementById('page-patients');
    if(!page || page.querySelector('#patients-archive-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'patients-archive-btn';
    btn.className = 'btn-secondary patients-archive-btn';
    btn.textContent = 'Archive des patients terminés';
    btn.onclick = () => showPage('archive', document.querySelector('.tab-btn[onclick*="patients"]'));
    page.appendChild(btn);
  }

  function enhanceDashboardAnimation(){
    const welcome = document.querySelector('.dashboard-welcome');
    if(!welcome || welcome.querySelector('.dashboard-orbit')) return;
    const orbit = document.createElement('div');
    orbit.className = 'dashboard-orbit';
    orbit.innerHTML = '<div></div><span></span>';
    welcome.prepend(orbit);
  }

  const previousShowPage = window.showPage;
  if(typeof previousShowPage === 'function'){
    window.showPage = function(id, btn){
      const result = previousShowPage.apply(this, arguments);
      if(id === 'stats') window.renderStats();
      if(id === 'protocole') polishProtocoleForm();
      if(id === 'patients') setTimeout(addPatientsArchiveButton, 60);
      if(id === 'dashboard') setTimeout(enhanceDashboardAnimation, 60);
      return result;
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    polishProtocoleForm();
    setTimeout(enhanceDashboardAnimation, 60);
  });
})();
