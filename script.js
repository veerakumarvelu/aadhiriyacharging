
const D=window.DASHBOARD_DATA;
const money=n=>n==null?'—':'₹'+Math.round(n).toLocaleString('en-IN');
const num=n=>n==null?'—':Number(n).toLocaleString('en-IN',{maximumFractionDigits:1});
const latest=D.monthly[D.monthly.length-1];

function renderKPIs(){
  const unpaid=D.ebBills.filter(x=>x.status!=='Paid').reduce((a,b)=>a+b.bill,0);
  const netGST=Math.max(0,(latest.gst_out||0)-(latest.gst_in||0));
  const cards=[
    ['Latest EV Income',money(latest.income),latest.month],
    ['Recorded Profit',money(latest.profit),latest.month],
    ['Cumulative Profit',money(latest.cum),'from billing sheet'],
    ['GST Payable (indicative)',money(netGST),'verify with auditor'],
    ['Unpaid EB',money(unpaid),unpaid?'action required':'all paid']
  ];
  document.getElementById('kpis').innerHTML=cards.map(c=>`<div class="kpi"><span>${c[0]}</span><b>${c[1]}</b><small>${c[2]}</small></div>`).join('');
}
function renderMonthSelect(){
 const s=document.getElementById('monthSelect');
 s.innerHTML=D.monthly.map((m,i)=>`<option value="${i}" ${i===D.monthly.length-1?'selected':''}>${m.month}</option>`).join('');
 s.onchange=()=>renderMonth(+s.value);
}
function renderMonth(i){
 const m=D.monthly[i];
 const details=[['EV Income',money(m.income)],['EB Cost',money(m.eb)],['ZEON Commission',money(m.commission)],['Recorded Profit',money(m.profit)]];
 document.getElementById('monthDetails').innerHTML=details.map(x=>`<div class="mini"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');
 const margin=m.income?Math.max(-100,Math.min(100,m.profit/m.income*100)):0;
 document.getElementById('marginText').textContent=margin.toFixed(1)+'%';
 document.getElementById('marginBar').style.width=Math.max(0,margin)+'%';
 document.getElementById('gstOut').textContent=money(m.gst_out);
 document.getElementById('gstIn').textContent=money(m.gst_in);
 document.getElementById('gstNet').textContent=money(Math.max(0,(m.gst_out||0)-(m.gst_in||0)));
}
function renderEB(filter='all'){
 const rows=D.ebBills.filter(x=>filter==='all'||(filter==='unpaid'&&x.status!=='Paid'));
 document.getElementById('ebTable').innerHTML=rows.map(x=>`<tr>
  <td>${x.month}</td><td>${money(x.bill)}</td><td>${money(x.veerakumar)}</td><td>${money(x.saranya)}</td>
  <td>${money(x.fixed)}</td><td>${num(x.units)}</td><td class="${x.status==='Paid'?'good':'bad'}">${x.status}</td></tr>`).join('');
}
function renderPNL(){
 document.getElementById('pnlTable').innerHTML=D.monthly.map(x=>`<tr>
 <td>${x.month}</td><td>${money(x.income)}</td><td>${money(x.eb)}</td><td>${money(x.commission)}</td>
 <td class="${x.profit>=0?'good':'bad'}">${money(x.profit)}</td><td>${money(x.cum)}</td><td>${num(x.units)}</td></tr>`).join('');
}
function renderAlerts(){
 const unpaid=D.ebBills.filter(x=>x.status!=='Paid');
 const gstNet=Math.max(0,(latest.gst_out||0)-(latest.gst_in||0));
 let a=[];
 unpaid.forEach(x=>a.push({title:`${x.month} EB bill unpaid`,detail:`Amount ${money(x.bill)}`,urgent:true}));
 if(gstNet>0)a.push({title:'GST payment review',detail:`Indicative net payable ${money(gstNet)} for ${latest.month}`,urgent:true});
 const ebLatest=D.ebBills[D.ebBills.length-1];
 const pnlLatest=D.monthly[D.monthly.length-1];
 if(Math.abs((ebLatest.bill||0)-(pnlLatest.eb||0))>0){
   a.push({title:'EB amount mismatch',detail:`P&L shows ${money(pnlLatest.eb)} vs EB tracker ${money(ebLatest.bill)} (${money(Math.abs(ebLatest.bill-pnlLatest.eb))} difference)`,urgent:false});
 }
 a.push({title:'ZEON live sync not connected',detail:'Use a supported API/export endpoint; keep credentials server-side only.',urgent:false});
 document.getElementById('alerts').innerHTML=a.map(x=>`<div class="alert ${x.urgent?'urgent':''}"><div><strong>${x.title}</strong><span>${x.detail}</span></div><div>${x.urgent?'⚠️':'ℹ️'}</div></div>`).join('');
}
function renderExpenses(){
 document.getElementById('expenses').innerHTML=D.expenses.map(x=>`<div class="expense"><div><strong>${x.item}</strong><span>${x.notes}</span></div><div><strong>${money(x.amount)}</strong><span>${x.renewal}</span></div></div>`).join('');
}
document.querySelectorAll('.status-filter button').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('.status-filter button').forEach(x=>x.classList.remove('active'));
 b.classList.add('active');renderEB(b.dataset.filter);
});
document.getElementById('syncBtn').onclick=()=>alert('ZEON live sync is not connected yet. The safe next step is to use a ZEON-supported API or export endpoint and store login/API secrets only on the server, never in GitHub.');
renderKPIs();renderMonthSelect();renderMonth(D.monthly.length-1);renderEB();renderPNL();renderAlerts();renderExpenses();
