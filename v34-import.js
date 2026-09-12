(() => {
  const MIGRATION='mj_v34_statement_import_20260912';
  const rows=[
    // Ví Trả Sau / MoMo
    {date:'2026-08-28',amount:326000,type:'spending',category:'Giải trí',source:'Ví Trả Sau',name:'CGV',note:'Mua vé xem phim CGV'},
    {date:'2026-08-06',amount:33000,type:'spending',category:'Phí',source:'Ví Trả Sau',name:'Phí Ví Trả Sau',note:'Phí dịch vụ hằng tháng'},
    {date:'2026-08-06',amount:90000,type:'spending',category:'Hóa đơn',source:'Ví Trả Sau',name:'MobiFone',note:'Chi tiêu MobiFone'},
    {date:'2026-08-04',amount:98800,type:'debt',category:'Thanh toán dư nợ',source:'Ví Trả Sau',name:'Thanh toán Ví Trả Sau',note:'Thanh toán dư nợ tháng 07'},

    // VPBank - giao dịch thật + phần phải trả kỳ này. Không nhập các bút toán kỹ thuật ±20tr / ±6,666,666.67.
    {date:'2026-07-27',amount:143900,type:'spending',category:'Ăn uống',source:'VPBank',name:'WinMart',note:'WCM_WINMART_5840_VM+HC'},
    {date:'2026-08-10',amount:807420,type:'debt',category:'Thanh toán dư nợ',source:'VPBank',name:'Thanh toán VPBank',note:'Credit Account I2B Virtual Card payment'},
    {date:'2026-08-20',amount:300000,type:'spending',category:'Phí',source:'VPBank',name:'Phí khoản vay',note:'Cash Withdrawal From Client to RBS - Custom Fee'},
    {date:'2026-08-20',amount:30000,type:'spending',category:'Phí',source:'VPBank',name:'VAT phí khoản vay',note:'VAT khoản phí 300.000đ'},
    {date:'2026-08-20',amount:500000,type:'spending',category:'Phí',source:'VPBank',name:'Phí IDT',note:'IDT:IP17 - phí liên quan khoản vay 20 triệu'},
    {date:'2026-08-20',amount:50000,type:'spending',category:'Phí',source:'VPBank',name:'VAT IDT',note:'IDT:IV17 - VAT phí liên quan khoản vay 20 triệu'},
    {date:'2026-08-23',amount:891216,type:'spending',category:'Ăn uống',source:'VPBank',name:'Manwah',note:'MANWAH VIETTEL CMTS Q1'},
    {date:'2026-08-26',amount:6666667,type:'debt',category:'Trả góp',source:'VPBank',name:'Trả góp VPBank',note:'Gốc phải trả kỳ này của khoản Cash Installment 20.000.000đ'},

    // Shinhan - Purchase & Cash Advance
    {date:'2026-08-09',amount:55000,type:'spending',category:'Di chuyển',source:'Shinhan',name:'Grab',note:'Grab'},
    {date:'2026-08-10',amount:23076,type:'spending',category:'Di chuyển',source:'Shinhan',name:'Grab',note:'Grab'},
    {date:'2026-08-11',amount:55080,type:'spending',category:'Di chuyển',source:'Shinhan',name:'Grab',note:'Grab'},
    {date:'2026-08-12',amount:28132,type:'spending',category:'Di chuyển',source:'Shinhan',name:'Grab',note:'Grab'},
    {date:'2026-08-15',amount:162000,type:'spending',category:'Mua sắm',source:'Shinhan',name:'Shopee',note:'Shopee'},
    {date:'2026-08-16',amount:1881306,type:'spending',category:'Khác',source:'Shinhan',name:'SUN UNDER NIGHT',note:'CTTNHH SUN UNDER NIGHT'},
    {date:'2026-08-16',amount:171000,type:'spending',category:'Di chuyển',source:'Shinhan',name:'Grab',note:'Grab'},
    {date:'2026-08-17',amount:45179,type:'spending',category:'Dịch vụ số',source:'Shinhan',name:'Apple',note:'APPLE.COM/BILL'},
    {date:'2026-08-17',amount:12000,type:'spending',category:'Dịch vụ số',source:'Shinhan',name:'Apple',note:'APPLE.COM/BILL'},
    {date:'2026-08-17',amount:118000,type:'spending',category:'Di chuyển',source:'Shinhan',name:'Grab',note:'Grab'},
    {date:'2026-08-18',amount:177650,type:'spending',category:'Mua sắm',source:'Shinhan',name:'TikTok Shop',note:'9PAY*TikTok Shop Seller'},
    {date:'2026-08-18',amount:64500,type:'spending',category:'Di chuyển',source:'Shinhan',name:'Grab',note:'Grab'},
    {date:'2026-08-19',amount:26592,type:'spending',category:'Di chuyển',source:'Shinhan',name:'Grab',note:'Grab'},
    {date:'2026-08-20',amount:400000,type:'spending',category:'Khác',source:'Shinhan',name:'Go2Joy',note:'MEGAPAY*GO2JOY VN'},
    {date:'2026-08-21',amount:32000,type:'spending',category:'Di chuyển',source:'Shinhan',name:'Green SM',note:'OP *Green SM'},
    {date:'2026-08-21',amount:32000,type:'spending',category:'Di chuyển',source:'Shinhan',name:'Green SM',note:'OP *Green SM'},
    {date:'2026-08-22',amount:130000,type:'spending',category:'Di chuyển',source:'Shinhan',name:'Grab',note:'Grab'},
    {date:'2026-08-22',amount:175960,type:'spending',category:'Mua sắm',source:'Shinhan',name:'Shopee',note:'Shopee'},
    {date:'2026-08-22',amount:68844,type:'spending',category:'Mua sắm',source:'Shinhan',name:'Shopee',note:'Shopee'},
    {date:'2026-08-22',amount:159297,type:'spending',category:'Mua sắm',source:'Shinhan',name:'TikTok Shop',note:'9PAY*TikTok Shop Seller'},
    {date:'2026-08-22',amount:184912,type:'spending',category:'Mua sắm',source:'Shinhan',name:'Shopee',note:'Shopee'},
    {date:'2026-08-26',amount:95040,type:'spending',category:'Mua sắm',source:'Shinhan',name:'Shopee',note:'Shopee'},
    {date:'2026-08-26',amount:37466,type:'spending',category:'Di chuyển',source:'Shinhan',name:'Grab',note:'Grab'},
    {date:'2026-08-27',amount:35833,type:'spending',category:'Di chuyển',source:'Shinhan',name:'Grab',note:'Grab'},
    {date:'2026-08-28',amount:115213,type:'spending',category:'Mua sắm',source:'Shinhan',name:'Shopee',note:'Shopee'},
    {date:'2026-08-28',amount:230100,type:'spending',category:'Mua sắm',source:'Shinhan',name:'Shopee',note:'Shopee'},
    {date:'2026-08-29',amount:202020,type:'spending',category:'Mua sắm',source:'Shinhan',name:'Shopee',note:'Shopee'},
    {date:'2026-08-30',amount:239420,type:'spending',category:'Ăn uống',source:'Shinhan',name:'Foody',note:'Foody'},
    {date:'2026-09-06',amount:561600,type:'spending',category:'Ăn uống',source:'Shinhan',name:'Kimgane',note:'CTTNHH KIMGANE TB'},
    {date:'2026-09-07',amount:706000,type:'spending',category:'Mua sắm',source:'Shinhan',name:'Cellphones',note:'CELLPHONES'},
    {date:'2026-09-08',amount:24667,type:'spending',category:'Di chuyển',source:'Shinhan',name:'Grab',note:'Grab'},
    {date:'2026-09-08',amount:255200,type:'spending',category:'Mua sắm',source:'Shinhan',name:'Shopee',note:'Shopee'},
    {date:'2026-09-08',amount:299000,type:'spending',category:'Mua sắm',source:'Shinhan',name:'Shopee',note:'Shopee'},

    // Shinhan - trả góp kỳ này + thanh toán thẻ. Không nhập lại gốc ban đầu 27,7tr / 3,473tr.
    {date:'2026-08-15',amount:3077777,type:'debt',category:'Trả góp',source:'Shinhan',name:'Trả góp Shinhan',note:'Bệnh viện Mắt Sài Gòn - gốc trả kỳ này'},
    {date:'2026-08-15',amount:578835,type:'debt',category:'Trả góp',source:'Shinhan',name:'Trả góp Shinhan',note:'Cellphones - gốc trả kỳ này'},
    {date:'2026-08-15',amount:10433689,type:'debt',category:'Thanh toán dư nợ',source:'Shinhan',name:'Thanh toán Shinhan',note:'Thanh toán trong kỳ'}
  ];

  function importNow(){
    try{
      if(localStorage.getItem(MIGRATION)==='1') return;
      if(typeof state==='undefined' || !state || !Array.isArray(state.transactions)) return;
      const existing=new Set(state.transactions.map(t=>[t.date,Number(t.amount)||0,String(t.name||'').toLowerCase(),String(t.source||t.account||'')].join('|')));
      let added=0;
      rows.forEach((r,idx)=>{
        const key=[r.date,r.amount,r.name.toLowerCase(),r.source].join('|');
        if(existing.has(key)) return;
        state.transactions.push({id:`stmt-v34-${idx}`,name:r.name,amount:r.amount,date:r.date,type:r.type,category:r.category,source:r.source,account:r.source,note:r.note,imported:true});
        existing.add(key); added++;
      });
      localStorage.setItem(MIGRATION,'1');
      if(typeof save==='function') save(); else localStorage.setItem('money_journal_v2_state',JSON.stringify(state));
      if(added){
        if(typeof renderAll==='function') renderAll();
        console.info(`[Money Journal] Imported ${added} statement transactions.`);
      }
    }catch(e){console.error('[Money Journal] Statement import failed',e)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(importNow,3500));else setTimeout(importNow,3500);
})();