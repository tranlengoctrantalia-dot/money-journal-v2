(() => {
  const $=s=>document.querySelector(s);
  const fmt=n=>(Number(n)||0).toLocaleString('vi-VN');
  function txType(t){const x=String(t?.type||'');if(x==='money_in')return'moneyin';if(x==='debt_payment')return'debt';return x}
  function decorateHero(){
    const hero=$('.hero'); if(!hero||hero.querySelector('.v37-scene'))return;
    document.body.classList.add('v37');
    hero.insertAdjacentHTML('afterbegin',`<div class="v37-scene" aria-hidden="true"><span class="v37-moon"></span><i class="v37-star s1"></i><i class="v37-star s2"></i><i class="v37-star s3"></i><i class="v37-star s4"></i><span class="v37-lantern l1"></span><span class="v37-lantern l2"></span></div>`);
    const eyebrow=hero.querySelector('.eyebrow'); if(eyebrow)eyebrow.textContent='Tài chính tháng này';
    const sub=hero.querySelector('.sub'); if(sub)sub.textContent='Thu nhập · Chi tiêu · Trả thẻ · Tiết kiệm';
    const labels=[['#hIncome','Thu nhập'],['#hMoneyIn','Tiền vào'],['#hSpend','Chi tiêu'],['#hDebt','Trả thẻ']];
    labels.forEach(([id,label])=>{const el=$(id);const box=el?.closest('.mini');const span=box?.querySelector('span');if(span)span.textContent=label});
  }
  function decorateTop(){
    const chip=$('.chip'); if(chip)chip.textContent='🌕 Mùa trăng 2026';
  }
  function ensureInsight(){
    const hero=$('.hero'); if(!hero||$('#v37Insight'))return;
    const node=document.createElement('div');node.id='v37Insight';node.className='v37-insight';
    hero.insertAdjacentElement('afterend',node);renderInsight();
  }
  function renderInsight(){
    const root=$('#v37Insight'); if(!root||typeof state==='undefined')return;
    const tx=Array.isArray(state.transactions)?state.transactions:[];
    const income=tx.filter(t=>txType(t)==='income').reduce((s,t)=>s+(+t.amount||0),0);
    const spend=tx.filter(t=>txType(t)==='spending').reduce((s,t)=>s+(+t.amount||0),0);
    const debt=tx.filter(t=>txType(t)==='debt').reduce((s,t)=>s+(+t.amount||0),0);
    const savings=(state.accounts||[]).find(a=>String(a.name).toLowerCase()==='tiết kiệm')?.balance||0;
    const pct=income?Math.min(999,Math.round(savings/income*100)):0;
    const remain=Math.max(0,income-spend-debt);
    root.innerHTML=`<span class="v37-insight-orb" aria-hidden="true"></span><div><strong>${pct?`Bạn đã để dành ${pct}% thu nhập`:'Đêm trăng tài chính'}</strong><small>${pct?`Tiết kiệm ${fmt(savings)}đ · Còn lại sau chi tiêu & trả thẻ ${fmt(remain)}đ`:'Theo dõi tiền theo cách nhẹ đầu hơn.'}</small></div><span class="v37-insight-score">${pct?`${pct}% saved`:'Moon check'}</span>`;
  }
  function relabelNavigation(){
    document.querySelectorAll('.nav').forEach(b=>{const s=b.querySelector('small');if(!s)return;const map={home:'Trang chủ',activity:'Giao dịch',scan:'Nhập',budget:'Ngân sách',profile:'Cá nhân'};if(map[b.dataset.tab])s.textContent=map[b.dataset.tab]});
    const act=$('#activity .section span'); if(act)act.textContent='Giao dịch';
    const bud=$('#budget .section span'); if(bud)bud.textContent='Ngân sách & mục tiêu';
    const pro=$('#profile .section span'); if(pro)pro.textContent='Cá nhân & dữ liệu';
  }
  function refresh(){decorateHero();decorateTop();ensureInsight();renderInsight();relabelNavigation()}
  const boot=()=>{refresh();setTimeout(refresh,1200);setTimeout(refresh,5000);document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>setTimeout(refresh,60)))};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,4700));else setTimeout(boot,4700);
})();
