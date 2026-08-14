import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import MicroscopicField from './MicroscopicField';

// Animated stat counter
function AnimatedStatValue({ value }) {
  const [displayValue, setDisplayValue] = useState('');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    const numMatch = value.match(/(\d+)/);
    const num = numMatch ? parseInt(numMatch[1], 10) : 0;
    const postfix = value.replace(/\d+/g, '');
    const prefix = value.startsWith('-') ? '-' : '';

    if (isInView && num > 0) {
      const duration = 1600;
      const startTime = performance.now();
      const run = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(`${prefix}${Math.floor(num * ease)}${postfix}`);
        if (progress < 1) requestAnimationFrame(run);
      };
      requestAnimationFrame(run);
    } else {
      setDisplayValue(value);
    }
  }, [isInView, value]);

  return <span ref={ref}>{displayValue}</span>;
}

// Animated data flow dot along a path
function DataFlowDot({ pathD, duration = 3, delay = 0, color = '#d97706' }) {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) return null;

  return (
    <motion.circle r="2" fill={color} opacity="0.6">
      <animateMotion
        dur={`${duration}s`}
        begin={`${delay}s`}
        repeatCount="indefinite"
        path={pathD}
      />
    </motion.circle>
  );
}

export default function TrustSection() {
  const { language } = useLanguage();
  const mapRef = useRef(null);
  const sectionRef = useRef(null);
  const isMapInView = useInView(mapRef, { once: true, margin: '-100px' });
  const isSectionInView = useInView(sectionRef, { once: false, margin: '-80px' });
  const prefersReducedMotion = useReducedMotion();

  const cities = [
    { name: language === 'en' ? 'Delhi' : 'दिल्ली',       x: 120, y: 70 },
    { name: language === 'en' ? 'Kolkata' : 'कोलकाता',   x: 215, y: 125 },
    { name: language === 'en' ? 'Mumbai' : 'मुंबई',       x: 85,  y: 155 },
    { name: language === 'en' ? 'Pune' : 'पुणे',          x: 95,  y: 170 },
    { name: language === 'en' ? 'Bengaluru' : 'बेंगलुरु', x: 120, y: 210 },
    { name: language === 'en' ? 'Chennai' : 'चेन्नई',     x: 140, y: 215 },
  ];

  const [activeCityIndex, setActiveCityIndex] = useState(-1);

  useEffect(() => {
    if (isMapInView) {
      let index = 0;
      const interval = setInterval(() => {
        setActiveCityIndex(index++);
        if (index >= cities.length) clearInterval(interval);
      }, 380);
      return () => clearInterval(interval);
    }
  }, [isMapInView]);

  const content = {
    en: {
      tag: 'Shielded Protocol',
      title: 'Clinical validation, absolute privacy.',
      desc: 'We operate under a strict zero-trust privacy paradigm. By stripping away identifiers, we create a secure space for men to confront health risks without fear of exposure.',
      stats: [
        { value: '100%', label: 'Anonymous by Default', description: 'Zero account signup required for diagnostic assessments. We do not link searches to physical identity.' },
        { value: '0',    label: 'PII Stored', description: 'Zero collection of names, phone numbers, or emails during risk screenings. Complete data boundary.' },
        { value: '10k+', label: 'Localized Datasets', description: 'Engineered specifically for the Indian male genetic, lifestyle, and dietary phenotype profiles.' },
        { value: '24/7', label: 'Secure Assessment', description: 'Instant access to peer-reviewed clinical risk models without administrative delay or scheduling.' },
      ],
    },
    hi: {
      tag: 'सुरक्षित प्रोटोकॉल',
      title: 'नैदानिक ​​सत्यापन, पूर्ण गोपनीयता।',
      desc: 'हम एक सख्त शून्य-विश्वास (zero-trust) गोपनीयता प्रतिमान के तहत काम करते हैं। व्यक्तिगत पहचान को हटाकर, हम पुरुषों के लिए बिना किसी डर के स्वास्थ्य जोखिमों का सामना करने के लिए एक सुरक्षित स्थान बनाते हैं।',
      stats: [
        { value: '100%', label: 'डिफ़ॉल्ट रूप से अज्ञात', description: 'नैदानिक मूल्यांकन के लिए शून्य खाता साइनअप आवश्यक है।' },
        { value: '0',    label: 'व्यक्तिगत डेटा स्टोर', description: 'स्क्रीनिंग के दौरान नाम, फोन नंबर या ईमेल का शून्य संग्रह।' },
        { value: '10k+', label: 'स्थानीयकृत डेटासेट', description: 'विशेष रूप से भारतीय पुरुषों के आनुवंशिक, जीवनशैली और आहार प्रोफाइल के लिए तैयार।' },
        { value: '24/7', label: 'सुरक्षित लक्षण जांच', description: 'बिना किसी प्रशासनिक देरी के सहकर्मी-समीक्षित नैदानिक जोखिम मॉडल तक त्वरित पहुंच।' },
      ],
    },
  }[language];

  // SVG paths for data-flow animation between cities
  const connectionPaths = [
    'M 120 70 L 215 125',    // Delhi → Kolkata
    'M 120 70 L 85 155',     // Delhi → Mumbai
    'M 85 155 L 120 210',    // Mumbai → Bengaluru
    'M 215 125 L 140 215',   // Kolkata → Chennai
    'M 120 210 L 140 215',   // Bengaluru → Chennai
  ];

  return (
    <section
      ref={sectionRef}
      id="trust"
      className="bg-cream dark:bg-night-blue text-night-blue dark:text-cream py-24 px-6 md:px-16 border-b border-border-light dark:border-border-dark relative overflow-hidden z-10 transition-colors duration-500"
    >
      {/* Background Jali geometric texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035] text-night-blue dark:text-cream">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="jali-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 0 20 L 20 0 L 40 20 L 20 40 Z" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M 20 20 L 40 40 M 20 20 L 0 0 M 20 20 L 40 0 M 20 20 L 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#jali-pattern)" />
        </svg>
      </div>

      {/* Privacy field — boundary particle system */}
      {!prefersReducedMotion && isSectionInView && (
        <div className="absolute inset-0 pointer-events-none">
          <MicroscopicField
            mouseReactive={false}
            density="low"
            mode="boundary"
            bioForms={false}
          />
        </div>
      )}

      {/* Privacy shield visual — particles converge at edges */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Corner field shields */}
          {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
            <div
              key={i}
              className={`absolute ${pos} w-48 h-48 rounded-full opacity-[0.03] bg-marigold blur-2xl`}
              style={{ animationDelay: `${i * 1.5}s` }}
            />
          ))}
        </div>
      )}

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

          {/* Left column: headline + India map */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full">
            <div>
              <span className="text-marigold font-grotesk text-xs font-semibold tracking-[0.2em] uppercase mb-4 block">{content.tag}</span>
              <h2 className="font-serif text-4xl md:text-5xl font-normal leading-[1.1] tracking-tight mb-6">{content.title}</h2>
              <p className="font-grotesk text-night-blue/70 dark:text-cream/70 text-sm md:text-base font-light leading-relaxed mb-8">{content.desc}</p>
            </div>

            {/* India Data Map */}
            <div
              ref={mapRef}
              className="relative w-full max-w-[280px] h-[280px] mx-auto border border-border-light dark:border-border-dark bg-cream-dark/30 dark:bg-night-dark/30 p-4 overflow-hidden"
            >
              {/* Map label */}
              <div className="absolute top-2 right-2 font-grotesk text-[8px] uppercase tracking-[0.2em] text-marigold/60 font-semibold">
                INDIA-FIRST
              </div>

              <svg viewBox="0 0 280 280" className="w-full h-full">
                {/* Ashoka Chakra-style grid */}
                <circle cx="130" cy="140" r="30" fill="none" stroke="currentColor" className="text-ashoka-green/5 dark:text-cream/5" strokeWidth="1" />
                <circle cx="130" cy="140" r="15" fill="none" stroke="currentColor" className="text-ashoka-green/5 dark:text-cream/5" strokeWidth="0.5" />

                {/* India outline — stylized */}
                <path
                  d="M 130 15 L 140 25 L 142 35 L 138 45 L 148 55 L 160 62 L 180 75 L 195 85 L 210 95 L 220 102 L 230 115 L 220 120 L 210 120 L 205 125 L 190 122 L 180 135 L 175 145 L 165 170 L 155 190 L 148 210 L 142 225 L 138 232 L 135 240 L 131 245 L 128 250 L 124 240 L 118 220 L 110 200 L 98 180 L 88 165 L 82 155 L 80 148 L 72 145 L 60 140 L 50 142 L 35 142 L 30 135 L 42 128 L 55 122 L 68 115 L 75 110 L 82 100 L 88 88 L 92 78 L 95 65 L 98 52 L 102 45 L 105 32 L 115 28 Z"
                  fill="rgba(217,119,6,0.03)"
                  stroke="currentColor"
                  className="text-ashoka-green/20 dark:text-ashoka-green-light/20"
                  strokeWidth="1.5"
                />

                {/* Connection lines with data-flow animation */}
                {connectionPaths.map((pathD, i) => (
                  <g key={i}>
                    {/* Static dashed line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="rgba(217,119,6,0.15)"
                      strokeWidth="0.8"
                      strokeDasharray="3,4"
                    />
                    {/* Animated data-flow dot */}
                    {isMapInView && !prefersReducedMotion && (
                      <DataFlowDot
                        pathD={pathD}
                        duration={2.5 + i * 0.4}
                        delay={i * 0.7}
                        color="#d97706"
                      />
                    )}
                  </g>
                ))}

                {/* City nodes */}
                {cities.map((city, idx) => {
                  const isActive = idx <= activeCityIndex;
                  return (
                    <g key={idx}>
                      {isActive && (
                        <>
                          {/* Pulse ring */}
                          {!prefersReducedMotion && (
                            <motion.circle
                              cx={city.x} cy={city.y} r="7"
                              fill="rgba(5,150,105,0.3)"
                              animate={{ scale: [1, 2.4, 1], opacity: [0.4, 0, 0.4] }}
                              transition={{ repeat: Infinity, duration: 2, delay: idx * 0.12 }}
                              style={{ transformOrigin: `${city.x}px ${city.y}px` }}
                            />
                          )}
                          {/* Core dot */}
                          <circle cx={city.x} cy={city.y} r="2.5" fill="#d97706" />
                          {/* City name */}
                          <text
                            x={city.x + 7} y={city.y + 3}
                            fill="currentColor"
                            className="text-night-blue/65 dark:text-cream/65"
                            fontSize="7.5" fontFamily="Satoshi" fontWeight="600"
                          >
                            {city.name}
                          </text>
                        </>
                      )}
                      {!isActive && (
                        <circle cx={city.x} cy={city.y} r="1.5" fill="currentColor" className="text-night-blue/20 dark:text-cream/20" />
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Map caption */}
            <p className="font-grotesk text-[9px] uppercase tracking-[0.2em] text-night-blue/35 dark:text-cream/30 text-center mt-3 max-w-[280px] mx-auto">
              India-first health intelligence
            </p>
          </div>

          {/* Right column: stat grid */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
            {content.stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: idx * 0.12, type: 'spring', stiffness: 60 }}
                className="border-t border-border-light dark:border-border-dark pt-6"
              >
                <div className="font-serif text-6xl md:text-7xl font-light text-night-blue dark:text-cream mb-3 tracking-tighter">
                  <AnimatedStatValue value={stat.value} />
                </div>
                <div className="font-grotesk text-xs uppercase tracking-widest text-marigold font-semibold mb-2">{stat.label}</div>
                <p className="font-grotesk text-sm text-night-blue/70 dark:text-cream/70 font-light leading-relaxed">{stat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
