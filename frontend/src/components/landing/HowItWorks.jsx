import React from 'react';

export default function HowItWorks() {
  const steps = [
    {
      step: '1',
      title: 'Take an Assessment',
      description: 'Answer a few questions privately at your own pace.',
      numBg: 'bg-[#FEF0E6] text-[#D25619] border-[#FAD8C3]',
      iconBg: 'bg-[#FEF0E6] text-[#D25619]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      step: '2',
      title: 'Get Personalised Insights',
      description: 'Receive a structured report and understand the areas worth focusing on.',
      numBg: 'bg-[#EEF5FD] text-[#2E75D3] border-[#D5E6FA]',
      iconBg: 'bg-[#EEF5FD] text-[#2E75D3]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      step: '3',
      title: 'Follow Your Action Plan',
      description: 'Take practical steps tailored to your health context and priorities.',
      numBg: 'bg-[#E8F4EE] text-[#2D7A68] border-[#C8E5D7]',
      iconBg: 'bg-[#E8F4EE] text-[#2D7A68]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      step: '4',
      title: 'Track Progress Over Time',
      description: 'See how your health context and progress change across repeated assessments.',
      numBg: 'bg-[#F4F0FB] text-[#7048B6] border-[#E4D9F8]',
      iconBg: 'bg-[#F4F0FB] text-[#7048B6]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-20 lg:py-24 border-t border-[#EAE5DD] bg-[#FAF8F5] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-12 sm:mb-16">
          <span className="text-[12.5px] sm:text-[13px] font-bold uppercase tracking-[0.14em] text-[#D25619] block mb-2.5">
            HOW IT WORKS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-normal leading-[1.12] text-[#1C1917] font-editorial-serif tracking-tight">
            A simple path to better health.
          </h2>
        </div>

        {/* Desktop 4-Stage Horizontal Connected Layout */}
        <div className="hidden lg:block relative mb-14">
          
          {/* Subtle horizontal connecting line spanning behind stage indicators */}
          <div className="absolute top-[28px] left-[6%] right-[6%] h-[1px] border-t border-dashed border-[#D6D0C4] pointer-events-none z-0" />

          <div className="grid grid-cols-4 gap-8 relative z-10">
            {steps.map((item, idx) => (
              <div key={item.step} className="flex flex-col items-start pr-2 group">
                
                {/* Stage Number & Icon Row */}
                <div className="flex items-center gap-3 mb-4 bg-[#FAF8F5] pr-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${item.numBg} shadow-xs`}>
                    {item.step}
                  </span>
                  <div className={`p-2.5 rounded-xl ${item.iconBg} transition-transform group-hover:scale-105`}>
                    {item.icon}
                  </div>
                </div>

                {/* Stage Title */}
                <h3 className="text-[16.5px] sm:text-[17.5px] font-bold text-[#1C1917] group-hover:text-[#D25619] transition-colors mb-2">
                  {item.title}
                </h3>

                {/* Stage Description */}
                <p className="text-[14px] sm:text-[14.5px] text-[#57534E] leading-[1.55]">
                  {item.description}
                </p>

              </div>
            ))}
          </div>

        </div>

        {/* Mobile & Tablet Vertical Connected Journey Layout */}
        <div className="lg:hidden relative space-y-8 pl-4 sm:pl-6 border-l-2 border-dashed border-[#D6D0C4] ml-3 sm:ml-4 mb-12">
          {steps.map((item) => (
            <div key={item.step} className="relative pl-6 sm:pl-8 group">
              
              {/* Connected node indicator */}
              <div className="absolute -left-[27px] sm:-left-[35px] top-0 flex items-center justify-center">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${item.numBg} bg-white shadow-xs`}>
                  {item.step}
                </span>
              </div>

              {/* Icon & Title */}
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-xl ${item.iconBg}`}>
                  {item.icon}
                </div>
                <h3 className="text-[16.5px] font-bold text-[#1C1917]">
                  {item.title}
                </h3>
              </div>

              {/* Description */}
              <p className="text-[14px] text-[#57534E] leading-[1.55] max-w-md">
                {item.description}
              </p>

            </div>
          ))}
        </div>

        {/* Reassessment Loop & Longitudinal Philosophy Banner */}
        <div className="mt-8 pt-8 border-t border-[#EAE5DD] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-[13px] text-[#57534E]">
          <div className="flex flex-wrap items-center gap-2 font-medium">
            <span className="font-bold uppercase tracking-wider text-[11px] text-[#D25619] bg-[#FEF0E6] border border-[#FAD8C3] px-2 py-0.5 rounded-md">
              CONTINUOUS CARE
            </span>
            <span className="text-[#1C1917] font-semibold">
              Assess → Understand → Act → Track → Reassess
            </span>
          </div>

          <p className="text-[#68645E] max-w-lg leading-relaxed">
            Your health journey doesn't end with one report. MantraAI is built for periodic reassessments to measure how positive lifestyle adjustments reflect across your wellness profile.
          </p>
        </div>

      </div>
    </section>
  );
}
