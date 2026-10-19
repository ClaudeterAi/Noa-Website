import sys, json, re
from svgelements import SVG, Path
def extract(src, cal, TOP, BEAM, out_path, x_min=0, x_max=52000):
    k=cal["k"]; x0=cal["x0"]; y0=cal["y0"]
    X1=x0+x_min*k; X2=x0+x_max*k; Y1=y0+TOP*k; Y2=y0+(TOP+BEAM)*k
    svg = SVG.parse(src, reify=True)
    out=[]; dropped=0
    for el in svg.elements():
        if not isinstance(el, Path) or len(el)==0: continue
        bb=el.bbox()
        if not bb: continue
        if bb[2]<X1 or bb[0]>X2 or bb[3]<Y1 or bb[1]>Y2: continue
        w=bb[2]-bb[0]; h=bb[3]-bb[1]
        if w<5 and h<5: dropped+=1; continue                  # glyphs, hatch dots, tick marks, datum symbols
        if w>1800 and h>900: continue                       # page frame
        stroke=str(el.stroke) if el.stroke else "none"; fill=str(el.fill) if el.fill else "none"
        if stroke=="none" and fill=="none": continue
        dash=el.values.get('stroke-dasharray')
        if dash and dash not in ("none",""): continue              # centrelines, roof lines, hidden lines
        if fill in ("#000000",) and stroke=="none": continue        # section arrows / markers
        if fill!="none" and stroke=="none": continue               # floor fills hide the furniture; we add our own under-layer
        sw=float(el.values.get('stroke-width','1') or 1)
        # grid lines and section lines: single straight segments longer than 8 m
        if len(el)==1 and (abs(bb[2]-bb[0])<0.6 or abs(bb[3]-bb[1])<0.6) and max(w,h)/k>8000: continue
        # datum / level markers: small closed shapes with a black fill
        if fill=="#000000" and max(w,h)<14: continue
        p=Path(el.d(relative=False))
        p *= f"scale({1/k/50}) translate({-x0},{-(y0+TOP*k)})"
        p.reify()
        out.append((p.d(relative=False), stroke, fill, sw))
    INK={"#000000":"#3d2f20","#767676":"#5a4a36","#989898":"#7a6a52","#bababa":"#a39474","#dbdbdb":"#c2b59c","#808080":"#6b5b45"}
    parts=[]
    for d,st,fl,sw in out:
        d=re.sub(r"(-?\d+\.\d{2,})", lambda m: f"{float(m.group(1)):.1f}", d)
        stroke = INK.get(st, "#6b5a44") if st!="none" else "none"
        fillc = "none"
        parts.append(f'<path d="{d}" fill="{fillc}" stroke="{stroke}" stroke-width="{max(0.34, sw*0.42):.2f}"/>')
    W=52000/50; H=BEAM/50
    svgtxt=(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H:.1f}"><defs><clipPath id="hull"><rect x="0" y="0" width="{W}" height="{H:.1f}" rx="28"/></clipPath></defs>'
            f'<g clip-path="url(#hull)" stroke-linecap="round" stroke-linejoin="round" fill-rule="evenodd">{"".join(parts)}</g></svg>')
    open(out_path,"w").write(svgtxt); print(out_path, "paths", len(out), "tiny dropped", dropped, "size", len(svgtxt)//1024, "KB")
if __name__=="__main__":
    cal=json.load(open("/tmp/boat/calib-main.json"))
    extract("/tmp/boat/main.svg", cal, -270, 14740, "/tmp/boat/main-deck-lines.svg")
    extract("/tmp/boat/upper.svg", cal, -270, 14740, "/tmp/boat/upper-deck-lines.svg")
