import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function PreAssessmentSafetyScreener({
  onSafeToProceed,
  onEmergencyTriggered,
  onNavigateHome,
}) {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const redFlags = [
    {
      title: isHi
        ? 'अचानक या गंभीर अंडकोष का दर्द (घंटों के भीतर शुरू हुआ)'
        : 'Sudden, severe, or agonizing testicular or scrotal pain (onset within hours)',
      sub: isHi
        ? 'आपातकालीन स्थिति — तुरंत आपातकालीन चिकित्सा मूल्यांकन प्राप्त करें। प्रश्नावली पूरी करने या दर्द कम होने की प्रतीक्षा न करें।'
        : 'Time-critical emergency — seek immediate emergency medical evaluation now. Do not wait for symptoms to improve or delay to complete questionnaires.',
    },
    {
      title: isHi
        ? 'अंडकोष में तेजी से सूजन के साथ तेज बुखार या ठंड लगना'
        : 'Rapid scrotal swelling accompanied by high fever, severe chills, or nausea',
      sub: isHi
        ? 'संभावित तीव्र गंभीर संक्रमण — तत्काल चिकित्सकीय मूल्यांकन की आवश्यकता।'
        : 'Suspected acute severe epididymo-orchitis or systemic infection requiring prompt medical care.',
    },
    {
      title: isHi
        ? 'कमर या अंडकोष में हाल ही में गंभीर चोट जिसके बाद भारी सूजन या नीला पड़ना'
        : 'Recent blunt trauma or injury to the groin/testicles followed by severe swelling or bruising',
      sub: isHi
        ? 'संभावित टेस्टिकुलर फ्रैक्चर या हेमेटोमा — तत्काल शारीरिक परीक्षण की आवश्यकता।'
        : 'Suspected testicular rupture or hematoma requiring immediate clinical physical examination and ultrasound.',
    },
    {
      title: isHi
        ? 'पेशाब करने में असमर्थता या पेशाब में भारी खून के थक्के आना'
        : 'Inability to urinate or heavy visible blood / clots in urine',
      sub: isHi
        ? 'तीव्र मूत्र अवरोध या ग्रॉस हेमट्यूरिया — तत्काल आपातकालीन देखभाल की आवश्यकता।'
        : 'Acute urinary retention or gross hematuria requiring immediate clinical attention.',
    },
    {
      title: isHi
        ? 'स्वयं को नुकसान पहुंचाने, आत्महत्या के विचार या अत्यधिक मानसिक संकट'
        : 'Thoughts of self-harm, suicide, or overwhelming mental health crisis',
      sub: isHi
        ? 'तत्काल सहायता उपलब्ध है — टेली-मानस (14416) या 112 पर अभी संपर्क करें।'
        : 'Immediate 24/7 crisis support is available. Please reach out right now.',
    },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 font-sans">
      <div className="bg-white border-2 border-[#E7E2DA] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Clinical Safety Badge & Header */}
        <div className="space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-bold tracking-wide uppercase">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{isHi ? 'नैदानिक सुरक्षा जांच' : 'Clinical Safety Checkpoint'}</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#1C1917] tracking-tight">
            {isHi ? 'क्या आप इनमें से किसी भी आपातकालीन लक्षण का अनुभव कर रहे हैं?' : 'Are you currently experiencing any urgent symptoms?'}
          </h1>

          <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
            {isHi
              ? 'MantraAI एक शैक्षिक वेलनेस स्क्रीनिंग प्लेटफॉर्म है और आपातकालीन चिकित्सा सेवा नहीं है। यदि आप वर्तमान में नीचे दिए गए किसी भी लक्षण का सामना कर रहे हैं, तो प्रश्नावली भरने के बजाय तत्काल चिकित्सकीय मूल्यांकन की आवश्यकता है:'
              : 'MantraAI is an educational wellness intelligence platform and is NOT an emergency medical service. If you are experiencing any of the following acute symptoms right now, you require immediate in-person emergency care rather than completing a routine questionnaire:'}
          </p>
        </div>

        {/* 5 High-Urgency Symptoms Checklist */}
        <div className="space-y-3">
          {redFlags.map((flag, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-[#FFF8F8] border border-[#FEE2E2] transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                !
              </div>
              <div className="space-y-0.5 flex-1">
                <h2 className="text-xs sm:text-sm font-bold text-[#991B1B]">
                  {flag.title}
                </h2>
                <p className="text-[11px] sm:text-xs text-[#7F1D1D] leading-relaxed">
                  {flag.sub}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer Note */}
        <div className="p-3.5 rounded-xl bg-[#F5F2EB] border border-[#EAE5DD] text-[11px] text-[#78716C] leading-relaxed">
          <strong className="text-[#57534E]">
            {isHi ? 'महत्वपूर्ण सूचना:' : 'Important Clinical Boundary:'}
          </strong>{' '}
          {isHi
            ? 'MantraAI कोई निदान नहीं करता है और न ही आपातकालीन सेवाएं भेजता है। आपातकालीन स्थिति में 112 डायल करें या निकटतम अस्पताल जाएं।'
            : 'MantraAI does not provide medical diagnoses or dispatch emergency medical services. In a physical emergency, call 112 or visit the nearest emergency department immediately.'}
        </div>

        {/* Unambiguous Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onEmergencyTriggered}
            className="flex-1 py-3.5 px-4 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              {isHi ? 'हाँ, मुझे इनमें से लक्षण हैं' : 'Yes, I am experiencing one or more symptoms'}
            </span>
          </button>

          <button
            type="button"
            onClick={onSafeToProceed}
            className="flex-1 py-3.5 px-4 rounded-xl bg-[#1E3A2B] hover:bg-[#14281D] text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 shrink-0 text-[#86EFAC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>
              {isHi ? 'नहीं, मुझे कोई आपातकालीन लक्षण नहीं है' : 'No, none of these apply (Proceed)'}
            </span>
          </button>
        </div>

        {onNavigateHome && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onNavigateHome}
              className="text-xs text-[#78716C] hover:text-[#1C1917] underline cursor-pointer"
            >
              {isHi ? 'होम पर वापस जाएं' : 'Return to Dashboard'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
