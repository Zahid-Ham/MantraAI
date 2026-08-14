import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

// Tiny inline CSS-only particle burst on card hover
function CardParticles({ type, isHovered }) {
  const prefersReducedMotion = useReducedMotion();
  if (!isHovered || prefersReducedMotion) return null;

  if (type === 'neural') {
    // Neural network dots
    const dots = Array.from({ length: 8 }, (_, i) => ({
      x: 15 + (i % 4) * 22,
      y: 12 + Math.floor(i / 4) * 18,
      delay: i * 0.08,
    }));
    return (
      <svg className="absolute top-4 right-4 w-[110px] h-[50px] pointer-events-none" viewBox="0 0 110 50" aria-hidden="true">
        {dots.map((d, i) => (
          <motion.circle
            key={i}
            cx={d.x} cy={d.y} r="2"
            fill="#d97706"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0.5, 0], scale: [0, 1, 0] }}
            transition={{ delay: d.delay, duration: 1.2, repeat: Infinity, repeatDelay: 0.6 }}
          />
        ))}
        {/* Connecting lines */}
        {dots.slice(0, 4).map((d, i) => (
          <motion.line
            key={`l${i}`}
            x1={d.x} y1={d.y} x2={dots[i + 4]?.x ?? d.x} y2={dots[i + 4]?.y ?? d.y}
            stroke="#d97706" strokeWidth="0.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 0.3, 0] }}
            transition={{ delay: d.delay + 0.2, duration: 1.2, repeat: Infinity, repeatDelay: 0.6 }}
          />
        ))}
      </svg>
    );
  }

  if (type === 'pulse') {
    // Biological pulse rings
    return (
      <svg className="absolute top-4 right-4 w-[60px] h-[60px] pointer-events-none" viewBox="0 0 60 60" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            cx="30" cy="30" r="8"
            fill="none" stroke="#d97706" strokeWidth="1"
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: [0, 3], opacity: [0.6, 0] }}
            transition={{
              delay: i * 0.5,
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            style={{ transformOrigin: '30px 30px' }}
          />
        ))}
        <circle cx="30" cy="30" r="3" fill="#d97706" opacity="0.7" />
      </svg>
    );
  }

  if (type === 'scatter') {
    // Particle scatter
    const particles = Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      return { dx: Math.cos(angle) * 28, dy: Math.sin(angle) * 28, delay: i * 0.06 };
    });
    return (
      <svg className="absolute top-3 right-3 w-[70px] h-[70px] pointer-events-none" viewBox="0 0 70 70" aria-hidden="true">
        {particles.map((p, i) => (
          <motion.circle
            key={i}
            cx="35" cy="35" r="1.5"
            fill="#d97706"
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ x: p.dx, y: p.dy, opacity: [0, 0.7, 0] }}
            transition={{ delay: p.delay, duration: 1.0, repeat: Infinity, repeatDelay: 0.8 }}
          />
        ))}
      </svg>
    );
  }

  return null;
}

