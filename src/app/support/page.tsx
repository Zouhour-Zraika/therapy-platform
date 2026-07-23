"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { Language } from "../lib/translations";
import SupportIllustration from "../components/SupportIllustration";

const supportTopics = [
  {
    slug: "anxiety",
    number: "01",
    enTitle: "Anxiety",
    arTitle: "القلق",
    enSubtitle: "When worry starts taking up too much space.",
    arSubtitle: "عندما يبدأ القلق في شغل مساحة أكبر من اللازم.",
    enText:
      "Anxiety can appear as persistent worry, physical tension, panic, difficulty concentrating, or a constant sense that something may go wrong.",
    arText:
      "قد يظهر القلق على شكل تفكير مستمر أو توتر جسدي أو نوبات هلع أو صعوبة في التركيز أو شعور دائم بأن شيئًا سيئًا قد يحدث.",
    enDetails:
      "Psychotherapy can help you understand what triggers your anxiety, recognise recurring patterns, and develop healthier ways of responding.",
    arDetails:
      "يمكن للعلاج النفسي أن يساعدك على فهم محفزات القلق والتعرف إلى الأنماط المتكررة وتطوير طرق أكثر توازنًا للتعامل معها.",
    background: "bg-[#dce7df]",
    accent: "bg-[#789080]",
    secondaryAccent: "bg-[#f6f2ea]",
    shape: "rounded-[46%_54%_64%_36%/40%_42%_58%_60%]",
  },
  {
    slug: "depression",
    number: "02",
    enTitle: "Depression",
    arTitle: "الاكتئاب",
    enSubtitle: "When everyday life begins to feel heavier.",
    arSubtitle: "عندما تبدأ الحياة اليومية في الشعور بأنها أكثر ثقلًا.",
    enText:
      "Depression may affect your mood, energy, sleep, motivation, relationships, and ability to feel connected to the things that once mattered.",
    arText:
      "قد يؤثر الاكتئاب في المزاج والطاقة والنوم والدافع والعلاقات والقدرة على الشعور بالارتباط بالأشياء التي كانت مهمة بالنسبة إليك.",
    enDetails:
      "Therapy offers a space to explore what you are experiencing without judgement and to gradually rebuild emotional balance and connection.",
    arDetails:
      "يوفر العلاج مساحة لفهم ما تمر به دون أحكام والعمل تدريجيًا على استعادة التوازن النفسي والشعور بالارتباط.",
    background: "bg-[#e1e5ec]",
    accent: "bg-[#7f899a]",
    secondaryAccent: "bg-[#f7f4ed]",
    shape: "rounded-[62%_38%_42%_58%/50%_35%_65%_50%]",
  },
  {
    slug: "relationships",
    number: "03",
    enTitle: "Relationships",
    arTitle: "العلاقات",
    enSubtitle: "When connection becomes difficult or painful.",
    arSubtitle: "عندما يصبح التواصل صعبًا أو مؤلمًا.",
    enText:
      "Relationship difficulties can involve recurring conflict, emotional distance, communication problems, trust, boundaries, or patterns that feel difficult to change.",
    arText:
      "قد تشمل صعوبات العلاقات خلافات متكررة أو بعدًا عاطفيًا أو مشكلات في التواصل أو الثقة أو الحدود أو أنماطًا يصعب تغييرها.",
    enDetails:
      "Psychotherapy can help you better understand your needs, your patterns of connection, and the way you relate to others.",
    arDetails:
      "يمكن للعلاج النفسي أن يساعدك على فهم احتياجاتك وأنماط تواصلك والطريقة التي تبني بها علاقاتك مع الآخرين.",
    background: "bg-[#eee0d6]",
    accent: "bg-[#b28772]",
    secondaryAccent: "bg-[#faf5ef]",
    shape: "rounded-[35%_65%_56%_44%/60%_48%_52%_40%]",
  },
  {
    slug: "trauma",
    number: "04",
    enTitle: "Trauma",
    arTitle: "الصدمات النفسية",
    enSubtitle: "When a past experience still feels present.",
    arSubtitle: "عندما تستمر تجربة سابقة في الشعور بأنها حاضرة.",
    enText:
      "Trauma can affect how safe you feel, how your body responds to stress, how you relate to others, and how you understand yourself.",
    arText:
      "قد تؤثر الصدمات في شعورك بالأمان واستجابة جسدك للضغط وطريقة علاقتك بالآخرين ونظرتك إلى نفسك.",
    enDetails:
      "A safe therapeutic relationship can support you in processing difficult experiences at a pace that respects your emotional needs.",
    arDetails:
      "يمكن للعلاقة العلاجية الآمنة أن تدعمك في التعامل مع التجارب الصعبة بوتيرة تحترم احتياجاتك النفسية.",
    background: "bg-[#e7e0d5]",
    accent: "bg-[#9c886a]",
    secondaryAccent: "bg-[#f8f4ec]",
    shape: "rounded-[54%_46%_34%_66%/42%_58%_42%_58%]",
  },
  {
    slug: "stress-burnout",
    number: "05",
    enTitle: "Stress & Burnout",
    arTitle: "الضغط والإرهاق النفسي",
    enSubtitle: "When your mind and body have been carrying too much.",
    arSubtitle: "عندما يتحمل ذهنك وجسدك أكثر مما ينبغي.",
    enText:
      "Chronic stress and burnout may appear as exhaustion, irritability, emotional numbness, reduced motivation, or difficulty recovering even after resting.",
    arText:
      "قد يظهر الضغط المزمن والإرهاق النفسي على شكل تعب أو انفعال أو خدر عاطفي أو انخفاض في الدافع أو صعوبة في التعافي حتى بعد الراحة.",
    enDetails:
      "Therapy can help you recognise what is draining you, reconsider expectations, and rebuild a more sustainable rhythm.",
    arDetails:
      "يمكن للعلاج أن يساعدك على التعرف إلى مصادر الاستنزاف وإعادة النظر في التوقعات وبناء إيقاع أكثر توازنًا واستدامة.",
    background: "bg-[#dce5e6]",
    accent: "bg-[#70898f]",
    secondaryAccent: "bg-[#f4f6f3]",
    shape: "rounded-[45%_55%_38%_62%/58%_38%_62%_42%]",
  },
  {
    slug: "self-esteem",
    number: "06",
    enTitle: "Self-esteem",
    arTitle: "تقدير الذات",
    enSubtitle: "When the way you see yourself becomes painful.",
    arSubtitle: "عندما تصبح نظرتك إلى نفسك مصدرًا للألم.",
    enText:
      "Low self-esteem may involve self-criticism, shame, perfectionism, comparison, fear of failure, or a feeling that you are never enough.",
    arText:
      "قد يشمل انخفاض تقدير الذات نقدًا مستمرًا للنفس أو الخجل أو السعي إلى الكمال أو المقارنة أو الخوف من الفشل أو الشعور بأنك لست كافيًا.",
    enDetails:
      "Psychotherapy can help you understand where these beliefs come from and build a kinder, more realistic relationship with yourself.",
    arDetails:
      "يمكن للعلاج النفسي أن يساعدك على فهم مصدر هذه المعتقدات وبناء علاقة أكثر لطفًا وواقعية مع نفسك.",
    background: "bg-[#e8dfeb]",
    accent: "bg-[#907899]",
    secondaryAccent: "bg-[#faf5fa]",
    shape: "rounded-[60%_40%_60%_40%/38%_62%_38%_62%]",
  },
];

