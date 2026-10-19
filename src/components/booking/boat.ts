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

export const HULL = { length: 52000, beam: 15000 };
export const SCALE = 50;

const units: BoatUnit[] = [];
const amenities: Amenity[] = [];
const U = (id: string, type: string, deck: Deck, x: number, y: number, w: number, h: number, label: string, r?: number) => units.push({ id, type, deck, x, y, w, h, label, r });
const A = (id: string, deck: Deck, kind: Amenity["kind"], x: number, y: number, w: number, h: number, en: string, ar: string, r?: number) => amenities.push({ id, deck, kind, x, y, w, h, name: { en, ar }, r });

/* ------------------------------------------------------------------ MAIN DECK (FFL +1800) */
// Extended sun deck at the bow (FFL +1200): ten loungers in five pairs along the rail, two parasol tables
for (let i = 0; i < 10; i++) { const pair = Math.floor(i / 2), inPair = i % 2; U(`sunbed-${i + 1}`, "sunbed", "main", 1000, 2500 + pair * 1900 + inPair * 800, 1800, 650, `S${i + 1}`); }
A("arr-bow-p", "main", "arrival", 600, 300, 1400, 1200, "Arrival / departure", "الوصول / المغادرة");
A("arr-bow-s", "main", "arrival", 600, 13500, 1400, 1200, "Arrival / departure", "الوصول / المغادرة");

// Infinity pool (FFL +0600): wide bay at the bow, long channel to the pool steps
A("pool-bay", "main", "pool", 3000, 1900, 4300, 11200, "Infinity pool", "المسبح اللامتناهي");
A("pool-run", "main", "pool", 7300, 5600, 13700, 3800, "Infinity pool", "المسبح اللامتناهي");
A("pool-steps", "main", "stairs", 21000, 6300, 1200, 2400, "Pool steps", "درجات المسبح");

// Pool daybeds (FFL +1800): six per side along the channel at 2100 pitch, plus one each side at the bay
for (let i = 0; i < 6; i++) { U(`daybed-${i + 1}`, "daybed", "main", 9000 + i * 2100, 3900, 1400, 1500, `D${i + 1}`); U(`daybed-${i + 7}`, "daybed", "main", 9000 + i * 2100, 9600, 1400, 1500, `D${i + 7}`); }
U("daybed-13", "daybed", "main", 7250, 2300, 1540, 1200, "D13"); U("daybed-14", "daybed", "main", 7250, 11500, 1540, 1200, "D14");

// Pool cabanas (FFL +1950): four per side, 2890 wide, 3240 deep
for (let i = 0; i < 4; i++) { const x = 8840 + i * 3290; U(`cabana-${i + 1}`, "cabana", "main", x, 0, 2890, 3240, `C${i + 1}`); U(`cabana-${i + 5}`, "cabana", "main", x, 11760, 2890, 3240, `C${i + 5}`); }

// Wellness (customer-facing, not bookable online)
A("spa", "main", "salon", 22050, 0, 3600, 3240, "Manicure · pedicure · massage", "مانيكير · باديكير · مساج");
A("salon", "main", "salon", 22050, 11760, 3600, 3240, "Hair salon · tattoo station", "صالون شعر · محطة وشم");

// Restrooms mid-ship (service stations behind them are not drawn)
A("wc-w-mid", "main", "restroom", 26000, 0, 3300, 3240, "Women's restroom", "دورة مياه السيدات");
A("wc-m-mid", "main", "restroom", 26000, 11760, 3300, 3240, "Men's restroom", "دورة مياه الرجال");

// Stage / dance area (FFL +1650) with the mobile DJ station; ten cocktail tables around it
A("stage", "main", "stage", 24000, 4200, 16800, 6600, "Stage · dance floor", "المسرح · حلبة الرقص");
A("dj", "main", "dj", 31000, 6400, 3500, 2200, "DJ", "دي جي");
for (let i = 0; i < 5; i++) { U(`table-${i + 1}`, "table", "main", 30200 + i * 1800, 3500, 900, 900, `T${i + 1}`, 450); U(`table-${i + 6}`, "table", "main", 30200 + i * 1800, 10600, 900, 900, `T${i + 6}`, 450); }

// Lounge cabanas by the dance floor (FFL +1950): two curved sofa booths per side, 5480 wide
for (let i = 0; i < 2; i++) { const x = 32200 + i * 5720; U(`lounge-${i + 1}`, "lounge", "main", x, 0, 5480, 3600, `L${i + 1}`, 900); U(`lounge-${i + 3}`, "lounge", "main", x, 11400, 5480, 3600, `L${i + 3}`, 900); }

