// ===== Mini spreadsheet engine (a practical subset of Excel) =====
const XL = (() => {
  const ERR = { NAME:'#NAME?', DIV:'#DIV/0!', NA:'#N/A', VAL:'#VALUE!', REF:'#REF!', CIRC:'#CIRC!' };
  const isErr = v => typeof v === 'string' && v[0] === '#' && Object.values(ERR).includes(v);
  class XErr extends Error { constructor(code){ super(code); this.code = code; } }
  const colToNum = c => c.split('').reduce((n, ch) => n*26 + ch.charCodeAt(0) - 64, 0);
  const numToCol = n => { let s = ''; while(n > 0){ const m = (n-1) % 26; s = String.fromCharCode(65+m) + s; n = Math.floor((n-1)/26); } return s; };
  const parseRef = r => { const m = /^\$?([A-Z]+)\$?(\d+)$/.exec(r.toUpperCase()); return m ? { c: colToNum(m[1]), r: +m[2] } : null; };
  const addr = (c, r) => numToCol(c) + r;

  // ---- tokenizer ----
  function tokenize(src){
    const t = []; let i = 0;
    while(i < src.length){
      const ch = src[i];
      if(/\s/.test(ch)){ i++; continue; }
      if(ch === '"'){ let j = i+1, s = ''; while(j < src.length){ if(src[j] === '"'){ if(src[j+1] === '"'){ s += '"'; j += 2; continue; } break; } s += src[j++]; } if(j >= src.length) throw new XErr(ERR.VAL); t.push({k:'str', v:s}); i = j+1; continue; }
      let m;
      if((m = /^\$?[A-Za-z]{1,3}\$?\d+(:\$?[A-Za-z]{1,3}\$?\d+)?/.exec(src.slice(i))) && !/^[A-Za-z]+\(/.test(src.slice(i))){ t.push({k: m[1] ? 'range' : 'ref', v: m[0].toUpperCase()}); i += m[0].length; continue; }
      if((m = /^\d+(\.\d+)?%?/.exec(src.slice(i)))){ let v = parseFloat(m[0]); if(m[0].endsWith('%')) v /= 100; t.push({k:'num', v}); i += m[0].length; continue; }
      if((m = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(src.slice(i)))){ const u = m[0].toUpperCase(); if(u === 'TRUE' || u === 'FALSE') t.push({k:'bool', v: u === 'TRUE'}); else t.push({k:'name', v:u}); i += m[0].length; continue; }
      if((m = /^(<=|>=|<>)/.exec(src.slice(i)))){ t.push({k:'op', v:m[0]}); i += 2; continue; }
      if('+-*/^&=<>(),:'.includes(ch)){ t.push({k: ch === '(' || ch === ')' || ch === ',' ? ch : 'op', v: ch}); i++; continue; }
      if(ch === ';'){ t.push({k:',', v:','}); i++; continue; }
      throw new XErr(ERR.NAME);
    }
    return t;
  }
  // ---- parser (precedence: comparison < & < +- < */ < ^ < unary) ----
  function parse(src){
    const t = tokenize(src); let p = 0;
    const peek = () => t[p], next = () => t[p++];
    const expect = k => { const x = next(); if(!x || x.k !== k) throw new XErr(ERR.VAL); return x; };
    function cmp(){ let l = cat(); while(peek() && peek().k === 'op' && ['=','<>','<','>','<=','>='].includes(peek().v)){ const o = next().v; l = {t:'bin', o, l, r:cat()}; } return l; }
    function cat(){ let l = add(); while(peek() && peek().k === 'op' && peek().v === '&'){ next(); l = {t:'bin', o:'&', l, r:add()}; } return l; }
    function add(){ let l = mul(); while(peek() && peek().k === 'op' && '+-'.includes(peek().v)){ const o = next().v; l = {t:'bin', o, l, r:mul()}; } return l; }
    function mul(){ let l = pow(); while(peek() && peek().k === 'op' && '*/'.includes(peek().v)){ const o = next().v; l = {t:'bin', o, l, r:pow()}; } return l; }
    function pow(){ let l = un(); while(peek() && peek().k === 'op' && peek().v === '^'){ next(); l = {t:'bin', o:'^', l, r:un()}; } return l; }
    function un(){ if(peek() && peek().k === 'op' && (peek().v === '-' || peek().v === '+')){ const o = next().v; const e = un(); return o === '-' ? {t:'neg', e} : e; } return prim(); }
    function prim(){
      const x = next(); if(!x) throw new XErr(ERR.VAL);
      if(x.k === 'num') return {t:'num', v:x.v};
      if(x.k === 'str') return {t:'str', v:x.v};
      if(x.k === 'bool') return {t:'bool', v:x.v};
      if(x.k === 'ref') return {t:'ref', v:x.v};
      if(x.k === 'range') return {t:'range', v:x.v};
      if(x.k === '('){ const e = cmp(); expect(')'); return e; }
      if(x.k === 'name'){
        if(peek() && peek().k === '('){ next(); const args = []; if(peek() && peek().k === ')'){ next(); return {t:'fn', n:x.v, args}; }
          while(true){ if(peek() && (peek().k === ',' || peek().k === ')')) args.push({t:'blank'}); else args.push(cmp()); const s = next(); if(!s) throw new XErr(ERR.VAL); if(s.k === ')') break; if(s.k !== ',') throw new XErr(ERR.VAL); }
          return {t:'fn', n:x.v, args}; }
        throw new XErr(ERR.NAME);
      }
      throw new XErr(ERR.VAL);
    }
    const e = cmp(); if(p < t.length) throw new XErr(ERR.VAL); return e;
  }

  // ---- values ----
  const num = v => { if(v === '' || v === null || v === undefined) return 0; if(typeof v === 'boolean') return v ? 1 : 0; if(typeof v === 'number') return v; if(isErr(v)) throw new XErr(v); const n = Number(v); if(isNaN(n)) throw new XErr(ERR.VAL); return n; };
  const str = v => { if(v === null || v === undefined) return ''; if(typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'; if(isErr(v)) throw new XErr(v); if(typeof v === 'number') return String(+v.toFixed(10)); return String(v); };
  const bool = v => { if(typeof v === 'boolean') return v; if(typeof v === 'number') return v !== 0; if(v === '' || v == null) return false; const u = String(v).toUpperCase(); if(u === 'TRUE') return true; if(u === 'FALSE') return false; throw new XErr(ERR.VAL); };
  const flat = a => a.flat(Infinity);
  const isRange = v => Array.isArray(v);
  const nums = a => { const out = []; for(const x of a){ if(isRange(x)){ for(const v of flat(x)){ if(isErr(v)) throw new XErr(v); if(typeof v === 'number') out.push(v); } } else if(x !== undefined){ out.push(num(x)); } } return out; };
  function matchCrit(v, crit){
    let c = crit, op = '=';
    if(typeof c === 'string'){ const m = /^(<=|>=|<>|=|<|>)(.*)$/.exec(c); if(m){ op = m[1]; c = m[2]; } }
    const cn = Number(c), vn = typeof v === 'number' ? v : Number(v);
    const numeric = c !== '' && !isNaN(cn) && v !== '' && v !== null && !isNaN(vn);
    if(numeric){ return {'=':vn===cn,'<>':vn!==cn,'<':vn<cn,'>':vn>cn,'<=':vn<=cn,'>=':vn>=cn}[op]; }
    const a = str(v ?? '').toLowerCase(), b = String(c).toLowerCase();
    if(op === '=' || op === '<>'){ const re = new RegExp('^' + b.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$'); const r = re.test(a); return op === '=' ? r : !r; }
    return {'<':a<b,'>':a>b,'<=':a<=b,'>=':a>=b}[op];
  }
  const ymd = v => { if(typeof v === 'number'){ const d = new Date(Date.UTC(1899,11,30) + v*864e5); return [d.getUTCFullYear(), d.getUTCMonth()+1, d.getUTCDate()]; } const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str(v)); if(!m) throw new XErr(ERR.VAL); return [+m[1], +m[2], +m[3]]; };

  const FN = {
    SUM: a => nums(a).reduce((s, v) => s + v, 0),
    AVERAGE: a => { const n = nums(a); if(!n.length) throw new XErr(ERR.DIV); return n.reduce((s,v)=>s+v,0)/n.length; },
    MIN: a => { const n = nums(a); return n.length ? Math.min(...n) : 0; },
    MAX: a => { const n = nums(a); return n.length ? Math.max(...n) : 0; },
    COUNT: a => flat(a).filter(v => typeof v === 'number').length,
    COUNTA: a => flat(a).filter(v => v !== '' && v !== null && v !== undefined).length,
    COUNTBLANK: a => flat(a).filter(v => v === '' || v === null || v === undefined).length,
    ROUND: a => { const f = Math.pow(10, num(a[1] ?? 0)); return Math.round(num(a[0]) * f + Math.sign(num(a[0]))*1e-9) / f; },
    ROUNDUP: a => { const f = Math.pow(10, num(a[1] ?? 0)); return Math.ceil(num(a[0]) * f - 1e-9) / f; },
    ROUNDDOWN: a => { const f = Math.pow(10, num(a[1] ?? 0)); return Math.floor(num(a[0]) * f + 1e-9) / f; },
    ABS: a => Math.abs(num(a[0])),
    IF: null, IFERROR: null, IFS: null, AND: null, OR: null, // lazy, handled in evaluator
    NOT: a => !bool(a[0]),
    SUMIF: a => { const r = flat(a[0]), s = a[2] !== undefined ? flat(a[2]) : r; return r.reduce((t, v, i) => t + (matchCrit(v, a[1]) && typeof s[i] === 'number' ? s[i] : 0), 0); },
    COUNTIF: a => flat(a[0]).filter(v => matchCrit(v, a[1])).length,
    AVERAGEIF: a => { const r = flat(a[0]), s = a[2] !== undefined ? flat(a[2]) : r; const n = r.map((v, i) => matchCrit(v, a[1]) && typeof s[i] === 'number' ? s[i] : null).filter(x => x !== null); if(!n.length) throw new XErr(ERR.DIV); return n.reduce((x,y)=>x+y,0)/n.length; },
    SUMIFS: a => { const s = flat(a[0]); return s.reduce((t, v, i) => { for(let k=1;k<a.length;k+=2){ if(!matchCrit(flat(a[k])[i], a[k+1])) return t; } return t + (typeof v === 'number' ? v : 0); }, 0); },
    COUNTIFS: a => { const n = flat(a[0]).length; let c = 0; for(let i=0;i<n;i++){ let ok = true; for(let k=0;k<a.length;k+=2) if(!matchCrit(flat(a[k])[i], a[k+1])) ok = false; if(ok) c++; } return c; },
    VLOOKUP: a => { const tbl = a[1], col = num(a[2]), approx = a[3] === undefined ? true : bool(a[3]); if(col < 1 || col > tbl[0].length) throw new XErr(ERR.REF);
      if(!approx){ const row = tbl.find(r => matchCrit(r[0], typeof a[0] === 'number' ? a[0] : '=' + str(a[0]))); if(!row) throw new XErr(ERR.NA); return row[col-1]; }
      let best = null; for(const r of tbl){ if(typeof r[0] === typeof a[0] && r[0] <= a[0]) best = r; } if(!best) throw new XErr(ERR.NA); return best[col-1]; },
    XLOOKUP: a => { const look = flat(a[1]), ret = a[2]; const i = look.findIndex(v => matchCrit(v, typeof a[0] === 'number' ? a[0] : '=' + str(a[0]))); if(i < 0){ if(a[3] !== undefined) return a[3]; throw new XErr(ERR.NA); } const r = flat(ret); return r[i]; },
    MATCH: a => { const look = flat(a[1]); const type = a[2] === undefined ? 1 : num(a[2]); if(type === 0){ const i = look.findIndex(v => matchCrit(v, typeof a[0] === 'number' ? a[0] : '=' + str(a[0]))); if(i < 0) throw new XErr(ERR.NA); return i+1; } let best = -1; look.forEach((v, i) => { if(v <= a[0]) best = i; }); if(best < 0) throw new XErr(ERR.NA); return best+1; },
    INDEX: a => { const t = a[0], r = num(a[1] ?? 1), c = num(a[2] ?? 1); const rows = t.length, cols = t[0].length; let rr = r, cc = c; if(rows === 1 && a[2] === undefined){ rr = 1; cc = r; } if(rr < 1 || rr > rows || cc < 1 || cc > cols) throw new XErr(ERR.REF); return t[rr-1][cc-1]; },
    LEFT: a => str(a[0]).slice(0, a[1] === undefined ? 1 : num(a[1])),
    RIGHT: a => { const s = str(a[0]), n = a[1] === undefined ? 1 : num(a[1]); return n ? s.slice(-n) : ''; },
    MID: a => str(a[0]).substr(num(a[1]) - 1, num(a[2])),
    LEN: a => str(a[0]).length,
    TRIM: a => str(a[0]).trim().replace(/\s+/g, ' '),
    UPPER: a => str(a[0]).toUpperCase(), LOWER: a => str(a[0]).toLowerCase(),
    PROPER: a => str(a[0]).toLowerCase().replace(/(^|[^a-z])([a-z])/g, (m, p, c) => p + c.toUpperCase()),
    CONCAT: a => flat(a).map(str).join(''), CONCATENATE: a => flat(a).map(str).join(''),
    TEXTJOIN: a => flat(a.slice(2)).filter(v => !(bool(a[1]) && (v === '' || v == null))).map(str).join(str(a[0])),
    YEAR: a => ymd(a[0])[0], MONTH: a => ymd(a[0])[1], DAY: a => ymd(a[0])[2],
    UNIQUE: a => [...new Set(flat(a[0]))].length, // simplified: returns the count (spills not supported)
  };
  const LAZY = new Set(['IF','IFERROR','IFS','AND','OR']);

  // ---- sheet ----
  class Sheet {
    constructor(cells = {}, opts = {}){ this.raw = {}; this.cols = opts.cols || 8; this.rows = opts.rows || 12; for(const k in cells) this.raw[k.toUpperCase()] = cells[k]; this.recalc(); }
    get(a){ return this.raw[a] ?? ''; }
    set(a, v){ a = a.toUpperCase(); if(v === '' || v === null) delete this.raw[a]; else this.raw[a] = v; this.recalc(); }
    recalc(){ this.vals = {}; this.stack = new Set(); for(const a in this.raw) this.value(a); }
    value(a){
      if(a in this.vals) return this.vals[a];
      const raw = this.raw[a];
      if(raw === undefined) return '';
      if(typeof raw === 'string' && raw.startsWith('=')){
        if(this.stack.has(a)) return ERR.CIRC;
        this.stack.add(a); let v;
        try{ v = this.evalNode(parse(raw.slice(1))); if(isRange(v)) v = v[0][0]; if(v === undefined || v === null) v = 0; if(v === '') v = 0; if(typeof v === 'number' && !isFinite(v)) v = ERR.DIV; }
        catch(e){ v = e instanceof XErr ? e.code : ERR.VAL; }
        this.stack.delete(a); this.vals[a] = v; return v;
      }
      let v = raw; if(typeof raw === 'string' && raw.trim() !== '' && !isNaN(+raw) && !/^0\d/.test(raw)) v = +raw;
      this.vals[a] = v; return v;
    }
    range(r){ const [s, e] = r.split(':').map(parseRef); if(!s || !e) throw new XErr(ERR.REF); const out = []; for(let rr = Math.min(s.r,e.r); rr <= Math.max(s.r,e.r); rr++){ const row = []; for(let cc = Math.min(s.c,e.c); cc <= Math.max(s.c,e.c); cc++){ const v = this.value(addr(cc, rr)); row.push(v); } out.push(row); } return out; }
    evalNode(n){
      switch(n.t){
        case 'num': case 'str': case 'bool': return n.v;
        case 'blank': return undefined;
        case 'ref': { const p = parseRef(n.v); const v = this.value(addr(p.c, p.r)); if(isErr(v)) throw new XErr(v); return v; }
        case 'range': return this.range(n.v);
        case 'neg': return -num(this.scalar(n.e));
        case 'bin': {
          const l = this.scalar(n.l), r = this.scalar(n.r);
          switch(n.o){
            case '+': return num(l) + num(r); case '-': return num(l) - num(r); case '*': return num(l) * num(r);
            case '/': { const d = num(r); if(d === 0) throw new XErr(ERR.DIV); return num(l) / d; }
            case '^': return Math.pow(num(l), num(r)); case '&': return str(l) + str(r);
            default: { const cmpv = (typeof l === 'number' && typeof r === 'number') ? l - r : (str(l).toLowerCase() < str(r).toLowerCase() ? -1 : str(l).toLowerCase() > str(r).toLowerCase() ? 1 : 0);
              return {'=':cmpv===0,'<>':cmpv!==0,'<':cmpv<0,'>':cmpv>0,'<=':cmpv<=0,'>=':cmpv>=0}[n.o]; }
          }
        }
        case 'fn': {
          if(LAZY.has(n.n)){
            const A = n.args;
            if(n.n === 'IF'){ const c = bool(this.scalar(A[0])); const b = c ? A[1] : A[2]; if(!b || b.t === 'blank') return c ? 0 : false; return this.scalar(b); }
            if(n.n === 'IFERROR'){ try{ const v = this.scalar(A[0]); if(isErr(v)) throw new XErr(v); return v; }catch(e){ if(e instanceof XErr) return this.scalar(A[1]); throw e; } }
            if(n.n === 'IFS'){ for(let i=0;i<A.length;i+=2){ if(bool(this.scalar(A[i]))) return this.scalar(A[i+1]); } throw new XErr(ERR.NA); }
            if(n.n === 'AND') return A.every(x => flat([this.evalNode(x)]).every(bool));
            if(n.n === 'OR') return A.some(x => flat([this.evalNode(x)]).some(bool));
          }
          const f = FN[n.n]; if(!f) throw new XErr(ERR.NAME);
          const args = n.args.map(x => x.t === 'blank' ? undefined : this.evalNode(x));
          return f(args);
        }
      }
      throw new XErr(ERR.VAL);
    }
    scalar(n){ const v = this.evalNode(n); if(isRange(v)){ if(v.length === 1 && v[0].length === 1) return v[0][0]; throw new XErr(ERR.VAL); } return v; }
    formulaOf(a){ const r = this.raw[a.toUpperCase()]; return typeof r === 'string' && r.startsWith('=') ? r : ''; }
  }
  // shift relative refs in a formula (fill down/right)
  function shift(formula, dr, dc){
    let out = '', inStr = false;
    const re = /(\$?)([A-Z]{1,3})(\$?)(\d+)(?![A-Z0-9(])/gi;
    const parts = formula.split('"');
    return parts.map((seg, i) => i % 2 ? seg : seg.replace(re, (m, cd, col, rd, row, off, whole) => {
      const prev = whole[off-1]; if(prev && /[A-Za-z_]/.test(prev)) return m;
      const c = cd ? col.toUpperCase() : numToCol(colToNum(col.toUpperCase()) + dc), r = rd ? row : String(+row + dr);
      if(+r < 1 || colToNum(c) < 1) return '#REF!'; return cd + c + rd + r; })).join('"');
  }
  function fmt(v){
    if(v === '' || v === undefined || v === null) return '';
    if(typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    if(typeof v === 'number'){ if(Number.isInteger(v)) return v.toLocaleString('en-US'); return (+v.toFixed(4)).toLocaleString('en-US', {maximumFractionDigits:4}); }
    return String(v);
  }
  return { Sheet, shift, fmt, parseRef, addr, colToNum, numToCol, isErr, ERR };
})();
if(typeof module !== 'undefined') module.exports = XL;
