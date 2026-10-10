/**
 * MantraAI Mobile Health Data Normalizer
 * 
 * Converts raw Android Health Connect SDK data into canonical MantraAI backend schema.
 * 
 * RULES:
 * 1. Missing data MUST remain null. NEVER convert missing values to 0.
 * 2. Mobile app contains NO health interpretation or diagnosis logic.
 * 3. Pure deterministic transformations only.
 */

/**
 * Format a Date object to standard YYYY-MM-DD (local date)
 * @param {Date|string|number} dateInput 
 * @returns {string} YYYY-MM-DD
 */
export function formatLocalDateString(dateInput) {
  if (!dateInput) {
    const now = new Date();
    return formatLocalDateString(now);
  }
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date provided to formatLocalDateString: ${dateInput}`);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates start (00:00:00.000) and end (23:59:59.999) ISO timestamps for a given date.
 * @param {Date|string} dateInput 
 * @returns {{ startTime: string, endTime: string, dateString: string }}
 */
export function getDayTimeRange(dateInput) {
  const baseDate = dateInput instanceof Date ? new Date(dateInput) : new Date(dateInput);
  if (isNaN(baseDate.getTime())) {
    throw new Error(`Invalid date provided to getDayTimeRange: ${dateInput}`);
  }

  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999);

  return {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    dateString: formatLocalDateString(start),
  };
}

/**
 * Normalizes raw Health Connect step records / aggregates into integer count or null.
 * @param {any} rawSteps 
 * @returns {number|null}
 */
export function normalizeSteps(rawSteps) {
  if (rawSteps === null || rawSteps === undefined) return null;
  if (typeof rawSteps === 'number') {
    return isNaN(rawSteps) ? null : Math.round(rawSteps);
  }
  // If array of step records
  if (Array.isArray(rawSteps)) {
    if (rawSteps.length === 0) return null;
    let total = 0;
    let hasValid = false;
    for (const record of rawSteps) {
      const count = Number(record.count ?? record.steps ?? record.stepCount);
      if (!isNaN(count) && count >= 0) {
        total += count;
        hasValid = true;
      }
    }
    return hasValid ? Math.round(total) : null;
  }
  // If aggregate object with count / result
  if (typeof rawSteps === 'object') {
    const val = Number(rawSteps.count ?? rawSteps.total ?? rawSteps.steps);
    return (!isNaN(val) && val >= 0) ? Math.round(val) : null;
  }
  return null;
}

/**
 * Normalizes raw sleep session records into total duration in minutes or null.
 * @param {any} rawSleep 
 * @returns {number|null}
 */
export function normalizeSleepMinutes(rawSleep) {
  if (rawSleep === null || rawSleep === undefined) return null;
  if (typeof rawSleep === 'number') {
    return isNaN(rawSleep) ? null : Math.round(rawSleep);
  }
  if (Array.isArray(rawSleep)) {
    if (rawSleep.length === 0) return null;
    let totalMillis = 0;
    let hasValid = false;
    for (const session of rawSleep) {
      if (session.startTime && session.endTime) {
        const start = new Date(session.startTime).getTime();
        const end = new Date(session.endTime).getTime();
        if (!isNaN(start) && !isNaN(end) && end > start) {
          totalMillis += (end - start);
          hasValid = true;
        }
      } else if (typeof session.durationMinutes === 'number') {
        totalMillis += session.durationMinutes * 60 * 1000;
        hasValid = true;
      }
    }
    return hasValid ? Math.round(totalMillis / (1000 * 60)) : null;
  }
  if (typeof rawSleep === 'object') {
    const minutes = Number(rawSleep.durationMinutes ?? rawSleep.totalMinutes ?? rawSleep.sleepMinutes);
    return (!isNaN(minutes) && minutes >= 0) ? Math.round(minutes) : null;
  }
  return null;
}

/**
 * Normalizes exercise / workout session records into active minutes & workout minutes.
 * @param {any} rawExercise 
 * @returns {{ active_minutes: number|null, workout_minutes: number|null }}
 */
export function normalizeExerciseMinutes(rawExercise) {
  if (rawExercise === null || rawExercise === undefined) {
    return { active_minutes: null, workout_minutes: null };
  }
  if (typeof rawExercise === 'number') {
    const rounded = isNaN(rawExercise) ? null : Math.round(rawExercise);
    return { active_minutes: rounded, workout_minutes: rounded };
  }
  if (Array.isArray(rawExercise)) {
    if (rawExercise.length === 0) {
      return { active_minutes: null, workout_minutes: null };
    }
    let totalMillis = 0;
    let hasValid = false;
    for (const session of rawExercise) {
      if (session.startTime && session.endTime) {
        const start = new Date(session.startTime).getTime();
        const end = new Date(session.endTime).getTime();
        if (!isNaN(start) && !isNaN(end) && end > start) {
          totalMillis += (end - start);
          hasValid = true;
        }
      } else if (typeof session.durationMinutes === 'number') {
        totalMillis += session.durationMinutes * 60 * 1000;
        hasValid = true;
      }
    }
    if (!hasValid) return { active_minutes: null, workout_minutes: null };
    const mins = Math.round(totalMillis / (1000 * 60));
    return {
      active_minutes: mins,
      workout_minutes: mins,
    };
  }
  if (typeof rawExercise === 'object') {
    const active = Number(rawExercise.active_minutes ?? rawExercise.activeMinutes);
    const workout = Number(rawExercise.workout_minutes ?? rawExercise.workoutMinutes);
    return {
      active_minutes: (!isNaN(active) && active >= 0) ? Math.round(active) : null,
      workout_minutes: (!isNaN(workout) && workout >= 0) ? Math.round(workout) : null,
    };
  }
  return { active_minutes: null, workout_minutes: null };
}

/**
 * Normalizes resting heart rate records into BPM integer or null.
 * @param {any} rawRhr 
 * @returns {number|null}
 */
export function normalizeRestingHeartRate(rawRhr) {
  if (rawRhr === null || rawRhr === undefined) return null;
  if (typeof rawRhr === 'number') {
    return isNaN(rawRhr) ? null : Math.round(rawRhr);
  }
  if (Array.isArray(rawRhr)) {
    if (rawRhr.length === 0) return null;
    // Take average or latest of resting beatsPerMinute
    let sum = 0;
    let count = 0;
    for (const r of rawRhr) {
      const bpm = Number(r.beatsPerMinute ?? r.rate ?? r.bpm);
      if (!isNaN(bpm) && bpm > 20 && bpm < 250) {
        sum += bpm;
        count += 1;
      }
    }
    return count > 0 ? Math.round(sum / count) : null;
  }
  if (typeof rawRhr === 'object') {
    const bpm = Number(rawRhr.beatsPerMinute ?? rawRhr.rate ?? rawRhr.bpm ?? rawRhr.resting_heart_rate);
    return (!isNaN(bpm) && bpm > 20 && bpm < 250) ? Math.round(bpm) : null;
  }
  return null;
}

/**
 * Normalizes active calories burned into integer kcal or null.
 * @param {any} rawCalories 
 * @returns {number|null}
 */
export function normalizeActiveCalories(rawCalories) {
  if (rawCalories === null || rawCalories === undefined) return null;
  if (typeof rawCalories === 'number') {
    return isNaN(rawCalories) ? null : Math.round(rawCalories);
  }
  if (Array.isArray(rawCalories)) {
    if (rawCalories.length === 0) return null;
    let total = 0;
    let hasValid = false;
    for (const record of rawCalories) {
      // Health Connect energy is in Calories or kilocalories object { inKilocalories, inCalories }
      let kcal = null;
      if (record.energy) {
        kcal = Number(record.energy.inKilocalories ?? (record.energy.inCalories ? record.energy.inCalories / 1000 : null));
      } else if (record.inKilocalories !== undefined) {
        kcal = Number(record.inKilocalories);
      } else if (record.calories !== undefined) {
        kcal = Number(record.calories);
      }
      if (kcal !== null && !isNaN(kcal) && kcal >= 0) {
        total += kcal;
        hasValid = true;
      }
    }
    return hasValid ? Math.round(total) : null;
  }
  if (typeof rawCalories === 'object') {
    let kcal = null;
    if (rawCalories.energy) {
      kcal = Number(rawCalories.energy.inKilocalories ?? rawCalories.energy.inCalories / 1000);
    } else {
      kcal = Number(rawCalories.inKilocalories ?? rawCalories.calories ?? rawCalories.active_calories);
    }
    return (kcal !== null && !isNaN(kcal) && kcal >= 0) ? Math.round(kcal) : null;
  }
  return null;
}

/**
 * Normalizes raw Health Connect records for a specific date into canonical MantraAI backend schema.
 * 
 * @param {Object} rawData
 * @param {string|Date} rawData.date - The target date (YYYY-MM-DD or Date object)
 * @param {any} [rawData.steps] - Raw steps data
 * @param {any} [rawData.sleep] - Raw sleep data
 * @param {any} [rawData.exercise] - Raw exercise sessions
 * @param {any} [rawData.active_minutes] - Direct active minutes if available
 * @param {any} [rawData.workout_minutes] - Direct workout minutes if available
 * @param {any} [rawData.restingHeartRate] - Raw resting heart rate data
 * @param {any} [rawData.activeCalories] - Raw active calories data
 * 
 * @returns {NormalizedDailyHealthData}
 */
export function normalizeDailyHealthData(rawData = {}) {
  const dateStr = formatLocalDateString(rawData.date || new Date());

  const steps = normalizeSteps(rawData.steps);
  const sleep_duration_minutes = normalizeSleepMinutes(rawData.sleep);

  let active_minutes = null;
  let workout_minutes = null;

  if (rawData.exercise !== undefined) {
    const exerciseNorm = normalizeExerciseMinutes(rawData.exercise);
    active_minutes = exerciseNorm.active_minutes;
    workout_minutes = exerciseNorm.workout_minutes;
  } else {
    if (rawData.active_minutes !== undefined) {
      const val = Number(rawData.active_minutes);
      active_minutes = (!isNaN(val) && val >= 0) ? Math.round(val) : null;
    }
    if (rawData.workout_minutes !== undefined) {
      const val = Number(rawData.workout_minutes);
      workout_minutes = (!isNaN(val) && val >= 0) ? Math.round(val) : null;
    }
  }

  const resting_heart_rate = normalizeRestingHeartRate(
    rawData.restingHeartRate ?? rawData.resting_heart_rate
  );

  const active_calories = normalizeActiveCalories(
    rawData.activeCalories ?? rawData.active_calories
  );

  return {
    source: 'health_connect',
    date: dateStr,
    steps,
    active_minutes,
    workout_minutes,
    sleep_duration_minutes,
    resting_heart_rate,
    active_calories,
  };
}
