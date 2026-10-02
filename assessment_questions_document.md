# MantraAI Clinical Assessment Schema Documentation

This document provides a comprehensive list of all categories (blocks), questions, options, and clinical justifications asked inside the MantraAI clinical screening assessment.

* **Total Categories:** 13
* **Total Questions:** 86

## Category 1: Demographics (जनसांख्यिकी)
> **Description (EN):** Baseline variables for demographic risk profiling.
> **Description (HI):** जनसांख्यिकीय जोखिम प्रोफाइलिंग के लिए आधारभूत डेटा मापदंड।

### 1. What is your age in years?
* **Hindi Question:** वर्षों में आपकी आयु क्या है?
* **Question ID:** `age_years`
* **Type:** `slider`
* **Required:** `Yes`
* **Clinical Importance (EN):** Age is a baseline biological factor influencing metabolic and reproductive parameters.
* **Clinical Importance (HI):** उम्र एक बुनियादी जैविक कारक है जो चयापचय और प्रजनन मापदंडों को प्रभावित करता है।
* **Evidence Note (EN):** Hormonal shifts and DNA markers vary with age.
* **Evidence Note (HI):** हार्मोनल बदलाव और डीएनए मार्कर उम्र के साथ बदलते हैं।
* **Options:**
  * `18` - Min (18) (न्यूनतम (18))
  * `35` - Mid (35) (मध्य (35))
  * `50` - Max (50) (अधिकतम (50))

---

### 2. What is your body mass index (BMI) category?
* **Hindi Question:** आपकी शारीरिक द्रव्यमान सूचकांक (BMI) श्रेणी क्या है?
* **Question ID:** `bmi_category`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** BMI provides context on metabolic health which is connected to hormonal balance.
* **Clinical Importance (HI):** बीएमआई चयापचय स्वास्थ्य पर संदर्भ प्रदान करता है जो हार्मोनल संतुलन से जुड़ा है।
* **Evidence Note (EN):** BMI variations are linked to testosterone and estrogen ratios.
* **Evidence Note (HI):** बीएमआई बदलाव टेस्टोस्टेरोन और एस्ट्रोजन अनुपात से जुड़े हैं।
* **Options:**
  * `Underweight` - Underweight (कम वजन (Underweight))
  * `Normal` - Normal weight (सामान्य वजन (Normal))
  * `Overweight` - Overweight (अधिक वजन (Overweight))
  * `Obese` - Obese (मोटापा (Obese))

---

### 3. Select your current city or region in India:
* **Hindi Question:** भारत में अपने वर्तमान शहर या क्षेत्र का चयन करें:
* **Question ID:** `city_region`
* **Type:** `dropdown`
* **Required:** `Yes`
* **Clinical Importance (EN):** Geographical location helps identify exposure to local environmental factors.
* **Clinical Importance (HI):** भौगोलिक स्थिति स्थानीय पर्यावरणीय कारकों के जोखिम की पहचान करने में मदद करती।
* **Evidence Note (EN):** Air quality index (AQI) differs by region.
* **Evidence Note (HI):** वायु गुणवत्ता सूचकांक (AQI) क्षेत्र के अनुसार भिन्न होता है।
* **Options:**
  * `Bengaluru` - Bengaluru (बेंगलुरु)
  * `Chennai` - Chennai (चेन्नई)
  * `Delhi` - Delhi NCR (दिल्ली एनसीआर)
  * `Jamshedpur` - Jamshedpur (जमशेदपुर)
  * `Kanpur` - Kanpur (कानपुर)
  * `Ludhiana` - Ludhiana (लुधियाना)
  * `Mumbai` - Mumbai (मुंबई)
  * `Nagpur` - Nagpur (नागपुर)
  * `Nashik` - Nashik (नाशिक)
  * `Pune` - Pune (पुणे)
  * `Rural Maharashtra` - Rural Maharashtra (ग्रामीण महाराष्ट्र)
  * `Rural UP` - Rural Uttar Pradesh (ग्रामीण उत्तर प्रदेश)

---

### 4. What type of residential area do you live in?
* **Hindi Question:** आप किस प्रकार के आवासीय क्षेत्र में रहते हैं?
* **Question ID:** `residential_area_type`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Residential zones determine exposure limits to urban pollutants or pesticide levels.
* **Clinical Importance (HI):** आवासीय क्षेत्र शहरी प्रदूषकों या कीटनाशक स्तरों के संपर्क की सीमा निर्धारित करते हैं।
* **Evidence Note (EN):** Industrial areas report higher ambient particulate counts.
* **Evidence Note (HI):** औद्योगिक क्षेत्रों में उच्च परिवेशीय कण गणना दर्ज की जाती है।
* **Options:**
  * `Urban` - Urban (शहरी क्षेत्र)
  * `Semi-urban` - Semi-urban (अर्ध-शहरी क्षेत्र)
  * `Rural` - Rural (ग्रामीण क्षेत्र)
  * `Industrial zone` - Industrial zone (औद्योगिक क्षेत्र)

---

### 5. What best describes your daily work occupation?
* **Hindi Question:** आपके दैनिक कार्य व्यवसाय का सबसे अच्छा वर्णन क्या करता है?
* **Question ID:** `occupation_type`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Occupational profiles determine heat, chemical, or physical stress variables.
* **Clinical Importance (HI):** व्यावसायिक प्रोफाइल तापमान, रसायन या शारीरिक तनाव के कारकों को निर्धारित करते हैं।
* **Evidence Note (EN):** Drivers and factory workers face higher heat exposure risk classes.
* **Evidence Note (HI):** ड्राइवरों और कारखाना श्रमिकों को उच्च तापमान जोखिम का सामना करना पड़ता है।
* **Options:**
  * `Desk/sedentary` - Desk or Sedentary Job (डेस्क या बैठे रहने का कार्य)
  * `Field` - Field Work (मैदानी कार्य (Field))
  * `Factory` - Factory / Mechanical Work (कारखाना / यांत्रिक कार्य)
  * `Driver` - Driving Profession (ड्राइविंग पेशा)
  * `Other` - Other Occupation (अन्य व्यवसाय)

---

### 6. What is your highest level of education completed?
* **Hindi Question:** आपकी पूर्ण की गई उच्चतम शिक्षा का स्तर क्या है?
* **Question ID:** `education_level`
* **Type:** `segmented`
* **Required:** `Yes`
* **Clinical Importance (EN):** Socio-demographic metrics provide context for wellness recommendation delivery.
* **Clinical Importance (HI):** सामाजिक-जनसांख्यिकीय मेट्रिक्स स्वास्थ्य अनुशंसा वितरण के लिए संदर्भ प्रदान करते हैं।
* **Evidence Note (EN):** Socioeconomic data acts as a baseline screening reference.
* **Evidence Note (HI):** सामाजिक-आर्थिक डेटा एक आधारभूत स्क्रीनिंग संदर्भ के रूप में कार्य करता है।
* **Options:**
  * `Secondary` - Secondary (माध्यमिक)
  * `Graduate` - Graduate (स्नातक)
  * `Postgraduate` - Postgraduate (परास्नातक)

---

### 7. What is your current relationship status?
* **Hindi Question:** आपके संबंधों की वर्तमान स्थिति क्या है?
* **Question ID:** `relationship_status`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Relationship context aids in evaluating family planning timelines and relational variables.
* **Clinical Importance (HI):** संबंध संदर्भ पारिवारिक नियोजन समयसीमा और पारस्परिक कारकों के मूल्यांकन में सहायता करता है।
* **Evidence Note (EN):** Psychosocial parameters provide baseline context for relational health.
* **Evidence Note (HI):** मनोसामाजिक कारक पारस्परिक स्वास्थ्य के लिए आधारभूत संदर्भ प्रदान करते हैं।
* **Options:**
  * `Single` - Single (एकल (Single))
  * `In a relationship` - In a relationship (संबंध में (In a relationship))
  * `Married` - Married (विवाहित)
  * `Separated` - Separated / Other (अलग / अन्य)

---

## Category 2: Lifestyle Behaviors (जीवनशैली आदतें)
> **Description (EN):** Evaluation of daily sleep, movement, and recovery metrics.
> **Description (HI):** दैनिक नींद, शारीरिक गतिविधि और रिकवरी मेट्रिक्स का मूल्यांकन।

### 1. What is your tobacco smoking status?
* **Hindi Question:** आपके तंबाकू धूम्रपान की स्थिति क्या है?
* **Question ID:** `smoking_status`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Smoking introduces toxins that increase systemic oxidative stress, affecting blood flow and cellular health.
* **Clinical Importance (HI):** धूम्रपान से शरीर में टॉक्सिन बढ़ते हैं जो ऑक्सीडेटिव स्ट्रेस को बढ़ाते हैं, जिससे रक्त प्रवाह प्रभावित होता है।
* **Evidence Note (EN):** Heavy smoking is clinically associated with elevated cell DNA damage.
* **Evidence Note (HI):** अत्यधिक धूम्रपान डीएनए क्षति में वृद्धि से नैदानिक ​​रूप से जुड़ा हुआ है।
* **Options:**
  * `Never` - Never smoked (कभी धूम्रपान नहीं किया)
  * `Occasional` - Occasional smoker (कभी-कभार धूम्रपान)
  * `Regular` - Regular smoker (नियमित धूम्रपान)
  * `Heavy (20+/day)` - Heavy smoker (20+/day) (अत्यधिक धूम्रपान (20+/दिन))

---

### 2. How frequently do you consume alcohol?
* **Hindi Question:** आप कितनी बार शराब का सेवन करते हैं?
* **Question ID:** `alcohol_frequency`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Excessive alcohol frequency can interfere with hormone production and liver function.
* **Clinical Importance (HI):** अत्यधिक शराब का सेवन हार्मोन उत्पादन और यकृत (liver) के कार्य को प्रभावित कर सकता है।
* **Evidence Note (EN):** Heavy daily use is linked to altered hormonal balances.
* **Evidence Note (HI):** दैनिक अत्यधिक सेवन हार्मोनल असंतुलन से जुड़ा हुआ है।
* **Options:**
  * `Never` - Never (कभी नहीं)
  * `Monthly` - Monthly (A few times) (मासिक (कुछ बार))
  * `Weekly` - Weekly (Regularly) (साप्ताहिक (नियमित रूप से))
  * `Daily` - Daily or almost daily (दैनिक या लगभग रोज)

---

