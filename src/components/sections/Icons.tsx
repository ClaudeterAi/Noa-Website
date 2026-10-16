import type { IconId } from "@/content/types";

/* Amenity icons — ported 1:1 from legacy-static/index.html */
export function AmenityIcon({ id }: { id: IconId }) {
  const s = { stroke: "#1a1a1a", strokeWidth: 1, fill: "none" } as const;
  switch (id) {
    case "pool":
      return <svg className="amen-ico" viewBox="0 0 30 30" fill="none"><rect x="2" y="17" width="26" height="9" rx="4.5" {...s} /><path d="M7,17 C7,11 10.7,7 15,7 C19.3,7 23,11 23,17" {...s} /><circle cx="15" cy="20" r="2" fill="#1a1a1a" opacity=".35" /></svg>;
    case "bar":
      return <svg className="amen-ico" viewBox="0 0 30 30" fill="none"><path d="M3,26 L3,13 L15,5 L27,13 L27,26" {...s} /><rect x="9" y="17" width="12" height="9" {...s} /><circle cx="15" cy="13" r="2" {...s} /></svg>;
    case "dining":
      return <svg className="amen-ico" viewBox="0 0 30 30" fill="none"><ellipse cx="15" cy="9" rx="7" ry="4.5" {...s} /><path d="M8,9 L5,24 L25,24 L22,9" {...s} /><line x1="5" y1="24" x2="25" y2="24" {...s} /></svg>;
    case "cabana":
      return <svg className="amen-ico" viewBox="0 0 30 30" fill="none"><rect x="3" y="11" width="24" height="15" rx="2" {...s} /><path d="M9,11 L9,8 Q9,4 13,4 L17,4 Q21,4 21,8 L21,11" {...s} /><circle cx="15" cy="19" r="2.5" {...s} /></svg>;
    case "dj":
      return <svg className="amen-ico" viewBox="0 0 30 30" fill="none"><path d="M3,15 C3,9 8.4,4 15,4 C21.6,4 27,9 27,15" {...s} /><path d="M8,15 C8,12 11.1,9.5 15,9.5" stroke="#1a1a1a" strokeWidth=".7" fill="none" /><rect x="3" y="15" width="24" height="10" rx="2" {...s} /></svg>;
    case "rooftop":
      return <svg className="amen-ico" viewBox="0 0 30 30" fill="none"><polygon points="15,2 18,10 27,10 20,15 23,23 15,18 7,23 10,15 3,10 12,10" {...s} /></svg>;
    case "daybed":
      return <svg className="amen-ico" viewBox="0 0 30 30" fill="none"><path d="M3,24 Q3,17 9,13.5 Q15,10 21,13.5 Q27,17 27,24" {...s} /><line x1="3" y1="24" x2="27" y2="24" {...s} /></svg>;
    case "shuttle":
      return <svg className="amen-ico" viewBox="0 0 30 30" fill="none"><ellipse cx="15" cy="22" rx="13" ry="4" stroke="#1a1a1a" strokeWidth=".7" opacity=".4" /><path d="M5,22 Q5,13 10,10 Q15,8 20,10 Q25,13 25,22" {...s} /><circle cx="15" cy="12" r="2.5" {...s} /></svg>;
  }
}
