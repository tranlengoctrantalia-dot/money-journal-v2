(() => {
  const fmt=n=>(Number(n)||0).toLocaleString('vi-VN');
  const normalizeType=t=>{const x=String(t?.type||'');if(x==='debt_payment')return'debt';if(x==='money_in')return'moneyin';return x};
  const ICONS={'Ăn uống':'🍜','Di chuyển':'🚕','Mua sắm':'🛍️','Hẹn hò':'💞','Giải trí':'🎬','Hóa đơn':'🧾','Sức khỏe':'✦','Gym & sức khỏe':'✦','Làm đẹp':'✧','Dịch vụ số':'⌘','Quà tặng':'🎁','Phí':'％','Khác':'•'};
  let mode='month';
  const currentYM=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`};

  function spendingRows(){
    if(typeof state==='undefined'||!Array.isArray(state.transactions))return[];
    const ym=currentYM();
    return state.transactions.filter(t=>normalizeType(t)==='spending'&&(mode==='all'||String(t.date||'').startsWith(ym)));
  }
  function stats(){
    const map=new Map();
    for(const t of spendingRows()){
      const cat=String(t.category||'Khác').trim()||'Khác';
      map.set(cat,(map.get(cat)||0)+(Number(t.amount)||0));
    }
    const rows=[...map.entries()].map(([category,amount])=>({category,amount})).sort((a,b)=>b.amount-a.amount);
    const total=rows.reduce((s,r)=>s+r.amount,0);
    return {rows,total};
  }
  function ensure(){
    if(document.getElementById('v38Categories'))return;
    const home=document.getElementById('home'); if(!home)return;
    const recent=[...home.querySelectorAll('.section')].find(x=>/giao dịch gần đây/i.test(x.textContent||''));
    const wrap=document.createElement('section');wrap.id='v38Categories';wrap.className='v38-category-section';
    if(recent)recent.before(wrap);else home.append(wrap);
  }
  function render(){
    ensure();const root=document.getElementById('v38Categories');if(!root)return;
    const {rows,total}=stats();
    const top=rows.slice(0,6), max=top[0]?.amount||1;
    root.innerHTML=`
      <div class="v38-head">
        <div><span class="v38-eyebrow">Chi tiêu</span><h3>Theo danh mục</h3></div>
        <div class="v38-seg"><button data-mode="month" class="${mode==='month'?'active':''}">Tháng này</button><button data-mode="all" class="${mode==='all'?'active':''}">Tất cả</button></div>
      </div>
      <div class="v38-card">
        <div class="v38-total"><div><small>Tổng đã chi</small><strong>${fmt(total)}đ</strong></div>${top[0]?`<span>Top · ${top[0].category}</span>`:''}</div>
        ${top.length?`<div class="v38-bars">${top.map((r,i)=>{const pct=total?Math.round(r.amount/total*100):0;const width=Math.max(8,Math.round(r.amount/max*100));return `<button class="v38-row" data-cat="${String(r.category).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}"><span class="v38-icon">${ICONS[r.category]||'•'}</span><span class="v38-main"><span class="v38-label"><b>${r.category}</b><em>${pct}%</em></span><span class="v38-track"><i style="width:${width}%"></i></span></span><strong>${fmt(r.amount)}đ</strong></button>`}).join('')}</div>`:`<div class="v38-empty">Chưa có chi tiêu trong ${mode==='month'?'tháng này':'dữ liệu hiện tại'}.</div>`}
      </div>`;
    root.querySelectorAll('.v38-seg button').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;render()});
    root.querySelectorAll('.v38-row').forEach(b=>b.onclick=()=>openCategory(b.dataset.cat));
  }
  function openCategory(cat){
    const nav=document.querySelector('.nav[data-tab="activity"]'); if(nav)nav.click();
    setTimeout(()=>{
      const search=document.getElementById('search');if(search){search.value=cat;search.dispatchEvent(new Event('input',{bubbles:true}))}
    },100);
  }
  function boot(){render();setTimeout(render,1000);setTimeout(render,4800);document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.tab==='home')setTimeout(render,50)}));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,5100));else setTimeout(boot,5100);
})();