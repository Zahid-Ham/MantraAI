"""Authored 12-Week Action Plan Step Library for the 90-Day Cycle Plan.

CLINICIAN_REVIEW_REQUIRED = True
================================
Evidence-based weekly habit increments for modifiable reproductive and lifestyle factors.
Spermatogenesis takes approximately 72 to 90 days (about 2.5 months).
All steps are incremental, non-prescriptive, and never promise fertility outcomes or clinical cure.

Verified Contacts:
- National Tobacco Quitline (Ministry of Health & Family Welfare, Govt. of India): 1800-11-2356
"""

from typing import Dict, Any, List

CLINICIAN_REVIEW_REQUIRED: bool = True

SPERMATOGENESIS_RATIONALE_EN = (
    "Human sperm development (spermatogenesis) takes roughly 72 to 90 days (about 2.5 to 3 months). "
    "Lifestyle, heat, and behavioral adjustments implemented today support the cellular environment "
    "for sperm cells maturing over the next 90 days. This plan provides progressive, non-clinical habit steps."
)

SPERMATOGENESIS_RATIONALE_HI = (
    "शुक्राणु निर्माण चक्र (sपरमेटोजेनेसिस) में लगभग 72 से 90 दिन (लगभग 2.5 से 3 महीने) का समय लगता है। "
    "आज किए गए जीवनशैली और व्यवहार परिवर्तन अगले 90 दिनों में परिपक्व होने वाले शुक्राणुओं के लिए अनुकूल वातावरण बनाते हैं।"
)

