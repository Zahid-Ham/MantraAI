import React from 'react';

export default function TrustImpactBand() {
  const items = [
    {
      id: 'awareness',
      iconBg: 'bg-[#FEF1EA] text-[#D25619]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      headline: 'Early awareness',
      description: 'Helps prevent long-term health issues',
    },
    {
      id: 'evidence',
      iconBg: 'bg-[#EBF7F0] text-[#2D7A68]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      headline: 'Evidence-informed',
      description: 'Guidance rooted in modern clinical research',
    },
    {
      id: 'action',
      iconBg: 'bg-[#EEF5FD] text-[#2E75D3]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      headline: 'Personalized action',
      description: 'Practical steps tailored to your lifestyle',
    },
    {
      id: 'next-steps',
      iconBg: 'bg-[#E8F4EE] text-[#1C7D6A]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      headline: 'Better-informed steps',
      description: 'Clear direction on when and how to seek professional care',
    },
  ];

  return (
    <section id="impact-band" className="w-full border-y border-[#EAE5DD] bg-[#FAF8F5] py-8 sm:py-9">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Eyebrow */}
        <div className="text-center mb-6">
          <span className="text-[11.5px] font-bold uppercase tracking-[0.18em] text-[#78716C]">
            TRUSTED APPROACH. REAL IMPACT.
          </span>
        </div>

        {/* 4 Impact Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-[#EAE5DD]">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={`flex items-start gap-3.5 ${
                idx === 0 ? 'lg:pr-6' : idx === items.length - 1 ? 'lg:pl-6' : 'lg:px-6'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${item.iconBg} shrink-0 mt-0.5`}>
                {item.icon}
              </div>
              <div>
                <h3 className="text-[15px] sm:text-[15.5px] font-bold text-[#1C1917] tracking-tight">
                  {item.headline}
                </h3>
                <p className="text-[13.5px] text-[#57534E] leading-snug mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