### 3. Do you use any recreational substances or performance enhancers?
* **Hindi Question:** क्या आप किसी मनोरंजक पदार्थ या प्रदर्शन बढ़ाने वाली दवाओं का उपयोग करते हैं?
* **Question ID:** `recreational_drug_use`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Certain compounds interfere directly with central endocrine signaling.
* **Clinical Importance (HI):** कुछ विशिष्ट पदार्थ केंद्रीय अंतःस्रावी (endocrine) सिग्नलों में सीधा हस्तक्षेप करते हैं।
* **Evidence Note (EN):** Steroid use suppresses gonadotropin release, affecting natural endocrine cycles.
* **Evidence Note (HI):** स्टेरॉयड का उपयोग गोनाडोट्रोपिन रिलीज को रोकता है, जिससे प्राकृतिक चक्र प्रभावित होते हैं।
* **Options:**
  * `No drug use` - No recreational substance use (किसी भी पदार्थ का उपयोग नहीं)
  * `Cannabis` - Cannabis / Marijuana (भांग / गांजा (Cannabis))
  * `Steroids` - Anabolic Steroids (non-prescription) (एनाबॉलिक स्टेरॉयड)
  * `Other` - Other substances (अन्य पदार्थ)

---

### 4. How would you rate your weekly physical activity level?
* **Hindi Question:** आप अपने साप्ताहिक शारीरिक गतिविधि स्तर को कैसे रेट करेंगे?
* **Question ID:** `physical_activity_level`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Active lifestyle profiles support insulin sensitivity and cardiovascular health.
* **Clinical Importance (HI):** सक्रिय जीवनशैली इंसुलिन संवेदनशीलता और हृदय स्वास्थ्य का समर्थन करती है।
* **Evidence Note (EN):** Moderate physical exercise acts as a stabilizer for metabolic parameters.
* **Evidence Note (HI):** मध्यम शारीरिक व्यायाम चयापचय मापदंडों के लिए एक स्टेबलाइजर के रूप में कार्य करता है।
* **Options:**
  * `Sedentary` - Sedentary (Little or no exercise) (गतिहीन (शारीरिक व्यायाम का अभाव))
  * `Light` - Light (Walking/stretching a few times) (हल्का व्यायाम (सप्ताह में कुछ बार टहलना))
  * `Moderate` - Moderate (Jogging/cycling 3-4 days) (मध्यम व्यायाम (सप्ताह में 3-4 दिन दौड़ना))
  * `Intense` - Intense (Heavy strength or cardio 5+ days) (तीव्र व्यायाम (सप्ताह में 5+ दिन भारी व्यायाम))

---

### 5. On average, how many hours do you spend sitting daily?
* **Hindi Question:** औसत रूप से, आप प्रतिदिन कितने घंटे बैठकर बिताते हैं?
* **Question ID:** `hours_sitting_per_day`
* **Type:** `segmented`
* **Required:** `Yes`
* **Clinical Importance (EN):** Sedentary behavior can impact circulation and increase local temperature factors.
* **Clinical Importance (HI):** लंबे समय तक बैठने की आदत रक्त परिसंचरण को प्रभावित कर सकती है और स्थानीय तापमान बढ़ा सकती है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `<2` - Under 2 hours (2 घंटे से कम)
  * `2-4` - 2 to 4 hours (2 से 4 घंटे)
  * `4-6` - 4 to 6 hours (4 से 6 घंटे)
  * `6+` - Over 6 hours (6 घंटे से अधिक)

---

### 6. How often do you experience irregular sleep patterns or night shifts?
* **Hindi Question:** आप कितनी बार अनियमित नींद के पैटर्न या नाइट शिफ्ट का अनुभव करते हैं?
* **Question ID:** `irregular_sleep`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Circadian disruptions can affect cortisol and testosterone production rhythms.
* **Clinical Importance (HI):** सर्कैडियन व्यवधान कोर्टिसोल और टेस्टोस्टेरोन उत्पादन की लय को प्रभावित कर सकते हैं।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `Never` - Never / Consistent schedule (कभी नहीं / लगातार समय सारणी)
  * `Sometimes` - Sometimes (कभी-कभी)
  * `Often` - Often / Frequent changes (अक्सर / बार-बार बदलाव)
  * `Always` - Always / Very irregular (हमेशा / अत्यधिक अनियमित)

---

### 7. What is your average nightly sleep duration?
* **Hindi Question:** आपकी रात की नींद की औसत अवधि क्या है?
* **Question ID:** `sleep_duration`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Testosterone synthesis primarily peaks during deep sleep cycles.
* **Clinical Importance (HI):** टेस्टोस्टेरोन का उत्पादन मुख्य रूप से गहरी नींद के चक्र के दौरान चरम पर होता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `<5` - Under 5 hours (5 घंटे से कम)
  * `5-7` - 5 to 7 hours (5 से 7 घंटे)
  * `7-9` - 7 to 9 hours (7 से 9 घंटे)
  * `9+` - Over 9 hours (9 घंटे से अधिक)

---

## Category 3: Heat Exposure (तापमान जोखिम)
> **Description (EN):** Screening local scrotal hyperthermia parameters.
> **Description (HI):** वृषण क्षेत्र (scrotal area) में अतिताप (hyperthermia) जोखिम की जांच।

### 1. How often do you work with a laptop directly on your lap?
* **Hindi Question:** आप कितनी बार अपनी गोद में सीधे लैपटॉप रखकर काम करते हैं?
* **Question ID:** `laptop_on_lap`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Heat from electronic devices placed on the lap can elevate scrotal temperature.
* **Clinical Importance (HI):** गोद में रखे इलेक्ट्रॉनिक उपकरणों से निकलने वाली गर्मी अंडकोष के तापमान को बढ़ा सकती है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `Never` - Never (कभी नहीं)
  * `Occasionally` - Occasionally (कभी-कभार)
  * `Often` - Often (अक्सर)
  * `Daily` - Daily / Almost always (रोजाना / लगभग हमेशा)

---

### 2. Where do you typically carry your mobile phone?
* **Hindi Question:** आप आमतौर पर अपना मोबाइल फोन कहां रखते हैं?
* **Question ID:** `mobile_phone_placement`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Carrying emitting devices close to the body is studied for local thermal and non-thermal influences.
* **Clinical Importance (HI):** शरीर के करीब रेडियो फ्रीक्वेंसी उत्सर्जन उपकरणों को रखने के प्रभाव का अध्ययन किया जाता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `Front trouser pocket` - Front trouser pocket (पैंट की आगे की जेब)
  * `Back pocket` - Back trouser pocket (पैंट की पीछे की जेब)
  * `Bag` - Bag / Backpack (बैग / बैकपैक)
  * `Other` - Shirt pocket / Table / Other (शर्ट की जेब / मेज / अन्य)

---

### 3. What type of underwear do you wear most frequently?
* **Hindi Question:** आप किस प्रकार के अंडरवियर का सबसे अधिक बार उपयोग करते हैं?
* **Question ID:** `underwear_type`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Tight underwear can restrict airflow, leading to minor thermal retention in the scrotal area.
* **Clinical Importance (HI):** तंग इनरवियर हवा के प्रवाह को बाधित कर सकते हैं, जिससे वृषण क्षेत्र में थोड़ा तापमान बढ़ सकता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `Boxers` - Loose Boxers (ढीले बॉक्सर्स (Boxers))
  * `Briefs` - Briefs (ब्रीफ्स (Briefs))
  * `Compression shorts` - Tight / Compression shorts (तंग / कंप्रेशन शॉर्ट्स)
  * `Mixed` - Mixed / Alternating (मिश्रित / बदल-बदल कर)

---

### 4. How often do you take hot baths, steam baths, or saunas?
* **Hindi Question:** आप कितनी बार गर्म पानी से स्नान, स्टीम बाथ या सौना लेते हैं?
* **Question ID:** `hot_bath_frequency`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** High-temperature exposure can temporarily affect sperm production parameters.
* **Clinical Importance (HI):** उच्च तापमान के संपर्क में आने से शुक्राणु उत्पादन के मापदंड अस्थाई रूप से प्रभावित हो सकते हैं।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `Never` - Never (कभी नहीं)
  * `Rarely` - Rarely (Once a month) (शायद ही कभी (महीने में एक बार))
  * `Weekly` - Weekly (1-3 times) (साप्ताहिक (1-3 बार))
  * `Daily` - Daily (रोजाना)

---

