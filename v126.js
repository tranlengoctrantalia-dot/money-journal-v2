(()=>{
const KEY='money_journal_v2_state';
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return{}}}
function save(s){localStorage.setItem(KEY,JSON.stringify(s))}
function upsert(s,obj){
  const i=s.transactions.findIndex(x=>x.id===obj.id);
  if(i>=0)s.transactions[i]={...s.transactions[i],...obj};
  else s.transactions.push(obj);
}
const s=load();
s.transactions=Array.isArray(s.transactions)?s.transactions:[];
s.accounts=Array.isArray(s.accounts)?s.accounts:[];

// Tiết kiệm 10 triệu đã có từ 27/07/2026, không phải phát sinh tháng 9.
const oldSave=s.transactions.find(x=>x.id==='seed_save_20260907');
if(oldSave){
  oldSave.date='2026-07-27';
  oldSave.note='Khoản tiết kiệm 10 triệu đã có từ 27/07';
  oldSave.source='Tài khoản ngân hàng';
}else{
  upsert(s,{id:'seed_save_20260907',type:'transfer',amount:10000000,date:'2026-07-27',category:'Tiết kiệm',source:'Tài khoản ngân hàng',note:'Khoản tiết kiệm 10 triệu đã có từ 27/07'});
}
const sav=s.accounts.find(a=>a.name==='Tiết kiệm');
if(sav)sav.balance=10000000; else s.accounts.push({name:'Tiết kiệm',balance:10000000});

// Các khoản người dùng vừa xác nhận ngày 13/09/2026.
upsert(s,{id:'tx_20260913_send_mom_10m',type:'spending',amount:10000000,date:'2026-09-13',category:'Khác',source:'Tài khoản ngân hàng',note:'Gửi mẹ'});
upsert(s,{id:'tx_20260913_gifts_1m',type:'spending',amount:1000000,date:'2026-09-13',category:'Quà tặng',source:'Tài khoản ngân hàng',note:'Tiền quà cáp'});

save(s);
setTimeout(()=>document.querySelector('.bottom-nav [data-page="home"]')?.click(),40);
})();