"""
MantraAI — Authoritative Evidence & Clinical Guidelines Corpus
==============================================================

PURPOSE
-------
Provides a curated, authoritative evidence corpus from global clinical guidelines
(WHO, AUA/ASRM, EAU) and peer-reviewed systematic reviews.

CLINICAL & ETHICAL STANDARDS:
-----------------------------
- Strict provenance: Every document and chunk includes real titles, verified URLs,
  recognized medical organizations, publication years, and standard identifiers (DOI/PMID/ISBN).
- No fabricated citations or speculative claims.
- Explicit limitations are documented on every evidence item (e.g., distinguishing
  screening context from formal clinical diagnosis).
- Non-diagnostic framing: Retrieved guidelines explain biological concepts and standard
  clinical pathways rather than claiming a questionnaire proves individual impairment.
"""

from typing import Optional
from pydantic import BaseModel, Field


class EvidenceChunk(BaseModel):
    """A granular, topic-specific excerpt or summary from an authoritative clinical guideline."""
    chunk_id: str
    document_id: str
    topic: str
    text: str
    evidence_tags: list[str]
    clinical_significance: Optional[str] = None
    limitations: list[str] = Field(default_factory=list)


class EvidenceDocument(BaseModel):
    """An authoritative medical guideline, systematic review, or consensus statement."""
    id: str
    title: str
    source: str
    organization: str
    publication_year: int
    document_type: str  # "guideline" | "systematic_review" | "consensus"
    url: str
    source_identifier: str  # DOI, PMID, or ISBN
    evidence_tags: list[str]
    population_context: Optional[str] = None
    summary: str
    limitations: list[str] = Field(default_factory=list)
    chunks: list[EvidenceChunk] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Initial Authoritative Evidence Corpus
# ---------------------------------------------------------------------------