### 5. Do you work in high-temperature environments (e.g. bakeries, kitchens, factories)?
* **Hindi Question:** क्या आप उच्च तापमान वाले वातावरण (जैसे बेकरी, रसोई, कारखाने) में काम करते हैं?
* **Question ID:** `working_in_hot_conditions`
* **Type:** `segmented`
* **Required:** `Yes`
* **Clinical Importance (EN):** High ambient working temperatures are studied for occupational scrotal heat stress.
* **Clinical Importance (HI):** उच्च परिवेशीय कामकाजी तापमान का वृषण क्षेत्र पर पड़ने वाले थर्मल प्रभाव के संदर्भ में अध्ययन किया जाता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No` - No (नहीं)
  * `Yes` - Yes (हाँ)

---

### 6. How many hours of bicycle or motorcycle riding do you perform weekly?
* **Hindi Question:** आप साप्ताहिक रूप से कितने घंटे साइकिल या मोटरसाइकिल चलाते हैं?
* **Question ID:** `cycling_hours_per_week`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Prolonged sitting on bicycle saddles is studied for physical compression and temperature elevation.
* **Clinical Importance (HI):** साइकिल की सीट पर लंबे समय तक बैठने से होने वाले भौतिक दबाव और तापमान वृद्धि का अध्ययन किया जाता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `0 (none)` - 0 / None (0 / कोई नहीं)
  * `<2` - Under 2 hours (2 घंटे से कम)
  * `2-5` - 2 to 5 hours (2 से 5 घंटे)
  * `5+` - Over 5 hours (5 घंटे से अधिक)

---

## Category 4: Diet & Nutrition (आहार और पोषण)
> **Description (EN):** Dietary habits and nutritional variables.
> **Description (HI):** आहार संबंधी आदतें और पोषण संबंधी कारक।

### 1. Which best describes your primary diet type?
* **Hindi Question:** आपके प्राथमिक आहार प्रकार का सबसे अच्छा वर्णन कौन करता है?
* **Question ID:** `diet_type`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Dietary types provide basic metabolic context for dietary fat and micronutrient availability.
* **Clinical Importance (HI):** आहार प्रकार वसा और सूक्ष्म पोषक तत्वों की उपलब्धता के लिए बुनियादी चयापचय संदर्भ प्रदान करते हैं।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `Vegetarian` - Vegetarian (शाकाहारी (Vegetarian))
  * `Non-vegetarian` - Non-vegetarian (मांसाहारी (Non-vegetarian))
  * `Vegan` - Vegan (वेगनेरियन (Vegan))
  * `Mixed` - Mixed / Eggitarian (मिश्रित / अंडा खाने वाले (Mixed))

---

### 2. How many servings of fresh fruits and vegetables do you consume daily?
* **Hindi Question:** आप प्रतिदिन ताजे फलों और सब्जियों की कितनी सर्विंग्स खाते हैं?
* **Question ID:** `fruit_veg_intake`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Fresh produce provides dietary antioxidants that neutralize cell damaging oxidative agents.
* **Clinical Importance (HI):** ताजे फल और सब्जियां एंटीऑक्सीडेंट प्रदान करती हैं जो कोशिकाओं को नुकसान पहुंचाने वाले एजेंटों को निष्क्रिय करते हैं।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `<1 serving/day` - Less than 1 serving (1 सर्विंग से कम/दिन)
  * `1-2` - 1 to 2 servings (1 से 2 सर्विंग्स)
  * `3-5` - 3 to 5 servings (3 से 5 सर्विंग्स)
  * `5+` - 5 or more servings (5 या अधिक सर्विंग्स)

---

### 3. How often do you consume highly processed foods (packaged snacks, ready meals)?
* **Hindi Question:** आप कितनी बार अत्यधिक प्रसंस्कृत खाद्य पदार्थ (पैकेज्ड स्नैक्स, रेडी मील) खाते हैं?
* **Question ID:** `processed_food_frequency`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Processed diets can increase systemic markers of inflammation over time.
* **Clinical Importance (HI):** प्रसंस्कृत खाद्य पदार्थों का सेवन समय के साथ शरीर में सूजन (inflammation) के जोखिम को बढ़ा सकता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `Never` - Never (कभी नहीं)
  * `Rarely` - Rarely (शायद ही कभी)
  * `Few times/week` - A few times a week (सप्ताह में कुछ बार)
  * `Daily` - Daily (रोजाना)

---

### 4. How often do you eat fried foods?
* **Hindi Question:** आप कितनी बार तले हुए खाद्य पदार्थ खाते हैं?
* **Question ID:** `fried_food_frequency`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Trans fats and high-temperature cooking oils impact lipid profiles and inflammatory responses.
* **Clinical Importance (HI):** ट्रांस फैट और उच्च तापमान पर पकाए गए तेल शरीर में लिपिड प्रोफाइल और सूजन को प्रभावित करते हैं।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `Rarely` - Rarely / Never (शायद ही कभी / कभी नहीं)
  * `Few times/week` - A few times a week (सप्ताह में कुछ बार)
  * `Daily` - Daily (रोजाना)

---

### 5. How often do you consume soy products or lentils/dals (which contain phytoestrogens)?
* **Hindi Question:** आप सोया उत्पादों या दालों (दाल/सोया) का सेवन कितनी बार करते हैं?
* **Question ID:** `soy_phytoestrogen_intake`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Lentils (dal) and soy contain natural compounds called phytoestrogens. While they are healthy protein sources, higher consumption is screened because it can interact with hormonal balances.
* **Clinical Importance (HI):** दाल और सोया में फाइटोएस्ट्रोजन नामक प्राकृतिक यौगिक होते हैं। हालांकि वे प्रोटीन के बेहतरीन स्रोत हैं, लेकिन इनकी अधिक मात्रा का सेवन हार्मोनल संतुलन को प्रभावित कर सकता है, इसलिए इसकी जांच की जाती है।
* **Evidence Note (EN):** Phytoestrogens exhibit weak estrogen-like structures that are evaluated in dietary wellness profiles.
* **Evidence Note (HI):** फाइटोएस्ट्रोजन कमजोर एस्ट्रोजन जैसी संरचनाओं को दर्शाते हैं जिनका मूल्यांकन आहार कल्याण प्रोफाइल में किया जाता है।
* **Options:**
  * `Low` - Low intake (rarely) (कम सेवन (कभी-कभार))
  * `Moderate` - Moderate intake (few times a week) (मध्यम सेवन (सप्ताह में कुछ बार))
  * `High (daily dal/soy)` - High intake (daily dal or soy) (उच्च सेवन (दैनिक दाल या सोया))

---

### 6. What is your average daily water consumption?
* **Hindi Question:** आपकी दैनिक पानी पीने की औसत मात्रा क्या है?
* **Question ID:** `water_intake`
* **Type:** `segmented`
* **Required:** `Yes`
* **Clinical Importance (EN):** Hydration is essential for general metabolic efficiency and fluid regulation.
* **Clinical Importance (HI):** सामान्य चयापचय दक्षता और तरल नियमन के लिए पर्याप्त जल स्तर आवश्यक है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `<1L` - Under 1 Liter (1 लीटर से कम)
  * `1-2L` - 1 to 2 Liters (1 से 2 लीटर)
  * `2-3L` - 2 to 3 Liters (2 से 3 लीटर)
  * `3L+` - Over 3 Liters (3 लीटर से अधिक)

---

### 7. Do you regularly consume any of these health supplements?
* **Hindi Question:** क्या आप नियमित रूप से इनमें से किसी स्वास्थ्य सप्लीमेंट का सेवन करते हैं?
* **Question ID:** `supplement_use`
* **Type:** `dropdown`
* **Required:** `Yes`
* **Clinical Importance (EN):** Micronutrients like Zinc and antioxidants are studied for their roles in cell stability.
* **Clinical Importance (HI):** जिंक जैसे सूक्ष्म पोषक तत्वों और एंटीऑक्सीडेंट का कोशिकीय स्थिरता में उनकी भूमिका के लिए अध्ययन किया जाता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No supplement use` - None / No supplements (कोई नहीं / कोई सप्लीमेंट नहीं)
  * `Zinc` - Zinc (जिंक (Zinc))
  * `Folate` - Folate / Folic Acid (फोलेट (Folate))
  * `CoQ10` - Coenzyme Q10 (CoQ10) (कोएंजाइम Q10)
  * `Omega-3` - Omega-3 Fish Oil (ओमेगा-3 (Omega-3))
  * `Vit C or E` - Vitamin C or Vitamin E (विटामिन सी या विटामिन ई)

---

## Category 5: Environmental Exposure (पर्यावरणीय जोखिम)
> **Description (EN):** Exposure to pollutants and endocrine disruptors.
> **Description (HI):** प्रदूषकों और अंतःस्रावी (endocrine) अवरोधकों का जोखिम।

### 1. Do you live or work close to heavy industrial complexes or high-traffic highways?
* **Hindi Question:** क्या आप भारी औद्योगिक परिसरों या उच्च-यातायात राजमार्गों के पास रहते हैं या काम करते हैं?
* **Question ID:** `proximity_to_industrial_or_traffic`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Proximity to highways and factories correlates with higher ambient particulate matter (PM2.5) exposure.
* **Clinical Importance (HI):** राजमार्गों और कारखानों से निकटता परिवेशी धूल कण (PM2.5) के अधिक जोखिम से संबंधित है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No` - No (नहीं)
  * `Yes` - Yes (हाँ)
  * `Unsure` - Unsure (अनिश्चित)

---

### 2. Do you have direct occupational exposure to agricultural pesticides or chemical sprays?
* **Hindi Question:** क्या आपके काम में कृषि कीटनाशकों या रासायनिक स्प्रे का सीधा संपर्क होता है?
* **Question ID:** `pesticide_occupational_exposure`
* **Type:** `segmented`
* **Required:** `Yes`
* **Clinical Importance (EN):** Organophosphates and other pesticides can behave as active endocrine disruptors.
* **Clinical Importance (HI):** ऑर्गनोफॉस्फेट और अन्य कीटनाशक सक्रिय अंतःस्रावी अवरोधकों (endocrine disruptors) के रूप में कार्य कर सकते हैं।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No` - No (नहीं)
  * `Yes` - Yes (हाँ)

---

### 3. Are you exposed to any of these heavy metals or industrial processes at work?
* **Hindi Question:** क्या आप काम पर इनमें से किसी भारी धातु या औद्योगिक प्रक्रियाओं के संपर्क में आते हैं?
* **Question ID:** `heavy_metal_occupational_exposure`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Lead, cadmium, and welding fumes are studied for potential cumulative toxicity on endocrine tissues.
* **Clinical Importance (HI):** सीसा, कैडमियम और वेल्डिंग धुएं का अंतःस्रावी ऊतकों पर संभावित विषाक्तता के लिए अध्ययन किया जाता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No exposure` - No industrial heavy metal exposure (कोई भारी धातु जोखिम नहीं)
  * `Welding` - Welding fumes (वेल्डिंग का धुआं (Welding))
  * `Paint` - Paints, solvents, or lacquers (पेंट या विलायक (Paint/Solvent))
  * `Battery mfg` - Lead battery manufacturing (लीड बैटरी विनिर्माण)

---

### 4. How often do you consume hot food or hot drinks from plastic containers?
* **Hindi Question:** आप कितनी बार प्लास्टिक के बर्तनों से गर्म भोजन या गर्म पेय का सेवन करते हैं?
* **Question ID:** `plastic_use_hot_food_water`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Heating plastics can accelerate the release of microplastics and plasticizers like Bisphenol A (BPA).
* **Clinical Importance (HI):** प्लास्टिक को गर्म करने से माइक्रोप्लास्टिक्स और बिस्फेनॉल ए (BPA) जैसे हानिकारक रसायनों का रिसाव बढ़ सकता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `Never` - Never / Avoid plastics for hot food (कभी नहीं / गर्म भोजन के लिए प्लास्टिक से बचें)
  * `Occasional` - Occasionally (कभी-कभार)
  * `Daily` - Daily (रोजाना)

---

### 5. Are you exposed to specialized electromagnetic fields (EMF) at your workplace?
* **Hindi Question:** क्या आप अपने कार्यस्थल पर विशिष्ट विद्युत चुम्बकीय क्षेत्रों (EMF) के संपर्क में आते हैं?
* **Question ID:** `emf_radiation_at_work`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Ionizing and high-energy electromagnetic fields are studied for cellular structural impacts.
* **Clinical Importance (HI):** आयनीकरण और उच्च-ऊर्जा विद्युत चुम्बकीय क्षेत्रों का कोशिकीय संरचना पर पड़ने वाले प्रभावों के लिए अध्ययन किया जाता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No exposure` - No specialized exposure (कोई विशेष जोखिम नहीं)
  * `Telecom tower` - Telecom tower maintenance (टेलीकॉम टावर रखरखाव)
  * `Radiology` - Medical radiology / X-ray equipment (मेडिकल रेडियोलॉजी / एक्स-रे उपकरण)
  * `Electrical` - High-voltage electrical installations (उच्च वोल्टेज विद्युत उपकरण)

