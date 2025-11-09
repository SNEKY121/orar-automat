import { readFileSync } from 'fs';
import { join } from 'path';

function loadJson(rel) {
  const p = join(__dirname, '..', rel);
  return JSON.parse(readFileSync(p, 'utf8'));
}

export function loadConfig() { return loadJson('config/academic.json'); }
export function loadVacations() { return loadJson('config/vacations.json'); }
export function loadOverrides() { return loadJson('config/overrides.json'); }
export function loadSubjects() { return loadJson('data/subjects.json'); }
export function loadSchedule() { return loadJson('data/schedule.json'); }
