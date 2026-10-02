import React from 'react';

export default function RealImpact() {
  const impacts = [
    {
      id: 'awareness',
      title: 'Wider Awareness',
      description: 'More informed conversations',
      iconBg: 'bg-[#FEF0E6] text-[#D25619]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: 'decisions',
      title: 'Better Health Decisions',
      description: 'Early guidance and proactive action',
      iconBg: 'bg-[#EEF5FD] text-[#2E75D3]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      id: 'communities',
      title: 'Stronger Communities',
      description: 'Healthier and more confident futures',
      iconBg: 'bg-[#EBF7F0] text-[#2D7A68]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="real-impact" className="w-full border-y border-[#EAE5DD] bg-[#FAF8F5] py-12 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left: Heading (~42%) */}
          <div className="lg:col-span-5">
            <span className="text-[12px] sm:text-[12.5px] font-bold uppercase tracking-[0.14em] text-[#D25619] block mb-2">
              REAL IMPACT
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-normal leading-[1.12] text-[#1C1917] font-editorial-serif tracking-tight">
              Towards a healthier<br className="hidden sm:inline" /> and <span className="italic text-[#D25619] font-editorial-serif">more informed India.</span>
            </h2>
          </div>

          {/* Right: 3 Impact Areas (~58%) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-4">
            {impacts.map((item) => (
              <div key={item.id} className="flex items-start gap-3 bg-white/80 p-4 rounded-2xl border border-[#EAE5DD] shadow-2xs">
                <div className={`p-2.5 rounded-xl ${item.iconBg} shrink-0 mt-0.5`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-[14.5px] sm:text-[15px] font-bold text-[#1C1917] leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-[12.5px] sm:text-[13px] text-[#57534E] leading-tight mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
