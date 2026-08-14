import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

export default function ProblemSection() {
  const { language } = useLanguage();
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  
  // Custom counter animation for sperm count decline (101.2 -> 49.0)
  const [count, setCount] = useState(101.2);
  const isStatsInView = useInView(containerRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isStatsInView) {
      const start = 101.2;
      const end = 49.0;
      const duration = 1800; // ms
      const startTime = performance.now();

      const run = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        const val = start - (start - end) * ease;
        setCount(parseFloat(val.toFixed(1)));

        if (progress < 1) {
          requestAnimationFrame(run);
        }
      };
      requestAnimationFrame(run);
    }
  }, [isStatsInView]);

  const content = {
    en: {
      subtitle: "Clinical Grounding / The Vital Decline",
      chartTitle: "Global Average Sperm Concentration (1973 vs 2018)",
      citation: 'Source: Levine et al., "Temporal trends in sperm count: a systematic review and meta-regression analysis," Human Reproduction Update, 2023.',
      title: "A silent physiological shift, accelerated by modern environments.",
      para1: "The metrics indicate a global decline in reproductive health, but in India, the challenge is layered with rapid urbanization, high metabolic stress, and complete social silence. We endure these shifts alone, waiting until clinical escalation is inevitable.",
      reframe: "We exist to change the point of intervention. MantraAI converts vital anxiety into objective, actionable data—completely privately.",
      para2: "Through anonymous risk screening, evidence-based dynamic guidance, and discreet clinical referral pathways, we bypass the friction of traditional medical systems. We put diagnostic rigor directly in your hands before symptoms become systemic issues."
    },
    hi: {
      subtitle: "नैदानिक ​​आधार / महत्वपूर्ण शारीरिक गिरावट",
      chartTitle: "वैश्विक औसत शुक्राणु एकाग्रता (1973 बनाम 2018)",
      citation: 'स्रोत: लेविन और अन्य, "शुक्राणु संख्या में लौकिक रुझान: एक व्यवस्थित समीक्षा और मेटा-प्रतिगमन विश्लेषण," ह्यूमन रिप्रोडक्शन अपडेट, 2023।',
      title: "एक मौन शारीरिक बदलाव, जो आधुनिक जीवनशैली द्वारा त्वरित है।",
      para1: "आंकड़े प्रजनन स्वास्थ्य में वैश्विक गिरावट का संकेत देते हैं, लेकिन भारत में, यह चुनौती तीव्र शहरीकरण, उच्च मानसिक व चयापचय तनाव और सामाजिक चुप्पी की परतों से घिरी है। हम इन बदलावों को अकेले सहन करते हैं, और तब तक प्रतीक्षा करते हैं जब तक कि स्थिति गंभीर न हो जाए।",
      reframe: "हम हस्तक्षेप के समय को बदलने के लिए काम करते हैं। मंत्रएआई (MantraAI) स्वास्थ्य संबंधी चिंता को पूर्णतः व्यक्तिगत रूप से वस्तुनिष्ठ और कार्रवाई योग्य डेटा में परिवर्तित करता है।",
      para2: "हम अज्ञात जोखिम जांच, साक्ष्य-आधारित गतिशील मार्गदर्शन, और गुप्त नैदानिक ​​रेफरल मार्गों के माध्यम से पारंपरिक चिकित्सा प्रणालियों की बाधाओं को दूर करते हैं। हम लक्षणों के गंभीर होने से पहले नैदानिक ​​कठोरता सीधे आपके हाथों में सौंपते हैं।"
    }
  }[language];

  return (
    <section 
      ref={containerRef} 
      className="bg-cream dark:bg-night-blue text-night-blue dark:text-cream py-32 px-6 md:px-16 border-b border-border-light dark:border-border-dark relative z-10 transition-colors duration-500"
    >
      <div className="max-w-6xl mx-auto">
        
        {/* Editorial Subtitle */}
        <div className="mb-8">
          <span className="text-marigold font-grotesk text-xs font-semibold tracking-[0.2em] uppercase">
            {content.subtitle}
          </span>
        </div>

        {/* Heavy Editorial Data Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Column: Big Infographic (Visual Weight) */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="flex items-baseline gap-4 mb-4">
              <span className="font-serif text-8xl md:text-9xl font-normal leading-none tracking-tighter text-night-blue dark:text-cream">
                {count}
              </span>
              <span className="font-serif text-2xl md:text-3xl text-night-blue/50 dark:text-cream/50">M/ml</span>
            </div>
            
            <p className="font-grotesk text-xs uppercase tracking-wider text-marigold font-semibold mb-8">
              {content.chartTitle}
            </p>

            {/* SVG Infographic Line Chart */}
            <div ref={chartRef} className="relative w-full h-[180px] bg-cream-dark/40 dark:bg-night-dark/30 border border-border-light dark:border-border-dark p-4 mb-4">
              <svg viewBox="0 0 300 150" className="w-full h-full">
                {/* Gridlines */}
                <line x1="40" y1="20" x2="280" y2="20" stroke="currentColor" className="text-night-blue/5 dark:text-cream/5" strokeDasharray="3,3" />
                <line x1="40" y1="120" x2="280" y2="120" stroke="currentColor" className="text-night-blue/5 dark:text-cream/5" strokeDasharray="3,3" />
                
                {/* Chart Axes labels */}
                <text x="35" y="25" fill="currentColor" className="text-night-blue/40 dark:text-cream/40" fontSize="9" textAnchor="end" fontFamily="Satoshi">101.2</text>
                <text x="35" y="125" fill="currentColor" className="text-night-blue/40 dark:text-cream/40" fontSize="9" textAnchor="end" fontFamily="Satoshi">49.0</text>
                
                {/* Year labels */}
                <text x="40" y="142" fill="currentColor" className="text-night-blue/40 dark:text-cream/40" fontSize="9" textAnchor="middle" fontFamily="Satoshi">1973</text>
                <text x="160" y="142" fill="currentColor" className="text-night-blue/40 dark:text-cream/40" fontSize="9" textAnchor="middle" fontFamily="Satoshi">2000</text>
                <text x="280" y="142" fill="currentColor" className="text-night-blue/40 dark:text-cream/40" fontSize="9" textAnchor="middle" fontFamily="Satoshi">2018</text>

                {/* Vertical marker lines */}
                <line x1="40" y1="20" x2="40" y2="130" stroke="currentColor" className="text-night-blue/10 dark:text-cream/10" />
                <line x1="160" y1="20" x2="160" y2="130" stroke="currentColor" className="text-night-blue/5 dark:text-cream/5" strokeDasharray="2,2" />
                <line x1="280" y1="20" x2="280" y2="130" stroke="currentColor" className="text-night-blue/10 dark:text-cream/10" />

                {/* Hand-drawn style declining path */}
                <motion.path
                  d="M 40 20 Q 140 30, 160 55 T 280 120"
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={isStatsInView ? { pathLength: 1 } : { pathLength: 0 }}
                  transition={{ duration: 1.8, ease: "easeOut" }}
                />

                {/* Pulse Dots at endpoints */}
                {isStatsInView && (
                  <>
                    <circle cx="40" cy="20" r="3.5" fill="currentColor" className="text-night-blue dark:text-cream" />
                    <motion.circle 
                      cx="280" 
                      cy="120" 
                      r="5" 
                      fill="#d97706"
                      animate={{ scale: [1, 1.6, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  </>
                )}
              </svg>
            </div>

            {/* Academic citation */}
            <span className="font-grotesk text-[10px] text-night-blue/50 dark:text-cream/50 leading-relaxed max-w-md block">
              {content.citation}
            </span>
          </div>

          {/* Right Column: Editorial Reframe (Visceral solution transition) */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-8">
            <h3 className="font-serif text-3xl md:text-5xl font-normal leading-[1.1] tracking-tight">
              {content.title}
            </h3>
            
            <div className="font-grotesk text-base md:text-lg text-night-blue/80 dark:text-cream/70 font-light leading-relaxed space-y-6">
              <p>
                {content.para1}
              </p>
              <div className="border-l-2 border-marigold pl-5 my-4">
                <p className="font-medium text-night-blue dark:text-cream">
                  {content.reframe}
                </p>
              </div>
              <p>
                {content.para2}
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
