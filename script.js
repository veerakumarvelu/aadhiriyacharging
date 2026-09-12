
const KEY='aadhiriya_perfect_dashboard_v1';
let state=JSON.parse(localStorage.getItem(KEY)||'null')||structuredClone(window.INITIAL_DATA);
let editing=false,charts={},activeDocCategory='All';
const money=v=>'₹ '+Number(v||0).toLocaleString('en-IN',{maximumFractionDigits:0});
const num=v=>Number(v||0).toLocaleString('en-IN',{maximumFractionDigits:1});
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));

function selected(){const i=+document.getElementById('monthSelect').value||Math.max(0,state.monthly.length-1);return state.monthly[i]||{}}
function renderMonthSelect(){
 const s=document.getElementById('monthSelect'),old=s.value;
 s.innerHTML=state.monthly.map((m,i)=>`<option value="${i}">${m.month}</option>`).join('');
 s.value=old&&+old<state.monthly.length?old:Math.max(0,state.monthly.length-1);
 s.onchange=()=>{renderSummary();renderDonuts()};
}
function renderSummary(){
 const m=selected();
 document.getElementById('profitMonth').textContent=`Net Profit (${m.month})`;
 document.getElementById('profitValue').textContent=money(m.profit);
 document.getElementById('energyValue').textContent=num(m.energy)+' kWh';
 document.getElementById('revenueValue').textContent=money(m.revenue);
 document.getElementById('zeonValue').textContent=money(m.zeon);
 document.getElementById('tnebValue').textContent=money(m.tneb);
 document.getElementById('gstValue').textContent=money(m.gst);
}
function renderFinancial(){
 if(charts.financial)charts.financial.destroy();
 const months=state.monthly.slice(-(+document.getElementById('rangeSelect').value||6));
 charts.financial=new Chart(document.getElementById('financialChart'),{
  type:'bar',
  data:{labels:months.map(x=>x.month),datasets:[
   {label:'Total Revenue',data:months.map(x=>x.revenue)},
   {label:'TNEB Bill Payment',data:months.map(x=>x.tneb)},
   {label:'ZEON Commission',data:months.map(x=>x.zeon)},
   {label:'GST',data:months.map(x=>x.gst)},
   {type:'line',label:'Net Profit',data:months.map(x=>x.profit),tension:.3,borderWidth:3,pointRadius:4}
  ]},
  options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:9}}}},scales:{x:{grid:{display:false},ticks:{font:{size:9}}},y:{beginAtZero:true,ticks:{font:{size:9},callback:v=>Number(v).toLocaleString('en-IN')}}}}
 });
}
function renderDonuts(){
 const m=selected();
 document.getElementById('vehicleTitle').textContent=`Revenue by Vehicle Type (${m.month})`;
 document.getElementById('expenseTitle').textContent=`Expense Breakdown (${m.month})`;
 if(charts.vehicle)charts.vehicle.destroy();if(charts.expense)charts.expense.destroy();
 const cars=Math.round(m.revenue*state.vehicleMix.cars/100),buses=m.revenue-cars;
 charts.vehicle=new Chart(document.getElementById('vehicleChart'),{type:'doughnut',data:{labels:['Cars','Buses'],datasets:[{data:[cars,buses]}]},options:{cutout:'62%',plugins:{legend:{display:false}}}});
 document.getElementById('vehicleLegend').innerHTML=`<div class="legend-row"><i class="legend-dot" style="background:#1688f8"></i><span>Cars</span><b>${money(cars)} (${state.vehicleMix.cars}%)</b></div><div class="legend-row"><i class="legend-dot" style="background:#ff5468"></i><span>Buses</span><b>${money(buses)} (${state.vehicleMix.buses}%)</b></div>`;
 charts.expense=new Chart(document.getElementById('expenseChart'),{type:'doughnut',data:{labels:['TNEB Bill','ZEON Commission','GST'],datasets:[{data:[m.tneb,m.zeon,m.gst]}]},options:{cutout:'62%',plugins:{legend:{display:false}}}});
 const tot=(+m.tneb||0)+(+m.zeon||0)+(+m.gst||0),pct=v=>tot?Math.round(v/tot*100):0;
 document.getElementById('expenseLegend').innerHTML=`<div class="legend-row"><i class="legend-dot" style="background:#ff5468"></i><span>TNEB Bill</span><b>${money(m.tneb)} (${pct(m.tneb)}%)</b></div><div class="legend-row"><i class="legend-dot" style="background:#8d42ee"></i><span>ZEON Commission</span><b>${money(m.zeon)} (${pct(m.zeon)}%)</b></div><div class="legend-row"><i class="legend-dot" style="background:#ffb21a"></i><span>GST</span><b>${money(m.gst)} (${pct(m.gst)}%)</b></div>`;
}
function renderTable(){
 document.querySelector('#businessTable tbody').innerHTML=state.monthly.map((m,i)=>`<tr>
 <td class="editable">${editing?`<input class="cell-input text" data-i="${i}" data-k="month" value="${m.month}">`:m.month}</td>
 <td class="editable">${editing?`<input class="cell-input" data-i="${i}" data-k="energy" value="${m.energy}">`:num(m.energy)}</td>
 <td class="editable">${editing?`<input class="cell-input" data-i="${i}" data-k="revenue" value="${m.revenue}">`:money(m.revenue)}</td>
 <td class="editable">${editing?`<input class="cell-input" data-i="${i}" data-k="tneb" value="${m.tneb}">`:money(m.tneb)}</td>
 <td class="editable">${editing?`<input class="cell-input" data-i="${i}" data-k="zeon" value="${m.zeon}">`:money(m.zeon)}</td>
 <td class="editable">${editing?`<input class="cell-input" data-i="${i}" data-k="gst" value="${m.gst}">`:money(m.gst)}</td>
 <td class="editable profit">${editing?`<input class="cell-input" data-i="${i}" data-k="profit" value="${m.profit}">`:money(m.profit)}</td>
 <td class="edit-only">${editing?`<button class="delete" onclick="deleteMonth(${i})">Delete</button>`:''}</td></tr>`).join('');
 document.querySelectorAll('.cell-input').forEach(el=>el.onchange=e=>{const i=+e.target.dataset.i,k=e.target.dataset.k;state.monthly[i][k]=k==='month'?e.target.value:Number(e.target.value||0);save();renderAll(false)});
}
function renderAll(chartsToo=true){renderMonthSelect();renderSummary();renderTable();if(chartsToo){renderFinancial();renderDonuts()}}

