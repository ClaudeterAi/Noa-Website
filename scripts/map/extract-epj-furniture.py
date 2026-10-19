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
            # dimension leaders and section lines: single straight segments longer than 600 mm inside rooms, 2 m elsewhere
            lim = 2200 if u["type"] in ("cabana","upper-cabana","alfresco","vip-booth","lounge") else 2000
            if len(el)==1 and (w<0.4 or h<0.4) and max(w,h)/k>lim: continue
            # arrowheads / markers: tiny closed triangles
            if 'Z' in el.d().upper() and max(w,h)<3: continue
            # perimeter outlines of the unit itself (walls, posts rails): anything spanning ≥ 92% of the box in either axis along an edge
            if u["type"] in ("cabana","upper-cabana","lounge","vip-booth","alfresco"):   # rooms: drop their own walls/rails; a daybed's outline IS the piece
                uw=u["w"]*k; uh=u["h"]*k; ux=x0+u["x"]*k; uy=y0+u["y"]*k
                near=lambda a,b,t=90*k: abs(a-b)<t
                if ((w>=0.92*uw and h<3*k) and (near(bb[1],uy) or near(bb[3],uy+uh))) or ((h>=0.92*uh and w<3*k) and (near(bb[0],ux) or near(bb[2],ux+uw))): continue
                if w>=0.92*uw and h>=0.92*uh: continue
            # outer outlines that duplicate the unit block itself (the tinted base already draws that shape)
            if w/k > u["w"]*0.86 and h/k > u["h"]*0.86: continue
            p=Path(el.d(relative=False)); p*=f"scale({1/k/50}) translate({-(x0+u['x']*k)},{-(y0+u['y']*k)})"; p.reify()
            d=re.sub(r"(-?\d+\.\d{2,})", lambda m: f"{float(m.group(1)):.1f}", p.d(relative=False))
            closed = any(isinstance(s, Close) for s in el) or (abs(el.first_point - el.current_point) < 0.6 if el.first_point is not None and el.current_point is not None else False)
            # bbox in unit-local map units, so the renderer can lay a soft cushion/table fill under open polylines too
            lx=(bb[0]-(x0+u['x']*k))/k/50; ly=(bb[1]-(y0+u['y']*k))/k/50; lw=w/k/50; lh=h/k/50
            segs=len(el)
            pad = 1 if closed else (2 if (segs>=3 and 5<=lw<=42 and 5<=lh<=42) else 0)   # 2 = cushion-like open polyline
            paths.append([d, pad, round(lx,1), round(ly,1), round(lw,1), round(lh,1), 1 if st=="#767676" else 0])
        # furniture pieces as connected groups of strokes → one soft fill per piece (sofas, tables, poufs); rooms only
        fills=[]
        if u["type"] in ("cabana","upper-cabana","alfresco","vip-booth","lounge"):
            uw0=u["w"]/50; uh0=u["h"]/50
            def usable(p):
                d,kind,lx,ly,lw,lh,furn=p
                if lw>=0.8*uw0 or lh>=0.8*uh0: return False
                if u["type"]=="lounge" and max(lw,lh)>16: return False   # lounge: cluster only the small pieces (poufs, side tables); sofas are ribbons
                straight = (lw<0.4 or lh<0.4)
                if straight and max(lw,lh)>(12 if u["type"]=="lounge" else 32): return False       # section/leader lines through the room (table edges are ≤ 30)
                return lw>=1.5 or lh>=1.5
            boxes=[[p[2],p[3],p[2]+p[4],p[3]+p[5]] for p in paths if usable(p)]
            tol = 0.12 if u["type"]=="lounge" else 1.4     # lounge poufs touch their neighbours' seams; only merge strokes that actually meet
            merged=True
            while merged:
                merged=False; out2=[]
                while boxes:
                    a=boxes.pop()
                    for i,b in enumerate(out2):
                        if a[0]<=b[2]+tol and a[2]>=b[0]-tol and a[1]<=b[3]+tol and a[3]>=b[1]-tol:
                            out2[i]=[min(a[0],b[0]),min(a[1],b[1]),max(a[2],b[2]),max(a[3],b[3])]; merged=True; break
                    else: out2.append(a)
                boxes=out2
            uw=u["w"]/50; uh=u["h"]/50
            for b in boxes:
                bw=b[2]-b[0]; bh=b[3]-b[1]
                if 3<=bw<=0.96*uw and 3<=bh<=0.96*uh and not (bw>=0.9*uw and bh>=0.9*uh): fills.append([round(b[0],1),round(b[1],1),round(bw,1),round(bh,1)])
        # poufs / side tables drawn as two half-outlines (top+bottom or left+right): pair them into one body
        halves=[p for p in paths if 4.5<=max(p[4],p[5])<=14 and (abs(p[5]-p[4]/2)<p[4]*0.18 or abs(p[4]-p[5]/2)<p[5]*0.18)]
        used=set()
        for i,a in enumerate(halves):
            if i in used: continue
            for j,b in enumerate(halves):
                if j<=i or j in used: continue
                ax,ay,aw,ah=a[2],a[3],a[4],a[5]; bx,by,bw,bh=b[2],b[3],b[4],b[5]
                if abs(ax-bx)<0.5 and abs(aw-bw)<0.6 and ah<aw and (abs(ay+ah-by)<0.6 or abs(by+bh-ay)<0.6):
                    fills.append([round(min(ax,bx),1),round(min(ay,by),1),round(aw,1),round(ah+bh,1)]); used.update((i,j)); break
                if abs(ay-by)<0.5 and abs(ah-bh)<0.6 and aw<ah and (abs(ax+aw-bx)<0.6 or abs(bx+bw-ax)<0.6):
                    fills.append([round(min(ax,bx),1),round(min(ay,by),1),round(aw+bw,1),round(ah,1)]); used.update((i,j)); break
        # poufs drawn from corner arcs + short edges: cluster only the tiny strokes, keep squarish 5–14 unit groups
        if u["type"] in ("lounge","cabana","upper-cabana","alfresco","vip-booth"):
            tiny=[[p[2],p[3],p[2]+p[4],p[3]+p[5]] for p in paths if max(p[4],p[5])<=4.2 and max(p[4],p[5])>=0.8]
            merged=True
            while merged:
                merged=False; out3=[]
                while tiny:
                    a=tiny.pop()
                    for i,b in enumerate(out3):
                        if a[0]<=b[2]+0.15 and a[2]>=b[0]-0.15 and a[1]<=b[3]+0.15 and a[3]>=b[1]-0.15:
                            out3[i]=[min(a[0],b[0]),min(a[1],b[1]),max(a[2],b[2]),max(a[3],b[3])]; merged=True; break
                    else: out3.append(a)
                tiny=out3
            for b in tiny:
                bw=b[2]-b[0]; bh=b[3]-b[1]
                if 5<=bw<=14 and 5<=bh<=14 and abs(bw-bh)<max(bw,bh)*0.25:
                    if not any(abs(fx-b[0])<1 and abs(fy-b[1])<1 for fx,fy,_,_ in fills): fills.append([round(b[0],1),round(b[1],1),round(bw,1),round(bh,1)])
        out[u["id"]]={"p":paths,"f":fills}
    return out
res={}
res.update(extract("/tmp/boat/main.svg","main"))
res.update(extract("/tmp/boat/upper.svg","upper"))
# identical rooms: where a room's own strokes were tangled by section marks, take the bodies from its best sibling in the same row
import collections
byid={u["id"]:u for u in units}
groups=collections.defaultdict(list)
for uid,v in res.items():
    u=byid[uid]
    if u["type"] in ("cabana","upper-cabana","alfresco"): groups[(u["type"], u["y"]<7000, u["w"], u["h"])].append(uid)
for key,ids in groups.items():
    best=max(ids, key=lambda i: len(res[i]["f"]))
    for i in ids:
        if len(res[i]["f"]) < 0.6*len(res[best]["f"]):
            res[i]["f"]=res[best]["f"]; res[i]["p"]=res[best]["p"]; print("sibling bodies:", i, "<-", best)
json.dump(res, open("/home/claude/noa/src/components/booking/furniture.json","w"), separators=(",",":"))
import os; print("units:", len(res), "paths:", sum(len(v) for v in res.values()), "size KB:", os.path.getsize("/home/claude/noa/src/components/booking/furniture.json")//1024)
print({k:len(v) for k,v in list(res.items())[:12]})
