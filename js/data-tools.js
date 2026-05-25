/* ============================================================
   DATA TOOLS: RECHERCHE, SAUVEGARDE, RESTAURATION, ETAT
============================================================ */
(function(){
  const DATA_PREFIX = 'chncak_';
  const DEFAULT_ADMIN_CODE = '2026';
  const ADMIN_CODE_KEY = 'chncak_admin_code';

  function readJson(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(e){ return fallback; }
  }

  function safeText(value){
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[ch]));
  }

  function normalize(value){
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function adminCode(){
    return localStorage.getItem(ADMIN_CODE_KEY) || DEFAULT_ADMIN_CODE;
  }

  function download(name, content, mime){
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

  function allDataKeys(){
    const keys = [];
    for(let i = 0; i < localStorage.length; i++){
      const key = localStorage.key(i);
      if(key && (key.startsWith(DATA_PREFIX) || key.startsWith('chimio_') || ['suivi','biologie'].includes(key))) keys.push(key);
    }
    return keys.sort();
  }

  function exportAllData(){
    const payload = {
      app: 'ChimioPro CHNCAK',
      exportedAt: new Date().toISOString(),
      version: 'local-storage-v1',
      data: {}
    };
    allDataKeys().forEach(key => payload.data[key] = localStorage.getItem(key));
    localStorage.setItem('chncak_last_backup', payload.exportedAt);
    download(`Sauvegarde_ChimioPro_${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
    notify('Sauvegarde exportée.');
    renderHealthPanel(true);
  }

  function importAllData(file){
    if(!file) return;
    const code = prompt('Code a 4 chiffres requis pour restaurer une sauvegarde :');
    if(code === null) return;
    if(code !== adminCode()){
      alert('Code incorrect. Restauration annulee.');
      return;
    }
    if(!confirm('Confirmer definitivement la restauration de la sauvegarde ?')) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        if(!payload || !payload.data || typeof payload.data !== 'object') throw new Error('Format invalide');
        const keys = Object.keys(payload.data);
        if(!confirm(`Restaurer ${keys.length} blocs de données ChimioPro ? Les données locales correspondantes seront remplacées.`)) return;
        keys.forEach(key => {
          if(key.startsWith(DATA_PREFIX) || key.startsWith('chimio_') || ['suivi','biologie'].includes(key)){
            localStorage.setItem(key, payload.data[key]);
          }
        });
        localStorage.setItem('chncak_last_restore', new Date().toISOString());
        notify('Données restaurées. Rechargement...');
        setTimeout(() => location.reload(), 600);
      } catch(err) {
        alert('Fichier de sauvegarde invalide ou illisible.');
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  function storageSize(){
    let total = 0;
    allDataKeys().forEach(key => total += key.length + (localStorage.getItem(key) || '').length);
    return total;
  }

  function fmtBytes(bytes){
    if(bytes < 1024) return `${bytes} o`;
    if(bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
  }

  function notify(message){
    if(typeof showToast === 'function') showToast(message, 'success');
    else console.log(message);
  }

  function buildSearchIndex(){
    const patients = readJson('chncak_patients', []);
    const rdv = readJson('chncak_rdv', []);
    const hist = readJson('chncak_historique', []);
    const protocols = (typeof PROTOCOLS !== 'undefined' ? PROTOCOLS : []);

    const items = [];
    patients.forEach(p => items.push({
      type:'Patient',
      title:`${p.prenom || ''} ${p.nom || ''}`.trim() || 'Patient',
      meta:[p.dossier, p.proto, p.medecin, p.tel].filter(Boolean).join(' · '),
      target:'patients'
    }));
    rdv.forEach(r => items.push({
      type:'RDV',
      title:`${r.prenom || ''} ${r.nom || ''}`.trim() || 'Rendez-vous',
      meta:[r.dateRdv, r.time, r.proto, r.medecin].filter(Boolean).join(' · '),
      target:'rdv'
    }));
    hist.forEach(h => items.push({
      type:'Historique',
      title:`${h.prenom || ''} ${h.nom || ''}`.trim() || 'Protocole enregistré',
      meta:[h.date, h.protoName, h.medecin].filter(Boolean).join(' · '),
      target:'stats'
    }));
    protocols.forEach(p => items.push({
      type:'Protocole',
      title:p.name,
      meta:[p.rythme, p.indication, p.detail].filter(Boolean).join(' · '),
      target:'protocole'
    }));
    return items;
  }

  function openQuickSearch(){
    ensureQuickModal();
    document.getElementById('quick-modal').classList.add('open');
    const input = document.getElementById('quick-input');
    input.value = '';
    drawQuickResults('');
    setTimeout(() => input.focus(), 20);
  }

  function closeQuickSearch(){
    document.getElementById('quick-modal')?.classList.remove('open');
  }

  function drawQuickResults(query){
    const target = document.getElementById('quick-results');
    if(!target) return;
    const q = normalize(query);
    const rows = buildSearchIndex()
      .filter(item => !q || normalize(`${item.type} ${item.title} ${item.meta}`).includes(q))
      .slice(0, 30)
      .map(item => `
        <div class="quick-row" data-target="${safeText(item.target)}">
          <div class="quick-type">${safeText(item.type)}</div>
          <div><div class="quick-title">${safeText(item.title)}</div><div class="quick-meta">${safeText(item.meta || '-')}</div></div>
          <div class="quick-meta">Entrer</div>
        </div>
      `).join('');
    target.innerHTML = rows || '<div class="quick-empty">Aucun résultat.</div>';
    target.querySelectorAll('.quick-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.dataset.target;
        closeQuickSearch();
        const btn = document.querySelector(`.tab-btn[onclick*="'${id}'"]`);
        if(typeof showPage === 'function') showPage(id, btn);
      });
    });
  }

  function ensureQuickModal(){
    if(document.getElementById('quick-modal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="quick-modal" id="quick-modal" onclick="if(event.target===this)window.closeQuickSearch()">
        <div class="quick-box">
          <div class="quick-head">
            <input id="quick-input" placeholder="Rechercher patient, RDV, protocole..." oninput="window.drawQuickResults(this.value)">
            <button class="btn-secondary" onclick="window.closeQuickSearch()">Fermer</button>
          </div>
          <div class="quick-results" id="quick-results"></div>
        </div>
      </div>
    `);
  }

  function renderHealthPanel(forceOpen){
    let panel = document.getElementById('data-health');
    if(!panel){
      panel = document.createElement('div');
      panel.id = 'data-health';
      panel.className = 'data-health';
      document.body.appendChild(panel);
    }
    const patients = readJson('chncak_patients', []).length;
    const rdv = readJson('chncak_rdv', []).length;
    const hist = readJson('chncak_historique', []).length;
    const lastBackup = localStorage.getItem('chncak_last_backup');
    panel.innerHTML = `
      <h3>Etat des données</h3>
      <div class="data-health-row"><span>Patients</span><strong>${patients}</strong></div>
      <div class="data-health-row"><span>RDV</span><strong>${rdv}</strong></div>
      <div class="data-health-row"><span>Historique</span><strong>${hist}</strong></div>
      <div class="data-health-row"><span>Blocs stockés</span><strong>${allDataKeys().length}</strong></div>
      <div class="data-health-row"><span>Taille locale</span><strong>${fmtBytes(storageSize())}</strong></div>
      <div class="data-health-row"><span>Dernière sauvegarde</span><strong>${lastBackup ? new Date(lastBackup).toLocaleString('fr-FR') : 'Jamais'}</strong></div>
    `;
    if(forceOpen) panel.classList.add('open');
  }

  function toggleHealthPanel(){
    renderHealthPanel(false);
    document.getElementById('data-health')?.classList.toggle('open');
  }

  function injectToolbar(){
    if(document.getElementById('data-tools-bar')) return;
    const navTop = document.querySelector('.nav-top');
    if(!navTop) return;
    const bar = document.createElement('div');
    bar.id = 'data-tools-bar';
    bar.className = 'data-tools-bar no-print';
    bar.innerHTML = `
      <button class="data-tools-btn" type="button" data-tool-action="search" title="Recherche globale (Ctrl+K)">Recherche</button>
      <button class="data-tools-btn" type="button" data-tool-action="export" title="Exporter toutes les données locales">Sauvegarder</button>
      <label class="data-tools-btn" title="Restaurer une sauvegarde JSON">Restaurer<input type="file" accept=".json" style="display:none" onchange="window.importAllData(this.files[0]);this.value=''"></label>
      <button class="data-tools-btn" type="button" data-tool-action="health" title="Voir l'état des données">Etat</button>
      <button class="data-tools-btn" type="button" data-tool-action="official-reset" title="Initialisation officielle avant demarrage">Initialiser</button>
    `;
    navTop.appendChild(bar);
  }

  window.exportAllData = exportAllData;
  importAllData.requiresAccessCode = true;
  window.importAllData = importAllData;
  window.openQuickSearch = openQuickSearch;
  window.closeQuickSearch = closeQuickSearch;
  window.drawQuickResults = drawQuickResults;
  window.toggleHealthPanel = toggleHealthPanel;

  document.addEventListener('click', event => {
    const actionButton = event.target.closest('[data-tool-action]');
    if(!actionButton) return;
    const action = actionButton.dataset.toolAction;
    if(action === 'search') openQuickSearch();
    if(action === 'export') exportAllData();
    if(action === 'health') toggleHealthPanel();
    if(action === 'official-reset'){
      if(typeof window.chimioproOfficialReset === 'function') window.chimioproOfficialReset();
      else alert('Le module Supabase n est pas encore charge. Rechargez la page puis reessayez.');
    }
  });

  document.addEventListener('keydown', event => {
    if((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k'){
      event.preventDefault();
      openQuickSearch();
    }
    if(event.key === 'Escape') closeQuickSearch();
  });

  function bootDataTools() {
    injectToolbar();
    ensureQuickModal();
    renderHealthPanel(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootDataTools);
  } else {
    bootDataTools();
  }
})();
