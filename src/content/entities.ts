import type { EventItem, Faq, L, MediaSlot, Package, Settings } from "./types";

/** bilingual helper — all Arabic is a draft until a native reviewer marks it reviewed */
export const t = (en: string, ar: string): L => ({ en, ar, arStatus: "draft" });

/* Day 1: every image is a placeholder (Unsplash, as on the live site). Day 4 replaces each slot
   from NOA's own assets through the admin. The hero video slot starts empty on purpose. */
const u = (id: string, w = 1100) =>
  `https://images.unsplash.com/${id}?w=${w}&auto=format&fit=crop&q=85`;

const img = (id: string, url: string, altEn: string, altAr: string): MediaSlot => ({
  id,
  kind: "image",
  url,
  source: "placeholder",
  alt: t(altEn, altAr),
});

export const media: Record<string, MediaSlot> = {
  // Placeholder film: "Aerial panorama of a tourist port at sunset" (Mixkit License, free for commercial use). Replaced by NOA's own edit via the media manager.
  "hero-video": { id: "hero-video", kind: "video", url: "/media/hero-placeholder.mp4", source: "placeholder" },
  "hero-poster": { id: "hero-poster", kind: "image", url: "/media/hero-placeholder.jpg", source: "placeholder" },
  "hero-still": img("hero-still", u("photo-1540541338287-41700207dee6", 1800), "Infinity pool over the Gulf", "مسبح لا متناهٍ يطل على الخليج"),
  "split-dj": img("split-dj", u("photo-1470229722913-7c0e2dbbafd3", 900), "DJ stage", "منصة الدي جيه"),
  "split-club": img("split-club", u("photo-1566073771259-6a8506099945", 900), "Beach club deck", "سطح النادي الشاطئي"),
  "pkg-morning": img("pkg-morning", u("photo-1520250497591-112f2f40a3f4", 2000), "Morning by the lagoon pool", "الصباح عند مسبح البحيرة"),
  "pkg-afternoon": img("pkg-afternoon", u("photo-1566073771259-6a8506099945", 2000), "Golden hour on the deck", "الساعة الذهبية على السطح"),
  "pkg-night": img("pkg-night", u("photo-1514525253161-7a46d19cd819"), "Night session", "جلسة الليل"),
  "pkg-cabana": img("pkg-cabana", u("photo-1445019980597-93fa8acb246c"), "Private cabana", "كابانا خاصة"),
  "rest-1": img("rest-1", u("photo-1565299624946-b28f40a0ae38", 900), "Restaurant plate", "طبق من المطعم"),
  "rest-2": img("rest-2", u("photo-1553621042-f6e147245754", 900), "Dining on the water", "تناول الطعام على الماء"),
  "evt-1": img("evt-1", u("photo-1516450360452-9312f5e86fc7", 700), "Event night", "ليلة فعالية"),
  "evt-2": img("evt-2", u("photo-1533174072545-7a4b6ad7a6c3", 700), "Full moon night", "ليلة اكتمال القمر"),
  "evt-3": img("evt-3", u("photo-1506905925346-21bda4d32df4", 700), "All white night", "ليلة الأبيض"),
  /* Editorial home (design pass 2) — curated placeholders, all replaceable from /admin/media */
  "aerial-1": img("aerial-1", u("photo-1505142468610-359e7d316be0", 2000), "Turquoise water from above", "مياه فيروزية من الأعلى"),
  "aerial-2": img("aerial-2", u("photo-1468413253725-0d5181091126", 2000), "Palm-lined shore from above", "شاطئ تحيطه النخيل من الأعلى"),
  "deck-pool-1": img("deck-pool-1", u("photo-1540541338287-41700207dee6", 1800), "Infinity pool over the sea", "مسبح لا متناهٍ فوق البحر"),
  "deck-pool-2": img("deck-pool-2", u("photo-1582719478250-c89cae4dc85b", 1800), "Daybed in the light", "سرير نهاري في الضوء"),
  "deck-dj-1": img("deck-dj-1", u("photo-1514525253161-7a46d19cd819", 1800), "Crowd under the lights", "الحشد تحت الأضواء"),
  "deck-dj-2": img("deck-dj-2", u("photo-1470225620780-dba8ba36b745", 1800), "DJ at the decks", "دي جي على المنصة"),
  "terrace-1": img("terrace-1", u("photo-1512453979798-5ea266f8880c", 1800), "Dubai Marina at sunset", "مرسى دبي عند الغروب"),
  "terrace-2": img("terrace-2", u("photo-1445019980597-93fa8acb246c", 1800), "Cabana roofs at dusk", "أسقف الكابانا عند الغسق"),
  "cabana-a": img("cabana-a", u("photo-1535827841776-24afc1e255ac", 1800), "Private pool terrace", "شرفة مسبح خاصة"),
  "cabana-b": img("cabana-b", u("photo-1582719478250-c89cae4dc85b", 1800), "Daybed and light", "سرير نهاري وضوء"),
  "food-1": img("food-1", u("photo-1579871494447-9811cf80d66c", 1800), "Signature roll", "لفافة مميزة"),
  "food-2": img("food-2", u("photo-1553621042-f6e147245754", 1800), "Sushi selection", "تشكيلة سوشي"),
  "food-3": img("food-3", u("photo-1559339352-11d035aa65de", 1800), "Table by the water", "طاولة على الماء"),
  "food-4": img("food-4", u("photo-1534080564583-6be75777b70a", 1800), "Seafood paella", "باييلا بحرية"),
  "bar-1": img("bar-1", u("photo-1514362545857-3bc16c4c7d1b", 1800), "Signature cocktail", "كوكتيل مميز"),
  "bar-2": img("bar-2", u("photo-1536935338788-846bb9981813", 1800), "Smoked cocktail", "كوكتيل مدخّن"),
  "party-1": img("party-1", u("photo-1540039155733-5bb30b53aa14", 1600), "Night crowd", "حشد الليل"),
  "party-2": img("party-2", u("photo-1506157786151-b8491531f063", 1600), "Festival lights", "أضواء المهرجان"),
  "party-3": img("party-3", u("photo-1492684223066-81342ee5ff30", 1600), "Confetti over the crowd", "قصاصات فوق الحشد"),
  "party-4": img("party-4", u("photo-1516450360452-9312f5e86fc7", 1600), "Stage at night", "المسرح ليلاً"),
  "loc-hero": img("loc-hero", u("photo-1512453979798-5ea266f8880c", 1800), "Dubai Marina", "مرسى دبي"),
  "faq-hero": img("faq-hero", u("photo-1553621042-f6e147245754", 1800), "On board NOA", "على متن نوا"),
  "contact-hero": img("contact-hero", u("photo-1565299624946-b28f40a0ae38", 1800), "Contact NOA", "تواصل مع نوا"),
  "deck-1": img("deck-1", u("photo-1566073771259-6a8506099945"), "The deck", "السطح"),
  "deck-2": img("deck-2", u("photo-1553621042-f6e147245754"), "The restaurant", "المطعم"),
  "kitchen": img("kitchen", u("photo-1565299624946-b28f40a0ae38"), "The kitchen", "المطبخ"),
  "dj-booth": img("dj-booth", u("photo-1470229722913-7c0e2dbbafd3"), "The DJ booth", "كابينة الدي جيه"),
  "marina": img("marina", u("photo-1540541338287-41700207dee6"), "Marina arrival", "الوصول إلى المرسى"),
};