const additionalTopics = [
  {
    slug: "ocd",
    enTitle: "OCD",
    arTitle: "الوسواس القهري",
    enText:
      "Intrusive thoughts, repetitive behaviours, reassurance seeking, and a difficult cycle of anxiety and temporary relief.",
    arText:
      "أفكار متطفلة وسلوكيات متكررة وطلب مستمر للطمأنة ودائرة صعبة بين القلق والراحة المؤقتة.",
  },
  {
    slug: "grief",
    enTitle: "Grief & Loss",
    arTitle: "الحزن والفقدان",
    enText:
      "Support while navigating loss, change, absence, and the emotional process of adapting to life after a meaningful separation.",
    arText:
      "دعم خلال التعامل مع الفقدان والتغيير والغياب والعملية النفسية للتكيف مع الحياة بعد انفصال أو خسارة مهمة.",
  },
  {
    slug: "parenting",
    enTitle: "Parenting",
    arTitle: "تحديات الأبوة والأمومة",
    enText:
      "Emotional support for parental stress, family dynamics, changing roles, guilt, boundaries, and communication.",
    arText:
      "دعم نفسي لضغوط الأبوة والأمومة وديناميكيات الأسرة وتغير الأدوار والشعور بالذنب والحدود والتواصل.",
  },
  {
    slug: "eating-disorders",
    enTitle: "Eating Difficulties",
    arTitle: "صعوبات الأكل",
    enText:
      "A compassionate space to explore food, body image, control, emotional distress, and patterns around eating.",
    arText:
      "مساحة داعمة لفهم العلاقة بالطعام وصورة الجسد والتحكم والضغط النفسي والأنماط المرتبطة بالأكل.",
  },
];

