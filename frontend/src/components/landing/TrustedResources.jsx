import React from 'react';

export default function TrustedResources() {
  const resources = [
    {
      id: 'guide',
      category: 'GUIDE',
      categoryBadge: 'bg-white/95 text-[#2D7A68] border-[#CCE0D4]',
      title: "Men's Reproductive Health",
      description: 'Understand key aspects of reproductive health and when to seek guidance.',
      image: '/resource_guide.jpg',
      link: '#resources',
      icon: (
        <svg className="w-3.5 h-3.5 text-[#2D7A68]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      id: 'article',
      category: 'ARTICLE',
      categoryBadge: 'bg-white/95 text-[#2E75D3] border-[#D5E6FA]',
      title: 'Managing Stress and Lifestyle',
      description: 'Learn how stress, sleep, nutrition and physical activity impact overall wellbeing.',
      image: '/resource_article.jpg',
      link: '#resources',
      icon: (
        <svg className="w-3.5 h-3.5 text-[#2E75D3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'faq',
      category: 'FAQ',
      categoryBadge: 'bg-white/95 text-[#7048B6] border-[#E4D9F8]',
      title: 'Common Myths vs Facts',
      description: 'Get clear, evidence-based answers to frequently asked questions.',
      image: '/resource_faq.jpg',
      link: '#resources',
      icon: (
        <svg className="w-3.5 h-3.5 text-[#7048B6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="resources" className="py-16 sm:py-20 lg:py-24 bg-[#FAF8F5] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Intro Row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-12 border-b border-[#EAE5DD] mb-12">
          
          {/* Left Heading Area */}
          <div>
            <span className="text-[12.5px] sm:text-[13px] font-bold uppercase tracking-[0.14em] text-[#D25619] block mb-2.5">
              TRUSTED RESOURCES
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-normal leading-[1.12] text-[#1C1917] font-editorial-serif tracking-tight max-w-2xl">
              Clear, reliable information<br className="hidden sm:inline" /> <span className="italic text-[#D25619] font-editorial-serif">when you need it.</span>
            </h2>
          </div>

          {/* Right Supporting Copy & CTA */}
          <div className="flex flex-col items-start lg:items-end gap-4 max-w-lg">
            <p className="text-[15.5px] sm:text-[16px] leading-relaxed text-[#4A453E] text-left lg:text-right">
              Access clear, evidence-informed articles, guides and answers to common questions on men's sexual, reproductive and overall health — in simple, easy-to-understand language.
            </p>

            <a
              href="#resources"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[14.5px] font-semibold text-[#1C1917] bg-white border border-[#EAE5DD] hover:border-[#D25619] rounded-xl shadow-xs transition-colors"
            >
              <span>Explore Resources</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>

        </div>

        {/* 3 Resource Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
          {resources.map((item) => (
            <a
              key={item.id}
              href={item.link}
              className="group bg-white border border-[#EAE5DD] rounded-2xl overflow-hidden shadow-editorial-sm hover:shadow-editorial-md hover:border-[#D25619]/60 transition-all hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div>
                {/* Card Image with Floating Category Badge */}
                <div className="relative h-[170px] sm:h-[190px] w-full overflow-hidden bg-[#F3EFEA]">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase rounded-md shadow-2xs border ${item.categoryBadge}`}>
                      {item.icon}
                      {item.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-[17px] sm:text-[18px] font-bold text-[#1C1917] group-hover:text-[#D25619] transition-colors mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[14px] text-[#57534E] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Action arrow footer */}
              <div className="px-6 pb-6 pt-0 flex justify-end">
                <span className="w-7 h-7 rounded-full bg-[#FAF8F5] border border-[#EAE5DD] group-hover:bg-[#D25619] group-hover:text-white group-hover:border-[#D25619] text-[#1C1917] flex items-center justify-center transition-all">
                  <svg className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </div>
            </a>
          ))}
        </div>

      </div>
    </section>
  );
}
