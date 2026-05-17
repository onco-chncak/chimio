/* ============================================================
   DATA
============================================================ */
const DOSE_LIMITS = {
  'OXALIPLATINE':{max:750,warn:680},
  'DOXORUBICINE':{max:150,warn:120,cumul:550},
  'CYCLOPHOSPHAMIDE':{max:1800,warn:1500},
  'ÉPIRUBICINE':{max:150,warn:120,cumul:900},
  'CISPLATINE':{max:200,warn:150},
  'CISPLATINE HEBDO':{max:120,warn:100},
  'TAXOL HEBDO':{max:350,warn:300},
  'TAXOL (Paclitaxel)':{max:350,warn:300},
  'CARBOPLATINE':{max:900,warn:750},
  'GEMCITABINE':{max:2000,warn:1800},
  'TAXOTÈRE (Docétaxel)':{max:200,warn:170},
  'IRINOTÉCAN':{max:600,warn:500},
  'AVASTIN (Bévacizumab)':{max:2000,warn:1500},
};

const PROTOCOLS = [
  {
    id:'xelox', name:'XELOX', rythme:'J1=J21',
    detail:'Oxaliplatine 130 mg/m² J1 + Capécitabine 1000 mg/m² ×2/j J1–J14',
    badge:'J1=J21', badgeClass:'b21', hasCape:true,
    drugs:[
      {t:'r',label:'Réhydratation 500 cc SSI 0.9%',dur:'30 mn'},
      {name:'Hydrocortisone',fix:200,unit:'mg',sol:'10 cc SSI 0.9%',dur:'5 mn',ryt:'J1=J21'},
      {name:'Kytril',fix:3,unit:'mg',sol:'5 cc SSI 0.9%',dur:'2 mn',ryt:'J1=J21'},
      {t:'r',label:'Rinçage 250 cc SSI 0.9%',dur:'15 mn'},
      {name:'Magnésium 10%',fix:'2 amp',sol:'250 cc G5%',dur:'30 mn',ryt:'J1=J21'},
      {name:'Calcium 10%',fix:'2 amp',sol:'(avec Mg)',dur:'—',ryt:'J1=J21'},
      {t:'r',label:'Rinçage 250 cc SSI 0.9%',dur:'10 mn'},
      {name:'OXALIPLATINE',mgm2:130,unit:'mg',sol:'500 cc G5%',dur:'60 mn',ryt:'J1=J21',hl:true},
      {t:'r',label:'Réhydratation 500 cc SSI 0.9%',dur:'30 mn'},
      {name:'Capécitabine per os',mgm2:1000,unit:'mg',sol:'—',dur:'J1–J14',ryt:'J1=J21',hl:true,oral:true,capeQty:1000},
    ]
  },
  {
    id:'ac60', name:'AC 60 Dose-dense', rythme:'J1=J15',
    detail:'Doxorubicine 60 mg/m² + Cyclophosphamide 600 mg/m²',
    badge:'J1=J15', badgeClass:'b15',
    drugs:[
      {t:'r',label:'Réhydratation 250 cc SSI 0.9%',dur:'30 mn'},
      {name:'Hydrocortisone',fix:200,unit:'mg',sol:'50 cc SSI 0.9%',dur:'10 mn',ryt:'J1=J15'},
      {name:'Kytril',fix:3,unit:'mg',sol:'15 cc SSI 0.9%',dur:'2 mn',ryt:'J1=J15'},
      {name:'DOXORUBICINE',mgm2:60,unit:'mg',sol:'100 cc SSI 0.9%',dur:'15 mn',ryt:'J1=J15',hl:true,note:'Protéger contre la lumière'},
      {t:'r',label:'Rinçage 250 cc SSI 0.9%',dur:'30 mn'},
      {name:'CYCLOPHOSPHAMIDE',mgm2:600,unit:'mg',sol:'250 cc G5%',dur:'60 mn',ryt:'J1=J15',hl:true},
      {t:'r',label:'Rinçage 500 cc SSI 0.9%',dur:'30 mn'},
    ]
  },
  {
    id:'ecx', name:'ECX', rythme:'J1=J21',
    detail:'Épirubicine 50 + Cisplatine 60 + Capécitabine 625 mg/m²',
    badge:'J1=J21', badgeClass:'b21', hasCape:true,
    drugs:[
      {t:'r',label:'Réhydratation 500 cc SSI 0.9%',dur:'30 mn'},
      {name:'Hydrocortisone',fix:200,unit:'mg',sol:'20 cc SSI 0.9%',dur:'5 mn',ryt:'J1=J21'},
      {name:'Kytril',fix:3,unit:'mg',sol:'15 cc SSI 0.9%',dur:'2 mn',ryt:'J1=J21'},
      {name:'Magnésium 10%',fix:'2 amp',sol:'250 cc G5%',dur:'15 mn',ryt:'J1=J21'},
      {name:'Calcium 10%',fix:'2 amp',sol:'(avec Mg)',dur:'—',ryt:'J1=J21'},
      {name:'ÉPIRUBICINE',mgm2:50,unit:'mg',sol:'100 cc SSI 0.9%',dur:'30 mn',ryt:'J1=J21',hl:true},
      {t:'r',label:'Rinçage 250 cc SSI 0.9%',dur:'15 mn'},
      {name:'CISPLATINE',mgm2:60,unit:'mg',sol:'250 cc G5%',dur:'30 mn',ryt:'J1=J21',hl:true},
      {t:'r',label:'Réhydratation 500 cc SSI 0.9%',dur:'30 mn'},
      {name:'Capécitabine per os',mgm2:625,unit:'mg',sol:'—',dur:'J1–J14 continu',ryt:'J1=J21',hl:true,oral:true,capeQty:625},
    ]
  },
  {
    id:'folfox', name:'FOLFOX4', rythme:'J1=J14',
    detail:'Oxaliplatine 85 mg/m² + LV 200 mg/m² + 5-FU 400 bolus + 600 mg/m² perf 22h',
    badge:'J1=J14', badgeClass:'b14',
    drugs:[
      {t:'r',label:'Réhydratation 500 cc SSI 0.9%',dur:'30 mn'},
      {name:'Hydrocortisone',fix:200,unit:'mg',sol:'10 cc SSI',dur:'5 mn',ryt:'J1,J2'},
      {name:'Kytril',fix:3,unit:'mg',sol:'5 cc SSI 0.9%',dur:'2 mn',ryt:'J1,J2'},
      {name:'Magnésium 10%',fix:'2 amp',sol:'250 cc G5%',dur:'30 mn',ryt:'J1'},
      {name:'Calcium 10%',fix:'2 amp',sol:'(avec Mg)',dur:'—',ryt:'J1'},
      {name:'OXALIPLATINE',mgm2:85,unit:'mg',sol:'250 cc G5%',dur:'120 mn',ryt:'J1',hl:true},
      {name:'LEUCOVORINE (LV)',mgm2:200,unit:'mg',sol:'250 cc G5%',dur:'120 mn',ryt:'J1,J2',hl:true},
      {name:'5-FLUOROURACILE bolus',mgm2:400,unit:'mg',sol:'100 cc SSI',dur:'5 mn',ryt:'J1,J2',hl:true},
      {name:'5-FLUOROURACILE perfusion',mgm2:600,unit:'mg',sol:'500 cc SSI',dur:'22h',ryt:'J1,J2',hl:true},
      {t:'r',label:'Rinçage 250 cc SSI 0.9%',dur:'30 mn'},
    ]
  },
  {
    id:'carbo_taxol', name:'Carbo-Taxol', rythme:'J1=J21',
    detail:'Carboplatine AUC (Calvert) + Paclitaxel 80 mg/m² J1, J8',
    badge:'J1=J21', badgeClass:'b21', hasCarbo:true,
    drugs:[
      {t:'r',label:'Réhydratation 500 cc SSI 0.9%',dur:'30 mn'},
      {name:'Hydrocortisone',fix:200,unit:'mg',sol:'10 cc SSI',dur:'5 mn',ryt:'J1, J8'},
      {name:'Kytril',fix:3,unit:'mg',sol:'5 cc SSI 0.9%',dur:'2 mn',ryt:'J1, J8'},
      {t:'r',label:'Rinçage 250 cc SSI 0.9%',dur:'15 mn'},
      {name:'TAXOL (Paclitaxel)',mgm2:80,unit:'mg',sol:'500 cc SSI 0.9%',dur:'60 mn',ryt:'J1, J8',hl:true},
      {t:'r',label:'Rinçage 250 cc SSI 0.9%',dur:'15 mn'},
      {name:'CARBOPLATINE',carbo:true,unit:'mg',sol:'500 cc G5%',dur:'60 mn',ryt:'J1 et J21',hl:true},
      {t:'r',label:'Rinçage 500 cc SSI 0.9%',dur:'30 mn'},
    ]
  },
  {
    id:'gemcitabine', name:'Gemcitabine mono', rythme:'J1=J28',
    detail:'Gemcitabine 1000 mg/m² J1, J8, J15',
    badge:'J1=J28', badgeClass:'b28',
    drugs:[
      {t:'r',label:'Réhydratation 500 cc SSI 0.9%',dur:'30 mn'},
      {name:'Hydrocortisone',fix:200,unit:'mg',sol:'50 cc SSI 0.9%',dur:'10 mn',ryt:'J1, J8, J15'},
      {name:'Kytril',fix:3,unit:'mg',sol:'15 cc SSI 0.9%',dur:'2 mn',ryt:'J1, J8, J15'},
      {name:'GEMCITABINE',mgm2:1000,unit:'mg',sol:'250 cc SSI 0.9%',dur:'30 mn',ryt:'J1, J8, J15',hl:true,note:'Protéger contre la lumière'},
      {t:'r',label:'Rinçage 500 cc SSI 0.9%',dur:'30 mn'},
    ]
  },
  {
    id:'gemox', name:'GEMOX', rythme:'J1=J14',
    detail:'Gemcitabine 1000 mg/m² + Oxaliplatine 100 mg/m² J1, J14',
    badge:'J1=J14', badgeClass:'b14',
    drugs:[
      {t:'r',label:'Réhydratation 500 cc SSI 0.9%',dur:'30 mn'},
      {name:'Hydrocortisone',fix:200,unit:'mg',sol:'10 cc SSI',dur:'5 mn',ryt:'J1, J14'},
      {name:'Kytril',fix:3,unit:'mg',sol:'5 cc SSI 0.9%',dur:'2 mn',ryt:'J1, J14'},
      {t:'r',label:'Rinçage 100 cc SSI 0.9%',dur:'10 mn'},
      {name:'GEMCITABINE',mgm2:1000,unit:'mg',sol:'250 cc G5%',dur:'30 mn',ryt:'J1, J14',hl:true,note:'Protéger contre la lumière'},
      {name:'OXALIPLATINE',mgm2:100,unit:'mg',sol:'250 cc G5%',dur:'120 mn',ryt:'J1, J14',hl:true},
      {t:'r',label:'Réhydratation 500 cc SSI 0.9%',dur:'30 mn'},
    ]
  },
  {
    id:'taxotere', name:'Taxotère (TXT)', rythme:'J1=J21',
    detail:'Docétaxel 75 mg/m² J1 toutes les 3 semaines',
    badge:'J1=J21', badgeClass:'b21',
    drugs:[
      {t:'r',label:'Réhydratation 500 cc SSI 0.9%',dur:'30 mn'},
      {name:'Hydrocortisone',fix:200,unit:'mg',sol:'10 cc SSI',dur:'5 mn',ryt:'J1=J21'},
      {name:'Kytril',fix:3,unit:'mg',sol:'15 cc SSI 0.9%',dur:'2 mn',ryt:'J1=J21'},
      {name:'TAXOTÈRE (Docétaxel)',mgm2:75,unit:'mg',sol:'250 cc SSI 0.9%',dur:'60 mn',ryt:'J1=J21',hl:true},
      {t:'r',label:'Réhydratation 500 cc SSI 0.9%',dur:'30 mn'},
    ]
  },
  {
    id:'xeliri', name:'XELIRI + Avastin', rythme:'J1=J21',
    detail:'Irinotécan 240 mg/m² + Avastin 15 mg/kg + Capécitabine 2000 mg/m²',
    badge:'J1=J21', badgeClass:'b21', hasCape:true,
    drugs:[
      {t:'r',label:'Réhydratation 500 cc SSI 0.9%',dur:'30 mn'},
      {name:'Hydrocortisone',fix:200,unit:'mg',sol:'10 cc SSI',dur:'5 mn',ryt:'J1=J21'},
      {name:'Kytril',fix:3,unit:'mg',sol:'5 cc SSI 0.9%',dur:'2 mn',ryt:'J1=J21'},
      {name:'Magnésium 10%',fix:'2 amp',sol:'250 cc G5%',dur:'30 mn',ryt:'J1=J21'},
      {name:'Calcium 10%',fix:'2 amp',sol:'(avec Mg)',dur:'—',ryt:'J1=J21'},
      {name:'IRINOTÉCAN',mgm2:240,unit:'mg',sol:'500 cc G5%',dur:'60 mn',ryt:'J1=J21',hl:true},
      {name:'AVASTIN (Bévacizumab)',avastin:true,unit:'mg',sol:'250 cc SSI 0.9%',dur:'2 mn',ryt:'J1=J21',hl:true},
      {t:'r',label:'Réhydratation 500 cc SSI 0.9%',dur:'30 mn'},
      {name:'Capécitabine per os',mgm2:2000,unit:'mg',sol:'—',dur:'J2–J14',ryt:'J1=J21',hl:true,oral:true,capeQty:2000},
    ]
  },
  // â”€â”€ NOUVEAU : Carbo-Taxol 175 mg/m² J1=J21 (col utérin, ovaire) â”€â”€
  {
    id:'carbo_taxol175', name:'Carbo-Taxol 175', rythme:'J1=J21',
    detail:'Carboplatine AUC5 (Calvert) J1 + Paclitaxel 175 mg/m² J1',
    badge:'J1=J21', badgeClass:'b21', hasCarbo:true,
    drugs:[
      {t:'r',label:'Rinçage 400 cc SSI 0.9%',dur:'30 mn'},
      {name:'Hydrocortisone',fix:200,unit:'mg',sol:'20 cc SSI 0.9%',dur:'5 mn',ryt:'J1=J21'},
      {name:'Kytril',fix:3,unit:'mg',sol:'15 cc SSI 0.9%',dur:'2 mn',ryt:'J1=J21'},
      {t:'r',label:'Rinçage 100 cc SSI 0.9%',dur:'15 mn'},
      {name:'TAXOL (Paclitaxel)',mgm2:175,unit:'mg',sol:'250 cc SSI 0.9%',dur:'60 mn',ryt:'J1=J21',hl:true},
      {t:'r',label:'Rinçage 100 cc SSI 0.9%',dur:'30 mn'},
      {name:'CARBOPLATINE',carbo:true,unit:'mg',sol:'250 cc G5%',dur:'60 mn',ryt:'J1=J21',hl:true},
      {t:'r',label:'Rinçage 500 cc SSI 0.9%',dur:'30 mn'},
    ]
  },
  // â”€â”€ NOUVEAU : AC 60 J1=J21 (rythme 3 semaines, non dose-dense) â”€â”€
  {
    id:'ac60_j21', name:'AC 60 J1=J21', rythme:'J1=J21',
    detail:'Doxorubicine 60 mg/m² + Cyclophosphamide 600 mg/m² J1=J21',
    badge:'J1=J21', badgeClass:'b21',
    drugs:[
      {t:'r',label:'Réhydratation 250 cc SSI 0.9%',dur:'30 mn'},
      {name:'Hydrocortisone',fix:200,unit:'mg',sol:'50 cc SSI 0.9%',dur:'10 mn',ryt:'J1=J21'},
      {name:'Kytril',fix:3,unit:'mg',sol:'15 cc SSI 0.9%',dur:'2 mn',ryt:'J1=J21'},
      {name:'DOXORUBICINE',mgm2:60,unit:'mg',sol:'100 cc SSI 0.9%',dur:'15 mn',ryt:'J1=J21',hl:true,note:'Protéger contre la lumière'},
      {t:'r',label:'Rinçage 250 cc SSI 0.9%',dur:'30 mn'},
      {name:'CYCLOPHOSPHAMIDE',mgm2:600,unit:'mg',sol:'250 cc G5%',dur:'60 mn',ryt:'J1=J21',hl:true},
      {t:'r',label:'Rinçage 500 cc SSI 0.9%',dur:'30 mn'},
    ]
  },
  // â”€â”€ NOUVEAU : MAP J1=J36 (Ostéosarcome) â”€â”€
  {
    id:'map', name:'MAP', rythme:'J1=J36',
    detail:'Cisplatine 60 mg/m² + Doxorubicine 37,5 mg/m² J1,J2 + Méthotrexate 20 mg/m² J29,J36',
    badge:'J1=J36', badgeClass:'b28',
    drugs:[
      {t:'r',label:'Rinçage 400 cc SSI 0.9%',dur:'30 mn'},
      {name:'Hydrocortisone',fix:200,unit:'mg',sol:'20 cc SSI 0.9%',dur:'5 mn',ryt:'J1,J2,J29,J36'},
      {name:'Kytril',fix:3,unit:'mg',sol:'15 cc SSI 0.9%',dur:'2 mn',ryt:'J1,J2,J29,J36'},
      {name:'CISPLATINE',mgm2:60,unit:'mg',sol:'500 cc SSI 0.9%',dur:'60 mn + rinçage',ryt:'J1 ET J2',hl:true},
      {name:'DOXORUBICINE',mgm2:37.5,unit:'mg',sol:'250 cc SSI 0.9%',dur:'60 mn + rinçage',ryt:'J1 ET J2',hl:true,note:'Protéger contre la lumière'},
      {name:'MÉTHOTREXATE',mgm2:20,unit:'mg',sol:'50 cc SSI 0.9%',dur:'10 mn + rinçage',ryt:'J29 et J36',hl:true},
      {name:'Acide folinique',fix:'20 mg',sol:'—',dur:'12h après MTX',ryt:'J29 à J36'},
    ]
  },
  {
    id:'folfiri', name:'FOLFIRI', rythme:'J1=J14',
    detail:'Irinotécan 180 mg/m² + LV 400 mg/m² + 5-FU 400 bolus + 2400 mg/m² perf 46h',
    badge:'J1=J14', badgeClass:'b14',
    drugs:[
      {t:'r',label:'Réhydratation 500 cc SSI 0.9%',dur:'30 mn'},
      {name:'Hydrocortisone',fix:200,unit:'mg',sol:'10 cc SSI',dur:'5 mn',ryt:'J1'},
      {name:'Kytril',fix:3,unit:'mg',sol:'5 cc SSI 0.9%',dur:'2 mn',ryt:'J1'},
      {name:'IRINOTÉCAN',mgm2:180,unit:'mg',sol:'500 cc G5%',dur:'90 mn',ryt:'J1',hl:true},
      {name:'LEUCOVORINE (LV)',mgm2:400,unit:'mg',sol:'250 cc G5%',dur:'120 mn',ryt:'J1',hl:true},
      {name:'5-FLUOROURACILE bolus',mgm2:400,unit:'mg',sol:'100 cc SSI',dur:'5 mn',ryt:'J1',hl:true},
      {name:'5-FLUOROURACILE perfusion',mgm2:2400,unit:'mg',sol:'500 cc SSI',dur:'46h',ryt:'J1',hl:true},
      {t:'r',label:'Rinçage 250 cc SSI 0.9%',dur:'30 mn'},
    ]
  },
  // â”€â”€ ABVD (Lymphome de Hodgkin) â”€â”€
  {
    id:'abvd', name:'ABVD', rythme:'J1=J28',
    detail:'Doxorubicine 25 mg/m² + Bléomycine 10 UI/m² + Vinblastine 6 mg/m² + Dacarbazine 375 mg/m²',
    badge:'J1=J28', badgeClass:'b28',
    drugs:[
      {t:'r',label:'Réhydratation 250 cc SSI 0.9%',dur:'30 mn'},
      {name:'Hydrocortisone',fix:200,unit:'mg',sol:'20 cc SSI 0.9%',dur:'5 mn',ryt:'J1,J15'},
      {name:'Kytril',fix:3,unit:'mg',sol:'15 cc SSI 0.9%',dur:'2 mn',ryt:'J1,J15'},
      {name:'DOXORUBICINE',mgm2:25,unit:'mg',sol:'100 cc SSI 0.9%',dur:'15 mn',ryt:'J1,J15',hl:true,note:'Protéger contre la lumière'},
      {t:'r',label:'Rinçage 100 cc SSI 0.9%',dur:'10 mn'},
      {name:'BLÉOMYCINE',mgm2:10,unit:'UI',sol:'100 cc SSI 0.9%',dur:'10 mn',ryt:'J1,J15',hl:true},
      {t:'r',label:'Rinçage 100 cc SSI 0.9%',dur:'10 mn'},
      {name:'VINBLASTINE',mgm2:6,unit:'mg',sol:'50 cc SSI 0.9%',dur:'10 mn',ryt:'J1,J15',hl:true},
      {t:'r',label:'Rinçage 100 cc SSI 0.9%',dur:'10 mn'},
      {name:'DACARBAZINE',mgm2:375,unit:'mg',sol:'250 cc G5%',dur:'30 mn',ryt:'J1,J15',hl:true,note:'Protéger strictement de la lumière'},
      {t:'r',label:'Réhydratation 250 cc SSI 0.9%',dur:'30 mn'},
    ]
  },
  // â”€â”€ BEP (Tumeurs germinales) â”€â”€
  {
    id:'bep', name:'BEP', rythme:'J1=J21',
    detail:'Bléomycine 30 UI J1,J8,J15 + Étoposide 100 mg/m² J1-J5 + Cisplatine 20 mg/m² J1-J5',
    badge:'J1=J21', badgeClass:'b21',
    drugs:[
      {t:'r',label:'Réhydratation 500 cc SSI 0.9%',dur:'30 mn'},
      {name:'Hydrocortisone',fix:200,unit:'mg',sol:'20 cc SSI 0.9%',dur:'5 mn',ryt:'J1-J5,J8,J15'},
      {name:'Kytril',fix:3,unit:'mg',sol:'15 cc SSI 0.9%',dur:'2 mn',ryt:'J1-J5,J8,J15'},
      {name:'ÉTOPOSIDE',mgm2:100,unit:'mg',sol:'250 cc SSI 0.9%',dur:'60 mn',ryt:'J1-J5',hl:true},
      {t:'r',label:'Rinçage 250 cc SSI 0.9%',dur:'15 mn'},
      {name:'CISPLATINE',mgm2:20,unit:'mg',sol:'250 cc G5%',dur:'30 mn',ryt:'J1-J5',hl:true},
      {t:'r',label:'Réhydratation 500 cc SSI 0.9%',dur:'30 mn'},
      {name:'BLÉOMYCINE',fix:30,unit:'UI',sol:'100 cc SSI 0.9%',dur:'10 mn',ryt:'J1,J8,J15',hl:true},
    ]
  },
  // â”€â”€ CHOP (Lymphome non-Hodgkinien) â”€â”€
  {
    id:'chop', name:'CHOP', rythme:'J1=J21',
    detail:'Cyclophosphamide 750 mg/m² + Doxorubicine 50 mg/m² + Vincristine 1,4 mg/m² + Prednisone 100mg J1-J5',
    badge:'J1=J21', badgeClass:'b21',
    drugs:[
      {t:'r',label:'Réhydratation 250 cc SSI 0.9%',dur:'30 mn'},
      {name:'Hydrocortisone',fix:200,unit:'mg',sol:'20 cc SSI 0.9%',dur:'5 mn',ryt:'J1=J21'},
      {name:'Kytril',fix:3,unit:'mg',sol:'15 cc SSI 0.9%',dur:'2 mn',ryt:'J1=J21'},
      {name:'CYCLOPHOSPHAMIDE',mgm2:750,unit:'mg',sol:'250 cc G5%',dur:'60 mn',ryt:'J1=J21',hl:true},
      {t:'r',label:'Rinçage 250 cc SSI 0.9%',dur:'15 mn'},
      {name:'DOXORUBICINE',mgm2:50,unit:'mg',sol:'100 cc SSI 0.9%',dur:'15 mn',ryt:'J1=J21',hl:true,note:'Protéger contre la lumière'},
      {t:'r',label:'Rinçage 100 cc SSI 0.9%',dur:'10 mn'},
      {name:'VINCRISTINE',mgm2:1.4,unit:'mg',sol:'50 cc SSI 0.9%',dur:'10 mn',ryt:'J1=J21',hl:true,note:'Dose max 2 mg'},
      {t:'r',label:'Rinçage 250 cc SSI 0.9%',dur:'15 mn'},
      {name:'Prednisone per os',fix:'100 mg/j',sol:'—',dur:'J1–J5',ryt:'J1=J21'},
    ]
  },
  // â”€â”€ R-CHOP (LNH CD20+) â”€â”€
  {
    id:'rchop', name:'R-CHOP', rythme:'J1=J21',
    detail:'Rituximab 375 mg/m² + CHOP standard',
    badge:'J1=J21', badgeClass:'b21',
    drugs:[
      {t:'r',label:'Réhydratation 250 cc SSI 0.9%',dur:'30 mn'},
      {name:'Hydrocortisone',fix:200,unit:'mg',sol:'20 cc SSI 0.9%',dur:'5 mn',ryt:'J1=J21'},
      {name:'Kytril',fix:3,unit:'mg',sol:'15 cc SSI 0.9%',dur:'2 mn',ryt:'J1=J21'},
      {name:'RITUXIMAB',mgm2:375,unit:'mg',sol:'500 cc SSI 0.9%',dur:'120-240 mn',ryt:'J1=J21',hl:true,note:'1ère perf 120 mn, suivantes 60 mn'},
      {t:'r',label:'Rinçage 250 cc SSI 0.9%',dur:'30 mn'},
      {name:'CYCLOPHOSPHAMIDE',mgm2:750,unit:'mg',sol:'250 cc G5%',dur:'60 mn',ryt:'J1=J21',hl:true},
      {t:'r',label:'Rinçage 250 cc SSI 0.9%',dur:'15 mn'},
      {name:'DOXORUBICINE',mgm2:50,unit:'mg',sol:'100 cc SSI 0.9%',dur:'15 mn',ryt:'J1=J21',hl:true,note:'Protéger contre la lumière'},
      {t:'r',label:'Rinçage 100 cc SSI 0.9%',dur:'10 mn'},
      {name:'VINCRISTINE',mgm2:1.4,unit:'mg',sol:'50 cc SSI 0.9%',dur:'10 mn',ryt:'J1=J21',hl:true,note:'Dose max 2 mg'},
      {t:'r',label:'Rinçage 250 cc SSI 0.9%',dur:'15 mn'},
      {name:'Prednisone per os',fix:'100 mg/j',sol:'—',dur:'J1–J5',ryt:'J1=J21'},
    ]
  },
  // â”€â”€ VIP (Tumeurs germinales réfractaires) â”€â”€
  {
    id:'vip', name:'VIP', rythme:'J1=J21',
    detail:'Étoposide 75 mg/m² + Ifosfamide 1200 mg/m² + Cisplatine 20 mg/m² J1-J5',
    badge:'J1=J21', badgeClass:'b21',
    drugs:[
      {t:'r',label:'Réhydratation 1000 cc SSI 0.9%',dur:'60 mn'},
      {name:'Hydrocortisone',fix:200,unit:'mg',sol:'20 cc SSI 0.9%',dur:'5 mn',ryt:'J1-J5'},
      {name:'Kytril',fix:3,unit:'mg',sol:'15 cc SSI 0.9%',dur:'2 mn',ryt:'J1-J5'},
      {name:'ÉTOPOSIDE',mgm2:75,unit:'mg',sol:'250 cc SSI 0.9%',dur:'60 mn',ryt:'J1-J5',hl:true},
      {t:'r',label:'Rinçage 250 cc SSI 0.9%',dur:'15 mn'},
      {name:'CISPLATINE',mgm2:20,unit:'mg',sol:'250 cc G5%',dur:'30 mn',ryt:'J1-J5',hl:true},
      {t:'r',label:'Réhydratation 500 cc SSI 0.9%',dur:'30 mn'},
    ]
  },
  // â”€â”€ MVAC (Cancer urothélial) â”€â”€
  {
    id:'mvac', name:'MVAC', rythme:'J1=J28',
    detail:'Méthotrexate 30 mg/m² J1 + Vinblastine 3 mg/m² J2 + Doxorubicine 30 mg/m² J2 + Cisplatine 70 mg/m² J2',
    badge:'J1=J28', badgeClass:'b28',
    drugs:[
      {t:'r',label:'Réhydratation 500 cc SSI 0.9%',dur:'30 mn'},
      {name:'Hydrocortisone',fix:200,unit:'mg',sol:'20 cc SSI 0.9%',dur:'5 mn',ryt:'J1,J2,J15,J22'},
      {name:'Kytril',fix:3,unit:'mg',sol:'15 cc SSI 0.9%',dur:'2 mn',ryt:'J1,J2,J15,J22'},
      {name:'MÉTHOTREXATE',mgm2:30,unit:'mg',sol:'100 cc SSI 0.9%',dur:'15 mn',ryt:'J1,J15,J22',hl:true},
      {t:'r',label:'Rinçage 250 cc SSI 0.9%',dur:'15 mn'},
      {name:'VINBLASTINE',mgm2:3,unit:'mg',sol:'50 cc SSI 0.9%',dur:'10 mn',ryt:'J2,J15,J22',hl:true},
      {t:'r',label:'Rinçage 100 cc SSI 0.9%',dur:'10 mn'},
      {name:'DOXORUBICINE',mgm2:30,unit:'mg',sol:'100 cc SSI 0.9%',dur:'15 mn',ryt:'J2',hl:true,note:'Protéger contre la lumière'},
      {t:'r',label:'Rinçage 250 cc SSI 0.9%',dur:'15 mn'},
      {name:'CISPLATINE',mgm2:70,unit:'mg',sol:'500 cc G5%',dur:'60 mn',ryt:'J2',hl:true},
      {t:'r',label:'Réhydratation 500 cc SSI 0.9%',dur:'30 mn'},
    ]
  },
  {
    id:'cddp_hebdo', name:'CDDP HEBDO', rythme:'J1=J8',
    detail:'Cisplatine 40 mg/m² J1, J8 (concomitant radiothérapie — RCC col utérin)',
    badge:'J1=J8', badgeClass:'b14',
    drugs:[
      {t:'r',label:'Réhydratation 1000 cc SSI 0.9%',dur:'45 mn'},
      {name:'Hydrocortisone',fix:200,unit:'mg',sol:'10 cc SSI',dur:'5 mn',ryt:'J1 = J8'},
      {name:'Kytril',fix:3,unit:'mg',sol:'15 cc SSI 0.9%',dur:'2 mn',ryt:'J1 = J8'},
      {t:'r',label:'Réhydratation 500 cc SSI 0.9%',dur:'30 mn'},
      {name:'CISPLATINE',mgm2:40,unit:'mg',sol:'250 cc SSI 0.9%',dur:'60 mn',ryt:'J1 = J8',hl:true},
      {t:'r',label:'Réhydratation 1000 cc SSI 0.9%',dur:'45 mn'},
    ]
  },
  {
    id:'taxol_hebdo', name:'TAXOL HEBDO', rythme:'J1=J28',
    detail:'Paclitaxel 80 mg/m² J1, J8, J15 — toutes les 4 semaines',
    badge:'J1=J28', badgeClass:'b28',
    drugs:[
      {t:'r',label:'Réhydratation 500 cc SSI 0.9%',dur:'30 mn'},
      {name:'Hydrocortisone',fix:200,unit:'mg',sol:'10 cc SSI',dur:'5 mn',ryt:'J1, J8, J15'},
      {name:'Kytril',fix:3,unit:'mg',sol:'15 cc SSI 0.9%',dur:'2 mn',ryt:'J1, J8, J15'},
      {name:'TAXOL (Paclitaxel)',mgm2:80,unit:'mg',sol:'250 cc SSI 0.9%',dur:'60 mn',ryt:'J1, J8, J15',hl:true,note:'Tubulure non-PVC obligatoire'},
      {t:'r',label:'Réhydratation 500 cc SSI 0.9%',dur:'30 mn'},
    ]
  },
,

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// NOUVEAUX PROTOCOLES V3
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

{
  id: 'ec100',
  name: 'EC100',
  rythme: 'J21',
  indication: 'Cancer du sein adjuvant/néoadjuvant',
  detail: 'Epirubicine 100 mg/m² J1 + Cyclophosphamide 600 mg/m² J1',
  badge: 'J21',
  badgeClass: 'b21',
  drugs: [
    {name:'Epirubicine 50mg', unit:'mg', calc:'sc', coef:100, base:'m2'},
    {name:'Cyclophosphamide 500mg', unit:'mg', calc:'sc', coef:600, base:'m2'},
    {name:'NaCl 0.9% 250ml', unit:'ml', calc:'fix', coef:250}
  ],
  supports: ['ONDANSETRON 8MG', 'DEXAMETHASONE 20MG', 'METOCLOPRAMIDE 10MG'],
  pre: 'Bilan : NFS plaquettes, créatinine, ECG, FEVG',
  post: 'G-CSF si neutropénie, surveillance cardiaque',
  postChimio: ['BETAMETHASONE-GH 2MG', 'PANTONEX DR 40MG', 'NEUFER SIROP', 'TRACEDOL 37.5/325', 'SETRONAX 8MG']
},

{
  id: 'xeliri',
  name: 'XELIRI',
  rythme: 'J21',
  indication: 'Cancer colorectal métastatique',
  detail: 'Irinotécan 200 mg/m² J1 + Capécitabine 2000 mg/m²/j J1-14',
  badge: 'J21',
  badgeClass: 'b21',
  hasCape: true,
  drugs: [
    {name:'Irinotécan 100mg', unit:'mg', calc:'sc', coef:200, base:'m2'},
    {name:'Capécitabine 500mg', unit:'cp', calc:'sc', coef:2000, base:'m2', t:true, oral:true, capeQty:2000},
    {name:'Glucose 5% 250ml', unit:'ml', calc:'fix', coef:250}
  ],
  supports: ['ONDANSETRON 8MG', 'DEXAMETHASONE 20MG'],
  pre: 'Bilan : NFS, créatinine, bilirubine totale',
  post: 'Capécitabine per os J1-J14, arrêt J15-J21. Loperamide si diarrhée',
  postChimio: ['BETAMETHASONE-GH 2MG', 'IMODIUM 2MG', 'NEUFER SIROP']
},

{
  id: 'herceptin',
  name: 'HERCEPTIN',
  rythme: 'J21',
  indication: 'Cancer du sein HER2+',
  detail: 'Trastuzumab 6 mg/kg (dose de charge 8 mg/kg)',
  badge: 'J21',
  badgeClass: 'b21',
  drugs: [
    {name:'Trastuzumab 150mg', unit:'mg', calc:'poids', coef:6, base:'kg', note:'Dose de charge : 8mg/kg puis 6mg/kg'},
    {name:'NaCl 0.9% 250ml', unit:'ml', calc:'fix', coef:250}
  ],
  supports: ['PARACETAMOL 1G', 'DEXAMETHASONE 8MG'],
  pre: 'FEVG â‰¥50%, bilan cardiaque',
  post: 'Surveillance cardiaque (FEVG tous les 3 mois)',
  postChimio: ['PARACETAMOL 1G']
},

{
  id: 'avastin_zometa',
  name: 'AVASTIN + ZOMETA',
  rythme: 'J28',
  indication: 'Cancer métastatique avec atteinte osseuse',
  detail: 'Bevacizumab 5 mg/kg + Acide zolédronique 4 mg',
  badge: 'J28',
  badgeClass: 'b28',
  drugs: [
    {name:'Bevacizumab 100mg', unit:'mg', calc:'poids', coef:5, base:'kg'},
    {name:'Acide zolédronique 4mg', unit:'mg', calc:'fix', coef:4},
    {name:'NaCl 0.9% 250ml', unit:'ml', calc:'fix', coef:250}
  ],
  supports: ['ONDANSETRON 8MG', 'PARACETAMOL 1G'],
  pre: 'Créatinine, protéinurie, TA, bilan dentaire (avant Zometa)',
  post: 'Hydratation, surveillance TA, supplémentation calcium/vitamine D',
  postChimio: ['CALCIUM+VITAMINE D', 'PARACETAMOL 1G']
},

{
  id: 'gem_avastin',
  name: 'GEMCITABINE + AVASTIN',
  rythme: 'J21',
  indication: 'Cancer de l\'ovaire récidivant',
  detail: 'Gemcitabine 1000 mg/m² J1,J8 + Bevacizumab 10 mg/kg J1',
  badge: 'J21',
  badgeClass: 'b21',
  drugs: [
    {name:'Gemcitabine 1g', unit:'mg', calc:'sc', coef:1000, base:'m2'},
    {name:'Bevacizumab 100mg', unit:'mg', calc:'poids', coef:10, base:'kg'},
    {name:'NaCl 0.9% 500ml', unit:'ml', calc:'fix', coef:500}
  ],
  supports: ['ONDANSETRON 8MG', 'DEXAMETHASONE 8MG'],
  pre: 'NFS plaquettes, créatinine, protéinurie',
  post: 'Gemcitabine J1 et J8, Avastin J1. Hydratation',
  postChimio: ['BETAMETHASONE-GH 2MG', 'PANTONEX DR 40MG']
}];

