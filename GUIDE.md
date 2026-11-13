# Hospital Tycoon: Life & Care — Step-by-step guide

> Version 3 adds a story, staff resumes, recruitment, department PCs and Levels 4–7. See "13. Version 3" at the end; where it differs from earlier sections, it wins.

The game also shows these steps in the bottom-left "STEP n / 18" panel and advances automatically.

## 0. Run it
1. Install Node.js 18+.
2. In the project folder: delete the old `package-lock.json`, then `npm install`, then `npm run dev`.
3. Open http://localhost:5173 and click **Click to start**.

Controls: **WASD** move · **Shift** run · **mouse** look · **E** interact · **V** first/third person · **Esc** leave a screen · **1–4** pick a floor in the lift.
Progress autosaves every in-game day (about 15 seconds). Overview tab → Reset game starts over.

## 1. Buy the clinic
You start with ₹2,50,000 on the street. Walk across the parking lot to the **FOR SALE** sign, press **E** (₹1,50,000). The doors open, the lobby is furnished (reception desk, chairs, plants, vending machine, TV), the OPD room is built, and the **management PC** appears on the right wall. Your 6 starting staff walk in from the road: doctor, 2 nurses, receptionist, technician, housekeeper.

## 2. Look around the management PC (E at the desk)
Tabs: **Overview** (money, reputation, cases, developer tools) · **Staff** (hire/fire) · **Construction** (lift, floors, bays) · **Equipment** (ECG) · **Career** (degrees) · **Billing** (recent bills) · **Customize** (paint) · **Roadmap**.
Stand up with the button or Esc.

## 3. Start OPD duty (you are the doctor)
Go to the OPD room (first bay, left end of the lobby wall). Near the desk press **E** → **Start OPD duty (Doctor PC)**. You sit at the desk and the Doctor PC opens. Your staff doctor moves out of the room.

## 4. Treat a patient (the core loop)
Patients arrive from the road, register at reception (₹900), wait in the lobby, then queue for you. In the Doctor PC:
1. **Call in** a waiting patient.
2. **History**: ask questions (duration, other symptoms, past illness, medicines, **allergies**, family). Ask at least 3.
3. **Examination**: vitals (BP, pulse, temperature, breathing rate, SpO₂) and the examination findings.
4. **Tests**: tick the tests you want and press **Order**. Needs: Laboratory (blood, urine), X-ray, Ultrasound, CT, or the ECG machine.
   - ECG is done at your desk: the report appears at once.
   - Other tests send the patient to that department. You get a notification when the report is ready and the patient returns to the queue marked "reports ready".
5. **Reports**: lab tables show results with H/L flags and reference ranges. Imaging shows Technique, Findings and Impression. (Add your own images, see below.)
6. **Diagnosis & Rx**: type the exact diagnosis (suggestions appear), add medicines (drug, dose, frequency, days), add notes, press **Finalize**.
7. You see a score breakdown. The patient goes to the pharmacy, then reception pays the bill.

Scoring (max 100): correct diagnosis +30, each key test +10 (missed −10), unnecessary tests −4 each, appropriate medicine +8, wrong medicine −12, a drug the patient is allergic to −35, no treatment −15, good history +5. Score moves reputation: (score − 60) ÷ 100 per patient.

If you are not on duty, patients wait up to ~15 seconds, then your staff doctor handles them automatically (lower quality, no tests).

## 5. Pharmacy and billing
- Pharmacy bay built + **Pharmacist** hired: medicines are dispensed automatically after 3 seconds.
- No pharmacist: patients wait at the counter; press **E** at the counter and **Dispense & bill** yourself (they leave unserved after 45 seconds).
- Bill = registration ₹900 + consultation (₹1,400 × your fee multiplier) + tests + medicines (price × days). See Billing tab.

## 6. Levels
| Level | Needs | Unlocks |
| --- | --- | --- |
| 1 Small Clinic | start | Reception, OPD, ECG |
| 2 Basic Hospital | 12 patients, reputation 55 | Lab, Pharmacy, Ward, Ultrasound, lift, first floor |
| 3 General Hospital | 40 patients, reputation 65 | X-ray, CT, Operation Theatre, Recovery, second floor |
Levels 4–7 are shown in the Roadmap but not built yet.

