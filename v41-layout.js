(() => {
  const labels={home:'Tổng quan',activity:'Phân tích',scan:'Thêm',budget:'Kế hoạch',profile:'Cá nhân'};
  function relabelNav(){
    document.querySelectorAll('.nav').forEach(b=>{
      const tab=b.dataset.tab;
      if(tab==='scan'){
        b.innerHTML='<span class="fab">＋</span><small>Thêm</small>';
      }else{
        b.innerHTML=`<small>${labels[tab]||''}</small>`;
      }
    });
  }
  function relabelSections(){
    const activity=document.getElementById('activity');
    if(activity){
      const head=activity.querySelector('.section span:first-child');
      if(head)head.textContent='Phân tích';
      const search=document.getElementById('search');
      if(search)search.placeholder='Tìm trong lịch sử giao dịch...';
      const list=document.getElementById('activityList');
      if(list&&!document.getElementById('v41HistoryTitle')){
        const title=document.createElement('div');
        title.id='v41HistoryTitle';
        title.className='section';
        title.innerHTML='<span>Lịch sử giao dịch</span>';
        list.before(title);
      }
    }
    const budget=document.querySelector('#budget .section span:first-child');if(budget)budget.textContent='Kế hoạch';
    const profile=document.querySelector('#profile .section span:first-child');if(profile)profile.textContent='Cá nhân';
  }
  function cleanupIcons(){
    document.querySelectorAll('.v40-icon').forEach(el=>el.remove());
    document.querySelectorAll('.v36-tx-icon').forEach(el=>el.remove());
    document.querySelectorAll('.chip').forEach(el=>{if(/mùa trăng/i.test(el.textContent||''))el.textContent='Mùa trăng 2026'});
  }
  function boot(){
    relabelNav();relabelSections();cleanupIcons();
    setTimeout(()=>{relabelNav();relabelSections();cleanupIcons()},1200);
    setTimeout(()=>{relabelNav();relabelSections();cleanupIcons()},5200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,5900));else setTimeout(boot,5900);
})();
