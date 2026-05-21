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
      const value = localStorage.getItem(key);
      if(value !== null) data[key] = value;
    });
    for(let i = 0; i < localStorage.length; i++){
      const key = localStorage.key(i);
      if(key && key.startsWith('chncak_') && !(key in data)){
        data[key] = localStorage.getItem(key);
      }
    }
    return data;
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
    const cloudResetAt = Date.parse(cloudData?.chncak_official_reset_at || '') || 0;
    const localResetAt = Date.parse(localStorage.getItem('chncak_official_reset_at') || '') || 0;
    if(cloudResetAt > localResetAt) {
      resetLocalOfficialData();
      cloudData = {...cloudData};
      RESET_REMOVE_KEYS.forEach(key => {
        cloudData[key] = key === 'chncak_programme' ? '{}' : '[]';
      });
    }
    const localData = collectLocalData();
    const merged = {...cloudData};
    Object.keys(localData).forEach(key => {
      merged[key] = mergeValues(key, cloudData?.[key], localData[key]);
    });
    Object.keys(merged).forEach(key => {
      if(merged[key] !== undefined && merged[key] !== null) localStorage.setItem(key, merged[key]);
    });
    localStorage.setItem(LOCAL_META_KEY, new Date().toISOString());
    refreshViews();
    return merged;
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
    if(!window.chimioproCloudReady) return;
    clearTimeout(autoTimer);
    autoTimer = setTimeout(() => {
      window.chimioproCloudPush(true).catch(err => notify('Sync cloud echouee: ' + err.message, 'error'));
    }, 2500);
  }

  function patchLocalStorage(){
    if(window.chimioproLocalStoragePatched) return;
    window.chimioproLocalStoragePatched = true;
    const nativeSet = Storage.prototype.setItem;
    const nativeRemove = Storage.prototype.removeItem;
    Storage.prototype.setItem = function(key, value){
      const out = nativeSet.apply(this, arguments);
      if(String(key).startsWith('chncak_') || DATA_KEYS.includes(key)) scheduleCloudPush();
      return out;
    };
    Storage.prototype.removeItem = function(key){
      const out = nativeRemove.apply(this, arguments);
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
        applyCloudData(value.data || {});
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
    const merged = applyCloudData(snap.data);
    await saveCloudSnapshot(merged);
    if(!silent) notify('Donnees cloud recuperees et fusionnees.', 'success');
  }

  async function cloudPush(silent){
    await saveCloudSnapshot(collectLocalData());
    if(!silent) notify('Donnees locales envoyees vers Supabase.', 'success');
  }

  async function cloudSync(){
    const snap = await loadCloudSnapshot();
    const merged = snap?.data ? applyCloudData(snap.data) : collectLocalData();
    await saveCloudSnapshot(merged);
    notify('Synchronisation cloud terminee.', 'success');
  }

  function updateCloudUi(email){
    const panel = document.getElementById('cloud-sync-panel');
    const status = document.getElementById('cloud-sync-status');
    if(!panel || !status) return;
    const last = localStorage.getItem(LOCAL_META_KEY);
    if(email){
      status.innerHTML = `Connecte: <b>${esc(email)}</b>${last ? `<br><small>Derniere sync: ${new Date(last).toLocaleString('fr-FR')}</small>` : ''}`;
      panel.classList.add('cloud-connected');
    } else {
      status.textContent = 'Non connecte au cloud';
      panel.classList.remove('cloud-connected');
    }
  }

  function installCloudUi(){
    if(document.getElementById('cloud-sync-panel')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="cloud-sync-panel" class="cloud-sync-panel no-print">
        <button id="cloud-sync-toggle" type="button" onclick="toggleCloudSyncPanel()">Cloud</button>
        <div id="cloud-sync-body">
          <div id="cloud-sync-status">Non connecte au cloud</div>
          <input id="cloud-email" type="email" placeholder="Email Supabase">
          <input id="cloud-password" type="password" placeholder="Mot de passe">
          <div class="cloud-actions">
            <button type="button" onclick="chimioproCloudLogin()">Connexion</button>
            <button type="button" onclick="chimioproCloudSync()">Synchroniser</button>
            <button type="button" onclick="chimioproCloudPull()">Recuperer</button>
            <button type="button" onclick="chimioproCloudPush()">Envoyer</button>
            <button type="button" onclick="chimioproCloudLogout()">Quitter</button>
            <button type="button" class="danger" onclick="chimioproOfficialReset()">Initialisation officielle</button>
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
      await cloudSync();
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
      return current;
    }
    window.chimioproCloudReady = false;
    updateCloudUi('');
    return null;
  };

  window.chimioproCloudLogout = async function(){
    await signOut();
    window.chimioproCloudReady = false;
    notify('Deconnecte du cloud.', 'info');
  };

  window.chimioproCloudPull = async function(silent){
    try{ await cloudPull(Boolean(silent)); }
    catch(e){ alert('Recuperation cloud impossible: ' + e.message); }
  };

  window.chimioproCloudPush = async function(silent){
    try{ await cloudPush(Boolean(silent)); }
    catch(e){ if(!silent) alert('Envoi cloud impossible: ' + e.message); else throw e; }
  };

  window.chimioproCloudSync = async function(){
    try{ await cloudSync(); }
    catch(e){ alert('Synchronisation cloud impossible: ' + e.message); }
  };

  window.chimioproOfficialReset = async function(){
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
    try{
      await window.chimioproCloudRefreshSession();
    } catch(e){
      console.warn('Cloud non initialise:', e.message);
    }
  });
})();
