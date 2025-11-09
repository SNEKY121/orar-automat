import { loadConfig, loadVacations, loadOverrides, loadSubjects, loadLocations, loadSchedule } from './loader';
import { resolveForDate } from './resolver';
import { DateTime } from 'luxon';
import twilio from 'twilio';

const cfg = loadConfig();
const vacations = loadVacations();
const overrides = loadOverrides();
const subjects = loadSubjects();
// locations.json is still loadable but will not be used for lookup
const locations = loadLocations();
const schedule = loadSchedule();

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER,
  TWILIO_TO_NUMBER
} = process.env;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER || !TWILIO_TO_NUMBER) {
  console.error('Missing Twilio environment variables.');
  process.exit(1);
}

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

function formatSms(res) {
  const dt = DateTime.fromISO(res.date, { zone: cfg.timezone }).toFormat('ccc, dd LLL yyyy');
  if (res.note && (!res.classes || res.classes.length === 0)) {
    return `${dt} — ${res.note}`;
  }
  if (!res.classes || res.classes.length === 0) {
    return `${dt} — No classes`;
  }
  const lines = res.classes.map(c => {
    // c.location is verbatim (as requested)
    const loc = c.location && c.location.length ? c.location : '';
    return `${c.short} ${c.start}-${c.end}${loc ? ' @ ' + loc : ''}`;
  });
  const parity = res.parity ? `Week: ${res.parity}` : '';
  return `${dt} — ${parity}\n${lines.join('\n')}`;
}

async function sendSms(body) {
  return client.messages.create({
    body,
    from: TWILIO_FROM_NUMBER,
    to: TWILIO_TO_NUMBER
  });
}

async function main() {
  const tz = cfg.timezone || 'UTC';
  const tomorrowISO = DateTime.now().setZone(tz).plus({ days: 1 }).toISODate();
  const res = resolveForDate(tomorrowISO, cfg, vacations, overrides, subjects, locations, schedule);
  const body = formatSms(res);
  console.log('SMS body:\n', body);
  try {
    const resp = await sendSms(body);
    console.log('Sent SMS, sid:', resp.sid);
  } catch (err) {
    console.error('Twilio error:', err.message || err);
    process.exit(1);
  }
}

main();
