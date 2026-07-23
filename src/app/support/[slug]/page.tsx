"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import SupportIllustration from "../../components/SupportIllustration";
import { Language } from "../../lib/translations";

type LocalizedText = {
  en: string;
  ar: string;
};

type SupportTopic = {
  slug: string;
  number: string;
  title: LocalizedText;
  eyebrow: LocalizedText;
  subtitle: LocalizedText;
  introduction: LocalizedText;
  definition: LocalizedText;
  signsIntro: LocalizedText;
  signs: LocalizedText[];
  seekHelpIntro: LocalizedText;
  seekHelpPoints: LocalizedText[];
  therapyIntro: LocalizedText;
  therapyBenefits: {
    number: string;
    title: LocalizedText;
    text: LocalizedText;
  }[];
  approachesIntro: LocalizedText;
  approaches: {
    title: LocalizedText;
    text: LocalizedText;
  }[];
  faq: {
    question: LocalizedText;
    answer: LocalizedText;
  }[];
  background: string;
  accent: string;
  secondaryAccent: string;
  shape: string;
};

const supportTopics: Record<string, SupportTopic> = {
  anxiety: {
    slug: "anxiety",
    number: "01",

    title: {
      en: "Anxiety",
      ar: "القلق",
    },

    eyebrow: {
      en: "UNDERSTANDING ANXIETY",
      ar: "فهم القلق",
    },

    subtitle: {
      en: "When worry begins to take up too much space.",
      ar: "عندما يبدأ القلق في شغل مساحة أكبر من اللازم.",
    },

    introduction: {
      en: "Anxiety is a natural response to uncertainty, pressure, or perceived danger. It can become difficult when worry remains present for long periods, feels hard to control, or begins to affect your daily life.",
      ar: "القلق استجابة طبيعية لعدم اليقين أو الضغط أو الشعور بالخطر. لكنه قد يصبح صعبًا عندما يستمر لفترات طويلة أو يصعب التحكم فيه أو يبدأ في التأثير في حياتك اليومية.",
    },

    definition: {
      en: "Anxiety can affect thoughts, emotions, the body, and behaviour. Some people experience constant worry, while others notice panic, physical tension, avoidance, irritability, or difficulty feeling safe even when no immediate danger is present.",
      ar: "يمكن أن يؤثر القلق في الأفكار والمشاعر والجسد والسلوك. قد يعاني بعض الأشخاص من تفكير مستمر، بينما يلاحظ آخرون نوبات هلع أو توترًا جسديًا أو تجنبًا أو انفعالًا أو صعوبة في الشعور بالأمان حتى في غياب خطر مباشر.",
    },

    signsIntro: {
      en: "Anxiety can look different from one person to another. Common experiences may include:",
      ar: "قد يظهر القلق بصورة مختلفة من شخص إلى آخر. ومن التجارب الشائعة:",
    },

    signs: [
      {
        en: "Persistent worry that feels difficult to control",
        ar: "قلق مستمر يصعب التحكم فيه",
      },
      {
        en: "Restlessness, tension, or feeling constantly alert",
        ar: "التململ أو التوتر أو الشعور الدائم بالتأهب",
      },
      {
        en: "Rapid heartbeat, shortness of breath, or dizziness",
        ar: "تسارع ضربات القلب أو ضيق التنفس أو الدوار",
      },
      {
        en: "Difficulty concentrating or making decisions",
        ar: "صعوبة التركيز أو اتخاذ القرارات",
      },
      {
        en: "Avoiding situations because they feel overwhelming",
        ar: "تجنب مواقف معينة لأنها تبدو مرهقة أو مخيفة",
      },
      {
        en: "Sleep difficulties, fatigue, or irritability",
        ar: "صعوبات النوم أو التعب أو الانفعال",
      },
    ],

    seekHelpIntro: {
      en: "You may consider speaking with a therapist when anxiety begins to interfere with your wellbeing, relationships, work, studies, or ability to participate in everyday life.",
      ar: "قد يكون من المفيد التحدث مع معالج عندما يبدأ القلق في التأثير في صحتك النفسية أو علاقاتك أو عملك أو دراستك أو قدرتك على ممارسة حياتك اليومية.",
    },

    seekHelpPoints: [
      {
        en: "Worry occupies a large part of your day",
        ar: "يستحوذ القلق على جزء كبير من يومك",
      },
      {
        en: "You avoid people, places, or responsibilities",
        ar: "تتجنب أشخاصًا أو أماكن أو مسؤوليات",
      },
      {
        en: "Physical symptoms feel intense or frightening",
        ar: "تبدو الأعراض الجسدية شديدة أو مخيفة",
      },
      {
        en: "Your usual coping strategies are no longer helping",
        ar: "لم تعد طرق التأقلم المعتادة تساعدك",
      },
    ],

    therapyIntro: {
      en: "Psychotherapy can help you understand what contributes to anxiety and develop more balanced ways of responding to anxious thoughts, emotions, and physical sensations.",
      ar: "يمكن للعلاج النفسي أن يساعدك على فهم العوامل التي تسهم في القلق وتطوير طرق أكثر توازنًا للتعامل مع الأفكار والمشاعر والأحاسيس الجسدية المرتبطة به.",
    },

    therapyBenefits: [
      {
        number: "01",
        title: {
          en: "Recognise triggers",
          ar: "التعرف إلى المحفزات",
        },
        text: {
          en: "Explore situations, thoughts, and experiences that intensify anxiety.",
          ar: "استكشاف المواقف والأفكار والتجارب التي تزيد من شدة القلق.",
        },
      },
      {
        number: "02",
        title: {
          en: "Understand patterns",
          ar: "فهم الأنماط",
        },
        text: {
          en: "Notice cycles of worry, avoidance, reassurance seeking, and temporary relief.",
          ar: "ملاحظة دوائر القلق والتجنب وطلب الطمأنة والراحة المؤقتة.",
        },
      },
      {
        number: "03",
        title: {
          en: "Build coping skills",
          ar: "بناء مهارات للتأقلم",
        },
        text: {
          en: "Develop practical ways to regulate emotions and respond to stress.",
          ar: "تطوير طرق عملية لتنظيم المشاعر والاستجابة للضغط.",
        },
      },
      {
        number: "04",
        title: {
          en: "Restore confidence",
          ar: "استعادة الثقة",
        },
        text: {
          en: "Gradually reconnect with situations that anxiety may have made difficult.",
          ar: "العودة تدريجيًا إلى المواقف التي جعلها القلق أكثر صعوبة.",
        },
      },
    ],

    approachesIntro: {
      en: "The therapeutic approach will depend on your experience, needs, preferences, and the therapist's clinical assessment.",
      ar: "يعتمد الأسلوب العلاجي على تجربتك واحتياجاتك وتفضيلاتك والتقييم المهني للمعالج.",
    },

    approaches: [
      {
        title: {
          en: "Cognitive Behavioural Therapy",
          ar: "العلاج المعرفي السلوكي",
        },
        text: {
          en: "Explores connections between thoughts, emotions, behaviours, and physical responses.",
          ar: "يستكشف العلاقة بين الأفكار والمشاعر والسلوكيات والاستجابات الجسدية.",
        },
      },
      {
        title: {
          en: "Acceptance-based approaches",
          ar: "الأساليب القائمة على التقبل",
        },
        text: {
          en: "Support a different relationship with difficult thoughts and emotions.",
          ar: "تساعد على بناء علاقة مختلفة مع الأفكار والمشاعر الصعبة.",
        },
      },
      {
        title: {
          en: "Psychodynamic therapy",
          ar: "العلاج الديناميكي النفسي",
        },
        text: {
          en: "Explores deeper emotional patterns and past experiences that may shape anxiety.",
          ar: "يستكشف الأنماط النفسية العميقة والتجارب السابقة التي قد تؤثر في القلق.",
        },
      },
    ],

    faq: [
      {
        question: {
          en: "Is anxiety always a mental health disorder?",
          ar: "هل يُعد القلق دائمًا اضطرابًا نفسيًا؟",
        },
        answer: {
          en: "No. Anxiety is a normal human response. It may require professional support when it becomes persistent, overwhelming, difficult to control, or disruptive to daily life.",
          ar: "لا. القلق استجابة إنسانية طبيعية. وقد يحتاج إلى دعم مهني عندما يصبح مستمرًا أو شديدًا أو يصعب التحكم فيه أو يؤثر في الحياة اليومية.",
        },
      },
      {
        question: {
          en: "Can therapy help with panic attacks?",
          ar: "هل يمكن للعلاج أن يساعد في نوبات الهلع؟",
        },
        answer: {
          en: "Therapy may help you understand panic symptoms, reduce fear of those sensations, identify triggers, and develop more effective responses.",
          ar: "قد يساعد العلاج على فهم أعراض الهلع وتقليل الخوف من الأحاسيس الجسدية والتعرف إلى المحفزات وتطوير استجابات أكثر فاعلية.",
        },
      },
      {
        question: {
          en: "Do I need to know what causes my anxiety?",
          ar: "هل يجب أن أعرف سبب قلقي قبل بدء العلاج؟",
        },
        answer: {
          en: "No. You can begin therapy even when the cause is unclear. Understanding your experience can be part of the therapeutic process.",
          ar: "لا. يمكنك بدء العلاج حتى عندما لا يكون السبب واضحًا. وقد يكون فهم تجربتك جزءًا من العملية العلاجية.",
        },
      },
    ],

    background: "bg-[#dce7df]",
    accent: "bg-[#789080]",
    secondaryAccent: "bg-[#f6f2ea]",
    shape: "rounded-[46%_54%_64%_36%/40%_42%_58%_60%]",
  },

  depression: {
    slug: "depression",
    number: "02",

    title: {
      en: "Depression",
      ar: "الاكتئاب",
    },

    eyebrow: {
      en: "UNDERSTANDING DEPRESSION",
      ar: "فهم الاكتئاب",
    },

    subtitle: {
      en: "When everyday life begins to feel heavier.",
      ar: "عندما تبدأ الحياة اليومية في الشعور بأنها أكثر ثقلًا.",
    },

    introduction: {
      en: "Depression can affect how you feel, think, connect with others, and move through everyday life. It may involve sadness, but it can also appear as emptiness, exhaustion, irritability, numbness, or a loss of interest.",
      ar: "يمكن أن يؤثر الاكتئاب في مشاعرك وأفكارك وعلاقاتك وطريقة عيشك لحياتك اليومية. وقد يظهر في صورة حزن، لكنه قد يظهر أيضًا كفراغ أو إرهاق أو انفعال أو خدر نفسي أو فقدان للاهتمام.",
    },

    definition: {
      en: "Depression is more than having a difficult day or temporarily feeling low. It may continue over time and affect energy, sleep, motivation, appetite, concentration, self-esteem, relationships, and hope for the future.",
      ar: "الاكتئاب أكثر من مجرد يوم صعب أو انخفاض مؤقت في المزاج. فقد يستمر مع الوقت ويؤثر في الطاقة والنوم والدافع والشهية والتركيز وتقدير الذات والعلاقات والأمل في المستقبل.",
    },

    signsIntro: {
      en: "Not everyone experiences depression in the same way. Common signs may include:",
      ar: "لا يختبر الجميع الاكتئاب بالطريقة نفسها. ومن العلامات الشائعة:",
    },

    signs: [
      {
        en: "Persistent sadness, emptiness, or emotional numbness",
        ar: "حزن أو فراغ أو خدر عاطفي مستمر",
      },
      {
        en: "Loss of interest or pleasure",
        ar: "فقدان الاهتمام أو المتعة",
      },
      {
        en: "Low energy or difficulty completing daily tasks",
        ar: "انخفاض الطاقة أو صعوبة إنجاز المهام اليومية",
      },
      {
        en: "Changes in sleep or appetite",
        ar: "تغيرات في النوم أو الشهية",
      },
      {
        en: "Withdrawal from relationships or activities",
        ar: "الانسحاب من العلاقات أو الأنشطة",
      },
      {
        en: "Self-criticism, guilt, or hopelessness",
        ar: "نقد الذات أو الشعور بالذنب أو اليأس",
      },
    ],

    seekHelpIntro: {
      en: "Professional support may be helpful when low mood or emotional disconnection persists, affects important areas of life, or becomes difficult to manage alone.",
      ar: "قد يكون الدعم المهني مفيدًا عندما يستمر انخفاض المزاج أو الانفصال العاطفي أو يؤثر في جوانب مهمة من الحياة أو يصبح من الصعب التعامل معه بمفردك.",
    },

    seekHelpPoints: [
      {
        en: "Daily responsibilities feel increasingly difficult",
        ar: "تصبح المسؤوليات اليومية أكثر صعوبة",
      },
      {
        en: "You feel disconnected from yourself or others",
        ar: "تشعر بالانفصال عن نفسك أو الآخرين",
      },
      {
        en: "You have stopped enjoying things that once mattered",
        ar: "لم تعد تستمتع بالأشياء التي كانت مهمة بالنسبة إليك",
      },
      {
        en: "Your mood has remained low for an extended period",
        ar: "استمر انخفاض مزاجك لفترة طويلة",
      },
    ],

    therapyIntro: {
      en: "Therapy can provide a confidential space to understand your experience, explore contributing factors, and gradually rebuild connection, motivation, and emotional balance.",
      ar: "يمكن للعلاج أن يوفر مساحة سرية لفهم تجربتك واستكشاف العوامل المؤثرة والعمل تدريجيًا على استعادة التواصل والدافع والتوازن النفسي.",
    },

    therapyBenefits: [
      {
        number: "01",
        title: {
          en: "Name the experience",
          ar: "فهم التجربة وتسميتها",
        },
        text: {
          en: "Put words to emotions that may feel confusing, distant, or overwhelming.",
          ar: "إيجاد كلمات للمشاعر التي قد تبدو مربكة أو بعيدة أو شديدة.",
        },
      },
      {
        number: "02",
        title: {
          en: "Explore contributing factors",
          ar: "استكشاف العوامل المؤثرة",
        },
        text: {
          en: "Understand emotional, relational, behavioural, and situational influences.",
          ar: "فهم العوامل النفسية والعلاقية والسلوكية والظرفية.",
        },
      },
      {
        number: "03",
        title: {
          en: "Rebuild daily structure",
          ar: "إعادة بناء الروتين اليومي",
        },
        text: {
          en: "Create manageable steps toward activity, connection, and self-care.",
          ar: "وضع خطوات قابلة للتطبيق نحو النشاط والتواصل والعناية بالنفس.",
        },
      },
      {
        number: "04",
        title: {
          en: "Develop self-compassion",
          ar: "تطوير التعاطف مع الذات",
        },
        text: {
          en: "Challenge harsh self-judgement and build a more supportive inner relationship.",
          ar: "مواجهة الأحكام القاسية على الذات وبناء علاقة داخلية أكثر دعمًا.",
        },
      },
    ],

    approachesIntro: {
      en: "Therapy is adapted to the individual. Different approaches may be used according to your needs and the therapist's professional assessment.",
      ar: "يتم تكييف العلاج مع كل شخص. وقد تُستخدم أساليب مختلفة وفقًا لاحتياجاتك والتقييم المهني للمعالج.",
    },

    approaches: [
      {
        title: {
          en: "Cognitive Behavioural Therapy",
          ar: "العلاج المعرفي السلوكي",
        },
        text: {
          en: "Works with patterns of thinking and behaviour that may maintain low mood.",
          ar: "يعمل على أنماط التفكير والسلوك التي قد تسهم في استمرار انخفاض المزاج.",
        },
      },
      {
        title: {
          en: "Interpersonal therapy",
          ar: "العلاج بين الشخصي",
        },
        text: {
          en: "Explores relationships, role changes, conflict, grief, and social connection.",
          ar: "يستكشف العلاقات وتغير الأدوار والخلافات والحزن والتواصل الاجتماعي.",
        },
      },
      {
        title: {
          en: "Psychodynamic therapy",
          ar: "العلاج الديناميكي النفسي",
        },
        text: {
          en: "Explores emotional patterns, relationships, and earlier experiences.",
          ar: "يستكشف الأنماط النفسية والعلاقات والتجارب السابقة.",
        },
      },
    ],

    faq: [
      {
        question: {
          en: "Is depression the same as sadness?",
          ar: "هل الاكتئاب هو نفسه الحزن؟",
        },
        answer: {
          en: "Not necessarily. Sadness is a natural emotion, while depression may involve persistent changes in mood, energy, motivation, thinking, and functioning.",
          ar: "ليس بالضرورة. الحزن شعور طبيعي، بينما قد يشمل الاكتئاب تغيرات مستمرة في المزاج والطاقة والدافع والتفكير والقدرة على أداء المهام.",
        },
      },
      {
        question: {
          en: "Can I seek therapy even if I am still functioning?",
          ar: "هل يمكنني طلب العلاج حتى لو كنت ما زلت أؤدي مسؤولياتي؟",
        },
        answer: {
          en: "Yes. A person may continue working, studying, or caring for others while experiencing significant internal distress.",
          ar: "نعم. قد يستمر الشخص في العمل أو الدراسة أو رعاية الآخرين رغم معاناته من ضغط نفسي داخلي كبير.",
        },
      },
      {
        question: {
          en: "How quickly does therapy help?",
          ar: "كم من الوقت يحتاج العلاج ليساعدني؟",
        },
        answer: {
          en: "There is no single timeline. Progress depends on your experience, goals, circumstances, therapeutic approach, and relationship with your therapist.",
          ar: "لا توجد مدة واحدة تناسب الجميع. يعتمد التقدم على تجربتك وأهدافك وظروفك والأسلوب العلاجي والعلاقة مع المعالج.",
        },
      },
    ],

    background: "bg-[#e1e5ec]",
    accent: "bg-[#7f899a]",
    secondaryAccent: "bg-[#f7f4ed]",
    shape: "rounded-[62%_38%_42%_58%/50%_35%_65%_50%]",
  },

  relationships: {
    slug: "relationships",
    number: "03",

    title: {
      en: "Relationships",
      ar: "العلاقات",
    },

    eyebrow: {
      en: "UNDERSTANDING RELATIONSHIPS",
      ar: "فهم العلاقات",
    },

    subtitle: {
      en: "When connection becomes difficult or painful.",
      ar: "عندما يصبح التواصل صعبًا أو مؤلمًا.",
    },

    introduction: {
      en: "Relationships can be a source of connection, meaning, and support, but they can also bring conflict, uncertainty, emotional distance, or recurring patterns that feel difficult to change.",
      ar: "يمكن أن تكون العلاقات مصدرًا للتواصل والمعنى والدعم، لكنها قد تحمل أيضًا خلافات أو عدم يقين أو بعدًا عاطفيًا أو أنماطًا متكررة يصعب تغييرها.",
    },

    definition: {
      en: "Relationship difficulties may arise between partners, family members, friends, colleagues, or within your broader patterns of attachment and connection. Therapy can explore both current challenges and the experiences that shape how you relate to others.",
      ar: "قد تظهر صعوبات العلاقات بين الشريكين أو أفراد الأسرة أو الأصدقاء أو الزملاء، أو ضمن أنماطك العامة في التعلق والتواصل. ويمكن للعلاج استكشاف التحديات الحالية والتجارب التي تشكل طريقة ارتباطك بالآخرين.",
    },

    signsIntro: {
      en: "You may notice recurring experiences such as:",
      ar: "قد تلاحظ تجارب متكررة مثل:",
    },

    signs: [
      {
        en: "Frequent conflict or unresolved arguments",
        ar: "خلافات متكررة أو مشكلات لا يتم حلها",
      },
      {
        en: "Difficulty expressing needs or emotions",
        ar: "صعوبة التعبير عن الاحتياجات أو المشاعر",
      },
      {
        en: "Emotional distance, loneliness, or disconnection",
        ar: "بعد عاطفي أو وحدة أو انفصال",
      },
      {
        en: "Problems with trust, jealousy, or boundaries",
        ar: "صعوبات في الثقة أو الغيرة أو الحدود",
      },
      {
        en: "Repeated relationship patterns",
        ar: "تكرار الأنماط نفسها داخل العلاقات",
      },
      {
        en: "Fear of abandonment, rejection, or intimacy",
        ar: "الخوف من الهجر أو الرفض أو القرب العاطفي",
      },
    ],

    seekHelpIntro: {
      en: "Therapy may be helpful when relationship difficulties repeatedly cause distress, affect emotional safety, or leave you feeling unable to create meaningful change.",
      ar: "قد يكون العلاج مفيدًا عندما تسبب صعوبات العلاقات ضغطًا متكررًا أو تؤثر في الأمان النفسي أو تجعلك تشعر بعدم القدرة على إحداث تغيير حقيقي.",
    },

    seekHelpPoints: [
      {
        en: "The same conflicts continue without resolution",
        ar: "تستمر الخلافات نفسها دون حل",
      },
      {
        en: "Communication often becomes defensive or withdrawn",
        ar: "يتحول التواصل غالبًا إلى دفاع أو انسحاب",
      },
      {
        en: "You struggle to maintain healthy boundaries",
        ar: "تجد صعوبة في الحفاظ على حدود صحية",
      },
      {
        en: "A relationship is significantly affecting your wellbeing",
        ar: "تؤثر علاقة ما بصورة كبيرة في صحتك النفسية",
      },
    ],

    therapyIntro: {
      en: "Psychotherapy can help you understand emotional needs, communication patterns, attachment experiences, boundaries, and the ways you protect yourself within relationships.",
      ar: "يمكن للعلاج النفسي أن يساعدك على فهم الاحتياجات العاطفية وأنماط التواصل وتجارب التعلق والحدود والطرق التي تحمي بها نفسك داخل العلاقات.",
    },

    therapyBenefits: [
      {
        number: "01",
        title: {
          en: "Improve communication",
          ar: "تحسين التواصل",
        },
        text: {
          en: "Learn to express needs and emotions with greater clarity.",
          ar: "تعلم التعبير عن الاحتياجات والمشاعر بصورة أكثر وضوحًا.",
        },
      },
      {
        number: "02",
        title: {
          en: "Recognise patterns",
          ar: "التعرف إلى الأنماط",
        },
        text: {
          en: "Understand cycles of pursuit, withdrawal, conflict, or avoidance.",
          ar: "فهم دوائر المطاردة والانسحاب والخلاف أو التجنب.",
        },
      },
      {
        number: "03",
        title: {
          en: "Strengthen boundaries",
          ar: "تقوية الحدود",
        },
        text: {
          en: "Develop clearer limits while remaining connected to others.",
          ar: "تطوير حدود أكثر وضوحًا مع الحفاظ على التواصل مع الآخرين.",
        },
      },
      {
        number: "04",
        title: {
          en: "Build emotional safety",
          ar: "بناء الأمان النفسي",
        },
        text: {
          en: "Create healthier ways of responding during vulnerable moments.",
          ar: "بناء طرق أكثر صحة للاستجابة في اللحظات الحساسة.",
        },
      },
    ],

    approachesIntro: {
      en: "Relationship work may take place individually or with a couple, depending on the concern and the services available.",
      ar: "قد يتم العمل على صعوبات العلاقات بصورة فردية أو مع الشريكين، وفقًا لطبيعة المشكلة والخدمات المتاحة.",
    },

    approaches: [
      {
        title: {
          en: "Couples therapy",
          ar: "العلاج الزوجي",
        },
        text: {
          en: "Supports partners in understanding conflict, communication, trust, and emotional connection.",
          ar: "يدعم الشريكين في فهم الخلافات والتواصل والثقة والترابط العاطفي.",
        },
      },
      {
        title: {
          en: "Attachment-based therapy",
          ar: "العلاج القائم على التعلق",
        },
        text: {
          en: "Explores how earlier relationships may shape current emotional needs and responses.",
          ar: "يستكشف كيف يمكن للعلاقات السابقة أن تشكل الاحتياجات والاستجابات العاطفية الحالية.",
        },
      },
      {
        title: {
          en: "Interpersonal approaches",
          ar: "الأساليب بين الشخصية",
        },
        text: {
          en: "Focus on communication, roles, transitions, grief, and current relationships.",
          ar: "تركز على التواصل والأدوار والتحولات والحزن والعلاقات الحالية.",
        },
      },
    ],

    faq: [
      {
        question: {
          en: "Do both partners need to attend therapy?",
          ar: "هل يجب أن يحضر الشريكان العلاج؟",
        },
        answer: {
          en: "Not always. Individual therapy can help you understand your own needs and relationship patterns. Couples therapy requires the participation of both partners.",
          ar: "ليس دائمًا. يمكن للعلاج الفردي مساعدتك على فهم احتياجاتك وأنماطك داخل العلاقات، بينما يتطلب العلاج الزوجي مشاركة الشريكين.",
        },
      },
      {
        question: {
          en: "Is couples therapy only for relationships in crisis?",
          ar: "هل العلاج الزوجي مخصص فقط للعلاقات التي تمر بأزمة؟",
        },
        answer: {
          en: "No. Couples may seek therapy to improve communication, navigate transitions, strengthen connection, or prevent difficulties from becoming more severe.",
          ar: "لا. قد يطلب الشريكان العلاج لتحسين التواصل أو التعامل مع التحولات أو تقوية العلاقة أو منع المشكلات من أن تصبح أكثر حدة.",
        },
      },
      {
        question: {
          en: "Can therapy repair every relationship?",
          ar: "هل يمكن للعلاج إصلاح كل علاقة؟",
        },
        answer: {
          en: "Therapy cannot guarantee a particular outcome. It can support clearer understanding, communication, decision-making, and more intentional choices.",
          ar: "لا يمكن للعلاج ضمان نتيجة معينة. لكنه يمكن أن يدعم الفهم الواضح والتواصل واتخاذ القرارات والاختيارات الأكثر وعيًا.",
        },
      },
    ],

    background: "bg-[#eee0d6]",
    accent: "bg-[#b28772]",
    secondaryAccent: "bg-[#faf5ef]",
    shape: "rounded-[35%_65%_56%_44%/60%_48%_52%_40%]",
  },
    trauma: {
    slug: "trauma",
    number: "04",

    title: {
      en: "Trauma",
      ar: "الصدمات النفسية",
    },

    eyebrow: {
      en: "UNDERSTANDING TRAUMA",
      ar: "فهم الصدمات النفسية",
    },

    subtitle: {
      en: "When a past experience still feels present.",
      ar: "عندما تستمر تجربة سابقة في الشعور بأنها حاضرة.",
    },

    introduction: {
      en: "Trauma can result from experiences that felt overwhelming, frightening, unsafe, or impossible to process at the time. Its effects may continue long after the event has ended.",
      ar: "قد تنتج الصدمة النفسية عن تجارب كانت شديدة أو مخيفة أو غير آمنة أو من الصعب استيعابها وقت حدوثها. وقد تستمر آثارها لفترة طويلة بعد انتهاء الحدث.",
    },

    definition: {
      en: "Trauma may affect emotions, memory, the nervous system, relationships, sleep, concentration, and the ability to feel safe. People can respond differently to similar experiences, and there is no single correct way to react.",
      ar: "قد تؤثر الصدمة في المشاعر والذاكرة والجهاز العصبي والعلاقات والنوم والتركيز والقدرة على الشعور بالأمان. وقد يستجيب الأشخاص بطرق مختلفة للتجارب المتشابهة، ولا توجد طريقة واحدة صحيحة للاستجابة.",
    },

    signsIntro: {
      en: "Possible responses to trauma may include:",
      ar: "قد تشمل الاستجابات المحتملة للصدمة:",
    },

    signs: [
      {
        en: "Intrusive memories, nightmares, or flashbacks",
        ar: "ذكريات متطفلة أو كوابيس أو استرجاع حي للتجربة",
      },
      {
        en: "Feeling constantly alert or easily startled",
        ar: "الشعور الدائم بالتأهب أو الفزع بسهولة",
      },
      {
        en: "Avoiding reminders, places, people, or conversations",
        ar: "تجنب التذكيرات أو الأماكن أو الأشخاص أو الأحاديث",
      },
      {
        en: "Emotional numbness or feeling disconnected",
        ar: "الخدر العاطفي أو الشعور بالانفصال",
      },
      {
        en: "Difficulty trusting others or feeling safe in relationships",
        ar: "صعوبة الثقة بالآخرين أو الشعور بالأمان في العلاقات",
      },
      {
        en: "Sleep difficulties, irritability, shame, or guilt",
        ar: "صعوبات النوم أو الانفعال أو الخجل أو الشعور بالذنب",
      },
    ],

    seekHelpIntro: {
      en: "Professional support may be useful when the impact of a difficult experience continues to affect your sense of safety, relationships, emotions, or daily functioning.",
      ar: "قد يكون الدعم المهني مفيدًا عندما تستمر آثار تجربة صعبة في التأثير في شعورك بالأمان أو علاقاتك أو مشاعرك أو حياتك اليومية.",
    },

    seekHelpPoints: [
      {
        en: "Memories or reminders feel overwhelming",
        ar: "تبدو الذكريات أو التذكيرات شديدة وصعبة",
      },
      {
        en: "You feel unsafe even when danger has passed",
        ar: "تشعر بعدم الأمان رغم انتهاء الخطر",
      },
      {
        en: "Avoidance is limiting your daily life",
        ar: "يؤثر التجنب في قدرتك على عيش حياتك اليومية",
      },
      {
        en: "Relationships or sleep have been significantly affected",
        ar: "تأثرت علاقاتك أو قدرتك على النوم بصورة واضحة",
      },
    ],

    therapyIntro: {
      en: "Trauma-informed therapy aims to create safety, choice, collaboration, and emotional stability. You do not have to discuss every detail before you feel ready.",
      ar: "يهدف العلاج المراعي للصدمة إلى توفير الأمان والاختيار والتعاون والاستقرار النفسي. ولا يتعين عليك مناقشة كل التفاصيل قبل أن تكون مستعدًا.",
    },

    therapyBenefits: [
      {
        number: "01",
        title: {
          en: "Create safety",
          ar: "بناء الشعور بالأمان",
        },
        text: {
          en: "Develop grounding skills and a greater sense of stability in the present.",
          ar: "تطوير مهارات تساعد على الثبات والشعور بمزيد من الاستقرار في الحاضر.",
        },
      },
      {
        number: "02",
        title: {
          en: "Understand responses",
          ar: "فهم الاستجابات",
        },
        text: {
          en: "Recognise how the mind and body adapted to overwhelming experiences.",
          ar: "فهم كيفية تكيف الذهن والجسد مع التجارب الشديدة.",
        },
      },
      {
        number: "03",
        title: {
          en: "Process gradually",
          ar: "المعالجة بصورة تدريجية",
        },
        text: {
          en: "Explore difficult experiences at a pace that respects your needs.",
          ar: "استكشاف التجارب الصعبة بوتيرة تحترم احتياجاتك.",
        },
      },
      {
        number: "04",
        title: {
          en: "Reconnect",
          ar: "استعادة التواصل",
        },
        text: {
          en: "Rebuild trust, emotional connection, and participation in everyday life.",
          ar: "إعادة بناء الثقة والتواصل النفسي والمشاركة في الحياة اليومية.",
        },
      },
    ],

    approachesIntro: {
      en: "Trauma therapy should be adapted carefully to the individual, with attention to safety, readiness, and emotional regulation.",
      ar: "يجب تكييف علاج الصدمات بعناية مع كل شخص، مع الاهتمام بالأمان والاستعداد وتنظيم المشاعر.",
    },

    approaches: [
      {
        title: {
          en: "Trauma-focused CBT",
          ar: "العلاج المعرفي السلوكي الموجه للصدمة",
        },
        text: {
          en: "Addresses thoughts, emotions, avoidance, and behaviours connected to traumatic experiences.",
          ar: "يتعامل مع الأفكار والمشاعر والتجنب والسلوكيات المرتبطة بالتجارب الصادمة.",
        },
      },
      {
        title: {
          en: "EMDR-informed therapy",
          ar: "العلاج المستنير بتقنية إزالة حساسية حركة العين",
        },
        text: {
          en: "May support the processing of distressing memories through a structured therapeutic approach.",
          ar: "قد يساعد على معالجة الذكريات المؤلمة من خلال أسلوب علاجي منظم.",
        },
      },
      {
        title: {
          en: "Stabilisation and grounding",
          ar: "التثبيت والعودة إلى الحاضر",
        },
        text: {
          en: "Supports nervous-system regulation and a stronger sense of present safety.",
          ar: "يدعم تنظيم الجهاز العصبي وتعزيز الشعور بالأمان في الحاضر.",
        },
      },
    ],

    faq: [
      {
        question: {
          en: "Do I need to describe the trauma in detail?",
          ar: "هل يجب أن أصف الصدمة بالتفصيل؟",
        },
        answer: {
          en: "No. Therapy should proceed at a pace that feels manageable. Safety and emotional readiness are important parts of trauma-informed work.",
          ar: "لا. يجب أن يسير العلاج بوتيرة يمكنك تحملها. ويُعد الأمان والاستعداد النفسي جزءًا مهمًا من العلاج المراعي للصدمة.",
        },
      },
      {
        question: {
          en: "Can an experience be traumatic even if others do not see it that way?",
          ar: "هل يمكن أن تكون التجربة صادمة حتى لو لم يرها الآخرون كذلك؟",
        },
        answer: {
          en: "Yes. Trauma is influenced by how an experience affected your sense of safety, control, connection, and ability to cope.",
          ar: "نعم. تتأثر الصدمة بالطريقة التي أثرت بها التجربة في شعورك بالأمان والسيطرة والتواصل والقدرة على التأقلم.",
        },
      },
      {
        question: {
          en: "Can trauma symptoms appear much later?",
          ar: "هل يمكن أن تظهر أعراض الصدمة بعد وقت طويل؟",
        },
        answer: {
          en: "Yes. Some responses appear immediately, while others may become noticeable later, particularly during stress or major life changes.",
          ar: "نعم. قد تظهر بعض الاستجابات مباشرة، بينما قد تظهر أخرى لاحقًا، خصوصًا خلال الضغط أو التغيرات الكبيرة في الحياة.",
        },
      },
    ],

    background: "bg-[#e7e0d5]",
    accent: "bg-[#9c886a]",
    secondaryAccent: "bg-[#f8f4ec]",
    shape: "rounded-[54%_46%_34%_66%/42%_58%_42%_58%]",
  },

  "stress-burnout": {
    slug: "stress-burnout",
    number: "05",

    title: {
      en: "Stress & Burnout",
      ar: "الضغط والإرهاق النفسي",
    },

    eyebrow: {
      en: "UNDERSTANDING STRESS & BURNOUT",
      ar: "فهم الضغط والإرهاق النفسي",
    },

    subtitle: {
      en: "When your mind and body have been carrying too much.",
      ar: "عندما يتحمل ذهنك وجسدك أكثر مما ينبغي.",
    },

    introduction: {
      en: "Stress is a natural response to demands and pressure. When those demands remain high without enough recovery, stress may become chronic and contribute to emotional, mental, and physical exhaustion.",
      ar: "الضغط استجابة طبيعية للمتطلبات والتحديات. وعندما تستمر هذه المتطلبات دون وقت كافٍ للتعافي، قد يصبح الضغط مزمنًا ويسهم في الإرهاق النفسي والعقلي والجسدي.",
    },

    definition: {
      en: "Burnout often develops gradually. It may involve exhaustion, reduced motivation, emotional distance, irritability, difficulty concentrating, and a sense that your efforts no longer feel meaningful or sustainable.",
      ar: "غالبًا ما يتطور الإرهاق النفسي تدريجيًا. وقد يشمل التعب وانخفاض الدافع والبعد العاطفي والانفعال وصعوبة التركيز والشعور بأن جهودك لم تعد ذات معنى أو قابلة للاستمرار.",
    },

    signsIntro: {
      en: "Common experiences associated with chronic stress or burnout may include:",
      ar: "قد تشمل التجارب المرتبطة بالضغط المزمن أو الإرهاق النفسي:",
    },

    signs: [
      {
        en: "Persistent physical or emotional exhaustion",
        ar: "إرهاق جسدي أو نفسي مستمر",
      },
      {
        en: "Difficulty concentrating or making decisions",
        ar: "صعوبة التركيز أو اتخاذ القرارات",
      },
      {
        en: "Irritability, frustration, or emotional numbness",
        ar: "الانفعال أو الإحباط أو الخدر العاطفي",
      },
      {
        en: "Loss of motivation or sense of purpose",
        ar: "فقدان الدافع أو الإحساس بالهدف",
      },
      {
        en: "Sleep problems or difficulty recovering after rest",
        ar: "مشكلات النوم أو صعوبة التعافي بعد الراحة",
      },
      {
        en: "Withdrawal from work, responsibilities, or relationships",
        ar: "الانسحاب من العمل أو المسؤوليات أو العلاقات",
      },
    ],

    seekHelpIntro: {
      en: "Therapy may be helpful when pressure feels constant, rest is no longer restorative, or your responsibilities are affecting your health and emotional wellbeing.",
      ar: "قد يكون العلاج مفيدًا عندما يبدو الضغط مستمرًا أو لا تعود الراحة مفيدة أو تبدأ المسؤوليات في التأثير في صحتك وتوازنك النفسي.",
    },

    seekHelpPoints: [
      {
        en: "You feel exhausted most of the time",
        ar: "تشعر بالإرهاق معظم الوقت",
      },
      {
        en: "Your motivation has significantly declined",
        ar: "انخفض دافعك بصورة واضحة",
      },
      {
        en: "Stress is affecting your sleep or physical health",
        ar: "يؤثر الضغط في نومك أو صحتك الجسدية",
      },
      {
        en: "You feel unable to disconnect from responsibilities",
        ar: "تشعر بأنك غير قادر على الابتعاد عن المسؤوليات",
      },
    ],

    therapyIntro: {
      en: "Psychotherapy can help you understand the sources of pressure, examine expectations and boundaries, and create a more sustainable relationship with work, responsibility, rest, and self-care.",
      ar: "يمكن للعلاج النفسي أن يساعدك على فهم مصادر الضغط ومراجعة التوقعات والحدود وبناء علاقة أكثر استدامة مع العمل والمسؤوليات والراحة والعناية بالنفس.",
    },

    therapyBenefits: [
      {
        number: "01",
        title: {
          en: "Identify stressors",
          ar: "تحديد مصادر الضغط",
        },
        text: {
          en: "Clarify which demands, roles, and patterns are creating ongoing strain.",
          ar: "تحديد المتطلبات والأدوار والأنماط التي تسبب ضغطًا مستمرًا.",
        },
      },
      {
        number: "02",
        title: {
          en: "Review expectations",
          ar: "مراجعة التوقعات",
        },
        text: {
          en: "Explore perfectionism, over-responsibility, and internal pressure.",
          ar: "استكشاف السعي إلى الكمال وتحمل المسؤولية الزائدة والضغط الداخلي.",
        },
      },
      {
        number: "03",
        title: {
          en: "Strengthen boundaries",
          ar: "تقوية الحدود",
        },
        text: {
          en: "Develop clearer limits around time, energy, and availability.",
          ar: "بناء حدود أوضح حول الوقت والطاقة والتوفر للآخرين.",
        },
      },
      {
        number: "04",
        title: {
          en: "Restore balance",
          ar: "استعادة التوازن",
        },
        text: {
          en: "Create realistic routines that include recovery, connection, and rest.",
          ar: "بناء روتين واقعي يتضمن التعافي والتواصل والراحة.",
        },
      },
    ],

    approachesIntro: {
      en: "Treatment may combine practical stress-management strategies with deeper exploration of emotional patterns, values, and expectations.",
      ar: "قد يجمع العلاج بين استراتيجيات عملية لإدارة الضغط واستكشاف أعمق للأنماط النفسية والقيم والتوقعات.",
    },

    approaches: [
      {
        title: {
          en: "Cognitive Behavioural Therapy",
          ar: "العلاج المعرفي السلوكي",
        },
        text: {
          en: "Examines thinking patterns, behaviours, and habits that may maintain chronic stress.",
          ar: "يفحص أنماط التفكير والسلوك والعادات التي قد تسهم في استمرار الضغط المزمن.",
        },
      },
      {
        title: {
          en: "Acceptance and Commitment Therapy",
          ar: "علاج القبول والالتزام",
        },
        text: {
          en: "Supports values-based choices and a more flexible response to difficult thoughts and feelings.",
          ar: "يدعم اتخاذ قرارات قائمة على القيم واستجابة أكثر مرونة للأفكار والمشاعر الصعبة.",
        },
      },
      {
        title: {
          en: "Mindfulness-based approaches",
          ar: "الأساليب القائمة على اليقظة الذهنية",
        },
        text: {
          en: "Help develop awareness, emotional regulation, and recovery from ongoing pressure.",
          ar: "تساعد على تطوير الوعي وتنظيم المشاعر والتعافي من الضغط المستمر.",
        },
      },
    ],

    faq: [
      {
        question: {
          en: "Is burnout the same as being tired?",
          ar: "هل الإرهاق النفسي هو نفسه الشعور بالتعب؟",
        },
        answer: {
          en: "Not necessarily. Ordinary tiredness often improves with rest. Burnout may involve ongoing exhaustion, emotional distance, reduced effectiveness, and difficulty recovering.",
          ar: "ليس بالضرورة. غالبًا ما يتحسن التعب العادي بالراحة، بينما قد يشمل الإرهاق النفسي تعبًا مستمرًا وبعدًا عاطفيًا وانخفاض الفاعلية وصعوبة التعافي.",
        },
      },
      {
        question: {
          en: "Can burnout happen outside work?",
          ar: "هل يمكن أن يحدث الإرهاق النفسي خارج بيئة العمل؟",
        },
        answer: {
          en: "Yes. Prolonged caregiving, parenting demands, study, family responsibilities, or ongoing emotional pressure may also contribute to burnout-like experiences.",
          ar: "نعم. قد تسهم الرعاية المستمرة أو متطلبات الأبوة والأمومة أو الدراسة أو المسؤوليات العائلية أو الضغط النفسي الطويل في تجارب شبيهة بالإرهاق.",
        },
      },
      {
        question: {
          en: "Will taking time off solve burnout?",
          ar: "هل تكفي الإجازة لعلاج الإرهاق النفسي؟",
        },
        answer: {
          en: "Rest can be important, but lasting improvement may also require changes in boundaries, expectations, workload, coping patterns, and sources of support.",
          ar: "الراحة مهمة، لكن التحسن المستمر قد يتطلب أيضًا تغييرات في الحدود والتوقعات وحجم المسؤوليات وأنماط التأقلم ومصادر الدعم.",
        },
      },
    ],

    background: "bg-[#dce5e6]",
    accent: "bg-[#70898f]",
    secondaryAccent: "bg-[#f4f6f3]",
    shape: "rounded-[45%_55%_38%_62%/58%_38%_62%_42%]",
  },

  "self-esteem": {
    slug: "self-esteem",
    number: "06",

    title: {
      en: "Self-esteem",
      ar: "تقدير الذات",
    },

    eyebrow: {
      en: "UNDERSTANDING SELF-ESTEEM",
      ar: "فهم تقدير الذات",
    },

    subtitle: {
      en: "When the way you see yourself becomes painful.",
      ar: "عندما تصبح نظرتك إلى نفسك مصدرًا للألم.",
    },

    introduction: {
      en: "Self-esteem refers to the way you evaluate and relate to yourself. When it is low or unstable, everyday experiences may become shaped by self-doubt, criticism, shame, comparison, or fear of not being enough.",
      ar: "يشير تقدير الذات إلى الطريقة التي تنظر بها إلى نفسك وتتفاعل معها. وعندما يكون منخفضًا أو غير مستقر، قد تتأثر التجارب اليومية بالشك في الذات والنقد والخجل والمقارنة والخوف من عدم الكفاية.",
    },

    definition: {
      en: "Low self-esteem is not simply a lack of confidence. It may involve deeply held beliefs about worth, belonging, competence, appearance, relationships, or the right to have needs and boundaries.",
      ar: "انخفاض تقدير الذات ليس مجرد نقص في الثقة. فقد يشمل معتقدات عميقة حول القيمة والانتماء والكفاءة والمظهر والعلاقات والحق في امتلاك احتياجات وحدود.",
    },

    signsIntro: {
      en: "Low self-esteem may appear through experiences such as:",
      ar: "قد يظهر انخفاض تقدير الذات من خلال تجارب مثل:",
    },

    signs: [
      {
        en: "Harsh and persistent self-criticism",
        ar: "نقد قاسٍ ومستمر للذات",
      },
      {
        en: "Difficulty accepting compliments or recognising strengths",
        ar: "صعوبة تقبل المديح أو التعرف إلى نقاط القوة",
      },
      {
        en: "Perfectionism or fear of making mistakes",
        ar: "السعي إلى الكمال أو الخوف من ارتكاب الأخطاء",
      },
      {
        en: "Frequent comparison with others",
        ar: "المقارنة المتكررة مع الآخرين",
      },
      {
        en: "Difficulty expressing needs or setting boundaries",
        ar: "صعوبة التعبير عن الاحتياجات أو وضع الحدود",
      },
      {
        en: "Fear of rejection, failure, or disappointing others",
        ar: "الخوف من الرفض أو الفشل أو خذلان الآخرين",
      },
    ],

    seekHelpIntro: {
      en: "Therapy may be helpful when self-criticism affects your relationships, decisions, confidence, emotional wellbeing, or ability to pursue meaningful goals.",
      ar: "قد يكون العلاج مفيدًا عندما يؤثر نقد الذات في علاقاتك أو قراراتك أو ثقتك أو صحتك النفسية أو قدرتك على السعي نحو أهداف مهمة.",
    },

    seekHelpPoints: [
      {
        en: "You regularly feel inadequate or undeserving",
        ar: "تشعر باستمرار بأنك غير كافٍ أو غير مستحق",
      },
      {
        en: "Fear of failure prevents you from trying",
        ar: "يمنعك الخوف من الفشل من المحاولة",
      },
      {
        en: "You depend heavily on external approval",
        ar: "تعتمد بصورة كبيرة على قبول الآخرين",
      },
      {
        en: "You struggle to protect your needs and boundaries",
        ar: "تجد صعوبة في حماية احتياجاتك وحدودك",
      },
    ],

    therapyIntro: {
      en: "Psychotherapy can help you understand how your view of yourself developed and support a more compassionate, balanced, and realistic internal relationship.",
      ar: "يمكن للعلاج النفسي أن يساعدك على فهم كيفية تشكل نظرتك إلى نفسك ودعم بناء علاقة داخلية أكثر تعاطفًا وتوازنًا وواقعية.",
    },

    therapyBenefits: [
      {
        number: "01",
        title: {
          en: "Understand origins",
          ar: "فهم الجذور",
        },
        text: {
          en: "Explore experiences and relationships that shaped your beliefs about yourself.",
          ar: "استكشاف التجارب والعلاقات التي شكلت معتقداتك عن نفسك.",
        },
      },
      {
        number: "02",
        title: {
          en: "Challenge self-criticism",
          ar: "مواجهة نقد الذات",
        },
        text: {
          en: "Recognise harsh internal messages and develop more balanced alternatives.",
          ar: "التعرف إلى الرسائل الداخلية القاسية وتطوير بدائل أكثر توازنًا.",
        },
      },
      {
        number: "03",
        title: {
          en: "Build boundaries",
          ar: "بناء الحدود",
        },
        text: {
          en: "Strengthen your ability to express needs and protect emotional wellbeing.",
          ar: "تعزيز القدرة على التعبير عن الاحتياجات وحماية الصحة النفسية.",
        },
      },
      {
        number: "04",
        title: {
          en: "Develop self-compassion",
          ar: "تطوير التعاطف مع الذات",
        },
        text: {
          en: "Learn to respond to mistakes and difficulties with greater kindness.",
          ar: "تعلم التعامل مع الأخطاء والصعوبات بمزيد من اللطف.",
        },
      },
    ],

    approachesIntro: {
      en: "Different therapeutic approaches may support self-esteem depending on the origins and patterns involved.",
      ar: "قد تساعد أساليب علاجية مختلفة في تحسين تقدير الذات وفقًا للجذور والأنماط المرتبطة به.",
    },

    approaches: [
      {
        title: {
          en: "Cognitive Behavioural Therapy",
          ar: "العلاج المعرفي السلوكي",
        },
        text: {
          en: "Identifies and challenges negative beliefs and self-critical thinking patterns.",
          ar: "يتعرف إلى المعتقدات السلبية وأنماط التفكير الناقد للذات ويعمل على مراجعتها.",
        },
      },
      {
        title: {
          en: "Compassion-focused therapy",
          ar: "العلاج المرتكز على التعاطف",
        },
        text: {
          en: "Supports a kinder response to shame, criticism, and emotional pain.",
          ar: "يدعم استجابة أكثر لطفًا للخجل والنقد والألم النفسي.",
        },
      },
      {
        title: {
          en: "Psychodynamic therapy",
          ar: "العلاج الديناميكي النفسي",
        },
        text: {
          en: "Explores earlier experiences and relationships that shaped self-worth.",
          ar: "يستكشف التجارب والعلاقات السابقة التي شكلت الإحساس بالقيمة الذاتية.",
        },
      },
    ],

    faq: [
      {
        question: {
          en: "Can self-esteem change?",
          ar: "هل يمكن أن يتغير تقدير الذات؟",
        },
        answer: {
          en: "Yes. Self-esteem can develop over time through insight, new experiences, healthier boundaries, supportive relationships, and changes in how you respond to yourself.",
          ar: "نعم. يمكن أن يتطور تقدير الذات مع الوقت من خلال الفهم والتجارب الجديدة والحدود الصحية والعلاقات الداعمة وتغيير طريقة التعامل مع الذات.",
        },
      },
      {
        question: {
          en: "Is low self-esteem caused by childhood?",
          ar: "هل ينتج انخفاض تقدير الذات دائمًا عن الطفولة؟",
        },
        answer: {
          en: "Not always. Early experiences may contribute, but later relationships, criticism, discrimination, failure, trauma, or major life changes can also affect self-esteem.",
          ar: "ليس دائمًا. قد تسهم التجارب المبكرة، لكن العلاقات اللاحقة أو النقد أو التمييز أو الفشل أو الصدمات أو التغيرات الكبيرة قد تؤثر أيضًا في تقدير الذات.",
        },
      },
      {
        question: {
          en: "Does confidence mean never feeling insecure?",
          ar: "هل تعني الثقة عدم الشعور بعدم الأمان أبدًا؟",
        },
        answer: {
          en: "No. Healthy self-esteem does not remove uncertainty. It can help you respond to doubt and difficulty without defining your entire worth by them.",
          ar: "لا. لا يزيل تقدير الذات الصحي الشعور بعدم اليقين، لكنه يساعدك على التعامل مع الشك والصعوبة دون أن تحدد هذه المشاعر قيمتك بالكامل.",
        },
      },
    ],

    background: "bg-[#e8dfeb]",
    accent: "bg-[#907899]",
    secondaryAccent: "bg-[#faf5fa]",
    shape: "rounded-[60%_40%_60%_40%/38%_62%_38%_62%]",
  },

  ocd: {
    slug: "ocd",
    number: "07",

    title: {
      en: "OCD",
      ar: "الوسواس القهري",
    },

    eyebrow: {
      en: "UNDERSTANDING OCD",
      ar: "فهم الوسواس القهري",
    },

    subtitle: {
      en: "When intrusive thoughts and repeated behaviours become difficult to interrupt.",
      ar: "عندما يصبح من الصعب إيقاف الأفكار المتطفلة والسلوكيات المتكررة.",
    },

    introduction: {
      en: "Obsessive-compulsive disorder can involve unwanted intrusive thoughts, images, urges, or doubts, together with behaviours or mental rituals performed to reduce anxiety or prevent a feared outcome.",
      ar: "قد يشمل اضطراب الوسواس القهري أفكارًا أو صورًا أو دوافع أو شكوكًا متطفلة وغير مرغوبة، إلى جانب سلوكيات أو طقوس ذهنية تُستخدم لتقليل القلق أو منع نتيجة مخيفة.",
    },

    definition: {
      en: "Obsessions are recurring thoughts or fears that cause distress. Compulsions are repeated actions, checking, reassurance seeking, avoidance, counting, reviewing, or mental rituals that bring temporary relief but often strengthen the cycle over time.",
      ar: "الوساوس هي أفكار أو مخاوف متكررة تسبب ضغطًا نفسيًا. أما الأفعال القهرية فهي تصرفات متكررة أو فحص أو طلب للطمأنة أو تجنب أو عد أو مراجعة أو طقوس ذهنية تمنح راحة مؤقتة لكنها غالبًا تعزز الدائرة مع الوقت.",
    },

    signsIntro: {
      en: "OCD experiences may include:",
      ar: "قد تشمل تجارب الوسواس القهري:",
    },

    signs: [
      {
        en: "Unwanted thoughts, images, urges, or doubts",
        ar: "أفكار أو صور أو دوافع أو شكوك غير مرغوبة",
      },
      {
        en: "Repeated checking, washing, arranging, or reviewing",
        ar: "الفحص أو الغسل أو الترتيب أو المراجعة بصورة متكررة",
      },
      {
        en: "Seeking reassurance from other people",
        ar: "طلب الطمأنة بصورة متكررة من الآخرين",
      },
      {
        en: "Mental rituals such as counting or repeating phrases",
        ar: "طقوس ذهنية مثل العد أو تكرار عبارات معينة",
      },
      {
        en: "Avoiding situations that trigger intrusive thoughts",
        ar: "تجنب المواقف التي تحفز الأفكار المتطفلة",
      },
      {
        en: "Spending significant time trying to feel completely certain",
        ar: "قضاء وقت طويل في محاولة الوصول إلى يقين كامل",
      },
    ],

    seekHelpIntro: {
      en: "Professional support may be useful when obsessions or compulsions take up significant time, create distress, or interfere with relationships, study, work, sleep, or daily activities.",
      ar: "قد يكون الدعم المهني مفيدًا عندما تستغرق الوساوس أو الأفعال القهرية وقتًا طويلًا أو تسبب ضغطًا أو تؤثر في العلاقات أو الدراسة أو العمل أو النوم أو الأنشطة اليومية.",
    },

    seekHelpPoints: [
      {
        en: "Rituals or checking are becoming more frequent",
        ar: "أصبحت الطقوس أو عمليات الفحص أكثر تكرارًا",
      },
      {
        en: "You feel trapped in cycles of doubt and reassurance",
        ar: "تشعر بأنك عالق في دوائر الشك والطمأنة",
      },
      {
        en: "Avoidance is limiting important parts of your life",
        ar: "يحد التجنب من جوانب مهمة في حياتك",
      },
      {
        en: "You recognise the pattern but feel unable to stop",
        ar: "تدرك النمط لكنك تشعر بعدم القدرة على إيقافه",
      },
    ],

    therapyIntro: {
      en: "Therapy can help you understand the OCD cycle, reduce reliance on compulsions, tolerate uncertainty, and respond differently to intrusive thoughts.",
      ar: "يمكن للعلاج أن يساعدك على فهم دائرة الوسواس القهري وتقليل الاعتماد على الأفعال القهرية وتحمل عدم اليقين والاستجابة للأفكار المتطفلة بطريقة مختلفة.",
    },

    therapyBenefits: [
      {
        number: "01",
        title: {
          en: "Understand the cycle",
          ar: "فهم الدائرة",
        },
        text: {
          en: "Recognise the relationship between obsessions, anxiety, compulsions, and temporary relief.",
          ar: "التعرف إلى العلاقة بين الوساوس والقلق والأفعال القهرية والراحة المؤقتة.",
        },
      },
      {
        number: "02",
        title: {
          en: "Reduce compulsions",
          ar: "تقليل الأفعال القهرية",
        },
        text: {
          en: "Gradually practise responding without completing rituals or reassurance seeking.",
          ar: "التدرب تدريجيًا على الاستجابة دون تنفيذ الطقوس أو طلب الطمأنة.",
        },
      },
      {
        number: "03",
        title: {
          en: "Tolerate uncertainty",
          ar: "تحمل عدم اليقين",
        },
        text: {
          en: "Build the ability to move forward without achieving complete certainty.",
          ar: "بناء القدرة على الاستمرار دون الحاجة إلى الوصول إلى يقين كامل.",
        },
      },
      {
        number: "04",
        title: {
          en: "Reconnect with life",
          ar: "استعادة الحياة اليومية",
        },
        text: {
          en: "Return attention and time to relationships, goals, and meaningful activities.",
          ar: "إعادة الوقت والانتباه إلى العلاقات والأهداف والأنشطة المهمة.",
        },
      },
    ],

    approachesIntro: {
      en: "Evidence-based OCD treatment is structured and adapted carefully to the person's symptoms, readiness, and clinical needs.",
      ar: "يكون علاج الوسواس القهري القائم على الأدلة منظمًا ومكيفًا بعناية مع الأعراض والاستعداد والاحتياجات السريرية للشخص.",
    },

    approaches: [
      {
        title: {
          en: "Exposure and Response Prevention",
          ar: "التعرض ومنع الاستجابة",
        },
        text: {
          en: "Supports gradual contact with feared uncertainty while reducing compulsive responses.",
          ar: "يدعم التعرض التدريجي لعدم اليقين المخيف مع تقليل الاستجابات القهرية.",
        },
      },
      {
        title: {
          en: "Cognitive Behavioural Therapy",
          ar: "العلاج المعرفي السلوكي",
        },
        text: {
          en: "Examines interpretations, beliefs, rituals, avoidance, and reassurance patterns.",
          ar: "يفحص التفسيرات والمعتقدات والطقوس والتجنب وأنماط طلب الطمأنة.",
        },
      },
      {
        title: {
          en: "Acceptance-based approaches",
          ar: "الأساليب القائمة على التقبل",
        },
        text: {
          en: "Help change the relationship with intrusive thoughts rather than trying to eliminate every thought.",
          ar: "تساعد على تغيير العلاقة مع الأفكار المتطفلة بدلًا من محاولة التخلص من كل فكرة.",
        },
      },
    ],

    faq: [
      {
        question: {
          en: "Does having intrusive thoughts mean I want them?",
          ar: "هل تعني الأفكار المتطفلة أنني أرغب فيها؟",
        },
        answer: {
          en: "No. Intrusive thoughts are unwanted and can be especially distressing because they conflict with a person's values, identity, or intentions.",
          ar: "لا. الأفكار المتطفلة غير مرغوبة، وقد تكون شديدة الإزعاج لأنها تتعارض مع قيم الشخص أو هويته أو نواياه.",
        },
      },
      {
        question: {
          en: "Are compulsions always visible?",
          ar: "هل تكون الأفعال القهرية واضحة دائمًا؟",
        },
        answer: {
          en: "No. Some compulsions are mental, such as reviewing memories, repeating phrases, checking feelings, counting, or trying to neutralise a thought.",
          ar: "لا. بعض الأفعال القهرية تكون ذهنية، مثل مراجعة الذكريات أو تكرار عبارات أو فحص المشاعر أو العد أو محاولة إبطال فكرة.",
        },
      },
      {
        question: {
          en: "Can reassurance make OCD worse?",
          ar: "هل يمكن أن تزيد الطمأنة من شدة الوسواس القهري؟",
        },
        answer: {
          en: "Repeated reassurance may provide short-term relief but can reinforce the need for certainty and maintain the OCD cycle over time.",
          ar: "قد تمنح الطمأنة المتكررة راحة قصيرة المدى، لكنها قد تعزز الحاجة إلى اليقين وتبقي دائرة الوسواس القهري مستمرة.",
        },
      },
    ],

    background: "bg-[#d9e4e0]",
    accent: "bg-[#758d86]",
    secondaryAccent: "bg-[#f4f2ea]",
    shape: "rounded-[40%_60%_52%_48%/58%_42%_58%_42%]",
  },

  grief: {
    slug: "grief",
    number: "08",

    title: {
      en: "Grief & Loss",
      ar: "الحزن والفقدان",
    },

    eyebrow: {
      en: "UNDERSTANDING GRIEF",
      ar: "فهم الحزن والفقدان",
    },

    subtitle: {
      en: "When life changes after losing someone or something meaningful.",
      ar: "عندما تتغير الحياة بعد فقدان شخص أو شيء ذي معنى.",
    },

    introduction: {
      en: "Grief is a natural response to loss. It may follow the death of someone important, the end of a relationship, a major health change, migration, loss of identity, or any transition that alters the life you expected.",
      ar: "الحزن استجابة طبيعية للفقدان. وقد يحدث بعد وفاة شخص مهم أو انتهاء علاقة أو تغير صحي كبير أو الهجرة أو فقدان الهوية أو أي تحول يغير الحياة التي كنت تتوقعها.",
    },

    definition: {
      en: "Grief does not follow one fixed sequence or timetable. It may involve sadness, anger, relief, guilt, numbness, longing, confusion, or moments of connection and meaning alongside pain.",
      ar: "لا يتبع الحزن تسلسلًا أو مدة ثابتة. وقد يشمل الحزن والغضب والراحة والذنب والخدر والاشتياق والارتباك أو لحظات من التواصل والمعنى إلى جانب الألم.",
    },

    signsIntro: {
      en: "Experiences associated with grief may include:",
      ar: "قد تشمل التجارب المرتبطة بالحزن:",
    },

    signs: [
      {
        en: "Intense sadness, longing, or emotional pain",
        ar: "حزن شديد أو اشتياق أو ألم نفسي",
      },
      {
        en: "Numbness, disbelief, or difficulty accepting the loss",
        ar: "الخدر أو عدم التصديق أو صعوبة تقبل الفقدان",
      },
      {
        en: "Changes in sleep, appetite, energy, or concentration",
        ar: "تغيرات في النوم أو الشهية أو الطاقة أو التركيز",
      },
      {
        en: "Guilt, regret, anger, or unanswered questions",
        ar: "الشعور بالذنب أو الندم أو الغضب أو وجود أسئلة دون إجابة",
      },
      {
        en: "Withdrawal or difficulty reconnecting with daily life",
        ar: "الانسحاب أو صعوبة العودة إلى الحياة اليومية",
      },
      {
        en: "Strong reactions around reminders, dates, or places",
        ar: "استجابات قوية تجاه التذكيرات أو التواريخ أو الأماكن",
      },
    ],

    seekHelpIntro: {
      en: "There is no correct duration for grief. Support may be helpful when the pain feels unmanageable, daily functioning remains severely affected, or you feel isolated in your experience.",
      ar: "لا توجد مدة صحيحة واحدة للحزن. وقد يكون الدعم مفيدًا عندما يبدو الألم غير قابل للتحمل أو تتأثر الحياة اليومية بشدة أو تشعر بالعزلة في تجربتك.",
    },

    seekHelpPoints: [
      {
        en: "You feel unable to function in daily life",
        ar: "تشعر بعدم القدرة على أداء مهام الحياة اليومية",
      },
      {
        en: "Guilt or regret feels overwhelming",
        ar: "يبدو الشعور بالذنب أو الندم شديدًا",
      },
      {
        en: "You feel disconnected from support or relationships",
        ar: "تشعر بالانفصال عن الدعم أو العلاقات",
      },
      {
        en: "The loss has triggered earlier trauma or depression",
        ar: "أدى الفقدان إلى تنشيط صدمات سابقة أو أعراض اكتئاب",
      },
    ],

    therapyIntro: {
      en: "Therapy can provide space to express grief, understand complex emotions, preserve meaningful connection, and gradually adapt to a changed life without erasing the importance of what was lost.",
      ar: "يمكن للعلاج توفير مساحة للتعبير عن الحزن وفهم المشاعر المعقدة والحفاظ على الارتباط المعنوي والتكيف تدريجيًا مع الحياة المتغيرة دون إلغاء أهمية ما تم فقدانه.",
    },

    therapyBenefits: [
      {
        number: "01",
        title: {
          en: "Express the loss",
          ar: "التعبير عن الفقدان",
        },
        text: {
          en: "Speak openly about emotions that may feel difficult to share elsewhere.",
          ar: "التحدث بصراحة عن مشاعر قد يصعب مشاركتها في أماكن أخرى.",
        },
      },
      {
        number: "02",
        title: {
          en: "Understand complexity",
          ar: "فهم تعقيد المشاعر",
        },
        text: {
          en: "Make space for sadness, anger, relief, guilt, love, and uncertainty.",
          ar: "إتاحة مساحة للحزن والغضب والراحة والذنب والحب وعدم اليقين.",
        },
      },
      {
        number: "03",
        title: {
          en: "Maintain connection",
          ar: "الحفاظ على الارتباط",
        },
        text: {
          en: "Explore ways of carrying memories, values, and meaningful bonds forward.",
          ar: "استكشاف طرق للحفاظ على الذكريات والقيم والروابط المهمة.",
        },
      },
      {
        number: "04",
        title: {
          en: "Adapt gradually",
          ar: "التكيف التدريجي",
        },
        text: {
          en: "Rebuild routines, relationships, identity, and purpose over time.",
          ar: "إعادة بناء الروتين والعلاقات والهوية والإحساس بالهدف مع الوقت.",
        },
      },
    ],

    approachesIntro: {
      en: "Grief therapy is adapted to the person, the nature of the loss, cultural meaning, relationships, and the broader circumstances surrounding the experience.",
      ar: "يتم تكييف علاج الحزن مع الشخص وطبيعة الفقدان والمعنى الثقافي والعلاقات والظروف المحيطة بالتجربة.",
    },

    approaches: [
      {
        title: {
          en: "Grief-focused therapy",
          ar: "العلاج الموجه للحزن",
        },
        text: {
          en: "Supports emotional processing, adaptation, meaning, and continuing bonds.",
          ar: "يدعم معالجة المشاعر والتكيف والمعنى واستمرار الروابط المعنوية.",
        },
      },
      {
        title: {
          en: "Narrative approaches",
          ar: "الأساليب السردية",
        },
        text: {
          en: "Help explore the story of the loss and its place within your life.",
          ar: "تساعد على استكشاف قصة الفقدان ومكانها داخل حياتك.",
        },
      },
      {
        title: {
          en: "Supportive psychotherapy",
          ar: "العلاج النفسي الداعم",
        },
        text: {
          en: "Provides emotional containment, validation, and practical support during adaptation.",
          ar: "يوفر الاحتواء النفسي والتأكيد والدعم العملي خلال عملية التكيف.",
        },
      },
    ],

    faq: [
      {
        question: {
          en: "Is there a normal timeline for grief?",
          ar: "هل توجد مدة طبيعية محددة للحزن؟",
        },
        answer: {
          en: "No. Grief varies according to the relationship, circumstances, culture, support, previous experiences, and meaning of the loss.",
          ar: "لا. يختلف الحزن وفقًا للعلاقة والظروف والثقافة والدعم والتجارب السابقة ومعنى الفقدان.",
        },
      },
      {
        question: {
          en: "Does therapy help me forget the person or loss?",
          ar: "هل يساعدني العلاج على نسيان الشخص أو الفقدان؟",
        },
        answer: {
          en: "The aim is not to erase the relationship or meaning. Therapy may help you carry the loss in a way that becomes more manageable over time.",
          ar: "لا يهدف العلاج إلى محو العلاقة أو المعنى. وقد يساعدك على حمل تجربة الفقدان بطريقة تصبح أكثر قابلية للتحمل مع الوقت.",
        },
      },
      {
        question: {
          en: "Can grief include relief or anger?",
          ar: "هل يمكن أن يشمل الحزن الراحة أو الغضب؟",
        },
        answer: {
          en: "Yes. Grief can involve many emotions, including relief, anger, guilt, love, numbness, confusion, and sadness. Mixed emotions do not make the loss less meaningful.",
          ar: "نعم. قد يشمل الحزن مشاعر متعددة مثل الراحة والغضب والذنب والحب والخدر والارتباك والحزن. ولا تقلل المشاعر المختلطة من أهمية الفقدان.",
        },
      },
    ],

    background: "bg-[#eee3d9]",
    accent: "bg-[#ae8975]",
    secondaryAccent: "bg-[#faf5ef]",
    shape: "rounded-[57%_43%_38%_62%/46%_61%_39%_54%]",
  },
    parenting: {
    slug: "parenting",
    number: "09",

    title: {
      en: "Parenting",
      ar: "تحديات الأبوة والأمومة",
    },

    eyebrow: {
      en: "UNDERSTANDING PARENTING CHALLENGES",
      ar: "فهم تحديات الأبوة والأمومة",
    },

    subtitle: {
      en: "When caring for others leaves little space for yourself.",
      ar: "عندما لا تترك رعاية الآخرين مساحة كافية لنفسك.",
    },

    introduction: {
      en: "Parenting can involve love, meaning, joy, responsibility, uncertainty, and significant emotional pressure. Parents may feel overwhelmed while trying to respond to their child's needs, manage family relationships, and maintain their own wellbeing.",
      ar: "قد تشمل الأبوة والأمومة الحب والمعنى والفرح والمسؤولية وعدم اليقين والضغط النفسي الكبير. وقد يشعر الوالدان بالإرهاق أثناء محاولة الاستجابة لاحتياجات الطفل وإدارة العلاقات الأسرية والحفاظ على صحتهما النفسية.",
    },

    definition: {
      en: "Parenting difficulties may relate to stress, changing family roles, behavioural concerns, communication, guilt, boundaries, conflict between caregivers, or uncertainty about how to support a child through emotional and developmental changes.",
      ar: "قد ترتبط تحديات الأبوة والأمومة بالضغط أو تغير الأدوار الأسرية أو المخاوف السلوكية أو التواصل أو الشعور بالذنب أو الحدود أو الخلافات بين مقدمي الرعاية أو عدم اليقين حول كيفية دعم الطفل خلال التغيرات النفسية والنمائية.",
    },

    signsIntro: {
      en: "You may experience parenting stress through:",
      ar: "قد يظهر ضغط الأبوة والأمومة من خلال:",
    },

    signs: [
      {
        en: "Feeling constantly overwhelmed or emotionally exhausted",
        ar: "الشعور المستمر بالإرهاق أو الاستنزاف النفسي",
      },
      {
        en: "Frequent guilt or fear of making the wrong decisions",
        ar: "الشعور المتكرر بالذنب أو الخوف من اتخاذ قرارات خاطئة",
      },
      {
        en: "Difficulty responding calmly during conflict",
        ar: "صعوبة الاستجابة بهدوء أثناء الخلافات",
      },
      {
        en: "Disagreement between caregivers about parenting",
        ar: "الخلاف بين مقدمي الرعاية حول أساليب التربية",
      },
      {
        en: "Difficulty maintaining boundaries or routines",
        ar: "صعوبة الحفاظ على الحدود أو الروتين",
      },
      {
        en: "Losing connection with your own needs and identity",
        ar: "فقدان التواصل مع احتياجاتك وهويتك الشخصية",
      },
    ],

    seekHelpIntro: {
      en: "Support may be helpful when parenting stress is affecting your emotional wellbeing, relationships, confidence, or ability to respond to family difficulties in the way you would like.",
      ar: "قد يكون الدعم مفيدًا عندما يؤثر ضغط الأبوة والأمومة في صحتك النفسية أو علاقاتك أو ثقتك أو قدرتك على التعامل مع الصعوبات الأسرية بالطريقة التي ترغب بها.",
    },

    seekHelpPoints: [
      {
        en: "You feel emotionally exhausted most of the time",
        ar: "تشعر بالاستنزاف النفسي معظم الوقت",
      },
      {
        en: "Family conflict has become difficult to manage",
        ar: "أصبح الخلاف الأسري صعب الإدارة",
      },
      {
        en: "Guilt and self-criticism affect your confidence",
        ar: "يؤثر الشعور بالذنب ونقد الذات في ثقتك",
      },
      {
        en: "You are struggling with a major family transition",
        ar: "تجد صعوبة في التعامل مع تحول أسري كبير",
      },
    ],

    therapyIntro: {
      en: "Therapy can provide a confidential space to understand parenting stress, explore family patterns, strengthen communication, and develop responses that support both your child and your own emotional wellbeing.",
      ar: "يمكن للعلاج أن يوفر مساحة سرية لفهم ضغط الأبوة والأمومة واستكشاف الأنماط الأسرية وتقوية التواصل وتطوير استجابات تدعم الطفل وصحتك النفسية معًا.",
    },

    therapyBenefits: [
      {
        number: "01",
        title: {
          en: "Understand triggers",
          ar: "فهم المحفزات",
        },
        text: {
          en: "Recognise situations and emotions that make parenting responses more difficult.",
          ar: "التعرف إلى المواقف والمشاعر التي تجعل الاستجابات التربوية أكثر صعوبة.",
        },
      },
      {
        number: "02",
        title: {
          en: "Improve communication",
          ar: "تحسين التواصل",
        },
        text: {
          en: "Develop clearer and calmer ways of communicating within the family.",
          ar: "تطوير طرق أوضح وأكثر هدوءًا للتواصل داخل الأسرة.",
        },
      },
      {
        number: "03",
        title: {
          en: "Strengthen boundaries",
          ar: "تقوية الحدود",
        },
        text: {
          en: "Create consistent limits that support safety, connection, and development.",
          ar: "بناء حدود ثابتة تدعم الأمان والتواصل والنمو.",
        },
      },
      {
        number: "04",
        title: {
          en: "Support yourself",
          ar: "دعم الذات",
        },
        text: {
          en: "Make space for rest, emotional needs, identity, and self-compassion.",
          ar: "إتاحة مساحة للراحة والاحتياجات النفسية والهوية والتعاطف مع الذات.",
        },
      },
    ],

    approachesIntro: {
      en: "Parenting support may involve individual therapy, parent consultations, family work, or collaboration with other professionals, depending on the family's needs.",
      ar: "قد يشمل دعم الأبوة والأمومة العلاج الفردي أو الاستشارات الوالدية أو العمل الأسري أو التعاون مع مختصين آخرين وفقًا لاحتياجات الأسرة.",
    },

    approaches: [
      {
        title: {
          en: "Parent-focused therapy",
          ar: "العلاج الموجه للوالدين",
        },
        text: {
          en: "Explores emotional responses, parenting confidence, boundaries, and family stress.",
          ar: "يستكشف الاستجابات النفسية والثقة التربوية والحدود والضغط الأسري.",
        },
      },
      {
        title: {
          en: "Family systems approaches",
          ar: "أساليب العلاج الأسري",
        },
        text: {
          en: "Consider how roles, communication, and relationships influence the family as a whole.",
          ar: "تبحث في كيفية تأثير الأدوار والتواصل والعلاقات في الأسرة ككل.",
        },
      },
      {
        title: {
          en: "Attachment-based approaches",
          ar: "الأساليب القائمة على التعلق",
        },
        text: {
          en: "Support emotional connection, responsiveness, safety, and repair within relationships.",
          ar: "تدعم التواصل العاطفي والاستجابة والأمان وإصلاح العلاقة.",
        },
      },
    ],

    faq: [
      {
        question: {
          en: "Does asking for help mean I am a bad parent?",
          ar: "هل يعني طلب المساعدة أنني والد سيئ؟",
        },
        answer: {
          en: "No. Seeking support can reflect care, responsibility, and a willingness to understand both your child's needs and your own.",
          ar: "لا. قد يعكس طلب الدعم الاهتمام والمسؤولية والرغبة في فهم احتياجات طفلك واحتياجاتك الشخصية.",
        },
      },
      {
        question: {
          en: "Can I attend therapy without my child?",
          ar: "هل يمكنني حضور العلاج دون طفلي؟",
        },
        answer: {
          en: "Yes. Individual therapy or parent consultations can help you understand your responses, strengthen parenting skills, and make changes within family relationships.",
          ar: "نعم. يمكن للعلاج الفردي أو الاستشارات الوالدية مساعدتك على فهم استجاباتك وتقوية مهاراتك وإحداث تغييرات داخل العلاقات الأسرية.",
        },
      },
      {
        question: {
          en: "Can therapy help caregivers who disagree?",
          ar: "هل يمكن للعلاج مساعدة مقدمي الرعاية الذين يختلفون في التربية؟",
        },
        answer: {
          en: "Therapy may help caregivers understand different expectations, communicate more clearly, and develop greater consistency around important decisions.",
          ar: "قد يساعد العلاج مقدمي الرعاية على فهم اختلاف التوقعات والتواصل بصورة أوضح وتطوير قدر أكبر من الاتساق حول القرارات المهمة.",
        },
      },
    ],

    background: "bg-[#e4e1d4]",
    accent: "bg-[#8e8a6f]",
    secondaryAccent: "bg-[#f7f3e9]",
    shape: "rounded-[48%_52%_64%_36%/56%_41%_59%_44%]",
  },

  "eating-disorders": {
    slug: "eating-disorders",
    number: "10",

    title: {
      en: "Eating Difficulties",
      ar: "صعوبات الأكل",
    },

    eyebrow: {
      en: "UNDERSTANDING EATING DIFFICULTIES",
      ar: "فهم صعوبات الأكل",
    },

    subtitle: {
      en: "When food, body image, or control becomes a source of distress.",
      ar: "عندما يصبح الطعام أو صورة الجسد أو التحكم مصدرًا للضغط.",
    },

    introduction: {
      en: "Eating difficulties can affect a person's relationship with food, body image, emotions, control, identity, and self-worth. These experiences can take many forms and may not always be visible to other people.",
      ar: "قد تؤثر صعوبات الأكل في علاقة الشخص بالطعام وصورة الجسد والمشاعر والتحكم والهوية والقيمة الذاتية. وقد تأخذ هذه التجارب أشكالًا متعددة ولا تكون دائمًا واضحة للآخرين.",
    },

    definition: {
      en: "A person may experience restrictive eating, binge eating, compensatory behaviours, intense concern about weight or shape, rigid food rules, shame, secrecy, or emotional reliance on food. Difficulties can be serious regardless of body size.",
      ar: "قد يعاني الشخص من تقييد الأكل أو نوبات الأكل المفرط أو السلوكيات التعويضية أو القلق الشديد بشأن الوزن أو الشكل أو قواعد صارمة حول الطعام أو الخجل أو السرية أو الاعتماد النفسي على الطعام. وقد تكون الصعوبات خطيرة بغض النظر عن حجم الجسم.",
    },

    signsIntro: {
      en: "Possible signs of eating difficulties may include:",
      ar: "قد تشمل العلامات المحتملة لصعوبات الأكل:",
    },

    signs: [
      {
        en: "Persistent worry about food, weight, shape, or appearance",
        ar: "القلق المستمر بشأن الطعام أو الوزن أو الشكل أو المظهر",
      },
      {
        en: "Rigid rules about what, when, or how much to eat",
        ar: "قواعد صارمة حول نوع الطعام أو توقيته أو كميته",
      },
      {
        en: "Episodes of feeling out of control around eating",
        ar: "نوبات من الشعور بفقدان السيطرة أثناء الأكل",
      },
      {
        en: "Avoiding meals or eating around other people",
        ar: "تجنب الوجبات أو الأكل أمام الآخرين",
      },
      {
        en: "Shame, guilt, or secrecy connected to food",
        ar: "الخجل أو الذنب أو السرية المرتبطة بالطعام",
      },
      {
        en: "Self-worth becoming strongly connected to body image",
        ar: "ارتباط القيمة الذاتية بصورة قوية بصورة الجسد",
      },
    ],

    seekHelpIntro: {
      en: "Professional support is important when thoughts or behaviours related to food and body image cause distress, affect physical health, interfere with daily life, or feel increasingly difficult to control.",
      ar: "يُعد الدعم المهني مهمًا عندما تسبب الأفكار أو السلوكيات المرتبطة بالطعام وصورة الجسد ضغطًا نفسيًا أو تؤثر في الصحة الجسدية أو الحياة اليومية أو تصبح أكثر صعوبة في التحكم.",
    },

    seekHelpPoints: [
      {
        en: "Food-related thoughts occupy a large part of your day",
        ar: "تستحوذ الأفكار المرتبطة بالطعام على جزء كبير من يومك",
      },
      {
        en: "Eating behaviours feel secretive or difficult to control",
        ar: "تبدو سلوكيات الأكل سرية أو يصعب التحكم فيها",
      },
      {
        en: "Your physical health or energy has changed",
        ar: "حدث تغير في صحتك الجسدية أو طاقتك",
      },
      {
        en: "Body image is affecting relationships or daily activities",
        ar: "تؤثر صورة الجسد في علاقاتك أو أنشطتك اليومية",
      },
    ],

    therapyIntro: {
      en: "Psychotherapy can help explore the emotional and relational meanings connected to food, body image, control, shame, and self-worth. Treatment may also require collaboration with medical and nutritional professionals.",
      ar: "يمكن للعلاج النفسي أن يساعد على استكشاف المعاني النفسية والعلاقية المرتبطة بالطعام وصورة الجسد والتحكم والخجل والقيمة الذاتية. وقد يتطلب العلاج أيضًا التعاون مع مختصين طبيين وتغذويين.",
    },

    therapyBenefits: [
      {
        number: "01",
        title: {
          en: "Understand patterns",
          ar: "فهم الأنماط",
        },
        text: {
          en: "Explore situations and emotions connected to eating behaviours.",
          ar: "استكشاف المواقف والمشاعر المرتبطة بسلوكيات الأكل.",
        },
      },
      {
        number: "02",
        title: {
          en: "Reduce shame",
          ar: "تقليل الخجل",
        },
        text: {
          en: "Create a confidential space to discuss experiences without judgement.",
          ar: "توفير مساحة سرية لمناقشة التجارب دون أحكام.",
        },
      },
      {
        number: "03",
        title: {
          en: "Build emotional regulation",
          ar: "بناء تنظيم المشاعر",
        },
        text: {
          en: "Develop alternatives for responding to distress, anxiety, and difficult emotions.",
          ar: "تطوير بدائل للتعامل مع الضغط والقلق والمشاعر الصعبة.",
        },
      },
      {
        number: "04",
        title: {
          en: "Strengthen self-worth",
          ar: "تعزيز القيمة الذاتية",
        },
        text: {
          en: "Develop an identity and sense of worth that are not defined only by appearance.",
          ar: "بناء هوية وإحساس بالقيمة لا يحددهما المظهر وحده.",
        },
      },
    ],

    approachesIntro: {
      en: "Eating difficulties often benefit from coordinated care. The most appropriate treatment depends on physical health, symptoms, age, severity, and individual circumstances.",
      ar: "غالبًا ما تستفيد صعوبات الأكل من رعاية منسقة. ويعتمد العلاج الأنسب على الصحة الجسدية والأعراض والعمر وشدة الحالة والظروف الفردية.",
    },

    approaches: [
      {
        title: {
          en: "Eating-disorder-focused CBT",
          ar: "العلاج المعرفي السلوكي الموجه لصعوبات الأكل",
        },
        text: {
          en: "Addresses eating patterns, rigid rules, body-image concerns, and maintaining behaviours.",
          ar: "يتعامل مع أنماط الأكل والقواعد الصارمة ومخاوف صورة الجسد والسلوكيات التي تحافظ على الصعوبة.",
        },
      },
      {
        title: {
          en: "Compassion-focused therapy",
          ar: "العلاج المرتكز على التعاطف",
        },
        text: {
          en: "Supports work with shame, self-criticism, body image, and emotional pain.",
          ar: "يدعم التعامل مع الخجل ونقد الذات وصورة الجسد والألم النفسي.",
        },
      },
      {
        title: {
          en: "Multidisciplinary support",
          ar: "الدعم متعدد التخصصات",
        },
        text: {
          en: "May involve psychotherapy, medical monitoring, nutritional care, and specialist services.",
          ar: "قد يشمل العلاج النفسي والمتابعة الطبية والرعاية التغذوية والخدمات المتخصصة.",
        },
      },
    ],

    faq: [
      {
        question: {
          en: "Do I need to be underweight to have an eating disorder?",
          ar: "هل يجب أن يكون وزني منخفضًا حتى أعاني من اضطراب في الأكل؟",
        },
        answer: {
          en: "No. Eating disorders and significant eating difficulties can affect people at any body size. Appearance alone does not show the severity of someone's experience.",
          ar: "لا. قد تؤثر اضطرابات الأكل وصعوباته الشديدة في أشخاص من مختلف أحجام الأجسام. ولا يكشف المظهر وحده عن شدة تجربة الشخص.",
        },
      },
      {
        question: {
          en: "Can I seek help before symptoms become severe?",
          ar: "هل يمكنني طلب المساعدة قبل أن تصبح الأعراض شديدة؟",
        },
        answer: {
          en: "Yes. You do not need to wait until the difficulty reaches a crisis. Early professional support can be valuable.",
          ar: "نعم. لا تحتاج إلى الانتظار حتى تصل الصعوبة إلى مرحلة أزمة. وقد يكون الدعم المهني المبكر مهمًا.",
        },
      },
      {
        question: {
          en: "Is psychotherapy enough on its own?",
          ar: "هل يكفي العلاج النفسي وحده؟",
        },
        answer: {
          en: "That depends on the situation. Some people may also require medical assessment, physical-health monitoring, nutritional support, or specialist eating-disorder services.",
          ar: "يعتمد ذلك على الحالة. فقد يحتاج بعض الأشخاص أيضًا إلى تقييم طبي أو متابعة للصحة الجسدية أو دعم تغذوي أو خدمات متخصصة في اضطرابات الأكل.",
        },
      },
    ],

    background: "bg-[#eadfdc]",
    accent: "bg-[#a8817b]",
    secondaryAccent: "bg-[#faf4ef]",
    shape: "rounded-[61%_39%_48%_52%/40%_55%_45%_60%]",
  },
};

