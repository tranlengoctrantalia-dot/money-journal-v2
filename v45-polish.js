(() => {
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  function removeRedundantHomeMonth(){
    const home=$('#v44-home'); if(!home)return;
    const heads=$$('.v44-section-head',home);
    for(const h of heads){
      const title=$('h2',h)?.textContent?.trim();
      if(title==='Tháng này'){
        h.classList.add('v45-home-monthly-hidden');
        const next=h.nextElementSibling;
        if(next?.classList.contains('v44-grid2')) next.classList.add('v45-home-monthly-hidden');
      }
    }
  }

  function polishAddSheets(){
    $$('.v44-sheet').forEach(sheet=>{
      if(!$('.v44-choice',sheet))return;
      sheet.classList.add('v45-add-sheet');
      if(!$('.v45-add-title',sheet)){
        const firstH=$('h3',sheet);
        const title=document.createElement('h2');
        title.className='v45-add-title';
        title.textContent='Thêm vào Money Journal';
        const sub=document.createElement('p');
        sub.className='v45-add-sub';
        sub.textContent='Chọn cách nhanh nhất. Bạn luôn có thể chỉnh lại trước khi lưu.';
        if(firstH){firstH.replaceWith(title);title.after(sub)}else sheet.prepend(sub),sheet.prepend(title);
      }
      const choices=$$('.v44-choice',sheet);
      choices.forEach(btn=>{
        const txt=(btn.textContent||'').toLowerCase();
        const b=$('b',btn); const small=$('small',btn);
        if(/thủ công|giao dịch/.test(txt) && b){b.textContent='Ghi giao dịch'}
        if(/ảnh/.test(txt) && b){b.textContent='Quét ảnh sao kê'}
        if(/pdf/.test(txt) && b){b.textContent='Quét PDF'}
        if(small){
          if(/thủ công|giao dịch/.test(txt))small.textContent='Nhập nhanh số tiền, loại giao dịch và ghi chú.';
          else if(/ảnh/.test(txt))small.textContent='Chọn ảnh sao kê và kiểm tra giao dịch trước khi lưu.';
          else if(/pdf/.test(txt))small.textContent='Đọc sao kê PDF rồi rà lại từng giao dịch.';
        }
      });
    });
  }

  function addFlowPeriodContext(){
    const flow=$('#v44-flow'); if(!flow)return;
    if($('.v45-period',flow))return;
    const eyebrow=$('.v44-eyebrow',flow);
    if(!eyebrow)return;
    const m=(eyebrow.textContent||'').match(/Tháng\s+(\d+)/i)?.[1];
    const chip=document.createElement('div');
    chip.className='v45-period';
    chip.textContent=m?`Đang xem dữ liệu tháng ${m}`:'Đang xem kỳ gần nhất';
    const sub=$('.v44-sub',flow);
    if(sub)sub.after(chip); else eyebrow.after(chip);
  }

  function polishCopy(){
    const flow=$('#v44-flow');
    if(flow){
      const title=$('.v44-title',flow); if(title)title.textContent='Dòng tiền';
      const sub=$('.v44-sub',flow); if(sub)sub.textContent='Xem tiền đi đâu, sau đó mới xuống lịch sử giao dịch.';
    }
    const plan=$('#v44-plan');
    if(plan){
      const title=$('.v44-title',plan); if(title)title.textContent='Kế hoạch';
      const sub=$('.v44-sub',plan); if(sub)sub.textContent='Ngân sách và mục tiêu tiết kiệm, không trộn thêm thứ khác.';
    }
  }

  function run(){removeRedundantHomeMonth();polishAddSheets();addFlowPeriodContext();polishCopy()}
  const obs=new MutationObserver(()=>requestAnimationFrame(run));
  function boot(){run();obs.observe(document.body,{childList:true,subtree:true});setTimeout(run,500);setTimeout(run,1800)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
