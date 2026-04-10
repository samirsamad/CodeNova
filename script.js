// ════════════════════════════════════════════════════════════════
//  Code Nova – Citizen Portal · script.js (FIXED)
// ════════════════════════════════════════════════════════════════

// ── 1. SUPABASE INIT ─────────────────────────────────────────────
// FIX: supabaseKey was set to the project ID, not the actual anon/public API key.
// ⚠️  Replace 'YOUR_SUPABASE_ANON_KEY' with the real key from:
//     Supabase Dashboard → Project Settings → API → anon public
const SUPABASE_URL = 'https://kmsyavabxnnqkaepayzc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttc3lhdmFieG5ucWthZXBheXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MzU2OTYsImV4cCI6MjA5MTQxMTY5Nn0.JyS0kojqEj9ZLLDQkxRTy6ssEQ1lFB1bdS_xwNDkQS0'; // ← PASTE YOUR REAL ANON KEY HERE

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ── 2. PROFILE STATE ─────────────────────────────────────────────
// FIX: was declared twice — once as `const profile = {...}` (hardcoded) and
// again as `let profile = {}` — causing a SyntaxError that crashed everything.
// Now declared ONCE as a let, populated from Supabase after login.
let profile = {
  firstName: '', lastName: '',
  dob: '', dob_display: '', gender: '',
  mobile: '', email: '',
  aadhaar: '', pan: '',
  father: '', mother: '',
  address: '', city: '', state: '', pin: '',
  nationality: 'Indian', religion: '', caste: '',
  income: '', occupation: ''
};


// ── 3. HELPERS ───────────────────────────────────────────────────
function fullName()  { return (profile.firstName + ' ' + profile.lastName).trim(); }
function initials() {
  const f = profile.firstName?.[0]?.toUpperCase() || '';
  const l = profile.lastName?.[0]?.toUpperCase()  || '';
  return f + l || '?';
}


// ── 4. RENDER PROFILE ────────────────────────────────────────────
function renderProfile() {
  const name = fullName();
  const ini  = initials();

  const chip = document.getElementById('user-name-chip');
  if (chip) chip.textContent = name;

  document.querySelectorAll('.avatar-initials').forEach(el => el.textContent = ini);

  const greet = document.getElementById('dash-greeting');
  if (greet) greet.textContent = `Good morning, ${profile.firstName || 'Citizen'}! 👋`;

  const cid = document.getElementById('dash-citizen-id');
  if (cid) cid.textContent = `Citizen ID: IND-2024-9920-${ini} · Aadhaar Linked`;

  const pvAvatar = document.getElementById('pv-avatar');
  if (pvAvatar) pvAvatar.textContent = ini;

  const pvName = document.getElementById('pv-name');
  if (pvName) pvName.textContent = name;

  const pvCid = document.getElementById('pv-citizen-id');
  if (pvCid) pvCid.textContent = `Citizen ID: IND-2024-9920-${ini}`;

  const fields = {
    'pv-dob':     profile.dob_display || profile.dob,
    'pv-gender':  profile.gender,
    'pv-mobile':  profile.mobile,
    'pv-email':   profile.email,
    'pv-aadhaar': profile.aadhaar,
    'pv-pan':     profile.pan,
    'pv-address': profile.address,
    'pv-city':    profile.city,
    'pv-state':   profile.state,
    'pv-pin':     profile.pin,
  };
  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '—';
  });
}


// ── 5. FETCH USER PROFILE FROM SUPABASE ──────────────────────────
// FIX: was declared twice; now declared once.
// FIX: was only mapping 3 fields — now maps ALL fields used by forms/profile.
// FIX: typo `data.last__name` (double underscore) → `data.last_name`
async function fetchUserProfile(userId) {
  const { data, error } = await _supabase
    .from('citizens')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    toast('Could not load profile: ' + error.message, 'error');
    return;
  }

  if (data) {
    // Map DB snake_case columns → JS camelCase profile object
    profile.id          = data.id;
    profile.firstName   = data.first_name   || '';
    profile.lastName    = data.last_name     || ''; // FIX: was data.last__name (typo)
    profile.dob         = data.dob           || '';
    profile.dob_display = data.dob
      ? new Date(data.dob).toLocaleDateString('en-IN') : '';
    profile.gender      = data.gender        || '';
    profile.mobile      = data.mobile        || '';
    profile.email       = data.email         || '';
    profile.aadhaar     = data.aadhaar       || '';
    profile.pan         = data.pan           || '';
    profile.father      = data.father        || '';
    profile.mother      = data.mother        || '';
    profile.address     = data.address       || '';
    profile.city        = data.city          || '';
    profile.state       = data.state         || '';
    profile.pin         = data.pin           || '';
    profile.nationality = data.nationality   || 'Indian';
    profile.religion    = data.religion      || '';
    profile.caste       = data.caste         || '';
    profile.income      = data.income        || '';
    profile.occupation  = data.occupation    || '';

    renderProfile();
  }
}