---

## Category 6: Mental Health & Stress (मानसिक स्वास्थ्य व तनाव)
> **Description (EN):** Psychological variables and metabolic strain factors.
> **Description (HI):** मनोवैज्ञानिक कारक और चयापचय तनाव मापदंड।

### 1. How many hours do you typically work per day?
* **Hindi Question:** आप आमतौर पर प्रति दिन कितने घंटे काम करते हैं?
* **Question ID:** `daily_work_hours`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Extended work hours increase metabolic strain and limit recovery cycles.
* **Clinical Importance (HI):** काम के लंबे घंटे चयापचय तनाव को बढ़ाते हैं और रिकवरी चक्र को सीमित करते हैं।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `<6` - Under 6 hours (6 घंटे से कम)
  * `6-8` - 6 to 8 hours (6 से 8 घंटे)
  * `8-10` - 8 to 10 hours (8 से 10 घंटे)
  * `10+` - Over 10 hours (Extended shift) (10 घंटे से अधिक (लंबी शिफ्ट))

---

### 2. Rate your overall perceived stress level (corresponds to PSS-10 scale):
* **Hindi Question:** अपने कुल कथित तनाव स्तर को रेट करें (PSS-10 पैमाने के अनुसार):
* **Question ID:** `perceived_stress_pss10`
* **Type:** `slider`
* **Required:** `Yes`
* **Clinical Importance (EN):** High perceived stress levels activate the hypothalamic-pituitary-adrenal axis, elevating cortisol.
* **Clinical Importance (HI):** उच्च तनाव का स्तर शरीर में कोर्टिसोल हार्मोन के स्राव को बढ़ाता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `0` - Minimal (0) (न्यूनतम (0))
  * `16` - Moderate (16) (मध्यम (16))
  * `33` - Severe (33) (गंभीर (33))

---

### 3. Provide your Generalized Anxiety Scale score (GAD-7):
* **Hindi Question:** अपना सामान्यीकृत चिंता विकार स्कोर दर्ज करें (GAD-7):
* **Question ID:** `gad7_score`
* **Type:** `slider`
* **Required:** `Yes`
* **Clinical Importance (EN):** Generalized anxiety triggers physiological sympathetic responses affecting vascular efficiency.
* **Clinical Importance (HI):** सामान्यीकृत चिंता शारीरिक तनाव को बढ़ाती है जो रक्त प्रवाह की दक्षता को प्रभावित करती है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `0` - Minimal (0) (न्यूनतम (0))
  * `8` - Moderate (8) (मध्यम (8))
  * `16` - Severe (16) (गंभीर (16))

---

### 4. Provide your Patient Depression Scale score (PHQ-9):
* **Hindi Question:** अपना अवसाद रेटिंग स्कोर दर्ज करें (PHQ-9):
* **Question ID:** `phq9_score`
* **Type:** `slider`
* **Required:** `Yes`
* **Clinical Importance (EN):** Somatic and mood parameters directly correlate with overall metabolic stability.
* **Clinical Importance (HI):** मनोदशा और शारीरिक मापदंड सीधे तौर पर समग्र चयापचय स्थिरता से संबंधित होते हैं।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `0` - Minimal (0) (न्यूनतम (0))
  * `10` - Moderate (10) (मध्यम (10))
  * `19` - Severe (19) (गंभीर (19))

---

### 5. Which statement best describes your typical night's sleep quality?
* **Hindi Question:** कौन सा कथन आपकी रात की नींद की गुणवत्ता का सबसे अच्छा वर्णन करता है?
* **Question ID:** `sleep_quality_psqi_proxy`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Sleep architecture anomalies influence hormone peaks and autonomic balance.
* **Clinical Importance (HI):** नींद की संरचना में गड़बड़ी हार्मोन के स्तर और तंत्रिका संतुलन को प्रभावित करती है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `Feeling rested` - I wake up feeling rested (मैं तरोताजा महसूस करते हुए जागता हूँ)
  * `Trouble falling asleep` - I have trouble falling asleep (मुझे सोने में कठिनाई होती है)
  * `Trouble staying asleep` - I wake up frequently during the night (मेरी नींद रात में बार-बार टूटती है)
  * `Waking early` - I wake up too early and cannot sleep again (मैं बहुत जल्दी जाग जाता हूँ और दोबारा नहीं सो पाता)

---

## Category 7: Reproductive History (प्रजनन इतिहास व लक्षण)
> **Description (EN):** Clinical parameters regarding prior history and symptoms.
> **Description (HI):** पूर्व प्रजनन इतिहास और लक्षणों से संबंधित नैदानिक ​​मापदंड।

### 1. Have you ever been diagnosed with a Sexually Transmitted Infection (STI)?
* **Hindi Question:** क्या आपको कभी यौन संचारित संक्रमण (STI) का निदान हुआ है?
* **Question ID:** `prior_sti_history`
* **Type:** `radio`
* **Required:** `No`
* **Clinical Importance (EN):** Certain bacterial or viral STIs can leave structural changes or subclinical scarring in reproductive tracts.
* **Clinical Importance (HI):** कुछ विशिष्ट संक्रमण प्रजनन नलिकाओं में सूक्ष्म संरचनात्मक बदलाव छोड़ सकते हैं।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No` - No (नहीं)
  * `Yes` - Yes (हाँ)
  * `Unsure` - Unsure / Prefer not to say (अनिश्चित / कहना नहीं चाहता)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 2. Have you ever experienced a significant physical trauma or injury to the groin/testicles?
* **Hindi Question:** क्या आपने कभी अंडकोष या कमर क्षेत्र में गंभीर शारीरिक चोट का अनुभव किया है?
* **Question ID:** `scrotal_or_groin_injury`
* **Type:** `segmented`
* **Required:** `No`
* **Clinical Importance (EN):** Groin injuries can sometimes compromise local tissue integrity or stimulate autoimmune responses.
* **Clinical Importance (HI):** कमर की गंभीर चोटें कभी-कभी ऊतकों की अखंडता को प्रभावित कर सकती हैं।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No` - No (नहीं)
  * `Yes` - Yes (हाँ)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 3. Did you experience a mumps infection during childhood or adolescence?
* **Hindi Question:** क्या आपको बचपन या किशोरावस्था के दौरान कण्ठमाला (Mumps) का संक्रमण हुआ था?
* **Question ID:** `childhood_disease_mumps`
* **Type:** `radio`
* **Required:** `No`
* **Clinical Importance (EN):** Mumps orchitis occurring post-puberty can lead to changes in testicular epithelial structures.
* **Clinical Importance (HI):** युवावस्था के बाद होने वाला मम्प्स संक्रमण वृषण संरचनाओं में बदलाव का कारण बन सकता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No` - No (नहीं)
  * `Yes` - Yes (हाँ)
  * `Unsure` - Unsure (अनिश्चित)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 4. Have you been diagnosed with varicocele (dilated veins in the scrotum)?
* **Hindi Question:** क्या आपको वैरीकोसेल (अंडकोष में सूजी हुई नसें) का निदान हुआ है?
* **Question ID:** `known_varicocele`
* **Type:** `radio`
* **Required:** `No`
* **Clinical Importance (EN):** Varicocele can restrict venous return, causing mild heat accumulation and hypoxia in local tissues.
* **Clinical Importance (HI):** वैरीकोसेल रक्त प्रवाह को प्रभावित कर सकता है, जिससे अंडकोष के तापमान में वृद्धि हो सकती है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No` - No (नहीं)
  * `Yes` - Yes (हाँ)
  * `Unsure` - Unsure (अनिश्चित)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 5. What is your typical period of sexual abstinence before a screening or evaluation?
* **Hindi Question:** जांच या मूल्यांकन से पहले आपके यौन संयम (abstinence) की सामान्य अवधि क्या होती है?
* **Question ID:** `sexual_abstinence_period_days`
* **Type:** `radio`
* **Required:** `No`
* **Clinical Importance (EN):** The duration of abstinence influences parameters like semen volume and concentration benchmarks.
* **Clinical Importance (HI):** संयम की अवधि सीधे तौर पर वीर्य की मात्रा और सांद्रता के मानकों को प्रभावित करती है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `<2` - Under 2 days (2 दिन से कम)
  * `2-7` - 2 to 7 days (2 से 7 दिन)
  * `7-14` - 7 to 14 days (7 से 14 दिन)
  * `14+` - Over 14 days (14 दिन से अधिक)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 6. Have you noticed any changes in your libido (sexual desire) recently?
* **Hindi Question:** क्या आपने हाल ही में अपनी कामेच्छा (libido) में कोई बदलाव महसूस किया है?
* **Question ID:** `libido_changes`
* **Type:** `radio`
* **Required:** `No`
* **Clinical Importance (EN):** Libido levels are highly reflective of circulating free androgen concentrations.
* **Clinical Importance (HI):** कामेच्छा का स्तर शरीर में सक्रिय एण्ड्रोजन (हार्मोन) के स्तर को दर्शाता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `Normal` - Normal / Consistent (सामान्य / हमेशा जैसा)
  * `Increased` - Increased (बढ़ी हुई)
  * `Decreased` - Decreased (कम हुई)
  * `Fluctuating` - Fluctuating (उतार-चढ़ाव वाली)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 7. Do you currently experience any of these ejaculation concerns?
