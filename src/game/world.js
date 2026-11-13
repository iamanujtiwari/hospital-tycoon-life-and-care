// The 3D world: sky, street, parking lot, building floors, rooms, props, lighting. Edit layout / look here.
import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { H, FH, ROOMS } from './config.js';
import { mat } from './people.js';
import { createFurniture } from './furniture.js';
import { LOBBY, LAYOUT } from '../data/catalog.js';

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d), cyl = (a, b, h, n = 14) => new THREE.CylinderGeometry(a, b, h, n);
function tex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; t.encoding = THREE.sRGBEncoding; return t;
}
const speckle = (x, w, h, n, cols, s = 2) => { for (let i = 0; i < n; i++) { x.fillStyle = cols[Math.random() * cols.length | 0]; x.fillRect(Math.random() * w, Math.random() * h, s, s) } };
const std = (o) => new THREE.MeshStandardMaterial(o);
const basic = (t) => new THREE.MeshBasicMaterial({ map: t });
const sign = (w, h, draw) => basic(tex(w, h, draw));
const label = (t, w = 3.4) => {
  const c = document.createElement('canvas'); c.width = 320; c.height = 64; const x = c.getContext('2d');
  x.fillStyle = 'rgba(16,28,42,.88)'; x.fillRect(0, 0, 320, 64); x.fillStyle = '#2dd4bf'; x.fillRect(0, 58, 320, 6); x.fillStyle = '#fff'; x.font = 'bold 28px system-ui,sans-serif'; x.textAlign = 'center'; x.fillText(t, 160, 40);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c) })); s.scale.set(w, w * .2, 1); return s;
};

