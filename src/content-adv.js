// ===== Lumi's Data Lab: advanced lessons (Excel 9-13, Power BI 8-13) =====
const XT = TRACKS.find(t => t.id === 'excel'), PT = TRACKS.find(t => t.id === 'pbi');
const spillCheck = (s, cells) => { for(const [a, e] of Object.entries(cells)){ const v = V(s, a); if(XL.isErr(v)) return `${a} shows ${v}.`; if(typeof e === 'number' ? !near(v, e) : String(v) !== String(e)) return `${a} shows "${XL.fmt(v)}" but should be "${e}".`; } return true; };
const SALESREP = G([['Rep','Region','Sales'],['Aisha','West',820],['Ben','East',640],['Chloe','West',910],['Dev','South',450],['Ema','East',700],['Finn','Midwest',530],['Gia','West',610],['Hao','South',380]]);

XT.lessons.push(
// ------------------------------------------------------------------ EXCEL 9
{ id:'x9', title:'Dates & Number Formats', mins:9, why:'Due dates, tenure, "last month" and tidy labels show up in every business report.', steps:[
  { type:'learn', title:'Dates are secretly numbers', text:'Excel stores each date as a <b>number of days since 1900</b>. 1 Jan 2025 is really 45658. That\'s why you can subtract dates to get days, and why formatting only changes how a date <i>looks</i>, never its value.', tip:'If a date shows as 45658, just change the cell format to Date.' },
  { type:'sheet', title:'Days to ship', task:'In <b>C2:C5</b>, calculate how many days each order took to ship: <b>Ship date − Order date</b>.', cells:G([['Order date','Ship date','Days'],['2025-03-03','2025-03-07'],['2025-03-10','2025-03-18'],['2025-03-14','2025-03-17'],['2025-03-20','2025-04-01']]), cols:3, rows:6, select:'C2',
    check:s => colCheck(s, 'C', 2, 5, r => [0,0,4,8,3,12][r]), solution:{C2:'=B2-A2',C3:'=B3-A3',C4:'=B4-A4',C5:'=B5-A5'}, hint:'=B2-A2, then fill down.' },
  { type:'sheet', title:'Month-end due dates', task:'Invoices are due on the <b>last day of the month</b>. In <b>B2:B4</b> use <code>=EOMONTH(A2,0)</code>.', cells:G([['Invoice date','Due date'],['2025-01-15'],['2025-02-03'],['2024-02-10']]), cols:2, rows:5, select:'B2',
    check:s => !/EOMONTH/.test(F(s,'B2')) ? 'Use EOMONTH in B2.' : colCheck(s, 'B', 2, 4, r => ['','','2025-01-31','2025-02-28','2024-02-29'][r]), solution:{B2:'=EOMONTH(A2,0)',B3:'=EOMONTH(A3,0)',B4:'=EOMONTH(A4,0)'}, hint:'=EOMONTH(A2,0). The 0 means "this month". Try 1 for next month.' },
  { type:'learn', title:'Handy date functions', text:'<code>DATEDIF(start, end, "y")</code> gives whole years between two dates (also "m" and "d") · <code>NETWORKDAYS(start, end)</code> counts working days · <code>EDATE(date, 3)</code> is 3 months later · <code>DATE(2025,12,31)</code> builds a date · <code>TODAY()</code> is today.', tip:'DATEDIF is hidden: it won\'t show up in autocomplete, but it works!' },
  { type:'sheet', title:'Years of service', task:'In <b>C2:C4</b>, calculate full <b>years of service</b> at 31 Dec 2025: <code>=DATEDIF(B2, DATE(2025,12,31), "y")</code>.', cells:G([['Name','Hire date','Years'],['Maya','2016-03-01'],['Aisha','2020-01-10'],['Grace','2023-02-14']]), cols:3, rows:5, select:'C2',
    check:s => !/DATEDIF/.test(F(s,'C2')) ? 'Use DATEDIF in C2.' : colCheck(s, 'C', 2, 4, r => [0,0,9,5,2][r]), solution:{C2:'=DATEDIF(B2,DATE(2025,12,31),"y")',C3:'=DATEDIF(B3,DATE(2025,12,31),"y")',C4:'=DATEDIF(B4,DATE(2025,12,31),"y")'}, hint:'=DATEDIF(B2,DATE(2025,12,31),"y")' },
  { type:'sheet', title:'Labels with TEXT', task:'In <b>C2:C3</b> build labels like <b>Jan 2025: $2,633</b>:<br><code>=TEXT(A2,"mmm yyyy")&": "&TEXT(B2,"$#,##0")</code>', cells:G([['Month','Revenue','Label'],['2025-01-01',2633.25],['2025-02-01',4897.5]]), cols:3, rows:4, select:'C2',
    check:s => colCheck(s, 'C', 2, 3, r => ['','','Jan 2025: $2,633','Feb 2025: $4,898'][r]), solution:{C2:'=TEXT(A2,"mmm yyyy")&": "&TEXT(B2,"$#,##0")',C3:'=TEXT(A3,"mmm yyyy")&": "&TEXT(B3,"$#,##0")'}, hint:'TEXT(date,"mmm yyyy") and TEXT(number,"$#,##0"), joined with &' },
  { type:'quiz', q:'You format a cell showing 45658 as a Date. What changes?', opts:['The value becomes text','Only how it looks: it is still 45658 underneath','It rounds the number','It becomes a formula'], a:1, why:'Formatting changes appearance only. The underlying value stays the same, so the math keeps working.' },
  { type:'real', title:'Try it in real Excel', items:['Open sheet "9 Dates"','Use Ctrl+1 → Number → Date / Custom to try formats like mmm-yy','Try NETWORKDAYS for working days to ship'], file:'excel' }
]},
// ------------------------------------------------------------------ EXCEL 10
{ id:'x10', title:'Dynamic Arrays: FILTER, SORT, UNIQUE', mins:8, why:'Modern Excel (365) formulas replace hours of manual filtering, and interviewers increasingly expect them.', steps:[
  { type:'learn', title:'One formula, many cells', text:'Some formulas return a whole list. Excel <b>spills</b> the results into the cells below and to the right. Write the formula once in the top-left cell, and the blue-tinted cells fill themselves.', tip:'If something is blocking the spill area, you get <b>#SPILL!</b>. Clear those cells.' },
  { type:'sheet', title:'Unique regions', task:'In <b>E2</b>, list each region once: <code>=UNIQUE(B2:B9)</code>.', cells:SALESREP, cols:7, rows:10, select:'E2',
    check:s => !/UNIQUE\(/.test(F(s,'E2')) ? 'Use =UNIQUE(B2:B9) in E2.' : spillCheck(s, {E2:'West', E3:'East', E4:'South', E5:'Midwest'}), solution:{E2:'=UNIQUE(B2:B9)'}, hint:'=UNIQUE(B2:B9)' },
  { type:'sheet', title:'FILTER a region', task:'In <b>E2</b>, show every row (Rep, Region, Sales) where Region is <b>West</b>:<br><code>=FILTER(A2:C9, B2:B9="West")</code>', cells:SALESREP, cols:7, rows:10, select:'E2',
    check:s => !/FILTER\(/.test(F(s,'E2')) ? 'Use FILTER in E2.' : spillCheck(s, {E2:'Aisha', E3:'Chloe', E4:'Gia', G2:820, G3:910, G4:610}), solution:{E2:'=FILTER(A2:C9,B2:B9="West")'}, hint:'=FILTER(A2:C9,B2:B9="West")' },
  { type:'sheet', title:'Top sellers, sorted', task:'In <b>E2</b>, show reps with Sales ≥ <b>600</b>, sorted by Sales <b>largest first</b>:<br><code>=SORT(FILTER(A2:C9, C2:C9>=600), 3, -1)</code>', cells:SALESREP, cols:7, rows:10, select:'E2',
    check:s => !/SORT/.test(F(s,'E2')) ? 'Wrap FILTER inside SORT.' : spillCheck(s, {E2:'Chloe', E3:'Aisha', E4:'Ema', E5:'Ben', E6:'Gia', G2:910, G6:610}), solution:{E2:'=SORT(FILTER(A2:C9,C2:C9>=600),3,-1)'}, hint:'3 = sort by the 3rd column, -1 = descending.' },
  { type:'quiz', q:'Your FILTER formula shows #SPILL!. Most likely cause?', opts:['The data has an error','Cells where the results need to go already contain something','FILTER is not supported','The criteria is wrong'], a:1, why:'Spilled results need empty cells. Clear the blocking cells and the results appear.' },
  { type:'sheet', title:'Array math: SUMPRODUCT', task:'In <b>F1</b>, get total revenue (Cups × Price, summed) in <b>one formula</b>: <code>=SUMPRODUCT(B2:B6,C2:C6)</code>.', cells:{...G(BOBA.map(r => r.slice(0,3))), E1:'Total revenue'}, cols:6, rows:7, select:'F1',
    check:s => !/SUMPRODUCT|SUM\(/.test(F(s,'F1')) ? 'Use SUMPRODUCT in F1.' : near(V(s,'F1'), 758.5) ? true : 'F1 should be 758.5.', solution:{F1:'=SUMPRODUCT(B2:B6,C2:C6)'}, hint:'=SUMPRODUCT(B2:B6,C2:C6). In Excel 365, =SUM(B2:B6*C2:C6) works too!' },
  { type:'real', title:'Try it in real Excel 365', items:['Open sheet "10 Dynamic Arrays"','Build a live "Top performers" list with SORT(FILTER(...))','Add a dropdown for region and make FILTER use it'], file:'excel' }
]},
// ------------------------------------------------------------------ EXCEL 11
{ id:'x11', title:'Names, LET & What-If Analysis', mins:9, why:'Clean, readable models and "what price do we need?" answers are what finance and ops managers value.', steps:[
  { type:'learn', title:'Dropdowns with Data Validation', text:'<b>Data → Data Validation → List</b> turns a cell into a dropdown so people can only pick allowed values (like West / East / South). It stops typos before they break your formulas.', tip:'Point the list at a range (e.g. =$H$2:$H$5) so you can update options later.' },
  { type:'learn', title:'Named ranges', text:'Give a cell a name like <b>TaxRate</b> (type it in the Name Box, left of the formula bar). Then write <code>=B3*TaxRate</code> instead of <code>=B3*$B$1</code>. It\'s easier to read, and automatically absolute.' },
  { type:'sheet', title:'Use a named range', task:'B1 is named <b>TaxRate</b>. In <b>C3:C5</b>, calculate tax with <code>=B3*TaxRate</code>.', names:{TaxRate:'B1'}, cells:G([['Tax rate',0.08],['Product','Revenue','Tax'],['Classic Milk Tea',220],['Taro Milk Tea',150],['Brown Sugar Boba',208]]), cols:3, rows:6, select:'C3',
    check:s => !/TAXRATE/.test(F(s,'C3')) ? 'Use the name TaxRate in your formula.' : colCheck(s, 'C', 3, 5, r => [0,0,0,17.6,12,16.64][r]), solution:{C3:'=B3*TaxRate',C4:'=B4*TaxRate',C5:'=B5*TaxRate'}, hint:'=B3*TaxRate, then fill down. No $ needed!' },
  { type:'sheet', title:'LET: name the steps', task:'In <b>C2:C4</b>, calculate margin % with LET: <code>=LET(profit, A2-B2, profit/A2)</code>.', cells:G([['Revenue','Cost','Margin %'],[1000,650],[800,600],[1200,900]]), cols:3, rows:5, select:'C2',
    check:s => !/LET\(/.test(F(s,'C2')) ? 'Use LET in C2.' : colCheck(s, 'C', 2, 4, r => [0,0,0.35,0.25,0.25][r]), solution:{C2:'=LET(profit,A2-B2,profit/A2)',C3:'=LET(profit,A3-B3,profit/A3)',C4:'=LET(profit,A4-B4,profit/A4)'}, hint:'=LET(profit,A2-B2,profit/A2)' },
  { type:'learn', title:'Goal Seek: work backwards', text:'You know the answer you want, but not the input. <b>Goal Seek</b> (Data → What-If Analysis) changes one input cell until a formula hits your target. "What price gives us $1,500 profit?"', tip:'Scenario Manager compares a few named cases. Data Tables show many inputs at once.' },
  { type:'sheet', title:'What price do we need?', task:'Profit in B5 is currently negative. Use <b>🎯 Goal Seek</b> to make <b>B5 = 1500</b> by changing the <b>price in B1</b>.', goalseek:true, cells:G([['Price',4],['Cups sold',400],['Cost per cup',2.1],['Fixed costs',900],['Profit','=B2*(B1-B3)-B4']]), cols:2, rows:6, select:'B5',
    check:s => F(s,'B1') ? 'B1 should be a number, not a formula. Let Goal Seek change it.' : Math.abs(V(s,'B5') - 1500) < 0.5 ? true : 'B5 isn\'t 1500 yet. Click 🎯 Goal Seek: Set B5, To 1500, By changing B1.', solution:{B1:'8.1'}, hint:'Goal Seek → Set cell B5 · To value 1500 · By changing B1.' },
  { type:'quiz', q:'Your manager asks: "What if price is 5, 6, 7 or 8, and cups are 300, 400 or 500?" Best tool?', opts:['Goal Seek','A two-variable Data Table','VLOOKUP','Conditional formatting'], a:1, why:'Data Tables show results for many input combinations at once. Goal Seek finds one input for one target.' },
  { type:'real', title:'Try it in real Excel', items:['Open sheet "11 What-If"','Name B1 "TaxRate" in the Name Box','Data → What-If Analysis → Goal Seek for a profit of 1,500'], file:'excel' }
]},
// ------------------------------------------------------------------ EXCEL 12
{ id:'x12', title:'Build an Excel Dashboard', mins:10, why:'A one-page dashboard is the best Excel portfolio piece, and a common take-home assignment.', steps:[
  { type:'learn', title:'Power Query lives in Excel too', text:'<b>Data → Get Data</b> opens the same Power Query editor as Power BI. Load and clean CSVs, folders or databases, and hit <b>Refresh</b> next month. Everything you learn in the Power BI track works here too.' },
  { type:'sheet', title:'KPI: year-over-year growth', task:'<b>F1</b>: growth from 2024 to 2025 = <code>(B3-B2)/B2</code>.<br><b>F2</b>: a label like <b>14.7%</b> with <code>=TEXT(F1,"0.0%")</code>.', cells:G([['Year','Revenue','','','YoY growth'],[2024,29955,'','','Label'],[2025,34373.25]]), cols:6, rows:4, select:'F1',
    check:s => Math.abs(V(s,'F1') - 0.14749624) > 0.0005 ? 'F1 should be (B3-B2)/B2 ≈ 0.1475.' : V(s,'F2') !== '14.7%' ? 'F2 should show 14.7%. Use =TEXT(F1,"0.0%")' : true, solution:{F1:'=(B3-B2)/B2', F2:'=TEXT(F1,"0.0%")'}, hint:'=(B3-B2)/B2, then =TEXT(F1,"0.0%")' },
  { type:'pivot', title:'Pivot: region × category', task:'<b>Region</b> in Rows, <b>Category</b> in Columns, <b>Sum of Revenue</b> in Values.',
    check:c => c.rows.join() === 'Region' && c.cols.join() === 'Category' && c.val === 'Revenue' && c.agg === 'Sum' ? true : 'Rows: Region, Columns: Category, Values: Sum of Revenue.', solution:{rows:['Region'], cols:['Category'], val:'Revenue', agg:'Sum'} },
  { type:'chart', title:'Compare categories', task:'Chart <b>revenue by Category</b> so the categories are easy to compare.',
    check:c => c.axis !== 'Category' ? 'Put Category on the axis.' : ['column','bar'].includes(c.type) ? true : 'To compare a few categories, use a column or bar chart.', solution:{type:'column', axis:'Category'} },
  { type:'order', title:'Dashboard build order', task:'Tap the steps in a sensible order.', items:['Load data as a Table (or via Power Query)','Build PivotTables on a hidden "calc" sheet','Add PivotCharts and KPI cells','Add Slicers and a Timeline','Arrange on one page, hide gridlines'] },
  { type:'learn', title:'Dashboard polish checklist', text:'• KPIs top-left, biggest number biggest<br>• One slicer connected to <b>all</b> pivots (Report Connections)<br>• Same number format everywhere ($#,##0)<br>• Titles that state the insight<br>• View → uncheck Gridlines; freeze the header row' },
  { type:'real', title:'Build it for real 🏆', items:['Open sheet "12 Dashboard Data" (2 years of sales)','Make 3 PivotTables + 2 PivotCharts on a "Dashboard" sheet','Add a Region slicer and a Date timeline connected to all pivots','Add YoY growth KPI cells','Screenshot it for your portfolio!'], file:'excel' }
]},
// ------------------------------------------------------------------ EXCEL 13
{ id:'x13', title:'Excel Skills Test', mins:12, why:'Many employers send a 20-minute Excel test. This is practice in that exact style: no new teaching, just doing.', steps:[
  { type:'learn', title:'Test time! 📝', text:'Six tasks like a real hiring assessment. Hints are there if you need them. Work at your own pace: no timer here, but notice which tasks feel slow and revisit those lessons.' },
  { type:'sheet', title:'Task 1 · Lookup', task:'In <b>B2:B4</b>, return each store\'s <b>City</b> from the table in E1:F7 (any lookup function).', cells:{...G([['Store','City'],['Riverside'],['Uptown'],['Lakeside']]), ...G([[null,null,null,null,'Store','City'],[null,null,null,null,'Downtown','Seattle'],[null,null,null,null,'Lakeside','Chicago'],[null,null,null,null,'Harbor','Boston'],[null,null,null,null,'Sunset','San Diego'],[null,null,null,null,'Uptown','New York'],[null,null,null,null,'Riverside','Austin']])}, cols:6, rows:8, select:'B2',
    check:s => colCheck(s, 'B', 2, 4, r => ['','','Austin','New York','Chicago'][r]), solution:{B2:'=XLOOKUP(A2,$E$2:$E$7,$F$2:$F$7)',B3:'=XLOOKUP(A3,$E$2:$E$7,$F$2:$F$7)',B4:'=XLOOKUP(A4,$E$2:$E$7,$F$2:$F$7)'}, hint:'=XLOOKUP(A2,$E$2:$E$7,$F$2:$F$7)' },
  { type:'sheet', title:'Task 2 · Conditional totals', task:'<b>F1</b>: total revenue for <b>East</b> + <b>Snacks</b>. <b>F2</b>: number of orders in <b>West</b> over <b>100</b>.', cells:G([['Region','Category','Revenue','','East Snacks'],['West','Milk Tea',120,'','West >100 count'],['East','Snacks',45],['West','Fruit Tea',88],['East','Snacks',150],['West','Milk Tea',210],['East','Milk Tea',95],['West','Snacks',132]]), cols:6, rows:9, select:'F1',
    check:s => !near(V(s,'F1'), 195) ? 'F1 should be 195 (SUMIFS on Region and Category).' : V(s,'F2') !== 3 ? 'F2 should be 3 (COUNTIFS on Region and Revenue).' : true, solution:{F1:'=SUMIFS(C2:C8,A2:A8,"East",B2:B8,"Snacks")',F2:'=COUNTIFS(A2:A8,"West",C2:C8,">100")'}, hint:'SUMIFS(sum, range1, crit1, range2, crit2) and COUNTIFS(range1, crit1, range2, crit2)' },
  { type:'sheet', title:'Task 3 · Tiers', task:'In <b>C2:C5</b>: "Gold" if Sales ≥ 800, "Silver" if ≥ 500, otherwise "Bronze".', cells:G([['Rep','Sales','Tier'],['Aisha',820],['Ben',640],['Dev',450],['Chloe',910]]), cols:3, rows:6, select:'C2',
    check:s => colCheck(s, 'C', 2, 5, r => ['','','Gold','Silver','Bronze','Gold'][r]), solution:{C2:'=IFS(B2>=800,"Gold",B2>=500,"Silver",TRUE,"Bronze")',C3:'=IFS(B3>=800,"Gold",B3>=500,"Silver",TRUE,"Bronze")',C4:'=IFS(B4>=800,"Gold",B4>=500,"Silver",TRUE,"Bronze")',C5:'=IFS(B5>=800,"Gold",B5>=500,"Silver",TRUE,"Bronze")'}, hint:'Nested IF or IFS: check the highest tier first.' },
  { type:'sheet', title:'Task 4 · Clean & label', task:'In <b>C2:C3</b>, make labels like <b>Ana Lopez (2025-03)</b>: a clean name, then the year-month of the date.', cells:G([['Name','Date','Label'],['  ana LOPEZ ','2025-03-14'],['BEN carter','2025-11-02']]), cols:3, rows:4, select:'C2',
    check:s => colCheck(s, 'C', 2, 3, r => ['','','Ana Lopez (2025-03)','Ben Carter (2025-11)'][r]), solution:{C2:'=PROPER(TRIM(A2))&" ("&TEXT(B2,"yyyy-mm")&")"',C3:'=PROPER(TRIM(A3))&" ("&TEXT(B3,"yyyy-mm")&")"'}, hint:'=PROPER(TRIM(A2))&" ("&TEXT(B2,"yyyy-mm")&")"' },
  { type:'pivot', title:'Task 5 · Pivot', task:'Count of orders (<b>OrderID</b>, Count) by <b>Store</b>.',
    check:c => c.rows.join() === 'Store' && c.val === 'OrderID' && c.agg === 'Count' ? true : 'Rows: Store. Values: OrderID with Count.', solution:{rows:['Store'], cols:[], val:'OrderID', agg:'Count'} },
  { type:'quiz', q:'Why might an interviewer prefer XLOOKUP or INDEX/MATCH over VLOOKUP?', opts:['VLOOKUP is slower to type','VLOOKUP can\'t look left and breaks if columns are inserted','VLOOKUP doesn\'t work with numbers','They are identical'], a:1, why:'VLOOKUP uses a hard-coded column number and only looks right. XLOOKUP and INDEX/MATCH avoid both problems.' },
  { type:'real', title:'Take the full test in Excel', items:['Open sheet "13 Skills Test" (10 tasks)','Set a 20-minute timer and go','Check yourself against the Answers sheet'], file:'excel' }
]}
);

// ===================== POWER BI =====================
const yr = y => [{table:'Calendar', col:'Year', pred:v => v === y}];
PT.lessons.push(
// ------------------------------------------------------------------ PBI 8
{ id:'p8', title:'Power Query Pro: Shape Data', mins:9, why:'Real data comes wide, split across files, or missing lookups. Reshaping it is a daily BI task.', steps:[
  { type:'learn', title:'Four power moves', text:'<b>Unpivot</b>: wide → long (month columns become rows) · <b>Append</b>: stack tables with the same columns (Q1 + Q2) · <b>Merge</b>: bring in columns from another table, like a lookup or join · <b>Group By</b>: summarize rows.', tip:'Power BI loves long, narrow tables: one row per fact.' },
  { type:'pq', title:'Unpivot the budget', task:'This budget has one column per month. Select <b>Store</b>, click <b>Unpivot other columns</b>, then rename Attribute → <b>Month</b> and Value → <b>Budget</b>.', data:'wide', ops:['unpivot','rename'],
    goalFns:[['One row per store per month (12 rows)', s => s.rows.length === 12], ['Columns: Store, Month, Budget', s => s.cols.map(c => c.name).join() === 'Store,Month,Budget']],
    solution:[{op:'unpivot', keep:['Store']},{op:'rename', col:'Attribute', to:'Month'},{op:'rename', col:'Value', to:'Budget'}] },
  { type:'pq', title:'Append Q1 + Q2', task:'Stack the Q2 orders under Q1 with <b>Append Q2</b>.', data:'q1', ops:['append'], extra:'q2',
    goalFns:[['All 9 orders in one table', s => s.rows.length === 9], ['No duplicates', s => new Set(s.rows.map(r => r.OrderID)).size === s.rows.length]],
    solution:[{op:'append'}] },
  { type:'pq', title:'Merge in the Region', task:'Orders only have StoreID. Use <b>Merge with Stores</b> to bring in each order\'s <b>Region</b>.', data:'orders', ops:['merge'],
    goalFns:[['Region column added', s => s.cols.some(c => c.name === 'Region')], ['Every order has a region', s => s.rows.every(r => r.Region)]],
    solution:[{op:'merge'}] },
  { type:'pq', title:'Group By region', task:'Select <b>Region</b>, then <b>Group By → Sum of Amount</b>.', data:'byregion', ops:['group'],
    goalFns:[['One row per region (4)', s => s.rows.length === 4 && s.cols[0].name === 'Region'], ['Total column = sum of Amount', s => s.rows.some(r => r.Region === 'West' && r.Total === 133)]],
    solution:[{op:'group', col:'Region'}] },
  { type:'quiz', q:'Jan and Feb sales are in two files with identical columns. Which operation?', opts:['Merge','Append','Unpivot','Group By'], a:1, why:'Append stacks rows with the same columns. Merge adds columns by matching a key.' },
  { type:'real', title:'Try it in Power BI Desktop', items:['Get data → Text/CSV → Budget_Wide.csv → Transform','Select Store → Transform → Unpivot Other Columns','Load Orders_Q1.csv + Orders_Q2.csv → Home → Append Queries','Home → Merge Queries to add Region from the Stores table'], file:'pbi' }
]},
// ------------------------------------------------------------------ PBI 9
{ id:'p9', title:'Time Intelligence', mins:10, why:'"YTD", "vs last year" and "month over month" are on almost every executive dashboard.', steps:[
  { type:'learn', title:'You need a date table', text:'Time intelligence functions need a <b>Calendar</b> table with one row per day, no gaps, connected to your facts. In Power BI: select it → <b>Mark as date table</b>. Ours has every day of 2024 and 2025.', tip:'Create one with DAX: Calendar = CALENDARAUTO(), or build it in Power Query.' },
  { type:'dax', title:'Year-to-date', task:'Create <code>Revenue YTD = TOTALYTD([Total Revenue], Calendar[Date])</code>. The matrix shows 2025 by month: watch it build up.', target:'Revenue YTD', matrix:['Calendar','Month'], year:2025, pre:['Total Revenue = SUM(Sales[Revenue])'], auto:true, need:/TOTALYTD|DATESYTD/i,
    solution:'Revenue YTD = TOTALYTD([Total Revenue], Calendar[Date])' },
  { type:'dax', title:'Same period last year', task:'Create <code>Revenue LY</code> = Total Revenue, shifted back one year with <b>SAMEPERIODLASTYEAR</b>.', target:'Revenue LY', matrix:['Calendar','Month'], year:2025, pre:['Total Revenue = SUM(Sales[Revenue])'], auto:true, need:/SAMEPERIODLASTYEAR|DATEADD/i,
    solution:'Revenue LY = CALCULATE([Total Revenue], SAMEPERIODLASTYEAR(Calendar[Date]))' },
  { type:'dax', title:'YoY growth %', task:'Create <code>YoY %</code> = (Total Revenue − Revenue LY) ÷ Revenue LY. Use <b>DIVIDE</b>.', target:'YoY %', matrix:['Calendar','Month'], year:2025, pct:true, pre:['Total Revenue = SUM(Sales[Revenue])','Revenue LY = CALCULATE([Total Revenue], SAMEPERIODLASTYEAR(Calendar[Date]))'], auto:true, need:/DIVIDE/i,
    solution:'YoY % = DIVIDE([Total Revenue] - [Revenue LY], [Revenue LY])' },
  { type:'dax', title:'Previous month', task:'Create <code>Revenue PM</code> with <code>DATEADD(Calendar[Date], -1, MONTH)</code> inside CALCULATE.', target:'Revenue PM', matrix:['Calendar','Month'], year:2025, pre:['Total Revenue = SUM(Sales[Revenue])'], auto:true, need:/DATEADD|PREVIOUSMONTH/i,
    solution:'Revenue PM = CALCULATE([Total Revenue], DATEADD(Calendar[Date], -1, MONTH))' },
  { type:'quiz', q:'TOTALYTD returns blanks or nonsense. The most common cause?', opts:['Too many visuals','No proper date table (gaps, or not marked as date table)','Wrong colours','The measure name has spaces'], a:1, why:'Time intelligence needs a continuous Calendar table related to your facts and marked as a date table.' },
  { type:'real', title:'Try it in Power BI Desktop', items:['Table view → Calendar → Mark as date table','Create Revenue YTD, Revenue LY, YoY % and Revenue PM','Matrix: Year and Month in Rows, the four measures in Values','Format YoY % as a percentage with 1 decimal'], file:'pbi' }
]},
// ------------------------------------------------------------------ PBI 10
{ id:'p10', title:'Advanced DAX: Context, VAR & FILTER', mins:10, why:'Row vs filter context, variables and FILTER separate beginners from strong BI candidates.', steps:[
  { type:'learn', title:'Row context vs filter context', text:'<b>Calculated column</b>: computed once per row when data loads, using <b>row context</b> ("this row\'s Revenue"). <b>Measure</b>: computed on the fly for whatever is filtered (<b>filter context</b>). Use columns to slice or filter by; use measures for numbers.' },
  { type:'calccol', title:'A calculated column', task:'In the <b>Sales</b> table, create <code>Size = IF(Sales[Revenue] >= 50, "Large", "Small")</code>.', table:'Sales',
    check:(c, M) => c.vals.filter(v => v === 'Large').length === M.T.Sales.rows.filter(r => r.Revenue >= 50).length && c.vals.every(v => v === 'Large' || v === 'Small') ? true : 'Each row should be "Large" when Revenue ≥ 50, else "Small".', solution:'Size = IF(Sales[Revenue] >= 50, "Large", "Small")' },
  { type:'dax', title:'Variables make DAX readable', task:'Rewrite average order value with variables:<br><code>AOV = VAR rev = [Total Revenue] VAR ord = [Total Orders] RETURN DIVIDE(rev, ord)</code>', target:'AOV', matrix:['Products','Category'], pre:['Total Revenue = SUM(Sales[Revenue])','Total Orders = COUNTROWS(Sales)'], auto:true, need:/\bVAR\b[\s\S]*\bRETURN\b/i,
    solution:'AOV = VAR rev = [Total Revenue] VAR ord = [Total Orders] RETURN DIVIDE(rev, ord)' },
  { type:'dax', title:'Count with FILTER', task:'Create <code>Big Orders</code>: count Sales rows with Revenue ≥ 50, using <code>COUNTROWS(FILTER(...))</code>.', target:'Big Orders', matrix:['Stores','Region'], auto:true, need:/FILTER\s*\(/i,
    solution:'Big Orders = COUNTROWS(FILTER(Sales, Sales[Revenue] >= 50))' },
  { type:'dax', title:'CALCULATE + FILTER(ALL())', task:'Create <code>Premium Revenue</code>: Total Revenue for products priced over 6:<br><code>CALCULATE([Total Revenue], FILTER(ALL(Products), Products[Price] > 6))</code>', target:'Premium Revenue', matrix:['Products','Category'], pre:['Total Revenue = SUM(Sales[Revenue])'], auto:true, need:/FILTER\s*\(/i,
    solution:'Premium Revenue = CALCULATE([Total Revenue], FILTER(ALL(Products), Products[Price] > 6))' },
  { type:'quiz', q:'You want a slicer of "Large / Small" orders. Calculated column or measure?', opts:['Measure','Calculated column','Either','Neither'], a:1, why:'Slicers and axes need columns. Measures can\'t be used to slice.' },
  { type:'real', title:'Try it in Power BI Desktop', items:['Sales table → New column → Size','Add a slicer on Sales[Size]','Create AOV with VAR and check it matches your earlier measure','Use DAX query view to EVALUATE FILTER(Sales, Sales[Revenue] >= 50)'], file:'pbi' }
]},
// ------------------------------------------------------------------ PBI 11
{ id:'p11', title:'Interactive Reports & Storytelling', mins:8, why:'Drill-downs, tooltips and bookmarks turn a static chart into a tool managers actually use.', steps:[
  { type:'learn', title:'Drill down and drill through', text:'<b>Hierarchies</b> (Year › Quarter › Month) let users click ⬇ to go deeper on the same visual. <b>Drill-through</b> pages let users right-click a store and open a detail page filtered to it.', tip:'Add a "Back" button on drill-through pages. Power BI adds it automatically.' },
  { type:'learn', title:'Bookmarks, buttons & tooltips', text:'<b>Bookmarks</b> save a view (filters, visibility) so a button can switch views, which is great for storytelling. <b>Report-page tooltips</b> show a mini chart on hover. <b>Conditional formatting</b> colours values by rules, just like in Excel.' },
  { type:'report', title:'A 2025 product view', task:'Set the <b>Year</b> slicer to <b>2025</b>. Tile 1: <b>bar chart</b> of Total Revenue by <b>Product</b>. Tile 2: <b>donut</b> of Total Revenue by <b>Category</b>.', tiles:2, years:true,
    check:c => c.year !== 2025 ? 'Set the Year slicer to 2025.' : !c.tiles.some(t => t.type === 'bar' && t.axis === 'Products.Product' && t.measure === 'Total Revenue') ? 'Missing: a bar chart of Total Revenue by Product.' : !c.tiles.some(t => t.type === 'pie' && t.axis === 'Products.Category' && t.measure === 'Total Revenue') ? 'Missing: a donut of Total Revenue by Category.' : true,
    solution:{tiles:[{type:'bar', axis:'Products.Product', measure:'Total Revenue'},{type:'pie', axis:'Products.Category', measure:'Total Revenue'}], slicer:'All', year:2025} },
  { type:'quiz', q:'A manager wants to right-click a store and see a detailed page about it. Which feature?', opts:['Bookmark','Drill-through','Tooltip','Slicer'], a:1, why:'Drill-through passes the clicked value as a filter to a detail page.' },
  { type:'order', title:'Story with bookmarks', task:'Order the steps to build a click-through story.', items:['Design each view on the page','Hide/show visuals with the Selection pane','Add a bookmark for each view','Add buttons that link to the bookmarks','Test in reading view'] },
  { type:'real', title:'Try it in Power BI Desktop', items:['Build a Year › Quarter › Month hierarchy on a line chart and drill down','Create a Store Details page with drill-through on Stores[Store]','Add a report-page tooltip with a mini trend chart'], file:'pbi' }
]},
// ------------------------------------------------------------------ PBI 12
{ id:'p12', title:'Service, Security & Governance', mins:8, why:'Knowing how reports are shared, refreshed and secured is what "production-ready" means to employers.', steps:[
  { type:'learn', title:'Workspaces, apps & licences', text:'You publish to a <b>workspace</b> (team area), then share widely as an <b>App</b>. Sharing needs <b>Pro</b> licences, unless the workspace sits on <b>Premium / Fabric capacity</b>, where free users can view.', tip:'Roles in a workspace: Admin, Member, Contributor, Viewer.' },
  { type:'learn', title:'Refresh & gateways', text:'Cloud sources refresh directly. On-premises sources (a SQL Server in the office) need an <b>on-premises data gateway</b>. Pro allows up to <b>8 scheduled refreshes a day</b>, and Premium up to 48.', tip:'Import mode = fast and refreshed on a schedule. DirectQuery = always live, but slower.' },
  { type:'rls', title:'Row-level security', task:'Create a role <b>West Managers</b>: on the <b>Stores</b> table, add the DAX filter <code>[Region] = "West"</code>, then press <b>View as role</b>.',
    check:(set, M) => { const st = [...set].map(r => r.Region); return st.length && st.every(r => r === 'West') && st.length === M.T.Stores.rows.filter(r => r.Region === 'West').length ? true : 'The filter should keep exactly the West stores: [Region] = "West"'; }, solution:'[Region] = "West"' },
  { type:'quiz', q:'Each regional manager must see only their region in ONE report. What do you use?', opts:['A separate report per region','Row-level security with roles','Hide the visuals','Bookmarks'], a:1, why:'RLS filters data per user from one model: no duplication.' },
  { type:'order', title:'Dev → Prod', task:'Order a safe release process.', items:['Build & test in Desktop','Publish to a Development workspace','Promote to Test (deployment pipeline)','Business users validate','Promote to Production & update the App'] },
  { type:'real', title:'Try it (free Power BI account)', items:['Modeling → Manage roles → create West Managers','Modeling → View as → West Managers','Publish to My Workspace and set a scheduled refresh','Optional: share via a workspace App'], file:'pbi' }
]},
// ------------------------------------------------------------------ PBI 13
{ id:'p13', title:'Capstone: 2025 Business Review', mins:12, why:'An end-to-end project you can explain in an interview: question → data → model → measures → insights.', steps:[
  { type:'learn', title:'The brief', text:'Lumi Boba\'s CEO asks: <b>"How did 2025 compare to 2024, and what drove the change?"</b> You\'ll build the key measure, a one-page report, and state the insight like a pro.', tip:'Always restate the business question at the top of your report.' },
  { type:'dax', title:'The headline measure', task:'Create <code>YoY %</code> for revenue: compare Total Revenue with the same period last year, using DIVIDE.', target:'YoY %', matrix:['Products','Category'], year:2025, pct:true, pre:['Total Revenue = SUM(Sales[Revenue])'], auto:true, need:/SAMEPERIODLASTYEAR|DATEADD/i,
    solution:'YoY % = DIVIDE([Total Revenue] - CALCULATE([Total Revenue], SAMEPERIODLASTYEAR(Calendar[Date])), CALCULATE([Total Revenue], SAMEPERIODLASTYEAR(Calendar[Date])))' },
  { type:'report', title:'Build the review page', task:'Year slicer = <b>2025</b>. Tiles: a <b>Card</b> with <b>YoY %</b>, a <b>column</b> of YoY % by <b>Category</b>, and a <b>line</b> of Total Revenue by <b>Month</b>.', tiles:3, years:true,
    check:c => { const has = (ty, ax, me) => c.tiles.some(t => t.type === ty && (ax === null || t.axis === ax) && t.measure === me);
      return c.year !== 2025 ? 'Set the Year slicer to 2025.' : !has('card', null, 'YoY %') ? 'Missing: a Card with YoY %.' : !has('column', 'Products.Category', 'YoY %') ? 'Missing: a column chart of YoY % by Category.' : !has('line', 'Calendar.Month', 'Total Revenue') ? 'Missing: a line of Total Revenue by Month.' : true; },
    solution:{tiles:[{type:'card', axis:null, measure:'YoY %'},{type:'column', axis:'Products.Category', measure:'YoY %'},{type:'line', axis:'Calendar.Month', measure:'Total Revenue'}], slicer:'All', year:2025} },
  { type:'quiz', q:'Look at your column chart. Which category grew fastest in 2025?', opts:['Milk Tea','Fruit Tea','Snacks'], a:1, why:'Fruit Tea grew about 30%, Snacks about 23%, and Milk Tea about 9%. Milk Tea is still the biggest by revenue, though.' },
  { type:'quiz', q:'Best way to state the headline insight?', opts:['"Here are some charts."','"Revenue grew 14.7% in 2025, led by Fruit Tea (+30%); Milk Tea is still 63% of sales."','"Data shows things."','"See attached."'], a:1, why:'Lead with the number, the driver and the context: that\'s an executive-ready insight.' },
  { type:'real', title:'Your portfolio project 🏆', items:['Rebuild this page in Power BI Desktop with the Lumi Boba dataset','Add Revenue YTD, a Region slicer and a drill-through store page','Write 3 insight bullets in a text box at the top','Publish (or screenshot) and add it to LinkedIn and your résumé'], file:'pbi' }
]}
);

// ---- extra global measures for report builder ----
const EXTRA_MEASURES = ['Revenue LY = CALCULATE([Total Revenue], SAMEPERIODLASTYEAR(Calendar[Date]))','YoY % = DIVIDE([Total Revenue] - [Revenue LY], [Revenue LY])'];

// ---- new brain-break games ----
GAMES.push(
  { id:'g8', track:'excel', after:10, title:'Function Finder', kind:'mcq', desc:'Which function solves it? 6 quick rounds.', rounds:[
    { q:'List each region once', opts:['UNIQUE','COUNTIF','SORT'], a:0 }, { q:'Last day of the month', opts:['EOMONTH','EDATE','DAY'], a:0 },
    { q:'Working days between two dates', opts:['NETWORKDAYS','DAYS','DATEDIF'], a:0 }, { q:'Rows where Region = "West"', opts:['FILTER','XLOOKUP','SUMIF'], a:0 },
    { q:'Full years between hire date and today', opts:['DATEDIF(…,"y")','YEAR()','TODAY()'], a:0 }, { q:'Format 0.147 as "14.7%" in text', opts:['TEXT(x,"0.0%")','ROUND(x,1)','VALUE(x)'], a:0 } ] },
  { id:'g9', track:'excel', after:12, title:'Excel Expert Blitz', kind:'blitz', desc:'True or false: 45 seconds of advanced Excel.', secs:45, items:[
    ['#SPILL! means results are blocked by other cells.', true], ['Goal Seek changes many inputs at once.', false], ['Named ranges are absolute references.', true], ['LET lets you name parts of a formula.', true],
    ['EOMONTH(A1,0) returns the first day of the month.', false], ['Slicers can control several PivotTables.', true], ['Power Query in Excel can refresh data.', true], ['Dates are stored as numbers.', true],
    ['DATEDIF shows up in formula autocomplete.', false], ['SORT(range,2,-1) sorts column 2 descending.', true], ['A Data Table shows many what-if inputs at once.', true], ['Formatting a date changes its value.', false] ] },
  { id:'g10', track:'pbi', after:8, title:'Query Match', kind:'memory', desc:'Match each Power Query move to what it does.', pairs:[['Append','stack tables'],['Merge','join columns'],['Unpivot','wide → long'],['Group By','summarize rows'],['Trim','remove spaces'],['Refresh','re-run steps']] },
  { id:'g11', track:'pbi', after:10, title:'Time Traveler', kind:'mcq', desc:'Pick the right DAX for each time question.', rounds:[
    { q:'Revenue so far this year', opts:['TOTALYTD([Revenue], Calendar[Date])','SUM(YTD)','YEAR([Revenue])'], a:0 }, { q:'Same months last year', opts:['SAMEPERIODLASTYEAR(Calendar[Date])','PREVIOUSDAY()','LAG(1)'], a:0 },
    { q:'Shift dates back one month', opts:['DATEADD(Calendar[Date], -1, MONTH)','MONTH(-1)','EDATE(-1)'], a:0 }, { q:'Variables in DAX', opts:['VAR … RETURN','LET(…)','DIM'], a:0 },
    { q:'Keep only Sales rows over 50', opts:['FILTER(Sales, Sales[Revenue] > 50)','WHERE Sales > 50','IF(Sales > 50)'], a:0 } ] },
  { id:'g12', track:'pbi', after:12, title:'Power BI Pro Blitz', kind:'blitz', desc:'True or false: 45 seconds, then your capstone!', secs:45, items:[
    ['RLS filters data per user from one model.', true], ['On-prem sources need a gateway for scheduled refresh.', true], ['Measures can be used as slicers.', false], ['Calculated columns use row context.', true],
    ['Drill-through opens a detail page filtered to what you clicked.', true], ['Append joins tables side by side.', false], ['Time intelligence needs a proper date table.', true], ['Bookmarks save a report view.', true],
    ['DirectQuery stores a copy of all data in the model.', false], ['Free users can view content in Premium capacity workspaces.', true], ['Unpivot turns rows into columns.', false], ['VAR can make DAX easier to read.', true] ] }
);