* **Hindi Question:** क्या आप वर्तमान में इनमें से किसी स्खलन संबंधी चिंता का अनुभव करते हैं?
* **Question ID:** `ejaculation_concerns`
* **Type:** `dropdown`
* **Required:** `No`
* **Clinical Importance (EN):** Ejaculatory parameters are indicators of accessory gland functions and urethral structures.
* **Clinical Importance (HI):** स्खलन के लक्षण सहायक ग्रंथियों (gland) के कार्य और स्वास्थ्य के संकेतक होते हैं।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No concerns` - No concerns (कोई चिंता नहीं)
  * `Low volume` - Low ejaculate volume (कम स्खलन मात्रा)
  * `Pain` - Pain during ejaculation (स्खलन के दौरान दर्द)
  * `Blood` - Blood in ejaculate (hematospermia) (वीर्य में रक्त आना)
  * `Retrograde` - Retrograde ejaculation (प्रतिगामी स्खलन (Retrograde))
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

## Category 8: Substance Use (पदार्थ और दवा का उपयोग)
> **Description (EN):** Evaluation of pharmacological and recreational exposures.
> **Description (HI):** दवाओं और अन्य पदार्थों के उपयोग व प्रभावों का मूल्यांकन।

### 1. Select your anabolic steroid usage status:
* **Hindi Question:** अपने एनाबॉलिक स्टेरॉयड उपयोग की स्थिति चुनें:
* **Question ID:** `anabolic_steroid_use`
* **Type:** `radio`
* **Required:** `No`
* **Clinical Importance (EN):** Exogenous testosterones trigger feedback loops that inhibit natural endocrine synthesis.
* **Clinical Importance (HI):** बाहरी टेस्टोस्टेरोन लेने से शरीर में प्राकृतिक हार्मोन उत्पादन बंद हो जाता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `Never` - Never used (कभी उपयोग नहीं किया)
  * `Past` - Used in the past (अतीत में उपयोग किया है)
  * `Current` - Currently using (वर्तमान में उपयोग कर रहा हूँ)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 2. Do you use Finasteride or Dutasteride for hair loss or prostate issues?
* **Hindi Question:** क्या आप बालों के झड़ने या प्रोस्टेट के लिए फिनास्टेराइड (Finasteride) का उपयोग करते हैं?
* **Question ID:** `finasteride_use`
* **Type:** `segmented`
* **Required:** `No`
* **Clinical Importance (EN):** 5-alpha reductase inhibitors block conversion of testosterone to DHT, changing hormone profiles.
* **Clinical Importance (HI):** ये दवाएं टेस्टोस्टेरोन को डीएचटी (DHT) में बदलने से रोकती हैं, जिससे हार्मोन प्रोफाइल प्रभावित होता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No` - No (नहीं)
  * `Yes` - Yes (हाँ)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 3. Do you take SSRI-type antidepressant medications?
* **Hindi Question:** क्या आप SSRI प्रकार की अवसादरोधी (antidepressant) दवाएं लेते हैं?
* **Question ID:** `antidepressant_use_ssri`
* **Type:** `segmented`
* **Required:** `No`
* **Clinical Importance (EN):** SSRIs alter serotonin parameters which can influence autonomic reflexes and drive.
* **Clinical Importance (HI):** एसएसआरआई दवाएं सेरोटोनिन के स्तर को बदलती हैं जो तंत्रिका क्रियाओं को प्रभावित कर सकती हैं।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No` - No (नहीं)
  * `Yes` - Yes (हाँ)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 4. Do you take beta-blockers or antihypertensive drugs for blood pressure?
* **Hindi Question:** क्या आप रक्तचाप के लिए बीटा-ब्लॉकर्स या अन्य दवाएं लेते हैं?
* **Question ID:** `antihypertensive_use`
* **Type:** `segmented`
* **Required:** `No`
* **Clinical Importance (EN):** Some antihypertensive classes modify vascular resistance and blood circulation dynamics.
* **Clinical Importance (HI):** कुछ रक्तचाप की दवाएं रक्त परिसंचरण की गतिशीलता को प्रभावित कर सकती हैं।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No` - No (नहीं)
  * `Yes` - Yes (हाँ)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 5. Do you have any past clinical history of chemotherapy or radiation therapy?
* **Hindi Question:** क्या आपका कीमोथेरेपी या विकिरण चिकित्सा (radiation) का कोई इतिहास रहा है?
* **Question ID:** `chemotherapy_history`
* **Type:** `segmented`
* **Required:** `No`
* **Clinical Importance (EN):** Cytotoxic agents directly target highly proliferative tissues, including spermatogenic cell lines.
* **Clinical Importance (HI):** कीमोथेरेपी दवाएं तेजी से बढ़ने वाली कोशिकाओं को लक्षित करती हैं, जिसमें प्रजनन कोशिकाएं शामिल हैं।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No` - No (नहीं)
  * `Yes` - Yes (हाँ)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 6. Are you taking any other long-term prescribed medications?
* **Hindi Question:** क्या आप कोई अन्य दीर्घकालिक निर्धारित दवाएं ले रहे हैं?
* **Question ID:** `other_long_term_medication`
* **Type:** `segmented`
* **Required:** `No`
* **Clinical Importance (EN):** Chronic medication use can exert systemic influence on general physiological markers.
* **Clinical Importance (HI):** दीर्घकालिक दवाओं का उपयोग चयापचय और शारीरिक क्रियाओं पर प्रभाव डाल सकता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No other medication` - No other long-term medication (कोई अन्य दीर्घकालिक दवा नहीं)
  * `Reported (unspecified)` - Yes, taking long-term medication (हाँ, दीर्घकालिक दवा ले रहा हूँ)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

## Category 9: Digital Sexual Behavior (डिजिटल यौन आदतें)
> **Description (EN):** Analysis of screen time and digital habits.
> **Description (HI):** स्क्रीन टाइम और यौन स्वास्थ्य पर डिजिटल आदतों के प्रभावों का विश्लेषण।

### 1. How often do you consume pornography or digital adult content?
* **Hindi Question:** आप कितनी बार पोर्नोग्राफी या डिजिटल वयस्क सामग्री का सेवन करते हैं?
* **Question ID:** `pornography_use_frequency`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** High frequency digital consumption is studied for neurotransmitter habituation and psychosexual context.
* **Clinical Importance (HI):** डिजिटल वयस्क सामग्री के उच्च सेवन का न्यूरोट्रांसमीटर अनुकूलन और मनोवैज्ञानिक स्वास्थ्य पर प्रभाव के लिए अध्ययन किया जाता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `Never` - Never (कभी नहीं)
  * `Monthly` - Monthly (A few times) (मासिक (कुछ बार))
  * `Weekly` - Weekly (A few times a week) (साप्ताहिक (सप्ताह में कुछ बार))
  * `Daily` - Daily (Once a day) (दैनिक (दिन में एक बार))
  * `Multiple times daily` - Multiple times daily (दिन में कई बार)

---

### 2. I feel I have control over my digital content consumption habits:
* **Hindi Question:** मुझे लगता है कि मेरी डिजिटल सामग्री खपत की आदतों पर मेरा नियंत्रण है:
* **Question ID:** `perceived_control_over_use`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Perceived control over habits is a baseline variable for evaluating digital behavioral health.
* **Clinical Importance (HI):** आदतों पर नियंत्रण की धारणा डिजिटल व्यवहारिक स्वास्थ्य के मूल्यांकन के लिए एक आधारभूत कारक है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `Totally agree` - Totally agree (पूर्णतः सहमत)
  * `Agree` - Agree (सहमत)
  * `Disagree` - Disagree (असहमत)
  * `Totally disagree` - Totally disagree (पूर्णतः असहमत)

---

### 3. Do you consume digital adult content to cope with negative emotions or stress?
* **Hindi Question:** क्या आप तनाव या नकारात्मक भावनाओं से निपटने के लिए डिजिटल सामग्री का उपयोग करते हैं?
* **Question ID:** `use_as_emotional_coping`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Using digital stimulants to escape stress can reinforce dopamine-related escape cycles.
* **Clinical Importance (HI):** तनाव से बचने के लिए डिजिटल उत्तेजक पदार्थों का उपयोग डोपामाइन चक्र को बढ़ावा दे सकता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No` - No, rarely (नहीं, शायद ही कभी)
  * `Sometimes` - Sometimes (कभी-कभी)
  * `Yes` - Yes, regularly (हाँ, नियमित रूप से)

---

### 4. Have you noticed needing more extreme content over time to achieve the same response?
* **Hindi Question:** क्या आपने समय के साथ समान प्रतिक्रिया के लिए अधिक तीव्र सामग्री की आवश्यकता महसूस की है?
* **Question ID:** `escalation_pattern`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Escalation in stimuli intensity is a marker studied in neurological habituation models.
* **Clinical Importance (HI):** उत्तेजना की तीव्रता में वृद्धि का न्यूरोलॉजिकल अभ्यस्तता मॉडल में अध्ययन किया जाता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No` - No (नहीं)
  * `Yes` - Yes (हाँ)
  * `Unsure` - Unsure (अनिश्चित)

---

### 5. Have you noticed any negative consequences in these areas due to digital consumption?
* **Hindi Question:** क्या आपने डिजिटल सेवन के कारण इन क्षेत्रों में कोई नकारात्मक प्रभाव महसूस किया है?
* **Question ID:** `negative_consequences_noticed`
* **Type:** `dropdown`
* **Required:** `Yes`
* **Clinical Importance (EN):** Evaluating daily functional impacts helps distinguish healthy use from habituation.
* **Clinical Importance (HI):** दैनिक कार्यात्मक प्रभावों का मूल्यांकन स्वस्थ उपयोग और आदत में अंतर करने में मदद करता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No negative consequences` - No negative consequences (कोई नकारात्मक प्रभाव नहीं)
  * `Sleep` - Impacts sleep quality / schedules (नींद की गुणवत्ता और शेड्यूल प्रभावित)
  * `Relationship` - Impacts intimacy or partner communication (अंतरंगता या साथी के साथ संवाद प्रभावित)
  * `Work/study focus` - Impacts daily concentration or work (दैनिक एकाग्रता या काम प्रभावित)
  * `Real-life sexual interest` - Alters interest in real-life intimacy (वास्तविक अंतरंगता में रुचि प्रभावित)

---

### 6. Have you previously attempted to reduce consumption but found it difficult to maintain?
* **Hindi Question:** क्या आपने पहले सेवन को कम करने का प्रयास किया है लेकिन इसे बनाए रखना कठिन लगा?
* **Question ID:** `attempts_to_cut_down_failed`
* **Type:** `segmented`
* **Required:** `Yes`
* **Clinical Importance (EN):** Challenges in modifying consumption behavior provide insights into behavioral reinforcement.
* **Clinical Importance (HI):** खपत व्यवहार को बदलने में आने वाली चुनौतियाँ व्यवहारिक सुदृढ़ीकरण की समझ प्रदान करती हैं।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No` - No (नहीं)
  * `Yes` - Yes (हाँ)

---

