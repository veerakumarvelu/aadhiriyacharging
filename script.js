
const KEY='aadhiriya_clean_final_v1';
let state=JSON.parse(localStorage.getItem(KEY)||'null')||structuredClone(window.INITIAL_DATA);
let editing=false, charts={};
const money=v=>'₹ '+Number(v||0).toLocaleString('en-IN',{maximumFractionDigits:0});
const num=v=>Number(v||0).toLocaleString('en-IN',{maximumFractionDigits:1});
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));

function allCols(){
 return [
   {k:'month',l:'Month',type:'text'},
   {k:'energy',l:'Energy (kWh)'},
   {k:'revenue',l:'Revenue (₹)'},
   {k:'tneb',l:'TNEB Bill (₹)'},
   {k:'zeon',l:'ZEON Comm. (₹)'},
   {k:'other',l:'Other Exp. (₹)'},
   {k:'profit',l:'Net Profit (₹)'},
   ...(state.customColumns||[]).map(c=>({k:c.key,l:c.label,custom:true}))
 ];
}

function renderMonthSelect(){
 const s=document.getElementById('monthSelect');
 const old=s.value;
 s.innerHTML=state.monthly.map((m,i)=>`<option value="${i}">${m.month}</option>`).join('');
 s.value=old && +old<state.monthly.length?old:Math.max(0,state.monthly.length-1);
 s.onchange=()=>{renderSummary();renderDonuts()};
}
function selected(){
 const i=+document.getElementById('monthSelect').value||Math.max(0,state.monthly.length-1);
 return state.monthly[i]||{};
}

function renderOneLineKpis(){
 const m=selected();
 const prevIndex=Math.max(0,(+document.getElementById('monthSelect').value||0)-1);
 const prev=state.monthly[prevIndex]||m;
 const change=(+prev.profit||0)?Math.round(((+m.profit||0)-(+prev.profit||0))/(+prev.profit||0)*100):0;
 const items=[
   {cls:'profit-main',icon:'▥',label:`Net Profit (${m.month})`,value:money(m.profit),sub:`${change>=0?'↑':'↓'} ${Math.abs(change)}% vs last month`},
   {cls:'energy-mini',icon:'⚡',label:'Energy Charged',value:num(m.energy)+' kWh'},
   {cls:'revenue-mini',icon:'₹',label:'Total Revenue',value:money(m.revenue)},
   {cls:'zeon-mini',icon:'%',label:'ZEON Commission',value:money(m.zeon)},
   {cls:'tneb-mini',icon:'▤',label:'TNEB Bill Payment',value:money(m.tneb)},
   {cls:'other-mini',icon:'▣',label:'Other Expenses',value:money(m.other)}
 ];
 document.getElementById('oneLineKpis').innerHTML=items.map(x=>`<div class="line-kpi ${x.cls}"><div class="line-icon">${x.icon}</div><div><span>${x.label}</span>${x.sub?`<small>${x.sub}</small>`:''}<b>${x.value}</b></div></div>`).join('');
 document.getElementById('heroMonth').textContent=m.month;
}

function renderSummary(){
 renderOneLineKpis();
}
function renderFinancialChart(){
 if(charts.financial)charts.financial.destroy();
 const months=state.monthly.slice(-(+document.getElementById('rangeSelect').value||6));
 charts.financial=new Chart(document.getElementById('financialChart'),{
  type:'bar',
  data:{labels:months.map(x=>x.month),datasets:[
   {label:'Total Revenue',data:months.map(x=>x.revenue)},
   {label:'TNEB Bill',data:months.map(x=>x.tneb)},
   {label:'ZEON Commission',data:months.map(x=>x.zeon)},
   {label:'Other Expenses',data:months.map(x=>x.other)},
   {type:'line',label:'Net Profit',data:months.map(x=>x.profit),tension:.3,borderWidth:3,pointRadius:4}
  ]},
  options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:9}}}},scales:{x:{grid:{display:false},ticks:{font:{size:9}}},y:{beginAtZero:true,ticks:{font:{size:9},callback:v=>'₹ '+Number(v).toLocaleString('en-IN')}}}}
 });
}
function renderDonuts(){
 const m=selected();
 document.getElementById('vehicleTitle').textContent=`Revenue by Vehicle Type (${m.month})`;
 document.getElementById('expenseTitle').textContent=`Expense Breakdown (${m.month})`;
 if(charts.vehicle)charts.vehicle.destroy();
 if(charts.expense)charts.expense.destroy();

 const cars=Math.round((+m.revenue||0)*(state.vehicleMix.cars/100));
 const buses=(+m.revenue||0)-cars;
 charts.vehicle=new Chart(document.getElementById('vehicleChart'),{
  type:'doughnut',
  data:{labels:['Cars','Buses'],datasets:[{data:[cars,buses]}]},
  options:{cutout:'64%',plugins:{legend:{display:false}}}
 });
 document.getElementById('vehicleLegend').innerHTML=
  `<div class="legend-row"><i class="legend-dot" style="background:#1688f8"></i><span>Cars</span><b>${money(cars)} (${state.vehicleMix.cars}%)</b></div>
   <div class="legend-row"><i class="legend-dot" style="background:#ff5369"></i><span>Buses</span><b>${money(buses)} (${state.vehicleMix.buses}%)</b></div>`;

 charts.expense=new Chart(document.getElementById('expenseChart'),{
  type:'doughnut',
  data:{labels:['TNEB Bill','ZEON Commission','Other Expenses'],datasets:[{data:[m.tneb,m.zeon,m.other]}]},
  options:{cutout:'64%',plugins:{legend:{display:false}}}
 });
 const total=(+m.tneb||0)+(+m.zeon||0)+(+m.other||0);
 const pct=v=>total?Math.round(v/total*100):0;
 document.getElementById('expenseLegend').innerHTML=
  `<div class="legend-row"><i class="legend-dot" style="background:#ff5369"></i><span>TNEB Bill</span><b>${money(m.tneb)} (${pct(+m.tneb||0)}%)</b></div>
   <div class="legend-row"><i class="legend-dot" style="background:#8c4cf4"></i><span>ZEON Commission</span><b>${money(m.zeon)} (${pct(+m.zeon||0)}%)</b></div>
   <div class="legend-row"><i class="legend-dot" style="background:#ffad18"></i><span>Other Expenses</span><b>${money(m.other)} (${pct(+m.other||0)}%)</b></div>`;
}
function displayCell(m,c,i){
 let v=m[c.k]??'';
 if(!editing){
   if(c.k==='month')return v;
   if(c.k==='energy')return num(v);
   return money(v);
 }
 return `<input class="cell-input ${c.type==='text'?'text':''}" data-i="${i}" data-k="${c.k}" type="${c.type==='text'?'text':'number'}" step="any" value="${v}">`;
}
function renderTable(){
 const cols=allCols();
 document.querySelector('#businessTable thead').innerHTML='<tr>'+cols.map(c=>`<th>${c.custom?`<span class="custom-head">${c.l}<button onclick="removeColumn('${c.k}')">×</button></span>`:c.l}</th>`).join('')+(editing?'<th>Action</th>':'')+'</tr>';
 document.querySelector('#businessTable tbody').innerHTML=state.monthly.map((m,i)=>'<tr>'+cols.map(c=>`<td class="editable ${c.k==='profit'?'profit':''}">${displayCell(m,c,i)}</td>`).join('')+(editing?`<td><button class="delete" onclick="deleteMonth(${i})">Delete</button></td>`:'')+'</tr>').join('');
 document.querySelectorAll('.cell-input').forEach(el=>el.onchange=e=>{const i=+e.target.dataset.i,k=e.target.dataset.k;state.monthly[i][k]=k==='month'?e.target.value:Number(e.target.value||0);save();renderAll(false)});
}
function renderAll(chartsToo=true){renderMonthSelect();renderSummary();renderTable();if(chartsToo){renderFinancialChart();renderDonuts()}}

