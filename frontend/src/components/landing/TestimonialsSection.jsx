import React, { useState } from 'react';

const testimonials = [
  {
    id: 1,
    image: '/avatar_student.jpg',
    quote: 'MantraAI helped me understand aspects of my health that I had never really thought about. The insights were clear and easy to follow.',
    name: 'Sample user',
    role: 'Illustrative feedback · Student context',
    accent: '#D25619',
    accentBg: '#FFF2EB',
  },
  {
    id: 2,
    image: '/avatar_pro.jpg',
    quote: 'The personalised guidance and practical tips made it easy for me to take small but meaningful steps towards a healthier lifestyle.',
    name: 'Sample user',
    role: 'Illustrative feedback · Working professional',
    accent: '#10B981',
    accentBg: '#ECFDF5',
  },
  {
    id: 3,
    image: '/avatar_youth.jpg',
    quote: 'I appreciate how MantraAI provides reliable information in a simple way. It gives me confidence to make better decisions about my health.',
    name: 'Sample user',
    role: 'Illustrative feedback · Young adult',
    accent: '#3B82F6',
    accentBg: '#EFF6FF',
  },
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  return (
    <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      {/* Top Header Row with Navigation */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[13px] font-bold tracking-[0.15em] text-[#D25619] uppercase font-sans">
              REAL STORIES
            </span>
            <span className="text-[11px] font-semibold tracking-wider text-[#78716C] bg-[#F5F2EB] dark:bg-[#1F242F] px-2.5 py-0.5 rounded-full uppercase border border-[#EAE5DD] dark:border-[#2E3545]">
              ILLUSTRATIVE PROTOTYPE
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-serif text-[#1C1917] dark:text-[#F5F2EB] leading-[1.15] tracking-tight">
            What men <span className="text-[#D25619] italic font-serif">are saying.</span>
          </h2>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-6 max-w-lg">
          <p className="text-[15px] sm:text-[16px] text-[#57534E] dark:text-[#A8A29E] leading-relaxed font-normal">
            Real experiences from men who have used MantraAI to better understand their health and take informed steps forward.
          </p>

          {/* Carousel Arrows for desktop / mobile */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous testimonial"
              className="w-10 h-10 rounded-full border border-[#EAE5DD] dark:border-[#2E3545] bg-white dark:bg-[#151921] text-[#1C1917] dark:text-[#F5F2EB] flex items-center justify-center hover:bg-[#F5F2EB] dark:hover:bg-[#1F242F] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D25619]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next testimonial"
              className="w-10 h-10 rounded-full border border-[#EAE5DD] dark:border-[#2E3545] bg-white dark:bg-[#151921] text-[#1C1917] dark:text-[#F5F2EB] flex items-center justify-center hover:bg-[#F5F2EB] dark:hover:bg-[#1F242F] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D25619]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Testimonials Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-[#151921] border border-[#EAE5DD] dark:border-[#262C36] rounded-2xl p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between transition-all hover:border-[#D5CEBF] dark:hover:border-[#384152] hover:shadow-md"
          >
            {/* Top row: Avatar & Quote Icon */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white dark:border-[#262C36] shadow-sm shrink-0 bg-[#EAE5DD]">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: item.accentBg, color: item.accent }}
                  aria-hidden="true"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>
              </div>

              {/* Quote text */}
              <p className="text-[15px] sm:text-[15.5px] text-[#292524] dark:text-[#E7E5E4] leading-relaxed mb-6 font-normal">
                "{item.quote}"
              </p>
            </div>

            {/* Author info */}
            <div className="pt-4 border-t border-[#F5F2EB] dark:border-[#1F242F]">
              <div className="text-[15px] font-semibold text-[#1C1917] dark:text-[#F5F2EB]">
                {item.name}
              </div>
              <div className="text-[13px] text-[#78716C] dark:text-[#A8A29E] mt-0.5">
                {item.role}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
