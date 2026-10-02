import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { handleGetStartedNavigation } from '../../utils/navigation';

export default function FinalCTA() {
  const { isAuthenticated } = useAuth();

  const handleCtaClick = (e) => {
    handleGetStartedNavigation(e, isAuthenticated);
  };

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      <div className="bg-[#FEF9F5] dark:bg-[#151921] border border-[#F5E6D8] dark:border-[#2C241E] rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden">
        
        {/* Subtle decorative background glow / leaf elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFEAD9]/40 dark:bg-[#D25619]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#EAF5F0]/50 dark:bg-[#10B981]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column: Image */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-none h-64 sm:h-72 lg:h-80 rounded-2xl overflow-hidden shadow-sm border border-[#EAE5DD] dark:border-[#262C36]">
              <img
                src="/hero_man.jpg"
                alt="Indian man in warm daylight representing balanced health"
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
              {/* Subtle overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
          </div>

          {/* Center Column: CTA Text & Action Buttons */}
          <div className="lg:col-span-5 flex flex-col justify-center text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-serif text-[#1C1917] dark:text-[#F5F2EB] leading-[1.2] tracking-tight mb-4">
              Take charge of your health today for a{' '}
              <span className="text-[#D25619] italic font-serif">stronger tomorrow.</span>
            </h2>
            <p className="text-[15px] sm:text-[16px] text-[#57534E] dark:text-[#A8A29E] leading-relaxed mb-8">
              Start your personalised assessment and get evidence-based guidance for a healthier, more informed you.
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <button
                onClick={handleCtaClick}
                className="inline-flex items-center justify-center gap-2 bg-[#D25619] hover:bg-[#B84510] text-white px-6 py-3 rounded-xl font-semibold text-[15px] shadow-sm hover:shadow transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D25619] focus-visible:ring-offset-2 cursor-pointer"
              >
                <span>{isAuthenticated ? 'Go to Your Dashboard' : 'Start Your Assessment'}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>

              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-[#EAE5DD] dark:border-[#2E3545] bg-white dark:bg-[#1C222E] text-[#1C1917] dark:text-[#F5F2EB] hover:bg-[#F5F2EB] dark:hover:bg-[#252C3B] font-semibold text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D25619]"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Right Column: Trust Points */}
          <div className="lg:col-span-3 flex flex-col justify-center space-y-4 pt-4 lg:pt-0 lg:border-l lg:border-[#F3E2D3] dark:lg:border-[#2C241E] lg:pl-8">
            {/* Trust Point 1 */}
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-[#E6F4EA] dark:bg-[#132A1C] text-[#137333] dark:text-[#34D399] flex items-center justify-center shrink-0 border border-[#CEEAD6] dark:border-[#1E3E2B]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 className="text-[13.5px] font-bold tracking-wide text-[#1C1917] dark:text-[#F5F2EB] uppercase">
                  Private & Secure
                </h4>
                <p className="text-[13px] text-[#57534E] dark:text-[#A8A29E] mt-0.5">
                  Your data is protected
                </p>
              </div>
            </div>

            {/* Trust Point 2 */}
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-[#E8F0FE] dark:bg-[#15233D] text-[#1A73E8] dark:text-[#60A5FA] flex items-center justify-center shrink-0 border border-[#D2E3FC] dark:border-[#1E365D]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-[13.5px] font-bold tracking-wide text-[#1C1917] dark:text-[#F5F2EB] uppercase">
                  Evidence-Based
                </h4>
                <p className="text-[13px] text-[#57534E] dark:text-[#A8A29E] mt-0.5">
                  Backed by trusted sources
                </p>
              </div>
            </div>

            {/* Trust Point 3 */}
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-[#FFF2E8] dark:bg-[#2A1D16] text-[#D25619] flex items-center justify-center shrink-0 border border-[#FAD8C3] dark:border-[#3E281C]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h4 className="text-[13.5px] font-bold tracking-wide text-[#1C1917] dark:text-[#F5F2EB] uppercase">
                  Made for India
                </h4>
                <p className="text-[13px] text-[#57534E] dark:text-[#A8A29E] mt-0.5">
                  Culturally sensitive & accessible
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
