export const FIELD_LABEL_MAP = {
  // Reproductive History & Symptoms
  known_varicocele: 'Varicocele history',
  ejaculation_concerns: 'Ejaculation concern',
  prior_sti_history: 'Previous STI history',
  scrotal_or_groin_injury: 'Previous groin/scrotal injury',
  childhood_disease_mumps: 'History of childhood mumps',
  libido_changes: 'Libido & desire level',
  sexual_abstinence_period_days: 'Abstinence window',

  // Sexual & Psychosexual Wellbeing
  masturbation_control: 'Control over masturbation habits',
  spectatoring_self_monitoring: 'Performance self-monitoring',
  partnered_sexual_difficulty: 'Sexual difficulty reported',
  genital_self_image_concern: 'Genital self-image concern',
  pornography_driven_performance_standard: 'Pornography-related performance expectations',
  pornography_use_frequency: 'Pornography viewing frequency',
  pornography_frequency_weekly: 'Pornography viewing frequency',
  perceived_control_over_use: 'Perceived control over pornography use',
  use_as_emotional_coping: 'Pornography use as emotional coping',
  escalation_pattern: 'Content escalation pattern',
  distress_or_relationship_impact: 'Impact on daily life/relationship',
  viewing_context_habits: 'Pornography viewing setting',

  // Mental Health & Lifestyle Indicators (Proxies)
  perceived_stress_pss10: 'Perceived stress indicator (single-item proxy, non-diagnostic)',
  gad7_score: 'Anxiety indicator (single-item proxy, non-diagnostic)',
  phq9_score: 'Mood indicator (single-item proxy, non-diagnostic)',
  sleep_quality_psqi_proxy: 'Sleep quality rating',
  sleep_hours_night: 'Nightly sleep duration',
  daily_movement_level: 'Daily physical activity',
  hours_sitting_daily: 'Daily sitting duration',
  water_glasses_daily: 'Daily hydration level',
  daily_hydration: 'Daily hydration level',
  fruit_veg_servings: 'Fruit and vegetable intake',
  packaged_food_frequency: 'Packaged food intake',

  // Environmental & Exposures
  laptop_on_lap_hours: 'Laptop direct lap use',
  tight_underwear_frequency: 'Tight underwear frequency',
  hot_bath_sauna_frequency: 'Hot bath / sauna exposure',
  environmental_heat_exposure: 'Occupational heat exposure',
  chemical_pesticide_exposure: 'Chemical/pesticide exposure',
  plastic_bottles_hot_beverages: 'Plastic beverage exposure',

  // Substance & Demographics
  smoking_status: 'Smoking status',
  alcohol_frequency: 'Alcohol intake frequency',
  age: 'Age',
  bmi: 'BMI',
  location_setting: 'Living environment',
  occupation_type: 'Occupation category',
  education_level: 'Education level',
  relationship_status: 'Relationship status',
};

export const formatReportedContextItem = (item) => {
  if (!item) return '';
  if (typeof item !== 'string') {
    if (typeof item === 'object' && item !== null) {
      const k = item.key || item.id || item.field || '';
      const v = item.value || item.response || '';
      const label = FIELD_LABEL_MAP[k] || k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return v ? `${label}: ${v}` : label;
    }
    return String(item);
  }

  const str = item.trim();

  // If item is formatted as key: value (e.g. "known_varicocele: Unsure" or "phq9_score: 4")
  if (str.includes(':')) {
    const colonIdx = str.indexOf(':');
    const rawKey = str.slice(0, colonIdx).trim();
    const rawVal = str.slice(colonIdx + 1).trim();

    // Check if rawKey is a known technical key or snake_case key
    if (FIELD_LABEL_MAP[rawKey] || /^[a-z0-9_]+$/.test(rawKey)) {
      // Special handling for proxy scores
      if (rawKey === 'phq9_score') {
        return `Mood indicator (single-item proxy, non-diagnostic): ${rawVal}`;
      }
      if (rawKey === 'gad7_score') {
        return `Anxiety indicator (single-item proxy, non-diagnostic): ${rawVal}`;
      }
      if (rawKey === 'perceived_stress_pss10') {
        return `Perceived stress indicator (single-item proxy, non-diagnostic): ${rawVal}`;
      }

      const humanLabel = FIELD_LABEL_MAP[rawKey] || rawKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `${humanLabel}: ${rawVal}`;
    }
  }

  // Replace any standalone snake_case keys embedded inside strings
  let cleanStr = str;
  for (const [key, label] of Object.entries(FIELD_LABEL_MAP)) {
    if (cleanStr.includes(key)) {
      cleanStr = cleanStr.split(key).join(label);
    }
  }

  return cleanStr;
};
