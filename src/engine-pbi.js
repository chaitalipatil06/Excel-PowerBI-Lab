// ===== Mini Power BI engine: data model, DAX subset, Power Query steps =====
const PBI = (() => {
  // ---------- model ----------
  function buildModel(D){
    const T = {
      Sales: { cols:['OrderID','Date','StoreID','ProductID','Qty','Revenue'], rows: D.sales.map(r => ({OrderID:r[0], Date:r[1], StoreID:r[2], ProductID:r[3], Qty:r[4], Revenue:r[5]})) },
      Products: { cols:['ProductID','Product','Category','Price'], rows: D.products.map(r => ({ProductID:r[0], Product:r[1], Category:r[2], Price:r[3]})) },
      Stores: { cols:['StoreID','Store','City','Region'], rows: D.stores.map(r => ({StoreID:r[0], Store:r[1], City:r[2], Region:r[3]})) },
      Calendar: { cols:['Date','Year','MonthNum','Month','Quarter','Weekday'], rows: D.calendar.map(r => ({Date:r[0], Year:r[1], MonthNum:r[2], Month:r[3], Quarter:r[4], Weekday:r[5]})) }
    };
    const rels = [ {from:'Sales', fk:'ProductID', to:'Products', pk:'ProductID'}, {from:'Sales', fk:'StoreID', to:'Stores', pk:'StoreID'}, {from:'Sales', fk:'Date', to:'Calendar', pk:'Date'} ];
    // index lookups
    for(const r of rels){ const idx = new Map(); T[r.to].rows.forEach(x => idx.set(x[r.pk], x)); r.idx = idx; }
    return { T, rels, measures: {} };
  }
  // is a row of table `tn` visible under filters?
  function related(M, tn, row, target){ if(tn === target) return row; const r = M.rels.find(r => r.from === tn && r.to === target); return r ? r.idx.get(row[r.fk]) : undefined; }
  function visible(M, tn, filters){
    return M.T[tn].rows.filter(row => filters.every(f => {
      if(f.table !== tn && !M.rels.find(r => r.from === tn && r.to === f.table)) return true; // filter does not reach this table
      const src = related(M, tn, row, f.table); if(!src) return false; return f.rowPred ? f.rowPred(src) : f.pred(src[f.col]);
    }));
  }

  // ---------- DAX tokenizer / parser ----------
  class DErr extends Error {}
  function tokenize(s){
    const t = []; let i = 0;
    while(i < s.length){
      const c = s[i];
      if(/\s/.test(c)){ i++; continue; }
      let m; const rest = s.slice(i);
      if((m = /^'([^']+)'\[([^\]]+)\]/.exec(rest)) || (m = /^([A-Za-z_][A-Za-z0-9_]*)\[([^\]]+)\]/.exec(rest))){ t.push({k:'col', table:m[1], col:m[2].trim()}); i += m[0].length; continue; }
      if((m = /^\[([^\]]+)\]/.exec(rest))){ t.push({k:'meas', v:m[1].trim()}); i += m[0].length; continue; }
      if((m = /^"((?:[^"]|"")*)"/.exec(rest))){ t.push({k:'str', v:m[1].replace(/""/g,'"')}); i += m[0].length; continue; }
      if((m = /^\d+(\.\d+)?/.exec(rest))){ t.push({k:'num', v:+m[0]}); i += m[0].length; continue; }
      if((m = /^(&&|\|\||<=|>=|<>)/.exec(rest))){ t.push({k:'op', v:m[0]}); i += 2; continue; }
      if((m = /^'([^']+)'/.exec(rest))){ t.push({k:'id', v:m[1]}); i += m[0].length; continue; }
      if((m = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(rest))){ t.push({k:'id', v:m[0]}); i += m[0].length; continue; }
      if('+-*/&=<>(),'.includes(c)){ t.push({k: '(),'.includes(c) ? c : 'op', v:c}); i++; continue; }
      throw new DErr(`I don't understand the character "${c}".`);
    }
    return t;
  }
  function parse(s){
    const t = tokenize(s); let p = 0; const peek = () => t[p], next = () => t[p++];
    const isOp = (...o) => peek() && peek().k === 'op' && o.includes(peek().v);
    function expr(){
      if(peek() && peek().k === 'id' && peek().v.toUpperCase() === 'VAR'){
        const vars = [];
        while(peek() && peek().k === 'id' && peek().v.toUpperCase() === 'VAR'){ next(); const nm = next(); if(!nm || nm.k !== 'id') throw new DErr('VAR needs a name, like VAR total = …'); const eq = next(); if(!eq || eq.v !== '=') throw new DErr('Write VAR name = expression'); vars.push([nm.v, or()]); }
        const r = next(); if(!r || r.k !== 'id' || r.v.toUpperCase() !== 'RETURN') throw new DErr('After your VARs, finish with RETURN …'); return {t:'let', vars, body:expr()};
      }
      return or();
    }
    function or(){ let l = and(); while(isOp('||')){ next(); l = {t:'bin', o:'||', l, r:and()}; } return l; }
    function and(){ let l = cmp(); while(isOp('&&')){ next(); l = {t:'bin', o:'&&', l, r:cmp()}; } return l; }
    function cmp(){ let l = cat(); while(isOp('=','<>','<','>','<=','>=')){ const o = next().v; l = {t:'bin', o, l, r:cat()}; } return l; }
    function cat(){ let l = add(); while(isOp('&')){ next(); l = {t:'bin', o:'&', l, r:add()}; } return l; }
    function add(){ let l = mul(); while(isOp('+','-')){ const o = next().v; l = {t:'bin', o, l, r:mul()}; } return l; }
    function mul(){ let l = un(); while(isOp('*','/')){ const o = next().v; l = {t:'bin', o, l, r:un()}; } return l; }
    function un(){ if(isOp('-')){ next(); return {t:'neg', e:un()}; } return prim(); }
    function prim(){
      const x = next(); if(!x) throw new DErr('The formula ends too early. Check your brackets.');
      if(x.k === 'num') return {t:'lit', v:x.v};
      if(x.k === 'str') return {t:'lit', v:x.v};
      if(x.k === 'col') return {t:'col', table:x.table, col:x.col};
      if(x.k === 'meas') return {t:'meas', v:x.v};
      if(x.k === '('){ const e = expr(); if(!next() || t[p-1].k !== ')') throw new DErr('A closing bracket ) is missing.'); return e; }
      if(x.k === 'id'){
        const u = x.v.toUpperCase();
        if(u === 'TRUE' || u === 'FALSE'){ if(peek() && peek().k === '('){ next(); next(); } return {t:'lit', v:u === 'TRUE'}; }
        if(peek() && peek().k === '('){ next(); const args = []; if(peek() && peek().k === ')'){ next(); return {t:'fn', n:u, args}; }
          while(true){ args.push(expr()); const s2 = next(); if(!s2) throw new DErr('A closing bracket ) is missing.'); if(s2.k === ')') break; if(s2.k !== ',') throw new DErr('Expected a comma or ) between arguments.'); }
          return {t:'fn', n:u, args}; }
        return {t:'table', v:x.v};
      }
      throw new DErr(`Unexpected "${x.v}".`);
    }
    const e = expr(); if(p < t.length) throw new DErr(`Unexpected "${t[p].v || t[p].k}" near the end.`); return e;
  }
  // ---------- DAX evaluator ----------
  function tableName(M, n){ const k = Object.keys(M.T).find(x => x.toLowerCase() === String(n).toLowerCase()); if(!k) throw new DErr(`There is no table called "${n}".`); return k; }
  function colCheck(M, n){ const tn = tableName(M, n.table); const c = M.T[tn].cols.find(x => x.toLowerCase() === n.col.toLowerCase()); if(!c) throw new DErr(`Table ${tn} has no column [${n.col}].`); return [tn, c]; }
  function evalD(M, n, ctx){
    switch(n.t){
      case 'lit': return n.v;
      case 'neg': return -evalD(M, n.e, ctx);
      case 'let': { const vars = Object.assign({}, ctx.vars); const c2 = {...ctx, vars}; for(const [k, e] of n.vars) vars[k.toLowerCase()] = evalD(M, e, c2); return evalD(M, n.body, c2); }
      case 'col': { const [tn, c] = colCheck(M, n); if(!ctx.row) throw new DErr(`A bare column like ${tn}[${c}] needs an aggregation, e.g. SUM(${tn}[${c}]).`);
        const src = ctx.row.table === tn ? ctx.row.data : related(M, ctx.row.table, ctx.row.data, tn); if(!src) throw new DErr(`Can't reach ${tn} from ${ctx.row.table} in this row. Try RELATED().`); return src[c]; }
      case 'meas': { if(ctx.row){ const tc = M.T[ctx.row.table].cols.find(c => c.toLowerCase() === n.v.toLowerCase()); if(tc) return ctx.row.data[tc]; }
        const m = Object.keys(M.measures).find(k => k.toLowerCase() === n.v.toLowerCase()); if(!m) throw new DErr(`There is no measure called [${n.v}].`); if(ctx.depth > 20) throw new DErr('Measures refer to each other in a loop.'); return evalD(M, M.measures[m].ast, {...ctx, row:null, depth:(ctx.depth||0)+1}); }
      case 'table': if(ctx.vars && n.v.toLowerCase() in ctx.vars) return ctx.vars[n.v.toLowerCase()]; throw new DErr(`"${n.v}" isn't a function or value here. Did you mean a column like ${n.v}[Column]?`);
      case 'bin': {
        if(n.o === '&&') return !!evalD(M, n.l, ctx) && !!evalD(M, n.r, ctx);
        if(n.o === '||') return !!evalD(M, n.l, ctx) || !!evalD(M, n.r, ctx);
        const l = evalD(M, n.l, ctx), r = evalD(M, n.r, ctx);
        switch(n.o){ case '+': return (l||0)+(r||0); case '-': return (l||0)-(r||0); case '*': return (l||0)*(r||0); case '/': if(!r) throw new DErr('Division by zero. Use DIVIDE() to handle this safely.'); return l/r; case '&': return `${l ?? ''}${r ?? ''}`;
          case '=': return l == r; case '<>': return l != r; case '<': return l < r; case '>': return l > r; case '<=': return l <= r; case '>=': return l >= r; }
      }
      case 'fn': return callD(M, n, ctx);
    }
  }
  const aggCol = (M, n, ctx, f) => { const a = n.args[0]; if(!a || a.t !== 'col') throw new DErr(`${n.n} needs a column, like ${n.n}(Sales[Revenue]).`); const [tn, c] = colCheck(M, a); return f(visible(M, tn, ctx.filters).map(r => r[c]), tn); };
  const TABLE_FNS = ['FILTER','ALL'];
  function evalTable(M, n, ctx){
    if(n.t === 'table'){ const tn = tableName(M, n.v); return { table:tn, rows: visible(M, tn, ctx.filters), all:false }; }
    if(n.t === 'fn' && n.n === 'ALL' && n.args[0] && n.args[0].t === 'table'){ const tn = tableName(M, n.args[0].v); return { table:tn, rows: M.T[tn].rows.slice(), all:true }; }
    if(n.t === 'fn' && n.n === 'FILTER'){ if(n.args.length < 2) throw new DErr('FILTER needs a table and a condition: FILTER(Sales, Sales[Revenue] > 50)'); const b = evalTable(M, n.args[0], ctx);
      return { table:b.table, all:b.all, rows: b.rows.filter(r => !!evalD(M, n.args[1], {...ctx, row:{table:b.table, data:r}})) }; }
    throw new DErr('Expected a table here, like Sales or FILTER(Sales, …).');
  }
  const isTableExpr = n => n && (n.t === 'table' || (n.t === 'fn' && TABLE_FNS.includes(n.n)));
  const TI = ['SAMEPERIODLASTYEAR','DATEADD','DATESYTD','PREVIOUSMONTH','PREVIOUSYEAR'];
  const shiftDate = (d, n, unit) => { const [y, m, dd] = d.split('-').map(Number); if(unit === 'DAY'){ return new Date(Date.UTC(y, m-1, dd + n)).toISOString().slice(0,10); }
    const mm = unit === 'YEAR' ? m - 1 + 12*n : m - 1 + n; const last = new Date(Date.UTC(y, mm + 1, 0)).getUTCDate(); return new Date(Date.UTC(y, mm, Math.min(dd, last))).toISOString().slice(0,10); };
  // shift by months/years; a month-end date also pulls in the rest of the target month (e.g. Feb 28 2025 → Feb 28–29 2024)
  function shiftAll(cur, n, unit){ const out = new Set(); for(const d of cur){ const t = shiftDate(d, n, unit); out.add(t); const [y, m, dd] = d.split('-').map(Number); const lastSrc = new Date(Date.UTC(y, m, 0)).getUTCDate();
      if(dd === lastSrc){ const [ty, tm, td] = t.split('-').map(Number); const lastT = new Date(Date.UTC(ty, tm, 0)).getUTCDate(); for(let k = td + 1; k <= lastT; k++) out.add(`${t.slice(0,8)}${String(k).padStart(2,'0')}`); } } return [...out]; }
  function timeDates(M, f, ctx){
    const cur = visible(M, 'Calendar', ctx.filters).map(r => r.Date).sort(); if(!cur.length) return [];
    const unitOf = a => { const u = a && (a.t === 'table' ? a.v : a.t === 'lit' ? a.v : '').toString().toUpperCase(); if(!['DAY','MONTH','QUARTER','YEAR'].includes(u)) throw new DErr('DATEADD needs DAY, MONTH, QUARTER or YEAR as the 3rd argument.'); return u; };
    switch(f.n){
      case 'SAMEPERIODLASTYEAR': return shiftAll(cur, -1, 'YEAR');
      case 'DATEADD': { const k = evalD(M, f.args[1], ctx); let u = unitOf(f.args[2]); let n = k; if(u === 'QUARTER'){ u = 'MONTH'; n = 3*k; } return u === 'DAY' ? cur.map(d => shiftDate(d, n, u)) : shiftAll(cur, n, u); }
      case 'DATESYTD': { const max = cur[cur.length-1]; const y = max.slice(0,4); return M.T.Calendar.rows.map(r => r.Date).filter(d => d >= y + '-01-01' && d <= max); }
      case 'PREVIOUSMONTH': { const first = shiftDate(cur[0].slice(0,8) + '01', -1, 'MONTH'); const ym = first.slice(0,7); return M.T.Calendar.rows.map(r => r.Date).filter(d => d.startsWith(ym)); }
      case 'PREVIOUSYEAR': { const y = String(+cur[0].slice(0,4) - 1); return M.T.Calendar.rows.map(r => r.Date).filter(d => d.startsWith(y)); }
    }
  }
  function callD(M, n, ctx){
    const A = n.args, need = k => { if(A.length < k) throw new DErr(`${n.n} needs ${k} argument${k>1?'s':''}.`); };
    switch(n.n){
      case 'SUM': need(1); return aggCol(M, n, ctx, v => v.reduce((s,x) => s + (+x||0), 0));
      case 'AVERAGE': need(1); return aggCol(M, n, ctx, v => v.length ? v.reduce((s,x)=>s+(+x||0),0)/v.length : null);
      case 'MIN': need(1); return aggCol(M, n, ctx, v => v.length ? Math.min(...v) : null);
      case 'MAX': need(1); return aggCol(M, n, ctx, v => v.length ? Math.max(...v) : null);
      case 'COUNT': need(1); return aggCol(M, n, ctx, v => v.filter(x => x !== null && x !== '').length);
      case 'DISTINCTCOUNT': need(1); return aggCol(M, n, ctx, v => new Set(v).size);
      case 'COUNTROWS': { need(1); if(!isTableExpr(A[0])) throw new DErr('COUNTROWS needs a table, like COUNTROWS(Sales).'); return evalTable(M, A[0], ctx).rows.length; }
      case 'YEAR': need(1); return +String(evalD(M, A[0], ctx)).slice(0,4);
      case 'MONTH': need(1); return +String(evalD(M, A[0], ctx)).slice(5,7);
      case 'TOTALYTD': { need(2); return callD(M, {t:'fn', n:'CALCULATE', args:[A[0], {t:'fn', n:'DATESYTD', args:[A[1]]}]}, ctx); }
      case 'DIVIDE': { need(2); const a = evalD(M, A[0], ctx), b = evalD(M, A[1], ctx); if(!b) return A[2] ? evalD(M, A[2], ctx) : null; return a / b; }
      case 'IF': { need(2); return evalD(M, A[0], ctx) ? evalD(M, A[1], ctx) : (A[2] ? evalD(M, A[2], ctx) : null); }
      case 'ROUND': need(2); { const f = Math.pow(10, evalD(M, A[1], ctx)); return Math.round(evalD(M, A[0], ctx) * f) / f; }
      case 'RELATED': { need(1); if(A[0].t !== 'col') throw new DErr('RELATED needs a column, like RELATED(Products[Price]).'); return evalD(M, A[0], ctx); }
      case 'BLANK': return null;
      case 'SUMX': case 'AVERAGEX': case 'MAXX': case 'MINX': {
        need(2); if(!isTableExpr(A[0])) throw new DErr(`${n.n} needs a table first, like ${n.n}(Sales, Sales[Qty] * RELATED(Products[Price])).`);
        const TB = evalTable(M, A[0], ctx), tn = TB.table; const vals = TB.rows.map(r => +evalD(M, A[1], {...ctx, row:{table:tn, data:r}}) || 0);
        if(n.n === 'SUMX') return vals.reduce((s,x)=>s+x,0); if(!vals.length) return null;
        if(n.n === 'AVERAGEX') return vals.reduce((s,x)=>s+x,0)/vals.length; return n.n === 'MAXX' ? Math.max(...vals) : Math.min(...vals);
      }
      case 'CALCULATE': {
        need(1); let filters = ctx.filters.slice();
        for(const f of A.slice(1)){
          if(f.t === 'fn' && TI.includes(f.n)){ const ds = new Set(timeDates(M, f, {...ctx, filters})); filters = filters.filter(q => q.table !== 'Calendar'); filters.push({table:'Calendar', col:'Date', pred: d => ds.has(d)}); continue; }
          if(f.t === 'fn' && f.n === 'FILTER'){ const TB = evalTable(M, f, {...ctx, filters}); const set = new Set(TB.rows); if(TB.all) filters = filters.filter(q => q.table !== TB.table); filters.push({table:TB.table, rowPred: r => set.has(r)}); continue; }
          if(f.t === 'fn' && (f.n === 'ALL' || f.n === 'REMOVEFILTERS')){
            const x = f.args[0]; if(!x) { filters = []; continue; }
            if(x.t === 'table'){ const tn = tableName(M, x.v); filters = filters.filter(q => q.table !== tn); }
            else if(x.t === 'col'){ const [tn, c] = colCheck(M, x); filters = filters.filter(q => !(q.table === tn && q.col === c)); }
            continue;
          }
          // boolean filter on one column: Table[Col] op value
          const cols = []; (function walk(z){ if(!z) return; if(z.t === 'col') cols.push(z); if(z.l) walk(z.l); if(z.r) walk(z.r); if(z.e) walk(z.e); (z.args||[]).forEach(walk); })(f);
          if(!cols.length) throw new DErr('Each CALCULATE filter must test a column, e.g. Stores[Region] = "West".');
          const [tn, c] = colCheck(M, cols[0]);
          if(cols.some(k => colCheck(M, k).join() !== [tn, c].join())) throw new DErr('A simple CALCULATE filter can only test one column.');
          filters = filters.filter(q => !(q.table === tn && q.col === c));
          filters.push({ table:tn, col:c, pred: v => !!evalD(M, f, {...ctx, row:{table:tn, data:{[c]:v}}, filters:[]}) });
        }
        return evalD(M, A[0], {...ctx, filters, row:null});
      }
    }
    throw new DErr(`${n.n} isn't supported in this practice lab (it may exist in real Power BI!).`);
  }
  function defineMeasure(M, text){
    const m = /^\s*([^=]+?)\s*=\s*([\s\S]+)$/.exec(text); if(!m) throw new DErr('Write it as: Measure Name = EXPRESSION');
    const name = m[1].replace(/^\[|\]$/g, '').trim(); if(!/^[A-Za-z][\w %]*$/.test(name)) throw new DErr('Measure names should start with a letter.');
    const ast = parse(m[2]); return { name, ast, text };
  }
  function calcColumn(M, tn, text){ const m = /^\s*(?:'?([A-Za-z]+)'?\s*\[\s*([^\]]+)\]|([A-Za-z][\w ]*?))\s*=\s*([\s\S]+)$/.exec(text); if(!m) throw new DErr('Write it as: ColumnName = EXPRESSION');
    const name = (m[2] || m[3]).trim(); const ast = parse(m[4]); const vals = M.T[tn].rows.map(r => evalD(M, ast, {filters:[], row:{table:tn, data:r}, depth:0})); return { name, vals, ast }; }
  function rowFilter(M, tn, text){ const ast = parse(text); return new Set(M.T[tn].rows.filter(r => !!evalD(M, ast, {filters:[], row:{table:tn, data:r}, depth:0}))); }
  function evalMeasure(M, ast, filters = []){ return evalD(M, ast, {filters, row:null, depth:0}); }
  // group values of a column under filters (for visuals)
  function groupBy(M, tn, col, astOrName, filters = []){
    const ast = typeof astOrName === 'string' ? M.measures[astOrName].ast : astOrName;
    let keys = [...new Set(M.T[tn].rows.map(r => r[col]))];
    if(tn === 'Calendar' && col === 'Month'){ const order = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; keys.sort((a,b) => order.indexOf(a) - order.indexOf(b)); } else keys.sort((a,b) => a < b ? -1 : a > b ? 1 : 0);
    return keys.map(k => ({ key:k, value: evalMeasure(M, ast, filters.filter(f => !(f.table === tn && f.col === col)).concat([{table:tn, col, pred:v => v === k}])) }));
  }

  // ---------- Power Query step engine ----------
  const PQ = {
    apply(rows, cols, step){
      let R = rows.map(r => ({...r})), C = cols.map(c => ({...c}));
      const ci = C.findIndex(c => c.name === step.col);
      switch(step.op){
        case 'removeBlank': R = R.filter(r => C.some(c => String(r[c.name] ?? '').trim() !== '')); break;
        case 'removeDup': { const seen = new Set(); R = R.filter(r => { const k = JSON.stringify(C.map(c => r[c.name])); if(seen.has(k)) return false; seen.add(k); return true; }); break; }
        case 'trim': R.forEach(r => { r[step.col] = String(r[step.col] ?? '').trim().replace(/\s+/g, ' '); }); break;
        case 'proper': R.forEach(r => { r[step.col] = String(r[step.col] ?? '').toLowerCase().replace(/(^|\s)([a-z])/g, (m,p,c) => p + c.toUpperCase()); }); break;
        case 'upper': R.forEach(r => { r[step.col] = String(r[step.col] ?? '').toUpperCase(); }); break;
        case 'replace': R.forEach(r => { r[step.col] = String(r[step.col] ?? '').split(step.find).join(step.with); }); break;
        case 'type': {
          R.forEach(r => { const v = r[step.col];
            if(step.to === 'number'){ const n = Number(String(v).replace(/[$,\s]/g, '')); r[step.col] = isNaN(n) || String(v).trim() === '' ? 'Error' : n; }
            else if(step.to === 'date'){ r[step.col] = /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? String(v) : 'Error'; }
            else r[step.col] = String(v ?? ''); });
          C[ci].type = step.to; break; }
        case 'split': {
          const base = step.col, a = base + '.1', b = base + '.2';
          R.forEach(r => { const parts = String(r[base] ?? '').split(step.delim); r[a] = (parts[0] ?? '').trim(); r[b] = parts.slice(1).join(step.delim).trim(); delete r[base]; });
          C.splice(ci, 1, {name:a, type:'text'}, {name:b, type:'text'}); break; }
        case 'unpivot': { const keep = step.keep; const other = C.filter(c => !keep.includes(c.name)); const out = [];
          R.forEach(r => other.forEach(c => { const o = {}; keep.forEach(k => o[k] = r[k]); o.Attribute = c.name; o.Value = r[c.name]; out.push(o); }));
          R = out; C = C.filter(c => keep.includes(c.name)).concat([{name:'Attribute', type:'text'}, {name:'Value', type:other[0] ? other[0].type : 'number'}]); break; }
        case 'append': { const extra = step.data.rows.map(row => Object.fromEntries(step.data.cols.map((c, i) => [c, row[i]]))); R = R.concat(extra); break; }
        case 'merge': { const lk = new Map(step.data.rows.map(row => [row[step.data.cols.indexOf(step.key)], row[step.data.cols.indexOf(step.take)]]));
          R.forEach(r => { r[step.take] = lk.has(r[step.key]) ? lk.get(r[step.key]) : null; }); C.push({name:step.take, type:'text'}); break; }
        case 'group': { const m = new Map(); R.forEach(r => m.set(r[step.col], (m.get(r[step.col]) || 0) + (+r[step.agg] || 0)));
          R = [...m.entries()].map(([k, v]) => ({[step.col]:k, Total:v})); C = [{name:step.col, type:'text'}, {name:'Total', type:'number'}]; break; }
        case 'rename': { R.forEach(r => { r[step.to] = r[step.col]; delete r[step.col]; }); C[ci].name = step.to; break; }
      }
      return { rows:R, cols:C };
    },
    run(start, steps){ let s = { rows:start.rows, cols:start.cols }; for(const st of steps) s = PQ.apply(s.rows, s.cols, st); return s; }
  };
  return { buildModel, visible, parse, evalMeasure, defineMeasure, groupBy, calcColumn, rowFilter, PQ, DErr };
})();
if(typeof module !== 'undefined') module.exports = PBI;
