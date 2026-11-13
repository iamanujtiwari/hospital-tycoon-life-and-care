// All DOM panels: HUD, step tracker, story, management PC (recruitment, resumes), lift, procedures, Doctor PC and department PCs.
import { store } from '../game/store.js';
import { F, ROOMS, STAFF, FLOORS, LEVELS, TIERS, FIELDS, SWATCH, PAINT_COST, LIFT, EQUIP, DEPT, degree, hex } from '../game/config.js';
import { QS, TESTS, DRUGS, FREQ, DAYS, DXLIST, PROTO, AREAS, finding, DXCODE } from '../data/medical.js';
import { ITEMS, CATS } from '../data/catalog.js';
import { INTRO, CHAPTERS, BEATS, CHARS } from '../data/story.js';
import { rate } from '../data/staffgen.js';

const $ = (i) => document.getElementById(i);
let api, tab = 'ov', sig = '', shCat = 'All', bf = 0, bsel = null;
const RAD = ['xray', 'ct', 'usg', 'mri', 'cardio'], SKN = { spd: 'Speed', acc: 'Accuracy', care: 'Care' };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const btn = (a, v, t, cls = 'act', extra = '') => `<button class="${cls}" data-a="${a}" data-v="${v}" ${extra}>${t}</button>`;
const skills = (x) => `<div class="grid3">${Object.keys(SKN).map((k) => `<div><small>${SKN[k]} ${x.sk[k]}/10</small><div class="bar"><i style="width:${x.sk[k] * 10}%;background:var(--ac)"></i></div></div>`).join('')}</div>`;

