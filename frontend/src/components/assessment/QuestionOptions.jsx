import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function QuestionOptions({ questionData, currentAnswer, onAnswerChange }) {
  const { language } = useLanguage();

  if (!questionData) return null;

  const { type, options, id } = questionData;

  // Keypress event handler to support accessibility (Space / Enter triggers selection)
  const handleKeyPress = (e, callback) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      callback();
    }
  };

  // Render segmented horizontal buttons
  if (type === 'segmented') {
    return (
      <div className="flex flex-wrap gap-3 font-grotesk">
        {options.map((opt, idx) => {
          const isSelected = currentAnswer === opt.value;
          const label = opt.label[language] || opt.label.en;
          
          return (
            <button
              key={idx}
              onClick={() => onAnswerChange(opt.value)}
              className={`flex-1 min-w-[100px] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 border focus:outline-none focus:ring-2 focus:ring-marigold rounded-sm cursor-pointer ${
                isSelected 
                  ? "bg-marigold text-night-blue border-marigold" 
                  : "bg-cream-dark/40 dark:bg-night-blue/50 text-night-blue/80 dark:text-cream/80 border-border-light dark:border-border-dark hover:border-marigold"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  // Render radio card list
  if (type === 'radio') {
    return (
      <div className="flex flex-col gap-3 font-grotesk">
        {options.map((opt, idx) => {
          const isSelected = currentAnswer === opt.value;
          const label = opt.label[language] || opt.label.en;

          return (
            <div
              key={idx}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => onAnswerChange(opt.value)}
              onKeyDown={(e) => handleKeyPress(e, () => onAnswerChange(opt.value))}
              className={`flex justify-between items-center px-4 py-2.5 border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-marigold rounded-sm cursor-pointer select-none ${
                isSelected 
                  ? "border-marigold bg-marigold/5" 
                  : "border-border-light dark:border-border-dark bg-cream-dark/20 dark:bg-night-blue/30 text-night-blue/80 dark:text-cream/85 hover:border-marigold"
              }`}
            >
              <span className="text-sm font-medium">{label}</span>
              
              {/* Custom indicator dot */}
              <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-colors duration-300 ${
                isSelected ? "border-marigold bg-marigold" : "border-border-light dark:border-border-dark"
              }`}>
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-night-blue" />}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Render checkbox multi-select cards
  if (type === 'checkbox') {
    const activeAnswers = Array.isArray(currentAnswer) ? currentAnswer : [];

    const handleCheckboxToggle = (val) => {
      if (activeAnswers.includes(val)) {
        onAnswerChange(activeAnswers.filter(v => v !== val));
      } else {
        onAnswerChange([...activeAnswers, val]);
      }
    };

    return (
      <div className="flex flex-col gap-3 font-grotesk">
        {options.map((opt, idx) => {
          const isSelected = activeAnswers.includes(opt.value);
          const label = opt.label[language] || opt.label.en;

          return (
            <div
              key={idx}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => handleCheckboxToggle(opt.value)}
              onKeyDown={(e) => handleKeyPress(e, () => handleCheckboxToggle(opt.value))}
              className={`flex justify-between items-center px-4 py-2.5 border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-marigold rounded-sm cursor-pointer select-none ${
                isSelected 
                  ? "border-marigold bg-marigold/5" 
                  : "border-border-light dark:border-border-dark bg-cream-dark/20 dark:bg-night-blue/30 text-night-blue/80 dark:text-cream/85 hover:border-marigold"
              }`}
            >
              <span className="text-sm font-medium">{label}</span>
              
              {/* Custom Checkbox square indicator */}
              <div className={`w-4.5 h-4.5 border flex items-center justify-center transition-colors duration-300 rounded-xs ${
                isSelected ? "border-marigold bg-marigold" : "border-border-light dark:border-border-dark"
              }`}>
                {isSelected && (
                  <svg className="w-3 h-3 text-night-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Render range sliders
  if (type === 'slider') {
    const minVal = parseInt(options[0].value, 10);
    const maxVal = parseInt(options[options.length - 1].value, 10);
    const sliderValue = currentAnswer !== undefined ? currentAnswer : Math.round((minVal + maxVal) / 2);

    return (
      <div className="px-4 font-grotesk select-none">
        {/* Highlighted current value display */}
        <div className="flex justify-center items-center mb-5">
          <div className="bg-marigold/10 border border-marigold/20 text-marigold font-serif text-3.5xl px-5 py-2 rounded-sm flex items-baseline gap-1 shadow-lg shadow-marigold/5">
            <span className="font-semibold">{sliderValue}</span>
            <span className="text-[10px] font-grotesk tracking-widest text-night-blue/50 dark:text-cream/50 uppercase font-semibold">
              {id === 'age_years' 
                ? (language === 'en' ? 'Years' : 'वर्ष') 
                : (language === 'en' ? 'Days' : 'दिन')}
            </span>
          </div>
        </div>

        <input 
          type="range"
          min={minVal}
          max={maxVal}
          value={sliderValue}
          onChange={(e) => onAnswerChange(parseInt(e.target.value, 10))}
          className="w-full h-1 bg-cream-dark dark:bg-night-blue border border-border-light dark:border-border-dark accent-marigold cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-marigold mb-4"
        />

        {/* Labels underneath the slider */}
        <div className="flex justify-between items-center text-[10px] font-semibold text-night-blue/50 dark:text-cream/50 uppercase tracking-widest">
          {options.map((opt, idx) => {
            const label = opt.label[language] || opt.label.en;
            const labelStr = String(label);
            const valStr = String(opt.value);
            const text = labelStr.includes(valStr) ? labelStr : `${labelStr} (${valStr})`;
            
            return (
              <span key={idx} className={sliderValue === parseInt(opt.value, 10) ? "text-marigold" : ""}>
                {text}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  // Render dropdown select
  if (type === 'dropdown') {
    return (
      <div className="font-grotesk">
        <select
          value={currentAnswer || ""}
          onChange={(e) => onAnswerChange(e.target.value)}
          className="w-full bg-cream-dark/30 dark:bg-night-blue/50 text-night-blue dark:text-cream px-4 py-2.5 border border-border-light dark:border-border-dark rounded-sm focus:outline-none focus:ring-2 focus:ring-marigold text-sm font-medium cursor-pointer"
        >
          <option value="" disabled>
            {language === 'en' ? 'Select an option...' : 'एक विकल्प चुनें...'}
          </option>
          {options.map((opt, idx) => {
            const label = opt.label[language] || opt.label.en;
            return (
              <option key={idx} value={opt.value} className="bg-cream dark:bg-night-blue">
                {label}
              </option>
            );
          })}
        </select>
      </div>
    );
  }

  return null;
}
