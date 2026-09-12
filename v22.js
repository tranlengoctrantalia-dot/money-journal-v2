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
      <div class="cam">🧾</div>
      <div class="simple-scan-title">Nhập sao kê</div>
      <div class="simple-scan-sub">Chọn tối đa 10 ảnh hoặc 1 file PDF.</div>
      <input id="statementPhoto" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple hidden>
      <input id="statementPdf" type="file" accept="application/pdf" hidden>
      <input id="statementFile" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf" hidden>
      <select id="statementSource" hidden><option value="auto" selected>Tự nhận diện</option><option value="vpbank">VPBank</option><option value="shinhan">Shinhan</option><option value="paylater">Ví Trả Sau</option><option value="other">Khác</option></select>
      <input id="statementAccount" hidden>
      <div class="simple-upload">
        <button class="btn" id="pickPhotoBtn">🖼️ Chọn ảnh</button>
        <button class="btn secondary-upload" id="pickPdfBtn">📄 Chọn PDF</button>
      </div>
      <div id="photoCount" class="file-count">Chưa chọn ảnh</div>
      <details class="scan-options">
        <summary>Tuỳ chọn</summary>
        <div class="provider-row">
          <div><label>Ngân hàng / ví</label><select id="statementSourceVisible"><option value="auto">Tự nhận diện</option><option value="vpbank">VPBank</option><option value="shinhan">Shinhan</option><option value="paylater">Ví Trả Sau</option><option value="other">Khác</option></select></div>
          <div><label>Tài khoản</label><input id="statementAccountVisible" placeholder="VD: Shinhan Credit"></div>
        </div>
      </details>`;

    const photo=byId('statementPhoto'), pdf=byId('statementPdf');
    byId('pickPhotoBtn').onclick = () => photo.click();
    byId('pickPdfBtn').onclick = () => pdf.click();
    photo.onchange = async () => {
      const selected = Array.from(photo.files || []);
      const files = selected.slice(0,10);
      byId('photoCount').textContent = selected.length > 10 ? `Đã chọn ${files.length}/10 ảnh • bỏ qua ${selected.length-10} ảnh` : `Đã chọn ${files.length}/10 ảnh`;
      if(files.length) await scanStatementBatch(files);
      photo.value='';
    };
    pdf.onchange = async () => {
      const file=pdf.files?.[0];
      if(file && typeof window.scanStatement==='function') await window.scanStatement(file);
      pdf.value='';
    };
    byId('statementSourceVisible').onchange = e => byId('statementSource').value=e.target.value;
    byId('statementAccountVisible').oninput = e => byId('statementAccount').value=e.target.value;
  }

  async function scanStatementBatch(files){
    if(typeof window.scanStatement !== 'function') return;
    const all=[]; const seen=new Set();
    const status=byId('ocrStatus');
    for(let i=0;i<files.length;i++){
      if(status) status.textContent=`Đang đọc ảnh ${i+1}/${files.length}…`;
      await window.scanStatement(files[i]);
      const rows=(getRows()||[]).map(r=>({...r}));
      for(const r of rows){
        const k=rowKey(r);
        if(seen.has(k)) continue;
        seen.add(k); all.push(r);
      }
    }
    setRows(all);
    if(typeof window.renderCandidates==='function') window.renderCandidates();
    if(typeof window.updateReviewSummary==='function') window.updateReviewSummary();
    if(byId('reviewTools')) byId('reviewTools').style.display=all.length?'flex':'none';
    if(byId('reviewSummary')) byId('reviewSummary').style.display=all.length?'grid':'none';
    if(byId('saveCandidatesWrap')) byId('saveCandidatesWrap').style.display=all.length?'block':'none';
    if(status) status.textContent=all.length?`Đã đọc ${files.length} ảnh • ${all.length} giao dịch chờ kiểm tra.`:'Chưa đọc được giao dịch. Thử ảnh rõ hơn.';
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
          ${r.confidence<60?`<span class="confidence low">Cần kiểm tra</span>`:''}
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