### 7. What is your average daily time spent viewing sexual content?
* **Hindi Question:** यौन सामग्री देखने में आपका दैनिक औसत समय क्या है?
* **Question ID:** `daily_time_on_sexual_content`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Daily time expenditure on screen stimulants is linked to physical fatigue and posture stress.
* **Clinical Importance (HI):** स्क्रीन उत्तेजक पदार्थों पर दैनिक समय व्यतीत करना शारीरिक थकान और मुद्रा (posture) तनाव से जुड़ा है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `<30 min` - Less than 30 minutes (30 मिनट से कम)
  * `30-60 min` - 30 to 60 minutes (30 से 60 मिनट)
  * `1-2 hrs` - 1 to 2 hours (1 से 2 घंटे)
  * `2+ hrs` - More than 2 hours (2 घंटे से अधिक)

---

### 8. How often do you currently masturbate?
* **Hindi Question:** आप वर्तमान में कितनी बार हस्तमैथुन करते हैं?
* **Question ID:** `masturbation_frequency`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Helps establish a baseline pattern of solo sexual behavior. Frequency alone should not be interpreted as infertility or disease.
* **Clinical Importance (HI):** यह व्यक्तिगत व्यवहार के आधारभूत पैटर्न को समझने में मदद करता है। आवृत्ति को अकेले प्रजनन क्षमता या बीमारी के रूप में नहीं आंका जाना चाहिए।
* **Evidence Note (EN):** Not a direct infertility predictor; do not assign deterministic fertility risk from frequency alone.
* **Evidence Note (HI):** यह सीधे तौर पर बांझपन का संकेतक नहीं है; केवल आवृत्ति से जोखिम का आकलन न करें।
* **Options:**
  * `Never` - Never (कभी नहीं)
  * `Less than once a week` - Less than once a week (सप्ताह में एक बार से कम)
  * `1-2 times a week` - 1–2 times a week (सप्ताह में 1–2 बार)
  * `3-5 times a week` - 3–5 times a week (सप्ताह में 3–5 बार)
  * `6+ times a week` - 6+ times a week (सप्ताह में 6 या अधिक बार)

---

### 9. Has your masturbation frequency changed significantly compared with the past?
* **Hindi Question:** क्या अतीत की तुलना में आपके हस्तमैथुन की आवृत्ति में महत्वपूर्ण बदलाव आया है?
* **Question ID:** `masturbation_frequency_change`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** A change in behavior provides context about recent stress, habits, wellbeing, or other changes.
* **Clinical Importance (HI):** व्यवहार में बदलाव हाल के तनाव, आदतों, मानसिक स्वास्थ्य या अन्य परिवर्तनों के बारे में संदर्भ प्रदान करता है।
* **Evidence Note (EN):** Synthetic behavioral-context feature; requires expert review before clinical interpretation.
* **Evidence Note (HI):** व्यवहार-संदर्भ कारक; नैदानिक ​​व्याख्या से पहले विशेषज्ञ समीक्षा की आवश्यकता होती है।
* **Options:**
  * `No significant change` - No significant change (कोई महत्वपूर्ण बदलाव नहीं)
  * `Increased somewhat` - Increased somewhat (कुछ हद तक बढ़ा है)
  * `Increased significantly` - Increased significantly (काफी बढ़ गया है)
  * `Decreased somewhat` - Decreased somewhat (कुछ हद तक कम हुआ है)
  * `Decreased significantly` - Decreased significantly (काफी कम हो गया है)
  * `Not sure` - Not sure (निश्चित नहीं)

---

### 10. Do you sometimes feel that you masturbate more than you intended to?
* **Hindi Question:** क्या आपको कभी-कभी ऐसा लगता है कि आप अपनी इच्छा से अधिक हस्तमैथुन करते हैं?
* **Question ID:** `masturbation_control`
* **Type:** `radio`
* **Required:** `No`
* **Clinical Importance (EN):** Assesses perceived control rather than treating masturbation frequency itself as a problem.
* **Clinical Importance (HI):** यह हस्तमैथुन की आवृत्ति को समस्या मानने के बजाय स्वयं के नियंत्रण की भावना का आकलन करता है।
* **Evidence Note (EN):** Aligns with the existing non-judgmental loss-of-control framing used for sexual behavior.
* **Evidence Note (HI):** यौन व्यवहार के लिए नियंत्रण की कमी के गैर-निर्णयात्मक ढांचे के साथ संरेखित है।
* **Options:**
  * `Never` - Never (कभी नहीं)
  * `Sometimes` - Sometimes (कभी-कभी)
  * `Often` - Often (अक्सर)
  * `Almost always` - Almost always (लगभग हमेशा)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 11. Has masturbation ever interfered with your daily life?
* **Hindi Question:** क्या हस्तमैथुन ने कभी आपके दैनिक जीवन में बाधा डाली है?
* **Question ID:** `masturbation_functional_impact`
* **Type:** `radio`
* **Required:** `No`
* **Clinical Importance (EN):** Identifies whether a behavior is associated with meaningful functional impact.
* **Clinical Importance (HI):** यह पहचानता है कि क्या कोई व्यवहार दैनिक जीवन और कार्यप्रणाली पर कोई सार्थक प्रभाव डालता है।
* **Evidence Note (EN):** Use for wellness/symptom routing; not as a standalone infertility predictor.
* **Evidence Note (HI):** कल्याण/लक्षण मार्गदर्शन के लिए उपयोग करें; सीधे तौर पर बांझपन संकेतक नहीं है।
* **Options:**
  * `No impact` - No impact (कोई प्रभाव नहीं)
  * `Studies / work` - Studies / work (पढ़ाई / काम)
  * `Sleep` - Sleep (नींद)
  * `Relationships` - Relationships (आपसी संबंध)
  * `Sexual activity with a partner` - Sexual activity with a partner (साथी के साथ यौन गतिविधि)
  * `Mental wellbeing` - Mental wellbeing (मानसिक स्वास्थ्य व कल्याण)
  * `Other` - Other (अन्य)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 12. Have you experienced any physical discomfort related to masturbation or ejaculation?
* **Hindi Question:** क्या आपने हस्तमैथुन या स्खलन से संबंधित किसी शारीरिक परेशानी का अनुभव किया है?
* **Question ID:** `masturbation_physical_discomfort`
* **Type:** `radio`
* **Required:** `No`
* **Clinical Importance (EN):** Helps identify symptoms that may warrant follow-up rather than assuming a behavioral cause.
* **Clinical Importance (HI):** शारीरिक लक्षणों की पहचान करने में मदद करता है जिनके लिए नैदानिक जांच की आवश्यकता हो सकती है।
* **Evidence Note (EN):** Pain or injury should route to symptom guidance/clinical review rather than a deterministic fertility score.
* **Evidence Note (HI):** दर्द या चोट को नैदानिक समीक्षा की ओर निर्देशित किया जाना चाहिए, न कि प्रजनन क्षमता के स्कोर के रूप में।
* **Options:**
  * `No` - No (नहीं)
  * `Occasional discomfort` - Occasional discomfort (कभी-कभार होने वाली परेशानी)
  * `Frequent discomfort` - Frequent discomfort (अक्सर होने वाली परेशानी)
  * `Pain` - Pain (दर्द)
  * `Skin irritation / injury` - Skin irritation / injury (त्वचा में जलन / चोट)
  * `Other` - Other (अन्य)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 13. Do you ever use masturbation to cope with stress, boredom, loneliness, anxiety, or difficult emotions?
* **Hindi Question:** क्या आप कभी तनाव, बोरियत, अकेलेपन, चिंता या कठिन भावनाओं से निपटने के लिए हस्तमैथुन का सहारा लेते हैं?
* **Question ID:** `masturbation_emotional_coping`
* **Type:** `radio`
* **Required:** `No`
* **Clinical Importance (EN):** Connects sexual behavior with the existing stress/coping pathway and can support personalized wellness guidance.
* **Clinical Importance (HI):** यह यौन व्यवहार को मौजूदा तनाव/प्रबंधन मार्गों से जोड़ता है और व्यक्तिगत कल्याण मार्गदर्शन का समर्थन कर सकता है।
* **Evidence Note (EN):** Contextual behavioral feature; does not imply masturbation causes infertility.
* **Evidence Note (HI):** प्रासंगिक व्यवहारिक कारक; यह संकेत नहीं देता कि हस्तमैथुन से बांझपन होता है।
* **Options:**
  * `Never` - Never (कभी नहीं)
  * `Sometimes` - Sometimes (कभी-कभी)
  * `Often` - Often (अक्सर)
  * `Very often` - Very often (बहुत अक्सर)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

## Category 10: Performance Anxiety (यौन प्रदर्शन चिंता)
> **Description (EN):** Anxiety variables related to intimacy.
> **Description (HI):** अंतरंगता से संबंधित मानसिक तनाव और चिंता का विश्लेषण।

### 1. Do you experience worry or performance concern before sexual intimacy?
* **Hindi Question:** क्या आप यौन अंतरंगता से पहले चिंता या प्रदर्शन संबंधी तनाव महसूस करते हैं?
* **Question ID:** `anticipatory_anxiety_before_sex`
* **Type:** `radio`
* **Required:** `No`
* **Clinical Importance (EN):** Anticipatory anxiety activates sympathetic fight-or-flight reflexes, modifying vascular dynamics.
* **Clinical Importance (HI):** पूर्वानुमानित चिंता तनाव प्रतिक्रियाओं को सक्रिय करती है, जो रक्त प्रवाह की गतिशीलता को बदल सकती है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `never_had_sex` - Never had sex / Not active (यौन संबंध कभी नहीं रहे / वर्तमान में सक्रिय नहीं)
  * `Never` - Never (कभी नहीं)
  * `Sometimes` - Sometimes (कभी-कभी)
  * `Often` - Often (अक्सर)
  * `Always` - Always / Constantly (हमेशा / लगातार)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 2. What is the primary nature of your performance concern?
* **Hindi Question:** आपकी प्रदर्शन संबंधी चिंता की प्राथमिक प्रकृति क्या है?
* **Question ID:** `primary_fear_type`
* **Type:** `dropdown`
* **Required:** `No`
* **Clinical Importance (EN):** Identifying specific stress categories aids in customizing psychosexual and physiological coping mechanisms.
* **Clinical Importance (HI):** विशिष्ट तनाव श्रेणियों की पहचान करने से मनोवैज्ञानिक और शारीरिक प्रबंधन तकनीकों को अनुकूलित करने में मदद मिलती है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `Inability to get/maintain erection` - Erection maintenance concerns (तनाव (erection) बनाए रखने की चिंता)
  * `Ejaculating too quickly` - Premature ejaculation concerns (शीघ्रपतन की चिंता)
  * `Taking too long` - Delayed ejaculation concerns (स्खलन में बहुत अधिक समय लगने की चिंता)
  * `Partner dissatisfaction` - Fear of partner dissatisfaction (साथी की संतुष्टि न होने का डर)
  * `Other` - Other concerns / Not applicable (अन्य चिंताएं / लागू नहीं)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 3. Have you avoided intimate situations due to performance concerns or fear?
