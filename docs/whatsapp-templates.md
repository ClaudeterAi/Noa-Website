# WhatsApp templates to submit to Meta (via Twilio Content Template Builder)

Both templates are **Utility** category, one per language. After approval, put the Content SIDs in the
`WHATSAPP_CONTENT_SIDS` environment variable on Vercel, e.g.
`{"booking_confirmed:en":"HX…","booking_confirmed:ar":"HX…","booking_reminder_24h:en":"HX…","booking_reminder_24h:ar":"HX…"}`.
No code change is needed; messages start sending on the next booking.

Variables are filled by the site: {{1}} guest name · {{2}} booking reference · {{3}} date and session · {{4}} total · {{5}} wristband token.

## booking_confirmed (en)
Body:
> Hi {{1}}, your seats at NOA are confirmed. Reference {{2}}, {{3}}, total {{4}}. Show your wristband code at the pier desk, Dubai Marina Pier, Berth 7, twenty minutes before your session.

Button: **Visit website**, label "Show wristband", URL `https://noa-website-two.vercel.app/en/booking/ticket?t={{5}}` (dynamic suffix).

## booking_confirmed (ar)
> مرحباً {{1}}، تم تأكيد مقاعدك في نوا. رقم الحجز {{2}}، {{3}}، الإجمالي {{4}}. اعرض رمز سوار الدخول عند مكتب الرصيف، رصيف مرسى دبي، المرسى 7، قبل جلستك بعشرين دقيقة.

Button: "عرض السوار", URL `https://noa-website-two.vercel.app/ar/booking/ticket?t={{5}}`.

## booking_reminder_24h (en)
> See you tomorrow at NOA, {{1}}. {{3}}, reference {{2}}. Boats leave Berth 7 every 30 minutes. Your wristband code is below.

Button: "Show wristband", URL `https://noa-website-two.vercel.app/en/booking/ticket?t={{5}}`.

## booking_reminder_24h (ar)
> نراك غداً في نوا يا {{1}}. {{3}}، رقم الحجز {{2}}. تنطلق القوارب من المرسى 7 كل 30 دقيقة. رمز سوار الدخول أدناه.

Button: "عرض السوار", URL `https://noa-website-two.vercel.app/ar/booking/ticket?t={{5}}`.

When NOA's own domain goes live, re-submit with the new base URL (Meta does not allow editing an approved button URL).
