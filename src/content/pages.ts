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
    title: t("NOA · Dubai's First Floating Beach Club", "نوا — أول نادٍ شاطئي عائم في دبي"),
    metaDescription: t(
      "NOA is Dubai's first floating beach club, anchored off Dubai Marina. Slow mornings on the water, long afternoons in the sun and nights on the Gulf with residents and guest DJs. Opening 2026.",
      "نوا هو أول نادٍ شاطئي عائم في دبي، راسٍ قبالة مرسى دبي. صباحات هادئة على الماء، وفترات ما بعد الظهر الطويلة تحت الشمس، وليالٍ على الخليج مع المقيمين والدي جيه الضيوف. يفتتح في 2026."
    ),
    navLabel: t("Beach Club", "النادي الشاطئي"),
    voiceAliases: [t("home", "الرئيسية"), t("start", "البداية"), t("main page", "الصفحة الرئيسية")],
    sections: [
      { id: "hero", type: "hero", media: "hero-video", quiet: true },
      {
        id: "intro", type: "editorialIntro",
        eyebrow: t("Dubai's first floating club", "أول نادٍ عائم في دبي"),
        heading: t("The day is slow. The night is not.", "النهار هادئ. أما الليل فلا."),
        paragraphs: [
          t("NOA is a floating beach club anchored two kilometres off Dubai Marina. Mornings are for the water: breakfast on the bow and the infinity pool before the heat. Afternoons bring the DJ, lunch and the longest sunset in Dubai.", "نوا نادٍ شاطئي عائم راسٍ على بُعد كيلومترين من مرسى دبي. الصباح للماء: فطور على مقدمة السفينة ومسبح لا متناهٍ قبل الحر. وبعد الظهر يأتي الدي جيه والغداء وأطول غروب في دبي."),
          t("After dark the deck becomes a club on the open Gulf, with a stage, a dance floor and the skyline across the water, until two in the morning. Residents on Thursdays and Fridays, guest DJs on Saturdays.", "بعد الغروب يتحول السطح إلى نادٍ في عرض الخليج، بمنصة وحلبة رقص وأفق المدينة عبر الماء، حتى الثانية فجراً. المقيمون أيام الخميس والجمعة، والدي جيه الضيوف أيام السبت."),
        ],
        facts: [
          { label: t("Sessions", "الجلسات"), lines: [t("Morning 9:30 AM to 2 PM", "الصباح 9:30 صباحاً إلى 2 ظهراً"), t("Afternoon 2 PM to 9:30 PM", "بعد الظهر 2 إلى 9:30 مساءً"), t("Night 9:30 PM to 2 AM", "الليل 9:30 مساءً إلى 2 فجراً")] },
          { label: t("Departure", "الانطلاق"), lines: [t("Dubai Marina Pier, Berth 7", "رصيف مرسى دبي، المرسى 7"), t("Shuttle boat every 30 minutes, 11 minutes across", "قارب مكوكي كل 30 دقيقة، 11 دقيقة للعبور")] },
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
        heading: t("The Kitchen and the Sushi Bar", "المطبخ وبار السوشي"),
        sub: t("Breakfast, lunch and dinner on the main deck. Omakase at the upper deck sushi bar from 7 PM.", "فطور وغداء وعشاء على السطح الرئيسي. أوماكاسي في بار السوشي على السطح العلوي من 7 مساءً."),
        media: ["food-3", "food-2", "food-1", "food-4"],
        link: { label: t("Food menu", "قائمة الطعام"), href: P("about", "restaurant") },
      },
      {
        id: "bar", type: "textPortrait",
        heading: t("Two Bars, One Horizon", "باران وأفق واحد"),
        sub: t("Main deck and upper deck", "السطح الرئيسي والسطح العلوي"),
        paragraphs: [t("The main bar faces the stage, with a service station on each side so a drink is never far from your seat. The upper bar faces the sea and doubles as the sushi counter. Both pour until two.", "البار الرئيسي يواجه المنصة، ومحطة خدمة على كل جانب فلا يبعد المشروب عن مقعدك. البار العلوي يواجه البحر ويعمل أيضاً كطاولة سوشي. كلاهما يقدّم حتى الثانية.")],
        media: "bar-1",
        link: { label: t("Our cocktails", "كوكتيلاتنا"), href: P("about", "restaurant") },
      },
      { id: "events", type: "posterCarousel", heading: t("This Week on the Water", "هذا الأسبوع على الماء"), sub: t("Residents, guest DJs and themed nights", "مقيمون ودي جيه ضيوف وليالٍ بطابع خاص"), source: "upcoming", aspect: "2/3", href: P("events"), fallbackMedia: ["party-1", "party-2", "party-4"] },
      { id: "past", type: "posterCarousel", heading: t("Nights We Remember", "ليالٍ نتذكرها"), source: "highlights", aspect: "1/1", href: P("events"), fallbackMedia: ["party-3", "deck-dj-1", "party-1", "party-2"] },
      { id: "newsletter", type: "newsletter", kicker: t("Newsletter", "النشرة"), heading: t("Join the crew", "انضم إلى الطاقم"), body: t("First on the list for event tickets, new residents, private nights and the opening date.", "أول من يعرف عن تذاكر الفعاليات والمقيمين الجدد والليالي الخاصة وموعد الافتتاح.") },
    ],
  },

  /* ------------------------------------------------------------ MORNING */
  {
    id: "morning-package",
    slug: "morning-package",
    title: t("The Morning · NOA", "الصباح · نوا"),
    inNav: true,
    navLabel: t("Packages", "الباقات"),
    menuLabel: t("The Morning", "الصباح"),
    metaDescription: t("The morning at NOA, 9:30 AM to 2 PM: breakfast on the bow, the pool before the heat, loungers and daybeds on the edge of the water, and a treatment room for the slow hours.", "الصباح في نوا، 9:30 صباحاً إلى 2 ظهراً: فطور على مقدمة السفينة، ومسبح قبل الحر، وأسرّة شمسية على حافة الماء، وغرفة علاج للساعات الهادئة."),
    voiceAliases: [t("morning package", "باقة الصباح"), t("morning session", "جلسة الصباح"), t("breakfast", "الفطور")],
    sections: [
      { id: "subhero", type: "subhero", media: "pkg-morning", kicker: t("01 · The Water", "01 · الماء"), heading: t("The *Morning*", "*الصباح*"), sub: t("9:30 AM to 2 PM. Breakfast on the bow, the pool before the heat, a daybed on the edge of the water.", "9:30 صباحاً إلى 2 ظهراً. فطور على مقدمة السفينة، ومسبح قبل الحر، وسرير نهاري على حافة الماء.") },
      { id: "session", type: "prose", kicker: t("· The Session", "· الجلسة"), heading: t("Before the\nCity Wakes", "قبل أن\nتستيقظ المدينة"), paragraphs: [
        t("The first boat leaves Berth 7 at nine and NOA opens at half past. The pool is still, the kitchen is serving breakfast on the bow and the DJ plays low. Ten loungers sit at the water line on the bow deck, the first to catch the sun. Fourteen daybeds sit on the lip of the pool itself, so you lie with your feet in the water and your coffee on the deck.", "ينطلق أول قارب من المرسى 7 في التاسعة وتفتح نوا في التاسعة والنصف. المسبح ساكن، والمطبخ يقدم الفطور على مقدمة السفينة، والدي جيه يعزف بهدوء. عشرة أسرّة شمسية على خط الماء عند مقدمة السفينة، أول ما تلمسه الشمس. وأربعة عشر سريراً نهارياً على حافة المسبح نفسه، فتستلقي وقدماك في الماء وقهوتك على السطح."),
        t("This is the session for a long swim, a late breakfast and a book. The treatment room is quietest now: a manicure, a pedicure or a massage, booked with your seat or at reception when you arrive.", "هذه جلسة السباحة الطويلة والفطور المتأخر والكتاب. غرفة العلاج أهدأ ما تكون الآن: مانيكير أو باديكير أو مساج، تحجزه مع مقعدك أو في الاستقبال عند وصولك."),
      ] },
      { id: "pool", type: "splitProse", media: "deck-pool-1", num: t("· 01", "· 01"), heading: t("On the Edge\nof the Water", "على حافة\nالماء"), paragraphs: [
        t("The pool runs in two parts: a wide bay at the bow and a channel that reaches aft along the deck. The daybeds are set on its edge. The cabanas along the pool have two sofas, a low table, curtains you can draw and planters behind.", "يمتد المسبح في جزأين: خليج واسع عند المقدمة وقناة تصل إلى مؤخرة السطح. الأسرّة النهارية على حافته. وكبائن المسبح فيها أريكتان وطاولة منخفضة وستائر تُسدل وأحواض نباتات خلفها."),
      ] },
      { id: "breakfast", type: "splitProse", media: "food-1", num: t("· 02", "· 02"), heading: t("Breakfast\non the Bow", "الفطور على\nمقدمة السفينة"), paragraphs: [
        t("Eggs, pastries, fruit, cold pressed juice and proper coffee, served on the bow until noon. The kitchen moves to lunch from twelve.", "بيض ومعجنات وفاكهة وعصير معصور على البارد وقهوة حقيقية، تُقدَّم على المقدمة حتى الظهر. ينتقل المطبخ إلى الغداء من الثانية عشرة."),
      ], flip: true },
      { id: "included", type: "included", heading: t("What's Included", "ما الذي يشمله"), sub: t("Every morning reservation includes the following.", "كل حجز صباحي يشمل ما يلي."), rows: [
        { label: t("Shuttle", "القارب المكوكي"), value: t("Both ways from Marina Pier", "ذهاباً وإياباً من رصيف المرسى") },
        { label: t("Welcome Drink", "مشروب ترحيبي"), value: t("On arrival", "عند الوصول") },
        { label: t("Pool", "المسبح"), value: t("All session, towel included", "طوال الجلسة، مع منشفة") },
        { label: t("Food and Drink Credit", "رصيد الطعام والشراب"), value: t("On your wristband, all venues", "على سوارك، في كل المرافق") },
        { label: t("Treatments", "العلاجات"), value: t("Bookable, charged to the wristband", "تُحجز وتُحتسب على السوار") },
      ] },
      { id: "tariff", type: "tariff", heading: t("Choose Your Seat", "اختر مقعدك"), sub: t("Four ways to spend the morning at NOA.", "أربع طرق لقضاء الصباح في نوا."), cards: [
        { name: t("General Entry", "دخول عام"), price: "450", desc: t("Pool and deck access, restaurant seating on availability. Walk the deck, find your spot, no reserved seat.", "دخول المسبح والسطح، وجلوس في المطعم حسب التوفر. تجوّل على السطح واختر مكانك، دون مقعد محجوز."), cap: t("Per person", "للشخص") },
        { name: t("Sun Lounger", "سرير شمسي"), price: "600", desc: t("One of ten on the bow deck at the water line.", "واحد من عشرة على سطح المقدمة عند خط الماء."), cap: t("Per lounger · 1 guest", "للسرير · ضيف واحد") },
        { name: t("Pool Daybed", "سرير نهاري"), price: "900", desc: t("On the lip of the pool. Feet in the water.", "على حافة المسبح. قدماك في الماء."), cap: t("Per daybed · 2 guests", "للسرير · ضيفان") },
        { name: t("Pool Cabana", "كابينة المسبح"), price: "2,800", desc: t("Two sofas, a low table, curtains and a host.", "أريكتان وطاولة منخفضة وستائر ومضيف."), cap: t("Per cabana · 6 guests", "للكابينة · 6 ضيوف") },
      ], note: { before: t("Prices in AED before 5% VAT.", "الأسعار بالدرهم قبل ضريبة القيمة المضافة 5%."), linkLabel: t("See the cabanas", "اطّلع على الكبائن"), after: t(" for a seat with a host.", " لمقعد مع مضيف."), href: P("cabana") } },
      { id: "faq", type: "faq", heading: goodToKnow, faqIds: ["m-arrive", "treatments", "stay-night", "m-dress"], openFirst: true, more: faqMore },
      { id: "cta", type: "cta", pre: t("The Morning · 9:30 AM to 2 PM", "الصباح · 9:30 صباحاً إلى 2 ظهراً"), heading: t("Reserve the\nMorning", "احجز\nالصباح"), body: t("Still water, soft sun, the city at a distance. Pick your seat and we will see you on the pier.", "ماء ساكن وشمس ناعمة والمدينة بعيدة. اختر مقعدك ونراك على الرصيف."), primary: { label: t("Reserve a Seat", "احجز مقعداً"), href: P("booking") }, secondary: { label: t("See the Afternoon", "اطّلع على بعد الظهر"), href: P("afternoon-package") } },
    ],
  },
  {
    id: "afternoon-package",
    slug: "afternoon-package",
    title: t("The Afternoon · NOA", "بعد الظهر · نوا"),
    menuLabel: t("The Afternoon", "بعد الظهر"),
    metaDescription: t("The afternoon at NOA, 2 PM to 9:30 PM: the DJ comes on, the pool fills, lunch runs into dinner and the sun sets twice, once behind the skyline and once on the water.", "بعد الظهر في نوا، 2 ظهراً إلى 9:30 مساءً: يبدأ الدي جيه، ويمتلئ المسبح، ويمتد الغداء إلى العشاء، وتغرب الشمس مرتين، مرة خلف الأفق ومرة على الماء."),
    voiceAliases: [t("afternoon package", "باقة بعد الظهر"), t("afternoon session", "جلسة بعد الظهر"), t("sunset", "الغروب")],
    sections: [
      { id: "subhero", type: "subhero", media: "pkg-afternoon", kicker: t("02 · The Sun", "02 · الشمس"), heading: t("The *Afternoon*", "*بعد الظهر*"), sub: t("2 PM to 9:30 PM. The DJ comes on, the pool fills, lunch runs into sunset.", "2 ظهراً إلى 9:30 مساءً. يبدأ الدي جيه، ويمتلئ المسبح، ويمتد الغداء إلى الغروب.") },
      { id: "session", type: "prose", kicker: t("· The Session", "· الجلسة"), heading: t("The Pool, the\nSound, the Sun", "المسبح،\nالصوت، الشمس"), paragraphs: [
        t("The DJ booth comes on at two and the pool fills. The kitchen moves to lunch, then to dinner as the sky behind the Burj Al Arab goes pink. Lounge cabanas face the stage, high tables stand around the floor, and the bar has a service station on each side.", "تبدأ كابينة الدي جيه في الثانية ويمتلئ المسبح. ينتقل المطبخ إلى الغداء ثم إلى العشاء حين تتورّد السماء خلف برج العرب. كبائن الصالة تواجه المنصة، والطاولات العالية حول الحلبة، وللبار محطة خدمة على كل جانب."),
        t("By nine the lights come up on the stage. The deck does not go dark. It changes shift. Ask your host before half past eight and you can keep your seat into the night.", "بحلول التاسعة تضاء المنصة. لا يظلم السطح، بل يبدّل نوبته. اطلب من مضيفك قبل الثامنة والنصف ويمكنك الاحتفاظ بمقعدك حتى الليل."),
      ] },
      { id: "sunset", type: "splitProse", media: "terrace-1", num: t("· 01", "· 01"), heading: t("Dubai's\nLongest Sunset", "أطول غروب\nفي دبي"), paragraphs: [
        t("From two kilometres out the sun sets twice: once behind the skyline, once on the water. The upper deck has the better view. The alfresco lounge along the rail is open to the sea on three sides.", "من على بُعد كيلومترين تغرب الشمس مرتين: مرة خلف الأفق ومرة على الماء. للسطح العلوي الإطلالة الأفضل. صالة الهواء الطلق على طول السياج مفتوحة على البحر من ثلاث جهات."),
      ] },
      { id: "dinner", type: "splitProse", media: "food-3", num: t("· 02", "· 02"), heading: t("Dinner on\nTwo Decks", "عشاء على\nسطحين"), paragraphs: [
        t("Dinner on the main deck until eleven. The sushi bar on the upper deck opens at seven: omakase sent up from the kitchen and finished in front of you.", "العشاء على السطح الرئيسي حتى الحادية عشرة. يفتح بار السوشي على السطح العلوي في السابعة: أوماكاسي يُرسل من المطبخ ويُتمَّم أمامك."),
      ], flip: true },
      { id: "included", type: "included", heading: t("What's Included", "ما الذي يشمله"), sub: t("Every afternoon reservation includes the following.", "كل حجز لجلسة بعد الظهر يشمل ما يلي."), rows: [
        { label: t("Shuttle", "القارب المكوكي"), value: t("Both ways from Marina Pier", "ذهاباً وإياباً من رصيف المرسى") },
        { label: t("Welcome Drink", "مشروب ترحيبي"), value: t("On arrival", "عند الوصول") },
        { label: t("Pool", "المسبح"), value: t("Until dusk, towel included", "حتى الغسق، مع منشفة") },
        { label: t("Food and Drink Credit", "رصيد الطعام والشراب"), value: t("On your wristband, all venues", "على سوارك، في كل المرافق") },
        { label: t("Age", "العمر"), value: t("Over 18 from 2 PM", "فوق 18 من الثانية ظهراً") },
      ] },
      { id: "tariff", type: "tariff", heading: t("Choose Your Seat", "اختر مقعدك"), sub: t("Five ways to spend the afternoon at NOA.", "خمس طرق لقضاء بعد الظهر في نوا."), cards: [
        { name: t("General Entry", "دخول عام"), price: "900", desc: t("Pool and deck access, restaurant seating on availability.", "دخول المسبح والسطح، وجلوس في المطعم حسب التوفر."), cap: t("Per person", "للشخص") },
        { name: t("Pool Daybed", "سرير نهاري"), price: "1,500", desc: t("On the lip of the pool, with the DJ in earshot.", "على حافة المسبح، والدي جيه على مسمع."), cap: t("Per daybed · 2 guests", "للسرير · ضيفان") },
        { name: t("High Table", "طاولة عالية"), price: "1,200", desc: t("Standing table beside the floor for four.", "طاولة وقوف بجانب الحلبة لأربعة."), cap: t("Per table · 4 guests", "للطاولة · 4 ضيوف") },
        { name: t("Pool Cabana", "كابينة المسبح"), price: "3,500", desc: t("Two sofas, a low table, curtains and a host.", "أريكتان وطاولة منخفضة وستائر ومضيف."), cap: t("Per cabana · 6 guests", "للكابينة · 6 ضيوف") },
        { name: t("Lounge Cabana", "كابينة الصالة"), price: "4,500", desc: t("Scalloped sofa facing the stage, a round table, poufs.", "أريكة متموجة تواجه المنصة وطاولة مستديرة ومقاعد."), cap: t("Per cabana · 8 guests", "للكابينة · 8 ضيوف") },
      ], note: { before: t("Prices in AED before 5% VAT.", "الأسعار بالدرهم قبل ضريبة القيمة المضافة 5%."), linkLabel: t("See the cabanas", "اطّلع على الكبائن"), after: t(" for a seat with a host.", " لمقعد مع مضيف."), href: P("cabana") } },
      { id: "faq", type: "faq", heading: goodToKnow, faqIds: ["a-arrive", "a-18", "stay-night", "sushi-hours"], openFirst: true, more: faqMore },
      { id: "cta", type: "cta", pre: t("The Afternoon · 2 PM to 9:30 PM", "بعد الظهر · 2 ظهراً إلى 9:30 مساءً"), heading: t("Reserve the\nAfternoon", "احجز\nبعد الظهر"), body: t("The pool, the DJ and the longest sunset in Dubai. Pick your seat and we will see you on the pier.", "المسبح والدي جيه وأطول غروب في دبي. اختر مقعدك ونراك على الرصيف."), primary: { label: t("Reserve a Seat", "احجز مقعداً"), href: P("booking") }, secondary: { label: t("See the Night", "اطّلع على الليل"), href: P("night-package") } },
    ],
  },
  {
    id: "night-package",
    slug: "night-package",
    title: t("The Night · NOA", "الليل · نوا"),
    menuLabel: t("The Night", "الليل"),
    metaDescription: t("The night at NOA, 9:30 PM to 2 AM: residents and guest DJs on the stage, fifteen metres of dance floor under the roof, lounge cabanas, the booth above the floor and the sushi bar on the upper deck.", "الليل في نوا، 9:30 مساءً إلى 2 فجراً: المقيمون والدي جيه الضيوف على المنصة، وخمسة عشر متراً من حلبة الرقص تحت السقف، وكبائن الصالة، والمقصورة فوق الحلبة، وبار السوشي على السطح العلوي."),
    voiceAliases: [t("night package", "باقة الليل"), t("night session", "جلسة الليل"), t("party", "الحفلة"), t("dance floor", "حلبة الرقص")],
    sections: [
      { id: "subhero", type: "subhero", media: "pkg-night", kicker: t("03 · The Floor", "03 · الحلبة"), heading: t("The *Night*", "*الليل*"), sub: t("9:30 PM to 2 AM. The stage, the floor, the lounge cabanas and the skyline across the water.", "9:30 مساءً إلى 2 فجراً. المنصة والحلبة وكبائن الصالة وأفق المدينة عبر الماء.") },
      { id: "session", type: "prose", kicker: t("· The Session", "· الجلسة"), heading: t("Why NOA\nFloats", "لماذا\nتطفو نوا"), paragraphs: [
        t("The night is the reason the club is on the water. At half past nine the residents take the stage, the lounge cabanas light low and the floor opens under the roof, fifteen metres of it, open to the sea on both sides. The main bar faces the stage. The pool closes at dusk and the daybeds around it become seating.", "الليل هو سبب وجود النادي على الماء. في التاسعة والنصف يعتلي المقيمون المنصة، وتُضاء كبائن الصالة بخفوت، وتُفتح الحلبة تحت السقف، خمسة عشر متراً مفتوحة على البحر من الجانبين. البار الرئيسي يواجه المنصة. يُغلق المسبح عند الغسق وتتحول الأسرّة النهارية حوله إلى جلسات."),
        t("The upper deck is the quieter one. Eight cabanas look down on the floor through the opening in the roof, the alfresco lounge runs along the rail, the sushi bar serves until one, and the booth sits above the stage with its own balustrade.", "السطح العلوي أهدأ. ثماني كبائن تطل على الحلبة عبر فتحة السقف، وصالة الهواء الطلق تمتد على طول السياج، وبار السوشي يقدم حتى الواحدة، والمقصورة فوق المنصة بسياجها الخاص."),
      ] },
      { id: "programme", type: "splitProse", media: "deck-dj-1", num: t("· 01", "· 01"), heading: t("The\nProgramme", "البرنامج"), paragraphs: [
        t("Residents on Thursday and Friday, guest DJs on Saturday, themed nights through the month. Tickets for guest nights go on sale two weeks ahead and members see them first. Sunday to Wednesday the deck can be hired as a whole.", "المقيمون الخميس والجمعة، والدي جيه الضيوف السبت، وليالٍ بطابع خاص على مدار الشهر. تُطرح تذاكر ليالي الضيوف قبل أسبوعين ويراها الأعضاء أولاً. من الأحد إلى الأربعاء يمكن استئجار السطح بأكمله."),
      ] },
      { id: "seats", type: "splitProse", media: "party-2", num: t("· 02", "· 02"), heading: t("Seats\nat Night", "المقاعد\nليلاً"), paragraphs: [
        t("General entry is sold per person. Lounge cabanas, high tables, the alfresco lounge, the upper cabanas and the booth are booked on the deck plan and include entry for everyone at the seat. The salon and tattoo station are open until midnight on Thursday, Friday and Saturday.", "يُباع الدخول العام للشخص. تُحجز كبائن الصالة والطاولات العالية وصالة الهواء الطلق والكبائن العلوية والمقصورة على مخطط السطح وتشمل الدخول لكل من في المقعد. الصالون ومحطة الوشم مفتوحان حتى منتصف الليل أيام الخميس والجمعة والسبت."),
      ], flip: true },
      { id: "included", type: "included", heading: t("What's Included", "ما الذي يشمله"), sub: t("Every night reservation includes the following.", "كل حجز ليلي يشمل ما يلي."), rows: [
        { label: t("Shuttle", "القارب المكوكي"), value: t("Both ways, last boat back 2:30 AM", "ذهاباً وإياباً، آخر قارب للعودة 2:30 فجراً") },
        { label: t("Welcome Drink", "مشروب ترحيبي"), value: t("On arrival", "عند الوصول") },
        { label: t("Food and Drink Credit", "رصيد الطعام والشراب"), value: t("On your wristband, both bars and the sushi bar", "على سوارك، في البارين وبار السوشي") },
        { label: t("Age", "العمر"), value: t("Over 21", "فوق 21") },
        { label: t("Pool", "المسبح"), value: t("Closed after dusk", "مغلق بعد الغسق") },
      ] },
      { id: "tariff", type: "tariff", heading: t("Choose Your Seat", "اختر مقعدك"), sub: t("Five ways to spend the night at NOA.", "خمس طرق لقضاء الليل في نوا."), cards: [
        { name: t("General Entry", "دخول عام"), price: "900", desc: t("Entry, the floor, both bars. No reserved seat.", "الدخول والحلبة والباران. دون مقعد محجوز."), cap: t("Per person", "للشخص") },
        { name: t("High Table", "طاولة عالية"), price: "1,200", desc: t("Standing table beside the floor.", "طاولة وقوف بجانب الحلبة."), cap: t("Per table · 4 guests", "للطاولة · 4 ضيوف") },
        { name: t("Alfresco Lounge", "صالة الهواء الطلق"), price: "3,500", desc: t("Sofa, low table and poufs on the upper deck rail.", "أريكة وطاولة منخفضة ومقاعد على سياج السطح العلوي."), cap: t("Per lounge · 6 guests", "للصالة · 6 ضيوف") },
        { name: t("Lounge Cabana", "كابينة الصالة"), price: "4,500", desc: t("Scalloped sofa facing the stage, a round table, poufs.", "أريكة متموجة تواجه المنصة وطاولة مستديرة ومقاعد."), cap: t("Per cabana · 8 guests", "للكابينة · 8 ضيوف") },
        { name: t("The Booth", "المقصورة"), price: "12,000", desc: t("Above the stage, with its own balustrade over the floor. Members first until 24 hours before.", "فوق المنصة بسياجها الخاص على الحلبة. الأعضاء أولاً حتى 24 ساعة قبل الموعد."), cap: t("Per night · 10 guests", "لليلة · 10 ضيوف") },
      ], note: { before: t("Prices in AED before 5% VAT. Guest DJ nights may carry an event price.", "الأسعار بالدرهم قبل ضريبة القيمة المضافة 5%. قد تحمل ليالي الدي جيه الضيوف سعر فعالية."), linkLabel: t("See the programme", "اطّلع على البرنامج"), after: t(" for this month's nights.", " لليالي هذا الشهر."), href: P("events") } },
      { id: "faq", type: "faq", heading: goodToKnow, faqIds: ["night-ticket", "last-shuttle", "pool-night", "dress-code"], openFirst: true, more: faqMore },
      { id: "cta", type: "cta", pre: t("The Night · 9:30 PM to 2 AM", "الليل · 9:30 مساءً إلى 2 فجراً"), heading: t("Reserve the\nNight", "احجز\nالليل"), body: t("The stage, the floor and the skyline across the water. Pick your seat, or pick a night from the programme.", "المنصة والحلبة وأفق المدينة عبر الماء. اختر مقعدك، أو اختر ليلة من البرنامج."), primary: { label: t("Reserve a Seat", "احجز مقعداً"), href: P("booking") }, secondary: { label: t("This Week's Events", "فعاليات هذا الأسبوع"), href: P("events") } },
    ],
  },
  {
    id: "cabana",
    slug: "cabana",
    title: t("The Cabanas · NOA", "الكبائن · نوا"),
    menuLabel: t("The Cabanas", "الكبائن"),
    metaDescription: t("Twenty cabanas on two decks at NOA: pool cabanas by the water, lounge cabanas facing the stage, upper cabanas above the floor. Two sofas, a low table, curtains and a host. Booked by the session.", "عشرون كابينة على سطحين في نوا: كبائن المسبح عند الماء، وكبائن الصالة تواجه المنصة، والكبائن العلوية فوق الحلبة. أريكتان وطاولة منخفضة وستائر ومضيف. تُحجز بالجلسة."),
    voiceAliases: [t("private cabana", "كابينة خاصة"), t("cabana", "كابينة"), t("lounge cabana", "كابينة الصالة")],
    sections: [
      { id: "subhero", type: "subhero", media: "pkg-cabana", kicker: t("04 · Yours by the Session", "04 · لك طوال الجلسة"), heading: t("The *Cabanas*", "*الكبائن*"), sub: t("Pool cabanas by the water. Lounge cabanas facing the stage. Upper cabanas above the floor.", "كبائن المسبح عند الماء. كبائن الصالة تواجه المنصة. الكبائن العلوية فوق الحلبة.") },
      { id: "session", type: "prose", kicker: t("· The Reservation", "· الحجز"), heading: t("Your Own Corner\nof the Deck", "ركنك الخاص\nعلى السطح"), paragraphs: [
        t("Eight pool cabanas line the infinity pool on the main deck. Four lounge cabanas face the stage, with scalloped sofas, round tables and poufs. Eight more sit on the upper deck and look down on the floor through the opening in the roof. Each has two sofas, a low table, curtains you can draw and planters behind.", "ثماني كبائن مسبح على حافة المسبح اللامتناهي على السطح الرئيسي. أربع كبائن صالة تواجه المنصة بأرائك متموجة وطاولات مستديرة ومقاعد. وثمانٍ أخرى على السطح العلوي تطل على الحلبة عبر فتحة السقف. في كل منها أريكتان وطاولة منخفضة وستائر تُسدل وأحواض نباتات خلفها."),
        t("A host is assigned to your cabana on arrival and stays with you for the session. They take every order, run your treatment bookings and the salon, and sort the shuttle back. Cabanas are booked by the session, morning, afternoon or night, and can be held across two.", "يُعيَّن مضيف لكابينتك عند الوصول ويبقى معك طوال الجلسة. يتولى كل الطلبات وحجوزات العلاج والصالون ويرتب قارب العودة. تُحجز الكبائن بالجلسة، صباحاً أو بعد الظهر أو ليلاً، ويمكن حجزها لجلستين متتاليتين."),
      ] },
      { id: "inside", type: "splitProse", media: "cabana-a", num: t("· 01", "· 01"), heading: t("Inside the\nCabana", "داخل\nالكابينة"), paragraphs: [
        t("Two three seat sofas, a low table between them, a pouf at the back and two at the front. A planter and a canvas curtain along the rail. A towel for everyone, a cooler, and a call button to your host.", "أريكتان بثلاثة مقاعد، وطاولة منخفضة بينهما، ومقعد في الخلف واثنان في الأمام. حوض نباتات وستارة قماشية على السياج. منشفة لكل ضيف وبرّاد وزر نداء لمضيفك."),
      ] },
      { id: "included", type: "included", heading: t("What's Included", "ما الذي يشمله"), sub: t("Every cabana reservation includes the following.", "كل حجز كابينة يشمل ما يلي."), rows: [
        { label: t("Guests", "الضيوف"), value: t("Up to six, eight in a lounge cabana", "حتى ستة، وثمانية في كابينة الصالة") },
        { label: t("Host", "المضيف"), value: t("Dedicated, for the session", "مخصص طوال الجلسة") },
        { label: t("Shuttle", "القارب المكوكي"), value: t("Both ways for the whole party", "ذهاباً وإياباً لكل المجموعة") },
        { label: t("Food and Drink Credit", "رصيد الطعام والشراب"), value: t("On the host's wristband, all venues", "على سوار المضيف، في كل المرافق") },
        { label: t("Pool", "المسبح"), value: t("Day sessions, towels included", "الجلسات النهارية، مع المناشف") },
      ] },
      { id: "tariff", type: "tariff", heading: t("Three Kinds of Cabana", "ثلاثة أنواع من الكبائن"), sub: t("Prices per session.", "الأسعار لكل جلسة."), cards: [
        { name: t("Pool Cabana", "كابينة المسبح"), price: "3,500", desc: t("By the water on the main deck. Morning 2,800.", "عند الماء على السطح الرئيسي. الصباح 2,800."), cap: t("Afternoon or night · 6 guests", "بعد الظهر أو الليل · 6 ضيوف") },
        { name: t("Lounge Cabana", "كابينة الصالة"), price: "4,500", desc: t("Facing the stage, main deck.", "تواجه المنصة، السطح الرئيسي."), cap: t("Afternoon or night · 8 guests", "بعد الظهر أو الليل · 8 ضيوف") },
        { name: t("Upper Cabana", "الكابينة العلوية"), price: "4,500", desc: t("Above the floor, next to the sushi bar.", "فوق الحلبة، بجانب بار السوشي."), cap: t("Afternoon or night · 6 guests", "بعد الظهر أو الليل · 6 ضيوف") },
      ], note: { before: t("Prices in AED before 5% VAT.", "الأسعار بالدرهم قبل ضريبة القيمة المضافة 5%."), linkLabel: t("See the cabanas", "اطّلع على الكبائن"), after: t(" for a seat with a host.", " لمقعد مع مضيف."), href: P("cabana") } },
      { id: "faq", type: "faq", heading: goodToKnow, faqIds: ["c-size", "stay-night", "treatments"], openFirst: true, more: faqMore },
      { id: "cta", type: "cta", pre: t("The Cabanas", "الكبائن"), heading: t("Reserve a\nCabana", "احجز\nكابينة"), body: t("Pick the deck, pick the session, pick the cabana on the plan. A host will be waiting at the stairs.", "اختر السطح والجلسة والكابينة على المخطط. سيكون المضيف بانتظارك عند الدرج."), primary: { label: t("Reserve a Cabana", "احجز كابينة"), href: P("booking") }, secondary: { label: t("See the Night", "اطّلع على الليل"), href: P("night-package") } },
    ],
  },
  {
    id: "events",
    slug: "events",
    title: t("Events · NOA", "الفعاليات — نوا"),
    metaDescription: t("Residents on Thursday and Friday, guest DJs on Saturday and themed nights through the month, two kilometres off Dubai Marina.", "برنامج شهري من الليالي مع أكثر الدي جيه تميزاً في العالم، على الماء قبالة مرسى دبي."),
    inNav: true,
    navLabel: t("Events", "الفعاليات"),
    voiceAliases: [t("events", "الفعاليات"), t("programme", "البرنامج"), t("nights", "الليالي"), t("DJs", "الدي جيه")],
    sections: [
      { id: "subhero", type: "subhero", media: "evt-1", kicker: t("· On the Water", "— على الماء"), heading: t("The *Events*", "*الفعاليات*"), sub: t("Residents, guest DJs and themed nights on the water. Every night below is bookable: tap one to pick your seat on the deck.", "برنامج شهري من الليالي مع أكثر الدي جيه تميزاً في العالم. التقويم الكامل أدناه.") },
      { id: "programme", type: "eventsProgramme", kicker: t("· The programme", "· البرنامج"), heading: t("This Season *on the Water*", "هذا الموسم *على الماء*"), sub: t("Every published night, with its session and hours. Tap a night to pick your seat on the deck plan.", "كل ليلة منشورة مع جلستها وساعاتها. اضغط على ليلة لاختيار مقعدك على مخطط السطح."), empty: t("The programme is being finalised. Join the list below and we will send the first dates.", "يجري الانتهاء من البرنامج. انضم إلى القائمة أدناه وسنرسل لك أولى المواعيد.") },
      { id: "cta", type: "cta", pre: t("Event Reservations", "حجوزات الفعاليات"), heading: t("Reserve a\nPlace for a Night", "احجز مكاناً\nلليلة"), body: t("Event seats are limited and sell out quickly. Reserve your spot in advance to guarantee entry.", "مقاعد الفعاليات محدودة وتنفد بسرعة. احجز مكانك مسبقاً لضمان الدخول."), primary: { label: t("Enquire About a Night", "استفسر عن ليلة"), href: P("contact") }, secondary: { label: t("See Daily Packages", "اطّلع على الباقات اليومية"), href: P("morning-package") } },
    ],
  },

  /* --------------------------------------------------------------- ABOUT */
  {
    id: "about",
    slug: "about",
    title: t("About · NOA", "عن نوا"),
    metaDescription: t("Why a floating beach club: the idea, the vessel, what is on board and how it was made. NOA is anchored two kilometres off Dubai Marina and opens in 2026.", "لماذا نادٍ شاطئي عائم: الفكرة والسفينة وما على متنها وكيف صُنعت. نوا راسية على بُعد كيلومترين من مرسى دبي وتفتتح في 2026."),
    inNav: true,
    navLabel: t("About", "عن نوا"),
    voiceAliases: [t("about", "عن نوا"), t("the story", "القصة"), t("what is on board", "ما على المتن"), t("who are you", "من أنتم")],
    sections: [
      { id: "subhero", type: "subhero", media: "aerial-1", kicker: t("· The Idea", "· الفكرة"), heading: t("A Club *on the Sea*", "نادٍ *على البحر*"), sub: t("Dubai's first floating beach club. Anchored two kilometres off the Marina. Opening 2026.", "أول نادٍ شاطئي عائم في دبي. راسٍ على بُعد كيلومترين من المرسى. يفتتح في 2026.") },
      { id: "idea", type: "prose", kicker: t("· Why", "· لماذا"), heading: t("Why a\nFloating Club", "لماذا نادٍ\nعائم"), paragraphs: [
        t("Dubai had every kind of beach club on the sand. It did not have one on the water: open Gulf on every side, the skyline at a distance, and a night without neighbours.", "كان في دبي كل أنواع النوادي الشاطئية على الرمل. لم يكن فيها نادٍ على الماء: خليج مفتوح من كل جهة، وأفق المدينة من بعيد، وليل بلا جيران."),
        t("NOA is a 52 metre barge with two guest decks, anchored two kilometres off Dubai Marina. You arrive by shuttle boat, eleven minutes from the pier. The day belongs to the pool. The night belongs to the floor.", "نوا بارجة بطول 52 متراً بسطحين للضيوف، راسية على بُعد كيلومترين من مرسى دبي. تصل بقارب مكوكي، إحدى عشرة دقيقة من الرصيف. النهار للمسبح. والليل للحلبة."),
        t("We open in 2026. The deck is in final fit out, the bars are being staffed and the kitchen is being assembled. The opening programme is on the events page as soon as it is confirmed.", "نفتتح في 2026. السطح في مرحلة التجهيز النهائية، والبارات يجري توظيف طاقمها، والمطبخ يجري تركيبه. برنامج الافتتاح على صفحة الفعاليات فور تأكيده."),
      ] },
      { id: "vessel", type: "specs", heading: t("The Vessel", "السفينة"), sub: t("Numbers from the drawings.", "أرقام من المخططات."), items: [
        { n: "52", small: "m", label: t("Length", "الطول") },
        { n: "15", small: "m", label: t("Beam", "العرض") },
        { n: "24", small: "m", label: t("Infinity Pool", "المسبح اللامتناهي") },
        { n: "2", label: t("Guest Decks", "سطحان للضيوف") },
        { n: "20", label: t("Cabanas", "كابينة") },
        { n: "15", small: "m", label: t("Dance Floor", "حلبة الرقص") },
        { n: "11", small: "min", label: t("From the Pier", "من الرصيف") },
      ] },
      { id: "main-deck", type: "splitProse", media: "deck-pool-2", num: t("· Main Deck", "· السطح الرئيسي"), heading: t("The Water\nand the Floor", "الماء\nوالحلبة"), paragraphs: [
        t("Ten loungers on the bow at the water line. The pool, a bay and a channel, with fourteen daybeds set on its edge and eight cabanas along it. Midships, the treatment room for manicures, pedicures and massage, and the hair salon with its tattoo station. Then the floor: fifteen metres under the roof, open to the sea on both sides, with four lounge cabanas facing the stage, ten high tables and the main bar.", "عشرة أسرّة شمسية على المقدمة عند خط الماء. المسبح، خليج وقناة، وأربعة عشر سريراً نهارياً على حافته وثماني كبائن على طوله. في المنتصف غرفة العلاج للمانيكير والباديكير والمساج، وصالون الشعر بمحطة الوشم. ثم الحلبة: خمسة عشر متراً تحت السقف، مفتوحة على البحر من الجانبين، وأربع كبائن صالة تواجه المنصة وعشر طاولات عالية والبار الرئيسي."),
      ] },
      { id: "upper-deck", type: "splitProse", media: "terrace-2", num: t("· Upper Deck", "· السطح العلوي"), heading: t("Above\nthe Floor", "فوق\nالحلبة"), paragraphs: [
        t("Eight cabanas look down on the floor through the opening in the roof. The booth sits above the stage with its own balustrade. Aft, the sushi bar with its counter, and the alfresco lounge: six sofa groups along the rail, open to the sea on three sides. Stairs both sides, port and starboard.", "ثماني كبائن تطل على الحلبة عبر فتحة السقف. المقصورة فوق المنصة بسياجها الخاص. وفي المؤخرة بار السوشي بطاولته وصالة الهواء الطلق: ست مجموعات أرائك على طول السياج، مفتوحة على البحر من ثلاث جهات. درج على الجانبين."),
      ], flip: true },
      { id: "craft", type: "splitProse", media: "bar-2", num: t("· The Craft", "· الصنعة"), heading: t("Made for\nthe Water", "مصنوعة\nللماء"), paragraphs: [
        t("Teak underfoot, brushed brass at the bar, macramé overhead. Carved timber panels, reed matting and kayu gelam rods on the walls. Mother of pearl in a fish scale pattern, handmade terracotta tiles, Corian in three stones and a cut Venetian mirror in the restrooms. Canvas curtains on the cabanas. Every surface was chosen for salt air and bare feet.", "خشب الساج تحت القدم، ونحاس مصقول عند البار، ومكرمية فوق الرأس. ألواح خشب منحوت وحصير القصب وقضبان خشب الكايو جيلام على الجدران. عرق اللؤلؤ بنقش حراشف السمك، وبلاط طيني يدوي الصنع، وكوريان بثلاثة أحجار، ومرآة بندقية مقطوعة في دورات المياه. ستائر قماشية على الكبائن. كل سطح اختير لهواء الملح والأقدام الحافية."),
      ] },
      { id: "cta", type: "cta", pre: t("Opening 2026", "يفتتح في 2026"), heading: t("See It\nfor Yourself", "شاهدها\nبنفسك"), body: t("Pick a session, pick a seat on the deck plan, and we will see you on the pier.", "اختر جلسة ومقعداً على مخطط السطح ونراك على الرصيف."), primary: { label: t("Reserve a Seat", "احجز مقعداً"), href: P("booking") }, secondary: { label: t("The Programme", "البرنامج"), href: P("events") } },
    ],
  },
  {
    id: "location",
    slug: "location",
    title: t("Location · NOA", "الموقع · نوا"),
    metaDescription: t("How to get to NOA: Dubai Marina Pier, Berth 7. Shuttle boats every 30 minutes from 9:00 AM, eleven minutes across, last boat back at 2:30 AM after the night session.", "كيف تصل إلى نوا: رصيف مرسى دبي، المرسى 7. قوارب مكوكية كل 30 دقيقة من 9:00 صباحاً، إحدى عشرة دقيقة للعبور، وآخر قارب للعودة في 2:30 فجراً بعد جلسة الليل."),
    inNav: true,
    navLabel: t("Location", "الموقع"),
    voiceAliases: [t("location", "الموقع"), t("how to get there", "كيف أصل"), t("directions", "الاتجاهات"), t("shuttle", "القارب المكوكي"), t("pier", "الرصيف"), t("last boat", "آخر قارب")],
    sections: [
      { id: "subhero", type: "subhero", media: "loc-hero", kicker: t("· How to Arrive", "· كيف تصل"), heading: t("Find *NOA*", "اعثر على *نوا*"), sub: t("Dubai Marina Pier, Berth 7. Boats every 30 minutes from 9:00 AM. Last boat back 2:30 AM on night sessions.", "رصيف مرسى دبي، المرسى 7. قوارب كل 30 دقيقة من 9:00 صباحاً. آخر قارب للعودة 2:30 فجراً في جلسات الليل.") },
      { id: "strip", type: "contactStrip", cells: [
        { label: t("Departure", "الانطلاق"), value: t("Dubai Marina Pier\nBerth 7", "رصيف مرسى دبي\nالمرسى 7") },
        { label: t("Hours", "الساعات"), value: t("Daily\n9:30 AM to 2:00 AM", "يومياً\n9:30 صباحاً إلى 2:00 فجراً") },
        { label: t("Phone", "الهاتف"), value: t("+971 4 840 0000", "+971 4 840 0000"), href: "tel:+97148400000" },
        { label: t("Email", "البريد"), value: t("hello@noa-dubai.com", "hello@noa-dubai.com"), href: "mailto:hello@noa-dubai.com" },
      ] },
      { id: "map", type: "map", kicker: t("· On the map", "· على الخريطة"), heading: t("Dubai Marina Pier, *Berth 7*", "رصيف مرسى دبي، *المرسى 7*"), query: "Dubai Marina Yacht Club, Dubai", address: t("Dubai Marina Walk, beside the Marina Yacht Club. Look for the NOA desk at Berth 7.", "ممشى مرسى دبي، بجانب نادي اليخوت. ابحث عن مكتب نوا عند المرسى 7."), note: t("Valet parking at the pier · Metro: DMCC, 12 minutes on foot · Tram: Marina Towers, 6 minutes on foot", "صف السيارات عند الرصيف · المترو: محطة DMCC، 12 دقيقة سيراً · الترام: مارينا تاورز، 6 دقائق سيراً") },
      { id: "crossing", type: "prose", kicker: t("· The Crossing", "· العبور"), heading: t("Eleven Minutes\nfrom the Pier", "إحدى عشرة دقيقة\nمن الرصيف"), paragraphs: [
        t("NOA is anchored two kilometres off the coast, beyond the Marina breakwater. The only way on board is our shuttle boat from Dubai Marina Pier, Berth 7. Boats leave every 30 minutes and the crossing takes eleven minutes. Every reservation includes the boat both ways.", "نوا راسية على بُعد كيلومترين من الساحل، خلف كاسر أمواج المرسى. الطريق الوحيد إلى المتن هو قاربنا المكوكي من رصيف مرسى دبي، المرسى 7. تنطلق القوارب كل 30 دقيقة ويستغرق العبور إحدى عشرة دقيقة. كل حجز يشمل القارب ذهاباً وإياباً."),
        t("The first boat of the day leaves at 9:00 AM. Last boats back: 2:30 PM after the morning session, 10:00 PM after the afternoon and 2:30 AM after the night. Arrive at the pier 20 minutes before your session. Boarding closes 10 minutes before departure.", "ينطلق أول قارب في 9:00 صباحاً. آخر قوارب العودة: 2:30 ظهراً بعد جلسة الصباح، و10:00 مساءً بعد جلسة بعد الظهر، و2:30 فجراً بعد جلسة الليل. اصل إلى الرصيف قبل جلستك بعشرين دقيقة. يُغلق الصعود قبل الانطلاق بعشر دقائق."),
      ] },
      { id: "arrival", type: "splitProse", media: "marina", num: t("· The Arrival", "· الوصول"), heading: t("Check In\non the Pier", "تسجيل الدخول\nعلى الرصيف"), paragraphs: [
        t("Check in is at the pier desk, not on the boat. Your ID is matched to the reservation, the wristband is loaded with your food and drink credit, and you board. On the boat you arrive at one of the four berths at the corners of the deck; reception is at the stern and your host meets you there.", "تسجيل الدخول في مكتب الرصيف وليس على القارب. تُطابَق هويتك مع الحجز، ويُحمَّل سوارك برصيد الطعام والشراب، ثم تصعد. على المتن تصل إلى أحد المراسي الأربعة في زوايا السطح؛ الاستقبال عند المؤخرة ومضيفك بانتظارك هناك."),
        t("The pier has cold towels and a small bar: coffee in the morning, something cold in the afternoon.", "في الرصيف مناشف باردة وبار صغير: قهوة في الصباح، ومشروب بارد بعد الظهر."),
      ] },
      { id: "steps", type: "specs", heading: t("Your Arrival, Step by Step", "وصولك خطوة بخطوة"), sub: t("From the car to the first drink on board.", "من السيارة إلى أول مشروب على المتن."), items: [
        { n: "01", label: t("Marina Pier\nDrop Off", "رصيف المرسى\nنقطة النزول") },
        { n: "02", label: t("Check In\nat the Desk", "تسجيل الدخول\nعند المكتب") },
        { n: "03", label: t("Eleven Minutes\nAcross", "إحدى عشرة\nدقيقة عبوراً") },
        { n: "04", label: t("Your Host at\nReception", "مضيفك في\nالاستقبال") },
      ] },
      { id: "cta", type: "cta", pre: t("NOA · Dubai Marina · Berth 7", "نوا · مرسى دبي · المرسى 7"), heading: t("We'll See You\non the Pier", "نراك\nعلى الرصيف"), body: t("Reservations include the boat both ways. Turn up at Berth 7 with your booking on your phone.", "الحجوزات تشمل القارب ذهاباً وإياباً. احضر إلى المرسى 7 وحجزك على هاتفك."), primary: { label: t("Reserve a Seat", "احجز مقعداً"), href: P("booking") }, secondary: { label: t("More Questions", "مزيد من الأسئلة"), href: P("faq") } },
    ],
  },
  {
    id: "faq",
    slug: "faq",
    title: t("FAQ · NOA", "الأسئلة الشائعة — نوا"),
    metaDescription: t("Everything we get asked the most about booking, arrival, dress code and private events at NOA.", "كل ما يُسأل عنه كثيراً حول الحجز والوصول وقواعد اللباس والفعاليات الخاصة في نوا."),
    inNav: true,
    navLabel: t("FAQ", "الأسئلة الشائعة"),
    voiceAliases: [t("FAQ", "الأسئلة الشائعة"), t("questions", "أسئلة"), t("dress code", "قواعد اللباس"), t("cancellation policy", "سياسة الإلغاء")],
    sections: [
      { id: "subhero", type: "subhero", media: "faq-hero", kicker: t("· Good to Know", "— من المفيد معرفته"), heading: t("Frequently *Asked*", "الأسئلة *الشائعة*"), sub: t("Everything we get asked the most. If something is missing, write to us and we'll add it.", "كل ما يُسأل عنه كثيراً. إن كان شيء ناقصاً، راسلونا وسنضيفه.") },
      { id: "booking", type: "faq", heading: t("Booking and Entry", "الحجز والدخول"), faqIds: ["book-advance", "cancellation", "night-ticket", "stay-night", "min-age", "photography", "vouchers"], openFirst: true },
      { id: "arrival", type: "faq", heading: t("Arrival and Access", "الوصول والدخول"), faqIds: ["get-there", "last-shuttle", "parking", "private-boat", "accessibility", "stairs"], noTopBorder: true },
      { id: "onboard", type: "faq", heading: t("On Board", "على المتن"), faqIds: ["dress-code-rest", "included", "treatments", "sushi-hours", "pool-night", "changing", "weather", "own-food"], noTopBorder: true },
      { id: "private", type: "faq", heading: t("Private Events", "الفعاليات الخاصة"), faqIds: ["private-hire", "min-spend"], noTopBorder: true, more: { label: t("Still Have a Question? Write to Us", "ما زال لديك سؤال؟ راسلنا"), href: P("contact") } },
      { id: "cta", type: "cta", pre: t("Anything Else?", "هل من شيء آخر؟"), heading: t("Just\nAsk Us", "فقط\nاسألنا"), body: t("If something here didn't answer your question, write to the team directly. We reply within one business day.", "إن لم يجب شيء هنا عن سؤالك، راسل الفريق مباشرة. نرد خلال يوم عمل واحد."), primary: { label: t("Write to Us", "راسلنا"), href: P("contact") }, secondary: { label: t("Reserve a Seat", "احجز مقعداً"), href: P("morning-package") } },
    ],
  },

  /* ------------------------------------------------------------- CONTACT */
  {
    id: "contact",
    slug: "contact",
    title: t("Contact · NOA", "تواصل معنا — نوا"),
    menuLabel: t("Contact", "تواصل معنا"),
    metaDescription: t("Reservations, private events, partnerships, careers. The right person on the NOA team will reply within one business day.", "الحجوزات والفعاليات الخاصة والشراكات والوظائف. سيرد عليك الشخص المناسب من فريق نوا خلال يوم عمل واحد."),
    voiceAliases: [t("contact", "تواصل"), t("write to us", "راسلنا"), t("talk to someone", "التحدث مع أحد"), t("private events", "الفعاليات الخاصة")],
    sections: [
      { id: "subhero", type: "subhero", media: "contact-hero", kicker: t("· Get in Touch", "— تواصل معنا"), heading: t("Write to *Us*", "راسل*نا*"), sub: t("Reservations, private events, partnerships, careers. The right person on our team will reply within one business day.", "الحجوزات والفعاليات الخاصة والشراكات والوظائف. سيرد عليك الشخص المناسب من فريقنا خلال يوم عمل واحد.") },
      { id: "strip", type: "contactStrip", cells: [
        { label: t("Address", "العنوان"), value: t("Dubai Marina Pier\nBerth 7, Dubai, UAE", "رصيف مرسى دبي\nالمرسى 7، دبي، الإمارات") },
        { label: t("Phone", "الهاتف"), value: t("+971 4 840 0000", "+971 4 840 0000"), href: "tel:+97148400000" },
        { label: t("Email", "البريد الإلكتروني"), value: t("hello@noa-dubai.com", "hello@noa-dubai.com"), href: "mailto:hello@noa-dubai.com" },
        { label: t("Hours", "ساعات العمل"), value: t("Daily\n9:30 AM to 2:00 AM", "يومياً\n9:30 صباحاً إلى 2:00 فجراً") },
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
    title: t("Book · NOA", "احجز — نوا"),
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
  mobile: ["morning-package", "afternoon-package", "night-package", "cabana", "events", "about", "location", "faq", "contact"],
  footer: [
    {
      heading: t("Experience", "التجربة"),
      links: [
        { label: t("Beach Club", "النادي الشاطئي"), href: P("home") },
        { label: t("The Morning", "الصباح"), href: P("morning-package") },
        { label: t("The Afternoon", "بعد الظهر"), href: P("afternoon-package") },
        { label: t("The Night", "الليل"), href: P("night-package") },
        { label: t("The Cabanas", "الكبائن"), href: P("cabana") },
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
