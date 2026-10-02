import React, { useState } from 'react';

const faqs = [
  {
    id: 'faq-1',
    question: 'Is MantraAI a replacement for a doctor?',
    answer:
      'No. MantraAI is designed for health awareness, education and evidence-informed guidance. It does not replace professional diagnosis or treatment. When a concern may require clinical evaluation, the platform should guide the user toward appropriate professional care.',
  },
  {
    id: 'faq-2',
    question: 'Is my data private and secure?',
    answer:
      'MantraAI is designed with privacy as a core principle. Sensitive health information should be handled with appropriate authentication, access controls, secure storage and explicit user consent. Do not describe the platform as completely anonymous or 100% secure unless the implemented architecture actually supports that claim.',
  },
  {
    id: 'faq-3',
    question: 'What kind of questions are included in the assessment?',
    answer:
      'The assessment can cover areas such as lifestyle, nutrition, environmental exposure, reproductive history, sexual wellbeing, stress and other contextual factors. Questions are intended to build a health context rather than independently diagnose a condition.',
  },
  {
    id: 'faq-4',
    question: 'Can I track my progress over time?',
    answer:
      'Yes, this is a core direction of MantraAI. Multiple assessment sessions should be preserved so users can compare their health context and progress over time rather than replacing their previous assessment.',
  },
  {
    id: 'faq-5',
    question: 'Does MantraAI diagnose infertility or other health conditions?',
    answer:
      'No. MantraAI can provide screening-oriented insights and educational guidance, but a diagnosis requires appropriate clinical evaluation. Fertility assessment may require professional evaluation and clinical tests such as semen analysis when indicated.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* Left Column: Heading & Context */}
        <div className="lg:col-span-4">
          <span className="text-[13px] font-bold tracking-[0.15em] text-[#D25619] uppercase block mb-3 font-sans">
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-serif text-[#1C1917] dark:text-[#F5F2EB] leading-[1.15] tracking-tight mb-4">
            Find answers to <br className="hidden sm:inline" />
            <span className="text-[#D25619] italic font-serif">common questions.</span>
          </h2>
          <p className="text-[15px] sm:text-[16px] text-[#57534E] dark:text-[#A8A29E] leading-relaxed font-normal mb-8">
            Quick answers to help you understand how MantraAI works and what to expect.
          </p>

          {/* Support Card (Shown in left column on desktop or stacked on mobile) */}
          <div className="bg-[#EAF5F0] dark:bg-[#132820] border border-[#CDE5D8] dark:border-[#1E3E32] rounded-2xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#34D399]/20 text-[#059669] dark:text-[#34D399] flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-[17px] font-semibold text-[#1C1917] dark:text-[#F5F2EB] mb-2">
              Still have questions?
            </h3>
            <p className="text-[14px] text-[#57534E] dark:text-[#A8A29E] leading-relaxed mb-4">
              We're here to help. Reach out to our support team for any queries.
            </p>
            <a
              href="#resources"
              className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#059669] dark:text-[#34D399] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] rounded"
            >
              <span>Contact Support</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>

        {/* Right Column: Accordion Questions */}
        <div className="lg:col-span-8 space-y-3.5">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const buttonId = `faq-btn-${faq.id}`;
            const contentId = `faq-content-${faq.id}`;

            return (
              <div
                key={faq.id}
                className="bg-white dark:bg-[#151921] border border-[#EAE5DD] dark:border-[#262C36] rounded-xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  onClick={() => toggleFAQ(index)}
                  className="w-full text-left px-5 sm:px-6 py-4 sm:py-4.5 flex items-center justify-between gap-4 font-semibold text-[15px] sm:text-[16px] text-[#1C1917] dark:text-[#F5F2EB] hover:text-[#D25619] dark:hover:text-[#D25619] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D25619]"
                >
                  <span className="leading-snug">{faq.question}</span>
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-[#EAE5DD] dark:border-[#2E3545] transition-transform duration-200 ${
                      isOpen
                        ? 'bg-[#FEF0E6] dark:bg-[#2A1D16] text-[#D25619] rotate-45'
                        : 'bg-[#FAF8F5] dark:bg-[#1F242F] text-[#78716C]'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                </button>

                {isOpen && (
                  <div
                    id={contentId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="px-5 sm:px-6 pb-5 pt-1 text-[14.5px] sm:text-[15px] text-[#57534E] dark:text-[#A8A29E] leading-relaxed border-t border-[#F5F2EB] dark:border-[#1F242F]"
                  >
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
