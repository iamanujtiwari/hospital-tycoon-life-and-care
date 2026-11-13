// Hospital simulation: staff posts + resumes, patient journeys, department PCs, billing, stock, story events, daily economy.
import { STAFF, FH, TIERS, LEVELS, MAX_PLAYABLE_LEVEL, DEPT, F, degree } from './config.js';
import { person, anim } from './people.js';
import { CASES, TESTS, DRUGS, NAMES, makeReport, evaluate } from '../data/medical.js';
import { genCands } from '../data/staffgen.js';
import { BEATS } from '../data/story.js';

const POST = { opd: [4.9, -9.9, Math.PI], lab: [3, -10.4, 0], pharmacy: [3, -9.7, 0], xray: [2.7, -8, 0], ct: [4.9, -9.2, 0], usg: [4.6, -9.6, 0], mri: [4.9, -9.3, 0], cardio: [4.8, -10, Math.PI],
  recovery: [3, -9, Math.PI], ward: [3, -9, Math.PI], er: [3, -9, Math.PI], icu: [3, -9, Math.PI], maternity: [3, -9, Math.PI], neuro: [4.5, -10.5, Math.PI], dialysis: [3, -9, Math.PI], research: [3, -10.5, 0], college: [3, -11, 0], intl: [3, -9, Math.PI] };
const MAP = { doc: ['opd', 'cardio', 'neuro', 'research', 'college'], pharm: ['pharmacy'], tech: ['lab', 'xray', 'ct', 'usg', 'mri'], nurse: ['recovery', 'ward', 'er', 'icu', 'maternity', 'dialysis'], recep: ['intl'] };
export const RAD = ['xray', 'ct', 'usg', 'mri', 'cardio'];
const pick = (a) => a[Math.random() * a.length | 0];

