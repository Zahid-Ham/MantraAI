import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function QuestionOptions({
  questionData,
  currentAnswer,
  onAnswerChange,
  onAutoAdvance,
}) {
  const { language } = useLanguage();

  if (!questionData) return null;

  const { type, options, id } = questionData;

  const handleKeyPress = (e, callback) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      callback();
    }
  };

  const handleSelectAuto = (val) => {
    onAnswerChange(val);
    if (onAutoAdvance) {
      setTimeout(() => {
        onAutoAdvance();
      }, 300);
    }
  };

  // Render range slider
  if (type === 'slider') {
    const minVal = parseInt(options[0].value, 10);
    const maxVal = parseInt(options[options.length - 1].value, 10);
    const defaultVal = Math.round((minVal + maxVal) / 2);
    const sliderValue = currentAnswer !== undefined ? currentAnswer : defaultVal;

    // Calculate percentage for gradient background fill on the slider track
    const pct = ((sliderValue - minVal) / (maxVal - minVal)) * 100;

    const unitLabel = id === 'age_years'
      ? (language === 'en' ? 'years' : 'वर्ष')
      : (language === 'en' ? 'days' : 'दिन');

    return (
      <div className="w-full py-2 select-none font-sans">
        {/* Floating Value Bubble above the slider */}
        <div className="flex justify-center items-center mb-4">
          <div className="bg-[#FEF0E6] border border-[#FAD8C3] text-[#D25619] font-semibold text-[15px] px-4 py-1.5 rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-all">
            <span>{sliderValue}</span>
            <span className="text-[12px] font-medium text-[#D25619]/80 lowercase">
              {unitLabel}
            </span>
          </div>
        </div>

        {/* Custom Styled Slider */}
        <div className="relative w-full mb-3 px-1">
          <input
            type="range"
            min={minVal}
            max={maxVal}
            value={sliderValue}
            onChange={(e) => onAnswerChange(parseInt(e.target.value, 10))}
            style={{
              background: `linear-gradient(to right, #D25619 0%, #D25619 ${pct}%, #EAE5DD ${pct}%, #EAE5DD 100%)`,
            }}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D25619] accent-[#D25619]"
            aria-label={questionData.question[language] || questionData.question.en}
          />
        </div>

        {/* Min / Mid / Max Label Markers */}
        <div className="flex justify-between items-center text-[10.5px] font-semibold text-[#78716C] uppercase tracking-wider px-1">
          {options.map((opt, idx) => {
            const label = opt.label[language] || opt.label.en;
            return (
              <span
                key={idx}
                className={
                  sliderValue === parseInt(opt.value, 10)
                    ? 'text-[#D25619] font-bold'
                    : ''
                }
              >
                {label}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  // Render radio cards
  if (type === 'radio') {
    return (
      <div className="flex flex-col gap-2 font-sans">
        {options.map((opt, idx) => {
          const isSelected = currentAnswer === opt.value;
          const label = opt.label[language] || opt.label.en;

          return (
            <div
              key={idx}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => handleSelectAuto(opt.value)}
              onKeyDown={(e) => handleKeyPress(e, () => handleSelectAuto(opt.value))}
              className={`flex justify-between items-center px-4 py-2.5 border rounded-xl transition-all cursor-pointer select-none ${
                isSelected
                  ? 'border-[#D25619] bg-[#FEF0E6] text-[#1C1917] shadow-xs'
                  : 'border-[#EAE5DD] bg-white text-[#1C1917] hover:border-[#D5CEBF] hover:bg-[#FAF8F5]'
              }`}
            >
              <span className="text-[14px] font-medium">{label}</span>

              {/* Radio Circle Indicator */}
              <div
                className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'border-[#D25619] bg-[#D25619]'
                    : 'border-[#D5CEBF] bg-white'
                }`}
              >
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Render segmented buttons
  if (type === 'segmented') {
    return (
      <div className="flex flex-wrap gap-2 font-sans">
        {options.map((opt, idx) => {
          const isSelected = currentAnswer === opt.value;
          const label = opt.label[language] || opt.label.en;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectAuto(opt.value)}
              className={`flex-1 min-w-[100px] px-3.5 py-2.5 text-[13.5px] font-medium rounded-xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D25619] ${
                isSelected
                  ? 'bg-[#D25619] text-white border-[#D25619] shadow-xs'
                  : 'bg-white text-[#1C1917] border-[#EAE5DD] hover:border-[#D5CEBF] hover:bg-[#FAF8F5]'
              }`}
            >
              {label}
            </button>
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
        onAnswerChange(activeAnswers.filter((v) => v !== val));
      } else {
        onAnswerChange([...activeAnswers, val]);
      }
    };

    return (
      <div className="flex flex-col gap-2 font-sans">
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
              className={`flex justify-between items-center px-4 py-2.5 border rounded-xl transition-all cursor-pointer select-none ${
                isSelected
                  ? 'border-[#D25619] bg-[#FEF0E6] text-[#1C1917] shadow-xs'
                  : 'border-[#EAE5DD] bg-white text-[#1C1917] hover:border-[#D5CEBF] hover:bg-[#FAF8F5]'
              }`}
            >
              <span className="text-[14px] font-medium">{label}</span>

              {/* Checkbox square indicator */}
              <div
                className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'border-[#D25619] bg-[#D25619]'
                    : 'border-[#D5CEBF] bg-white'
                }`}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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

  // Render dropdown select
  if (type === 'dropdown') {
    return (
      <div className="font-sans">
        <select
          value={currentAnswer || ''}
          onChange={(e) => handleSelectAuto(e.target.value)}
          className="w-full bg-white text-[#1C1917] px-4 py-2.5 border border-[#EAE5DD] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D25619] text-[14.5px] font-medium cursor-pointer"
        >
          <option value="" disabled>
            {language === 'en' ? 'Select an option...' : 'एक विकल्प चुनें...'}
          </option>
          {options.map((opt, idx) => {
            const label = opt.label[language] || opt.label.en;
            return (
              <option key={idx} value={opt.value}>
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
