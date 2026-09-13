(()=>{
const KEY='money_journal_v2_state';
const fmt=n=>(Number(n)||0).toLocaleString('vi-VN');
const norm=x=>x==='money_in'?'moneyin':x==='debt_payment'?'debt':String(x||'');
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}}
function bankBalance(){const s=load(),accounts=Array.isArray(s.accounts)?s.accounts:[],tx=Array.isArray(s.transactions)?s.transactions:[];
  const explicit=accounts.find(a=>/ngân hàng|bank|vietcombank/i.test(String(a.name||''))&&!/tiết kiệm/i.test(String(a.name||'')));
  if(explicit&&Number.isFinite(+explicit.balance)) return +explicit.balance;
  const months=[...new Set(tx.map(t=>String(t.date||'').slice(0,7)).filter(x=>/^\d{4}-\d{2}$/.test(x)))].sort().reverse();
  const ym=months[0]||new Date().toISOString().slice(0,7),rows=tx.filter(t=>String(t.date||'').startsWith(ym));
  let bal=0;
  for(const t of rows){const type=norm(t.type),amt=+t.amount||0,src=String(t.source||t.account||'').toLowerCase(),cat=String(t.category||'').toLowerCase(),name=String(t.note||t.name||'').toLowerCase();
    if(type==='income'||type==='moneyin'||type==='refund'){
      if(src.includes('tài khoản ngân hàng')||src.includes('vietcombank')||src==='') bal+=amt;
    }
    if(type==='transfer'&&(cat.includes('tiết kiệm')||name.includes('tiết kiệm'))) bal-=amt;
    if((type==='spending'||type==='debt')&&(src.includes('tài khoản ngân hàng')||src.includes('vietcombank'))) bal-=amt;
  }
  return Math.max(0,bal);
}
function iconBank(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-5 9 5M5 10v8m4-8v8m6-8v8m4-8v8M3 20h18"/></svg>'}
function patchAssets(){const grid=document.querySelector('.asset-grid');if(!grid||grid.dataset.v121==='1')return;grid.dataset.v121='1';const cards=[...grid.querySelectorAll('.asset-card')];if(cards[0]){const sm=cards[0].querySelector('small');if(sm)sm.textContent='Tiền mặt'}
  if(cards[1]){const sm=cards[1].querySelector('small');if(sm)sm.textContent='Tiết kiệm';const ic=cards[1].querySelector('.asset-icon');if(ic){ic.classList.remove('blue');ic.classList.add('save-live')}}
  const bank=document.createElement('div');bank.className='asset-card';bank.innerHTML=`<span class="asset-icon bank-live">${iconBank()}</span><small>Ngân hàng</small><b>${fmt(bankBalance())}đ</b>`;
  if(cards[1]) grid.insertBefore(bank,cards[1]); else grid.appendChild(bank);
}
function patch(){patchAssets()}
const screen=document.getElementById('screen');if(screen)new MutationObserver(()=>requestAnimationFrame(patch)).observe(screen,{childList:true,subtree:true});
window.addEventListener('DOMContentLoaded',patch);setTimeout(patch,50);setTimeout(patch,300);
})();