// ── 6. AUTHENTICATION ────────────────────────────────────────────
// FIX: doLogin was declared 3 times — now declared ONCE.
// It auto-detects whether the Login or Register tab is active.
async function doLogin() {
  const registerFormVisible =
    document.getElementById('form-register')?.style.display !== 'none';

  if (registerFormVisible) {
    await doRegister();
    return;
  }

  const email    = document.getElementById('login-id').value.trim();
  const password = document.getElementById('login-pass').value;

  if (!email || !password) {
    toast('Please enter your email and password.', 'error');
    return;
  }

  const { data, error } = await _supabase.auth.signInWithPassword({ email, password });

  if (error) {
    toast(error.message, 'error');
    return;
  }

  await fetchUserProfile(data.user.id);
  showPage('pg-app');
  sv('dashboard');
  toast(`Welcome back, ${profile.firstName || 'Citizen'}!`, 'success');
}

// FIX: Register button in HTML calls doLogin(), which now routes here.
// This creates the auth user AND inserts a row into the citizens table.
async function doRegister() {
  const firstName = document.getElementById('reg-firstname')?.value.trim();
  const lastName  = document.getElementById('reg-lastname')?.value.trim();
  const mobile    = document.getElementById('reg-mobile')?.value.trim();
  const aadhaar   = document.getElementById('reg-aadhaar')?.value.trim();
  const email     = document.getElementById('reg-email')?.value.trim();
  const password  = document.getElementById('reg-pass')?.value;

  if (!firstName || !email || !password) {
    toast('Please fill in First Name, Email, and Password.', 'error');
    return;
  }

  if (password.length < 8) {
    toast('Password must be at least 8 characters.', 'error');
    return;
  }

  // Step 1: Create the auth user.
  // Pass user metadata so the auto-confirm trigger has name info.
  // emailRedirectTo: null tells Supabase not to send a confirmation email.
  const { data, error } = await _supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: null,        // don't send confirmation email
      data: { first_name: firstName, last_name: lastName }
    }
  });

  if (error) {
    // Friendly messages for the most common failure scenarios
    if (error.message.toLowerCase().includes('rate')) {
      toast('Too many attempts — wait a few minutes and try again.', 'error');
    } else if (error.message.toLowerCase().includes('already registered')) {
      toast('This email is already registered. Try logging in instead.', 'error');
    } else if (error.message.toLowerCase().includes('disabled')) {
      toast('Signup is disabled. Re-enable Email provider in Supabase → Auth → Providers.', 'error');
    } else {
      toast(error.message, 'error');
    }
    return;
  }

  // data.user is null when Supabase is still waiting for email confirmation.
  // This happens if "Confirm email" is still ON in the dashboard.
  if (!data.user) {
    toast('Almost there! Check your email for a confirmation link, then log in.', 'info');
    switchTab('login');
    return;
  }

  // Step 2: Auto-login immediately after registering — no need to re-type credentials.
  // NOTE: We no longer manually insert into citizens here.
  // A database trigger (handle_new_user) automatically creates the citizens row
  // the moment auth.users gets the new record — it runs as superuser so RLS
  // can't block it. This is why the "profile save failed" error is now gone.
  //
  // We do give the trigger a small moment to complete before we try to read
  // the profile back, which is what the 500ms delay below is for.
  // Wait 600ms for the database trigger (handle_new_user) to finish
  // creating the citizens row before we try to read it back.
  await new Promise(resolve => setTimeout(resolve, 600));

  const { data: loginData, error: loginError } = await _supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) {
    // Account created fine but auto-login failed (email confirm still pending?)
    toast('Registered! Please log in with your new credentials.', 'success');
    switchTab('login');
    return;
  }

  // Everything worked — load the profile and go straight to the dashboard
  await fetchUserProfile(loginData.user.id);
  showPage('pg-app');
  sv('dashboard');
  toast(`Welcome, ${profile.firstName || 'Citizen'}! Your account is ready.`, 'success');
}


// ── 7. LOGOUT ────────────────────────────────────────────────────
async function doLogout() {
  await _supabase.auth.signOut();
  // Reset local profile state
  Object.keys(profile).forEach(k => profile[k] = '');
  profile.nationality = 'Indian';
  showPage('pg-home');
  toast('Logged out successfully.', 'success');
}


