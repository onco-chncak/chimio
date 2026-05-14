// ════════════════════════════════════════════════════════════
// GESTION AJOUT PROTOCOLE
// ════════════════════════════════════════════════════════════

function showAddProtocolModal() {
  showAddProtocoleModal();
}

function closeAddProtocolModal() {
  closeAddProtocoleModal();
  
  // Réinitialiser les champs médicaments
  const container = document.getElementById('drugs-container');
  if(!container) return;
  container.innerHTML = `
    <div class="drug-field" style="background:#f8f9fa;padding:15px;border-radius:6px;margin-bottom:10px;">
      <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:10px;">
        <input type="text" placeholder="Nom (ex: 5-FU 250mg)" class="drug-name" style="padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;">
        <input type="text" placeholder="Unité (mg)" class="drug-unit" style="padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;">
        <input type="number" placeholder="Dose" class="drug-coef" style="padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;">
        <select class="drug-calc" style="padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;">
          <option value="sc">Surface (m²)</option>
          <option value="poids">Poids (kg)</option>
          <option value="fix">Fixe</option>
        </select>
      </div>
    </div>
  `;
}

function addDrugField() {
  const container = document.getElementById('drugs-container');
  const newField = document.createElement('div');
  newField.className = 'drug-field';
  newField.style.cssText = 'background:#f8f9fa;padding:15px;border-radius:6px;margin-bottom:10px;position:relative;';
  newField.innerHTML = `
    <button type="button" onclick="this.parentElement.remove()" 
            style="position:absolute;top:5px;right:5px;background:#E74C3C;color:white;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:14px;line-height:1;">×</button>
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:10px;">
      <input type="text" placeholder="Nom (ex: 5-FU 250mg)" class="drug-name" style="padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;">
      <input type="text" placeholder="Unité (mg)" class="drug-unit" style="padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;">
      <input type="number" placeholder="Dose" class="drug-coef" style="padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;">
      <select class="drug-calc" style="padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;">
        <option value="sc">Surface (m²)</option>
        <option value="poids">Poids (kg)</option>
        <option value="fix">Fixe</option>
      </select>
    </div>
  `;
  container.appendChild(newField);
}

function protocolEditorField(root, id) {
  return root?.querySelector('#' + id) || document.getElementById(id);
}

function protocolEditorValue(root, id) {
  return protocolEditorField(root, id)?.value?.trim() || '';
}

function normalizeDrugForCalcul(name, unit, calc, coef) {
  const drug = {name: name, unit: unit || 'mg', hl: true};
  if (calc === 'sc') drug.mgm2 = coef;
  else if (calc === 'poids') drug.mgkg = coef;
  else drug.fix = coef;
  return drug;
}

function saveCustomProtocolDefinition(newProtocol) {
  const customProtocols = JSON.parse(localStorage.getItem('chncak_custom_protocols') || '[]');
  const idx = customProtocols.findIndex(p => p.id === newProtocol.id);
  if (idx >= 0) customProtocols[idx] = newProtocol;
  else customProtocols.push(newProtocol);
  localStorage.setItem('chncak_custom_protocols', JSON.stringify(customProtocols));
}

function refreshProtocolEditorList() {
  if (typeof renderProtos === 'function') renderProtos();
  if (typeof renderProtocols === 'function') renderProtocols();
  if (typeof renderProtoCards === 'function') renderProtoCards();
}