export const settings: Settings = {
  brand: "NOA",
  tagline: t(
    "Dubai's first floating beach club. Days on the water, nights on the Gulf. Opening 2026.",
    "أول نادٍ شاطئي عائم في دبي. راسٍ في الخليج العربي. الافتتاح 2026."
  ),
  contact: { phoneDisplay: "+971 4 840 0000", phoneHref: "tel:+97148400000", email: "hello@noa-dubai.com" },
  hours: t("Daily, 9:30 AM to 2:00 AM", "يومياً — 9:30 صباحاً إلى 9:30 مساءً"),
  departure: t("Dubai Marina Pier, Berth 7", "رصيف مرسى دبي، المرسى 7"),
  socials: [
    { label: "IG", href: "#" },
    { label: "TK", href: "#" },
    { label: "FB", href: "#" },
    { label: "YT", href: "#" },
  ],
  copyright: t("© 2026 NOA Beach Club Dubai. All rights reserved.", "© 2026 نادي نوا الشاطئي دبي. جميع الحقوق محفوظة."),
};

export const packages: Record<string, Package> = {
  morning: {
    id: "morning",
    number: "01",
    name: t("The\nMorning", "جلسة\nالصباح"),
    vibe: t("The Water", "الماء"),
    time: t("9:30 AM to 2:00 PM", "9:30 صباحاً إلى 2:00 ظهراً"),
    desc: t(
      "The first boat leaves the pier at nine. By half past the pool is still, breakfast is on the bow and the music is low. This is the session for a long swim, a late breakfast and a daybed on the edge of the water with the Burj Al Arab on the horizon.",
      "ينطلق أول قارب من الرصيف في التاسعة. وبحلول التاسعة والنصف يكون المسبح ساكناً والفطور على مقدمة السفينة والموسيقى خافتة. هذه جلسة السباحة الطويلة والفطور المتأخر وسرير نهاري على حافة الماء وبرج العرب في الأفق."
    ),
    media: "pkg-morning",
    more: { label: t("See the Morning", "اطّلع على الصباح"), href: { page: "morning-package" } },
    book: { label: t("Book Now", "احجز الآن"), href: { page: "booking" } },
  },
  afternoon: {
    id: "afternoon",
    number: "02",
    name: t("The\nAfternoon", "جلسة\nبعد الظهر"),
    vibe: t("The Sun", "الشمس"),
    time: t("2:00 PM to 9:30 PM", "2:00 ظهراً إلى 9:30 مساءً"),
    desc: t(
      "The DJ comes on at two and the pool fills. Lunch runs into dinner, the sky behind the skyline goes pink, and from two kilometres out the sun sets twice, once behind the towers and once on the water. At half past nine the lights come up on the stage and the deck changes shift.",
      "يبدأ الدي جيه في الثانية ويمتلئ المسبح. يمتد الغداء إلى العشاء، وتتورّد السماء خلف الأفق، ومن على بُعد كيلومترين تغرب الشمس مرتين، مرة خلف الأبراج ومرة على الماء. في التاسعة والنصف تضاء المنصة ويبدّل السطح نوبته."
    ),
    media: "pkg-afternoon",
    more: { label: t("See the Afternoon", "اطّلع على بعد الظهر"), href: { page: "afternoon-package" } },
    book: { label: t("Book Now", "احجز الآن"), href: { page: "booking" } },
  },
  night: {
    id: "night",
    number: "03",
    name: t("The\nNight", "جلسة\nالليل"),
    vibe: t("The Floor", "الحلبة"),
    time: t("9:30 PM to 2:00 AM", "9:30 مساءً إلى 2:00 فجراً"),
    desc: t(
      "This is why NOA floats. Residents and guest DJs on the stage, fifteen metres of dance floor under the roof, the lounge cabanas lit low and the skyline across the water. Upstairs is quieter: the sushi bar, the alfresco lounge and the booth above the floor.",
      "لهذا تطفو نوا. المقيمون والدي جيه الضيوف على المنصة، وخمسة عشر متراً من حلبة الرقص تحت السقف، وكبائن الصالة بإضاءة خافتة، وأفق المدينة عبر الماء. الطابق العلوي أهدأ: بار السوشي وصالة الهواء الطلق والمقصورة فوق الحلبة."
    ),
    media: "pkg-night",
    more: { label: t("See the Night", "اطّلع على الليل"), href: { page: "night-package" } },
    book: { label: t("Book Now", "احجز الآن"), href: { page: "booking" } },
  },
  cabana: {
    id: "cabana",
    number: "04",
    name: t("The\nCabanas", "الكبائن"),
    vibe: t("Yours by the Session", "لك طوال الجلسة"),
    time: t("Morning, afternoon or night", "صباحاً أو بعد الظهر أو ليلاً"),
    desc: t(
      "Twenty cabanas across two decks. Eight line the pool, four face the stage, eight sit on the upper deck above the floor. Each has two sofas, a low table, curtains you can draw and a host who stays with you. Six guests, booked by the session.",
      "عشرون كابينة على سطحين. ثمانٍ على حافة المسبح، وأربع تواجه المنصة، وثمانٍ على السطح العلوي فوق الحلبة. في كل منها أريكتان وطاولة منخفضة وستائر تُسدل ومضيف يبقى معك. ستة ضيوف، وتُحجز بالجلسة."
    ),
    media: "pkg-cabana",
    more: { label: t("Enquire", "استفسر"), href: { page: "cabana" } },
    book: { label: t("Reserve Cabana", "احجز كابانا"), href: { page: "cabana" } },
  },
};