export default function ModulePreview() {
  const { language } = useLanguage();
  const [hoveredCard, setHoveredCard] = useState(null);
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 50, damping: 15 } },
  };

  const cardHoverVariants = prefersReducedMotion ? {} : {
    rest: { y: 0, borderColor: 'rgba(8,12,22,0.08)' },
    hover: { y: -4, transition: { type: 'spring', stiffness: 300, damping: 20 } },
  };

  const content = {
    en: {
      tag: 'Core Architecture',
      title: 'Clinical modules built for absolute discretion.',
      desc: 'Every module operates within a secure environment, built to respect privacy while delivering medical-grade health insights.',
      modules: {
        m1: {
          tag: '01 / Autonomous',
          title: 'AI Companion',
          desc: "An intelligent, context-aware interface designed to discuss sensitive questions, provide behavioral guidance, and translate clinical jargon. Instant, anonymous responses.",
          q: '"What factors in an urban lifestyle typically impact cardiovascular health and energy levels for men over 30?"',
          a: '"Sedentary routines, high cortisol from stress, and irregular sleep patterns. Let\'s analyze your parameters..."',
        },
        m2: {
          tag: '02 / Diagnostic',
          title: 'Symptom Assessment',
          desc: 'Structured clinical risk models matching inputs against localized epidemiological datasets. Safe, direct, and completely free of search history tracking.',
          footer: '[ 18 Clinical Markers Checked ]',
        },
        m3: {
          tag: '03 / Curated',
          title: 'Knowledge Hub',
          desc: 'Peer-reviewed medical content written by specialists. Zero clickbait, zero affiliate links—just objective evidence and guidelines.',
          footer: 'Access Library',
        },
        m4: {
          tag: '04 / Tracking',
          title: 'Digital Habit Wellness',
          desc: 'Track sleep metrics, physical activity, and stress variables. Convert raw device metrics into actionable physiological wellness trends.',
          footer: 'METRICS / BIO-STABILITY',
        },
        m5: {
          tag: '05 / Specialized',
          title: 'Fertility Risk Screening',
          desc: 'Evaluate reproductive parameters and environmental lifestyle risks through a structured, private survey framework. Receive comprehensive reports.',
          footer: 'PRE-CLINICAL REPORT GENERATION',
        },
      },
    },
    hi: {
      tag: 'मुख्य वास्तुकला',
      title: 'पूर्ण विवेक और गोपनीयता के लिए निर्मित क्लीनिकल मॉड्यूल।',
      desc: 'प्रत्येक मॉड्यूल चिकित्सा-ग्रेड स्वास्थ्य अंतर्दृष्टि प्रदान करते हुए गोपनीयता का सम्मान करने के लिए एक सुरक्षित वातावरण में काम करता है।',
      modules: {
        m1: {
          tag: '01 / स्वायत्त सहायक',
          title: 'एआई साथी (AI Companion)',
          desc: 'संवेदनशील प्रश्नों पर चर्चा करने, व्यवहार संबंधी मार्गदर्शन प्रदान करने और जटिल नैदानिक शब्दों को समझाने के लिए डिज़ाइन किया गया एक बुद्धिमान, संवेदनशील इंटरफ़ेस।',
          q: '"30 वर्ष से अधिक उम्र के पुरुषों के लिए शहरी जीवनशैली में कौन से कारक आमतौर पर हृदय स्वास्थ्य और ऊर्जा स्तर को प्रभावित करते हैं?"',
          a: '"गतिहीन दिनचर्या, तनाव से उच्च कोर्टिसोल, और अनियमित नींद के पैटर्न। आइए आपके मापदंडों का विश्लेषण करें..."',
        },
        m2: {
          tag: '02 / नैदानिक जोखिम जांच',
          title: 'लक्षण मूल्यांकन (Symptom Assessment)',
          desc: 'स्थानीयकृत महामारी विज्ञान डेटासेट के खिलाफ इनपुट का मिलान करने वाले संरचित नैदानिक जोखिम मॉडल। सुरक्षित, सीधा, और खोज इतिहास ट्रैकिंग से पूरी तरह मुक्त।',
          footer: '[ 18 नैदानिक ​​मार्करों की जांच ]',
        },
        m3: {
          tag: '03 / साक्ष्य-आधारित लाइब्रेरी',
          title: 'ज्ञान केंद्र (Knowledge Hub)',
          desc: 'विशेषज्ञों द्वारा लिखित सहकर्मी-समीक्षित चिकित्सा सामग्री। शून्य क्लिकबेट, शून्य संबद्ध लिंक—केवल निष्पक्ष साक्ष्य और नैदानिक दिशानिर्देश।',
          footer: 'लाइब्रेरी खोलें',
        },
        m4: {
          tag: '04 / आदत ट्रैकिंग',
          title: 'डिजिटल आदत कल्याण',
          desc: 'नींद के मेट्रिक्स, शारीरिक गतिविधि और तनाव चर को ट्रैक करें। कच्चे डिवाइस मेट्रिक्स को कार्रवाई योग्य शारीरिक कल्याण रुझानों में बदलें।',
          footer: 'मेट्रिक्स / जैविक-स्थिरता',
        },
        m5: {
          tag: '05 / विशिष्ट स्क्रीनिंग',
          title: 'प्रजनन जोखिम जांच',
          desc: 'एक संरचित, निजी सर्वेक्षण ढांचे के माध्यम से प्रजनन मापदंडों और पर्यावरणीय जीवनशैली जोखिमों का मूल्यांकन करें।',
          footer: 'प्री-क्लीनिकल रिपोर्ट जनरेशन',
        },
      },
    },
  }[language];

  const cardClass = 'relative bg-cream dark:bg-night-blue border border-border-light dark:border-border-dark flex flex-col justify-between overflow-hidden group';

  return (
    <section id="modules" className="bg-cream-dark/40 dark:bg-night-dark text-night-blue dark:text-cream py-24 px-6 md:px-16 border-b border-border-light dark:border-border-dark relative z-10 transition-colors duration-500">
      <div className="max-w-6xl mx-auto">

        {/* Section Header */}
        <div className="mb-16 md:mb-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-xl">
            <span className="text-marigold font-grotesk text-xs font-semibold tracking-[0.2em] uppercase mb-4 block">{content.tag}</span>
            <h2 className="font-serif text-4xl md:text-6xl font-normal leading-[1.05] tracking-tight">{content.title}</h2>
          </div>
          <p className="font-grotesk text-night-blue/60 dark:text-cream/60 max-w-sm text-sm md:text-base font-light leading-relaxed">{content.desc}</p>
        </div>

        {/* Asymmetrical Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-12 gap-6"
        >
          {/* Card 1: AI Companion (span 8) */}
          <motion.div
            variants={itemVariants}
            initial="rest"
            whileHover="hover"
            animate="rest"
            onHoverStart={() => setHoveredCard('m1')}
            onHoverEnd={() => setHoveredCard(null)}
            className={`md:col-span-8 ${cardClass} p-8 md:p-10 min-h-[380px] hover:border-marigold/40 transition-colors duration-500`}
          >
            {/* Hover accent line */}
            <span className="absolute top-0 left-0 h-[2px] bg-marigold w-0 group-hover:w-full transition-all duration-500" />
            <CardParticles type="neural" isHovered={hoveredCard === 'm1'} />
            <div>
              <span className="text-xs uppercase tracking-widest text-marigold font-semibold mb-6 block">{content.modules.m1.tag}</span>
              <h3 className="font-serif text-3xl md:text-4xl font-normal tracking-tight mb-4">{content.modules.m1.title}</h3>
              <p className="font-grotesk text-night-blue/70 dark:text-cream/70 text-sm md:text-base font-light max-w-lg leading-relaxed mb-6">{content.modules.m1.desc}</p>
            </div>
            <div className="border-t border-border-light dark:border-border-dark pt-6 flex flex-col gap-3 font-grotesk text-xs md:text-sm">
              <div className="bg-cream-dark/60 dark:bg-night-dark/60 text-night-blue/80 dark:text-cream/80 p-3 self-start max-w-md border-l border-marigold">{content.modules.m1.q}</div>
              <div className="bg-cream-dark/20 dark:bg-night-dark/20 text-marigold p-3 self-end max-w-md text-right border-r border-border-light dark:border-cream/20">{content.modules.m1.a}</div>
            </div>
          </motion.div>

          {/* Card 2: Symptom Assessment (span 4) */}
          <motion.div
            variants={itemVariants}
            initial="rest"
            whileHover="hover"
            animate="rest"
            onHoverStart={() => setHoveredCard('m2')}
            onHoverEnd={() => setHoveredCard(null)}
            className={`md:col-span-4 ${cardClass} p-8 md:p-10 min-h-[380px] hover:border-marigold/40 transition-colors duration-500`}
          >
            <span className="absolute top-0 left-0 h-[2px] bg-marigold w-0 group-hover:w-full transition-all duration-500" />
            <CardParticles type="pulse" isHovered={hoveredCard === 'm2'} />
            <div>
              <span className="text-xs uppercase tracking-widest text-marigold font-semibold mb-6 block">{content.modules.m2.tag}</span>
              <h3 className="font-serif text-3xl font-normal tracking-tight mb-4">{content.modules.m2.title}</h3>
              <p className="font-grotesk text-night-blue/70 dark:text-cream/70 text-sm font-light leading-relaxed">{content.modules.m2.desc}</p>
            </div>
            <div className="border-t border-border-light dark:border-border-dark pt-6 font-grotesk text-[10px] tracking-widest uppercase text-night-blue/40 dark:text-cream/40">{content.modules.m2.footer}</div>
          </motion.div>

          {/* Card 3: Knowledge Hub (span 4) */}
          <motion.div
            variants={itemVariants}
            className={`md:col-span-4 ${cardClass} p-8 min-h-[300px] hover:border-marigold/40 transition-colors duration-500`}
          >
            <span className="absolute top-0 left-0 h-[2px] bg-marigold w-0 group-hover:w-full transition-all duration-500" />
            <div>
              <span className="text-xs uppercase tracking-widest text-marigold font-semibold mb-4 block">{content.modules.m3.tag}</span>
              <h3 className="font-serif text-2xl font-normal tracking-tight mb-3">{content.modules.m3.title}</h3>
              <p className="font-grotesk text-night-blue/70 dark:text-cream/70 text-sm font-light leading-relaxed">{content.modules.m3.desc}</p>
            </div>
            <div className="text-xs font-grotesk text-night-blue/50 dark:text-cream/50 underline cursor-pointer hover:text-marigold transition-colors">{content.modules.m3.footer}</div>
          </motion.div>

          {/* Card 4: Digital Habit Wellness (span 4) */}
          <motion.div
            variants={itemVariants}
            className={`md:col-span-4 ${cardClass} p-8 min-h-[300px] hover:border-marigold/40 transition-colors duration-500`}
          >
            <span className="absolute top-0 left-0 h-[2px] bg-marigold w-0 group-hover:w-full transition-all duration-500" />
            <div>
              <span className="text-xs uppercase tracking-widest text-marigold font-semibold mb-4 block">{content.modules.m4.tag}</span>
              <h3 className="font-serif text-2xl font-normal tracking-tight mb-3">{content.modules.m4.title}</h3>
              <p className="font-grotesk text-night-blue/70 dark:text-cream/70 text-sm font-light leading-relaxed">{content.modules.m4.desc}</p>
            </div>
            <div className="font-grotesk text-xs text-night-blue/50 dark:text-cream/50 flex justify-between items-center">
              <span>{content.modules.m4.footer}</span>
              <span className="text-marigold">94.8%</span>
            </div>
          </motion.div>

          {/* Card 5: Fertility Risk Screening (span 4) — accented */}
          <motion.div
            variants={itemVariants}
            onHoverStart={() => setHoveredCard('m5')}
            onHoverEnd={() => setHoveredCard(null)}
            className={`md:col-span-4 ${cardClass} p-8 min-h-[300px] border-2 border-marigold/40 hover:border-marigold transition-colors duration-500`}
          >
            <span className="absolute top-0 left-0 h-[2px] bg-marigold w-full" />
            <CardParticles type="scatter" isHovered={hoveredCard === 'm5'} />
            <div>
              <span className="text-xs uppercase tracking-widest text-marigold font-semibold mb-4 block">{content.modules.m5.tag}</span>
              <h3 className="font-serif text-2xl font-normal tracking-tight mb-3">{content.modules.m5.title}</h3>
              <p className="font-grotesk text-night-blue/70 dark:text-cream/70 text-sm font-light leading-relaxed">{content.modules.m5.desc}</p>
            </div>
            <div className="font-grotesk text-[10px] tracking-wider uppercase text-marigold bg-marigold/10 px-3 py-1.5 self-start font-semibold">{content.modules.m5.footer}</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