function saveNewProtocol(event) {
  event.preventDefault();
  const root = document.getElementById('add-protocol-modal');
  if (!root) return saveNewProtocole();
  
  // Collecter les données
  const id = protocolEditorValue(root, 'new-proto-id').toLowerCase();
  const name = protocolEditorValue(root, 'new-proto-name');
  const rythme = protocolEditorValue(root, 'new-proto-rythme');
  const indication = protocolEditorValue(root, 'new-proto-indication');
  const detail = protocolEditorValue(root, 'new-proto-detail');
  const badgeClass = protocolEditorValue(root, 'new-proto-badge-class');
  const pre = protocolEditorValue(root, 'new-proto-pre');
  const post = protocolEditorValue(root, 'new-proto-post');
  
  // Vérifier que l'ID n'existe pas déjà
  if (PROTOCOLS.find(p => p.id === id)) {
    alert('❌ Erreur : Un protocole avec cet ID existe déjà. Veuillez choisir un ID unique.');
    return;
  }
  
  // Collecter les médicaments
  const drugFields = root.querySelectorAll('.drug-field');
  const drugs = [];
  
  drugFields.forEach(field => {
    const name = field.querySelector('.drug-name').value.trim();
    const unit = field.querySelector('.drug-unit').value.trim();
    const coef = parseFloat(field.querySelector('.drug-coef').value);
    const calc = field.querySelector('.drug-calc').value;
    
    if (name && unit && coef) {
      drugs.push(normalizeDrugForCalcul(name, unit, calc, coef));
    }
  });
  
  if (drugs.length === 0) {
    alert('⚠️ Veuillez ajouter au moins un médicament.');
    return;
  }
  
  // Supports et post-chimio
  const supportsText = protocolEditorValue(root, 'new-proto-supports');
  const supports = supportsText ? supportsText.split(',').map(s => s.trim()) : [];
  
  const postChimioText = protocolEditorValue(root, 'new-proto-postchimio');
  const postChimio = postChimioText ? postChimioText.split(',').map(s => s.trim()) : [];
  
  // Créer le protocole
  const newProtocol = {
    id: id,
    name: name,
    rythme: rythme,
    indication: indication,
    detail: detail,
    badge: rythme,
    badgeClass: badgeClass,
    drugs: drugs,
    supports: supports,
    pre: pre || 'NFS',
    post: post || 'Surveillance',
    postChimio: postChimio
  };
  
  // Ajouter au tableau PROTOCOLS
  PROTOCOLS.push(newProtocol);
  
  // Sauvegarder dans localStorage pour persistance
  try {
    saveCustomProtocolDefinition(newProtocol);
  } catch(e) {
    console.error('Erreur sauvegarde:', e);
  }
  
  // Fermer le modal
  closeAddProtocolModal();
  
  // Rafraîchir l'affichage
  refreshProtocolEditorList();
  
  // Message de succès
  alert('✅ Protocole "' + name + '" ajouté avec succès !');
}

// Charger les protocoles personnalisés au démarrage
window.addEventListener('DOMContentLoaded', function() {
  try {
    const customProtocols = JSON.parse(localStorage.getItem('chncak_custom_protocols') || '[]');
    customProtocols.forEach(proto => {
      // Vérifier si pas déjà dans PROTOCOLS
      if (!PROTOCOLS.find(p => p.id === proto.id)) {
        PROTOCOLS.push(proto);
      }
    });
  } catch(e) {
    console.error('Erreur chargement protocoles personnalisés:', e);
  }
});



// ══════════════════════════════════════════════════════════════
// AJOUTER NOUVEAU PROTOCOLE
// ══════════════════════════════════════════════════════════════

function showAddProtocoleModal() {
  const root = document.getElementById('add-protocole-modal');
  root.style.display = 'block';
  
  // Reset form
  protocolEditorField(root, 'new-proto-id').value = '';
  protocolEditorField(root, 'new-proto-name').value = '';
  protocolEditorField(root, 'new-proto-rythme').value = 'J21';
  protocolEditorField(root, 'new-proto-badge-class').value = 'b21';
  protocolEditorField(root, 'new-proto-indication').value = '';
  protocolEditorField(root, 'new-proto-detail').value = '';
  protocolEditorField(root, 'new-proto-pre').value = '';
  protocolEditorField(root, 'new-proto-post').value = '';
  protocolEditorField(root, 'new-proto-drugs').value = '';
  protocolEditorField(root, 'new-proto-supports').value = '';
  protocolEditorField(root, 'new-proto-postchimio').value = '';
}

function closeAddProtocoleModal() {
  document.getElementById('add-protocole-modal').style.display = 'none';
}