window.toggleEdit=()=>{editing=!editing;document.body.classList.toggle('editing',editing);renderTable()};
document.getElementById('rangeSelect').onchange=renderFinancial;

function openModal(title,fields,values,onSave){
 document.getElementById('modalTitle').textContent=title;const f=document.getElementById('modalForm');
 f.innerHTML=`<div class="form-grid">${fields.map(x=>`<div class="field"><label>${x.label}</label><input name="${x.name}" type="${x.type||'number'}" step="any" value="${values[x.name]??''}"></div>`).join('')}<div class="form-actions"><button type="button" onclick="closeModal()">Cancel</button><button class="save">Save</button></div></div>`;
 f.onsubmit=e=>{e.preventDefault();const fd=new FormData(f),o={};fields.forEach(x=>o[x.name]=x.type==='text'?fd.get(x.name):Number(fd.get(x.name)||0));onSave(o);save();closeModal();renderAll()};
 document.getElementById('modal').classList.add('open');
}
window.closeModal=()=>document.getElementById('modal').classList.remove('open');
const fields=[{name:'month',label:'Month',type:'text'},{name:'energy',label:'Energy (kWh)'},{name:'revenue',label:'Revenue'},{name:'tneb',label:'TNEB Bill'},{name:'zeon',label:'ZEON Commission'},{name:'gst',label:'GST'},{name:'profit',label:'Net Profit'}];
window.addMonth=()=>openModal('Add Month',fields,{},o=>state.monthly.push(o));
window.deleteMonth=i=>{if(confirm('Delete this month?')){state.monthly.splice(i,1);save();renderAll()}};

/* Document vault */
const DB='AadhiRiyaDocs',STORE='docs';let dbPromise=null;
function openDB(){if(dbPromise)return dbPromise;dbPromise=new Promise((res,rej)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=e=>{const db=e.target.result;if(!db.objectStoreNames.contains(STORE)){const s=db.createObjectStore(STORE,{keyPath:'id',autoIncrement:true});s.createIndex('category','category',{unique:false})}};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});return dbPromise}
async function addDocs(files,category='Expenses'){const db=await openDB(),tx=db.transaction(STORE,'readwrite'),s=tx.objectStore(STORE);for(const f of files)s.add({name:f.name,category,size:f.size,type:f.type||'application/octet-stream',date:new Date().toISOString(),blob:f});await new Promise((res,rej)=>{tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});renderDocs()}
async function getDocs(){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(STORE,'readonly').objectStore(STORE).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})}
async function getDoc(id){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(STORE,'readonly').objectStore(STORE).get(id);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function downloadDoc(id){const d=await getDoc(id);if(!d)return;const u=URL.createObjectURL(d.blob),a=document.createElement('a');a.href=u;a.download=d.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
async function deleteDoc(id){if(!confirm('Delete this file?'))return;const db=await openDB();await new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});renderDocs()}
window.downloadDoc=downloadDoc;window.deleteDoc=deleteDoc;
function sizeLabel(n){return n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(1)+' MB'}
async function renderDocs(){
 const all=await getDocs(),q=(document.getElementById('docSearch').value||'').toLowerCase();
 const filtered=all.filter(d=>(activeDocCategory==='All'||d.category===activeDocCategory)&&d.name.toLowerCase().includes(q));
 document.querySelector('#docTable tbody').innerHTML=filtered.length?filtered.map((d,i)=>`<tr><td>${i+1}</td><td>📄 ${d.name}</td><td>${d.category}</td><td>${new Date(d.date).toLocaleDateString()}</td><td>${sizeLabel(d.size)}</td><td><div class="doc-action"><button class="download" onclick="downloadDoc(${d.id})">Download</button><button class="delete" onclick="deleteDoc(${d.id})">Delete</button></div></td></tr>`).join(''):`<tr><td colspan="6" class="doc-empty">No files saved yet.</td></tr>`;
}
document.getElementById('docUpload').onchange=e=>{if(e.target.files.length)addDocs(e.target.files,activeDocCategory==='All'?'Expenses':activeDocCategory);e.target.value=''};
document.getElementById('docSearch').oninput=renderDocs;
document.querySelectorAll('.doc-tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.doc-tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');activeDocCategory=b.dataset.cat;renderDocs()});

document.getElementById('excelBtn').onclick=()=>{const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(state.monthly),'Monthly Business');XLSX.writeFile(wb,'aadhiriya-monthly-business.xlsx')};
document.getElementById('pdfBtn').onclick=()=>window.print();document.getElementById('printBtn').onclick=()=>window.print();

renderAll();renderDocs();
