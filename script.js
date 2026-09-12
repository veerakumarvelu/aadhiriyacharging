
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
 document.getElementById('expenseTitle').textContent=`Expense Breakdown (${m.month})`;
 if(charts.expense)charts.expense.destroy();

 const vals=[+m.tneb||0,+m.zeon||0,+m.gst||0];
 const total=vals.reduce((a,b)=>a+b,0);
 const pct=v=>total?Math.round(v/total*100):0;

 const centerTextPlugin={
   id:'centerText',
   afterDraw(chart){
     const {ctx,chartArea:{left,right,top,bottom}}=chart;
     ctx.save();
     ctx.textAlign='center';
     ctx.fillStyle='#102334';
     ctx.font='700 18px Segoe UI';
     ctx.fillText(money(total),(left+right)/2,(top+bottom)/2-3);
     ctx.fillStyle='#6f7d89';
     ctx.font='10px Segoe UI';
     ctx.fillText('Total Outflow',(left+right)/2,(top+bottom)/2+15);
     ctx.restore();
   }
 };

 charts.expense=new Chart(document.getElementById('expenseChart'),{
   type:'doughnut',
   data:{
     labels:['TNEB Bill','ZEON Commission','GST'],
     datasets:[{
       data:vals,
       backgroundColor:['#ff5b68','#8d42ee','#ffb21a'],
       borderColor:'#ffffff',
       borderWidth:4,
       hoverOffset:10,
       borderRadius:5
     }]
   },
   plugins:[centerTextPlugin],
   options:{
     cutout:'68%',
     responsive:true,
     maintainAspectRatio:false,
     plugins:{
       legend:{display:false},
       tooltip:{
         callbacks:{
           label:(ctx)=>`${ctx.label}: ${money(ctx.raw)} (${pct(ctx.raw)}%)`
         }
       }
     }
   }
 });

 document.getElementById('expenseLegend').innerHTML=`
 <div class="modern-legend-row"><i style="background:#ff5b68"></i><div><span>TNEB Bill Payment</span><small>${pct(vals[0])}% of outflow</small></div><b>${money(vals[0])}</b></div>
 <div class="modern-legend-row"><i style="background:#8d42ee"></i><div><span>ZEON Commission</span><small>${pct(vals[1])}% of outflow</small></div><b>${money(vals[1])}</b></div>
 <div class="modern-legend-row"><i style="background:#ffb21a"></i><div><span>GST</span><small>${pct(vals[2])}% of outflow</small></div><b>${money(vals[2])}</b></div>`;
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
async function downloadDoc(id){
 try{
   const d=await getDoc(id);
   if(!d||!d.blob){alert('File could not be found in browser storage.');return}
   const blob=d.blob instanceof Blob?d.blob:new Blob([d.blob],{type:d.type||'application/octet-stream'});
   const url=URL.createObjectURL(blob);
   const a=document.createElement('a');
   a.href=url;
   a.download=d.name||'download';
   a.style.display='none';
   document.body.appendChild(a);
   a.click();
   setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},1500);
 }catch(err){
   console.error(err);
   alert('Download failed. Please try again in the same browser where the file was uploaded.');
 }
}
async function deleteDoc(id){
 if(!confirm('Delete this saved file?'))return;
 try{
   const db=await openDB();
   await new Promise((res,rej)=>{
     const tx=db.transaction(STORE,'readwrite');
     tx.objectStore(STORE).delete(id);
     tx.oncomplete=res;
     tx.onerror=()=>rej(tx.error);
   });
   await renderDocs();
 }catch(err){
   console.error(err);
   alert('Delete failed. Please refresh the page and try again.');
 }
});renderDocs()}
window.downloadDoc=downloadDoc;window.deleteDoc=deleteDoc;
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function sizeLabel(n){return n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(1)+' MB'}
async function renderDocs(){
 const all=await getDocs();
 const q=(document.getElementById('docSearch').value||'').toLowerCase();
 const filtered=all
   .filter(d=>(activeDocCategory==='All'||d.category===activeDocCategory)&&d.name.toLowerCase().includes(q))
   .sort((a,b)=>b.date.localeCompare(a.date));

 const box=document.getElementById('docList');
 if(!filtered.length){
   box.innerHTML='<div class="doc-empty-card">No files saved yet. Use Upload File to add an invoice or bill.</div>';
   return;
 }

 box.innerHTML=filtered.map((d,i)=>`<div class="doc-file-row">
   <div class="doc-file-name"><span class="file-icon">📄</span><div><b>${escapeHtml(d.name)}</b><small>File #${i+1}</small></div></div>
   <div class="doc-category">${escapeHtml(d.category)}</div>
   <div class="doc-date">${new Date(d.date).toLocaleDateString()}</div>
   <div class="doc-size">${sizeLabel(d.size)}</div>
   <div class="doc-action-buttons">
     <button type="button" class="download-btn" data-download="${d.id}">⬇ Download</button>
     <button type="button" class="delete-btn" data-delete="${d.id}">🗑 Delete</button>
   </div>
 </div>`).join('');

 box.querySelectorAll('[data-download]').forEach(btn=>{
   btn.addEventListener('click',()=>downloadDoc(Number(btn.dataset.download)));
 });
 box.querySelectorAll('[data-delete]').forEach(btn=>{
   btn.addEventListener('click',()=>deleteDoc(Number(btn.dataset.delete)));
 });
}
document.getElementById('docUpload').onchange=e=>{if(e.target.files.length)addDocs(e.target.files,activeDocCategory==='All'?'Expenses':activeDocCategory);e.target.value=''};
document.getElementById('docSearch').oninput=renderDocs;
document.querySelectorAll('.doc-tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.doc-tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');activeDocCategory=b.dataset.cat;renderDocs()});

document.getElementById('excelBtn').onclick=()=>{const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(state.monthly),'Monthly Business');XLSX.writeFile(wb,'aadhiriya-monthly-business.xlsx')};
document.getElementById('pdfBtn').onclick=()=>window.print();document.getElementById('printBtn').onclick=()=>window.print();

renderAll();renderDocs();
