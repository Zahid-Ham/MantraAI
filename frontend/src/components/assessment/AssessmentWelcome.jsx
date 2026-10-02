import React from 'react';

export default function AssessmentWelcome({ onStart }) {
  const topics = [
    {
      id: 'lifestyle',
      title: 'Lifestyle',
      bg: 'bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'reproductive',
      title: 'Reproductive health',
      bg: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      id: 'sexual',
      title: 'Sexual wellbeing',
      bg: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      id: 'stress',
      title: 'Stress & mental wellbeing',
      bg: 'bg-[#FAF5FF] text-[#9333EA] border-[#E9D5FF]',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      id: 'environment',
      title: 'Environmental factors',
      bg: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      id: 'habits',
      title: 'Habits & behaviours',
      bg: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full bg-white border border-[#EAE5DD] rounded-3xl p-6 sm:p-8 lg:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.03)] relative overflow-hidden font-sans">
      
      {/* Decorative background curve */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#FFF2EB]/40 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
        
        {/* Left Column: Heading, Description, Meta Info, CTA, Topics */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          
          {/* Eyebrow */}
          <span className="text-[12.5px] font-bold tracking-[0.14em] text-[#D25619] uppercase mb-3 block">
            PRIVATE HEALTH ASSESSMENT
          </span>

          {/* Main Editorial Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-serif text-[#1C1917] leading-[1.18] tracking-tight mb-4">
            A structured conversation about your{' '}
            <span className="text-[#D25619] italic font-serif">health and wellbeing.</span>
          </h1>

          {/* Supporting Description */}
          <p className="text-[15.5px] sm:text-[16px] text-[#57534E] leading-relaxed mb-6 max-w-xl font-normal">
            Answer a few questions about your lifestyle, environment and reproductive health. Your responses help us understand your health context and provide personalised guidance.
          </p>

          {/* Information Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8">
            {/* Item 1: Time */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#FFF2EB] text-[#D25619] flex items-center justify-center shrink-0 border border-[#FED7AA]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-[13.5px] font-medium text-[#292524]">
                ~10–15 minutes
              </span>
            </div>

            {/* Item 2: Privacy */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0 border border-[#A7F3D0]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="text-[13.5px] font-medium text-[#292524]">
                Your responses are private
              </span>
            </div>

            {/* Item 3: Skip sensitive */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0 border border-[#BFDBFE]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-[13.5px] font-medium text-[#292524]">
                You can skip sensitive questions
              </span>
            </div>
          </div>

          {/* Primary CTA Button */}
          <div className="mb-8">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex items-center justify-center gap-2.5 bg-[#D25619] hover:bg-[#B84510] text-white px-8 py-3.5 rounded-xl font-semibold text-[15.5px] shadow-sm hover:shadow transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D25619] focus-visible:ring-offset-2"
            >
              <span>Start Assessment</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          {/* What We'll Explore */}
          <div>
            <h3 className="text-[12px] font-bold text-[#78716C] uppercase tracking-[0.14em] mb-3">
              WHAT WE'LL EXPLORE
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {topics.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[13px] font-medium ${item.bg}`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="truncate text-[#292524]">{item.title}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Editorial Lifestyle Image + Quote Card */}
        <div className="lg:col-span-5 relative flex justify-center items-center">
          <div className="relative w-full max-w-md lg:max-w-none h-[380px] sm:h-[440px] lg:h-[480px] rounded-2xl overflow-hidden shadow-sm border border-[#EAE5DD]">
            <img
              src="/hero_man.jpg"
              alt="Indian man reflecting calmly in warm natural daylight"
              className="w-full h-full object-cover object-center"
              loading="lazy"
            />
            {/* Subtle soft gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Overlaid Quote Card */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-5 bg-white/95 backdrop-blur-sm border border-[#EAE5DD] rounded-xl p-4 sm:p-5 shadow-md">
              <div className="flex items-start gap-2.5 mb-2">
                <span className="text-[#D25619] font-serif text-2xl leading-none">“</span>
                <p className="text-[13px] sm:text-[13.5px] text-[#292524] leading-relaxed font-normal">
                  Better understanding today can help you make more informed decisions for a healthier tomorrow.
                </p>
              </div>
              <div className="w-6 h-[2px] bg-[#D25619] rounded-full mt-1.5 ml-5" />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
