(()=>{
const KEY='money_journal_v2_state';
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return{}}}
function save(s){localStorage.setItem(KEY,JSON.stringify(s))}
const SEED=[
{id:'seed_salary_20260910',type:'income',amount:18300000,date:'2026-09-10',category:'Lương',source:'Tài khoản ngân hàng',note:'Lương tháng 09'},
{id:'seed_friend_vp_20260910',type:'moneyin',amount:7546667,date:'2026-09-10',category:'Bạn bè hoàn trả',source:'Ngân hàng',note:'Bạn hoàn VPBank 7.546.667đ'},
{id:'seed_save_20260907',type:'transfer',amount:10000000,date:'2026-09-07',category:'Tiết kiệm',source:'Ngân hàng',note:'Chuyển vào tiết kiệm'},
{id:'seed_kimgane_20260906',type:'spending',amount:561600,date:'2026-09-06',category:'Hẹn hò',source:'Shinhan',note:'KIMGANE TB'},
{id:'seed_cellphones_20260907',type:'spending',amount:706000,date:'2026-09-07',category:'Mua sắm',source:'Shinhan',note:'CELLPHONES'},
{id:'seed_grab_20260908',type:'spending',amount:24667,date:'2026-09-08',category:'Ăn uống',source:'Shinhan',note:'Grab'},
{id:'seed_shopee_partner_20260908',type:'spending',amount:255200,date:'2026-09-08',category:'Mua sắm',source:'Shinhan',note:'Shopee · mua giùm partner'},
{id:'seed_shopee_personal_20260908',type:'spending',amount:299000,date:'2026-09-08',category:'Mua sắm',source:'Shinhan',note:'Shopee'},
{id:'tx_20260913_gym_500',type:'spending',amount:500000,date:'2026-09-13',category:'Sức khỏe',source:'Khác',note:'Gym tháng 9'},
{id:'seed_shinhan_due_20260925',type:'due',amount:10460699,date:'',due_date:'2026-09-25',category:'Thanh toán dư nợ',source:'Shinhan',note:'Shinhan · hạn 25/09'},
{id:'seed_grab_20260809',type:'spending',amount:55000,date:'2026-08-09',category:'Ăn uống',source:'Shinhan',note:'Grab'},
{id:'seed_grab_20260810',type:'spending',amount:23076,date:'2026-08-10',category:'Ăn uống',source:'Shinhan',note:'Grab'},
{id:'seed_grab_20260811',type:'spending',amount:55080,date:'2026-08-11',category:'Ăn uống',source:'Shinhan',note:'Grab'},
{id:'seed_grab_20260812',type:'spending',amount:28132,date:'2026-08-12',category:'Ăn uống',source:'Shinhan',note:'Grab'},
{id:'seed_shopee_date_20260815',type:'spending',amount:162000,date:'2026-08-15',category:'Hẹn hò',source:'Shinhan',note:'Shopee · hẹn hò'},
{id:'seed_sun_20260816',type:'spending',amount:1881306,date:'2026-08-16',category:'Hẹn hò',source:'Shinhan',note:'SUN UNDER NIGHT'},
{id:'seed_grab_date_20260816',type:'spending',amount:171000,date:'2026-08-16',category:'Hẹn hò',source:'Shinhan',note:'Grab · hẹn hò'},
{id:'seed_apple1_20260817',type:'spending',amount:45179,date:'2026-08-17',category:'Dịch vụ số',source:'Shinhan',note:'Apple'},
{id:'seed_apple2_20260817',type:'spending',amount:12000,date:'2026-08-17',category:'Dịch vụ số',source:'Shinhan',note:'Apple'},
{id:'seed_grab_20260817',type:'spending',amount:118000,date:'2026-08-17',category:'Ăn uống',source:'Shinhan',note:'Grab'},
{id:'seed_tiktok_20260818',type:'spending',amount:177650,date:'2026-08-18',category:'Mua sắm',source:'Shinhan',note:'TikTok Shop'},
{id:'seed_grab_20260818',type:'spending',amount:64500,date:'2026-08-18',category:'Ăn uống',source:'Shinhan',note:'Grab'},
{id:'seed_grab_20260819',type:'spending',amount:26592,date:'2026-08-19',category:'Ăn uống',source:'Shinhan',note:'Grab'},
{id:'seed_go2joy_20260820',type:'spending',amount:400000,date:'2026-08-20',category:'Hẹn hò',source:'Shinhan',note:'Go2Joy'},
{id:'seed_gsm1_20260821',type:'spending',amount:32000,date:'2026-08-21',category:'Di chuyển',source:'Shinhan',note:'Green SM #1'},
{id:'seed_gsm2_20260821',type:'spending',amount:32000,date:'2026-08-21',category:'Di chuyển',source:'Shinhan',note:'Green SM #2'},
{id:'seed_grab_20260822',type:'spending',amount:130000,date:'2026-08-22',category:'Ăn uống',source:'Shinhan',note:'Grab'},
{id:'seed_shopee1_20260822',type:'spending',amount:175960,date:'2026-08-22',category:'Mua sắm',source:'Shinhan',note:'Shopee'},
{id:'seed_shopee2_20260822',type:'spending',amount:68844,date:'2026-08-22',category:'Mua sắm',source:'Shinhan',note:'Shopee'},
{id:'seed_tiktok_partner_20260822',type:'spending',amount:159297,date:'2026-08-22',category:'Mua sắm',source:'Shinhan',note:'TikTok Shop · mua giùm partner'},
{id:'seed_shopee_partner_20260822',type:'spending',amount:184912,date:'2026-08-22',category:'Mua sắm',source:'Shinhan',note:'Shopee · mua giùm partner'},
{id:'seed_shopee_20260826',type:'spending',amount:95040,date:'2026-08-26',category:'Mua sắm',source:'Shinhan',note:'Shopee'},
{id:'seed_grab_20260826',type:'spending',amount:37466,date:'2026-08-26',category:'Ăn uống',source:'Shinhan',note:'Grab'},
{id:'seed_grab_20260827',type:'spending',amount:35833,date:'2026-08-27',category:'Ăn uống',source:'Shinhan',note:'Grab'},
{id:'seed_shopee1_20260828',type:'spending',amount:115213,date:'2026-08-28',category:'Mua sắm',source:'Shinhan',note:'Shopee'},
{id:'seed_shopee2_20260828',type:'spending',amount:230100,date:'2026-08-28',category:'Mua sắm',source:'Shinhan',note:'Shopee'},
{id:'seed_shopee_20260829',type:'spending',amount:202020,date:'2026-08-29',category:'Mua sắm',source:'Shinhan',note:'Shopee'},
{id:'seed_foody_20260830',type:'spending',amount:239420,date:'2026-08-30',category:'Ăn uống',source:'Shinhan',note:'Foody'},
{id:'seed_manwah_20260823',type:'spending',amount:891216,date:'2026-08-23',category:'Hẹn hò',source:'VPBank',note:'MANWAH VIETTEL CMT8 Q1'},
{id:'seed_cgv_20260828',type:'spending',amount:326000,date:'2026-08-28',category:'Hẹn hò',source:'Ví Trả Sau',note:'CGV'},
{id:'seed_vts_fee_20260806',type:'spending',amount:33000,date:'2026-08-06',category:'Phí',source:'Ví Trả Sau',note:'Phí dịch vụ tháng'},
{id:'seed_mobifone_20260806',type:'spending',amount:90000,date:'2026-08-06',category:'Hóa đơn',source:'Ví Trả Sau',note:'MobiFone'}
];
function sig(x){return [x.date||'',+x.amount||0,x.source||'',x.category||'',String(x.note||x.name||'').toLowerCase()].join('|')}
function migrate(){
 const s=load();s.transactions=Array.isArray(s.transactions)?s.transactions:[];s.accounts=Array.isArray(s.accounts)?s.accounts:[];
 const sigs=new Set(s.transactions.map(sig));let changed=false;
 SEED.forEach(x=>{if(!s.transactions.some(t=>t.id===x.id)&&!sigs.has(sig(x))){s.transactions.push(x);sigs.add(sig(x));changed=true}});
 if(!s.accounts.some(a=>a.name==='Tiền mặt')){s.accounts.push({name:'Tiền mặt',balance:2300000});changed=true}
 if(!s.accounts.some(a=>a.name==='Tiết kiệm')){s.accounts.push({name:'Tiết kiệm',balance:10000000});changed=true}
 if(changed){save(s);setTimeout(()=>document.querySelector('.bottom-nav [data-page="home"]')?.click(),0)}
}
function fmt(n){return(+n||0).toLocaleString('vi-VN')+'đ'}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function injectRecent(){
 const screen=document.querySelector('#screen');if(!screen||screen.querySelector('#recentV125')||!screen.querySelector('.hero'))return;
 const s=load(),ym='2026-09';
 const rows=(s.transactions||[]).filter(t=>String(t.date||'').startsWith(ym)&&t.type!=='due').sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,5);
 const html=`<div class="section-head recent-head-v125" id="recentV125Head"><h2>Giao dịch gần đây</h2><button id="recentAllV125">Xem tất cả ›</button></div><div class="panel recent-v125" id="recentV125">${rows.map(t=>{const plus=['income','moneyin','refund'].includes(t.type);return`<div class="recent-row-v125"><span><b>${esc(t.note||t.category||'Giao dịch')}</b><small>${esc(t.category||'Khác')} · ${String(t.date||'').split('-').reverse().join('/')}</small></span><strong class="${plus?'plus':''}">${plus?'+':'−'}${fmt(t.amount)}</strong></div>`}).join('')||'<div class="empty">Chưa có giao dịch.</div>'}</div>`;
 const cat=screen.querySelector('.category-panel');if(cat)cat.insertAdjacentHTML('afterend',html);else screen.insertAdjacentHTML('beforeend',html);
 document.querySelector('#recentAllV125')?.addEventListener('click',()=>document.querySelector('.bottom-nav [data-page="flow"]')?.click());
}
migrate();
const ob=new MutationObserver(()=>requestAnimationFrame(injectRecent));const screen=document.querySelector('#screen');if(screen)ob.observe(screen,{childList:true,subtree:true});setTimeout(injectRecent,60);
})();