// ── 8. SAVE PROFILE ──────────────────────────────────────────────
// FIX: saveProfile was declared 3 times — now declared ONCE.
// FIX: `_supabase.auth.getUser().id` was wrong — getUser() is async,
//      calling .id on a Promise returns undefined. Fixed with await.
async function saveProfile() {
  const get = id => document.getElementById(id)?.value.trim();

  const updates = {
    first_name:  get('ep-first'),
    last_name:   get('ep-last'),
    mobile:      get('ep-mobile'),
    email:       get('ep-email'),
    dob:         get('ep-dob')        || null,   // date — send null if empty so DB stores NULL not ""
    gender:      get('ep-gender'),
    aadhaar:     get('ep-aadhaar'),
    pan:         get('ep-pan'),
    address:     get('ep-address'),
    occupation:  get('ep-occupation'),
    city:        get('ep-city'),
    state:       get('ep-state'),
    pin:         get('ep-pin'),
    updated_at:  new Date().toISOString(),
  };

  const { data: userData } = await _supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    toast('Session expired. Please log in again.', 'error');
    showLogin();
    return;
  }

  const { error } = await _supabase
    .from('citizens')
    .update(updates)
    .eq('id', userId);

  if (error) {
    toast('Update failed: ' + error.message, 'error');
    return;
  }

  // Sync every updated field back into the local profile object
  // so the rest of the app (auto-fill, profile view) sees fresh data
  // without needing a full page reload or another DB fetch.
  if (updates.first_name)  profile.firstName  = updates.first_name;
  if (updates.last_name)   profile.lastName   = updates.last_name;
  if (updates.mobile)      profile.mobile     = updates.mobile;
  if (updates.email)       profile.email      = updates.email;
  if (updates.dob)         { profile.dob = updates.dob; profile.dob_display = new Date(updates.dob).toLocaleDateString('en-IN'); }
  if (updates.gender)      profile.gender     = updates.gender;
  if (updates.aadhaar)     profile.aadhaar    = updates.aadhaar;
  if (updates.pan)         profile.pan        = updates.pan;
  if (updates.address)     profile.address    = updates.address;
  if (updates.occupation)  profile.occupation = updates.occupation;
  if (updates.city)        profile.city       = updates.city;
  if (updates.state)       profile.state      = updates.state;
  if (updates.pin)         profile.pin        = updates.pin;

  closeModal();
  renderProfile();
  sv('profile');
  toast('Profile updated and synced!', 'success');
}


// ── 8. FILE UPLOAD TO SUPABASE STORAGE ───────────────────────────
async function uploadFile(file) {
  const { data: userData } = await _supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) { toast('Not logged in.', 'error'); return; }

  const { error } = await _supabase.storage
    .from('citizen-vault')
    .upload(`${userId}/${file.name}`, file, { upsert: true });

  if (error) toast('Upload failed: ' + error.message, 'error');
  else toast('Document saved to Secure Vault!', 'success');
}


