(() => {
  const KEY='mj_theme_mode';
  const root=document.documentElement;
  const getSaved=()=>localStorage.getItem(KEY)==='dark'?'dark':'light';
  const apply=mode=>{
    root.setAttribute('data-theme',mode);
    root.style.colorScheme=mode;
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute('content',mode==='dark'?'#080d1d':'#fff8ec');
    const btn=document.getElementById('mjThemeToggle');
    if(btn){
      btn.textContent=mode==='dark'?'☀️':'🌙';
      btn.setAttribute('aria-label',mode==='dark'?'Chuyển sang chế độ sáng':'Chuyển sang chế độ tối');
      btn.title=mode==='dark'?'Chế độ sáng':'Chế độ tối';
    }
  };
  const mount=()=>{
    apply(getSaved());
    const top=document.querySelector('.top');
    if(!top||document.getElementById('mjThemeToggle'))return;
    const btn=document.createElement('button');
    btn.id='mjThemeToggle';
    btn.className='mj-theme-toggle';
    btn.type='button';
    btn.addEventListener('click',()=>{
      const next=root.getAttribute('data-theme')==='dark'?'light':'dark';
      localStorage.setItem(KEY,next);
      apply(next);
    });
    top.appendChild(btn);
    apply(getSaved());
  };
  apply(getSaved());
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
