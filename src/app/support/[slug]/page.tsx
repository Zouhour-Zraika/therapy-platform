"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import SupportIllustration from "../../components/SupportIllustration";
import { Language } from "../../lib/translations";

type LocalizedText = {
  en: string;
  fr: string;
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
      fr: "Anxiété",
      ar: "القلق",
    },

    eyebrow: {
      en: "UNDERSTANDING ANXIETY",
      fr: "COMPRENDRE L’ANXIÉTÉ",
      ar: "فهم القلق",
    },

    subtitle: {
      en: "When worry begins to take up too much space.",
      fr: "Lorsque l’inquiétude commence à prendre trop de place.",
      ar: "عندما يبدأ القلق في شغل مساحة أكبر من اللازم.",
    },

    introduction: {
      en: "Anxiety is a natural response to uncertainty, pressure, or perceived danger. It can become difficult when worry remains present for long periods, feels hard to control, or begins to affect your daily life.",
      fr: "L’anxiété est une réponse naturelle à l’incertitude, à la pression ou à un danger perçu. Elle peut devenir difficile à vivre lorsque l’inquiétude persiste longtemps, semble difficile à contrôler ou commence à affecter votre vie quotidienne.",
      ar: "القلق استجابة طبيعية لعدم اليقين أو الضغط أو الشعور بالخطر. لكنه قد يصبح صعبًا عندما يستمر لفترات طويلة أو يصعب التحكم فيه أو يبدأ في التأثير في حياتك اليومية.",
    },

    definition: {
      en: "Anxiety can affect thoughts, emotions, the body, and behaviour. Some people experience constant worry, while others notice panic, physical tension, avoidance, irritability, or difficulty feeling safe even when no immediate danger is present.",
      fr: "L’anxiété peut affecter les pensées, les émotions, le corps et les comportements. Certaines personnes ressentent une inquiétude constante, tandis que d’autres connaissent des épisodes de panique, des tensions physiques, de l’évitement, de l’irritabilité ou des difficultés à se sentir en sécurité même lorsqu’aucun danger immédiat n’est présent.",
      ar: "يمكن أن يؤثر القلق في الأفكار والمشاعر والجسد والسلوك. قد يعاني بعض الأشخاص من تفكير مستمر، بينما يلاحظ آخرون نوبات هلع أو توترًا جسديًا أو تجنبًا أو انفعالًا أو صعوبة في الشعور بالأمان حتى في غياب خطر مباشر.",
    },

    signsIntro: {
      en: "Anxiety can look different from one person to another. Common experiences may include:",
      fr: "L’anxiété peut se manifester différemment d’une personne à l’autre. Les expériences fréquentes peuvent inclure :",
      ar: "قد يظهر القلق بصورة مختلفة من شخص إلى آخر. ومن التجارب الشائعة:",
    },

    signs: [
      {
        en: "Persistent worry that feels difficult to control",
        fr: "Une inquiétude persistante difficile à contrôler",
        ar: "قلق مستمر يصعب التحكم فيه",
      },
      {
        en: "Restlessness, tension, or feeling constantly alert",
        fr: "De l’agitation, de la tension ou le sentiment d’être constamment en état d’alerte",
        ar: "التململ أو التوتر أو الشعور الدائم بالتأهب",
      },
      {
        en: "Rapid heartbeat, shortness of breath, or dizziness",
        fr: "Des palpitations, un essoufflement ou des étourdissements",
        ar: "تسارع ضربات القلب أو ضيق التنفس أو الدوار",
      },
      {
        en: "Difficulty concentrating or making decisions",
        fr: "Des difficultés à se concentrer ou à prendre des décisions",
        ar: "صعوبة التركيز أو اتخاذ القرارات",
      },
      {
        en: "Avoiding situations because they feel overwhelming",
        fr: "Éviter certaines situations parce qu’elles semblent trop difficiles à gérer",
        ar: "تجنب مواقف معينة لأنها تبدو مرهقة أو مخيفة",
      },
      {
        en: "Sleep difficulties, fatigue, or irritability",
        fr: "Des troubles du sommeil, de la fatigue ou de l’irritabilité",
        ar: "صعوبات النوم أو التعب أو الانفعال",
      },
    ],

    seekHelpIntro: {
      en: "You may consider speaking with a therapist when anxiety begins to interfere with your wellbeing, relationships, work, studies, or ability to participate in everyday life.",
      fr: "Il peut être utile de parler à un thérapeute lorsque l’anxiété commence à affecter votre bien-être, vos relations, votre travail, vos études ou votre capacité à participer à la vie quotidienne.",
      ar: "قد يكون من المفيد التحدث مع معالج عندما يبدأ القلق في التأثير في صحتك النفسية أو علاقاتك أو عملك أو دراستك أو قدرتك على ممارسة حياتك اليومية.",
    },

    seekHelpPoints: [
      {
        en: "Worry occupies a large part of your day",
        fr: "L’inquiétude occupe une grande partie de votre journée",
        ar: "يستحوذ القلق على جزء كبير من يومك",
      },
      {
        en: "You avoid people, places, or responsibilities",
        fr: "Vous évitez certaines personnes, certains lieux ou certaines responsabilités",
        ar: "تتجنب أشخاصًا أو أماكن أو مسؤوليات",
      },
      {
        en: "Physical symptoms feel intense or frightening",
        fr: "Les symptômes physiques semblent intenses ou effrayants",
        ar: "تبدو الأعراض الجسدية شديدة أو مخيفة",
      },
      {
        en: "Your usual coping strategies are no longer helping",
        fr: "Vos stratégies habituelles pour faire face ne vous aident plus",
        ar: "لم تعد طرق التأقلم المعتادة تساعدك",
      },
    ],

    therapyIntro: {
      en: "Psychotherapy can help you understand what contributes to anxiety and develop more balanced ways of responding to anxious thoughts, emotions, and physical sensations.",
      fr: "La psychothérapie peut vous aider à comprendre ce qui contribue à l’anxiété et à développer des façons plus équilibrées de répondre aux pensées anxieuses, aux émotions et aux sensations physiques.",
      ar: "يمكن للعلاج النفسي أن يساعدك على فهم العوامل التي تسهم في القلق وتطوير طرق أكثر توازنًا للتعامل مع الأفكار والمشاعر والأحاسيس الجسدية المرتبطة به.",
    },

    therapyBenefits: [
      {
        number: "01",
        title: {
          en: "Recognise triggers",
          fr: "Identifier les déclencheurs",
          ar: "التعرف إلى المحفزات",
        },
        text: {
          en: "Explore situations, thoughts, and experiences that intensify anxiety.",
          fr: "Explorer les situations, les pensées et les expériences qui intensifient l’anxiété.",
          ar: "استكشاف المواقف والأفكار والتجارب التي تزيد من شدة القلق.",
        },
      },
      {
        number: "02",
        title: {
          en: "Understand patterns",
          fr: "Comprendre les schémas",
          ar: "فهم الأنماط",
        },
        text: {
          en: "Notice cycles of worry, avoidance, reassurance seeking, and temporary relief.",
          fr: "Repérer les cycles d’inquiétude, d’évitement, de recherche de réassurance et de soulagement temporaire.",
          ar: "ملاحظة دوائر القلق والتجنب وطلب الطمأنة والراحة المؤقتة.",
        },
      },
      {
        number: "03",
        title: {
          en: "Build coping skills",
          fr: "Développer des stratégies d’adaptation",
          ar: "بناء مهارات للتأقلم",
        },
        text: {
          en: "Develop practical ways to regulate emotions and respond to stress.",
          fr: "Développer des moyens pratiques de réguler les émotions et de répondre au stress.",
          ar: "تطوير طرق عملية لتنظيم المشاعر والاستجابة للضغط.",
        },
      },
      {
        number: "04",
        title: {
          en: "Restore confidence",
          fr: "Retrouver confiance",
          ar: "استعادة الثقة",
        },
        text: {
          en: "Gradually reconnect with situations that anxiety may have made difficult.",
          fr: "Revenir progressivement vers les situations que l’anxiété a pu rendre difficiles.",
          ar: "العودة تدريجيًا إلى المواقف التي جعلها القلق أكثر صعوبة.",
        },
      },
    ],

    approachesIntro: {
      en: "The therapeutic approach will depend on your experience, needs, preferences, and the therapist's clinical assessment.",
      fr: "L’approche thérapeutique dépendra de votre expérience, de vos besoins, de vos préférences et de l’évaluation clinique du thérapeute.",
      ar: "يعتمد الأسلوب العلاجي على تجربتك واحتياجاتك وتفضيلاتك والتقييم المهني للمعالج.",
    },

    approaches: [
      {
        title: {
          en: "Cognitive Behavioural Therapy",
          fr: "Thérapie cognitivo-comportementale",
          ar: "العلاج المعرفي السلوكي",
        },
        text: {
          en: "Explores connections between thoughts, emotions, behaviours, and physical responses.",
          fr: "Explore les liens entre les pensées, les émotions, les comportements et les réactions physiques.",
          ar: "يستكشف العلاقة بين الأفكار والمشاعر والسلوكيات والاستجابات الجسدية.",
        },
      },
      {
        title: {
          en: "Acceptance-based approaches",
          fr: "Approches fondées sur l’acceptation",
          ar: "الأساليب القائمة على التقبل",
        },
        text: {
          en: "Support a different relationship with difficult thoughts and emotions.",
          fr: "Aident à développer une relation différente avec les pensées et les émotions difficiles.",
          ar: "تساعد على بناء علاقة مختلفة مع الأفكار والمشاعر الصعبة.",
        },
      },
      {
        title: {
          en: "Psychodynamic therapy",
          fr: "Thérapie psychodynamique",
          ar: "العلاج الديناميكي النفسي",
        },
        text: {
          en: "Explores deeper emotional patterns and past experiences that may shape anxiety.",
          fr: "Explore les schémas émotionnels plus profonds et les expériences passées qui peuvent influencer l’anxiété.",
          ar: "يستكشف الأنماط النفسية العميقة والتجارب السابقة التي قد تؤثر في القلق.",
        },
      },
    ],

    faq: [
      {
        question: {
          en: "Is anxiety always a mental health disorder?",
          fr: "L’anxiété est-elle toujours un trouble de santé mentale ?",
          ar: "هل يُعد القلق دائمًا اضطرابًا نفسيًا؟",
        },
        answer: {
          en: "No. Anxiety is a normal human response. It may require professional support when it becomes persistent, overwhelming, difficult to control, or disruptive to daily life.",
          fr: "Non. L’anxiété est une réaction humaine normale. Un soutien professionnel peut être utile lorsqu’elle devient persistante, envahissante, difficile à contrôler ou qu’elle perturbe la vie quotidienne.",
          ar: "لا. القلق استجابة إنسانية طبيعية. وقد يحتاج إلى دعم مهني عندما يصبح مستمرًا أو شديدًا أو يصعب التحكم فيه أو يؤثر في الحياة اليومية.",
        },
      },
      {
        question: {
          en: "Can therapy help with panic attacks?",
          fr: "La thérapie peut-elle aider en cas de crises de panique ?",
          ar: "هل يمكن للعلاج أن يساعد في نوبات الهلع؟",
        },
        answer: {
          en: "Therapy may help you understand panic symptoms, reduce fear of those sensations, identify triggers, and develop more effective responses.",
          fr: "La thérapie peut vous aider à comprendre les symptômes de panique, à réduire la peur de ces sensations, à identifier les déclencheurs et à développer des réponses plus efficaces.",
          ar: "قد يساعد العلاج على فهم أعراض الهلع وتقليل الخوف من الأحاسيس الجسدية والتعرف إلى المحفزات وتطوير استجابات أكثر فاعلية.",
        },
      },
      {
        question: {
          en: "Do I need to know what causes my anxiety?",
          fr: "Dois-je connaître la cause de mon anxiété ?",
          ar: "هل يجب أن أعرف سبب قلقي قبل بدء العلاج؟",
        },
        answer: {
          en: "No. You can begin therapy even when the cause is unclear. Understanding your experience can be part of the therapeutic process.",
          fr: "Non. Vous pouvez commencer une thérapie même lorsque la cause n’est pas claire. Comprendre votre expérience peut faire partie du processus thérapeutique.",
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
      fr: "Dépression",
      ar: "الاكتئاب",
    },

    eyebrow: {
      en: "UNDERSTANDING DEPRESSION",
      fr: "COMPRENDRE LA DÉPRESSION",
      ar: "فهم الاكتئاب",
    },

    subtitle: {
      en: "When the details of everyday life begin to feel heavier than they used to",
      fr: "Lorsque les détails de la vie quotidienne commencent à peser plus lourd qu’avant.",
      ar: "عندما تصبح تفاصيل الحياة اليومية أكثر ثقلًا مما اعتدت عليه",
    },

    introduction: {
      en: "Depression is not limited to feeling sad. It can affect the way you think, feel, relate to others, and go about your daily life. It may appear as a sense of inner emptiness, persistent exhaustion, loss of interest or motivation, irritability, or emotional numbness, even when everything seems normal from the outside. You do not have to face it alone. Begin your journey toward understanding and recovery through a therapeutic session in a safe and supportive environment.",
      fr: "La dépression ne se limite pas au fait de se sentir triste. Elle peut affecter votre manière de penser, de ressentir les choses, d’entrer en relation avec les autres et de vivre votre quotidien. Elle peut se manifester par un sentiment de vide intérieur, une fatigue persistante, une perte d’intérêt ou de motivation, de l’irritabilité ou un engourdissement émotionnel, même lorsque tout semble normal de l’extérieur. Vous n’avez pas à affronter cela seul. Commencez votre parcours vers la compréhension et le rétablissement à travers une séance thérapeutique dans un environnement sûr et bienveillant.",
      ar: "الاكتئاب لا يقتصر على الشعور بالحزن، بل قد يؤثر في طريقة تفكيرك، ومشاعرك، وعلاقاتك، وقدرتك على ممارسة حياتك اليومية. وقد يظهر على شكل فراغ داخلي، أو إرهاق مستمر، أو فقدان للشغف، أو انفعال متكرر، أو خدر عاطفي، حتى وإن بدا كل شيء طبيعيًا من الخارج. لست مضطرًا لمواجهة ذلك وحدك. ابدأ رحلتك نحو الفهم والتعافي من خلال جلسة علاجية في بيئة آمنة وداعمة.",
    },

    definition: {
      en: "Depression is more than having a difficult day or temporarily feeling low. It may continue over time and affect energy, sleep, motivation, appetite, concentration, self-esteem, relationships, and hope for the future.",
      fr: "La dépression est plus qu’une journée difficile ou une baisse temporaire du moral. Elle peut persister dans le temps et affecter l’énergie, le sommeil, la motivation, l’appétit, la concentration, l’estime de soi, les relations et l’espoir pour l’avenir.",
      ar: "الاكتئاب أكثر من مجرد يوم صعب أو انخفاض مؤقت في المزاج. فقد يستمر مع الوقت ويؤثر في الطاقة والنوم والدافع والشهية والتركيز وتقدير الذات والعلاقات والأمل في المستقبل.",
    },

    signsIntro: {
      en: "Not everyone experiences depression in the same way. Common signs may include:",
      fr: "La dépression ne se manifeste pas de la même manière chez tout le monde. Les signes fréquents peuvent inclure :",
      ar: "لا يختبر الجميع الاكتئاب بالطريقة نفسها. ومن العلامات الشائعة:",
    },

    signs: [
      {
        en: "Persistent sadness, emptiness, or emotional numbness",
        fr: "Une tristesse persistante, un sentiment de vide ou un engourdissement émotionnel",
        ar: "حزن أو فراغ أو خدر عاطفي مستمر",
      },
      {
        en: "Loss of interest or pleasure",
        fr: "Une perte d’intérêt ou de plaisir",
        ar: "فقدان الاهتمام أو المتعة",
      },
      {
        en: "Low energy or difficulty completing daily tasks",
        fr: "Un manque d’énergie ou des difficultés à accomplir les tâches quotidiennes",
        ar: "انخفاض الطاقة أو صعوبة إنجاز المهام اليومية",
      },
      {
        en: "Changes in sleep or appetite",
        fr: "Des changements du sommeil ou de l’appétit",
        ar: "تغيرات في النوم أو الشهية",
      },
      {
        en: "Withdrawal from relationships or activities",
        fr: "Un retrait des relations ou des activités",
        ar: "الانسحاب من العلاقات أو الأنشطة",
      },
      {
        en: "Self-criticism, guilt, or hopelessness",
        fr: "De l’autocritique, de la culpabilité ou un sentiment de désespoir",
        ar: "نقد الذات أو الشعور بالذنب أو اليأس",
      },
    ],

    seekHelpIntro: {
      en: "Professional support may be helpful when low mood or emotional disconnection persists, affects important areas of life, or becomes difficult to manage alone.",
      fr: "Un soutien professionnel peut être utile lorsqu’une baisse de moral ou un sentiment de déconnexion émotionnelle persiste, affecte des domaines importants de la vie ou devient difficile à gérer seul.",
      ar: "قد يكون الدعم المهني مفيدًا عندما يستمر انخفاض المزاج أو الانفصال العاطفي أو يؤثر في جوانب مهمة من الحياة أو يصبح من الصعب التعامل معه بمفردك.",
    },

    seekHelpPoints: [
      {
        en: "Daily responsibilities feel increasingly difficult",
        fr: "Les responsabilités quotidiennes deviennent de plus en plus difficiles",
        ar: "تصبح المسؤوليات اليومية أكثر صعوبة",
      },
      {
        en: "You feel disconnected from yourself or others",
        fr: "Vous vous sentez déconnecté de vous-même ou des autres",
        ar: "تشعر بالانفصال عن نفسك أو الآخرين",
      },
      {
        en: "You have stopped enjoying things that once mattered",
        fr: "Vous n’éprouvez plus de plaisir pour des choses qui comptaient auparavant",
        ar: "لم تعد تستمتع بالأشياء التي كانت مهمة بالنسبة إليك",
      },
      {
        en: "Your mood has remained low for an extended period",
        fr: "Votre humeur reste basse pendant une période prolongée",
        ar: "استمر انخفاض مزاجك لفترة طويلة",
      },
    ],

    therapyIntro: {
      en: "Therapy can provide a confidential space to understand your experience, explore contributing factors, and gradually rebuild connection, motivation, and emotional balance.",
      fr: "La thérapie peut offrir un espace confidentiel pour comprendre votre expérience, explorer les facteurs qui y contribuent et reconstruire progressivement le lien, la motivation et l’équilibre émotionnel.",
      ar: "يمكن للعلاج أن يوفر مساحة سرية لفهم تجربتك واستكشاف العوامل المؤثرة والعمل تدريجيًا على استعادة التواصل والدافع والتوازن النفسي.",
    },

    therapyBenefits: [
      {
        number: "01",
        title: {
          en: "Name the experience",
          fr: "Mettre des mots sur l’expérience",
          ar: "فهم التجربة وتسميتها",
        },
        text: {
          en: "Put words to emotions that may feel confusing, distant, or overwhelming.",
          fr: "Mettre des mots sur des émotions qui peuvent sembler confuses, lointaines ou envahissantes.",
          ar: "إيجاد كلمات للمشاعر التي قد تبدو مربكة أو بعيدة أو شديدة.",
        },
      },
      {
        number: "02",
        title: {
          en: "Explore contributing factors",
          fr: "Explorer les facteurs contributifs",
          ar: "استكشاف العوامل المؤثرة",
        },
        text: {
          en: "Understand emotional, relational, behavioural, and situational influences.",
          fr: "Comprendre les influences émotionnelles, relationnelles, comportementales et situationnelles.",
          ar: "فهم العوامل النفسية والعلاقية والسلوكية والظرفية.",
        },
      },
      {
        number: "03",
        title: {
          en: "Rebuild daily structure",
          fr: "Reconstruire une structure quotidienne",
          ar: "إعادة بناء الروتين اليومي",
        },
        text: {
          en: "Create manageable steps toward activity, connection, and self-care.",
          fr: "Créer des étapes réalisables vers l’activité, le lien aux autres et les soins personnels.",
          ar: "وضع خطوات قابلة للتطبيق نحو النشاط والتواصل والعناية بالنفس.",
        },
      },
      {
        number: "04",
        title: {
          en: "Develop self-compassion",
          fr: "Développer l’autocompassion",
          ar: "تطوير التعاطف مع الذات",
        },
        text: {
          en: "Challenge harsh self-judgement and build a more supportive inner relationship.",
          fr: "Remettre en question les jugements sévères envers soi-même et construire une relation intérieure plus soutenante.",
          ar: "مواجهة الأحكام القاسية على الذات وبناء علاقة داخلية أكثر دعمًا.",
        },
      },
    ],

    approachesIntro: {
      en: "Therapy is adapted to the individual. Different approaches may be used according to your needs and the therapist's professional assessment.",
      fr: "La thérapie est adaptée à chaque personne. Différentes approches peuvent être utilisées selon vos besoins et l’évaluation professionnelle du thérapeute.",
      ar: "يتم تكييف العلاج مع كل شخص. وقد تُستخدم أساليب مختلفة وفقًا لاحتياجاتك والتقييم المهني للمعالج.",
    },

    approaches: [
      {
        title: {
          en: "Cognitive Behavioural Therapy",
          fr: "Thérapie cognitivo-comportementale",
          ar: "العلاج المعرفي السلوكي",
        },
        text: {
          en: "Works with patterns of thinking and behaviour that may maintain low mood.",
          fr: "Travaille sur les schémas de pensée et de comportement qui peuvent entretenir une humeur dépressive.",
          ar: "يعمل على أنماط التفكير والسلوك التي قد تسهم في استمرار انخفاض المزاج.",
        },
      },
      {
        title: {
          en: "Interpersonal therapy",
          fr: "Thérapie interpersonnelle",
          ar: "العلاج بين الشخصي",
        },
        text: {
          en: "Explores relationships, role changes, conflict, grief, and social connection.",
          fr: "Explore les relations, les changements de rôle, les conflits, le deuil et les liens sociaux.",
          ar: "يستكشف العلاقات وتغير الأدوار والخلافات والحزن والتواصل الاجتماعي.",
        },
      },
      {
        title: {
          en: "Psychodynamic therapy",
          fr: "Thérapie psychodynamique",
          ar: "العلاج الديناميكي النفسي",
        },
        text: {
          en: "Explores emotional patterns, relationships, and earlier experiences.",
          fr: "Explore les schémas émotionnels, les relations et les expériences antérieures.",
          ar: "يستكشف الأنماط النفسية والعلاقات والتجارب السابقة.",
        },
      },
    ],

    faq: [
      {
        question: {
          en: "Is depression the same as sadness?",
          fr: "La dépression est-elle la même chose que la tristesse ?",
          ar: "هل الاكتئاب هو نفسه الحزن؟",
        },
        answer: {
          en: "Not necessarily. Sadness is a natural emotion, while depression may involve persistent changes in mood, energy, motivation, thinking, and functioning.",
          fr: "Pas nécessairement. La tristesse est une émotion naturelle, tandis que la dépression peut impliquer des changements persistants de l’humeur, de l’énergie, de la motivation, de la pensée et du fonctionnement quotidien.",
          ar: "ليس بالضرورة. الحزن شعور طبيعي، بينما قد يشمل الاكتئاب تغيرات مستمرة في المزاج والطاقة والدافع والتفكير والقدرة على أداء المهام.",
        },
      },
      {
        question: {
          en: "Can I seek therapy even if I am still functioning?",
          fr: "Puis-je consulter même si je continue à fonctionner au quotidien ?",
          ar: "هل يمكنني طلب العلاج حتى لو كنت ما زلت أؤدي مسؤولياتي؟",
        },
        answer: {
          en: "Yes. A person may continue working, studying, or caring for others while experiencing significant internal distress.",
          fr: "Oui. Une personne peut continuer à travailler, étudier ou s’occuper des autres tout en ressentant une souffrance intérieure importante.",
          ar: "نعم. قد يستمر الشخص في العمل أو الدراسة أو رعاية الآخرين رغم معاناته من ضغط نفسي داخلي كبير.",
        },
      },
      {
        question: {
          en: "How quickly does therapy help?",
          fr: "En combien de temps la thérapie peut-elle aider ?",
          ar: "كم من الوقت يحتاج العلاج ليساعدني؟",
        },
        answer: {
          en: "There is no single timeline. Progress depends on your experience, goals, circumstances, therapeutic approach, and relationship with your therapist.",
          fr: "Il n’existe pas de délai unique. Les progrès dépendent de votre expérience, de vos objectifs, de votre situation, de l’approche thérapeutique et de la relation avec votre thérapeute.",
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
      fr: "Relations",
      ar: "العلاقات",
    },

    eyebrow: {
      en: "UNDERSTANDING RELATIONSHIPS",
      fr: "COMPRENDRE LES RELATIONS",
      ar: "فهم العلاقات",
    },

    subtitle: {
      en: "When connection becomes difficult or painful.",
      fr: "Lorsque le lien avec les autres devient difficile ou douloureux.",
      ar: "عندما يصبح التواصل صعبًا أو مؤلمًا.",
    },

    introduction: {
      en: "Relationships can be a source of connection, meaning, and support, but they can also bring conflict, uncertainty, emotional distance, or recurring patterns that feel difficult to change.",
      fr: "Les relations peuvent être une source de lien, de sens et de soutien, mais elles peuvent aussi apporter des conflits, de l’incertitude, une distance émotionnelle ou des schémas répétitifs qui semblent difficiles à changer.",
      ar: "يمكن أن تكون العلاقات مصدرًا للتواصل والمعنى والدعم، لكنها قد تحمل أيضًا خلافات أو عدم يقين أو بعدًا عاطفيًا أو أنماطًا متكررة يصعب تغييرها.",
    },

    definition: {
      en: "Relationship difficulties may arise between partners, family members, friends, colleagues, or within your broader patterns of attachment and connection. Therapy can explore both current challenges and the experiences that shape how you relate to others.",
      fr: "Les difficultés relationnelles peuvent apparaître entre partenaires, membres de la famille, amis, collègues, ou dans vos schémas plus généraux d’attachement et de lien. La thérapie peut explorer à la fois les difficultés actuelles et les expériences qui influencent votre manière d’entrer en relation avec les autres.",
      ar: "قد تظهر صعوبات العلاقات بين الشريكين أو أفراد الأسرة أو الأصدقاء أو الزملاء، أو ضمن أنماطك العامة في التعلق والتواصل. ويمكن للعلاج استكشاف التحديات الحالية والتجارب التي تشكل طريقة ارتباطك بالآخرين.",
    },

    signsIntro: {
      en: "You may notice recurring experiences such as:",
      fr: "Vous pouvez remarquer des expériences récurrentes telles que :",
      ar: "قد تلاحظ تجارب متكررة مثل:",
    },

    signs: [
      {
        en: "Frequent conflict or unresolved arguments",
        fr: "Des conflits fréquents ou des disputes non résolues",
        ar: "خلافات متكررة أو مشكلات لا يتم حلها",
      },
      {
        en: "Difficulty expressing needs or emotions",
        fr: "Des difficultés à exprimer vos besoins ou vos émotions",
        ar: "صعوبة التعبير عن الاحتياجات أو المشاعر",
      },
      {
        en: "Emotional distance, loneliness, or disconnection",
        fr: "Une distance émotionnelle, de la solitude ou un sentiment de déconnexion",
        ar: "بعد عاطفي أو وحدة أو انفصال",
      },
      {
        en: "Problems with trust, jealousy, or boundaries",
        fr: "Des difficultés liées à la confiance, à la jalousie ou aux limites",
        ar: "صعوبات في الثقة أو الغيرة أو الحدود",
      },
      {
        en: "Repeated relationship patterns",
        fr: "Des schémas relationnels qui se répètent",
        ar: "تكرار الأنماط نفسها داخل العلاقات",
      },
      {
        en: "Fear of abandonment, rejection, or intimacy",
        fr: "La peur de l’abandon, du rejet ou de l’intimité",
        ar: "الخوف من الهجر أو الرفض أو القرب العاطفي",
      },
    ],

    seekHelpIntro: {
      en: "Therapy may be helpful when relationship difficulties repeatedly cause distress, affect emotional safety, or leave you feeling unable to create meaningful change.",
      fr: "La thérapie peut être utile lorsque les difficultés relationnelles provoquent régulièrement de la souffrance, affectent votre sécurité émotionnelle ou vous donnent le sentiment de ne pas pouvoir créer de changement significatif.",
      ar: "قد يكون العلاج مفيدًا عندما تسبب صعوبات العلاقات ضغطًا متكررًا أو تؤثر في الأمان النفسي أو تجعلك تشعر بعدم القدرة على إحداث تغيير حقيقي.",
    },

    seekHelpPoints: [
      {
        en: "The same conflicts continue without resolution",
        fr: "Les mêmes conflits se répètent sans trouver de solution",
        ar: "تستمر الخلافات نفسها دون حل",
      },
      {
        en: "Communication often becomes defensive or withdrawn",
        fr: "La communication devient souvent défensive ou se transforme en retrait",
        ar: "يتحول التواصل غالبًا إلى دفاع أو انسحاب",
      },
      {
        en: "You struggle to maintain healthy boundaries",
        fr: "Vous avez du mal à maintenir des limites saines",
        ar: "تجد صعوبة في الحفاظ على حدود صحية",
      },
      {
        en: "A relationship is significantly affecting your wellbeing",
        fr: "Une relation affecte de manière importante votre bien-être",
        ar: "تؤثر علاقة ما بصورة كبيرة في صحتك النفسية",
      },
    ],

    therapyIntro: {
      en: "Psychotherapy can help you understand emotional needs, communication patterns, attachment experiences, boundaries, and the ways you protect yourself within relationships.",
      fr: "La psychothérapie peut vous aider à comprendre vos besoins émotionnels, vos schémas de communication, vos expériences d’attachement, vos limites et les façons dont vous cherchez à vous protéger dans les relations.",
      ar: "يمكن للعلاج النفسي أن يساعدك على فهم الاحتياجات العاطفية وأنماط التواصل وتجارب التعلق والحدود والطرق التي تحمي بها نفسك داخل العلاقات.",
    },

    therapyBenefits: [
      {
        number: "01",
        title: {
          en: "Improve communication",
          fr: "Améliorer la communication",
          ar: "تحسين التواصل",
        },
        text: {
          en: "Learn to express needs and emotions with greater clarity.",
          fr: "Apprendre à exprimer vos besoins et vos émotions avec davantage de clarté.",
          ar: "تعلم التعبير عن الاحتياجات والمشاعر بصورة أكثر وضوحًا.",
        },
      },
      {
        number: "02",
        title: {
          en: "Recognise patterns",
          fr: "Identifier les schémas",
          ar: "التعرف إلى الأنماط",
        },
        text: {
          en: "Understand cycles of pursuit, withdrawal, conflict, or avoidance.",
          fr: "Comprendre les cycles de poursuite, de retrait, de conflit ou d’évitement.",
          ar: "فهم دوائر المطاردة والانسحاب والخلاف أو التجنب.",
        },
      },
      {
        number: "03",
        title: {
          en: "Strengthen boundaries",
          fr: "Renforcer les limites",
          ar: "تقوية الحدود",
        },
        text: {
          en: "Develop clearer limits while remaining connected to others.",
          fr: "Développer des limites plus claires tout en restant en lien avec les autres.",
          ar: "تطوير حدود أكثر وضوحًا مع الحفاظ على التواصل مع الآخرين.",
        },
      },
      {
        number: "04",
        title: {
          en: "Build emotional safety",
          fr: "Développer la sécurité émotionnelle",
          ar: "بناء الأمان النفسي",
        },
        text: {
          en: "Create healthier ways of responding during vulnerable moments.",
          fr: "Créer des façons plus saines de répondre lors des moments de vulnérabilité.",
          ar: "بناء طرق أكثر صحة للاستجابة في اللحظات الحساسة.",
        },
      },
    ],

    approachesIntro: {
      en: "Relationship work may take place individually or with a couple, depending on the concern and the services available.",
      fr: "Le travail sur les relations peut se faire individuellement ou en couple, selon la difficulté rencontrée et les services disponibles.",
      ar: "قد يتم العمل على صعوبات العلاقات بصورة فردية أو مع الشريكين، وفقًا لطبيعة المشكلة والخدمات المتاحة.",
    },

    approaches: [
      {
        title: {
          en: "Couples therapy",
          fr: "Thérapie de couple",
          ar: "العلاج الزوجي",
        },
        text: {
          en: "Supports partners in understanding conflict, communication, trust, and emotional connection.",
          fr: "Aide les partenaires à comprendre les conflits, la communication, la confiance et le lien émotionnel.",
          ar: "يدعم الشريكين في فهم الخلافات والتواصل والثقة والترابط العاطفي.",
        },
      },
      {
        title: {
          en: "Attachment-based therapy",
          fr: "Thérapie fondée sur l’attachement",
          ar: "العلاج القائم على التعلق",
        },
        text: {
          en: "Explores how earlier relationships may shape current emotional needs and responses.",
          fr: "Explore la manière dont les relations passées peuvent influencer les besoins et les réactions émotionnelles actuels.",
          ar: "يستكشف كيف يمكن للعلاقات السابقة أن تشكل الاحتياجات والاستجابات العاطفية الحالية.",
        },
      },
      {
        title: {
          en: "Interpersonal approaches",
          fr: "Approches interpersonnelles",
          ar: "الأساليب بين الشخصية",
        },
        text: {
          en: "Focus on communication, roles, transitions, grief, and current relationships.",
          fr: "Se concentrent sur la communication, les rôles, les transitions, le deuil et les relations actuelles.",
          ar: "تركز على التواصل والأدوار والتحولات والحزن والعلاقات الحالية.",
        },
      },
    ],

    faq: [
      {
        question: {
          en: "Do both partners need to attend therapy?",
          fr: "Les deux partenaires doivent-ils participer à la thérapie ?",
          ar: "هل يجب أن يحضر الشريكان العلاج؟",
        },
        answer: {
          en: "Not always. Individual therapy can help you understand your own needs and relationship patterns. Couples therapy requires the participation of both partners.",
          fr: "Pas toujours. Une thérapie individuelle peut vous aider à comprendre vos propres besoins et schémas relationnels. La thérapie de couple nécessite la participation des deux partenaires.",
          ar: "ليس دائمًا. يمكن للعلاج الفردي مساعدتك على فهم احتياجاتك وأنماطك داخل العلاقات، بينما يتطلب العلاج الزوجي مشاركة الشريكين.",
        },
      },
      {
        question: {
          en: "Is couples therapy only for relationships in crisis?",
          fr: "La thérapie de couple est-elle réservée aux relations en crise ?",
          ar: "هل العلاج الزوجي مخصص فقط للعلاقات التي تمر بأزمة؟",
        },
        answer: {
          en: "No. Couples may seek therapy to improve communication, navigate transitions, strengthen connection, or prevent difficulties from becoming more severe.",
          fr: "Non. Les couples peuvent consulter pour améliorer leur communication, traverser des transitions, renforcer leur lien ou éviter que certaines difficultés ne s’aggravent.",
          ar: "لا. قد يطلب الشريكان العلاج لتحسين التواصل أو التعامل مع التحولات أو تقوية العلاقة أو منع المشكلات من أن تصبح أكثر حدة.",
        },
      },
      {
        question: {
          en: "Can therapy repair every relationship?",
          fr: "La thérapie peut-elle réparer toutes les relations ?",
          ar: "هل يمكن للعلاج إصلاح كل علاقة؟",
        },
        answer: {
          en: "Therapy cannot guarantee a particular outcome. It can support clearer understanding, communication, decision-making, and more intentional choices.",
          fr: "La thérapie ne peut garantir un résultat particulier. Elle peut favoriser une meilleure compréhension, une communication plus claire, la prise de décision et des choix plus conscients.",
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
      fr: "Traumatisme",
      ar: "الصدمات النفسية",
    },

    eyebrow: {
      en: "UNDERSTANDING TRAUMA",
      fr: "COMPRENDRE LE TRAUMATISME",
      ar: "فهم الصدمات النفسية",
    },

    subtitle: {
      en: "When a past experience still feels present.",
      fr: "Lorsqu’une expérience passée semble encore présente.",
      ar: "عندما تستمر تجربة سابقة في الشعور بأنها حاضرة.",
    },

    introduction: {
      en: "Trauma can result from experiences that felt overwhelming, frightening, unsafe, or impossible to process at the time. Its effects may continue long after the event has ended.",
      fr: "Un traumatisme peut résulter d’expériences vécues comme accablantes, effrayantes, dangereuses ou impossibles à intégrer au moment où elles se sont produites. Leurs effets peuvent persister longtemps après la fin de l’événement.",
      ar: "قد تنتج الصدمة النفسية عن تجارب كانت شديدة أو مخيفة أو غير آمنة أو من الصعب استيعابها وقت حدوثها. وقد تستمر آثارها لفترة طويلة بعد انتهاء الحدث.",
    },

    definition: {
      en: "Trauma may affect emotions, memory, the nervous system, relationships, sleep, concentration, and the ability to feel safe. People can respond differently to similar experiences, and there is no single correct way to react.",
      fr: "Le traumatisme peut affecter les émotions, la mémoire, le système nerveux, les relations, le sommeil, la concentration et la capacité à se sentir en sécurité. Des personnes peuvent réagir différemment à des expériences similaires, et il n’existe pas une seule manière « correcte » de réagir.",
      ar: "قد تؤثر الصدمة في المشاعر والذاكرة والجهاز العصبي والعلاقات والنوم والتركيز والقدرة على الشعور بالأمان. وقد يستجيب الأشخاص بطرق مختلفة للتجارب المتشابهة، ولا توجد طريقة واحدة صحيحة للاستجابة.",
    },

    signsIntro: {
      en: "Possible responses to trauma may include:",
      fr: "Les réactions possibles au traumatisme peuvent inclure :",
      ar: "قد تشمل الاستجابات المحتملة للصدمة:",
    },

    signs: [
      {
        en: "Intrusive memories, nightmares, or flashbacks",
        fr: "Des souvenirs intrusifs, des cauchemars ou des flashbacks",
        ar: "ذكريات متطفلة أو كوابيس أو استرجاع حي للتجربة",
      },
      {
        en: "Feeling constantly alert or easily startled",
        fr: "Le sentiment d’être constamment en alerte ou de sursauter facilement",
        ar: "الشعور الدائم بالتأهب أو الفزع بسهولة",
      },
      {
        en: "Avoiding reminders, places, people, or conversations",
        fr: "L’évitement de certains souvenirs, lieux, personnes ou conversations",
        ar: "تجنب التذكيرات أو الأماكن أو الأشخاص أو الأحاديث",
      },
      {
        en: "Emotional numbness or feeling disconnected",
        fr: "Un engourdissement émotionnel ou un sentiment de déconnexion",
        ar: "الخدر العاطفي أو الشعور بالانفصال",
      },
      {
        en: "Difficulty trusting others or feeling safe in relationships",
        fr: "Des difficultés à faire confiance aux autres ou à se sentir en sécurité dans les relations",
        ar: "صعوبة الثقة بالآخرين أو الشعور بالأمان في العلاقات",
      },
      {
        en: "Sleep difficulties, irritability, shame, or guilt",
        fr: "Des troubles du sommeil, de l’irritabilité, de la honte ou de la culpabilité",
        ar: "صعوبات النوم أو الانفعال أو الخجل أو الشعور بالذنب",
      },
    ],

    seekHelpIntro: {
      en: "Professional support may be useful when the impact of a difficult experience continues to affect your sense of safety, relationships, emotions, or daily functioning.",
      fr: "Un soutien professionnel peut être utile lorsque les effets d’une expérience difficile continuent d’affecter votre sentiment de sécurité, vos relations, vos émotions ou votre fonctionnement quotidien.",
      ar: "قد يكون الدعم المهني مفيدًا عندما تستمر آثار تجربة صعبة في التأثير في شعورك بالأمان أو علاقاتك أو مشاعرك أو حياتك اليومية.",
    },

    seekHelpPoints: [
      {
        en: "Memories or reminders feel overwhelming",
        fr: "Les souvenirs ou les éléments déclencheurs semblent envahissants",
        ar: "تبدو الذكريات أو التذكيرات شديدة وصعبة",
      },
      {
        en: "You feel unsafe even when danger has passed",
        fr: "Vous ne vous sentez pas en sécurité même lorsque le danger est passé",
        ar: "تشعر بعدم الأمان رغم انتهاء الخطر",
      },
      {
        en: "Avoidance is limiting your daily life",
        fr: "L’évitement limite votre vie quotidienne",
        ar: "يؤثر التجنب في قدرتك على عيش حياتك اليومية",
      },
      {
        en: "Relationships or sleep have been significantly affected",
        fr: "Vos relations ou votre sommeil ont été fortement affectés",
        ar: "تأثرت علاقاتك أو قدرتك على النوم بصورة واضحة",
      },
    ],

    therapyIntro: {
      en: "Trauma-informed therapy aims to create safety, choice, collaboration, and emotional stability. You do not have to discuss every detail before you feel ready.",
      fr: "Une thérapie tenant compte du traumatisme vise à créer de la sécurité, du choix, de la collaboration et une stabilité émotionnelle. Vous n’avez pas à raconter chaque détail avant de vous sentir prêt.",
      ar: "يهدف العلاج المراعي للصدمة إلى توفير الأمان والاختيار والتعاون والاستقرار النفسي. ولا يتعين عليك مناقشة كل التفاصيل قبل أن تكون مستعدًا.",
    },

    therapyBenefits: [
      {
        number: "01",
        title: {
          en: "Create safety",
          fr: "Créer un sentiment de sécurité",
          ar: "بناء الشعور بالأمان",
        },
        text: {
          en: "Develop grounding skills and a greater sense of stability in the present.",
          fr: "Développer des techniques d’ancrage et un plus grand sentiment de stabilité dans le présent.",
          ar: "تطوير مهارات تساعد على الثبات والشعور بمزيد من الاستقرار في الحاضر.",
        },
      },
      {
        number: "02",
        title: {
          en: "Understand responses",
          fr: "Comprendre les réactions",
          ar: "فهم الاستجابات",
        },
        text: {
          en: "Recognise how the mind and body adapted to overwhelming experiences.",
          fr: "Reconnaître comment l’esprit et le corps se sont adaptés à des expériences accablantes.",
          ar: "فهم كيفية تكيف الذهن والجسد مع التجارب الشديدة.",
        },
      },
      {
        number: "03",
        title: {
          en: "Process gradually",
          fr: "Avancer progressivement",
          ar: "المعالجة بصورة تدريجية",
        },
        text: {
          en: "Explore difficult experiences at a pace that respects your needs.",
          fr: "Explorer les expériences difficiles à un rythme qui respecte vos besoins.",
          ar: "استكشاف التجارب الصعبة بوتيرة تحترم احتياجاتك.",
        },
      },
      {
        number: "04",
        title: {
          en: "Reconnect",
          fr: "Se reconnecter",
          ar: "استعادة التواصل",
        },
        text: {
          en: "Rebuild trust, emotional connection, and participation in everyday life.",
          fr: "Reconstruire la confiance, le lien émotionnel et la participation à la vie quotidienne.",
          ar: "إعادة بناء الثقة والتواصل النفسي والمشاركة في الحياة اليومية.",
        },
      },
    ],

    approachesIntro: {
      en: "Trauma therapy should be adapted carefully to the individual, with attention to safety, readiness, and emotional regulation.",
      fr: "Le traitement du traumatisme doit être soigneusement adapté à chaque personne, en tenant compte de la sécurité, du niveau de préparation et de la régulation émotionnelle.",
      ar: "يجب تكييف علاج الصدمات بعناية مع كل شخص، مع الاهتمام بالأمان والاستعداد وتنظيم المشاعر.",
    },

    approaches: [
      {
        title: {
          en: "Trauma-focused CBT",
          fr: "TCC centrée sur le traumatisme",
          ar: "العلاج المعرفي السلوكي الموجه للصدمة",
        },
        text: {
          en: "Addresses thoughts, emotions, avoidance, and behaviours connected to traumatic experiences.",
          fr: "Travaille sur les pensées, les émotions, l’évitement et les comportements liés aux expériences traumatiques.",
          ar: "يتعامل مع الأفكار والمشاعر والتجنب والسلوكيات المرتبطة بالتجارب الصادمة.",
        },
      },
      {
        title: {
          en: "EMDR-informed therapy",
          fr: "Thérapie inspirée de l’EMDR",
          ar: "العلاج المستنير بتقنية إزالة حساسية حركة العين",
        },
        text: {
          en: "May support the processing of distressing memories through a structured therapeutic approach.",
          fr: "Peut soutenir le traitement de souvenirs pénibles dans le cadre d’une approche thérapeutique structurée.",
          ar: "قد يساعد على معالجة الذكريات المؤلمة من خلال أسلوب علاجي منظم.",
        },
      },
      {
        title: {
          en: "Stabilisation and grounding",
          fr: "Stabilisation et ancrage",
          ar: "التثبيت والعودة إلى الحاضر",
        },
        text: {
          en: "Supports nervous-system regulation and a stronger sense of present safety.",
          fr: "Favorisent la régulation du système nerveux et un sentiment plus solide de sécurité dans le présent.",
          ar: "يدعم تنظيم الجهاز العصبي وتعزيز الشعور بالأمان في الحاضر.",
        },
      },
    ],

    faq: [
      {
        question: {
          en: "Do I need to describe the trauma in detail?",
          fr: "Dois-je décrire le traumatisme en détail ?",
          ar: "هل يجب أن أصف الصدمة بالتفصيل؟",
        },
        answer: {
          en: "No. Therapy should proceed at a pace that feels manageable. Safety and emotional readiness are important parts of trauma-informed work.",
          fr: "Non. La thérapie doit avancer à un rythme supportable pour vous. La sécurité et la préparation émotionnelle sont des éléments essentiels d’une approche tenant compte du traumatisme.",
          ar: "لا. يجب أن يسير العلاج بوتيرة يمكنك تحملها. ويُعد الأمان والاستعداد النفسي جزءًا مهمًا من العلاج المراعي للصدمة.",
        },
      },
      {
        question: {
          en: "Can an experience be traumatic even if others do not see it that way?",
          fr: "Une expérience peut-elle être traumatisante même si les autres ne la perçoivent pas ainsi ?",
          ar: "هل يمكن أن تكون التجربة صادمة حتى لو لم يرها الآخرون كذلك؟",
        },
        answer: {
          en: "Yes. Trauma is influenced by how an experience affected your sense of safety, control, connection, and ability to cope.",
          fr: "Oui. Le traumatisme dépend notamment de la manière dont une expérience a affecté votre sentiment de sécurité, de contrôle, de lien et votre capacité à faire face.",
          ar: "نعم. تتأثر الصدمة بالطريقة التي أثرت بها التجربة في شعورك بالأمان والسيطرة والتواصل والقدرة على التأقلم.",
        },
      },
      {
        question: {
          en: "Can trauma symptoms appear much later?",
          fr: "Les symptômes d’un traumatisme peuvent-ils apparaître longtemps après ?",
          ar: "هل يمكن أن تظهر أعراض الصدمة بعد وقت طويل؟",
        },
        answer: {
          en: "Yes. Some responses appear immediately, while others may become noticeable later, particularly during stress or major life changes.",
          fr: "Oui. Certaines réactions apparaissent immédiatement, tandis que d’autres peuvent devenir visibles plus tard, notamment pendant des périodes de stress ou de grands changements de vie.",
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
      fr: "Stress et épuisement",
      ar: "الضغط والإرهاق النفسي",
    },

    eyebrow: {
      en: "UNDERSTANDING STRESS & BURNOUT",
      fr: "COMPRENDRE LE STRESS ET L’ÉPUISEMENT",
      ar: "فهم الضغط والإرهاق النفسي",
    },

    subtitle: {
      en: "When your mind and body have been carrying too much.",
      fr: "Lorsque votre esprit et votre corps portent trop de choses depuis trop longtemps.",
      ar: "عندما يتحمل ذهنك وجسدك أكثر مما ينبغي.",
    },

    introduction: {
      en: "Stress is a natural response to demands and pressure. When those demands remain high without enough recovery, stress may become chronic and contribute to emotional, mental, and physical exhaustion.",
      fr: "Le stress est une réponse naturelle aux exigences et à la pression. Lorsque ces exigences restent élevées sans récupération suffisante, le stress peut devenir chronique et contribuer à un épuisement émotionnel, mental et physique.",
      ar: "الضغط استجابة طبيعية للمتطلبات والتحديات. وعندما تستمر هذه المتطلبات دون وقت كافٍ للتعافي، قد يصبح الضغط مزمنًا ويسهم في الإرهاق النفسي والعقلي والجسدي.",
    },

    definition: {
      en: "Burnout often develops gradually. It may involve exhaustion, reduced motivation, emotional distance, irritability, difficulty concentrating, and a sense that your efforts no longer feel meaningful or sustainable.",
      fr: "L’épuisement se développe souvent progressivement. Il peut se manifester par de la fatigue, une baisse de motivation, une distance émotionnelle, de l’irritabilité, des difficultés de concentration et le sentiment que vos efforts n’ont plus de sens ou ne sont plus tenables.",
      ar: "غالبًا ما يتطور الإرهاق النفسي تدريجيًا. وقد يشمل التعب وانخفاض الدافع والبعد العاطفي والانفعال وصعوبة التركيز والشعور بأن جهودك لم تعد ذات معنى أو قابلة للاستمرار.",
    },

    signsIntro: {
      en: "Common experiences associated with chronic stress or burnout may include:",
      fr: "Les expériences couramment associées au stress chronique ou à l’épuisement peuvent inclure :",
      ar: "قد تشمل التجارب المرتبطة بالضغط المزمن أو الإرهاق النفسي:",
    },

    signs: [
      {
        en: "Persistent physical or emotional exhaustion",
        fr: "Un épuisement physique ou émotionnel persistant",
        ar: "إرهاق جسدي أو نفسي مستمر",
      },
      {
        en: "Difficulty concentrating or making decisions",
        fr: "Des difficultés à se concentrer ou à prendre des décisions",
        ar: "صعوبة التركيز أو اتخاذ القرارات",
      },
      {
        en: "Irritability, frustration, or emotional numbness",
        fr: "De l’irritabilité, de la frustration ou un engourdissement émotionnel",
        ar: "الانفعال أو الإحباط أو الخدر العاطفي",
      },
      {
        en: "Loss of motivation or sense of purpose",
        fr: "Une perte de motivation ou de sens",
        ar: "فقدان الدافع أو الإحساس بالهدف",
      },
      {
        en: "Sleep problems or difficulty recovering after rest",
        fr: "Des problèmes de sommeil ou des difficultés à récupérer malgré le repos",
        ar: "مشكلات النوم أو صعوبة التعافي بعد الراحة",
      },
      {
        en: "Withdrawal from work, responsibilities, or relationships",
        fr: "Un retrait du travail, des responsabilités ou des relations",
        ar: "الانسحاب من العمل أو المسؤوليات أو العلاقات",
      },
    ],

    seekHelpIntro: {
      en: "Therapy may be helpful when pressure feels constant, rest is no longer restorative, or your responsibilities are affecting your health and emotional wellbeing.",
      fr: "La thérapie peut être utile lorsque la pression semble constante, que le repos ne permet plus de récupérer ou que vos responsabilités commencent à affecter votre santé et votre bien-être émotionnel.",
      ar: "قد يكون العلاج مفيدًا عندما يبدو الضغط مستمرًا أو لا تعود الراحة مفيدة أو تبدأ المسؤوليات في التأثير في صحتك وتوازنك النفسي.",
    },

    seekHelpPoints: [
      {
        en: "You feel exhausted most of the time",
        fr: "Vous vous sentez épuisé la plupart du temps",
        ar: "تشعر بالإرهاق معظم الوقت",
      },
      {
        en: "Your motivation has significantly declined",
        fr: "Votre motivation a fortement diminué",
        ar: "انخفض دافعك بصورة واضحة",
      },
      {
        en: "Stress is affecting your sleep or physical health",
        fr: "Le stress affecte votre sommeil ou votre santé physique",
        ar: "يؤثر الضغط في نومك أو صحتك الجسدية",
      },
      {
        en: "You feel unable to disconnect from responsibilities",
        fr: "Vous avez le sentiment de ne pas pouvoir vous déconnecter de vos responsabilités",
        ar: "تشعر بأنك غير قادر على الابتعاد عن المسؤوليات",
      },
    ],

    therapyIntro: {
      en: "Psychotherapy can help you understand the sources of pressure, examine expectations and boundaries, and create a more sustainable relationship with work, responsibility, rest, and self-care.",
      fr: "La psychothérapie peut vous aider à comprendre les sources de pression, à examiner vos attentes et vos limites, et à construire une relation plus durable avec le travail, les responsabilités, le repos et les soins personnels.",
      ar: "يمكن للعلاج النفسي أن يساعدك على فهم مصادر الضغط ومراجعة التوقعات والحدود وبناء علاقة أكثر استدامة مع العمل والمسؤوليات والراحة والعناية بالنفس.",
    },

    therapyBenefits: [
      {
        number: "01",
        title: {
          en: "Identify stressors",
          fr: "Identifier les sources de stress",
          ar: "تحديد مصادر الضغط",
        },
        text: {
          en: "Clarify which demands, roles, and patterns are creating ongoing strain.",
          fr: "Clarifier quelles exigences, quels rôles et quels schémas créent une tension durable.",
          ar: "تحديد المتطلبات والأدوار والأنماط التي تسبب ضغطًا مستمرًا.",
        },
      },
      {
        number: "02",
        title: {
          en: "Review expectations",
          fr: "Revoir les attentes",
          ar: "مراجعة التوقعات",
        },
        text: {
          en: "Explore perfectionism, over-responsibility, and internal pressure.",
          fr: "Explorer le perfectionnisme, le sentiment de devoir tout assumer et la pression intérieure.",
          ar: "استكشاف السعي إلى الكمال وتحمل المسؤولية الزائدة والضغط الداخلي.",
        },
      },
      {
        number: "03",
        title: {
          en: "Strengthen boundaries",
          fr: "Renforcer les limites",
          ar: "تقوية الحدود",
        },
        text: {
          en: "Develop clearer limits around time, energy, and availability.",
          fr: "Développer des limites plus claires autour du temps, de l’énergie et de la disponibilité.",
          ar: "بناء حدود أوضح حول الوقت والطاقة والتوفر للآخرين.",
        },
      },
      {
        number: "04",
        title: {
          en: "Restore balance",
          fr: "Retrouver l’équilibre",
          ar: "استعادة التوازن",
        },
        text: {
          en: "Create realistic routines that include recovery, connection, and rest.",
          fr: "Créer des routines réalistes qui incluent récupération, lien aux autres et repos.",
          ar: "بناء روتين واقعي يتضمن التعافي والتواصل والراحة.",
        },
      },
    ],

    approachesIntro: {
      en: "Treatment may combine practical stress-management strategies with deeper exploration of emotional patterns, values, and expectations.",
      fr: "Le traitement peut associer des stratégies pratiques de gestion du stress à une exploration plus approfondie des schémas émotionnels, des valeurs et des attentes.",
      ar: "قد يجمع العلاج بين استراتيجيات عملية لإدارة الضغط واستكشاف أعمق للأنماط النفسية والقيم والتوقعات.",
    },

    approaches: [
      {
        title: {
          en: "Cognitive Behavioural Therapy",
          fr: "Thérapie cognitivo-comportementale",
          ar: "العلاج المعرفي السلوكي",
        },
        text: {
          en: "Examines thinking patterns, behaviours, and habits that may maintain chronic stress.",
          fr: "Examine les schémas de pensée, les comportements et les habitudes qui peuvent entretenir le stress chronique.",
          ar: "يفحص أنماط التفكير والسلوك والعادات التي قد تسهم في استمرار الضغط المزمن.",
        },
      },
      {
        title: {
          en: "Acceptance and Commitment Therapy",
          fr: "Thérapie d’acceptation et d’engagement",
          ar: "علاج القبول والالتزام",
        },
        text: {
          en: "Supports values-based choices and a more flexible response to difficult thoughts and feelings.",
          fr: "Favorise des choix guidés par les valeurs et une réponse plus souple aux pensées et émotions difficiles.",
          ar: "يدعم اتخاذ قرارات قائمة على القيم واستجابة أكثر مرونة للأفكار والمشاعر الصعبة.",
        },
      },
      {
        title: {
          en: "Mindfulness-based approaches",
          fr: "Approches fondées sur la pleine conscience",
          ar: "الأساليب القائمة على اليقظة الذهنية",
        },
        text: {
          en: "Help develop awareness, emotional regulation, and recovery from ongoing pressure.",
          fr: "Aident à développer la conscience de soi, la régulation émotionnelle et la récupération face à une pression prolongée.",
          ar: "تساعد على تطوير الوعي وتنظيم المشاعر والتعافي من الضغط المستمر.",
        },
      },
    ],

    faq: [
      {
        question: {
          en: "Is burnout the same as being tired?",
          fr: "L’épuisement est-il la même chose que la fatigue ?",
          ar: "هل الإرهاق النفسي هو نفسه الشعور بالتعب؟",
        },
        answer: {
          en: "Not necessarily. Ordinary tiredness often improves with rest. Burnout may involve ongoing exhaustion, emotional distance, reduced effectiveness, and difficulty recovering.",
          fr: "Pas nécessairement. La fatigue ordinaire s’améliore souvent avec le repos. L’épuisement peut impliquer une fatigue persistante, une distance émotionnelle, une baisse d’efficacité et des difficultés à récupérer.",
          ar: "ليس بالضرورة. غالبًا ما يتحسن التعب العادي بالراحة، بينما قد يشمل الإرهاق النفسي تعبًا مستمرًا وبعدًا عاطفيًا وانخفاض الفاعلية وصعوبة التعافي.",
        },
      },
      {
        question: {
          en: "Can burnout happen outside work?",
          fr: "L’épuisement peut-il survenir en dehors du travail ?",
          ar: "هل يمكن أن يحدث الإرهاق النفسي خارج بيئة العمل؟",
        },
        answer: {
          en: "Yes. Prolonged caregiving, parenting demands, study, family responsibilities, or ongoing emotional pressure may also contribute to burnout-like experiences.",
          fr: "Oui. La prise en charge prolongée d’un proche, les exigences parentales, les études, les responsabilités familiales ou une pression émotionnelle continue peuvent également contribuer à des expériences proches de l’épuisement.",
          ar: "نعم. قد تسهم الرعاية المستمرة أو متطلبات الأبوة والأمومة أو الدراسة أو المسؤوليات العائلية أو الضغط النفسي الطويل في تجارب شبيهة بالإرهاق.",
        },
      },
      {
        question: {
          en: "Will taking time off solve burnout?",
          fr: "Prendre des congés suffit-il à résoudre l’épuisement ?",
          ar: "هل تكفي الإجازة لعلاج الإرهاق النفسي؟",
        },
        answer: {
          en: "Rest can be important, but lasting improvement may also require changes in boundaries, expectations, workload, coping patterns, and sources of support.",
          fr: "Le repos peut être important, mais une amélioration durable peut aussi nécessiter des changements dans les limites, les attentes, la charge de travail, les stratégies d’adaptation et les sources de soutien.",
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
      fr: "Estime de soi",
      ar: "تقدير الذات",
    },

    eyebrow: {
      en: "UNDERSTANDING SELF-ESTEEM",
      fr: "COMPRENDRE L’ESTIME DE SOI",
      ar: "فهم تقدير الذات",
    },

    subtitle: {
      en: "When the way you see yourself becomes painful.",
      fr: "Lorsque la manière dont vous vous voyez devient douloureuse.",
      ar: "عندما تصبح نظرتك إلى نفسك مصدرًا للألم.",
    },

    introduction: {
      en: "Self-esteem refers to the way you evaluate and relate to yourself. When it is low or unstable, everyday experiences may become shaped by self-doubt, criticism, shame, comparison, or fear of not being enough.",
      fr: "L’estime de soi désigne la manière dont vous vous évaluez et dont vous êtes en relation avec vous-même. Lorsqu’elle est faible ou instable, les expériences quotidiennes peuvent être marquées par le doute, l’autocritique, la honte, la comparaison ou la peur de ne pas être à la hauteur.",
      ar: "يشير تقدير الذات إلى الطريقة التي تنظر بها إلى نفسك وتتفاعل معها. وعندما يكون منخفضًا أو غير مستقر، قد تتأثر التجارب اليومية بالشك في الذات والنقد والخجل والمقارنة والخوف من عدم الكفاية.",
    },

    definition: {
      en: "Low self-esteem is not simply a lack of confidence. It may involve deeply held beliefs about worth, belonging, competence, appearance, relationships, or the right to have needs and boundaries.",
      fr: "Une faible estime de soi ne se résume pas à un manque de confiance. Elle peut impliquer des croyances profondément ancrées concernant sa valeur, son appartenance, ses compétences, son apparence, ses relations ou son droit d’avoir des besoins et des limites.",
      ar: "انخفاض تقدير الذات ليس مجرد نقص في الثقة. فقد يشمل معتقدات عميقة حول القيمة والانتماء والكفاءة والمظهر والعلاقات والحق في امتلاك احتياجات وحدود.",
    },

    signsIntro: {
      en: "Low self-esteem may appear through experiences such as:",
      fr: "Une faible estime de soi peut se manifester par des expériences telles que :",
      ar: "قد يظهر انخفاض تقدير الذات من خلال تجارب مثل:",
    },

    signs: [
      {
        en: "Harsh and persistent self-criticism",
        fr: "Une autocritique sévère et persistante",
        ar: "نقد قاسٍ ومستمر للذات",
      },
      {
        en: "Difficulty accepting compliments or recognising strengths",
        fr: "Des difficultés à accepter les compliments ou à reconnaître ses qualités",
        ar: "صعوبة تقبل المديح أو التعرف إلى نقاط القوة",
      },
      {
        en: "Perfectionism or fear of making mistakes",
        fr: "Du perfectionnisme ou la peur de faire des erreurs",
        ar: "السعي إلى الكمال أو الخوف من ارتكاب الأخطاء",
      },
      {
        en: "Frequent comparison with others",
        fr: "Des comparaisons fréquentes avec les autres",
        ar: "المقارنة المتكررة مع الآخرين",
      },
      {
        en: "Difficulty expressing needs or setting boundaries",
        fr: "Des difficultés à exprimer ses besoins ou à poser des limites",
        ar: "صعوبة التعبير عن الاحتياجات أو وضع الحدود",
      },
      {
        en: "Fear of rejection, failure, or disappointing others",
        fr: "La peur du rejet, de l’échec ou de décevoir les autres",
        ar: "الخوف من الرفض أو الفشل أو خذلان الآخرين",
      },
    ],

    seekHelpIntro: {
      en: "Therapy may be helpful when self-criticism affects your relationships, decisions, confidence, emotional wellbeing, or ability to pursue meaningful goals.",
      fr: "La thérapie peut être utile lorsque l’autocritique affecte vos relations, vos décisions, votre confiance, votre bien-être émotionnel ou votre capacité à poursuivre des objectifs qui comptent pour vous.",
      ar: "قد يكون العلاج مفيدًا عندما يؤثر نقد الذات في علاقاتك أو قراراتك أو ثقتك أو صحتك النفسية أو قدرتك على السعي نحو أهداف مهمة.",
    },

    seekHelpPoints: [
      {
        en: "You regularly feel inadequate or undeserving",
        fr: "Vous vous sentez régulièrement insuffisant ou indigne",
        ar: "تشعر باستمرار بأنك غير كافٍ أو غير مستحق",
      },
      {
        en: "Fear of failure prevents you from trying",
        fr: "La peur de l’échec vous empêche d’essayer",
        ar: "يمنعك الخوف من الفشل من المحاولة",
      },
      {
        en: "You depend heavily on external approval",
        fr: "Vous dépendez fortement de l’approbation extérieure",
        ar: "تعتمد بصورة كبيرة على قبول الآخرين",
      },
      {
        en: "You struggle to protect your needs and boundaries",
        fr: "Vous avez du mal à protéger vos besoins et vos limites",
        ar: "تجد صعوبة في حماية احتياجاتك وحدودك",
      },
    ],

    therapyIntro: {
      en: "Psychotherapy can help you understand how your view of yourself developed and support a more compassionate, balanced, and realistic internal relationship.",
      fr: "La psychothérapie peut vous aider à comprendre comment votre regard sur vous-même s’est construit et à développer une relation intérieure plus bienveillante, équilibrée et réaliste.",
      ar: "يمكن للعلاج النفسي أن يساعدك على فهم كيفية تشكل نظرتك إلى نفسك ودعم بناء علاقة داخلية أكثر تعاطفًا وتوازنًا وواقعية.",
    },

    therapyBenefits: [
      {
        number: "01",
        title: {
          en: "Understand origins",
          fr: "Comprendre les origines",
          ar: "فهم الجذور",
        },
        text: {
          en: "Explore experiences and relationships that shaped your beliefs about yourself.",
          fr: "Explorer les expériences et les relations qui ont façonné vos croyances sur vous-même.",
          ar: "استكشاف التجارب والعلاقات التي شكلت معتقداتك عن نفسك.",
        },
      },
      {
        number: "02",
        title: {
          en: "Challenge self-criticism",
          fr: "Remettre en question l’autocritique",
          ar: "مواجهة نقد الذات",
        },
        text: {
          en: "Recognise harsh internal messages and develop more balanced alternatives.",
          fr: "Identifier les messages intérieurs sévères et développer des alternatives plus équilibrées.",
          ar: "التعرف إلى الرسائل الداخلية القاسية وتطوير بدائل أكثر توازنًا.",
        },
      },
      {
        number: "03",
        title: {
          en: "Build boundaries",
          fr: "Construire des limites",
          ar: "بناء الحدود",
        },
        text: {
          en: "Strengthen your ability to express needs and protect emotional wellbeing.",
          fr: "Renforcer votre capacité à exprimer vos besoins et à protéger votre bien-être émotionnel.",
          ar: "تعزيز القدرة على التعبير عن الاحتياجات وحماية الصحة النفسية.",
        },
      },
      {
        number: "04",
        title: {
          en: "Develop self-compassion",
          fr: "Développer l’autocompassion",
          ar: "تطوير التعاطف مع الذات",
        },
        text: {
          en: "Learn to respond to mistakes and difficulties with greater kindness.",
          fr: "Apprendre à répondre aux erreurs et aux difficultés avec davantage de bienveillance.",
          ar: "تعلم التعامل مع الأخطاء والصعوبات بمزيد من اللطف.",
        },
      },
    ],

    approachesIntro: {
      en: "Different therapeutic approaches may support self-esteem depending on the origins and patterns involved.",
      fr: "Différentes approches thérapeutiques peuvent soutenir l’estime de soi selon les origines et les schémas concernés.",
      ar: "قد تساعد أساليب علاجية مختلفة في تحسين تقدير الذات وفقًا للجذور والأنماط المرتبطة به.",
    },

    approaches: [
      {
        title: {
          en: "Cognitive Behavioural Therapy",
          fr: "Thérapie cognitivo-comportementale",
          ar: "العلاج المعرفي السلوكي",
        },
        text: {
          en: "Identifies and challenges negative beliefs and self-critical thinking patterns.",
          fr: "Identifie et remet en question les croyances négatives et les schémas de pensée autocritiques.",
          ar: "يتعرف إلى المعتقدات السلبية وأنماط التفكير الناقد للذات ويعمل على مراجعتها.",
        },
      },
      {
        title: {
          en: "Compassion-focused therapy",
          fr: "Thérapie centrée sur la compassion",
          ar: "العلاج المرتكز على التعاطف",
        },
        text: {
          en: "Supports a kinder response to shame, criticism, and emotional pain.",
          fr: "Favorise une réponse plus bienveillante à la honte, à l’autocritique et à la souffrance émotionnelle.",
          ar: "يدعم استجابة أكثر لطفًا للخجل والنقد والألم النفسي.",
        },
      },
      {
        title: {
          en: "Psychodynamic therapy",
          fr: "Thérapie psychodynamique",
          ar: "العلاج الديناميكي النفسي",
        },
        text: {
          en: "Explores earlier experiences and relationships that shaped self-worth.",
          fr: "Explore les expériences et les relations antérieures qui ont façonné le sentiment de valeur personnelle.",
          ar: "يستكشف التجارب والعلاقات السابقة التي شكلت الإحساس بالقيمة الذاتية.",
        },
      },
    ],

    faq: [
      {
        question: {
          en: "Can self-esteem change?",
          fr: "L’estime de soi peut-elle changer ?",
          ar: "هل يمكن أن يتغير تقدير الذات؟",
        },
        answer: {
          en: "Yes. Self-esteem can develop over time through insight, new experiences, healthier boundaries, supportive relationships, and changes in how you respond to yourself.",
          fr: "Oui. L’estime de soi peut évoluer avec le temps grâce à une meilleure compréhension de soi, de nouvelles expériences, des limites plus saines, des relations soutenantes et des changements dans la manière dont vous réagissez envers vous-même.",
          ar: "نعم. يمكن أن يتطور تقدير الذات مع الوقت من خلال الفهم والتجارب الجديدة والحدود الصحية والعلاقات الداعمة وتغيير طريقة التعامل مع الذات.",
        },
      },
      {
        question: {
          en: "Is low self-esteem caused by childhood?",
          fr: "Une faible estime de soi vient-elle toujours de l’enfance ?",
          ar: "هل ينتج انخفاض تقدير الذات دائمًا عن الطفولة؟",
        },
        answer: {
          en: "Not always. Early experiences may contribute, but later relationships, criticism, discrimination, failure, trauma, or major life changes can also affect self-esteem.",
          fr: "Pas toujours. Les expériences précoces peuvent y contribuer, mais des relations ultérieures, la critique, la discrimination, l’échec, un traumatisme ou de grands changements de vie peuvent également affecter l’estime de soi.",
          ar: "ليس دائمًا. قد تسهم التجارب المبكرة، لكن العلاقات اللاحقة أو النقد أو التمييز أو الفشل أو الصدمات أو التغيرات الكبيرة قد تؤثر أيضًا في تقدير الذات.",
        },
      },
      {
        question: {
          en: "Does confidence mean never feeling insecure?",
          fr: "Avoir confiance en soi signifie-t-il ne jamais se sentir en insécurité ?",
          ar: "هل تعني الثقة عدم الشعور بعدم الأمان أبدًا؟",
        },
        answer: {
          en: "No. Healthy self-esteem does not remove uncertainty. It can help you respond to doubt and difficulty without defining your entire worth by them.",
          fr: "Non. Une estime de soi saine n’élimine pas l’incertitude. Elle peut vous aider à répondre au doute et aux difficultés sans laisser ceux-ci définir toute votre valeur.",
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
      fr: "Trouble obsessionnel-compulsif (TOC)",
      ar: "الوسواس القهري",
    },

    eyebrow: {
      en: "UNDERSTANDING OCD",
      fr: "COMPRENDRE LE TOC",
      ar: "فهم الوسواس القهري",
    },

    subtitle: {
      en: "When intrusive thoughts and repeated behaviours become difficult to interrupt.",
      fr: "Lorsque les pensées intrusives et les comportements répétitifs deviennent difficiles à interrompre.",
      ar: "عندما يصبح من الصعب إيقاف الأفكار المتطفلة والسلوكيات المتكررة.",
    },

    introduction: {
      en: "Obsessive-compulsive disorder can involve unwanted intrusive thoughts, images, urges, or doubts, together with behaviours or mental rituals performed to reduce anxiety or prevent a feared outcome.",
      fr: "Le trouble obsessionnel-compulsif peut impliquer des pensées, images, impulsions ou doutes intrusifs et non désirés, accompagnés de comportements ou de rituels mentaux réalisés pour réduire l’anxiété ou empêcher une conséquence redoutée.",
      ar: "قد يشمل اضطراب الوسواس القهري أفكارًا أو صورًا أو دوافع أو شكوكًا متطفلة وغير مرغوبة، إلى جانب سلوكيات أو طقوس ذهنية تُستخدم لتقليل القلق أو منع نتيجة مخيفة.",
    },

    definition: {
      en: "Obsessions are recurring thoughts or fears that cause distress. Compulsions are repeated actions, checking, reassurance seeking, avoidance, counting, reviewing, or mental rituals that bring temporary relief but often strengthen the cycle over time.",
      fr: "Les obsessions sont des pensées ou des peurs récurrentes qui provoquent de la détresse. Les compulsions sont des actions répétées, des vérifications, des recherches de réassurance, de l’évitement, du comptage, des révisions mentales ou d’autres rituels qui apportent un soulagement temporaire mais renforcent souvent le cycle au fil du temps.",
      ar: "الوساوس هي أفكار أو مخاوف متكررة تسبب ضغطًا نفسيًا. أما الأفعال القهرية فهي تصرفات متكررة أو فحص أو طلب للطمأنة أو تجنب أو عد أو مراجعة أو طقوس ذهنية تمنح راحة مؤقتة لكنها غالبًا تعزز الدائرة مع الوقت.",
    },

    signsIntro: {
      en: "OCD experiences may include:",
      fr: "Les manifestations du TOC peuvent inclure :",
      ar: "قد تشمل تجارب الوسواس القهري:",
    },

    signs: [
      {
        en: "Unwanted thoughts, images, urges, or doubts",
        fr: "Des pensées, images, impulsions ou doutes non désirés",
        ar: "أفكار أو صور أو دوافع أو شكوك غير مرغوبة",
      },
      {
        en: "Repeated checking, washing, arranging, or reviewing",
        fr: "Des vérifications, lavages, rangements ou révisions répétés",
        ar: "الفحص أو الغسل أو الترتيب أو المراجعة بصورة متكررة",
      },
      {
        en: "Seeking reassurance from other people",
        fr: "La recherche fréquente de réassurance auprès d’autres personnes",
        ar: "طلب الطمأنة بصورة متكررة من الآخرين",
      },
      {
        en: "Mental rituals such as counting or repeating phrases",
        fr: "Des rituels mentaux comme compter ou répéter certaines phrases",
        ar: "طقوس ذهنية مثل العد أو تكرار عبارات معينة",
      },
      {
        en: "Avoiding situations that trigger intrusive thoughts",
        fr: "L’évitement des situations qui déclenchent des pensées intrusives",
        ar: "تجنب المواقف التي تحفز الأفكار المتطفلة",
      },
      {
        en: "Spending significant time trying to feel completely certain",
        fr: "Passer beaucoup de temps à essayer d’obtenir une certitude totale",
        ar: "قضاء وقت طويل في محاولة الوصول إلى يقين كامل",
      },
    ],

    seekHelpIntro: {
      en: "Professional support may be useful when obsessions or compulsions take up significant time, create distress, or interfere with relationships, study, work, sleep, or daily activities.",
      fr: "Un soutien professionnel peut être utile lorsque les obsessions ou compulsions prennent beaucoup de temps, provoquent de la détresse ou interfèrent avec les relations, les études, le travail, le sommeil ou les activités quotidiennes.",
      ar: "قد يكون الدعم المهني مفيدًا عندما تستغرق الوساوس أو الأفعال القهرية وقتًا طويلًا أو تسبب ضغطًا أو تؤثر في العلاقات أو الدراسة أو العمل أو النوم أو الأنشطة اليومية.",
    },

    seekHelpPoints: [
      {
        en: "Rituals or checking are becoming more frequent",
        fr: "Les rituels ou les vérifications deviennent de plus en plus fréquents",
        ar: "أصبحت الطقوس أو عمليات الفحص أكثر تكرارًا",
      },
      {
        en: "You feel trapped in cycles of doubt and reassurance",
        fr: "Vous vous sentez piégé dans des cycles de doute et de réassurance",
        ar: "تشعر بأنك عالق في دوائر الشك والطمأنة",
      },
      {
        en: "Avoidance is limiting important parts of your life",
        fr: "L’évitement limite des aspects importants de votre vie",
        ar: "يحد التجنب من جوانب مهمة في حياتك",
      },
      {
        en: "You recognise the pattern but feel unable to stop",
        fr: "Vous reconnaissez le schéma mais vous avez le sentiment de ne pas pouvoir l’arrêter",
        ar: "تدرك النمط لكنك تشعر بعدم القدرة على إيقافه",
      },
    ],

    therapyIntro: {
      en: "Therapy can help you understand the OCD cycle, reduce reliance on compulsions, tolerate uncertainty, and respond differently to intrusive thoughts.",
      fr: "La thérapie peut vous aider à comprendre le cycle du TOC, à réduire le recours aux compulsions, à tolérer l’incertitude et à répondre différemment aux pensées intrusives.",
      ar: "يمكن للعلاج أن يساعدك على فهم دائرة الوسواس القهري وتقليل الاعتماد على الأفعال القهرية وتحمل عدم اليقين والاستجابة للأفكار المتطفلة بطريقة مختلفة.",
    },

    therapyBenefits: [
      {
        number: "01",
        title: {
          en: "Understand the cycle",
          fr: "Comprendre le cycle",
          ar: "فهم الدائرة",
        },
        text: {
          en: "Recognise the relationship between obsessions, anxiety, compulsions, and temporary relief.",
          fr: "Reconnaître le lien entre les obsessions, l’anxiété, les compulsions et le soulagement temporaire.",
          ar: "التعرف إلى العلاقة بين الوساوس والقلق والأفعال القهرية والراحة المؤقتة.",
        },
      },
      {
        number: "02",
        title: {
          en: "Reduce compulsions",
          fr: "Réduire les compulsions",
          ar: "تقليل الأفعال القهرية",
        },
        text: {
          en: "Gradually practise responding without completing rituals or reassurance seeking.",
          fr: "S’entraîner progressivement à répondre sans réaliser les rituels ni rechercher de réassurance.",
          ar: "التدرب تدريجيًا على الاستجابة دون تنفيذ الطقوس أو طلب الطمأنة.",
        },
      },
      {
        number: "03",
        title: {
          en: "Tolerate uncertainty",
          fr: "Tolérer l’incertitude",
          ar: "تحمل عدم اليقين",
        },
        text: {
          en: "Build the ability to move forward without achieving complete certainty.",
          fr: "Développer la capacité à avancer sans obtenir une certitude complète.",
          ar: "بناء القدرة على الاستمرار دون الحاجة إلى الوصول إلى يقين كامل.",
        },
      },
      {
        number: "04",
        title: {
          en: "Reconnect with life",
          fr: "Se reconnecter à la vie quotidienne",
          ar: "استعادة الحياة اليومية",
        },
        text: {
          en: "Return attention and time to relationships, goals, and meaningful activities.",
          fr: "Redonner du temps et de l’attention aux relations, aux objectifs et aux activités qui ont du sens.",
          ar: "إعادة الوقت والانتباه إلى العلاقات والأهداف والأنشطة المهمة.",
        },
      },
    ],

    approachesIntro: {
      en: "Evidence-based OCD treatment is structured and adapted carefully to the person's symptoms, readiness, and clinical needs.",
      fr: "Le traitement du TOC fondé sur les données probantes est structuré et soigneusement adapté aux symptômes, au niveau de préparation et aux besoins cliniques de la personne.",
      ar: "يكون علاج الوسواس القهري القائم على الأدلة منظمًا ومكيفًا بعناية مع الأعراض والاستعداد والاحتياجات السريرية للشخص.",
    },

    approaches: [
      {
        title: {
          en: "Exposure and Response Prevention",
          fr: "Exposition avec prévention de la réponse",
          ar: "التعرض ومنع الاستجابة",
        },
        text: {
          en: "Supports gradual contact with feared uncertainty while reducing compulsive responses.",
          fr: "Favorise un contact progressif avec l’incertitude redoutée tout en réduisant les réponses compulsives.",
          ar: "يدعم التعرض التدريجي لعدم اليقين المخيف مع تقليل الاستجابات القهرية.",
        },
      },
      {
        title: {
          en: "Cognitive Behavioural Therapy",
          fr: "Thérapie cognitivo-comportementale",
          ar: "العلاج المعرفي السلوكي",
        },
        text: {
          en: "Examines interpretations, beliefs, rituals, avoidance, and reassurance patterns.",
          fr: "Examine les interprétations, les croyances, les rituels, l’évitement et les schémas de recherche de réassurance.",
          ar: "يفحص التفسيرات والمعتقدات والطقوس والتجنب وأنماط طلب الطمأنة.",
        },
      },
      {
        title: {
          en: "Acceptance-based approaches",
          fr: "Approches fondées sur l’acceptation",
          ar: "الأساليب القائمة على التقبل",
        },
        text: {
          en: "Help change the relationship with intrusive thoughts rather than trying to eliminate every thought.",
          fr: "Aident à changer la relation aux pensées intrusives plutôt qu’à chercher à éliminer chaque pensée.",
          ar: "تساعد على تغيير العلاقة مع الأفكار المتطفلة بدلًا من محاولة التخلص من كل فكرة.",
        },
      },
    ],

    faq: [
      {
        question: {
          en: "Does having intrusive thoughts mean I want them?",
          fr: "Avoir des pensées intrusives signifie-t-il que je les souhaite ?",
          ar: "هل تعني الأفكار المتطفلة أنني أرغب فيها؟",
        },
        answer: {
          en: "No. Intrusive thoughts are unwanted and can be especially distressing because they conflict with a person's values, identity, or intentions.",
          fr: "Non. Les pensées intrusives sont non désirées et peuvent être particulièrement pénibles parce qu’elles sont en conflit avec les valeurs, l’identité ou les intentions de la personne.",
          ar: "لا. الأفكار المتطفلة غير مرغوبة، وقد تكون شديدة الإزعاج لأنها تتعارض مع قيم الشخص أو هويته أو نواياه.",
        },
      },
      {
        question: {
          en: "Are compulsions always visible?",
          fr: "Les compulsions sont-elles toujours visibles ?",
          ar: "هل تكون الأفعال القهرية واضحة دائمًا؟",
        },
        answer: {
          en: "No. Some compulsions are mental, such as reviewing memories, repeating phrases, checking feelings, counting, or trying to neutralise a thought.",
          fr: "Non. Certaines compulsions sont mentales, comme revoir des souvenirs, répéter des phrases, vérifier ses sensations, compter ou essayer de neutraliser une pensée.",
          ar: "لا. بعض الأفعال القهرية تكون ذهنية، مثل مراجعة الذكريات أو تكرار عبارات أو فحص المشاعر أو العد أو محاولة إبطال فكرة.",
        },
      },
      {
        question: {
          en: "Can reassurance make OCD worse?",
          fr: "La réassurance peut-elle aggraver le TOC ?",
          ar: "هل يمكن أن تزيد الطمأنة من شدة الوسواس القهري؟",
        },
        answer: {
          en: "Repeated reassurance may provide short-term relief but can reinforce the need for certainty and maintain the OCD cycle over time.",
          fr: "Une réassurance répétée peut apporter un soulagement à court terme, mais elle peut renforcer le besoin de certitude et maintenir le cycle du TOC au fil du temps.",
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
      fr: "Deuil et perte",
      ar: "الحزن والفقدان",
    },

    eyebrow: {
      en: "UNDERSTANDING GRIEF",
      fr: "COMPRENDRE LE DEUIL",
      ar: "فهم الحزن والفقدان",
    },

    subtitle: {
      en: "When life changes after losing someone or something meaningful.",
      fr: "Lorsque la vie change après la perte d’une personne ou de quelque chose qui comptait.",
      ar: "عندما تتغير الحياة بعد فقدان شخص أو شيء ذي معنى.",
    },

    introduction: {
      en: "Grief is a natural response to loss. It may follow the death of someone important, the end of a relationship, a major health change, migration, loss of identity, or any transition that alters the life you expected.",
      fr: "Le deuil est une réponse naturelle à une perte. Il peut suivre le décès d’une personne importante, la fin d’une relation, un changement majeur de santé, une migration, une perte d’identité ou toute transition qui modifie la vie que vous aviez imaginée.",
      ar: "الحزن استجابة طبيعية للفقدان. وقد يحدث بعد وفاة شخص مهم أو انتهاء علاقة أو تغير صحي كبير أو الهجرة أو فقدان الهوية أو أي تحول يغير الحياة التي كنت تتوقعها.",
    },

    definition: {
      en: "Grief does not follow one fixed sequence or timetable. It may involve sadness, anger, relief, guilt, numbness, longing, confusion, or moments of connection and meaning alongside pain.",
      fr: "Le deuil ne suit pas une séquence ni un calendrier fixe. Il peut inclure de la tristesse, de la colère, du soulagement, de la culpabilité, de l’engourdissement, du manque, de la confusion, ou encore des moments de lien et de sens en parallèle de la douleur.",
      ar: "لا يتبع الحزن تسلسلًا أو مدة ثابتة. وقد يشمل الحزن والغضب والراحة والذنب والخدر والاشتياق والارتباك أو لحظات من التواصل والمعنى إلى جانب الألم.",
    },

    signsIntro: {
      en: "Experiences associated with grief may include:",
      fr: "Les expériences associées au deuil peuvent inclure :",
      ar: "قد تشمل التجارب المرتبطة بالحزن:",
    },

    signs: [
      {
        en: "Intense sadness, longing, or emotional pain",
        fr: "Une tristesse intense, un manque profond ou une douleur émotionnelle",
        ar: "حزن شديد أو اشتياق أو ألم نفسي",
      },
      {
        en: "Numbness, disbelief, or difficulty accepting the loss",
        fr: "Un engourdissement, de l’incrédulité ou des difficultés à accepter la perte",
        ar: "الخدر أو عدم التصديق أو صعوبة تقبل الفقدان",
      },
      {
        en: "Changes in sleep, appetite, energy, or concentration",
        fr: "Des changements du sommeil, de l’appétit, de l’énergie ou de la concentration",
        ar: "تغيرات في النوم أو الشهية أو الطاقة أو التركيز",
      },
      {
        en: "Guilt, regret, anger, or unanswered questions",
        fr: "De la culpabilité, des regrets, de la colère ou des questions sans réponse",
        ar: "الشعور بالذنب أو الندم أو الغضب أو وجود أسئلة دون إجابة",
      },
      {
        en: "Withdrawal or difficulty reconnecting with daily life",
        fr: "Un retrait ou des difficultés à se reconnecter à la vie quotidienne",
        ar: "الانسحاب أو صعوبة العودة إلى الحياة اليومية",
      },
      {
        en: "Strong reactions around reminders, dates, or places",
        fr: "Des réactions fortes face à certains souvenirs, dates ou lieux",
        ar: "استجابات قوية تجاه التذكيرات أو التواريخ أو الأماكن",
      },
    ],

    seekHelpIntro: {
      en: "There is no correct duration for grief. Support may be helpful when the pain feels unmanageable, daily functioning remains severely affected, or you feel isolated in your experience.",
      fr: "Il n’existe pas de durée « correcte » pour le deuil. Un soutien peut être utile lorsque la douleur semble impossible à gérer, que le fonctionnement quotidien reste fortement affecté ou que vous vous sentez isolé dans votre expérience.",
      ar: "لا توجد مدة صحيحة واحدة للحزن. وقد يكون الدعم مفيدًا عندما يبدو الألم غير قابل للتحمل أو تتأثر الحياة اليومية بشدة أو تشعر بالعزلة في تجربتك.",
    },

    seekHelpPoints: [
      {
        en: "You feel unable to function in daily life",
        fr: "Vous vous sentez incapable de fonctionner dans la vie quotidienne",
        ar: "تشعر بعدم القدرة على أداء مهام الحياة اليومية",
      },
      {
        en: "Guilt or regret feels overwhelming",
        fr: "La culpabilité ou les regrets semblent envahissants",
        ar: "يبدو الشعور بالذنب أو الندم شديدًا",
      },
      {
        en: "You feel disconnected from support or relationships",
        fr: "Vous vous sentez déconnecté des sources de soutien ou de vos relations",
        ar: "تشعر بالانفصال عن الدعم أو العلاقات",
      },
      {
        en: "The loss has triggered earlier trauma or depression",
        fr: "La perte a réactivé un traumatisme ou une dépression antérieure",
        ar: "أدى الفقدان إلى تنشيط صدمات سابقة أو أعراض اكتئاب",
      },
    ],

    therapyIntro: {
      en: "Therapy can provide space to express grief, understand complex emotions, preserve meaningful connection, and gradually adapt to a changed life without erasing the importance of what was lost.",
      fr: "La thérapie peut offrir un espace pour exprimer le deuil, comprendre des émotions complexes, préserver un lien significatif et s’adapter progressivement à une vie transformée sans effacer l’importance de ce qui a été perdu.",
      ar: "يمكن للعلاج توفير مساحة للتعبير عن الحزن وفهم المشاعر المعقدة والحفاظ على الارتباط المعنوي والتكيف تدريجيًا مع الحياة المتغيرة دون إلغاء أهمية ما تم فقدانه.",
    },

    therapyBenefits: [
      {
        number: "01",
        title: {
          en: "Express the loss",
          fr: "Exprimer la perte",
          ar: "التعبير عن الفقدان",
        },
        text: {
          en: "Speak openly about emotions that may feel difficult to share elsewhere.",
          fr: "Parler ouvertement d’émotions qu’il peut être difficile de partager ailleurs.",
          ar: "التحدث بصراحة عن مشاعر قد يصعب مشاركتها في أماكن أخرى.",
        },
      },
      {
        number: "02",
        title: {
          en: "Understand complexity",
          fr: "Comprendre la complexité",
          ar: "فهم تعقيد المشاعر",
        },
        text: {
          en: "Make space for sadness, anger, relief, guilt, love, and uncertainty.",
          fr: "Faire une place à la tristesse, à la colère, au soulagement, à la culpabilité, à l’amour et à l’incertitude.",
          ar: "إتاحة مساحة للحزن والغضب والراحة والذنب والحب وعدم اليقين.",
        },
      },
      {
        number: "03",
        title: {
          en: "Maintain connection",
          fr: "Maintenir le lien",
          ar: "الحفاظ على الارتباط",
        },
        text: {
          en: "Explore ways of carrying memories, values, and meaningful bonds forward.",
          fr: "Explorer des façons de faire vivre les souvenirs, les valeurs et les liens significatifs.",
          ar: "استكشاف طرق للحفاظ على الذكريات والقيم والروابط المهمة.",
        },
      },
      {
        number: "04",
        title: {
          en: "Adapt gradually",
          fr: "S’adapter progressivement",
          ar: "التكيف التدريجي",
        },
        text: {
          en: "Rebuild routines, relationships, identity, and purpose over time.",
          fr: "Reconstruire peu à peu les routines, les relations, l’identité et le sentiment de sens.",
          ar: "إعادة بناء الروتين والعلاقات والهوية والإحساس بالهدف مع الوقت.",
        },
      },
    ],

    approachesIntro: {
      en: "Grief therapy is adapted to the person, the nature of the loss, cultural meaning, relationships, and the broader circumstances surrounding the experience.",
      fr: "La thérapie du deuil est adaptée à la personne, à la nature de la perte, à sa signification culturelle, aux relations et au contexte plus large de l’expérience.",
      ar: "يتم تكييف علاج الحزن مع الشخص وطبيعة الفقدان والمعنى الثقافي والعلاقات والظروف المحيطة بالتجربة.",
    },

    approaches: [
      {
        title: {
          en: "Grief-focused therapy",
          fr: "Thérapie centrée sur le deuil",
          ar: "العلاج الموجه للحزن",
        },
        text: {
          en: "Supports emotional processing, adaptation, meaning, and continuing bonds.",
          fr: "Soutient le traitement émotionnel, l’adaptation, la recherche de sens et la continuité des liens.",
          ar: "يدعم معالجة المشاعر والتكيف والمعنى واستمرار الروابط المعنوية.",
        },
      },
      {
        title: {
          en: "Narrative approaches",
          fr: "Approches narratives",
          ar: "الأساليب السردية",
        },
        text: {
          en: "Help explore the story of the loss and its place within your life.",
          fr: "Aident à explorer l’histoire de la perte et la place qu’elle occupe dans votre vie.",
          ar: "تساعد على استكشاف قصة الفقدان ومكانها داخل حياتك.",
        },
      },
      {
        title: {
          en: "Supportive psychotherapy",
          fr: "Psychothérapie de soutien",
          ar: "العلاج النفسي الداعم",
        },
        text: {
          en: "Provides emotional containment, validation, and practical support during adaptation.",
          fr: "Offre un soutien émotionnel, de la validation et un accompagnement pratique pendant l’adaptation.",
          ar: "يوفر الاحتواء النفسي والتأكيد والدعم العملي خلال عملية التكيف.",
        },
      },
    ],

    faq: [
      {
        question: {
          en: "Is there a normal timeline for grief?",
          fr: "Existe-t-il une durée normale pour le deuil ?",
          ar: "هل توجد مدة طبيعية محددة للحزن؟",
        },
        answer: {
          en: "No. Grief varies according to the relationship, circumstances, culture, support, previous experiences, and meaning of the loss.",
          fr: "Non. Le deuil varie selon la relation, les circonstances, la culture, le soutien disponible, les expériences antérieures et la signification de la perte.",
          ar: "لا. يختلف الحزن وفقًا للعلاقة والظروف والثقافة والدعم والتجارب السابقة ومعنى الفقدان.",
        },
      },
      {
        question: {
          en: "Does therapy help me forget the person or loss?",
          fr: "La thérapie va-t-elle m’aider à oublier la personne ou la perte ?",
          ar: "هل يساعدني العلاج على نسيان الشخص أو الفقدان؟",
        },
        answer: {
          en: "The aim is not to erase the relationship or meaning. Therapy may help you carry the loss in a way that becomes more manageable over time.",
          fr: "L’objectif n’est pas d’effacer la relation ni sa signification. La thérapie peut vous aider à porter cette perte d’une manière qui devient progressivement plus supportable.",
          ar: "لا يهدف العلاج إلى محو العلاقة أو المعنى. وقد يساعدك على حمل تجربة الفقدان بطريقة تصبح أكثر قابلية للتحمل مع الوقت.",
        },
      },
      {
        question: {
          en: "Can grief include relief or anger?",
          fr: "Le deuil peut-il inclure du soulagement ou de la colère ?",
          ar: "هل يمكن أن يشمل الحزن الراحة أو الغضب؟",
        },
        answer: {
          en: "Yes. Grief can involve many emotions, including relief, anger, guilt, love, numbness, confusion, and sadness. Mixed emotions do not make the loss less meaningful.",
          fr: "Oui. Le deuil peut comporter de nombreuses émotions, notamment du soulagement, de la colère, de la culpabilité, de l’amour, de l’engourdissement, de la confusion et de la tristesse. Des émotions mêlées ne rendent pas la perte moins importante.",
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
      fr: "Parentalité",
      ar: "تحديات الأبوة والأمومة",
    },

    eyebrow: {
      en: "UNDERSTANDING PARENTING CHALLENGES",
      fr: "COMPRENDRE LES DÉFIS DE LA PARENTALITÉ",
      ar: "فهم تحديات الأبوة والأمومة",
    },

    subtitle: {
      en: "When caring for others leaves little space for yourself.",
      fr: "Lorsque prendre soin des autres laisse peu de place pour soi.",
      ar: "عندما لا تترك رعاية الآخرين مساحة كافية لنفسك.",
    },

    introduction: {
      en: "Parenting can involve love, meaning, joy, responsibility, uncertainty, and significant emotional pressure. Parents may feel overwhelmed while trying to respond to their child's needs, manage family relationships, and maintain their own wellbeing.",
      fr: "La parentalité peut mêler amour, sens, joie, responsabilité, incertitude et pression émotionnelle importante. Les parents peuvent se sentir dépassés en essayant de répondre aux besoins de leur enfant, de gérer les relations familiales et de préserver leur propre bien-être.",
      ar: "قد تشمل الأبوة والأمومة الحب والمعنى والفرح والمسؤولية وعدم اليقين والضغط النفسي الكبير. وقد يشعر الوالدان بالإرهاق أثناء محاولة الاستجابة لاحتياجات الطفل وإدارة العلاقات الأسرية والحفاظ على صحتهما النفسية.",
    },

    definition: {
      en: "Parenting difficulties may relate to stress, changing family roles, behavioural concerns, communication, guilt, boundaries, conflict between caregivers, or uncertainty about how to support a child through emotional and developmental changes.",
      fr: "Les difficultés liées à la parentalité peuvent concerner le stress, l’évolution des rôles familiaux, des préoccupations comportementales, la communication, la culpabilité, les limites, les conflits entre les personnes qui s’occupent de l’enfant ou l’incertitude quant à la manière d’accompagner un enfant dans ses changements émotionnels et développementaux.",
      ar: "قد ترتبط تحديات الأبوة والأمومة بالضغط أو تغير الأدوار الأسرية أو المخاوف السلوكية أو التواصل أو الشعور بالذنب أو الحدود أو الخلافات بين مقدمي الرعاية أو عدم اليقين حول كيفية دعم الطفل خلال التغيرات النفسية والنمائية.",
    },

    signsIntro: {
      en: "You may experience parenting stress through:",
      fr: "Le stress parental peut se manifester par :",
      ar: "قد يظهر ضغط الأبوة والأمومة من خلال:",
    },

    signs: [
      {
        en: "Feeling constantly overwhelmed or emotionally exhausted",
        fr: "Le sentiment d’être constamment dépassé ou émotionnellement épuisé",
        ar: "الشعور المستمر بالإرهاق أو الاستنزاف النفسي",
      },
      {
        en: "Frequent guilt or fear of making the wrong decisions",
        fr: "Une culpabilité fréquente ou la peur de prendre de mauvaises décisions",
        ar: "الشعور المتكرر بالذنب أو الخوف من اتخاذ قرارات خاطئة",
      },
      {
        en: "Difficulty responding calmly during conflict",
        fr: "Des difficultés à réagir calmement pendant les conflits",
        ar: "صعوبة الاستجابة بهدوء أثناء الخلافات",
      },
      {
        en: "Disagreement between caregivers about parenting",
        fr: "Des désaccords entre les personnes qui s’occupent de l’enfant au sujet de la parentalité",
        ar: "الخلاف بين مقدمي الرعاية حول أساليب التربية",
      },
      {
        en: "Difficulty maintaining boundaries or routines",
        fr: "Des difficultés à maintenir des limites ou des routines",
        ar: "صعوبة الحفاظ على الحدود أو الروتين",
      },
      {
        en: "Losing connection with your own needs and identity",
        fr: "La perte de contact avec vos propres besoins et votre identité",
        ar: "فقدان التواصل مع احتياجاتك وهويتك الشخصية",
      },
    ],

    seekHelpIntro: {
      en: "Support may be helpful when parenting stress is affecting your emotional wellbeing, relationships, confidence, or ability to respond to family difficulties in the way you would like.",
      fr: "Un soutien peut être utile lorsque le stress parental affecte votre bien-être émotionnel, vos relations, votre confiance ou votre capacité à répondre aux difficultés familiales comme vous le souhaiteriez.",
      ar: "قد يكون الدعم مفيدًا عندما يؤثر ضغط الأبوة والأمومة في صحتك النفسية أو علاقاتك أو ثقتك أو قدرتك على التعامل مع الصعوبات الأسرية بالطريقة التي ترغب بها.",
    },

    seekHelpPoints: [
      {
        en: "You feel emotionally exhausted most of the time",
        fr: "Vous vous sentez émotionnellement épuisé la plupart du temps",
        ar: "تشعر بالاستنزاف النفسي معظم الوقت",
      },
      {
        en: "Family conflict has become difficult to manage",
        fr: "Les conflits familiaux sont devenus difficiles à gérer",
        ar: "أصبح الخلاف الأسري صعب الإدارة",
      },
      {
        en: "Guilt and self-criticism affect your confidence",
        fr: "La culpabilité et l’autocritique affectent votre confiance",
        ar: "يؤثر الشعور بالذنب ونقد الذات في ثقتك",
      },
      {
        en: "You are struggling with a major family transition",
        fr: "Vous traversez difficilement une transition familiale importante",
        ar: "تجد صعوبة في التعامل مع تحول أسري كبير",
      },
    ],

    therapyIntro: {
      en: "Therapy can provide a confidential space to understand parenting stress, explore family patterns, strengthen communication, and develop responses that support both your child and your own emotional wellbeing.",
      fr: "La thérapie peut offrir un espace confidentiel pour comprendre le stress parental, explorer les schémas familiaux, renforcer la communication et développer des réponses qui soutiennent à la fois votre enfant et votre propre bien-être émotionnel.",
      ar: "يمكن للعلاج أن يوفر مساحة سرية لفهم ضغط الأبوة والأمومة واستكشاف الأنماط الأسرية وتقوية التواصل وتطوير استجابات تدعم الطفل وصحتك النفسية معًا.",
    },

    therapyBenefits: [
      {
        number: "01",
        title: {
          en: "Understand triggers",
          fr: "Comprendre les déclencheurs",
          ar: "فهم المحفزات",
        },
        text: {
          en: "Recognise situations and emotions that make parenting responses more difficult.",
          fr: "Reconnaître les situations et les émotions qui rendent les réactions parentales plus difficiles.",
          ar: "التعرف إلى المواقف والمشاعر التي تجعل الاستجابات التربوية أكثر صعوبة.",
        },
      },
      {
        number: "02",
        title: {
          en: "Improve communication",
          fr: "Améliorer la communication",
          ar: "تحسين التواصل",
        },
        text: {
          en: "Develop clearer and calmer ways of communicating within the family.",
          fr: "Développer des manières plus claires et plus calmes de communiquer au sein de la famille.",
          ar: "تطوير طرق أوضح وأكثر هدوءًا للتواصل داخل الأسرة.",
        },
      },
      {
        number: "03",
        title: {
          en: "Strengthen boundaries",
          fr: "Renforcer les limites",
          ar: "تقوية الحدود",
        },
        text: {
          en: "Create consistent limits that support safety, connection, and development.",
          fr: "Créer des limites cohérentes qui soutiennent la sécurité, le lien et le développement.",
          ar: "بناء حدود ثابتة تدعم الأمان والتواصل والنمو.",
        },
      },
      {
        number: "04",
        title: {
          en: "Support yourself",
          fr: "Prendre soin de soi",
          ar: "دعم الذات",
        },
        text: {
          en: "Make space for rest, emotional needs, identity, and self-compassion.",
          fr: "Faire une place au repos, aux besoins émotionnels, à l’identité et à l’autocompassion.",
          ar: "إتاحة مساحة للراحة والاحتياجات النفسية والهوية والتعاطف مع الذات.",
        },
      },
    ],

    approachesIntro: {
      en: "Parenting support may involve individual therapy, parent consultations, family work, or collaboration with other professionals, depending on the family's needs.",
      fr: "Le soutien à la parentalité peut inclure une thérapie individuelle, des consultations parentales, un travail familial ou une collaboration avec d’autres professionnels, selon les besoins de la famille.",
      ar: "قد يشمل دعم الأبوة والأمومة العلاج الفردي أو الاستشارات الوالدية أو العمل الأسري أو التعاون مع مختصين آخرين وفقًا لاحتياجات الأسرة.",
    },

    approaches: [
      {
        title: {
          en: "Parent-focused therapy",
          fr: "Thérapie centrée sur les parents",
          ar: "العلاج الموجه للوالدين",
        },
        text: {
          en: "Explores emotional responses, parenting confidence, boundaries, and family stress.",
          fr: "Explore les réactions émotionnelles, la confiance parentale, les limites et le stress familial.",
          ar: "يستكشف الاستجابات النفسية والثقة التربوية والحدود والضغط الأسري.",
        },
      },
      {
        title: {
          en: "Family systems approaches",
          fr: "Approches systémiques familiales",
          ar: "أساليب العلاج الأسري",
        },
        text: {
          en: "Consider how roles, communication, and relationships influence the family as a whole.",
          fr: "Examinent comment les rôles, la communication et les relations influencent la famille dans son ensemble.",
          ar: "تبحث في كيفية تأثير الأدوار والتواصل والعلاقات في الأسرة ككل.",
        },
      },
      {
        title: {
          en: "Attachment-based approaches",
          fr: "Approches fondées sur l’attachement",
          ar: "الأساليب القائمة على التعلق",
        },
        text: {
          en: "Support emotional connection, responsiveness, safety, and repair within relationships.",
          fr: "Soutiennent le lien émotionnel, la réactivité, la sécurité et la réparation au sein des relations.",
          ar: "تدعم التواصل العاطفي والاستجابة والأمان وإصلاح العلاقة.",
        },
      },
    ],

    faq: [
      {
        question: {
          en: "Does asking for help mean I am a bad parent?",
          fr: "Demander de l’aide signifie-t-il que je suis un mauvais parent ?",
          ar: "هل يعني طلب المساعدة أنني والد سيئ؟",
        },
        answer: {
          en: "No. Seeking support can reflect care, responsibility, and a willingness to understand both your child's needs and your own.",
          fr: "Non. Demander du soutien peut refléter de l’attention, de la responsabilité et la volonté de comprendre à la fois les besoins de votre enfant et les vôtres.",
          ar: "لا. قد يعكس طلب الدعم الاهتمام والمسؤولية والرغبة في فهم احتياجات طفلك واحتياجاتك الشخصية.",
        },
      },
      {
        question: {
          en: "Can I attend therapy without my child?",
          fr: "Puis-je suivre une thérapie sans mon enfant ?",
          ar: "هل يمكنني حضور العلاج دون طفلي؟",
        },
        answer: {
          en: "Yes. Individual therapy or parent consultations can help you understand your responses, strengthen parenting skills, and make changes within family relationships.",
          fr: "Oui. Une thérapie individuelle ou des consultations parentales peuvent vous aider à comprendre vos réactions, à renforcer vos compétences parentales et à apporter des changements dans les relations familiales.",
          ar: "نعم. يمكن للعلاج الفردي أو الاستشارات الوالدية مساعدتك على فهم استجاباتك وتقوية مهاراتك وإحداث تغييرات داخل العلاقات الأسرية.",
        },
      },
      {
        question: {
          en: "Can therapy help caregivers who disagree?",
          fr: "La thérapie peut-elle aider des adultes responsables de l’enfant qui ne sont pas d’accord entre eux ?",
          ar: "هل يمكن للعلاج مساعدة مقدمي الرعاية الذين يختلفون في التربية؟",
        },
        answer: {
          en: "Therapy may help caregivers understand different expectations, communicate more clearly, and develop greater consistency around important decisions.",
          fr: "La thérapie peut les aider à comprendre leurs attentes différentes, à communiquer plus clairement et à développer davantage de cohérence autour des décisions importantes.",
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
      fr: "Difficultés liées à l’alimentation",
      ar: "صعوبات الأكل",
    },

    eyebrow: {
      en: "UNDERSTANDING EATING DIFFICULTIES",
      fr: "COMPRENDRE LES DIFFICULTÉS LIÉES À L’ALIMENTATION",
      ar: "فهم صعوبات الأكل",
    },

    subtitle: {
      en: "When food, body image, or control becomes a source of distress.",
      fr: "Lorsque l’alimentation, l’image corporelle ou le besoin de contrôle devient une source de souffrance.",
      ar: "عندما يصبح الطعام أو صورة الجسد أو التحكم مصدرًا للضغط.",
    },

    introduction: {
      en: "Eating difficulties can affect a person's relationship with food, body image, emotions, control, identity, and self-worth. These experiences can take many forms and may not always be visible to other people.",
      fr: "Les difficultés liées à l’alimentation peuvent affecter la relation d’une personne avec la nourriture, l’image corporelle, les émotions, le contrôle, l’identité et l’estime de soi. Ces expériences peuvent prendre de nombreuses formes et ne sont pas toujours visibles pour les autres.",
      ar: "قد تؤثر صعوبات الأكل في علاقة الشخص بالطعام وصورة الجسد والمشاعر والتحكم والهوية والقيمة الذاتية. وقد تأخذ هذه التجارب أشكالًا متعددة ولا تكون دائمًا واضحة للآخرين.",
    },

    definition: {
      en: "A person may experience restrictive eating, binge eating, compensatory behaviours, intense concern about weight or shape, rigid food rules, shame, secrecy, or emotional reliance on food. Difficulties can be serious regardless of body size.",
      fr: "Une personne peut connaître une restriction alimentaire, des épisodes d’hyperphagie, des comportements compensatoires, une préoccupation intense concernant le poids ou la silhouette, des règles alimentaires rigides, de la honte, du secret ou une dépendance émotionnelle à la nourriture. Ces difficultés peuvent être sérieuses quelle que soit la corpulence.",
      ar: "قد يعاني الشخص من تقييد الأكل أو نوبات الأكل المفرط أو السلوكيات التعويضية أو القلق الشديد بشأن الوزن أو الشكل أو قواعد صارمة حول الطعام أو الخجل أو السرية أو الاعتماد النفسي على الطعام. وقد تكون الصعوبات خطيرة بغض النظر عن حجم الجسم.",
    },

    signsIntro: {
      en: "Possible signs of eating difficulties may include:",
      fr: "Les signes possibles de difficultés liées à l’alimentation peuvent inclure :",
      ar: "قد تشمل العلامات المحتملة لصعوبات الأكل:",
    },

    signs: [
      {
        en: "Persistent worry about food, weight, shape, or appearance",
        fr: "Une préoccupation persistante concernant la nourriture, le poids, la silhouette ou l’apparence",
        ar: "القلق المستمر بشأن الطعام أو الوزن أو الشكل أو المظهر",
      },
      {
        en: "Rigid rules about what, when, or how much to eat",
        fr: "Des règles rigides sur quoi, quand ou combien manger",
        ar: "قواعد صارمة حول نوع الطعام أو توقيته أو كميته",
      },
      {
        en: "Episodes of feeling out of control around eating",
        fr: "Des épisodes où vous avez le sentiment de perdre le contrôle autour de l’alimentation",
        ar: "نوبات من الشعور بفقدان السيطرة أثناء الأكل",
      },
      {
        en: "Avoiding meals or eating around other people",
        fr: "Éviter des repas ou éviter de manger avec d’autres personnes",
        ar: "تجنب الوجبات أو الأكل أمام الآخرين",
      },
      {
        en: "Shame, guilt, or secrecy connected to food",
        fr: "De la honte, de la culpabilité ou du secret autour de l’alimentation",
        ar: "الخجل أو الذنب أو السرية المرتبطة بالطعام",
      },
      {
        en: "Self-worth becoming strongly connected to body image",
        fr: "Une estime de soi fortement liée à l’image corporelle",
        ar: "ارتباط القيمة الذاتية بصورة قوية بصورة الجسد",
      },
    ],

    seekHelpIntro: {
      en: "Professional support is important when thoughts or behaviours related to food and body image cause distress, affect physical health, interfere with daily life, or feel increasingly difficult to control.",
      fr: "Un soutien professionnel est important lorsque les pensées ou comportements liés à l’alimentation et à l’image corporelle provoquent de la détresse, affectent la santé physique, interfèrent avec la vie quotidienne ou deviennent de plus en plus difficiles à contrôler.",
      ar: "يُعد الدعم المهني مهمًا عندما تسبب الأفكار أو السلوكيات المرتبطة بالطعام وصورة الجسد ضغطًا نفسيًا أو تؤثر في الصحة الجسدية أو الحياة اليومية أو تصبح أكثر صعوبة في التحكم.",
    },

    seekHelpPoints: [
      {
        en: "Food-related thoughts occupy a large part of your day",
        fr: "Les pensées liées à l’alimentation occupent une grande partie de votre journée",
        ar: "تستحوذ الأفكار المرتبطة بالطعام على جزء كبير من يومك",
      },
      {
        en: "Eating behaviours feel secretive or difficult to control",
        fr: "Les comportements alimentaires deviennent secrets ou difficiles à contrôler",
        ar: "تبدو سلوكيات الأكل سرية أو يصعب التحكم فيها",
      },
      {
        en: "Your physical health or energy has changed",
        fr: "Votre santé physique ou votre niveau d’énergie a changé",
        ar: "حدث تغير في صحتك الجسدية أو طاقتك",
      },
      {
        en: "Body image is affecting relationships or daily activities",
        fr: "L’image corporelle affecte vos relations ou vos activités quotidiennes",
        ar: "تؤثر صورة الجسد في علاقاتك أو أنشطتك اليومية",
      },
    ],

    therapyIntro: {
      en: "Psychotherapy can help explore the emotional and relational meanings connected to food, body image, control, shame, and self-worth. Treatment may also require collaboration with medical and nutritional professionals.",
      fr: "La psychothérapie peut aider à explorer les significations émotionnelles et relationnelles liées à l’alimentation, à l’image corporelle, au contrôle, à la honte et à l’estime de soi. Le traitement peut également nécessiter une collaboration avec des professionnels de santé et de la nutrition.",
      ar: "يمكن للعلاج النفسي أن يساعد على استكشاف المعاني النفسية والعلاقية المرتبطة بالطعام وصورة الجسد والتحكم والخجل والقيمة الذاتية. وقد يتطلب العلاج أيضًا التعاون مع مختصين طبيين وتغذويين.",
    },

    therapyBenefits: [
      {
        number: "01",
        title: {
          en: "Understand patterns",
          fr: "Comprendre les schémas",
          ar: "فهم الأنماط",
        },
        text: {
          en: "Explore situations and emotions connected to eating behaviours.",
          fr: "Explorer les situations et les émotions liées aux comportements alimentaires.",
          ar: "استكشاف المواقف والمشاعر المرتبطة بسلوكيات الأكل.",
        },
      },
      {
        number: "02",
        title: {
          en: "Reduce shame",
          fr: "Réduire la honte",
          ar: "تقليل الخجل",
        },
        text: {
          en: "Create a confidential space to discuss experiences without judgement.",
          fr: "Créer un espace confidentiel pour parler de ces expériences sans jugement.",
          ar: "توفير مساحة سرية لمناقشة التجارب دون أحكام.",
        },
      },
      {
        number: "03",
        title: {
          en: "Build emotional regulation",
          fr: "Développer la régulation émotionnelle",
          ar: "بناء تنظيم المشاعر",
        },
        text: {
          en: "Develop alternatives for responding to distress, anxiety, and difficult emotions.",
          fr: "Développer d’autres façons de répondre à la détresse, à l’anxiété et aux émotions difficiles.",
          ar: "تطوير بدائل للتعامل مع الضغط والقلق والمشاعر الصعبة.",
        },
      },
      {
        number: "04",
        title: {
          en: "Strengthen self-worth",
          fr: "Renforcer l’estime de soi",
          ar: "تعزيز القيمة الذاتية",
        },
        text: {
          en: "Develop an identity and sense of worth that are not defined only by appearance.",
          fr: "Développer une identité et un sentiment de valeur qui ne sont pas définis uniquement par l’apparence.",
          ar: "بناء هوية وإحساس بالقيمة لا يحددهما المظهر وحده.",
        },
      },
    ],

    approachesIntro: {
      en: "Eating difficulties often benefit from coordinated care. The most appropriate treatment depends on physical health, symptoms, age, severity, and individual circumstances.",
      fr: "Les difficultés liées à l’alimentation bénéficient souvent d’une prise en charge coordonnée. Le traitement le plus approprié dépend de la santé physique, des symptômes, de l’âge, de leur sévérité et de la situation individuelle.",
      ar: "غالبًا ما تستفيد صعوبات الأكل من رعاية منسقة. ويعتمد العلاج الأنسب على الصحة الجسدية والأعراض والعمر وشدة الحالة والظروف الفردية.",
    },

    approaches: [
      {
        title: {
          en: "Eating-disorder-focused CBT",
          fr: "TCC centrée sur les troubles alimentaires",
          ar: "العلاج المعرفي السلوكي الموجه لصعوبات الأكل",
        },
        text: {
          en: "Addresses eating patterns, rigid rules, body-image concerns, and maintaining behaviours.",
          fr: "Travaille sur les schémas alimentaires, les règles rigides, les préoccupations liées à l’image corporelle et les comportements qui entretiennent les difficultés.",
          ar: "يتعامل مع أنماط الأكل والقواعد الصارمة ومخاوف صورة الجسد والسلوكيات التي تحافظ على الصعوبة.",
        },
      },
      {
        title: {
          en: "Compassion-focused therapy",
          fr: "Thérapie centrée sur la compassion",
          ar: "العلاج المرتكز على التعاطف",
        },
        text: {
          en: "Supports work with shame, self-criticism, body image, and emotional pain.",
          fr: "Soutient le travail autour de la honte, de l’autocritique, de l’image corporelle et de la souffrance émotionnelle.",
          ar: "يدعم التعامل مع الخجل ونقد الذات وصورة الجسد والألم النفسي.",
        },
      },
      {
        title: {
          en: "Multidisciplinary support",
          fr: "Prise en charge multidisciplinaire",
          ar: "الدعم متعدد التخصصات",
        },
        text: {
          en: "May involve psychotherapy, medical monitoring, nutritional care, and specialist services.",
          fr: "Peut associer psychothérapie, suivi médical, accompagnement nutritionnel et services spécialisés.",
          ar: "قد يشمل العلاج النفسي والمتابعة الطبية والرعاية التغذوية والخدمات المتخصصة.",
        },
      },
    ],

    faq: [
      {
        question: {
          en: "Do I need to be underweight to have an eating disorder?",
          fr: "Dois-je être en sous-poids pour avoir un trouble alimentaire ?",
          ar: "هل يجب أن يكون وزني منخفضًا حتى أعاني من اضطراب في الأكل؟",
        },
        answer: {
          en: "No. Eating disorders and significant eating difficulties can affect people at any body size. Appearance alone does not show the severity of someone's experience.",
          fr: "Non. Les troubles alimentaires et les difficultés alimentaires importantes peuvent toucher des personnes de toutes corpulences. L’apparence seule ne reflète pas la gravité de l’expérience d’une personne.",
          ar: "لا. قد تؤثر اضطرابات الأكل وصعوباته الشديدة في أشخاص من مختلف أحجام الأجسام. ولا يكشف المظهر وحده عن شدة تجربة الشخص.",
        },
      },
      {
        question: {
          en: "Can I seek help before symptoms become severe?",
          fr: "Puis-je demander de l’aide avant que les symptômes ne deviennent sévères ?",
          ar: "هل يمكنني طلب المساعدة قبل أن تصبح الأعراض شديدة؟",
        },
        answer: {
          en: "Yes. You do not need to wait until the difficulty reaches a crisis. Early professional support can be valuable.",
          fr: "Oui. Vous n’avez pas besoin d’attendre que la difficulté atteigne une situation de crise. Un soutien professionnel précoce peut être précieux.",
          ar: "نعم. لا تحتاج إلى الانتظار حتى تصل الصعوبة إلى مرحلة أزمة. وقد يكون الدعم المهني المبكر مهمًا.",
        },
      },
      {
        question: {
          en: "Is psychotherapy enough on its own?",
          fr: "La psychothérapie suffit-elle à elle seule ?",
          ar: "هل يكفي العلاج النفسي وحده؟",
        },
        answer: {
          en: "That depends on the situation. Some people may also require medical assessment, physical-health monitoring, nutritional support, or specialist eating-disorder services.",
          fr: "Cela dépend de la situation. Certaines personnes peuvent également avoir besoin d’une évaluation médicale, d’un suivi de leur santé physique, d’un accompagnement nutritionnel ou de services spécialisés dans les troubles alimentaires.",
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

      if (savedLanguage === "en" || savedLanguage === "fr" || savedLanguage === "ar") {
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
  const isFrench = language === "fr";
  const localized = (text: LocalizedText) =>
    isArabic ? text.ar : isFrench ? text.fr : text.en;
  const ui = (en: string, fr: string, ar: string) =>
    isArabic ? ar : isFrench ? fr : en;

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
              {ui("We could not find this area of support.", "Nous n’avons pas pu trouver ce domaine d’accompagnement.", "لم نتمكن من العثور على هذا المجال.")}
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#66727a]">
              {ui("The link may be incorrect or the page may no longer be available. You can return to all areas of support.", "Le lien est peut-être incorrect ou la page n’est plus disponible. Vous pouvez revenir à l’ensemble des domaines d’accompagnement.", "قد يكون الرابط غير صحيح أو لم تعد الصفحة متاحة. يمكنك العودة إلى جميع مجالات الدعم.")}
            </p>

            <Link
              href="/support"
              className="mt-9 inline-flex rounded-2xl bg-[#415a72] px-8 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#32495f]"
            >
              {ui("Return to Areas of Support", "Retour aux domaines d’accompagnement", "العودة إلى مجالات الدعم")}
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
            {ui("Home", "Accueil", "الرئيسية")}
          </Link>

          <span aria-hidden="true">/</span>

          <Link href="/support" className="transition hover:text-[#415a72]">
            {ui("Areas of Support", "Domaines d’accompagnement", "مجالات الدعم")}
          </Link>

          <span aria-hidden="true">/</span>

          <span className="font-semibold text-[#415a72]">
            {localized(topic.title)}
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
          {localized(topic.eyebrow)}
        </p>
      </div>

      <h1 className="mt-8 max-w-4xl text-5xl font-bold leading-[0.98] text-[#223748] sm:text-7xl lg:text-[6.5rem]">
        {localized(topic.title)}
      </h1>

      <p className="mt-8 max-w-3xl text-xl font-medium leading-9 text-[#415a72] sm:text-2xl">
        {localized(topic.subtitle)}
      </p>

      <p className="mt-8 max-w-3xl text-lg leading-9 text-[#66727a]">
        {localized(topic.introduction)}
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-5">
        <Link
          href="/booking"
          className="inline-flex items-center justify-center rounded-2xl bg-[#415a72] px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#32495f]"
        >
          {ui("Book an Online Session", "Réserver une séance en ligne", "احجز جلسة عبر الإنترنت")}
        </Link>

        <a
          href="#understanding"
          className="inline-flex items-center justify-center rounded-2xl border border-[#cdbb9e] px-8 py-4 text-lg font-semibold text-[#415a72] transition hover:border-[#a98b60] hover:bg-white"
        >
          {ui("Learn More", "En savoir plus", "اقرأ المزيد")}
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
                {ui("UNDERSTANDING THE EXPERIENCE", "COMPRENDRE L’EXPÉRIENCE", "فهم التجربة")}
              </p>
            </div>

            <div>
              <h2 className="max-w-4xl text-3xl font-bold leading-tight sm:text-5xl">
                {isArabic ? `ما المقصود بـ ${topic.title.ar}؟` : isFrench ? `Qu’est-ce que ${topic.title.fr} ?` : `What is ${topic.title.en}?`}
              </h2>

              <p className="mt-7 max-w-4xl text-lg leading-9 text-[#66727a]">
                {localized(topic.definition)}
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
                {ui("COMMON SIGNS", "SIGNES FRÉQUENTS", "علامات شائعة")}
              </p>

              <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">
                {ui("The experience may look different for every person.", "L’expérience peut se présenter différemment d’une personne à l’autre.", "قد تبدو التجربة مختلفة من شخص إلى آخر.")}
              </h2>

              <p className="mt-6 text-lg leading-8 text-[#66727a]">
                {localized(topic.signsIntro)}
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
                      {localized(sign)}
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
              {ui("WHEN TO SEEK SUPPORT", "QUAND DEMANDER DE L’AIDE ?", "متى تطلب الدعم؟")}
            </p>

            <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">
              {ui("You do not need to wait until things become unbearable.", "Vous n’avez pas besoin d’attendre que la situation devienne insupportable.", "لا تحتاج إلى الانتظار حتى تصبح الأمور غير محتملة.")}
            </h2>

            <p className="mt-6 text-lg leading-8 text-[#66727a]">
              {localized(topic.seekHelpIntro)}
            </p>

            <Link
              href="/booking"
              className="mt-9 inline-flex rounded-2xl bg-[#415a72] px-8 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#32495f]"
            >
              {ui("Begin Booking", "Commencer la réservation", "ابدأ عملية الحجز")}
            </Link>
          </div>

          <div className="rounded-[2.5rem] bg-[#223748] p-8 text-white sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d4be95]">
              {ui("IT MAY BE TIME TO SPEAK WITH A THERAPIST IF:", "IL PEUT ÊTRE TEMPS DE PARLER À UN THÉRAPEUTE SI :", "قد يكون الوقت مناسبًا للتحدث مع معالج إذا:")}
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
                    {localized(point)}
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
              {ui("HOW PSYCHOTHERAPY MAY HELP", "COMMENT LA PSYCHOTHÉRAPIE PEUT AIDER", "كيف يمكن للعلاج النفسي أن يساعد؟")}
            </p>

            <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">
              {ui("Therapy offers space to understand the experience and build new responses.", "La thérapie offre un espace pour comprendre votre expérience et développer de nouvelles façons d’y répondre.", "العلاج مساحة لفهم التجربة وبناء استجابات جديدة.")}
            </h2>

            <p className="mt-6 text-lg leading-8 text-[#66727a]">
              {localized(topic.therapyIntro)}
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
                  {localized(benefit.title)}
                </h3>

                <p className="mt-4 leading-8 text-[#68747b]">
                  {localized(benefit.text)}
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
                {ui("THERAPEUTIC APPROACHES", "APPROCHES THÉRAPEUTIQUES", "الأساليب العلاجية")}
              </p>

              <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">
                {ui("Treatment is adapted to each person’s needs.", "Le traitement est adapté aux besoins de chaque personne.", "يتم تكييف العلاج مع احتياجات كل شخص.")}
              </h2>

              <p className="mt-6 text-lg leading-8 text-[#5f6b72]">
                {localized(topic.approachesIntro)}
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
                          {localized(approach.title)}
                        </h3>

                        <p className="mt-3 leading-8 text-[#657078]">
                          {localized(approach.text)}
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
                {ui("An important note", "Remarque importante", "ملاحظة مهمة")}
              </h2>

              <p className="mt-4 max-w-5xl leading-8 text-[#66727a]">
                {ui("This page provides general information and is not intended to diagnose a condition or replace a professional medical or psychological assessment. Some people may require support from a doctor, psychiatrist, or specialist service alongside psychotherapy.", "Cette page fournit des informations générales et n’a pas pour objectif d’établir un diagnostic ni de remplacer une évaluation médicale ou psychologique professionnelle. Certaines personnes peuvent avoir besoin, en complément de la psychothérapie, de l’accompagnement d’un médecin, d’un psychiatre ou d’un service spécialisé.", "هذه الصفحة تقدم معلومات عامة ولا تُستخدم للتشخيص أو كبديل عن التقييم الطبي أو النفسي المهني. قد يحتاج بعض الأشخاص إلى دعم من طبيب أو طبيب نفسي أو خدمات متخصصة إلى جانب العلاج النفسي.")}
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
              {ui("FREQUENTLY ASKED QUESTIONS", "QUESTIONS FRÉQUENTES", "أسئلة شائعة")}
            </p>

            <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">
              {ui("Some questions you may be carrying.", "Quelques questions que vous vous posez peut-être.", "بعض الأسئلة التي قد تكون لديك.")}
            </h2>

            <p className="mt-6 text-lg leading-8 text-[#66727a]">
              {ui("No single experience applies to everyone. A therapist can help you understand what is happening within your individual circumstances.", "Il n’existe pas une expérience unique qui s’applique à tout le monde. Un thérapeute peut vous aider à comprendre ce qui se passe dans votre situation particulière.", "لا توجد تجربة واحدة تنطبق على الجميع. يمكن للمعالج مساعدتك على فهم ما يحدث ضمن ظروفك الخاصة.")}
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
                      {localized(item.question)}
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
                        {localized(item.answer)}
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
            {ui("CONTINUE EXPLORING", "POURSUIVRE L’EXPLORATION", "استكشف المزيد")}
          </p>

          <h2 className="mx-auto mt-5 max-w-4xl text-3xl font-bold leading-tight sm:text-5xl">
            {ui("Emotional experiences can overlap and may not fit within one category.", "Les expériences émotionnelles peuvent se chevaucher et ne pas correspondre à un seul domaine.", "قد تتداخل التجارب النفسية ولا تنتمي دائمًا إلى مجال واحد.")}
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#66727a]">
            {ui("You can explore all areas of support or begin finding a therapist whose experience corresponds to your needs.", "Vous pouvez explorer tous les domaines d’accompagnement ou commencer à rechercher un thérapeute dont l’expérience correspond à vos besoins.", "يمكنك استكشاف جميع مجالات الدعم أو البدء مباشرة في العثور على معالج يتوافق مع احتياجاتك.")}
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link
              href="/support"
              className="inline-flex rounded-2xl border border-[#bda98a] px-8 py-4 font-semibold text-[#415a72] transition hover:bg-white"
            >
              {ui("View All Areas", "Voir tous les domaines", "جميع مجالات الدعم")}
            </Link>

            <Link
              href="/therapists"
              className="inline-flex rounded-2xl bg-[#415a72] px-8 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#32495f]"
            >
              {ui("Meet Our Therapists", "Découvrir nos spécialistes", "تعرّف إلى المعالجين")}
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
                {ui("You do not have to navigate this alone.", "Vous n’avez pas à traverser cela seul.", "لست مضطرًا إلى التعامل مع هذا بمفردك.")}
              </h2>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">
                {ui("Begin with a few simple steps. Answer some questions, explore available therapists, and choose a time that works for you.", "Commencez par quelques étapes simples. Répondez à quelques questions, découvrez les spécialistes disponibles et choisissez un horaire qui vous convient.", "ابدأ بخطوات بسيطة. أجب عن بعض الأسئلة، استكشف المعالجين المتاحين، واختر الموعد الذي يناسبك.")}
              </p>

              <div className="mt-10">
                <Link
                  href="/booking"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#d4be95] px-10 py-5 text-lg font-semibold text-[#223748] transition hover:-translate-y-0.5 hover:bg-[#e5d3b2]"
                >
                  {ui("Book an Online Session", "Réserver une séance en ligne", "احجز جلسة عبر الإنترنت")}
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