import random, json, datetime as dt
random.seed(11)
products=[(1,'Classic Milk Tea','Milk Tea',5.5),(2,'Taro Milk Tea','Milk Tea',6.0),(3,'Brown Sugar Boba','Milk Tea',6.5),(4,'Mango Fruit Tea','Fruit Tea',5.75),(5,'Passion Fruit Tea','Fruit Tea',5.5),(6,'Matcha Latte','Milk Tea',6.25),(7,'Mochi Donut','Snacks',3.5),(8,'Popcorn Chicken','Snacks',7.0)]
stores=[(1,'Downtown','Seattle','West'),(2,'Lakeside','Chicago','Midwest'),(3,'Harbor','Boston','East'),(4,'Sunset','San Diego','West'),(5,'Uptown','New York','East'),(6,'Riverside','Austin','South')]
weights=[18,12,16,10,8,9,7,6]
storew=[20,14,16,12,22,10]
sales=[]
start=dt.date(2024,1,1)
oid=1001
for d in range(731):
    day=start+dt.timedelta(days=d)
    n=(1 if day.year==2025 and random.random()<0.35 else 0)+random.randint(1,3)+ (1 if day.month in (6,7,8) else 0)
    for _ in range(n):
        p=random.choices(products,weights)[0]; s=random.choices(stores,storew)[0]
        q=random.choice([2,3,4,5,6,8,10,12])
        sales.append([oid,day.isoformat(),s[0],p[0],q,round(q*p[3],2)]); oid+=1
cal=[]
for d in range(731):
    day=start+dt.timedelta(days=d)
    cal.append([day.isoformat(),day.year,day.month,day.strftime('%b'),f'Q{(day.month-1)//3+1}',day.strftime('%a')])
messy=[
 ['  ana LOPEZ ','Seattle, West','$45.50','2025-01-03'],['Ben carter','Chicago, Midwest','$12.00','2025-01-05'],['','','',''],
 ['cy  NGUYEN','Boston, East','$78.25','2025-01-09'],['Ben carter','Chicago, Midwest','$12.00','2025-01-05'],['dee PATEL  ','San Diego, West','$33.00','2025-01-12'],
 ['eli brooks','New York, East','$61.75','2025-01-15'],['','','',''],['FAY kim','Austin, South','$19.50','2025-01-18'],['gus  OLSEN','Seattle, West','$54.00','2025-01-21']]
extra={
 'wide':{'cols':['Store','Jan','Feb','Mar'],'rows':[['Downtown',4200,4500,4800],['Lakeside',3100,3000,3350],['Harbor',3900,4100,4000],['Sunset',2800,2950,3300]]},
 'q1':{'cols':['OrderID','Store','Amount'],'rows':[[1,'Downtown',42],[2,'Harbor',18],[3,'Sunset',30],[4,'Lakeside',25],[5,'Uptown',55]]},
 'q2':{'cols':['OrderID','Store','Amount'],'rows':[[6,'Riverside',20],[7,'Downtown',61],[8,'Harbor',33],[9,'Uptown',27]]},
 'orders':{'cols':['OrderID','StoreID','Amount'],'rows':[[101,1,42],[102,3,18],[103,4,30],[104,2,25],[105,5,55],[106,6,20],[107,1,61],[108,3,33]]},
 'storelk':{'cols':['StoreID','Store','Region'],'rows':[[s[0],s[1],s[3]] for s in stores]},
 'byregion':{'cols':['Region','Store','Amount'],'rows':[['West','Downtown',42],['East','Harbor',18],['West','Sunset',30],['Midwest','Lakeside',25],['East','Uptown',55],['South','Riverside',20],['West','Downtown',61],['East','Harbor',33]]}}
json.dump({'products':products,'stores':stores,'sales':sales,'calendar':cal,'messy':messy,'pq':extra},open('data.json','w'))
print(len(sales),'sales rows; revenue',round(sum(r[5] for r in sales),2))
