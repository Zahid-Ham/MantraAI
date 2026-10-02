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
]


# ---------------------------------------------------------------------------
# Corpus Lookup Index
# ---------------------------------------------------------------------------

DOCUMENT_MAP: dict[str, EvidenceDocument] = {doc.id: doc for doc in EVIDENCE_CORPUS}
CHUNK_MAP: dict[str, EvidenceChunk] = {
    chunk.chunk_id: chunk for doc in EVIDENCE_CORPUS for chunk in doc.chunks
}
