
const KEY='aadhiriya_photo_dashboard_v1';
let state=JSON.parse(localStorage.getItem(KEY)||'null')||structuredClone(window.INITIAL_DATA);
let editing=false, charts={};
const money=v=>'₹ '+Number(v||0).toLocaleString('en-IN',{maximumFractionDigits:0});
const num=v=>Number(v||0).toLocaleString('en-IN',{maximumFractionDigits:1});
const latest=()=>state.monthly[state.monthly.length-1]||{};
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const totalRevenue=m=>Number(m.revenue||0)||((+m.carRevenue||0)+(+m.busRevenue||0));
const totalCost=m=>(+m.eb||0)+(+m.zeon||0)+(+m.other||0);

function renderKpis(){
 const m=latest();
 const rows=[
  ['⚡','Total Energy Charged',num(m.energy)+' kWh','green','energy'],
  ['▥','Net Profit',money(m.profit),'profitbig','profit'],
  ['₹','Total Revenue',money(totalRevenue(m)),'red',''],
  ['%','ZEON Commission',money(m.zeon),'purple',''],
  ['🧾','TNEB Bill Payment',money((+m.tneb1||0)+(+m.tneb2||0)),'yellow',''],
  ['👛','Other Expenses',money(m.other),'blue','']
 ];
 document.getElementById('kpis').innerHTML=rows.map(r=>`<div class="kpi ${r[4]}"><div class="ico ${r[3]}">${r[0]}</div><div class="txt"><span>${r[1]}</span><b>${r[2]}</b><small>↑ updated monthly</small></div></div>`).join('');
}
function renderSnapshotSelect(){
 const s=document.getElementById('snapshotMonth');const old=s.value;
 s.innerHTML=state.monthly.map((m,i)=>`<option value="${i}">${m.month}</option>`).join('');
 s.value=old && +old<state.monthly.length?old:Math.max(0,state.monthly.length-1);s.onchange=renderSnapshot;
}
function renderSnapshot(){
 const i=+document.getElementById('snapshotMonth').value||Math.max(0,state.monthly.length-1),m=state.monthly[i]||{};
 const gst=Math.max(0,(+m.gstOut||0)-(+m.gstIn||0));
 const rows=[['⚡ Energy (kWh)',num(m.energy)],['₹ Revenue',money(totalRevenue(m))],['↘ Total Cost',money(totalCost(m))],['▥ Net Profit',money(m.profit)],['▣ GST Payable',money(gst)],['⚡ TNEB Bills Due',m.tnebStatus==='Paid'?'₹ 0':money((+m.tneb1||0)+(+m.tneb2||0))]];
 document.getElementById('snapshot').innerHTML=rows.map(r=>`<div class="snap"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');
}
function renderCharts(){
 Object.values(charts).forEach(c=>c.destroy());
 const m=latest(),labels=state.monthly.map(x=>x.month);
 charts.rev=new Chart(document.getElementById('revenueChart'),{type:'doughnut',data:{labels:['Cars','Buses'],datasets:[{data:[+m.carRevenue||65,+m.busRevenue||35]}]},options:{cutout:'65%',plugins:{legend:{position:'right',labels:{boxWidth:10,font:{size:9}}}}}});
 charts.exp=new Chart(document.getElementById('expenseChart'),{type:'doughnut',data:{labels:['EB Cost','ZEON Commission','Other'],datasets:[{data:[+m.eb||0,+m.zeon||0,+m.other||0]}]},options:{cutout:'65%',plugins:{legend:{position:'right',labels:{boxWidth:10,font:{size:9}}}}}});
 charts.profit=new Chart(document.getElementById('profitChart'),{type:'bar',data:{labels,datasets:[{label:'Revenue',data:state.monthly.map(totalRevenue)},{label:'Cost',data:state.monthly.map(totalCost)},{type:'line',label:'Profit',data:state.monthly.map(x=>+x.profit||0),tension:.35}]},options:{plugins:{legend:{labels:{boxWidth:10,font:{size:9}}}},scales:{x:{grid:{display:false},ticks:{font:{size:8}}},y:{ticks:{font:{size:8}}}}}});
}
function businessCols(){
 return [
  {k:'month',l:'Month',type:'text'},
  {k:'energy',l:'Energy (kWh)'},
  {k:'revenue',l:'Total Revenue (₹)'},
  {k:'zeon',l:'ZEON Commission (₹)'},
  {k:'tnebBill',l:'TNEB Bill (₹)'},
  {k:'other',l:'Other Expenses (₹)'},
  {k:'profit',l:'Net Profit (₹)'},
  ...(state.customColumns||[]).map(c=>({k:c.key,l:c.label,custom:true}))
 ];
}
function cell(row,key,i,type){
 let v=row[key]??'';
 if(key==='tnebBill') v=(+row.tneb1||0)+(+row.tneb2||0);
 if(!editing){
   if(key==='month')return v;
   if(key==='energy')return num(v);
   return money(v);
 }
 return `<input class="cell-input ${type==='text'?'text':''}" data-i="${i}" data-k="${key}" type="${type==='text'?'text':'number'}" step="any" value="${v}">`;
}
function renderBusiness(){
 const cols=businessCols();
 document.querySelector('#businessTable thead').innerHTML='<tr>'+cols.map(c=>`<th>${c.custom?`<span class="custom-th">${c.l}<button onclick="removeCustomColumn('${c.k}')">×</button></span>`:c.l}</th>`).join('')+(editing?'<th>Action</th>':'')+'</tr>';
 document.querySelector('#businessTable tbody').innerHTML=state.monthly.map((m,i)=>'<tr>'+cols.map(c=>`<td class="editable ${c.k==='profit'?'profit':''}">${cell(m,c.k,i,c.type)}</td>`).join('')+(editing?`<td><button class="delete" onclick="deleteMonth(${i})">🗑</button></td>`:'')+'</tr>').join('');
 document.querySelectorAll('#businessTable .cell-input').forEach(el=>el.onchange=e=>{
   const i=+e.target.dataset.i,k=e.target.dataset.k;
   const value=k==='month'?e.target.value:Number(e.target.value||0);
   if(k==='tnebBill'){
     state.monthly[i].tneb1=value/2;
     state.monthly[i].tneb2=value/2;
   }else{
     state.monthly[i][k]=value;
   }
   save();renderAll(false)
 });
}
function renderGST(){
 document.querySelector('#gstTable tbody').innerHTML=state.monthly.map((m,i)=>{const net=Math.max(0,(+m.gstOut||0)-(+m.gstIn||0));return `<tr><td>${m.month}</td><td class="editable">${editing?`<input class="cell-input gst" data-i="${i}" data-k="gstOut" type="number" value="${m.gstOut||0}">`:money(m.gstOut)}</td><td class="editable">${editing?`<input class="cell-input gst" data-i="${i}" data-k="gstIn" type="number" value="${m.gstIn||0}">`:money(m.gstIn)}</td><td>${money(net)}</td><td class="${net?'pending':'paid'}">${net?'Pending':'Paid'}</td>${editing?`<td><button class="delete" onclick="clearGST(${i})">Clear</button></td>`:''}</tr>`}).join('');
 document.querySelectorAll('.gst').forEach(el=>el.onchange=e=>{state.monthly[+e.target.dataset.i][e.target.dataset.k]=Number(e.target.value||0);save();renderAll(false)});
}
function renderTNEB(){
 document.querySelector('#tnebTable tbody').innerHTML=state.monthly.map((m,i)=>`<tr><td>${m.month}</td><td class="editable">${editing?`<input class="cell-input tneb" data-i="${i}" data-k="tneb1" type="number" value="${m.tneb1||0}">`:money(m.tneb1)}</td><td class="editable">${editing?`<input class="cell-input tneb" data-i="${i}" data-k="tneb2" type="number" value="${m.tneb2||0}">`:money(m.tneb2)}</td><td>${money((+m.tneb1||0)+(+m.tneb2||0))}</td><td class="editable">${editing?`<select class="cell-select tneb" data-i="${i}" data-k="tnebStatus"><option ${m.tnebStatus==='Paid'?'selected':''}>Paid</option><option ${m.tnebStatus!=='Paid'?'selected':''}>Pending</option></select>`:`<span class="${m.tnebStatus==='Paid'?'paid':'pending'}">${m.tnebStatus||'Pending'}</span>`}</td>${editing?`<td><button class="delete" onclick="clearTNEB(${i})">Clear</button></td>`:''}</tr>`).join('');
 document.querySelectorAll('.tneb').forEach(el=>el.onchange=e=>{const k=e.target.dataset.k;state.monthly[+e.target.dataset.i][k]=k==='tnebStatus'?e.target.value:Number(e.target.value||0);save();renderAll(false)});
}
function renderTariffs(){
 document.querySelector('#tariffTable tbody').innerHTML=state.tariffs.map((t,i)=>`<tr><td class="editable">${editing?`<input class="cell-input tariff-edit text" data-i="${i}" data-k="type" type="text" value="${t.type}">`:t.type}</td><td class="editable">${editing?`<input class="cell-input tariff-edit" data-i="${i}" data-k="rate" type="number" step="any" value="${t.rate}">`:t.rate}</td><td class="editable">${editing?`<input class="cell-input tariff-edit text" data-i="${i}" data-k="notes" type="text" value="${t.notes||''}">`:t.notes||''}</td>${editing?`<td><button class="delete" onclick="deleteTariff(${i})">🗑</button></td>`:''}</tr>`).join('');
 document.querySelectorAll('.tariff-edit').forEach(el=>el.onchange=e=>{const i=+e.target.dataset.i,k=e.target.dataset.k;state.tariffs[i][k]=k==='rate'?Number(e.target.value||0):e.target.value;save();renderAll(false)});
}
function renderAlerts(){
 const arr=[];state.monthly.filter(x=>x.tnebStatus!=='Paid').slice(-2).forEach(x=>arr.push([`TNEB Bill (${x.month})`,money((+x.tneb1||0)+(+x.tneb2||0))+' pending']));
 const m=latest(),gst=Math.max(0,(+m.gstOut||0)-(+m.gstIn||0));if(gst)arr.push([`GST Payment (${m.month})`,money(gst)+' pending']);arr.push(['ZEON Renewal','Review subscription']);arr.push(['Monthly Backup','Export after update']);
 document.getElementById('alerts').innerHTML=arr.map(a=>`<div class="alert-row"><span>${a[0]}</span><span>${a[1]}</span></div>`).join('');
}
function renderBrands(){
 document.getElementById('brands').innerHTML=state.vehicleBrands.map(v=>`<div class="brand-row"><span>${v.name}</span><div class="bar"><i style="width:${v.share}%"></i></div><b>${v.share}%</b></div>`).join('');
}
function renderExpenses(){
 document.getElementById('expenses').innerHTML=state.expenses.map((x,i)=>`<div class="expense"><b>${x.name}</b><span>${money(x.amount)} · ${x.cycle} · ${x.status}</span>${editing?`<div class="tools"><button onclick="editExpense(${i})">Edit</button><button onclick="deleteExpense(${i})">Delete</button></div>`:''}</div>`).join('');
}
function renderAll(chartsToo=true){renderKpis();renderSnapshotSelect();renderSnapshot();renderBusiness();renderGST();renderTNEB();renderTariffs();renderAlerts();renderBrands();renderExpenses();if(chartsToo)renderCharts()}
window.toggleEdit=()=>{editing=!editing;document.body.classList.toggle('editing',editing);document.getElementById('editModeTop').textContent=editing?'✓ Edit Mode ON':'✎ Edit Mode';renderAll(false)};
document.getElementById('editModeTop').onclick=toggleEdit;

function openModal(title,fields,vals,onSave){
 document.getElementById('modalTitle').textContent=title;const f=document.getElementById('modalForm');
 f.innerHTML=`<div class="form-grid">${fields.map(x=>`<div class="field"><label>${x.label}</label>${x.type==='select'?`<select name="${x.name}">${x.options.map(o=>`<option ${vals[x.name]===o?'selected':''}>${o}</option>`).join('')}</select>`:`<input name="${x.name}" type="${x.type||'number'}" step="any" value="${vals[x.name]??''}">`}</div>`).join('')}<div class="form-actions"><button type="button" onclick="closeModal()">Cancel</button><button class="save">Save</button></div></div>`;
 f.onsubmit=e=>{e.preventDefault();const fd=new FormData(f),obj={};fields.forEach(x=>obj[x.name]=(x.type==='text'||x.type==='select')?fd.get(x.name):Number(fd.get(x.name)||0));onSave(obj);save();closeModal();renderAll()};
 document.getElementById('modal').classList.add('open');
}
window.closeModal=()=>document.getElementById('modal').classList.remove('open');
const monthFields=[
{name:'month',label:'Month',type:'text'},
{name:'energy',label:'Energy (kWh)'},
{name:'revenue',label:'Total Revenue'},
{name:'zeon',label:'ZEON Commission'},
{name:'tnebBill',label:'TNEB Bill'},
{name:'other',label:'Other Expenses'},
{name:'profit',label:'Net Profit'},
{name:'gstOut',label:'GST Output'},
{name:'gstIn',label:'GST Input'},
{name:'tnebStatus',label:'TNEB Status',type:'select',options:['Paid','Pending']}
];
window.addMonth=()=>openModal('Add Month',monthFields,{tnebStatus:'Pending'},o=>{
 const bill=+o.tnebBill||0;
 o.tneb1=bill/2;
 o.tneb2=bill/2;
 delete o.tnebBill;
 (state.customColumns||[]).forEach(c=>o[c.key]=0);
 state.monthly.push(o)
});
window.deleteMonth=i=>{if(confirm('Delete this month?')){state.monthly.splice(i,1);save();renderAll()}};
window.clearGST=i=>{state.monthly[i].gstOut=0;state.monthly[i].gstIn=0;save();renderAll(false)};
window.clearTNEB=i=>{state.monthly[i].tneb1=0;state.monthly[i].tneb2=0;state.monthly[i].tnebStatus='Paid';save();renderAll(false)};
window.addCustomColumn=()=>openModal('Add Column',[{name:'label',label:'Column Name',type:'text'}],{},o=>{const key='custom_'+Date.now();state.customColumns.push({key,label:o.label||'New Column'});state.monthly.forEach(m=>m[key]=0)});
window.removeCustomColumn=key=>{if(confirm('Remove this column and all its data?')){state.customColumns=state.customColumns.filter(c=>c.key!==key);state.monthly.forEach(m=>delete m[key]);save();renderAll(false)}};
const tariffFields=[{name:'type',label:'Vehicle Type',type:'text'},{name:'rate',label:'Rate ₹/kWh'},{name:'notes',label:'Notes',type:'text'}];
window.addTariff=()=>openModal('Add Tariff',tariffFields,{},o=>state.tariffs.push(o));
window.deleteTariff=i=>{if(confirm('Delete tariff?')){state.tariffs.splice(i,1);save();renderAll(false)}};
const expenseFields=[{name:'name',label:'Expense Name',type:'text'},{name:'amount',label:'Amount'},{name:'cycle',label:'Cycle',type:'select',options:['Monthly','Quarterly','Yearly','One time']},{name:'status',label:'Status',type:'select',options:['Active','Paid','Due','Stopped']}];
window.addExpense=()=>openModal('Add Expense',expenseFields,{cycle:'Yearly',status:'Active'},o=>state.expenses.push(o));
window.editExpense=i=>openModal('Edit Expense',expenseFields,state.expenses[i],o=>state.expenses[i]=o);
window.deleteExpense=i=>{if(confirm('Delete expense?')){state.expenses.splice(i,1);save();renderAll(false)}};
function download(content,name,type){const blob=new Blob([content],{type}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
document.getElementById('backupBtn').onclick=()=>download(JSON.stringify(state,null,2),'aadhiriya-dashboard-backup.json','application/json');
document.getElementById('importInput').onchange=e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{state=JSON.parse(r.result);save();renderAll();alert('Backup imported successfully.')}catch{alert('Invalid backup file.')}};r.readAsText(file)};
document.getElementById('excelBtn').onclick=()=>{const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(state.monthly),'Monthly Business');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(state.tariffs),'Tariffs');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(state.expenses),'Expenses');XLSX.writeFile(wb,'aadhiriya-dashboard.xlsx')};
document.getElementById('pdfBtn').onclick=()=>window.print();document.getElementById('printBtn').onclick=()=>window.print();
renderAll();
