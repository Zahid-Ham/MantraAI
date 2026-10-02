import React from 'react';

export default function ForInstitutions() {
  const useCases = [
    {
      id: 'students',
      title: 'Student Wellbeing',
      description: 'Health awareness for campuses',
      iconBg: 'bg-[#EBF7F0] text-[#2D7A68]',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      id: 'workplace',
      title: 'Workplace Health Programs',
      description: 'Support employee wellbeing',
      iconBg: 'bg-[#EEF5FD] text-[#2E75D3]',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      id: 'ngo',
      title: 'NGO Collaborations',
      description: 'Reach underserved communities',
      iconBg: 'bg-[#FEF1EA] text-[#D25619]',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      id: 'healthcare',
      title: 'Healthcare Organisations',
      description: 'Complement patient education',
      iconBg: 'bg-[#F4F0FB] text-[#7048B6]',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
  ];

  return (
    <section id="institutions" className="py-16 sm:py-20 lg:py-24 border-t border-[#EAE5DD] bg-[#FAF8F5] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Two-Column Editorial Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          
          {/* LEFT COLUMN: Institutional Message (~48%) */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center space-y-7 max-w-xl">
            
            {/* Eyebrow */}
            <div>
              <span className="inline-block text-[12.5px] sm:text-[13px] font-bold uppercase tracking-[0.14em] text-[#D25619]">
                FOR INSTITUTIONS
              </span>
            </div>

            {/* Editorial Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-[48px] font-normal leading-[1.12] text-[#1C1917] font-editorial-serif tracking-tight">
              Partner with us for<br className="hidden sm:inline" /> <span className="italic text-[#D25619] font-editorial-serif">healthier communities.</span>
            </h2>

            {/* Supporting Copy */}
            <p className="text-[16px] sm:text-[16.5px] leading-relaxed text-[#4A453E] font-normal max-w-lg">
              MantraAI can support colleges, workplaces, NGOs and healthcare organisations in enabling men's health awareness, early guidance and better access to trusted information.
            </p>

            {/* 4 Compact Institutional Use Cases */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {useCases.map((uc) => (
                <div key={uc.id} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-[#EAE5DD] shadow-2xs">
                  <div className={`p-2 rounded-lg ${uc.iconBg} shrink-0 mt-0.5`}>
                    {uc.icon}
                  </div>
                  <div>
                    <h4 className="text-[13.5px] font-bold text-[#1C1917] leading-snug">
                      {uc.title}
                    </h4>
                    <p className="text-[12px] text-[#57534E] mt-0.5 leading-tight">
                      {uc.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Institutional CTA */}
            <div className="pt-2">
              <a
                href="#resources"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 h-[50px] text-[15px] font-semibold text-white bg-[#D25619] hover:bg-[#B94711] rounded-xl shadow-sm transition-all hover:translate-x-0.5 active:translate-y-0.5"
              >
                <span>Explore Institutional Solutions</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>

          </div>

          {/* RIGHT COLUMN: Institutional Lifestyle Image & 3 Overlay Cards (~52%) */}
          <div className="lg:col-span-6 xl:col-span-6 relative flex items-center justify-center">
            
            {/* Visual Frame */}
            <div className="relative w-full max-w-[540px] rounded-[26px] overflow-hidden border border-[#EAE5DD] shadow-editorial-md bg-[#F3EFEA]">
              
              {/* Institutional Discussion Photograph */}
              <img
                src="/institutional_discussion.jpg"
                alt="Young Indian adults in an engaging collaborative health discussion"
                className="w-full h-[440px] sm:h-[480px] lg:h-[510px] object-cover object-center"
                loading="lazy"
              />

              {/* Gentle Warm Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10 pointer-events-none" />

              {/* Quote Card (Top Left) */}
              <div className="absolute top-5 left-4 sm:top-6 sm:left-6 bg-white/95 backdrop-blur-md border border-[#EAE5DD] rounded-2xl p-4 shadow-editorial-sm max-w-[280px]">
                <p className="text-[13px] sm:text-[13.5px] font-normal leading-relaxed text-[#1C1917] italic">
                  “Early awareness and open conversations can create healthier, more resilient communities.”
                </p>
                <div className="w-8 h-[2px] bg-[#D25619] rounded-full mt-2.5" />
              </div>

              {/* 3 Information Cards Across Bottom */}
              <div className="absolute bottom-4 left-3 right-3 sm:bottom-5 sm:left-4 sm:right-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                
                {/* Card 1: Awareness Programs */}
                <div className="bg-white/95 backdrop-blur-md border border-[#EAE5DD] rounded-xl p-2.5 shadow-editorial-xs">
                  <div className="p-1.5 rounded-lg bg-[#EBF7F0] text-[#2D7A68] w-fit mb-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h4 className="text-[12.5px] font-bold text-[#1C1917] leading-tight">
                    Awareness Programs
                  </h4>
                  <p className="text-[11px] text-[#57534E] leading-tight mt-0.5">
                    Interactive sessions and digital resources
                  </p>
                </div>

                {/* Card 2: Educational Integration */}
                <div className="bg-white/95 backdrop-blur-md border border-[#EAE5DD] rounded-xl p-2.5 shadow-editorial-xs flex flex-col justify-between">
                  <div>
                    <div className="p-1.5 rounded-lg bg-[#FEF1EA] text-[#D25619] w-fit mb-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                    </div>
                    <h4 className="text-[12.5px] font-bold text-[#1C1917] leading-tight">
                      Educational Integration
                    </h4>
                    <p className="text-[11px] text-[#57534E] leading-tight mt-0.5">
                      Evidence-based content and tools
                    </p>
                  </div>
                </div>

                {/* Card 3: Impact Tracking */}
                <div className="bg-white/95 backdrop-blur-md border border-[#EAE5DD] rounded-xl p-2.5 shadow-editorial-xs">
                  <div className="p-1.5 rounded-lg bg-[#F4F0FB] text-[#7048B6] w-fit mb-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h4 className="text-[12.5px] font-bold text-[#1C1917] leading-tight">
                    Impact Tracking
                  </h4>
                  <p className="text-[11px] text-[#57534E] leading-tight mt-0.5">
                    Measure engagement and outcomes
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
