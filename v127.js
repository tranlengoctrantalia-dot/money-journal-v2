(()=>{
const KEY='money_journal_v2_state';
const fmt=n=>(+n||0).toLocaleString('vi-VN')+'đ';
const PLAN=[
  {name:'Gửi mẹ giữ hộ',amount:10000000,kind:'save',note:'Tiết kiệm / tài sản, không tính là chi tiêu'},
  {name:'iPhone mới · trả góp',amount:2784000,kind:'fixed',note:'33.408.000đ / 12 tháng · 0% · kỳ đầu 25/10'},
  {name:'Cellphones cũ · trả góp',amount:578835,kind:'fixed',note:'Khoản trả góp cũ vẫn tiếp tục'},
  {name:'Hẹn hò · phần của bạn',amount:1000000,kind:'life',note:'Phần ngân sách của bạn'},
  {name:'Gym',amount:500000,kind:'life',note:'Cố định'},
  {name:'Ăn uống · cà phê',amount:300000,kind:'life',note:'Phần còn lại trong cap sinh hoạt 500k'},
  {name:'Đi lại',amount:200000,kind:'life',note:'Cap riêng theo tháng'},
  {name:'Góp quỹ Đà Lạt',amount:500000,kind:'life',note:'Quỹ chung cho chuyến 21–23/11'},
  {name:'Quỹ dự phòng riêng',amount:500000,kind:'reserve',note:'Tiền bạn tự giữ, không chuyển đi'}
];
const SALARY=17000000, CURRENT_AFTER_SHINHAN=1339301;
function inject(){
  const screen=document.querySelector('#screen');
  if(!screen||screen.querySelector('#planV127')) return;
  const h=screen.querySelector('.page-head h1');
  if(!h||!h.textContent.includes('Kế hoạch')) return;
  const allocated=PLAN.reduce((s,x)=>s+x.amount,0);
  const unallocated=Math.max(0,SALARY-allocated);
  const tripCash=1000000;
  const phoneTotal=2784000+578835;
  const html=`<section id="planV127" class="plan127">
    <div class="plan127-top">
      <div><small>THÁNG TỚI · LƯƠNG DỰ KIẾN</small><h2>${fmt(SALARY)}</h2></div>
      <span class="plan127-chip ${allocated===SALARY?'ok':'warn'}">${allocated===SALARY?'Đã chia đủ 100%':'Còn '+fmt(unallocated)+' chưa chia'}</span>
    </div>
    <div class="plan127-buckets">
      ${PLAN.map(x=>`<div class="plan127-row ${x.kind}"><span><b>${x.name}</b><small>${x.note}</small></span><strong>${fmt(x.amount)}</strong></div>`).join('')}
      ${unallocated?`<div class="plan127-row reserve"><span><b>Buffer chưa phân bổ</b><small>Giữ linh hoạt, ưu tiên cộng vào dự phòng nếu không phát sinh</small></span><strong>${fmt(unallocated)}</strong></div>`:''}
    </div>
    <div class="plan127-total"><span>Tổng đã phân bổ</span><b>${fmt(allocated)}</b></div>
    <div class="plan127-note">Tổng trả góp điện thoại tháng tới: <b>${fmt(phoneTotal)}</b> = iPhone mới ${fmt(2784000)} + Cellphones cũ ${fmt(578835)}. Ăn uống/cà phê và đi lại đã tách riêng 300k / 200k. Còn <b>${fmt(unallocated)}</b> làm buffer.</div>
    <div class="plan127-trip">
      <div class="plan127-trip-head"><span><small>21–23/11</small><h3>Đà Lạt</h3></span><em>Góp quỹ tháng tới ${fmt(500000)}</em></div>
      <div class="plan127-trip-grid"><div><small>Sau trả Shinhan</small><b>~${fmt(CURRENT_AFTER_SHINHAN)}</b></div><div><small>Cash emergency mang theo</small><b>${fmt(tripCash)}</b></div><div><small>Dư linh hoạt hiện tại</small><b>~${fmt(Math.max(0,CURRENT_AFTER_SHINHAN-tripCash))}</b></div></div>
      <p>Quỹ chung Đà Lạt tách riêng khỏi <b>1.000.000đ cash emergency</b> mang theo người.</p>
    </div>
  </section>`;
  const anchor=screen.querySelector('.section-head');
  if(anchor) anchor.insertAdjacentHTML('beforebegin',html); else screen.insertAdjacentHTML('afterbegin',html);
}
const ob=new MutationObserver(()=>requestAnimationFrame(inject));
const screen=document.querySelector('#screen');
if(screen) ob.observe(screen,{childList:true,subtree:true});
setTimeout(inject,60);
})();