(() => {
  const $ = id => document.getElementById(id);
  const money = n => (Number(n)||0).toLocaleString('vi-VN') + 'đ';
  const labels={spending:'Chi tiêu',income:'Thu nhập',money_in:'Tiền nhận',debt_payment:'Trả thẻ',refund:'Hoàn tiền',transfer:'Chuyển tiền'};
  let rows=[];

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const parseMoney=s=>{if(!s)return 0;let t=s.replace(/[^\d.,-]/g,''),neg=t.startsWith('-');t=t.replace('-','');const ld=t.lastIndexOf('.'),lc=t.lastIndexOf(','),p=Math.max(ld,lc);if(p>-1&&t.length-p-1===2)t=t.slice(0,p).replace(/[.,]/g,'')+'.'+t.slice(p+1);else t=t.replace(/[.,]/g,'');const n=parseFloat(t)||0;return neg?-n:n};
  const guessType=(line,raw)=>{const s=line.toLowerCase();if(/refund|hoàn|hoan tien|reversal/.test(s))return'refund';if(/payment|thanh toán dư nợ|thanh toan du no|paid during|credit account/.test(s))return'debt_payment';if(/salary|lương|luong/.test(s))return'income';if(/transfer in|nhận tiền|nhan tien|received/.test(s))return'money_in';if(/^\+/.test(raw))return'money_in';return'spending'};
  const guessCat=line=>{const s=line.toLowerCase();if(/grab|xanh sm|taxi|be /.test(s))return'Di chuyển';if(/shopee|lazada|tiktok|cellphone/.test(s))return'Mua sắm';if(/cgv|cinema|galaxy/.test(s))return'Giải trí';if(/food|restaurant|cafe|coffee|winmart|manwah/.test(s))return'Ăn uống';if(/apple.com|itunes|google/.test(s))return'Dịch vụ số';if(/fee|phí|phi /.test(s))return'Phí';return'Khác'};
  const rowKey=r=>[r.date,Math.round(r.amount),r.name.toLowerCase().replace(/\W/g,'')].join('|');

  function mount(){
    document.body.classList.add('v25');
    const scan=document.querySelector('#scan .scan-box, #scan .scan'); if(!scan) return;
    scan.innerHTML=`<div class="scan-v25-head"><div class="scan-v25-icon">🧾</div><div><h3>Quét sao kê</h3><p>Chọn ảnh giao dịch để app tự đọc.</p></div></div>
      <div class="scan-v25-actions"><button id="v25PickImages" class="scan-v25-btn primary">🖼️ Chọn ảnh <small>Tối đa 10</small></button><button id="v25PickPdf" class="scan-v25-btn">📄 Chọn PDF <small>1 file</small></button></div>
      <input id="v25Images" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple hidden><input id="v25Pdf" type="file" accept="application/pdf" hidden>
      <div id="v25Progress" class="scan-v25-progress" hidden><div class="scan-v25-progress-top"><span class="scan-v25-spinner"></span><div><b id="v25Title">Đang quét…</b><small id="v25Sub">Vui lòng giữ app mở</small></div><span id="v25Count"></span></div><div class="scan-v25-track"><i id="v25Bar"></i></div></div>
      <div id="v25Result"></div>`;
    $('v25PickImages').onclick=()=>$('v25Images').click();
    $('v25PickPdf').onclick=()=>$('v25Pdf').click();
    $('v25Images').onchange=async e=>{const fs=Array.from(e.target.files||[]).slice(0,10);if(fs.length)await scanImages(fs);e.target.value=''};
    $('v25Pdf').onchange=async e=>{const f=e.target.files?.[0];if(f)await scanPdf(f);e.target.value=''};
  }

  function progress(done,total,title,sub){const box=$('v25Progress');box.hidden=false;box.className='scan-v25-progress busy';$('v25Title').textContent=title;$('v25Sub').textContent=sub||'Vui lòng giữ app mở';$('v25Count').textContent=`${done}/${total}`;$('v25Bar').style.width=Math.max(5,Math.round(done/total*100))+'%'}
  function finish(title,ok=true){const box=$('v25Progress');box.className='scan-v25-progress '+(ok?'done':'error');$('v25Title').textContent=title;$('v25Sub').textContent=ok?'Kiểm tra giao dịch bên dưới':'Thử lại với ảnh rõ hơn';$('v25Bar').style.width=ok?'100%':'25%'}

  async function ocrImage(file,idx,total){
    if(!window.Tesseract) throw new Error('OCR chưa tải xong');
    const out=await Tesseract.recognize(file,'eng',{logger:m=>{if(m.status==='recognizing text'){const pct=Math.round((m.progress||0)*100);progress(idx-1,total,`Đang quét ảnh ${idx}/${total}`,`Nhận diện ${pct}%`)}}});
    return out.data.text||'';
  }

  function parseText(text){const out=[],seen=new Set(),lines=text.split(/\n+/).map(s=>s.replace(/\s+/g,' ').trim()).filter(Boolean),dateRe=/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/,amtRe=/[-+]?\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|[-+]?\d{5,}/g;
    for(const line of lines){const dm=line.match(dateRe),nums=line.match(amtRe);if(!nums?.length)continue;const raw=nums[nums.length-1],amt=Math.abs(parseMoney(raw));if(!amt||amt<1000)continue;let date=new Date().toISOString().slice(0,10);if(dm){let y=+dm[3];if(y<100)y+=2000;date=`${y}-${String(dm[2]).padStart(2,'0')}-${String(dm[1]).padStart(2,'0')}`};const name=line.replace(dateRe,'').replace(raw,'').replace(/\s{2,}/g,' ').trim().slice(0,72)||'Giao dịch';const r={selected:true,name,date,amount:amt,type:guessType(line,raw),category:guessCat(line),account:'Sao kê'};const k=rowKey(r);if(!seen.has(k)){seen.add(k);out.push(r)}if(out.length>=60)break}return out}

  async function scanImages(files){rows=[];$('v25Result').innerHTML='';toggleButtons(true);try{const seen=new Set();for(let i=0;i<files.length;i++){progress(i,files.length,`Đang quét ảnh ${i+1}/${files.length}`,i===0?'Ảnh đầu tiên có thể chậm hơn':'Đang tiếp tục tự động');const text=await ocrImage(files[i],i+1,files.length);for(const r of parseText(text)){const k=rowKey(r);if(!seen.has(k)){seen.add(k);rows.push(r)}}progress(i+1,files.length,i+1===files.length?'Đang hoàn tất…':`Đã xong ảnh ${i+1}/${files.length}`,'Đang gom giao dịch')}render();finish(rows.length?`Xong · ${rows.length} giao dịch`:'Không tìm thấy giao dịch',!!rows.length)}catch(e){console.error(e);finish('Quét bị lỗi',false)}finally{toggleButtons(false)}}

  async function scanPdf(file){rows=[];$('v25Result').innerHTML='';toggleButtons(true);try{progress(0,1,'Đang đọc PDF…','Có thể mất một lúc');if(!window.pdfjsLib){const mod=await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.min.mjs');window.pdfjsLib=mod;window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.min.mjs'}const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;const seen=new Set();for(let p=1;p<=Math.min(pdf.numPages,6);p++){const page=await pdf.getPage(p),vp=page.getViewport({scale:1.6}),c=document.createElement('canvas'),ctx=c.getContext('2d');c.width=vp.width;c.height=vp.height;await page.render({canvasContext:ctx,viewport:vp}).promise;const text=await ocrImage(c,p,Math.min(pdf.numPages,6));for(const r of parseText(text)){const k=rowKey(r);if(!seen.has(k)){seen.add(k);rows.push(r)}}}render();finish(rows.length?`Xong · ${rows.length} giao dịch`:'Không tìm thấy giao dịch',!!rows.length)}catch(e){console.error(e);finish('Quét bị lỗi',false)}finally{toggleButtons(false)}}

  function toggleButtons(disabled){$('v25PickImages').disabled=disabled;$('v25PickPdf').disabled=disabled}

  function render(){const root=$('v25Result');if(!rows.length){root.innerHTML='';return}root.innerHTML=`<div class="scan-v25-summary"><b>${rows.length} giao dịch</b><span>Kiểm tra trước khi lưu</span></div><div class="scan-v25-list">${rows.map((r,i)=>`<div class="scan-v25-row"><input type="checkbox" ${r.selected?'checked':''} data-i="${i}" class="v25sel"><div class="scan-v25-main"><input class="v25name" data-i="${i}" value="${esc(r.name)}"><small>${r.date} · ${labels[r.type]}</small></div><input class="v25amt" data-i="${i}" type="number" inputmode="numeric" value="${r.amount}"></div>`).join('')}</div><button id="v25Save" class="scan-v25-save">Lưu giao dịch</button>`;
    root.querySelectorAll('.v25sel').forEach(el=>el.onchange=e=>rows[+e.target.dataset.i].selected=e.target.checked);
    root.querySelectorAll('.v25name').forEach(el=>el.onchange=e=>rows[+e.target.dataset.i].name=e.target.value);
    root.querySelectorAll('.v25amt').forEach(el=>el.onchange=e=>rows[+e.target.dataset.i].amount=Number(e.target.value));
    $('v25Save').onclick=saveRows;
  }

  function saveRows(){const chosen=rows.filter(r=>r.selected&&r.amount);if(!chosen.length)return;try{if(typeof state==='undefined'||!Array.isArray(state.transactions))throw new Error('Không truy cập được dữ liệu');for(const r of chosen){state.transactions.unshift({id:Date.now()+Math.random(),name:r.name,amount:Number(r.amount),date:r.date,type:r.type,category:r.category,account:r.account,note:'Nhập từ sao kê'});}if(typeof save==='function')save();else localStorage.setItem('moneyJournalV2',JSON.stringify(state));if(typeof render==='function'){};if(typeof window.renderAll==='function')window.renderAll();$('v25Result').innerHTML=`<div class="scan-v25-saved">✓ Đã lưu ${chosen.length} giao dịch</div>`}catch(e){console.error(e);$('v25Result').innerHTML='<div class="scan-v25-error">Không lưu được. Thử lại.</div>'}}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,1200));else setTimeout(mount,1200);
})();