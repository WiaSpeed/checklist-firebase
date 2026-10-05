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

const list = document.querySelector('#taskList');
const template = document.querySelector('#taskTemplate');
const syncStatus = document.querySelector('#syncStatus');
const notice = document.querySelector('#notice');
const search = document.querySelector('#search');
const statusFilter = document.querySelector('#statusFilter');
const state = new Map();

if (!hasConfig) {
  notice.classList.remove('hidden');
  notice.textContent = "Mode démo : ajoutez votre configuration Firebase dans firebase-config.js pour enregistrer les données en ligne.";
  syncStatus.textContent = '● Mode démo';
}

function emptyData(task){return {id:task.id, title:task.title, category:task.category, responsible:'', date:'', status:'Non commencé', progress:0, actions:'', notes:''}}
function setBadge(card, status){
  const badge=card.querySelector('.status-badge'); badge.textContent=status;
  badge.className='status-badge '+(status==='Terminé'?'done':status==='En cours'?'progressing':'todo');
}
function collect(card, task){return {id:task.id,title:task.title,category:task.category,responsible:card.querySelector('.responsible').value.trim(),date:card.querySelector('.date').value,status:card.querySelector('.status').value,progress:Number(card.querySelector('.progress').value),actions:card.querySelector('.actions').value.trim(),notes:card.querySelector('.notes').value.trim()}}
function fill(card, data){
  card.querySelector('.responsible').value=data.responsible||''; card.querySelector('.date').value=data.date||''; card.querySelector('.status').value=data.status||'Non commencé'; card.querySelector('.progress').value=data.progress||0; card.querySelector('.progressValue').textContent=`${data.progress||0}%`; card.querySelector('.actions').value=data.actions||''; card.querySelector('.notes').value=data.notes||''; setBadge(card,data.status||'Non commencé');
}
function updateStats(){
  const values=[...state.values()]; const total=values.length; const done=values.filter(x=>x.status==='Terminé').length; const avg=total?Math.round(values.reduce((s,x)=>s+Number(x.progress||0),0)/total):0;
  document.querySelector('#statTotal').textContent=total; document.querySelector('#statDone').textContent=done; document.querySelector('#statProgress').textContent=`${avg}%`;
}
function applyFilters(){
  const q=search.value.toLowerCase().trim(), f=statusFilter.value;
  document.querySelectorAll('.task-card').forEach(card=>{const id=card.dataset.id,d=state.get(id);const text=(d.title+' '+d.category+' '+(d.responsible||'')).toLowerCase();card.style.display=((!q||text.includes(q))&&(f==='all'||d.status===f))?'':'none';});
}

async function loadData(task){
  if(!db) return emptyData(task);
  const snap=await getDoc(doc(db,'conferenceChecklist',task.id));
  return snap.exists()?{...emptyData(task),...snap.data()}:emptyData(task);
}
async function saveData(task, card){
  const data=collect(card,task); state.set(task.id,data); updateStats(); applyFilters();
  if(!db){card.querySelector('.saved-at').textContent='Mode démo — non enregistré';return;}
  const btn=card.querySelector('.saveBtn'); btn.disabled=true; btn.textContent='Enregistrement…'; syncStatus.textContent='● Synchronisation…';
  try{await setDoc(doc(db,'conferenceChecklist',task.id),{...data,updatedAt:serverTimestamp()},{merge:true});card.querySelector('.saved-at').textContent='Enregistré à '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});syncStatus.textContent='● Synchronisé';}
  catch(e){console.error(e);card.querySelector('.saved-at').textContent='Erreur d’enregistrement';syncStatus.textContent='● Erreur';alert("Impossible d'enregistrer. Vérifiez Firebase et les règles Firestore.");}
  finally{btn.disabled=false;btn.textContent='Enregistrer';}
}

async function render(){
  for(const task of tasks){
    const card=template.content.firstElementChild.cloneNode(true); card.dataset.id=task.id; card.querySelector('.task-category').textContent=task.category; card.querySelector('.task-title').textContent=task.title; list.appendChild(card);
    let data=emptyData(task); try{data=await loadData(task)}catch(e){console.error(e)} state.set(task.id,data); fill(card,data);
    card.querySelector('.progress').addEventListener('input',e=>{card.querySelector('.progressValue').textContent=e.target.value+'%'; const d=collect(card,task); state.set(task.id,d); updateStats();});
    card.querySelector('.status').addEventListener('change',e=>{setBadge(card,e.target.value);if(e.target.value==='Terminé'){card.querySelector('.progress').value=100;card.querySelector('.progressValue').textContent='100%'}const d=collect(card,task);state.set(task.id,d);updateStats();applyFilters();});
    card.querySelector('.saveBtn').addEventListener('click',()=>saveData(task,card));
  }
  updateStats();
}

search.addEventListener('input',applyFilters); statusFilter.addEventListener('change',applyFilters); document.querySelector('#resetBtn').addEventListener('click',()=>{search.value='';statusFilter.value='all';applyFilters()});
render();
