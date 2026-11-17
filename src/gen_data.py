import random, json, datetime as dt
random.seed(11)
products=[(1,'Classic Milk Tea','Milk Tea',5.5),(2,'Taro Milk Tea','Milk Tea',6.0),(3,'Brown Sugar Boba','Milk Tea',6.5),(4,'Mango Fruit Tea','Fruit Tea',5.75),(5,'Passion Fruit Tea','Fruit Tea',5.5),(6,'Matcha Latte','Milk Tea',6.25),(7,'Mochi Donut','Snacks',3.5),(8,'Popcorn Chicken','Snacks',7.0)]
stores=[(1,'Downtown','Seattle','West'),(2,'Lakeside','Chicago','Midwest'),(3,'Harbor','Boston','East'),(4,'Sunset','San Diego','West'),(5,'Uptown','New York','East'),(6,'Riverside','Austin','South')]
weights=[18,12,16,10,8,9,7,6]
storew=[20,14,16,12,22,10]
sales=[]
start=dt.date(2025,1,1)
oid=1001
for d in range(365):
    day=start+dt.timedelta(days=d)
    n=random.randint(1,3)+ (1 if day.month in (6,7,8) else 0)
    for _ in range(n):
        p=random.choices(products,weights)[0]; s=random.choices(stores,storew)[0]
        q=random.choice([2,3,4,5,6,8,10,12])
        sales.append([oid,day.isoformat(),s[0],p[0],q,round(q*p[3],2)]); oid+=1
cal=[]
for d in range(365):
    day=start+dt.timedelta(days=d)
    cal.append([day.isoformat(),day.year,day.month,day.strftime('%b'),f'Q{(day.month-1)//3+1}',day.strftime('%a')])
messy=[
 ['  ana LOPEZ ','Seattle, West','$45.50','2025-01-03'],['Ben carter','Chicago, Midwest','$12.00','2025-01-05'],['','','',''],
 ['cy  NGUYEN','Boston, East','$78.25','2025-01-09'],['Ben carter','Chicago, Midwest','$12.00','2025-01-05'],['dee PATEL  ','San Diego, West','$33.00','2025-01-12'],
 ['eli brooks','New York, East','$61.75','2025-01-15'],['','','',''],['FAY kim','Austin, South','$19.50','2025-01-18'],['gus  OLSEN','Seattle, West','$54.00','2025-01-21']]
json.dump({'products':products,'stores':stores,'sales':sales,'calendar':cal,'messy':messy},open('data.json','w'))
print(len(sales),'sales rows; revenue',round(sum(r[5] for r in sales),2))