export function initUI(a) {
  api = a; store.subscribe(render);
  const mon = () => { drawMon(); requestAnimationFrame(mon) }; mon();
  document.addEventListener('keydown', buildKeys);
  document.addEventListener('click', (e) => { const z = e.target.closest('[data-x]'); if (z) { act('exam', z.dataset.x); panels(true); return } const b = e.target.closest('button[data-a]'); if (b && !b.disabled) { act(b.dataset.a, b.dataset.v, b); panels(true) } });
  document.addEventListener('change', onChange); document.addEventListener('input', onInput);
  $('start').onclick = () => (store.S.story.intro ? begin() : intro());
  render();
}
function begin() { $('overlay').style.display = 'none'; store.started = true; api.start(); store.emit() }
const SKINS = [0xf1c9a5, 0xd9a577, 0xb67e55, 0x8a5a3c, 0x5c3b28], HAIRS = [0x17120e, 0x3b2a1e, 0x6b4a2f, 0x8a8a8a, 0xa0522d, 0xe0c080], COATS = [0xffffff, 0xdbeafe, 0xd1fae5, 0xfde2e2, 0x2b3340];
const SPECS = ['General Physician', 'Internal Medicine', 'Surgeon', 'Orthopaedic Surgeon', 'Cardiologist', 'Paediatrician', 'Gynaecologist', 'Radiologist', 'Neurologist', 'Dermatologist', 'Psychiatrist', 'ENT Specialist'];
const dn = () => { const P = store.S.profile; return (P.title ? P.title + ' ' : '') + P.name };
const swatches = (arr, k, cur) => arr.map((c) => `<button class="sw" style="background:${hex(c)};${c == cur ? 'outline:2px solid #2dd4bf' : ''}" data-a="lk" data-k="${k}" data-v="${c}"></button>`).join('');
const looks = () => { const L = store.S.profile.look; return `Hair style ${['short', 'long', 'none'].map((x) => `<button class="${L.style == x ? 'act' : 'act danger'}" data-a="lk" data-k="style" data-v="${x}">${x}</button>`).join(' ')}<br>Skin ${swatches(SKINS, 'skin', L.skin)}<br>Hair colour ${swatches(HAIRS, 'hair', L.hair)}<br>Coat ${swatches(COATS, 'coat', L.coat)}` };
const pfFields = () => { const P = store.S.profile; return `Title <select data-pf="title">${['Dr.', 'Prof.', 'Mr.', 'Ms.', ''].map((t) => `<option ${t == P.title ? 'selected' : ''}>${t}</option>`).join('')}</select> Name <input data-pf="name" value="${esc(P.name)}" maxlength="24"><br>Specialization <input data-pf="spec" list="spl" value="${esc(P.spec)}"><datalist id="spl">${SPECS.map((x) => `<option value="${x}">`).join('')}</datalist><br>Clinic name <input data-pf="clinic" value="${esc(P.clinic)}" maxlength="26"> <small>(shown on the building sign and prescriptions)</small><br>Registration no. <input data-pf="reg" value="${esc(P.reg)}">` };
let introDraw = null;
function intro() {
  const S = store.S, box = $('overlay').firstElementChild; let i = -1;
  const draw = () => {
    if (i < 0) { box.innerHTML = `<h2>Create your doctor</h2><div style="text-align:left;line-height:2">${pfFields()}<br>${looks()}</div><button id="nx">Next ▶</button>`; $('nx').onclick = () => { i = 0; draw() }; return }
    const P = INTRO(S.name), pg = P[i];
    box.innerHTML = `<h2>${pg.t}</h2><p style="text-align:left;line-height:1.65">${pg.x}</p><button id="nx">${i < P.length - 1 ? 'Next ▶' : 'Begin'}</button>`;
    $('nx').onclick = () => { if (i < P.length - 1) { i++; draw() } else { introDraw = null; S.story.intro = 1; begin() } };
  };
  introDraw = () => { if (i < 0) draw() }; draw();
}
/* ---------------- step tracker ---------------- */
const has = (id) => store.has(id), hasStaff = (S, t) => S.staff.some((x) => x.t == t);
const STEPS = [
  { t: 'Buy the clinic', d: 'Walk to the FOR SALE sign near the parking lot and press E (₹1,50,000).', done: (S) => S.owned },
  { t: 'Open the management PC', d: 'Inside, go to the desk on the right wall and press E.', done: (S, f) => f.pc },
  { t: 'Start OPD duty', d: 'Go to the OPD room (first bay), press E near the desk, choose Start OPD duty.', done: (S) => S.cases > 0 || store.duty },
  { t: 'See your first patient', d: 'Call in a patient. Ask history, check vitals, then Diagnosis & Rx and finalize.', done: (S) => S.cases >= 1 },
  { t: 'Order a test', d: 'Tests tab: tick a test and press Order. Lab/imaging rooms or the ECG machine are needed.', done: (S, f) => f.ordered },
  { t: 'Treat 5 patients', d: 'Correct diagnosis, suitable medicines, always ask about allergies.', done: (S) => S.cases >= 5 },
  { t: 'Reach Level 2', d: '12 patients treated and reputation 55.', done: (S) => S.lvl >= 2 },
  { t: 'Build a Laboratory', d: 'PC → Construction → Laboratory in an empty bay.', done: () => has('lab') },
  { t: 'Operate the Lab PC', d: 'Order a lab test, then stand at the lab (E → Open department PC) and process the sample yourself.', done: (S) => S.opsDone >= 1 },
  { t: 'Handle a payment at Reception PC', d: 'Reception desk (left side of the lobby): press E and collect, discount or waive a bill.', done: (S, f) => f.paid },
  { t: 'Build a Pharmacy and hire a Pharmacist', d: 'Construction, then Recruitment tab (read the resumes first).', done: (S) => has('pharmacy') && hasStaff(S, 'pharm') },
  { t: 'Recruit from the resume list', d: 'PC → Recruitment: compare experience and skills, then Hire.', done: (S, f) => f.hired },
  { t: 'Install the lift and buy the first floor', d: 'PC → Construction.', done: (S) => S.lift && S.floors >= 2 },
  { t: 'Furniture store: buy and place an ECG machine, then repaint', d: 'PC → Furniture Store → Buy & place the ECG. Then Customize. Press B for Build mode to move anything.', done: (S, f) => store.hasItem('ecg') && f.paint },
  { t: 'Study for a Post-graduate degree', d: 'PC → Career → choose a field → Enrol.', done: (S) => S.tier >= 1 },
  { t: 'Reach Level 3 and build X-ray, OT, Recovery', d: '40 patients, reputation 65. Then Construction.', done: (S) => S.lvl >= 3 && has('xray') && has('ot') && has('recovery') },
  { t: 'Reach Level 4: ER, ICU, Cardiology, Maternity', d: '100 patients, reputation 75. Each department earns daily income; do the ward round at its PC.', done: (S) => S.lvl >= 4 },
  { t: 'Super-speciality (Level 5)', d: 'Neurology, Dialysis, MRI. 250 patients, reputation 85. Study to Super-specialization.', done: (S) => S.lvl >= 5 && S.tier >= 3 },
  { t: 'Reach Level 7: International Medical Centre', d: 'Research, college and the International Lounge complete your story.', done: (S) => S.lvl >= 7 },
];
/* ---------------- render ---------------- */
function render() {
  const S = store.S; if (!S) return;
  const hud = $('hud'); hud.style.display = store.started ? 'block' : 'none';
  hud.innerHTML = `<div class="money">${F(S.money)}</div><div class="sub">${store.night ? '🌙' : '☀️'} ${store.clock || '09:00'} · Day ${S.day}</div><div class="rep"><span>⭐ Reputation ${S.rep.toFixed(0)}</span><div class="bar"><i style="width:${S.rep}%;background:linear-gradient(90deg,#f59e0b,#2dd4bf)"></i></div></div>
    <div class="chips"><span>📖 Ch.${S.lvl}</span><span>🏥 L${S.lvl} ${LEVELS[S.lvl - 1].n}</span><span>👥 ${S.pat}</span><span>🎓 ${esc(degree(S))}</span><span>🏢 ${FLOORS[store.fl].n}</span>${store.duty ? '<span class="on">🩺 on duty</span>' : ''}${S.rated ? `<span>📊 ${Math.round(S.scoreSum / S.rated)}</span>` : ''}</div>`;
  const g = $('goal'); g.style.display = store.started ? 'block' : 'none';
  const fl = S.flags || {}, i = STEPS.findIndex((x) => !x.done(S, fl)), n = STEPS.length;
  g.innerHTML = i < 0 ? '<b>🏆 All steps complete.</b><br>Your story is complete. Keep growing.' : `<small>STEP ${i + 1} / ${n}</small><div class="bar"><i style="width:${Math.round(i / n * 100)}%;background:var(--ac)"></i></div><b>${STEPS[i].t}</b><br>${STEPS[i].d}` + (STEPS[i + 1] ? `<br><small>Next: ${STEPS[i + 1].t}</small>` : '');
  const p = $('prompt'); p.style.display = store.prompt ? 'block' : 'none'; p.innerHTML = esc(store.prompt).replace(/^E: /, '<kbd>E</kbd>');
  const t = $('toast'); t.style.display = store.msg ? 'block' : 'none'; t.textContent = store.msg;
  $('cross').style.display = store.started && !store.ui && !store.PR ? 'block' : 'none';
  panels(false);
}
function panels(force) {
  const ui = store.ui, PR = store.PR, t = ui ? ui.t : '';
  if (t == 'pc') (store.S.flags = store.S.flags || {}).pc = 1;
  const dyn = t == 'doctor' || t == 'pharm' ? '|' + api.queue().map((p) => p.id + p.stage).join() + api.atPharm().map((p) => p.id).join() : t == 'dept' ? '|' + api.atPay().map((p) => p.id).join() + api.atProc([...RAD, 'lab']).map((p) => p.id + p.ps).join() : '';
  const s = t + (ui && (ui.key || ui.i || ui.id || ui.l) || '') + (PR ? '|' + PR.i + PR.fb + PR.done : '') + dyn;
  if (!force && s === sig) return; sig = s;
  const show = (id, on, f) => { const e = $(id); e.style.display = on ? 'block' : 'none'; if (on) e.innerHTML = f() };
  show('dashboard', t == 'pc', dash); show('lift', t == 'lift', liftHTML); show('consult', t == 'doctor', doctor); show('pharm', t == 'pharm', pharm); show('proc', !!PR || t == 'menu', procHTML);
  show('story', t == 'story' || t == 'resume', storyHTML); show('dept', t == 'dept', deptHTML); show('build', t == 'build', buildHTML); if (t == 'build') { planEvents(); drawPlan() }
}
/* ---------------- actions ---------------- */
function act(a, v, b) {
  const S = store.S, d = store.doc; S.flags = S.flags || {}; if (a == 'order') S.flags.ordered = 1; if (a == 'paint') S.flags.paint = 1;
  const A = {
    tab: () => (tab = v), close: () => api.close(), fire: () => api.fire(+v), floor: () => api.floor(), lift: () => api.installLift(), equip: () => api.equip(v),
    build: () => api.build(v, $('pk-' + v).value), study: () => api.study($('fld') ? $('fld').value : S.field), paint: () => api.paint(b.dataset.k, +v), dev: () => api.dev(v), reset: () => confirm('Reset everything?') && api.reset(),
    hirec: () => { api.hireCand(+v); S.flags.hired = 1 }, refresh: () => api.refreshCands(), resume: () => api.resume(v == 'me' ? 'me' : +v), resumeclose: () => { store.ui = { t: 'pc' } }, train: () => api.train(+v),
    go: () => api.lift(+v), duty: () => api.duty(store.ui.key), watch: () => api.startProc(store.ui.p, 'obs', store.ui.key), assist: () => api.startProc(store.ui.p, 'assist', store.ui.key), lead: () => api.startProc(store.ui.p, 'lead', store.ui.key), deptpc: () => api.dept(store.ui.key),
    ans: () => api.ans(+v), nxt: () => api.nxt(), endp: () => api.endProc(), dispense: () => api.dispense(v), reorder: () => api.reorder(v), round: () => api.round(v),
    collect: () => { const [id, m] = v.split('|'); api.collect(id, m); S.flags.paid = 1 }, dstep: () => api.deptStep(v, $('pr-' + v) ? +$('pr-' + v).value : 0),
    beat: () => { const [id, i] = v.split('|'); api.beat(id, +i) }, storyNext: () => api.storyNext(),
    lk: () => { api.setLook({ [b.dataset.k]: b.dataset.k == 'style' ? v : +v }); if (introDraw) introDraw() },
    qadd: () => { const q = $('qnew').value.trim(); if (q) api.setProfile({ quals: [...S.profile.quals, q] }) }, qdel: () => api.setProfile({ quals: S.profile.quals.filter((_, i) => i != +v) }),
    shcat: () => (shCat = v), ibuy: () => api.buyItem(v), ibuyp: () => { api.buyItem(v); const r = api.placeFromInv(v); if (r) { bsel = r.uid; bf = r.f; api.openBuild() } },
    bfloor: () => { bf = +v; bsel = null }, bplace: () => { const r = api.placeFromInv(v); if (r) { bsel = r.uid; bf = r.f } }, brot: () => api.fm.rotate(bsel), bstow: () => { api.stowItem(bsel); bsel = null }, bsell: () => { api.sellItem(bsel); bsel = null },
    bimg: () => api.setItemImg(bsel, $('bimg').value.trim()), tostore: () => { store.ui = { t: 'pc' }; tab = 'sh' }, openb: () => api.openBuild(),
    exam: () => { d.examined = d.examined || []; if (!d.examined.includes(v)) d.examined.push(v); api.examine(v) },
    call: () => { api.call(v); Object.assign(d, { pid: v, tab: 'hx', asked: [], sel: {}, dx: '', rx: [], note: '', result: null, examined: [] }) },
    dtab: () => (d.tab = v), ask: () => d.asked.push(v), standup: () => api.close(), nextpt: () => (d.result = null),
    order: () => { const l = Object.keys(d.sel).filter((k) => d.sel[k]); if (!l.length) return; const r = api.order(d.pid, l); d.sel = {}; if (r.instant) d.tab = 'rp'; else { d.pid = null; store.toast('Patient sent for tests. You will be notified when reports are ready.') } },
    addrx: () => d.rx.push({ drug: 'pcm', dose: '500 mg', freq: FREQ[1], days: 5 }), rmrx: () => d.rx.splice(+v, 1),
    finish: () => { const ev = api.finish(d.pid, { dx: d.dx, rx: d.rx, asked: d.asked, note: d.note, examined: d.examined || [] }); d.result = { name: api.patient(d.pid).name, ev }; d.pid = null },
  };
  if (A[a]) A[a]();
}
function onChange(e) {
  const el = e.target, d = store.doc; if (!el.dataset) return;
  if (el.dataset.rn != null) api.renameStaff(+el.dataset.rn, el.value);
  if (el.dataset.pf) api.setProfile({ [el.dataset.pf]: el.value });
  if (el.dataset.a == 'sel') d.sel[el.dataset.v] = el.checked;
  if (el.dataset.a == 'rx') { const r = d.rx[+el.dataset.i]; r[el.dataset.f] = el.dataset.f == 'days' ? +el.value : el.value; if (el.dataset.f == 'drug') r.dose = DRUGS[r.drug].doses[0]; panels(true) }
  if (el.dataset.a == 'color') { store.S.flags = store.S.flags || {}; store.S.flags.paint = 1; api.paint(el.dataset.k, parseInt(el.value.slice(1), 16)); panels(true) }
}
function onInput(e) { if (e.target.dataset && e.target.dataset.pf) api.setProfile({ [e.target.dataset.pf]: e.target.value }); const d = store.doc; if (!d) return; if (e.target.id == 'dxin') d.dx = e.target.value; if (e.target.id == 'note') d.note = e.target.value }
/* ---------------- management PC ---------------- */
function dash() {
  const S = store.S, tabs = [['ov', 'Overview'], ['rc', 'Recruitment'], ['st', 'Staff'], ['cn', 'Construction'], ['sh', 'Furniture Store'], ['pf', 'Doctor profile'], ['ed', 'Career'], ['bl', 'Billing'], ['sy', 'Story'], ['cu', 'Customize'], ['rm', 'Roadmap']];
  return `<div class="dh"><h2>🖥 Management PC <small>${LEVELS[S.lvl - 1].n} · day ${S.day}</small></h2>${btn('close', '', 'Stand up')}</div>
  <div class="tabs">${tabs.map(([k, n]) => `<button class="${tab == k ? 'active' : ''}" data-a="tab" data-v="${k}">${n}</button>`).join('')}</div><div class="body">${DT[tab]()}</div>`;
}
const DT = {
  ov() {
    const S = store.S, T = TIERS[S.tier];
    return `<div class="grid"><div class="card"><div class="v">${F(S.money)}</div><div class="l">Funds</div></div><div class="card"><div class="v">${S.rep.toFixed(1)}</div><div class="l">Reputation</div></div><div class="card"><div class="v">${S.pat}</div><div class="l">Patients treated</div></div><div class="card"><div class="v">${S.cases}</div><div class="l">Cases you handled</div></div><div class="card"><div class="v">${S.charity || 0}</div><div class="l">Charity cases</div></div></div>
    <div class="card wide">Monthly salaries ${F(S.staff.reduce((a, s) => a + (s.sal || STAFF[s.t][2]), 0))} · Consultation fee ${F(1400 * T.fee)} (×${T.fee}) · patient load ×${T.load}</div>
    <div class="card wide"><small>Each department earns daily income when the right staff are present; do the ward round at its PC for +25%. Operating the Lab, Radiology, Reception and Pharmacy PCs yourself earns reputation.</small></div>
    <div class="card wide"><b>Developer tools</b><br>${btn('dev', 'money', '+₹5,00,000')} ${btn('dev', 'level', 'Next level')} ${btn('reset', '', 'Reset game', 'act danger')}</div>`;
  },
  rc() {
    const S = store.S, c = api.cands();
    return `<small>New applicants arrive every 7 days. Read each resume: experience and skills change how fast and how well they work.</small><br>${btn('refresh', '', 'Refresh list (₹2,000)')}` +
      c.map((x, i) => `<div class="card"><b>${esc(x.n)}</b> · ${STAFF[x.t][0]} <small>${esc(x.qual)} · ${x.exp ? x.exp + ' yrs experience' : 'fresher'} · age ${x.age}</small>${skills(x)}<small><b>${esc(x.tr)}.</b> ${esc(x.bio)}</small><br>Salary ${F(x.sal)}/mo · joining fee ${F(x.fee)} ${btn('hirec', i, 'Hire', 'act', S.money < x.fee ? 'disabled' : '')}</div>`).join('');
  },
  st() {
    const S = store.S;
    return `<table><tr><th>Name</th><th>Role</th><th>Experience</th><th>Rating</th><th>Salary</th><th></th></tr>${S.staff.map((s, i) => `<tr><td>${btn('resume', i, '📄 ' + esc(s.n), 'act')}</td><td>${STAFF[s.t][0]}</td><td>${s.exp} yrs</td><td>${(rate(s)).toFixed(1)}/10</td><td>${F(s.sal || STAFF[s.t][2])}</td><td>${btn('train', i, 'Train ₹8k', 'act', S.money < 8000 ? 'disabled' : '')} ${btn('fire', i, 'Fire', 'act danger')}</td></tr>`).join('')}</table>`;
  },
  cn() {
    const S = store.S, nf = FLOORS[S.floors];
    let h = `<div class="card"><b>Lift</b> ${S.lift ? '<span class="ok">installed</span>' : `${F(LIFT.c)} · needs level ${LIFT.l} ${btn('lift', '', 'Install lift', 'act', S.lvl < LIFT.l || S.money < LIFT.c ? 'disabled' : '')}`}<br><small>Upper floors are reached by lift.</small></div>`;
    h += nf ? `<div class="card"><b>${nf.n}</b> ${F(nf.c)} · needs level ${nf.l} ${btn('floor', '', 'Buy floor', 'act', !S.lift || S.lvl < nf.l || S.money < nf.c ? 'disabled' : '')}</div>` : '';
    for (let f = 0; f < S.floors; f++) {
      h += `<div class="card"><b>${FLOORS[f].n}</b><table>`;
      for (let i = 0; i < 6; i++) {
        const k = f + '-' + i, id = S.slots[k];
        h += `<tr><td>Bay ${i + 1}</td><td>${id ? '<b>' + ROOMS[id].n + '</b>' : `<select id="pk-${k}">${Object.entries(ROOMS).map(([r, v]) => `<option value="${r}">${v.n} · ${F(v.c)}${v.l > S.lvl ? ' (needs L' + v.l + ')' : ''}</option>`).join('')}</select>`}</td><td>${id ? '' : btn('build', k, 'Build')}</td></tr>`;
      }
      h += '</table></div>';
    }
    return h;
  },
  sh() {
    const S = store.S, cats = ['All', ...CATS];
    return `<small>Everything is bought here. Items go to your inventory; place and move them in Build mode (press B). Screens (TV, monitors, totem, posters, vending) show GIFs from public/gifs/.</small><div class="tabs">${cats.map((c) => `<button class="${shCat == c ? 'active' : ''}" data-a="shcat" data-v="${c}">${c}</button>`).join('')}</div>${btn('openb', '', '🛠 Open Build mode')}` +
      `<div class="grid">${Object.entries(ITEMS).filter(([, d]) => shCat == 'All' || d.cat == shCat).map(([id, d]) => `<div class="card"><b>${d.n}</b><br><small>${d.cat} · ${d.w}×${d.d} m${hasScr(d) ? ' · 🖼 GIF screen' : ''}</small><div>${F(d.price)} <small>· you have ${(S.inv[id] || 0) + S.items.filter((i) => i.id == id).length}</small></div>${btn('ibuy', id, 'Buy', 'act', S.money < d.price ? 'disabled' : '')} ${btn('ibuyp', id, 'Buy & place', 'act', S.money < d.price ? 'disabled' : '')}</div>`).join('')}</div>`;
  },
  pf() {
    const S = store.S, P = S.profile;
    return `<div class="card"><b>Identity</b><br>${pfFields()}<br><small>Bio</small><br><textarea data-pf="bio" rows="2" style="width:100%" placeholder="Short biography for your resume">${esc(P.bio)}</textarea></div>
    <div class="card"><b>Qualifications &amp; certificates</b>${P.quals.map((q, i) => `<div class="row">${esc(q)} ${btn('qdel', i, '✕', 'act danger')}</div>`).join('')}<div class="row"><input id="qnew" placeholder="e.g. Fellowship in Diabetology (2026)" style="flex:1">${btn('qadd', '', 'Add')}</div></div>
    <div class="card"><b>Appearance</b> <small>(visible in third person, V)</small><br>${looks()}</div><div class="card"><small>Degrees from the Career tab are added to your resume automatically.</small></div>`;
  },
  ed() {
    const S = store.S, T = TIERS[S.tier], nx = TIERS[S.tier + 1];
    return `<div class="card"><b>${esc(degree(S))}</b> · fee ×${T.fee} · patient load ×${T.load} ${btn('resume', 'me', '📄 My resume')}</div>${S.course ? `<div class="card">Studying: ${TIERS[S.course.tier].n} · ${S.course.left} day(s) left</div>` : ''}
    ${nx ? `<div class="card"><b>Next: ${nx.n}</b><br>${S.tier == 0 ? `<select id="fld">${Object.entries(FIELDS).map(([k, v]) => `<option value="${k}">${v.n}</option>`).join('')}</select>` : ''}<small>${F(nx.cost)} · ${nx.days} days → fee ×${nx.fee}, patient load ×${nx.load}</small><br>${btn('study', '', 'Enrol', 'act', S.course || S.money < nx.cost ? 'disabled' : '')}</div>` : ''}
    <div class="card"><small>${Object.values(FIELDS).map((v) => v.n + ': MBBS → ' + v.d.join(' → ')).join('<br>')}</small></div>`;
  },
  bl() { const S = store.S; return S.bills.length ? S.bills.map((x) => `<div class="card"><b>${x.id}</b> ${esc(x.name || '')} <small>Day ${x.day} · ${esc(x.dx)} ${x.note ? '· ' + x.note : ''}</small><br>${x.items.map((t) => t[0] + ' ' + F(t[1])).join(' · ')}<br><b>Total ${F(x.tot)}</b></div>`).join('') : '<div class="card">No bills yet.</div>'; },
  sy() {
    const S = store.S;
    return `<h4>Chapters</h4>${CHAPTERS.map((c, i) => `<div class="card" style="opacity:${S.lvl > i ? 1 : .4}"><b>Chapter ${i + 1}: ${c.t}</b> ${S.lvl > i ? '<span class="ok">✔</span>' : '🔒'}<br><small>${S.lvl > i ? c.x : 'Reach level ' + (i + 1) + ' to unlock.'}</small></div>`).join('')}<h4>People</h4>${CHARS.map((c) => `<div class="card"><b>${c.n}</b> · ${c.r}<br><small>${c.bio}</small></div>`).join('')}${S.staff.map((s, i) => `<div class="card"><b>${esc(s.n)}</b> · ${STAFF[s.t][0]} ${btn('resume', i, '📄 Resume')}<br><small>${esc(s.bio)}</small></div>`).join('')}`;
  },
  cu() {
    const S = store.S, N = { wall: 'Interior walls', floor: 'Floors', ext: 'Exterior' };
    return `<small>Each change costs ${F(PAINT_COST)}.</small>` + Object.keys(N).map((k) => `<div class="card"><b>${N[k]}</b><br>${SWATCH[k].map((c) => `<button class="sw" style="background:${hex(c)}" data-a="paint" data-k="${k}" data-v="${c}"></button>`).join('')} <input type="color" value="${hex(S.paint[k])}" data-a="color" data-k="${k}"></div>`).join('');
  },
  rm() { const S = store.S; return LEVELS.map((l, i) => `<div class="card"><b>L${i + 1} ${l.n}</b> ${S.lvl > i ? '<span class="ok">✔</span>' : ''}<br><small>${['Clinic, reception, OPD, PC, Doctor PC', 'Lab, pharmacy, ward, ultrasound, lift, first floor', 'X-ray, CT, OT, recovery, second floor', 'ER, ICU, cardiology (echo), maternity, third floor', 'Neurology, dialysis, MRI, fourth floor', 'Research lab, medical college', 'International lounge, story ending'][i]}</small></div>`).join(''); },
};
/* ---------------- story & resumes ---------------- */
function storyHTML() {
  const S = store.S, ui = store.ui;
  if (ui.t == 'resume') {
    if (ui.i == 'me') { const T = TIERS[S.tier]; return `<h3>📄 Resume: ${esc(dn())}</h3><div class="card"><b>Specialization:</b> ${esc(S.profile.spec)} · Reg. ${esc(S.profile.reg)}<br><b>Qualifications:</b> ${S.profile.quals.map(esc).join(', ')}${S.tier ? ', ' + FIELDS[S.field].d.slice(0, S.tier).join(', ') : ''}<br><b>Experience:</b> ${S.cases} consultations · ${S.opsDone || 0} department tasks · ${S.charity || 0} charity cases<br><b>Average consultation score:</b> ${S.rated ? Math.round(S.scoreSum / S.rated) : '—'}/100<br><b>Fee:</b> ×${T.fee} · patient load ×${T.load}<br><small>Background: first doctor in a farming family, trained under Dr. Meera Iyer.</small></div>${btn('resumeclose', '', 'Back')}` }
    const s = S.staff[ui.i]; if (!s) return btn('resumeclose', '', 'Back');
    return `<h3>📄 <input data-rn="${ui.i}" value="${esc(s.n)}" style="font-size:18px;width:62%"> <small>${STAFF[s.t][0]}</small></h3><div class="card"><b>Qualification:</b> ${esc(s.qual)}<br><b>Experience:</b> ${s.exp} years · age ${s.age}<br><b>Trait:</b> ${esc(s.tr)}<br><b>Salary:</b> ${F(s.sal || STAFF[s.t][2])}/month · overall ${rate(s).toFixed(1)}/10${s.day ? '<br><small>Joined on day ' + s.day + '</small>' : ''}</div>${skills(s)}<p><small>${esc(s.bio)}</small></p><small>Speed: faster reports, dispensing, payments. Accuracy: better consultations. Care: higher ward and ICU income.</small><br>${btn('train', ui.i, 'Train (₹8,000)', 'act', S.money < 8000 ? 'disabled' : '')} ${btn('resumeclose', '', 'Back')}`;
  }
  if (ui.k == 'ch') { const c = CHAPTERS[ui.l - 1]; return `<h3>📖 Chapter ${ui.l}: ${c.t}</h3><p style="line-height:1.6">${c.x}</p><div class="card"><i>Letter from Dr. Meera Iyer:</i><br>${c.l}</div>${btn('storyNext', '', 'Continue')}`; }
  if (ui.k == 'end') return `<h3>🏆 The Ending</h3><p style="line-height:1.6">Dr. ${esc(S.name)}, you started with one room and a mentor's faith. Today patients fly in from abroad, Dr. Rao asks to visit, and Sunita still keeps the floors spotless. Anita runs the ICU. The newspapers that doubted you now ask for your advice.</p><p><i>"You were never building a hospital. You were building trust."</i> - Dr. Meera Iyer</p>${btn('storyNext', '', 'Keep playing')}`;
  const b = BEATS.find((x) => x.id == ui.id);
  return `<h3>📰 ${b.t}</h3><p style="line-height:1.6">${b.text}</p>${b.opts.map((o, i) => btn('beat', b.id + '|' + i, o.t, 'act', o.cost && S.money < o.cost ? 'disabled' : '')).join('')}`;
}
/* ---------------- lift, procedures ---------------- */
function liftHTML() { const S = store.S; return `<h3>🛗 Lift</h3>${Array.from({ length: S.floors }, (_, f) => btn('go', f, `${f + 1}. ${FLOORS[f].n}`)).join('')}${btn('close', '', 'Close')}`; }
function procHTML() {
  const PR = store.PR, ui = store.ui;
  if (!PR) return `<h3>${ui.p.n}</h3>${ui.p.room == 'opd' ? btn('duty', '', '🩺 Start OPD duty (Doctor PC)') : ''}${['lab', 'xray'].includes(ui.p.room) ? btn('deptpc', '', '🖥 Open department PC') : ''}${btn('watch', '', '👁 Watch')}${btn('assist', '', '🤝 Assist')}${btn('lead', '', '🩺 Lead', 'act', api.canLead(ui.p) ? '' : 'disabled')}${btn('close', '', 'Cancel')}<div class="hint">Leading needs a higher qualification for some procedures.</div>`;
  if (PR.done) return `<h3>${PR.p.n}</h3><p>${esc(PR.msg)}</p>${btn('endp', '', 'Close')}`;
  const s = PR.p.s[PR.i];
  return `<h3>${PR.p.n} <small>${{ obs: 'observing', assist: 'assisting', lead: 'leading' }[PR.mode]} · step ${PR.i + 1}/${PR.p.s.length}</small></h3><p>${s[0]}</p>` +
    (PR.fb ? `<p>${PR.fb}</p>${btn('nxt', '', 'Next')}` : PR.mode != 'obs' ? `<p><b>${s[1]}</b></p>${PR.ord.map((k) => btn('ans', k, esc(s[2][k]))).join('')}` : '<p><i>The team is working…</i></p>') + btn('endp', '', 'Leave');
}
/* ---------------- Doctor PC ---------------- */
const tech = () => { const t = store.S.staff.find((s) => s.t == 'tech'); return t ? t.n + ' (technician), verified by the reporting radiologist/pathologist' : 'visiting reporting radiologist/pathologist'; };
function reportHTML(p, id) {
  const r = p.reports[id]; if (!r) return '';
  const head = `<div class="card wide"><b>${r.title}</b> <small>${p.name} · ${p.age}y ${p.sex} · ${p.id}</small>`;
  if (r.kind == 'lab') return head + `<table><tr><th>Test</th><th>Result</th><th>Unit</th><th>Reference</th></tr>${r.rows.map((x) => `<tr class="${x[4] ? 'flag' : ''}"><td>${x[0]}</td><td><b class="${x[4] ? 'bad' : ''}">${x[1]} ${x[4]}</b></td><td>${x[2]}</td><td>${x[3]}</td></tr>`).join('')}</table><small>Reported by ${tech()}</small></div>`;
  return head + `<div class="imgbox"><img src="${r.img}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="ph">Image placeholder<br><small>add public/${r.img}</small></div></div><p><b>Technique:</b> ${r.tech}</p><p><b>Findings:</b> ${r.findings}</p><p><b>Impression:</b> ${r.impression}</p><small>Reported by ${tech()}</small></div>`;
}
const vflag = (c) => ({ bp: parseInt(c.vit[0]) >= 140, hr: c.vit[1] > 100, t: c.vit[2] >= 37.8, rr: c.vit[3] > 20, sp: c.vit[4] < 95 });
const avatar = (p) => `<svg width="54" height="54" viewBox="0 0 54 54"><circle cx="27" cy="27" r="27" fill="#16314a"/><circle cx="27" cy="22" r="9" fill="${p.sex == 'M' ? '#d9a577' : '#e8b88e'}"/><path d="M9 50c2-12 10-16 18-16s16 4 18 16z" fill="${p.sex == 'M' ? '#4361ee' : '#c2477a'}"/></svg>`;
function banner(p) {
  const c = p.case, d = store.doc, v = vflag(c), asked = d.asked.includes('allergy'), al = asked ? c.hx.allergy : 'not asked yet ⚠';
  return `<div class="chart"><div>${avatar(p)}</div><div style="flex:1"><b>${esc(p.name)}</b> · ${p.age}y ${p.sex} · MRN ${p.id}<br><small>Chief complaint: ${c.complaint}</small><br><span class="${asked && c.allergy ? 'bad' : ''}">Allergies: ${esc(al)}</span></div>
  <div class="vit"><span class="${v.bp ? 'bad' : ''}">BP ${c.vit[0]}</span><span class="${v.hr ? 'bad' : ''}">HR ${c.vit[1]}</span><span class="${v.t ? 'bad' : ''}">T ${c.vit[2]}°C</span><span class="${v.rr ? 'bad' : ''}">RR ${c.vit[3]}</span><span class="${v.sp ? 'bad' : ''}">SpO₂ ${c.vit[4]}%</span></div></div><canvas id="mon" width="860" height="64"></canvas>`;
}
function drawMon() {
  const cv = $('mon'), d = store.doc; if (!cv || !d || !d.pid) return; const p = api.patient(d.pid); if (!p) return;
  const x = cv.getContext('2d'), w = cv.width, h = cv.height, c = p.case, hr = c.vit[1], T = performance.now() / 1000, per = 60 / hr;
  x.fillStyle = '#05101a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#12301f'; x.lineWidth = 1; for (let i = 0; i < w; i += 20) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke() }
  x.strokeStyle = '#3ddc84'; x.lineWidth = 2; x.beginPath();
  for (let i = 0; i < w; i++) { const t = T - (w - i) / 110, ph = (((t % per) + per) % per) / per, g = (m, sg, a) => a * Math.exp(-((ph - m) ** 2) / (2 * sg * sg)); const y = g(.18, .025, .12) - g(.3, .008, .15) + g(.32, .012, 1) - g(.34, .01, .25) + g(.55, .04, .25); x.lineTo(i, h * .68 - y * h * .5) }
  x.stroke(); x.fillStyle = '#7ff0df'; x.font = '12px monospace'; x.fillText('ECG II  ' + hr + ' bpm   SpO2 ' + c.vit[4] + '%   Temp ' + c.vit[2] + '°C', 8, 14);
}
const BODY = `<svg viewBox="0 0 120 262" width="190" class="body"><ellipse cx="60" cy="28" rx="20" ry="24" class="zn" data-x="head"/><rect x="52" y="50" width="16" height="12" class="sk"/><path d="M30 64 Q60 56 90 64 L96 142 L24 142 Z" class="sk"/><rect x="30" y="70" width="60" height="32" rx="12" class="zn" data-x="lungs"/><ellipse cx="68" cy="90" rx="12" ry="14" class="zn" data-x="heart"/><rect x="34" y="106" width="52" height="34" rx="8" class="zn" data-x="abd"/><rect x="8" y="66" width="16" height="82" rx="8" class="zn" data-x="arms"/><rect x="96" y="66" width="16" height="82" rx="8" class="zn" data-x="arms"/><rect x="34" y="144" width="22" height="112" rx="10" class="zn" data-x="legs"/><rect x="64" y="144" width="22" height="112" rx="10" class="zn" data-x="legs"/></svg>`;
function rxPad(p) {
  const d = store.doc, P = store.S.profile, code = DXCODE[d.dx];
  return `<div class="rxpad"><div class="rxh"><b>${esc(P.clinic)}</b><br>${esc(dn())} · ${esc(P.spec)}<br><small>${P.quals.map(esc).join(', ')} · Reg. ${esc(P.reg)}</small></div><div class="rxm">Patient: <b>${esc(p.name)}</b>, ${p.age}y ${p.sex} · ${p.id} · Day ${store.S.day}</div><div>Dx: <b>${esc(d.dx || '—')}</b> ${code ? '<small>(ICD-10 ' + code + ')</small>' : ''}</div><div class="rxs">℞</div>${d.rx.map((r, i) => `<div>${i + 1}. ${DRUGS[r.drug].n} ${r.dose} — ${r.freq}, ${r.days} days</div>`).join('') || '<div><small>No medicines</small></div>'}<div><small>Advice: ${esc(d.note || '—')}</small></div><div class="sig">${esc(dn())}</div></div>`;
}
function doctor() {
  const S = store.S, d = store.doc; let h = `<h3>🩺 OPD · Doctor PC <small>${esc(dn())} · ${esc(S.profile.spec)}</small></h3>`;
  if (!d.pid) {
    const q = api.queue();
    if (d.result) h += `<div class="card wide"><b>${esc(d.result.name)} · score ${d.result.ev.score}/100</b>${d.result.ev.lines.map((l) => `<div class="${l[0]}">${l[0] == 'ok' ? '✔' : '✖'} ${esc(l[1])}</div>`).join('')}${btn('nextpt', '', 'Continue')}</div>`;
    h += q.length ? `<table>${q.map((p) => `<tr><td>${esc(p.name)} <small>${p.id}</small></td><td>${p.age}y ${p.sex}</td><td>${p.stage == 'queue2' ? '📄 reports ready' : 'new patient'}</td><td>${btn('call', p.id, 'Call in')}</td></tr>`).join('')}</table>` : '<p class="soon">No patients waiting. They arrive through reception, register and wait to be called.</p>';
    return h + btn('standup', '', 'Stand up (end duty)', 'act danger');
  }
  const p = api.patient(d.pid), c = p.case, tabs = [['hx', 'History'], ['ex', 'Examination'], ['ts', 'Tests'], ['rp', 'Reports'], ['dx', 'Diagnosis & Rx']]; d.examined = d.examined || [];
  h += banner(p) + `<div class="tabs">${tabs.map(([k, n]) => `<button class="${d.tab == k ? 'active' : ''}" data-a="dtab" data-v="${k}">${n}${k == 'rp' && Object.keys(p.reports).length ? ' (' + Object.keys(p.reports).length + ')' : ''}</button>`).join('')}</div>`;
  if (d.tab == 'hx') h += `<div class="chat">${d.asked.map((k) => `<div class="bub me">${QS.find((x) => x[0] == k)[1]}</div><div class="bub pt">${c.hx[k]}</div>`).join('') || '<small>Greet the patient and start taking the history.</small>'}</div>` + QS.filter((x) => !d.asked.includes(x[0])).map((x) => btn('ask', x[0], x[1])).join('');
  if (d.tab == 'ex') h += `<div class="exwrap"><div>${BODY}<br>${btn('exam', 'back', 'Examine back')}<br><small>Click a body area. The patient reacts in the room.</small></div><div style="flex:1"><h4>Findings</h4>${d.examined.length ? d.examined.map((a) => `<div class="card"><b>${AREAS[a]}</b><br>${esc(finding(c, a))}</div>`).join('') : '<small>Nothing examined yet. Use the stethoscope (heart, lungs), palpate the abdomen, check the throat and pulse.</small>'}</div></div>`;
  if (d.tab == 'ts') {
    h += '<table>' + Object.entries(TESTS).map(([id, t]) => {
      const ok = t.room ? store.rooms(t.room).length : store.hasItem(t.equip), done = (p.ordered || []).includes(id);
      return `<tr class="${ok ? '' : 'dim'}"><td>${ok && !done ? `<input type="checkbox" data-a="sel" data-v="${id}" ${d.sel[id] ? 'checked' : ''}>` : done ? '✔' : '🔒'}</td><td>${t.n}</td><td>${F(t.price)}</td><td><small>${ok ? (done ? 'ordered' : '') : 'needs ' + (t.room ? ROOMS[t.room].n : 'an ECG machine (Furniture Store)')}</small></td></tr>`;
    }).join('') + '</table>' + btn('order', '', 'Order selected tests') + '<div class="hint">Lab/imaging tests send the patient to that department; if no technician is on duty, run the test yourself at the department PC. ECG is done at your desk.</div>';
  }
  if (d.tab == 'rp') h += Object.keys(p.reports).map((id) => reportHTML(p, id)).join('') || '<p class="soon">No reports yet. Order tests first.</p>';
  if (d.tab == 'dx') {
    const summ = d.asked.map((k) => `${QS.find((x) => x[0] == k)[0]}: ${c.hx[k]}`).join(' · ') || 'History not taken', ob = d.examined.map((a) => AREAS[a] + ' — ' + finding(c, a)).join(' · ') || 'No examination recorded';
    h += `<div class="card"><small><b>S:</b> ${c.complaint} ${esc(summ)}<br><b>O:</b> BP ${c.vit[0]}, HR ${c.vit[1]}, T ${c.vit[2]}, SpO₂ ${c.vit[4]}%. ${esc(ob)}${Object.keys(p.reports).length ? '<br><b>Reports:</b> ' + Object.values(p.reports).map((r) => r.title).join(', ') : ''}</small></div><div class="two"><div>
    <label>Diagnosis</label><br><input id="dxin" list="dxl" style="width:100%" value="${esc(d.dx)}" placeholder="Type or pick a diagnosis"><datalist id="dxl">${DXLIST.map((x) => `<option value="${esc(x)}">`).join('')}</datalist>
    <h4>Prescription</h4>${d.rx.map((r, i) => `<div class="row"><select data-a="rx" data-i="${i}" data-f="drug">${Object.entries(DRUGS).map(([k, v]) => `<option value="${k}" ${k == r.drug ? 'selected' : ''}>${v.n}</option>`).join('')}</select>
      <select data-a="rx" data-i="${i}" data-f="dose">${DRUGS[r.drug].doses.map((x) => `<option ${x == r.dose ? 'selected' : ''}>${x}</option>`).join('')}</select>
      <select data-a="rx" data-i="${i}" data-f="freq">${FREQ.map((x) => `<option ${x == r.freq ? 'selected' : ''}>${x}</option>`).join('')}</select>
      <select data-a="rx" data-i="${i}" data-f="days">${DAYS.map((x) => `<option value="${x}" ${x == r.days ? 'selected' : ''}>${x} days</option>`).join('')}</select>${btn('rmrx', i, '✕', 'act danger')}</div>`).join('')}
    ${btn('addrx', '', '+ Add medicine')}<br><label>Advice / follow-up</label><br><textarea id="note" rows="2" style="width:100%">${esc(d.note)}</textarea><br>${btn('finish', '', 'Finalize consultation & send to pharmacy')}</div><div>${rxPad(p)}</div></div>`;
  }
  return h;
}
/* ---------------- department PCs ---------------- */
function pharm() {
  const S = store.S, list = api.atPharm();
  return `<h3>💊 Pharmacy PC</h3><h4>Prescriptions waiting</h4>${list.length ? list.map((p) => `<div class="card wide"><b>${esc(p.name)}</b> <small>${p.id}</small><br>${p.rx.map((r) => `<div class="row"><div class="drug"><img src="images/drugs/${r.drug}.jpg" alt="" onerror="this.style.display='none'"><span>💊</span></div>${DRUGS[r.drug].n} ${r.dose} · ${r.freq} · ${r.days} days <small>(stock ${S.stock[r.drug] || 0})</small></div>`).join('')}<br><b>${F(p.total)}</b> ${btn('dispense', p.id, 'Dispense & bill')}</div>`).join('') : '<p class="soon">No prescriptions waiting.</p>'}
  <h4>Stock <small>(units; a course uses one unit per day)</small></h4><table>${Object.entries(DRUGS).map(([k, v]) => { const q = S.stock[k] || 0; return `<tr><td>${v.n}</td><td class="${q < 15 ? 'bad' : ''}">${q}</td><td>${btn('reorder', k, 'Order 50 · ' + F(Math.round(v.price * 50 * .6)))}</td></tr>`; }).join('')}</table>${btn('close', '', 'Close')}`;
}
function deptHTML() {
  const S = store.S, ui = store.ui, id = ui.id, q = (a, b) => a;
  if (id == 'reception') {
    const pay = api.atPay(), r = S.staff.find((s) => s.t == 'recep');
    return `<h3>🧾 Reception PC</h3><p><small>${r ? `On desk: ${esc(r.n)} (speed ${r.sk.spd}/10). Payments are collected automatically, but you can decide discounts yourself.` : 'No receptionist: you must collect payments (patients leave after 40 seconds).'}</small></p><h4>Ready to pay</h4>${pay.length ? `<table>${pay.map((p) => `<tr><td>${esc(p.name)} <small>${p.id}</small></td><td><small>${p.items.map((i) => i[0] + ' ' + F(i[1])).join(' · ')}</small></td><td><b>${F(p.tot)}</b></td><td>${btn('collect', p.id + '|full', 'Collect')} ${btn('collect', p.id + '|disc', '25% off')} ${btn('collect', p.id + '|waive', 'Waive (charity)', 'act danger')}</td></tr>`).join('')}</table>` : '<p class="soon">Nobody is waiting at the desk.</p>'}<p><small>Discounts raise reputation (+0.1) and waiving raises it more (+0.35). Charity cases so far: ${S.charity || 0}.</small></p>${btn('close', '', 'Close')}`;
  }
  const rad = RAD.includes(id), lab = id == 'lab', rooms = lab ? ['lab'] : [id];
  let h = `<h3>🖥 ${ROOMS[id].n} PC</h3>`;
  if (lab || rad) {
    const L = api.atProc(rooms);
    h += `<h4>${lab ? 'Samples waiting' : 'Patients waiting for imaging'}</h4>` + (L.length ? L.map((p) => {
      const steps = lab ? ['Collect sample', 'Run analyser', 'Validate & release report'] : ['Verify ID & pregnancy screening', 'Set protocol', 'Acquire image', 'Release report'];
      const proto = rad && p.ps == 1 ? `<select id="pr-${p.id}">${p.po.map((k) => `<option value="${k}">${esc(PROTO[p.test][k])}</option>`).join('')}</select> ` : '';
      return `<div class="card wide"><b>${esc(p.name)}</b> <small>${p.id} · ${TESTS[p.test].n}</small><div class="bar"><i style="width:${p.ps / steps.length * 100}%;background:var(--ac)"></i></div>${proto}${btn('dstep', p.id, (rad && p.ps == 1 ? 'Confirm protocol' : steps[p.ps]) || 'Next')}</div>`;
    }).join('') : '<p class="soon">Nothing waiting. Order tests from the Doctor PC. A technician processes them automatically, or do it yourself.</p>');
  }
  if (DEPT[id]) {
    const d = DEPT[id], key = ui.key, st = S.staff.filter((s) => s.t == d.staff), T = TIERS[S.tier];
    h += `<div class="card"><b>Department</b>: ${ROOMS[id].n}<br>Staff needed: ${STAFF[d.staff][0]} — ${st.length ? st.map((s) => esc(s.n)).join(', ') : '<span class="bad">none hired (income x0.4)</span>'}<br>Estimated daily income: ${F(d.inc * T.load * (st.length ? 1 : .4))}<br>${S.rounds[key] == S.day ? '<span class="ok">Ward round done today</span>' : btn('round', key, 'Do ward round (+25% income, +0.3 reputation)')}</div>`;
  }
  return h + btn('close', '', 'Close');
}

