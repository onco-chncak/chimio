/* ============================================================
   SYNCHRONISATION CLOUD SUPABASE - CHIMIOPRO
   Premiere couche prudente: snapshot fusionnable des donnees locales.
============================================================ */
(function(){
  const SUPABASE_URL = 'https://frfungcoqagpcyaaglox.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_LWC2vokbGnSWFA1Vg6DAsA_JFaCNbei';
  const SNAPSHOT_KEY = 'cloud_snapshot_v1';
  const LOCAL_META_KEY = 'chncak_cloud_last_sync';
  const DEVICE_ID_KEY = 'chncak_cloud_device_id';
  const LOCAL_PULL_BACKUP_KEY = 'chncak_local_backup_before_cloud_pull';
  const CLOUD_ERROR_KEY = 'chncak_cloud_last_error';
  const LOCAL_DIRTY_KEY = 'chncak_cloud_local_dirty';
  const AUTO_SYNC_INTERVAL_MS = 30 * 1000;
  let autoSyncTimer = null;
  let localDirty = localStorage.getItem(LOCAL_DIRTY_KEY) === '1';
  let suppressLocalTracking = false;
  const ADMIN_CODE = '2026';

  const DATA_KEYS = [
    'chncak_patients',
    'chncak_rdv',
    'chncak_historique',
    'chncak_protocols',
    'chncak_catalog',
    'chncak_sorties',
    'chncak_hematologie_sorties',
    'chncak_hematologie_patients',
    'chncak_code_gratuite_counter',
    'chncak_suivi',
    'chncak_biologie',
    'chncak_medecins',
    'chncak_programme',
    'chncak_prog_config',
    'chncak_responsables',
    'chncak_archived_patients',
    'chncak_okchimio',
    'chncak_stock_sorties',
    'chncak_okchimio_refuses',
    'chncak_deleted_saved_protocols',
    'chncak_deleted_medecins',
    'patients',
    'okchimio',
    'sorties',
    'suivi',
    'biologie',
    'historique',
    'rdv'
  ];

  const ARRAY_KEYS = new Set([
    'chncak_patients',
    'chncak_rdv',
    'chncak_historique',
    'chncak_protocols',
    'chncak_catalog',
    'chncak_sorties',
    'chncak_hematologie_sorties',
    'chncak_hematologie_patients',
    'chncak_code_gratuite_counter',
    'chncak_suivi',
    'chncak_biologie',
    'chncak_medecins',
    'chncak_archived_patients',
    'chncak_okchimio',
    'chncak_stock_sorties',
    'chncak_okchimio_refuses',
    'chncak_deleted_saved_protocols',
    'chncak_deleted_medecins',
    'patients',
    'okchimio',
    'sorties',
    'suivi',
    'biologie',
    'historique',
    'rdv'
  ]);

  const RESET_KEEP_KEYS = new Set([
    'chncak_catalog',
    'chncak_medecins',
    'chncak_responsables',
    'chncak_prog_config',
    'chncak_code_gratuite_counter',
    'chncak_dashboard_team_photo',
    'chncak_official_reset_at',
    'chncak_cloud_device_id',
    'chncak_dark',
    'supabase.auth.token'
  ]);

  const RESET_REMOVE_KEYS = [
    'chncak_patients',
    'chncak_rdv',
    'chncak_historique',
    'chncak_protocols',
    'chncak_sorties',
    'chncak_hematologie_sorties',
    'chncak_hematologie_patients',
    'chncak_suivi',
    'chncak_biologie',
    'chncak_programme',
    'chncak_archived_patients',
    'chncak_okchimio',
    'chncak_stock_sorties',
    'chncak_okchimio_refuses',
    'chncak_deleted_saved_protocols',
    'chncak_deleted_medecins',
    'chncak_last_backup',
    'chncak_last_restore',
    'chncak_cloud_last_sync',
    'patients',
    'okchimio',
    'sorties',
    'suivi',
    'biologie',
    'historique',
    'rdv'
  ];

  const LOCAL_ONLY_KEYS = new Set([
    DEVICE_ID_KEY,
    LOCAL_META_KEY,
    LOCAL_PULL_BACKUP_KEY,
    LOCAL_DIRTY_KEY,
    'chncak_currentUser',
    'chncak_dark'
  ]);

  function esc(value){
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[ch]));
  }

  function valNewestDate(a, b){
    const at = Date.parse(a || '') || 0;
    const bt = Date.parse(b || '') || 0;
    return bt >= at ? (b || a || new Date().toISOString()) : (a || b || new Date().toISOString());
  }

  function notify(message, type){
    if(typeof showToast === 'function') showToast(message, type || 'info');
    else console.log(message);
  }

  function readJsonValue(raw, fallback){
    try { return JSON.parse(raw); }
    catch(e){ return fallback; }
  }

  function getDeviceId(){
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if(!id){
      id = 'device_' + Date.now() + '_' + Math.random().toString(16).slice(2);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  }

  function identity(item, index){
    if(!item || typeof item !== 'object') return 'idx_' + index + '_' + JSON.stringify(item);
    return String(
      item.id ||
      item.codegratuite ||
      item.codeGratuite ||
      item.code ||
      item.dossier ||
      item.name ||
      item.nom ||
      item.patientCode ||
      item.dateTs ||
      index
    );
  }

  function norm(value){
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function protocolNameFor(entry){
    return entry?.protocole || entry?.proto || entry?.protocolName || entry?.protoName || entry?.nomProtocole || entry?.patient?.protocole || entry?.patient?.proto || '';
  }

  function protocolSignature(entry){
    if(!entry || typeof entry !== 'object') return '';
    const patient = entry.patient || {};
    const val = (...values) => {
      const found = values.find(v => v !== undefined && v !== null && String(v).trim() !== '');
      return found === undefined ? '' : found;
    };
    const strongId = val(entry.id, entry.dateTs, entry.createdAt, entry.dateCreation, patient.id, patient.dateTs, patient.createdAt);
    const identifiers = [
      norm(val(entry.idCubix, entry.id_cubix, patient.idCubix, patient.id_cubix)),
      norm(val(entry.dossier, entry.numeroDossier, patient.dossier, patient.numeroDossier)),
      norm(val(entry.codegratuite, entry.codeGratuite, entry.code, patient.codegratuite, patient.codeGratuite, patient.code))
    ].filter(Boolean).join('|');
    const proto = norm(protocolNameFor(entry));
    const date = norm(val(entry.dateRdv, entry.rdv, entry.prochainRdv, entry.date, entry.formSnapshot?.['date-rdv'], patient.dateRdv, patient.rdv));
    const cure = norm(val(entry.cure, patient.cure));
    return [strongId ? `id:${strongId}` : '', identifiers ? `ids:${identifiers}` : '', proto ? `p:${proto}` : '', date ? `d:${date}` : '', cure ? `c:${cure}` : ''].filter(Boolean).join('::');
  }

  function sameProtocolRecord(item, signature){
    if(!signature) return false;
    const own = protocolSignature(item);
    if(own && own === signature) return true;
    const patientSig = protocolSignature(item?.patient);
    return Boolean(patientSig && patientSig === signature);
  }

  function pruneDeletedProtocolData(data){
    const deleted = readJsonValue(data?.chncak_deleted_saved_protocols, []);
    if(!Array.isArray(deleted) || !deleted.length) return data;
    const keys = ['chncak_historique','historique','chncak_protocols','chncak_okchimio','chncak_okchimio_refuses','chncak_rdv','rdv','chncak_biologie','biologie','chncak_suivi','suivi','chncak_patients','patients'];
    const out = {...data};
    keys.forEach(key => {
      const list = readJsonValue(out[key], null);
      if(!Array.isArray(list)) return;
      const next = list.filter(item => !deleted.some(sig => sameProtocolRecord(item, sig)));
      out[key] = JSON.stringify(next);
    });
    return out;
  }

  function mergeArrays(cloudValue, localValue){
    const map = new Map();
    (Array.isArray(cloudValue) ? cloudValue : []).forEach((item, index) => {
      map.set(identity(item, index), item);
    });
    (Array.isArray(localValue) ? localValue : []).forEach((item, index) => {
      const key = identity(item, index);
      const old = map.get(key);
      map.set(key, old && typeof old === 'object' && typeof item === 'object' ? {...old, ...item} : item);
    });
    return Array.from(map.values());
  }

  function mergeValues(key, cloudRaw, localRaw){
    if(localRaw === null || localRaw === undefined || localRaw === '') return cloudRaw;
    if(cloudRaw === null || cloudRaw === undefined || cloudRaw === '') return localRaw;
    const cloud = readJsonValue(cloudRaw, null);
    const local = readJsonValue(localRaw, null);
    if(key === 'chncak_code_gratuite_counter'){
      const cloudValue = Number(cloud?.value || cloud?.global || 0);
      const localValue = Number(local?.value || local?.global || 0);
      return JSON.stringify({
        value: Math.max(cloudValue, localValue, 0),
        updatedAt: valNewestDate(cloud?.updatedAt, local?.updatedAt),
        updatedBy: valNewestDate(cloud?.updatedAt, local?.updatedAt) === local?.updatedAt ? local?.updatedBy : cloud?.updatedBy
      });
    }
    if(ARRAY_KEYS.has(key) && Array.isArray(cloud) && Array.isArray(local)){
      return JSON.stringify(mergeArrays(cloud, local));
    }
    if(cloud && local && typeof cloud === 'object' && typeof local === 'object' && !Array.isArray(cloud) && !Array.isArray(local)){
      return JSON.stringify({...cloud, ...local});
    }
    return localRaw;
  }

  function collectLocalData(){
    const data = {};
    DATA_KEYS.forEach(key => {
      if(LOCAL_ONLY_KEYS.has(key)) return;
      const value = localStorage.getItem(key);
      if(value !== null) data[key] = value;
    });
    for(let i = 0; i < localStorage.length; i++){
      const key = localStorage.key(i);
      if(key && key.startsWith('chncak_') && !LOCAL_ONLY_KEYS.has(key) && !(key in data)){
        data[key] = localStorage.getItem(key);
      }
    }
    return data;
  }

  function backupLocalData(reason){
    try{
      localStorage.setItem(LOCAL_PULL_BACKUP_KEY, JSON.stringify({
        reason: reason || 'cloud_pull',
        createdAt: new Date().toISOString(),
        data: collectLocalData()
      }));
    } catch(e){
      console.warn('Sauvegarde locale avant cloud impossible:', e.message);
    }
  }

  function applyCloudAuthoritativeData(cloudData){
    suppressLocalTracking = true;
    backupLocalData('before_authoritative_cloud_pull');
    const preserved = {};
    try{
      LOCAL_ONLY_KEYS.forEach(key => {
        const value = localStorage.getItem(key);
        if(value !== null) preserved[key] = value;
      });
      const cloud = pruneDeletedProtocolData({...(cloudData || {})});
      const cloudResetAt = Date.parse(cloud.chncak_official_reset_at || '') || 0;
      const localResetAt = Date.parse(localStorage.getItem('chncak_official_reset_at') || '') || 0;
      if(cloudResetAt > localResetAt){
        RESET_REMOVE_KEYS.forEach(key => {
          cloud[key] = key === 'chncak_programme' ? '{}' : '[]';
        });
      }
      DATA_KEYS.forEach(key => localStorage.removeItem(key));
      for(let i = localStorage.length - 1; i >= 0; i--){
        const key = localStorage.key(i);
        if(key && key.startsWith('chncak_') && !LOCAL_ONLY_KEYS.has(key)){
          localStorage.removeItem(key);
        }
      }
      Object.keys(cloud).forEach(key => {
        if(!LOCAL_ONLY_KEYS.has(key) && cloud[key] !== undefined && cloud[key] !== null){
          localStorage.setItem(key, cloud[key]);
        }
      });
      Object.keys(preserved).forEach(key => localStorage.setItem(key, preserved[key]));
      localStorage.setItem(LOCAL_META_KEY, new Date().toISOString());
      localDirty = false;
      localStorage.removeItem(LOCAL_DIRTY_KEY);
      refreshViews();
      return collectLocalData();
    } finally {
      suppressLocalTracking = false;
    }
  }

  function collectOfficialEmptyData(){
    const data = {};
    const catalog = localStorage.getItem('chncak_catalog');
    const medecins = localStorage.getItem('chncak_medecins');
    const responsables = localStorage.getItem('chncak_responsables');
    const config = localStorage.getItem('chncak_prog_config');
    const resetAt = localStorage.getItem('chncak_official_reset_at') || new Date().toISOString();
    if(catalog !== null) data.chncak_catalog = catalog;
    if(medecins !== null) data.chncak_medecins = medecins;
    if(responsables !== null) data.chncak_responsables = responsables;
    if(config !== null) data.chncak_prog_config = config;
    data.chncak_official_reset_at = resetAt;
    RESET_REMOVE_KEYS.forEach(key => {
      data[key] = key === 'chncak_programme' ? '{}' : '[]';
    });
    return data;
  }

  function applyCloudData(cloudData){
    suppressLocalTracking = true;
    const cloudResetAt = Date.parse(cloudData?.chncak_official_reset_at || '') || 0;
    const localResetAt = Date.parse(localStorage.getItem('chncak_official_reset_at') || '') || 0;
    try{
      if(cloudResetAt > localResetAt) {
        resetLocalOfficialData();
        cloudData = {...cloudData};
        RESET_REMOVE_KEYS.forEach(key => {
          cloudData[key] = key === 'chncak_programme' ? '{}' : '[]';
        });
      }
      const localData = collectLocalData();
      const merged = pruneDeletedProtocolData({...cloudData});
      Object.keys(localData).forEach(key => {
        merged[key] = mergeValues(key, cloudData?.[key], localData[key]);
      });
      const pruned = pruneDeletedProtocolData(merged);
      Object.keys(pruned).forEach(key => {
        if(pruned[key] !== undefined && pruned[key] !== null) localStorage.setItem(key, pruned[key]);
      });
      localStorage.setItem(LOCAL_META_KEY, new Date().toISOString());
      refreshViews();
      return pruned;
    } finally {
      suppressLocalTracking = false;
    }
  }

  function refreshViews(){
    try { window.renderDashboard?.(); } catch(e) {}
    try { window.renderStats?.(); } catch(e) {}
    try { window.renderSuivi?.(); } catch(e) {}
    try { window.renderBiologie?.(); } catch(e) {}
    try { window.renderPatientsList?.(); } catch(e) {}
    try { window.renderRdvPage?.(); } catch(e) {}
    try { window.renderOkChimio?.(); } catch(e) {}
  }

  function resetLocalOfficialData(){
    RESET_REMOVE_KEYS.forEach(key => localStorage.removeItem(key));
    for(let i = localStorage.length - 1; i >= 0; i--){
      const key = localStorage.key(i);
      if(key && key.startsWith('chncak_') && !RESET_KEEP_KEYS.has(key) && !key.includes('catalog')){
        localStorage.removeItem(key);
      }
    }
    refreshViews();
  }

  function client(){
    if(!window.supabase?.createClient) return null;
    if(!window.chimioproSupabaseClient){
      window.chimioproSupabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession:true, autoRefreshToken:true }
      });
    }
    return window.chimioproSupabaseClient;
  }

  async function session(){
    const sb = client();
    if(!sb) return null;
    const { data } = await sb.auth.getSession();
    return data?.session || null;
  }

  async function requireSession(){
    const current = await session();
    if(!current) throw new Error('Connexion cloud requise.');
    return current;
  }

  async function signIn(email, password){
    const sb = client();
    if(!sb) throw new Error('Supabase non charge. Verifiez la connexion internet.');
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if(error) throw error;
    await setupRealtime();
    updateCloudUi(data.session?.user?.email || email);
    return data.session;
  }

  async function signOut(){
    const sb = client();
    if(!sb) return;
    await sb.auth.signOut();
    updateCloudUi('');
  }

  async function loadCloudSnapshot(){
    const sb = client();
    await requireSession();
    const { data, error } = await sb
      .from('app_settings')
      .select('value, updated_at')
      .eq('key', SNAPSHOT_KEY)
      .maybeSingle();
    if(error) throw error;
    return data?.value || null;
  }

  async function saveCloudSnapshot(data){
    const sb = client();
    const current = await requireSession();
    const value = {
      version: 1,
      updatedAt: new Date().toISOString(),
      updatedBy: current.user.email || current.user.id,
      deviceId: getDeviceId(),
      data
    };
    const { error } = await sb
      .from('app_settings')
      .upsert({ key: SNAPSHOT_KEY, value, updated_at: new Date().toISOString() }, { onConflict:'key' });
    if(error) throw error;
    localStorage.setItem(LOCAL_META_KEY, value.updatedAt);
    updateCloudUi(current.user.email || '');
    return value;
  }

  async function resetCloudSnapshot(){
    await saveCloudSnapshot(collectOfficialEmptyData());
  }

  let autoTimer = null;
  function scheduleCloudPush(){
    if(suppressLocalTracking) return;
    localDirty = true;
    localStorage.setItem(LOCAL_DIRTY_KEY, '1');
    if(!window.chimioproCloudReady) return;
    clearTimeout(autoTimer);
    autoTimer = setTimeout(() => {
      window.chimioproCloudSync(true).catch(err => notify('Sync cloud echouee: ' + err.message, 'error'));
    }, 2500);
  }

  function patchLocalStorage(){
    if(window.chimioproLocalStoragePatched) return;
    window.chimioproLocalStoragePatched = true;
    const nativeSet = Storage.prototype.setItem;
    const nativeRemove = Storage.prototype.removeItem;
    Storage.prototype.setItem = function(key, value){
      const out = nativeSet.apply(this, arguments);
      if(String(key) === LOCAL_DIRTY_KEY || String(key) === LOCAL_META_KEY || String(key) === CLOUD_ERROR_KEY) return out;
      if(String(key).startsWith('chncak_') || DATA_KEYS.includes(key)) scheduleCloudPush();
      return out;
    };
    Storage.prototype.removeItem = function(key){
      const out = nativeRemove.apply(this, arguments);
      if(String(key) === LOCAL_DIRTY_KEY || String(key) === LOCAL_META_KEY || String(key) === CLOUD_ERROR_KEY) return out;
      if(String(key).startsWith('chncak_') || DATA_KEYS.includes(key)) scheduleCloudPush();
      return out;
    };
  }

  async function setupRealtime(){
    const sb = client();
    const current = await session();
    if(!sb || !current || window.chimioproRealtimeReady) return;
    window.chimioproRealtimeReady = true;
    sb.channel('app_settings_snapshot')
      .on('postgres_changes', {event:'UPDATE', schema:'public', table:'app_settings', filter:`key=eq.${SNAPSHOT_KEY}`}, payload => {
        const value = payload.new?.value;
        if(!value || value.deviceId === getDeviceId()) return;
        if(localDirty) cloudSync(true).catch(err => console.warn('Fusion cloud apres modification locale echouee:', err.message));
        else applyCloudAuthoritativeData(value.data || {});
        notify('Donnees cloud synchronisees.', 'success');
      })
      .subscribe();
  }

  async function cloudPull(silent){
    const snap = await loadCloudSnapshot();
    if(!snap?.data){
      if(!silent) notify('Aucune sauvegarde cloud pour le moment.', 'info');
      return;
    }
    applyCloudAuthoritativeData(snap.data);
    if(!silent) notify('Donnees cloud recuperees. Les anciennes donnees locales ont ete sauvegardees puis remplacees par Supabase.', 'success');
  }

  async function cloudPush(silent){
    await saveCloudSnapshot(collectLocalData());
    localDirty = false;
    localStorage.removeItem(LOCAL_DIRTY_KEY);
    if(!silent) notify('Donnees locales envoyees vers Supabase.', 'success');
  }

  function localCurrentUser(){
    try{ return JSON.parse(localStorage.getItem('chncak_currentUser') || '{}') || {}; }
    catch(_){ return {}; }
  }

  function isCloudAdmin(){
    const user = localCurrentUser();
    const role = String(user.role || '').toLowerCase();
    const username = String(user.username || '').toLowerCase();
    return role === 'admin' || username === 'admin';
  }

  function refreshCloudRoleUi(){
    const panel = document.getElementById('cloud-sync-panel');
    if(!panel) return;
    const admin = isCloudAdmin();
    panel.classList.toggle('cloud-admin', admin);
    panel.querySelectorAll('[data-cloud-admin-only]').forEach(btn => {
      btn.style.display = admin ? '' : 'none';
    });
  }

  function stopAutoSync(){
    if(autoSyncTimer) clearInterval(autoSyncTimer);
    autoSyncTimer = null;
  }

  function startAutoSync(){
    stopAutoSync();
    autoSyncTimer = setInterval(async () => {
      if(!window.chimioproCloudReady) return;
      try{ await cloudSync(true); }
      catch(e){ console.warn('Synchronisation automatique echouee:', e.message); }
    }, AUTO_SYNC_INTERVAL_MS);
  }

  async function cloudSync(silent){
    const snap = await loadCloudSnapshot();
    if(localDirty){
      const merged = snap?.data ? applyCloudData(snap.data) : collectLocalData();
      await saveCloudSnapshot(merged);
      localDirty = false;
      localStorage.removeItem(LOCAL_DIRTY_KEY);
      if(!silent) notify('Synchronisation cloud terminee. Modifications envoyees.', 'success');
      return;
    }
    if(snap?.data){
      applyCloudAuthoritativeData(snap.data);
      if(!silent) notify('Donnees cloud recuperees.', 'success');
      return;
    }
    await saveCloudSnapshot(collectLocalData());
    if(!silent) notify('Premier snapshot cloud cree.', 'success');
  }

  function updateCloudUi(email){
    const panel = document.getElementById('cloud-sync-panel');
    const status = document.getElementById('cloud-sync-status');
    if(!panel || !status) return;
    const last = localStorage.getItem(LOCAL_META_KEY);
    const lastError = localStorage.getItem(CLOUD_ERROR_KEY);
    if(email){
      status.innerHTML = `Connecte: <b>${esc(email)}</b>${last ? `<br><small>Derniere sync: ${new Date(last).toLocaleString('fr-FR')}</small>` : ''}<br><small>Synchro automatique toutes les 30 secondes.</small>${lastError ? `<br><small style="color:#C0392B">Derniere erreur: ${esc(lastError)}</small>` : ''}`;
      panel.classList.add('cloud-connected');
    } else {
      status.textContent = 'Non connecte au cloud';
      panel.classList.remove('cloud-connected');
    }
    refreshCloudRoleUi();
  }

  function installCloudUi(){
    if(document.getElementById('cloud-sync-panel')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="cloud-sync-panel" class="cloud-sync-panel no-print">
        <button id="cloud-sync-toggle" type="button" onclick="toggleCloudSyncPanel()">Cloud</button>
        <div id="cloud-sync-body">
          <div id="cloud-sync-status">Non connecte au cloud</div>
          <div class="cloud-actions">
            <button type="button" data-cloud-admin-only onclick="chimioproCloudSync()">Synchroniser</button>
            <button type="button" data-cloud-admin-only onclick="chimioproCloudPull()">Recuperer</button>
            <button type="button" data-cloud-admin-only onclick="chimioproCloudPush()">Envoyer</button>
            <button type="button" data-cloud-admin-only onclick="chimioproCloudLogout()">Quitter</button>
            <button type="button" data-cloud-admin-only class="danger" onclick="chimioproOfficialReset()">Initialisation officielle</button>
          </div>
        </div>
      </div>
    `);
    updateCloudUi('');
  }

  window.toggleCloudSyncPanel = function(){
    document.getElementById('cloud-sync-panel')?.classList.toggle('open');
  };

  window.chimioproCloudLogin = async function(){
    const email = document.getElementById('cloud-email')?.value?.trim();
    const password = document.getElementById('cloud-password')?.value || '';
    if(!email || !password) return alert('Renseigner email et mot de passe Supabase.');
    try{
      await signIn(email, password);
      window.chimioproCloudReady = true;
      patchLocalStorage();
      startAutoSync();
      await cloudSync(true);
    } catch(e){
      alert('Connexion cloud impossible: ' + e.message);
    }
  };

  window.chimioproCloudRefreshSession = async function(){
    const current = await session();
    if(current){
      window.chimioproCloudReady = true;
      patchLocalStorage();
      updateCloudUi(current.user.email || '');
      await setupRealtime();
      await cloudSync(true);
      startAutoSync();
      return current;
    }
    window.chimioproCloudReady = false;
    updateCloudUi('');
    stopAutoSync();
    return null;
  };

  window.chimioproCloudLogout = async function(){
    if(!isCloudAdmin()) return alert('Deconnexion cloud reservee au compte admin.');
    await signOut();
    window.chimioproCloudReady = false;
    stopAutoSync();
    notify('Deconnecte du cloud.', 'info');
  };

  window.chimioproCloudPull = async function(silent){
    try{
      await cloudPull(Boolean(silent));
      localStorage.removeItem(CLOUD_ERROR_KEY);
      updateCloudUi((await session())?.user?.email || '');
    }
    catch(e){
      localStorage.setItem(CLOUD_ERROR_KEY, e.message || String(e));
      updateCloudUi((await session().catch(() => null))?.user?.email || '');
      if(!silent) alert('Recuperation cloud impossible: ' + e.message);
      else throw e;
    }
  };

  window.chimioproCloudPush = async function(silent){
    try{
      await cloudPush(Boolean(silent));
      localStorage.removeItem(CLOUD_ERROR_KEY);
      updateCloudUi((await session())?.user?.email || '');
    }
    catch(e){
      localStorage.setItem(CLOUD_ERROR_KEY, e.message || String(e));
      updateCloudUi((await session().catch(() => null))?.user?.email || '');
      if(!silent) alert('Envoi cloud impossible: ' + e.message);
      else throw e;
    }
  };

  window.chimioproCloudSync = async function(silent){
    try{
      await cloudSync(Boolean(silent));
      localStorage.removeItem(CLOUD_ERROR_KEY);
      updateCloudUi((await session())?.user?.email || '');
    }
    catch(e){
      localStorage.setItem(CLOUD_ERROR_KEY, e.message || String(e));
      updateCloudUi((await session().catch(() => null))?.user?.email || '');
      if(!silent) alert('Synchronisation cloud impossible: ' + e.message);
      else throw e;
    }
  };

  window.chimioproOfficialReset = async function(){
    if(!isCloudAdmin()) return alert('Initialisation reservee au compte admin.');
    const code = prompt('Code admin 4 chiffres pour initialisation officielle :');
    if(code === null) return;
    if(code !== ADMIN_CODE) return alert('Code incorrect.');
    if(!confirm('Cette action efface les donnees de test locales et cloud, mais garde le catalogue pharmacie. Continuer ?')) return;
    const phrase = prompt('Tapez INITIALISER pour confirmer definitivement :');
    if(phrase !== 'INITIALISER') return alert('Confirmation annulee.');
    try{
      await requireSession();
      localStorage.setItem('chncak_official_reset_at', new Date().toISOString());
      resetLocalOfficialData();
      await resetCloudSnapshot();
      localStorage.setItem(LOCAL_META_KEY, new Date().toISOString());
      notify('Initialisation officielle terminee. Catalogue conserve.', 'success');
      alert('Initialisation officielle terminee. Le catalogue pharmacie est conserve.');
    } catch(e){
      resetLocalOfficialData();
      alert('Donnees locales remises a zero, mais nettoyage cloud impossible: ' + e.message);
    }
  };

  document.addEventListener('DOMContentLoaded', async () => {
    installCloudUi();
    patchLocalStorage();
    window.addEventListener('focus', () => {
      if(window.chimioproCloudReady) cloudSync(true).catch(err => console.warn('Synchronisation au focus echouee:', err.message));
    });
    document.addEventListener('visibilitychange', () => {
      if(!document.hidden && window.chimioproCloudReady) cloudSync(true).catch(err => console.warn('Synchronisation au retour onglet echouee:', err.message));
    });
    try{
      await window.chimioproCloudRefreshSession();
    } catch(e){
      console.warn('Cloud non initialise:', e.message);
    }
  });
})();
