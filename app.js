import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js';

const tasks = [
  {id:'programme', category:'Programme', title:'Le programme de conférence'},
  {id:'participants-online', category:'Participants', title:'Liste des participants online'},
  {id:'participants-person', category:'Participants', title:'Liste participants in-person'},
  {id:'publicite-banderole', category:'Publicité', title:'Banderole'},
  {id:'publicite-rollup', category:'Publicité', title:'Roll-up'},
  {id:'couverture-media', category:'Communication', title:'Couverture médiatique'},
  {id:'hebergement-labo', category:'Hébergement', title:'Membre du Labo LISREG'},
  {id:'hebergement-comite', category:'Hébergement', title:"Comité d’organisation"},
  {id:'hebergement-intervenants', category:'Hébergement', title:'Intervenants'},
  {id:'hebergement-invite', category:'Hébergement', title:"Invité d’honneur"},
  {id:'deplacement-labo', category:'Déplacement', title:'Membre du labo'},
  {id:'deplacement-invites', category:'Déplacement', title:'Invités et intervenants'},
  {id:'fourniture-bloc', category:'Fourniture', title:'Bloc-notes'},
  {id:'fourniture-stylo', category:'Fourniture', title:'Stylo'},
  {id:'fourniture-cartable', category:'Fourniture', title:'Cartable'},
  {id:'restauration-cafe', category:'Restauration', title:'Pause-café'},
  {id:'restauration-dejeuner', category:'Restauration', title:'Déjeuner'},
  {id:'restauration-diner', category:'Restauration', title:'Dîner'},
  {id:'certificats-phd', category:'Certificats', title:'PhD students'},
  {id:'certificats-intervenants', category:'Certificats', title:'Intervenants'},
  {id:'certificats-organisation', category:'Certificats', title:"Comité d’organisation"},
  {id:'certificats-scientifique', category:'Certificats', title:'Comité scientifique'},
  {id:'certificats-reviewer', category:'Certificats', title:'Reviewer'},
  {id:'accueil', category:'Logistique', title:'Accueil et réception'},
  {id:'paiement', category:'Administration', title:'Payement et enregistrement'},
  {id:'publication', category:'Communication', title:'Publication'}
];

const hasConfig = firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('VOTRE_');
let db = null;
if (hasConfig) db = getFirestore(initializeApp(firebaseConfig));

const body = document.querySelector('#taskBody');
const template = document.querySelector('#rowTemplate');
const syncStatus = document.querySelector('#syncStatus');
const notice = document.querySelector('#notice');
const search = document.querySelector('#search');
const statusFilter = document.querySelector('#statusFilter');
const saveAllBtn = document.querySelector('#saveAllBtn');
const state = new Map();
const rows = new Map();
let saveTimer = null;

if (!hasConfig) {
  notice.classList.remove('hidden');
  notice.textContent = "Mode démo : ajoutez votre configuration Firebase dans firebase-config.js pour enregistrer les données en ligne.";
  syncStatus.textContent = '● Mode démo';
}

function emptyData(task) {
  return {id:task.id, title:task.title, category:task.category, responsible:'', date:'', status:'Non commencé', progress:0, actions:'', notes:''};
}

function setRowStatus(row, status) {
  row.dataset.status = status;
}

function collect(row, task) {
  const progress = Math.max(0, Math.min(100, Number(row.querySelector('.progress').value || 0)));
  return {
    id:task.id,
    title:task.title,
    category:task.category,
    responsible:row.querySelector('.responsible').value.trim(),
    date:row.querySelector('.date').value,
    status:row.querySelector('.status').value,
    progress,
    actions:row.querySelector('.actions').value.trim(),
    notes:row.querySelector('.notes').value.trim()
  };
}

function fill(row, data) {
  row.querySelector('.responsible').value = data.responsible || '';
  row.querySelector('.date').value = data.date || '';
  row.querySelector('.status').value = data.status || 'Non commencé';
  row.querySelector('.progress').value = Number(data.progress || 0);
  row.querySelector('.actions').value = data.actions || '';
  row.querySelector('.notes').value = data.notes || '';
  setRowStatus(row, data.status || 'Non commencé');
}

