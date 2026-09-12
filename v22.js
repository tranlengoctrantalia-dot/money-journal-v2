(() => {
  const byId = id => document.getElementById(id);
  const labels = {spending:'Chi tiêu',income:'Thu nhập',money_in:'Tiền nhận',debt_payment:'Trả thẻ',refund:'Hoàn tiền',transfer:'Chuyển tiền'};
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rowKey = r => [r.date, Math.round(Number(r.amount||0)), String(r.name||'').toLowerCase().replace(/\W/g,'')].join('|');

  function getRows(){
    try { if (typeof ocrRows !== 'undefined') return ocrRows; } catch(e) {}
    return window.ocrRows || [];
  }
  function setRows(rows){
    try { if (typeof ocrRows !== 'undefined') { ocrRows = rows; return; } } catch(e) {}
    window.ocrRows = rows;
  }

  function simplifyCopy(){
    document.body.classList.add('v22-simple');
    [...document.querySelectorAll('.chip')].forEach(x=>{ if(/Trung Thu/i.test(x.textContent)) x.textContent='🌕 Trung Thu'; });
    [...document.querySelectorAll('.link')].forEach(x=>{
      if(/analytics|phân tích/i.test(x.textContent)) x.textContent='Phân tích';
      if(/activity|xem thêm/i.test(x.textContent)) x.textContent='Xem thêm';
    });
    [...document.querySelectorAll('.mini span')].forEach(x=>{
      const t=x.textContent.trim().toLowerCase();
      if(t==='income' || t==='thu nhập') x.textContent='Thu nhập';
      if(t==='spending' || t==='đã chi') x.textContent='Đã chi';
      if(t.includes('debt') || t.includes('trả thẻ')) x.textContent='Trả thẻ';
      if(t.includes('money') || t.includes('tiền vào')) x.textContent='Tiền nhận';
    });
    [...document.querySelectorAll('.nav small')].forEach(x=>{
      const t=x.textContent.trim().toLowerCase();
      if(t==='home') x.textContent='Trang chủ';
      if(t==='activity') x.textContent='Giao dịch';
      if(t==='scan') x.textContent='Nhập';
      if(t==='budget') x.textContent='Ngân sách';
      if(t==='profile') x.textContent='Cá nhân';
    });
    document.querySelectorAll('.tiny-copy').forEach(x=>x.remove());
  }

  function mountSimpleScan(){
    const scan = document.querySelector('#scan .scan-box, #scan .scan');
    if(!scan) return;
    scan.innerHTML = `
      <div class="scan-hero-icon">🧾</div>
      <div class="simple-scan-title">Quét sao kê</div>
      <div class="simple-scan-sub">Chọn ảnh. App tự đọc và tạo giao dịch.</div>
      <input id="statementPhoto" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple hidden>
      <input id="statementPdf" type="file" accept="application/pdf" hidden>
      <input id="statementFile" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf" hidden>
      <select id="statementSource" hidden><option value="auto" selected>Tự nhận diện</option><option value="vpbank">VPBank</option><option value="shinhan">Shinhan</option><option value="paylater">Ví Trả Sau</option><option value="other">Khác</option></select>
      <input id="statementAccount" hidden>
      <div class="scan-actions">
        <button class="scan-action primary" id="pickPhotoBtn"><span class="scan-action-icon">🖼️</span><span><b>Chọn ảnh</b><small>Tối đa 10 ảnh</small></span></button>
        <button class="scan-action" id="pickPdfBtn"><span class="scan-action-icon">📄</span><span><b>Chọn PDF</b><small>1 file</small></span></button>
      </div>
      <div id="photoCount" class="file-count"></div>
      <div id="scanProgress" class="scan-progress-card" hidden>
        <div class="scan-progress-top">
          <span class="scan-spinner"></span>
          <div><b id="scanProgressTitle">Đang quét…</b><small id="scanProgressSub">Vui lòng giữ app mở</small></div>
          <span id="scanProgressCount" class="scan-count"></span>
        </div>
        <div class="scan-progress-track"><i id="scanProgressBar"></i></div>
      </div>`;

    const photo=byId('statementPhoto'), pdf=byId('statementPdf');
    byId('pickPhotoBtn').onclick = () => photo.click();
    byId('pickPdfBtn').onclick = () => pdf.click();

    photo.onchange = async () => {
      const selected = Array.from(photo.files || []);
      const files = selected.slice(0,10);
      const count=byId('photoCount');
      if(count) count.textContent = selected.length > 10 ? `Đã chọn 10 ảnh · bỏ qua ${selected.length-10}` : files.length ? `Đã chọn ${files.length} ảnh` : '';
      if(files.length) await scanStatementBatch(files);
      photo.value='';
    };

    pdf.onchange = async () => {
      const file=pdf.files?.[0];
      if(!file) return;
      showScanProgress(0,1,'Đang đọc PDF…','Có thể mất một lúc');
      try{
        if(typeof window.scanStatement==='function') await window.scanStatement(file);
        finishScanProgress('Đã đọc PDF');
      }catch(e){
        console.error(e); failScanProgress('Không đọc được PDF');
      }
      pdf.value='';
    };
  }

  function showScanProgress(done,total,title,sub){
    const box=byId('scanProgress'); if(!box) return;
    box.hidden=false; box.classList.remove('done','error'); box.classList.add('busy');
    const t=byId('scanProgressTitle'), st=byId('scanProgressSub'), c=byId('scanProgressCount'), b=byId('scanProgressBar');
    if(t) t.textContent=title||'Đang quét…';
    if(st) st.textContent=sub||'Vui lòng giữ app mở';
    if(c) c.textContent=total?`${Math.min(done,total)}/${total}`:'';
    if(b) b.style.width=(total?Math.max(6,Math.round(done/total*100)):8)+'%';
  }

  function finishScanProgress(text){
    const box=byId('scanProgress'); if(!box) return;
    box.classList.remove('busy','error'); box.classList.add('done');
    const t=byId('scanProgressTitle'), st=byId('scanProgressSub'), b=byId('scanProgressBar'), c=byId('scanProgressCount');
    if(t) t.textContent=text||'Quét xong';
    if(st) st.textContent='Kiểm tra giao dịch bên dưới';
    if(b) b.style.width='100%';
    if(c) c.textContent='✓';
  }

  function failScanProgress(text){
    const box=byId('scanProgress'); if(!box) return;
    box.classList.remove('busy','done'); box.classList.add('error');
    const t=byId('scanProgressTitle'), st=byId('scanProgressSub');
    if(t) t.textContent=text||'Có lỗi';
    if(st) st.textContent='Thử lại với ảnh rõ hơn';
  }

  async function scanStatementBatch(files){
    if(typeof window.scanStatement !== 'function') { failScanProgress('Chưa sẵn sàng để quét'); return; }
    const all=[]; const seen=new Set(); const status=byId('ocrStatus');
    const photoBtn=byId('pickPhotoBtn'), pdfBtn=byId('pickPdfBtn');
    if(photoBtn) photoBtn.disabled=true;
    if(pdfBtn) pdfBtn.disabled=true;
    showScanProgress(0,files.length,`Đang quét ${files.length} ảnh…`,'Ảnh đầu tiên thường chậm hơn');

    try{
      for(let i=0;i<files.length;i++){
        showScanProgress(i,files.length,`Đang quét ảnh ${i+1}/${files.length}`,'Đang nhận diện giao dịch');
        if(status) status.textContent=`Đang quét ảnh ${i+1}/${files.length}…`;
        await window.scanStatement(files[i]);
        const rows=(getRows()||[]).map(r=>({...r}));
        for(const r of rows){
          const k=rowKey(r);
          if(seen.has(k)) continue;
          seen.add(k); all.push(r);
        }
        showScanProgress(i+1,files.length,i+1===files.length?'Đang hoàn tất…':`Đã xong ảnh ${i+1}/${files.length}`,'Tiếp tục tự động');
      }

      setRows(all);
      if(typeof window.renderCandidates==='function') window.renderCandidates();
      if(typeof window.updateReviewSummary==='function') window.updateReviewSummary();
      if(byId('reviewTools')) byId('reviewTools').style.display=all.length?'flex':'none';
      if(byId('reviewSummary')) byId('reviewSummary').style.display=all.length?'grid':'none';
      if(byId('saveCandidatesWrap')) byId('saveCandidatesWrap').style.display=all.length?'block':'none';
      if(status) status.textContent=all.length?`Tìm thấy ${all.length} giao dịch.`:'Không tìm thấy giao dịch.';
      finishScanProgress(all.length?`Xong · ${all.length} giao dịch`:'Không tìm thấy giao dịch');
    }catch(e){
      console.error(e);
      failScanProgress('Quét bị gián đoạn');
      if(status) status.textContent='Quét bị gián đoạn. Thử lại.';
    }finally{
      if(photoBtn) photoBtn.disabled=false;
      if(pdfBtn) pdfBtn.disabled=false;
    }
  }
  window.scanStatementBatch = scanStatementBatch;

  function simplifyCandidateRenderer(){
    window.renderCandidates = function(){
      const root=byId('ocrCandidates'); if(!root) return;
      const rows=getRows();
      root.innerHTML = rows.map((r,i)=>`<div class="candidate">
        <div class="candidate-head">
          <input type="checkbox" ${r.selected?'checked':''} onchange="ocrRows[${i}].selected=this.checked;updateReviewSummary()">
          <span class="candidate-type">${labels[r.type]||'Giao dịch'}</span>
          ${r.duplicate?'<span class="confidence dupe">Có thể trùng</span>':''}
          ${r.confidence<60?'<span class="confidence low">Cần kiểm tra</span>':''}
        </div>
        <div class="candidate-main">
          <input type="text" value="${esc(r.name)}" placeholder="Nội dung" onchange="ocrRows[${i}].name=this.value">
          <input type="number" inputmode="numeric" value="${r.amount}" placeholder="Số tiền" onchange="ocrRows[${i}].amount=Number(this.value);updateReviewSummary()">
        </div>
        <div class="candidate-sub">
          <input type="date" value="${r.date}" onchange="ocrRows[${i}].date=this.value">
          <select onchange="ocrRows[${i}].type=this.value;renderCandidates();updateReviewSummary()">${Object.entries(labels).map(([k,v])=>`<option value="${k}" ${r.type===k?'selected':''}>${v}</option>`).join('')}</select>
        </div>
        <details class="candidate-more"><summary>Chi tiết</summary><div class="candidate-extra">
          <input type="text" value="${esc(r.category)}" placeholder="Danh mục" onchange="ocrRows[${i}].category=this.value">
          <input type="text" value="${esc(r.account)}" placeholder="Tài khoản" onchange="ocrRows[${i}].account=this.value">
        </div></details>
      </div>`).join('');
    };

    window.updateReviewSummary = function(){
      const root=byId('reviewSummary'); if(!root) return;
      const rows=getRows().filter(r=>r.selected);
      const spend=rows.filter(r=>r.type==='spending').reduce((a,r)=>a+Number(r.amount||0),0);
      root.innerHTML=`<div class="review-stat"><span>Đã chọn</span><b>${rows.length}</b></div><div class="review-stat"><span>Tổng chi</span><b>${typeof fmt==='function'?fmt(spend):spend.toLocaleString('vi-VN')+'đ'}</b></div>`;
    };
  }

  function cleanRuleCopy(){
    document.querySelectorAll('.statement-card, .rule-card').forEach(card=>{
      const text=card.textContent.toLowerCase();
      if(text.includes('debt payment')) card.innerHTML='<b>💳 Trả thẻ</b><p>Không tính lại vào chi tiêu.</p>';
      else if(text.includes('money in')) card.innerHTML='<b>💸 Tiền nhận</b><p>Tiền chuyển vào, không mặc định là thu nhập.</p>';
      else if(text.includes('refund')) card.innerHTML='<b>↩️ Hoàn tiền</b><p>Trừ lại vào khoản đã chi.</p>';
    });
    [...document.querySelectorAll('*')].forEach(el=>{
      if(el.children.length) return;
      const t=el.textContent.trim();
      if(t==='Rule thông minh') el.textContent='Tự động phân loại';
      if(t==='Activity') el.textContent='Giao dịch';
      if(t==='Budget') el.textContent='Ngân sách';
      if(t==='Profile & Backup') el.textContent='Cá nhân & sao lưu';
    });
  }

  function boot(){
    simplifyCopy();
    mountSimpleScan();
    simplifyCandidateRenderer();
    cleanRuleCopy();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,160));
  else setTimeout(boot,160);
  setTimeout(boot,1000);
})();
