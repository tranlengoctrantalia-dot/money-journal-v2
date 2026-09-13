(()=>{
const KEY='money_journal_v2_state';
const fmt=n=>(+n||0).toLocaleString('vi-VN');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));

function load(){
  try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return{}}
}
function save(s){localStorage.setItem(KEY,JSON.stringify(s))}

const DATING_TOTALS={'2026-08':3831522,'2026-09':561600};
const SEED=[
  {id:'p_202608_dating',month:'2026-08',kind:'due',label:'Phần partner chi hẹn hò tháng 8',amount:2554348,note:'Tổng hẹn hò tháng 8: 3.831.522đ · partner chịu 2/3 = 2.554.348đ'},
  {id:'p_202608_buyfor',month:'2026-08',kind:'due',label:'Mua giùm partner tháng 8',amount:344209,note:'TikTok Shop 159.297đ + Shopee 184.912đ'},
  {id:'p_202608_bday',month:'2026-08',kind:'due',label:'Quà sinh nhật',amount:1000000,note:'Khoản partner cần hoàn thêm tháng 8'},
  {id:'p_202608_paid_45',month:'2026-08',kind:'paid',label:'Partner đã chuyển',amount:4500000,note:'Đã nhận 4.500.000đ cho đối soát tháng 8'},
  {id:'p_202608_refund_600',month:'2026-08',kind:'refund',label:'Bạn hoàn lại partner',amount:600000,note:'Đã refund 600.000đ sau khi partner chuyển 4.500.000đ'},
  {id:'p_202609_dating',month:'2026-09',kind:'due',label:'Phần partner chi hẹn hò tháng 9',amount:374400,note:'Tổng hẹn hò tháng 9 hiện biết: 561.600đ · partner chịu 2/3 = 374.400đ'},
  {id:'p_202609_buyfor',month:'2026-09',kind:'due',label:'Mua giùm partner tháng 9',amount:255200,note:'Shopee 08/09 đã confirm mua giùm partner'}
];

function migrate(){
  const s=load();
  s.partnerLedger=Array.isArray(s.partnerLedger)?s.partnerLedger:[];
  s.transactions=Array.isArray(s.transactions)?s.transactions:[];
  // Remove superseded/provisional partner payment rows.
  s.partnerLedger=s.partnerLedger.filter(x=>!['p_202608_paid'].includes(x.id));
  SEED.forEach(x=>{
    const i=s.partnerLedger.findIndex(y=>y.id===x.id);
    if(i<0)s.partnerLedger.push(x);
    else s.partnerLedger[i]={...s.partnerLedger[i],...x};
  });
  // Confirmed personal spending: gym 500k in September.
  const gym={id:'tx_20260913_gym_500',type:'spending',amount:500000,date:'2026-09-13',category:'Sức khỏe',source:'Khác',note:'Gym tháng 9'};
  const gi=s.transactions.findIndex(x=>x.id===gym.id);
  if(gi<0)s.transactions.push(gym); else s.transactions[gi]={...s.transactions[gi],...gym};
  save(s);
}

function calcMonth(month){
  const rows=(load().partnerLedger||[]).filter(x=>x.month===month);
  const due=rows.filter(x=>x.kind==='due').reduce((a,b)=>a+(+b.amount||0),0);
  const paid=rows.filter(x=>x.kind==='paid').reduce((a,b)=>a+(+b.amount||0),0);
  const refunded=rows.filter(x=>x.kind==='refund').reduce((a,b)=>a+(+b.amount||0),0);
  const netPaid=paid-refunded;
  const balance=due-netPaid;
  return{rows,due,paid,refunded,netPaid,remain:Math.max(0,balance),credit:Math.max(0,-balance),datingTotal:DATING_TOTALS[month]||0};
}

function monthLabel(m){const[y,mo]=m.split('-');return`Tháng ${+mo}/${y}`}
function rowHtml(x){
  const paid=x.kind==='paid',refund=x.kind==='refund';
  const cls=paid?'paid':refund?'refund':'due';
  const sign=paid?'−':refund?'+':'+';
  const sub=paid?'Đã nhận':refund?'Đã hoàn lại':'Partner cần hoàn';
  return `<div class="partner-row"><div class="partner-row-main"><b>${esc(x.label)}</b><small>${esc(x.note||'')}</small></div><div class="partner-row-right"><strong class="${cls}">${sign}${fmt(x.amount)}đ</strong><small>${sub}</small></div></div>`;
}
function monthBlock(month){
  const c=calcMonth(month);
  const status=c.credit?`Dư ${fmt(c.credit)}đ`:c.remain?`Còn ${fmt(c.remain)}đ`:'Đã khớp';
  return `<div class="partner-month"><div class="partner-month-head"><b>${monthLabel(month)}</b><span>${status}</span></div><div class="partner-row"><div class="partner-row-main"><b>Tổng chi hẹn hò</b><small>Tổng spending đã confirm cho tháng này</small></div><div class="partner-row-right"><strong>${fmt(c.datingTotal)}đ</strong><small>Chi hẹn hò</small></div></div>${c.rows.map(rowHtml).join('')}<div class="partner-total"><span>Cần hoàn ${fmt(c.due)}đ · Nhận ${fmt(c.paid)}đ · Refund ${fmt(c.refunded)}đ</span><b>${status}</b></div></div>`;
}
function panel(){
  const aug=calcMonth('2026-08'),sep=calcMonth('2026-09');
  const netCarry=aug.credit-sep.remain;
  const totalRemain=Math.max(0,-netCarry);
  const totalCredit=Math.max(0,netCarry);
  return `<details class="panel partner-panel partner-private" id="partnerPanel"><summary><span><small>ĐỐI SOÁT RIÊNG</small><b>Partner</b></span><em>Nhấn để xem</em></summary><div class="partner-private-body"><div class="partner-title"><div><small>ĐỐI SOÁT PARTNER</small><h2>Partner cần hoàn</h2></div><strong>${totalRemain?fmt(totalRemain)+'đ':totalCredit?'Dư '+fmt(totalCredit)+'đ':'0đ'}</strong></div><div class="partner-summary"><div><small>T8: đã chuyển ròng</small><b>${fmt(aug.netPaid)}đ</b></div><div><small>T9 tạm cần hoàn</small><b>${fmt(sep.remain)}đ</b></div></div>${monthBlock('2026-08')}${monthBlock('2026-09')}<p class="partner-note">T8: partner chuyển 4.500.000đ, bạn đã refund 600.000đ → thực nhận ròng 3.900.000đ. Tổng hẹn hò T8 là 3.831.522đ; ngoài ra có mua giùm 344.209đ và quà sinh nhật 1.000.000đ. Phần này mặc định được ẩn để chỉ mở khi cần đối soát/cap màn hình.</p></div></details>`;
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