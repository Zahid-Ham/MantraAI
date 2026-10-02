import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { handleGetStartedNavigation } from '../../utils/navigation';

export default function Hero() {
  const { isAuthenticated } = useAuth();

  const handleCtaClick = (e) => {
    handleGetStartedNavigation(e, isAuthenticated);
  };

  return (
    <section id="home" className="relative overflow-hidden pt-8 pb-14 md:pt-12 md:pb-20 lg:pt-14 lg:pb-22">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Two-Column Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* LEFT COLUMN: Editorial Copy, CTAs, Trust Badges (~52%) */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center space-y-7 max-w-xl">
            
            {/* Eyebrow Label (12.5–13px) */}
            <div>
              <span className="inline-block text-[12.5px] sm:text-[13px] font-bold uppercase tracking-[0.14em] text-[#D25619]">
                AN INDIA-FIRST MEN'S HEALTH INTELLIGENCE PLATFORM
              </span>
            </div>

            {/* Main Editorial Headline (Desktop: 58–64px, Tablet: 50–54px, Mobile: 38–44px) */}
            <h1 className="text-[40px] sm:text-[50px] lg:text-[58px] xl:text-[63px] font-normal leading-[1.03] text-[#1C1917] font-editorial-serif tracking-tight">
              Understand your health<br />
              today for a <span className="italic text-[#D25619] font-editorial-serif">stronger</span><br />
              <span className="italic text-[#D25619] font-editorial-serif">tomorrow.</span>
            </h1>

            {/* Supporting Copy (17–18px comfortable line-height) */}
            <p className="text-[17px] sm:text-[17.5px] leading-[1.62] text-[#4A453E] font-normal max-w-lg">
              MantraAI provides private, evidence-based guidance for men's sexual, reproductive and overall wellbeing — through AI-powered assessments, personalised insights and trusted resources.
            </p>

            {/* Primary & Secondary Action CTAs (48–52px height, 15–16px text) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
              <button
                onClick={handleCtaClick}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 h-[50px] text-[15px] sm:text-[15.5px] font-semibold text-white bg-[#D25619] hover:bg-[#B94711] rounded-xl shadow-sm transition-all hover:translate-x-0.5 active:translate-y-0.5 text-center cursor-pointer"
              >
                <span>{isAuthenticated ? 'Go to Your Dashboard' : 'Start Your Assessment'}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>

              <a
                href="#features"
                className="inline-flex items-center justify-center px-6 py-3.5 h-[50px] text-[15px] sm:text-[15.5px] font-semibold text-[#1C1917] bg-white border border-[#EAE5DD] hover:border-[#D25619] rounded-xl shadow-sm transition-colors text-center"
              >
                Explore Features
              </a>
            </div>

            {/* 3 Compact Trust / Value Indicators (Title: 14–15px, Description: 13–14px) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-3 pt-6 border-t border-[#EAE5DD]">
              
              {/* Item 1: Private & Secure */}
              <div className="flex items-start gap-2.5 sm:pr-2">
                <div className="p-2 rounded-lg bg-[#EBF7F0] text-[#2D7A68] shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-[#1C1917] leading-snug">
                    Private & Secure
                  </h4>
                  <p className="text-[13px] text-[#57534E] mt-0.5 leading-tight">
                    Your data is yours, always private
                  </p>
                </div>
              </div>

              {/* Item 2: Evidence-Based */}
              <div className="flex items-start gap-2.5 sm:px-2 sm:border-l sm:border-[#EAE5DD]">
                <div className="p-2 rounded-lg bg-[#EEF5FD] text-[#2E75D3] shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-[#1C1917] leading-snug">
                    Evidence-Based
                  </h4>
                  <p className="text-[13px] text-[#57534E] mt-0.5 leading-tight">
                    Backed by trusted research and guidelines
                  </p>
                </div>
              </div>

              {/* Item 3: Made for India */}
              <div className="flex items-start gap-2.5 sm:pl-2 sm:border-l sm:border-[#EAE5DD]">
                <div className="p-2 rounded-lg bg-[#FEF1EA] text-[#D25619] shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-[#1C1917] leading-snug">
                    Made for India
                  </h4>
                  <p className="text-[13px] text-[#57534E] mt-0.5 leading-tight">
                    Culturally sensitive and accessible
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: Hero Visual & Annotated Product Cards (~48%) */}
          <div className="lg:col-span-6 xl:col-span-6 relative flex items-center justify-center">
            
            {/* Visual Frame */}
            <div className="relative w-full max-w-[530px] rounded-[26px] overflow-hidden border border-[#EAE5DD] shadow-editorial-md bg-[#F3EFEA]">
              
              {/* Authentic Indian Man Image */}
              <img
                src="/hero_man.jpg"
                alt="A thoughtful, confident young Indian man outdoors in warm golden sunlight"
                className="w-full h-[440px] sm:h-[490px] lg:h-[530px] object-cover object-center"
                loading="eager"
              />

              {/* Gentle Warm Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5 pointer-events-none" />

              {/* Script Callout Text Top Right */}
              <div className="absolute top-5 sm:top-6 right-5 sm:right-6 font-handwriting text-2xl sm:text-[28px] text-[#633F17] -rotate-[7deg] select-none pointer-events-none drop-shadow-sm font-semibold leading-tight text-right">
                A healthier you<br />
                for a brighter India
              </div>

              {/* OVERLAY CARD A: Your Health Journey (Top Left) */}
              <div className="absolute top-5 left-3.5 sm:top-6 sm:left-5 bg-white/95 backdrop-blur-md border border-[#EAE5DD] rounded-xl p-2.5 sm:p-3 shadow-editorial-sm max-w-[190px] sm:max-w-[210px] flex items-center justify-between gap-2 transition-all hover:scale-[1.02]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#E8F4EE] text-[#2D7A68]">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[13px] sm:text-[13.5px] font-bold text-[#1C1917] leading-tight">
                      Your Health Journey
                    </h4>
                    <p className="text-[11.5px] sm:text-[12px] text-[#57534E] leading-tight mt-0.5">
                      Track progress over time
                    </p>
                  </div>
                </div>
                <svg className="w-3.5 h-3.5 text-[#A8A29E] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* OVERLAY CARD B: AI-Powered Assessment (Middle Left) */}
              <div
                onClick={handleCtaClick}
                className="group absolute top-[35%] sm:top-[37%] left-3 sm:left-5 bg-white/95 backdrop-blur-md border border-[#EAE5DD] rounded-xl p-2.5 sm:p-3 shadow-editorial-sm max-w-[215px] sm:max-w-[245px] flex items-center justify-between gap-2.5 transition-all hover:scale-[1.02] hover:border-[#D25619] cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-[#FEF0E6] text-[#D25619] shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[13px] sm:text-[13.5px] font-bold text-[#1C1917] group-hover:text-[#D25619] transition-colors leading-tight">
                      AI-Powered Assessment
                    </h4>
                    <p className="text-[11.5px] sm:text-[12px] text-[#57534E] leading-tight mt-0.5">
                      Personalised questions based on your responses
                    </p>
                  </div>
                </div>
                <svg className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#D25619] group-hover:translate-x-0.5 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* OVERLAY CARD C: Action Plan (Lower Left) */}
              <a
                href="#features"
                className="group absolute bottom-[18%] sm:bottom-[19%] left-3 sm:left-5 bg-white/95 backdrop-blur-md border border-[#EAE5DD] rounded-xl p-2.5 sm:p-3 shadow-editorial-sm max-w-[205px] sm:max-w-[235px] flex items-center justify-between gap-2.5 transition-all hover:scale-[1.02] hover:border-[#D25619]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-[#FEF6EE] text-[#D97706] shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[13px] sm:text-[13.5px] font-bold text-[#1C1917] group-hover:text-[#D25619] transition-colors leading-tight">
                      Action Plan
                    </h4>
                    <p className="text-[11.5px] sm:text-[12px] text-[#57534E] leading-tight mt-0.5">
                      Practical steps for a healthier lifestyle
                    </p>
                  </div>
                </div>
                <svg className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#D25619] group-hover:translate-x-0.5 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </a>

              {/* OVERLAY CARD D: Consult a Professional (Bottom Right) */}
              <a
                href="#features"
                className="group absolute bottom-4 sm:bottom-5 right-3 sm:right-5 bg-[#E2EFE7]/95 backdrop-blur-md border border-[#CCE0D4] rounded-xl p-2.5 sm:p-3 shadow-editorial-sm max-w-[200px] sm:max-w-[225px] flex items-center justify-between gap-2.5 transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-[#2D7A68] text-white shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[13px] sm:text-[13.5px] font-bold text-[#17463A] leading-tight">
                      Consult a Professional
                    </h4>
                    <p className="text-[11.5px] sm:text-[12px] text-[#2D6A58] leading-tight mt-0.5">
                      When needed
                    </p>
                  </div>
                </div>
                <svg className="w-3.5 h-3.5 text-[#2D7A68] group-hover:translate-x-0.5 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </a>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