/* ---------------- Build mode: floor-plan editor ---------------- */
const hasScr = (d) => (d.parts || (d.gen ? d.gen() : [])).some((p) => p[0] == 'scr');
function sideHTML() {
  const S = store.S, o = bsel && api.fm.live.get(bsel), rec = o && o.rec, def = rec && ITEMS[rec.id], inv = Object.entries(S.inv).filter(([, n]) => n > 0);
  return `<h3>🛠 Build mode <small>B / Esc to exit</small></h3><div class="tabs">${Array.from({ length: S.floors }, (_, f) => `<button class="${bf == f ? 'active' : ''}" data-a="bfloor" data-v="${f}">${FLOORS[f].n}</button>`).join('')}</div>
  <div class="card">${rec ? `<b>${def.n}</b> <small>${rec.x.toFixed(2)}, ${rec.z.toFixed(2)} · ${rec.ry}°</small><br>${btn('brot', '', '⟳ Rotate (R)')} ${btn('bstow', '', 'To inventory')} ${btn('bsell', '', 'Sell ' + F(def.price * .6), 'act danger')}${hasScr(def) ? `<br><small>Image / GIF (file under public/):</small><input id="bimg" value="${esc(rec.img || 'gifs/' + (def.gif || rec.id) + '.gif')}" style="width:100%"> ${btn('bimg', '', 'Apply')}` : ''}` : '<small>Click an item on the plan and drag it. Red outline = cannot be placed there. R rotates, Delete stores it.</small>'}</div>
  <h4>Inventory</h4>${inv.length ? inv.map(([id, n]) => `<div class="row">${ITEMS[id].n} ×${n} ${btn('bplace', id, 'Place')}</div>`).join('') : '<small>Empty. Buy items in the Furniture Store.</small>'}<p>${btn('tostore', '', '🛒 Furniture Store')}</p>`;
}
const buildHTML = () => `<div class="bwrap"><div class="bside" id="bside">${sideHTML()}</div><canvas id="plan"></canvas></div>`;
const planK = (cv) => { const k = Math.min(cv.width / 38, cv.height / 14); return { k, ox: (cv.width - 38 * k) / 2, oy: (cv.height - 14 * k) / 2 } };
const CATC = { Seating: '#3b82f6', 'Desks & storage': '#a16207', 'Beds & couches': '#14b8a6', Machines: '#a855f7', Equipment: '#ef4444', 'Decor & screens': '#22c55e' };
function drawPlan() {
  const cv = $('plan'); if (!cv) return; cv.width = cv.clientWidth; cv.height = cv.clientHeight; const x = cv.getContext('2d'), { k, ox, oy } = planK(cv), S = store.S;
  const X = (v) => ox + (v + 18.5) * k, Z = (v) => oy + (v + 12.5) * k;
  x.fillStyle = '#0b1420'; x.fillRect(0, 0, cv.width, cv.height); x.fillStyle = '#16222f'; x.fillRect(X(-18), Z(-12), 36 * k, 12 * k);
  for (let g = -18; g <= 18; g += 1) { x.strokeStyle = 'rgba(120,160,200,.07)'; x.beginPath(); x.moveTo(X(g), Z(-12)); x.lineTo(X(g), Z(0)); x.stroke() }
  x.fillStyle = 'rgba(229,72,77,.13)'; api.fm.reserved(bf).forEach((r) => x.fillRect(X(r[0]), Z(r[1]), (r[2] - r[0]) * k, (r[3] - r[1]) * k));
  x.fillStyle = '#5b6b7d'; api.walls(bf).forEach((c) => x.fillRect(X(c[0]), Z(c[1]), (c[2] - c[0]) * k, (c[3] - c[1]) * k));
  x.fillStyle = '#7d8da0'; x.font = '11px system-ui'; x.textAlign = 'center';
  for (let i = 0; i < 6; i++) { const id = S.slots[bf + '-' + i]; x.fillText(id ? ROOMS[id].n : 'Empty bay', X(-18 + 6 * i + 3), Z(-11.9) + 12) }
  [...api.fm.live.values()].filter((o) => o.rec.f == bf).forEach((o) => {
    const r = o.rec, d = ITEMS[r.id], b = api.fm.foot(r), ok = api.fm.valid(r.uid);
    x.fillStyle = (CATC[d.cat] || '#888') + (d.solid === false ? '55' : 'cc'); x.fillRect(X(b[0]), Z(b[1]), (b[2] - b[0]) * k, (b[3] - b[1]) * k);
    x.lineWidth = r.uid == bsel ? 3 : 1.5; x.strokeStyle = !ok ? '#ff4d4d' : r.uid == bsel ? '#fff' : 'rgba(0,0,0,.5)'; x.strokeRect(X(b[0]), Z(b[1]), (b[2] - b[0]) * k, (b[3] - b[1]) * k);
    const cx = X(r.x), cz = Z(r.z), a = r.ry * Math.PI / 180; x.strokeStyle = '#fff'; x.beginPath(); x.moveTo(cx, cz); x.lineTo(cx + Math.sin(a) * 9, cz + Math.cos(a) * 9); x.stroke();
    x.fillStyle = '#fff'; x.font = '10px system-ui'; x.fillText(d.n.split(' ')[0], cx, cz - 3);
  });
  const pp = api.player(); if (pp.f == bf) { x.fillStyle = '#2dd4bf'; x.beginPath(); x.arc(X(pp.x), Z(pp.z), 6, 0, 7); x.fill() }
}
function planEvents() {
  const cv = $('plan'); if (!cv) return; let drag = null;
  const W = (e) => { const r = cv.getBoundingClientRect(), { k, ox, oy } = planK(cv); return { x: (e.clientX - r.left - ox) / k - 18.5, z: (e.clientY - r.top - oy) / k - 12.5 } };
  cv.onmousedown = (e) => {
    const w = W(e), hit = [...api.fm.live.values()].reverse().find((o) => { if (o.rec.f != bf) return false; const b = api.fm.foot(o.rec); return w.x >= b[0] && w.x <= b[2] && w.z >= b[1] && w.z <= b[3] });
    bsel = hit ? hit.rec.uid : null; drag = hit ? { dx: hit.rec.x - w.x, dz: hit.rec.z - w.z, ox: hit.rec.x, oz: hit.rec.z } : null; $('bside').innerHTML = sideHTML(); drawPlan();
  };
  cv.onmousemove = (e) => { if (!drag || !bsel) return; const w = W(e); api.fm.setPos(bsel, Math.round((w.x + drag.dx) * 4) / 4, Math.round((w.z + drag.dz) * 4) / 4); drawPlan() };
  const up = () => { if (!drag || !bsel) return; if (!api.fm.valid(bsel)) { api.fm.setPos(bsel, drag.ox, drag.oz); store.toast('Cannot place there.') } else store.save(); drag = null; if ($('bside')) $('bside').innerHTML = sideHTML(); drawPlan() };
  cv.onmouseup = up; cv.onmouseleave = up;
}
function buildKeys(e) {
  if (!store.ui || store.ui.t != 'build' || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || !bsel) return;
  const k = e.key.toLowerCase(); if (k == 'r') { api.fm.rotate(bsel); store.save(); $('bside').innerHTML = sideHTML(); drawPlan() }
  if (k == 'delete' || k == 'backspace') { api.stowItem(bsel); bsel = null; panels(true) }
}
