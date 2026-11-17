// ===== Lumi's Data Lab: Excel + Power BI course content =====
// Steps are tiny on purpose: one idea or one action per screen.
const G = (rows, r0 = 1) => { const o = {}; rows.forEach((row, i) => row.forEach((v, j) => { if(v !== null && v !== undefined && v !== '') o[XL.numToCol(j+1) + (r0+i)] = v; })); return o; };
const V = (s, a) => s.value(a);
const F = (s, a) => (s.formulaOf(a) || '').toUpperCase();
const near = (a, b) => typeof a === 'number' && Math.abs(a - b) < 0.011;
function colCheck(s, col, from, to, expect, needFormula = true){
  for(let r = from; r <= to; r++){
    const a = col + r, v = V(s, a), e = expect(r);
    if(needFormula && !F(s, a)) return `${a} needs a formula (start with =), not a typed value.`;
    if(XL.isErr(v)) return `${a} shows ${v}. Check the formula in that cell.`;
    if(typeof e === 'number' ? !near(v, e) : String(v) !== String(e)) return `${a} shows ${XL.fmt(v)} but should be ${XL.fmt(e)}.`;
  }
  return true;
}

const BOBA = [['Product','Cups','Price','Revenue'],['Classic Milk Tea',40,5.5],['Taro Milk Tea',25,6],['Brown Sugar Boba',32,6.5],['Mango Fruit Tea',18,5.75],['Mochi Donut',22,3.5]];
const PRICE_TBL = [['Product','Price'],['Classic Milk Tea',5.5],['Taro Milk Tea',6],['Brown Sugar Boba',6.5],['Mango Fruit Tea',5.75],['Matcha Latte',6.25],['Mochi Donut',3.5]];