function saveNewProtocole() {
  const root = document.getElementById('add-protocole-modal');
  // Récupérer les valeurs
  const id = protocolEditorValue(root, 'new-proto-id').toLowerCase();
  const name = protocolEditorValue(root, 'new-proto-name');
  const rythme = protocolEditorValue(root, 'new-proto-rythme');
  const badgeClass = protocolEditorValue(root, 'new-proto-badge-class');
  const indication = protocolEditorValue(root, 'new-proto-indication');
  const detail = protocolEditorValue(root, 'new-proto-detail');
  const pre = protocolEditorValue(root, 'new-proto-pre');
  const post = protocolEditorValue(root, 'new-proto-post');
  const drugsText = protocolEditorValue(root, 'new-proto-drugs');
  const supportsText = protocolEditorValue(root, 'new-proto-supports');
  const postChimioText = protocolEditorValue(root, 'new-proto-postchimio');
  
  // Validation
  if (!id || !name) {
    alert('⚠️ ID et Nom sont obligatoires');
    return;
  }
  
  // Vérifier si ID existe déjà
  if (PROTOCOLS.find(p => p.id === id)) {
    alert('❌ Un protocole avec cet ID existe déjà');
    return;
  }
  
  // Parser les médicaments
  const drugs = [];
  if (drugsText) {
    const lines = drugsText.split('\n').filter(l => l.trim());
    for (let line of lines) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 4) {
        const calc = parts[2] === 'fixe' ? 'fix' : parts[2];
        const dose = parseFloat(parts[3]) || 0;
        const drug = normalizeDrugForCalcul(parts[0], parts[1], calc, dose);
        if (dose <= 0) continue;
        /*
        const drug = {
          name: parts[0],
          unit: parts[1],
          calc: parts[2],
          coef: parseFloat(parts[3]) || 0
        };
        
        // Ajouter base si présente
        if (parts[4]) {
          drug.base = parts[4];
        }
        
        */
        drugs.push(drug);
      }
    }
  }
  
  if (drugs.length === 0) {
    alert('⚠️ Veuillez ajouter au moins un médicament');
    return;
  }
  
  // Parser supports
  const supports = supportsText ? supportsText.split(',').map(s => s.trim()).filter(s => s) : [];
  
  // Parser post-chimio
  const postChimio = postChimioText ? postChimioText.split(',').map(s => s.trim()).filter(s => s) : [];
  
  // Créer le protocole
  const newProto = {
    id: id,
    name: name,
    rythme: rythme,
    badge: rythme,
    badgeClass: badgeClass,
    indication: indication,
    detail: detail,
    drugs: drugs,
    supports: supports,
    pre: pre,
    post: post,
    postChimio: postChimio
  };
  
  // Ajouter au tableau PROTOCOLS
  PROTOCOLS.push(newProto);
  
  // Sauvegarder dans localStorage
  try {
    saveCustomProtocolDefinition(newProto);
  } catch(e) {
    console.log('Sauvegarde localStorage impossible');
  }
  
  // Fermer modal
  closeAddProtocoleModal();
  
  // Recharger la liste
  refreshProtocolEditorList();
  
  // Message succès
  alert('✅ Protocole "' + name + '" ajouté avec succès !\n\nVous pouvez maintenant le sélectionner dans la liste.');
  
  console.log('Nouveau protocole ajouté:', newProto);
}

// Charger les protocoles personnalisés au démarrage
(function() {
  try {
    const saved = localStorage.getItem('chncak_custom_protocols');
    if (saved) {
      const custom = JSON.parse(saved);
      // Fusionner avec PROTOCOLS existants (éviter doublons)
      custom.forEach(cp => {
        if (!PROTOCOLS.find(p => p.id === cp.id)) {
          PROTOCOLS.push(cp);
        }
      });
      console.log('Protocoles personnalisés chargés');
    }
  } catch(e) {
    console.log('Erreur chargement protocoles personnalisés:', e);
  }
})();



// Fonction pour ajouter un patient
function showAddPatientModal() {


function refuserProtocol(patientId) {
  const reason = prompt('Raison du refus (optionnel):');
  
  if (reason === null) return; // Annulé
  
  const patients = JSON.parse(localStorage.getItem('chncak_patients') || '[]');
  const idx = patients.findIndex(p => p.id === patientId);
  
  if (idx > -1) {
    // Marquer comme refusé
    patients[idx].statut = 'Refusé';
    patients[idx].refusedAt = new Date().toISOString();
    patients[idx].refusalReason = reason;
    
    localStorage.setItem('chncak_patients', JSON.stringify(patients));
    
    // Rafraîchir l'affichage
    if (typeof renderProgramme === 'function') renderProgramme();
    if (typeof renderPatients === 'function') renderPatients();
    
    alert('Patient refusé. Raison: ' + reason);
  }
}

  alert('📋 Fonction d\'ajout de patient\n\n' +
        'Pour ajouter un patient, utilisez :\n' +
        '• Le bouton d\'importation Excel\n' +
        '• Ou contactez l\'administrateur\n\n' +
        'Cette fonctionnalité sera améliorée prochainement.');
}



