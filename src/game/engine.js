// 3D engine: renderer, day/night, player (first/third person), interaction, procedures. Returns { api, destroy }.
import * as THREE from 'three';
import { store } from './store.js';
import { FH, ROOMS, STAFF, TIERS, CLINIC_PRICE, FLOORS, PAINT_COST, LIFT, EQUIP, F } from './config.js';
import { P, canLead } from './procedures.js';
import { person, anim, mixers } from './people.js';
import { createWorld } from './world.js';
import { createSim } from './sim.js';
import { genCands } from '../data/staffgen.js';
import { BEATS } from '../data/story.js';
import { DRUGS } from '../data/medical.js';
import { DEPT } from './config.js';
import { ITEMS } from '../data/catalog.js';

const NAMES = ['Asha', 'Vikram', 'Neha', 'Arjun', 'Meera', 'Kabir', 'Divya', 'Sameer'];
const shuffle = () => [0, 1, 2].sort(() => Math.random() - .5);

export function startEngine(canvas) {
  const S = store.S, sc = new THREE.Scene();
  sc.fog = new THREE.Fog(0xc4dcf0, 70, 320);
  const cam = new THREE.PerspectiveCamera(68, 1, .1, 6000), rd = new THREE.WebGLRenderer({ antialias: true, canvas, powerPreference: 'high-performance' });
  cam.rotation.order = 'YXZ'; rd.setPixelRatio(Math.min(devicePixelRatio, 1.75)); rd.shadowMap.enabled = true; rd.shadowMap.type = THREE.PCFSoftShadowMap; rd.outputEncoding = THREE.sRGBEncoding; rd.toneMapping = THREE.ACESFilmicToneMapping;
  const hemi = new THREE.HemisphereLight(0xd6e8ff, 0x6a6a58, 1), sun = new THREE.DirectionalLight(0xffffff, .5);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .04; Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, far: 120 }); sun.shadow.camera.updateProjectionMatrix(); sc.add(hemi, sun);
  const world = createWorld(sc, S, rd), sim = createSim({ sc, world, store }), C = world.C;
  const pl = { x: 0, z: 18, f: 0, vx: 0, vz: 0, yaw: 0, pit: 0, bt: 0 };
  let keys = {}, drag = 0, tp = 0, night = null, last = performance.now(), dayT = 0, spT = 0, TT = 0, raf = 0;
  const lookOf = () => { const L = S.profile.look; return { skin: L.skin, hair: L.hair, style: L.style, coat: L.coat } };
  let me = person(sc, 0xf4f6f8, 'player', lookOf()); me.visible = false;
  const rebuildMe = () => { sc.remove(me); me = person(sc, 0xf4f6f8, 'player', lookOf()) };
  const act = () => !store.ui && !store.PR;

  /* ----- procedures ----- */
  function startProc(p, mode, key) {
    const s = world.slots[key], y = s.y, xc = s.xc, tmp = [world.B(xc - .6, -11.2, xc + .6, -9.2, .9, 0xdfe6ea, 0, y, s.f)];
    const a = person(sc, 0xffffff, 'doc'), b = person(sc, 0x4ec9c0, 'nurse'), c = person(sc, 0xff9999, 'patient');
    a.position.set(xc - 1.5, y, -10.2); b.position.set(xc + 1.5, y, -10.2); a.rotation.y = Math.PI / 2; b.rotation.y = -Math.PI / 2;
    c.rotation.x = -Math.PI / 2; c.position.set(xc, y + .95, -9.3); tmp.push(a, b, c);
    pl.f = s.f; pl.x = xc; pl.z = -7.2; store.ui = null;
    store.PR = { p, mode, i: 0, ok: 0, fb: '', tm: 0, tmp, look: { x: xc, z: -10.2 }, ord: shuffle(), done: 0 }; store.emit();
  }
  function ans(k) { const PR = store.PR, s = PR.p.s[PR.i]; if (k == 0) { PR.ok++; PR.fb = '✅ Correct.' } else PR.fb = '❌ Not quite. Correct: ' + s[2][0]; store.emit() }
  function fin() {
    const PR = store.PR, n = PR.p.s.length, r = PR.ok / n, m = PR.mode; PR.done = 1; S.cases = (S.cases || 0) + 1;
    let t = 'Procedure complete.'; if (m != 'obs') t += ` Score ${PR.ok}/${n}.`;
    if (m == 'lead') { const T = TIERS[S.tier], pay = Math.round(PR.p.pay * r * T.fee); S.money += pay; S.rep = Math.min(100, S.rep + r * 1.5); t += ` You earned ${F(pay)} (your fee ×${T.fee}) and reputation.` }
    PR.msg = t;
  }
  function nxt() { const PR = store.PR; PR.i++; PR.fb = ''; PR.tm = 0; PR.ord = shuffle(); if (PR.i >= PR.p.s.length) fin(); store.emit() }
  function endProc() { const PR = store.PR; if (PR) PR.tmp.forEach((o) => sc.remove(o)); store.PR = null; store.ui = null; store.emit() }

  /* ----- actions used by the UI ----- */
  const api = {
    buy() {
      if (S.money < CLINIC_PRICE) return store.toast('Not enough funds.');
      S.money -= CLINIC_PRICE; S.owned = 1; S.slots['0-0'] = 'opd'; world.buyShell(); world.furnishRoom('0-0', 'opd'); sim.layoutStaff();
      store.save(); store.emit(); store.toast('Clinic purchased! A management PC is installed in the lobby.');
    },
    hire(k) { const s = STAFF[k]; if (S.money < s[1]) return store.toast('Not enough funds.'); S.money -= s[1]; S.staff.push({ t: k, n: NAMES[Math.random() * NAMES.length | 0] }); sim.layoutStaff(); store.emit() },
    fire(i) { sim.remove(i); S.staff.splice(i, 1); sim.layoutStaff(); store.emit() },
    build(key, id) { const r = ROOMS[id]; if (!world.slots[key] || S.slots[key] || S.money < r.c || r.l > S.lvl) return; S.money -= r.c; S.slots[key] = id; world.furnishRoom(key, id); sim.layoutStaff(); store.emit(); store.toast(r.n + ' built.') },
    floor() { const fl = FLOORS[S.floors]; if (!S.lift) return store.toast('Install a lift first (Construction tab).'); if (!fl || S.money < fl.c || fl.l > S.lvl) return; S.money -= fl.c; world.buildFloor(S.floors); S.floors++; store.emit(); store.toast(fl.n + ' built. Use the lift in the lobby.') },
    study(field) { const t = S.tier + 1, T = TIERS[t], f = S.field || field; if (!T || S.course || !f || S.money < T.cost) return; S.money -= T.cost; S.field = f; S.course = { tier: t, left: T.days }; store.emit() },
    paint(k, c) { if (S.money < PAINT_COST) return store.toast('Not enough funds.'); S.money -= PAINT_COST; S.paint[k] = c; world.applyPaint(); store.emit() },
    lift(f) { pl.f = f; pl.x = 12.5; pl.z = -3.6; store.ui = null; store.emit() },
    installLift() { if (S.lift || S.money < LIFT.c || LIFT.l > S.lvl) return; S.money -= LIFT.c; S.lift = 1; world.installLift(); store.emit(); store.toast('Lift installed in the lobby.') },
    equip(k) { const q = EQUIP[k]; if (S.equip[k] || S.money < q.c || q.l > S.lvl) return; S.money -= q.c; S.equip[k] = 1; store.emit(); store.toast(q.n + ' installed in the OPD.') },
    dev(k) { if (k == 'money') S.money += 500000; if (k == 'level' && S.lvl < 7) { S.lvl++; S.story.pending.push({ k: 'ch', l: S.lvl }) } store.emit() },
    start() { try { canvas.requestPointerLock() } catch (e) {} },
    setName(n) { S.name = S.profile.name = (n || 'Aarav').slice(0, 20) },
    fm: world.fm, player: () => ({ x: pl.x, z: pl.z, f: pl.f }), walls: (f) => world.C.filter((c) => c[4] === f && !world.fm.own.has(c)),
    openBuild() { document.exitPointerLock(); store.ui = { t: 'build' }; store.emit() },
    buyItem(id) { const d = ITEMS[id]; if (S.money < d.price) return store.toast('Not enough funds.'); S.money -= d.price; S.inv[id] = (S.inv[id] || 0) + 1; store.emit(); store.toast(d.n + ' bought. Place it in Build mode (B).') },
    placeFromInv(id) { if (!S.inv[id]) return null; const r = world.fm.autoPlace(id, pl.f, pl.x, pl.z); if (!r) { store.toast('No free space on this floor.'); return null } S.inv[id]--; store.emit(); return r },
    stowItem(uid) { const r = world.fm.remove(uid); if (r) { S.inv[r.id] = (S.inv[r.id] || 0) + 1; store.emit() } },
    sellItem(uid) { const r = world.fm.remove(uid); if (r) { S.money += Math.round(ITEMS[r.id].price * .6); store.emit() } },
    setItemImg(uid, url) { world.fm.setImg(uid, url); store.emit() },
    setProfile(p) { Object.assign(S.profile, p); S.name = S.profile.name; if ('clinic' in p) world.setClinicName(); store.emit() },
    setLook(l) { Object.assign(S.profile.look, l); rebuildMe(); store.emit() },
    renameStaff(i, n) { if (S.staff[i]) S.staff[i].n = n; store.emit() },
    examine(area) { store.examAnim = { area, until: performance.now() + 3000 }; store.emit() },
    cands() { sim.ensureCands(); return S.cands },
    refreshCands() { if (S.money < 2000) return; S.money -= 2000; S.cands = genCands(8); store.emit() },
    hireCand(i) { const c = S.cands[i]; if (!c || S.money < c.fee) return store.toast('Not enough funds.'); S.money -= c.fee; S.cands.splice(i, 1); c.day = S.day; S.staff.push(c); sim.layoutStaff(); store.emit(); store.toast(c.n + ' joined your team.') },
    train(i) { const s = S.staff[i]; if (!s || S.money < 8000) return store.toast('Training costs ₹8,000.'); const k = Object.keys(s.sk).sort((a, b) => s.sk[a] - s.sk[b])[0]; if (s.sk[k] >= 10) return; S.money -= 8000; s.sk[k]++; store.emit(); store.toast(s.n + ' trained: ' + k + ' +1') },
    resume(i) { store.ui = { t: 'resume', i }; store.emit() },
    dept(key) { document.exitPointerLock(); store.ui = { t: 'dept', key, id: key == 'reception' ? 'reception' : S.slots[key] }; store.emit() },
    deptStep(id, c) { const m = sim.procStep(id, c); if (m) store.toast(m); store.emit() },
    collect(id, m) { sim.collect(id, m); store.emit() },
    round(key) { store.toast(sim.round(key)); store.emit() },
    reorder(d) { const c = Math.round(DRUGS[d].price * 50 * .6); if (S.money < c) return store.toast('Not enough funds.'); S.money -= c; S.stock[d] = (S.stock[d] || 0) + 50; store.emit() },
    atPay: () => sim.atPay(), atProc: (r) => sim.atProc(r),
    beat(id, i) { const o = BEATS.find((x) => x.id == id).opts[i]; if (o.cost && S.money < o.cost) return store.toast('Not enough funds.'); if (o.cost) S.money -= o.cost; o.fx(S); store.ui = null; store.toast(o.res); store.save(); store.emit() },
    storyNext() { store.ui = null; store.emit() },
    duty(key) { const s = world.slots[key]; store.duty = key; pl.f = s.f; const dp = world.deskPose(key); pl.x = dp.x; pl.z = dp.z; pl.yaw = dp.ry + Math.PI; pl.pit = -.18; store.sit = 1; sim.layoutStaff(); store.doc = { pid: null, tab: 'hx', asked: [], sel: {}, dx: '', rx: [], note: '', result: null }; store.ui = { t: 'doctor' }; store.emit() },
    pharm() { document.exitPointerLock(); store.ui = { t: 'pharm' }; store.emit() },
    queue: () => sim.queue(), call: (id) => sim.call(id), order: (id, l) => sim.order(id, l), finish: (id, p) => sim.finish(id, p), patient: (id) => sim.patient(id), atPharm: () => sim.atPharm(), dispense: (id) => { sim.dispense(id); store.emit() },
    close() { if (store.duty) { sim.endDuty(); const ds = world.slots[store.duty]; store.duty = null; store.sit = 0; sim.layoutStaff(); pl.x = ds.xc; pl.z = -7.2; store.doc = null } store.ui = null; store.emit() },
    menu(p, key) { document.exitPointerLock(); store.ui = { t: 'menu', p, key }; store.emit() },
    canLead: (p) => canLead(p, S), startProc, ans, nxt, endProc, reset: () => store.reset(),
  };

  /* ----- interaction & input ----- */
  function near() {
    let b = null, bd = 2.8; const t = (x, z, p, f) => { const d = Math.hypot(x - pl.x, z - pl.z); if (d < bd) { bd = d; b = { p, f } } };
    if (!S.owned) t(5, 5, 'E: Buy clinic ' + F(CLINIC_PRICE), api.buy);
    else {
      if (pl.f == 0) { t(14.2, -3.5, 'E: Use management PC', () => { store.ui = { t: 'pc' }; store.emit() }); t(-13.2, -3.5, 'E: Reception PC', () => api.dept('reception')) }
      if (S.lift) t(12.5, -4.4, 'E: Lift', () => { store.ui = { t: 'lift' }; store.emit() });
      Object.values(world.slots).filter((s) => s.f == pl.f).forEach((s) => { const id = S.slots[s.f + '-' + s.i], p = id && P.find((q) => q.room == id); if (id == 'pharmacy') t(s.xc, -7, 'E: Pharmacy PC', api.pharm); else if (p) t(s.xc, -7, id == 'opd' ? 'E: OPD desk (see patients / drills)' : 'E: ' + p.n + ' (station / PC)', () => api.menu(p, s.f + '-' + s.i)); else if (id && (DEPT[id] || ['ct', 'usg', 'mri'].includes(id))) t(s.xc, -7, 'E: ' + ROOMS[id].n + ' PC', () => api.dept(s.f + '-' + s.i)) });
    }
    return b;
  }
  const kd = (e) => { if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; const k = e.key.toLowerCase(); keys[k] = 1; if (k == 'v' && !store.ui) tp = !tp; if (k == 'b' && S.owned) { if (!store.ui) api.openBuild(); else if (store.ui.t == 'build') api.close() } if (store.ui && store.ui.t == 'lift' && +k >= 1 && +k <= S.floors) api.lift(+k - 1); if (k == 'escape' && store.ui && store.ui.t != 'story') api.close(); if (k == 'e' && act()) { const n = near(); if (n) n.f() } };
  const ku = (e) => { delete keys[e.key.toLowerCase()] };
  const md = () => { drag = 1; if (!store.started) { store.started = true; store.emit() } try { canvas.requestPointerLock() } catch (e) {} };
  const mu = () => { drag = 0 };
  const mm = (e) => { if ((document.pointerLockElement == canvas || drag) && act()) { pl.yaw -= e.movementX * .0022; pl.pit = Math.max(-1.3, Math.min(1.3, pl.pit - e.movementY * .0022)) } };
  const rs = () => { rd.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix() };
  addEventListener('keydown', kd); addEventListener('keyup', ku); addEventListener('mouseup', mu); addEventListener('mousemove', mm); addEventListener('resize', rs); canvas.addEventListener('mousedown', md); rs();

  /* ----- main loop ----- */
  function loop(n) {
    raf = requestAnimationFrame(loop); const dt = Math.min(.1, (n - last) / 1000); last = n; TT = n / 1000;
    const a = TT / 66 + 1.2; world.setSky(a, hemi, sun, rd);
    const hm = Math.floor(((a / (2 * Math.PI) * 24 + 6) % 24) * 6); if (hm !== store._hm) { store._hm = hm; const hh = Math.floor(hm / 6), mm = (hm % 6) * 10; store.clock = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); store.night = hh < 6 || hh >= 19; store.emit() }
    world.cars.forEach((c) => { c.position.x += c.dir * 6 * dt; if (Math.abs(c.position.x) > 70) c.position.x *= -1 }); mixers.forEach((m) => m.update(dt)); world.fm.update(dt);
    const PR = store.PR, fy = pl.f * FH;
    if (act()) {
      const sp = keys.shift ? 6.5 : 3.6, f = (keys.w ? 1 : 0) - (keys.s ? 1 : 0), r = (keys.d ? 1 : 0) - (keys.a ? 1 : 0), sn = Math.sin(pl.yaw), cs = Math.cos(pl.yaw), k = Math.min(1, dt * 10);
      pl.vx += ((-sn * f + cs * r) * sp - pl.vx) * k; pl.vz += ((-cs * f - sn * r) * sp - pl.vz) * k; pl.x += pl.vx * dt; pl.z += pl.vz * dt; pl.bt += Math.hypot(pl.vx, pl.vz) * dt * 2.2;
      for (const c of C) {
        if (c[4] !== pl.f) continue;
        const cx = Math.max(c[0], Math.min(pl.x, c[2])), cz = Math.max(c[1], Math.min(pl.z, c[3])), dx = pl.x - cx, dz = pl.z - cz, d = Math.hypot(dx, dz);
        if (d < .35) { if (d > 1e-4) { pl.x += dx / d * (.35 - d); pl.z += dz / d * (.35 - d) } else pl.x += .35 }
      }
      pl.x = Math.max(-60, Math.min(60, pl.x)); pl.z = Math.max(-40, Math.min(60, pl.z));
    } else {
      if (document.pointerLockElement) document.exitPointerLock(); pl.vx = pl.vz = 0;
      if (PR) { const dx = PR.look.x - pl.x, dz = PR.look.z - pl.z, ty = Math.atan2(-dx, -dz), tpt = Math.atan2(-.75, Math.hypot(dx, dz)); pl.yaw += (ty - pl.yaw) * .1; pl.pit += (tpt - pl.pit) * .1 }
    }
    const sp2 = Math.hypot(pl.vx, pl.vz); me.visible = !!tp; me.position.set(pl.x, fy, pl.z); me.userData.sy = 0; me.rotation.y = pl.yaw + Math.PI; me.mv = sp2 > .4; me.run = sp2 * 2.4; me.work = (!!PR && PR.mode != 'obs') || !!(store.examAnim && performance.now() < store.examAnim.until && store.sit); me.sit = !!store.sit; anim(me, dt, TT);
    if (tp) {
      let d = 3.4; const fx = Math.sin(pl.yaw), fz = Math.cos(pl.yaw);
      while (d > .5 && C.some((c) => c[4] === pl.f && pl.x + fx * d > c[0] - .2 && pl.x + fx * d < c[2] + .2 && pl.z + fz * d > c[1] - .2 && pl.z + fz * d < c[3] + .2)) d -= .3;
      cam.position.set(pl.x + fx * d, fy + 1.75 - Math.sin(pl.pit) * d * .9, pl.z + fz * d);
    } else cam.position.set(pl.x, fy + (store.sit ? 1.32 : 1.65) + Math.sin(pl.bt) * .035, pl.z);
    cam.rotation.set(pl.pit, pl.yaw, 0);
    const nr = act() ? near() : null, pt = nr ? nr.p : ''; if (pt !== store.prompt) { store.prompt = pt; store.emit() }
    if (store.fl !== pl.f) { store.fl = pl.f; store.emit() }
    if (!PR || PR.done) { dayT += dt; spT += dt } if (dayT > 15) { dayT = 0; sim.nextDay() } if (spT > 4) { spT = 0; sim.spawn() }
    if (PR && PR.mode == 'obs' && !PR.done) { PR.tm += dt; if (PR.tm > 3) nxt() }
    sim.npcs(dt, TT); rd.render(sc, cam);
  }
  sim.layoutStaff(1); raf = requestAnimationFrame(loop);
  return { api, destroy() { cancelAnimationFrame(raf); removeEventListener('keydown', kd); removeEventListener('keyup', ku); removeEventListener('mouseup', mu); removeEventListener('mousemove', mm); removeEventListener('resize', rs); canvas.removeEventListener('mousedown', md); rd.dispose() } };
}