/* ============================================================
   STATE
============================================================ */
const LOGO_B64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAgAAAQABAAD/wAARCACMAKgDACIAAREBAhEB/9sAQwAIBgYHBgUIBwcHCQkICgwUDQwLCwwZEhMPFB0aHx4dGhwcICQuJyAiLCMcHCg3KSwwMTQ0NB8nOT04MjwuMzQy/9sAQwEJCQkMCwwYDQ0YMiEcITIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMAAAERAhEAPwD2g6Np7dbVKcukWC9LVBV2igCqNOsx0gSnizt16RKKnooAjEMY6KPyp3lp/dFV7/ULXTLSa6u5QkUMbSv3O1epwOTXI+IvH9tpmsw6Qs0Vql1bxyw6pIPMhRnZtoZcg4IU/NnFAHa+Uh/hFV5Xsoo/MmlhRNwXczgDJ6D615gX8V6tpOyPVLubUVu7rTr0RptjQOn7qVdo4QfId3P3jzUf/CvNS1W2uLUaXBo1pLaQRTW5uA4nmSVWaTK5x8oYZPJzQDPSZ9T0W1iaaa+tI41mFuztKMCU/wAH+97VejMDu6RujNGcOAclT715gvwn1G6t303Udc83Tvtct0HVMzMWjVE3ZGMgBufWt7wz4e8TaBql089xp17b3jQmaZpHWT5ECFtu0gk49aAsjtsLkdKXaK8+1PRNTk8W395eaff3lu8sT2V1a3gjFrGi5Zdmckls8YOc1hr418U6AqLq1qpkNvJfvESzOxlfbBb42ja249OeFNAHru0GmmJD1UVyOlePbaWOFdYjjsZpA5DK5ZMIu5y2QGQLxncByRXXRTRzxJLE6ujqGVlOQQe9AEbWkDdY1P4VG2l2TdbZDVuigCj/AGPp/wDz6x1NDp9rFKrJCoIIwRVilX7w+tAE9FFFABRRRQBXoooJwKACuJ8X+O/7HsA+kiG4P2g2010QZI7V8ZAZV+ZiTheOMnkir+u6ot+t9ounarBY6xDEJtlypCvH1Pp8pHBZema4nwT4NudQtTNM6w6FONptW/eSSR5/1Sv90wE/NuA3NnrxQBoXekr8StL0y/lgm0/XtNZUu0ljkg+Vx+8RW69DkdRnjvWxofgnSdD2CffqMiwfZEa8RXKw7mITp/tY+ldeFjt4UijG1FUIgHOB2qo8ZkZW3H3yPpTsBNHEIYljjjCIoCoi8AAdAKRplAzyGxzWeb++LbBaMjdjK424/DNPuZpEtXkCF3Ck7UGeef0osRzrUmTU431lrPfyIQ+38f8A9VXxOh7n8q8xXVb1NUF9tTz8kZ8puR0x9K761m+0WsUxR4y652sOe1C1OfD4lVJNGmrBhkdKq6hptlqts1tf2sVxCTnbIucH1HofenRSbSFzkH17VZoaOs4bWvhnp2qjAvLxIjGIpIzKXLRqSwjDNyoLkE9c7QK5pNQ1vwVFpwfS7wW0CxxXxE3mTaleMmFWPexyoPUr/IGvXqimt4ZyjSRozRndGzKCY2xjcvoeaQEVlNO9javfxR215JGpkhV9wVscqD3xVqvI9d0DUPD/AI5sNbmOr6/DEjPaxlt8kl0VKhMLhVQLls7R9TXa+DvFsHibT1PmxveRqDcCFGESM2T5YZhyyj7woA6elX7w+tJSr94fWgCeiiigAooooAr1zXizxTYaCtrZXdy9vJflkWdePs645lJ6AAkfiRXSk4ryew1m98XeM79NO1CLT5BCwEE+JkkjVyuySJgCpb73yk+9ADvDnhfVfEt3MvizUP7SsrCYJAskSuLhSv8ArI5l24VgQCvPcGvUAYrdFjRAqqNqqq4AA7Cq9pZW2k2EdpYwR28KkkRxLtUEnLYHbmpC4KEsfm6DH0oArC6mnutrW3lKB953Bz9MVMAMDj07fSqtzLHBE8pVm2ngKuSTnp+dTQSLJGjDGGAK/wDjtUiVva49ivRsZPQfhVbUPl0652RGQlGG0d85qYwQmQSlAZAOGI5omH7mXjnae31oE1ozhDFppZXFmnlBmXZ53fP19K7e0fFnBvjaNti5U8kcCuXeac2yki4EfzjZ5Rxu2HnNdTGd0alh0A4/KkjiwsEpNiG7UzCNYZGJ77ML+eKt+Y4PUnnp+dVXGVbZjdg7c9Kj82WGGWa68tVjUnZHz69yKZ23sasT7wc8U+s+wuUuIUl27c5Ugc4OcEZq6XAUkYOPSkUndXGXVtFeWs1tMCYpkKOFYqcH3HIrw3UtH8R+HviFbQ2McE8NpHv01JZ/s9tCpzl2VeOMsuGO5uvtXu6ncoNcp8RdEh1nwffbraGW5t4/NikaIO8e0hm2Z/iwvTvxmkM6LT72K+tVkjuLeZh8srW770D9wDVtfvD615j8P9Xi06403QbTTLS20+8gkuImjulmuGYBTvlC/Ku7J/LFenL94fWgCeiiigAooooA5XxvqP8AZvhO9dLwWtzKhit3AJYyHoFxznrXI/DyC81PVRrF5Ol3b28BiWSUqzRS8YRcgOCq5DFvvE1sfEq6az0yyuo4rkTWs3nRXFtPGjwtjb91/vghiMVo+DNOmh0me6vvtJv76czXD3GzczABRgJ8oGFFAHQTuDH8vJ7VSXliCT/nNWZI9mTjjHWo2X72M5Pf86oDn/EZuQIYYELxSEl8ZzkEY6c1P4dkuZdLhM4A2kLFjrtAUc/rTtSuIre5hRnzL12KR0DKeah029ittKjXenn79gjLfxcenbFHU4L2r8zZf1W9W00u6mTLPGu3C9VJHH881FpV59s0NZpARtQqzN/FjPNZGpzxNpt41tqUUktwFlYbNvQhePyxUVpq81npMcHkLdsZG3b22jqaVxTxH7zXaxNIZHYFI5jbNF98phA21h/UVc126lttJ/cLuaUqmR2HFMHiO5LEG2gCgnkyHlfX8ay7u7lvdM8gwGJ45tw8ttwAyOPpz1oIdWMYtp6s6TTbk3WnWkk37uWWPOOucCq3iNLk2IFvJsBf58DJK/NWXZTwW9jam4vJBcQRnaAmQmeCMdyKt3l1deRKbqJgryfuiRtXG09+3NBar81Kz3LHhyK8jil+0SFoQ2IwVwQ245/pW/CyhCp/i/wFYeiXkUks8LOiyNKXVN2cgmtjHA/D+lC2OjD25NCaJ9jbT0qx1+lU0Kj72SR0/WrSZ280joPH9TivtB17U5LOK60/UHul+wJawRRWUkPynMjkc/xbueK9gt5FmjjlR1dXAYMhyre4NeZ/EG2SPxbaXI8i6mntNiWk9g93sCNy6KDjPzAHPtXd+G5ZJ9CsnljeN9gUq9v5BGDj7n8I9qANuiiigAooooA4PxxqPhq1ubSDxFpkN2rRNJE8rABfnRSBn/fB+imtfwhc6bdaAraTbJb2Uc80SRxvvX5XZdwPocZ/Guc+KcdwLHTZrWwiupPOdATZrcMG2Equ09AzKATWt8P4by28NLFfWt1bXHmFnjnhWIZPOEVeijoPpQB1BCyAr+dU3BXd2P8A+urUgIYN+dRzEFAw/E49qaEcndQJc6nqG62hkMc0eS2c/MFA/rSW1tslh8q3iieVVZGBYcMCcfpU50S9eSSRpSZJW3OVZfm54/Ko20S8Roysr5X7vzL8v+cmg82UG5N2IXVjC0ggVeOSGOQ23d/n61LoVzvluvtls0EiYVUnYMcYP86dFol4VGJHxnPDKaV/D14JnkSaR9xB3OF9DSsTyTTTSIna8MH21XxEzsqx4Hy++ce1LqqyvqkRsrWO5Bhw4B2jGRk8elWP7M1L7GLQz4Tn+FfWmLod+CrGXdhdoBC46L/gKY5Qm1axj262+yKSa5uRLgyZVAw3hjgfkvSrk15BLGY5r2+kRgMoyL97n5P97POfarcXhwxQRrlZWClfmVenPemS+H2TgwR5PT7vvQZqlVirWM+FrKGdZYbi9LoMphFG5iANg9xuH51q2urRy3KhLi5kyq43gBWLFM/98hhx71Cvh6QL/qoxuwOi+o/+tU1voTxSrIfLicFOiD5lG04/QUi6casWrLQ6Dsf8+tXI23L9OKooeCCeef61YhPzkf561TPURzHjfxBb+EvsuuPpRvpY1eFWjuFjdVYrlVU/fyQOnpW14Y1v/hItFttUFt9nWfJWPzVk4z6j+Vcd8Sb97W+sH0/7QdVtUaSHy9PW6CqzAMzZ5XoeQK6vwhHs0C2cukjys0rvHa/Z9zMxOTH/AAn1qRnR0UUUAFFFFAHMeMdJk1nw7JDBJcRzxSxzxm2OJMqwOF5HJGR+Nch8PNd0+XxFqWm2dh9ky22SW61L7RPPKv8ACFz0AznFemsqupVhlWGCDXjd5Ya3omq3Vlo+hWdlBayGdbuJFiTajq4bgM75QlGUDqPegD2QjcMGoQ4jVw3UZOKZp2o2urafDfWU6T28y5WROh9f1qWdMru9P8KAPDfDGm3HxO1HXNR1jW762+zPtt4reTasOc449Bj+dSePPtel/DPS1TxH/asiX+0XkD7Tt2n5Tg/zqXxF4d00eItRksodcsfPci4Fk4EcvqcFaivNK0e68L2vh+HRdWtrW3n+0b48F5HxgliVouc0sXRi7NmX4q8Xalqtx4djbS9S0gRyqC8suBP93pj/ADzUniPXtd0j4sale6bJNNFYqk0tvvJQxbVDfL+NdD4je28TLpn2nStYi/s5t0RjA+bp97K/7Nb2jeHbK51+fxYUvFuL2JopbSULsC/d9M/w1FStCmuabLp4inVlaDOI0DxbLceJvF+uWc0skK2D3FvE7EhG+XHHsal8NeE5/EvhH/hKr7xXfWd+8rN9paX93FtbHzD/AD2rrNK8FaN4Tvr2+toL64ivlMD2mwMioxyQO+Kov8JtJKvBHqOsRafJJ5jWKyDy/p0rn+v0N+Y6OV3sS/EPX5tF8A2lnBqqXV/fbYFu4yBuUfefI/L8ayfhtqs1lrWs+F7vUhfFB59tOJd6thfmAb6EH8DVvxH4e0c63pqzaZqE9pp0Cxw2aAGEr7/Lk+9U/wCztHt/EVprOmaHf6ZLbKV8m1QLG+c5yNvcHFdEK0Jq6ZvHCVZK6R53Z+L9dstC1SwtprllnkDT3JZmMUecYB/hyT1r3rwPp1haeFrSWxvJr1bhBI1zK5ZnbAyPbHTFcRoun6Zo2k6ppq6Tqdzb6kMTecBkfTC10nw60pNJ066tLV9QFurh1jvAvyk9duAKuM4tinhqsI8zR2o+/wBc9f5GrULKG56nv+NVwuFP+fWsXxdr8fh3QJrxn2SMfLjPoxJ5+6f1HXA71RzHDeJ7o+J/GMEsOtHQxaSNa2V59jlBmfcFbEoO1sMrAA+pr1+1SWOCGOebzpVVVeXGN7Actj3ryX4c20fiW/nuZ3nks7Ofzvs++SKNbnO7c0DZUHJ3ZU49q9fX7w+tSMnooooAKKKKAK9YWt+HpNT1Cz1Kz1ObTr+1R4kmjjWQFHxuBVhj+Ec1Yu9Ve2BIhDfjWFceNpoGI+wqcd99AN9zoNB0WDw/pEWn28ssyqzO80xy8jsxZmb3JJq/N/qn78VxQ8fSH/lxX/vumP4/nHTT0P8AwOgnnidcoLfMFzz6e9O2PgfJ/L2riv8AhYVyDkaZH/38pP8AhYl1/wBA1P8Av5TuTam2d9GMRqCAKUordRXAj4hXh/5hif8AfygfEG9/6BSf9/KiTi9GXGMVrFHe+UnXbShFHQYrhV8e3h/5hqf991Mvjm5PXT0H/A6jlp+RV2drtHcCq0kR3fKgx+HvXMjxpKR/x4qP+B1Xm8eTRdLBT/wOqTjsik5dDrGUqRlR+XuPamZwuQnb0x6e1cQ/xFnLc6Uhx/00qI+PpSv/ACDEH/bStNBvna1O5ErDJ2nH0+vtWfrPhnSvFdqYNSgchQwSWNyjpnrgj1rlT8QLg5/4lqf99/8A1qu2nj6dvlGmog6/fouRySOs8P6NH4e0S20uK5nuUt12iac5dvqf0/CtRfvD61z1p4ie6UE24XP+1WtBdtJIg24yRRYRpUUUUgCiiigDn7+DeprkNRsCWbArvJo9wrLnsg5PFPoYVU7aHBfYXDdKeLBj1BrsTpYJ+7QNLH92izOTkqHIDTie1OTSyT92uxXTB6VKmmqP4amS0KjCdzl4dHz/AA1aGiL6fpXUR2QXHFTC2X0rhqQm3od9NWRyP9jAdqP7H9q637MvpSi1X0rNwqGlzkG0ohelUbjTD6V3jWikdKqy6cG7VpThNPU3pyj1PP20o5+7UZ0s+ld2+mL/AHcVGdMX0rrSZvzwOJGln+7ViDTirD5a67+zBnpTk08KelNJilOFilp9uUx2robQYlj+o/nVaK3CVdgGJkHuK0RxzavoatFFFIzCiiigCE2yHqzfnTfscZ/if8xViincCt9ij/vP+Yo+xR+rfnVmii4rIri0jHdvzp32ZPVqmopBYi+zr6tR9nX1apaKVhkX2dfVqPIX1apaKLAReQvq1H2dfVqloosFyA2qHu1J9jj/ALzfpViimPmZW+wxf3n/ADFJ9hj/ALz/AJj/AAq1RQF2VfsMf95/zH+FOWzRWDB3yDnkirFFFxBRRRQAUUUUAf/Z';
let selId = null, sc = 0, poids = 0;
let medecins = JSON.parse(localStorage.getItem('chncak_medecins')||'[]');
let historique = JSON.parse(localStorage.getItem('chncak_historique')||'[]');
let selHistIdx = null;

if(!medecins.length){
  medecins = [
    {id:1,name:'Dr M. Mane',grade:'Oncologue médicale'},
    {id:2,name:'Dr Fall',grade:'Oncologue'},
    {id:3,name:'Dr Balde',grade:'Oncologue médicale'},
    {id:4,name:'Dr Diallo',grade:'Oncologie-Radiothérapie'},
    {id:5,name:'Dr Ndeye Fatou Kane Ba',grade:'Oncologue médicale'},
    {id:6,name:'Dr Sall',grade:'Oncologue'},
  ];
  saveMedecins();
}

function saveMedecins(){localStorage.setItem('chncak_medecins',JSON.stringify(medecins));}
function saveHistorique(){localStorage.setItem('chncak_historique',JSON.stringify(historique));}

/* ============================================================
   NAVIGATION
============================================================ */
function showPage(id,btn){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  const page = document.getElementById('page-'+id);
  if(!page) return;
  page.classList.add('active');
  if(btn) btn.classList.add('active');
  if(id==='dashboard') renderDashboard();
  if(id==='medecins') renderMedecins();
  if(id==='historique') renderHistory();
  if(id==='pharmacie') renderPharmacie();
  if(id==='apercu') renderApercu();
  if(id==='preparation') renderPreparation();
  if(id==='support') renderSupport();
  if(id==='stats') renderStats();
  if(id==='programme'){
    renderProgramme();
  }
  if(id==='patients'){setTimeout(renderPatientsList,50);}
  if(id==='rdv'){ renderRdvPage(); }
  if(id==='okchimio'){ renderOkChimio(); }
  if(id==='archive'){ renderArchive(); }
}

/* ============================================================
   SC CALC
============================================================ */
function onAtcdChange(){
  const sel = document.getElementById('atcd-select');
  const inp = document.getElementById('atcd');
  if(sel.value === 'autre'){
    inp.style.display = '';
    inp.focus();
    inp.value = '';
  } else {
    inp.style.display = 'none';
    inp.value = sel.value;
  }
  update();
}

function getAtcd(){
  const sel = document.getElementById('atcd-select');
  const inp = document.getElementById('atcd');
  return sel.value === 'autre' ? (inp.value||'') : sel.value;
}

function calcSC(){
  const p=parseFloat(document.getElementById('poids').value)||0;
  const t=parseFloat(document.getElementById('taille').value)||0;
  poids=p;
  if(p>0&&t>0){
    sc=parseFloat((0.007184*Math.pow(p,0.425)*Math.pow(t,0.725)).toFixed(2));
    document.getElementById('sc-display').textContent=sc.toFixed(2);
  } else {sc=0;document.getElementById('sc-display').textContent='—';}
  update();
}

/* ============================================================
   DOSE CALCULATION
============================================================ */

// Dynamic solvant volume — automatically adapted to the calculated dose
// Rules: dose (mg) → minimum volume to stay within safe concentration limits
// References: résumés des caractéristiques produit (RCP) de chaque molécule
function getSolvantVol(drugName, doseMg){
  // Each entry: concentration max (mg/mL) allowed → determines min volume
  // vol = ceil(dose / concMax) rounded up to standard bag (100/250/500/750 cc)
  const stdBag = v => v<=100?100 : v<=250?250 : v<=500?500 : 750;

  const concMax = {
    // Platines
    'OXALIPLATINE':            {concMax:0.7,  sol:'G5%',     volMin:250},  // 0.2–0.7 mg/mL
    'CISPLATINE':              {concMax:1.0,  sol:'G5%',     volMin:100},  // 0.5–1 mg/mL
    'CARBOPLATINE':            {concMax:2.0,  sol:'G5%',     volMin:250},  // 0.5–2 mg/mL
    // Taxanes
    'TAXOL (Paclitaxel)':      {concMax:1.2,  sol:'SSI 0.9%',volMin:250},  // 0.3–1.2 mg/mL
    'TAXOTÈRE (Docétaxel)':    {concMax:0.74, sol:'SSI 0.9%',volMin:250},  // 0.3–0.74 mg/mL
    // Anthracyclines
    'DOXORUBICINE':            {concMax:2.0,  sol:'SSI 0.9%',volMin:100},  // 0.4–2 mg/mL
    'ÉPIRUBICINE':             {concMax:2.0,  sol:'SSI 0.9%',volMin:100},  // 0.4–2 mg/mL
    // Alkylants
    'CYCLOPHOSPHAMIDE':        {concMax:4.0,  sol:'G5%',     volMin:250},  // 2–4 mg/mL
    // Antimétabolites
    'GEMCITABINE':             {concMax:10.0, sol:'SSI 0.9%',volMin:100},  // 1–10 mg/mL
    '5-FLUOROURACILE':         {concMax:2.0,  sol:'SSI 0.9%',volMin:250},  // forme unique 500 mg
    '5-FLUOROURACILE bolus':   {concMax:99,   sol:'SSI 0.9%',volMin:100},  // administration bolus
    '5-FLUOROURACILE perfusion':{concMax:2.0, sol:'SSI 0.9%',volMin:250},  // perfusion continue
    'LEUCOVORINE (LV)':        {concMax:2.0,  sol:'G5%',     volMin:100},
    'MÉTHOTREXATE':            {concMax:2.0,  sol:'SSI 0.9%',volMin:250},
    // Topo-isomérases
    'IRINOTÉCAN':              {concMax:2.8,  sol:'G5%',     volMin:250},  // 0.12–2.8 mg/mL
    'ÉTOPOSIDE':               {concMax:0.4,  sol:'SSI 0.9%',volMin:250},  // max 0.4 mg/mL
    // Thérapies ciblées
    'AVASTIN (Bévacizumab)':   {concMax:16.5, sol:'SSI 0.9%',volMin:100},  // 1.4–16.5 mg/mL
    'TRASTUZUMAB':             {concMax:4.0,  sol:'SSI 0.9%',volMin:250},
  };

  const rule = concMax[drugName];
  if(!rule || !doseMg) return null;

  // Calculate minimum volume needed to respect max concentration
  const volNeeded = doseMg / rule.concMax;
  const volFinal = Math.max(rule.volMin, stdBag(volNeeded));

  return {vol: volFinal, sol: rule.sol};
}

function getDose(d){
  if(d.t) return {txt:d.label,cls:'rh'};

  let val=null, doseTxt='—', extra={};

  if(d.oral){
    val = Math.round(d.mgm2*sc);
    doseTxt = val+' mg × 2/j';
    extra = {oral:true};
  } else if(d.fix!==undefined){
    doseTxt = typeof d.fix==='number'? d.fix+' '+(d.unit||'') : d.fix;
    val = typeof d.fix==='number'? d.fix : null;
  } else if(d.mgkg){
    val = Math.round(Number(d.mgkg) * poids);
    doseTxt = val+' '+(d.unit||'mg');
    extra = {calc:true};
  } else if(d.carbo){
    val = carboDose>0 ? carboDose : Math.round(5*(poids*0.8+25));
    doseTxt = val+' mg';
    extra = {calc:true, note: carboDose>0 ? 'Calvert exact (créatininémie saisie)' : 'Calvert estimé (créatininémie non saisie)'};
  } else if(d.avastin){
    val = Math.round(15*poids);
    doseTxt = val+' mg';
    extra = {calc:true};
  } else if(d.mgm2){
    val = Math.round(d.mgm2*sc);
    doseTxt = val+' mg';
    extra = {calc:true};
  }

  // Dynamic solvant volume
  let dynSol = d.sol; // default
  if(val && d.name && !d.fix && !d.oral){
    const sv = getSolvantVol(d.name, val);
    if(sv) dynSol = sv.vol+' cc '+sv.sol;
  }

  return {val, txt:doseTxt, sol:dynSol, ...extra};
}

function checkDoseLimit(name,val){
  const lim=DOSE_LIMITS[name];
  if(!lim||!val) return null;
  if(val>lim.max) return 'danger';
  if(val>=lim.warn) return 'warn';
  return 'ok';
}

/* ============================================================
   RENDER PROTOCOLS
============================================================ */
/* ============================================================
   CODE GRATUITE AUTO-GENERATION
============================================================ */
function genCodeGratuite(){
  const num = document.getElementById('num-seq').value||'';
  const sexe = document.getElementById('sexe').value;
  const dateInput = document.getElementById('date-protocole').value;
  const year = dateInput ? dateInput.substring(2,4) : new Date().getFullYear().toString().substring(2);
  const sexeLetter = sexe === 'F' ? 'F' : 'M';
  if(num){
    document.getElementById('codegratuite').value = num + sexeLetter + year;
  } else {
    document.getElementById('codegratuite').value = '';
  }
  update();
}

// Re-generate code gratuite when sexe or date changes
const origUpdate = window.update;

/* ============================================================
   CARBOPLATINE CALVERT CALCULATOR
============================================================ */
let carboDose = 0;

document.getElementById('auc-cible').addEventListener('change', function(){
  const cf = document.getElementById('auc-custom-field');
  cf.style.display = this.value === 'custom' ? '' : 'none';
  calcCarbo();
});

function calcCarbo(){
  const creat = parseFloat(document.getElementById('creatinine').value)||0;
  const aucSel = document.getElementById('auc-cible').value;
  const aucCustom = parseFloat(document.getElementById('auc-custom').value)||0;
  const auc = aucSel === 'custom' ? aucCustom : parseFloat(aucSel);
  const age = parseFloat(document.getElementById('age').value)||0;
  const p = parseFloat(document.getElementById('poids').value)||0;
  const sexe = document.getElementById('sexe').value;

  document.getElementById('res-auc').textContent = auc ? auc.toFixed(1) : '—';

  if(!creat || !age || !p || !auc){
    document.getElementById('carbo-result').style.display='none';
    document.getElementById('carbo-missing').style.display='';
    carboDose = 0;
    update();
    return;
  }

  // Cockroft-Gault: ClCr = ((140-age) × weight × 1.23) / creatinine_umol/L  [× 0.85 if female]
  let clcr = ((140 - age) * p * 1.23) / creat;
  if(sexe === 'F') clcr *= 0.85;
  clcr = Math.min(clcr, 125); // cap at 125 ml/min
  const clcrRounded = Math.round(clcr * 10) / 10;

  // Calvert: Dose = AUC × (GFR + 25)
  const dose = Math.round(auc * (clcr + 25));
  carboDose = dose;

  document.getElementById('carbo-result').style.display='';
  document.getElementById('carbo-missing').style.display='none';
  document.getElementById('res-clcr').textContent = clcrRounded.toFixed(1);
  document.getElementById('res-dose').textContent = dose + ' mg';

  // Detail
  const femMult = sexe==='F' ? ' × 0,85 (♀)' : '';
  document.getElementById('carbo-detail-calc').innerHTML =
    ` ClCr = ((140 − ${age}) × ${p} × 1,23) / ${creat}${femMult} = <b>${clcrRounded} mL/min</b> &nbsp;|&nbsp; Dose = ${auc} × (${clcrRounded} + 25) = <b>${dose} mg</b>`;

  // Alerts
  const alertEl = document.getElementById('carbo-alert');
  if(dose > 900){
    alertEl.style.display='flex'; alertEl.className='alert-dose danger';
    document.getElementById('carbo-alert-txt').innerHTML=`Dose calculée <b>${dose} mg</b> dépasse la dose maximale recommandée (900 mg). Vérifier avec le prescripteur avant administration.`;
  } else if(dose > 750){
    alertEl.style.display='flex'; alertEl.className='alert-dose warn';
    document.getElementById('carbo-alert-txt').innerHTML=`Dose calculée <b>${dose} mg</b> approche la limite de sécurité (max 900 mg). Surveillance étroite recommandée.`;
  } else if(clcr < 15){
    alertEl.style.display='flex'; alertEl.className='alert-dose danger';
    document.getElementById('carbo-alert-txt').innerHTML=`Clairance rénale très basse (${clcrRounded} mL/min). Carboplatine contre-indiqué. Avis néphrologue requis.`;
  } else {
    alertEl.style.display='none';
  }

  update();
}

function renderProtos(){
  document.getElementById('proto-grid').innerHTML=PROTOCOLS.map(p=>`
    <div class="proto-card${selId===p.id?' selected':''}" onclick="selectProto('${p.id}')">
      <div class="proto-radio"></div>
      <div>
        <div class="pname">${p.name}</div>
        <div class="pdetail">${p.detail}</div>
        <span class="pbadge ${p.badgeClass}">${p.badge}</span>
      </div>
    </div>
  `).join('');
}

function selectProto(id){selId=id;update();}

