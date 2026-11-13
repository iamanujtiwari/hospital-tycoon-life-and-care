// FICTIONAL game data: cases, tests, formulary. Report wording imitates real lab/radiology reports for realism.
// This is game logic, not medical advice. Edit freely; add images in public/images (see README).
export const QS = [['dur', 'How long has this been going on?'], ['assoc', 'Any other symptoms?'], ['past', 'Past illnesses or surgeries?'], ['meds', 'What medicines do you take?'], ['allergy', 'Any drug allergies?'], ['family', 'Any illness in the family?']];
export const TESTS = {
  cbc: { n: 'Complete blood count', room: 'lab', price: 350, type: 'lab' }, crp: { n: 'C-reactive protein', room: 'lab', price: 450, type: 'lab' },
  fbs: { n: 'Fasting blood glucose', room: 'lab', price: 120, type: 'lab' }, hba1c: { n: 'HbA1c', room: 'lab', price: 550, type: 'lab' },
  kft: { n: 'Kidney function (creatinine, urea)', room: 'lab', price: 600, type: 'lab' }, lipid: { n: 'Lipid profile', room: 'lab', price: 700, type: 'lab' },
  urine: { n: 'Urine routine & microscopy', room: 'lab', price: 200, type: 'lab' }, ecg: { n: 'ECG (12-lead)', equip: 'ecg', price: 400, type: 'img' },
  cxr: { n: 'X-ray chest PA', room: 'xray', price: 600, type: 'img' }, xrf: { n: 'X-ray forearm AP/lateral', room: 'xray', price: 700, type: 'img' },
  usg: { n: 'Ultrasound (abdomen / obstetric)', room: 'usg', price: 1800, type: 'img' }, cth: { n: 'CT head (plain)', room: 'ct', price: 5500, type: 'img' },
  echo: { n: 'Echocardiogram', room: 'cardio', price: 2500, type: 'img' }, mri: { n: 'MRI lumbar spine', room: 'mri', price: 7500, type: 'img' },
};
export const DRUGS = {
  pcm: { n: 'Paracetamol', doses: ['500 mg', '650 mg'], price: 20 }, ibu: { n: 'Ibuprofen', doses: ['200 mg', '400 mg'], price: 30 },
  azm: { n: 'Azithromycin', doses: ['250 mg', '500 mg'], price: 90 }, dox: { n: 'Doxycycline', doses: ['100 mg'], price: 60 },
  amox: { n: 'Amoxicillin', doses: ['500 mg'], price: 70, cls: 'penicillin' }, amxc: { n: 'Amoxicillin-clavulanate', doses: ['625 mg'], price: 180, cls: 'penicillin' },
  met: { n: 'Metformin', doses: ['500 mg', '850 mg'], price: 40 }, aml: { n: 'Amlodipine', doses: ['2.5 mg', '5 mg', '10 mg'], price: 35 },
  tel: { n: 'Telmisartan', doses: ['40 mg'], price: 80 }, nit: { n: 'Nitrofurantoin', doses: ['100 mg'], price: 75 },
  fe: { n: 'Ferrous ascorbate + folic acid', doses: ['100 mg + 1.5 mg'], price: 60 }, ppi: { n: 'Pantoprazole', doses: ['40 mg'], price: 55 },
  ant: { n: 'Antacid gel', doses: ['10 mL'], price: 45 }, suma: { n: 'Sumatriptan', doses: ['50 mg'], price: 140 }, dro: { n: 'Drotaverine', doses: ['40 mg'], price: 50 },
  asp: { n: 'Aspirin', doses: ['75 mg', '150 mg'], price: 15 }, ator: { n: 'Atorvastatin', doses: ['10 mg', '20 mg', '40 mg'], price: 60 }, gtn: { n: 'Glyceryl trinitrate', doses: ['0.5 mg sublingual'], price: 40 },
  tcl: { n: 'Thiocolchicoside', doses: ['4 mg'], price: 45 }, fa: { n: 'Folic acid', doses: ['5 mg'], price: 25 },
};
export const FREQ = ['Once daily', 'Twice daily', 'Three times daily', 'At night', 'Only when needed (max 3/day)'];
export const DAYS = [3, 5, 7, 14, 30];
export const NAMES = { M: ['Rahul', 'Amit', 'Vikram', 'Suresh', 'Arjun', 'Karan', 'Imran', 'Mohan'], F: ['Priya', 'Anjali', 'Sunita', 'Neha', 'Kavya', 'Fatima', 'Meena', 'Pooja'], L: ['Sharma', 'Verma', 'Singh', 'Khan', 'Patel', 'Gupta', 'Reddy', 'Nair'] };

