(() => {
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const fmt=n=>(Number(n)||0).toLocaleString('vi-VN');
  const typeOf=t=>{const x=String(t?.type||'');if(x==='debt_payment')return'debt';if(x==='money_in')return'moneyin';return x};

  function setupNav(){
    const navs=$$('.nav');
    const map={home:'Tổng quan',activity:'Dòng tiền',budget:'Kế hoạch',profile:'Cài đặt'};
    navs.forEach(b=>{
      if(b.dataset.tab==='scan'){
        b.classList.add('v42-add-trigger');
        b.innerHTML='<span class="fab">＋</span><small>Thêm</small>';
        b.onclick=(e)=>{e.preventDefault();e.stopPropagation();openAddHub()};
      }else{
        const s=b.querySelector('small'); if(s&&map[b.dataset.tab])s.textContent=map[b.dataset.tab];
      }
    });
  }

  function rebuildCashflow(){
    const root=$('#activity'); if(!root||root.dataset.v42==='1')return;
    root.dataset.v42='1';
    const first=root.querySelector('.section'); if(first)first.innerHTML='<span>Dòng tiền</span><span class="v42-subtitle">Hiểu tiền đang đi đâu</span>';
    const filters=$('#filters');
    if(filters){
      filters.innerHTML='<button class="tool active" data-f="all">Tất cả</button><button class="tool" data-f="spending">Chi tiêu</button><button class="tool" data-f="debt">Trả thẻ</button>';
    }
    const search=$('#search'); if(search)search.placeholder='Tìm giao dịch, danh mục, nguồn...';
    ensureCashflowSummary();
  }

  function ensureCashflowSummary(){
    const root=$('#activity'); if(!root||$('#v42CashSummary'))return;
    const stats=$('#v40Stats');
    const node=document.createElement('section');node.id='v42CashSummary';node.className='v42-cash-summary';
    if(stats)stats.before(node);else root.querySelector('#filters')?.before(node);
    renderCashflowSummary();
  }
  function renderCashflowSummary(){
    const root=$('#v42CashSummary');if(!root||typeof state==='undefined')return;
    const tx=Array.isArray(state.transactions)?state.transactions:[];
    const spend=tx.filter(t=>typeOf(t)==='spending').reduce((s,t)=>s+(+t.amount||0),0);
    const debt=tx.filter(t=>typeOf(t)==='debt').reduce((s,t)=>s+(+t.amount||0),0);
    root.innerHTML=`<div class="v42-metric"><small>Đã chi</small><strong>${fmt(spend)}đ</strong></div><div class="v42-metric"><small>Đã trả thẻ</small><strong>${fmt(debt)}đ</strong></div>`;
  }

  function rebuildPlan(){
    const root=$('#budget'); if(!root||root.dataset.v42==='1'||typeof state==='undefined')return;
    root.dataset.v42='1';
    const budgets=Array.isArray(state.budgets)?state.budgets:[];
    const goal=state.goal||{name:'Mục tiêu tiết kiệm',target:0,saved:0};
    const spentByCat={};
    (state.transactions||[]).filter(t=>typeOf(t)==='spending').forEach(t=>{const c=t.category||'Khác';spentByCat[c]=(spentByCat[c]||0)+(+t.amount||0)});
    const budgetTotal=budgets.reduce((s,b)=>s+(+b.limit||0),0);
    const spent=budgets.reduce((s,b)=>s+(spentByCat[b.name]||0),0);
    root.innerHTML=`
      <div class="v42-page-head"><span class="v42-kicker">Kế hoạch</span><h2>Tiền tháng này</h2><p>Ngân sách và mục tiêu ở một chỗ.</p></div>
      <section class="v42-plan-hero"><div><small>Đã dùng ngân sách</small><strong>${fmt(spent)}đ</strong><span>trên ${fmt(budgetTotal)}đ</span></div><div class="v42-ring"><b>${budgetTotal?Math.min(999,Math.round(spent/budgetTotal*100)):0}%</b></div></section>
      <section class="v42-panel"><div class="v42-panel-head"><div><small>Ngân sách</small><h3>Theo danh mục</h3></div></div><div id="v42BudgetRows">${budgets.map((b,i)=>{const used=spentByCat[b.name]||0;const pct=b.limit?Math.min(100,Math.round(used/b.limit*100)):0;return `<div class="v42-budget-row"><div><b>${b.name}</b><small>${fmt(used)}đ / ${fmt(b.limit)}đ</small></div><div class="v42-plan-track"><i style="width:${pct}%"></i></div><button data-bi="${i}">Sửa</button></div>`}).join('')||'<div class="v42-empty">Chưa có ngân sách.</div>'}</div></section>
      <section class="v42-panel"><div class="v42-panel-head"><div><small>Tiết kiệm</small><h3>${goal.name||'Mục tiêu'}</h3></div><span>${goal.target?Math.round((+goal.saved||0)/(+goal.target||1)*100):0}%</span></div><div class="v42-goal-value"><strong>${fmt(goal.saved)}đ</strong><span>/ ${fmt(goal.target)}đ</span></div><div class="v42-plan-track big"><i style="width:${goal.target?Math.min(100,Math.round((+goal.saved||0)/(+goal.target||1)*100)):0}%"></i></div><button class="v42-primary" id="v42EditGoal">Chỉnh mục tiêu</button></section>`;
    root.querySelectorAll('[data-bi]').forEach(b=>b.onclick=()=>editBudget(+b.dataset.bi));
    $('#v42EditGoal')?.addEventListener('click',editGoal);
  }

  function editBudget(i){
    const b=state.budgets?.[i];if(!b)return;
    const val=prompt(`Ngân sách ${b.name} (VND)`,String(b.limit||0));
    if(val===null)return; b.limit=Number(String(val).replace(/[^\d]/g,''))||0; persistAndRefresh();
  }
  function editGoal(){
    const g=state.goal||(state.goal={name:'Quỹ mục tiêu',target:0,saved:0});
    const target=prompt('Mục tiêu tiết kiệm (VND)',String(g.target||0)); if(target===null)return;
    const saved=prompt('Đã để dành (VND)',String(g.saved||0)); if(saved===null)return;
    g.target=Number(String(target).replace(/[^\d]/g,''))||0;g.saved=Number(String(saved).replace(/[^\d]/g,''))||0;persistAndRefresh();
  }
  function persistAndRefresh(){
    try{if(typeof save==='function')save();else localStorage.setItem('money_journal_v2_state',JSON.stringify(state))}catch(e){}
    const p=$('#budget');if(p)p.dataset.v42='';rebuildPlan();renderCashflowSummary();
  }

  function rebuildSettings(){
    const root=$('#profile'); if(!root||root.dataset.v42==='1')return;
    root.dataset.v42='1';
    const theme=document.documentElement.getAttribute('data-theme')||'light';
    root.innerHTML=`
      <div class="v42-page-head"><span class="v42-kicker">Cài đặt</span><h2>Money Journal</h2><p>Giao diện và dữ liệu của bạn.</p></div>
      <section class="v42-settings-group"><h3>Giao diện</h3><button class="v42-setting" id="v42ThemeRow"><span><b>Chế độ hiển thị</b><small>${theme==='dark'?'Tối':'Sáng'}</small></span><em>${theme==='dark'?'Tối':'Sáng'}</em></button></section>
      <section class="v42-settings-group"><h3>Dữ liệu</h3><button class="v42-setting" id="v42Export"><span><b>Sao lưu dữ liệu</b><small>Lưu file JSON vào Files / iCloud</small></span><em>Xuất</em></button><button class="v42-setting" id="v42Import"><span><b>Khôi phục dữ liệu</b><small>Nhập từ file JSON đã sao lưu</small></span><em>Nhập</em></button></section>
      <section class="v42-settings-group danger"><h3>Khác</h3><button class="v42-setting" id="v42Reset"><span><b>Xóa dữ liệu trên máy</b><small>Không thể hoàn tác nếu chưa backup</small></span><em>Xóa</em></button></section>
      <div class="v42-version">Moonlit · Local-first · v4.2</div>`;
    $('#v42ThemeRow')?.addEventListener('click',()=>{document.querySelector('.mj-theme-toggle')?.click();setTimeout(()=>{root.dataset.v42='';rebuildSettings()},80)});
    $('#v42Export')?.addEventListener('click',()=>typeof exportBackup==='function'&&exportBackup());
    $('#v42Import')?.addEventListener('click',()=>{const input=document.getElementById('restore');if(input)input.click()});
    $('#v42Reset')?.addEventListener('click',()=>typeof resetData==='function'&&resetData());
  }

  function ensureAddHub(){
    if($('#v42AddHub'))return;
    document.body.insertAdjacentHTML('beforeend',`<div id="v42AddHub" class="v42-overlay"><div class="v42-add-sheet"><div class="v42-grabber"></div><div class="v42-add-head"><div><small>Thêm mới</small><h3>Bạn muốn làm gì?</h3></div><button id="v42CloseHub">×</button></div><div class="v42-add-actions"><button id="v42Manual"><b>Giao dịch thủ công</b><small>Nhập nhanh một khoản thu / chi</small></button><button id="v42Image"><b>Quét ảnh sao kê</b><small>Chọn ảnh từ thư viện</small></button><button id="v42Pdf"><b>Quét PDF sao kê</b><small>Chọn file PDF</small></button></div></div></div>`);
    $('#v42CloseHub').onclick=closeAddHub;$('#v42AddHub').onclick=e=>{if(e.target.id==='v42AddHub')closeAddHub()};
    $('#v42Manual').onclick=()=>{closeAddHub();if(typeof openAdd==='function')openAdd()};
    $('#v42Image').onclick=()=>{closeAddHub();document.getElementById('v32Images')?.click()||document.getElementById('scanFile')?.click()};
    $('#v42Pdf').onclick=()=>{closeAddHub();document.getElementById('v32PdfFile')?.click()};
  }
  function openAddHub(){ensureAddHub();$('#v42AddHub').classList.add('show');document.body.classList.add('v36-lock')}
  function closeAddHub(){$('#v42AddHub')?.classList.remove('show');document.body.classList.remove('v36-lock')}

  function hideLegacyScan(){const scan=$('#scan');if(scan)scan.classList.add('v42-hidden-scan')}

  function refreshFor(tab){
    if(tab==='activity'){rebuildCashflow();renderCashflowSummary()}
    if(tab==='budget')rebuildPlan();
    if(tab==='profile')rebuildSettings();
  }
  function boot(){
    setupNav();hideLegacyScan();rebuildCashflow();ensureAddHub();
    $$('.nav').forEach(b=>{if(b.dataset.tab!=='scan')b.addEventListener('click',()=>setTimeout(()=>refreshFor(b.dataset.tab),40))});
    setTimeout(()=>{setupNav();rebuildCashflow();},1200);
    setTimeout(()=>{setupNav();rebuildCashflow();},5200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,6100));else setTimeout(boot,6100);
})();