const TRACKS = [
{ id:'excel', name:'Excel', color:'#bfeedd', accent:'#2f9e77', icon:'grid',
  blurb:'Formulas, lookups, PivotTables and charts. The skill every office job assumes you have.',
  lessons:[
// ------------------------------------------------------------------ EXCEL 1
{ id:'x1', title:'Meet the Grid', mins:6, why:'Every Excel skill builds on knowing how cells and formulas work.', steps:[
  { type:'learn', title:'Excel is a giant grid', text:'Columns go across and have <b>letters</b> (A, B, C). Rows go down and have <b>numbers</b> (1, 2, 3). Where they cross is a <b>cell</b>, named column first, then row.', visual:'grid', tip:'Say it like a map coordinate: column B, row 3 = <b>B3</b>.' },
  { type:'quiz', q:'Which cell is in column C, row 5?', opts:['5C','C5','R5C3','CC5'], a:1, why:'Column letter first, then the row number: C5.' },
  { type:'sheet', title:'Your first entry', task:'Click cell <b>B3</b>, type <b>42</b>, and press <b>Enter</b>.', cells:G([['Drink','Cups'],['Milk Tea',18],['Taro','']]), cols:3, rows:5, select:'A1',
    check:s => V(s,'B3') === 42 ? true : 'B3 should contain 42. Click B3, type 42, press Enter.', solution:{B3:'42'}, hint:'Click the empty cell under 18, then type.' },
  { type:'learn', title:'Formulas start with =', text:'Typing <b>=</b> tells Excel: "calculate this!" <code>=5+3</code> shows 8. Better still, point at cells: <code>=A2+B2</code> adds whatever is in A2 and B2. Change a number, and the answer updates by itself.', visual:'formula', tip:'If you forget the =, Excel just shows your text.' },
  { type:'sheet', title:'Add two cells', task:'In <b>C2</b>, type <code>=A2+B2</code> and press Enter.', cells:G([['Morning','Afternoon','Total'],[12,30]]), cols:3, rows:4, select:'C2',
    check:s => !F(s,'C2') ? 'C2 needs a formula that starts with =' : !/A2/.test(F(s,'C2')) || !/B2/.test(F(s,'C2')) ? 'Point at the cells: use A2 and B2 in your formula.' : V(s,'C2') === 42 ? true : 'C2 should equal 42.', solution:{C2:'=A2+B2'}, hint:'Type exactly: =A2+B2' },
  { type:'sheet', title:'Watch it update', task:'Now change <b>A2</b> to <b>20</b>. See how C2 updates by itself? That is the magic of formulas.', cells:G([['Morning','Afternoon','Total'],[12,30,'=A2+B2']]), cols:3, rows:4, select:'A2',
    check:s => V(s,'A2') === 20 && V(s,'C2') === 50 ? true : 'Set A2 to 20 and C2 should show 50.', solution:{A2:'20'}, hint:'Click A2, type 20, press Enter.' },
  { type:'real', title:'Try it in real Excel', items:['Download the practice workbook (button below)','Open the sheet "1 Grid"','Do the yellow cells, then check the "Answers" sheet'], file:'excel' }
]},
// ------------------------------------------------------------------ EXCEL 2
{ id:'x2', title:'Formulas & Fill Down', mins:8, why:'Writing one formula and copying it to 1,000 rows is the biggest time-saver in Excel.', steps:[
  { type:'learn', title:'Math symbols', text:'<code>+</code> add, <code>-</code> subtract, <code>*</code> multiply, <code>/</code> divide, <code>^</code> power. Excel follows normal math order: multiply and divide before add and subtract. Use ( ) to change the order.', tip:'=(2+3)*4 = 20, but =2+3*4 = 14.' },
  { type:'quiz', q:'What does =10+2*3 return?', opts:['36','16','15','10.6'], a:1, why:'Multiply first: 2*3 = 6, then 10 + 6 = 16.' },
  { type:'sheet', title:'Revenue for one row', task:'In <b>D2</b>, calculate revenue: <b>Cups × Price</b>.', cells:G(BOBA), cols:4, rows:7, select:'D2',
    check:s => !F(s,'D2') ? 'Use a formula: =B2*C2' : near(V(s,'D2'), 220) ? true : 'D2 should be 220 (40 × 5.5).', solution:{D2:'=B2*C2'}, hint:'=B2*C2' },
  { type:'learn', title:'Fill down = copy the formula', text:'You don\'t retype a formula for every row. <b>Fill it down</b>: Excel moves the cell references along with it, so row 3 becomes <code>=B3*C3</code>, row 4 <code>=B4*C4</code>, and so on.', visual:'fill', tip:'In real Excel: double-click the little square at the bottom-right of the cell, or select the range and press <b>Ctrl+D</b>.' },
  { type:'sheet', title:'Fill it down', task:'Put <code>=B2*C2</code> in D2, then select <b>D2 to D6</b> (click D2, then <b>Shift+click</b> D6) and press <b>Fill ⬇</b> or <b>Ctrl+D</b>.', cells:G(BOBA), cols:4, rows:7, select:'D2',
    check:s => colCheck(s, 'D', 2, 6, r => [0,0,220,150,208,103.5,77][r]), solution:{D2:'=B2*C2', D3:'=B3*C3', D4:'=B4*C4', D5:'=B5*C5', D6:'=B6*C6'}, hint:'Click D2, Shift+click D6, then press the Fill ⬇ button.' },
  { type:'learn', title:'Lock a cell with $', text:'Sometimes one cell should <b>not</b> move when you fill down, like a tax rate. Add dollar signs: <code>$B$1</code> stays B1 forever. This is an <b>absolute reference</b>.', visual:'dollar', tip:'In real Excel, press <b>F4</b> while your cursor is on a reference to add the $ signs.' },
  { type:'sheet', title:'Tax with a locked rate', task:'In <b>C3</b>, write tax = Revenue × the rate in B1, using <code>$B$1</code>. Then fill down to <b>C7</b>.', cells:G([['Tax rate',0.08,''],['Product','Revenue','Tax'],['Classic Milk Tea',220],['Taro Milk Tea',150],['Brown Sugar Boba',208],['Mango Fruit Tea',103.5],['Mochi Donut',77]]), cols:3, rows:8, select:'C3',
    check:s => { const r = colCheck(s, 'C', 3, 7, r => [0,0,0,17.6,12,16.64,8.28,6.16][r]); if(r !== true && near(V(s,'C3'),17.6) && !/\$B\$1/.test(F(s,'C4'))) return 'C3 is right, but the rows below are off. Did you lock the rate with $B$1?'; return r; },
    solution:{C3:'=B3*$B$1',C4:'=B4*$B$1',C5:'=B5*$B$1',C6:'=B6*$B$1',C7:'=B7*$B$1'}, hint:'C3: =B3*$B$1, then select C3:C7 and Fill ⬇.' },
  { type:'real', title:'Try it in real Excel', items:['Open sheet "2 Formulas" in the practice workbook','Fill the Revenue column with one formula + double-click fill','Use F4 to lock the tax rate'], file:'excel' }
]},
// ------------------------------------------------------------------ EXCEL 3
{ id:'x3', title:'Power Functions', mins:7, why:'SUM, AVERAGE, MIN and MAX answer half of all business questions.', steps:[
  { type:'learn', title:'What is a function?', text:'A function is a ready-made formula. Write its name, then what to work on in brackets: <code>=SUM(B2:B6)</code> adds everything from B2 to B6. The colon <code>:</code> means "through".', tip:'<b>Alt + =</b> in real Excel inserts SUM automatically.' },
  { type:'sheet', title:'Weekly total', task:'In <b>B7</b>, add up all the cups with <b>SUM</b>.', cells:G([['Day','Cups'],['Mon',120],['Tue',95],['Wed',140],['Thu',88],['Fri',160],['Total'],['Average'],['Best day'],['Worst day']]), cols:2, rows:10, select:'B7',
    check:s => !/SUM\(/.test(F(s,'B7')) ? 'Use the SUM function: =SUM(B2:B6)' : V(s,'B7') === 603 ? true : 'B7 should be 603. Check your range is B2:B6.', solution:{B7:'=SUM(B2:B6)'}, hint:'=SUM(B2:B6)' },
  { type:'sheet', title:'A rounded average', task:'In <b>B8</b>, get the average cups per day, <b>rounded to 1 decimal</b>. Wrap AVERAGE inside ROUND.', cells:G([['Day','Cups'],['Mon',120],['Tue',95],['Wed',140],['Thu',88],['Fri',160],['Total','=SUM(B2:B6)'],['Average'],['Best day'],['Worst day']]), cols:2, rows:10, select:'B8',
    check:s => !/AVERAGE\(/.test(F(s,'B8')) ? 'Use AVERAGE(B2:B6) inside ROUND(…, 1).' : V(s,'B8') === 120.6 ? true : 'B8 should show 120.6. Try =ROUND(AVERAGE(B2:B6),1)', solution:{B8:'=ROUND(AVERAGE(B2:B6),1)'}, hint:'=ROUND(AVERAGE(B2:B6),1)' },
  { type:'sheet', title:'Best and worst day', task:'B9: the <b>biggest</b> day (MAX). B10: the <b>smallest</b> day (MIN).', cells:G([['Day','Cups'],['Mon',120],['Tue',95],['Wed',140],['Thu',88],['Fri',160],['Total','=SUM(B2:B6)'],['Average','=ROUND(AVERAGE(B2:B6),1)'],['Best day'],['Worst day']]), cols:2, rows:10, select:'B9',
    check:s => !/MAX\(/.test(F(s,'B9')) ? 'B9 needs =MAX(B2:B6)' : !/MIN\(/.test(F(s,'B10')) ? 'B10 needs =MIN(B2:B6)' : V(s,'B9') === 160 && V(s,'B10') === 88 ? true : 'Check your ranges are B2:B6.', solution:{B9:'=MAX(B2:B6)', B10:'=MIN(B2:B6)'}, hint:'=MAX(B2:B6) and =MIN(B2:B6)' },
  { type:'quiz', q:'A column has 10 cells: 7 numbers, 2 words, 1 empty. What does COUNT give?', opts:['10','9','7','2'], a:2, why:'COUNT counts numbers only. COUNTA counts anything not empty (9 here).' },
  { type:'learn', title:'Quick peek trick', text:'Select some numbers in real Excel and look at the <b>status bar</b> at the bottom: it shows Sum, Average and Count instantly, with no formula needed. Great for a quick sanity check.' },
  { type:'real', title:'Try it in real Excel', items:['Open sheet "3 Functions"','Use Alt+= for the total','Check your answer with the status bar'], file:'excel' }
]},
// ------------------------------------------------------------------ EXCEL 4
{ id:'x4', title:'IF: Teach Excel to Decide', mins:8, why:'Targets, bonuses, flags and statuses are all IF formulas in real reports.', steps:[
  { type:'learn', title:'IF in one sentence', text:'<code>=IF(test, value_if_true, value_if_false)</code><br>Example: <code>=IF(C2>=B2,"Hit","Miss")</code> means "if sales reached the target, say Hit, otherwise say Miss."', visual:'if', tip:'Text answers go in "double quotes". Numbers don\'t.' },
  { type:'sheet', title:'Hit or miss?', task:'In <b>D2:D6</b>, show <b>"Hit"</b> if Sales ≥ Target, else <b>"Miss"</b>. Write D2, then fill down.', cells:G([['Store','Target','Sales','Result'],['Downtown',500,620],['Lakeside',400,380],['Harbor',450,450],['Sunset',300,410],['Uptown',600,540]]), cols:4, rows:7, select:'D2',
    check:s => colCheck(s, 'D', 2, 6, r => ['','','Hit','Miss','Hit','Hit','Miss'][r]), solution:{D2:'=IF(C2>=B2,"Hit","Miss")',D3:'=IF(C3>=B3,"Hit","Miss")',D4:'=IF(C4>=B4,"Hit","Miss")',D5:'=IF(C5>=B5,"Hit","Miss")',D6:'=IF(C6>=B6,"Hit","Miss")'}, hint:'=IF(C2>=B2,"Hit","Miss"), then select D2:D6 and Fill ⬇.' },
  { type:'quiz', q:'Bonus only if sales ≥ 500 AND region is West. Which function joins the two tests?', opts:['OR','AND','SUM','IFS'], a:1, why:'AND is TRUE only when every test is TRUE. OR needs just one.' },
  { type:'sheet', title:'Two conditions', task:'In <b>D2:D6</b>: "Yes" if Sales ≥ 500 <b>AND</b> Region = "West", else "No".', cells:G([['Store','Region','Sales','Bonus'],['Downtown','West',620],['Lakeside','Midwest',380],['Harbor','East',450],['Sunset','West',410],['Uptown','East',540]]), cols:4, rows:7, select:'D2',
    check:s => !/AND\(/.test(F(s,'D2')) ? 'Use AND inside IF: =IF(AND(C2>=500,B2="West"),"Yes","No")' : colCheck(s, 'D', 2, 6, r => ['','','Yes','No','No','No','No'][r]), solution:{D2:'=IF(AND(C2>=500,B2="West"),"Yes","No")',D3:'=IF(AND(C3>=500,B3="West"),"Yes","No")',D4:'=IF(AND(C4>=500,B4="West"),"Yes","No")',D5:'=IF(AND(C5>=500,B5="West"),"Yes","No")',D6:'=IF(AND(C6>=500,B6="West"),"Yes","No")'}, hint:'=IF(AND(C2>=500,B2="West"),"Yes","No")' },
  { type:'learn', title:'Hide ugly errors', text:'Dividing by zero shows <b>#DIV/0!</b>. Wrap the formula in <code>IFERROR(formula, fallback)</code> to show something nicer instead: <code>=IFERROR(B2/C2, 0)</code>.', tip:'Only use IFERROR when you know why the error happens, or it can hide real mistakes.' },
  { type:'sheet', title:'Safe division', task:'In <b>D2:D5</b>, average order = Revenue ÷ Orders. Use <b>IFERROR</b> so the closed store shows <b>0</b>.', cells:G([['Store','Revenue','Orders','Avg order'],['Downtown',620,50],['Lakeside',380,40],['Pier (closed)',0,0],['Sunset',410,41]]), cols:4, rows:6, select:'D2',
    check:s => !/IFERROR\(/.test(F(s,'D4')) ? 'D4 still needs IFERROR around the division.' : colCheck(s, 'D', 2, 5, r => [0,0,12.4,9.5,0,10][r]), solution:{D2:'=IFERROR(B2/C2,0)',D3:'=IFERROR(B3/C3,0)',D4:'=IFERROR(B4/C4,0)',D5:'=IFERROR(B5/C5,0)'}, hint:'=IFERROR(B2/C2,0), then fill down.' },
  { type:'real', title:'Try it in real Excel', items:['Open sheet "4 Logic"','Write the IF once and fill down','Try IFS for three levels: Gold / Silver / Bronze'], file:'excel' }
]},
// ------------------------------------------------------------------ EXCEL 5
{ id:'x5', title:'Lookups: VLOOKUP & XLOOKUP', mins:9, why:'"Can you pull the price from the other sheet?" Lookups are the most-asked Excel interview skill.', steps:[
  { type:'learn', title:'Why look things up?', text:'You have a list of orders and a separate price list. A lookup <b>finds</b> each product in the price list and <b>brings back</b> its price, like a phone book.', visual:'lookup' },
  { type:'sheet', title:'VLOOKUP the price', task:'In <b>B2:B5</b>, look up each product\'s price from the table in <b>F1:G7</b>.<br><code>=VLOOKUP(A2,$F$2:$G$7,2,FALSE)</code>', cells:{...G([['Product','Price'],['Taro Milk Tea'],['Mochi Donut'],['Classic Milk Tea'],['Mango Fruit Tea']]), ...G(PRICE_TBL.map(r => [null,null,null,null,null,...r]))}, cols:7, rows:8, select:'B2',
    check:s => !/LOOKUP\(/.test(F(s,'B2')) ? 'Use VLOOKUP in B2.' : colCheck(s, 'B', 2, 5, r => [0,0,6,3.5,5.5,5.75][r]), solution:{B2:'=VLOOKUP(A2,$F$2:$G$7,2,FALSE)',B3:'=VLOOKUP(A3,$F$2:$G$7,2,FALSE)',B4:'=VLOOKUP(A4,$F$2:$G$7,2,FALSE)',B5:'=VLOOKUP(A5,$F$2:$G$7,2,FALSE)'}, hint:'Lock the table with $ so it doesn\'t move when you fill down.' },
  { type:'quiz', q:'Why put FALSE at the end of VLOOKUP?', opts:['It turns the formula off','It asks for an exact match','It sorts the table','It returns the first column'], a:1, why:'FALSE = exact match. Without it, VLOOKUP may return a close-but-wrong row.' },
  { type:'learn', title:'XLOOKUP: the modern way', text:'<code>=XLOOKUP(what, look_in, return_from)</code><br>Easier to read, exact match by default, and it can look <b>left</b>. Available in Excel 365 and 2021+.', tip:'Add a 4th argument for "not found": =XLOOKUP(A2,F:F,H:H,"Missing")' },
  { type:'sheet', title:'XLOOKUP the region', task:'In <b>B2:B5</b>, use <b>XLOOKUP</b> to find each store\'s <b>Region</b> from the table on the right.', cells:{...G([['Store','Region'],['Harbor'],['Sunset'],['Lakeside'],['Downtown']]), ...G([[null,null,null,null,'Store','City','Region'],[null,null,null,null,'Downtown','Seattle','West'],[null,null,null,null,'Lakeside','Chicago','Midwest'],[null,null,null,null,'Harbor','Boston','East'],[null,null,null,null,'Sunset','San Diego','West'],[null,null,null,null,'Uptown','New York','East']])}, cols:7, rows:7, select:'B2',
    check:s => !/XLOOKUP\(/.test(F(s,'B2')) ? 'Use XLOOKUP: =XLOOKUP(A2,$E$2:$E$6,$G$2:$G$6)' : colCheck(s, 'B', 2, 5, r => ['','','East','West','Midwest','West'][r]), solution:{B2:'=XLOOKUP(A2,$E$2:$E$6,$G$2:$G$6)',B3:'=XLOOKUP(A3,$E$2:$E$6,$G$2:$G$6)',B4:'=XLOOKUP(A4,$E$2:$E$6,$G$2:$G$6)',B5:'=XLOOKUP(A5,$E$2:$E$6,$G$2:$G$6)'}, hint:'Look in E (Store), return from G (Region).' },
  { type:'learn', title:'INDEX + MATCH', text:'Older but still loved in interviews. <code>MATCH</code> finds the <b>position</b>, and <code>INDEX</code> returns the value at that position: <code>=INDEX(G2:G7, MATCH(A2, F2:F7, 0))</code>.', tip:'The 0 in MATCH means exact match, like FALSE in VLOOKUP.' },
  { type:'sheet', title:'INDEX/MATCH the category', task:'In <b>B2:B4</b>, return each product\'s <b>Category</b> using INDEX and MATCH.', cells:{...G([['Product','Category'],['Mochi Donut'],['Mango Fruit Tea'],['Matcha Latte']]), ...G([[null,null,null,null,null,'Product','Category'],[null,null,null,null,null,'Classic Milk Tea','Milk Tea'],[null,null,null,null,null,'Mango Fruit Tea','Fruit Tea'],[null,null,null,null,null,'Matcha Latte','Milk Tea'],[null,null,null,null,null,'Mochi Donut','Snacks']])}, cols:7, rows:6, select:'B2',
    check:s => !(/INDEX\(/.test(F(s,'B2')) && /MATCH\(/.test(F(s,'B2'))) ? 'Use both INDEX and MATCH in B2.' : colCheck(s, 'B', 2, 4, r => ['','','Snacks','Fruit Tea','Milk Tea'][r]), solution:{B2:'=INDEX($G$2:$G$5,MATCH(A2,$F$2:$F$5,0))',B3:'=INDEX($G$2:$G$5,MATCH(A3,$F$2:$F$5,0))',B4:'=INDEX($G$2:$G$5,MATCH(A4,$F$2:$F$5,0))'}, hint:'=INDEX($G$2:$G$5,MATCH(A2,$F$2:$F$5,0))' },
  { type:'real', title:'Try it in real Excel', items:['Open sheet "5 Lookups"','Do the VLOOKUP, then redo it with XLOOKUP','Break one product name on purpose and see #N/A'], file:'excel' }
]},
// ------------------------------------------------------------------ EXCEL 6
{ id:'x6', title:'SUMIF, COUNTIF & Clean Text', mins:8, why:'"Total sales for the West region" and "clean up this messy export" are daily tasks.', steps:[
  { type:'learn', title:'Add only what matches', text:'<code>=SUMIF(range_to_check, "criteria", range_to_add)</code><br><code>=COUNTIF(range, "criteria")</code><br>Criteria can be text like <code>"West"</code> or a comparison like <code>">100"</code>.' },
  { type:'sheet', title:'SUMIF and COUNTIF', task:'<b>F1</b>: total revenue for <b>West</b> (SUMIF).<br><b>F2</b>: how many orders are <b>over 100</b> (COUNTIF).', cells:G([['Region','Category','Revenue','','West total'],['West','Milk Tea',120,'','Orders > 100'],['East','Snacks',45,'','West Milk Tea'],['West','Fruit Tea',88],['Midwest','Milk Tea',150],['West','Milk Tea',210],['East','Milk Tea',95],['South','Fruit Tea',60],['West','Snacks',32]]), cols:6, rows:10, select:'F1',
    check:s => !/SUMIF\(/.test(F(s,'F1')) ? 'F1 needs SUMIF.' : !/COUNTIF\(/.test(F(s,'F2')) ? 'F2 needs COUNTIF.' : V(s,'F1') !== 450 ? 'F1 should be 450 (all West revenue).' : V(s,'F2') !== 3 ? 'F2 should be 3. Criteria: ">100" in quotes.' : true,
    solution:{F1:'=SUMIF(A2:A9,"West",C2:C9)',F2:'=COUNTIF(C2:C9,">100")'}, hint:'=SUMIF(A2:A9,"West",C2:C9) and =COUNTIF(C2:C9,">100")' },
  { type:'sheet', title:'Two conditions: SUMIFS', task:'<b>F3</b>: revenue for <b>West</b> AND <b>Milk Tea</b>.<br>Note: in SUMIFS, the <b>sum range comes first</b>.', cells:G([['Region','Category','Revenue','','West total','=SUMIF(A2:A9,"West",C2:C9)'],['West','Milk Tea',120,'','Orders > 100','=COUNTIF(C2:C9,">100")'],['East','Snacks',45,'','West Milk Tea'],['West','Fruit Tea',88],['Midwest','Milk Tea',150],['West','Milk Tea',210],['East','Milk Tea',95],['South','Fruit Tea',60],['West','Snacks',32]]), cols:6, rows:10, select:'F3',
    check:s => !/SUMIFS\(/.test(F(s,'F3')) ? 'Use SUMIFS in F3.' : V(s,'F3') === 330 ? true : 'F3 should be 330 (120 + 210).', solution:{F3:'=SUMIFS(C2:C9,A2:A9,"West",B2:B9,"Milk Tea")'}, hint:'=SUMIFS(C2:C9,A2:A9,"West",B2:B9,"Milk Tea")' },
  { type:'learn', title:'Clean messy text', text:'Exports are messy. Fix them with:<br><code>TRIM</code> removes extra spaces · <code>PROPER</code> makes Title Case · <code>UPPER</code>/<code>LOWER</code> · <code>LEFT(text, n)</code> takes the first n characters · <code>&</code> joins text.', tip:'Functions can nest: =PROPER(TRIM(A2)) trims first, then fixes the case.' },
  { type:'sheet', title:'Fix customer names', task:'In <b>B2:B4</b>, clean the names: <code>=PROPER(TRIM(A2))</code>, then fill down.', cells:G([['Raw name','Clean name'],['  ana LOPEZ '],['BEN   carter'],['cy nguyen  ']]), cols:2, rows:5, select:'B2',
    check:s => colCheck(s, 'B', 2, 4, r => ['','','Ana Lopez','Ben Carter','Cy Nguyen'][r]), solution:{B2:'=PROPER(TRIM(A2))',B3:'=PROPER(TRIM(A3))',B4:'=PROPER(TRIM(A4))'}, hint:'=PROPER(TRIM(A2))' },
  { type:'sheet', title:'Make a store code', task:'In <b>B2:B4</b>, build a code like <b>DOW-WEST</b>: the first 3 letters of the store in capitals, a dash, then the region in capitals.', cells:G([['Store','Code','Region'],['Downtown','','West'],['Harbor','','East'],['Lakeside','','Midwest']]), cols:3, rows:5, select:'B2',
    check:s => colCheck(s, 'B', 2, 4, r => ['','','DOW-WEST','HAR-EAST','LAK-MIDWEST'][r]), solution:{B2:'=UPPER(LEFT(A2,3))&"-"&UPPER(C2)',B3:'=UPPER(LEFT(A3,3))&"-"&UPPER(C3)',B4:'=UPPER(LEFT(A4,3))&"-"&UPPER(C4)'}, hint:'=UPPER(LEFT(A2,3))&"-"&UPPER(C2)' },
  { type:'real', title:'Try it in real Excel', items:['Open sheet "6 IFs & Text"','Use SUMIFS for each region','Try Flash Fill: type one clean name, then press Ctrl+E'], file:'excel' }
]},
// ------------------------------------------------------------------ EXCEL 7
{ id:'x7', title:'Sort, Filter & Highlight', mins:6, why:'Finding the top items and the problems fast is what managers do every Monday morning.', steps:[
  { type:'learn', title:'Turn data into a Table', text:'In real Excel, click inside your data and press <b>Ctrl+T</b>. You get filter buttons, banded rows, and formulas that auto-fill new rows. Always do this first!', tip:'Tables also make PivotTables and charts update automatically.' },
  { type:'table', title:'Sort biggest first', task:'Sort the table by <b>Revenue</b>, <b>largest to smallest</b>. Click the ▾ on the Revenue header.', goal:'sort',
    check:st => st.sort && st.sort.col === 'Revenue' && st.sort.dir === 'desc' ? true : 'Open the Revenue ▾ menu and choose "Largest → Smallest".', solution:{sort:{col:'Revenue', dir:'desc'}} },
  { type:'table', title:'Filter one region', task:'Filter so only <b>West</b> orders show. Use the ▾ on the Region header.', goal:'filter',
    check:st => st.filter && st.filter.Region && st.filter.Region.length === 1 && st.filter.Region[0] === 'West' ? true : 'Open Region ▾ and keep only West ticked.', solution:{filter:{Region:['West']}} },
  { type:'learn', title:'Conditional formatting', text:'Colour cells automatically by rule, for example "highlight revenue over 500 in green." Your eye jumps to what matters. Find it at <b>Home → Conditional Formatting</b>.', visual:'cf' },
  { type:'table', title:'Highlight big orders', task:'Add a rule: highlight <b>Revenue greater than 500</b>.', goal:'cf',
    check:st => st.cf && st.cf.col === 'Revenue' && st.cf.op === '>' && +st.cf.val === 500 ? true : 'Click "Conditional formatting", then pick Revenue, "greater than", 500.', solution:{cf:{col:'Revenue', op:'>', val:500, color:'#bfeedd'}} },
  { type:'quiz', q:'Your data has 5,000 rows. What should you do first?', opts:['Sort it by hand','Format it as a Table (Ctrl+T)','Print it','Delete the headers'], a:1, why:'Tables give you filters, structure, and auto-expanding ranges for formulas, pivots and charts.' },
  { type:'real', title:'Try it in real Excel', items:['Open sheet "7 Orders"','Press Ctrl+T, then sort and filter','Add a green rule for Revenue > 500'], file:'excel' }
]},
// ------------------------------------------------------------------ EXCEL 8
{ id:'x8', title:'PivotTables & Charts', mins:9, why:'PivotTables turn thousands of rows into a summary in 10 seconds. This is the #1 Excel skill hiring managers test.', steps:[
  { type:'learn', title:'PivotTables in one picture', text:'Pick fields into four boxes:<br><b>Rows</b> = what to group by · <b>Columns</b> = split across the top · <b>Values</b> = what to add up · <b>Filters</b> = narrow it down.<br>In Excel: <b>Insert → PivotTable</b>.', visual:'pivot' },
  { type:'pivot', title:'Revenue by region', task:'Build a pivot: <b>Region</b> in Rows, <b>Sum of Revenue</b> in Values.',
    check:c => c.rows[0] === 'Region' && c.rows.length === 1 && !c.cols.length && c.val === 'Revenue' && c.agg === 'Sum' ? true : 'Rows: Region only. Values: Revenue with Sum.', solution:{rows:['Region'], cols:[], val:'Revenue', agg:'Sum'} },
  { type:'pivot', title:'Add columns', task:'Now: <b>Category</b> in Rows, <b>Quarter</b> in Columns, <b>Sum of Revenue</b> in Values.',
    check:c => c.rows.join() === 'Category' && c.cols.join() === 'Quarter' && c.val === 'Revenue' && c.agg === 'Sum' ? true : 'Rows: Category, Columns: Quarter, Values: Sum of Revenue.', solution:{rows:['Category'], cols:['Quarter'], val:'Revenue', agg:'Sum'} },
  { type:'learn', title:'Pick the right chart', text:'<b>Line</b> = trend over time · <b>Column</b> = compare a few things · <b>Bar</b> = compare many things or long names · <b>Pie</b> = parts of a whole, but only 2 to 5 slices.', visual:'charts', tip:'If you\'re unsure, a column chart is almost never wrong.' },
  { type:'chart', title:'Show the trend', task:'Make a chart of <b>revenue by Month</b> that shows the <b>trend</b> through the year.',
    check:c => c.type === 'line' && c.axis === 'Month' ? true : c.axis !== 'Month' ? 'Put Month on the axis.' : 'For a trend over time, use a line chart.', solution:{type:'line', axis:'Month'} },
  { type:'quiz', q:'Compare revenue across 6 stores. Best chart?', opts:['Pie','Line','Column','Scatter'], a:2, why:'Column charts compare categories side by side. A line implies time, and a pie with 6 slices is hard to read.' },
  { type:'real', title:'Mini project in real Excel', items:['Open sheet "8 Data" (840 real-ish orders)','Insert → PivotTable: Revenue by Region and Month','Insert → PivotChart (line), then add a Slicer for Category','You just built a dashboard! 🎉'], file:'excel' }
]}
]},
// =====================================================================================
{ id:'pbi', name:'Power BI', color:'#fff1b8', accent:'#c99a06', icon:'chart',
  blurb:'Clean data, model it, write DAX, and build interactive dashboards like a BI analyst.',
  lessons:[
// ------------------------------------------------------------------ PBI 1
{ id:'p1', title:'What is Power BI?', mins:5, why:'Knowing the workflow lets you talk about Power BI confidently in interviews, even before you\'re an expert.', steps:[
  { type:'learn', title:'Excel\'s big sibling', text:'<b>Power BI</b> turns raw data into interactive dashboards. <b>Power BI Desktop</b> (free, Windows) is where you build. The <b>Power BI Service</b> (online) is where you share. It handles millions of rows that would make Excel cry.', visual:'pbilogo' },
  { type:'order', title:'The Power BI workflow', task:'Tap the steps in the order you\'d do them.', items:['Get data','Clean it in Power Query','Model the relationships','Write DAX measures','Build visuals','Publish & share'] },
  { type:'learn', title:'The three views', text:'Icons on the left of Power BI Desktop:<br>📊 <b>Report</b>: build visuals · 🗂️ <b>Table</b>: see your data · 🔗 <b>Model</b>: connect tables.<br>On the right are the panes: <b>Visualizations</b>, <b>Data</b> (fields) and <b>Filters</b>.', visual:'pbiui' },
  { type:'quiz', q:'Which tool would you pick for a live dashboard that 50 managers filter themselves?', opts:['A printed Excel sheet','Power BI','Notepad','A PDF'], a:1, why:'Power BI dashboards are interactive, refresh automatically and can be shared securely.' },
  { type:'real', title:'Set up Power BI Desktop', items:['Install "Power BI Desktop" free from the Microsoft Store (Windows)','Download the Lumi Boba dataset (button below)','Home → Get data → Excel workbook → tick all 4 tables → Load','Explore the Table view 👀'], file:'pbi' }
]},
// ------------------------------------------------------------------ PBI 2
{ id:'p2', title:'Power Query: Clean the Mess', mins:8, why:'Analysts spend most of their time cleaning data. Power Query makes cleaning repeatable.', steps:[
  { type:'learn', title:'A robot that remembers', text:'Power Query records every cleaning click as an <b>Applied Step</b>. Next month, new data arrives and you hit <b>Refresh</b>: every step re-runs automatically. No redoing work!', visual:'steps' },
  { type:'pq', title:'Remove junk rows', task:'This export has <b>blank rows</b> and a <b>duplicate</b>. Remove both using the table buttons.', goals:['blank','dup'], solution:[{op:'removeBlank'},{op:'removeDup'}] },
  { type:'pq', title:'Full clean-up', task:'Make this table analysis-ready. Tick every goal on the list.', goals:['blank','dup','trim','proper','number','split'], solution:[{op:'removeBlank'},{op:'trim',col:'Customer'},{op:'proper',col:'Customer'},{op:'removeDup'},{op:'type',col:'Amount',to:'number'},{op:'split',col:'Location',delim:','}] },
  { type:'quiz', q:'Next month\'s file arrives with 500 new messy rows. What do you do?', opts:['Clean it all again by hand','Click Refresh: the Applied Steps re-run','Delete the report','Email IT'], a:1, why:'That\'s the superpower: steps are saved and replayed on refresh.' },
  { type:'real', title:'Try it in Power BI Desktop', items:['Home → Transform data (opens Power Query)','Get data → Text/CSV → Messy_Customers.csv','Remove blank rows, Trim, Capitalize Each Word, Remove duplicates','Change Amount to Decimal Number, Split Location by comma','Close & Apply'], file:'pbi' }
]},
// ------------------------------------------------------------------ PBI 3
{ id:'p3', title:'Data Modeling: Star Schema', mins:7, why:'A good model makes every visual and DAX formula easy. A bad model makes everything wrong.', steps:[
  { type:'learn', title:'Facts and dimensions', text:'<b>Fact</b> table = events with numbers (each sale). <b>Dimension</b> tables = descriptions (product, store, date). Put the fact in the middle and the dimensions around it, and you get a <b>star schema</b> ⭐.', visual:'star' },
  { type:'quiz', q:'Which is the FACT table?', opts:['Products (name, category, price)','Stores (name, city, region)','Sales (date, store, product, qty, revenue)','Calendar (date, month, year)'], a:2, why:'Sales records events with numbers to add up. The others describe those events.' },
  { type:'model', title:'Connect the tables', task:'Create the 3 relationships. Click a key column in <b>Sales</b>, then the matching column in the other table.' },
  { type:'learn', title:'One-to-many (1:*)', text:'One product appears in <b>many</b> sales. Filters flow from the "one" side (Products) <b>to</b> the "many" side (Sales). Click "Milk Tea" in a slicer, and Sales shows only Milk Tea rows.', visual:'flow' },
  { type:'quiz', q:'Products → Sales is one-to-many. A slicer on Products[Category] filters…', opts:['Nothing','Sales rows for that category','Only the Products table','The Calendar'], a:1, why:'Filters flow down the relationship from the one side to the many side.' },
  { type:'real', title:'Try it in Power BI Desktop', items:['Open Model view (left icon 🔗)','Drag Sales[ProductID] onto Products[ProductID]','Do the same for StoreID and Date','Check each line shows 1 and *'], file:'pbi' }
]},
// ------------------------------------------------------------------ PBI 4
{ id:'p4', title:'DAX Basics: Measures', mins:9, why:'DAX measures are the numbers on every dashboard. Writing them is the core Power BI job skill.', steps:[
  { type:'learn', title:'What is a measure?', text:'A <b>measure</b> is a reusable calculation that recalculates for whatever is filtered or selected. You write it once: <code>Total Revenue = SUM(Sales[Revenue])</code>, then use it in any visual.', tip:'Columns are written Table[Column]. Measures are written [Measure Name].' },
  { type:'dax', title:'Your first measure', task:'Create <code>Total Revenue = SUM(Sales[Revenue])</code>', target:'Total Revenue', matrix:['Stores','Region'],
    check:(v, m) => /SUM\s*\(\s*Sales\[Revenue\]/i.test(m.text) && near(v, TOTALS.revenue) ? true : 'Use SUM on the Sales[Revenue] column.', solution:'Total Revenue = SUM(Sales[Revenue])' },
  { type:'dax', title:'Count the orders', task:'Create <code>Total Orders</code>: count the rows of the Sales table with <b>COUNTROWS</b>.', target:'Total Orders', matrix:['Stores','Region'],
    check:(v, m) => /COUNTROWS/i.test(m.text) && v === TOTALS.orders ? true : 'Try: Total Orders = COUNTROWS(Sales)', solution:'Total Orders = COUNTROWS(Sales)' },
  { type:'dax', title:'Average order value', task:'Create <code>Avg Order Value</code> = <b>[Total Revenue] ÷ [Total Orders]</b> using <b>DIVIDE</b>.', target:'Avg Order Value', matrix:['Products','Category'], pre:['Total Revenue = SUM(Sales[Revenue])','Total Orders = COUNTROWS(Sales)'],
    check:(v, m) => /DIVIDE/i.test(m.text) && near(v, TOTALS.revenue / TOTALS.orders) ? true : 'Try: Avg Order Value = DIVIDE([Total Revenue], [Total Orders])', solution:'Avg Order Value = DIVIDE([Total Revenue], [Total Orders])' },
  { type:'quiz', q:'Why use DIVIDE(a, b) instead of a / b?', opts:['It\'s faster to type','It safely returns blank instead of an error when b is 0','It rounds the answer','It only works on text'], a:1, why:'DIVIDE handles divide-by-zero gracefully: no ugly errors on your dashboard.' },
  { type:'dax', title:'Units sold', task:'Create <code>Units Sold</code>: the sum of the <b>Qty</b> column.', target:'Units Sold', matrix:['Products','Category'],
    check:(v, m) => near(v, TOTALS.qty) ? true : 'Sum the Sales[Qty] column.', solution:'Units Sold = SUM(Sales[Qty])' },
  { type:'real', title:'Try it in Power BI Desktop', items:['Table view → Sales table → New measure','Type each measure from this lesson','Drag Total Revenue onto the canvas as a Card visual'], file:'pbi' }
]},
// ------------------------------------------------------------------ PBI 5
{ id:'p5', title:'CALCULATE & Filter Context', mins:9, why:'CALCULATE is the most important DAX function. Understanding filter context is what interviewers probe.', steps:[
  { type:'learn', title:'Filter context', text:'Put <b>[Total Revenue]</b> in a table by Region and each row shows a different number. It\'s the same measure, but each row has a different <b>filter</b> on it. That\'s <b>filter context</b>.', visual:'context' },
  { type:'dax', title:'CALCULATE with a filter', task:'Create <code>West Revenue</code> = Total Revenue, but only for <b>Region = "West"</b>.', target:'West Revenue', matrix:['Products','Category'], pre:['Total Revenue = SUM(Sales[Revenue])'],
    check:(v, m) => /CALCULATE/i.test(m.text) && near(v, TOTALS.west) ? true : 'Try: West Revenue = CALCULATE([Total Revenue], Stores[Region] = "West")', solution:'West Revenue = CALCULATE([Total Revenue], Stores[Region] = "West")' },
  { type:'quiz', q:'CALCULATE([Total Revenue], Stores[Region] = "West") inside a row for Region = East returns…', opts:['East revenue','West revenue: CALCULATE replaces the Region filter','Blank','Total of all regions'], a:1, why:'A filter in CALCULATE on the same column overrides the existing filter.' },
  { type:'dax', title:'% of total with ALL', task:'Create <code>Revenue %</code> = Total Revenue ÷ revenue for <b>ALL</b> stores. Watch the matrix: the regions add up to 100%.', target:'Revenue %', matrix:['Stores','Region'], pct:true, pre:['Total Revenue = SUM(Sales[Revenue])'],
    check:(v, m, M) => /ALL\s*\(/i.test(m.text) && near(v, 1) && near(PBI.evalMeasure(M, m.ast, [{table:'Stores', col:'Region', pred:x => x === 'West'}]), TOTALS.west / TOTALS.revenue) ? true : 'Try: Revenue % = DIVIDE([Total Revenue], CALCULATE([Total Revenue], ALL(Stores)))', solution:'Revenue % = DIVIDE([Total Revenue], CALCULATE([Total Revenue], ALL(Stores)))' },
  { type:'dax', title:'Row-by-row with SUMX', task:'Create <code>Revenue Check</code> = SUMX over Sales of <b>Qty × the product\'s Price</b> (use RELATED).', target:'Revenue Check', matrix:['Products','Category'],
    check:(v, m) => /SUMX/i.test(m.text) && /RELATED/i.test(m.text) && near(v, TOTALS.revenue) ? true : 'Try: Revenue Check = SUMX(Sales, Sales[Qty] * RELATED(Products[Price]))', solution:'Revenue Check = SUMX(Sales, Sales[Qty] * RELATED(Products[Price]))' },
  { type:'real', title:'Try it in Power BI Desktop', items:['Create West Revenue and Revenue % as measures','Make a Matrix visual: Region in Rows, both measures in Values','Format Revenue % as a percentage (Measure tools → %)'], file:'pbi' }
]},
// ------------------------------------------------------------------ PBI 6
{ id:'p6', title:'Visuals & Slicers', mins:8, why:'A clear visual gets your analysis noticed and acted on.', steps:[
  { type:'learn', title:'Build a visual in 3 clicks', text:'1) Pick a visual type. 2) Click a <b>category</b> field (for the axis). 3) Click a <b>measure</b> (for the values). Power BI does the rest.', tip:'Cards for single KPIs, column or bar for comparisons, line for time.' },
  { type:'report', title:'Compare regions', task:'Make a <b>column chart</b> of <b>Total Revenue by Region</b>.', tiles:1,
    check:c => c.tiles.some(t => t.type === 'column' && t.axis === 'Stores.Region' && t.measure === 'Total Revenue') ? true : 'Column chart, axis Region, value Total Revenue.', solution:{tiles:[{type:'column', axis:'Stores.Region', measure:'Total Revenue'}], slicer:'All'} },
  { type:'report', title:'Show the trend', task:'Make a <b>line chart</b> of <b>Total Revenue by Month</b>.', tiles:1,
    check:c => c.tiles.some(t => t.type === 'line' && t.axis === 'Calendar.Month' && t.measure === 'Total Revenue') ? true : 'Line chart, axis Month (Calendar), value Total Revenue.', solution:{tiles:[{type:'line', axis:'Calendar.Month', measure:'Total Revenue'}], slicer:'All'} },
  { type:'learn', title:'Slicers = filters people can click', text:'A <b>slicer</b> is an on-canvas filter. Pick "East" and <b>every</b> visual on the page updates. That\'s what makes Power BI interactive.' },
  { type:'report', title:'KPI card + slicer', task:'Add a <b>Card</b> showing <b>Total Orders</b>, then set the Region slicer to <b>East</b>.', tiles:1,
    check:c => c.tiles.some(t => t.type === 'card' && t.measure === 'Total Orders') && c.slicer === 'East' ? true : 'Card visual with Total Orders, and the slicer set to East.', solution:{tiles:[{type:'card', axis:null, measure:'Total Orders'}], slicer:'East'} },
  { type:'quiz', q:'You want leaders to see this month\'s revenue at a glance. Best visual?', opts:['A 20-column table','A Card with the number','A pie with 12 slices','A scatter plot'], a:1, why:'Cards make one key number pop. Keep detail for drill-down.' },
  { type:'real', title:'Try it in Power BI Desktop', items:['Report view: add a Card, a Column chart and a Line chart','Add a Slicer with Stores[Region]','Click a column in a chart and watch the others cross-filter ✨'], file:'pbi' }
]},
// ------------------------------------------------------------------ PBI 7
{ id:'p7', title:'Dashboard Design & Sharing', mins:8, why:'Your final project! A clean, shared dashboard is the portfolio piece that gets interviews.', steps:[
  { type:'learn', title:'The 5-second rule', text:'A viewer should get the main message in 5 seconds.<br>• KPIs (cards) across the <b>top-left</b><br>• Max 4 to 6 visuals per page<br>• One colour for "normal", one accent for "look here"<br>• Titles that state the insight: "West leads revenue"', visual:'layout' },
  { type:'quiz', q:'Which dashboard is better?', opts:['12 visuals, rainbow colours, no titles','3 KPI cards on top, 2 charts below, clear titles','One giant table','A pie for every metric'], a:1, why:'Less is more: clear hierarchy and clear titles.' },
  { type:'report', title:'Final project: mini dashboard', task:'Build a 3-visual dashboard: a <b>Card</b> (Total Revenue), a <b>column chart</b> of revenue by <b>Category</b>, and a <b>line chart</b> of revenue by <b>Month</b>.', tiles:3,
    check:c => { const has = (ty, ax, me) => c.tiles.some(t => t.type === ty && (ax === null || t.axis === ax) && t.measure === me);
      return !has('card', null, 'Total Revenue') ? 'Missing: a Card with Total Revenue.' : !has('column', 'Products.Category', 'Total Revenue') ? 'Missing: a column chart of Total Revenue by Category.' : !has('line', 'Calendar.Month', 'Total Revenue') ? 'Missing: a line chart of Total Revenue by Month.' : true; },
    solution:{tiles:[{type:'card', axis:null, measure:'Total Revenue'},{type:'column', axis:'Products.Category', measure:'Total Revenue'},{type:'line', axis:'Calendar.Month', measure:'Total Revenue'}], slicer:'All'} },
  { type:'order', title:'Publish & share', task:'Put the sharing steps in order.', items:['Save the .pbix file','Home → Publish to a workspace','Open it in the Power BI Service','Set scheduled refresh','Share with your team or build an App'] },
  { type:'learn', title:'Row-level security (RLS)', text:'RLS shows each person only <b>their</b> data. For example, the West manager sees West rows only. You define roles in Desktop (Modeling → Manage roles) and assign people in the Service.', tip:'Interviewers love asking: "How would you restrict data by region?" The answer is RLS.' },
  { type:'real', title:'Portfolio project 🏆', items:['In Power BI Desktop build: 3 KPI cards, a revenue-by-month line, revenue by category, a Region slicer','Add a title stating the key insight','Screenshot it for your résumé or LinkedIn','Optional: publish to the free Power BI Service'], file:'pbi' }
]}
]}
];

// totals used by DAX checks (computed once data loads)
const TOTALS = {};

// ===== Brain-break games (unlock after every 2 lessons of a track) =====
const GAMES = [
  { id:'g1', track:'excel', after:2, title:'Shortcut Snap', kind:'memory', desc:'Match each Excel shortcut to what it does.', pairs:[['Ctrl+T','Make a Table'],['Ctrl+D','Fill down'],['F4','Lock with $'],['Alt+=','AutoSum'],['Ctrl+Z','Undo'],['Ctrl+E','Flash Fill']] },
  { id:'g2', track:'excel', after:4, title:'Formula Fixer', kind:'mcq', desc:'Each formula is broken. Pick the fix. 6 quick rounds.', rounds:[
    { q:'=SUM(B2:B6 shows an error', opts:['=SUM(B2:B6)','=SUM B2:B6','=SUM[B2:B6]'], a:0 },
    { q:'=IF(C2>100,Big,Small) shows #NAME?', opts:['=IF(C2>100,"Big","Small")','=IF(C2>100;Big;Small)','=IF("C2>100",Big,Small)'], a:0 },
    { q:'Fill-down tax formula is wrong below row 2: =B2*E1', opts:['=B2*$E$1','=$B$2*E1','=B2*E$1$'], a:0 },
    { q:'=B2/C2 shows #DIV/0!', opts:['=IFERROR(B2/C2,0)','=B2\\C2','=DIVIDE(B2,C2)'], a:0 },
    { q:'Text shows instead of a result: SUM(A1:A5)', opts:['=SUM(A1:A5)','SUM=(A1:A5)','"SUM(A1:A5)"'], a:0 },
    { q:'VLOOKUP returns a wrong but close match', opts:['Add FALSE as the 4th argument','Add TRUE','Sort the sheet randomly'], a:0 } ] },
  { id:'g3', track:'excel', after:6, title:'Lookup Lightning', kind:'blitz', desc:'True or false? 45 seconds, as many as you can.', secs:45, items:[
    ['XLOOKUP can look to the left.', true], ['VLOOKUP with FALSE means exact match.', true], ['SUMIF adds cells that meet a condition.', true], ['COUNT counts text cells.', false],
    ['$A$1 changes when you fill down.', false], ['TRIM removes extra spaces.', true], ['=PROPER("hi you") gives "Hi You".', true], ['IFERROR fixes the cause of an error.', false],
    ['INDEX+MATCH works in older Excel versions.', true], ['SUMIFS puts the sum range first.', true], ['Criteria like >100 need quotes in COUNTIF.', true], ['A pie chart is best for trends.', false] ] },
  { id:'g4', track:'excel', after:8, title:'Chart Matchmaker', kind:'mcq', desc:'Pick the best chart for each situation.', rounds:[
    { q:'Monthly revenue over 2 years', opts:['Line','Pie','Card'], a:0 }, { q:'Share of sales by 3 channels', opts:['Pie / donut','Line','Scatter'], a:0 },
    { q:'Revenue for 15 products with long names', opts:['Horizontal bar','Pie','Line'], a:0 }, { q:'This quarter\'s total profit', opts:['Card / KPI','Line','Bar'], a:0 },
    { q:'Compare 4 regions', opts:['Column','Pie with 4 shades of grey','Line'], a:0 } ] },
  { id:'g5', track:'pbi', after:2, title:'Pipeline Puzzle', kind:'order', desc:'Rebuild each Power BI pipeline in the right order.', rounds:[
    ['Get data','Power Query','Model','DAX','Visuals','Publish'], ['Remove blank rows','Trim text','Change data type','Close & Apply'] ] },
  { id:'g6', track:'pbi', after:4, title:'DAX Detective', kind:'mcq', desc:'Which DAX does the job?', rounds:[
    { q:'Count the rows in Sales', opts:['COUNTROWS(Sales)','SUM(Sales)','COUNT(Sales)'], a:0 }, { q:'Unique number of customers', opts:['DISTINCTCOUNT(Sales[CustomerID])','COUNT(Sales[CustomerID])','SUM(Sales[CustomerID])'], a:0 },
    { q:'Safe division', opts:['DIVIDE([A],[B])','[A]/[B]/0','IFERROR([A]/[B])'], a:0 }, { q:'Revenue for West only', opts:['CALCULATE([Revenue], Stores[Region]="West")','SUM(West)','FILTER([Revenue])'], a:0 },
    { q:'Price from the Products table inside SUMX on Sales', opts:['RELATED(Products[Price])','LOOKUP(Price)','Products.Price'], a:0 } ] },
  { id:'g7', track:'pbi', after:6, title:'Visual Vibes', kind:'blitz', desc:'True or false: 45 seconds of Power BI facts.', secs:45, items:[
    ['Slicers filter other visuals on the page.', true], ['A star schema has the fact table in the middle.', true], ['Measures are stored row by row like columns.', false], ['Power Query steps re-run on refresh.', true],
    ['Filters flow from the many side to the one side by default.', false], ['DIVIDE handles divide-by-zero.', true], ['A Card shows one big number.', true], ['RLS stands for Row-Level Security.', true],
    ['CALCULATE can change filter context.', true], ['Power BI Desktop is free.', true], ['Pie charts work best with 12+ slices.', false], ['ALL() removes filters.', true] ] }
];

// ===== ADHD-friendly break ideas =====
const BREAKS = [
  { icon:'🫁', title:'Box breathing', text:'Breathe in 4 · hold 4 · out 4 · hold 4. Follow the circle.', kind:'breath' },
  { icon:'🙆', title:'Stretch it out', text:'Roll your shoulders 5 times, reach for the ceiling, then twist gently left and right.', kind:'timer' },
  { icon:'💧', title:'Water + walk', text:'Grab a glass of water and walk to the window and back. No phone!', kind:'timer' },
  { icon:'🎵', title:'One song', text:'Play exactly one favourite song, then come back. You\'ve earned it.', kind:'timer' }
];