* **Hindi Question:** क्या आपने प्रदर्शन संबंधी चिंताओं या डर के कारण अंतरंग स्थितियों से परहेज किया है?
* **Question ID:** `sexual_avoidance_due_to_fear`
* **Type:** `radio`
* **Required:** `No`
* **Clinical Importance (EN):** Avoidance behaviors can reinforce anxiety cycles and impact relationship dynamics.
* **Clinical Importance (HI):** परहेज करने का व्यवहार चिंता चक्र को मजबूत कर सकता है और संबंधों को प्रभावित कर सकता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No` - No (नहीं)
  * `Sometimes` - Sometimes (कभी-कभी)
  * `Yes` - Yes, regularly (हाँ, नियमित रूप से)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 4. Do you find yourself comparing real-life interactions to digital performance standards?
* **Hindi Question:** क्या आप वास्तविक जीवन के अनुभवों की तुलना डिजिटल प्रदर्शन मानकों से करते हैं?
* **Question ID:** `partner_comparison_porn_vs_reality`
* **Type:** `segmented`
* **Required:** `No`
* **Clinical Importance (EN):** Unrealistic standards from digital media can elevate performance anxiety levels during real-life intimacy.
* **Clinical Importance (HI):** डिजिटल मीडिया के अवास्तविक मानक वास्तविक जीवन के दौरान प्रदर्शन की चिंता को बढ़ा सकते हैं।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No` - No (नहीं)
  * `Yes` - Yes (हाँ)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 5. During intimacy, do you closely monitor your performance mentally (spectatoring)?
* **Hindi Question:** अंतरंगता के दौरान, क्या आप मानसिक रूप से अपने प्रदर्शन की बारीकी से निगरानी करते हैं?
* **Question ID:** `cognitive_self_monitoring_during_sex`
* **Type:** `radio`
* **Required:** `No`
* **Clinical Importance (EN):** Self-monitoring (spectatoring) disrupts sensory focus and increases adrenaline levels.
* **Clinical Importance (HI):** स्व-निगरानी (spectatoring) संवेदी ध्यान को बाधित करती है और एड्रेनालाईन के स्तर को बढ़ाती है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `Totally agree` - Always / Totally agree (हमेशा / पूर्णतः सहमत)
  * `Agree` - Often / Agree (अक्सर / सहमत)
  * `Disagree` - Rarely / Disagree (दुर्लभ / असहमत)
  * `Totally disagree` - Never / Totally disagree (कभी नहीं / पूर्णतः असहमत)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 6. Have you experienced sudden, unexpected erectile or ejaculatory difficulties?
* **Hindi Question:** क्या आपने अचानक, अप्रत्याशित रूप से तनाव या स्खलन संबंधी कठिनाइयों का अनुभव किया है?
* **Question ID:** `history_of_unexpected_sexual_difficulty`
* **Type:** `radio`
* **Required:** `No`
* **Clinical Importance (EN):** Unexpected difficulties provide markers for evaluating vascular, nervous, or anxiety factors.
* **Clinical Importance (HI):** अचानक आई कठिनाइयाँ रक्त प्रवाह, तंत्रिका या चिंता से जुड़े कारकों के मूल्यांकन में मदद करती हैं।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No` - No, never (नहीं, कभी नहीं)
  * `Yes` - Yes, occasionally (हाँ, कभी-कभार)
  * `Prefer not to say` - Prefer not to say (कहना नहीं चाहता)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 7. Do you feel digital content has shaped your performance expectations?
* **Hindi Question:** क्या आपको लगता है कि डिजिटल सामग्री ने आपके प्रदर्शन की अपेक्षाओं को आकार दिया है?
* **Question ID:** `pornography_driven_performance_standard`
* **Type:** `radio`
* **Required:** `No`
* **Clinical Importance (EN):** Performance expectation profiles provide context for cognitive-behavioral counseling guidance.
* **Clinical Importance (HI):** प्रदर्शन की अपेक्षा के प्रोफाइल संज्ञानात्मक-व्यवहार संबंधी परामर्श के लिए संदर्भ प्रदान करते हैं।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No` - No (नहीं)
  * `Yes` - Yes (हाँ)
  * `Unsure` - Unsure (अनिश्चित)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 8. Have you ever had sexual intercourse with a partner?
* **Hindi Question:** क्या आपने कभी किसी साथी के साथ यौन संबंध बनाए हैं?
* **Question ID:** `partnered_sexual_history`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Provides context so that partnered-sex questions can be shown only when relevant.
* **Clinical Importance (HI):** यह आवश्यक संदर्भ प्रदान करता है ताकि साथी के साथ संबंधों से जुड़े प्रश्न केवल प्रासंगिक होने पर ही दिखाए जाएं।
* **Evidence Note (EN):** Do not treat sexual experience as a fertility predictor.
* **Evidence Note (HI):** यौन अनुभव को प्रजनन क्षमता के संकेतक के रूप में न आंका जाए।
* **Options:**
  * `Yes` - Yes (हाँ)
  * `No` - No (नहीं)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 9. When was the last time you had sexual intercourse with a partner?
* **Hindi Question:** आपने पिछली बार किसी साथी के साथ यौन संबंध कब बनाए थे?
* **Question ID:** `recent_partnered_sex`
* **Type:** `radio`
* **Required:** `No`
* **Clinical Importance (EN):** Provides context for recent sexual activity and symptom interpretation.
* **Clinical Importance (HI):** यह हाल की यौन गतिविधि और संबंधित लक्षणों की व्याख्या के लिए संदर्भ प्रदान करता है।
* **Evidence Note (EN):** Use for context and conditional routing; not a direct fertility-risk measure.
* **Evidence Note (HI):** संदर्भ और स्थितिजन्य मार्ग निर्धारण के लिए उपयोग करें; सीधे बांझपन जोखिम का माप नहीं है।
* **Options:**
  * `Within the past week` - Within the past week (पिछले एक सप्ताह के भीतर)
  * `1-4 weeks ago` - 1–4 weeks ago (1-4 सप्ताह पहले)
  * `1-3 months ago` - 1–3 months ago (1-3 महीने पहले)
  * `3-12 months ago` - 3–12 months ago (3-12 महीने पहले)
  * `More than a year ago` - More than a year ago (एक साल से अधिक समय पहले)
  * `Not applicable` - Not applicable (लागु नहीं)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 10. Have you experienced any difficulty during partnered sexual activity?
* **Hindi Question:** क्या आपने साथी के साथ यौन गतिविधि के दौरान किसी कठिनाई का अनुभव किया है?
* **Question ID:** `partnered_sexual_difficulty`
* **Type:** `radio`
* **Required:** `No`
* **Clinical Importance (EN):** Helps identify sexual-function symptoms and route the user toward appropriate education or clinical follow-up.
* **Clinical Importance (HI):** यह यौन-कार्यप्रणाली के लक्षणों की पहचान करने में मदद करता है और उपयोगकर्ता को उचित नैदानिक ​​परामर्श की ओर निर्देशित करता है।
* **Evidence Note (EN):** Relevant to sexual-health screening; should not automatically be equated with infertility.
* **Evidence Note (HI):** यौन स्वास्थ्य जांच के लिए प्रासंगिक; स्वचालित रूप से बांझपन के समान नहीं माना जाना चाहिए।
* **Options:**
  * `No` - No (नहीं)
  * `Difficulty getting an erection` - Difficulty getting an erection (तनाव प्राप्त करने में कठिनाई (erection difficulty))
  * `Difficulty maintaining an erection` - Difficulty maintaining an erection (तनाव बनाए रखने में कठिनाई)
  * `Ejaculating sooner than desired` - Ejaculating sooner than desired (शीघ्र स्खलन (ejaculating sooner))
  * `Difficulty ejaculating` - Difficulty ejaculating (स्खलन में कठिनाई)
  * `Pain/discomfort` - Pain/discomfort (दर्द या बेचैनी)
  * `Reduced sexual desire` - Reduced sexual desire (यौन इच्छा में कमी)
  * `Other` - Other (अन्य)
  * `Not applicable` - Not applicable (लागु नहीं)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

## Category 11: Body Image & Perception (शारीरिक छवि व धारणा)
> **Description (EN):** Self-perception and physical comfort profiles.
> **Description (HI):** आत्म-धारणा और शारीरिक आराम स्तर का विश्लेषण।

### 1. Rate your overall satisfaction with your physical build (1 = Low, 5 = High):
* **Hindi Question:** शारीरिक बनावट से अपनी समग्र संतुष्टि को रेट करें (1 = कम, 5 = अधिक):
* **Question ID:** `general_body_satisfaction`
* **Type:** `radio`
* **Required:** `No`
* **Clinical Importance (EN):** Body image satisfaction correlates with self-esteem and baseline psychological cortisol levels.
* **Clinical Importance (HI):** शारीरिक संतुष्टि का स्तर आत्मसम्मान और शरीर में तनाव हार्मोन (cortisol) के स्तर को प्रभावित करता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `1` - Very unsatisfied (1) (बहुत असंतुष्ट (1))
  * `2` - Unsatisfied (2) (असंतुष्ट (2))
  * `3` - Neutral (3) (सामान्य (3))
  * `4` - Satisfied (4) (संतुष्ट (4))
  * `5` - Very satisfied (5) (बहुत संतुष्ट (5))
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 2. Do you feel pressure to achieve a more muscular or defined physique?
* **Hindi Question:** क्या आप अधिक मस्कुलर या फिट शरीर पाने का दबाव महसूस करते हैं?
* **Question ID:** `physique_muscularity_pressure`
* **Type:** `radio`
* **Required:** `No`
* **Clinical Importance (EN):** Body pressure metrics help identify underlying stress triggers related to body dysmorphia.
* **Clinical Importance (HI):** शारीरिक दबाव के मेट्रिक्स शरीर की बनावट से जुड़े तनाव के कारणों की पहचान करने में मदद करते हैं।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No` - No (नहीं)
  * `Sometimes` - Sometimes (कभी-कभी)
  * `Yes` - Yes, regularly (हाँ, नियमित रूप से)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 3. Do you experience worry or self-doubt regarding your genital size or appearance?
* **Hindi Question:** क्या आप अपने जननांगों के आकार या रूप को लेकर चिंता या आत्म-संदेह महसूस करते हैं?
* **Question ID:** `genital_self_image_concern`
* **Type:** `radio`
* **Required:** `No`
* **Clinical Importance (EN):** Genital image concerns are major contributors to performance anxiety and avoidance behavior.
* **Clinical Importance (HI):** जननांगों की बनावट को लेकर चिंता प्रदर्शन की घबराहट और अंतरंगता से बचने की आदतों को जन्म दे सकती है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No` - No, never (नहीं, कभी नहीं)
  * `Sometimes` - Sometimes (कभी-कभी)
  * `Yes` - Yes, regularly (हाँ, नियमित रूप से)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