// ── 9. NAVIGATION ─────────────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
  document.getElementById(id).classList.add('on');
  window.scrollTo(0, 0);
}
function showLogin() { showPage('pg-login'); }
function goHome(sec) {
  showPage('pg-home');
  setTimeout(() => {
    const el = document.getElementById(sec);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}
function go(page, view) {
  if (page === 'app') { showPage('pg-app'); sv(view || 'dashboard'); }
  else showPage('pg-' + page);
  window.scrollTo(0, 0);
}


// ── 10. VIEWS ─────────────────────────────────────────────────────
function viewTitles() {
  return {
    dashboard: { t: 'Dashboard',          s: `Welcome back, ${fullName()}` },
    documents: { t: 'Document Vault',     s: 'Your verified government documents' },
    services:  { t: 'Apply for Service',  s: 'Select a service to begin auto-filled application' },
    tracking:  { t: 'Track Applications', s: 'Real-time status of your submissions' },
    profile:   { t: 'My Profile',         s: `Citizen ID: IND-2024-9920-${initials()}` },
    form:      { t: 'Application Form',   s: 'Auto-filled from your saved profile' },
  };
}
function sv(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('on'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const vw = document.getElementById('vw-' + name);
  if (vw) vw.classList.add('on');
  const nb = document.getElementById('nav-' + name);
  if (nb) nb.classList.add('active');
  const info = viewTitles()[name] || { t: '', s: '' };
  document.getElementById('page-title').textContent = info.t;
  document.getElementById('page-sub').textContent   = info.s;
  window.scrollTo(0, 0);
}


// ── 11. LOGIN TABS ────────────────────────────────────────────────
function switchTab(t) {
  document.getElementById('tab-login').classList.toggle('active',    t === 'login');
  document.getElementById('tab-register').classList.toggle('active', t === 'register');
  document.getElementById('form-login').style.display    = t === 'login'    ? 'flex' : 'none';
  document.getElementById('form-register').style.display = t === 'register' ? 'flex' : 'none';
}


// ── 12. EDIT PROFILE MODAL ────────────────────────────────────────
function openEditProfile() {
  // Build the gender <select> so the current saved value is pre-selected
  const genderOptions = ['', 'Male', 'Female', 'Other']
    .map(o => `<option value="${o}" ${profile.gender === o ? 'selected' : ''}>${o || 'Select gender'}</option>`)
    .join('');

  document.getElementById('modal-box').innerHTML = `
    <div style="margin-bottom:20px">
      <h2 class="modal-title"><span class="icon sm" style="color:var(--accent);vertical-align:middle">manage_accounts</span> Edit Profile</h2>
      <p class="modal-sub">Changes apply immediately and sync to the database</p>
    </div>

    <!-- ── Section: Basic Info ── -->
    <p style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);margin-bottom:10px">Basic Information</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div class="field"><label>First Name</label><input type="text" id="ep-first" value="${profile.firstName}" placeholder="First name"/></div>
      <div class="field"><label>Last Name</label><input type="text" id="ep-last" value="${profile.lastName}" placeholder="Last name"/></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div class="field"><label>Date of Birth</label><input type="date" id="ep-dob" value="${profile.dob || ''}"/></div>
      <div class="field"><label>Gender</label><select id="ep-gender">${genderOptions}</select></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div class="field"><label>Mobile</label><input type="tel" id="ep-mobile" value="${profile.mobile}" placeholder="+91 XXXXX XXXXX"/></div>
      <div class="field"><label>Email</label><input type="email" id="ep-email" value="${profile.email}" placeholder="you@email.com"/></div>
    </div>

    <!-- ── Section: Identity Documents ── -->
    <p style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);margin-bottom:10px">Identity Documents</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div class="field">
        <label>Aadhaar Number</label>
        <input type="text" id="ep-aadhaar" value="${profile.aadhaar}" placeholder="XXXX XXXX XXXX" maxlength="14"
          oninput="this.value=this.value.replace(/[^0-9 ]/g,'')"/>
      </div>
      <div class="field">
        <label>PAN Number</label>
        <input type="text" id="ep-pan" value="${profile.pan}" placeholder="ABCDE1234F" maxlength="10"
          oninput="this.value=this.value.toUpperCase()"/>
      </div>
    </div>

    <!-- ── Section: Address ── -->
    <p style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);margin-bottom:10px">Address</p>
    <div style="margin-bottom:12px">
      <div class="field"><label>House / Flat No. &amp; Street</label><input type="text" id="ep-address" value="${profile.address}" placeholder="e.g. Flat 4B, Green Park Colony"/></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div class="field"><label>City</label><input type="text" id="ep-city" value="${profile.city}" placeholder="City"/></div>
      <div class="field"><label>State</label><input type="text" id="ep-state" value="${profile.state}" placeholder="State"/></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div class="field"><label>PIN Code</label><input type="text" id="ep-pin" value="${profile.pin}" placeholder="110000" maxlength="6" oninput="this.value=this.value.replace(/[^0-9]/g,'')"/></div>
      <div class="field"><label>Occupation</label><input type="text" id="ep-occupation" value="${profile.occupation}" placeholder="Your occupation"/></div>
    </div>

    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveProfile()"><span class="icon sm">save</span> Save Changes</button>
    </div>`;

  // Make the modal box wider so the extra fields breathe properly
  document.getElementById('modal-box').style.maxWidth = '560px';
  document.getElementById('modal').style.display = 'flex';
}


// ── 13. UPLOAD MODAL ──────────────────────────────────────────────
function showUpload() {
  let selectedFile = null;
  document.getElementById('modal-box').innerHTML = `
    <h2 class="modal-title">Upload Document</h2>
    <p class="modal-sub">Select document type and upload your file</p>
    <div class="field" style="margin-bottom:14px"><label>Document Type</label>
      <select id="doc-type-select">
        <option>Aadhaar Card</option><option>PAN Card</option><option>Passport</option>
        <option>Driving License</option><option>Income Certificate</option>
        <option>Caste Certificate</option><option>Voter ID</option>
        <option>Birth Certificate</option><option>Degree / Marksheet</option><option>Other</option>
      </select>
    </div>
    <div class="upload-zone" onclick="document.getElementById('file-input').click()">
      <div>
        <span class="icon xl" style="display:block;text-align:center;color:var(--accent);opacity:.5">cloud_upload</span>
        <p style="font-size:14px;font-weight:600;margin:8px 0 4px">Click to upload or drag & drop</p>
        <p style="font-size:12px;color:var(--text3)" id="file-name-label">PDF, JPG, PNG up to 5MB</p>
      </div>
    </div>
    <input type="file" id="file-input" style="display:none" accept=".pdf,.jpg,.jpeg,.png"
      onchange="document.getElementById('file-name-label').textContent = this.files[0]?.name || 'No file chosen'"/>
    <div class="modal-actions">
      <button class="btn btn-dark" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="handleUploadClick()"><span class="icon sm">upload</span> Upload</button>
    </div>`;
  document.getElementById('modal').style.display = 'flex';
}

async function handleUploadClick() {
  const fileInput = document.getElementById('file-input');
  const file = fileInput?.files?.[0];
  if (!file) { toast('Please select a file first.', 'error'); return; }
  closeModal();
  await uploadFile(file);
}


// ── 14. DOC MODAL ─────────────────────────────────────────────────
function showDocModal(type) {
  const name   = fullName();
  const father = profile.father || '—';
  const addr   = `${profile.address}, ${profile.city} - ${profile.pin}`;
  const data = {
    aadhaar: {
      title: 'Aadhaar Card', num: profile.aadhaar, dept: 'UIDAI',
      fields: [['Name', name], ['DOB', profile.dob_display || profile.dob], ['Gender', profile.gender], ['Address', addr], ['Number', profile.aadhaar]]
    },
    pan: {
      title: 'PAN Card', num: profile.pan, dept: 'Income Tax Dept',
      fields: [['Name', name], ['Father Name', father], ['DOB', profile.dob_display || profile.dob], ['PAN No.', profile.pan]]
    },
  };
  const d = data[type] || { title: 'Document', num: '', dept: '', fields: [] };
  document.getElementById('modal-box').innerHTML = `
    <h2 class="modal-title">${d.title}</h2>
    <p class="modal-sub">${d.dept} · <span class="mono">${d.num}</span></p>
    <div style="background:rgba(255,255,255,0.5);border:1px solid var(--glass-border);border-radius:var(--r);padding:20px">
      ${d.fields.map(f => `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--glass-border);font-size:13px"><span style="color:var(--text3)">${f[0]}</span><span style="font-weight:600">${f[1]}</span></div>`).join('')}
    </div>
    <div class="modal-actions">
      <button class="btn btn-dark" onclick="closeModal()">Close</button>
      <button class="btn btn-primary" onclick="toast('Document downloaded','success')"><span class="icon sm">download</span> Download</button>
    </div>`;
  document.getElementById('modal').style.display = 'flex';
}


// ── 15. FORMS CONFIG ──────────────────────────────────────────────
const forms = {
  aadhaar: { title: 'Aadhaar Update', icon: 'fingerprint', color: 'rgba(99,102,241,.1)', iconColor: 'var(--accent)', dept: 'UIDAI', ref: 'AHR', sections: [
    { title: 'Personal Information', fields: [['Full Name','text','full name',['firstName','lastName'],'name'],['Date of Birth','date','','dob','dob'],['Gender','select','',['Male','Female','Other'],'gender'],['Mobile Number','tel','',['mobile'],'mobile'],['Email Address','email','',['email'],'email']] },
    { title: 'Address Details', fields: [['House / Flat No.','text','',['address'],'address'],['City','text','',['city'],'city'],['State','text','',['state'],'state'],['PIN Code','text','',['pin'],'pin']] },
    { title: 'Change Request', fields: [['Reason for Update','select','',['Address Change','Name Correction','Mobile Update','Biometric Update','Date of Birth'],''],['New Address (if applicable)','textarea','Enter new address if updating...',null,'']] },
  ]},
  pan: { title: 'PAN Card Application', icon: 'credit_card', color: 'rgba(245,158,11,.1)', iconColor: 'var(--gold)', dept: 'Income Tax Dept', ref: 'PAN', sections: [
    { title: 'Personal Details', fields: [['Full Name (as per Aadhaar)','text','',['firstName','lastName'],'name'],["Father's Name",'text','',['father'],'father'],['Date of Birth','date','',['dob'],'dob'],['Gender','select','',['Male','Female','Other'],'gender']] },
    { title: 'Contact & Address', fields: [['Mobile Number','tel','',['mobile'],'mobile'],['Email','email','',['email'],'email'],['Full Address','textarea','',['address'],'address'],['PIN Code','text','',['pin'],'pin']] },
    { title: 'Aadhaar Linkage', fields: [['Aadhaar Number','text','',['aadhaar'],'aadhaar'],['Application Type','select','',['Fresh PAN','Lost/Damaged Replacement','Correction'],''],] },
  ]},
  passport: { title: 'Passport Application', icon: 'book', color: 'rgba(16,185,129,.1)', iconColor: 'var(--green)', dept: 'Ministry of External Affairs', ref: 'PSP', sections: [
    { title: 'Applicant Details', fields: [['Given Name','text','',['firstName'],'firstName'],['Surname','text','',['lastName'],'lastName'],['Date of Birth','date','',['dob'],'dob'],['Gender','select','',['Male','Female','Third Gender'],'gender'],['Place of Birth','text','',['city'],'city'],['Nationality','text','',['nationality'],'nationality']] },
    { title: 'Contact Information', fields: [['Mobile','tel','',['mobile'],'mobile'],['Email','email','',['email'],'email'],['Address','textarea','',['address'],'address'],['State','text','',['state'],'state'],['PIN','text','',['pin'],'pin']] },
    { title: 'Application Details', fields: [['Aadhaar Number','text','',['aadhaar'],'aadhaar'],['Application Type','select','',['Fresh Passport','Re-issue','Tatkaal Scheme'],''],['Police Station','text','Enter nearest police station',null,'']] },
  ]},
  dl: { title: 'Driving License Renewal', icon: 'directions_car', color: 'rgba(249,115,22,.1)', iconColor: 'var(--orange)', dept: 'Road Transport & Highways', ref: 'DLR', sections: [
    { title: 'Personal Details', fields: [['Full Name','text','',['firstName','lastName'],'name'],['Date of Birth','date','',['dob'],'dob'],['Mobile Number','tel','',['mobile'],'mobile'],['Address','textarea','',['address'],'address'],['State','text','',['state'],'state'],['PIN Code','text','',['pin'],'pin']] },
    { title: 'License Details', fields: [['Aadhaar Number','text','',['aadhaar'],'aadhaar'],['Current DL Number','text','e.g. DL-0420XXX',null,''],['RTO Office','text','e.g. New Delhi RTO',null,''],['License Class','select','',['LMV (Light Motor Vehicle)','HMV (Heavy Motor Vehicle)','Motorcycle','Commercial Vehicle'],''],['Application Type','select','',['Renewal','Duplicate','Address Change','Upgrade Class'],''],] },
  ]},
  income: { title: 'Income Certificate', icon: 'description', color: 'rgba(16,185,129,.08)', iconColor: 'var(--green)', dept: 'Revenue Dept / Tehsildar', ref: 'INC', sections: [
    { title: 'Applicant Details', fields: [['Full Name','text','',['firstName','lastName'],'name'],['Date of Birth','date','',['dob'],'dob'],['Gender','select','',['Male','Female','Other'],'gender'],['Mobile','tel','',['mobile'],'mobile'],['Aadhaar Number','text','',['aadhaar'],'aadhaar']] },
    { title: 'Address', fields: [['House / Street','text','',['address'],'address'],['City / Village','text','',['city'],'city'],['District','text','e.g. Central Delhi',null,''],['State','text','',['state'],'state'],['PIN','text','',['pin'],'pin']] },
    { title: 'Income Details', fields: [["Father's / Husband's Name",'text','',['father'],'father'],['Occupation','text','',['occupation'],'occupation'],['Annual Income (₹)','number','',['income'],'income'],['Purpose of Certificate','select','',['Scholarship','Fee Concession','Ration Card','Loan Application','Government Scheme','Other'],''],] },
  ]},
  caste: { title: 'Caste Certificate', icon: 'diversity_3', color: 'rgba(139,92,246,.1)', iconColor: 'var(--accent2)', dept: 'Social Welfare Dept', ref: 'CST', sections: [
    { title: 'Personal Information', fields: [['Full Name','text','',['firstName','lastName'],'name'],['Date of Birth','date','',['dob'],'dob'],['Gender','select','',['Male','Female','Other'],'gender'],['Mobile','tel','',['mobile'],'mobile'],['Aadhaar Number','text','',['aadhaar'],'aadhaar']] },
    { title: 'Family & Community', fields: [["Father's Name",'text','',['father'],'father'],["Mother's Name",'text','',['mother'],'mother'],['Religion','text','',['religion'],'religion'],['Caste / Sub-caste','text','',['caste'],'caste'],['Category','select','',['SC (Scheduled Caste)','ST (Scheduled Tribe)','OBC (Other Backward Class)','General'],''],] },
    { title: 'Address', fields: [['Address','textarea','',['address'],'address'],['City','text','',['city'],'city'],['State','text','',['state'],'state'],['PIN','text','',['pin'],'pin']] },
  ]},
  voter: { title: 'Voter ID (EPIC)', icon: 'how_to_vote', color: 'rgba(239,68,68,.1)', iconColor: 'var(--red)', dept: 'Election Commission of India', ref: 'VTR', sections: [
    { title: 'Personal Details', fields: [['Full Name','text','',['firstName','lastName'],'name'],['Date of Birth','date','',['dob'],'dob'],['Gender','select','',['Male','Female','Third Gender'],'gender'],['Mobile','tel','',['mobile'],'mobile'],['Email','email','',['email'],'email'],['Aadhaar Number','text','',['aadhaar'],'aadhaar']] },
    { title: 'Address Details', fields: [['Current Address','textarea','',['address'],'address'],['District','text','e.g. Central Delhi',null,''],['Assembly Constituency','text','e.g. Karol Bagh',null,''],['State','text','',['state'],'state'],['PIN Code','text','',['pin'],'pin']] },
    { title: 'Application Type', fields: [['Request Type','select','',['New Registration','Address Change','Name Correction','Photo Update','Deletion Request'],''],] },
  ]},
  domicile: { title: 'Domicile Certificate', icon: 'home', color: 'rgba(99,102,241,.06)', iconColor: 'var(--accent)', dept: 'District Administration', ref: 'DOM', sections: [
    { title: 'Personal Details', fields: [['Full Name','text','',['firstName','lastName'],'name'],['Date of Birth','date','',['dob'],'dob'],['Aadhaar Number','text','',['aadhaar'],'aadhaar'],['Mobile','tel','',['mobile'],'mobile']] },
    { title: 'Residence Details', fields: [['Address','textarea','',['address'],'address'],['City','text','',['city'],'city'],['District','text','e.g. Central Delhi',null,''],['State','text','',['state'],'state'],['PIN Code','text','',['pin'],'pin'],['Residence Since (Year)','number','e.g. 2015',null,'']] },
  ]},
  gst: { title: 'GST Registration', icon: 'payments', color: 'rgba(245,158,11,.08)', iconColor: 'var(--gold)', dept: 'Goods & Services Tax Network', ref: 'GST', sections: [
    { title: 'Applicant / Business', fields: [['Legal Name','text','',['firstName','lastName'],'name'],['Trade Name','text','Business / shop name',null,''],['PAN Number','text','',['pan'],'pan'],['Mobile','tel','',['mobile'],'mobile'],['Email','email','',['email'],'email']] },
    { title: 'Business Details', fields: [['Business Type','select','',['Proprietorship','Partnership','LLP','Pvt. Ltd.','Public Ltd.'],''],['Nature of Business','select','',['Trader','Manufacturer','Service Provider','E-commerce','Others'],''],['Annual Turnover (₹)','number','e.g. 5000000',null,''],['Principal Place of Business','textarea','',['address'],'address'],['State','text','',['state'],'state'],['PIN','text','',['pin'],'pin']] },
  ]},
};


// ── 16. FORM HELPERS ──────────────────────────────────────────────
function getVal(keys) {
  if (!keys || !keys.length) return '';
  if (keys[0] === 'Male' || keys[0] === 'Female') return profile.gender || '';
  if (typeof keys === 'string') return profile[keys] || '';
  return keys.map(k => profile[k] || '').filter(Boolean).join(' ');
}

function getAutoVal(profileKey, srcKeys) {
  if (!profileKey && (!srcKeys || !Array.isArray(srcKeys))) return '';
  if (profileKey === 'name') return (profile.firstName || '') + ' ' + (profile.lastName || '');
  if (profileKey === 'dob')  return profile.dob || '';
  if (profileKey && profile[profileKey] !== undefined) return profile[profileKey];
  if (Array.isArray(srcKeys)) {
    if (srcKeys[0] === 'Male' || srcKeys[0] === 'Female' || srcKeys[0] === 'Option 1') return profile.gender || '';
    return srcKeys.map(k => profile[k] || '').filter(Boolean).join(' ');
  }
  return '';
}

function countFilled(f) {
  let c = 0;
  f.sections.forEach(s => s.fields.forEach(([,,,srcKeys,profileKey]) => {
    const v = getAutoVal(profileKey, srcKeys);
    if (v && v.trim()) c++;
  }));
  return c;
}

function openForm(type) {
  const f = forms[type];
  if (!f) return;
  sv('form');
  document.getElementById('page-title').textContent = f.title;
  document.getElementById('page-sub').textContent   = 'Auto-filled from your profile · Review and submit';
  const ref = f.ref + '-' + Math.floor(Math.random() * 90000 + 10000);

  let html = `
    <div class="form-header">
      <div class="form-icon" style="background:${f.color};color:${f.iconColor}"><span class="icon lg">${f.icon}</span></div>
      <div><h2 style="font-size:20px;font-weight:800">${f.title}</h2><p style="color:var(--text2);font-size:13px;margin-top:2px">${f.dept} · Ref: ${ref}</p></div>
      <span class="badge badge-blue" style="margin-left:auto">Auto-fill Active</span>
    </div>
    <div class="autofill-banner">
      <span class="icon">auto_fix_high</span>
      <div><strong>${countFilled(f)} fields auto-filled</strong> from your saved profile. Green fields were filled automatically — review and edit if needed.</div>
    </div>
    <p class="required-note">Fields marked <span style="color:var(--red)">*</span> are required. Green bordered fields were auto-filled from your vault.</p>`;

  f.sections.forEach(sec => {
    html += `<div class="form-section"><h3><span class="icon sm" style="color:var(--accent)">edit_note</span>${sec.title}</h3><div class="form-grid">`;
    sec.fields.forEach(([label, type2, placeholder, srcKeys, profileKey]) => {
      const val    = getAutoVal(profileKey, srcKeys);
      const filled = val && val.trim();
      const id     = 'fld-' + label.replace(/[^a-z]/gi, '').toLowerCase() + Math.random().toString(36).substr(2, 4);
      if (type2 === 'select') {
        const isGender   = label.toLowerCase().includes('gender');
        const selectOpts = isGender ? ['Male','Female','Other','Third Gender'] : (Array.isArray(srcKeys) ? srcKeys : ['Option 1']);
        html += `<div class="field"><label>${label}</label><select id="${id}">${selectOpts.map(o => `<option ${val === o ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`;
      } else if (type2 === 'textarea') {
        html += `<div class="field" style="grid-column:1/-1"><label>${label}</label><textarea id="${id}" placeholder="${placeholder || ''}" class="${filled ? 'autofilled' : ''}">${val}</textarea>${filled ? `<span class="af-tag"><span class="icon sm">auto_fix_high</span> Auto-filled</span>` : ''}</div>`;
      } else {
        html += `<div class="field"><label>${label}</label><input type="${type2}" id="${id}" value="${val}" placeholder="${placeholder || ''}" class="${filled ? 'autofilled' : ''}" oninput="this.classList.remove('autofilled')"/>${filled ? `<span class="af-tag"><span class="icon sm">auto_fix_high</span> Auto-filled</span>` : ''}</div>`;
      }
    });
    html += `</div></div>`;
  });

  html += `
    <div class="form-section">
      <h3><span class="icon sm" style="color:var(--accent)">attach_file</span>Supporting Documents</h3>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.5);border:1px solid var(--glass-border);border-radius:var(--r2);padding:12px 14px">
          <div style="display:flex;align-items:center;gap:8px"><span class="icon sm" style="color:var(--green)">check_circle</span><span style="font-size:13px">Aadhaar Card</span></div>
          <span class="badge badge-green">Attached from Vault</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.5);border:1px solid var(--glass-border);border-radius:var(--r2);padding:12px 14px">
          <div style="display:flex;align-items:center;gap:8px"><span class="icon sm" style="color:var(--green)">check_circle</span><span style="font-size:13px">PAN Card</span></div>
          <span class="badge badge-green">Attached from Vault</span>
        </div>
        <div class="upload-zone" onclick="toast('File picker opened','info')" style="padding:20px">
          <span class="icon" style="display:block;text-align:center;color:var(--accent);opacity:.4">add_circle</span>
          <p style="font-size:13px;font-weight:600;text-align:center;margin-top:6px">Attach additional documents</p>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:12px;margin-top:8px;padding-bottom:20px;flex-wrap:wrap">
      <button class="btn btn-ghost" onclick="sv('services')"><span class="icon sm">arrow_back</span> Back</button>
      <button class="btn btn-dark" onclick="toast('Draft saved!','success')"><span class="icon sm">save</span> Save Draft</button>
      <button class="btn btn-primary btn-lg" style="margin-left:auto" onclick="submitForm('${f.title}','${ref}')"><span class="icon sm">send</span> Submit Application</button>
    </div>`;

  document.getElementById('form-content').innerHTML = html;
}