/* Events: all placeholder data until NOA confirms the programme. Artist names below are
   illustrative only and must not ship without NOA's confirmation. */
const ev = (
  id: string,
  date: string,
  dateLabel: [string, string],
  shortDate: [string, string],
  name: [string, string],
  artist: [string, string],
  mediaId?: string
): EventItem => ({
  id,
  date,
  dateLabel: t(...dateLabel),
  shortDate: t(...shortDate),
  name: t(...name),
  artist: t(...artist),
  media: mediaId,
  isPlaceholder: true,
});

export const events: Record<string, EventItem> = {
  "golden-hour": ev("golden-hour", "2026-03-14", ["Fri 14 March 2026 · Afternoon", "الجمعة 14 مارس 2026 · بعد الظهر"], ["Fri 14 Mar", "الجمعة 14 مارس"], ["Golden Hour\nOpening Night", "الساعة الذهبية\nليلة الافتتاح"], ["DJ Claptone · Berlin", "دي جيه كلابتون · برلين"], "evt-1"),
  "desert-moon": ev("desert-moon", "2026-03-21", ["Fri 21 March 2026 · Full Moon", "الجمعة 21 مارس 2026 · اكتمال القمر"], ["Fri 21 Mar", "الجمعة 21 مارس"], ["Desert Moon\nNight", "ليلة قمر\nالصحراء"], ["Peggy Gou · Seoul / Berlin", "بيغي غو · سيول / برلين"], "evt-2"),
  "white-edition": ev("white-edition", "2026-03-28", ["Fri 28 March 2026 · All White", "الجمعة 28 مارس 2026 · الأبيض بالكامل"], ["Fri 28 Mar", "الجمعة 28 مارس"], ["NOA\nWhite Edition", "نوا\nالإصدار الأبيض"], ["Black Coffee · Johannesburg", "بلاك كوفي · جوهانسبرغ"], "evt-3"),
  "apr-04": ev("apr-04", "2026-04-04", ["Fri 04 April 2026", "الجمعة 4 أبريل 2026"], ["Fri 04 Apr", "الجمعة 4 أبريل"], ["Rooftop Session", "جلسة السطح"], ["Solomun · Hamburg", "سولومون · هامبورغ"]),
  "apr-11": ev("apr-11", "2026-04-11", ["Fri 11 April 2026", "الجمعة 11 أبريل 2026"], ["Fri 11 Apr", "الجمعة 11 أبريل"], ["Sunset Sessions", "جلسات الغروب"], ["Dixon · Berlin", "ديكسون · برلين"]),
  "apr-18": ev("apr-18", "2026-04-18", ["Fri 18 April 2026", "الجمعة 18 أبريل 2026"], ["Fri 18 Apr", "الجمعة 18 أبريل"], ["Latin Night", "الليلة اللاتينية"], ["Nicola Cruz · Quito", "نيكولا كروز · كيتو"]),
  "apr-19": ev("apr-19", "2026-04-19", ["Sat 19 April 2026", "السبت 19 أبريل 2026"], ["Sat 19 Apr", "السبت 19 أبريل"], ["Afterhours", "ما بعد الساعات"], ["Tale Of Us · Berlin", "تيل أوف أس · برلين"]),
  "apr-25": ev("apr-25", "2026-04-25", ["Fri 25 April 2026", "الجمعة 25 أبريل 2026"], ["Fri 25 Apr", "الجمعة 25 أبريل"], ["NOA Residents Night", "ليلة مقيمي نوا"], ["House Residents", "دي جيه نوا المقيمون"]),
  "may-02": ev("may-02", "2026-05-02", ["Fri 02 May 2026", "الجمعة 2 مايو 2026"], ["Fri 02 May", "الجمعة 2 مايو"], ["Spring Equinox", "الاعتدال الربيعي"], ["Mind Against · Berlin", "مايند أغينست · برلين"]),
  "may-09": ev("may-09", "2026-05-09", ["Fri 09 May 2026", "الجمعة 9 مايو 2026"], ["Fri 09 May", "الجمعة 9 مايو"], ["Mediterranean Nights", "ليالي المتوسط"], ["Bedouin · Brooklyn", "بدوين · بروكلين"]),
  "may-17": ev("may-17", "2026-05-17", ["Sat 17 May 2026", "السبت 17 مايو 2026"], ["Sat 17 May", "السبت 17 مايو"], ["House Series", "سلسلة الهاوس"], ["DJ Tennis b2b Carlita", "دي جيه تينيس مع كارليتا"]),
  "may-23": ev("may-23", "2026-05-23", ["Fri 23 May 2026", "الجمعة 23 مايو 2026"], ["Fri 23 May", "الجمعة 23 مايو"], ["Black Coffee Returns", "عودة بلاك كوفي"], ["Black Coffee · Johannesburg", "بلاك كوفي · جوهانسبرغ"]),
  "may-30": ev("may-30", "2026-05-30", ["Fri 30 May 2026", "الجمعة 30 مايو 2026"], ["Fri 30 May", "الجمعة 30 مايو"], ["Closing of the Month", "ختام الشهر"], ["Honey Dijon · Chicago", "هني ديجون · شيكاغو"]),
};