// Main bar island, stairs to the upper deck, reception, arrival points at the stern
A("bar-main", "main", "bar", 41300, 5600, 3000, 3800, "Bar", "البار", 1100);
A("stairs-p", "main", "stairs", 43400, 300, 2200, 2800, "Stairs to upper deck", "درج إلى السطح العلوي");
A("stairs-s", "main", "stairs", 43400, 11900, 2200, 2800, "Stairs to upper deck", "درج إلى السطح العلوي");
A("reception", "main", "label", 45600, 300, 3400, 3200, "Reception · foyer", "الاستقبال · البهو");
A("arr-stern-p", "main", "arrival", 50400, 300, 1400, 1200, "Arrival / departure", "الوصول / المغادرة");
A("arr-stern-s", "main", "arrival", 50400, 13500, 1400, 1200, "Arrival / departure", "الوصول / المغادرة");
A("wc-w-stern", "main", "restroom", 49200, 1600, 2600, 2600, "Women's restroom", "دورة مياه السيدات");
A("wc-m-stern", "main", "restroom", 49200, 10800, 2600, 2600, "Men's restroom", "دورة مياه الرجال");
A("boh", "main", "boh", 45600, 4200, 6400, 6600, "Kitchen & service", "المطبخ والخدمات");

/* ------------------------------------------------------------------ UPPER DECK (FFL +4500) */
// The bow half of the upper deck is canopy over the pool cabanas and the pool — not accessible
A("canopy-p", "upper", "canopy", 8840, 0, 12760, 3240, "Cabana canopies", "مظلات الكابانا");
A("canopy-s", "upper", "canopy", 8840, 11760, 12760, 3240, "Cabana canopies", "مظلات الكابانا");
A("canopy-p2", "upper", "canopy", 22050, 0, 7250, 3240, "Canopy", "مظلة");
A("canopy-s2", "upper", "canopy", 22050, 11760, 7250, 3240, "Canopy", "مظلة");
A("void", "upper", "label", 24000, 4200, 16800, 6600, "Open to the dance floor below", "مفتوح على حلبة الرقص بالأسفل");

// Upper cabanas (FFL +4500): four per side over the lounge cabanas, 2650 wide
for (let i = 0; i < 4; i++) { const x = 32200 + i * 2770; U(`upper-cabana-${i + 1}`, "upper-cabana", "upper", x, 0, 2650, 3400, `U${i + 1}`); U(`upper-cabana-${i + 5}`, "upper-cabana", "upper", x, 11600, 2650, 3400, `U${i + 5}`); }

// VIP booth (FFL +4650): the curved booth looking down onto the stage
U("vip-booth-1", "vip-booth", "upper", 43600, 5500, 2600, 4000, "VIP", 1300);

// Upper bar and the two alfresco lounges at the stern (FFL +4650): six dining tables each
A("bar-upper", "upper", "bar", 47400, 6000, 3200, 3000, "Bar", "البار", 900);
A("stairs-up-p", "upper", "stairs", 43400, 300, 2200, 2800, "Stairs to main deck", "درج إلى السطح الرئيسي");
A("stairs-up-s", "upper", "stairs", 43400, 11900, 2200, 2800, "Stairs to main deck", "درج إلى السطح الرئيسي");
for (let i = 0; i < 6; i++) { const col = i % 3, row = Math.floor(i / 3); U(`alfresco-${i + 1}`, "alfresco", "upper", 46000 + col * 1900, 500 + row * 1700, 1300, 1300, `A${i + 1}`, 650); U(`alfresco-${i + 7}`, "alfresco", "upper", 46000 + col * 1900, 11500 + row * 1700, 1300, 1300, `A${i + 7}`, 650); }
A("alfresco-p", "upper", "label", 45600, 0, 6400, 4200, "Alfresco lounge", "صالة في الهواء الطلق");
A("alfresco-s", "upper", "label", 45600, 10800, 6400, 4200, "Alfresco lounge", "صالة في الهواء الطلق");

// General entry: dance-floor capacity sold per person (not drawn as seats)
for (let i = 0; i < 40; i++) U(`entry-${i + 1}`, "entry", "main", 0, 0, 0, 0, `E${i + 1}`);

export const BOAT_UNITS = units;
export const BOAT_AMENITIES = amenities;
export const unitDeck = (id: string): Deck => units.find((u) => u.id === id)?.deck ?? "main";
