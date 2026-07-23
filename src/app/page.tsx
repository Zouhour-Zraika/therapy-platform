"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import { Language } from "./lib/translations";

const supportTopics = [
  {
    slug: "anxiety",
    number: "01",
    enTitle: "Anxiety",
    arTitle: "القلق",
    enSubtitle: "When worry begins to take up too much space.",
    arSubtitle: "عندما يبدأ القلق في شغل مساحة أكبر من اللازم.",
    enText:
      "Learn about persistent worry, physical tension, panic, and the ways anxiety can affect everyday life.",
    arText:
      "تعرّف إلى القلق المستمر والتوتر الجسدي ونوبات الهلع، وكيف يمكن للقلق أن يؤثر في الحياة اليومية.",
    background: "bg-[#dce6df]",
    accent: "bg-[#789080]",
    shape:
      "rounded-[46%_54%_64%_36%/40%_42%_58%_60%]",
  },
  {
    slug: "depression",
    number: "02",
    enTitle: "Depression",
    arTitle: "الاكتئاب",
    enSubtitle: "When daily life feels heavier than usual.",
    arSubtitle: "عندما تصبح الحياة اليومية أثقل من المعتاد.",
    enText:
      "Explore low mood, loss of energy, isolation, and the emotional exhaustion that can accompany depression.",
    arText:
      "تعرّف إلى انخفاض المزاج وفقدان الطاقة والعزلة والإرهاق النفسي الذي قد يصاحب الاكتئاب.",
    background: "bg-[#e2e5eb]",
    accent: "bg-[#7d8798]",
    shape:
      "rounded-[62%_38%_42%_58%/50%_35%_65%_50%]",
  },
  {
    slug: "relationships",
    number: "03",
    enTitle: "Relationships",
    arTitle: "العلاقات",
    enSubtitle: "When connection becomes difficult.",
    arSubtitle: "عندما يصبح التواصل أكثر صعوبة.",
    enText:
      "Explore communication, emotional distance, recurring conflict, boundaries, and relationship patterns.",
    arText:
      "تعرّف إلى التواصل والمسافة العاطفية والخلافات المتكررة والحدود والأنماط داخل العلاقات.",
    background: "bg-[#eee0d6]",
    accent: "bg-[#b28772]",
    shape:
      "rounded-[35%_65%_56%_44%/60%_48%_52%_40%]",
  },
  {
    slug: "trauma",
    number: "04",
    enTitle: "Trauma",
    arTitle: "الصدمات النفسية",
    enSubtitle:
      "When a difficult experience continues to feel present.",
    arSubtitle:
      "عندما تستمر تجربة مؤلمة في التأثير عليك.",
    enText:
      "Understand emotional responses to overwhelming experiences and how a safe therapeutic relationship may support recovery.",
    arText:
      "تعرّف إلى الاستجابات النفسية للتجارب الصعبة، وكيف يمكن للعلاقة العلاجية الآمنة أن تدعم التعافي.",
    background: "bg-[#e5dfd4]",
    accent: "bg-[#9b8769]",
    shape:
      "rounded-[54%_46%_34%_66%/42%_58%_42%_58%]",
  },
  {
    slug: "stress-burnout",
    number: "05",
    enTitle: "Stress & Burnout",
    arTitle: "الضغط والإرهاق النفسي",
    enSubtitle:
      "When your mind and body have been carrying too much.",
    arSubtitle:
      "عندما يتحمل ذهنك وجسدك أكثر مما ينبغي.",
    enText:
      "Recognise chronic stress, emotional overload, exhaustion, and a loss of balance between demands and recovery.",
    arText:
      "تعرّف إلى الضغط المزمن والحمل النفسي والإرهاق وفقدان التوازن بين متطلبات الحياة والراحة.",
    background: "bg-[#dce5e6]",
    accent: "bg-[#6f898e]",
    shape:
      "rounded-[45%_55%_38%_62%/58%_38%_62%_42%]",
  },
  {
    slug: "self-esteem",
    number: "06",
    enTitle: "Self-esteem",
    arTitle: "تقدير الذات",
    enSubtitle:
      "When the way you see yourself becomes painful.",
    arSubtitle:
      "عندما تصبح نظرتك إلى نفسك مصدرًا للألم.",
    enText:
      "Explore self-criticism, confidence, shame, perfectionism, and the possibility of building a kinder relationship with yourself.",
    arText:
      "تعرّف إلى نقد الذات والثقة والخجل والسعي إلى الكمال، وإمكانية بناء علاقة أكثر لطفًا مع نفسك.",
    background: "bg-[#e8dfeb]",
    accent: "bg-[#907799]",
    shape:
      "rounded-[60%_40%_60%_40%/38%_62%_38%_62%]",
  },
];

