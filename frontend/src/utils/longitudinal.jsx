import React from 'react';

// =============================================================================
// 6 CANONICAL MANTRAAI HEALTH DOMAINS
// =============================================================================
export const DOMAIN_DEFINITIONS = [
  {
    key: 'reproductive_health',
    title: 'Reproductive Health',
    shortTitle: 'Reproductive',
    color: '#0D9488', // teal-600
    bgLight: '#E6F4F2',
    borderColor: '#99F6E4',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    description: 'Sperm parameter history, testicular factors, symptoms, and medical indicators.',
  },
  {
    key: 'sexual_health',
    title: 'Sexual Health',
    shortTitle: 'Sexual Health',
    color: '#2563EB', // blue-600
    bgLight: '#EFF6FF',
    borderColor: '#BFDBFE',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    description: 'Erectile function context, libido indicators, ejaculation comfort, and performance anxiety.',
  },
  {
    key: 'mental_behavioral_wellness',
    title: 'Mental & Behavioral Wellness',
    shortTitle: 'Mental Wellness',
    color: '#7C3AED', // violet-600
    bgLight: '#F5F3FF',
    borderColor: '#DDD6FE',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    description: 'Stress context (PSS-10 proxy), mood indicators (PHQ-9 proxy), anxiety screening (GAD-7 proxy).',
  },
  {
    key: 'lifestyle_wellness',
    title: 'Lifestyle Wellness',
    shortTitle: 'Lifestyle',
    color: '#D97706', // amber-600
    bgLight: '#FFFBEB',
    borderColor: '#FDE68A',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: 'Sleep duration & consistency, physical activity levels, dietary patterns, and hydration.',
  },
  {
    key: 'environmental_heat_context',
    title: 'Environmental & Heat Context',
    shortTitle: 'Environmental',
    color: '#16A34A', // green-600
    bgLight: '#F0FDF4',
    borderColor: '#BBF7D0',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: 'Scrotal thermal exposures (hot baths, sauna, laptop usage), occupational & chemical context.',
  },
  {
    key: 'substance_medication_context',
    title: 'Substance & Medication Context',
    shortTitle: 'Substance Use',
    color: '#E11D48', // rose-600
    bgLight: '#FFF1F2',
    borderColor: '#FECDD3',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    description: 'Tobacco/nicotine, alcohol intake patterns, anabolic steroid history, and prescription medications.',
  },
];

// =============================================================================
// REPORTED CONTEXT INDICATOR (0–100 NORMALIZED RATIO)
// =============================================================================
/**
 * Calculates a transparent, non-clinical Reported Context Indicator (0–100) based strictly on
 * the domain's reported positive factors (P) and modifiable focus areas (M).
 *
 * Mathematical Transformation:
 *   If P + M === 0: returns null (representing "No comparable factors" / "No factors reported")
 *   Otherwise: Math.round((P / (P + M)) * 100)
 *
 * NON-CLINICAL SAFETY NOTICE:
 * This indicator is a non-clinical visualization derived from self-reported contextual factors.
 * It is NOT a medical score, wellness score, fertility score, risk score, clinical score, or diagnosis.
 *
 * @param {number} priorityCount - Number of modifiable focus areas (M) in this domain.
 * @param {number} positiveCount - Number of reported positive/protective factors (P) in this domain.
 * @returns {number|null} - 0 to 100 normalized percentage or null if no factors exist in this domain.
 */
export function calculateDomainContextIndicator(priorityCount, positiveCount) {
  const M = Number(priorityCount) || 0;
  const P = Number(positiveCount) || 0;
  const total = P + M;

  if (total === 0) {
    return null; // Explicitly indicates no comparable factors reported for this domain
  }

  return Math.round((P / total) * 100);
}

// =============================================================================
// DERIVE LONGITUDINAL SESSION DATA
// =============================================================================
export function deriveLongitudinalData(completedSessionsChronological, reportsMap) {
  return completedSessionsChronological.map((session, index) => {
    const report = reportsMap[session.id] || null;
    const dateObj = new Date(session.completed_at || session.started_at || Date.now());
    const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const fullDateLabel = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const domainScores = {};
    const domainFactors = {};

    DOMAIN_DEFINITIONS.forEach((dom) => {
      let priorityCount = 0;
      let positiveCount = 0;
      let factorsList = [];

      if (report) {
        if (Array.isArray(report.priority_factors)) {
          const domPriority = report.priority_factors.filter((f) => f.domain === dom.key);
          priorityCount += domPriority.length;
          factorsList = factorsList.concat(domPriority);
        }
        if (Array.isArray(report.positive_factors)) {
          const domPositive = report.positive_factors.filter((f) => f.domain === dom.key);
          positiveCount += domPositive.length;
        }
        if (Array.isArray(report.structured_findings)) {
          const domStruct = report.structured_findings.filter((f) => f.domain === dom.key);
          if (priorityCount === 0 && domStruct.length > 0) {
            priorityCount = domStruct.length;
          }
        }
      }

      const calculatedScore = calculateDomainContextIndicator(priorityCount, positiveCount);

      domainScores[dom.key] = calculatedScore;
      domainFactors[dom.key] = {
        priorityCount,
        positiveCount,
        factors: factorsList,
        indicator: calculatedScore,
        hasData: calculatedScore !== null,
      };
    });

    return {
      session,
      index,
      dateLabel,
      fullDateLabel,
      timestamp: dateObj.getTime(),
      report,
      domainScores,
      domainFactors,
    };
  });
}

