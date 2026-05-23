/* ============================================================
   CORRECTIONS FINALES DEMANDEES - CHIMIOPRO
   Charge en dernier pour stabiliser les vues critiques.
============================================================ */
(function(){
  const DEFAULT_CODE_ADMIN = '2026';
  const ADMIN_CODE_KEY = 'chncak_admin_code';
  const ADMIN_SIGNUP_KEY = 'chncak_allow_admin_signup';
  const VALIDATION_EMAIL = 'onco.chn.cak@gmail.com';
  const STAT_MED_RESET_KEY = 'chncak_stats_medicaments_reset_after';
  const STAT_BLOCK_RESET_KEY = 'chncak_stats_blocs_reset_after';
  const RESTORED_PROTOCOL_KEY = 'chncak_restored_protocol_lock';
  const CATALOG_IMPORT_BACKUP_KEY = 'chncak_catalog_backup_before_import';
  const STORAGE = {
    patients: 'chncak_patients',
    rdv: 'chncak_rdv',
    suivi: 'chncak_suivi',
    biologie: 'chncak_biologie',
    catalog: 'chncak_catalog',
    sorties: 'chncak_sorties',
    historique: 'chncak_historique',
    okchimio: 'chncak_protocols',
    transfusion: 'chncak_transfusion',
    audit: 'chncak_audit_log'
  };

  function getAdminCode(){
    return localStorage.getItem(ADMIN_CODE_KEY) || DEFAULT_CODE_ADMIN;
  }

  function adminSignupAllowed(){
    return localStorage.getItem(ADMIN_SIGNUP_KEY) === '1';
  }

  const readJson = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(e){ return fallback; }
  };
  const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const norm = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const val = (...values) => {
    const found = values.find(v => v !== undefined && v !== null && String(v).trim() !== '');
    return found === undefined ? '' : found;
  };
  const patientName = p => `${val(p?.prenom)} ${val(p?.nom)}`.trim() || val(p?.patientName, p?.patient, p?.name);
  const patientCode = p => val(p?.codegratuite, p?.codeGratuite, p?.code, p?.dossier, p?.id);
  const patientShortCode = p => val(p?.dossier, p?.numeroDossier, p?.codegratuite, p?.codeGratuite, p?.code, p?.id);
  const patientBarcode = p => val(p?.codeBarre, p?.codebarre, p?.codegratuite, p?.codeGratuite, p?.code, p?.dossier);
  const todayIso = () => new Date().toISOString().slice(0, 10);
  const CODE_GRATUITE_COUNTER_KEY = 'chncak_code_gratuite_counter';
  const LAST_PROTOCOL_PATIENT_KEY = 'chncak_last_protocol_patient';

  function codeYearFromDate(value){
    const d = value ? new Date(value) : new Date();
    const year = Number.isFinite(d.getTime()) ? d.getFullYear() : new Date().getFullYear();
    return String(year).slice(-2);
  }

  function codeSexLetter(value){
    const n = norm(value);
    if(n.startsWith('f')) return 'F';
    if(n.startsWith('m')) return 'M';
    return 'X';
  }

  function parseCodeGratuiteSequence(code){
    const match = String(code || '').trim().match(/^(\d+)[A-Za-z]\d{2}$/);
    return match ? Number(match[1]) : 0;
  }

  function codeGratuiteFrom(seq, sexe, dateValue){
    const n = Number(seq);
    if(!n || n < 1) return '';
    return `${n}${codeSexLetter(sexe)}${codeYearFromDate(dateValue)}`;
  }

  function allStoredCodeGratuiteValues(){
    const keys = [
      STORAGE.patients,
      STORAGE.rdv,
      STORAGE.historique,
      STORAGE.okchimio,
      'chncak_okchimio',
      'chncak_hematologie_patients',
      'chncak_hematologie_sorties'
    ];
    const out = [];
    keys.forEach(key => {
      const rows = readJson(key, []);
      if(!Array.isArray(rows)) return;
      rows.forEach(item => {
        out.push(val(item?.codegratuite, item?.codeGratuite, item?.code, item?.patient?.codegratuite, item?.patient?.codeGratuite));
      });
    });
    return out.filter(Boolean);
  }

  function patientTreatmentKey(item){
    const p = item?.patient || item || {};
    const code = val(p.codegratuite, p.codeGratuite, p.code, item?.codegratuite, item?.codeGratuite, item?.code);
    if(code) return `code:${norm(code)}`;
    const dossier = val(p.dossier, p.numeroDossier, item?.dossier, item?.numeroDossier);
    const proto = val(item?.protoId, p.protoId, item?.protocole, item?.protocolName, p.protocole, p.proto);
    if(dossier) return `dossier:${norm(dossier)}|${norm(proto)}`;
    return `name:${norm(patientName(p) || patientName(item))}|${norm(proto)}`;
  }

  function dedupeByPatientTreatment(list){
    const seen = new Set();
    return (Array.isArray(list) ? list : []).filter(item => {
      const key = patientTreatmentKey(item);
      if(!key || seen.has(key)) return false;
      seen.add(key);
      item = {
        ...item,
        qteService: Number(val(item.qteService, item.stockService, item.qteStock, item.stock, 0)),
        qteCentral: Number(val(item.qteCentral, item.stockCentral, 0))
      };
      item.qteStock = item.qteService;
      return true;
    });
  }

  function dedupeSorties(list){
    const seen = new Set();
    return (Array.isArray(list) ? list : []).filter(item => {
      const key = val(item?.id, `${patientTreatmentKey(item)}|${val(item?.dateTs, item?.date)}|${val(item?.source)}`);
      if(seen.has(String(key))) return false;
      seen.add(String(key));
      return true;
    });
  }

  function dedupeRdv(list){
    const seen = new Set();
    return (Array.isArray(list) ? list : []).filter(item => {
      const key = val(item?.id, `${patientTreatmentKey(item)}|${val(item?.dateRdv, item?.date)}`);
      if(seen.has(String(key))) return false;
      seen.add(String(key));
      return true;
    });
  }

  function activeDrugDoseRows(proto, patient){
    const grouped = new Map();
    (proto?.drugs || [])
      .filter(d => !d.t && !isSupportOnlyDrug(d.name) && (d.mgm2 || d.mgkg || d.avastin || d.carbo || typeof d.fix === 'number'))
      .forEach(drug => {
        const dose = doseForDrug(drug, patient);
        const alias = catalogAliasKey(drug.name);
        if(!dose) return;
        const row = grouped.get(alias) || {name: drug.name, dose: 0, sourceNames: []};
        row.dose += Number(dose || 0);
        row.sourceNames.push(drug.name);
        grouped.set(alias, row);
      });
    return Array.from(grouped.values()).map(row => {
      const item = findCatalogItem(row.name, readJson(STORAGE.catalog, []));
      return {...row, name: val(item?.name, row.name)};
    });
  }

  function dedupeDrugDoseRows(rows){
    const grouped = new Map();
    (Array.isArray(rows) ? rows : []).forEach(row => {
      const alias = catalogAliasKey(row?.name);
      if(!alias) return;
      const existing = grouped.get(alias);
      if(existing){
        existing.dose += Number(row.dose || 0);
        existing.sourceNames = [...new Set([...(existing.sourceNames || []), ...(row.sourceNames || []), row.name].filter(Boolean))];
      } else {
        grouped.set(alias, {...row, dose:Number(row.dose || 0), sourceNames:[...(row.sourceNames || []), row.name].filter(Boolean)});
      }
    });
    return Array.from(grouped.values());
  }

  function reliquatFlaconsFromCalc(calc){
    const sizes = (calc?.flacons || []).map(Number).filter(Boolean);
    const largest = sizes.length ? Math.max(...sizes) : 0;
    if(!largest) return 0;
    return Math.round((Number(calc.reliquat || 0) / largest) * 100) / 100;
  }

  function normalizeOkStatus(item){
    const raw = norm(val(item?.statut, item?.status, 'En attente'));
    if(raw.includes('refus')) return 'refuse';
    if(raw.includes('valid') || raw.includes('valide')) return 'valide';
    return 'attente';
  }

  function getOkChimioList(){
    const native = typeof getOkChimio === 'function' ? getOkChimio() : [];
    const merged = [...readJson(STORAGE.okchimio, []), ...readJson('chncak_okchimio', []), ...(Array.isArray(native) ? native : [])];
    return dedupeByPatientTreatment(merged).map(ensureOkChimioId);
  }

  function saveOkChimioList(list){
    const clean = dedupeByPatientTreatment(list).map(ensureOkChimioId);
    if(typeof saveOkChimio === 'function') saveOkChimio(clean);
    writeJson(STORAGE.okchimio, clean);
    writeJson('chncak_okchimio', clean);
    return clean;
  }

  function ensureOkChimioId(item){
    if(!item) return item;
    const key = patientTreatmentKey(item);
    return {...item, id: val(item.id, key ? `ok_${key}` : `ok_${Date.now()}_${Math.random().toString(36).slice(2)}`)};
  }

  function findOkChimioEntry(list, id){
    const target = String(id);
    return (Array.isArray(list) ? list : []).findIndex(item => String(item.id) === target || patientTreatmentKey(item) === target || `ok_${patientTreatmentKey(item)}` === target);
  }

  function maxKnownCodeGratuiteSequence(){
    return allStoredCodeGratuiteValues().reduce((max, code) => Math.max(max, parseCodeGratuiteSequence(code)), 0);
  }

  function readCodeGratuiteCounter(){
    const raw = readJson(CODE_GRATUITE_COUNTER_KEY, {});
    const value = Number(raw?.value || raw?.global || 0);
    return {value: Math.max(value, maxKnownCodeGratuiteSequence(), 0), updatedAt: raw?.updatedAt || '', updatedBy: raw?.updatedBy || ''};
  }

  function writeCodeGratuiteCounter(value){
    const user = typeof currentUser === 'function' ? currentUser() : {};
    writeJson(CODE_GRATUITE_COUNTER_KEY, {
      value: Math.max(Number(value) || 0, maxKnownCodeGratuiteSequence(), 0),
      updatedAt: new Date().toISOString(),
      updatedBy: val(user.username, user.name, 'local')
    });
  }

  function codeGratuiteExists(code, ignoreCode){
    const c = String(code || '').trim();
    if(!c) return false;
    const ignored = String(ignoreCode || '').trim();
    return allStoredCodeGratuiteValues().some(item => String(item || '').trim() === c && (!ignored || String(item || '').trim() !== ignored));
  }

  function nextAvailableCodeGratuite(sexe, dateValue){
    let seq = readCodeGratuiteCounter().value + 1;
    let code = codeGratuiteFrom(seq, sexe, dateValue);
    let guard = 0;
    while(codeGratuiteExists(code) && guard < 200){
      seq += 1;
      code = codeGratuiteFrom(seq, sexe, dateValue);
      guard += 1;
    }
    return {seq, code};
  }

  function reserveCodeGratuite(code){
    const seq = parseCodeGratuiteSequence(code);
    if(seq) writeCodeGratuiteCounter(seq);
  }

  function setProtocolAutoCode(forceNew){
    const input = document.getElementById('codegratuite');
    if(!input || input.dataset.manual === '1') return input?.value || '';
    const seqInput = document.getElementById('num-seq');
    const sexe = document.getElementById('sexe')?.value || '';
    const dateValue = document.getElementById('date-protocole')?.value || todayIso();
    let seq = Number(seqInput?.value || parseCodeGratuiteSequence(input.value) || 0);
    let code = codeGratuiteFrom(seq, sexe, dateValue);
    if(!forceNew && parseCodeGratuiteSequence(input.value) && !seqInput?.value){
      code = input.value;
    }
    if(forceNew || !seq || !code){
      const next = nextAvailableCodeGratuite(sexe, dateValue);
      seq = next.seq;
      code = next.code;
    }
    if(seqInput){
      seqInput.value = seq;
      seqInput.readOnly = true;
      seqInput.dataset.auto = '1';
      seqInput.title = 'Numero attribue automatiquement et synchronise par le cloud.';
    }
    input.value = code;
    input.readOnly = true;
    input.dataset.auto = '1';
    return code;
  }

  function setHematologieAutoCode(forceNew){
    const input = document.getElementById('hema-code');
    if(!input || input.dataset.manual === '1') return input?.value || '';
    const sexe = document.getElementById('hema-sexe')?.value || '';
    const existingSeq = parseCodeGratuiteSequence(input.value);
    const existingAutoCode = existingSeq ? codeGratuiteFrom(existingSeq, sexe, todayIso()) : '';
    const next = forceNew || !existingSeq || codeGratuiteExists(existingAutoCode)
      ? nextAvailableCodeGratuite(sexe, todayIso())
      : {code: existingAutoCode, seq: existingSeq};
    input.value = next.code;
    input.readOnly = true;
    input.dataset.auto = '1';
    input.title = 'Code attribue automatiquement et synchronise par le cloud.';
    return next.code;
  }
  function protocolsList(){
    try {
      if(Array.isArray(PROTOCOLS)){
        window.PROTOCOLS = PROTOCOLS;
        for(let i = PROTOCOLS.length - 1; i >= 0; i--){
          if(!PROTOCOLS[i]) PROTOCOLS.splice(i, 1);
        }
        return PROTOCOLS;
      }
    } catch(e){}
    if(Array.isArray(window.PROTOCOLS)){
      for(let i = window.PROTOCOLS.length - 1; i >= 0; i--){
        if(!window.PROTOCOLS[i]) window.PROTOCOLS.splice(i, 1);
      }
    }
    return Array.isArray(window.PROTOCOLS) ? window.PROTOCOLS : [];
  }
  const protocolNameFor = p => {
    const protoId = val(p?.protoId, p?.protocolId, p?.protocoleId);
    const direct = val(p?.protocole, p?.proto, p?.protoName, p?.protocol, p?.protocolName, p?.chimio, p?.chimiotherapie);
    if(direct) return direct;
    return val(protocolsList().find(proto => proto.id === protoId)?.name, '-');
  };

  function slugify(text){
    return norm(text).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || ('proto_' + Date.now());
  }

  function canonicalDrugName(name){
    const raw = norm(name);
    if(raw.includes('epirub')) return 'ÉPIRUBICINE';
    if(raw.includes('cyclophosph')) return 'CYCLOPHOSPHAMIDE';
    if(raw.includes('trastuz') || raw.includes('herceptin')) return 'TRASTUZUMAB';
    if(raw.includes('bevaciz') || raw.includes('avastin')) return 'AVASTIN (Bévacizumab)';
    if(raw.includes('carboplat')) return 'CARBOPLATINE';
    if(raw.includes('gemcitab')) return 'GEMCITABINE';
    if(raw.includes('fluorouracile') || raw.includes('5-fu') || raw.includes('fluoro 5')) return '5-FLUOROURACILE';
    if(raw.includes('zometa') || raw.includes('zoledron') || raw.includes('zolédron')) return 'ZOMETA';
    if(raw.includes('irinotec')) return 'IRINOTÉCAN';
    if(raw.includes('capecitab')) return 'Capécitabine per os';
    if(raw.includes('vinorel') || raw.includes('navelbine')) return 'NAVELBINE';
    if(raw.includes('nacl') || raw.includes('na cl') || raw.includes('chlorure')) return 'NaCl 0.9%';
    if(raw.includes('glucose') || raw.includes('g5')) return 'G5%';
    return String(name || '').trim();
  }

  function defaultPreForProtocol(proto){
    const names = (proto?.drugs || []).map(d => norm(d.name || d.label)).join(' ');
    const items = new Set(['NFS plaquettes']);
    if(/cisplat|carbo|zometa|zoledron|méthotrexate|methotrexate|gemcitab/.test(names)) items.add('créatinine');
    if(/avastin|bevaciz/.test(names)){ items.add('TA'); items.add('protéinurie'); }
    if(/doxorub|epirub|trastuz|herceptin/.test(names)){ items.add('ECG'); items.add('FEVG'); }
    if(/irinotec|capecitab|5-fluoro|gemcitab/.test(names)) items.add('bilan hépatique');
    if(/zometa|zoledron/.test(names)){ items.add('calcémie'); items.add('bilan dentaire'); }
    return Array.from(items).join(', ');
  }

  const DEFAULT_PROTOCOL_REFERENCES = {
    xelox: 'Ontario Health/CCO et eviQ - CAPOX/XELOX colorectal; validation service CHNCAK.',
    ac60: 'eviQ et Ontario Health/CCO - doxorubicine cyclophosphamide dose-dense; validation service CHNCAK.',
    ecx: 'Ontario Health/CCO - protocole ECX; validation service CHNCAK.',
    folfox: 'Ontario Health/CCO - FOLFOX; validation service CHNCAK.',
    carbo_taxol: 'eviQ/BC Cancer - carboplatine paclitaxel; validation service CHNCAK.',
    gemcitabine: 'Ontario Health/CCO - gemcitabine; validation service CHNCAK.',
    gemox: 'Ontario Health/CCO - GEMOX gemcitabine oxaliplatine; validation service CHNCAK.',
    taxotere: 'Ontario Health/CCO - docetaxel; validation service CHNCAK.',
    xeliri: 'Ontario Health/CCO - XELIRI avec ou sans bevacizumab selon indication; validation service CHNCAK.',
    carbo_taxol175: 'eviQ/BC Cancer - carboplatine paclitaxel J21; validation service CHNCAK.',
    ac60_j21: 'eviQ et Ontario Health/CCO - AC doxorubicine cyclophosphamide J21; validation service CHNCAK.',
    map: 'eviQ MAP et NCI PDQ osteosarcome - methotrexate doxorubicine cisplatine; validation service CHNCAK.',
    folfiri: 'Ontario Health/CCO - FOLFIRI; validation service CHNCAK.',
    abvd: 'Ontario Health/CCO - ABVD Hodgkin; validation service CHNCAK.',
    bep: 'eviQ/Ontario Health - BEP bleomycine etoposide cisplatine; validation service CHNCAK.',
    chop: 'Ontario Health/CCO et eviQ - CHOP lymphome; validation service CHNCAK.',
    rchop: 'Ontario Health/CCO et eviQ - R-CHOP lymphome; validation service CHNCAK.',
    vip: 'eviQ/Ontario Health - VIP etoposide ifosfamide cisplatine; validation service CHNCAK.',
    mvac: 'BC Cancer/Ontario Health - MVAC cancer urothelial; validation service CHNCAK.',
    cddp_hebdo: 'eviQ - cisplatine hebdomadaire avec radiotherapie selon indication; validation service CHNCAK.',
    taxol_hebdo: 'eviQ/BC Cancer - paclitaxel hebdomadaire; validation service CHNCAK.',
    ec100: 'eviQ/BC Cancer - epirubicine cyclophosphamide; validation service CHNCAK.',
    herceptin: 'Ontario Health/CCO - trastuzumab monographie/protocole anti-HER2; validation service CHNCAK.',
    avastin_zometa: 'Monographies bevacizumab et acide zoledronique; association a valider par indication CHNCAK.',
    gem_avastin: 'Gemcitabine + bevacizumab selon indication; reference a confirmer par protocole valide CHNCAK.'
  };

  function defaultReferenceForProtocol(proto){
    const overrides = readJson('chncak_protocol_references', {});
    const id = String(proto?.id || '');
    if(overrides[id]) return overrides[id];
    if(DEFAULT_PROTOCOL_REFERENCES[id]) return DEFAULT_PROTOCOL_REFERENCES[id];
    const name = norm(proto?.name);
    const match = Object.entries(DEFAULT_PROTOCOL_REFERENCES).find(([key]) => name.includes(norm(key.replace(/_/g, ' '))) || name.includes(norm(key)));
    return match ? match[1] : 'A renseigner / validation service CHNCAK.';
  }

  function normalizeProtocolDrug(d){
    if(!d || typeof d !== 'object') return d;
    const out = {...d};
    if(out.t && !out.name) return out;
    out.name = canonicalDrugName(out.name || out.label);
    const calc = norm(val(out.calc, out.type_calcul));
    const base = norm(out.base);
    const coef = Number(val(out.coef, out.dose, out.val));
    if(calc && Number.isFinite(coef) && coef > 0){
      delete out.calc; delete out.coef; delete out.base;
      if(calc.includes('sc') || calc.includes('surface') || base.includes('m2')) out.mgm2 = coef;
      else if(calc.includes('poids') || calc.includes('kg')) out.mgkg = coef;
      else if(calc.includes('avastin') || norm(out.name).includes('avastin')) out.avastin = true;
      else if(calc.includes('carbo') || norm(out.name).includes('carboplatine')) out.carbo = true;
      else out.fix = coef;
    }
    if(norm(out.name).includes('avastin') && !out.mgkg && !out.avastin && Number.isFinite(coef) && coef > 0) out.mgkg = coef;
    if(out.name === 'ZOMETA' && !out.fix && Number.isFinite(coef) && coef > 0) out.fix = coef;
    out.unit = out.unit || (out.name === 'ZOMETA' ? 'mg' : 'mg');
    out.sol = val(out.sol, out.solvant, out.name === 'ZOMETA' ? '100 cc SSI 0.9%' : '');
    if(norm(out.name).includes('calcium 10')) out.sol = '250 cc SG5%';
    out.dur = val(out.dur, out.duree, out.name === 'ZOMETA' ? '15 mn' : '');
    out.ryt = val(out.ryt, out.jours, out.rythme, '');
    if(!out.oral && !out.t && (out.mgm2 || out.mgkg || out.fix || out.avastin || out.carbo)) out.hl = true;
    return out;
  }

  function normalizeProtocol(proto){
    if(!proto || typeof proto !== 'object') return proto;
    proto.id = val(proto.id, slugify(proto.name));
    proto.name = val(proto.name, proto.nom, proto.id).toUpperCase();
    proto.rythme = val(proto.rythme, proto.badge, 'J21');
    proto.badge = val(proto.badge, proto.rythme);
    proto.badgeClass = val(proto.badgeClass, proto.badge_class, proto.rythme.includes('28') ? 'b28' : proto.rythme.includes('14') ? 'b14' : 'b21');
    proto.drugs = (proto.drugs || []).map(normalizeProtocolDrug).filter(Boolean).sort((a,b) => Number(a.order || 0) - Number(b.order || 0));
    proto.pre = val(proto.pre, proto.bilan, defaultPreForProtocol(proto));
    proto.post = val(proto.post, proto.surveillance, 'Surveillance clinique et biologique selon protocole du service');
    proto.reference = val(readJson('chncak_protocol_references', {})[proto.id], proto.reference, proto.ref, proto.source, proto.bibliographie, defaultReferenceForProtocol(proto));
    return proto;
  }

  function normalizeAllProtocols(){
    const list = protocolsList();
    if(!Array.isArray(list) || !list.length) return;
    const deleted = new Set(readJson('chncak_deleted_protocols', []));
    for(let i = list.length - 1; i >= 0; i--){
      if(deleted.has(list[i]?.id)) list.splice(i, 1);
    }
    list.forEach(normalizeProtocol);
    const custom = readJson('chncak_custom_protocols', []);
    custom.forEach(proto => {
      const normalized = normalizeProtocol(proto);
      const idx = list.findIndex(p => p.id === normalized.id);
      if(idx >= 0) list[idx] = {...list[idx], ...normalized};
      else list.push(normalized);
    });
  }

  function askAdminCode(actionLabel, onOk){
    document.getElementById('secure-code-modal')?.remove();
    const wrap = document.createElement('div');
    wrap.id = 'secure-code-modal';
    wrap.innerHTML = `
      <div class="secure-code-backdrop"></div>
      <div class="secure-code-card" role="dialog" aria-modal="true">
        <h3>Code d'acces requis</h3>
        <p>${esc(actionLabel || 'Confirmer cette action')}</p>
        <input id="secure-code-input" type="password" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="****">
        <div class="secure-code-error" id="secure-code-error"></div>
        <div class="secure-code-actions">
          <button type="button" id="secure-code-cancel">Annuler</button>
          <button type="button" id="secure-code-confirm">Confirmer</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
    const close = () => wrap.remove();
    const input = document.getElementById('secure-code-input');
    const confirmBtn = document.getElementById('secure-code-confirm');
    const cancelBtn = document.getElementById('secure-code-cancel');
    const error = document.getElementById('secure-code-error');
    const submit = () => {
      if(input.value !== getAdminCode()){
        error.textContent = 'Code incorrect. Action annulee.';
        input.value = '';
        input.focus();
        return;
      }
      if(!confirm(`Confirmer definitivement : ${actionLabel} ?`)) return;
      close();
      if(typeof onOk === 'function') onOk();
    };
    confirmBtn.addEventListener('click', submit);
    cancelBtn.addEventListener('click', close);
    input.addEventListener('keydown', event => {
      if(event.key === 'Enter') submit();
      if(event.key === 'Escape') close();
    });
    setTimeout(() => input.focus(), 30);
  }

  window.askAdminCode = askAdminCode;

  function currentUser(){
    return readJson('chncak_currentUser', {});
  }

  function actorLabel(){
    const user = currentUser();
    return val(user.name, user.nomComplet, user.username, user.role, 'Utilisateur local');
  }

  function logAudit(action, target, details){
    const entry = {
      id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      dateTs: new Date().toISOString(),
      date: new Date().toLocaleString('fr-FR'),
      actor: actorLabel(),
      role: val(currentUser().role, ''),
      action: val(action, 'Action'),
      target: val(target, ''),
      details: val(details, '')
    };
    const list = readJson(STORAGE.audit, []);
    list.unshift(entry);
    writeJson(STORAGE.audit, list.slice(0, 1000));
    if(document.getElementById('maintenance-content')) renderAuditLogPanel();
  }
  window.logAudit = logAudit;

  function isAdminUser(){
    const user = currentUser();
    return norm(user.role) === 'admin' || norm(user.username) === 'admin';
  }

  function isPharmacienUser(){
    const user = currentUser();
    return norm(user.role) === 'pharmacien' || norm(user.username) === 'pharmacien';
  }

  function isInfirmierUser(){
    const user = currentUser();
    return norm(user.role) === 'infirmier' || norm(user.username) === 'infirmier';
  }

  function isBiologisteUser(){
    const user = currentUser();
    return norm(user.role) === 'biologiste' || norm(user.username) === 'biologiste';
  }

  function isSecretaireUser(){
    const user = currentUser();
    return norm(user.role) === 'secretaire' || norm(user.username) === 'secretaire';
  }

  function requireAdminAction(actionLabel, onOk){
    if(!isAdminUser()){
      alert('Action reservee au compte administrateur.');
      return;
    }
    askAdminCode(actionLabel, onOk);
  }

  window.setCodeGratuiteStart = function(){
    requireAdminAction('regler le numero de depart du Code Gratuite', () => {
      const currentNext = readCodeGratuiteCounter().value + 1;
      const answer = prompt('Numero sequentiel du prochain patient officiel ?', String(currentNext));
      if(answer === null) return;
      const next = Number(String(answer).replace(/[^\d]/g, ''));
      if(!Number.isFinite(next) || next < 1){
        alert('Numero invalide. Exemple : 1, 100 ou 155.');
        return;
      }
      const highestExisting = maxKnownCodeGratuiteSequence();
      writeJson(CODE_GRATUITE_COUNTER_KEY, {
        value: Math.max(0, next - 1),
        updatedAt: new Date().toISOString(),
        updatedBy: val(currentUser().username, currentUser().name, 'admin'),
        officialStart: next
      });
      localStorage.setItem('chncak_code_gratuite_official_start', String(next));
      setProtocolAutoCode(true);
      setHematologieAutoCode(true);
      logAudit('Depart code gratuite', `Prochain numero ${next}`, `Ancien prochain: ${currentNext}. Plus haut connu: ${highestExisting}.`);
      if(highestExisting >= next){
        alert(`Depart enregistre a ${next}. Attention : des donnees de test contiennent deja un numero jusqu'a ${highestExisting}. Apres initialisation officielle, le prochain code commencera bien a ${next}.`);
      } else {
        showToastSafe(`Prochain Code Gratuite regle sur ${next}.`, 'success');
      }
    });
  };

  function requirePharmacienAction(actionLabel, onOk){
    if(!isPharmacienUser()){
      alert('Action reservee au compte pharmacien.');
      return false;
    }
    if(typeof onOk === 'function') onOk();
    return true;
  }

  function showToastSafe(message, type){
    if(typeof showToast === 'function') showToast(message, type || 'info');
    else alert(message);
  }

  window.editProtocolReference = function(defaultNumber){
    requireAdminAction('modifier la reference scientifique', () => {
      normalizeAllProtocols();
      const list = protocolsList();
      const numberText = prompt('Numero du protocole a modifier :', defaultNumber || '');
      if(numberText === null) return;
      const idx = Number(numberText) - 1;
      const proto = list[idx];
      if(!proto){
        alert('Numero de protocole introuvable.');
        return;
      }
      const current = val(proto.reference, proto.ref, proto.source, defaultReferenceForProtocol(proto));
      const next = prompt(`Reference scientifique pour ${proto.name} :`, current);
      if(next === null) return;
      const refs = readJson('chncak_protocol_references', {});
      refs[proto.id] = next.trim() || 'A renseigner / validation service CHNCAK.';
      writeJson('chncak_protocol_references', refs);
      proto.reference = refs[proto.id];
      window.renderProtocolReferenceTable?.();
      if(typeof renderProtos === 'function') renderProtos();
      showToastSafe('Reference scientifique mise a jour.', 'success');
    });
  };

  function downloadTextFile(filename, content, type){
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], {type: type || 'text/plain;charset=utf-8'}));
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function officialPhotoStorageKey(slot){
    return slot === 'team' ? 'chncak_dashboard_team_photo' : `chncak_dashboard_photo_${slot}`;
  }

  function normalizeOfficialMedecin(m, index){
    const display = val(m?.name, `Dr ${val(m?.prenom)} ${val(m?.nom)}`.replace(/\s+/g, ' ').trim());
    const cleanDisplay = display.replace(/^Dr\s+/i, '').trim();
    const parts = cleanDisplay.split(/\s+/);
    return {
      id: val(m?.id, Date.now() + index),
      name: display,
      prenom: val(m?.prenom, parts.length > 1 ? parts.slice(0, -1).join(' ') : ''),
      nom: val(m?.nom, parts[parts.length - 1] || cleanDisplay),
      grade: val(m?.grade, m?.specialite, 'Oncologue'),
      specialite: val(m?.specialite, m?.grade, 'Oncologue'),
      contact: val(m?.contact),
      email: val(m?.email)
    };
  }

  function applyOfficialSiteData(){
    const official = window.CHIMIOPRO_OFFICIAL_DATA || {};
    const officialMeds = Array.isArray(official.medecins) ? official.medecins.map(normalizeOfficialMedecin) : [];
    if(officialMeds.length){
      const existing = readJson('chncak_medecins', []);
      const merged = [...existing];
      officialMeds.forEach(med => {
        const key = norm(val(med.name, `${med.prenom} ${med.nom}`));
        if(!merged.some(item => norm(val(item.name, `Dr ${val(item.prenom)} ${val(item.nom)}`)) === key || norm(`${val(item.prenom)} ${val(item.nom)}`) === norm(`${med.prenom} ${med.nom}`))){
          merged.push(med);
        }
      });
      if(merged.length !== existing.length || !existing.length) writeJson('chncak_medecins', merged);
    }
    const photos = official.photos || {};
    Object.entries(photos).forEach(([slot, src]) => {
      if(!src) return;
      const key = officialPhotoStorageKey(slot);
      if(!localStorage.getItem(key)) localStorage.setItem(key, src);
      if(slot === 'team'){
        if(!localStorage.getItem('dashboardTeamPhoto')) localStorage.setItem('dashboardTeamPhoto', src);
        if(!localStorage.getItem('teamPhoto')) localStorage.setItem('teamPhoto', src);
      }
    });
    if(Array.isArray(official.catalog) && official.catalog.length){
      const currentOfficialCatalogVersion = localStorage.getItem('chncak_official_catalog_version');
      if(currentOfficialCatalogVersion !== official.version){
        const cleanCatalog = cleanPharmacyCatalog(official.catalog);
        writeJson(STORAGE.catalog, cleanCatalog);
        localStorage.setItem('chncak_official_catalog_version', official.version || todayIso());
        try { if(Array.isArray(window.catalog)) window.catalog = cleanCatalog; } catch(e) {}
        try { if(typeof catalog !== 'undefined') catalog = cleanCatalog; } catch(e) {}
      }
    }
  }

  window.exportOfficialGitHubData = function(){
    requireAdminAction('exporter les medecins et photos pour GitHub', () => {
      const photos = {
        team: localStorage.getItem('chncak_dashboard_team_photo') || localStorage.getItem('dashboardTeamPhoto') || localStorage.getItem('teamPhoto') || '',
        directrice: localStorage.getItem('chncak_dashboard_photo_directrice') || '',
        oncologie: localStorage.getItem('chncak_dashboard_photo_oncologie') || '',
        pharmacie: localStorage.getItem('chncak_dashboard_photo_pharmacie') || '',
        surveillant: localStorage.getItem('chncak_dashboard_photo_surveillant') || ''
      };
      const payload = {
        version: new Date().toISOString().slice(0,10).replace(/-/g,''),
        medecins: readJson('chncak_medecins', []).map(normalizeOfficialMedecin),
        catalog: readJson(STORAGE.catalog, []),
        photos
      };
      const content = `(function(){\n  window.CHIMIOPRO_OFFICIAL_DATA = ${JSON.stringify(payload, null, 2)};\n})();\n`;
      downloadTextFile('site-official-data.js', content, 'text/javascript;charset=utf-8');
      logAudit('Export GitHub', 'Donnees officielles', `${payload.medecins.length} medecins, ${payload.catalog.length} medicaments, photos: ${Object.values(photos).filter(Boolean).length}`);
      showToastSafe('Fichier officiel exporte. Envoyez-le a Codex pour le fixer dans GitHub.', 'success');
    });
  };

  function openValidationEmail(data){
    const patient = data.patient || {};
    const subject = `Validation protocole ${val(data.protocole, data.protoName, '')} - ${val(patient.prenom, data.prenom)} ${val(patient.nom, data.nom)}`.trim();
    const body = [
      'Bonjour,',
      '',
      'Le protocole suivant a ete valide dans ChimioPro.',
      '',
      `Patient : ${val(patient.prenom, data.prenom)} ${val(patient.nom, data.nom)}`.trim(),
      `Dossier : ${val(patient.dossier, data.dossier, '-')}`,
      `Code gratuite : ${val(patient.codegratuite, data.codegratuite, '-')}`,
      `Protocole : ${val(data.protocole, data.protoName, '-')}`,
      `Cure : ${val(data.cure, data.cureNum, '-')}`,
      `Medecin : ${val(data.medecin, '-')}`,
      `Date validation : ${new Date().toLocaleString('fr-FR')}`,
      '',
      'Message genere automatiquement par ChimioPro.'
    ].join('\n');
    const mailto = `mailto:${VALIDATION_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  }

  function findProtocolByPatient(patient){
    const protoId = val(patient?.protoId, patient?.protocolId);
    const protoName = norm(val(patient?.proto, patient?.protocole, patient?.protoName));
    return protocolsList().find(p => p.id === protoId || norm(p.name) === protoName);
  }

  function doseForDrug(drug, patient){
    if(typeof getDose === 'function' && typeof selId !== 'undefined' && findProtocolByPatient(patient)?.id === selId){
      const dose = getDose(drug);
      return Number(dose?.val || 0);
    }
    const poids = Number(val(patient?.poids, patient?.weight, 0));
    const taille = Number(val(patient?.taille, patient?.height, 0));
    const surface = poids && taille ? Math.sqrt((poids * taille) / 3600) : 0;
    if(typeof drug.fix === 'number') return drug.fix;
    if(drug.mgm2 && surface){
      const dose = Math.round(Number(drug.mgm2) * surface);
      if(drug.oral && catalogAliasKey(drug.name) === 'capecitabine'){
        const dayNumbers = String(val(drug.dur, drug.ryt, '')).replace(/[^0-9]+/g, ' ').trim().split(/\s+/).map(Number).filter(Boolean);
        const days = dayNumbers.length ? Math.max(...dayNumbers) : 14;
        return dose * 2 * days;
      }
      return dose;
    }
    if(drug.mgkg && poids) return Math.round(Number(drug.mgkg) * poids);
    if(drug.avastin && poids) return Math.round(15 * poids);
    if(drug.carbo){
      const directDose = Number(val(patient?.carboDose, patient?.doseCarbo, patient?.carboplatineDose, 0));
      if(directDose) return Math.round(directDose);
      const auc = Number(val(drug.auc, typeof drug.carbo === 'number' ? drug.carbo : '', patient?.auc, 5)) || 5;
      const clcr = Number(val(patient?.clairance, patient?.clcr, patient?.gfr, 0));
      if(clcr) return Math.round(auc * (clcr + 25));
      if(poids) return Math.round(auc * (poids * 0.8 + 25));
    }
    return 0;
  }

  function calcDrugFlacons(name, dose){
    const catalog = cleanPharmacyCatalog(readJson(STORAGE.catalog, []));
    const item = findCatalogItem(name, catalog);
    const sizes = (item?.dosages || item?.flacons || []).map(Number).filter(Boolean).sort((a,b) => b-a);
    if(!item || !sizes.length || !dose) return null;
    let remaining = dose, totalMg = 0, flacons = [];
    while(remaining > 0){
      const size = sizes.find(s => s <= remaining) || sizes[sizes.length - 1];
      flacons.push(size);
      totalMg += size;
      remaining -= size;
    }
    return {drug:item, nbFlacons:flacons.length, flacons, totalMg, reliquat:Math.max(0, Math.round((totalMg - dose) * 10) / 10), stock:Number(val(item.qteService, item.stockService, item.qteStock, item.stock, 0))};
  }

  function confirmFlaconsByDosage(drugName, dose, calc){
    const sizes = (calc?.drug?.dosages || calc?.drug?.flacons || []).map(Number).filter(Boolean).sort((a,b) => b-a);
    if(!calc || sizes.length <= 1) return calc;
    const defaults = {};
    (calc.flacons || []).forEach(size => { defaults[size] = (defaults[size] || 0) + 1; });
    const defaultText = sizes.map(size => `${size}mg=${defaults[size] || 0}`).join('; ');
    const answer = prompt(`${drugName}\nDose calculee: ${dose} mg\nIndiquer les flacons utilises par dosage.\nExemple: ${defaultText}`, defaultText);
    if(answer === null) return null;
    const parsed = {};
    String(answer).split(/[;,]+/).forEach(part => {
      const match = part.trim().match(/(\d+(?:[.,]\d+)?)\s*(?:mg)?\s*[:=]\s*(\d+(?:[.,]\d+)?)/i);
      if(match) parsed[Number(match[1].replace(',', '.'))] = Number(match[2].replace(',', '.'));
    });
    const used = [];
    for(const size of sizes){
      const count = Number(parsed[size] ?? defaults[size] ?? 0);
      if(!Number.isFinite(count) || count < 0) return null;
      for(let i = 0; i < Math.floor(count); i++) used.push(size);
    }
    if(!used.length) return null;
    const totalMg = used.reduce((sum, size) => sum + size, 0);
    return {
      ...calc,
      nbFlacons: used.length,
      flacons: used,
      totalMg,
      reliquat: Math.max(0, Math.round((totalMg - dose) * 10) / 10)
    };
  }

  function catalogAliasKey(name){
    const raw = norm(name);
    if(!raw) return '';
    if(raw.includes('kytril') || raw.includes('granisetron')) return 'kytril';
    if(raw.includes('hydrocortisone')) return 'hydrocortisone';
    if(raw.includes('epirub')) return 'epirubicine';
    if(raw.includes('doxorub')) return 'doxorubicine';
    if(raw.includes('cyclophosph')) return 'cyclophosphamide';
    if(raw.includes('cisplatine hebdo')) return 'cisplatine';
    if(raw.includes('cisplat')) return 'cisplatine';
    if(raw.includes('carboplat')) return 'carboplatine';
    if(raw.includes('taxol hebdo')) return 'taxol';
    if(raw.includes('taxol') || raw.includes('paclitaxel')) return 'taxol';
    if(raw.includes('taxot') || raw.includes('docetax')) return 'taxotere';
    if(raw.includes('gemcitab')) return 'gemcitabine';
    if(raw.includes('irinotec')) return 'irinotecan';
    if(raw.includes('trastuz') || raw.includes('herceptin')) return 'trastuzumab';
    if(raw.includes('bevaciz') || raw.includes('avastin')) return 'avastin';
    if(raw.includes('zoledron') || raw.includes('zometa')) return 'zometa';
    if(raw.includes('fluorouracile') || raw.includes('5-fu')) return '5fu';
    if(raw.includes('leucovorine') || raw.includes('acide folinique') || raw.includes('folinate')) return 'leucovorine';
    if(raw.includes('methotrex')) return 'methotrexate';
    if(raw.includes('etopos')) return 'etoposide';
    if(raw.includes('bleomyc')) return 'bleomycine';
    if(raw.includes('capecitab')) return 'capecitabine';
    if(raw.includes('vincrist')) return 'vincristine';
    if(raw.includes('vinblast')) return 'vinblastine';
    if(raw.includes('vinorel') || raw.includes('navelbine')) return 'navelbine';
    if(raw.includes('dacarb')) return 'dacarbazine';
    if(raw.includes('ritux')) return 'rituximab';
    if(raw.includes('magnesium')) return 'support magnesium';
    if(raw.includes('calcium')) return 'support calcium';
    if(raw.includes('prednisone')) return 'support prednisone';
    if(raw.includes('nacl') || raw.includes('ssi') || raw.includes('chlorure')) return 'support nacl';
    if(raw.includes('glucose') || raw.includes('g5')) return 'support g5';
    return raw.replace(/\b\d+(?:[.,]\d+)?\s*(mg|ml|ui|g|cc|amp|cp)\b/g, '').replace(/\s+/g, ' ').trim();
  }

  function isSupportOnlyDrug(name){
    return ['support magnesium','support calcium','support prednisone','support nacl','support g5'].includes(catalogAliasKey(name));
  }

  function cleanPharmacyCatalog(list){
    const seen = new Set();
    const clean = [];
    (Array.isArray(list) ? list : []).forEach(item => {
      if(!item) return;
      if(isSupportOnlyDrug(item.name) || isSupportOnlyDrug(item.dci)) return;
      const alias = catalogAliasKey(val(item.name, item.dci));
      const key = ['taxol','carboplatine','5fu','navelbine','zometa'].includes(alias) ? alias : (alias || norm(item.name));
      const existing = clean.find(x => {
        const xAlias = catalogAliasKey(x.name);
        const xKey = ['taxol','carboplatine','5fu','navelbine','zometa'].includes(xAlias) ? xAlias : (xAlias || norm(x.name));
        return xKey === key;
      });
      if(existing){
        existing.qteService = Number(val(existing.qteService, existing.stockService, existing.qteStock, existing.stock, 0)) + Number(val(item.qteService, item.stockService, item.qteStock, item.stock, 0));
        existing.qteCentral = Number(val(existing.qteCentral, existing.stockCentral, 0)) + Number(val(item.qteCentral, item.stockCentral, 0));
        existing.qteStock = existing.qteService;
        existing.prixUnit = Number(val(existing.prixUnit, existing.prix, 0)) || Number(val(item.prixUnit, item.prix, 0)) || 0;
        existing.dosages = Array.from(new Set([...(existing.dosages || []), ...(item.dosages || [])].map(Number).filter(Boolean))).sort((a,b) => b-a);
        return;
      }
      seen.add(key);
      if(alias === 'taxol') clean.push({...item, name:'TAXOL (Paclitaxel)', dci:'Paclitaxel'});
      else if(alias === 'carboplatine') clean.push({...item, name:'CARBOPLATINE', dci:'Carboplatine'});
      else if(alias === '5fu') clean.push({...item, name:'5-FLUOROURACILE', dci:'Fluoro 5 uracile'});
      else if(alias === 'navelbine') clean.push({...item, name:'NAVELBINE', dci:'Vinorelbine'});
      else if(alias === 'zometa') clean.push({...item, name:'ZOMETA', dci:'Acide zolédronique'});
      else if(alias === 'trastuzumab') clean.push({...item, name:'HERCEPTIN', dci:'Trastuzumab', dosages:[600], forme:'Injection sous-cutanée'});
      else clean.push(item);
    });
    return clean;
  }

  function findCatalogItem(name, list){
    const catalog = list || readJson(STORAGE.catalog, []);
    const target = norm(name);
    const alias = catalogAliasKey(name);
    return catalog.find(item => {
      const itemName = norm(item.name);
      const itemDci = norm(item.dci);
      return itemName === target || itemDci === target || catalogAliasKey(item.name) === alias || catalogAliasKey(item.dci) === alias;
    });
  }

  function protocolCatalogDefaults(){
    const defaults = [
      ['TAXOL (Paclitaxel)','Paclitaxel',[100,300],'Injectable'],
      ['Acide folinique','Acide folinique',[50],'Injectable'],
      ['RITUXIMAB','Rituximab',[100,500],'Injectable'],
      ['CAPECITABINE 500 MG CP','Capecitabine',[500],'Comprime'],
      ['HYDROCORTISONE','Hydrocortisone',[100],'Injectable'],
      ['KYTRIL','Granisetron',[3],'Injectable']
    ];
    return defaults.map(([name,dci,dosages,forme]) => ({name,dci,dosages,forme,cond:'',qteStock:0,prixUnit:0,statutTarif:'Payant'}));
  }

  function ensureProtocolCatalogCompleteness(){
    const original = readJson(STORAGE.catalog, []);
    const list = cleanPharmacyCatalog(original);
    let changed = false;
    protocolCatalogDefaults().forEach(item => {
      if(!findCatalogItem(item.name, list)){
        list.push(item);
        changed = true;
      }
    });
    protocolsList().forEach(proto => (proto.drugs || []).forEach(drug => {
      if(!drug || drug.t || drug.oral || !(drug.name || drug.label)) return;
      const name = drug.name || drug.label;
      if(isSupportOnlyDrug(name)) return;
      if(findCatalogItem(name, list)) return;
      list.push({name, dci:name, dosages:[], forme:'A completer', cond:'', qteStock:0, prixUnit:0});
      changed = true;
    }));
    if(changed || list.length !== original.length) syncCatalogGlobal(list);
  }

  function deductStockForPatient(patient, sourceLabel, rdv){
    const proto = findProtocolByPatient(patient);
    if(!proto) return {updated:0, warnings:[`Protocole introuvable pour ${patientName(patient) || 'ce patient'}.`], details:[]};
    const catalog = readJson(STORAGE.catalog, []);
    let updated = 0;
    const warnings = [];
    const details = [];
    const validatedDetails = pharmaValidatedFlacons(patient, rdv);
    dedupeDrugDoseRows(activeDrugDoseRows(proto, patient)).forEach(row => {
      const dose = row.dose;
      if(!dose){ warnings.push(`${row.name}: dose non calculable.`); return; }
      let calc = calcDrugFlacons(row.name, dose);
      const matchedItem = findCatalogItem(row.name, catalog);
      const idx = catalog.findIndex(item => item === matchedItem);
      if(!calc || idx < 0){ warnings.push(`${row.name}: medicament non trouve dans Pharmacie Centrale.`); return; }
      const validated = validatedDetails.find(item => catalogAliasKey(item.name) === catalogAliasKey(row.name));
      if(validated?.flacons?.length){
        const flacons = validated.flacons.map(Number).filter(Boolean);
        const totalMg = flacons.reduce((sum, size) => sum + size, 0);
        calc = {...calc, nbFlacons:flacons.length, flacons, totalMg, reliquat:Math.max(0, Math.round((totalMg - dose) * 10) / 10)};
      } else {
        calc = confirmFlaconsByDosage(row.name, dose, calc);
        if(!calc){ warnings.push(`${row.name}: deduction annulee ou quantites invalides.`); return; }
      }
      const stock = Number(val(catalog[idx].qteService, catalog[idx].stockService, catalog[idx].qteStock, catalog[idx].stock, 0));
      if(stock < calc.nbFlacons){ warnings.push(`${row.name}: stock insuffisant (${stock} flacon(s), besoin ${calc.nbFlacons}).`); return; }
      catalog[idx].qteService = stock - calc.nbFlacons;
      catalog[idx].qteStock = catalog[idx].qteService;
      updated++;
      details.push({name: row.name, dose, nbFlacons: calc.nbFlacons, reliquatMg: Number(calc.reliquat || 0), reliquatFlacons: reliquatFlaconsFromCalc(calc), flacons: calc.flacons || []});
    });
    writeJson(STORAGE.catalog, catalog);
    const sorties = readJson(STORAGE.sorties, []);
    sorties.unshift({
      id: Date.now(),
      date: new Date().toLocaleDateString('fr-FR'),
      dateTs: new Date().toISOString(),
      patient: patientName(patient),
      dossier: val(patient.dossier),
      protocole: proto.name,
      source: sourceLabel || 'Traitement patient',
      details: details.map(d => `${d.name}: ${d.nbFlacons} flacon(s), ${d.dose} mg, reliquat ${d.reliquatMg} mg`).join(', '),
      detailsData: details,
      warnings
    });
    writeJson(STORAGE.sorties, sorties);
    if(updated || warnings.length){
      logAudit('Deduction stock', patientName(patient), `Source: ${sourceLabel || 'Traitement patient'}. Protocole: ${proto.name}. Medicaments deduits: ${updated}. Alertes: ${warnings.length}`);
    }
    return {updated, warnings, details};
  }

  function latestBiologieForPatient(patient, rdv){
    const list = readJson(STORAGE.biologie, readJson('biologie', []));
    const code = norm(patientCode(patient));
    const dossier = norm(val(patient?.dossier, rdv?.dossier));
    const name = norm(patientName(patient) || `${val(rdv?.prenom)} ${val(rdv?.nom)}`.trim());
    return list.filter(b => {
      return (code && norm(b.code) === code) ||
        (dossier && norm(b.dossier) === dossier) ||
        (name && norm(b.patient) === name);
    }).sort((a,b) => new Date(b.dateTs || b.date || 0) - new Date(a.dateTs || a.date || 0))[0];
  }

  function bioWarnings(bio){
    if(!bio) return ['Aucun bilan biologique renseigne.'];
    const warnings = [];
    const hb = Number(bio.hb), pnn = Number(bio.pnn), plaq = Number(bio.plaquettes), creat = Number(bio.creat), asat = Number(bio.asat), alat = Number(bio.alat);
    if(hb && hb < 10) warnings.push(`Hb basse (${hb})`);
    if(pnn && pnn < 1500) warnings.push(`PNN bas (${pnn})`);
    if(plaq && plaq < 100) warnings.push(`Plaquettes basses (${plaq})`);
    if(creat && creat > 13) warnings.push(`Creatinine elevee (${creat})`);
    if(asat && asat > 80) warnings.push(`ASAT elevee (${asat})`);
    if(alat && alat > 80) warnings.push(`ALAT elevee (${alat})`);
    return warnings;
  }

  function daysBetweenIso(fromDate, toDate){
    const parse = value => {
      const raw = String(value || '');
      const fr = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if(fr) return new Date(`${fr[3]}-${fr[2].padStart(2, '0')}-${fr[1].padStart(2, '0')}T00:00:00`);
      return new Date(raw.slice(0, 10) + 'T00:00:00');
    };
    const a = parse(fromDate);
    const b = new Date(String(toDate || todayIso()).slice(0, 10) + 'T00:00:00');
    if(isNaN(a) || isNaN(b)) return Infinity;
    return Math.floor((b - a) / 86400000);
  }

  function patientAlreadyStartedTreatment(patient){
    const code = patientCode(patient);
    const dossier = val(patient?.dossier);
    const same = item => (code && patientCode(item) === code) || (dossier && val(item.dossier, item.patient?.dossier) === dossier) || norm(patientName(item)) === norm(patientName(patient));
    return readJson(STORAGE.sorties, []).some(same) ||
      readJson(STORAGE.rdv, []).some(r => same(r) && (norm(val(r.status, r.statut)).includes('traite') || r.validatedAt || r.stockValide));
  }

  function bioDateWarnings(patient, rdv){
    const bio = latestBiologieForPatient(patient, rdv);
    if(!bio) return ['Aucun bilan biologique renseigne.'];
    const resultDate = val(bio.resultDate, bio.dateResultat, bio.dateTs, bio.date);
    const ageDays = daysBetweenIso(resultDate, val(rdv?.dateRdv, todayIso()));
    const maxDays = patientAlreadyStartedTreatment(patient) ? 15 : 31;
    if(ageDays > maxDays){
      return [`Biologie trop ancienne (${ageDays} jours). Limite: ${maxDays === 15 ? '15 jours pour patient deja traite' : '1 mois pour premier traitement'}.`];
    }
    return [];
  }

  function requireBiologieBeforePharma(patient, rdv){
    const problems = bioDateWarnings(patient, rdv);
    if(!problems.length) return true;
    alert('Validation biologique obligatoire avant validation pharmacien :\n- ' + problems.join('\n- '));
    if(typeof showPage === 'function'){
      showPage('biologie', document.querySelector(".tab-btn[onclick*=\"biologie\"]"));
    }
    return false;
  }

  function printHtml(html, width, height){
    const frame = document.getElementById('print-frame');
    if(!frame){
      window.open(URL.createObjectURL(new Blob([html], {type:'text/html'})), '_blank');
      return;
    }
    frame.style.cssText = `position:fixed;left:-9999px;top:0;width:${width || '210mm'};height:${height || '297mm'};border:none;display:block`;
    const doc = frame.contentDocument || frame.contentWindow.document;
    doc.open(); doc.write(html); doc.close();
    setTimeout(() => {
      try { frame.contentWindow.focus(); frame.contentWindow.print(); }
      catch(e){ window.open(URL.createObjectURL(new Blob([html], {type:'text/html'})), '_blank'); }
      setTimeout(() => { frame.style.cssText = 'display:none;position:fixed;left:-9999px;width:0;height:0;border:none'; }, 3000);
    }, 400);
  }

  function compactPrintableProtocol(html){
    const group = esc(formOrLastPatientValue('groupe-sanguin', ['groupeSanguin', 'groupe']));
    let out = enhancePrintableProtocolPatientLine(String(html || ''));
    if(group && !/Groupe sanguin\s*:/i.test(out)){
      out = out.replace(/(<div style="font-size:10px">Antécédents médicaux\s*:\s*<b>[\s\S]*?<\/b><\/div>)/, `$1<div style="font-size:10px;margin-top:2px">Groupe sanguin : <b>${group}</b></div>`);
    }
    return out;
  }

  function formOrLastPatientValue(id, keys){
    const current = document.getElementById(id)?.value;
    if(current) return current;
    const last = readJson(LAST_PROTOCOL_PATIENT_KEY, {});
    return val(...keys.map(key => last[key]));
  }

  function protocolLocalisationsPhrase(){
    const localisation = formOrLastPatientValue('localisation', ['localisation', 'diagnostic']);
    const histologie = formOrLastPatientValue('type-histologie', ['histologie', 'typeHistologie', 'type_histologie']);
    const stade = formOrLastPatientValue('stade', ['stade', 'phase', 'phaseDiagnostic']);
    const parts = [];
    if(histologie && localisation) parts.push(`${histologie} ${localisation}`);
    else if(histologie) parts.push(histologie);
    else if(localisation) parts.push(localisation);
    if(stade) parts.push(`au stade ${stade}`);
    return parts.join(', ') || '-';
  }

  function protocolIndicationPhrase(){
    const selected = typeof selId !== 'undefined' ? selId : '';
    const proto = protocolsList().find(p => p.id === selected);
    return formOrLastPatientValue('indication', ['indication']) || val(proto?.indication, proto?.detail, '-');
  }

  function enhancePrintableProtocolPatientLine(html){
    const phrase = esc(protocolLocalisationsPhrase());
    const indication = esc(protocolIndicationPhrase());
    const last = readJson(LAST_PROTOCOL_PATIENT_KEY, {});
    const dossier = esc(formOrLastPatientValue('dossier', ['dossier', 'numeroDossier']));
    const cubix = esc(formOrLastPatientValue('cubix', ['cubix', 'idCubix']));
    const code = esc(formOrLastPatientValue('codegratuite', ['codegratuite', 'codeGratuite', 'code']));
    const dateProto = formOrLastPatientValue('date-protocole', ['dateProto', 'dateProtocole']) || todayIso();
    const dateTxt = esc(dateProto ? String(dateProto).split('-').reverse().join('/') : '');
    const barcode = esc(val(last.codeBarre, last.codebarre, code));
    const headerInfo = `<b>N° Dossier : ${dossier || '________'}</b><br>
        <span style="font-size:8.5px">Date : <b>${dateTxt}</b></span><br>
        ${cubix ? `<span style="font-size:8.5px">ID Cubix : <b>${cubix}</b></span><br>` : ''}
        ${code ? `<span style="font-size:8.5px">Code Gratuite : <b>${code}</b></span><br>` : ''}
        ${barcode ? `<span style="font-size:8.5px">Code barre : <b style="font-family:'Libre Barcode 39','Courier New',monospace;font-size:18px;letter-spacing:.08em">*${barcode}*</b></span>` : ''}`;
    return html
      .replace(/<b>CHNCAK[\s\S]*?<\/td>/, `${headerInfo}</td>`)
      .replace(/Localisation\s*:/g, 'Localisations :')
      .replace(/(<div style="font-size:10px;margin-bottom:2px">Localisations :\s*<b>)([\s\S]*?)(<\/b><\/div>)/, `$1${phrase}$3`)
      .replace(/(<div style="font-size:9px;margin-top:2px">\s*Indication :\s*<b>)([\s\S]*?)(<\/b>\s*<\/div>)/, `$1${indication}$3`);
  }

  window.printFromApercu = function(){
    const html = typeof buildDocumentHTML === 'function' ? compactPrintableProtocol(buildDocumentHTML()) : '';
    if(!html) return alert('Aucun apercu a imprimer.');
    const proto = protocolsList().find(p => p.id === (typeof selId !== 'undefined' ? selId : ''));
    const fullDoc = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
      <title>Protocole ${esc(proto?.name || '')}</title>
      <style>
        @page{size:A4 landscape;margin:5mm}
        *{box-sizing:border-box}
        body{font-family:Arial,Helvetica,sans-serif;font-size:11.2px;line-height:1.4;color:#000;background:#fff;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        .landscape-protocol-page{width:287mm;min-height:200mm;display:grid;grid-template-columns:1fr 1fr;gap:0;border:1.4px double #000;padding:2mm;background:#fff}
        .landscape-copy{min-width:0;padding:0 4.6mm;overflow:hidden}
        .landscape-copy:first-child{border-right:1.2px solid #000}
        .landscape-copy table{max-width:100%!important;width:100%!important;page-break-inside:avoid;border-collapse:collapse}
        .landscape-copy table:first-child,.landscape-copy table:first-child *{font-size:8px!important;line-height:1.22!important;padding-top:0!important;padding-bottom:0!important;margin-top:0!important;margin-bottom:0!important}
        .landscape-copy table:first-child img{max-height:46px!important;width:auto!important}
        .landscape-copy th,.landscape-copy td{padding-top:6px!important;padding-bottom:6px!important}
        .landscape-copy [style*="font-size:12px"]{font-size:12px!important}
        .landscape-copy [style*="font-size:11px"]{font-size:11.3px!important}
        .landscape-copy [style*="font-size:10px"]{font-size:10.8px!important}
        .landscape-copy [style*="margin-bottom:5px"]{margin-bottom:6px!important}
        @media print{body{margin:0}.landscape-protocol-page{page-break-after:avoid}}
      </style>
    </head><body><div class="landscape-protocol-page"><section class="landscape-copy">${html}</section><section class="landscape-copy">${html}</section></div></body></html>`;
    printHtml(fullDoc, '297mm', '210mm');
  };

  window.printDoc = function(){
    return window.printFromApercu();
  };

  window.printBonRDV = function(){
    const last = readJson(LAST_PROTOCOL_PATIENT_KEY, {});
    const proto = protocolsList().find(p => p.id === (typeof selId !== 'undefined' ? selId : '') || p.id === last.protoId || norm(p.name) === norm(last.protocole));
    const get = id => document.getElementById(id)?.value || '';
    const prenom = get('prenom') || val(last.prenom);
    const nom = get('nom') || val(last.nom);
    if(!prenom || !nom) return alert('Renseignez le patient avant d imprimer le bon de rendez-vous.');
    const rdvInput = get('date-rdv') || val(last.dateRdv);
    const rdvText = rdvInput ? rdvInput.split('-').reverse().join('/') : '___/___/______';
    const protoDate = get('date-protocole') || val(last.dateProto);
    const dateProto = protoDate ? protoDate.split('-').reverse().join('/') : new Date().toLocaleDateString('fr-FR');
    const patientRecord = readJson(STORAGE.patients, []).find(p =>
      (val(get('dossier'), last.dossier) && p.dossier === val(get('dossier'), last.dossier)) ||
      (val(get('codegratuite'), last.codegratuite) && patientCode(p) === val(get('codegratuite'), last.codegratuite)) ||
      norm(patientName(p)) === norm(`${prenom} ${nom}`)
    ) || {};
    const contact = get('tel-patient') || get('telephone') || get('contact') || get('tel') || val(last.tel, patientRecord.tel, patientRecord.contact, patientRecord.telephone);
    const logo = document.querySelector('.nav-logo img')?.src || '';
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Bon de rendez-vous</title>
      <style>
        @page{size:A4 landscape;margin:8mm}
        *{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        .rdv-page{width:281mm;min-height:194mm;display:grid;grid-template-columns:1fr 1fr;gap:8mm;align-items:start}
        .rdv-card{width:100%;min-height:188mm;border:2px solid #0A3D7A;border-radius:8px;padding:8mm 9mm;display:flex;flex-direction:column;gap:5.5mm}
        .rdv-blank{border-right:1px dashed #cbd5e1;min-height:188mm}
        .rdv-head{display:grid;grid-template-columns:52px 1fr 52px;gap:6px;align-items:start;text-align:center}
        .rdv-head img{width:52px;height:52px;object-fit:contain}
        .ministry{font-size:9px;line-height:1.15}.ministry b{font-size:9.5px}
        .title{background:#0A3D7A;color:#fff;text-align:center;font-weight:900;letter-spacing:.08em;font-size:19px;padding:7px;border-radius:4px}
        .line{display:flex;gap:6px;align-items:flex-end;font-size:14.5px;line-height:1.55}
        .line span:first-child{font-weight:800;min-width:42mm;color:#17324d}.line b{flex:1;border-bottom:1.3px dotted #333;min-height:22px;padding-left:5px}
        .rdv-date{border:2px solid #0B5E3C;border-radius:8px;padding:5mm;text-align:center;background:#f3fbf7}
        .rdv-date span{display:block;font-size:12px;text-transform:uppercase;color:#0B5E3C;font-weight:800}.rdv-date strong{display:block;font-size:27px;margin-top:3px;color:#111}
        .ticket{font-size:16px;font-weight:900;color:#7A4B00;background:#fff7e6;border:1.5px solid #f0c060;border-radius:5px;text-align:center;padding:6px}
        .foot{margin-top:auto;font-size:11.5px;line-height:1.35;color:#4b5563;text-align:center}
      </style></head><body><main class="rdv-page"><section class="rdv-blank"></section><section class="rdv-card">
        <div class="rdv-head"><img src="${logo}"><div class="ministry">Republique du Senegal<br><b>Un peuple - un but - une foi</b><br>Ministere de la Sante et de l'Action Sociale<br><b>Centre Hospitalier National Cheikh Ahmadoul Khadim</b><br><b>Service d'Oncologie - Radiotherapie</b></div><img src="${logo}"></div>
        <div class="title">BON DE RENDEZ-VOUS</div>
        <div class="line"><span>Prenom et nom</span><b>${esc(`${prenom} ${nom}`.toUpperCase())}</b></div>
        <div class="line"><span>Numero dossier</span><b>${esc(val(get('dossier'), last.dossier, get('cubix'), last.cubix, '-'))}</b></div>
        <div class="line"><span>ID CUBIX</span><b>${esc(val(get('cubix'), last.cubix, '-'))}</b></div>
        <div class="line"><span>Contact</span><b>${esc(val(contact, '-'))}</b></div>
        <div class="line"><span>Protocole</span><b>${esc(proto?.name || '-')}</b></div>
        <div class="line"><span>Date protocole</span><b>${esc(dateProto)}</b></div>
        <div class="ticket">Prix du ticket : 25 000 FCFA</div>
        <div class="rdv-date"><span>Date du prochain rendez-vous</span><strong>${esc(rdvText)} a 07h30</strong></div>
        <div class="foot">Merci de venir avec les resultats de biologie demandes et de se presenter au service d'oncologie-radiotherapie.</div>
      </section></main></body></html>`;
    printHtml(html, '297mm', '210mm');
  };

  function resolvePreparationProtocol(){
    const protocols = protocolsList();
    const currentId = typeof selId !== 'undefined' ? selId : '';
    let proto = protocols.find(p => p.id === currentId);
    if(proto) return proto;
    const selectedCard = document.querySelector('.proto-card.selected');
    const cardName = selectedCard?.querySelector('.pname')?.textContent || '';
    proto = protocols.find(p => norm(p.name) === norm(cardName));
    if(proto) return proto;
    const subtitleName = (document.getElementById('prep-subtitle')?.textContent || '').split('—')[0].trim();
    proto = protocols.find(p => norm(p.name) === norm(subtitleName));
    return proto || null;
  }

  window.printPreparationFinal = function(){
    const proto = resolvePreparationProtocol();
    const patient = {
      prenom: document.getElementById('prenom')?.value || '',
      nom: document.getElementById('nom')?.value || '',
      age: document.getElementById('age')?.value || '',
      poids: document.getElementById('poids')?.value || '',
      taille: document.getElementById('taille')?.value || '',
      dossier: document.getElementById('dossier')?.value || '',
      cubix: document.getElementById('cubix')?.value || '',
      codegratuite: document.getElementById('codegratuite')?.value || '',
      medecin: document.getElementById('medecin-select')?.value || ''
    };
    const localSc = Number(typeof sc !== 'undefined' && sc > 0 ? sc : (Number(patient.poids) && Number(patient.taille) ? Math.sqrt((Number(patient.poids) * Number(patient.taille)) / 3600) : 0));
    if(!proto) return alert('Selectionner un protocole avant impression.');
    if(!localSc) return alert('Renseigner poids et taille avant impression de la fiche.');
    if(typeof selId !== 'undefined' && !selId) selId = proto.id;
    if(typeof calcSC === 'function') calcSC();
    let n = 0;
    const labelCards = [];
    const rows = (proto.drugs || []).map(d => {
      const dose = typeof getDose === 'function' ? getDose(d) : {};
      if(dose.cls === 'rh') return `<tr class="sep"><td colspan="8">${esc(d.label || '')} - ${esc(d.dur || '')}</td></tr>`;
      if(d.t || d.oral) return '';
      n++;
      const doseMg = Number(dose.val || 0);
      const steps = doseMg && typeof getVolAspirer === 'function' ? getVolAspirer(d.name, doseMg) : null;
      const totalVol = steps?.length ? steps.reduce((sum, s) => sum + Number(s.volAspire || 0), 0) : 0;
      const reliquat = steps?.length ? steps.reduce((sum, s) => sum + Number(s.volRestant || 0), 0) : 0;
      const aspiration = steps?.length ? steps.map(s => `${s.volAspire} mL du fl. ${s.dosage} mg`).join('<br>') : 'Dose fixe / non injectable';
      const solvant = doseMg && typeof getSolvantVol === 'function' ? getSolvantVol(d.name, doseMg) : null;
      const sol = solvant ? `${solvant.vol} cc ${solvant.sol}` : val(dose.sol, d.sol, '-');
      const barre = patientBarcode(patient);
      labelCards.push(`<div class="vial-label"><div class="vial-title">${esc(d.name || '')}</div><div><b>Patient:</b> ${esc(patient.prenom)} ${esc(patient.nom)}</div><div><b>Code barre:</b> <span class="barcode-text">${esc(barre || '-')}</span></div><div><b>Dose:</b> ${esc(dose.txt || '-')}</div><div><b>Solvant:</b> ${esc(sol)}</div><div><b>Date:</b> ${new Date().toLocaleDateString('fr-FR')} &nbsp; <b>Prep:</b> ____</div></div>`);
      return `<tr>
        <td>${n}</td><td><b>${esc(d.name || d.label || '')}</b></td><td>${esc(dose.txt || '')}</td>
        <td>${aspiration}</td><td><b>${totalVol ? totalVol.toFixed(1) + ' mL' : '-'}</b></td>
        <td>${esc(sol)}</td><td>${esc(d.dur || '-')}</td><td>${reliquat ? reliquat.toFixed(1) + ' mL a jeter' : '0'}</td>
      </tr>`;
    }).join('');
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Fiche preparation</title>
      <style>@page{size:A4;margin:8mm 10mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#111}.head{display:grid;grid-template-columns:52px 1fr 120px;gap:7px;align-items:start;margin-bottom:5px}.head img{width:48px;height:48px;object-fit:contain}.ministry{font-size:7.2px;line-height:1.12}.right{font-size:8px;line-height:1.22;text-align:right}.title{background:#0A3D7A;color:white;padding:6px 9px;border-radius:3px;margin:6px 0;font-weight:700}.patient{display:grid;grid-template-columns:2fr repeat(4,1fr);gap:5px;background:#EEF4FD;border:1px solid #0A3D7A;padding:6px;margin-bottom:6px}.patient small{display:block;color:#555;font-size:7px;text-transform:uppercase}table{width:100%;border-collapse:collapse}th{background:#0A3D7A;color:white;font-size:8.5px;padding:4px;border:1px solid #7fa2d4}td{font-size:9px;padding:4px 5px;border:1px solid #bbb;vertical-align:top}.sep td{background:#f1f1f1;color:#555;font-style:italic}.sign{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}.box{height:28px;border:1px solid #aaa;margin-top:3px}.label-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:5px;margin-top:8px}.vial-label{border:1px dashed #333;border-radius:3px;padding:5px;font-size:7.8px;line-height:1.25;min-height:48px}.vial-title{font-weight:bold;color:#0A3D7A;font-size:8.4px;text-transform:uppercase;margin-bottom:2px}.barcode-text{font-family:"Libre Barcode 39","Courier New",monospace;font-size:10px;letter-spacing:.08em}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>
    </head><body>
      <div class="head"><img src="${document.querySelector('.nav-logo img')?.src || ''}"><div class="ministry">Republique du Senegal - Un peuple, un but, une foi<br>Ministere de la Sante et de l'Action Sociale<br><b>Centre Hospitalier National Cheikh Ahmadoul Khadim - Touba</b><br><b>Service d'Oncologie-Radiotherapie</b></div><div class="right">Dossier: <b>${esc(patient.dossier || '-')}</b><br>ID Cubix: <b>${esc(patient.cubix || '-')}</b><br>Code: <b>${esc(patient.codegratuite || '-')}</b><br>Date: <b>${new Date().toLocaleDateString('fr-FR')}</b></div></div>
      <div class="title">FICHE DE PREPARATION - ${esc(proto.name)} <span style="font-weight:400">(${esc(proto.detail || '')})</span></div>
      <div class="patient"><div><small>Patient</small><b>${esc(patient.prenom)} ${esc(patient.nom)}</b></div><div><small>Age</small><b>${esc(patient.age)} ans</b></div><div><small>Poids</small><b>${esc(patient.poids)} kg</b></div><div><small>Taille</small><b>${esc(patient.taille)} cm</b></div><div><small>SC</small><b>${localSc.toFixed(2)} m2</b></div></div>
      <table><thead><tr><th>#</th><th>Medicament</th><th>Dose</th><th>Volumes a aspirer</th><th>Volume total</th><th>Solvant</th><th>Duree</th><th>Reliquat</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="label-grid">${labelCards.join('')}</div>
      <div class="sign"><div>Preparateur<div class="box"></div></div><div>Pharmacien<div class="box"></div></div><div>Infirmier / Heure<div class="box"></div></div></div>
      <div style="margin-top:5px;padding:4px;background:#FFF3DC;border:1px solid #F0C060;font-size:8px">Preparation sous hotte a flux laminaire - Verification volume aspire, solvant, etiquette et reliquat avant liberation.</div>
    </body></html>`;
    printHtml(html);
  };
  window.printPreparation = window.printPreparationFinal;

  function pharmaValidationKey(patient, rdv){
    return norm(val(patient?.dossier, rdv?.dossier, patient?.codegratuite, rdv?.codegratuite, patientName(patient), patientName(rdv)));
  }

  function hasPharmaValidation(patient, rdv){
    const key = pharmaValidationKey(patient, rdv);
    const entry = key ? readJson('chncak_pharma_validations', {})[key] : null;
    return !!(entry && entry.status !== 'verification');
  }

  function pharmaValidatedFlacons(patient, rdv){
    const key = pharmaValidationKey(patient, rdv);
    return key ? readJson('chncak_pharma_validations', {})[key]?.detailsData || [] : [];
  }

  function collectPharmaValidationDetails(patient, rdv){
    const proto = findProtocolByPatient({...patient, protoId:val(patient?.protoId, rdv?.protoId), proto:val(patient?.proto, rdv?.proto)});
    if(!proto) return {detailsData:[], warnings:[`Protocole introuvable pour ${patientName(patient) || 'ce patient'}.`]};
    const detailsData = [];
    const warnings = [];
    dedupeDrugDoseRows(activeDrugDoseRows(proto, patient)).forEach(row => {
      const dose = row.dose;
      if(!dose){ warnings.push(`${row.name}: dose non calculable.`); return; }
      let calc = calcDrugFlacons(row.name, dose);
      if(!calc){ warnings.push(`${row.name}: medicament non trouve dans Pharmacie Centrale.`); return; }
      calc = confirmFlaconsByDosage(row.name, dose, calc);
      if(!calc){ warnings.push(`${row.name}: validation annulee ou quantites invalides.`); return; }
      detailsData.push({name:row.name, dose, nbFlacons:calc.nbFlacons, reliquatMg:Number(calc.reliquat || 0), reliquatFlacons:reliquatFlaconsFromCalc(calc), flacons:calc.flacons || []});
    });
    return {detailsData, warnings};
  }

  window.validatePharmacistPreparation = function(){
    const patient = currentProtocolFormPatient();
    if(!patient.prenom || !patient.nom) return alert('Chargez ou renseignez le patient avant validation.');
    if(!requireBiologieBeforePharma(patient)) return;
    requirePharmacienAction('validation pharmacien', () => {
      const validationDetails = collectPharmaValidationDetails(patient);
      if(validationDetails.warnings.length && !confirm(`Avertissements:\n${validationDetails.warnings.join('\n')}\n\nContinuer la validation ?`)) return;
      const map = readJson('chncak_pharma_validations', {});
      map[pharmaValidationKey(patient)] = {status:'validated', validatedAt:new Date().toISOString(), patient:patientName(patient), dossier:patient.dossier, protoId:patient.protoId, detailsData:validationDetails.detailsData, warnings:validationDetails.warnings};
      writeJson('chncak_pharma_validations', map);
      showToastSafe('Validation pharmacien enregistree.', 'success');
    });
  };

  window.sendPreparationForVerification = function(){
    const patient = currentProtocolFormPatient();
    if(!patient.prenom || !patient.nom) return alert('Chargez ou renseignez le patient avant envoi pour verification.');
    requirePharmacienAction('envoyer la fiche pour verification', () => {
      const map = readJson('chncak_pharma_validations', {});
      map[pharmaValidationKey(patient)] = {status:'verification', sentAt:new Date().toISOString(), patient:patientName(patient), dossier:patient.dossier, protoId:patient.protoId, sentBy:val(currentUser().name, currentUser().username, 'pharmacien')};
      writeJson('chncak_pharma_validations', map);
      showToastSafe('Fiche envoyee pour verification.', 'info');
      renderPreparationTodayList();
    });
  };

  function ensurePreparationPrintReady(){
    const btn = document.getElementById('prep-print-btn');
    if(!btn) return;
    if(!document.getElementById('prep-pharma-validation-btn')){
      btn.insertAdjacentHTML('afterend', '<button id="prep-pharma-validation-btn" type="button" class="btn-primary" style="width:auto;margin-left:8px;padding:10px 14px;background:#0B5E3C" onclick="validatePharmacistPreparation()">Validation pharmacien</button>');
    }
    if(!document.getElementById('prep-pharma-verification-btn')){
      document.getElementById('prep-pharma-validation-btn')?.insertAdjacentHTML('afterend', '<button id="prep-pharma-verification-btn" type="button" class="btn-secondary" style="width:auto;margin-left:8px;padding:10px 14px;border-color:#F0C060;color:#7A4B00;background:#FFF3DC" onclick="sendPreparationForVerification()">Envoyer pour verification</button>');
    }
    const proto = resolvePreparationProtocol();
    const poids = Number(document.getElementById('poids')?.value || 0);
    const taille = Number(document.getElementById('taille')?.value || 0);
    const localSc = Number(typeof sc !== 'undefined' && sc > 0 ? sc : (poids && taille ? Math.sqrt((poids * taille) / 3600) : 0));
    if(proto && localSc){
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      document.getElementById('prep-empty')?.style && (document.getElementById('prep-empty').style.display = 'none');
      document.getElementById('prep-content')?.style && (document.getElementById('prep-content').style.display = '');
    }
    renderPreparationTodayList();
  }

  function rdvPatientForPreparation(rdv){
    const patients = readJson(STORAGE.patients, []);
    return patients.find(p => (p.dossier && p.dossier === rdv.dossier) || norm(patientName(p)) === norm(`${val(rdv.prenom)} ${val(rdv.nom)}`)) || rdv;
  }

  window.validatePreparationForRdv = function(id){
    const rdv = readJson(STORAGE.rdv, []).find(r => String(r.id) === String(id));
    if(!rdv) return alert('Rendez-vous introuvable.');
    const patient = rdvPatientForPreparation(rdv);
    if(!isPharmacienUser() && !isAdminUser()) return alert('Action reservee au compte pharmacien.');
    if(!requireBiologieBeforePharma(patient, rdv)) return;
    const validationDetails = collectPharmaValidationDetails({...patient, protoId:val(patient.protoId, rdv.protoId), proto:val(patient.proto, rdv.proto)}, rdv);
    if(validationDetails.warnings.length && !confirm(`Avertissements:\n${validationDetails.warnings.join('\n')}\n\nContinuer la validation ?`)) return;
    const map = readJson('chncak_pharma_validations', {});
    map[pharmaValidationKey(patient, rdv)] = {status:'validated', validatedAt:new Date().toISOString(), patient:patientName(patient), dossier:val(patient.dossier, rdv.dossier), protoId:val(patient.protoId, rdv.protoId), source:'preparation', detailsData:validationDetails.detailsData, warnings:validationDetails.warnings};
    writeJson('chncak_pharma_validations', map);
    logAudit('Validation fiche preparation', patientName(patient), `Protocole ${protocolNameFor({...patient, protoId:val(patient.protoId, rdv.protoId), proto:val(patient.proto, rdv.proto)})}. Medicaments: ${validationDetails.detailsData.length}`);
    renderPreparationTodayList();
    showToastSafe('Fiche de preparation validee.', 'success');
  };

  function renderPreparationTodayList(){
    const page = document.getElementById('page-preparation');
    if(!page) return;
    let host = document.getElementById('prep-today-rdv-card');
    if(!host){
      host = document.createElement('div');
      host.id = 'prep-today-rdv-card';
      const target = document.getElementById('prep-sheet-wrapper') || document.getElementById('prep-content') || page.firstElementChild;
      target?.parentNode?.insertBefore(host, target);
    }
    const today = todayIso();
    const todaysRdv = dedupeByPatientTreatment(readJson(STORAGE.rdv, []).filter(r => r.dateRdv === today));
    const rows = todaysRdv.map(r => {
      const patient = rdvPatientForPreparation(r);
      const key = pharmaValidationKey(patient, r);
      const pharmaState = readJson('chncak_pharma_validations', {})[key];
      const validated = hasPharmaValidation(patient, r);
      const needsVerification = pharmaState?.status === 'verification';
      return `<tr>
        <td>${esc(val(r.heure, r.time, '-'))}</td>
        <td><b>${esc(patientName(patient) || `${val(r.prenom)} ${val(r.nom)}`)}</b><div class="dash-muted">${esc(val(patient.dossier, r.dossier, patientCode(patient), ''))}</div></td>
        <td>${esc(protocolNameFor({...patient, protoId:val(patient.protoId, r.protoId), proto:val(patient.proto, r.proto)}))}</td>
        <td>${validated ? '<span class="clinical-pill ok">Fiche validee</span>' : needsVerification ? '<span class="clinical-pill warn">Verification demandee</span>' : '<span class="clinical-pill warn">En attente</span>'}</td>
        <td>${validated ? '<button class="btn-sm" disabled>Validee</button>' : `<button class="btn-sm primary" onclick="validatePreparationForRdv(${esc(r.id)})">Valider la fiche</button>`}<button class="btn-sm" style="margin-left:5px" onclick="deletePreparationRdv('${esc(r.id)}')">Supprimer</button></td>
      </tr>`;
    }).join('');
    host.innerHTML = `
      <div class="card">
        <div class="card-header"><div class="card-num" style="background:#0B5E3C">J</div><h2>Rendez-vous du jour a preparer</h2></div>
        <div class="card-body dash-table-wrap">
          <table class="dash-table prep-rdv-table">
            <thead><tr><th>Heure</th><th>Patient</th><th>Protocole</th><th>Etat fiche</th><th>Actions</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="5" class="dash-empty">Aucun rendez-vous programme ce jour.</td></tr>'}</tbody>
          </table>
        </div>
      </div>`;
  }

  function transfusionKey(item){
    return [
      norm(val(item?.dossier, item?.patient?.dossier)),
      norm(val(item?.code, item?.codegratuite, item?.codeGratuite, item?.patientCode, item?.patient?.codegratuite)),
      norm(patientName(item?.patient || item)),
      norm(val(item?.resultDate, item?.dateResultat, item?.date))
    ].filter(Boolean).join('|') || String(val(item?.id, Date.now()));
  }

  function biologieTransfusionCandidates(){
    const patients = readJson(STORAGE.patients, []);
    const biologies = [...readJson(STORAGE.biologie, []), ...readJson('biologie', [])]
      .filter(bio => Number(String(val(bio.hb, bio.hemoglobine, bio.hemoglobin)).replace(',', '.')) < 9)
      .sort((a,b) => Date.parse(val(b.dateTs, b.resultDate, b.date, 0)) - Date.parse(val(a.dateTs, a.resultDate, a.date, 0)));
    const byKey = new Map();
    biologies.forEach(bio => {
      const patient = patients.find(p =>
        (val(bio.dossier) && val(p.dossier, p.numeroDossier) === val(bio.dossier)) ||
        (val(bio.code, bio.patientCode) && patientCode(p) === val(bio.code, bio.patientCode)) ||
        (patientName(p) && norm(patientName(p)) === norm(val(bio.patient, bio.patientName)))
      ) || {};
      const merged = {
        ...patient,
        ...bio,
        patient: patientName(patient) || val(bio.patient, bio.patientName),
        dossier: val(patient.dossier, patient.numeroDossier, bio.dossier),
        code: val(patient.codegratuite, patient.codeGratuite, bio.code, bio.patientCode),
        cubix: val(patient.cubix, patient.idCubix, bio.cubix),
        protocole: val(bio.protocole, protocolNameFor(patient), patient.protocole, patient.proto),
        hb: val(bio.hb, bio.hemoglobine, bio.hemoglobin),
        resultDate: val(bio.resultDate, bio.dateResultat, bio.date),
        groupeSanguin: val(patient.groupeSanguin, patient.groupe, bio.groupeSanguin, bio.groupe),
        bioId: val(bio.id)
      };
      const key = transfusionKey(merged);
      if(!byKey.has(key)) byKey.set(key, merged);
    });
    return Array.from(byKey.values());
  }

  function ensureTransfusionRecords(){
    const records = readJson(STORAGE.transfusion, []);
    let changed = false;
    biologieTransfusionCandidates().forEach(candidate => {
      const key = transfusionKey(candidate);
      if(records.some(record => record.key === key || (candidate.bioId && record.bioId === candidate.bioId))) return;
      records.push({
        id: `TRF-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        key,
        bioId: candidate.bioId,
        patient: candidate.patient,
        dossier: candidate.dossier,
        code: candidate.code,
        cubix: candidate.cubix,
        protocole: candidate.protocole,
        hb: candidate.hb,
        resultDate: candidate.resultDate,
        dateTransfusion: '',
        groupe: String(candidate.groupeSanguin || '').replace(/[+-]/g, ''),
        rhesus: String(candidate.groupeSanguin || '').includes('-') ? '-' : (String(candidate.groupeSanguin || '').includes('+') ? '+' : ''),
        culots: '1',
        indication: `Hb ${candidate.hb} g/dL`,
        statut: 'a_programmer',
        createdAt: new Date().toISOString()
      });
      changed = true;
    });
    if(changed) writeJson(STORAGE.transfusion, records);
    return records;
  }

  function transfusionRecords(){
    ensureTransfusionRecords();
    return readJson(STORAGE.transfusion, []);
  }

  window.updateTransfusionField = function(id, field, value){
    const allowed = ['dateTransfusion', 'groupe', 'rhesus', 'culots', 'indication', 'gb', 'plaquettes', 'produit', 'urgence', 'sexe', 'age', 'diagnostic', 'antecedentTransfusion', 'incidentTransfusion', 'incidentPrecision', 'lit'];
    if(!allowed.includes(field)) return;
    const records = transfusionRecords();
    const row = records.find(item => item.id === id);
    if(!row) return;
    row[field] = value;
    row.updatedAt = new Date().toISOString();
    row.updatedBy = val(currentUser().username, currentUser().nom, '');
    if(row.statut !== 'transfuse') row.statut = row.dateTransfusion ? 'programme' : 'a_programmer';
    writeJson(STORAGE.transfusion, records);
    if(field === 'dateTransfusion') window.renderTransfusion?.();
  };

  window.printBonSang = function(id){
    const row = transfusionRecords().find(item => item.id === id);
    if(!row){
      alert('Dossier transfusion introuvable.');
      return;
    }
    const logo = document.querySelector('.nav-logo img')?.src || '';
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Demande produits sanguins labiles</title>
      <style>
        @page{size:A4 portrait;margin:7mm}
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;color:#111;margin:0;font-size:11px;line-height:1.22}
        .top{display:grid;grid-template-columns:58px 1fr 155px;gap:9px;align-items:start;border-bottom:2px solid #111;padding-bottom:6px;margin-bottom:7px}
        .top img{width:52px;height:52px;object-fit:contain}.ministry{text-align:center;line-height:1.24;font-size:9.2px}.right{text-align:right;font-size:9px;line-height:1.3}
        h1{text-align:center;font-size:15px;margin:6px 0 8px;text-transform:uppercase;letter-spacing:.03em;border:1px solid #111;padding:5px}
        .section-title{background:#e9eef5;border:1px solid #111;border-bottom:none;padding:4px 6px;font-weight:800;text-transform:uppercase}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:1px solid #111;border-left:1px solid #111;margin-bottom:6px}
        .cell{border-right:1px solid #111;border-bottom:1px solid #111;padding:4px 5px;min-height:28px}
        .wide{grid-column:1/-1}.thirds{display:grid;grid-template-columns:1fr 1fr 1fr}.label{font-size:8.4px;color:#444;text-transform:uppercase;margin-bottom:2px}.value{font-size:11.8px;font-weight:700}
        table{width:100%;border-collapse:collapse;margin-bottom:6px}th,td{border:1px solid #111;padding:4px 5px;text-align:left}th{background:#eef4fd}
        .check{display:inline-block;border:1px solid #111;width:12px;height:12px;margin:0 4px -2px 10px}.sign{display:grid;grid-template-columns:.68fr 1.32fr;gap:10px}.sign>div{border:1px solid #111;min-height:120px;padding:7px;line-height:1.48}
        .stamp-space{height:58px;margin-top:8px;border-top:1px dashed #aaa}
        .distribution-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px}
        .distribution-box{border:1px solid #111;min-height:64px;padding:6px;line-height:1.38}
        .distribution-label{font-size:8.2px;text-transform:uppercase;color:#444;font-weight:800;margin-bottom:11px}
        .distribution-line{border-top:1px dashed #999;height:23px}
        .nb{font-size:8.6px;line-height:1.22;border:1px solid #111;padding:5px;margin-top:6px}
      </style></head><body>
      <div class="top"><img src="${logo}"><div class="ministry">Republique du Senegal<br>Un peuple, un but, une foi<br>Ministere de la Sante et de l'Action Sociale<br><b>CENTRE HOSPITALIER NATIONAL CHEIKH AHMADOUL KHADIM - TOUBA</b><br>Service d'Oncologie-Radiotherapie - Secteur chimiotherapie</div><div class="right">Date demande: <b>${new Date().toLocaleDateString('fr-FR')}</b><br>Dossier: <b>${esc(row.dossier || '-')}</b><br>Code: <b>${esc(row.code || '-')}</b></div></div>
      <h1>Demande de produits sanguins labiles</h1>
      <div class="section-title">Etablissement de soin</div>
      <div class="grid">
        <div class="cell"><div class="label">Etablissement</div><div class="value">CHNCAK TOUBA</div></div>
        <div class="cell"><div class="label">Service / secteur / salle</div><div class="value">Oncologie-Radiotherapie / Chimiotherapie / Chimio</div></div>
        <div class="cell"><div class="label">Lit</div><div class="value">${esc(row.lit || '-')}</div></div>
        <div class="cell"><div class="label">Date transfusion programmee</div><div class="value">${esc(row.dateTransfusion || '-')}</div></div>
      </div>
      <div class="section-title">Patient</div>
      <div class="grid">
        <div class="cell"><div class="label">Prenom et nom</div><div class="value">${esc(row.patient || '-')}</div></div>
        <div class="cell"><div class="label">Sexe / age</div><div class="value">${esc(row.sexe || '-')} / ${esc(row.age || '-')}</div></div>
        <div class="cell"><div class="label">Numero dossier</div><div class="value">${esc(row.dossier || '-')}</div></div>
        <div class="cell"><div class="label">ID Cubix</div><div class="value">${esc(row.cubix || '-')}</div></div>
        <div class="cell wide"><div class="label">Diagnostic</div><div class="value">${esc(row.diagnostic || row.protocole || '-')}</div></div>
        <div class="cell wide"><div class="label">Indication de la transfusion</div><div class="value">${esc(row.indication || `Hb ${row.hb || '-'} g/dL`)}</div></div>
      </div>
      <div class="section-title">Resultats derniere NFS et urgence</div>
      <div class="grid">
        <div class="cell"><div class="label">GB</div><div class="value">${esc(row.gb || '-')}</div></div>
        <div class="cell"><div class="label">Hemoglobine</div><div class="value">${esc(row.hb || '-')} g/dL</div></div>
        <div class="cell"><div class="label">Plaquettes</div><div class="value">${esc(row.plaquettes || '-')}</div></div>
        <div class="cell"><div class="label">Date resultat</div><div class="value">${esc(row.resultDate || '-')}</div></div>
        <div class="cell wide"><div class="label">Degre d'urgence</div><div class="value">${esc(row.urgence || 'Programmee')}</div></div>
      </div>
      <table><thead><tr><th>Groupe sanguin</th><th>Produit sanguin demande</th><th>Nombre d'unites</th></tr></thead><tbody><tr><td><b>${esc(row.groupe || '-')} ${esc(row.rhesus || '')}</b></td><td>${esc(row.produit || 'Concentres de globules rouges')}</td><td>${esc(row.culots || '1')}</td></tr></tbody></table>
      <table><thead><tr><th>Transfusions anterieures</th><th>Incidents transfusionnels</th><th>Precision</th></tr></thead><tbody><tr><td>${esc(row.antecedentTransfusion || 'Non renseigne')}</td><td>${esc(row.incidentTransfusion || 'Non renseigne')}</td><td>${esc(row.incidentPrecision || '-')}</td></tr></tbody></table>
      <div class="sign"><div><b>Nom, signature et cachet du prescripteur</b><br>Date de la demande :<div class="stamp-space"></div></div><div><b>Distribution produits sanguins</b><div class="distribution-grid"><div class="distribution-box"><div class="distribution-label">Numero de poche</div><div class="distribution-line"></div></div><div class="distribution-box"><div class="distribution-label">Date / heure</div><div class="distribution-line"></div></div><div class="distribution-box"><div class="distribution-label">Agent distributeur</div><div class="distribution-line"></div><div class="distribution-label">Signature / cachet</div><div class="distribution-line"></div></div><div class="distribution-box"><div class="distribution-label">Agent ayant recu le sang</div><div class="distribution-line"></div><div class="distribution-label">Signature</div><div class="distribution-line"></div></div></div></div></div>
      <div class="nb"><b>NB :</b> Produits a utiliser immediatement apres reception ou a retourner obligatoirement a la banque de sang. Tout accident transfusionnel doit etre signale au coordinateur du comite hospitalier de securite transfusionnelle.</div>
      </body></html>`;
    printHtml(html, '210mm', '297mm');
  };

  window.markTransfused = function(id){
    const records = transfusionRecords();
    const row = records.find(item => item.id === id);
    if(!row) return;
    if(row.dateTransfusion !== todayIso()){
      alert('Le bouton Transfuse ne peut etre active que le jour de la transfusion programmee.');
      return;
    }
    if(!confirm(`Confirmer la transfusion de ${row.patient || 'ce patient'} ?`)) return;
    row.statut = 'transfuse';
    row.transfusedAt = new Date().toISOString();
    row.archivedAt = row.transfusedAt;
    row.transfusedBy = val(currentUser().username, currentUser().nom, '');
    writeJson(STORAGE.transfusion, records);
    logAudit('Transfusion archivee', val(row.patient, row.dossier), `Hb ${val(row.hb, '-')}, date ${val(row.dateTransfusion, '-')}, culots ${val(row.culots, '1')}`);
    window.renderTransfusion?.();
    window.renderStats?.();
    showToastSafe('Transfusion archivee et ajoutee aux statistiques.', 'success');
  };

  window.renderTransfusion = function(){
    const host = document.getElementById('transfusion-content');
    if(!host) return;
    const records = transfusionRecords().sort((a,b) => String(a.statut || '').localeCompare(String(b.statut || '')) || String(a.patient || '').localeCompare(String(b.patient || '')));
    const active = records.filter(row => row.statut !== 'transfuse');
    const archived = records.filter(row => row.statut === 'transfuse');
    const today = todayIso();
    const rowHtml = row => {
      const canTransfuse = row.dateTransfusion === today && row.statut !== 'transfuse';
      return `<tr>
        <td><b>${esc(row.patient || '-')}</b><div class="dash-muted">Dossier: ${esc(row.dossier || '-')} | Code: ${esc(row.code || '-')}</div></td>
        <td>${esc(row.hb || '-')} g/dL<div class="dash-muted">${esc(row.resultDate || '-')}</div></td>
        <td>${esc(row.protocole || '-')}</td>
        <td><input type="date" value="${esc(row.dateTransfusion || '')}" onchange="updateTransfusionField('${esc(row.id)}','dateTransfusion',this.value)"></td>
        <td><select onchange="updateTransfusionField('${esc(row.id)}','groupe',this.value)"><option></option>${['A','B','AB','O'].map(g => `<option${row.groupe === g ? ' selected' : ''}>${g}</option>`).join('')}</select></td>
        <td><select onchange="updateTransfusionField('${esc(row.id)}','rhesus',this.value)"><option></option><option${row.rhesus === '+' ? ' selected' : ''}>+</option><option${row.rhesus === '-' ? ' selected' : ''}>-</option></select></td>
        <td><select onchange="updateTransfusionField('${esc(row.id)}','produit',this.value)">${['Concentres de globules rouges','Sang total','Plasma frais congele','Concentre de plaquettes standard'].map(p => `<option${(row.produit || 'Concentres de globules rouges') === p ? ' selected' : ''}>${p}</option>`).join('')}</select></td>
        <td><input type="number" min="1" value="${esc(row.culots || '1')}" onchange="updateTransfusionField('${esc(row.id)}','culots',this.value)"></td>
        <td><input value="${esc(row.indication || '')}" onchange="updateTransfusionField('${esc(row.id)}','indication',this.value)"></td>
        <td class="transfusion-actions"><button class="btn-sm" onclick="printBonSang('${esc(row.id)}')">Bon de sang</button><button class="btn-sm primary" ${canTransfuse ? '' : 'disabled'} onclick="markTransfused('${esc(row.id)}')">Transfuse</button></td>
      </tr>`;
    };
    const archivedRows = archived.map(row => `<tr><td>${esc(row.patient || '-')}</td><td>${esc(row.dossier || '-')}</td><td>${esc(row.hb || '-')}</td><td>${esc(row.dateTransfusion || '-')}</td><td>${esc(row.transfusedAt ? new Date(row.transfusedAt).toLocaleString('fr-FR') : '-')}</td></tr>`).join('');
    host.innerHTML = `
      <div class="clinical-shell transfusion-shell">
        <div class="card">
          <div class="card-header"><div class="card-num" style="background:#8B1A1A">T</div><h2>Patients en attente de transfusion</h2>${isInfirmierUser() ? '' : '<button class="btn-secondary transfusion-add-btn" onclick="addManualTransfusionPatient()">Ajouter patient</button>'}</div>
          <div class="card-body">
            <div class="stats-final-note">Les patients apparaissent automatiquement ici quand la biologie enregistree contient Hb &lt; 9 g/dL. L'ajout manuel ouvre un formulaire complet inspire du bon de demande de produits sanguins labiles.</div>
            <div class="dash-table-wrap"><table class="dash-table transfusion-table"><thead><tr><th>Patient</th><th>Hb</th><th>Protocole</th><th>Date transfusion</th><th>Groupe</th><th>Rh</th><th>Produit</th><th>Unites</th><th>Indication</th><th>Actions</th></tr></thead><tbody>${active.map(rowHtml).join('') || '<tr><td colspan="10" class="dash-empty">Aucun patient avec Hb inferieure a 9 g/dL.</td></tr>'}</tbody></table></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h2>Archives transfusion</h2></div>
          <div class="card-body dash-table-wrap"><table class="dash-table"><thead><tr><th>Patient</th><th>Dossier</th><th>Hb</th><th>Date prevue</th><th>Archive le</th></tr></thead><tbody>${archivedRows || '<tr><td colspan="5" class="dash-empty">Aucune transfusion archivee.</td></tr>'}</tbody></table></div>
        </div>
      </div>`;
  };

  window.addManualTransfusionPatient = function(){
    openTransfusionPatientModal();
  };

  function consultRdvList(){
    return readJson('chncak_consultation_rdv', []);
  }

  function writeConsultRdv(list){
    writeJson('chncak_consultation_rdv', list);
  }

  function consultationDateLabel(dateIso){
    if(!dateIso) return '-';
    const d = new Date(`${dateIso}T00:00:00`);
    return isNaN(d) ? dateIso : d.toLocaleDateString('fr-FR', {weekday:'long', day:'2-digit', month:'long', year:'numeric'});
  }

  function consultationDoctorOptions(selected){
    const meds = readJson('chncak_medecins', window.medecins || []);
    const names = Array.from(new Set(meds.map(m => val(m.name, `Dr ${val(m.prenom)} ${val(m.nom)}`.replace(/\s+/g, ' ').trim())).filter(Boolean)));
    return '<option value="">Choisir</option>' + names.map(name => `<option value="${esc(name)}" ${name === selected ? 'selected' : ''}>${esc(name)}</option>`).join('');
  }

  function consultationMotifOptions(selected){
    const motifs = ['Consultation', "Resultats d'analyse", 'Radiotherapie', 'Evaluation', 'Onco-chirurgie', 'Chimiotherapie', 'Reference', 'Recommande', 'Autres a preciser'];
    return '<option value="">Choisir</option>' + motifs.map(name => `<option value="${esc(name)}" ${name === selected ? 'selected' : ''}>${esc(name)}</option>`).join('');
  }

  window.toggleConsultationMotifPrecision = function(){
    const row = document.getElementById('consult-motif-precision-row');
    const motif = document.getElementById('consult-motif')?.value || '';
    if(row) row.style.display = motif === 'Autres a preciser' ? '' : 'none';
  };

  function consultationRows(list, withPrint){
    const canEdit = isSecretaireUser();
    const today = todayIso();
    const isDone = row => norm(val(row.statut, row.status)).includes('consulte') || !!row.consultedAt;
    return list.sort((a,b) => String(a.dateRdv || '').localeCompare(String(b.dateRdv || '')) || String(a.medecin || '').localeCompare(String(b.medecin || '')) || String(a.nom || '').localeCompare(String(b.nom || ''))).map(row => `
      <tr>
        <td>${esc(consultationDateLabel(row.dateRdv))}</td>
        <td><b>${esc(val(row.prenom))} ${esc(val(row.nom))}</b><div class="dash-muted">${esc(row.typePatient === 'ancien' ? 'Ancien patient' : 'Nouveau patient')} | ${esc(val(row.contact, '-'))}${row.localisation ? ` | Localisation: ${esc(row.localisation)}` : ''}${isDone(row) ? ' | Consulte' : ''}</div></td>
        <td>${esc(val(row.adresse, '-'))}</td>
        <td>${esc(val(row.medecin, '-'))}</td>
        <td>${esc(val(row.motifPrecision, row.motif, '-'))}</td>
        ${withPrint ? `<td><button class="btn-sm" onclick="printConsultationRdv('${esc(row.id)}')">Imprimer bon RDV</button>${canEdit ? `<button class="btn-sm" style="margin-left:5px" onclick="openConsultationRdvModal('${esc(row.id)}')">Modifier</button><button class="btn-sm" style="margin-left:5px" onclick="deleteConsultationRdv('${esc(row.id)}')">Supprimer</button><button class="btn-sm" style="margin-left:5px" ${row.dateRdv === today && !isDone(row) ? '' : 'disabled'} onclick="markConsultationDone('${esc(row.id)}')">Consulte</button>` : ''}</td>` : ''}
      </tr>`).join('');
  }

  window.renderRdvConsultation = function(){
    const host = document.getElementById('rdv-consultation-content');
    if(!host) return;
    const today = todayIso();
    const list = consultRdvList();
    host.innerHTML = `
      <div class="clinical-shell consultation-shell">
        <div class="card">
          <div class="card-header"><div class="card-num" style="background:#12395b">C</div><h2>RDV Consultations</h2><button class="btn-secondary" onclick="openConsultationRdvModal()">Ajouter patient</button></div>
          <div class="card-body">
            <div class="stats-final-note">Circuit reserve aux consultations : ces rendez-vous sont separes du programme de chimiotherapie.</div>
            <div class="consult-filter-bar">
              <label>Date <input type="date" id="consult-filter-date" value="${today}" oninput="renderRdvConsultationList()"></label>
              <label>Medecin traitant <select id="consult-filter-medecin" onchange="renderRdvConsultationList()">${consultationDoctorOptions('')}</select></label>
            </div>
            <div id="consult-rdv-table"></div>
          </div>
        </div>
      </div>`;
    renderRdvConsultationList();
  };

  window.renderRdvConsultationList = function(){
    const host = document.getElementById('consult-rdv-table');
    if(!host) return;
    const date = document.getElementById('consult-filter-date')?.value || '';
    const med = norm(document.getElementById('consult-filter-medecin')?.value || '');
    const list = consultRdvList().filter(row => (!date || row.dateRdv === date) && (!med || norm(row.medecin).includes(med)));
    const isDone = row => norm(val(row.statut, row.status)).includes('consulte') || !!row.consultedAt;
    const actifs = list.filter(row => !isDone(row));
    const archives = list.filter(isDone);
    host.innerHTML = `
      <div class="dash-table-wrap"><table class="dash-table"><thead><tr><th>Date</th><th>Patient</th><th>Adresse</th><th>Medecin traitant</th><th>Motif</th><th>Actions</th></tr></thead><tbody>${consultationRows(actifs, true) || '<tr><td colspan="6" class="dash-empty">Aucun rendez-vous de consultation en attente.</td></tr>'}</tbody></table></div>
      <h3 style="margin:18px 0 8px">Archives consultations</h3>
      <div class="dash-table-wrap"><table class="dash-table"><thead><tr><th>Date</th><th>Patient</th><th>Adresse</th><th>Medecin traitant</th><th>Motif</th><th>Actions</th></tr></thead><tbody>${consultationRows(archives, true) || '<tr><td colspan="6" class="dash-empty">Aucune consultation archivee.</td></tr>'}</tbody></table></div>`;
  };

  window.openConsultationRdvModal = function(id){
    document.getElementById('consult-rdv-modal')?.remove();
    const existing = id ? consultRdvList().find(row => row.id === id) : null;
    const modal = document.createElement('div');
    modal.id = 'consult-rdv-modal';
    modal.className = 'secure-code-modal consult-modal';
    modal.dataset.editId = existing?.id || '';
    modal.innerHTML = `
      <div class="secure-code-backdrop" onclick="closeConsultationRdvModal()"></div>
      <div class="secure-code-card consult-card">
        <h3>${existing ? 'Modifier rendez-vous de consultation' : 'Ajouter rendez-vous de consultation'}</h3>
        <p>Renseigner le patient et le medecin traitant pour le bon de rendez-vous.</p>
        <div class="transfusion-form-grid consult-form-grid">
          <label>Nom<input id="consult-nom" placeholder="ex: NDIAYE" value="${esc(existing?.nom || '')}"></label>
          <label>Prenom<input id="consult-prenom" placeholder="ex: Awa" value="${esc(existing?.prenom || '')}"></label>
          <label>Contact<input id="consult-contact" placeholder="ex: 77 000 00 00" value="${esc(existing?.contact || '')}"></label>
          <label>Adresse<input id="consult-adresse" placeholder="ex: Touba" value="${esc(existing?.adresse || '')}"></label>
          <label>Nouveau / Ancien<select id="consult-type"><option value="nouveau" ${existing?.typePatient !== 'ancien' ? 'selected' : ''}>Nouveau patient</option><option value="ancien" ${existing?.typePatient === 'ancien' ? 'selected' : ''}>Ancien patient</option></select></label>
          <label class="signup-wide">Medecin traitant<select id="consult-medecin">${consultationDoctorOptions(existing?.medecin || '')}</select></label>
          <label>Date rendez-vous<input id="consult-date" type="date" value="${esc(existing?.dateRdv || todayIso())}"></label>
          <label>Motif <span class="field-hint">facultatif</span><select id="consult-motif" onchange="toggleConsultationMotifPrecision()">${consultationMotifOptions(existing?.motif || '')}</select></label>
          <label id="consult-motif-precision-row" class="signup-wide" style="display:${existing?.motif === 'Autres a preciser' ? '' : 'none'}">Autre motif<input id="consult-motif-precision" placeholder="Preciser le motif" value="${esc(existing?.motifPrecision || '')}"></label>
          <label class="signup-wide">Localisation / diagnostic <span class="field-hint">facultatif</span><input id="consult-localisation" placeholder="Facultatif : localisation ou diagnostic si connu" value="${esc(existing?.localisation || '')}"></label>
        </div>
        <div class="secure-code-actions"><button onclick="closeConsultationRdvModal()">Annuler</button><button onclick="saveConsultationRdv()">${existing ? 'Modifier' : 'Enregistrer'}</button></div>
      </div>`;
    document.body.appendChild(modal);
  };

  window.closeConsultationRdvModal = function(){
    document.getElementById('consult-rdv-modal')?.remove();
  };

  window.saveConsultationRdv = function(){
    const get = id => document.getElementById(id)?.value?.trim() || '';
    const editId = document.getElementById('consult-rdv-modal')?.dataset.editId || '';
    const list = consultRdvList();
    const previous = editId ? list.find(row => row.id === editId) : null;
    const item = {
      id: editId || `CONS-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nom: get('consult-nom'),
      prenom: get('consult-prenom'),
      contact: get('consult-contact'),
      adresse: get('consult-adresse'),
      typePatient: get('consult-type') || 'nouveau',
      medecin: get('consult-medecin'),
      dateRdv: get('consult-date'),
      motif: get('consult-motif'),
      motifPrecision: get('consult-motif-precision'),
      localisation: get('consult-localisation'),
      statut: previous?.statut || previous?.status || 'programme',
      consultedAt: previous?.consultedAt || '',
      consultedBy: previous?.consultedBy || '',
      createdAt: previous?.createdAt || new Date().toISOString(),
      createdBy: previous?.createdBy || val(currentUser().username, currentUser().name, '')
    };
    if(!item.nom || !item.prenom || !item.contact || !item.medecin || !item.dateRdv){
      alert('Nom, prenom, contact, medecin traitant et date de rendez-vous sont obligatoires.');
      return;
    }
    if(editId){
      const idx = list.findIndex(row => row.id === editId);
      if(idx >= 0) list[idx] = {...list[idx], ...item, updatedAt:new Date().toISOString(), updatedBy:val(currentUser().username, currentUser().name, '')};
      else list.unshift(item);
    } else {
      list.unshift(item);
    }
    writeConsultRdv(list);
    logAudit(editId ? 'RDV consultation modifie' : 'RDV consultation ajoute', `${item.prenom} ${item.nom}`, `${item.dateRdv} - ${item.medecin}`);
    closeConsultationRdvModal();
    renderRdvConsultation();
    renderConsultationProgrammePanel();
    window.renderDashboard?.();
    showToastSafe('Rendez-vous de consultation enregistre.', 'success');
  };

  window.deleteConsultationRdv = function(id){
    if(!isSecretaireUser()){
      alert('Suppression reservee au compte secretaire.');
      return;
    }
    const item = consultRdvList().find(row => row.id === id);
    if(!item) return;
    if(!confirm(`Supprimer le rendez-vous de ${item.prenom} ${item.nom} ?`)) return;
    writeConsultRdv(consultRdvList().filter(row => row.id !== id));
    logAudit('RDV consultation supprime', `${item.prenom} ${item.nom}`, val(item.dateRdv));
    renderRdvConsultation();
    renderConsultationProgrammePanel();
    window.renderDashboard?.();
  };

  window.markConsultationDone = function(id){
    if(!isSecretaireUser()){
      alert('Action reservee au compte secretaire.');
      return;
    }
    const list = consultRdvList();
    const idx = list.findIndex(row => row.id === id);
    if(idx < 0) return alert('Rendez-vous introuvable.');
    const row = list[idx];
    if(row.dateRdv !== todayIso()){
      alert('Le bouton Consulte ne peut etre active que le jour de la consultation.');
      return;
    }
    if(norm(val(row.statut, row.status)).includes('consulte') || row.consultedAt){
      alert('Cette consultation est deja archivee.');
      return;
    }
    let localisation = val(row.localisation);
    if(!localisation){
      localisation = prompt('Localisation / diagnostic obligatoire avant de valider la consultation :', '');
      if(!String(localisation || '').trim()){
        alert('La localisation ou le diagnostic doit etre renseigne avant de valider.');
        return;
      }
    }
    list[idx] = {
      ...row,
      localisation: String(localisation).trim(),
      statut: 'consulte',
      consultedAt: new Date().toISOString(),
      consultedBy: val(currentUser().username, currentUser().name, 'secretaire')
    };
    writeConsultRdv(list);
    logAudit('Consultation archivee', `${val(row.prenom)} ${val(row.nom)}`, val(row.dateRdv));
    renderRdvConsultationList();
    renderConsultationProgrammePanel();
    window.renderDashboard?.();
    window.renderStats?.();
    showToastSafe('Patient marque consulte et archive.', 'success');
  };

  window.printConsultationRdv = function(id){
    const row = consultRdvList().find(item => item.id === id);
    if(!row) return alert('Rendez-vous introuvable.');
    const logo = document.querySelector('.nav-logo img')?.src || '';
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Bon rendez-vous consultation</title>
      <style>@page{size:A5 landscape;margin:10mm}body{font-family:Arial,sans-serif;color:#111;margin:0;font-size:13px}.head{display:grid;grid-template-columns:58px 1fr;gap:10px;align-items:center;border-bottom:2px solid #0A3D7A;padding-bottom:8px;margin-bottom:14px}.head img{width:54px;height:54px;object-fit:contain}.head div{text-align:center;line-height:1.25}h1{text-align:center;color:#0A3D7A;font-size:20px;margin:10px 0 16px;text-transform:uppercase}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.box{border:1px solid #9db6d3;border-radius:6px;padding:9px;min-height:46px}.label{font-size:10px;color:#607080;text-transform:uppercase;font-weight:800}.value{font-size:16px;font-weight:800;margin-top:5px}.note{margin-top:14px;border:1px solid #F0C060;background:#FFF8E8;padding:9px;font-size:12px}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>
      </head><body><div class="head"><img src="${logo}"><div>Centre Hospitalier National Cheikh Ahmadoul Khadim - Touba<br><b>Service d'Oncologie-Radiotherapie</b></div></div><h1>Bon de rendez-vous consultation</h1><div class="grid"><div class="box"><div class="label">Patient</div><div class="value">${esc(row.prenom)} ${esc(row.nom)}</div></div><div class="box"><div class="label">Type</div><div class="value">${esc(row.typePatient === 'ancien' ? 'Ancien patient' : 'Nouveau patient')}</div></div><div class="box"><div class="label">Contact</div><div class="value">${esc(row.contact)}</div></div><div class="box"><div class="label">Adresse</div><div class="value">${esc(row.adresse || '-')}</div></div><div class="box"><div class="label">Medecin traitant</div><div class="value">${esc(row.medecin)}</div></div><div class="box"><div class="label">Motif</div><div class="value">${esc(val(row.motifPrecision, row.motif, '-'))}</div></div><div class="box"><div class="label">Localisation / diagnostic</div><div class="value">${esc(row.localisation || '-')}</div></div><div class="box"><div class="label">Date rendez-vous</div><div class="value">${esc(consultationDateLabel(row.dateRdv))}</div></div></div><div class="note">Merci de venir avec vos documents medicaux et d'arriver avant l'heure de consultation.</div></body></html>`;
    printHtml(html, '210mm', '148mm');
  };

  window.renderConsultationProgrammePanel = function(){
    const page = document.getElementById('page-programme');
    if(!page) return;
    let host = document.getElementById('consult-programme-panel');
    if(!host){
      host = document.createElement('div');
      host.id = 'consult-programme-panel';
      const container = page.querySelector('div[style*="max-width"]') || page;
      container.prepend(host);
    }
    const date = document.getElementById('consult-programme-date')?.value || '';
    const med = norm(document.getElementById('consult-programme-medecin')?.value || '');
    const rows = consultRdvList().filter(row => (!date || row.dateRdv === date) && (!med || norm(row.medecin).includes(med)));
    host.innerHTML = `
      <div class="card consultation-program-card" style="margin-bottom:12px">
        <div class="card-header"><h2>Programme des consultations</h2></div>
        <div class="card-body">
          <div class="consult-filter-bar">
            <label>Date <input type="date" id="consult-programme-date" value="${esc(date)}" oninput="renderConsultationProgrammePanel()"></label>
            <label>Medecin traitant <select id="consult-programme-medecin" onchange="renderConsultationProgrammePanel()">${consultationDoctorOptions(document.getElementById('consult-programme-medecin')?.value || '')}</select></label>
          </div>
          <div class="dash-table-wrap"><table class="dash-table"><thead><tr><th>Date</th><th>Patient</th><th>Adresse</th><th>Medecin traitant</th><th>Motif</th></tr></thead><tbody>${consultationRows(rows, false) || '<tr><td colspan="5" class="dash-empty">Aucune consultation programmee.</td></tr>'}</tbody></table></div>
        </div>
      </div>`;
  };

  function openTransfusionPatientModal(){
    const patients = readJson(STORAGE.patients, []);
    document.getElementById('transfusion-patient-modal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'transfusion-patient-modal';
    modal.className = 'secure-code-modal transfusion-modal';
    const rows = patients.slice(0, 80).map((p, index) => `
      <tr onclick="selectTransfusionPatient(${index})">
        <td><b>${esc(patientName(p) || '-')}</b><div class="dash-muted">${esc(val(p.dossier, p.numeroDossier, '-'))}</div></td>
        <td>${esc(patientCode(p) || '-')}</td>
        <td>${esc(val(p.cubix, p.idCubix, '-'))}</td>
        <td>${esc(protocolNameFor(p) || '-')}</td>
        <td>${esc(val(p.groupeSanguin, p.groupe, '-'))}</td>
      </tr>`).join('');
    modal.innerHTML = `
      <div class="secure-code-backdrop" onclick="closeTransfusionPatientModal()"></div>
      <div class="secure-code-card transfusion-card">
        <h3>Ajouter patient transfusion</h3>
        <p>Selectionner un patient existant ou renseigner directement les champs du bon de sang.</p>
        <input id="transfusion-patient-search" class="transfusion-search" placeholder="Rechercher nom, dossier, code gratuite..." oninput="filterTransfusionPatientRows()">
        <div class="dash-table-wrap transfusion-patient-list">
          <table class="dash-table"><thead><tr><th>Patient</th><th>Code</th><th>ID Cubix</th><th>Protocole</th><th>Groupe</th></tr></thead><tbody id="transfusion-patient-rows">${rows || '<tr><td colspan="5" class="dash-empty">Aucun patient enregistre.</td></tr>'}</tbody></table>
        </div>
        <div class="transfusion-form-grid">
          <label>Patient<input id="trf-patient" placeholder="ex: Awa NDIAYE"></label>
          <label>Dossier<input id="trf-dossier" placeholder="ex: D-2026-001"></label>
          <label>ID Cubix<input id="trf-cubix" placeholder="ex: CUB-0001"></label>
          <label>Code gratuite<input id="trf-code" placeholder="ex: GR-0001"></label>
          <label>Sexe<select id="trf-sexe"><option></option><option>F</option><option>M</option></select></label>
          <label>Age<input id="trf-age" placeholder="ex: 45 ans"></label>
          <label>Groupe<select id="trf-groupe"><option></option><option>A</option><option>B</option><option>AB</option><option>O</option></select></label>
          <label>Rh<select id="trf-rhesus"><option></option><option>+</option><option>-</option></select></label>
          <label>Hb<input id="trf-hb" placeholder="ex: 8.2"></label>
          <label>GB<input id="trf-gb" placeholder="ex: 4500"></label>
          <label>Plaquettes<input id="trf-plaquettes" placeholder="ex: 180000"></label>
          <label>Date resultat<input id="trf-result-date" type="date" value="${todayIso()}"></label>
          <label>Urgence<select id="trf-urgence"><option>Programmee</option><option>Urgent &lt; 1h</option><option>Urgent 2 a 8h</option></select></label>
          <label>Date transfusion<input id="trf-date" type="date"></label>
          <label>Produit<select id="trf-produit"><option>Concentres de globules rouges</option><option>Sang total</option><option>Plasma frais congele</option><option>Concentre de plaquettes standard</option></select></label>
          <label>Nombre unites<input id="trf-culots" type="number" min="1" value="1"></label>
          <label class="signup-wide">Diagnostic<input id="trf-diagnostic" placeholder="ex: Cancer du sein sous chimiotherapie"></label>
          <label class="signup-wide">Indication<input id="trf-indication" placeholder="ex: Anemie symptomatique Hb 8 g/dL"></label>
          <label>Transfusion anterieure<select id="trf-antecedent"><option>Non renseigne</option><option>Oui</option><option>Non</option></select></label>
          <label>Incident transfusionnel<select id="trf-incident"><option>Non renseigne</option><option>Oui</option><option>Non</option></select></label>
          <label class="signup-wide">Precision incident<input id="trf-incident-precision" placeholder="ex: frissons, fievre..."></label>
          <label>Lit<input id="trf-lit" placeholder="ex: Lit 3"></label>
        </div>
        <div class="secure-code-actions"><button onclick="closeTransfusionPatientModal()">Annuler</button><button onclick="saveTransfusionPatientFromModal()">Ajouter</button></div>
      </div>`;
    document.body.appendChild(modal);
    modal._patients = patients;
  }

  window.closeTransfusionPatientModal = function(){
    document.getElementById('transfusion-patient-modal')?.remove();
  };

  window.filterTransfusionPatientRows = function(){
    const modal = document.getElementById('transfusion-patient-modal');
    const q = norm(document.getElementById('transfusion-patient-search')?.value || '');
    const rows = Array.from(modal?.querySelectorAll('#transfusion-patient-rows tr') || []);
    rows.forEach(row => { row.style.display = !q || norm(row.textContent).includes(q) ? '' : 'none'; });
  };

  window.selectTransfusionPatient = function(index){
    const patients = document.getElementById('transfusion-patient-modal')?._patients || [];
    const p = patients[index];
    if(!p) return;
    const group = String(val(p.groupeSanguin, p.groupe, ''));
    const set = (id, value) => { const el = document.getElementById(id); if(el) el.value = value || ''; };
    set('trf-patient', patientName(p));
    set('trf-dossier', val(p.dossier, p.numeroDossier));
    set('trf-cubix', val(p.cubix, p.idCubix));
    set('trf-code', patientCode(p));
    set('trf-sexe', val(p.sexe));
    set('trf-age', val(p.age));
    set('trf-groupe', group.replace(/[+-]/g, ''));
    set('trf-rhesus', group.includes('-') ? '-' : (group.includes('+') ? '+' : ''));
    set('trf-diagnostic', val(p.diagnostic, p.localisation, p.localisations));
    set('trf-indication', 'Anemie sous traitement');
  };

  window.saveTransfusionPatientFromModal = function(){
    const get = id => document.getElementById(id)?.value?.trim() || '';
    const name = get('trf-patient');
    if(!name){
      alert('Patient obligatoire.');
      return;
    }
    const records = transfusionRecords();
    records.unshift({
      id: `TRF-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      key: `manual|${Date.now()}`,
      patient: name,
      dossier: get('trf-dossier'),
      code: get('trf-code'),
      cubix: get('trf-cubix'),
      protocole: '',
      sexe: get('trf-sexe'),
      age: get('trf-age'),
      hb: get('trf-hb'),
      gb: get('trf-gb'),
      plaquettes: get('trf-plaquettes'),
      resultDate: get('trf-result-date') || todayIso(),
      dateTransfusion: get('trf-date'),
      groupe: get('trf-groupe'),
      rhesus: get('trf-rhesus'),
      culots: get('trf-culots') || '1',
      produit: get('trf-produit') || 'Concentres de globules rouges',
      urgence: get('trf-urgence') || 'Programmee',
      diagnostic: get('trf-diagnostic'),
      indication: get('trf-indication') || (get('trf-hb') ? `Hb ${get('trf-hb')} g/dL` : 'Transfusion a programmer'),
      antecedentTransfusion: get('trf-antecedent'),
      incidentTransfusion: get('trf-incident'),
      incidentPrecision: get('trf-incident-precision'),
      lit: get('trf-lit'),
      statut: 'a_programmer',
      source: 'ajout manuel',
      createdAt: new Date().toISOString()
    });
    writeJson(STORAGE.transfusion, records);
    logAudit('Ajout manuel transfusion', name, `Hb ${get('trf-hb') || '-'}, groupe ${get('trf-groupe') || '-'}${get('trf-rhesus') || ''}`);
    closeTransfusionPatientModal();
    window.renderTransfusion?.();
  };

  function auditRows(){
    const query = norm(document.getElementById('audit-search')?.value || '');
    const list = readJson(STORAGE.audit, []);
    return list.filter(row => {
      if(!query) return true;
      return [row.date, row.actor, row.role, row.action, row.target, row.details].some(value => norm(value).includes(query));
    });
  }

  window.renderAuditLogPanel = function(){
    const host = document.getElementById('audit-log-panel');
    if(!host) return;
    const rows = auditRows();
    host.innerHTML = `
      <div class="card">
        <div class="card-header"><h2>Audit / Journal</h2><div class="audit-actions"><input id="audit-search" placeholder="Rechercher action, patient, utilisateur..." oninput="renderAuditLogPanel()" value="${esc(document.getElementById('audit-search')?.value || '')}"><button class="btn-secondary official-github-mini" onclick="exportAuditLog()">Exporter journal</button>${isAdminUser() ? '<button class="btn-secondary official-github-mini" onclick="clearAuditLog()">Vider journal</button>' : ''}</div></div>
        <div class="card-body dash-table-wrap">
          <table class="dash-table audit-table">
            <thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Cible</th><th>Details</th></tr></thead>
            <tbody>${rows.map(row => `<tr><td>${esc(row.date || row.dateTs || '-')}</td><td><b>${esc(row.actor || '-')}</b><div class="dash-muted">${esc(row.role || '')}</div></td><td>${esc(row.action || '-')}</td><td>${esc(row.target || '-')}</td><td>${esc(row.details || '-')}</td></tr>`).join('') || '<tr><td colspan="5" class="dash-empty">Aucune action sensible enregistree pour le moment.</td></tr>'}</tbody>
          </table>
        </div>
      </div>`;
  };

  window.exportAuditLog = function(){
    const rows = readJson(STORAGE.audit, []);
    downloadTextFile(`Journal_Audit_ChimioPro_${todayIso()}.json`, JSON.stringify(rows, null, 2), 'application/json;charset=utf-8');
    logAudit('Export journal audit', 'Maintenance', `${rows.length} lignes exportees`);
    showToastSafe('Journal audit exporte.', 'success');
  };

  window.clearAuditLog = function(){
    requireAdminAction('vider le journal audit', () => {
      const previous = readJson(STORAGE.audit, []).length;
      writeJson(STORAGE.audit, []);
      logAudit('Journal audit vide', 'Maintenance', `${previous} anciennes lignes effacees`);
      renderAuditLogPanel();
    });
  };

  function signupAllowedTabs(role){
    if(role === 'admin') return ['dashboard','protocole','okchimio','medecins','stats','pharmacie','apercu','preparation','support','suivi','biologie','hematologie','transfusion','maintenance','programme','rdvconsultation','patients','rdv'];
    if(role === 'pharmacien') return ['dashboard','pharmacie','stats','preparation','rdv'];
    if(role === 'infirmier') return ['dashboard','transfusion','rdv','apercu','support','suivi','stats','programme','patients'];
    if(role === 'biologiste') return ['dashboard','transfusion','stats','programme'];
    if(role === 'secretaire') return ['dashboard','rdvconsultation','programme'];
    return ['dashboard','protocole','okchimio','medecins','apercu','preparation','support','suivi','biologie','hematologie','transfusion','stats','programme','patients','rdv'];
  }

  function readRegistrations(){
    return readJson('chncak_user_registrations', []);
  }

  function writeRegistrations(list){
    writeJson('chncak_user_registrations', list);
  }

  function readApprovedUsers(){
    return readJson('chncak_approved_users', []);
  }

  function writeApprovedUsers(list){
    writeJson('chncak_approved_users', list);
    try { window.refreshDynamicUsers?.(); } catch(e) {}
  }

  window.changeAdminAccessCode = function(){
    requireAdminAction('changer le code admin', () => {
      const next = prompt('Nouveau code admin a 4 chiffres :', '');
      if(next === null) return;
      if(!/^\d{4}$/.test(next.trim())){
        alert('Le code doit contenir exactement 4 chiffres.');
        return;
      }
      const confirmNext = prompt('Confirmer le nouveau code admin :', '');
      if(confirmNext === null) return;
      if(confirmNext.trim() !== next.trim()){
        alert('Les deux codes ne sont pas identiques.');
        return;
      }
      localStorage.setItem(ADMIN_CODE_KEY, next.trim());
      logAudit('Code admin modifie', 'Maintenance', 'Nouveau code admin enregistre localement.');
      renderRegistrationsPanel();
      showToastSafe('Code admin modifie.', 'success');
    });
  };

  window.deleteApprovedUser = function(username){
    requireAdminAction('supprimer ce compte utilisateur', () => {
      const approved = readApprovedUsers();
      const user = approved.find(u => norm(u.username) === norm(username));
      if(!user){
        alert('Compte introuvable.');
        return;
      }
      if(!confirm(`Supprimer le compte ${user.username} ? Cette action retire son acces local.`)) return;
      writeApprovedUsers(approved.filter(u => norm(u.username) !== norm(username)));
      logAudit('Compte utilisateur supprime', user.username, `${val(user.prenom)} ${val(user.nom)} - role ${val(user.role)}`);
      renderRegistrationsPanel();
      showToastSafe('Compte utilisateur supprime.', 'success');
    });
  };

  window.toggleAdminSignup = function(){
    requireAdminAction('changer autorisation inscription admin', () => {
      const next = !adminSignupAllowed();
      localStorage.setItem(ADMIN_SIGNUP_KEY, next ? '1' : '0');
      logAudit('Autorisation inscription admin', 'Maintenance', next ? 'Inscription admin autorisee' : 'Inscription admin desactivee');
      renderRegistrationsPanel();
      showToastSafe(next ? 'Inscription Admin autorisee temporairement.' : 'Inscription Admin desactivee.', 'success');
    });
  };

  window.openSignupModal = function(){
    document.getElementById('signup-modal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'signup-modal';
    modal.className = 'secure-code-modal signup-modal';
    const roleOptions = [
      '<option value="medecin">Medecin</option>',
      '<option value="pharmacien">Pharmacien</option>',
      '<option value="infirmier">Infirmier</option>',
      '<option value="biologiste">Biologiste</option>',
      '<option value="secretaire">Secretaire</option>',
      adminSignupAllowed() ? '<option value="admin">Admin</option>' : ''
    ].join('');
    modal.innerHTML = `
      <div class="secure-code-backdrop" onclick="closeSignupModal()"></div>
      <div class="secure-code-card signup-card">
        <h3>Inscription utilisateur</h3>
        <p>Le collegue depose une demande interne. La validation Maintenance ne cree pas le compte Supabase : l'administrateur doit ensuite creer le meme email dans Supabase Authentication avec le role correspondant.</p>
        <div class="signup-grid">
          <label>Nom<input id="signup-nom" placeholder="ex: NDIAYE"></label>
          <label>Prenom<input id="signup-prenom" placeholder="ex: Awa"></label>
          <label>Contact<input id="signup-contact" placeholder="ex: 77 000 00 00"></label>
          <label>Adresse mail<input id="signup-email" type="email" placeholder="ex: awa.ndiaye@chncak.sn"></label>
          <label>Specialite<input id="signup-specialite" placeholder="ex: Soins infirmiers"></label>
          <label>Type de compte<select id="signup-role">${roleOptions}</select></label>
          <label>Identifiant<input id="signup-username" placeholder="ex: awa.ndiaye"></label>
          <label>Mot de passe souhaite<input id="signup-password" type="password" placeholder="Temporaire Supabase"></label>
          <label class="signup-wide">Autorisation admin<select id="signup-auth-mode"><option value="pending">Demande a valider par admin</option><option value="code">J'ai le code admin</option></select></label>
          <label class="signup-wide" id="signup-code-row" style="display:none">Code admin<input id="signup-admin-code" type="password" inputmode="numeric" maxlength="4" placeholder="****"></label>
        </div>
        <div class="secure-code-error" id="signup-error"></div>
        <div class="secure-code-actions"><button onclick="closeSignupModal()">Annuler</button><button onclick="submitSignupRequest()">Envoyer</button></div>
      </div>`;
    document.body.appendChild(modal);
    const mode = document.getElementById('signup-auth-mode');
    mode.onchange = () => { document.getElementById('signup-code-row').style.display = mode.value === 'code' ? '' : 'none'; };
  };

  window.closeSignupModal = function(){
    document.getElementById('signup-modal')?.remove();
  };

  window.submitSignupRequest = function(){
    const get = id => document.getElementById(id)?.value?.trim() || '';
    const nom = get('signup-nom');
    const prenom = get('signup-prenom');
    const username = get('signup-username');
    const password = get('signup-password');
    const email = get('signup-email');
    const role = get('signup-role') || 'medecin';
    const error = document.getElementById('signup-error');
    if(role === 'admin' && !adminSignupAllowed()){
      if(error) error.textContent = 'Inscription Admin non autorisee pour le moment. Activez-la dans Maintenance si necessaire.';
      return;
    }
    if(!nom || !prenom || !email || !password){
      if(error) error.textContent = 'Nom, prenom, email Supabase et mot de passe temporaire sont obligatoires.';
      return;
    }
    if(!email.includes('@')){
      if(error) error.textContent = 'Adresse mail invalide. Utiliser un email Supabase.';
      return;
    }
    const loginName = username || email;
    const approved = readApprovedUsers();
    const registrations = readRegistrations();
    const exists = approved.some(u => norm(u.username) === norm(loginName) || norm(u.email) === norm(email)) || registrations.some(u => (norm(u.username) === norm(loginName) || norm(u.email) === norm(email)) && u.status !== 'rejected');
    if(exists){
      if(error) error.textContent = 'Ce nom utilisateur existe deja ou est deja en attente.';
      return;
    }
    const request = {
      id: `USR-${Date.now()}`,
      nom, prenom, username: loginName, password, role,
      contact: get('signup-contact'),
      email,
      specialite: get('signup-specialite'),
      status: 'pending',
      requestedAt: new Date().toISOString()
    };
    const hasAdminCode = get('signup-auth-mode') === 'code' && get('signup-admin-code') === getAdminCode();
    if(get('signup-auth-mode') === 'code' && !hasAdminCode){
      if(error) error.textContent = 'Code admin incorrect. Choisissez demande a valider ou contactez admin.';
      return;
    }
    if(hasAdminCode){
      request.status = 'approved';
      request.approvedAt = new Date().toISOString();
      request.approvedBy = 'code admin';
      approved.push({...request, allowedTabs: signupAllowedTabs(role)});
      writeApprovedUsers(approved);
      logAudit('Demande inscription approuvee localement', loginName, `${prenom} ${nom} - role ${role}`);
      alert(`Demande validee localement.\n\nEtape obligatoire: creer maintenant l'utilisateur dans Supabase Authentication avec l'email ${email}, puis mettre raw_user_meta_data: {"role":"${role}"}.\n\nLe collegue ne pourra pas se connecter avant cette creation Supabase.`);
    } else {
      registrations.unshift(request);
      writeRegistrations(registrations);
      logAudit('Demande inscription', loginName, `${prenom} ${nom} - role ${role}`);
      alert('Demande envoyee. Un administrateur doit la valider dans Maintenance.');
    }
    closeSignupModal();
    renderRegistrationsPanel();
  };

  window.approveRegistration = function(id){
    requireAdminAction('valider cette inscription', () => {
      const regs = readRegistrations();
      const idx = regs.findIndex(r => r.id === id);
      if(idx < 0) return;
      regs[idx].status = 'approved';
      regs[idx].approvedAt = new Date().toISOString();
      regs[idx].approvedBy = actorLabel();
      writeRegistrations(regs);
      const approved = readApprovedUsers();
      if(!approved.some(u => norm(u.username) === norm(regs[idx].username))){
        approved.push({...regs[idx], allowedTabs: signupAllowedTabs(regs[idx].role)});
        writeApprovedUsers(approved);
      }
      logAudit('Inscription validee', regs[idx].username, `${regs[idx].prenom} ${regs[idx].nom} - role ${regs[idx].role}`);
      renderRegistrationsPanel();
      alert(`Demande validee localement.\n\nEtape obligatoire: creer maintenant l'utilisateur dans Supabase Authentication avec l'email ${regs[idx].email || regs[idx].username}, puis mettre raw_user_meta_data: {"role":"${regs[idx].role || 'medecin'}"}.\n\nLe collegue ne pourra pas se connecter avant cette creation Supabase.`);
    });
  };

  window.rejectRegistration = function(id){
    requireAdminAction('refuser cette inscription', () => {
      const regs = readRegistrations();
      const idx = regs.findIndex(r => r.id === id);
      if(idx < 0) return;
      regs[idx].status = 'rejected';
      regs[idx].rejectedAt = new Date().toISOString();
      regs[idx].rejectedBy = actorLabel();
      writeRegistrations(regs);
      logAudit('Inscription refusee', regs[idx].username, `${regs[idx].prenom} ${regs[idx].nom}`);
      renderRegistrationsPanel();
    });
  };

  function registrationStatusLabel(status){
    const value = norm(status || 'pending');
    if(value === 'approved') return 'Validee localement - compte Supabase a creer';
    if(value === 'rejected') return 'Refusee';
    return 'En attente admin';
  }

  function supabaseAccountHint(user){
    const email = val(user?.email, user?.username, '-');
    const role = val(user?.role, 'medecin');
    return `A creer/verifier dans Supabase Auth: ${email} | raw_user_meta_data {"role":"${role}"}`;
  }

  window.renderRegistrationsPanel = function(){
    const host = document.getElementById('registrations-panel');
    if(!host) return;
    const regs = readRegistrations();
    const approved = readApprovedUsers();
    const rows = regs.map(r => `<tr><td><b>${esc(r.prenom)} ${esc(r.nom)}</b><div class="dash-muted">${esc(r.username)}</div></td><td>${esc(r.contact || '-')}<div class="dash-muted">${esc(r.email || '')}</div></td><td>${esc(r.specialite || '-')}</td><td>${esc(r.role || '-')}</td><td>${esc(registrationStatusLabel(r.status))}</td><td>${r.status === 'pending' ? `<button class="btn-secondary official-github-mini" onclick="approveRegistration('${esc(r.id)}')">Valider</button><button class="btn-secondary official-github-mini" onclick="rejectRegistration('${esc(r.id)}')">Refuser</button>` : '-'}</td></tr>`).join('');
    const approvedRows = approved.map(u => `<tr><td><b>${esc(u.prenom)} ${esc(u.nom)}</b><div class="dash-muted">${esc(u.username)}</div></td><td>${esc(u.role || '-')}</td><td>${esc(u.contact || '-')}</td><td>${esc(u.email || '-')}</td><td><span class="dash-muted">${esc(supabaseAccountHint(u))}</span></td><td><button class="btn-secondary official-github-mini" onclick="deleteApprovedUser('${esc(u.username)}')">Supprimer</button></td></tr>`).join('');
    host.innerHTML = `
      <div class="card">
        <div class="card-header"><h2>Inscriptions et comptes</h2></div>
        <div class="card-body dash-table-wrap">
          <div class="maintenance-code-box">
            <div><b>Code admin actuel</b><span>Utilise pour valider une inscription directement et pour les actions sensibles.</span></div>
            <strong>${esc(getAdminCode().replace(/\d/g, '*'))}</strong>
            <button class="btn-secondary official-github-mini" onclick="changeAdminAccessCode()">Changer le code</button>
          </div>
          <div class="maintenance-code-box">
            <div><b>Inscription compte Admin</b><span>Par securite, le type Admin est masque sur la page d'inscription tant que cette option n'est pas autorisee.</span></div>
            <strong>${adminSignupAllowed() ? 'AUTORISE' : 'BLOQUE'}</strong>
            <button class="btn-secondary official-github-mini" onclick="toggleAdminSignup()">${adminSignupAllowed() ? 'Desactiver Admin' : 'Autoriser Admin'}</button>
          </div>
          <div class="maintenance-code-box">
            <div><b>Important Supabase</b><span>Valider une demande ici ne suffit pas. Le compte devient utilisable seulement apres creation du meme email dans Supabase Authentication avec le bon role.</span></div>
            <strong>2 ETAPES</strong>
          </div>
          <h3 style="margin:0 0 8px;color:#17324d;font-size:14px">Demandes d'inscription</h3>
          <table class="dash-table"><thead><tr><th>Utilisateur</th><th>Contact</th><th>Specialite</th><th>Type</th><th>Statut</th><th>Actions</th></tr></thead><tbody>${rows || '<tr><td colspan="6" class="dash-empty">Aucune demande.</td></tr>'}</tbody></table>
          <h3 style="margin:18px 0 8px;color:#17324d;font-size:14px">Comptes approuves</h3>
          <table class="dash-table"><thead><tr><th>Utilisateur</th><th>Role</th><th>Contact</th><th>Email</th><th>Supabase</th><th>Actions</th></tr></thead><tbody>${approvedRows || '<tr><td colspan="6" class="dash-empty">Aucun compte ajoute.</td></tr>'}</tbody></table>
        </div>
      </div>`;
  };

  window.renderMaintenance = function(){
    const host = document.getElementById('maintenance-content');
    if(!host) return;
    const admin = isAdminUser();
    host.innerHTML = `
      <div class="clinical-shell maintenance-shell">
        <div class="card">
          <div class="card-header"><div class="card-num" style="background:#12395b">M</div><h2>Maintenance</h2></div>
          <div class="card-body">
            <div class="maintenance-grid">
              <div class="maintenance-tile"><h3>Sauvegarde</h3><p>Exporter regulierement les donnees avant nettoyage, restauration ou publication.</p>${admin ? '<button class="btn-secondary" onclick="window.exportAllData ? exportAllData() : alert(&quot;Export indisponible sur cette version&quot;)">Exporter sauvegarde</button>' : '<span class="clinical-pill warn">Reserve admin</span>'}</div>
              <div class="maintenance-tile"><h3>Restauration</h3><p>Importer une sauvegarde demande deja le code d'acces et une confirmation.</p>${admin ? '<label class="btn-secondary maintenance-upload">Restaurer<input type="file" accept=".json" onchange="window.importAllData ? importAllData(this) : alert(&quot;Import indisponible&quot;)" hidden></label>' : '<span class="clinical-pill warn">Reserve admin</span>'}</div>
              <div class="maintenance-tile"><h3>GitHub officiel</h3><p>Fixe les medecins, photos et catalogue dans les fichiers publics du site.</p>${admin ? '<button class="btn-secondary official-github-mini" onclick="exportOfficialGitHubData()">Export GitHub</button>' : '<span class="clinical-pill warn">Reserve admin</span>'}</div>
              <div class="maintenance-tile"><h3>Code gratuite</h3><p>Regler le prochain numero officiel avant le demarrage ou apres une initialisation.</p>${admin ? '<button class="btn-secondary" onclick="setCodeGratuiteStart()">Depart Code Gratuite</button>' : '<span class="clinical-pill warn">Reserve admin</span>'}</div>
              <div class="maintenance-tile"><h3>Statistiques</h3><p>Remettre a zero les compteurs herites des tests sans supprimer le catalogue.</p>${admin ? '<button class="btn-secondary" onclick="resetAllStatCounters()">Remettre compteurs a zero</button>' : '<span class="clinical-pill warn">Reserve admin</span>'}</div>
              <div class="maintenance-tile"><h3>Controle avant usage</h3><p>Verifier impression, stock pharmacie, synchronisation Supabase, comptes utilisateurs et catalogue.</p><button class="btn-secondary" onclick="showPage('stats', document.querySelector('.tab-btn[onclick*=stats]'))">Voir statistiques</button></div>
              <div class="maintenance-tile"><h3>Gestion comptes</h3><p>Voir les inscriptions, valider les demandes et controler les comptes crees localement.</p><button class="btn-secondary" onclick="renderRegistrationsPanel()">Voir inscriptions</button></div>
              <div class="maintenance-tile"><h3>Journal audit</h3><p>Trace les actions sensibles: sauvegarde, restauration, suppression, validation, traitement, stock et modifications critiques.</p><button class="btn-secondary" onclick="renderAuditLogPanel()">Actualiser journal</button></div>
            </div>
          </div>
        </div>
        <div id="registrations-panel"></div>
        <div id="audit-log-panel"></div>
      </div>`;
    renderRegistrationsPanel();
    renderAuditLogPanel();
  };

  function renderStatsFinal(){
    const host = document.getElementById('stats-content') || document.getElementById('page-stats');
    if(!host) return;
    const statsResetAt = Number(localStorage.getItem(STAT_BLOCK_RESET_KEY) || 0);
    const medicationResetAt = Number(localStorage.getItem(STAT_MED_RESET_KEY) || 0);
    const itemTime = item => {
      const raw = val(item.dateTs, item.consultedAt, item.createdAt, item.updatedAt, item.dateCreation, item.dateValidation, item.validatedAt, item.treatedAt, item.dateTraitement, item.id);
      if(!raw) return 0;
      if(typeof raw === 'number') return raw;
      if(/^\d{11,}$/.test(String(raw))) return Number(raw);
      const parsed = Date.parse(raw);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const afterStatsReset = item => {
      if(!statsResetAt) return true;
      const time = itemTime(item);
      return time && time >= statsResetAt;
    };
    const allPatients = readJson(STORAGE.patients, []);
    const allRdv = dedupeRdv([...readJson(STORAGE.rdv, []), ...readJson('rdv', [])]);
    const histRaw = [...readJson(STORAGE.historique, []), ...readJson('historique', [])].filter(item => patientName(item) || val(item.dossier));
    const hist = Array.from(new Map(histRaw.map((item, index) => {
      const key = val(item.id, item.dateTs, `${patientTreatmentKey(item)}|${val(item.dateProto, item.dateProtocole, item.date)}|${val(item.cure, item.cureNum)}|${index}`);
      return [String(key), item];
    })).values());
    const patients = allPatients;
    const rdv = allRdv.filter(afterStatsReset);
    const samePatientForStats = (a, b) => {
      const dossierA = norm(val(a?.dossier, a?.patient?.dossier));
      const dossierB = norm(val(b?.dossier, b?.patient?.dossier));
      const codeA = norm(val(a?.codegratuite, a?.codeGratuite, a?.code, a?.patient?.codegratuite, a?.patient?.codeGratuite));
      const codeB = norm(val(b?.codegratuite, b?.codeGratuite, b?.code, b?.patient?.codegratuite, b?.patient?.codeGratuite));
      const nameA = norm(patientName(a));
      const nameB = norm(patientName(b));
      return (dossierA && dossierA === dossierB) || (codeA && codeA === codeB) || (nameA && nameA === nameB);
    };
    const isMedicationStatSortie = item => {
      const time = itemTime(item);
      if(medicationResetAt && (!time || time < medicationResetAt)) return false;
      return Array.isArray(item.detailsData) || String(item.details || '').trim() !== '';
    };
    const sorties = dedupeSorties([...readJson(STORAGE.sorties, []), ...readJson('chncak_stock_sorties', []), ...readJson('sorties', [])]).filter(isMedicationStatSortie);
    const hemaSorties = readJson('chncak_hematologie_sorties', []).filter(afterStatsReset);
    const ok = getOkChimioList();
    const meds = {};
    const ensureMed = name => {
      const key = val(name, 'Non renseigne');
      meds[key] = meds[key] || {preparations:0, seances:0, dose:0, wasteMg:0, wasteFlacons:0, flacons:0};
      return meds[key];
    };
    sorties.forEach(s => {
      if(Array.isArray(s.detailsData)){
        s.detailsData.forEach(d => {
          const med = ensureMed(d.name);
          med.preparations += 1;
          med.seances += 1;
          med.dose += Number(d.dose || 0);
          med.wasteMg += Number(d.reliquatMg || d.reliquat || 0);
          med.wasteFlacons += Number(d.reliquatFlacons || 0);
          med.flacons += Number(d.nbFlacons || 0);
        });
      } else if(s.details){
        String(s.details).split(',').forEach(part => {
          const name = part.split(':')[0]?.trim();
          if(!name) return;
          const med = ensureMed(name);
          med.preparations += 1;
          med.seances += 1;
          const fl = part.match(/(\d+)\s*flacon/i);
          const mg = part.match(/(\d+(?:[.,]\d+)?)\s*mg/i);
          if(fl) med.flacons += Number(fl[1]);
          if(mg) med.dose += Number(String(mg[1]).replace(',', '.'));
        });
      }
    });
    const medRows = Object.entries(meds).sort((a,b) => b[1].preparations - a[1].preparations).map(([name, d]) => `
      <tr><td>${esc(name)}</td><td>${d.preparations}</td><td>${d.seances}</td><td>${Math.round(d.dose).toLocaleString('fr-FR')} mg</td><td>${Math.round(d.wasteMg).toLocaleString('fr-FR')} mg</td><td>${d.wasteFlacons}</td><td>${d.flacons}</td></tr>
    `).join('');
    const hemaByMed = hemaSorties.reduce((acc, row) => {
      const key = val(row.medicament, 'Non renseigne');
      acc[key] = acc[key] || {sorties:0, quantite:0};
      acc[key].sorties += 1;
      acc[key].quantite += Number(row.quantite || 0);
      return acc;
    }, {});
    const transfusions = readJson(STORAGE.transfusion, []).filter(row => row.statut === 'transfuse').filter(afterStatsReset);
    const consultationsDone = consultRdvList().filter(row => norm(val(row.statut, row.status)).includes('consulte') || row.consultedAt).filter(afterStatsReset);
    const consultantsNew = consultationsDone.filter(row => row.typePatient !== 'ancien').length;
    const hemaRows = Object.entries(hemaByMed).sort((a,b) => b[1].quantite - a[1].quantite).map(([name, data]) => `
      <tr><td>${esc(name)}</td><td>${data.sorties}</td><td>${data.quantite}</td></tr>
    `).join('');
    const countBy = (items, fn) => items.reduce((acc, item) => {
      const key = val(fn(item), 'Non renseigne');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const miniRows = obj => Object.entries(obj).sort((a,b) => b[1] - a[1]).map(([k,v]) => `<div class="dash-line"><span>${esc(k)}</span><strong>${v}</strong></div>`).join('') || '<div class="dash-empty">Aucune donnee.</div>';
    const diagnosticProtocolRows = Object.entries(dedupeByPatientTreatment(patients).reduce((acc, item) => {
      const diagnostic = val(item.localisation, item.diagnostic, item.indication, 'Diagnostic non renseigne');
      const protocole = protocolNameFor(item);
      const key = `${diagnostic}|||${protocole}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})).sort((a,b) => b[1] - a[1]).map(([key, count]) => {
      const [diagnostic, protocole] = key.split('|||');
      return `<tr><td>${esc(diagnostic)}</td><td>${esc(protocole)}</td><td>${count}</td></tr>`;
    }).join('');
    const treatedRdv = allRdv.filter(r => norm(val(r.status, r.statut)).includes('traite') || r.validatedAt || r.stockValide).filter(afterStatsReset);
    const today = todayIso();
    const patientHasFutureRdv = patient => allRdv.some(r => samePatientForStats(patient, r) && !(norm(val(r.status, r.statut)).includes('traite') || r.validatedAt) && val(r.dateRdv, r.date) >= today);
    const patientTreatedRdvCount = patient => allRdv.filter(r => samePatientForStats(patient, r) && (norm(val(r.status, r.statut)).includes('traite') || r.validatedAt || r.stockValide)).length;
    const patientCompleted = patient => {
      const total = Number(val(patient.totalCures, patient.totalCycles, patient.total, patient.curesPrevues, 0));
      const current = Number(val(patient.cure, patient.cureNum, patient.cycle, patient.numeroCure, patient.numCure, 0));
      const status = norm(val(patient.statut, patient.status));
      return status.includes('termine') || status.includes('archive') || (total && (current >= total || patientTreatedRdvCount(patient) >= total));
    };
    const patientsTermines = patients.filter(patientCompleted).length;
    const patientsEnCours = patients.filter(p => !patientCompleted(p) && patientHasFutureRdv(p)).length;
    const patientsTraites = patients.filter(p => patientTreatedRdvCount(p) > 0).length;
    const maxPrep = Math.max(1, ...Object.values(meds).map(d => d.preparations));
    const chartRows = Object.entries(meds).sort((a,b) => b[1].preparations - a[1].preparations).slice(0, 10).map(([name, d]) => `<div class="stats-bar-row"><span>${esc(name)}</span><div><i style="width:${Math.max(5, Math.round(d.preparations / maxPrep * 100))}%"></i></div><strong>${d.preparations}</strong></div>`).join('');
    const preparations = Object.values(meds).reduce((sum, item) => sum + Number(item.preparations || 0), 0);
    const seances = treatedRdv.length || sorties.length;
    const concomitantes = treatedRdv.filter(r => norm(protocolNameFor(r)).includes('cddp')).length ||
      sorties.filter(s => norm(val(s.protocole, s.proto, s.protocol, s.details)).includes('cddp')).length;
    const indicationRows = Object.entries(countBy(dedupeByPatientTreatment(patients), p => val(p.indication, p.indicationTraitement, p.typeTraitement, 'Indication non renseignee')))
      .sort((a,b) => b[1] - a[1])
      .map(([name, count]) => `<tr><td>${esc(name)}</td><td>${count}</td></tr>`).join('');
    const totalDose = Object.values(meds).reduce((sum, item) => sum + Number(item.dose || 0), 0);
    const totalWaste = Object.values(meds).reduce((sum, item) => sum + Number(item.wasteMg || 0), 0);
    const totalFlacons = Object.values(meds).reduce((sum, item) => sum + Number(item.flacons || 0), 0);
    host.innerHTML = `
      <div class="clinical-shell stats-full">
        ${isAdminUser() ? '<div class="stats-final-note" style="display:flex;justify-content:space-between;gap:12px;align-items:center"><span>Compteurs d activite: les preparations, seances, doses, flacons et sorties hematologie suivent le depart officiel. Patients et protocoles viennent du registre actuel.</span><button class="btn-secondary official-github-mini" onclick="resetAllStatCounters()">Remettre compteurs a zero</button></div>' : ''}
        <div class="stats-summary-grid">
          <div class="stats-box"><h3>Patients</h3><p>${patients.length}</p><small>${patientsTraites} traites | ${patientsEnCours} en cours | ${patientsTermines} termines</small></div>
          <div class="stats-box"><h3>Preparations</h3><p>${preparations}</p></div>
          <div class="stats-box"><h3>Seances chimio</h3><p>${seances}</p></div>
          <div class="stats-box"><h3>Chimio concomitante</h3><p>${concomitantes}</p><small>CDDP traites</small></div>
          <div class="stats-box"><h3>Protocoles sauvegardes</h3><p>${hist.length}</p></div>
          <div class="stats-box"><h3>Medicaments distincts</h3><p>${Object.keys(meds).length}</p></div>
          <div class="stats-box"><h3>Dose totale utilisee</h3><p>${Math.round(totalDose).toLocaleString('fr-FR')}</p><small>mg</small></div>
          <div class="stats-box"><h3>Dose totale jetee</h3><p>${Math.round(totalWaste).toLocaleString('fr-FR')}</p><small>mg</small></div>
          <div class="stats-box"><h3>Flacons utilises</h3><p>${totalFlacons}</p></div>
          <div class="stats-box"><h3>Sorties hematologie</h3><p>${hemaSorties.length}</p></div>
          <div class="stats-box"><h3>Transfusions</h3><p>${transfusions.length}</p></div>
          <div class="stats-box"><h3>Consultants</h3><p>${consultantsNew}</p><small>Nouveaux patients vus</small></div>
          <div class="stats-box"><h3>Consultations</h3><p>${consultationsDone.length}</p><small>Ensemble des patients vus</small></div>
        </div>
        <div class="stats-final-note">Patients: registre patients. Preparations: nombre de medicaments prepares/valides. Seances: RDV traites, sinon sorties de stock. Protocoles sauvegardes: historique des protocoles sauvegardes. Consultants: nouveaux patients marques consultes. Consultations: tous les RDV consultations marques consultes.${statsResetAt ? ` Depart activite: ${esc(new Date(statsResetAt).toLocaleString('fr-FR'))}.` : ''}${medicationResetAt ? ` Depart medicaments: ${esc(new Date(medicationResetAt).toLocaleString('fr-FR'))}.` : ''}</div>
        <div class="card stats-section-card"><div class="card-header"><h2>Graphique medicaments</h2>${isAdminUser() ? '<button class="btn-secondary official-github-mini" onclick="resetMedicationStats()">Remettre a zero</button>' : ''}</div><div class="card-body">${chartRows || '<div class="dash-empty">Aucune donnee medicament.</div>'}</div></div>
        <div class="card stats-section-card"><div class="card-header"><h2>Medicaments utilises</h2>${isAdminUser() ? '<button class="btn-secondary official-github-mini" onclick="resetMedicationStats()">Remettre a zero</button>' : ''}</div><div class="card-body dash-table-wrap"><table class="dash-table"><thead><tr><th>Medicament</th><th>Preparations</th><th>Seances</th><th>Dose totale utilisee</th><th>Dose totale jetee</th><th>Reliquat flacons</th><th>Flacons utilises</th></tr></thead><tbody>${medRows || '<tr><td colspan="7" class="dash-empty">Aucune sortie de stock validee.</td></tr>'}</tbody></table></div></div>
        <div class="card stats-section-card"><div class="card-header"><h2>Hematologie - sorties medicaments</h2></div><div class="card-body dash-table-wrap"><table class="dash-table"><thead><tr><th>Medicament</th><th>Nombre de sorties</th><th>Quantite totale</th></tr></thead><tbody>${hemaRows || '<tr><td colspan="3" class="dash-empty">Aucune sortie hematologie.</td></tr>'}</tbody></table></div></div>
        <div class="clinical-report-grid">
          <div class="card"><div class="card-header"><h2>Protocoles</h2></div><div class="card-body">${miniRows(countBy(patients, p => val(p.proto, p.protocole, p.protoName)))}</div></div>
          <div class="card"><div class="card-header"><h2>Diagnostics</h2></div><div class="card-body">${miniRows(countBy(patients, p => val(p.localisation, p.diagnostic)))}</div></div>
          <div class="card"><div class="card-header"><h2>Indications</h2></div><div class="card-body">${miniRows(countBy(patients, p => val(p.indication, p.indicationTraitement, p.typeTraitement)))}</div></div>
          <div class="card"><div class="card-header"><h2>Medecins</h2></div><div class="card-body">${miniRows(countBy(patients, p => p.medecin))}</div></div>
        </div>
        <div class="card stats-section-card"><div class="card-header"><h2>Nombre par indication</h2></div><div class="card-body dash-table-wrap"><table class="dash-table"><thead><tr><th>Indication</th><th>Nombre</th></tr></thead><tbody>${indicationRows || '<tr><td colspan="2" class="dash-empty">Aucune indication renseignee.</td></tr>'}</tbody></table></div></div>
        <div class="card stats-section-card"><div class="card-header"><h2>Diagnostics par protocole</h2></div><div class="card-body dash-table-wrap"><table class="dash-table"><thead><tr><th>Diagnostic</th><th>Protocole</th><th>Nombre</th></tr></thead><tbody>${diagnosticProtocolRows || '<tr><td colspan="3" class="dash-empty">Aucune donnee diagnostic/protocole.</td></tr>'}</tbody></table></div></div>
      </div>`;
  }
  window.renderStats = renderStatsFinal;

  window.resetMedicationStats = function(){
    askAdminCode('remettre a zero les statistiques medicaments', () => {
      const now = Date.now();
      localStorage.setItem(STAT_MED_RESET_KEY, String(now));
      [STORAGE.sorties, 'chncak_stock_sorties', 'sorties'].forEach(key => localStorage.removeItem(key));
      logAudit('Remise a zero statistiques medicaments', 'Statistiques', `Depart officiel: ${new Date(now).toLocaleString('fr-FR')}`);
      window.renderStats?.();
      window.renderDashboard?.();
      showToastSafe('Compteurs medicaments remis a zero. Les anciennes sorties de test seront ignorees.', 'success');
    });
  };

  window.resetAllStatCounters = function(){
    askAdminCode('remettre a zero les compteurs statistiques', () => {
      const now = Date.now();
      localStorage.setItem(STAT_BLOCK_RESET_KEY, String(now));
      localStorage.setItem(STAT_MED_RESET_KEY, String(now));
      [STORAGE.sorties, 'chncak_stock_sorties', 'sorties'].forEach(key => localStorage.removeItem(key));
      logAudit('Remise a zero compteurs', 'Statistiques', `Depart officiel: ${new Date(now).toLocaleString('fr-FR')}`);
      window.renderStats?.();
      window.renderDashboard?.();
      showToastSafe('Compteurs statistiques remis a zero. Les anciennes donnees de test seront ignorees dans les blocs.', 'success');
    });
  };

  window.printStats = function(){
    renderStatsFinal();
    const content = document.getElementById('page-stats')?.innerHTML || '';
    const logo = document.querySelector('.nav-logo img')?.src || '';
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Statistiques ChimioPro</title>
      <style>@page{size:A4;margin:9mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;font-size:9px;color:#111}.print-head{display:grid;grid-template-columns:52px 1fr 135px;gap:8px;align-items:start;border-bottom:2px solid #0A3D7A;padding-bottom:5px;margin-bottom:8px}.print-head img{width:48px;height:48px;object-fit:contain}.ministry{font-size:7px;line-height:1.08}.right{text-align:right;font-size:8px;line-height:1.2}.stats-summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:8px 0}.stats-box{border:1px solid #b7c7dd;padding:6px;border-radius:4px}.stats-box h3{font-size:8px;margin:0;color:#0A3D7A}.stats-box p{font-size:18px;margin:2px 0 0;font-weight:bold}.card{border:1px solid #d6dce5;margin-top:8px;border-radius:4px}.card-header{background:#eef4fd;padding:5px 7px}.card-header h2{font-size:10px;margin:0}.card-body{padding:6px}.dash-table{width:100%;border-collapse:collapse}.dash-table th{background:#0A3D7A;color:#fff}.dash-table th,.dash-table td{border:1px solid #cad3df;padding:3px 4px;font-size:7.5px}.clinical-report-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.stats-bar-row{display:grid;grid-template-columns:1.4fr 3fr 28px;gap:6px;align-items:center;margin:4px 0;font-size:7.5px}.stats-bar-row div{height:8px;background:#e9eef5;border-radius:2px}.stats-bar-row i{display:block;height:100%;background:#0A3D7A}.no-print,button,input,select{display:none!important}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>
    </head><body><div class="print-head"><img src="${logo}"><div class="ministry">Republique du Senegal - Un peuple, un but, une foi<br>Ministere de la Sante et de l'Action Sociale<br><b>Centre Hospitalier National Cheikh Ahmadoul Khadim - Touba</b><br><b>Service d'Oncologie-Radiotherapie</b></div><div class="right">Statistiques ChimioPro<br>${new Date().toLocaleDateString('fr-FR')}</div></div>${content}</body></html>`;
    printHtml(html);
  };

  function suiviPatientKey(item){
    return norm(val(item?.dossier, item?.codegratuite, item?.code, patientName(item)));
  }

  function isRdvTreated(item){
    const status = norm(val(item?.status, item?.statut));
    return status.includes('traite') || status.includes('valide') || !!(item?.validatedAt || item?.stockValide);
  }

  function isRdvReported(item){
    const status = norm(val(item?.status, item?.statut, item?.motifReport));
    return status.includes('report') || status.includes('absent') || !!item?.motifReport;
  }

  function numericLine(value){
    const text = norm(value);
    const direct = parseInt(text.replace(/[^0-9]/g, ''), 10);
    if(direct) return direct;
    if(text.includes('trois') || text.includes('3e')) return 3;
    if(text.includes('quatre') || text.includes('4e')) return 4;
    if(text.includes('deux') || text.includes('2e')) return 2;
    if(text.includes('prem') || text.includes('1re') || text.includes('1er')) return 1;
    return 0;
  }

  function buildClinicalFollowupAlerts(){
    const patients = readJson(STORAGE.patients, []);
    const rdvs = readJson(STORAGE.rdv, []);
    const hist = readJson(STORAGE.historique, []);
    const rows = [];
    const patientByKey = new Map();
    [...patients, ...hist, ...rdvs].forEach(item => {
      const key = suiviPatientKey(item);
      if(key && !patientByKey.has(key)) patientByKey.set(key, item);
    });
    const today = todayIso();
    const rdvByPatient = new Map();
    rdvs.forEach(rdv => {
      const key = suiviPatientKey(rdv);
      if(!key) return;
      if(!rdvByPatient.has(key)) rdvByPatient.set(key, []);
      rdvByPatient.get(key).push(rdv);
    });

    rdvs.forEach(rdv => {
      if(!rdv.dateRdv || rdv.dateRdv >= today || isRdvTreated(rdv) || isRdvReported(rdv)) return;
      rows.push({
        level:'danger',
        type:'Absence / RDV depasse',
        patient: patientName(rdv),
        detail:`RDV du ${rdv.dateRdv.split('-').reverse().join('/')} non marque traite.`,
        action:'Contacter le patient, reporter le RDV ou documenter l absence.'
      });
    });

    patientByKey.forEach((patient, key) => {
      const list = (rdvByPatient.get(key) || []).filter(r => r.dateRdv).sort((a,b) => String(a.dateRdv).localeCompare(String(b.dateRdv)));
      const treated = list.filter(isRdvTreated);
      const totalCures = Number(val(patient.totalCures, patient.nombreCures, patient.curesTotal, 0));
      const currentCure = Math.max(Number(val(patient.cure, patient.cureNum, 0)), ...list.map(r => Number(val(r.cureNum, r.cure, 0)) || 0), 0);
      if(totalCures && (currentCure > totalCures || treated.length > totalCures)){
        rows.push({
          level:'danger',
          type:'Depassement de cures',
          patient: patientName(patient),
          detail:`Cure ${currentCure || treated.length} / total prescrit ${totalCures}.`,
          action:'Verifier la prescription medicale avant toute cure supplementaire.'
        });
      }

      const proto = protocolsList().find(p => p.id === val(patient.protoId) || norm(p.name) === norm(protocolNameFor(patient)));
      const expected = protocolIntervalDays(proto, patient);
      for(let i = 1; i < treated.length; i++){
        const previous = val(treated[i - 1].dateRdv, treated[i - 1].date);
        const current = val(treated[i].dateRdv, treated[i].date);
        const gap = daysBetweenIso(previous, current);
        if(Number.isFinite(gap) && gap > expected + 7){
          rows.push({
            level:'warn',
            type:'Traitement irregulier',
            patient: patientName(patient),
            detail:`Intervalle de ${gap} jours entre deux traitements (attendu environ ${expected} jours).`,
            action:'Verifier les causes : toxicite, absence, rupture stock, report medical.'
          });
          break;
        }
      }

      const line = numericLine(val(patient.ligne, patient.ligneTraitement));
      if(line >= 3){
        rows.push({
          level:'warn',
          type:'Lignes de chimiotherapie multiples',
          patient: patientName(patient),
          detail:`Patient en ligne ${line}.`,
          action:'Revoir benefice attendu, tolerance et decision RCP.'
        });
      }

      const indication = norm(val(patient.indication, patient.phase, patient.typeTraitement));
      if(indication.includes('attente') || indication.includes('induction')){
        rows.push({
          level:'info',
          type:'Rappel radiotherapie',
          patient: patientName(patient),
          detail:`Indication : ${val(patient.indication, 'chimiotherapie d attente/induction')}.`,
          action:'Programmer ou confirmer l entree en radiotherapie.'
        });
      }
    });

    return rows.slice(0, 80);
  }

  function renderClinicalFollowupAlerts(){
    const host = document.getElementById('suivi-content');
    if(!host) return;
    document.getElementById('clinical-followup-alerts')?.remove();
    const alerts = buildClinicalFollowupAlerts();
    const severityColor = level => level === 'danger' ? '#B42318' : level === 'warn' ? '#B7791F' : '#0A3D7A';
    const rows = alerts.map(alert => `
      <tr>
        <td><span class="clinical-pill" style="border-color:${severityColor(alert.level)};color:${severityColor(alert.level)}">${esc(alert.type)}</span></td>
        <td><b>${esc(alert.patient || '-')}</b></td>
        <td>${esc(alert.detail)}</td>
        <td>${esc(alert.action)}</td>
      </tr>`).join('');
    host.insertAdjacentHTML('afterbegin', `
      <div id="clinical-followup-alerts" class="card stats-section-card" style="margin-bottom:12px">
        <div class="card-header"><h2>Alertes de suivi clinique</h2><button class="btn-secondary official-github-mini" onclick="renderClinicalFollowupAlerts()">Actualiser</button></div>
        <div class="card-body dash-table-wrap">
          <div class="stats-final-note">Surveille les absences, traitements irreguliers, depassements de cures, lignes multiples et rappels radiotherapie pour chimiotherapie d attente ou d induction.</div>
          <table class="dash-table"><thead><tr><th>Alerte</th><th>Patient</th><th>Constat</th><th>Action conseillee</th></tr></thead><tbody>${rows || '<tr><td colspan="4" class="dash-empty">Aucune alerte clinique active.</td></tr>'}</tbody></table>
        </div>
      </div>`);
  }
  window.renderClinicalFollowupAlerts = renderClinicalFollowupAlerts;

  function renderSuiviFinal(){
    if(typeof nativeRenderSuiviFinal === 'function') nativeRenderSuiviFinal();
    renderClinicalFollowupAlerts();
    const saveBtn = document.querySelector('#suivi-content .clinical-save');
    if(saveBtn && !document.getElementById('suivi-date-evaluation')){
      saveBtn.insertAdjacentHTML('beforebegin', `
        <div class="clinical-form-grid suivi-extra-grid" style="margin-top:10px">
          <div class="field"><label>Date evaluation</label><input type="date" id="suivi-date-evaluation" value="${todayIso()}"></div>
          <div class="field"><label>Type evaluation</label><select id="suivi-type-evaluation"><option value="">Choisir</option><option>Clinique</option><option>Scanner/TDM</option><option>IRM</option><option>Marqueurs tumoraux</option><option>Clinique + imagerie</option></select></div>
          <div class="field"><label>ECOG</label><select id="suivi-ecog"><option value="">Choisir</option><option>0</option><option>1</option><option>2</option><option>3</option><option>4</option></select></div>
          <div class="field"><label>Poids actuel (kg)</label><input type="number" id="suivi-poids-actuel" min="1" max="300" step="0.1"></div>
          <div class="field"><label>Examen clinique</label><select id="suivi-examen-clinique"><option value="">Choisir</option><option>Stable</option><option>Ameliore</option><option>Aggrave</option><option>AEG</option><option>Douleur</option><option>Autre</option></select></div>
          <div class="field"><label>Toxicite principale</label><select id="suivi-toxicite"><option value="">Choisir</option><option>Aucune</option><option>Neuropathie</option><option>Diarrhee</option><option>Vomissements</option><option>Neutropenie</option><option>Anemie</option><option>Thrombopenie</option><option>Mucite</option><option>Syndrome main-pied</option><option>Autre</option></select></div>
          <div class="field"><label>Grade toxicite</label><select id="suivi-grade-toxicite"><option value="">Choisir</option><option>0</option><option>1</option><option>2</option><option>3</option><option>4</option></select></div>
          <div class="field"><label>Decision therapeutique</label><select id="suivi-decision"><option value="">Choisir</option><option>Continuer meme protocole</option><option>Adapter dose</option><option>Reporter cure</option><option>Changer protocole</option><option>Arret traitement</option></select></div>
          <div class="field"><label>Prochaine evaluation</label><input type="date" id="suivi-prochaine-evaluation"></div>
          <div class="field" style="grid-column:1/-1"><label>Conclusion evaluation</label><select id="suivi-conclusion"><option value="">Choisir</option><option>Benefice clinique</option><option>Maladie controlee</option><option>Progression suspectee</option><option>Toxicite limitante</option><option>Evaluation incomplete</option></select></div>
          <div class="field" style="grid-column:1/-1"><label>Observation detaillee</label><input type="text" id="suivi-observation" placeholder="Symptomes, tolerance, imagerie, decision RCP..."></div>
        </div>`);
    }
    const table = document.querySelector('#suivi-content .suivi-table tbody');
    if(!table) return;
    const patients = readJson(STORAGE.patients, []);
    Array.from(table.querySelectorAll('tr')).forEach((row, index) => {
      const patient = patients[index];
      const cells = row.querySelectorAll('td');
      if(patient && cells[13]) cells[13].textContent = protocolNameFor(patient);
      if(patient && cells[18] && cells[13]?.textContent.trim() === '-') cells[18].innerHTML = '<span class="clinical-pill warn">Protocole absent</span>';
    });
    addSuiviDeleteButtons();
  }

  const nativeRenderSuiviFinal = window.renderSuivi;
  window.renderSuivi = renderSuiviFinal;

  function addSuiviDeleteButtons(){
    const data = readJson(STORAGE.suivi, readJson('suivi', []));
    const tables = Array.from(document.querySelectorAll('#suivi-content .dash-table'));
    const table = tables.find(t => (t.textContent || '').toLowerCase().includes('reponse')) || tables[tables.length - 1];
    if(!table || !data.length) return;
    const headRow = table.querySelector('thead tr');
    if(headRow && !headRow.querySelector('.suivi-action-head')){
      const th = document.createElement('th');
      th.className = 'suivi-action-head';
      th.textContent = 'Actions';
      headRow.appendChild(th);
    }
    Array.from(table.querySelectorAll('tbody tr')).forEach((row, index) => {
      if(row.querySelector('.suivi-delete-btn') || !data[index]) return;
      const td = document.createElement('td');
      td.innerHTML = `<button class="btn-secondary suivi-delete-btn" style="padding:5px 8px;font-size:11px" onclick="deleteSuiviEntry('${esc(val(data[index].id, data[index].dateTs))}')">Supprimer</button>`;
      row.appendChild(td);
    });
  }

  window.deleteSuiviEntry = function(id){
    askAdminCode('supprimer cette ligne de suivi', () => {
      [STORAGE.suivi, 'suivi'].forEach(key => {
        const list = readJson(key, []);
        if(Array.isArray(list)) writeJson(key, list.filter(item => String(val(item.id, item.dateTs)) !== String(id)));
      });
      logAudit('Suppression suivi', id, 'Ligne de suivi patient supprimee');
      window.renderSuivi?.();
      showToastSafe('Ligne de suivi supprimee.', 'success');
    });
  };

  const nativeAutoFillSuiviFields = window.autoFillSuiviFields;
  window.autoFillSuiviFields = function(){
    const out = typeof nativeAutoFillSuiviFields === 'function' ? nativeAutoFillSuiviFields.apply(this, arguments) : undefined;
    const code = document.getElementById('suivi-patient')?.value;
    const patients = readJson(STORAGE.patients, []);
    const patient = patients.find((p, i) => patientShortCode(p) === code || patientCode(p) === code || String(i) === String(code));
    const set = (id, value) => { const el = document.getElementById(id); if(el && !el.value) el.value = value || ''; };
    if(patient){
      set('suivi-poids-actuel', val(patient.poids, patient.weight));
      set('suivi-date-debut', val(patient.dateDebut, patient.dateProto, patient.dateProtocole, patient.date));
    }
    return out;
  };

  window.saveReponseTumorale = function(){
    const code = document.getElementById('suivi-patient')?.value;
    const cures = Number(document.getElementById('suivi-cures')?.value);
    const compliant = document.getElementById('suivi-compliant')?.value;
    const reponse = document.getElementById('reponse-tumorale')?.value;
    const dateEvaluation = document.getElementById('suivi-date-evaluation')?.value;
    const typeEvaluation = document.getElementById('suivi-type-evaluation')?.value;
    const decision = document.getElementById('suivi-decision')?.value;
    const ecog = document.getElementById('suivi-ecog')?.value;
    const poidsActuel = Number(document.getElementById('suivi-poids-actuel')?.value);
    const examenClinique = document.getElementById('suivi-examen-clinique')?.value;
    const toxicite = document.getElementById('suivi-toxicite')?.value;
    const gradeToxicite = document.getElementById('suivi-grade-toxicite')?.value;
    const conclusion = document.getElementById('suivi-conclusion')?.value;
    const observation = document.getElementById('suivi-observation')?.value?.trim() || '';
    if(!code) return alert('Selectionner un patient.');
    if(!cures || cures < 1) return alert('Indiquer un nombre de cures valide.');
    if(!compliant) return alert('Indiquer si le traitement est compliant.');
    if(!reponse) return alert('Selectionner la reponse tumorale.');
    if(!dateEvaluation) return alert('Renseigner la date d evaluation.');
    if(!typeEvaluation) return alert('Renseigner le type d evaluation.');
    if(ecog === '') return alert('Renseigner le score ECOG.');
    if(!poidsActuel || poidsActuel < 1) return alert('Renseigner le poids actuel.');
    if(!examenClinique) return alert('Renseigner l examen clinique.');
    if(!toxicite) return alert('Renseigner la toxicite principale, meme si aucune.');
    if(gradeToxicite === '') return alert('Renseigner le grade de toxicite.');
    if(!decision) return alert('Renseigner la decision therapeutique.');
    if(!conclusion) return alert('Renseigner la conclusion de l evaluation.');
    if(observation.length < 8) return alert('Ajouter une observation detaillee.');
    const patients = readJson(STORAGE.patients, []);
    const patient = patients.find((p, i) => patientShortCode(p) === code || patientCode(p) === code || String(i) === String(code));
    if(!patient) return alert('Patient introuvable dans le registre.');
    const totalCures = Number(val(patient.totalCures, patient.total, 0));
    if(totalCures && cures > totalCures && !confirm(`Le nombre de cures (${cures}) depasse le total prevu (${totalCures}). Continuer ?`)) return;
    const list = readJson(STORAGE.suivi, readJson('suivi', []));
    const existing = list.find(s => s.patientCode === code);
    list.push({
      id: Date.now().toString(),
      patientCode: code,
      patientName: patient ? `${code} - ${patientName(patient)}` : code,
      dossier: val(patient?.dossier),
      protocole: protocolNameFor(patient || {}),
      localisation: val(patient?.localisation, patient?.diagnostic),
      cures,
      compliant,
      reponse,
      dateDebut: document.getElementById('suivi-date-debut')?.value || existing?.dateDebut || new Date().toLocaleDateString('fr-FR'),
      dateEvaluation,
      typeEvaluation,
      ecog,
      poidsActuel,
      examenClinique,
      toxicite,
      gradeToxicite,
      decision,
      prochaineEvaluation: document.getElementById('suivi-prochaine-evaluation')?.value || '',
      conclusion,
      observation,
      date: new Date().toLocaleDateString('fr-FR'),
      dateTs: new Date().toISOString()
    });
    writeJson(STORAGE.suivi, list);
    writeJson('suivi', list);
    window.renderSuivi?.();
    showToastSafe('Suivi patient enregistre de facon complete.', 'success');
  };

  function biologieCandidatePatients(){
    const today = todayIso();
    const todaysRdv = readJson(STORAGE.rdv, []).filter(r => r.dateRdv === today).map(r => ({...(rdvPatientForPreparation(r) || r), ...r, bioSource:'RDV du jour'}));
    const okValidated = getOkChimioList()
      .filter(item => normalizeOkStatus(item) === 'valide')
      .map(item => ({...(item.patient || {}), ...item, bioSource:'OK Chimio valide'}));
    const saved = savedProtocolEntries().map(item => ({...item, bioSource:'Protocole sauvegarde'}));
    const patients = readJson(STORAGE.patients, []).map(item => ({...item, bioSource:'Registre patient'}));
    return dedupeByPatientTreatment([...todaysRdv, ...okValidated, ...saved, ...patients]);
  }

  function findBiologieCandidate(code, typedPatient){
    return biologieCandidatePatients().find(p =>
      patientShortCode(p) === code ||
      patientCode(p) === code ||
      String(p.id) === String(code) ||
      patientTreatmentKey(p) === code ||
      (typedPatient && norm(patientName(p)) === norm(typedPatient))
    );
  }

  function normalizeBiologiePatientOptions(){
    const select = document.getElementById('bio-patient-select');
    if(!select) return;
    const current = select.value;
    const allowedPatients = biologieCandidatePatients();
    select.innerHTML = '<option value="">Selectionner patient / protocole</option>' + allowedPatients.map(p => {
      const code = val(patientShortCode(p), p.id, patientTreatmentKey(p));
      const selected = current === code || current === String(p.id) || current === patientTreatmentKey(p) ? ' selected' : '';
      return `<option value="${esc(code)}"${selected}>${esc(patientShortCode(p) || '-')} - ${esc(patientName(p) || '-')} - ${esc(protocolNameFor(p))} (${esc(val(p.bioSource, 'registre'))})</option>`;
    }).join('');
  }

  const nativeRenderBiologieFinal = window.renderBiologie;
  window.renderBiologie = function(){
    const out = typeof nativeRenderBiologieFinal === 'function' ? nativeRenderBiologieFinal.apply(this, arguments) : undefined;
    normalizeBiologiePatientOptions();
    const saveBtn = document.querySelector('#biologie-content .clinical-save');
    if(saveBtn && !document.getElementById('bio-result-date')){
      saveBtn.insertAdjacentHTML('beforebegin', '<div class="field clinical-bio-field" style="max-width:260px;margin-top:10px"><label>Date des resultats</label><input type="date" id="bio-result-date" value="'+todayIso()+'"><span class="bio-msg warn">Obligatoire pour valider le traitement</span></div>');
    }
    if(saveBtn && !document.getElementById('bio-edit-latest-btn')){
      saveBtn.insertAdjacentHTML('afterend', '<button id="bio-edit-latest-btn" class="btn-secondary" style="width:auto;margin-left:8px;padding:10px 14px" onclick="loadLatestBiologieForEdit()">Modifier le bilan du jour</button>');
    }
    addBiologieDeleteButtons();
    return out;
  };

  window.loadBiologiePatient = function(){
    const code = document.getElementById('bio-patient-select')?.value;
    const patient = findBiologieCandidate(code, '');
    const input = document.getElementById('bio-patient');
    if(input) input.value = patient ? patientName(patient) : '';
  };

  function addBiologieDeleteButtons(){
    const data = readJson(STORAGE.biologie, readJson('biologie', []));
    const headRow = document.querySelector('#biologie-content .dash-table thead tr');
    if(headRow && !headRow.querySelector('.bio-action-head')){
      const th = document.createElement('th');
      th.className = 'bio-action-head';
      th.textContent = 'Actions';
      headRow.appendChild(th);
    }
    document.querySelectorAll('#biologie-content .dash-table tbody tr').forEach((row, index) => {
      if(row.querySelector('.bio-delete-btn') || !data[index]) return;
      const td = document.createElement('td');
      td.innerHTML = `<button class="btn-secondary bio-delete-btn" style="padding:5px 8px;font-size:11px" onclick="deleteBiologieEntry('${esc(val(data[index].id, data[index].dateTs))}')">Supprimer</button>`;
      row.appendChild(td);
    });
  }

  function exactRecordMatch(item, target){
    if(!item || !target) return false;
    const itemId = String(val(item.id, item.dateTs, item.createdAt, item.dateCreation));
    const targetId = String(val(target.id, target.dateTs, target.createdAt, target.dateCreation));
    if(itemId && targetId && itemId === targetId) return true;
    const itemPatientId = String(val(item.patient?.id, item.patient?.dateTs, item.patient?.createdAt));
    if(itemPatientId && targetId && itemPatientId === targetId) return true;
    return false;
  }

  function removeOneFromStorage(key, predicate){
    const list = readJson(key, []);
    if(!Array.isArray(list)) return false;
    const idx = list.findIndex(predicate);
    if(idx < 0) return false;
    list.splice(idx, 1);
    writeJson(key, list);
    return true;
  }

  function deleteSingleSavedProtocol(entry){
    let removed = false;
    removed = removeOneFromStorage(STORAGE.historique, item => exactRecordMatch(item, entry)) || removed;
    removed = removeOneFromStorage('historique', item => exactRecordMatch(item, entry)) || removed;
    removed = removeOneFromStorage(STORAGE.okchimio, item => exactRecordMatch(item, entry) || exactRecordMatch(item.patient, entry)) || removed;
    removed = removeOneFromStorage('chncak_okchimio', item => exactRecordMatch(item, entry) || exactRecordMatch(item.patient, entry)) || removed;
    return removed;
  }

  function deleteExactPatientRecord(patient){
    [STORAGE.patients, 'patients'].forEach(key => {
      const list = readJson(key, []);
      if(Array.isArray(list)) writeJson(key, list.filter(item => !exactRecordMatch(item, patient)));
    });
  }

  window.deletePatientEverywhere = function(id){
    const patient = readJson(STORAGE.patients, []).find(p => String(p.id) === String(id));
    if(!patient) return alert('Patient introuvable.');
    askAdminCode(`supprimer uniquement cette ligne patient: ${patientName(patient)}`, () => {
      deleteExactPatientRecord(patient);
      logAudit('Suppression patient', patientName(patient), `Dossier ${val(patient.dossier, '-')}, code ${patientCode(patient) || '-'}`);
      window.renderPatientsList?.();
      window.renderBiologie?.();
      window.renderSuivi?.();
      window.renderOkChimio?.();
      renderPreparationTodayList();
      cleanupLoginAndButtons();
      showToastSafe('Ligne patient supprimee sans effacer les homonymes.', 'success');
    });
  };

  window.deleteBiologieEntry = function(id){
    askAdminCode('supprimer ce bilan biologique', () => {
      [STORAGE.biologie, 'biologie'].forEach(key => {
        const list = readJson(key, []);
        if(Array.isArray(list)) writeJson(key, list.filter(item => String(val(item.id, item.dateTs)) !== String(id)));
      });
      logAudit('Suppression biologie', id, 'Bilan biologique supprime');
      window.renderBiologie?.();
      showToastSafe('Bilan biologique supprime.', 'success');
    });
  };

  window.deletePreparationRdv = function(id){
    askAdminCode('supprimer ce rendez-vous de preparation', () => {
      const list = readJson(STORAGE.rdv, []);
      writeJson(STORAGE.rdv, list.filter(item => String(item.id) !== String(id)));
      logAudit('Suppression preparation RDV', id, 'Rendez-vous retire de la liste preparation');
      renderPreparationTodayList();
      window.renderRdvList?.();
      showToastSafe('Ligne preparation supprimee.', 'success');
    });
  };

  function sameBiologiePatient(item, patient){
    return (patientCode(patient) && val(item.code, item.codegratuite) === patientCode(patient)) ||
      (patient.dossier && val(item.dossier) === patient.dossier) ||
      norm(item.patient) === norm(patientName(patient));
  }

  window.loadLatestBiologieForEdit = function(){
    const selected = document.getElementById('bio-patient-select')?.value || '';
    const typedPatient = document.getElementById('bio-patient')?.value || '';
    const patient = findBiologieCandidate(selected, typedPatient);
    if(!patient) return alert('Selectionner le patient a modifier.');
    const list = readJson(STORAGE.biologie, readJson('biologie', []));
    const existing = list.find(item => sameBiologiePatient(item, patient) && String(val(item.treatmentDate, item.validationDate, item.dateIso, item.dateTs)).slice(0, 10) === todayIso());
    if(!existing) return alert('Aucun bilan du jour a modifier pour ce patient.');
    ['hb','pnn','plaquettes','creat','asat','alat'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.value = existing[id] || '';
    });
    const dateEl = document.getElementById('bio-result-date');
    if(dateEl) dateEl.value = String(val(existing.resultDate, existing.dateResultat, existing.dateTs, todayIso())).slice(0, 10);
    const saveBtn = document.querySelector('#biologie-content .clinical-save');
    if(saveBtn) saveBtn.dataset.editId = String(existing.id || existing.dateTs || '');
    showToastSafe('Bilan charge pour modification.', 'info');
  };

  window.saveBiologie = function(){
    const select = document.getElementById('bio-patient-select');
    const selected = select?.value || '';
    const typedPatient = document.getElementById('bio-patient')?.value || '';
    const patient = findBiologieCandidate(selected, typedPatient);
    if(!patient) return alert('Selectionner un patient/protocole sauvegarde ou valide dans OK Chimio.');
    const today = todayIso();
    const hasRdvToday = readJson(STORAGE.rdv, []).some(r => r.dateRdv === today && ((patient.dossier && r.dossier === patient.dossier) || patientCode(patient) === val(r.codegratuite, r.code) || norm(patientName(patient)) === norm(patientName(r))));
    if(!hasRdvToday) return alert('La biologie ne peut etre validee que le jour du traitement du patient.');
    const resultDate = document.getElementById('bio-result-date')?.value || today;
    const maxDays = patientAlreadyStartedTreatment(patient) ? 15 : 31;
    const ageDays = daysBetweenIso(resultDate, today);
    if(ageDays > maxDays) return alert(`Date des resultats trop ancienne (${ageDays} jours). Limite: ${maxDays === 15 ? '15 jours' : '1 mois'}.`);
    const entry = {
      id: Date.now().toString(),
      patient: patientName(patient),
      code: patientCode(patient),
      dossier: val(patient.dossier, patient.numeroDossier),
      resultDate,
      treatmentDate: today,
      hb: document.getElementById('hb')?.value || '',
      pnn: document.getElementById('pnn')?.value || '',
      plaquettes: document.getElementById('plaquettes')?.value || '',
      creat: document.getElementById('creat')?.value || '',
      asat: document.getElementById('asat')?.value || '',
      alat: document.getElementById('alat')?.value || '',
      date: new Date().toLocaleDateString('fr-FR'),
      dateTs: new Date().toISOString()
    };
    const list = readJson(STORAGE.biologie, readJson('biologie', []));
    const saveBtn = document.querySelector('#biologie-content .clinical-save');
    const editId = saveBtn?.dataset.editId || '';
    const existingIdx = list.findIndex(item => sameBiologiePatient(item, patient) && String(val(item.treatmentDate, item.validationDate, item.dateIso, item.dateTs)).slice(0, 10) === today);
    if(existingIdx >= 0 && !editId){
      alert('Biologie deja validee aujourd hui pour ce patient. Utilisez le bouton Modifier le bilan du jour en cas d erreur.');
      return;
    }
    if(existingIdx >= 0) list[existingIdx] = {...list[existingIdx], ...entry, id:list[existingIdx].id || entry.id, modifiedAt:new Date().toISOString()};
    else list.push(entry);
    if(saveBtn) saveBtn.dataset.editId = '';
    writeJson(STORAGE.biologie, list);
    writeJson('biologie', list);
    logAudit(editId || existingIdx >= 0 ? 'Modification biologie' : 'Validation biologie', patientName(patient), `Hb ${val(entry.hb, '-')}, resultats ${resultDate}`);
    window.renderBiologie?.();
    if(document.getElementById('page-transfusion')?.classList.contains('active')) window.renderTransfusion?.();
    showToastSafe('Bilan biologique enregistre.', 'success');
  };

  window.renderDashboard = function(){
    const el = document.getElementById('dashboard-content');
    if(!el) return;
    const patients = readJson(STORAGE.patients, []);
    const rdv = readJson(STORAGE.rdv, readJson('rdv', []));
    const hist = readJson(STORAGE.historique, readJson('historique', []));
    const ok = readJson(STORAGE.okchimio, readJson('chncak_okchimio', []));
    const suivi = readJson(STORAGE.suivi, readJson('suivi', []));
    const bio = readJson(STORAGE.biologie, readJson('biologie', []));
    const catalog = readJson(STORAGE.catalog, []);
    const responsables = readJson('chncak_responsables', {});
    const teamPhoto = localStorage.getItem('chncak_dashboard_team_photo') || localStorage.getItem('dashboardTeamPhoto') || localStorage.getItem('teamPhoto') || '';
    const leaderPhoto = key => localStorage.getItem(`chncak_dashboard_photo_${key}`) || '';
    const photoBlock = (key, label, initials) => {
      const img = leaderPhoto(key);
      return `<div class="leader-photo" ondblclick="chooseDashboardPhoto('${esc(key)}')" title="Double-clic discret pour changer la photo">${img ? `<img src="${img}" alt="${esc(label)}">` : `<span>${esc(initials)}</span>`}</div>`;
    };
    if(teamPhoto && !localStorage.getItem('chncak_dashboard_team_photo')) localStorage.setItem('chncak_dashboard_team_photo', teamPhoto);
    const now = new Date();
    const timeText = now.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
    const dateText = now.toLocaleDateString('fr-FR', {weekday:'long', day:'2-digit', month:'long', year:'numeric'});
    const today = new Date();
    today.setHours(0,0,0,0);
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);
    const upcoming = rdv
      .map(r => ({...r, _date:new Date(val(r.dateRdv, r.date) + 'T00:00:00')}))
      .filter(r => !isNaN(r._date) && r._date >= today && r._date <= weekEnd)
      .sort((a,b) => a._date - b._date);
    const normStatus = value => norm(value);
    const active = patients.filter(p => !['termine','traite','archive','decede'].includes(normStatus(p.statut))).length;
    const treated = rdv.filter(r => normStatus(val(r.status, r.statut)).includes('traite') || r.validatedAt).length;
    const lowStock = catalog.filter(item => Number(val(item.qteStock, item.stock, item.quantite, 0)) <= 5).length;
    const countBy = (items, fn) => items.reduce((acc, item) => {
      const key = val(fn(item), 'Non renseigne');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const miniRows = data => Object.entries(data).sort((a,b) => b[1] - a[1]).slice(0, 6)
      .map(([name, count]) => `<div class="dash-line"><span>${esc(name)}</span><strong>${count}</strong></div>`).join('') ||
      '<div class="dash-empty">Aucune donnee.</div>';
    const rdvRows = upcoming.slice(0, 8).map(r => `
      <tr>
        <td>${esc(r._date.toLocaleDateString('fr-FR'))}</td>
        <td><strong>${esc(patientName(r))}</strong><div class="dash-muted">${esc(val(r.dossier, r.codegratuite, '-'))}</div></td>
        <td>${esc(protocolNameFor(r))}</td>
        <td>${esc(val(r.medecin, '-'))}</td>
        <td><span class="dash-status ${normStatus(val(r.status, r.statut)).includes('traite') ? 'ok' : ''}">${esc(val(r.status, r.statut, 'planifie'))}</span></td>
      </tr>`).join('');
    const consultToday = consultRdvList().filter(row => row.dateRdv === todayIso() && !(norm(val(row.statut, row.status)).includes('consulte') || row.consultedAt));
    const consultByDoctor = Object.entries(consultToday.reduce((acc, row) => {
      const med = val(row.medecin, 'Medecin non renseigne');
      acc[med] = acc[med] || [];
      acc[med].push(row);
      return acc;
    }, {})).map(([med, rows]) => `
      <div class="consult-dash-doctor">
        <h3>${esc(med)} <span>${rows.length}</span></h3>
        ${rows.map(row => `<div class="dash-line"><span>${esc(row.prenom)} ${esc(row.nom)}<small>${esc(row.contact || '')}</small></span><strong>${esc(row.adresse || '-')}</strong></div>`).join('')}
      </div>`).join('');
    el.innerHTML = `
      <div class="dashboard-shell dash-final">
        <div class="dash-final-hero">
          <div class="dash-final-title">
            <img src="${document.querySelector('.nav-logo img')?.src || ''}" alt="CHNCAK">
            <div>
              <span>Centre Hospitalier National Cheikh Ahmadoul Khadim</span>
              <h2>Tableau de bord ChimioPro</h2>
              <p>Vue de pilotage du service : activité, rendez-vous, protocoles, suivi, biologie et pharmacie centrale.</p>
            </div>
          </div>
          <div class="dashboard-team-panel dash-final-photo" ondblclick="chooseDashboardPhoto('team')" title="Double-clic discret pour changer la photo de l'equipe">
            ${teamPhoto ? `<img src="${teamPhoto}" alt="Equipe CHNCAK">` : '<div class="dashboard-team-empty">Photo de l equipe</div>'}
          </div>
        </div>
        <div class="dash-clock-lead">
          <div class="dash-clock-card"><span>Heure locale</span><strong id="dashboard-live-clock">${esc(timeText)}</strong><em>${esc(dateText)}</em></div>
          <div class="dash-leadership">
            <div class="lead-director">${photoBlock('directrice','Directrice','BB')}<div><span>Directrice de l'hopital</span><strong>Dr Bineta Diabel Ba MBACKE</strong></div></div>
            <div>${photoBlock('oncologie','Chef oncologie','MM')}<div><span>Chef du service Oncologie-Radiotherapie</span><strong>Dr MAIMOUNA MANE</strong><em>Oncologue-radiotherapeute</em></div></div>
            <div>${photoBlock('pharmacie','Chef pharmacie','AN')}<div><span>Chef de service Pharmacie</span><strong>Dr Abdoulahi NDIAYE</strong></div></div>
            <div>${photoBlock('surveillant','Surveillant','SM')}<div><span>Surveillant du service Oncologie-Radiotherapie</span><strong>SERIGNE MOR SAMB GUEYE</strong></div></div>
          </div>
        </div>
        <div class="dash-online-card"><div><span>Comptes connectes</span><strong>${esc(val(currentUser().name, currentUser().username, 'Utilisateur local'))}</strong></div><em>Emplacement pret pour le temps reel. La synchronisation multi-postes passera par Supabase.</em></div>
        <div class="dash-final-grid">
          <div class="dash-final-kpi"><span>Patients</span><strong>${patients.length}</strong><em>${active} en cours</em></div>
          <div class="dash-final-kpi"><span>RDV 7 jours</span><strong>${upcoming.length}</strong><em>${treated} traites</em></div>
          <div class="dash-final-kpi"><span>Protocoles</span><strong>${hist.length}</strong><em>${ok.length} OK Chimio</em></div>
          <div class="dash-final-kpi"><span>Suivi & bio</span><strong>${suivi.length + bio.length}</strong><em>${suivi.length} suivi, ${bio.length} bio</em></div>
          <div class="dash-final-kpi ${lowStock ? 'warn' : ''}"><span>Stock bas</span><strong>${lowStock}</strong><em>seuil <= 5 flacons</em></div>
        </div>
        <div class="dash-final-main">
          <div class="card"><div class="card-header"><h2>Rendez-vous prochains</h2><button class="btn-secondary" onclick="renderDashboard()">Actualiser</button></div><div class="card-body dash-table-wrap"><table class="dash-table"><thead><tr><th>Date</th><th>Patient</th><th>Protocole</th><th>Medecin</th><th>Statut</th></tr></thead><tbody>${rdvRows || '<tr><td colspan="5" class="dash-empty">Aucun rendez-vous dans les 7 prochains jours.</td></tr>'}</tbody></table></div></div>
          <div class="dash-final-side">
            <div class="card"><div class="card-header"><h2>Protocoles utilises</h2></div><div class="card-body">${miniRows(countBy([...patients, ...hist], p => protocolNameFor(p)))}</div></div>
            <div class="card"><div class="card-header"><h2>Diagnostics</h2></div><div class="card-body">${miniRows(countBy(patients, p => val(p.localisation, p.diagnostic, p.localisations)))}</div></div>
          </div>
        </div>
        <div class="card consultation-dashboard-card"><div class="card-header"><h2>Consultations du jour</h2><button class="btn-secondary" onclick="showPage('rdvconsultation', document.querySelector('.tab-btn[onclick*=rdvconsultation]'))">Voir RDV consultations</button></div><div class="card-body">${consultByDoctor || '<div class="dash-empty">Aucune consultation programmee aujourd hui.</div>'}</div></div>
        <div class="dash-final-resp">Salle chimio : <b>${esc(val(responsables.chimio, '-'))}</b> - Preparation : <b>${esc(val(responsables.preparation, '-'))}</b> - Pharmacie : <b>${esc(val(responsables.pharmacie, '-'))}</b></div>
      </div>`;
  };

  function protocolIntervalDays(proto, rdv){
    const text = norm(`${val(proto?.rythme, proto?.badge, rdv?.proto, rdv?.rythme)} ${(proto?.drugs || []).map(d => d.ryt || '').join(' ')}`);
    if(text.includes('j8')) return 7;
    if(text.includes('j15') || text.includes('j14')) return 14;
    if(text.includes('j28')) return 28;
    if(text.includes('j21')) return 21;
    return 21;
  }

  function addDaysIso(dateIso, days){
    const d = new Date(String(dateIso || todayIso()).slice(0, 10) + 'T00:00:00');
    d.setDate(d.getDate() + Number(days || 0));
    return d.toISOString().slice(0, 10);
  }

  function ensureNextRdvAfterTreatment(patient, rdv){
    const proto = protocolsList().find(p => p.id === val(patient?.protoId, rdv?.protoId) || norm(p.name) === norm(val(patient?.proto, rdv?.proto)));
    const defaultDate = addDaysIso(val(rdv?.dateRdv, todayIso()), protocolIntervalDays(proto, rdv));
    const nextDate = prompt(`Date du prochain rendez-vous obligatoire pour ${patientName(patient)} :`, defaultDate);
    if(!nextDate) {
      alert('Traitement annule : le prochain rendez-vous est obligatoire.');
      return null;
    }
    if(!/^\d{4}-\d{2}-\d{2}$/.test(nextDate)){
      alert('Date invalide. Format attendu : AAAA-MM-JJ.');
      return null;
    }
    const list = readJson(STORAGE.rdv, []);
    const exists = list.some(r => r.dateRdv === nextDate && ((patient?.dossier && r.dossier === patient.dossier) || norm(patientName(r)) === norm(patientName(patient))));
    if(!exists){
      const entry = {
        ...rdv,
        id: Date.now(),
        dateRdv: nextDate,
        status: 'planifie',
        statut: 'Planifie',
        validatedAt: '',
        stockValide: false,
        cureNum: Number(val(rdv?.cureNum, patient?.cure, 0)) + 1 || val(rdv?.cureNum, patient?.cure, ''),
        createdFromTreatment: val(rdv?.id, ''),
        createdAt: new Date().toISOString()
      };
      list.push(entry);
      list.sort((a,b) => String(a.dateRdv || '').localeCompare(String(b.dateRdv || '')));
      writeJson(STORAGE.rdv, list);
      return entry;
    }
    return list.find(r => r.dateRdv === nextDate && ((patient?.dossier && r.dossier === patient.dossier) || norm(patientName(r)) === norm(patientName(patient))));
  }

  window.traiterRdvStandalone = function(id){
    const list = readJson(STORAGE.rdv, []);
    const idx = list.findIndex(r => String(r.id) === String(id));
    if(idx < 0) return;
    const rdv = list[idx];
    if(rdv.dateRdv !== todayIso()) return alert('Ce patient ne correspond pas au rendez-vous du jour.');
    if((rdv.status || '') === 'traite' || rdv.validatedAt) return alert('Patient deja traite.');
    const patients = readJson(STORAGE.patients, []);
    const patient = patients.find(p => (p.dossier && p.dossier === rdv.dossier) || norm(patientName(p)) === norm(`${rdv.prenom || ''} ${rdv.nom || ''}`)) || {...rdv, proto:rdv.proto, protoId:rdv.protoId};
    if(!hasPharmaValidation(patient, rdv)){
      alert('Validation pharmacien obligatoire avant de marquer le patient traite.');
      if(typeof showPage === 'function') showPage('preparation', document.querySelector(".tab-btn[onclick*=\"preparation\"]"));
      setTimeout(() => {
        loadEntryIntoForm({...patient, ...rdv});
        ensurePreparationPrintReady();
      }, 150);
      return;
    }
    const bio = latestBiologieForPatient(patient, rdv);
    if(!bio){
      alert('Veuillez renseigner la biologie du patient avant de le marquer traite.');
      if(typeof showPage === 'function') showPage('biologie', document.querySelector(".tab-btn[onclick*=\"biologie\"]"));
      setTimeout(() => {
        const select = document.getElementById('bio-patient-select');
        if(select){
          Array.from(select.options).forEach(opt => {
            if(norm(opt.textContent).includes(norm(patientName(patient))) || norm(opt.textContent).includes(norm(patient.dossier))) select.value = opt.value;
          });
          window.loadBiologiePatient?.();
        }
      }, 150);
      return;
    }
    const warningsBio = bioWarnings(bio);
    if(warningsBio.length && !confirm('Bilan biologique a verifier :\n- ' + warningsBio.join('\n- ') + '\n\nContinuer et marquer patient traite ?')) return;
    const oldBio = bioDateWarnings(patient, rdv);
    if(oldBio.length) return alert(oldBio.join('\n'));
    const nextRdv = ensureNextRdvAfterTreatment(patient, rdv);
    if(!nextRdv) return;
    const stock = deductStockForPatient({...patient, protoId: val(patient.protoId, rdv.protoId), proto: val(patient.proto, rdv.proto), carboDose:val(patient.carboDose, rdv.carboDose), clairance:val(patient.clairance, rdv.clairance), auc:val(patient.auc, rdv.auc)}, 'RDV traite', rdv);
    const updatedRdvList = readJson(STORAGE.rdv, list);
    const updatedIdx = updatedRdvList.findIndex(r => String(r.id) === String(id));
    if(updatedIdx >= 0) updatedRdvList[updatedIdx] = {...updatedRdvList[updatedIdx], status:'traite', statut:'Traite', validatedAt:new Date().toISOString(), stockWarnings:stock.warnings, stockDetails:stock.details};
    writeJson(STORAGE.rdv, updatedRdvList);
    const pidx = patients.findIndex(p => String(p.id) === String(patient.id) || (p.dossier && p.dossier === patient.dossier));
    if(pidx >= 0){
      patients[pidx].statut = 'Traité';
      patients[pidx].dateFin = new Date().toISOString();
      writeJson(STORAGE.patients, patients);
    }
    window.drawRdvRows?.();
    window.renderRdvList?.();
    window.renderDashboard?.();
    window.renderPharmacie?.();
    window.renderBiologie?.();
    alert(`Patient traite. Prochain RDV: ${nextRdv.dateRdv.split('-').reverse().join('/')}. Stock deduit pour ${stock.updated} medicament(s).${stock.warnings.length ? '\n\nAvertissements:\n' + stock.warnings.join('\n') : ''}`);
  };

  window.setStatut = function(patientId, statut){
    const patients = readJson(STORAGE.patients, []);
    const idx = patients.findIndex(p => String(p.id) === String(patientId));
    if(idx < 0) return alert('Patient non trouve.');
    if(norm(statut).includes('traite')){
      const bio = latestBiologieForPatient(patients[idx]);
      if(!bio) return alert('Veuillez renseigner la biologie du patient avant de le marquer traite.');
      const warnings = bioWarnings(bio);
      if(warnings.length && !confirm('Bilan biologique a verifier :\n- ' + warnings.join('\n- ') + '\n\nContinuer ?')) return;
      const stock = deductStockForPatient(patients[idx], 'Patient traite');
      patients[idx].stockDeduction = stock;
      patients[idx].dateFin = new Date().toISOString();
    }
    patients[idx].statut = statut;
    writeJson(STORAGE.patients, patients);
    window.renderPatientsList?.();
    window.renderProgramme?.();
    window.renderDashboard?.();
    window.renderPharmacie?.();
    alert(`Statut mis a jour : ${statut}`);
  };

  window.showAddPatientModal = function(editId){
    const modal = document.getElementById('patient-modal');
    if(!modal) return alert('Fenetre patient introuvable.');
    modal.dataset.editId = editId || '';
    document.getElementById('patient-modal-title').textContent = editId ? 'Modifier patient' : 'Nouveau patient';
    const protoSel = document.getElementById('pm-proto');
    if(protoSel) protoSel.innerHTML = '<option value="">Selectionner</option>' + protocolsList().map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
    const medSel = document.getElementById('pm-medecin');
    const meds = readJson('chncak_medecins', window.medecins || []);
    if(medSel) medSel.innerHTML = '<option value="">Selectionner</option>' + meds.map(m => `<option value="${esc(m.name || `${m.prenom || ''} ${m.nom || ''}`.trim())}">${esc(m.name || `${m.prenom || ''} ${m.nom || ''}`.trim())}</option>`).join('');
    ['pm-prenom','pm-nom','pm-age','pm-tel','pm-dossier','pm-localisation','pm-obs','pm-cure','pm-total-cures','pm-date-debut'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
    ['pm-proto','pm-medecin'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
    const status = document.getElementById('pm-statut'); if(status) status.value = 'actif';
    const sex = document.getElementById('pm-sexe'); if(sex) sex.value = 'F';
    if(editId){
      const p = readJson(STORAGE.patients, []).find(x => String(x.id) === String(editId));
      if(p){
        const set = (id, value) => { const el = document.getElementById(id); if(el) el.value = value || ''; };
        set('pm-prenom', p.prenom); set('pm-nom', p.nom); set('pm-age', p.age); set('pm-sexe', p.sexe || 'F'); set('pm-tel', p.tel || p.contact);
        set('pm-dossier', p.dossier); set('pm-proto', p.protoId); set('pm-localisation', p.localisation || p.diagnostic); set('pm-medecin', p.medecin);
        set('pm-cure', p.cure); set('pm-total-cures', p.totalCures); set('pm-date-debut', p.dateDebut); set('pm-statut', p.statut || 'actif'); set('pm-obs', p.obs);
      }
    }
    modal.style.display = 'flex';
  };

  window.savePatient = function(){
    const modal = document.getElementById('patient-modal');
    const editId = modal?.dataset.editId || '';
    const prenom = document.getElementById('pm-prenom')?.value.trim();
    const nom = document.getElementById('pm-nom')?.value.trim();
    if(!prenom || !nom) return alert('Prenom et nom obligatoires.');
    const protoId = document.getElementById('pm-proto')?.value || '';
    const proto = protocolsList().find(p => p.id === protoId);
    const entry = {
      id: editId || Date.now().toString(), prenom, nom,
      age: document.getElementById('pm-age')?.value || '', sexe: document.getElementById('pm-sexe')?.value || 'F',
      tel: document.getElementById('pm-tel')?.value || '', dossier: document.getElementById('pm-dossier')?.value || '',
      protoId, proto: proto?.name || '', protocole: proto?.name || '',
      localisation: document.getElementById('pm-localisation')?.value || '',
      medecin: document.getElementById('pm-medecin')?.value || '',
      cure: Number(document.getElementById('pm-cure')?.value || 1), totalCures: Number(document.getElementById('pm-total-cures')?.value || 0),
      dateDebut: document.getElementById('pm-date-debut')?.value || '', statut: document.getElementById('pm-statut')?.value || 'actif',
      obs: document.getElementById('pm-obs')?.value || '', updatedAt: new Date().toISOString()
    };
    const list = readJson(STORAGE.patients, []);
    const idx = list.findIndex(p => String(p.id) === String(entry.id) || (entry.dossier && p.dossier === entry.dossier));
    if(idx >= 0) list[idx] = {...list[idx], ...entry, id:list[idx].id || entry.id};
    else list.push(entry);
    writeJson(STORAGE.patients, list);
    logAudit(editId ? 'Modification patient' : 'Ajout patient', `${prenom} ${nom}`.trim(), `Dossier ${val(entry.dossier, '-')}, protocole ${val(entry.protocole, '-')}`);
    if(modal) modal.style.display = 'none';
    window.renderPatientsList?.();
  };

  function renderPatientsListFinal(){
    const el = document.getElementById('patients-list-content');
    if(!el) return;
    const q = norm(document.getElementById('patients-search')?.value || '');
    const list = readJson(STORAGE.patients, []).filter(p => !q || norm(`${p.prenom} ${p.nom} ${p.dossier} ${p.proto} ${p.protocole} ${p.medecin}`).includes(q));
    const rows = list.map((p, i) => {
      const proto = val(p.proto, p.protocole, p.protoName, protocolsList().find(x => x.id === p.protoId)?.name, '-');
      return `<tr style="${i%2?'background:white':'background:#FAFBFD'}"><td>${esc(p.dossier || '-')}</td><td><b>${esc(patientName(p))}</b><div class="dash-muted">${esc(val(p.age) ? p.age + ' ans' : '')}</div></td><td>${esc(p.tel || p.contact || '-')}</td><td><span class="pbadge b21">${esc(proto)}</span></td><td>${esc(p.localisation || p.diagnostic || '-')}</td><td>${esc(val(p.cure, '-'))}/${esc(val(p.totalCures, '-'))}</td><td>${esc(p.medecin || '-')}</td><td>${esc(p.statut || 'actif')}</td><td><button class="btn-secondary" onclick="showAddPatientModal('${esc(p.id)}')">Modifier</button><button class="btn-secondary" style="margin-left:6px;color:#C0392B;border-color:#F5AAAA;background:#fff5f5" onclick="deletePatientEverywhere('${esc(p.id)}')">Supprimer</button></td></tr>`;
    }).join('');
    document.getElementById('patients-subtitle') && (document.getElementById('patients-subtitle').textContent = `${list.length} patient(s)`);
    el.innerHTML = `<table class="dash-table"><thead><tr><th>Dossier</th><th>Patient</th><th>Contact</th><th>Protocole</th><th>Localisation</th><th>Cure</th><th>Medecin</th><th>Statut</th><th>Actions</th></tr></thead><tbody>${rows || '<tr><td colspan="9" class="dash-empty">Aucun patient.</td></tr>'}</tbody></table>`;
  }
  window.renderPatientsList = renderPatientsListFinal;

  function currentProtocolFormPatient(){
    const proto = protocolsList().find(p => p.id === (typeof selId !== 'undefined' ? selId : ''));
    const formIds = [
      'prenom','nom','age','poids','taille','sexe','dossier','cubix','codegratuite','tel-patient',
      'date-protocole','indication','medecin-select','localisation','type-histologie','stade','nationalite','ligne-traitement',
      'atcd-select','atcd','groupe-sanguin','creatinine','auc-cible','auc-custom','date-rdv','total-cures','cure-num'
    ];
    const formSnapshot = formIds.reduce((acc, id) => {
      const el = document.getElementById(id);
      if(el) acc[id] = el.value || '';
      return acc;
    }, {});
    return {
      formSnapshot,
      prenom: document.getElementById('prenom')?.value?.trim() || '',
      nom: document.getElementById('nom')?.value?.trim() || '',
      age: document.getElementById('age')?.value || '',
      poids: document.getElementById('poids')?.value || '',
      taille: document.getElementById('taille')?.value || '',
      sexe: document.getElementById('sexe')?.value || '',
      nationalite: document.getElementById('nationalite')?.value || '',
      ligne: document.getElementById('ligne-traitement')?.value || '',
      ligneTraitement: document.getElementById('ligne-traitement')?.value || '',
      dossier: document.getElementById('dossier')?.value || '',
      cubix: document.getElementById('cubix')?.value || '',
      codegratuite: document.getElementById('codegratuite')?.value?.trim() || '',
      tel: document.getElementById('tel-patient')?.value || '',
      medecin: document.getElementById('medecin-select')?.value || '',
      localisation: document.getElementById('localisation')?.value || '',
      indication: document.getElementById('indication')?.value || '',
      atcd: typeof getAtcd === 'function' ? getAtcd() : val(document.getElementById('atcd')?.value, document.getElementById('atcd-select')?.value),
      antecedents: typeof getAtcd === 'function' ? getAtcd() : val(document.getElementById('atcd')?.value, document.getElementById('atcd-select')?.value),
      groupeSanguin: document.getElementById('groupe-sanguin')?.value || '',
      groupe: document.getElementById('groupe-sanguin')?.value || '',
      histologie: document.getElementById('type-histologie')?.value || '',
      stade: document.getElementById('stade')?.value || '',
      phaseDiagnostic: document.getElementById('stade')?.value || '',
      protoId: proto?.id || '',
      protocole: proto?.name || '',
      dateProto: document.getElementById('date-protocole')?.value || '',
      dateRdv: document.getElementById('date-rdv')?.value || '',
      creatinine: document.getElementById('creatinine')?.value || '',
      carboDose: (typeof carboDose !== 'undefined' && Number(carboDose)) ? Number(carboDose) : '',
      auc: document.getElementById('auc-cible')?.value || '',
      aucCustom: document.getElementById('auc-custom')?.value || '',
      clairance: document.getElementById('res-clcr')?.textContent || '',
      cure: document.getElementById('cure-num')?.value || '',
      totalCures: document.getElementById('total-cures')?.value || ''
    };
  }

  function savedCodeExists(code, currentPatient){
    if(!code) return false;
    const sameIdentity = item => {
      if(!currentPatient) return false;
      return (currentPatient.dossier && val(item.dossier, item.patient?.dossier) === currentPatient.dossier) ||
        norm(patientName(item)) === norm(patientName(currentPatient));
    };
    const same = item => String(val(item.codegratuite, item.codeGratuite, item.code, item.patient?.codegratuite, item.patient?.codeGratuite)).trim() === String(code).trim() && !sameIdentity(item);
    return [
      STORAGE.patients,
      STORAGE.rdv,
      STORAGE.historique,
      STORAGE.okchimio,
      'chncak_okchimio',
      'chncak_rdv',
      'chncak_hematologie_patients'
    ].some(key => readJson(key, []).some(same));
  }

  function protocolIdentifierConflict(patient){
    if(!patient) return null;
    const identifiers = [
      ['ID CUBIX', val(patient.cubix, patient.idCubix)],
      ['Numero dossier', val(patient.dossier, patient.numeroDossier)],
      ['Code gratuite', val(patient.codegratuite, patient.codeGratuite, patient.code)]
    ].map(([label, value]) => [label, norm(value)]).filter(([, value]) => value);
    if(!identifiers.length) return null;
    const protocolName = norm(protocolNameFor(patient));
    const hasProtocol = item => norm(protocolNameFor(item)) || val(item.protoId, item.patient?.protoId);
    const sameProtocol = item => {
      const itemProtocol = norm(protocolNameFor(item));
      return !protocolName || !itemProtocol || itemProtocol === protocolName;
    };
    const valueOf = (item, field) => {
      const p = item?.patient || {};
      if(field === 'ID CUBIX') return norm(val(item?.cubix, item?.idCubix, p.cubix, p.idCubix));
      if(field === 'Numero dossier') return norm(val(item?.dossier, item?.numeroDossier, p.dossier, p.numeroDossier));
      return norm(val(item?.codegratuite, item?.codeGratuite, item?.code, p.codegratuite, p.codeGratuite, p.code));
    };
    const sources = [
      ['historique', STORAGE.historique],
      ['historique', 'historique'],
      ['OK Chimio', STORAGE.okchimio],
      ['OK Chimio', 'chncak_okchimio'],
      ['RDV', STORAGE.rdv],
      ['RDV', 'rdv'],
      ['patients', STORAGE.patients]
    ];
    for(const [sourceLabel, key] of sources){
      const rows = readJson(key, []);
      if(!Array.isArray(rows)) continue;
      for(const item of rows){
        if(key === STORAGE.patients && !hasProtocol(item)) continue;
        if(!sameProtocol(item)) continue;
        for(const [label, value] of identifiers){
          if(value && valueOf(item, label) === value){
            return {label, value, source:sourceLabel, patient:patientName(item) || patientName(item?.patient)};
          }
        }
      }
    }
    return null;
  }

  function savedProtocolExists(patient){
    if(!patient) return false;
    const same = item => patientTreatmentKey(item) === patientTreatmentKey(patient) ||
      ((patient.dossier || patient.codegratuite) &&
        val(item.dossier, item.patient?.dossier) === patient.dossier &&
        String(val(item.codegratuite, item.codeGratuite, item.code, item.patient?.codegratuite, item.patient?.codeGratuite)).trim() === String(patient.codegratuite || '').trim() &&
        norm(protocolNameFor(item)) === norm(protocolNameFor(patient)));
    return [
      STORAGE.historique,
      STORAGE.okchimio,
      'chncak_okchimio',
      STORAGE.patients
    ].some(key => readJson(key, []).some(same));
  }

  function setRestoredProtocolMode(entry){
    const btn = document.getElementById('btn-save');
    const key = patientTreatmentKey(entry);
    if(btn){
      btn.dataset.restoredKey = key;
      btn.dataset.restoredLocked = '1';
      btn.disabled = true;
      btn.textContent = 'Consultation - deja sauvegarde';
      btn.title = 'Ce protocole vient de l apercu/RDV. Il est deja sauvegarde, donc la resauvegarde est bloquee pour eviter les doublons.';
    }
    writeJson(RESTORED_PROTOCOL_KEY, {key, at:new Date().toISOString()});
  }

  function clearRestoredProtocolMode(){
    const btn = document.getElementById('btn-save');
    if(btn){
      btn.dataset.restoredKey = '';
      btn.dataset.restoredLocked = '';
      btn.disabled = false;
      btn.textContent = '💾 Sauvegarder';
      btn.title = '';
    }
    localStorage.removeItem(RESTORED_PROTOCOL_KEY);
  }

  function bindRestoredProtocolUnlock(){
    const page = document.getElementById('page-protocole');
    if(!page || page.dataset.restoreUnlockBound === '1') return;
    page.dataset.restoreUnlockBound = '1';
    page.addEventListener('input', event => {
      const btn = document.getElementById('btn-save');
      if(btn?.dataset.restoredLocked === '1' && event.target && ['INPUT','SELECT','TEXTAREA'].includes(event.target.tagName)){
        btn.disabled = false;
        btn.dataset.restoredLocked = '';
        btn.textContent = 'Sauvegarder les modifications';
        btn.title = 'Attention : verifiez qu il s agit bien d une modification, pas d une nouvelle sauvegarde identique.';
      }
    }, true);
    page.addEventListener('change', event => {
      const btn = document.getElementById('btn-save');
      if(btn?.dataset.restoredLocked === '1' && event.target && ['INPUT','SELECT','TEXTAREA'].includes(event.target.tagName)){
        btn.disabled = false;
        btn.dataset.restoredLocked = '';
        btn.textContent = 'Sauvegarder les modifications';
        btn.title = 'Attention : verifiez qu il s agit bien d une modification, pas d une nouvelle sauvegarde identique.';
      }
    }, true);
  }

  function clearProtocolFormForNextPatient(message){
    [
      'prenom','nom','age','poids','taille','sexe','dossier','cubix','tel-patient','indication',
      'localisation','type-histologie','stade','nationalite','ligne-traitement','atcd','groupe-sanguin','creatinine','auc-custom','date-rdv','total-cures','cure-num'
    ].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.value = '';
    });
    const atcdSelect = document.getElementById('atcd-select');
    if(atcdSelect) atcdSelect.value = 'RAS';
    if(typeof onAtcdChange === 'function') onAtcdChange();
    const auc = document.getElementById('auc-cible');
    if(auc) auc.value = '5';
    const seq = document.getElementById('num-seq');
    if(seq) seq.value = '';
    const date = document.getElementById('date-protocole');
    if(date) date.value = todayIso();
    const code = document.getElementById('codegratuite');
    if(code){
      code.dataset.manual = '';
      code.readOnly = true;
    }
    setProtocolAutoCode(true);
    setTimeout(() => setProtocolAutoCode(true), 50);
    if(typeof calcSC === 'function') calcSC();
    if(typeof calcCarbo === 'function') calcCarbo();
    if(typeof update === 'function') update();
    if(typeof updateProgress === 'function') updateProgress();
    if(typeof renderPreview === 'function') renderPreview();
    if(typeof renderPreparation === 'function') renderPreparation();
    if(typeof renderSupport === 'function') renderSupport();
    showToastSafe(message || 'Protocole sauvegarde. Formulaire pret pour le prochain patient.', 'success');
  }

  window.clearProtocolFormDiscreet = function(){
    if(!confirm('Vider le formulaire du protocole en cours ?\n\nAucune donnee ne sera sauvegardee.')) return;
    clearRestoredProtocolMode();
    clearProtocolFormForNextPatient('Formulaire vide. Prochain code gratuite propose.');
  };

  window.saveProtocol = function(){
    const saveBtn = document.getElementById('btn-save');
    if(saveBtn?.dataset.saving === '1') return;
    if(saveBtn?.dataset.restoredLocked === '1'){
      alert('Ce protocole est deja sauvegarde. Il a ete ouvert depuis l apercu/RDV en consultation pour eviter un doublon.');
      return;
    }
    if(saveBtn) saveBtn.dataset.saving = '1';
    setProtocolAutoCode(false);
    const patient = currentProtocolFormPatient();
    const finish = () => { if(saveBtn) setTimeout(() => { saveBtn.dataset.saving = ''; }, 700); };
    if(!patient.prenom || !patient.nom){ finish(); return alert('Veuillez renseigner au minimum prenom et nom.'); }
    if(!patient.dossier){ finish(); return alert('Veuillez renseigner le numero de dossier.'); }
    const cureNum = Number(patient.cure || 0);
    const totalCures = Number(patient.totalCures || 0);
    if(totalCures && cureNum > totalCures){
      finish();
      return alert(`Depassement de cures bloque : cure ${cureNum} alors que le total prescrit est ${totalCures}.\n\nSi le medecin decide de poursuivre, modifiez d abord le nombre total de cures prescrit.`);
    }
    if(!patient.codegratuite) patient.codegratuite = setProtocolAutoCode(true);
    if(patient.codegratuite && savedCodeExists(patient.codegratuite, patient)){
      alert('Code de gratuite deja utilise. Enregistrement refuse pour eviter un doublon.');
      finish();
      return;
    }
    const identifierConflict = protocolIdentifierConflict(patient);
    if(identifierConflict){
      alert(`${identifierConflict.label} deja utilise dans ${identifierConflict.source}. Enregistrement refuse pour eviter une sauvegarde accidentelle du meme patient/protocole.`);
      finish();
      return;
    }
    if(savedProtocolExists(patient)){
      alert('Ce protocole existe deja pour ce patient. Enregistrement refuse pour eviter un doublon.');
      finish();
      return;
    }
    const history = readJson(STORAGE.historique, []);
    const historyEntry = {
      ...patient,
      id: Date.now(),
      date: new Date().toLocaleDateString('fr-FR'),
      dateTs: Date.now(),
      sc: typeof sc !== 'undefined' && Number(sc) ? Number(sc).toFixed(2) : '',
      protoId: patient.protoId,
      protoName: patient.protocole
    };
    history.unshift(historyEntry);
    writeJson(STORAGE.historique, dedupeByPatientTreatment(history));
    const list = readJson(STORAGE.patients, []);
    const idx = list.findIndex(p => (patient.dossier && p.dossier === patient.dossier) || (norm(patientName(p)) === norm(`${patient.prenom} ${patient.nom}`)));
    const entry = {...patient, proto: patient.protocole, updatedAt:new Date().toISOString(), statut:'actif'};
    if(idx >= 0) list[idx] = {...list[idx], ...entry, id:list[idx].id || Date.now().toString()};
    else list.push({...entry, id:Date.now().toString()});
    writeJson(STORAGE.patients, dedupeByPatientTreatment(list));
    const okList = getOkChimioList();
    const okExists = okList.some(item => patientTreatmentKey(item) === patientTreatmentKey(entry));
    if(!okExists){
      okList.push({...entry, id:Date.now().toString(), patient:entry, statut:'En attente', dateCreation:new Date().toISOString()});
      saveOkChimioList(okList);
    }
    window.renderPatientsList?.();
    window.renderOkChimio?.();
    reserveCodeGratuite(patient.codegratuite);
    writeJson(LAST_PROTOCOL_PATIENT_KEY, entry);
    logAudit('Protocole sauvegarde', patientName(entry), `Dossier ${val(entry.dossier, '-')}, code ${val(entry.codegratuite, '-')}, protocole ${val(entry.protocole, '-')}`);
    clearProtocolFormForNextPatient();
    clearRestoredProtocolMode();
    try { openValidationEmail(patient); } catch(e){}
    finish();
  };

  window.validerOkChimio = function(id){
    const list = getOkChimioList();
    const idx = findOkChimioEntry(list, id);
    if(idx < 0) return alert('Protocole introuvable dans OK Chimio.');
    list[idx] = ensureOkChimioId({...list[idx], statut:'Valide', status:'Valide', dateValidation:new Date().toISOString()});
    saveOkChimioList(list);
    logAudit('OK Chimio valide', patientName(list[idx]), `Protocole ${protocolNameFor(list[idx])}`);
    window.renderOkChimio?.();
    window.renderBiologie?.();
    showToastSafe('Protocole valide. Ouverture du mail de notification.', 'success');
    try { openValidationEmail(list[idx]); } catch(e){}
  };

  window.notifyProtocolValidation = function(id){
    const list = getOkChimioList();
    const entry = list.find(item => String(item.id) === String(id));
    if(entry) openValidationEmail(entry);
  };

  window.previewProtocol = function(id){
    const list = getOkChimioList();
    const idx = findOkChimioEntry(list, id);
    const entry = idx >= 0 ? list[idx] : null;
    if(!entry) return alert('Protocole introuvable dans OK Chimio.');
    const patient = {...(entry.patient || {}), ...entry};
    if(!loadEntryIntoForm(patient)) return alert('Impossible de charger ce patient pour l apercu.');
    if(typeof showPage === 'function') showPage('apercu', document.querySelector(".tab-btn[onclick*=\"apercu\"]"));
    setTimeout(() => {
      if(typeof calcSC === 'function') calcSC();
      if(typeof update === 'function') update();
      if(typeof renderApercu === 'function') renderApercu();
      installApercuSearch();
    }, 80);
  };

  window.refuserOkChimio = function(id){
    const motifInput = prompt('Motif du refus :', 'A verifier');
    if(motifInput === null) return;
    const motif = String(motifInput || '').trim() || 'A verifier';
    const list = getOkChimioList();
    const idx = findOkChimioEntry(list, id);
    if(idx < 0) return alert('Protocole introuvable dans OK Chimio.');
    const refused = ensureOkChimioId({...list[idx], statut:'Refuse', status:'Refuse', motifRefus:motif, dateRefus:new Date().toISOString()});
    const archive = readJson('chncak_okchimio_refuses', []);
    archive.unshift(refused);
    writeJson('chncak_okchimio_refuses', archive.slice(0, 500));
    list.splice(idx, 1);
    saveOkChimioList(list);
    logAudit('OK Chimio refuse', patientName(refused), `Motif: ${motif}`);
    window.renderOkChimio?.();
    window.renderBiologie?.();
    showToastSafe('Protocole envoye pour verification et retire des OK chimio en attente.', 'info');
  };

  window.renderOkChimio = function(){
    const list = saveOkChimioList(getOkChimioList());
    const refusedArchive = dedupeByPatientTreatment(readJson('chncak_okchimio_refuses', []));
    const enAttente = list.filter(x => normalizeOkStatus(x) === 'attente');
    const valides = list.filter(x => normalizeOkStatus(x) === 'valide');
    const refuses = dedupeByPatientTreatment([...list.filter(x => normalizeOkStatus(x) === 'refuse'), ...refusedArchive]);
    const stats = document.getElementById('okchimio-stats');
    if(stats){
      stats.innerHTML = `
        <div style="text-align:center;padding:12px;background:#FFF3DC;border-radius:4px"><div style="font-size:24px;font-weight:700;color:#E67E22">${enAttente.length}</div><div style="font-size:10px;color:#888">EN ATTENTE</div></div>
        <div style="text-align:center;padding:12px;background:#E4F5ED;border-radius:4px"><div style="font-size:24px;font-weight:700;color:#0B5E3C">${valides.length}</div><div style="font-size:10px;color:#888">VALIDES</div></div>
        <div style="text-align:center;padding:12px;background:#FDEAEA;border-radius:4px"><div style="font-size:24px;font-weight:700;color:#E74C3C">${refuses.length}</div><div style="font-size:10px;color:#888">REFUSES</div></div>`;
    }
    const host = document.getElementById('okchimio-list');
    if(!host) return;
    if(!enAttente.length){
      host.innerHTML = '<div style="text-align:center;padding:40px;color:#888"><div style="font-size:48px">OK</div><div>Aucun protocole en attente</div></div>';
      return;
    }
    host.innerHTML = `<table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#f5f5f5"><th style="padding:10px;text-align:left">Date</th><th style="padding:10px;text-align:left">Patient</th><th style="padding:10px;text-align:left">Dossier</th><th style="padding:10px;text-align:left">Protocole</th><th style="padding:10px;text-align:center">Cure</th><th style="padding:10px;text-align:left">Medecin</th><th style="padding:10px;text-align:center">Actions</th></tr></thead>
      <tbody>${enAttente.map(e => {
        const p = e.patient || e;
        return `<tr style="border-bottom:1px solid #eee">
          <td style="padding:10px">${esc(val(e.dateCreation, e.date) ? new Date(val(e.dateCreation, e.date)).toLocaleDateString('fr-FR') : '-')}</td>
          <td style="padding:10px;font-weight:600">${esc(patientName(p))}</td>
          <td style="padding:10px">${esc(val(p.dossier, e.dossier, '-'))}</td>
          <td style="padding:10px"><span style="background:#EEF4FD;color:#0A3D7A;padding:4px 8px;border-radius:4px">${esc(val(e.protocole, e.protocolName, p.protocole, p.proto, '-'))}</span></td>
          <td style="padding:10px;text-align:center">C${esc(val(e.cure, p.cure, '-'))}</td>
          <td style="padding:10px">${esc(val(e.medecin, p.medecin, '-'))}</td>
          <td style="padding:10px;text-align:center"><button data-ok-action="preview" data-ok-id="${esc(e.id)}" style="background:#2196F3;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;margin-right:4px">Apercu</button><button data-ok-action="refuse" data-ok-id="${esc(e.id)}" style="background:#E74C3C;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;margin-right:4px">Refuser</button><button data-ok-action="validate" data-ok-id="${esc(e.id)}" style="background:#27AE60;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;margin-right:4px">Valider</button></td>
        </tr>`;
      }).join('')}</tbody></table>`;
    host.onclick = event => {
      const btn = event.target.closest('[data-ok-action]');
      if(!btn) return;
      const id = btn.dataset.okId;
      if(btn.dataset.okAction === 'preview') window.previewProtocol(id);
      if(btn.dataset.okAction === 'refuse') window.refuserOkChimio(id);
      if(btn.dataset.okAction === 'validate') window.validerOkChimio(id);
    };
  };

  window.clearClinicalModuleData = function(module){
    askAdminCode(`effacer l'historique ${module}`, () => {
      if(module === 'suivi'){
        localStorage.removeItem(STORAGE.suivi);
        localStorage.removeItem('suivi');
        localStorage.removeItem(STORAGE.patients);
        localStorage.removeItem('patients');
        window.renderSuivi?.();
        window.renderPatientsList?.();
        window.renderDashboard?.();
        logAudit('Initialisation module', 'Suivi', 'Historique suivi et registre patients effaces');
      }
      if(module === 'biologie'){ localStorage.removeItem(STORAGE.biologie); localStorage.removeItem('biologie'); window.renderBiologie?.(); logAudit('Initialisation module', 'Biologie', 'Historique biologie efface'); }
    });
  };

  let nativeImportAllData = window.importAllData;
  if(!nativeImportAllData?.requiresAccessCode){
    window.importAllData = function(file){
      if(!file) return;
      askAdminCode('restaurer une sauvegarde', () => {
        logAudit('Restauration sauvegarde', val(file.name, 'Fichier sauvegarde'), 'Restauration demandee');
        if(typeof nativeImportAllData === 'function') nativeImportAllData(file);
      });
    };
  }
  nativeImportAllData = window.importAllData;
  if(typeof nativeImportAllData === 'function' && !nativeImportAllData.auditWrapped){
    window.importAllData = function(fileOrInput){
      const file = fileOrInput?.files ? fileOrInput.files[0] : fileOrInput;
      if(!file) return;
      logAudit('Restauration sauvegarde', val(file.name, 'Fichier sauvegarde'), 'Import de sauvegarde lance');
      return nativeImportAllData(file);
    };
    window.importAllData.auditWrapped = true;
    window.importAllData.requiresAccessCode = nativeImportAllData.requiresAccessCode;
  }
  const nativeExportAllData = window.exportAllData;
  if(typeof nativeExportAllData === 'function' && !nativeExportAllData.auditWrapped){
    window.exportAllData = function(){
      logAudit('Export sauvegarde', 'Toutes donnees locales', 'Sauvegarde JSON demandee');
      return nativeExportAllData.apply(this, arguments);
    };
    window.exportAllData.auditWrapped = true;
  }

  window.clearHistory = function(){
    askAdminCode("effacer l'historique", () => {
      localStorage.removeItem(STORAGE.historique);
      if(typeof historique !== 'undefined') try { historique = []; } catch(e) {}
      logAudit('Effacement historique', 'Protocoles', 'Historique protocoles efface');
      window.renderStats?.();
      if(typeof renderHistory === 'function') renderHistory();
    });
  };

  window.clearAllHistory = function(){
    askAdminCode("effacer tout l'historique", () => {
      localStorage.removeItem(STORAGE.historique);
      localStorage.removeItem(STORAGE.sorties);
      localStorage.removeItem(STORAGE.okchimio);
      if(typeof historique !== 'undefined') try { historique = []; } catch(e) {}
      logAudit('Effacement historique complet', 'Historique/stock/OK Chimio', 'Historique, sorties et validations OK Chimio effaces');
      window.renderStats?.();
      if(typeof renderHistory === 'function') renderHistory();
      window.renderOkChimio?.();
    });
  };

  function syncCatalogGlobal(list){
    list = cleanPharmacyCatalog(list);
    writeJson(STORAGE.catalog, list);
    try { if(Array.isArray(window.catalog)) window.catalog = list; } catch(e) {}
    try { if(typeof catalog !== 'undefined') catalog = list; } catch(e) {}
  }

  function visibleMissingDrugName(){
    const rows = Array.from(document.querySelectorAll('#pharma-content tr'));
    const row = rows.find(tr => (tr.textContent || '').toLowerCase().includes('non trouve') || (tr.textContent || '').toLowerCase().includes('non trouvé'));
    return row?.querySelector('td')?.textContent?.trim() || '';
  }

  window.addMissingDrugToCatalog = function(name){
    if(!isPharmacienUser()) return alert('Action reservee au compte pharmacien.');
    const drugName = (name || visibleMissingDrugName() || prompt('Nom du medicament a ajouter au catalogue :') || '').trim().toUpperCase();
    if(!drugName) return;
    const list = readJson(STORAGE.catalog, Array.isArray(window.DEFAULT_CATALOG) ? window.DEFAULT_CATALOG : []);
    if(list.some(item => norm(item.name) === norm(drugName))){
      alert('Ce medicament existe deja dans le catalogue.');
      return;
    }
    const dci = prompt(`DCI pour ${drugName} :`, drugName) || drugName;
    const dosagesRaw = prompt('Dosages disponibles en mg, separes par virgule (ex: 50,100,500) :', '');
    const dosages = String(dosagesRaw || '').split(/[,;\/\s]+/).map(Number).filter(n => n > 0);
    if(!dosages.length) return alert('Dosage invalide. Medicament non ajoute.');
    const stock = Number(prompt('Stock initial en flacons :', '0') || 0);
    const prix = Number(prompt('Prix par flacon en FCFA :', '0') || 0);
    const statutTarif = confirm('Ce medicament est-il gratuit ?\n\nOK = Gratuit\nAnnuler = Payant') ? 'Gratuit' : 'Payant';
    list.push({name:drugName, dci, dosages, forme:'Injectable', cond:'B1', qteStock:stock, prixUnit:prix, statutTarif});
    syncCatalogGlobal(list);
    window.renderCatalogTable?.();
    window.renderPharmacie?.();
    showToastSafe(`${drugName} ajoute au catalogue.`, 'success');
  };

  window.scrollToCatalog = function(){
    const card = document.querySelector('#catalog-body')?.closest('.card');
    card?.scrollIntoView({behavior:'smooth', block:'start'});
    setTimeout(() => window.addMissingDrugToCatalog(visibleMissingDrugName()), 250);
  };

  const nativeSaveCatalog = window.saveCatalog;
  window.saveCatalog = function(){
    return requirePharmacienAction('enregistrer le catalogue pharmacie', () => nativeSaveCatalog?.apply(this, arguments));
  };

  window.importCatalogExcel = function(){
    if(!isPharmacienUser()){
      alert('Action reservee au compte pharmacien.');
      const input = arguments[0];
      if(input && input.value !== undefined) input.value = '';
      return;
    }
    const input = arguments[0];
    const file = input?.files?.[0];
    if(!file) return;
    localStorage.setItem(CATALOG_IMPORT_BACKUP_KEY, JSON.stringify({
      savedAt: new Date().toISOString(),
      catalog: readJson(STORAGE.catalog, Array.isArray(window.catalog) ? window.catalog : [])
    }));
    const reader = new FileReader();
    reader.onload = function(e){
      try{
        const wb = XLSX.read(new Uint8Array(e.target.result), {type:'array'});
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, {defval:''});
        if(!rows.length) return alert('Fichier catalogue vide ou incorrect.');
        const normalize = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
        const getCol = (row, ...keys) => {
          for(const k of Object.keys(row)){
            const nk = normalize(k);
            if(keys.some(key => nk.includes(normalize(key)))) return row[k];
          }
          return '';
        };
        const numberValue = value => Number(String(value || '0').replace(/[^0-9.,-]/g,'').replace(',', '.')) || 0;
        const current = readJson(STORAGE.catalog, Array.isArray(window.catalog) ? window.catalog : []);
        const hasExisting = rows.some(row => {
          const name = String(getCol(row, 'medicament','nom','name','drug') || '').trim();
          const dci = String(getCol(row, 'dci','molecule','generique') || '').trim();
          return name && (findCatalogItem(name, current) || (dci && findCatalogItem(dci, current)));
        });
        const cumulate = hasExisting ? confirm('Le fichier contient des medicaments deja presents.\n\nOK = cumuler les quantites avec les stocks existants.\nAnnuler = remplacer par les quantites du fichier.') : false;
        let updated = 0, added = 0;
        rows.forEach(row => {
          const name = String(getCol(row, 'medicament','nom','name','drug') || '').trim().toUpperCase();
          if(!name) return;
          const dci = String(getCol(row, 'dci','molecule','generique') || name).trim();
          const dosageRaw = String(getCol(row, 'dosage','presentation','flacon','mg') || '');
          const dosages = dosageRaw.split(/[,;\/\s]+/).map(Number).filter(n => n > 0);
          const forme = String(getCol(row, 'forme','type') || 'Injectable').trim();
          const cond = String(getCol(row, 'cond','conditionnement') || 'B1').trim();
          const statutRaw = String(getCol(row, 'statut','payant','gratuit','prise en charge') || 'Payant');
          const statutTarif = normalize(statutRaw).includes('grat') ? 'Gratuit' : 'Payant';
          const prixUnit = numberValue(getCol(row, 'prix','price','cout','tarif','fcfa'));
          const stockServiceRaw = getCol(row, 'stock service','service');
          const stockCentralRaw = getCol(row, 'stock pharmacie centrale','stock central','centrale');
          const stockFallback = getCol(row, 'stock','qte','quantite');
          const qteService = numberValue(stockServiceRaw || 0);
          const qteCentral = numberValue(stockCentralRaw || stockFallback || 0);
          const existing = findCatalogItem(name, current) || findCatalogItem(dci, current);
          const idx = current.findIndex(item => item === existing);
          if(idx >= 0){
            const oldService = Number(val(current[idx].qteService, current[idx].stockService, current[idx].qteStock, current[idx].stock, 0));
            const oldCentral = Number(val(current[idx].qteCentral, current[idx].stockCentral, 0));
            current[idx] = {
              ...current[idx],
              name: current[idx].name || name,
              dci: dci || current[idx].dci,
              dosages: dosages.length ? dosages : current[idx].dosages,
              forme,
              cond,
              statutTarif,
              prixUnit: prixUnit || current[idx].prixUnit || 0,
              qteService: cumulate ? oldService + qteService : qteService,
              qteCentral: cumulate ? oldCentral + qteCentral : qteCentral
            };
            current[idx].qteStock = current[idx].qteService;
            updated++;
          } else {
            current.push({name, dci, dosages, forme, cond, statutTarif, prixUnit, qteService, qteCentral, qteStock:qteService});
            added++;
          }
        });
        syncCatalogGlobal(current);
        window.renderCatalogTable?.();
        window.renderPharmacie?.();
        showToastSafe(`Import catalogue termine : ${updated} mis a jour, ${added} ajoutes.`, 'success');
      } catch(err){
        alert('Erreur import catalogue : ' + err.message);
      } finally {
        if(input) input.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  window.cancelLastCatalogImport = function(){
    return requirePharmacienAction('annuler le dernier import catalogue', () => {
      const backup = readJson(CATALOG_IMPORT_BACKUP_KEY, null);
      if(!backup || !Array.isArray(backup.catalog)){
        alert('Aucune sauvegarde avant import disponible.');
        return;
      }
      if(!confirm(`Revenir au catalogue avant le dernier import ?\nSauvegarde : ${new Date(backup.savedAt || Date.now()).toLocaleString('fr-FR')}`)) return;
      syncCatalogGlobal(cleanPharmacyCatalog(backup.catalog));
      localStorage.removeItem(CATALOG_IMPORT_BACKUP_KEY);
      window.renderCatalogTable?.();
      window.renderPharmacie?.();
      logAudit('Annulation import catalogue', 'Pharmacie centrale', `Retour sauvegarde ${backup.savedAt || ''}`);
      showToastSafe('Dernier import catalogue annule. Le catalogue precedent est restaure.', 'success');
    });
  };

  window.exportCatalogExcel = function(){
    const list = readJson(STORAGE.catalog, Array.isArray(window.catalog) ? window.catalog : []);
    const rows = list.map(d => ({
      'Medicament': d.name || '',
      'DCI': d.dci || '',
      'Dosage (mg)': (d.dosages || d.flacons || []).map(Number).filter(Boolean).join(', '),
      'Forme': d.forme || 'Injectable',
      'Conditionnement': d.cond || 'B1',
      'Statut': d.statutTarif || d.statut || 'Payant',
      'Prix/flacon (FCFA)': d.prixUnit || d.prix || 0,
      'Stock service (flacons)': Number(val(d.qteService, d.stockService, d.qteStock, d.stock, 0)),
      'Stock pharmacie centrale (flacons)': Number(val(d.qteCentral, d.stockCentral, 0))
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [28,22,14,16,18,14,18,22,28].map(w => ({wch:w}));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Catalogue');
    XLSX.writeFile(wb, 'Catalogue_Pharmacie_CHNCAK_Deux_Stocks.xlsx');
  };

  window.downloadCatalogTemplate = function(){
    const template = [
      {
        'Medicament': 'OXALIPLATINE',
        'DCI': 'Oxaliplatine',
        'Dosage (mg)': 50,
        'Forme': 'Injectable',
        'Conditionnement': 'B1',
        'Statut': 'Payant',
        'Prix/flacon (FCFA)': 45000,
        'Stock service (flacons)': 0,
        'Stock pharmacie centrale (flacons)': 50
      },
      {
        'Medicament': '[Votre medicament ici]',
        'DCI': '[DCI / generique]',
        'Dosage (mg)': 500,
        'Forme': 'Injectable',
        'Conditionnement': 'B1',
        'Statut': 'Payant ou Gratuit',
        'Prix/flacon (FCFA)': 0,
        'Stock service (flacons)': 0,
        'Stock pharmacie centrale (flacons)': 0
      }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    ws['!cols'] = [28,22,14,16,18,14,18,22,28].map(w => ({wch:w}));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modele_Catalogue');
    XLSX.writeFile(wb, 'Modele_Catalogue_Pharmacie_CHNCAK_Deux_Stocks.xlsx');
  };

  const nativeUpdateCatalogField = window.updateCatalogField;
  window.updateCatalogField = function(){
    const args = arguments;
    return requirePharmacienAction('modifier le stock pharmacie', () => {
      const out = nativeUpdateCatalogField?.apply(this, args);
      const idx = Number(args[0]);
      const field = args[1];
      const list = readJson(STORAGE.catalog, Array.isArray(window.catalog) ? window.catalog : []);
      if(list[idx]){
        if(field === 'qteService') list[idx].qteStock = Number(list[idx].qteService || 0);
        if(field === 'qteStock') list[idx].qteService = Number(list[idx].qteStock || 0);
        syncCatalogGlobal(list);
      }
      return out;
    });
  };

  const nativeRenderCatalogTable = window.renderCatalogTable;
  window.renderCatalogTable = function(){
    const out = nativeRenderCatalogTable?.apply(this, arguments);
    setTimeout(() => {
      expandCatalogDosageRows();
      lockPharmacyStockControls();
    }, 20);
    return out;
  };

  const nativeRenderPharmacie = window.renderPharmacie;
  window.renderPharmacie = function(){
    const out = nativeRenderPharmacie?.apply(this, arguments);
    setTimeout(lockPharmacyStockControls, 20);
    return out;
  };

  function lockPharmacyStockControls(){
    const page = document.getElementById('page-pharmacie');
    if(!page) return;
    const allowed = isPharmacienUser();
    page.querySelectorAll('#catalog-body input, #catalog-body select, #catalog-body button, button[onclick*="saveCatalog"], button[onclick*="cancelLastCatalogImport"], button[onclick*="scrollToCatalog"], button[onclick*="addMissingDrugToCatalog"], input[onchange*="importCatalogExcel"]').forEach(el => {
      el.disabled = !allowed;
      el.style.opacity = allowed ? '' : '0.48';
      el.style.cursor = allowed ? '' : 'not-allowed';
      el.title = allowed ? '' : 'Reserve au compte pharmacien';
    });
    page.querySelectorAll('button,label').forEach(el => {
      const text = norm(el.textContent || '');
      const onclick = el.getAttribute?.('onclick') || '';
      if(text.includes('enregistrer le catalogue') || text.includes('importer') || text.includes('annuler import') || onclick.includes('saveCatalog') || onclick.includes('cancelLastCatalogImport') || onclick.includes('scrollToCatalog') || onclick.includes('addMissingDrugToCatalog')){
        el.style.display = allowed ? '' : 'none';
      }
    });
  }

  function expandCatalogDosageRows(){
    const tbody = document.getElementById('catalog-body');
    if(!tbody) return;
    const table = document.getElementById('catalog-table');
    const head = table?.querySelector('thead tr');
    if(head){
      head.innerHTML = `
        <th style="padding:8px 10px;text-align:left;font-size:11px;color:#4A2A80;border-bottom:2px solid #D0C0F0">Medicament</th>
        <th style="padding:8px 10px;text-align:left;font-size:11px;color:#4A2A80;border-bottom:2px solid #D0C0F0">DCI</th>
        <th style="padding:8px 10px;text-align:left;font-size:11px;color:#4A2A80;border-bottom:2px solid #D0C0F0">Dosage</th>
        <th style="padding:8px 10px;text-align:left;font-size:11px;color:#4A2A80;border-bottom:2px solid #D0C0F0">Cond.</th>
        <th style="padding:8px 10px;text-align:left;font-size:11px;color:#4A2A80;border-bottom:2px solid #D0C0F0">Statut</th>
        <th style="padding:8px 10px;text-align:left;font-size:11px;color:#4A2A80;border-bottom:2px solid #D0C0F0">Prix</th>
        <th style="padding:8px 10px;text-align:left;font-size:11px;color:#4A2A80;border-bottom:2px solid #D0C0F0">Stock service</th>
        <th style="padding:8px 10px;text-align:left;font-size:11px;color:#4A2A80;border-bottom:2px solid #D0C0F0">Stock pharmacie centrale</th>
        <th style="padding:8px 10px;text-align:left;font-size:11px;color:#4A2A80;border-bottom:2px solid #D0C0F0">Transfert</th>`;
    }
    const list = readJson(STORAGE.catalog, Array.isArray(window.catalog) ? window.catalog : []);
    tbody.innerHTML = list.map((d, i) => {
      const stock = Number(val(d.qteService, d.stockService, d.qteStock, d.stock, 0));
      const central = Number(val(d.qteCentral, d.stockCentral, 0));
      const prix = d.prixUnit ?? d.prix ?? 0;
      const statutTarif = d.statutTarif || d.statut || 'Payant';
      const stockLow = Number(stock) <= 5;
      const stockCrit = Number(stock) <= 2;
      const dosages = (d.dosages || d.flacons || []).map(Number).filter(Boolean);
      const rows = dosages.length ? dosages : [''];
      return rows.map((dosage, j) => `
        <tr style="${(i+j)%2===0?'background:var(--gray-light)':'background:white'}">
          <td style="padding:7px 10px;font-size:12px;font-weight:600;color:var(--blue)">${esc(d.name)}${rows.length > 1 ? ` <span style="font-size:10px;color:var(--gray-mid)">forme ${j+1}</span>` : ''}</td>
          <td style="padding:7px 8px;font-size:11px;color:var(--gray-mid)">${esc(d.dci || '')}</td>
          <td style="padding:7px 8px;font-size:12px;font-weight:500">${dosage ? `${esc(dosage)} mg` : '-'}</td>
          <td style="padding:7px 8px;font-size:11px;color:var(--gray-mid)">${esc(d.cond || 'B1')}</td>
          <td style="padding:4px 6px">
            <select data-idx="${i}" data-field="statutTarif" style="width:95px;padding:5px 7px;font-size:12px;border:1px solid var(--gray-border);border-radius:4px;background:white" onchange="updateCatalogField(${i},'statutTarif',this.value)">
              <option value="Payant" ${statutTarif === 'Payant' ? 'selected' : ''}>Payant</option>
              <option value="Gratuit" ${statutTarif === 'Gratuit' ? 'selected' : ''}>Gratuit</option>
            </select>
          </td>
          <td style="padding:4px 6px">
            <input type="number" value="${esc(prix)}" data-idx="${i}" data-field="prixUnit" placeholder="FCFA" style="width:100px;padding:5px 7px;font-size:12px;border:1px solid var(--gray-border);border-radius:4px" oninput="updateCatalogField(${i},'prixUnit',this.value)">
          </td>
          <td style="padding:4px 6px">
            <input type="number" value="${esc(stock)}" data-idx="${i}" data-field="qteStock" placeholder="flacons" min="0" style="width:80px;padding:5px 7px;font-size:12px;border:1px solid ${stockCrit?'var(--red2)':stockLow?'var(--amber2)':'var(--gray-border)'};border-radius:4px;background:${stockCrit?'var(--red-pale)':stockLow?'var(--amber-pale)':'white'}" oninput="updateCatalogField(${i},'qteStock',this.value)">
            ${stockCrit?'<span style="font-size:10px;color:var(--red2);margin-left:4px;display:block">ALERTE Critique</span>':stockLow?'<span style="font-size:10px;color:var(--amber2);margin-left:4px;display:block">Bas</span>':''}
          </td>
          <td style="padding:4px 6px">
            <input type="number" value="${esc(central)}" data-idx="${i}" data-field="qteCentral" placeholder="flacons" min="0" style="width:90px;padding:5px 7px;font-size:12px;border:1px solid var(--gray-border);border-radius:4px" oninput="updateCatalogField(${i},'qteCentral',this.value)">
          </td>
          <td style="padding:4px 6px">
            ${j === 0 ? `<button class="btn-sm" onclick="transferCentralToService(${i})">Approvisionner service</button>` : ''}
          </td>
        </tr>
      `).join('');
    }).join('');
  }

  window.transferCentralToService = function(index){
    return requirePharmacienAction('approvisionner le stock service', () => {
      const list = readJson(STORAGE.catalog, Array.isArray(window.catalog) ? window.catalog : []);
      const item = list[index];
      if(!item) return alert('Medicament introuvable.');
      const central = Number(val(item.qteCentral, item.stockCentral, 0));
      const service = Number(val(item.qteService, item.stockService, item.qteStock, item.stock, 0));
      const qty = Number(prompt(`Quantite a transferer vers le stock service pour ${item.name}\nDisponible pharmacie centrale: ${central} flacon(s)`, '1') || 0);
      if(!qty || qty <= 0) return;
      if(qty > central) return alert(`Stock pharmacie centrale insuffisant. Disponible: ${central} flacon(s).`);
      item.qteCentral = central - qty;
      item.qteService = service + qty;
      item.qteStock = item.qteService;
      syncCatalogGlobal(list);
      const moves = readJson('chncak_stock_mouvements', []);
      moves.unshift({id:`MOV-${Date.now()}`, dateTs:new Date().toISOString(), date:new Date().toLocaleString('fr-FR'), type:'transfert_central_service', medicament:item.name, quantite:qty, centralAvant:central, centralApres:item.qteCentral, serviceAvant:service, serviceApres:item.qteService, actor:actorLabel()});
      writeJson('chncak_stock_mouvements', moves.slice(0, 1000));
      logAudit('Transfert stock', item.name, `${qty} flacon(s) pharmacie centrale -> stock service`);
      window.renderCatalogTable?.();
      window.renderPharmacie?.();
      showToastSafe('Stock service approvisionne.', 'success');
    });
  };

  window.clearDay = function(){
    askAdminCode('effacer le jour du programme', () => {
      const semaine = document.getElementById('prog-semaine')?.value;
      if(!semaine) return;
      const data = readJson('chncak_programme', {});
      const active = document.querySelector('#page-programme .prog-day-btn.active');
      const day = Number((active?.id || 'day-btn-0').replace('day-btn-', '')) || 0;
      if(data[semaine]) data[semaine][day] = [];
      writeJson('chncak_programme', data);
      window.renderProgramme?.();
    });
  };

  window.handleDashboardTeamPhoto = function(input){
    const file = input.files?.[0];
    if(!file) return;
    requireAdminAction('changer la photo de l equipe', () => {
      const reader = new FileReader();
      reader.onload = event => {
        localStorage.setItem('chncak_dashboard_team_photo', event.target.result);
        localStorage.setItem('dashboardTeamPhoto', event.target.result);
        localStorage.setItem('teamPhoto', event.target.result);
        const img = document.querySelector('.dashboard-team-panel img');
        if(img) img.src = event.target.result;
        window.renderDashboard?.();
        setTimeout(() => window.renderDashboard?.(), 80);
      };
      reader.readAsDataURL(file);
      input.value = '';
    });
  };

  window.chooseDashboardPhoto = function(slot){
    requireAdminAction('changer une photo du dashboard', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      document.body.appendChild(input);
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if(!file){ input.remove(); return; }
        const reader = new FileReader();
        reader.onload = event => {
          if(slot === 'team'){
            localStorage.setItem('chncak_dashboard_team_photo', event.target.result);
            localStorage.setItem('dashboardTeamPhoto', event.target.result);
            localStorage.setItem('teamPhoto', event.target.result);
          } else {
            localStorage.setItem(`chncak_dashboard_photo_${slot}`, event.target.result);
          }
          input.remove();
          window.renderDashboard?.();
        };
        reader.readAsDataURL(file);
      });
      input.click();
    });
  };

  function makeWorkbook(rows, sheet, filename){
    if(typeof XLSX === 'undefined') return alert('Bibliotheque Excel non chargee. Rechargez la page avec internet ou utilisez le CSV.');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, sheet);
    XLSX.writeFile(wb, filename);
  }

  function suiviRowsForExport(){
    return readJson(STORAGE.patients, []).map(p => ({
      'Prenom': val(p.prenom),
      'Nom': val(p.nom),
      'Age': val(p.age),
      'Sexe': val(p.sexe),
      'Antecedents': val(p.antecedents, p.antecedent, p.atcd),
      'Localisation': val(p.localisations, p.localisation, p.diagnostic),
      'Indication': val(p.indication),
      'Code': val(p.codeGratuite, p.codegratuite, p.code),
      'Code barre': val(p.codeBarre, p.codeGratuite, p.codegratuite),
      'N dossier': val(p.numeroDossier, p.dossier),
      'ID Cubix': val(p.cubix, p.idCubix, p.icCubix),
      'Nationalite': val(p.nationalite),
      'Contact': val(p.tel, p.contact, p.telephone),
      'Protocole': protocolNameFor(p),
      'Ligne': val(p.ligne, p.ligneTraitement, p.line),
      'Cure': val(p.cure, p.cycle, p.numeroCure, p.numCure),
      'Total': val(p.totalCures, p.totalCycles),
      'Medecin': val(p.medecin),
      'Statut': val(p.statut, 'actif')
    }));
  }

  window.downloadSuiviTemplate = function(){
    makeWorkbook([
      {
        'Prenom':'Fatou',
        'Nom':'Diallo',
        'Age':45,
        'Sexe':'F',
        'Antecedents':'HTA',
        'Localisation':'Cancer du sein',
        'Indication':'Adjuvant',
        'Code':'155F26',
        'Code barre':'155F26',
        'N dossier':'539/24',
        'ID Cubix':'122456',
        'Nationalite':'Senegalaise',
        'Contact':'77 123 45 67',
        'Protocole':'AC 60',
        'Ligne':'Ligne I',
        'Cure':1,
        'Total':6,
        'Medecin':'Dr Exemple',
        'Statut':'actif'
      }
    ], 'Tableau suivi', 'Modele_Tableau_Suivi_CHNCAK.xlsx');
  };

  window.exportSuiviExcel = function(){
    const rows = suiviRowsForExport();
    if(!rows.length) return alert('Aucun patient a exporter dans le tableau de suivi.');
    makeWorkbook(rows, 'Tableau suivi', `Tableau_Suivi_Patients_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  window.importSuiviExcel = function(input){
    const file = input.files?.[0];
    if(!file) return;
    if(typeof XLSX === 'undefined'){ alert('Bibliotheque Excel non chargee.'); input.value=''; return; }
    const reader = new FileReader();
    reader.onload = event => {
      try{
        const wb = XLSX.read(event.target.result, {type:'array', cellDates:true});
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, {defval:'', raw:false});
        const list = readJson(STORAGE.patients, []);
        rows.forEach(row => {
          const get = (...keys) => {
            const found = Object.keys(row).find(k => keys.some(key => norm(k).includes(norm(key))));
            return found ? row[found] : '';
          };
          const prenom = val(get('prenom', 'prénom'));
          const nom = val(get('nom'));
          if(!prenom && !nom) return;
          const code = val(get('code'), get('code gratuite'));
          const dossier = val(get('n dossier', 'dossier'));
          const protoName = val(get('protocole'));
          const proto = protocolsList().find(p => norm(p.name) === norm(protoName) || norm(p.id) === norm(protoName));
          const entry = {
            id: val(code, dossier, Date.now() + '_' + Math.random().toString(16).slice(2)),
            prenom, nom,
            age: val(get('age')),
            sexe: val(get('sexe')),
            antecedents: val(get('antecedents', 'antécédents')),
            localisation: val(get('localisation'), get('diagnostic')),
            indication: val(get('indication')),
            codegratuite: code,
            codeBarre: val(get('code barre'), code),
            dossier,
            cubix: val(get('cubix')),
            nationalite: val(get('nationalite', 'nationalité')),
            tel: val(get('contact'), get('telephone')),
            protoId: proto?.id || '',
            proto: proto?.name || protoName,
            ligne: val(get('ligne')),
            cure: Number(get('cure')) || '',
            totalCures: Number(get('total')) || '',
            medecin: val(get('medecin', 'médecin')),
            statut: val(get('statut'), 'actif'),
            updatedAt: new Date().toISOString()
          };
          const idx = list.findIndex(p => (code && val(p.codegratuite, p.code) === code) || (dossier && p.dossier === dossier) || (norm(p.prenom) === norm(prenom) && norm(p.nom) === norm(nom)));
          if(idx >= 0) list[idx] = {...list[idx], ...entry, id:list[idx].id || entry.id};
          else list.push(entry);
        });
        writeJson(STORAGE.patients, list);
        window.renderSuivi?.();
        cleanupLoginAndButtons();
        alert(`${rows.length} ligne(s) importee(s) dans le tableau de suivi.`);
      } catch(e){
        alert('Erreur import suivi: ' + e.message);
      }
      input.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  window.downloadProgrammeTemplate = function(){
    makeWorkbook([
      {'N':'1','Prenom':'FATOU','Nom':'DIALLO','Contact':'77 123 45 67','Chimiotherapie':'FOLFOX','Observation':''},
      {'N':'2','Prenom':'MAMADOU','Nom':'SOW','Contact':'76 987 65 43','Chimiotherapie':'XELOX','Observation':'Bilan a verifier'}
    ], 'Programme', 'Modele_Programme_ChimioPro.xlsx');
  };

  function orderRowsFinal(kind){
    const months = {mensuelle:1, trimestrielle:3, semestrielle:6, annuelle:12};
    const start = new Date();
    start.setMonth(start.getMonth() - (months[kind] || 1));
    const used = {};
    readJson(STORAGE.sorties, []).forEach(s => {
      const d = new Date(s.dateTs || s.date || 0);
      if(d < start) return;
      if(Array.isArray(s.detailsData)){
        s.detailsData.forEach(x => used[x.name] = (used[x.name] || 0) + Number(x.nbFlacons || 0));
      } else {
        String(s.details || '').split(',').forEach(part => {
          const m = part.match(/([^:]+):\s*(\d+)/);
          if(m) used[m[1].trim()] = (used[m[1].trim()] || 0) + Number(m[2]);
        });
      }
    });
    const catalog = readJson(STORAGE.catalog, []);
    return Object.entries(used).map(([name, qty]) => {
      const item = catalog.find(x => norm(x.name) === norm(name)) || {};
      return {
        'Médicament': name,
        'DCI': item.dci || '',
        'Dosages (mg)': (item.dosages || item.flacons || []).join(', '),
        'Forme': item.forme || 'Injectable',
        'Conditionnement': item.cond || 'B1',
        'Prix/flacon (FCFA)': item.prixUnit || item.prix || 0,
        'Stock (flacons)': item.qteStock ?? item.stock ?? 0,
        'Utilisé période (flacons)': qty,
        'Commande +5% (flacons)': Math.ceil(qty * 1.05)
      };
    });
  }

  window.passerCommandePharmacie = function(){
    const period = prompt('Periode de commande: mensuelle, trimestrielle, semestrielle ou annuelle ?', 'mensuelle');
    if(!period) return;
    const kind = period.toLowerCase().startsWith('trim') ? 'trimestrielle' : period.toLowerCase().startsWith('sem') ? 'semestrielle' : period.toLowerCase().startsWith('ann') ? 'annuelle' : 'mensuelle';
    const format = prompt('Format de sortie: excel, pdf ou word ?', 'excel');
    if(!format) return;
    const rows = orderRowsFinal(kind);
    if(!rows.length) return alert('Aucune consommation trouvee pour cette periode.');
    if(format.toLowerCase().startsWith('e') && typeof XLSX !== 'undefined'){
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [28,22,18,14,18,18,16,20,20].map(w => ({wch:w}));
      XLSX.utils.book_append_sheet(wb, ws, 'Commande');
      XLSX.writeFile(wb, `Commande_${kind}_${new Date().toISOString().slice(0,10)}.xlsx`);
      return;
    }
    const table = `<h2>Commande pharmacie ${kind}</h2><table border="1" cellspacing="0" cellpadding="6"><tr>${Object.keys(rows[0]).map(k => `<th>${esc(k)}</th>`).join('')}</tr>${rows.map(r => `<tr>${Object.values(r).map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</table>`;
    if(format.toLowerCase().startsWith('w')){
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([`<html><head><meta charset="utf-8"></head><body>${table}</body></html>`], {type:'application/msword'}));
      a.download = `Commande_${kind}.doc`;
      a.click();
      return;
    }
    printHtml(`<!doctype html><html><head><meta charset="utf-8"><title>Commande</title></head><body>${table}</body></html>`);
  };

  const nativeDownloadPatientsTemplate = window.downloadPatientsTemplate;
  window.downloadPatientsTemplate = function(){
    if(typeof nativeDownloadPatientsTemplate === 'function') return nativeDownloadPatientsTemplate();
    makeWorkbook([{'N° Dossier':'539/24','Prénom':'Fatou','Nom':'Diallo','Age':45,'Sexe':'F','Contact':'77 123 45 67','Protocole':'FOLFOX','Localisation':'Cancer colorectal','Cure en cours':1,'Total cures':6,'Médecin':'Dr Mane','Date RDV':'18/05/2026'}], 'Patients', 'Modele_Patients_CHNCAK.xlsx');
  };

  window.importProgramme = function(input){
    const file = input.files?.[0];
    if(!file) return;
    if(typeof XLSX === 'undefined') { alert('Bibliotheque Excel non chargee. Utilisez le modele apres rechargement.'); input.value=''; return; }
    const reader = new FileReader();
    reader.onload = event => {
      try{
        const wb = XLSX.read(event.target.result, {type:'array', cellDates:true});
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, {defval:'', raw:false});
        const programme = readJson('chncak_programme', {});
        let imported = 0;
        rows.forEach(row => {
          const dateRaw = val(row.DATE, row.Date, row.date);
          const d = parseFrDate(dateRaw);
          if(!d) return;
          const day = d.getDay();
          if(day < 1 || day > 5) return;
          const monday = new Date(d); monday.setDate(d.getDate() - day + 1);
          const week = monday.toISOString().slice(0,10);
          programme[week] = programme[week] || {};
          const idx = day - 1;
          programme[week][idx] = programme[week][idx] || [];
          programme[week][idx].push({prenom:val(row.PRENOM,row.Prenom,row.Prénom), nom:val(row.NOM,row.Nom), contact:val(row.CONTACT,row.Contact), chimio:val(row.CHIMIOTHERAPIE,row.Chimiotherapie,row.Protocole), obs:val(row.OBSERVATIONS,row.Observations), done:false});
          imported++;
        });
        writeJson('chncak_programme', programme);
        if(imported) alert(`${imported} ligne(s) importee(s) dans le programme.`);
        else alert('Aucune ligne importee. Utilisez le modele Programme.');
        window.location.reload();
      } catch(e){ alert('Erreur import programme: ' + e.message); }
    };
    reader.readAsArrayBuffer(file);
    input.value = '';
  };

  function parseFrDate(value){
    if(!value) return null;
    if(value instanceof Date) return value;
    const s = String(value).trim();
    let m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
    if(m) return new Date(Number(m[3]), Number(m[2])-1, Number(m[1]));
    m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if(m) return new Date(Number(m[1]), Number(m[2])-1, Number(m[3]));
    return null;
  }

  function programmeList(){
    try { return typeof programmeData !== 'undefined' ? programmeData : readJson('chncak_programme', {}); }
    catch(e){ return readJson('chncak_programme', {}); }
  }

  window.renderProgramme = function(){
    try { if(typeof initProgramme === 'function') initProgramme(); } catch(e){}
    const tbody = document.getElementById('prog-tbody');
    const title = document.getElementById('prog-day-title');
    const count = document.getElementById('prog-count');
    if(!tbody) return;
    const week = document.getElementById('prog-semaine')?.value || getCurrentMondayIso();
    if(document.getElementById('prog-semaine') && !document.getElementById('prog-semaine').value) document.getElementById('prog-semaine').value = week;
    const data = programmeList();
    const days = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi'];
    const dayIdx = typeof currentDay !== 'undefined' ? currentDay : 0;
    const rows = (data[week]?.[dayIdx] || []);
    if(title) title.textContent = days[dayIdx] || 'Jour';
    if(count) count.textContent = `${rows.filter(p => p.prenom || p.nom || p.chimio).length} patient(s)`;
    tbody.innerHTML = rows.map((p, i) => `
      <tr data-idx="${i}" class="${p.done ? 'prog-row-done' : ''}">
        <td style="padding:6px 8px;text-align:center;border-bottom:1px solid #e2e8f0;font-weight:700">${i + 1}</td>
        <td style="padding:4px;border-bottom:1px solid #e2e8f0"><input class="prog-input" oninput="autoSave()" value="${esc(p.prenom || '')}" placeholder="Prenom"></td>
        <td style="padding:4px;border-bottom:1px solid #e2e8f0"><input class="prog-input" oninput="autoSave()" value="${esc(p.nom || '')}" placeholder="Nom"></td>
        <td style="padding:4px;border-bottom:1px solid #e2e8f0"><input class="prog-input" oninput="autoSave()" value="${esc(p.contact || '')}" placeholder="Contact"></td>
        <td style="padding:4px;border-bottom:1px solid #e2e8f0"><input class="prog-input" oninput="autoSave()" value="${esc(p.chimio || '')}" placeholder="Chimiotherapie"></td>
        <td style="padding:4px;border-bottom:1px solid #e2e8f0"><input class="prog-input" oninput="autoSave()" value="${esc(p.obs || p.observation || '')}" placeholder="Observation"></td>
        <td style="padding:4px;text-align:center;border-bottom:1px solid #e2e8f0"><input type="checkbox" ${p.done ? 'checked' : ''} onchange="toggleDone(${i},this)" title="Fait"></td>
        <td style="padding:4px;text-align:center;border-bottom:1px solid #e2e8f0"><button class="prog-delete-btn" onclick="deleteRow(${i})" title="Supprimer">x</button></td>
      </tr>
    `).join('') || '<tr><td colspan="8" class="dash-empty">Aucune ligne. Utilisez Ajouter patient ou Importer fichier.</td></tr>';
    try { renderWeekOverview(week, getWeekDates(week)); } catch(e){}
  };

  function cleanMedecinsFinal(){
    const existing = readJson('chncak_medecins', []);
    const cleaned = [];
    existing.forEach(m => {
      const nom = val(m.nom);
      const prenom = val(m.prenom);
      if(!nom && !prenom) return;
      const key = norm(`${prenom} ${nom}`);
      if(cleaned.some(x => norm(`${x.prenom} ${x.nom}`) === key)) return;
      cleaned.push(m);
    });
    if(cleaned.length !== existing.length) writeJson('chncak_medecins', cleaned);
    try { medecins = cleaned; } catch(e){}
    return cleaned;
  }

  window.populateMedecinSelect = function(){
    const sel = document.getElementById('medecin-select');
    if(!sel) return;
    const current = sel.value || localStorage.getItem('chncak_last_medecin') || '';
    const list = cleanMedecinsFinal();
    sel.innerHTML = '<option value="">— Choisir un médecin —</option>' + list.map(m => {
      const fullName = `Dr ${val(m.prenom)} ${val(m.nom)}`.replace(/\s+/g, ' ').trim();
      const display = `${fullName}${val(m.specialite) ? ' (' + esc(m.specialite) + ')' : ''}`;
      return `<option value="${esc(fullName)}"${current === fullName ? ' selected' : ''}>${display}</option>`;
    }).join('');
  };

  window.renderMedecins = function(){
    const list = cleanMedecinsFinal();
    window.populateMedecinSelect?.();
    const host = document.getElementById('med-list');
    if(!host) return;
    host.innerHTML = list.length ? list.map((m, i) => {
      const initials = `${val(m.prenom)[0] || ''}${val(m.nom)[0] || ''}`.toUpperCase();
      return `<div class="med-item">
        <div class="med-info">
          <div class="med-avatar">${esc(initials || 'Dr')}</div>
          <div>
            <div class="med-name">Dr ${esc(val(m.prenom))} ${esc(val(m.nom))}</div>
            <div class="med-grade">${esc(val(m.specialite, m.grade, '—'))}</div>
            <div style="font-size:11px;color:#666;margin-top:4px">${esc(val(m.email))}${m.email && m.contact ? ' · ' : ''}${esc(val(m.contact))}</div>
          </div>
        </div>
        <div class="med-actions"><button class="btn-sm" onclick="editMedecinFinal(${i})">Modifier</button><button class="btn-sm danger" onclick="deleteMed(${i})">Supprimer</button></div>
      </div>`;
    }).join('') : '<p style="text-align:center;padding:20px;color:var(--gray-mid);font-size:13px">Aucun médecin enregistré</p>';
  };
  window.editMedecinFinal = function(index){
    requireAdminAction('modifier un medecin', () => {
      const list = cleanMedecinsFinal();
      const med = list[index];
      if(!med) return alert('Medecin introuvable.');
      const prenom = prompt('Prenom :', val(med.prenom)); if(prenom === null) return;
      const nom = prompt('Nom :', val(med.nom)); if(nom === null) return;
      const specialite = prompt('Specialite / grade :', val(med.specialite, med.grade)); if(specialite === null) return;
      const contact = prompt('Contact :', val(med.contact)); if(contact === null) return;
      const email = prompt('Email :', val(med.email)); if(email === null) return;
      list[index] = {...med, prenom:prenom.trim(), nom:nom.trim(), specialite:specialite.trim(), contact:contact.trim(), email:email.trim(), updatedAt:new Date().toISOString()};
      writeJson('chncak_medecins', list);
      window.renderMedecins?.();
      showToastSafe('Medecin modifie.', 'success');
    });
  };
  window.deleteMed = function(index){
    requireAdminAction('supprimer un medecin', () => {
      const list = cleanMedecinsFinal();
      if(!list[index]) return;
      list.splice(index, 1);
      writeJson('chncak_medecins', list);
      window.renderMedecins?.();
      window.populateMedecinSelect?.();
    });
  };
  const nativeAddMedecinFromForm = window.addMedecinFromForm;
  window.addMedecinFromForm = function(){
    requireAdminAction('ajouter un medecin', () => {
      if(typeof nativeAddMedecinFromForm === 'function') nativeAddMedecinFromForm.apply(this, arguments);
      else alert('Formulaire medecin indisponible.');
    });
  };
  try { renderProgramme = window.renderProgramme; } catch(e){}
  try { renderMedecins = window.renderMedecins; } catch(e){}
  try { populateMedecinSelect = window.populateMedecinSelect; } catch(e){}
  try { deleteMed = window.deleteMed; } catch(e){}

  function getCurrentMondayIso(){
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    today.setDate(today.getDate() + diff);
    return today.toISOString().slice(0,10);
  }

  window.importProgramme = function(input){
    const file = input.files?.[0];
    if(!file) return;
    if(typeof XLSX === 'undefined'){ alert('Bibliotheque Excel non chargee. Utilisez le modele apres rechargement.'); input.value=''; return; }
    const reader = new FileReader();
    reader.onload = event => {
      try{
        const wb = XLSX.read(event.target.result, {type:'array', cellDates:true});
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, {defval:'', raw:false});
        const programme = readJson('chncak_programme', {});
        const activeWeek = document.getElementById('prog-semaine')?.value || getCurrentMondayIso();
        const activeDay = typeof currentDay !== 'undefined' ? currentDay : 0;
        let imported = 0;
        rows.forEach(row => {
          const get = (...keys) => {
            const found = Object.keys(row).find(k => keys.some(key => norm(k) === norm(key) || norm(k).includes(norm(key))));
            return found ? row[found] : '';
          };
          const d = parseFrDate(val(get('date')));
          let week = activeWeek;
          let idx = activeDay;
          if(d){
            const day = d.getDay();
            if(day < 1 || day > 5) return;
            const monday = new Date(d);
            monday.setDate(d.getDate() - day + 1);
            week = monday.toISOString().slice(0,10);
            idx = day - 1;
          }
          const prenom = val(get('prenom', 'prénom'));
          const nom = val(get('nom'));
          const chimio = val(get('chimiotherapie', 'chimiothérapie', 'chimio', 'protocole'));
          if(!prenom && !nom && !chimio) return;
          programme[week] = programme[week] || {};
          programme[week][idx] = programme[week][idx] || [];
          programme[week][idx].push({
            prenom, nom,
            contact: val(get('contact')),
            chimio,
            obs: val(get('observation', 'observations')),
            done:false
          });
          imported++;
        });
        writeJson('chncak_programme', programme);
        try { programmeData = programme; } catch(e) {}
        if(document.getElementById('prog-semaine') && !document.getElementById('prog-semaine').value) document.getElementById('prog-semaine').value = activeWeek;
        window.renderProgramme?.();
        alert(imported ? `${imported} ligne(s) importee(s) dans le programme.` : 'Aucune ligne importee. Colonnes attendues : N, Prenom, Nom, Contact, Chimiotherapie, Observation.');
      } catch(e){ alert('Erreur import programme: ' + e.message); }
      input.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  function doseLabelForDrug(drug){
    if(!drug || drug.t) return '-';
    if(drug.mgm2) return `${drug.mgm2} mg/m2`;
    if(drug.mgkg) return `${drug.mgkg} mg/kg`;
    if(drug.avastin) return '15 mg/kg';
    if(drug.carbo) return 'AUC carboplatine';
    if(typeof drug.fix === 'number') return `${drug.fix} ${drug.unit || 'mg'}`;
    if(drug.oral) return val(drug.pos, drug.dose, 'per os');
    return '-';
  }

  function protocolDrugRows(proto){
    return (proto.drugs || []).filter(d => !d.t).map(drug => `
      <tr>
        <td>${esc(drug.name || drug.label || '-')}</td>
        <td>${esc(doseLabelForDrug(drug))}</td>
        <td>${esc(val(drug.ryt, drug.jours, '-'))}</td>
        <td>${esc(val(drug.sol, drug.solvant, '-'))}</td>
        <td>${esc(val(drug.dur, drug.duree, '-'))}</td>
      </tr>
    `).join('');
  }

  function upsertCustomProtocol(proto){
    const list = readJson('chncak_custom_protocols', []);
    const normalized = normalizeProtocol(proto);
    const idx = list.findIndex(p => p.id === normalized.id || norm(p.name) === norm(normalized.name));
    if(idx >= 0) list[idx] = {...list[idx], ...normalized};
    else list.push(normalized);
    writeJson('chncak_custom_protocols', list);
    const protoList = protocolsList();
    const baseIdx = protoList.findIndex(p => p.id === normalized.id || norm(p.name) === norm(normalized.name));
    if(baseIdx >= 0) protoList[baseIdx] = {...protoList[baseIdx], ...normalized};
    else protoList.push(normalized);
    return normalized;
  }

  const WEB_ONCOLOGY_DRUG_NAMES = [
    'ABIRATERONE', 'AFATINIB', 'ATEZOLIZUMAB', 'AVELUMAB', 'BENDAMUSTINE', 'BEVACIZUMAB',
    'BLEOMYCINE', 'BORTEZOMIB', 'CAPECITABINE', 'CARBOPLATINE', 'CETUXIMAB', 'CISPLATINE',
    'CYCLOPHOSPHAMIDE', 'CYTARABINE', 'DACARBAZINE', 'DOCETAXEL', 'DOXORUBICINE',
    'EPIRUBICINE', 'ERLOTINIB', 'ETOPOSIDE', 'FILGRASTIM', 'FLUOROURACILE', 'GEMCITABINE',
    'GEFITINIB', 'HYDROXYCARBAMIDE', 'IFOSFAMIDE', 'IMATINIB', 'IRINOTECAN', 'LEUCOVORINE',
    'MELPHALAN', 'METHOTREXATE', 'NIVOLUMAB', 'OXALIPLATINE', 'PACLITAXEL', 'PEMBROLIZUMAB',
    'PEMETREXED', 'PERTUZUMAB', 'RITUXIMAB', 'TAMOXIFENE', 'TEMOZOLOMIDE', 'TRASTUZUMAB',
    'VINBLASTINE', 'VINCRISTINE', 'NAVELBINE', 'ZOMETA'
  ];

  function protocolDrugNameOptions(){
    const names = new Map();
    const excluded = /^(nacl|na cl|sg|g5|ssi|eau ppi|sans solvant|serum|glucose|hydrocortisone|granisetron|kytril|ondansetron|calcium|magnesium|ringer|rinçage|rincage)/i;
    const add = name => {
      const clean = String(name || '').trim();
      const key = norm(clean).replace(/[^a-z0-9]/g, '');
      if(clean && !excluded.test(norm(clean)) && !names.has(key)) names.set(key, canonicalDrugName(clean).toUpperCase());
    };
    readJson(STORAGE.catalog, Array.isArray(window.DEFAULT_CATALOG) ? window.DEFAULT_CATALOG : []).forEach(item => {
      add(item.name);
      add(item.dci);
    });
    protocolsList().forEach(proto => (proto.drugs || []).forEach(drug => add(drug.name || drug.label)));
    WEB_ONCOLOGY_DRUG_NAMES.forEach(add);
    return Array.from(names.values()).sort((a, b) => a.localeCompare(b, 'fr', {sensitivity:'base'}));
  }

  function refreshProtocolDrugDatalist(){
    let datalist = document.getElementById('protocol-drug-options');
    if(!datalist){
      datalist = document.createElement('datalist');
      datalist.id = 'protocol-drug-options';
      document.body.appendChild(datalist);
    }
    datalist.innerHTML = protocolDrugNameOptions().map(name => `<option value="${esc(name)}"></option>`).join('');
  }

  function ensureProtocolDrugInCatalog(name){
    const clean = canonicalDrugName(name);
    if(!clean || /^(nacl|na cl|sg|g5|eau ppi|sans solvant)/i.test(norm(clean))) return;
    const list = readJson(STORAGE.catalog, Array.isArray(window.DEFAULT_CATALOG) ? window.DEFAULT_CATALOG : []);
    if(list.some(item => norm(item.name) === norm(clean) || norm(item.dci) === norm(clean))) return;
    list.push({name:clean.toUpperCase(), dci:clean, dosages:[], forme:'A completer', cond:'', qteStock:0, prixUnit:0});
    writeJson(STORAGE.catalog, list);
    try { if(Array.isArray(window.catalog)) window.catalog = list; } catch(e) {}
    try { if(typeof catalog !== 'undefined') catalog = list; } catch(e) {}
  }

  function collectProtocolDrugRows(){
    const rows = Array.from(document.querySelectorAll('#proto-drugs-list .proto-drug-line'));
    const drugs = rows.map(row => {
      const order = Number(row.querySelector('[data-field="order"]')?.value || 0);
      const name = row.querySelector('[data-field="name"]')?.value.trim();
      const calc = row.querySelector('[data-field="calc"]')?.value;
      const coef = Number(row.querySelector('[data-field="coef"]')?.value || 0);
      const jours = row.querySelector('[data-field="jours"]')?.value.trim();
      const solvant = row.querySelector('[data-field="sol"]')?.value.trim();
      const solVol = row.querySelector('[data-field="solvol"]')?.value.trim();
      const dur = row.querySelector('[data-field="dur"]')?.value.trim();
      const freq = row.querySelector('[data-field="freq"]')?.value.trim();
      const remark = row.querySelector('[data-field="remark"]')?.value.trim();
      const doseLimit = row.querySelector('[data-field="limit"]')?.value.trim();
      const light = row.querySelector('[data-field="light"]')?.checked;
      const sol = [solVol ? `${solVol} cc` : '', solvant].filter(Boolean).join(' ');
      const durLabel = dur && /^\d+([.,]\d+)?$/.test(dur) ? `${dur} mn` : dur;
      const supportLabel = [name, sol].filter(Boolean).join(' ');
      if(calc === 'support' || /^(nacl|na cl|ssi|sg|g5|glucose|ringer|eau ppi|rinçage|rincage|rehydratation|réhydratation)/i.test(norm(name))){
        return {t:'r', label:supportLabel || 'Rinçage / réhydratation', dur:durLabel || '30 mn', order};
      }
      const notes = [];
      if(freq) notes.push(`Frequence: ${freq}`);
      if(remark) notes.push(remark);
      if(order) notes.push(`Ordre de passage: ${order}`);
      if(doseLimit) notes.push(`Alerte dose limite: ${doseLimit} mg`);
      if(light) notes.push('Proteger contre la lumiere');
      if(/cisplat|carbo|oxali/i.test(norm(name))) notes.push('Surveillance ions: Na+, K+, Mg2+, Ca2+');
      const out = {name, ryt: jours, sol, dur: durLabel, freq:notes.join(' - '), note:notes.join(' - '), order, hl:true};
      if(calc === 'mgm2') out.mgm2 = coef;
      else if(calc === 'mgkg') out.mgkg = coef;
      else if(calc === 'fix') out.fix = coef;
      else if(calc === 'auc') out.carbo = true;
      else if(calc === 'oral'){ out.oral = true; out.pos = `${coef || ''} mg`.trim(); delete out.hl; }
      return out;
    }).filter(d => d.name || d.label).sort((a,b) => Number(a.order || 0) - Number(b.order || 0));
    const withRinsing = [];
    drugs.forEach((drug, index) => {
      if(index > 0 && drug.hl && drugs[index - 1]?.hl) withRinsing.push({t:'r', label:'Rincage 250 cc SSI 0.9% - faire passer en 30 mn', dur:'30 mn'});
      withRinsing.push(drug);
    });
    return withRinsing;
  }

  window.addProtocolDrugRow = function(data){
    const root = document.getElementById('proto-drugs-list');
    if(!root) return;
    refreshProtocolDrugDatalist();
    const d = data || {};
    const calc = d.calc || (d.mgm2 ? 'mgm2' : d.mgkg ? 'mgkg' : d.carbo ? 'auc' : d.oral ? 'oral' : 'fix');
    const coef = d.mgm2 || d.mgkg || d.fix || Number(String(d.pos || '').match(/\d+([.,]\d+)?/)?.[0]?.replace(',', '.') || 0) || '';
    const solText = String(d.sol || d.solvant || '');
    const solVol = solText.match(/(\d+(?:[.,]\d+)?)\s*(?:cc|ml)/i)?.[1] || '';
    const selectedSol = norm(solText).includes('g5') || norm(solText).includes('sg') ? 'SG 5%' : norm(solText).includes('nacl') || norm(solText).includes('ssi') ? 'NaCl 0.9%' : '';
    const durValue = String(d.dur || d.duree || '').match(/^\s*(\d+(?:[.,]\d+)?)\s*(?:mn|min|minutes?)?\s*$/i)?.[1] || String(d.dur || d.duree || '');
    root.insertAdjacentHTML('beforeend', `
      <div class="proto-drug-line">
        <div class="unit-input"><input data-field="order" type="number" step="1" min="1" placeholder="Ordre" value="${esc(d.order || '')}"><span>ordre</span></div>
        <input data-field="name" list="protocol-drug-options" placeholder="Medicament" value="${esc(d.name || '')}" title="Choisir dans la liste ou taper un nouveau medicament">
        <select data-field="calc">
          <option value="mgm2" ${calc === 'mgm2' ? 'selected' : ''}>mg/m2</option>
          <option value="mgkg" ${calc === 'mgkg' ? 'selected' : ''}>mg/kg</option>
          <option value="fix" ${calc === 'fix' ? 'selected' : ''}>dose fixe mg</option>
          <option value="auc" ${calc === 'auc' ? 'selected' : ''}>AUC</option>
          <option value="oral" ${calc === 'oral' ? 'selected' : ''}>per os</option>
          <option value="support">support / rinçage</option>
        </select>
        <div class="unit-input"><input data-field="coef" type="number" step="0.01" placeholder="Dose" value="${esc(coef)}"><span>mg</span></div>
        <input data-field="jours" placeholder="Jours (ex: J1 J8)" value="${esc(d.ryt || d.jours || '')}">
        <select data-field="sol">
          <option value="">Solvant</option>
          <option value="NaCl 0.9%" ${selectedSol === 'NaCl 0.9%' ? 'selected' : ''}>NaCl 0.9%</option>
          <option value="SG 5%" ${selectedSol === 'SG 5%' ? 'selected' : ''}>SG 5%</option>
          <option value="Eau PPI">Eau PPI</option>
          <option value="Sans solvant">Sans solvant</option>
        </select>
        <div class="unit-input"><input data-field="solvol" type="number" step="1" placeholder="Vol." value="${esc(solVol)}"><span>cc</span></div>
        <div class="unit-input"><input data-field="dur" placeholder="Duree" value="${esc(durValue)}"><span>mn</span></div>
        <input data-field="freq" placeholder="Frequence" title="Rythme particulier: hebdomadaire, J1-J8, avant/apres une autre molecule..." value="${esc(d.frequence || d.frequency || '')}">
        <input data-field="remark" placeholder="Remarque" title="Consigne clinique ou pratique: surveillance, voie, consigne de preparation..." value="${esc(d.remarque || d.remark || d.freq || '')}">
        <div class="unit-input"><input data-field="limit" type="number" step="0.01" placeholder="Dose limite" value="${esc(d.maxDose || '')}"><span>mg</span></div>
        <label class="light-check"><input data-field="light" type="checkbox" ${norm(d.note || d.freq).includes('lumiere') ? 'checked' : ''}> Protection lumière</label>
        <button type="button" class="proto-remove" title="Retirer" onclick="this.closest('.proto-drug-line').remove()">x</button>
      </div>
    `);
  };

  function renderProtocolCardsFinal(){
    normalizeAllProtocols();
    const grid = document.getElementById('proto-grid') || document.getElementById('protoGrid');
    if(!grid) return;
    grid.innerHTML = protocolsList().map(proto => `
      <div class="proto-card${typeof selId !== 'undefined' && selId === proto.id ? ' selected' : ''}" onclick="selectProto('${esc(proto.id)}')">
        <div class="proto-radio"></div>
        <div>
          <div class="pname">${esc(proto.name)}</div>
          <span class="pbadge ${esc(proto.badgeClass || 'b21')}">${esc(proto.badge || proto.rythme || '')}</span>
          <div class="pdetail">${esc((proto.drugs || []).filter(d => !d.t).map(d => d.name || d.label).join(' + '))}</div>
          <div style="font-size:10.5px;color:#5f6f62;margin-top:5px"><b>Bilan utile :</b> ${esc(proto.pre || defaultPreForProtocol(proto))}</div>
          <div style="font-size:10.5px;color:#6b5b38;margin-top:4px"><b>Reference :</b> ${esc(proto.reference || proto.ref || proto.source || 'A renseigner / validation service')}</div>
          <div class="proto-card-actions"><button type="button" onclick="event.stopPropagation(); editProtocolCard('${esc(proto.id)}')">Modifier</button><button type="button" class="danger" onclick="event.stopPropagation(); deleteProtocolCard('${esc(proto.id)}')">Supprimer</button></div>
        </div>
      </div>
    `).join('');
  }
  window.renderProtos = renderProtocolCardsFinal;
  try { renderProtos = renderProtocolCardsFinal; } catch(e){}

  window.editProtocolCard = function(id){
    requireAdminAction('modifier le protocole', () => {
      const proto = protocolsList().find(p => p.id === id);
      if(!proto) return alert('Protocole introuvable.');
      const name = prompt('Nom du protocole :', proto.name); if(name === null) return;
      const rythme = prompt('Rythme :', val(proto.rythme, proto.badge, 'J21')); if(rythme === null) return;
      const pre = prompt('Bilan utile :', val(proto.pre)); if(pre === null) return;
      const reference = prompt('Reference scientifique :', val(proto.reference, proto.ref, proto.source, defaultReferenceForProtocol(proto))); if(reference === null) return;
      const updated = upsertCustomProtocol({...proto, name:name.trim(), rythme:rythme.trim(), badge:rythme.trim(), pre:pre.trim(), reference:reference.trim()});
      normalizeAllProtocols();
      renderProtocolCardsFinal();
      window.renderProtocolReferenceTable?.();
      showToastSafe(`Protocole ${updated.name} modifie.`, 'success');
    });
  };

  window.deleteProtocolCard = function(id){
    requireAdminAction('supprimer le protocole', () => {
      const proto = protocolsList().find(p => p.id === id);
      if(!proto) return;
      if(!confirm(`Supprimer le protocole ${proto.name} ?`)) return;
      writeJson('chncak_deleted_protocols', Array.from(new Set([...readJson('chncak_deleted_protocols', []), id])));
      const custom = readJson('chncak_custom_protocols', []).filter(p => p.id !== id);
      writeJson('chncak_custom_protocols', custom);
      const list = protocolsList();
      const idx = list.findIndex(p => p.id === id);
      if(idx >= 0) list.splice(idx, 1);
      renderProtocolCardsFinal();
      window.renderProtocolReferenceTable?.();
      showToastSafe('Protocole supprime de la liste.', 'success');
    });
  };

  window.showAddProtocoleModal = function(){
    if(!window.__protoAddAuthorized){
      requireAdminAction('ajouter un protocole', () => {
        window.__protoAddAuthorized = true;
        window.showAddProtocoleModal();
        window.__protoAddAuthorized = false;
      });
      return;
    }
    const modal = document.getElementById('add-protocole-modal');
    if(!modal) return;
    refreshProtocolDrugDatalist();
    modal.innerHTML = `
      <div style="max-width:1280px;margin:18px auto;background:white;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);overflow:hidden">
      <div style="padding:16px 20px;background:linear-gradient(135deg,#0B5E3C,#16a085);color:white;display:flex;justify-content:space-between;align-items:center">
        <h2 style="margin:0;font-size:18px">Ajouter un protocole</h2>
        <button onclick="closeAddProtocoleModal()" style="background:none;border:none;color:white;font-size:24px;cursor:pointer">x</button>
      </div>
      <div style="padding:20px">
      <div class="proto-editor-final">
        <div class="proto-editor-grid">
          <label>ID unique<input id="new-proto-id" placeholder="ex: folfox6"></label>
          <label>Nom du protocole<input id="new-proto-name" placeholder="Ex: FOLFOX"></label>
          <label>Rythme<input id="new-proto-rythme" placeholder="Ex: J14, J21, J28" value="J21"></label>
          <label>Indication<input id="new-proto-indication" placeholder="Ex: cancer colorectal"></label>
          <label>Reference scientifique <span style="color:#b42318">*</span><input id="new-proto-reference" required placeholder="Ex: NCCN, ESMO, protocole service valide..."></label>
          <label>Bilan utile<input id="new-proto-pre" placeholder="NFS, plaquettes, creatinine..."></label>
          <label>Surveillance / remarques<input id="new-proto-post" placeholder="Surveillance selon protocole du service"></label>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px">
          <h3 style="margin:0;color:#173b2f;font-size:15px">Elements du protocole</h3>
          <button type="button" class="btn-secondary" style="width:auto;padding:8px 12px" onclick="addProtocolDrugRow()">+ Ligne medicament</button>
        </div>
        <div id="proto-drugs-list" class="proto-drug-grid"></div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
        <button onclick="closeAddProtocoleModal()" style="background:#6c757d;color:white;border:none;padding:10px 18px;border-radius:4px;cursor:pointer">Annuler</button>
        <button onclick="saveNewProtocole()" style="background:linear-gradient(135deg,#0B5E3C,#16a085);color:white;border:none;padding:10px 22px;border-radius:4px;cursor:pointer;font-weight:600">Enregistrer</button>
      </div>
      </div></div>
    `;
    modal.style.display = 'block';
    addProtocolDrugRow({order:1, name:'Hydrocortisone', calc:'support', fix:200, sol:'50 cc NaCl 0.9%', dur:'15 mn', ryt:'J1', remark:'Premedication'});
    addProtocolDrugRow({order:2, name:'Kytril', calc:'support', fix:3, sol:'50 cc NaCl 0.9%', dur:'15 mn', ryt:'J1', remark:'Premedication antiemetique'});
    addProtocolDrugRow({order:3, name:'Rincage 250 cc SSI 0.9%', calc:'support', fix:250, sol:'250 cc NaCl 0.9%', dur:'30 mn', ryt:'J1', remark:'Rincage entre deux medicaments anticancereux'});
    addProtocolDrugRow({order:4});
  };

  window.closeAddProtocoleModal = function(){
    const modal = document.getElementById('add-protocole-modal');
    if(modal) modal.style.display = 'none';
  };

  window.saveNewProtocole = function(){
    const name = document.getElementById('new-proto-name')?.value.trim();
    if(!name) return alert('Nom du protocole obligatoire.');
    const reference = document.getElementById('new-proto-reference')?.value.trim();
    if(!reference) return alert('Reference scientifique obligatoire.');
    const drugs = collectProtocolDrugRows();
    if(!drugs.length) return alert('Ajouter au moins un medicament.');
    drugs.forEach(drug => ensureProtocolDrugInCatalog(drug.name));
    refreshProtocolDrugDatalist();
    const proto = upsertCustomProtocol({
      id: document.getElementById('new-proto-id')?.value.trim() || slugify(name),
      name,
      rythme: document.getElementById('new-proto-rythme')?.value.trim() || 'J21',
      indication: document.getElementById('new-proto-indication')?.value.trim(),
      reference,
      pre: document.getElementById('new-proto-pre')?.value.trim(),
      post: document.getElementById('new-proto-post')?.value.trim(),
      drugs
    });
    if(typeof renderProtos === 'function') renderProtos();
    window.closeAddProtocoleModal();
    showToastSafe(`Protocole ${proto.name} ajoute.`, 'success');
  };

  window.downloadProtocolImportTemplate = function(){
    const rows = [
      ['Nom protocole','Rythme','Bilan utile','Surveillance','Reference scientifique','Ordre de passage','Medicament','Type calcul','Dose','Unite','Jours','Solvant','Volume solvant cc','Duree','Frequence','Remarque','Alerte dose limite mg','Protection lumiere','Oral'],
      ['EXEMPLE FOLFOX','J14','NFS plaquettes, creatinine, bilan hepatique','Surveillance clinique et biologique','Reference service / guideline validee','1','Hydrocortisone','support','200','mg','J1','NaCl 0.9%','50','15','Avant chimio','Premedication','','NON','NON'],
      ['EXEMPLE FOLFOX','J14','NFS plaquettes, creatinine, bilan hepatique','Surveillance clinique et biologique','Reference service / guideline validee','2','Kytril','support','3','mg','J1','NaCl 0.9%','50','15','Avant chimio','Premedication antiemetique','','NON','NON'],
      ['EXEMPLE FOLFOX','J14','NFS plaquettes, creatinine, bilan hepatique','Surveillance clinique et biologique','Reference service / guideline validee','3','Oxaliplatine','mg/m2','85','mg/m2','J1','SG 5%','500','120','J1','Tubulure adaptee selon protocole','','NON','NON'],
      ['EXEMPLE FOLFOX','J14','NFS plaquettes, creatinine, bilan hepatique','Surveillance clinique et biologique','Reference service / guideline validee','4','Rincage 250 cc SSI 0.9%','support','250','cc','J1','NaCl 0.9%','250','30','Entre deux anticancereux','Faire passer en 30 mn','','NON','NON'],
      ['EXEMPLE FOLFOX','J14','NFS plaquettes, creatinine, bilan hepatique','Surveillance clinique et biologique','Reference service / guideline validee','5','5-FU','mg/m2','400','mg/m2','J1','NaCl 0.9%','100','Bolus','J1','Bolus lent','','NON','NON'],
      ['EXEMPLE ORAL','J21','NFS plaquettes, bilan hepatique','Surveillance clinique','Reference service / guideline validee','3','Capecitabine','per os','1250','mg','J1-J14','','','','2 prises par jour','A prendre apres repas','','NON','OUI']
    ];
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(';')).join('\n');
    downloadTextFile('modele_import_protocoles_complet.csv', csv, 'text/csv;charset=utf-8');
  };

  window.importProtocolExcel = function(input){
    const file = input?.files?.[0];
    if(!file) return;
    if(typeof XLSX === 'undefined') return alert('Module Excel indisponible.');
    if(!window.__protoImportAuthorized){
      requireAdminAction('importer des protocoles', () => {
        window.__protoImportAuthorized = true;
        window.importProtocolExcel(input);
        window.__protoImportAuthorized = false;
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), {type:'array'});
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, {defval:''});
        const grouped = new Map();
        rows.forEach(row => {
          const name = val(row['Nom protocole'], row.Protocole, row.Nom, row.name);
          const med = val(row.Medicament, row.Med, row.Molecule);
          if(!name || !med) return;
          const key = slugify(name);
          if(!grouped.has(key)) grouped.set(key, {id:key, name, rythme:val(row.Rythme,row.Badge,'J21'), pre:val(row['Bilan utile'],row.Bilan), post:val(row.Surveillance,row.Remarques), reference:val(row['Reference scientifique'], row.Reference, row.Source), drugs:[]});
          const type = norm(val(row['Type calcul'], row.Type, row.Calcul));
          const dose = Number(String(val(row.Dose,row.Coef)).replace(',', '.'));
          const solName = val(row.Solvant,row.Sol);
          const solVol = val(row['Volume solvant cc'], row.Volume, row.Volume_solvant);
          const order = Number(val(row['Ordre de passage'], row.Ordre, row.Order)) || 0;
          const freqImport = val(row.Frequence, row['Frequence / remarque']);
          const remarkImport = val(row.Remarque, row['Remarque clinique'], row.Commentaire);
          const drug = {name:med, ryt:val(row.Jours,row.Rythme_medicament), sol:[solVol ? `${solVol} cc` : '', solName].filter(Boolean).join(' '), dur:val(row.Duree,row.Durée), freq:[freqImport ? `Frequence: ${freqImport}` : '', remarkImport].filter(Boolean).join(' - '), frequence:freqImport, remarque:remarkImport, order, hl:true};
          const light = norm(val(row['Protection lumiere'], row['Protection lumière'], row.Lumiere, row.Lumière));
          if(light === 'oui' || light === 'yes' || light === '1') drug.note = [drug.freq, 'Proteger contre la lumiere'].filter(Boolean).join(' - ');
          if(norm(med).match(/^(nacl|na cl|ssi|sg|g5|glucose|ringer|eau ppi|rinçage|rincage|rehydratation|réhydratation)/) || type.includes('support')){
            drug.t = 'r';
            drug.label = [med, drug.sol].filter(Boolean).join(' ');
            delete drug.name; delete drug.hl;
          }
          if(type.includes('m2') || type.includes('surface')) drug.mgm2 = dose;
          else if(type.includes('kg') || type.includes('poids')) drug.mgkg = dose;
          else if(type.includes('auc')) drug.carbo = true;
          else if(type.includes('oral') || norm(row.Oral) === 'oui'){ drug.oral = true; drug.pos = `${dose || ''} ${val(row.Unite,'mg')}`.trim(); delete drug.hl; }
          else drug.fix = dose;
          grouped.get(key).drugs.push(drug);
        });
        let count = 0;
        grouped.forEach(proto => { upsertCustomProtocol(proto); count++; });
        if(typeof renderProtos === 'function') renderProtos();
        alert(count ? `${count} protocole(s) importe(s).` : 'Aucun protocole importe. Utilisez le modele complet.');
      } catch(err){ alert('Erreur import protocoles: ' + err.message); }
      input.value = '';
    };
    reader.readAsArrayBuffer(file);
  };
  try { showAddProtocoleModal = window.showAddProtocoleModal; } catch(e){}
  try { saveNewProtocole = window.saveNewProtocole; } catch(e){}
  try { downloadProtocolImportTemplate = window.downloadProtocolImportTemplate; } catch(e){}
  try { importProtocolExcel = window.importProtocolExcel; } catch(e){}

  function savedProtocolEntries(){
    const hist = readJson(STORAGE.historique, []);
    const ok = getOkChimioList().map(item => ({...(item.patient || {}), ...item}));
    return dedupeByPatientTreatment([...hist, ...ok]).filter(item => patientName(item) || val(item.dossier));
  }

  function installApercuSearch(){
    const page = document.getElementById('page-apercu');
    if(!page) return;
    document.getElementById('apercu-patient-loader')?.remove();
    const entries = savedProtocolEntries();
    const options = entries.map((item, index) => `<option value="${index}">${esc(patientName(item))} - Dossier ${esc(val(item.dossier, '-'))}</option>`).join('');
    const anchor = page.querySelector('[style*="justify-content:space-between"]') || page.firstElementChild;
    anchor?.insertAdjacentHTML('afterend', `<div id="apercu-patient-loader" class="card" style="margin:12px 0"><div class="card-body" style="display:flex;gap:8px;align-items:end;flex-wrap:wrap"><div class="field" style="flex:1;min-width:260px;margin:0"><label>Selectionner un patient sauvegarde</label><input id="apercu-patient-search" type="text" placeholder="Commencer a taper le nom..." oninput="filterApercuPatients()"><select id="apercu-patient-select"><option value="">Patient - dossier</option>${options}</select></div><button class="btn-primary" style="width:auto;padding:10px 18px" onclick="loadSavedProtocolPreview()">Rechercher</button><button class="btn-secondary" style="width:auto;padding:10px 14px;background:#fff7e6;color:#7A4B00;border-color:#f0c060" onclick="printSelectedApercuRdv()">Bon RDV</button><button class="btn-secondary" style="width:auto;padding:10px 14px" onclick="deleteSelectedApercuPatient()">Supprimer</button></div></div>`);
  }

  window.filterApercuPatients = function(){
    const q = norm(document.getElementById('apercu-patient-search')?.value || '');
    const select = document.getElementById('apercu-patient-select');
    if(!select) return;
    Array.from(select.options).forEach(option => {
      if(!option.value){ option.hidden = false; return; }
      option.hidden = q && !norm(option.textContent).startsWith(q);
    });
  };

  window.loadSavedProtocolPreview = function(){
    const idx = Number(document.getElementById('apercu-patient-select')?.value);
    const entry = savedProtocolEntries()[idx];
    if(!entry) return alert('Selectionner un patient.');
    if(!loadEntryIntoForm(entry)) return alert('Impossible de restaurer ce protocole.');
    if(typeof renderApercu === 'function') renderApercu();
  };

  window.printSelectedApercuRdv = function(){
    const idx = Number(document.getElementById('apercu-patient-select')?.value);
    const entry = savedProtocolEntries()[idx];
    if(!entry) return alert('Selectionner un patient.');
    if(!loadEntryIntoForm(entry)) return alert('Impossible de charger ce patient pour le bon de RDV.');
    writeJson(LAST_PROTOCOL_PATIENT_KEY, {...entry, dateRdv:val(entry.dateRdv, entry.rdv, entry.prochainRdv, entry.formSnapshot?.['date-rdv'])});
    window.printBonRDV();
  };

  window.printBonRdvFromRdv = function(id){
    const rdv = readJson(STORAGE.rdv, []).find(r => String(r.id) === String(id));
    if(!rdv) return alert('Rendez-vous introuvable.');
    const patient = readJson(STORAGE.patients, []).find(p =>
      (p.dossier && p.dossier === rdv.dossier) ||
      (patientCode(p) && patientCode(p) === val(rdv.codegratuite, rdv.code)) ||
      norm(patientName(p)) === norm(patientName(rdv))
    ) || {};
    const entry = {...patient, ...rdv, dateRdv:val(rdv.dateRdv, rdv.date), proto:val(rdv.proto, patient.proto), protocole:val(rdv.proto, patient.protocole), protoId:val(rdv.protoId, patient.protoId)};
    if(!loadEntryIntoForm(entry)) writeJson(LAST_PROTOCOL_PATIENT_KEY, entry);
    else writeJson(LAST_PROTOCOL_PATIENT_KEY, entry);
    setRestoredProtocolMode(entry);
    window.printBonRDV();
  };

  window.deleteSelectedApercuPatient = function(){
    const idx = Number(document.getElementById('apercu-patient-select')?.value);
    const entry = savedProtocolEntries()[idx];
    if(!entry) return alert('Selectionner un patient a supprimer.');
    askAdminCode(`supprimer uniquement cette ligne: ${patientName(entry) || 'ce patient'}`, () => {
      const removed = deleteSingleSavedProtocol(entry);
      installApercuSearch();
      window.renderPatientsList?.();
      window.renderBiologie?.();
      window.renderSuivi?.();
      window.renderOkChimio?.();
      renderPreparationTodayList();
      showToastSafe(removed ? 'Ligne/protocole supprime sans effacer les autres lignes similaires.' : 'Aucune ligne exacte trouvee a supprimer.', removed ? 'success' : 'warning');
    });
  };

  function installPatientSearchBox(pageId, boxId, loadFnName){
    const page = document.getElementById(pageId);
    if(!page) return;
    document.getElementById(boxId)?.remove();
    const entries = savedProtocolEntries();
    const options = entries.map((item, index) => `<option value="${index}">${esc(patientName(item))} - Dossier ${esc(val(item.dossier, '-'))} - ${esc(protocolNameFor(item))}</option>`).join('');
    const anchor = page.querySelector('[style*="justify-content:space-between"]') || page.firstElementChild;
    anchor?.insertAdjacentHTML('afterend', `<div id="${boxId}" class="card patient-loader-card" style="margin:8px 0 12px"><div class="card-body" style="display:flex;gap:8px;align-items:end;flex-wrap:wrap;padding:10px 12px"><div class="field" style="flex:1;min-width:260px;margin:0"><label>Rechercher un patient sauvegarde</label><input type="text" placeholder="Commencer a taper le nom..." oninput="filterPatientLoader('${boxId}')"><select><option value="">Patient - dossier - protocole</option>${options}</select></div><button class="btn-primary" style="width:auto;padding:10px 18px" onclick="${loadFnName}('${boxId}')">Rechercher</button></div></div>`);
  }

  window.filterPatientLoader = function(boxId){
    const box = document.getElementById(boxId);
    const q = norm(box?.querySelector('input')?.value || '');
    const select = box?.querySelector('select');
    if(!select) return;
    Array.from(select.options).forEach(option => {
      if(!option.value){ option.hidden = false; return; }
      option.hidden = q && !norm(option.textContent).startsWith(q);
    });
  };

  function loadEntryIntoForm(entry){
    if(!entry) return false;
    const set = (id, value) => { const el = document.getElementById(id); if(el) el.value = value || ''; };
    Object.entries(entry.formSnapshot || {}).forEach(([id, value]) => set(id, value));
    set('prenom', val(entry.prenom, entry.patient?.prenom));
    set('nom', val(entry.nom, entry.patient?.nom));
    set('age', entry.age); set('poids', entry.poids); set('taille', entry.taille); set('sexe', entry.sexe);
    set('nationalite', val(entry.nationalite, entry.formSnapshot?.nationalite));
    set('ligne-traitement', val(entry.ligne, entry.ligneTraitement, entry.line, entry.formSnapshot?.['ligne-traitement']));
    set('dossier', entry.dossier); set('cubix', entry.cubix); set('codegratuite', patientCode(entry));
    set('groupe-sanguin', val(entry.groupeSanguin, entry.groupe, entry.formSnapshot?.['groupe-sanguin']));
    set('tel-patient', val(entry.tel, entry.contact, entry.telephone));
    set('date-protocole', val(entry.dateProto, entry.dateProtocole, entry.formSnapshot?.['date-protocole']));
    set('date-rdv', val(entry.dateRdv, entry.prochainRdv, entry.rdv, entry.formSnapshot?.['date-rdv']));
    set('medecin-select', val(entry.medecin, entry.formSnapshot?.['medecin-select']));
    set('localisation', val(entry.localisation, entry.diagnostic));
    set('indication', val(entry.indication, entry.formSnapshot?.indication));
    set('type-histologie', val(entry.histologie, entry.typeHistologie, entry.formSnapshot?.['type-histologie']));
    set('stade', val(entry.stade, entry.phaseDiagnostic, entry.formSnapshot?.stade));
    set('creatinine', val(entry.creatinine, entry.formSnapshot?.creatinine));
    set('auc-cible', val(entry.auc, entry.formSnapshot?.['auc-cible']));
    set('auc-custom', val(entry.aucCustom, entry.formSnapshot?.['auc-custom']));
    set('total-cures', val(entry.totalCures, entry.formSnapshot?.['total-cures']));
    set('cure-num', val(entry.cure, entry.formSnapshot?.['cure-num']));
    const atcdValue = val(entry.atcd, entry.antecedents, entry.formSnapshot?.atcd, entry.formSnapshot?.['atcd-select']);
    if(atcdValue){
      const select = document.getElementById('atcd-select');
      const hasOption = select && Array.from(select.options).some(option => option.value === atcdValue);
      set('atcd-select', hasOption ? atcdValue : 'autre');
      if(typeof onAtcdChange === 'function') onAtcdChange();
      set('atcd', hasOption ? '' : atcdValue);
    }
    const protoId = val(entry.protoId, protocolsList().find(p => norm(p.name) === norm(val(entry.protoName, entry.protocole, entry.protocolName, entry.proto)))?.id);
    if(protoId && typeof selectProto === 'function') selectProto(protoId);
    if(typeof calcSC === 'function') calcSC();
    if(typeof calcCarbo === 'function') calcCarbo();
    if(typeof update === 'function') update();
    setRestoredProtocolMode(entry);
    return true;
  }

  window.loadPatientForPreparation = function(boxId){
    const idx = Number(document.getElementById(boxId)?.querySelector('select')?.value);
    const entry = savedProtocolEntries()[idx];
    if(!loadEntryIntoForm(entry)) return alert('Selectionner un patient.');
    if(typeof renderPreparation === 'function') renderPreparation();
    ensurePreparationPrintReady();
  };

  window.loadPatientForSupport = function(boxId){
    const idx = Number(document.getElementById(boxId)?.querySelector('select')?.value);
    const entry = savedProtocolEntries()[idx];
    if(!loadEntryIntoForm(entry)) return alert('Selectionner un patient.');
    if(typeof renderSupport === 'function') renderSupport();
  };

  function hematologieRegisteredPatientOptions(){
    return readJson('chncak_hematologie_patients', [])
      .map(p => `<option value="${esc(patientName(p))}">${esc(val(p.prenom))} ${esc(val(p.nom))} - ${esc(val(p.codegratuite, p.code, ''))}</option>`)
      .join('');
  }

  function hematologieCatalogOptions(){
    return readJson(STORAGE.catalog, [])
      .map(item => `<option value="${esc(item.name)}">${esc(item.name)}${item.dci ? ' - ' + esc(item.dci) : ''}</option>`)
      .join('');
  }

  function hematologieRows(){
    const admin = isAdminUser();
    return readJson('chncak_hematologie_sorties', []).slice(0, 40).map(r => `
      <tr>
        <td>${esc(r.date || '')}</td>
        <td>${esc(r.patient || '')}</td>
        <td>${esc(r.medicament || '')}</td>
        <td>${esc(r.dci || '')}</td>
        <td>${esc(r.numeroLot || '')}</td>
        <td>${esc(r.dateExp || '')}</td>
        <td>${esc(r.dosage || '')}</td>
        <td>${esc(r.quantite || '')}</td>
        <td>${esc(r.user || '')}</td>
        ${admin ? `<td style="white-space:nowrap"><button class="btn-secondary official-github-mini" onclick="editHematologieSortie('${esc(r.id)}')">Modifier</button><button class="btn-secondary official-github-mini" onclick="deleteHematologieSortie('${esc(r.id)}')">Supprimer</button></td>` : ''}
      </tr>
    `).join('');
  }

  window.editHematologieSortie = function(id){
    requireAdminAction('modifier une sortie hematologie', () => {
      const list = readJson('chncak_hematologie_sorties', []);
      const idx = list.findIndex(r => String(r.id) === String(id));
      if(idx < 0) return alert('Ligne introuvable.');
      const row = list[idx];
      const patient = prompt('Patient :', row.patient || '') ?? row.patient;
      const medicament = prompt('Medicament :', row.medicament || '') ?? row.medicament;
      const dci = prompt('DCI :', row.dci || '') ?? row.dci;
      const numeroLot = prompt('Numero lot :', row.numeroLot || '') ?? row.numeroLot;
      const dateExp = prompt("Date d'expiration (AAAA-MM-JJ) :", row.dateExp || '') ?? row.dateExp;
      const dosage = prompt('Dosage :', row.dosage || '') ?? row.dosage;
      const quantiteRaw = prompt('Quantite :', String(row.quantite || '')) ?? row.quantite;
      const quantite = Number(quantiteRaw);
      if(!medicament || !quantite || quantite <= 0) return alert('Medicament ou quantite invalide.');
      list[idx] = {...row, patient, medicament, dci, numeroLot, dateExp, dosage, quantite, editedAt:new Date().toISOString(), editedBy:val(currentUser().name, currentUser().username, 'admin')};
      writeJson('chncak_hematologie_sorties', list);
      window.renderHematologie?.();
      showToastSafe('Sortie hematologie modifiee.', 'success');
    });
  };

  window.deleteHematologieSortie = function(id){
    requireAdminAction('supprimer une sortie hematologie', () => {
      const list = readJson('chncak_hematologie_sorties', []);
      const row = list.find(r => String(r.id) === String(id));
      if(!row) return alert('Ligne introuvable.');
      if(!confirm(`Supprimer la sortie de ${row.patient || 'ce patient'} - ${row.medicament || ''} ?`)) return;
      writeJson('chncak_hematologie_sorties', list.filter(r => String(r.id) !== String(id)));
      window.renderHematologie?.();
      showToastSafe('Sortie hematologie supprimee.', 'success');
    });
  };

  window.fillHematologiePatient = function(patientId){
    const p = [...readJson('chncak_hematologie_patients', []), ...readJson(STORAGE.patients, [])].find(item => String(item.id) === String(patientId));
    if(!p) return;
    const set = (id, value) => { const el = document.getElementById(id); if(el) el.value = value || ''; };
    set('hema-nom', val(p.nom));
    set('hema-prenom', val(p.prenom));
    set('hema-age', val(p.age));
    set('hema-sexe', val(p.sexe));
    set('hema-code', val(p.codegratuite, p.codeGratuite, p.code));
    set('hema-nationalite', val(p.nationalite));
    set('hema-nin', val(p.nin, p.NIN));
    set('hema-cuibix', val(p.cuibix, p.CUIBIX, p.idCuibix, p.id_cuibix));
    set('hema-protocole', protocolNameFor(p));
  };

  window.fillHematologieDrug = function(){
    const name = document.getElementById('hema-med-name')?.value || '';
    const item = readJson(STORAGE.catalog, []).find(x => norm(x.name) === norm(name));
    if(!item) return;
    const dci = document.getElementById('hema-med-dci');
    const dosage = document.getElementById('hema-med-dosage');
    if(dci && !dci.value) dci.value = item.dci || '';
    if(dosage && !dosage.value){
      const first = Array.isArray(item.dosages) ? item.dosages[0] : val(item.dosage, '');
      dosage.value = first ? `${first} mg` : '';
    }
  };

  window.saveHematologiePatient = function(){
    const get = id => document.getElementById(id)?.value?.trim() || '';
    if(!get('hema-code')) setHematologieAutoCode(false);
    const patient = {
      id: val(get('hema-code'), get('hema-nin'), Date.now()),
      nom: get('hema-nom'),
      prenom: get('hema-prenom'),
      age: get('hema-age'),
      sexe: get('hema-sexe'),
      codegratuite: get('hema-code'),
      nationalite: get('hema-nationalite'),
      nin: get('hema-nin'),
      cuibix: get('hema-cuibix'),
      protocole: get('hema-protocole'),
      savedAt: new Date().toISOString()
    };
    if(!patient.nom || !patient.prenom) return alert('Renseignez au minimum le nom et le prenom.');
    if(patient.codegratuite && codeGratuiteExists(patient.codegratuite)){
      const listForCheck = readJson('chncak_hematologie_patients', []);
      const sameExisting = listForCheck.some(p => norm(val(p.codegratuite)) === norm(patient.codegratuite) && norm(`${p.prenom} ${p.nom}`) === norm(`${patient.prenom} ${patient.nom}`));
      if(!sameExisting && document.getElementById('hema-code')?.dataset.manual !== '1'){
        patient.codegratuite = setHematologieAutoCode(true);
        patient.id = val(patient.codegratuite, patient.nin, Date.now());
      }
    }
    const list = readJson('chncak_hematologie_patients', []);
    const key = norm(val(patient.codegratuite, patient.nin, `${patient.prenom} ${patient.nom}`));
    const idx = list.findIndex(p => norm(val(p.codegratuite, p.nin, `${p.prenom} ${p.nom}`)) === key);
    if(idx >= 0) list[idx] = {...list[idx], ...patient};
    else list.unshift(patient);
    writeJson('chncak_hematologie_patients', list);
    reserveCodeGratuite(patient.codegratuite);
    window.renderHematologie?.();
    showToastSafe('Patient hematologie enregistre.', 'success');
  };

  window.loadHematologieSortiePatient = function(name){
    const p = readJson('chncak_hematologie_patients', []).find(item => norm(patientName(item)) === norm(name) || norm(`${patientName(item)} - ${val(item.codegratuite, item.code)}`) === norm(name));
    if(!p) return;
    ['nom','prenom','age','sexe','code','nationalite','nin','cuibix','protocole'].forEach(field => {
      const value = field === 'code' ? val(p.codegratuite, p.code) : val(p[field]);
      const el = document.getElementById(`hema-${field}`);
      if(el) el.value = value || '';
    });
  };

  window.validateHematologieSortie = function(){
    const get = id => document.getElementById(id)?.value?.trim() || '';
    const medicament = get('hema-med-name');
    const dci = get('hema-med-dci');
    const quantite = Number(get('hema-med-quantite'));
    const dateExp = get('hema-med-exp');
    if(!medicament || !quantite || quantite <= 0){
      alert('Renseignez le medicament et une quantite valide.');
      return;
    }
    if(dateExp && dateExp < todayIso()){
      alert(`Attention : ce medicament est expire depuis le ${dateExp}. Sortie non validee.`);
      return;
    }
    const catalog = readJson(STORAGE.catalog, []);
    const matched = findCatalogItem(dci || medicament, catalog) || findCatalogItem(medicament, catalog);
    const idx = catalog.findIndex(item => item === matched);
    if(idx < 0){
      alert('Medicament introuvable dans la pharmacie centrale. Ajoutez-le au catalogue avant validation.');
      return;
    }
    const stock = Number(val(catalog[idx].qteService, catalog[idx].stockService, catalog[idx].qteStock, catalog[idx].stock, catalog[idx].quantite, 0));
    if(stock < quantite){
      alert(`Stock insuffisant pour ${catalog[idx].name}. Disponible : ${stock}, demande : ${quantite}.`);
      return;
    }
    catalog[idx].qteService = stock - quantite;
    catalog[idx].qteStock = catalog[idx].qteService;
    syncCatalogGlobal(catalog);
    const row = {
      id: Date.now(),
      date: new Date().toLocaleDateString('fr-FR'),
      dateTs: new Date().toISOString(),
      patient: get('hema-sortie-patient') || `${get('hema-prenom')} ${get('hema-nom')}`.trim(),
      age: get('hema-age'),
      sexe: get('hema-sexe'),
      codegratuite: get('hema-code'),
      nationalite: get('hema-nationalite'),
      nin: get('hema-nin'),
      cuibix: get('hema-cuibix'),
      protocole: get('hema-protocole'),
      medicament: catalog[idx].name || medicament,
      dci: dci || catalog[idx].dci || '',
      numeroLot: get('hema-med-lot'),
      dateExp: get('hema-med-exp'),
      dosage: get('hema-med-dosage'),
      quantite,
      user: val(currentUser().name, currentUser().username, '')
    };
    const hema = readJson('chncak_hematologie_sorties', []);
    hema.unshift(row);
    writeJson('chncak_hematologie_sorties', hema);
    const sorties = readJson(STORAGE.sorties, []);
    sorties.unshift({
      id: row.id,
      date: row.date,
      dateTs: row.dateTs,
      patient: row.patient,
      dossier: row.codegratuite,
      protocole: row.protocole || 'Hematologie',
      source: 'Registre hematologie',
      details: `${row.medicament}: ${quantite} unite(s), lot ${row.numeroLot || '-'}`,
      detailsData: [{name: row.medicament, dose: 0, nbFlacons: quantite, reliquatMg: 0, flacons: []}],
      warnings: []
    });
    writeJson(STORAGE.sorties, sorties);
    window.renderHematologie?.();
    window.renderPharmacie?.();
    showToastSafe('Sortie hematologie validee et stock deduit.', 'success');
  };

  window.clearHematologieHistory = function(){
    requireAdminAction('effacer le registre hematologie', () => {
      localStorage.removeItem('chncak_hematologie_sorties');
      window.renderHematologie?.();
      showToastSafe('Registre hematologie efface.', 'success');
    });
  };

  window.renderHematologie = function(){
    const root = document.getElementById('hematologie-content');
    if(!root) return;
    root.innerHTML = `
      <div class="hematologie-shell">
        <div class="dashboard-head">
          <div>
            <h2>Hematologie</h2>
            <p>Dossier patient et registre journalier de sortie des medicaments.</p>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-num">H</div><h2>Donnees patient</h2></div>
          <div class="card-body">
            <div class="hematologie-grid">
              <div class="field"><label>Nom</label><input id="hema-nom"></div>
              <div class="field"><label>Prenom</label><input id="hema-prenom"></div>
              <div class="field"><label>Age</label><input id="hema-age" type="number" min="0"></div>
              <div class="field"><label>Sexe</label><select id="hema-sexe" onchange="generateHematologieCodeGratuite()"><option></option><option>F</option><option>M</option></select></div>
              <div class="field"><label>Code gratuite <span style="color:var(--blue);font-size:10px">(auto)</span></label><input id="hema-code" readonly style="background:var(--blue-pale);color:var(--blue);font-weight:600;font-family:var(--mono)"></div>
              <div class="field"><label>Nationalite</label><select id="hema-nationalite"><option>Senegalais</option><option>Etranger</option></select></div>
              <div class="field"><label>NIN</label><input id="hema-nin"></div>
              <div class="field"><label>ID CUIBIX</label><input id="hema-cuibix"></div>
              <div class="field hematologie-wide"><label>Protocole</label><input id="hema-protocole"></div>
            </div>
            <button class="btn-primary hematologie-validate" onclick="saveHematologiePatient()">Enregistrer le patient</button>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-num" style="background:#0B5E3C">S</div><h2>Registre journalier de sorties des medicaments</h2></div>
          <div class="card-body">
            <div class="hematologie-sortie-grid">
              <div class="field"><label>Prenom et nom du patient</label><input id="hema-sortie-patient" list="hema-patient-list" onchange="loadHematologieSortiePatient(this.value)"><datalist id="hema-patient-list">${hematologieRegisteredPatientOptions()}</datalist></div>
              <div class="field"><label>Medicament</label><input id="hema-med-name" list="hema-med-list" onchange="fillHematologieDrug()" oninput="fillHematologieDrug()"><datalist id="hema-med-list">${hematologieCatalogOptions()}</datalist></div>
              <div class="field"><label>DCI</label><input id="hema-med-dci"></div>
              <div class="field"><label>Numero lot</label><input id="hema-med-lot"></div>
              <div class="field"><label>Date d'exp</label><input id="hema-med-exp" type="date"></div>
              <div class="field"><label>Dosage</label><input id="hema-med-dosage" placeholder="ex: 500 mg"></div>
              <div class="field"><label>Quantite</label><input id="hema-med-quantite" type="number" min="1" step="1"></div>
            </div>
            <button class="btn-primary hematologie-validate" onclick="validateHematologieSortie()">Valider la sortie</button>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-num" style="background:#5A4A8A">J</div><h2>Journal des dernieres sorties</h2>${isAdminUser() ? '<button class="btn-secondary official-github-mini" onclick="clearHematologieHistory()">Effacer historique</button>' : ''}</div>
          <div class="card-body dash-table-wrap">
            <table class="dash-table hematologie-table">
              <thead><tr><th>Date</th><th>Patient</th><th>Medicament</th><th>DCI</th><th>Lot</th><th>Exp</th><th>Dosage</th><th>Quantite</th><th>Utilisateur</th>${isAdminUser() ? '<th>Actions</th>' : ''}</tr></thead>
              <tbody>${hematologieRows() || `<tr><td colspan="${isAdminUser() ? '10' : '9'}" class="dash-empty">Aucune sortie hematologie enregistree.</td></tr>`}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    setHematologieAutoCode(false);
    const hemaCode = document.getElementById('hema-code');
    if(hemaCode){
      hemaCode.title = 'Double-clic discret pour reutiliser un ancien code gratuite';
      hemaCode.ondblclick = () => unlockHematologieCodeGratuiteManual();
    }
  };

  function cleanupLoginAndButtons(){
    document.body.classList.toggle('admin-session', isAdminUser());
    document.body.classList.toggle('pharmacien-session', isPharmacienUser());
    document.body.classList.toggle('infirmier-session', isInfirmierUser());
    document.body.classList.toggle('biologiste-session', isBiologisteUser());
    const login = document.getElementById('login-screen');
    if(login){
      Array.from(login.querySelectorAll('div')).forEach(div => {
        const text = div.textContent || '';
        const isCredentialLine = /identifiant|mot de passe|compte de test/i.test(text) && text.includes('/');
        if(isCredentialLine) div.remove();
      });
      if(!document.getElementById('login-copyright')){
        login.querySelector('form')?.insertAdjacentHTML('afterend', '<div id="login-copyright" style="margin-top:18px;text-align:center;font-size:11px;color:#666;border-top:1px solid #eee;padding-top:12px">Copyright SMSG 2026 - Serigne Mor Samb Gueye<br>Service Oncologie - Radiotherapie CHNCAK Touba</div>');
      }
      if(!document.getElementById('login-clock-card')){
        const now = new Date();
        const timeText = now.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
        const dateText = now.toLocaleDateString('fr-FR', {weekday:'long', day:'2-digit', month:'long', year:'numeric'});
        login.querySelector('form')?.insertAdjacentHTML('beforebegin', `<div id="login-clock-card" class="login-clock-card"><span>CHNCAK Touba</span><strong id="login-live-clock">${esc(timeText)}</strong><em>${esc(dateText)}</em></div>`);
      }
    }
    const patientTop = document.querySelector('#page-patients > div[style*="justify-content:space-between"]');
    if(patientTop) patientTop.style.display = 'none';
    document.querySelectorAll('#page-patients button').forEach(btn => {
      if(btn.textContent.trim() === '+ Ajouter' || btn.textContent.includes('+ Ajouter')) btn.style.display = 'none';
    });
    const toolbar = document.querySelector('#page-patients [style*="display:flex"][style*="gap:8px"]');
    if(toolbar && !document.getElementById('patients-add-final')){
      toolbar.insertAdjacentHTML('beforeend', '<button id="patients-add-final" onclick="showAddPatientModal()" style="padding:8px 14px;background:var(--green2);color:white;border:none;border-radius:var(--radius);font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">Ajouter patient</button>');
    }
    if(document.getElementById('page-programme') && !document.getElementById('programme-template-btn')){
      document.querySelector('#page-programme label[title*="Importer"]')?.insertAdjacentHTML('afterend', '<button id="programme-template-btn" onclick="downloadProgrammeTemplate()" style="padding:9px 14px;background:var(--blue-pale);color:var(--blue);border:1px solid var(--blue-mid);border-radius:var(--radius);font-size:12px;font-weight:700;cursor:pointer">Modele Excel</button>');
    }
    if(document.getElementById('suivi-content') && !document.getElementById('suivi-import-final')){
      const head = document.querySelector('#suivi-content .dashboard-head');
      head?.insertAdjacentHTML('beforeend', '<div id="suivi-import-final" class="suivi-actions-final"><button class="btn-secondary" onclick="downloadSuiviTemplate()">Modele tableau</button><label class="btn-secondary suivi-import-label">Importer tableau<input type="file" accept=".xlsx,.xls" style="display:none" onchange="importSuiviExcel(this)"></label><button class="btn-primary" onclick="exportSuiviExcel()">Exporter tableau</button></div>');
    }
    const medPage = document.getElementById('page-medecins');
    if(medPage && isAdminUser() && !document.getElementById('official-github-data-btn')){
      medPage.querySelector('h2')?.insertAdjacentHTML('afterend', '<button id="official-github-data-btn" class="btn-secondary official-github-mini" onclick="exportOfficialGitHubData()">Export GitHub</button>');
    }
    document.getElementById('official-github-admin-tools')?.remove();
    document.getElementById('official-github-data-dashboard')?.remove();
    document.getElementById('code-gratuite-start-dashboard')?.remove();
    const pharmaPage = document.getElementById('page-pharmacie');
    if(pharmaPage && isAdminUser() && !document.getElementById('official-github-data-pharma')){
      pharmaPage.querySelector('h2')?.insertAdjacentHTML('afterend', '<button id="official-github-data-pharma" class="btn-secondary official-github-mini" onclick="exportOfficialGitHubData()">Export GitHub</button>');
    }
    if(!isAdminUser()){
      document.querySelectorAll('#official-github-data-btn,#official-github-data-dashboard,#official-github-data-pharma,#official-github-admin-tools,.official-github-mini').forEach(el => el.remove());
    }
    if(!isAdminUser()){
      document.querySelectorAll('button,label').forEach(el => {
        if(isPharmacienUser() && el.closest('#page-pharmacie')) return;
        const text = norm(el.textContent || '');
        if(text.includes('effacer historique') || text === 'effacer' || text.includes('restaurer') || text.includes('ajouter un protocole') || text.includes('importer un protocole')) el.style.display = 'none';
      });
      hideAdminOnlyControls();
    }
    if(isInfirmierUser()){
      document.querySelectorAll('button').forEach(btn => {
        const text = norm(btn.textContent || '');
        const onclick = norm(btn.getAttribute('onclick') || '');
        const allowed = onclick.includes('print') || onclick.includes('imprimer') || onclick.includes('marktransfused') || onclick.includes('validatestockfromrdv') || text.includes('imprimer') || text.includes('apercu') || text.includes('bon de sang') || text.includes('transfuse') || text.includes('traiter');
        if(!allowed){
          btn.disabled = true;
          btn.style.opacity = '0.5';
          btn.style.cursor = 'not-allowed';
          btn.title = 'Acces infirmier en lecture seule';
        }
      });
      document.querySelectorAll('label').forEach(label => {
        const text = norm(label.textContent || '');
        if(text.includes('importer') || text.includes('restaurer') || text.includes('export')) label.style.display = 'none';
      });
      document.querySelectorAll('#page-transfusion input,#page-transfusion select,#page-transfusion textarea,#page-rdv input,#page-rdv select,#page-rdv textarea,#page-patients input,#page-patients select,#page-patients textarea,#page-programme input,#page-programme select,#page-programme textarea,#page-suivi input,#page-suivi select,#page-suivi textarea').forEach(input => {
        const type = (input.getAttribute('type') || '').toLowerCase();
        const haystack = norm(`${input.id || ''} ${input.placeholder || ''} ${input.className || ''}`);
        if(type === 'search' || haystack.includes('search') || haystack.includes('recherch') || haystack.includes('filtre')) return;
        input.disabled = true;
        input.style.opacity = '0.7';
      });
    }
    const codeInput = document.getElementById('codegratuite');
    if(codeInput && codeInput.dataset.unlockReady !== '1'){
      codeInput.dataset.unlockReady = '1';
      codeInput.title = 'Double-clic discret pour reutiliser un ancien code gratuite';
      codeInput.addEventListener('dblclick', window.unlockCodeGratuiteManual);
    }
    installPatientSearchBox('page-preparation', 'preparation-patient-loader', 'loadPatientForPreparation');
    installPatientSearchBox('page-support', 'support-patient-loader', 'loadPatientForSupport');
    document.querySelector('#page-medecins .enhance-panel[data-enhance="medecins"]')?.remove();
    document.querySelector('#page-stats button[onclick="clearAllHistory()"]')?.remove();
    const programmeHeader = document.querySelector('#page-programme > div[style*="max-width"] > div[style*="justify-content:space-between"]');
    if(programmeHeader){
      programmeHeader.style.marginBottom = '8px';
      programmeHeader.querySelector('h2')?.style && (programmeHeader.querySelector('h2').style.fontSize = '13px');
      const intro = programmeHeader.querySelector('p');
      if(intro) intro.style.display = 'none';
    }
    removeSupportChangeIdea();
    installApercuSearch();
  }

  function hideAdminOnlyControls(){
    const sensitiveText = [
      'export github',
      'remettre a zero',
      'remettre compteurs',
      'effacer historique',
      'effacer les historiques',
      'vider historique',
      'vider journal',
      'initialisation officielle',
      'initialiser',
      'restaurer',
      'supprimer',
      'modifier',
      'ajouter medecin',
      'ajouter un medecin',
      'nouveau rdv',
      'ajouter rdv',
      'ajouter rendez',
      'ajouter patient'
    ];
    const sensitiveOnclick = [
      'exportofficialgithubdata',
      'resetallstatcounters',
      'resetmedicationstats',
      'clearallhistory',
      'clearbiologie',
      'clearhematologie',
      'clearprogramme',
      'clearauditlog',
      'delete',
      'supprimer',
      'editrdv',
      'openconsultationrdvmodal',
      'showrdvmodal',
      'addmedecin',
      'deletemed',
      'openpatientmodal',
      'showaddpatientmodal',
      'addpatientrow',
      'clearday',
      'chimioproofficialreset'
    ];
    document.querySelectorAll('button,label,a').forEach(el => {
      if(isPharmacienUser() && el.closest('#page-pharmacie')) return;
      const text = norm(el.textContent || '');
      const onclick = norm(el.getAttribute('onclick') || '');
      const title = norm(el.getAttribute('title') || '');
      const isSensitive = sensitiveText.some(pattern => text.includes(pattern) || title.includes(pattern)) || sensitiveOnclick.some(pattern => onclick.includes(pattern));
      const isAllowedClinical = text.includes('imprimer') || text.includes('bon de sang') || text.includes('traiter') || text.includes('transfuse') || text.includes('apercu') || text.includes('synchroniser');
      if(isSensitive && !isAllowedClinical) el.style.display = 'none';
    });
    document.querySelectorAll('#official-github-data-btn,#official-github-data-dashboard,#official-github-data-pharma,#official-github-admin-tools,#programme-template-btn,#patients-add-final').forEach(el => el.remove());
  }

  function removeSupportChangeIdea(){
    if(removeSupportChangeIdea.busy) return;
    removeSupportChangeIdea.busy = true;
    document.getElementById('support-change-idea')?.remove();
    const support = document.getElementById('page-support');
    if(!support){
      removeSupportChangeIdea.busy = false;
      return;
    }
    Array.from(support.querySelectorAll('.card, .card-body, [style*="border"], [style*="background"]')).forEach(block => {
      const text = (block.textContent || '').toLowerCase();
      if(
        text.includes('changer un medicament sur l') ||
        text.includes('changer un médicament sur l') ||
        text.includes('introduire un nouveau medicament') ||
        text.includes('introduire un nouveau médicament') ||
        text.includes('creez un protocole personnalise') ||
        text.includes('créez un protocole personnalisé')
      ){
        block.remove();
      }
    });
    removeSupportChangeIdea.busy = false;
  }

  function installSupportCleanupWatcher(){
    const support = document.getElementById('page-support');
    if(!support || support.dataset.supportCleanupWatcher === '1') return;
    support.dataset.supportCleanupWatcher = '1';
    const observer = new MutationObserver(() => removeSupportChangeIdea());
    observer.observe(support, { childList:true, subtree:true });
    let ticks = 0;
    const timer = setInterval(() => {
      removeSupportChangeIdea();
      ticks += 1;
      if(ticks >= 20) clearInterval(timer);
    }, 250);
  }

  const nativeRenderSupport = window.renderSupport;
  if(typeof nativeRenderSupport === 'function'){
    window.renderSupport = function(){
      const out = nativeRenderSupport.apply(this, arguments);
      removeSupportChangeIdea();
      setTimeout(removeSupportChangeIdea, 50);
      return out;
    };
  }

  const nativeShowPage = window.showPage;
  window.showPage = function(id, btn){
    const out = typeof nativeShowPage === 'function' ? nativeShowPage.apply(this, arguments) : undefined;
    if(id === 'stats') setTimeout(() => { cleanupLoginAndButtons(); renderStatsFinal(); }, 20);
    if(id === 'patients') setTimeout(() => { cleanupLoginAndButtons(); renderPatientsListFinal(); }, 20);
    if(id === 'medecins') setTimeout(cleanupLoginAndButtons, 60);
    if(id === 'apercu') setTimeout(installApercuSearch, 20);
    if(id === 'suivi') setTimeout(() => { renderSuiviFinal(); cleanupLoginAndButtons(); }, 80);
    if(id === 'biologie') setTimeout(() => { window.renderBiologie?.(); normalizeBiologiePatientOptions(); cleanupLoginAndButtons(); }, 80);
    if(id === 'hematologie') setTimeout(() => { window.renderHematologie?.(); cleanupLoginAndButtons(); }, 50);
    if(id === 'transfusion') setTimeout(() => { window.renderTransfusion?.(); cleanupLoginAndButtons(); }, 50);
    if(id === 'rdvconsultation') setTimeout(() => { window.renderRdvConsultation?.(); cleanupLoginAndButtons(); }, 50);
    if(id === 'maintenance') setTimeout(() => { window.renderMaintenance?.(); cleanupLoginAndButtons(); }, 50);
    if(id === 'protocole') setTimeout(bindRestoredProtocolUnlock, 20);
    if(id === 'programme') setTimeout(() => { renderConsultationProgrammePanel(); cleanupLoginAndButtons(); }, 20);
    if(id === 'preparation') setTimeout(ensurePreparationPrintReady, 80);
    if(id === 'pharmacie') setTimeout(lockPharmacyStockControls, 80);
    if(id === 'dashboard') setTimeout(() => { window.renderDashboard?.(); cleanupLoginAndButtons(); }, 20);
    if(id === 'support') {
      setTimeout(cleanupLoginAndButtons, 20);
      setTimeout(removeSupportChangeIdea, 120);
      setTimeout(installSupportCleanupWatcher, 140);
    }
    return out;
  };

  const nativeLogin = window.handleLogin;
  window.handleLogin = function(event){
    const out = typeof nativeLogin === 'function' ? nativeLogin.apply(this, arguments) : false;
    Promise.resolve(out).then(() => {
      setTimeout(() => {
        if(!localStorage.getItem('chncak_currentUser')) return;
        const btn = document.querySelector(".tab-btn[onclick*=\"dashboard\"]");
        if(typeof showPage === 'function') showPage('dashboard', btn);
      }, 80);
    });
    return out;
  };

  const nativeSaveRdvAndConfirm = window.saveRdvAndConfirm;
  window.saveRdvAndConfirm = function(){
    const last = readJson(LAST_PROTOCOL_PATIENT_KEY, {});
    const rdvVal = document.getElementById('date-rdv')?.value || val(last.dateRdv);
    if(rdvVal){
      const list = readJson(STORAGE.rdv, []);
      const currentDossier = document.getElementById('dossier')?.value || val(last.dossier);
      const existingSameDay = list.filter(r => r.dateRdv === rdvVal && (!currentDossier || r.dossier !== currentDossier));
      if(existingSameDay.length >= 2 && !confirm('Attention : il y a deja 2 nouveaux rendez-vous ce jour-la. Continuer quand meme ?')) return;
    }
    const formHasPatient = !!(document.getElementById('prenom')?.value || document.getElementById('nom')?.value);
    if(!formHasPatient && last.prenom && last.nom && rdvVal){
      const list = readJson(STORAGE.rdv, []);
      const entry = {
        ...last,
        id: Date.now(),
        dateRdv: rdvVal,
        proto: val(last.protocole, last.proto),
        status: 'planifie',
        statut: 'Planifie',
        createdAt: new Date().toISOString()
      };
      const key = patientTreatmentKey(entry);
      const idx = list.findIndex(r => patientTreatmentKey(r) === key && r.dateRdv === rdvVal);
      if(idx >= 0) list[idx] = {...list[idx], ...entry, id:list[idx].id};
      else list.push(entry);
      list.sort((a,b) => String(a.dateRdv || '').localeCompare(String(b.dateRdv || '')));
      writeJson(STORAGE.rdv, dedupeRdv(list));
      window.renderRdvList?.();
      showToastSafe('RDV enregistre pour le dernier patient sauvegarde.', 'success');
      return;
    }
    return typeof nativeSaveRdvAndConfirm === 'function' ? nativeSaveRdvAndConfirm.apply(this, arguments) : undefined;
  };

  const nativeValidateStockFromRdv = window.validateStockFromRdv;
  window.validateStockFromRdv = function(id){
    const list = readJson(STORAGE.rdv, []);
    const rdv = list.find(r => String(r.id) === String(id));
    const patient = rdv ? readJson(STORAGE.patients, []).find(p => (p.dossier && p.dossier === rdv.dossier) || norm(patientName(p)) === norm(patientName(rdv))) || rdv : null;
    if(!rdv || !patient) return alert('Rendez-vous introuvable.');
    if(norm(val(rdv.status, rdv.statut)).includes('traite') || rdv.validatedAt) return alert('Patient deja traite.');
    if(patient && !hasPharmaValidation(patient, rdv)){
      alert('Validation pharmacien obligatoire avant de traiter ce rendez-vous.');
      if(typeof showPage === 'function') showPage('preparation', document.querySelector(".tab-btn[onclick*=\"preparation\"]"));
      setTimeout(() => { loadEntryIntoForm({...patient, ...rdv}); ensurePreparationPrintReady(); }, 150);
      return;
    }
    const bioProblems = patient ? bioDateWarnings(patient, rdv) : [];
    if(bioProblems.length){
      alert(bioProblems.join('\n'));
      if(typeof showPage === 'function') showPage('biologie', document.querySelector(".tab-btn[onclick*=\"biologie\"]"));
      return;
    }
    const nextRdv = patient ? ensureNextRdvAfterTreatment(patient, rdv) : null;
    if(patient && !nextRdv) return;
    if(!confirm(`Marquer traite et deduire le stock pour :\n${patientName(patient)} - ${val(rdv.proto, patient.proto, patient.protocole)} ?`)) return;
    const stock = deductStockForPatient({...patient, protoId:val(patient.protoId, rdv.protoId), proto:val(patient.proto, rdv.proto), carboDose:val(patient.carboDose, rdv.carboDose), clairance:val(patient.clairance, rdv.clairance), auc:val(patient.auc, rdv.auc)}, 'RDV traite', rdv);
    const updatedList = readJson(STORAGE.rdv, list);
    const idx = updatedList.findIndex(r => String(r.id) === String(id));
    if(idx >= 0){
      updatedList[idx] = {...updatedList[idx], status:'traite', statut:'Traite', validatedAt:new Date().toISOString(), stockValide:true, stockWarnings:stock.warnings, stockDetails:stock.details};
      writeJson(STORAGE.rdv, updatedList);
      logAudit('Patient traite', patientName(patient), `RDV ${val(rdv.dateRdv, '-')}, protocole ${val(rdv.proto, patient.proto, patient.protocole, '-')}, stock deduit: ${stock.updated}`);
    }
    setTimeout(() => {
      window.renderRdvList?.();
      window.drawRdvRows?.();
      window.renderDashboard?.();
      window.renderPharmacie?.();
      window.renderStats?.();
      if(document.getElementById('page-preparation')?.classList.contains('active')) ensurePreparationPrintReady();
      if(document.getElementById('page-biologie')?.classList.contains('active')) window.renderBiologie?.();
    }, 120);
    alert(`Patient traite. Prochain RDV: ${nextRdv.dateRdv.split('-').reverse().join('/')}. Stock deduit pour ${stock.updated} medicament(s).${stock.warnings.length ? '\n\nAvertissements:\n' + stock.warnings.join('\n') : ''}`);
    return stock;
  };

  window.unlockCodeGratuiteManual = function(){
    requireAdminAction('modifier manuellement le code gratuite', () => {
      const input = document.getElementById('codegratuite');
      if(!input) return;
      input.dataset.manual = '1';
      input.readOnly = false;
      input.focus();
      showToastSafe('Champ code gratuite debloque pour reprise d un ancien code.', 'info');
    });
  };
  window.unlockHematologieCodeGratuiteManual = function(){
    requireAdminAction('modifier manuellement le code gratuite hematologie', () => {
      const input = document.getElementById('hema-code');
      if(!input) return;
      input.dataset.manual = '1';
      input.readOnly = false;
      input.focus();
      showToastSafe('Code hematologie debloque pour reprise d un ancien code.', 'info');
    });
  };
  const nativeGenCodeGratuite = window.genCodeGratuite;
  if(typeof nativeGenCodeGratuite === 'function'){
    window.genCodeGratuite = function(){
      const input = document.getElementById('codegratuite');
      if(input?.dataset.manual === '1') return;
      return setProtocolAutoCode(false);
    };
  }
  window.generateHematologieCodeGratuite = function(){
    return setHematologieAutoCode(false);
  };

  function updateLiveClocks(){
    const now = new Date();
    const timeText = now.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
    const dateText = now.toLocaleDateString('fr-FR', {weekday:'long', day:'2-digit', month:'long', year:'numeric'});
    const dashClock = document.getElementById('dashboard-live-clock');
    const loginClock = document.getElementById('login-live-clock');
    if(dashClock){
      dashClock.textContent = timeText;
      const em = dashClock.parentElement?.querySelector('em');
      if(em) em.textContent = dateText;
    }
    if(loginClock){
      loginClock.textContent = timeText;
      const em = loginClock.parentElement?.querySelector('em');
      if(em) em.textContent = dateText;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    normalizeAllProtocols();
    applyOfficialSiteData();
    ensureProtocolCatalogCompleteness();
    document.body.classList.toggle('admin-session', isAdminUser());
    document.body.classList.toggle('pharmacien-session', isPharmacienUser());
    cleanMedecinsFinal();
    setProtocolAutoCode(false);
    if(typeof renderProtos === 'function') renderProtos();
    cleanupLoginAndButtons();
    ensurePreparationPrintReady();
    installSupportCleanupWatcher();
    setInterval(updateLiveClocks, 30000);
    const style = document.createElement('style');
    style.textContent = `
      .dashboard-photo-btn{display:none!important}
      .page{max-width:1580px}
      body:not(.admin-session) .tab-btn[onclick*="maintenance"],
      body:not(.admin-session) #page-maintenance,
      body:not(.admin-session) .data-tools-btn,
      body:not(.admin-session) button[onclick*="resetAllStatCounters"],
      body:not(.admin-session) button[onclick*="resetMedicationStats"],
      body:not(.admin-session) button[onclick*="clearAllHistory"],
      body:not(.admin-session) button[onclick*="clearClinicalModuleData"],
      body:not(.admin-session) button[onclick*="setCodeGratuiteStart"],
      body:not(.admin-session) button[onclick*="exportOfficialGitHubData"]{display:none!important}
      #page-apercu > div,#page-preparation > div,#page-support > div,#page-stats > div,#page-programme > div[style*="max-width"],#page-patients > div,#patients-rdv-list,#page-rdv > div{max-width:1460px!important}
      body:not(.pharmacien-session) #page-pharmacie button[onclick*="saveCatalog"],
      body:not(.pharmacien-session) #page-pharmacie button[onclick*="scrollToCatalog"],
      body:not(.pharmacien-session) #page-pharmacie button[onclick*="addMissingDrugToCatalog"]{display:none!important}
      .official-github-mini{width:auto!important;margin:6px 0 8px!important;padding:4px 8px!important;font-size:10px!important;line-height:1.1!important;border-radius:6px!important;box-shadow:none!important;display:inline-flex!important;align-items:center!important;gap:4px!important}
      .hematologie-shell{max-width:1460px;margin:0 auto}
      .hematologie-grid{display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:10px}
      .hematologie-wide{grid-column:span 2}
      .hematologie-sortie-grid{display:grid;grid-template-columns:minmax(190px,1.4fr) minmax(150px,1fr) repeat(4,minmax(120px,.8fr));gap:10px;align-items:end}
      .hematologie-validate{width:auto!important;margin-top:14px;padding:11px 18px!important;background:#0B5E3C!important}
      .hematologie-table{min-width:980px}
      .prep-rdv-table{min-width:780px}
      .transfusion-shell,.maintenance-shell{max-width:1460px;margin:0 auto}
      .transfusion-table{min-width:1120px}
      .transfusion-table input,.transfusion-table select{width:100%;min-width:70px;box-sizing:border-box;border:1px solid #ccd8e6;border-radius:6px;padding:6px 7px;font-size:12px;background:#fff}
      .transfusion-actions{display:flex;gap:6px;align-items:center;white-space:nowrap}
      .transfusion-actions button:disabled{opacity:.45;cursor:not-allowed;filter:grayscale(.2)}
      .maintenance-grid{display:grid;grid-template-columns:repeat(3,minmax(220px,1fr));gap:12px}
      .maintenance-tile{border:1px solid #dbe5f2;border-radius:8px;background:#fff;padding:14px;box-shadow:0 8px 18px rgba(10,61,122,.06);display:flex;flex-direction:column;gap:8px;min-height:150px}
      .maintenance-tile h3{margin:0;color:#17324d;font-size:16px}.maintenance-tile p{margin:0;color:#607080;font-size:12px;line-height:1.45;flex:1}
      .maintenance-upload{display:inline-flex!important;align-items:center;justify-content:center;cursor:pointer}
      .audit-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-left:auto}
      .audit-actions input{min-width:260px;border:1px solid #ccd8e6;border-radius:6px;padding:7px 9px;font-size:12px;background:#fff}
      .audit-table{min-width:980px}.audit-table td{vertical-align:top}
      .signup-modal{position:fixed;inset:0;z-index:100001;display:flex;align-items:center;justify-content:center;font-family:var(--font,Arial,sans-serif)}
      .signup-card{width:min(860px,calc(100vw - 28px));max-height:88vh;overflow:auto;padding:18px 20px!important}
      .signup-card h3{font-size:18px!important;margin-bottom:5px!important}.signup-card p{font-size:12px!important;line-height:1.35!important;margin-bottom:10px!important}
      .signup-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
      .signup-grid label{display:flex;flex-direction:column;gap:4px;font-size:10.5px;font-weight:800;color:#17324d;line-height:1.15}
      .signup-grid input,.signup-grid select{border:1px solid #b8c7d9;border-radius:6px;padding:7px 8px;font-size:12px!important;line-height:1.2;letter-spacing:0!important;text-align:left!important;min-height:34px;box-sizing:border-box}
      .signup-wide{grid-column:1/-1}
      @media (max-width:900px){.hematologie-grid,.hematologie-sortie-grid{grid-template-columns:1fr 1fr}.hematologie-wide{grid-column:1/-1}}
      @media (max-width:900px){.maintenance-grid{grid-template-columns:1fr 1fr}}
      @media (max-width:580px){.hematologie-grid,.hematologie-sortie-grid,.maintenance-grid,.signup-grid{grid-template-columns:1fr}}
      .dash-card{border-left:3px solid var(--blue);box-shadow:0 8px 20px rgba(10,61,122,.08)}
      .dash-final{display:flex;flex-direction:column;gap:14px}
      .dash-final-hero{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(280px,.8fr);gap:16px;align-items:stretch;background:#fff;border:1px solid #dbe5f2;border-radius:8px;padding:18px;box-shadow:0 10px 24px rgba(10,61,122,.08)}
      .dash-final-title{display:flex;gap:18px;align-items:center}
      .dash-final-title img{width:78px;height:78px;object-fit:contain;border:1px solid #dbe5f2;border-radius:8px;padding:6px;background:#f8fbff}
      .dash-final-title span{display:block;font-size:12px;color:#0A3D7A;font-weight:700;text-transform:uppercase}
      .dash-final-title h2{margin:3px 0;font-size:30px;color:#17324d;letter-spacing:0}
      .dash-final-title p{margin:0;color:#607080;font-size:14px;line-height:1.42;max-width:760px}
      .dash-final-photo{min-height:150px;border-radius:8px;overflow:hidden;background:#eef4fd;border:1px solid #dbe5f2;position:relative}
      .dash-final-photo img{width:100%;height:100%;min-height:150px;object-fit:cover;display:block}
      .dash-final-photo,.leader-photo{cursor:default}
      .dash-final-photo:hover:after,.leader-photo:hover:after{content:"";position:absolute;inset:0;border:2px solid rgba(10,61,122,.18);border-radius:inherit;pointer-events:none}
      .dash-final-grid{display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:10px}
      .dash-final-kpi{background:#fff;border:1px solid #dbe5f2;border-radius:8px;padding:12px;box-shadow:0 8px 18px rgba(10,61,122,.06)}
      .dash-final-kpi span{display:block;font-size:11px;color:#607080;text-transform:uppercase;font-weight:700}
      .dash-final-kpi strong{display:block;font-size:25px;color:#0A3D7A;margin-top:5px}
      .dash-final-kpi em{display:block;font-size:11px;color:#607080;font-style:normal;margin-top:3px}
      .dash-final-kpi.warn strong{color:#C0392B}
      .dash-final-main{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(260px,.8fr);gap:12px}
      .dash-final-side{display:flex;flex-direction:column;gap:12px}
      .dash-final-resp{background:#f8fbff;border:1px solid #dbe5f2;border-radius:8px;padding:10px 12px;font-size:12px;color:#405064}
      .stats-final-note{background:#eef4fd;border:1px solid #c8d8ef;color:#0A3D7A;border-radius:8px;padding:10px 12px;font-size:12px;margin:10px 0}
      .stats-bar-row{display:grid;grid-template-columns:minmax(120px,1fr) 3fr 42px;gap:10px;align-items:center;margin:8px 0;font-size:12px}
      .stats-bar-row div{height:12px;background:#eef2f6;border-radius:4px;overflow:hidden}
      .stats-bar-row i{display:block;height:100%;background:#0A3D7A}
      #page-medecins .enhance-panel[data-enhance="medecins"]{display:none!important}
      #page-stats button[onclick="clearAllHistory()"]{display:none!important}
      #page-programme > div[style*="max-width"] > div[style*="justify-content:space-between"]{margin-bottom:6px!important;padding:6px 0!important}
      #page-programme > div[style*="max-width"] > div[style*="justify-content:space-between"] p{display:none!important}
      #page-programme > div[style*="max-width"] > div[style*="justify-content:space-between"] h2{font-size:13px!important}
      .dark-toggle{right:16px!important;bottom:76px!important}
      .cloud-sync-panel{position:fixed;right:12px;bottom:12px;z-index:9998;font-family:var(--font);color:#17324d}
      #cloud-sync-toggle{background:#0A3D7A;color:#fff;border:none;border-radius:20px;padding:8px 14px;font-size:12px;font-weight:700;box-shadow:0 8px 20px rgba(10,61,122,.22);cursor:pointer}
      .cloud-sync-panel.cloud-connected #cloud-sync-toggle{background:#0B5E3C}
      #cloud-sync-body{display:none;width:280px;background:#fff;border:1px solid #dbe5f2;border-radius:8px;box-shadow:0 14px 34px rgba(10,61,122,.18);padding:12px;margin-bottom:8px}
      .cloud-sync-panel.open #cloud-sync-body{display:block}
      #cloud-sync-status{font-size:12px;line-height:1.35;background:#f8fbff;border:1px solid #dbe5f2;border-radius:6px;padding:8px;margin-bottom:8px}
      #cloud-sync-body input{width:100%;box-sizing:border-box;margin:4px 0;padding:8px;border:1px solid #ccd8e6;border-radius:6px;font-size:12px}
      .cloud-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}
      .cloud-actions button{border:1px solid #ccd8e6;background:#f8fbff;color:#0A3D7A;border-radius:6px;padding:7px 8px;font-size:11px;font-weight:700;cursor:pointer}
      .cloud-actions button:first-child,.cloud-actions button:nth-child(2){background:#0A3D7A;color:#fff;border-color:#0A3D7A}
      .cloud-actions button.danger{grid-column:1/-1;background:#FDEAEA;color:#C0392B;border-color:#F5AAAA}
      #logout-btn-forced{top:10px!important;right:10px!important;padding:8px 12px!important;font-size:12px!important}
      .proto-editor-final input,.proto-editor-final select{width:100%;box-sizing:border-box;border:1px solid #ccd8e6;border-radius:6px;padding:8px 9px;font-size:12px;background:#fff}
      .proto-editor-final label{display:flex;flex-direction:column;gap:5px;font-size:12px;font-weight:700;color:#17324d}
      .proto-editor-grid{display:grid;grid-template-columns:1.2fr 1.2fr 140px 1fr;gap:10px}
      .proto-editor-grid label:nth-child(4),.proto-editor-grid label:nth-child(5),.proto-editor-grid label:nth-child(6),.proto-editor-grid label:nth-child(7){grid-column:span 2}
      .proto-drug-grid{display:flex;flex-direction:column;gap:8px;margin-top:10px}
      .proto-drug-line{display:grid;grid-template-columns:70px minmax(220px,1.5fr) 120px 115px 120px 130px;gap:8px;align-items:center;background:#f8fbff;border:1px solid #dbe5f2;border-radius:8px;padding:9px}
      .proto-drug-line input,.proto-drug-line select{min-width:0}
      .proto-drug-line [data-field="remark"]{grid-column:span 2}
      .proto-drug-line [data-field="freq"],.proto-drug-line [data-field="limit"]{min-width:0}
      .unit-input{display:flex;align-items:center;gap:4px}
      .unit-input span{font-size:10px;color:#607080}
      .light-check{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:center;gap:5px;font-size:11px!important;font-weight:800!important;color:#17324d!important;white-space:normal!important;line-height:1.1}
      .light-check input{width:auto!important}
      .proto-remove{height:32px;border:1px solid #f0b5b5;background:#fdeaea;color:#a33131;border-radius:6px;cursor:pointer;font-weight:800}
      .proto-card{position:relative}
      .proto-card-actions{display:flex;gap:5px;justify-content:flex-end;margin-top:7px;opacity:.55;transition:opacity .16s ease}
      .proto-card:hover .proto-card-actions{opacity:1}
      .proto-card-actions button{border:1px solid #c9d8eb;background:#f8fbff;color:#0A3D7A;border-radius:5px;padding:4px 7px;font-size:10px;font-weight:800;cursor:pointer}
      .proto-card-actions button.danger{border-color:#f1b0b0;background:#fdeaea;color:#9d1c1c}
      #secure-code-modal{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;font-family:var(--font,Arial,sans-serif)}
      .secure-code-backdrop{position:absolute;inset:0;background:rgba(10,20,30,.46);backdrop-filter:blur(2px)}
      .secure-code-card{position:relative;width:min(360px,calc(100vw - 32px));background:#fff;border-radius:8px;box-shadow:0 24px 60px rgba(0,0,0,.28);padding:20px;border:1px solid #dbe5f2}
      .secure-code-card h3{margin:0 0 6px;color:#17324d;font-size:18px}
      .secure-code-card p{margin:0 0 14px;color:#5d6d7e;font-size:13px;line-height:1.35}
      .secure-code-card input{width:100%;box-sizing:border-box;border:1px solid #b8c7d9;border-radius:7px;padding:11px 12px;font-size:22px;text-align:center;letter-spacing:6px}
      .secure-code-error{min-height:18px;color:#b42318;font-size:12px;margin-top:8px}
      .secure-code-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}
      .secure-code-actions button{border:1px solid #ccd8e6;border-radius:6px;padding:9px 14px;font-weight:700;cursor:pointer;background:#f8fbff;color:#17324d}
      .secure-code-actions button:last-child{background:#0B5E3C;color:#fff;border-color:#0B5E3C}
      .maintenance-code-box{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;border:1px solid #c9d8eb;background:#f8fbff;border-radius:8px;padding:10px 12px;margin:0 0 14px}
      .maintenance-code-box span{display:block;color:#607080;font-size:11px;margin-top:3px}.maintenance-code-box strong{letter-spacing:4px;color:#17324d}
      .transfusion-card{width:min(1120px,calc(100vw - 28px));max-height:92vh;overflow:auto}
      .transfusion-search{width:100%!important;text-align:left!important;letter-spacing:0!important;font-size:13px!important;margin-bottom:10px}
      .transfusion-patient-list{max-height:190px;overflow:auto;border:1px solid #dbe5f2;border-radius:8px;margin-bottom:12px}
      .transfusion-patient-list tr{cursor:pointer}
      .transfusion-form-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:10px}
      .transfusion-form-grid label{font-size:11px;color:#44556b;font-weight:800}
      .transfusion-form-grid input,.transfusion-form-grid select{width:100%;box-sizing:border-box;border:1px solid #b8c7d9;border-radius:7px;padding:8px 9px;font-size:12px;margin-top:4px;letter-spacing:0;text-align:left}
      .transfusion-form-grid .signup-wide{grid-column:span 2}
      .consult-filter-bar{display:grid;grid-template-columns:repeat(2,minmax(180px,1fr));gap:10px;margin-bottom:12px;align-items:end}
      .consult-filter-bar label{font-size:11px;color:#44556b;font-weight:800}
      .consult-filter-bar input,.consult-filter-bar select{width:100%;box-sizing:border-box;border:1px solid #b8c7d9;border-radius:7px;padding:8px 9px;font-size:12px;margin-top:4px;background:white}
      .consult-form-grid select{width:100%;box-sizing:border-box;border:1px solid #b8c7d9;border-radius:7px;padding:8px 9px;font-size:12px;margin-top:4px;background:white}
      .field-hint{font-weight:700;color:#7a8796;font-size:10px;margin-left:5px;text-transform:none}
      .consult-card{width:min(760px,calc(100vw - 28px));max-height:88vh;overflow:auto}
      .consult-dash-doctor{border:1px solid #dbe5f2;border-radius:8px;padding:10px 12px;margin-bottom:8px;background:#f8fbff}
      .consult-dash-doctor h3{display:flex;justify-content:space-between;gap:8px;align-items:center;margin:0 0 8px;color:#17324d;font-size:14px}
      .consult-dash-doctor h3 span{background:#0A3D7A;color:#fff;border-radius:999px;padding:2px 8px;font-size:11px}
      .consult-dash-doctor small{display:block;color:#607080;font-size:10px;margin-top:2px}
      .consultation-dashboard-card{margin-top:12px}
      body.infirmier-session .maintenance-shell,body.infirmier-session #page-maintenance,body.infirmier-session .official-github-mini[onclick*="exportOfficialGitHubData"],body.infirmier-session button[onclick*="setCodeGratuiteStart"]{display:none!important}
      .tab-btn,.btn-primary,.btn-secondary,.btn-med-add,.prog-day-btn,#patients-add-final,#programme-template-btn{border:1.6px solid #12395b!important;box-shadow:0 2px 0 rgba(8,31,55,.22),0 8px 16px rgba(8,31,55,.08);transition:transform .18s ease,box-shadow .18s ease,filter .18s ease}
      .tab-btn:hover,.btn-primary:hover,.btn-secondary:hover,.btn-med-add:hover,.prog-day-btn:hover,#patients-add-final:hover,#programme-template-btn:hover{transform:translateY(-1px);box-shadow:0 3px 0 rgba(8,31,55,.28),0 12px 22px rgba(8,31,55,.13);filter:saturate(1.08)}
      .dashboard-shell.dash-final{animation:dashFadeIn .35s ease both}
      @keyframes dashFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
      .dash-final-hero{background:linear-gradient(135deg,#ffffff 0%,#f6fbff 52%,#eef8f2 100%);position:relative;overflow:hidden}
      .dash-final-hero:before{content:"";position:absolute;inset:0;border-top:3px solid #0B5E3C;pointer-events:none}
      .dash-final-title img{width:96px!important;height:96px!important;box-shadow:0 10px 22px rgba(10,61,122,.14)}
      .dash-final-title h2{font-size:34px!important}
      .dash-final-kpi{position:relative;overflow:hidden;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
      .dash-final-kpi:after{content:"";position:absolute;left:12px;right:12px;bottom:0;height:3px;background:linear-gradient(90deg,#0A3D7A,#0B5E3C);border-radius:3px 3px 0 0}
      .dash-final-kpi:hover{transform:translateY(-3px);box-shadow:0 14px 28px rgba(10,61,122,.13);border-color:#9db6d3}
      .dash-final-kpi strong{animation:dashCountPop .42s ease both}
      @keyframes dashCountPop{0%{transform:scale(.94);opacity:.45}100%{transform:scale(1);opacity:1}}
      .dash-table tbody tr{transition:background .18s ease,transform .18s ease}
      .dash-table tbody tr:hover{background:#eef8f2!important;transform:translateX(2px)}
      .prog-input{width:100%;box-sizing:border-box;border:1px solid #c7d4e4;border-radius:6px;padding:7px 8px;font-size:12px;background:#fff}
      .prog-input:focus{outline:2px solid rgba(10,61,122,.16);border-color:#0A3D7A}
      .prog-row-done{background:#eef8f2!important}
      .prog-delete-btn{border:1px solid #b83232;background:#fdeaea;color:#9d1c1c;border-radius:6px;padding:5px 8px;cursor:pointer;font-weight:800}
      .dash-clock-lead{display:grid;grid-template-columns:260px minmax(0,1fr);gap:12px;align-items:stretch}
      .dash-clock-card{background:linear-gradient(135deg,#0A3D7A,#0B5E3C);color:#fff;border-radius:8px;padding:18px 20px;box-shadow:0 14px 30px rgba(10,61,122,.18);border:1px solid #072946}
      .dash-clock-card span,.login-clock-card span{display:block;font-size:11px;text-transform:uppercase;font-weight:800;opacity:.82;letter-spacing:.04em}
      .dash-clock-card strong,.login-clock-card strong{display:block;font-size:44px;line-height:1;font-weight:900;margin:7px 0 5px;font-family:Arial,Helvetica,sans-serif}
      .dash-clock-card em,.login-clock-card em{display:block;font-style:normal;font-size:12px;line-height:1.25;opacity:.9;text-transform:capitalize}
      .dash-leadership{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:8px}
      .dash-leadership>div{background:#fff;border:1px solid #c9d8eb;border-radius:8px;padding:10px 12px;box-shadow:0 8px 18px rgba(10,61,122,.07);display:flex;gap:10px;align-items:center;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
      .dash-leadership>div:hover{transform:translateY(-2px);box-shadow:0 14px 26px rgba(10,61,122,.13);border-color:#0A3D7A}
      .dash-leadership .lead-director{grid-row:span 2;background:#f8fbff;border-left:4px solid #0A3D7A}
      .leader-photo{width:54px;height:54px;border-radius:8px;position:relative;flex:0 0 54px;background:linear-gradient(135deg,#eef4fd,#e9f7ef);border:1px solid #b9cbe3;display:flex;align-items:center;justify-content:center;overflow:hidden;color:#0A3D7A;font-weight:900;font-size:15px}
      .leader-photo img{width:100%;height:100%;object-fit:cover;display:block}
      .dash-leadership span{display:block;font-size:10px;color:#607080;text-transform:uppercase;font-weight:800;line-height:1.25}
      .dash-leadership strong{display:block;color:#17324d;font-size:13px;margin-top:5px;line-height:1.25}
      .dash-leadership em{display:block;color:#0B5E3C;font-size:11px;font-style:normal;margin-top:3px}
      .dash-online-card{display:flex;justify-content:space-between;gap:12px;align-items:center;background:#fff;border:1px solid #c9d8eb;border-left:4px solid #0B5E3C;border-radius:8px;padding:10px 12px;box-shadow:0 8px 18px rgba(10,61,122,.06)}
      .dash-online-card span{display:block;font-size:10px;color:#607080;text-transform:uppercase;font-weight:800}.dash-online-card strong{display:block;color:#17324d;font-size:14px;margin-top:3px}.dash-online-card em{font-size:11px;color:#607080;font-style:normal;text-align:right}
      .suivi-actions-final{display:grid;grid-template-columns:repeat(3,minmax(130px,1fr));gap:8px;align-items:center;justify-content:end;min-width:min(100%,500px)}
      .suivi-actions-final button,.suivi-actions-final label{height:38px;display:flex!important;align-items:center;justify-content:center;text-align:center;width:100%!important;margin:0!important;padding:8px 12px!important;border-radius:7px!important;font-size:12px!important;font-weight:800!important;line-height:1.1;white-space:nowrap;box-sizing:border-box}
      .suivi-import-label{cursor:pointer}
      .login-clock-card{position:absolute;top:24px;right:24px;min-width:230px;background:rgba(255,255,255,.16);color:#fff;border:1px solid rgba(255,255,255,.38);border-radius:10px;padding:16px 18px;box-shadow:0 16px 38px rgba(0,0,0,.18);backdrop-filter:blur(8px);text-align:left}
      .login-clock-card strong{font-size:38px}
      @media (max-width:900px){.dash-final-hero,.dash-final-main,.proto-editor-grid{grid-template-columns:1fr}.dash-final-grid{grid-template-columns:repeat(2,1fr)}.proto-drug-line{grid-template-columns:1fr 1fr}.proto-remove{grid-column:1/-1}.transfusion-form-grid,.maintenance-code-box,.consult-filter-bar{grid-template-columns:1fr}.transfusion-form-grid .signup-wide{grid-column:auto}}
      @media (max-width:900px){.dash-clock-lead,.dash-leadership,.suivi-actions-final{grid-template-columns:1fr}.dash-leadership .lead-director{grid-row:auto}.login-clock-card{position:static;margin:0 0 12px;background:rgba(255,255,255,.18)}}
      @media print{.protocol-print-fit table:first-child,.protocol-print-fit table:first-child *{font-size:6.8px!important;line-height:1.05!important;margin-top:0!important;margin-bottom:0!important;padding-top:0!important;padding-bottom:0!important}.protocol-print-fit table:first-child img{max-height:38px!important}}
    `;
    document.head.appendChild(style);
    setTimeout(() => {
      if(document.getElementById('page-dashboard')?.classList.contains('active')) window.renderDashboard?.();
    }, 150);
  });

  window.chimioproSupportIdea = function(){};
})();