// Fonction envoi email générique
function sendEmailNotification(to, subject, message) {
  // IMPORTANT: Cette fonction simule l'envoi d'email
  // Pour un envoi réel, vous devez configurer un service backend (PHP, Node.js, etc.)
  
  console.log('📧 Email Notification:');
  console.log('  To:', to);
  console.log('  Subject:', subject);
  console.log('  Message:', message);
  
  // Simulation: afficher une notification à l'utilisateur
  const notification = document.createElement('div');
  notification.style.cssText = 'position:fixed;top:20px;right:20px;background:#4CAF50;color:white;padding:15px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:10001;animation:slideIn 0.3s;';
  notification.innerHTML = `
    <div style="font-weight:600;margin-bottom:5px">✉️ Email envoyé</div>
    <div style="font-size:13px">À: ${to}</div>
    <div style="font-size:12px;margin-top:5px;opacity:0.9">${subject}</div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
  
  // TODO: Implémenter l'envoi réel via API backend
  // fetch('/api/send-email', {
  //   method: 'POST',
  //   headers: {'Content-Type': 'application/json'},
  //   body: JSON.stringify({to, subject, message})
  // });
}

// Email lors du refus de protocole
function notifyProtocolRejection(protocolId, reason) {
  const protocol = JSON.parse(localStorage.getItem('chncak_protocols') || '[]')
    .find(p => p.id === protocolId);
  
  if (protocol) {
    const subject = `🚫 Protocole refusé - ${protocol.patientName}`;
    const message = `
Le médecin a refusé le protocole suivant:

Patient: ${protocol.patientName}
Dossier: ${protocol.dossier}
Protocole: ${protocol.protocolName}
Cure: ${protocol.cureNumber}
Raison du refus: ${reason || 'Non spécifiée'}

Date: ${new Date().toLocaleString('fr-FR')}
    `;
    
    // Email à l'administrateur ou au pharmacien
    sendEmailNotification('onco.chn.cak@gmail.com', subject, message);
  }
}

// Email lors de la validation de protocole
function notifyProtocolValidation(protocolId) {
  const protocol = JSON.parse(localStorage.getItem('chncak_protocols') || '[]')
    .find(p => p.id === protocolId);
  
  if (protocol) {
    const subject = `✅ Protocole validé - ${protocol.patientName}`;
    const message = `
Le protocole suivant a été validé:

Patient: ${protocol.patientName}
Dossier: ${protocol.dossier}
Protocole: ${protocol.protocolName}
Cure: ${protocol.cureNumber}
Date de validation: ${new Date().toLocaleString('fr-FR')}

Le protocole est prêt pour la préparation.
    `;
    
    // Chercher l'email du médecin
    let medecinEmail = 'medecin@chncak.sn'; // Défaut
    
    if (protocol.medecinId) {
      const medecins = JSON.parse(localStorage.getItem('chncak_medecins') || '[]');
      const medecin = medecins.find(m => m.id === protocol.medecinId);
      
      if (medecin && medecin.email) {
        medecinEmail = medecin.email;
      }
    }
    
    // Envoyer email
    sendEmailNotification(medecinEmail, subject, message);
  }
}



// Fonction aperçu protocole
function previewProtocol(protocolId) {
  const protocols = JSON.parse(localStorage.getItem('chncak_protocols') || '[]');
  const protocol = protocols.find(p => p.id === protocolId);
  
  if (!protocol) {
    alert('Protocole non trouvé');
    return;
  }
  
  // Créer modal d'aperçu
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;';
  
  const content = `
    <div style="background:white;border-radius:12px;padding:30px;max-width:700px;max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.3)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:2px solid #eee;padding-bottom:15px">
        <h2 style="margin:0;color:var(--blue);font-size:22px">👁 Aperçu du Protocole</h2>
        <button onclick="this.closest('div').parentElement.remove()" style="background:#E74C3C;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600">✕ Fermer</button>
      </div>
      
      <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin-bottom:20px">
        <h3 style="margin:0 0 15px 0;color:var(--blue);font-size:18px">Informations Patient</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:14px">
          <div><strong>Patient:</strong> ${protocol.patientName || 'N/A'}</div>
          <div><strong>Dossier:</strong> ${protocol.dossier || 'N/A'}</div>
          <div><strong>Surface:</strong> ${protocol.surface || 'N/A'} m²</div>
          <div><strong>Poids:</strong> ${protocol.poids || 'N/A'} kg</div>
          <div><strong>Taille:</strong> ${protocol.taille || 'N/A'} cm</div>
          <div><strong>IMC:</strong> ${protocol.imc || 'N/A'}</div>
        </div>
      </div>
      
      <div style="background:#E3F2FD;padding:20px;border-radius:8px;margin-bottom:20px">
        <h3 style="margin:0 0 15px 0;color:#1976D2;font-size:18px">Protocole</h3>
        <div style="font-size:14px">
          <div style="margin-bottom:8px"><strong>Nom:</strong> ${protocol.protocolName || 'N/A'}</div>
          <div style="margin-bottom:8px"><strong>Cure:</strong> ${protocol.cureNumber || 'N/A'}</div>
          <div><strong>Date:</strong> ${protocol.date ? new Date(protocol.date).toLocaleDateString('fr-FR') : 'N/A'}</div>
        </div>
      </div>
      
      <div style="background:#FFF3E0;padding:20px;border-radius:8px">
        <h3 style="margin:0 0 15px 0;color:#F57C00;font-size:18px">Médicaments</h3>
        <div style="font-size:13px">
          ${protocol.medicaments ? protocol.medicaments.map(m => `
            <div style="padding:10px;background:white;border-radius:6px;margin-bottom:8px;border-left:3px solid #F57C00">
              <strong>${m.nom}</strong>: ${m.dose} ${m.unite || 'mg'}
            </div>
          `).join('') : '<div style="color:#999">Aucun médicament</div>'}
        </div>
      </div>
      
      <div style="margin-top:20px;padding:15px;background:#E8F5E9;border-radius:8px;text-align:center">
        <div style="font-size:13px;color:#2E7D32">
          <strong>Note:</strong> Ceci est un aperçu. Cliquez sur "Valider" pour approuver le protocole.
        </div>
      </div>
    </div>
  `;
  
  modal.innerHTML = content;
  document.body.appendChild(modal);
  
  // Fermer en cliquant sur le fond
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}



// Fonction pour sauvegarder un protocole dans OK Chimio
function saveProtocol() {
  // Récupérer données du formulaire (vrais IDs)
  const nom = document.getElementById('nom')?.value || '';
  const prenom = document.getElementById('prenom')?.value || '';
  const dossier = document.getElementById('dossier')?.value || '';
  const poids = document.getElementById('poids')?.value || '';
  const taille = document.getElementById('taille')?.value || '';
  const dateProto = document.getElementById('date-protocole')?.value || '';
  
  // Protocole sélectionné (chercher dans différents endroits possibles)
  let protocolName = '';
  const protoSelect = document.getElementById('protocol-select') || 
                      document.getElementById('ligne-traitement') ||
                      document.querySelector('[name="protocole"]');
  
  if (protoSelect) {
    protocolName = protoSelect.value || protoSelect.textContent || '';
  }
  
  // Nom complet patient
  const patientName = (prenom + ' ' + nom).trim();
  
  // Validation
  if (!patientName || !dossier) {
    alert('❌ Veuillez remplir au minimum: Nom/Prénom et Dossier');
    return;
  }
  
  // Calculer surface corporelle si poids et taille disponibles
  let surface = 0;
  if (poids && taille) {
    const p = parseFloat(poids);
    const t = parseFloat(taille) / 100; // cm → m
    surface = Math.sqrt((p * t) / 3600);
    surface = Math.round(surface * 100) / 100; // 2 décimales
  }
  
  // Créer objet protocole (structure compatible renderOkChimio)
  const newProtocol = {
    id: Date.now(),
    patient: {
      nom: nom,
      prenom: prenom,
      dossier: dossier
    },
    protocole: protocolName || 'À définir',
    cure: '1',
    date: dateProto || new Date().toISOString().split('T')[0],
    surface: surface,
    poids: parseFloat(poids) || 0,
    taille: parseFloat(taille) || 0,
    medecin: 'À assigner',
    medicaments: [],
    statut: 'En attente',
    dateCreation: new Date().toISOString()
  };
  
  // Sauvegarder dans localStorage
  const protocols = JSON.parse(localStorage.getItem('chncak_protocols') || '[]');
  protocols.push(newProtocol);
  localStorage.setItem('chncak_protocols', JSON.stringify(protocols));
  
  console.log('✓ Protocole sauvegardé:', newProtocol);
  
  
  
  // Envoyer email au médecin si renseigné
  const medecinEmail = document.getElementById('medecin-email')?.value?.trim();
  if (medecinEmail && medecinEmail.includes('@')) {
    sendEmailNotification(
      medecinEmail,
      'Nouveau protocole de chimiothérapie',
      `Un nouveau protocole a été créé pour ${patientName} (${dossier}).\n\nProtocole: ${protocolName}\nDate: ${dateProto}\n\nCordialement,\nService Oncologie CHNCAK`
    );
    console.log('✓ Email envoyé au médecin:', medecinEmail);
  }alert('✅ Protocole sauvegardé avec succès !\n\nPatient: ' + patientName + '\nDossier: ' + dossier + '\n\nIl apparaît maintenant dans OK Chimio.');
  
  // Rafraîchir OK Chimio si la fonction existe
  if (typeof renderOkChimio === 'function') {
    renderOkChimio();
  }
}



// Fonction pour vider la session (utile si l'écran login saute)
function clearSession() {
  localStorage.removeItem('chncak_currentUser');
  alert('Session vidée ! La page va se recharger.');
  location.reload();
}


// Ajouter médecin depuis formulaire (sans prompts)
function addMedecinFromForm() {
  const nom = document.getElementById('med-nom-input')?.value?.trim();
  const prenom = document.getElementById('med-prenom-input')?.value?.trim();
  const specialite = document.getElementById('med-specialite-input')?.value?.trim();
  const email = document.getElementById('med-email-input')?.value?.trim();
  const contact = document.getElementById('med-contact-input')?.value?.trim();
  
  if (!nom || !prenom) {
    alert('❌ Veuillez remplir au minimum le nom et le prénom');
    return;
  }
  
  const medecins = JSON.parse(localStorage.getItem('chncak_medecins') || '[]');
  
  const newMedecin = {
    id: 'med_' + Date.now(),
    nom: nom,
    prenom: prenom,
    specialite: specialite || 'Non spécifié',
    email: email || '',
    contact: contact || '',
    dateAjout: new Date().toISOString()
  };
  
  medecins.push(newMedecin);
  localStorage.setItem('chncak_medecins', JSON.stringify(medecins));
  
  console.log('✓ Médecin ajouté:', newMedecin);
  
  alert('✅ Médecin ajouté avec succès !');
  
  // Vider formulaire
  document.getElementById('med-nom-input').value = '';
  document.getElementById('med-prenom-input').value = '';
  document.getElementById('med-specialite-input').value = '';
  document.getElementById('med-email-input').value = '';
  document.getElementById('med-contact-input').value = '';
  
  toggleAddMedForm();
  
  if (typeof renderMedecins === 'function') {
    renderMedecins();
  }
}


// Imprimer rapport statistiques
function printStats() {
  const protocols = JSON.parse(localStorage.getItem('chncak_protocols') || '[]');
  const patients = JSON.parse(localStorage.getItem('chncak_patients') || '[]');
  const medecins = JSON.parse(localStorage.getItem('chncak_medecins') || '[]');
  
  const stats = {
    protocoles: protocols.length,
    patientsTotal: patients.length,
    patientsTraites: patients.filter(p => p.statut === 'Traité' || p.statut === 'Terminé').length,
    patientsEnCours: patients.filter(p => p.statut === 'En cours').length,
    medecins: medecins.length
  };
  
  const typesProtocoles = {};
  protocols.forEach(p => {
    const proto = p.protocole || 'Non spécifié';
    typesProtocoles[proto] = (typesProtocoles[proto] || 0) + 1;
  });
  
  const printWindow = window.open('', '', 'width=800,height=600');
  printWindow.document.write(`
    <html>
    <head>
      <title>Rapport Statistiques - CHNCAK</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #0A3D7A; border-bottom: 3px solid #0A3D7A; padding-bottom: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
        .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 32px; font-weight: bold; color: #0A3D7A; }
        .stat-label { font-size: 14px; color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #0A3D7A; color: white; }
        .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>📊 Rapport Statistiques Service Oncologie</h1>
      <p><strong>CHNCAK Touba</strong> • Date: ${new Date().toLocaleDateString('fr-FR')}</p>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.protocoles}</div>
          <div class="stat-label">Protocoles</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.patientsTotal}</div>
          <div class="stat-label">Patients total</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.patientsEnCours}</div>
          <div class="stat-label">En cours</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.patientsTraites}</div>
          <div class="stat-label">Traités</div>
        </div>
      </div>
      
      <h2>Types de Chimiothérapie</h2>
      <table>
        <thead>
          <tr><th>Protocole</th><th>Nombre</th></tr>
        </thead>
        <tbody>
          ${Object.entries(typesProtocoles).map(([type, count]) => 
            `<tr><td>${type}</td><td>${count}</td></tr>`
          ).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        ChimioPro v3 - Service Oncologie-Radiothérapie CHNCAK
      </div>
      
      <script>
        window.onload = () => window.print();
      <\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// Effacer historique
function clearHistory() {
  if (confirm('⚠️ Voulez-vous vraiment effacer tout l\'historique ?\n\nCette action est irréversible.')) {
    localStorage.removeItem('chncak_historique');
    alert('✅ Historique effacé');
    
    // Rafraîchir Stats si visible
    if (typeof renderStats === 'function') {
      renderStats();
    }
  }
}


// Effacer historique
function clearHistory() {
  if (!confirm('⚠️ Êtes-vous sûr de vouloir effacer tout l\'historique ?\n\nCette action est irréversible !')) {
    return;
  }
  
  // Effacer localStorage
  const keysToKeep = ['chncak_user', 'chncak_medecins', 'chncak_patients', 'chncak_protocols'];
  const allKeys = Object.keys(localStorage);
  
  allKeys.forEach(key => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  });
  
  alert('✅ Historique effacé avec succès !');
  
  // Rafraîchir Stats
  if (typeof renderStats === 'function') {
    renderStats();
  }
}


