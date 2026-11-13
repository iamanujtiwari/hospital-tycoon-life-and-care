// Fictional, simplified procedures based on real hospital workflow. Step: [text, question, [correct, wrong, wrong]]
// lead = minimum career tier (0 = MBBS) and optional allowed fields.
export const P = [
{id:'opd',n:'OPD Consultation',room:'opd',lead:{t:0},pay:1500,s:[
['Greet the patient and confirm identity.','First check?',['Match name and ID with the record','Start prescribing','Skip to billing']],
['Take history: symptoms, past illness, allergies.','What goes in the record?',['Symptoms, history, allergies','Only the name','Nothing yet']],
['Record vital signs.','Which is a vital sign?',['Pulse and blood pressure','Shoe size','Insurance number']],
['Examine and decide on investigations.','Diagnosis is unclear. Next?',['Order relevant tests','Guess and discharge','Send to ICU']],
['Prescribe and counsel.','Before prescribing, check?',['Allergies and interactions','Parking slot','Room colour']]]},
{id:'blood',n:'Blood Test',room:'lab',lead:{t:0},pay:1200,s:[
['Confirm the test request and patient ID.','Labelling rule?',['Label at the bedside with two identifiers','Label later in the lab','Reuse an old label']],
['Hand hygiene and gloves.','Why gloves?',['Protect patient and staff','Fashion','Not needed']],
['Apply tourniquet, choose a suitable vein.','If the vein is unclear?',['Reassess, then try another site','Force the needle','Skip the test']],
['Collect into the correct tube.','Tube choice depends on?',['The test ordered','Tube colour preference','Patient age only']],
['Send to analyser, record result in the patient file.','Where is the result saved?',['Shared patient record','A sticky note','Nowhere']]]},
{id:'xray',n:'Chest X-ray',room:'xray',lead:{t:1},pay:1800,s:[
['Confirm request and screen for pregnancy.','If pregnancy is possible?',['Inform the doctor first','Proceed anyway','Ignore']],
['Remove metal objects and jewellery.','Why?',['They block or distort the image','Looks tidy','No reason']],
['Position patient and apply shielding.','Shielding protects?',['Areas not being imaged','The machine','Nothing']],
['Staff step behind the barrier, then expose.','Where does staff stand?',['Behind the protective barrier','Next to the patient','Outside the building']],
['Check image quality and send to radiologist.','Poor image quality?',['Repeat only if justified','Ignore it','Delete the file']]]},
{id:'ot',n:'Minor Surgery (fictional)',room:'ot',lead:{t:1,f:['surgery','ortho','gyn']},pay:25000,s:[
['Pre-op checklist: consent, ID, procedure site.','Missing consent form?',['Stop and resolve before proceeding','Continue anyway','Sign it for them']],
['Scrub and set up the sterile field.','Sterile field contaminated?',['Replace it before continuing','Ignore','Wipe with a cloth']],
['Anaesthetist induces anaesthesia with monitoring.','Who manages anaesthesia?',['The anaesthetist','The receptionist','The surgeon alone']],
['Team time-out: confirm patient, procedure, site.','When is time-out done?',['Before the first incision','After surgery','Never']],
['Perform the procedure; count instruments and swabs.','At closing, counts?',['Must match the start counts','Are optional','Are estimated']],
['Close, then hand over to recovery with notes.','Handover includes?',['Procedure, anaesthesia and plan','Only the bill','Nothing']]]},
{id:'recovery',n:'Post-op Recovery Care',room:'recovery',lead:{t:0},pay:3000,s:[
['Receive handover from the theatre team.','Handover must include?',['Procedure, anaesthesia and plan','Only the bill','Nothing']],
['Monitor vitals and airway.','What is monitored?',['Breathing, pulse, BP, oxygen level','Shoe size','Parking']],
['Manage pain and nausea per orders.','Pain increases suddenly?',['Reassess and inform the doctor','Ignore it','Discharge now']],
['Assess readiness for ward transfer.','Ready when?',['Awake, stable and meets criteria','Whenever convenient','After billing']]]}];
export const canLead = (p, S) => S.tier >= p.lead.t && (!p.lead.f || p.lead.f.includes(S.field));
