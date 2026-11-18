import json, os
here=os.path.dirname(os.path.abspath(__file__)); r=lambda p:open(os.path.join(here,p)).read()
h=r('shell.html')
for k,f in [('CSS','style.css'),('XL','engine-excel.js'),('PBI','engine-pbi.js'),('CONTENT','content.js'),('ADV','content-adv.js'),('PX','practice-excel.js'),('PP','practice-pbi.js'),('APP','app.js')]:
    h=h.replace('/*%s*/'%k, r(f).replace('</script','<\\/script'),1)
h=h.replace('/*DATA*/', json.dumps(json.load(open(os.path.join(here,'data.json'))),separators=(',',':')),1)
open(os.path.join(here,'..','index.html'),'w').write(h); print('built',len(h))