const bookingSteps = [
  {
    number: "01",
    enTitle: "Tell us what support you need",
    arTitle: "أخبرنا بنوع الدعم الذي تحتاجه",
    enText:
      "Answer a few simple questions about what you are going through and your therapist preferences.",
    arText:
      "أجب عن بعض الأسئلة البسيطة حول ما تمر به وتفضيلاتك المتعلقة بالمعالج.",
  },
  {
    number: "02",
    enTitle: "Explore matching options",
    arTitle: "اطّلع على الخيارات المناسبة",
    enText:
      "View therapists whose experience and available times correspond to your selected preferences.",
    arText:
      "اطّلع على المعالجين الذين تتوافق خبراتهم ومواعيدهم المتاحة مع التفضيلات التي اخترتها.",
  },
  {
    number: "03",
    enTitle: "Choose a session and confirm",
    arTitle: "اختر جلستك وأكّد الحجز",
    enText:
      "Select your therapist and time, then sign in or create an account to complete your booking securely.",
    arText:
      "اختر المعالج والموعد، ثم سجّل الدخول أو أنشئ حسابًا لإكمال الحجز بأمان.",
  },
];

const benefits = [
  {
    enTitle: "Private and confidential",
    arTitle: "خصوصية وسرية",
    enText:
      "Your sessions and personal information are handled with care and confidentiality.",
    arText:
      "يتم التعامل مع جلساتك ومعلوماتك الشخصية بعناية وخصوصية تامة.",
  },
  {
    enTitle: "Guided and easy to use",
    arTitle: "تجربة موجهة وسهلة",
    enText:
      "A simple booking journey helps you move forward without unnecessary steps.",
    arText:
      "مسار حجز بسيط يساعدك على المتابعة دون خطوات معقدة أو غير ضرورية.",
  },
  {
    enTitle: "Qualified therapists",
    arTitle: "معالجون مؤهلون",
    enText:
      "Receive professional support from therapists with relevant experience and therapeutic approaches.",
    arText:
      "احصل على دعم مهني من معالجين ذوي خبرات وأساليب علاجية متنوعة.",
  },
];

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const savedLanguage = localStorage.getItem(
      "language"
    ) as Language;

    if (
      savedLanguage === "en" ||
      savedLanguage === "ar"
    ) {
      setLanguage(savedLanguage);
    }

    const handleLanguageChange = () => {
      const updatedLanguage = localStorage.getItem(
        "language"
      ) as Language;

      if (
        updatedLanguage === "en" ||
        updatedLanguage === "ar"
      ) {
        setLanguage(updatedLanguage);
      }
    };

    window.addEventListener(
      "storage",
      handleLanguageChange
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleLanguageChange
      );
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
      <section className="relative overflow-hidden px-5 pb-20 pt-10 sm:px-8 lg:px-12 lg:pb-28 lg:pt-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-[#cbb48c]/20 blur-3xl" />

          <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-[#223748]/10 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <div
            className={
              isArabic ? "text-right" : "text-left"
            }
          >
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#b39668]">
              {isArabic
                ? "مساحة آمنة للحديث والدعم"
                : "A SAFE SPACE FOR SUPPORT"}
            </p>

            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-[#223748] sm:text-5xl lg:text-7xl">
              {isArabic
                ? "لست مضطرًا لمواجهة كل شيء وحدك."
                : "You don't have to face everything alone."}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4e5d68] sm:text-xl">
              {isArabic
                ? "نوفر مساحة آمنة وسرية تساعدك على فهم مشاعرك، والتعامل مع القلق والاكتئاب وضغوط الحياة، واستعادة توازنك النفسي مع مختصين مؤهلين."
                : "We provide a safe and confidential space to help you understand your emotions, cope with anxiety, depression, and life challenges, and regain emotional balance with qualified professionals."}
            </p>

            <div className="mt-8">
              <Link
                href="/booking"
                className="inline-flex items-center justify-center rounded-2xl bg-[#415a72] px-8 py-4 text-center text-lg font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#32495f]"
              >
                {isArabic
                  ? "احجز جلسة عبر الإنترنت"
                  : "Book an Online Session"}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-5 text-sm text-[#5f6d76]">
              <span>
                ✓{" "}
                {isArabic
                  ? "جلسات خاصة وسرية"
                  : "Private sessions"}
              </span>

              <span>
                ✓{" "}
                {isArabic
                  ? "حجز آمن وبسيط"
                  : "Simple and secure booking"}
              </span>

              <span>
                ✓{" "}
                {isArabic
                  ? "دعم بالعربية والإنجليزية"
                  : "Arabic and English support"}
              </span>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[500px] overflow-hidden rounded-[2rem] border border-[#d8c8aa] bg-white p-3 shadow-2xl">
              <Image
                src="/aan-logo-clean.png"
                alt="AAN Psychotherapy"
                width={800}
                height={1200}
                priority
                className="h-auto w-full rounded-[1.5rem] object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Therapists introduction */}
      <section className="px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl rounded-[2.5rem] border border-[#e7dcc9] bg-white p-7 shadow-sm sm:p-10 lg:p-12">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#b39668]">
                {isArabic
                  ? "تعرّف إلى فريقنا"
                  : "MEET OUR TEAM"}
              </p>

              <h2 className="mt-4 text-3xl font-bold leading-tight text-[#223748] sm:text-5xl">
                {isArabic
                  ? "تعرّف إلى المعالجين وخبراتهم المهنية."
                  : "Discover our therapists and their professional experience."}
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#66727a]">
                {isArabic
                  ? "اقرأ الملف المهني لكل معالج وتعرّف إلى خبرته ومجالات عمله وأساليبه العلاجية قبل بدء الحجز."
                  : "Read each therapist's professional profile and learn about their experience, areas of work, and therapeutic approaches before beginning your booking."}
              </p>
            </div>

            <Link
              href="/therapists"
              className="inline-flex items-center justify-center rounded-2xl border-2 border-[#b39668] px-7 py-4 text-center text-lg font-semibold text-[#415a72] transition hover:bg-[#b39668] hover:text-white"
            >
              {isArabic
                ? "تعرّف إلى المعالجين"
                : "Meet Our Therapists"}
            </Link>
          </div>
        </div>
      </section>

      {/* Areas of support introduction */}
      <section className="px-5 pb-8 pt-20 sm:px-8 lg:px-12 lg:pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#b39668]">
                {isArabic
                  ? "مجالات الدعم"
                  : "AREAS OF SUPPORT"}
              </p>
            </div>

            <div>
              <h2 className="max-w-4xl text-3xl font-bold leading-tight text-[#223748] sm:text-5xl lg:text-6xl">
                {isArabic
                  ? "قد يكون إعطاء اسم لما تشعر به خطوة أولى."
                  : "Giving words to what you feel can be a first step."}
              </h2>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-[#66727a]">
                {isArabic
                  ? "استكشف مجموعة من التحديات النفسية والعاطفية، وتعرّف إلى الطريقة التي يمكن للعلاج النفسي أن يساعدك بها على الفهم والتعافي والتغيير."
                  : "Explore emotional and psychological challenges, and learn how psychotherapy may support understanding, recovery, and meaningful change."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Areas of support editorial cards */}
      <section className="px-5 pb-20 pt-10 sm:px-8 lg:px-12 lg:pb-28">
        <div className="mx-auto max-w-7xl space-y-8 lg:space-y-12">
          {supportTopics.map((topic, index) => {
            const illustrationFirst = index % 2 !== 0;

            return (
              <article
                key={topic.slug}
                className="overflow-hidden rounded-[2.5rem] border border-[#e5dccd] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="grid lg:grid-cols-2">
                  <div
                    className={`relative min-h-[300px] overflow-hidden p-8 sm:min-h-[390px] sm:p-10 ${
                      topic.background
                    } ${
                      illustrationFirst
                        ? "lg:order-1"
                        : "lg:order-2"
                    }`}
                  >
                    <span
                      className={`absolute top-8 text-sm font-bold tracking-[0.25em] text-[#415a72]/60 ${
                        isArabic ? "right-8" : "left-8"
                      }`}
                    >
                      {topic.number}
                    </span>

                    <div
                      className={`absolute left-[18%] top-[18%] h-[62%] w-[62%] opacity-90 ${topic.accent} ${topic.shape}`}
                    />

                    <div className="absolute bottom-[15%] right-[14%] h-28 w-28 rounded-full border border-white/70" />

                    <div className="absolute right-[23%] top-[20%] h-14 w-14 rounded-full bg-white/60" />

                    <div className="absolute bottom-[21%] left-[14%] h-px w-32 -rotate-[22deg] bg-[#415a72]/30" />

                    <div className="absolute left-[46%] top-[37%] h-24 w-px rotate-[18deg] bg-white/60" />
                  </div>

                  <div
                    className={`flex min-h-[300px] flex-col justify-center p-8 sm:p-12 lg:p-16 ${
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
                      {isArabic
                        ? topic.arTitle
                        : topic.enTitle}
                    </h3>

                    <p className="mt-5 text-xl font-medium leading-8 text-[#415a72]">
                      {isArabic
                        ? topic.arSubtitle
                        : topic.enSubtitle}
                    </p>

                    <p className="mt-4 max-w-xl leading-8 text-[#69747a]">
                      {isArabic
                        ? topic.arText
                        : topic.enText}
                    </p>

                    <Link
                      href={`/support/${topic.slug}`}
                      className="mt-8 inline-flex w-fit items-center gap-3 border-b border-[#b39668] pb-2 font-semibold text-[#415a72] transition hover:text-[#9b7849]"
                    >
                      {isArabic
                        ? "اقرأ المزيد"
                        : "Learn more"}

                      <span
                        aria-hidden="true"
                        className={
                          isArabic ? "rotate-180" : ""
                        }
                      >
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}

          <div className="pt-4 text-center">
            <Link
              href="/support"
              className="inline-flex items-center justify-center rounded-2xl border-2 border-[#b39668] bg-transparent px-8 py-4 text-lg font-semibold text-[#415a72] transition hover:bg-[#b39668] hover:text-white"
            >
              {isArabic
                ? "استكشف جميع مجالات الدعم"
                : "Explore All Areas of Support"}
            </Link>
          </div>
        </div>
      </section>
            {/* Booking journey */}
      <section className="bg-[#223748] px-5 py-20 text-white sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#d4be95]">
              {isArabic ? "كيف يتم الحجز؟" : "HOW BOOKING WORKS"}
            </p>

            <h2 className="mt-4 text-3xl font-bold sm:text-5xl">
              {isArabic
                ? "رحلة بسيطة وموجهة لحجز جلستك"
                : "A simple guided journey to book your session"}
            </h2>

            <p className="mt-6 text-lg leading-8 text-white/70">
              {isArabic
                ? "بعد أن تتعرف على المعلومات، سنساعدك في الوصول إلى المعالج المناسب من خلال خطوات بسيطة."
                : "After exploring the information, we'll guide you toward the therapist who best matches your needs."}
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {bookingSteps.map((step) => (
              <article
                key={step.number}
                className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur"
              >
                <span className="text-5xl font-bold text-[#d4be95]">
                  {step.number}
                </span>

                <h3 className="mt-6 text-2xl font-bold">
                  {isArabic ? step.arTitle : step.enTitle}
                </h3>

                <p className="mt-5 leading-7 text-white/70">
                  {isArabic ? step.arText : step.enText}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center rounded-2xl bg-[#d4be95] px-8 py-4 text-lg font-semibold text-[#223748] transition hover:-translate-y-0.5 hover:bg-[#e5d3b2]"
            >
              {isArabic ? "ابدأ الحجز" : "Start Your Booking"}
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#b39668]">
              {isArabic ? "لماذا AAN؟" : "WHY AAN"}
            </p>

            <h2 className="mt-4 text-3xl font-bold text-[#223748] sm:text-5xl">
              {isArabic
                ? "تجربة هادئة وواضحة منذ اللحظة الأولى."
                : "A calm and thoughtful experience from the very beginning."}
            </h2>
          </div>

          <div className="mt-14 grid gap-7 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <article
                key={benefit.enTitle}
                className="rounded-3xl border border-[#ece2d2] bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="h-1 w-16 rounded-full bg-[#b39668]" />

                <h3 className="mt-6 text-2xl font-bold text-[#223748]">
                  {isArabic
                    ? benefit.arTitle
                    : benefit.enTitle}
                </h3>

                <p className="mt-5 leading-8 text-[#68747b]">
                  {isArabic
                    ? benefit.arText
                    : benefit.enText}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Unsure section */}
      <section className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#ece2d2] p-10 sm:p-14 lg:p-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#8f744d]">
                {isArabic
                  ? "لست متأكدًا مما تشعر به؟"
                  : "NOT SURE WHAT YOU ARE EXPERIENCING?"}
              </p>

              <h2 className="mt-4 text-3xl font-bold text-[#223748] sm:text-5xl">
                {isArabic
                  ? "لا تحتاج إلى معرفة كل الإجابات قبل أن تبدأ."
                  : "You don't need to have all the answers before reaching out."}
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5f686e]">
                {isArabic
                  ? "ليس من الضروري أن تعرف التشخيص أو أن تكون قادرًا على وصف كل ما تشعر به. يمكن للمعالج مساعدتك على فهم تجربتك خطوة بخطوة."
                  : "You don't need a diagnosis or the perfect words to describe what you're feeling. A therapist can help you understand your experience, one conversation at a time."}
              </p>
            </div>

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
      </section>

      {/* Final CTA */}
      <section className="px-5 pb-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl rounded-[2.8rem] bg-[#223748] px-10 py-16 text-center text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d4be95]">
            AAN Psychotherapy
          </p>

          <h2 className="mx-auto mt-5 max-w-4xl text-4xl font-bold leading-tight sm:text-6xl">
            {isArabic
              ? "ابدأ رحلتك عندما تشعر أنك مستعد."
              : "Begin your journey whenever you feel ready."}
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/70">
            {isArabic
              ? "سواء كنت تعرف تمامًا ما تمر به أو كنت لا تزال تحاول فهمه، نحن هنا لمساعدتك على اتخاذ الخطوة التالية."
              : "Whether you already know what you're facing or you're only beginning to understand it, we're here to help you take the next step."}
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