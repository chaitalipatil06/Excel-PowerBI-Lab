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
      const src = related(M, tn, row, f.table); if(!src) return false; return f.pred(src[f.col]);
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
      if(x.k === '('){ const e = or(); if(!next() || t[p-1].k !== ')') throw new DErr('A closing bracket ) is missing.'); return e; }
      if(x.k === 'id'){
        const u = x.v.toUpperCase();
        if(u === 'TRUE' || u === 'FALSE'){ if(peek() && peek().k === '('){ next(); next(); } return {t:'lit', v:u === 'TRUE'}; }
        if(peek() && peek().k === '('){ next(); const args = []; if(peek() && peek().k === ')'){ next(); return {t:'fn', n:u, args}; }
          while(true){ args.push(or()); const s2 = next(); if(!s2) throw new DErr('A closing bracket ) is missing.'); if(s2.k === ')') break; if(s2.k !== ',') throw new DErr('Expected a comma or ) between arguments.'); }
          return {t:'fn', n:u, args}; }
        return {t:'table', v:x.v};
      }
      throw new DErr(`Unexpected "${x.v}".`);
    }
    const e = or(); if(p < t.length) throw new DErr(`Unexpected "${t[p].v || t[p].k}" near the end.`); return e;
  }
  // ---------- DAX evaluator ----------
  function tableName(M, n){ const k = Object.keys(M.T).find(x => x.toLowerCase() === String(n).toLowerCase()); if(!k) throw new DErr(`There is no table called "${n}".`); return k; }
  function colCheck(M, n){ const tn = tableName(M, n.table); const c = M.T[tn].cols.find(x => x.toLowerCase() === n.col.toLowerCase()); if(!c) throw new DErr(`Table ${tn} has no column [${n.col}].`); return [tn, c]; }
  function evalD(M, n, ctx){
    switch(n.t){
      case 'lit': return n.v;
      case 'neg': return -evalD(M, n.e, ctx);
      case 'col': { const [tn, c] = colCheck(M, n); if(!ctx.row) throw new DErr(`A bare column like ${tn}[${c}] needs an aggregation, e.g. SUM(${tn}[${c}]).`);
        const src = ctx.row.table === tn ? ctx.row.data : related(M, ctx.row.table, ctx.row.data, tn); if(!src) throw new DErr(`Can't reach ${tn} from ${ctx.row.table} in this row. Try RELATED().`); return src[c]; }
      case 'meas': { const m = Object.keys(M.measures).find(k => k.toLowerCase() === n.v.toLowerCase()); if(!m) throw new DErr(`There is no measure called [${n.v}].`); if(ctx.depth > 20) throw new DErr('Measures refer to each other in a loop.'); return evalD(M, M.measures[m].ast, {...ctx, row:null, depth:(ctx.depth||0)+1}); }
      case 'table': throw new DErr(`"${n.v}" isn't a function or value here. Did you mean a column like ${n.v}[Column]?`);
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
  function callD(M, n, ctx){
    const A = n.args, need = k => { if(A.length < k) throw new DErr(`${n.n} needs ${k} argument${k>1?'s':''}.`); };
    switch(n.n){
      case 'SUM': need(1); return aggCol(M, n, ctx, v => v.reduce((s,x) => s + (+x||0), 0));
      case 'AVERAGE': need(1); return aggCol(M, n, ctx, v => v.length ? v.reduce((s,x)=>s+(+x||0),0)/v.length : null);
      case 'MIN': need(1); return aggCol(M, n, ctx, v => v.length ? Math.min(...v) : null);
      case 'MAX': need(1); return aggCol(M, n, ctx, v => v.length ? Math.max(...v) : null);
      case 'COUNT': need(1); return aggCol(M, n, ctx, v => v.filter(x => x !== null && x !== '').length);
      case 'DISTINCTCOUNT': need(1); return aggCol(M, n, ctx, v => new Set(v).size);
      case 'COUNTROWS': { need(1); if(A[0].t !== 'table') throw new DErr('COUNTROWS needs a table, like COUNTROWS(Sales).'); return visible(M, tableName(M, A[0].v), ctx.filters).length; }
      case 'DIVIDE': { need(2); const a = evalD(M, A[0], ctx), b = evalD(M, A[1], ctx); if(!b) return A[2] ? evalD(M, A[2], ctx) : null; return a / b; }
      case 'IF': { need(2); return evalD(M, A[0], ctx) ? evalD(M, A[1], ctx) : (A[2] ? evalD(M, A[2], ctx) : null); }
      case 'ROUND': need(2); { const f = Math.pow(10, evalD(M, A[1], ctx)); return Math.round(evalD(M, A[0], ctx) * f) / f; }
      case 'RELATED': { need(1); if(A[0].t !== 'col') throw new DErr('RELATED needs a column, like RELATED(Products[Price]).'); return evalD(M, A[0], ctx); }
      case 'BLANK': return null;
      case 'SUMX': case 'AVERAGEX': case 'MAXX': case 'MINX': {
        need(2); if(A[0].t !== 'table') throw new DErr(`${n.n} needs a table first, like ${n.n}(Sales, Sales[Qty] * RELATED(Products[Price])).`);
        const tn = tableName(M, A[0].v); const vals = visible(M, tn, ctx.filters).map(r => +evalD(M, A[1], {...ctx, row:{table:tn, data:r}}) || 0);
        if(n.n === 'SUMX') return vals.reduce((s,x)=>s+x,0); if(!vals.length) return null;
        if(n.n === 'AVERAGEX') return vals.reduce((s,x)=>s+x,0)/vals.length; return n.n === 'MAXX' ? Math.max(...vals) : Math.min(...vals);
      }
      case 'CALCULATE': {
        need(1); let filters = ctx.filters.slice();
        for(const f of A.slice(1)){
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
        case 'rename': { R.forEach(r => { r[step.to] = r[step.col]; delete r[step.col]; }); C[ci].name = step.to; break; }
      }
      return { rows:R, cols:C };
    },
    run(start, steps){ let s = { rows:start.rows, cols:start.cols }; for(const st of steps) s = PQ.apply(s.rows, s.cols, st); return s; }
  };
  return { buildModel, visible, parse, evalMeasure, defineMeasure, groupBy, PQ, DErr };
})();
if(typeof module !== 'undefined') module.exports = PBI;
