(() => {
  const KEY='money_journal_v2_state';
  const fmt=n=>(Number(n)||0).toLocaleString('vi-VN');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const typeOf=t=>{const x=String(t?.type||'');if(x==='money_in')return'moneyin';if(x==='debt_payment')return'debt';return x};
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
  let selected=null;

  function months(){
    const tx=Array.isArray(load().transactions)?load().transactions:[];
    return [...new Set(tx.map(t=>String(t.date||'').slice(0,7)).filter(x=>/^\d{4}-\d{2}$/.test(x)))].sort().reverse();
  }
  function label(ym){const [y,m]=ym.split('-');return `Tháng ${Number(m)}/${y}`}
  function sum(arr,type){return arr.filter(t=>typeOf(t)===type).reduce((s,t)=>s+(+t.amount||0),0)}
  function catStats(arr){const map=new Map();arr.filter(t=>typeOf(t)==='spending').forEach(t=>{const c=t.category||'Khác';map.set(c,(map.get(c)||0)+(+t.amount||0))});const rows=[...map].map(([category,amount])=>({category,amount})).sort((a,b)=>b.amount-a.amount);return{rows,total:rows.reduce((s,r)=>s+r.amount,0),max:rows[0]?.amount||1}}
  function txRows(arr){return [...arr].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).map(t=>`<button class="v44-tx" data-edit="${esc(t.id)}"><span><b>${esc(t.note||t.name||'Giao dịch')}</b><small>${esc(t.category||'Khác')} · ${esc(t.source||t.account||'')}</small></span><span class="money"><strong>${fmt(t.amount)}đ</strong><small>${String(t.date||'').split('-').reverse().join('/')}</small></span><span class="v44-chev">›</span></button>`).join('')||'<div class="v46-no-data">Chưa có giao dịch trong tháng này.</div>'}

  function rebuildFlow(){
    const flow=document.getElementById('v44-flow'); if(!flow||!flow.classList.contains('active'))return;
    const ms=months(); if(!ms.length)return;
    if(!selected||!ms.includes(selected))selected=ms[0];
    const all=Array.isArray(load().transactions)?load().transactions:[];
    const month=all.filter(t=>String(t.date||'').startsWith(selected));
    const income=sum(month,'income'), spend=sum(month,'spending'), debt=sum(month,'debt'), moneyin=sum(month,'moneyin'), refund=sum(month,'refund');
    const left=income+moneyin-spend-debt+refund; const st=catStats(month); const top=st.rows.slice(0,6);
    flow.innerHTML=`<div class="v44-eyebrow">Dòng tiền</div><h1 class="v44-title">${label(selected)}</h1><div class="v46-period-wrap"><span class="v46-period-label">Xem lại lịch sử theo tháng</span><select class="v46-month-select" id="v46Month">${ms.map(m=>`<option value="${m}" ${m===selected?'selected':''}>${label(m)}</option>`).join('')}</select></div><div class="v44-kpis"><div class="v44-kpi feature"><small>Còn lại</small><strong>${fmt(left)}đ</strong><em>Thu nhập − chi tiêu − trả thẻ</em></div><div class="v44-kpi"><small>Đã chi</small><strong>${fmt(spend)}đ</strong><em>${st.rows.length} danh mục</em></div></div><div class="v44-card v44-cat-summary"><div class="v44-cat-top"><div><span>Chi tiêu theo danh mục</span><strong>${fmt(st.total)}đ</strong></div><span>${top[0]?`Top · ${esc(top[0].category)}`:''}</span></div>${top.map(r=>{const pct=st.total?Math.round(r.amount/st.total*100):0,w=Math.max(6,Math.round(r.amount/st.max*100));return `<div class="v44-cat-row"><div><div class="v44-cat-label"><b>${esc(r.category)}</b><em>${pct}%</em></div><div class="v44-cat-bar"><i style="width:${w}%"></i></div></div><div class="v44-cat-amt">${fmt(r.amount)}đ</div></div>`}).join('')||'<div class="v46-no-data">Chưa có chi tiêu trong tháng này.</div>'}</div><div class="v44-section-head"><h2>Giao dịch</h2><span class="v44-eyebrow">${month.length} dòng</span></div><div class="v44-card">${txRows(month)}</div>`;
    document.getElementById('v46Month').onchange=e=>{selected=e.target.value;rebuildFlow()};
    flow.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{const id=b.dataset.edit; const old=document.querySelector(`[data-edit="${CSS.escape(id)}"]`); if(old&&old!==b)old.click();});
  }

  function removeLegacyAnalytics(){
    [...document.body.children].forEach(el=>{
      if(el.id==='v44App'||el.classList?.contains('v44-nav')||el.classList?.contains('v44-overlay')||el.tagName==='SCRIPT')return;
      const t=(el.textContent||'').trim();
      if(/^Analytics tháng này/i.test(t)||/Chi tiêu theo categoryNet of refund/i.test(t))el.classList.add('v46-hidden-legacy');
    });
  }
  function run(){removeLegacyAnalytics();rebuildFlow()}
  const obs=new MutationObserver(()=>requestAnimationFrame(run));
  function boot(){run();obs.observe(document.body,{childList:true,subtree:true});setTimeout(run,900);setTimeout(run,2200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
