(()=>{
const COLORS=['var(--orange)','#f47b72','var(--violet)','var(--cyan)','#83d39c','var(--blue)'];
function fixDonut(){
  const donut=document.querySelector('.donut');
  const rows=[...document.querySelectorAll('.legend-row')];
  if(!donut||!rows.length)return;
  const parts=rows.map((row,i)=>{
    const pctText=row.querySelector('span')?.textContent||'0%';
    const pct=Math.max(0,Math.min(100,parseFloat(pctText)||0));
    const dot=row.querySelector('.legend-dot');
    const color=COLORS[i%COLORS.length];
    if(dot)dot.style.background=color;
    return{pct,color};
  }).filter(x=>x.pct>0);
  if(!parts.length){donut.style.background='var(--surface2)';return}
  let cursor=0,stops=[];
  parts.forEach((p,i)=>{
    const start=cursor;
    cursor=i===parts.length-1?100:Math.min(100,cursor+p.pct);
    stops.push(`${p.color} ${start}% ${cursor}%`);
  });
  if(cursor<100)stops.push(`var(--surface2) ${cursor}% 100%`);
  donut.style.background=`conic-gradient(${stops.join(',')})`;
}
function run(){fixDonut()}
const screen=document.getElementById('screen');
if(screen)new MutationObserver(()=>requestAnimationFrame(run)).observe(screen,{childList:true,subtree:true});
window.addEventListener('DOMContentLoaded',run);
setTimeout(run,50);setTimeout(run,250);
})();
