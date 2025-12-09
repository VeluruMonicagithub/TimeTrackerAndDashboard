// Main app logic using Firebase compat SDK (loaded via CDN/compat in index.html)
// Assumes `auth` and `db` globals from firebase.js
const $ = id => document.getElementById(id);
// UI elements
const authSection = $('auth-section');
const trackerSection = $('tracker-section');
const dashboardSection = $('dashboard-section');
// removed Google sign-in; email form shown by default
const emailForm = $('emailForm');
const emailSignIn = $('emailSignIn');
const emailInput = $('email');
const passwordInput = $('password');
const userArea = $('user-area');
const signOutBtn = $('signOutBtn');
const datePicker = $('datePicker');
const activityName = $('activityName');
const activityCategory = $('activityCategory');
const activityMinutes = $('activityMinutes');
const addActivity = $('addActivity');
const activitiesList = $('activitiesList');
const remainingEl = $('remaining');
const summaryEl = $('summary');
const analyseBtn = $('analyseBtn');
const dashDate = $('dashDate');
const noData = $('no-data');
const dashboardContent = $('dashboardContent');
const statTotalHours = $('statTotalHours');
const statCategories = $('statCategories');
const statActivities = $('statActivities');

let currentUser = null;
let currentDate = null; // YYYY-MM-DD
let activities = [];
let pieChart = null;
let barChart = null;

// Helpers
function formatDateISO(d) {
  const dt = new Date(d);
  const year = dt.getFullYear();
  const m = String(dt.getMonth()+1).padStart(2,'0');
  const day = String(dt.getDate()).padStart(2,'0');
  return `${year}-${m}-${day}`;
}

function show(el){ el.classList.remove('hidden'); }
function hide(el){ el.classList.add('hidden'); }

function enableAnalyseIfAllowed(){
  const total = activities.reduce((s,a)=>s+a.minutes,0);
  if (total>0 && total<=1440) {
    analyseBtn.disabled = false;
  } else {
    analyseBtn.disabled = true;
  }
}

function updateSummary(){
  const total = activities.reduce((s,a)=>s+a.minutes,0);
  summaryEl.textContent = `Total: ${total} min • ${activities.length} activities`;
  remainingEl.textContent = `You have ${Math.max(0,1440-total)} minutes left for this day`;
  enableAnalyseIfAllowed();
}

