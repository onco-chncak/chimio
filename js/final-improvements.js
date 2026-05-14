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
  const todayIso = () => new Date().toISOString().slice(0, 10);
  const protocolNameFor = p => {
    const protoId = val(p?.protoId, p?.protocolId, p?.protocoleId);
    const direct = val(p?.protocole, p?.proto, p?.protoName, p?.protocol, p?.protocolName, p?.chimio, p?.chimiotherapie);
    if(direct) return direct;
    return val((window.PROTOCOLS || []).find(proto => proto.id === protoId)?.name, '-');
  };

  function requireCode(message){
    const code = prompt(message || 'Code de confirmation a 4 chiffres :');
    if(code === null) return false;
    if(code !== CODE_ADMIN){
      alert('Code incorrect. Action annulee.');
      return false;
    }
    return true;
  }

  function doubleConfirm(actionLabel){
    if(!requireCode(`Code a 4 chiffres requis pour ${actionLabel} :`)) return false;
    return confirm(`Confirmer definitivement : ${actionLabel} ?`);
  }

  function showToastSafe(message, type){
    if(typeof showToast === 'function') showToast(message, type || 'info');
    else alert(message);
  }

  function downloadTextFile(filename, content, type){
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], {type: type || 'text/plain;charset=utf-8'}));
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

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
    return (window.PROTOCOLS || []).find(p => p.id === protoId || norm(p.name) === protoName);
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
    return String(html || '')
      .replace(/font-size:8\.5px/g, 'font-size:6.2px')
      .replace(/font-size:8px/g, 'font-size:6.2px')
      .replace(/font-size:9px/g, 'font-size:6.8px')
      .replace(/font-size:10px/g, 'font-size:7.4px')
      .replace(/font-size:11px/g, 'font-size:8px')
      .replace(/line-height:1\.9/g, 'line-height:1')
      .replace(/line-height:1\.8/g, 'line-height:1')
      .replace(/line-height:1\.55/g, 'line-height:1')
      .replace(/line-height:1\.4/g, 'line-height:1')
      .replace(/margin-bottom:8px/g, 'margin-bottom:2px')
      .replace(/margin-bottom:7px/g, 'margin-bottom:2px')
      .replace(/margin:6px 0/g, 'margin:3px 0')
      .replace(/padding:5px 10px/g, 'padding:2px 5px')
      .replace(/padding:4px 6px/g, 'padding:2px 4px')
      .replace(/padding:3px 5px/g, 'padding:2px 4px');
  }

  window.printFromApercu = function(){
    const html = typeof buildDocumentHTML === 'function' ? compactPrintableProtocol(buildDocumentHTML()) : '';
    if(!html) return alert('Aucun apercu a imprimer.');
    const proto = (window.PROTOCOLS || []).find(p => p.id === (typeof selId !== 'undefined' ? selId : ''));
    const fullDoc = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
      <title>Protocole ${esc(proto?.name || '')}</title>
      <style>@page{size:A4;margin:4mm 7mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;font-size:7.2px;color:#000;background:#fff}.protocol-print-fit{font-size:7px}.protocol-print-fit *{line-height:1!important}.protocol-print-fit table{page-break-inside:avoid}table{max-width:100%}.protocol-print-fit td,.protocol-print-fit th{padding-top:1px!important;padding-bottom:1px!important}.protocol-print-fit table:first-child td{font-size:5.8px!important;line-height:.95!important;padding-top:0!important;padding-bottom:0!important}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>
    </head><body class="protocol-print-fit">${html}</body></html>`;
    printHtml(fullDoc);
  };

  window.printPreparation = function(){
    const proto = (window.PROTOCOLS || []).find(p => p.id === (typeof selId !== 'undefined' ? selId : ''));
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
    if(typeof calcSC === 'function') calcSC();
    let n = 0;
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
      return `<tr>
        <td>${n}</td><td><b>${esc(d.name || d.label || '')}</b></td><td>${esc(dose.txt || '')}</td>
        <td>${aspiration}</td><td><b>${totalVol ? totalVol.toFixed(1) + ' mL' : '-'}</b></td>
        <td>${esc(sol)}</td><td>${esc(d.dur || '-')}</td><td>${reliquat ? reliquat.toFixed(1) + ' mL a jeter' : '0'}</td>
      </tr>`;
    }).join('');
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Fiche preparation</title>
      <style>@page{size:A4;margin:7mm 9mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;font-size:9.5px;color:#111}.head{display:grid;grid-template-columns:52px 1fr 120px;gap:7px;align-items:start;margin-bottom:5px}.head img{width:48px;height:48px;object-fit:contain}.ministry{font-size:7.2px;line-height:1.12}.right{font-size:8px;line-height:1.22;text-align:right}.title{background:#0A3D7A;color:white;padding:5px 8px;border-radius:3px;margin:5px 0;font-weight:700}.patient{display:grid;grid-template-columns:2fr repeat(4,1fr);gap:5px;background:#EEF4FD;border:1px solid #0A3D7A;padding:5px;margin-bottom:5px}.patient small{display:block;color:#555;font-size:7px;text-transform:uppercase}table{width:100%;border-collapse:collapse}th{background:#0A3D7A;color:white;font-size:8px;padding:4px;border:1px solid #7fa2d4}td{font-size:8.5px;padding:3px 4px;border:1px solid #bbb;vertical-align:top}.sep td{background:#f1f1f1;color:#555;font-style:italic}.sign{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:7px}.box{height:28px;border:1px solid #aaa;margin-top:3px}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>
    </head><body>
      <div class="head"><img src="${document.querySelector('.nav-logo img')?.src || ''}"><div class="ministry">Republique du Senegal - Un peuple, un but, une foi<br>Ministere de la Sante et de l'Action Sociale<br><b>Centre Hospitalier National Cheikh Ahmadoul Khadim - Touba</b><br><b>Service d'Oncologie-Radiotherapie</b></div><div class="right">Dossier: <b>${esc(patient.dossier || '-')}</b><br>ID Cubix: <b>${esc(patient.cubix || '-')}</b><br>Code: <b>${esc(patient.codegratuite || '-')}</b><br>Date: <b>${new Date().toLocaleDateString('fr-FR')}</b></div></div>
      <div class="title">FICHE DE PREPARATION - ${esc(proto.name)} <span style="font-weight:400">(${esc(proto.detail || '')})</span></div>
      <div class="patient"><div><small>Patient</small><b>${esc(patient.prenom)} ${esc(patient.nom)}</b></div><div><small>Age</small><b>${esc(patient.age)} ans</b></div><div><small>Poids</small><b>${esc(patient.poids)} kg</b></div><div><small>Taille</small><b>${esc(patient.taille)} cm</b></div><div><small>SC</small><b>${localSc.toFixed(2)} m2</b></div></div>
      <table><thead><tr><th>#</th><th>Medicament</th><th>Dose</th><th>Volumes a aspirer</th><th>Volume total</th><th>Solvant</th><th>Duree</th><th>Reliquat</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="sign"><div>Preparateur<div class="box"></div></div><div>Pharmacien<div class="box"></div></div><div>Infirmier / Heure<div class="box"></div></div></div>
      <div style="margin-top:5px;padding:4px;background:#FFF3DC;border:1px solid #F0C060;font-size:8px">Preparation sous hotte a flux laminaire - Verification volume aspire, solvant, etiquette et reliquat avant liberation.</div>
    </body></html>`;
    printHtml(html);
  };

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
        const proto = (window.PROTOCOLS || []).find(p => p.id === h.protoId || norm(p.name) === norm(h.protoName));
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
    const teamPhoto = localStorage.getItem('chncak_dashboard_team_photo') || '';
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
          <div class="dashboard-team-panel dash-final-photo">
            ${teamPhoto ? `<img src="${teamPhoto}" alt="Equipe CHNCAK">` : '<div class="dashboard-team-empty">Photo de l equipe</div>'}
            <label class="dashboard-photo-btn" title="Changer la photo">Photo<input type="file" accept="image/*" onchange="handleDashboardTeamPhoto(this)"></label>
          </div>
        </div>
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
    if(protoSel) protoSel.innerHTML = '<option value="">Selectionner</option>' + (window.PROTOCOLS || []).map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
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
    const proto = (window.PROTOCOLS || []).find(p => p.id === protoId);
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
      const proto = val(p.proto, p.protocole, p.protoName, (window.PROTOCOLS || []).find(x => x.id === p.protoId)?.name, '-');
      return `<tr style="${i%2?'background:white':'background:#FAFBFD'}"><td>${esc(p.dossier || '-')}</td><td><b>${esc(patientName(p))}</b><div class="dash-muted">${esc(val(p.age) ? p.age + ' ans' : '')}</div></td><td>${esc(p.tel || p.contact || '-')}</td><td><span class="pbadge b21">${esc(proto)}</span></td><td>${esc(p.localisation || p.diagnostic || '-')}</td><td>${esc(val(p.cure, '-'))}/${esc(val(p.totalCures, '-'))}</td><td>${esc(p.medecin || '-')}</td><td>${esc(p.statut || 'actif')}</td><td><button class="btn-secondary" onclick="showAddPatientModal('${esc(p.id)}')">Modifier</button> <button class="btn-secondary" onclick="setStatut('${esc(p.id)}','Traité')">Traité</button></td></tr>`;
    }).join('');
    document.getElementById('patients-subtitle') && (document.getElementById('patients-subtitle').textContent = `${list.length} patient(s)`);
    el.innerHTML = `<table class="dash-table"><thead><tr><th>Dossier</th><th>Patient</th><th>Contact</th><th>Protocole</th><th>Localisation</th><th>Cure</th><th>Medecin</th><th>Statut</th><th>Actions</th></tr></thead><tbody>${rows || '<tr><td colspan="9" class="dash-empty">Aucun patient.</td></tr>'}</tbody></table>`;
  }
  window.renderPatientsList = renderPatientsListFinal;

  function currentProtocolFormPatient(){
    const proto = (window.PROTOCOLS || []).find(p => p.id === (typeof selId !== 'undefined' ? selId : ''));
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
    if(patient.codegratuite && savedCodeExists(patient.codegratuite)){
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
    if(!doubleConfirm(`effacer l'historique ${module}`)) return;
    if(module === 'suivi'){ localStorage.removeItem(STORAGE.suivi); localStorage.removeItem('suivi'); window.renderSuivi?.(); }
    if(module === 'biologie'){ localStorage.removeItem(STORAGE.biologie); localStorage.removeItem('biologie'); window.renderBiologie?.(); }
  };

  const nativeImportAllData = window.importAllData;
  window.importAllData = function(file){
    if(!file) return;
    if(!doubleConfirm('restaurer une sauvegarde')) return;
    if(typeof nativeImportAllData === 'function') return nativeImportAllData(file);
  };

  window.clearHistory = function(){
    if(!doubleConfirm("effacer l'historique")) return;
    localStorage.removeItem(STORAGE.historique);
    if(typeof historique !== 'undefined') try { historique = []; } catch(e) {}
    window.renderStats?.();
    if(typeof renderHistory === 'function') renderHistory();
  };

  window.clearAllHistory = function(){
    if(!doubleConfirm("effacer tout l'historique")) return;
    localStorage.removeItem(STORAGE.historique);
    localStorage.removeItem(STORAGE.sorties);
    localStorage.removeItem(STORAGE.okchimio);
    if(typeof historique !== 'undefined') try { historique = []; } catch(e) {}
    window.renderStats?.();
    if(typeof renderHistory === 'function') renderHistory();
    window.renderOkChimio?.();
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
    if(!doubleConfirm('effacer le jour du programme')) return;
    const semaine = document.getElementById('prog-semaine')?.value;
    if(!semaine) return;
    const data = readJson('chncak_programme', {});
    const active = document.querySelector('#page-programme .prog-day-btn.active');
    const day = Number((active?.id || 'day-btn-0').replace('day-btn-', '')) || 0;
    if(data[semaine]) data[semaine][day] = [];
    writeJson('chncak_programme', data);
    window.renderProgramme?.();
  };

  window.handleDashboardTeamPhoto = function(input){
    const file = input.files?.[0];
    if(!file) return;
    if(!doubleConfirm('changer la photo de l equipe')){ input.value = ''; return; }
    const reader = new FileReader();
    reader.onload = event => {
      localStorage.setItem('chncak_dashboard_team_photo', event.target.result);
      const img = document.querySelector('.dashboard-team-panel img');
      if(img) img.src = event.target.result;
      window.renderDashboard?.();
      setTimeout(() => window.renderDashboard?.(), 80);
    };
    reader.readAsDataURL(file);
    input.value = '';
  };

  function makeWorkbook(rows, sheet, filename){
    if(typeof XLSX === 'undefined') return alert('Bibliotheque Excel non chargee. Rechargez la page avec internet ou utilisez le CSV.');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, sheet);
    XLSX.writeFile(wb, filename);
  }

  function suiviRowsForExport(){
    return readJson(STORAGE.suivi, readJson('suivi', [])).map(item => ({
      'Code patient': val(item.patientCode),
      'Patient': val(item.patientName),
      'Nombre de cures': val(item.cures),
      'Traitement compliant': val(item.compliant),
      'Reponse tumorale': val(item.reponse),
      'Date debut traitement': val(item.dateDebut),
      'Date reponse': val(item.date)
    }));
  }

  window.downloadSuiviTemplate = function(){
    makeWorkbook([
      {
        'Code patient':'155M24',
        'Patient':'155M24 - Fatou Diallo',
        'Nombre de cures':3,
        'Traitement compliant':'Oui',
        'Reponse tumorale':'Reponse partielle',
        'Date debut traitement':'14/05/2026',
        'Date reponse':'14/05/2026'
      }
    ], 'Suivi', 'Modele_Suivi_Therapeutique_CHNCAK.xlsx');
  };

  window.exportSuiviExcel = function(){
    const rows = suiviRowsForExport();
    if(!rows.length) return alert('Aucun suivi a exporter.');
    makeWorkbook(rows, 'Suivi', `Suivi_Therapeutique_${new Date().toISOString().slice(0,10)}.xlsx`);
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
        const list = readJson(STORAGE.suivi, readJson('suivi', []));
        rows.forEach(row => {
          const get = (...keys) => {
            const found = Object.keys(row).find(k => keys.some(key => norm(k).includes(norm(key))));
            return found ? row[found] : '';
          };
          const code = val(get('code patient', 'code', 'dossier'));
          if(!code) return;
          list.push({
            patientCode: code,
            patientName: val(get('patient'), code),
            cures: Number(get('nombre de cures', 'cures')) || '',
            compliant: val(get('traitement compliant', 'compliant')),
            reponse: val(get('reponse tumorale', 'reponse')),
            dateDebut: val(get('date debut', 'debut')),
            date: val(get('date reponse', 'date')),
            dateTs: new Date().toISOString()
          });
        });
        writeJson(STORAGE.suivi, list);
        writeJson('suivi', list);
        window.renderSuivi?.();
        cleanupLoginAndButtons();
        alert(`${rows.length} ligne(s) importee(s) dans le suivi.`);
      } catch(e){
        alert('Erreur import suivi: ' + e.message);
      }
      input.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  window.downloadProgrammeTemplate = function(){
    makeWorkbook([
      {'DATE':'18/05/2026','N':'1','PRENOM':'FATOU','NOM':'DIALLO','CONTACT':'77 123 45 67','CHIMIOTHERAPIE':'FOLFOX','OBSERVATIONS':'','RESPONSABLE':'FATOUMATA FAYE'},
      {'DATE':'19/05/2026','N':'2','PRENOM':'MAMADOU','NOM':'SOW','CONTACT':'76 987 65 43','CHIMIOTHERAPIE':'XELOX','OBSERVATIONS':'Bilan a verifier','RESPONSABLE':'BINTA SOW'}
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
    const protoId = val(entry.protoId, (window.PROTOCOLS || []).find(p => norm(p.name) === norm(val(entry.protoName, entry.protocole, entry.protocolName)))?.id);
    if(protoId && typeof selectProto === 'function') selectProto(protoId);
    if(typeof calcSC === 'function') calcSC();
    if(typeof update === 'function') update();
    if(typeof renderApercu === 'function') renderApercu();
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
      head?.insertAdjacentHTML('beforeend', '<div id="suivi-import-final" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end"><button class="btn-secondary" onclick="downloadSuiviTemplate()">Modele Excel</button><label class="btn-secondary" style="cursor:pointer">Importer suivi<input type="file" accept=".xlsx,.xls" style="display:none" onchange="importSuiviExcel(this)"></label><button class="btn-primary" style="width:auto" onclick="exportSuiviExcel()">Exporter Excel</button></div>');
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
    if(id === 'stats') setTimeout(renderStatsFinal, 20);
    if(id === 'patients') setTimeout(() => { cleanupLoginAndButtons(); renderPatientsListFinal(); }, 20);
    if(id === 'apercu') setTimeout(installApercuSearch, 20);
    if(id === 'suivi') setTimeout(() => { renderSuiviFinal(); cleanupLoginAndButtons(); }, 80);
    if(id === 'programme') setTimeout(cleanupLoginAndButtons, 20);
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

  document.addEventListener('DOMContentLoaded', () => {
    cleanupLoginAndButtons();
    installSupportCleanupWatcher();
    const style = document.createElement('style');
    style.textContent = `
      .dashboard-photo-btn{opacity:.28!important;padding:5px 8px!important;font-size:10px!important}
      .dashboard-team-panel:hover .dashboard-photo-btn{opacity:.9!important}
      .dash-card{border-left:3px solid var(--blue);box-shadow:0 8px 20px rgba(10,61,122,.08)}
      .dash-final{display:flex;flex-direction:column;gap:14px}
      .dash-final-hero{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(240px,.8fr);gap:14px;align-items:stretch;background:#fff;border:1px solid #dbe5f2;border-radius:8px;padding:14px;box-shadow:0 10px 24px rgba(10,61,122,.08)}
      .dash-final-title{display:flex;gap:14px;align-items:center}
      .dash-final-title img{width:58px;height:58px;object-fit:contain;border:1px solid #dbe5f2;border-radius:8px;padding:5px;background:#f8fbff}
      .dash-final-title span{display:block;font-size:11px;color:#0A3D7A;font-weight:700;text-transform:uppercase}
      .dash-final-title h2{margin:2px 0;font-size:24px;color:#17324d;letter-spacing:0}
      .dash-final-title p{margin:0;color:#607080;font-size:13px;line-height:1.45;max-width:680px}
      .dash-final-photo{min-height:132px;border-radius:8px;overflow:hidden;background:#eef4fd;border:1px solid #dbe5f2;position:relative}
      .dash-final-photo img{width:100%;height:100%;min-height:132px;object-fit:cover;display:block}
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
      #logout-btn-forced{top:10px!important;right:10px!important;padding:8px 12px!important;font-size:12px!important}
      @media (max-width:900px){.dash-final-hero,.dash-final-main{grid-template-columns:1fr}.dash-final-grid{grid-template-columns:repeat(2,1fr)}}
      @media print{.protocol-print-fit{font-size:7px!important}.protocol-print-fit *{line-height:1!important}.protocol-print-fit table:first-child *{font-size:5.8px!important;line-height:.95!important}}
    `;
    document.head.appendChild(style);
    setTimeout(() => {
      if(document.getElementById('page-dashboard')?.classList.contains('active')) window.renderDashboard?.();
    }, 150);
  });

  window.chimioproSupportIdea = function(){};
})();
