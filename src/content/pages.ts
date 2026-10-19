import type { Href, Page, Registry } from "./types";
import { t } from "./entities";

const P = (page: Page["id"], hash?: string): Href => (hash ? { page, hash } : { page });

const faqMore = { label: t("See All Questions", "عرض جميع الأسئلة"), href: P("faq") };
const goodToKnow = t("Good to Know", "من المفيد معرفته");

export const pages: Page[] = [
  /* ------------------------------------------------------------------ HOME */
  {
    id: "home",
    slug: "",
    title: t("NOA — Dubai's First Floating Beach Club", "نوا — أول نادٍ شاطئي عائم في دبي"),
    metaDescription: t(
      "NOA is Dubai's first floating beach club. Anchored in the Arabian Gulf, opening 2026. Infinity pool, four bars, world-class DJs, private cabanas.",
      "نوا هو أول نادٍ شاطئي عائم في دبي. راسٍ في الخليج العربي، يفتتح عام 2026. مسبح لا متناهٍ، أربع حانات، أشهر الدي جيه، وكابانات خاصة."
    ),
    navLabel: t("Beach Club", "النادي الشاطئي"),
    voiceAliases: [t("home", "الرئيسية"), t("start", "البداية"), t("main page", "الصفحة الرئيسية")],
    sections: [
      { id: "hero", type: "hero", media: "hero-video", quiet: true },
      {
        id: "intro", type: "editorialIntro",
        eyebrow: t("Dubai's first floating", "أول نادٍ عائم في دبي"),
        heading: t("Beach Club", "النادي الشاطئي"),
        paragraphs: [
          t("NOA is a multi-level floating beach club anchored in the Arabian Gulf — an infinity pool, four bars, a restaurant and a choice of seats from sunbeds to private cabanas.", "نوا نادٍ شاطئي عائم متعدد الطوابق راسٍ في الخليج العربي — مسبح لا متناهٍ، أربع حانات، مطعم، وخيارات جلوس من الأسرّة الشمسية إلى الكابانات الخاصة."),
          t("The sunset terrace has its own lounge pool; the rooftop bar turns a full 360° over the sea and the Dubai skyline.", "شرفة الغروب لها مسبحها الخاص؛ وحانة السطح تدور 360° فوق البحر وأفق دبي."),
        ],
        facts: [
          { label: t("Open", "مفتوح"), lines: [t("Daily 9:30 AM – 9:30 PM", "يومياً 9:30 ص – 9:30 م"), t("Morning session until 2 PM · Afternoon from 2 PM", "الجلسة الصباحية حتى 2 م · بعد الظهر من 2 م"), t("*except during special events", "*باستثناء الفعاليات الخاصة")] },
          { label: t("Departure", "الانطلاق"), lines: [t("Dubai Marina Pier, Berth 7", "رصيف مرسى دبي، المرسى 7"), t("Shuttle boat every 30 minutes", "قارب مكوكي كل 30 دقيقة")] },
        ],
        link: { label: t("See map", "عرض الخريطة"), href: P("location") },
        media: ["aerial-1", "aerial-2"],
      },
      {
        id: "decks", type: "tileCarousels",
        tiles: [
          { media: ["deck-dj-1", "deck-dj-2"], heading: t("DJ Stage", "منصة الدي جي"), sub: t("Where the sound lives", "حيث يعيش الصوت"), caption: t("Main deck", "السطح الرئيسي"), href: P("afternoon-package") },
          { media: ["deck-pool-1", "deck-pool-2"], heading: t("Beach Club", "النادي الشاطئي"), sub: t("Where the party starts", "حيث تبدأ الحفلة"), caption: t("Pool bed", "سرير المسبح"), href: P("morning-package") },
          { media: ["terrace-1", "terrace-2"], heading: t("Sunset Terrace", "شرفة الغروب"), sub: t("2nd floor", "الطابق الثاني"), caption: t("Sunset bed", "سرير الغروب"), href: P("about") },
          { media: ["cabana-b", "cabana-a"], heading: t("Cabanas", "الكابانات"), sub: t("Private, with butler", "خاصة، مع خادم شخصي"), caption: t("Cabana", "كابانا"), href: P("cabana") },
        ],
      },
      { id: "pkg-morning", type: "packageEditorial", packageId: "morning" },
      { id: "pkg-afternoon", type: "packageEditorial", packageId: "afternoon", flip: true },
      { id: "pkg-night", type: "packageEditorial", packageId: "night" },
      {
        id: "restaurant", type: "galleryCarousel",
        heading: t("Panoramic Restaurant", "المطعم البانورامي"),
        sub: t("Japanese & Mediterranean cuisine", "مطبخ ياباني ومتوسطي"),
        media: ["food-3", "food-2", "food-1", "food-4"],
        link: { label: t("Food menu", "قائمة الطعام"), href: P("about", "restaurant") },
      },
      {
        id: "bar", type: "textPortrait",
        heading: t("Signature Cocktail Bar", "حانة الكوكتيل المميزة"),
        sub: t("3rd floor", "الطابق الثالث"),
        paragraphs: [t("The rooftop bar turns a full circle over the water. Mixologists work a short list of signatures built on Gulf citrus, smoke and sea salt, poured as the sun drops behind the Burj Al Arab.", "تدور حانة السطح دورة كاملة فوق الماء. يحضّر خبراء المزج قائمة قصيرة من المشروبات المميزة على أساس حمضيات الخليج والدخان وملح البحر، تُسكب مع غروب الشمس خلف برج العرب.")],
        media: "bar-1",
        link: { label: t("Our cocktails", "كوكتيلاتنا"), href: P("about", "restaurant") },
      },
      { id: "events", type: "posterCarousel", heading: t("Upcoming Events", "الفعاليات القادمة"), sub: t("Ignite your night", "أشعل ليلتك"), source: "upcoming", aspect: "2/3", href: P("events"), fallbackMedia: ["party-1", "party-2", "party-4"] },
      { id: "past", type: "posterCarousel", heading: t("Past Events", "فعاليات سابقة"), source: "highlights", aspect: "1/1", href: P("events"), fallbackMedia: ["party-3", "deck-dj-1", "party-1", "party-2"] },
      { id: "newsletter", type: "newsletter", kicker: t("Newsletter", "النشرة"), heading: t("Join the crew", "انضم إلى الطاقم"), body: t("First word on line-ups, member presales and the opening date.", "كن أول من يعرف عن البرامج، والبيع المسبق للأعضاء، وموعد الافتتاح.") },
    ],
  },

  /* ------------------------------------------------------------ MORNING */
  {
    id: "morning-package",
    slug: "morning-package",
    title: t("Morning Package — NOA", "باقة الصباح — نوا"),
    metaDescription: t("The Morning Package at NOA: 9:30 AM to 2:00 PM, pool, sun, daybeds and a slow first half of the day on the Gulf.", "باقة الصباح في نوا: من 9:30 صباحاً إلى 2:00 ظهراً، المسبح والشمس والأسرّة النهارية ونصف يوم هادئ على الخليج."),
    inNav: true,
    navLabel: t("Packages", "الباقات"),
    menuLabel: t("Morning Package", "باقة الصباح"),
    voiceAliases: [t("morning package", "باقة الصباح"), t("morning session", "جلسة الصباح"), t("packages", "الباقات")],
    sections: [
      { id: "subhero", type: "subhero", media: "pkg-morning", kicker: t("Package 01 · Chill Vibe", "الباقة 01 · أجواء هادئة"), heading: t("Morning *Package*", "باقة *الصباح*"), sub: t("9:30 AM — 2:00 PM. Pool, sun, daybeds and a slow first half of the day on the Gulf.", "9:30 صباحاً — 2:00 ظهراً. المسبح والشمس والأسرّة النهارية ونصف يوم هادئ على الخليج.") },
      {
        id: "session", type: "prose", kicker: t("— The Session", "— الجلسة"), heading: t("A Slow Start\nTo the Day", "بداية هادئة\nلليوم"),
        paragraphs: [
          t("The morning at NOA is for guests who want the water before the city wakes. We open the doors at **9:30 AM**, the kitchen at the same hour, and the pool is clear, the music is low, and the deck is calm.", "صباح نوا لمن يريد الماء قبل أن تستيقظ المدينة. نفتح الأبواب في **9:30 صباحاً**، والمطبخ في الساعة ذاتها، والمسبح صافٍ، والموسيقى هادئة، والسطح ساكن."),
          t("This is the session for breakfast on the bow, a long swim, an afternoon nap on a daybed, and a Burj Al Arab silhouette at midday. The DJ booth stays quiet until two; the energy is closer to a private members club than a beach party.", "هذه جلسة الإفطار على مقدمة السفينة، والسباحة الطويلة، والقيلولة على سرير نهاري، وظل برج العرب في منتصف النهار. تبقى كابينة الدي جيه هادئة حتى الثانية؛ والأجواء أقرب إلى نادٍ خاص منها إلى حفلة شاطئية."),
          t("The package includes the shuttle boat from Dubai Marina Pier, a welcome drink at check-in, all-day pool access, a towel, and an F&B credit loaded onto a wristband to spend across the four bars and the restaurant.", "تشمل الباقة القارب المكوكي من رصيف مرسى دبي، ومشروب ترحيب عند تسجيل الوصول، ودخول المسبح طوال اليوم، ومنشفة، ورصيد طعام ومشروبات محمّل على سوار المعصم للإنفاق في الحانات الأربع والمطعم."),
        ],
      },
      { id: "pool", type: "splitProse", media: "deck-1", num: t("— 01", "— 01"), heading: t("The Infinity\nPool", "المسبح\nاللامتناهي"), paragraphs: [
        t("Twenty-two metres of saltwater suspended above the Arabian Gulf — the longest infinity pool on water in Dubai. Sun shade umbrellas are available at every daybed. The pool is open from the first shuttle to the last.", "اثنان وعشرون متراً من المياه المالحة معلّقة فوق الخليج العربي — أطول مسبح لا متناهٍ على الماء في دبي. تتوفر مظلات الشمس عند كل سرير نهاري. المسبح مفتوح من أول قارب حتى آخره."),
        t("Lifeguards are on the deck through every session. Children aged 4 and up are welcome at the morning session under the supervision of a guardian.", "المنقذون متواجدون على السطح طوال كل جلسة. الأطفال من عمر 4 سنوات فما فوق مرحب بهم في جلسة الصباح تحت إشراف ولي أمر."),
      ] },
      { id: "breakfast", type: "splitProse", media: "kitchen", flip: true, num: t("— 02", "— 02"), heading: t("The Breakfast\nService", "خدمة\nالإفطار"), paragraphs: [
        t("The kitchen serves a focused breakfast and lunch menu through the morning session. Cold counter, pastry station, eggs cooked to order, and a small section of mid-day plates — burrata, hand-rolled pasta, wood-fired flatbreads.", "يقدم المطبخ قائمة إفطار وغداء مركّزة طوال جلسة الصباح. ركن بارد، ومحطة معجنات، وبيض حسب الطلب، وقسم صغير من أطباق منتصف النهار — بوراتا، ومعكرونة مصنوعة يدوياً، وخبز مسطح على الحطب."),
        t("F&B credit on your wristband can be spent at the restaurant or any of the four bars on board.", "يمكن إنفاق رصيد الطعام والمشروبات على سوارك في المطعم أو في أي من الحانات الأربع على المتن."),
      ] },
      { id: "included", type: "included", heading: t("What's Included", "ماذا تشمل الباقة"), sub: t("Every Morning Package reservation includes the following.", "يشمل كل حجز لباقة الصباح ما يلي."), rows: [
        { label: t("Shuttle Transfer", "النقل بالقارب"), value: t("Round-trip from Marina Pier", "ذهاباً وإياباً من رصيف المرسى") },
        { label: t("Welcome Drink", "مشروب الترحيب"), value: t("Sparkling on arrival", "مشروب فوار عند الوصول") },
        { label: t("Pool Access", "دخول المسبح"), value: t("All-session, towel included", "طوال الجلسة، مع منشفة") },
        { label: t("F&B Credit", "رصيد الطعام والمشروبات"), value: t("Wristband-loaded, all venues", "محمّل على السوار، في جميع المرافق") },
        { label: t("Restaurant Seat", "مقعد في المطعم"), value: t("90 min, reservation required", "90 دقيقة، يتطلب حجزاً") },
        { label: t("Guest Insurance", "تأمين الضيوف"), value: t("Covered during your visit", "مشمول خلال زيارتك") },
      ] },
      { id: "tariff", type: "tariff", heading: t("Choose Your Seat", "اختر مقعدك"), sub: t("Three ways to spend the morning at NOA.", "ثلاث طرق لقضاء الصباح في نوا."), cards: [
        { name: t("General Entry", "دخول عام"), price: "450", desc: t("Pool access, deck access, restaurant seating on availability. Walk the deck, find your spot, no reserved seat.", "دخول المسبح والسطح، ومقاعد المطعم حسب التوفر. تجوّل على السطح واعثر على مكانك، دون مقعد محجوز."), cap: t("Per person · From 4 yrs", "للشخص · من 4 سنوات") },
        { name: t("Daybed for Two", "سرير نهاري لشخصين"), price: "1,400", desc: t("Reserved poolside daybed, parasol, side table, drinks service. AED 800 F&B credit on the wristband.", "سرير نهاري محجوز بجانب المسبح، ومظلة، وطاولة جانبية، وخدمة مشروبات. رصيد 800 درهم على السوار."), cap: t("Up to 2 guests", "حتى ضيفين") },
        { name: t("Front-Row Daybed", "سرير الصف الأمامي"), price: "2,200", desc: t("Daybed at the pool's outer edge — directly above the Gulf. Parasol, side table, dedicated host. AED 1,300 F&B credit.", "سرير نهاري عند الحافة الخارجية للمسبح — فوق الخليج مباشرة. مظلة وطاولة جانبية ومضيف مخصص. رصيد 1,300 درهم."), cap: t("Up to 2 guests", "حتى ضيفين") },
      ], note: { before: t("Want a private cabana for the morning?", "تريد كابانا خاصة للصباح؟"), linkLabel: t("See Cabana options", "اطّلع على خيارات الكابانا"), after: t("— from AED 8,500.", "— ابتداءً من 8,500 درهم."), href: P("cabana") } },
      { id: "faq", type: "faq", heading: goodToKnow, faqIds: ["m-arrive", "m-children", "m-stay", "m-dress"], openFirst: true, more: faqMore },
      { id: "cta", type: "cta", pre: t("Morning Package · 9:30 AM — 2:00 PM", "باقة الصباح · 9:30 صباحاً — 2:00 ظهراً"), heading: t("Reserve the\nMorning", "احجز\nالصباح"), body: t("Slow water, soft sun, the city in the distance. Pick your seat and we'll see you on the pier.", "ماء هادئ، وشمس ناعمة، والمدينة في البعيد. اختر مقعدك ونراك على الرصيف."), primary: { label: t("Reserve a Seat", "احجز مقعداً"), href: P("booking") }, secondary: { label: t("See Afternoon Package", "اطّلع على باقة بعد الظهر"), href: P("afternoon-package") } },
    ],
  },

  /* ---------------------------------------------------------- AFTERNOON */
  {
    id: "afternoon-package",
    slug: "afternoon-package",
    title: t("Afternoon Package — NOA", "باقة بعد الظهر — نوا"),
    menuLabel: t("Afternoon Package", "باقة بعد الظهر"),
    metaDescription: t("The Afternoon Package at NOA: 12:00 PM to 9:30 PM, full pool, the DJ booth on, and Dubai's longest sunset.", "باقة بعد الظهر في نوا: من 12:00 ظهراً إلى 9:30 مساءً، المسبح بكامله، وكابينة الدي جيه تعمل، وأطول غروب في دبي."),
    voiceAliases: [t("afternoon package", "باقة بعد الظهر"), t("afternoon session", "جلسة بعد الظهر"), t("party session", "جلسة الحفلة")],
    sections: [
      { id: "subhero", type: "subhero", media: "pkg-afternoon", kicker: t("Package 02 · Party Vibe", "الباقة 02 · أجواء الحفلة"), heading: t("Afternoon *Package*", "باقة *بعد الظهر*"), sub: t("12:00 PM to 9:30 PM. Full pool, the DJ booth on, and Dubai's longest sunset.", "12:00 ظهراً إلى 9:30 مساءً. المسبح بكامله، وكابينة الدي جيه تعمل، وأطول غروب في دبي.") },
      { id: "session", type: "prose", kicker: t("— The Session", "— الجلسة"), heading: t("The Pool, the\nSound, the Sun", "المسبح،\nالصوت، الشمس"), paragraphs: [
        t("The afternoon session is NOA at full tilt. The pool fills, the DJ booth comes on at **2:00 PM**, the kitchen pivots to its lunch and dinner menus, and the energy rises through the afternoon into a long, golden Dubai sunset.", "جلسة بعد الظهر هي نوا بكامل طاقتها. يمتلئ المسبح، وتبدأ كابينة الدي جيه في **2:00 ظهراً**، وينتقل المطبخ إلى قوائم الغداء والعشاء، وترتفع الأجواء طوال العصر نحو غروب دبي الذهبي الطويل."),
        t("By six the music is in full flow and the sky behind the Burj Al Arab is going pink. By nine the bar has emptied its first run of cocktails. By half past, the last shuttle pulls away from the pier and the deck goes dark for the night.", "بحلول السادسة تكون الموسيقى في ذروتها والسماء خلف برج العرب تميل إلى الوردي. وبحلول التاسعة تكون الحانة قد أنهت دفعتها الأولى من الكوكتيلات. وفي التاسعة والنصف يغادر آخر قارب الرصيف ويخلد السطح إلى الظلام."),
        t("The package includes the shuttle boat from Dubai Marina Pier, a welcome drink at check-in, full pool access, a towel, and an F and B credit loaded onto a wristband. The afternoon session is 18+.", "تشمل الباقة القارب المكوكي من رصيف مرسى دبي، ومشروب ترحيب عند تسجيل الوصول، ودخول المسبح الكامل، ومنشفة، ورصيد طعام ومشروبات محمّل على السوار. جلسة بعد الظهر للبالغين فقط (+18)."),
      ] },
      { id: "dj", type: "splitProse", media: "dj-booth", num: t("— 01", "— 01"), heading: t("The DJ\nProgramme", "برنامج\nالدي جيه"), paragraphs: [
        t("A resident DJ takes the booth at 2 PM every day. On Fridays and Saturdays, a guest headliner joins — names you will recognise from Ibiza, Berlin and Lisbon. The full programme is published at the start of every month.", "يتولى دي جيه مقيم الكابينة في الثانية ظهراً كل يوم. وفي الجمعة والسبت ينضم نجم ضيف — أسماء تعرفها من إيبيزا وبرلين ولشبونة. يُنشر البرنامج الكامل في بداية كل شهر."),
        t("The booth sits at the bow of the upper deck, facing the city. The sound is calibrated for the open water — close on the deck, soft over the pool below.", "تقع الكابينة في مقدمة السطح العلوي مواجهةً للمدينة. الصوت معاير للمياه المفتوحة — قريب على السطح، وناعم فوق المسبح في الأسفل."),
      ], link: { label: t("See Upcoming Headliners →", "اطّلع على النجوم القادمين ←"), href: P("events") } },
      { id: "kitchen", type: "splitProse", media: "deck-2", flip: true, num: t("— 02", "— 02"), heading: t("The Late\nKitchen", "المطبخ\nالمتأخر"), paragraphs: [
        t("The kitchen serves a fuller dinner menu from 5 PM. Larger sharing plates, the wood-fired grill at full output, signature whole-fish bakes, and a small but considered list of desserts.", "يقدم المطبخ قائمة عشاء أوسع من الخامسة مساءً. أطباق مشاركة أكبر، والشواية على الحطب بكامل طاقتها، وسمك كامل مخبوز بأسلوبنا، وقائمة حلويات صغيرة مدروسة."),
        t("F and B credit on your wristband applies anywhere on board, including the restaurant and all four bars. The kitchen closes at 9:00 PM; the bars close with the session.", "يسري رصيد الطعام والمشروبات على سوارك في أي مكان على المتن، بما في ذلك المطعم والحانات الأربع. يغلق المطبخ في 9:00 مساءً؛ وتغلق الحانات مع انتهاء الجلسة."),
      ] },
      { id: "included", type: "included", heading: t("What's Included", "ماذا تشمل الباقة"), sub: t("Every Afternoon Package reservation includes the following.", "يشمل كل حجز لباقة بعد الظهر ما يلي."), rows: [
        { label: t("Shuttle Transfer", "النقل بالقارب"), value: t("Round-trip from Marina Pier", "ذهاباً وإياباً من رصيف المرسى") },
        { label: t("Welcome Drink", "مشروب الترحيب"), value: t("Signature cocktail on arrival", "كوكتيل مميز عند الوصول") },
        { label: t("Pool and Deck Access", "دخول المسبح والسطح"), value: t("Full session, towel included", "الجلسة كاملة، مع منشفة") },
        { label: t("F and B Credit", "رصيد الطعام والمشروبات"), value: t("Wristband-loaded, all venues", "محمّل على السوار، في جميع المرافق") },
        { label: t("DJ Programme", "برنامج الدي جيه"), value: t("Resident + weekly headliner", "مقيم + نجم أسبوعي") },
        { label: t("Guest Insurance", "تأمين الضيوف"), value: t("Covered during your visit", "مشمول خلال زيارتك") },
      ] },
      { id: "tariff", type: "tariff", heading: t("Choose Your Seat", "اختر مقعدك"), sub: t("Three ways to spend the afternoon at NOA.", "ثلاث طرق لقضاء فترة بعد الظهر في نوا."), cards: [
        { name: t("General Entry", "دخول عام"), price: "650", desc: t("Pool access, deck access, DJ programme, restaurant seating on availability. Find your spot on the deck.", "دخول المسبح والسطح وبرنامج الدي جيه، ومقاعد المطعم حسب التوفر. اعثر على مكانك على السطح."), cap: t("Per person · 18+ only", "للشخص · للبالغين فقط (+18)") },
        { name: t("Daybed for Two", "سرير نهاري لشخصين"), price: "2,200", desc: t("Reserved poolside daybed, parasol, side table, drinks service. AED 1,200 F and B credit on the wristband.", "سرير نهاري محجوز بجانب المسبح، ومظلة، وطاولة جانبية، وخدمة مشروبات. رصيد 1,200 درهم على السوار."), cap: t("Up to 2 guests", "حتى ضيفين") },
        { name: t("Front-Row Daybed", "سرير الصف الأمامي"), price: "3,400", desc: t("Daybed at the pool's outer edge — directly above the Gulf, west-facing for sunset. AED 2,000 F and B credit.", "سرير نهاري عند الحافة الخارجية للمسبح — فوق الخليج مباشرة، مواجه للغرب لمشاهدة الغروب. رصيد 2,000 درهم."), cap: t("Up to 2 guests", "حتى ضيفين") },
      ], note: { before: t("Want a private cabana for the afternoon?", "تريد كابانا خاصة لفترة بعد الظهر؟"), linkLabel: t("See Cabana options", "اطّلع على خيارات الكابانا"), after: t("— from AED 8,500 (all-day).", "— ابتداءً من 8,500 درهم (ليوم كامل)."), href: P("cabana") } },
      { id: "faq", type: "faq", heading: goodToKnow, faqIds: ["a-arrive", "a-18", "a-dress", "a-table"], openFirst: true, more: faqMore },
      { id: "cta", type: "cta", pre: t("Afternoon Package · 12:00 PM to 9:30 PM", "باقة بعد الظهر · 12:00 ظهراً إلى 9:30 مساءً"), heading: t("Reserve the\nAfternoon", "احجز\nبعد الظهر"), body: t("The pool, the DJ, the city skyline turning gold. Pick your seat and we'll see you on the pier.", "المسبح، والدي جيه، وأفق المدينة يتحول إلى الذهبي. اختر مقعدك ونراك على الرصيف."), primary: { label: t("Reserve a Seat", "احجز مقعداً"), href: P("booking") }, secondary: { label: t("See Private Cabanas", "اطّلع على الكابانات الخاصة"), href: P("cabana") } },
    ],
  },

  /* -------------------------------------------------------------- CABANA */
  {
    id: "cabana",
    slug: "cabana",
    title: t("Private Cabana — NOA", "كابانا خاصة — نوا"),
    menuLabel: t("Private Cabana", "كابانا خاصة"),
    metaDescription: t("Private cabanas at NOA: a poolside suite, a dedicated butler, and the Gulf to yourselves, 9:30 AM to 9:30 PM.", "الكابانات الخاصة في نوا: جناح بجانب المسبح، وخادم مخصص، والخليج لكم وحدكم، من 9:30 صباحاً إلى 9:30 مساءً."),
    voiceAliases: [t("cabana", "كابانا"), t("private cabana", "كابانا خاصة"), t("cabanas", "الكابانات")],
    sections: [
      { id: "subhero", type: "subhero", media: "pkg-cabana", kicker: t("Package 03 · All Day · Exclusive", "الباقة 03 · طوال اليوم · حصرية"), heading: t("Private *Cabana*", "كابانا *خاصة*"), sub: t("9:30 AM to 9:30 PM. A poolside suite, a dedicated butler, and the Gulf to yourselves.", "9:30 صباحاً إلى 9:30 مساءً. جناح بجانب المسبح، وخادم مخصص، والخليج لكم وحدكم.") },
      { id: "reservation", type: "prose", kicker: t("— The Reservation", "— الحجز"), heading: t("Your Own Corner\nof the Deck", "ركنك الخاص\nمن السطح"), paragraphs: [
        t("Ten cabanas sit along the upper pool edge — each enclosed on three sides, open to the water, and yours for the full day. The cabana spans both the morning and the afternoon sessions, so the seat you sit down in at **9:30 AM** is the seat you stand up from at **9:30 PM**.", "عشر كابانات تمتد على طول الحافة العليا للمسبح — كل منها مغلقة من ثلاث جهات ومفتوحة على الماء ولكم طوال اليوم. تمتد الكابانا عبر جلستي الصباح وبعد الظهر، فالمقعد الذي تجلسون فيه في **9:30 صباحاً** هو ما تغادرونه في **9:30 مساءً**."),
        t("A butler is assigned to your cabana on arrival and stays with you for the duration. They will handle every drinks order at the bar, every plate from the restaurant, and every small request — from a phone charger to a particular bottle from the cellar.", "يُخصص خادم لكابانتكم عند الوصول ويبقى معكم طوال المدة. يتولى كل طلب مشروبات من الحانة، وكل طبق من المطعم، وكل طلب صغير — من شاحن هاتف إلى زجاجة بعينها من القبو."),
        t("The cabana is priced from **AED 8,500** for up to six guests, including an unlimited F and B credit at all four bars and the restaurant. Premium spirits and champagne service are available on a separate menu.", "سعر الكابانا يبدأ من **8,500 درهم** لما يصل إلى ستة ضيوف، شاملاً رصيد طعام ومشروبات غير محدود في الحانات الأربع والمطعم. تتوفر المشروبات الفاخرة وخدمة الشمبانيا في قائمة منفصلة."),
      ] },
      { id: "setup", type: "splitProse", media: "deck-1", num: t("— The Setup", "— التجهيز"), heading: t("Inside the\nCabana", "داخل\nالكابانا"), paragraphs: [
        t("A six-seat lounge on the pool side, a small private bar, a refrigerated drinks unit, side tables, and parasol-shaded daybeds spilling out to the pool edge. The view runs directly along the 22-metre pool to the Gulf horizon.", "جلسة لستة أشخاص على جانب المسبح، وحانة خاصة صغيرة، وثلاجة مشروبات، وطاولات جانبية، وأسرّة نهارية مظللة تمتد حتى حافة المسبح. الإطلالة تمتد مباشرة على طول المسبح البالغ 22 متراً حتى أفق الخليج."),
        t("Sound is on the cabana's own discreet system, so your conversation stays your own. The DJ feed can be brought into the cabana on request.", "الصوت عبر نظام الكابانا الخاص والمنفصل، لتبقى أحاديثكم لكم وحدكم. ويمكن بث الدي جيه داخل الكابانا عند الطلب."),
      ] },
      { id: "included", type: "included", heading: t("What's Included", "ماذا تشمل الباقة"), sub: t("Every Private Cabana reservation includes the following.", "يشمل كل حجز للكابانا الخاصة ما يلي."), rows: [
        { label: t("Dedicated Butler", "خادم مخصص"), value: t("Assigned for the full day", "مخصص طوال اليوم") },
        { label: t("Unlimited F and B", "طعام ومشروبات غير محدودة"), value: t("Across all four bars and restaurant", "في الحانات الأربع والمطعم") },
        { label: t("Premium Spirits", "مشروبات فاخرة"), value: t("On a separate cellar menu", "في قائمة قبو منفصلة") },
        { label: t("Champagne Service", "خدمة الشمبانيا"), value: t("By the bottle, by request", "بالزجاجة، عند الطلب") },
        { label: t("Fruit and Antipasti", "فواكه ومقبلات"), value: t("Welcome platter on arrival", "طبق ترحيبي عند الوصول") },
        { label: t("Both Sessions", "الجلستان معاً"), value: t("Morning and Afternoon, one seat", "الصباح وبعد الظهر، مقعد واحد") },
        { label: t("Priority Shuttle", "قارب ذو أولوية"), value: t("Dedicated boat slot, both ways", "موعد قارب مخصص، ذهاباً وإياباً") },
        { label: t("Late Check-Out", "مغادرة متأخرة"), value: t("Stay until the last shuttle", "البقاء حتى آخر قارب") },
      ] },
      { id: "tariff", type: "tariff", heading: t("Choose Your Cabana", "اختر كابانتك"), sub: t("Three configurations along the pool's edge. All priced for up to six guests.", "ثلاثة تشكيلات على طول حافة المسبح. جميعها بسعر يشمل حتى ستة ضيوف."), cards: [
        { name: t("Signature Cabana", "الكابانا المميزة"), price: "8,500", desc: t("The standard cabana — six seats, parasol daybeds, private bar. Eight along the pool, side-facing the Gulf.", "الكابانا الأساسية — ستة مقاعد، وأسرّة نهارية مظللة، وحانة خاصة. ثماني كابانات على طول المسبح، جانبية الإطلالة على الخليج."), cap: t("Up to 6 guests · All-day", "حتى 6 ضيوف · طوال اليوم") },
        { name: t("Premium Pool-Edge", "حافة المسبح الفاخرة"), price: "12,500", desc: t("Two pool-edge cabanas with direct water access from the deck. Larger lounge, extended day-bed run, premium drinks package.", "كابانتان على حافة المسبح مع وصول مباشر إلى الماء من السطح. جلسة أكبر، وصف أسرّة نهارية ممتد، وباقة مشروبات فاخرة."), cap: t("Up to 6 guests · All-day", "حتى 6 ضيوف · طوال اليوم") },
        { name: t("Owner's Suite", "جناح المالك"), price: "18,000", desc: t("One only. The bow-corner cabana — wraparound water view, west-facing for sunset, dedicated booth at the DJ stage. Two butlers.", "واحد فقط. كابانا زاوية المقدمة — إطلالة محيطة على الماء، مواجهة للغرب لمشاهدة الغروب، ومقصورة مخصصة عند منصة الدي جيه. خادمان."), cap: t("Up to 6 guests · All-day", "حتى 6 ضيوف · طوال اليوم") },
      ], note: { before: t("Booking a group of 7 or more? Cabanas can be combined for private events.", "تحجزون لمجموعة من 7 أشخاص أو أكثر؟ يمكن دمج الكابانات للفعاليات الخاصة."), linkLabel: t("Enquire here", "استفسر هنا"), after: t(".", "."), href: P("contact") } },
      { id: "faq", type: "faq", heading: goodToKnow, faqIds: ["c-size", "c-beyond", "c-half"], openFirst: true, more: faqMore },
      { id: "cta", type: "cta", pre: t("Private Cabana · From AED 8,500", "كابانا خاصة · ابتداءً من 8,500 درهم"), heading: t("Reserve a\nCabana", "احجز\nكابانا"), body: t("A poolside suite, a butler, and the deck to yourselves. Tell us your date and we'll hold your seat.", "جناح بجانب المسبح، وخادم، والسطح لكم وحدكم. أخبرونا بالتاريخ وسنحجز مقعدكم."), primary: { label: t("Enquire Now", "استفسر الآن"), href: P("contact") }, secondary: { label: t("Back to Packages", "العودة إلى الباقات"), href: P("morning-package") } },
    ],
  },

  /* -------------------------------------------------------------- EVENTS */
  {
    id: "events",
    slug: "events",
    title: t("Events — NOA", "الفعاليات — نوا"),
    metaDescription: t("A monthly programme of nights with the world's most considered DJs, on the water off Dubai Marina.", "برنامج شهري من الليالي مع أكثر الدي جيه تميزاً في العالم، على الماء قبالة مرسى دبي."),
    inNav: true,
    navLabel: t("Events", "الفعاليات"),
    voiceAliases: [t("events", "الفعاليات"), t("programme", "البرنامج"), t("nights", "الليالي"), t("DJs", "الدي جيه")],
    sections: [
      { id: "subhero", type: "subhero", media: "evt-1", kicker: t("— On the Water", "— على الماء"), heading: t("The *Events*", "*الفعاليات*"), sub: t("Residents, guest DJs and themed nights on the water. Every night below is bookable: tap one to pick your seat on the deck.", "برنامج شهري من الليالي مع أكثر الدي جيه تميزاً في العالم. التقويم الكامل أدناه.") },
      { id: "programme", type: "eventsProgramme", kicker: t("· The programme", "· البرنامج"), heading: t("This Season *on the Water*", "هذا الموسم *على الماء*"), sub: t("Every published night, with its session and hours. Tap a night to pick your seat on the deck plan.", "كل ليلة منشورة مع جلستها وساعاتها. اضغط على ليلة لاختيار مقعدك على مخطط السطح."), empty: t("The programme is being finalised. Join the list below and we will send the first dates.", "يجري الانتهاء من البرنامج. انضم إلى القائمة أدناه وسنرسل لك أولى المواعيد.") },
      { id: "cta", type: "cta", pre: t("Event Reservations", "حجوزات الفعاليات"), heading: t("Reserve a\nPlace for a Night", "احجز مكاناً\nلليلة"), body: t("Event seats are limited and sell out quickly. Reserve your spot in advance to guarantee entry.", "مقاعد الفعاليات محدودة وتنفد بسرعة. احجز مكانك مسبقاً لضمان الدخول."), primary: { label: t("Enquire About a Night", "استفسر عن ليلة"), href: P("contact") }, secondary: { label: t("See Daily Packages", "اطّلع على الباقات اليومية"), href: P("morning-package") } },
    ],
  },

  /* --------------------------------------------------------------- ABOUT */
  {
    id: "about",
    slug: "about",
    title: t("About — NOA", "عن نوا"),
    metaDescription: t("Why a floating beach club: the idea, the vessel and the philosophy behind NOA, two kilometres off Dubai Marina.", "لماذا نادٍ شاطئي عائم: الفكرة والسفينة والفلسفة وراء نوا، على بُعد كيلومترين من مرسى دبي."),
    inNav: true,
    navLabel: t("About", "عن نوا"),
    voiceAliases: [t("about", "عن نوا"), t("the story", "القصة"), t("who are you", "من أنتم")],
    sections: [
      { id: "subhero", type: "subhero", media: "hero-still", kicker: t("— About", "— عن نوا"), heading: t("A Beach Club *on the Sea*", "نادٍ شاطئي *على البحر*"), sub: t("Dubai's first floating beach club. Anchored in the Arabian Gulf. Opening 2026.", "أول نادٍ شاطئي عائم في دبي. راسٍ في الخليج العربي. الافتتاح 2026.") },
      { id: "idea", type: "prose", kicker: t("— The Idea", "— الفكرة"), heading: t("Why a Floating\nBeach Club", "لماذا نادٍ شاطئي\nعائم"), paragraphs: [
        t("The idea behind NOA was simple. Dubai already had every kind of beach club on the sand. What it didn't have was a club on the water itself — open Gulf in every direction, the city skyline in the distance, no walls, no neighbours, no kerb to step back onto.", "كانت فكرة نوا بسيطة. دبي تملك أصلاً كل أنواع النوادي الشاطئية على الرمال. ما لم تكن تملكه هو نادٍ على الماء نفسه — الخليج المفتوح في كل اتجاه، وأفق المدينة في البعيد، بلا جدران، وبلا جيران، وبلا رصيف تعود إليه."),
        t("NOA is anchored two kilometres off Dubai Marina. You arrive by shuttle boat, you spend the day on a 280-capacity deck built around a 22-metre infinity pool, and at the end of the day you leave by the same shuttle. There is no road in. There is no walk-up. The water is the venue.", "ترسو نوا على بُعد كيلومترين من مرسى دبي. تصل بالقارب المكوكي، وتقضي يومك على سطح يتسع لـ280 ضيفاً مبني حول مسبح لا متناهٍ بطول 22 متراً، وفي نهاية اليوم تغادر بالقارب نفسه. لا طريق إليها. ولا وصول سيراً. الماء هو المكان."),
        t("We open in **2026**. The deck is now in final fit-out; the bars are being staffed; the kitchen is being assembled. The opening series of nights — Claptone, Peggy Gou, Black Coffee — is announced for March. The rest follows.", "نفتتح في **2026**. السطح الآن في مراحل التجهيز الأخيرة؛ والحانات يجري توظيف طواقمها؛ والمطبخ قيد التجميع. سلسلة ليالي الافتتاح — كلابتون، بيغي غو، بلاك كوفي — معلنة لشهر مارس. والبقية تتبع."),
      ] },
      { id: "vessel", type: "specs", heading: t("The Vessel", "السفينة"), sub: t("Numbers behind the deck.", "أرقام وراء السطح."), items: [
        { n: "22", small: "m", label: t("Infinity Pool", "مسبح لا متناهٍ") },
        { n: "4", label: t("Premium Bars", "حانات فاخرة") },
        { n: "10", label: t("Private Cabanas", "كابانات خاصة") },
        { n: "280", label: t("Daily Capacity", "السعة اليومية") },
      ] },
      { id: "deck", type: "splitProse", media: "deck-1", num: t("— The Deck", "— السطح"), heading: t("Built for the\nOpen Gulf", "مبنية\nللخليج المفتوح"), paragraphs: [
        t("The platform sits on a moored barge purpose-built for the Gulf — naval-architect-led, twin-anchored, motion-stabilised. The pool is saltwater, glass-sided on the outer edge, and engineered to read as level even in moderate swell.", "تقوم المنصة على صندل راسٍ مبني خصيصاً للخليج — بتصميم مهندسين بحريين، ومرساتين، ومثبّت ضد الحركة. المسبح بمياه مالحة، وزجاجي الجانب عند الحافة الخارجية، ومصمم ليبدو مستوياً حتى في الأمواج المعتدلة."),
        t("Above the pool deck, an upper deck holds the DJ booth, the rooftop bar, and the cabana row. Below, the restaurant, the central bar, and the service galley.", "فوق سطح المسبح، يضم السطح العلوي كابينة الدي جيه وحانة السطح وصف الكابانات. وفي الأسفل، المطعم والحانة المركزية ومطبخ الخدمة."),
      ] },
      { id: "philosophy", type: "splitProse", media: "deck-2", flip: true, num: t("— The Philosophy", "— الفلسفة"), heading: t("A Quieter Kind\nof Beach Club", "نادٍ شاطئي\nمن نوع أهدأ"), paragraphs: [
        t("NOA was designed against the trend. No Lamborghini drop-off. No bottle parade. No champagne shower over the deck. The music is calibrated, not pushed; the menu is short, not exhaustive; the lighting is candle-warm at night, not strobe.", "صُممت نوا عكس التيار. لا موكب سيارات فارهة. لا استعراض زجاجات. لا رش شمبانيا على السطح. الموسيقى معايرة لا مفروضة؛ والقائمة قصيرة لا مطوّلة؛ والإضاءة ليلاً دافئة كالشموع لا وامضة."),
        t("The guest list is capped at 280 daily so the pool stays usable and the service stays close. Cabanas are sold one-per-group, not split. The room is meant to feel like a small island, not a stadium.", "قائمة الضيوف محددة بـ280 يومياً ليبقى المسبح قابلاً للاستخدام وتبقى الخدمة قريبة. تُباع الكابانات لمجموعة واحدة ولا تُقسّم. المكان مصمم ليبدو كجزيرة صغيرة لا ملعباً."),
      ] },
      { id: "cta", type: "cta", pre: t("Opening 2026 · Dubai, UAE", "الافتتاح 2026 · دبي، الإمارات"), heading: t("See You\non the Water", "نراكم\nعلى الماء"), body: t("Be among the first to reserve. Opening series begins March 2026.", "كونوا من أوائل الحاجزين. تبدأ سلسلة الافتتاح في مارس 2026."), primary: { label: t("See the Packages", "اطّلع على الباقات"), href: P("morning-package") }, secondary: { label: t("See the Programme", "اطّلع على البرنامج"), href: P("events") } },
    ],
  },

  /* ------------------------------------------------------------ LOCATION */
  {
    id: "location",
    slug: "location",
    title: t("Location — NOA", "الموقع — نوا"),
    metaDescription: t("How to arrive at NOA: Dubai Marina Pier, Berth 7, shuttle every 30 minutes from 9:00 AM, an 11-minute crossing.", "كيفية الوصول إلى نوا: رصيف مرسى دبي، المرسى 7، قارب كل 30 دقيقة من 9:00 صباحاً، عبور يستغرق 11 دقيقة."),
    inNav: true,
    navLabel: t("Location", "الموقع"),
    voiceAliases: [t("location", "الموقع"), t("how to get there", "كيف أصل"), t("directions", "الاتجاهات"), t("shuttle", "القارب المكوكي"), t("pier", "الرصيف")],
    sections: [
      { id: "subhero", type: "subhero", media: "loc-hero", kicker: t("— How to Arrive", "— كيفية الوصول"), heading: t("Find *NOA*", "اعثر على *نوا*"), sub: t("Dubai Marina Pier, Berth 7. Shuttle every 30 minutes from 9:00 AM.", "رصيف مرسى دبي، المرسى 7. قارب كل 30 دقيقة من 9:00 صباحاً.") },
      { id: "strip", type: "contactStrip", cells: [
        { label: t("Departure", "الانطلاق"), value: t("Dubai Marina Pier\nBerth 7", "رصيف مرسى دبي\nالمرسى 7") },
        { label: t("Hours", "ساعات العمل"), value: t("Daily\n9:30 AM — 9:30 PM", "يومياً\n9:30 صباحاً — 9:30 مساءً") },
        { label: t("Phone", "الهاتف"), value: t("+971 4 840 0000", "+971 4 840 0000"), href: "tel:+97148400000" },
        { label: t("Email", "البريد الإلكتروني"), value: t("hello@noa-dubai.com", "hello@noa-dubai.com"), href: "mailto:hello@noa-dubai.com" },
      ] },
      { id: "map", type: "map", kicker: t("· On the map", "· على الخريطة"), heading: t("Dubai Marina Pier, *Berth 7*", "رصيف مرسى دبي، *المرسى 7*"), query: "Dubai Marina Yacht Club, Dubai", address: t("Dubai Marina Walk, beside the Marina Yacht Club — look for the NOA desk at Berth 7.", "ممشى مرسى دبي، بجانب نادي اليخوت — ابحث عن مكتب نوا عند المرسى 7."), note: t("Valet parking at the pier · Metro: DMCC (12-minute walk) · Tram: Marina Towers (6-minute walk)", "صف السيارات عند الرصيف · المترو: محطة DMCC (12 دقيقة سيراً) · الترام: مارينا تاورز (6 دقائق سيراً)") },
      { id: "crossing", type: "prose", kicker: t("— The Crossing", "— العبور"), heading: t("From the\nMarina to the Sea", "من المرسى\nإلى البحر"), paragraphs: [
        t("NOA is anchored approximately two kilometres off the coast, beyond the Marina breakwater. The only way on board is by our shuttle boat from **Dubai Marina Pier, Berth 7**. The crossing takes 11 minutes.", "ترسو نوا على بُعد كيلومترين تقريباً من الساحل، خلف حاجز أمواج المرسى. الطريق الوحيد إلى المتن هو قاربنا المكوكي من **رصيف مرسى دبي، المرسى 7**. يستغرق العبور 11 دقيقة."),
        t("Shuttles run every 30 minutes from **9:00 AM** to **10:00 PM**. The first shuttle of the day is the Morning Package check-in. The last shuttle of the night is the Afternoon Package departure. Reservations are tied to a wristband; the boat crew check at boarding.", "تنطلق القوارب كل 30 دقيقة من **9:00 صباحاً** إلى **10:00 مساءً**. أول قارب في اليوم هو تسجيل وصول باقة الصباح. وآخر قارب في الليل هو مغادرة باقة بعد الظهر. ترتبط الحجوزات بسوار المعصم؛ ويتحقق طاقم القارب عند الصعود."),
        t("The pier itself is reached by car, taxi or metro. Valet parking is available adjacent to the pier from 9:00 AM. From Dubai Marina metro station, the pier is a six-minute walk. A NOA-branded check-in lounge is on the pier with cold drinks and a wristband counter.", "يمكن الوصول إلى الرصيف بالسيارة أو التاكسي أو المترو. تتوفر خدمة صف السيارات بجانب الرصيف من 9:00 صباحاً. ومن محطة مترو مرسى دبي، الرصيف على بُعد ست دقائق سيراً. توجد صالة تسجيل وصول تحمل علامة نوا على الرصيف مع مشروبات باردة ومنضدة للأساور."),
      ] },
      { id: "arrival", type: "splitProse", media: "marina", num: t("— The Arrival", "— الوصول"), heading: t("A Marina\nLounge First", "صالة المرسى\nأولاً"), paragraphs: [
        t("Check-in is at the pier lounge, not on the boat. On arrival, ID is matched to the reservation, the wristband is loaded with your F and B credit, and you are walked to the next shuttle.", "تسجيل الوصول في صالة الرصيف لا على القارب. عند الوصول تُطابق الهوية مع الحجز، ويُحمّل السوار برصيد الطعام والمشروبات، وتُرافَق إلى القارب التالي."),
        t("We recommend arriving 30 minutes before your intended shuttle. The lounge has cold towels and a small bar — coffee in the morning, sparkling in the afternoon.", "ننصح بالوصول قبل 30 دقيقة من موعد القارب المقصود. تضم الصالة مناشف باردة وحانة صغيرة — قهوة في الصباح، ومشروب فوار بعد الظهر."),
      ] },
      { id: "steps", type: "specs", heading: t("Your Arrival, Step by Step", "وصولك خطوة بخطوة"), sub: t("From the moment you leave your hotel to the first drink on board.", "من لحظة مغادرة الفندق حتى أول مشروب على المتن."), items: [
        { n: "01", label: t("Marina Pier\nDrop-Off", "النزول عند\nرصيف المرسى") },
        { n: "02", label: t("Check-In\nLounge", "صالة\nتسجيل الوصول") },
        { n: "03", label: t("11-Min\nShuttle", "قارب\n11 دقيقة") },
        { n: "04", label: t("Welcome\non Deck", "الترحيب\nعلى السطح") },
      ] },
      { id: "cta", type: "cta", pre: t("NOA · Dubai Marina · Berth 7", "نوا · مرسى دبي · المرسى 7"), heading: t("We'll See You\non the Pier", "نراكم\nعلى الرصيف"), body: t("Reservations include shuttle transfer in both directions. Just turn up at Berth 7 with your booking on your phone.", "تشمل الحجوزات النقل بالقارب في الاتجاهين. فقط احضر إلى المرسى 7 وحجزك على هاتفك."), primary: { label: t("Reserve a Seat", "احجز مقعداً"), href: P("booking") }, secondary: { label: t("More Questions", "المزيد من الأسئلة"), href: P("faq") } },
    ],
  },

  /* ----------------------------------------------------------------- FAQ */
  {
    id: "faq",
    slug: "faq",
    title: t("FAQ — NOA", "الأسئلة الشائعة — نوا"),
    metaDescription: t("Everything we get asked the most about booking, arrival, dress code and private events at NOA.", "كل ما يُسأل عنه كثيراً حول الحجز والوصول وقواعد اللباس والفعاليات الخاصة في نوا."),
    inNav: true,
    navLabel: t("FAQ", "الأسئلة الشائعة"),
    voiceAliases: [t("FAQ", "الأسئلة الشائعة"), t("questions", "أسئلة"), t("dress code", "قواعد اللباس"), t("cancellation policy", "سياسة الإلغاء")],
    sections: [
      { id: "subhero", type: "subhero", media: "faq-hero", kicker: t("— Good to Know", "— من المفيد معرفته"), heading: t("Frequently *Asked*", "الأسئلة *الشائعة*"), sub: t("Everything we get asked the most. If something is missing, write to us and we'll add it.", "كل ما يُسأل عنه كثيراً. إن كان شيء ناقصاً، راسلونا وسنضيفه.") },
      { id: "booking", type: "faq", heading: t("Booking and Entry", "الحجز والدخول"), faqIds: ["book-advance", "cancellation", "min-age", "photography", "vouchers"], openFirst: true },
      { id: "arrival", type: "faq", heading: t("Arrival and Access", "الوصول والدخول"), faqIds: ["get-there", "parking", "private-boat", "accessibility"], noTopBorder: true },
      { id: "onboard", type: "faq", heading: t("On Board", "على المتن"), faqIds: ["dress-code-rest", "included", "weather", "own-food"], noTopBorder: true },
      { id: "private", type: "faq", heading: t("Private Events", "الفعاليات الخاصة"), faqIds: ["private-hire", "min-spend"], noTopBorder: true, more: { label: t("Still Have a Question? Write to Us", "ما زال لديك سؤال؟ راسلنا"), href: P("contact") } },
      { id: "cta", type: "cta", pre: t("Anything Else?", "هل من شيء آخر؟"), heading: t("Just\nAsk Us", "فقط\nاسألنا"), body: t("If something here didn't answer your question, write to the team directly. We reply within one business day.", "إن لم يجب شيء هنا عن سؤالك، راسل الفريق مباشرة. نرد خلال يوم عمل واحد."), primary: { label: t("Write to Us", "راسلنا"), href: P("contact") }, secondary: { label: t("Reserve a Seat", "احجز مقعداً"), href: P("morning-package") } },
    ],
  },

  /* ------------------------------------------------------------- CONTACT */
  {
    id: "contact",
    slug: "contact",
    title: t("Contact — NOA", "تواصل معنا — نوا"),
    menuLabel: t("Contact", "تواصل معنا"),
    metaDescription: t("Reservations, private events, partnerships, careers. The right person on the NOA team will reply within one business day.", "الحجوزات والفعاليات الخاصة والشراكات والوظائف. سيرد عليك الشخص المناسب من فريق نوا خلال يوم عمل واحد."),
    voiceAliases: [t("contact", "تواصل"), t("write to us", "راسلنا"), t("talk to someone", "التحدث مع أحد"), t("private events", "الفعاليات الخاصة")],
    sections: [
      { id: "subhero", type: "subhero", media: "contact-hero", kicker: t("— Get in Touch", "— تواصل معنا"), heading: t("Write to *Us*", "راسل*نا*"), sub: t("Reservations, private events, partnerships, careers. The right person on our team will reply within one business day.", "الحجوزات والفعاليات الخاصة والشراكات والوظائف. سيرد عليك الشخص المناسب من فريقنا خلال يوم عمل واحد.") },
      { id: "strip", type: "contactStrip", cells: [
        { label: t("Address", "العنوان"), value: t("Dubai Marina Pier\nBerth 7, Dubai, UAE", "رصيف مرسى دبي\nالمرسى 7، دبي، الإمارات") },
        { label: t("Phone", "الهاتف"), value: t("+971 4 840 0000", "+971 4 840 0000"), href: "tel:+97148400000" },
        { label: t("Email", "البريد الإلكتروني"), value: t("hello@noa-dubai.com", "hello@noa-dubai.com"), href: "mailto:hello@noa-dubai.com" },
        { label: t("Hours", "ساعات العمل"), value: t("Daily\n9:30 AM — 9:30 PM", "يومياً\n9:30 صباحاً — 9:30 مساءً") },
      ] },
      { id: "form", type: "contactForm", heading: t("Send a Message", "أرسل رسالة"), sub: t("Fill in the form below and we will route your message to the right person on our team.", "املأ النموذج أدناه وسنوجه رسالتك إلى الشخص المناسب في فريقنا."),
        reasons: [t("Reservation enquiry", "استفسار حجز"), t("Private event", "فعالية خاصة"), t("Group booking (12+)", "حجز مجموعة (+12)"), t("Partnership", "شراكة"), t("Press", "الصحافة"), t("Careers", "الوظائف"), t("Other", "أخرى")],
        countries: [t("United Arab Emirates", "الإمارات العربية المتحدة"), t("United Kingdom", "المملكة المتحدة"), t("United States", "الولايات المتحدة"), t("Saudi Arabia", "المملكة العربية السعودية"), t("India", "الهند"), t("Germany", "ألمانيا"), t("France", "فرنسا"), t("Other", "أخرى")],
      },
      { id: "cta", type: "cta", pre: t("Or Reserve Directly", "أو احجز مباشرة"), heading: t("Skip the Form,\nPick a Seat", "تجاوز النموذج،\nواختر مقعداً"), body: t("If you're ready to book a session today, the fastest way is the packages page. The form above is for everything else.", "إن كنت مستعداً لحجز جلسة اليوم، فأسرع طريقة هي صفحة الباقات. النموذج أعلاه لكل ما عدا ذلك."), primary: { label: t("See Packages", "اطّلع على الباقات"), href: P("morning-package") }, secondary: { label: t("See Events", "اطّلع على الفعاليات"), href: P("events") } },
    ],
  },

  /* ------------------------------------------------------------- BOOKING */
  {
    id: "booking",
    slug: "booking",
    title: t("Book — NOA", "احجز — نوا"),
    metaDescription: t("Choose your day, pick a seat on the yacht map and reserve your place at NOA.", "اختر يومك، وحدد مقعدك على خريطة اليخت، واحجز مكانك في نوا."),
    navLabel: t("Book Now", "احجز الآن"),
    voiceAliases: [t("book", "احجز"), t("booking", "الحجز"), t("reserve a seat", "حجز مقعد"), t("seat map", "خريطة المقاعد")],
    sections: [],
  },

  /* ------------------------------------------------- LEGAL (content pending) */
  ...(["privacy", "terms", "cookies"] as const).map((id): Page => {
    const titles = {
      privacy: t("Privacy Policy", "سياسة الخصوصية"),
      terms: t("Terms & Conditions", "الشروط والأحكام"),
      cookies: t("Cookie Policy", "سياسة ملفات تعريف الارتباط"),
    };
    return {
      id,
      slug: id,
      title: t(`${titles[id].en} — NOA`, `${titles[id].ar} — نوا`),
      metaDescription: titles[id],
      voiceAliases: [titles[id]],
      sections: [
        {
          id: "body",
          type: "text",
          heading: titles[id],
          isPlaceholder: true,
          paragraphs: [t("This page is reserved for NOA's legal text, to be supplied before launch.", "هذه الصفحة مخصصة للنص القانوني لنوا، ويُزوَّد قبل الإطلاق.")],
        },
      ],
    };
  }),
];

