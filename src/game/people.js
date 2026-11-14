import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { MODELS } from './models.config.js';

export const mat = (c, r = .8, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
export const mixers = []; // animation mixers of equipment models
const loader = new GLTFLoader(), cache = {};
export function loadGLB(url) {
  cache[url] = cache[url] || new Promise((ok, no) => loader.load(url, ok, undefined, no));
  return cache[url].then((g) => ({ scene: clone(g.scene), clips: g.animations }));
}
// Swap a placeholder box for a real model (see models.config.js).
export function overrideEquipment(sc, m, key) {
  const url = MODELS.equipment[key]; if (!url) return;
  loadGLB(url).then(({ scene, clips }) => {
    const t = new THREE.Box3().setFromObject(m), tz = t.getSize(new THREE.Vector3()), sz = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(Math.min(tz.x / sz.x, tz.y / sz.y, tz.z / sz.z));
    const nb = new THREE.Box3().setFromObject(scene), c = t.getCenter(new THREE.Vector3());
    scene.position.add(new THREE.Vector3(c.x - (nb.min.x + nb.max.x) / 2, t.min.y - nb.min.y, c.z - (nb.min.z + nb.max.z) / 2));
    m.visible = false; m.extra = scene; sc.add(scene);
    if (clips[0]) { const mx = new THREE.AnimationMixer(scene); mx.clipAction(clips[0]).play(); mixers.push(mx); }
  }).catch(() => {});
}
const SKIN = [0xf1c9a5, 0xd9a577, 0xb67e55, 0x8a5a3c], HAIR = [0x17120e, 0x3b2a1e, 0x6b4a2f, 0x8a8a8a, 0x2a1a12];
const LOOK = { doc: { coat: 0xffffff, pants: 0x2b3340, steth: 1 }, nurse: { pants: 0x2f9c95, cap: 1 }, tech: { pants: 0x3b3f5c, coat: 0xe9eef2 }, recep: { pants: 0x2a2f3a, badge: 1 },
  hk: { pants: 0x4a5560 }, pharm: { coat: 0xf2fff6, pants: 0x2b3340, badge: 1 }, player: { coat: 0xffffff, pants: 0x20262e, steth: 1 }, patient: { pants: 0x3a4a63 } };
function limb(g, x, y, r, len, mt, end) {
  const p = new THREE.Group(), m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), mt);
  m.position.y = -(len / 2 + r); m.castShadow = true; p.add(m);
  if (end) { end.position.y = -(len + 2 * r) + (end.userData.dy || 0); end.castShadow = true; p.add(end) }
  p.position.set(x, y, 0); g.add(p); return p;
}
// role keys match models.config.js: player, doc, nurse, tech, recep, hk, pharm, patient
export function person(sc, c, role, look = {}) {
  const L = LOOK[role] || {}, g = new THREE.Group(), u = g.userData, skin = mat(look.skin != null ? look.skin : SKIN[Math.random() * 4 | 0], .6), body = mat(c, .75), pants = mat(L.pants || 0x2b3340, .8), hairM = mat(look.hair != null ? look.hair : HAIR[Math.random() * 5 | 0], .9);
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o };
  add(new THREE.CapsuleGeometry(.2, .3, 6, 14), body, 0, 1.2, 0).scale.set(1, 1, .72);
  add(new THREE.BoxGeometry(.37, .2, .24), pants, 0, .93, 0); add(new THREE.CylinderGeometry(.055, .065, .1, 10), skin, 0, 1.6, 0);
  add(new THREE.SphereGeometry(.12, 20, 16), skin, 0, 1.73, 0).scale.set(.95, 1.12, 1);
  if (look.style != 'none') add(new THREE.SphereGeometry(.128, 20, 12, 0, 6.3, 0, 1.55), hairM, 0, 1.745, -.006);
  if (look.style ? look.style == 'long' : Math.random() < .4 && role != 'doc') add(new THREE.CapsuleGeometry(.11, .2, 4, 10), hairM, 0, 1.6, -.1);
  [-.045, .045].forEach((x) => add(new THREE.SphereGeometry(.014, 8, 8), mat(0x111111), x, 1.745, .112)); add(new THREE.SphereGeometry(.02, 8, 8), skin, 0, 1.715, .12);
  if (L.coat) { const cm = mat(look.coat || L.coat, .8); cm.side = 2; add(new THREE.CylinderGeometry(.24, .34, .85, 18, 1, true), cm, 0, 1.02, 0).scale.set(1, 1, .8) }
  if (L.steth) { const s = add(new THREE.TorusGeometry(.1, .012, 8, 16), mat(0x222222, .4, .5), 0, 1.5, .03); s.rotation.x = Math.PI / 2.4 }
  if (L.cap) add(new THREE.BoxGeometry(.2, .06, .14), mat(0xffffff), 0, 1.865, 0);
  if (L.badge) add(new THREE.BoxGeometry(.07, .045, .01), mat(0xffffff), .1, 1.3, .15);
  const hand = () => { const h = new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), skin); h.userData.dy = -.01; return h }, shoe = () => { const s = new THREE.Mesh(new THREE.BoxGeometry(.12, .07, .26), mat(0x16191d, .5)); s.position.z = .05; s.userData.dy = .03; return s };
  u.aL = limb(g, -.27, 1.45, .055, .46, body, hand()); u.aR = limb(g, .27, 1.45, .055, .46, body, hand());
  u.lL = limb(g, -.1, .88, .075, .6, pants, shoe()); u.lR = limb(g, .1, .88, .075, .6, pants, shoe()); u.ph = 0; sc.add(g);
  const url = MODELS.people[role];
  if (url) loadGLB(url).then(({ scene, clips }) => {
    g.clear(); const b = new THREE.Box3().setFromObject(scene), s = 1.75 / (b.max.y - b.min.y);
    scene.scale.setScalar(s); scene.position.y = -b.min.y * s; g.add(scene);
    scene.traverse((o) => { if (o.isMesh) o.castShadow = true; });          // NEW: model casts shadows
    const find = (n) => scene.getObjectByName(n);
    if (find('ArmL') && find('LegL')) {                                      // NEW: jointed model (doctor.glb)
      u.aL = find('ArmL'); u.aR = find('ArmR'); u.lL = find('LegL'); u.lR = find('LegR');   // reuse the swing animation in anim()
    } else {                                                                 // model with baked animation clips
      const mx = new THREE.AnimationMixer(scene), act = {};
      ['idle', 'walk', 'work'].forEach((k) => { const cl = clips.find((x) => x.name.toLowerCase().includes(k)); if (cl) act[k] = mx.clipAction(cl); });
      u.mx = mx; u.act = act;
    }
  }).catch((e) => console.error('model failed to load:', url, e));          // NEW: shows the real error in the console
  return g;
}
export function anim(m, dt, t) {
  const u0 = m.userData, sy = m.sit ? -.42 : 0; if (u0.sy == null) u0.sy = 0; if (sy !== u0.sy) { m.position.y += sy - u0.sy; u0.sy = sy }
  if (m.sit && !u0.mx) { u0.lL.rotation.x = u0.lR.rotation.x = -1.5; u0.aL.rotation.x = -.45; u0.aR.rotation.x = m.exam == 'arms' ? -1.5 : -.45; if (m.work) { u0.aL.rotation.x = -1.05 + Math.sin(t * 7) * .08; u0.aR.rotation.x = -1.05 + Math.sin(t * 7 + 2) * .08 } return }
  const u = m.userData;
  if (u.mx) {
    const a = u.act[m.mv ? 'walk' : m.work ? 'work' : 'idle'] || u.act.idle;
    if (a && u.cur !== a) { if (u.cur) u.cur.fadeOut(.2); a.reset().fadeIn(.2).play(); u.cur = a; }
    u.mx.update(dt); return;
  }
  if (m.mv) { u.ph += dt * (m.run || 8); const s = Math.sin(u.ph) * .65; u.lL.rotation.x = s; u.lR.rotation.x = -s; u.aL.rotation.x = -s * .7; u.aR.rotation.x = s * .7; }
  else if (m.work) { u.aL.rotation.x = -1.05 + Math.sin(t * 7) * .08; u.aR.rotation.x = -1.05 + Math.sin(t * 7 + 2) * .08; u.lL.rotation.x = u.lR.rotation.x = 0; }
  else ['aL', 'aR', 'lL', 'lR'].forEach((k) => (u[k].rotation.x *= .85));
}