/* ============================================================
   MAIN UPDATE
============================================================ */
function update(){
  renderProtos();
  populateMedecinSelect();
  const proto=PROTOCOLS.find(p=>p.id===selId); if(!proto)return;
  const dosesCard=document.getElementById('doses-card');
  const capeCard=document.getElementById('cape-card');
  const carboCard=document.getElementById('carbo-card');
  const printSec=document.getElementById('print-section');

  if(!proto||sc<=0){
    dosesCard.style.display='none';
    capeCard.style.display='none';
    carboCard.style.display='none';
    printSec.style.display='none';
    return;
  }

  // Show Calvert calculator only for Carbo protocols
  carboCard.style.display = proto.hasCarbo ? '' : 'none';
  if(!proto.hasCarbo) carboDose = 0;

  dosesCard.style.display='';
  document.getElementById('doses-proto-name').textContent=proto.name+' ('+proto.rythme+')';

  // Build table & alerts
  let alerts=[];
  const rows=proto.drugs.map(d=>{
    const dose=getDose(d);
    if(dose.cls==='rh') return `<tr class="rh"><td colspan="5">&#9656; ${d.label} — faire passer en ${d.dur}</td></tr>`;
    let pillClass='dpill', limitBadge='';
    if(dose.calc||dose.oral){
      const status=checkDoseLimit(d.name,dose.val);
      if(status==='warn'){pillClass='dpill warn';alerts.push({level:'warn',name:d.name,val:dose.val,max:DOSE_LIMITS[d.name]?.max});}
      if(status==='danger'){pillClass='dpill danger';alerts.push({level:'danger',name:d.name,val:dose.val,max:DOSE_LIMITS[d.name]?.max});}
      if(status) limitBadge=`<span class="dose-limit-badge dlb-${status==='ok'?'ok':status}">${status==='ok'?'✓ OK':status==='warn'?'⚠ Limite':'ALERTE Dépassé'}</span>`;
    }
    const doseCell=dose.calc?`<span class="${pillClass}">${dose.txt}</span>${limitBadge}`:
                   dose.oral?`<span class="doralpill">${dose.txt}</span>${limitBadge}`:dose.txt;
    return `<tr class="${d.hl?'hl':''}">
      <td>${d.name}${d.note?`<span class="dnote">&#9888; ${d.note}</span>`:''}</td>
      <td>${doseCell}</td>
      <td style="color:var(--gray-mid)">${d.sol||'—'}</td>
      <td style="color:var(--gray-mid)">${d.dur||'—'}</td>
      <td style="color:var(--gray-mid)">${d.ryt||'—'}</td>
    </tr>`;
  }).join('');

  document.getElementById('doses-table').innerHTML=
    `<thead><tr><th>Médicament</th><th>Dose calculée</th><th>Solvant</th><th>Durée</th><th>Rythme</th></tr></thead><tbody>${rows}</tbody>`;

  // Alerts
  const alertDiv=document.getElementById('dose-alerts');
  alertDiv.innerHTML=alerts.map(a=>`
    <div class="alert-dose ${a.level}">
      <span class="alert-icon">${a.level==='danger'?'ALERTE':'⚠'}</span>
      <span><b>${a.name}</b> : dose calculée <b>${a.val} mg</b> ${a.level==='danger'?'dépasse':'approche'} la dose maximum recommandée (${a.max} mg). Vérifier avec le prescripteur.</span>
    </div>
  `).join('');

  // Capécitabine fiche
  if(proto.hasCape){
    capeCard.style.display='';
    renderCapeTable(proto);
  } else {capeCard.style.display='none';}

  const prenom=document.getElementById('prenom').value;
  const nom=document.getElementById('nom').value;
  printSec.style.display=(prenom&&nom&&sc>0&&selId)?'':'none';
  // Refresh pharmacie silently if already rendered
  if(document.getElementById('page-pharmacie').classList.contains('active')) renderPharmacie();
  if(document.getElementById('page-apercu').classList.contains('active')) renderApercu();
  if(document.getElementById('page-preparation').classList.contains('active')) renderPreparation();
  if(document.getElementById('page-support').classList.contains('active')) renderSupport();
  // Auto-update RDV display if date-rdv is already filled
  const rdvVal = document.getElementById('date-rdv')?.value;
  if(rdvVal) updateRdvDisplay(rdvVal);
}

/* ============================================================
   CAPECITABINE TABLE
============================================================ */
function renderCapeTable(proto){
  const capeDrug=proto.drugs.find(d=>d.oral);
  if(!capeDrug) return;
  const doseTotal=Math.round(capeDrug.mgm2*sc);
  const cp500=Math.floor(doseTotal/500);
  const cp150=Math.round((doseTotal-(cp500*500))/150);
  let rows='';
  for(let j=1;j<=14;j++){
    rows+=`<tr>
      <td class="day">J${j}</td>
      <td style="text-align:left;padding:6px 8px">
        ${cp500>0?`<b>${cp500}</b> cp 500 mg`:''}
        ${cp150>0?` + <b>${cp150}</b> cp 150 mg`:''}
        <span style="font-size:11px;color:var(--gray-mid);margin-left:6px">= ${doseTotal} mg</span>
      </td>
      <td class="check"><input type="checkbox" title="Matin J${j}"></td>
      <td class="check"><input type="checkbox" title="Soir J${j}"></td>
    </tr>`;
  }
  document.getElementById('cape-table').innerHTML=`
    <thead><tr>
      <th style="width:50px">Jour</th>
      <th>Comprimés à prendre</th>
      <th>✓ Matin</th>
      <th>✓ Soir</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="4" style="padding:8px;font-size:12px;color:var(--gray-mid);font-style:italic">Repos 7 jours après J14</td></tr></tfoot>
  `;
}

/* ============================================================
   MEDECINS
============================================================ */
function populateMedecinSelect(){
  const sel=document.getElementById('medecin-select');
  if (!sel) return;
  
  const cur=sel.value||localStorage.getItem('chncak_last_medecin')||'';
  const medecins = JSON.parse(localStorage.getItem('chncak_medecins') || '[]');
  
  sel.innerHTML='<option value="">— Choisir un médecin —</option>'+
    medecins.map(m => {
      const fullName = `Dr ${m.prenom} ${m.nom}`;
      const display = `${fullName}${m.specialite ? ' (' + m.specialite + ')' : ''}`;
      return `<option value="${fullName}"${cur===fullName?' selected':''}>${display}</option>`;
    }).join('');
  
  if(cur) sel.value=cur;
}

function renderMedecins(){
  populateMedecinSelect();
  const medecins = JSON.parse(localStorage.getItem('chncak_medecins') || '[]');
  document.getElementById('med-list').innerHTML=medecins.length?
    medecins.map((m,i)=>`
      <div class="med-item">
        <div class="med-info">
          <div class="med-avatar">${(m.prenom?.[0]||'')+(m.nom?.[0]||'')}</div>
          <div>
            <div class="med-name">Dr ${m.prenom || ''} ${m.nom || ''}</div>
            <div class="med-grade">${m.specialite||'—'}</div>
            <div style="font-size:11px;color:#666;margin-top:4px">
              ${m.email ? '✉ ' + m.email : ''} ${m.email && m.contact ? ' • ' : ''} ${m.contact ? '☎ ' + m.contact : ''}
            </div>
          </div>
        </div>
        <div class="med-actions">
          <button class="btn-sm danger" onclick="deleteMed(${i})">&#128465; Supprimer</button>
        </div>
      </div>
    `).join(''):
    '<p style="text-align:center;padding:20px;color:var(--gray-mid);font-size:13px">Aucun médecin enregistré</p>';
}

function toggleAddMedForm(){
  const f=document.getElementById('add-med-form');
  f.style.display=f.style.display==='none'?'':'none';
}

function addMedecin() {
  const nom = prompt('Nom du médecin:');
  if (!nom) return;
  
  const prenom = prompt('Prénom:');
  if (!prenom) return;
  
  const specialite = prompt('Spécialité:');
  if (!specialite) return;
  
  const email = prompt('Email (pour notifications):');
  if (!email) return;
  
  const contact = prompt('Téléphone:');
  if (!contact) return;
  
  const medecins = JSON.parse(localStorage.getItem('chncak_medecins') || '[]');
  
  const newMedecin = {
    id: 'med_' + Date.now(),
    nom: nom,
    prenom: prenom,
    specialite: specialite,
    email: email,
    contact: contact,
    dateAjout: new Date().toISOString()
  };
  
  medecins.push(newMedecin);
  localStorage.setItem('chncak_medecins', JSON.stringify(medecins));
  
  alert('✅ Médecin ajouté avec succès!');
  
  if (typeof renderMedecins === 'function') {
    renderMedecins();
  }
}

function deleteMed(i){
  if(!confirm('Supprimer ce médecin ?')) return;
  medecins.splice(i,1);
  saveMedecins();
  renderMedecins();
  populateMedecinSelect();
}

/* ============================================================
   HISTORIQUE
============================================================ */
function saveToHistory(){
  const proto=PROTOCOLS.find(p=>p.id===selId);
  if(!proto) return;
  const entry={
    id:Date.now(),
    date:new Date().toLocaleDateString('fr-FR'),
    dateTs:Date.now(),
    prenom:document.getElementById('prenom').value,
    nom:document.getElementById('nom').value,
    age:document.getElementById('age').value,
    poids:document.getElementById('poids').value,
    taille:document.getElementById('taille').value,
    sexe:document.getElementById('sexe').value,
    sc:sc.toFixed(2),
    indication:document.getElementById('indication').value,
    localisation:document.getElementById('localisation').value,
    typeHistologie:document.getElementById('type-histologie')?.value || '',
    stade:document.getElementById('stade')?.value || '',
    atcd:getAtcd(),
    medecin:document.getElementById('medecin-select').value,
    dossier:document.getElementById('dossier').value,
    cubix:document.getElementById('cubix').value,
    codegratuite:document.getElementById('codegratuite').value,
    dateProto:document.getElementById('date-protocole').value,
    protoId:selId,
    protoName:proto.name,
    totalCures:document.getElementById('total-cures').value,
    cureNum:document.getElementById('cure-num').value,
  };
  historique.unshift(entry);
  saveHistorique();
  
  // === GÉNÉRATION AUTOMATIQUE OK CHIMIO ===
  try {
    const medecinSel = entry.medecin || '';
    const prenom = entry.prenom || '';
    const nom = entry.nom || '';
    const age = entry.age || '';
    const dossier = entry.dossier || '';
    const cure = parseInt(entry.cureNum) || 1;
    
    if (medecinSel && prenom && nom && proto) {
      const okEntry = {
        id: Date.now(),
        date: new Date().toISOString(),
        patient: { prenom, nom, age, dossier },
        protocole: proto.name,
        protoId: proto.id,
        medecin: medecinSel,
        cure: cure,
        statut: 'En attente'
      };
      
      const okList = getOkChimio();
      okList.push(okEntry);
      saveOkChimio(okList);
      
      console.log('✓ Protocole ajouté à OK Chimio:', proto.name, 'pour', prenom, nom);
    }
  } catch(err) {
    console.error('Erreur génération OK Chimio:', err);
  }
  const btn=document.getElementById('btn-save');
  btn.textContent='✓ Sauvegardé !';
  btn.style.color='var(--green)';
  setTimeout(()=>{btn.textContent='💾 Sauvegarder';btn.style.color='';},2000);
}

function renderHistory(){
  const q=(document.getElementById('hist-search').value||'').toLowerCase();
  const stats=document.getElementById('stats-grid');
  const protos={};
  historique.forEach(h=>{protos[h.protoName]=(protos[h.protoName]||0)+1;});
  const topProto=Object.entries(protos).sort((a,b)=>b[1]-a[1])[0];
  stats.innerHTML=`
    <div class="stat-card"><div class="stat-val">${historique.length}</div><div class="stat-label">Protocoles enregistrés</div></div>
    <div class="stat-card"><div class="stat-val">${new Set(historique.map(h=>h.nom+h.prenom)).size}</div><div class="stat-label">Patients uniques</div></div>
    <div class="stat-card"><div class="stat-val">${topProto?topProto[1]:0}</div><div class="stat-label">Cures ${topProto?topProto[0]:''}</div></div>
    <div class="stat-card"><div class="stat-val">${historique.filter(h=>{const d=new Date(h.dateTs);const now=new Date();return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).length}</div><div class="stat-label">Ce mois</div></div>
  `;
  const filtered=historique.filter(h=>!q||(h.nom+' '+h.prenom+' '+h.protoName+' '+h.localisation).toLowerCase().includes(q));
  const listEl=document.getElementById('hist-list');
  if(!filtered.length){
    listEl.innerHTML='<div class="hist-empty">&#128196; Aucun protocole enregistré.<br><small>Créez un protocole et cliquez sur "Sauvegarder".</small></div>';
    return;
  }
  listEl.innerHTML=filtered.map((h,i)=>`
    <div class="hist-item" onclick="openHistModal(${historique.indexOf(h)})">
      <div class="hist-header">
        <span class="hist-name">${h.prenom} ${h.nom}</span>
        <span class="hist-date">&#128197; ${h.date} ${h.cureNum?'— Cure N°'+h.cureNum:''}</span>
      </div>
      <div class="hist-meta">
        <span class="hist-proto">${h.protoName}</span>
        ${h.localisation?'<span>'+h.localisation+'</span>':''}
        ${h.medecin?'<span style="margin-left:8px;color:var(--blue-mid)">'+h.medecin+'</span>':''}
      </div>
    </div>
  `).join('');
}

function openHistModal(i){
  selHistIdx=i;
  const h=historique[i];
  document.getElementById('modal-title').textContent=h.prenom+' '+h.nom+' — '+h.protoName;
  document.getElementById('modal-body').innerHTML=`
    <div class="fg g2" style="margin-bottom:12px">
      <div><div class="field"><label>Date</label><input type="text" value="${h.date}" readonly style="background:var(--gray-light)"></div></div>
      <div><div class="field"><label>N° Dossier</label><input type="text" value="${h.dossier||'—'}" readonly style="background:var(--gray-light)"></div></div>
      <div><div class="field"><label>Âge</label><input type="text" value="${h.age} ans" readonly style="background:var(--gray-light)"></div></div>
      <div><div class="field"><label>Poids / Taille</label><input type="text" value="${h.poids} kg / ${h.taille} cm" readonly style="background:var(--gray-light)"></div></div>
      <div><div class="field"><label>Surface corporelle</label><input type="text" value="${h.sc} m²" readonly style="background:var(--gray-light)"></div></div>
      <div><div class="field"><label>Protocole</label><input type="text" value="${h.protoName}" readonly style="background:var(--gray-light)"></div></div>
      <div class="fg" style="grid-column:span 2"><div class="field"><label>Localisation</label><input type="text" value="${h.localisation||'—'}" readonly style="background:var(--gray-light)"></div></div>
      <div class="fg" style="grid-column:span 2"><div class="field"><label>Médecin</label><input type="text" value="${h.medecin||'—'}" readonly style="background:var(--gray-light)"></div></div>
    </div>
  `;
  document.getElementById('hist-modal').classList.add('open');
}

function closeModal(){document.getElementById('hist-modal').classList.remove('open');}

function reloadFromHistory(){
  const h=historique[selHistIdx];
  if(!h) return;
  document.getElementById('prenom').value=h.prenom;
  document.getElementById('nom').value=h.nom;
  document.getElementById('age').value=h.age;
  document.getElementById('poids').value=h.poids;
  document.getElementById('taille').value=h.taille;
  document.getElementById('sexe').value=h.sexe;
  document.getElementById('indication').value=h.indication;
  document.getElementById('localisation').value=h.localisation||'';
  // Restore atcd
  const atcdSel = document.getElementById('atcd-select');
  const atcdInp = document.getElementById('atcd');
  const atcdVal = h.atcd||'RAS';
  const atcdOpt = [...atcdSel.options].find(o=>o.value===atcdVal);
  if(atcdOpt){ atcdSel.value=atcdVal; atcdInp.style.display='none'; atcdInp.value=atcdVal; }
  else { atcdSel.value='autre'; atcdInp.style.display=''; atcdInp.value=atcdVal; }
  document.getElementById('dossier').value=h.dossier||'';
  document.getElementById('total-cures').value=h.totalCures||4;
  document.getElementById('cure-num').value=h.cureNum||1;
  selId=h.protoId;
  calcSC();
  closeModal();
  showPage('protocole',document.querySelector('.tab-btn'));
  document.querySelectorAll('.tab-btn')[0].classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
}

/* ============================================================
   PRINT
============================================================ */
/* ============================================================
   PRÉPARATION — Volume à aspirer par flacon
   Concentrations basées sur les RCP et le fichier de
   conditionnement CHNCAK (CONDITIONNMENT_DES_FLACONS...)
============================================================ */

// Concentration de chaque présentation (mg/mL) et volume du flacon (mL)
// Source : conditionnement CHNCAK + RCP fabricants
const DRUG_CONCENTRATIONS = {
  'OXALIPLATINE': [
    {dosage:50,  vol:10,  concMgMl:5,   label:'Flacon 50 mg / 10 mL  (5 mg/mL)'},
    {dosage:100, vol:20,  concMgMl:5,   label:'Flacon 100 mg / 20 mL (5 mg/mL)'},
  ],
  'CISPLATINE': [
    {dosage:10,  vol:20,  concMgMl:0.5, label:'Flacon 10 mg / 20 mL  (0,5 mg/mL)'},
    {dosage:50,  vol:100, concMgMl:0.5, label:'Flacon 50 mg / 100 mL (0,5 mg/mL)'},
  ],
  'CARBOPLATINE': [
    {dosage:150, vol:15,  concMgMl:10,  label:'Flacon 150 mg / 15 mL (10 mg/mL)'},
    {dosage:450, vol:45,  concMgMl:10,  label:'Flacon 450 mg / 45 mL (10 mg/mL)'},
  ],
  'TAXOL (Paclitaxel)': [
    {dosage:100, vol:16.7,concMgMl:6,   label:'Flacon 100 mg / 16,7 mL (6 mg/mL)'},
  ],
  'TAXOTÈRE (Docétaxel)': [
    {dosage:20,  vol:1,   concMgMl:20,  label:'Flacon 20 mg / 1 mL   (20 mg/mL)'},
    {dosage:80,  vol:4,   concMgMl:20,  label:'Flacon 80 mg / 4 mL   (20 mg/mL)'},
  ],
  'DOXORUBICINE': [
    {dosage:50,  vol:25,  concMgMl:2,   label:'Flacon 50 mg / 25 mL  (2 mg/mL)'},
  ],
  'ÉPIRUBICINE': [
    {dosage:50,  vol:25,  concMgMl:2,   label:'Flacon 50 mg / 25 mL  (2 mg/mL)'},
  ],
  'CYCLOPHOSPHAMIDE': [
    {dosage:500, vol:25,  concMgMl:20,  label:'Flacon 500 mg / 25 mL (20 mg/mL) — reconstituer avec 25 mL eau PPI'},
    {dosage:1000,vol:50,  concMgMl:20,  label:'Flacon 1000 mg / 50 mL (20 mg/mL) — reconstituer avec 50 mL eau PPI'},
  ],
  'GEMCITABINE': [
    {dosage:1000,vol:25,  concMgMl:40,  label:'Flacon 1000 mg / 25 mL (40 mg/mL)'},
    {dosage:200, vol:5,   concMgMl:40,  label:'Flacon 200 mg / 5 mL (40 mg/mL)'},
  ],
  'IRINOTÉCAN': [
    {dosage:100, vol:5,   concMgMl:20,  label:'Flacon 100 mg / 5 mL  (20 mg/mL)'},
  ],
  'AVASTIN (Bévacizumab)': [
    {dosage:400, vol:16,  concMgMl:25,  label:'Flacon 400 mg / 16 mL (25 mg/mL)'},
  ],
  '5-FLUOROURACILE': [
    {dosage:500, vol:10,  concMgMl:50,  label:'Flacon 500 mg / 10 mL (50 mg/mL)'},
  ],
  '5-FLUOROURACILE bolus': [
    {dosage:500, vol:10,  concMgMl:50,  label:'Flacon 500 mg / 10 mL (50 mg/mL)'},
  ],
  '5-FLUOROURACILE perfusion': [
    {dosage:500, vol:10,  concMgMl:50,  label:'Flacon 500 mg / 10 mL (50 mg/mL)'},
  ],
  'LEUCOVORINE (LV)': [
    {dosage:50,  vol:5,   concMgMl:10,  label:'Flacon 50 mg / 5 mL  (10 mg/mL)'},
  ],
  'MÉTHOTREXATE': [
    {dosage:500, vol:20,  concMgMl:25,  label:'Flacon 500 mg / 20 mL (25 mg/mL)'},
  ],
  'TRASTUZUMAB': [
    {dosage:150, vol:7.2, concMgMl:21,  label:'Flacon 150 mg / 7,2 mL (21 mg/mL) — reconstituer avec 7,2 mL eau PPI'},
  ],
  'ÉTOPOSIDE': [
    {dosage:100, vol:5,   concMgMl:20,  label:'Flacon 100 mg / 5 mL  (20 mg/mL)'},
  ],
  'DACARBAZINE': [
    {dosage:400, vol:20,  concMgMl:20,  label:'Flacon 400 mg — reconstituer avec 20 mL eau PPI (20 mg/mL)'},
  ],
  'VINCRISTINE': [
    {dosage:1,   vol:1,   concMgMl:1,   label:'Flacon 1 mg / 1 mL    (1 mg/mL)'},
  ],
  'VINBLASTINE': [
    {dosage:10,  vol:10,  concMgMl:1,   label:'Flacon 10 mg / 10 mL  (1 mg/mL)'},
  ],
  'NAVELBINE': [
    {dosage:50,  vol:5,   concMgMl:10,  label:'Flacon 50 mg / 5 mL   (10 mg/mL)'},
  ],
  'BLÉOMYCINE': [
    {dosage:15,  vol:5,   concMgMl:3,   label:'Flacon 15 mg — reconstituer avec 5 mL eau PPI (3 mg/mL)'},
  ],
  'CYTARABINE': [
    {dosage:100, vol:5,   concMgMl:20,  label:'Flacon 100 mg / 5 mL  (20 mg/mL)'},
  ],
  'PEMETREXED': [
    {dosage:100, vol:4.2, concMgMl:25,  label:'Flacon 100 mg / 4,2 mL (25 mg/mL) — reconstituer avec 4,2 mL NaCl 0,9%'},
  ],
};

// Precautions per drug family
const DRUG_PRECAUTIONS = {
  'OXALIPLATINE':      {color:'#0A3D7A', bg:'#EEF4FD', icon:'🔵', txt:'Ne jamais utiliser de solvant chloré (NaCl). Utiliser uniquement G5%. Rincer toute la ligne avec G5% avant et après.'},
  'CISPLATINE':        {color:'#0A3D7A', bg:'#EEF4FD', icon:'🔵', txt:'Hydratation obligatoire avant et après. Protéger de la lumière. Surveiller la fonction rénale.'},
  'CARBOPLATINE':      {color:'#0A3D7A', bg:'#EEF4FD', icon:'🔵', txt:'Contrôle de la créatininémie obligatoire avant chaque cure. Ne pas utiliser d\'aiguilles ou sets en aluminium.'},
  'TAXOL (Paclitaxel)':{color:'#8B1A1A', bg:'#FDEAEA', icon:'🔴', txt:'Prémédication antiallergique obligatoire (corticoïdes + antihistaminiques). Utiliser tubulure non-PVC (polyéthylène). Surveiller signes d\'hypersensibilité pendant les 15 premières minutes.'},
  'TAXOTÈRE (Docétaxel)':{color:'#8B1A1A', bg:'#FDEAEA', icon:'🔴', txt:'Prémédication corticoïde 3 jours (J-1, J0, J+1). Surveiller rétention hydrique. Utiliser tubulure non-PVC.'},
  'DOXORUBICINE':      {color:'#8B1A1A', bg:'#FDEAEA', icon:'🔴', txt:'VÉSICANT — extravasation très dangereuse. Voie veineuse centrale recommandée. Protéger de la lumière. Surveillance cardiaque (dose cumulée max 550 mg/m²).'},
  'ÉPIRUBICINE':       {color:'#8B1A1A', bg:'#FDEAEA', icon:'🔴', txt:'VÉSICANT — même précautions que Doxorubicine. Dose cumulée max 900 mg/m². Surveillance cardiaque.'},
  'CYCLOPHOSPHAMIDE':  {color:'#7A4B00', bg:'#FFF3DC', icon:'🟠', txt:'Reconstituer avec eau PPI stérile. Hyperhydratation requise pour prévenir la cystite hémorragique. Mesna recommandé à hautes doses.'},
  'GEMCITABINE':       {color:'#7A4B00', bg:'#FFF3DC', icon:'🟠', txt:'Ne pas réfrigérer après reconstitution (précipitation). Perfusion en 30 mn — durée plus longue augmente la toxicité.'},
  'IRINOTÉCAN':        {color:'#7A4B00', bg:'#FFF3DC', icon:'🟠', txt:'Atropine 0,25 mg SC disponible pour syndrome cholinergique aigu. Lopéramide disponible pour diarrhée tardive.'},
  'AVASTIN (Bévacizumab)': {color:'#7A4B00', bg:'#FFF3DC', icon:'🟠', txt:'NE PAS SECOUER. Première perfusion en 90 mn, puis 60 mn, puis 30 mn si tolérée. Ne pas congeler.'},
  '5-FLUOROURACILE':   {color:'#0B5E3C', bg:'#E4F5ED', icon:'🟢', txt:'Injection lente IV directe ou perfusion continue selon protocole. Surveiller mucites et syndrome main-pied. Protéger de la lumière.'},
  '5-FLUOROURACILE bolus': {color:'#0B5E3C', bg:'#E4F5ED', icon:'🟢', txt:'Injection lente IV directe ou bolus. Surveiller mucites et syndrome main-pied.'},
  '5-FLUOROURACILE perfusion': {color:'#0B5E3C', bg:'#E4F5ED', icon:'🟢', txt:'Perfusion continue sur 22-46h via pompe. Utiliser filtre 0,2 µm. Protéger de la lumière.'},
  'LEUCOVORINE (LV)':  {color:'#0B5E3C', bg:'#E4F5ED', icon:'🟢', txt:'Administrer avant ou simultanément au 5-FU. Ne pas mélanger dans la même seringue.'},
  'DACARBAZINE':       {color:'#8B1A1A', bg:'#FDEAEA', icon:'🔴', txt:'TRÈS PHOTOSENSIBLE — protéger strictement de la lumière (papier alu sur poche et tubulure). Vésicant.'},
  'BLÉOMYCINE':        {color:'#8B1A1A', bg:'#FDEAEA', icon:'🔴', txt:'Test-dose 1-2 UI avant première administration (risque fièvre/choc). Dose cumulée max 300 UI (fibrose pulmonaire).'},
  'VINCRISTINE':       {color:'#8B1A1A', bg:'#FDEAEA', icon:'🔴', txt:'VÉSICANT MAJEUR — usage IV STRICTEMENT INTERDIT par voie intrathécale (FATAL). Neurotoxicité dose-limitante.'},
  'TRASTUZUMAB':       {color:'#7A4B00', bg:'#FFF3DC', icon:'🟠', txt:'Reconstituer avec eau PPI fournie. Ne pas agiter. 1ère perfusion en 90 mn. Surveiller cardiotoxicité (FE cardiaque).'},
};

function getVolAspirer(drugName, doseMg){
  const presentations = DRUG_CONCENTRATIONS[drugName];
  if(!presentations || !doseMg) return null;

  // Sort presentations by dosage desc
  const sorted = [...presentations].sort((a,b)=>b.dosage-a.dosage);
  let remaining = doseMg;
  const steps = [];

  for(const p of sorted){
    while(remaining > 0.01){
      const volNeeded = remaining / p.concMgMl;
      if(volNeeded <= p.vol){
        // This flacon covers the rest
        steps.push({
          flacon: p.label,
          dosage: p.dosage,
          concMgMl: p.concMgMl,
          volFlacon: p.vol,
          mgAspire: Math.round(remaining*100)/100,
          volAspire: Math.round((remaining/p.concMgMl)*100)/100,
          volRestant: Math.round((p.vol - remaining/p.concMgMl)*100)/100,
        });
        remaining = 0;
        break;
      } else {
        // Use entire flacon
        steps.push({
          flacon: p.label,
          dosage: p.dosage,
          concMgMl: p.concMgMl,
          volFlacon: p.vol,
          mgAspire: p.dosage,
          volAspire: p.vol,
          volRestant: 0,
        });
        remaining -= p.dosage;
      }
    }
    if(remaining <= 0.01) break;
  }

  return steps;
}

function renderPreparation(){
  if(!selId) return;
  const proto   = PROTOCOLS.find(p=>p.id===selId); if(!proto)return;
  const empty   = document.getElementById('prep-empty');
  const content = document.getElementById('prep-content');
  const btn     = document.getElementById('prep-print-btn');
  const subtitle= document.getElementById('prep-subtitle');

  if(!proto || sc<=0){
    empty.style.display   = '';
    content.style.display = 'none';
    btn.disabled = true; btn.style.opacity='0.5'; btn.style.cursor='not-allowed';
    subtitle.textContent = 'Sélectionnez un protocole pour générer la fiche de préparation.';

    return;
  }

  empty.style.display   = 'none';
  content.style.display = '';
  btn.disabled = false; btn.style.opacity='1'; btn.style.cursor='pointer';


  const prenom  = document.getElementById('prenom').value;
  const nom     = document.getElementById('nom').value;
  const pdsVal  = document.getElementById('poids').value;
  subtitle.textContent = `${proto.name} — ${prenom} ${nom} — SC ${sc.toFixed(2)} m²`;

  // Patient band
  document.getElementById('prep-patient-band').innerHTML = `
    <div style="font-size:15px;font-weight:700">${prenom.toUpperCase()} ${nom.toUpperCase()}</div>
    <div style="opacity:0.85;font-size:12px">Protocole : <b>${proto.name}</b></div>
    <div style="opacity:0.85;font-size:12px">SC : <b>${sc.toFixed(2)} m²</b></div>
    <div style="opacity:0.85;font-size:12px">Poids : <b>${pdsVal} kg</b></div>
    <div style="opacity:0.85;font-size:12px">Date : <b>${new Date().toLocaleDateString('fr-FR')}</b></div>
  `;

  // Active drugs (exclude rehydration/rinçage and fixed support drugs)
  const activeDrugs = proto.drugs.filter(d=>!d.t && !/magn[ée]?sium|calcium|prednisone|nacl|glucose|g5|ssi/i.test(d.name || '') && (d.mgm2||d.carbo||d.avastin||d.fix));
  let stepNum = 0;
  let allPrecautions = [];
  let materiel = new Set(['Gants stériles','Masque','Lunettes de protection','Hotte à flux laminaire','Seringues stériles (diverses)','Aiguilles stériles','Compresses stériles','Étiquettes médicaments']);

  const stepsHTML = activeDrugs.map(d=>{
    const dose = getDose(d);
    if(!dose.val && !dose.txt) return '';
    stepNum++;

    const steps = dose.val ? getVolAspirer(d.name, dose.val) : null;
    const dynSolObj = dose.val ? getSolvantVol(d.name, dose.val) : null;
    const dynSol = dynSolObj ? `${dynSolObj.vol} cc ${dynSolObj.sol}` : (dose.sol||d.sol||'—');

    // Collect precautions
    const precaut = DRUG_PRECAUTIONS[d.name];
    if(precaut && !allPrecautions.find(p=>p.name===d.name)){
      allPrecautions.push({name:d.name, ...precaut});
    }

    // Collect materiel
    if(d.name && d.name.includes('TAXOL')) materiel.add('Tubulure non-PVC (polyéthylène)');
    if(d.name && d.name.includes('TAXOTÈRE')) materiel.add('Tubulure non-PVC');
    if(d.name && (d.name.includes('DOXO')||d.name.includes('ÉPIRU'))) materiel.add('Voie centrale recommandée');
    if(d.name && d.name.includes('5-FLUORO') && d.name.includes('perfusion')) materiel.add('Pompe à perfusion');
    if(d.name && d.name.includes('DACARBAZINE')) materiel.add('Papier aluminium (protection lumière)');
    if(dynSolObj) materiel.add(`Poche ${dynSolObj.vol} cc ${dynSolObj.sol}`);

    // Build aspiration steps table
    const aspirationRows = steps ? steps.map((s,i)=>`
      <tr>
        <td style="padding:6px 10px;border:1px solid var(--gray-border);font-size:12px;font-weight:600;color:var(--blue);background:var(--blue-pale)">
          ${s.flacon}
        </td>
        <td style="padding:6px 10px;border:1px solid var(--gray-border);font-size:13px;font-weight:700;text-align:center">
          <span style="background:var(--blue);color:white;border-radius:4px;padding:3px 10px;font-family:var(--mono)">
            ${s.volAspire} mL
          </span>
        </td>
        <td style="padding:6px 10px;border:1px solid var(--gray-border);font-size:12px;text-align:center">
          <b>${s.mgAspire} mg</b>
        </td>
        <td style="padding:6px 10px;border:1px solid var(--gray-border);font-size:12px;text-align:center;color:${s.volRestant>0?'var(--amber)':'var(--green)'}">
          ${s.volRestant>0 ? '<b>'+s.volRestant+' mL</b><br><small>à jeter</small>' : '<b>0 mL</b><br><small>flacon entier</small>'}
        </td>
      </tr>`).join('')
    : `<tr><td colspan="4" style="padding:8px 10px;font-size:12px;color:var(--gray-mid);border:1px solid var(--gray-border);font-style:italic">
         Médicament à dose fixe — ${dose.txt}
       </td></tr>`;

    const precautBadge = precaut
      ? `<span style="background:${precaut.bg};color:${precaut.color};border-radius:4px;padding:2px 8px;font-size:11px;font-weight:600">${precaut.icon} ${precaut.txt.substring(0,60)}...</span>`
      : '';

    return `
    <div class="card" style="margin-bottom:12px;border-left:4px solid var(--blue)">
      <div class="card-header" style="background:var(--blue-pale)">
        <div class="card-num">${stepNum}</div>
        <h2 style="color:var(--blue);font-size:14px">${d.name}
          <span style="font-size:11px;font-weight:400;color:var(--blue-mid);margin-left:8px">→ Dose prescrite : <b>${dose.val||'—'} mg</b></span>
        </h2>
      </div>
      <div class="card-body">

        <!-- Solvant préparation -->
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:12px">
          <div style="background:var(--green-pale);border:1px solid #B0DCC5;border-radius:var(--radius);padding:8px 14px;font-size:12px">
            <span style="color:var(--green);font-weight:600">Solvant de dilution :</span>
            <span style="font-size:14px;font-weight:700;color:var(--green);margin-left:6px">${dynSol}</span>
          </div>
          <div style="background:var(--amber-pale);border:1px solid #F0C060;border-radius:var(--radius);padding:8px 14px;font-size:12px">
            <span style="color:var(--amber);font-weight:600">Durée de perfusion :</span>
            <span style="font-size:13px;font-weight:700;color:var(--amber);margin-left:6px">${d.dur||'—'}</span>
          </div>
          ${d.note?`<div style="background:var(--red-pale);border:1px solid #F5AAAA;border-radius:var(--radius);padding:8px 14px;font-size:12px;color:var(--red2)">⚠ ${d.note}</div>`:''}
        </div>

        <!-- Volume à aspirer -->
        <div style="font-size:12px;font-weight:600;color:var(--gray-mid);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">
          Volume à aspirer du (des) flacon(s)
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;min-width:450px">
            <thead>
              <tr style="background:var(--gray-light)">
                <th style="padding:6px 10px;border:1px solid var(--gray-border);font-size:11px;text-align:left;font-weight:600;color:var(--gray-mid)">Flacon / Présentation</th>
                <th style="padding:6px 10px;border:1px solid var(--gray-border);font-size:11px;text-align:center;font-weight:600;color:var(--blue)">Volume à aspirer ↓</th>
                <th style="padding:6px 10px;border:1px solid var(--gray-border);font-size:11px;text-align:center;font-weight:600;color:var(--gray-mid)">Quantité (mg)</th>
                <th style="padding:6px 10px;border:1px solid var(--gray-border);font-size:11px;text-align:center;font-weight:600;color:var(--amber)">Reliquat flacon</th>
              </tr>
            </thead>
            <tbody>${aspirationRows}</tbody>
          </table>
        </div>

        <!-- Instruction résumée -->
        ${steps ? `<div style="margin-top:8px;background:var(--blue-pale);border-radius:var(--radius);padding:8px 12px;font-size:12px;color:var(--blue)">
          <b>&#128204; Instruction :</b>
          Aspirer <b>${steps.reduce((s,x)=>s+x.volAspire,0).toFixed(1)} mL</b> au total
          (${steps.map(s=>s.volAspire+' mL du flacon '+s.dosage+' mg').join(' + ')})
          → injecter dans <b>${dynSol}</b>.
        </div>` : ''}

      </div>
    </div>`;
  }).join('');

  document.getElementById('prep-steps').innerHTML = stepsHTML || '<p style="color:var(--gray-mid);padding:20px;text-align:center">Aucun médicament injectable pour ce protocole.</p>';

  // Materiel
  document.getElementById('prep-materiel').innerHTML = [...materiel].map(m=>`
    <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--gray-light);border-radius:var(--radius);font-size:12px">
      <span style="color:var(--blue);font-size:14px">&#9679;</span> ${m}
    </div>`).join('');

  // Precautions
  document.getElementById('prep-precautions').innerHTML = allPrecautions.length
    ? allPrecautions.map(p=>`
        <div style="background:${p.bg};border-left:3px solid ${p.color};padding:6px 10px;border-radius:4px;margin-bottom:6px;font-size:12px;color:${p.color}">
          <b>${p.icon} ${p.name} :</b> ${p.txt}
        </div>`).join('')
    : '<span style="color:var(--green)">✓ Pas de précaution particulière pour ce protocole.</span>';
}

/* ============================================================
   APERÇU & IMPRESSION
============================================================ */
function buildDocumentHTML(){
  const proto = PROTOCOLS.find(p=>p.id===selId); if(!proto)return;
  if(!proto || sc<=0) return null;

  const prenom       = document.getElementById('prenom').value.trim();
  const nom          = document.getElementById('nom').value.trim();
  const age          = document.getElementById('age').value;
  const pdsVal       = document.getElementById('poids').value;
  const tailleVal    = document.getElementById('taille').value;
  const ind          = document.getElementById('indication').value;
  const loc          = document.getElementById('localisation').value||'—';
  const atcd         = getAtcd()||'RAS';
  const med          = document.getElementById('medecin-select').value||'';
  const dossier      = document.getElementById('dossier').value||'';
  const cubix        = document.getElementById('cubix').value||'';
  const codegratuite = document.getElementById('codegratuite').value||'';
  const totalC       = document.getElementById('total-cures').value||'4';
  const cureN        = document.getElementById('cure-num').value||'';
  const dp           = document.getElementById('date-protocole').value;
  const dateProto    = dp ? dp.split('-').reverse().join('/') : new Date().toLocaleDateString('fr-FR');

  const rows = proto.drugs.map(d=>{
    const dose = getDose(d);
    if(dose.cls==='rh') return `<tr><td colspan="5" style="padding:3px 8px;font-size:10px;color:#555;background:#f0f0f0;font-style:italic;border:1px solid #ccc">${d.label}, faire passer en ${d.dur}</td></tr>`;
    const lim = checkDoseLimit(d.name, dose.val);
    const warn = lim==='danger'?' <b style="color:#C0392B">ALERTE</b>':lim==='warn'?' <span style="color:#E67E22">⚠</span>':'';
    const doseCell = (dose.calc||dose.oral) ? `<b>${dose.txt}</b>${warn}${dose.note?'<br><small style="color:#888;font-style:italic">'+dose.note+'</small>':''}` : dose.txt;
    const solDisplay = dose.sol||d.sol||'—';
    const rowBg = d.hl?'background:#f0f4fb;':'';
    const bold  = d.hl?'font-weight:bold;':'';
    return `<tr>
      <td style="padding:4px 6px;border:1px solid #ccc;font-size:10px;${bold}${rowBg}">${d.name}${d.note?'<br><small style="color:#c07800;font-style:italic">⚠ '+d.note+'</small>':''}</td>
      <td style="padding:4px 6px;border:1px solid #ccc;font-size:10px;${rowBg}">${doseCell}</td>
      <td style="padding:4px 6px;border:1px solid #ccc;font-size:10px;${rowBg}">${solDisplay}</td>
      <td style="padding:4px 6px;border:1px solid #ccc;font-size:10px;${rowBg}">${d.dur||'—'}</td>
      <td style="padding:4px 6px;border:1px solid #ccc;font-size:10px;${rowBg}">${d.ryt||'—'}</td>
    </tr>`;
  }).join('');

  let capeHtml = '';
  if(proto.hasCape){
    const capeDrug = proto.drugs.find(d=>d.oral);
    if(capeDrug){
      const dt=Math.round(capeDrug.mgm2*sc);
      const cp500=Math.floor(dt/500), cp150=Math.round((dt-cp500*500)/150);
      const cpTxt=(cp500>0?cp500+' cp à 500 mg':'')+(cp150>0?(cp500?' + ':'')+cp150+' cp à 150 mg':'');
      const makeRows=(from,to)=>Array.from({length:to-from+1},(_,i)=>`
        <tr><td style="border:1px solid #ccc;padding:3px 5px;font-size:9px;font-weight:bold;text-align:center;background:#e8eef8;width:30px">J${from+i}</td>
        <td style="border:1px solid #ccc;padding:3px 5px;font-size:9px">${cpTxt} = <b>${dt} mg</b></td>
        <td style="border:1px solid #ccc;padding:3px 5px;font-size:9px;text-align:center;width:45px">&#9744;</td>
        <td style="border:1px solid #ccc;padding:3px 5px;font-size:9px;text-align:center;width:45px">&#9744;</td></tr>`).join('');
      capeHtml=`<div style="margin-top:7px">
        <div style="font-size:9px;font-weight:bold;color:#0A3D7A;border-left:3px solid #0A3D7A;padding-left:5px;margin-bottom:4px;text-transform:uppercase">Capécitabine — ${dt} mg × 2/j</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <table style="width:100%;border-collapse:collapse"><thead><tr>
            <th style="border:1px solid #0A3D7A;padding:3px 5px;background:#0A3D7A;color:white;font-size:8px">Jour</th>
            <th style="border:1px solid #0A3D7A;padding:3px 5px;background:#0A3D7A;color:white;font-size:8px">Comprimés</th>
            <th style="border:1px solid #0A3D7A;padding:3px 5px;background:#0A3D7A;color:white;font-size:8px">Matin ✓</th>
            <th style="border:1px solid #0A3D7A;padding:3px 5px;background:#0A3D7A;color:white;font-size:8px">Soir ✓</th>
          </tr></thead><tbody>${makeRows(1,7)}</tbody></table>
          <table style="width:100%;border-collapse:collapse"><thead><tr>
            <th style="border:1px solid #0A3D7A;padding:3px 5px;background:#0A3D7A;color:white;font-size:8px">Jour</th>
            <th style="border:1px solid #0A3D7A;padding:3px 5px;background:#0A3D7A;color:white;font-size:8px">Comprimés</th>
            <th style="border:1px solid #0A3D7A;padding:3px 5px;background:#0A3D7A;color:white;font-size:8px">Matin ✓</th>
            <th style="border:1px solid #0A3D7A;padding:3px 5px;background:#0A3D7A;color:white;font-size:8px">Soir ✓</th>
          </tr></thead><tbody>${makeRows(8,14)}</tbody></table>
        </div>
        <div style="margin-top:4px;font-size:8.5px;color:#7A4B00;background:#FFF3DC;padding:3px 7px;border-radius:3px">
          ⚠ Repos 7j — Avaler entiers avec eau 30mn après repas. Ne pas écraser. NFS + Créatinine au 5e jour.
        </div></div>`;
    }
  }

  const carboBox = (proto.hasCarbo && carboDose>0)
    ? `<div style="background:#EEF4FD;border:1px solid #B8D0F5;padding:3px 8px;font-size:9px;color:#0A3D7A;margin:3px 0;border-radius:3px">
        <b>Calvert :</b> Créatininémie ${document.getElementById('creatinine').value} µmol/L —
        ClCr ${document.getElementById('res-clcr').textContent} mL/min —
        AUC ${document.getElementById('res-auc').textContent} —
        <b>Dose : ${carboDose} mg</b></div>` : '';

  return `
    <table style="width:100%;border-collapse:collapse;margin-bottom:6px"><tr>
      <td style="width:50px;vertical-align:top;padding-right:6px">
        <img src="${LOGO_B64}" style="width:45px;height:45px;object-fit:contain" alt="CHNCAK">
      </td>
      <td style="vertical-align:top;width:57%">
        <div style="font-size:8.5px;line-height:1.65;color:#000">
          République du Sénégal<br><b>Un peuple-un but-une foi</b><br>
          …………………………………<br>Ministère de la Santé et l'Action Sociale<br>
          …………………………………<br>Direction Générale des Etablissements de Santé<br>
          …………………………….<br>Direction des Etablissements Publics de Santé<br>
          ………………………………<br><b>Centre Hospitalier National Cheikh Ahmadoul Khadim</b><br>
          ……………………………….<br><b>Service d'Oncologie - Radiothérapie</b>
        </div>
      </td>
      <td style="vertical-align:top;text-align:right;font-size:9px;line-height:1.9;color:#000">
        <b>N° Dossier : ${dossier||'________'}</b><br>
        <span style="font-size:8.5px">Date : <b>${dateProto}</b></span><br>
        ${cubix?'<span style="font-size:8.5px">ID Cubix : <b>'+cubix+'</b></span><br>':''}
        ${codegratuite?'<span style="font-size:8.5px">Code Gratuite : <b>'+codegratuite+'</b></span>':''}
      </td>
    </tr></table>

    <div style="border:1.5px solid #000;padding:5px 10px;margin-bottom:5px;text-align:center">
      <div style="font-size:11px;font-weight:bold;text-transform:uppercase">PROTOCOLE (${proto.detail})</div>
      <div style="font-size:9px;margin-top:2px">Indication : <b>${ind}</b></div>
    </div>

    <div style="margin-bottom:5px">
      <div style="font-size:12px;font-weight:bold;margin-bottom:3px">${prenom.toUpperCase()} ${nom.toUpperCase()}</div>
      <div style="font-size:10px;margin-bottom:2px">Age : <b>${age} ans</b>&nbsp;&nbsp;&nbsp;Poids : <b>${pdsVal} kg</b>&nbsp;&nbsp;&nbsp;taille : <b>${tailleVal} cm</b>&nbsp;&nbsp;&nbsp;SC : <b>${sc.toFixed(2)} m²</b></div>
      <div style="font-size:10px;margin-bottom:2px">Localisation : <b>${loc}</b></div>
      <div style="font-size:10px">Antécédents médicaux : <b>${atcd}</b></div>
    </div>

    ${carboBox}

    <table style="width:100%;border-collapse:collapse;margin-bottom:4px">
      <thead><tr>
        <th style="border:1px solid #ccc;padding:4px 6px;background:#e8eef8;font-size:9px;text-align:left;width:30%">Médicaments</th>
        <th style="border:1px solid #ccc;padding:4px 6px;background:#e8eef8;font-size:9px;text-align:left;width:14%">Dose</th>
        <th style="border:1px solid #ccc;padding:4px 6px;background:#e8eef8;font-size:9px;text-align:left;width:27%">Solvant</th>
        <th style="border:1px solid #ccc;padding:4px 6px;background:#e8eef8;font-size:9px;text-align:left;width:12%">Durée</th>
        <th style="border:1px solid #ccc;padding:4px 6px;background:#e8eef8;font-size:9px;text-align:left;width:17%">Rythme</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div style="font-size:10px;margin:4px 0 3px">
      Faire au total <b><u>${totalC} cures</u></b> puis évaluation
      ${cureN?'&nbsp;&nbsp;&nbsp;<b>Cure N° : '+cureN+'</b>':''}
    </div>
    ${capeHtml}
    <div style="text-align:right;margin-top:8px">
      <div style="display:inline-block;text-align:center;font-size:9px;min-width:150px">
        <div style="font-style:italic">Médecin traitant</div>
        <div style="font-weight:bold;font-size:11px;margin-top:2px">${med||'DR ________________'}</div>
        <div style="border-bottom:1px solid #000;margin-top:24px;width:150px"></div>
      </div>
    </div>`;
}

