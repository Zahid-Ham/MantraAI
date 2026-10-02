Yes. I went through the **actual 86-question MantraAI schema** you attached and cross-checked the question domains against current clinical guidelines, systematic reviews, meta-analyses, and validated psychometric instruments. Your reviewer is right to ask for this: for a research paper, you should be able to say **“this item was included because X literature/guideline supports this domain”**, not merely “we thought it might affect fertility.”

The important finding is that **your questionnaire is not equally evidence-supported right now**. Some blocks are very strong, some are reasonable contextual variables, and several individual questions need to be **reworded, downgraded to contextual variables, or removed** before you call the questionnaire clinically/evidence validated.

Your attached document contains **13 categories and 86 questions**, including lifestyle, heat, diet, environmental exposure, mental health, reproductive history, medications, sexual behavior, performance anxiety, body image, social context, and coping. 

---

# 1. First: the most important correction for your paper

Do **not** write:

> "Each question is a clinically validated predictor of infertility."

That is not true for your current schema.

Instead, your methodology should say something like:

> **"Questionnaire items were derived from evidence-informed domains identified in male infertility guidelines, semen-quality literature, environmental/occupational exposure literature, validated psychometric instruments, and sexual-health research. Items were subsequently mapped to their intended construct and subjected to expert content validation."**

This is much more defensible.

The AUA/ASRM guideline itself explicitly says lifestyle, medication and environmental risk factors have been studied, but that evidence for many individual risk factors is limited and confounded. ([American Urological Association][1])

And WHO makes an important distinction: **fertility/infertility is ultimately a couple-level clinical outcome**, while semen analysis provides information about male reproductive function; your questionnaire therefore should be framed as **screening/context/risk-factor assessment**, not an infertility diagnosis. ([World Health Organization][2])

---

# 2. Evidence grading system I recommend

For your schema, use these labels:

| Grade                     | Meaning                                                              |
| ------------------------- | -------------------------------------------------------------------- |
| 🟢 **A — Strong**         | Guideline / systematic review / meta-analysis / validated instrument |
| 🟢 **B — Good**           | Multiple human studies or established clinical domain                |
| 🟡 **C — Contextual**     | Reasonable to ask, but not a direct fertility predictor              |
| 🟠 **D — Weak/uncertain** | Evidence exists but inconsistent                                     |
| 🔴 **E — Remove/rework**  | Current wording overstates evidence or isn't specifically supported  |

This will make your reviewer discussion much easier.

---

# BLOCK 1 — DEMOGRAPHICS

Your current Block 1 contains age, BMI, city, residential area, occupation, education and relationship status. 

### 1. `age_years` — 🟢 A/B

**Question:** What is your age?

**Keep.**

Age is a legitimate male reproductive-health variable. A large systematic review/meta-analysis covering 90 studies and 93,839 men found age-associated declines in semen volume, motility, progressive motility, morphology and DNA fragmentation-related measures. ([PubMed][3])

A later systematic review of 40,668 men also found that most included studies supported an association between advancing paternal age and increased sperm DNA fragmentation. ([PubMed][4])

**Best sources:**

