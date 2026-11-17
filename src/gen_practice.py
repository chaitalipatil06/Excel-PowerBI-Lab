import json, csv, os
from openpyxl import Workbook
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.worksheet.table import Table, TableStyleInfo
from openpyxl.utils import get_column_letter
D=json.load(open('data.json')); out=os.path.join('..','practice'); os.makedirs(out,exist_ok=True)
Y=PatternFill('solid',fgColor='FFF4C2'); H=PatternFill('solid',fgColor='E3DBFA'); G=PatternFill('solid',fgColor='DDF3E9')
B=Font(bold=True); T=Font(bold=True,size=14,color='5B3FC4'); thin=Side(style='thin',color='D9D4E8')
def hdr(ws,row,cols,start=1):
    for i,c in enumerate(cols): x=ws.cell(row,start+i,c); x.font=B; x.fill=H
def task(ws,ref,note=''):
    ws[ref].fill=Y; ws[ref].border=Border(left=thin,right=thin,top=thin,bottom=thin)
def widths(ws,w):
    for i,x in enumerate(w,1): ws.column_dimensions[get_column_letter(i)].width=x
wb=Workbook(); ws=wb.active; ws.title='Start Here'
lines=["Lumi's Data Lab: Excel practice workbook","","How it works:","• Each sheet matches a lesson on the website.","• Yellow cells are your tasks. The instructions are at the top of each sheet.","• Stuck? The 'Answers' sheet has every formula.","• Tip: work 15 minutes, then take a short break. Small steps win! 🫧"]
for i,l in enumerate(lines,1): ws.cell(i,1,l).font=T if i==1 else Font(size=12)
widths(ws,[90])
A=[]  # answers: (sheet, cell, formula, note)
# 1 Grid
ws=wb.create_sheet('1 Grid'); ws['A1']='Task 1: type 42 in B4. Task 2: in C7 add A7 and B7 with a formula.'; ws['A1'].font=B
hdr(ws,3,['Drink','Cups']); ws['A4']='Milk Tea'; ws['B4']=None; task(ws,'B4')
hdr(ws,6,['Morning','Afternoon','Total']); ws['A7']=12; ws['B7']=30; task(ws,'C7'); widths(ws,[16,14,12])
A+= [('1 Grid','B4','42'),('1 Grid','C7','=A7+B7')]
# 2 Formulas
ws=wb.create_sheet('2 Formulas'); ws['A1']='Task: D4:D8 = Cups × Price (write D4, then double-click the fill handle). Then F4:F8 = Revenue × tax rate in G1 (lock it with F4 → $G$1).'; ws['A1'].font=B
ws['F1']='Tax rate'; ws['G1']=0.08; ws['G1'].number_format='0%'
hdr(ws,3,['Product','Cups','Price','Revenue','','Tax'])
rows=[['Classic Milk Tea',40,5.5],['Taro Milk Tea',25,6],['Brown Sugar Boba',32,6.5],['Mango Fruit Tea',18,5.75],['Mochi Donut',22,3.5]]
for i,r in enumerate(rows,4):
    for j,v in enumerate(r,1): ws.cell(i,j,v)
    task(ws,f'D{i}'); task(ws,f'F{i}'); A+=[('2 Formulas',f'D{i}',f'=B{i}*C{i}'),('2 Formulas',f'F{i}',f'=D{i}*$G$1')]
widths(ws,[20,8,8,10,4,10,8])
# 3 Functions
ws=wb.create_sheet('3 Functions'); ws['A1']='Tasks: B9 total (SUM), B10 average rounded to 1 decimal, B11 best day (MAX), B12 worst day (MIN), B13 count of days (COUNT).'; ws['A1'].font=B
hdr(ws,3,['Day','Cups'])
for i,(d,c) in enumerate([('Mon',120),('Tue',95),('Wed',140),('Thu',88),('Fri',160)],4): ws.cell(i,1,d); ws.cell(i,2,c)
for i,(l,f) in enumerate([('Total','=SUM(B4:B8)'),('Average','=ROUND(AVERAGE(B4:B8),1)'),('Best day','=MAX(B4:B8)'),('Worst day','=MIN(B4:B8)'),('Days','=COUNT(B4:B8)')],9):
    ws.cell(i,1,l).font=B; task(ws,f'B{i}'); A.append(('3 Functions',f'B{i}',f))