function renderApercu(){
  if(!selId) return;
  const proto   = PROTOCOLS.find(p=>p.id===selId); if(!proto)return;
  const empty   = document.getElementById('apercu-empty');
  const wrapper = document.getElementById('apercu-sheet-wrapper');
  const btn     = document.getElementById('apercu-print-btn');
  const subtitle= document.getElementById('apercu-subtitle');
  if(!proto||sc<=0){
    if(empty) empty.style.display='';
    if(wrapper) wrapper.style.display='none';
    if(btn){btn.disabled=true;btn.style.opacity='0.5';btn.style.cursor='not-allowed';}
    if(subtitle) subtitle.textContent='Remplissez les données patient et choisissez un protocole pour voir l\'aperçu.';
    return;
  }
  const html = buildDocumentHTML();
  if(!html){ if(empty) empty.style.display=''; if(wrapper) wrapper.style.display='none'; return; }
  if(empty) empty.style.display='none';
  if(wrapper) wrapper.style.display='';
  if(btn){btn.disabled=false;btn.style.opacity='1';btn.style.cursor='pointer';}
  const prenom=document.getElementById('prenom').value;
  const nom=document.getElementById('nom').value;
  if(subtitle) subtitle.textContent=`Protocole ${proto.name} — ${prenom} ${nom}`;
  const c1=document.getElementById('apercu-content-1');
  const c2=document.getElementById('apercu-content-2');
  if(c1) c1.innerHTML=html;
  if(c2) c2.innerHTML=html;
  scaleApercuSheet();
}

function scaleApercuSheet(){
  const sheet=document.getElementById('apercu-sheet');
  if(!sheet) return;
  const wrapper=sheet.parentElement;
  const available=wrapper.clientWidth-32;
  const naturalW=794;
  const scale=available<naturalW?available/naturalW:1;
  sheet.style.transform=`scale(${scale})`;
  sheet.style.transformOrigin='top left';
  wrapper.style.height=(sheet.offsetHeight*scale+32)+'px';
}
window.addEventListener('resize', scaleApercuSheet);

function printFromApercu(){
  const html=buildDocumentHTML();
  if(!html) return;
  const proto=PROTOCOLS.find(p=>p.id===selId); if(!proto)return;
  const prenom=document.getElementById('prenom').value;
  const nom=document.getElementById('nom').value;
  const fullDoc=`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
  <title>Protocole ${proto?proto.name:''} — ${prenom} ${nom}</title>
  <style>@page{size:A4;margin:8mm 14mm}*{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#000;background:white}
  .cut{border:none;border-top:1.5px dashed #888;margin:6px 0}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
  <div>${html}</div><div class="cut"></div><div>${html}</div>
  </body></html>`;
  const frame=document.getElementById('print-frame');
  frame.style.cssText='position:fixed;left:-9999px;top:0;width:210mm;height:297mm;border:none;display:block';
  const fdoc=frame.contentDocument||frame.contentWindow.document;
  fdoc.open();fdoc.write(fullDoc);fdoc.close();
  setTimeout(()=>{
    try{frame.contentWindow.focus();frame.contentWindow.print();}
    catch(e){const b=new Blob([fullDoc],{type:'text/html'});window.open(URL.createObjectURL(b),'_blank');}
    setTimeout(()=>{frame.style.cssText='display:none;position:fixed;left:-9999px;width:0;height:0;border:none';},3000);
  }, 400);
}

function validatePreparation(){
  const proto = PROTOCOLS.find(p=>p.id===selId); if(!proto)return;
  if(!proto||sc<=0) return;

  const prenom = document.getElementById('prenom').value;
  const nom    = document.getElementById('nom').value;

  if(!confirm(`Valider la sortie physique des médicaments pour ${prenom} ${nom} — ${proto.name} ?

Cela déduira les flacons utilisés du stock.`)) return;

  const activeDrugs = proto.drugs.filter(d=>!d.t && !/magn[ée]?sium|calcium|prednisone|nacl|glucose|g5|ssi/i.test(d.name || '') && (d.mgm2||d.carbo||d.avastin||d.fix));
  let updated = 0, warnings = [];

  activeDrugs.filter(d => !/magn[ée]?sium|calcium|prednisone|nacl|glucose|g5|ssi/i.test(d.name || '')).forEach(d=>{
    const dose = getDose(d);
    if(!dose.val) return;
    const calc = calcFlacons(d.name, dose.val);
    if(!calc) return;

    const drugIdx = catalog.findIndex(cat=>cat.name===d.name);
    if(drugIdx===-1){ warnings.push(`${d.name} : non trouvé dans le catalogue`); return; }

    const stock = catalog[drugIdx].qteStock ?? catalog[drugIdx].stock ?? 0;
    if(stock < calc.nbFlacons){
      warnings.push(`${d.name} : stock insuffisant (${stock} disponible, ${calc.nbFlacons} requis)`);
      return;
    }
    catalog[drugIdx].qteStock = stock - calc.nbFlacons;
    updated++;
  });

  localStorage.setItem('chncak_catalog', JSON.stringify(catalog));

  // Log to historique
  const entry = {
    id: Date.now(),
    date: new Date().toLocaleDateString('fr-FR'),
    dateTs: Date.now(),
    type: 'sortie',
    patient: `${prenom} ${nom}`,
    protocole: proto.name,
    details: activeDrugs.map(d=>{
      const dose=getDose(d);
      const calc=dose.val?calcFlacons(d.name,dose.val):null;
      return calc?`${d.name}: ${calc.nbFlacons} flacon(s)`:null;
    }).filter(Boolean).join(', ')
  };
  const sorties = JSON.parse(localStorage.getItem('chncak_sorties')||'[]');
  sorties.unshift(entry);
  localStorage.setItem('chncak_sorties', JSON.stringify(sorties));

  let msg = '\u2705 Stock mis \u00e0 jour pour ' + updated + ' m\u00e9dicament(s).';
  if(warnings.length) msg += '\n\nAvertissements :\n' + warnings.join('\n');
  alert(msg);
  
  // Ajouter au OK Chimio
  const medecinSel = document.getElementById('medecin-select')?.value || '';
  if (medecinSel && prenom && nom && protocole) {
    const okEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      patient: {prenom: prenom, nom: nom, age: age, dossier: dossier},
      protocole: protocole.name,
      medecin: medecinSel,
      cure: parseInt(document.getElementById('cure-num')?.value) || 1,
      statut: 'En attente'
    };
    const okList = getOkChimio();
    okList.push(okEntry);
    saveOkChimio(okList);
  }

  // Refresh preparation page
  renderPreparation();
  if(document.getElementById('page-pharmacie').classList.contains('active')) renderPharmacie();
}

function printPreparation(){
  const proto = PROTOCOLS.find(p=>p.id===selId); if(!proto)return;
  if(!proto || sc<=0) return;

  const prenom    = document.getElementById('prenom').value;
  const nom       = document.getElementById('nom').value;
  const age       = document.getElementById('age').value;
  const poids     = document.getElementById('poids').value;
  const tailleVal = document.getElementById('taille').value;
  const dossier   = document.getElementById('dossier').value||'';
  const cubix     = document.getElementById('cubix').value||'';
  const codegrat  = document.getElementById('codegratuite').value||'';
  const med       = document.getElementById('medecin-select').value||'';
  const dp        = document.getElementById('date-protocole').value;
  const dateProto = dp ? dp.split('-').reverse().join('/') : new Date().toLocaleDateString('fr-FR');
  const cureN     = document.getElementById('cure-num').value||'';

  // Build one row per active drug
  const activeDrugs = proto.drugs.filter(d => !d.t && !/magn[ée]?sium|calcium|prednisone|nacl|glucose|g5|ssi/i.test(d.name || '') && (d.mgm2||d.carbo||d.avastin||d.fix));

  let tableRows = '';
  let stepNum = 0;

  proto.drugs.forEach(d => {
    const dose = getDose(d);

    // Réhydratation / Rinçage — show as separator row
    if(dose.cls === 'rh'){
      tableRows += `<tr style="background:#f0f0f0">
        <td colspan="7" style="padding:3px 8px;font-size:9px;color:#777;font-style:italic;border:1px solid #ddd">
          â–¸ ${d.label} — faire passer en ${d.dur}
        </td>
      </tr>`;
      return;
    }

    stepNum++;
    const dose_val  = dose.val || null;
    const dose_txt  = dose.txt || '—';

    // Flacon aspiration calculation
    const steps = dose_val ? getVolAspirer(d.name, dose_val) : null;

    // Dynamic solvant
    const dynSolObj = dose_val ? getSolvantVol(d.name, dose_val) : null;
    const dynSol    = dynSolObj ? `${dynSolObj.vol} cc ${dynSolObj.sol}` : (dose.sol || d.sol || '—');

    // Build aspiration details
    let aspirDetails = '—';
    let totalVol = '—';
    let reliquat = '—';

    if(steps && steps.length){
      const vialMap = {};
      steps.forEach(s => { vialMap[s.dosage] = (vialMap[s.dosage]||0) + 1; });
      const vialStr = Object.entries(vialMap)
        .sort((a,b) => b[0]-a[0])
        .map(([mg,n]) => `${n} fl. × ${mg}mg`)
        .join(' + ');

      const totalV = steps.reduce((s,x) => s + x.volAspire, 0);
      const rel    = steps.reduce((s,x) => s + x.volRestant, 0);

      aspirDetails = steps.map(s =>
        `Aspirer <b>${s.volAspire} mL</b> du fl. ${s.dosage}mg`
      ).join('<br>');
      totalVol = `<b style="color:#0A3D7A;font-size:13px">${totalV.toFixed(1)} mL</b>`;
      reliquat = rel > 0
        ? `<span style="color:#E67E22"><b>${rel.toFixed(1)} mL</b><br><small>à jeter</small></span>`
        : '<span style="color:#0B5E3C">0 mL<br><small>fl. entier</small></span>';
    } else if(d.fix){
      aspirDetails = `Dose fixe : <b>${dose_txt}</b>`;
      totalVol = '—';
      reliquat = '—';
    }

    const precaut = DRUG_PRECAUTIONS[d.name];
    const noteBg  = d.note ? '#FFF3DC' : '';
    const noteStr = d.note ? `<br><small style="color:#c07800">⚠ ${d.note}</small>` : '';

    tableRows += `<tr style="${stepNum%2===0?'background:#f8f8f8':'background:white'}">
      <td style="padding:5px 8px;border:1px solid #ddd;font-size:11px;font-weight:bold;color:#0A3D7A;text-align:center">${stepNum}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;font-size:11px;font-weight:bold">${d.name}${noteStr}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;font-size:12px;font-weight:bold;text-align:center;color:#0A3D7A">${dose_txt}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;font-size:11px">${aspirDetails}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;font-size:11px;text-align:center">${totalVol}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;font-size:11px">${dynSol}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;font-size:11px;text-align:center">${reliquat}</td>
    </tr>`;
  });

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>Fiche Préparation — ${proto.name} — ${prenom} ${nom}</title>
<style>
  @page { size:A4; margin:8mm 12mm; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:Arial,Helvetica,sans-serif; font-size:11px; color:#000; background:white; }
  @media print { body{-webkit-print-color-adjust:exact;print-color-adjust:exact} }
</style>
</head><body>

<!-- EN-TÊTE -->
<table style="width:100%;border-collapse:collapse;margin-bottom:8px">
  <tr>
    <td style="width:60px;vertical-align:middle">
      <img src="${LOGO_B64}" style="width:55px;height:55px;object-fit:contain" alt="CHNCAK">
    </td>
    <td style="vertical-align:top;padding-left:8px">
      <div style="font-size:8px;line-height:1.55;color:#333">
        République du Sénégal — Un peuple-un but-une foi<br>
        Ministère de la Santé et de l'Action Sociale<br>
        <b>Centre Hospitalier National Cheikh Ahmadoul Khadim — TOUBA</b><br>
        <b>Service d'Oncologie-Radiothérapie</b>
      </div>
    </td>
    <td style="text-align:right;vertical-align:top;font-size:9px;line-height:1.8">
      ${dossier ? 'N° <b>'+dossier+'</b><br>' : ''}
      ${cubix ? '<b>'+cubix+'</b><br>' : ''}
      ${codegrat ? '<b>'+codegrat+'</b><br>' : ''}
      Date : <b>${dateProto}</b>
      ${cureN ? '<br>Cure N° : <b>'+cureN+'</b>' : ''}
    </td>
  </tr>
</table>

<!-- TITRE -->
<div style="background:#0A3D7A;color:white;padding:6px 12px;border-radius:4px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
  <div>
    <div style="font-size:13px;font-weight:bold;text-transform:uppercase">FICHE DE PRÉPARATION — ${proto.name}</div>
    <div style="font-size:10px;opacity:0.85;margin-top:2px">${proto.detail}</div>
  </div>
  <div style="text-align:right;font-size:10px;opacity:0.9">
    Médecin : <b>${med || '—'}</b>
  </div>
</div>

<!-- PATIENT -->
<div style="border:1px solid #0A3D7A;border-radius:4px;padding:6px 10px;margin-bottom:8px;background:#EEF4FD">
  <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:8px;align-items:center">
    <div>
      <div style="font-size:9px;color:#555;text-transform:uppercase">Patient</div>
      <div style="font-size:14px;font-weight:bold">${prenom.toUpperCase()} ${nom.toUpperCase()}</div>
    </div>
    <div>
      <div style="font-size:9px;color:#555;text-transform:uppercase">Âge</div>
      <div style="font-size:13px;font-weight:bold">${age} ans</div>
    </div>
    <div>
      <div style="font-size:9px;color:#555;text-transform:uppercase">Poids</div>
      <div style="font-size:13px;font-weight:bold">${poids} kg</div>
    </div>
    <div>
      <div style="font-size:9px;color:#555;text-transform:uppercase">Taille</div>
      <div style="font-size:13px;font-weight:bold">${tailleVal} cm</div>
    </div>
    <div>
      <div style="font-size:9px;color:#555;text-transform:uppercase">Surface corp.</div>
      <div style="font-size:15px;font-weight:bold;color:#0A3D7A">${sc.toFixed(2)} m²</div>
    </div>
  </div>
</div>

<!-- TABLE PRÉPARATION -->
<table style="width:100%;border-collapse:collapse;margin-bottom:8px">
  <thead>
    <tr style="background:#0A3D7A;color:white">
      <th style="padding:5px 8px;font-size:9px;text-align:center;border:1px solid rgba(255,255,255,0.3);width:25px">#</th>
      <th style="padding:5px 8px;font-size:9px;text-align:left;border:1px solid rgba(255,255,255,0.3);width:22%">Médicament</th>
      <th style="padding:5px 8px;font-size:9px;text-align:center;border:1px solid rgba(255,255,255,0.3);width:12%">Dose prescrite</th>
      <th style="padding:5px 8px;font-size:9px;text-align:left;border:1px solid rgba(255,255,255,0.3);width:24%">Aspiration du flacon</th>
      <th style="padding:5px 8px;font-size:9px;text-align:center;border:1px solid rgba(255,255,255,0.3);width:10%">Vol. total aspiré</th>
      <th style="padding:5px 8px;font-size:9px;text-align:left;border:1px solid rgba(255,255,255,0.3);width:18%">Diluer dans</th>
      <th style="padding:5px 8px;font-size:9px;text-align:center;border:1px solid rgba(255,255,255,0.3);width:10%">Reliquat</th>
    </tr>
  </thead>
  <tbody>${tableRows}</tbody>
</table>

<!-- CASE VALIDATION -->
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:10px;border-top:1px solid #0A3D7A;padding-top:8px">
  <div style="font-size:9px;text-align:center">
    <div style="font-weight:bold;margin-bottom:2px;color:#0A3D7A">Préparateur(e)</div>
    <div style="border:1px solid #ccc;height:35px;border-radius:3px;margin-top:4px"></div>
    <div style="margin-top:3px;color:#888">Nom + Signature</div>
  </div>
  <div style="font-size:9px;text-align:center">
    <div style="font-weight:bold;margin-bottom:2px;color:#0A3D7A">Pharmacien(ne)</div>
    <div style="border:1px solid #ccc;height:35px;border-radius:3px;margin-top:4px"></div>
    <div style="margin-top:3px;color:#888">Nom + Signature</div>
  </div>
  <div style="font-size:9px;text-align:center">
    <div style="font-weight:bold;margin-bottom:2px;color:#0A3D7A">Infirmier(e)</div>
    <div style="border:1px solid #ccc;height:35px;border-radius:3px;margin-top:4px"></div>
    <div style="margin-top:3px;color:#888">Nom + Signature + Heure</div>
  </div>
</div>

<div style="margin-top:8px;background:#FFF3DC;border:1px solid #F0C060;border-radius:3px;padding:5px 10px;font-size:9px;color:#7A4B00">
  ⚠ Préparation sous hotte à flux laminaire — Port de gants, masque et lunettes obligatoire — Élimination déchets cytotoxiques selon protocole DASRI
</div>

</body></html>`;

  const frame = document.getElementById('print-frame');
  frame.style.cssText = 'position:fixed;left:-9999px;top:0;width:210mm;height:297mm;border:none;display:block';
  const fdoc = frame.contentDocument || frame.contentWindow.document;
  fdoc.open(); fdoc.write(html); fdoc.close();
  // Use setTimeout to let the iframe render before printing
  setTimeout(() => {
    try {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } catch(e) {
      // Fallback: open in new tab
      const b = new Blob([html], {type:'text/html'});
      window.open(URL.createObjectURL(b), '_blank');
    }
    setTimeout(()=>{ frame.style.cssText='display:none;position:fixed;left:-9999px;width:0;height:0;border:none'; }, 3000);
  }, 400);
}

/* ============================================================
   ORDONNANCE SUPPORT/* ============================================================
   ORDONNANCE SUPPORT
============================================================ */
// Support medications per protocol family
const SUPPORT_PROTOCOLS = {
  // Platine-based — nausées +++, nephrotoxicité
  platinum: {
    antiemetiques:[
      {drug:'Ondansétron (Zofran)',dose:'8 mg',voie:'IV lent 15 mn',moment:'30 mn avant chimio puis J1 à J3'},
      {drug:'Dexaméthasone',dose:'8 mg',voie:'IV',moment:'30 mn avant chimio + J1 à J3'},
      {drug:'Métoclopramide (Primpéran)',dose:'10 mg × 3/j',voie:'PO',moment:'En cas de nausées retardées J2-J5'},
    ],
    hyperhydratation:[
      {drug:'SSI 0,9%',dose:'1000 cc',voie:'IV',moment:'Avant Cisplatine'},
      {drug:'G5% + KCl 2g + MgSO4 1g',dose:'500 cc',voie:'IV',moment:'Pendant Cisplatine'},
      {drug:'SSI 0,9%',dose:'1000 cc',voie:'IV',moment:'Après Cisplatine'},
    ],
    autres:[
      {drug:'Furosémide (Lasilix)',dose:'20 mg si diurèse insuffisante',voie:'IV',moment:'Si diurèse < 100 mL/h'},
      {drug:'Magnésium 10%',dose:'2 amp',voie:'IV dilué G5%',moment:'J1 systématique'},
    ]
  },
  // Taxanes — allergie, neurotoxicité
  taxane:{
    premedication:[
      {drug:'Dexaméthasone',dose:'20 mg',voie:'PO ou IV',moment:'La veille et le matin du traitement (Taxol) / 3j pour Taxotère'},
      {drug:'Diphénhydramine (Diphenhydramine)',dose:'50 mg',voie:'IV lent',moment:'30 mn avant Taxol'},
      {drug:'Ranitidine',dose:'50 mg',voie:'IV',moment:'30 mn avant Taxol'},
    ],
    antiemetiques:[
      {drug:'Ondansétron',dose:'8 mg',voie:'IV',moment:'30 mn avant chimio'},
      {drug:'Dexaméthasone',dose:'8 mg',voie:'IV',moment:'Inclus dans prémédication'},
    ],
    autres:[
      {drug:'G-CSF (Filgrastim)',dose:'5 µg/kg/j SC',voie:'SC',moment:'J3 à J10 si neutropénie attendue'},
    ]
  },
  // Anthracyclines — nausées, cardiotoxicité
  anthracycline:{
    antiemetiques:[
      {drug:'Ondansétron',dose:'8 mg',voie:'IV',moment:'30 mn avant chimio'},
      {drug:'Dexaméthasone',dose:'8 mg',voie:'IV',moment:'Avant chimio'},
      {drug:'Aprépitant (Emend)',dose:'125 mg J1, 80 mg J2-J3',voie:'PO',moment:'Nausées chimio hautement émétisante'},
    ],
    autres:[
      {drug:'G-CSF (Filgrastim)',dose:'5 µg/kg/j',voie:'SC',moment:'J3-J10 (dose-dense obligatoire)'},
      {drug:'Dexrazoxane (Cardioxane)',dose:'10× dose Doxorubicine',voie:'IV',moment:'Si dose cumulée > 300 mg/m²'},
    ]
  },
  // Capécitabine — syndrome main-pied, mucites
  oral:{
    soins:[
      {drug:'Uréa crème 10%',dose:'Application 2×/j',voie:'Topique',moment:'Prévention syndrome main-pied dès J1'},
      {drug:'Bain de bouche Bicarbonate',dose:'1 cs dans 200 mL eau',voie:'Gargarisme',moment:'Après chaque repas prévention mucites'},
      {drug:'Vitamine B6 (Pyridoxine)',dose:'50 mg × 3/j',voie:'PO',moment:'En cas de syndrome main-pied'},
    ]
  },
  // Général
  general:{
    antiemetiques:[
      {drug:'Ondansétron',dose:'8 mg',voie:'IV',moment:'30 mn avant chimio'},
      {drug:'Métoclopramide',dose:'10 mg × 3/j',voie:'PO',moment:'Si nausées à domicile'},
    ],
    autres:[
      {drug:'Paracétamol',dose:'1g × 3/j',voie:'PO',moment:'Si fièvre ou douleurs'},
      {drug:'Lopéramide (Imodium)',dose:'4 mg puis 2 mg/selles',voie:'PO',moment:'Si diarrhée'},
    ]
  }
};

// Map protocol to support category
function getSupportCategory(protoId){
  const platine  = ['xelox','ecx','carbo_taxol','carbo_taxol175','gemox','folfox','folfiri','bep','vip','mvac','map'];
  const taxane   = ['carbo_taxol','carbo_taxol175','taxotere','xeliri'];
  const anthra   = ['ac60','ac60_j21','rchop','chop','abvd','mvac','map'];
  const hasCape  = ['xelox','ecx','xeliri'];
  return {
    platine:  platine.includes(protoId),
    taxane:   taxane.includes(protoId),
    anthra:   anthra.includes(protoId),
    oral:     hasCape.includes(protoId),
  };
}

function renderSupport(){
  if(!selId) return;
  const proto   = PROTOCOLS.find(p=>p.id===selId); if(!proto)return;
  const empty   = document.getElementById('support-empty');
  const content = document.getElementById('support-content');
  const btn     = document.getElementById('support-print-btn');
  const subtitle= document.getElementById('support-subtitle');

  if(!proto){
    empty.style.display=''; content.style.display='none';
    btn.disabled=true; btn.style.opacity='0.5'; btn.style.cursor='not-allowed';
    const kb=document.getElementById('kit-print-btn'); if(kb){kb.disabled=true;kb.style.opacity='0.5';kb.style.cursor='not-allowed';}
    const pb=document.getElementById('postcchimio-print-btn'); if(pb){pb.disabled=true;pb.style.opacity='0.5';pb.style.cursor='not-allowed';}
    return;
  }
  empty.style.display='none'; content.style.display='';
  btn.disabled=false; btn.style.opacity='1'; btn.style.cursor='pointer';
  const kb2=document.getElementById('kit-print-btn'); if(kb2){kb2.disabled=false;kb2.style.opacity='1';kb2.style.cursor='pointer';}
  const pb2=document.getElementById('postcchimio-print-btn'); if(pb2){pb2.disabled=false;pb2.style.opacity='1';pb2.style.cursor='pointer';}

  const prenom = document.getElementById('prenom').value;
  const nom    = document.getElementById('nom').value;
  subtitle.textContent = `${proto.name} — ${prenom} ${nom}`;

  const cats = getSupportCategory(proto.id);
  let sections = [];

  const makeTable = (title, color, bg, icon, items) => `
    <div class="card" style="margin-bottom:12px;border-left:4px solid ${color}">
      <div class="card-header" style="background:${bg}">
        <div class="card-num" style="background:${color}">${icon}</div>
        <h2 style="color:${color};font-size:13px">${title}</h2>
      </div>
      <div class="card-body" style="padding:0">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:${bg}">
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:${color};border-bottom:1px solid var(--gray-border);width:30%">Médicament</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:${color};border-bottom:1px solid var(--gray-border);width:15%">Dose</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:${color};border-bottom:1px solid var(--gray-border);width:12%">Voie</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:${color};border-bottom:1px solid var(--gray-border)">Moment / Instructions</th>
          </tr></thead>
          <tbody>
            ${items.map((m,i)=>`<tr style="${i%2===0?'background:'+bg+';opacity:0.5':''}">
              <td style="padding:8px 12px;border-bottom:1px solid var(--gray-border);font-weight:600">${m.drug}</td>
              <td style="padding:8px 12px;border-bottom:1px solid var(--gray-border)">${m.dose}</td>
              <td style="padding:8px 12px;border-bottom:1px solid var(--gray-border)">${m.voie}</td>
              <td style="padding:8px 12px;border-bottom:1px solid var(--gray-border);color:var(--gray-mid)">${m.moment}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  // Always show general antiemetics
  sections.push(makeTable('Antiémétiques', 'var(--blue)', 'var(--blue-pale)', '💊',
    SUPPORT_PROTOCOLS.general.antiemetiques));

  if(cats.platine) sections.push(makeTable(
    'Hyperhydratation (Platine)', 'var(--blue)', 'var(--blue-pale)', '💧',
    SUPPORT_PROTOCOLS.platinum.hyperhydratation));

  if(cats.platine) sections.push(makeTable(
    'Support Rénal (Platine)', '#0B5E3C', 'var(--green-pale)', '💧',
    SUPPORT_PROTOCOLS.platinum.autres));

  if(cats.taxane) sections.push(makeTable(
    'Prémédication Antiallergique (Taxane)', 'var(--red2)', 'var(--red-pale)', '⚠ï¸',
    SUPPORT_PROTOCOLS.taxane.premedication));

  if(cats.anthra) sections.push(makeTable(
    'Support Anthracyclines + G-CSF', 'var(--amber)', 'var(--amber-pale)', '♥',
    SUPPORT_PROTOCOLS.anthracycline.autres));

  if(cats.oral) sections.push(makeTable(
    'Soins Capécitabine (Syndrome main-pied)', 'var(--green)', 'var(--green-pale)', '🤲',
    SUPPORT_PROTOCOLS.oral.soins));

  sections.push(makeTable('Traitement symptomatique général', 'var(--gray)', 'var(--gray-light)', '🩺',
    SUPPORT_PROTOCOLS.general.autres));

  content.innerHTML = `
    <div style="background:var(--blue);color:white;border-radius:var(--radius-lg);padding:10px 16px;margin-bottom:14px;font-size:13px">
      <b>Protocole : ${proto.name}</b> &nbsp;|&nbsp; Patient : ${prenom} ${nom} &nbsp;|&nbsp; 
      Date : ${new Date().toLocaleDateString('fr-FR')}
    </div>
    ${sections.join('')}
    <div style="background:var(--amber-pale);border:1px solid #F0C060;border-radius:var(--radius);padding:10px 14px;font-size:12px;color:var(--amber);margin-top:4px">
      ⚠ï¸ Cette ordonnance de support est indicative. Le médecin prescripteur adapte selon l'état clinique du patient.
    </div>`;
}

function printSupport(){
  if(!selId || selId === 'null' || selId === 'undefined'){
    alert('⚠ï¸ Veuillez d\'abord sélectionner un protocole dans l\'onglet Protocole');
    return;
  }
  const proto = PROTOCOLS.find(p=>p.id===selId);
  if(!proto) return;
  const prenom = document.getElementById('prenom').value;
  const nom    = document.getElementById('nom').value;
  const content = document.getElementById('support-content').innerHTML;

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
  <title>Support ${proto.name} — ${prenom} ${nom}</title>
  <style>
    @page{size:A4;margin:12mm 14mm}
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;font-size:11px;color:#000}
    table{width:100%;border-collapse:collapse}
    th,td{padding:5px 8px;border:1px solid #ddd;text-align:left;font-size:10px}
    th{background:#e8eef8;font-weight:bold}
    .card{margin-bottom:10px;border:1px solid #ddd;border-radius:4px}
    .card-header{padding:6px 10px;background:#f0f4fb;font-weight:bold;font-size:11px}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
  ${content}
  </body></html>`;

  const frame = document.getElementById('print-frame');
  frame.style.cssText='position:fixed;left:-9999px;top:0;width:210mm;height:297mm;border:none;display:block';
  const fdoc = frame.contentDocument||frame.contentWindow.document;
  fdoc.open(); fdoc.write(html); fdoc.close();
  setTimeout(()=>{
    try{ frame.contentWindow.focus(); frame.contentWindow.print(); }
    catch(e){ const b=new Blob([html],{type:'text/html'}); window.open(URL.createObjectURL(b),'_blank'); }
    setTimeout(()=>{ frame.style.cssText='display:none;position:fixed;left:-9999px;width:0;height:0;border:none'; },3000);
  }, 400);
}

/* ============================================================
   ORDONNANCE KITS PERFUSION
============================================================ */
function printKitPerfusion(){
  if(!selId || selId === 'null' || selId === 'undefined'){
    alert('⚠ï¸ Veuillez d\'abord sélectionner un protocole');
    return;
  }
  const proto  = PROTOCOLS.find(p=>p.id===selId);
  if(!proto) return;
  const prenom = document.getElementById('prenom').value||'';
  const nom    = document.getElementById('nom').value||'';
  const age    = document.getElementById('age').value||'';
  const med    = document.getElementById('medecin-select').value||'DR ________________';
  const dp     = document.getElementById('date-protocole').value;
  const dateStr= dp ? dp.split('-').reverse().join('/') : '___/___/______';

  // â”€â”€ Calcul exact des solutés par protocole â”€â”€
  // Compter les poches SSI et G5% directement dans les drugs du protocole
  let ssiQty = 0, g5Qty = 0;
  proto.drugs.forEach(d => {
    const sol = (d.sol||'') + (d.label||'');
    // SSI 0.9%
    if(sol.includes('SSI')) {
      // Extract volume — count each poche (not les petits volumes < 50 cc = juste diluant)
      const vol = parseInt(sol.match(/(\d+)\s*cc/)?.[1]||'0');
      if(vol >= 100 || d.t === 'r') ssiQty++;
    }
    // G5%
    if(sol.includes('G5%')) {
      const vol = parseInt(sol.match(/(\d+)\s*cc/)?.[1]||'0');
      if(vol >= 100) g5Qty++;
    }
  });
  // Minimums de sécurité
  if(ssiQty === 0) ssiQty = 2;
  if(g5Qty  === 0 && proto.drugs.some(d=>(d.sol||'').includes('G5%'))) g5Qty = 1;

  // â”€â”€ Magnésium et Calcium â”€â”€
  const hasMg = proto.drugs.some(d => d.name && d.name.includes('Magnésium'));
  const hasCa = proto.drugs.some(d => d.name && d.name.includes('Calcium'));

  // Perfuseurs = 1 par poche + 1 spare
  const perfQty = ssiQty + g5Qty + 1;
  const cathQty = 1;
  // Seringues : 1 par médicament injectable fixe + 2 spare
  const serQty  = proto.drugs.filter(d=>!d.t && (d.fix||d.mgm2||d.carbo||d.avastin)).length + 2;

  // â”€â”€ Build item lines dynamically â”€â”€
  const buildItems = (numStyle) => {
    const sep = numStyle === 'dot' ? '.' : '-';
    let n = 0;
    const line = (label, qty, extra='') => {
      n++;
      return `
      <div style="display:flex;align-items:baseline;margin-bottom:16px">
        <span style="min-width:20px;font-weight:600;font-size:10px">${n}${sep}</span>
        <span style="flex:1;font-size:10px">${label} ………………………………………………</span>
        <span style="white-space:nowrap;font-size:10px">N° <b>${qty}</b></span>
      </div>
      ${extra ? `<div style="font-size:9px;color:#555;margin-left:20px;margin-top:-12px;margin-bottom:10px;font-style:italic">${extra}</div>` : ''}`;
    };

    let html = '';
    html += line('Sérum salé isotonique 0,9%', ssiQty);
    html += line('Sérum glucosé 5%', g5Qty > 0 ? g5Qty : '—');
    if(hasMg) html += line('Magnésium 10%', '2 amp', '2 ampoules dans 250 cc G5%');
    if(hasCa) html += line('Calcium 10%',   '2 amp', '2 ampoules (avec Magnésium)');
    html += line('Perfuseur', perfQty);
    html += line('Cathéter bleu', cathQty);
    html += line('Seringue 10 cc', serQty);
    return html;
  };

  // â”€â”€ One bloc (called twice) â”€â”€
  const bloc = (numStyle) => `
  <div style="width:47%;display:inline-block;vertical-align:top">

    <!-- EN-TÊTE -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:5px">
      <tr>
        <td style="width:38px;vertical-align:top">
          <img src="${LOGO_B64}" style="width:36px;height:36px;object-fit:contain">
        </td>
        <td style="vertical-align:top;text-align:center;padding:0 3px">
          <div style="font-size:7px;line-height:1.5;color:#000">
            République du Sénégal<br><b>Un peuple-un but-une foi</b><br>
            …………………………………<br>Ministère de la Santé et l'Action Sociale<br>
            …………………………………<br>Direction Générale des Etablissements de Santé<br>
            …………………………….<br>Direction des Etablissements Publics de Santé<br>
            ………………………………<br><b>Centre Hospitalier National Cheikh Ahmadoul Khadim</b><br>
            ……………………………….<br><b>Service d'Oncologie - Radiothérapie</b>
          </div>
        </td>
        <td style="width:38px;vertical-align:top;text-align:right">
          <img src="${LOGO_B64}" style="width:34px;height:34px;object-fit:contain;opacity:0.5">
        </td>
      </tr>
    </table>

    <!-- DATE -->
    <div style="text-align:right;font-size:9px;margin-bottom:5px">Date : ${dateStr}</div>

    <!-- PATIENT -->
    <div style="border:1.5px solid #000;padding:5px 10px;margin-bottom:8px;font-size:9px;line-height:2">
      <b>Prénom :</b> ${prenom.toUpperCase()}<br>
      <b>Nom :</b> ${nom.toUpperCase()}<br>
      <b>Age :</b> ${age} ans
    </div>

    <!-- PROTOCOLE (petit) -->
    <div style="text-align:center;font-size:8px;color:#0A3D7A;margin-bottom:6px;font-style:italic">
      Protocole : <b>${proto.name}</b>
    </div>

    <!-- TITRE -->
    <div style="text-align:center;font-size:14px;font-weight:900;font-family:'Times New Roman',serif;
                text-transform:uppercase;letter-spacing:0.06em;margin-bottom:14px;
                border-bottom:1.5px solid #000;padding-bottom:5px">ORDONNANCE</div>

    <!-- ITEMS -->
    <div>${buildItems(numStyle)}</div>

    <!-- SIGNATURE -->
    <div style="text-align:right;margin-top:18px;font-size:10px;font-weight:bold">
      Médecin traitant<br>
      <span style="font-size:11px;display:block;margin-top:2px">${med}</span>
      <div style="border-bottom:1px solid #000;margin-top:28px;width:140px;margin-left:auto"></div>
    </div>
  </div>`;

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>Ordonnance Kits Perfusion — ${proto.name} — ${prenom} ${nom}</title>
<style>
  @page{size:A4 landscape;margin:8mm 10mm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,Helvetica,sans-serif;color:#000;background:white}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head><body>
<div style="display:flex;width:100%;gap:0">
  ${bloc('dot')}
  <div style="width:2%;border-left:1.5px dashed #aaa;margin:0 1.5%"></div>
  ${bloc('dash')}
</div>
</body></html>`;

  const frame = document.getElementById('print-frame');
  frame.style.cssText='position:fixed;left:-9999px;top:0;width:297mm;height:210mm;border:none;display:block';
  const fdoc=frame.contentDocument||frame.contentWindow.document;
  fdoc.open();fdoc.write(html);fdoc.close();
  setTimeout(()=>{
    try{frame.contentWindow.focus();frame.contentWindow.print();}
    catch(e){const b=new Blob([html],{type:'text/html'});window.open(URL.createObjectURL(b),'_blank');}
    setTimeout(()=>{frame.style.cssText='display:none;position:fixed;left:-9999px;width:0;height:0;border:none';},3000);
  },400);
}

/* ============================================================
   ORDONNANCE POST-CHIMIOTHÉRAPIE
============================================================ */
function printPostChimio(){
  if(!selId || selId === 'null' || selId === 'undefined'){
    alert('⚠ï¸ Veuillez d\'abord sélectionner un protocole');
    return;
  }
  const proto  = PROTOCOLS.find(p=>p.id===selId);
  if(!proto) return;
  const prenom = document.getElementById('prenom').value||'';
  const nom    = document.getElementById('nom').value||'';
  const age    = document.getElementById('age').value||'';
  const med    = document.getElementById('medecin-select').value||'';
  const dp     = document.getElementById('date-protocole').value;
  const now    = new Date();
  const dateStr= dp ? dp.split('-').reverse().join('/') :
    `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;

  // Items du nouveau modèle
  const items = [
    {num:1, drug:'BETAMETHASONE-GH',            qty:'N°1', instruction:'2 cp/j pdt 4 jours après chaque séance pdt tte la chimio'},
    {num:2, drug:'Pantonex DR',                  qty:'N°1', instruction:'1 cp / le soir pdt tte la chimio'},
    {num:3, drug:'Neufer sirop',                  qty:'N°1', instruction:'10 ml X 2/j pdt tte la chimio'},
    {num:null, sep:'AU BESOIN'},
    {num:4, drug:'Tracedol (cp)',                 qty:'N°1', instruction:'1cp x 3/j — SI DOULEURS'},
    {num:5, drug:'Setronax',                      qty:'N°1', instruction:'1cp x 3/j 15 min avant les repas — SI VOMISSEMENTS'},
    {num:6, drug:'ALPRAZ 0.5 mg (cp)',            qty:'N°1', instruction:'1cp le soir /j — SI INSOMNIES'},
    {num:7, drug:'DESYREL SIROP',                 qty:'N°1', instruction:'1 cas X 2/j — SI ANXIÉTÉ'},
    {num:8, drug:'DUFALAC SACHET',                qty:'N°1', instruction:'1 Sachet X 3/j — SI CONSTIPATIONS'},
    {num:9, drug:'SMECTA SACHET',                 qty:'N°1', instruction:'1 sachet x 3/j — SI DIARRHÉE'},
    {num:10,drug:'Adna Bain de bouche',           qty:'N°1', instruction:'1 application X 2 j — SI STOMATITE'},
  ];

  const itemHTML = items.map(it => {
    if(it.sep) return `
      <div style="background:#F0F0F0;border-radius:3px;padding:3px 10px;margin:10px 0 8px;font-size:10px;font-weight:700;letter-spacing:0.08em;color:#555;text-align:center">
        ${it.sep}
      </div>`;
    return `
      <div style="margin-bottom:9px;page-break-inside:avoid">
        <div style="display:flex;align-items:baseline">
          <span style="min-width:20px;font-size:10px;font-weight:600">${it.num}.</span>
          <span style="font-size:10px;font-weight:bold;text-decoration:underline">${it.drug}</span>
          <span style="font-size:10px;flex:1;margin-left:2px">……………………………………</span>
          <span style="font-size:10px;white-space:nowrap;font-weight:700">${it.qty}</span>
        </div>
        <div style="font-size:9px;color:#444;margin-left:20px;margin-top:1px;font-style:italic">${it.instruction}</div>
      </div>`;
  }).join('');

  const html=`<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>Ordonnance Post-Chimio — ${prenom} ${nom}</title>
<style>
  @page{size:A4;margin:10mm 12mm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#000;background:white}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head><body>

<table style="width:100%;border-collapse:collapse;min-height:92vh">
<tr>

  <!-- COLONNE GAUCHE -->
  <td style="width:30%;vertical-align:top;padding-right:10px;border-right:1px solid #ccc;font-size:8px;line-height:1.7">

    <!-- Logo + En-tête officiel -->
    <div style="text-align:center;margin-bottom:8px">
      <img src="${LOGO_B64}" style="width:50px;height:50px;object-fit:contain">
    </div>
    <div style="font-size:7px;text-align:center;line-height:1.6;margin-bottom:8px;border-bottom:1px solid #ddd;padding-bottom:8px">
      République du Sénégal<br><b>Un peuple-un but-une foi</b><br>
      …………………………………<br>Ministère de la Santé et l'Action Sociale<br>
      …………………………………<br>Direction Générale des Etablissements de Santé<br>
      …………………………….<br>Direction des Etablissements Publics de Santé<br>
      ………………………………<br><b>Centre Hospitalier National Cheikh Ahmadoul Khadim</b><br>
      ……………………………….<br><b>Service d'Oncologie - Radiothérapie</b>
    </div>

    <!-- Personnel -->
    <div style="border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:6px">
      <div style="font-weight:bold;font-size:8px;color:#0A3D7A;margin-bottom:3px">Oncologue-Radiothérapeute</div>
      <div style="font-style:italic">Dr. Maimouna Mané</div>
      <div style="font-size:7px;color:#666">Poste : 14323</div>
      <div style="margin-top:3px;font-style:italic">Dr M. Fallou Sall</div>
      <div style="font-style:italic">Dr Moussa Diallo</div>
    </div>

    <div style="border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:6px">
      <div style="font-weight:bold;font-size:8px;color:#0A3D7A;margin-bottom:3px">Chirurgien-oncologue</div>
      <div style="font-style:italic">Dr P.S. Dieng</div>
    </div>

    <div style="border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:6px">
      <div style="font-weight:bold;font-size:8px;color:#0A3D7A;margin-bottom:3px">Médecin généraliste</div>
      <div style="font-style:italic">Dr Modou Sene</div>
    </div>

    <div style="border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:6px">
      <div style="font-weight:bold;font-size:8px;color:#0A3D7A;margin-bottom:3px">Major</div>
      <div style="font-style:italic">Serigne Mor Samb Guèye</div>
    </div>

    <div style="border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:6px">
      <div style="font-weight:bold;font-size:8px;color:#0A3D7A;margin-bottom:3px">Infirmière</div>
      <div style="font-style:italic">Diouma S. Diallo</div>
      <div style="font-style:italic">Khady Ndiaye Leye</div>
      <div style="font-style:italic">Mame Diarra B. Niang</div>
    </div>

    <div style="border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:6px">
      <div style="font-weight:bold;font-size:8px;color:#0A3D7A;margin-bottom:3px">Assistante-Infirmière</div>
      <div style="font-style:italic">Fatoumata Faye</div>
      <div style="font-style:italic">Daouda Lassana Coulibaly</div>
      <div style="font-style:italic">Binta Sow</div>
    </div>

    <div style="border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:6px">
      <div style="font-weight:bold;font-size:8px;color:#0A3D7A;margin-bottom:3px">Physique médicale</div>
      <div style="font-style:italic">Dr. Magatte Diagne</div>
      <div style="font-style:italic">Dr Adji Yaram Diop</div>
      <div style="font-style:italic">Mouhamad Diaw</div>
    </div>

    <div>
      <div style="font-weight:bold;font-size:8px;color:#0A3D7A;margin-bottom:3px">Secrétariat</div>
      <div style="font-style:italic">Ndeye Aminata Fall</div>
      <div style="font-style:italic">Ngagne Ngom</div>
      <div style="font-size:7px;color:#666">Poste : 14321</div>
      <div style="margin-top:4px;font-size:7.5px">☎ 77 099 69 57</div>
      <div style="font-size:7.5px">77 099 69 66</div>
      <div style="font-size:7.5px">TÉL FIXE : 339783751</div>
      <div style="margin-top:6px;font-weight:bold;font-size:8px;color:#0A3D7A;text-align:center">À RENOUVELER</div>
    </div>
  </td>

  <!-- COLONNE DROITE -->
  <td style="vertical-align:top;padding-left:14px">

    <!-- Date + Patient -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
      <div style="font-size:12px;line-height:2.2">
        <b>Prénom :</b> <span style="border-bottom:1px solid #000;display:inline-block;min-width:120px;padding:0 4px">${prenom.toUpperCase()}</span><br>
        <b>Nom :</b> <span style="border-bottom:1px solid #000;display:inline-block;min-width:130px;padding:0 4px">${nom.toUpperCase()}</span>
        &nbsp;&nbsp;<b>Age :</b> <span style="border-bottom:1px solid #000;display:inline-block;min-width:40px;padding:0 4px">${age}</span> ans
      </div>
      <div style="text-align:right;font-size:11px">
        Date : ……/……/${dateStr.split('/')[2]||'2025'}
      </div>
    </div>

    <!-- Titre -->
    <div style="text-align:center;font-size:15px;font-weight:900;font-family:'Times New Roman',serif;text-decoration:underline;letter-spacing:0.04em;margin-bottom:14px;padding-bottom:4px;border-bottom:2px solid #000">
      ORDONNANCE POST CHIMIO
    </div>

    <!-- Médicaments -->
    ${itemHTML}

    <!-- Signature -->
    <div style="text-align:right;margin-top:16px;font-size:11px;font-weight:bold">
      ${med ? med : 'Le Médecin traitant'}
      <div style="border-bottom:1px solid #000;margin-top:30px;width:160px;margin-left:auto"></div>
    </div>

    <!-- Pied -->
    <div style="position:fixed;bottom:10mm;right:14mm;font-size:8px;color:#888">
      Email : onco.chn.cak@gmail.com
    </div>
  </td>
</tr>
</table>

</body></html>`;

  const frame=document.getElementById('print-frame');
  frame.style.cssText='position:fixed;left:-9999px;top:0;width:210mm;height:297mm;border:none;display:block';
  const fdoc=frame.contentDocument||frame.contentWindow.document;
  fdoc.open();fdoc.write(html);fdoc.close();
  setTimeout(()=>{
    try{frame.contentWindow.focus();frame.contentWindow.print();}
    catch(e){const b=new Blob([html],{type:'text/html'});window.open(URL.createObjectURL(b),'_blank');}
    setTimeout(()=>{frame.style.cssText='display:none;position:fixed;left:-9999px;width:0;height:0;border:none';},3000);
  },400);
}

/* ============================================================
   PROGRAMME HEBDOMADAIRE — Fonctions principales
============================================================ */
let programmeData = JSON.parse(localStorage.getItem('chncak_programme')||'{}');
let progConfig = JSON.parse(localStorage.getItem('chncak_prog_config')||'{"resp1":"FATOUMATA FAYE","resp2":"BINTA SOW","salle":"SALLE CHIMIO"}');
let currentDay = 0;

const JOURS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi'];
const CHIMIO_COLORS = {
  'XELOX':'#0A3D7A','ECX':'#0B5E3C','CARBO TAXOL':'#6B3FA0',
  'AC60':'#8B1A1A','TAXOL HEBDO':'#7A4B00','GEMOX':'#0A3D7A',
  'CISPLATINE HEBDO':'#185FA5','CARBO GEMCI':'#0B5E3C',
  'EC100':'#C0392B','FOLFOX':'#2E86AB','FOLFIRI':'#A23B72',
};

function saveProgrammeConfig(){
  progConfig.resp1 = document.getElementById('prog-resp1').value;
  progConfig.resp2 = document.getElementById('prog-resp2').value;
  progConfig.salle = document.getElementById('prog-salle').value;
  localStorage.setItem('chncak_prog_config', JSON.stringify(progConfig));
}

function saveProgramme(){
  localStorage.setItem('chncak_programme', JSON.stringify(programmeData));
}

function getSemaineKey(){
  const val = document.getElementById('prog-semaine').value;
  return val || null;
}

function getWeekDates(mondayStr){
  const dates = [];
  const base = new Date(mondayStr);
  for(let i=0;i<5;i++){
    const d = new Date(base);
    d.setDate(base.getDate()+i);
    dates.push(d.toLocaleDateString('fr-FR'));
  }
  return dates;
}

function ensureDayData(semaine, day){
  if(!programmeData[semaine]) programmeData[semaine] = {};
  if(!programmeData[semaine][day]) programmeData[semaine][day] = [];
  return programmeData[semaine][day];
}

function initProgramme(){
  const today = new Date();
  const day = today.getDay();
  const diff = day===0 ? -6 : 1-day;
  const monday = new Date(today);
  monday.setDate(today.getDate()+diff);
  if(!document.getElementById('prog-semaine').value){
    document.getElementById('prog-semaine').value = monday.toISOString().split('T')[0];
  }
  document.getElementById('prog-resp1').value = progConfig.resp1||'FATOUMATA FAYE';
  document.getElementById('prog-resp2').value = progConfig.resp2||'BINTA SOW';
  document.getElementById('prog-salle').value  = progConfig.salle||'SALLE CHIMIO';
}

function selectDay(dayIdx, btn){
  saveDayFromTable();
  currentDay = dayIdx;
  document.querySelectorAll('.prog-day-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderProgramme();
}

function saveDayFromTable(){
  const semaine = getSemaineKey();
  if(!semaine) return;
  const rows = document.querySelectorAll('#prog-tbody tr[data-idx]');
  const data = [];
  rows.forEach(row=>{
    const inputs = row.querySelectorAll('.prog-input');
    if(inputs.length>=5) data.push({
      prenom:  inputs[0].value.trim(),
      nom:     inputs[1].value.trim(),
      contact: inputs[2].value.trim(),
      chimio:  inputs[3].value.trim(),
      obs:     inputs[4].value.trim(),
      done:    row.classList.contains('prog-row-done'),
    });
  });
  if(!programmeData[semaine]) programmeData[semaine]={};
  programmeData[semaine][currentDay] = data;
  saveProgramme();
}

function renderProgramme() {
  const el = document.getElementById('patients-rdv-list');
  if (!el) return;
  
  const patients = JSON.parse(localStorage.getItem('chncak_patients') || '[]');
  
  // Patients avec RDV (y compris les patients traités avec prochainRdv)
  const avecRdv = patients.filter(p => p.prochainRdv);
  
  if (!avecRdv.length) {
    el.innerHTML = `<div style="text-align:center;padding:60px;color:var(--gray-mid)">
      <div style="font-size:48px;margin-bottom:15px">📅</div>
      <div style="font-size:16px;font-weight:600">Aucun rendez-vous programmé</div>
      <div style="font-size:13px;margin-top:8px">Les patients avec RDV apparaîtront ici</div>
    </div>`;
    return;
  }
  
  // Trier par date de RDV
  avecRdv.sort((a,b) => new Date(a.prochainRdv) - new Date(b.prochainRdv));
  
  const rows = avecRdv.map((p,i) => {
    const rdvDate = new Date(p.prochainRdv);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const isPast = rdvDate < today;
    const isToday = rdvDate.toDateString() === today.toDateString();
    
    const bgColor = isToday ? '#FFF3CD' : isPast ? '#FFE5E5' : (i%2===0 ? '#FAFBFD' : 'white');
    
    return `<tr style="background:${bgColor}">
      <td style="padding:10px 12px;font-size:13px;font-weight:600">${p.prenom} ${p.nom}</td>
      <td style="padding:10px 12px;font-size:12px">${p.dossier||'—'}</td>
      <td style="padding:10px 12px;font-size:12px">${p.protocole?.toUpperCase()||'—'}</td>
      <td style="padding:10px 12px;font-size:12px;font-weight:600;color:${isPast?'#D32F2F':isToday?'#F57C00':'#0B5E3C'}">
        ${rdvDate.toLocaleDateString('fr-FR',{weekday:'short',day:'2-digit',month:'short',year:'numeric'})}
      </td>
      <td style="padding:10px 12px;font-size:11px">
        <span style="background:${p.statut==='Terminé' || p.statut==='Traité'?'var(--gray-light)':'var(--green-pale)'};color:${p.statut==='Terminé' || p.statut==='Traité'?'var(--gray-mid)':'var(--green)'};padding:3px 8px;border-radius:4px;font-weight:600">
          ${p.statut==='Terminé' || p.statut==='Traité'?'✓ Terminé':'â— En cours'}
        </span>
      </td>
      <td style="padding:10px 12px;text-align:center">
        ${p.statut !== 'Terminé' && p.statut !== 'Traité' ? `<button onclick="setStatut('${p.id}', 'Traité')" style="background:#27AE60;color:white;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600">✓ Traité</button>` : '—'}
      </td>
    </tr>`;
  }).join('');
  
  el.innerHTML = `
    <div style="margin-bottom:20px;padding:15px;background:#E3F2FD;border-left:4px solid #1976D2;border-radius:4px">
      <div style="font-size:14px;font-weight:600;color:#1976D2">📋 ${avecRdv.length} rendez-vous programmé(s)</div>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:var(--blue);color:white">
          <th style="padding:12px;text-align:left;font-size:12px;font-weight:600">Patient</th>
          <th style="padding:12px;text-align:left;font-size:12px;font-weight:600">Dossier</th>
          <th style="padding:12px;text-align:left;font-size:12px;font-weight:600">Protocole</th>
          <th style="padding:12px;text-align:left;font-size:12px;font-weight:600">Prochain RDV</th>
          <th style="padding:12px;text-align:left;font-size:12px;font-weight:600">Statut</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

let autoSaveTimer = null;
function autoSave(){
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(()=>saveDayFromTable(), 800);
}

function addPatientRow(){
  let semaine = getSemaineKey();
  if(!semaine){
    const today = new Date();
    const diff = today.getDay()===0?-6:1-today.getDay();
    const mon = new Date(today);
    mon.setDate(today.getDate()+diff);
    document.getElementById('prog-semaine').value = mon.toISOString().split('T')[0];
    semaine = getSemaineKey();
  }
  saveDayFromTable();
  ensureDayData(semaine, currentDay).push({prenom:'',nom:'',contact:'',chimio:'',obs:'',done:false});
  saveProgramme();
  renderProgramme();
  setTimeout(()=>{
    const inputs = document.querySelectorAll('#prog-tbody tr:last-child .prog-input');
    if(inputs[0]) inputs[0].focus();
  },100);
}

function deleteRow(idx){
  saveDayFromTable();
  const semaine = getSemaineKey();
  if(!semaine) return;
  programmeData[semaine][currentDay].splice(idx,1);
  saveProgramme();
  renderProgramme();
}

function toggleDone(idx, cb){
  saveDayFromTable();
  const semaine = getSemaineKey();
  if(!semaine) return;
  if(programmeData[semaine]&&programmeData[semaine][currentDay])
    programmeData[semaine][currentDay][idx].done = cb.checked;
  saveProgramme();
  renderProgramme();
}

function clearDay(){
  if(!confirm('Effacer tous les patients de ce jour ?')) return;
  const semaine = getSemaineKey();
  if(!semaine) return;
  if(programmeData[semaine]) programmeData[semaine][currentDay]=[];
  saveProgramme();
  renderProgramme();
}

function renderWeekOverview(semaine, dates){
  const el = document.getElementById('prog-week-overview');
  if(!el) return;
  if(!semaine||!programmeData[semaine]){
    el.innerHTML='<p style="color:var(--gray-mid);font-size:13px;text-align:center;padding:20px">Aucune donnée pour cette semaine.</p>';
    return;
  }
  const html = JOURS.map((jour,i)=>{
    const patients = (programmeData[semaine][i]||[]).filter(p=>p.prenom||p.nom);
    const done = patients.filter(p=>p.done).length;
    return `<div style="flex:1;min-width:130px;background:${i===currentDay?'var(--blue-pale)':'var(--gray-light)'};
      border:${i===currentDay?'1.5px solid var(--blue)':'1px solid var(--gray-border)'};
      border-radius:var(--radius);padding:10px 12px;cursor:pointer" onclick="selectDay(${i},document.getElementById('day-btn-${i}'))">
      <div style="font-size:12px;font-weight:600;color:${i===currentDay?'var(--blue)':'var(--gray)'}">${jour}</div>
      <div style="font-size:10px;color:var(--gray-mid)">${dates[i]||''}</div>
      <div style="font-size:22px;font-weight:700;color:${i===currentDay?'var(--blue)':'var(--gray)'};margin:6px 0">${patients.length}</div>
      <div style="font-size:10px;color:${done===patients.length&&patients.length>0?'var(--green)':'var(--gray-mid)'}">
        ${done}/${patients.length} traités
      </div>
      <div style="background:var(--gray-border);border-radius:4px;height:4px;margin-top:6px;overflow:hidden">
        <div style="background:${i===4?'var(--amber2)':'var(--blue)'};height:100%;width:${patients.length?Math.round(done/patients.length*100):0}%"></div>
      </div>
    </div>`;
  }).join('');
  el.innerHTML = `<div style="display:flex;gap:8px;flex-wrap:wrap">${html}</div>`;
}

function printProgramme(){
  saveDayFromTable();
  const semaine = getSemaineKey();
  if(!semaine){ alert('Sélectionnez une semaine.'); return; }
  const dates   = getWeekDates(semaine);
  const resp1   = document.getElementById('prog-resp1').value;
  const resp2   = document.getElementById('prog-resp2').value;
  const salle   = document.getElementById('prog-salle').value;

  const allDays = JOURS.map((jour,i)=>{
    const patients = (programmeData[semaine]?.[i]||[]).filter(p=>p.prenom||p.nom);
    if(!patients.length && i<4) return '';
    const rows = i===4&&patients.length===0
      ? `<tr><td colspan="7" style="padding:8px;text-align:center;background:#FFF3DC;font-weight:bold;font-size:11px">TRANSFUSIONS SANGUINES</td></tr>`
      : patients.map((p,idx)=>`<tr style="${idx%2===0?'background:#f8f8f8':''}">
          <td style="padding:3px 6px;border:1px solid #ccc;text-align:center;font-size:10px">${idx+1}</td>
          <td style="padding:3px 6px;border:1px solid #ccc;font-size:10px;font-weight:bold">${p.prenom||''}</td>
          <td style="padding:3px 6px;border:1px solid #ccc;font-size:10px;font-weight:bold">${p.nom||''}</td>
          <td style="padding:3px 6px;border:1px solid #ccc;font-size:10px">${p.contact||''}</td>
          <td style="padding:3px 6px;border:1px solid #ccc;font-size:10px;font-weight:bold">${p.chimio||''}</td>
          <td style="padding:3px 6px;border:1px solid #ccc;font-size:10px">${p.obs||''}</td>
          <td style="padding:3px 6px;border:1px solid #ccc;font-size:10px;text-align:center">${resp1}<br>${resp2}</td>
        </tr>`).join('');
    return `<div style="margin-bottom:10px;page-break-inside:avoid">
      <div style="background:#0A3D7A;color:white;padding:4px 8px;font-size:11px;font-weight:bold">
        DATES | ${salle} &nbsp;—&nbsp; ${jour} ${dates[i]||''}
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#e8eef8">
          <th style="padding:3px 6px;border:1px solid #ccc;font-size:9px;width:25px">N°</th>
          <th style="padding:3px 6px;border:1px solid #ccc;font-size:9px">PRÉNOM</th>
          <th style="padding:3px 6px;border:1px solid #ccc;font-size:9px">NOM</th>
          <th style="padding:3px 6px;border:1px solid #ccc;font-size:9px">CONTACTS</th>
          <th style="padding:3px 6px;border:1px solid #ccc;font-size:9px">CHIMIOTHÉRAPIE</th>
          <th style="padding:3px 6px;border:1px solid #ccc;font-size:9px">OBSERVATIONS</th>
          <th style="padding:3px 6px;border:1px solid #ccc;font-size:9px">RESPONSABLE</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }).join('');

  const html=`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
  <title>Programme Chimio</title>
  <style>@page{size:A4 landscape;margin:8mm 12mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:10px}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>
  </head><body>
  <div style="text-align:center;margin-bottom:8px">
    <div style="font-size:13px;font-weight:bold;color:#0A3D7A">PROGRAMME DE CHIMIOTHÉRAPIE — CHNCAK TOUBA</div>
    <div style="font-size:11px">DU ${dates[0]} AU ${dates[4]} &nbsp;|&nbsp; Responsables : ${resp1} / ${resp2}</div>
  </div>
  ${allDays}
  </body></html>`;

  const frame = document.getElementById('print-frame');
  frame.style.cssText='position:fixed;left:-9999px;top:0;width:297mm;height:210mm;border:none;display:block';
  const fdoc=frame.contentDocument||frame.contentWindow.document;
  fdoc.open();fdoc.write(html);fdoc.close();
  setTimeout(()=>{
    try{frame.contentWindow.focus();frame.contentWindow.print();}
    catch(e){const b=new Blob([html],{type:'text/html'});window.open(URL.createObjectURL(b),'_blank');}
    setTimeout(()=>{frame.style.cssText='display:none;position:fixed;left:-9999px;width:0;height:0;border:none';},3000);
  }, 400);
}

function exportProgrammeWord(){
  alert('Export Word disponible dans la prochaine version. Utilisez l\'impression PDF pour l\'instant.');
}

/* ============================================================
   IMPORT PROGRAMME (Excel / Word)
============================================================ */
function importProgramme(input){
  const file = input.files[0];
  if(!file) return;

  const ext = file.name.split('.').pop().toLowerCase();
  const reader = new FileReader();

  if(ext === 'xlsx' || ext === 'xls'){
    reader.onload = e => importFromExcel(e.target.result);
    reader.readAsArrayBuffer(file);
  } else if(ext === 'docx'){
    reader.onload = e => importFromWord(e.target.result);
    reader.readAsArrayBuffer(file);
  } else {
    alert('Format non supporté. Utilisez un fichier Excel (.xlsx) ou Word (.docx).');
  }
  input.value = '';
}

function parsePatientRows(rows){
  // Parse rows from either Excel or Word table
  // Expected columns: DATE | N° | PRENOM | NOM | CONTACT | CHIMIOTHÉRAPIE | OBSERVATIONS | RESPONSABLE
  const dayMap = {}; // date_str -> [{prenom, nom, contact, chimio, obs}]

  rows.forEach(row => {
    if(!row || row.length < 4) return;

    const dateStr  = String(row[0]||'').trim();
    const numStr   = String(row[1]||'').trim();
    const prenom   = String(row[2]||'').trim().toUpperCase();
    const nom      = String(row[3]||'').trim().toUpperCase();
    const contact  = String(row[4]||'').trim();
    const chimio   = String(row[5]||'').trim().toUpperCase();
    const obs      = String(row[6]||'').trim();

    // Skip header rows and empty rows
    if(!prenom && !nom && !chimio) return;
    if(dateStr.toLowerCase().includes('date') || 
       prenom.toLowerCase().includes('prenom') ||
       prenom === 'DATES') return;
    if(!dateStr.match(/\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}/)) return;

    if(!dayMap[dateStr]) dayMap[dateStr] = [];
    dayMap[dateStr].push({prenom, nom, contact, chimio, obs, done:false});
  });

  return dayMap;
}

function applyImportedData(dayMap){
  let semaine = getSemaineKey();

  // Auto-detect week from imported dates if not set
  if(!semaine){
    const allDates = Object.keys(dayMap);
    if(!allDates.length){ alert('Aucune date trouvée dans le fichier.'); return; }

    // Parse first date and find its Monday
    const firstDate = allDates[0];
    const parts = firstDate.split(/[\/\-\.]/);
    let d;
    if(parts[0].length === 4){
      // YYYY-MM-DD
      d = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
    } else {
      // DD/MM/YYYY
      d = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
    }
    const dow = d.getDay();
    const diff = dow===0 ? -6 : 1-dow;
    d.setDate(d.getDate()+diff);
    semaine = d.toISOString().split('T')[0];
    document.getElementById('prog-semaine').value = semaine;
  }

  const dates = getWeekDates(semaine);
  // Map dates[0..4] to day index 0..4
  const dateToDay = {};
  dates.forEach((d, i) => { dateToDay[d] = i; });

  // Also try matching DD/MM/YYYY format variations
  const semBase = new Date(semaine);
  const altDates = [];
  for(let i=0;i<5;i++){
    const d = new Date(semBase);
    d.setDate(semBase.getDate()+i);
    // Try various formats
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yy = d.getFullYear();
    altDates.push({
      idx: i,
      formats: [
        `${dd}/${mm}/${yy}`,
        `${dd}-${mm}-${yy}`,
        `${dd}.${mm}.${yy}`,
        `${d.getDate()}/${d.getMonth()+1}/${yy}`,
      ]
    });
  }

  let totalImported = 0;
  if(!programmeData[semaine]) programmeData[semaine] = {};

  Object.entries(dayMap).forEach(([dateStr, patients]) => {
    let dayIdx = -1;

    // Try direct match
    if(dateToDay[dateStr] !== undefined){
      dayIdx = dateToDay[dateStr];
    } else {
      // Try alt formats
      for(const alt of altDates){
        if(alt.formats.includes(dateStr)){
          dayIdx = alt.idx;
          break;
        }
      }
    }

    if(dayIdx === -1) return; // date not in this week

    // Merge with existing (don't erase)
    const existing = programmeData[semaine][dayIdx] || [];
    const newEntries = patients.filter(p =>
      !existing.some(e => e.prenom === p.prenom && e.nom === p.nom)
    );
    programmeData[semaine][dayIdx] = [...existing, ...newEntries];
    totalImported += newEntries.length;
  });

  saveProgramme();
  renderProgramme();
  alert('\u2705 Import terminé !\n\n'+totalImported+' patient(s) ajouté(s) pour la semaine du '+dates[0]+' au '+dates[4]+'.');
}

function importFromExcel(buffer){
  try {
    const wb = XLSX.read(buffer, {type:'array'});
    const allRows = [];

    wb.SheetNames.forEach(sheetName => {
      const ws = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});
      data.forEach(row => allRows.push(row));
    });

    const dayMap = parsePatientRows(allRows);
    const total = Object.values(dayMap).reduce((s,v)=>s+v.length,0);

    if(total === 0){
      alert('Aucun patient trouvé dans le fichier Excel.\n\nVérifiez que le fichier contient les colonnes :\nDATE | N° | PRENOM | NOM | CONTACT | CHIMIOTHÉRAPIE | OBSERVATIONS');
      return;
    }
    applyImportedData(dayMap);
  } catch(e){
    alert('Erreur lors de la lecture du fichier Excel : ' + e.message);
    console.error(e);
  }
}

