/**
 * THE NOA — geometry for the seat map, read from the detailed-design set by Atelier EPJ
 * (EPJ-NA-DXB-01, sheets NA-ID-1000 main deck, NA-ID-1100 upper deck, rev 00 · 17.07.2026).
 * All positions are millimetres from the bow (x) and the port rail (y); the hull is 52 000 × 15 000.
 * The map draws at 1:50 (divide by 50), so the viewBox is 1040 × 300 per deck.
 *
 * Customer-facing: sellable seats are `units`; pool, stage, bars, reception, restrooms, salon and
 * arrival points are `amenities`. Back of house (kitchen, prep/store, store, A/V room, artists' room,
 * service stations, stowage, dumbwaiter) is drawn as one quiet "Kitchen & service" block, and the
 * captain's deck (developed by others) is not drawn.
 */
export type Deck = "main" | "upper";
export interface BoatUnit { id: string; type: string; deck: Deck; x: number; y: number; w: number; h: number; label: string; r?: number }
export interface Amenity { id: string; deck: Deck; kind: "pool" | "stage" | "bar" | "label" | "restroom" | "stairs" | "arrival" | "boh" | "salon" | "canopy" | "dj"; x: number; y: number; w: number; h: number; name: { en: string; ar: string }; r?: number }

export const HULL = { length: 52000, beam: 16740, top: -1270, corner: 1400 };  // hull edges sit 1270 mm outside the furniture frame (y = 0 at the cabana block): 270 mm of rail from the EPJ frame plus 1 m of drawn deck per side so the hull reads as a boat, not a strip. Furniture positions are untouched.
export const SCALE = 50;

const units: BoatUnit[] = [];
const amenities: Amenity[] = [];
const U = (id: string, type: string, deck: Deck, x: number, y: number, w: number, h: number, label: string, r?: number) => units.push({ id, type, deck, x, y, w, h, label, r });
const A = (id: string, deck: Deck, kind: Amenity["kind"], x: number, y: number, w: number, h: number, en: string, ar: string, r?: number) => amenities.push({ id, deck, kind, x, y, w, h, name: { en, ar }, r });

/* ------------------------------------------------------------------ MAIN DECK — every box measured from NA-ID-1000 vectors */
// Extended sun deck: ten loungers along the bow rail (1153 × 601), in five pairs
[2660, 3445, 4532, 5318, 6403, 7188, 8275, 9061, 10146, 10931].forEach((y, i) => U(`sunbed-${i + 1}`, "sunbed", "main", 673, y, 1153, 601, `S${i + 1}`));

// Infinity pool: bay 5000 × 12100 at the bow, channel to the steps
A("pool-bay", "main", "pool", 2300, 1048, 5000, 12100, "Infinity pool", "المسبح اللامتناهي");
A("pool-run", "main", "pool", 7300, 5830, 15300, 2300, "Infinity pool", "المسبح اللامتناهي");
A("pool-steps", "main", "stairs", 22600, 5830, 1300, 2300, "Pool steps", "درجات المسبح");

// Pool daybeds: six per side at 2300 pitch (1160 × 1600), one each side at the bay
for (let i = 0; i < 6; i++) { U(`daybed-${i + 1}`, "daybed", "main", 9193 + i * 2300, 3853, 1160, 1600, `D${i + 1}`); U(`daybed-${i + 7}`, "daybed", "main", 9193 + i * 2300, 8447, 1160, 1600, `D${i + 7}`); }
U("daybed-13", "daybed", "main", 7240, 1903, 1662, 1399, "D13"); U("daybed-14", "daybed", "main", 7240, 10598, 1662, 1399, "D14");

// Pool cabanas: 2890 × 3240 blocks at 8840 / 12132 / 15422 / 18711
[8840, 12132, 15422, 18711].forEach((x, i) => { U(`cabana-${i + 1}`, "cabana", "main", x, 0, 2890, 3240, `C${i + 1}`); U(`cabana-${i + 5}`, "cabana", "main", x, 10840, 2890, 3240, `C${i + 5}`); });

// Wellness, restrooms (service stations behind them are masked)
A("spa", "main", "salon", 22100, 100, 3400, 3100, "Manicure · pedicure · massage", "مانيكير · باديكير · مساج");
A("salon", "main", "salon", 22100, 10980, 3400, 3100, "Hair salon · tattoo station", "صالون شعر · محطة وشم");
A("wc-w-mid", "main", "restroom", 25650, 100, 3150, 3100, "Women's restroom", "دورة مياه السيدات");
A("wc-m-mid", "main", "restroom", 25650, 10980, 3150, 3100, "Men's restroom", "دورة مياه الرجال");
A("svc-p", "main", "boh", 28900, 100, 2850, 3100, "", "");
A("svc-s", "main", "boh", 28900, 10980, 2850, 3100, "", "");

