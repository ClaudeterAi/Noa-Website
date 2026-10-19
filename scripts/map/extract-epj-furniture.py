# Per-unit furniture from the EPJ vectors: only the furniture strokes (#767676 / #989898), clipped to each unit box,
# in unit-local map units. Closed shapes are flagged so the renderer can fill them (cushions, tables, poufs).
import json, re, sys
sys.path.insert(0, "/home/claude/noa")
from svgelements import SVG, Path, Close
cal=json.load(open("/tmp/boat/calib-main.json")); k=cal["k"]; x0=cal["x0"]; y0=cal["y0"]
# units from boat.ts (parse the TS quickly: lines with U( ... ) and arrays)
import subprocess
units=json.loads(subprocess.check_output(["node","-e","""
require('ts-node/register/transpile-only');
"""], cwd="/home/claude/noa", text=True) if False else "null")
# simpler: use tsx to print BOAT_UNITS
units=json.loads(subprocess.check_output(["npx","tsx","-e","import {BOAT_UNITS} from './src/components/booking/boat'; console.log(JSON.stringify(BOAT_UNITS))"], cwd="/home/claude/noa", text=True).strip().splitlines()[-1])
FURN={"#767676","#989898"}
def extract(src, deck):
    svg=SVG.parse(src, reify=True)
    out={}
    els=[(el, el.bbox()) for el in svg.elements() if isinstance(el, Path) and len(el)>0]
    els=[(el,bb) for el,bb in els if bb]
    for u in units:
        if u["deck"]!=deck or u["w"]==0: continue
        X1=x0+(u["x"]-260)*k; X2=x0+(u["x"]+u["w"]+260)*k; Y1=y0+(u["y"]-260)*k; Y2=y0+(u["y"]+u["h"]+260)*k
        paths=[]
        for el,bb in els:
            if bb[0]<X1 or bb[2]>X2 or bb[1]<Y1 or bb[3]>Y2: continue
            st=str(el.stroke) if el.stroke else "none"
            if st not in FURN: continue
            dash=el.values.get("stroke-dasharray")
            if dash and dash not in ("none",""): continue
            w=bb[2]-bb[0]; h=bb[3]-bb[1]
            if w<2.5 and h<2.5: continue
            # dimension leaders: single straight segments longer than 2 m
            if len(el)==1 and (w<0.4 or h<0.4) and max(w,h)/k>2000: continue
            # arrowheads / markers: tiny closed triangles
            if 'Z' in el.d().upper() and max(w,h)<3: continue
            p=Path(el.d(relative=False)); p*=f"scale({1/k/50}) translate({-(x0+u['x']*k)},{-(y0+u['y']*k)})"; p.reify()
            d=re.sub(r"(-?\d+\.\d{2,})", lambda m: f"{float(m.group(1)):.1f}", p.d(relative=False))
            closed = any(isinstance(s, Close) for s in el) or (abs(el.first_point - el.current_point) < 0.6 if el.first_point is not None and el.current_point is not None else False)
            paths.append([d, 1 if closed else 0, 1 if st=="#767676" else 0])
        out[u["id"]]=paths
    return out
res={}
res.update(extract("/tmp/boat/main.svg","main"))
res.update(extract("/tmp/boat/upper.svg","upper"))
json.dump(res, open("/home/claude/noa/src/components/booking/furniture.json","w"), separators=(",",":"))
import os; print("units:", len(res), "paths:", sum(len(v) for v in res.values()), "size KB:", os.path.getsize("/home/claude/noa/src/components/booking/furniture.json")//1024)
print({k:len(v) for k,v in list(res.items())[:12]})