const faq = (id: string, q: [string, string], a: [string, string]): Faq => ({ id, q: t(...q), a: t(...a) });

export const faqs: Record<string, Faq> = {
  "last-shuttle": faq("last-shuttle", ["What time is the last shuttle back?", "متى يعود آخر قارب مكوكي؟"], ["Boats leave the pier every 30 minutes. The last boat back is 2:30 PM after the morning session, 10:00 PM after the afternoon and 2:30 AM after the night. Your wristband is your ticket on board.", "تنطلق القوارب من الرصيف كل 30 دقيقة. آخر قارب للعودة في 2:30 ظهراً بعد جلسة الصباح، و10:00 مساءً بعد جلسة بعد الظهر، و2:30 فجراً بعد جلسة الليل. سوارك هو تذكرتك على المتن."]),
  "stay-night": faq("stay-night", ["Can I stay on from the afternoon into the night?", "هل يمكنني البقاء من جلسة بعد الظهر إلى الليل؟"], ["Yes, if the night is not sold out. Ask your host before 8:30 PM and they will move your seat over at the desk. On event nights you need a ticket for the night, and your host can sort that too.", "نعم، إن لم تكن الليلة مكتملة. اطلب من مضيفك قبل 8:30 مساءً وسينقل مقعدك عند المكتب. في ليالي الفعاليات تحتاج إلى تذكرة لليل، ويمكن لمضيفك ترتيب ذلك أيضاً."]),
  "night-ticket": faq("night-ticket", ["Is the night session ticketed?", "هل جلسة الليل بتذكرة؟"], ["Every night has general entry sold per person, plus seats you can book on the deck plan: lounge cabanas, high tables, the alfresco lounge, the upper cabanas and the booth. A seat includes entry for everyone at it. On guest DJ nights, tickets go on sale two weeks ahead and members see them first.", "لكل ليلة دخول عام يُباع للشخص، إضافة إلى مقاعد تحجزها على مخطط السطح: كبائن الصالة، والطاولات العالية، وصالة الهواء الطلق، والكبائن العلوية، والمقصورة. المقعد يشمل الدخول لكل من فيه. في ليالي الدي جيه الضيف تُطرح التذاكر قبل أسبوعين ويراها الأعضاء أولاً."]),
  "pool-night": faq("pool-night", ["Is the pool open at night?", "هل المسبح مفتوح ليلاً؟"], ["No. The pool closes at dusk and the daybeds around it become lounge seating. The night is for the floor, the bars and the upper deck.", "لا. يُغلق المسبح عند الغسق وتتحول الأسرّة النهارية حوله إلى جلسات. الليل لحلبة الرقص والبارات والسطح العلوي."]),
  "treatments": faq("treatments", ["Can I book a massage, a manicure or the salon?", "هل يمكنني حجز مساج أو مانيكير أو الصالون؟"], ["Yes. There is a treatment room for manicures, pedicures and massage, and a hair salon with a tattoo station, both on the main deck. Book a slot with your seat at checkout or at reception when you arrive. Treatments are charged to your wristband.", "نعم. توجد غرفة علاج للمانيكير والباديكير والمساج، وصالون شعر مع محطة وشم، كلاهما على السطح الرئيسي. احجز موعداً مع مقعدك عند الدفع أو في الاستقبال عند وصولك. تُحتسب الخدمات على سوارك."]),
  "changing": faq("changing", ["Are there changing rooms and showers?", "هل توجد غرف تبديل ودُش؟"], ["Restrooms with showers and changing space are on the main deck, midships and at the stern, for women and for men. Towels are at reception and at the pool.", "توجد دورات مياه مع دُش ومساحة تبديل على السطح الرئيسي، في المنتصف وعند المؤخرة، للنساء وللرجال. المناشف في الاستقبال وعند المسبح."]),
  "sushi-hours": faq("sushi-hours", ["When is the sushi bar open?", "متى يفتح بار السوشي؟"], ["The sushi bar on the upper deck opens at 7:00 PM and serves until 1:00 AM. The main restaurant serves breakfast from 9:30 AM, lunch from noon and dinner until 11:00 PM.", "يفتح بار السوشي على السطح العلوي في 7:00 مساءً ويقدم حتى 1:00 فجراً. المطعم الرئيسي يقدم الفطور من 9:30 صباحاً، والغداء من الظهر، والعشاء حتى 11:00 مساءً."]),
  "stairs": faq("stairs", ["How do I get to the upper deck?", "كيف أصل إلى السطح العلوي؟"], ["Stairs on both sides of the main deck, sixteen steps each. Tell us when you book if steps are a problem and we will seat you on the main deck with the same view of the stage.", "درج على جانبي السطح الرئيسي، ستة عشر درجة لكل منهما. أخبرنا عند الحجز إن كانت الدرجات مشكلة وسنجلسك على السطح الرئيسي بإطلالة مماثلة على المسرح."]),

  "book-advance": faq("book-advance", ["Do I need to book in advance?", "هل أحتاج إلى الحجز مسبقاً؟"], ["Walk-ins are welcome, but advance booking is strongly recommended. NOA has limited daily capacity and reserved daybeds sell out quickly, especially on weekends and event nights.", "نرحب بالزوار دون حجز، لكننا ننصح بشدة بالحجز المسبق. سعة نوا اليومية محدودة، والأسرّة النهارية المحجوزة تنفد بسرعة، خاصة في عطلات نهاية الأسبوع وليالي الفعاليات."]),
  "dress-code": faq("dress-code", ["What is the dress code?", "ما هو قواعد اللباس؟"], ["Smart beach casual is required. We welcome linen shirts, tailored shorts, resort wear and chic cover-ups. Tank tops, ripped clothing, sports jerseys, and flip-flops are not permitted. NOA reserves the right to deny entry.", "اللباس الشاطئي الأنيق مطلوب. نرحب بقمصان الكتان والشورتات المفصلة وملابس المنتجعات وأغطية السباحة الأنيقة. لا يُسمح بالقمصان بلا أكمام أو الملابس الممزقة أو القمصان الرياضية أو الشباشب. تحتفظ نوا بحق رفض الدخول."]),
  "dress-code-rest": faq("dress-code-rest", ["What is the dress code?", "ما هو قواعد اللباس؟"], ["Smart beach casual is required. We welcome linen shirts, tailored shorts, resort wear and chic cover-ups. Tank tops, ripped clothing, sports jerseys, and flip-flops are not permitted in the restaurant. NOA reserves the right to deny entry.", "اللباس الشاطئي الأنيق مطلوب. نرحب بقمصان الكتان والشورتات المفصلة وملابس المنتجعات وأغطية السباحة الأنيقة. لا يُسمح بالقمصان بلا أكمام أو الملابس الممزقة أو القمصان الرياضية أو الشباشب داخل المطعم. تحتفظ نوا بحق رفض الدخول."]),
  included: faq("included", ["What's included in my package?", "ماذا تشمل باقتي؟"], ["All packages include shuttle boat transfer, welcome drink, pool access, towel, and guest insurance. F&B credit is loaded to a wristband at check-in. Unused credit is non-refundable and cannot be carried over.", "تشمل جميع الباقات النقل بالقارب المكوكي ومشروب الترحيب ودخول المسبح والمنشفة وتأمين الضيوف. يُحمّل رصيد الطعام والمشروبات على سوار المعصم عند تسجيل الوصول. الرصيد غير المستخدم غير قابل للاسترداد ولا يُرحّل."]),
  "min-age": faq("min-age", ["What is the minimum age?", "ما هو الحد الأدنى للعمر؟"], ["Morning Package: minimum age 4 years. Afternoon Package: minimum age 18 years. Alcohol is not served to guests under 21 in compliance with UAE law.", "باقة الصباح: الحد الأدنى 4 سنوات. باقة بعد الظهر: الحد الأدنى 18 سنة. لا تُقدَّم المشروبات الكحولية لمن هم دون 21 عاماً وفقاً لقوانين دولة الإمارات."]),
  cancellation: faq("cancellation", ["Can I cancel or change my reservation?", "هل يمكنني إلغاء حجزي أو تعديله؟"], ["All reservations are final once paid and cannot be cancelled online. If your plans change, write to hello@noa-dubai.com or call +971 4 840 0000 and our manager will do their best to help with a date change, subject to availability.", "جميع الحجوزات نهائية بعد الدفع ولا يمكن إلغاؤها عبر الإنترنت. إذا تغيّرت خططك، راسلنا على hello@noa-dubai.com أو اتصل على +971 4 840 0000 وسيبذل مديرنا قصارى جهده لمساعدتك في تغيير الموعد حسب التوفر."]),
  "private-boat": faq("private-boat", ["Can I arrive by private boat?", "هل يمكنني الوصول بقارب خاص؟"], ["Yes. Direct anchoring alongside NOA is not permitted — our crew will guide your final approach by tender. Contact us in advance to arrange private arrival logistics from Dubai Marina.", "نعم. لا يُسمح بالرسو مباشرةً بجانب نوا — سيرشدك طاقمنا في الاقتراب الأخير عبر قارب الخدمة. تواصل معنا مسبقاً لترتيب الوصول الخاص من مرسى دبي."]),
  photography: faq("photography", ["Is photography allowed on board?", "هل يُسمح بالتصوير على المتن؟"], ["Personal photography is welcome on the open deck. Professional cameras, lenses over 200mm, drones, and any commercial filming require prior written permission. Photography of other guests requires their consent.", "التصوير الشخصي مرحب به على السطح المفتوح. تتطلب الكاميرات الاحترافية والعدسات التي تتجاوز 200 مم والطائرات المسيّرة وأي تصوير تجاري إذناً كتابياً مسبقاً. تصوير الضيوف الآخرين يتطلب موافقتهم."]),
  vouchers: faq("vouchers", ["Do you sell gift vouchers?", "هل تبيعون قسائم هدايا؟"], ["Yes. Gift vouchers are available in any AED value at the package or cabana level. Vouchers are valid for 12 months from issue and can be redeemed for any session subject to availability.", "نعم. تتوفر قسائم الهدايا بأي قيمة بالدرهم على مستوى الباقة أو الكابانا. القسائم صالحة لمدة 12 شهراً من تاريخ الإصدار ويمكن استبدالها بأي جلسة حسب التوفر."]),
  "get-there": faq("get-there", ["How do I get to NOA?", "كيف أصل إلى نوا؟"], ["NOA is reached by our complimentary shuttle boat from Dubai Marina Pier, Berth 7. The crossing takes 11 minutes. Shuttles run every 30 minutes from 9:00 AM to 10:00 PM.", "تصل إلى نوا عبر قاربنا المكوكي المجاني من رصيف مرسى دبي، المرسى 7. تستغرق الرحلة 11 دقيقة. تنطلق القوارب كل 30 دقيقة من 9:00 صباحاً حتى 10:00 مساءً."]),
  parking: faq("parking", ["Is parking available at the pier?", "هل تتوفر مواقف سيارات عند الرصيف؟"], ["Yes — valet parking is available adjacent to Berth 7 from 9:00 AM. Self-park is available at the Dubai Marina public garage, a four-minute walk away. Both are paid; valet is charged to your wristband if you wish.", "نعم — تتوفر خدمة صف السيارات بجانب المرسى 7 من 9:00 صباحاً. كما تتوفر مواقف ذاتية في مرآب مرسى دبي العام على بُعد أربع دقائق سيراً. الخدمتان مدفوعتان؛ ويمكن تحميل رسوم صف السيارات على سوارك إن رغبت."]),
  accessibility: faq("accessibility", ["Is the deck accessible for guests with reduced mobility?", "هل السطح مهيأ لذوي الحركة المحدودة؟"], ["The main deck, pool deck, restaurant and one accessible cabana are step-free and reachable by ramped boarding from the shuttle. The upper deck involves a short flight of stairs. Please let us know at booking so we can assign accessible seating.", "السطح الرئيسي وسطح المسبح والمطعم وكابانا واحدة مهيأة جميعها خالية من الدرجات ويمكن الوصول إليها عبر منحدر من القارب. يتطلب السطح العلوي صعود درج قصير. يُرجى إبلاغنا عند الحجز لنخصص لك مقاعد مهيأة."]),
  weather: faq("weather", ["What happens in bad weather?", "ماذا يحدث في حال سوء الطقس؟"], ["NOA operates in normal Gulf weather year-round. In the rare event of a sustained sandstorm or high sea state, the day will be cancelled and bookings refunded or transferred at the guest's choice. Light rain does not affect operations.", "تعمل نوا في أجواء الخليج الاعتيادية على مدار العام. وفي الحالات النادرة لعاصفة رملية مستمرة أو ارتفاع حالة البحر، يُلغى اليوم وتُسترد الحجوزات أو تُنقل حسب اختيار الضيف. المطر الخفيف لا يؤثر على العمليات."]),
  "own-food": faq("own-food", ["Can I bring my own food or drink?", "هل يمكنني إحضار طعامي أو مشروباتي؟"], ["No. All food and drink is supplied on board. We have a full restaurant, four bars, a cellar list, and a non-alcoholic menu including specialty coffee. Outside food and drink are not permitted, including for dietary or religious reasons — please let us know at booking and we will accommodate.", "لا. يُقدَّم كل الطعام والشراب على المتن. لدينا مطعم متكامل وأربع حانات وقائمة قبو ومشروبات غير كحولية تشمل القهوة المختصة. لا يُسمح بالطعام والشراب الخارجي، بما في ذلك لأسباب غذائية أو دينية — أبلغنا عند الحجز وسنلبي احتياجاتك."]),
  "private-hire": faq("private-hire", ["Can NOA be hired for a private event?", "هل يمكن استئجار نوا لفعالية خاصة؟"], ["Yes — full venue hire is available on selected days, and partial hire (the upper deck, the restaurant, a cabana cluster) is available throughout the week. Capacity for full hire is 280. Contact our private events team for a proposal.", "نعم — يتوفر استئجار المكان بالكامل في أيام مختارة، والاستئجار الجزئي (السطح العلوي أو المطعم أو مجموعة كابانات) طوال الأسبوع. سعة الاستئجار الكامل 280 ضيفاً. تواصل مع فريق الفعاليات الخاصة للحصول على عرض."]),
  "min-spend": faq("min-spend", ["What's the minimum spend for a group booking?", "ما هو الحد الأدنى للإنفاق لحجز المجموعات؟"], ["Groups of 12 or more receive a custom proposal with a minimum spend tied to the day, the session and the deck configuration. Cabana clusters and private decks are available for groups of 12 to 48.", "تحصل المجموعات من 12 شخصاً فأكثر على عرض مخصص بحد أدنى للإنفاق يرتبط باليوم والجلسة وتوزيع السطح. تتوفر مجموعات الكابانات والأسطح الخاصة للمجموعات من 12 إلى 48 ضيفاً."]),
  "m-arrive": faq("m-arrive", ["What time should I arrive?", "متى يجب أن أصل؟"], ["Last check-in is at 12:00 noon. We recommend arriving at the marina pier 30 minutes before your intended shuttle to allow for check-in and the crossing. Shuttles run every 30 minutes from 9:00 AM.", "آخر موعد لتسجيل الوصول هو 12:00 ظهراً. ننصح بالوصول إلى رصيف المرسى قبل 30 دقيقة من موعد القارب المقصود لإتاحة وقت التسجيل والعبور. تنطلق القوارب كل 30 دقيقة من 9:00 صباحاً."]),
  "m-children": faq("m-children", ["Can I bring children?", "هل يمكنني اصطحاب الأطفال؟"], ["Yes — children aged 4 and above are welcome at the Morning Package. Child pricing matches adult pricing as capacity is limited. Under 4 are not permitted on board for safety reasons.", "نعم — الأطفال من عمر 4 سنوات فما فوق مرحب بهم في باقة الصباح. سعر الطفل يعادل سعر البالغ نظراً لمحدودية السعة. لا يُسمح لمن هم دون 4 سنوات بالصعود لأسباب تتعلق بالسلامة."]),
  "m-stay": faq("m-stay", ["What if I want to stay for the Afternoon Package?", "ماذا لو أردت البقاء لباقة بعد الظهر؟"], ["Combined morning + afternoon access is available at a reduced rate. Mention this at booking, or upgrade your wristband at check-in subject to afternoon availability.", "يتوفر دخول مشترك للصباح وبعد الظهر بسعر مخفض. اذكر ذلك عند الحجز، أو قم بترقية سوارك عند تسجيل الوصول حسب توفر جلسة بعد الظهر."]),
  "m-dress": faq("m-dress", ["Dress code?", "قواعد اللباس؟"], ["Smart beach casual. Swimwear is welcome on the pool deck; cover-ups expected in the restaurant. No sportswear, jerseys, or flip-flops in the restaurant.", "لباس شاطئي أنيق. ملابس السباحة مرحب بها على سطح المسبح؛ ويُتوقع ارتداء أغطية في المطعم. لا ملابس رياضية أو قمصان رياضية أو شباشب في المطعم."]),
  "a-arrive": faq("a-arrive", ["What time should I arrive?", "متى يجب أن أصل؟"], ["Last check-in is at 7:00 PM, but most guests arrive between 2 and 5 PM when the DJ starts and the sun is high. Shuttles run every 30 minutes from 11:30 AM.", "آخر موعد لتسجيل الوصول هو 7:00 مساءً، لكن معظم الضيوف يصلون بين 2 و5 عصراً عندما يبدأ الدي جيه والشمس في أوجها. تنطلق القوارب كل 30 دقيقة من 11:30 صباحاً."]),
  "a-18": faq("a-18", ["Is the afternoon session 18+?", "هل جلسة بعد الظهر للبالغين فقط (+18)؟"], ["Yes. The afternoon session is 18+ only. ID is checked at the marina pier check-in. Guests under 18 are welcome at the Morning Package.", "نعم. جلسة بعد الظهر لمن هم فوق 18 عاماً فقط. يُفحص إثبات الهوية عند تسجيل الوصول في رصيف المرسى. الضيوف دون 18 عاماً مرحب بهم في باقة الصباح."]),
  "a-dress": faq("a-dress", ["Dress code for the afternoon?", "قواعد اللباس لفترة بعد الظهر؟"], ["Elevated smart beach casual. Swimwear on the pool deck is fine; cover-ups expected in the restaurant and on the upper deck. No sportswear, no flip-flops on the restaurant floor.", "لباس شاطئي أنيق راقٍ. ملابس السباحة مقبولة على سطح المسبح؛ ويُتوقع ارتداء أغطية في المطعم وعلى السطح العلوي. لا ملابس رياضية ولا شباشب داخل المطعم."]),
  "a-table": faq("a-table", ["Can I book a table at the restaurant?", "هل يمكنني حجز طاولة في المطعم؟"], ["Yes — restaurant reservations are taken separately at booking. Tables held for 90 minutes. Walk-ins are seated subject to availability.", "نعم — تُؤخذ حجوزات المطعم بشكل منفصل عند الحجز. تُحجز الطاولات لمدة 90 دقيقة. يُجلس الزوار دون حجز حسب التوفر."]),
  "c-size": faq("c-size", ["What's the maximum group size in a cabana?", "ما هو الحد الأقصى لعدد المجموعة في الكابانا؟"], ["Six guests per cabana. For larger groups, cabanas can be booked side-by-side or combined into a private section of the upper deck — contact our private events team for arrangements.", "ستة ضيوف لكل كابانا. للمجموعات الأكبر، يمكن حجز كابانات متجاورة أو دمجها في قسم خاص من السطح العلوي — تواصل مع فريق الفعاليات الخاصة للترتيب."]),
  "c-beyond": faq("c-beyond", ["What's included beyond F and B?", "ماذا يُشمل إلى جانب الطعام والمشروبات؟"], ["The shuttle transfer (priority slot), welcome platter on arrival, the butler service, and access to both the Morning and Afternoon sessions on the same wristband. Premium spirits and champagne are charged separately at cellar pricing.", "النقل بالقارب (موعد ذو أولوية)، وطبق ترحيبي عند الوصول، وخدمة الخادم الشخصي، والدخول إلى جلستي الصباح وبعد الظهر بالسوار نفسه. تُحتسب المشروبات الفاخرة والشمبانيا بشكل منفصل بأسعار القبو."]),
  "c-half": faq("c-half", ["Can the cabana be booked for just the morning or just the afternoon?", "هل يمكن حجز الكابانا للصباح فقط أو لبعد الظهر فقط؟"], ["Cabanas are sold as all-day reservations. For half-day private use, the Front-Row Daybed in either session is the next tier down.", "تُباع الكابانات كحجوزات ليوم كامل. للاستخدام الخاص لنصف يوم، يُعدّ سرير الصف الأمامي في أي من الجلستين الفئة التالية."]),
};