export default function SupportTopicPage() {
  const params = useParams();
  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  const [language, setLanguage] = useState<Language>("en");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const updateLanguage = () => {
      const savedLanguage = localStorage.getItem("language") as Language;

      if (savedLanguage === "en" || savedLanguage === "ar") {
        setLanguage(savedLanguage);
      }
    };

    updateLanguage();

    window.addEventListener("storage", updateLanguage);
    window.addEventListener("languageChange", updateLanguage);

    return () => {
      window.removeEventListener("storage", updateLanguage);
      window.removeEventListener("languageChange", updateLanguage);
    };
  }, []);

  const topic = slug ? supportTopics[slug] : undefined;
  const isArabic = language === "ar";

  if (!topic) {
    return (
      <main
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-screen bg-[#f8f4ee] text-[#223748]"
      >
        <Navbar />

        <section className="flex min-h-[75vh] items-center px-5 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto w-full max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#b39668]">
              404
            </p>

            <h1 className="mt-5 text-4xl font-bold sm:text-6xl">
              {isArabic
                ? "لم نتمكن من العثور على هذا المجال."
                : "We could not find this area of support."}
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#66727a]">
              {isArabic
                ? "قد يكون الرابط غير صحيح أو لم تعد الصفحة متاحة. يمكنك العودة إلى جميع مجالات الدعم."
                : "The link may be incorrect or the page may no longer be available. You can return to all areas of support."}
            </p>

            <Link
              href="/support"
              className="mt-9 inline-flex rounded-2xl bg-[#415a72] px-8 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#32495f]"
            >
              {isArabic
                ? "العودة إلى مجالات الدعم"
                : "Return to Areas of Support"}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-[#f8f4ee] text-[#223748]"
    >
      <Navbar />

      {/* Breadcrumb */}
      <div className="px-5 pt-8 sm:px-8 lg:px-12">
        <nav
          aria-label="Breadcrumb"
          className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 text-sm text-[#6b777e]"
        >
          <Link href="/" className="transition hover:text-[#415a72]">
            {isArabic ? "الرئيسية" : "Home"}
          </Link>

          <span aria-hidden="true">/</span>

          <Link href="/support" className="transition hover:text-[#415a72]">
            {isArabic ? "مجالات الدعم" : "Areas of Support"}
          </Link>

          <span aria-hidden="true">/</span>

          <span className="font-semibold text-[#415a72]">
            {isArabic ? topic.title.ar : topic.title.en}
          </span>
        </nav>
      </div>

      {/* Hero */}
<section className="relative overflow-hidden px-5 pb-20 pt-12 sm:px-8 lg:px-12 lg:pb-28 lg:pt-16">
  <div className="absolute inset-0 -z-10">
    <div className="absolute -right-32 top-10 h-96 w-96 rounded-full bg-[#cbb48c]/20 blur-3xl" />

    <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-[#415a72]/10 blur-3xl" />
  </div>

  <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
    {/* Hero text */}
    <div className={isArabic ? "text-right" : "text-left"}>
      <div className="flex items-center gap-5">
        <span className="text-sm font-bold tracking-[0.28em] text-[#b39668]">
          {topic.number}
        </span>

        <span className="h-px w-14 bg-[#d4be95]" />

        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#a58455]">
          {isArabic ? topic.eyebrow.ar : topic.eyebrow.en}
        </p>
      </div>

      <h1 className="mt-8 max-w-4xl text-5xl font-bold leading-[0.98] text-[#223748] sm:text-7xl lg:text-[6.5rem]">
        {isArabic ? topic.title.ar : topic.title.en}
      </h1>

      <p className="mt-8 max-w-3xl text-xl font-medium leading-9 text-[#415a72] sm:text-2xl">
        {isArabic ? topic.subtitle.ar : topic.subtitle.en}
      </p>

      <p className="mt-8 max-w-3xl text-lg leading-9 text-[#66727a]">
        {isArabic ? topic.introduction.ar : topic.introduction.en}
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-5">
        <Link
          href="/booking"
          className="inline-flex items-center justify-center rounded-2xl bg-[#415a72] px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#32495f]"
        >
          {isArabic
            ? "احجز جلسة عبر الإنترنت"
            : "Book an Online Session"}
        </Link>

        <a
          href="#understanding"
          className="inline-flex items-center justify-center rounded-2xl border border-[#cdbb9e] px-8 py-4 text-lg font-semibold text-[#415a72] transition hover:border-[#a98b60] hover:bg-white"
        >
          {isArabic ? "اقرأ المزيد" : "Learn More"}
        </a>
      </div>
    </div>

    {/* Topic illustration */}
    <div className="relative mx-auto min-h-[420px] w-full max-w-[540px] overflow-hidden rounded-[3rem] sm:min-h-[540px]">
      <SupportIllustration
        slug={topic.slug}
        showNumber={false}
        className="min-h-[420px] sm:min-h-[540px]"
      />

      <span
        className={`pointer-events-none absolute top-9 z-20 text-sm font-bold tracking-[0.3em] text-[#415a72]/50 ${
          isArabic ? "right-9" : "left-9"
        }`}
      >
        AAN / {topic.number}
      </span>
    </div>
  </div>
</section>

      {/* Definition */}
      <section
        id="understanding"
        className="scroll-mt-28 px-5 py-20 sm:px-8 lg:px-12 lg:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 border-y border-[#ddd1bf] py-14 lg:grid-cols-[0.65fr_1.35fr] lg:py-20">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#a58455]">
                {isArabic ? "فهم التجربة" : "UNDERSTANDING THE EXPERIENCE"}
              </p>
            </div>

            <div>
              <h2 className="max-w-4xl text-3xl font-bold leading-tight sm:text-5xl">
                {isArabic
                  ? `ما المقصود بـ ${topic.title.ar}؟`
                  : `What is ${topic.title.en}?`}
              </h2>

              <p className="mt-7 max-w-4xl text-lg leading-9 text-[#66727a]">
                {isArabic ? topic.definition.ar : topic.definition.en}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Common signs */}
      <section className="px-5 pb-20 sm:px-8 lg:px-12 lg:pb-28">
        <div className="mx-auto max-w-7xl rounded-[2.75rem] bg-white p-8 shadow-sm sm:p-12 lg:p-16">
          <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#b39668]">
                {isArabic ? "علامات شائعة" : "COMMON SIGNS"}
              </p>

              <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">
                {isArabic
                  ? "قد تبدو التجربة مختلفة من شخص إلى آخر."
                  : "The experience may look different for every person."}
              </h2>

              <p className="mt-6 text-lg leading-8 text-[#66727a]">
                {isArabic ? topic.signsIntro.ar : topic.signsIntro.en}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {topic.signs.map((sign, index) => (
                <article
                  key={`${topic.slug}-sign-${index}`}
                  className="rounded-[1.75rem] border border-[#e3d8c7] bg-[#faf7f2] p-6"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#415a72] text-sm font-bold text-white">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <p className="pt-1 font-medium leading-7 text-[#44545e]">
                      {isArabic ? sign.ar : sign.en}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* When to seek support */}
      <section className="border-y border-[#e3d8c7] bg-[#f0ebe3] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#a58455]">
              {isArabic ? "متى تطلب الدعم؟" : "WHEN TO SEEK SUPPORT"}
            </p>

            <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">
              {isArabic
                ? "لا تحتاج إلى الانتظار حتى تصبح الأمور غير محتملة."
                : "You do not need to wait until things become unbearable."}
            </h2>

            <p className="mt-6 text-lg leading-8 text-[#66727a]">
              {isArabic
                ? topic.seekHelpIntro.ar
                : topic.seekHelpIntro.en}
            </p>

            <Link
              href="/booking"
              className="mt-9 inline-flex rounded-2xl bg-[#415a72] px-8 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#32495f]"
            >
              {isArabic ? "ابدأ عملية الحجز" : "Begin Booking"}
            </Link>
          </div>

          <div className="rounded-[2.5rem] bg-[#223748] p-8 text-white sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d4be95]">
              {isArabic
                ? "قد يكون الوقت مناسبًا للتحدث مع معالج إذا:"
                : "IT MAY BE TIME TO SPEAK WITH A THERAPIST IF:"}
            </p>

            <div className="mt-8 space-y-5">
              {topic.seekHelpPoints.map((point, index) => (
                <div
                  key={`${topic.slug}-support-${index}`}
                  className="flex items-start gap-4 border-t border-white/15 pt-5"
                >
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#d4be95] text-sm font-bold text-[#223748]">
                    ✓
                  </span>

                  <p className="leading-8 text-white/80">
                    {isArabic ? point.ar : point.en}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How therapy helps */}
      <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#b39668]">
              {isArabic
                ? "كيف يمكن للعلاج النفسي أن يساعد؟"
                : "HOW PSYCHOTHERAPY MAY HELP"}
            </p>

            <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">
              {isArabic
                ? "العلاج مساحة لفهم التجربة وبناء استجابات جديدة."
                : "Therapy offers space to understand the experience and build new responses."}
            </h2>

            <p className="mt-6 text-lg leading-8 text-[#66727a]">
              {isArabic
                ? topic.therapyIntro.ar
                : topic.therapyIntro.en}
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {topic.therapyBenefits.map((benefit) => (
              <article
                key={`${topic.slug}-benefit-${benefit.number}`}
                className="rounded-[2rem] border border-[#dfd4c3] bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="text-sm font-bold tracking-[0.24em] text-[#b39668]">
                  {benefit.number}
                </span>

                <h3 className="mt-7 text-2xl font-bold">
                  {isArabic ? benefit.title.ar : benefit.title.en}
                </h3>

                <p className="mt-4 leading-8 text-[#68747b]">
                  {isArabic ? benefit.text.ar : benefit.text.en}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Approaches */}
      <section className="px-5 pb-20 sm:px-8 lg:px-12 lg:pb-28">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.75rem] bg-[#e7dfd2]">
          <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
            <div className="relative min-h-[390px] overflow-hidden">
                <SupportIllustration
                    slug={topic.slug}
                    showNumber={false}
                    className="min-h-[390px]"
                />
            </div>
            <div className="p-8 sm:p-12 lg:p-16">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#8f744d]">
                {isArabic
                  ? "الأساليب العلاجية"
                  : "THERAPEUTIC APPROACHES"}
              </p>

              <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">
                {isArabic
                  ? "يتم تكييف العلاج مع احتياجات كل شخص."
                  : "Treatment is adapted to each person's needs."}
              </h2>

              <p className="mt-6 text-lg leading-8 text-[#5f6b72]">
                {isArabic
                  ? topic.approachesIntro.ar
                  : topic.approachesIntro.en}
              </p>

              <div className="mt-10 space-y-7">
                {topic.approaches.map((approach, index) => (
                  <article
                    key={`${topic.slug}-approach-${index}`}
                    className="border-t border-[#cdbfa9] pt-6"
                  >
                    <div className="flex items-start gap-5">
                      <span className="text-sm font-bold tracking-[0.22em] text-[#a58455]">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div>
                        <h3 className="text-xl font-bold">
                          {isArabic
                            ? approach.title.ar
                            : approach.title.en}
                        </h3>

                        <p className="mt-3 leading-8 text-[#657078]">
                          {isArabic
                            ? approach.text.ar
                            : approach.text.en}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Important note */}
      <section className="px-5 pb-20 sm:px-8 lg:px-12 lg:pb-28">
        <div className="mx-auto max-w-7xl rounded-[2.25rem] border border-[#dccfb9] bg-white p-8 sm:p-10">
          <div className="grid gap-7 lg:grid-cols-[auto_1fr]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ece2d2] text-2xl font-bold text-[#8f744d]">
              i
            </div>

            <div>
              <h2 className="text-2xl font-bold">
                {isArabic
                  ? "ملاحظة مهمة"
                  : "An important note"}
              </h2>

              <p className="mt-4 max-w-5xl leading-8 text-[#66727a]">
                {isArabic
                  ? "هذه الصفحة تقدم معلومات عامة ولا تُستخدم للتشخيص أو كبديل عن التقييم الطبي أو النفسي المهني. قد يحتاج بعض الأشخاص إلى دعم من طبيب أو طبيب نفسي أو خدمات متخصصة إلى جانب العلاج النفسي."
                  : "This page provides general information and is not intended to diagnose a condition or replace a professional medical or psychological assessment. Some people may require support from a doctor, psychiatrist, or specialist service alongside psychotherapy."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-y border-[#e3d8c7] bg-[#f1ece4] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#a58455]">
              {isArabic ? "أسئلة شائعة" : "FREQUENTLY ASKED QUESTIONS"}
            </p>

            <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">
              {isArabic
                ? "بعض الأسئلة التي قد تكون لديك."
                : "Some questions you may be carrying."}
            </h2>

            <p className="mt-6 text-lg leading-8 text-[#66727a]">
              {isArabic
                ? "لا توجد تجربة واحدة تنطبق على الجميع. يمكن للمعالج مساعدتك على فهم ما يحدث ضمن ظروفك الخاصة."
                : "No single experience applies to everyone. A therapist can help you understand what is happening within your individual circumstances."}
            </p>
          </div>

          <div className="space-y-4">
            {topic.faq.map((item, index) => {
              const isOpen = openFaq === index;

              return (
                <article
                  key={`${topic.slug}-faq-${index}`}
                  className="overflow-hidden rounded-[1.75rem] border border-[#ddd1bf] bg-white"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className={`flex w-full items-center justify-between gap-6 p-6 text-left sm:p-7 ${
                      isArabic ? "text-right" : "text-left"
                    }`}
                  >
                    <span className="text-lg font-bold leading-7 text-[#223748]">
                      {isArabic ? item.question.ar : item.question.en}
                    </span>

                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f0ebe3] text-xl text-[#415a72] transition ${
                        isOpen ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-[#ece3d6] px-6 pb-7 pt-5 sm:px-7">
                      <p className="leading-8 text-[#66727a]">
                        {isArabic ? item.answer.ar : item.answer.en}
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Explore another topic */}
      <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#b39668]">
            {isArabic
              ? "استكشف المزيد"
              : "CONTINUE EXPLORING"}
          </p>

          <h2 className="mx-auto mt-5 max-w-4xl text-3xl font-bold leading-tight sm:text-5xl">
            {isArabic
              ? "قد تتداخل التجارب النفسية ولا تنتمي دائمًا إلى مجال واحد."
              : "Emotional experiences can overlap and may not fit within one category."}
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#66727a]">
            {isArabic
              ? "يمكنك استكشاف جميع مجالات الدعم أو البدء مباشرة في العثور على معالج يتوافق مع احتياجاتك."
              : "You can explore all areas of support or begin finding a therapist whose experience corresponds to your needs."}
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link
              href="/support"
              className="inline-flex rounded-2xl border border-[#bda98a] px-8 py-4 font-semibold text-[#415a72] transition hover:bg-white"
            >
              {isArabic
                ? "جميع مجالات الدعم"
                : "View All Areas"}
            </Link>

            <Link
              href="/therapists"
              className="inline-flex rounded-2xl bg-[#415a72] px-8 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#32495f]"
            >
              {isArabic
                ? "تعرّف إلى المعالجين"
                : "Meet Our Therapists"}
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 pb-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.8rem] bg-[#223748]">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col justify-center p-8 text-white sm:p-12 lg:p-16">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d4be95]">
                AAN Psychotherapy
              </p>

              <h2 className="mt-5 max-w-4xl text-4xl font-bold leading-tight sm:text-6xl">
                {isArabic
                  ? "لست مضطرًا إلى التعامل مع هذا بمفردك."
                  : "You do not have to navigate this alone."}
              </h2>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">
                {isArabic
                  ? "ابدأ بخطوات بسيطة. أجب عن بعض الأسئلة، استكشف المعالجين المتاحين، واختر الموعد الذي يناسبك."
                  : "Begin with a few simple steps. Answer some questions, explore available therapists, and choose a time that works for you."}
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

            <div className="relative min-h-[380px] overflow-hidden">
        <SupportIllustration
            slug={topic.slug}
            showNumber={false}
            className="min-h-[380px]"
          />
        </div>
                </div>
        </div>
      </section>
    </main>
  );
}