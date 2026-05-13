/* ============================================================
   AMELIORATIONS DEMANDEES - CHIMIOPRO
   Charge en dernier pour préserver les données locales existantes.
============================================================ */
(function(){
  const STORAGE = {
    patients: 'chncak_patients',
    rdv: 'chncak_rdv',
    historique: 'chncak_historique',
    okchimio: 'chncak_protocols',
    suivi: 'chncak_suivi',
    biologie: 'chncak_biologie',
    medecins: 'chncak_medecins'
  };

  function readJson(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(e){ return fallback; }
  }

  function writeJson(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }

  function esc(value){
    return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function firstValue(...values){
    const found = values.find(v => v !== undefined && v !== null && String(v).trim() !== '');
    return found === undefined ? '' : String(found).trim();
  }

  function display(...values){
    const value = firstValue(...values);
    return value || '-';
  }

  function patientName(patient){
    if(!patient) return '';
    return firstValue(patient.patientName, patient.patient, `${firstValue(patient.prenom)} ${firstValue(patient.nom)}`.trim(), patient.name);
  }

  function patientCode(patient, index){
    return firstValue(patient?.codegratuite, patient?.codeGratuite, patient?.code, patient?.codeBarre, patient?.dossier, index);
  }

  function medecinName(med){
    return firstValue(med?.name, `${firstValue(med?.prenom)} ${firstValue(med?.nom)}`.trim(), med?.id);
  }

  function normalizeLookup(value){
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\b(dr|docteur|doctor|pr|professeur)\b\.?/gi, '')
      .replace(/[^a-z0-9@.]+/gi, ' ')
      .trim()
      .toLowerCase();
  }

  function findPatientByRdv(rdv){
    const patients = readJson(STORAGE.patients, []);
    const rdvName = `${firstValue(rdv.prenom)} ${firstValue(rdv.nom)}`.trim().toLowerCase();
    return patients.find((p, index) =>
      String(patientCode(p, index)) === String(firstValue(rdv.codegratuite, rdv.codeGratuite, rdv.code, rdv.dossier)) ||
      (firstValue(p.dossier) && firstValue(p.dossier) === firstValue(rdv.dossier)) ||
      patientName(p).toLowerCase() === rdvName
    );
  }

  function findDoctor(value){
    const needle = String(value || '').trim().toLowerCase();
    const normalizedNeedle = normalizeLookup(value);
    return readJson(STORAGE.medecins, window.medecins || []).find(m => {
      const names = [
        m.id,
        m.name,
        m.nom,
        m.prenom,
        `${firstValue(m.prenom)} ${firstValue(m.nom)}`.trim(),
        `${firstValue(m.nom)} ${firstValue(m.prenom)}`.trim(),
        medecinName(m),
        m.email,
        m.mail,
        m.courriel
      ].map(x => String(x || '').trim().toLowerCase());
      const normalizedNames = names.map(normalizeLookup);
      const needleTokens = normalizedNeedle.split(' ').filter(x => x.length > 3 && !['avec','sans'].includes(x));
      return names.includes(needle) ||
        normalizedNames.includes(normalizedNeedle) ||
        normalizedNames.some(name => normalizedNeedle && (name.includes(normalizedNeedle) || normalizedNeedle.includes(name))) ||
        normalizedNames.some(name => needleTokens.length && needleTokens.some(token => name.split(' ').includes(token)));
    });
  }

  function doctorEmail(doctor){
    return firstValue(doctor?.email, doctor?.mail, doctor?.courriel, doctor?.adresseEmail);
  }

  function sendMail(to, subject, body){
    if(!to) {
      showToast?.('Email du médecin introuvable dans l’onglet Médecins.', 'error');
      return;
    }
    const href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
    showToast?.('Fenêtre email préparée.', 'info');
  }

  function formValue(id){
    return document.getElementById(id)?.value?.trim() || '';
  }

  function currentFormPatient(){
    return {
      prenom: formValue('prenom'),
      nom: formValue('nom'),
      age: formValue('age'),
      poids: formValue('poids'),
      taille: formValue('taille'),
      sexe: formValue('sexe'),
      nationalite: formValue('nationalite'),
      tel: formValue('tel-patient'),
      contact: formValue('tel-patient'),
      ligne: formValue('ligne-traitement'),
      ligneTraitement: formValue('ligne-traitement'),
      indication: formValue('indication'),
      localisation: formValue('localisation'),
      diagnostic: formValue('localisation'),
      typeHistologie: formValue('type-histologie'),
      stade: formValue('stade'),
      atcd: typeof getAtcd === 'function' ? getAtcd() : '',
      medecin: formValue('medecin-select'),
      dossier: formValue('dossier'),
      cubix: formValue('cubix'),
      codegratuite: formValue('codegratuite'),
      codeGratuite: formValue('codegratuite'),
      dateProto: formValue('date-protocole'),
      protocole: (typeof PROTOCOLS !== 'undefined' ? PROTOCOLS : []).find(p => p.id === (typeof selId !== 'undefined' ? selId : ''))?.name || '',
      protoId: typeof selId !== 'undefined' ? selId : '',
      cure: formValue('cure-num'),
      totalCures: formValue('total-cures'),
      updatedAt: new Date().toISOString(),
      statut: 'actif'
    };
  }

  function samePatient(a, b){
    const nameA = `${firstValue(a.prenom)} ${firstValue(a.nom)}`.trim().toLowerCase();
    const nameB = `${firstValue(b.prenom)} ${firstValue(b.nom)}`.trim().toLowerCase();
    return (firstValue(a.dossier) && firstValue(a.dossier) === firstValue(b.dossier)) || (nameA && nameA === nameB);
  }

  function codeAlreadyUsedByOther(code, patient){
    if(!code) return false;
    const patients = readJson(STORAGE.patients, []);
    const hist = readJson(STORAGE.historique, []);
    return [...patients, ...hist].some(item => {
      const itemCode = firstValue(item.codegratuite, item.codeGratuite, item.code);
      return itemCode === code && !samePatient(item, patient);
    });
  }

  function patientAlreadyHasSavedProtocol(patient){
    const saved = [...readJson(STORAGE.historique, []), ...readJson(STORAGE.okchimio, [])];
    return saved.some(item => {
      const p = item.patient ? {...item.patient, ...item} : item;
      return samePatient(p, patient) ||
        (firstValue(patient.codegratuite) && firstValue(p.codegratuite, p.codeGratuite, p.code) === patient.codegratuite) ||
        (firstValue(patient.dossier) && firstValue(p.dossier) === patient.dossier);
    });
  }

  function upsertCurrentPatient(patient){
    const list = readJson(STORAGE.patients, []);
    const idx = list.findIndex(p => samePatient(p, patient) || (patient.codegratuite && patientCode(p) === patient.codegratuite));
    if(idx >= 0) list[idx] = {...list[idx], ...patient, id: list[idx].id || patient.dossier || Date.now()};
    else list.push({...patient, id: patient.dossier || Date.now()});
    writeJson(STORAGE.patients, list);
  }

  function upsertSuiviFromPatient(patient){
    const code = patient.codegratuite || patient.dossier || `${patient.prenom}-${patient.nom}`;
    if(!code || !patient.prenom || !patient.nom) return;
    const list = readJson(STORAGE.suivi, readJson('suivi', []));
    const idx = list.findIndex(item => item.patientCode === code || item.dossier === patient.dossier);
    const entry = {
      patientCode: code,
      patientName: `${code} - ${patient.prenom} ${patient.nom}`,
      dossier: patient.dossier,
      dateDebut: patient.dateProto || new Date().toLocaleDateString('fr-FR'),
      protocole: patient.protocole,
      medecin: patient.medecin,
      localisation: patient.localisation,
      indication: patient.indication,
      cures: patient.cure || '',
      totalCures: patient.totalCures || '',
      nationalite: patient.nationalite || '',
      tel: patient.tel || patient.contact || '',
      contact: patient.contact || patient.tel || '',
      ligne: patient.ligne || patient.ligneTraitement || '',
      compliant: '',
      reponse: 'A renseigner',
      date: new Date().toLocaleDateString('fr-FR'),
      dateTs: new Date().toISOString()
    };
    if(idx >= 0) list[idx] = {...list[idx], ...entry};
    else list.push(entry);
    writeJson(STORAGE.suivi, list);
    localStorage.setItem('suivi', JSON.stringify(list));
  }

  function protocolSummaryLine(){
    const type = formValue('type-histologie');
    const loc = formValue('localisation');
    const stade = formValue('stade');
    const parts = [];
    if(type) parts.push(type);
    if(loc) parts.push(loc);
    if(stade) parts.push(`stade ${stade}`);
    return parts.join(', ');
  }

  function syncDiagnosticPhrase(){
    const loc = document.getElementById('localisation');
    if(!loc || document.getElementById('diagnostic-phrase-preview')) return;
    loc.closest('.fg')?.insertAdjacentHTML('afterend', '<div id="diagnostic-phrase-preview" class="hist-empty" style="margin:8px 0 0;padding:8px 12px;text-align:left"></div>');
    const draw = () => {
      const box = document.getElementById('diagnostic-phrase-preview');
      if(box) box.innerHTML = `<strong>Phrase diagnostic :</strong> ${esc(protocolSummaryLine() || 'Renseigner type histologie, localisation et stade.')}`;
    };
    ['localisation','type-histologie','stade'].forEach(id => document.getElementById(id)?.addEventListener('input', draw));
    draw();
  }

  function normalizeSpecialProtocols(){
    if(typeof PROTOCOLS === 'undefined') return;
    const currentWeight = Number(formValue('poids')) || 0;
    const mapName = name => {
      const raw = String(name || '').toLowerCase();
      if(raw.includes('epirubicine')) return 'ÉPIRUBICINE';
      if(raw.includes('cyclophosphamide')) return 'CYCLOPHOSPHAMIDE';
      if(raw.includes('trastuzumab')) return 'TRASTUZUMAB';
      if(raw.includes('bevacizumab')) return 'AVASTIN (Bévacizumab)';
      if(raw.includes('gemcitabine')) return 'GEMCITABINE';
      if(raw.includes('zol')) return 'ZOMETA';
      return name;
    };
    const defaults = {
      'ÉPIRUBICINE': {sol:'100 cc SSI 0.9%', dur:'20 mn'},
      'CYCLOPHOSPHAMIDE': {sol:'250 cc G5%', dur:'45 mn'},
      'TRASTUZUMAB': {sol:'250 cc SSI 0.9%', dur:'90 mn puis 30 mn'},
      'AVASTIN (Bévacizumab)': {sol:'250 cc SSI 0.9%', dur:'30-90 mn'},
      'GEMCITABINE': {sol:'250 cc SSI 0.9%', dur:'30 mn'},
      'ZOMETA': {sol:'100 cc SSI 0.9%', dur:'15 mn'}
    };
    PROTOCOLS.filter(p => ['ec100','herceptin','gem_avastin','avastin_zometa'].includes(p.id)).forEach(proto => {
      proto.drugs.forEach(drug => {
        drug.name = mapName(drug.name);
        if(drug.calc === 'sc' && drug.coef){
          drug.mgm2 = Number(drug.coef);
          delete drug.fix;
        }
        if(drug.calc === 'poids' && drug.coef){
          drug.fix = currentWeight ? Math.round(Number(drug.coef) * currentWeight) : `${drug.coef} mg/kg`;
          delete drug.mgm2;
          delete drug.avastin;
        }
        if(drug.calc === 'fix' && drug.coef){
          drug.fix = Number(drug.coef);
        }
        const cfg = defaults[drug.name];
        if(cfg){
          drug.sol = drug.sol || cfg.sol;
          drug.dur = drug.dur || cfg.dur;
          drug.ryt = drug.ryt || proto.rythme || '';
          drug.hl = true;
        }
      });
    });
    ensureSpecialCatalog();
  }

  function ensureSpecialCatalog(){
    const catalog = readJson('chncak_catalog', []);
    if(!Array.isArray(catalog)) return;
    const needed = [
      {name:'ÉPIRUBICINE', dci:'Epirubicine', dosages:[50], forme:'Injectable', cond:'B1', qteStock:0, prixUnit:0},
      {name:'TRASTUZUMAB', dci:'Trastuzumab', dosages:[150], forme:'Injectable', cond:'B1', qteStock:0, prixUnit:0},
      {name:'ZOMETA', dci:'Acide zolédronique', dosages:[4], forme:'Injectable', cond:'B1', qteStock:0, prixUnit:0}
    ];
    let changed = false;
    needed.forEach(item => {
      if(!catalog.some(x => x.name === item.name)){
        catalog.push(item);
        changed = true;
      }
    });
    if(changed) writeJson('chncak_catalog', catalog);
  }

  if(typeof getDose === 'function'){
    const nativeGetDose = getDose;
    window.getDose = function(drug){
      if(drug && drug.calc && drug.coef){
        const weight = Number(formValue('poids')) || 0;
        const surface = typeof sc !== 'undefined' ? Number(sc) : 0;
        if(drug.calc === 'sc'){
          const val = Math.round(Number(drug.coef) * surface);
          return {val, txt: val ? `${val} ${drug.unit || 'mg'}` : '-', sol: drug.sol, calc:true};
        }
        if(drug.calc === 'poids'){
          const val = Math.round(Number(drug.coef) * weight);
          return {val, txt: val ? `${val} ${drug.unit || 'mg'}` : `${drug.coef} mg/kg`, sol: drug.sol, calc:true};
        }
        if(drug.calc === 'fix'){
          const val = Number(drug.coef);
          return {val, txt:`${val} ${drug.unit || 'mg'}`, sol: drug.sol, calc:true};
        }
      }
      return nativeGetDose(drug);
    };
    try { getDose = window.getDose; } catch(e) {}
  }

  const originalSaveToHistory = window.saveToHistory;
  window.saveToHistory = function(){
    const patient = currentFormPatient();
    if(patient.codegratuite && codeAlreadyUsedByOther(patient.codegratuite, patient)){
      alert('Code de gratuité déjà utilisé pour un autre patient. Enregistrement refusé.');
      return;
    }

    const before = readJson(STORAGE.historique, []).length;
    if(typeof originalSaveToHistory === 'function') originalSaveToHistory.apply(this, arguments);
    upsertCurrentPatient(patient);

    const doctor = findDoctor(patient.medecin);
    const after = readJson(STORAGE.historique, []).length;
    if(after > before){
      sendMail(
        doctorEmail(doctor),
        `Protocole enregistré - ${patient.prenom} ${patient.nom}`,
        `Bonjour,\n\nUn protocole a été sauvegardé dans ChimioPro.\n\nPatient: ${patient.prenom} ${patient.nom}\nCode gratuité: ${patient.codegratuite || '-'}\nDossier: ${patient.dossier || '-'}\nDiagnostic: ${patient.localisation || '-'}\nProtocole: ${patient.protocole || '-'}\nCure: ${patient.cure || '-'} / ${patient.totalCures || '-'}\nDate: ${new Date().toLocaleString('fr-FR')}\n\nService Oncologie-Radiothérapie CHNCAK Touba`
      );
    }
  };

  const originalSaveProtocol = window.saveProtocol;
  window.saveProtocol = function(){
    normalizeSpecialProtocols();
    const patient = currentFormPatient();
    patient.localisation = protocolSummaryLine() || patient.localisation;
    patient.diagnostic = patient.localisation;
    if(patient.codegratuite && codeAlreadyUsedByOther(patient.codegratuite, patient)){
      alert('Code de gratuité déjà utilisé pour un autre patient. Enregistrement refusé.');
      return;
    }
    if(patientAlreadyHasSavedProtocol(patient)){
      alert('Ce patient a déjà un protocole sauvegardé. La deuxième sauvegarde est bloquée pour éviter les doublons.');
      return;
    }
    if(typeof originalSaveProtocol === 'function') originalSaveProtocol.apply(this, arguments);
    upsertCurrentPatient(patient);
    upsertSuiviFromPatient(patient);
    const protocols = readJson(STORAGE.okchimio, []);
    const last = protocols[protocols.length - 1];
    if(last && patient.prenom && patient.nom){
      last.patient = {...(last.patient || {}), ...patient};
      last.patientName = `${patient.prenom} ${patient.nom}`;
      last.dossier = patient.dossier;
      last.codegratuite = patient.codegratuite;
      last.protoId = patient.protoId || last.protoId;
      last.protocole = patient.protocole || last.protocole;
      last.protocolName = patient.protocole || last.protocolName;
      last.medecin = patient.medecin || last.medecin;
      last.cure = patient.cure || last.cure;
      last.surface = typeof sc !== 'undefined' && sc ? sc.toFixed(2) : last.surface;
      last.localisation = patient.localisation;
      last.nationalite = patient.nationalite;
      last.tel = patient.tel;
      last.ligne = patient.ligne;
      last.totalCures = patient.totalCures;
      const proto = (typeof PROTOCOLS !== 'undefined' ? PROTOCOLS : []).find(p => p.id === patient.protoId);
      if(proto) last.medicaments = proto.drugs.filter(d => !d.t).map(d => {
        const dose = typeof getDose === 'function' ? getDose(d) : {};
        return {nom:firstValue(d.name, d.label), dose:firstValue(dose.txt, d.fix, d.mgm2), unite:d.unit || 'mg'};
      });
      writeJson(STORAGE.okchimio, protocols);
    }
    const doctor = findDoctor(patient.medecin);
    sendMail(
      doctorEmail(doctor),
      `Protocole enregistré - ${patient.prenom} ${patient.nom}`,
      `Bonjour,\n\nUn protocole a été sauvegardé dans ChimioPro.\n\nPatient: ${patient.prenom} ${patient.nom}\nCode gratuité: ${patient.codegratuite || '-'}\nDossier: ${patient.dossier || '-'}\nDiagnostic: ${patient.localisation || '-'}\nProtocole: ${patient.protocole || '-'}\nCure: ${patient.cure || '-'} / ${patient.totalCures || '-'}\nDate: ${new Date().toLocaleString('fr-FR')}\n\nService Oncologie-Radiothérapie CHNCAK Touba`
    );
    window.renderSuivi?.();
    window.renderOkChimio?.();
  };

  function protocolPatient(protocol){
    const nested = protocol.patient || {};
    const hist = readJson(STORAGE.historique, []).find(h =>
      h.id === protocol.historyId ||
      (firstValue(h.dossier) && firstValue(h.dossier) === firstValue(nested.dossier, protocol.dossier)) ||
      (`${firstValue(h.prenom)} ${firstValue(h.nom)}`.trim().toLowerCase() === patientName(nested).toLowerCase())
    ) || {};
    return {...hist, ...nested, ...protocol};
  }

  window.previewProtocol = function(protocolId){
    const protocol = readJson(STORAGE.okchimio, []).find(p => p.id === protocolId);
    if(!protocol) return alert('Protocole non trouvé');
    const p = protocolPatient(protocol);
    const proto = (typeof PROTOCOLS !== 'undefined' ? PROTOCOLS : []).find(x => x.id === firstValue(protocol.protoId, p.protoId));
    const drugs = protocol.medicaments || protocol.drugs || proto?.drugs || [];
    const name = patientName(p);
    const protocolName = firstValue(protocol.protocolName, protocol.protocole, p.protoName, proto?.name);
    const code = firstValue(p.codegratuite, p.codeGratuite, p.code);
    const modal = document.createElement('div');
    modal.className = 'quick-modal open';
    modal.innerHTML = `
      <div class="quick-box" style="max-width:860px">
        <div class="quick-head">
          <h2 style="margin:0;color:var(--blue);font-size:20px">Aperçu du protocole</h2>
          <button class="btn-secondary" onclick="this.closest('.quick-modal').remove()">Fermer</button>
        </div>
        <div style="padding:18px;display:grid;gap:14px">
          <div class="clinical-table-wrap" style="margin:0">
            <table class="dash-table">
              <tbody>
                <tr><th>Patient</th><td>${esc(name)}</td><th>Code gratuité</th><td>${esc(display(code))}</td></tr>
                <tr><th>Dossier</th><td>${esc(display(p.dossier))}</td><th>Age</th><td>${esc(display(p.age))}</td></tr>
                <tr><th>Poids</th><td>${esc(display(p.poids))} kg</td><th>Taille</th><td>${esc(display(p.taille))} cm</td></tr>
                <tr><th>Surface</th><td>${esc(display(p.sc, p.surface))} m²</td><th>Diagnostic</th><td>${esc(display(p.localisation, p.diagnostic))}</td></tr>
                <tr><th>Médecin</th><td>${esc(display(protocol.medecin, p.medecin))}</td><th>Cure</th><td>${esc(display(protocol.cure, p.cureNum, p.cure))}</td></tr>
              </tbody>
            </table>
          </div>
          <div class="card" style="margin:0">
            <div class="card-header"><h2>${esc(protocolName)}</h2></div>
            <div class="card-body">
              ${drugs.length ? drugs.map(d => `<div class="dash-line"><span>${esc(firstValue(d.nom, d.name, d.label))}</span><strong>${esc(display(d.dose, d.mgm2, d.fix, d.unite))}</strong></div>`).join('') : '<div class="dash-empty">Aucun médicament renseigné.</div>'}
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
  };

  window.refuserOkChimio = function(id){
    const note = prompt('Note à envoyer à onco.chn.cak@gmail.com :');
    if(!note) return;
    const list = readJson(STORAGE.okchimio, []);
    const idx = list.findIndex(item => item.id === id);
    if(idx < 0) return;
    list[idx].statut = 'Refusé';
    list[idx].motifRefus = note;
    list[idx].dateRefus = new Date().toISOString();
    writeJson(STORAGE.okchimio, list);
    const p = protocolPatient(list[idx]);
    sendMail(
      'onco.chn.cak@gmail.com',
      `Protocole refusé - ${patientName(p)}`,
      `Bonjour,\n\nUn protocole a été refusé dans OK Chimio.\n\nPatient: ${patientName(p)}\nCode gratuité: ${display(p.codegratuite, p.codeGratuite, p.code)}\nDossier: ${display(p.dossier)}\nProtocole: ${display(list[idx].protocole, list[idx].protocolName, p.protoName)}\nMédecin: ${display(list[idx].medecin, p.medecin)}\n\nNote:\n${note}\n\nDate: ${new Date().toLocaleString('fr-FR')}`
    );
    window.renderOkChimio?.();
  };

  const originalTreatRdv = window.traiterRdvStandalone;
  window.traiterRdvStandalone = function(id){
    if(typeof originalTreatRdv === 'function') originalTreatRdv.apply(this, arguments);
    const rdv = readJson(STORAGE.rdv, []).find(r => r.id === id);
    if(!rdv || !((rdv.status || '') === 'traite' || rdv.validatedAt)) return;
    const patient = findPatientByRdv(rdv) || {};
    const suivi = readJson(STORAGE.suivi, []);
    const code = firstValue(patientCode(patient), rdv.codegratuite, rdv.dossier);
    if(suivi.some(s => s.rdvId === id)) return;
    suivi.push({
      rdvId: id,
      patientCode: code,
      patientName: `${code ? code + ' - ' : ''}${patientName(patient) || `${rdv.prenom || ''} ${rdv.nom || ''}`.trim()}`,
      dateDebut: firstValue(patient.dateProto, rdv.dateProto, rdv.dateRdv),
      protocole: firstValue(patient.protocole, rdv.proto),
      medecin: firstValue(patient.medecin, rdv.medecin),
      dossier: firstValue(patient.dossier, rdv.dossier),
      localisation: firstValue(patient.localisation, patient.diagnostic),
      indication: firstValue(patient.indication),
      cures: firstValue(patient.cure, rdv.cureNum, 1),
      totalCures: firstValue(patient.totalCures, rdv.totalCures),
      nationalite: firstValue(patient.nationalite, rdv.nationalite),
      tel: firstValue(patient.tel, patient.contact, rdv.tel),
      contact: firstValue(patient.contact, patient.tel, rdv.tel),
      ligne: firstValue(patient.ligne, patient.ligneTraitement, rdv.ligne),
      compliant: 'Oui',
      reponse: 'A renseigner',
      date: new Date().toLocaleDateString('fr-FR'),
      dateTs: new Date().toISOString()
    });
    writeJson(STORAGE.suivi, suivi);
    localStorage.setItem('suivi', JSON.stringify(suivi));
  };

  function barcodeHTML(code){
    if(!code) return '';
    const bars = String(code).split('').map((ch, i) => `<i class="${(ch.charCodeAt(0) + i) % 3 === 0 ? 'w' : ''}"></i>`).join('');
    return `<div class="barcode-box"><div class="barcode-lines">${bars}</div><div style="font-size:8px;letter-spacing:1px">${esc(code)}</div></div>`;
  }

  const originalBuildDocumentHTML = window.buildDocumentHTML;
  window.buildDocumentHTML = function(){
    let html = typeof originalBuildDocumentHTML === 'function' ? originalBuildDocumentHTML.apply(this, arguments) : '';
    const code = formValue('codegratuite');
    if(!html) return html;
    html = html.replace('<body>', '<body class="protocol-print-fit">');
    html = html.replace('</style>', `.protocol-print-fit{font-size:8.5px}.protocol-print-fit .exemplaire{min-height:auto!important;padding-bottom:1px}.protocol-print-fit table{page-break-inside:avoid}.protocol-print-fit .cut-line{margin:2px 0}@media print{body.protocol-print-fit{zoom:.80}}</style>`);
    const diag = protocolSummaryLine();
    if(diag) html = html.replace(/Localisation\s*:\s*<b>.*?<\/b>/g, `Localisation : <b>${esc(diag)}</b>`);
    if(code) html = html.replaceAll(`<b>${code}</b>`, `<b>${code}</b><br>${barcodeHTML(code)}`);
    return html;
  };

  function preparationRows(proto){
    return (proto.drugs || []).map((d, index) => {
      const dose = typeof getDose === 'function' ? getDose(d) : {};
      if(dose.cls === 'rh') return '';
      return `<tr><td>${index + 1}</td><td>${esc(firstValue(d.name, d.label))}</td><td>${esc(firstValue(dose.txt, d.dose, d.mgm2, d.fix))}</td><td>${esc(firstValue(d.sol, dose.sol))}</td><td>${esc(firstValue(d.dur))}</td><td>${esc(firstValue(d.ryt))}</td></tr>`;
    }).join('');
  }

  function flaconLabels(proto){
    const patient = currentFormPatient();
    return (proto.drugs || []).map((d, index) => {
      const dose = typeof getDose === 'function' ? getDose(d) : {};
      if(dose.cls === 'rh') return '';
      return `<div class="flacon-label">
        <strong>CHNCAK - Préparation chimiothérapie</strong><br>
        Date: ${new Date().toLocaleDateString('fr-FR')}<br>
        Patient: <b>${esc(patient.prenom)} ${esc(patient.nom)}</b><br>
        Code: <b>${esc(patient.codegratuite || '-')}</b> | Dossier: ${esc(patient.dossier || '-')}<br>
        Ordre: <b>${index + 1}</b><br>
        Produit: <b>${esc(firstValue(d.name, d.label))}</b><br>
        Dose: ${esc(firstValue(dose.txt, d.dose, d.mgm2, d.fix))}<br>
        Solvant: ${esc(firstValue(d.sol, dose.sol, '-'))} | Durée: ${esc(firstValue(d.dur, '-'))}
      </div>`;
    }).join('');
  }

  window.printPreparation = function(){
    const proto = (typeof PROTOCOLS !== 'undefined' ? PROTOCOLS : []).find(p => p.id === (typeof selId !== 'undefined' ? selId : ''));
    if(!proto) return;
    const patient = currentFormPatient();
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Fiche préparation</title>
      <style>@page{size:A4;margin:10mm}body{font-family:Arial,sans-serif;color:#111;font-size:11px}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #999;padding:5px;text-align:left}th{background:#e8eef8}.flacon-label-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;margin-top:10px}.flacon-label{border:1.5px dashed #111;padding:6px;font-size:9px;line-height:1.35;min-height:34mm;break-inside:avoid}</style>
    </head><body>
      <h2>Fiche de préparation - ${esc(proto.name)}</h2>
      <p><b>Patient:</b> ${esc(patient.prenom)} ${esc(patient.nom)} &nbsp; <b>Code:</b> ${esc(patient.codegratuite || '-')} &nbsp; <b>Dossier:</b> ${esc(patient.dossier || '-')}</p>
      <p><b>Date:</b> ${new Date().toLocaleDateString('fr-FR')} &nbsp; <b>Médecin:</b> ${esc(patient.medecin || '-')}</p>
      <table><thead><tr><th>Ordre</th><th>Produit</th><th>Dose</th><th>Solvant</th><th>Durée</th><th>Rythme</th></tr></thead><tbody>${preparationRows(proto)}</tbody></table>
      <h3>Etiquettes flacons à découper</h3>
      <div class="flacon-label-grid">${flaconLabels(proto)}</div>
    </body></html>`;
    const frame = document.getElementById('print-frame');
    const doc = frame.contentDocument || frame.contentWindow.document;
    frame.style.cssText = 'display:block;position:fixed;left:-9999px;width:210mm;height:297mm';
    doc.open(); doc.write(html); doc.close();
    setTimeout(() => { try{ frame.contentWindow.focus(); frame.contentWindow.print(); } catch(e){ window.open(URL.createObjectURL(new Blob([html], {type:'text/html'})), '_blank'); } }, 400);
  };

  function addCreatinineConverter(){
    const creat = document.getElementById('creatinine');
    if(!creat || document.getElementById('creatinine-mgl')) return;
    const field = creat.closest('.field');
    field?.querySelector('label') && (field.querySelector('label').textContent = 'Créatininémie (µmol/L)');
    creat.insertAdjacentHTML('afterend', '<input id="creatinine-mgl" type="number" step="0.1" placeholder="mg/L" style="margin-top:6px" title="Conversion automatique mg/L">');
    const mg = document.getElementById('creatinine-mgl');
    creat.addEventListener('input', () => {
      const v = Number(creat.value);
      if(v) mg.value = (v / 8.84).toFixed(1);
    });
    mg.addEventListener('input', () => {
      const v = Number(mg.value);
      creat.value = v ? Math.round(v * 8.84) : '';
      if(typeof calcCarbo === 'function') calcCarbo();
    });
  }

  function renderStatsExhaustive(){
    const host = document.getElementById('stats-content') || document.getElementById('page-stats');
    if(!host) return;
    const patients = readJson(STORAGE.patients, []);
    const rdv = readJson(STORAGE.rdv, []);
    const hist = readJson(STORAGE.historique, []);
    const ok = readJson(STORAGE.okchimio, []);
    const suivi = readJson(STORAGE.suivi, readJson('suivi', []));
    const bio = readJson(STORAGE.biologie, readJson('biologie', []));
    const countBy = (items, fn) => items.reduce((acc, item) => {
      const key = firstValue(fn(item), 'Non renseigné');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const rows = data => Object.entries(data).sort((a,b) => b[1] - a[1]).map(([k,v]) => `<div class="dash-line"><span>${esc(k)}</span><strong>${v}</strong></div>`).join('') || '<div class="dash-empty">Aucune donnée.</div>';
    const diagProto = {};
    [...patients, ...hist].forEach(item => {
      const diag = firstValue(item.localisation, item.diagnostic, item.localisations, 'Non renseigné');
      const proto = firstValue(item.protocole, item.protoName, item.proto, 'Non renseigné');
      const key = `${diag} / ${proto}`;
      diagProto[key] = (diagProto[key] || 0) + 1;
    });
    host.innerHTML = `
      <div class="clinical-shell stats-full">
        <div class="stats-summary-grid">
          <div class="stats-box"><h3>Patients</h3><p>${patients.length}</p></div>
          <div class="stats-box"><h3>Protocoles</h3><p>${hist.length}</p></div>
          <div class="stats-box"><h3>RDV</h3><p>${rdv.length}</p></div>
          <div class="stats-box"><h3>Traités RDV</h3><p>${rdv.filter(r => (r.status || '').includes('traite') || r.validatedAt).length}</p></div>
          <div class="stats-box"><h3>OK Chimio</h3><p>${ok.length}</p></div>
          <div class="stats-box"><h3>Refusés</h3><p>${ok.filter(o => o.statut === 'Refusé').length}</p></div>
          <div class="stats-box"><h3>Suivi</h3><p>${suivi.length}</p></div>
          <div class="stats-box"><h3>Biologie</h3><p>${bio.length}</p></div>
        </div>
        <div class="clinical-report-grid">
          <div class="card"><div class="card-header"><h2>Protocoles par type de cancer</h2></div><div class="card-body">${rows(diagProto)}</div></div>
          <div class="card"><div class="card-header"><h2>Types de cancers</h2></div><div class="card-body">${rows(countBy([...patients, ...hist], x => firstValue(x.localisation, x.diagnostic, x.localisations)))}</div></div>
          <div class="card"><div class="card-header"><h2>Protocoles utilisés</h2></div><div class="card-body">${rows(countBy([...patients, ...hist], x => firstValue(x.protocole, x.protoName, x.proto)))}</div></div>
          <div class="card"><div class="card-header"><h2>Médecins</h2></div><div class="card-body">${rows(countBy([...patients, ...hist], x => x.medecin))}</div></div>
          <div class="card"><div class="card-header"><h2>Statuts RDV</h2></div><div class="card-body">${rows(countBy(rdv, x => firstValue(x.status, x.statut, 'planifie')))}</div></div>
          <div class="card"><div class="card-header"><h2>Réponses tumorales</h2></div><div class="card-body">${rows(countBy(suivi, x => x.reponse))}</div></div>
        </div>
      </div>`;
  }

  function savedProtocolEntries(){
    const hist = readJson(STORAGE.historique, []).map(item => ({...item, source:'historique'}));
    const ok = readJson(STORAGE.okchimio, []).map(item => {
      const p = protocolPatient(item);
      return {...p, source:'okchimio', protoName:firstValue(item.protocole, item.protocolName, p.protoName), protoId:firstValue(item.protoId, p.protoId)};
    });
    return [...hist, ...ok].filter(item => patientName(item) || item.prenom || item.nom);
  }

  function injectApercuPatientSelector(){
    const page = document.getElementById('page-apercu');
    if(!page || document.getElementById('apercu-patient-loader')) return;
    const entries = savedProtocolEntries();
    const options = entries.map((item, index) => {
      const code = firstValue(item.codegratuite, item.codeGratuite, item.code, item.dossier);
      const name = patientName(item) || `${firstValue(item.prenom)} ${firstValue(item.nom)}`.trim();
      const proto = firstValue(item.protoName, item.protocole);
      return `<option value="${index}">${esc(code ? code + ' - ' : '')}${esc(name)}${proto ? ' | ' + esc(proto) : ''}</option>`;
    }).join('');
    const anchor = page.querySelector('[style*="justify-content:space-between"]') || page.firstElementChild;
    anchor?.insertAdjacentHTML('afterend', `
      <div id="apercu-patient-loader" class="card" style="margin:12px 0">
        <div class="card-body" style="display:flex;gap:10px;align-items:end;flex-wrap:wrap">
          <div class="field" style="flex:1;min-width:260px;margin:0">
            <label>Nom du patient / code gratuité</label>
            <input id="apercu-patient-search" type="text" placeholder="Taper nom, code gratuité ou dossier..." oninput="filterApercuPatients()" style="margin-bottom:6px">
            <select id="apercu-patient-select">
              <option value="">Sélectionner un patient sauvegardé</option>
              ${options}
            </select>
          </div>
          <button class="btn-primary" style="width:auto;padding:10px 18px" type="button" onclick="loadSavedProtocolPreview()">Valider</button>
        </div>
      </div>
    `);
  }

  window.filterApercuPatients = function(){
    const q = (document.getElementById('apercu-patient-search')?.value || '').toLowerCase();
    const select = document.getElementById('apercu-patient-select');
    if(!select) return;
    Array.from(select.options).forEach(option => {
      option.hidden = q && option.value !== '' && !option.textContent.toLowerCase().includes(q);
    });
  };

  window.loadSavedProtocolPreview = function(){
    const idx = Number(document.getElementById('apercu-patient-select')?.value);
    const entry = savedProtocolEntries()[idx];
    if(!entry) return alert('Sélectionner un patient sauvegardé.');
    const set = (id, value) => { const el = document.getElementById(id); if(el) el.value = value || ''; };
    set('prenom', firstValue(entry.prenom, entry.patient?.prenom));
    set('nom', firstValue(entry.nom, entry.patient?.nom));
    set('age', entry.age);
    set('poids', entry.poids);
    set('taille', entry.taille);
    set('sexe', entry.sexe || 'M');
    set('indication', entry.indication);
    set('localisation', firstValue(entry.localisation, entry.diagnostic));
    set('type-histologie', entry.typeHistologie);
    set('stade', entry.stade);
    set('dossier', entry.dossier);
    set('cubix', entry.cubix);
    set('codegratuite', firstValue(entry.codegratuite, entry.codeGratuite, entry.code));
    set('date-protocole', firstValue(entry.dateProto, entry.date, new Date().toISOString().slice(0,10)));
    set('total-cures', entry.totalCures);
    set('cure-num', firstValue(entry.cureNum, entry.cure));
    const protoId = firstValue(entry.protoId, (typeof PROTOCOLS !== 'undefined' ? PROTOCOLS : []).find(p => p.name === firstValue(entry.protoName, entry.protocole))?.id);
    if(protoId && typeof selectProto === 'function') selectProto(protoId);
    else if(protoId && typeof selId !== 'undefined') selId = protoId;
    normalizeSpecialProtocols();
    if(typeof update === 'function') update();
    if(typeof renderApercu === 'function') renderApercu();
    showToast?.('Aperçu chargé pour le patient sélectionné.', 'success');
  };

  function periodStart(kind){
    const now = new Date();
    const start = new Date(now);
    if(kind === 'mensuelle') start.setMonth(now.getMonth() - 1);
    if(kind === 'trimestrielle') start.setMonth(now.getMonth() - 3);
    if(kind === 'semestrielle') start.setMonth(now.getMonth() - 6);
    if(kind === 'annuelle') start.setFullYear(now.getFullYear() - 1);
    return start;
  }

  function parseUseDetails(text, acc){
    String(text || '').split(',').forEach(part => {
      const match = part.match(/^\s*([^:]+):\s*(\d+(?:[,.]\d+)?)\s*flacon/i);
      if(match){
        const name = match[1].trim();
        const qty = Number(match[2].replace(',', '.')) || 0;
        acc[name] = (acc[name] || 0) + qty;
      }
    });
  }

  function orderRowsForPeriod(kind){
    const start = periodStart(kind);
    const acc = {};
    readJson(STORAGE.rdv, []).forEach(r => {
      const d = new Date(firstValue(r.validatedAt, r.dateValidation, r.dateRdv));
      if(d >= start) (r.stockDetails || []).forEach(x => parseUseDetails(x, acc));
    });
    readJson('chncak_sorties', []).forEach(s => {
      const d = new Date(firstValue(s.dateTs, s.date));
      if(d >= start) parseUseDetails(s.details, acc);
    });
    return Object.entries(acc).map(([name, used]) => ({Medicament:name, Utilise:used, Commande:Math.ceil(used * 1.05)}));
  }

  function exportOrder(rows, kind, format){
    const title = `Commande pharmacie ${kind}`;
    if(!rows.length){
      const empty = `<h2>${title}</h2><p>Aucune consommation trouvée pour cette période. Les quantités seront calculées dès que les traitements RDV seront marqués comme traités.</p>`;
      const frame = document.getElementById('print-frame');
      const doc = frame.contentDocument || frame.contentWindow.document;
      frame.style.cssText = 'display:block;position:fixed;left:-9999px;width:210mm;height:297mm';
      doc.open(); doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${empty}</body></html>`); doc.close();
      if(format === 'pdf') setTimeout(() => frame.contentWindow.print(), 300);
      else alert('Aucune consommation trouvée pour cette période.');
      return;
    }
    if(format === 'excel' && typeof XLSX !== 'undefined'){
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Commande');
      XLSX.writeFile(wb, `Commande_${kind}_${new Date().toISOString().slice(0,10)}.xlsx`);
      return;
    }
    const table = `<h2>${title}</h2><p>Quantités utilisées majorées de 5%.</p><table border="1" cellspacing="0" cellpadding="6"><tr><th>Médicament</th><th>Utilisé</th><th>Commande +5%</th></tr>${rows.map(r => `<tr><td>${esc(r.Medicament)}</td><td>${r.Utilise}</td><td><b>${r.Commande}</b></td></tr>`).join('')}</table>`;
    if(format === 'word'){
      const blob = new Blob([`<html><head><meta charset="utf-8"></head><body>${table}</body></html>`], {type:'application/msword'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Commande_${kind}.doc`;
      a.click();
      return;
    }
    const frame = document.getElementById('print-frame');
    const doc = frame.contentDocument || frame.contentWindow.document;
    frame.style.cssText = 'display:block;position:fixed;left:-9999px;width:210mm;height:297mm';
    doc.open(); doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${table}</body></html>`); doc.close();
    setTimeout(() => frame.contentWindow.print(), 300);
  }

  window.passerCommandePharmacie = function(){
    const period = prompt('Période de commande: mensuelle, trimestrielle, semestrielle ou annuelle ?', 'mensuelle');
    if(!period) return;
    const normalized = period.toLowerCase().startsWith('trim') ? 'trimestrielle' :
      period.toLowerCase().startsWith('sem') ? 'semestrielle' :
      period.toLowerCase().startsWith('ann') ? 'annuelle' : 'mensuelle';
    const format = prompt('Format de sortie: excel, pdf ou word ?', 'excel');
    if(!format) return;
    exportOrder(orderRowsForPeriod(normalized), normalized, format.toLowerCase().startsWith('w') ? 'word' : format.toLowerCase().startsWith('p') ? 'pdf' : 'excel');
  };

  window.handleDashboardTeamPhoto = function(input){
    const file = input.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      localStorage.setItem('chncak_dashboard_team_photo', event.target.result);
      window.renderDashboard?.();
    };
    reader.readAsDataURL(file);
    input.value = '';
  };

  window.renderDashboard = function(){
    const el = document.getElementById('dashboard-content');
    if(!el) return;
    const patients = readJson(STORAGE.patients, []);
    const rdv = readJson(STORAGE.rdv, []);
    const hist = readJson(STORAGE.historique, []);
    const ok = readJson(STORAGE.okchimio, []);
    const suivi = readJson(STORAGE.suivi, readJson('suivi', []));
    const bio = readJson(STORAGE.biologie, readJson('biologie', []));
    const responsables = readJson('chncak_responsables', {});
    const teamPhoto = localStorage.getItem('chncak_dashboard_team_photo') || '';
    const today = new Date();
    today.setHours(0,0,0,0);
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);
    const upcoming = rdv
      .filter(r => r.dateRdv)
      .map(r => ({...r, _date:new Date(r.dateRdv + 'T00:00:00')}))
      .filter(r => !isNaN(r._date) && r._date >= today && r._date <= weekEnd)
      .sort((a,b) => a._date - b._date);
    const countBy = (items, fn) => items.reduce((acc, item) => {
      const key = firstValue(fn(item), 'Non renseigné');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const miniRows = data => Object.entries(data).sort((a,b) => b[1] - a[1]).slice(0, 6)
      .map(([name, count]) => `<div class="dash-line"><span>${esc(name)}</span><strong>${count}</strong></div>`).join('') ||
      '<div class="dash-empty">Aucune donnée.</div>';
    const rdvRows = upcoming.slice(0, 8).map(r => `
      <tr>
        <td>${esc(new Date(r.dateRdv + 'T00:00:00').toLocaleDateString('fr-FR'))}</td>
        <td><strong>${esc(`${firstValue(r.prenom)} ${firstValue(r.nom)}`.trim())}</strong><div class="dash-muted">${esc(firstValue(r.dossier, r.codegratuite))}</div></td>
        <td>${esc(firstValue(r.proto, r.protocole))}</td>
        <td>${esc(firstValue(r.medecin))}</td>
        <td><span class="dash-status ${String(r.status || '').includes('traite') ? 'ok' : ''}">${esc(firstValue(r.status, r.statut, 'planifie'))}</span></td>
      </tr>`).join('');
    const treated = rdv.filter(r => String(firstValue(r.status, r.statut)).includes('traite') || r.validatedAt).length;
    const active = patients.filter(p => !['termine','traite','archive'].includes(normalizeLookup(p.statut))).length;

    el.innerHTML = `
      <div class="dashboard-shell">
        <div class="dashboard-hero">
          <div class="dashboard-hero-copy">
            <div class="dashboard-logo-orbit"><img src="${document.querySelector('.nav-logo img')?.src || ''}" alt="CHNCAK"></div>
            <div>
              <span class="dashboard-kicker">Bienvenue sur ChimioPro</span>
              <h2>Tableau de bord CHNCAK</h2>
              <p>Vue moderne et synthétique du service : patients, rendez-vous, protocoles, OK Chimio, biologie, suivi et pharmacie.</p>
            </div>
          </div>
          <div class="dashboard-team-panel">
            ${teamPhoto ? `<img src="${teamPhoto}" alt="Equipe CHNCAK">` : '<div class="dashboard-team-empty">Photo de l’équipe</div>'}
            <label class="dashboard-photo-btn">Mettre la photo<input type="file" accept="image/*" onchange="handleDashboardTeamPhoto(this)"></label>
          </div>
        </div>

        <div class="dash-grid">
          <div class="dash-card"><div class="dash-value">${patients.length}</div><div class="dash-label">Patients</div></div>
          <div class="dash-card"><div class="dash-value">${active}</div><div class="dash-label">En cours</div></div>
          <div class="dash-card"><div class="dash-value">${upcoming.length}</div><div class="dash-label">RDV 7 jours</div></div>
          <div class="dash-card"><div class="dash-value">${treated}</div><div class="dash-label">RDV traités</div></div>
          <div class="dash-card"><div class="dash-value">${hist.length}</div><div class="dash-label">Protocoles générés</div></div>
          <div class="dash-card"><div class="dash-value">${ok.length}</div><div class="dash-label">OK Chimio</div></div>
          <div class="dash-card"><div class="dash-value">${suivi.length}</div><div class="dash-label">Suivi</div></div>
          <div class="dash-card"><div class="dash-value">${bio.length}</div><div class="dash-label">Biologie</div></div>
        </div>

        <div class="dashboard-schedule-card card">
          <div class="card-header" style="justify-content:space-between">
            <div><h2>Calendrier des rendez-vous</h2><div class="dash-muted">Salle chimio: ${esc(display(responsables.chimio))} · Préparation: ${esc(display(responsables.preparation))}</div></div>
            <button class="btn-secondary" onclick="editDashboardResponsables()">Responsables</button>
          </div>
          <div class="card-body dash-table-wrap">
            <table class="dash-table">
              <thead><tr><th>Date</th><th>Patient</th><th>Protocole</th><th>Médecin</th><th>Statut</th></tr></thead>
              <tbody>${rdvRows || '<tr><td colspan="5" class="dash-empty">Aucun rendez-vous programmé dans les 7 prochains jours.</td></tr>'}</tbody>
            </table>
          </div>
        </div>

        <div class="dash-two">
          <div class="card"><div class="card-header"><div class="card-num">1</div><h2>Protocoles les plus utilisés</h2></div><div class="card-body">${miniRows(countBy(patients, p => firstValue(p.protocole, p.proto, p.protoName)))}</div></div>
          <div class="card"><div class="card-header"><div class="card-num">2</div><h2>Localisations / diagnostics</h2></div><div class="card-body">${miniRows(countBy(patients, p => firstValue(p.localisation, p.diagnostic, p.localisations)))}</div></div>
        </div>
      </div>`;
  };

  window.downloadProtocolImportTemplate = function(){
    const rows = [
      {
        id:'exemple_paclitaxel',
        nom:'PACLITAXEL HEBDO',
        rythme:'J1=J8',
        indication:'Chimiothérapie palliative',
        detail:'Paclitaxel 80 mg/m² hebdomadaire',
        medicament:'TAXOL (Paclitaxel)',
        type_calcul:'sc',
        dose:80,
        unite:'mg',
        solvant:'250 cc SSI 0.9%',
        duree:'60 mn',
        jours:'J1, J8, J15'
      }
    ];
    if(typeof XLSX !== 'undefined'){
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'modele_protocoles');
      XLSX.writeFile(wb, 'modele_import_protocoles_chimiopro.xlsx');
      return;
    }
    const csv = Object.keys(rows[0]).join(';') + '\n' + Object.values(rows[0]).join(';');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'}));
    a.download = 'modele_import_protocoles_chimiopro.csv';
    a.click();
  };

  window.importProtocolExcel = function(input){
    const file = input.files?.[0];
    if(!file) return;
    if(typeof XLSX === 'undefined'){
      alert('Bibliothèque Excel non chargée. Utiliser le modèle CSV ou recharger la page.');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = event => {
      const wb = XLSX.read(event.target.result, {type:'array'});
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, {defval:''});
      const grouped = {};
      rows.forEach(row => {
        const id = firstValue(row.id, row.ID, row.Id);
        if(!id) return;
        grouped[id] = grouped[id] || {
          id,
          name:firstValue(row.nom, row.Nom, row.name),
          rythme:firstValue(row.rythme, row.Rythme),
          indication:firstValue(row.indication, row.Indication),
          detail:firstValue(row.detail, row.Detail),
          badge:firstValue(row.rythme, row.Rythme),
          badgeClass:'b21',
          drugs:[]
        };
        const calc = firstValue(row.type_calcul, row.calcul, row.Calc).toLowerCase();
        const drug = {
          name:firstValue(row.medicament, row.Medicament, row.name),
          unit:firstValue(row.unite, row.Unite, 'mg'),
          sol:firstValue(row.solvant, row.Solvant),
          dur:firstValue(row.duree, row.Duree),
          ryt:firstValue(row.jours, row.Jours, row.rythme),
          hl:true
        };
        const dose = Number(firstValue(row.dose, row.Dose));
        if(calc === 'sc') drug.mgm2 = dose;
        else if(calc === 'poids') drug.fix = dose ? `${dose} mg/kg` : '';
        else if(calc === 'fixe' || calc === 'fix') drug.fix = dose || firstValue(row.dose, row.Dose);
        else drug.mgm2 = dose;
        if(drug.name) grouped[id].drugs.push(drug);
      });
      const imported = Object.values(grouped).filter(p => p.name && p.drugs.length);
      if(!imported.length){
        alert('Aucun protocole valide trouvé dans le fichier.');
        return;
      }
      imported.forEach(proto => {
        const idx = PROTOCOLS.findIndex(p => p.id === proto.id);
        if(idx >= 0) PROTOCOLS[idx] = proto;
        else PROTOCOLS.push(proto);
      });
      writeJson('chncak_custom_protocols', imported);
      if(typeof renderProtocols === 'function') renderProtocols();
      alert(`${imported.length} protocole(s) importé(s).`);
    };
    reader.readAsArrayBuffer(file);
    input.value = '';
  };

  document.addEventListener('click', event => {
    const orderButton = event.target.closest('#pharma-order-btn, [data-pharma-order]');
    if(orderButton){
      event.preventDefault();
      event.stopImmediatePropagation();
      window.passerCommandePharmacie();
    }
  }, true);

  function injectPharmaOrderButton(){
    const header = document.querySelector('#page-pharmacie .card-header');
    if(!header || document.getElementById('pharma-order-btn')) return;
    header.style.justifyContent = 'space-between';
    header.insertAdjacentHTML('beforeend', '<button id="pharma-order-btn" class="btn-secondary" type="button" onclick="passerCommandePharmacie()">Passer une commande</button>');
  }

  function enhanceBiologieSelect(){
    const select = document.getElementById('bio-patient-select');
    if(!select || document.getElementById('bio-patient-search')) return;
    select.size = Math.min(8, Math.max(2, select.options.length));
    select.style.minHeight = '120px';
    select.insertAdjacentHTML('beforebegin', '<input id="bio-patient-search" type="text" placeholder="Rechercher code ou nom patient..." style="margin-bottom:6px" oninput="filterBioPatients()">');
  }

  window.filterBioPatients = function(){
    const q = (document.getElementById('bio-patient-search')?.value || '').toLowerCase();
    const select = document.getElementById('bio-patient-select');
    if(!select) return;
    Array.from(select.options).forEach(option => {
      option.hidden = q && !option.textContent.toLowerCase().includes(q) && option.value !== '';
    });
  };

  window.editDashboardResponsables = function(){
    const current = readJson('chncak_responsables', {});
    const medecin = prompt('Médecin responsable OK Chimio:', current.medecin || '');
    if(medecin === null) return;
    const chimio = prompt('Responsable salle chimio:', current.chimio || '');
    if(chimio === null) return;
    const preparation = prompt('Responsable salle préparation:', current.preparation || '');
    if(preparation === null) return;
    const infirmiere = prompt('Infirmière responsable:', current.infirmiere || '');
    if(infirmiere === null) return;
    writeJson('chncak_responsables', {medecin, chimio, preparation, infirmiere});
    window.renderDashboard?.();
  };

  document.addEventListener('click', event => {
    const button = event.target.closest('button[onclick]');
    const action = button?.getAttribute('onclick') || '';
    if(action.includes('previewProtocol(')){
      event.preventDefault();
      event.stopImmediatePropagation();
      const id = Number(action.match(/previewProtocol\((\d+)/)?.[1]);
      if(id) window.previewProtocol(id);
    }
    if(action.includes('refuserOkChimio(')){
      event.preventDefault();
      event.stopImmediatePropagation();
      const id = Number(action.match(/refuserOkChimio\((\d+)/)?.[1]);
      if(id) window.refuserOkChimio(id);
    }
  }, true);

  window.renderStats = renderStatsExhaustive;

  function askDeleteCode(){
    return prompt('Code de confirmation à 4 chiffres pour supprimer :') === '2026';
  }

  const nativeClearHistory = window.clearHistory;
  window.clearHistory = function(){
    if(!askDeleteCode()) return alert('Code incorrect. Suppression annulée.');
    if(typeof nativeClearHistory === 'function') return nativeClearHistory.apply(this, arguments);
  };

  const nativeClearClinical = window.clearClinicalModuleData;
  window.clearClinicalModuleData = function(){
    if(!askDeleteCode()) return alert('Code incorrect. Suppression annulée.');
    if(typeof nativeClearClinical === 'function') return nativeClearClinical.apply(this, arguments);
  };

  const originalSelectProto = window.selectProto;
  if(typeof originalSelectProto === 'function'){
    window.selectProto = function(){
      normalizeSpecialProtocols();
      const out = originalSelectProto.apply(this, arguments);
      normalizeSpecialProtocols();
      return out;
    };
  }

  const originalUpdate = window.update;
  if(typeof originalUpdate === 'function'){
    window.update = function(){
      normalizeSpecialProtocols();
      syncDiagnosticPhrase();
      return originalUpdate.apply(this, arguments);
    };
  }

  const originalRenderBiologie = window.renderBiologie;
  if(typeof originalRenderBiologie === 'function'){
    window.renderBiologie = function(){
      const out = originalRenderBiologie.apply(this, arguments);
      enhanceBiologieSelect();
      return out;
    };
  }

  const previousShowPage = window.showPage;
  if(typeof previousShowPage === 'function'){
    window.showPage = function(id, btn){
      const out = previousShowPage.apply(this, arguments);
      if(id === 'stats') renderStatsExhaustive();
      if(id === 'protocole') setTimeout(addCreatinineConverter, 50);
      if(id === 'apercu') setTimeout(injectApercuPatientSelector, 50);
      if(id === 'pharmacie') setTimeout(injectPharmaOrderButton, 50);
      if(id === 'biologie') setTimeout(enhanceBiologieSelect, 80);
      return out;
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    addCreatinineConverter();
    normalizeSpecialProtocols();
    syncDiagnosticPhrase();
    injectApercuPatientSelector();
    injectPharmaOrderButton();
    enhanceBiologieSelect();
    const active = document.querySelector('.tab-btn.active');
    if(active?.textContent.includes('Dashboard') && typeof renderDashboard === 'function') renderDashboard();
  });
})();