function importFromWord(buffer){
  try {
    mammoth.extractRawText({arrayBuffer: buffer}).then(result => {
      const text = result.value;
      // Parse text lines — Word tables become tab-separated or space-separated text
      const lines = text.split('\n').map(l=>l.trim()).filter(l=>l);
      const rows = lines.map(line => {
        // Split by tab or multiple spaces
        return line.split(/\t|\s{2,}/).map(s=>s.trim());
      });
      const dayMap = parsePatientRows(rows);
      const total = Object.values(dayMap).reduce((s,v)=>s+v.length,0);

      if(total === 0){
        alert('Aucun patient trouvé dans le fichier Word.\n\nPour de meilleurs résultats, exportez votre programme en format Excel (.xlsx).');
        return;
      }
      applyImportedData(dayMap);
    }).catch(e => {
      alert('Erreur lors de la lecture du fichier Word : ' + e.message);
    });
  } catch(e){
    alert('Erreur : ' + e.message);
  }
}

/* ============================================================
   STATISTIQUES DU SERVICE
============================================================ */
function getStatsPeriod(){
  const sel = document.getElementById('stats-period');
  return sel ? sel.value : 'mensuel';
}

function filterByPeriod(items, period){
  const now = new Date();
  return items.filter(h => {
    const d = new Date(h.dateTs);
    if(period === 'journalier'){
      return d.toDateString() === now.toDateString();
    } else if(period === 'mensuel'){
      return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
    } else if(period === 'trimestriel'){
      const q = Math.floor(now.getMonth()/3);
      return Math.floor(d.getMonth()/3)===q && d.getFullYear()===now.getFullYear();
    } else if(period === 'annuel'){
      return d.getFullYear()===now.getFullYear();
    }
    return true; // 'tout'
  });
}

function periodLabel(period){
  const now = new Date();
  const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const q = Math.floor(now.getMonth()/3)+1;
  if(period==='journalier') return `Rapport journalier — ${now.toLocaleDateString('fr-FR',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}`;
  if(period==='mensuel')    return `Rapport mensuel — ${months[now.getMonth()]} ${now.getFullYear()}`;
  if(period==='trimestriel') return `Rapport trimestriel — T${q} ${now.getFullYear()}`;
  if(period==='annuel')     return `Rapport annuel — ${now.getFullYear()}`;
  return 'Rapport global — Toutes périodes';
}

