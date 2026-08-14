import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

export default function ResearchSection() {
  const { language } = useLanguage();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 60, damping: 15 }
    }
  };

  const content = {
    en: {
      tag: "Clinical Foundations",
      title: "Grounded in validated clinical research and datasets.",
      desc: "MantraAI does not generate arbitrary health scores. Our diagnostic logic and assessment modules are built entirely on established medical instruments and national datasets.",
      sources: [
        {
          id: "PHQ-9",
          name: "Patient Health Questionnaire-9",
          type: "Clinical Diagnostic Scale",
          scope: "Primary depression severity screening and symptom tracking parameters.",
          citation: "Kroenke K, Spitzer RL, Williams JB. The PHQ-9: validity of a brief depression severity measure. J Gen Intern Med. 2001."
        },
        {
          id: "GAD-7",
          name: "Generalized Anxiety Disorder-7",
          type: "Clinical Severity Scale",
          scope: "Generalized anxiety diagnostic screening module validation and tracking.",
          citation: "Spitzer RL, Kroenke K, Williams JB, Löwe B. A brief measure for assessing generalized anxiety disorder: the GAD-7. Arch Intern Med. 2006."
        },
        {
          id: "NFHS-5",
          name: "National Family Health Survey-5",
          type: "Indian National Health Dataset",
          scope: "Grounding algorithm variables in localized Indian demographic, dietary, and metabolic profiles.",
          citation: "Ministry of Health and Family Welfare, Government of India. National Family Health Survey (NFHS-5), 2019-21."
        },
        {
          id: "Levine et al.",
          name: "Temporal Trends in Sperm Count",
          type: "Meta-Regression Analysis",
          scope: "Baseline variables for reproductive fitness assessment and lifestyle decline risk mapping.",
          citation: "Levine H, Jørgensen N, Martino-Andrade A, et al. Temporal trends in sperm count: a systematic review and meta-regression analysis. Human Reprod Update. 2023."
        }
      ]
    },
    hi: {
      tag: "क्लीनिकल फाउंडेशन / नैदानिक आधार",
      title: "मान्यता प्राप्त नैदानिक ​​अनुसंधान और डेटासेट पर आधारित।",
      desc: "मंत्रएआई (MantraAI) मनमाने ढंग से स्वास्थ्य स्कोर उत्पन्न नहीं करता है। हमारे नैदानिक और मूल्यांकन मॉड्यूल पूरी तरह से स्थापित वैज्ञानिक उपकरणों और राष्ट्रीय चिकित्सा डेटासेट पर आधारित हैं।",
      sources: [
        {
          id: "PHQ-9",
          name: "पेशेंट हेल्थ प्रश्नावली-9 (PHQ-9)",
          type: "नैदानिक ​​निदान पैमाना",
          scope: "प्राथमिक अवसाद गंभीरता स्क्रीनिंग और लक्षण ट्रैकिंग मापदंडों का सत्यापन।",
          citation: "Kroenke K, Spitzer RL, Williams JB. The PHQ-9: validity of a brief depression severity measure. J Gen Intern Med. 2001."
        },
        {
          id: "GAD-7",
          name: "सामान्यीकृत चिंता विकार-7 (GAD-7)",
          type: "नैदानिक ​​गंभीरता पैमाना",
          scope: "सामान्यीकृत चिंता नैदानिक ​​स्क्रीनिंग मॉड्यूल सत्यापन और नियंत्रण मापदंड।",
          citation: "Spitzer RL, Kroenke K, Williams JB, Löwe B. A brief measure for assessing generalized anxiety disorder: the GAD-7. Arch Intern Med. 2006."
        },
        {
          id: "NFHS-5",
          name: "राष्ट्रीय परिवार स्वास्थ्य सर्वेक्षण-5",
          type: "भारतीय राष्ट्रीय स्वास्थ्य डेटासेट",
          scope: "स्थानीयकृत भारतीय जनसांख्यिकीय, जीवनशैली, आहार और चयापचय प्रोफाइल में एल्गोरिदम का मिलान।",
          citation: "स्वास्थ्य और परिवार कल्याण मंत्रालय, भारत सरकार। राष्ट्रीय परिवार स्वास्थ्य सर्वेक्षण (NFHS-5), 2019-21।"
        },
        {
          id: "Levine et al.",
          name: "शुक्राणु संख्या में लौकिक रुझान",
          type: "मेटा-प्रतिगमन विश्लेषण",
          scope: "प्रजनन क्षमता मूल्यांकन और जीवन शैली में गिरावट के जोखिम मानचित्रण के लिए आधारभूत डेटा मापदंड।",
          citation: "Levine H, Jørgensen N, Martino-Andrade A, et al. Temporal trends in sperm count: a systematic review and meta-regression analysis. Human Reprod Update. 2023."
        }
      ]
    }
  }[language];

  return (
    <section className="bg-cream-dark/30 dark:bg-night-dark/50 text-night-blue dark:text-cream py-24 px-6 md:px-16 border-b border-border-light dark:border-border-dark relative z-10 transition-colors duration-500">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Header */}
        <div className="mb-16">
          <span className="text-marigold font-grotesk text-xs font-semibold tracking-[0.2em] uppercase mb-4 block">
            {content.tag}
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-normal leading-[1.1] tracking-tight max-w-2xl">
            {content.title}
          </h2>
          <p className="font-grotesk text-night-blue/60 dark:text-cream/60 text-sm md:text-base font-light mt-4 max-w-lg leading-relaxed">
            {content.desc}
          </p>
        </div>

        {/* Quiet Citation Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12"
        >
          {content.sources.map((src, idx) => (
            <motion.div 
              key={idx} 
              variants={itemVariants}
              className="flex flex-col justify-between border-t border-border-light dark:border-border-dark pt-6"
            >
              <div>
                <div className="flex justify-between items-baseline mb-3">
                  <span className="font-serif text-2xl font-normal text-night-blue dark:text-cream">{src.id}</span>
                  <span className="font-grotesk text-[10px] text-marigold uppercase tracking-wider font-semibold">{src.type}</span>
                </div>
                <h3 className="font-grotesk text-sm font-semibold text-night-blue dark:text-cream mb-2">{src.name}</h3>
                <p className="font-grotesk text-sm text-night-blue/70 dark:text-cream/70 font-light leading-relaxed mb-6">
                  {src.scope}
                </p>
              </div>
              
              {/* Scientific Citation */}
              <div className="bg-cream-dark/50 dark:bg-night-blue/30 border border-border-light dark:border-border-dark p-3 text-[10px] text-night-blue/50 dark:text-cream/40 font-grotesk leading-relaxed">
                {src.citation}
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