# 12-week progressive ladders for each modifiable factor
FACTOR_ACTION_LADDERS: Dict[str, Dict[str, Any]] = {
    "tobacco": {
        "title_en": "Tobacco & Nicotine Reduction",
        "title_hi": "तंबाकू और निकोटीन में कमी",
        "category": "lifestyle",
        "quitline": "1800-11-2356 (National Tobacco Quitline, MoHFW)",
        "weeks": [
            {"week": 1, "en": "Log every cigarette/beedi or pouch consumed this week without judgment.", "hi": "इस सप्ताह उपयोग की गई प्रत्येक सिगरेट/बीड़ी या पाउच को बिना किसी तनाव के नोट करें।"},
            {"week": 2, "en": "Identify your top 2 daily smoking triggers (e.g., after meals, work breaks).", "hi": "धूम्रपान की अपनी 2 मुख्य वजहों (जैसे भोजन के बाद, ब्रेक के दौरान) की पहचान करें।"},
            {"week": 3, "en": "Delay your first smoke of the day by 30 to 45 minutes.", "hi": "दिन की पहली सिगरेट को 30 से 45 मिनट के लिए टालें।"},
            {"week": 4, "en": "Reduce daily consumption by 20% compared to baseline week.", "hi": "दैनिक सिगरेट की संख्या में 20% की कमी करें।"},
            {"week": 5, "en": "Replace one habitual smoking break with a brisk 5-minute walk or water.", "hi": "एक बार के धूम्रपान ब्रेक की जगह 5 मिनट की तेज सैर या पानी का उपयोग करें।"},
            {"week": 6, "en": "Call the National Tobacco Quitline (1800-11-2356) for free cessation guidance.", "hi": "मुफ्त परामर्श के लिए राष्ट्रीय तंबाकू क्विटलाइन (1800-11-2356) पर कॉल करें।"},
            {"week": 7, "en": "Designate your home and personal vehicle as completely smoke-free zones.", "hi": "अपने घर और वाहन को पूरी तरह धूम्रपान-मुक्त क्षेत्र बनाएं।"},
            {"week": 8, "en": "Reduce daily cigarette/nicotine count by 50% from baseline.", "hi": "दैनिक सिगरेट की संख्या को शुरुआती स्तर से 50% तक कम करें।"},
            {"week": 9, "en": "Practice 3-minute diaphragmatic breathing when sudden cravings emerge.", "hi": "अचानक तलब लगने पर 3 मिनट का गहरा श्वास व्यायाम करें।"},
            {"week": 10, "en": "Identify high-risk social events and plan smoke-free alternative beverages.", "hi": "धूम्रपान के लिए प्रेरित करने वाले सामाजिक मौकों के लिए पहले से योजना बनाएं।"},
            {"week": 11, "en": "Attempt a continuous 48-hour completely smoke-free period.", "hi": "लगातार 48 घंटे तक पूरी तरह धुआं-मुक्त रहने का प्रयास करें।"},
            {"week": 12, "en": "Evaluate 90-day reduction progress and discuss clinical cessation aids with a doctor.", "hi": "90-दिवसीय प्रगति का मूल्यांकन करें और डॉक्टर से परामर्श लें।"},
        ]
    },
    "alcohol": {
        "title_en": "Alcohol Moderation",
        "title_hi": "शराब के सेवन में कमी",
        "category": "lifestyle",
        "weeks": [
            {"week": 1, "en": "Record all alcoholic drinks and portion sizes over 7 days.", "hi": "7 दिनों के दौरान सभी पेय और उनकी मात्रा को डायरी में दर्ज करें।"},
            {"week": 2, "en": "Designate at least 3 consecutive days this week as alcohol-free.", "hi": "इस सप्ताह लगातार कम से कम 3 दिन शराब-मुक्त रखें।"},
            {"week": 3, "en": "Drink a full glass of water between every alcoholic beverage.", "hi": "प्रत्येक पेय के बाद एक पूरा गिलास पानी पिएं।"},
            {"week": 4, "en": "Cap weekend alcohol intake to no more than 2 standard units per day.", "hi": "सप्ताहांत में शराब की मात्रा प्रति दिन 2 मानक यूनिट से अधिक न रखें।"},
            {"week": 5, "en": "Switch to non-alcoholic substitutes (sparkling water, lime) on weekday evenings.", "hi": "सप्ताह के दिनों में गैर-अल्कोहलिक पेय पदार्थों का विकल्प चुनें।"},
            {"week": 6, "en": "Avoid binge drinking (>4 drinks in one sitting) to protect testicular Leydig cell function.", "hi": "अत्यधिक मात्रा में पीने (एक बार में 4+ ड्रिंक) से पूरी तरह बचें।"},
            {"week": 7, "en": "Increase alcohol-free days to 4 days per week.", "hi": "शराब-मुक्त दिनों की संख्या बढ़ाकर प्रति सप्ताह 4 दिन करें।"},
            {"week": 8, "en": "Notice and record improvements in morning sleep quality and morning energy.", "hi": "सुबह की ऊर्जा और नींद की गुणवत्ता में आए सुधार को नोट करें।"},
            {"week": 9, "en": "Remove alcoholic beverages from easy reach at home.", "hi": "घर पर शराब को आसानी से मिलने वाली जगह से हटाएं।"},
            {"week": 10, "en": "Maintain a full 7-day completely alcohol-free week.", "hi": "पूरा एक सप्ताह पूरी तरह शराब-मुक्त रखें।"},
            {"week": 11, "en": "Plan social outings around activities (sports, dining) rather than alcohol.", "hi": "सामाजिक मुलाकातों को शराब के बजाय खेल या अन्य गतिविधियों के आसपास केंद्रित करें।"},
            {"week": 12, "en": "Reflect on baseline vs 90-day alcohol intake and discuss with a clinician.", "hi": "90 दिनों की प्रगति की समीक्षा करें और डॉक्टर से चर्चा करें।"},
        ]
    },
    "sleep": {
        "title_en": "Sleep Optimization & Circadian Rhythm",
        "title_hi": "नींद और सर्केडियन लय में सुधार",
        "category": "behavioral",
        "weeks": [
            {"week": 1, "en": "Track bedtime, wake time, and perceived sleep quality each night.", "hi": "हर रात सोने का समय, जागने का समय और नींद की गुणवत्ता नोट करें।"},
            {"week": 2, "en": "Establish a fixed wake-up time 7 days a week (within 30-minute variance).", "hi": "सप्ताह के सातों दिन उठने का एक निश्चित समय निर्धारित करें।"},
            {"week": 3, "en": "Eliminate bright screen use (phones, tablets, TV) 45 minutes before bed.", "hi": "सोने से 45 मिनट पहले मोबाइल, टैबलेट या स्क्रीन का उपयोग बंद करें।"},
            {"week": 4, "en": "Keep bedroom temperature cool and well-ventilated to support sleep onset.", "hi": "कमरे का तापमान अनुकूल और हवादार रखें।"},
            {"week": 5, "en": "Stop caffeine consumption after 2:00 PM.", "hi": "दोपहर 2 बजे के बाद चाय या कॉफी का सेवन बंद करें।"},
            {"week": 6, "en": "Get 10 to 15 minutes of direct morning sunlight exposure within an hour of waking.", "hi": "जागने के एक घंटे के भीतर 10 से 15 मिनट सुबह की धूप लें।"},
            {"week": 7, "en": "Develop a relaxing 15-minute wind-down routine (reading, stretching).", "hi": "सोने से पहले 15 मिनट की शांत दिनचर्या (पढ़ना, स्ट्रेचिंग) बनाएं।"},
            {"week": 8, "en": "Aim for 7 to 8 hours of dedicated time in bed nightly.", "hi": "प्रति रात 7 से 8 घंटे की नींद का लक्ष्य रखें।"},
            {"week": 9, "en": "Avoid heavy meals within 2.5 hours before sleeping.", "hi": "सोने से 2.5 घंटे पहले भारी भोजन करने से बचें।"},
            {"week": 10, "en": "Use blackout curtains or eye mask to eliminate night light pollution.", "hi": "रात में रोशनी से बचने के लिए आई-मास्क या पर्दे का उपयोग करें।"},
            {"week": 11, "en": "Evaluate whether daytime alertness and focus have improved over 10 weeks.", "hi": "जांचें कि क्या दिन के समय सतर्कता और एकाग्रता में सुधार हुआ है।"},
            {"week": 12, "en": "Sustain regular sleep window across the completion of the 90-day plan.", "hi": "90 दिनों के चक्र के अंत तक नियमित नींद की दिनचर्या बनाए रखें।"},
        ]
    },
    "heat_exposure": {
        "title_en": "Scrotal Thermal Environment Protection",
        "title_hi": "अंडकोषीय तापमान सुरक्षा",
        "category": "reproductive",
        "weeks": [
            {"week": 1, "en": "Identify habits that elevate groin temperature (laptops on lap, hot saunas/baths).", "hi": "ग्रोइन का तापमान बढ़ाने वाली आदतों (गोद में लैपटॉप, गर्म पानी से नहाना) की पहचान करें।"},
            {"week": 2, "en": "Always place a desk, tray, or table under laptop computers—never rest directly on lap.", "hi": "लैपटॉप को हमेशा टेबल पर रखें, सीधे गोद में कभी न रखें।"},
            {"week": 3, "en": "Switch to loose-fitting, breathable cotton boxer shorts or underwear.", "hi": "ढीले और हवादार सूती अंडरवियर का उपयोग करें।"},
            {"week": 4, "en": "Stand up and walk for 2 minutes every 60 minutes if working at a desk.", "hi": "डेस्क पर काम करते समय हर 60 मिनट में 2 मिनट के लिए उठकर टहलें।"},
            {"week": 5, "en": "Avoid hot tubs, jacuzzis, and heated car seats exceeding 15 minutes.", "hi": "गर्म टब, जकूज़ी और गर्म कार सीटों के 15 मिनट से अधिक उपयोग से बचें।"},
            {"week": 6, "en": "Take cool or lukewarm showers instead of excessively hot baths.", "hi": "अत्यधिक गर्म पानी के बजाय सामान्य या गुनगुने पानी से स्नान करें।"},
            {"week": 7, "en": "Wear loose athletic shorts without restrictive compression layers during workouts.", "hi": "व्यायाम के दौरान आरामदायक और ढीले शॉर्ट्स पहनें।"},
            {"week": 8, "en": "Ensure proper vehicle ventilation and avoid prolonged seated driving without breaks.", "hi": "लंबी ड्राइविंग के दौरान नियमित ब्रेक लें।"},
            {"week": 9, "en": "Keep mobile devices in coat pockets, desk, or bag rather than front pants pockets.", "hi": "मोबाइल फोन को पैंट की जेब के बजाय बैग या कोट की जेब में रखें।"},
            {"week": 10, "en": "Maintain consistent cooling habits during prolonged work or study sessions.", "hi": "लंबे अध्ययन या काम के दौरान शरीर को ठंडा और हवादार रखें।"},
            {"week": 11, "en": "Review occupational heat sources (bakeries, welding, boilers) and wear heat-deflecting attire.", "hi": "कार्यस्थल पर गर्मी के स्रोतों की समीक्षा करें और सुरक्षात्मक कपड़े पहनें।"},
            {"week": 12, "en": "Assess 90-day thermal protection adherence and prepare for follow-up evaluation.", "hi": "90-दिवसीय तापमान सुरक्षा की समीक्षा करें और अगले मूल्यांकन की तैयारी करें।"},
        ]
    },
    "activity": {
        "title_en": "Moderate Physical Activity & Metabolic Health",
        "title_hi": "मध्यम शारीरिक गतिविधि",
        "category": "lifestyle",
        "weeks": [
            {"week": 1, "en": "Track daily baseline steps using your phone or wearable pedometer.", "hi": "अपने फोन या घड़ी से दैनिक कदमों की संख्या नोट करें।"},
            {"week": 2, "en": "Increase daily walking by 1,000 steps over your personal baseline.", "hi": "दैनिक कदमों में 1,000 कदमों की वृद्धि करें।"},
            {"week": 3, "en": "Complete two 20-minute brisk walking sessions this week.", "hi": "इस सप्ताह 20 मिनट की दो तेज सैर पूरी करें।"},
            {"week": 4, "en": "Incorporate 10 minutes of basic bodyweight movements (squats, wall pushups) twice weekly.", "hi": "सप्ताह में दो बार 10 मिनट के बुनियादी व्यायाम (उठक-बैठक) शामिल करें।"},
            {"week": 5, "en": "Accumulate at least 90 minutes of moderate physical activity across the week.", "hi": "पूरे सप्ताह में कम से कम 90 मिनट की मध्यम गतिविधि करें।"},
            {"week": 6, "en": "Take the stairs instead of the elevator for 2 to 3 floors daily.", "hi": "लिफ्ट के बजाय सीढ़ियों का उपयोग करें।"},
            {"week": 7, "en": "Reach 120 minutes of weekly moderate cardiovascular exercise.", "hi": "साप्ताहिक व्यायाम को 120 मिनट तक बढ़ाएं।"},
            {"week": 8, "en": "Add light resistance training twice a week to support metabolic insulin sensitivity.", "hi": "इंसुलिन संवेदनशीलता में सुधार के लिए हल्का शक्ति व्यायाम जोड़ें।"},
            {"week": 9, "en": "Target a consistent 7,000 to 8,000 steps daily average.", "hi": "औसतन 7,000 से 8,000 दैनिक कदमों का लक्ष्य रखें।"},
            {"week": 10, "en": "Achieve WHO guideline target: 150 minutes of moderate activity per week.", "hi": "डब्ल्यूएचओ लक्ष्य प्राप्त करें: प्रति सप्ताह 150 मिनट की गतिविधि।"},
            {"week": 11, "en": "Ensure proper hydration and post-exercise recovery to prevent excessive fatigue.", "hi": "व्यायाम के बाद पर्याप्त पानी और आराम सुनिश्चित करें।"},
            {"week": 12, "en": "Review 90-day fitness consistency and establish long-term maintenance habits.", "hi": "90 दिनों की नियमितता की समीक्षा करें और दीर्घकालिक आदतें बनाएं।"},
        ]
    },
    "bmi": {
        "title_en": "Nutritional Density & Metabolic Balance",
        "title_hi": "पोषण और चयापचय संतुलन",
        "category": "lifestyle",
        "weeks": [
            {"week": 1, "en": "Log daily meals and beverage intake for 3 consecutive days.", "hi": "लगातार 3 दिनों तक अपने भोजन और पेय पदार्थों को नोट करें।"},
            {"week": 2, "en": "Add one serving of dark green leafy vegetables or fresh whole fruit daily.", "hi": "प्रतिदिन हरी पत्तेदार सब्जियां या ताजे फल की एक सर्विंग जोड़ें।"},
            {"week": 3, "en": "Replace ultra-processed snacks (chips, bakery goods) with mixed raw nuts (walnuts, almonds).", "hi": "प्रोसेस्ड स्नैक्स की जगह अखरोट या बादाम जैसे मेवे लें।"},
            {"week": 4, "en": "Eliminate sugar-sweetened beverages (soda, sweetened energy drinks) for 5 days.", "hi": "मीठे पेय पदार्थों और सोडा का सेवन कम करें।"},
            {"week": 5, "en": "Include dietary sources of zinc and selenium (lentils, seeds, eggs, seafood).", "hi": "आहार में जिंक और सेलेनियम से भरपूर खाद्य पदार्थ (दालें, बीज, अंडे) शामिल करें।"},
            {"week": 6, "en": "Practice portion moderation by using a slightly smaller dinner plate.", "hi": "भोजन की मात्रा को संतुलित रखने का प्रयास करें।"},
            {"week": 7, "en": "Increase dietary fiber to support healthy lipid metabolism.", "hi": "स्वस्थ चयापचय के लिए आहार में फाइबर की मात्रा बढ़ाएं।"},
            {"week": 8, "en": "Eat at consistent meal times to support circadian metabolic regulation.", "hi": "नियमित समय पर भोजन करने की आदत डालें।"},
            {"week": 9, "en": "Cook at least 4 dinners at home using fresh whole ingredients this week.", "hi": "सप्ताह में कम से कम 4 बार घर का बना ताजा खाना खाएं।"},
            {"week": 10, "en": "Maintain consistent intake of antioxidant-rich foods (berries, tomatoes, spinach).", "hi": "एंटीऑक्सीडेंट युक्त खाद्य पदार्थों का नियमित सेवन करें।"},
            {"week": 11, "en": "Track changes in waist circumference and energy levels across 11 weeks.", "hi": "ऊर्जा के स्तर और शारीरिक परिवर्तनों को नोट करें।"},
            {"week": 12, "en": "Reflect on 90-day dietary habits and consult a clinical nutritionist if needed.", "hi": "90-दिवसीय आदतों की समीक्षा करें और पोषण विशेषज्ञ से सलाह लें।"},
        ]
    },
}