widths(ws,[14,10])
# 4 Logic
ws=wb.create_sheet('4 Logic'); ws['A1']='Tasks: E4:E8 "Hit"/"Miss" (Sales ≥ Target). F4:F8 bonus "Yes" if Sales ≥ 500 AND Region = "West". G4:G8 tier with IFS: ≥600 Gold, ≥450 Silver, else Bronze.'; ws['A1'].font=B
hdr(ws,3,['Store','Region','Target','Sales','Result','Bonus','Tier'])
for i,r in enumerate([['Downtown','West',500,620],['Lakeside','Midwest',400,380],['Harbor','East',450,450],['Sunset','West',300,410],['Uptown','East',600,540]],4):
    for j,v in enumerate(r,1): ws.cell(i,j,v)
    for c in 'EFG': task(ws,f'{c}{i}')
    A+=[('4 Logic',f'E{i}',f'=IF(D{i}>=C{i},"Hit","Miss")'),('4 Logic',f'F{i}',f'=IF(AND(D{i}>=500,B{i}="West"),"Yes","No")'),('4 Logic',f'G{i}',f'=IFS(D{i}>=600,"Gold",D{i}>=450,"Silver",TRUE,"Bronze")')]
widths(ws,[14,10,8,8,8,8,8])
# 5 Lookups
ws=wb.create_sheet('5 Lookups'); ws['A1']='Tasks: B4:B9 price with VLOOKUP from the table in F3:G9. C4:C9 do the same with XLOOKUP. D4:D9 category with INDEX/MATCH (table I3:J9). Then E4:E9 = Qty × Price.'; ws['A1'].font=B
hdr(ws,3,['Product','Price (VLOOKUP)','Price (XLOOKUP)','Category','Line total']); ws['F2']='Price list'; ws['I2']='Categories'
items=['Taro Milk Tea','Mochi Donut','Classic Milk Tea','Mango Fruit Tea','Matcha Latte','Popcorn Chicken']
hdr(ws,3,['Product','Price'],6); hdr(ws,3,['Product','Category'],9)
for i,p in enumerate(D['products'],4): ws.cell(i,6,p[1]); ws.cell(i,7,p[3]); ws.cell(i,9,p[1]); ws.cell(i,10,p[2])
ws.cell(3,12,'Qty').font=B
for i,p in enumerate(items,4):
    ws.cell(i,1,p); ws.cell(i,12,[3,6,2,4,1,2][i-4])
    for c in 'BCDE': task(ws,f'{c}{i}')
    A+=[('5 Lookups',f'B{i}',f'=VLOOKUP(A{i},$F$4:$G$11,2,FALSE)'),('5 Lookups',f'C{i}',f'=XLOOKUP(A{i},$F$4:$F$11,$G$4:$G$11)'),('5 Lookups',f'D{i}',f'=INDEX($J$4:$J$11,MATCH(A{i},$I$4:$I$11,0))'),('5 Lookups',f'E{i}',f'=L{i}*B{i}')]
widths(ws,[20,16,16,12,12,20,8,3,20,12,3,6])
# 6 IFs & Text
ws=wb.create_sheet('6 IFs & Text'); ws['A1']='Tasks: G4 West total (SUMIF). G5 orders > 100 (COUNTIF). G6 West + Milk Tea (SUMIFS). Then B16:B19 clean names =PROPER(TRIM(A16)).'; ws['A1'].font=B
hdr(ws,3,['Region','Category','Revenue'])
rv=[['West','Milk Tea',120],['East','Snacks',45],['West','Fruit Tea',88],['Midwest','Milk Tea',150],['West','Milk Tea',210],['East','Milk Tea',95],['South','Fruit Tea',60],['West','Snacks',32]]
for i,r in enumerate(rv,4):
    for j,v in enumerate(r,1): ws.cell(i,j,v)
for i,(l,f) in enumerate([('West total','=SUMIF(A4:A11,"West",C4:C11)'),('Orders > 100','=COUNTIF(C4:C11,">100")'),('West Milk Tea','=SUMIFS(C4:C11,A4:A11,"West",B4:B11,"Milk Tea")')],4):
    ws.cell(i,6,l).font=B; task(ws,f'G{i}'); A.append(('6 IFs & Text',f'G{i}',f))