### 4. How often do you compare your body to physiques shown on social media?
* **Hindi Question:** आप सोशल मीडिया पर दिखाई देने वाले शरीरों से अपने शरीर की तुलना कितनी बार करते हैं?
* **Question ID:** `social_media_body_comparison_frequency`
* **Type:** `radio`
* **Required:** `No`
* **Clinical Importance (EN):** Frequent comparison habits are linked to lowered mood scores and higher chronic stress.
* **Clinical Importance (HI):** बार-बार तुलना करने की आदतें मानसिक स्वास्थ्य में गिरावट और बढ़े हुए तनाव से जुड़ी हैं।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `Never` - Never (कभी नहीं)
  * `Occasionally` - Occasionally (कभी-कभार)
  * `Regularly` - Regularly (नियमित रूप से)
  * `Constantly` - Constantly / Multiple times daily (लगातार / दिन में कई बार)
  * `prefer_not_to_say` - Prefer not to say (कहना नहीं चाहता)

---

## Category 12: Social & Relational Context (सामाजिक व पारस्परिक संबंध)
> **Description (EN):** Partner variables and relationship timeline variables.
> **Description (HI):** जीवनसाथी और आपसी संबंधों से संबंधित स्वास्थ्य कारक।

### 1. Rate your overall satisfaction with your current relationship:
* **Hindi Question:** अपने वर्तमान संबंध से अपनी समग्र संतुष्टि को रेट करें:
* **Question ID:** `relationship_satisfaction`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Relational harmony acts as a primary buffer against stress-induced hormonal changes.
* **Clinical Importance (HI):** संबंधों में मधुरता तनाव से उत्पन्न होने वाले शारीरिक और हार्मोनल बदलावों के खिलाफ सुरक्षा कवच का काम करती है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `Satisfied` - Satisfied / Supportive (संतुष्ट / सहयोगी)
  * `Neutral` - Neutral / Average (सामान्य / औसत)
  * `Unsatisfied` - Unsatisfied / Strained (असंतुष्ट / तनावपूर्ण)
  * `Not applicable` - Not applicable (No partner) (लागु नहीं (कोई साथी नहीं है))

---

### 2. How would you describe your overall level of loneliness (UCLA-3 proxy)?
* **Hindi Question:** आप अपने समग्र अकेलेपन के स्तर का वर्णन कैसे करेंगे (UCLA-3 पैमाने के अनुसार)?
* **Question ID:** `perceived_loneliness_ucla3`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Social isolation is associated with baseline blood pressure elevations and high stress.
* **Clinical Importance (HI):** सामाजिक अलगाव का सीधा संबंध बुनियादी रक्तचाप में वृद्धि और उच्च मानसिक तनाव से है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `Low` - Low loneliness / Well connected (कम अकेलापन / लोगों से जुड़े हुए)
  * `Moderate` - Moderate loneliness (मध्यम अकेलापन)
  * `High` - High perceived loneliness (अधिक अकेलापन)

---

### 3. Do you feel comfortable discussing intimate health concerns with family members?
* **Hindi Question:** क्या आप परिवार के सदस्यों के साथ अंतरंग स्वास्थ्य चिंताओं पर चर्चा करने में सहज महसूस करते हैं?
* **Question ID:** `family_communication_comfort`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Communication comfort profiles indicate social support barriers for clinical consultations.
* **Clinical Importance (HI):** संवाद सहजता प्रोफाइल सामाजिक और पारिवारिक समर्थन की सीमाओं की ओर इशारा करते हैं।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `Yes` - Yes, comfortable (हाँ, सहज महसूस करता हूँ)
  * `Somewhat` - Somewhat / Comfortable with select members (कुछ हद तक / केवल चुनिंदा सदस्यों के साथ)
  * `No` - No, uncomfortable (नहीं, असहज हूँ)

---

### 4. Do you feel pressure from friends or peers regarding sexual benchmarks?
* **Hindi Question:** क्या आप दोस्तों या साथियों से यौन प्रदर्शन संबंधी मानकों को लेकर दबाव महसूस करते हैं?
* **Question ID:** `peer_pressure_sexual_behavior`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Peer pressure parameters shape personal expectations and trigger intimacy-related performance strain.
* **Clinical Importance (HI):** सहकर्मियों का दबाव व्यक्तिगत अपेक्षाओं को प्रभावित करता है और अंतरंगता संबंधी तनाव को बढ़ाता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No` - No (नहीं)
  * `Sometimes` - Sometimes (कभी-कभी)
  * `Yes` - Yes (हाँ)

---

## Category 13: Coping Mechanism Mapping (तनाव प्रबंधन प्रणालियाँ)
> **Description (EN):** Strategies for stress resolution and management.
> **Description (HI):** तनाव समाधान और प्रबंधन के लिए अपनाई जाने वाली रणनीतियाँ।

### 1. What is your primary method for managing high stress or workload?
* **Hindi Question:** अत्यधिक तनाव या काम के बोझ को प्रबंधित करने का आपका प्राथमिक तरीका क्या है?
* **Question ID:** `primary_stress_coping_method`
* **Type:** `dropdown`
* **Required:** `Yes`
* **Clinical Importance (EN):** Coping profiles show if you rely on healthy recovery loops or habits that introduce other risk vectors.
* **Clinical Importance (HI):** तनाव प्रबंधन के तरीके दर्शाते हैं कि आप स्वस्थ आदतें अपनाते हैं या ऐसे साधन जो नए जोखिम लाते हैं।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `Exercise` - Exercise / Sport (व्यायाम / खेलकूद)
  * `Meditation or prayer` - Meditation / Prayer / Mindfulness (ध्यान / प्रार्थना / माइंडफुलनेस)
  * `Talking to someone` - Talking to partner or friends (साथी या दोस्तों से बात करना)
  * `Music or art` - Music / Creative hobby (संगीत / रचनात्मक शौक)
  * `Sleep` - Sleep / Rest (नींद / आराम)
  * `Gaming` - Video Games / Digital media (वीडियो गेम्स / डिजिटल मीडिया)
  * `Social media` - Social media browsing (सोशल मीडिया ब्राउज़िंग)
  * `Substance use` - Substance use (smoking, alcohol, etc.) (धूम्रपान, शराब या अन्य पदार्थ)
  * `Pornography` - Pornography use (पोर्नोग्राफी का उपयोग)

---

### 2. Do you feel able to manage and regulate intense negative emotions effectively?
* **Hindi Question:** क्या आप तीव्र नकारात्मक भावनाओं को प्रभावी ढंग से प्रबंधित और नियंत्रित करने में सक्षम महसूस करते हैं?
* **Question ID:** `emotional_regulation_ability`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Emotional regulation correlates with stress management and cortisol stability indices.
* **Clinical Importance (HI):** भावनाओं को नियंत्रित करने की क्षमता का संबंध तनाव प्रबंधन और स्थिर कोर्टिसोल के स्तर से होता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `Yes` - Yes, mostly (हाँ, अधिकांशतः)
  * `Somewhat` - Somewhat (कुछ हद तक)
  * `No` - No, find it difficult (नहीं, मुझे कठिनाई होती है)

---

### 3. Do you sleep excessively as a method of escaping stress or worries?
* **Hindi Question:** क्या आप तनाव या चिंताओं से बचने के लिए अत्यधिक सोते हैं?
* **Question ID:** `sleep_as_escape`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Using sleep as a primary avoidance strategy is studied within behavioral health frameworks.
* **Clinical Importance (HI):** तनाव से बचने के लिए सोने की आदत का व्यवहारिक स्वास्थ्य प्रणालियों के तहत अध्ययन किया जाता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No` - No, rarely (नहीं, शायद ही कभी)
  * `Sometimes` - Sometimes (कभी-कभी)
  * `Yes` - Yes, regularly (हाँ, नियमित रूप से)

---

### 4. Do you increase your substance use (smoking/drinking) when under high stress?
* **Hindi Question:** क्या अत्यधिक तनाव में होने पर आपके धूम्रपान या शराब पीने की मात्रा बढ़ जाती है?
* **Question ID:** `substance_use_under_stress`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Stress-triggered substance escalations amplify target endocrine and vascular risk factors.
* **Clinical Importance (HI):** तनाव के दौरान पदार्थों का अधिक सेवन अंतःस्रावी और रक्त परिसंचरण संबंधी जोखिमों को बढ़ा देता है।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No substance use` - No / Do not use substances (नहीं / नशीले पदार्थों का सेवन नहीं करता)
  * `Smoking` - Smoking / Tobacco increase (हाँ, धूम्रपान/तंबाकू का सेवन बढ़ जाता है)
  * `Alcohol` - Alcohol consumption increase (हाँ, शराब पीने की मात्रा बढ़ जाती है)
  * `Cannabis` - Cannabis usage increase (हाँ, भांग/गांजे का सेवन बढ़ जाता है)

---

### 5. Do you practice mindfulness, meditation, or breathing exercises?
* **Hindi Question:** क्या आप ध्यान (meditation), माइंडफुलनेस या सांस लेने के व्यायाम का अभ्यास करते हैं?
* **Question ID:** `mindfulness_or_meditation_practice`
* **Type:** `radio`
* **Required:** `Yes`
* **Clinical Importance (EN):** Regular breathing practices support blood pressure stability and lower baseline heart rates.
* **Clinical Importance (HI):** नियमित ध्यान और श्वास अभ्यास रक्तचाप की स्थिरता और हृदय गति को संतुलित रखने में मदद करते हैं।
* **Evidence Note (EN):** Clinical screening parameter.
* **Evidence Note (HI):** नैदानिक ​​स्क्रीनिंग पैरामीटर।
* **Options:**
  * `No` - No (नहीं)
  * `Occasional` - Occasionally (कभी-कभार)
  * `Yes (regular)` - Yes, regularly (हाँ, नियमित रूप से)

---

