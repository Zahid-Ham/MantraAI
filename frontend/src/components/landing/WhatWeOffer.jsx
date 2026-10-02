import React from 'react';

export default function WhatWeOffer() {
  const capabilities = [
    {
      id: 'assessment',
      iconBg: 'bg-[#EEF5FD] text-[#2E75D3]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      title: 'AI Health Assessment',
      description: 'Personalized, adaptive questionnaire experience tailored to your lifestyle, symptoms and wellness profile.',
      link: '#assess',
    },
    {
      id: 'reports',
      iconBg: 'bg-[#EBF7F0] text-[#2D7A68]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: 'Detailed Reports',
      description: 'Clear, structured insights covering sexual wellbeing, reproductive context, stress factors and overall vitality.',
      link: '#assess',
    },
    {
      id: 'action-plans',
      iconBg: 'bg-[#FEF6EE] text-[#D97706]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'Personalized Action Plans',
      description: 'Actionable, practical steps covering sleep habits, physical routine, nutrition, and lifestyle modifications.',
      link: '#assess',
    },
    {
      id: 'myths',
      iconBg: 'bg-[#F4F0FB] text-[#7048B6]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      title: 'Myth vs Fact Engine',
      description: 'Evidence-based clarifications on common myths, misconceptions, and social stigmas surrounding men’s health.',
      link: '#resources',
    },
    {
      id: 'chatbot',
      iconBg: 'bg-[#EEF8FB] text-[#16829E]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: 'AI Chatbot & Voice Bot',
      description: 'Ask sensitive wellness questions in complete privacy across English, Hindi and regional language support.',
      link: '#assess',
    },
    {
      id: 'progress',
      iconBg: 'bg-[#EEF7F5] text-[#1C7D6A]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Track Your Progress',
      description: 'Monitor longitudinal trends across repeated assessments and compare your reported health context over time.',
      link: '#history',
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-20 lg:py-24 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-10 border-b border-[#EAE5DD] mb-10">
          
          <div>
            <span className="text-[12.5px] sm:text-[13px] font-bold uppercase tracking-[0.14em] text-[#D25619] block mb-2.5">
              WHAT MANTRAAI OFFERS
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[48px] font-normal leading-[1.12] text-[#1C1917] font-editorial-serif tracking-tight max-w-2xl">
              Complete men's health support in one place.
            </h2>
          </div>

          <p className="text-[16px] sm:text-[16.5px] leading-relaxed text-[#4A453E] max-w-lg">
            From self-assessment to personalised guidance, trusted information and access to professional care — everything you need for a healthier, more informed you.
          </p>

        </div>

        {/* 6 Capabilities Cards 3x2 Grid (Title: 17-18px, Description: 14.5-15.5px) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap) => (
            <a
              key={cap.id}
              href={cap.link}
              className="group bg-white border border-[#EAE5DD] rounded-2xl p-6 sm:p-7 shadow-editorial-sm hover:shadow-editorial-md hover:border-[#D25619]/60 transition-all hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div>
                <div className={`p-2.5 rounded-xl ${cap.iconBg} w-fit mb-4 group-hover:scale-105 transition-transform`}>
                  {cap.icon}
                </div>
                <h3 className="text-[17px] sm:text-[17.5px] font-bold text-[#1C1917] group-hover:text-[#D25619] transition-colors mb-2">
                  {cap.title}
                </h3>
                <p className="text-[14.5px] sm:text-[15px] text-[#57534E] leading-[1.55]">
                  {cap.description}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-[#F0EBE3] flex items-center text-[13px] font-semibold text-[#D25619] opacity-80 group-hover:opacity-100 transition-opacity">
                <span>Explore capability</span>
                <svg className="w-3.5 h-3.5 ml-1.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          ))}
        </div>

      </div>
    </section>
  );
}