hdr(ws,15,['Raw name','Clean name'])
for i,n in enumerate(['  ana LOPEZ ','BEN   carter','cy nguyen  ','  DEE patel'],16): ws.cell(i,1,n); task(ws,f'B{i}'); A.append(('6 IFs & Text',f'B{i}',f'=PROPER(TRIM(A{i}))'))
widths(ws,[16,16,10,3,3,16,10])
# 7 Orders (sort/filter/CF)
ws=wb.create_sheet('7 Orders'); ws['A1']='Tasks: click inside the data, press Ctrl+T. Sort Revenue largest → smallest. Filter Region = West. Home → Conditional Formatting → Highlight Cells > 500.'; ws['A1'].font=B
hdr(ws,3,['Order','Date','Store','Region','Product','Qty','Revenue'])
stores={s[0]:s for s in D['stores']}; prods={p[0]:p for p in D['products']}
for i,s in enumerate(D['sales'][:40],4):
    ws.append(None) if False else None
    ws.cell(i,1,s[0]); ws.cell(i,2,s[1]); ws.cell(i,3,stores[s[2]][1]); ws.cell(i,4,stores[s[2]][3]); ws.cell(i,5,prods[s[3]][1]); ws.cell(i,6,s[4]); ws.cell(i,7,s[5]*4)
widths(ws,[8,12,12,10,20,6,10])
# 8 Data (pivot)
ws=wb.create_sheet('8 Data'); ws['A1']=None
cols=['OrderID','Date','Month','Quarter','Store','Region','Product','Category','Qty','Revenue']
ws.append(cols)
cal={c[0]:c for c in D['calendar']}
for s in D['sales']:
    c=cal[s[1]]; st=stores[s[2]]; p=prods[s[3]]
    ws.append([s[0],s[1],c[3],c[4],st[1],st[3],p[1],p[2],s[4],s[5]])
ws.delete_rows(1)
t=Table(displayName='Orders',ref=f'A1:J{len(D["sales"])+1}'); t.tableStyleInfo=TableStyleInfo(name='TableStyleMedium7',showRowStripes=True); ws.add_table(t)
widths(ws,[9,12,7,8,11,9,20,10,6,10])
ws2=wb.create_sheet('8 Pivot Tasks'); 
for i,l in enumerate(["Mini project (use the '8 Data' sheet):","1. Insert → PivotTable → Region in Rows, Sum of Revenue in Values.","2. Add Quarter to Columns.","3. Insert → PivotChart → Line, with Month on the axis.","4. PivotTable Analyze → Insert Slicer → Category.","5. Give it a title that states the insight, e.g. 'East and West drive 70% of revenue'."],1): ws2.cell(i,1,l).font=B if i==1 else Font(size=12)
widths(ws2,[90])
# Answers
ws=wb.create_sheet('Answers'); hdr(ws,1,['Sheet','Cell','Formula / answer'])
for i,(s,c,f) in enumerate(A,2): ws.cell(i,1,s); ws.cell(i,2,c); ws.cell(i,3,"'"+f if f.startswith('=') else f)
widths(ws,[16,8,70])
wb.save(os.path.join(out,'Lumi_Excel_Practice.xlsx'))
# Power BI dataset
wb=Workbook(); first=True
for name,cols,rows in [('Sales',['OrderID','Date','StoreID','ProductID','Qty','Revenue'],D['sales']),('Products',['ProductID','Product','Category','Price'],D['products']),('Stores',['StoreID','Store','City','Region'],D['stores']),('Calendar',['Date','Year','MonthNum','Month','Quarter','Weekday'],D['calendar'])]:
    ws=wb.active if first else wb.create_sheet(); first=False; ws.title=name; ws.append(cols)
    for r in rows: ws.append(r)
    t=Table(displayName=name+'Table' if name=='Calendar' else name,ref=f'A1:{get_column_letter(len(cols))}{len(rows)+1}'); t.tableStyleInfo=TableStyleInfo(name='TableStyleMedium2',showRowStripes=True); ws.add_table(t)
    widths(ws,[14]*len(cols))
wb.save(os.path.join(out,'LumiBoba_PowerBI_Data.xlsx'))
with open(os.path.join(out,'Messy_Customers.csv'),'w',newline='') as f:
    w=csv.writer(f); w.writerow(['Customer','Location','Amount','Date']); w.writerows(D['messy'])
print('ok', len(A),'answers')
