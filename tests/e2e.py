import os
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
SHOT=os.path.join(ROOT,'tests','shots'); os.makedirs(SHOT,exist_ok=True)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1280,'height':900})
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file://'+ROOT+'/index.html'); pg.wait_for_timeout(800)
    pg.screenshot(path=SHOT+'/welcome.png')
    pg.fill('#nm','Arjun'); pg.click('#go'); pg.wait_for_timeout(400)
    pg.screenshot(path=SHOT+'/home.png',full_page=True)
    lessons=pg.evaluate("__lab.TRACKS.flatMap(t=>t.lessons.map(l=>({id:l.id,types:l.steps.map(s=>s.type),q:l.steps.map(s=>s.a)})))")
    problems=[]
    for L in lessons:
        pg.evaluate(f"location.hash='#l-{L['id']}'"); pg.wait_for_timeout(250)
        for i,t in enumerate(L['types']):
            if t=='quiz':
                pg.click(f'.opt[data-i="{L["q"][i]}"]')
            elif t=='order':
                pg.evaluate("__lab.solveCurrent()")
            elif t in ('sheet','table','pivot','chart','pq','model','dax','report'):
                # first try an empty check: should NOT pass
                pg.click('#primary'); pg.wait_for_timeout(80)
                fb=pg.inner_text('#fb')
                if '🤔' not in fb: problems.append((L['id'],i,t,'empty check did not fail: '+fb[:60]))
                if (L['id'],t) in [('x2','sheet'),('x5','sheet'),('x8','pivot'),('p2','pq'),('p3','model'),('p5','dax'),('p7','report')] and not os.path.exists(f"{SHOT}/{L['id']}_{t}.png"):
                    pass
                pg.evaluate("__lab.solveCurrent()"); pg.wait_for_timeout(120)
                if (L['id'],t) in [('x2','sheet'),('x5','sheet'),('x7','table'),('x8','pivot'),('x8','chart'),('p2','pq'),('p3','model'),('p4','dax'),('p7','report')]:
                    pg.screenshot(path=f"{SHOT}/{L['id']}_{i}_{t}.png",full_page=True)
                pg.click('#primary'); pg.wait_for_timeout(120)
                fb=pg.inner_text('#fb')
                if '🤔' in fb or not fb: problems.append((L['id'],i,t,'solution failed: '+fb[:120]))
            pg.wait_for_timeout(60)
            txt=pg.inner_text('#primary')
            if 'Next' not in txt and 'Finish' not in txt: problems.append((L['id'],i,t,'primary not next: '+txt))
            pg.click('#primary'); pg.wait_for_timeout(150)
        # lesson modal
        if L['id'] in ('x2','p7'): pg.screenshot(path=f"{SHOT}/done_{L['id']}.png")
        pg.evaluate("document.querySelectorAll('.modal-bg').forEach(m=>m.remove())")
    pg.evaluate("location.hash='#home'"); pg.wait_for_timeout(400); pg.screenshot(path=SHOT+'/home_done.png',full_page=True)
    # games
    for g in pg.evaluate("GAMES_IDS = [...document.querySelectorAll('.game')].map(a=>a.getAttribute('href'))"):
        pg.evaluate(f"location.hash='{g}'"); pg.wait_for_timeout(300)
        kind=pg.evaluate(f"(()=>{{const id='{g}'.slice(3);return null}})()")
    print('games links ok')
    pg.evaluate("location.hash='#g-g1'"); pg.wait_for_timeout(300); pg.screenshot(path=SHOT+'/game_mem.png')
    pg.evaluate("location.hash='#cert-excel'"); pg.wait_for_timeout(400); pg.screenshot(path=SHOT+'/cert.png')
    # focus timer break
    pg.evaluate("location.hash='#l-x1'"); pg.wait_for_timeout(300)
    pg.evaluate("document.querySelector('#parkBtn').click()"); pg.wait_for_timeout(200); pg.fill('#pin','reply to Sam'); pg.click('#padd'); pg.wait_for_timeout(200); pg.screenshot(path=SHOT+'/parking.png')
    print('PROBLEMS',problems); print('ERRS',errs)
    b.close()
