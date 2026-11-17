// ===== Lumi's Data Lab app =====
(function(){
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const h = (tag, attrs = {}, html = '') => { const e = document.createElement(tag); for(const k in attrs){ if(k === 'class') e.className = attrs[k]; else if(k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]); } if(html) e.innerHTML = html; return e; };
const KEY = 'lumi-datalab-v1';
const today = () => new Date().toISOString().slice(0, 10);
const PASTEL = ['#9ad9c1','#f7b6cc','#a9cdf5','#f8d77a','#c7b5f5','#f6b99a','#8fd3d3','#e8a5d8'];
const fmtNum = (v, money) => v === null || v === undefined || (typeof v === 'number' && isNaN(v)) ? '(blank)' : typeof v === 'number' ? (money ? '$' : '') + v.toLocaleString('en-US', {maximumFractionDigits: 2}) : String(v);

// ---------- state ----------
const DEF = { name:'', xp:0, done:{}, pos:{}, passed:{}, games:{}, streak:{last:'', count:0}, day:{date:'', steps:0}, goal:8, set:{calm:false, big:false, mins:15, speak:false}, parking:[], checks:{} };
let S = JSON.parse(JSON.stringify(DEF));
try{ const t = localStorage.getItem(KEY); if(t) S = Object.assign(S, JSON.parse(t)); }catch(e){}
S.set = Object.assign({}, DEF.set, S.set);
const save = () => { try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} updateTop(); };
function bumpDay(){ const d = today(); if(S.day.date !== d) S.day = {date:d, steps:0};
  if(S.streak.last !== d){ const y = new Date(Date.now() - 864e5).toISOString().slice(0,10); S.streak.count = S.streak.last === y ? S.streak.count + 1 : 1; S.streak.last = d; } }
const allLessons = () => TRACKS.flatMap(t => t.lessons.map((l, i) => ({...l, track:t, idx:i})));
const findLesson = id => allLessons().find(l => l.id === id);
const lessonUnlocked = l => l.idx === 0 || !!S.done[l.track.lessons[l.idx-1].id];
const trackDone = t => t.lessons.filter(l => S.done[l.id]).length;
const gameUnlocked = g => { const t = TRACKS.find(x => x.id === g.track); return t.lessons.slice(0, g.after).every(l => S.done[l.id]); };

// ---------- data model ----------
const M = PBI.buildModel(DATA);
TOTALS.revenue = M.T.Sales.rows.reduce((s, r) => s + r.Revenue, 0);
TOTALS.orders = M.T.Sales.rows.length;
TOTALS.qty = M.T.Sales.rows.reduce((s, r) => s + r.Qty, 0);
TOTALS.west = PBI.visible(M, 'Sales', [{table:'Stores', col:'Region', pred:v => v === 'West'}]).reduce((s, r) => s + r.Revenue, 0);
const STD_MEASURES = ['Total Revenue = SUM(Sales[Revenue])','Total Orders = COUNTROWS(Sales)','Avg Order Value = DIVIDE([Total Revenue], [Total Orders])','Units Sold = SUM(Sales[Qty])'];
STD_MEASURES.forEach(t => { const m = PBI.defineMeasure(M, t); M.measures[m.name] = m; });
const FLAT = M.T.Sales.rows.map(r => { const p = M.rels[0].idx.get(r.ProductID), s = M.rels[1].idx.get(r.StoreID), c = M.rels[2].idx.get(r.Date);
  return { OrderID:r.OrderID, Date:r.Date, Month:c.Month, Quarter:c.Quarter, Store:s.Store, Region:s.Region, Product:p.Product, Category:p.Category, Qty:r.Qty, Revenue:r.Revenue }; });
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const sortKeys = (keys, field) => field === 'Month' ? keys.sort((a,b) => MONTHS.indexOf(a) - MONTHS.indexOf(b)) : keys.sort();

// ---------- art ----------
function lumi(cls = ''){
  return `<svg class="lumi ${cls}" viewBox="0 0 220 220" aria-hidden="true"><defs><radialGradient id="lh${cls}" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#ffe1ec"/><stop offset="1" stop-color="#ffb3cb"/></radialGradient></defs>
  <path d="M150 178 Q200 170 196 140 Q186 160 160 160 Z" fill="#ffa3c2"/><ellipse cx="110" cy="172" rx="48" ry="32" fill="#ffb8cf"/><ellipse cx="110" cy="178" rx="30" ry="20" fill="#ffe4ee"/>
  <g class="gill" fill="none" stroke="#ff7fae" stroke-width="9" stroke-linecap="round"><path d="M44 70 Q22 52 14 40"/><path d="M38 92 Q14 88 4 80"/><path d="M42 114 Q20 122 10 128"/><path d="M176 70 Q198 52 206 40"/><path d="M182 92 Q206 88 216 80"/><path d="M178 114 Q200 122 210 128"/></g>
  <g fill="#ffc6da"><circle cx="14" cy="40" r="7"/><circle cx="4" cy="80" r="7"/><circle cx="10" cy="128" r="7"/><circle cx="206" cy="40" r="7"/><circle cx="216" cy="80" r="7"/><circle cx="210" cy="128" r="7"/></g>
  <ellipse cx="110" cy="96" rx="74" ry="60" fill="url(#lh${cls})"/>
  <g class="eye"><ellipse cx="80" cy="94" rx="11" ry="13" fill="#3b3355"/><circle cx="84" cy="89" r="4.5" fill="#fff"/></g><g class="eye"><ellipse cx="140" cy="94" rx="11" ry="13" fill="#3b3355"/><circle cx="144" cy="89" r="4.5" fill="#fff"/></g>
  <ellipse cx="62" cy="116" rx="12" ry="7" fill="#ff8fb3" opacity=".45"/><ellipse cx="158" cy="116" rx="12" ry="7" fill="#ff8fb3" opacity=".45"/>
  <path d="M98 118 Q110 130 122 118" fill="none" stroke="#3b3355" stroke-width="4" stroke-linecap="round"/>
  <rect x="86" y="140" width="48" height="36" rx="6" fill="#fff" stroke="#3b3355" stroke-width="3"/><path d="M86 152H134M86 164H134M102 140V176M118 140V176" stroke="#9ad9c1" stroke-width="2.5"/>
  <ellipse cx="84" cy="160" rx="10" ry="8" fill="#ffb8cf"/><ellipse cx="136" cy="160" rx="10" ry="8" fill="#ffb8cf"/></svg>`;
}
const VIS = {
  grid:`<div class="demo-grid">${['','A','B','C'].map(c => `<b>${c}</b>`).join('')}${[1,2,3].map(r => `<b>${r}</b>` + ['A','B','C'].map(c => `<span class="${c+r === 'B3' ? 'hot' : ''}">${c+r === 'B3' ? 'B3' : ''}</span>`).join('')).join('')}</div>`,
  formula:`<div class="demo-fx"><span class="cell">12</span> <b>+</b> <span class="cell">30</span> <b>=</b> <span class="cell hot">42</span><div class="mono small">=A2+B2</div></div>`,
  fill:`<div class="demo-fill"><div class="mono">=B2*C2</div><div class="mono fade1">=B3*C3</div><div class="mono fade2">=B4*C4</div><div class="mono fade3">=B5*C5</div><span class="arrow">⬇</span></div>`,
  dollar:`<div class="demo-fx"><span class="mono">=B3*<span class="lock">$B$1</span></span> → <span class="mono">=B4*<span class="lock">$B$1</span></span><div class="small">B3 moves to B4, but 🔒 $B$1 stays put</div></div>`,
  if:`<div class="demo-if"><div class="q">Sales ≥ Target?</div><div class="yes">✔ "Hit"</div><div class="no">✘ "Miss"</div></div>`,
  lookup:`<div class="demo-fx"><span class="cell">Taro Milk Tea</span> → 📒 <span class="mono">price list</span> → <span class="cell hot">$6.00</span></div>`,
  cf:`<div class="demo-cf"><span>140</span><span class="g">620</span><span>385</span><span class="g">905</span><span>95</span></div>`,
  pivot:`<div class="demo-pivot"><div><b>Rows</b><span>Region</span></div><div><b>Columns</b><span>Quarter</span></div><div><b>Values</b><span>Σ Revenue</span></div><div><b>Filters</b><span>Category</span></div></div>`,
  charts:`<div class="demo-charts"><div>📈<b>Line</b>trend</div><div>📊<b>Column</b>compare</div><div>📶<b>Bar</b>many items</div><div>🥧<b>Pie</b>2 to 5 parts</div></div>`,
  pbilogo:`<div class="demo-pbi"><span style="height:30px"></span><span style="height:52px"></span><span style="height:74px"></span><b>Desktop → Service</b></div>`,
  pbiui:`<div class="demo-ui"><div class="side">📊<br>🗂️<br>🔗</div><div class="canvas">Report canvas</div><div class="panes"><span>Visualizations</span><span>Data</span><span>Filters</span></div></div>`,
  steps:`<div class="demo-steps"><b>Applied Steps</b><span>Source</span><span>Removed Blank Rows</span><span>Trimmed Text</span><span>Changed Type</span></div>`,
  star:`<div class="demo-star"><span class="d">Products</span><span class="d">Stores</span><span class="f">Sales ⭐</span><span class="d">Calendar</span></div>`,
  flow:`<div class="demo-fx"><span class="cell">Products (1)</span> ➜ filter flows ➜ <span class="cell hot">Sales (*)</span></div>`,
  context:`<div class="demo-ctx"><div><b>Region</b><b>Total Revenue</b></div><div><span>East</span><span>filter: East</span></div><div><span>West</span><span>filter: West</span></div><div><span>Total</span><span>no filter</span></div></div>`,
  layout:`<div class="demo-layout"><span class="k">KPI</span><span class="k">KPI</span><span class="k">KPI</span><span class="c">Trend</span><span class="c">Breakdown</span></div>`
};

// ---------- small UI helpers ----------
function toast(t){ const d = h('div', {class:'toast'}, t); document.body.appendChild(d); setTimeout(() => d.remove(), 2400); }
function confetti(n = 60){ if(S.set.calm) return; for(let i=0;i<n;i++){ const d = h('div', {class:'confetti'}); d.style.left = Math.random()*100 + 'vw'; d.style.background = PASTEL[i % PASTEL.length]; d.style.animationDuration = (1.8 + Math.random()*2) + 's'; d.style.animationDelay = Math.random()*.4 + 's'; document.body.appendChild(d); setTimeout(() => d.remove(), 4500); } }
function xpFloat(n, el){ const r = (el || $('#primary') || document.body).getBoundingClientRect(); const d = h('div', {class:'xpfloat'}, `+${n} XP`); d.style.left = (r.left + r.width/2) + 'px'; d.style.top = (r.top + window.scrollY) + 'px'; document.body.appendChild(d); setTimeout(() => d.remove(), 1300); }
function modal(html, mount){ const bg = h('div', {class:'modal-bg'}, `<div class="modal" role="dialog">${html}</div>`); bg.addEventListener('click', e => { if(e.target === bg || e.target.closest('[data-close]')) bg.remove(); }); document.body.appendChild(bg); if(mount) mount(bg); return bg; }
function speak(text){ try{ speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, ' ')); u.rate = 0.95; speechSynthesis.speak(u); }catch(e){ toast('Read-aloud is not available in this browser.'); } }
function updateTop(){ const x = $('#xp'); if(x) x.textContent = S.xp; const st = $('#streak'); if(st) st.textContent = S.streak.count || 0;
  document.body.classList.toggle('calm', !!S.set.calm); document.body.classList.toggle('big', !!S.set.big); }