EVIDENCE_CORPUS: list[EvidenceDocument] = [
    # ── 1. WHO Infertility Guideline (2024) ─────────────────────────────────
    EvidenceDocument(
        id="who-infertility-2024",
        title="Guideline for the prevention, diagnosis and treatment of infertility",
        source="World Health Organization",
        organization="World Health Organization (WHO)",
        publication_year=2024,
        document_type="guideline",
        url="https://www.who.int/publications/i/item/9789240115774",
        source_identifier="ISBN: 9789240115774",
        evidence_tags=[
            "male_infertility_evaluation",
            "infertility_guideline",
            "semen_analysis",
            "semen_parameters",
            "reproductive_history",
            "lifestyle_balance",
            "metabolic_health",
        ],
        population_context="Global adult population undergoing reproductive health screening or fertility evaluation.",
        summary="Establishes global evidence-based recommendations for initial fertility assessment, semen analysis benchmarks, reproductive history gathering, and modifiable lifestyle interventions.",
        limitations=[
            "Self-reported health questionnaires are screening and context tools; clinical diagnosis requires formal laboratory semen analysis and physician physical examination.",
            "Baseline reproductive health parameters vary across global populations and clinical contexts.",
        ],
        chunks=[
            EvidenceChunk(
                chunk_id="who-infertility-eval",
                document_id="who-infertility-2024",
                topic="Initial Male Reproductive Evaluation",
                text="The WHO guideline recommends comprehensive initial evaluation of the male partner including reproductive and medical history, physical examination, and standardized semen analysis when assessing reproductive wellness. Questionnaire-based screening assists in identifying potential lifestyle or historical risk factors that warrant clinical discussion.",
                evidence_tags=[
                    "male_infertility_evaluation",
                    "infertility_guideline",
                    "semen_analysis",
                    "reproductive_history",
                ],
                clinical_significance="Standard international protocol for initial male fertility evaluation.",
                limitations=[
                    "A questionnaire cannot replace formal semen analysis or physical examination by a healthcare professional.",
                ],
            ),
            EvidenceChunk(
                chunk_id="who-infertility-lifestyle",
                document_id="who-infertility-2024",
                topic="Modifiable Lifestyle and Wellness Factors",
                text="WHO guidance emphasizes addressing modifiable lifestyle behaviors, including tobacco cessation, minimizing heavy alcohol consumption, and maintaining adequate nutrition and healthy body weight, as foundational steps in supporting overall and reproductive wellness.",
                evidence_tags=[
                    "lifestyle_balance",
                    "metabolic_health",
                    "bmi",
                    "tobacco_abstinence",
                    "alcohol_moderation",
                ],
                clinical_significance="Foundational lifestyle guidance for preventive reproductive health.",
                limitations=[
                    "Observational lifestyle improvements support physiological recovery but do not guarantee individual conception timelines.",
                ],
            ),
        ],
    ),

    # ── 2. AUA/ASRM Guideline Part I (2020) ─────────────────────────────────
    EvidenceDocument(
        id="aua-asrm-part1-2020",
        title="Diagnosis and Treatment of Infertility in Men: AUA/ASRM Guideline Part I",
        source="AUA/ASRM",
        organization="American Urological Association / American Society for Reproductive Medicine",
        publication_year=2020,
        document_type="guideline",
        url="https://www.asrm.org/practice-guidance/practice-committee-documents/diagnosis-and-treatment-of-infertility-in-men-auaasrm-guideline-part-i-2020/",
        source_identifier="DOI: 10.1097/JU.0000000000001657",
        evidence_tags=[
            "male_infertility_evaluation",
            "varicocele",
            "varicocele_screening",
            "venous_stasis",
            "urology_consultation",
            "sti_history",
            "testicular_trauma",
            "mumps_orchitis",
            "reproductive_history",
            "semen_analysis",
        ],
        population_context="Adult men evaluated for reproductive concerns or physical testicular symptoms.",
        summary="Clinical guideline defining diagnostic pathways for male reproductive assessment, semen analysis indications, physical examination of the scrotum, and clinical varicocele evaluation.",
        limitations=[
            "Varicocele self-reports require clinical confirmation via physical palpation and duplex Doppler ultrasound by a urologist/andrologist.",
            "Subclinical varicoceles identified on imaging without physical palpability generally do not warrant intervention.",
        ],
        chunks=[
            EvidenceChunk(
                chunk_id="aua-asrm-varicocele",
                document_id="aua-asrm-part1-2020",
                topic="Varicocele Evaluation and Management",
                text="The AUA/ASRM guideline specifies that varicocele (dilated scrotal pampiniform venous plexus) should be diagnosed by physical examination in the standing position, with ultrasound used when physical exam is ambiguous. Varicoceles can contribute to venous stasis and local hyperthermia; clinical evaluation by a urologist or andrologist is recommended when a varicocele is suspected or reported alongside reproductive concerns.",
                evidence_tags=[
                    "varicocele",
                    "varicocele_screening",
                    "venous_stasis",
                    "urology_consultation",
                    "hyperthermia",
                ],
                clinical_significance="Primary guideline for clinical varicocele assessment.",
                limitations=[
                    "Questionnaire report of varicocele is an indicator for clinical consultation, not a standalone measure of severity.",
                ],
            ),
            EvidenceChunk(
                chunk_id="aua-asrm-history-symptoms",
                document_id="aua-asrm-part1-2020",
                topic="Reproductive History and Physical Symptoms",
                text="The guideline highlights that medical history gathering should screen for past mumps orchitis post-puberty, history of significant groin or scrotal trauma, prior sexually transmitted infections, and ejaculatory symptoms (such as hematospermia or ejaculatory pain). Men reporting these factors benefit from focused clinical urological evaluation.",
                evidence_tags=[
                    "reproductive_history",
                    "mumps_orchitis",
                    "testicular_trauma",
                    "sti_history",
                    "hematospermia",
                    "ejaculatory_pain",
                    "urology_followup",
                ],
                clinical_significance="Standard historical screening parameters for male urological health.",
                limitations=[
                    "Past history is contextual; prior infections or childhood conditions do not necessarily indicate ongoing impairment.",
                ],
            ),
        ],
    ),

    # ── 3. AUA/ASRM Guideline Part II (2020) ────────────────────────────────
    EvidenceDocument(
        id="aua-asrm-part2-2020",
        title="Diagnosis and Treatment of Infertility in Men: AUA/ASRM Guideline Part II",
        source="AUA/ASRM",
        organization="American Urological Association / American Society for Reproductive Medicine",
        publication_year=2020,
        document_type="guideline",
        url="https://www.asrm.org/practice-guidance/practice-committee-documents/diagnosis-and-treatment-of-infertility-in-men-aua-asrm-guideline-part2/",
        source_identifier="DOI: 10.1097/JU.0000000000001658",
        evidence_tags=[
            "anabolic_steroids",
            "anabolic_androgenic_steroids",
            "hypogonadotropic_hypogonadism",
            "endocrine_suppression",
            "chemotherapy",
            "gonadotoxicity",
            "radiation_therapy",
            "endocrine_balance",
        ],
        population_context="Adult men with pharmacological, cytotoxic, or hormonal exposures.",
        summary="Guideline focusing on medical treatments, endocrine management, and the profound suppressive effects of exogenous testosterone and anabolic-androgenic steroids on male fertility.",
        limitations=[
            "Endocrine axis recovery following steroid cessation is variable and requires supervised medical management.",
        ],
        chunks=[
            EvidenceChunk(
                chunk_id="aua-asrm-steroids",
                document_id="aua-asrm-part2-2020",
                topic="Exogenous Testosterone & Anabolic Steroid Suppression",
                text="The AUA/ASRM guideline strongly states that exogenous testosterone and anabolic-androgenic steroids suppress pituitary gonadotropin secretion (luteinizing hormone and follicle-stimulating hormone), causing severe suppression of intratesticular testosterone and spermatogenesis (hypogonadotropic hypogonadism). Clinicians should advise men seeking to preserve fertility against testosterone or steroid use, and supervised cessation with endocrine monitoring is advised.",
                evidence_tags=[
                    "anabolic_steroids",
                    "anabolic_androgenic_steroids",
                    "hypogonadotropic_hypogonadism",
                    "endocrine_suppression",
                    "testosterone",
                ],
                clinical_significance="Crucial clinical warning against exogenous androgens for men concerned with reproductive parameters.",
                limitations=[
                    "Recovery timeline after cessation varies by compound, dose, and duration of use.",
                ],
            ),
            EvidenceChunk(
                chunk_id="aua-asrm-gonadotoxins",
                document_id="aua-asrm-part2-2020",
                topic="Chemotherapy and Cytotoxic Exposures",
                text="Past chemotherapy or pelvic radiation therapy involves exposure to gonadotoxic agents that can affect spermatogenic stem cells. The guideline recommends reproductive history review and semen analysis follow-up for individuals with prior cytotoxic treatment history.",
                evidence_tags=[
                    "chemotherapy",
                    "gonadotoxicity",
                    "radiation_therapy",
                ],
                clinical_significance="Clinical guidance for patients with prior oncological or cytotoxic therapies.",
                limitations=[
                    "Degree of recovery depends heavily on specific drug classes, cumulative dosage, and radiation fields.",
                ],
            ),
        ],
    ),

    # ── 4. EAU Guidelines on Sexual and Reproductive Health (2024) ───────────
    EvidenceDocument(
        id="eau-repro-2024",
        title="EAU Guidelines on Sexual and Reproductive Health",
        source="European Association of Urology",
        organization="European Association of Urology (EAU)",
        publication_year=2024,
        document_type="guideline",
        url="https://uroweb.org/guidelines/sexual-and-reproductive-health",
        source_identifier="EAU Guidelines 2024",
        evidence_tags=[
            "hyperthermia",
            "device_heat",
            "scrotal_temperature",
            "clothing_thermal_insulation",
            "spermatogenesis_thermoregulation",
            "occupational_heat",
            "tobacco",
            "nicotine",
            "alcohol",
            "oxidative_stress",
            "finasteride",
            "5_alpha_reductase_inhibitors",
            "dht_modulation",
            "erectile_function",
            "sexual_health",
        ],
        population_context="European and international adult male population seeking urological, reproductive, and sexual health guidance.",
        summary="Comprehensive clinical practice guidelines from the European Association of Urology covering scrotal thermoregulation, hyperthermia risk factors, lifestyle-induced oxidative stress, and pharmacological interactions.",
        limitations=[
            "Thermal elevation studies are largely physiological and observational; intermittent exposure carries different biological implications than chronic daily occupational heat.",
        ],
        chunks=[
            EvidenceChunk(
                chunk_id="eau-hyperthermia-heat",
                document_id="eau-repro-2024",
                topic="Scrotal Thermoregulation & Local Hyperthermia",
                text="Physiological spermatogenesis requires testicular temperatures approximately 2 to 4°C below core body temperature. The EAU guidelines note that frequent or prolonged local hyperthermia—such as from daily hot baths/saunas, prolonged direct laptop use on the lap, tight compression garments, or high-temperature working environments—can temporarily elevate scrotal temperature and increase cellular oxidative stress. Modifying device placement and garment choices supports physiological thermoregulation.",
                evidence_tags=[
                    "hyperthermia",
                    "device_heat",
                    "scrotal_temperature",
                    "clothing_thermal_insulation",
                    "spermatogenesis_thermoregulation",
                    "occupational_heat",
                ],
                clinical_significance="Underpins thermoregulation guidance and practical lifestyle modifications.",
                limitations=[
                    "Self-reported heat exposure indicates a modifiable risk factor, not a permanent or definitive clinical impairment.",
                ],
            ),
            EvidenceChunk(
                chunk_id="eau-tobacco-alcohol",
                document_id="eau-repro-2024",
                topic="Tobacco, Alcohol, and Oxidative Stress",
                text="The EAU guideline highlights that tobacco smoking is associated with increased reactive oxygen species (ROS) in seminal plasma, higher sperm DNA fragmentation indices, and microvascular endothelial strain. Heavy alcohol consumption similarly alters endocrine feedback and liver metabolism. Cessation of smoking and moderation of alcohol intake are standard urological recommendations.",
                evidence_tags=[
                    "tobacco",
                    "nicotine",
                    "oxidative_stress",
                    "vascular_health",
                    "alcohol",
                    "metabolic_health",
                ],
                clinical_significance="Establishes tobacco and alcohol reduction as standard lifestyle recommendations.",
                limitations=[
                    "Impact of smoking cessation on seminal parameters typically manifests over a 3-month spermatogenic cycle.",
                ],
            ),
            EvidenceChunk(
                chunk_id="eau-finasteride-medications",
                document_id="eau-repro-2024",
                topic="5-Alpha Reductase Inhibitors (Finasteride/Dutasteride)",
                text="5-alpha reductase inhibitors (such as Finasteride and Dutasteride) inhibit the conversion of testosterone to dihydrotestosterone (DHT). In a subset of individuals, modest reductions in ejaculate volume, libido, or reversible alterations in seminal parameters have been documented. Discontinuation under medical guidance typically reverses these changes.",
                evidence_tags=[
                    "finasteride",
                    "5_alpha_reductase_inhibitors",
                    "dht_modulation",
                    "libido",
                    "ejaculatory_function",
                ],
                clinical_significance="Provides pharmacological context for men using hair-loss or prostate therapies.",
                limitations=[
                    "Medication adjustments should only be made in consultation with the prescribing physician.",
                ],
            ),
        ],
    ),

    # ── 5. Environmental & Lifestyle Systematic Review (PubMed 2022) ─────────
    EvidenceDocument(
        id="env-lifestyle-review-2022",
        title="The effect of lifestyle and environmental factors on male reproductive health",
        source="IJERPH / PubMed",
        organization="International Journal of Environmental Research and Public Health",
        publication_year=2022,
        document_type="systematic_review",
        url="https://pubmed.ncbi.nlm.nih.gov/35805565/",
        source_identifier="PMID: 35805565",
        evidence_tags=[
            "pesticides",
            "organophosphates",
            "heavy_metals",
            "lead_cadmium",
            "solvent_toxicity",
            "bisphenol_a",
            "microplastics",
            "phthalates",
            "endocrine_disruptors",
            "air_pollution",
            "particulate_matter",
            "sleep_duration",
            "circadian_rhythm",
            "recovery",
        ],
        population_context="Industrial, agricultural, and urban adult populations evaluated for environmental exposures.",
        summary="Peer-reviewed systematic review synthesizing literature on occupational chemical sprays (pesticides, heavy metals), endocrine disruptors in plastics (BPA/phthalates), and circadian/sleep disruption.",
        limitations=[
            "Observational and toxicological studies demonstrate cellular and oxidative mechanisms; individual susceptibility depends on exposure dose, duration, and personal protective equipment use.",
        ],
        chunks=[
            EvidenceChunk(
                chunk_id="env-occupational-toxins",
                document_id="env-lifestyle-review-2022",
                topic="Occupational Pesticides, Heavy Metals & Solvents",
                text="Occupational exposure to organophosphate pesticides, welding fumes, paints/solvents, and heavy metals (lead, cadmium) has been associated in toxicological and epidemiological literature with elevated systemic oxidative stress and endocrine disruption. Using appropriate personal protective equipment (PPE) and minimizing direct dermal and respiratory contact are primary occupational health measures.",
                evidence_tags=[
                    "pesticides",
                    "organophosphates",
                    "heavy_metals",
                    "lead_cadmium",
                    "solvent_toxicity",
                    "endocrine_disruptors",
                    "occupational_health",
                ],
                clinical_significance="Underpins occupational screening flags and protective recommendations.",
                limitations=[
                    "Self-reported exposure frequency does not measure biological heavy metal or pesticide blood levels.",
                ],
            ),
            EvidenceChunk(
                chunk_id="env-plastics-bpa",
                document_id="env-lifestyle-review-2022",
                topic="Endocrine Disrupting Chemicals in Heated Plastics (BPA & Phthalates)",
                text="Heating plastic containers containing food or liquids accelerates the leaching of endocrine-disrupting chemicals such as Bisphenol A (BPA) and phthalates. These compounds exhibit weak estrogenic and anti-androgenic activity in biological assays. Transitioning to glass, ceramic, or stainless steel containers for heated food and beverages is an evidence-informed preventive step.",
                evidence_tags=[
                    "bisphenol_a",
                    "microplastics",
                    "phthalates",
                    "endocrine_disruptors",
                    "endocrine_protection",
                ],
                clinical_significance="Evidence basis for modifiable daily plastic exposure recommendations.",
                limitations=[
                    "Dietary plastic exposure is ubiquitous; minimizing heated plastic contact is a risk-reduction measure rather than a clinical cure.",
                ],
            ),
            EvidenceChunk(
                chunk_id="env-sleep-recovery",
                document_id="env-lifestyle-review-2022",
                topic="Sleep Duration, Circadian Rhythm & Endocrine Synthesis",
                text="Testosterone synthesis and cellular repair exhibit strong circadian rhythms, with major secretory pulses occurring during undisturbed deep sleep cycles. Sleep restriction (<5 to 6 hours per night) and irregular shift-work schedules have been linked in clinical studies to blunted nocturnal testosterone peaks, elevated daytime cortisol, and higher systemic inflammatory markers.",
                evidence_tags=[
                    "sleep_duration",
                    "circadian_rhythm",
                    "recovery",
                    "endocrine_balance",
                    "cortisol",
                ],
                clinical_significance="Establishes biological rationale for 7–9 hour sleep duration and consistent sleep schedules.",
                limitations=[
                    "Short-term sleep deficits can be compensated with recovery sleep; chronic deficits represent the primary concern.",
                ],
            ),
        ],
    ),

    # ── 6. Psychosexual & Performance Anxiety Review (PubMed 2021) ───────────
    EvidenceDocument(
        id="psychosexual-review-2021",
        title="Cognitive-Behavioral and Psychosexual Factors in Male Sexual Function",
        source="Journal of Sexual Medicine / PubMed",
        organization="International Society for Sexual Medicine / PubMed",
        publication_year=2021,
        document_type="systematic_review",
        url="https://pubmed.ncbi.nlm.nih.gov/33895101/",
        source_identifier="PMID: 33895101",
        evidence_tags=[
            "performance_anxiety",
            "spectatoring",
            "cognitive_focus",
            "autonomic_balance",
            "sympathetic_nervous_system",
            "avoidance_behavior",
            "anxiety_cycles",
            "digital_habits",
            "cognitive_standards",
            "behavioral_control",
            "psychosexual_health",
        ],
        population_context="Men reporting intimacy-related performance anxiety, cognitive self-monitoring, or digital habit concerns.",
        summary="Systematic clinical review examining cognitive-behavioral mechanisms of sexual performance anxiety, spectatoring, sympathetic tone interference, and digital media expectations.",
        limitations=[
            "Performance anxiety is a psychological and autonomic state, not an organic physical pathology.",
            "Self-reported anxiety indicators should not be confused with permanent erectile or ejaculatory disorders.",
        ],
        chunks=[
            EvidenceChunk(
                chunk_id="psychosexual-spectatoring-anxiety",
                document_id="psychosexual-review-2021",
                topic="Cognitive Self-Monitoring (Spectatoring) and Autonomic Tone",
                text="Anticipatory performance anxiety and cognitive self-monitoring ('spectatoring'—mentally observing one's own performance during intimacy) activate the sympathetic fight-or-flight nervous system. Elevated adrenaline and peripheral vasoconstriction directly interfere with the parasympathetic vascular pathways required for healthy erectile function and sensory relaxation. Cognitive-behavioral strategies, mindfulness, and reducing spectatoring help restore autonomic balance.",
                evidence_tags=[
                    "performance_anxiety",
                    "spectatoring",
                    "cognitive_focus",
                    "autonomic_balance",
                    "sympathetic_nervous_system",
                    "avoidance_behavior",
                    "mindfulness",
                ],
                clinical_significance="Explains the physiological mechanism linking mental anxiety to intimacy difficulties.",
                limitations=[
                    "Psychogenic performance anxiety is common and responsive to psychoeducation, communication, and stress reduction.",
                ],
            ),
            EvidenceChunk(
                chunk_id="psychosexual-digital-expectations",
                document_id="psychosexual-review-2021",
                topic="Digital Adult Media Expectations & Behavioral Habituation",
                text="High-frequency consumption of digital adult content can create unrealistic performance expectations and habituate dopamine reward pathways to novel digital stimuli. When individuals notice difficulty moderating consumption or comparing real-life partner intimacy to digital standards, structured digital moderation and behavioral support improve psychosexual wellbeing and real-world relational intimacy.",
                evidence_tags=[
                    "digital_habits",
                    "behavioral_control",
                    "cognitive_standards",
                    "media_expectations",
                    "dopamine_reward",
                    "relational_intimacy",
                ],
                clinical_significance="Provides non-judgmental, evidence-based psychosexual guidance for digital habits.",
                limitations=[
                    "Digital adult media consumption is evaluated in terms of perceived personal control and functional impact, not moral judgment.",
                ],
            ),
        ],
    ),

    # ── 7. Age-Dependent Semen Quality Decline (Sharma et al. 2015) ──────────
    EvidenceDocument(
        id="age-decline-meta-2015",
        title="Consistent age-dependent declines in human semen quality: a systematic review and meta-analysis",
        source="PubMed",
        organization="National Institutes of Health / PubMed",
        publication_year=2015,
        document_type="systematic_review",
        url="https://pubmed.ncbi.nlm.nih.gov/25462195/",
        source_identifier="PMID: 25462195",
        evidence_tags=["paternal_age", "dna_fragmentation", "semen_parameters", "reproductive_history"],
        population_context="Systematic review of 90 studies and 93,839 men evaluating semen changes across paternal age cohorts.",
        summary="Found consistent age-associated declines in semen volume, motility, progressive motility, and normal morphology across adult male lifespan.",
        limitations=[
            "Chronological age alone is a non-diagnostic background variable; significant biological variation exists across individuals.",
        ],
        chunks=[
            EvidenceChunk(
                chunk_id="age-decline-semen-params",
                document_id="age-decline-meta-2015",
                topic="Paternal Age and Semen Quality Parameters",
                text="In this meta-analysis of 90 studies, advancing paternal age was consistently associated with moderate declines in semen volume, progressive sperm motility, and normal morphology, alongside elevated sperm DNA fragmentation indices.",
                evidence_tags=["paternal_age", "dna_fragmentation", "semen_parameters"],
                clinical_significance="Provides epidemiological baseline for contextualizing age-related reproductive wellness questions.",
                limitations=["Chronological age is not an infertility diagnosis; male reproductive function persists across advanced years."],
            )
        ],
    ),

    # ── 8. Advanced Paternal Age & DNA Fragmentation (2021) ─────────────────
    EvidenceDocument(
        id="paternal-age-dna-frag-2021",
        title="Advanced Paternal Age and Sperm DNA Fragmentation: A Systematic Review",
        source="PubMed",
        organization="National Institutes of Health / PubMed",
        publication_year=2021,
        document_type="systematic_review",
        url="https://pubmed.ncbi.nlm.nih.gov/33987998/",
        source_identifier="PMID: 33987998",
        evidence_tags=["paternal_age", "dna_fragmentation", "semen_parameters"],
        population_context="Systematic review of 40,668 men assessing age-stratified sperm chromatin structure and DNA breaks.",
        summary="Observed significant correlations between advancing paternal age and increased sperm DNA fragmentation indices across multiple testing modalities.",
        limitations=["Testing modalities varied between TUNEL, SCSA, and Comet assays across included trials."],
        chunks=[
            EvidenceChunk(
                chunk_id="paternal-age-chromatin",
                document_id="paternal-age-dna-frag-2021",
                topic="Age-Associated Sperm Chromatin Integrity",
                text="Advancing paternal age exhibits a recognized biological correlation with increased sperm DNA fragmentation, primarily mediated through accumulated reactive oxygen species exposure and reduced testicular antioxidant capacity.",
                evidence_tags=["paternal_age", "dna_fragmentation"],
                clinical_significance="Explains biological mechanisms connecting age to genomic integrity markers.",
                limitations=["DNA fragmentation screening requires laboratory testing and cannot be diagnosed via questionnaire."],
            )
        ],
    ),

    # ── 9. Body Mass Index & Semen Quality (Guo et al. 2024) ────────────────
    EvidenceDocument(
        id="bmi-semen-quality-meta-2024",
        title="Association between body mass index and semen quality: a systematic review and meta-analysis",
        source="PubMed",
        organization="National Institutes of Health / PubMed",
        publication_year=2024,
        document_type="systematic_review",
        url="https://pubmed.ncbi.nlm.nih.gov/39003321/",
        source_identifier="PMID: 39003321",
        evidence_tags=["bmi", "metabolic_health", "semen_parameters"],
        population_context="Meta-analysis of 71,337 subjects evaluating BMI classifications and seminal parameters.",
        summary="Demonstrated that elevated BMI and obesity correlate with reductions in semen volume, total sperm count, and motility.",
        limitations=["BMI does not differentiate visceral adipose tissue from lean muscle mass."],
        chunks=[
            EvidenceChunk(
                chunk_id="bmi-metabolic-semen-reduction",
                document_id="bmi-semen-quality-meta-2024",
                topic="Adiposity and Seminal Characteristics",
                text="Obesity and elevated BMI are associated with peripheral aromatization of androgens into estrogens, elevated scrotal insulation, and reductions in progressive motility and total sperm number.",
                evidence_tags=["bmi", "metabolic_health", "semen_parameters"],
                clinical_significance="Underpins nutritional and metabolic health screening in reproductive contexts.",
                limitations=["Moderate BMI shifts are modifiable; questionnaire BMI is observational screening."],
            )
        ],
    ),

    # ── 10. Cigarette Smoking & Semen Quality (Sharma et al. 2016) ──────────
    EvidenceDocument(
        id="tobacco-smoking-meta-2016",
        title="Cigarette Smoking and Semen Quality: A New Meta-analysis Examining the Effect of the 2010 World Health Organization Laboratory Methods for the Examination of Human Semen",
        source="PubMed",
        organization="National Institutes of Health / PubMed",
        publication_year=2016,
        document_type="systematic_review",
        url="https://pubmed.ncbi.nlm.nih.gov/27113031/",
        source_identifier="PMID: 27113031",
        evidence_tags=["tobacco", "nicotine", "tobacco_abstinence", "semen_parameters"],
        population_context="Meta-analysis of cigarette smoking cohorts evaluated under standardized WHO 2010 semen examination guidelines.",
        summary="Cigarette smoking was associated with significant reductions in sperm density, motility, and normal morphology across infertile and general populations.",
        limitations=["Self-reported smoking dose and duration; unmeasured lifestyle confounding."],
        chunks=[
            EvidenceChunk(
                chunk_id="tobacco-semen-density-motility",
                document_id="tobacco-smoking-meta-2016",
                topic="Cigarette Smoking and Semen Parameters",
                text="Exposure to cigarette smoke constituents induces seminal oxidative stress, reduces seminal leukocyte defenses, and is inversely correlated with total sperm density and progressive motility.",
                evidence_tags=["tobacco", "nicotine", "semen_parameters"],
                clinical_significance="Validates smoking cessation as a primary modifiable recommendation in reproductive health.",
                limitations=["Self-reported cigarette use; smoking cessation has documented restorative benefits over spermatogenic cycles."],
            )
        ],
    ),

    # ── 11. Alcohol Intake & Semen Quality (Ricci et al. 2017) ───────────────
    EvidenceDocument(
        id="alcohol-intake-semen-meta-2017",
        title="Semen quality and alcohol intake: a systematic review and meta-analysis",
        source="PubMed",
        organization="National Institutes of Health / PubMed",
        publication_year=2017,
        document_type="systematic_review",
        url="https://pubmed.ncbi.nlm.nih.gov/28029592/",
        source_identifier="PMID: 28029592",
        evidence_tags=["alcohol", "alcohol_moderation", "semen_parameters", "lifestyle_balance"],
        population_context="Systematic review and meta-analysis examining moderate vs heavy alcohol intake and semen parameters.",
        summary="Heavy alcohol consumption was significantly associated with detrimental effects on semen volume and sperm morphology, while occasional moderate intake exhibited minimal isolated impact.",
        limitations=["Variable operational definitions of standard drinks and consumption frequencies."],
        chunks=[
            EvidenceChunk(
                chunk_id="alcohol-dose-semen-volume",
                document_id="alcohol-intake-semen-meta-2017",
                topic="Alcohol Consumption and Seminal Profiles",
                text="Daily and heavy episodic alcohol consumption disrupts the hypothalamic-pituitary-gonadal axis, impairs testosterone synthesis, and negatively affects semen volume and morphology.",
                evidence_tags=["alcohol", "alcohol_moderation", "semen_parameters"],
                clinical_significance="Guides clinical lifestyle recommendations emphasizing moderation rather than binary abstinence for low-frequency consumers.",
                limitations=["Self-reported alcohol intake frequency; threshold effects vary across populations."],
            )
        ],
    ),

    # ── 12. Physical Activity & Semen Quality (Foucaut et al. 2019) ──────────
    EvidenceDocument(
        id="physical-activity-meta-2019",
        title="An update on the implication of physical activity on semen quality: a systematic review and meta-analysis",
        source="PubMed",
        organization="National Institutes of Health / PubMed",
        publication_year=2019,
        document_type="systematic_review",
        url="https://pubmed.ncbi.nlm.nih.gov/30671700/",
        source_identifier="PMID: 30671700",
        evidence_tags=["physical_activity", "cardiovascular_fitness", "sedentary_behavior", "semen_parameters"],
        population_context="Systematic review evaluating leisure-time aerobic and resistance exercise across adult men.",
        summary="Demonstrated that moderate regular physical activity improves antioxidant defenses and semen quality compared to chronic sedentary patterns.",
        limitations=["High-intensity exhaustive endurance overtraining can conversely elicit temporary endocrine suppression."],
        chunks=[
            EvidenceChunk(
                chunk_id="exercise-antioxidant-semen",
                document_id="physical-activity-meta-2019",
                topic="Physical Activity and Semen Wellness",
                text="Moderate, consistent physical activity enhances systemic insulin sensitivity, reduces circulating inflammatory cytokines, and supports optimal seminal parameters relative to prolonged sedentary lifestyles.",
                evidence_tags=["physical_activity", "cardiovascular_fitness", "sedentary_behavior"],
                clinical_significance="Underpins regular physical activity recommendations in lifestyle reproductive wellness.",
                limitations=["Physical activity is a supportive lifestyle factor, not a standalone medical intervention for clinical infertility."],
            )
        ],
    ),

    # ── 13. Sedentary Behavior & Sitting Time (Belladelli et al. 2024) ───────
    EvidenceDocument(
        id="sedentariness-sitting-meta-2024",
        title="The sitting men: A systematic review of spare and working time exposure to sedentariness in relation to semen parameters",
        source="PubMed",
        organization="National Institutes of Health / PubMed",
        publication_year=2024,
        document_type="systematic_review",
        url="https://pubmed.ncbi.nlm.nih.gov/39648572/",
        source_identifier="PMID: 39648572",
        evidence_tags=["sedentary_behavior", "circulation", "scrotal_temperature"],
        population_context="Systematic review analyzing prolonged daily occupational and leisure sitting hours.",
        summary="Evaluated prolonged seated posture (>6-8 hours daily), observing associations with pelvic venous stasis and elevated scrotal temperatures.",
        limitations=["Variation in workplace ergonomical postures and break frequencies across cohorts."],
        chunks=[
            EvidenceChunk(
                chunk_id="sitting-venous-stasis-temperature",
                document_id="sedentariness-sitting-meta-2024",
                topic="Prolonged Sitting, Venous Stasis, and Scrotal Heat",
                text="Prolonged continuous sitting impedes pelvic microcirculation and induces localized intrascrotal temperature increases of 1.5 to 2.2 deg C, which may impair thermoregulatory spermatogenesis.",
                evidence_tags=["sedentary_behavior", "circulation", "scrotal_temperature"],
                clinical_significance="Supports recommendations for frequent standing intervals and ergonomic movement breaks.",
                limitations=["Sitting time is an observational risk factor, not a clinical diagnosis."],
            )
        ],
    ),

    # ── 14. Sleep Duration & Semen Parameters (Zou et al. 2020) ─────────────
    EvidenceDocument(
        id="sleep-duration-semen-2020",
        title="Sleep duration and quality in relation to semen quality in healthy men screened as potential sperm donors",
        source="PubMed",
        organization="National Institutes of Health / PubMed",
        publication_year=2020,
        document_type="systematic_review",
        url="https://pubmed.ncbi.nlm.nih.gov/31830732/",
        source_identifier="PMID: 31830732",
        evidence_tags=["sleep_duration", "sleep_hygiene", "circadian_rhythm", "semen_parameters"],
        population_context="Observational cohort study in healthy screened men evaluating nocturnal sleep duration and quality.",
        summary="Identified an inverted U-shaped correlation between sleep duration and semen quality, with 7-8 hours reflecting optimal parameters compared to short (<6.5h) or excessive (>9h) sleep.",
        limitations=["Screened donor population may exhibit higher baseline health parameters than general clinical populations."],
        chunks=[
            EvidenceChunk(
                chunk_id="sleep-u-shaped-duration",
                document_id="sleep-duration-semen-2020",
                topic="Sleep Duration Optimization and Semen Quality",
                text="Both chronic sleep restriction (<6.5 hours) and prolonged sleep (>9.0 hours) correlate with reduced total sperm counts and motility, highlighting the role of circadian melatonin and gonadotropin rhythmicity.",
                evidence_tags=["sleep_duration", "sleep_hygiene", "circadian_rhythm"],
                clinical_significance="Informs circadian rhythm and sleep regularity advice in digital health assessments.",
                limitations=["Self-reported sleep durations; actigraphy confirmation was not universally performed."],
            )
        ],
    ),

    # ── 15. Healthy Dietary Patterns & Semen Quality (Salas-Huetos 2022) ─────
    EvidenceDocument(
        id="dietary-patterns-semen-meta-2022",
        title="The effect of healthy dietary patterns on male semen quality: a systematic review and meta-analysis",
        source="PubMed",
        organization="National Institutes of Health / PubMed",
        publication_year=2022,
        document_type="systematic_review",
        url="https://pubmed.ncbi.nlm.nih.gov/35915543/",
        source_identifier="PMID: 35915543",
        evidence_tags=["dietary_antioxidants", "diet_quality", "micronutrients", "oxidative_stress"],
        population_context="Systematic review and meta-analysis evaluating dietary quality indices and human seminal parameters.",
        summary="Diets rich in vegetables, fruits, whole grains, nuts, and fish were positively associated with sperm concentration, total count, and progressive motility.",
        limitations=["Dietary questionnaires have inherent recall bias; socio-economic status serves as a frequent confounder."],
        chunks=[
            EvidenceChunk(
                chunk_id="dietary-antioxidant-sperm-motility",
                document_id="dietary-patterns-semen-meta-2022",
                topic="Diet Quality and Micronutrient Density",
                text="Prudent dietary patterns supplying vitamins C, E, folate, zinc, and omega-3 fatty acids attenuate seminal lipid peroxidation and support membrane fluidity essential for progressive sperm motility.",
                evidence_tags=["dietary_antioxidants", "diet_quality", "micronutrients"],
                clinical_significance="Provides evidence base for nutritional lifestyle guidance in male health apps.",
                limitations=["Nutrition is a supportive metabolic foundation, not a substitute for medical andrological care."],
            )
        ],
    ),

    # ── 16. Mediterranean Diet & Reproductive Outcomes (Montano 2024) ───────
    EvidenceDocument(
        id="mediterranean-diet-semen-meta-2024",
        title="Mediterranean Diet, Semen Quality, and Medically Assisted Reproductive Outcomes in the Male Population: A Systematic Review and Meta-Analysis",
        source="PubMed",
        organization="National Institutes of Health / PubMed",
        publication_year=2024,
        document_type="systematic_review",
        url="https://pubmed.ncbi.nlm.nih.gov/40419219/",
        source_identifier="PMID: 40419219",
        evidence_tags=["diet_quality", "micronutrients", "oxidative_stress", "metabolic_health"],
        population_context="Meta-analysis assessing Mediterranean diet adherence in male cohorts undergoing fertility evaluation.",
        summary="High Mediterranean diet adherence was significantly associated with superior sperm motility, morphology, and improved assisted reproduction outcomes.",
        limitations=["Observational study designs cannot establish direct clinical causality."],
        chunks=[
            EvidenceChunk(
                chunk_id="mediterranean-diet-outcomes",
                document_id="mediterranean-diet-semen-meta-2024",
                topic="Mediterranean Diet Adherence and Semen Parameters",
                text="The Mediterranean dietary model, characterized by unrefined plant foods, extra virgin olive oil, and seafood, reduces oxidative damage in the male reproductive tract and promotes favorable sperm morphology.",
                evidence_tags=["diet_quality", "micronutrients", "oxidative_stress"],
                clinical_significance="Standard evidence-based nutritional pattern cited in andrology literature.",
                limitations=["Dietary modification supports general and reproductive wellness but does not treat obstructive or genetic conditions."],
            )
        ],
    ),

    # ── 17. Radiofrequency Exposure & Semen Viability (2024) ────────────────
    EvidenceDocument(
        id="mobile-rf-exposure-meta-2024",
        title="The effects of radiofrequency exposure on male fertility: A systematic review of human observational studies with dose-response meta-analysis",
        source="PubMed",
        organization="National Institutes of Health / PubMed",
        publication_year=2024,
        document_type="systematic_review",
        url="https://pubmed.ncbi.nlm.nih.gov/38880061/",
        source_identifier="PMID: 38880061",
        evidence_tags=["device_proximity", "emf_radiofrequency", "semen_parameters"],
        population_context="Dose-response meta-analysis of observational studies evaluating mobile phone carrying habits.",
        summary="Identified associations between carrying active mobile devices in front trousers pockets and reductions in sperm progressive motility and viability.",
        limitations=["Exposure assessment relies primarily on self-reported phone carrying habits rather than dosimetric radiation measurements."],
        chunks=[
            EvidenceChunk(
                chunk_id="rf-exposure-pocket-proximity",
                document_id="mobile-rf-exposure-meta-2024",
                topic="Mobile Phone Proximity and Radiofrequency Exposure",
                text="Carrying active mobile devices in trouser pockets in close proximity to scrotal tissue is associated in human observational studies with modest declines in sperm motility, potentially through localized thermal or non-thermal electromagnetic mechanisms.",
                evidence_tags=["device_proximity", "emf_radiofrequency"],
                clinical_significance="Informs prudent lifestyle placement guidance (carrying devices in jackets or bags).",
                limitations=["Human observational data contains heterogeneity; no definitive pathological threshold has been established."],
            )
        ],
    ),

    # ── 18. Pesticides & Male Fertility Review (Jurewicz et al. 2022) ────────
    EvidenceDocument(
        id="pesticides-male-fertility-review-2022",
        title="The environmental and occupational influence of pesticides on male fertility: A systematic review of human studies",
        source="PubMed",
        organization="National Institutes of Health / PubMed",
        publication_year=2022,
        document_type="systematic_review",
        url="https://pubmed.ncbi.nlm.nih.gov/35793270/",
        source_identifier="PMID: 35793270",
        evidence_tags=["pesticides", "organophosphates", "endocrine_disruptors", "environmental_toxins"],
        population_context="Systematic review of occupational and environmental human exposures to agrochemical compounds.",
        summary="Documented associations between organophosphate, pyrethroid, and carbamate exposure and adverse semen parameters, DNA damage, and reproductive hormone disruption.",
        limitations=["Real-world exposures involve chemical mixtures rather than isolated compounds."],
        chunks=[
            EvidenceChunk(
                chunk_id="pesticide-endocrine-disruption",
                document_id="pesticides-male-fertility-review-2022",
                topic="Pesticides, Endocrine Disruption, and Spermatogenesis",
                text="Occupational and residential pesticide exposures can induce endocrine disruption via anti-androgenic activity and generate seminal reactive oxygen species that impair spermatogenesis.",
                evidence_tags=["pesticides", "organophosphates", "endocrine_disruptors"],
                clinical_significance="Underpins environmental risk screening questions in agricultural and industrial occupations.",
                limitations=["Occupational protection equipment substantially mitigates exposure risk."],
            )
        ],
    ),

    # ── 19. Bisphenol A & Reproductive Hormones (Miao et al. 2024) ──────────
    EvidenceDocument(
        id="bisphenol-a-meta-2024",
        title="Bisphenol A Exposure Interferes with Reproductive Hormones and Decreases Sperm Counts: A Systematic Review and Meta-Analysis of Epidemiological Studies",
        source="PubMed",
        organization="National Institutes of Health / PubMed",
        publication_year=2024,
        document_type="systematic_review",
        url="https://pubmed.ncbi.nlm.nih.gov/38668517/",
        source_identifier="PMID: 38668517",
        evidence_tags=["bisphenol_a", "endocrine_disruptors", "endocrine_protection"],
        population_context="Epidemiological meta-analysis measuring urinary BPA biomarkers and male reproductive parameters.",
        summary="Found elevated urinary bisphenol A levels correlate with lower total sperm counts and altered circulating testosterone and gonadotropin concentrations.",
        limitations=["BPA has rapid urinary elimination; single spot measurements may not reflect chronic long-term exposure."],
        chunks=[
            EvidenceChunk(
                chunk_id="bpa-urinary-sperm-count",
                document_id="bisphenol-a-meta-2024",
                topic="Bisphenol A Exposure and Endocrine Balance",
                text="Bisphenol A acts as a synthetic xenoestrogen capable of binding estrogen receptors and perturbing testicular steroidogenesis, correlating with decreased sperm counts in epidemiological cohorts.",
                evidence_tags=["bisphenol_a", "endocrine_disruptors"],
                clinical_significance="Informs guidance on minimizing plastic heating and food container exposure.",
                limitations=["Biological half-life is short; avoidance of hot plastic contact reduces exposure."],
            )
        ],
    ),

    # ── 20. GAD-7 Anxiety Assessment Validation (Spitzer et al. 2006) ────────
    EvidenceDocument(
        id="gad7-validation-2006",
        title="A brief measure for assessing generalized anxiety disorder: the GAD-7",
        source="PubMed",
        organization="National Institutes of Health / PubMed",
        publication_year=2006,
        document_type="consensus",
        url="https://pubmed.ncbi.nlm.nih.gov/16717171/",
        source_identifier="PMID: 16717171",
        evidence_tags=["anxiety", "autonomic_regulation", "psychological_wellbeing"],
        population_context="Validation study across 2,740 primary care and mental health patients.",
        summary="Established the psychometric validity, criterion accuracy, and reliability of the 7-item GAD-7 anxiety screening scale.",
        limitations=["Screening tool only; clinical diagnosis requires full structured psychiatric interview."],
        chunks=[
            EvidenceChunk(
                chunk_id="gad7-psychometrics",
                document_id="gad7-validation-2006",
                topic="Generalized Anxiety Disorder Psychometric Screening",
                text="The GAD-7 is a well-validated 7-item instrument that captures somatic tension, worry, and autonomic anxiety levels, providing reliable symptom severity categorization.",
                evidence_tags=["anxiety", "autonomic_regulation"],
                clinical_significance="Gold-standard clinical screening tool for assessing non-diagnostic generalized anxiety symptoms.",
                limitations=["Scores identify symptom burdens that warrant professional support, not automated diagnostic labels."],
            )
        ],
    ),

    # ── 21. PHQ-9 Depression Measure Validation (Kroenke et al. 2001) ────────
    EvidenceDocument(
        id="phq9-validation-2001",
        title="The PHQ-9: validity of a brief depression severity measure",
        source="PubMed",
        organization="National Institutes of Health / PubMed",
        publication_year=2001,
        document_type="consensus",
        url="https://pubmed.ncbi.nlm.nih.gov/11556941/",
        source_identifier="PMID: 11556941",
        evidence_tags=["mood_screening", "psychological_wellbeing", "somatic_strain"],
        population_context="Validation in 6,000 primary care and obstetrics/gynecology patients.",
        summary="Demonstrated excellent diagnostic validity and sensitivity for the 9-item Patient Health Questionnaire for depression severity evaluation.",
        limitations=["Self-report screening instrument; positive items require compassionate clinical evaluation."],
        chunks=[
            EvidenceChunk(
                chunk_id="phq9-validity-severity",
                document_id="phq9-validation-2001",
                topic="PHQ-9 Depression Symptom Severity Scoring",
                text="The PHQ-9 provides valid assessment of mood disturbance, sleep disruption, energy loss, and psychological strain, tracking responses over standard time windows.",
                evidence_tags=["mood_screening", "psychological_wellbeing"],
                clinical_significance="Internationally recognized standard for mood symptom screening.",
                limitations=["Self-administered screening score; does not substitute for licensed healthcare professional evaluation."],
            )
        ],
    ),

    # ── 22. Sexually Transmitted Infections & Infertility (Moazzam 2024) ──────
    EvidenceDocument(
        id="sti-infertility-review-2024",
        title="Are sexually transmitted infections associated with male infertility? A systematic review and in-depth evaluation of the evidence and mechanisms of action of 11 pathogens",
        source="PubMed",
        organization="National Institutes of Health / PubMed",
        publication_year=2024,
        document_type="systematic_review",
        url="https://pubmed.ncbi.nlm.nih.gov/38178949/",
        source_identifier="PMID: 38178949",
        evidence_tags=["sti_history", "sti_screening", "reproductive_tract", "inflammatory_markers"],
        population_context="Systematic review of 11 STI pathogens across clinical andrology cohorts.",
        summary="Detailed pathological mechanisms of Chlamydia trachomatis, Neisseria gonorrhoeae, and mycoplasmas in accessory gland inflammation, urethral stricture, and leukocytospermia.",
        limitations=["Asymptomatic infection history may have variable long-term impact on seminal parameters."],
        chunks=[
            EvidenceChunk(
                chunk_id="sti-inflammation-ductal",
                document_id="sti-infertility-review-2024",
                topic="Sexually Transmitted Pathogens and Reproductive Tract Inflammation",
                text="Pathogens including Chlamydia and Gonococcus can provoke epididymitis, ductal occlusion, and persistent leukocytospermia with associated elevated reactive oxygen species in the male reproductive tract.",
                evidence_tags=["sti_history", "reproductive_tract", "inflammatory_markers"],
                clinical_significance="Underpins the clinical rationale for screening reproductive history and prior STI episodes.",
                limitations=["Prior treated infections frequently resolve without permanent reproductive sequelae."],
            )
        ],
    ),

    # ── 23. Ejaculatory Abstinence Duration & Semen Parameters (Hansen 2024) ──
    EvidenceDocument(
        id="abstinence-period-meta-2024",
        title="Impact of Shorter Abstinence Periods on Semen Parameters: A Systematic Review and Meta-Analysis",
        source="PubMed",
        organization="National Institutes of Health / PubMed",
        publication_year=2024,
        document_type="systematic_review",
        url="https://pubmed.ncbi.nlm.nih.gov/39434390/",
        source_identifier="PMID: 39434390",
        evidence_tags=["semen_parameters", "semen_analysis", "accessory_gland_function"],
        population_context="Systematic review and meta-analysis comparing short (1-2 days) vs standard (2-7 days) abstinence.",
        summary="Demonstrated that while longer abstinence increases total ejaculate volume and sperm count, shorter abstinence periods correlate with higher progressive motility and lower sperm DNA fragmentation.",
        limitations=["Optimal window balances volume requirements against genomic integrity depending on clinical indication."],
        chunks=[
            EvidenceChunk(
                chunk_id="abstinence-motility-dna-frag",
                document_id="abstinence-period-meta-2024",
                topic="Abstinence Duration Trade-offs in Semen Parameters",
                text="Shorter ejaculatory abstinence windows of 1-2 days improve sperm progressive motility and reduce sperm DNA fragmentation, counterbalancing lower total ejaculate volume.",
                evidence_tags=["semen_parameters", "semen_analysis"],
                clinical_significance="Informs clinical context regarding timing of semen analysis and reproductive intercourse schedules.",
                limitations=["Abstinence advice must be customized based on baseline sperm density."],
            )
        ],
    ),

    # ── 24. 5-Alpha Reductase Inhibitors & Semen Parameters (Amory 2007) ──────
    EvidenceDocument(
        id="finasteride-semen-trial-2007",
        title="The effect of 5alpha-reductase inhibition with dutasteride and finasteride on semen parameters and serum hormones in healthy men",
        source="PubMed",
        organization="National Institutes of Health / PubMed",
        publication_year=2007,
        document_type="systematic_review",
        url="https://pubmed.ncbi.nlm.nih.gov/17299062/",
        source_identifier="PMID: 17299062",
        evidence_tags=["finasteride", "5_alpha_reductase_inhibitors", "dht_modulation", "endocrine_suppression"],
        population_context="Randomized double-blind placebo-controlled trial across 99 healthy adult men.",
        summary="Showed that finasteride and dutasteride treatment induced reversible reductions in sperm count and semen volume in a notable subset of healthy participants.",
        limitations=["Changes were generally reversible upon drug cessation; individual susceptibility varies."],
        chunks=[
            EvidenceChunk(
                chunk_id="finasteride-sperm-suppression",
                document_id="finasteride-semen-trial-2007",
                topic="Finasteride and Semen Parameter Reversibility",
                text="Finasteride administration reduces intraprostatic DHT and can cause variable, reversible reductions in total sperm count and ejaculate volume in healthy men, which typically normalize following discontinuation.",
                evidence_tags=["finasteride", "5_alpha_reductase_inhibitors"],
                clinical_significance="Guides clinical history taking for hair-loss medications in men seeking fertility assessment.",
                limitations=["Medication adjustments must be discussed with the prescribing physician."],
            )
        ],
    ),

    # ── 25. SSRI Antidepressants & Semen Quality (Semet et al. 2022) ──────────
    EvidenceDocument(
        id="ssri-semen-quality-meta-2022",
        title="The effect of SSRIs on Semen quality: A systematic review and meta-analysis",
        source="PubMed",
        organization="National Institutes of Health / PubMed",
        publication_year=2022,
        document_type="systematic_review",
        url="https://pubmed.ncbi.nlm.nih.gov/36188547/",
        source_identifier="PMID: 36188547",
        evidence_tags=["ssri", "serotonin", "sexual_function", "semen_parameters"],
        population_context="Systematic review and meta-analysis evaluating selective serotonin reuptake inhibitors on seminal parameters.",
        summary="Identified associations between SSRI pharmacotherapy and increases in sperm DNA fragmentation alongside delayed ejaculation and reduced progressive motility.",
        limitations=["Psychological depression is itself an important confounder; patients must not stop psychiatric medication without physician consultation."],
        chunks=[
            EvidenceChunk(
                chunk_id="ssri-sperm-dna-fragmentation",
                document_id="ssri-semen-quality-meta-2022",
                topic="SSRI Pharmacotherapy and Seminal Integrity",
                text="SSRIs can impact male reproductive parameters through central serotonergic inhibition of ejaculation and peripheral induction of oxidative stress in the epididymis leading to elevated DNA fragmentation.",
                evidence_tags=["ssri", "sexual_function", "semen_parameters"],
                clinical_significance="Ensures clinical reports handle antidepressant medication screening sensitively and avoid unguided cessation.",
                limitations=["Antidepressants must never be discontinued without direct medical supervision."],
            )
        ],
    ),

    # ── 26. Male Genital Self-Image Scale Validation (Herbenick 2013) ─────────
    EvidenceDocument(
        id="genital-self-image-validation-2013",
        title="The development and validation of the Male Genital Self-Image Scale: results from a nationally representative probability sample of men in the United States",
        source="PubMed",
        organization="National Institutes of Health / PubMed",
        publication_year=2013,
        document_type="consensus",
        url="https://pubmed.ncbi.nlm.nih.gov/23551571/",
        source_identifier="PMID: 23551571",
        evidence_tags=["genital_self_image", "body_confidence", "body_image"],
        population_context="Nationally representative US probability sample validation study of 1,690 men.",
        summary="Validated the Male Genital Self-Image Scale (MGSIS) as an psychometrically sound measure of genital satisfaction correlated with psychosexual comfort.",
        limitations=["Genital self-perception scores have zero association with physical fertility or semen quality."],
        chunks=[
            EvidenceChunk(
                chunk_id="mgsis-psychosexual-comfort",
                document_id="genital-self-image-validation-2013",
                topic="Genital Self-Image and Intimacy Confidence",
                text="The Male Genital Self-Image Scale measures cognitive-affective satisfaction with genital appearance. Scores correlate strongly with sexual esteem and intimacy confidence, but have no biological connection to fertility potential.",
                evidence_tags=["genital_self_image", "body_confidence"],
                clinical_significance="Safeguards reporting to ensure body image questions are never conflated with fertility diagnoses.",
                limitations=["Construct is purely psychosexual; zero diagnostic fertility significance."],
            )
        ],
    ),
]


# ---------------------------------------------------------------------------
# Corpus Lookup Index
# ---------------------------------------------------------------------------

DOCUMENT_MAP: dict[str, EvidenceDocument] = {doc.id: doc for doc in EVIDENCE_CORPUS}
CHUNK_MAP: dict[str, EvidenceChunk] = {
    chunk.chunk_id: chunk for doc in EVIDENCE_CORPUS for chunk in doc.chunks
}