## 7. Expand (Construction tab)
- **Lift** ₹1,50,000 (Level 2). Required before any upper floor.
- **Floors** ₹3,00,000 and ₹5,00,000. Each floor has 6 empty bays.
- **Bays**: pick a room in the drop-down and press Build. Prices: OPD 30k, Lab 60k, Pharmacy 45k, Ward 50k, Ultrasound 1.2L, X-ray 90k, CT 3.5L, OT 1.8L, Recovery 70k.
- Use the lift (E at the lift in the lobby, then pick a floor or press 1–4). Patients and staff use it too.
- Staff go to posts automatically: doctors to OPD rooms, pharmacist to pharmacy, technicians to lab/X-ray/CT/ultrasound, nurses to recovery/ward.
- Daily income: each OT+Recovery pair ₹8,000 and each ward ₹1,500 (needs a doctor and a nurse), multiplied by your patient load.
- Salaries are paid every 30 days.

## 8. Equipment, paint, procedures
- **Equipment**: buy the ECG machine (₹40,000).
- **Customize**: ₹5,000 per change for interior walls, floors, exterior (swatches or any colour).
- **Procedure drills**: at any room station (E) choose Watch, Assist (answer step questions) or Lead (pays you, needs the qualification). Leading X-ray needs a post-graduate degree; minor surgery needs a surgical field.

## 9. Your career (Career tab)
MBBS (you start with it) → Post-graduate (MD/MS, ₹60,000, 10 days) → Specialization (₹1,20,000, 14 days) → Super-specialization (₹2,50,000, 20 days). Pick a field at the first step: Medicine, Surgery, Orthopaedics, Obstetrics & Gynaecology.
| Tier | Fee × | Patient load × |
| --- | --- | --- |
| MBBS | 1.0 | 1.0 |
| PG | 1.5 | 1.4 |
| Specialization | 2.2 | 1.9 |
| Super-specialization | 3.5 | 2.6 |
More patients means more income and more crowding, so staff and rooms must keep up. Study runs in game days while you play.

## 10. Day and night
A full day is about 7 minutes. At night street lamps, windows, lobby lights and car lights turn on; the clock is in the top-left panel.

## 11. Adding your own content
- Cases, tests, reports, drugs, scoring: `src/data/medical.js`.
- Report images: `public/images/{test}_{case}.jpg` (abnormal) or `{test}_normal.jpg`, e.g. `cxr_cap.jpg`, `xrf_radius.jpg`, `usg_gall.jpg`, `ecg_htn.jpg`. Medicines: `public/images/drugs/{id}.jpg`.
- 3D models for people and machines: `src/game/models.config.js` (`.glb` in `public/models`).
- Prices, rooms, careers, colours: `src/game/config.js`. Developer tools (+₹5,00,000, next level) are on the Overview tab.

## 12. Tips
- Always ask about allergies before prescribing antibiotics.
- Do not over-test: unnecessary tests cost the patient and your score.
- Keep the queue short: hire a second doctor and build a second OPD room.
- Build the lab before the pharmacy: lab tests earn more per patient and give you key reports.

All medical content is fictional and simplified. It is not medical advice or clinical training.

## 13. Version 3: story, resumes, department PCs, Levels 4–7