export function createWorld(sc, S, rd) {
  const C = [], cars = [], lamps = [], lobby = [], slots = {};
  let door, saleSign, roof, clinicMat, nightOn = null;
  const env = new THREE.PMREMGenerator(rd).fromScene(new RoomEnvironment()).texture;
  const M = { wall: mat(S.paint.wall, .92), ext: mat(S.paint.ext, .85), roof: mat(0x59606a, .9), metal: mat(0x8d96a0, .35, .8), wood: mat(0x8a6240, .55), dark: mat(0x2b3036, .6, .3), white: mat(0xf4f6f8, .5), marble: mat(0xeef0f2, .22, .1), green: mat(0x3f8f4f, .9) };
  M.floor = std({ map: tex(256, 256, (x, w, h) => { x.fillStyle = '#f6f6f6'; x.fillRect(0, 0, w, h); speckle(x, w, h, 500, ['#ececec', '#e4e4e4']); x.strokeStyle = '#cfcfcf'; x.lineWidth = 4; x.strokeRect(0, 0, w, h); x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.stroke() }, 30, 10), color: S.paint.floor, roughness: .3, metalness: .08, side: 2 });
  const ceilM = std({ map: tex(256, 256, (x, w, h) => { x.fillStyle = '#f3f5f7'; x.fillRect(0, 0, w, h); x.strokeStyle = '#c9ced3'; x.lineWidth = 3; x.strokeRect(0, 0, w, h); x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.stroke() }, 30, 10), roughness: .95, side: 2 });
  const glass = std({ color: 0x9fc7e8, roughness: .05, metalness: .3, transparent: true, opacity: .32, envMap: env, envMapIntensity: .9, emissive: 0x000000, side: 2 });
  const hl = std({ color: 0xffffff, emissive: 0xfff2c0, emissiveIntensity: .25 }), tl = std({ color: 0xff3030, emissive: 0xff2020, emissiveIntensity: .4 });
  function B(x1, z1, x2, z2, h, col, solid = 1, y0 = 0, fl = 0) {
    if (x1 > x2) [x1, x2] = [x2, x1]; if (z1 > z2) [z1, z2] = [z2, z1];
    if (x2 - x1 < .3) { x1 -= .15; x2 += .15 } if (z2 - z1 < .3) { z1 -= .15; z2 += .15 }
    const m = new THREE.Mesh(box(x2 - x1, h, z2 - z1), typeof col == 'object' ? col : mat(col));
    m.position.set((x1 + x2) / 2, y0 + h / 2, (z1 + z2) / 2); m.castShadow = !!solid; m.receiveShadow = true; sc.add(m);
    if (solid) { m.c = [x1, z1, x2, z2, fl]; C.push(m.c) } return m;
  }
  const rm = (m) => { sc.remove(m); if (m.extra) sc.remove(m.extra); if (m.c) C.splice(C.indexOf(m.c), 1) };
  const D = (geo, m, x, y, z, parent = sc) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.receiveShadow = true; parent.add(o); return o };
  const plane = (w, d, x, y, z, m) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, d), typeof m == 'object' ? m : mat(m)); o.rotation.x = -Math.PI / 2; o.position.set(x, y, z); o.receiveShadow = true; sc.add(o); return o };
  const poster = (w, h, x, y, z, draw) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), sign(256, Math.round(256 * h / w), draw)); o.position.set(x, y, z); sc.add(o); return o };

  /* ---------- sky, stars, moon ---------- */
  const sky = new Sky(); sky.scale.setScalar(4000); sc.add(sky);
  Object.assign(sky.material.uniforms, { turbidity: { value: 5 }, rayleigh: { value: 1.3 }, mieCoefficient: { value: .004 }, mieDirectionalG: { value: .8 } });
  const sp = new Float32Array(1800 * 3); for (let i = 0; i < 1800; i++) { const a = Math.random() * 6.283, e = Math.random() * 1.4 + .05; sp.set([Math.cos(a) * Math.cos(e) * 1500, Math.sin(e) * 1500, Math.sin(a) * Math.cos(e) * 1500], i * 3) }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false })); sc.add(stars);
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 8, 64, 64, 60); g.addColorStop(0, '#fff'); g.addColorStop(.35, '#eef3ff'); g.addColorStop(.4, 'rgba(200,215,255,.25)'); g.addColorStop(1, 'rgba(200,215,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128) }), fog: false, depthWrite: false })); moon.scale.set(160, 160, 1); sc.add(moon);
  const fogDay = new THREE.Color(0xc4dcf0), fogNight = new THREE.Color(0x0a0f1c), sd = new THREE.Vector3();
  function setSky(a, hemi, sun, rd) {
    const sh = Math.sin(a), br = Math.max(0, Math.min(1, sh * 1.6 + .5)), n = 1 - br;
    sd.set(Math.cos(a) * .8, sh, .45).normalize(); sky.material.uniforms.sunPosition.value.copy(sd);
    sun.position.set(sd.x * 60, Math.max(8, sd.y * 60), sd.z * 60); sun.intensity = 2.4 * br; sun.color.setHSL(.1, .55 * (1 - Math.min(1, sh * 2.2)), .92);
    hemi.intensity = .14 + .9 * br; rd.toneMappingExposure = .72;
    stars.material.opacity = Math.min(1, n * n * 1.4); moon.position.set(-sd.x * 1200, Math.max(40, -sd.y * 1200), -sd.z * 1200); moon.material.opacity = Math.min(1, n * 1.3);
    sc.fog.color.copy(fogDay).lerp(fogNight, Math.min(1, n * 1.15));
    const ns = br < .5; if (ns !== nightOn) { nightOn = ns; setNight(ns) } return br;
  }
  /* ---------- ground, street, parking ---------- */
  const grass = tex(256, 256, (x, w, h) => { x.fillStyle = '#5d9650'; x.fillRect(0, 0, w, h); speckle(x, w, h, 2600, ['#4f8a45', '#6aa65a', '#548f4a', '#79b265']) }, 60, 60);
  const asph = tex(256, 256, (x, w, h) => { x.fillStyle = '#3b3e43'; x.fillRect(0, 0, w, h); speckle(x, w, h, 3000, ['#2f3237', '#474b51', '#555a60']) }, 1, 1);
  const brick = tex(256, 256, (x, w, h) => { x.fillStyle = '#c3b9a8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#8f877a'; x.lineWidth = 3; for (let r = 0; r < 8; r++) { x.beginPath(); x.moveTo(0, r * 32); x.lineTo(w, r * 32); x.stroke(); for (let c = (r % 2) * 32; c < w; c += 64) { x.beginPath(); x.moveTo(c, r * 32); x.lineTo(c, r * 32 + 32); x.stroke() } } }, 1, 1);
  const rep = (t, a, b) => { const c = t.clone(); c.needsUpdate = true; c.repeat.set(a, b); return std({ map: c, roughness: .95 }) };
  plane(400, 400, 0, -.01, 0, std({ map: grass, roughness: 1 })); plane(300, 10, 0, .02, 22, rep(asph, 40, 2)); plane(44, 13, 0, .015, 9.5, rep(asph, 8, 3));
  plane(60, 1.6, 0, .017, .8, rep(brick, 12, 1)); plane(4, 14, 0, .018, 8.2, rep(brick, 1, 3));
  const wh = mat(0xf2f2f2, .8); B(-150, 16.8, 150, 17.1, .14, 0x9a9a9a, 0); B(-150, 26.9, 150, 27.2, .14, 0x9a9a9a, 0);
  const dash = new THREE.InstancedMesh(box(2, .02, .18), wh, 60), mt4 = new THREE.Matrix4(); for (let i = 0; i < 60; i++) { mt4.setPosition(-148 + i * 5, .03, 22); dash.setMatrixAt(i, mt4) } sc.add(dash);
  for (let i = 0; i < 7; i++) plane(.5, 9.4, -3 + i, .03, 22, wh);
  for (let x = -16; x <= 16; x += 4) if (Math.abs(x) > 2) B(x - .06, 3.5, x + .06, 8.5, .02, 0xffffff, 0, .02);
  plane(2.2, 2.2, -6, .03, 6, mat(0x2f6fd6, .8));
  function tree(x, z, s = 1) { const t = D(cyl(.25 * s, .35 * s, 2.4 * s, 8), mat(0x5b3f2a, 1), x, 1.2 * s, z); t.castShadow = true; [[0, 3, 0, 1.5], [.5, 3.9, .2, 1.15], [-.4, 4.6, -.2, .9]].forEach((p, i) => { const l = D(new THREE.IcosahedronGeometry(p[3] * s, 1), mat(i ? 0x4f9a50 : 0x3b7d3e, .95), x + p[0] * s, p[1] * s, z + p[2] * s); l.castShadow = true; l.material.flatShading = true }) }
  [[-30, -5], [-38, 10], [-26, 29], [30, -8], [40, 12], [28, 31], [-14, -24], [10, -26], [36, -20], [-40, -18], [-24, 4], [24, 4], [-30, 14, .8], [32, 14, .8]].forEach((p) => tree(p[0], p[1], p[2] || 1));
  [-14, -9, 9, 14].forEach((x) => D(new THREE.SphereGeometry(.7, 10, 8), M.green, x, .45, 1.3).scale.set(1.3, .8, 1));
  function lamp(x, z) {
    B(x - .07, z - .07, x + .07, z + .07, 4.6, M.metal, 1); D(box(.9, .08, .1), M.metal, x + .35, 4.62, z); D(box(.5, .1, .3), M.dark, x + .7, 4.55, z);
    const b = D(box(.4, .04, .22), new THREE.MeshBasicMaterial({ color: 0x6b6f75 }), x + .7, 4.48, z);
    const l = new THREE.PointLight(0xffe2a8, 0, 28, 1.4); l.position.set(x + .7, 4.3, z); sc.add(l);
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(64, 64, (c) => { const g = c.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(255,230,160,1)'); g.addColorStop(1, 'rgba(255,200,100,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64) }), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); h.scale.set(4, 4, 1); h.position.set(x + .7, 4.4, z); h.visible = false; sc.add(h);
    lamps.push({ b, l, h });
  }
  [[-14, 3], [14, 3], [-14, 16], [14, 16], [-30, 16.4], [30, 16.4]].forEach((p) => lamp(p[0], p[1]));
  function bench(x, z) { B(x - .9, z - .25, x + .9, z + .25, .08, M.wood, 0, .45); B(x - .9, z - .28, x + .9, z - .22, .5, M.wood, 0, .5); [-.7, .7].forEach((o) => B(x + o - .04, z - .2, x + o + .04, z + .2, .45, M.dark, 0)); B(x - .95, z - .3, x + .95, z + .3, .5, M.dark, 1, 0) }
  bench(-6, 1.3); bench(6, 1.3);
  B(-27.8, 18.1, -24.2, 18.3, 2.5, glass, 0); B(-28, 17.9, -24, 20.1, .12, M.dark, 0, 2.6); [-27.8, -24.2].forEach((x) => B(x - .05, 18, x + .05, 18.2, 2.6, M.dark, 1)); B(-27.5, 18.4, -24.5, 18.9, .08, M.wood, 0, .45);
  B(-20.4, 2.6, -19.6, 3.4, 3.4, M.dark, 1); poster(3, 1.2, -20, 2.6, 3.45, (x, w, h) => { x.fillStyle = '#0f1c2b'; x.fillRect(0, 0, w, h); x.fillStyle = '#2dd4bf'; x.fillRect(0, 0, w, 14); x.fillStyle = '#fff'; x.font = 'bold 40px system-ui'; x.textAlign = 'center'; x.fillText('CITY CLINIC', w / 2, h * .5); x.font = '22px system-ui'; x.fillText('Emergency · OPD · Pharmacy', w / 2, h * .75) });
  const carPaint = (c) => std({ color: c, roughness: .22, metalness: .65, envMap: env, envMapIntensity: .9 }), carGlass = std({ color: 0x1b2430, roughness: .1, metalness: .4, envMap: env, envMapIntensity: .8 }), tyre = mat(0x111111, .9), rim = mat(0xb0b6bd, .3, .9);
  function car(x, z, col, dir, ry = 0, amb) {
    const g = new THREE.Group(), P = carPaint(col), add = (geo, m, a, b, c) => { const o = new THREE.Mesh(geo, m); o.position.set(a, b, c); o.castShadow = true; g.add(o); return o };
    add(box(4.2, .55, 1.85), P, 0, .65, 0); add(box(1.4, .18, 1.75), P, 1.5, .98, 0); add(box(2.1, .62, 1.72), carGlass, -.3, 1.2, 0); add(box(1.9, .08, 1.62), P, -.3, 1.55, 0);
    [[-1.3, .9], [1.3, .9], [-1.3, -.9], [1.3, -.9]].forEach((w) => { const t = add(cyl(.36, .36, .26, 16), tyre, w[0], .36, w[1]); t.rotation.x = Math.PI / 2; const r = add(cyl(.2, .2, .28, 12), rim, w[0], .36, w[1]); r.rotation.x = Math.PI / 2 });
    [-.65, .65].forEach((o) => { add(box(.08, .14, .4), hl, 2.1, .72, o); add(box(.08, .14, .4), tl, -2.1, .72, o) });
    if (amb) { add(box(4.22, .12, 1.87), mat(0xd62828, .5), 0, .62, 0); add(box(.3, .12, .5), std({ color: 0x3355ff, emissive: 0x2244ff, emissiveIntensity: .8 }), -.8, 1.64, -.4); add(box(.3, .12, .5), std({ color: 0xff3333, emissive: 0xff2222, emissiveIntensity: .8 }), -.8, 1.64, .4) }
    g.position.set(x, 0, z); g.rotation.y = dir < 0 ? Math.PI : ry; g.dir = dir; sc.add(g); if (dir) cars.push(g); return g;
  }
  car(-60, 24.5, 0xc0392b, 1); car(60, 19.5, 0x2e86c1, -1); car(-110, 24.5, 0xf1c40f, 1); car(100, 19.5, 0x27ae60, -1);
  [[-14, 0x34495e], [-6, 0xd9d9d9], [10, 0xc0392b], [14, 0x1f8a70]].forEach((p) => car(p[0], 6, p[1], 0, Math.PI / 2)); car(-10, 6, 0xf5f5f5, 0, Math.PI / 2, 1);
  saleSign = B(4.8, 4.8, 5.2, 5.2, 2.2, M.dark, 0); const sb = poster(3.2, 1.2, 5, 2.7, 5.25, (x, w, h) => { x.fillStyle = '#c1121f'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.font = 'bold 64px system-ui'; x.textAlign = 'center'; x.fillText('FOR SALE', w / 2, h * .48); x.font = '36px system-ui'; x.fillText('₹1,50,000 · Press E', w / 2, h * .8) });
  /* ---------- building ---------- */
  const win = (a, b, y, f) => { const w = b - a, cx = (a + b) / 2; D(box(w, 1.5, .04), glass, cx, y + 1.65, 0); [[w, .08, cx, y + .93], [w, .08, cx, y + 2.37]].forEach((q) => D(box(q[0], q[1], .12), M.dark, q[2], q[3], 0)); [a, b, cx].forEach((x) => D(box(.08, 1.5, .12), M.dark, x, y + 1.65, 0)); D(box(w + .3, .07, .3), M.white, cx, y + .88, .15) };
  function seg(x1, x2, y, f, col, ops) { let cx = x1; ops.forEach(([a, b]) => { if (a > cx) B(cx, 0, a, 0, H, col, 1, y, f); B(a, 0, b, 0, .9, col, 1, y, f); B(a, 0, b, 0, H - 2.4, col, 0, y + 2.4, f); win(a, b, y, f); cx = b }); if (x2 > cx) B(cx, 0, x2, 0, H, col, 1, y, f) }
  function setLab(key) { const s = slots[key], id = S.slots[key]; if (s.lab) sc.remove(s.lab); s.lab = label(id ? ROOMS[id].n : 'Empty bay · build at PC', 3); s.lab.position.set(s.xc, s.y + 2.68, -5.75); sc.add(s.lab) }
  function buildFloor(f) {
    const y = f * FH, E = M.ext, W = M.wall;
    B(-18, -12, 18, -12, H, E, 1, y, f); B(-18, -12, -18, 0, H, E, 1, y, f); B(18, -12, 18, 0, H, E, 1, y, f);
    if (f == 0) {
      seg(-18, -1.6, y, f, E, [[-14, -10]]); seg(1.6, 18, y, f, E, [[10, 14]]); door = B(-1.6, 0, 1.6, 0, H, M.dark, 1, y, f);
      B(-4, 0, 4, 3.4, .22, M.white, 0, H - .3, 0); [-3.7, 3.7].forEach((x) => B(x - .12, 3.1, x + .12, 3.3, H - .3, M.white, 1)); D(box(7.6, .04, .2), new THREE.MeshBasicMaterial({ color: 0xfff6d8 }), 0, H - .33, 3.2);
    } else { seg(-18, 18, y, f, E, [[-14, -10], [-6, -2], [2, 6], [10, 14]]); B(-18, -12, 18, 0, .9, E, 0, y - .9, f) }
    plane(36, 12, 0, y + .03, -6, M.floor); plane(36, 12, 0, y + H, -6, ceilM);
    [-1.2, 1.2].forEach((x) => plane(.25, 5.2, x, y + .04, -2.8, mat(0x2dd4bf, .6)));
    for (let s = 1; s < 6; s++) B(-18 + 6 * s, -12, -18 + 6 * s, -6, H, W, 1, y, f);
    for (let x = -14; x <= 14; x += 7) D(box(2.4, .04, .5), new THREE.MeshBasicMaterial({ color: 0xfffbe6 }), x, y + H - .03, -3);
    const pt = new THREE.PointLight(0xfff4e0, .9, 28, 1.3); pt.position.set(0, y + 2.7, -3); sc.add(pt); lobby.push(pt);
    for (let i = 0; i < 6; i++) {
      const x0 = -18 + 6 * i; B(x0, -6, x0 + 2, -6, H, W, 1, y, f); B(x0 + 4, -6, x0 + 6, -6, H, W, 1, y, f);
      [x0 + 2, x0 + 4].forEach((x) => D(box(.1, 2.6, .34), M.white, x, y + 1.3, -6)); D(box(2.1, .4, .34), M.white, x0 + 3, y + 2.8, -6);
      slots[f + '-' + i] = { f, i, x0, xc: x0 + 3, y, blk: B(x0 + 2, -6, x0 + 4, -6, H, mat(0x9aa0a6, .6, .4), 1, y, f), lab: null, fu: [] }; setLab(f + '-' + i);
    }
    if (S.lift) liftAt(f);
    if (!roof) {
      roof = new THREE.Group(); sc.add(roof); const R = (w, h, d, x, yy, z, m) => { const o = D(box(w, h, d), m || M.roof, x, yy, z, roof); o.castShadow = true; return o };
      R(36.8, .4, 12.8, 0, .2, -6); R(36.8, .7, .3, 0, .75, .3); R(36.8, .7, .3, 0, .75, -12.3); R(.3, .7, 12.8, -18.3, .75, -6); R(.3, .7, 12.8, 18.3, .75, -6);
      [-10, 8].forEach((x) => { R(2.2, 1, 1.6, x, .9, -6, M.metal); const fan = D(cyl(.5, .5, .05, 16), M.dark, x, 1.42, -6, roof) });
      const e = new THREE.Mesh(new THREE.PlaneGeometry(7, .62), sign(512, 45, (x, w, h) => { x.fillStyle = '#10202f'; x.fillRect(0, 0, w, h); x.fillStyle = '#e63946'; x.fillRect(10, 8, 30, 8); x.fillRect(21, -3, 8, 30); x.fillStyle = '#fff'; x.font = 'bold 30px system-ui'; x.textAlign = 'center'; x.fillText('CITY CLINIC', w / 2, 33) })); e.position.set(0, .75, .46); roof.add(e); clinicMat = e.material;
    }
    roof.position.y = y + H;
  }
  const fm = createFurniture({ sc, C, S, slots, glass });
  let gd = [];
  function glassDoors() { gd.forEach((m) => sc.remove(m)); gd = [[-1.9, 0], [1.9, 0]].map(([x]) => D(box(1.2, 2.3, .04), glass, x, 1.15, -.22)); gd.push(D(box(3.8, .2, .3), M.dark, 0, 2.45, 0), D(box(.1, 2.5, .3), M.dark, -1.65, 1.25, 0), D(box(.1, 2.5, .3), M.dark, 1.65, 1.25, 0)) }
  function furnishLobby(fresh = true) { if (fresh) fm.layout(LOBBY, null); glassDoors() }
  function furnishRoom(key, id, fresh = true) {
    const s = slots[key], r = ROOMS[id]; rm(s.blk); s.blk = null; s.fu.push(plane(5.6, 5.6, s.xc, s.y + .045, -9, mat(r.col, .5)));
    if (fresh) fm.layout(LAYOUT[id] || [], s); setLab(key);
  }
  const pose = (key, itemId, lx, lz) => { const s = slots[key], it = s && fm.findIn(s, itemId); return it ? fm.pose(it, lx, lz) : null };
  const deskPose = (key) => { const s = slots[key], p = pose(key, 'desk', 0, -1.05), q = pose(key, 'desk', 0, 1.4); return p ? { x: p.x, z: p.z, ry: p.ry, px: q.x, pz: q.z } : { x: s.x0 + 4.6, z: -11, ry: 0, px: s.x0 + 4.6, pz: -8.6 } };
  function setClinicName() { if (!clinicMat) return; const t = clinicMat.map, x = t.image.getContext('2d'), w = 512, h = 45; x.fillStyle = '#10202f'; x.fillRect(0, 0, w, h); x.fillStyle = '#e63946'; x.fillRect(10, 8, 30, 8); x.fillRect(21, -3, 8, 30); x.fillStyle = '#fff'; x.font = 'bold 30px system-ui'; x.textAlign = 'center'; x.fillText((S.profile.clinic || 'City Clinic').toUpperCase(), w / 2, 33); t.needsUpdate = true }
  function liftAt(f) { B(11.4, -5.95, 13.6, -5.55, 2.6, mat(0x55606b, .3, .8), 1, f * FH, f); D(box(1.2, 2.2, .05), mat(0x9aa5b1, .25, .9), 12.5, f * FH + 1.1, -5.5); const lf = label('LIFT', 1.6); lf.position.set(12.5, f * FH + 2.9, -5.7); sc.add(lf) }
  function installLift() { for (let f = 0; f < S.floors; f++) liftAt(f) }
  function buyShell(fresh = true) { rm(door); sc.remove(saleSign); sc.remove(sb); furnishLobby(fresh) }
  function setNight(n) {
    lamps.forEach((l) => { l.b.material.color.setHex(n ? 0xfff0b8 : 0x6b6f75); l.l.intensity = n ? 2.4 : 0; l.h.visible = n });
    glass.emissive.setHex(n ? 0x7a6420 : 0); glass.emissiveIntensity = n ? .8 : 0; lobby.forEach((l) => (l.intensity = n ? 1.8 : .9)); hl.emissiveIntensity = n ? 2.6 : .25; tl.emissiveIntensity = n ? 1.8 : .4;
  }
  function applyPaint() { M.wall.color.setHex(S.paint.wall); M.floor.color.setHex(S.paint.floor); M.ext.color.setHex(S.paint.ext) }
  for (let f = 0; f < S.floors; f++) buildFloor(f);
  Object.entries(S.slots).forEach(([k, id]) => furnishRoom(k, id, false));
  if (S.owned) buyShell(false);
  fm.restore(); setClinicName();
  return { C, slots, cars, B, rm, buildFloor, furnishRoom, buyShell, setNight, applyPaint, installLift, setSky, fm, pose, deskPose, setClinicName };
}