// Render activities list
function renderActivities(){
  activitiesList.innerHTML = '';
  activities.forEach(act => {
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
      <div class="activity-meta">
        <div class="title"><strong>${act.name}</strong><div class="muted">${act.category}</div></div>
      </div>
      <div class="row">
        <div class="muted">${act.minutes} min</div>
        <button class="btn" data-id="${act.id}" data-action="edit">Edit</button>
        <button class="btn" data-id="${act.id}" data-action="delete">Delete</button>
      </div>`;
    activitiesList.appendChild(item);
  });
}

// Firestore paths
function activitiesCollectionRef(uid, date){
  return db.collection('users').doc(uid).collection('days').doc(date).collection('activities');
}

// Load activities for date
async function loadActivitiesForDate(uid, date){
  activities = [];
  try{
    const snap = await activitiesCollectionRef(uid,date).orderBy('createdAt','asc').get();
    snap.forEach(doc=>{
      const data = doc.data();
      activities.push({ id: doc.id, name: data.name, category: data.category, minutes: data.minutes });
    });
  }catch(e){ console.error(e); }
  renderActivities();
  updateSummary();
}

// Add activity
async function addActivityToFirestore(uid, date, payload){
  const col = activitiesCollectionRef(uid,date);
  const docRef = await col.add({ ...payload, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  return docRef.id;
}

// Delete
async function deleteActivityFromFirestore(uid, date, id){
  const docRef = activitiesCollectionRef(uid,date).doc(id);
  await docRef.delete();
}

// Edit
async function updateActivityInFirestore(uid, date, id, payload){
  const docRef = activitiesCollectionRef(uid,date).doc(id);
  await docRef.update(payload);
}

// UI Events
emailSignIn.addEventListener('click', async (ev)=>{
  ev.preventDefault();
  const email = emailInput.value.trim();
  const pw = passwordInput.value;
  if (!email || !pw) return alert('Enter email and password');

  try{
    // Try to create a new account first. If the email is already in use, we'll fall back to signing in.
    await auth.createUserWithEmailAndPassword(email, pw);
    // On success the onAuthStateChanged listener will handle navigation to the home/tracker view.
  } catch (createErr) {
    if (createErr && createErr.code === 'auth/email-already-in-use'){
      // Account exists — try signing in
      try{
        await auth.signInWithEmailAndPassword(email, pw);
      } catch (signInErr) {
        if (signInErr && signInErr.code === 'auth/wrong-password'){
          alert('Incorrect password. Use "Forgot password" to reset it.');
        } else {
          alert(signInErr.message || 'Sign-in failed');
        }
      }
    } else {
      // Other create errors (invalid email, weak password, etc.)
      alert(createErr.message || 'Registration failed');
    }
  }
});

signOutBtn.addEventListener('click', ()=>auth.signOut());

// Add activity
addActivity.addEventListener('click', async ()=>{
  const name = activityName.value.trim();
  const category = activityCategory.value;
  const minutes = Number(activityMinutes.value);
  if (!name || !minutes || minutes <= 0) return alert('Enter valid name and minutes');
  const total = activities.reduce((s,a)=>s+a.minutes,0) + minutes;
  if (total > 1440) return alert('Total minutes exceed 1440 for the day');
  try{
    const id = await addActivityToFirestore(currentUser.uid, currentDate, { name, category, minutes });
    activities.push({ id, name, category, minutes });
    renderActivities(); updateSummary();
    activityName.value = ''; activityMinutes.value = '';
  }catch(e){ console.error(e); alert('Failed to add'); }
});

// Delegate edit/delete
activitiesList.addEventListener('click', async (e)=>{
  const btn = e.target.closest('button'); if(!btn) return;
  const id = btn.dataset.id; const action = btn.dataset.action;
  const uid = currentUser.uid;
  if (action === 'delete'){
    if (!confirm('Delete this activity?')) return;
    await deleteActivityFromFirestore(uid,currentDate,id);
    activities = activities.filter(a=>a.id!==id);
    renderActivities(); updateSummary();
  } else if (action === 'edit'){
    const act = activities.find(a=>a.id===id);
    const newName = prompt('Activity name', act.name);
    const newMin = Number(prompt('Minutes', act.minutes));
    if (!newName || !newMin) return;
    const otherTotal = activities.filter(a=>a.id!==id).reduce((s,a)=>s+a.minutes,0) + newMin;
    if (otherTotal > 1440) return alert('Total minutes exceed 1440');
    await updateActivityInFirestore(uid,currentDate,id, { name:newName, minutes:newMin });
    act.name = newName; act.minutes = newMin;
    renderActivities(); updateSummary();
  }
});

// Analyse
analyseBtn.addEventListener('click', ()=>{
  show(dashboardSection); hide(trackerSection); dashDate.textContent = currentDate;
  renderDashboard();
});

// Render dashboard
function aggregateByCategory(){
  const map = {};
  activities.forEach(a=>{ map[a.category] = (map[a.category]||0) + a.minutes; });
  return Object.entries(map).map(([k,v])=>({category:k,minutes:v}));
}

function renderDashboard(){
  if (activities.length===0){ show(noData); hide(dashboardContent); return; }
  hide(noData); show(dashboardContent);
  const totalMin = activities.reduce((s,a)=>s+a.minutes,0);
  statTotalHours.textContent = `${(totalMin/60).toFixed(1)}h`;
  statActivities.textContent = `${activities.length}`;
  const categories = aggregateByCategory();
  statCategories.textContent = `${categories.length}`;

  const labels = categories.map(c=>c.category);
  const data = categories.map(c=>c.minutes);

  // Pie
  const pieCtx = document.getElementById('pieChart').getContext('2d');
  if (pieChart) pieChart.destroy();
  pieChart = new Chart(pieCtx,{ type:'pie', data:{labels, datasets:[{data, backgroundColor:labels.map((_,i)=>['#60a5fa','#6ee7b7','#fca5a5','#fbbf24','#c084fc','#fde68a'][i%6])}]}, options:{responsive:true}});

  // Bar
  const barCtx = document.getElementById('barChart').getContext('2d');
  if (barChart) barChart.destroy();
  barChart = new Chart(barCtx,{ type:'bar', data:{labels, datasets:[{label:'Minutes',data,backgroundColor:'#60a5fa'}]}, options:{responsive:true, scales:{y:{beginAtZero:true}}}});
}

// Date picker change
datePicker.addEventListener('change', async ()=>{
  if (!currentUser) return;
  currentDate = datePicker.value;
  await loadActivitiesForDate(currentUser.uid, currentDate);
});

// Auth state
auth.onAuthStateChanged(async (user)=>{
  currentUser = user;
  if (user){
    hide(authSection); show(trackerSection);
    // UI user area
    userArea.innerHTML = `<div class="user-avatar"><img src="${user.photoURL||'https://via.placeholder.com/40'}"/></div><div>${user.displayName||user.email}</div>`;
    // Set default date to today
    const today = formatDateISO(new Date());
    datePicker.value = today; currentDate = today;
    await loadActivitiesForDate(user.uid, today);
  } else {
    show(authSection); hide(trackerSection); hide(dashboardSection);
    userArea.innerHTML = '';
  }
});

// Small improvement: realtime listener for activity changes for active date
let activeUnsubscribe = null;
function attachRealtimeListener(uid,date){
  if (activeUnsubscribe) activeUnsubscribe();
  activeUnsubscribe = activitiesCollectionRef(uid,date).orderBy('createdAt','asc').onSnapshot(snapshot=>{
    activities = [];
    snapshot.forEach(doc=>{ const d = doc.data(); activities.push({ id:doc.id, name:d.name, category:d.category, minutes:d.minutes }); });
    renderActivities(); updateSummary();
  });
}

// Use realtime if possible
datePicker.addEventListener('change', ()=>{ if (currentUser && currentDate){ attachRealtimeListener(currentUser.uid,currentDate); } });

// Initialize a minimal check for Firebase
if (!window.firebase || !window.auth || !window.db){ console.warn('Firebase not fully initialized. Replace config in firebase.js and include compat SDK scripts in index.html if needed.'); }