// =============================================================================
// DERIVE BASELINE VS LATEST COMPARISON
// =============================================================================
export function deriveComparison(longitudinalData) {
  if (longitudinalData.length === 0) {
    return {
      totalCompleted: 0,
      baselineDate: null,
      latestDate: null,
      hasComparison: false,
      domains: {},
      areasWithChange: 0,
      improvedCount: 0,
      attentionCount: 0,
      totalModifiable: 0,
      totalPositive: 0,
      snapshotStatus: 'No Assessments Yet',
    };
  }

  const baseline = longitudinalData[0];
  const latest = longitudinalData[longitudinalData.length - 1];
  const hasComparison = longitudinalData.length >= 2;

  let areasWithChange = 0;
  let improvedCount = 0;
  let attentionCount = 0;
  let totalModifiable = 0;
  let totalPositive = 0;
  const domainsComp = {};

  DOMAIN_DEFINITIONS.forEach((dom) => {
    const baseScore = baseline.domainScores[dom.key]; // number or null
    const latestScore = latest.domainScores[dom.key]; // number or null
    const basePriority = baseline.domainFactors[dom.key]?.priorityCount || 0;
    const latestPriority = latest.domainFactors[dom.key]?.priorityCount || 0;
    const basePositive = baseline.domainFactors[dom.key]?.positiveCount || 0;
    const latestPositive = latest.domainFactors[dom.key]?.positiveCount || 0;

    totalModifiable += latestPriority;
    totalPositive += latestPositive;

    let statusText = 'Baseline Recorded';
    let trendType = 'neutral';
    let changeLabel = 'Baseline';

    if (hasComparison) {
      const priorityReduced = basePriority > latestPriority;
      const positiveIncreased = latestPositive > basePositive;
      const priorityIncreased = latestPriority > basePriority;

      if (priorityReduced || (positiveIncreased && !priorityIncreased)) {
        statusText = 'Fewer contextual factors identified';
        trendType = 'positive';
        if (priorityReduced) {
          const diff = basePriority - latestPriority;
          changeLabel = `-${diff} Focus Area${diff > 1 ? 's' : ''}`;
        } else {
          const diff = latestPositive - basePositive;
          changeLabel = `+${diff} Positive Factor${diff > 1 ? 's' : ''}`;
        }
        areasWithChange += 1;
        improvedCount += 1;
      } else if (priorityIncreased) {
        statusText = 'New focus area identified';
        trendType = 'attention';
        const diff = latestPriority - basePriority;
        changeLabel = `+${diff} Focus Area${diff > 1 ? 's' : ''}`;
        areasWithChange += 1;
        attentionCount += 1;
      } else {
        if (latestPriority === 0 && latestPositive === 0) {
          statusText = 'No comparable factors reported';
          trendType = 'neutral';
          changeLabel = 'No factors';
        } else {
          statusText = 'Stable context';
          trendType = 'neutral';
          changeLabel = 'No change';
        }
      }
    } else {
      if (latestPriority === 0 && latestPositive > 0) {
        statusText = `${latestPositive} positive protective factor${latestPositive > 1 ? 's' : ''}`;
        changeLabel = `${latestPositive} Positive`;
      } else if (latestPriority > 0 && latestPositive > 0) {
        statusText = `${latestPriority} focus area${latestPriority > 1 ? 's' : ''}, ${latestPositive} positive factor${latestPositive > 1 ? 's' : ''}`;
        changeLabel = `${latestPriority} Focus / ${latestPositive} Pos`;
      } else if (latestPriority > 0) {
        statusText = `${latestPriority} modifiable focus area${latestPriority > 1 ? 's' : ''}`;
        changeLabel = `${latestPriority} Focus Area${latestPriority > 1 ? 's' : ''}`;
      } else {
        statusText = 'No comparable factors reported';
        changeLabel = 'Baseline';
      }
    }

    domainsComp[dom.key] = {
      baseScore,
      latestScore,
      statusText,
      trendType,
      changeLabel,
      basePriority,
      latestPriority,
      basePositive,
      latestPositive,
      hasData: latestScore !== null || baseScore !== null,
      percentageFill: latestScore !== null ? latestScore : 0,
    };
  });

  let snapshotStatus = 'Baseline Established';
  if (hasComparison) {
    if (improvedCount >= 2) {
      snapshotStatus = 'Positive Context Trend';
    } else if (attentionCount > 0) {
      snapshotStatus = 'Active Focus Areas';
    } else {
      snapshotStatus = 'Consistent Context';
    }
  }

  return {
    totalCompleted: longitudinalData.length,
    baselineDate: baseline.fullDateLabel,
    latestDate: latest.fullDateLabel,
    hasComparison,
    domains: domainsComp,
    areasWithChange,
    improvedCount,
    attentionCount,
    totalModifiable,
    totalPositive,
    snapshotStatus,
  };
}
