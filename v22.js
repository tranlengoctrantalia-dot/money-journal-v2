(() => {
  const byId = id => document.getElementById(id);
  const labels = {spending:'Chi tiêu',income:'Thu nhập',money_in:'Tiền vào',debt_payment:'Trả thẻ',refund:'Hoàn tiền',transfer:'Chuyển tiền'};
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function simplifyCopy(){
    document.body.classList.add('v22-simple');
    [...document.querySelectorAll('.chip')].forEach(x=>{ if(/Trung Thu/i.test(x.textContent)) x.textContent='🌕 Trung Thu'; });
    [...document.querySelectorAll('.link')].forEach(x=>{
      if(/analytics/i.test(x.textContent)) x.textContent='Phân tích';
      if(/activity/i.test(x.textContent)) x.textContent='Xem thêm';
    });
    [...document.querySelectorAll('.mini span')].forEach(x=>{
      const t=x.textContent.trim().toLowerCase();
      if(t==='income') x.textContent='Thu nhập';
      if(t==='spending') x.textContent='Đã chi';
      if(t.includes('debt')) x.textContent='Trả thẻ';
      if(t.includes('money')) x.textContent='Tiền vào';
    });
  }

  function mountSimpleScan(){
    const scan = document.querySelector('#scan .scan-box, #scan .scan');
    if(!scan) return;
    scan.innerHTML = `
      <div class="cam">🧾</div>
      <div class="simple-scan-title">Thêm sao kê</div>
      <div class="simple-scan-sub">Chọn ảnh hoặc PDF có sẵn. Bạn kiểm tra trước khi lưu.</div>
      <input id="statementPhoto" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" hidden>
      <input id="statementPdf" type="file" accept="application/pdf" hidden>
      <input id="statementFile" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf" hidden>
      <select id="statementSource" hidden><option value="auto" selected>Tự nhận diện</option><option value="vpbank">VPBank</option><option value="shinhan">Shinhan</option><option value="paylater">Ví Trả Sau</option><option value="other">Khác</option></select>
      <input id="statementAccount" hidden>
      <div class="simple-upload">
        <button class="btn" id="pickPhotoBtn">🖼️ Chọn ảnh có sẵn</button>
        <button class="btn secondary-upload" id="pickPdfBtn">📄 Chọn PDF</button>
      </div>
      <details class="scan-options">
        <summary>Tuỳ chọn</summary>
        <div class="provider-row">
          <div><label>Nguồn</label><select id="statementSourceVisible"><option value="auto">Tự nhận diện</option><option value="vpbank">VPBank</option><option value="shinhan">Shinhan</option><option value="paylater">Ví Trả Sau</option><option value="other">Khác</option></select></div>
          <div><label>Tài khoản</label><input id="statementAccountVisible" placeholder="VD: Shinhan Credit"></div>
        </div>
      </details>`;

    const photo=byId('statementPhoto'), pdf=byId('statementPdf'), hidden=byId('statementFile');
    byId('pickPhotoBtn').onclick = () => photo.click();
    byId('pickPdfBtn').onclick = () => pdf.click();
    const handoff = file => {
      if(!file) return;
      const dt = new DataTransfer(); dt.items.add(file); hidden.files = dt.files;
      if(typeof window.scanStatement === 'function') window.scanStatement(file);
    };
    photo.onchange = () => handoff(photo.files[0]);
    pdf.onchange = () => handoff(pdf.files[0]);
    byId('statementSourceVisible').onchange = e => byId('statementSource').value=e.target.value;
    byId('statementAccountVisible').oninput = e => byId('statementAccount').value=e.target.value;
  }

  function simplifyCandidateRenderer(){
    if(typeof window.ocrRows === 'undefined') return;
    window.renderCandidates = function(){
      const root=byId('ocrCandidates'); if(!root) return;
      root.innerHTML = window.ocrRows.map((r,i)=>`<div class="candidate">
        <div class="candidate-head">
          <input type="checkbox" ${r.selected?'checked':''} onchange="ocrRows[${i}].selected=this.checked;updateReviewSummary()">
          ${r.duplicate?'<span class="confidence dupe">Có thể trùng</span>':''}
          ${r.confidence<60?`<span class="confidence low">${r.confidence}%</span>`:''}
        </div>
        <div class="candidate-main">
          <input type="text" value="${esc(r.name)}" onchange="ocrRows[${i}].name=this.value">
          <input type="number" inputmode="numeric" value="${r.amount}" onchange="ocrRows[${i}].amount=Number(this.value);updateReviewSummary()">
        </div>
        <div class="candidate-sub">
          <input type="date" value="${r.date}" onchange="ocrRows[${i}].date=this.value">
          <select onchange="ocrRows[${i}].type=this.value;updateReviewSummary()">${Object.entries(labels).map(([k,v])=>`<option value="${k}" ${r.type===k?'selected':''}>${v}</option>`).join('')}</select>
        </div>
        <details class="candidate-more"><summary>Thêm</summary><div class="candidate-extra">
          <input type="text" value="${esc(r.category)}" placeholder="Danh mục" onchange="ocrRows[${i}].category=this.value">
          <input type="text" value="${esc(r.account)}" placeholder="Tài khoản" onchange="ocrRows[${i}].account=this.value">
        </div></details>
      </div>`).join('');
    };
    window.updateReviewSummary = function(){
      const root=byId('reviewSummary'); if(!root) return;
      const rows=window.ocrRows.filter(r=>r.selected);
      const spend=rows.filter(r=>r.type==='spending').reduce((a,r)=>a+Number(r.amount||0),0);
      root.innerHTML=`<div class="review-stat"><span>Đã chọn</span><b>${rows.length}/${window.ocrRows.length}</b></div><div class="review-stat"><span>Chi tiêu</span><b>${typeof fmt==='function'?fmt(spend):spend.toLocaleString('vi-VN')+'đ'}</b></div>`;
    };
  }

  function boot(){
    simplifyCopy();
    mountSimpleScan();
    simplifyCandidateRenderer();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,120));
  else setTimeout(boot,120);
  setTimeout(boot,900);
})();
