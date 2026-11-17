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
        return {t:'name', v:x.v};
      }
      throw new XErr(ERR.VAL);
    }
    const e = cmp(); if(p < t.length) throw new XErr(ERR.VAL); return e;
  }

  // ---- dates: ISO text <-> Excel serial ----
  const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
  const isoToSerial = s => { const m = ISO.exec(s); return Math.round((Date.UTC(+m[1], +m[2]-1, +m[3]) - Date.UTC(1899,11,30)) / 864e5); };
  const serialToIso = n => new Date(Date.UTC(1899,11,30) + Math.round(n)*864e5).toISOString().slice(0,10);
  // ---- values ----
  const num = v => { if(v === '' || v === null || v === undefined) return 0; if(typeof v === 'boolean') return v ? 1 : 0; if(typeof v === 'number') return v; if(isErr(v)) throw new XErr(v); if(ISO.test(v)) return isoToSerial(v); const n = Number(v); if(isNaN(n)) throw new XErr(ERR.VAL); return n; };
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

  const MON = ['January','February','March','April','May','June','July','August','September','October','November','December'], DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  function textFmt(v, f){
    const fl = f.toLowerCase();
    if(/[ymd]/.test(fl) && !/[#0]/.test(fl)){ const n = num(v), [y, m, d] = ymd(n), wd = new Date(Date.UTC(y, m-1, d)).getUTCDay();
      return f.replace(/yyyy|yy|mmmm|mmm|mm|m|dddd|ddd|dd|d/gi, t => { t = t.toLowerCase(); return {yyyy:String(y), yy:String(y).slice(2), mmmm:MON[m-1], mmm:MON[m-1].slice(0,3), mm:String(m).padStart(2,'0'), m:String(m), dddd:DOW[wd], ddd:DOW[wd].slice(0,3), dd:String(d).padStart(2,'0'), d:String(d)}[t]; }); }
    let n = num(v); const pct = f.includes('%'); if(pct) n *= 100;
    const dec = (/\.(0+)/.exec(f) || [,''])[1].length; const comma = f.includes(',');
    let out = Math.abs(n).toLocaleString('en-US', {minimumFractionDigits:dec, maximumFractionDigits:dec, useGrouping:comma});
    const pre = (/^[^#0]*/.exec(f) || [''])[0].replace(/"/g, ''), post = (/[^#0.,%]*$/.exec(f) || [''])[0].replace(/"/g, '');
    return (n < 0 ? '-' : '') + pre + out + (pct ? '%' : '') + post;
  }
  const workdays = (a, b) => { let c = 0; const s0 = Math.min(a, b), s1 = Math.max(a, b); for(let s = s0; s <= s1; s++){ const wd = (s + 6) % 7; if(wd !== 0 && wd !== 6) c++; } return a <= b ? c : -c; };
  const as2D = v => isRange(v) ? v : [[v]];
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
    UNIQUE: a => { const rows = as2D(a[0]); const seen = new Set(), out = []; for(const r of rows){ const k = JSON.stringify(r); if(!seen.has(k)){ seen.add(k); out.push(r); } } return out; },
    FILTER: a => { const rows = as2D(a[0]), inc = flat(as2D(a[1])); if(inc.length !== rows.length) throw new XErr(ERR.VAL); const out = rows.filter((_, i) => bool(inc[i])); if(!out.length){ if(a[2] !== undefined) return a[2]; throw new XErr('#CALC!'); } return out; },
    SORT: a => { const rows = as2D(a[0]).map(r => r.slice()); const c = (a[1] === undefined ? 1 : num(a[1])) - 1, o = a[2] === undefined ? 1 : num(a[2]);
      return rows.sort((x, y) => { const p = x[c], q = y[c]; const r = (typeof p === 'number' && typeof q === 'number') ? p - q : String(p).localeCompare(String(q)); return r * o; }); },
    SORTBY: a => { const rows = as2D(a[0]), by = flat(as2D(a[1])), o = a[2] === undefined ? 1 : num(a[2]); return rows.map((r, i) => [r, by[i]]).sort((x, y) => ((typeof x[1] === 'number' ? x[1] - y[1] : String(x[1]).localeCompare(String(y[1])))) * o).map(x => x[0]); },
    SEQUENCE: a => { const n = num(a[0]), c = a[1] === undefined ? 1 : num(a[1]), st = a[2] === undefined ? 1 : num(a[2]), step = a[3] === undefined ? 1 : num(a[3]); const out = []; let v = st; for(let i=0;i<n;i++){ const r = []; for(let j=0;j<c;j++){ r.push(v); v += step; } out.push(r); } return out; },
    SUMPRODUCT: a => { const arrs = a.map(x => flat(as2D(x))); return arrs[0].reduce((s, _, i) => s + arrs.reduce((p, arr) => p * (typeof arr[i] === 'number' ? arr[i] : typeof arr[i] === 'boolean' ? +arr[i] : 0), 1), 0); },
    MAXIFS: a => { const v = flat(a[0]).filter((x, i) => { for(let k=1;k<a.length;k+=2) if(!matchCrit(flat(a[k])[i], a[k+1])) return false; return typeof x === 'number'; }); return v.length ? Math.max(...v) : 0; },
    MINIFS: a => { const v = flat(a[0]).filter((x, i) => { for(let k=1;k<a.length;k+=2) if(!matchCrit(flat(a[k])[i], a[k+1])) return false; return typeof x === 'number'; }); return v.length ? Math.min(...v) : 0; },
    AVERAGEIFS: a => { const v = flat(a[0]).filter((x, i) => { for(let k=1;k<a.length;k+=2) if(!matchCrit(flat(a[k])[i], a[k+1])) return false; return typeof x === 'number'; }); if(!v.length) throw new XErr(ERR.DIV); return v.reduce((s,x)=>s+x,0)/v.length; },
    DATE: a => { const d = new Date(Date.UTC(num(a[0]), num(a[1]) - 1, num(a[2]))); return d.toISOString().slice(0,10); },
    EOMONTH: a => { const [y, m] = ymd(num(a[0])); const d = new Date(Date.UTC(y, m - 1 + num(a[1]) + 1, 0)); return d.toISOString().slice(0,10); },
    EDATE: a => { const [y, m, dd] = ymd(num(a[0])); const last = new Date(Date.UTC(y, m - 1 + num(a[1]) + 1, 0)).getUTCDate(); return new Date(Date.UTC(y, m - 1 + num(a[1]), Math.min(dd, last))).toISOString().slice(0,10); },
    DAYS: a => num(a[0]) - num(a[1]),
    DATEDIF: a => { const s0 = num(a[0]), s1 = num(a[1]); if(s1 < s0) throw new XErr('#NUM!'); const u = str(a[2]).toUpperCase(); const [y0, m0, d0] = ymd(s0), [y1, m1, d1] = ymd(s1);
      if(u === 'D') return s1 - s0; let months = (y1 - y0) * 12 + (m1 - m0) - (d1 < d0 ? 1 : 0); if(u === 'M') return months; if(u === 'Y') return Math.floor(months / 12); if(u === 'YM') return months % 12; throw new XErr(ERR.VAL); },
    NETWORKDAYS: a => workdays(num(a[0]), num(a[1])),
    WORKDAY: a => { let s0 = num(a[0]), n = num(a[1]); const step = n >= 0 ? 1 : -1; while(n !== 0){ s0 += step; const wd = (s0 + 6) % 7; if(wd !== 0 && wd !== 6) n -= step; } return serialToIso(s0); },
    WEEKDAY: a => { const wd = (num(a[0]) + 6) % 7; const t = a[1] === undefined ? 1 : num(a[1]); return t === 2 ? (wd === 0 ? 7 : wd) : wd + 1; },
    TODAY: () => new Date().toISOString().slice(0,10),
    TEXT: a => textFmt(a[0], str(a[1])),
    VALUE: a => num(a[0]),
  };
  const LAZY = new Set(['IF','IFERROR','IFS','AND','OR','LET']);

  // ---- sheet ----
  class Sheet {
    constructor(cells = {}, opts = {}){ this.raw = {}; this.cols = opts.cols || 8; this.rows = opts.rows || 12; this.names = opts.names || {}; this.env = null; for(const k in cells) this.raw[k.toUpperCase()] = cells[k]; this.recalc(); }
    get(a){ return this.raw[a] ?? ''; }
    set(a, v){ a = a.toUpperCase(); if(v === '' || v === null) delete this.raw[a]; else this.raw[a] = v; this.recalc(); }
    recalc(){
      this.spillVals = {}; this.spillOf = {};
      for(let pass = 0; pass < 2; pass++){
        this.vals = {}; this.stack = new Set(); this.spills = {};
        for(const a in this.raw) this.value(a);
        const sv = {}, so = {};
        for(const a in this.spills){ const arr = this.spills[a], p = parseRef(a); let blocked = false;
          arr.forEach((row, i) => row.forEach((v, j) => { if(i || j){ const t = addr(p.c + j, p.r + i); if(this.raw[t] !== undefined && this.raw[t] !== '') blocked = true; } }));
          if(blocked){ this.vals[a] = '#SPILL!'; continue; }
          arr.forEach((row, i) => row.forEach((v, j) => { const t = addr(p.c + j, p.r + i); if(i || j){ sv[t] = v; } so[t] = a; })); }
        const same = JSON.stringify(sv) === JSON.stringify(this.spillVals); this.spillVals = sv; this.spillOf = so; if(same && pass) break;
      }
      for(const a in this.spillVals) this.vals[a] = this.spillVals[a];
    }
    value(a){
      if(a in this.vals) return this.vals[a];
      const raw = this.raw[a];
      if(raw === undefined) return this.spillVals && a in this.spillVals ? this.spillVals[a] : '';
      if(typeof raw === 'string' && raw.startsWith('=')){
        if(this.stack.has(a)) return ERR.CIRC;
        this.stack.add(a); let v;
        try{ v = this.evalNode(parse(raw.slice(1))); if(isRange(v)){ if(v.length > 1 || v[0].length > 1) this.spills[a] = v; v = v[0][0]; } if(v === undefined || v === null) v = 0; if(v === '') v = 0; if(typeof v === 'number' && !isFinite(v)) v = ERR.DIV; }
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
        case 'name': { if(this.env && n.v in this.env) return this.env[n.v]; const nm = Object.keys(this.names).find(k => k.toUpperCase() === n.v); if(nm){ const t = this.names[nm]; return t.includes(':') ? this.range(t.replace(/\$/g,'')) : this.scalar({t:'ref', v:t.replace(/\$/g,'')}); } throw new XErr(ERR.NAME); }
        case 'ref': { const p = parseRef(n.v); const v = this.value(addr(p.c, p.r)); if(isErr(v)) throw new XErr(v); return v; }
        case 'range': return this.range(n.v);
        case 'neg': return -num(this.scalar(n.e));
        case 'bin': {
          const L = this.evalNode(n.l), Rv = this.evalNode(n.r);
          if(isRange(L) || isRange(Rv)){ const A2 = as2D(L), B2 = as2D(Rv); const rows = Math.max(A2.length, B2.length), cols = Math.max(A2[0].length, B2[0].length);
            const pick = (M, i, j) => M[M.length === 1 ? 0 : i][M[0].length === 1 ? 0 : j];
            return Array.from({length:rows}, (_, i) => Array.from({length:cols}, (_, j) => { try{ return this.binop(n.o, pick(A2, i, j), pick(B2, i, j)); }catch(e){ return e instanceof XErr ? e.code : ERR.VAL; } })); }
          return this.binop(n.o, L, Rv);
        }
        case 'fn': return this.call(n);
      }
      throw new XErr(ERR.VAL);
    }
    binop(o, l, r){
          if(isErr(l)) throw new XErr(l); if(isErr(r)) throw new XErr(r);
          switch(o){
            case '+': return num(l) + num(r); case '-': return num(l) - num(r); case '*': return num(l) * num(r);
            case '/': { const d = num(r); if(d === 0) throw new XErr(ERR.DIV); return num(l) / d; }
            case '^': return Math.pow(num(l), num(r)); case '&': return str(l) + str(r);
            default: { const cmpv = (typeof l === 'number' && typeof r === 'number') ? l - r : (str(l).toLowerCase() < str(r).toLowerCase() ? -1 : str(l).toLowerCase() > str(r).toLowerCase() ? 1 : 0);
              return {'=':cmpv===0,'<>':cmpv!==0,'<':cmpv<0,'>':cmpv>0,'<=':cmpv<=0,'>=':cmpv>=0}[o]; }
          }
    }
    call(n){
          if(LAZY.has(n.n)){
            const A = n.args;
            if(n.n === 'IF'){ const c = bool(this.scalar(A[0])); const b = c ? A[1] : A[2]; if(!b || b.t === 'blank') return c ? 0 : false; return this.scalar(b); }
            if(n.n === 'IFERROR'){ try{ const v = this.scalar(A[0]); if(isErr(v)) throw new XErr(v); return v; }catch(e){ if(e instanceof XErr) return this.scalar(A[1]); throw e; } }
            if(n.n === 'IFS'){ for(let i=0;i<A.length;i+=2){ if(bool(this.scalar(A[i]))) return this.scalar(A[i+1]); } throw new XErr(ERR.NA); }
            if(n.n === 'LET'){ const saved = this.env; this.env = Object.assign({}, this.env); try{ for(let i=0;i<A.length-1;i+=2){ if(A[i].t !== 'name') throw new XErr(ERR.VAL); this.env[A[i].v] = this.evalNode(A[i+1]); } return this.evalNode(A[A.length-1]); } finally { this.env = saved; } }
            if(n.n === 'AND') return A.every(x => flat([this.evalNode(x)]).every(bool));
            if(n.n === 'OR') return A.some(x => flat([this.evalNode(x)]).some(bool));
          }
          const f = FN[n.n]; if(!f) throw new XErr(ERR.NAME);
          const args = n.args.map(x => x.t === 'blank' ? undefined : this.evalNode(x));
          return f(args);
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
