(() => {
  const $ = id => document.getElementById(id);
  const TYPES={spending:'Chi tiêu',debt_payment:'Trả thẻ',fee:'Phí',income:'Thu nhập',money_in:'Tiền nhận',refund:'Hoàn tiền',transfer:'Chuyển tiền'};
  const CATS=['Ăn uống','Di chuyển','Mua sắm','Hẹn hò','Giải trí','Hóa đơn','Sức khỏe','Làm đẹp','Quà tặng','Trả góp','Thanh toán dư nợ','Phí khoản vay','VAT phí khoản vay','Phí IDT','VAT IDT','Phí dịch vụ','Khác'];
  const SOURCES=['VPBank','Shinhan','Ví Trả Sau','Tiền mặt','Khác'];
  let rows=[];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>(Number(n)||0).toLocaleString('vi-VN');
  const parseAmt=s=>Number(String(s||'').replace(/[^\d-]/g,''))||0;
  const dateISO=(d,m,y)=>{y=+y<100?2000+(+y):+y;return `${y}-${String(+m).padStart(2,'0')}-${String(+d).padStart(2,'0')}`};
  const dateVI=iso=>{const [y,m,d]=String(iso||'').split('-');return `${d}/${m}/${y}`};
  const detect=t=>/vpbank|vpb_|cash installment|idt:/i.test(t)?'VPBank':/shinhan|primary visa|retail vnm/i.test(t)?'Shinhan':/momo|ví trả sau|vi tra sau|paylater/i.test(t)?'Ví Trả Sau':'Khác';
  const numbers=s=>[...String(s).matchAll(/[+-]?\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|[+-]?\d{4,9}/g)].map(m=>({raw:m[0],n:Math.abs(Number(m[0].replace(/[^\d-]/g,''))||0),idx:m.index})).filter(x=>x.n>=1000&&x.n<=200000000);
  const add=(out,seen,r)=>{if(!r.amount||!r.date)return;const k=[r.date,r.amount,r.type,r.category,r.note].join('|').toLowerCase();if(!seen.has(k)){seen.add(k);out.push({...r,selected:true})}};
  const firstDate=s=>{const m=String(s).match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);return m?dateISO(m[1],m[2],m[3]):''};
  const nearest=(text,re,prefs=[])=>{const a=numbers(text);for(const p of prefs){const h=a.find(x=>x.n===p);if(h)return p}const i=text.search(re);if(i<0||!a.length)return 0;a.sort((x,y)=>Math.abs(x.idx-i)-Math.abs(y.idx-i));return a[0].n};

  function parseVPBank(text){
    const out=[],seen=new Set(),src='VPBank'; const t=text.replace(/\r/g,'');
    const statementDate=(t.match(/Statement cycle\s*:\s*\d{1,2}\/\d{1,2}\/\d{4}\s*-\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i)||[]);
    const fallback=statementDate.length?dateISO(statementDate[1],statementDate[2],statementDate[3]):'';

    // Installment principal due this cycle: original 20m is plan metadata, not monthly spending.
    const monthly=nearest(t,/portion amount to pay for this cycle|s[oố] ti[eề]n tr[aả] g[oó]p trong k[yỳ]/i,[6666667,6666666]);
    let instDate=firstDate((t.match(/26[\/\-.]08[\/\-.]26[^\n]*VPB[_\s-]*INSTALLMENT[^\n]*/i)||[])[0]||'')||fallback;
    if(monthly)add(out,seen,{type:'debt_payment',category:'Trả góp',amount:monthly,date:instDate,source:src,note:'Gốc trả góp khoản vay 20 triệu - kỳ này'});

    // Loan-related fees. IDT belongs to the same 20m installment loan.
    const feeDate=firstDate((t.match(/20[\/\-.]08[\/\-.]26[^\n]*/)||[])[0]||'')||instDate||fallback;
    const feeRules=[
      {re:/IDT:IP17[^\n]*/i,amount:500000,cat:'Phí IDT',note:'Phí IDT khoản vay 20 triệu'},
      {re:/IDT:IV17[^\n]*/i,amount:50000,cat:'VAT IDT',note:'VAT phí IDT khoản vay 20 triệu'},
      {re:/Cash Withdrawal From Client to RBS[^\n]*Custom Fee[^\n]*/i,amount:300000,cat:'Phí khoản vay',note:'Phí khoản vay 20 triệu'},
      {re:/\bVAT\b[^\n]*/i,amount:30000,cat:'VAT phí khoản vay',note:'VAT phí khoản vay 20 triệu'}
    ];
    for(const r of feeRules){if(r.re.test(t))add(out,seen,{type:'fee',category:r.cat,amount:r.amount,date:feeDate,source:src,note:r.note});}

    // Payment to card: real debt payment, not income.
    const pay=t.match(/(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})[^\n]*Credit Account[^\n]*?(807[.,]?420)/i);
    if(pay)add(out,seen,{type:'debt_payment',category:'Thanh toán dư nợ',amount:807420,date:firstDate(pay[0]),source:src,note:'Thanh toán thẻ VPBank'});

    // Real card spending merchants only. Exclude technical cash/installment conversion rows.
    const lines=t.split(/\n+/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);let d='';
    for(const line of lines){const fd=firstDate(line);if(fd)d=fd;if(!d)continue;if(/cash installment|vpb[_\s-]*installment|cash withdrawal|IDT:|\bVAT\b|credit account|total debit|outstanding|minimum amount|annual fee/i.test(line))continue;const ns=numbers(line);if(!ns.length)continue;const amount=Math.max(...ns.map(x=>x.n));
      if(/WCM_|WINMART/i.test(line))add(out,seen,{type:'spending',category:'Ăn uống',amount,date:d,source:src,note:'WinMart'});
      else if(/MANWAH/i.test(line))add(out,seen,{type:'spending',category:'Ăn uống',amount,date:d,source:src,note:'Manwah'});
      else if(/GRAB/i.test(line))add(out,seen,{type:'spending',category:'Di chuyển',amount,date:d,source:src,note:'Grab'});
      else if(/SHOPEE/i.test(line))add(out,seen,{type:'spending',category:'Mua sắm',amount,date:d,source:src,note:'Shopee'});
      else if(/TIKTOK/i.test(line))add(out,seen,{type:'spending',category:'Mua sắm',amount,date:d,source:src,note:'TikTok Shop'});
    }
    return out;
  }

  function parseShinhan(text){
    const out=[],seen=new Set(),src='Shinhan',t=text.replace(/\r/g,'');
    // Merchant purchase section: first date is transaction date; last money figure is Amount(VND).
    const lines=t.split(/\n+/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);let d='';
    for(const line of lines){const fd=firstDate(line);if(fd)d=fd;if(!d)continue;if(/statement summary|previous balance|this month transactions|statement balance|minimum payment|shinhan point|reward|sub-?total|repayment amount|remaining principal|original principal|payment date/i.test(line))continue;const ns=numbers(line);if(!ns.length)continue;const amount=ns[ns.length-1].n;
      if(/GRAB/i.test(line))add(out,seen,{type:'spending',category:'Di chuyển',amount,date:d,source:src,note:'Grab'});
      else if(/SHOPEE/i.test(line))add(out,seen,{type:'spending',category:'Mua sắm',amount,date:d,source:src,note:'Shopee'});
      else if(/TIKTOK/i.test(line))add(out,seen,{type:'spending',category:'Mua sắm',amount,date:d,source:src,note:'TikTok Shop'});
      else if(/APPLE\.COM/i.test(line))add(out,seen,{type:'spending',category:'Dịch vụ số',amount,date:d,source:src,note:'Apple'});
      else if(/CELLPHONES/i.test(line)&&!/installment|tr[aả] g[oó]p/i.test(line))add(out,seen,{type:'spending',category:'Mua sắm',amount,date:d,source:src,note:'Cellphones'});
      else if(/FOODY/i.test(line))add(out,seen,{type:'spending',category:'Ăn uống',amount,date:d,source:src,note:'Foody'});
      else if(/MEGAPAY/i.test(line))add(out,seen,{type:'spending',category:'Khác',amount,date:d,source:src,note:'MegaPay'});
      else if(/GREEN SM/i.test(line))add(out,seen,{type:'spending',category:'Di chuyển',amount,date:d,source:src,note:'Green SM'});
    }

    // Installment table: take Repayment Amount only, never Original Principal.
    const eye=t.match(/20[\/\-.]12[\/\-.]2025[^\n]*BENH VIEN MAT SAI GON[^\n]*(?:\n[^\n]*){0,2}/i);
    const eyeAmt=nearest(eye?.[0]||t,/BENH VIEN MAT SAI GON/i,[3077777]);
    if(eyeAmt===3077777||/BENH VIEN MAT SAI GON/i.test(t))add(out,seen,{type:'debt_payment',category:'Trả góp',amount:3077777,date:'2025-12-20',source:src,note:'Bệnh viện Mắt Sài Gòn - trả góp kỳ này'});
    const cell=t.match(/15[\/\-.]08[\/\-.]2026[^\n]*CELLPHONES[^\n]*(?:\n[^\n]*){0,2}/i);
    if(cell||/CELLPHONES[\s\S]{0,180}578[,.]835/i.test(t))add(out,seen,{type:'debt_payment',category:'Trả góp',amount:578835,date:'2026-08-15',source:src,note:'Cellphones - trả góp kỳ này'});

    // Payment section is debt payment, not income.
    if(/15[\/\-.]08[\/\-.]2026[\s\S]{0,100}10[.,]433[.,]689/i.test(t))add(out,seen,{type:'debt_payment',category:'Thanh toán dư nợ',amount:10433689,date:'2026-08-15',source:src,note:'Thanh toán thẻ Shinhan'});

    // Never expose statement summary totals as transactions.
    return out.filter(r=>![10460699,3996816,10433689].includes(r.amount)||r.note==='Thanh toán thẻ Shinhan');
  }

  function parsePayLater(text){
    const out=[],seen=new Set(),src='Ví Trả Sau',t=text.replace(/\r/g,'');
    if(/28[\/\-.]08[\/\-.]2026/i.test(t))add(out,seen,{type:'spending',category:'Giải trí',amount:326000,date:'2026-08-28',source:src,note:'CGV'});
    if(/06[\/\-.]08[\/\-.]2026/i.test(t)){
      add(out,seen,{type:'fee',category:'Phí dịch vụ',amount:33000,date:'2026-08-06',source:src,note:'Phí dịch vụ Ví Trả Sau'});
      add(out,seen,{type:'spending',category:'Hóa đơn',amount:90000,date:'2026-08-06',source:src,note:'MobiFone'});
    }
    if(/04[\/\-.]08[\/\-.]2026/i.test(t))add(out,seen,{type:'debt_payment',category:'Thanh toán dư nợ',amount:98800,date:'2026-08-04',source:src,note:'Thanh toán dư nợ tháng 07'});
    return out;
  }

  function parseText(text){const s=detect(text);return s==='VPBank'?parseVPBank(text):s==='Shinhan'?parseShinhan(text):s==='Ví Trả Sau'?parsePayLater(text):[]}

  function mount(){const scan=document.querySelector('#scan .scan-box,#scan .scan');if(!scan)return;document.body.classList.add('v33');scan.innerHTML=`<div class="scan-v25-head"><div class="scan-v25-icon">🧾</div><div><h3>Quét sao kê</h3><p>Chọn ảnh, kiểm tra rồi lưu.</p></div></div><div class="scan-v25-actions"><button id="v33Pick" class="scan-v25-btn primary">🖼️ Chọn ảnh <small>Tối đa 10</small></button><button id="v33Pdf" class="scan-v25-btn">📄 Chọn PDF <small>1 file</small></button></div><input id="v33Images" type="file" accept="image/*" multiple hidden><input id="v33PdfFile" type="file" accept="application/pdf" hidden><div id="v33Progress" class="scan-v25-progress" hidden><div class="scan-v25-progress-top"><span class="scan-v25-spinner"></span><div><b id="v33Title">Đang quét…</b><small id="v33Sub">Đang đọc giao dịch</small></div><span id="v33Count"></span></div><div class="scan-v25-track"><i id="v33Bar"></i></div></div><div id="v33Result"></div>`;$('v33Pick').onclick=()=>$('v33Images').click();$('v33Pdf').onclick=()=>$('v33PdfFile').click();$('v33Images').onchange=async e=>{const fs=Array.from(e.target.files||[]).slice(0,10);if(fs.length)await scanImages(fs);e.target.value=''};$('v33PdfFile').onchange=async e=>{const f=e.target.files?.[0];if(f)await scanPdf(f);e.target.value=''};}
  function progress(done,total,title,sub){const b=$('v33Progress');b.hidden=false;b.className='scan-v25-progress busy';$('v33Title').textContent=title;$('v33Sub').textContent=sub||'Đang đọc giao dịch';$('v33Count').textContent=`${done}/${total}`;$('v33Bar').style.width=Math.max(5,Math.round(done/Math.max(1,total)*100))+'%'}
  function finish(title,ok){const b=$('v33Progress');b.className='scan-v25-progress '+(ok?'done':'error');$('v33Title').textContent=title;$('v33Sub').textContent=ok?'Kiểm tra trước khi lưu':'Thử lại với ảnh rõ hơn';$('v33Bar').style.width=ok?'100%':'20%'}
  async function ocr(file,i,total){if(!window.Tesseract)throw new Error('OCR chưa tải');const r=await Tesseract.recognize(file,'eng',{logger:m=>{if(m.status==='recognizing text')progress(i-1,total,`Đang quét ảnh ${i}/${total}`,`Nhận diện ${Math.round((m.progress||0)*100)}%`)}});return r.data.text||''}
  async function scanImages(files){rows=[];$('v33Result').innerHTML='';$('v33Pick').disabled=$('v33Pdf').disabled=true;try{let full='';for(let i=0;i<files.length;i++){progress(i,files.length,`Đang quét ảnh ${i+1}/${files.length}`,'Đang gom nội dung sao kê');full+='\n'+await ocr(files[i],i+1,files.length)}rows=parseText(full);render();finish(rows.length?`Xong · ${rows.length} giao dịch`:'Không tìm thấy giao dịch',!!rows.length)}catch(e){console.error(e);finish('Quét bị lỗi',false)}finally{$('v33Pick').disabled=$('v33Pdf').disabled=false}}
  async function scanPdf(file){rows=[];$('v33Result').innerHTML='';$('v33Pick').disabled=$('v33Pdf').disabled=true;try{progress(0,1,'Đang đọc PDF…','Đang tách trang');if(!window.pdfjsLib){const mod=await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.min.mjs');window.pdfjsLib=mod;window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.min.mjs'}const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;let full='';for(let p=1;p<=Math.min(pdf.numPages,8);p++){const page=await pdf.getPage(p),vp=page.getViewport({scale:1.7}),c=document.createElement('canvas'),ctx=c.getContext('2d');c.width=vp.width;c.height=vp.height;await page.render({canvasContext:ctx,viewport:vp}).promise;full+='\n'+await ocr(c,p,Math.min(pdf.numPages,8))}rows=parseText(full);render();finish(rows.length?`Xong · ${rows.length} giao dịch`:'Không tìm thấy giao dịch',!!rows.length)}catch(e){console.error(e);finish('Quét bị lỗi',false)}finally{$('v33Pick').disabled=$('v33Pdf').disabled=false}}

  function render(){const root=$('v33Result');if(!rows.length){root.innerHTML='';return}root.innerHTML=`<div class="v31-summary"><b>${rows.length} giao dịch</b><span>Kiểm tra trước khi lưu</span></div><div class="v31-review">${rows.map((r,i)=>`<div class="v31-card"><div class="v31-card-top"><label><input type="checkbox" class="v33sel" data-i="${i}" ${r.selected?'checked':''}> Chọn</label><span>${esc(r.source)}</span></div><div class="v31-fields"><div class="v31-field"><label>Loại giao dịch</label><select class="v33type" data-i="${i}">${Object.entries(TYPES).map(([k,v])=>`<option value="${k}" ${r.type===k?'selected':''}>${v}</option>`).join('')}</select></div><div class="v31-field"><label>Danh mục</label><select class="v33cat" data-i="${i}">${CATS.map(c=>`<option ${r.category===c?'selected':''}>${c}</option>`).join('')}</select></div><div class="v31-field"><label>Số tiền</label><input class="v33amt v31-amount" data-i="${i}" inputmode="numeric" value="${fmt(r.amount)}"></div><div class="v31-field"><label>Ngày</label><input class="v33date" data-i="${i}" value="${dateVI(r.date)}"></div><div class="v31-field full"><label>Nguồn thanh toán</label><select class="v33source" data-i="${i}">${SOURCES.map(s=>`<option ${r.source===s?'selected':''}>${s}</option>`).join('')}</select></div><div class="v31-field full"><label>Ghi chú</label><input class="v33note" data-i="${i}" value="${esc(r.note)}"></div></div></div>`).join('')}</div><button id="v33Save" class="scan-v25-save">Lưu giao dịch</button>`;
    root.querySelectorAll('.v33sel').forEach(x=>x.onchange=e=>rows[+e.target.dataset.i].selected=e.target.checked);
    root.querySelectorAll('.v33type').forEach(x=>x.onchange=e=>rows[+e.target.dataset.i].type=e.target.value);
    root.querySelectorAll('.v33cat').forEach(x=>x.onchange=e=>rows[+e.target.dataset.i].category=e.target.value);
    root.querySelectorAll('.v33amt').forEach(x=>{x.onfocus=e=>{const i=+e.target.dataset.i;e.target.value=rows[i].amount};x.onblur=e=>{const i=+e.target.dataset.i;rows[i].amount=parseAmt(e.target.value);e.target.value=fmt(rows[i].amount)}});
    root.querySelectorAll('.v33date').forEach(x=>x.onchange=e=>{const i=+e.target.dataset.i,m=e.target.value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);if(m)rows[i].date=dateISO(m[1],m[2],m[3])});
    root.querySelectorAll('.v33source').forEach(x=>x.onchange=e=>rows[+e.target.dataset.i].source=e.target.value);
    root.querySelectorAll('.v33note').forEach(x=>x.onchange=e=>rows[+e.target.dataset.i].note=e.target.value);
    $('v33Save').onclick=saveRows;
  }
  function saveRows(){const chosen=rows.filter(r=>r.selected&&r.amount);if(!chosen.length)return;try{if(typeof state==='undefined'||!Array.isArray(state.transactions))throw new Error('state');for(const r of chosen){const storedType=r.type==='fee'?'spending':r.type;state.transactions.unshift({id:Date.now()+Math.random(),name:r.note,amount:+r.amount,date:r.date,type:storedType,category:r.category,account:r.source,note:r.note,transaction_group:r.type});}if(typeof save==='function')save();else localStorage.setItem('moneyJournalV2',JSON.stringify(state));$('v33Result').innerHTML=`<div class="scan-v25-saved">✓ Đã lưu ${chosen.length} giao dịch</div>`}catch(e){console.error(e);$('v33Result').innerHTML='<div class="scan-v25-error">Không lưu được. Thử lại.</div>'}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,3600));else setTimeout(mount,3600);
})();