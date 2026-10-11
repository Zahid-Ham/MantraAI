import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function UrgentInterruptionView({
  onReturnHome,
  triageDetails,
}) {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const headline = triageDetails?.headline || (
    isHi ? 'तत्काल चिकित्सकीय सहायता आवश्यक' : 'Immediate In-Person Medical Attention Required'
  );

  const guidance = triageDetails?.guidance || (
    isHi
      ? 'आपके बताए गए लक्षण एक संभावित तीव्र चिकित्सकीय स्थिति (जैसे टेस्टिकुलर टॉरशन, गंभीर आघात या संक्रमण) की ओर संकेत करते हैं जिसके लिए तत्काल अस्पताल जाने की आवश्यकता है।'
      : 'Your reported symptoms indicate an acute medical concern (such as potential testicular torsion, acute trauma, or severe infection) that warrants immediate emergency department evaluation.'
  );

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 font-sans">
      <div className="bg-[#FEF2F2] border-2 border-[#DC2626] rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
        
        {/* Urgent Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#DC2626] text-white flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#991B1B] uppercase tracking-wider bg-white/80 px-2.5 py-0.5 rounded-full border border-[#FECACA]">
              {isHi ? 'आपातकालीन नैदानिक इंटरप्शन' : 'Urgent Clinical Safety Interruption'}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#991B1B] tracking-tight">
              {headline}
            </h1>
          </div>
        </div>

        {/* Guidance Paragraph */}
        <div className="bg-white/80 p-4 rounded-2xl border border-[#FECACA] space-y-2">
          <p className="text-xs sm:text-sm text-[#7F1D1D] font-medium leading-relaxed">
            {guidance}
          </p>
          <p className="text-[11px] text-[#991B1B] italic">
            {isHi
              ? 'कृपया सामान्य जीवनशैली प्रश्नावली भरने के लिए अपनी आपातकालीन देखभाल में देरी न करें। आपका स्वास्थ्य सबसे महत्वपूर्ण है।'
              : 'Please do not delay seeking immediate medical care to complete an online wellness questionnaire. Your physical health takes absolute priority.'}
          </p>
        </div>

        {/* Immediate Care Instructions */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-[#991B1B] uppercase tracking-wider">
            {isHi ? 'तत्काल देखभाल निर्देश:' : 'Immediate Care Instructions:'}
          </h2>
          <ul className="space-y-2 text-xs text-[#7F1D1D]">
            <li className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-[#FEE2E2]">
              <span className="font-bold text-[#DC2626]">•</span>
              <span>
                <strong>{isHi ? 'तुरंत आपातकालीन मूल्यांकन प्राप्त करें:' : 'Seek emergency assessment immediately:'}</strong>{' '}
                {isHi
                  ? 'निकटतम अस्पताल के आपातकालीन कक्ष (ER) जाएं या 112 / 108 पर कॉल करें। लक्षणों के ठीक होने का इंतजार न करें और प्रश्नावली पूरी करने में देरी न करें।'
                  : 'Proceed immediately to the nearest hospital Emergency Room or call 112 / 108. Do not wait for symptoms to improve, and do not delay seeking care to complete questionnaires.'}
              </span>
            </li>
            <li className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-[#FEE2E2]">
              <span className="font-bold text-[#DC2626]">•</span>
              <span>
                <strong>{isHi ? 'चिकित्सक व आपातकालीन कर्मियों के निर्देशों का पालन करें:' : 'Follow clinician & emergency personnel instructions:'}</strong>{' '}
                {isHi
                  ? 'यदि तत्काल शल्य चिकित्सा मूल्यांकन की संभावना हो, तो उपस्थित चिकित्सकों द्वारा निर्देशित किए जाने तक कुछ भी खाने-पीने से बचें।'
                  : 'Follow instructions from attending emergency personnel upon arrival. If urgent surgical evaluation is required, avoid eating or drinking unless specifically advised by attending clinicians.'}
              </span>
            </li>
            <li className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-[#FEE2E2]">
              <span className="font-bold text-[#DC2626]">•</span>
              <span>
                <strong>{isHi ? 'घरेलू उपचार से बचें और देरी न करें:' : 'Avoid home remedies & prevent secondary delays:'}</strong>{' '}
                {isHi
                  ? 'अंडकोष पर हीटिंग पैड या गर्म सिकाई न लगाएं, और किसी भी घरेलू उपाय या तैयारी के कारण तत्काल अस्पताल जाने में देरी न होने दें।'
                  : 'Avoid applying heating pads, hot water bottles, or attempting home remedies. Do not let secondary advice or preparation delay immediate emergency care.'}
              </span>
            </li>
          </ul>
        </div>

        {/* Verified Emergency Contacts (India Deployment) */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-bold text-[#991B1B] uppercase tracking-wider">
            {isHi ? 'सत्यापित आपातकालीन एवं हेल्पलाइन संपर्क (भारत):' : 'Verified Emergency Contacts (India):'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href="tel:112"
              className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#FECACA] hover:border-[#DC2626] transition-colors group"
            >
              <div>
                <div className="text-xs font-bold text-[#991B1B]">National Emergency Helpline (ERSS)</div>
                <div className="text-[11px] text-[#78716C]">Police / Fire / Medical (Govt of India, 24/7)</div>
              </div>
              <span className="text-sm font-extrabold text-[#DC2626] group-hover:underline">112</span>
            </a>

            <a
              href="tel:108"
              className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#FECACA] hover:border-[#DC2626] transition-colors group"
            >
              <div>
                <div className="text-xs font-bold text-[#991B1B]">National Ambulance Service</div>
                <div className="text-[11px] text-[#78716C]">Emergency Medical Transport (NHM, 24/7)</div>
              </div>
              <span className="text-sm font-extrabold text-[#DC2626] group-hover:underline">108</span>
            </a>

            <a
              href="tel:14416"
              className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#FECACA] hover:border-[#DC2626] transition-colors group"
            >
              <div>
                <div className="text-xs font-bold text-[#991B1B]">Tele-MANAS (Mental Health Helpline)</div>
                <div className="text-[11px] text-[#78716C]">Govt of India, 24/7 Toll-Free, 20+ Languages</div>
              </div>
              <span className="text-sm font-extrabold text-[#DC2626] group-hover:underline">14416 / 1800-891-4416</span>
            </a>

            <a
              href="tel:18005990019"
              className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#FECACA] hover:border-[#DC2626] transition-colors group"
            >
              <div>
                <div className="text-xs font-bold text-[#991B1B]">KIRAN Mental Health Helpline</div>
                <div className="text-[11px] text-[#78716C]">Govt of India, 24/7 Toll-Free, 13 Languages</div>
              </div>
              <span className="text-sm font-extrabold text-[#DC2626] group-hover:underline">1800-599-0019</span>
            </a>

            <a
              href="tel:+919999666555"
              className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#FECACA] hover:border-[#DC2626] transition-colors group sm:col-span-2"
            >
              <div>
                <div className="text-xs font-bold text-[#991B1B]">Vandrevala Foundation Helpline</div>
                <div className="text-[11px] text-[#78716C]">24/7 Free Professional Support (Call & WhatsApp)</div>
              </div>
              <span className="text-sm font-extrabold text-[#DC2626] group-hover:underline">+91 9999 666 555</span>
            </a>
          </div>
        </div>

        {/* Platform Disclaimer */}
        <div className="p-3 bg-white/60 border border-[#FEE2E2] rounded-xl text-[11px] text-[#78716C] leading-relaxed">
          <strong>{isHi ? 'प्लेटफ़ॉर्म अस्वीकरण:' : 'Platform Disclaimer:'}</strong>{' '}
          {isHi
            ? 'MantraAI कोई निदान नहीं करता है और न ही आपातकालीन चिकित्सा सुविधा प्रदान करता है। कृपया आपातकालीन देखभाल प्रदाता से तुरंत संपर्क करें।'
            : 'MantraAI is an educational screening software and is NOT an emergency medical service, clinic, or diagnostic tool. Please connect directly with an emergency healthcare provider.'}
        </div>

        {/* Action Button */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onReturnHome}
            className="w-full sm:w-auto px-8 py-3 bg-[#1C1917] hover:bg-black text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            {isHi ? 'होम डैशबोर्ड पर वापस जाएं' : 'Return to Dashboard'}
          </button>
        </div>

      </div>
    </div>
  );
}
