(()=>{
const KEY='money_journal_v2_state';
const fmt=n=>(+n||0).toLocaleString('vi-VN');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function load(){
  try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return{}}
}
function save(s){localStorage.setItem(KEY,JSON.stringify(s))}

const SEED=[
  {id:'p_202608_dating',month:'2026-08',kind:'due',label:'Phần partner chi hẹn hò tháng 8',amount:2554348,note:'2/3 × 3.831.522đ chi hẹn hò đã confirm'},
  {id:'p_202608_buyfor',month:'2026-08',kind:'due',label:'Mua giùm partner tháng 8',amount:344209,note:'TikTok Shop 159.297đ + Shopee 184.912đ'},
  {id:'p_202608_bday',month:'2026-08',kind:'due',label:'Quà sinh nhật',amount:1000000,note:'Khoản partner cần hoàn thêm tháng 8'},
  {id:'p_202609_dating',month:'2026-09',kind:'due',label:'Phần partner chi hẹn hò tháng 9',amount:374400,note:'Tạm tính 2/3 × 561.600đ Kimgane'},
  {id:'p_202609_buyfor',month:'2026-09',kind:'due',label:'Mua giùm partner tháng 9',amount:255200,note:'Shopee 08/09 đã confirm mua giùm partner'}
];

function migrate(){
  const s=load();
  s.partnerLedger=Array.isArray(s.partnerLedger)?s.partnerLedger:[];
  // Correction 13/09/2026: partner has NOT transferred 3,000,000đ yet.
  s.partnerLedger=s.partnerLedger.filter(x=>x.id!=='p_202608_paid');
  SEED.forEach(x=>{
    const i=s.partnerLedger.findIndex(y=>y.id===x.id);
    if(i<0)s.partnerLedger.push(x);
    else s.partnerLedger[i]={...s.partnerLedger[i],...x};
  });
  save(s);
}

function calcMonth(month){
  const rows=(load().partnerLedger||[]).filter(x=>x.month===month);
  const due=rows.filter(x=>x.kind==='due').reduce((a,b)=>a+(+b.amount||0),0);
  const paid=rows.filter(x=>x.kind==='paid').reduce((a,b)=>a+(+b.amount||0),0);
  return{rows,due,paid,remain:Math.max(0,due-paid)};
}

function monthLabel(m){const[y,mo]=m.split('-');return`Tháng ${+mo}/${y}`}
function rowHtml(x){
  const paid=x.kind==='paid';
  return `<div class="partner-row"><div class="partner-row-main"><b>${esc(x.label)}</b><small>${esc(x.note||'')}</small></div><div class="partner-row-right"><strong class="${paid?'paid':'due'}">${paid?'−':'+'}${fmt(x.amount)}đ</strong><small>${paid?'Đã nhận':'Partner cần hoàn'}</small></div></div>`;
}
function monthBlock(month){
  const c=calcMonth(month);
  return `<div class="partner-month"><div class="partner-month-head"><b>${monthLabel(month)}</b><span>Còn ${fmt(c.remain)}đ</span></div>${c.rows.map(rowHtml).join('')}<div class="partner-total"><span>Cần hoàn ${fmt(c.due)}đ · Đã nhận ${fmt(c.paid)}đ</span><b>Còn ${fmt(c.remain)}đ</b></div></div>`;
}
function panel(){
  const aug=calcMonth('2026-08'),sep=calcMonth('2026-09');
  const total=aug.remain+sep.remain;
  return `<section class="panel partner-panel" id="partnerPanel"><div class="partner-title"><div><small>ĐỐI SOÁT PARTNER</small><h2>Partner cần hoàn</h2></div><strong>${fmt(total)}đ</strong></div><div class="partner-summary"><div><small>Tháng 8 còn</small><b>${fmt(aug.remain)}đ</b></div><div><small>Tháng 9 tạm tính</small><b>${fmt(sep.remain)}đ</b></div></div>${monthBlock('2026-08')}${monthBlock('2026-09')}<p class="partner-note">Chưa ghi nhận khoản partner nào đã chuyển. Tháng 8 đã gồm quà sinh nhật 1.000.000đ. Tháng 9 phần hẹn hò đang tạm tính theo tỷ lệ partner 2/3.</p></section>`;
}
function inject(){
  const screen=document.querySelector('#screen');
  if(!screen||screen.querySelector('#partnerPanel'))return;
  const heading=screen.querySelector('.page-head h1');
  if(!heading||!heading.textContent.includes('Dòng tiền'))return;
  const summary=screen.querySelector('.summary-card');
  if(summary) summary.insertAdjacentHTML('afterend',panel());
  else screen.insertAdjacentHTML('afterbegin',panel());
}

migrate();
const ob=new MutationObserver(()=>requestAnimationFrame(inject));
const screen=document.querySelector('#screen');
if(screen)ob.observe(screen,{childList:true,subtree:true});
setTimeout(inject,50);
})();