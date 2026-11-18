// ===== Lumi's Data Lab: story steps, practice sets & skills checks (Power BI) =====
// Everything runs on the Lumi Health clinic model: Visits ⭐, Labs ⭐, Patients, Doctors, Calendar (2025).
const CM = ['Total Visits = COUNTROWS(Visits)', 'Revenue = SUM(Visits[Fee])', 'Completed Visits = CALCULATE([Total Visits], Visits[Status] = "completed")'];
const DX = (t, s, task, target, solution, matrix, k, o = {}) => ({ type:'dax', model:'clinic', title:t, s, task, target, solution, matrix, k, auto:true, pre:o.pre || [], need:o.need, pct:o.pct, year:o.year });
const CC = (t, s, task, table, solution, k) => ({ type:'calccol', model:'clinic', title:t, s, task, table, col:solution.split('=')[0].trim(), solution, k,
  check:c => { const ref = PBI.calcColumn(window.__lab.buildM('clinic'), table, solution); const bad = ref.vals.findIndex((v, i) => String(v) !== String(c.vals[i]));
    return bad < 0 ? true : `Row ${bad + 1} shows "${c.vals[bad]}" but should be "${ref.vals[bad]}". Check your condition.`; } });
const RL = (t, s, task, table, role, measure, solution, k) => ({ type:'rls', model:'clinic', title:t, s, task, table, role, measure, solution, k,
  check:(set, MM) => { const ref = PBI.rowFilter(MM, table, solution); return set.size === ref.size && [...ref].every(r => set.has(r)) ? true : `Your role lets through ${set.size} rows but should allow ${ref.size}. Check the column and value.`; } });
const RP = (t, s, task, tiles, k, slicer) => ({ type:'report', model:'clinic', title:t, s, task, tiles:tiles.length, k, solution:{tiles:tiles.map(x => ({type:x[0][0], axis:x[1], measure:x[2]})), slicer:slicer || 'All'},
  check:C => { for(const [types, axis, measure] of tiles){ if(!C.tiles.some(c => types.includes(c.type) && c.axis === axis && c.measure === measure))
      return `Missing: a ${types.join(' or ')} ${types[0] === 'card' ? '' : 'of ' + measure + ' by ' + axis.split('.')[1]}${types[0] === 'card' ? 'showing ' + measure : ''}.`; }
    if(slicer && C.slicer !== slicer) return `Set the City slicer to ${slicer}.`; return true; } });
const MD = (t, s, task, require, k) => ({ type:'model', model:'clinic', title:t, s, task, require, k });
const PQX = (t, s, task, data, ops, goalFns, solution, k, extra = {}) => ({ type:'pq', title:t, s, task, data, ops, goalFns, solution, k, ...extra });
const cleanIntake = (o = {}) => ({ type:'pq', data:'intake', ...o });
const PQ_CLEAN = {
  blank:['No blank rows', st => st.rows.every(r => st.cols.some(c => String(r[c.name] ?? '').trim() !== ''))],
  dup:['No duplicate patients', st => new Set(st.rows.map(r => JSON.stringify(st.cols.map(c => r[c.name])))).size === st.rows.length],
  trim:['Patient has no extra spaces', st => st.rows.every(r => { const v = String(r.Patient ?? ''); return v === v.trim() && !/\s{2,}/.test(v); })],
  proper:['Patient is in Title Case', st => st.rows.every(r => { const v = String(r.Patient ?? ''); return v === '' || v.split(' ').every(w => w === '' || (w[0] === w[0].toUpperCase() && w.slice(1) === w.slice(1).toLowerCase())); })],
  number:['Copay is a Number (no errors)', st => { const c = st.cols.find(c => c.name === 'Copay'); return c && c.type === 'number' && st.rows.every(r => typeof r.Copay === 'number'); }]
};
const PQI = (t, s, task, goals, solution, k) => PQX(t, s, task, 'intake', ['removeBlank','removeDup','trim','proper','type'], goals.map(g => PQ_CLEAN[g]), solution, k);
const SPEC = ['Doctors','Specialty'], CITY = ['Patients','City'], MON = ['Calendar','Month'], AGE = ['Patients','AgeGroup'], STAT = ['Visits','Status'];