export const nav: Registry["nav"] = {
  main: ["morning-package", "events", "about", "location", "faq"],
  mobile: ["morning-package", "afternoon-package", "cabana", "events", "about", "location", "faq", "contact"],
  footer: [
    {
      heading: t("Experience", "التجربة"),
      links: [
        { label: t("Beach Club", "النادي الشاطئي"), href: P("home") },
        { label: t("Morning Package", "باقة الصباح"), href: P("morning-package") },
        { label: t("Afternoon Package", "باقة بعد الظهر"), href: P("afternoon-package") },
        { label: t("Private Cabanas", "الكابانات الخاصة"), href: P("cabana") },
        { label: t("Events", "الفعاليات"), href: P("events") },
      ],
    },
    {
      heading: t("Information", "معلومات"),
      links: [
        { label: t("About NOA", "عن نوا"), href: P("about") },
        { label: t("How to Arrive", "كيفية الوصول"), href: P("location") },
        { label: t("Dress Code", "قواعد اللباس"), href: P("faq") },
        { label: t("FAQ", "الأسئلة الشائعة"), href: P("faq") },
        { label: t("Press", "الصحافة"), href: P("contact") },
      ],
    },
    {
      heading: t("Contact", "تواصل"),
      links: [
        { label: t("Reservations", "الحجوزات"), href: P("booking") },
        { label: t("Private Events", "الفعاليات الخاصة"), href: P("contact") },
        { label: t("Group Bookings", "حجوزات المجموعات"), href: P("contact") },
        { label: t("Partnerships", "الشراكات"), href: P("contact") },
        { label: t("Careers", "الوظائف"), href: P("contact") },
      ],
    },
  ],
};
