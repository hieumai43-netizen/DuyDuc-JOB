(() => {
  const CONFIG_KEY = 'jobleadFirebaseSetupV1';
  const authRoot = document.getElementById('authRoot');
  const appShell = document.getElementById('appShell');
  const authUserBtn = document.getElementById('authUserBtn');
  let auth = null;
  let db = null;
  let setup = loadSetup();
  let currentProfile = null;

  function loadSetup(){
    // Luôn dùng cấu hình Firebase đã đóng gói trong source code.
    // Bản cũ từng lưu cấu hình người dùng nhập vào localStorage; dữ liệu cũ đó
    // có thể chứa API key sai và ghi đè cấu hình đúng, gây lỗi auth/api-key-not-valid.
    try { localStorage.removeItem(CONFIG_KEY); } catch {}
    return window.JOBLEAD_FIREBASE_DEFAULTS || {};
  }

  function configured(){
    const c=setup?.firebaseConfig;
    return !!(c && c.apiKey && !c.apiKey.startsWith('PASTE_') && c.appId && !c.appId.startsWith('PASTE_') && c.authDomain && c.projectId === 'joblead-vn' && setup.adminEmail);
  }

  function esc(v=''){ return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function showRoot(html){ authRoot.innerHTML=html; authRoot.hidden=false; appShell.hidden=true; }
  function showApp(user, profile){
    window.jobleadGetIdToken=(forceRefresh=false)=>auth.currentUser?.getIdToken(forceRefresh);
    currentProfile=profile;
    authRoot.hidden=true;
    appShell.hidden=false;
    const admin=isAdmin(user);
    authUserBtn.title=admin?'Mở quản lý người dùng':(user.email || 'Tài khoản');
    authUserBtn.classList.toggle('admin-access',admin);
    authUserBtn.innerHTML=admin
      ? '<span class="account-pill-icon">👑</span><span class="account-pill-text">Duyệt tài khoản</span><span class="pending-badge" id="pendingBadge" hidden>0</span>'
      : '<span class="account-pill-icon">👤</span><span class="account-pill-text">Tài khoản</span>';
    if(admin) updatePendingBadge();
    if(window.startJobLeadApp) window.startJobLeadApp();
  }
  function isAdmin(user){ return !!user?.email && user.email.toLowerCase()===String(setup.adminEmail||'').toLowerCase(); }

  function authToast(message){
    const el=document.getElementById('toast');
    if(!el) return;
    el.textContent=message;
    el.classList.add('show');
    setTimeout(()=>el.classList.remove('show'),2200);
  }

  async function updatePendingBadge(){
    const badge=document.getElementById('pendingBadge');
    if(!badge || !db) return;
    try{
      const snap=await db.collection('joblead_users').where('status','==','pending').get();
      badge.textContent=String(snap.size);
      badge.hidden=snap.size===0;
      authUserBtn.setAttribute('aria-label',snap.size?`Có ${snap.size} tài khoản chờ duyệt`:'Quản lý người dùng');
    }catch{
      badge.hidden=true;
    }
  }

  function renderSetup(message=''){
    showRoot(`<main class="auth-page"><section class="auth-card setup-card">
      <div class="auth-mark">🎯</div>
      <h1>Thiết lập đăng nhập</h1>
      <p class="auth-help">Chỉ cần làm một lần trên thiết bị quản trị. Lấy cấu hình Web App từ Firebase rồi dán vào đây.</p>
      ${message?`<div class="auth-error">${esc(message)}</div>`:''}
      <form id="setupForm" class="form-grid">
        <div class="field"><label>Email quản trị viên</label><input type="email" name="adminEmail" required value="${esc(setup.adminEmail||'')}" placeholder="email-cua-ban@gmail.com"></div>
        <div class="field"><label>Firebase configuration</label><textarea name="config" required rows="10" placeholder='Dán object firebaseConfig, ví dụ: { "apiKey": "...", "authDomain": "...", "projectId": "..." }'>${setup.firebaseConfig?esc(JSON.stringify(setup.firebaseConfig,null,2)):''}</textarea></div>
        <button class="primary-btn">Lưu cấu hình và khởi động</button>
      </form>
      <p class="small-note">File README trong gói ZIP có hướng dẫn bật Email/Password, tạo Firestore và dán Security Rules.</p>
    </section></main>`);
    document.getElementById('setupForm').onsubmit=e=>{
      e.preventDefault(); const f=new FormData(e.target);
      try{
        let raw=String(f.get('config')).trim();
        raw=raw.replace(/^const\s+firebaseConfig\s*=\s*/, '').replace(/;\s*$/, '');
        const config=Function(`"use strict"; return (${raw})`)();
        if(!config.apiKey||!config.authDomain||!config.projectId) throw new Error('Thiếu apiKey, authDomain hoặc projectId.');
        setup={adminEmail:String(f.get('adminEmail')).trim().toLowerCase(),firebaseConfig:config};
        localStorage.setItem(CONFIG_KEY,JSON.stringify(setup)); location.reload();
      }catch(err){ renderSetup('Cấu hình chưa đúng: '+err.message); }
    };
  }

  function renderLogin(message=''){
    const localHost=['127.0.0.1','localhost'].includes(location.hostname);
    const hostHelp=localHost ? `<div class="small-note" style="margin-top:12px;text-align:left"><b>Đang chạy thử trên ${esc(location.hostname)}</b>. Firebase có thể yêu cầu thêm tên miền này vào Authentication → Paramètres → Domaines autorisés. Thêm <code>${esc(location.hostname)}</code> (không nhập cổng 5500). Nếu dùng cả localhost và 127.0.0.1, thêm cả hai.</div>` : '';
    showRoot(`<main class="auth-page"><section class="auth-card">
      <div class="auth-mark">🎯</div><h1>JobLead VN</h1>
      <p class="auth-help">Đăng nhập bằng Google. Tài khoản mới cần Admin duyệt trước khi sử dụng.</p>
      ${message?`<div class="auth-error">${esc(message)}</div>`:''}
      <button class="primary-btn" id="googleLogin" type="button">🔐 Đăng nhập bằng Google</button>
      <p class="small-note">Đăng nhập lần đầu sẽ tự gửi yêu cầu phê duyệt. Không cần mật khẩu riêng.</p>${hostHelp}
    </section></main>`);
    document.getElementById('googleLogin').onclick=async()=>{
      const btn=document.getElementById('googleLogin');btn.disabled=true;
      try{await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());}
      catch(err){renderLogin(firebaseError(err));}
    };
  }

  function renderPending(email,message='Tài khoản đang chờ phê duyệt.'){
    showRoot(`<main class="auth-page"><section class="auth-card">
      <div class="auth-mark">🎯</div><h1>Đang chờ phê duyệt</h1>
      <div class="pending-icon">⏳</div><p>${esc(message)}</p><p class="auth-email">${esc(email||'')}</p>
      <button class="secondary-btn" id="checkAgain">Kiểm tra lại</button>
      <button class="link-btn" id="logoutPending">Đăng xuất</button>
    </section></main>`);
    document.getElementById('checkAgain').onclick=()=>location.reload();
    document.getElementById('logoutPending').onclick=()=>auth.signOut();
  }

  function isPermissionError(err){
    return err?.code==='permission-denied' || err?.code==='firestore/permission-denied';
  }

  async function createPendingProfile(user, displayName=''){
    const ref=db.collection('joblead_users').doc(user.uid);
    await ref.set({
      email:String(user.email||'').trim().toLowerCase(),
      displayName:String(displayName||user.displayName||'').trim(),
      status:'pending',
      createdAt:firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt:firebase.firestore.FieldValue.serverTimestamp()
    },{merge:false});
    return {email:user.email,displayName:String(displayName||user.displayName||'').trim(),status:'pending'};
  }

  function renderFirestoreHelp(email, detail=''){
    showRoot(`<main class="auth-page"><section class="auth-card">
      <div class="auth-mark">🎯</div><h1>Chưa kết nối được Firestore</h1>
      <div class="pending-icon">🛠️</div>
      <p>Tài khoản Authentication đã tồn tại, nhưng app chưa được phép ghi yêu cầu chờ duyệt vào Firestore.</p>
      <p class="auth-email">${esc(email||'')}</p>
      ${detail?`<div class="auth-error">${esc(detail)}</div>`:''}
      <div class="small-note" style="text-align:left"><b>Quản trị viên cần làm một lần:</b><br>Firebase Console → Firestore Database → Rules → dán nội dung file <code>firestore.rules</code> → bấm Publish.</div>
      <button class="primary-btn" id="retryProfile">Thử tạo lại yêu cầu</button>
      <button class="link-btn" id="logoutFirestore">Đăng xuất</button>
    </section></main>`);
    document.getElementById('retryProfile').onclick=async()=>{
      const btn=document.getElementById('retryProfile'); btn.disabled=true; btn.textContent='Đang thử lại…';
      try{ await createPendingProfile(auth.currentUser); renderPending(email,'Đã tạo yêu cầu thành công. Hãy báo quản trị viên phê duyệt.'); }
      catch(err){ renderFirestoreHelp(email,firebaseError(err)); }
    };
    document.getElementById('logoutFirestore').onclick=()=>auth.signOut();
  }

  function firebaseError(err){
    const map={'auth/popup-blocked':'Trình duyệt đang chặn cửa sổ đăng nhập Google. Hãy cho phép pop-up.','auth/unauthorized-domain':`Tên miền ${location.hostname} chưa được Firebase cho phép. Vào Firebase → Authentication → Paramètres → Domaines autorisés, thêm ${location.hostname} (không có http:// hay cổng :5500), sau đó thử lại.`,
      'auth/invalid-credential':'Email hoặc mật khẩu chưa đúng.','auth/email-already-in-use':'Email này đã được đăng ký.','auth/weak-password':'Mật khẩu phải có ít nhất 6 ký tự.','auth/invalid-email':'Địa chỉ email không hợp lệ.','auth/too-many-requests':'Thử quá nhiều lần. Hãy đợi một lúc.'
    };
    return map[err?.code]||err?.message||'Không thể xử lý yêu cầu.';
  }

  async function renderAdmin(){
    showRoot(`<main class="auth-page"><section class="auth-card admin-card">
      <div class="admin-head">
        <div><div class="admin-kicker">👑 QUẢN TRỊ VIÊN</div><h1>Quản lý người dùng</h1><p class="auth-help">Duyệt, khóa hoặc mở lại tài khoản Google.</p></div>
        <button class="secondary-btn" id="backApp">← Về ứng dụng</button>
      </div>
      <div class="admin-summary" id="adminSummary"><div><strong>—</strong><span>Chờ duyệt</span></div><div><strong>—</strong><span>Đang dùng</span></div><div><strong>—</strong><span>Đã khóa</span></div></div>
      <div id="userList" class="admin-list"><div class="empty">Đang tải danh sách…</div></div>
      <button class="link-btn" id="adminLogout">Đăng xuất tài khoản quản trị</button>
    </section></main>`);
    document.getElementById('backApp').onclick=()=>showApp(auth.currentUser,currentProfile||{status:'approved'});
    document.getElementById('adminLogout').onclick=()=>auth.signOut();
    try{
      const snap=await db.collection('joblead_users').orderBy('createdAt','desc').get();
      const rows=snap.docs.map(doc=>({id:doc.id,...doc.data()}));
      const counts={pending:0,approved:0,blocked:0};
      rows.forEach(u=>counts[u.status] = (counts[u.status]||0)+1);
      document.getElementById('adminSummary').innerHTML=`<div><strong>${counts.pending||0}</strong><span>Chờ duyệt</span></div><div><strong>${counts.approved||0}</strong><span>Đang dùng</span></div><div><strong>${counts.blocked||0}</strong><span>Đã khóa</span></div>`;
      document.getElementById('userList').innerHTML=rows.length?rows.map(u=>{
        const status=u.status||'pending';
        const statusText={pending:'Chờ duyệt',approved:'Đã duyệt',blocked:'Đã khóa'}[status];
        return `<article class="admin-user-card" data-uid="${u.id}">
          <div class="admin-user-main"><div class="admin-avatar">${esc((u.displayName||u.email||'?').slice(0,1).toUpperCase())}</div><div><b>${esc(u.displayName||'Chưa đặt tên')}</b><div class="row-sub">${esc(u.email)}</div></div><span class="admin-status ${status}">${statusText}</span></div>
          <div class="admin-actions">
            <button class="approve-btn" data-status="approved" ${status==='approved'?'disabled':''}>✓ Duyệt</button>
            <button class="pending-btn" data-status="pending" ${status==='pending'?'disabled':''}>⏳ Chờ</button>
            <button class="block-btn" data-status="blocked" ${status==='blocked'?'disabled':''}>🚫 Khóa</button>
          </div>
        </article>`;
      }).join(''):'<div class="empty">Chưa có người nào đăng ký.</div>';
      document.querySelectorAll('.admin-user-card button[data-status]').forEach(btn=>btn.onclick=async()=>{
        const card=btn.closest('.admin-user-card');
        const uid=card.dataset.uid;
        const status=btn.dataset.status;
        btn.disabled=true;
        try{
          await db.collection('joblead_users').doc(uid).update({status,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
          authToast(status==='approved'?'Đã phê duyệt tài khoản':status==='blocked'?'Đã khóa tài khoản':'Đã chuyển về chờ duyệt');
          await renderAdmin();
          await updatePendingBadge();
        }catch(err){ authToast(firebaseError(err)); btn.disabled=false; }
      });
    }catch(err){ document.getElementById('userList').innerHTML=`<div class="auth-error">${esc(firebaseError(err))}<br><small>Hãy kiểm tra Firestore Rules đã được Publish.</small></div>`; }
  }

  async function onUser(user){
    if(!user){ currentProfile=null; window.jobleadGetIdToken=null; renderLogin(); return; }
    if(isAdmin(user)){ if(!user.emailVerified){renderLogin('Tài khoản Admin cần xác minh email Google.');return;} showApp(user,{status:'approved',admin:true}); return; }
    try{
      const ref=db.collection('joblead_users').doc(user.uid);
      let doc=await ref.get();
      if(!doc.exists){
        // Tự sửa các tài khoản đã được tạo trong Authentication ở bản cũ
        // nhưng chưa có hồ sơ Firestore.
        try{
          await createPendingProfile(user);
          doc=await ref.get();
        }catch(profileErr){
          if(isPermissionError(profileErr)){ renderFirestoreHelp(user.email,firebaseError(profileErr)); return; }
          throw profileErr;
        }
      }
      const profile=doc.data();
      if(profile.status==='approved') showApp(user,profile);
      else if(profile.status==='blocked') renderPending(user.email,'Tài khoản đã bị khóa. Hãy liên hệ quản trị viên.');
      else renderPending(user.email);
    }catch(err){ renderLogin(firebaseError(err)); }
  }

  authUserBtn.onclick=()=>{
    const user=auth?.currentUser; if(!user)return;
    if(isAdmin(user)) renderAdmin();
    else if(confirm(`${user.email}\n\nBạn muốn đăng xuất?`)) auth.signOut();
  };

  if(!configured()){ showRoot('<main class="auth-page"><section class="auth-card"><h2>Cần kết nối Firebase JobLead-VN</h2><p>Mở file <code>firebase-config.js</code>, điền cấu hình Web App của dự án <b>joblead-vn</b> rồi tải lại trang. Không dùng cấu hình ChusenManager.</p></section></main>'); return; }
  try{
    firebase.initializeApp(setup.firebaseConfig);
    auth=firebase.auth(); db=firebase.firestore();
    auth.onAuthStateChanged(onUser);
  }catch(err){ renderSetup(err.message); }
})();
