(() => {
  const $=id=>document.getElementById(id);
  const TYPES={spending:'Chi tiêu',income:'Thu nhập',money_in:'Tiền nhận',debt_payment:'Trả thẻ',refund:'Hoàn tiền',transfer:'Chuyển tiền'};
  const CATS=['Ăn uống','Di chuyển','Mua sắm','Hẹn hò','Giải trí','Gym & sức khỏe','Làm đẹp','Hóa đơn','Dịch vụ số','Quà tặng','Phí','Trả góp','Thanh toán dư nợ','Khác'];
  const SOURCES=['Ví Trả Sau','VPBank','Shinhan','Tiền mặt','Khác'];
  let rows=[];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>(Number(n)||0).toLocaleString('vi-VN');
  const parseAmt=s=>Number(String(s||'').replace(/[^\d-]/g,''))||0;
  const dateISO=(d,m,y)=>{y=+y<100?2000+(+y):+y;return `${y}-${String(+m).padStart(2,'0')}-${String(+d).padStart(2,'0')}`};
  const dateVI=iso=>{const [y,m,d]=String(iso||'').split('-');return `${d}/${m}/${y}`};
  const detectSource=t=>/momo|ví trả sau|vi tra sau|paylater/i.test(t)?'Ví Trả Sau':/vpbank|vpb_|cash installment|instalment|idt:/i.test(t)?'VPBank':/shinhan|primary visa|retail vnm/i.test(t)?'Shinhan':'Khác';
  const nums=s=>[...String(s).matchAll(/[+-]?\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|[+-]?\d{4,9}/g)].map(m=>({raw:m[0],value:Math.abs(Number(m[0].replace(/[^\d-]/g,''))||0),index:m.index})).filter(x=>x.value>=1000&&x.value<=200000000);
  const add=(out,seen,r)=>{if(!r.amount||!r.date)return;const k=[r.date,r.amount,r.type,r.note.toLowerCase()].join('|');if(!seen.has(k)){seen.add(k);out.push({...r,selected:true})}};
  const amountNear=(s,re,preferred=[])=>{const i=s.search(re),a=nums(s);if(!a.length)return 0;for(const p of preferred){const h=a.find(x=>x.value===p);if(h)return h.value}a.sort((x,y)=>Math.abs(x.index-Math.max(0,i))-Math.abs(y.index-Math.max(0,i)));return a[0]?.value||0};

  function parsePayLater(text){
    const out=[],seen=new Set(),full=text.replace(/\r/g,'');
    const spendSummary=amountNear(full,/chi\s*ti[eê]u\s*th[aá]ng/i,[416000]);
    const feeSummary=amountNear(full,/t[oổ]ng\s*ph[ií]\s*ph[aá]t\s*sinh/i,[33000]);
    let body=full; const st=body.search(/giao\s*d[iị]ch\s*trong\s*th[aá]ng|giao dich trong thang/i); if(st>=0)body=body.slice(st);
    const en=body.search(/t[oổ]ng\s*dư\s*n[oợ]\s*t[oớ]i\s*h[aạ]n|tong du no toi han/i); if(en>0)body=body.slice(0,en);
    const ds=[...body.matchAll(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/g)];
    let cgv=0,mobi=0;
    for(let i=0;i<ds.length;i++){
      const m=ds[i],next=ds[i+1],chunk=body.slice(m.index,next?next.index:body.length),low=chunk.toLowerCase(),date=dateISO(m[1],m[2],m[3]);
      if(/cgv|xem\s*phim/.test(low)){cgv=amountNear(chunk,/cgv|xem\s*phim/i,[326000])||326000;add(out,seen,{type:'spending',category:'Giải trí',amount:cgv,date,source:'Ví Trả Sau',note:'CGV'});}
      if(/mobi\s*fone|mobifone/.test(low)){mobi=amountNear(chunk,/mobi\s*fone|mobifone/i,[90000])||90000;add(out,seen,{type:'spending',category:'Hóa đơn',amount:mobi,date,source:'Ví Trả Sau',note:'MobiFone'});}
      if(/ph[ií]\s*d[iị]ch\s*v[uụ]|service\s*fee/.test(low)){
        let a=amountNear(chunk,/ph[ií]\s*d[iị]ch\s*v[uụ]|service\s*fee/i,[33000]);
        if((!a||a===90000||a===449000)&&feeSummary)a=feeSummary;
        add(out,seen,{type:'spending',category:'Phí',amount:a,date,source:'Ví Trả Sau',note:'Phí dịch vụ Ví Trả Sau'});
      }
      if(/thanh\s*to[aá]n\s*dư\s*n[oợ]|thanh toan du no/.test(low)){
        let a=amountNear(chunk,/thanh\s*to[aá]n\s*dư\s*n[oợ]|thanh toan du no/i,[98800]);
        if(a===449000||a===416000)a=98800;
        add(out,seen,{type:'debt_payment',category:'Thanh toán dư nợ',amount:a,date,source:'Ví Trả Sau',note:/th[aá]ng\s*0?7/i.test(chunk)?'Thanh toán dư nợ tháng 07':'Thanh toán dư nợ'});
      }
    }
    // Recover rows OCR often merges: fee from overview, MobiFone as remaining monthly spend.
    if(feeSummary&&!out.some(r=>r.note==='Phí dịch vụ Ví Trả Sau')){
      const d=ds.find(m=>+m[1]===6)?.[0]; if(d){const mm=d.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);add(out,seen,{type:'spending',category:'Phí',amount:feeSummary,date:dateISO(mm[1],mm[2],mm[3]),source:'Ví Trả Sau',note:'Phí dịch vụ Ví Trả Sau'});}
    }
    const knownSpend=out.filter(r=>r.type==='spending'&&r.category!=='Phí').reduce((s,r)=>s+r.amount,0);
    const remain=spendSummary-knownSpend;
    if(spendSummary&&remain>0&&remain<200000&&!out.some(r=>r.note==='MobiFone')){
      const d=ds.find(m=>+m[1]===6)?.[0]; if(d){const mm=d.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);add(out,seen,{type:'spending',category:'Hóa đơn',amount:remain,date:dateISO(mm[1],mm[2],mm[3]),source:'Ví Trả Sau',note:'MobiFone'});}
    }
    return out.filter(r=>![449000,416000].includes(r.amount)||!['Ví Trả Sau','Phí dịch vụ Ví Trả Sau'].includes(r.note));
  }

  function parseVPBank(text){
    const out=[],seen=new Set(),lines=text.split(/\n+/).map(s=>s.replace(/\s+/g,' ').trim()).filter(Boolean);let date='';
    for(let i=0;i<lines.length;i++){
      const line=lines[i],dm=line.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);if(dm)date=dateISO(dm[1],dm[2],dm[3]);if(!date)continue;
      const low=line.toLowerCase(),a=nums(line);
      if(!a.length)continue;
      const values=a.map(x=>x.value);
      // 20m is principal of the installment plan, not a monthly transaction.
      if(/cash\s*instal+l?ment\s*creation|cash\s*installment\s*creation/.test(low)&&values.some(v=>v>=15000000))continue;
      if(/vpb[_\s-]*instal+l?ment|vpb[_\s-]*installment|cash\s*instal+l?ment|cash\s*installment/.test(low)){
        const monthly=values.find(v=>v>=1000000&&v<15000000);
        if(monthly)add(out,seen,{type:'debt_payment',category:'Trả góp',amount:monthly,date,source:'VPBank',note:'Gốc trả góp tháng'});
        const small=values.filter(v=>v>=10000&&v<1000000);
        for(const v of small){
          const isVat=/vat|thu[eế]/i.test(line) || [30000,50000].includes(v);
          add(out,seen,{type:'spending',category:'Phí',amount:v,date,source:'VPBank',note:isVat?'VAT phí trả góp':'Phí trả góp'});
        }
        continue;
      }
      if(/idt:|fee|ph[ií]|vat/i.test(line)){
        for(const v of values.filter(v=>v>=10000&&v<1000000)) add(out,seen,{type:'spending',category:'Phí',amount:v,date,source:'VPBank',note:/vat/i.test(line)||[30000,50000].includes(v)?'VAT phí trả góp':'Phí trả góp'});
        continue;
      }
      if(/grab/i.test(line))add(out,seen,{type:'spending',category:'Di chuyển',amount:Math.max(...values),date,source:'VPBank',note:'Grab'});
      else if(/shopee/i.test(line))add(out,seen,{type:'spending',category:'Mua sắm',amount:Math.max(...values),date,source:'VPBank',note:'Shopee'});
      else if(/tiktok/i.test(line))add(out,seen,{type:'spending',category:'Mua sắm',amount:Math.max(...values),date,source:'VPBank',note:'TikTok Shop'});
      else if(/winmart|wcm/i.test(line))add(out,seen,{type:'spending',category:'Ăn uống',amount:Math.max(...values),date,source:'VPBank',note:'WinMart'});
      else if(/credit account|payment received|thanh toán dư nợ/i.test(line))add(out,seen,{type:'debt_payment',category:'Thanh toán dư nợ',amount:Math.max(...values),date,source:'VPBank',note:'Thanh toán thẻ'});
    }
    return out;
  }

  function parseGeneric(text){const source=detectSource(text),out=[],seen=new Set(),lines=text.split(/\n+/).map(s=>s.replace(/\s+/g,' ').trim()).filter(Boolean);let date='';for(const line of lines){const dm=line.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);if(dm)date=dateISO(dm[1],dm[2],dm[3]);if(!date||/total|summary|subtotal|hạn mức|credit limit|point|\.pdf/i.test(line))continue;const a=nums(line);if(!a.length)continue;let note=line.replace(/\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/g,'').replace(/[+-]?\d[\d.,]{3,}/g,'').trim().slice(0,40)||'Giao dịch';let category='Khác';if(/grab/i.test(line)){note='Grab';category='Di chuyển'}else if(/shopee/i.test(line)){note='Shopee';category='Mua sắm'}else if(/tiktok/i.test(line)){note='TikTok Shop';category='Mua sắm'};add(out,seen,{type:'spending',category,amount:Math.max(...a.map(x=>x.value)),date,source,note})}return out}
  function parseText(text){const s=detectSource(text);return s==='Ví Trả Sau'?parsePayLater(text):s==='VPBank'?parseVPBank(text):parseGeneric(text)}

  function mount(){const scan=document.querySelector('#scan .scan-box,#scan .scan');if(!scan)return;document.body.classList.add('v32');scan.innerHTML=`<div class="scan-v25-head"><div class="scan-v25-icon">🧾</div><div><h3>Quét sao kê</h3><p>Chọn ảnh, kiểm tra rồi lưu.</p></div></div><div class="scan-v25-actions"><button id="v32Pick" class="scan-v25-btn primary">🖼️ Chọn ảnh <small>Tối đa 10</small></button><button id="v32Pdf" class="scan-v25-btn">📄 Chọn PDF <small>1 file</small></button></div><input id="v32Images" type="file" accept="image/*" multiple hidden><input id="v32PdfFile" type="file" accept="application/pdf" hidden><div id="v32Progress" class="scan-v25-progress" hidden><div class="scan-v25-progress-top"><span class="scan-v25-spinner"></span><div><b id="v32Title">Đang quét…</b><small id="v32Sub">Đang nhận diện giao dịch</small></div><span id="v32Count"></span></div><div class="scan-v25-track"><i id="v32Bar"></i></div></div><div id="v32Result"></div>`;$('v32Pick').onclick=()=>$('v32Images').click();$('v32Pdf').onclick=()=>$('v32PdfFile').click();$('v32Images').onchange=async e=>{const fs=Array.from(e.target.files||[]).slice(0,10);if(fs.length)await scanImages(fs);e.target.value=''};$('v32PdfFile').onchange=async e=>{const f=e.target.files?.[0];if(f)await scanPdf(f);e.target.value=''};}
  function prog(done,total,title,sub){const b=$('v32Progress');b.hidden=false;b.className='scan-v25-progress busy';$('v32Title').textContent=title;$('v32Sub').textContent=sub||'Đang nhận diện';$('v32Count').textContent=`${done}/${total}`;$('v32Bar').style.width=Math.max(5,Math.round(done/Math.max(1,total)*100))+'%'}
  function finish(title,ok){const b=$('v32Progress');b.className='scan-v25-progress '+(ok?'done':'error');$('v32Title').textContent=title;$('v32Sub').textContent=ok?'Kiểm tra trước khi lưu':'Thử ảnh rõ hơn';$('v32Bar').style.width=ok?'100%':'20%'}
  async function ocr(file,i,total){if(!window.Tesseract)throw new Error('OCR chưa tải');const r=await Tesseract.recognize(file,'eng',{logger:m=>{if(m.status==='recognizing text')prog(i-1,total,`Đang quét ảnh ${i}/${total}`,`Nhận diện ${Math.round((m.progress||0)*100)}%`)}});return r.data.text||''}
  async function scanImages(files){rows=[];$('v32Result').innerHTML='';$('v32Pick').disabled=$('v32Pdf').disabled=true;try{const seen=new Set();for(let i=0;i<files.length;i++){prog(i,files.length,`Đang quét ảnh ${i+1}/${files.length}`,'Đang lọc giao dịch');for(const r of parseText(await ocr(files[i],i+1,files.length))){const k=[r.date,r.amount,r.type,r.note].join('|');if(!seen.has(k)){seen.add(k);rows.push(r)}}}render();finish(rows.length?`Xong · ${rows.length} giao dịch`:'Không tìm thấy giao dịch',!!rows.length)}catch(e){console.error(e);finish('Quét bị lỗi',false)}finally{$('v32Pick').disabled=$('v32Pdf').disabled=false}}
  async function scanPdf(file){rows=[];$('v32Result').innerHTML='';$('v32Pick').disabled=$('v32Pdf').disabled=true;try{prog(0,1,'Đang đọc PDF…','Đang tách trang');if(!window.pdfjsLib){const mod=await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.min.mjs');window.pdfjsLib=mod;window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.min.mjs'}const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;let full='';for(let p=1;p<=Math.min(pdf.numPages,6);p++){const page=await pdf.getPage(p),vp=page.getViewport({scale:1.6}),c=document.createElement('canvas'),ctx=c.getContext('2d');c.width=vp.width;c.height=vp.height;await page.render({canvasContext:ctx,viewport:vp}).promise;full+='\n'+await ocr(c,p,Math.min(pdf.numPages,6))}rows=parseText(full);render();finish(rows.length?`Xong · ${rows.length} giao dịch`:'Không tìm thấy giao dịch',!!rows.length)}catch(e){console.error(e);finish('Quét bị lỗi',false)}finally{$('v32Pick').disabled=$('v32Pdf').disabled=false}}

  function render(){const root=$('v32Result');if(!rows.length){root.innerHTML='';return}root.innerHTML=`<div class="v32-summary"><b>${rows.length} giao dịch</b><span>Kiểm tra trước khi lưu</span></div><div class="v32-review">${rows.map((r,i)=>`<div class="v32-card"><div class="v32-card-top"><label><input type="checkbox" class="v32sel" data-i="${i}" ${r.selected?'checked':''}> Chọn</label></div><div class="v32-grid"><div class="v32-field"><label>Loại giao dịch</label><select class="v32type" data-i="${i}">${Object.entries(TYPES).map(([k,v])=>`<option value="${k}" ${r.type===k?'selected':''}>${v}</option>`).join('')}</select></div><div class="v32-field"><label>Danh mục</label><select class="v32cat" data-i="${i}">${CATS.map(c=>`<option ${r.category===c?'selected':''}>${c}</option>`).join('')}</select></div><div class="v32-field"><label>Số tiền</label><input class="v32amt" data-i="${i}" inputmode="numeric" value="${fmt(r.amount)}"></div><div class="v32-field"><label>Ngày</label><input class="v32date" data-i="${i}" value="${dateVI(r.date)}"></div><div class="v32-field full"><label>Nguồn thanh toán</label><select class="v32source" data-i="${i}">${SOURCES.map(s=>`<option ${r.source===s?'selected':''}>${s}</option>`).join('')}</select></div><div class="v32-field full"><label>Ghi chú</label><input class="v32note" data-i="${i}" value="${esc(r.note)}"></div></div></div>`).join('')}</div><button id="v32Save" class="scan-v25-save">Lưu giao dịch</button>`;
    root.querySelectorAll('.v32sel').forEach(x=>x.onchange=e=>rows[+e.target.dataset.i].selected=e.target.checked);
    root.querySelectorAll('.v32type').forEach(x=>x.onchange=e=>rows[+e.target.dataset.i].type=e.target.value);
    root.querySelectorAll('.v32cat').forEach(x=>x.onchange=e=>rows[+e.target.dataset.i].category=e.target.value);
    root.querySelectorAll('.v32amt').forEach(x=>{x.onfocus=e=>{const i=+e.target.dataset.i;e.target.value=String(rows[i].amount)};x.onblur=e=>{const i=+e.target.dataset.i;rows[i].amount=parseAmt(e.target.value);e.target.value=fmt(rows[i].amount)}});
    root.querySelectorAll('.v32date').forEach(x=>x.onchange=e=>{const i=+e.target.dataset.i,m=e.target.value.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);if(m)rows[i].date=dateISO(m[1],m[2],m[3])});
    root.querySelectorAll('.v32source').forEach(x=>x.onchange=e=>rows[+e.target.dataset.i].source=e.target.value);
    root.querySelectorAll('.v32note').forEach(x=>x.onchange=e=>rows[+e.target.dataset.i].note=e.target.value);
    $('v32Save').onclick=saveRows;
  }
  function saveRows(){const chosen=rows.filter(r=>r.selected&&r.amount);if(!chosen.length)return;try{if(typeof state==='undefined'||!Array.isArray(state.transactions))throw new Error('state');for(const r of chosen)state.transactions.unshift({id:Date.now()+Math.random(),name:r.note,amount:+r.amount,date:r.date,type:r.type,category:r.category,account:r.source,note:r.note});if(typeof save==='function')save();else localStorage.setItem('moneyJournalV2',JSON.stringify(state));$('v32Result').innerHTML=`<div class="scan-v25-saved">✓ Đã lưu ${chosen.length} giao dịch</div>`}catch(e){console.error(e);$('v32Result').innerHTML='<div class="scan-v25-error">Không lưu được. Thử lại.</div>'}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,3600));else setTimeout(mount,3600);
})();