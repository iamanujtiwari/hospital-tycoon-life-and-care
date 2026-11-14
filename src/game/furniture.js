// Furniture manager: builds items from the catalog, placement rules, colliders, GIF/image screens, 3D-model overrides.
import * as THREE from 'three';
import { ITEMS, COL } from '../data/catalog.js';
import { MODELS } from './models.config.js';
import { mat, mixers, loadGLB } from './people.js';
import { FH } from './config.js';
import { parseGIF, decompressFrames } from 'gifuct-js';

export function createFurniture({ sc, C, S, slots, glass }) {
  const live = new Map(), own = new Set(), mats = {}, screens = {};
  const metallic = ['metal', 'steel'];
  const M = (k) => mats[k] || (mats[k] = typeof k == 'number' ? mat(k, .7) : k == 'lamp' ? new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4d6, emissiveIntensity: .9 }) : k == 'glass' ? glass : mat(COL[k] ?? 0x888888, metallic.includes(k) ? .35 : .7, metallic.includes(k) ? .7 : 0));
  /* ----- screens: animated GIFs are decoded frame by frame (works in every browser), PNG/JPG drawn as-is ----- */
  async function loadScreen(s) {
    try {
      const res = await fetch(s.url); if (!res.ok) { s.err = 'not found: public/' + s.url; return }
      const buf = await res.arrayBuffer(), u8 = new Uint8Array(buf);
      if (u8[0] == 71 && u8[1] == 73 && u8[2] == 70) {
        const g = parseGIF(buf), fr = decompressFrames(g, true), W = g.lsd.width, H = g.lsd.height, comp = document.createElement('canvas'); comp.width = W; comp.height = H;
        const cx = comp.getContext('2d'); let prev = null, total = 0; s.frames = [];
        fr.forEach((f) => {
          if (prev && prev.disposalType == 2) cx.clearRect(prev.dims.left, prev.dims.top, prev.dims.width, prev.dims.height);
          const p = document.createElement('canvas'); p.width = f.dims.width; p.height = f.dims.height; p.getContext('2d').putImageData(new ImageData(f.patch, f.dims.width, f.dims.height), 0, 0); cx.drawImage(p, f.dims.left, f.dims.top);
          const snap = document.createElement('canvas'); snap.width = W; snap.height = H; snap.getContext('2d').drawImage(comp, 0, 0);
          let d = f.delay || 100; if (d < 20) d *= 10; total += d; s.frames.push({ c: snap, d }); prev = f;
        });
        s.total = total; s.ok = 1;
      } else { const img = new Image(); img.onload = () => { s.img = img; s.ok = 1 }; img.onerror = () => { s.err = 'cannot read image' }; img.src = URL.createObjectURL(new Blob([buf])) }
    } catch (e) { s.err = 'cannot load ' + s.url }
  }
  function screenMat(url, label, asp = 1.6) {
    if (screens[url]) return screens[url].m;
    const c = document.createElement('canvas'); c.width = asp >= 1 ? 400 : Math.round(400 * asp); c.height = asp >= 1 ? Math.round(400 / asp) : 400; const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
    const s = screens[url] = { c, x: c.getContext('2d'), t, ok: 0, label, url, m: new THREE.MeshBasicMaterial({ map: t }) }; loadScreen(s); return s.m;
  }
  let acc = 0;
  function update(dt) {
    acc += dt; if (acc < .05) return; acc = 0; const k = performance.now() / 1000;
    Object.values(screens).forEach((s) => {
      const x = s.x, w = s.c.width, h = s.c.height;
      if (s.ok && s.frames) { let t = performance.now() % s.total, i = 0; while (i < s.frames.length - 1 && t >= s.frames[i].d) { t -= s.frames[i].d; i++ } x.drawImage(s.frames[i].c, 0, 0, w, h) }
      else if (s.ok && s.img) x.drawImage(s.img, 0, 0, w, h);
      else {
        const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, `hsl(${(k * 30) % 360},55%,22%)`); g.addColorStop(1, `hsl(${(k * 30 + 90) % 360},55%,34%)`); x.fillStyle = g; x.fillRect(0, 0, w, h);
        x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect((k * 60) % (w + 80) - 40, 0, 40, h); x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = `bold ${Math.round(w / 18)}px system-ui`; x.fillText(s.label, w / 2, h / 2 - 6);
        x.font = `${Math.round(w / 30)}px system-ui`; x.fillText(s.err || (s.url.startsWith('data:') ? 'uploaded image' : 'loading ' + s.url), w / 2, h / 2 + 18);
      }
      s.t.needsUpdate = true;
    });
  }
  /* ----- mesh building ----- */
  function build(def, rec) {
    const g = new THREE.Group(), parts = def.gen ? def.gen() : def.parts; let top = 0;
    const add = (geo, m, x, y, z, cast = true) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = true; g.add(o); return o };
    parts.forEach((p) => {
      const k = p[0];
      if (k == 'b') { add(new THREE.BoxGeometry(p[1], p[2], p[3]), M(p[7]), p[4], p[5], p[6]); top = Math.max(top, p[5] + p[2] / 2) }
      else if (k == 'c') { add(new THREE.CylinderGeometry(p[1] / 2, p[1] / 2, p[2], 14), M(p[6]), p[3], p[4], p[5]); top = Math.max(top, p[4] + p[2] / 2) }
      else if (k == 'w') { add(new THREE.CylinderGeometry(p[1] / 2, p[1] / 2, p[2], 14), M(p[6]), p[3], p[4], p[5]).rotation.z = Math.PI / 2 }
      else if (k == 's') { add(new THREE.SphereGeometry(p[1] / 2, 12, 10), M(p[5]), p[2], p[3], p[4]); top = Math.max(top, p[3] + p[1] / 2) }
      else if (k == 't') { add(new THREE.TorusGeometry(p[1], p[2], 14, 36), M(p[6]), p[3], p[4], p[5]); top = Math.max(top, p[4] + p[1] + p[2]) }
      else if (k == 'scr') add(new THREE.PlaneGeometry(p[1], p[2]), screenMat(rec.img || 'gifs/' + (def.gif || rec.id) + '.gif', def.n, p[1] / p[2]), p[3], p[4], p[5], false);
    });
    def.hh = def.hh || top || 1; return g;
  }
  function applyModel(g, def, rec) {
    const url = MODELS.equipment[rec.id]; if (!url) return;
    loadGLB(url).then(({ scene, clips }) => {
      const sz = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3()); scene.scale.setScalar(Math.min(def.w / sz.x, def.d / sz.z, def.hh / sz.y));
      const nb = new THREE.Box3().setFromObject(scene); scene.position.set(-(nb.min.x + nb.max.x) / 2, -nb.min.y, -(nb.min.z + nb.max.z) / 2);
      g.children.forEach((c) => (c.visible = false)); g.add(scene);
      if (clips[0]) { const mx = new THREE.AnimationMixer(scene); mx.clipAction(clips[0]).play(); mixers.push(mx) }
    }).catch(() => {});
  }
  /* ----- placement rules ----- */
  const foot = (r) => { const d = ITEMS[r.id], sw = r.ry % 180 != 0, w = (sw ? d.d : d.w) / 2, h = (sw ? d.w : d.d) / 2; return [r.x - w, r.z - h, r.x + w, r.z + h] };
  const ov = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  const reserved = (f) => { const r = [[11, -5.6, 14, -3.8]]; if (f == 0) r.push([-1.8, -5, 1.8, 0]); Object.values(slots).filter((s) => s.f == f).forEach((s) => r.push([s.x0 + 2, -8.6, s.x0 + 4, -6.1])); return r };
  function canPlace(r) {
    const d = ITEMS[r.id], b = foot(r);
    if (b[0] < -17.85 || b[2] > 17.85 || b[1] < -11.85 || b[3] > -.15) return false;
    if (d.solid === false) return true;
    if (reserved(r.f).some((q) => ov(b, q))) return false;
    if (C.some((c) => c[4] === r.f && !own.has(c) && ov(b, c))) return false;
    return [...live.values()].every((o) => o.rec === r || o.rec.f !== r.f || ITEMS[o.rec.id].solid === false || !ov(b, foot(o.rec)));
  }
  function place(o) {
    const r = o.rec; o.g.position.set(r.x, r.f * FH, r.z); o.g.rotation.y = r.ry * Math.PI / 180;
    if (ITEMS[r.id].solid !== false) { if (!o.coll) { o.coll = [0, 0, 0, 0, r.f]; C.push(o.coll); own.add(o.coll) } o.coll.splice(0, 5, ...foot(r), r.f) }
  }
  function spawn(r) { const def = ITEMS[r.id], g = build(def, r); sc.add(g); const o = { rec: r, g, coll: null }; live.set(r.uid, o); place(o); applyModel(g, def, r); return o }
  function despawn(uid) { const o = live.get(uid); if (!o) return null; sc.remove(o.g); if (o.coll) { C.splice(C.indexOf(o.coll), 1); own.delete(o.coll) } live.delete(uid); return o.rec }
  function remove(uid) { const r = despawn(uid); if (r) S.items.splice(S.items.indexOf(r), 1); return r }
  function layout(list, slot) { list.forEach(([id, x, z, ry]) => { const r = { uid: ++S.uid, id, x: slot ? slot.x0 + x : x, z, f: slot ? slot.f : 0, ry }; S.items.push(r); spawn(r) }) }
  function autoPlace(id, f, px, pz) {
    const c = []; for (let x = -17.5; x <= 17.5; x += .5) for (let z = -11.5; z <= -.5; z += .5) c.push([x, z]);
    c.sort((a, b) => Math.hypot(a[0] - px, a[1] - pz) - Math.hypot(b[0] - px, b[1] - pz));
    for (const [x, z] of c) { const r = { uid: ++S.uid, id, x, z, f, ry: 0 }; if (canPlace(r)) { S.items.push(r); spawn(r); return r } } return null;
  }
  const setPos = (uid, x, z, ry) => { const o = live.get(uid); if (!o) return; o.rec.x = x; o.rec.z = z; if (ry != null) o.rec.ry = ry; place(o) };
  const valid = (uid) => { const o = live.get(uid); return !!o && canPlace(o.rec) };
  function rotate(uid) { const o = live.get(uid); if (!o) return; const old = o.rec.ry; o.rec.ry = (old + 90) % 360; if (!canPlace(o.rec)) o.rec.ry = old; place(o) }
  function setImg(uid, url) { const o = live.get(uid); if (!o) return; o.rec.img = url; const r = o.rec; despawn(uid); spawn(r) }
  const restore = () => S.items.forEach(spawn);
  const findIn = (s, id) => { for (const o of live.values()) { const r = o.rec; if (r.id == id && r.f == s.f && r.x > s.x0 && r.x < s.x0 + 6 && r.z < -6) return r } return null };
  const pose = (r, lx, lz) => { const a = r.ry * Math.PI / 180; return { x: r.x + lx * Math.cos(a) + lz * Math.sin(a), z: r.z - lx * Math.sin(a) + lz * Math.cos(a), ry: a } };
  return { live, own, foot, canPlace, setPos, valid, rotate, remove, layout, autoPlace, setImg, restore, findIn, pose, update, reserved };
}