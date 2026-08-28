"use client";

import Navbar from "../components/Navbar";
import { useLanguage } from "@/i18n/LanguageProvider";

type CookieSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export default function CookiesPage() {
  const { language, isArabic } = useLanguage();

  const copy = isArabic
    ? {
        eyebrow: "الخصوصية وملفات تعريف الارتباط",
        title: "سياسة ملفات تعريف الارتباط",
        intro:
          "توضح هذه السياسة كيفية استخدام AAN Psychotherapy لملفات تعريف الارتباط وتقنيات التخزين المحلية والتقنيات المشابهة.",
        updated: "آخر تحديث: أغسطس 2026",

        important:
          "لا يتم تفعيل ملفات تعريف الارتباط أو أدوات التتبع غير الضرورية إلا بعد الحصول على موافقة المستخدم عندما تكون الموافقة مطلوبة.",

        sections: [
          {
            title: "1. ما هي ملفات تعريف الارتباط؟",
            paragraphs: [
              "ملفات تعريف الارتباط هي ملفات صغيرة أو تقنيات مشابهة يمكن تخزينها على جهاز المستخدم أثناء استخدام موقع أو تطبيق ويب.",
              "قد تستخدم المنصة أيضاً تقنيات مثل التخزين المحلي في المتصفح لحفظ بعض الإعدادات الضرورية لتشغيل الموقع.",
            ],
          },
          {
            title: "2. لماذا تستخدم AAN هذه التقنيات؟",
            paragraphs: [
              "تستخدم AAN Psychotherapy تقنيات التخزين الضرورية لتوفير وظائف أساسية وآمنة للمستخدمين.",
            ],
            bullets: [
              "تسجيل الدخول وإدارة الجلسات.",
              "حماية الحسابات والمصادقة.",
              "حفظ لغة الموقع المختارة.",
              "حفظ تفضيلات ملفات تعريف الارتباط.",
              "تشغيل الوظائف الأساسية للمنصة.",
            ],
          },
          {
            title: "3. ملفات تعريف الارتباط الضرورية",
            paragraphs: [
              "هذه التقنيات ضرورية لتشغيل المنصة ولا يمكن تعطيلها عندما يكون استخدامها ضرورياً لتقديم الخدمة التي طلبها المستخدم.",
              "قد تشمل، على سبيل المثال، جلسات المصادقة، إعدادات الأمان، اللغة وتفضيلات الخصوصية.",
            ],
          },
          {
            title: "4. ملفات التحليل",
            paragraphs: [
              "قد يتم استخدام أدوات تحليل لقياس كيفية استخدام الزوار للمنصة وتحسين الأداء وتجربة المستخدم.",
              "لن يتم تفعيل أدوات التحليل غير الضرورية قبل الحصول على موافقة المستخدم عندما تكون الموافقة مطلوبة.",
              "حتى الآن، يجب تحديث هذه الصفحة إذا تمت إضافة أداة تحليل محددة مثل Google Analytics أو أي مزود آخر.",
            ],
          },
          {
            title: "5. ملفات التسويق",
            paragraphs: [
              "قد تستخدم تقنيات تسويقية مستقبلاً لقياس الحملات أو تخصيص المحتوى الإعلاني.",
              "هذه التقنيات لا تعتبر ضرورية لتشغيل المنصة، ولذلك لا ينبغي تشغيلها قبل موافقة المستخدم عندما تكون الموافقة مطلوبة.",
              "إذا لم تستخدم AAN أي أدوات تسويقية، ستظل هذه الفئة معطلة.",
            ],
          },
          {
            title: "6. التخزين المحلي",
            paragraphs: [
              "يستخدم الموقع حالياً التخزين المحلي في المتصفح لحفظ بعض التفضيلات.",
            ],
            bullets: [
              "اللغة المختارة.",
              "اختيار المستخدم المتعلق بملفات تعريف الارتباط.",
              "بعض الإعدادات التقنية المرتبطة بتجربة المستخدم.",
            ],
          },
          {
            title: "7. إدارة الموافقة",
            paragraphs: [
              "عند أول زيارة، يمكن للمستخدم قبول جميع ملفات تعريف الارتباط غير الضرورية أو رفضها أو تخصيص اختياراته.",
              "رفض ملفات تعريف الارتباط غير الضرورية لا ينبغي أن يمنع المستخدم من الوصول إلى الوظائف الأساسية للمنصة.",
            ],
          },
          {
            title: "8. سحب أو تعديل الموافقة",
            paragraphs: [
              "يمكن للمستخدم تعديل أو سحب موافقته في أي وقت.",
              "سيتم توفير وسيلة دائمة وسهلة للوصول إلى إعدادات ملفات تعريف الارتباط من الموقع.",
            ],
          },
          {
            title: "9. خدمات الأطراف الثالثة",
            paragraphs: [
              "تستخدم AAN Psychotherapy عدة خدمات تقنية خارجية لتشغيل المنصة.",
              "استخدام هذه الخدمات لا يعني بالضرورة أنها جميعاً تضع ملفات تعريف ارتباط تسويقية أو تحليلية.",
              "سيتم إجراء مراجعة نهائية لكل خدمة لتحديد ملفات تعريف الارتباط أو التقنيات التي قد تستخدمها.",
            ],
            bullets: [
              "Supabase — قاعدة البيانات والمصادقة والتخزين.",
              "Vercel — استضافة التطبيق.",
              "Stripe — المدفوعات الدولية.",
              "Zoom — جلسات الفيديو.",
              "Resend — رسائل البريد الإلكتروني.",
              "OpenAI — الترجمة الآلية للمحتوى عند استخدامها.",
              "مزودو الدفع اللبنانيون عند تفعيلهم.",
            ],
          },
          {
            title: "10. مدة حفظ الاختيارات",
            paragraphs: [
              "يتم حفظ اختيار المستخدم حتى لا يضطر إلى الإجابة على نفس السؤال في كل زيارة.",
              "قد تتم مطالبة المستخدم بتجديد اختياره دورياً أو عند حدوث تغيير جوهري في استخدام ملفات تعريف الارتباط.",
            ],
          },
          {
            title: "11. تحديث هذه السياسة",
            paragraphs: [
              "قد يتم تحديث سياسة ملفات تعريف الارتباط عند إضافة أدوات جديدة أو تغيير الخدمات التقنية المستخدمة في المنصة.",
              "سيتم نشر النسخة الجديدة على هذه الصفحة مع تحديث تاريخ المراجعة.",
            ],
          },
        ] as CookieSection[],

        preferencesTitle: "إدارة تفضيلاتك",
        preferencesText:
          "يمكنك إدارة ملفات تعريف الارتباط غير الضرورية من خلال نافذة إعدادات ملفات تعريف الارتباط المتاحة على المنصة.",

        privacyTitle: "سياسة الخصوصية",
        privacyText:
          "لمزيد من المعلومات حول كيفية استخدام وحماية البيانات الشخصية، يمكنك مراجعة سياسة الخصوصية.",
        privacyButton: "عرض سياسة الخصوصية",
      }
    : language === "fr"
      ? {
          eyebrow: "Confidentialité & cookies",
          title: "Politique relative aux cookies",
          intro:
            "Cette politique explique comment AAN Psychotherapy utilise les cookies, le stockage du navigateur et des technologies similaires lorsque vous utilisez la plateforme.",
          updated: "Dernière mise à jour : août 2026",

          important:
            "Les cookies non essentiels ou les technologies de suivi ne sont pas activés avant l’obtention du consentement lorsque celui-ci est requis.",

          sections: [
            {
              title: "1. Que sont les cookies ?",
              paragraphs: [
                "Les cookies sont de petits fichiers ou des technologies similaires qui peuvent être stockés sur l’appareil d’un utilisateur lorsqu’il utilise un site web ou une application web.",
                "La plateforme peut également utiliser des technologies telles que le stockage local du navigateur afin de conserver les informations nécessaires à certaines fonctionnalités et préférences.",
              ],
            },
            {
              title: "2. Pourquoi AAN utilise ces technologies",
              paragraphs: [
                "AAN Psychotherapy utilise des technologies de stockage nécessaires afin de fournir des fonctionnalités essentielles et sécurisées de la plateforme.",
              ],
              bullets: [
                "Connexion et gestion des sessions.",
                "Sécurité des comptes et authentification.",
                "Mémorisation de la langue sélectionnée sur le site.",
                "Mémorisation des préférences relatives aux cookies et à la confidentialité.",
                "Fourniture des fonctionnalités essentielles de la plateforme.",
              ],
            },
            {
              title: "3. Cookies strictement nécessaires",
              paragraphs: [
                "Ces technologies sont nécessaires au fonctionnement de la plateforme et ne peuvent pas être désactivées lorsqu’elles sont requises pour fournir un service explicitement demandé par l’utilisateur.",
                "Elles peuvent notamment inclure les sessions d’authentification, les paramètres de sécurité, les préférences linguistiques et le stockage des préférences de confidentialité.",
              ],
            },
            {
              title: "4. Cookies d’analyse",
              paragraphs: [
                "Des technologies d’analyse peuvent être utilisées afin de comprendre comment les visiteurs utilisent la plateforme et d’améliorer les performances ainsi que l’expérience utilisateur.",
                "Les outils d’analyse non essentiels ne seront pas activés avant l’obtention du consentement lorsque celui-ci est requis.",
                "Cette politique devra être mise à jour si un prestataire d’analyse spécifique, tel que Google Analytics ou un autre service, est ajouté.",
              ],
            },
            {
              title: "5. Cookies de marketing",
              paragraphs: [
                "Des technologies de marketing pourront être introduites à l’avenir afin de mesurer les campagnes ou de personnaliser le contenu publicitaire.",
                "Ces technologies ne sont pas nécessaires au fonctionnement principal de la plateforme et ne doivent pas être activées avant l’obtention du consentement lorsque celui-ci est requis.",
                "Si AAN n’utilise aucune technologie de marketing, cette catégorie restera désactivée.",
              ],
            },
            {
              title: "6. Stockage local du navigateur",
              paragraphs: [
                "Le site utilise actuellement le stockage local du navigateur afin de conserver certaines préférences.",
              ],
              bullets: [
                "Langue sélectionnée.",
                "Choix de l’utilisateur concernant le consentement aux cookies.",
                "Certains paramètres techniques liés à l’expérience utilisateur.",
              ],
            },
            {
              title: "7. Gestion du consentement",
              paragraphs: [
                "Lors de la première visite, les utilisateurs peuvent accepter les technologies non essentielles, les refuser ou personnaliser leurs préférences.",
                "Le refus des technologies non essentielles ne doit pas empêcher l’accès aux fonctionnalités essentielles de la plateforme.",
              ],
            },
            {
              title: "8. Retrait ou modification du consentement",
              paragraphs: [
                "Les utilisateurs peuvent modifier ou retirer leur consentement à tout moment.",
                "Un moyen permanent et facilement accessible permettant de rouvrir les préférences relatives aux cookies sera disponible sur la plateforme.",
              ],
            },
            {
              title: "9. Services tiers",
              paragraphs: [
                "AAN Psychotherapy utilise plusieurs prestataires techniques externes pour faire fonctionner la plateforme.",
                "L’utilisation de ces prestataires ne signifie pas nécessairement qu’ils déposent tous des cookies d’analyse ou de marketing.",
                "Un examen final de chaque prestataire sera effectué afin d’identifier les cookies ou technologies similaires susceptibles d’être utilisés.",
              ],
              bullets: [
                "Supabase — base de données, authentification et stockage.",
                "Vercel — hébergement de l’application.",
                "Stripe — traitement des paiements internationaux.",
                "Zoom — séances vidéo.",
                "Resend — e-mails transactionnels.",
                "OpenAI — traduction automatisée du contenu lorsqu’elle est activée.",
                "Prestataires de paiement libanais lorsqu’ils sont activés.",
              ],
            },
            {
              title: "10. Durée de conservation des préférences",
              paragraphs: [
                "Le choix de l’utilisateur est enregistré afin que la plateforme ne pose pas la même question à chaque visite.",
                "Les utilisateurs peuvent être invités à renouveler leur choix périodiquement ou lorsqu’un changement important intervient dans l’utilisation des cookies ou des technologies de suivi.",
              ],
            },
            {
              title: "11. Modifications de cette politique",
              paragraphs: [
                "Cette politique relative aux cookies peut être mise à jour lorsque de nouvelles technologies sont introduites ou lorsque les prestataires techniques de la plateforme changent.",
                "La version la plus récente sera publiée sur cette page avec la date de révision mise à jour.",
              ],
            },
          ] as CookieSection[],

          preferencesTitle: "Gérer vos préférences",
          preferencesText:
            "Vous pouvez gérer les cookies non essentiels à l’aide de l’interface de préférences relative aux cookies disponible sur la plateforme.",

          privacyTitle: "Politique de confidentialité",
          privacyText:
            "Pour en savoir plus sur la manière dont les informations personnelles sont collectées, utilisées et protégées, consultez la Politique de confidentialité.",
          privacyButton: "Voir la Politique de confidentialité",
        }
      : {
        eyebrow: "Privacy & cookies",
        title: "Cookie Policy",
        intro:
          "This policy explains how AAN Psychotherapy uses cookies, browser storage and similar technologies when you use the platform.",
        updated: "Last updated: August 2026",

        important:
          "Non-essential cookies or tracking technologies are not activated before consent where consent is required.",

        sections: [
          {
            title: "1. What are cookies?",
            paragraphs: [
              "Cookies are small files or similar technologies that may be stored on a user's device while using a website or web application.",
              "The platform may also use technologies such as browser local storage to retain information required for certain features and preferences.",
            ],
          },
          {
            title: "2. Why AAN uses these technologies",
            paragraphs: [
              "AAN Psychotherapy uses necessary storage technologies to provide secure and essential platform functionality.",
            ],
            bullets: [
              "Sign-in and session management.",
              "Account security and authentication.",
              "Remembering the selected website language.",
              "Remembering cookie and privacy preferences.",
              "Providing essential platform functionality.",
            ],
          },
          {
            title: "3. Strictly necessary cookies",
            paragraphs: [
              "These technologies are required for the operation of the platform and cannot be disabled where they are necessary to provide a service explicitly requested by the user.",
              "They may include authentication sessions, security settings, language preferences and privacy-preference storage.",
            ],
          },
          {
            title: "4. Analytics cookies",
            paragraphs: [
              "Analytics technologies may be used to understand how visitors use the platform and to improve performance and user experience.",
              "Non-essential analytics tools will not be activated before consent where consent is required.",
              "This policy must be updated if a specific analytics provider such as Google Analytics or another analytics service is added.",
            ],
          },
          {
            title: "5. Marketing cookies",
            paragraphs: [
              "Marketing technologies may be introduced in the future to measure campaigns or personalise advertising content.",
              "These technologies are not necessary for the core operation of the platform and should not be activated before consent where consent is required.",
              "If AAN does not use marketing technologies, this category will remain disabled.",
            ],
          },
          {
            title: "6. Browser local storage",
            paragraphs: [
              "The website currently uses browser local storage to retain certain preferences.",
            ],
            bullets: [
              "Selected language.",
              "The user's cookie-consent choice.",
              "Certain technical settings related to the user experience.",
            ],
          },
          {
            title: "7. Managing consent",
            paragraphs: [
              "On the first visit, users can accept non-essential technologies, reject them or customise their preferences.",
              "Rejecting non-essential technologies should not prevent access to the platform's essential functionality.",
            ],
          },
          {
            title: "8. Withdrawing or changing consent",
            paragraphs: [
              "Users may change or withdraw their consent at any time.",
              "A permanent and accessible method for reopening cookie preferences will be provided on the platform.",
            ],
          },
          {
            title: "9. Third-party services",
            paragraphs: [
              "AAN Psychotherapy uses several external technical providers to operate the platform.",
              "The use of these providers does not necessarily mean that all of them place analytics or marketing cookies.",
              "A final review of each provider will be carried out to identify any cookies or similar technologies that may be used.",
            ],
            bullets: [
              "Supabase — database, authentication and storage.",
              "Vercel — application hosting.",
              "Stripe — international payment processing.",
              "Zoom — video sessions.",
              "Resend — transactional email.",
              "OpenAI — automated content translation where enabled.",
              "Lebanese payment providers when enabled.",
            ],
          },
          {
            title: "10. How long preferences are remembered",
            paragraphs: [
              "The user's preference is stored so that the platform does not ask the same question on every visit.",
              "Users may be asked to renew their choice periodically or when there is a significant change in how cookies or tracking technologies are used.",
            ],
          },
          {
            title: "11. Changes to this policy",
            paragraphs: [
              "This cookie policy may be updated when new technologies are introduced or when the platform's technical providers change.",
              "The latest version will be published on this page together with the updated review date.",
            ],
          },
        ] as CookieSection[],

        preferencesTitle: "Manage your preferences",
        preferencesText:
          "You can manage non-essential cookies using the cookie-preference interface available on the platform.",

        privacyTitle: "Privacy Policy",
        privacyText:
          "For more information about how personal information is collected, used and protected, please review the Privacy Policy.",
        privacyButton: "View Privacy Policy",
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
              {copy.preferencesTitle}
            </h2>

            <p className="mt-4 leading-8 text-aan-secondary">
              {copy.preferencesText}
            </p>
          </section>

          <section className="mt-6 rounded-[2rem] border border-aan-border bg-white p-7 shadow-[var(--aan-shadow-sm)] sm:p-8">
            <h2 className="text-2xl font-semibold text-aan-navy">
              {copy.privacyTitle}
            </h2>

            <p className="mt-4 leading-8 text-aan-secondary">
              {copy.privacyText}
            </p>

            <a
              href="/privacy"
              className="aan-cta mt-5 inline-flex rounded-2xl px-5 py-3 font-bold text-white"
            >
              {copy.privacyButton}
            </a>
          </section>
        </section>
      </main>
    </>
  );
}