function renderStats() {
  // Récupérer données
  const protocols = JSON.parse(localStorage.getItem('chncak_protocols') || '[]');
  const patients = JSON.parse(localStorage.getItem('chncak_patients') || '[]');
  const medecins = JSON.parse(localStorage.getItem('chncak_medecins') || '[]');
  
  // Calculer statistiques
  const stats = {
    protocoles: protocols.length,
    protocolesValides: protocols.filter(p => p.statut === 'Validé' || p.statut === 'En attente').length,
    patientsTotal: patients.length,
    patientsTraites: patients.filter(p => p.statut === 'Traité' || p.statut === 'Terminé').length,
    patientsEnCours: patients.filter(p => p.statut === 'En cours').length,
    medecins: medecins.length,
    
    // Protocoles par type
    typesProtocoles: {},
    
    // Médecins prescripteurs
    medecinsPrescripteurs: {}
  };
  
  // Compter types de protocoles
  protocols.forEach(p => {
    const proto = p.protocole || 'Non spécifié';
    stats.typesProtocoles[proto] = (stats.typesProtocoles[proto] || 0) + 1;
  });
  
  // Compter médecins prescripteurs
  protocols.forEach(p => {
    const med = p.medecin || 'Non assigné';
    stats.medecinsPrescripteurs[med] = (stats.medecinsPrescripteurs[med] || 0) + 1;
  });
  
  // Afficher
  const container = document.querySelector('#page-stats .card-body') || document.getElementById('page-stats');
  
  if (container) {
    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px">
        <div style="background:#EEF4FD;padding:16px;border-radius:8px">
          <div style="font-size:28px;font-weight:700;color:#0A3D7A">${stats.protocoles}</div>
          <div style="font-size:13px;color:#666;margin-top:4px">Protocoles total</div>
        </div>
        <div style="background:#E4F5ED;padding:16px;border-radius:8px">
          <div style="font-size:28px;font-weight:700;color:#0B5E3C">${stats.patientsTotal}</div>
          <div style="font-size:13px;color:#666;margin-top:4px">Patients total</div>
        </div>
        <div style="background:#FFF3CD;padding:16px;border-radius:8px">
          <div style="font-size:28px;font-weight:700;color:#856404">${stats.patientsEnCours}</div>
          <div style="font-size:13px;color:#666;margin-top:4px">Patients en cours</div>
        </div>
        <div style="background:#E5E7EB;padding:16px;border-radius:8px">
          <div style="font-size:28px;font-weight:700;color:#374151">${stats.patientsTraites}</div>
          <div style="font-size:13px;color:#666;margin-top:4px">Patients traités</div>
        </div>
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="card">
          <div class="card-header"><h3 style="font-size:14px;font-weight:600">Types de chimiothérapie</h3></div>
          <div class="card-body">
            ${Object.keys(stats.typesProtocoles).length > 0 ? 
              Object.entries(stats.typesProtocoles).map(([type, count]) => `
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee">
                  <span style="font-size:13px">${type}</span>
                  <span style="font-weight:600;color:#0A3D7A">${count}</span>
                </div>
              `).join('') : 
              '<div style="text-align:center;color:#999;padding:20px">Aucun protocole</div>'
            }
          </div>
        </div>
        
        <div class="card">
          <div class="card-header"><h3 style="font-size:14px;font-weight:600">Médecins prescripteurs</h3></div>
          <div class="card-body">
            ${Object.keys(stats.medecinsPrescripteurs).length > 0 ? 
              Object.entries(stats.medecinsPrescripteurs).map(([med, count]) => `
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee">
                  <span style="font-size:13px">${med}</span>
                  <span style="font-weight:600;color:#0B5E3C">${count}</span>
                </div>
              `).join('') : 
              '<div style="text-align:center;color:#999;padding:20px">Aucun médecin</div>'
            }
          </div>
        </div>
      
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
        <div class="card">
          <div class="card-header"><h3 style="font-size:14px;font-weight:600">Médicaments utilisés</h3></div>
          <div class="card-body">
            <div style="text-align:center;color:#999;padding:20px;font-size:12px">
              À venir : Liste des médicaments selon protocoles
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header"><h3 style="font-size:14px;font-weight:600">Nombre de préparations</h3></div>
          <div class="card-body">
            <div style="text-align:center;padding:20px">
              <div style="font-size:32px;font-weight:700;color:#0A3D7A">${stats.protocoles}</div>
              <div style="font-size:12px;color:#666;margin-top:4px">Préparations total</div>
            </div>
          </div>
        </div>
      </div></div>
    `;
  }
}



let patientsFilter = 'tous';
function getPatients(){
  try { return JSON.parse(localStorage.getItem('chncak_patients') || '[]'); }
  catch(e){ return []; }
}
function savePatients(list){
  localStorage.setItem('chncak_patients', JSON.stringify(list || []));
}

function showAddPatientModal(editId){
  const modal = document.getElementById('patient-modal');
  const title = document.getElementById('patient-modal-title');
  modal.dataset.editId = editId||'';

  // Populate selects
  const protoSel = document.getElementById('pm-proto');
  protoSel.innerHTML = '<option value="">— Sélectionner —</option>' +
    PROTOCOLS.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
  const medSel = document.getElementById('pm-medecin');
  medSel.innerHTML = '<option value="">— Sélectionner —</option>' +
    medecins.map(m=>`<option value="${m.name}">${m.name}</option>`).join('');

  if(editId){
    const p = getPatients().find(p=>p.id===editId);
    if(p){
      title.textContent = 'Modifier patient';
      document.getElementById('pm-prenom').value     = p.prenom||'';
      document.getElementById('pm-nom').value        = p.nom||'';
      document.getElementById('pm-age').value        = p.age||'';
      document.getElementById('pm-sexe').value       = p.sexe||'F';
      document.getElementById('pm-tel').value        = p.tel||'';
      document.getElementById('pm-dossier').value    = p.dossier||'';
      document.getElementById('pm-proto').value      = p.protoId||'';
      document.getElementById('pm-localisation').value = p.localisation||'';
      document.getElementById('pm-medecin').value    = p.medecin||'';
      document.getElementById('pm-cure').value       = p.cure||'';
      document.getElementById('pm-total-cures').value= p.totalCures||'';
      document.getElementById('pm-date-debut').value = p.dateDebut||'';
      document.getElementById('pm-statut').value     = p.statut||'actif';
      document.getElementById('pm-obs').value        = p.obs||'';
    }
  } else {
    title.textContent = 'Nouveau patient';
    ['pm-prenom','pm-nom','pm-age','pm-tel','pm-dossier','pm-localisation','pm-obs','pm-cure','pm-total-cures','pm-date-debut']
      .forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
    document.getElementById('pm-proto').value  = '';
    document.getElementById('pm-medecin').value= '';
    document.getElementById('pm-statut').value = 'actif';
  }
  modal.style.display = 'flex';
}

function closePatientModal(){
  document.getElementById('patient-modal').style.display = 'none';
}

function savePatient(){
  const editId = document.getElementById('patient-modal').dataset.editId;
  const prenom = document.getElementById('pm-prenom').value.trim();
  const nom    = document.getElementById('pm-nom').value.trim();
  if(!prenom||!nom){ alert('Prénom et Nom obligatoires.'); return; }

  const protoId = document.getElementById('pm-proto').value;
  const proto   = PROTOCOLS.find(p=>p.id===protoId); if(!proto)return;

  const entry = {
    id:          editId || Date.now().toString(),
    prenom, nom,
    age:         document.getElementById('pm-age').value||'',
    sexe:        document.getElementById('pm-sexe').value||'F',
    tel:         document.getElementById('pm-tel').value||'',
    dossier:     document.getElementById('pm-dossier').value||'',
    protoId:     protoId||'',
    proto:       proto?proto.name:document.getElementById('pm-proto').value||'',
    localisation:document.getElementById('pm-localisation').value||'',
    medecin:     document.getElementById('pm-medecin').value||'',
    cure:        parseInt(document.getElementById('pm-cure').value)||1,
    totalCures:  parseInt(document.getElementById('pm-total-cures').value)||0,
    dateDebut:   document.getElementById('pm-date-debut').value||'',
    statut:      document.getElementById('pm-statut').value||'actif',
    obs:         document.getElementById('pm-obs').value||'',
    updatedAt:   new Date().toISOString(),
  };

  const list = getPatients();
  const idx  = list.findIndex(p=>p.id===entry.id);
  if(idx>=0) list[idx]=entry; else list.push(entry);
  savePatients(list);
  closePatientModal();
  renderPatientsList();
}

function deletePatient(id){
  if(!confirm('Supprimer ce patient de la liste ?')) return;
  savePatients(getPatients().filter(p=>p.id!==id));
  renderPatientsList();
}

function filterPatients(f){
  patientsFilter = f;
  document.querySelectorAll('.pf-btn').forEach(b=>{
    const active = b.id==='pf-'+f;
    b.style.background = active ? (f==='actif'?'var(--green2)':f==='termine'?'var(--gray-mid)':f==='pause'?'var(--amber2)':'var(--blue)') : 'white';
    b.style.color      = active ? 'white' : (f==='actif'?'var(--green)':f==='termine'?'var(--gray-mid)':f==='pause'?'var(--amber)':'var(--blue)');
  });
  // Reset all buttons first
  ['pf-tous','pf-actif','pf-termine','pf-pause'].forEach(id=>{
    const b=document.getElementById(id); if(!b) return;
    b.style.background='white';
    b.style.color=b.id==='pf-actif'?'var(--green)':b.id==='pf-termine'?'var(--gray-mid)':b.id==='pf-pause'?'var(--amber)':'var(--blue)';
  });
  const btn = document.getElementById('pf-'+f);
  if(btn){ btn.style.background=f==='actif'?'var(--green2)':f==='termine'?'#888':f==='pause'?'var(--amber2)':'var(--blue)'; btn.style.color='white'; }
  renderPatientsList();
}

function renderPatientsList(){
  const el = document.getElementById('patients-list-content');
  if(!el) return;
  const q = (document.getElementById('patients-search')?.value||'').toLowerCase();
  let list = getPatients();

  if(patientsFilter!=='tous') list=list.filter(p=>p.statut===patientsFilter);
  if(q) list=list.filter(p=>(p.prenom+' '+p.nom+' '+p.proto+' '+p.medecin+' '+p.dossier+' '+p.localisation).toLowerCase().includes(q));

  const subtitle = document.getElementById('patients-subtitle');
  if(subtitle) subtitle.textContent = `${list.length} patient(s) — ${getPatients().length} au total`;

  if(!list.length){
    el.innerHTML=`<div style="text-align:center;padding:40px;color:var(--gray-mid)">
      <div style="font-size:36px;margin-bottom:10px">👥</div>
      <div style="font-size:14px;font-weight:500">${q||patientsFilter!=='tous'?'Aucun résultat.':'Aucun patient enregistré.'}</div>
      <div style="font-size:12px;margin-top:6px">${q||patientsFilter!=='tous'?'':'Importez votre fichier Excel ou ajoutez manuellement.'}</div>
    </div>`;
    return;
  }

  const statusBadge=(s)=>s==='actif'?'<span style="background:var(--green-pale);color:var(--green);border-radius:4px;padding:2px 7px;font-size:10px;font-weight:600">â— En cours</span>':
    s==='termine'?'<span style="background:var(--gray-light);color:var(--gray-mid);border-radius:4px;padding:2px 7px;font-size:10px;font-weight:600">✓ Terminé</span>':
    '<span style="background:var(--amber-pale);color:var(--amber);border-radius:4px;padding:2px 7px;font-size:10px;font-weight:600">â¸ En pause</span>';

  const rows = list.map((p,i)=>`
    <tr style="${i%2===0?'background:#FAFBFD':'background:white'}">
      <td style="padding:8px 12px;font-size:12px;font-weight:700;color:var(--blue)">${p.dossier||'—'}</td>
      <td style="padding:8px 12px">
        <div style="font-size:13px;font-weight:600">${p.prenom} ${p.nom}</div>
        <div style="font-size:10px;color:var(--gray-mid)">${p.age?p.age+' ans':''}${p.sexe?' · '+p.sexe:''}</div>
      </td>
      <td style="padding:8px 12px;font-size:11px;color:var(--gray-mid)">${p.tel||'—'}</td>
      <td style="padding:8px 12px">
        <span style="background:var(--blue-pale);color:var(--blue);border-radius:4px;padding:2px 7px;font-size:11px;font-weight:600">${p.proto||'—'}</span>
      </td>
      <td style="padding:8px 12px;font-size:11px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${p.localisation||''}">${p.localisation||'—'}</td>
      <td style="padding:8px 12px;font-size:11px;text-align:center">
        ${p.cure&&p.totalCures?`<b>${p.cure}</b>/${p.totalCures}`:(p.cure?`<b>${p.cure}</b>`:'—')}
      </td>
      <td style="padding:8px 12px;font-size:11px;color:var(--gray-mid)">${p.medecin||'—'}</td>
      <td style="padding:8px 12px;font-size:11px">
        ${p.dateDebut?new Date(p.dateDebut+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}):'—'}
      </td>
      <td style="padding:8px 12px">${statusBadge(p.statut||'actif')}</td>
      <td style="padding:8px 12px;text-align:center;white-space:nowrap">
          <button onclick="setStatut('${p.id}', 'Terminé')" 
                  style="background:#E4F5ED;border:1px solid #0B5E3C;color:#0B5E3C;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600">
            ✓ Traité
          </button></td>
    </tr>`).join('');

  el.innerHTML=`
    <table style="width:100%;border-collapse:collapse;min-width:700px">
      <thead>
        <tr style="background:var(--blue-pale);position:sticky;top:0">
          <th style="padding:8px 12px;font-size:10px;text-align:left;color:var(--blue);border-bottom:2px solid var(--blue-mid);white-space:nowrap">N° Dossier</th>
          <th style="padding:8px 12px;font-size:10px;text-align:left;color:var(--blue);border-bottom:2px solid var(--blue-mid)">Patient</th>
          <th style="padding:8px 12px;font-size:10px;text-align:left;color:var(--blue);border-bottom:2px solid var(--blue-mid)">Contact</th>
          <th style="padding:8px 12px;font-size:10px;text-align:left;color:var(--blue);border-bottom:2px solid var(--blue-mid)">Protocole</th>
          <th style="padding:8px 12px;font-size:10px;text-align:left;color:var(--blue);border-bottom:2px solid var(--blue-mid)">Localisation</th>
          <th style="padding:8px 12px;font-size:10px;text-align:center;color:var(--blue);border-bottom:2px solid var(--blue-mid)">Cure</th>
          <th style="padding:8px 12px;font-size:10px;text-align:left;color:var(--blue);border-bottom:2px solid var(--blue-mid)">Médecin</th>
          <th style="padding:8px 12px;font-size:10px;text-align:left;color:var(--blue);border-bottom:2px solid var(--blue-mid)">Début</th>
          <th style="padding:8px 12px;font-size:10px;text-align:left;color:var(--blue);border-bottom:2px solid var(--blue-mid)">Statut</th>
          <th style="padding:8px 12px;font-size:10px;text-align:center;color:var(--blue);border-bottom:2px solid var(--blue-mid)">Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function chargerPatientProtocole(id){
  const p = getPatients().find(pt=>pt.id===id);
  if(!p) return;
  // Switch to protocole tab and fill fields
  showPage('protocole', document.querySelector('.tab-btn'));
  setTimeout(()=>{
    if(p.prenom) document.getElementById('prenom').value=p.prenom;
    if(p.nom)    document.getElementById('nom').value=p.nom;
    if(p.age)    document.getElementById('age').value=p.age;
    if(p.dossier)document.getElementById('dossier').value=p.dossier;
    if(p.tel)    { const t=document.getElementById('tel-patient'); if(t) t.value=p.tel; }
    if(p.protoId){ selId=p.protoId; document.querySelectorAll('.proto-card').forEach(c=>{c.classList.remove('selected');if(c.dataset.id===p.protoId)c.classList.add('selected');}); }
    if(p.medecin){ const m=document.getElementById('medecin-select'); if(m) m.value=p.medecin; }
    update();
  }, 100);
}

function importPatients(input){
  var file = input.files[0]; if(!file) return;
  var msgEl = document.getElementById('patients-import-msg');
  if(msgEl){ msgEl.style.display=''; msgEl.style.background='#EEF4FD'; msgEl.style.color='#0A3D7A'; msgEl.style.border='1px solid #B8D0F5'; msgEl.textContent='â³ Lecture du fichier…'; }

  if(!window.XLSX){
    if(msgEl){ msgEl.style.background='#FDEAEA'; msgEl.style.color='#E74C3C'; msgEl.textContent='X Librairie XLSX non chargée. Vérifiez votre connexion.'; }
    input.value=''; return;
  }

  var reader = new FileReader();
  reader.onload = function(e){
    try{
      var data = new Uint8Array(e.target.result);
      var wb = XLSX.read(data, {type:'array', cellDates:true});
      var ws = wb.Sheets[wb.SheetNames[0]];
      var rows = XLSX.utils.sheet_to_json(ws, {defval:'', raw:false});

      if(!rows.length){
        if(msgEl){ msgEl.style.background='#FDEAEA'; msgEl.style.color='#E74C3C'; msgEl.textContent='X Fichier vide ou format incorrect.'; }
        input.value=''; return;
      }

      // Normalize a string for comparison
      function norm(s){ return (s||'').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'').trim(); }

      // Get column key by exact normalized match (not substring)
      var allKeys = Object.keys(rows[0]);
      function getCol(){
        var keys = Array.prototype.slice.call(arguments);
        // First pass: exact match
        for(var ki=0; ki<allKeys.length; ki++){
          var nk = norm(allKeys[ki]);
          for(var j=0; j<keys.length; j++){
            if(nk === norm(keys[j])) return allKeys[ki];
          }
        }
        // Second pass: substring match (for columns like 'nom du protocole' matching 'protocole')
        for(var ki=0; ki<allKeys.length; ki++){
          var nk = norm(allKeys[ki]);
          for(var j=0; j<keys.length; j++){
            if(nk.indexOf(norm(keys[j]))>=0) return allKeys[ki];
          }
        }
        return null;
      }

      // Map columns — matches your exact file structure
      var cPrenom   = getCol('prenom','firstname');
      var cNom      = getCol('nom','lastname','surname');
      var cAge      = getCol('age');
      var cSexe     = getCol('sexe','genre','sex');
      var cContact  = getCol('contact','tel','phone','mobile');
      var cAntcd    = getCol('antecedent','atcd');
      var cLocal    = getCol('localisation','cancer','diagnostic');
      var cIndic    = getCol('indication','chimio');
      var cCode     = getCol('code');
      var cId       = getCol('id','dossier','num');
      var cCubix    = getCol('cubix','icicubix');
      var cNat      = getCol('nationalite','nationality');
      var cProto    = getCol('protocole','protocol','nomduprotocole');
      var cLigne    = getCol('ligne');
      var cCure     = getCol('numerocure','curenum','cureencours');
      var cTotal    = getCol('nombrecure','totalcure','cureafaire');
      var cMed      = getCol('medecin','docteur','medecintraitant');
      var cRdv      = getCol('rendezvous','rdv','daterendez');

      function val(row, col){ return col ? (row[col]||'').toString().trim() : ''; }

      function parseDate(v){
        if(!v || v==='') return '';
        if(v instanceof Date){ return v.toISOString().split('T')[0]; }
        var s = v.toString().trim();
        // Already ISO
        if(s.match(/^\d{4}-\d{2}-\d{2}/)) return s.substring(0,10);
        // dd/mm/yyyy
        var m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if(m1) return m1[3]+'-'+m1[2].padStart(2,'0')+'-'+m1[1].padStart(2,'0');
        // Excel serial number (XLSX with raw:false returns strings like "2026-05-09")
        return '';
      }

      var list = getPatients();
      var added=0, updated=0, errors=[];

      rows.forEach(function(row, i){
        var prenom = val(row, cPrenom);
        var nom    = val(row, cNom);
        if(!prenom && !nom){ errors.push('Ligne '+(i+2)+': vide'); return; }

        var protoName = val(row, cProto).toUpperCase();
        var proto = null;
        for(var pi=0; pi<PROTOCOLS.length; pi++){
          if(PROTOCOLS[pi].name.toUpperCase()===protoName||PROTOCOLS[pi].id.toUpperCase()===protoName){
            proto=PROTOCOLS[pi]; break;
          }
        }

        var dossier  = val(row, cId);
        var dateRdv  = parseDate(val(row, cRdv));
        var sexeRaw  = val(row, cSexe).toUpperCase();

        var entry = {
          id:          (Date.now()+i).toString(),
          prenom:      prenom,
          nom:         nom,
          age:         val(row, cAge),
          sexe:        sexeRaw.charAt(0)==='M' ? 'M' : 'F',
          tel:         val(row, cContact),
          dossier:     dossier,
          cubix:       val(row, cCubix),
          code:        val(row, cCode),
          nationalite: val(row, cNat),
          antecedents: val(row, cAntcd),
          localisation:val(row, cLocal)||val(row, cIndic),
          protoId:     proto ? proto.id : '',
          proto:       proto ? proto.name : protoName,
          medecin:     val(row, cMed),
          ligne:       val(row, cLigne),
          cure:        parseInt(val(row, cCure))||1,
          totalCures:  parseFloat(val(row, cTotal))||0,
          dateRdv:     dateRdv,
          dateDebut:   '',
          statut:      'actif',
          obs:         '',
          updatedAt:   new Date().toISOString(),
        };

        var exists = -1;
        for(var ei=0; ei<list.length; ei++){
          if((dossier && list[ei].dossier===dossier)||(list[ei].prenom===prenom&&list[ei].nom===nom)){
            exists=ei; break;
          }
        }
        if(exists>=0){ var oldId=list[exists].id; list[exists]=entry; list[exists].id=oldId; updated++; }
        else { list.push(entry); added++; }
      });

      savePatients(list);

      // Sync RDV dates into chncak_rdv
      var rdvList = getRdvList();
      var rdvAdded = 0;
      list.forEach(function(p){
        if(!p.dateRdv || p.dateRdv.length<8) return;
        var exists2 = -1;
        for(var ri=0; ri<rdvList.length; ri++){
          if((p.dossier&&rdvList[ri].dossier===p.dossier)||(rdvList[ri].prenom===p.prenom&&rdvList[ri].nom===p.nom)){
            exists2=ri; break;
          }
        }
        var rdvEntry = {
          id:      exists2>=0 ? rdvList[exists2].id : (Date.now()+rdvAdded),
          prenom:  p.prenom, nom: p.nom, age: p.age||'',
          dossier: p.dossier||'', cubix: p.cubix||'', tel: p.tel||'',
          proto:   p.proto||'', protoId: p.protoId||'',
          medecin: p.medecin||'', cureNum: p.cure||'',
          ligne:   p.ligne||'', dateRdv: p.dateRdv, dateProto: '',
          dateTs:  new Date(p.dateRdv+'T00:00:00').getTime(), sc: 0,
        };
        if(exists2>=0) rdvList[exists2] = rdvEntry;
        else { rdvList.push(rdvEntry); rdvAdded++; }
      });
      rdvList.sort(function(a,b){ return (a.dateRdv||'').localeCompare(b.dateRdv||''); });
      saveRdvList(rdvList);

      var msg = '✅ '+added+' patient(s) ajouté(s), '+updated+' mis à jour'+(rdvAdded?' · '+rdvAdded+' RDV ajoutés':'')+(errors.length?' · ⚠ '+errors.length+' erreur(s)':'')+'.' ;
      if(msgEl){ msgEl.style.background='#E4F5ED'; msgEl.style.color='#0B5E3C'; msgEl.style.border='1px solid #B0DCC5'; msgEl.textContent=msg; setTimeout(function(){ msgEl.style.display='none'; },8000); }
      renderPatientsList();
    } catch(err){
      if(msgEl){ msgEl.style.background='#FDEAEA'; msgEl.style.color='#E74C3C'; msgEl.textContent='X Erreur: '+err.message; }
      console.error('importPatients error:', err);
    }
    input.value='';
  };
  reader.readAsArrayBuffer(file);
}

function showPatientsMsg(type,text){
  const el=document.getElementById('patients-import-msg');
  el.style.display=''; el.textContent=text;
  if(type==='success'){el.style.background='var(--green-pale)';el.style.color='var(--green)';el.style.border='1px solid #B0DCC5';}
  else if(type==='warn'){el.style.background='var(--amber-pale)';el.style.color='var(--amber)';el.style.border='1px solid #F0C060';}
  else{el.style.background='var(--red-pale)';el.style.color='var(--red2)';el.style.border='1px solid #F5AAAA';}
  setTimeout(()=>el.style.display='none',8000);
}

function exportPatients(){
  const list=getPatients();
  if(!list.length){alert('Aucun patient à exporter.');return;}
  const rows=list.map(p=>({
    'N° Dossier':p.dossier||'','Prénom':p.prenom,'Nom':p.nom,'Age':p.age||'','Sexe':p.sexe||'',
    'Contact':p.tel||'','Protocole':p.proto||'','Localisation':p.localisation||'',
    'Cure en cours':p.cure||'','Total cures':p.totalCures||'',
    'Médecin':p.medecin||'','Date début':p.dateDebut||'',
    'Statut':p.statut==='actif'?'En cours':p.statut==='termine'?'Terminé':'En pause',
    'Observations':p.obs||'',
  }));
  const ws=XLSX.utils.json_to_sheet(rows);
  ws['!cols']=[10,14,14,5,6,14,18,24,8,8,18,12,12,20].map(w=>({wch:w}));
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Patients');
  XLSX.writeFile(wb,'Patients_CHNCAK_'+new Date().toISOString().split('T')[0]+'.xlsx');
}

function downloadPatientsTemplate(){
  const template=[{
    'N° Dossier':'539/24','Prénom':'Fatou','Nom':'Diallo','Age':45,'Sexe':'F',
    'Contact':'77 123 45 67','Protocole':'FOLFOX4','Localisation':'Cancer colorectal T3N1M0',
    'Cure en cours':3,'Total cures':6,'Médecin':'Dr M. Mane','Date début':'2024-01-15',
    'Statut':'En cours','Observations':'Tolérance bonne',
  },{
    'N° Dossier':'540/24','Prénom':'Mamadou','Nom':'Sow','Age':58,'Sexe':'M',
    'Contact':'76 987 65 43','Protocole':'GEMCITABINE','Localisation':'Cancer pancréas T2N0M0',
    'Cure en cours':2,'Total cures':4,'Médecin':'Dr Fallou Sall','Date début':'2024-02-01',
    'Statut':'En cours','Observations':'',
  }];
  const ws=XLSX.utils.json_to_sheet(template);
  ws['!cols']=[10,14,14,5,6,14,18,24,8,8,18,12,12,20].map(w=>({wch:w}));
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Patients');
  XLSX.writeFile(wb,'Modele_Patients_CHNCAK.xlsx');
}

// Render patients when switching to tab

function clearAllHistory(){
  const pwd = prompt('🔒 Mot de passe requis pour effacer l\'historique :');
  if(pwd === null) return;
  if(pwd !== 'Onco@2026'){ alert('X Mot de passe incorrect.'); return; }
  if(!confirm('⚠ï¸ Effacer TOUT l\'historique des protocoles ?\n\nCette action est irréversible.\nLes données de stock et les médecins ne seront pas affectés.')) return;
  historique = [];
  localStorage.removeItem('chncak_historique');
  // Also clear sorties if needed
  const clearSorties = confirm('Effacer aussi l\'historique des sorties de stock ?');
  if(clearSorties) localStorage.removeItem('chncak_sorties');
  alert('✅ Historique effacé.');
  renderStats();
  renderHistory();
}


/* ============================================================
   GESTION RENDEZ-VOUS
============================================================ */
// RDV storage: [{id, prenom, nom, age, dossier, proto, medecin, dateRdv, dateProto, cureNum}]
function getRdvList(){ return JSON.parse(localStorage.getItem('chncak_rdv')||'[]'); }
function saveRdvList(list){ localStorage.setItem('chncak_rdv', JSON.stringify(list)); }

function calcRdvAuto(){
  const proto = PROTOCOLS.find(p=>p.id===selId);
  if(!proto){ alert('Sélectionnez d\'abord un protocole.'); return; }
  const dp = document.getElementById('date-protocole').value;
  if(!dp){ alert('Renseignez la date du protocole d\'abord.'); return; }
  const cycleMap={'J1=J21':21,'J1=J14':14,'J1=J28':28,'J1=J15':15,'J1=J8':8};
  const days = cycleMap[proto.rythme]||21;
  const d = new Date(dp);
  d.setDate(d.getDate()+days);
  const rdvISO = d.toISOString().split('T')[0];
  document.getElementById('date-rdv').value = rdvISO;
  updateRdvDisplay(rdvISO);
}

function saveRdv(){
  const val = document.getElementById('date-rdv').value;
  updateRdvDisplay(val);
}

function updateRdvDisplay(isoDate){
  const el = document.getElementById('rdv-display');
  if(!el) return;
  if(isoDate){
    const d = new Date(isoDate+'T00:00:00');
    const opts = {weekday:'short',day:'2-digit',month:'short',year:'numeric'};
    el.textContent = '📅 ' + d.toLocaleDateString('fr-FR', opts);
    el.style.color = 'var(--amber)';
  } else {
    el.textContent = '';
  }
}

function saveRdvAndConfirm(){
  const proto  = PROTOCOLS.find(p=>p.id===selId); if(!proto)return;
  const rdvVal = document.getElementById('date-rdv').value;
  const prenom = document.getElementById('prenom').value.trim();
  const nom    = document.getElementById('nom').value.trim();
  if(!prenom||!nom){ alert('Renseignez le prénom et le nom du patient.'); return; }
  if(!rdvVal){ alert('Renseignez ou calculez d\'abord la date du RDV.'); return; }
  if(!proto){ alert('Sélectionnez un protocole.'); return; }

  const list = getRdvList();
  // Remove existing RDV for same patient+protocole if exists
  const existing = list.findIndex(r=>
    r.prenom===prenom && r.nom===nom && r.protoId===selId
  );
  const entry = {
    id:        Date.now(),
    prenom,
    nom,
    age:       document.getElementById('age').value||'',
    dossier:   document.getElementById('dossier').value||'',
    cubix:     document.getElementById('cubix').value||'',
    proto:     proto.name,
    protoId:   selId,
    medecin:   document.getElementById('medecin-select').value||'',
    dateRdv:   rdvVal,
    dateProto: document.getElementById('date-protocole').value||'',
    cureNum:   document.getElementById('cure-num').value||'',
    tel:       document.getElementById('tel-patient')?.value||'',
    poids:     document.getElementById('poids')?.value||'',
    taille:    document.getElementById('taille')?.value||'',
    sc:        sc||0,
    ligne:     document.getElementById('ligne-traitement')?.value||'',
  };
  if(existing >= 0) list[existing] = entry;
  else list.push(entry);
  list.sort((a,b)=>a.dateRdv.localeCompare(b.dateRdv));
  saveRdvList(list);

  // Visual feedback
  const btn = event.target;
  btn.textContent = '✓ RDV enregistré !';
  btn.style.background = 'var(--green)';
  setTimeout(()=>{ btn.textContent='✓ Enregistrer RDV'; btn.style.background='var(--green2)'; }, 2500);
}

function deleteRdv(id){
  if(!confirm('Supprimer ce rendez-vous ?')) return;
  const list = getRdvList().filter(r=>r.id!==id);
  saveRdvList(list);
  renderRdvList();
}

function reporterRdv(id){
  const list = getRdvList();
  const rdv  = list.find(r=>r.id===id);
  if(!rdv) return;

  // Show motif selection dialog
  const motifs = ['Absence du patient','Problème d\'analyse','AEG (Altération état général)','Problème financier','Report médical','Autre'];
  const motifHtml = motifs.map((m,i)=>`${i+1}. ${m}`).join('\n');
  const choix = prompt(`⚠ Reporter le RDV de ${rdv.prenom} ${rdv.nom}\n\nMotif :\n${motifHtml}\n\nEntrez le numéro du motif (1-${motifs.length}) ou tapez le motif :`);
  if(!choix) return;

  const num = parseInt(choix);
  const motif = (num>=1 && num<=motifs.length) ? motifs[num-1] : choix.trim();
  if(!motif){ alert('Motif invalide.'); return; }

  // New RDV date
  const newDate = prompt(`Nouvelle date de RDV pour ${rdv.prenom} ${rdv.nom} :\n(Format : AAAA-MM-JJ, laissez vide pour ne pas replanifier)`, '');

  const idx = list.findIndex(r=>r.id===id);
  list[idx].motifReport  = motif;
  list[idx].dateReport   = new Date().toISOString().split('T')[0];
  list[idx].stockValide  = false;
  if(newDate && newDate.match(/^\d{4}-\d{2}-\d{2}$/)){
    list[idx].dateRdv = newDate;
    list[idx].motifReport = motif + ' → Reporté au ' + newDate.split('-').reverse().join('/');
  }
  saveRdvList(list);
  alert(`✅ Motif enregistré : ${motif}`);
  renderRdvList();
}

function validateStockFromRdv(id){
  const list  = getRdvList();
  const rdv   = list.find(r=>r.id===id);
  if(!rdv) return;
  const proto = PROTOCOLS.find(p=>p.id===rdv.protoId);
  if(!proto){ alert('Protocole introuvable dans la base.'); return; }

  // Reconstruct SC from stored data or prompt
  const rdvPoids  = parseFloat(rdv.poids||0);
  const rdvTaille = parseFloat(rdv.taille||0);
  let scVal    = rdv.sc || 0;
  if(!scVal && rdvPoids && rdvTaille){
    scVal = Math.sqrt((rdvPoids*rdvTaille)/3600);
  }
  if(!scVal){
    const saisie = prompt(`Surface corporelle (m²) pour ${rdv.prenom} ${rdv.nom}\n(introuvable dans le RDV — saisissez la valeur) :`, '1.70');
    scVal = parseFloat(saisie||'0');
    if(!scVal){ alert('SC invalide, annulation.'); return; }
  }

  if(!confirm(`Valider la sortie stock pour :\n${rdv.prenom} ${rdv.nom} — ${rdv.proto}\nDate RDV : ${rdv.dateRdv}\n\nCela déduira les flacons du stock.`)) return;

  const activeDrugs = proto.drugs.filter(d=>!d.t && !/magn[ée]?sium|calcium|prednisone|nacl|glucose|g5|ssi/i.test(d.name || '') && (d.mgm2||d.carbo||d.avastin||d.fix));
  let updated=0, warnings=[];

  activeDrugs.forEach(d=>{
    // Calculate dose
    let doseVal = 0;
    if(d.mgm2)  doseVal = Math.round(d.mgm2 * scVal);
    else if(d.fix) doseVal = d.fix;
    else if(d.carbo){ doseVal = Math.round((d.carbo||5)*(rdv.clairance||80+25)); }
    if(!doseVal) return;

    const drugName = d.name;
    const catIdx   = catalog.findIndex(c=>c.name===drugName||c.dci===drugName);
    if(catIdx===-1){ warnings.push(`${drugName}: non trouvé dans le catalogue`); return; }

    const drug    = catalog[catIdx];
    const dosages = (drug.dosages||[]).sort((a,b)=>b-a);
    let remaining = doseVal;
    let flaconsUsed = 0;
    dosages.forEach(dos=>{ const n=Math.floor(remaining/dos); flaconsUsed+=n; remaining-=n*dos; });
    if(remaining>0) flaconsUsed++;

    const stockActuel = drug.qteStock||drug.stock||0;
    if(stockActuel < flaconsUsed){
      warnings.push(`⚠ ${drugName}: stock insuffisant (${stockActuel} flacons, besoin ${flaconsUsed})`);
    }
    catalog[catIdx].qteStock = Math.max(0, stockActuel - flaconsUsed);

    // Record sortie
    const sorties = JSON.parse(localStorage.getItem('chncak_sorties')||'[]');
    sorties.push({
      date:    rdv.dateRdv,
      dateTs:  new Date(rdv.dateRdv+'T00:00:00').getTime(),
      prenom:  rdv.prenom,
      nom:     rdv.nom,
      proto:   rdv.proto,
      details: `${drugName}: ${flaconsUsed} flacon(s)`,
      flacons: flaconsUsed,
      mol:     drugName,
    });
    localStorage.setItem('chncak_sorties', JSON.stringify(sorties));
    updated++;
  });

  saveCatalog();

  // â”€â”€ Auto-add/update patient dans la liste Patients â”€â”€
  const patients = JSON.parse(localStorage.getItem('chncak_patients') || '[]');
  const pIdx = patients.findIndex(p=>
    (p.dossier&&p.dossier===rdv.dossier&&rdv.dossier)||(p.prenom===rdv.prenom&&p.nom===rdv.nom)
  );
  const proto2 = PROTOCOLS.find(p=>p.id===rdv.protoId); if(!proto2)return;
  const patEntry = {
    id:        pIdx>=0?patients[pIdx].id:Date.now().toString(),
    prenom:rdv.prenom, nom:rdv.nom, age:rdv.age||'', sexe:rdv.sexe||'',
    tel:rdv.tel||'', dossier:rdv.dossier||'', cubix:rdv.cubix||'',
    protoId:rdv.protoId||'', proto:proto2?proto2.name:(rdv.proto||''),
    medecin:rdv.medecin||'', ligne:rdv.ligne||'',
    cure:parseInt(rdv.cureNum)||1, totalCures:0, statut:'actif',
    dateDebut:rdv.dateProto||'', updatedAt:new Date().toISOString(),
  };
  if(pIdx>=0) patients[pIdx]={...patients[pIdx],...patEntry,id:patients[pIdx].id};
  else patients.push(patEntry);
  savePatients(patients);

  // Mark RDV as validated
  const idx = list.findIndex(r=>r.id===id);
  if(idx>=0){ list[idx].stockValide=true; list[idx].dateValidation=new Date().toISOString(); }
  saveRdvList(list);

  let msg = `✅ Stock mis à jour pour ${updated} médicament(s) — ${rdv.prenom} ${rdv.nom}`;
  if(warnings.length) msg += '\n\n' + warnings.join('\n');
  alert(msg);
  renderRdvList();
}

function actualiserRdv(btn){
  try {
    renderRdvList();
    if(btn){
      btn.style.background='var(--green2)';
      btn.textContent='✓ OK';
      setTimeout(()=>{ btn.style.background='var(--amber2)'; btn.innerHTML='&#8635; Actualiser'; }, 1500);
    }
  } catch(e) {
    console.error('renderRdvList error:', e);
    if(btn) btn.textContent='Erreur!';
  }
}

function renderRdvList(){
  var el = document.getElementById('rdv-list-content');
  if(!el) return;
  var q = '';
  var srch = document.getElementById('rdv-search');
  if(srch) q = srch.value.toLowerCase();

  var list = getRdvList();
  if(q) list = list.filter(function(r){
    return (r.prenom+' '+r.nom+' '+(r.proto||'')+' '+(r.medecin||'')+' '+(r.dateRdv||'')).toLowerCase().indexOf(q)>=0;
  });

  if(!list.length){
    el.innerHTML = '<div style="text-align:center;padding:30px;color:#888;font-size:13px">'
      + '<div style="font-size:32px;margin-bottom:8px">📅</div>'
      + (q ? 'Aucun RDV trouvé.' : 'Aucun rendez-vous. Enregistrez un RDV dans l\'onglet Protocole.')
      + '</div>';
    return;
  }

  var today = new Date(); today.setHours(0,0,0,0);
  var todayStr = today.toISOString().split('T')[0];

  // KPI counts
  var total=list.length, auj=0, semaine=0, passes=0;
  list.forEach(function(r){
    if(!r.dateRdv) return;
    var d = new Date(r.dateRdv+'T00:00:00');
    var diff = Math.round((d-today)/86400000);
    if(diff===0) auj++;
    else if(diff>0 && diff<=7) semaine++;
    else if(diff<0) passes++;
  });

  // Build rows
  var rowsHtml = '';
  list.forEach(function(r){
    var dateStr = r.dateRdv || '';
    var rdvDate = dateStr ? new Date(dateStr+'T00:00:00') : null;
    var diff = rdvDate ? Math.round((rdvDate-today)/86400000) : null;
    var isPast  = diff!==null && diff<0;
    var isToday = diff===0;
    var diffTxt = diff===null ? '' : isToday ? '<b style="color:#0B5E3C">Aujourd\'hui</b>'
                : isPast ? '<span style="color:#E74C3C">'+Math.abs(diff)+'j passé</span>'
                : '<span style="color:#0A3D7A">Dans '+diff+'j</span>';
    var bg = isToday?'#E4F5ED' : isPast?'#FEF5F5' : (diff!==null&&diff<=3?'#FFF3DC':'white');
    var dateFmt = rdvDate ? rdvDate.toLocaleDateString('fr-FR',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}) : dateStr;

    var actionHtml = r.stockValide
      ? '<span style="background:#E4F5ED;color:#0B5E3C;border-radius:4px;padding:2px 7px;font-size:10px;font-weight:600">✓ Traité</span>'
      : '<button onclick="validateStockFromRdv('+r.id+')" style="background:#E4F5ED;border:1px solid #0B5E3C;border-radius:4px;color:#0B5E3C;font-size:11px;padding:3px 7px;cursor:pointer">✓ Traité</button>';

    rowsHtml += '<tr style="background:'+bg+';border-bottom:1px solid #eee">'
      +'<td style="padding:8px 12px;font-size:12px;font-weight:700">'+dateFmt
        +'<div style="font-size:10px;font-weight:400;margin-top:2px">'+diffTxt+'</div>'
        +(r.motifReport?'<div style="font-size:9px;color:#E67E22;margin-top:2px">⚠ '+r.motifReport+'</div>':'')
      +'</td>'
      +'<td style="padding:8px 12px;font-size:13px;font-weight:600">'+(r.prenom||'')+' '+(r.nom||'')+'</td>'
      +'<td style="padding:8px 12px;font-size:11px;color:#888">'+(r.age?r.age+' ans':'—')+'</td>'
      +'<td style="padding:8px 12px"><span style="background:#EEF4FD;color:#0A3D7A;border-radius:4px;padding:2px 7px;font-size:11px;font-weight:600">'+(r.proto||'—')+'</span>'
        +(r.cureNum?'<span style="font-size:10px;color:#888;margin-left:4px">C'+r.cureNum+'</span>':'')+'</td>'
      +'<td style="padding:8px 12px;font-size:11px;color:#888">'+(r.dossier||'—')+'</td>'
      +'<td style="padding:8px 12px;font-size:11px;color:#0A3D7A">'+(r.medecin||'—')+'</td>'
      +'<td style="padding:8px 12px;text-align:center">'
        +'<div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap">'
        +actionHtml
        +'<button onclick="reporterRdv('+r.id+')" style="background:#FFF3DC;border:1px solid #E67E22;border-radius:4px;color:#E67E22;font-size:11px;padding:3px 7px;cursor:pointer">⚠ Reporter</button>'
        +'<button onclick="deleteRdv('+r.id+')" style="background:none;border:1px solid #F5AAAA;border-radius:4px;color:#E74C3C;font-size:11px;padding:3px 7px;cursor:pointer">✕</button>'
        +'</div>'
      +'</td>'
      +'</tr>';
  });

  var kpiHtml = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-bottom:1px solid #eee">'
    +'<div style="padding:10px;text-align:center;border-right:1px solid #eee"><div style="font-size:20px;font-weight:700;color:#0A3D7A">'+total+'</div><div style="font-size:10px;color:#888;text-transform:uppercase">Total RDV</div></div>'
    +'<div style="padding:10px;text-align:center;border-right:1px solid #eee"><div style="font-size:20px;font-weight:700;color:#0B5E3C">'+auj+'</div><div style="font-size:10px;color:#888;text-transform:uppercase">Aujourd\'hui</div></div>'
    +'<div style="padding:10px;text-align:center;border-right:1px solid #eee"><div style="font-size:20px;font-weight:700;color:#E67E22">'+semaine+'</div><div style="font-size:10px;color:#888;text-transform:uppercase">Cette semaine</div></div>'
    +'<div style="padding:10px;text-align:center"><div style="font-size:20px;font-weight:700;color:#E74C3C">'+passes+'</div><div style="font-size:10px;color:#888;text-transform:uppercase">Passés</div></div>'
    +'</div>';

  var tableHtml = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;min-width:600px">'
    +'<thead><tr style="background:#FFF3DC">'
    +'<th style="padding:8px 12px;font-size:10px;text-align:left;color:#E67E22;border-bottom:2px solid #E67E22;white-space:nowrap">📅 Date RDV</th>'
    +'<th style="padding:8px 12px;font-size:10px;text-align:left;color:#E67E22;border-bottom:2px solid #E67E22">Patient</th>'
    +'<th style="padding:8px 12px;font-size:10px;text-align:left;color:#E67E22;border-bottom:2px solid #E67E22">Age</th>'
    +'<th style="padding:8px 12px;font-size:10px;text-align:left;color:#E67E22;border-bottom:2px solid #E67E22">Protocole</th>'
    +'<th style="padding:8px 12px;font-size:10px;text-align:left;color:#E67E22;border-bottom:2px solid #E67E22">Dossier</th>'
    +'<th style="padding:8px 12px;font-size:10px;text-align:left;color:#E67E22;border-bottom:2px solid #E67E22">Médecin</th>'
    +'<th style="padding:8px 12px;font-size:10px;text-align:center;color:#E67E22;border-bottom:2px solid #E67E22">Actions</th>'
    +'</tr></thead>'
    +'<tbody>'+rowsHtml+'</tbody>'
    +'</table></div>';

  el.innerHTML = kpiHtml + tableHtml;
}