### Story and characters
- On first start a 4-page prologue introduces you (**type your name**), your mentor **Dr. Meera Iyer**, your team and the rival **Dr. Vikram Rao**.
- Each level unlocks a **chapter** (7 total) with a letter from Dr. Meera. The **Story** tab in the PC lists chapters, characters and every staff member's backstory.
- **Story events** ask you to choose (examples: fund Anita's critical-care course, host a free health camp, refuse or accept Dr. Rao's offer, use Dr. Meera's donation, welcome interns). Choices change money, reputation and staff skills. Reaching Level 7 shows the ending.

### Resumes and recruitment
- Every staff member has a **resume**: qualification, experience, age, trait, salary, bio and three skills (Speed, Accuracy, Care, 1–10). Open it from the Staff tab (click the name) or the Story tab. Your own resume is in Career → My resume.
- **Recruitment tab**: 8 applicants refresh every 7 days (or pay ₹2,000). Compare resumes, then Hire (joining fee + monthly salary). **Train** a person for ₹8,000 to raise their weakest skill.
- Skills matter: *Speed* shortens report time, dispensing and payments; *Accuracy* of your staff doctor improves auto-handled consultations; *Care* of nurses raises ward, ICU and surgery income.
- Staff walk to posts automatically: doctors to OPD/cardiology/neurology/research/college, pharmacist to pharmacy, technicians to lab/X-ray/CT/ultrasound/MRI, nurses to recovery/ward/ER/ICU/maternity/dialysis, extra receptionists to the International Lounge.

### Interactive department PCs
Stand near the station and press **E**:
- **Reception PC** (left side of the lobby): patients ready to pay. **Collect** in full, give **25% off** (+0.1 reputation) or **Waive (charity)** (+0.35). With no receptionist you must do it (patients leave after 40 s).
- **Lab PC** (lab station → Open department PC): *Collect sample → Run analyser → Validate & release*. The report then reaches the doctor.
- **Radiology PC** (X-ray, CT, Ultrasound, MRI and Cardiology echo): *Verify ID & screening → Set protocol (choose the right one) → Acquire image → Release report*. A wrong protocol repeats the scan.
- **Pharmacy PC**: dispense prescriptions and manage **stock** (reorder 50 units). Out-of-stock medicines cost reputation.
- **Department console** (ER, ICU, Cardiology, Maternity, Neurology, Dialysis, MRI, Research, College, International Lounge, Ward): see staffing and income and do a **ward round** (+25% income tomorrow, +0.3 reputation).
If a technician or pharmacist is on duty the work is done automatically at a speed set by their Speed skill; if nobody is on duty the patient waits for you (they leave after 45–60 seconds with a reputation penalty).
Operating a department PC yourself gives +0.05 reputation each time.

### Levels 4–7
| Level | Needs | New rooms and floors |
| --- | --- | --- |
| 4 Multi-Speciality | 100 patients, rep 75 | ER, ICU, Cardiology (echocardiogram), Maternity, third floor |
| 5 Super-Speciality | 250 patients, rep 85 | Neurology, Dialysis, MRI (lumbar spine), fourth floor |
| 6 Teaching & Research | 500 patients, rep 90 | Research Lab, Medical College |
| 7 International Medical Centre | 1000 patients, rep 95 | International Lounge, story ending |
Every built department earns daily income x your patient load (x0.4 without matching staff). New patient cases: stable angina, lumbar disc prolapse, antenatal visit. Use Overview → Developer tools to skip levels while exploring.

### Billing
Registration ₹900, consultation, tests and medicines are added to the patient's bill. They pay at reception (see the Reception PC for discounts). The Billing tab shows the last 12 bills with notes.

## 14. Version 4: customization, furniture store, Build mode, realistic consultation

### Your doctor
- Start screen: choose title, **name**, **specialization** (pick or type anything), **clinic name**, registration number, hair style, skin, hair colour and coat colour.
- PC → **Doctor profile** edits all of this any time, adds your own **qualifications/certificates** and a bio. The clinic name changes the sign on the building and the prescription pad. Your resume (Career tab) shows everything.
- Staff can be **renamed** (open their resume and edit the name).

### Furniture Store and Build mode
- PC → **Furniture Store**: 46 items in 6 categories (seating, desks & storage, beds & couches, machines, equipment, decor & screens). Machines (X-ray, CT, MRI, ultrasound, ECG, analyser, ventilator, defibrillator...) are bought here too. Rooms come with a starter set.
- **Buy** puts an item in your inventory; **Buy & place** places it straight away.
- Press **B** (Build mode): a floor plan of the current floor. Click an item and drag it (0.25 m grid). **R** rotates, **Delete** stores it, "Sell" returns 60%. Red outline = cannot be placed (walls, doors, the entrance lane, the lift front and bay aisles are protected). Switch floors with the tabs; use Place to bring items from the inventory.
- The ECG test now needs an ECG machine item placed anywhere. The OPD desk, patient chair, pharmacy counter and lab bench are real: if you move the desk, the doctor, you and the patient sit where the desk now is.
- **GIF screens**: TVs, totems, poster stands, vending machines, monitors and desk/counter PCs show images from `public/gifs/` (animated GIFs play). Default file names are in `public/gifs/README.txt`. In Build mode select a screen item to point it at any file (e.g. `gifs/ad1.gif`). Until a file exists a moving placeholder is shown.
- Real 3D models for any item: `src/game/models.config.js` (`equipment.xray = '/models/xray.glb'`).

### A more realistic consultation
- You sit behind your desk and the patient sits opposite, facing you. Staff doctors and technicians sit or stand at their furniture.
- Doctor PC: patient chart header with allergies, colour-flagged vitals and a **live ECG monitor**; history as a conversation; an **Examination** body diagram (head, heart, lungs, abdomen, arms, legs, back): each click gives findings for that area and the patient reacts in the room (arm raised, turning for back/lungs).
- **Diagnosis & Rx**: S/O clinical summary, ICD-10 codes, and a printed-style **prescription pad** with your clinic, name, specialization, qualifications and registration number. Examining the relevant area now affects your score.
- Examination findings are in `src/data/medical.js` (`XF`); add your own cases there.
