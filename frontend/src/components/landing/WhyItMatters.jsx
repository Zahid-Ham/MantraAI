import React from 'react';

export default function WhyItMatters() {
  const benefits = [
    {
      id: 'awareness',
      title: 'Greater Awareness',
      description: 'Helps identify potential concerns early.',
      iconBg: 'bg-[#EBF7F0] text-[#2D7A68]',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      id: 'stigma',
      title: 'Reduced Stigma',
      description: 'Encourages open and informed conversations.',
      iconBg: 'bg-[#EEF5FD] text-[#2E75D3]',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: 'lives',
      title: 'Healthier Lives',
      description: 'Supports better decisions for long-term wellbeing.',
      iconBg: 'bg-[#FEF1EA] text-[#D25619]',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="why-it-matters" className="py-16 sm:py-20 lg:py-24 border-t border-[#EAE5DD] bg-[#FAF8F5] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Two-Column Editorial Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center mb-14 sm:mb-16">
          
          {/* LEFT COLUMN: Eyebrow, Heading, Paragraph, 3 Benefit Points (~48%) */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center space-y-7 max-w-xl">
            
            {/* Eyebrow */}
            <div>
              <span className="inline-block text-[12.5px] sm:text-[13px] font-bold uppercase tracking-[0.14em] text-[#D25619]">
                WHY IT MATTERS
              </span>
            </div>

            {/* Main Editorial Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-[48px] font-normal leading-[1.12] text-[#1C1917] font-editorial-serif tracking-tight">
              Men's health is an overlooked<br className="hidden sm:inline" /> conversation in India.
            </h2>

            {/* Supporting Copy */}
            <p className="text-[16px] sm:text-[16.5px] leading-relaxed text-[#4A453E] font-normal max-w-lg">
              Many men delay seeking help due to lack of awareness, stigma or limited access to trusted information. Early awareness and informed guidance can help prevent long-term health concerns and improve overall wellbeing.
            </p>

            {/* 3 Benefit Points with Subtle Dividers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-3 pt-6 border-t border-[#EAE5DD]">
              {benefits.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-2.5 ${
                    idx === 0
                      ? 'sm:pr-2'
                      : idx === 1
                      ? 'sm:px-2 sm:border-l sm:border-[#EAE5DD]'
                      : 'sm:pl-2 sm:border-l sm:border-[#EAE5DD]'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${item.iconBg} shrink-0 mt-0.5`}>
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-[#1C1917] leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-[12.5px] text-[#57534E] mt-0.5 leading-tight">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* RIGHT COLUMN: Lifestyle Image & 3 Informational Cards (~52%) */}
          <div className="lg:col-span-6 xl:col-span-6 relative flex items-center justify-center">
            
            {/* Visual Frame */}
            <div className="relative w-full max-w-[530px] rounded-[26px] overflow-hidden border border-[#EAE5DD] shadow-editorial-md bg-[#F3EFEA]">
              
              {/* Authentic Lifestyle Photograph */}
              <img
                src="/hero_man.jpg"
                alt="Young Indian man in thoughtful contemplation outdoors in calm daylight"
                className="w-full h-[440px] sm:h-[490px] lg:h-[520px] object-cover object-center"
                loading="lazy"
              />

              {/* Gentle Warm Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5 pointer-events-none" />

              {/* Script Callout Top Right */}
              <div className="absolute top-5 sm:top-6 right-5 sm:right-6 font-handwriting text-2xl sm:text-[28px] text-[#633F17] -rotate-[7deg] select-none pointer-events-none drop-shadow-sm font-semibold leading-tight text-right">
                A healthier you<br />
                for a brighter India
              </div>

              {/* CARD 1: Limited Awareness (Top Left) */}
              <div className="absolute top-5 left-3 sm:top-6 sm:left-5 bg-white/95 backdrop-blur-md border border-[#EAE5DD] rounded-xl p-2.5 sm:p-3 shadow-editorial-sm max-w-[210px] sm:max-w-[235px] flex items-start gap-2.5 transition-all hover:scale-[1.02]">
                <div className="p-1.5 rounded-lg bg-[#FEF0E6] text-[#D25619] shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[13px] sm:text-[13.5px] font-bold text-[#1C1917] leading-tight">
                    Limited awareness
                  </h4>
                  <p className="text-[11.5px] sm:text-[12px] text-[#57534E] leading-tight mt-0.5">
                    Many men are unaware of early signs and risk factors.
                  </p>
                </div>
              </div>

              {/* CARD 2: Stigma & Hesitation (Middle Left) */}
              <div className="absolute top-[48%] sm:top-[50%] left-3 sm:left-5 bg-white/95 backdrop-blur-md border border-[#EAE5DD] rounded-xl p-2.5 sm:p-3 shadow-editorial-sm max-w-[210px] sm:max-w-[235px] flex items-start gap-2.5 transition-all hover:scale-[1.02]">
                <div className="p-1.5 rounded-lg bg-[#EEF5FD] text-[#2E75D3] shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[13px] sm:text-[13.5px] font-bold text-[#1C1917] leading-tight">
                    Stigma & hesitation
                  </h4>
                  <p className="text-[11.5px] sm:text-[12px] text-[#57534E] leading-tight mt-0.5">
                    Health concerns are often not discussed due to social stigma.
                  </p>
                </div>
              </div>

              {/* CARD 3: Delayed Action (Bottom Right) */}
              <div className="absolute bottom-4 sm:bottom-5 right-3 sm:right-5 bg-white/95 backdrop-blur-md border border-[#EAE5DD] rounded-xl p-2.5 sm:p-3 shadow-editorial-sm max-w-[200px] sm:max-w-[225px] flex items-start gap-2.5 transition-all hover:scale-[1.02]">
                <div className="p-1.5 rounded-lg bg-[#EBF7F0] text-[#2D7A68] shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[13px] sm:text-[13.5px] font-bold text-[#1C1917] leading-tight">
                    Delayed action
                  </h4>
                  <p className="text-[11.5px] sm:text-[12px] text-[#57534E] leading-tight mt-0.5">
                    Many seek help only when concerns become severe.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* BOTTOM CALLOUT: Green-Tinted Awareness Callout */}
        <div className="bg-[#EBF7F0] border border-[#CCE0D4] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-white text-[#2D7A68] border border-[#CCE0D4] shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <span className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#1C5F4D] block mb-0.5">
                EARLY AWARENESS CREATES REAL OPPORTUNITIES.
              </span>
              <p className="text-[13.5px] sm:text-[14px] text-[#2D6A58] leading-relaxed">
                With the right information and support, men can take proactive steps towards a healthier and more fulfilling life.
              </p>
            </div>
          </div>

          <a
            href="#resources"
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-[13.5px] font-semibold text-[#1C5F4D] bg-white hover:bg-[#F4FAF6] border border-[#CCE0D4] rounded-xl shadow-xs transition-colors shrink-0 self-start sm:self-center"
          >
            <span>Learn More</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>

      </div>
    </section>
  );
}