// ── 17. SUBMIT FORM MODAL ─────────────────────────────────────────
async function submitForm(title, ref) {
  // Save to Supabase applications table
  const { data: userData } = await _supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (userId) {
    await _supabase.from('applications').insert([{
      citizen_id:    userId,
      service_title: title,
      reference_no:  ref,
      status:        'Submitted',
    }]);
  }

  document.getElementById('modal-box').innerHTML = `
    <div style="text-align:center;padding:10px 0">
      <div style="width:60px;height:60px;border-radius:50%;background:rgba(16,185,129,.12);border:2px solid var(--green);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:28px;color:var(--green)"><span class="icon lg">check_circle</span></div>
      <h2 class="modal-title">Application Submitted!</h2>
      <p class="modal-sub">Your application has been received and is under processing</p>
      <div style="background:rgba(255,255,255,0.5);border-radius:var(--r2);padding:14px;margin:16px 0;text-align:left">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px"><span style="color:var(--text3)">Service</span><span style="font-weight:600">${title}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:var(--text3)">Reference No.</span><span class="mono" style="font-weight:600;color:var(--accent)">${ref}</span></div>
      </div>
      <p style="font-size:12px;color:var(--text3);margin-bottom:16px">You will receive SMS and email updates. Track live status in Application Tracking.</p>
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn btn-ghost" onclick="closeModal();sv('tracking')"><span class="icon sm">assignment_turned_in</span> Track Status</button>
        <button class="btn btn-primary" onclick="closeModal();sv('dashboard')"><span class="icon sm">dashboard</span> Dashboard</button>
      </div>
    </div>`;
  document.getElementById('modal').style.display = 'flex';
}


// ── 18. MODAL ─────────────────────────────────────────────────────
function closeModal(e) {
  if (!e || e.target === document.getElementById('modal'))
    document.getElementById('modal').style.display = 'none';
}


// ── 19. TOAST ─────────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const c = document.getElementById('toast');
  const d = document.createElement('div');
  d.className = 'toast-item' + (type === 'error' ? ' err' : '');
  d.innerHTML = (
    type === 'success' ? '<span class="icon sm" style="color:var(--green)">check_circle</span>' :
    type === 'error'   ? '<span class="icon sm" style="color:var(--red)">error</span>' :
                         '<span class="icon sm" style="color:var(--accent)">info</span>'
  ) + ' ' + msg;
  c.appendChild(d);
  setTimeout(() => d.remove(), 3500);
}


// ── 20. INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const { data } = await _supabase.auth.getSession();
  if (data.session) {
    await fetchUserProfile(data.session.user.id);
    showPage('pg-app');
    sv('dashboard');
  } else {
    renderProfile();
  }
});