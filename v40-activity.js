(() => {
  const fmt=n=>(Number(n)||0).toLocaleString('vi-VN');
  const ICONS={'Ăn uống':'🍜','Di chuyển':'🚕','Mua sắm':'🛍️','Hẹn hò':'💞','Giải trí':'🎬','Hóa đơn':'🧾','Sức khỏe':'✦','Gym & sức khỏe':'✦','Làm đẹp':'✧','Dịch vụ số':'⌘','Quà tặng':'🎁','Phí':'％','Khác':'•'};
  const normalizeType=t=>{const x=String(t?.type||'');if(x==='debt_payment')return'debt';if(x==='money_in')return'moneyin';return x};
  let period='all';
  function months(){
    if(typeof state==='undefined'||!Array.isArray(state.transactions))return[];
    return [...new Set(state.transactions.filter(t=>normalizeType(t)==='spending'&&/^\d{4}-\d{2}/.test(t.date||'')).map(t=>String(t.date).slice(0,7)))].sort().reverse();
  }
  function labelMonth(ym){if(ym==='all')return'Tất cả';const [y,m]=ym.split('-');return `Tháng ${Number(m)}/${y}`}
  function rows(){
    if(typeof state==='undefined'||!Array.isArray(state.transactions))return[];
    return state.transactions.filter(t=>normalizeType(t)==='spending'&&(period==='all'||String(t.date||'').startsWith(period)));
  }
  function stats(){const map=new Map();for(const t of rows()){const c=String(t.category||'Khác').trim()||'Khác';map.set(c,(map.get(c)||0)+(Number(t.amount)||0))}const arr=[...map.entries()].map(([category,amount])=>({category,amount})).sort((a,b)=>b.amount-a.amount);return{arr,total:arr.reduce((s,r)=>s+r.amount,0)}}
  function ensure(){
    if(document.getElementById('v40Stats'))return;
    const activity=document.getElementById('activity');if(!activity)return;
    const list=document.getElementById('activityList');if(!list)return;
    const node=document.createElement('section');node.id='v40Stats';node.className='v40-stats';list.before(node);
  }
  function render(){
    ensure();const root=document.getElementById('v40Stats');if(!root)return;
    const ms=months();if(period!=='all'&&!ms.includes(period))period=ms[0]||'all';
    const {arr,total}=stats(),top=arr.slice(0,6),max=top[0]?.amount||1;
    root.innerHTML=`<div class="v40-card"><div class="v40-head"><div><small>Thống kê chi tiêu</small><h3>Theo danh mục</h3></div><div class="v40-total"><span>${labelMonth(period)}</span><strong>${fmt(total)}đ</strong></div></div><div class="v40-months"><button data-p="all" class="${period==='all'?'active':''}">Tất cả</button>${ms.map(m=>`<button data-p="${m}" class="${period===m?'active':''}">${labelMonth(m)}</button>`).join('')}</div>${top.length?`<div class="v40-list">${top.map(r=>{const pct=total?Math.round(r.amount/total*100):0;const w=Math.max(8,Math.round(r.amount/max*100));return `<button class="v40-row" data-cat="${String(r.category).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}"><span class="v40-icon">${ICONS[r.category]||'•'}</span><span class="v40-mid"><span class="v40-label"><b>${r.category}</b><em>${pct}%</em></span><span class="v40-track"><i style="width:${w}%"></i></span></span><span class="v40-amt">${fmt(r.amount)}đ</span></button>`}).join('')}</div>`:`<div class="v40-empty">Chưa có chi tiêu trong kỳ này.</div>`}</div>`;
    root.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{period=b.dataset.p;render()});
    root.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{const s=document.getElementById('search');if(s){s.value=b.dataset.cat;s.dispatchEvent(new Event('input',{bubbles:true}));s.scrollIntoView({behavior:'smooth',block:'center'})}});
  }
  function boot(){render();setTimeout(render,1000);setTimeout(render,5200);document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.tab==='activity')setTimeout(render,80)}));document.getElementById('search')?.addEventListener('input',()=>setTimeout(render,0));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,5600));else setTimeout(boot,5600);
})();
