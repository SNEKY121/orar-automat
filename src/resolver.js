import { DateTime } from 'luxon';

function withinRange(dateISO, fromISO, toISO, tz) {
  const d = DateTime.fromISO(dateISO, { zone: tz }).startOf('day');
  const from = DateTime.fromISO(fromISO, { zone: tz }).startOf('day');
  const to = DateTime.fromISO(toISO, { zone: tz }).endOf('day');
  return d >= from && d <= to;
}

function isVacationWeek(dateISO, vacations, tz) {
  const mon = DateTime.fromISO(dateISO, { zone: tz }).startOf('week').toISODate();
  return vacations.some(v => {
    const fromMon = DateTime.fromISO(v.from, { zone: tz }).startOf('week').toISODate();
    const toMon = DateTime.fromISO(v.to, { zone: tz }).startOf('week').toISODate();
    return mon >= fromMon && mon <= toMon;
  });
}

function weekIndex(dateISO, academicStartISO, tz) {
  const startMon = DateTime.fromISO(academicStartISO, { zone: tz }).startOf('week');
  const dMon = DateTime.fromISO(dateISO, { zone: tz }).startOf('week');
  const diff = Math.floor(dMon.diff(startMon, 'weeks').weeks);
  return diff;
}

function parityFromIndex(index, baseIsOdd) {
  const parityIndex = Math.abs(index) % 2;
  if (baseIsOdd) return parityIndex === 0 ? 'odd' : 'even';
  return parityIndex === 0 ? 'even' : 'odd';
}

function resolveForDate(targetISO, cfg, vacations, overrides, subjects, schedule) {
  const tz = cfg.timezone || 'UTC';

  // override first
  if (overrides && overrides[targetISO]) {
    const o = overrides[targetISO];
    return {
      date: targetISO,
      note: o.note || null,
      classes: (o.classes || []).map(c => enrichClass(c, subjects))
    };
  }

  // outside academic
  const d = DateTime.fromISO(targetISO, { zone: tz }).startOf('day');
  if (d < DateTime.fromISO(cfg.academicStart, { zone: tz }).startOf('day') ||
      d > DateTime.fromISO(cfg.academicEnd, { zone: tz }).endOf('day')) {
    return { date: targetISO, note: `Outside academic year ${cfg.academicStart}—${cfg.academicEnd}`, classes: [] };
  }

  // vacation
  if (isVacationWeek(targetISO, vacations, tz)) {
    return { date: targetISO, note: 'Vacation week — no classes', classes: [] };
  }

  const idx = weekIndex(targetISO, cfg.academicStart, tz);
  const parity = parityFromIndex(idx, cfg.baseWeekIsOdd);
  const weekdayShort = DateTime.fromISO(targetISO, { zone: tz }).toFormat('EEE'); // Mon Tue ...
  const dayList = schedule[weekdayShort] || [];

  const classes = dayList.filter(c => {
    if (!c.parity || c.parity === 'both') return true;
    return c.parity === parity;
  }).map(c => enrichClass(c, subjects));

  return { date: targetISO, parity, note: null, classes };
}

function enrichClass(c, subjects) {
  const subj = subjects[c.subject] || {};
  // If class provides a location string, use it verbatim.
  // If not provided, fall back to subject.defaultLocation (also verbatim).
  const location = c.location || subj.defaultLocation || '';
  return {
    subject: c.subject,
    name: subj.name || c.subject,
    short: subj.short || subj.name || c.subject,
    start: c.start,
    end: c.end,
    parity: c.parity || 'both',
    location
  };
}

export { resolveForDate };