export default function SupportPage() {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language;

    if (savedLanguage === "en" || savedLanguage === "ar") {
      setLanguage(savedLanguage);
    }

    const handleLanguageChange = () => {
      const updatedLanguage = localStorage.getItem(
        "language"
      ) as Language;

      if (updatedLanguage === "en" || updatedLanguage === "ar") {
        setLanguage(updatedLanguage);
      }
    };

    window.addEventListener("storage", handleLanguageChange);

    return () => {
      window.removeEventListener("storage", handleLanguageChange);
    };
  }, []);

  const isArabic = language === "ar";

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-[#f8f4ee] text-[#223748]"
    >
      <Navbar />

      {/* Hero */}
<section className="relative overflow-hidden px-5 pb-20 pt-16 sm:px-8 lg:px-12 lg:pb-28 lg:pt-24">
  <div className="absolute inset-0 -z-10">
    <div className="absolute -right-20 top-0 h-80 w-80 rounded-full bg-[#cbb48c]/20 blur-3xl" />

    <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-[#415a72]/10 blur-3xl" />
  </div>

  <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
    <div className={isArabic ? "text-right" : "text-left"}>
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#b39668]">
        {isArabic ? "مجالات الدعم" : "AREAS OF SUPPORT"}
      </p>

      <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight text-[#223748] sm:text-6xl lg:text-7xl">
        {isArabic
          ? "كيف يمكن للعلاج النفسي أن يساعدك؟"
          : "How can psychotherapy help?"}
      </h1>

      <p className="mt-7 max-w-3xl text-lg leading-8 text-[#5e6b73] sm:text-xl">
        {isArabic
          ? "يمكن أن يكون فهم ما تمر به بداية مهمة. استكشف بعض التحديات النفسية والعاطفية الشائعة، وتعرّف إلى الطريقة التي يمكن للعلاج النفسي أن يدعم بها الفهم والتعافي والتغيير."
          : "Understanding what you are going through can be an important beginning. Explore common emotional and psychological challenges and learn how psychotherapy may support understanding, recovery, and meaningful change."}
      </p>

      <div className="mt-9 flex flex-wrap items-center gap-5">
        <Link
          href="/booking"
          className="inline-flex items-center justify-center rounded-2xl bg-[#415a72] px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#32495f]"
        >
          {isArabic
            ? "احجز جلسة عبر الإنترنت"
            : "Book an Online Session"}
        </Link>

        <a
          href="#support-topics"
          className="inline-flex items-center gap-3 border-b border-[#b39668] pb-2 font-semibold text-[#415a72] transition hover:text-[#987449]"
        >
          {isArabic ? "استكشف المجالات" : "Explore the topics"}

          <span
            aria-hidden="true"
            className={isArabic ? "rotate-180" : ""}
          >
            ↓
          </span>
        </a>
      </div>
    </div>

    <div className="relative mx-auto min-h-[390px] w-full max-w-[520px] overflow-hidden rounded-[3rem] bg-[#d9e3dd] sm:min-h-[500px]">
      <div className="absolute left-[8%] top-[10%] h-[78%] w-[78%] rounded-[54%_46%_61%_39%/43%_57%_43%_57%] bg-[#a8b8ad]/55" />

      <div className="absolute left-[22%] top-[22%] h-[52%] w-[52%] rounded-[58%_42%_47%_53%/42%_58%_42%_58%] bg-[#7d9585]" />

      <div className="absolute right-[10%] top-[12%] h-24 w-24 rounded-full border border-white/80" />

      <div className="absolute bottom-[10%] left-[10%] h-28 w-28 rounded-full border border-[#415a72]/25" />

      <div className="absolute bottom-[14%] right-[12%] h-24 w-24 rounded-full bg-[#f7f3eb]" />

      <div className="absolute bottom-[24%] right-[29%] h-12 w-12 rounded-full bg-[#c8ad7e]" />

      <div className="absolute left-[47%] top-[28%] h-[36%] w-px rotate-[18deg] bg-white/70" />

      <div className="absolute bottom-[28%] left-[18%] h-px w-44 -rotate-[25deg] bg-[#415a72]/30" />

      <div className="absolute right-[29%] top-[25%] h-16 w-16 rounded-full bg-white/35" />

      <span className="absolute left-9 top-8 text-xs font-bold tracking-[0.32em] text-[#415a72]/50">
        AAN / SUPPORT
      </span>
    </div>
  </div>
</section>

      {/* Introductory statement */}
      <section className="px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 border-y border-[#ddd1bf] py-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-start lg:py-16">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#a58455]">
              {isArabic ? "فهم التجربة" : "UNDERSTANDING YOUR EXPERIENCE"}
            </p>

            <div className="max-w-4xl">
              <h2 className="text-3xl font-bold leading-[1.15] text-[#223748] sm:text-5xl">
                {isArabic
                  ? "ليس عليك معرفة التشخيص أو امتلاك الكلمات المثالية قبل طلب الدعم."
                  : "You do not need a diagnosis or the perfect words before asking for support."}
              </h2>

              <p className="mt-7 max-w-3xl text-[19px] leading-9 text-[#66727a]">
                {isArabic
                  ? "قد تعرف بالضبط ما تمر به، وقد يكون لديك فقط شعور بأن الأمور لم تعد كما كانت. كلاهما سبب كافٍ لبدء الحديث مع مختص."
                  : "You may know exactly what you are experiencing, or you may only have a sense that things no longer feel right. Both are valid reasons to begin a conversation with a professional."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main support topics */}
      <section
        id="support-topics"
        className="scroll-mt-28 px-5 pb-24 pt-10 sm:px-8 lg:px-12 lg:pb-32"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#b39668]">
              {isArabic ? "استكشف مجالات الدعم" : "EXPLORE AREAS OF SUPPORT"}
            </p>

            <h2 className="mt-4 text-3xl font-bold text-[#223748] sm:text-5xl">
              {isArabic
                ? "ابدأ من المجال الأقرب إلى تجربتك."
                : "Begin with the area closest to your experience."}
            </h2>

            <p className="mt-6 text-lg leading-8 text-[#66727a]">
              {isArabic
                ? "تقدم كل صفحة معلومات أولية حول التجربة وأعراضها الشائعة والطريقة التي يمكن للعلاج النفسي أن يساعد بها."
                : "Each page offers introductory information about the experience, common signs, and the ways psychotherapy may help."}
            </p>
          </div>

          <div className="mt-16 space-y-10 lg:space-y-16">
            {supportTopics.map((topic, index) => {
              const illustrationFirst = index % 2 !== 0;

              return (
                <article
                  key={topic.slug}
                  className="overflow-hidden rounded-[2.75rem] border border-[#e2d7c6] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="grid lg:grid-cols-2">
                    <div
                        className={`relative min-h-[330px] overflow-hidden rounded-[2.75rem] sm:min-h-[440px] ${
                            illustrationFirst
                            ? "lg:order-1"
                            : "lg:order-2"
                        }`}
                    >
                        <SupportIllustration slug={topic.slug} />
                    </div>

                    <div
                      className={`flex min-h-[330px] flex-col justify-center p-8 sm:p-12 lg:p-16 ${
                        illustrationFirst
                          ? "lg:order-2"
                          : "lg:order-1"
                      }`}
                    >
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#a38253]">
                        {isArabic
                          ? "فهم التجربة"
                          : "UNDERSTANDING THE EXPERIENCE"}
                      </p>

                      <h3 className="mt-4 text-3xl font-bold text-[#223748] sm:text-5xl">
                        {isArabic ? topic.arTitle : topic.enTitle}
                      </h3>

                      <p className="mt-5 text-xl font-medium leading-8 text-[#415a72]">
                        {isArabic
                          ? topic.arSubtitle
                          : topic.enSubtitle}
                      </p>

                      <p className="mt-5 max-w-xl leading-8 text-[#68747b]">
                        {isArabic ? topic.arText : topic.enText}
                      </p>

                      <p className="mt-4 max-w-xl leading-8 text-[#68747b]">
                        {isArabic ? topic.arDetails : topic.enDetails}
                      </p>

                      <Link
                        href={`/support/${topic.slug}`}
                        className="mt-8 inline-flex w-fit items-center gap-3 border-b border-[#b39668] pb-2 font-semibold text-[#415a72] transition hover:text-[#987449]"
                      >
                        {isArabic
                          ? "تعرّف إلى هذا المجال"
                          : "Learn about this area"}

                        <span
                          aria-hidden="true"
                          className={isArabic ? "rotate-180" : ""}
                        >
                          →
                        </span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
            <div className="mt-14 grid gap-6 sm:grid-cols-2">
  {additionalTopics.map((topic, index) => (
    <Link
      key={topic.slug}
      href={`/support/${topic.slug}`}
      className="group overflow-hidden rounded-[2rem] border border-[#ddd1bf] bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#b39668] hover:shadow-lg"
    >
      <div className="relative h-56 overflow-hidden">
        <SupportIllustration
          slug={topic.slug}
          showNumber={false}
          className="h-full min-h-0"
        />

        <span className="absolute left-7 top-6 text-sm font-bold tracking-[0.24em] text-[#415a72]/60">
          {String(index + 7).padStart(2, "0")}
        </span>
      </div>

      <div className="p-7 sm:p-8">
        <div className="flex items-start justify-between gap-6">
          <h3 className="text-2xl font-bold text-[#223748] sm:text-3xl">
            {isArabic ? topic.arTitle : topic.enTitle}
          </h3>

          <span
            aria-hidden="true"
            className={`text-2xl text-[#415a72] transition group-hover:translate-x-1 ${
              isArabic ? "rotate-180" : ""
            }`}
          >
            →
          </span>
        </div>

        <p className="mt-5 leading-8 text-[#68747b]">
          {isArabic ? topic.arText : topic.enText}
        </p>
      </div>
    </Link>
  ))}
</div>

      {/* What psychotherapy may offer */}
      <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2.75rem] bg-[#223748] p-8 text-white sm:p-12 lg:p-16">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#d4be95]">
                  {isArabic
                    ? "ما الذي قد يقدمه العلاج النفسي؟"
                    : "WHAT PSYCHOTHERAPY MAY OFFER"}
                </p>

                <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">
                  {isArabic
                    ? "مساحة لفهم ما يحدث داخلك دون أحكام."
                    : "A space to understand what is happening within you, without judgement."}
                </h2>
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                <article className="border-t border-white/20 pt-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#d4be95]">
                    01
                  </p>

                  <h3 className="mt-4 text-xl font-bold">
                    {isArabic
                      ? "فهم الأنماط"
                      : "Understand patterns"}
                  </h3>

                  <p className="mt-3 leading-7 text-white/70">
                    {isArabic
                      ? "التعرف إلى الأفكار والمشاعر والسلوكيات التي تتكرر في حياتك."
                      : "Recognise thoughts, emotions, and behaviours that continue to repeat in your life."}
                  </p>
                </article>

                <article className="border-t border-white/20 pt-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#d4be95]">
                    02
                  </p>

                  <h3 className="mt-4 text-xl font-bold">
                    {isArabic
                      ? "تنظيم المشاعر"
                      : "Regulate emotions"}
                  </h3>

                  <p className="mt-3 leading-7 text-white/70">
                    {isArabic
                      ? "تطوير طرق أكثر توازنًا للتعامل مع المشاعر الصعبة والضغط."
                      : "Develop more balanced ways of responding to difficult emotions and stress."}
                  </p>
                </article>

                <article className="border-t border-white/20 pt-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#d4be95]">
                    03
                  </p>

                  <h3 className="mt-4 text-xl font-bold">
                    {isArabic
                      ? "بناء علاقات أفضل"
                      : "Build healthier relationships"}
                  </h3>

                  <p className="mt-3 leading-7 text-white/70">
                    {isArabic
                      ? "فهم الاحتياجات والحدود وطريقة التواصل مع الآخرين."
                      : "Explore your needs, boundaries, and ways of communicating with others."}
                  </p>
                </article>

                <article className="border-t border-white/20 pt-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#d4be95]">
                    04
                  </p>

                  <h3 className="mt-4 text-xl font-bold">
                    {isArabic
                      ? "إحداث تغيير تدريجي"
                      : "Create gradual change"}
                  </h3>

                  <p className="mt-3 leading-7 text-white/70">
                    {isArabic
                      ? "العمل على أهداف واقعية وبناء خطوات قابلة للاستمرار."
                      : "Work toward realistic goals and build changes that can be sustained over time."}
                  </p>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Unsure section */}
      <section className="px-5 pb-20 sm:px-8 lg:px-12 lg:pb-28">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.75rem] border border-[#dfd2bf] bg-[#ece2d2]">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#8f744d]">
                {isArabic
                  ? "لست متأكدًا مما تمر به؟"
                  : "NOT SURE WHAT YOU ARE EXPERIENCING?"}
              </p>

              <h2 className="mt-5 max-w-3xl text-3xl font-bold leading-tight text-[#223748] sm:text-5xl">
                {isArabic
                  ? "لا تحتاج إلى تحديد كل شيء قبل أن تبدأ."
                  : "You do not need to define everything before you begin."}
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5f686e]">
                {isArabic
                  ? "من الطبيعي ألا تعرف كيف تصف ما تشعر به. يمكن للمعالج مساعدتك على استكشاف تجربتك وفهمها خطوة بخطوة."
                  : "It is completely valid not to know how to describe what you are feeling. A therapist can help you explore and understand your experience step by step."}
              </p>

              <div className="mt-9">
                <Link
                  href="/booking"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#415a72] px-8 py-4 text-center text-lg font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#32495f]"
                >
                  {isArabic
                    ? "احجز جلسة عبر الإنترنت"
                    : "Book an Online Session"}
                </Link>
              </div>
            </div>

            <div className="relative min-h-[340px] overflow-hidden bg-[#d7e1dc] sm:min-h-[430px]">
              <div className="absolute left-[18%] top-[17%] h-[62%] w-[62%] rounded-[56%_44%_37%_63%/42%_58%_42%_58%] bg-[#819688]" />

              <div className="absolute right-[13%] top-[16%] h-24 w-24 rounded-full bg-[#efe6d8]" />

              <div className="absolute bottom-[14%] left-[12%] h-28 w-28 rounded-full border border-[#415a72]/30" />

              <div className="absolute bottom-[17%] right-[16%] h-20 w-20 rounded-[60%_40%_60%_40%] bg-[#b79b72]" />

              <div className="absolute left-[48%] top-[31%] h-28 w-px rotate-[17deg] bg-white/65" />

              <div className="absolute bottom-[28%] left-[22%] h-px w-40 -rotate-[25deg] bg-[#415a72]/30" />

              <div className="absolute right-[37%] top-[25%] h-16 w-16 rounded-full bg-white/45" />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 pb-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl rounded-[2.8rem] bg-[#223748] px-8 py-16 text-center text-white sm:px-12 lg:px-16 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d4be95]">
            AAN Psychotherapy
          </p>

          <h2 className="mx-auto mt-5 max-w-4xl text-4xl font-bold leading-tight sm:text-6xl">
            {isArabic
              ? "يمكنك البدء عندما تشعر أنك مستعد."
              : "You can begin whenever you feel ready."}
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/70">
            {isArabic
              ? "سواء كنت تعرف ما تمر به أو لا تزال تحاول فهمه، يمكنك البدء بخطوات بسيطة والعثور على المعالج الذي يتوافق مع احتياجاتك."
              : "Whether you know exactly what you are facing or are still trying to understand it, you can begin with a few simple steps and find a therapist who corresponds to your needs."}
          </p>

          <div className="mt-10">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center rounded-2xl bg-[#d4be95] px-10 py-5 text-lg font-semibold text-[#223748] transition hover:-translate-y-0.5 hover:bg-[#e5d3b2]"
            >
              {isArabic
                ? "احجز جلسة عبر الإنترنت"
                : "Book an Online Session"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}