[Consistent age-dependent declines in human semen quality — PubMed](https://pubmed.ncbi.nlm.nih.gov/25462195/?utm_source=chatgpt.com)

[Advanced Paternal Age and Sperm DNA Fragmentation — PubMed](https://pubmed.ncbi.nlm.nih.gov/33987998/?utm_source=chatgpt.com)

---

### 2. `bmi_category` — 🟢 A/B

**Keep, but use actual BMI if possible.**

A 2024 systematic review/meta-analysis involving **71,337 subjects** found obesity was associated with reductions in semen volume, total sperm number, total motility, progressive motility and normal morphology. ([PubMed][5])

The EAU guideline also explicitly lists obesity among lifestyle factors associated with decreased sperm quality. ([Uroweb][6])

**Better implementation:**

Instead of asking:

> BMI category?

collect:

> Height + weight

and calculate BMI.

That gives you a real numerical variable.

---

### 3. `city_region` — 🟡 C

This is **not a direct fertility question**.

Your document currently justifies it through AQI/environmental exposure. 

That's reasonable **if your system actually links location to an environmental exposure dataset**.

So rename its construct:

> **Environmental exposure context**

not:

> fertility risk factor.

You can then connect city → CPCB/air-quality data later.

---

### 4. `residential_area_type` — 🟡 C / 🔴 if used as fertility predictor

Urban/rural/industrial area itself is not a validated sperm-quality predictor.

The *exposures associated with those environments* can be relevant.

Therefore:

**Keep only if:**

```text
Residential area
        ↓
Environmental exposure estimation
        ↓
PM2.5 / pollution / occupational exposure
```

Otherwise remove.

---

### 5. `occupation_type` — 🟢 B

**Keep.**

Occupation is useful because it acts as a proxy for:

* heat exposure
* chemical exposure
* prolonged sitting
* radiation
* physical workload

Occupational exposure literature supports considering workplace heat, metals, pesticides and radiation in male fertility assessment. ([PubMed][7])

The AUA/ASRM guideline also includes environmental and lifestyle risk-factor history in male infertility evaluation. ([ASRM][8])

---

### 6. `education_level` — 🟡 C

This is **not a fertility predictor**.

But it can be justified as:

> health-literacy / personalization variable.

Don't include it in a fertility-risk score.

Use it for:

```text
education level
       ↓
content complexity
       ↓
personalized education
```

---

### 7. `relationship_status` — 🟡 C

Useful for:

* family-planning context
* sexual-health routing
* whether partnered-sex questions are relevant.

But **do not score relationship status as fertility risk**.

---

# BLOCK 2 — LIFESTYLE BEHAVIORS

This is one of your strongest blocks.

Your schema explicitly includes smoking, alcohol, drugs, activity, sitting, sleep irregularity and sleep duration. 

## 8. `smoking_status` — 🟢 A

**Strongly keep.**

A meta-analysis of 20 studies/5,865 men found smoking associated with lower sperm count, motility and morphology. ([PubMed][9])

Another meta-analysis of 16 studies involving 10,823 infertile men found significantly higher oligozoospermia among smokers. ([PubMed][10])

---

## 9. `alcohol_frequency` — 🟢 B

Keep, but don't claim:

> "Any alcohol = infertility."

A meta-analysis of 15 studies/16,395 men found detrimental associations particularly with semen volume and morphology, with stronger differences for daily vs occasional consumption. ([PubMed][11])

The EAU guideline specifically recommends addressing high alcohol intake. ([Uroweb][6])

---

## 10. `recreational_drug_use` — 🟢 B

Keep.

Especially the **anabolic-steroid component**.

But separate:

```text
Recreational substances
```

from:

```text
Anabolic steroids / exogenous testosterone
```

because the latter is a particularly important fertility-specific exposure.

---

## 11. `physical_activity_level` — 🟢 B

Keep.

A systematic review/meta-analysis of 32 manuscripts found recreational activity may benefit some semen parameters, while elite/intense activity can sometimes be detrimental; cycling also deserves separate consideration. ([PubMed][12])

The EAU guideline recommends lifestyle improvement including increased physical activity in appropriate infertile men. ([Uroweb][6])

---

## 12. `hours_sitting_per_day` — 🟢 B

Keep, but be careful with your exact threshold.

A recent systematic review specifically examined sedentary behavior and semen parameters. ([PubMed][13])

Don't state:

> "4 hours causes immotile sperm."

Instead:

> "Prolonged sedentary behavior has been investigated in relation to semen parameters."

That is scientifically safer.

---

## 13. `irregular_sleep` — 🟡 B/C

Keep, but call it:

> **Sleep regularity / sleep disruption**

rather than claiming it directly changes testosterone.

Human studies have found associations between sleep health and semen quality. ([PubMed][14])

---

## 14. `sleep_duration` — 🟢 B

Definitely keep.

Studies involving hundreds of men have found associations between short/long sleep and semen quality. ([PubMed][15])

---

# BLOCK 3 — HEAT EXPOSURE

Your document describes this as a scrotal-hyperthermia block. 

This is a **good domain**, but several individual questions need fixing.

---

## 15. `laptop_on_lap` — 🟡 B/C

There is experimental evidence that laptop use on the lap can increase scrotal temperature.

But don't translate that directly into:

> "Laptop use causes infertility."

Use:

> **Potential localized heat exposure**

This is an appropriate research variable.

---

## 16. `mobile_phone_placement` — 🟠 D

This is one I would **not keep in its current high-weight form**.

There are studies/meta-analyses reporting associations between mobile-phone/RF exposure and sperm parameters. ([PubMed][16])

But the newest human observational evidence says the certainty around RF-EMF effects is **very low/uncertain**, and specifically found little/no clear effect of carrying a phone in the front pocket. ([PubMed][17])

So:

### Change from:

> "Where do you carry your phone?"

### To:

> **"How frequently do you keep a mobile device close to the groin for prolonged periods?"**

And label it:

> **Environmental exposure — evidence uncertain**

Don't assign a large fertility-risk weight.

---

## 17. `underwear_type` — 🟠 D

There is biological plausibility around scrotal temperature, but evidence isn't strong enough to say:

> Briefs = fertility risk.

I'd either:

**remove it from scoring**, or

keep it only as:

> thermal-environment lifestyle context.

---

## 18. `hot_bath_frequency` — 🟢 B

Keep.

Heat exposure has a longstanding experimental/clinical literature concerning spermatogenesis. Occupational heat exposure has also been reviewed in relation to male fertility. ([PubMed][18])

---

## 19. `working_in_hot_conditions` — 🟢 B

Keep.

Occupational heat exposure is a legitimate reproductive-health exposure domain. ([PubMed][18])

---

## 20. `cycling_hours_per_week` — 🟢 B

Keep, but don't say:

> Cycling causes infertility.

Use:

> **High-volume cycling exposure**

because the literature suggests possible effects depending on intensity/type. ([PubMed][12])

---

# BLOCK 4 — DIET & NUTRITION

This is where I would make **major modifications**.

Your current block contains diet type, fruit/vegetable intake, processed foods, fried foods, soy/dal, water and supplements. 

---

## 21. `diet_type` — 🟡 C

Being vegetarian/non-vegetarian/vegan **by itself is not a fertility risk variable**.

Instead ask:

> **"How closely does your diet resemble a healthy whole-food dietary pattern?"**

You can then justify the construct using healthy dietary-pattern literature.

---

## 22. `fruit_veg_intake` — 🟢 B

Keep.

Healthy dietary patterns rich in fruits/vegetables and antioxidants have been associated with better semen parameters.

A 2022 systematic review/meta-analysis found healthy dietary patterns were associated with higher sperm concentration, total sperm count and progressive motility. ([PubMed][19])

A 2025 meta-analysis also found Mediterranean diet adherence associated with higher total and progressive motility, sperm count and morphology, although fertility-outcome evidence remains more limited. ([PubMed][20])

---

## 23. `processed_food_frequency` — 🟡 C

Potentially useful, but your current justification is too strong.

Instead of:

> processed foods increase inflammation → fertility risk

say:

> **Dietary pattern / ultra-processed food exposure**

and treat it as exploratory.

---

## 24. `fried_food_frequency` — 🟡 C

Same problem.

There is dietary-quality literature, but "fried food frequency" is not itself a validated infertility predictor.

Use as part of a broader **diet quality score**, not standalone fertility weight.

---

## 25. `soy_phytoestrogen_intake` — 🔴 REMOVE/REWORK

**This is one of the questions I would definitely change.**

Your current schema says soy/dal phytoestrogens can affect hormonal balance. 

That's too simplistic.

Soy is also a healthy protein source, and you don't have sufficient justification to make:

> daily dal/soy = reproductive risk

a scoring rule.

This is exactly the type of question a reviewer may challenge.

**My recommendation: REMOVE it from the fertility risk score.**

If you want a nutrition question, use:

> overall protein/diet quality

instead.

---

## 26. `water_intake` — 🔴 REMOVE FROM FERTILITY SCORE

Hydration is important for general health, but there is not a strong evidence basis for:

> 1 L vs 2 L vs 3 L → sperm quality risk.

Keep it only if you're building a **general wellness module**.

---

## 27. `supplement_use` — 🟠 D

Keep as **medical history**, not as a fertility-risk score.

This is particularly important because the EAU guideline says evidence is not conclusive for routine antioxidant treatment in idiopathic infertility. ([Uroweb][6])

So don't build:

```text
CoQ10 = protective
Zinc = protective
Omega-3 = protective
```

without expert/clinical evidence.

---

# BLOCK 5 — ENVIRONMENTAL EXPOSURE

Your schema includes pollution, pesticides, heavy metals, heated plastics and workplace EMF. 

This is a **very defensible research domain**.

---

## 28. `proximity_to_industrial_or_traffic` — 🟢 B

Keep as environmental exposure context.

But ideally don't use:

> "Lives near highway = fertility risk."

Instead:

```text
location
 ↓
PM2.5 / pollution exposure
 ↓
environmental exposure feature
```

---

## 29. `pesticide_occupational_exposure` — 🟢 A/B

Very strong.

A 2022 systematic review of 64 human studies found pesticide exposure associated with semen parameters and sperm DNA/chromosomal outcomes. ([PubMed][21])

A newer systematic review/meta-analysis also found associations between organophosphate exposure and sperm concentration/motility/morphology, although some sensitivity analyses weakened specific associations. ([PubMed][22])

Excellent question for your paper.

---

## 30. `heavy_metal_occupational_exposure` — 🟢 B

Keep.

Lead/cadmium and other occupational toxicants have been studied in relation to semen quality and male fertility. ([PubMed][7])

---

## 31. `plastic_use_hot_food_water` — 🟡 B/C

There is literature on BPA and male reproductive outcomes. A systematic review/meta-analysis found urinary BPA associated with lower sperm concentration and total sperm count, although the overall evidence remains complex. ([PubMed][23])

But:

> "I drink hot tea from plastic"

doesn't directly measure BPA exposure.

So change it to:

> **"How frequently are you exposed to hot food/drinks stored or heated in plastic containers?"**

and classify as **potential endocrine-disruptor exposure**, not a direct fertility score.

---

## 32. `emf_radiation_at_work` — 🟠 D / REWORK

This question currently combines:

* telecom towers
* radiology/X-ray
* high-voltage electricity.

Those are **not the same exposure**.

Radiation relevant to reproductive toxicity is particularly important for **ionizing radiation**. ([PubMed][24])

RF-EMF evidence is much more uncertain. ([PubMed][17])

### Split it:

**A. Occupational ionizing radiation**

* radiology
* radiation oncology
* nuclear medicine

**B. RF/microwave exposure**

* telecom/radar/etc.

Do not combine them into one risk factor.

---

# BLOCK 6 — MENTAL HEALTH & STRESS

This block is important, but your implementation has a **major methodological issue**.

Your schema explicitly calls PSS-10, GAD-7 and PHQ-9 embedded instruments. 

---

## 33. `daily_work_hours` — 🟡 C

Good wellness/stress variable.

Not a direct sperm-quality predictor.

Use it for:

> stress/recovery context.

---

## 34. `perceived_stress_pss10` — 🟢 A as a scale, 🔴 current implementation

PSS is a validated psychometric instrument. ([DOI][25])

But your current schema appears to use:

> 0 / 16 / 33

as a slider.

That is **not administering PSS-10**.

PSS-10 has 10 items and a total score from **0–40**.

Therefore:

### You have two choices:

**Option A — implement actual PSS-10**

or

**Option B — remove the name PSS-10**

and call it:

> perceived stress level (0–10)

Do **not** call a three-point slider "PSS-10."

This is exactly the sort of thing a reviewer can catch.

---

## 35. `gad7_score` — 🟢 A as validated scale, 🔴 current implementation

GAD-7 is a validated 7-item instrument. ([PubMed][26])

Your app should either:

```text
Ask the actual 7 GAD-7 items
↓
Calculate 0–21 score
```

or:

> "Enter your previously obtained GAD-7 score."

Don't present a slider with 0/8/16 and call it GAD-7.

---

## 36. `phq9_score` — 🟢 A as validated scale, 🔴 current implementation

Same issue.

PHQ-9 is a validated 9-item measure. ([PubMed][27])

Implement the actual PHQ-9 or explicitly ask for a previously obtained score.

---

## 37. `sleep_quality_psqi_proxy` — 🟢 B, but rename

Your document literally says **PSQI proxy**.

That is good because you're not claiming it is the actual PSQI.

But don't write:

> "PSQI score."

The actual PSQI is a 19-item instrument generating seven components. ([PubMed][28])

Your four questions can remain:

> **Sleep quality screening**

rather than PSQI.

---

# BLOCK 7 — REPRODUCTIVE HISTORY & SYMPTOMS

This is one of your **strongest blocks** for a fertility-focused paper.

Your attached schema specifically includes STI history, trauma, mumps, varicocele, abstinence, libido and ejaculation symptoms. 

---

## 38. `prior_sti_history` — 🟡 B

Keep, but don't overstate.

A 2024 systematic review of 70 studies concluded that evidence linking STIs and male infertility is **equivocal overall**, with stronger evidence for some organisms such as Ureaplasma/Mycoplasma. ([PubMed][29])

Therefore:

> **STI history → clinical context**

not:

> STI = infertility.

---

## 39. `scrotal_or_groin_injury` — 🟢 B

Keep.

Testicular trauma has documented associations with reproductive outcomes and semen abnormalities. ([PubMed][30])

---

## 40. `childhood_disease_mumps` — 🟢 B

Keep, but specifically ask:

> **"Mumps infection after puberty / history of mumps orchitis?"**

because the fertility concern is particularly related to **mumps orchitis**, especially post-pubertal disease. ([PubMed][31])

---

## 41. `known_varicocele` — 🟢 A

Definitely keep.

This is one of the strongest questions in your questionnaire.

Current EAU guidance reports varicocele in a substantial proportion of infertile men and describes associations with worsening semen parameters and testicular dysfunction. ([Uroweb][6])

The AUA/ASRM guideline also addresses clinical varicocele as a correctable male-factor condition. ([ASRM][32])

---

## 42. `sexual_abstinence_period_days` — 🟢 A

Excellent question.

WHO recommends a **2–7 day abstinence interval** for semen analysis. ([World Health Organization][33])

A systematic review/meta-analysis also specifically examines abstinence duration and semen parameters. ([PubMed][34])

Important:

This is relevant **when interpreting semen analysis**, not necessarily as a chronic infertility risk factor.

So change the construct to:

> **Semen-analysis interpretation factor**

---

## 43. `libido_changes` — 🟢 B/C

Keep for **sexual/endocrine screening**, not direct sperm prediction.

ASRM specifically says clinicians should assess diminished libido in men presenting for infertility evaluation. ([ASRM][35])

But your current statement:

> "Libido directly reflects androgen concentration"

is too strong. Research shows an association but individual libido is not a reliable testosterone diagnostic test. ([PubMed][36])

---

## 44. `ejaculation_concerns` — 🟢 A/B

Strongly keep.

ASRM recommends evaluation for ejaculatory dysfunction in men undergoing infertility evaluation. ([ASRM][35])

AUA/ASRM guidance also discusses ejaculatory duct obstruction and ejaculatory dysfunction. ([AUAA Journals][37])

---

# BLOCK 8 — SUBSTANCE & MEDICATION

This is another strong block.

---

## 45. `anabolic_steroid_use` — 🟢 A

**Definitely keep.**

Exogenous testosterone/anabolic steroids suppress endogenous gonadotropin signaling and sperm production.

This is explicitly relevant to male infertility evaluation.

---

## 46. `finasteride_use` — 🟢 B

Keep, but phrase carefully.

A randomized controlled study found temporary reductions in total sperm count with finasteride/dutasteride exposure. ([PubMed][38])

Another study found changes in semen parameters during finasteride treatment. ([PubMed][39])

But don't tell users:

> "Finasteride causes infertility."

Instead:

> **"Certain medications can affect semen or sexual-function parameters in some men."**

---

## 47. `antidepressant_use_ssri` — 🟢 B

Keep.

A 2022 systematic review/meta-analysis found SSRI exposure associated with reductions in sperm concentration, motility and morphology, although the number of studies was small and further research was recommended. ([PubMed][40])

A 2025 systematic review also emphasizes that the overall antidepressant/fertility evidence remains incomplete. ([PubMed][41])

---

## 48. `antihypertensive_use` — 🟡 B/C

Keep for medication history, not automatic fertility risk.

Some antihypertensive classes have associations with sexual dysfunction, but evidence varies substantially by drug class. ([PubMed][42])

So change:

> "blood pressure medications affect fertility"

to:

> **"Medication history relevant to sexual/reproductive function."**

---

## 49. `chemotherapy_history` — 🟢 A

Excellent.

Chemotherapy and radiotherapy can cause gonadotoxicity and impair spermatogenesis. ([PubMed][43])

---

## 50. `other_long_term_medication` — 🟡 C

Keep as **clinical history**, but don't score it automatically.

The app should eventually ask:

> medication name

rather than simply:

> yes/no.

Then map the medication against a trusted drug database.

---

# BLOCK 9 — DIGITAL SEXUAL BEHAVIOR

This is where you need to be particularly careful.

Your schema contains pornography frequency, control, emotional coping, escalation, negative consequences, failed attempts to reduce, time spent, masturbation frequency/change/control/impact/discomfort/coping. 

This block is **not a male-infertility block**.

It is a:

> **sexual-behavior / behavioral-health block**

That distinction will protect your paper.

---

## 51. `pornography_use_frequency` — 🟡 B

Can be used for behavioral-health research.

But frequency alone doesn't diagnose problematic use.

A systematic review of measurement instruments found common constructs include:

* impaired control
* salience
* mood modification
* interpersonal conflict
* life conflict. ([PubMed][44])

---

## 52. `perceived_control_over_use` — 🟢 B

Good.

Perceived loss of control is much more defensible than raw frequency.

---

## 53. `use_as_emotional_coping` — 🟢 B

Good.

A systematic review of problematic pornography determinants identified stress, coping style, avoidance, loneliness and emotional factors among relevant psychological/social determinants. ([PubMed][45])

---

## 54. `escalation_pattern` — 🟡 B/D

Keep only as exploratory.

Don't claim:

> neurochemical tolerance has occurred.

The evidence around "porn tolerance/escalation" is conceptually debated.

Use:

> **"Perceived escalation in content intensity."**

---

## 55. `negative_consequences_noticed` — 🟢 B

Strong behavioral-health variable.

Problematic pornography-use instruments commonly examine interpersonal and life conflict/negative consequences. ([PubMed][44])

---

## 56. `attempts_to_cut_down_failed` — 🟢 B

Good behavioral-control indicator.

---

## 57. `daily_time_on_sexual_content` — 🟡 B

Keep as exposure/context.

Don't claim:

> 2 hours = infertility.

---

## 58. `masturbation_frequency` — 🔴 **NOT a fertility predictor**

This is one of the most important corrections.

Your current document actually handles this correctly: it says frequency alone should **not** be interpreted as infertility or disease. 

**Keep the question only for behavioral context.**

Do NOT assign:

```text
6+ times/week → fertility risk
```

That would be scientifically indefensible.

---

## 59. `masturbation_frequency_change` — 🟡 C

Keep as behavioral context.

Your schema itself already calls this a synthetic behavioral-context feature requiring expert review. 

Good.

---

## 60. `masturbation_control` — 🟢 B

Good.

Focus on:

> perceived loss of control

rather than frequency.

---

## 61. `masturbation_functional_impact` — 🟢 B

Good.

Functional impairment is much more meaningful than frequency.

---

## 62. `masturbation_physical_discomfort` — 🟢 B

Good, but this should trigger:

> **symptom assessment / clinical referral**

rather than fertility scoring.

Your own schema correctly states that pain/injury should route toward clinical review rather than a deterministic fertility score. 

---

## 63. `masturbation_emotional_coping` — 🟢 B

Good as behavioral-health context.

And your current wording correctly states that it **does not imply masturbation causes infertility**. 

---

# BLOCK 10 — SEXUAL PERFORMANCE ANXIETY

This block is defensible, but again **not a sperm-quality predictor**.

---

## 64. `anticipatory_anxiety_before_sex` — 🟢 B

Good.

Sexual performance anxiety is a recognized contributor to sexual dysfunction. A review reports associations with premature ejaculation and psychogenic ED. ([PubMed][46])

---

## 65. `primary_fear_type` — 🟢 B

Good.

The clinical domains—erection, ejaculation, partner dissatisfaction—are appropriate sexual-function screening domains.

---

## 66. `sexual_avoidance_due_to_fear` — 🟢 B

Good behavioral/psychological variable.

---

## 67. `partner_comparison_porn_vs_reality` — 🟡 C

Potentially useful but evidence is not strong enough to make this a fertility predictor.

Use it as:

> psychosexual context.

---

## 68. `cognitive_self_monitoring_during_sex` — 🟢 B

This is a recognized concept in sexual-performance-anxiety literature, although your exact wording should be linked to the underlying psychometric/sexological literature.

---

## 69. `history_of_unexpected_sexual_difficulty` — 🟢 B

Keep.

ASRM recommends assessment of erectile/ejaculatory dysfunction in infertile men. ([ASRM][35])

---

## 70. `pornography_driven_performance_standard` — 🟡 C

Keep only as psychosexual context.

---

## 71. `partnered_sexual_history` — 🟢 C

This is **contextual routing**, not fertility risk.

Your schema correctly says not to treat sexual experience as a fertility predictor. 

This is actually a good question because it lets you conditionally show partnered-sex questions.

---

## 72. `recent_partnered_sex` — 🟢 C

Keep only for:

* symptom interpretation
* sexual-health context
* routing.

Not fertility scoring.

---

## 73. `partnered_sexual_difficulty` — 🟢 B

Keep.

This is a valid sexual-function screening domain and should route to appropriate guidance/referral rather than automatically becoming "infertility risk." 

---

# BLOCK 11 — BODY IMAGE

Your current block contains four questions. 

---

## 74. `general_body_satisfaction` — 🟡 B

Reasonable for mental/sexual wellness.

Not a sperm-quality variable.

---

## 75. `physique_muscularity_pressure` — 🟡 B

Useful if your product includes:

* body image
* anabolic steroid risk
* sexual confidence.

It shouldn't feed the fertility score directly.

---

## 76. `genital_self_image_concern` — 🟢 B

This is actually defensible.

The **Male Genital Self-Image Scale (MGSIS)** has been validated and related to sexual-function measures. ([PubMed][47])

A later cultural-validation study also demonstrated good validity/reliability. ([PubMed][48])

So instead of your own arbitrary question, I'd seriously consider using **MGSIS-derived items**.

That will make your paper substantially stronger.

---

## 77. `social_media_body_comparison_frequency` — 🟡 B/C

Reasonable for body-image/mental-wellness research.

Not a fertility predictor.

---

# BLOCK 12 — SOCIAL & RELATIONAL CONTEXT

---

## 78. `relationship_satisfaction` — 🟡 B

Useful for:

* psychosocial wellbeing
* sexual function
* relationship support.

Not direct sperm-quality prediction.

---

## 79. `perceived_loneliness_ucla3` — 🟢 B

If you want to claim **UCLA-3**, use the actual validated instrument rather than inventing three broad categories.

The UCLA Loneliness Scale Version 3 has established reliability and validity. ([PubMed][49])

Loneliness/social isolation is associated with stress and broader health outcomes. ([PubMed][50])

---

## 80. `family_communication_comfort` — 🟡 C

Good for:

> help-seeking / social support barriers.

Not fertility prediction.

---

## 81. `peer_pressure_sexual_behavior` — 🟡 C

Potentially useful in adolescent/young-adult sexual-health research.

But again:

> **not a sperm-quality predictor.**

---

# BLOCK 13 — COPING MECHANISM

Your current block includes coping method, emotional regulation, sleep-as-escape, stress-related substance use and mindfulness. 

---

## 82. `primary_stress_coping_method` — 🟢 B

Good for the **behavioral intervention/recommendation engine**.

Don't put it directly into fertility risk.

---

## 83. `emotional_regulation_ability` — 🟢 B

Good mental-wellness construct.

---

## 84. `sleep_as_escape` — 🟡 C

Good behavioral-health question, but not a fertility predictor.

---

## 85. `substance_use_under_stress` — 🟢 B

Very useful because it connects:

```text
stress
 ↓
smoking/alcohol/substance use
 ↓
known reproductive exposure
```

This is actually a nice feature for your recommendation engine.

---

## 86. `mindfulness_or_meditation_practice` — 🟡 B

Good as a wellness/protective-behavior variable.

But don't claim:

> meditation increases sperm quality.

Instead:

> **"Mindfulness practice may support stress management and mental wellbeing."**

---

# 3. The BIGGEST problem I found in your questionnaire

Your reviewer asking for evidence may actually help you **improve the research paper substantially**.

You currently have **three different constructs mixed together**:

### A. Male reproductive/fertility factors

```text
Age
BMI
Smoking
Alcohol
Heat
Pesticides
Varicocele
Mumps
Trauma
Steroids
Medication
Chemotherapy
Semen-related history
```

### B. Sexual-health factors

```text
ED
ejaculatory difficulty
libido
performance anxiety
sexual history
```

### C. Behavioral/mental-wellness factors

```text
Pornography
masturbation
body image
loneliness
stress
coping
relationship
```

These **should not all contribute to the same "fertility score."**

That is probably the most important architectural change I'd make.

---

# 4. Your scoring architecture should become this

Instead of:

```text
86 questions
      ↓
ONE FERTILITY SCORE
```

do:

```text
                    MANTRAAI
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
 Reproductive     Sexual Health   Behavioral
    Health                          Wellness
        │              │              │
        ↓              ↓              ↓
 Fertility-context  Sexual-function  Habit/mental
    profile            profile        profile
        │              │              │
        └──────────────┼──────────────┘
                       ↓
             Personalized report
```

Then the AI can explain:

> **Reproductive-health factors identified**

> **Sexual-health factors identified**

> **Behavioral-wellness factors identified**

That is much more scientifically defensible.

---

# 5. Your questionnaire should have an Evidence Matrix

This is what I strongly recommend you add to your GitHub repository.

Create:

```text
research/
   questionnaire_evidence_matrix.csv
   questionnaire_evidence_matrix.xlsx
   references.bib
   references.md
```

Each question should have:

| Field                        | Example                               |
| ---------------------------- | ------------------------------------- |
| `question_id`                | smoking_status                        |
| `question`                   | What is your tobacco smoking status?  |
| `block`                      | Lifestyle                             |
| `construct`                  | Tobacco exposure                      |
| `target_outcome`             | Semen quality                         |
| `evidence_level`             | A                                     |
| `evidence_type`              | Meta-analysis                         |
| `primary_reference`          | Bundhun et al., 2019                  |
| `secondary_reference`        | Sharma et al., 2016                   |
| `pmid`                       | 30621647                              |
| `doi`                        | ...                                   |
| `relationship`               | Associated with reduced semen quality |
| `causal_claim_allowed`       | No                                    |
| `risk_score_allowed`         | Yes                                   |
| `clinical_review_required`   | No                                    |
| `expert_validation_required` | Yes                                   |

Then your reviewer can literally inspect:

> **Question → construct → evidence → paper → intended use**

That is **excellent research documentation**.

---

# 6. Your strongest evidence hierarchy

For your paper, I'd use this hierarchy:

### Tier 1 — Clinical guidelines

1. **WHO 2021 semen manual**
2. **WHO 2025 infertility guideline**
3. **AUA/ASRM Male Infertility Guideline**
4. **EAU Male Infertility Guideline**

The WHO manual provides standardized evidence-based procedures for semen examination and is your most important source for semen-related variables. ([World Health Organization][33])

[WHO — Laboratory Manual for the Examination and Processing of Human Semen, 6th edition](https://www.who.int/publications/i/item/9789240030787?utm_source=chatgpt.com)

[AUA/ASRM Male Infertility Guideline](https://www.asrm.org/practice-guidance/practice-committee-documents/diagnosis-and-treatment-of-infertility-in-men-auaasrm-guideline-part-i-2020/?utm_source=chatgpt.com)

[EAU Male Infertility Guideline](https://uroweb.org/guidelines/sexual-and-reproductive-health/chapter/male-infertility?utm_source=chatgpt.com)

---

# 7. Tier 2 — Systematic reviews/meta-analyses

Your most useful ones are:

### Lifestyle

[Smoking and semen quality meta-analysis](https://pubmed.ncbi.nlm.nih.gov/27113031/?utm_source=chatgpt.com)

[Alcohol and semen quality meta-analysis](https://pubmed.ncbi.nlm.nih.gov/28029592/?utm_source=chatgpt.com)

[Physical activity and semen quality meta-analysis](https://pubmed.ncbi.nlm.nih.gov/30671700/?utm_source=chatgpt.com)

[BMI and semen quality meta-analysis](https://pubmed.ncbi.nlm.nih.gov/39003321/?utm_source=chatgpt.com)

### Diet

[Healthy dietary patterns and semen quality meta-analysis](https://pubmed.ncbi.nlm.nih.gov/35915543/?utm_source=chatgpt.com)

[Mediterranean diet and semen quality meta-analysis](https://pubmed.ncbi.nlm.nih.gov/40419219/?utm_source=chatgpt.com)

### Sleep

[Sleep duration/quality and semen quality study](https://pubmed.ncbi.nlm.nih.gov/31830732/?utm_source=chatgpt.com)

### Environment

[Pesticides and male fertility systematic review](https://pubmed.ncbi.nlm.nih.gov/35793270/?utm_source=chatgpt.com)

[BPA and semen quality systematic review/meta-analysis](https://pubmed.ncbi.nlm.nih.gov/38668517/?utm_source=chatgpt.com)

### Medications

[SSRIs and semen quality meta-analysis](https://pubmed.ncbi.nlm.nih.gov/36188547/?utm_source=chatgpt.com)

[Finasteride/dutasteride and semen parameters trial](https://pubmed.ncbi.nlm.nih.gov/17299062/?utm_source=chatgpt.com)

---

# 8. Tier 3 — Validated instruments

This is **very important for your paper**.

Don't create your own mental-health scales.

Use:

### PSS-10

[Perceived Stress Scale — Cohen et al.](https://doi.org/10.1037/T02889-000?utm_source=chatgpt.com)

### GAD-7

[GAD-7 original validation](https://pubmed.ncbi.nlm.nih.gov/16717171/?utm_source=chatgpt.com)

### PHQ-9

[PHQ-9 original validation](https://pubmed.ncbi.nlm.nih.gov/11556941/?utm_source=chatgpt.com)

### PSQI

[Pittsburgh Sleep Quality Index](https://pubmed.ncbi.nlm.nih.gov/2748771/?utm_source=chatgpt.com)

### UCLA Loneliness

[UCLA Loneliness Scale Version 3](https://pubmed.ncbi.nlm.nih.gov/8576833/?utm_source=chatgpt.com)

### MGSIS

[Male Genital Self-Image Scale validation](https://pubmed.ncbi.nlm.nih.gov/23551571/?utm_source=chatgpt.com)

These instruments give you a **much stronger methodological foundation** than inventing your own scales.

---

# 9. Questions I would immediately change before reviewer submission

If I were reviewing your project, these would jump out at me:

### 🔴 Change/remove

**`soy_phytoestrogen_intake`**

Don't treat soy/dal as fertility risk.

**`water_intake`**

General wellness only.

**`education_level`**

Health-literacy variable, not fertility.

**`relationship_status`**

Context only.

**`residential_area_type`**

Only retain if linked to actual environmental exposure.

**`mobile_phone_placement`**

Evidence is too uncertain for a strong score.

**`underwear_type`**

Contextual/experimental rather than strong predictor.

**`emf_radiation_at_work`**

Split ionizing radiation from RF exposure.

**PSS-10 slider**

Replace with actual PSS-10.

**GAD-7 slider**

Replace with actual GAD-7 or call it self-reported GAD-7 score.

**PHQ-9 slider**

Replace with actual PHQ-9 or previously obtained score.

**PSQI proxy**

Do not call it PSQI.

---

# 10. And there's one very important research-paper distinction

Your reviewer shouldn't expect:

> **86 questions × 86 independent research papers**

That's not how a good questionnaire is normally justified.

Instead:

> **Question → construct/domain → evidence base**

For example:

```text
Smoking
 │
 ├── smoking exposure
 │
 ├── semen quality
 │
 ├── sperm motility
 │
 └── sperm morphology
       ↓
Systematic reviews/meta-analyses
```

One high-quality systematic review can support **multiple questions within a construct**.

Likewise:

```text
Varicocele
 ↓
Male infertility guideline
 ↓
Semen parameters
 ↓
Question: known varicocele
```

And:

```text
Stress
 ↓
PSS-10
 ↓
validated instrument

PLUS

Stress
 ↓
male reproductive outcomes
 ↓
supporting fertility literature
```

That's a much more academically correct way to build your evidence matrix.

---

# 11. Most important: don't claim "validated questionnaire" yet

At the moment, you have an **evidence-informed questionnaire**.

You can only call it something like:

> **"evidence-informed questionnaire developed from literature and clinical guidelines"**

until you actually perform:

### Content validation

Experts rate:

* relevance
* clarity
* necessity
* comprehensiveness

Then calculate an appropriate content-validity metric.

### Construct validation

With enough respondents:

* factor analysis
* internal consistency where applicable
* convergent/discriminant validity

### Criterion validity

Where you have a gold/reference standard, e.g.:

```text
Questionnaire
     ↓
Semen analysis
     ↓
Reference clinical result
```

This is the point where your project becomes genuinely research-grade.

---

# 12. Your proposed research methodology can now be very strong

I would formulate it as:

```text
Literature & Guidelines
        ↓
Domain Identification
        ↓
Question Generation
        ↓
Evidence Mapping
        ↓
Expert Review
        ↓
Content Validity
        ↓
Questionnaire Revision
        ↓
Pilot Study
        ↓
Reliability / Construct Analysis
        ↓
Clinical Reference Comparison
        ↓
Final Questionnaire
```

Then your paper can honestly say:

> **"The questionnaire was not constructed from arbitrary lifestyle assumptions; each domain and item was mapped to an explicit evidence source and subsequently reviewed by subject-matter experts."**

That sentence is going to be **far more valuable to your reviewer** than saying you have 86 questions.

---

## My overall verdict on your current 86 questions

| Block                         | Verdict                                                       |
| ----------------------------- | ------------------------------------------------------------- |
| **1 Demographics**            | 🟡 Keep, but separate contextual variables                    |
| **2 Lifestyle**               | 🟢 Strong                                                     |
| **3 Heat**                    | 🟢 Good, but downgrade phone/underwear                        |
| **4 Diet**                    | 🟡 Needs substantial cleanup                                  |
| **5 Environment**             | 🟢 Strong research potential                                  |
| **6 Mental health**           | 🟢 Strong if validated scales are implemented correctly       |
| **7 Reproductive history**    | 🟢 **Very strong**                                            |
| **8 Medication/substance**    | 🟢 **Very strong**                                            |
| **9 Digital sexual behavior** | 🟢 Good behavioral-health block, **not fertility prediction** |
| **10 Performance anxiety**    | 🟢 Good sexual-health block                                   |
| **11 Body image**             | 🟡 Good wellness block; use MGSIS                             |
| **12 Social context**         | 🟡 Good psychosocial context                                  |
| **13 Coping**                 | 🟡 Good intervention/recommendation block                     |

So **I would not throw away your questionnaire**. You've actually got a strong foundation. But I would **reclassify it into evidence-backed constructs and remove the unsupported causal claims**.

The attached schema already contains some excellent safeguards—for example, it explicitly says masturbation frequency should not be treated as infertility, and that sexual history should not be treated as a fertility predictor.   Those are exactly the kinds of distinctions I would preserve throughout the entire questionnaire.

**Most importantly for your publication:** make the evidence matrix a formal research artifact, get a urologist/andrologist to review it, and only then freeze the questionnaire. Your final paper can then present **literature derivation → expert content validation → pilot validation → system evaluation**, rather than simply presenting an 86-question form.

[1]: https://www.auanet.org/documents/Guidelines/PDF/Male-Infertility-Guideline.pdf?utm_source=chatgpt.com "Diagnosis and Treatment of Infertility in Men: AUA/ASRM Guideline"
[2]: https://www.who.int/news/item/27-07-2021-who-launches-updated-manual-to-ensure-high-quality-testing-of-human-semen-in-clinical-and-research-settings?utm_source=chatgpt.com "WHO launches updated manual to ensure high quality testing of human semen in clinical and research settings"
[3]: https://pubmed.ncbi.nlm.nih.gov/25462195/?utm_source=chatgpt.com "Consistent age-dependent declines in human semen quality: a systematic review and meta-analysis - PubMed"
[4]: https://pubmed.ncbi.nlm.nih.gov/33987998/?utm_source=chatgpt.com "Advanced Paternal Age and Sperm DNA Fragmentation: A Systematic Review - PubMed"
[5]: https://pubmed.ncbi.nlm.nih.gov/39003321/?utm_source=chatgpt.com "Association between body mass index and semen quality: a systematic review and meta-analysis - PubMed"
[6]: https://uroweb.org/guidelines/s%2Axual-and-reproductive-health/chapter/male-infertility?utm_source=chatgpt.com "MALE INFERTILITY"
[7]: https://pubmed.ncbi.nlm.nih.gov/12725464/?utm_source=chatgpt.com "Effect of occupational exposures on male fertility: literature review - PubMed"
[8]: https://www.asrm.org/practice-guidance/practice-committee-documents/diagnosis-and-treatment-of-infertility-in-men-auaasrm-guideline-part-i-2020/?utm_source=chatgpt.com "Diagnosis and treatment of infertility in men: AUA/ASRM guideline part I (2020) | American Society for Reproductive Medicine | ASRM"
[9]: https://pubmed.ncbi.nlm.nih.gov/27113031/?utm_source=chatgpt.com "Cigarette Smoking and Semen Quality: A New Meta-analysis Examining the Effect of the 2010 World Health Organization Laboratory Methods for the Examination of Human Semen - PubMed"
[10]: https://pubmed.ncbi.nlm.nih.gov/30621647/?utm_source=chatgpt.com "Tobacco smoking and semen quality in infertile males: a systematic review and meta-analysis - PubMed"
[11]: https://pubmed.ncbi.nlm.nih.gov/28029592/?utm_source=chatgpt.com "Semen quality and alcohol intake: a systematic review and meta-analysis - PubMed"
[12]: https://pubmed.ncbi.nlm.nih.gov/30671700/?utm_source=chatgpt.com "An update on the implication of physical activity on semen quality: a systematic review and meta-analysis - PubMed"
[13]: https://pubmed.ncbi.nlm.nih.gov/39648572/?utm_source=chatgpt.com "The sitting men: A systematic review of spare and working time exposure to sedentariness in relation to semen parameters - PubMed"
[14]: https://pubmed.ncbi.nlm.nih.gov/32341784/?utm_source=chatgpt.com "Associations of bedtime, sleep duration, and sleep quality with semen quality in males seeking fertility treatment: a preliminary study - PubMed"
[15]: https://pubmed.ncbi.nlm.nih.gov/31830732/?utm_source=chatgpt.com "Sleep duration and quality in relation to semen quality in healthy men screened as potential sperm donors - PubMed"
[16]: https://pubmed.ncbi.nlm.nih.gov/24927498/?utm_source=chatgpt.com "Effect of mobile telephones on sperm quality: a systematic review and meta-analysis - PubMed"
[17]: https://pubmed.ncbi.nlm.nih.gov/38880061/?utm_source=chatgpt.com "The effects of radiofrequency exposure on male fertility: A systematic review of human observational studies with dose-response meta-analysis - PubMed"
[18]: https://pubmed.ncbi.nlm.nih.gov/9756281/?utm_source=chatgpt.com "Occupational heat exposure and male fertility: a review - PubMed"
[19]: https://pubmed.ncbi.nlm.nih.gov/35915543/?utm_source=chatgpt.com "The effect of healthy dietary patterns on male semen quality: a systematic review and meta-analysis - PubMed"
[20]: https://pubmed.ncbi.nlm.nih.gov/40419219/?utm_source=chatgpt.com "Mediterranean Diet, Semen Quality, and Medically Assisted Reproductive Outcomes in the Male Population: A Systematic Review and Meta-Analysis - PubMed"
[21]: https://pubmed.ncbi.nlm.nih.gov/35793270/?utm_source=chatgpt.com "The environmental and occupational influence of pesticides on male fertility: A systematic review of human studies - PubMed"
[22]: https://pubmed.ncbi.nlm.nih.gov/37964951/?utm_source=chatgpt.com "Impact of organophosphate pesticides exposure on human semen parameters and testosterone: a systematic review and meta-analysis - PubMed"
[23]: https://pubmed.ncbi.nlm.nih.gov/38668517/?utm_source=chatgpt.com "Bisphenol A Exposure Interferes with Reproductive Hormones and Decreases Sperm Counts: A Systematic Review and Meta-Analysis of Epidemiological Studies - PubMed"
[24]: https://pubmed.ncbi.nlm.nih.gov/30411532/?utm_source=chatgpt.com "Radiation effects on male fertility - PubMed"
[25]: https://doi.org/10.1037/T02889-000?utm_source=chatgpt.com "Perceived Stress Scale"
[26]: https://pubmed.ncbi.nlm.nih.gov/16717171/?utm_source=chatgpt.com "A brief measure for assessing generalized anxiety disorder: the GAD-7 - PubMed"
[27]: https://pubmed.ncbi.nlm.nih.gov/11556941/?utm_source=chatgpt.com "The PHQ-9: validity of a brief depression severity measure - PubMed"
[28]: https://pubmed.ncbi.nlm.nih.gov/2748771/?utm_source=chatgpt.com "The Pittsburgh Sleep Quality Index: a new instrument for psychiatric practice and research - PubMed"
[29]: https://pubmed.ncbi.nlm.nih.gov/38178949/?utm_source=chatgpt.com "Are sexually transmitted infections associated with male infertility? A systematic review and in-depth evaluation of the evidence and mechanisms of action of 11 pathogens - PubMed"
[30]: https://pubmed.ncbi.nlm.nih.gov/8863560/?utm_source=chatgpt.com "Testicular trauma: potential impact on reproductive function - PubMed"
[31]: https://pubmed.ncbi.nlm.nih.gov/20070300/?utm_source=chatgpt.com "The increasing incidence of mumps orchitis: a comprehensive review - PubMed"
[32]: https://www.asrm.org/practice-guidance/practice-committee-documents/diagnosis-and-treatment-of-infertility-in-men-aua-asrm-guideline-part2/?utm_source=chatgpt.com "Diagnosis and treatment of infertility in men: AUA/ASRM guideline part II | American Society for Reproductive Medicine | ASRM"
[33]: https://www.who.int/publications/i/item/9789240030787?utm_source=chatgpt.com "WHO laboratory manual for the examination and processing of human semen, 6th ed"
[34]: https://pubmed.ncbi.nlm.nih.gov/39434390/?utm_source=chatgpt.com "Impact of Shorter Abstinence Periods on Semen Parameters: A Systematic Review and Meta-Analysis - PubMed"
[35]: https://www.asrm.org/practice-guidance/practice-committee-documents/diagnostic-evaluation-of-sexual-dysfunction-in-the-male-partner-in-the-setting-of-infertility-a-committee-opinion-2018/?utm_source=chatgpt.com "Diagnostic evaluation of sexual dysfunction in the male partner in the setting of infertility: a committee opinion (2023) | American Society for Reproductive Medicine | ASRM"
[36]: https://pubmed.ncbi.nlm.nih.gov/16670164/?utm_source=chatgpt.com "The relationship between libido and testosterone levels in aging men - PubMed"
[37]: https://www.auajournals.org/doi/full/10.1097/JU.0000000000001520?utm_source=chatgpt.com "Diagnosis and Treatment of Infertility in Men: AUA/ASRM Guideline PART II | Journal of Urology"
[38]: https://pubmed.ncbi.nlm.nih.gov/17299062/?utm_source=chatgpt.com "The effect of 5alpha-reductase inhibition with dutasteride and finasteride on semen parameters and serum hormones in healthy men - PubMed"
[39]: https://pubmed.ncbi.nlm.nih.gov/32052367/?utm_source=chatgpt.com "Androgenetic alopecia: effects of oral finasteride on hormone profile, reproduction and sexual function - PubMed"
[40]: https://pubmed.ncbi.nlm.nih.gov/36188547/?utm_source=chatgpt.com "The effect of SSRIs on Semen quality: A systematic review and meta-analysis - PubMed"
[41]: https://pubmed.ncbi.nlm.nih.gov/40232638/?utm_source=chatgpt.com "Impact of Antidepressants on Male Fertility and Seminal Parameters: A Systematic Review - PubMed"
[42]: https://pubmed.ncbi.nlm.nih.gov/26450998/?utm_source=chatgpt.com "Antihypertensive Drugs and Male Sexual Dysfunction: A Review of Adult Hypertension Guideline Recommendations - PubMed"
[43]: https://pubmed.ncbi.nlm.nih.gov/39265489/?utm_source=chatgpt.com "Impacts of cancer therapy on male fertility: Past and present - PubMed"
[44]: https://pubmed.ncbi.nlm.nih.gov/31284745/?utm_source=chatgpt.com "Psychometric Instruments for Problematic Pornography Use: A Systematic Review - PubMed"
[45]: https://pubmed.ncbi.nlm.nih.gov/38026725/?utm_source=chatgpt.com "Biopsychosocial Determinants of Problematic Pornography Use: A Systematic Review - PubMed"
[46]: https://pubmed.ncbi.nlm.nih.gov/31447414/?utm_source=chatgpt.com "Sexual Performance Anxiety - PubMed"
[47]: https://pubmed.ncbi.nlm.nih.gov/23551571/?utm_source=chatgpt.com "The development and validation of the Male Genital Self-Image Scale: results from a nationally representative probability sample of men in the United States - PubMed"
[48]: https://pubmed.ncbi.nlm.nih.gov/37057502/?utm_source=chatgpt.com "Male Genital Self-Image Scale (MGSIS): Cutoff Point, Cultural Adaptation and Validation of Measurement Properties in Brazilian Men - PubMed"
[49]: https://pubmed.ncbi.nlm.nih.gov/8576833/?utm_source=chatgpt.com "UCLA Loneliness Scale (Version 3): reliability, validity, and factor structure - PubMed"
[50]: https://pubmed.ncbi.nlm.nih.gov/35714313/?utm_source=chatgpt.com "Human social isolation and stress: a systematic review of different contexts and recommendations for future studies - PubMed"
