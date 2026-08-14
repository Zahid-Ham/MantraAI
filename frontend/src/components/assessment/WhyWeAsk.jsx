import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

export default function WhyWeAsk({ questionData, isOpen, onClose }) {
  const { language } = useLanguage();

  // Escape key listener for accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!questionData || !isOpen) return null;

  // Dot-based meter calculation
  const getRelevanceMeter = (level) => {
    if (level === 'high') {
      return { dots: "●●●●○", text: { en: "Higher relevance to screening", hi: "स्क्रीनिंग के लिए उच्च प्रासंगिकता" } };
    } else if (level === 'moderate') {
      return { dots: "●●●○○", text: { en: "Moderate relevance", hi: "मध्यम प्रासंगिकता" } };
    } else {
      return { dots: "●●○○○", text: { en: "Contextual information", hi: "प्रासंगिक जानकारी" } };
    }
  };

  // Category-based clinical context mapping
  const getCategoryDetails = (blockId) => {
    if ([1, 2, 3, 4, 5].includes(blockId)) {
      return {
        label: { en: "PHYSICAL / LIFESTYLE RELATIONSHIP", hi: "शारीरिक / जीवनशैली संबंध" },
        desc: {
          en: "Physical lifestyle parameters, such as sleep patterns, heat exposure, and activity levels, can influence overall hormone synthesis and reproductive parameters.",
          hi: "नींद के पैटर्न, गर्मी के संपर्क और गतिविधि के स्तर जैसे शारीरिक जीवनशैली कारक समग्र हार्मोन संश्लेषण और प्रजनन स्वास्थ्य को प्रभावित कर सकते हैं।"
        }
      };
    } else if (blockId === 6) {
      return {
        label: { en: "MENTAL WELLNESS INTERACTION", hi: "मानसिक स्वास्थ्य प्रभाव" },
        desc: {
          en: "Mental wellbeing and stress indices directly interact with hormone pathways, sleep cycles, vascular function, and overall physical vitality.",
          hi: "मानसिक कल्याण और तनाव के स्तर सीधे तौर पर हार्मोन स्राव, नींद के चक्र, रक्त प्रवाह की दक्षता और समग्र शारीरिक स्वास्थ्य से जुड़े होते हैं।"
        }
      };
    } else if (blockId === 7) {
      return {
        label: { en: "REPRODUCTIVE PATHWAY ROUTING", hi: "प्रजनन लक्षण मार्ग" },
        desc: {
          en: "This information helps identify whether additional professional evaluation or a specific clinical symptom pathway may be appropriate.",
          hi: "यह जानकारी यह पहचानने में मदद करती है कि क्या अतिरिक्त पेशेवर मूल्यांकन या विशिष्ट नैदानिक ​​लक्षण परामर्श मार्ग उपयुक्त हो सकता है।"
        }
      };
    } else if (blockId === 8) {
      return {
        label: { en: "MEDICATION & EXPOSURE PATHWAYS", hi: "दवा और उपचार प्रभाव" },
        desc: {
          en: "Some medications or pharmaceutical compounds can affect reproductive or sexual function, helping prevent incorrect interpretation of other answers.",
          hi: "कुछ दवाएं प्रजनन या यौन स्वास्थ्य को प्रभावित कर सकती हैं, जिससे अन्य उत्तरों की गलत व्याख्या को रोकने में मदद मिलती है।"
        }
      };
    } else if (blockId === 9) {
      return {
        label: { en: "DIGITAL SEXUAL HABITS CONTEXT", hi: "डिजिटल यौन आदतें संदर्भ" },
        desc: {
          en: "Digital consumption patterns are evaluated for habituation context, focus, sleep parameters, and relational impact, focusing solely on behavioral health without moral judgment.",
          hi: "डिजिटल उपभोग पैटर्न का मूल्यांकन केवल व्यवहारिक स्वास्थ्य के संदर्भ में किया जाता है, जिसमें नियंत्रण, नींद के मापदंडों और आपसी संबंधों पर ध्यान केंद्रित किया जाता है।"
        }
      };
    } else if (blockId === 10) {
      return {
        label: { en: "PERFORMANCE ANXIETY MECHANISM", hi: "प्रदर्शन चिंता तंत्र" },
        desc: {
          en: "Performance stress parameters shapes sensory triggers and adrenaline responses which interact directly with vascular blood flow.",
          hi: "प्रदर्शन तनाव के कारक संवेदी ट्रिगर्स और एड्रेनालाईन प्रतिक्रियाओं को प्रभावित करते हैं जो रक्त परिसंचरण से जुड़े होते हैं।"
        }
      };
    } else if (blockId === 11) {
      return {
        label: { en: "BODY IMAGE & SELF-PERCEPTION", hi: "शारीरिक छवि व आत्म-धारणा" },
        desc: {
          en: "Self-perception and physical satisfaction variables can interact with confidence, intimacy comfort levels, and psychological stress variables.",
          hi: "आत्म-धारणा और शारीरिक संतुष्टि के कारक आत्मविश्वास, अंतरंगता और मनोवैज्ञानिक तनाव स्तर को प्रभावित कर सकते हैं।"
        }
      };
    } else if (blockId === 12) {
      return {
        label: { en: "RELATIONAL & SOCIAL CONTEXT", hi: "सामाजिक व पारस्परिक संबंध" },
        desc: {
          en: "Relationship status and satisfaction may help understand baseline stress and wellbeing variables, but do not determine fertility by themselves.",
          hi: "पारस्परिक संबंधों की स्थिति और संतुष्टि स्तर तनाव और मानसिक कल्याण को समझने में मदद कर सकते हैं, लेकिन वे अकेले प्रजनन क्षमता का निर्धारण नहीं करते हैं।"
        }
      };
    } else {
      return {
        label: { en: "COPING MECHANISM STRATEGIES", hi: "तनाव प्रबंधन प्रणालियाँ" },
        desc: {
          en: "Coping strategies reveal indirect lifestyle risk factors and help guide personalized recommendations or stress resolution pathways.",
          hi: "तनाव से निपटने के तरीके स्वास्थ्य जोखिमों को समझने में मदद करते हैं और व्यक्तिगत अनुशंसाओं या तनाव प्रबंधन रणनीतियों का मार्गदर्शन कर सकते हैं।"
        }
      };
    }
  };

  const relevanceInfo = getRelevanceMeter(questionData.relevance);
  const categoryInfo = getCategoryDetails(questionData.block);
  
  const whyWeAskText = questionData.whyWeAsk?.[language] || questionData.whyWeAsk?.en;
  const evidenceNoteText = questionData.evidenceNote?.[language] || questionData.evidenceNote?.en;

  const content = {
    en: {
      header: "Evidence & Rationale",
      relevanceLabel: "Screening Relevance",
      categoryHeader: "Clinical Rationale Focus",
      disclaimer: "Your answer is considered alongside other factors. It does not determine fertility by itself.",
      learnMore: "Learn more in the Medical Library",
      close: "Close Rationale Panel"
    },
    hi: {
      header: "साक्ष्य एवं तर्क",
      relevanceLabel: "स्क्रीनिंग प्रासंगिकता",
      categoryHeader: "नैदानिक ​​तर्क ध्यान",
      disclaimer: "आपके उत्तर पर अन्य कारकों के साथ विचार किया जाता है। यह अपने आप में प्रजनन क्षमता का निर्धारण नहीं करता है।",
      learnMore: "मेडिकल लाइब्रेरी में अधिक जानें",
      close: "तर्क पैनल बंद करें"
    }
  }[language];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end font-grotesk select-none">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-night-dark/60 dark:bg-night-dark/80 backdrop-blur-xs cursor-pointer"
        />

        {/* Slide-out drawer */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 35 }}
          className="relative w-full max-w-md h-full bg-cream dark:bg-night-blue border-l border-border-light dark:border-border-dark p-8 md:p-10 flex flex-col justify-between shadow-2xl transition-colors duration-500 overflow-y-auto"
        >
          {/* Header */}
          <div>
            <div className="flex justify-between items-center pb-6 border-b border-border-light dark:border-border-dark mb-8">
              <h4 className="font-serif text-2.5xl font-normal text-night-blue dark:text-cream">
                {content.header}
              </h4>
              <button 
                onClick={onClose}
                className="p-2 text-night-blue/50 dark:text-cream/50 hover:text-marigold dark:hover:text-marigold transition-colors cursor-pointer"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content body */}
            <div className="space-y-7 text-sm text-night-blue/80 dark:text-cream/70 font-light leading-relaxed">
              
              {/* Dot-based Relevance Meter */}
              <div>
                <span className="text-[10px] text-marigold uppercase tracking-wider font-semibold block mb-2">
                  {content.relevanceLabel}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base tracking-widest text-marigold">{relevanceInfo.dots}</span>
                  <span className="text-xs font-semibold text-night-blue dark:text-cream">
                    {relevanceInfo.text[language]}
                  </span>
                </div>
              </div>

              {/* Rationale description based on block category */}
              <div>
                <span className="text-[10px] text-marigold uppercase tracking-wider font-semibold block mb-2">
                  {categoryInfo.label[language]}
                </span>
                <p className="text-night-blue/90 dark:text-cream/90 font-medium">
                  {categoryInfo.desc[language]}
                </p>
              </div>

              {/* Why we ask standard field description */}
              <div>
                <span className="text-[10px] text-marigold uppercase tracking-wider font-semibold block mb-2">
                  {content.categoryHeader}
                </span>
                <p>{whyWeAskText}</p>
              </div>

              {/* evidenceNote display */}
              {evidenceNoteText && (
                <div>
                  <span className="text-[10px] text-marigold uppercase tracking-wider font-semibold block mb-2">
                    {language === 'en' ? "Evidence Standard Note" : "साक्ष्य मानक नोट"}
                  </span>
                  <p className="text-xs bg-cream-dark/50 dark:bg-night-dark/30 p-4 border border-border-light dark:border-border-dark leading-relaxed">
                    {evidenceNoteText}
                  </p>
                </div>
              )}

              {/* Learn More affordance */}
              <div className="pt-2">
                <span className="text-[11px] text-marigold underline cursor-pointer hover:text-marigold-light transition-colors font-medium">
                  {content.learnMore} →
                </span>
              </div>
            </div>
          </div>

          {/* Footer Disclaimer */}
          <div className="border-t border-border-light dark:border-border-dark pt-6 mt-8">
            <p className="text-[11px] text-night-blue/50 dark:text-cream/40 italic leading-relaxed mb-6">
              {content.disclaimer}
            </p>
            <button 
              onClick={onClose}
              className="w-full py-3.5 border border-border-light dark:border-border-dark hover:border-marigold text-xs font-semibold uppercase tracking-wider transition-colors duration-300 cursor-pointer text-night-blue dark:text-cream"
            >
              {content.close}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
