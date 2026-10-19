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
  "pkg-morning": img("pkg-morning", u("photo-1571896349842-33c89424de2d"), "Morning on deck", "الصباح على السطح"),
  "pkg-afternoon": img("pkg-afternoon", u("photo-1520250497591-112f2f40a3f4"), "Afternoon session", "جلسة بعد الظهر"),
  "pkg-cabana": img("pkg-cabana", u("photo-1445019980597-93fa8acb246c"), "Private cabana", "كابانا خاصة"),
  "rest-1": img("rest-1", u("photo-1565299624946-b28f40a0ae38", 900), "Restaurant plate", "طبق من المطعم"),
  "rest-2": img("rest-2", u("photo-1553621042-f6e147245754", 900), "Dining on the water", "تناول الطعام على الماء"),
  "evt-1": img("evt-1", u("photo-1516450360452-9312f5e86fc7", 700), "Event night", "ليلة فعالية"),
  "evt-2": img("evt-2", u("photo-1533174072545-7a4b6ad7a6c3", 700), "Full moon night", "ليلة اكتمال القمر"),
  "evt-3": img("evt-3", u("photo-1506905925346-21bda4d32df4", 700), "All white night", "ليلة الأبيض"),
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
    "Dubai's first floating beach club. Anchored in the Arabian Gulf. Opening 2026.",
    "أول نادٍ شاطئي عائم في دبي. راسٍ في الخليج العربي. الافتتاح 2026."
  ),
  contact: { phoneDisplay: "+971 4 840 0000", phoneHref: "tel:+97148400000", email: "hello@noa-dubai.com" },
  hours: t("Daily — 9:30 AM to 9:30 PM", "يومياً — 9:30 صباحاً إلى 9:30 مساءً"),
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
    name: t("Morning\nPackage", "باقة\nالصباح"),
    vibe: t("Chill Vibe", "أجواء هادئة"),
    time: t("9:30 AM — 2:00 PM", "9:30 صباحاً — 2:00 ظهراً"),
    desc: t(
      "Start your day with our exclusive morning experience, designed for those seeking a relaxed, laid-back atmosphere before the vibrant party begins. Unwind on our lounge areas, bask in the warm Gulf sun on spacious daybeds, and bathe in our 22-metre infinity pool with the Burj Al Arab on the horizon.",
      "ابدأ يومك مع تجربتنا الصباحية الحصرية، المصممة لمن يبحث عن أجواء هادئة ومسترخية قبل أن تبدأ الحفلة النابضة بالحياة. استرخِ في مناطق الجلوس، واستمتع بشمس الخليج الدافئة على أسرّة نهارية فسيحة، واسبح في مسبحنا اللامتناهي بطول 22 متراً وبرج العرب في الأفق."
    ),
    media: "pkg-morning",
    more: { label: t("See More", "اعرف المزيد"), href: { page: "morning-package" } },
    book: { label: t("Book Now", "احجز الآن"), href: { page: "booking" } },
  },
  afternoon: {
    id: "afternoon",
    number: "02",
    name: t("Afternoon\nPackage", "باقة\nبعد الظهر"),
    vibe: t("Party Vibe", "أجواء الحفلة"),
    time: t("12:00 PM — 9:30 PM", "12:00 ظهراً — 9:30 مساءً"),
    desc: t(
      "Dive into the vibrant afternoon session — full pool access, Dubai's hottest DJs spinning on the open-air deck, and a curated dining experience. Whether you want to dance, float, or simply watch the city skyline turn gold at dusk, this is NOA at its most electric.",
      "انغمس في جلسة بعد الظهر النابضة بالحياة — دخول كامل إلى المسبح، وأشهر الدي جيه في دبي على السطح المفتوح، وتجربة طعام مختارة بعناية. سواء أردت الرقص أو الطفو أو مجرد مشاهدة أفق المدينة وهو يتحول إلى اللون الذهبي عند الغسق، هذه نوا في أبهى حالاتها."
    ),
    media: "pkg-afternoon",
    more: { label: t("See More", "اعرف المزيد"), href: { page: "afternoon-package" } },
    book: { label: t("Book Now", "احجز الآن"), href: { page: "booking" } },
  },
  cabana: {
    id: "cabana",
    number: "03",
    name: t("Private\nCabana", "كابانا\nخاصة"),
    vibe: t("Exclusive · All Day", "حصرية · طوال اليوم"),
    time: t("9:30 AM — 9:30 PM", "9:30 صباحاً — 9:30 مساءً"),
    desc: t(
      "Your own poolside sanctuary — a dedicated cabana with personal butler, unlimited F&B credit, and front-row views of the Arabian Gulf. Ideal for groups seeking total privacy, effortless comfort, and the highest tier of service on the water. From AED 8,500 per cabana.",
      "ملاذك الخاص بجانب المسبح — كابانا مخصصة مع خادم شخصي، ورصيد غير محدود للطعام والمشروبات، وإطلالة في الصف الأول على الخليج العربي. مثالية للمجموعات التي تبحث عن الخصوصية التامة والراحة وأعلى مستوى من الخدمة على الماء. ابتداءً من 8,500 درهم للكابانا."
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
  "book-advance": faq("book-advance", ["Do I need to book in advance?", "هل أحتاج إلى الحجز مسبقاً؟"], ["Walk-ins are welcome, but advance booking is strongly recommended. NOA has limited daily capacity and reserved daybeds sell out quickly, especially on weekends and event nights.", "نرحب بالزوار دون حجز، لكننا ننصح بشدة بالحجز المسبق. سعة نوا اليومية محدودة، والأسرّة النهارية المحجوزة تنفد بسرعة، خاصة في عطلات نهاية الأسبوع وليالي الفعاليات."]),
  "dress-code": faq("dress-code", ["What is the dress code?", "ما هو قواعد اللباس؟"], ["Smart beach casual is required. We welcome linen shirts, tailored shorts, resort wear and chic cover-ups. Tank tops, ripped clothing, sports jerseys, and flip-flops are not permitted. NOA reserves the right to deny entry.", "اللباس الشاطئي الأنيق مطلوب. نرحب بقمصان الكتان والشورتات المفصلة وملابس المنتجعات وأغطية السباحة الأنيقة. لا يُسمح بالقمصان بلا أكمام أو الملابس الممزقة أو القمصان الرياضية أو الشباشب. تحتفظ نوا بحق رفض الدخول."]),
  "dress-code-rest": faq("dress-code-rest", ["What is the dress code?", "ما هو قواعد اللباس؟"], ["Smart beach casual is required. We welcome linen shirts, tailored shorts, resort wear and chic cover-ups. Tank tops, ripped clothing, sports jerseys, and flip-flops are not permitted in the restaurant. NOA reserves the right to deny entry.", "اللباس الشاطئي الأنيق مطلوب. نرحب بقمصان الكتان والشورتات المفصلة وملابس المنتجعات وأغطية السباحة الأنيقة. لا يُسمح بالقمصان بلا أكمام أو الملابس الممزقة أو القمصان الرياضية أو الشباشب داخل المطعم. تحتفظ نوا بحق رفض الدخول."]),
  included: faq("included", ["What's included in my package?", "ماذا تشمل باقتي؟"], ["All packages include shuttle boat transfer, welcome drink, pool access, towel, and guest insurance. F&B credit is loaded to a wristband at check-in. Unused credit is non-refundable and cannot be carried over.", "تشمل جميع الباقات النقل بالقارب المكوكي ومشروب الترحيب ودخول المسبح والمنشفة وتأمين الضيوف. يُحمّل رصيد الطعام والمشروبات على سوار المعصم عند تسجيل الوصول. الرصيد غير المستخدم غير قابل للاسترداد ولا يُرحّل."]),
  "min-age": faq("min-age", ["What is the minimum age?", "ما هو الحد الأدنى للعمر؟"], ["Morning Package: minimum age 4 years. Afternoon Package: minimum age 18 years. Alcohol is not served to guests under 21 in compliance with UAE law.", "باقة الصباح: الحد الأدنى 4 سنوات. باقة بعد الظهر: الحد الأدنى 18 سنة. لا تُقدَّم المشروبات الكحولية لمن هم دون 21 عاماً وفقاً لقوانين دولة الإمارات."]),
  cancellation: faq("cancellation", ["What is the cancellation policy?", "ما هي سياسة الإلغاء؟"], ["Cancellations more than 72 hours in advance receive a full refund minus 10% service fee. Within 72 hours: non-refundable. Cabana and special event bookings are strictly non-refundable.", "الإلغاء قبل أكثر من 72 ساعة يُسترد بالكامل بعد خصم رسوم خدمة 10%. خلال 72 ساعة: غير قابل للاسترداد. حجوزات الكابانا والفعاليات الخاصة غير قابلة للاسترداد نهائياً."]),
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
