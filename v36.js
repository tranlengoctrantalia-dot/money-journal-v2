(() => {
  const KEY='money_journal_v2_state';
  const MIG='mj_v36_personal_setup_20260912';
  const TYPES={spending:'Chi tiêu',income:'Thu nhập',moneyin:'Tiền nhận',money_in:'Tiền nhận',debt:'Trả thẻ',debt_payment:'Trả thẻ',refund:'Hoàn tiền',transfer:'Chuyển tiền'};
  const TYPE_OPTIONS=[['spending','Chi tiêu'],['income','Thu nhập'],['moneyin','Tiền nhận'],['debt','Trả thẻ'],['refund','Hoàn tiền'],['transfer','Chuyển tiền']];
  const CATS=['Lương','Ăn uống','Di chuyển','Mua sắm','Hẹn hò','Giải trí','Hóa đơn','Sức khỏe','Làm đẹp','Dịch vụ số','Quà tặng','Phí','Trả góp','Thanh toán dư nợ','Tiết kiệm','Khác'];
  const SOURCES=['Tiền mặt','VPBank','Shinhan','Ví Trả Sau','Tài khoản ngân hàng','Tiết kiệm','Khác'];
  const $=id=>document.getElementById(id);
  const fmt=n=>(Number(n)||0).toLocaleString('vi-VN');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function persist(){
    try{ if(typeof save==='function') save(); else if(typeof state!=='undefined') localStorage.setItem(KEY,JSON.stringify(state)); }catch(e){console.error(e)}
    try{ if(typeof renderAll==='function') renderAll(); }catch(e){}
    setTimeout(()=>{renderAccounts();renderActivity();enhanceRecent()},40);
  }

  function seedPersonal(){
    try{
      if(typeof state==='undefined'||!state||!Array.isArray(state.transactions))return;
      state.accounts=Array.isArray(state.accounts)?state.accounts:[];
      const upsertAccount=(name,balance,type)=>{
        let a=state.accounts.find(x=>String(x.name).toLowerCase()===name.toLowerCase());
        if(a){a.balance=balance;a.type=type}else state.accounts.push({id:'acc-'+name.toLowerCase().replace(/\s+/g,'-'),name,balance,type});
      };
      upsertAccount('Tiền mặt',2300000,'cash');
      upsertAccount('Tiết kiệm',10000000,'savings');
      if(localStorage.getItem(MIG)!=='1'){
        const exists=(name,amount)=>state.transactions.some(t=>String(t.name||'').toLowerCase()===name.toLowerCase()&&Number(t.amount)===amount);
        if(!exists('Lương tháng 8',18300000)) state.transactions.push({id:'personal-salary-202608',name:'Lương tháng 8',amount:18300000,date:'2026-09-07',type:'income',category:'Lương',source:'Tài khoản ngân hàng',account:'Tài khoản ngân hàng',note:'Lương tháng 8',imported:true});
        if(!exists('Chuyển vào tiết kiệm',10000000)) state.transactions.push({id:'personal-saving-202608',name:'Chuyển vào tiết kiệm',amount:10000000,date:'2026-09-07',type:'transfer',category:'Tiết kiệm',source:'Tài khoản ngân hàng',account:'Tài khoản ngân hàng',note:'Chuyển 10.000.000đ vào khoản tiết kiệm',imported:true});
        localStorage.setItem(MIG,'1');
      }
      persist();
    }catch(e){console.error('[Money Journal] personal setup failed',e)}
  }

  function ensureAccountsUI(){
    if($('v36Accounts'))return;
    const home=$('home'); if(!home)return;
    const section=document.createElement('section');section.id='v36Accounts';section.className='v36-accounts-section';
    const recent=[...home.querySelectorAll('.section')].find(x=>/giao dịch gần đây/i.test(x.textContent||''));
    if(recent)recent.before(section);else home.append(section);
    renderAccounts();
  }
  function renderAccounts(){
    const root=$('v36Accounts'); if(!root||typeof state==='undefined')return;
    const accs=Array.isArray(state.accounts)?state.accounts:[];
    root.innerHTML=`<div class="v36-head"><div><span class="v36-kicker">Tài khoản</span><h3>Số dư hiện tại</h3></div><button class="v36-text-btn" id="v36EditBalances">Chỉnh sửa</button></div><div class="v36-account-grid">${accs.map(a=>`<div class="v36-account"><span>${esc(a.name)}</span><strong>${fmt(a.balance)}đ</strong></div>`).join('')}</div>`;
    $('v36EditBalances')?.addEventListener('click',openBalances);
  }

  function ensureModal(){
    if($('v36EditModal'))return;
    document.body.insertAdjacentHTML('beforeend',`<div id="v36EditModal" class="v36-modal" aria-hidden="true"><div class="v36-sheet"><div class="v36-sheet-head"><div><span class="v36-kicker">Giao dịch</span><h3>Chỉnh sửa</h3></div><button class="v36-icon-btn" id="v36Close">×</button></div><div class="v36-form"><label>Loại giao dịch<select id="v36Type">${TYPE_OPTIONS.map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><label>Danh mục<select id="v36Cat">${CATS.map(c=>`<option>${c}</option>`).join('')}</select></label><label>Số tiền<input id="v36Amount" inputmode="numeric"></label><label>Ngày<input id="v36Date" type="date"></label><label>Nguồn thanh toán<select id="v36Source">${SOURCES.map(s=>`<option>${s}</option>`).join('')}</select></label><label>Ghi chú<input id="v36Note" placeholder="Ví dụ: Grab, Shopee..."></label></div><div class="v36-actions"><button class="v36-delete" id="v36Delete">Xóa</button><button class="v36-save" id="v36Save">Lưu thay đổi</button></div></div></div><div id="v36BalanceModal" class="v36-modal" aria-hidden="true"><div class="v36-sheet"><div class="v36-sheet-head"><div><span class="v36-kicker">Tài khoản</span><h3>Chỉnh số dư</h3></div><button class="v36-icon-btn" id="v36BalanceClose">×</button></div><div class="v36-form"><label>Tiền mặt<input id="v36Cash" inputmode="numeric"></label><label>Tiết kiệm<input id="v36Savings" inputmode="numeric"></label></div><button class="v36-save wide" id="v36BalanceSave">Lưu số dư</button></div></div>`);
    $('v36Close').onclick=closeEdit;$('v36EditModal').onclick=e=>{if(e.target.id==='v36EditModal')closeEdit()};
    $('v36Save').onclick=saveEdit;$('v36Delete').onclick=deleteEdit;
    $('v36BalanceClose').onclick=closeBalances;$('v36BalanceModal').onclick=e=>{if(e.target.id==='v36BalanceModal')closeBalances()};$('v36BalanceSave').onclick=saveBalances;
  }
  let editingId=null;
  function findTx(id){return state.transactions.find(t=>String(t.id)===String(id))}
  function normalizeType(t){if(t==='money_in')return'moneyin';if(t==='debt_payment')return'debt';return t||'spending'}
  function openEdit(id){
    ensureModal(); const t=findTx(id); if(!t)return; editingId=id;
    $('v36Type').value=normalizeType(t.type);$('v36Cat').value=CATS.includes(t.category)?t.category:'Khác';$('v36Amount').value=fmt(t.amount);$('v36Date').value=t.date||'';$('v36Source').value=SOURCES.includes(t.source||t.account)?(t.source||t.account):'Khác';$('v36Note').value=t.note||t.name||'';
    $('v36EditModal').classList.add('show');document.body.classList.add('v36-lock');
  }
  function closeEdit(){$('v36EditModal')?.classList.remove('show');document.body.classList.remove('v36-lock');editingId=null}
  function saveEdit(){const t=findTx(editingId);if(!t)return;const amount=Number(String($('v36Amount').value).replace(/[^\d]/g,''))||0;t.type=$('v36Type').value;t.category=$('v36Cat').value;t.amount=amount;t.date=$('v36Date').value;t.source=$('v36Source').value;t.account=t.source;t.note=$('v36Note').value.trim();t.name=t.note||t.name||'Giao dịch';persist();closeEdit()}
  function deleteEdit(){if(editingId==null)return;state.transactions=state.transactions.filter(t=>String(t.id)!==String(editingId));persist();closeEdit()}

  function openBalances(){ensureModal();const accs=state.accounts||[];$('v36Cash').value=fmt(accs.find(a=>a.name==='Tiền mặt')?.balance||0);$('v36Savings').value=fmt(accs.find(a=>a.name==='Tiết kiệm')?.balance||0);$('v36BalanceModal').classList.add('show');document.body.classList.add('v36-lock')}
  function closeBalances(){$('v36BalanceModal')?.classList.remove('show');document.body.classList.remove('v36-lock')}
  function saveBalances(){const val=id=>Number(String($(id).value).replace(/[^\d]/g,''))||0;const set=(name,balance,type)=>{let a=state.accounts.find(x=>x.name===name);if(a)a.balance=balance;else state.accounts.push({id:'acc-'+name,name,balance,type})};set('Tiền mặt',val('v36Cash'),'cash');set('Tiết kiệm',val('v36Savings'),'savings');persist();closeBalances()}

  function iconFor(t){const type=normalizeType(t.type);if(type==='income')return'↙';if(type==='debt')return'↗';if(type==='transfer')return'⇄';if(type==='refund')return'↩';return'•'}
  function renderActivity(){
    const root=$('activityList');if(!root||typeof state==='undefined')return;
    const q=String($('search')?.value||'').toLowerCase();const active=document.querySelector('#filters .tool.active')?.dataset.f||'all';
    const typeMatch=t=>active==='all'||normalizeType(t.type)===active||(active==='moneyin'&&['moneyin','money_in'].includes(t.type))||(active==='debt'&&['debt','debt_payment'].includes(t.type));
    const list=[...state.transactions].filter(t=>typeMatch(t)&&(!q||`${t.name||''} ${t.note||''} ${t.category||''} ${t.source||t.account||''}`.toLowerCase().includes(q))).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
    root.classList.add('v36-list');
    root.innerHTML=list.length?list.map(t=>`<button class="v36-tx" data-id="${esc(t.id)}"><span class="v36-tx-icon">${iconFor(t)}</span><span class="v36-tx-main"><strong>${esc(t.note||t.name||'Giao dịch')}</strong><small>${esc(t.category||TYPES[t.type]||'Khác')} · ${esc(t.source||t.account||'')}</small></span><span class="v36-tx-right"><strong>${fmt(t.amount)}đ</strong><small>${String(t.date||'').split('-').reverse().join('/')}</small></span><span class="v36-chevron">›</span></button>`).join(''):'<div class="v36-empty">Chưa có giao dịch phù hợp.</div>';
    root.querySelectorAll('.v36-tx').forEach(b=>b.onclick=()=>openEdit(b.dataset.id));
  }
  function enhanceRecent(){
    const root=$('recent');if(!root||typeof state==='undefined')return;
    const list=[...state.transactions].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,5);
    root.innerHTML=list.map(t=>`<button class="v36-tx compact" data-id="${esc(t.id)}"><span class="v36-tx-icon">${iconFor(t)}</span><span class="v36-tx-main"><strong>${esc(t.note||t.name||'Giao dịch')}</strong><small>${esc(t.category||'')} · ${esc(t.source||t.account||'')}</small></span><span class="v36-tx-right"><strong>${fmt(t.amount)}đ</strong><small>${String(t.date||'').split('-').reverse().join('/')}</small></span><span class="v36-chevron">›</span></button>`).join('');root.querySelectorAll('.v36-tx').forEach(b=>b.onclick=()=>openEdit(b.dataset.id));
  }
  function hook(){
    ensureModal();ensureAccountsUI();renderActivity();enhanceRecent();
    $('search')?.addEventListener('input',renderActivity);
    document.querySelectorAll('#filters .tool').forEach(b=>b.addEventListener('click',()=>setTimeout(renderActivity,0)));
    document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>{if(b.dataset.tab==='activity')renderActivity();if(b.dataset.tab==='home'){renderAccounts();enhanceRecent()}},20)));
  }
  const start=()=>{seedPersonal();setTimeout(hook,200)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,4200));else setTimeout(start,4200);
})();