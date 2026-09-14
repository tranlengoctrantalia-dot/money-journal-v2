(()=>{
const KEY='money_journal_v2_state';
const fmt=n=>(+n||0).toLocaleString('vi-VN')+'đ';
const PLAN=[
  {name:'Gửi mẹ giữ hộ',amount:10000000,kind:'save',note:'Tiết kiệm / tài sản, không tính là chi tiêu'},
  {name:'Điện thoại',amount:3000000,kind:'fixed',note:'Khoản cố định tháng tới'},
  {name:'Hẹn hò · phần của bạn',amount:1000000,kind:'life',note:'Phần ngân sách của bạn'},
  {name:'Gym',amount:500000,kind:'life',note:'Cố định'},
  {name:'Ăn uống · cà phê · đi lại',amount:500000,kind:'life',note:'Cap tháng'},
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
  const html=`<section id="planV127" class="plan127">
    <div class="plan127-top">
      <div><small>THÁNG TỚI · LƯƠNG DỰ KIẾN</small><h2>${fmt(SALARY)}</h2></div>
      <span class="plan127-chip ${allocated===SALARY?'ok':'warn'}">${allocated===SALARY?'Đã chia đủ 100%':'Còn '+fmt(unallocated)+' chưa chia'}</span>
    </div>
    <div class="plan127-buckets">
      ${PLAN.map(x=>`<div class="plan127-row ${x.kind}"><span><b>${x.name}</b><small>${x.note}</small></span><strong>${fmt(x.amount)}</strong></div>`).join('')}
      ${unallocated?`<div class="plan127-row reserve"><span><b>Chưa phân bổ</b><small>Giữ linh hoạt hoặc cộng thêm vào dự phòng</small></span><strong>${fmt(unallocated)}</strong></div>`:''}
    </div>
    <div class="plan127-total"><span>Tổng đã phân bổ</span><b>${fmt(allocated)}</b></div>
    <div class="plan127-note">Theo các khoản vừa chốt, tổng hiện tại là <b>${fmt(allocated)}</b>, chưa phải 17.000.000đ. Còn <b>${fmt(unallocated)}</b> chưa phân bổ. Tiền gửi mẹ = <b>tiết kiệm</b>, không phải spending.</div>
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