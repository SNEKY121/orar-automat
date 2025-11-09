import { loadConfig, loadVacations, loadSubjects, loadSchedule } from './loader.js';
import { DateTime } from 'luxon';

function fail(msg) { console.error('Validation error:', msg); process.exit(2); }

const cfg = loadConfig();
const vacations = loadVacations();
const subjects = loadSubjects();
const schedule = loadSchedule();

// basic checks
if (!DateTime.fromISO(cfg.academicStart).isValid) fail('academicStart invalid');
if (!DateTime.fromISO(cfg.academicEnd).isValid) fail('academicEnd invalid');
if (DateTime.fromISO(cfg.academicEnd) < DateTime.fromISO(cfg.academicStart)) fail('academicEnd before start');

for (const day of ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']) {
  if (!schedule[day]) continue;
  for (const cls of schedule[day]) {
    if (!cls.subject) fail(`${day} missing subject`);
    if (!subjects[cls.subject]) fail(`${day} references unknown subject ${cls.subject}`);
    if (!/^\d{2}:\d{2}$/.test(cls.start)) fail(`${day} ${cls.subject} start time invalid`);
    if (!/^\d{2}:\d{2}$/.test(cls.end)) fail(`${day} ${cls.subject} end time invalid`);
  }
}

console.log('Validation passed');
