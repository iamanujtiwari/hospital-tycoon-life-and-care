// Staff resumes: candidate generator + rating helper. Skills: spd (speed), acc (accuracy), care (patient care), each 1-10.
import { STAFF } from '../game/config.js';
const FN = { M: ['Rahul', 'Amit', 'Vikram', 'Suresh', 'Arjun', 'Karan', 'Imran', 'Mohan', 'Dev', 'Nikhil'], F: ['Priya', 'Anjali', 'Sunita', 'Neha', 'Kavya', 'Fatima', 'Meena', 'Pooja', 'Divya', 'Isha'] };
const LN = ['Sharma', 'Verma', 'Singh', 'Khan', 'Patel', 'Gupta', 'Reddy', 'Nair', 'Das', 'Joshi', 'Mehta', 'Iyer'];
const ROLES = {
  doc: { q: ['MBBS', 'MBBS, DNB Family Medicine', 'MBBS, MD General Medicine', 'MBBS, MD Paediatrics'], sal: 8000 },
  nurse: { q: ['GNM Nursing', 'B.Sc Nursing', 'M.Sc Nursing'], sal: 4000 },
  tech: { q: ['DMLT (Lab Technology)', 'B.Sc MLT', 'Diploma in Radiography', 'B.Sc Radiography'], sal: 4000 },
  recep: { q: ['Front-office certificate', 'BBA Hospital Administration'], sal: 3000 },
  hk: { q: ['Housekeeping certificate'], sal: 2000 },
  pharm: { q: ['D.Pharm', 'B.Pharm', 'M.Pharm'], sal: 5000 },
};
const PREV = ['City General Hospital', 'Sunrise Nursing Home', 'District Hospital', 'Lakeview Clinic', 'Metro Diagnostics', 'St. Mary Medical Centre', 'Green Valley Hospital'];
const COLL = ['Government Medical College', 'a city nursing college', 'the state paramedical institute', 'a private pharmacy college'];
const TRAIT = ['Calm under pressure', 'Fast learner', 'Detail-oriented', 'Great with children', 'Night-shift champion', 'Team player', 'Very punctual', 'Speaks four languages'];
const QUIRK = ['Keeps a notebook of every patient tip.', 'Always the first to arrive and the last to leave.', 'Known for calming nervous patients.', 'Hums while working, patients love it.', 'Has never missed a shift in years.', 'Wants to grow with a young hospital.'];
const pick = (a) => a[Math.random() * a.length | 0], ri = (a, b) => a + Math.random() * (b - a + 1) | 0, cl = (v) => Math.max(1, Math.min(10, Math.round(v)));
export const rate = (s) => (s.sk.spd + s.sk.acc + s.sk.care) / 3;
export function genCand(role) {
  const R = ROLES[role], g = Math.random() < .5 ? 'M' : 'F', exp = ri(0, 18), b = 2.5 + exp * .3, q = pick(R.q);
  return { id: 'c' + Math.random().toString(36).slice(2, 7), t: role, n: (role == 'doc' ? 'Dr. ' : '') + pick(FN[g]) + ' ' + pick(LN), age: 22 + exp + ri(0, 6), qual: q, exp,
    sk: { spd: cl(b + ri(-2, 2)), acc: cl(b + ri(-2, 2)), care: cl(b + ri(-2, 2)) }, tr: pick(TRAIT),
    bio: (exp ? `${exp} years at ${pick(PREV)}. ` : `Fresh graduate from ${pick(COLL)}. `) + pick(QUIRK),
    sal: Math.round(R.sal * (1 + exp * .05) / 100) * 100, fee: Math.round(STAFF[role][1] * (1 + exp * .03) / 100) * 100 };
}
export const genCands = (n = 8) => ['doc', 'doc', 'nurse', 'nurse', 'tech', 'tech', 'pharm', 'recep', 'hk', 'nurse', 'doc', 'tech'].slice(0, n).map(genCand);
