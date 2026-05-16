/* ============================================================
   CORRECTIONS FINALES DEMANDEES - CHIMIOPRO
   Charge en dernier pour stabiliser les vues critiques.
============================================================ */
(function(){
  const CODE_ADMIN = '2026';
  const VALIDATION_EMAIL = 'onco.chn.cak@gmail.com';
  const STORAGE = {
    patients: 'chncak_patients',
    rdv: 'chncak_rdv',
    suivi: 'chncak_suivi',
    biologie: 'chncak_biologie',
    catalog: 'chncak_catalog',
    sorties: 'chncak_sorties',
    historique: 'chncak_historique',
    okchimio: 'chncak_protocols'
  };

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
    if(raw.includes('gemcitab')) return 'GEMCITABINE';
    if(raw.includes('zometa') || raw.includes('zoledron') || raw.includes('zolédron')) return 'ZOMETA';
    if(raw.includes('irinotec')) return 'IRINOTÉCAN';
    if(raw.includes('capecitab')) return 'Capécitabine per os';
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
    xeliri: 'Ontario Health/CCO - XELIRI +/- bevacizumab selon indication; validation service CHNCAK.',
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
    proto.drugs = (proto.drugs || []).map(normalizeProtocolDrug).filter(Boolean);
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
      if(input.value !== CODE_ADMIN){
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

  function isAdminUser(){
    const user = currentUser();
    return norm(user.role) === 'admin' || norm(user.username) === 'admin';
  }

  function requireAdminAction(actionLabel, onOk){
    if(!isAdminUser()){
      alert('Action reservee au compte administrateur.');
      return;
    }
    askAdminCode(actionLabel, onOk);
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
        writeJson(STORAGE.catalog, official.catalog);
        localStorage.setItem('chncak_official_catalog_version', official.version || todayIso());
        try { if(Array.isArray(window.catalog)) window.catalog = official.catalog; } catch(e) {}
        try { if(typeof catalog !== 'undefined') catalog = official.catalog; } catch(e) {}
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
    if(drug.mgm2 && surface) return Math.round(Number(drug.mgm2) * surface);
    if(drug.mgkg && poids) return Math.round(Number(drug.mgkg) * poids);
    if(drug.avastin && poids) return Math.round(15 * poids);
    return 0;
  }

  function calcDrugFlacons(name, dose){
    if(typeof calcFlacons === 'function') return calcFlacons(name, dose);
    const catalog = readJson(STORAGE.catalog, []);
    const item = catalog.find(d => norm(d.name) === norm(name));
    const sizes = (item?.dosages || item?.flacons || []).map(Number).filter(Boolean).sort((a,b) => b-a);
    if(!item || !sizes.length || !dose) return null;
    let remaining = dose, totalMg = 0, flacons = [];
    while(remaining > 0){
      const size = sizes.find(s => s <= remaining) || sizes[sizes.length - 1];
      flacons.push(size);
      totalMg += size;
      remaining -= size;
    }
    return {drug:item, nbFlacons:flacons.length, flacons, totalMg, reliquat:Math.max(0, Math.round((totalMg - dose) * 10) / 10), stock:Number(item.qteStock ?? item.stock ?? 0)};
  }

  function deductStockForPatient(patient, sourceLabel){
    const proto = findProtocolByPatient(patient);
    if(!proto) return {updated:0, warnings:[`Protocole introuvable pour ${patientName(patient) || 'ce patient'}.`], details:[]};
    const catalog = readJson(STORAGE.catalog, []);
    let updated = 0;
    const warnings = [];
    const details = [];
    (proto.drugs || []).filter(d => !d.t && !d.oral && (d.mgm2 || d.mgkg || d.avastin || typeof d.fix === 'number')).forEach(drug => {
      const dose = doseForDrug(drug, patient);
      if(!dose){ warnings.push(`${drug.name}: dose non calculable.`); return; }
      const calc = calcDrugFlacons(drug.name, dose);
      const idx = catalog.findIndex(item => norm(item.name) === norm(drug.name));
      if(!calc || idx < 0){ warnings.push(`${drug.name}: medicament non trouve dans Pharmacie Centrale.`); return; }
      const stock = Number(catalog[idx].qteStock ?? catalog[idx].stock ?? 0);
      if(stock < calc.nbFlacons){ warnings.push(`${drug.name}: stock insuffisant (${stock} flacon(s), besoin ${calc.nbFlacons}).`); return; }
      catalog[idx].qteStock = stock - calc.nbFlacons;
      updated++;
      details.push({name: drug.name, dose, nbFlacons: calc.nbFlacons, reliquatMg: Number(calc.reliquat || 0), flacons: calc.flacons || []});
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
    return String(html || '');
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
        .landscape-copy table:first-child,.landscape-copy table:first-child *{font-size:7.8px!important;line-height:1.18!important;padding-top:0!important;padding-bottom:0!important;margin-top:0!important;margin-bottom:0!important}
        .landscape-copy table:first-child img{max-height:46px!important;width:auto!important}
        .landscape-copy th,.landscape-copy td{padding-top:5px!important;padding-bottom:5px!important}
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
    const proto = protocolsList().find(p => p.id === (typeof selId !== 'undefined' ? selId : ''));
    const get = id => document.getElementById(id)?.value || '';
    const prenom = get('prenom');
    const nom = get('nom');
    if(!prenom || !nom) return alert('Renseignez le patient avant d imprimer le bon de rendez-vous.');
    const rdvInput = get('date-rdv');
    const rdvText = rdvInput ? rdvInput.split('-').reverse().join('/') : '___/___/______';
    const protoDate = get('date-protocole');
    const dateProto = protoDate ? protoDate.split('-').reverse().join('/') : new Date().toLocaleDateString('fr-FR');
    const logo = document.querySelector('.nav-logo img')?.src || '';
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Bon de rendez-vous</title>
      <style>
        @page{size:A4 portrait;margin:12mm}
        *{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        .rdv-page{min-height:272mm;display:flex;align-items:center;justify-content:center}
        .rdv-card{width:178mm;min-height:176mm;border:2px solid #0A3D7A;border-radius:8px;padding:12mm 13mm;display:flex;flex-direction:column;gap:9mm}
        .rdv-head{display:grid;grid-template-columns:56px 1fr 56px;gap:8px;align-items:start;text-align:center}
        .rdv-head img{width:52px;height:52px;object-fit:contain}
        .ministry{font-size:10.5px;line-height:1.22}.ministry b{font-size:11px}
        .title{background:#0A3D7A;color:#fff;text-align:center;font-weight:900;letter-spacing:.08em;font-size:21px;padding:8px;border-radius:4px}
        .line{display:flex;gap:8px;align-items:flex-end;font-size:18px;line-height:1.8}
        .line span:first-child{font-weight:800;min-width:58mm;color:#17324d}.line b{flex:1;border-bottom:1.5px dotted #333;min-height:30px;padding-left:6px}
        .rdv-date{border:2px solid #0B5E3C;border-radius:8px;padding:8mm;text-align:center;background:#f3fbf7}
        .rdv-date span{display:block;font-size:14px;text-transform:uppercase;color:#0B5E3C;font-weight:800}.rdv-date strong{display:block;font-size:32px;margin-top:4px;color:#111}
        .foot{margin-top:auto;font-size:13px;line-height:1.45;color:#4b5563;text-align:center}
      </style></head><body><main class="rdv-page"><section class="rdv-card">
        <div class="rdv-head"><img src="${logo}"><div class="ministry">Republique du Senegal<br><b>Un peuple - un but - une foi</b><br>Ministere de la Sante et de l'Action Sociale<br><b>Centre Hospitalier National Cheikh Ahmadoul Khadim</b><br><b>Service d'Oncologie - Radiotherapie</b></div><img src="${logo}"></div>
        <div class="title">BON DE RENDEZ-VOUS</div>
        <div class="line"><span>Prenom et nom</span><b>${esc(`${prenom} ${nom}`.toUpperCase())}</b></div>
        <div class="line"><span>Numero dossier</span><b>${esc(val(get('dossier'), get('cubix'), '-'))}</b></div>
        <div class="line"><span>Protocole</span><b>${esc(proto?.name || '-')}</b></div>
        <div class="line"><span>Date protocole</span><b>${esc(dateProto)}</b></div>
        <div class="rdv-date"><span>Date du prochain rendez-vous</span><strong>${esc(rdvText)} a 07h30</strong></div>
        <div class="foot">Merci de venir avec les resultats de biologie demandes et de se presenter au service d'oncologie-radiotherapie.</div>
      </section></main></body></html>`;
    printHtml(html);
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
    return !!(key && readJson('chncak_pharma_validations', {})[key]);
  }

  window.validatePharmacistPreparation = function(){
    const patient = currentProtocolFormPatient();
    if(!patient.prenom || !patient.nom) return alert('Chargez ou renseignez le patient avant validation.');
    requireAdminAction('validation pharmacien', () => {
      const map = readJson('chncak_pharma_validations', {});
      map[pharmaValidationKey(patient)] = {validatedAt:new Date().toISOString(), patient:patientName(patient), dossier:patient.dossier, protoId:patient.protoId};
      writeJson('chncak_pharma_validations', map);
      showToastSafe('Validation pharmacien enregistree.', 'success');
    });
  };

  function ensurePreparationPrintReady(){
    const btn = document.getElementById('prep-print-btn');
    if(!btn) return;
    if(!document.getElementById('prep-pharma-validation-btn')){
      btn.insertAdjacentHTML('afterend', '<button id="prep-pharma-validation-btn" type="button" class="btn-primary" style="width:auto;margin-left:8px;padding:10px 14px;background:#0B5E3C" onclick="validatePharmacistPreparation()">Validation pharmacien</button>');
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
  }

  function renderStatsFinal(){
    const host = document.getElementById('stats-content') || document.getElementById('page-stats');
    if(!host) return;
    const patients = readJson(STORAGE.patients, []);
    const rdv = [...readJson(STORAGE.rdv, []), ...readJson('rdv', [])];
    const hist = [...readJson(STORAGE.historique, []), ...readJson('historique', [])];
    const sorties = [...readJson(STORAGE.sorties, []), ...readJson('chncak_stock_sorties', []), ...readJson('sorties', [])];
    const ok = [...readJson(STORAGE.okchimio, []), ...readJson('chncak_okchimio', [])];
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
    if(!Object.keys(meds).length){
      hist.forEach(h => {
        const proto = protocolsList().find(p => p.id === h.protoId || norm(p.name) === norm(h.protoName));
        (proto?.drugs || []).filter(d => !d.t && !d.oral && (d.mgm2 || d.mgkg || d.avastin || typeof d.fix === 'number')).forEach(d => {
          const med = ensureMed(d.name);
          med.seances += 1;
          med.preparations += 1;
        });
      });
    }
    const medRows = Object.entries(meds).sort((a,b) => b[1].preparations - a[1].preparations).map(([name, d]) => `
      <tr><td>${esc(name)}</td><td>${d.preparations}</td><td>${d.seances}</td><td>${Math.round(d.dose).toLocaleString('fr-FR')} mg</td><td>${Math.round(d.wasteMg).toLocaleString('fr-FR')} mg</td><td>${d.wasteFlacons}</td><td>${d.flacons}</td></tr>
    `).join('');
    const countBy = (items, fn) => items.reduce((acc, item) => {
      const key = val(fn(item), 'Non renseigne');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const miniRows = obj => Object.entries(obj).sort((a,b) => b[1] - a[1]).map(([k,v]) => `<div class="dash-line"><span>${esc(k)}</span><strong>${v}</strong></div>`).join('') || '<div class="dash-empty">Aucune donnee.</div>';
    const diagnosticProtocolRows = Object.entries([...patients, ...hist].reduce((acc, item) => {
      const diagnostic = val(item.localisation, item.diagnostic, item.indication, 'Diagnostic non renseigne');
      const protocole = protocolNameFor(item);
      const key = `${diagnostic}|||${protocole}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})).sort((a,b) => b[1] - a[1]).map(([key, count]) => {
      const [diagnostic, protocole] = key.split('|||');
      return `<tr><td>${esc(diagnostic)}</td><td>${esc(protocole)}</td><td>${count}</td></tr>`;
    }).join('');
    const maxPrep = Math.max(1, ...Object.values(meds).map(d => d.preparations));
    const chartRows = Object.entries(meds).sort((a,b) => b[1].preparations - a[1].preparations).slice(0, 10).map(([name, d]) => `<div class="stats-bar-row"><span>${esc(name)}</span><div><i style="width:${Math.max(5, Math.round(d.preparations / maxPrep * 100))}%"></i></div><strong>${d.preparations}</strong></div>`).join('');
    const preparations = sorties.length || hist.length;
    const seances = rdv.filter(r => norm(r.status || r.statut).includes('traite') || r.validatedAt).length || ok.filter(o => norm(o.statut).includes('valid')).length || hist.length;
    const totalDose = Object.values(meds).reduce((sum, item) => sum + Number(item.dose || 0), 0);
    const totalWaste = Object.values(meds).reduce((sum, item) => sum + Number(item.wasteMg || 0), 0);
    const totalFlacons = Object.values(meds).reduce((sum, item) => sum + Number(item.flacons || 0), 0);
    host.innerHTML = `
      <div class="clinical-shell stats-full">
        <div class="stats-summary-grid">
          <div class="stats-box"><h3>Patients</h3><p>${patients.length}</p></div>
          <div class="stats-box"><h3>Preparations</h3><p>${preparations}</p></div>
          <div class="stats-box"><h3>Seances chimio</h3><p>${seances}</p></div>
          <div class="stats-box"><h3>Protocoles sauvegardes</h3><p>${hist.length}</p></div>
          <div class="stats-box"><h3>Medicaments distincts</h3><p>${Object.keys(meds).length}</p></div>
          <div class="stats-box"><h3>Dose totale utilisee</h3><p>${Math.round(totalDose).toLocaleString('fr-FR')}</p><small>mg</small></div>
          <div class="stats-box"><h3>Dose totale jetee</h3><p>${Math.round(totalWaste).toLocaleString('fr-FR')}</p><small>mg</small></div>
          <div class="stats-box"><h3>Flacons utilises</h3><p>${totalFlacons}</p></div>
        </div>
        <div class="stats-final-note">Statistiques issues des preparations validees, sorties de stock, OK Chimio et anciennes sauvegardes disponibles.</div>
        <div class="card stats-section-card"><div class="card-header"><h2>Graphique medicaments</h2></div><div class="card-body">${chartRows || '<div class="dash-empty">Aucune donnee medicament.</div>'}</div></div>
        <div class="card stats-section-card"><div class="card-header"><h2>Medicaments utilises</h2></div><div class="card-body dash-table-wrap"><table class="dash-table"><thead><tr><th>Medicament</th><th>Preparations</th><th>Seances</th><th>Dose totale utilisee</th><th>Dose totale jetee</th><th>Reliquat flacons</th><th>Flacons utilises</th></tr></thead><tbody>${medRows || '<tr><td colspan="7" class="dash-empty">Aucune sortie de stock validee.</td></tr>'}</tbody></table></div></div>
        <div class="clinical-report-grid">
          <div class="card"><div class="card-header"><h2>Protocoles</h2></div><div class="card-body">${miniRows(countBy(patients, p => val(p.proto, p.protocole, p.protoName)))}</div></div>
          <div class="card"><div class="card-header"><h2>Diagnostics</h2></div><div class="card-body">${miniRows(countBy(patients, p => val(p.localisation, p.diagnostic)))}</div></div>
          <div class="card"><div class="card-header"><h2>Medecins</h2></div><div class="card-body">${miniRows(countBy(patients, p => p.medecin))}</div></div>
        </div>
        <div class="card stats-section-card"><div class="card-header"><h2>Diagnostics par protocole</h2></div><div class="card-body dash-table-wrap"><table class="dash-table"><thead><tr><th>Diagnostic</th><th>Protocole</th><th>Nombre</th></tr></thead><tbody>${diagnosticProtocolRows || '<tr><td colspan="3" class="dash-empty">Aucune donnee diagnostic/protocole.</td></tr>'}</tbody></table></div></div>
      </div>`;
  }
  window.renderStats = renderStatsFinal;

  window.printStats = function(){
    renderStatsFinal();
    const content = document.getElementById('page-stats')?.innerHTML || '';
    const logo = document.querySelector('.nav-logo img')?.src || '';
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Statistiques ChimioPro</title>
      <style>@page{size:A4;margin:9mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;font-size:9px;color:#111}.print-head{display:grid;grid-template-columns:52px 1fr 135px;gap:8px;align-items:start;border-bottom:2px solid #0A3D7A;padding-bottom:5px;margin-bottom:8px}.print-head img{width:48px;height:48px;object-fit:contain}.ministry{font-size:7px;line-height:1.08}.right{text-align:right;font-size:8px;line-height:1.2}.stats-summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:8px 0}.stats-box{border:1px solid #b7c7dd;padding:6px;border-radius:4px}.stats-box h3{font-size:8px;margin:0;color:#0A3D7A}.stats-box p{font-size:18px;margin:2px 0 0;font-weight:bold}.card{border:1px solid #d6dce5;margin-top:8px;border-radius:4px}.card-header{background:#eef4fd;padding:5px 7px}.card-header h2{font-size:10px;margin:0}.card-body{padding:6px}.dash-table{width:100%;border-collapse:collapse}.dash-table th{background:#0A3D7A;color:#fff}.dash-table th,.dash-table td{border:1px solid #cad3df;padding:3px 4px;font-size:7.5px}.clinical-report-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.stats-bar-row{display:grid;grid-template-columns:1.4fr 3fr 28px;gap:6px;align-items:center;margin:4px 0;font-size:7.5px}.stats-bar-row div{height:8px;background:#e9eef5;border-radius:2px}.stats-bar-row i{display:block;height:100%;background:#0A3D7A}.no-print,button,input,select{display:none!important}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>
    </head><body><div class="print-head"><img src="${logo}"><div class="ministry">Republique du Senegal - Un peuple, un but, une foi<br>Ministere de la Sante et de l'Action Sociale<br><b>Centre Hospitalier National Cheikh Ahmadoul Khadim - Touba</b><br><b>Service d'Oncologie-Radiotherapie</b></div><div class="right">Statistiques ChimioPro<br>${new Date().toLocaleDateString('fr-FR')}</div></div>${content}</body></html>`;
    printHtml(html);
  };

  function renderSuiviFinal(){
    if(typeof nativeRenderSuiviFinal === 'function') nativeRenderSuiviFinal();
    const table = document.querySelector('#suivi-content .suivi-table tbody');
    if(!table) return;
    const patients = readJson(STORAGE.patients, []);
    Array.from(table.querySelectorAll('tr')).forEach((row, index) => {
      const patient = patients[index];
      const cells = row.querySelectorAll('td');
      if(patient && cells[13]) cells[13].textContent = protocolNameFor(patient);
      if(patient && cells[18] && cells[13]?.textContent.trim() === '-') cells[18].innerHTML = '<span class="clinical-pill warn">Protocole absent</span>';
    });
  }

  const nativeRenderSuiviFinal = window.renderSuivi;
  window.renderSuivi = renderSuiviFinal;

  function normalizeBiologiePatientOptions(){
    const patients = readJson(STORAGE.patients, []);
    const select = document.getElementById('bio-patient-select');
    if(!select) return;
    const current = select.value;
    select.innerHTML = '<option value="">Selectionner patient</option>' + patients.map(p => {
      const code = patientShortCode(p);
      return `<option value="${esc(code)}"${current === code ? ' selected' : ''}>${esc(code || '-')} - ${esc(patientName(p) || '-')}</option>`;
    }).join('');
  }

  const nativeRenderBiologieFinal = window.renderBiologie;
  window.renderBiologie = function(){
    const out = typeof nativeRenderBiologieFinal === 'function' ? nativeRenderBiologieFinal.apply(this, arguments) : undefined;
    normalizeBiologiePatientOptions();
    return out;
  };

  window.loadBiologiePatient = function(){
    const code = document.getElementById('bio-patient-select')?.value;
    const patients = readJson(STORAGE.patients, []);
    const patient = patients.find(p => patientShortCode(p) === code || patientCode(p) === code);
    const input = document.getElementById('bio-patient');
    if(input) input.value = patient ? patientName(patient) : '';
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
        <div class="dash-final-resp">Salle chimio : <b>${esc(val(responsables.chimio, '-'))}</b> · Preparation : <b>${esc(val(responsables.preparation, '-'))}</b> · Pharmacie : <b>${esc(val(responsables.pharmacie, '-'))}</b></div>
      </div>`;
  };

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
    const stock = deductStockForPatient({...patient, protoId: val(patient.protoId, rdv.protoId), proto: val(patient.proto, rdv.proto)}, 'RDV traite');
    list[idx] = {...rdv, status:'traite', statut:'Traite', validatedAt:new Date().toISOString(), stockWarnings:stock.warnings, stockDetails:stock.details};
    writeJson(STORAGE.rdv, list);
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
    alert(`Patient traite. Stock deduit pour ${stock.updated} medicament(s).${stock.warnings.length ? '\n\nAvertissements:\n' + stock.warnings.join('\n') : ''}`);
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
      return `<tr style="${i%2?'background:white':'background:#FAFBFD'}"><td>${esc(p.dossier || '-')}</td><td><b>${esc(patientName(p))}</b><div class="dash-muted">${esc(val(p.age) ? p.age + ' ans' : '')}</div></td><td>${esc(p.tel || p.contact || '-')}</td><td><span class="pbadge b21">${esc(proto)}</span></td><td>${esc(p.localisation || p.diagnostic || '-')}</td><td>${esc(val(p.cure, '-'))}/${esc(val(p.totalCures, '-'))}</td><td>${esc(p.medecin || '-')}</td><td>${esc(p.statut || 'actif')}</td><td><button class="btn-secondary" onclick="showAddPatientModal('${esc(p.id)}')">Modifier</button></td></tr>`;
    }).join('');
    document.getElementById('patients-subtitle') && (document.getElementById('patients-subtitle').textContent = `${list.length} patient(s)`);
    el.innerHTML = `<table class="dash-table"><thead><tr><th>Dossier</th><th>Patient</th><th>Contact</th><th>Protocole</th><th>Localisation</th><th>Cure</th><th>Medecin</th><th>Statut</th><th>Actions</th></tr></thead><tbody>${rows || '<tr><td colspan="9" class="dash-empty">Aucun patient.</td></tr>'}</tbody></table>`;
  }
  window.renderPatientsList = renderPatientsListFinal;

  function currentProtocolFormPatient(){
    const proto = protocolsList().find(p => p.id === (typeof selId !== 'undefined' ? selId : ''));
    return {
      prenom: document.getElementById('prenom')?.value?.trim() || '',
      nom: document.getElementById('nom')?.value?.trim() || '',
      age: document.getElementById('age')?.value || '',
      poids: document.getElementById('poids')?.value || '',
      taille: document.getElementById('taille')?.value || '',
      sexe: document.getElementById('sexe')?.value || '',
      dossier: document.getElementById('dossier')?.value || '',
      cubix: document.getElementById('cubix')?.value || '',
      codegratuite: document.getElementById('codegratuite')?.value?.trim() || '',
      medecin: document.getElementById('medecin-select')?.value || '',
      localisation: document.getElementById('localisation')?.value || '',
      indication: document.getElementById('indication')?.value || '',
      protoId: proto?.id || '',
      protocole: proto?.name || '',
      cure: document.getElementById('cure-num')?.value || '',
      totalCures: document.getElementById('total-cures')?.value || ''
    };
  }

  function savedCodeExists(code){
    if(!code) return false;
    const same = item => String(val(item.codegratuite, item.codeGratuite, item.code, item.patient?.codegratuite, item.patient?.codeGratuite)).trim() === String(code).trim();
    return readJson(STORAGE.historique, []).some(same) || readJson(STORAGE.okchimio, []).some(same);
  }

  window.saveProtocol = function(){
    const patient = currentProtocolFormPatient();
    if(!patient.prenom || !patient.nom) return alert('Veuillez renseigner au minimum prenom et nom.');
    if(!patient.dossier) return alert('Veuillez renseigner le numero de dossier.');
    if(patient.codegratuite && savedCodeExists(patient.codegratuite) && document.getElementById('codegratuite')?.dataset.manual !== '1'){
      alert('Code de gratuite deja utilise. Enregistrement refuse.');
      return;
    }
    if(typeof saveToHistory === 'function') saveToHistory();
    const list = readJson(STORAGE.patients, []);
    const idx = list.findIndex(p => (patient.dossier && p.dossier === patient.dossier) || (norm(patientName(p)) === norm(`${patient.prenom} ${patient.nom}`)));
    const entry = {...patient, proto: patient.protocole, updatedAt:new Date().toISOString(), statut:'actif'};
    if(idx >= 0) list[idx] = {...list[idx], ...entry, id:list[idx].id || Date.now().toString()};
    else list.push({...entry, id:Date.now().toString()});
    writeJson(STORAGE.patients, list);
    const okList = readJson(STORAGE.okchimio, []);
    const okExists = okList.some(item => (patient.dossier && item.dossier === patient.dossier) || (patient.codegratuite && patientCode(item) === patient.codegratuite));
    if(!okExists){
      okList.push({...entry, id:Date.now().toString(), patient:entry, statut:'En attente', dateCreation:new Date().toISOString()});
      writeJson(STORAGE.okchimio, okList);
      writeJson('chncak_okchimio', okList);
    }
    window.renderPatientsList?.();
    window.renderOkChimio?.();
    openValidationEmail(patient);
  };

  window.validerOkChimio = function(id){
    const list = typeof getOkChimio === 'function' ? getOkChimio() : readJson(STORAGE.okchimio, []);
    const idx = list.findIndex(item => String(item.id) === String(id));
    if(idx < 0) return;
    list[idx].statut = 'Valide';
    list[idx].dateValidation = new Date().toISOString();
    if(typeof saveOkChimio === 'function') saveOkChimio(list);
    else writeJson(STORAGE.okchimio, list);
    window.renderOkChimio?.();
    showToastSafe('Protocole valide. Ouverture du mail de notification.', 'success');
    openValidationEmail(list[idx]);
  };

  window.notifyProtocolValidation = function(id){
    const list = typeof getOkChimio === 'function' ? getOkChimio() : readJson(STORAGE.okchimio, []);
    const entry = list.find(item => String(item.id) === String(id));
    if(entry) openValidationEmail(entry);
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
      }
      if(module === 'biologie'){ localStorage.removeItem(STORAGE.biologie); localStorage.removeItem('biologie'); window.renderBiologie?.(); }
    });
  };

  const nativeImportAllData = window.importAllData;
  if(!nativeImportAllData?.requiresAccessCode){
    window.importAllData = function(file){
      if(!file) return;
      askAdminCode('restaurer une sauvegarde', () => {
        if(typeof nativeImportAllData === 'function') nativeImportAllData(file);
      });
    };
  }

  window.clearHistory = function(){
    askAdminCode("effacer l'historique", () => {
      localStorage.removeItem(STORAGE.historique);
      if(typeof historique !== 'undefined') try { historique = []; } catch(e) {}
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
      window.renderStats?.();
      if(typeof renderHistory === 'function') renderHistory();
      window.renderOkChimio?.();
    });
  };

  function syncCatalogGlobal(list){
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
    list.push({name:drugName, dci, dosages, forme:'Injectable', cond:'B1', qteStock:stock, prixUnit:prix});
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
    'VINBLASTINE', 'VINCRISTINE', 'VINORELBINE', 'ACIDE ZOLEDRONIQUE'
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
      const name = row.querySelector('[data-field="name"]')?.value.trim();
      const calc = row.querySelector('[data-field="calc"]')?.value;
      const coef = Number(row.querySelector('[data-field="coef"]')?.value || 0);
      const jours = row.querySelector('[data-field="jours"]')?.value.trim();
      const solvant = row.querySelector('[data-field="sol"]')?.value.trim();
      const solVol = row.querySelector('[data-field="solvol"]')?.value.trim();
      const dur = row.querySelector('[data-field="dur"]')?.value.trim();
      const freq = row.querySelector('[data-field="freq"]')?.value.trim();
      const doseLimit = row.querySelector('[data-field="limit"]')?.value.trim();
      const light = row.querySelector('[data-field="light"]')?.checked;
      const sol = [solVol ? `${solVol} cc` : '', solvant].filter(Boolean).join(' ');
      const durLabel = dur && /^\d+([.,]\d+)?$/.test(dur) ? `${dur} mn` : dur;
      const notes = [];
      if(freq) notes.push(freq);
      if(doseLimit) notes.push(`Alerte dose limite: ${doseLimit} mg`);
      if(light) notes.push('Proteger contre la lumiere');
      if(/cisplat|carbo|oxali/i.test(norm(name))) notes.push('Surveillance ions: Na+, K+, Mg2+, Ca2+');
      const out = {name, ryt: jours, sol, dur: durLabel, freq:notes.join(' - '), note:notes.join(' - '), hl:true};
      if(calc === 'mgm2') out.mgm2 = coef;
      else if(calc === 'mgkg') out.mgkg = coef;
      else if(calc === 'fix') out.fix = coef;
      else if(calc === 'auc') out.carbo = true;
      else if(calc === 'oral'){ out.oral = true; out.pos = `${coef || ''} mg`.trim(); delete out.hl; }
      return out;
    }).filter(d => d.name);
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
    const calc = d.mgm2 ? 'mgm2' : d.mgkg ? 'mgkg' : d.carbo ? 'auc' : d.oral ? 'oral' : 'fix';
    const coef = d.mgm2 || d.mgkg || d.fix || Number(String(d.pos || '').match(/\d+([.,]\d+)?/)?.[0]?.replace(',', '.') || 0) || '';
    const solText = String(d.sol || d.solvant || '');
    const solVol = solText.match(/(\d+(?:[.,]\d+)?)\s*(?:cc|ml)/i)?.[1] || '';
    const selectedSol = norm(solText).includes('g5') || norm(solText).includes('sg') ? 'SG 5%' : norm(solText).includes('nacl') || norm(solText).includes('ssi') ? 'NaCl 0.9%' : '';
    const durValue = String(d.dur || d.duree || '').match(/^\s*(\d+(?:[.,]\d+)?)\s*(?:mn|min|minutes?)?\s*$/i)?.[1] || String(d.dur || d.duree || '');
    root.insertAdjacentHTML('beforeend', `
      <div class="proto-drug-line">
        <input data-field="name" list="protocol-drug-options" placeholder="Medicament" value="${esc(d.name || '')}" title="Choisir dans la liste ou taper un nouveau medicament">
        <select data-field="calc">
          <option value="mgm2" ${calc === 'mgm2' ? 'selected' : ''}>mg/m2</option>
          <option value="mgkg" ${calc === 'mgkg' ? 'selected' : ''}>mg/kg</option>
          <option value="fix" ${calc === 'fix' ? 'selected' : ''}>dose fixe mg</option>
          <option value="auc" ${calc === 'auc' ? 'selected' : ''}>AUC</option>
          <option value="oral" ${calc === 'oral' ? 'selected' : ''}>per os</option>
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
        <input data-field="freq" placeholder="Frequence / remarque" title="Rythme particulier, ordre de perfusion, remarque clinique..." value="${esc(d.freq || d.frequence || '')}">
        <div class="unit-input"><input data-field="limit" type="number" step="0.01" placeholder="Dose limite" value="${esc(d.maxDose || '')}"><span>mg</span></div>
        <label class="light-check"><input data-field="light" type="checkbox" ${norm(d.note || d.freq).includes('lumiere') ? 'checked' : ''}> Lumiere</label>
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
      <div style="max-width:980px;margin:28px auto;background:white;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);overflow:hidden">
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
    addProtocolDrugRow();
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
      ['Nom protocole','Rythme','Bilan utile','Surveillance','Reference scientifique','Medicament','Type calcul','Dose','Unite','Jours','Solvant','Volume solvant cc','Duree','Frequence / remarque','Alerte dose limite mg','Protection lumiere','Oral'],
      ['EXEMPLE FOLFOX','J14','NFS plaquettes, creatinine, bilan hepatique','Surveillance clinique et biologique','Reference service / guideline validee','Oxaliplatine','mg/m2','85','mg/m2','J1','SG 5%','500','2 h','','','','NON'],
      ['EXEMPLE FOLFOX','J14','NFS plaquettes, creatinine, bilan hepatique','Surveillance clinique et biologique','Reference service / guideline validee','5-FU','mg/m2','400','mg/m2','J1','NaCl 0.9%','100','Bolus','','','','NON'],
      ['EXEMPLE ORAL','J21','NFS plaquettes, bilan hepatique','Surveillance clinique','Reference service / guideline validee','Capecitabine','per os','1250','mg','J1-J14','','','','','','OUI']
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
          const drug = {name:med, ryt:val(row.Jours,row.Rythme_medicament), sol:[solVol ? `${solVol} cc` : '', solName].filter(Boolean).join(' '), dur:val(row.Duree,row.Durée), freq:val(row['Frequence / remarque'], row.Frequence, row.Remarque), hl:true};
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
    const ok = readJson(STORAGE.okchimio, []).map(item => ({...(item.patient || {}), ...item}));
    return [...hist, ...ok].filter(item => patientName(item) || val(item.dossier));
  }

  function installApercuSearch(){
    const page = document.getElementById('page-apercu');
    if(!page) return;
    document.getElementById('apercu-patient-loader')?.remove();
    const entries = savedProtocolEntries();
    const options = entries.map((item, index) => `<option value="${index}">${esc(patientName(item))} - Dossier ${esc(val(item.dossier, '-'))}</option>`).join('');
    const anchor = page.querySelector('[style*="justify-content:space-between"]') || page.firstElementChild;
    anchor?.insertAdjacentHTML('afterend', `<div id="apercu-patient-loader" class="card" style="margin:12px 0"><div class="card-body" style="display:flex;gap:8px;align-items:end;flex-wrap:wrap"><div class="field" style="flex:1;min-width:260px;margin:0"><label>Selectionner un patient sauvegarde</label><input id="apercu-patient-search" type="text" placeholder="Commencer a taper le nom..." oninput="filterApercuPatients()"><select id="apercu-patient-select"><option value="">Patient - dossier</option>${options}</select></div><button class="btn-primary" style="width:auto;padding:10px 18px" onclick="loadSavedProtocolPreview()">Rechercher</button></div></div>`);
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
    const set = (id, value) => { const el = document.getElementById(id); if(el) el.value = value || ''; };
    set('prenom', val(entry.prenom, entry.patient?.prenom));
    set('nom', val(entry.nom, entry.patient?.nom));
    set('age', entry.age); set('poids', entry.poids); set('taille', entry.taille);
    set('dossier', entry.dossier); set('cubix', entry.cubix); set('codegratuite', patientCode(entry));
    set('localisation', val(entry.localisation, entry.diagnostic)); set('indication', entry.indication);
    const protoId = val(entry.protoId, protocolsList().find(p => norm(p.name) === norm(val(entry.protoName, entry.protocole, entry.protocolName)))?.id);
    if(protoId && typeof selectProto === 'function') selectProto(protoId);
    if(typeof calcSC === 'function') calcSC();
    if(typeof update === 'function') update();
    if(typeof renderApercu === 'function') renderApercu();
  };

  function installPatientSearchBox(pageId, boxId, loadFnName){
    const page = document.getElementById(pageId);
    if(!page || document.getElementById(boxId)) return;
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
    set('prenom', val(entry.prenom, entry.patient?.prenom));
    set('nom', val(entry.nom, entry.patient?.nom));
    set('age', entry.age); set('poids', entry.poids); set('taille', entry.taille);
    set('dossier', entry.dossier); set('cubix', entry.cubix); set('codegratuite', patientCode(entry));
    set('localisation', val(entry.localisation, entry.diagnostic)); set('indication', entry.indication);
    const protoId = val(entry.protoId, protocolsList().find(p => norm(p.name) === norm(val(entry.protoName, entry.protocole, entry.protocolName, entry.proto)))?.id);
    if(protoId && typeof selectProto === 'function') selectProto(protoId);
    if(typeof calcSC === 'function') calcSC();
    if(typeof update === 'function') update();
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

  function cleanupLoginAndButtons(){
    const login = document.getElementById('login-screen');
    if(login){
      Array.from(login.querySelectorAll('div')).forEach(div => {
        const text = div.textContent || '';
        const isCredentialLine = (text.includes('pharmacien / pharma123') || text.includes('admin / admin123')) && div.children.length <= 1;
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
    const dashPage = document.getElementById('page-dashboard');
    if(dashPage && isAdminUser() && !document.getElementById('official-github-data-dashboard')){
      document.getElementById('dashboard-content')?.insertAdjacentHTML('afterbegin', '<button id="official-github-data-dashboard" class="btn-secondary official-github-mini" onclick="exportOfficialGitHubData()">Export GitHub</button>');
    }
    const pharmaPage = document.getElementById('page-pharmacie');
    if(pharmaPage && isAdminUser() && !document.getElementById('official-github-data-pharma')){
      pharmaPage.querySelector('h2')?.insertAdjacentHTML('afterend', '<button id="official-github-data-pharma" class="btn-secondary official-github-mini" onclick="exportOfficialGitHubData()">Export GitHub</button>');
    }
    if(!isAdminUser()){
      document.querySelectorAll('#official-github-data-btn,#official-github-data-dashboard,#official-github-data-pharma,.official-github-mini').forEach(el => el.remove());
    }
    if(!isAdminUser()){
      document.querySelectorAll('button,label').forEach(el => {
        const text = norm(el.textContent || '');
        if(text.includes('effacer historique') || text === 'effacer' || text.includes('restaurer') || text.includes('ajouter un protocole') || text.includes('importer un protocole')) el.style.display = 'none';
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
    if(id === 'programme') setTimeout(cleanupLoginAndButtons, 20);
    if(id === 'preparation') setTimeout(ensurePreparationPrintReady, 80);
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
    setTimeout(() => {
      const btn = document.querySelector(".tab-btn[onclick*=\"dashboard\"]");
      if(typeof showPage === 'function') showPage('dashboard', btn);
    }, 80);
    return out;
  };

  const nativeSaveRdvAndConfirm = window.saveRdvAndConfirm;
  window.saveRdvAndConfirm = function(){
    const rdvVal = document.getElementById('date-rdv')?.value;
    if(rdvVal){
      const list = readJson(STORAGE.rdv, []);
      const currentDossier = document.getElementById('dossier')?.value || '';
      const existingSameDay = list.filter(r => r.dateRdv === rdvVal && (!currentDossier || r.dossier !== currentDossier));
      if(existingSameDay.length >= 2 && !confirm('Attention : il y a deja 2 nouveaux rendez-vous ce jour-la. Continuer quand meme ?')) return;
    }
    return typeof nativeSaveRdvAndConfirm === 'function' ? nativeSaveRdvAndConfirm.apply(this, arguments) : undefined;
  };

  const nativeValidateStockFromRdv = window.validateStockFromRdv;
  window.validateStockFromRdv = function(id){
    const rdv = readJson(STORAGE.rdv, []).find(r => String(r.id) === String(id));
    const patient = rdv ? readJson(STORAGE.patients, []).find(p => (p.dossier && p.dossier === rdv.dossier) || norm(patientName(p)) === norm(patientName(rdv))) || rdv : null;
    if(patient && !hasPharmaValidation(patient, rdv)){
      alert('Validation pharmacien obligatoire avant de traiter ce rendez-vous.');
      if(typeof showPage === 'function') showPage('preparation', document.querySelector(".tab-btn[onclick*=\"preparation\"]"));
      setTimeout(() => { loadEntryIntoForm({...patient, ...rdv}); ensurePreparationPrintReady(); }, 150);
      return;
    }
    return typeof nativeValidateStockFromRdv === 'function' ? nativeValidateStockFromRdv.apply(this, arguments) : undefined;
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
  const nativeGenCodeGratuite = window.genCodeGratuite;
  if(typeof nativeGenCodeGratuite === 'function'){
    window.genCodeGratuite = function(){
      const input = document.getElementById('codegratuite');
      if(input?.dataset.manual === '1') return;
      return nativeGenCodeGratuite.apply(this, arguments);
    };
  }

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
    document.body.classList.toggle('admin-session', isAdminUser());
    cleanMedecinsFinal();
    if(typeof renderProtos === 'function') renderProtos();
    cleanupLoginAndButtons();
    ensurePreparationPrintReady();
    installSupportCleanupWatcher();
    setInterval(updateLiveClocks, 30000);
    const style = document.createElement('style');
    style.textContent = `
      .dashboard-photo-btn{display:none!important}
      .page{max-width:1580px}
      #page-apercu > div,#page-preparation > div,#page-support > div,#page-stats > div,#page-programme > div[style*="max-width"],#page-patients > div,#patients-rdv-list,#page-rdv > div{max-width:1460px!important}
      body:not(.admin-session) .official-github-mini{display:none!important}
      .official-github-mini{width:auto!important;margin:6px 0 8px!important;padding:4px 8px!important;font-size:10px!important;line-height:1.1!important;border-radius:6px!important;box-shadow:none!important;display:inline-flex!important;align-items:center!important;gap:4px!important}
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
      .proto-editor-grid{display:grid;grid-template-columns:1fr 150px;gap:10px}
      .proto-editor-grid label:nth-child(3),.proto-editor-grid label:nth-child(4){grid-column:1/-1}
      .proto-drug-grid{display:flex;flex-direction:column;gap:8px;margin-top:10px}
      .proto-drug-line{display:grid;grid-template-columns:minmax(150px,1.2fr) 105px 95px 105px 110px 90px 95px minmax(130px,1fr) 95px 74px 28px;gap:7px;align-items:center;background:#f8fbff;border:1px solid #dbe5f2;border-radius:8px;padding:8px}
      .unit-input{display:flex;align-items:center;gap:4px}
      .unit-input span{font-size:10px;color:#607080}
      .light-check{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:center;gap:5px;font-size:11px!important;font-weight:800!important;color:#17324d!important}
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
      @media (max-width:900px){.dash-final-hero,.dash-final-main,.proto-editor-grid{grid-template-columns:1fr}.dash-final-grid{grid-template-columns:repeat(2,1fr)}.proto-drug-line{grid-template-columns:1fr 1fr}.proto-remove{grid-column:1/-1}}
      @media (max-width:900px){.dash-clock-lead,.dash-leadership,.suivi-actions-final{grid-template-columns:1fr}.dash-leadership .lead-director{grid-row:auto}.login-clock-card{position:static;margin:0 0 12px;background:rgba(255,255,255,.18)}}
      @media print{.protocol-print-fit table:first-child,.protocol-print-fit table:first-child *{font-size:6px!important;line-height:.78!important;margin-top:0!important;margin-bottom:0!important;padding-top:0!important;padding-bottom:0!important}.protocol-print-fit table:first-child img{max-height:34px!important}}
    `;
    document.head.appendChild(style);
    setTimeout(() => {
      if(document.getElementById('page-dashboard')?.classList.contains('active')) window.renderDashboard?.();
    }, 150);
  });

  window.chimioproSupportIdea = function(){};
})();