export function createSim({ sc, world, store }) {
  const S = store.S, sm = [], pts = [];
  const slotsOf = (id, f) => store.rooms(id).map((k) => world.slots[k]).filter((s) => s && (f == null || s.f == f));
  const has = (t) => S.staff.some((s) => s.t == t), fee = () => Math.round(1400 * TIERS[S.tier].fee);
  const best = (t, k) => Math.max(0, ...S.staff.filter((s) => s.t == t).map((s) => s.sk[k]));
  const spdF = (t) => Math.max(.4, 1.4 - best(t, 'spd') / 10);
  const up = (s) => (s.f > 0 ? [{ x: 12.5, z: -4.4 }, { lift: s.f }] : []), down = (s) => (s.f > 0 ? [{ x: 12.5, z: -4.4 }, { lift: 0 }] : []);
  const leave = (s) => [{ x: s.xc, z: -4.5 }, ...down(s)];
  const visit = (id, ex) => { const s = pick(slotsOf(id)); let hx = s.xc, hz = id == 'pharmacy' ? -7.7 : -9, face; if (id == 'pharmacy') { const q = world.pose(s.f + '-' + s.i, 'counter', 0, 1.1); if (q) { hx = q.x; hz = q.z; face = q.ry + Math.PI } } return [...up(s), { x: s.xc, z: -4.5 }, { x: hx, z: hz, w: 3, face, ...ex }, ...leave(s)]; };
  const procStep = (id) => ({ hold: 'proc', dept: id, auto: has('tech') ? Math.round(4 * spdF('tech')) : 0 });
  const find = (id) => pts.find((p) => p.id == id);
  function mover(m, x, z, dt, sp) {
    const dx = x - m.position.x, dz = z - m.position.z, d = Math.hypot(dx, dz);
    if (d < .15) { m.mv = 0; return 1 } m.mv = 1;
    m.position.x += dx / d * Math.min(d, sp * dt); m.position.z += dz / d * Math.min(d, sp * dt); m.rotation.y = Math.atan2(dx, dz); return 0;
  }
  function layoutStaff(first) {
    if (!S.owned) return;
    const used = new Set(), take = (ids) => { for (const id of ids) { const s = slotsOf(id).find((s) => !used.has(s.f + '-' + s.i) && s.f + '-' + s.i !== store.duty); if (s) { used.add(s.f + '-' + s.i); s.id = id; return s } } return null };
    let desk = false;
    S.staff.forEach((st, i) => {
      let o = sm[i];
      if (!o) { const m = person(sc, STAFF[st.t][3], st.t); m.position.set(first ? -5 + Math.random() * 10 : 0, 0, first ? -3 : 16); o = sm[i] = { m, w: 0, f: 0 } }
      let q = null;
      if (st.t == 'recep' && !desk) { desk = true; q = { x: -17, z: -3.5, ry: Math.PI / 2, f: 0 } }
      else { const s = take(MAP[st.t] || []); if (s) { const p = POST[s.id], k = s.f + '-' + s.i; q = { x: s.x0 + p[0], z: p[1], ry: p[2], dx: s.xc, f: s.f }; const dk = ['opd', 'cardio', 'neuro'].includes(s.id) ? world.deskPose(k) : null, pc = s.id == 'pharmacy' ? world.pose(k, 'counter', 0, -.9) : s.id == 'lab' ? world.pose(k, 'bench', 0, .9) : null; if (dk) q = { ...q, x: dk.x, z: dk.z, ry: dk.ry, sit: 1 }; if (pc) q = { ...q, x: pc.x, z: pc.z, ry: s.id == 'lab' ? pc.ry + Math.PI : pc.ry } } }
      o.post = q; if (first && q) { o.m.position.set(q.x, q.f * FH, q.z); o.f = q.f }
    });
  }
  function remove(i) { if (sm[i]) { sc.remove(sm[i].m); sm.splice(i, 1) } }
  function spawn() {
    const T = TIERS[S.tier], docs = S.staff.filter((s) => s.t == 'doc').length + (store.duty ? 1 : 0), og = slotsOf('opd', 0);
    if (!S.owned || !og.length || !docs) return;
    if (pts.length >= Math.ceil(Math.min(docs, store.rooms('opd').length) * 3 * T.load) + 2 || Math.random() > Math.min(1, S.rep / 70 * T.load)) return;
    const c = pick(CASES), sex = c.sex || (Math.random() < .5 ? 'M' : 'F'), os = pick(og);
    const m = person(sc, [0x6c8ebf, 0xc27c7c, 0x7aa874, 0xd6b25e, 0x8f7ab5][Math.random() * 5 | 0], 'patient'); m.position.set(0, 0, 16);
    pts.push({ m, case: c, sex, age: c.age[0] + Math.random() * (c.age[1] - c.age[0]) | 0, name: pick(NAMES[sex]) + ' ' + pick(NAMES.L), id: 'P-' + String(S.pid = (S.pid || 0) + 1).padStart(4, '0'),
      bill: [], reports: {}, rel: {}, stage: 'new', i: 1, w: 0, idle: 0, rt: [{ x: 0, z: 16 }, { x: 0, z: -1.5 }, { x: -13.4, z: -3.5, w: 2.5 * (has('recep') ? spdF('recep') : 1.2), item: 'Registration', price: 900 }, { x: -4 + Math.random() * 8, z: -3.2, w: 2 },
        { x: os.xc, z: -4.5, fn: 'opd', os }, { x: -13.4, z: -3.5, hold: 'pay', pay: 1, auto: has('recep') ? Math.round(2 * spdF('recep')) : 0 }, { x: 0, z: -1.5 }, { x: 0, z: 16 }] });
  }
  function autoPath(p, os) {
    const d = best('doc', 'acc'); S.rep = Math.max(0, Math.min(100, S.rep + (d ? (d - 5) / 90 : -.05)));
    const st = [{ x: os.xc, z: -9, w: 3, item: 'Consultation', price: fee() }, { x: os.xc, z: -4.5 }];
    if (slotsOf('lab').length && Math.random() < .5) st.push(...visit('lab', { item: 'Lab tests', price: 800 }));
    if (slotsOf('pharmacy').length && has('pharm')) st.push(...visit('pharmacy', { hold: 'rx', auto: Math.round(3 * spdF('pharm')), item: 'Medicines', price: 600 }));
    p.stage = 'auto'; return st;
  }
  function autoHold(p, h) {
    p.rel[h] = 1; p.stage = 'auto'; const ds = p.duty;
    p.rt.splice(p.i + 1, 0, ...(h == 'call1' ? [{ x: ds.xc, z: -8.4, w: 3, item: 'Consultation', price: fee() }] : []), ...leave(ds));
  }
  function consume(p) { let fail = null; (p.rx || []).forEach((r) => { const q = S.stock[r.drug] || 0; if (q < r.days) fail = DRUGS[r.drug].n; else S.stock[r.drug] = q - r.days }); return fail }
  function pay(p) {
    const tot = p.bill.reduce((a, b) => a + b[1], 0), d = p.disc || 0, amt = Math.round(tot * (1 - d)); S.money += amt;
    if (d) S.rep = Math.min(100, S.rep + (d >= 1 ? .35 : .1)); if (d >= 1) S.charity = (S.charity || 0) + 1;
    S.bills.unshift({ id: p.id, name: p.name, dx: p.finalDx || '—', items: p.bill, tot: amt, day: S.day, note: d >= 1 ? 'waived (charity)' : d ? '25% discount' : '' }); S.bills.length = Math.min(S.bills.length, 12);
  }
  function npcs(dt, TT) {
    for (let k = pts.length - 1; k >= 0; k--) {
      const p = pts[k], t = p.rt[p.i];
      if (p.stage == 'rep') { p.repT -= dt; if (p.repT <= 0 && p.at == 'call2') { p.stage = 'queue2'; store.toast('📄 Reports ready: ' + p.name + ' (' + p.id + ')') } }
      if (t.lift != null) { p.m.position.set(12.5, t.lift * FH, -4.4); p.m.userData.sy = 0; p.i++; continue }
      if (mover(p.m, t.x, t.z, dt, 2.2)) {
        if (t.fn) {
          if (t.fn == 'opd') {
            const ds = store.duty && world.slots[store.duty];
            if (ds) { p.duty = ds; p.rt.splice(p.i + 1, 0, ...up(ds), { x: ds.xc + (Math.random() - .5) * 2, z: -4.9, hold: 'call1' }) } else p.rt.splice(p.i + 1, 0, ...autoPath(p, t.os));
          } else if (t.fn == 'rep') { p.stage = 'rep'; p.repT = has('tech') ? 8 * spdF('tech') : 18 }
          p.i++;
        } else if (t.hold) {
          p.at = t.hold; if (t.dept) p.dept = t.dept; const ex = store.examAnim && performance.now() < store.examAnim.until ? store.examAnim.area : null;
          if (t.face != null) p.m.rotation.y = t.face + (t.hold == 'doc' && (ex == 'back' || ex == 'lungs') ? Math.PI / 2 : 0); if (t.sit) { p.m.sit = 1; p.m.exam = ex }
          if (p.rel[t.hold]) {
            p.rel[t.hold] = 0; p.at = null; p.w = 0; p.idle = 0; p.ps = 0; p.m.sit = 0; p.m.exam = null;
            if (t.hold == 'rx') { const f = consume(p); if (f) { store.toast('Out of stock: ' + f + '. Reorder at the Pharmacy PC.'); S.rep = Math.max(0, S.rep - .3) } else if (t.item) p.bill.push([t.item, t.price]) }
            else if (t.item) p.bill.push([t.item, t.price]);
            if (t.test) p.reports[t.test] = makeReport(t.test, p);
            if (t.pay) { pay(p); store.emit() }
            p.i++;
          }
          else if (t.auto) { p.w += dt; if (p.w > t.auto) p.rel[t.hold] = 1 }
          else if (t.hold == 'rx') { p.idle += dt; if (p.idle > 45) { t.item = null; p.rel.rx = 1 } }
          else if (t.hold == 'pay') { p.idle += dt; if (p.idle > 40) { S.rep = Math.max(0, S.rep - .1); p.rel.pay = 1 } }
          else if (t.hold == 'proc') { p.idle += dt; if (p.idle > 60) { S.rep = Math.max(0, S.rep - .2); p.rel.proc = 1 } }
          else if (t.hold == 'call1') { if (p.stage == 'new') p.stage = 'queue1'; p.idle += dt; if (!store.duty && p.idle > 15) autoHold(p, 'call1') }
          else if (t.hold == 'call2' && p.stage == 'queue2') { p.idle += dt; if (!store.duty && p.idle > 15) autoHold(p, 'call2') }
        } else if (t.w) {
          p.w += dt;
          if (p.w > t.w) { if (t.item) p.bill.push([t.item, t.price]); p.w = 0; p.i++ }
        } else p.i++;
      }
      anim(p.m, dt, TT);
      if (p.i >= p.rt.length) { sc.remove(p.m); pts.splice(k, 1); S.pat++; S.rep = Math.min(100, S.rep + .2); chkLvl(); store.emit() }
    }
    sm.forEach((o) => {
      const m = o.m, p = m.position, q = o.post, tf = q ? q.f : 0; let g;
      if ((o.f || 0) !== tf) { o.f = tf; m.position.set(12.5, tf * FH, -4.4); m.userData.sy = 0 }
      if (tf == 0 && p.z > .5) g = [0, -1.5];
      else if (q) g = (q.dx != null && p.z > -5.6 && Math.abs(p.x - q.dx) > .5) ? [q.dx, -4.4] : [q.x, q.z];
      else { o.w -= dt; if (!o.tg || (o.w <= 0 && !m.mv)) { o.w = 2 + Math.random() * 5; o.tg = [-14 + Math.random() * 28, -4.8 + Math.random() * 3] } g = o.tg }
      if (mover(m, g[0], g[1], dt, 1.3) && q && g[0] == q.x && g[1] == q.z) { m.rotation.y = q.ry; m.work = 1; m.sit = q.sit ? 1 : 0 } else { m.work = 0; m.sit = 0 }
      anim(m, dt, TT);
    });
  }
  /* ----- doctor API ----- */
  const queue = () => pts.filter((p) => p.stage == 'queue1' || p.stage == 'queue2').map((p) => ({ id: p.id, name: p.name, age: p.age, sex: p.sex, stage: p.stage }));
  function call(id) {
    const p = find(id); if (!p || !store.duty || !(p.stage == 'queue1' || p.stage == 'queue2')) return;
    const h = p.stage == 'queue1' ? 'call1' : 'call2'; p.stage = h == 'call1' ? 'consult1' : 'consult2';
    if (h == 'call1' && !p.feeDone) { p.feeDone = 1; p.bill.push(['Consultation', fee()]) }
    const dp = world.deskPose(p.duty.f + '-' + p.duty.i); p.rt.splice(p.i + 1, 0, { x: dp.px, z: dp.pz, hold: 'doc', face: dp.ry + Math.PI, sit: 1 }); p.rel[h] = 1;
  }
  function order(id, list) {
    const p = find(id), room = list.filter((t) => TESTS[t].room), ds = p.duty; p.ordered = [...new Set([...(p.ordered || []), ...list])];
    list.filter((t) => !TESTS[t].room).forEach((t) => { p.reports[t] = makeReport(t, p); p.bill.push([TESTS[t].n, TESTS[t].price]) });
    if (!room.length) return { instant: true };
    const st = [...leave(ds)]; room.forEach((t) => st.push(...visit(TESTS[t].room, { ...procStep(TESTS[t].room), item: TESTS[t].n, price: TESTS[t].price, test: t })));
    const wx = ds.xc + (Math.random() - .5) * 2; st.push(...up(ds), { x: wx, z: -4.9, fn: 'rep' }, { x: wx, z: -4.9, hold: 'call2' });
    p.rt.splice(p.i + 1, 0, ...st); p.rel.doc = 1; p.stage = 'tests'; return { instant: false };
  }
  function finish(id, pl) {
    const p = find(id), ev = evaluate(p, pl), ds = p.duty, st = [...leave(ds)];
    const total = pl.rx.reduce((a, r) => a + DRUGS[r.drug].price * r.days, 0); p.rx = pl.rx; p.finalDx = pl.dx || '—';
    if (pl.rx.length && slotsOf('pharmacy').length) st.push(...visit('pharmacy', { hold: 'rx', auto: has('pharm') ? Math.round(3 * spdF('pharm')) : 0, item: 'Medicines', price: total }));
    p.rt.splice(p.i + 1, 0, ...st); p.rel.doc = 1; p.stage = 'done';
    S.cases++; S.rated++; S.scoreSum += ev.score; S.rep = Math.max(0, Math.min(100, S.rep + (ev.score - 60) / 100)); store.save(); store.emit(); return ev;
  }
  function endDuty() { pts.filter((p) => p.stage == 'consult1' || p.stage == 'consult2').forEach((p) => { p.rel.doc = 1; p.stage = 'done'; p.rt.splice(p.i + 1, 0, ...leave(p.duty)) }) }
  /* ----- department PCs ----- */
  const atPharm = () => pts.filter((p) => p.at == 'rx').map((p) => ({ id: p.id, name: p.name, rx: p.rx || [], total: (p.rt[p.i] && p.rt[p.i].price) || 0 }));
  const dispense = (id) => { const p = find(id); if (p && p.at == 'rx') p.rel.rx = 1 };
  const atPay = () => pts.filter((p) => p.at == 'pay').map((p) => ({ id: p.id, name: p.name, items: p.bill, tot: p.bill.reduce((a, b) => a + b[1], 0) }));
  const collect = (id, m) => { const p = find(id); if (p && p.at == 'pay') { p.disc = m == 'waive' ? 1 : m == 'disc' ? .25 : 0; p.rel.pay = 1 } };
  const atProc = (rooms) => pts.filter((p) => p.at == 'proc' && rooms.includes(p.dept)).map((p) => { const t = p.rt[p.i]; return { id: p.id, name: p.name, test: t.test, dept: p.dept, ps: p.ps || 0, po: p.po || (p.po = [0, 1, 2].sort(() => Math.random() - .5)) } });
  function procStepAct(id, choice) {
    const p = find(id); if (!p || p.at != 'proc') return '';
    const rad = RAD.includes(p.dept), max = rad ? 4 : 3;
    if (rad && (p.ps || 0) == 1 && choice != 0) { S.rep = Math.max(0, S.rep - .05); return 'Wrong protocol: the scan must be repeated. Check the test and the patient.' }
    p.ps = (p.ps || 0) + 1;
    if (p.ps >= max) { p.rel.proc = 1; S.opsDone = (S.opsDone || 0) + 1; S.rep = Math.min(100, S.rep + .05); return 'Report released to the doctor.' } return '';
  }
  function round(key) { if (S.rounds[key] == S.day) return 'Round already done today.'; S.rounds[key] = S.day; S.rep = Math.min(100, S.rep + .3); return 'Round done: reputation +0.3, +25% income tomorrow.' }
  const ensureCands = () => { if (!S.cands.length) S.cands = genCands(8) };
  /* ----- levels, story, daily economy ----- */
  function chkLvl() {
    if (S.lvl >= MAX_PLAYABLE_LEVEL) return; const n = LEVELS[S.lvl];
    if (S.pat >= n.pat && S.rep >= n.rep) { S.lvl++; S.story.pending.push({ k: 'ch', l: S.lvl }); store.toast('🏥 Level up: ' + LEVELS[S.lvl - 1].n + '!') }
  }
  function nextDay() {
    S.day++;
    if (S.owned && S.day % 30 == 0) { const sal = S.staff.reduce((a, s) => a + (s.sal || STAFF[s.t][2]), 0); S.money -= sal; store.toast('Monthly salaries paid: ' + F(sal)) }
    if (S.day % 7 == 0) S.cands = genCands(8);
    if (S.course && --S.course.left <= 0) { S.tier = S.course.tier; S.course = null; store.toast('🎓 Qualification complete: ' + degree(S)) }
    if (S.owned) {
      const T = TIERS[S.tier], care = has('nurse') ? 1 + (best('nurse', 'care') - 5) / 20 : 0; let inc = 0;
      if (has('nurse') && has('doc')) inc += Math.min(store.rooms('ot').length, store.rooms('recovery').length) * 8000 * T.load * care;
      Object.entries(DEPT).forEach(([id, d]) => store.rooms(id).forEach((k) => { inc += d.inc * T.load * (has(d.staff) ? 1 : .4) * (S.rounds[k] == S.day - 1 ? 1.25 : 1) * (d.staff == 'nurse' && care ? care : 1) }));
      if (inc) { inc = Math.round(inc); S.money += inc; store.toast('Department revenue today: ' + F(inc)) }
    }
    BEATS.forEach((b) => { if (!S.story.done.includes(b.id) && b.when(S)) { S.story.done.push(b.id); S.story.pending.push({ k: 'beat', id: b.id }) } });
    if (S.lvl >= 7 && !S.story.done.includes('end')) { S.story.done.push('end'); S.story.pending.push({ k: 'end' }) }
    if (!store.ui && !store.PR && S.story.pending.length) { store.ui = { t: 'story', ...S.story.pending.shift() } }
    chkLvl(); store.save(); store.emit();
  }
  return { sm, pts, layoutStaff, remove, spawn, npcs, nextDay, queue, call, order, finish, endDuty, atPharm, dispense, atPay, collect, atProc, procStep: procStepAct, round, ensureCands, patient: find };
}