// ---------- charts ----------
function chartSVG(type, data, opts = {}){
  const W = opts.compact ? 380 : 520, H = opts.compact ? 230 : 260, pad = {l:50, r:12, t:14, b:40}; const money = opts.money !== false; const pct = opts.pct;
  const val = v => v == null || isNaN(v) ? 0 : v; const lab = v => pct ? (v*100).toFixed(1) + '%' : (money ? '$' : '') + (Math.abs(v) >= 10000 ? (v/1000).toFixed(0) + 'k' : Math.abs(v) >= 1000 ? (v/1000).toFixed(1) + 'k' : Math.round(v).toLocaleString());
  if(!data.length) return '<div class="empty">No data for this filter.</div>';
  if(type === 'pie'){ const tot = data.reduce((s, d) => s + val(d.value), 0) || 1; let a0 = -Math.PI/2; const cx = 130, cy = 130, R = 105, r = 58;
    const arcs = data.map((d, i) => { const a1 = a0 + val(d.value)/tot * Math.PI*2; const big = a1 - a0 > Math.PI ? 1 : 0; const p = (a, rr) => `${cx + rr*Math.cos(a)} ${cy + rr*Math.sin(a)}`;
      const path = `M${p(a0,R)} A${R} ${R} 0 ${big} 1 ${p(a1,R)} L${p(a1,r)} A${r} ${r} 0 ${big} 0 ${p(a0,r)} Z`; a0 = a1; return `<path d="${path}" fill="${PASTEL[i % PASTEL.length]}" stroke="#fff" stroke-width="2"><title>${esc(d.key)}: ${lab(val(d.value))}</title></path>`; }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" class="chart">${arcs}${data.map((d, i) => `<rect x="280" y="${20 + i*22}" width="14" height="14" rx="4" fill="${PASTEL[i % PASTEL.length]}"/><text x="300" y="${32 + i*22}" class="tl">${esc(d.key)} · ${(val(d.value)/tot*100).toFixed(0)}%</text>`).join('')}</svg>`; }
  if(type === 'table') return `<table class="vt"><tr><th>${esc(opts.axisName || '')}</th><th>${esc(opts.valName || 'Value')}</th></tr>${data.map(d => `<tr><td>${esc(d.key)}</td><td>${lab(val(d.value))}</td></tr>`).join('')}</table>`;
  const max = Math.max(...data.map(d => val(d.value)), 0) * 1.1 || 1; const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const ticks = [0, .25, .5, .75, 1].map(f => f * max);
  let g = ticks.map(t => { const y = pad.t + ih - t/max*ih; return `<line x1="${pad.l}" x2="${W-pad.r}" y1="${y}" y2="${y}" class="gl"/><text x="${pad.l-6}" y="${y+4}" text-anchor="end" class="tl">${lab(t)}</text>`; }).join('');
  if(type === 'bar'){ const bh = ih / data.length; const maxb = max; g = '';
    data.forEach((d, i) => { const w = val(d.value)/maxb * (iw - 60); g += `<text x="${pad.l + 70}" y="${pad.t + i*bh + bh/2 + 4}" text-anchor="end" class="tl">${esc(String(d.key).slice(0, 12))}</text><rect x="${pad.l + 76}" y="${pad.t + i*bh + bh*0.15}" width="${Math.max(w - 76, 1)}" height="${bh*0.7}" rx="5" fill="${PASTEL[0]}"><title>${esc(d.key)}: ${lab(val(d.value))}</title></rect><text x="${pad.l + 80 + Math.max(w - 76, 1)}" y="${pad.t + i*bh + bh/2 + 4}" class="tl">${lab(val(d.value))}</text>`; });
    return `<svg viewBox="0 0 ${W} ${H}" class="chart">${g}</svg>`; }
  const step = iw / data.length; const x = i => pad.l + step*i + step/2, y = v => pad.t + ih - val(v)/max*ih;
  const labels = data.map((d, i) => `<text x="${x(i)}" y="${H-pad.b+18}" text-anchor="middle" class="tl">${esc(String(d.key).slice(0, 10))}</text>`).join('');
  if(type === 'line'){ const pts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ');
    return `<svg viewBox="0 0 ${W} ${H}" class="chart">${g}<polyline points="${pts}" fill="none" stroke="#7d6bd8" stroke-width="3" stroke-linejoin="round" class="draw"/>${data.map((d, i) => `<circle cx="${x(i)}" cy="${y(d.value)}" r="4.5" fill="#fff" stroke="#7d6bd8" stroke-width="2.5"><title>${esc(d.key)}: ${lab(val(d.value))}</title></circle>`).join('')}${labels}</svg>`; }
  return `<svg viewBox="0 0 ${W} ${H}" class="chart">${g}${data.map((d, i) => `<rect class="grow" x="${x(i) - step*0.32}" y="${y(d.value)}" width="${step*0.64}" height="${pad.t + ih - y(d.value)}" rx="6" fill="${PASTEL[i % PASTEL.length]}"><title>${esc(d.key)}: ${lab(val(d.value))}</title></rect>`).join('')}${labels}</svg>`;
}

// ===================================================================== STEP RENDERERS
// Each renderer: (step, body, api) where api.pass() marks success, api.fail(msg) shows feedback.
const R = {};
R.learn = (st, body) => {
  body.innerHTML = `<h2>${st.title}</h2>${st.visual && VIS[st.visual] ? `<div class="visual">${VIS[st.visual]}</div>` : ''}<p class="lead">${st.text}</p>${st.tip ? `<div class="tip">💡 ${st.tip}</div>` : ''}`;
  return { ready:true, speakText: st.title + '. ' + st.text + (st.tip ? '. Tip: ' + st.tip : '') };
};
R.quiz = (st, body, api) => {
  body.innerHTML = `<h2>Quick check</h2><p class="lead">${esc(st.q)}</p><div class="opts">${st.opts.map((o, i) => `<button class="opt" data-i="${i}"><span class="k">${'ABCD'[i]}</span>${esc(o)}</button>`).join('')}</div><div class="why"></div>`;
  $$('.opt', body).forEach(b => b.onclick = () => { if(body.dataset.ok) return; const i = +b.dataset.i;
    if(i === st.a){ b.classList.add('right'); body.dataset.ok = 1; $('.why', body).innerHTML = '✅ ' + esc(st.why); api.pass(); }
    else { b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong'); $('.why', body).textContent = 'Not quite. Have another go! 💪'; } });
  return { keys: k => { const i = 'abcd'.indexOf(k.toLowerCase()); if(i >= 0 && st.opts[i]) $$('.opt', body)[i].click(); }, speakText: st.q + '. ' + st.opts.map((o, i) => 'ABCD'[i] + ': ' + o).join('. ') };
};
R.real = (st, body, api, ctx) => {
  const key = ctx.lesson.id + ':real'; const ticks = S.checks[key] || [];
  const files = st.file === 'excel' ? [['📗 Excel practice workbook', 'practice/Lumi_Excel_Practice.xlsx']] : [['📊 Lumi Boba dataset (Excel)', 'practice/LumiBoba_PowerBI_Data.xlsx'], ['🧹 Messy_Customers.csv', 'practice/Messy_Customers.csv']];
  body.innerHTML = `<h2>🛠️ ${esc(st.title)}</h2><p class="lead">Optional, but this is where it really sticks. Tick things off as you go.</p><ul class="realist">${st.items.map((it, i) => `<li><label><input type="checkbox" data-i="${i}" ${ticks[i] ? 'checked' : ''}> <span>${it}</span></label></li>`).join('')}</ul><div class="files">${files.map(([n, u]) => `<a class="btn ghost small" href="${u}" target="_blank" rel="noopener">${n}</a>`).join('')}</div><p class="small muted">Files open from the published GitHub site. If a download doesn't start here, use the copies in your GitHub repo's <code>practice</code> folder.</p>`;
  $$('input', body).forEach(c => c.onchange = () => { const a = S.checks[key] || []; a[+c.dataset.i] = c.checked; S.checks[key] = a; save(); if(c.checked) xpFloat(2, c); });
  api.pass(true); return {};
};
R.order = (st, body, api) => {
  const items = st.items; let next = 0;
  const shuffled = items.map((t, i) => ({t, i})).sort(() => Math.random() - .5);
  body.innerHTML = `<h2>${esc(st.title)}</h2><p class="lead">${st.task}</p><ol class="built"></ol><div class="tokens">${shuffled.map(x => `<button class="token" data-i="${x.i}">${esc(x.t)}</button>`).join('')}</div><button class="btn ghost small" id="ordReset">↺ Start over</button>`;
  const reset = () => { next = 0; $('.built', body).innerHTML = ''; $$('.token', body).forEach(b => b.classList.remove('used')); };
  $('#ordReset', body).onclick = reset;
  $$('.token', body).forEach(b => b.onclick = () => { if(+b.dataset.i === next){ b.classList.add('used'); $('.built', body).insertAdjacentHTML('beforeend', `<li>${esc(items[next])}</li>`); next++; if(next === items.length) api.pass(); }
    else { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); api.fail(`Not yet. What comes after "${next ? items[next-1] : 'the start'}"?`, true); } });
  return { solve: () => { reset(); items.forEach((_, i) => $(`.token[data-i="${i}"]`, body).click()); } };
};

// ---------- Excel sheet ----------
R.sheet = (st, body, api) => {
  const sheet = new XL.Sheet(st.cells, {cols:st.cols, rows:st.rows}); const undo = [];
  let sel = {a: st.select || 'A1', b: st.select || 'A1'}; let editing = false;
  body.innerHTML = `<h2>${esc(st.title)}</h2><p class="lead task">${st.task}</p>
   <div class="xl"><div class="xl-bar"><span class="namebox"></span><span class="fx">fx</span><input class="fxin" spellcheck="false" autocomplete="off" aria-label="Formula bar"></div>
   <div class="xl-tools"><button class="tb" data-a="fill" title="Fill down (Ctrl+D)">Fill ⬇</button><button class="tb" data-a="undo" title="Undo (Ctrl+Z)">↶ Undo</button><button class="tb" data-a="reset">↺ Reset</button><span class="small muted">Click a cell · type · Enter. Double-click to edit. Shift+click selects a range.</span></div>
   <div class="xl-wrap" tabindex="0"><table class="xl-grid"></table></div></div>`;
  const grid = $('.xl-grid', body), wrap = $('.xl-wrap', body), fx = $('.fxin', body), nb = $('.namebox', body);
  const rc = a => XL.parseRef(a); const inSel = (c, r) => { const A = rc(sel.a), B = rc(sel.b); return c >= Math.min(A.c,B.c) && c <= Math.max(A.c,B.c) && r >= Math.min(A.r,B.r) && r <= Math.max(A.r,B.r); };
  function draw(){
    let html = '<tr><th class="corner"></th>' + Array.from({length:st.cols}, (_, i) => `<th>${XL.numToCol(i+1)}</th>`).join('') + '</tr>';
    for(let r=1; r<=st.rows; r++){ html += `<tr><th>${r}</th>`; for(let c=1; c<=st.cols; c++){ const a = XL.addr(c, r), v = sheet.value(a), raw = sheet.raw[a];
      const cls = [inSel(c, r) ? 'sel' : '', a === sel.a ? 'act' : '', typeof v === 'number' ? 'num' : '', XL.isErr(v) ? 'err' : '', typeof raw === 'string' && raw.startsWith('=') ? 'f' : '', r === 1 ? 'hdr' : ''].join(' ');
      html += `<td class="${cls}" data-a="${a}" title="${esc(raw ?? '')}">${esc(XL.fmt(v))}</td>`; } html += '</tr>'; }
    grid.innerHTML = html; nb.textContent = sel.a === sel.b ? sel.a : sel.a + ':' + sel.b; if(!editing) fx.value = sheet.raw[sel.a] ?? '';
  }
  const snap = () => { undo.push(JSON.stringify(sheet.raw)); if(undo.length > 50) undo.shift(); };
  function commit(v){ snap(); sheet.set(sel.a, v.trim() === '' ? '' : v.trim()); editing = false; }
  function move(dc, dr, extend){ const A = rc(extend ? sel.b : sel.a); const c = Math.min(Math.max(A.c + dc, 1), st.cols), r = Math.min(Math.max(A.r + dr, 1), st.rows); const n = XL.addr(c, r); if(extend) sel.b = n; else sel = {a:n, b:n}; draw(); }
  function fill(){ const A = rc(sel.a), B = rc(sel.b); const r0 = Math.min(A.r, B.r), r1 = Math.max(A.r, B.r), c0 = Math.min(A.c, B.c), c1 = Math.max(A.c, B.c);
    if(r0 === r1){ api.fail('Select a range first: click the top cell, then Shift+click the bottom cell.', true); return; }
    snap(); for(let c=c0; c<=c1; c++){ const top = sheet.raw[XL.addr(c, r0)] ?? ''; for(let r=r0+1; r<=r1; r++){ sheet.raw[XL.addr(c, r)] = typeof top === 'string' && top.startsWith('=') ? XL.shift(top, r - r0, 0) : top; if(top === '') delete sheet.raw[XL.addr(c, r)]; } }
    sheet.recalc(); draw(); toast('Filled down ⬇'); }
  grid.addEventListener('mousedown', e => { const td = e.target.closest('td'); if(!td) return; e.preventDefault();
    if(editing && fx.value.startsWith('=')){ // click-to-insert reference while typing a formula
      const p = fx.selectionStart ?? fx.value.length; fx.value = fx.value.slice(0, p) + td.dataset.a + fx.value.slice(p); fx.focus(); fx.setSelectionRange(p + td.dataset.a.length, p + td.dataset.a.length); return; }
    if(e.shiftKey) sel.b = td.dataset.a; else sel = {a:td.dataset.a, b:td.dataset.a}; editing = false; draw(); wrap.focus(); });
  grid.addEventListener('dblclick', e => { const td = e.target.closest('td'); if(!td) return; editing = true; fx.focus(); });
  wrap.addEventListener('keydown', e => {
    if(e.key === 'ArrowDown'){ move(0, 1, e.shiftKey); e.preventDefault(); } else if(e.key === 'ArrowUp'){ move(0, -1, e.shiftKey); e.preventDefault(); }
    else if(e.key === 'ArrowLeft'){ move(-1, 0, e.shiftKey); e.preventDefault(); } else if(e.key === 'ArrowRight' || e.key === 'Tab'){ move(1, 0, e.shiftKey && e.key !== 'Tab'); e.preventDefault(); }
    else if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd'){ e.preventDefault(); fill(); }
    else if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'){ e.preventDefault(); if(undo.length){ sheet.raw = JSON.parse(undo.pop()); sheet.recalc(); draw(); } }
    else if(e.key === 'Delete' || e.key === 'Backspace'){ e.preventDefault(); snap(); const A = rc(sel.a), B = rc(sel.b); for(let c=Math.min(A.c,B.c); c<=Math.max(A.c,B.c); c++) for(let r=Math.min(A.r,B.r); r<=Math.max(A.r,B.r); r++) delete sheet.raw[XL.addr(c, r)]; sheet.recalc(); draw(); }
    else if(e.key === 'Enter' || e.key === 'F2'){ e.preventDefault(); e.stopPropagation(); editing = true; fx.focus(); }
    else if(e.key.length === 1 && !e.ctrlKey && !e.metaKey){ e.preventDefault(); editing = true; fx.value = e.key; fx.focus(); }
  });
  fx.addEventListener('focus', () => { editing = true; });
  fx.addEventListener('keydown', e => { e.stopPropagation();
    if(e.key === 'Enter'){ e.preventDefault(); commit(fx.value); move(0, 1); wrap.focus(); }
    else if(e.key === 'Tab'){ e.preventDefault(); commit(fx.value); move(1, 0); wrap.focus(); }
    else if(e.key === 'Escape'){ editing = false; draw(); wrap.focus(); } });
  $$('.tb', body).forEach(b => b.onclick = () => { const a = b.dataset.a; if(a === 'fill') fill(); if(a === 'undo' && undo.length){ sheet.raw = JSON.parse(undo.pop()); sheet.recalc(); draw(); } if(a === 'reset'){ snap(); sheet.raw = {}; for(const k in st.cells) sheet.raw[k] = st.cells[k]; sheet.recalc(); draw(); } wrap.focus(); });
  draw(); setTimeout(() => wrap.focus({preventScroll:true}), 50);
  return { check: () => { if(editing && fx.value !== (sheet.raw[sel.a] ?? '')) { commit(fx.value); draw(); } return st.check(sheet); }, solve: () => { snap(); for(const k in st.solution) sheet.raw[k] = st.solution[k]; sheet.recalc(); editing = false; draw(); }, hint: st.hint };
};

// ---------- Excel table: sort / filter / conditional formatting ----------
const ORDERS = [[1001,'Downtown','West','Classic Milk Tea',620],[1002,'Harbor','East','Mochi Donut',140],[1003,'Sunset','West','Mango Fruit Tea',385],[1004,'Lakeside','Midwest','Taro Milk Tea',510],[1005,'Uptown','East','Brown Sugar Boba',760],[1006,'Riverside','South','Matcha Latte',230],[1007,'Downtown','West','Taro Milk Tea',905],[1008,'Harbor','East','Classic Milk Tea',95],[1009,'Sunset','West','Popcorn Chicken',455],[1010,'Lakeside','Midwest','Mango Fruit Tea',300]];
const OCOLS = ['Order','Store','Region','Product','Revenue'];
R.table = (st, body, api) => {
  let T = {sort:null, filter:{}, cf:null};
  body.innerHTML = `<h2>${esc(st.title)}</h2><p class="lead task">${st.task}</p><div class="tt-tools"><button class="tb" id="cfBtn">🎨 Conditional formatting</button><button class="tb" id="clr">✕ Clear all</button></div><div class="cfpanel" hidden></div><div class="tt-wrap"></div>`;
  const wrap = $('.tt-wrap', body);
  function draw(){
    let rows = ORDERS.map(r => Object.fromEntries(OCOLS.map((c, i) => [c, r[i]])));
    for(const c in T.filter) rows = rows.filter(r => T.filter[c].includes(String(r[c])));
    if(T.sort){ const {col, dir} = T.sort; rows.sort((a, b) => (a[col] < b[col] ? -1 : a[col] > b[col] ? 1 : 0) * (dir === 'asc' ? 1 : -1)); }
    const hit = (r) => { if(!T.cf) return false; const v = r[T.cf.col], x = +T.cf.val; return T.cf.op === '>' ? v > x : T.cf.op === '<' ? v < x : String(v) === String(T.cf.val); };
    wrap.innerHTML = `<table class="tt"><tr>${OCOLS.map(c => `<th><button class="hdrbtn" data-c="${c}">${c} ${T.filter[c] ? '⏷' : '▾'}${T.sort && T.sort.col === c ? (T.sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}</button></th>`).join('')}</tr>${rows.map(r => `<tr>${OCOLS.map(c => `<td class="${typeof r[c] === 'number' ? 'num' : ''}" style="${T.cf && T.cf.col === c && hit(r) ? `background:${T.cf.color};font-weight:800` : ''}">${c === 'Revenue' ? '$' + r[c] : esc(r[c])}</td>`).join('')}</tr>`).join('')}</table><div class="small muted">${rows.length} of ${ORDERS.length} rows shown</div>`;
    $$('.hdrbtn', wrap).forEach(b => b.onclick = e => menu(b.dataset.c, b));
  }
  function menu(c, btn){
    $$('.colmenu').forEach(m => m.remove());
    const vals = [...new Set(ORDERS.map(r => String(r[OCOLS.indexOf(c)])))].sort(); const cur = T.filter[c] || vals; const isNum = c === 'Revenue' || c === 'Order';
    const m = h('div', {class:'colmenu'}, `<button data-s="asc">${isNum ? 'Smallest → Largest' : 'A → Z'}</button><button data-s="desc">${isNum ? 'Largest → Smallest' : 'Z → A'}</button><hr><div class="fl">${vals.map(v => `<label><input type="checkbox" value="${esc(v)}" ${cur.includes(v) ? 'checked' : ''}> ${esc(v)}</label>`).join('')}</div><div class="row"><button class="btn small" data-ok>Apply filter</button><button class="btn ghost small" data-x>Close</button></div>`);
    btn.closest('th').appendChild(m);
    $$('[data-s]', m).forEach(b => b.onclick = () => { T.sort = {col:c, dir:b.dataset.s}; m.remove(); draw(); });
    $('[data-ok]', m).onclick = () => { const on = $$('input:checked', m).map(i => i.value); if(on.length === vals.length) delete T.filter[c]; else T.filter[c] = on; m.remove(); draw(); };
    $('[data-x]', m).onclick = () => m.remove();
  }
  $('#cfBtn', body).onclick = () => { const p = $('.cfpanel', body); p.hidden = !p.hidden;
    p.innerHTML = `<b>Highlight cells where</b> <select id="cfc">${OCOLS.map(c => `<option ${c === 'Revenue' ? 'selected' : ''}>${c}</option>`).join('')}</select> <select id="cfo"><option value=">">is greater than</option><option value="<">is less than</option><option value="=">equals</option></select> <input id="cfv" class="smallin" placeholder="value"> ${PASTEL.slice(0,4).map((c, i) => `<button class="sw ${i ? '' : 'on'}" data-c="${c}" style="background:${c}"></button>`).join('')} <button class="btn small" id="cfgo">Apply</button>`;
    let color = PASTEL[0]; $$('.sw', p).forEach(s => s.onclick = () => { $$('.sw', p).forEach(x => x.classList.remove('on')); s.classList.add('on'); color = s.dataset.c; });
    $('#cfgo', p).onclick = () => { T.cf = {col:$('#cfc', p).value, op:$('#cfo', p).value, val:$('#cfv', p).value, color}; p.hidden = true; draw(); }; };
  $('#clr', body).onclick = () => { T = {sort:null, filter:{}, cf:null}; draw(); };
  draw();
  return { check: () => st.check(T), solve: () => { T = Object.assign({sort:null, filter:{}, cf:null}, JSON.parse(JSON.stringify(st.solution))); draw(); }, hint: 'Look for the ▾ buttons in the header row.' };
};

// ---------- Excel PivotTable ----------
const PFIELDS = ['Region','Store','Category','Product','Month','Quarter','Revenue','Qty','OrderID'];
R.pivot = (st, body, api) => {
  let C = {rows:[], cols:[], val:null, agg:'Sum'};
  body.innerHTML = `<h2>${esc(st.title)}</h2><p class="lead task">${st.task}</p><div class="pv"><div class="pv-fields"><b>PivotTable Fields</b>${PFIELDS.map(f => `<div class="pf"><span>${f}</span><span class="pfb"><button data-f="${f}" data-z="rows" title="Add to Rows">R</button><button data-f="${f}" data-z="cols" title="Add to Columns">C</button><button data-f="${f}" data-z="val" title="Add to Values">Σ</button></span></div>`).join('')}<div class="small muted">R = Rows · C = Columns · Σ = Values</div></div><div class="pv-zones"></div><div class="pv-out"></div></div>`;
  function draw(){
    const z = $('.pv-zones', body);
    const chip = (f, zone) => `<span class="chip">${f}<button data-rm="${zone}" data-f="${f}">✕</button></span>`;
    z.innerHTML = `<div class="zone"><b>Rows</b>${C.rows.map(f => chip(f, 'rows')).join('') || '<i>empty</i>'}</div><div class="zone"><b>Columns</b>${C.cols.map(f => chip(f, 'cols')).join('') || '<i>empty</i>'}</div><div class="zone"><b>Values</b>${C.val ? `<select id="agg">${['Sum','Count','Average'].map(a => `<option ${a === C.agg ? 'selected' : ''}>${a}</option>`).join('')}</select> of ${chip(C.val, 'val')}` : '<i>empty</i>'}</div>`;
    $$('[data-rm]', z).forEach(b => b.onclick = () => { const zz = b.dataset.rm; if(zz === 'val') C.val = null; else C[zz] = C[zz].filter(x => x !== b.dataset.f); draw(); });
    const ag = $('#agg', z); if(ag) ag.onchange = () => { C.agg = ag.value; draw(); };
    $('.pv-out', body).innerHTML = renderPivot();
  }
  function renderPivot(){
    if(!C.val || !C.rows.length) return '<div class="empty">Add a field to <b>Rows</b> and one to <b>Values</b> to see your pivot.</div>';
    const rf = C.rows[0], cf = C.cols[0]; const rk = sortKeys([...new Set(FLAT.map(r => r[rf]))], rf), ck = cf ? sortKeys([...new Set(FLAT.map(r => r[cf]))], cf) : [null];
    const agg = rows => { const v = rows.map(r => r[C.val]); if(C.agg === 'Count') return v.length; const n = v.filter(x => typeof x === 'number'); const s = n.reduce((a, b) => a + b, 0); return C.agg === 'Sum' ? s : n.length ? s / n.length : 0; };
    const f = v => C.agg === 'Count' ? v.toLocaleString() : C.val === 'Revenue' ? '$' + v.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2}) : (+v.toFixed(2)).toLocaleString();
    let html = `<table class="pt"><tr><th>${rf}</th>${ck.map(k => `<th>${k ?? `${C.agg} of ${C.val}`}</th>`).join('')}${cf ? '<th>Grand Total</th>' : ''}</tr>`;
    rk.forEach(k => { const rr = FLAT.filter(r => r[rf] === k); html += `<tr><td>${esc(k)}</td>${ck.map(c => `<td class="num">${f(agg(c === null ? rr : rr.filter(r => r[cf] === c)))}</td>`).join('')}${cf ? `<td class="num tot">${f(agg(rr))}</td>` : ''}</tr>`; });
    html += `<tr class="gt"><td>Grand Total</td>${ck.map(c => `<td class="num">${f(agg(c === null ? FLAT : FLAT.filter(r => r[cf] === c)))}</td>`).join('')}${cf ? `<td class="num">${f(agg(FLAT))}</td>` : ''}</tr></table>`;
    return html;
  }
  $$('.pfb button', body).forEach(b => b.onclick = () => { const f = b.dataset.f, z = b.dataset.z; C.rows = C.rows.filter(x => x !== f); C.cols = C.cols.filter(x => x !== f); if(C.val === f) C.val = null;
    if(z === 'val'){ C.val = f; C.agg = ['Revenue','Qty'].includes(f) ? 'Sum' : 'Count'; } else C[z] = [f]; draw(); });
  draw();
  return { check: () => st.check(C), solve: () => { C = JSON.parse(JSON.stringify(st.solution)); draw(); }, hint: 'Use the R / C / Σ buttons next to each field.' };
};
// ---------- Excel chart ----------
R.chart = (st, body, api) => {
  let C = {type:'column', axis:'Region'};
  body.innerHTML = `<h2>${esc(st.title)}</h2><p class="lead task">${st.task}</p><div class="chartbox"><div class="ch-tools"><div><b>Chart type</b><div class="seg" id="ct">${[['column','📊 Column'],['bar','📶 Bar'],['line','📈 Line'],['pie','🥧 Pie']].map(([v, l]) => `<button data-v="${v}">${l}</button>`).join('')}</div></div><div><b>Axis (categories)</b><div class="seg" id="ca">${['Region','Category','Month','Store'].map(v => `<button data-v="${v}">${v}</button>`).join('')}</div></div><div class="small muted">Values: Sum of Revenue</div></div><div class="ch-out"></div></div>`;
  function draw(){ $$('#ct button', body).forEach(b => b.classList.toggle('on', b.dataset.v === C.type)); $$('#ca button', body).forEach(b => b.classList.toggle('on', b.dataset.v === C.axis));
    const keys = sortKeys([...new Set(FLAT.map(r => r[C.axis]))], C.axis); const data = keys.map(k => ({key:k, value:FLAT.filter(r => r[C.axis] === k).reduce((s, r) => s + r.Revenue, 0)}));
    $('.ch-out', body).innerHTML = chartSVG(C.type, data); }
  $$('#ct button', body).forEach(b => b.onclick = () => { C.type = b.dataset.v; draw(); }); $$('#ca button', body).forEach(b => b.onclick = () => { C.axis = b.dataset.v; draw(); });
  draw(); return { check: () => st.check(C), solve: () => { C = {...st.solution}; draw(); }, hint: 'Time on the axis → a line chart shows the trend best.' };
};

// ---------- Power Query ----------
const PQ_START = { cols:[{name:'Customer', type:'text'},{name:'Location', type:'text'},{name:'Amount', type:'text'},{name:'Date', type:'text'}], rows: DATA.messy.map(r => ({Customer:r[0], Location:r[1], Amount:r[2], Date:r[3]})) };
const PQ_GOALS = {
  blank:['No blank rows', s => s.rows.every(r => s.cols.some(c => String(r[c.name] ?? '').trim() !== ''))],
  dup:['No duplicate rows', s => new Set(s.rows.map(r => JSON.stringify(s.cols.map(c => r[c.name])))).size === s.rows.length],
  trim:['Customer has no extra spaces', s => s.cols.some(c => c.name === 'Customer') && s.rows.every(r => { const v = String(r.Customer ?? ''); return v === v.trim() && !/\s{2,}/.test(v); })],
  proper:['Customer is in Title Case', s => s.rows.every(r => { const v = String(r.Customer ?? ''); return v === '' || v.split(' ').every(w => w === '' || (w[0] === w[0].toUpperCase() && w.slice(1) === w.slice(1).toLowerCase())); })],
  number:['Amount is a Number type (no errors)', s => { const c = s.cols.find(c => c.name === 'Amount'); return c && c.type === 'number' && s.rows.every(r => typeof r.Amount === 'number'); }],
  split:['Location split into City + Region', s => !s.cols.some(c => c.name === 'Location') && s.cols.length >= 5]
};
R.pq = (st, body, api) => {
  let steps = [], selCol = null, state = PBI.PQ.run(PQ_START, steps);
  body.innerHTML = `<h2>${esc(st.title)}</h2><p class="lead task">${st.task}</p><div class="pq"><div class="pq-main"><div class="pq-tools">
    <span class="grp"><b>Table</b><button data-op="removeBlank">🧹 Remove blank rows</button><button data-op="removeDup">👯 Remove duplicates</button></span>
    <span class="grp"><b>Column</b> <span class="selname"></span><button data-op="trim" data-c>✂️ Trim</button><button data-op="proper" data-c>Aa Capitalize Each Word</button><button data-op="type" data-to="number" data-c>123 To Number</button><button data-op="split" data-c>⫽ Split by comma</button></span></div>
    <div class="pq-grid"></div></div><div class="pq-side"><b>Goals</b><ul class="goals"></ul><b>Applied Steps</b><ol class="steps"></ol></div></div>`;
  function label(s){ return {removeBlank:'Removed Blank Rows', removeDup:'Removed Duplicates', trim:`Trimmed ${s.col}`, proper:`Capitalized ${s.col}`, type:`Changed ${s.col} to ${s.to}`, split:`Split ${s.col} by comma`}[s.op]; }
  function draw(){
    state = PBI.PQ.run(PQ_START, steps);
    const icon = t => t === 'number' ? '1²3' : t === 'date' ? '📅' : 'ABC';
    $('.pq-grid', body).innerHTML = `<table class="pqt"><tr>${state.cols.map(c => `<th class="${c.name === selCol ? 'on' : ''}" data-c="${esc(c.name)}"><span class="ty">${icon(c.type)}</span> ${esc(c.name)}</th>`).join('')}</tr>${state.rows.map(r => `<tr>${state.cols.map(c => { const v = r[c.name]; return `<td class="${v === 'Error' ? 'err' : ''} ${String(v ?? '').trim() === '' ? 'blank' : ''}">${v === '' || v == null ? '<i>null</i>' : esc(String(v).replace(/ /g, '·'))}</td>`; }).join('')}</tr>`).join('')}</table><div class="small muted">${state.rows.length} rows · spaces shown as · so you can spot them · click a column header to select it</div>`;
    $$('.pqt th', body).forEach(th => th.onclick = () => { selCol = th.dataset.c; draw(); });
    $('.selname', body).textContent = selCol ? `(${selCol})` : '(click a header)';
    $$('[data-c]', $('.pq-tools', body)).forEach(b => b.disabled = !selCol);
    $('.steps', body).innerHTML = '<li class="src">Source</li>' + steps.map((s, i) => `<li>${label(s)} <button data-del="${i}" title="Delete step">✕</button></li>`).join('');
    $$('[data-del]', body).forEach(b => b.onclick = () => { steps.splice(+b.dataset.del); draw(); });
    $('.goals', body).innerHTML = st.goals.map(g => `<li class="${PQ_GOALS[g][1](state) ? 'ok' : ''}">${PQ_GOALS[g][1](state) ? '✅' : '⬜'} ${PQ_GOALS[g][0]}</li>`).join('');
  }
  $$('.pq-tools button', body).forEach(b => b.onclick = () => { const op = b.dataset.op; const s = {op}; if(b.hasAttribute('data-c')){ if(!selCol) return; s.col = selCol; } if(op === 'type') s.to = b.dataset.to; if(op === 'split') s.delim = ',';
    if(op === 'split' && !String(state.rows[0]?.[selCol] ?? '').includes(',')){ api.fail(`"${selCol}" has no commas to split on. Pick the Location column.`, true); return; }
    steps.push(s); if(op === 'split') selCol = null; draw(); });
  draw();
  return { check: () => { const miss = st.goals.filter(g => !PQ_GOALS[g][1](state)); return miss.length ? 'Still to do: ' + miss.map(g => PQ_GOALS[g][0]).join(', ') + '.' : true; }, solve: () => { steps = JSON.parse(JSON.stringify(st.solution)); selCol = null; draw(); }, hint: 'Remove blanks first. Then select a column header and use the column buttons. Remove duplicates last.' };
};

// ---------- Model view ----------
R.model = (st, body, api) => {
  let rels = [], pend = null;
  const POS = { Products:{x:2, y:4}, Sales:{x:37, y:30}, Stores:{x:72, y:4}, Calendar:{x:72, y:56} };
  const GOOD = [['Sales','ProductID','Products','ProductID'],['Sales','StoreID','Stores','StoreID'],['Sales','Date','Calendar','Date']];
  body.innerHTML = `<h2>${esc(st.title)}</h2><p class="lead task">${st.task}</p><div class="mv"><svg class="mv-lines"></svg>${Object.keys(POS).map(t => `<div class="mt ${t === 'Sales' ? 'fact' : ''}" style="left:${POS[t].x}%;top:${POS[t].y}%" data-t="${t}"><b>${t}${t === 'Sales' ? ' ⭐' : ''}</b>${M.T[t].cols.map(c => `<button data-t="${t}" data-c="${c}">${c}</button>`).join('')}</div>`).join('')}</div><div class="rels"></div>`;
  const mv = $('.mv', body);
  const isGood = r => GOOD.some(g => (g[0] === r[0] && g[1] === r[1] && g[2] === r[2] && g[3] === r[3]) || (g[2] === r[0] && g[3] === r[1] && g[0] === r[2] && g[1] === r[3]));
  function lines(){ const svg = $('.mv-lines', body); if(!svg || !mv.isConnected) return; const box = mv.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    svg.innerHTML = rels.map(r => { const a = $(`button[data-t="${r[0]}"][data-c="${r[1]}"]`, mv).getBoundingClientRect(), b = $(`button[data-t="${r[2]}"][data-c="${r[3]}"]`, mv).getBoundingClientRect();
      const ax = (a.left + a.width/2 < b.left + b.width/2 ? a.right : a.left) - box.left, ay = a.top + a.height/2 - box.top, bx = (a.left < b.left ? b.left : b.right) - box.left, by = b.top + b.height/2 - box.top; const ok = isGood(r);
      return `<path d="M${ax} ${ay} C${(ax+bx)/2} ${ay} ${(ax+bx)/2} ${by} ${bx} ${by}" fill="none" stroke="${ok ? '#2f9e77' : '#e36b6b'}" stroke-width="2.5" ${ok ? '' : 'stroke-dasharray="6 5"'}/><text x="${ax + (bx > ax ? 8 : -14)}" y="${ay - 6}" class="tl">${r[0] === 'Sales' ? '*' : '1'}</text><text x="${bx + (bx > ax ? -14 : 8)}" y="${by - 6}" class="tl">${r[2] === 'Sales' ? '*' : '1'}</text>`; }).join(''); }
  function draw(){ $$('.mt button', mv).forEach(b => b.classList.toggle('pend', !!pend && pend[0] === b.dataset.t && pend[1] === b.dataset.c));
    $('.rels', body).innerHTML = rels.length ? rels.map((r, i) => `<span class="chip ${isGood(r) ? 'good' : 'bad'}">${r[0]}[${r[1]}] ↔ ${r[2]}[${r[3]}] <button data-i="${i}">✕</button></span>`).join('') : '<span class="small muted">No relationships yet. Click a column in Sales, then its match.</span>';
    $$('.rels button', body).forEach(b => b.onclick = () => { rels.splice(+b.dataset.i, 1); draw(); }); requestAnimationFrame(lines); }
  $$('.mt button', mv).forEach(b => b.onclick = () => { const t = b.dataset.t, c = b.dataset.c;
    if(!pend || pend[0] === t){ pend = [t, c]; draw(); return; }
    const r = [pend[0], pend[1], t, c]; pend = null;
    if(rels.some(x => (x[0] === r[0] && x[2] === r[2]) || (x[0] === r[2] && x[2] === r[0]))){ api.fail('Those two tables are already connected. Remove the old line first.', true); draw(); return; }
    rels.push(r); if(!isGood(r)) api.fail(`${r[1]} and ${r[3]} hold different things, so this relationship won't work. Match the same key on both sides.`, true); draw(); });
  draw(); window.addEventListener('resize', lines);
  return { check: () => { const good = rels.filter(isGood).length, bad = rels.length - good; return bad ? 'Remove the red (wrong) relationship first.' : good === 3 ? true : `${good} of 3 relationships done. Keep going!`; },
    solve: () => { rels = GOOD.map(g => g.slice()); draw(); }, hint: 'Each dimension table shares one ID column with Sales: ProductID, StoreID and Date.' };
};

// ---------- DAX ----------
R.dax = (st, body, api) => {
  const LM = PBI.buildModel(DATA); (st.pre || []).forEach(t => { const m = PBI.defineMeasure(LM, t); LM.measures[m.name] = m; });
  body.innerHTML = `<h2>${esc(st.title)}</h2><p class="lead task">${st.task}</p><div class="dax"><div class="dax-main"><div class="dax-bar"><span class="fx">fx</span><textarea class="daxin" rows="2" spellcheck="false" placeholder="${esc(st.target)} = ">${esc(st.target)} = </textarea></div><div class="row"><button class="btn small" id="mk">✓ Create measure</button><span class="small muted">Ctrl+Enter</span></div><div class="dax-out"></div></div>
    <div class="dax-side"><b>Fields</b>${Object.keys(LM.T).map(t => `<details ${t === 'Sales' ? 'open' : ''}><summary>🗂️ ${t}</summary>${LM.T[t].cols.map(c => `<button class="ins" data-v="${t}[${c}]">${c}</button>`).join('')}</details>`).join('')}<div class="measures"></div></div></div>`;
  const ta = $('.daxin', body); let last = null;
  function side(){ $('.measures', body).innerHTML = Object.keys(LM.measures).length ? '<b>Measures</b>' + Object.keys(LM.measures).map(n => `<button class="ins m" data-v="[${n}]">🧮 ${n}</button>`).join('') : ''; $$('.ins', body).forEach(b => b.onclick = () => { const p = ta.selectionStart; ta.value = ta.value.slice(0, p) + b.dataset.v + ta.value.slice(ta.selectionEnd); ta.focus(); ta.setSelectionRange(p + b.dataset.v.length, p + b.dataset.v.length); }); }
  function run(){
    try{ const m = PBI.defineMeasure(LM, ta.value); LM.measures[m.name] = m; const v = PBI.evalMeasure(LM, m.ast); last = {v, m};
      const [mt, mc] = st.matrix; const g = PBI.groupBy(LM, mt, mc, m.ast); const f = x => x == null ? '(blank)' : st.pct ? (x*100).toFixed(1) + '%' : typeof x === 'number' ? (/revenue|value|check/i.test(m.name) ? '$' : '') + (+x.toFixed(2)).toLocaleString() : x;
      $('.dax-out', body).innerHTML = `<div class="kpi"><div class="kv">${f(v)}</div><div class="kl">${esc(m.name)}</div></div><table class="pt small"><tr><th>${mc}</th><th>${esc(m.name)}</th></tr>${g.map(r => `<tr><td>${esc(r.key)}</td><td class="num">${f(r.value)}</td></tr>`).join('')}<tr class="gt"><td>Total</td><td class="num">${f(v)}</td></tr></table><div class="small muted">Same measure, a different filter on each row: that's filter context.</div>`;
      side(); return true;
    }catch(e){ last = null; $('.dax-out', body).innerHTML = `<div class="errbox">⚠️ ${esc(e.message)}</div>`; return false; }
  }
  $('#mk', body).onclick = () => { if(run()) api.check(); };
  ta.addEventListener('keydown', e => { e.stopPropagation(); if((e.ctrlKey || e.metaKey) && e.key === 'Enter'){ e.preventDefault(); $('#mk', body).click(); } });
  side(); setTimeout(() => { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }, 60);
  return { check: () => { if(!last && !run()) return 'Fix the error first.'; if(!last) return 'Create the measure first.'; return st.check(last.v, last.m, LM); }, solve: () => { ta.value = st.solution; run(); }, hint: 'Click field names on the right to insert them without typos.', noPrimaryCheck:false };
};

// ---------- Report builder ----------
const DIMS = ['Stores.Region','Stores.Store','Products.Category','Products.Product','Calendar.Month','Calendar.Quarter'];
const VTYPES = [['card','🔢 Card'],['column','📊 Column'],['bar','📶 Bar'],['line','📈 Line'],['pie','🍩 Donut'],['table','📋 Table']];
R.report = (st, body, api) => {
  let C = {tiles: Array.from({length: st.tiles}, () => ({type:null, axis:null, measure:null})), slicer:'All'}; let cur = 0;
  body.innerHTML = `<h2>${esc(st.title)}</h2><p class="lead task">${st.task}</p><div class="rb"><div class="rb-canvas"><div class="slicer"><b>Region slicer:</b> ${['All','East','West','Midwest','South'].map(r => `<button data-r="${r}">${r}</button>`).join('')}</div><div class="tiles t${st.tiles}"></div></div>
    <div class="rb-side"><b>Visualizations</b><div class="vtypes">${VTYPES.map(([v, l]) => `<button data-v="${v}">${l}</button>`).join('')}</div><b>Fields: categories</b><div class="flist">${DIMS.map(d => `<button data-d="${d}">${d.replace('.', ' › ')}</button>`).join('')}</div><b>Measures</b><div class="flist">${Object.keys(M.measures).map(m => `<button data-m="${m}">🧮 ${m}</button>`).join('')}</div></div></div>`;
  function filt(){ return C.slicer === 'All' ? [] : [{table:'Stores', col:'Region', pred:v => v === C.slicer}]; }
  function tile(t){ if(!t.type || !t.measure) return `<div class="ph">${!t.type ? '① Pick a visual type' : '② Pick a measure'}${t.type && t.type !== 'card' && !t.axis ? '<br>③ Pick a category' : ''}</div>`;
    const money = /Revenue|Value/.test(t.measure);
    if(t.type === 'card'){ const v = PBI.evalMeasure(M, M.measures[t.measure].ast, filt()); return `<div class="kpi"><div class="kv">${fmtNum(+(+v).toFixed(2), money)}</div><div class="kl">${t.measure}${C.slicer !== 'All' ? ' · ' + C.slicer : ''}</div></div>`; }
    if(!t.axis) return `<div class="ph">③ Pick a category for the axis</div>`;
    const [tb, col] = t.axis.split('.'); const data = PBI.groupBy(M, tb, col, t.measure, filt()).filter(d => d.value !== null && !(tb === 'Stores' && C.slicer !== 'All' && d.value === 0));
    return `<div class="vt-title">${t.measure} by ${col}</div>${chartSVG(t.type, data, {money, axisName:col, valName:t.measure, compact: C.tiles.length > 1})}`; }
  function draw(){ $$('.slicer button', body).forEach(b => b.classList.toggle('on', b.dataset.r === C.slicer));
    $('.tiles', body).innerHTML = C.tiles.map((t, i) => `<div class="tile ${i === cur ? 'cur' : ''}" data-i="${i}">${tile(t)}</div>`).join('');
    $$('.tile', body).forEach(el => el.onclick = () => { cur = +el.dataset.i; draw(); });
    const t = C.tiles[cur]; $$('.vtypes button', body).forEach(b => b.classList.toggle('on', b.dataset.v === t.type)); $$('[data-d]', body).forEach(b => b.classList.toggle('on', b.dataset.d === t.axis)); $$('[data-m]', body).forEach(b => b.classList.toggle('on', b.dataset.m === t.measure)); }
  $$('.vtypes button', body).forEach(b => b.onclick = () => { C.tiles[cur].type = b.dataset.v; if(b.dataset.v === 'card') C.tiles[cur].axis = null; draw(); });
  $$('[data-d]', body).forEach(b => b.onclick = () => { if(C.tiles[cur].type === 'card'){ api.fail('Cards show one number, so they don\'t need a category. Pick a measure instead.', true); return; } C.tiles[cur].axis = b.dataset.d; draw(); });
  $$('[data-m]', body).forEach(b => b.onclick = () => { C.tiles[cur].measure = b.dataset.m; draw(); });
  $$('.slicer button', body).forEach(b => b.onclick = () => { C.slicer = b.dataset.r; draw(); });
  draw();
  return { check: () => st.check(C), solve: () => { const s = JSON.parse(JSON.stringify(st.solution)); C.tiles = C.tiles.map((t, i) => s.tiles[i] || t); C.slicer = s.slicer; draw(); }, hint: 'Click a tile, then pick a visual type, a category and a measure on the right.' };
};

// ===================================================================== LESSON PLAYER
let player = null;
function startLesson(id, stepIdx){
  const lesson = findLesson(id); if(!lesson) return route('home');
  bumpDay(); S.last = id; save();
  let i = stepIdx ?? Math.min(S.pos[id] || 0, lesson.steps.length - 1); if(S.done[id] && stepIdx === undefined) i = 0;
  const app = $('#app'); document.body.classList.add('focus');
  app.innerHTML = `<div class="player"><div class="p-top"><button class="iconbtn" id="exit" title="Back to home (Esc)">✕</button><div class="p-title"><b>${esc(lesson.title)}</b><span class="muted small">${lesson.track.name} · lesson ${lesson.idx+1}</span></div><div class="segs">${lesson.steps.map((_, k) => `<span data-k="${k}"></span>`).join('')}</div>
    <button class="pill timer" id="timer" title="Focus timer: click to pause"></button><button class="iconbtn" id="speakBtn" title="Read aloud">🔊</button><button class="iconbtn" id="parkBtn" title="Parking lot: jot down a distracting thought">📝</button></div>
    <div class="p-body"><div class="card step" id="stepCard"></div><div class="feedback" id="fb" aria-live="polite"></div></div>
    <div class="p-bottom"><button class="btn ghost" id="back">← Back</button><div class="mid"><button class="btn ghost small" id="hintBtn" hidden>💡 Stuck?</button><button class="btn ghost small" id="solveBtn" hidden>👀 Show me</button></div><button class="btn" id="primary">Next →</button></div></div>`;
  $('#exit').onclick = () => route('home'); $('#parkBtn').onclick = parking;
  player = { lesson, i, fails:0, ctrl:null, passed:false };
  timerUI(); renderStep();
}
function renderStep(){
  const P = player, st = P.lesson.steps[P.i], body = $('#stepCard'); P.fails = 0; P.passed = !!S.passed[P.lesson.id + ':' + P.i];
  S.pos[P.lesson.id] = P.i; save();
  $$('.segs span').forEach((s, k) => { s.className = k < P.i || S.passed[P.lesson.id + ':' + k] ? 'done' : k === P.i ? 'cur' : ''; });
  body.className = 'card step type-' + st.type; body.innerHTML = ''; delete body.dataset.ok; $('#fb').innerHTML = ''; $('#fb').className = 'feedback';
  const api = { pass: (quiet) => pass(quiet), fail: (m, soft) => fail(m, soft), check: () => doCheck() };
  P.ctrl = (R[st.type] || R.learn)(st, body, api, {lesson:P.lesson}) || {};
  const interactive = !['learn','quiz','real','order'].includes(st.type);
  $('#hintBtn').hidden = !(P.ctrl.hint); $('#solveBtn').hidden = true;
  $('#hintBtn').onclick = () => { $('#fb').className = 'feedback hint'; $('#fb').innerHTML = '💡 ' + P.ctrl.hint; if(P.ctrl.solve) $('#solveBtn').hidden = false; };
  $('#solveBtn').onclick = () => { P.ctrl.solve(); $('#fb').className = 'feedback hint'; $('#fb').innerHTML = '👀 Here\'s one way to do it. Look it over, then press <b>Check</b>.'; };
  $('#back').disabled = P.i === 0; $('#back').onclick = () => { if(P.i > 0){ P.i--; renderStep(); } };
  $('#speakBtn').onclick = () => speak(P.ctrl.speakText || body.innerText);
  const prim = $('#primary');
  if(st.type === 'learn' || P.passed || P.ctrl.ready){ setNext(); if(st.type === 'learn' && !P.passed){ markPassed(5, true); } }
  else if(interactive){ prim.textContent = '✓ Check'; prim.className = 'btn mint'; prim.onclick = doCheck; }
  else { prim.textContent = st.type === 'quiz' ? 'Pick an answer' : 'Finish the task'; prim.className = 'btn'; prim.disabled = true; }
  if(S.set.speak && st.type === 'learn') speak(P.ctrl.speakText);
  window.scrollTo({top:0});
}
function setNext(){ const prim = $('#primary'); prim.disabled = false; prim.className = 'btn';
  const last = player.i === player.lesson.steps.length - 1; prim.textContent = last ? '🏁 Finish lesson' : 'Next →'; prim.onclick = () => last ? finishLesson() : (player.i++, renderStep()); }
function markPassed(xp, quiet){ const k = player.lesson.id + ':' + player.i; if(!S.passed[k]){ S.passed[k] = true; S.xp += xp; bumpDay(); S.day.steps++; save(); if(!quiet) xpFloat(xp); if(S.day.steps === S.goal){ toast('🎯 Daily goal reached! Amazing focus today.'); confetti(40); } } player.passed = true;
  const seg = $$('.segs span')[player.i]; if(seg) seg.className = 'done'; }
function pass(quiet){ const st = player.lesson.steps[player.i]; markPassed(st.type === 'quiz' ? 10 : st.type === 'real' ? 5 : 20, quiet === true);
  if(quiet !== true){ $('#fb').className = 'feedback ok'; $('#fb').innerHTML = ['🎉 Nailed it!','✨ Perfect!','🙌 Yes! That\'s it.','🌟 Great work!','💪 Smooth!'][Math.floor(Math.random()*5)]; if(!S.set.calm) $('#stepCard').classList.add('celebrate'); }
  setNext(); $('#primary').focus({preventScroll:true}); }
function fail(msg, soft){ if(!soft){ player.fails++; if(player.fails >= 2 && player.ctrl.solve) $('#solveBtn').hidden = false; }
  $('#fb').className = 'feedback no'; $('#fb').innerHTML = '🤔 ' + msg; const c = $('#stepCard'); c.classList.remove('wiggle'); void c.offsetWidth; c.classList.add('wiggle'); }
function doCheck(){ const r = player.ctrl.check ? player.ctrl.check() : true; if(r === true) pass(); else fail(r || 'Not quite yet.'); }
function finishLesson(){
  const L = player.lesson, first = !S.done[L.id]; S.done[L.id] = true; if(first) S.xp += 50; save(); confetti(70);
  const unlocked = GAMES.find(g => g.track === L.track.id && g.after === L.idx + 1);
  const next = L.track.lessons[L.idx + 1]; const trackFinished = trackDone(L.track) === L.track.lessons.length;
  modal(`${lumi('sm')}<h2>Lesson complete! 🎉</h2><p>You finished <b>${esc(L.title)}</b>${first ? ' · <b>+50 XP</b>' : ''}</p>
    <div class="donegrid"><div><b>${S.day.steps}</b><span>steps today</span></div><div><b>🔥 ${S.streak.count}</b><span>day streak</span></div><div><b>${S.xp}</b><span>total XP</span></div></div>
    ${unlocked ? `<p class="unlock">🎁 Brain-break game unlocked: <b>${esc(unlocked.title)}</b></p>` : ''}
    <div class="col">${trackFinished ? `<a class="btn" href="#cert-${L.track.id}" data-close>🏆 Get your ${L.track.name} certificate</a>` : next ? `<a class="btn" href="#l-${next.id}" data-close>Next: ${esc(next.title)} →</a>` : ''}
    ${unlocked ? `<a class="btn ghost" href="#g-${unlocked.id}" data-close>🎮 Play ${esc(unlocked.title)}</a>` : ''}<a class="btn ghost" href="#home" data-close>✋ Done for now (that's OK!)</a></div>`);
}

// ---------- focus timer & breaks ----------
let T = { left: null, run: true, iv: null };
function timerUI(){ if(T.left === null) T.left = S.set.mins * 60; clearInterval(T.iv);
  const draw = () => { const b = $('#timer'); if(!b) return; const m = Math.floor(T.left / 60), s = T.left % 60; b.innerHTML = `${T.run ? '⏱️' : '⏸️'} ${m}:${String(s).padStart(2, '0')}`; b.classList.toggle('low', T.left < 60); };
  $('#timer').onclick = () => { T.run = !T.run; draw(); };
  T.iv = setInterval(() => { if(!$('#timer')){ clearInterval(T.iv); return; } if(T.run && !document.hidden && !$('.modal-bg')){ T.left--; if(T.left <= 0){ T.left = 0; draw(); breakTime(); return; } } draw(); }, 1000); draw(); }
function breakTime(){ clearInterval(T.iv); T.left = null;
  modal(`<h2>⏰ ${S.set.mins} minutes of focus. Brilliant!</h2><p>Your brain learns best with short breaks. Pick one (about 2 minutes):</p><div class="breaks">${BREAKS.map((b, i) => `<button class="brk" data-i="${i}"><span>${b.icon}</span><b>${b.title}</b></button>`).join('')}</div><div class="brkbody"></div><div class="row center"><button class="btn ghost small" id="skip">Skip, I'm in the zone</button></div>`, bg => {
    $$('.brk', bg).forEach(b => b.onclick = () => { const br = BREAKS[+b.dataset.i]; let sec = 120;
      $('.brkbody', bg).innerHTML = `<p class="lead">${br.text}</p>${br.kind === 'breath' ? '<div class="breath"><span>breathe</span></div>' : ''}<div class="big" id="cd">2:00</div><button class="btn" id="backto" disabled>Back to learning →</button>`;
      $$('.brk', bg).forEach(x => x.disabled = true);
      const iv = setInterval(() => { sec--; const cd = $('#cd', bg); if(!cd){ clearInterval(iv); return; } cd.textContent = `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`; if(sec <= 100) $('#backto', bg).disabled = false; if(sec <= 0){ clearInterval(iv); cd.textContent = 'Ready!'; } }, 1000);
      $('#backto', bg).onclick = () => { clearInterval(iv); bg.remove(); S.xp += 5; save(); toast('Welcome back! Fresh 🧠'); if($('#timer')) timerUI(); }; });
    $('#skip', bg).onclick = () => { bg.remove(); if($('#timer')) timerUI(); };
  }); }
function parking(){
  modal(`<h2>📝 Parking lot</h2><p class="small">A thought popped up? Park it here and get back to learning. It'll wait for you.</p><div class="row"><input id="pin" class="textin" placeholder="e.g. reply to Sam, look up pivot charts…"><button class="btn small" id="padd">Park it</button></div><ul class="plist"></ul><button class="btn ghost small" data-close>Back to focus</button>`, bg => {
    const draw = () => { $('.plist', bg).innerHTML = S.parking.map((p, i) => `<li><span>${esc(p)}</span><button data-i="${i}" title="Done">✓</button></li>`).join('') || '<li class="muted">Nothing parked. Your mind is clear ✨</li>'; $$('.plist button', bg).forEach(b => b.onclick = () => { S.parking.splice(+b.dataset.i, 1); save(); draw(); }); };
    const add = () => { const v = $('#pin', bg).value.trim(); if(!v) return; S.parking.push(v); save(); $('#pin', bg).value = ''; draw(); toast('Parked 🅿️ Back to it!'); };
    $('#padd', bg).onclick = add; $('#pin', bg).onkeydown = e => { e.stopPropagation(); if(e.key === 'Enter') add(); }; draw(); setTimeout(() => $('#pin', bg).focus(), 50); });
}

// ===================================================================== HOME
function viewHome(){
  document.body.classList.remove('focus'); bumpDay(); save();
  const all = allLessons(); const nextL = (S.last && findLesson(S.last) && !S.done[S.last]) ? findLesson(S.last) : all.find(l => !S.done[l.id] && lessonUnlocked(l));
  const pct = Math.min(1, S.day.steps / S.goal); const C = 2 * Math.PI * 40;
  const gm = GAMES.filter(gameUnlocked);
  const trackCard = t => `<div class="card track" style="--tc:${t.color};--ta:${t.accent}"><div class="th"><h2>${t.id === 'excel' ? '📗' : '📊'} ${t.name}</h2><span class="pill">${trackDone(t)}/${t.lessons.length} done</span></div><p class="muted">${t.blurb}</p>
    <ol class="lessons">${t.lessons.map((l, i) => { const L = findLesson(l.id); const un = lessonUnlocked(L), dn = S.done[l.id]; const ps = l.steps.filter((_, k) => S.passed[l.id + ':' + k]).length;
      return `<li class="${dn ? 'dn' : ''} ${un ? '' : 'lk'}"><a href="${un ? '#l-' + l.id : '#home'}" ${un ? '' : 'aria-disabled="true"'}><span class="no">${dn ? '✓' : un ? i+1 : '🔒'}</span><span class="tt"><b>${esc(l.title)}</b><span class="small muted">${l.mins} min · ${l.steps.length} small steps</span></span><span class="mini"><i style="width:${ps/l.steps.length*100}%"></i></span></a></li>`; }).join('')}</ol>
    ${trackDone(t) === t.lessons.length ? `<a class="btn small" href="#cert-${t.id}">🏆 Certificate</a>` : ''}</div>`;
  return `<section class="view home">
  <div class="card hero"><div class="lumiwrap">${lumi()}</div><div><div class="muted small" style="font-weight:800;letter-spacing:1px">${new Date().toLocaleDateString(undefined, {weekday:'long'}).toUpperCase()}</div><h1>${S.name ? `Hi ${esc(S.name)}! ` : 'Hi! '}One small step?</h1>
    <p class="lead">Lessons are split into tiny steps of 1 to 2 minutes. Do one, do five. Every step counts.</p>
    ${nextL ? `<a class="btn big" href="#l-${nextL.id}">▶ ${S.pos[nextL.id] ? 'Continue' : 'Start'}: ${esc(nextL.title)} <span class="small">· step ${(S.pos[nextL.id] || 0) + 1} of ${nextL.steps.length}</span></a>` : `<div class="btn big">🏆 You finished everything!</div>`}</div>
    <div class="ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" class="bg"/><circle cx="50" cy="50" r="40" class="fg" style="stroke-dasharray:${C};stroke-dashoffset:${C*(1-pct)}"/></svg><div><b>${S.day.steps}/${S.goal}</b><span>today's steps</span></div><select id="goalSel" title="Daily goal">${[4,8,12,20].map(g => `<option value="${g}" ${g === S.goal ? 'selected' : ''}>${g === 4 ? 'Low-energy day: 4' : g === 8 ? 'Normal day: 8' : g === 12 ? 'Strong day: 12' : 'Beast mode: 20'}</option>`).join('')}</select></div></div>
  <div class="tracks">${TRACKS.map(trackCard).join('')}</div>
  <div class="card"><h2>🎮 Brain-break games</h2><p class="muted">A new one unlocks every 2 lessons. Each takes about 2 minutes, a fun reward that won't swallow your evening.</p><div class="games">${GAMES.map(g => { const un = gameUnlocked(g); return `<a class="game ${un ? '' : 'lk'} ${S.games[g.id] ? 'won' : ''}" href="${un ? '#g-' + g.id : '#home'}"><span class="gi">${S.games[g.id] ? '🏆' : un ? '🎁' : '🔒'}</span><b>${esc(g.title)}</b><span class="small muted">${un ? (g.track === 'excel' ? 'Excel' : 'Power BI') + ' reward' : `after ${g.track === 'excel' ? 'Excel' : 'Power BI'} lesson ${g.after}`}</span></a>`; }).join('')}</div></div>
  <div class="two"><div class="card"><h2>📦 Practice files</h2><p class="muted">For real hands-on practice in Excel and Power BI Desktop.</p><div class="col"><a class="btn ghost" href="practice/Lumi_Excel_Practice.xlsx" target="_blank" rel="noopener">📗 Excel practice workbook</a><a class="btn ghost" href="practice/LumiBoba_PowerBI_Data.xlsx" target="_blank" rel="noopener">📊 Power BI dataset (4 tables)</a><a class="btn ghost" href="practice/Messy_Customers.csv" target="_blank" rel="noopener">🧹 Messy_Customers.csv</a></div></div>
  <div class="card"><h2>🧠 Built for focus</h2><ul class="feat"><li><b>One thing per screen.</b> No walls of text.</li><li><b>⏱️ Focus timer</b> (${S.set.mins} min) with guided breaks.</li><li><b>📝 Parking lot</b> for stray thoughts.</li><li><b>🔊 Read aloud</b> and calm mode in ⚙️.</li><li><b>Resume exactly</b> where you stopped.</li></ul><button class="btn ghost small" id="setBtn2">⚙️ Adjust settings</button></div></div>
  </section>`;
}
function wireHome(){ const g = $('#goalSel'); if(g) g.onchange = () => { S.goal = +g.value; save(); route(); }; const s = $('#setBtn2'); if(s) s.onclick = settings;
  $$('.lessons a[aria-disabled]').forEach(a => a.onclick = e => { e.preventDefault(); toast('🔒 Finish the lesson before this one first. One step at a time!'); });
  $$('.game.lk').forEach(a => a.onclick = e => { e.preventDefault(); toast('🔒 Keep going! This game unlocks soon.'); }); }

// ===================================================================== GAMES
function viewGame(id){ const g = GAMES.find(x => x.id === id); if(!g) return viewHome(); document.body.classList.add('focus');
  if(!gameUnlocked(g)) return `<section class="view"><div class="card center">${lumi('sm')}<h2>🔒 Not unlocked yet</h2><p>Finish ${g.track === 'excel' ? 'Excel' : 'Power BI'} lessons 1 to ${g.after} to play <b>${esc(g.title)}</b>.</p><a class="btn" href="#home">Back home</a></div></section>`;
  return `<section class="view"><div class="card game-head"><button class="iconbtn" onclick="location.hash='#home'">✕</button>${lumi('sm')}<div><div class="muted small">🎮 BRAIN BREAK · ~2 MIN</div><h1>${esc(g.title)}</h1><p>${esc(g.desc)}</p></div></div><div class="card" id="gameArea"></div></section>`; }
function winGame(g, msg){ const first = !S.games[g.id]; S.games[g.id] = true; if(first) S.xp += 40; save(); confetti(90);
  modal(`<div class="bigicon">🏆</div><h2>${esc(g.title)} complete!</h2><p>${esc(msg)}${first ? '<br><b>+40 XP</b>' : ''}</p><div class="col"><a class="btn" href="#home" data-close>Back to learning →</a><button class="btn ghost" data-close id="again">Play again</button></div>`, bg => { $('#again', bg).onclick = () => route(); }); }
const shuffle = a => { a = a.slice(); for(let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; } return a; };
const GAME = {
  memory(g, el){ const cards = shuffle(g.pairs.flatMap((p, i) => [{t:p[0], k:i, kw:true}, {t:p[1], k:i}])); let open = [], got = 0, flips = 0, busy = false;
    el.innerHTML = `<div class="row between"><b>Flips: <span id="fl">0</span></b><b>Pairs: <span id="pr">0</span>/${g.pairs.length}</b></div><div class="mem">${cards.map((c, i) => `<button class="mc" data-i="${i}"><span class="f">✦</span><span class="b ${c.kw ? 'kw' : ''}">${esc(c.t)}</span></button>`).join('')}</div>`;
    $$('.mc', el).forEach(m => m.onclick = () => { if(busy || m.classList.contains('up')) return; m.classList.add('up'); open.push(m); flips++; $('#fl').textContent = flips;
      if(open.length === 2){ const [a, b] = open; if(cards[a.dataset.i].k === cards[b.dataset.i].k){ a.classList.add('got'); b.classList.add('got'); open = []; got++; $('#pr').textContent = got; if(got === g.pairs.length) setTimeout(() => winGame(g, `Done in ${flips} flips (perfect is ${g.pairs.length*2}).`), 500); }
        else { busy = true; setTimeout(() => { a.classList.remove('up'); b.classList.remove('up'); open = []; busy = false; }, 850); } } }); },
  mcq(g, el){ let i = 0, score = 0; const draw = () => { const r = g.rounds[i]; const opts = shuffle(r.opts.map((o, k) => ({o, k})));
      el.innerHTML = `<div class="row between"><b>Round ${i+1}/${g.rounds.length}</b><b>Score: ${score}</b></div><p class="lead mono">${esc(r.q)}</p><div class="opts">${opts.map(x => `<button class="opt" data-k="${x.k}">${esc(x.o)}</button>`).join('')}</div>`;
      $$('.opt', el).forEach(b => b.onclick = () => { const ok = +b.dataset.k === r.a; if(ok) score++; b.classList.add(ok ? 'right' : 'wrong'); if(!ok) $(`.opt[data-k="${r.a}"]`, el).classList.add('right'); $$('.opt', el).forEach(x => x.disabled = true);
        setTimeout(() => { i++; i < g.rounds.length ? draw() : winGame(g, `Score: ${score} / ${g.rounds.length}`); }, 900); }); }; draw(); },
  order(g, el){ let r = 0; const draw = () => { const items = g.rounds[r]; let n = 0;
      el.innerHTML = `<b>Pipeline ${r+1}/${g.rounds.length}</b><ol class="built"></ol><div class="tokens">${shuffle(items.map((t, i) => ({t, i}))).map(x => `<button class="token" data-i="${x.i}">${esc(x.t)}</button>`).join('')}</div>`;
      $$('.token', el).forEach(b => b.onclick = () => { if(+b.dataset.i === n){ b.classList.add('used'); $('.built', el).insertAdjacentHTML('beforeend', `<li>${esc(items[n])}</li>`); n++; if(n === items.length){ r++; setTimeout(() => r < g.rounds.length ? draw() : winGame(g, 'Every pipeline rebuilt!'), 600); } } else { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); } }); }; draw(); },
  blitz(g, el){ el.innerHTML = `<div class="center"><p class="lead">${g.secs} seconds. True or false?</p><button class="btn big" id="go">⚡ Start</button></div>`;
    $('#go', el).onclick = () => { const items = shuffle(g.items); let i = 0, score = 0, t = g.secs;
      el.innerHTML = `<div class="row between"><b>⏱️ <span id="bt">${t}</span>s</b><b>Score: <span id="bs">0</span></b></div><div class="tbar"><i id="tb"></i></div><div class="blitzq" id="bq"></div><div class="row center"><button class="btn mint" id="bT">✔ True</button><button class="btn" id="bF">✘ False</button></div><div id="bfb" class="center small"></div>`;
      const show = () => { $('#bq').textContent = items[i][0]; }; let done = false;
      const end = () => { if(done) return; done = true; clearInterval(iv); winGame(g, `Score: ${score} / ${items.length}`); };
      const ans = v => { if(done) return; const ok = v === items[i][1]; if(ok) score++; $('#bs').textContent = score; $('#bfb').textContent = ok ? '✅' : '❌ ' + (items[i][1] ? 'True' : 'False'); i++; i < items.length ? show() : end(); };
      $('#bT').onclick = () => ans(true); $('#bF').onclick = () => ans(false);
      const iv = setInterval(() => { t--; if(!$('#bt')){ clearInterval(iv); return; } $('#bt').textContent = t; $('#tb').style.width = (t/g.secs*100) + '%'; if(t <= 0) end(); }, 1000); show(); }; }
};

// ===================================================================== CERTIFICATE
function viewCert(tid){ const t = TRACKS.find(x => x.id === tid); if(!t) return viewHome(); document.body.classList.remove('focus');
  if(trackDone(t) < t.lessons.length) return `<section class="view"><div class="card center"><h2>🏆 Almost there!</h2><p>Finish all ${t.lessons.length} ${t.name} lessons to unlock this certificate. You've done ${trackDone(t)}.</p><a class="btn" href="#home">Keep going</a></div></section>`;
  return `<section class="view"><div class="card cert">${lumi('sm')}<div class="muted" style="letter-spacing:3px;font-weight:800">CERTIFICATE OF COMPLETION</div><h1>${esc(S.name || 'Data Adventurer')}</h1><p class="lead">completed the <b>${t.name}</b> track of <b>Lumi's Data Lab</b>:<br>${t.lessons.map(l => esc(l.title)).join(' · ')}</p><p class="muted">${new Date().toLocaleDateString(undefined, {year:'numeric', month:'long', day:'numeric'})} · ${S.xp} XP</p></div>
    <div class="card"><h2>Put it on your résumé</h2><p><b>${t.name}:</b> ${t.id === 'excel' ? 'formulas (IF, SUMIFS, XLOOKUP, INDEX/MATCH), PivotTables, charts, conditional formatting, data cleaning' : 'Power Query data cleaning, star-schema data modeling, DAX measures (CALCULATE, SUMX, DIVIDE), interactive reports with slicers'}.</p><a class="btn" href="#home">Back home</a></div></section>`; }

// ===================================================================== SETTINGS / ROUTER / BOOT
function settings(){
  modal(`<h2>⚙️ Settings</h2><div class="set"><label><input type="checkbox" id="sCalm" ${S.set.calm ? 'checked' : ''}> <span><b>Calm mode</b><br><span class="small muted">Fewer animations, no confetti</span></span></label>
    <label><input type="checkbox" id="sBig" ${S.set.big ? 'checked' : ''}> <span><b>Bigger text</b></span></label>
    <label><input type="checkbox" id="sSpeak" ${S.set.speak ? 'checked' : ''}> <span><b>Auto read-aloud</b><br><span class="small muted">Reads each lesson card out loud</span></span></label>
    <label><span><b>Focus timer</b></span> <select id="sMins">${[10,15,20,25].map(m => `<option ${m === S.set.mins ? 'selected' : ''}>${m}</option>`).join('')}</select> min</label>
    <label><span><b>Your name</b></span> <input id="sName" class="textin" value="${esc(S.name)}"></label></div>
    <details><summary>Backup / move progress</summary><textarea id="bk" readonly>${btoa(unescape(encodeURIComponent(JSON.stringify(S))))}</textarea><textarea id="rs" placeholder="Paste a backup code to restore"></textarea><button class="btn ghost small" id="rsgo">Restore</button></details>
    <div class="row center"><button class="btn" id="sSave">Save</button></div>`, bg => {
    $('#sSave', bg).onclick = () => { S.set.calm = $('#sCalm', bg).checked; S.set.big = $('#sBig', bg).checked; S.set.speak = $('#sSpeak', bg).checked; const m = +$('#sMins', bg).value; if(m !== S.set.mins){ S.set.mins = m; T.left = null; } S.name = $('#sName', bg).value.trim().slice(0, 40); save(); bg.remove(); route(); };
    $('#rsgo', bg).onclick = () => { try{ S = Object.assign(JSON.parse(JSON.stringify(DEF)), JSON.parse(decodeURIComponent(escape(atob($('#rs', bg).value.trim()))))); save(); bg.remove(); route(); toast('Restored!'); }catch(e){ toast('That code didn\'t work.'); } };
  }); }
function welcome(){ modal(`${lumi('sm')}<h2>Hi, I'm Lumi! 👋</h2><p>Welcome to the Data Lab. We'll learn Excel and Power BI <b>one tiny step at a time</b>. What should I call you?</p><input id="nm" class="textin big" placeholder="Your name"><div class="row center"><button class="btn" id="go">Let's go</button></div>`, bg => { const go = () => { S.name = $('#nm', bg).value.trim().slice(0, 40); save(); bg.remove(); route(); }; $('#go', bg).onclick = go; $('#nm', bg).onkeydown = e => { e.stopPropagation(); if(e.key === 'Enter') go(); }; setTimeout(() => $('#nm', bg).focus(), 50); }); }
function route(){
  const hs = (location.hash || '#home').slice(1); let m; const app = $('#app'); clearInterval(T.iv); try{ speechSynthesis.cancel(); }catch(e){}
  if((m = hs.match(/^l-(\w+)$/))){ startLesson(m[1]); return; }
  if((m = hs.match(/^g-(\w+)$/))){ app.innerHTML = viewGame(m[1]); const g = GAMES.find(x => x.id === m[1]); if(g && gameUnlocked(g)) GAME[g.kind](g, $('#gameArea')); updateTop(); return; }
  if((m = hs.match(/^cert-(\w+)$/))){ app.innerHTML = viewCert(m[1]); if(trackDone(TRACKS.find(t => t.id === m[1]) || {lessons:[1]}) && !S.set.calm) confetti(120); updateTop(); return; }
  app.innerHTML = viewHome(); wireHome(); updateTop(); window.scrollTo({top:0});
}
window.addEventListener('hashchange', route);
document.addEventListener('keydown', e => {
  if($('.modal-bg')){ if(e.key === 'Escape') $('.modal-bg').remove(); return; }
  if(!player || !$('#primary')) return; const tag = (e.target.tagName || '').toLowerCase(); const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.closest('.xl-wrap');
  if(e.key === 'Escape' && !typing){ location.hash = '#home'; return; }
  if(typing) return;
  if(e.key === 'Enter' && !$('#primary').disabled && document.activeElement && !document.activeElement.closest('.step')){ e.preventDefault(); $('#primary').click(); }
  else if(player.ctrl && player.ctrl.keys && /^[a-dA-D]$/.test(e.key)) player.ctrl.keys(e.key);
});
window.__lab = { breakTime: () => breakTime(), S, TRACKS, get player(){ return player; }, solveCurrent: () => player.ctrl.solve && player.ctrl.solve(), M };
document.addEventListener('DOMContentLoaded', () => { $('#setBtn').onclick = settings; $('#parkTop').onclick = parking; route(); if(!S.name) setTimeout(welcome, 400); });
})();
