export const topics = [
  {
    id: "sperm-production",
    slug: "sperm-production",
    category: "reproductive-biology",
    title: { en: "How Sperm are Produced", hi: "शुक्राणु कैसे बनते हैं" },
    shortDescription: {
      en: "Learn about the continuous 64-day biological cycle of spermatogenesis inside the testes.",
      hi: "वृषण के भीतर शुक्राणुजनन (spermatogenesis) के निरंतर चलने वाले 64 दिवसीय चक्र के बारे में जानें।"
    },
    readTime: "3 min",
    difficulty: "Medium",
    whyItMatters: {
      en: "Because sperm production takes roughly 2.5 months, any lifestyle changes or exposures (like high heat or fever) may not affect your semen parameters until weeks later.",
      hi: "चूंकि शुक्राणु बनने में लगभग 2.5 महीने लगते हैं, इसलिए जीवनशैली में कोई भी बदलाव या बुखार का प्रभाव हफ्तों बाद ही आपके वीर्य में दिखाई देता है।"
    },
    sections: [
      {
        heading: { en: "The Assembly Line inside the Testes", hi: "वृषण के भीतर की असेंबली लाइन" },
        content: {
          en: "Spermatogenesis is a highly coordinated process occurring within the seminiferous tubules. Millions of cells divide and mature under hormones like Testosterone and FSH.",
          hi: "शुक्राणुजनन एक अत्यधिक समन्वित प्रक्रिया है जो वृषण की सूक्ष्म नलिकाओं (seminiferous tubules) में होती है। टेस्टोस्टेरोन और FSH जैसे हार्मोन के नियंत्रण में कोशिकाएं विभाजित और परिपक्व होती हैं।"
        }
      },
      {
        heading: { en: "The 64-Day Cycle", hi: "64 दिनों का चक्र" },
        content: {
          en: "From a stem cell to a fully wiggling sperm cell takes about 64 days. After production, they move to the epididymis for another 2-3 weeks to gain the ability to swim.",
          hi: "एक मूल कोशिका से पूर्ण गतिशील शुक्राणु बनने में लगभग 64 दिन लगते हैं। उत्पादन के बाद, वे तैरने की क्षमता हासिल करने के लिए अधिवृषण (epididymis) में 2-3 सप्ताह बिताते हैं।"
        }
      }
    ],
    keyTakeaways: [
      { en: "Spermatogenesis is continuous but slow.", hi: "शुक्राणुजनन निरंतर होता है लेकिन धीमा है।" },
      { en: "Sperm seen today were produced 2.5 months ago.", hi: "आज स्खलित शुक्राणु 2.5 महीने पहले बने थे।" }
    ],
    relatedTopics: ["what-sperm-are", "sperm-motility"],
    sources: [
      { title: "WHO Laboratory Manual for the Examination and Processing of Human Semen (6th Edition)", year: 2021 }
    ],
    tags: ["biology", "basics"]
  },
  {
    id: "what-sperm-are",
    slug: "what-sperm-are",
    category: "reproductive-biology",
    title: { en: "What Sperm Actually Are", hi: "शुक्राणु वास्तव में क्या हैं" },
    shortDescription: {
      en: "An objective biological look at the structure and genetic carrier role of the male reproductive cell.",
      hi: "पुरुष प्रजनन कोशिका की संरचना और आनुवंशिक वाहक भूमिका पर एक निष्पक्ष जैविक दृष्टिकोण।"
    },
    readTime: "2 min",
    difficulty: "Easy",
    whyItMatters: {
      en: "Understanding the cellular structure helps demystify fertility metrics like morphology (shape) and motility (movement).",
      hi: "कोशिकीय संरचना को समझने से आकृति विज्ञान (morphology) और गतिशीलता (motility) जैसे प्रजनन मेट्रिक्स को समझना आसान हो जाता है।"
    },
    sections: [
      {
        heading: { en: "Head, Midpiece, and Tail", hi: "सिर, मध्य भाग और पूंछ" },
        content: {
          en: "Each sperm cell is composed of three main parts: The Head (contains the paternal DNA and acrosome enzymes), the Midpiece (contains mitochondria for energy), and the Tail (flagellum, used to propel forward).",
          hi: "प्रत्येक शुक्राणु कोशिका के तीन मुख्य भाग होते हैं: सिर (जिसमें डीएनए और एंजाइम होते हैं), मध्य भाग (जिसमें ऊर्जा के लिए माइटोकॉन्ड्रिया होते हैं), और पूंछ (जो आगे तैरने में मदद करती है)।"
        }
      }
    ],
    keyTakeaways: [
      { en: "Sperm carry 23 chromosomes to combine with the egg.", hi: "अंडे के साथ जुड़ने के लिए शुक्राणु 23 क्रोमोसोम ले जाते हैं।" },
      { en: "Mitochondria in the midpiece fuel the sperm tail's motion.", hi: "मध्य भाग में मौजूद माइटोकॉन्ड्रिया पूंछ की गति को शक्ति प्रदान करते हैं।" }
    ],
    relatedTopics: ["sperm-production", "sperm-morphology"],
    sources: [
      { title: "Campbell Biology (12th Edition) - Animal Reproduction", year: 2020 }
    ],
    tags: ["biology", "structure"]
  },
  {
    id: "sperm-concentration",
    slug: "sperm-concentration",
    category: "reproductive-biology",
    title: { en: "Understanding Sperm Concentration", hi: "शुक्राणु एकाग्रता को समझना" },
    shortDescription: {
      en: "Decipher what 'sperm count per milliliter' means and how normal reference ranges are calculated.",
      hi: "समझें कि 'प्रति मिलीलीटर शुक्राणुओं की संख्या' का क्या अर्थ है और संदर्भ सीमाएं कैसे तय की जाती हैं।"
    },
    readTime: "3 min",
    difficulty: "Medium",
    whyItMatters: {
      en: "Concentration is one indicator of sperm production but does not independently determine overall fertility.",
      hi: "एकाग्रता शुक्राणु उत्पादन का एक संकेतक है लेकिन यह स्वतंत्र रूप से समग्र प्रजनन क्षमता का निर्धारण नहीं करती है।"
    },
    sections: [
      {
        heading: { en: "Reference Values", hi: "संदर्भ मान" },
        content: {
          en: "According to WHO guidelines, a typical sperm concentration is 15 million or more sperm per milliliter (mL) of semen. Lower values are termed 'oligozoospermia'.",
          hi: "डब्ल्यूएचओ (WHO) के दिशानिर्देशों के अनुसार, सामान्य शुक्राणु एकाग्रता 1.5 करोड़ या अधिक प्रति मिलीलीटर होती है। इससे कम मान को 'ओलिगोस्पर्मिया' कहा जाता है।"
        }
      }
    ],
    keyTakeaways: [
      { en: "15 million/mL is the lower reference limit established by WHO.", hi: "1.5 करोड़ प्रति mL डब्ल्यूएचओ द्वारा स्थापित निचली संदर्भ सीमा है।" }
    ],
    relatedTopics: ["sperm-production", "semen-analysis-intro"],
    sources: [
      { title: "WHO Semen Manual 6th Ed", year: 2021 }
    ],
    tags: ["biology", "metrics"]
  },
  {
    id: "sperm-motility",
    slug: "sperm-motility",
    category: "reproductive-biology",
    title: { en: "Understanding Sperm Motility", hi: "शुक्राणु गतिशीलता को समझना" },
    shortDescription: {
      en: "Movement matters: discover progressive vs. non-progressive motility and their clinical significance.",
      hi: "गति महत्वपूर्ण है: प्रगतिशील बनाम गैर-प्रगतिशील गतिशीलता और उनके नैदानिक महत्व के बारे में जानें।"
    },
    readTime: "3 min",
    difficulty: "Medium",
    whyItMatters: {
      en: "For fertilization, sperm must actively swim through cervical mucus to reach the egg. Motility reflects their functional capacity.",
      hi: "निषेचन के लिए, शुक्राणु को अंडे तक पहुंचने के लिए सक्रिय रूप से तैरना होगा। गतिशीलता उनकी कार्यात्मक क्षमता को दर्शाती है।"
    },
    sections: [
      {
        heading: { en: "Progressive vs. Non-Progressive", hi: "प्रगतिशील बनाम गैर-प्रगतिशील" },
        content: {
          en: "Progressive motility means sperm are swimming forward in a straight line or large circles. Non-progressive means they wiggle in place. WHO threshold for total motility is 40%, with at least 32% progressive.",
          hi: "प्रगतिशील गतिशीलता (progressive motility) का अर्थ है कि शुक्राणु सीधी रेखा या बड़े घेरे में आगे तैर रहे हैं। गैर-प्रगतिशील का अर्थ है कि वे एक ही स्थान पर हिलते हैं। कुल गतिशीलता के लिए संदर्भ सीमा 40% है।"
        }
      }
    ],
    keyTakeaways: [
      { en: "Progressive motility is crucial for reaching the egg.", hi: "अंडे तक पहुंचने के लिए प्रगतिशील गतिशीलता अत्यंत महत्वपूर्ण है।" }
    ],
    relatedTopics: ["sperm-production", "lifestyle-sperm-health"],
    sources: [
      { title: "ASRM Clinical Guidelines on Male Infertility", year: 2020 }
    ],
    tags: ["biology", "motility"]
  },
  {
    id: "sperm-morphology",
    slug: "sperm-morphology",
    category: "reproductive-biology",
    title: { en: "Understanding Sperm Morphology", hi: "शुक्राणु आकृति विज्ञान को समझना" },
    shortDescription: {
      en: "Learn how the size and shape of sperm are evaluated, and why Kruger strict criteria ranges seem low.",
      hi: "जानें कि शुक्राणु के आकार का मूल्यांकन कैसे किया जाता है और इसकी संदर्भ सीमा कम क्यों दिखती है।"
    },
    readTime: "3 min",
    difficulty: "Hard",
    whyItMatters: {
      en: "Morphology is often misunderstood because a 'typical' sample can have 96% abnormal-looking sperm and still be fertile.",
      hi: "आकृति विज्ञान को अक्सर गलत समझा जाता है क्योंकि एक सामान्य नमूने में 96% तक असामान्य दिखने वाले शुक्राणु हो सकते हैं और फिर भी वह उपजाऊ हो सकता है।"
    },
    sections: [
      {
        heading: { en: "Kruger Strict Criteria", hi: "क्रूगर सख्त मानदंड" },
        content: {
          en: "Under strict evaluation, a sperm cell must have a perfect oval head, normal acrosome cap, and straight tail. The WHO lower reference limit is just 4% normal forms.",
          hi: "सख्त मूल्यांकन के तहत, केवल पूर्ण अंडाकार सिर और सीधी पूंछ वाले शुक्राणुओं को सामान्य माना जाता है। डब्ल्यूएचओ (WHO) के अनुसार केवल 4% सामान्य रूप होना ही पर्याप्त है।"
        }
      }
    ],
    keyTakeaways: [
      { en: "Having only 4% normal forms is clinically typical.", hi: "केवल 4% सामान्य रूप होना चिकित्सकीय रूप से सामान्य माना जाता है।" }
    ],
    relatedTopics: ["what-sperm-are", "fertility-testing"],
    sources: [
      { title: "Kruger Strict Criteria Evaluation Guidelines", year: 2018 }
    ],
    tags: ["biology", "morphology"]
  },
  {
    id: "sleep-sperm-health",
    slug: "sleep-sperm-health",
    category: "lifestyle-sperm-health",
    title: { en: "Sleep & Sperm Quality", hi: "नींद और शुक्राणु गुणवत्ता" },
    shortDescription: {
      en: "Discover how sleep duration and circadian rhythm disruptions can influence hormonal and sperm parameters.",
      hi: "जानें कि नींद की अवधि और सर्केडियन रिदम में व्यवधान हार्मोन और शुक्राणु मापदंडों को कैसे प्रभावित कर सकते हैं।"
    },
    readTime: "3 min",
    difficulty: "Easy",
    whyItMatters: {
      en: "Sleep is relevant to overall metabolic and hormonal stability. Poor sleep has been associated with changes in testosterone levels.",
      hi: "नींद समग्र चयापचय और हार्मोनल स्थिरता के लिए प्रासंगिक है। खराब नींद टेस्टोस्टेरोन के स्तर में गिरावट से जुड़ी हो सकती है।"
    },
    sections: [
      {
        heading: { en: "The Circadian Rhythm", hi: "सर्केडियन रिदम और हार्मोन" },
        content: {
          en: "Testosterone release peaks during deep sleep. Disruptions, late nights, or sleeping less than 6 hours are associated with variations in testosterone and lower sperm concentration.",
          hi: "गहरी नींद के दौरान टेस्टोस्टेरोन का स्राव सबसे अधिक होता है। रात में देर तक जागना या 6 घंटे से कम सोना टेस्टोस्टेरोन और शुक्राणु की संख्या को प्रभावित कर सकता है।"
        }
      }
    ],
    keyTakeaways: [
      { en: "Aim for 7-8 hours of uninterrupted sleep.", hi: "7-8 घंटे की निर्बाध नींद लेने का प्रयास करें।" },
      { en: "Testosterone production is deeply linked to circadian stability.", hi: "टेस्टोस्टेरोन उत्पादन सर्केडियन स्थिरता से गहराई से जुड़ा हुआ है।" }
    ],
    relatedTopics: ["sperm-production", "stress-wellbeing"],
    sources: [
      { title: "Sleep Medicine Reviews - Sleep and Male Reproduction", year: 2019 }
    ],
    tags: ["lifestyle", "sleep"]
  },
  {
    id: "nutrition-sperm-health",
    slug: "nutrition-sperm-health",
    category: "lifestyle-sperm-health",
    title: { en: "Nutrition & Sperm Health", hi: "आहार, पोषण और शुक्राणु स्वास्थ्य" },
    shortDescription: {
      en: "How antioxidants, zinc, and dietary patterns support cellular integrity and combat oxidative stress.",
      hi: "एंटीऑक्सीडेंट, जिंक और स्वस्थ आहार पैटर्न कैसे कोशिकीय स्वास्थ्य का समर्थन करते हैं।"
    },
    readTime: "3 min",
    difficulty: "Easy",
    whyItMatters: {
      en: "Sperm cell membranes are highly rich in polyunsaturated fatty acids, making them sensitive to oxidative damage from a poor diet.",
      hi: "शुक्र कोशिकाओं की बाहरी झिल्ली संवेदनशील होती है, जिससे वे खराब आहार से होने वाले नुकसान के प्रति अतिसंवेदनशील हो जाती हैं।"
    },
    sections: [
      {
        heading: { en: "Antioxidants and Micronutrients", hi: "एंटीऑक्सीडेंट और सूक्ष्म पोषक तत्व" },
        content: {
          en: "Antioxidants like Vitamin C, E, Zinc, and Selenium neutralize free radicals. Balanced dietary patterns like Mediterranean or local whole-grain diets show positive associations with concentration and motility.",
          hi: "विटामिन सी, ई, जिंक और सेलेनियम जैसे एंटीऑक्सीडेंट मुक्त कणों (free radicals) को बेअसर करते हैं। संतुलित आहार शुक्राणु की संख्या में सुधार से जुड़ा हुआ है।"
        }
      }
    ],
    keyTakeaways: [
      { en: "Antioxidants protect sperm from cellular damage.", hi: "एंटीऑक्सीडेंट शुक्राणु को कोशिकीय क्षति से बचाते हैं।" }
    ],
    relatedTopics: ["lifestyle-sperm-health", "sperm-morphology"],
    sources: [
      { title: "Human Reproduction Update - Diet and Male Fertility", year: 2017 }
    ],
    tags: ["lifestyle", "nutrition"]
  },
  {
    id: "smoking-sperm-health",
    slug: "smoking-sperm-health",
    category: "lifestyle-sperm-health",
    title: { en: "Smoking & Reproductive Health", hi: "धूम्रपान और प्रजनन स्वास्थ्य" },
    shortDescription: {
      en: "The biological effects of nicotine and toxins on sperm DNA fragmentation and concentration.",
      hi: "शुक्राणु डीएनए विखंडन (DNA fragmentation) और एकाग्रता पर निकोटीन और विषाक्त पदार्थों के जैविक प्रभाव।"
    },
    readTime: "3 min",
    difficulty: "Medium",
    whyItMatters: {
      en: "Smoking introduces heavy metals and free radicals into the bloodstream, which is associated with increased sperm DNA damage.",
      hi: "धूम्रपान रक्तप्रवाह में भारी धातुओं और मुक्त कणों को पहुंचाता है, जो शुक्राणु डीएनए क्षति में वृद्धि से जुड़ा है।"
    },
    sections: [
      {
        heading: { en: "DNA Fragmentation", hi: "डीएनए विखंडन (DNA Fragmentation)" },
        content: {
          en: "Toxins in cigarette smoke damage the genetic material carried by sperm. Even if count and motility appear normal, high DNA fragmentation can impact conception timelines.",
          hi: "सिगरेट के धुएं में मौजूद विषाक्त पदार्थ शुक्राणु द्वारा ले जाने वाली आनुवंशिक सामग्री को नुकसान पहुंचाते हैं। इसे डीएनए विखंडन कहा जाता है।"
        }
      }
    ],
    keyTakeaways: [
      { en: "Smoking is associated with lower sperm concentration and motility.", hi: "धूम्रपान कम शुक्राणु एकाग्रता और गतिशीलता से जुड़ा है।" }
    ],
    relatedTopics: ["lifestyle-sperm-health", "fertility-testing"],
    sources: [
      { title: "European Urology - Association of Smoking and Semen Quality", year: 2016 }
    ],
    tags: ["lifestyle", "smoking"]
  },
  {
    id: "alcohol-sperm-health",
    slug: "alcohol-sperm-health",
    category: "lifestyle-sperm-health",
    title: { en: "Alcohol & Reproductive Quality", hi: "अल्कोहल और प्रजनन गुणवत्ता" },
    shortDescription: {
      en: "How moderate to high alcohol intake affects testosterone metabolism and semen parameters.",
      hi: "मध्यम से उच्च अल्कोहल सेवन टेस्टोस्टेरोन चयापचय और वीर्य मापदंडों को कैसे प्रभावित करता है।"
    },
    readTime: "3 min",
    difficulty: "Medium",
    whyItMatters: {
      en: "Excessive alcohol consumption can affect liver function, which in turn influences hormone balance and sperm production.",
      hi: "अत्यधिक अल्कोहल का सेवन लीवर के कार्य को प्रभावित कर सकता है, जो अंततः हार्मोन संतुलन और शुक्राणु उत्पादन को प्रभावित करता है।"
    },
    sections: [
      {
        heading: { en: "Hormonal Disruptions", hi: "हार्मोनल असंतुलन" },
        content: {
          en: "Chronic heavy drinking is associated with lower testosterone levels, increased estrogen production, and reduced sperm concentration and progressive motility.",
          hi: "लगातार भारी शराब पीने से टेस्टोस्टेरोन के स्तर में गिरावट, एस्ट्रोजन में वृद्धि और शुक्राणु की गुणवत्ता में कमी देखी गई है।"
        }
      }
    ],
    keyTakeaways: [
      { en: "Heavy drinking may affect sperm shape and count.", hi: "भारी शराब पीने से शुक्राणु के आकार और संख्या पर असर पड़ सकता है।" }
    ],
    relatedTopics: ["lifestyle-sperm-health", "sperm-production"],
    sources: [
      { title: "BMJ Open - Alcohol Consumption and Semen Quality", year: 2014 }
    ],
    tags: ["lifestyle", "alcohol"]
  },
  {
    id: "heat-exposure-sperm-health",
    slug: "heat-exposure-sperm-health",
    category: "lifestyle-sperm-health",
    title: { en: "Heat Exposure & Scrotal Temperature", hi: "गर्मी का प्रभाव और अंडकोश का तापमान" },
    shortDescription: {
      en: "Why the testes are located outside the body and how laptop heat, saunas, and tight clothing impact biology.",
      hi: "वृषण शरीर के बाहर क्यों स्थित हैं और लैपटॉप की गर्मी, सौना व तंग कपड़े जैविक रूप से कैसे प्रभाव डालते हैं।"
    },
    readTime: "3 min",
    difficulty: "Medium",
    whyItMatters: {
      en: "Sperm production requires a temperature that is 1 to 2 degrees Celsius cooler than the core body temperature.",
      hi: "शुक्राणु उत्पादन के लिए शरीर के मुख्य तापमान से 1 से 2 डिग्री सेल्सियस कम तापमान की आवश्यकता होती है।"
    },
    sections: [
      {
        heading: { en: "The Cooler Zone", hi: "शीतलन क्षेत्र" },
        content: {
          en: "Excess heat (from hot baths, saunas, keeping laptops directly on the lap, or working in high-temperature environments) halts sperm production temporarily. Because of the 64-day cycle, recovery can take months.",
          hi: "अत्यधिक गर्मी (गर्म पानी से स्नान, सौना, लैपटॉप को सीधे गोद में रखना या गर्म वातावरण में काम करना) शुक्राणु उत्पादन को अस्थायी रूप से रोक देता है।"
        }
      }
    ],
    keyTakeaways: [
      { en: "Keep laptops off the lap and avoid tight garments.", hi: "लैपटॉप को गोद से दूर रखें और तंग वस्त्रों से बचें।" }
    ],
    relatedTopics: ["sperm-production", "lifestyle-sperm-health"],
    sources: [
      { title: "Journal of Andrology - Scrotal Temperature and Semen Parameters", year: 2012 }
    ],
    tags: ["lifestyle", "heat"]
  },
  {
    id: "sedentary-lifestyle",
    slug: "sedentary-lifestyle",
    category: "lifestyle-sperm-health",
    title: { en: "Sedentary Routine & Screen Time", hi: "गतिहीन दिनचर्या और स्क्रीन टाइम" },
    shortDescription: {
      en: "How prolonged sitting and physical inactivity affect pelvic blood flow and metabolic markers.",
      hi: "लंबे समय तक बैठने और शारीरिक निष्क्रियता श्रोणि रक्त प्रवाह (pelvic blood flow) को कैसे प्रभावित करते हैं।"
    },
    readTime: "2 min",
    difficulty: "Easy",
    whyItMatters: {
      en: "Prolonged sitting (e.g. desk jobs, long drives) combines scrotal warming with decreased physical movement, affecting parameters.",
      hi: "लंबे समय तक बैठना अंडकोश को गर्म करने के साथ-साथ शारीरिक गतिविधि को कम करता है, जो शुक्राणु को प्रभावित कर सकता है।"
    },
    sections: [
      {
        heading: { en: "Pelvic Stagnation and Warmth", hi: "पेल्विक क्षेत्र में गर्मी और निष्क्रियता" },
        content: {
          en: "Sitting for more than 6-8 hours daily raises scrotal temperature and is associated with lower sperm concentration. Incorporating small walking breaks helps restore blood flow.",
          hi: "रोजाना 6-8 घंटे से अधिक बैठने से अंडकोश का तापमान बढ़ता है। छोटे चलने वाले ब्रेक लेने से रक्त प्रवाह वापस ठीक होता है।"
        }
      }
    ],
    keyTakeaways: [
      { en: "Stand and walk for 5 minutes every hour.", hi: "हर घंटे में 5 मिनट के लिए खड़े हों और चलें।" }
    ],
    relatedTopics: ["heat-exposure-sperm-health", "lifestyle-sperm-health"],
    sources: [
      { title: "American Journal of Epidemiology - Sedentary Behavior and Semen Quality", year: 2013 }
    ],
    tags: ["lifestyle", "movement"]
  },
  {
    id: "libido-wellness",
    slug: "libido-wellness",
    category: "sexual-reproductive-health",
    title: { en: "Understanding Libido", hi: "कामेच्छा (Libido) को समझना" },
    shortDescription: {
      en: "An objective look at sexual drive, hormones, and how psychological and metabolic factors interact.",
      hi: "यौन इच्छा, हार्मोन और मनोवैज्ञानिक व चयापचय कारकों के अंतर्संबंध पर एक निष्पक्ष दृष्टिकोण।"
    },
    readTime: "3 min",
    difficulty: "Easy",
    whyItMatters: {
      en: "Fluctuations in libido are common and usually reflect sleep quality, stress levels, and metabolic wellness rather than reproductive issues.",
      hi: "कामेच्छा में उतार-चढ़ाव आम हैं और आमतौर पर नींद, तनाव और चयापचय कल्याण को दर्शाते हैं न कि प्रजनन क्षमता की कमी को।"
    },
    sections: [
      {
        heading: { en: "Hormones and Stress", hi: "हार्मोन और तनाव का प्रभाव" },
        content: {
          en: "While testosterone regulates drive, elevated stress hormones (cortisol) suppress it. Mental fatigue and relationship dynamics are key contributors to libido variance.",
          hi: "यद्यपि टेस्टोस्टेरोन कामेच्छा को नियंत्रित करता है, बढ़ा हुआ कोर्टिसोल (तनाव हार्मोन) इसे दबा देता है। मानसिक थकान इसमें प्रमुख भूमिका निभाती है।"
        }
      }
    ],
    keyTakeaways: [
      { en: "Libido variance is typical and highly responsive to rest.", hi: "कामेच्छा में बदलाव सामान्य है और यह विश्राम के प्रति अत्यधिक संवेदनशील है।" }
    ],
    relatedTopics: ["stress-wellbeing", "performance-anxiety-wellness"],
    sources: [
      { title: "Journal of Sexual Medicine - Hormones and Male Sexual Drive", year: 2018 }
    ],
    tags: ["sexual-health", "wellbeing"]
  },
  {
    id: "erectile-difficulties",
    slug: "erectile-difficulties",
    category: "sexual-reproductive-health",
    title: { en: "Erectile Function & Wellness", hi: "स्तंभन कार्य और स्वास्थ्य" },
    shortDescription: {
      en: "Demystify erection mechanics and how cardiovascular health and anxiety influence performance.",
      hi: "स्तंभन की कार्यप्रणाली को समझें और जानें कि हृदय स्वास्थ्य व चिंता प्रदर्शन को कैसे प्रभावित करते हैं।"
    },
    readTime: "3 min",
    difficulty: "Medium",
    whyItMatters: {
      en: "Erection relies on healthy blood flow. Occasional difficulties are common and often stem from performance anxiety or exhaustion.",
      hi: "स्तंभन स्वस्थ रक्त प्रवाह पर निर्भर करता है। कभी-कभार होने वाली कठिनाइयाँ आम हैं और अक्सर चिंता या थकावट के कारण होती हैं।"
    },
    sections: [
      {
        heading: { en: "Blood Flow and Anxiety", hi: "रक्त प्रवाह और चिंता" },
        content: {
          en: "Occasional erectile difficulties can happen to anyone. Chronic concerns can be associated with early cardiovascular changes or psychological pressure. Performance anxiety acts as a neurological switch that inhibits blood flow.",
          hi: "कभी-कभार होने वाली स्तंभन कठिनाइयाँ किसी के साथ भी हो सकती हैं। प्रदर्शन संबंधी चिंता एक तंत्रिका संबंधी अवरोध पैदा करती है जो रक्त प्रवाह को रोकती है।"
        }
      }
    ],
    keyTakeaways: [
      { en: "Occasional difficulties are clinically typical.", hi: "कभी-कभार कठिनाइयाँ होना चिकित्सकीय रूप से सामान्य है।" }
    ],
    relatedTopics: ["performance-anxiety-wellness", "professional-evaluation"],
    sources: [
      { title: "Guidelines of the European Association of Urology on Sexual Medicine", year: 2021 }
    ],
    tags: ["sexual-health", "erectile-function"]
  },
  {
    id: "professional-evaluation",
    slug: "professional-evaluation",
    category: "sexual-reproductive-health",
    title: { en: "When to Talk to a Specialist", hi: "विशेषज्ञ से कब बात करें" },
    shortDescription: {
      en: "Guidelines on when to seek professional consultation rather than searching online.",
      hi: "ऑनलाइन खोजने के बजाय पेशेवर परामर्श लेने के समय के बारे में दिशानिर्देश।"
    },
    readTime: "2 min",
    difficulty: "Easy",
    whyItMatters: {
      en: "Understanding clinical timelines (e.g. trying to conceive duration) helps reduce unnecessary stress and guides timely support.",
      hi: "नैदानिक समयसीमा को समझने से अनावश्यक तनाव कम होता है और समय पर सहायता प्राप्त करने में मदद मिलती है।"
    },
    sections: [
      {
        heading: { en: "Clinical Timelines", hi: "नैदानिक समय सीमा" },
        content: {
          en: "Professional evaluation is generally recommended if there is: (1) Inability to conceive after 12 months of unprotected regular intercourse (or 6 months if age > 35), (2) Persistent sexual difficulties, or (3) Scrotal pain or structural abnormalities.",
          hi: "पेशेवर मूल्यांकन की सलाह आमतौर पर तब दी जाती है जब: (1) 12 महीने के नियमित प्रयास के बाद भी गर्भधारण न हुआ हो, (2) लगातार यौन कठिनाइयां बनी हुई हों।"
        }
      }
    ],
    keyTakeaways: [
      { en: "A specialist (Andrologist/Urologist) provides definitive care.", hi: "एक विशेषज्ञ (एंड्रोलॉजिस्ट/यू्रोलॉजिस्ट) निश्चित मार्गदर्शन प्रदान कर सकता है।" }
    ],
    relatedTopics: ["fertility-testing", "semen-analysis-limitations"],
    sources: [
      { title: "WHO Guidelines on Investigation of the Infertile Couple", year: 2019 }
    ],
    tags: ["specialist", "guidance"]
  },
  {
    id: "stress-wellbeing",
    slug: "stress-wellbeing",
    category: "mind-wellbeing",
    title: { en: "Stress & Sperm Quality", hi: "तनाव और शुक्राणु गुणवत्ता" },
    shortDescription: {
      en: "How high cortisol levels impact testosterone synthesis and semen parameters.",
      hi: "कोर्टिसोल का उच्च स्तर टेस्टोस्टेरोन संश्लेषण और वीर्य मापदंडों को कैसे प्रभावित करता है।"
    },
    readTime: "3 min",
    difficulty: "Easy",
    whyItMatters: {
      en: "Chronic mental stress triggers cortisol release, which acts as a physiological signal to downregulate non-essential functions like sperm production.",
      hi: "क्रोनिक मानसिक तनाव कोर्टिसोल जारी करता है, जो शुक्राणु उत्पादन जैसी कम आवश्यक कार्यों को अस्थायी रूप से धीमा कर देता है।"
    },
    sections: [
      {
        heading: { en: "The Cortisol-Testosterone Axis", hi: "कोर्टिसोल-टेस्टोस्टेरोन अक्ष" },
        content: {
          en: "High cortisol directly inhibits Leydig cells in the testes, lowering testosterone output. Studies show associations between high stress (work pressure, life events) and reduced progressive motility.",
          hi: "उच्च कोर्टिसोल सीधे वृषण में टेस्टोस्टेरोन उत्पादन को रोकता है। अत्यधिक तनाव प्रगतिशील गतिशीलता में कमी से जुड़ा हुआ है।"
        }
      }
    ],
    keyTakeaways: [
      { en: "Manage chronic stress to support hormonal stability.", hi: "हार्मोनल स्थिरता का समर्थन करने के लिए क्रोनिक तनाव को प्रबंधित करें।" }
    ],
    relatedTopics: ["sleep-sperm-health", "mind-wellbeing"],
    sources: [
      { title: "Fertility and Sterility - Stress and Semen Quality", year: 2018 }
    ],
    tags: ["mind", "stress"]
  },
  {
    id: "performance-anxiety-wellness",
    slug: "performance-anxiety-wellness",
    category: "mind-wellbeing",
    title: { en: "Performance Anxiety & Erection", hi: "प्रदर्शन की चिंता (Performance Anxiety) और स्तंभन" },
    shortDescription: {
      en: "Understand the fight-or-flight neurology that blocks erectile function, and how to manage it.",
      hi: "स्तंभन कार्य को अवरुद्ध करने वाली फाइट-ऑर-फ्लाइट न्यूरोलॉजी को समझें और इसे प्रबंधित करने के उपाय जानें।"
    },
    readTime: "3 min",
    difficulty: "Medium",
    whyItMatters: {
      en: "Performance anxiety is a highly common psychological trigger that inhibits the parasympathetic nervous system needed for erection.",
      hi: "प्रदर्शन की चिंता एक बहुत ही सामान्य मनोवैज्ञानिक ट्रिगर है जो स्तंभन के लिए आवश्यक पैरासिम्पेथेटिक तंत्रिका तंत्र को रोकता है।"
    },
    sections: [
      {
        heading: { en: "The Adrenaline Switch", hi: "एड्रेनालाईन स्विच" },
        content: {
          en: "When you feel anxious, your body releases adrenaline, constricting blood vessels and redirecting blood away from the pelvis. Recognizing this as a normal physiological reaction helps reduce pressure and resolve symptoms.",
          hi: "जब आप चिंतित महसूस करते हैं, तो आपका शरीर एड्रेनालाईन छोड़ता है, जिससे रक्त वाहिकाएं सिकुड़ जाती हैं और रक्त पेल्विक क्षेत्र से दूर चला जाता है।"
        }
      }
    ],
    keyTakeaways: [
      { en: "Anxiety triggers adrenaline, which inhibits erectile mechanics.", hi: "चिंता एड्रेनालाईन को ट्रिगर करती है, जो स्तंभन की कार्यप्रणाली को रोकती है।" }
    ],
    relatedTopics: ["erectile-difficulties", "libido-wellness"],
    sources: [
      { title: "Journal of Sex & Marital Therapy - Performance Anxiety Diagnostics", year: 2017 }
    ],
    tags: ["mind", "anxiety"]
  },
  {
    id: "semen-analysis-intro",
    slug: "semen-analysis-intro",
    category: "fertility-testing",
    title: { en: "What is a Semen Analysis?", hi: "वीर्य विश्लेषण (Semen Analysis) क्या है?" },
    shortDescription: {
      en: "Demystify the standard laboratory assessment of semen fluid and cellular parameters.",
      hi: "वीर्य तरल और कोशिकीय मापदंडों के मानक प्रयोगशाला मूल्यांकन को समझें।"
    },
    readTime: "3 min",
    difficulty: "Easy",
    whyItMatters: {
      en: "Semen analysis provides valuable baseline metrics but is only one component of fertility evaluation.",
      hi: "वीर्य विश्लेषण मूल्यवान आधारभूत मेट्रिक्स प्रदान करता है लेकिन यह प्रजनन क्षमता मूल्यांकन का केवल एक हिस्सा है।"
    },
    sections: [
      {
        heading: { en: "Standard Parameters Checked", hi: "जांचे जाने वाले मानक पैरामीटर" },
        content: {
          en: "A lab technician evaluates semen volume, pH, sperm concentration (count), progressive motility (swimming), and morphology (shape) under a microscope.",
          hi: "एक लैब तकनीशियन वीर्य की मात्रा, पीएच (pH), शुक्राणु एकाग्रता (संख्या), प्रगतिशील गतिशीलता (तैरना) और आकारिकी (आकार) का मूल्यांकन करता है।"
        }
      }
    ],
    keyTakeaways: [
      { en: "It measures multiple parameters, not just count.", hi: "यह केवल संख्या ही नहीं, बल्कि कई मापदंडों को मापता है।" }
    ],
    relatedTopics: ["semen-analysis-capabilities", "semen-analysis-limitations"],
    sources: [
      { title: "WHO Laboratory Manual for Semen Analysis", year: 2021 }
    ],
    tags: ["testing", "basics"]
  },
  {
    id: "semen-analysis-capabilities",
    slug: "semen-analysis-capabilities",
    category: "fertility-testing",
    title: { en: "What Semen Analysis Can Tell You", hi: "वीर्य विश्लेषण से क्या पता चलता है" },
    shortDescription: {
      en: "Discover how parameters highlight sperm production, motility, and pathway patency.",
      hi: "जानें कि पैरामीटर शुक्राणु उत्पादन, गतिशीलता और मार्ग की रुकावटों को कैसे दर्शाते हैं।"
    },
    readTime: "2 min",
    difficulty: "Easy",
    whyItMatters: {
      en: "It helps doctors identify clear structural trends or baseline factors that might affect conception timeline.",
      hi: "यह डॉक्टरों को स्पष्ट संरचनात्मक प्रवृत्तियों या आधारभूत कारकों की पहचान करने में मदद करता है।"
    },
    sections: [
      {
        heading: { en: "The Positive Value", hi: "सकारात्मक महत्व" },
        content: {
          en: "It can confirm the presence of viable sperm, show if parameters meet WHO standard reference limits, and verify the success of a vasectomy procedure.",
          hi: "यह व्यवहार्य शुक्राणुओं की उपस्थिति की पुष्टि कर सकता है, दिखा सकता है कि क्या पैरामीटर मानक सीमाओं को पूरा करते हैं।"
        }
      }
    ],
    keyTakeaways: [
      { en: "Useful baseline diagnostic indicator.", hi: "उपयोगी आधारभूत नैदानिक संकेतक है।" }
    ],
    relatedTopics: ["semen-analysis-intro", "semen-analysis-limitations"],
    sources: [
      { title: "American Urological Association - Male Infertility Guidelines", year: 2020 }
    ],
    tags: ["testing", "capabilities"]
  },
  {
    id: "semen-analysis-limitations",
    slug: "semen-analysis-limitations",
    category: "fertility-testing",
    title: { en: "What Semen Analysis Cannot Tell You", hi: "वीर्य विश्लेषण की सीमाएं" },
    shortDescription: {
      en: "Understand why semen analysis is not a direct measure of fertility or conception success.",
      hi: "समझें कि वीर्य विश्लेषण प्रजनन क्षमता या गर्भधारण की सफलता का प्रत्यक्ष माप क्यों नहीं है।"
    },
    readTime: "3 min",
    difficulty: "Medium",
    whyItMatters: {
      en: "A semen analysis assesses sperm cells, but cannot check egg parameters, genetic binding, or fallopian tube patency.",
      hi: "वीर्य विश्लेषण शुक्राणु कोशिकाओं का आकलन करता है, लेकिन अंडे के मापदंडों या अन्य आनुवंशिक कारकों की जांच नहीं कर सकता।"
    },
    sections: [
      {
        heading: { en: "Limits of the Microscope", hi: "माइक्रोस्कोप की सीमाएं" },
        content: {
          en: "A semen test cannot guarantee fertility, as many men with low parameters still conceive naturally, and vice-versa. It does not measure DNA fragmentation, sperm-egg binding ability, or female fertility variables.",
          hi: "एक वीर्य परीक्षण प्रजनन क्षमता की गारंटी नहीं दे सकता है, क्योंकि कम पैरामीटर वाले कई पुरुष भी स्वाभाविक रूप से गर्भधारण कर लेते हैं।"
        }
      }
    ],
    keyTakeaways: [
      { en: "It is a snapshot of sperm cells, not a fertility guarantee.", hi: "यह शुक्राणु कोशिकाओं का एक स्नैपशॉट है, प्रजनन क्षमता की गारंटी नहीं।" }
    ],
    relatedTopics: ["semen-analysis-intro", "single-test-variation"],
    sources: [
      { title: "Reproductive Biology and Endocrinology - Limits of Semen Analysis", year: 2015 }
    ],
    tags: ["testing", "limitations"]
  },
  {
    id: "single-test-variation",
    slug: "single-test-variation",
    category: "fertility-testing",
    title: { en: "Why One Semen Result Varies", hi: "एक वीर्य विश्लेषण परिणाम क्यों बदलता रहता है" },
    shortDescription: {
      en: "Explore the physiological reasons behind fluctuating sperm counts and parameters.",
      hi: "शुक्राणु की संख्या और मापदंडों में उतार-चढ़ाव के पीछे के शारीरिक कारणों का पता लगाएं।"
    },
    readTime: "3 min",
    difficulty: "Medium",
    whyItMatters: {
      en: "Fluctuations are natural. Stressing over a single abnormal result is premature without follow-up baseline confirmation.",
      hi: "उतार-चढ़ाव होना प्राकृतिक है। अनुवर्ती पुष्टि के बिना एक असामान्य परिणाम पर तनाव लेना जल्दबाजी होगी।"
    },
    sections: [
      {
        heading: { en: "Factors Causing Variance", hi: "अंतर पैदा करने वाले कारक" },
        content: {
          en: "Sperm parameters are affected by abstinence time (days since last ejaculation), recent illnesses or fevers (even a cold 2 months ago), medications, stress, and slight lab collection variations.",
          hi: "शुक्राणु मापदंड पिछले स्खलन के बाद के दिनों, हाल के बुखार, दवाओं और तनाव से प्रभावित होते हैं।"
        }
      }
    ],
    keyTakeaways: [
      { en: "Always repeat the test in 2-3 weeks to confirm baseline.", hi: "आधार रेखा की पुष्टि के लिए हमेशा 2-3 सप्ताह में परीक्षण दोहराएं।" }
    ],
    relatedTopics: ["semen-analysis-intro", "semen-analysis-limitations"],
    sources: [
      { title: "Fertility and Sterility - Intra-individual variation in semen parameters", year: 2016 }
    ],
    tags: ["testing", "variation"]
  }
];