const lab = (title, rows) => ({ kind: 'lab', title, rows });
const img = (title, tech, findings, impression) => ({ kind: 'img', title, tech, findings, impression });
const R = (n, v, u, ref, f) => [n, v, u, ref, f || ''];
const hb = (p, v, f) => R('Haemoglobin', v, 'g/dL', p.sex == 'M' ? '13.0–17.0' : '12.0–15.0', f);
const NORMAL = {
  cbc: (p) => lab('Complete Blood Count', [hb(p, p.sex == 'M' ? '14.6' : '13.2'), R('Total WBC count', '7.2', '×10³/µL', '4.0–11.0'), R('Neutrophils', '58', '%', '40–75'), R('Lymphocytes', '33', '%', '20–45'), R('Platelet count', '265', '×10³/µL', '150–410'), R('MCV', '88', 'fL', '83–101')]),
  crp: () => lab('C-Reactive Protein', [R('CRP', '3', 'mg/L', '< 5')]),
  fbs: () => lab('Fasting Plasma Glucose', [R('Fasting plasma glucose', '92', 'mg/dL', '70–99')]),
  hba1c: () => lab('Glycated Haemoglobin', [R('HbA1c', '5.3', '%', '< 5.7')]),
  kft: () => lab('Kidney Function Test', [R('Serum creatinine', '0.9', 'mg/dL', '0.6–1.2'), R('Blood urea', '24', 'mg/dL', '15–40')]),
  lipid: () => lab('Lipid Profile', [R('Total cholesterol', '172', 'mg/dL', '< 200'), R('LDL cholesterol', '98', 'mg/dL', '< 100'), R('HDL cholesterol', '52', 'mg/dL', '> 40'), R('Triglycerides', '120', 'mg/dL', '< 150')]),
  urine: () => lab('Urine Routine & Microscopy', [R('Appearance', 'Pale yellow, clear', '', ''), R('Protein', 'Nil', '', 'Nil'), R('Glucose', 'Nil', '', 'Nil'), R('Pus cells', '1–2', '/hpf', '0–5'), R('RBC', 'Nil', '/hpf', '0–2'), R('Nitrite', 'Negative', '', 'Negative')]),
  ecg: () => img('12-lead ECG', 'Resting 12-lead ECG, 25 mm/s, 10 mm/mV.', 'Sinus rhythm, rate 74/min. Normal axis. PR 160 ms, QRS 88 ms, QTc 420 ms. No ST–T changes.', 'Normal ECG.'),
  cxr: () => img('X-ray Chest PA', 'PA view, erect, adequate inspiration.', 'Lung fields are clear. Cardiac silhouette normal in size (CTR < 50%). Costophrenic angles sharp. No pleural effusion or pneumothorax. Bony thorax intact.', 'No acute cardiopulmonary abnormality.'),
  xrf: () => img('X-ray Forearm AP/Lateral', 'AP and lateral views including wrist and elbow.', 'No fracture or dislocation. Joint spaces preserved. Soft tissues unremarkable.', 'No bony injury.'),
  usg: () => img('Ultrasound Abdomen', 'Transabdominal, curvilinear probe, fasting.', 'Liver normal in size and echotexture. Gallbladder normally distended, wall thin, no calculi. CBD 4 mm. Pancreas, spleen and both kidneys normal. No free fluid.', 'Normal ultrasound abdomen.'),
  echo: () => img('Echocardiogram', 'Transthoracic, parasternal and apical windows.', 'Normal chamber sizes. LVEF 60%. No regional wall motion abnormality. Normal valves. No pericardial effusion.', 'Normal echocardiogram.'),
  mri: () => img('MRI Lumbar Spine', 'Sagittal and axial T1/T2 sequences.', 'Normal vertebral alignment and marrow signal. Discs well hydrated. No canal stenosis or root compression. Conus normal.', 'Normal MRI lumbar spine.'),
  cth: () => img('CT Head (plain)', 'Axial 5 mm sections, plain study.', 'No acute intracranial haemorrhage, mass effect or midline shift. Ventricles and sulci normal for age. Grey–white differentiation preserved. Calvarium, orbits and paranasal sinuses unremarkable.', 'Normal CT head.'),
};
const mk = (id, dx, dxOpts, complaint, hx, vit, exam, o) => ({ id, dx, dxOpts, complaint, hx, vit, exam, age: [20, 65], needs: [], ok: [], tests: {}, ...o });
export const CASES = [
  mk('cap', 'Community-acquired pneumonia', ['Community-acquired pneumonia', 'Acute bronchitis', 'Pulmonary tuberculosis', 'Asthma exacerbation'],
    'Fever and cough with yellow sputum for 4 days; right-sided chest pain on deep breathing.',
    { dur: '4 days, getting worse.', assoc: 'Fever with chills, tiredness. No blood in sputum.', past: 'Nothing significant.', meds: 'Only paracetamol at home.', allergy: 'Yes, I got a rash after penicillin once.', family: 'Nothing significant.' },
    ['118/76', 104, 38.9, 24, 93], 'Crackles and bronchial breathing over the right lower zone.',
    { allergy: 'penicillin', needs: ['cxr'], ok: ['azm', 'dox', 'pcm'], tests: {
      cbc: (p) => lab('Complete Blood Count', [hb(p, '13.5'), R('Total WBC count', '16.8', '×10³/µL', '4.0–11.0', 'H'), R('Neutrophils', '84', '%', '40–75', 'H'), R('Lymphocytes', '10', '%', '20–45', 'L'), R('Platelet count', '320', '×10³/µL', '150–410')]),
      crp: () => lab('C-Reactive Protein', [R('CRP', '86', 'mg/L', '< 5', 'H')]),
      cxr: () => img('X-ray Chest PA', 'PA view, erect, adequate inspiration.', 'Homogeneous airspace opacity (consolidation) in the right lower zone with air bronchograms. Right costophrenic angle preserved; no pleural effusion. Heart size normal. Left lung clear.', 'Right lower zone consolidation, consistent with lobar pneumonia. Clinical correlation advised.') } }),
  mk('t2dm', 'Type 2 diabetes mellitus', ['Type 2 diabetes mellitus', 'Diabetes insipidus', 'Urinary tract infection', 'Hyperthyroidism'],
    'Increased thirst, frequent urination and tiredness for two months.',
    { dur: 'About 2 months.', assoc: 'Weight loss of 3 kg, blurred vision at times. No fever.', past: 'None.', meds: 'None.', allergy: 'No known drug allergies.', family: 'My father has diabetes.' },
    ['132/84', 82, 36.8, 16, 98], 'BMI 29. Dry mouth. No foot ulcers. Chest and abdomen normal.',
    { needs: ['fbs'], ok: ['met'], age: [35, 65], tests: {
      fbs: () => lab('Fasting Plasma Glucose', [R('Fasting plasma glucose', '168', 'mg/dL', '70–99', 'H')]),
      hba1c: () => lab('Glycated Haemoglobin', [R('HbA1c', '8.4', '%', '< 5.7', 'H')]),
      urine: () => lab('Urine Routine & Microscopy', [R('Appearance', 'Pale yellow, clear', '', ''), R('Protein', 'Nil', '', 'Nil'), R('Glucose', '++', '', 'Nil', 'H'), R('Ketones', 'Negative', '', 'Negative'), R('Pus cells', '1–2', '/hpf', '0–5')]), kft: 0 } }),
  mk('htn', 'Essential hypertension', ['Essential hypertension', 'Migraine', 'Anxiety disorder', 'Hyperthyroidism'],
    'Morning headaches and occasional dizziness; blood pressure was high at a pharmacy.',
    { dur: 'A few months.', assoc: 'No chest pain or breathlessness. Sometimes dizzy.', past: 'None known.', meds: 'None.', allergy: 'No known drug allergies.', family: 'Mother had high blood pressure.' },
    ['168/102', 78, 36.7, 16, 98], 'Regular pulse. Heart sounds normal. No ankle swelling.',
    { needs: ['kft'], ok: ['aml', 'tel'], age: [40, 70], tests: {
      kft: 0, lipid: () => lab('Lipid Profile', [R('Total cholesterol', '238', 'mg/dL', '< 200', 'H'), R('LDL cholesterol', '156', 'mg/dL', '< 100', 'H'), R('HDL cholesterol', '41', 'mg/dL', '> 40'), R('Triglycerides', '190', 'mg/dL', '< 150', 'H')]),
      ecg: () => img('12-lead ECG', 'Resting 12-lead ECG, 25 mm/s, 10 mm/mV.', 'Sinus rhythm, rate 78/min. Increased QRS voltage (S in V1 + R in V5 = 41 mm). ST–T changes of left ventricular strain in V5–V6.', 'Left ventricular hypertrophy by voltage criteria.') } }),
  mk('uti', 'Urinary tract infection', ['Urinary tract infection', 'Kidney stone', 'Diabetes mellitus', 'Vaginal candidiasis'],
    'Burning while passing urine with frequent urgency for 3 days.',
    { dur: '3 days.', assoc: 'Lower abdominal discomfort. Mild fever last night. No back pain.', past: 'One similar episode last year.', meds: 'None.', allergy: 'No known drug allergies.', family: 'Nothing significant.' },
    ['112/72', 88, 37.6, 16, 99], 'Mild suprapubic tenderness. No renal angle tenderness.',
    { sex: 'F', age: [20, 45], needs: ['urine'], ok: ['nit', 'pcm'], tests: {
      urine: () => lab('Urine Routine & Microscopy', [R('Appearance', 'Hazy', '', ''), R('Protein', 'Trace', '', 'Nil', 'H'), R('Glucose', 'Nil', '', 'Nil'), R('Pus cells', '20–25', '/hpf', '0–5', 'H'), R('RBC', '3–5', '/hpf', '0–2', 'H'), R('Nitrite', 'Positive', '', 'Negative', 'H'), R('Bacteria', 'Many', '', 'Nil', 'H')]),
      cbc: (p) => lab('Complete Blood Count', [hb(p, '12.9'), R('Total WBC count', '11.6', '×10³/µL', '4.0–11.0', 'H'), R('Neutrophils', '72', '%', '40–75')]) } }),
  mk('radius', 'Distal radius fracture', ['Distal radius fracture', 'Wrist sprain', 'Scaphoid fracture', 'Carpal tunnel syndrome'],
    'Fell on an outstretched hand this morning; wrist pain and swelling.',
    { dur: 'Since this morning.', assoc: 'Cannot grip. No numbness. No head injury.', past: 'None.', meds: 'None.', allergy: 'No known drug allergies.', family: 'Nothing significant.' },
    ['124/80', 92, 36.9, 16, 99], 'Swelling, tenderness and deformity over the distal radius. Fingers warm, sensation and capillary refill normal.',
    { needs: ['xrf'], ok: ['pcm', 'ibu'], tests: {
      xrf: () => img('X-ray Forearm AP/Lateral', 'AP and lateral views including wrist.', 'Transverse fracture of the distal radial metaphysis about 2 cm proximal to the wrist joint, with dorsal angulation and mild dorsal displacement of the distal fragment. Ulnar styloid intact. Radiocarpal alignment maintained. Adjacent soft-tissue swelling.', 'Distal radius fracture (Colles-type pattern). Orthopaedic review advised.') } }),
  mk('ida', 'Iron-deficiency anaemia', ['Iron-deficiency anaemia', 'Vitamin B12 deficiency anaemia', 'Thalassaemia trait', 'Hypothyroidism'],
    'Tiredness and breathlessness on climbing stairs for several weeks; looks pale.',
    { dur: 'About 6 weeks.', assoc: 'Heavy periods, hair fall. No black stools.', past: 'None.', meds: 'None.', allergy: 'No known drug allergies.', family: 'Nothing significant.' },
    ['104/66', 96, 36.8, 18, 98], 'Pallor of conjunctivae and nail beds. Soft systolic flow murmur.',
    { sex: 'F', age: [18, 45], needs: ['cbc'], ok: ['fe'], tests: {
      cbc: (p) => lab('Complete Blood Count', [hb(p, '8.1', 'L'), R('Total WBC count', '6.8', '×10³/µL', '4.0–11.0'), R('Platelet count', '395', '×10³/µL', '150–410'), R('MCV', '66', 'fL', '83–101', 'L'), R('MCH', '20.8', 'pg', '27–32', 'L'), R('RDW', '18.2', '%', '11.5–14.5', 'H'), R('Peripheral smear', 'Microcytic hypochromic RBCs, pencil cells', '', '')]) } }),
  mk('gerd', 'Gastro-oesophageal reflux disease', ['Gastro-oesophageal reflux disease', 'Cholelithiasis', 'Acute pancreatitis', 'Angina pectoris'],
    'Burning pain in the upper abdomen after meals with a sour taste in the mouth.',
    { dur: 'About 3 weeks.', assoc: 'Worse when lying down. No vomiting, black stools or weight loss.', past: 'None.', meds: 'Occasional antacid.', allergy: 'No known drug allergies.', family: 'Nothing significant.' },
    ['120/78', 76, 36.8, 16, 99], 'Mild epigastric tenderness. No guarding. Normal bowel sounds.', { ok: ['ppi', 'ant'], tests: { cbc: 0 } }),
  mk('migraine', 'Migraine without aura', ['Migraine without aura', 'Tension-type headache', 'Subarachnoid haemorrhage', 'Sinusitis'],
    'Recurring throbbing headache on one side with nausea and sensitivity to light.',
    { dur: 'Episodes for 2 years, this one since yesterday.', assoc: 'Nausea and dislike of bright light. No fever, weakness or vision loss.', past: 'None.', meds: 'Paracetamol, partial relief.', allergy: 'No known drug allergies.', family: 'Mother has similar headaches.' },
    ['116/74', 72, 36.8, 16, 99], 'Neurological examination normal. No neck stiffness. Fundi normal.', { age: [20, 50], ok: ['pcm', 'ibu', 'suma'] }),
  mk('gall', 'Symptomatic gallstones (cholelithiasis)', ['Symptomatic gallstones (cholelithiasis)', 'Acute hepatitis', 'Peptic ulcer disease', 'Acute appendicitis'],
    'Pain in the upper right abdomen after fatty meals, with nausea.',
    { dur: '3 months, episodes lasting an hour or two.', assoc: 'Nausea after oily food. No fever or jaundice.', past: 'None.', meds: 'None.', allergy: 'No known drug allergies.', family: 'Sister had gallbladder surgery.' },
    ['126/80', 80, 37.0, 16, 99], 'Mild right upper quadrant tenderness. Murphy sign negative. No jaundice.',
    { age: [30, 60], needs: ['usg'], ok: ['pcm', 'dro'], tests: {
      cbc: 0, usg: () => img('Ultrasound Abdomen', 'Transabdominal, curvilinear probe, fasting.', 'Multiple echogenic foci with posterior acoustic shadowing within the gallbladder lumen (largest 11 mm), mobile on change of position. Gallbladder wall 2 mm. No pericholecystic fluid. CBD 4 mm. Liver, pancreas, spleen and kidneys normal.', 'Cholelithiasis without features of acute cholecystitis. Surgical opinion advised.') } }),
  mk('viral', 'Viral fever (upper respiratory tract infection)', ['Viral fever (upper respiratory tract infection)', 'Bacterial pneumonia', 'Dengue fever', 'Typhoid fever'],
    'Fever, body aches and sore throat for 2 days.',
    { dur: '2 days.', assoc: 'Runny nose, mild cough, body aches. No breathlessness or rash.', past: 'None.', meds: 'None.', allergy: 'No known drug allergies.', family: 'Colleagues have similar illness.' },
    ['114/72', 92, 38.4, 18, 98], 'Congested throat, no exudate. Chest clear. No rash.',
    { ok: ['pcm'], tests: { cbc: (p) => lab('Complete Blood Count', [hb(p, p.sex == 'M' ? '14.2' : '12.8'), R('Total WBC count', '5.4', '×10³/µL', '4.0–11.0'), R('Neutrophils', '48', '%', '40–75'), R('Lymphocytes', '44', '%', '20–45'), R('Platelet count', '230', '×10³/µL', '150–410')]) } }),
  mk('angina', 'Stable angina (coronary artery disease)', ['Stable angina (coronary artery disease)', 'Gastro-oesophageal reflux disease', 'Costochondritis', 'Anxiety disorder'],
    'Chest tightness on climbing stairs for 3 weeks, relieved by rest.',
    { dur: '3 weeks, only on exertion.', assoc: 'Mild breathlessness. No pain at rest. No fainting.', past: 'High cholesterol; smoked for 20 years.', meds: 'None.', allergy: 'No known drug allergies.', family: 'Father had a heart attack at 58.' },
    ['138/88', 80, 36.8, 16, 97], 'Heart sounds normal, no murmurs. Chest clear. No ankle swelling.',
    { age: [45, 70], needs: ['ecg'], ok: ['asp', 'ator', 'gtn'], tests: {
      ecg: () => img('12-lead ECG', 'Resting 12-lead ECG, 25 mm/s, 10 mm/mV.', 'Sinus rhythm, rate 80/min. Horizontal ST depression of 1 mm in V5–V6. No Q waves. Normal intervals.', 'Non-specific ST–T changes; suggest correlation with symptoms and further cardiac evaluation.'),
      lipid: () => lab('Lipid Profile', [R('Total cholesterol', '246', 'mg/dL', '< 200', 'H'), R('LDL cholesterol', '168', 'mg/dL', '< 100', 'H'), R('HDL cholesterol', '38', 'mg/dL', '> 40', 'L'), R('Triglycerides', '210', 'mg/dL', '< 150', 'H')]),
      echo: () => img('Echocardiogram', 'Transthoracic, parasternal and apical windows.', 'Normal chamber sizes. LVEF 55%. No resting regional wall motion abnormality. Mild LV diastolic dysfunction. Normal valves.', 'Preserved LV systolic function at rest.') } }),
  mk('disc', 'Lumbar disc prolapse', ['Lumbar disc prolapse', 'Muscle strain', 'Ankylosing spondylitis', 'Renal colic'],
    'Low back pain spreading down the left leg for 2 weeks.',
    { dur: '2 weeks, started after lifting a heavy box.', assoc: 'Tingling in the left foot. No bladder or bowel problems. No fever.', past: 'None.', meds: 'Pain tablets with mild relief.', allergy: 'No known drug allergies.', family: 'Nothing significant.' },
    ['126/82', 78, 36.8, 16, 99], 'Tenderness at L4–L5. Straight-leg raise positive at 40° on the left. Power and reflexes normal.',
    { age: [28, 55], needs: ['mri'], ok: ['pcm', 'ibu', 'tcl'], tests: {
      mri: () => img('MRI Lumbar Spine', 'Sagittal and axial T1/T2 sequences.', 'L4–L5 left posterolateral disc protrusion indenting the traversing left L5 nerve root with mild lateral recess narrowing. Other discs well hydrated. Conus normal. No canal stenosis.', 'L4–L5 left posterolateral disc protrusion with L5 root compression. Clinical correlation advised.') } }),
  mk('preg', 'Normal pregnancy (antenatal visit)', ['Normal pregnancy (antenatal visit)', 'Ectopic pregnancy', 'Urinary tract infection', 'Iron-deficiency anaemia'],
    'Missed period for 10 weeks with morning nausea; first antenatal visit.',
    { dur: '10 weeks since the last period.', assoc: 'Morning nausea and tiredness. No bleeding or severe pain.', past: 'None.', meds: 'None.', allergy: 'No known drug allergies.', family: 'Nothing significant.' },
    ['110/70', 84, 36.8, 16, 99], 'Abdomen soft and non-tender. Uterus not palpable abdominally.',
    { sex: 'F', age: [20, 36], needs: ['usg'], ok: ['fa', 'fe'], tests: { cbc: 0,
      usg: () => img('Ultrasound Obstetric (early pregnancy)', 'Transabdominal, full bladder.', 'Single intrauterine gestational sac with a live embryo, crown–rump length 33 mm (about 9 weeks 6 days). Fetal cardiac activity present, 168/min. No subchorionic haematoma. Adnexa normal.', 'Single live intrauterine pregnancy of about 10 weeks.') } }),
];
export const DXLIST = [...new Set(CASES.flatMap((c) => c.dxOpts))].sort();
export function makeReport(t, p) {
  const o = p.case.tests[t], f = typeof o == 'function', r = (f ? o : NORMAL[t])(p);
  r.id = t; r.img = TESTS[t].type == 'img' ? `images/${t}_${f ? p.case.id : 'normal'}.jpg` : null; return r;
}
const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
export function evaluate(p, pl) {
  const c = p.case, L = []; let s = 35;
  if (norm(pl.dx) == norm(c.dx)) { s += 30; L.push(['ok', 'Diagnosis correct: ' + c.dx]) } else L.push(['bad', `Diagnosis "${pl.dx || 'not written'}" is not correct. Expected: ${c.dx}`]);
  const kx = Object.keys(XF[c.id] || {}); if (kx.length) { if ((pl.examined || []).some((a) => kx.includes(a))) { s += 5; L.push(['ok', 'Examined the relevant body area.']) } else { s -= 5; L.push(['bad', 'You did not examine the relevant body area.']) } }
  const ord = p.ordered || [];
  c.needs.forEach((t) => { if (ord.includes(t)) { s += 10; L.push(['ok', 'Key test ordered: ' + TESTS[t].n]) } else { s -= 10; L.push(['bad', 'Key test missed: ' + TESTS[t].n]) } });
  const extra = ord.filter((t) => !c.needs.includes(t) && !(t in c.tests)); if (extra.length) { s -= 4 * extra.length; L.push(['bad', 'Unnecessary tests (cost to patient): ' + extra.map((t) => TESTS[t].n).join(', ')]) }
  let good = 0; pl.rx.forEach((r) => {
    const d = DRUGS[r.drug];
    if (c.allergy && d.cls == c.allergy) { s -= 35; L.push(['bad', `DANGEROUS: ${d.n} prescribed but the patient is allergic to ${c.allergy}.`]) }
    else if (c.ok.includes(r.drug)) { good++; s += 8; L.push(['ok', `Appropriate: ${d.n} ${r.dose}, ${r.freq.toLowerCase()} for ${r.days} days`]) }
    else { s -= 12; L.push(['bad', `Not indicated for this diagnosis: ${d.n}`]) }
  });
  if (!good && !pl.rx.length && c.ok.length) { s -= 15; L.push(['bad', 'No treatment prescribed.']) }
  if (pl.asked.length >= 3) { s += 5; L.push(['ok', 'Good history taking.']) } else L.push(['bad', 'History was too brief (ask at least 3 questions).']);
  if (c.allergy && !pl.asked.includes('allergy')) L.push(['bad', 'You never asked about drug allergies.']);
  return { score: Math.max(0, Math.min(100, s)), lines: L };
}
// Protocol choices at the radiology PC: [correct, wrong, wrong]
export const PROTO = {
  cxr: ['PA erect, full inspiration', 'AP supine, held expiration', 'Lateral decubitus only'], xrf: ['AP and lateral including the wrist', 'Single oblique view only', 'Skyline view'],
  usg: ['Correct probe, fasting or full bladder as needed', 'High-frequency probe, no preparation', 'Skip patient identification'], cth: ['Axial plain study, 5 mm sections', 'Contrast study without indication', 'Coronal only, no head support'],
  mri: ['Sagittal + axial T1/T2, implants screened', 'Skip implant screening', 'Gradient-echo only'], echo: ['Parasternal + apical windows, ECG leads on', 'Subcostal view only', 'No ECG leads'],
};
// Examination findings by body area (click the body diagram in the Doctor PC). Anything not listed is normal.
const XN = { head: 'No pallor, jaundice or lymph nodes. Throat clear. Pupils equal and reactive.', heart: 'Heart sounds S1 and S2 normal. No murmurs. Regular rhythm.', lungs: 'Vesicular breath sounds bilaterally. No added sounds.', abd: 'Soft and non-tender. No organomegaly. Bowel sounds present.', arms: 'Radial pulse regular, normal volume. Capillary refill < 2 s. No swelling.', legs: 'No oedema. Pedal pulses palpable. Power and sensation normal.', back: 'No spinal tenderness. Normal range of movement.' };
export const AREAS = { head: 'Head, eyes & throat', heart: 'Heart (auscultation)', lungs: 'Lungs (auscultation)', abd: 'Abdomen (palpation)', arms: 'Arms & pulse', legs: 'Legs', back: 'Back & spine' };
const XF = {
  cap: { lungs: 'Bronchial breathing and coarse crackles at the right base. Dull percussion note over the right lower zone.', heart: 'Tachycardia, regular. No murmur.', head: 'Throat mildly congested. Flushed face.' },
  t2dm: { head: 'Dry mucous membranes.', legs: 'Foot pulses present. Monofilament sensation intact. No ulcers.', abd: 'Soft, non-tender. Central obesity (BMI 29).' },
  htn: { heart: 'Regular rhythm, loud S2, no murmur. Apex beat not displaced.', head: 'Fundi: mild arteriolar narrowing.', legs: 'No pedal oedema.' },
  uti: { abd: 'Mild suprapubic tenderness. No renal angle tenderness. No guarding.' },
  radius: { arms: 'Swelling, tenderness and deformity at the distal radius. Capillary refill and sensation normal.' },
  ida: { head: 'Conjunctival pallor. Smooth tongue.', arms: 'Pale nail beds. Pulse 96, regular.', heart: 'Soft systolic flow murmur.' },
  gerd: { abd: 'Mild epigastric tenderness. No guarding or rebound.' },
  migraine: { head: 'Photophobia. No neck stiffness. Cranial nerves intact. Fundi normal.' },
  gall: { abd: 'Right upper quadrant tenderness. Murphy sign negative. No jaundice.' },
  viral: { head: 'Congested throat, no exudate. Tender cervical nodes.', lungs: 'Clear.' },
  angina: { heart: 'Normal heart sounds. No murmurs. No carotid bruit.', lungs: 'Clear.', legs: 'No oedema.' },
  disc: { back: 'Tenderness at L4–L5 with paraspinal spasm. Straight-leg raise positive at 40° on the left.', legs: 'Power 5/5. Reflexes normal. Reduced sensation over the left lateral foot.' },
  preg: { abd: 'Soft. Uterus not palpable abdominally.', heart: 'Normal heart sounds.' },
};
export const finding = (c, a) => (XF[c.id] && XF[c.id][a]) || XN[a];
export const DXCODE = { 'Community-acquired pneumonia': 'J18.9', 'Type 2 diabetes mellitus': 'E11.9', 'Essential hypertension': 'I10', 'Urinary tract infection': 'N39.0', 'Distal radius fracture': 'S52.5', 'Iron-deficiency anaemia': 'D50.9', 'Gastro-oesophageal reflux disease': 'K21.9', 'Migraine without aura': 'G43.0', 'Symptomatic gallstones (cholelithiasis)': 'K80.2', 'Viral fever (upper respiratory tract infection)': 'J06.9', 'Stable angina (coronary artery disease)': 'I25.1', 'Lumbar disc prolapse': 'M51.2', 'Normal pregnancy (antenatal visit)': 'Z34.0' };