// Forcer affichage bouton déconnexion
setInterval(() => {
  const user = localStorage.getItem('chncak_user');
  const logoutBtn = document.getElementById('logout-button');
  const loginScreen = document.getElementById('login-screen');
  
  if (user && logoutBtn && loginScreen) {
    const loginVisible = window.getComputedStyle(loginScreen).display !== 'none';
    
    if (!loginVisible) {
      // Utilisateur connecté
      logoutBtn.style.display = 'block';
      logoutBtn.style.visibility = 'visible';
      logoutBtn.style.opacity = '1';
    }
  }
}, 500);


// Créer bouton déconnexion visible GARANTI
function createLogoutButton() {
  // Supprimer ancien si existe
  const old = document.getElementById('logout-btn-forced');
  if (old) old.remove();
  
  // Créer nouveau bouton
  const btn = document.createElement('button');
  btn.id = 'logout-btn-forced';
  btn.textContent = '🚪 Déconnexion';
  btn.onclick = logout;
  
  // Style GARANTI visible
  btn.style.position = 'fixed';
  btn.style.top = '20px';
  btn.style.right = '20px';
  btn.style.zIndex = '999999';
  btn.style.background = '#E74C3C';
  btn.style.color = 'white';
  btn.style.border = 'none';
  btn.style.padding = '12px 24px';
  btn.style.borderRadius = '6px';
  btn.style.cursor = 'pointer';
  btn.style.fontWeight = '700';
  btn.style.fontSize = '14px';
  btn.style.boxShadow = '0 4px 12px rgba(231,76,60,0.4)';
  btn.style.transition = 'all 0.2s';
  
  // Effet hover
  btn.onmouseover = () => {
    btn.style.background = '#C0392B';
    btn.style.transform = 'translateY(-2px)';
    btn.style.boxShadow = '0 6px 16px rgba(231,76,60,0.5)';
  };
  btn.onmouseout = () => {
    btn.style.background = '#E74C3C';
    btn.style.transform = 'translateY(0)';
    btn.style.boxShadow = '0 4px 12px rgba(231,76,60,0.4)';
  };
  
  // Ajouter au body
  document.body.appendChild(btn);
  
  console.log('✅ Bouton déconnexion créé et ajouté au DOM');
}