function updateStats() {
  const values = [...state.values()];
  const total = values.length;
  const done = values.filter(x => x.status === 'Terminé').length;
  const avg = total ? Math.round(values.reduce((s,x)=>s+Number(x.progress||0),0)/total) : 0;
  document.querySelector('#statTotal').textContent = total;
  document.querySelector('#statDone').textContent = done;
  document.querySelector('#statProgress').textContent = `${avg}%`;
}

function applyFilters() {
  const q = search.value.toLowerCase().trim();
  const f = statusFilter.value;
  rows.forEach((row,id) => {
    const d = state.get(id);
    const text = `${d.title} ${d.category} ${d.responsible||''} ${d.actions||''} ${d.notes||''}`.toLowerCase();
    row.style.display = ((!q || text.includes(q)) && (f === 'all' || d.status === f)) ? '' : 'none';
  });
}

async function loadData(task) {
  if (!db) return emptyData(task);
  const snap = await getDoc(doc(db,'conferenceChecklist',task.id));
  return snap.exists() ? {...emptyData(task), ...snap.data()} : emptyData(task);
}

async function saveData(task, row, silent=false) {
  const data = collect(row, task);
  state.set(task.id, data);
  updateStats();
  applyFilters();

  if (!db) {
    row.querySelector('.saved-at').textContent = 'Démo';
    return;
  }

  row.classList.add('saving');
  row.querySelector('.saved-at').textContent = '…';
  syncStatus.textContent = '● Synchronisation…';
  try {
    await setDoc(doc(db,'conferenceChecklist',task.id), {...data, updatedAt:serverTimestamp()}, {merge:true});
    row.querySelector('.saved-at').textContent = '✓';
    row.classList.remove('saving');
    row.classList.add('saved');
    setTimeout(()=>row.classList.remove('saved'), 900);
    if (!silent) syncStatus.textContent = '● Synchronisé';
  } catch (e) {
    console.error(e);
    row.querySelector('.saved-at').textContent = 'Erreur';
    row.classList.remove('saving');
    row.classList.add('save-error');
    syncStatus.textContent = '● Erreur';
    if (!silent) alert("Impossible d'enregistrer. Vérifiez Firebase et les règles Firestore.");
  }
}

function scheduleAutosave(task,row) {
  const data = collect(row, task);
  state.set(task.id, data);
  updateStats();
  applyFilters();
  row.querySelector('.saved-at').textContent = 'Modifié';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(()=>saveData(task,row,true), 900);
}

async function saveAll() {
  saveAllBtn.disabled = true;
  saveAllBtn.textContent = 'Enregistrement…';
  syncStatus.textContent = '● Synchronisation…';
  for (const task of tasks) {
    await saveData(task, rows.get(task.id), true);
  }
  syncStatus.textContent = '● Synchronisé';
  saveAllBtn.disabled = false;
  saveAllBtn.textContent = 'Enregistrer tout';
}

async function render() {
  for (const task of tasks) {
    const row = template.content.firstElementChild.cloneNode(true);
    row.dataset.id = task.id;
    row.querySelector('.task-category').textContent = task.category;
    row.querySelector('.task-title').textContent = task.title;
    body.appendChild(row);
    rows.set(task.id,row);

    let data = emptyData(task);
    try { data = await loadData(task); } catch(e) { console.error(e); }
    state.set(task.id,data);
    fill(row,data);

    row.querySelectorAll('input, textarea, select').forEach(el => {
      el.addEventListener('input', () => scheduleAutosave(task,row));
      el.addEventListener('change', () => {
        if (el.classList.contains('status')) {
          setRowStatus(row, el.value);
          if (el.value === 'Terminé') row.querySelector('.progress').value = 100;
        }
        scheduleAutosave(task,row);
      });
    });
  }
  updateStats();
}

search.addEventListener('input',applyFilters);
statusFilter.addEventListener('change',applyFilters);
saveAllBtn.addEventListener('click',saveAll);
document.querySelector('#resetBtn').addEventListener('click',()=>{search.value='';statusFilter.value='all';applyFilters();});
render();