// Stage / dance area under the roof line, mobile DJ station, five high tables per side
A("stage", "main", "stage", 30700, 4030, 9300, 6100, "Stage · dance area", "المسرح · منطقة الرقص");
A("dj", "main", "dj", 33800, 6300, 3000, 2400, "Mobile DJ station", "منصة دي جي متنقلة");
for (let i = 0; i < 5; i++) { const cx = 33300 + i * 1340; U(`table-${i + 1}`, "table", "main", cx - 280, 4300, 560, 560, `T${i + 1}`, 280); U(`table-${i + 6}`, "table", "main", cx - 280, 9300, 560, 560, `T${i + 6}`, 280); }

// Lounge cabanas: the 11198 block holds two 5480 clusters per side
[31803, 37521].forEach((x, i) => { U(`lounge-${i + 1}`, "lounge", "main", x, 0, 5480, 3240, `L${i + 1}`); U(`lounge-${i + 3}`, "lounge", "main", x, 10840, 5480, 3240, `L${i + 3}`); });

// Bar, stairs, reception, stern restrooms, back of house (masked)
A("bar-main", "main", "bar", 40700, 5030, 2600, 4100, "Bar", "البار", 500);
A("stairs-p", "main", "stairs", 43100, 930, 1000, 2000, "Stairs up", "درج للأعلى");
A("stairs-s", "main", "stairs", 43100, 11810, 1000, 2000, "Stairs up", "درج للأعلى");
A("reception", "main", "label", 45250, 150, 2950, 3050, "Reception · foyer", "الاستقبال · البهو");
A("wc-w-stern", "main", "restroom", 48350, 150, 3050, 3050, "Women's restroom", "دورة مياه السيدات");
A("wc-m-stern", "main", "restroom", 48350, 10950, 3050, 3050, "Men's restroom", "دورة مياه الرجال");
A("boh", "main", "boh", 45250, 3400, 6150, 7350, "Kitchen & service", "المطبخ والخدمات");
A("boh-2", "main", "boh", 45250, 10950, 2950, 3050, "Staff only", "للموظفين فقط");

/* ------------------------------------------------------------------ UPPER DECK — from NA-ID-1100 vectors */
A("void", "upper", "label", 30700, 4030, 10800, 6100, "Open to the dance floor below", "مفتوح على حلبة الرقص بالأسفل");
[31900, 34650, 37400, 40150].forEach((x, i) => { U(`upper-cabana-${i + 1}`, "upper-cabana", "upper", x, 120, 2650, 3000, `U${i + 1}`); U(`upper-cabana-${i + 5}`, "upper-cabana", "upper", x, 11080, 2650, 3000, `U${i + 5}`); });
U("vip-booth-1", "vip-booth", "upper", 41800, 4450, 2500, 5300, "VIP", 400);
A("bar-upper", "upper", "bar", 45600, 5730, 4000, 3000, "Bar · sushi bar", "البار · بار السوشي", 500);
A("stairs-up-p", "upper", "stairs", 44000, 930, 1000, 2000, "Stairs down", "درج للأسفل");
A("stairs-up-s", "upper", "stairs", 44000, 11810, 1000, 2000, "Stairs down", "درج للأسفل");
[45300, 47500, 49800].forEach((x, i) => { U(`alfresco-${i + 1}`, "alfresco", "upper", x, 120, 2000, 3000, `A${i + 1}`); U(`alfresco-${i + 4}`, "alfresco", "upper", x, 11080, 2000, 3000, `A${i + 4}`); });
for (let i = 0; i < 4; i++) { const cx = 46000 + i * 1200; U(`table-${i + 11}`, "table", "upper", cx - 300, 3730, 600, 600, `T${i + 11}`, 300); U(`table-${i + 15}`, "table", "upper", cx - 300, 9730, 600, 600, `T${i + 15}`, 300); }
A("boh-upper", "upper", "boh", 49900, 3700, 1800, 6700, "", "");
A("alfresco-p", "upper", "label", 45300, 3250, 6500, 400, "Alfresco lounge", "صالة في الهواء الطلق");
A("alfresco-s", "upper", "label", 45300, 10650, 6500, 400, "Alfresco lounge", "صالة في الهواء الطلق");

// General entry: dance-floor capacity sold per person (not drawn as seats)
for (let i = 0; i < 40; i++) U(`entry-${i + 1}`, "entry", "main", 0, 0, 0, 0, `E${i + 1}`);

export const BOAT_UNITS = units;
export const BOAT_AMENITIES = amenities;
export const unitDeck = (id: string): Deck => units.find((u) => u.id === id)?.deck ?? "main";