// ======================================================================= STORIES
const PSTORY = {
p1:{ cast:'🏆 CEO Dr. Mensah', ask:'"Every Monday I get 6 different spreadsheets. I want ONE live report that updates itself."', analogy:'Power BI is like the hospital\'s central monitoring station. <b>Power Query</b> collects and cleans the feeds (the intake desk), the <b>model</b> connects them (patient record links to doctor and lab), <b>DAX</b> calculates the vital signs, and the <b>report</b> is the monitor screen everyone looks at.', when:['Data from several sources that must be combined','Reports that need refreshing every week or day','Interactive dashboards for managers'], how:'Get Data → Transform (Power Query) → Model view → Measures → Report → Publish.' },
p2:{ cast:'📝 Intake Supervisor Joy', ask:'"Our patient intake export is a mess: blank rows, duplicates, weird capitals and copays stored as text like \'$20.00\'."', analogy:'Power Query is like a triage nurse for data: it checks every row in the same order, every time, before it reaches the doctor (your report). Each cleaning step is recorded, so next week\'s file is cleaned automatically.', when:['Any export you receive regularly','Text that should be numbers or dates','Duplicates and blank rows from manual entry'], how:'Home → Transform data. Every click is saved under Applied Steps.' },
p3:{ cast:'🗂️ Health Records Manager Sam', ask:'"Visits, patients, doctors and lab results are separate tables. How does Power BI know which doctor saw which patient?"', analogy:'A <b>relationship</b> is like the patient ID wristband: the same ID appears on the visit record, the lab slip and the patient file, so they can be matched. A <b>star schema</b> puts the events (visits, labs ⭐) in the middle and the descriptions (who, which doctor, when) around them.', when:['More than one table in a report','Slicing visits by doctor, city or month','Before writing any DAX'], how:'Model view: drag Visits[PatientID] onto Patients[PatientID].' },
p4:{ cast:'📊 Quality Lead Hannah', ask:'"I need numbers I can trust: total visits, revenue, patients seen, and they must work for every doctor and every month."', analogy:'A <b>measure</b> is like a standing lab order: "count the visits". The same order is run fresh for whatever group you look at (Cardiology, March, Riverside) and always gives the right answer for that group.', when:['Every KPI on a dashboard','Totals, counts, averages and ratios','Numbers that must respond to slicers'], how:'New measure → <code>Total Visits = COUNTROWS(Visits)</code>' },
p5:{ cast:'🩺 Clinic Director Dr. Chen', ask:'"Show me completed visits only, Cardiology revenue, and each specialty\'s share of all visits."', analogy:'<b>CALCULATE</b> is like changing the filter on the ward census: "same count, but only completed" or "same revenue, but only Cardiology". <b>ALL</b> removes the filter so you can compare one part with the whole hospital.', when:['"Only X" numbers (completed, cardiology, self-pay)','% of total','Comparing a group with everyone'], how:'<code>CALCULATE([Total Visits], Visits[Status] = "completed")</code>' },
p6:{ cast:'👩‍⚕️ Nurse Manager Rosa', ask:'"I need to see which cities have the most no-shows and how visits change month to month, with a button to pick my city."', analogy:'Visuals are like choosing the right chart in a patient file: a line for blood pressure over time, bars to compare wards, a card for one big number. A <b>slicer</b> is the "select ward" button.', when:['Comparing groups (bar/column)','Trends over time (line)','One headline number (card)'], how:'Pick a visual → drag a category to the axis → drag a measure to values.' },
p7:{ cast:'🏆 CEO Dr. Mensah', ask:'"Make a one-page dashboard the board can read in 30 seconds."', analogy:'A good dashboard is like a discharge summary: the most important facts first, clear headings, nothing extra. The top-left gets read first, so the KPIs go there.', when:['Monthly board or leadership reviews','Sharing results with non-analysts','Your portfolio project'], how:'Cards on top, a trend line, a breakdown bar, a slicer. Then Publish.' },
p8:{ cast:'🔬 Lab Coordinator Kofi', ask:'"Lab results arrive from two labs in separate files, ward counts come in a wide grid, and visits only have DoctorID with no name."', analogy:'<b>Append</b> stacks two lab reports into one pile. <b>Merge</b> looks up the doctor\'s name from the staff list. <b>Unpivot</b> turns a wide weekly rota into one row per ward per day. <b>Group By</b> totals rows into a summary.', when:['Same columns across several files → Append','Missing details in another table → Merge','Wide month/day columns → Unpivot'], how:'Home → Append / Merge Queries · Transform → Unpivot / Group By' },
p9:{ cast:'💼 CFO Mr. Adams', ask:'"How much revenue have we made so far this year, and is this month better than last month?"', analogy:'Time intelligence is like comparing today\'s vitals to the last visit. <b>YTD</b> is the running total since January, like total doses given since admission. <b>DATEADD</b> looks back one month.', when:['Running totals (YTD)','Month-over-month or year-over-year','Finance and growth reporting'], how:'<code>TOTALYTD([Revenue], Calendar[Date])</code>' },
p10:{ cast:'🧑‍💻 Senior Analyst Leah', ask:'"Label each visit as High or Standard fee, and give me a measure for high-value visits that\'s easy to read."', analogy:'A <b>calculated column</b> is a sticker on every chart ("High fee"), written once. A <b>measure</b> is a question you ask the whole pile. <b>VAR</b> is writing your working-out in steps, like a medication calculation shown line by line.', when:['Categories you want to slice by → calculated column','Totals or ratios → measure','Long formulas → VAR to keep them readable'], how:'<code>VAR done = [Completed Visits] RETURN DIVIDE(done, [Total Visits])</code>' },
p11:{ cast:'📣 Communications Lead Ava', ask:'"The board doesn\'t want charts, they want the story: what happened, why, and what to do."', analogy:'Data storytelling is like a handover between shifts: the situation, what changed, and what needs doing next, in that order. Drill-downs and tooltips let curious people dig deeper without cluttering the page.', when:['Presenting to leaders','Writing chart titles and insights','Building a guided report'], how:'Insight titles, drill-down hierarchies, tooltips and bookmarks.' },
p12:{ cast:'🔐 Privacy Officer Daniel', ask:'"The Riverside clinic manager may only see Riverside patients. Patient data is protected by law."', analogy:'<b>Row-level security</b> is like badge access on hospital wards: everyone uses the same building (report), but your badge only opens your ward\'s doors (rows).', when:['Different managers should see different data','Sensitive patient or salary data','Sharing one report with many teams'], how:'Modeling → Manage roles → <code>[City] = "Riverside"</code>' },
p13:{ cast:'🏥 Board of Lumi Health', ask:'"Prepare the 2025 clinic review: visits, revenue, no-shows and lab outcomes, by specialty and month."', analogy:'This is your capstone case: like presenting a full patient case at grand rounds. You clean, model, measure and present, using everything you\'ve learned.', when:['Your portfolio','Interview case studies','Real end-of-year reviews'], how:'Clean → model → measures → visuals → insight → share.' }
};

