(() => {
  const KEY='money_journal_v2_state';
  const THEME='mj_theme_mode';
  const fmt=n=>(Number(n)||0).toLocaleString('vi-VN');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const typeOf=t=>{const x=String(t?.type||''); if(x==='money_in')return'moneyin'; if(x==='debt_payment')return'debt'; return x};
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
  const store=s=>{localStorage.setItem(KEY,JSON.stringify(s));try{if(typeof state!=='undefined')Object.assign(state,s)}catch(e){}};
  const txs=()=>Array.isArray(load().transactions)?load().transactions:[];
  const currentMonth=()=>{const all=txs().map(t=>String(t.date||'')).filter(d=>/^\d{4}-\d{2}/.test(d)).sort();return all.length?all[all.length-1].slice(0,7):new Date().toISOString().slice(0,7)};
  const isMonth=(t,ym)=>String(t.date||'').startsWith(ym);
  const sum=(arr,type)=>arr.filter(t=>typeOf(t)===type).reduce((s,t)=>s+(+t.amount||0),0);
  const cats=()=>['Ăn uống','Di chuyển','Mua sắm','Hẹn hò','Giải trí','Hóa đơn','Sức khỏe','Làm đẹp','Dịch vụ số','Quà tặng','Phí','Trả góp','Thanh toán dư nợ','Tiết kiệm','Lương','Khác'];
  const sources=()=>['Tiền mặt','VPBank','Shinhan','Ví Trả Sau','Tài khoản ngân hàng','Tiết kiệm','Khác'];
  const types=[['spending','Chi tiêu'],['income','Thu nhập'],['moneyin','Tiền nhận'],['debt','Trả thẻ'],['refund','Hoàn tiền'],['transfer','Chuyển tiền']];
  let active='home', flowFilter='all', query='', editing=null;

  function calc(){
    const all=txs(), ym=currentMonth(), month=all.filter(t=>isMonth(t,ym));
    const income=sum(month,'income'), moneyin=sum(month,'moneyin'), spend=sum(month,'spending'), debt=sum(month,'debt'), refund=sum(month,'refund');
    const left=income+moneyin-spend-debt+refund;
    const s=load(); const accounts=Array.isArray(s.accounts)?s.accounts:[];
    const cash=accounts.find(a=>String(a.name).toLowerCase()==='tiền mặt')?.balance||0;
    const savings=accounts.find(a=>String(a.name).toLowerCase()==='tiết kiệm')?.balance||0;
    return {all,month,ym,income,moneyin,spend,debt,refund,left,cash,savings};
  }

  function txRows(list,limit){
    const a=[...list].sort((x,y)=>String(y.date||'').localeCompare(String(x.date||'')));
    return (limit?a.slice(0,limit):a).map(t=>`<button class="v44-tx" data-edit="${esc(t.id)}"><span><b>${esc(t.note||t.name||'Giao dịch')}</b><small>${esc(t.category||'Khác')} · ${esc(t.source||t.account||'')}</small></span><span class="money"><strong>${fmt(t.amount)}đ</strong><small>${String(t.date||'').split('-').reverse().join('/')}</small></span><span class="v44-chev">›</span></button>`).join('')||'<div class="v44-sub" style="padding:12px 0;margin:0">Chưa có giao dịch.</div>';
  }

  function categoryStats(list){
    const map=new Map();
    list.filter(t=>typeOf(t)==='spending').forEach(t=>{const c=t.category||'Khác';map.set(c,(map.get(c)||0)+(+t.amount||0))});
    const rows=[...map].map(([category,amount])=>({category,amount})).sort((a,b)=>b.amount-a.amount); const total=rows.reduce((s,r)=>s+r.amount,0); const max=rows[0]?.amount||1;
    return {rows,total,max};
  }

  function renderHome(){
    const c=calc(), s=load(), budgets=Array.isArray(s.budgets)?s.budgets:[], budgetLimit=budgets.reduce((x,b)=>x+(+b.limit||0),0), goal=s.goal||{}, goalPct=goal.target?Math.min(100,Math.round((+goal.saved||0)/(+goal.target||1)*100)):0, budgetPct=budgetLimit?Math.min(100,Math.round(c.spend/budgetLimit*100)):0;
    return `<section class="v44-hero"><div class="label">Tiền còn lại tháng này</div><div class="v44-balance">${fmt(c.left)}đ</div><div class="v44-hero-note">Sau thu nhập, chi tiêu và trả thẻ</div><div class="v44-hero-grid"><div><small>Thu nhập</small><strong>${fmt(c.income)}đ</strong></div><div><small>Chi tiêu</small><strong>${fmt(c.spend)}đ</strong></div><div><small>Trả thẻ</small><strong>${fmt(c.debt)}đ</strong></div></div></section>
      <div class="v44-section-head"><h2>Tài khoản</h2><button data-page="settings">Quản lý</button></div><div class="v44-grid2"><div class="v44-mini"><small>Tiền mặt</small><strong>${fmt(c.cash)}đ</strong></div><div class="v44-mini"><small>Tiết kiệm</small><strong>${fmt(c.savings)}đ</strong></div></div>
      <div class="v44-section-head"><h2>Tháng này</h2><button data-page="plan">Xem kế hoạch</button></div><div class="v44-grid2"><div class="v44-mini"><small>Ngân sách đã dùng</small><strong>${budgetPct}%</strong><div class="bar"><i style="width:${budgetPct}%"></i></div></div><div class="v44-mini"><small>Mục tiêu tiết kiệm</small><strong>${goalPct}%</strong><div class="bar"><i style="width:${goalPct}%"></i></div></div></div>
      <div class="v44-section-head"><h2>Giao dịch gần đây</h2><button data-page="flow">Xem tất cả</button></div><div class="v44-card">${txRows(c.all,5)}</div>`;
  }

  function renderFlow(){
    const c=calc(); let list=c.all;
    if(flowFilter!=='all') list=list.filter(t=>typeOf(t)===flowFilter);
    if(query) list=list.filter(t=>`${t.name||''} ${t.note||''} ${t.category||''} ${t.source||t.account||''}`.toLowerCase().includes(query.toLowerCase()));
    const st=categoryStats(c.month), top=st.rows.slice(0,6);
    return `<div class="v44-eyebrow">Tháng ${Number(c.ym.slice(5))}</div><h1 class="v44-title">Dòng tiền</h1><p class="v44-sub">Hiểu tiền đi đâu trước khi xem từng giao dịch.</p>
      <div class="v44-kpis"><div class="v44-kpi feature"><small>Còn lại tháng này</small><strong>${fmt(c.left)}đ</strong><em>Thu nhập − chi tiêu − trả thẻ</em></div><div class="v44-kpi"><small>Đã chi</small><strong>${fmt(c.spend)}đ</strong><em>${st.rows.length} danh mục</em></div></div>
      <div class="v44-card v44-cat-summary"><div class="v44-cat-top"><div><span>Chi tiêu theo danh mục</span><strong>${fmt(st.total)}đ</strong></div><span>${top[0]?`Top · ${esc(top[0].category)}`:''}</span></div>${top.map(r=>{const pct=st.total?Math.round(r.amount/st.total*100):0,w=Math.max(6,Math.round(r.amount/st.max*100));return `<div class="v44-cat-row"><div><div class="v44-cat-label"><b>${esc(r.category)}</b><em>${pct}%</em></div><div class="v44-cat-bar"><i style="width:${w}%"></i></div></div><div class="v44-cat-amt">${fmt(r.amount)}đ</div></div>`}).join('')||'<p class="v44-sub">Chưa có chi tiêu tháng này.</p>'}</div>
      <div class="v44-section-head"><h2>Lịch sử</h2><button id="v44ClearSearch">Đặt lại</button></div><div class="v44-tabs">${[['all','Tất cả'],['spending','Chi tiêu'],['debt','Trả thẻ'],['income','Thu nhập'],['transfer','Chuyển tiền']].map(([k,v])=>`<button class="v44-tabpill ${flowFilter===k?'active':''}" data-filter="${k}">${v}</button>`).join('')}</div><input id="v44Search" class="v44-search" value="${esc(query)}" placeholder="Tìm giao dịch, danh mục, nguồn..."><div class="v44-card">${txRows(list)}</div>`;
  }

  function renderPlan(){
    const c=calc(), s=load(), budgets=Array.isArray(s.budgets)?s.budgets:[], spendMap=new Map(); c.month.filter(t=>typeOf(t)==='spending').forEach(t=>spendMap.set(t.category||'Khác',(spendMap.get(t.category||'Khác')||0)+(+t.amount||0)));
    const limit=budgets.reduce((x,b)=>x+(+b.limit||0),0), remain=Math.max(0,limit-c.spend), used=limit?Math.min(100,Math.round(c.spend/limit*100)):0, goal=s.goal||{name:'Quỹ mục tiêu',target:0,saved:c.savings}, gp=goal.target?Math.min(100,Math.round((+goal.saved||0)/(+goal.target||1)*100)):0;
    return `<div class="v44-eyebrow">Kế hoạch tháng</div><h1 class="v44-title">Tiêu có chủ đích.</h1><p class="v44-sub">Một nơi duy nhất cho ngân sách và mục tiêu tiết kiệm.</p>
      <div class="v44-card v44-plan-hero"><small>Còn có thể chi trong ngân sách</small><strong>${fmt(remain)}đ</strong><div class="v44-cat-bar" style="background:#ffffff50;margin-top:14px"><i style="width:${used}%;background:#241a0d"></i></div><p class="v44-sub" style="color:#5f4a23;margin:8px 0 0">Đã dùng ${used}% · ${fmt(c.spend)}đ / ${fmt(limit)}đ</p></div>
      <div class="v44-section-head"><h2>Ngân sách</h2><button onclick="document.querySelector('[data-page=settings]').click()">Điều chỉnh</button></div><div class="v44-card">${budgets.map(b=>{const usedAmt=spendMap.get(b.name)||0,p=b.limit?Math.min(100,Math.round(usedAmt/b.limit*100)):0;return `<div class="v44-budget-row"><div class="line"><b>${esc(b.name)}</b><span>${fmt(usedAmt)}đ / ${fmt(b.limit)}đ</span></div><div class="bar"><i style="width:${p}%"></i></div></div>`}).join('')||'<p class="v44-sub">Chưa có ngân sách.</p>'}</div>
      <div class="v44-section-head"><h2>Mục tiêu tiết kiệm</h2><span class="v44-eyebrow">${gp}%</span></div><div class="v44-card"><div class="v44-cat-top"><div><span>${esc(goal.name||'Quỹ mục tiêu')}</span><strong>${fmt(goal.saved||c.savings)}đ</strong></div><span>Mục tiêu ${fmt(goal.target||0)}đ</span></div><div class="v44-cat-bar" style="height:7px"><i style="width:${gp}%"></i></div></div>`;
  }

  function renderSettings(){
    const theme=localStorage.getItem(THEME)==='dark'?'dark':'light', c=calc();
    return `<div class="v44-eyebrow">Cài đặt</div><h1 class="v44-title">Gọn và riêng tư.</h1><p class="v44-sub">Dữ liệu vẫn nằm trên thiết bị này. Chỉ giữ những gì bạn thật sự cần.</p>
      <div class="v44-card"><div class="v44-setting"><div><b>Giao diện</b><small>${theme==='dark'?'Dark mode':'Light mode'}</small></div><button id="v44ThemeInline">${theme==='dark'?'Chuyển sáng':'Chuyển tối'}</button></div><div class="v44-setting"><div><b>Số dư tài khoản</b><small>Tiền mặt ${fmt(c.cash)}đ · Tiết kiệm ${fmt(c.savings)}đ</small></div><button id="v44Balances">Chỉnh</button></div></div>
      <div class="v44-section-head"><h2>Dữ liệu</h2></div><div class="v44-card"><div class="v44-setting"><div><b>Xuất bản sao lưu</b><small>Lưu JSON vào Files / iCloud Drive</small></div><button id="v44Export">Xuất</button></div><div class="v44-setting"><div><b>Khôi phục dữ liệu</b><small>Đọc lại file backup JSON</small></div><button id="v44Import">Nhập</button></div><div class="v44-setting"><div><b>Xóa dữ liệu</b><small>Không thể hoàn tác nếu chưa backup</small></div><button class="v44-danger" id="v44Reset">Xóa</button></div></div><input id="v44ImportFile" type="file" accept="application/json" hidden>`;
  }

  function app(){
    const root=document.getElementById('v44App'); if(!root)return;
    root.innerHTML=`<div class="v44-top"><div class="v44-brand"><strong>Money Journal</strong><small>Moonlit Edition</small></div><button class="v44-theme" id="v44Theme">${localStorage.getItem(THEME)==='dark'?'☀︎':'◐'}</button></div>
      <main id="v44-home" class="v44-page ${active==='home'?'active':''}">${renderHome()}</main><main id="v44-flow" class="v44-page ${active==='flow'?'active':''}">${renderFlow()}</main><main id="v44-plan" class="v44-page ${active==='plan'?'active':''}">${renderPlan()}</main><main id="v44-settings" class="v44-page ${active==='settings'?'active':''}">${renderSettings()}</main>`;
    bind();
  }

  function switchPage(page){active=page;app();document.querySelectorAll('.v44-nav button[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));window.scrollTo({top:0,behavior:'smooth'})}
  function bind(){
    document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>switchPage(b.dataset.page));
    document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openEdit(b.dataset.edit));
    document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{flowFilter=b.dataset.filter;app()});
    const s=document.getElementById('v44Search');if(s)s.oninput=e=>{query=e.target.value;setTimeout(app,120)};
    const clr=document.getElementById('v44ClearSearch');if(clr)clr.onclick=()=>{query='';flowFilter='all';app()};
    const th=document.getElementById('v44Theme');if(th)th.onclick=toggleTheme;
    const thi=document.getElementById('v44ThemeInline');if(thi)thi.onclick=toggleTheme;
    document.getElementById('v44Balances')?.addEventListener('click',openBalances);
    document.getElementById('v44Export')?.addEventListener('click',exportData);
    document.getElementById('v44Import')?.addEventListener('click',()=>document.getElementById('v44ImportFile').click());
    document.getElementById('v44ImportFile')?.addEventListener('change',e=>importData(e.target.files[0]));
    document.getElementById('v44Reset')?.addEventListener('click',()=>{if(confirm('Xóa toàn bộ dữ liệu local?')){localStorage.removeItem(KEY);location.reload()}});
  }

  function toggleTheme(){const next=localStorage.getItem(THEME)==='dark'?'light':'dark';localStorage.setItem(THEME,next);document.documentElement.setAttribute('data-theme',next);document.documentElement.style.colorScheme=next;app()}
  function openOverlay(html){const o=document.getElementById('v44Overlay');o.innerHTML=`<div class="v44-sheet">${html}</div>`;o.classList.add('show');o.onclick=e=>{if(e.target===o)o.classList.remove('show')}}
  function closeOverlay(){document.getElementById('v44Overlay')?.classList.remove('show')}
  function addMenu(){openOverlay(`<h3>Thêm vào Money Journal</h3><button class="v44-choice" id="v44Manual"><b>Giao dịch thủ công</b><small>Nhập nhanh một khoản thu, chi, trả thẻ hoặc chuyển tiền.</small></button><button class="v44-choice" id="v44Scan"><b>Quét sao kê</b><small>Dùng luồng OCR hiện có để đọc ảnh/PDF rồi kiểm tra lại.</small></button>`);document.getElementById('v44Manual').onclick=openManual;document.getElementById('v44Scan').onclick=()=>{closeOverlay();document.body.classList.remove('v44-live');document.getElementById('v44App').style.display='none';document.getElementById('v44Nav').style.display='none';document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));const scan=document.getElementById('scan');scan?.classList.add('active');document.querySelector('.bottom')?.style.setProperty('display','grid','important')};}
  function openManual(){openEdit(null)}
  function openEdit(id){const s=load();const t=id?s.transactions?.find(x=>String(x.id)===String(id)):null;editing=id||null;openOverlay(`<h3>${t?'Chỉnh giao dịch':'Thêm giao dịch'}</h3><div class="v44-form"><label>Loại<select id="v44EType">${types.map(([k,v])=>`<option value="${k}" ${typeOf(t)===k?'selected':''}>${v}</option>`).join('')}</select></label><label>Danh mục<select id="v44ECat">${cats().map(c=>`<option ${t?.category===c?'selected':''}>${c}</option>`).join('')}</select></label><label>Số tiền<input id="v44EAmt" inputmode="numeric" value="${t?fmt(t.amount):''}"></label><label>Ngày<input id="v44EDate" type="date" value="${t?.date||new Date().toISOString().slice(0,10)}"></label><label class="full">Nguồn<select id="v44ESource">${sources().map(c=>`<option ${String(t?.source||t?.account)===c?'selected':''}>${c}</option>`).join('')}</select></label><label class="full">Ghi chú<input id="v44ENote" value="${esc(t?.note||t?.name||'')}"></label></div><div class="v44-actions">${t?'<button class="v44-secondary v44-danger" id="v44Delete">Xóa</button>':''}<button class="v44-secondary" id="v44Cancel">Hủy</button><button class="v44-primary" id="v44Save">Lưu</button></div>`);document.getElementById('v44Cancel').onclick=closeOverlay;document.getElementById('v44Save').onclick=saveEdit;if(t)document.getElementById('v44Delete').onclick=deleteEdit;}
  function saveEdit(){const s=load();s.transactions=Array.isArray(s.transactions)?s.transactions:[];const amount=Number(String(document.getElementById('v44EAmt').value).replace(/[^\d]/g,''))||0;const data={id:editing||`tx-${Date.now()}`,type:document.getElementById('v44EType').value,category:document.getElementById('v44ECat').value,amount,date:document.getElementById('v44EDate').value,source:document.getElementById('v44ESource').value,account:document.getElementById('v44ESource').value,note:document.getElementById('v44ENote').value.trim()};data.name=data.note||data.category;if(editing){const i=s.transactions.findIndex(x=>String(x.id)===String(editing));if(i>=0)s.transactions[i]={...s.transactions[i],...data}}else s.transactions.push(data);store(s);closeOverlay();app()}
  function deleteEdit(){const s=load();s.transactions=(s.transactions||[]).filter(x=>String(x.id)!==String(editing));store(s);closeOverlay();app()}
  function openBalances(){const s=load(),a=Array.isArray(s.accounts)?s.accounts:[],cash=a.find(x=>x.name==='Tiền mặt')?.balance||0,save=a.find(x=>x.name==='Tiết kiệm')?.balance||0;openOverlay(`<h3>Chỉnh số dư</h3><div class="v44-form"><label>Tiền mặt<input id="v44Cash" inputmode="numeric" value="${fmt(cash)}"></label><label>Tiết kiệm<input id="v44Savings" inputmode="numeric" value="${fmt(save)}"></label></div><div class="v44-actions"><button class="v44-secondary" id="v44Cancel">Hủy</button><button class="v44-primary" id="v44BalSave">Lưu</button></div>`);document.getElementById('v44Cancel').onclick=closeOverlay;document.getElementById('v44BalSave').onclick=()=>{const s=load();s.accounts=Array.isArray(s.accounts)?s.accounts:[];const set=(name,val,type)=>{let a=s.accounts.find(x=>x.name===name);if(a)a.balance=val;else s.accounts.push({id:'acc-'+Date.now()+name,name,balance:val,type})};set('Tiền mặt',Number(document.getElementById('v44Cash').value.replace(/[^\d]/g,''))||0,'cash');set('Tiết kiệm',Number(document.getElementById('v44Savings').value.replace(/[^\d]/g,''))||0,'savings');store(s);closeOverlay();app()}}
  function exportData(){const blob=new Blob([JSON.stringify(load(),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`money-journal-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href)}
  function importData(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{const s=JSON.parse(r.result);store(s);app();alert('Đã khôi phục dữ liệu.')}catch{alert('File backup không hợp lệ.')}};r.readAsText(file)}

  function mount(){
    if(document.getElementById('v44App'))return;document.body.classList.add('v44-live');document.documentElement.setAttribute('data-theme',localStorage.getItem(THEME)==='dark'?'dark':'light');
    document.body.insertAdjacentHTML('beforeend',`<div id="v44App"></div><nav id="v44Nav" class="v44-nav"><button class="active" data-page="home">Tổng quan</button><button data-page="flow">Dòng tiền</button><button class="add" id="v44Add"><span>＋</span><small>Thêm</small></button><button data-page="plan">Kế hoạch</button><button data-page="settings">Cài đặt</button></nav><div id="v44Overlay" class="v44-overlay"></div>`);app();document.getElementById('v44Add').onclick=addMenu;document.querySelectorAll('#v44Nav [data-page]').forEach(b=>b.onclick=()=>switchPage(b.dataset.page));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,700));else setTimeout(mount,700);
})();