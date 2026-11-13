// Story, characters, chapters and story events. Edit freely.
export const START_STAFF = [
  { id: 'sharma', t: 'doc', n: 'Dr. Rakesh Sharma', age: 52, qual: 'MBBS, MD General Medicine', exp: 22, sk: { spd: 6, acc: 9, care: 7 }, tr: 'Old-school and thorough', sal: 11000,
    bio: 'A district-hospital physician for 22 years who left after a fight over free beds for poor patients. Your mentor\'s old batchmate; he works here for half his old pay because "this clinic feels honest".' },
  { id: 'anita', t: 'nurse', n: 'Anita Das', age: 34, qual: 'GNM Nursing', exp: 9, sk: { spd: 7, acc: 8, care: 9 }, tr: 'Calm under pressure', sal: 5000,
    bio: 'Cared for her sick mother as a teenager, then spent nine years on ICU night shifts. She dreams of running her own ICU one day.' },
  { id: 'priya', t: 'nurse', n: 'Priya Menon', age: 23, qual: 'B.Sc Nursing', exp: 1, sk: { spd: 6, acc: 6, care: 8 }, tr: 'Fast learner', sal: 3500,
    bio: 'First nurse in her family. Nervous on her first week but never stops asking questions.' },
  { id: 'rohan', t: 'recep', n: 'Rohan Gupta', age: 26, qual: 'BBA Hospital Administration', exp: 3, sk: { spd: 8, acc: 7, care: 6 }, tr: 'Remembers every name', sal: 3200,
    bio: 'A former call-centre agent who remembers every patient\'s name and birthday. Patients queue at his desk even when others are free.' },
  { id: 'imran', t: 'tech', n: 'Imran Sheikh', age: 29, qual: 'DMLT (Lab Technology)', exp: 6, sk: { spd: 8, acc: 8, care: 5 }, tr: 'Machine whisperer', sal: 4500,
    bio: 'Learned lab work in his uncle\'s tiny pathology lab. Can fix any analyser with a screwdriver and patience.' },
  { id: 'sunita', t: 'hk', n: 'Sunita Yadav', age: 41, qual: 'Housekeeping certificate', exp: 15, sk: { spd: 7, acc: 8, care: 7 }, tr: 'Knows everyone in town', sal: 2500,
    bio: 'Cleaned this building for years before you bought it. The neighbourhood trusts her word more than any signboard.' },
];
export const CHARS = [
  { n: 'Dr. Meera Iyer', r: 'Your mentor', bio: 'Retired chief surgeon. Taught you everything. Lent you the savings to buy the clinic and writes you a letter at every milestone: "A hospital begins with one honest patient."' },
  { n: 'Dr. Vikram Rao', r: 'Rival', bio: 'Owner of Rao Super-Speciality Hospital across the city. Charming, ruthless, and sure a small clinic will not last a year.' },
];
export const INTRO = (name) => [
  { t: 'Prologue', x: `You are <b>Dr. ${name}</b>, the first doctor in your family. Your parents sold their harvest to pay for your MBBS. The day you graduated, your mentor <b>Dr. Meera Iyer</b> handed you an envelope and said: <i>"A hospital begins with one honest patient. Go and find yours."</i>` },
  { t: 'Your team', x: 'A small, loyal team comes with the clinic: <b>Dr. Rakesh Sharma</b> (veteran physician), nurses <b>Anita</b> and <b>Priya</b>, receptionist <b>Rohan</b>, lab technician <b>Imran</b> and <b>Sunita</b>, who keeps everything spotless. Every one of them has a resume: experience, skills and a story. Train them, promote them and hire new people as you grow.' },
  { t: 'The rival', x: 'Across the city, <b>Dr. Vikram Rao</b> runs a gleaming super-speciality hospital. He has already told the newspapers your clinic will close within a year. Prove him wrong.' },
  { t: 'Your goal', x: 'Start with one OPD room. Treat patients, study for MD, specialization and super-specialization, add a lift and floors, build a lab, pharmacy, operation theatre, ICU, cardiology and maternity wards, and one day open an <b>International Medical Centre</b>. Operate every department\'s PC yourself or let your team do it.' },
];
export const CHAPTERS = [
  { t: 'The Empty Clinic', x: 'One room, one desk, six hopeful staff. The street outside is busy, but nobody knows your name yet.', l: 'Start small, listen carefully, and never guess when you can ask. - M.I.' },
  { t: 'Word Spreads', x: 'A grateful patient told the whole market about you. The waiting room is full and the lab is calling.', l: 'Reputation is built one diagnosis at a time. Build the lab and the pharmacy. - M.I.' },
  { t: 'First Floor, First Fears', x: 'You have outgrown the ground floor. Operating theatres, X-ray and a recovery room are within reach.', l: 'Surgeons are not made by buildings. Train your team before you buy machines. - M.I.' },
  { t: 'The Night Shift', x: 'Emergency doors open, ICU lights hum. Anita stays on every night shift.', l: 'The ER shows you who your people really are. - M.I.' },
  { t: 'Super-Speciality', x: 'Cardiology, neurology, dialysis and MRI: patients now travel from other towns to see you.', l: 'Specialization is service, not status. - M.I.' },
  { t: 'Teaching the Next Generation', x: 'Your hospital now trains interns and runs research. Dr. Rao\'s residents ask to join your college.', l: 'The best doctors teach. - M.I.' },
  { t: 'International Medical Centre', x: 'Patients arrive from abroad. The newspapers that doubted you now ask for your advice.', l: 'You were never building a hospital. You were building trust. - M.I.' },
];
export const BEATS = [
  { id: 'anita', when: (S) => S.lvl >= 2, t: 'Anita asks for training', text: 'Nurse Anita has taken extra shifts for weeks. She asks if the hospital can fund an advanced critical-care course (₹20,000).',
    opts: [{ t: 'Fund her course (₹20,000)', cost: 20000, fx: (S) => { const a = S.staff.find((x) => x.id == 'anita'); if (a) { a.sk.care = Math.min(10, a.sk.care + 2); a.sk.acc = Math.min(10, a.sk.acc + 1) } S.rep = Math.min(100, S.rep + 1) }, res: 'Anita is thrilled. Her skills improved.' },
      { t: 'Not right now', fx: () => {}, res: 'Anita nods quietly and goes back to work.' }] },
  { id: 'camp', when: (S) => S.pat >= 30, t: 'The newspaper calls', text: 'A local reporter wants to cover your clinic. Sunita suggests a free health camp for the neighbourhood (₹10,000).',
    opts: [{ t: 'Host a free health camp (₹10,000)', cost: 10000, fx: (S) => { S.rep = Math.min(100, S.rep + 3); S.charity = (S.charity || 0) + 5 }, res: 'The camp was a hit. Reputation +3.' },
      { t: 'Decline the interview', fx: () => {}, res: 'The story runs without you.' }] },
  { id: 'rao', when: (S) => S.lvl >= 4, t: 'Dr. Rao makes an offer', text: 'Dr. Vikram Rao visits with a smile and a cheque. "Merge with my hospital. You keep your name on the door, I keep the profits."',
    opts: [{ t: 'Refuse politely', fx: (S) => { S.rep = Math.min(100, S.rep + 2) }, res: 'Rao leaves annoyed. Your staff cheer. Reputation +2.' },
      { t: 'Take a ₹5,00,000 advance for a "partnership"', fx: (S) => { S.money += 500000; S.rep = Math.max(0, S.rep - 5) }, res: 'You took the money. Patients whisper. Reputation -5.' }] },
  { id: 'meera', when: (S) => S.lvl >= 5, t: 'Dr. Meera visits', text: 'Your mentor tours the new super-speciality wing and leaves a donation for the hospital\'s charity fund.',
    opts: [{ t: 'Use it for charity beds', fx: (S) => { S.rep = Math.min(100, S.rep + 4); S.charity = (S.charity || 0) + 10 }, res: 'Reputation +4. Dr. Meera smiles.' },
      { t: 'Use it for equipment (₹3,00,000)', fx: (S) => { S.money += 300000 }, res: 'Funds +₹3,00,000.' }] },
  { id: 'college', when: (S) => S.lvl >= 6, t: 'Interns arrive', text: 'Fifteen interns and residents arrive. They want to learn from your senior doctors.',
    opts: [{ t: 'Welcome them (₹50,000)', cost: 50000, fx: (S) => { S.rep = Math.min(100, S.rep + 3); S.staff.forEach((x) => { if (x.t == 'doc') x.sk.care = Math.min(10, x.sk.care + 1) }) }, res: 'Teaching sharpens your doctors. Reputation +3.' },
      { t: 'Not enough space yet', fx: () => {}, res: 'The interns go elsewhere.' }] },
];
