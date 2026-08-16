"use client";

import Navbar from "../components/Navbar";
import { useLanguage } from "@/i18n/LanguageProvider";

type Section = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export default function PrivacyPage() {
  const { isArabic } = useLanguage();

  const copy = isArabic
    ? {
        eyebrow: "الخصوصية وحماية البيانات",
        title: "سياسة الخصوصية",
        intro:
          "توضح هذه السياسة كيفية جمع واستخدام وحماية البيانات الشخصية عند استخدام منصة AAN Psychotherapy.",
        updated: "آخر تحديث: أغسطس 2026",
        important:
          "قد تتضمن بعض المعلومات التي تتم معالجتها عبر المنصة بيانات تتعلق بالصحة النفسية، وهي بيانات شخصية حساسة وتتطلب حماية خاصة.",

        contactTitle: "التواصل بخصوص الخصوصية",
        contactText:
          "لأي طلب يتعلق ببياناتك الشخصية أو بحقوقك، يمكنك التواصل مع AAN Psychotherapy من خلال بيانات الاتصال الرسمية للمنصة.",

        noteTitle: "ملاحظة مهمة",
        note:
          "يجب استكمال هذه السياسة قبل الإطلاق النهائي ببيانات الكيان القانوني المسؤول عن المعالجة، عنوانه الرسمي، البريد الإلكتروني المخصص للخصوصية، ومدد الاحتفاظ النهائية المعتمدة.",

        sections: [
          {
            title: "1. المسؤول عن معالجة البيانات",
            paragraphs: [
              "AAN Psychotherapy هي المنصة المسؤولة عن تحديد أغراض ووسائل معالجة البيانات الشخصية المستخدمة ضمن الخدمات المقدمة عبر الموقع.",
              "سيتم إدراج الاسم القانوني الكامل للكيان، العنوان الرسمي وبيانات الاتصال المخصصة لحماية البيانات قبل الإطلاق النهائي للمنصة.",
            ],
          },
          {
            title: "2. البيانات التي قد نقوم بجمعها",
            paragraphs: [
              "يعتمد نوع البيانات التي يتم جمعها على كيفية استخدامك للمنصة وعلى نوع الحساب والخدمات التي تستخدمها.",
            ],
            bullets: [
              "الاسم واللقب.",
              "عنوان البريد الإلكتروني.",
              "معلومات الحساب والمصادقة.",
              "لغة الاستخدام وتفضيلات المنصة.",
              "معلومات الحجز والمواعيد.",
              "المعالج المختار وتاريخ ووقت الجلسة.",
              "المعلومات التي يرسلها المستخدم عند البحث عن دعم نفسي.",
              "بيانات مهنية يقدمها المعالجون عند تقديم طلب للانضمام إلى المنصة.",
              "المعلومات المرتبطة بعمليات الدفع وحالة المعاملة.",
              "بيانات تقنية لازمة للأمان وتشغيل المنصة.",
              "تفضيلات ملفات تعريف الارتباط والموافقة.",
            ],
          },
          {
            title: "3. البيانات المتعلقة بالصحة",
            paragraphs: [
              "قد تكشف بعض المعلومات التي يقدمها المستخدم، مثل سبب طلب الدعم أو مجال العلاج المطلوب، معلومات عن حالته النفسية أو الصحية.",
              "يتم التعامل مع هذه البيانات باعتبارها بيانات شديدة الحساسية ولا ينبغي استخدامها إلا للغرض المحدد الذي جُمعت من أجله ووفقاً للمتطلبات القانونية applicable.",
            ],
          },
          {
            title: "4. لماذا نستخدم بياناتك؟",
            bullets: [
              "إنشاء وإدارة حساب المستخدم.",
              "التحقق من الهوية والصلاحيات.",
              "ربط المرضى بالمعالجين المناسبين.",
              "إدارة الحجوزات والمواعيد.",
              "إتمام عمليات الدفع ومتابعة حالتها.",
              "إرسال رسائل تأكيد الحجز والتنبيهات الضرورية.",
              "إدارة حسابات المعالجين والمسؤولين.",
              "توفير جلسات العلاج أو الاستشارات عن بُعد.",
              "تأمين المنصة ومنع إساءة الاستخدام.",
              "تحسين الأداء وتجربة المستخدم عند وجود أساس قانوني مناسب.",
              "الامتثال للالتزامات القانونية والتنظيمية.",
            ],
          },
          {
            title: "5. الأسس القانونية للمعالجة",
            paragraphs: [
              "يختلف الأساس القانوني حسب نوع المعالجة. وقد يشمل تنفيذ عقد أو اتخاذ خطوات بناءً على طلب المستخدم، الامتثال لالتزام قانوني، المصلحة المشروعة عندما تكون مناسبة، أو موافقة المستخدم عندما تكون مطلوبة.",
              "عندما تتعلق المعالجة ببيانات صحية أو غيرها من البيانات الحساسة، يجب أيضاً تحديد أساس قانوني إضافي يسمح بمعالجة هذه الفئة الخاصة من البيانات.",
            ],
          },
          {
            title: "6. إنشاء الحساب والمصادقة",
            paragraphs: [
              "تستخدم المنصة نظام مصادقة لإدارة تسجيل الدخول وحماية الحسابات.",
              "يجب عدم مشاركة كلمة المرور مع أي شخص. وقد تُستخدم إجراءات تقنية مثل الجلسات الآمنة ورموز المصادقة لمنع الوصول غير المصرح به.",
            ],
          },
          {
            title: "7. الحجوزات",
            paragraphs: [
              "عند حجز جلسة، تتم معالجة المعلومات اللازمة لتنظيم الموعد، مثل المستخدم، المعالج، وقت الجلسة، السعر وحالة الحجز.",
              "يتم استخدام هذه البيانات حصراً لإدارة الخدمة والالتزامات المرتبطة بها ما لم يوجد أساس قانوني آخر لاستخدام إضافي.",
            ],
          },
          {
            title: "8. المدفوعات",
            paragraphs: [
              "تستخدم المنصة مزودي دفع خارجيين لمعالجة المدفوعات.",
              "بالنسبة للمدفوعات الدولية، يتم استخدام Stripe. لا ينبغي للمنصة تخزين أرقام بطاقات الدفع الكاملة مباشرة في قاعدة بيانات AAN Psychotherapy.",
              "قد تتم إضافة وسائل دفع لبنانية مثل Whish Money وOMT وPurpl وPinPay. سيتم تحديث هذه السياسة عند تفعيل كل خدمة ووفق البيانات التي يتطلبها كل مزود.",
            ],
          },
          {
            title: "9. جلسات العلاج عن بُعد",
            paragraphs: [
              "قد تستخدم المنصة خدمات خارجية لتسهيل الجلسات عن بُعد مثل Zoom.",
              "قد تتم معالجة بيانات تقنية مرتبطة بالاجتماع عند استخدام هذه الخدمات وفق شروط وسياسات مقدم الخدمة.",
              "لا يعني استخدام المنصة تلقائياً تسجيل الجلسة. يجب عدم تسجيل جلسة علاجية دون أساس قانوني واضح وإعلام وموافقة مناسبة عند الاقتضاء.",
            ],
          },
          {
            title: "10. رسائل البريد الإلكتروني",
            paragraphs: [
              "تستخدم المنصة خدمات بريد إلكتروني خارجية لإرسال رسائل تشغيلية مثل تأكيدات الحجز ودعوات الحسابات.",
              "يتم حالياً استخدام Resend لهذا الغرض.",
            ],
          },
          {
            title: "11. الترجمة الآلية والذكاء الاصطناعي",
            paragraphs: [
              "قد تستخدم المنصة OpenAI API لترجمة بعض المحتويات بين الإنجليزية والعربية.",
              "يجب تقليل البيانات المرسلة إلى خدمات الذكاء الاصطناعي إلى الحد الضروري، وعدم إرسال معلومات علاجية حساسة أو تفاصيل جلسات إلا إذا تم التحقق من الأساس القانوني والضمانات المناسبة.",
            ],
          },
          {
            title: "12. ملفات تعريف الارتباط",
            paragraphs: [
              "تستخدم المنصة ملفات أو تقنيات تخزين ضرورية لتشغيل الوظائف الأساسية، مثل اللغة والمصادقة وحفظ اختيارات الخصوصية.",
              "أي أدوات تحليل أو تسويق غير ضرورية يجب ألا يتم تفعيلها قبل الحصول على موافقة المستخدم عندما تكون الموافقة مطلوبة.",
              "يمكن للمستخدم قبول أو رفض ملفات تعريف الارتباط غير الضرورية من خلال واجهة إدارة التفضيلات.",
            ],
          },
          {
            title: "13. الجهات التي قد تتلقى البيانات",
            paragraphs: [
              "لا يتم بيع البيانات الشخصية للمستخدمين.",
              "قد تتم مشاركة البيانات الضرورية فقط مع مقدمي الخدمات الذين يساعدون في تشغيل المنصة، وفقاً لطبيعة الخدمة.",
            ],
            bullets: [
              "Supabase — قاعدة البيانات والمصادقة والتخزين.",
              "Vercel — استضافة تطبيق الويب.",
              "Stripe — معالجة المدفوعات الدولية.",
              "Resend — إرسال البريد الإلكتروني.",
              "Zoom — الجلسات عن بُعد عند استخدامه.",
              "OpenAI — خدمات الترجمة الآلية عند استخدامها.",
              "مزودو الدفع المحليون عند تفعيلهم.",
            ],
          },
          {
            title: "14. نقل البيانات دولياً",
            paragraphs: [
              "بعض مقدمي الخدمات التقنيين قد يعالجون البيانات من دول مختلفة.",
              "قبل الإطلاق النهائي، يجب توثيق مواقع معالجة البيانات والآليات القانونية المستخدمة لكل نقل دولي، بما في ذلك القرارات الخاصة بمستوى الحماية أو البنود التعاقدية القياسية عند الاقتضاء.",
            ],
          },
          {
            title: "15. مدة الاحتفاظ بالبيانات",
            paragraphs: [
              "لا ينبغي الاحتفاظ بالبيانات الشخصية لفترة أطول من اللازم بالنسبة للغرض الذي جُمعت من أجله.",
              "ستحدد AAN Psychotherapy جدولاً موثقاً للاحتفاظ بكل فئة من البيانات قبل الإطلاق النهائي، مع مراعاة الالتزامات القانونية والمحاسبية ومتطلبات قطاع الصحة.",
            ],
          },
          {
            title: "16. أمن البيانات",
            paragraphs: [
              "يتم اتخاذ تدابير تقنية وتنظيمية تهدف إلى حماية البيانات من الوصول غير المصرح به أو الفقد أو التغيير أو الإفصاح غير المشروع.",
            ],
            bullets: [
              "التحكم في الوصول بحسب أدوار المستخدمين.",
              "استخدام حسابات منفصلة للمرضى والمعالجين والمسؤولين.",
              "سياسات أمان على مستوى قاعدة البيانات.",
              "الاتصال عبر HTTPS في بيئة الإنتاج.",
              "حماية مفاتيح API ومتغيرات البيئة.",
              "التحقق من أحداث الدفع بواسطة Webhooks آمنة.",
              "تقييد العمليات الإدارية الحساسة على الخادم.",
            ],
          },
          {
            title: "17. حقوق المستخدم",
            paragraphs: [
              "وفق القانون المطبق، قد يكون للمستخدم حقوق تتعلق ببياناته الشخصية.",
            ],
            bullets: [
              "الحق في معرفة كيفية استخدام البيانات.",
              "الحق في الوصول إلى البيانات الشخصية.",
              "الحق في تصحيح البيانات غير الصحيحة.",
              "الحق في طلب حذف البيانات في الحالات التي يسمح بها القانون.",
              "الحق في تقييد بعض عمليات المعالجة.",
              "الحق في الاعتراض على بعض أنواع المعالجة.",
              "الحق في قابلية نقل البيانات عندما تنطبق الشروط القانونية.",
              "الحق في سحب الموافقة في أي وقت عندما تكون المعالجة مبنية على الموافقة.",
            ],
          },
          {
            title: "18. حذف الحساب",
            paragraphs: [
              "سيتم توفير آلية تمكّن المستخدم من طلب حذف حسابه وبياناته الشخصية، مع مراعاة البيانات التي يجب الاحتفاظ بها بسبب التزام قانوني أو مطالبة قانونية.",
              "سيتم تطوير وظيفة إدارة طلبات الوصول والتصحيح والحذف ضمن مرحلة استكمال RGPD.",
            ],
          },
          {
            title: "19. خصوصية الأطفال",
            paragraphs: [
              "يجب تحديد السياسة النهائية المتعلقة بأعمار المستخدمين قبل إطلاق المنصة بشكل كامل.",
              "إذا كانت المنصة ستقدم خدمات للقاصرين، فيجب تطبيق المتطلبات الخاصة بالموافقة الأبوية وحماية بيانات الأطفال وفق القوانين المختصة.",
            ],
          },
          {
            title: "20. تحديث سياسة الخصوصية",
            paragraphs: [
              "قد يتم تحديث هذه السياسة عندما تتغير وظائف المنصة أو مقدمو الخدمات أو المتطلبات القانونية.",
              "سيتم نشر الإصدار المحدث على هذه الصفحة مع تاريخ آخر تحديث.",
            ],
          },
        ] as Section[],
      }
    : {
        eyebrow: "Privacy & data protection",
        title: "Privacy Policy",
        intro:
          "This policy explains how personal information is collected, used and protected when you use the AAN Psychotherapy platform.",
        updated: "Last updated: August 2026",
        important:
          "Some information processed through the platform may relate to a person's mental or physical health. Health information is sensitive personal data and requires a particularly high level of protection.",

        contactTitle: "Privacy contact",
        contactText:
          "For requests concerning your personal information or your privacy rights, you may contact AAN Psychotherapy using the platform's official contact details.",

        noteTitle: "Important implementation note",
        note:
          "Before the final public launch, this policy must be completed with the legal identity of the data controller, registered address, dedicated privacy contact details and the final approved retention periods.",

        sections: [
          {
            title: "1. Who is responsible for your data?",
            paragraphs: [
              "AAN Psychotherapy is the platform responsible for determining why and how personal information is processed in connection with the services provided through the website.",
              "The full legal entity name, registered address and dedicated privacy contact details will be inserted before the final public launch.",
            ],
          },
          {
            title: "2. Information we may collect",
            paragraphs: [
              "The information collected depends on how you use the platform, your account type and the services you choose to use.",
            ],
            bullets: [
              "First and last name.",
              "Email address.",
              "Account and authentication information.",
              "Language and platform preferences.",
              "Booking and appointment information.",
              "Selected therapist and appointment date and time.",
              "Information provided when looking for psychological support.",
              "Professional information submitted by therapists applying to join the platform.",
              "Payment transaction and payment-status information.",
              "Technical information necessary for security and platform operation.",
              "Cookie and privacy preferences.",
            ],
          },
          {
            title: "3. Health-related information",
            paragraphs: [
              "Some information provided when requesting psychological support may reveal details about a person's mental or physical health.",
              "This information must be treated as particularly sensitive and should only be used for the specific purposes for which it was collected and where the required legal conditions are satisfied.",
            ],
          },
          {
            title: "4. Why we use personal information",
            bullets: [
              "Creating and managing user accounts.",
              "Authentication and access-control management.",
              "Helping users find suitable therapists.",
              "Managing appointments and bookings.",
              "Processing and confirming payments.",
              "Sending essential booking and account emails.",
              "Managing therapist and administrator accounts.",
              "Supporting remote therapy sessions.",
              "Protecting the platform against misuse and security threats.",
              "Improving performance and user experience where an appropriate legal basis exists.",
              "Complying with applicable legal and regulatory obligations.",
            ],
          },
          {
            title: "5. Legal bases for processing",
            paragraphs: [
              "The applicable legal basis depends on the processing activity. It may include performance of a contract or steps requested before entering a contract, compliance with a legal obligation, legitimate interests where appropriate, or consent where required.",
              "Where health information or another special category of personal data is processed, an additional legal condition permitting the processing of that sensitive information must also be identified.",
            ],
          },
          {
            title: "6. Accounts and authentication",
            paragraphs: [
              "The platform uses an authentication system to manage sign-in and protect user accounts.",
              "Users should not share their passwords. Secure sessions and authentication mechanisms may be used to reduce the risk of unauthorised access.",
            ],
          },
          {
            title: "7. Appointments and bookings",
            paragraphs: [
              "When an appointment is booked, information required to organise the session is processed, including the user, therapist, appointment time, price and booking status.",
              "This information is used to provide and administer the requested service unless another lawful basis supports additional processing.",
            ],
          },
          {
            title: "8. Payments",
            paragraphs: [
              "The platform uses external payment providers to process transactions.",
              "Stripe is used for international payments. Full payment-card numbers should not be stored directly in the AAN Psychotherapy database.",
              "Lebanese payment methods such as Whish Money, OMT, Purpl and PinPay may be added. This policy will be updated when each provider is enabled and once its data-processing requirements have been reviewed.",
            ],
          },
          {
            title: "9. Remote therapy sessions",
            paragraphs: [
              "The platform may use external communication services such as Zoom to facilitate remote sessions.",
              "Technical meeting information may be processed by those services in accordance with their own applicable privacy terms.",
              "Use of the platform does not automatically mean that therapy sessions are recorded. A therapy session should not be recorded without a clear lawful basis and appropriate information and consent where required.",
            ],
          },
          {
            title: "10. Transactional emails",
            paragraphs: [
              "External email infrastructure may be used to send operational messages such as booking confirmations and account invitations.",
              "Resend is currently used for this purpose.",
            ],
          },
          {
            title: "11. Automated translation and artificial intelligence",
            paragraphs: [
              "The platform may use the OpenAI API to translate certain content between English and Arabic.",
              "Information sent to AI services should be limited to what is necessary. Sensitive therapy-session content or health information should not be sent unless the legal basis, contractual protections and technical safeguards have been specifically assessed.",
            ],
          },
          {
            title: "12. Cookies and local storage",
            paragraphs: [
              "The platform uses necessary storage technologies for core functionality such as language selection, authentication and privacy preferences.",
              "Non-essential analytics or marketing technologies should not be activated before the required consent has been obtained.",
              "Users can accept or reject non-essential technologies through the cookie-preference interface.",
            ],
          },
          {
            title: "13. Service providers",
            paragraphs: [
              "AAN Psychotherapy does not sell users' personal information.",
              "Only information necessary for operation of the relevant service may be shared with technical providers.",
            ],
            bullets: [
              "Supabase — database, authentication and file storage.",
              "Vercel — web application hosting.",
              "Stripe — international payment processing.",
              "Resend — transactional email delivery.",
              "Zoom — remote sessions where enabled.",
              "OpenAI — automated translation where enabled.",
              "Lebanese payment providers when activated.",
            ],
          },
          {
            title: "14. International data transfers",
            paragraphs: [
              "Some technical providers may process information in different countries.",
              "Before final launch, the location of processing and the legal safeguards used for international transfers must be documented for each provider, including adequacy mechanisms or standard contractual clauses where applicable.",
            ],
          },
          {
            title: "15. How long information is kept",
            paragraphs: [
              "Personal information should not be retained longer than necessary for the purpose for which it was collected.",
              "AAN Psychotherapy will establish and document a retention schedule for each category of information before final launch, taking account of applicable healthcare, accounting and legal obligations.",
            ],
          },
          {
            title: "16. Information security",
            paragraphs: [
              "Technical and organisational safeguards are used to reduce the risk of unauthorised access, loss, alteration or unlawful disclosure.",
            ],
            bullets: [
              "Role-based access controls.",
              "Separate patient, therapist and administrator permissions.",
              "Database-level security policies.",
              "HTTPS in the production environment.",
              "Protection of API credentials and environment variables.",
              "Secure webhook verification for payment events.",
              "Server-side protection for sensitive administrative operations.",
            ],
          },
          {
            title: "17. Your privacy rights",
            paragraphs: [
              "Depending on the applicable law and circumstances, users may have several rights concerning their personal information.",
            ],
            bullets: [
              "The right to receive information about processing.",
              "The right to access personal information.",
              "The right to correct inaccurate information.",
              "The right to request deletion where legally applicable.",
              "The right to request restriction of certain processing.",
              "The right to object to certain processing.",
              "The right to data portability where the legal conditions apply.",
              "The right to withdraw consent at any time where processing relies on consent.",
            ],
          },
          {
            title: "18. Account deletion and privacy requests",
            paragraphs: [
              "A mechanism will be provided for users to request deletion of their account and personal information, subject to information that must legally be retained.",
              "The functionality for access, correction and deletion requests will be completed as part of the final GDPR implementation phase.",
            ],
          },
          {
            title: "19. Children's privacy",
            paragraphs: [
              "The final minimum-age policy must be defined before full public launch.",
              "If services are offered to minors, specific requirements relating to parental involvement, consent and protection of children's information must be implemented according to the applicable law.",
            ],
          },
          {
            title: "20. Changes to this policy",
            paragraphs: [
              "This privacy policy may be updated when the platform, service providers or legal requirements change.",
              "The latest version will be published on this page together with its last-updated date.",
            ],
          },
        ] as Section[],
      };

  return (
    <>
      <Navbar />

      <main
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-screen bg-aan-background px-5 py-10 sm:px-8 lg:px-10"
      >
        <section className="mx-auto max-w-5xl">
          <div className="aan-card p-7 sm:p-10 lg:p-12">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-aan-gold">
              {copy.eyebrow}
            </p>

            <h1 className="aan-heading mt-4 text-4xl sm:text-5xl lg:text-6xl">
              {copy.title}
            </h1>

            <p className="mt-5 max-w-4xl text-lg leading-8 text-aan-secondary">
              {copy.intro}
            </p>

            <p className="mt-4 text-sm font-semibold text-aan-secondary">
              {copy.updated}
            </p>

            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="leading-7 text-amber-900">
                {copy.important}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6">
            {copy.sections.map((section) => (
              <section
                key={section.title}
                className="aan-card p-7 sm:p-8"
              >
                <h2 className="text-2xl font-semibold text-aan-navy sm:text-3xl">
                  {section.title}
                </h2>

                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-4 text-base leading-8 text-aan-secondary"
                  >
                    {paragraph}
                  </p>
                ))}

                {section.bullets && (
                  <ul className="mt-5 grid gap-3">
                    {section.bullets.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-base leading-7 text-aan-secondary"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-aan-gold"
                        />

                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <section className="mt-8 rounded-[2rem] border border-aan-border bg-white p-7 shadow-[var(--aan-shadow-sm)] sm:p-8">
            <h2 className="text-2xl font-semibold text-aan-navy">
              {copy.contactTitle}
            </h2>

            <p className="mt-4 leading-8 text-aan-secondary">
              {copy.contactText}
            </p>
          </section>

          <section className="mt-6 rounded-[2rem] border border-red-200 bg-red-50 p-7 sm:p-8">
            <h2 className="text-xl font-semibold text-red-900">
              {copy.noteTitle}
            </h2>

            <p className="mt-3 leading-7 text-red-800">
              {copy.note}
            </p>
          </section>
        </section>
      </main>
    </>
  );
}