import os
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
SHOT=os.path.join(ROOT,'tests','shots'); os.makedirs(SHOT,exist_ok=True)
INTER=('sheet','table','pivot','chart','pq','model','dax','report','calccol','rls')
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1280,'height':900})
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file://'+ROOT+'/index.html'); pg.wait_for_timeout(800)
    pg.fill('#nm','Arjun'); pg.click('#go'); pg.wait_for_timeout(300)
    pg.evaluate("Object.assign(__lab.S.done, Object.fromEntries(__lab.allLessons().map(l=>[l.id,true]))); __lab.save()")
    ids=pg.evaluate("__lab.allLessons().map(l=>l.id)")
    problems=[]; counts={'p':0,'c':0}
    only=os.environ.get('LIDS'); ids=[i for i in ids if not only or i in only.split(',')]
    for lid in ids:
        for mode in ('p','c'):
            steps=pg.evaluate(f"(__lab.findLesson('{lid}_{mode}')||{{steps:[]}}).steps.map(s=>[s.type,s.a ?? null,!!s.k])")
            if not steps: problems.append((lid,mode,'no steps')); continue
            counts[mode]+=len(steps)
            pg.evaluate(f"location.hash='#l-{lid}_{mode}'"); pg.wait_for_timeout(200)
            for i,(t,a,hask) in enumerate(steps):
                if mode=='c' and not hask: problems.append((lid,mode,i,'no skill tag'))
                skip = mode=='c' and i==1   # deliberately skip one per check to exercise the report
                if skip and t!='learn':
                    pg.click('#skipBtn'); pg.wait_for_timeout(120)
                elif t=='quiz':
                    pg.click(f'.opt[data-i="{a}"]')
                elif t=='order':
                    pg.evaluate("__lab.solveCurrent()")
                elif t in INTER:
                    pg.click('#primary'); pg.wait_for_timeout(60)
                    fb=pg.inner_text('#fb')
                    if '🤔' not in fb: problems.append((lid,mode,i,t,'empty passed: '+fb[:60]))
                    pg.evaluate("__lab.solveCurrent()"); pg.wait_for_timeout(90)
                    pg.click('#primary'); pg.wait_for_timeout(90)
                    fb=pg.inner_text('#fb')
                    if '🤔' in fb or not fb: problems.append((lid,mode,i,t,'solution failed: '+fb[:140]))
                pg.wait_for_timeout(40)
                txt=pg.inner_text('#primary')
                if not any(w in txt for w in ('Next','Finish','report')): problems.append((lid,mode,i,t,'primary: '+txt)); break
                pg.click('#primary'); pg.wait_for_timeout(100)
            if mode=='c':
                rep=pg.evaluate("__lab.S.skill && __lab.S.skill['%s']"%lid)
                if not rep or not (40<=rep['pct']<=100): problems.append((lid,'report',rep))
                if lid in ('x5','p5'): pg.screenshot(path=f'{SHOT}/report_{lid}.png',full_page=True)
            pg.evaluate("document.querySelectorAll('.modal-bg').forEach(m=>m.remove())")
    pg.evaluate("location.hash='#home'"); pg.wait_for_timeout(400); pg.screenshot(path=SHOT+'/home_profile.png',full_page=True)
    pg.evaluate("location.hash='#l-x4'"); pg.wait_for_timeout(300); pg.screenshot(path=SHOT+'/story_x4.png')
    pg.evaluate("location.hash='#l-p12_p'"); pg.wait_for_timeout(300); pg.screenshot(path=SHOT+'/prac_p12.png')
    print('COUNTS',counts); print('PROBLEMS',len(problems)); [print(x) for x in problems[:60]]; print('ERRS',errs[:10])
    b.close()
