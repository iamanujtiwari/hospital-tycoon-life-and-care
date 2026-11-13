// All game data lives here: edit prices, rooms, careers, colours.
export const H = 3.1, FH = 4;               // wall height, floor-to-floor height
export const CLINIC_PRICE = 150000, PAINT_COST = 5000;
export const ROOMS = {
  opd: { n: 'OPD Room', c: 30000, l: 1, col: 0x6cc08b },
  lab: { n: 'Laboratory', c: 60000, l: 2, col: 0xb78ad9 },
  pharmacy: { n: 'Pharmacy', c: 45000, l: 2, col: 0xf0b44c },
  ward: { n: 'Ward', c: 50000, l: 2, col: 0x8fd3d0 },
  xray: { n: 'X-ray', c: 90000, l: 3, col: 0x9aa5b1 },
  ot: { n: 'Operation Theatre', c: 180000, l: 3, col: 0x3fb8af },
  recovery: { n: 'Recovery Room', c: 70000, l: 3, col: 0xe8b4c8 },
  usg: { n: 'Ultrasound', c: 120000, l: 2, col: 0xa8c4d4 },
  ct: { n: 'CT Scan', c: 350000, l: 3, col: 0x7a8fb8 },
  er: { n: 'Emergency (ER)', c: 250000, l: 4, col: 0xe5484d }, icu: { n: 'ICU', c: 450000, l: 4, col: 0x5aa9e6 }, cardio: { n: 'Cardiology', c: 300000, l: 4, col: 0xd94f70 }, maternity: { n: 'Maternity', c: 350000, l: 4, col: 0xf2a7c3 },
  neuro: { n: 'Neurology', c: 400000, l: 5, col: 0x8e7cc3 }, dialysis: { n: 'Dialysis', c: 380000, l: 5, col: 0x4a90a4 }, mri: { n: 'MRI', c: 900000, l: 5, col: 0x6b8fb3 },
  research: { n: 'Research Lab', c: 500000, l: 6, col: 0x7bbf8e }, college: { n: 'Medical College', c: 600000, l: 6, col: 0xc9a66b }, intl: { n: 'International Lounge', c: 800000, l: 7, col: 0xd4af37 },
};
export const FLOORS = [{ n: 'Ground floor', c: 0, l: 1 }, { n: 'First floor', c: 300000, l: 2 }, { n: 'Second floor', c: 500000, l: 3 }, { n: 'Third floor', c: 700000, l: 4 }, { n: 'Fourth floor', c: 900000, l: 5 }];
// name, hire fee, monthly salary, uniform colour
export const STAFF = {
  doc: ['Doctor', 12000, 8000, 0xffffff], nurse: ['Nurse', 12000, 4000, 0x4ec9c0], tech: ['Technician', 8000, 4000, 0x9b7bd6],
  recep: ['Receptionist', 6000, 3000, 0xf0a04b], hk: ['Housekeeping', 4000, 2000, 0x8aa0b4], pharm: ['Pharmacist', 10000, 5000, 0x4caf7a],
};
export const LEVELS = [
  { n: 'Small Clinic' }, { n: 'Basic Hospital', pat: 12, rep: 55 }, { n: 'General Hospital', pat: 40, rep: 65 },
  { n: 'Multi-Speciality Hospital', pat: 100, rep: 75 }, { n: 'Super-Speciality Hospital', pat: 250, rep: 85 },
  { n: 'Teaching & Research Hospital', pat: 500, rep: 90 }, { n: 'International Medical Centre', pat: 1000, rep: 95 },
];
export const MAX_PLAYABLE_LEVEL = 7;
// Player career: higher tier = higher consultation fee and more patients (load).
export const TIERS = [
  { n: 'MBBS', fee: 1, load: 1 },
  { n: 'Post-graduate (MD/MS)', fee: 1.5, load: 1.4, cost: 60000, days: 10 },
  { n: 'Specialization', fee: 2.2, load: 1.9, cost: 120000, days: 14 },
  { n: 'Super-specialization', fee: 3.5, load: 2.6, cost: 250000, days: 20 },
];
export const FIELDS = {
  medicine: { n: 'Medicine', d: ['MD General Medicine', 'Fellowship in Critical Care', 'DM Cardiology'] },
  surgery: { n: 'Surgery', d: ['MS General Surgery', 'Fellowship in Laparoscopic Surgery', 'MCh Cardiothoracic Surgery'] },
  ortho: { n: 'Orthopaedics', d: ['MS Orthopaedics', 'Fellowship in Joint Replacement', 'MCh Orthopaedics'] },
  gyn: { n: 'Obstetrics & Gynaecology', d: ['MS Obs & Gynae', 'Fellowship in Maternal-Fetal Medicine', 'MCh Reproductive Medicine'] },
};
export const SWATCH = {
  wall: [0xe9eef2, 0xf3e6d0, 0xd7eadf, 0xdce6f5, 0xf0d9d9],
  floor: [0xdfe6ea, 0xcfc8b8, 0xb9d3c5, 0x9aa5b1],
  ext: [0xe9eef2, 0xc9b79c, 0xa7c4d9, 0xd9a7a7],
};
export const degree = (S) => (S.tier ? FIELDS[S.field].d[S.tier - 1] : 'MBBS');
export const hex = (n) => '#' + n.toString(16).padStart(6, '0');
export const F = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
export const LIFT = { c: 150000, l: 2 };
export const EQUIP = { ecg: { n: 'ECG machine', c: 40000, l: 1 } };
// Daily income per built department (x patient load; x0.4 if no matching staff; +25% after your ward round). Staff role needed:
export const DEPT = { ward: { inc: 1500, staff: 'nurse' }, er: { inc: 6000, staff: 'nurse' }, icu: { inc: 12000, staff: 'nurse' }, cardio: { inc: 7000, staff: 'doc' }, maternity: { inc: 9000, staff: 'nurse' },
  neuro: { inc: 10000, staff: 'doc' }, dialysis: { inc: 8000, staff: 'tech' }, mri: { inc: 6000, staff: 'tech' }, research: { inc: 3000, staff: 'doc' }, college: { inc: 5000, staff: 'doc' }, intl: { inc: 15000, staff: 'recep' } };