window.toggleEdit=()=>{editing=!editing;document.body.classList.toggle('editing',editing);document.getElementById('editModeBtn').textContent=editing?'✓ Edit Mode ON':'✎ Edit Mode';renderAll(false)};
document.getElementById('editModeBtn').onclick=toggleEdit;
document.getElementById('rangeSelect').onchange=renderFinancialChart;
document.getElementById('prevMonth').onclick=()=>{const s=document.getElementById('monthSelect');if(+s.value>0){s.value=+s.value-1;renderSummary();renderDonuts();}};
document.getElementById('nextMonth').onclick=()=>{const s=document.getElementById('monthSelect');if(+s.value<state.monthly.length-1){s.value=+s.value+1;renderSummary();renderDonuts();}};

function openModal(title,fields,values,onSave){
 document.getElementById('modalTitle').textContent=title;
 const f=document.getElementById('modalForm');
 f.innerHTML=`<div class="form-grid">${fields.map(x=>`<div class="field"><label>${x.label}</label><input name="${x.name}" type="${x.type||'number'}" step="any" value="${values[x.name]??''}"></div>`).join('')}<div class="form-actions"><button type="button" onclick="closeModal()">Cancel</button><button class="save">Save</button></div></div>`;
 f.onsubmit=e=>{e.preventDefault();const fd=new FormData(f),o={};fields.forEach(x=>o[x.name]=x.type==='text'?fd.get(x.name):Number(fd.get(x.name)||0));onSave(o);save();closeModal();renderAll()};
 document.getElementById('modal').classList.add('open');
}
window.closeModal=()=>document.getElementById('modal').classList.remove('open');

const monthFields=[
 {name:'month',label:'Month',type:'text'},
 {name:'energy',label:'Energy (kWh)'},
 {name:'revenue',label:'Total Revenue'},
 {name:'tneb',label:'TNEB Bill'},
 {name:'zeon',label:'ZEON Commission'},
 {name:'other',label:'Other Expenses'},
 {name:'profit',label:'Net Profit'}
];
window.addMonth=()=>openModal('Add Month',monthFields,{},o=>{(state.customColumns||[]).forEach(c=>o[c.key]=0);state.monthly.push(o)});
window.deleteMonth=i=>{if(confirm('Delete this month?')){state.monthly.splice(i,1);save();renderAll()}};
window.addColumn=()=>openModal('Add Column',[{name:'label',label:'Column Name',type:'text'}],{},o=>{const key='custom_'+Date.now();state.customColumns.push({key,label:o.label||'New Column'});state.monthly.forEach(m=>m[key]=0)});
window.removeColumn=key=>{if(confirm('Remove this column?')){state.customColumns=state.customColumns.filter(c=>c.key!==key);state.monthly.forEach(m=>delete m[key]);save();renderAll(false)}};

function download(content,name,type){const b=new Blob([content],{type}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
document.getElementById('backupBtn').onclick=()=>download(JSON.stringify(state,null,2),'aadhiriya-dashboard-backup.json','application/json');
document.getElementById('importInput').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{state=JSON.parse(r.result);save();renderAll();alert('Backup imported successfully.')}catch{alert('Invalid backup file.')}};r.readAsText(f)};
document.getElementById('excelBtn').onclick=()=>{const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(state.monthly),'Monthly Business');XLSX.writeFile(wb,'aadhiriya-monthly-business.xlsx')};
document.getElementById('pdfBtn').onclick=()=>window.print();
document.getElementById('printBtn').onclick=()=>window.print();

renderAll();