// ======================================================================= PRACTICE SETS
Object.assign(PRACTICE_SETS, {
p1:[
 XO('The Power BI workflow', 'Dr. Mensah asks how a report gets built. Put the steps in order.', ['Get data','Clean it in Power Query','Build the model (relationships)','Write measures (DAX)','Build visuals','Publish & share'], 'pbiconcept'),
 XQ('Which part of Power BI cleans and reshapes data?', ['Power Query','DAX','Report view','Power BI Service'], 0, 'Power Query is the "intake desk" for data.', 'pbiconcept', 'Joy\'s intake export is messy.'),
 XQ('Which part calculates KPIs like no-show %?', ['Power Query','DAX measures','Model view','Slicers'], 1, 'DAX measures compute numbers on the fly.', 'pbiconcept', 'Hannah needs a no-show rate.'),
 XQ('Where do you share a report with the CEO online?', ['Power Query','Power BI Service','Excel','Model view'], 1, 'Publish to the Power BI Service (app.powerbi.com).', 'service', 'The CEO is travelling.'),
 XQ('Excel or Power BI? 2 million visit rows, refreshed daily, viewed by 30 managers.', ['Excel','Power BI'], 1, 'Big data, automatic refresh and sharing are Power BI\'s strengths.', 'pbiconcept', 'Volume is growing.'),
 XQ('Excel or Power BI? A one-off budget what-if for the CFO.', ['Excel','Power BI'], 0, 'Quick one-off models are easier in Excel.', 'pbiconcept', 'Mr. Adams wants a quick scenario.'),
 XQ('The Visits table records each appointment. In a star schema it is a…', ['Dimension table','Fact table','Calendar table','Measure'], 1, 'Facts = events you count or sum.', 'star', 'Sam asks where Visits fits.'),
 XQ('Patients, Doctors and Calendar are…', ['Fact tables','Dimension tables','Measures','Visuals'], 1, 'Dimensions describe the who, what and when.', 'star', 'Sam keeps asking.'),
 RP('First look', 'Your first visual on clinic data.', 'Add a <b>Card</b> showing <b>Total Visits</b>.', [[['card'], null, 'Total Visits']], 'visual'),
 RP('Visits by specialty', 'Which specialties are busiest?', 'Make a <b>column</b> (or bar) chart of <b>Total Visits</b> by <b>Doctors › Specialty</b>.', [[['column','bar'], 'Doctors.Specialty', 'Total Visits']], 'visual')
],
p2:[
 PQI('Remove blank rows', 'Joy: "The form adds empty rows."', 'Remove the <b>blank rows</b>.', ['blank'], [{op:'removeBlank'}], 'pq'),
 PQI('Remove duplicates', 'James was entered twice.', 'Remove blanks, then <b>duplicates</b>.', ['blank','dup'], [{op:'removeBlank'},{op:'removeDup'}], 'pq'),
 PQI('Trim names', 'Extra spaces break lookups.', 'Select <b>Patient</b> and <b>Trim</b> it.', ['trim'], [{op:'trim', col:'Patient'}], 'pq'),
 PQI('Fix capitals', '"maria LOPEZ" should be "Maria Lopez".', 'Trim and <b>Capitalize Each Word</b> on Patient.', ['trim','proper'], [{op:'trim', col:'Patient'},{op:'proper', col:'Patient'}], 'pq'),
 PQI('Copay to number', '"$20.00" is text. Totals need numbers.', 'Remove blank rows, then change <b>Copay</b> to a <b>Number</b>.', ['blank','number'], [{op:'removeBlank'},{op:'type', col:'Copay', to:'number'}], 'pq'),
 PQI('Full intake clean', 'Make it analysis-ready.', 'Tick every goal.', ['blank','dup','trim','proper','number'], [{op:'removeBlank'},{op:'trim', col:'Patient'},{op:'proper', col:'Patient'},{op:'removeDup'},{op:'type', col:'Copay', to:'number'}], 'pq'),
 XO('Cleaning order', 'Which order avoids hidden duplicates?', ['Remove blank rows','Trim text','Fix capitals','Remove duplicates','Change data types'], 'pq'),
 XQ('Why trim BEFORE removing duplicates?', ['It\'s faster','"James " and "James" look different until spaces are removed','Trim deletes rows','It doesn\'t matter'], 1, 'Clean first so true duplicates match.', 'pq', 'A duplicate survived.'),
 XQ('Next week\'s export arrives. What do you do?', ['Clean it again by hand','Click Refresh: the Applied Steps re-run','Delete the query','Copy and paste'], 1, 'Steps are saved and replayed automatically.', 'pq', 'Joy sends a new file.'),
 XQ('Copay shows "Error" after changing to Number. Why?', ['A value couldn\'t be converted (blank or text)','Power BI is broken','The column is too wide','Numbers are not allowed'], 0, 'Blank rows or text values fail conversion. Remove blanks first.', 'pq', 'Errors appear.')
],
p3:[
 MD('Visits ↔ Patients', 'Sam: link each visit to its patient.', 'Create the relationship <b>Visits[PatientID] ↔ Patients[PatientID]</b>.', [0], 'model'),
 MD('Visits ↔ Doctors', 'Which doctor saw the patient?', 'Create <b>Visits[DoctorID] ↔ Doctors[DoctorID]</b>.', [1], 'model'),
 MD('Visits ↔ Calendar', 'Visits by month need a date link.', 'Create <b>Visits[Date] ↔ Calendar[Date]</b>.', [2], 'model'),
 MD('Labs to patients', 'Kofi wants lab results by patient city.', 'Connect <b>Labs</b> to <b>Patients</b> and to <b>Calendar</b>.', [3, 4], 'model'),
 MD('The full star', 'Build the whole clinic model.', 'Create all <b>5</b> relationships.', [0, 1, 2, 3, 4], 'star'),
 XQ('Visits → Patients is which cardinality?', ['One-to-one','Many-to-one (many visits, one patient)','Many-to-many','None'], 1, 'One patient can have many visits.', 'model', 'Sam draws the line.'),
 XQ('What column should link Labs and Doctors?', ['There is no shared key, so link through Patients/Visits instead','Labs[Value] ↔ Doctors[VisitFee]','Labs[Test] ↔ Doctors[Specialty]','Any column'], 0, 'Only link columns that hold the same IDs.', 'model', 'Kofi wants labs by doctor.'),
 XQ('Filters flow from…', ['Fact to dimension','Dimension (1 side) to fact (many side)','Randomly','Only from Calendar'], 1, 'Pick a specialty in Doctors and it filters Visits.', 'model', 'Why does the slicer work?'),
 XQ('Why use a star schema instead of one giant table?', ['Prettier','Smaller, faster, simpler DAX and fewer errors','Required by law','It uses more memory'], 1, 'Facts in the middle, dimensions around: the standard BI design.', 'star', 'An interviewer asks.'),
 XQ('Two fact tables in the clinic model are…', ['Patients and Doctors','Visits and Labs','Calendar and Visits','Doctors and Labs'], 1, 'They record events: visits and lab tests.', 'star', 'Sam\'s quiz.')
],
p4:[
 DX('Total visits', 'Hannah: "How many appointments?"', 'Create <code>Total Visits</code> by counting rows of <b>Visits</b>.', 'Total Visits', 'Total Visits = COUNTROWS(Visits)', SPEC, 'dax', {need:/COUNTROWS|COUNT\(/i}),
 DX('Revenue', 'Billing needs the money total.', 'Create <code>Revenue</code> = SUM of <b>Visits[Fee]</b>.', 'Revenue', 'Revenue = SUM(Visits[Fee])', SPEC, 'dax', {need:/SUM/i}),
 DX('Patients seen', 'Unique patients, not visits.', 'Create <code>Patients Seen</code> with <b>DISTINCTCOUNT</b> of Visits[PatientID].', 'Patients Seen', 'Patients Seen = DISTINCTCOUNT(Visits[PatientID])', CITY, 'dax', {need:/DISTINCTCOUNT/i}),
 DX('Average lab value', 'Kofi: average of every lab result.', 'Create <code>Avg Lab</code> = AVERAGE of <b>Labs[Value]</b>.', 'Avg Lab', 'Avg Lab = AVERAGE(Labs[Value])', AGE, 'dax', {need:/AVERAGE/i}),
 DX('Highest fee', 'Most expensive visit.', 'Create <code>Max Fee</code> = MAX of Visits[Fee].', 'Max Fee', 'Max Fee = MAX(Visits[Fee])', SPEC, 'dax', {need:/MAX/i}),
 DX('Lab tests done', 'How many lab results?', 'Create <code>Lab Tests</code> = COUNTROWS(Labs).', 'Lab Tests', 'Lab Tests = COUNTROWS(Labs)', CITY, 'dax', {need:/COUNTROWS/i}),
 DX('Visits per patient', 'Do patients come back?', 'Create <code>Visits per Patient</code> = DIVIDE([Total Visits], [Patients Seen]).', 'Visits per Patient', 'Visits per Patient = DIVIDE([Total Visits], [Patients Seen])', CITY, 'dax', {pre:['Total Visits = COUNTROWS(Visits)','Patients Seen = DISTINCTCOUNT(Visits[PatientID])'], need:/DIVIDE/i}),
 DX('Revenue per visit', 'Average income per appointment.', 'Create <code>Revenue per Visit</code> = DIVIDE([Revenue], [Total Visits]).', 'Revenue per Visit', 'Revenue per Visit = DIVIDE([Revenue], [Total Visits])', SPEC, 'dax', {pre:CM, need:/DIVIDE/i}),
 XQ('Why DIVIDE() instead of "/"?', ['It\'s faster','It returns blank instead of an error when dividing by zero','It rounds','It only works with money'], 1, 'Safe division.', 'dax', 'A doctor had 0 visits.'),
 XQ('Measure vs typing a number in a visual: a measure…', ['Is fixed forever','Recalculates for every filter (doctor, month, city)','Only works in Excel','Needs a calculated column'], 1, 'Measures respond to filter context.', 'dax', 'Hannah asks why measures matter.')
],
p5:[
 DX('Completed visits', 'Dr. Chen: only visits that happened.', 'Create <code>Completed Visits</code> = CALCULATE([Total Visits], Visits[Status] = "completed").', 'Completed Visits', 'Completed Visits = CALCULATE([Total Visits], Visits[Status] = "completed")', SPEC, 'calc', {pre:['Total Visits = COUNTROWS(Visits)'], need:/CALCULATE/i}),
 DX('No-shows', 'Rosa\'s worry.', 'Create <code>No-shows</code>: Total Visits where Status is "no-show".', 'No-shows', 'No-shows = CALCULATE([Total Visits], Visits[Status] = "no-show")', CITY, 'calc', {pre:['Total Visits = COUNTROWS(Visits)'], need:/CALCULATE/i}),
 DX('Cardiology revenue', 'Dr. Chen\'s own department.', 'Create <code>Cardio Revenue</code> = Revenue where Doctors[Specialty] = "Cardiology".', 'Cardio Revenue', 'Cardio Revenue = CALCULATE([Revenue], Doctors[Specialty] = "Cardiology")', MON, 'calc', {pre:CM, need:/CALCULATE/i}),
 DX('Self-pay patients', 'Billing: visits from patients without insurance.', 'Create <code>Self-pay Visits</code>: Total Visits where Patients[Insurance] = "Self-pay".', 'Self-pay Visits', 'Self-pay Visits = CALCULATE([Total Visits], Patients[Insurance] = "Self-pay")', SPEC, 'calc', {pre:CM, need:/CALCULATE/i}),
 DX('No-show %', 'The rate, not the count.', 'Create <code>No-show %</code> = DIVIDE(no-show visits, [Total Visits]).', 'No-show %', 'No-show % = DIVIDE(CALCULATE([Total Visits], Visits[Status] = "no-show"), [Total Visits])', CITY, 'calc', {pre:CM, pct:true, need:/DIVIDE/i}),
 DX('Completion rate', 'Share of visits completed.', 'Create <code>Completion %</code> = DIVIDE([Completed Visits], [Total Visits]).', 'Completion %', 'Completion % = DIVIDE([Completed Visits], [Total Visits])', SPEC, 'calc', {pre:CM, pct:true, need:/DIVIDE/i}),
 DX('All visits (ignore filters)', 'Clinic-wide total on every row.', 'Create <code>All Visits</code> = CALCULATE([Total Visits], ALL(Doctors)).', 'All Visits', 'All Visits = CALCULATE([Total Visits], ALL(Doctors))', SPEC, 'context', {pre:CM, need:/ALL/i}),
 DX('% of all visits', 'Each specialty\'s share.', 'Create <code>Visit Share</code> = DIVIDE([Total Visits], CALCULATE([Total Visits], ALL(Doctors))).', 'Visit Share', 'Visit Share = DIVIDE([Total Visits], CALCULATE([Total Visits], ALL(Doctors)))', SPEC, 'context', {pre:CM, pct:true, need:/ALL/i}),
 DX('Average HbA1c', 'Diabetes control across patients.', 'Create <code>Avg HbA1c</code> = CALCULATE(AVERAGE(Labs[Value]), Labs[Test] = "HbA1c").', 'Avg HbA1c', 'Avg HbA1c = CALCULATE(AVERAGE(Labs[Value]), Labs[Test] = "HbA1c")', AGE, 'calc', {need:/CALCULATE/i}),
 XQ('In a matrix by Specialty, why does every row of "All Visits" show 228?', ['A bug','ALL removed the Specialty filter, so it\'s the clinic total','The data is duplicated','CALCULATE always returns 228'], 1, 'ALL ignores the filter on that table.', 'context', 'Dr. Chen is confused by a matrix.')
],
p6:[
 RP('Revenue by specialty', 'Which specialty earns most?', 'A <b>bar</b> or <b>column</b> chart of <b>Revenue</b> by <b>Specialty</b>.', [[['bar','column'], 'Doctors.Specialty', 'Revenue']], 'vischoice'),
 RP('Visits trend', 'How do visits change during 2025?', 'A <b>line</b> chart of <b>Total Visits</b> by <b>Calendar › Month</b>.', [[['line'], 'Calendar.Month', 'Total Visits']], 'vischoice'),
 RP('No-show rate card', 'One headline number.', 'A <b>Card</b> showing <b>No-show %</b>.', [[['card'], null, 'No-show %']], 'visual'),
 RP('Status mix', 'Completed vs cancelled vs no-show.', 'A <b>donut</b> of <b>Total Visits</b> by <b>Visits › Status</b>.', [[['pie'], 'Visits.Status', 'Total Visits']], 'vischoice'),
 RP('No-shows by city', 'Where are patients missing appointments?', 'A <b>column</b> or <b>bar</b> chart of <b>No-show %</b> by <b>Patients › City</b>.', [[['column','bar'], 'Patients.City', 'No-show %']], 'visual'),
 RP('Riverside only', 'Rosa manages Riverside.', 'A <b>Card</b> of <b>Total Visits</b>, with the City slicer set to <b>Riverside</b>.', [[['card'], null, 'Total Visits']], 'interact', 'Riverside'),
 RP('Weekday pattern', 'Which weekdays are busiest?', 'A <b>column</b> chart of <b>Total Visits</b> by <b>Calendar › Weekday</b>.', [[['column','bar'], 'Calendar.Weekday', 'Total Visits']], 'visual'),
 RP('Age groups', 'Who uses the clinic?', 'A <b>bar</b> chart of <b>Patients Seen</b> by <b>Patients › AgeGroup</b>.', [[['bar','column'], 'Patients.AgeGroup', 'Patients Seen']], 'visual'),
 XQ('A slicer…', ['Deletes data','Filters every visual on the page','Changes chart colours','Writes DAX'], 1, 'It\'s the "select ward" button.', 'interact', 'Rosa clicks Riverside.'),
 XQ('Compare 8 doctors with long names. Best visual?', ['Pie','Horizontal bar','Line','Card'], 1, 'Bars fit long labels.', 'vischoice', 'Doctor names are long.')
],
p7:[
 RP('KPI row', 'Dashboard top row.', 'Two <b>Cards</b>: <b>Total Visits</b> and <b>Revenue</b>.', [[['card'], null, 'Total Visits'], [['card'], null, 'Revenue']], 'design'),
 RP('Mini dashboard', 'The board\'s one page.', 'A <b>Card</b> (Revenue), a <b>bar/column</b> of Revenue by Specialty, and a <b>line</b> of Total Visits by Month.', [[['card'], null, 'Revenue'], [['bar','column'], 'Doctors.Specialty', 'Revenue'], [['line'], 'Calendar.Month', 'Total Visits']], 'design'),
 RP('Quality dashboard', 'Hannah\'s quality page.', 'A <b>Card</b> (No-show %) and a <b>column/bar</b> of No-show % by City.', [[['card'], null, 'No-show %'], [['column','bar'], 'Patients.City', 'No-show %']], 'design'),
 XO('Dashboard layout', 'Order by reading priority (first seen → last).', ['Title with the key insight','KPI cards','Trend chart','Breakdown chart','Detail table'], 'design'),
 XQ('Where do the KPI cards go?', ['Top left','Bottom','A hidden page','Anywhere'], 0, 'People scan top-left first.', 'design', 'Laying out the page.'),
 XQ('How many colours should a clean dashboard mainly use?', ['As many as possible','A few, with one highlight colour for what matters','Rainbow for each bar','Only black'], 1, 'Colour should mean something.', 'design', 'The draft looks like a fruit salad.'),
 XQ('Best chart title?', ['"Revenue by Specialty"','"Chart 2"','"Cardiology brings 31% of revenue"','No title'], 2, 'Titles that state the insight help busy readers.', 'design', 'The CEO reads titles only.'),
 XQ('To share with the CEO you…', ['Email the .pbix file','Publish to the Power BI Service and share or add to an app','Screenshot it','Print it'], 1, 'The Service keeps it live and secure.', 'service', 'Ready to share.'),
 XQ('The report must update every morning. Set up a…', ['Scheduled refresh in the Service','New PC','Bigger monitor','Macro'], 0, 'Scheduled refresh (plus a gateway for on-premises data).', 'service', 'Daily updates needed.'),
 XQ('Accessibility: a colour-blind board member can\'t read red vs green. Fix?', ['Add labels and use a colour-blind-safe palette','Use more red','Remove the chart','Nothing'], 0, 'Never rely on colour alone.', 'design', 'A board member says so.')
],
p8:[
 PQX('Append two labs', 'Kofi: Lab A and Lab B send the same columns.', 'Click <b>Append Lab B</b> to stack the results.', 'labsA', ['append'], [['All 5 results in one table', s => s.rows.length === 5], ['ResultIDs are unique', s => new Set(s.rows.map(r => r.ResultID)).size === s.rows.length]], [{op:'append'}], 'pqshape', {extra:'labsB', extraLabel:'Lab B'}),
 PQX('Merge doctor names', 'Visits only have DoctorID.', 'Click <b>Merge with Doctors</b> to bring in the <b>Doctor</b> name.', 'visits', ['merge'], [['Doctor column added', s => s.cols.some(c => c.name === 'Doctor')], ['Every visit has a doctor', s => s.rows.every(r => r.Doctor)]], [{op:'merge'}], 'pqshape', {lk:'doctorlk', key:'DoctorID', take:'Doctor', lkLabel:'Doctors (on DoctorID)'}),
 PQX('Merge specialty', 'Now bring in the specialty instead.', 'Merge <b>Specialty</b> from the Doctors list.', 'visits', ['merge'], [['Specialty column added', s => s.cols.some(c => c.name === 'Specialty')]], [{op:'merge'}], 'pqshape', {lk:'doctorlk', key:'DoctorID', take:'Specialty', lkLabel:'Doctors (on DoctorID)'}),
 PQX('Unpivot the rota', 'Ward counts are one column per weekday.', 'Select <b>Ward</b> → <b>Unpivot other columns</b>.', 'wardwide', ['unpivot'], [['One row per ward per day (9 rows)', s => s.rows.length === 9]], [{op:'unpivot', keep:['Ward']}], 'pqshape'),
 PQX('Unpivot + rename', 'Make it report-ready.', 'Unpivot (keep <b>Ward</b>), then rename Attribute → <b>Day</b> and Value → <b>Patients</b>.', 'wardwide', ['unpivot','rename'], [['9 rows', s => s.rows.length === 9], ['Columns: Ward, Day, Patients', s => s.cols.map(c => c.name).join() === 'Ward,Day,Patients']], [{op:'unpivot', keep:['Ward']},{op:'rename', col:'Attribute', to:'Day'},{op:'rename', col:'Value', to:'Patients'}], 'pqshape'),
 PQX('Group by specialty', 'Fee totals per specialty.', 'Select <b>Specialty</b> → <b>Group By → Sum of Fee</b>.', 'byspec', ['group'], [['One row per specialty (5)', s => s.rows.length === 5 && s.cols[0].name === 'Specialty'], ['Cardiology total = 560', s => s.rows.some(r => r.Specialty === 'Cardiology' && r.Total === 560)]], [{op:'group', col:'Specialty'}], 'pqshape', {agg:'Fee'}),
 PQX('Group by doctor', 'Fee totals per doctor.', 'Select <b>Doctor</b> → <b>Group By → Sum of Fee</b>.', 'byspec', ['group'], [['One row per doctor (6)', s => s.rows.length === 6 && s.cols[0].name === 'Doctor']], [{op:'group', col:'Doctor'}], 'pqshape', {agg:'Fee'}),
 XQ('January and February lab files with the same columns → ', ['Merge','Append','Unpivot','Group By'], 1, 'Same columns, more rows → Append.', 'pqshape', 'Two monthly files arrive.'),
 XQ('You need each visit\'s doctor specialty from another table →', ['Merge','Append','Unpivot','Remove duplicates'], 0, 'Merge = lookup / join by a key.', 'pqshape', 'Specialty is missing.'),
 XQ('A budget with Jan…Dec as columns should be…', ['Appended','Unpivoted into Month + Value','Deleted','Merged'], 1, 'Long and narrow tables work best in Power BI.', 'pqshape', 'Finance sends a wide sheet.')
],
p9:[
 DX('Revenue YTD', 'CFO: running total since January.', 'Create <code>Revenue YTD = TOTALYTD([Revenue], Calendar[Date])</code>.', 'Revenue YTD', 'Revenue YTD = TOTALYTD([Revenue], Calendar[Date])', MON, 'time', {pre:CM, year:2025, need:/TOTALYTD|DATESYTD/i}),
 DX('Visits YTD', 'Same for visit counts.', 'Create <code>Visits YTD</code> with TOTALYTD of [Total Visits].', 'Visits YTD', 'Visits YTD = TOTALYTD([Total Visits], Calendar[Date])', MON, 'time', {pre:CM, year:2025, need:/TOTALYTD|DATESYTD/i}),
 DX('Revenue last month', 'Month-over-month view.', 'Create <code>Revenue PM</code> = CALCULATE([Revenue], DATEADD(Calendar[Date], -1, MONTH)).', 'Revenue PM', 'Revenue PM = CALCULATE([Revenue], DATEADD(Calendar[Date], -1, MONTH))', MON, 'time', {pre:CM, year:2025, need:/DATEADD|PREVIOUSMONTH/i}),
 DX('Visits last month', 'Rosa\'s staffing comparison.', 'Create <code>Visits PM</code> using PREVIOUSMONTH or DATEADD.', 'Visits PM', 'Visits PM = CALCULATE([Total Visits], DATEADD(Calendar[Date], -1, MONTH))', MON, 'time', {pre:CM, year:2025, need:/DATEADD|PREVIOUSMONTH/i}),
 DX('MoM change', 'Up or down vs last month?', 'Create <code>MoM Change</code> = [Revenue] − [Revenue PM].', 'MoM Change', 'MoM Change = [Revenue] - [Revenue PM]', MON, 'time', {pre:[...CM, 'Revenue PM = CALCULATE([Revenue], DATEADD(Calendar[Date], -1, MONTH))'], year:2025}),
 DX('MoM %', 'Growth rate.', 'Create <code>MoM %</code> = DIVIDE([Revenue] − [Revenue PM], [Revenue PM]).', 'MoM %', 'MoM % = DIVIDE([Revenue] - [Revenue PM], [Revenue PM])', MON, 'time', {pre:[...CM, 'Revenue PM = CALCULATE([Revenue], DATEADD(Calendar[Date], -1, MONTH))'], year:2025, pct:true, need:/DIVIDE/i}),
 DX('Completed YTD', 'Completed visits so far this year.', 'Create <code>Completed YTD</code> with TOTALYTD of [Completed Visits].', 'Completed YTD', 'Completed YTD = TOTALYTD([Completed Visits], Calendar[Date])', MON, 'time', {pre:CM, year:2025, need:/TOTALYTD|DATESYTD/i}),
 XQ('Time intelligence needs…', ['A continuous Calendar table marked as a date table','Two fact tables','A pie chart','Row-level security'], 0, 'One row per day, no gaps, related to facts.', 'time', 'TOTALYTD shows blanks.'),
 XQ('"Revenue so far this year" →', ['TOTALYTD','DATEADD -1 MONTH','DISTINCTCOUNT','ALL'], 0, 'YTD = year-to-date running total.', 'time', 'The CFO\'s question.'),
 XQ('In January, Revenue PM shows blank. Why?', ['A bug','There is no December 2024 data in the model','DATEADD is wrong','January has no visits'], 1, 'No previous-month data exists, so the result is blank.', 'time', 'January looks empty.')
],
p10:[
 CC('Fee band column', 'Leah: label every visit.', 'In <b>Visits</b>, create <code>Fee Band = IF(Visits[Fee] >= 200, "High", "Standard")</code>.', 'Visits', 'Fee Band = IF(Visits[Fee] >= 200, "High", "Standard")', 'calccol'),
 CC('Attended flag', 'Did the patient show up?', 'In <b>Visits</b>, create <code>Attended = IF(Visits[Status] = "completed", "Yes", "No")</code>.', 'Visits', 'Attended = IF(Visits[Status] = "completed", "Yes", "No")', 'calccol'),
 CC('Lab flag', 'Kofi: flag high readings.', 'In <b>Labs</b>, create <code>High = IF(Labs[Value] >= 140, "High", "Normal")</code>.', 'Labs', 'High = IF(Labs[Value] >= 140, "High", "Normal")', 'calccol'),
 CC('Specialty on each visit', 'Bring Specialty into Visits with RELATED.', 'In <b>Visits</b>, create <code>Spec = RELATED(Doctors[Specialty])</code>.', 'Visits', 'Spec = RELATED(Doctors[Specialty])', 'calccol'),
 DX('High-fee revenue', 'Revenue from visits ≥ $200 using FILTER.', 'Create <code>High Fee Revenue</code> = CALCULATE([Revenue], FILTER(Visits, Visits[Fee] >= 200)).', 'High Fee Revenue', 'High Fee Revenue = CALCULATE([Revenue], FILTER(Visits, Visits[Fee] >= 200))', SPEC, 'var', {pre:CM, need:/FILTER/i}),
 DX('High lab results', 'Count lab results ≥ 140.', 'Create <code>High Results</code> = CALCULATE(COUNTROWS(Labs), FILTER(Labs, Labs[Value] >= 140)).', 'High Results', 'High Results = CALCULATE(COUNTROWS(Labs), FILTER(Labs, Labs[Value] >= 140))', CITY, 'var', {need:/FILTER/i}),
 DX('VAR completion %', 'Readable completion rate.', 'Create <code>Done %</code> = VAR done = [Completed Visits] VAR total = [Total Visits] RETURN DIVIDE(done, total).', 'Done %', 'Done % = VAR done = [Completed Visits] VAR total = [Total Visits] RETURN DIVIDE(done, total)', SPEC, 'var', {pre:CM, pct:true, need:/VAR/i}),
 DX('SUMX expected fees', 'If every visit charged the doctor\'s list fee.', 'Create <code>List Fees</code> = SUMX(Visits, RELATED(Doctors[VisitFee])).', 'List Fees', 'List Fees = SUMX(Visits, RELATED(Doctors[VisitFee]))', SPEC, 'var', {need:/SUMX/i}),
 XQ('Want to slice visits by "High"/"Standard"? Use a…', ['Measure','Calculated column','Slicer only','Bookmark'], 1, 'Columns can go on axes and slicers.', 'calccol', 'Leah wants a slicer.'),
 XQ('Calculated columns use ___ context; measures use ___ context.', ['filter; row','row; filter','no; any','row; row'], 1, 'Columns: each row. Measures: the current filters.', 'context', 'Interview classic.')
],
p11:[
 XQ('A board member wants to go from Specialty → Doctor in one chart. Use…', ['Drill-down hierarchy','A new page','A slicer','RLS'], 0, 'Drill-down lets them click into detail.', 'interact', 'Ava\'s board meeting.'),
 XQ('Show patient counts when hovering over a bar →', ['Tooltip','Bookmark','Calculated column','Gateway'], 0, 'Tooltips add detail without clutter.', 'interact', 'Hover detail.'),
 XQ('Save a "Cardiology focus" view to click during the presentation →', ['Bookmark','Measure','Append','Gateway'], 0, 'Bookmarks capture filters and visuals.', 'interact', 'Ava prepares slides.'),
 XQ('Clicking a bar filters the other visuals. This is…', ['Cross-filtering','RLS','Unpivot','Refresh'], 0, 'Visuals interact with each other by default.', 'interact', 'Rosa clicks a city.'),
 XO('Story structure', 'Order the board story.', ['What happened (headline KPI)','Where it happened (breakdown)','Why (driver analysis)','What we recommend'], 'design'),
 XQ('Best insight sentence?', ['"Here is a chart."','"No-shows were 12%, highest in Lakeview (18%): text reminders could recover ~20 visits a month."','"Data is shown below."','"Visits vary."'], 1, 'Number + where + action.', 'design', 'Writing the summary.'),
 RP('Drill target', 'Doctor-level detail.', 'A <b>bar</b> chart of <b>Revenue</b> by <b>Doctors › Doctor</b>.', [[['bar','column'], 'Doctors.Doctor', 'Revenue']], 'visual'),
 RP('Reason for visit', 'Why do patients come?', 'A <b>bar/column</b> of <b>Total Visits</b> by <b>Visits › Reason</b>.', [[['bar','column'], 'Visits.Reason', 'Total Visits']], 'visual'),
 RP('Insurance mix', 'Payer mix for finance.', 'A <b>donut</b> of <b>Total Visits</b> by <b>Patients › Insurance</b>.', [[['pie'], 'Patients.Insurance', 'Total Visits']], 'vischoice'),
 XQ('Too many visuals on one page usually…', ['Helps','Confuses readers and slows the report','Is required','Improves security'], 1, 'Keep each page focused on one question.', 'design', 'The draft has 14 charts.')
],
p12:[
 RL('Riverside role', 'Daniel: Riverside manager sees Riverside only.', 'On <b>Patients</b>, filter <code>[City] = "Riverside"</code>, then View as role.', 'Patients', 'Riverside Manager', 'Total Visits', '[City] = "Riverside"', 'rls'),
 RL('Lakeview role', 'A second clinic manager.', 'Role filter for <b>Lakeview</b> patients.', 'Patients', 'Lakeview Manager', 'Total Visits', '[City] = "Lakeview"', 'rls'),
 RL('Cardiology team', 'Cardiologists see their own specialty.', 'On <b>Doctors</b>, filter <code>[Specialty] = "Cardiology"</code>.', 'Doctors', 'Cardiology Team', 'Revenue', '[Specialty] = "Cardiology"', 'rls'),
 RL('Pediatrics team', 'Children\'s clinic staff.', 'Role on <b>Doctors</b> for <b>Pediatrics</b>.', 'Doctors', 'Pediatrics Team', 'Revenue', '[Specialty] = "Pediatrics"', 'rls'),
 RL('Insured patients', 'An insurer\'s auditor sees only insured visits.', 'On <b>Patients</b>, filter <code>[Insurance] &lt;&gt; "Self-pay"</code>.', 'Patients', 'Insurer Auditor', 'Total Visits', '[Insurance] <> "Self-pay"', 'rls'),
 XQ('RLS filters…', ['Columns','Rows a user can see','Visual colours','Refresh times'], 1, 'Row-level security.', 'rls', 'Daniel explains.'),
 XQ('Where are users assigned to roles?', ['Power BI Service (dataset security)','Power Query','The report canvas','Excel'], 0, 'Define roles in Desktop, assign people in the Service.', 'rls', 'After publishing.'),
 XQ('On-premises SQL data refreshing in the Service needs a…', ['Gateway','Bookmark','Slicer','Tooltip'], 0, 'The gateway connects the cloud to local data.', 'service', 'IT asks.'),
 XQ('Best way to share a set of reports with all clinic managers?', ['A Power BI App from a workspace','Emailing .pbix files','Screenshots','USB sticks'], 0, 'Apps package and share reports safely.', 'service', 'Distributing reports.'),
 XQ('Patient names should be hidden from most staff. Also consider…', ['Removing or masking the column and limiting access','Bigger font','A pie chart','More slicers'], 0, 'Only show what people need (data minimisation).', 'rls', 'Privacy by design.')
],
p13:[
 PQI('Step 1 · Clean intake', 'Board review: start with clean data.', 'Complete every goal.', ['blank','dup','trim','proper','number'], [{op:'removeBlank'},{op:'trim', col:'Patient'},{op:'proper', col:'Patient'},{op:'removeDup'},{op:'type', col:'Copay', to:'number'}], 'capstone'),
 MD('Step 2 · Model', 'Connect every table.', 'Create all <b>5</b> relationships.', [0, 1, 2, 3, 4], 'capstone'),
 DX('Step 3 · Revenue', 'Core measure.', 'Create <code>Revenue</code> = SUM(Visits[Fee]).', 'Revenue', 'Revenue = SUM(Visits[Fee])', SPEC, 'capstone', {need:/SUM/i}),
 DX('Step 4 · No-show %', 'Quality measure.', 'Create <code>No-show %</code>.', 'No-show %', 'No-show % = DIVIDE(CALCULATE([Total Visits], Visits[Status] = "no-show"), [Total Visits])', CITY, 'capstone', {pre:CM, pct:true, need:/DIVIDE/i}),
 DX('Step 5 · Revenue YTD', 'Finance measure.', 'Create <code>Revenue YTD</code>.', 'Revenue YTD', 'Revenue YTD = TOTALYTD([Revenue], Calendar[Date])', MON, 'capstone', {pre:CM, year:2025, need:/TOTALYTD|DATESYTD/i}),
 DX('Step 6 · Avg HbA1c', 'Clinical outcome measure.', 'Create <code>Avg HbA1c</code>.', 'Avg HbA1c', 'Avg HbA1c = CALCULATE(AVERAGE(Labs[Value]), Labs[Test] = "HbA1c")', AGE, 'capstone', {need:/CALCULATE/i}),
 RP('Step 7 · Dashboard', 'The board page.', 'A <b>Card</b> (Revenue), <b>line</b> of Total Visits by Month, <b>bar/column</b> of No-show % by City.', [[['card'], null, 'Revenue'], [['line'], 'Calendar.Month', 'Total Visits'], [['bar','column'], 'Patients.City', 'No-show %']], 'capstone'),
 XO('Step 8 · Present', 'Order your 5-minute board talk.', ['Headline: revenue & visits for 2025','Trend through the year','Problem: no-shows by city','Recommendation: reminder texts','Next steps & owner'], 'capstone'),
 XQ('Step 9 · Interview: "Walk me through your project." Start with…', ['The business question and result','Every DAX formula','Your laptop specs','Colours used'], 0, 'Lead with the problem and impact.', 'capstone'),
 XQ('Step 10 · Which belongs in your portfolio write-up?', ['Screenshots + the question + 3 insights + tools used','Raw patient names','Nothing','Only the .pbix'], 0, 'Show thinking and results, never real patient data.', 'capstone')
]
});

// ======================================================================= SKILLS CHECKS
Object.assign(CHECKS, {
p1:[ XO('Check 1', 'Order the workflow.', ['Get data','Power Query','Model','DAX measures','Report','Publish'], 'pbiconcept'),
     XQ('DAX is used to…', ['Clean data','Calculate measures','Draw relationships','Share reports'], 1, 'DAX = formulas.', 'pbiconcept'),
     XQ('Visits is a ___ table.', ['dimension','fact'], 1, 'Events = facts.', 'star'),
     RP('Check 4', '', 'A <b>Card</b> showing <b>Revenue</b>.', [[['card'], null, 'Revenue']], 'visual'),
     XQ('Reports are shared online through…', ['Power BI Service','Power Query','Model view','DAX'], 0, 'app.powerbi.com', 'service') ],
p2:[ PQI('Check 1', '', 'Remove <b>blank rows</b> and <b>duplicates</b>.', ['blank','dup'], [{op:'removeBlank'},{op:'removeDup'}], 'pq'),
     PQI('Check 2', '', 'Make <b>Patient</b> trimmed and Title Case.', ['trim','proper'], [{op:'trim', col:'Patient'},{op:'proper', col:'Patient'}], 'pq'),
     PQI('Check 3', '', 'Make <b>Copay</b> a Number with no errors.', ['blank','number'], [{op:'removeBlank'},{op:'type', col:'Copay', to:'number'}], 'pq'),
     XQ('Applied Steps are…', ['Deleted on refresh','Re-run automatically on refresh','Only for Excel','DAX formulas'], 1, 'That\'s the magic of Power Query.', 'pq'),
     XQ('Trim before removing duplicates because…', ['Spaces hide true duplicates','Trim is faster','Required','It sorts'], 0, 'Clean first, then dedupe.', 'pq') ],
p3:[ MD('Check 1', '', 'Connect <b>Visits</b> to <b>Patients</b>, <b>Doctors</b> and <b>Calendar</b>.', [0, 1, 2], 'model'),
     MD('Check 2', '', 'Connect <b>Labs</b> to <b>Patients</b>.', [3], 'model'),
     XQ('One doctor, many visits: cardinality?', ['1:1','Many-to-one','Many-to-many'], 1, 'Many visits → one doctor.', 'model'),
     XQ('Filters flow from…', ['Dimension to fact','Fact to dimension'], 0, 'One side → many side.', 'model'),
     XQ('Star schema centre holds…', ['Dimensions','Facts','Measures','Visuals'], 1, 'Facts in the middle.', 'star') ],
p4:[ DX('Check 1', '', 'Create <code>Total Visits</code> (count Visits rows).', 'Total Visits', 'Total Visits = COUNTROWS(Visits)', SPEC, 'dax', {need:/COUNT/i}),
     DX('Check 2', '', 'Create <code>Patients Seen</code> (unique PatientID in Visits).', 'Patients Seen', 'Patients Seen = DISTINCTCOUNT(Visits[PatientID])', CITY, 'dax', {need:/DISTINCTCOUNT/i}),
     DX('Check 3', '', 'Create <code>Avg Fee</code> = DIVIDE([Revenue], [Completed Visits]).', 'Avg Fee', 'Avg Fee = DIVIDE([Revenue], [Completed Visits])', SPEC, 'dax', {pre:CM, need:/DIVIDE/i}),
     XQ('Unique patients →', ['COUNT','DISTINCTCOUNT','SUM','MAX'], 1, 'Counts each patient once.', 'dax'),
     XQ('DIVIDE(a, 0) returns…', ['Error','Blank (or an alternate value)','0 always','Infinity'], 1, 'Safe division.', 'dax') ],
p5:[ DX('Check 1', '', 'Create <code>Cancelled</code>: Total Visits where Status = "cancelled".', 'Cancelled', 'Cancelled = CALCULATE([Total Visits], Visits[Status] = "cancelled")', SPEC, 'calc', {pre:CM, need:/CALCULATE/i}),
     DX('Check 2', '', 'Create <code>Peds Revenue</code>: Revenue where Specialty = "Pediatrics".', 'Peds Revenue', 'Peds Revenue = CALCULATE([Revenue], Doctors[Specialty] = "Pediatrics")', CITY, 'calc', {pre:CM, need:/CALCULATE/i}),
     DX('Check 3', '', 'Create <code>Revenue Share</code> = Revenue ÷ Revenue for ALL(Doctors).', 'Revenue Share', 'Revenue Share = DIVIDE([Revenue], CALCULATE([Revenue], ALL(Doctors)))', SPEC, 'context', {pre:CM, pct:true, need:/ALL/i}),
     XQ('CALCULATE…', ['Changes the filter context for a calculation','Cleans data','Draws charts','Creates tables'], 0, 'Most important DAX function.', 'calc'),
     XQ('ALL(Doctors) inside CALCULATE…', ['Adds a filter','Removes filters on Doctors','Deletes Doctors','Sorts'], 1, 'For % of total.', 'context') ],
p6:[ RP('Check 1', '', '<b>Line</b> chart of <b>Revenue</b> by <b>Calendar › Month</b>.', [[['line'], 'Calendar.Month', 'Revenue']], 'vischoice'),
     RP('Check 2', '', '<b>Bar/column</b> of <b>Total Visits</b> by <b>Patients › City</b>.', [[['bar','column'], 'Patients.City', 'Total Visits']], 'visual'),
     RP('Check 3', '', '<b>Card</b> of <b>Revenue</b> with the slicer on <b>Lakeview</b>.', [[['card'], null, 'Revenue']], 'interact', 'Lakeview'),
     XQ('Trend over time →', ['Line','Pie','Card','Table'], 0, 'Lines show change.', 'vischoice'),
     XQ('One big number →', ['Card','Line','Scatter','Matrix'], 0, 'Cards for KPIs.', 'vischoice') ],
p7:[ RP('Check 1', '', 'Card (<b>Patients Seen</b>) + <b>bar/column</b> of <b>Revenue</b> by <b>Specialty</b>.', [[['card'], null, 'Patients Seen'], [['bar','column'], 'Doctors.Specialty', 'Revenue']], 'design'),
     XO('Check 2', 'Order by reading priority.', ['Insight title','KPI cards','Trend','Breakdown'], 'design'),
     XQ('Best title →', ['"Visits"','"Visits up 14% since Q1, led by Cardiology"','"Chart"'], 1, 'Say the insight.', 'design'),
     XQ('Keep it live every morning →', ['Scheduled refresh','Re-email','Screenshot'], 0, 'Set in the Service.', 'service'),
     XQ('Colour should…', ['Highlight what matters','Be random','Be as bright as possible'], 0, 'Purposeful colour.', 'design') ],
p8:[ PQX('Check 1', '', 'Append <b>Lab B</b> to Lab A.', 'labsA', ['append'], [['5 results', s => s.rows.length === 5]], [{op:'append'}], 'pqshape', {extra:'labsB', extraLabel:'Lab B'}),
     PQX('Check 2', '', 'Merge the <b>Doctor</b> name into visits.', 'visits', ['merge'], [['Doctor column added', s => s.cols.some(c => c.name === 'Doctor')]], [{op:'merge'}], 'pqshape', {lk:'doctorlk', key:'DoctorID', take:'Doctor', lkLabel:'Doctors (on DoctorID)'}),
     PQX('Check 3', '', 'Unpivot the rota, keeping <b>Ward</b>.', 'wardwide', ['unpivot'], [['9 rows', s => s.rows.length === 9]], [{op:'unpivot', keep:['Ward']}], 'pqshape'),
     XQ('Same columns, more rows →', ['Append','Merge'], 0, 'Stack.', 'pqshape'),
     XQ('Group By produces…', ['A summary: one row per group','More rows','Duplicates'], 0, 'Like a pivot.', 'pqshape') ],
p9:[ DX('Check 1', '', 'Create <code>Visits YTD</code>.', 'Visits YTD', 'Visits YTD = TOTALYTD([Total Visits], Calendar[Date])', MON, 'time', {pre:CM, year:2025, need:/TOTALYTD|DATESYTD/i}),
     DX('Check 2', '', 'Create <code>Completed PM</code> (completed visits previous month).', 'Completed PM', 'Completed PM = CALCULATE([Completed Visits], DATEADD(Calendar[Date], -1, MONTH))', MON, 'time', {pre:CM, year:2025, need:/DATEADD|PREVIOUSMONTH/i}),
     DX('Check 3', '', 'Create <code>Revenue YTD</code>.', 'Revenue YTD', 'Revenue YTD = TOTALYTD([Revenue], Calendar[Date])', MON, 'time', {pre:CM, year:2025, need:/TOTALYTD|DATESYTD/i}),
     XQ('DATEADD(Calendar[Date], -1, MONTH) means…', ['Next month','Previous month','Last year','Today'], 1, 'Shift back 1 month.', 'time'),
     XQ('Time functions need…', ['A date table','A pie chart','RLS'], 0, 'Continuous Calendar.', 'time') ],
p10:[ CC('Check 1', '', 'In <b>Visits</b>: <code>Missed = IF(Visits[Status] = "completed", "No", "Yes")</code>.', 'Visits', 'Missed = IF(Visits[Status] = "completed", "No", "Yes")', 'calccol'),
      DX('Check 2', '', 'Create <code>Big Visits</code> = CALCULATE([Total Visits], FILTER(Visits, Visits[Fee] >= 240)).', 'Big Visits', 'Big Visits = CALCULATE([Total Visits], FILTER(Visits, Visits[Fee] >= 240))', SPEC, 'var', {pre:CM, need:/FILTER/i}),
      DX('Check 3', '', 'Create <code>Fee per Patient</code> using VAR: VAR r = [Revenue] VAR p = DISTINCTCOUNT(Visits[PatientID]) RETURN DIVIDE(r, p).', 'Fee per Patient', 'Fee per Patient = VAR r = [Revenue] VAR p = DISTINCTCOUNT(Visits[PatientID]) RETURN DIVIDE(r, p)', CITY, 'var', {pre:CM, need:/VAR/i}),
      XQ('To put "High/Standard" on a slicer, use a…', ['Calculated column','Measure'], 0, 'Columns can be sliced.', 'calccol'),
      XQ('Measures are evaluated in…', ['Row context','Filter context'], 1, 'The current filters.', 'context') ],
p11:[ XQ('Click Specialty → see doctors:', ['Drill-down','RLS','Append'], 0, 'Hierarchy drill.', 'interact'),
      XQ('Saved view for a presentation:', ['Bookmark','Gateway','Measure'], 0, 'Bookmarks.', 'interact'),
      RP('Check 3', '', '<b>Bar/column</b> of <b>No-show %</b> by <b>Visits › Reason</b>.', [[['bar','column'], 'Visits.Reason', 'No-show %']], 'visual'),
      XO('Check 4', 'Order the story.', ['What happened','Where','Why','Recommendation'], 'design'),
      XQ('Best insight →', ['"Lakeview no-shows 18%; reminders could save ~20 visits/month"','"Here are charts"'], 0, 'Number + place + action.', 'design') ],
p12:[ RL('Check 1', '', 'Role on <b>Patients</b> for <b>Hillcrest</b>.', 'Patients', 'Hillcrest Manager', 'Total Visits', '[City] = "Hillcrest"', 'rls'),
      RL('Check 2', '', 'Role on <b>Doctors</b> for <b>Orthopedics</b>.', 'Doctors', 'Ortho Team', 'Revenue', '[Specialty] = "Orthopedics"', 'rls'),
      XQ('RLS controls…', ['Which rows a user sees','Chart colours'], 0, 'Rows.', 'rls'),
      XQ('Local database refresh in the cloud needs…', ['A gateway','A bookmark'], 0, 'Gateway.', 'service'),
      XQ('Users are added to roles in…', ['Power BI Service','Power Query'], 0, 'Service → Security.', 'rls') ],
p13:[ MD('Check 1', '', 'Build the full clinic star (5 relationships).', [0, 1, 2, 3, 4], 'capstone'),
      DX('Check 2', '', 'Create <code>Completion %</code> = DIVIDE([Completed Visits], [Total Visits]).', 'Completion %', 'Completion % = DIVIDE([Completed Visits], [Total Visits])', CITY, 'capstone', {pre:CM, pct:true, need:/DIVIDE/i}),
      DX('Check 3', '', 'Create <code>Lab Tests</code> = COUNTROWS(Labs).', 'Lab Tests', 'Lab Tests = COUNTROWS(Labs)', AGE, 'capstone', {need:/COUNTROWS/i}),
      RP('Check 4', '', 'Card (<b>Total Visits</b>) + <b>line</b> of <b>Revenue</b> by <b>Month</b>.', [[['card'], null, 'Total Visits'], [['line'], 'Calendar.Month', 'Revenue']], 'capstone'),
      XQ('Start a project walkthrough with…', ['The business question & result','Font choices'], 0, 'Impact first.', 'capstone') ]
});
TRACKS.find(t => t.id === 'pbi').lessons.forEach(l => { if(PSTORY[l.id]) l.steps.unshift(STORY_STEP({...PSTORY[l.id], tool:'Power BI'})); });