function printBonRDV(){
  const proto  = PROTOCOLS.find(p=>p.id===selId);
  if(!proto) return;
  const prenom  = document.getElementById('prenom').value||'';
  const nom     = document.getElementById('nom').value||'';
  const age     = document.getElementById('age').value||'';
  const tel     = document.getElementById('tel-patient')?.value||'';
  // Use the date-rdv field if filled, else auto-calculate
  const rdvInput = document.getElementById('date-rdv')?.value;
  let nextDate = '___/___/______';
  if(rdvInput){
    nextDate = rdvInput.split('-').reverse().join('/');
  } else {
    const dp = document.getElementById('date-protocole').value;
    if(dp){
      const cycleMap={'J1=J21':21,'J1=J14':14,'J1=J28':28,'J1=J15':15,'J1=J8':8};
      const cycleDays = cycleMap[proto.rythme]||21;
      const d = new Date(dp); d.setDate(d.getDate()+cycleDays);
      nextDate = d.toLocaleDateString('fr-FR');
    }
  }

  const dossier = document.getElementById('dossier').value||'';
  const cubix   = document.getElementById('cubix').value||'';
  const med     = document.getElementById('medecin-select').value||'';
  const dp      = document.getElementById('date-protocole').value;
  const dateStr = dp ? dp.split('-').reverse().join('/') : '___/___/______';

  // Cost from pharma calc (if available)
  const coutEl = document.getElementById('pharma-total-cout');
  const montant = '25.000 Fr CFA';

  const bloc = () => `
  <div style="width:46%;display:inline-block;vertical-align:top;font-family:Arial,sans-serif">

    <!-- EN-TÊTE vertical comme le modèle -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:4px">
      <tr>
        <td style="width:30px;vertical-align:top">
          <img src="${LOGO_B64}" style="width:28px;height:28px;object-fit:contain">
        </td>
        <td style="text-align:center;vertical-align:top;padding:0 2px">
          <div style="font-size:6.5px;line-height:1.5;color:#000">
            République du Sénégal<br><b>Un peuple-un but-une foi</b><br>
            ………………………………<br>Ministère de la Santé et l'Action Sociale<br>
            ………………………………<br>Direction Générale des Etablissements de Santé<br>
            ……………………………<br>Direction des Etablissements Publics de Santé<br>
            ………………………………<br><b>Centre Hospitalier National Cheikh Ahmadoul Khadim</b><br>
            ………………………………<br><b>Service d'Oncologie - Radiothérapie</b>
          </div>
        </td>
        <td style="width:30px;vertical-align:top;text-align:right">
          <img src="${LOGO_B64}" style="width:26px;height:26px;object-fit:contain;opacity:0.5">
        </td>
      </tr>
    </table>

    <!-- TITRE -->
    <div style="text-align:center;background:#0A3D7A;color:white;padding:4px 8px;font-size:11px;font-weight:bold;letter-spacing:0.05em;margin-bottom:6px">
      RENDEZ-VOUS
    </div>

    <!-- PATIENT INFO -->
    <div style="font-size:9px;line-height:2.2;margin-bottom:6px;padding:0 4px">
      <div style="display:flex"><span style="min-width:55px;font-weight:600">Prénom :</span><span style="flex:1;border-bottom:1px dotted #333">&nbsp;${prenom.toUpperCase()}</span></div>
      <div style="display:flex"><span style="min-width:55px;font-weight:600">Nom :</span><span style="flex:1;border-bottom:1px dotted #333">&nbsp;${nom.toUpperCase()}</span></div>
      <div style="display:flex;gap:10px">
        <div style="display:flex;flex:1"><span style="min-width:35px;font-weight:600">Age :</span><span style="flex:1;border-bottom:1px dotted #333">&nbsp;${age} ans</span></div>
        <div style="display:flex;flex:1"><span style="min-width:25px;font-weight:600">Tél :</span><span style="flex:1;border-bottom:1px dotted #333">&nbsp;${tel||''}</span></div>
      </div>
      <div style="display:flex"><span style="min-width:55px;font-weight:600">ID :</span><span style="flex:1;border-bottom:1px dotted #333">&nbsp;${cubix||dossier}</span></div>
    </div>

    <!-- DATE RDV -->
    <div style="font-size:9px;padding:0 4px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:4px">
        <span style="font-weight:600;white-space:nowrap">Numéro dossier :</span>
        <span style="border-bottom:1px dotted #333;flex:1">&nbsp;${dossier}</span>
      </div>
      <div style="margin-top:4px;display:flex;align-items:center;gap:4px">
        <span style="font-weight:600;white-space:nowrap">Date du rendez-vous :</span>
        <span style="border-bottom:1px dotted #333;flex:1">&nbsp;<b>${nextDate}</b> à 07h30</span>
      </div>
    </div>

    <!-- CASES À COCHER -->
    <div style="font-size:9.5px;padding:0 4px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
        <input type="checkbox" checked style="width:13px;height:13px">
        <span style="font-weight:600">CHIMIOTHÉRAPIE (acte) : <span style="color:#0A3D7A">${proto.name}</span></span>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <input type="checkbox" style="width:13px;height:13px">
        <span style="font-weight:600">TRANSFUSION (acte) :</span>
        <span style="border-bottom:1px dotted #333;flex:1">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
      </div>
    </div>

    <!-- MONTANT -->
    <div style="border:1.5px solid #0A3D7A;border-radius:4px;padding:5px 8px;margin-bottom:8px;font-size:9px">
      <div style="display:flex;align-items:center;gap:4px">
        <span style="font-weight:600;white-space:nowrap">Montant à payer à la facturation :</span>
        <span style="font-size:11px;font-weight:bold;color:#0A3D7A;flex:1;text-align:right">${montant}</span>
      </div>
      <div style="font-size:8px;color:#888;margin-top:2px;text-align:right">Unité de chimiothérapie</div>
    </div>

    <!-- SIGNATURE -->
    <div style="text-align:right;font-size:9px;font-weight:bold;padding-right:4px">
      ${med||'Le Médecin traitant'}
      <div style="border-bottom:1px solid #000;margin-top:22px;width:120px;margin-left:auto"></div>
    </div>

    <!-- TEL -->
    <div style="text-align:center;font-size:9px;font-weight:bold;margin-top:8px;color:#0A3D7A">
      76 196 79 85
    </div>
  </div>`;

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>Bon RDV — ${prenom} ${nom}</title>
<style>
  @page{size:A4 landscape;margin:8mm 10mm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,Helvetica,sans-serif;color:#000;background:white}
  input[type=checkbox]{accent-color:#0A3D7A}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    input[type=checkbox]{-webkit-print-color-adjust:exact}}
</style>
</head><body>
<div style="display:flex;width:100%;gap:0;align-items:flex-start">
  ${bloc()}
  <div style="width:4%;display:flex;justify-content:center">
    <div style="border-left:1.5px dashed #aaa;height:100%;min-height:180px"></div>
  </div>
  ${bloc()}
</div>
</body></html>`;

  const frame=document.getElementById('print-frame');
  frame.style.cssText='position:fixed;left:-9999px;top:0;width:297mm;height:210mm;border:none;display:block';
  const fdoc=frame.contentDocument||frame.contentWindow.document;
  fdoc.open();fdoc.write(html);fdoc.close();
  setTimeout(()=>{
    try{frame.contentWindow.focus();frame.contentWindow.print();}
    catch(e){const b=new Blob([html],{type:'text/html'});window.open(URL.createObjectURL(b),'_blank');}
    setTimeout(()=>{frame.style.cssText='display:none;position:fixed;left:-9999px;width:0;height:0;border:none';},3000);
  },400);
}

function printRapport(){
  const period   = getStatsPeriod();
  const allHist  = historique;
  const allSorties = JSON.parse(localStorage.getItem('chncak_sorties')||'[]');
  const hist     = filterByPeriod(allHist, period);
  const sorties  = filterByPeriod(allSorties, period);
  const label    = periodLabel(period);
  const now      = new Date();
  const dateStr  = now.toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'});
  const timeStr  = now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});

  // â”€â”€ Compute stats â”€â”€
  const total    = hist.length;
  const patients = new Set(hist.map(h=>h.nom+h.prenom)).size;
  const nbSorties= sorties.length;

  const protoCount={}, medecinCount={}, indicCount={}, monthCount={};
  hist.forEach(h=>{
    protoCount[h.protoName]=(protoCount[h.protoName]||0)+1;
    if(h.medecin) medecinCount[h.medecin]=(medecinCount[h.medecin]||0)+1;
    if(h.indication){ const ind=h.indication.replace('Chimiothérapie ',''); indicCount[ind]=(indicCount[ind]||0)+1; }
    const d=new Date(h.dateTs);
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    monthCount[key]=(monthCount[key]||0)+1;
  });

  const molCount={}, molFlacons={}, molCout={};
  sorties.forEach(s=>{
    if(s.details){
      s.details.split(', ').forEach(detail=>{
        const m=detail.match(/^(.+?):\s*(\d+)\s*flacon/);
        if(m){ const mol=m[1].trim(), fl=parseInt(m[2]);
          molCount[mol]=(molCount[mol]||0)+1;
          molFlacons[mol]=(molFlacons[mol]||0)+fl;
        }
      });
    }
  });
  // Compute costs from catalog
  let coutTotal = 0;
  Object.entries(molFlacons).forEach(([mol, fl])=>{
    const drug = catalog.find(c=>c.name===mol);
    if(drug){ const cout=(drug.prixUnit||0)*fl; molCout[mol]=cout; coutTotal+=cout; }
  });

  const topProtos   = Object.entries(protoCount).sort((a,b)=>b[1]-a[1]);
  const topMedecins = Object.entries(medecinCount).sort((a,b)=>b[1]-a[1]);
  const topIndics   = Object.entries(indicCount).sort((a,b)=>b[1]-a[1]);
  const months      = Object.entries(monthCount).sort((a,b)=>a[0].localeCompare(b[0]));
  const topMols     = Object.entries(molCount).sort((a,b)=>b[1]-a[1]);

  // â”€â”€ Helper : bar SVG â”€â”€
  const maxProto = Math.max(...topProtos.map(p=>p[1]),1);
  const maxMol   = Math.max(...topMols.map(m=>m[1]),1);

  const barRow = (label, val, max, color='#0A3D7A') => `
    <tr>
      <td style="padding:4px 8px;font-size:10px;width:35%;font-weight:600;color:#333">${label}</td>
      <td style="padding:4px 8px;width:50%">
        <div style="background:#E8EEF8;border-radius:3px;height:12px;overflow:hidden">
          <div style="background:${color};height:100%;width:${Math.round(val/max*100)}%;border-radius:3px"></div>
        </div>
      </td>
      <td style="padding:4px 8px;font-size:10px;font-weight:700;color:${color};text-align:right;white-space:nowrap">${val}</td>
    </tr>`;

  const section = (title, color, content) => `
    <div style="margin-bottom:14px;border:1px solid #ddd;border-radius:6px;overflow:hidden;page-break-inside:avoid">
      <div style="background:${color};color:white;padding:7px 12px;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em">${title}</div>
      <div style="padding:10px 12px">${content}</div>
    </div>`;

  // â”€â”€ Historique table â”€â”€
  const histRows = hist.slice(0,50).map((h,i)=>`
    <tr style="${i%2===0?'background:#F8FAFB':''}">
      <td style="padding:4px 8px;border:1px solid #ddd;font-size:9px">${h.date||'—'}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-size:9px;font-weight:600">${h.prenom} ${h.nom}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-size:9px">${h.protoName||'—'}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-size:9px">${(h.localisation||'—').substring(0,25)}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-size:9px">${h.medecin||'—'}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-size:9px;text-align:center">${h.cureNum||'—'}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>${label} — CHNCAK</title>
<style>
  @page{size:A4;margin:12mm 14mm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#000;background:white}
  h1{font-size:14px} h2{font-size:12px} h3{font-size:11px}
  table{width:100%;border-collapse:collapse}
  .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}
  .kpi{border:1px solid #ddd;border-radius:5px;padding:10px;text-align:center;border-top:3px solid #0A3D7A}
  .kpi-val{font-size:22px;font-weight:bold;color:#0A3D7A}
  .kpi-lbl{font-size:9px;color:#666;margin-top:3px;text-transform:uppercase;letter-spacing:0.05em}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact} .page-break{page-break-before:always}}
</style>
</head><body>

<!-- EN-TÊTE -->
<table style="margin-bottom:12px;border-bottom:2px solid #0A3D7A;padding-bottom:8px">
  <tr>
    <td style="width:55px;vertical-align:middle">
      <img src="${LOGO_B64}" style="width:50px;height:50px;object-fit:contain">
    </td>
    <td style="padding-left:10px;vertical-align:top">
      <div style="font-size:8px;color:#555;line-height:1.6">
        République du Sénégal — Ministère de la Santé et de l'Action Sociale<br>
        <b>Centre Hospitalier National Cheikh Ahmadoul Khadim — TOUBA</b><br>
        <b>Service d'Oncologie-Radiothérapie</b>
      </div>
    </td>
    <td style="text-align:right;vertical-align:top">
      <div style="font-size:8px;color:#555;line-height:1.8">
        Généré le : <b>${dateStr}</b><br>
        à <b>${timeStr}</b><br>
        Par : ChimioPro v2
      </div>
    </td>
  </tr>
</table>

<!-- TITRE RAPPORT -->
<div style="background:#0A3D7A;color:white;border-radius:5px;padding:10px 16px;margin-bottom:14px;text-align:center">
  <div style="font-size:14px;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em">&#128200; ${label}</div>
  <div style="font-size:10px;opacity:0.85;margin-top:3px">CHNCAK — Service d'Oncologie-Radiothérapie</div>
</div>

<!-- KPI -->
<div class="kpi-grid">
  <div class="kpi" style="border-top-color:#0A3D7A">
    <div class="kpi-val">${total}</div>
    <div class="kpi-lbl">Protocoles enregistrés</div>
  </div>
  <div class="kpi" style="border-top-color:#0B5E3C">
    <div class="kpi-val" style="color:#0B5E3C">${patients}</div>
    <div class="kpi-lbl">Patients uniques</div>
  </div>
  <div class="kpi" style="border-top-color:#6B3FA0">
    <div class="kpi-val" style="color:#6B3FA0">${nbSorties}</div>
    <div class="kpi-lbl">Préparations validées</div>
  </div>
  <div class="kpi" style="border-top-color:#E67E22">
    <div class="kpi-val" style="color:#E67E22">${coutTotal>0?coutTotal.toLocaleString('fr-FR')+' F':'—'}</div>
    <div class="kpi-lbl">Coût médicaments (FCFA)</div>
  </div>
</div>

<!-- DEUX COLONNES -->
<div class="two-col">

  <!-- Protocoles -->
  ${section('Protocoles utilisés', '#0A3D7A', topProtos.length ? `
    <table>${topProtos.map(([n,v])=>barRow(n,v,maxProto,'#0A3D7A')).join('')}</table>` :
    '<p style="color:#999;font-size:10px;text-align:center;padding:10px">Aucune donnée</p>')}

  <!-- Médecins -->
  ${section('Prescriptions par médecin', '#0B5E3C', topMedecins.length ? `
    <table>${topMedecins.map(([n,v])=>`
      <tr>
        <td style="padding:4px 8px;font-size:10px;font-weight:600">${n}</td>
        <td style="padding:4px 8px;font-size:10px;font-weight:700;color:#0B5E3C;text-align:right">${v} protocole${v>1?'s':''}</td>
      </tr>`).join('')}</table>` :
    '<p style="color:#999;font-size:10px;text-align:center;padding:10px">Aucun médecin</p>')}

</div>

<div class="two-col">

  <!-- Indications -->
  ${section('Types de chimiothérapie', '#6B3FA0', topIndics.length ? `
    <table>${topIndics.map(([n,v])=>`
      <tr>
        <td style="padding:4px 8px;font-size:10px;font-weight:600;color:#6B3FA0">${n}</td>
        <td style="padding:4px 8px;font-size:10px;font-weight:700;text-align:right">${v}</td>
      </tr>`).join('')}</table>` :
    '<p style="color:#999;font-size:10px;text-align:center;padding:10px">Aucune donnée</p>')}

  <!-- Activité par mois -->
  ${section('Activité par mois', '#185FA5', months.length ? `
    <table>${months.map(([m,v])=>{
      const [yr,mo]=m.split('-');
      const mName=['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'][parseInt(mo)-1];
      return barRow(mName+' '+yr, v, Math.max(...months.map(x=>x[1]),1), '#185FA5');
    }).join('')}</table>` :
    '<p style="color:#999;font-size:10px;text-align:center;padding:10px">Aucune donnée</p>')}

</div>

<!-- MOLÉCULES & COÛTS -->
${topMols.length ? section('Consommation médicaments (préparations validées)', '#4A2A80', `
  <table style="width:100%;border-collapse:collapse">
    <thead>
      <tr style="background:#F5F0FF">
        <th style="padding:5px 8px;font-size:9px;color:#4A2A80;text-align:left;border-bottom:2px solid #D0C0F0">Médicament</th>
        <th style="padding:5px 8px;font-size:9px;color:#4A2A80;text-align:center;border-bottom:2px solid #D0C0F0">Prépas</th>
        <th style="padding:5px 8px;font-size:9px;color:#4A2A80;text-align:center;border-bottom:2px solid #D0C0F0">Flacons</th>
        <th style="padding:5px 8px;font-size:9px;color:#4A2A80;text-align:right;border-bottom:2px solid #D0C0F0">Coût total (FCFA)</th>
      </tr>
    </thead>
    <tbody>
      ${topMols.map(([mol,n],i)=>`
        <tr style="${i%2===0?'background:#FAF8FF':''}">
          <td style="padding:4px 8px;font-size:10px;font-weight:600;color:#4A2A80">${mol}</td>
          <td style="padding:4px 8px;font-size:10px;text-align:center;font-weight:700">${n}</td>
          <td style="padding:4px 8px;font-size:10px;text-align:center">${molFlacons[mol]||0}</td>
          <td style="padding:4px 8px;font-size:10px;text-align:right;color:#6B3FA0;font-weight:600">${molCout[mol]?(molCout[mol]).toLocaleString('fr-FR')+' F':'—'}</td>
        </tr>`).join('')}
      <tr style="background:#F5F0FF;font-weight:bold">
        <td colspan="3" style="padding:5px 8px;font-size:10px;color:#4A2A80">TOTAL</td>
        <td style="padding:5px 8px;font-size:11px;text-align:right;color:#4A2A80">${coutTotal>0?coutTotal.toLocaleString('fr-FR')+' FCFA':'—'}</td>
      </tr>
    </tbody>
  </table>`) : ''}

<!-- HISTORIQUE PROTOCOLES -->
<div class="page-break"></div>
${hist.length ? section('Registre des protocoles administrés ('+hist.length+' enregistrements)', '#0A3D7A', `
  <table>
    <thead>
      <tr style="background:#EEF4FD">
        <th style="padding:5px 8px;font-size:9px;text-align:left;border-bottom:2px solid #B8D0F5;color:#0A3D7A">Date</th>
        <th style="padding:5px 8px;font-size:9px;text-align:left;border-bottom:2px solid #B8D0F5;color:#0A3D7A">Patient</th>
        <th style="padding:5px 8px;font-size:9px;text-align:left;border-bottom:2px solid #B8D0F5;color:#0A3D7A">Protocole</th>
        <th style="padding:5px 8px;font-size:9px;text-align:left;border-bottom:2px solid #B8D0F5;color:#0A3D7A">Localisation</th>
        <th style="padding:5px 8px;font-size:9px;text-align:left;border-bottom:2px solid #B8D0F5;color:#0A3D7A">Médecin</th>
        <th style="padding:5px 8px;font-size:9px;text-align:center;border-bottom:2px solid #B8D0F5;color:#0A3D7A">Cure N°</th>
      </tr>
    </thead>
    <tbody>${histRows}</tbody>
  </table>
  ${hist.length>50?`<p style="font-size:9px;color:#888;margin-top:6px;text-align:center">Affichage limité à 50 enregistrements sur ${hist.length}. Exportez pour voir tout.</p>`:''}`) : ''}

<!-- PIED DE PAGE -->
<div style="margin-top:20px;padding-top:8px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:8px;color:#999">
  <span>CHNCAK — Service d'Oncologie-Radiothérapie, Touba — ChimioPro v2</span>
  <span>Rapport confidentiel — Usage médical interne uniquement</span>
  <span>${dateStr}</span>
</div>

</body></html>`;

  const frame = document.getElementById('print-frame');
  frame.style.cssText = 'position:fixed;left:-9999px;top:0;width:210mm;height:297mm;border:none;display:block';
  const fdoc = frame.contentDocument || frame.contentWindow.document;
  fdoc.open(); fdoc.write(html); fdoc.close();
  setTimeout(()=>{
    try{ frame.contentWindow.focus(); frame.contentWindow.print(); }
    catch(e){ const b=new Blob([html],{type:'text/html'}); window.open(URL.createObjectURL(b),'_blank'); }
    setTimeout(()=>{ frame.style.cssText='display:none;position:fixed;left:-9999px;width:0;height:0;border:none'; },3000);
  }, 400);
}

function printDoc(double){
  const proto = PROTOCOLS.find(p=>p.id===selId);
  if(!proto) return;

  /* â”€â”€ Collect all form values â”€â”€ */
  const prenom      = document.getElementById('prenom').value.trim();
  const nom         = document.getElementById('nom').value.trim();
  const age         = document.getElementById('age').value;
  const pdsVal      = document.getElementById('poids').value;
  const tailleVal   = document.getElementById('taille').value;
  const sexe        = document.getElementById('sexe').value;
  const ind         = document.getElementById('indication').value;
  const loc         = document.getElementById('localisation').value||'—';
  const atcd        = getAtcd()||'RAS';
  const med         = document.getElementById('medecin-select').value||'';
  const dossier     = document.getElementById('dossier').value||'';
  const cubix       = document.getElementById('cubix').value||'';
  const codegratuite= document.getElementById('codegratuite').value||'';
  const numSeq      = document.getElementById('num-seq').value||'';
  const totalC      = document.getElementById('total-cures').value||'4';
  const cureN       = document.getElementById('cure-num').value||'';
  const dp          = document.getElementById('date-protocole').value;
  const dateProto   = dp ? dp.split('-').reverse().join('/') : new Date().toLocaleDateString('fr-FR');

  /* â”€â”€ Drug rows — exact original format â”€â”€ */
  const rows = proto.drugs.map(d => {
    const dose = getDose(d);

    // Réhydratation / Rinçage rows — italic background like originals
    if(dose.cls === 'rh') return `
      <tr>
        <td colspan="5" style="padding:3px 8px;font-size:10px;color:#555;background:#f0f0f0;font-style:italic;border:1px solid #ccc;">
          ${d.label}, faire passer en ${d.dur}
        </td>
      </tr>`;

    const lim = checkDoseLimit(d.name, dose.val);
    const warn = lim==='danger' ? ' <b style="color:#C0392B">ALERTE</b>' : lim==='warn' ? ' <span style="color:#E67E22">⚠</span>' : '';
    const doseCell = (dose.calc||dose.oral)
      ? `<b>${dose.txt}</b>${warn}${dose.note ? '<br><small style="color:#888;font-style:italic">'+dose.note+'</small>' : ''}`
      : dose.txt;

    const solDisplay = dose.sol || d.sol || '—';
    const rowBg = d.hl ? 'background:#f0f4fb;' : '';
    const nameBold = d.hl ? 'font-weight:bold;' : '';

    return `
      <tr>
        <td style="padding:4px 6px;border:1px solid #ccc;font-size:10px;${nameBold}${rowBg}">
          ${d.name}${d.note ? '<br><small style="color:#c07800;font-style:italic">⚠ '+d.note+'</small>' : ''}
        </td>
        <td style="padding:4px 6px;border:1px solid #ccc;font-size:10px;${rowBg}">${doseCell}</td>
        <td style="padding:4px 6px;border:1px solid #ccc;font-size:10px;${rowBg}">${solDisplay}</td>
        <td style="padding:4px 6px;border:1px solid #ccc;font-size:10px;${rowBg}">${d.dur||'—'}</td>
        <td style="padding:4px 6px;border:1px solid #ccc;font-size:10px;${rowBg}">${d.ryt||'—'}</td>
      </tr>`;
  }).join('');

  /* â”€â”€ Capécitabine follow-up sheet â”€â”€ */
  let capeHtml = '';
  if(proto.hasCape){
    const capeDrug = proto.drugs.find(d=>d.oral);
    if(capeDrug){
      const dt    = Math.round(capeDrug.mgm2*sc);
      const cp500 = Math.floor(dt/500);
      const cp150 = Math.round((dt - cp500*500) / 150);
      const cpTxt = (cp500>0 ? cp500+' cp à 500 mg' : '') + (cp150>0 ? (cp500>0?' + ':'')+cp150+' cp à 150 mg' : '');
      // Two columns J1-J7 and J8-J14 like original XELOX(2) model
      const makeRows = (from, to) => Array.from({length:to-from+1},(_,i)=>`
        <tr>
          <td style="border:1px solid #ccc;padding:3px 6px;font-size:10px;font-weight:bold;text-align:center;background:#e8eef8">J${from+i}</td>
          <td style="border:1px solid #ccc;padding:3px 6px;font-size:10px">${cpTxt}<br><small style="color:#555">= ${dt} mg</small></td>
          <td style="border:1px solid #ccc;padding:3px 6px;font-size:10px;text-align:center;width:60px">&#9744;</td>
          <td style="border:1px solid #ccc;padding:3px 6px;font-size:10px;text-align:center;width:60px">&#9744;</td>
        </tr>`).join('');

      capeHtml = `
        <div style="margin-top:8px;page-break-inside:avoid">
          <div style="font-size:9px;font-weight:bold;color:#0A3D7A;border-left:3px solid #0A3D7A;padding-left:5px;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.04em">
            Capécitabine — Calendrier de prise — Dose : ${dt} mg × 2/j
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <table style="width:100%;border-collapse:collapse;font-size:10px">
              <thead><tr>
                <th style="border:1px solid #0A3D7A;padding:3px 6px;background:#0A3D7A;color:white;font-size:9px">Jour</th>
                <th style="border:1px solid #0A3D7A;padding:3px 6px;background:#0A3D7A;color:white;font-size:9px">Comprimés</th>
                <th style="border:1px solid #0A3D7A;padding:3px 6px;background:#0A3D7A;color:white;font-size:9px">Matin ✓</th>
                <th style="border:1px solid #0A3D7A;padding:3px 6px;background:#0A3D7A;color:white;font-size:9px">Soir ✓</th>
              </tr></thead>
              <tbody>${makeRows(1,7)}</tbody>
            </table>
            <table style="width:100%;border-collapse:collapse;font-size:10px">
              <thead><tr>
                <th style="border:1px solid #0A3D7A;padding:3px 6px;background:#0A3D7A;color:white;font-size:9px">Jour</th>
                <th style="border:1px solid #0A3D7A;padding:3px 6px;background:#0A3D7A;color:white;font-size:9px">Comprimés</th>
                <th style="border:1px solid #0A3D7A;padding:3px 6px;background:#0A3D7A;color:white;font-size:9px">Matin ✓</th>
                <th style="border:1px solid #0A3D7A;padding:3px 6px;background:#0A3D7A;color:white;font-size:9px">Soir ✓</th>
              </tr></thead>
              <tbody>${makeRows(8,14)}</tbody>
            </table>
          </div>
          <div style="margin-top:4px;font-size:9px;color:#7A4B00;background:#FFF3DC;padding:4px 8px;border-radius:3px">
            ⚠ Repos 7 jours — Comprimés avalés entiers avec de l'eau, dans les 30 mn qui suivent les repas. Ne pas écraser ni couper.
            NFS et Créatinine à faire au 5e jour de repos.
          </div>
        </div>`;
    }
  }

  /* â”€â”€ Carboplatine Calvert detail â”€â”€ */
  const carboBox = (proto.hasCarbo && carboDose>0)
    ? `<div style="background:#EEF4FD;border:1px solid #B8D0F5;padding:3px 8px;font-size:9px;color:#0A3D7A;margin:3px 0;border-radius:3px">
        <b>Formule de Calvert :</b> Créatininémie ${document.getElementById('creatinine').value} µmol/L —
        ClCr ${document.getElementById('res-clcr').textContent} mL/min —
        AUC ${document.getElementById('res-auc').textContent} mg/mL/min —
        <b>Dose Carboplatine : ${carboDose} mg</b>
       </div>` : '';

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     ONE HALF-PAGE EXEMPLAIRE — exact original layout
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  const exemplaire = `
<div class="exemplaire">

  <!-- â‘  EN-TÊTE : institution gauche | références droite -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:5px">
    <tr>
      <td style="vertical-align:top;width:62%">
        <p style="font-size:8.5px;line-height:1.6;color:#000;margin:0">
          République du Sénégal<br>
          <b>Un peuple-un but-une foi</b><br>
          …………………………………<br>
          Ministère de la Santé et l'Action Sociale<br>
          …………………………………<br>
          Direction Générale des Etablissements de Santé<br>
          …………………………….<br>
          Direction des Etablissements Publics de Santé<br>
          ………………………………<br>
          <b>Centre Hospitalier National Cheikh Ahmadoul Khadim</b><br>
          ……………………………….<br>
          <b>Service d'Oncologie - Radiothérapie</b>
        </p>
      </td>
      <td style="vertical-align:top;text-align:right;font-size:9px;line-height:2;color:#000">
        <b>CHNCAK …N°${dossier||'________'}</b><br>
        <span style="font-size:8.5px">Date : <b>${dateProto}</b></span><br>
        ${cubix ? `<b>${cubix}</b><br>` : ''}
        ${codegratuite ? `<b>${codegratuite}</b>` : ''}
      </td>
    </tr>
  </table>

  <!-- â‘¡ TITRE PROTOCOLE encadré -->
  <div style="border:1.5px solid #000;padding:5px 10px;margin-bottom:5px;text-align:center">
    <div style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.02em">
      PROTOCOLE (${proto.detail})
    </div>
    <div style="font-size:9px;margin-top:2px">
      Indication : <b>${ind}</b>
    </div>
  </div>

  <!-- â‘¢ DONNÉES PATIENT -->
  <div style="margin-bottom:4px">
    <div style="font-size:12px;font-weight:bold;margin-bottom:3px">${prenom.toUpperCase()} ${nom.toUpperCase()}</div>
    <div style="font-size:10px;margin-bottom:2px">
      Age : <b>${age} ans</b>
      &nbsp;&nbsp;&nbsp;
      Poids : <b>${pdsVal} kg</b>
      &nbsp;&nbsp;&nbsp;
      taille : <b>${tailleVal} cm</b>
      &nbsp;&nbsp;&nbsp;
      SC : <b>${sc.toFixed(2)} m²</b>
    </div>
    <div style="font-size:10px;margin-bottom:2px">Localisation : <b>${loc}</b></div>
    <div style="font-size:10px">Antécédents médicaux : <b>${atcd}</b></div>
  </div>

  ${carboBox}

  <!-- â‘£ TABLEAU MÉDICAMENTS -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:4px">
    <thead>
      <tr>
        <th style="border:1px solid #ccc;padding:4px 6px;background:#e8eef8;font-size:9px;text-align:left;width:30%">Médicaments</th>
        <th style="border:1px solid #ccc;padding:4px 6px;background:#e8eef8;font-size:9px;text-align:left;width:15%">Dose</th>
        <th style="border:1px solid #ccc;padding:4px 6px;background:#e8eef8;font-size:9px;text-align:left;width:27%">Solvant</th>
        <th style="border:1px solid #ccc;padding:4px 6px;background:#e8eef8;font-size:9px;text-align:left;width:12%">Durée</th>
        <th style="border:1px solid #ccc;padding:4px 6px;background:#e8eef8;font-size:9px;text-align:left;width:16%">Rythme</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <!-- â‘¤ NOMBRE DE CURES -->
  <div style="font-size:10px;margin:4px 0 3px">
    Faire au total <b><u>${totalC} cures</u></b> puis évaluation
    ${cureN ? `&nbsp;&nbsp;&nbsp; <b>Cure en cours : N° ${cureN}</b>` : ''}
  </div>

  <!-- â‘¥ CAPÉCITABINE (si protocole oral) -->
  ${capeHtml}

  <!-- â‘¦ SIGNATURE -->
  <div style="text-align:right;margin-top:6px">
    <div style="display:inline-block;text-align:center;font-size:9px;min-width:140px">
      <div style="font-style:italic">Médecin traitant</div>
      <div style="font-weight:bold;font-size:11px;margin-top:2px">${med||'DR ________________'}</div>
      <div style="border-bottom:1px solid #000;margin-top:22px;width:140px"></div>
    </div>
  </div>

</div>`;

  /* â”€â”€ Full A4 document — 2 identical halves separated by dashed line â”€â”€ */
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Protocole ${proto.name} — ${prenom} ${nom}</title>
  <style>
    @page {
      size: A4;
      margin: 8mm 14mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      color: #000;
      background: white;
    }
    .exemplaire {
      width: 100%;
      /* Each exemplaire takes exactly half the A4 page height */
      min-height: 130mm;
      padding-bottom: 4px;
    }
    .cut-line {
      border: none;
      border-top: 1.5px dashed #666;
      margin: 5px 0;
      width: 100%;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .cut-line { border-top: 1px dashed #999; }
    }
  </style>
</head>
<body>
  ${exemplaire}
  <div class="cut-line"></div>
  ${exemplaire}


<!-- Hidden iframe for printing — avoids window.open popup blockers -->

</body>
</html>`;

  /* â”€â”€ Use hidden iframe to print — avoids popup blockers â”€â”€ */
  const frame = document.getElementById('print-frame');
  frame.style.display = 'block';
  frame.style.width = '210mm';
  frame.style.height = '297mm';
  frame.style.position = 'fixed';
  frame.style.left = '-9999px';

  const fdoc = frame.contentDocument || frame.contentWindow.document;
  fdoc.open();
  fdoc.write(html);
  fdoc.close();

  // Use setTimeout for reliable cross-browser print
  setTimeout(function(){
    try {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } catch(e){
      const blob = new Blob([html], {type:'text/html'});
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
    setTimeout(()=>{
      frame.style.display = 'none';
      frame.style.width = '0';
      frame.style.height = '0';
    }, 2000);
  }, 400);
}

/* ============================================================
   PHARMACIE — GESTION MÉDICAMENTS & FLACONS
============================================================ */

// Catalog based on CHNCAK conditioning file (CONDITIONNMENT_DES_FLACONS_MEDICAMANTS_ANTICANCERUX)
// {name, dci, dosages:[mg], forme, cond, qteStock, prixUnit(FCFA)}
const DEFAULT_CATALOG = [
  // â”€â”€ Platines â”€â”€
  {name:'OXALIPLATINE',            dci:'Oxaliplatine',         dosages:[50,100],      forme:'Injectable', cond:'B1',  qteStock:50,  prixUnit:45000},
  {name:'CISPLATINE',              dci:'Cisplatine',           dosages:[10,50],       forme:'Injectable', cond:'B1',  qteStock:50,  prixUnit:8000},
  {name:'CARBOPLATINE',            dci:'Carboplatine',         dosages:[150,450],     forme:'Injectable', cond:'B1',  qteStock:100, prixUnit:35000},
  // â”€â”€ Taxanes â”€â”€
  {name:'TAXOL (Paclitaxel)',      dci:'Paclitaxel',           dosages:[100],         forme:'Injectable', cond:'B1',  qteStock:200, prixUnit:120000},
  {name:'TAXOTÈRE (Docétaxel)',    dci:'Docetaxel',            dosages:[20,80],       forme:'Injectable', cond:'B1',  qteStock:50,  prixUnit:95000},
  // â”€â”€ Anthracyclines â”€â”€
  {name:'DOXORUBICINE',            dci:'Doxorubicine',         dosages:[50],          forme:'Injectable', cond:'B1',  qteStock:100, prixUnit:28000},
  {name:'ÉPIRUBICINE',             dci:'Epirubicine',          dosages:[50],          forme:'Injectable', cond:'B1',  qteStock:50,  prixUnit:32000},
  // â”€â”€ Alkylants â”€â”€
  {name:'CYCLOPHOSPHAMIDE',        dci:'Cyclophosphamide',     dosages:[500,1000],    forme:'Injectable', cond:'B1',  qteStock:100, prixUnit:12000},
  // â”€â”€ Antimétabolites â”€â”€
  {name:'GEMCITABINE',             dci:'Gemcitabine',          dosages:[1000,200],    forme:'Injectable', cond:'B1',  qteStock:20,  prixUnit:55000},
  {name:'5-FLUOROURACILE',         dci:'Fluoro 5 uracile',    dosages:[500],         forme:'Injectable', cond:'B10', qteStock:100, prixUnit:4500},
  {name:'LEUCOVORINE (LV)',        dci:'Folinate de calcium',  dosages:[50],          forme:'Injectable', cond:'B5',  qteStock:30,  prixUnit:5000},
  {name:'MÉTHOTREXATE',            dci:'Méthotrexate',         dosages:[500],         forme:'Injectable', cond:'B5',  qteStock:20,  prixUnit:15000},
  // â”€â”€ Topo-isomérases â”€â”€
  {name:'IRINOTÉCAN',              dci:'Irinotecan',           dosages:[100],         forme:'Injectable', cond:'B1',  qteStock:30,  prixUnit:85000},
  {name:'ÉTOPOSIDE',               dci:'Etoposide',            dosages:[100],         forme:'Injectable', cond:'B1',  qteStock:30,  prixUnit:18000},
  // â”€â”€ Thérapies ciblées â”€â”€
  {name:'AVASTIN (Bévacizumab)',   dci:'Bevacizumab',         dosages:[400],         forme:'Injectable', cond:'B1',  qteStock:10,  prixUnit:450000},
  {name:'TRASTUZUMAB',             dci:'Trastuzumab',          dosages:[150],         forme:'Injectable', cond:'B1',  qteStock:30,  prixUnit:380000},
  // â”€â”€ Support / Autres â”€â”€
  {name:'Kytril (Granisetron)',    dci:'Granisetron',          dosages:[3],           forme:'Injectable', cond:'B5',  qteStock:200, prixUnit:6500},
  {name:'Hydrocortisone',          dci:'Hydrocortisone',       dosages:[100,500],     forme:'Injectable', cond:'B10', qteStock:200, prixUnit:2500},
  {name:'DACARBAZINE',             dci:'Dacarbazine',          dosages:[400],         forme:'Injectable', cond:'B10', qteStock:30,  prixUnit:22000},
  {name:'BLÉOMYCINE',              dci:'Bléomycine',           dosages:[15],          forme:'Injectable', cond:'B1',  qteStock:20,  prixUnit:18000},
  {name:'VINCRISTINE',             dci:'Vincristine',          dosages:[1],           forme:'Injectable', cond:'B10', qteStock:20,  prixUnit:9000},
  {name:'VINBLASTINE',             dci:'Vinblastine',          dosages:[10],          forme:'Injectable', cond:'B10', qteStock:20,  prixUnit:14000},
  {name:'NAVELBINE',               dci:'Vinorelbine',          dosages:[50],          forme:'Injectable', cond:'B5',  qteStock:30,  prixUnit:35000},
  {name:'CYTARABINE',              dci:'Cytarabine',           dosages:[100],         forme:'Injectable', cond:'B1',  qteStock:20,  prixUnit:8000},
  {name:'TÉMOZOLOMIDE',            dci:'Temozolomide',         dosages:[20,100],      forme:'Injectable', cond:'B5',  qteStock:10,  prixUnit:95000},
  {name:'PEMETREXED',              dci:'Pemextred',            dosages:[100],         forme:'Injectable', cond:'B1',  qteStock:20,  prixUnit:220000},
  {name:'FILGRASTIM (G-CSF)',      dci:'Filgrastim',           dosages:[30],          forme:'Injectable', cond:'B10', qteStock:100, prixUnit:18000},
  {name:'ZOMETA',                  dci:'Acide zolédronique',  dosages:[4],           forme:'Injectable', cond:'B1',  qteStock:50,  prixUnit:45000},
];

let catalog = JSON.parse(localStorage.getItem('chncak_catalog') || 'null') || DEFAULT_CATALOG;

function saveCatalog(){
  localStorage.setItem('chncak_catalog', JSON.stringify(catalog));
  const msg = document.getElementById('catalog-save-msg');
  msg.style.display='inline';
  setTimeout(()=>msg.style.display='none', 2000);
  renderPharmacie();
}

/* â”€â”€ IMPORT EXCEL CATALOGUE â”€â”€ */
function importCatalogExcel(input){
  const file = input.files[0];
  if(!file) return;
  const msgEl = document.getElementById('catalog-import-msg');
  msgEl.style.display = '';
  msgEl.style.background = 'var(--blue-pale)';
  msgEl.style.color = 'var(--blue)';
  msgEl.style.border = '1px solid var(--blue-mid)';
  msgEl.textContent = 'â³ Lecture du fichier…';

  const reader = new FileReader();
  reader.onload = function(e){
    try {
      const data = new Uint8Array(e.target.result);
      const wb   = XLSX.read(data, {type:'array'});
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, {defval:''});

      if(!rows.length){ showImportMsg('error','X Fichier vide ou format incorrect.'); return; }

      let updated=0, added=0, errors=[];
      const normalizeName = s => (s||'').toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
      const importedExisting = rows.some(row => {
        const getValue = (...keys) => {
          for(const k of Object.keys(row)){
            const nk = normalizeName(k);
            if(keys.some(key => nk.includes(normalizeName(key)))) return row[k];
          }
          return '';
        };
        const name = (getValue('medicament','nom','name','drug') || '').toString().trim();
        const dci = (getValue('dci','molecule','generique') || '').toString().trim();
        return catalog.some(c => normalizeName(c.name) === normalizeName(name) || (dci && normalizeName(c.dci) === normalizeName(dci)));
      });
      const cumulateExistingStock = importedExisting
        ? confirm("Le fichier contient des medicaments deja presents dans le catalogue.\n\nOK = cumuler les quantites avec le stock existant.\nAnnuler = garder seulement les quantites du nouveau fichier.")
        : false;

      rows.forEach((row, i)=>{
        // Accept flexible column names (case-insensitive, accents ignored)
        const normalize = s => (s||'').toString().toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();

        const getCol = (...keys) => {
          for(const k of Object.keys(row)){
            if(keys.some(key => normalize(k).includes(normalize(key))))
              return row[k];
          }
          return null;
        };

        const name      = (getCol('medicament','nom','name','drug') || '').toString().trim().toUpperCase();
        const dci       = (getCol('dci','molecule','generique') || '').toString().trim();
        const dosagesRaw= (getCol('dosage','presentation','flacon','mg') || '').toString();
        const forme     = (getCol('forme','type') || 'Injectable').toString().trim();
        const cond      = (getCol('cond','conditionnement') || 'B1').toString().trim();
        const prix      = parseFloat((getCol('prix','price','cout','tarif','fcfa') || '0').toString().replace(/[^0-9.]/g,'')) || 0;
        const stock     = parseInt((getCol('stock','qte','quantite') || '0').toString().replace(/[^0-9]/g,'')) || 0;

        if(!name){ errors.push(`Ligne ${i+2} : nom médicament vide`); return; }

        // Parse dosages: "50,100" or "50 100" or "50;100" or just "100"
        const dosages = dosagesRaw
          .split(/[,;\s\/]+/)
          .map(d => parseInt(d))
          .filter(d => !isNaN(d) && d > 0);

        if(!dosages.length){ errors.push(`Ligne ${i+2} (${name}) : dosages invalides "${dosagesRaw}"`); return; }

        const existing = catalog.findIndex(c => normalize(c.name) === normalize(name) || (dci && normalize(c.dci) === normalize(dci)));
        if(existing >= 0){
          // Update existing entry
          catalog[existing].dci       = dci || catalog[existing].dci;
          catalog[existing].dosages   = dosages;
          catalog[existing].forme     = forme;
          catalog[existing].cond      = cond;
          if(prix > 0) catalog[existing].prixUnit = prix;
          const currentStock = parseInt(catalog[existing].qteStock ?? catalog[existing].stock ?? 0) || 0;
          catalog[existing].qteStock  = cumulateExistingStock ? currentStock + stock : stock;
          updated++;
        } else {
          // Add new entry
          catalog.push({name, dci, dosages, forme, cond, qteStock:stock, prixUnit:prix});
          added++;
        }
      });

      saveCatalog();
      const summary = `✅ Import réussi : ${updated} mis à jour, ${added} ajoutés.` +
        (errors.length ? ` ⚠ ${errors.length} erreur(s) : ${errors.slice(0,3).join(' | ')}` : '');
      showImportMsg(errors.length?'warn':'success', summary);
    } catch(err){
      showImportMsg('error','X Erreur lecture fichier : ' + err.message);
    }
    input.value = '';
  };
  reader.readAsArrayBuffer(file);
}

function showImportMsg(type, text){
  const el = document.getElementById('catalog-import-msg');
  el.style.display = '';
  el.textContent   = text;
  if(type==='success'){ el.style.background='var(--green-pale)'; el.style.color='var(--green)'; el.style.border='1px solid #B0DCC5'; }
  else if(type==='warn'){ el.style.background='var(--amber-pale)'; el.style.color='var(--amber)'; el.style.border='1px solid #F0C060'; }
  else { el.style.background='var(--red-pale)'; el.style.color='var(--red2)'; el.style.border='1px solid #F5AAAA'; }
  setTimeout(()=>{ el.style.display='none'; }, 8000);
}

/* â”€â”€ EXPORT EXCEL CATALOGUE â”€â”€ */
function exportCatalogExcel(){
  const rows = catalog.map(d => ({
    'Médicament':   d.name,
    'DCI':          d.dci || '',
    'Dosages (mg)': (d.dosages||[]).join(', '),
    'Forme':        d.forme || 'Injectable',
    'Conditionnement': d.cond || 'B1',
    'Prix/flacon (FCFA)': d.prixUnit || 0,
    'Stock (flacons)': d.qteStock ?? d.stock ?? 0,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  // Column widths
  ws['!cols'] = [30,22,18,14,18,22,18].map(w=>({wch:w}));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Catalogue');
  XLSX.writeFile(wb, 'Catalogue_Pharmacie_CHNCAK.xlsx');
}

/* â”€â”€ DOWNLOAD TEMPLATE â”€â”€ */
function downloadCatalogTemplate(){
  const template = [
    {
      'Médicament':   'OXALIPLATINE',
      'DCI':          'Oxaliplatine',
      'Dosages (mg)': '50, 100',
      'Forme':        'Injectable',
      'Conditionnement': 'B1',
      'Prix/flacon (FCFA)': 45000,
      'Stock (flacons)': 50,
    },
    {
      'Médicament':   'CISPLATINE',
      'DCI':          'Cisplatine',
      'Dosages (mg)': '10, 50',
      'Forme':        'Injectable',
      'Conditionnement': 'B1',
      'Prix/flacon (FCFA)': 8000,
      'Stock (flacons)': 50,
    },
    {
      'Médicament':   'CARBOPLATINE',
      'DCI':          'Carboplatine',
      'Dosages (mg)': '150, 450',
      'Forme':        'Injectable',
      'Conditionnement': 'B1',
      'Prix/flacon (FCFA)': 35000,
      'Stock (flacons)': 100,
    },
    {
      'Médicament':   '[Votre médicament ici]',
      'DCI':          '[DCI / générique]',
      'Dosages (mg)': '[ex: 100, 500]',
      'Forme':        'Injectable',
      'Conditionnement': 'B1',
      'Prix/flacon (FCFA)': 0,
      'Stock (flacons)': 0,
    },
  ];
  const ws = XLSX.utils.json_to_sheet(template);
  ws['!cols'] = [28,22,18,14,18,22,18].map(w=>({wch:w}));
  // Style header row note
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Modèle_Catalogue');
  XLSX.writeFile(wb, 'Modele_Catalogue_Pharmacie_CHNCAK.xlsx');
}

// Calculate how many vials needed and remainder
// Uses dosages[] from catalog (exact sizes from conditioning file)
function calcFlacons(drugName, doseMg){
  const drug = catalog.find(d=>d.name===drugName);
  if(!drug || !doseMg) return null;

  // Use dosages (exact flacon sizes from CHNCAK stock)
  const sizes = [...(drug.dosages||drug.flacons||[])].sort((a,b)=>b-a);
  if(!sizes.length) return null;

  let remaining = doseMg;
  let usedFlacons = [];
  let totalMg = 0;

  // Greedy: largest flacon first to minimize waste
  for(const size of sizes){
    while(remaining > 0){
      usedFlacons.push(size);
      totalMg += size;
      remaining -= size;
    }
    if(remaining <= 0) break;
  }
  // If still not enough (only small flacons), keep adding smallest
  while(remaining > 0){
    const smallest = sizes[sizes.length-1];
    usedFlacons.push(smallest);
    totalMg += smallest;
    remaining -= smallest;
  }

  const reliquat = Math.round((totalMg - doseMg)*10)/10;
  const nbFlacons = usedFlacons.length;
  const prixUnit = drug.prixUnit || drug.prix || 0;
  const cout = nbFlacons * prixUnit;
  const stock = drug.qteStock ?? drug.stock ?? 0;
  const stockOk = stock >= nbFlacons;

  return {
    drug, flacons:usedFlacons, nbFlacons,
    totalMg, reliquat, cout, prixUnit,
    stockOk, stockRestant: stock - nbFlacons,
    stock, cond: drug.cond||'B1', dci: drug.dci||drug.name
  };
}

function renderCatalogTable(){
  const tbody = document.getElementById('catalog-body');
  if(!tbody) return;
  tbody.innerHTML = catalog.map((d,i)=>{
    const stock = d.qteStock ?? d.stock ?? 0;
    const prix = d.prixUnit ?? d.prix ?? 0;
    const stockLow = stock <= 5;
    const stockCrit = stock <= 2;
    const dosagesStr = (d.dosages||d.flacons||[]).join(' / ')+' mg';
    return `<tr style="${i%2===0?'background:var(--gray-light)':'background:white'}">
      <td style="padding:7px 10px;font-size:12px;font-weight:600;color:var(--blue)">${d.name}</td>
      <td style="padding:7px 8px;font-size:11px;color:var(--gray-mid)">${d.dci||''}</td>
      <td style="padding:7px 8px;font-size:12px;font-weight:500">${dosagesStr}</td>
      <td style="padding:7px 8px;font-size:11px;color:var(--gray-mid)">${d.cond||'B1'}</td>
      <td style="padding:4px 6px">
        <input type="number" value="${prix}" data-idx="${i}" data-field="prixUnit"
          placeholder="FCFA" style="width:100px;padding:5px 7px;font-size:12px;border:1px solid var(--gray-border);border-radius:4px"
          oninput="updateCatalogField(${i},'prixUnit',this.value)">
      </td>
      <td style="padding:4px 6px">
        <input type="number" value="${stock}" data-idx="${i}" data-field="qteStock"
          placeholder="flacons" min="0"
          style="width:80px;padding:5px 7px;font-size:12px;border:1px solid ${stockCrit?'var(--red2)':stockLow?'var(--amber2)':'var(--gray-border)'};border-radius:4px;background:${stockCrit?'var(--red-pale)':stockLow?'var(--amber-pale)':'white'}"
          oninput="updateCatalogField(${i},'qteStock',this.value)">
        ${stockCrit?'<span style="font-size:10px;color:var(--red2);margin-left:4px;display:block">ALERTE Critique</span>':stockLow?'<span style="font-size:10px;color:var(--amber2);margin-left:4px;display:block">⚠ Bas</span>':''}
      </td>
    </tr>`;
  }).join('');
}

function updateCatalogField(idx, field, val){
  if(!catalog[idx]) return;
  catalog[idx][field] = parseFloat(val)||0;
  localStorage.setItem('chncak_catalog', JSON.stringify(catalog));
  // Silently refresh pharma calc if visible
  if(document.getElementById('page-pharmacie').classList.contains('active')) renderPharmacie();
}

function renderPharmacie(){
  renderCatalogTable();
  if(!selId) return;
  const proto = PROTOCOLS.find(p=>p.id===selId); if(!proto)return;
  const nameEl = document.getElementById('pharma-proto-name');
  const content = document.getElementById('pharma-content');
  const totaux = document.getElementById('pharma-totaux');

  const prenom = document.getElementById('prenom').value;
  const nom = document.getElementById('nom').value;
  const totalCures = parseInt(document.getElementById('total-cures').value)||4;
  const cureNum = parseInt(document.getElementById('cure-num').value)||1;

  if(!proto || sc<=0){
    nameEl.textContent = 'aucun protocole sélectionné';
    content.innerHTML = `<p style="font-size:13px;color:var(--gray-mid);text-align:center;padding:20px">
      Allez dans l'onglet <b>Protocole</b>, renseignez les données patient et choisissez un protocole.
    </p>`;
    totaux.style.display='none';
    return;
  }

  nameEl.textContent = proto.name + (prenom ? ' — '+prenom+' '+nom : '') + ' — SC '+sc.toFixed(2)+' m²';

  const activeDrugs = proto.drugs.filter(d=>!d.t && !d.fix && !d.oral && (d.mgm2||d.carbo||d.avastin));
  let totalFlacons=0, totalCoutCure=0, alertesStock=0;

  const rows = activeDrugs.map(d=>{
    const dose = getDose(d);
    if(!dose.val) return '';
    const calc = calcFlacons(d.name, dose.val);

    if(!calc) return `<tr style="border-bottom:1px solid var(--gray-border)">
      <td style="padding:10px;font-size:13px;font-weight:600;color:var(--blue)">${d.name}</td>
      <td style="padding:10px;font-size:13px"><b>${dose.val} mg</b></td>
      <td colspan="5" style="padding:10px;font-size:12px;color:var(--gray-mid);font-style:italic">
        Non trouvé dans le catalogue — <button onclick="scrollToCatalog()" style="font-size:11px;color:var(--blue);background:none;border:none;cursor:pointer;text-decoration:underline">Ajouter au catalogue ↓</button>
      </td>
    </tr>`;

    totalFlacons += calc.nbFlacons;
    totalCoutCure += calc.cout;
    if(!calc.stockOk) alertesStock++;

    // Group vials nicely
    const vialMap={};
    calc.flacons.forEach(f=>{vialMap[f]=(vialMap[f]||0)+1;});
    const vialTxt = Object.entries(vialMap)
      .sort((a,b)=>b[0]-a[0])
      .map(([mg,n])=>`<span style="background:#E8F0FC;color:#0A3D7A;border-radius:4px;padding:2px 7px;font-size:12px;font-weight:600;margin-right:3px;display:inline-block;margin-bottom:2px">${n} × ${mg} mg</span>`).join('');

    const stockColor = calc.stockRestant > 3 ? 'var(--green)' : calc.stockOk ? 'var(--amber)' : 'var(--red2)';
    const stockBg = calc.stockRestant > 3 ? 'var(--green-pale)' : calc.stockOk ? 'var(--amber-pale)' : 'var(--red-pale)';
    const stockIcon = calc.stockRestant > 3 ? '✓' : calc.stockOk ? '⚠' : 'ALERTE';

    const coutTotal = calc.cout * totalCures;

    return `<tr style="border-bottom:1px solid var(--gray-border)">
      <td style="padding:10px 8px;font-size:13px;font-weight:600;color:var(--blue);min-width:150px">${d.name}</td>
      <td style="padding:10px 8px;font-size:14px;font-weight:700;color:var(--gray)">${dose.val} mg</td>
      <td style="padding:10px 8px">${vialTxt}
        <div style="font-size:11px;color:var(--gray-mid);margin-top:3px">Total ouvert : ${calc.totalMg} mg (${calc.nbFlacons} flacon${calc.nbFlacons>1?'s':''})</div>
      </td>
      <td style="padding:10px 8px">
        <span style="background:var(--amber-pale);color:var(--amber);border-radius:4px;padding:3px 8px;font-size:12px;font-weight:600;display:inline-block">
          ${calc.reliquat > 0 ? calc.reliquat+' mg' : '0 mg'}
        </span>
        ${calc.reliquat>0?'<div style="font-size:10px;color:var(--gray-mid);margin-top:2px">à jeter / partager</div>':''}
      </td>
      <td style="padding:10px 8px">
        <div style="font-size:13px;font-weight:700">${calc.cout.toLocaleString('fr-FR')} FCFA</div>
        <div style="font-size:11px;color:var(--gray-mid)">/cure</div>
        <div style="font-size:12px;color:#6B3FA0;font-weight:600;margin-top:3px">${coutTotal.toLocaleString('fr-FR')} FCFA</div>
        <div style="font-size:10px;color:var(--gray-mid)">${totalCures} cures au total</div>
      </td>
      <td style="padding:10px 8px">
        <span style="background:${stockBg};color:${stockColor};border-radius:4px;padding:3px 8px;font-size:12px;font-weight:600;display:inline-block">
          ${stockIcon} ${calc.stockOk ? calc.stockRestant+' restants' : 'Insuffisant'}
        </span>
        <div style="font-size:10px;color:var(--gray-mid);margin-top:3px">Stock actuel : ${calc.drug.stock} fl.</div>
      </td>
    </tr>`;
  }).join('');

  const coutTotalPatient = totalCoutCure * totalCures;
  const coutCuresRestantes = totalCoutCure * (totalCures - cureNum + 1);

  content.innerHTML = `
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:13px;min-width:700px">
        <thead>
          <tr style="background:#F5F0FF">
            <th style="padding:8px 10px;text-align:left;font-size:11px;color:#4A2A80;border-bottom:2px solid #D0C0F0;width:18%">Médicament</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;color:#4A2A80;border-bottom:2px solid #D0C0F0;width:10%">Dose</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;color:#4A2A80;border-bottom:2px solid #D0C0F0;width:24%">Flacons à ouvrir</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;color:#4A2A80;border-bottom:2px solid #D0C0F0;width:12%">Reliquat</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;color:#4A2A80;border-bottom:2px solid #D0C0F0;width:18%">Coût cure / total</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;color:#4A2A80;border-bottom:2px solid #D0C0F0;width:18%">Stock</th>
          </tr>
        </thead>
        <tbody>${rows||'<tr><td colspan="6" style="padding:20px;text-align:center;color:var(--gray-mid)">Aucun médicament calculable.</td></tr>'}</tbody>
      </table>
    </div>

    <!-- Résumé financier patient -->
    <div style="margin-top:14px;background:linear-gradient(135deg,#F5F0FF,#EEF4FD);border:1px solid #C8B8F0;border-radius:var(--radius-lg);padding:14px 16px">
      <div style="font-size:12px;font-weight:600;color:#4A2A80;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px">&#128200; Résumé financier — ${prenom||'Patient'} ${nom}</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
        <div style="background:white;border-radius:var(--radius);padding:10px;text-align:center;border:1px solid #D0C0F0">
          <div style="font-size:20px;font-weight:700;color:#6B3FA0">${totalCoutCure.toLocaleString('fr-FR')}</div>
          <div style="font-size:10px;color:var(--gray-mid);margin-top:2px">FCFA / cure</div>
        </div>
        <div style="background:white;border-radius:var(--radius);padding:10px;text-align:center;border:1px solid #D0C0F0">
          <div style="font-size:20px;font-weight:700;color:#0A3D7A">${coutTotalPatient.toLocaleString('fr-FR')}</div>
          <div style="font-size:10px;color:var(--gray-mid);margin-top:2px">FCFA total (${totalCures} cures)</div>
        </div>
        <div style="background:white;border-radius:var(--radius);padding:10px;text-align:center;border:1px solid #D0C0F0">
          <div style="font-size:20px;font-weight:700;color:var(--amber2)">${coutCuresRestantes.toLocaleString('fr-FR')}</div>
          <div style="font-size:10px;color:var(--gray-mid);margin-top:2px">FCFA restant (cure ${cureNum}→${totalCures})</div>
        </div>
        <div style="background:white;border-radius:var(--radius);padding:10px;text-align:center;border:1px solid #D0C0F0">
          <div style="font-size:20px;font-weight:700;color:${alertesStock>0?'var(--red2)':'var(--green)'}">${alertesStock>0?alertesStock+' ALERTE':'✓ OK'}</div>
          <div style="font-size:10px;color:var(--gray-mid);margin-top:2px">Alertes stock</div>
        </div>
      </div>
    </div>
  `;

  totaux.style.display='';
  document.getElementById('pharma-total-flacons').textContent = totalFlacons;
  document.getElementById('pharma-total-cout').textContent = totalCoutCure.toLocaleString('fr-FR')+' FCFA';
  document.getElementById('pharma-stock-alert').textContent = alertesStock>0 ? alertesStock+' alerte(s)' : '✓ OK';
  document.getElementById('pharma-stock-alert').style.color = alertesStock>0?'var(--red2)':'var(--green)';
}

function scrollToCatalog(){
  document.querySelector('#catalog-body').closest('.card').scrollIntoView({behavior:'smooth'});
}

/* ============================================================
   DARK MODE
============================================================ */
function toggleDarkMode(){
  const isDark = document.body.classList.toggle('dark-mode');
  document.getElementById('dark-btn').textContent = isDark ? 'â˜€ï¸' : '🌙';
  localStorage.setItem('chncak_dark', isDark ? '1' : '0');
}

/* ============================================================
   TOAST NOTIFICATIONS
============================================================ */
function showToast(msg, type='info'){
  const tc = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  tc.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ============================================================
   FORM PROGRESS INDICATOR
============================================================ */
function updateProgress(){
  const fields = [
    document.getElementById('prenom')?.value,
    document.getElementById('nom')?.value,
    document.getElementById('age')?.value,
    document.getElementById('poids')?.value,
    document.getElementById('taille')?.value,
    document.getElementById('dossier')?.value,
    document.getElementById('medecin-select')?.value,
    document.getElementById('date-protocole')?.value,
    document.getElementById('localisation')?.value,
    selId ? '1' : '',
  ];
  const filled = fields.filter(f => f && f.trim()).length;
  const pct = Math.round(filled / fields.length * 100);
  const bar = document.getElementById('form-progress-bar');
  const lbl = document.getElementById('progress-label-text');
  const pctEl = document.getElementById('progress-pct');
  const wrap = document.getElementById('nav-progress-wrap');
  if(bar){ bar.style.width = pct + '%'; }
  if(pctEl){ pctEl.textContent = pct + '%'; }
  if(lbl){
    if(pct === 0) lbl.textContent = 'Formulaire vide';
    else if(pct < 40) lbl.textContent = 'Données incomplètes';
    else if(pct < 80) lbl.textContent = 'En cours de remplissage…';
    else if(pct < 100) lbl.textContent = 'Presque complet';
    else lbl.textContent = '✓ Formulaire complet';
  }
  if(wrap){
    const onProtocolPage = document.getElementById('page-protocole')?.classList.contains('active');
    wrap.style.display = onProtocolPage ? '' : 'none';
  }
}

/* ============================================================
   KEYBOARD SHORTCUTS
============================================================ */
document.addEventListener('keydown', function(e){
  // Ctrl+P → Imprimer aperçu
  if(e.ctrlKey && e.key === 'p'){
    e.preventDefault();
    const apercuBtn = document.getElementById('apercu-print-btn');
    if(apercuBtn && !apercuBtn.disabled){
      printFromApercu();
      showToast('🖨 Impression lancée…', 'info');
    } else {
      showToast('⚠ Remplissez d\'abord les données patient et choisissez un protocole.', 'error');
    }
  }
  // Ctrl+S → Sauvegarder
  if(e.ctrlKey && e.key === 's'){
    e.preventDefault();
    const btn = document.getElementById('btn-save');
    if(btn && !btn.disabled){
      saveToHistory();
      showToast('💾 Protocole sauvegardé !', 'success');
    }
  }
  // Ctrl+Z → Aller à la page protocole
  if(e.ctrlKey && e.key === 'z' && !e.shiftKey){
    // Esc → fermer modal
  }
  // Escape → fermer modal
  if(e.key === 'Escape'){
    const modal = document.getElementById('hist-modal');
    if(modal && modal.classList.contains('open')) closeModal();
  }
});

/* ============================================================
   PATCH: update() intercept for progress
============================================================ */
const _origUpdate = update;
window.update = function(){
  _origUpdate();
  updateProgress();
};

/* ============================================================
   PATCH: saveToHistory with toast
============================================================ */
const _origSave = saveToHistory;
window.saveToHistory = function(){
  _origSave();
  updateProgress();
};

/* ============================================================
   PATCH: showPage for progress visibility
============================================================ */
const _origShowPage = showPage;
window.showPage = function(id, btn){
  _origShowPage(id, btn);
  updateProgress();
};

/* ============================================================
   INIT
============================================================ */
// Restore dark mode preference
if(localStorage.getItem('chncak_dark') === '1'){
  document.body.classList.add('dark-mode');
  const btn = document.getElementById('dark-btn');
  if(btn) btn.textContent = 'â˜€ï¸';
}

// Set today's date if empty
const dpEl = document.getElementById('date-protocole');
if(dpEl && !dpEl.value){
  dpEl.value = new Date().toISOString().split('T')[0];
}

renderProtos();
populateMedecinSelect();
renderHistory();
updateProgress();



// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FONCTIONS OK CHIMIO
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function getOkChimio() {
  return JSON.parse(localStorage.getItem('chncak_protocols') || '[]');
}

function saveOkChimio(data) {
  localStorage.setItem('chncak_protocols', JSON.stringify(data));
}

function renderOkChimio() {
  const list = getOkChimio();
  const enAttente = list.filter(x => x.statut === 'En attente');
  const valides = list.filter(x => x.statut === 'Validé');
  const refuses = list.filter(x => x.statut === 'Refusé');
  
  document.getElementById('okchimio-stats').innerHTML = `
    <div style="text-align:center;padding:12px;background:#FFF3DC;border-radius:4px">
      <div style="font-size:24px;font-weight:700;color:#E67E22">${enAttente.length}</div>
      <div style="font-size:10px;color:#888">EN ATTENTE</div>
    </div>
    <div style="text-align:center;padding:12px;background:#E4F5ED;border-radius:4px">
      <div style="font-size:24px;font-weight:700;color:#0B5E3C">${valides.length}</div>
      <div style="font-size:10px;color:#888">VALIDÉS</div>
    </div>
    <div style="text-align:center;padding:12px;background:#FDEAEA;border-radius:4px">
      <div style="font-size:24px;font-weight:700;color:#E74C3C">${refuses.length}</div>
      <div style="font-size:10px;color:#888">REFUSÉS</div>
    </div>
  `;
  
  if (!enAttente.length) {
    document.getElementById('okchimio-list').innerHTML = '<div style="text-align:center;padding:40px;color:#888"><div style="font-size:48px">✅</div><div>Aucun protocole en attente</div></div>';
    return;
  }
  
  document.getElementById('okchimio-list').innerHTML = `
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#f5f5f5">
          <th style="padding:10px;text-align:left">Date</th>
          <th style="padding:10px;text-align:left">Patient</th>
          <th style="padding:10px;text-align:left">Dossier</th>
          <th style="padding:10px;text-align:left">Protocole</th>
          <th style="padding:10px;text-align:center">Cure</th>
          <th style="padding:10px;text-align:left">Médecin</th>
          <th style="padding:10px;text-align:center">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${enAttente.map(e => `
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:10px">${new Date(e.date).toLocaleDateString('fr-FR')}</td>
            <td style="padding:10px;font-weight:600">${e.patient.prenom} ${e.patient.nom}</td>
            <td style="padding:10px">${e.patient.dossier || '—'}</td>
            <td style="padding:10px"><span style="background:#EEF4FD;color:#0A3D7A;padding:4px 8px;border-radius:4px">${e.protocole}</span></td>
            <td style="padding:10px;text-align:center">C${e.cure}</td>
            <td style="padding:10px">${e.medecin}</td>
            <td style="padding:10px;text-align:center">
              <button onclick="previewProtocol(${e.id})" style="background:#2196F3;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;margin-right:4px">👁 Aperçu</button>
              <button onclick="refuserOkChimio(${e.id})" style="background:#E74C3C;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;margin-right:4px">✕ Refuser</button>
              <button onclick="validerOkChimio(${e.id})" style="background:#27AE60;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;margin-right:4px">✓ Valider</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function validerOkChimio(id) {
  const list = getOkChimio();
  const idx = list.findIndex(l => l.id === id);
  if (idx === -1) return;
  list[idx].statut = 'Validé';
  list[idx].dateValidation = new Date().toISOString();
  saveOkChimio(list);
  alert('✅ Protocole validé');
  renderOkChimio();

  // Envoyer notification email
  notifyProtocolValidation(id);
}

function refuserOkChimio(id) {
  const motif = prompt('Motif du refus :');
  if (!motif) return;
  const list = getOkChimio();
  const idx = list.findIndex(l => l.id === id);
  if (idx === -1) return;
  list[idx].statut = 'Refusé';
  list[idx].motifRefus = motif;
  saveOkChimio(list);
  alert('X Protocole refusé');
  renderOkChimio();
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FONCTIONS ARCHIVE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function getHistorique() {
  return JSON.parse(localStorage.getItem('chncak_historique') || '[]');
}

function renderArchive(){
  console.log('=== renderArchive appelée ===');
  const list = document.getElementById('archive-list');
  if(!list) {
    console.log('X Element archive-list NON TROUVÉ');
    return;
  }
  
  const patients = JSON.parse(localStorage.getItem('chncak_patients') || '[]');
  console.log('Total patients:', patients.length);
  patients.forEach(p => console.log(`  ${p.nom}: ${p.statut}`));
  
  const terminated = patients.filter(p => p.statut === 'Terminé' || p.statut === 'termine' || p.statut === 'Traité');
  console.log('Patients terminés:', terminated.length);
  
  if(terminated.length === 0){
    list.innerHTML = '<div style="text-align:center;padding:40px;color:#999;"><p style="font-size:16px;">📦 Aucun patient archivé</p><p style="font-size:13px;margin-top:8px;">Les patients marqués comme "Traité" apparaîtront ici</p></div>';
    return;
  }
  
  list.innerHTML = terminated.map(p=>{
    const hist = getHistorique().filter(h=>h.dossier===p.dossier);
    const cures = hist.length;
    const lastCure = hist.length > 0 ? hist[hist.length-1].date : 'N/A';
    
    return `
      <div style="background:white;border:1px solid #e0e0e0;border-radius:8px;padding:16px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:start;">
          <div>
            <h3 style="margin:0 0 8px 0;color:#0B5E3C;font-size:16px;">${p.prenom} ${p.nom}</h3>
            <div style="font-size:13px;color:#666;line-height:1.6;">
              <div><strong>Dossier:</strong> ${p.dossier}</div>
              <div><strong>Protocole:</strong> ${p.protocole || 'Non défini'}</div>
              <div><strong>Cures effectuées:</strong> ${cures}</div>
              <div><strong>Dernière cure:</strong> ${lastCure}</div>
              ${p.dateFin ? '<div><strong>Date fin:</strong> '+new Date(p.dateFin).toLocaleDateString('fr-FR')+'</div>' : ''}
            </div>
          </div>
          <div style="background:#E4F5ED;color:#0B5E3C;padding:6px 12px;border-radius:12px;font-size:12px;font-weight:600;">
            ✓ Terminé
          </div>
        </div>
      </div>
    `;
  }).join('');
}



// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FONCTION CHANGER STATUT PATIENT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function setStatut(patientId, statut) {
  const patients = JSON.parse(localStorage.getItem('chncak_patients') || '[]');
  const idx = patients.findIndex(p => p.id === patientId);
  
  if (idx === -1) {
    alert('Patient non trouvé');
    return;
  }
  
  patients[idx].statut = statut;
  
  if (statut === 'Traité') {
  // Archiver le patient
  const archivedPatients = JSON.parse(localStorage.getItem('chncak_archived_patients') || '[]');
  archivedPatients.push(patients[idx]);
  localStorage.setItem('chncak_archived_patients', JSON.stringify(archivedPatients));
    // Marquer date de fin
    patients[idx].dateFin = new Date().toISOString();
    
    // Calculer prochain RDV selon protocole
    const proto = (patients[idx].protocole || '').toUpperCase();
    let joursRdv = 21; // Par défaut 3 semaines
    
    if (proto.includes('FOLFOX') || proto.includes('FOLFIRI') || proto.includes('GEMOX')) {
      joursRdv = 14; // 2 semaines
    } else if (proto.includes('EC') || proto.includes('XELODA')) {
      joursRdv = 21; // 3 semaines
    } else if (proto.includes('TEM') || proto.includes('MVAC')) {
      joursRdv = 28; // 4 semaines
    }
    
    // Calculer date
    const nextRdv = new Date();
    nextRdv.setDate(nextRdv.getDate() + joursRdv);
    patients[idx].prochainRdv = nextRdv.toISOString().split('T')[0];
    
    console.log(`✓ Patient ${patients[idx].nom} traité - Prochain RDV: ${patients[idx].prochainRdv}`);
  }
  
  // Sauvegarder
  localStorage.setItem('chncak_patients', JSON.stringify(patients));
  
  // Rafraîchir affichages
  if (typeof renderProgramme === 'function') renderProgramme();
  if (typeof renderArchive === 'function') renderArchive();
  if (typeof renderPatients === 'function') renderPatients();
  
  alert(`✅ Statut mis à jour: ${statut}`);
}

